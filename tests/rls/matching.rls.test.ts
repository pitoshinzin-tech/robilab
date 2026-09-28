import { describe, it, expect, afterAll } from "vitest";
import { admin, makeUser, cleanup, birthdateYearsAgo, errorCode } from "./helpers";

afterAll(cleanup);

describe("jst_day_start", () => {
  it("resets at 00:00 JST, not UTC", async () => {
    // 2026-10-01 15:30 UTC = 2026-10-02 00:30 JST → その日の始まりは 2026-10-01 15:00 UTC
    const { data } = await admin.rpc("jst_day_start", { p_ts: "2026-10-01T15:30:00Z" });
    expect(new Date(data as string).toISOString()).toBe("2026-10-01T15:00:00.000Z");
    const { data: before } = await admin.rpc("jst_day_start", { p_ts: "2026-10-01T14:59:00Z" });
    expect(new Date(before as string).toISOString()).toBe("2026-09-30T15:00:00.000Z");
  });
});

describe("age", () => {
  it("allows registration on the 18th birthday and rejects the day before", async () => {
    await expect(makeUser({ birthdate: birthdateYearsAgo(18) })).resolves.toBeDefined();
    await expect(makeUser({ birthdate: birthdateYearsAgo(18, 1) })).rejects.toThrow(/UNDER_AGE/);
  });
  it("blocks banned Discord accounts", async () => {
    await admin.from("banned_discord_ids").insert({ discord_user_id: "d-banned-test" });
    const { error } = await admin.rpc("_register_profile", {
      p_uid: (await admin.auth.admin.createUser({ email: `b-${crypto.randomUUID()}@example.test`, email_confirm: true })).data.user!.id,
      p_discord_id: "d-banned-test", p_discord_name: "x", p_birthdate: birthdateYearsAgo(30), p_nickname: "x",
      p_type_code: null, p_axes: null, p_games: [{ id: "valorant" }], p_platforms: [], p_voice_ok: false,
      p_time_slots: ["weekday-night"], p_bio: "",
    });
    expect(errorCode(error)).toBe("BANNED");
    await admin.from("banned_discord_ids").delete().eq("discord_user_id", "d-banned-test");
  });
});

describe("privacy", () => {
  it("cannot read another user's private info or profile row directly", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const { data: pi } = await a.client.from("private_info").select("*").eq("user_id", b.id);
    expect(pi).toEqual([]);
    const { data: pr } = await a.client.from("profiles").select("*").eq("id", b.id);
    expect(pr).toEqual([]);
    const { data: own } = await a.client.from("private_info").select("user_id");
    expect(own).toEqual([{ user_id: a.id }]);
  });
  it("cannot call the internal register function", async () => {
    const a = await makeUser();
    const { error } = await a.client.rpc("_register_profile", {
      p_uid: a.id, p_discord_id: "x", p_discord_name: "x", p_birthdate: "2000-01-01", p_nickname: "x",
      p_type_code: null, p_axes: null, p_games: [{ id: "valorant" }], p_platforms: [], p_voice_ok: false,
      p_time_slots: ["weekday-night"], p_bio: "",
    });
    expect(error).not.toBeNull();
  });
});

describe("approaches", () => {
  it("reveals Discord name only after mutual OK", async () => {
    const a = await makeUser();
    const b = await makeUser();
    expect((await a.client.rpc("send_approach", { p_to: b.id })).data).toBe("sent");
    const beforeA = (await a.client.rpc("my_inbox")).data as { kind: string; discord_username: string | null }[];
    expect(beforeA.every((r) => r.discord_username === null)).toBe(true);
    const received = ((await b.client.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client.rpc("respond_approach", { p_id: received.approach_id, p_accept: true });
    const afterA = (await a.client.rpc("my_inbox")).data as { kind: string; discord_username: string | null }[];
    expect(afterA.find((r) => r.kind === "matched")?.discord_username).toMatch(/^name-/);
  });

  it("double-clicking send creates one approach only", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const [r1, r2] = await Promise.all([a.client.rpc("send_approach", { p_to: b.id }), a.client.rpc("send_approach", { p_to: b.id })]);
    const codes = [r1.data ?? errorCode(r1.error), r2.data ?? errorCode(r2.error)].sort();
    expect(codes).toEqual(["ALREADY_PENDING", "sent"]);
    const { count } = await admin.from("approaches").select("*", { count: "exact", head: true }).eq("from_id", a.id);
    expect(count).toBe(1);
  });

  it("limits to 10 approaches per JST day", async () => {
    const a = await makeUser();
    const targets = await Promise.all(Array.from({ length: 11 }, () => makeUser()));
    for (let i = 0; i < 10; i++) expect((await a.client.rpc("send_approach", { p_to: targets[i].id })).data).toBe("sent");
    expect(errorCode((await a.client.rpc("send_approach", { p_to: targets[10].id })).error)).toBe("DAILY_LIMIT");
  });

  it("auto-matches when the other side already asked", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client.rpc("send_approach", { p_to: b.id });
    expect((await b.client.rpc("send_approach", { p_to: a.id })).data).toBe("matched");
  });

  it("does not tell the sender about a pass", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client.rpc("send_approach", { p_to: b.id });
    const received = ((await b.client.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client.rpc("respond_approach", { p_id: received.approach_id, p_accept: false });
    const sent = ((await a.client.rpc("my_inbox")).data as { kind: string; status: string }[]).find((r) => r.kind === "sent")!;
    expect(sent.status).toBe("pending");
  });
});

describe("blocks and reports", () => {
  it("blocking removes the pending approach and prevents accepting it", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client.rpc("send_approach", { p_to: b.id });
    const received = ((await b.client.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client.rpc("block_user", { p_id: a.id });
    expect(((await b.client.rpc("my_inbox")).data as unknown[]).length).toBe(0);
    expect((await b.client.rpc("respond_approach", { p_id: received.approach_id, p_accept: true })).error).not.toBeNull();
    expect(((await a.client.rpc("lobby_candidates")).data as { id: string }[]).some((r) => r.id === b.id)).toBe(false);
  });

  it("a reported user is suspended, hidden, and cannot send", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const c = await makeUser();
    await a.client.rpc("report_user", { p_id: b.id, p_reason: "harassment", p_detail: "テスト" });
    expect(((await c.client.rpc("lobby_candidates")).data as { id: string }[]).some((r) => r.id === b.id)).toBe(false);
    expect(((await c.client.rpc("get_profile", { p_id: b.id })).data as unknown[]).length).toBe(0);
    expect(errorCode((await b.client.rpc("send_approach", { p_to: c.id })).error)).toBe("NOT_ACTIVE");
    expect(errorCode((await a.client.rpc("report_user", { p_id: b.id, p_reason: "spam", p_detail: "" })).error)).toBe("ALREADY_REPORTED");
  });
});

describe("lobby filters", () => {
  it("shows only people with a shared game and time slot", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const other = await makeUser({ register: false });
    await admin.rpc("_register_profile", {
      p_uid: other.id, p_discord_id: `d-${other.id}`, p_discord_name: "o", p_birthdate: birthdateYearsAgo(25), p_nickname: "別ゲー",
      p_type_code: null, p_axes: null, p_games: [{ id: "sf6" }], p_platforms: [], p_voice_ok: false, p_time_slots: ["weekday-night"], p_bio: "",
    });
    const ids = ((await a.client.rpc("lobby_candidates")).data as { id: string }[]).map((r) => r.id);
    expect(ids).toContain(b.id);
    expect(ids).not.toContain(other.id);
    expect(ids).not.toContain(a.id);
  });
});

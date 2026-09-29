import { describe, it, expect, afterAll } from "vitest";
import { admin, makeUser, cleanup, birthdateYearsAgo, errorCode, trackForCleanup } from "./helpers";

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
    await expect(makeUser({ birthdate: birthdateYearsAgo(18), signIn: false })).resolves.toBeDefined();
    await expect(makeUser({ birthdate: birthdateYearsAgo(18, 1), signIn: false })).rejects.toThrow(/UNDER_AGE/);
  });
  it("blocks banned Discord accounts", async () => {
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email: `b-${crypto.randomUUID()}@example.test`, email_confirm: true,
    });
    if (createError) throw createError;
    trackForCleanup(userData.user!.id);
    await admin.from("banned_discord_ids").insert({ discord_user_id: "d-banned-test" });
    try {
      const { error } = await admin.rpc("_register_profile", {
        p_uid: userData.user!.id,
        p_discord_id: "d-banned-test", p_discord_name: "x", p_birthdate: birthdateYearsAgo(30), p_nickname: "x",
        p_type_code: null, p_axes: null, p_games: [{ id: "valorant" }], p_platforms: [], p_voice_ok: false,
        p_time_slots: ["weekday-night"], p_bio: "",
      });
      expect(errorCode(error)).toBe("BANNED");
    } finally {
      await admin.from("banned_discord_ids").delete().eq("discord_user_id", "d-banned-test");
    }
  });
});

describe("privacy", () => {
  it("cannot read another user's private info or profile row directly", async () => {
    const a = await makeUser();
    const b = await makeUser({ signIn: false });
    const { data: pi } = await a.client!.from("private_info").select("*").eq("user_id", b.id);
    expect(pi).toEqual([]);
    const { data: pr } = await a.client!.from("profiles").select("*").eq("id", b.id);
    expect(pr).toEqual([]);
    const { data: own } = await a.client!.from("private_info").select("user_id");
    expect(own).toEqual([{ user_id: a.id }]);
  });
  it("cannot call the internal register function", async () => {
    const a = await makeUser();
    const { error } = await a.client!.rpc("_register_profile", {
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
    expect((await a.client!.rpc("send_approach", { p_to: b.id })).data).toBe("sent");
    type Row = { kind: string; discord_username: string | null; discord_user_id: string | null };
    const beforeA = (await a.client!.rpc("my_inbox")).data as Row[];
    expect(beforeA.every((r) => r.discord_username === null && r.discord_user_id === null)).toBe(true);
    const beforeB = (await b.client!.rpc("my_inbox")).data as Row[];
    expect(beforeB.every((r) => r.discord_username === null && r.discord_user_id === null)).toBe(true);
    const received = ((await b.client!.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client!.rpc("respond_approach", { p_id: received.approach_id, p_accept: true });
    const matchedA = ((await a.client!.rpc("my_inbox")).data as Row[]).find((r) => r.kind === "matched");
    expect(matchedA?.discord_username).toMatch(/^name-/);
    expect(matchedA?.discord_user_id).toBe(`d-${b.id}`);
  });

  it("double-clicking send creates one approach only", async () => {
    const a = await makeUser();
    const b = await makeUser({ signIn: false });
    const [r1, r2] = await Promise.all([a.client!.rpc("send_approach", { p_to: b.id }), a.client!.rpc("send_approach", { p_to: b.id })]);
    const codes = [r1.data ?? errorCode(r1.error), r2.data ?? errorCode(r2.error)].sort();
    expect(codes).toEqual(["ALREADY_PENDING", "sent"]);
    const { count } = await admin.from("approaches").select("*", { count: "exact", head: true }).eq("from_id", a.id);
    expect(count).toBe(1);
  });

  it("limits to 10 approaches per JST day", async () => {
    const a = await makeUser();
    const targets = await Promise.all(Array.from({ length: 11 }, () => makeUser({ signIn: false })));
    for (let i = 0; i < 10; i++) expect((await a.client!.rpc("send_approach", { p_to: targets[i].id })).data).toBe("sent");
    expect(errorCode((await a.client!.rpc("send_approach", { p_to: targets[10].id })).error)).toBe("DAILY_LIMIT");
  });

  it("auto-matches when the other side already asked", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client!.rpc("send_approach", { p_to: b.id });
    expect((await b.client!.rpc("send_approach", { p_to: a.id })).data).toBe("matched");
  });

  it("does not tell the sender about a pass", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client!.rpc("send_approach", { p_to: b.id });
    const received = ((await b.client!.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client!.rpc("respond_approach", { p_id: received.approach_id, p_accept: false });
    const sent = ((await a.client!.rpc("my_inbox")).data as { kind: string; status: string }[]).find((r) => r.kind === "sent")!;
    expect(sent.status).toBe("pending");
  });

  it("resending after a pass is blocked (does not reveal the pass)", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client!.rpc("send_approach", { p_to: b.id });
    const received = ((await b.client!.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client!.rpc("respond_approach", { p_id: received.approach_id, p_accept: false });
    expect(errorCode((await a.client!.rpc("send_approach", { p_to: b.id })).error)).toBe("ALREADY_PENDING");
  });

  it("daily limit holds exactly at 10 under concurrent sends (advisory lock)", async () => {
    const a = await makeUser();
    const nineTargets = await Promise.all(Array.from({ length: 9 }, () => makeUser({ signIn: false })));
    for (const t of nineTargets) expect((await a.client!.rpc("send_approach", { p_to: t.id })).data).toBe("sent");
    const fiveMore = await Promise.all(Array.from({ length: 5 }, () => makeUser({ signIn: false })));
    const results = await Promise.all(fiveMore.map((t) => a.client!.rpc("send_approach", { p_to: t.id })));
    const sentCount = results.filter((r) => r.data === "sent").length;
    const limitCount = results.filter((r) => errorCode(r.error) === "DAILY_LIMIT").length;
    expect(sentCount).toBe(1);
    expect(limitCount).toBe(4);
    const { count } = await admin.from("approaches").select("*", { count: "exact", head: true }).eq("from_id", a.id);
    expect(count).toBe(10);
  });
});

describe("blocks and reports", () => {
  it("blocking removes the pending approach and prevents accepting it", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await a.client!.rpc("send_approach", { p_to: b.id });
    const received = ((await b.client!.rpc("my_inbox")).data as { kind: string; approach_id: string }[]).find((r) => r.kind === "received")!;
    await b.client!.rpc("block_user", { p_id: a.id });
    expect(((await b.client!.rpc("my_inbox")).data as unknown[]).length).toBe(0);
    expect((await b.client!.rpc("respond_approach", { p_id: received.approach_id, p_accept: true })).error).not.toBeNull();
    expect(((await a.client!.rpc("lobby_candidates")).data as { id: string }[]).some((r) => r.id === b.id)).toBe(false);
  });

  it("a reported user is suspended, hidden, and cannot send", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const c = await makeUser();
    await a.client!.rpc("report_user", { p_id: b.id, p_reason: "harassment", p_detail: "テスト" });
    expect(((await c.client!.rpc("lobby_candidates")).data as { id: string }[]).some((r) => r.id === b.id)).toBe(false);
    expect(((await c.client!.rpc("get_profile", { p_id: b.id })).data as unknown[]).length).toBe(0);
    expect(errorCode((await b.client!.rpc("send_approach", { p_to: c.id })).error)).toBe("NOT_ACTIVE");
    expect(errorCode((await a.client!.rpc("report_user", { p_id: b.id, p_reason: "spam", p_detail: "" })).error)).toBe("ALREADY_REPORTED");
  });
});

describe("lobby filters", () => {
  it("shows only people with a shared game and time slot", async () => {
    const a = await makeUser();
    const b = await makeUser({ signIn: false });
    const other = await makeUser({ register: false, signIn: false });
    await admin.rpc("_register_profile", {
      p_uid: other.id, p_discord_id: `d-${other.id}`, p_discord_name: "o", p_birthdate: birthdateYearsAgo(25), p_nickname: "別ゲー",
      p_type_code: null, p_axes: null, p_games: [{ id: "sf6" }], p_platforms: [], p_voice_ok: false, p_time_slots: ["weekday-night"], p_bio: "",
    });
    const ids = ((await a.client!.rpc("lobby_candidates")).data as { id: string }[]).map((r) => r.id);
    expect(ids).toContain(b.id);
    expect(ids).not.toContain(other.id);
    expect(ids).not.toContain(a.id);
  });
});

describe("delete_me", () => {
  it("a suspended (reported) user cannot delete their own account, and the report keeps the discord id", async () => {
    const a = await makeUser();
    const b = await makeUser();
    expect((await a.client!.rpc("report_user", { p_id: b.id, p_reason: "harassment", p_detail: "" })).error).toBeNull();
    expect(errorCode((await b.client!.rpc("delete_me")).error)).toBe("NOT_ACTIVE");
    const { data: reportRow } = await admin
      .from("reports")
      .select("target_discord_id")
      .eq("reporter_id", a.id)
      .eq("target_id", b.id)
      .single();
    expect(reportRow?.target_discord_id).toMatch(/^d-/);
  });

  it("an active user with no open reports can delete their account, and a report they filed keeps the row with reporter_id NULL", async () => {
    const a = await makeUser();
    const b = await makeUser({ signIn: false });
    expect((await a.client!.rpc("report_user", { p_id: b.id, p_reason: "spam", p_detail: "" })).error).toBeNull();

    expect((await a.client!.rpc("delete_me")).error).toBeNull();

    const { data: profileRow } = await admin.from("profiles").select("id").eq("id", a.id).maybeSingle();
    expect(profileRow).toBeNull();
    const { data: privateInfoRow } = await admin.from("private_info").select("user_id").eq("user_id", a.id).maybeSingle();
    expect(privateInfoRow).toBeNull();

    const { data: reportRow } = await admin
      .from("reports")
      .select("reporter_id, target_id")
      .eq("target_id", b.id)
      .single();
    expect(reportRow?.reporter_id).toBeNull();
    expect(reportRow?.target_id).toBe(b.id);
  });
});

describe("re-registration after delete_me", () => {
  /** 退会した Discord ID の再登録待ち期間(7日)を過ぎたことにする */
  async function expireCooldown(discordId: string) {
    const { error } = await admin
      .from("left_discord_ids")
      .update({ left_at: new Date(Date.now() - 8 * 86400 * 1000).toISOString() })
      .eq("discord_user_id", discordId);
    expect(error).toBeNull();
  }

  it("the same Discord account cannot re-register within 7 days of leaving", async () => {
    const discordId = `d-rejoin-${crypto.randomUUID()}`;
    const a = await makeUser({ discordId });
    expect((await a.client!.rpc("delete_me")).error).toBeNull();
    await expect(makeUser({ discordId, signIn: false })).rejects.toThrow(/REJOIN_COOLDOWN/);
    await expireCooldown(discordId);
    await expect(makeUser({ discordId, signIn: false })).resolves.toBeTruthy();
    const { data } = await admin.from("left_discord_ids").select("discord_user_id").eq("discord_user_id", discordId).maybeSingle();
    expect(data).toBeNull();
  });

  it("the report limit and reporter attribution survive delete_me and re-registration", async () => {
    const discordId = `d-rejoin-${crypto.randomUUID()}`;
    const a = await makeUser({ discordId });
    const targets = await Promise.all(Array.from({ length: 6 }, () => makeUser({ signIn: false })));
    for (let i = 0; i < 5; i++) {
      expect((await a.client!.rpc("report_user", { p_id: targets[i].id, p_reason: "spam", p_detail: "" })).error).toBeNull();
    }
    expect((await a.client!.rpc("delete_me")).error).toBeNull();
    const { data: rows } = await admin.from("reports").select("reporter_id, reporter_discord_id").in("target_id", targets.slice(0, 5).map((t) => t.id));
    expect(rows).toHaveLength(5);
    expect(rows!.every((r) => r.reporter_id === null && r.reporter_discord_id === discordId)).toBe(true);

    await expireCooldown(discordId);
    const a2 = await makeUser({ discordId });
    expect(errorCode((await a2.client!.rpc("report_user", { p_id: targets[5].id, p_reason: "spam", p_detail: "" })).error)).toBe(
      "REPORT_LIMIT",
    );
  });

  it("a block against a user who leaves is restored when they re-register", async () => {
    const discordId = `d-rejoin-${crypto.randomUUID()}`;
    const a = await makeUser({ discordId });
    const victim = await makeUser();
    expect((await victim.client!.rpc("block_user", { p_id: a.id })).error).toBeNull();
    expect((await a.client!.rpc("delete_me")).error).toBeNull();

    await expireCooldown(discordId);
    const a2 = await makeUser({ discordId, signIn: false });
    const { data: block } = await admin.from("blocks").select("blocker_id").eq("blocker_id", victim.id).eq("blocked_id", a2.id).maybeSingle();
    expect(block?.blocker_id).toBe(victim.id);
    expect(((await victim.client!.rpc("get_profile", { p_id: a2.id })).data as unknown[]).length).toBe(0);
  });
});

describe("report abuse", () => {
  it("cannot report someone outside shared visibility with no approach history", async () => {
    const a = await makeUser();
    const b = await makeUser({ signIn: false });
    await a.client!.rpc("block_user", { p_id: b.id });
    expect(errorCode((await a.client!.rpc("report_user", { p_id: b.id, p_reason: "spam", p_detail: "" })).error)).toBe("NOT_FOUND");
  });

  it("limits reports to 5 per JST day", async () => {
    const a = await makeUser();
    const targets = await Promise.all(Array.from({ length: 6 }, () => makeUser({ signIn: false })));
    for (let i = 0; i < 5; i++) {
      expect((await a.client!.rpc("report_user", { p_id: targets[i].id, p_reason: "spam", p_detail: "" })).error).toBeNull();
    }
    expect(errorCode((await a.client!.rpc("report_user", { p_id: targets[5].id, p_reason: "spam", p_detail: "" })).error)).toBe(
      "REPORT_LIMIT",
    );
  });

  it("report limit holds exactly at 5 under concurrent reports (advisory lock)", async () => {
    const a = await makeUser();
    const fourTargets = await Promise.all(Array.from({ length: 4 }, () => makeUser({ signIn: false })));
    for (const t of fourTargets) {
      expect((await a.client!.rpc("report_user", { p_id: t.id, p_reason: "spam", p_detail: "" })).error).toBeNull();
    }
    const threeMore = await Promise.all(Array.from({ length: 3 }, () => makeUser({ signIn: false })));
    const results = await Promise.all(
      threeMore.map((t) => a.client!.rpc("report_user", { p_id: t.id, p_reason: "spam", p_detail: "" })),
    );
    const successCount = results.filter((r) => r.error === null).length;
    const limitCount = results.filter((r) => errorCode(r.error) === "REPORT_LIMIT").length;
    expect(successCount).toBe(1);
    expect(limitCount).toBe(2);
    const { count: suspendedCount } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in(
        "id",
        threeMore.map((t) => t.id),
      )
      .eq("status", "suspended");
    expect(suspendedCount).toBe(1);
  });
});

describe("input validation", () => {
  it("rejects a game id containing spaces or non-ascii text", async () => {
    const a = await makeUser({ register: false, signIn: false });
    const { error } = await admin.rpc("_register_profile", {
      p_uid: a.id, p_discord_id: `d-${a.id}`, p_discord_name: "x", p_birthdate: birthdateYearsAgo(25), p_nickname: "x",
      p_type_code: null, p_axes: null, p_games: [{ id: "ヴァロラント" }], p_platforms: [], p_voice_ok: false,
      p_time_slots: ["weekday-night"], p_bio: "",
    });
    expect(errorCode(error)).toBe("INVALID_INPUT");
  });

  it("rejects a game object missing an id", async () => {
    const a = await makeUser({ register: false, signIn: false });
    const { error } = await admin.rpc("_register_profile", {
      p_uid: a.id, p_discord_id: `d-${a.id}`, p_discord_name: "x", p_birthdate: birthdateYearsAgo(25), p_nickname: "x",
      p_type_code: null, p_axes: null, p_games: [{}], p_platforms: [], p_voice_ok: false,
      p_time_slots: ["weekday-night"], p_bio: "",
    });
    expect(errorCode(error)).toBe("INVALID_INPUT");
  });

  it("rejects a game object with keys other than id/rank", async () => {
    const a = await makeUser({ register: false, signIn: false });
    const { error } = await admin.rpc("_register_profile", {
      p_uid: a.id, p_discord_id: `d-${a.id}`, p_discord_name: "x", p_birthdate: birthdateYearsAgo(25), p_nickname: "x",
      p_type_code: null, p_axes: null, p_games: [{ id: "valorant", x: "abuse" }], p_platforms: [], p_voice_ok: false,
      p_time_slots: ["weekday-night"], p_bio: "",
    });
    expect(errorCode(error)).toBe("INVALID_INPUT");
  });
});

describe("private_info immutability", () => {
  it("cannot change birthdate after registration", async () => {
    const a = await makeUser({ signIn: false });
    const { error } = await admin.from("private_info").update({ birthdate: "2000-01-01" }).eq("user_id", a.id);
    expect(errorCode(error)).toBe("INVALID_INPUT");
  });
});

describe("diagnosis_results constraints", () => {
  it("rejects axes that are not a small json object", async () => {
    const { error: notObject } = await admin.from("diagnosis_results").insert({ type_code: "ARCH", axes: [1, 2, 3] });
    expect(notObject).not.toBeNull();
    const big = { pad: "x".repeat(1000) };
    const { error: tooBig } = await admin.from("diagnosis_results").insert({ type_code: "ARCH", axes: big });
    expect(tooBig).not.toBeNull();
  });
});

describe("hardening3", () => {
  const profile = (nickname: string, games: unknown = [{ id: "valorant" }]) => ({
    p_nickname: nickname, p_type_code: null, p_axes: null, p_games: games, p_platforms: ["pc"],
    p_voice_ok: false, p_time_slots: ["weekday-night"], p_bio: "",
  });

  it("rejects game ids that are not in the option list", async () => {
    const a = await makeUser();
    expect(errorCode((await a.client!.rpc("update_profile", profile("x", [{ id: "discord-gg-abc" }]))).error)).toBe("INVALID_INPUT");
    expect(errorCode((await a.client!.rpc("update_profile", profile("x", [{ id: "valorant", rank: "free-text" }]))).error)).toBe("INVALID_INPUT");
    expect(errorCode((await a.client!.rpc("update_profile", profile("x", [{ id: "valorant" }, { id: "valorant" }]))).error)).toBe("INVALID_INPUT");
    expect((await a.client!.rpc("update_profile", profile("x", [{ id: "apex", rank: "upper" }]))).error).toBeNull();
  });

  it("catches NG words split by spaces, symbols, or zero-width characters", async () => {
    const a = await makeUser();
    const zeroWidthSpace = String.fromCharCode(0x200b);
    for (const nick of ["d i s c o r d . g g", `line${zeroWidthSpace}交換`,"ｄｉｓｃｏｒｄ．ｇｇ", "id・交換"]) {
      expect(errorCode((await a.client!.rpc("update_profile", profile(nick))).error), nick).toBe("NG_WORD");
    }
    expect((await a.client!.rpc("update_profile", profile("オンラインで遊ぼう"))).error).toBeNull();
  });

  it("adding a Discord id to the ban list also bans the matching account", async () => {
    const a = await makeUser({ signIn: false });
    const { data: pi } = await admin.from("private_info").select("discord_user_id").eq("user_id", a.id).single();
    expect((await admin.from("banned_discord_ids").insert({ discord_user_id: pi!.discord_user_id })).error).toBeNull();
    try {
      const { data: p } = await admin.from("profiles").select("status").eq("id", a.id).single();
      expect(p?.status).toBe("banned");
    } finally {
      await admin.from("banned_discord_ids").delete().eq("discord_user_id", pi!.discord_user_id);
    }
  });

  it("simultaneous approaches in both directions end in a match", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const [ra, rb] = await Promise.all([a.client!.rpc("send_approach", { p_to: b.id }), b.client!.rpc("send_approach", { p_to: a.id })]);
    expect([ra.data, rb.data].sort()).toEqual(["matched", "sent"]);
  });

  it("accepts only the four diagnosis axes with values between -1 and 1", async () => {
    const a = await makeUser();
    const withAxes = (axes: unknown) => ({ ...profile("x"), p_axes: axes });
    const ok = { attack: 0.33, instinct: -1, team: 1, heat: 0 };
    expect((await a.client!.rpc("update_profile", withAxes(ok))).error).toBeNull();
    expect((await a.client!.rpc("update_profile", withAxes(null))).error).toBeNull();
    for (const bad of [{ ...ok, attack: 5 }, { ...ok, heat: "0.5" }, { attack: 0.3, instinct: 0.3, team: 0.3 }, { ...ok, extra: 0 }]) {
      expect(errorCode((await a.client!.rpc("update_profile", withAxes(bad))).error), JSON.stringify(bad)).toBe("INVALID_INPUT");
    }
  });
});

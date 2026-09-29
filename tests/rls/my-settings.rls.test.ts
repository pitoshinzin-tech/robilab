import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { admin, makeUser, cleanup, errorCode } from "./helpers";
import { emptyMySettings } from "@/lib/my-settings";

afterAll(cleanup);

const anon = () => createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
const sample = () => ({
  ...emptyMySettings(new Date("2026-10-01T00:00:00.000Z")),
  typeCode: "ARCH",
  dpi: 800,
  mainGame: "valorant",
  sens: { valorant: 0.35 },
  hand: { lengthCm: 18.5, widthCm: 9, grip: "claw" },
  devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "布パッド" }, keyboard: null, headset: null },
  favoriteGames: [{ id: "valorant" }],
  cardName: "ロビ太",
});

describe("my_settings", () => {
  it("saves your own settings, replaces updatedAt with server time, and nobody else can read them", async () => {
    const a = await makeUser({ register: false });
    const b = await makeUser({ register: false });
    const { data, error } = await a.client!.rpc("save_my_settings", { p_data: sample() });
    expect(error).toBeNull();
    expect((data as { updatedAt: string }).updatedAt).not.toBe("2026-10-01T00:00:00.000Z");
    expect((await a.client!.from("my_settings").select("user_id")).data).toHaveLength(1);
    expect((await b.client!.from("my_settings").select("user_id")).data).toHaveLength(0);
    expect((await anon().from("my_settings").select("user_id")).data ?? []).toHaveLength(0);
  });

  it("rejects out-of-range values, unknown keys, and NG words", async () => {
    const a = await makeUser({ register: false });
    const bad = [
      { ...sample(), dpi: 10 },
      { ...sample(), sens: { valorant: 99 } },
      { ...sample(), hand: { lengthCm: 40, widthCm: 9, grip: "claw" } },
      { ...sample(), favoriteGames: Array.from({ length: 7 }, (_, i) => ({ name: `g${i}` })) },
      { ...sample(), extra: true },
      { ...sample(), devices: { ...sample().devices, mouse: { name: " 空白 " } } },
      // 種類の違う値(オブジェクトの代わりに文字列や配列)でも、落ちずに INVALID_INPUT になる
      { ...sample(), devices: "mouse" },
      { ...sample(), devices: { ...sample().devices, mouse: "G PRO" } },
      { ...sample(), hand: [] },
      { ...sample(), sens: [0.35] },
      { ...sample(), favoriteGames: { id: "valorant" } },
      { ...sample(), axes: "ARCH" },
    ];
    for (const p of bad) expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: p })).error), JSON.stringify(p)).toBe("INVALID_INPUT");
    const ng = { ...sample(), cardName: "discord.gg/xx" };
    expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: ng })).error)).toBe("NG_WORD");
  });

  it("anonymous visitors cannot save", async () => {
    expect((await anon().rpc("save_my_settings", { p_data: sample() })).error).not.toBeNull();
  });

  it("public card returns only the whitelisted fields, and turning public off kills the old slug", async () => {
    const a = await makeUser({ register: false });
    expect(errorCode((await a.client!.rpc("set_card_public", { p_public: true })).error)).toBe("NOT_FOUND");
    await a.client!.rpc("save_my_settings", { p_data: sample() });
    const slug1 = (await a.client!.rpc("set_card_public", { p_public: true })).data as string;
    expect(slug1).toMatch(/^[A-Za-z0-9]{10}$/);
    const card = (await anon().rpc("get_public_card", { p_slug: slug1 })).data as Record<string, unknown>;
    expect(Object.keys(card).sort()).toEqual(["cardName", "devices", "dpi", "favoriteGames", "grip", "mainGame", "mainSens", "typeCode"]);
    expect(card.mainSens).toBe(0.35);
    expect(JSON.stringify(card)).not.toContain("lengthCm");
    await a.client!.rpc("set_card_public", { p_public: false });
    expect((await anon().rpc("get_public_card", { p_slug: slug1 })).data).toBeNull();
    const slug2 = (await a.client!.rpc("set_card_public", { p_public: true })).data as string;
    expect(slug2).not.toBe(slug1);
    expect((await anon().rpc("get_public_card", { p_slug: slug1 })).data).toBeNull();
    expect((await anon().rpc("get_public_card", { p_slug: "not a slug" })).data).toBeNull();
  });

  it("delete_my_settings and account deletion both remove the row", async () => {
    const a = await makeUser({ register: false });
    await a.client!.rpc("save_my_settings", { p_data: sample() });
    expect((await a.client!.rpc("delete_my_settings")).error).toBeNull();
    expect((await admin.from("my_settings").select("user_id").eq("user_id", a.id)).data).toHaveLength(0);
    await a.client!.rpc("save_my_settings", { p_data: sample() });
    expect((await a.client!.rpc("delete_me")).error).toBeNull();
    expect((await admin.from("my_settings").select("user_id").eq("user_id", a.id)).data).toHaveLength(0);
  });
});

describe("my_settings moderation", () => {
  async function publish(user: { client: ReturnType<typeof anon> | null }) {
    expect((await user.client!.rpc("save_my_settings", { p_data: sample() })).error).toBeNull();
    const { data, error } = await user.client!.rpc("set_card_public", { p_public: true });
    expect(error).toBeNull();
    return data as string;
  }

  it("a suspended lobby user cannot save or publish, and their public card disappears until reinstated", async () => {
    const a = await makeUser();
    const slug = await publish(a);
    await admin.from("profiles").update({ status: "suspended" }).eq("id", a.id);
    try {
      expect((await anon().rpc("get_public_card", { p_slug: slug })).data).toBeNull();
      expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: sample() })).error)).toBe("NOT_ACTIVE");
      expect(errorCode((await a.client!.rpc("set_card_public", { p_public: true })).error)).toBe("NOT_ACTIVE");
      // 公開をやめることと、設定を消すことはいつでもできる
      expect((await a.client!.rpc("set_card_public", { p_public: false })).error).toBeNull();
    } finally {
      await admin.from("profiles").update({ status: "active" }).eq("id", a.id);
    }
    const slug2 = (await a.client!.rpc("set_card_public", { p_public: true })).data as string;
    expect((await anon().rpc("get_public_card", { p_slug: slug2 })).data).not.toBeNull();
  });

  it("a banned Discord account cannot save or publish, and its card is hidden", async () => {
    const a = await makeUser();
    const slug = await publish(a);
    const { data: pi } = await admin.from("private_info").select("discord_user_id").eq("user_id", a.id).single();
    await admin.from("banned_discord_ids").insert({ discord_user_id: pi!.discord_user_id });
    try {
      expect((await anon().rpc("get_public_card", { p_slug: slug })).data).toBeNull();
      expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: sample() })).error)).toBe("BANNED");
    } finally {
      await admin.from("banned_discord_ids").delete().eq("discord_user_id", pi!.discord_user_id);
      await admin.from("profiles").update({ status: "active" }).eq("id", a.id);
    }
  });

  it("an operator card lock hides the card and blocks republishing, but saving still works", async () => {
    const a = await makeUser({ register: false });
    const slug = await publish(a);
    expect((await admin.from("my_settings").update({ card_locked: true, public_slug: null }).eq("user_id", a.id)).error).toBeNull();
    expect((await anon().rpc("get_public_card", { p_slug: slug })).data).toBeNull();
    expect(errorCode((await a.client!.rpc("set_card_public", { p_public: true })).error)).toBe("CARD_LOCKED");
    expect((await a.client!.rpc("save_my_settings", { p_data: sample() })).error).toBeNull();
    const { data: row } = await admin.from("my_settings").select("card_locked, public_slug").eq("user_id", a.id).single();
    expect(row).toEqual({ card_locked: true, public_slug: null });

    // 設定を消して保存し直しても、公開禁止の印は残る(監査 run-4 の 6.1)
    expect((await a.client!.rpc("delete_my_settings")).error).toBeNull();
    expect((await admin.from("my_settings").select("user_id").eq("user_id", a.id)).data).toHaveLength(0);
    expect((await a.client!.rpc("save_my_settings", { p_data: sample() })).error).toBeNull();
    const { data: again } = await admin.from("my_settings").select("card_locked, public_slug").eq("user_id", a.id).single();
    expect(again).toEqual({ card_locked: true, public_slug: null });
    expect(errorCode((await a.client!.rpc("set_card_public", { p_public: true })).error)).toBe("CARD_LOCKED");

    // 運営が印を外すと、card_locks の記録も消える
    expect((await admin.from("card_locks").select("user_id").eq("user_id", a.id)).data).toHaveLength(1);
    expect((await admin.from("my_settings").update({ card_locked: false }).eq("user_id", a.id)).error).toBeNull();
    expect((await admin.from("card_locks").select("user_id").eq("user_id", a.id)).data).toHaveLength(0);
    // 本人からは card_locks を読めない
    expect((await a.client!.from("card_locks").select("user_id")).error).not.toBeNull();
  });
});

describe("my_settings v2", () => {
  it("accepts v1 and stores it as v2 with the default crosshair", async () => {
    const a = await makeUser({ register: false });
    const { crosshair, ...rest } = sample();
    void crosshair;
    const { data, error } = await a.client!.rpc("save_my_settings", { p_data: { ...rest, version: 1 } });
    expect(error).toBeNull();
    expect((data as { version: number; crosshair: unknown }).version).toBe(2);
    expect((data as { crosshair: unknown }).crosshair).toEqual({ shape: "cross", color: "#39f3ff", length: 6, thickness: 2, gap: 3, outline: true });
  });
  it("rejects invalid crosshairs", async () => {
    const a = await makeUser({ register: false });
    for (const bad of [{ length: 21 }, { thickness: 1.5 }, { color: "red" }, { shape: "star" }, { shape: null }, { outline: "yes" }]) {
      const p = { ...sample(), crosshair: { ...sample().crosshair, ...bad } };
      expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: p })).error), JSON.stringify(bad)).toBe("INVALID_INPUT");
    }
  });
});

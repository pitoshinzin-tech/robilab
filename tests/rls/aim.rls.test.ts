import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { admin, makeUser, cleanup, errorCode } from "./helpers";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { emptyMySettings } from "@/lib/my-settings";

afterAll(cleanup);
const anon = () => createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
const today = () => jstDate(new Date());
const args = (over: Partial<Record<string, unknown>> = {}) => {
  const c = aimCharForDate(today());
  return { p_date: today(), p_char_id: c.id, p_accuracy: 90, p_time_ms: c.strokes.length * 2000, p_strokes: c.strokes.length, ...over };
};

describe("submit_aim_score", () => {
  it("computes the score on the server and keeps only the personal best", async () => {
    const a = await makeUser({ register: false });
    const first = (await a.client!.rpc("submit_aim_score", args())).data as number;
    expect(first).toBe(Math.round(0.9 * 10000 * Math.min(1, 1500 / 2000)));
    await admin.from("aim_scores").update({ submitted_at: new Date(Date.now() - 60_000).toISOString() }).eq("user_id", a.id);
    const worse = (await a.client!.rpc("submit_aim_score", args({ p_accuracy: 10 }))).data as number;
    expect(worse).toBe(first);
    const { data: row } = await admin.from("aim_scores").select("score, accuracy").eq("user_id", a.id).single();
    expect(row).toEqual({ score: first, accuracy: 90 });
  });

  it("rejects wrong date, wrong char, too fast, out-of-range values, and rapid resubmits", async () => {
    const a = await makeUser({ register: false });
    const c = aimCharForDate(today());
    expect(errorCode((await a.client!.rpc("submit_aim_score", args({ p_date: "2020-01-01" }))).error)).toBe("WRONG_DATE");
    expect(errorCode((await a.client!.rpc("submit_aim_score", args({ p_char_id: "u0000" }))).error)).toBe("WRONG_CHAR");
    expect(errorCode((await a.client!.rpc("submit_aim_score", args({ p_strokes: c.strokes.length + 1 }))).error)).toBe("WRONG_CHAR");
    expect(errorCode((await a.client!.rpc("submit_aim_score", args({ p_time_ms: c.strokes.length * 300 - 1 }))).error)).toBe("INVALID_INPUT");
    expect(errorCode((await a.client!.rpc("submit_aim_score", args({ p_accuracy: 101 }))).error)).toBe("INVALID_INPUT");
    expect((await a.client!.rpc("submit_aim_score", args())).error).toBeNull();
    expect(errorCode((await a.client!.rpc("submit_aim_score", args())).error)).toBe("TOO_FAST");
    expect((await anon().rpc("submit_aim_score", args())).error).not.toBeNull();
  });
});

describe("get_aim_ranking", () => {
  it("shows the card name or 名無しのゲーマー, never Discord info, and anon can read it", async () => {
    const named = await makeUser({ register: false });
    await named.client!.rpc("save_my_settings", { p_data: { ...emptyMySettings(), cardName: "ランカー" } });
    await named.client!.rpc("submit_aim_score", args({ p_accuracy: 100, p_time_ms: aimCharForDate(today()).strokes.length * 1500 }));
    const plain = await makeUser({ register: false });
    await plain.client!.rpc("submit_aim_score", args({ p_accuracy: 99 }));
    const { data } = await anon().rpc("get_aim_ranking", { p_date: today() });
    const rows = data as { rank: number; name: string; score: number }[];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.map((r) => r.name)).toContain("ランカー");
    expect(rows.map((r) => r.name)).toContain("名無しのゲーマー");
    expect(Object.keys(rows[0]).sort()).toEqual(["accuracy", "name", "rank", "score", "time_ms"]);
    const me = (await plain.client!.rpc("my_aim_rank", { p_date: today() })).data as { rank: number }[];
    expect(me).toHaveLength(1);
  });

  it("hides suspended and banned users", async () => {
    const a = await makeUser();
    const uniqueName = `停止${a.id.slice(0, 6)}`;
    await a.client!.rpc("save_my_settings", { p_data: { ...emptyMySettings(), cardName: uniqueName } });
    await a.client!.rpc("submit_aim_score", args({ p_accuracy: 100, p_time_ms: aimCharForDate(today()).strokes.length * 1500 }));
    const before = (await anon().rpc("get_aim_ranking", { p_date: today() })).data as { name: string }[];
    expect(before.map((r) => r.name)).toContain(uniqueName);
    await admin.from("profiles").update({ status: "suspended" }).eq("id", a.id);
    try {
      const after = (await anon().rpc("get_aim_ranking", { p_date: today() })).data as { name: string }[];
      expect(after.map((r) => r.name)).not.toContain(uniqueName);
      expect(errorCode((await a.client!.rpc("submit_aim_score", args())).error)).toBe("NOT_ACTIVE");
    } finally {
      await admin.from("profiles").update({ status: "active" }).eq("id", a.id);
    }
  });
});

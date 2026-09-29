import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GAMES } from "@/data/games";
import { TIME_SLOTS, PLATFORMS, RANK_BANDS } from "@/data/lobby-options";

// DB の _validate_profile_input は、画面の選択肢と同じ ID の一覧で入力を検証している。
// 選択肢を増やしたら、新しい migration で _validate_profile_input の一覧も更新すること。
const dir = join(process.cwd(), "supabase", "migrations");
const latest = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .filter((sql) => /function public\._validate_profile_input/.test(sql))
  .at(-1)!;

function sqlArray(name: string): string[] {
  const m = latest.match(new RegExp(String.raw`${name} text\[\] := array\[([^\]]*)\]`));
  if (!m) throw new Error(`${name} not found in the latest _validate_profile_input`);
  return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).sort();
}
const ids = (list: { id: string }[]) => list.map((x) => x.id).sort();

describe("lobby options vs DB allowlists", () => {
  it("games", () => expect(sqlArray("v_games")).toEqual(ids(GAMES)));
  it("rank bands", () => expect(sqlArray("v_ranks")).toEqual(ids(RANK_BANDS)));
  it("time slots", () => expect(sqlArray("v_slots")).toEqual(ids(TIME_SLOTS)));
  it("platforms", () => expect(sqlArray("v_platforms")).toEqual(ids(PLATFORMS)));
});

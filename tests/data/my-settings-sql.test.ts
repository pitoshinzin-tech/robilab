import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MY_SETTINGS_LIMITS } from "@/lib/my-settings";
import { SENS_GAMES } from "@/data/sensitivity";

// save_my_settings の上限値は、画面側(src/lib/my-settings.ts)と同じでなければならない。
const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20261001001100_my_settings.sql"), "utf8");

function constant(name: string): number {
  const m = sql.match(new RegExp(String.raw`c_${name} numeric := (-?[0-9.]+);`));
  if (!m) throw new Error(`c_${name} not found`);
  return Number(m[1]);
}

describe("save_my_settings limits match the client", () => {
  it("numeric limits", () => {
    expect(constant("dpi_min")).toBe(MY_SETTINGS_LIMITS.dpiMin);
    expect(constant("dpi_max")).toBe(MY_SETTINGS_LIMITS.dpiMax);
    expect(constant("hand_length_min")).toBe(MY_SETTINGS_LIMITS.handLengthMin);
    expect(constant("hand_length_max")).toBe(MY_SETTINGS_LIMITS.handLengthMax);
    expect(constant("hand_width_min")).toBe(MY_SETTINGS_LIMITS.handWidthMin);
    expect(constant("hand_width_max")).toBe(MY_SETTINGS_LIMITS.handWidthMax);
    expect(constant("free_text_max")).toBe(MY_SETTINGS_LIMITS.freeTextMax);
    expect(constant("card_name_max")).toBe(MY_SETTINGS_LIMITS.cardNameMax);
    expect(constant("favorite_games_max")).toBe(MY_SETTINGS_LIMITS.favoriteGamesMax);
  });
  it("per-game sensitivity ranges", () => {
    const m = sql.match(/v_sens_games jsonb := '([^']+)';/);
    expect(m).not.toBeNull();
    const table = JSON.parse(m![1]) as Record<string, [number, number]>;
    expect(Object.keys(table).sort()).toEqual(SENS_GAMES.map((g) => g.id).sort());
    for (const g of SENS_GAMES) expect(table[g.id]).toEqual([g.min, g.max]);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AIM_CHARS, AIM_START_DATE } from "@/lib/aim/daily";

const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20261001001400_aim_daily.sql"), "utf8");

describe("aim_chars in SQL matches aim-chars.json", () => {
  it("same idx, id, glyph and stroke count", () => {
    const rows = [...sql.matchAll(/\((\d+), '(u[0-9a-f]+)', '(.)', (\d+)\)/gu)].map((m) => ({ idx: Number(m[1]), id: m[2], glyph: m[3], strokes: Number(m[4]) }));
    expect(rows).toEqual(AIM_CHARS.map((c, idx) => ({ idx, id: c.id, glyph: c.glyph, strokes: c.strokes.length })));
  });
  it("same start date", () => {
    expect(sql).toContain(`date '${AIM_START_DATE}'`);
  });
});

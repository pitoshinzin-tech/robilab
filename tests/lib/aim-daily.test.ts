import { describe, it, expect } from "vitest";
import { AIM_CHARS, jstDate, aimIndexForDate, aimCharForDate } from "@/lib/aim/daily";
import { parsePath } from "@/lib/aim/path";

describe("aim chars data", () => {
  it("has 60 unique chars with parsable strokes inside the 109 box", () => {
    expect(AIM_CHARS).toHaveLength(60);
    expect(new Set(AIM_CHARS.map((c) => c.id)).size).toBe(60);
    expect(new Set(AIM_CHARS.map((c) => c.glyph)).size).toBe(60);
    for (const c of AIM_CHARS) {
      expect(c.id).toBe(`u${c.glyph.codePointAt(0)!.toString(16)}`);
      for (const d of c.strokes) {
        const pts = parsePath(d);
        expect(pts.length).toBeGreaterThan(1);
        for (const p of pts) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(109);
        }
      }
    }
  });
  it("every char has 5 to 14 strokes", () => {
    for (const c of AIM_CHARS) {
      expect(c.strokes.length).toBeGreaterThanOrEqual(5);
      expect(c.strokes.length).toBeLessThanOrEqual(14);
    }
  });
  it("difficulty cycles easy(5-7) / medium(8-10) / hard(11-14) by idx % 3", () => {
    const ranges = [[5, 7], [8, 10], [11, 14]];
    AIM_CHARS.forEach((c, idx) => {
      const [min, max] = ranges[idx % 3];
      expect(c.strokes.length, c.glyph).toBeGreaterThanOrEqual(min);
      expect(c.strokes.length, c.glyph).toBeLessThanOrEqual(max);
    });
  });
});

describe("jstDate (JST boundary)", () => {
  it("switches at 00:00 JST, not UTC", () => {
    expect(jstDate(new Date("2026-11-01T14:59:59Z"))).toBe("2026-11-01");
    expect(jstDate(new Date("2026-11-01T15:00:00Z"))).toBe("2026-11-02");
  });
});

describe("aimIndexForDate", () => {
  it("starts at 0 on the start date, stays 0 before it, and wraps around", () => {
    expect(aimIndexForDate("2026-10-20", 60)).toBe(0);
    expect(aimIndexForDate("2026-11-01", 60)).toBe(0);
    expect(aimIndexForDate("2026-11-02", 60)).toBe(1);
    expect(aimIndexForDate("2026-12-31", 60)).toBe(0);
  });
  it("aimCharForDate returns the char at that index", () => {
    expect(aimCharForDate("2026-11-02").glyph).toBe(AIM_CHARS[1].glyph);
  });
});

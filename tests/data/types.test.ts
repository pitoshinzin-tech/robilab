import { describe, it, expect } from "vitest";
import { TYPES, ALL_TYPE_CODES, getType } from "@/data/types";
import { toTypeCode } from "@/lib/scoring";

describe("TYPES", () => {
  it("has exactly the 16 reachable codes", () => {
    const reachable = new Set<string>();
    for (let m = 0; m < 16; m++)
      reachable.add(toTypeCode({ attack: m & 1 ? 1 : -1, instinct: m & 2 ? 1 : -1, team: m & 4 ? 1 : -1, heat: m & 8 ? 1 : -1 }));
    expect(new Set(ALL_TYPE_CODES)).toEqual(reachable);
    expect(TYPES).toHaveLength(16);
  });
  it("has complete content for every type", () => {
    for (const t of TYPES) {
      expect(t.name).toMatch(/タイプ$/);
      expect(t.description.length).toBeGreaterThanOrEqual(100);
      expect(t.description.length).toBeLessThanOrEqual(180);
      expect(t.strengths).toHaveLength(3);
      expect(t.growth).toHaveLength(2);
      expect(getType(t.bestMatch)).toBeDefined();
      expect(getType(t.secondMatch)).toBeDefined();
      expect(t.bestMatch).not.toBe(t.code);
    }
  });
});

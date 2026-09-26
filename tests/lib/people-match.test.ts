import { describe, it, expect } from "vitest";
import { peopleScore } from "@/lib/people-match";
import type { Axes } from "@/data/axes";

const a = (attack: number, instinct: number, team: number, heat: number): Axes => ({ attack, instinct, team, heat });

describe("peopleScore", () => {
  it("rewards similar heat", () => {
    const base = a(0, 0, 0, 1);
    expect(peopleScore(base, a(0, 0, 0, 1)).score).toBeGreaterThan(peopleScore(base, a(0, 0, 0, -1)).score);
  });
  it("rewards complementary attack/guard", () => {
    const base = a(1, 0, 0, 0);
    expect(peopleScore(base, a(-1, 0, 0, 0)).score).toBeGreaterThan(peopleScore(base, a(1, 0, 0, 0)).score);
  });
  it("rewards complementary team/solo", () => {
    const base = a(0, 0, 1, 0);
    expect(peopleScore(base, a(0, 0, -1, 0)).score).toBeGreaterThan(peopleScore(base, a(0, 0, 1, 0)).score);
  });
  it("rewards a difference of 1 on instinct/strategy most", () => {
    const base = a(0, 0.5, 0, 0);
    const best = peopleScore(base, a(0, -0.5, 0, 0)).score; // 差 1
    expect(best).toBeGreaterThan(peopleScore(base, a(0, 0.5, 0, 0)).score); // 差 0
    expect(best).toBeGreaterThan(peopleScore(a(0, 1, 0, 0), a(0, -1, 0, 0)).score); // 差 2
  });
  it("is symmetric and within 0..100", () => {
    const u = a(0.3, -0.7, 1, 0.1);
    const v = a(-1, 0.3, -0.3, 0.6);
    expect(peopleScore(u, v).score).toBe(peopleScore(v, u).score);
    expect(peopleScore(u, v).score).toBeGreaterThanOrEqual(0);
    expect(peopleScore(u, v).score).toBeLessThanOrEqual(100);
  });
  it("is 100 for a perfect pair", () => {
    // 熱量同じ、攻守・チームは正反対、直感戦略の差が1
    expect(peopleScore(a(1, 0.5, 1, 0.3), a(-1, -0.5, -1, 0.3)).score).toBe(100);
  });
  it("returns up to two reasons", () => {
    const r = peopleScore(a(1, 0.5, 1, 0.3), a(-1, -0.5, -1, 0.3)).reasons;
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(2);
  });
});

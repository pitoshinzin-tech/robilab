import { describe, it, expect } from "vitest";
import { roleScore, rankGames } from "@/lib/role-match";
import { GAMES } from "@/data/games";
import type { Axes } from "@/data/axes";

const a = (attack: number, instinct: number, team: number, heat: number): Axes => ({ attack, instinct, team, heat });

describe("roleScore", () => {
  it("is 100 for identical values", () => {
    expect(roleScore(a(0.5, 0, 1, 0.5), a(0.5, 0, 1, 0.5))).toBe(100);
  });
  it("is 0 for opposite corners", () => {
    expect(roleScore(a(1, 1, 1, 1), a(-1, -1, -1, -1))).toBe(0);
  });
  it("matches a hand-computed value", () => {
    // d = sqrt(0.5^2 + 0 + 0 + 0) = 0.5 → 100 * (1 - 0.5/4) = 87.5 → 88
    expect(roleScore(a(1, 0, 1, 0.5), a(0.5, 0, 1, 0.5))).toBe(88);
  });
});

describe("rankGames", () => {
  it("returns every game sorted by best score", () => {
    const ranks = rankGames(a(1, 0.7, -0.5, 0.7));
    expect(ranks).toHaveLength(GAMES.length);
    for (let i = 1; i < ranks.length; i++) expect(ranks[i - 1].best.score).toBeGreaterThanOrEqual(ranks[i].best.score);
  });
  it("picks duelist for a duelist-like player in VALORANT", () => {
    const valo = rankGames(a(1, 0.7, -0.5, 0.7)).find((r) => r.game.id === "valorant")!;
    expect(valo.best.role.id).toBe("duelist");
    expect(valo.best.score).toBe(100);
  });
  it("sorts roles inside each game by score", () => {
    for (const r of rankGames(a(0, 0, 0, 0))) {
      for (let i = 1; i < r.roles.length; i++) expect(r.roles[i - 1].score).toBeGreaterThanOrEqual(r.roles[i].score);
    }
  });
});

import { describe, it, expect } from "vitest";
import { PROS, PRO_GAMES } from "@/data/pros";
import { getSensGame } from "@/data/sensitivity";
import { DEVICES } from "@/data/devices";

// まとめサイト・Wiki は出典にしない
const NOT_PRIMARY = /(^|\.)(prosettings\.net|prosettings\.com|liquipedia\.net|settings\.gg|specs\.gg|esportsettings\.com|wikipedia\.org|fandom\.com)$/;

describe("pros data", () => {
  it("has 0 or at least 5 pros per game (0 = 準備中)", () => {
    for (const g of PRO_GAMES) {
      const n = PROS.filter((p) => p.game === g).length;
      expect(n === 0 || n >= 5, `${g}: ${n}`).toBe(true);
    }
  });
  it.skipIf(PROS.length === 0)("publishes at least one full game once data exists", () => {
    expect(PRO_GAMES.some((g) => PROS.filter((p) => p.game === g).length >= 5)).toBe(true);
  });
  it("every pro game exists in SENS_GAMES", () => {
    for (const g of PRO_GAMES) expect(getSensGame(g), g).toBeDefined();
  });
  it("has unique ids that start with the game", () => {
    const ids = PROS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PROS) expect(p.id, p.id).toMatch(new RegExp(`^${p.game}-[a-z0-9-]+$`));
  });
  it("keeps dpi and sens in the game's input range", () => {
    for (const p of PROS) {
      const g = getSensGame(p.game)!;
      expect(Number.isInteger(p.dpi), p.id).toBe(true);
      expect(p.dpi, p.id).toBeGreaterThanOrEqual(50);
      expect(p.dpi, p.id).toBeLessThanOrEqual(64000);
      expect(p.sens, p.id).toBeGreaterThanOrEqual(g.min);
      expect(p.sens, p.id).toBeLessThanOrEqual(g.max);
    }
  });
  it("uses mouse ids from devices.ts, or a name when the mouse is not a candidate", () => {
    for (const p of PROS) {
      if (p.mouse !== null) {
        expect(DEVICES.find((d) => d.id === p.mouse && d.category === "mouse"), p.id).toBeDefined();
        expect(p.mouseName, p.id).toBeUndefined();
      }
      if (p.mouse === null && p.mouseName !== undefined) expect(p.mouseName.trim().length, p.id).toBeGreaterThan(0);
    }
  });
  it("cites an https primary source and a check date", () => {
    for (const p of PROS) {
      const u = new URL(p.sourceUrl);
      expect(u.protocol, p.id).toBe("https:");
      expect(u.hostname, p.id).not.toMatch(NOT_PRIMARY);
      expect(p.checkedAt, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.name.trim(), p.id).toBe(p.name);
      expect(p.name.length, p.id).toBeGreaterThan(0);
    }
  });
});

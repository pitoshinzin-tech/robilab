import { describe, it, expect } from "vitest";
import type { ProSetting } from "@/data/pros";
import { cm360, edpi } from "@/lib/sensitivity";
import { diffText, nearPros, proCm, proEdpi, sortPros, userCmFrom } from "@/lib/pro-match";
import { emptyMySettings } from "@/lib/my-settings";

const p = (id: string, game: ProSetting["game"], dpi: number, sens: number, name = id): ProSetting => ({
  id, name, team: null, game, dpi, sens, mouse: null, sourceUrl: "https://example.com/" + id, checkedAt: "2026-09-30",
});

describe("proCm / proEdpi", () => {
  it("uses the same formula as the sensitivity tool", () => {
    expect(proCm(p("v", "valorant", 800, 0.35))).toBe(cm360(800, 0.35, 0.07));
    expect(proCm(p("v", "valorant", 800, 0.35))).toBe(46.65);
    expect(proCm(p("a", "apex", 800, 1.2))).toBe(cm360(800, 1.2, 0.022));
    expect(proEdpi(p("v", "valorant", 800, 0.35))).toBe(edpi(800, 0.35));
  });
});

describe("diffText", () => {
  it("says ほぼ同じ within 0.5cm and signed differences otherwise", () => {
    expect(diffText(30.5, 30)).toBe("ほぼ同じ");
    expect(diffText(29.5, 30)).toBe("ほぼ同じ");
    expect(diffText(30.6, 30)).toBe("あなたより 0.6cm 長い");
    expect(diffText(27.9, 30)).toBe("あなたより 2.1cm 短い");
    expect(diffText(40, 30)).toBe("あなたより 10.0cm 長い");
  });
});

describe("nearPros", () => {
  // valorant 800/0.35 → 46.65cm、800/0.5 → 32.66cm、apex 800/1.0 → 51.95cm、cs2 800/1.0 → 51.95cm
  const pros = [
    p("valorant-a", "valorant", 800, 0.35, "Alpha"),
    p("valorant-b", "valorant", 800, 0.5, "Bravo"),
    p("apex-c", "apex", 800, 1.0, "Charlie"),
    p("cs2-d", "cs2", 800, 1.0, "Delta"),
  ];
  it("puts the same game first, then the smallest difference", () => {
    const r = nearPros(50, "valorant", pros, 5);
    expect(r.map((x) => x.pro.id)).toEqual(["valorant-a", "valorant-b", "apex-c", "cs2-d"]);
    expect(r[0].cm).toBe(46.65);
    expect(r[0].diff).toBeCloseTo(3.35);
  });
  it("breaks ties by name", () => {
    expect(nearPros(50, "apex", pros, 5).map((x) => x.pro.id)).toEqual(["apex-c", "cs2-d", "valorant-a", "valorant-b"]);
    expect(nearPros(50, "cs2", pros, 5).map((x) => x.pro.id)).toEqual(["cs2-d", "apex-c", "valorant-a", "valorant-b"]);
  });
  it("ignores the same-game preference for games without pros", () => {
    expect(nearPros(50, "cod", pros, 2).map((x) => x.pro.id)).toEqual(["apex-c", "cs2-d"]);
    expect(nearPros(33, null, pros, 1).map((x) => x.pro.id)).toEqual(["valorant-b"]);
  });
  it("limits the number of results", () => {
    expect(nearPros(50, "valorant", pros, 3)).toHaveLength(3);
    expect(nearPros(50, "valorant", [], 3)).toEqual([]);
  });
});

describe("sortPros", () => {
  const list = [p("valorant-a", "valorant", 800, 0.35, "Alpha"), p("valorant-b", "valorant", 800, 0.5, "Bravo"), p("valorant-c", "valorant", 1600, 0.25, "Charlie")];
  it("sorts by cm ascending, descending, or name", () => {
    // Alpha 46.65 / Bravo 32.66 / Charlie 32.66(同じなら名前順)
    expect(sortPros(list, "cmAsc").map((x) => x.name)).toEqual(["Bravo", "Charlie", "Alpha"]);
    expect(sortPros(list, "cmDesc").map((x) => x.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(sortPros(list, "name").map((x) => x.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });
  it("does not change the input array", () => {
    const copy = [...list];
    sortPros(list, "cmDesc");
    expect(list).toEqual(copy);
  });
});

describe("userCmFrom", () => {
  it("needs the main game, its sens and dpi", () => {
    const s = { ...emptyMySettings(), mainGame: "valorant", dpi: 800, sens: { valorant: 0.35 } };
    expect(userCmFrom(s)).toEqual({ cm: 46.65, game: "valorant" });
    expect(userCmFrom({ ...s, dpi: null })).toBeNull();
    expect(userCmFrom({ ...s, sens: {} })).toBeNull();
    expect(userCmFrom({ ...s, mainGame: null })).toBeNull();
    expect(userCmFrom(null)).toBeNull();
  });
  it("works for games without pros too (CoD)", () => {
    const s = { ...emptyMySettings(), mainGame: "cod", dpi: 800, sens: { cod: 5 } };
    expect(userCmFrom(s)).toEqual({ cm: cm360(800, 5, 0.0066), game: "cod" });
  });
});

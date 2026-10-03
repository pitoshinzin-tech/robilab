import { describe, it, expect } from "vitest";
import { GROUP_LIMIT, LIST_LIMIT, limitPerGroup, limitRows, parseShowAll, shownNote, showAllText } from "@/lib/list-limit";

describe("parseShowAll(?all=1 だけ通す)", () => {
  it("決まった値 1 だけ true", () => {
    expect(parseShowAll({ all: "1" })).toBe(true);
    expect(parseShowAll({ all: ["1", "0"] })).toBe(true);
  });
  it.each([[{}], [{ all: "" }], [{ all: "true" }], [{ all: "0" }], [{ all: "01" }], [{ all: " 1" }], [{ all: ["0", "1"] }], [{ all: [] }], [{ all: "1".repeat(10000) }]])("%j は false", (sp) => {
    expect(parseShowAll(sp)).toBe(false);
  });
});

describe("limitRows(多いときだけ上位 12 件に切る)", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => i);
  it("上限は 12", () => expect(LIST_LIMIT).toBe(12));
  it("13 件以上は上位 12 件だけ(並びは変えない)", () => {
    const r = limitRows(rows(41), false);
    expect(r.shown).toEqual(rows(12));
    expect(r.total).toBe(41);
    expect(r.cut).toBe(true);
  });
  it("12 件以下は全部出して切らない", () => {
    expect(limitRows(rows(12), false)).toEqual({ shown: rows(12), total: 12, cut: false });
    expect(limitRows(rows(3), false)).toEqual({ shown: rows(3), total: 3, cut: false });
    expect(limitRows([], false)).toEqual({ shown: [], total: 0, cut: false });
  });
  it("すべて見る(?all=1)なら切らない", () => {
    expect(limitRows(rows(58), true)).toEqual({ shown: rows(58), total: 58, cut: false });
  });
  it("もとの配列は変えない", () => {
    const src = rows(20);
    limitRows(src, false);
    expect(src).toHaveLength(20);
  });
});

describe("表示の文", () => {
  it("見出しの近くの説明と、すべて見るのリンク", () => {
    expect(shownNote(12)).toBe("上位 12 件を表示中");
    expect(showAllText(41)).toBe("すべて見る(全 41 件)");
  });
});

describe("limitPerGroup(段ごとに上位 2 件。全体が多いときだけ)", () => {
  const g = (brand: string, n: number) => ({ brand, items: Array.from({ length: n }, (_, i) => `${brand}${i}`) });
  it("段ごとの上限は 2", () => expect(GROUP_LIMIT).toBe(2));
  it("全体が 12 件より多いと、各段の上位 2 件(段の並び・段の中の並びはそのまま)。total は段の全件", () => {
    const r = limitPerGroup([g("E", 21), g("C", 14), g("W", 1), g("A", 2)], false);
    expect(r.cut).toBe(true);
    expect(r.total).toBe(38);
    expect(r.groups).toEqual([
      { brand: "E", items: ["E0", "E1"], total: 21 },
      { brand: "C", items: ["C0", "C1"], total: 14 },
      { brand: "W", items: ["W0"], total: 1 },
      { brand: "A", items: ["A0", "A1"], total: 2 },
    ]);
  });
  it("全体が 12 件以下なら全部出して切らない", () => {
    const r = limitPerGroup([g("E", 8), g("C", 4)], false);
    expect(r.cut).toBe(false);
    expect(r.groups.map((x) => x.items.length)).toEqual([8, 4]);
  });
  it("どの段も 2 件以下なら切らない", () => {
    const groups = Array.from({ length: 7 }, (_, i) => g(`B${i}`, 2));
    expect(limitPerGroup(groups, false).cut).toBe(false);
  });
  it("すべて見る(?all=1)なら切らない", () => {
    const r = limitPerGroup([g("E", 21), g("C", 14)], true);
    expect(r.cut).toBe(false);
    expect(r.groups.map((x) => x.items.length)).toEqual([21, 14]);
  });
  it("空", () => expect(limitPerGroup([], false)).toEqual({ groups: [], total: 0, cut: false }));
});

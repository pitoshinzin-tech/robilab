import { describe, it, expect } from "vitest";
import { LIST_LIMIT, limitRows, parseShowAll, shownNote, showAllText } from "@/lib/list-limit";

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

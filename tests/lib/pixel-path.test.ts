import { describe, it, expect } from "vitest";
import { groupByFill, rectsToPath } from "@/lib/pixel-path";

describe("ドット絵のマスを path にまとめる", () => {
  it("マスごとに閉じた四角の部分パスになる", () => {
    expect(rectsToPath([{ x: 1, y: 2, w: 1, h: 1 }, { x: 3, y: 2, w: 2, h: 1 }])).toBe("M1 2h1v1h-1zM3 2h2v1h-2z");
  });
  it("空なら空の文字列", () => {
    expect(rectsToPath([])).toBe("");
  });
  it("色ごとに、最初に出てきた順でまとめる", () => {
    const cells = [
      { x: 0, y: 0, w: 1, h: 1, c: "a" },
      { x: 1, y: 0, w: 1, h: 1, c: "b" },
      { x: 2, y: 0, w: 1, h: 1, c: "a" },
    ];
    expect(groupByFill(cells, (c) => c.c)).toEqual([
      { fill: "a", d: "M0 0h1v1h-1zM2 0h1v1h-1z" },
      { fill: "b", d: "M1 0h1v1h-1z" },
    ]);
  });
});

import { describe, it, expect } from "vitest";
import { progressCells } from "@/lib/diagnosis-progress";

describe("progressCells", () => {
  it("1 問目は今のマスだけで、答えたマスはない", () => {
    const cells = progressCells(1, 12);
    expect(cells).toHaveLength(12);
    expect(cells[0]).toBe("now");
    expect(cells.slice(1).every((c) => c === "todo")).toBe(true);
  });
  it("答えた数だけ done、その次が now", () => {
    expect(progressCells(4, 6)).toEqual(["done", "done", "done", "now", "todo", "todo"]);
  });
  it("最後の問題は 11 個が done で最後が now", () => {
    const cells = progressCells(12, 12);
    expect(cells.filter((c) => c === "done")).toHaveLength(11);
    expect(cells[11]).toBe("now");
  });
  it("範囲の外の数は 1〜total にそろえる", () => {
    expect(progressCells(0, 3)).toEqual(["now", "todo", "todo"]);
    expect(progressCells(9, 3)).toEqual(["done", "done", "now"]);
  });
});

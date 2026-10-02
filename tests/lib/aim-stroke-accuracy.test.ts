import { describe, it, expect } from "vitest";
import { BAR_CELLS, barCells, worstStroke } from "@/lib/aim/stroke-accuracy";

describe("barCells(画ごとの正確さを 10 マスのバーに)", () => {
  it("10 マスで、% の分だけ塗る(四捨五入)", () => {
    expect(BAR_CELLS).toBe(10);
    expect(barCells(0)).toBe(0);
    expect(barCells(0.84)).toBe(8);
    expect(barCells(0.85)).toBe(9);
    expect(barCells(1)).toBe(10);
  });
  it("範囲の外・NaN は 0〜10 にそろえる", () => {
    expect(barCells(-0.2)).toBe(0);
    expect(barCells(1.5)).toBe(10);
    expect(barCells(Number.NaN)).toBe(0);
  });
});

describe("worstStroke(いちばんずれた画。示す意味がないときは -1)", () => {
  it("いちばん低い画の番号(同じなら先の画)", () => {
    expect(worstStroke([0.9, 0.6, 0.8])).toBe(1);
    expect(worstStroke([0.5, 0.9, 0.5])).toBe(0);
  });
  it("1 画だけ・全部同じ・空なら -1", () => {
    expect(worstStroke([0.7])).toBe(-1);
    expect(worstStroke([0.8, 0.8])).toBe(-1);
    expect(worstStroke([])).toBe(-1);
  });
});

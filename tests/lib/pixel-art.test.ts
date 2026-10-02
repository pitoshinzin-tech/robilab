import { describe, it, expect } from "vitest";
import { PIXEL_GRIDS, STAIR_TILE, pixelCells, pixelGridSvg, stairSvg, type PixelGrid } from "@/lib/pixel-art";

describe("ドット絵の格子(追補 7-1)", () => {
  it.each(PIXEL_GRIDS.map((g) => [g.id, g] as const))("%s は size × size で、# と . だけ", (_, g) => {
    expect(g.rows).toHaveLength(g.size);
    for (const r of g.rows) {
      expect(r).toHaveLength(g.size);
      expect(r).toMatch(/^[#.]+$/);
    }
  });
  it("大きさは 8 / 12 / 16 のどれかで、どの絵も 1 マス以上塗る", () => {
    for (const g of PIXEL_GRIDS) {
      expect([8, 12, 16]).toContain(g.size);
      expect(pixelCells(g).length).toBeGreaterThan(0);
    }
  });
  it("id が重ならない(Illustrator のファイル名とレイヤー名に使う)", () => {
    expect(new Set(PIXEL_GRIDS.map((g) => g.id)).size).toBe(PIXEL_GRIDS.length);
  });
  it("pixelCells は # の位置だけを、上の行から返す", () => {
    const g: PixelGrid = { id: "t", title: "t", size: 8, role: "highlight", rows: ["#.......", ".#......", "........", "........", "........", "........", "........", ".......#"] };
    expect(pixelCells(g)).toEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 7, y: 7 }]);
  });
  it("書き出しの SVG は viewBox が格子の大きさで、<g id> に名前が付く", () => {
    for (const g of PIXEL_GRIDS) {
      const svg = pixelGridSvg(g);
      expect(svg).toContain(`viewBox="0 0 ${g.size} ${g.size}"`);
      expect(svg).toContain(`<g id="${g.id}"`);
      expect(svg).toContain("<title>");
    }
  });
  it("階段の境目は高さ 24px で、8px の段", () => {
    expect(STAIR_TILE.height).toBe(24);
    expect(STAIR_TILE.width % 8).toBe(0);
    expect(stairSvg(2)).toContain(`viewBox="0 0 ${STAIR_TILE.width * 2} 24"`);
  });
  it("階段の上の形(点の格子を続ける所)も 8px の段で、1 枚の中に収まる", () => {
    const nums = STAIR_TILE.upper.match(/\d+/g)!.map(Number);
    for (const n of nums) {
      expect(n % 8).toBe(0);
      expect(n).toBeLessThanOrEqual(STAIR_TILE.width);
    }
  });
});

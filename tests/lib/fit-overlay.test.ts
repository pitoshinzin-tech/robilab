import { describe, it, expect } from "vitest";
import { HAND_WIDTH_RATIO, fitOverlay } from "@/lib/fit-overlay";

const inside = (b: { minX: number; minY: number; maxX: number; maxY: number }, x0: number, y0: number, x1: number, y1: number) =>
  x0 >= b.minX && y0 >= b.minY && x1 <= b.maxX && y1 <= b.maxY;

describe("fitOverlay(手とマウスを同じ縮尺で重ねる)", () => {
  it("手の長さ 17〜21cm・マウス 110〜135mm で、手もマウスも図の中に収まる(はみ出さない)", () => {
    for (const L of [17, 18, 19.5, 21]) for (const W of [null, 7.5, 9.5]) for (const ML of [110, 120, 135]) for (const MW of [55, 62, 70]) {
      const g = fitOverlay(L, W, ML, MW);
      expect(inside(g.bounds, g.handBox.left, g.handBox.top, g.handBox.right, g.handBox.bottom), `${L} ${W} ${ML} ${MW}`).toBe(true);
      expect(inside(g.bounds, g.mouse.x, g.mouse.y, g.mouse.x + g.mouse.width, g.mouse.y + g.mouse.height)).toBe(true);
      const [, , w, h] = g.viewBox.split(" ").map(Number);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    }
  });
  it("同じ縮尺(mm):手の高さは長さ × 10、マウスは長さ・幅そのまま", () => {
    const g = fitOverlay(18, 8, 120, 62);
    expect(g.handBox.bottom - g.handBox.top).toBeCloseTo(180);
    expect([g.mouse.width, g.mouse.height]).toEqual([62, 120]);
  });
  it("マウスは手首にそろえて、手の真ん中の下に置く", () => {
    const g = fitOverlay(18, 8, 120, 62);
    expect(g.mouse.y + g.mouse.height).toBe(0);
    expect(g.mouse.x + g.mouse.width / 2).toBe(0);
  });
  it("handTransform で絵の端(親指の左端・中指の先・手のひらの右・手首)を写すと handBox の端に重なる", () => {
    for (const [L, W] of [[17, null], [18, 8], [21, 9.5]] as const) {
      const g = fitOverlay(L, W, 120, 62);
      const m = /^translate\((\S+) (\S+)\) scale\((\S+) (\S+)\)$/.exec(g.handTransform);
      expect(m).not.toBeNull();
      const [tx, ty, sx, sy] = m!.slice(1).map(Number);
      const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.2);
      near(tx + 32 * sx, g.handBox.left);
      near(tx + 170 * sx, g.handBox.right);
      near(ty + 28 * sy, g.handBox.top);
      near(ty + 240 * sy, g.handBox.bottom);
    }
  });
  it("手の幅が分からないときは長さ × 0.45 で描く", () => {
    const known = fitOverlay(20, 20 * HAND_WIDTH_RATIO, 120, 62);
    const guessed = fitOverlay(20, null, 120, 62);
    expect(guessed.handBox).toEqual(known.handBox);
  });
});

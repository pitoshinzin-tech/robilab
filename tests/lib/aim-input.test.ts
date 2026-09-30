import { describe, it, expect } from "vitest";
import { createMoveFilter, filterMovement, pushTrailPoint } from "@/lib/aim/input";
import { AIM_TUNING } from "@/lib/aim/tuning";

function feed(deltas: [number, number][]) {
  const f = createMoveFilter();
  let sx = 0, sy = 0;
  for (const [dx, dy] of deltas) {
    const m = filterMovement(f, dx, dy);
    sx += m.dx;
    sy += m.dy;
  }
  return { f, sx, sy };
}
const steady = (n: number, d: number): [number, number][] => Array.from({ length: n }, () => [d, 0]);

describe("filterMovement(マウスの飛びを捨てる)", () => {
  it("ふつうの動きはそのまま通す", () => {
    const { f, sx, sy } = feed([...steady(20, 5), [3, -4], [0, 0]]);
    expect(sx).toBe(103);
    expect(sy).toBe(-4);
    expect(f.dropped).toBe(0);
  });
  it("1 回きりの巨大な動きは捨てる", () => {
    const { f, sx, sy } = feed([...steady(20, 5), [900, -700], ...steady(5, 5)]);
    expect(sx).toBe(125);
    expect(sy).toBe(0);
    expect(f.dropped).toBe(1);
  });
  it("大きい動きが 2 回続いたら本物の速い動きとして、両方とも足す", () => {
    const { f, sx } = feed([...steady(20, 5), [400, 0], [450, 0], [420, 0], ...steady(3, 5)]);
    expect(sx).toBe(100 + 400 + 450 + 420 + 15);
    expect(f.dropped).toBe(0);
  });
  it("minCounts 以下の動きは、中央値よりずっと大きくても捨てない", () => {
    const { f, sx } = feed([...steady(20, 2), [AIM_TUNING.outlierMinCounts, 0], ...steady(2, 2)]);
    expect(sx).toBe(40 + AIM_TUNING.outlierMinCounts + 4);
    expect(f.dropped).toBe(0);
  });
  it("速く動かしている間(中央値が大きい)は、その factor 倍までは捨てない", () => {
    const { f, sx } = feed([...steady(16, 60), [400, 0], ...steady(2, 60)]);
    expect(sx).toBe(16 * 60 + 400 + 120);
    expect(f.dropped).toBe(0);
  });
  it("動きの記録がないときも、1 回きりの巨大な動きは捨てる", () => {
    const { f, sx } = feed([[2000, 0], [3, 0]]);
    expect(sx).toBe(3);
    expect(f.dropped).toBe(1);
  });
  it("中央値は直近の outlierWindow 回ぶんで見る", () => {
    const f = createMoveFilter();
    for (let i = 0; i < 100; i++) filterMovement(f, 5, 0);
    expect(f.recent.length).toBe(AIM_TUNING.outlierWindow);
  });
});

describe("pushTrailPoint(軌跡の点を減らす)", () => {
  it("前の点に近すぎる点は足さない", () => {
    const seg: { x: number; y: number }[] = [];
    expect(pushTrailPoint(seg, { x: 0, y: 0 })).toBe(true);
    expect(pushTrailPoint(seg, { x: 0.1, y: 0 })).toBe(false);
    expect(pushTrailPoint(seg, { x: 0.5, y: 0 })).toBe(true);
    expect(seg).toHaveLength(2);
  });
  it("点が多くなりすぎたら古い点から消し、最新の点は残す", () => {
    const seg: { x: number; y: number }[] = [];
    for (let i = 0; i < 5000; i++) pushTrailPoint(seg, { x: i, y: 0 }, 0.3, 100);
    expect(seg.length).toBeLessThanOrEqual(100);
    expect(seg.at(-1)).toEqual({ x: 4999, y: 0 });
  });
  it("足した点は、渡した点のコピー(あとで書き換えられても変わらない)", () => {
    const seg: { x: number; y: number }[] = [];
    const p = { x: 1, y: 1 };
    pushTrailPoint(seg, p);
    p.x = 99;
    expect(seg[0].x).toBe(1);
  });
});

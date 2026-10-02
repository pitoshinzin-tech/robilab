import { describe, it, expect } from "vitest";
import { KANJI_BOX, TRACE_MAX_POINTS, appendPoint, pointsToPath, toViewBox, type TracePoint } from "@/lib/motion/hero-trace";

const rect = { left: 100, top: 50, width: 218, height: 218 };

describe("toViewBox(画面の座標 → 漢字の箱 0〜109)", () => {
  it("箱の角と真ん中", () => {
    expect(toViewBox(100, 50, rect)).toEqual({ x: 0, y: 0 });
    expect(toViewBox(318, 268, rect)).toEqual({ x: KANJI_BOX, y: KANJI_BOX });
    expect(toViewBox(209, 159, rect)).toEqual({ x: 54.5, y: 54.5 });
  });
  it("箱の外は端にそろえる", () => {
    expect(toViewBox(0, 999, rect)).toEqual({ x: 0, y: KANJI_BOX });
  });
  it("大きさ 0 の箱でも NaN にしない", () => {
    expect(toViewBox(5, 5, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe("appendPoint", () => {
  it("離れた点は足す", () => {
    expect(appendPoint([{ x: 0, y: 0 }], { x: 3, y: 4 })).toEqual([{ x: 0, y: 0 }, { x: 3, y: 4 }]);
  });
  it("近すぎる点は足さず、同じ配列を返す(描き直さない)", () => {
    const a: TracePoint[] = [{ x: 0, y: 0 }];
    expect(appendPoint(a, { x: 0.1, y: 0 })).toBe(a);
  });
  it(`${TRACE_MAX_POINTS} 点を超えて足さない`, () => {
    const full = Array.from({ length: TRACE_MAX_POINTS }, (_, i) => ({ x: i, y: 0 }));
    expect(appendPoint(full, { x: 999, y: 999 })).toBe(full);
  });
});

describe("pointsToPath", () => {
  it("M と L、小数 1 桁", () => {
    expect(pointsToPath([{ x: 1.23, y: 4 }, { x: 5, y: 6.78 }])).toBe("M1.2 4 L5 6.8");
  });
  it("空は空文字", () => {
    expect(pointsToPath([])).toBe("");
  });
});

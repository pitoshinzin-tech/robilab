import { describe, it, expect } from "vitest";
import { STROKE_GAP_MS, STROKE_TOTAL_MS, strokeSchedule, type StrokeSlot } from "@/lib/motion/stroke-schedule";

const end = (s: StrokeSlot[]) => Math.max(0, ...s.map((x) => x.delay + x.duration));

describe("strokeSchedule(S1 の書き順の時間割)", () => {
  it("合計は画数によらず 1,400ms 以内", () => {
    for (const n of [1, 5, 9, 14, 30]) {
      const s = strokeSchedule(Array.from({ length: n }, (_, i) => 20 + i * 7));
      expect(s).toHaveLength(n);
      expect(end(s)).toBeLessThanOrEqual(STROKE_TOTAL_MS);
    }
  });
  it("書き順を守る(前の画が終わってから次の画)", () => {
    const s = strokeSchedule([40, 10, 30, 25]);
    for (let i = 1; i < s.length; i++) expect(s[i].delay).toBeGreaterThanOrEqual(s[i - 1].delay + s[i - 1].duration);
  });
  it("画数が少ないとき、画と画の間は 60ms", () => {
    const s = strokeSchedule([10, 10, 10]);
    expect(s[1].delay - (s[0].delay + s[0].duration)).toBeCloseTo(STROKE_GAP_MS);
  });
  it("画数が多いと間を縮め、間の合計は全体の 4 割まで", () => {
    const s = strokeSchedule(Array.from({ length: 14 }, () => 30));
    const gaps = s.slice(1).reduce((sum, x, i) => sum + (x.delay - (s[i].delay + s[i].duration)), 0);
    expect(gaps).toBeLessThanOrEqual(STROKE_TOTAL_MS * 0.4 + 1);
  });
  it("長さに比例して時間を配る", () => {
    const s = strokeSchedule([10, 30]);
    expect(s[1].duration / s[0].duration).toBeCloseTo(3);
  });
  it("空・長さ 0・NaN でも壊れない", () => {
    expect(strokeSchedule([])).toEqual([]);
    const s = strokeSchedule([0, Number.NaN, 0]);
    expect(s.every((x) => Number.isFinite(x.delay) && Number.isFinite(x.duration) && x.duration >= 0)).toBe(true);
    expect(end(s)).toBeLessThanOrEqual(STROKE_TOTAL_MS);
  });
});

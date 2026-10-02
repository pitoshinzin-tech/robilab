import { describe, it, expect } from "vitest";
import { buildChart, CHART_W, CHART_H, CHART_PAD } from "@/lib/aim/history-chart";

describe("buildChart", () => {
  it("maps 0 to the bottom and max to the top, first slot left and last slot right", () => {
    const g = buildChart([0, 10000], 10000);
    expect(g.lines).toEqual([`${CHART_PAD},${CHART_H - CHART_PAD} ${CHART_W - CHART_PAD},${CHART_PAD}`]);
    expect(g.today).toEqual({ x: CHART_W - CHART_PAD, y: CHART_PAD, index: 1 });
  });

  it("breaks the line on missing days and draws lone days as dots", () => {
    const g = buildChart([1, 2, null, 3, null, 4, 5], 10);
    expect(g.lines).toHaveLength(2);
    expect(g.dots.map((d) => d.index)).toEqual([3]);
    expect(g.today?.index).toBe(6);
  });

  it("has no today point when today is not played", () => {
    expect(buildChart([1, null], 10).today).toBeNull();
    expect(buildChart([null, null], 10)).toEqual({ lines: [], dots: [], gaps: [], today: null });
  });

  it("draws a single played day (only slot) as a dot", () => {
    const g = buildChart([null, null, 5], 10);
    expect(g.lines).toEqual([]);
    expect(g.dots.map((d) => d.index)).toEqual([2]);
  });

  it("clamps values outside 0..max into the frame", () => {
    const g = buildChart([-5, 20], 10);
    const ys = g.lines[0].split(" ").map((p) => Number(p.split(",")[1]));
    expect(ys).toEqual([CHART_H - CHART_PAD, CHART_PAD]);
  });

  it("keeps every point inside the frame for 30 full days", () => {
    const g = buildChart(Array.from({ length: 30 }, (_, i) => i * 400), 10000);
    expect(g.lines).toHaveLength(1);
    for (const p of g.lines[0].split(" ")) {
      const [x, y] = p.split(",").map(Number);
      expect(x).toBeGreaterThanOrEqual(CHART_PAD);
      expect(x).toBeLessThanOrEqual(CHART_W - CHART_PAD);
      expect(y).toBeGreaterThanOrEqual(CHART_PAD);
      expect(y).toBeLessThanOrEqual(CHART_H - CHART_PAD);
    }
  });

  it("does not bridge gaps unless asked", () => {
    expect(buildChart([1, 2, null, 3, null, 4, 5], 10).gaps).toEqual([]);
  });

  it("bridges missing days into one path with dashed gaps when bridge is on", () => {
    const g = buildChart([1, 2, null, 3, null, null, 4, 5], 10, { bridge: true });
    // 実線と点は bridge なしと同じ
    expect(g.lines).toHaveLength(2);
    expect(g.dots.map((d) => d.index)).toEqual([3]);
    // またぐ線は 2 本:2 日目 → 4 日目、4 日目 → 7 日目(遊んだ日だけを順につなぐ)
    const ends = g.gaps.map((s) => s.split(" ").map((p) => Number(p.split(",")[0])));
    const x = (i: number) => Math.round((CHART_PAD + (i * (CHART_W - 2 * CHART_PAD)) / 7) * 10) / 10;
    expect(ends).toEqual([[x(1), x(3)], [x(3), x(6)]]);
  });

  it("does not bridge leading or trailing missing days", () => {
    const g = buildChart([null, 1, 2, null], 10, { bridge: true });
    expect(g.gaps).toEqual([]);
    expect(g.lines).toHaveLength(1);
  });
});

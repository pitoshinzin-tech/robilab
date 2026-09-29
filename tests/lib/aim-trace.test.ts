import { describe, it, expect } from "vitest";
import { parsePath, toStroke } from "@/lib/aim/path";
import { initialTrace, stepTrace, traceResult, computeScore } from "@/lib/aim/trace";

const line = toStroke(parsePath("M10,50L100,50"));
const strokes = [line];

function run(points: { x: number; y: number }[], startAt = 1000, dt = 16) {
  let s = initialTrace();
  points.forEach((p, i) => (s = stepTrace(s, strokes, p, startAt + i * dt)));
  return s;
}
const along = (from: number, to: number, n: number, dy = 0) =>
  Array.from({ length: n + 1 }, (_, i) => ({ x: from + ((to - from) * i) / n, y: 50 + dy }));

describe("stepTrace", () => {
  it("does not start until the crosshair enters the start circle", () => {
    const s = run([{ x: 60, y: 50 }, { x: 40, y: 50 }]);
    expect(s.phase).toBe("await-start");
    expect(s.startedAt).toBeNull();
  });
  it("completes a stroke traced along the line with 100% accuracy", () => {
    const s = run(along(10, 100, 30));
    expect(s.phase).toBe("done");
    const r = traceResult(s)!;
    expect(r.accuracy).toBe(100);
    // 点は x = 10 + 3i。進み具合が 95%(x ≥ 95.5)に達するのは i = 29 のとき
    expect(r.timeMs).toBe(29 * 16);
  });
  it("shortcut: jumping from start to end does not complete the stroke", () => {
    const s = run([{ x: 10, y: 50 }, { x: 100, y: 50 }, { x: 100, y: 50 }]);
    expect(s.phase).toBe("tracing");
    expect(s.progress).toBe(0);
  });
  it("reverse: moving backwards does not add progress", () => {
    const s = run([...along(10, 50, 10), ...along(50, 10, 10)]);
    expect(s.progress).toBeCloseTo(40 / 90, 2);
  });
  it("frames outside the tolerance lower the accuracy but still progress only within it", () => {
    const s = run([...along(10, 55, 15), ...along(55, 100, 15, 10)]); // 後半は 10 ずれ(許容 6 の外)
    expect(s.phase).toBe("tracing");
  });
  it("multi-stroke: waits for the next start circle", () => {
    const two = [line, toStroke(parsePath("M10,80L100,80"))];
    let s = initialTrace();
    along(10, 100, 30).forEach((p, i) => (s = stepTrace(s, two, p, i * 16)));
    expect(s.stroke).toBe(1);
    expect(s.phase).toBe("await-start");
  });
});

describe("computeScore", () => {
  it("gives 10000 for 100% within par time and scales down when slower", () => {
    expect(computeScore(100, 1000, 1)).toBe(10000);
    expect(computeScore(100, 3000, 1)).toBe(5000);
    expect(computeScore(50, 1000, 1)).toBe(5000);
  });
});

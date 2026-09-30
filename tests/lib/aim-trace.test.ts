import { describe, it, expect } from "vitest";
import { parsePath, toStroke } from "@/lib/aim/path";
import { initialTrace, stepTrace, traceResult, computeScore, frameScore, EDGE, type TraceState } from "@/lib/aim/trace";

const line = toStroke(parsePath("M10,50L100,50"));
const strokes = [line];

function run(points: { x: number; y: number }[], startAt = 1000, dt = 16) {
  let s = initialTrace();
  points.forEach((p, i) => (s = stepTrace(s, strokes, p, startAt + i * dt, true)));
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
    const s = run([...along(10, 55, 15), ...along(55, 100, 15, 10)]); // 後半は 10 ずれ(EDGE の外)
    expect(s.phase).toBe("tracing");
    expect(s.frames).toBeGreaterThan(s.score);
  });
  it("multi-stroke: waits for the next start circle", () => {
    const two = [line, toStroke(parsePath("M10,80L100,80"))];
    let s = initialTrace();
    along(10, 100, 30).forEach((p, i) => (s = stepTrace(s, two, p, i * 16, true)));
    expect(s.stroke).toBe(1);
    expect(s.phase).toBe("await-start");
  });
  it("loitering on the line does not inflate accuracy", () => {
    // Run C: trace with some off-line frames (y=60, dist 10 > EDGE)
    const pointsC = [
      { x: 10, y: 50 }, // start
      ...along(10, 40, 10), // 11 points advancing along line
      ...along(40, 44, 4, 10), // 5 points off-line
      ...along(44, 100, 28) // 29 points back on line
    ];
    const sC = run(pointsC);
    expect(sC.phase).toBe("done");
    const rC = traceResult(sC)!;
    expect(rC.accuracy).toBeLessThan(100);

    // Run D: same as C but insert 60 neutral frames at start point {10,50}
    // immediately after the first start frame. These frames are within tolerance
    // (distance 0 from start point (10,50)) but do not advance (t stays 0).
    // With the fix, neutral frames are not counted, so accuracy should equal run C.
    // With old counting, D would have 60 extra in-tolerance frames → higher accuracy (regression).
    const pointsD = [
      { x: 10, y: 50 }, // start
      ...Array(60).fill({ x: 10, y: 50 }), // 60 neutral frames at start point: within tolerance, no progress
      ...along(10, 40, 10).slice(1), // skip first point to avoid re-entering
      ...along(40, 44, 4, 10),
      ...along(44, 100, 28)
    ];
    const sD = run(pointsD);
    expect(sD.phase).toBe("done");
    const rD = traceResult(sD)!;

    // Both should have same accuracy; old code would give D higher accuracy (regression)
    expect(rD.accuracy).toBe(rC.accuracy);
    expect(rD.accuracy).toBeLessThan(100);
  });
});

describe("computeScore", () => {
  it("gives 10000 for 100% within par time and scales down when slower", () => {
    expect(computeScore(100, 1000, 1)).toBe(10000);
    expect(computeScore(100, 3000, 1)).toBe(5000);
    expect(computeScore(50, 1000, 1)).toBe(5000);
  });
});

describe("stepTrace guard", () => {
  it("returns the state unchanged when the stroke index is past the end (the character changed)", () => {
    for (const phase of ["await-start", "tracing"] as const) {
      const s = { ...initialTrace(), stroke: 5, phase };
      expect(stepTrace(s, strokes, { x: 10, y: 50 }, 1000, true)).toBe(s);
    }
  });
});

describe("stepTrace pen (クリックしている間だけ書ける)", () => {
  type F = { x: number; y: number; down: boolean };
  const feed = (frames: F[], strokesIn = strokes, s0: TraceState = initialTrace()) => {
    let s = s0;
    frames.forEach((f, i) => (s = stepTrace(s, strokesIn, { x: f.x, y: f.y }, 1000 + i * 16, f.down)));
    return s;
  };
  const pts = (from: number, to: number, n: number, down: boolean, dy = 0): F[] =>
    along(from, to, n, dy).map((p) => ({ ...p, down }));

  it("筆を上げている間は、始点の丸の中でも画が始まらない", () => {
    const s = feed([{ x: 10, y: 50, down: false }, { x: 12, y: 50, down: false }]);
    expect(s.phase).toBe("await-start");
    expect(s.startedAt).toBeNull();
  });
  it("始点の丸の外で押しても何も起きず、丸の中で押しているときに始まる", () => {
    const outside = feed([{ x: 60, y: 50, down: true }]);
    expect(outside.phase).toBe("await-start");
    const inside = feed([{ x: 60, y: 50, down: true }, { x: 10, y: 50, down: true }]);
    expect(inside.phase).toBe("tracing");
    expect(inside.drawing).toBe(true);
  });
  it("筆を上げたフレームは進み具合も精度も変えない", () => {
    const mid = feed(pts(10, 40, 10, true));
    const lifted = feed(
      [...pts(40, 100, 20, false), ...pts(40, 100, 20, false, 20), { x: 5, y: 5, down: false }],
      strokes,
      mid,
    );
    expect(lifted.progress).toBe(mid.progress);
    expect(lifted.frames).toBe(mid.frames);
    expect(lifted.score).toBe(mid.score);
    expect(lifted.phase).toBe("tracing");
    expect(lifted.drawing).toBe(false);
  });
  it("止めた画は、進み具合の近くで押したときだけ続きから書ける", () => {
    const mid = feed([...pts(10, 40, 10, true), { x: 40, y: 50, down: false }]);
    // 先の方(進み具合より MAX_STEP 以上先)で押しても再開しない
    const far = feed([{ x: 90, y: 50, down: true }, { x: 95, y: 50, down: true }], strokes, mid);
    expect(far.drawing).toBe(false);
    expect(far.progress).toBe(mid.progress);
    expect(far.frames).toBe(mid.frames);
    // 線から離れたところで押しても再開しない
    const off = feed([{ x: 40, y: 70, down: true }], strokes, mid);
    expect(off.drawing).toBe(false);
    expect(off.frames).toBe(mid.frames);
    // 押したまま進み具合の近くに戻ると再開し、最後まで書ける
    const resumed = feed([{ x: 40, y: 70, down: true }, ...pts(40, 100, 20, true)], strokes, mid);
    expect(resumed.phase).toBe("done");
    expect(traceResult(resumed)!.accuracy).toBe(100);
  });
  it("画を書き終えたら、押したままでは次の画が始まらず、押し直しが要る", () => {
    const two = [line, toStroke(parsePath("M10,80L100,80"))];
    const first = feed(pts(10, 100, 30, true), two);
    expect(first.stroke).toBe(1);
    expect(first.needRelease).toBe(true);
    const held = feed([{ x: 10, y: 80, down: true }, { x: 11, y: 80, down: true }], two, first);
    expect(held.phase).toBe("await-start");
    const repressed = feed([{ x: 10, y: 80, down: false }, { x: 10, y: 80, down: true }], two, first);
    expect(repressed.phase).toBe("tracing");
    expect(repressed.stroke).toBe(1);
  });
  it("時間は最初の画を始めたときから数える(筆を上げていた時間も含む)", () => {
    const s = feed([
      { x: 10, y: 50, down: true },
      ...pts(10, 40, 10, true).slice(1),
      ...Array.from({ length: 10 }, () => ({ x: 40, y: 50, down: false })),
      ...pts(40, 100, 20, true),
    ]);
    expect(s.phase).toBe("done");
    expect(traceResult(s)!.timeMs).toBe(s.finishedAt! - s.startedAt!);
    expect(s.startedAt).toBe(1000);
  });
});

describe("graded accuracy (線の中心からの距離で点数が下がる)", () => {
  it("frameScore: 中心 1、EDGE の半分 0.5、EDGE で 0、外は 0", () => {
    expect(frameScore(0)).toBe(1);
    expect(frameScore(EDGE / 2)).toBeCloseTo(0.5, 10);
    expect(frameScore(EDGE)).toBe(0);
    expect(frameScore(EDGE + 1)).toBe(0);
  });
  it("EDGE は線の太さの半分(3)+ 余白 0.5", () => {
    expect(EDGE).toBe(3.5);
  });
  it("中心をなぞると 100%、EDGE の半分ずれてなぞると 50%", () => {
    expect(traceResult(run(along(10, 100, 30)))!.accuracy).toBe(100);
    const half = run(along(10, 100, 30, EDGE / 2));
    expect(half.phase).toBe("done");
    expect(traceResult(half)!.accuracy).toBeCloseTo(50, 5);
  });
  it("EDGE ちょうどでなぞると進むが 0%、EDGE の外では進まない", () => {
    const edge = run(along(10, 100, 30, EDGE));
    expect(edge.phase).toBe("done");
    expect(traceResult(edge)!.accuracy).toBe(0);
    const out = run(along(10, 100, 30, EDGE + 0.5));
    expect(out.phase).toBe("tracing");
    expect(out.progress).toBe(0);
    expect(out.frames).toBe(30); // 始めたフレームのあとの 30 フレームはすべて外れ(0 点)として数える
    expect(out.score).toBe(0);
  });
  it("画ごとの精度(perStroke)を平均する", () => {
    const two = [line, toStroke(parsePath("M10,80L100,80"))];
    let s = initialTrace();
    let i = 0;
    const step = (p: { x: number; y: number }, down: boolean) => (s = stepTrace(s, two, p, 1000 + 16 * i++, down));
    along(10, 100, 30).forEach((p) => step(p, true));
    step({ x: 10, y: 80 }, false);
    along(10, 100, 30, 30 + EDGE / 2).forEach((p) => step(p, true));
    expect(s.phase).toBe("done");
    expect(s.perStroke[0]).toBe(1);
    expect(s.perStroke[1]).toBeCloseTo(0.5, 5);
    expect(traceResult(s)!.accuracy).toBeCloseTo(75, 5);
  });
  it("線の上で止まっているフレームは数えない(ずれていても)", () => {
    const base = run(along(10, 40, 10, 1));
    const loiter = run([...along(10, 40, 10, 1), ...Array.from({ length: 30 }, () => ({ x: 40, y: 52 }))]);
    expect(loiter.frames).toBe(base.frames);
    expect(loiter.score).toBe(base.score);
  });
  it("筆を上げているフレームは、線の外でも数えない", () => {
    let s = run(along(10, 40, 10));
    const before = { frames: s.frames, score: s.score };
    for (let k = 0; k < 20; k++) s = stepTrace(s, strokes, { x: 40, y: 70 }, 2000 + k * 16, false);
    expect(s.frames).toBe(before.frames);
    expect(s.score).toBe(before.score);
  });
});

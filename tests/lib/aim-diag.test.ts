import { describe, it, expect } from "vitest";
import { addFpsSample, buildDiagReport, createFpsStats, DIAG_LOG_SIZE, fpsSummary, isNotable, pushRing, type DiagDecision, type DiagEntry } from "@/lib/aim/diag";

const move = (t: number, decision: DiagDecision = "passed"): DiagEntry => ({
  kind: "move", t, dx: 1, dy: 0, median: 1, limit: 15, decision, gapMs: 7, frameMs: 7, sinceChangeMs: 1000, change: "lock",
});

describe("isNotable(診断に残す目立つ動き)", () => {
  it("通した動きは、limit の半分を超えたときだけ残す", () => {
    expect(isNotable(7, 15, "passed")).toBe(false);
    expect(isNotable(7.5, 15, "passed")).toBe(false);
    expect(isNotable(8, 15, "passed")).toBe(true);
  });
  it("通した以外の判断(保留・捨てた・2 回で通した・直後で捨てた)は、小さくても残す", () => {
    for (const d of ["held", "dropped", "dropped-held", "pair-pass", "burst-pass", "settle-skip"] as const) {
      expect(isNotable(1, 15, d)).toBe(true);
    }
  });
  it("直後で捨てた動きでも、0 の動きは残さない", () => {
    expect(isNotable(0, 15, "settle-skip")).toBe(false);
  });
  it("limit が分からないとき(null)は、通した動きを残さない", () => {
    expect(isNotable(500, null, "passed")).toBe(false);
  });
});

describe("pushRing(直近の記録だけ残す)", () => {
  it("決めた数を超えたら古いものから消す", () => {
    const ring: number[] = [];
    for (let i = 0; i < 100; i++) pushRing(ring, i);
    expect(ring).toHaveLength(DIAG_LOG_SIZE);
    expect(ring[0]).toBe(100 - DIAG_LOG_SIZE);
    expect(ring.at(-1)).toBe(99);
  });
  it("数を指定できる", () => {
    const ring: number[] = [];
    for (let i = 0; i < 5; i++) pushRing(ring, i, 3);
    expect(ring).toEqual([2, 3, 4]);
  });
});

describe("fps の平均・最小", () => {
  it("サンプルがないときは null", () => {
    expect(fpsSummary(createFpsStats())).toEqual({ avg: null, min: null });
  });
  it("平均(整数に丸める)と最小を返す", () => {
    const s = createFpsStats();
    for (const x of [144, 143, 60, 144]) addFpsSample(s, x);
    expect(fpsSummary(s)).toEqual({ avg: 123, min: 60 });
  });
});

describe("buildDiagReport(コピーする診断)", () => {
  const base = {
    log: [move(10), { kind: "mark" as const, t: 12 }],
    marks: [12],
    lock: { unadjusted: false, firstFailure: "NotSupportedError", legacy: false },
    fps: { avg: 120, min: 58 },
    dropped: 2,
    settleSkipped: 3,
    degPerCount: 0.028,
    minCounts: 35.714285,
    env: { userAgent: "UA", devicePixelRatio: 1.25, screen: { width: 1920, height: 1080 }, viewport: { width: 1536, height: 864 } },
  };
  it("求められた項目を全部入れる", () => {
    const r = buildDiagReport(base);
    expect(r.userAgent).toBe("UA");
    expect(r.devicePixelRatio).toBe(1.25);
    expect(r.screen).toEqual({ width: 1920, height: 1080 });
    expect(r.degPerCount).toBe(0.028);
    expect(r.lock).toEqual({ unadjusted: false, firstFailure: "NotSupportedError", legacy: false });
    expect(r.fps).toEqual({ avg: 120, min: 58 });
    expect(r.dropped).toBe(2);
    expect(r.settleSkipped).toBe(3);
    expect(r.marks).toEqual([12]);
    expect(r.log).toHaveLength(2);
  });
  it("下限のカウントは小数 1 桁に丸める", () => {
    expect(buildDiagReport(base).minCounts).toBe(35.7);
  });
  it("JSON にできて、名前・ID などの項目を持たない", () => {
    const r = buildDiagReport(base);
    const json = JSON.stringify(r);
    expect(JSON.parse(json)).toEqual(r);
    for (const k of ["name", "id", "userId", "email", "displayName"]) expect(k in r).toBe(false);
  });
  it("渡した記録の配列をコピーする(あとで記録が増えても変わらない)", () => {
    const log = [move(1)];
    const r = buildDiagReport({ ...base, log });
    log.push(move(2));
    expect(r.log).toHaveLength(1);
  });
});

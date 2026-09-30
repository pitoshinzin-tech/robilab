import type { Point } from "./view";
import { closestOnStroke, type Stroke } from "./path";
import { AIM_TUNING } from "./tuning";

/** 線の中心からこの距離までが「線の上」(板の単位)。値は tuning.ts。 */
export const EDGE = AIM_TUNING.edge;
export const START_RADIUS = AIM_TUNING.startRadius;
export const RESUME_RADIUS = AIM_TUNING.resumeRadius;
export const COMPLETE = AIM_TUNING.complete;
export const MAX_STEP = AIM_TUNING.maxStep;
export const PAR_MS_PER_STROKE = 1500;

export type TraceState = {
  stroke: number;
  /** tracing は「今の画を書き始めた後」(筆を上げて止めている間も含む)。 */
  phase: "await-start" | "tracing" | "done";
  progress: number;
  /** 数えたフレームの点数(0〜1)の合計。 */
  score: number;
  /** 数えたフレームの数(進んだフレームと、外れたフレーム)。 */
  frames: number;
  perStroke: number[];
  startedAt: number | null;
  finishedAt: number | null;
  /** 筆が紙についていて、判定を進めているか。false の間は何も数えない。 */
  drawing: boolean;
  /** 画を書き終えた直後など、いったんクリックを離すまで筆を下ろさない。 */
  needRelease: boolean;
};

export function initialTrace(): TraceState {
  return {
    stroke: 0, phase: "await-start", progress: 0, score: 0, frames: 0, perStroke: [],
    startedAt: null, finishedAt: null, drawing: false, needRelease: false,
  };
}

/** 画を止めている(筆を上げた)とき、p から書き直しを始めてよいか(今の進み具合の近くにいるか)。 */
export function canResume(s: TraceState, st: Stroke, p: Point): boolean {
  const q = closestOnStroke(st, p);
  return q.dist <= RESUME_RADIUS && q.t - s.progress <= MAX_STEP;
}

/** 線の中心からの距離 d のフレームの点数。中心で 1、EDGE で 0、外は 0。 */
export function frameScore(d: number): number {
  return Math.max(0, Math.min(1, 1 - d / EDGE));
}

/**
 * 1フレームぶん進める。p はクロスヘアが指す板の点、penDown はクリック(左ボタン)を押しているか。
 * 筆を上げている間は進み具合も精度も変えない。画は始点の丸の中で筆を下ろすと始まり、
 * 途中で離したら、今の進み具合の近くで筆を下ろすと続きから書ける。画を書き終えたら、次はクリックを離してから。
 */
export function stepTrace(s: TraceState, strokes: Stroke[], p: Point, now: number, penDown: boolean): TraceState {
  if (s.phase === "done") return s;
  const st = strokes[s.stroke];
  if (!st) return s; // お題が変わって画の番号が範囲外になったときに落ちないように
  if (!penDown) {
    if (!s.drawing && !s.needRelease) return s;
    return { ...s, drawing: false, needRelease: false };
  }
  if (s.needRelease) return s;
  if (s.phase === "await-start") {
    const a = st.points[0];
    if (Math.hypot(p.x - a.x, p.y - a.y) > START_RADIUS) return s;
    return { ...s, phase: "tracing", drawing: true, progress: 0, score: 0, frames: 0, startedAt: s.startedAt ?? now };
  }
  if (!s.drawing) {
    // 止めている画の続き:進み具合の近くで筆を下ろしたときだけ再開する(このフレームから判定する)
    if (!canResume(s, st, p)) return s;
  }
  const q = closestOnStroke(st, p);
  const within = q.dist <= EDGE;
  const progressed = q.t > s.progress && q.t - s.progress <= MAX_STEP;

  let frames = s.frames;
  let score = s.score;
  let progress = s.progress;

  if (within && progressed) {
    // 線の上で進んだ:中心に近いほど高い点(中心 1 〜 EDGE で 0)
    frames += 1;
    score += frameScore(q.dist);
    progress = q.t;
  } else if (!within) {
    // 線の外:0 点のフレームとして数える
    frames += 1;
  }
  // それ以外(線の上だが進んでいない)は数えない。
  // 線の上で止まっているだけのフレームで精度が上がったり下がったりしないように

  const next = { ...s, frames, score, progress, drawing: true };
  if (progress < COMPLETE) return next;
  const perStroke = [...s.perStroke, next.frames > 0 ? next.score / next.frames : 0];
  if (s.stroke + 1 >= strokes.length) return { ...next, perStroke, phase: "done", finishedAt: now, drawing: false };
  // 書き終えたら筆を上げたことにする。次の画は、いったん離してから始点の丸の中で押し直す
  return { ...next, perStroke, stroke: s.stroke + 1, phase: "await-start", progress: 0, score: 0, frames: 0, drawing: false, needRelease: true };
}

export function traceResult(s: TraceState): { accuracy: number; timeMs: number; perStroke: number[] } | null {
  if (s.phase !== "done" || s.startedAt === null || s.finishedAt === null) return null;
  const avg = s.perStroke.reduce((a, b) => a + b, 0) / s.perStroke.length;
  return { accuracy: Math.round(avg * 10000) / 100, timeMs: Math.round(s.finishedAt - s.startedAt), perStroke: s.perStroke };
}

/** 点数(DB の submit_aim_score と同じ式)。 */
export function computeScore(accuracy: number, timeMs: number, strokes: number): number {
  const speed = Math.min(1, (strokes * PAR_MS_PER_STROKE) / Math.max(1, timeMs));
  return Math.round((accuracy / 100) * 10000 * speed);
}

import type { Point } from "./view";
import { closestOnStroke, type Stroke } from "./path";

export const TOLERANCE = 6;
export const START_RADIUS = 8;
export const COMPLETE = 0.95;
export const MAX_STEP = 0.15;
export const PAR_MS_PER_STROKE = 1500;

export type TraceState = {
  stroke: number;
  phase: "await-start" | "tracing" | "done";
  progress: number;
  inTol: number;
  frames: number;
  perStroke: number[];
  startedAt: number | null;
  finishedAt: number | null;
};

export function initialTrace(): TraceState {
  return { stroke: 0, phase: "await-start", progress: 0, inTol: 0, frames: 0, perStroke: [], startedAt: null, finishedAt: null };
}

/** 1フレームぶん進める。p はクロスヘアが指す板の点。 */
export function stepTrace(s: TraceState, strokes: Stroke[], p: Point, now: number): TraceState {
  if (s.phase === "done") return s;
  const st = strokes[s.stroke];
  if (s.phase === "await-start") {
    const a = st.points[0];
    if (Math.hypot(p.x - a.x, p.y - a.y) > START_RADIUS) return s;
    return { ...s, phase: "tracing", progress: 0, inTol: 0, frames: 0, startedAt: s.startedAt ?? now };
  }
  const q = closestOnStroke(st, p);
  const within = q.dist <= TOLERANCE;
  const progress = within && q.t > s.progress && q.t - s.progress <= MAX_STEP ? q.t : s.progress;
  const next = { ...s, frames: s.frames + 1, inTol: s.inTol + (within ? 1 : 0), progress };
  if (progress < COMPLETE) return next;
  const perStroke = [...s.perStroke, next.inTol / next.frames];
  if (s.stroke + 1 >= strokes.length) return { ...next, perStroke, phase: "done", finishedAt: now };
  return { ...next, perStroke, stroke: s.stroke + 1, phase: "await-start", progress: 0, inTol: 0, frames: 0 };
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

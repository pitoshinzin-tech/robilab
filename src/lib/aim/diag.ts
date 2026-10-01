import type { MoveDecision } from "./input";

/**
 * 今日の文字の診断(?debug=1 のときだけ使う)。照準が飛んだときの原因を、1 回の報告で決めるための記録。
 * 記録はメモリの中だけ。サーバーには送らない(本人が「診断をコピー」で貼り付けて送る)。
 */

/** 直近の記録として残す数。 */
export const DIAG_LOG_SIZE = 30;

/** フィルターの判断と、ロック・全画面・大きさの変化の直後で捨てた動き(settle-skip)。 */
export type DiagDecision = MoveDecision | "settle-skip";

/** 最後に入力を作り直した出来事。lock = ポインターロック、fullscreen = 全画面、resize = 画面の大きさ。 */
export type ChangeKind = "lock" | "fullscreen" | "resize";

/** 記録の 1 行。move = 目立つ動き、mark = 本人が J キーで付けた「ここで飛んだ」の印。時刻はゲーム開始(クリック)からの ms。 */
export type DiagEntry =
  | {
      kind: "move";
      t: number;
      dx: number;
      dy: number;
      /** その動きを判断したときの中央値(直後で捨てた動きはフィルターに入れないので null)。 */
      median: number | null;
      /** その動きを判断したときの「大きい」のしきい値(同上)。 */
      limit: number | null;
      decision: DiagDecision;
      /** 前の mousemove からの ms。 */
      gapMs: number | null;
      /** 直前のフレームの長さ ms。 */
      frameMs: number | null;
      /** 最後のロック・全画面・大きさの変化からの ms。 */
      sinceChangeMs: number | null;
      /** 最後の変化の種類。 */
      change: ChangeKind | null;
    }
  | { kind: "mark"; t: number };

/** 診断に残す「目立つ」動きか。通した動きは limit の半分を超えたときだけ、それ以外の判断は 0 でなければ残す。 */
export function isNotable(mag: number, limit: number | null, decision: DiagDecision): boolean {
  if (mag === 0) return false;
  if (decision !== "passed") return true;
  return limit !== null && mag > limit * 0.5;
}

/** 配列の最後に足し、size を超えたら古いものから消す(30 件ほどなので shift で十分)。 */
export function pushRing<T>(ring: T[], item: T, size: number = DIAG_LOG_SIZE): void {
  ring.push(item);
  while (ring.length > size) ring.shift();
}

export type FpsStats = { sum: number; count: number; min: number };

export function createFpsStats(): FpsStats {
  return { sum: 0, count: 0, min: Infinity };
}

/** 1 秒ごとの fps を 1 つ足す。 */
export function addFpsSample(s: FpsStats, fps: number): void {
  s.sum += fps;
  s.count += 1;
  if (fps < s.min) s.min = fps;
}

export function fpsSummary(s: FpsStats): { avg: number | null; min: number | null } {
  if (s.count === 0) return { avg: null, min: null };
  return { avg: Math.round(s.sum / s.count), min: s.min };
}

export type DiagReportInput = {
  log: DiagEntry[];
  /** J キーの印の時刻(ゲーム開始からの ms)。記録が流れても残るよう、別にも持つ。 */
  marks: number[];
  /** unadjusted = 生の移動量でロックできたか、firstFailure = 1 回目(生の移動量つき)の失敗の理由(エラーの name)、legacy = promise を返さない古いロック。 */
  lock: { unadjusted: boolean; firstFailure: string | null; legacy: boolean };
  fps: { avg: number | null; min: number | null };
  dropped: number;
  settleSkipped: number;
  degPerCount: number;
  minCounts: number;
  env: {
    userAgent: string;
    devicePixelRatio: number;
    screen: { width: number; height: number };
    viewport: { width: number; height: number };
  };
};

/** コピーする診断を作る(JSON にできる値だけ。名前・ID など本人を特定するものは入れない)。 */
export function buildDiagReport(input: DiagReportInput) {
  return {
    version: 1,
    userAgent: input.env.userAgent,
    devicePixelRatio: input.env.devicePixelRatio,
    screen: { ...input.env.screen },
    viewport: { ...input.env.viewport },
    degPerCount: input.degPerCount,
    minCounts: Math.round(input.minCounts * 10) / 10,
    lock: { ...input.lock },
    fps: { ...input.fps },
    dropped: input.dropped,
    settleSkipped: input.settleSkipped,
    marks: [...input.marks],
    log: input.log.map((e) => ({ ...e })),
  };
}

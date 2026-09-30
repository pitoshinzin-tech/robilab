import type { Point } from "./view";
import { AIM_TUNING } from "./tuning";

/**
 * マウスの飛び(ポインターロック中に、ブラウザがまれに 1 回だけ巨大な movementX/Y を出す)を捨てるための状態。
 * mousemove のたびに filterMovement に渡す(中身は filterMovement が書き換える)。
 */
export type MoveFilter = {
  /** 直近の(0 でない)動きの大きさ。古い順。 */
  recent: number[];
  /** 大きすぎたので保留している 1 回ぶんの動き。次も大きければ本物の速い動きとして足す。 */
  held: { dx: number; dy: number } | null;
  /** 直前に通した動きが「大きい」動きだったか(速い動きの途中なら、大きい動きを保留しない)。 */
  burst: boolean;
  /** 捨てた回数。 */
  dropped: number;
};

export type MoveFilterOptions = { factor: number; minCounts: number; window: number };

const DEFAULT_OPTIONS: MoveFilterOptions = {
  factor: AIM_TUNING.outlierFactor,
  minCounts: AIM_TUNING.outlierMinCounts,
  window: AIM_TUNING.outlierWindow,
};

export function createMoveFilter(): MoveFilter {
  return { recent: [], held: null, burst: false, dropped: 0 };
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function remember(f: MoveFilter, mag: number, window: number) {
  if (mag === 0) return;
  f.recent.push(mag);
  if (f.recent.length > window) f.recent.shift();
}

/**
 * 1 回の mousemove の動き(dx, dy)を受け取り、視点に足してよい動きを返す。
 * 直近の動きの中央値の factor 倍より大きく、かつ minCounts より大きい動きは「大きい」。
 * 大きい動きが 1 回だけなら捨てる(次のイベントで判断するので、いったん保留して 0 を返す)。
 * 大きい動きが 2 回続いたら本物の速い動きとして、保留していたぶんも合わせて返す(その後も大きい動きが続く間は保留しない)。
 */
export function filterMovement(f: MoveFilter, dx: number, dy: number, opts: MoveFilterOptions = DEFAULT_OPTIONS): { dx: number; dy: number } {
  const mag = Math.hypot(dx, dy);
  const limit = Math.max(opts.minCounts, opts.factor * median(f.recent));
  const large = mag > limit;
  if (f.held) {
    const held = f.held;
    f.held = null;
    if (large) {
      // 続けて大きい:本物の速い動き。保留していたぶんも足す
      remember(f, Math.hypot(held.dx, held.dy), opts.window);
      remember(f, mag, opts.window);
      f.burst = true;
      return { dx: held.dx + dx, dy: held.dy + dy };
    }
    // 1 回きりだった:保留していたぶんは捨てる
    f.dropped += 1;
    remember(f, mag, opts.window);
    return { dx, dy };
  }
  if (large && !f.burst) {
    f.held = { dx, dy };
    return { dx: 0, dy: 0 };
  }
  f.burst = large;
  remember(f, mag, opts.window);
  return { dx, dy };
}

/**
 * 軌跡の 1 本(筆を下ろしている 1 回ぶん)に点を足す。前の点に近すぎる点は足さず、
 * 点が多くなりすぎたら古い点からまとめて消す(描く手間を一定以下にするため)。足したら true。
 */
export function pushTrailPoint(seg: Point[], p: Point, minDist: number = AIM_TUNING.trailMinDist, maxPoints: number = AIM_TUNING.trailMaxPoints): boolean {
  const last = seg[seg.length - 1];
  if (last && Math.hypot(p.x - last.x, p.y - last.y) < minDist) return false;
  seg.push({ x: p.x, y: p.y });
  if (seg.length > maxPoints) {
    // 1 点ずつ消すと毎フレーム配列を詰め直すので、1 割ぶんまとめて消す
    seg.splice(0, seg.length - maxPoints + Math.ceil(maxPoints / 10));
  }
  return true;
}

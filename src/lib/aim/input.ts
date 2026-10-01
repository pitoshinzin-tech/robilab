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
  /** 直前に通した動きが「大きい」動きだったか(速い動きの途中なら、ふつうは大きい動きを保留しない)。 */
  burst: boolean;
  /** 直前に通した(0 でない)動きの大きさ。速い動きの途中の飛び(この burstJumpFactor 倍超)を見分ける。 */
  lastMag: number;
  /** 捨てた回数。 */
  dropped: number;
};

export type MoveFilterOptions = {
  /** 中央値のこの倍より大きい動きは「大きい」。 */
  factor: number;
  /** この大きさ(カウント)以下の動きは「大きい」にしない。 */
  minCounts: number;
  /** 中央値を取る直近の動きの数。 */
  window: number;
  /** 2 回続いた大きい動きを本物とみなす、向きの cos の下限。 */
  pairCos: number;
  /** 2 回続いた大きい動きを本物とみなす、大きさの比の上限。 */
  pairRatio: number;
  /** 速い動きの途中でも、直前に通した動きのこの倍を超えたら保留する。 */
  burstJumpFactor: number;
};

/**
 * フィルターの判断。passed = そのまま通した、burst-pass = 速い動きの途中の大きい動きを通した、
 * held = 大きいので保留した、pair-pass = 保留していたぶんと合わせて通した、
 * dropped = 保留していたぶんを捨てて今の動きは通した、dropped-held = 保留していたぶんを捨てて今の動きを新しく保留した。
 */
export type MoveDecision = "passed" | "burst-pass" | "held" | "pair-pass" | "dropped" | "dropped-held";

export type FilteredMove = {
  dx: number;
  dy: number;
  decision: MoveDecision;
  /** 判断に使った直近の動きの中央値。 */
  median: number;
  /** 判断に使った「大きい」のしきい値(カウント)。 */
  limit: number;
};

/** 感度(1 カウントあたりの度)から、フィルターの値を作る。下限は角度(outlierMinDeg)で決める。 */
export function moveFilterOptions(degPerCount: number): MoveFilterOptions {
  const fromDeg = degPerCount > 0 ? AIM_TUNING.outlierMinDeg / degPerCount : 0;
  return {
    factor: AIM_TUNING.outlierFactor,
    minCounts: Math.max(AIM_TUNING.outlierMinCountsFloor, Number.isFinite(fromDeg) ? fromDeg : 0),
    window: AIM_TUNING.outlierWindow,
    pairCos: AIM_TUNING.outlierPairCos,
    pairRatio: AIM_TUNING.outlierPairRatio,
    burstJumpFactor: AIM_TUNING.burstJumpFactor,
  };
}

// 感度が分からないときの値(下限は outlierMinCountsFloor)
const DEFAULT_OPTIONS: MoveFilterOptions = moveFilterOptions(0);

export function createMoveFilter(): MoveFilter {
  return { recent: [], held: null, burst: false, lastMag: 0, dropped: 0 };
}

/**
 * ロック・全画面・画面の大きさが変わった直後(settleMs より前)なら true。
 * lastChangeAt が null(まだ変わっていない)のときや、時刻が戻っているときは false。
 */
export function inSettle(now: number, lastChangeAt: number | null, settleMs: number): boolean {
  if (lastChangeAt === null) return false;
  const since = now - lastChangeAt;
  return since >= 0 && since < settleMs;
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

/** 保留していた動き a と今の動き b が、そろった(同じ向き・近い大きさの)本物の速い動きか。 */
function isPair(a: { dx: number; dy: number }, aMag: number, b: { dx: number; dy: number }, bMag: number, opts: MoveFilterOptions): boolean {
  if (aMag === 0 || bMag === 0) return false;
  const cos = (a.dx * b.dx + a.dy * b.dy) / (aMag * bMag);
  const ratio = Math.max(aMag, bMag) / Math.min(aMag, bMag);
  return cos >= opts.pairCos && ratio <= opts.pairRatio;
}

/** 通した動きを覚える。 */
function pass(f: MoveFilter, mag: number, large: boolean, window: number) {
  f.burst = large;
  if (mag > 0) f.lastMag = mag;
  remember(f, mag, window);
}

/**
 * 1 回の mousemove の動き(dx, dy)を受け取り、視点に足してよい動きを返す。
 * 直近の動きの中央値の factor 倍より大きく、かつ minCounts より大きい動きは「大きい」。
 * 大きい動きが 1 回だけなら捨てる(次のイベントで判断するので、いったん保留して 0 を返す)。
 * 大きい動きが 2 回続き、2 回の向きと大きさがそろっていれば(cos が pairCos 以上、大きさの比が pairRatio 以内)、
 * 本物の速い動きとして保留していたぶんも合わせて返す。そろっていなければ 1 回目を捨て、2 回目を新しく保留する。
 * 本物の速い動きの途中(burst)は大きい動きを保留しないが、直前に通した動きの burstJumpFactor 倍を超える動きは保留する。
 */
export function filterMovement(f: MoveFilter, dx: number, dy: number, opts: MoveFilterOptions = DEFAULT_OPTIONS): FilteredMove {
  const mag = Math.hypot(dx, dy);
  const med = median(f.recent);
  const limit = Math.max(opts.minCounts, opts.factor * med);
  const large = mag > limit;
  const out = (rx: number, ry: number, decision: MoveDecision): FilteredMove => ({ dx: rx, dy: ry, decision, median: med, limit });
  if (f.held) {
    const held = f.held;
    const heldMag = Math.hypot(held.dx, held.dy);
    f.held = null;
    if (large && isPair(held, heldMag, { dx, dy }, mag, opts)) {
      // 続けて大きく、向きと大きさがそろっている:本物の速い動き。保留していたぶんも足す
      remember(f, heldMag, opts.window);
      pass(f, mag, true, opts.window);
      return out(held.dx + dx, held.dy + dy, "pair-pass");
    }
    // 保留していたぶんは 1 回きりの飛びとして捨てる
    f.dropped += 1;
    if (large) {
      // 今の動きも大きいが、そろっていない:今の動きを新しく保留して、次で判断する
      f.held = { dx, dy };
      f.burst = false;
      return out(0, 0, "dropped-held");
    }
    pass(f, mag, false, opts.window);
    return out(dx, dy, "dropped");
  }
  if (large && (!f.burst || mag > opts.burstJumpFactor * f.lastMag)) {
    f.held = { dx, dy };
    return out(0, 0, "held");
  }
  const decision: MoveDecision = large ? "burst-pass" : "passed";
  pass(f, mag, large, opts.window);
  return out(dx, dy, decision);
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

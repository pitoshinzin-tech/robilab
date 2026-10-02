/** 追補 S1:ヒーローの漢字の「お試しの 1 画」。点数は付けない(採点は /aim だけ)。 */
export type TracePoint = { x: number; y: number };
export const KANJI_BOX = 109;
export const TRACE_MAX_POINTS = 240;

/** 画面の座標を漢字の箱(0〜size)の座標にする。箱の外は端にそろえる。 */
export function toViewBox(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, size = KANJI_BOX): TracePoint {
  if (!(rect.width > 0) || !(rect.height > 0)) return { x: 0, y: 0 };
  const clamp = (v: number) => Math.min(size, Math.max(0, v));
  return { x: clamp(((clientX - rect.left) / rect.width) * size), y: clamp(((clientY - rect.top) / rect.height) * size) };
}

/** 点を足す。近すぎる点・上限を超える点は足さず、同じ配列を返す(描き直さない)。 */
export function appendPoint(points: readonly TracePoint[], p: TracePoint, minDist = 0.8, max = TRACE_MAX_POINTS): readonly TracePoint[] {
  if (points.length >= max) return points;
  const last = points.at(-1);
  if (last && Math.hypot(p.x - last.x, p.y - last.y) < minDist) return points;
  return [...points, p];
}

/** 点の列を SVG の path(`M x y L x y …`、小数 1 桁)にする。 */
export function pointsToPath(points: readonly TracePoint[]): string {
  const r = (n: number) => Math.round(n * 10) / 10;
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${r(p.x)} ${r(p.y)}`).join(" ");
}

import { getSensGame } from "@/data/sensitivity";

/** 視点(度)。yaw は右が +、pitch は上が +。 */
export type View = { yaw: number; pitch: number };
/** 文字の板の上の点(KanjiVG の座標:0〜109、y は下向き)。 */
export type Point = { x: number; y: number };

export const HFOV_DEG = 103;
export const BOARD_SPAN_DEG = 40;
export const KVG_SIZE = 109;
const PITCH_LIMIT = 89;
const RAD = Math.PI / 180;
/** 板は距離 1 の平面。横 40° の幅 = 2·tan(20°)。 */
const BOARD_WIDTH = 2 * Math.tan((BOARD_SPAN_DEG / 2) * RAD);
const UNIT = BOARD_WIDTH / KVG_SIZE;

/** 1カウントあたりの回転角(度)= 感度 × ゲームの yaw。感度計算ツールと同じ係数。 */
export function degreesPerCount(gameId: string, sens: number): number | null {
  const g = getSensGame(gameId);
  if (!g || !(sens > 0)) return null;
  return sens * g.yaw;
}

export function applyMouse(v: View, dx: number, dy: number, degPerCount: number): View {
  const pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, v.pitch - dy * degPerCount));
  return { yaw: v.yaw + dx * degPerCount, pitch };
}

/** 板の点 → 世界の座標(板は z = 1、x 右、y 上)。 */
function toWorld(p: Point) {
  return { X: (p.x - KVG_SIZE / 2) * UNIT, Y: -(p.y - KVG_SIZE / 2) * UNIT, Z: 1 };
}

/** クロスヘア(画面の中央)が指す板の点。 */
export function aimPoint(v: View): Point {
  const yaw = v.yaw * RAD;
  const pitch = v.pitch * RAD;
  // 視線の向き d = (sinθ·cosφ, sinφ, cosθ·cosφ) を z = 1 の平面まで伸ばす
  const X = Math.tan(yaw);
  const Y = Math.tan(pitch) / Math.cos(yaw);
  return { x: X / UNIT + KVG_SIZE / 2, y: -Y / UNIT + KVG_SIZE / 2 };
}

/** 板の点を、視点 v から見た画面の座標にする。カメラの後ろなら null。 */
export function projectPoint(p: Point, v: View, width: number, height: number): { x: number; y: number } | null {
  const { X, Y, Z } = toWorld(p);
  const yaw = v.yaw * RAD;
  const pitch = v.pitch * RAD;
  // yaw の逆回転(y 軸まわり)
  const x1 = X * Math.cos(yaw) - Z * Math.sin(yaw);
  const z1 = X * Math.sin(yaw) + Z * Math.cos(yaw);
  // pitch の逆回転(x 軸まわり)
  const y2 = Y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = Y * Math.sin(pitch) + z1 * Math.cos(pitch);
  if (z2 <= 1e-6) return null;
  const f = width / 2 / Math.tan((HFOV_DEG / 2) * RAD);
  return { x: width / 2 + (f * x1) / z2, y: height / 2 - (f * y2) / z2 };
}

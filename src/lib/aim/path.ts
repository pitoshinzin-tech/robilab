import type { Point } from "./view";

export type Stroke = { points: Point[]; cum: number[]; length: number };

const CURVE_STEPS = 16;
const TOKEN_RE = /[MmLlHhVvCcSsZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/** SVG path の d(KanjiVG の書き方)を、描画と採点に使う折れ線の点にする。 */
export function parsePath(d: string): Point[] {
  const tokens = d.match(TOKEN_RE) ?? [];
  const pts: Point[] = [];
  let i = 0;
  let cmd = "";
  let cur: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let lastCtrl: Point | null = null;
  const num = () => Number(tokens[i++]);
  const isCmd = (t: string | undefined) => t !== undefined && /[A-Za-z]/.test(t);
  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++]!;
    const rel = cmd === cmd.toLowerCase();
    const base = rel ? cur : { x: 0, y: 0 };
    switch (cmd.toUpperCase()) {
      case "M": {
        cur = { x: base.x + num(), y: base.y + num() };
        start = cur;
        pts.push(cur);
        lastCtrl = null;
        cmd = rel ? "l" : "L"; // M の後に続く座標は L として読む
        break;
      }
      case "L": {
        cur = { x: base.x + num(), y: base.y + num() };
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case "H": {
        cur = { x: (rel ? cur.x : 0) + num(), y: cur.y };
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case "V": {
        cur = { x: cur.x, y: (rel ? cur.y : 0) + num() };
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case "C":
      case "S": {
        const smooth = cmd.toUpperCase() === "S";
        const c1: Point = smooth
          ? lastCtrl ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur
          : { x: base.x + num(), y: base.y + num() };
        const c2: Point = { x: base.x + num(), y: base.y + num() };
        const end: Point = { x: base.x + num(), y: base.y + num() };
        for (let k = 1; k <= CURVE_STEPS; k++) pts.push(cubic(cur, c1, c2, end, k / CURVE_STEPS));
        lastCtrl = c2;
        cur = end;
        break;
      }
      case "Z": {
        cur = start;
        pts.push(cur);
        lastCtrl = null;
        cmd = ""; // Z のあとの数字は読み飛ばす(同じ Z を繰り返して止まらないように)
        break;
      }
      default:
        i++; // 知らない記号は読み飛ばす
    }
  }
  // 途中で切れたコマンドなどで NaN になった点は捨てる
  return pts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

export function toStroke(points: Point[]): Stroke {
  const cum = [0];
  for (let k = 1; k < points.length; k++) cum.push(cum[k - 1] + Math.hypot(points[k].x - points[k - 1].x, points[k].y - points[k - 1].y));
  return { points, cum, length: cum.at(-1) ?? 0 };
}

/** 点 p から線への最短距離と、その位置の進み具合(0〜1)。 */
export function closestOnStroke(s: Stroke, p: Point): { dist: number; t: number } {
  if (s.points.length === 1 || s.length === 0) return { dist: Math.hypot(p.x - s.points[0].x, p.y - s.points[0].y), t: 0 };
  let best = { dist: Infinity, t: 0 };
  for (let k = 1; k < s.points.length; k++) {
    const a = s.points[k - 1];
    const b = s.points[k];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy;
    const u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
    const qx = a.x + u * vx;
    const qy = a.y + u * vy;
    const dist = Math.hypot(p.x - qx, p.y - qy);
    if (dist < best.dist) best = { dist, t: (s.cum[k - 1] + u * Math.sqrt(len2)) / s.length };
  }
  return best;
}

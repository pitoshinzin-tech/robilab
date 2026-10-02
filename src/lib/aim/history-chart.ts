// 「あなたの記録」の折れ線の点(SVG の viewBox 0 0 CHART_W CHART_H)
export const CHART_W = 300;
export const CHART_H = 100;
export const CHART_PAD = 6;

export type ChartPoint = { x: number; y: number; index: number };
/**
 * lines:続けて遊んだ日の実線。dots:前後に続く日がない 1 日だけの点。today:今日の点(遊んでいなければ null)。
 * gaps:bridge のとき、遊ばなかった日をまたいで前後の遊んだ日をつなぐ線(破線で描く)。bridge でなければ空。
 */
export type ChartGeometry = { lines: string[]; dots: ChartPoint[]; today: ChartPoint | null; gaps: string[] };

const r1 = (n: number) => Math.round(n * 10) / 10;
const toPoints = (pts: ChartPoint[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

/**
 * 遊ばなかった日(null)で線を切る。1 点だけの区間は点として描く。
 * `bridge: true` のときは、切れた所を gaps(前の区間の最後の点 → 次の区間の最初の点)でつなぎ、遊んだ日が 1 本に見えるようにする。
 */
export function buildChart(values: (number | null)[], max: number, { bridge = false }: { bridge?: boolean } = {}): ChartGeometry {
  const n = values.length;
  const step = n > 1 ? (CHART_W - 2 * CHART_PAD) / (n - 1) : 0;
  const point = (v: number, i: number): ChartPoint => {
    const t = Math.min(1, Math.max(0, v / max));
    return { x: r1(CHART_PAD + i * step), y: r1(CHART_PAD + (1 - t) * (CHART_H - 2 * CHART_PAD)), index: i };
  };
  const lines: string[] = [];
  const dots: ChartPoint[] = [];
  const gaps: string[] = [];
  let run: ChartPoint[] = [];
  let prevEnd: ChartPoint | null = null;
  const flush = () => {
    if (run.length === 0) return;
    if (bridge && prevEnd) gaps.push(toPoints([prevEnd, run[0]]));
    if (run.length === 1) dots.push(run[0]);
    else lines.push(toPoints(run));
    prevEnd = run[run.length - 1];
    run = [];
  };
  values.forEach((v, i) => {
    if (v === null) flush();
    else run.push(point(v, i));
  });
  flush();
  const last = values[n - 1];
  return { lines, dots, gaps, today: n > 0 && last !== null && last !== undefined ? point(last, n - 1) : null };
}

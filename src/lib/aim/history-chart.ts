// 「あなたの記録」の折れ線の点(SVG の viewBox 0 0 CHART_W CHART_H)
export const CHART_W = 300;
export const CHART_H = 100;
export const CHART_PAD = 6;

export type ChartPoint = { x: number; y: number; index: number };
export type ChartGeometry = { lines: string[]; dots: ChartPoint[]; today: ChartPoint | null };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 遊ばなかった日(null)で線を切る。1 点だけの区間は点として描く */
export function buildChart(values: (number | null)[], max: number): ChartGeometry {
  const n = values.length;
  const step = n > 1 ? (CHART_W - 2 * CHART_PAD) / (n - 1) : 0;
  const point = (v: number, i: number): ChartPoint => {
    const t = Math.min(1, Math.max(0, v / max));
    return { x: r1(CHART_PAD + i * step), y: r1(CHART_PAD + (1 - t) * (CHART_H - 2 * CHART_PAD)), index: i };
  };
  const lines: string[] = [];
  const dots: ChartPoint[] = [];
  let run: ChartPoint[] = [];
  const flush = () => {
    if (run.length === 1) dots.push(run[0]);
    else if (run.length > 1) lines.push(run.map((p) => `${p.x},${p.y}`).join(" "));
    run = [];
  };
  values.forEach((v, i) => {
    if (v === null) flush();
    else run.push(point(v, i));
  });
  flush();
  const last = values[n - 1];
  return { lines, dots, today: n > 0 && last !== null && last !== undefined ? point(last, n - 1) : null };
}

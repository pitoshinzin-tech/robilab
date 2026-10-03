import { THICKNESS_SCALE, thicknessScale } from "@/lib/skate-thickness";

/**
 * 厚さの目盛り(サーバーの部品・JS 0)。0〜1.5mm の横の線に 0.5mm ごとの目盛り、厚さの位置にマゼンタの印(8px のマス)。
 * 公式に 1 つの数字があるときだけ。幅の表記・記載なしのときは何も出さない。
 */
export function ThicknessScale({ mm }: { mm: number | null }) {
  const g = thicknessScale(mm);
  if (g === null) return null;
  const m = THICKNESS_SCALE.markPx;
  const first = g.ticks[0].x;
  const last = g.ticks[g.ticks.length - 1].x;
  return (
    <span role="img" aria-label={`厚さ ${mm}mm(0〜${THICKNESS_SCALE.maxMm}mm の目盛りの上の位置)`} className="inline-flex items-center gap-1 text-xs text-rl-muted">
      <span aria-hidden="true">0</span>
      <svg aria-hidden="true" width={g.width} height={g.height} viewBox={g.viewBox} className="block shrink-0">
        <line x1={first} x2={last} y1={g.lineY} y2={g.lineY} stroke="var(--rl-line-strong)" strokeWidth={1} />
        {g.ticks.map((t) => <line key={t.mm} x1={t.x} x2={t.x} y1={g.lineY - 4} y2={g.lineY + 4} stroke="var(--rl-line-strong)" strokeWidth={1} />)}
        <rect x={g.markX - m / 2} y={g.lineY - m} width={m} height={m} fill="var(--rl-highlight)" />
      </svg>
      <span aria-hidden="true">{THICKNESS_SCALE.maxMm}</span>
    </span>
  );
}

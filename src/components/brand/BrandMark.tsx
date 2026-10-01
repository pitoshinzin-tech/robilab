import { cn } from "@/lib/utils";

/** 仮のシンボルマーク(8×8 のドット絵の「ロ」)。社長のロゴができたら差し替え。 */
const FRAME = [[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [6, 2], [1, 3], [6, 3], [1, 4], [6, 4], [1, 5], [6, 5], [2, 6], [3, 6], [4, 6], [5, 6]];
const CORE = [[3, 3], [4, 3], [3, 4], [4, 4]];

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden shapeRendering="crispEdges" className={cn("size-6 shrink-0", className)}>
      <g fill="var(--rl-highlight)">{FRAME.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)}</g>
      <g fill="var(--rl-secondary-text)">{CORE.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)}</g>
    </svg>
  );
}

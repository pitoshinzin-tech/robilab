import { cn } from "@/lib/utils";
import { PIXEL_VAR, pixelCells, type PixelGrid } from "@/lib/pixel-art";
import { rectsToPath } from "@/lib/pixel-path";

/**
 * コードで描くドット絵(追補 7-1)。label を渡したときだけ読み上げる(ふだんは飾り)。
 * dissolve:1 段明るい色の重ねを持ち、親の .rl-dissolve-host のホバー・フォーカスで上から 4 段で塗り替わる(動きの参考 025)。
 */
export function PixelArt({ grid, size, label, dissolve = false, className }: { grid: PixelGrid; size: number; label?: string; dissolve?: boolean; className?: string }) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  // マスは 1 本の path(表示速度。docs/design/perf.md。見た目は <rect> を並べたときと同じ)
  const cells = <path d={rectsToPath(pixelCells(grid).map(({ x, y }) => ({ x, y, w: 1, h: 1 })))} />;
  return (
    <svg viewBox={`0 0 ${grid.size} ${grid.size}`} width={size} height={size} shapeRendering="crispEdges" className={cn("shrink-0", className)} {...a11y}>
      <g fill={PIXEL_VAR[grid.role]}>{cells}</g>
      {dissolve && <g className="rl-dissolve-lit" style={{ fill: `color-mix(in oklab, ${PIXEL_VAR[grid.role]} 60%, var(--rl-text))` }}>{cells}</g>}
    </svg>
  );
}

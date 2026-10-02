import { cn } from "cn";
import { PIXEL_VAR, pixelCells, type PixelGrid } from "@/lib/pixel-art";

/** コードで描くドット絵(追補 7-1)。label を渡したときだけ読み上げる(ふだんは飾り)。 */
export function PixelArt({ grid, size, label, className }: { grid: PixelGrid; size: number; label?: string; className?: string }) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg viewBox={`0 0 ${grid.size} ${grid.size}`} width={size} height={size} shapeRendering="crispEdges" className={cn("shrink-0", className)} {...a11y}>
      <g fill={PIXEL_VAR[grid.role]}>
        {pixelCells(grid).map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)}
      </g>
    </svg>
  );
}

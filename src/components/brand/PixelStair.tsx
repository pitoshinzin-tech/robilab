import { useId } from "react";
import { cn } from "cn";
import { STAIR_TILE } from "@/lib/pixel-art";

/** 追補 5-4:ヒーローの下の境目(8px の段・高さ 24px)。ヒーローの点の格子を、階段の形で終わらせる。 */
export function PixelStair({ className }: { className?: string }) {
  const base = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const dots = `rl-stair-dots-${base}`;
  const tile = `rl-stair-tile-${base}`;
  return (
    <svg aria-hidden width="100%" height={STAIR_TILE.height} shapeRendering="crispEdges" className={cn("block", className)}>
      <defs>
        <pattern id={dots} width={8} height={8} patternUnits="userSpaceOnUse"><circle cx={4} cy={4} r={1} fill="var(--rl-dot)" /></pattern>
        <pattern id={tile} width={STAIR_TILE.width} height={STAIR_TILE.height} patternUnits="userSpaceOnUse"><path d={STAIR_TILE.upper} fill={`url(#${dots})`} /></pattern>
      </defs>
      <rect width="100%" height={STAIR_TILE.height} fill={`url(#${tile})`} />
    </svg>
  );
}

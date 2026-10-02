import { cn } from "@/lib/utils";
import { SPRITE_SIZE } from "@/lib/type-sprite";

export type SpriteScreenSize = 64 | 96 | 160;

/**
 * 追補 S2:診断の 12×12 のマスの小さな画面。タイプの絵(TypeIcon)と同じ viewBox・同じ面なので、Task 10A で結果の絵へそのまま移れる。
 * litRows:上から点いている行の数(点いた行は --rl-line-strong の帯)。進み具合は ProgressBar の数字と role="progressbar" が伝えるので、これは飾り。
 * ここでは止まった形だけ(点く・塗り替わる動きは Task 10A)。
 */
export function SpriteScreen({ size, litRows = 0, className }: { size: SpriteScreenSize; litRows?: number; className?: string }) {
  return (
    <svg viewBox="-1 -1 14 14" width={size} height={size} shapeRendering="crispEdges" aria-hidden className={cn("shrink-0 rounded-rl-sm bg-rl-surface", className)}>
      {Array.from({ length: SPRITE_SIZE }, (_, y) => (
        <g key={y} data-row={y}>
          {Array.from({ length: SPRITE_SIZE }, (_, x) => <rect key={x} x={x + 0.1} y={y + 0.1} width={0.8} height={0.8} fill="var(--rl-surface-2)" />)}
          <rect data-lit x={0} y={y} width={SPRITE_SIZE} height={1} fill="var(--rl-line-strong)" opacity={y < litRows ? 1 : 0} />
        </g>
      ))}
    </svg>
  );
}

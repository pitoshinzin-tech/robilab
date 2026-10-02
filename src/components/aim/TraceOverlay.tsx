import { cn } from "@/lib/utils";
import { pointsToPath } from "@/lib/motion/hero-trace";

/**
 * 追補 6 章:書いた線(ライム)がそのまま残り、お手本の線(薄い)と重なって見える。どこがずれたかが分かる。
 * お手本の線は KanjiStrokes の tone="muted" と同じ形(rl-kanji-muted)を、ここで直接描く
 * (KanjiStrokes をブラウザの JS に入れると、トップの見せ場とチャンクを分け合って JS が増えるため)。
 */
export function TraceOverlay({ strokes, trail, className }: {
  strokes: readonly string[]; trail: readonly (readonly { x: number; y: number }[])[]; className?: string;
}) {
  return (
    <figure className={cn("grid justify-items-start gap-2", className)}>
      <svg viewBox="0 0 109 109" aria-hidden className="size-40 overflow-visible md:size-48">
        <g className="rl-kanji-muted" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          {strokes.map((d, i) => <path key={i} d={d} />)}
        </g>
        <g fill="none" stroke="var(--rl-success)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          {trail.filter((s) => s.length > 1).map((s, i) => <path key={i} d={pointsToPath(s)} />)}
        </g>
      </svg>
      <figcaption className="text-sm text-rl-muted">ライムの線があなたの線、薄い線がお手本です</figcaption>
    </figure>
  );
}

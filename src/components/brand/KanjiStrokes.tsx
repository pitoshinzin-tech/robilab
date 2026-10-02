import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { StrokeSlot } from "@/lib/motion/stroke-schedule";

/**
 * 今日の漢字を KanjiVG の書き順の線で描く(viewBox 0 0 109 109。追補 S1)。
 * インラインの SVG の線なので LCP の候補にならず、フォントの読み込みも待たない。
 * tone="hero":マゼンタの線 + 光の重ね + 色ズレの縁(D29 の例外。左右に約 3px ずらしたマゼンタとシアンの線)。
 * tone="muted":お手本の薄い線(光・色ズレなし。/aim の結果の重ねの図)。
 * schedule を渡すと 1 画ずつ CSS で引く(Task 7A)。渡さなければ描き終わった形。
 */
export function KanjiStrokes({ strokes, tone = "hero", schedule, className }: {
  strokes: readonly string[]; tone?: "hero" | "muted"; schedule?: readonly StrokeSlot[]; className?: string;
}) {
  const shapeId = `rl-kanji-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  const last = schedule?.at(-1);
  const drawnAt = last ? last.delay + last.duration : 0;
  const line = { fill: "none", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 109 109" aria-hidden data-drawing={schedule ? "" : undefined}
      className={cn("rl-kanji shrink-0 overflow-visible", className)} style={{ "--rl-drawn-at": `${drawnAt}ms` } as CSSProperties}>
      <defs>
        <g id={shapeId}>{strokes.map((d, i) => <path key={i} d={d} />)}</g>
      </defs>
      {tone === "hero" && (
        <>
          <use href={`#${shapeId}`} className="rl-kanji-ghost-m" {...line} />
          <use href={`#${shapeId}`} className="rl-kanji-ghost-c" {...line} />
          <use href={`#${shapeId}`} className="rl-kanji-glow" {...line} />
        </>
      )}
      <g {...line} className={tone === "hero" ? "rl-kanji-line" : "rl-kanji-muted"}>
        {strokes.map((d, i) => (
          <path key={i} d={d} pathLength={1} className={schedule ? "rl-stroke-draw" : undefined}
            style={schedule?.[i] ? { animationDelay: `${schedule[i].delay}ms`, animationDuration: `${schedule[i].duration}ms` } : undefined} />
        ))}
      </g>
    </svg>
  );
}

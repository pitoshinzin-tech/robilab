import type { PadSize } from "@/data/gear-types";
import { AVG_MOUSE, SCALE_FRAME, padScale, padScaleLabel } from "@/lib/pad-scale";
import { cn } from "@/lib/utils";

/**
 * 実寸の縮尺図「パッドの上のマウス」(サーバーの部品・JS 0)。
 * 公式の幅・奥行きがあるサイズの外形を同じ縮尺で左下をそろえて重ねた線と、一番小さいサイズの真ん中に平均的なマウス(面)。
 * 大きさ・厚さで絞っているときは、合うサイズの線だけ選んだ色(--rl-selected)、ほかは薄い線。
 * 名前は 12px のまま読めるように、SVG の外の文字として外形の右上の角に重ねる(SVG の中の文字は図と一緒に縮むため)。
 * 公式の数字がないサイズは描かない。描けるサイズが 1 つもなければ何も出さない。
 */
export function PadScale({ sizes, matched, className }: { sizes: readonly PadSize[]; matched: readonly PadSize[] | null; className?: string }) {
  const g = padScale(sizes, matched);
  if (g === null) return null;
  const ratio = Math.round((g.widthMm / g.depthMm) * 1000) / 1000;
  return (
    <figure className={cn("grid content-start gap-2", className)}>
      <div role="img" aria-label={padScaleLabel(g)}
        className="relative [--pad-scale-h:128px] md:[--pad-scale-h:240px]"
        style={{ aspectRatio: ratio, width: `min(100%, ${SCALE_FRAME.maxWidthPx}px, calc(var(--pad-scale-h) * ${ratio}))` }}>
        <svg viewBox={g.viewBox} overflow="visible" className="absolute inset-0 size-full">
          {g.outlines.map((o) => (
            <rect key={o.label} x={o.x} y={o.y} width={o.width} height={o.height} fill="none"
              stroke={g.narrowed ? (o.matched ? "var(--rl-selected)" : "var(--rl-line)") : "var(--rl-line-strong)"}
              strokeWidth={o.matched ? 2 : 1.5} vectorEffect="non-scaling-stroke" />
          ))}
          <rect x={g.mouse.x} y={g.mouse.y} width={g.mouse.width} height={g.mouse.height} rx={g.mouse.rx}
            fill="var(--rl-selected-bg)" stroke="var(--rl-secondary-text)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
        {g.outlines.map((o) => (
          <span key={o.label} className={cn("absolute mr-px bg-rl-bg px-1 text-xs leading-4 whitespace-nowrap", o.matched ? "font-bold text-rl-secondary-text" : "text-rl-muted")}
            style={{ right: `${pct((g.widthMm - o.width) / g.widthMm)}%`, top: `${pct(o.labelTopMm / g.depthMm)}%` }}>
            {o.label}
          </span>
        ))}
      </div>
      <figcaption className="text-sm text-rl-muted text-balance [word-break:auto-phrase]">
        線は公式のサイズ(左下をそろえて重ねた外形)、面は平均的なマウス {AVG_MOUSE.lengthMm}×{AVG_MOUSE.widthMm}mm。同じ縮尺です。
        {g.tinyMouse && "パッドが大きいので、マウスは小さく見えます。"}
      </figcaption>
    </figure>
  );
}

const pct = (n: number) => Math.round(n * 1000) / 10;

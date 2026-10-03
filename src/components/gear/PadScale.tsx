import type { PadSize } from "@/data/gear-types";
import { AVG_MOUSE, PAD_LINK_SLOTS, SCALE_FRAME, padScale, padScaleLabel } from "@/lib/pad-scale";
import { cn } from "@/lib/utils";

/**
 * 実寸の縮尺図「パッドの上のマウス」(サーバーの部品・JS 0)。
 * 公式の幅・奥行きがあるサイズの外形を同じ縮尺で左下をそろえて重ねた線と、一番小さいサイズの真ん中に平均的なマウス(面)。
 * 大きさ・厚さで絞っているときは、合うサイズの線だけ選んだ色(--rl-selected)、ほかは薄い線。
 * 名前は 12px のまま読めるように、SVG の外の文字として外形の右上の角に重ねる(SVG の中の文字は図と一緒に縮むため)。
 * 375 の枠で外形に収まらない・ほかの札と置けない・マウスの面に重なる名前は札にせず、図の下に「左下の小さい線:…」と 1 行でまとめる。
 * 図の説明(figcaption)は一覧の先頭の行だけ見せ、ほかの行は sr-only(読み上げには残す。375 で 41 行すべてに出ると長くなるため)。
 * 公式の数字がないサイズは描かない。描けるサイズが 1 つもなければ何も出さない。
 * 外形と札には表の行と同じ番号の data-outline-i(PadRow の data-size-i と対。globals.css の .rl-size-link で、行に乗せると外形が太く、外形に乗せると行が光る)。
 */
export function PadScale({ sizes, matched, showCaption = true, className }: {
  sizes: readonly PadSize[]; matched: readonly PadSize[] | null;
  /** 図の説明を見せるか(一覧の先頭の行だけ true) */
  showCaption?: boolean; className?: string;
}) {
  const g = padScale(sizes, matched);
  if (g === null) return null;
  const ratio = Math.round((g.widthMm / g.depthMm) * 1000) / 1000;
  return (
    <figure className={cn("grid content-start gap-2", className)}>
      <div role="img" aria-label={padScaleLabel(g)}
        className="relative [--pad-scale-h:128px] md:[--pad-scale-h:240px]"
        style={{ aspectRatio: ratio, width: `min(100%, ${SCALE_FRAME.maxWidthPx}px, calc(var(--pad-scale-h) * ${ratio}))` }}>
        <svg viewBox={g.viewBox} overflow="visible" className="absolute inset-0 size-full">
          {g.outlines.map((o, i) => (
            <rect key={o.label} data-outline-i={i < PAD_LINK_SLOTS ? i : undefined} x={o.x} y={o.y} width={o.width} height={o.height} fill="none"
              stroke={g.narrowed ? (o.matched ? "var(--rl-selected)" : "var(--rl-line)") : "var(--rl-line-strong)"}
              strokeWidth={o.matched ? 2 : 1.5} vectorEffect="non-scaling-stroke" />
          ))}
          <rect x={g.mouse.x} y={g.mouse.y} width={g.mouse.width} height={g.mouse.height} rx={g.mouse.rx}
            fill="var(--rl-selected-bg)" stroke="var(--rl-secondary-text)" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" />
        </svg>
        {g.outlines.map((o, i) => o.labelShown && (
          <span key={o.label} data-outline-i={i < PAD_LINK_SLOTS ? i : undefined} className={cn("absolute bg-rl-bg px-1 text-xs leading-4 whitespace-nowrap", o.matched ? "font-bold text-rl-secondary-text" : "text-rl-muted")}
            style={{ right: `${pct((g.widthMm - o.labelRightMm) / g.widthMm)}%`, top: `${pct(o.labelTopMm / g.depthMm)}%` }}>
            {o.label}
          </span>
        ))}
      </div>
      {g.hiddenLabels.length > 0 && <p aria-hidden className="text-xs text-rl-muted">左下の小さい線:{g.hiddenLabels.join("・")}</p>}
      <figcaption className={showCaption ? "text-sm text-rl-muted text-balance [word-break:auto-phrase]" : "sr-only"}>
        線は公式のサイズ(左下をそろえて重ねた外形)、面は平均的なマウス {AVG_MOUSE.lengthMm}×{AVG_MOUSE.widthMm}mm。同じ縮尺です。
        {g.tinyMouse && "パッドが大きいので、マウスは小さく見えます。"}
      </figcaption>
    </figure>
  );
}

const pct = (n: number) => Math.round(n * 1000) / 10;

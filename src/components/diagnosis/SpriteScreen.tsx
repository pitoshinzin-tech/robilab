"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SPRITE_SIZE, heatOf, spriteFill, spriteRows } from "@/lib/type-sprite";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/** 288 = 12 × 24px(診断の始める画面の PC。8 の倍数のマス) */
export type SpriteScreenSize = 64 | 96 | 160 | 288;
/** 1 行が左から点く時間(steps(12)) */
const LIGHT_MS = 120;
/** 塗り替えの 1 行ずつの間(12 行で 360ms) */
const PAINT_ROW_MS = 30;

/**
 * 追補 S2:診断の 12×12 のマスの画面(タイプの絵と同じ viewBox・同じ面)。
 * litRows が増えると、その行が左から 12 段で点く。revealCode が来ると、12 行が上から順にそのタイプの色に塗り替わり、
 * 終わったら onRevealed を呼ぶ(呼ぶ側はそのあと結果へ移る)。動きを減らす設定では、すぐ点いてすぐ塗り替わる(onRevealed は呼ばない。呼ぶ側が待たない)。
 * 進み具合は ProgressBar の数字と role="progressbar" が伝えるので、これは飾り。
 * タイプの絵の形は src/lib/type-sprite から作る(@/data/types と TypeIcon は読まない。16 タイプの文章をブラウザの JS に入れない)。
 */
export function SpriteScreen({ size, litRows = 0, revealCode = null, onRevealed, className }: {
  size: SpriteScreenSize; litRows?: number; revealCode?: string | null; onRevealed?: () => void; className?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const shownRows = useRef(litRows);
  const revealedRef = useRef(onRevealed);
  useEffect(() => {
    revealedRef.current = onRevealed;
  });

  // 新しく点いた行だけ動かす(WAAPI。動かすのは transform だけ)
  useEffect(() => {
    const el = svg.current;
    const from = shownRows.current;
    shownRows.current = litRows;
    if (!el || reduced || litRows <= from) return;
    for (let y = from; y < litRows; y++) {
      el.querySelector(`[data-row="${y}"] [data-lit]`)?.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { duration: LIGHT_MS, easing: "steps(12, end)", fill: "backwards" },
      );
    }
  }, [litRows, reduced]);

  // 最後の答えのあと:上から 1 行ずつタイプの色に塗り替える(動かすのは opacity だけ)
  useEffect(() => {
    const el = svg.current;
    if (!el || !revealCode || reduced) return;
    const anims = [...el.querySelectorAll<SVGGElement>("[data-paint]")].map((g, y) =>
      g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: y * PAINT_ROW_MS, easing: "steps(1, end)", fill: "both" }),
    );
    let cancelled = false;
    Promise.all(anims.map((a) => a.finished)).then(() => { if (!cancelled) revealedRef.current?.(); }, () => {});
    return () => {
      cancelled = true;
      anims.forEach((a) => a.cancel());
    };
  }, [revealCode, reduced]);

  const rows = revealCode ? spriteRows(revealCode) : null;
  const heat = revealCode ? heatOf(revealCode) : "H";
  return (
    <svg ref={svg} viewBox="-1 -1 14 14" width={size} height={size} shapeRendering="crispEdges" aria-hidden className={cn("shrink-0 rounded-rl-sm bg-rl-surface", className)}>
      {Array.from({ length: SPRITE_SIZE }, (_, y) => (
        <g key={y} data-row={y}>
          {Array.from({ length: SPRITE_SIZE }, (_, x) => <rect key={x} x={x + 0.1} y={y + 0.1} width={0.8} height={0.8} fill="var(--rl-surface-2)" />)}
          <rect data-lit x={0} y={y} width={SPRITE_SIZE} height={1} fill="var(--rl-line-strong)" opacity={y < litRows ? 1 : 0}
            style={{ transformBox: "fill-box", transformOrigin: "left" }} />
          {rows && (
            <g data-paint opacity={reduced ? 1 : 0}>
              <rect x={0} y={y} width={SPRITE_SIZE} height={1} fill="var(--rl-surface)" />
              {rows[y].cells.map((c) => <rect key={`${c.role}-${c.x}`} x={c.x} y={c.y} width={c.w} height={c.h} fill={spriteFill(c.role, heat)} />)}
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

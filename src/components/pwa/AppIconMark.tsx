import { GRID } from "@/lib/pwa/app-icon-grid.mjs";
import { cn } from "@/lib/utils";

/** 色の記号 → 役割の色(app-icon-grid.mjs の COLORS と同じ値。tests/pwa/app-icon-mark.test.ts が globals.css と照らす) */
const FILL: Record<string, string> = { M: "fill-rl-highlight", P: "fill-rl-secondary-text" };

/** マスを 1 つずつ置く(8×8 = 1 マス 1 単位。大きさは className の size-* で決める。8 の倍数の px にするとマスがにじまない) */
const CELLS = GRID.flatMap((row, y) => [...row].flatMap((key, x) => (FILL[key] ? [{ x, y, fill: FILL[key] }] : [])));

/**
 * ホーム画面に並ぶアプリのアイコンそのもの(ドット絵の「ロ」。public/icons と同じ絵)。飾りなので読み上げない。
 * 角の丸みは 8 マスのうち 2(64px で 16px = rounded-rl-md)。地は --rl-bg、縁は --rl-line の 1px。
 */
export function AppIconMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden className={cn("block shrink-0", className)} data-app-icon="">
      <rect width="8" height="8" rx="2" className="fill-rl-bg stroke-rl-line" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {CELLS.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" className={c.fill} />
      ))}
    </svg>
  );
}

/**
 * 「ホームの列」:アイコン+線の四角 3 つ(ほかのアプリの場所)の 4×1。1 マス 64px(8px × 8)、間 8px。
 * 幅 280px より狭い画面(320px の端末の /aim のカード)では、線の四角だけが縮む(アイコンは 64px のまま)。
 * 四角は場所を取ったまま隠しておき(開いても並びがずれない)、`group/hint` の中の `<details>` が開いたときだけ見せる。CSS だけ・動きなし。
 * showRow = false(手順を開けない端末)のときは、アイコンだけ。
 */
export function HomeRowArt({ showRow = true, className }: { showRow?: boolean; className?: string }) {
  return (
    <figure className={cn("m-0 grid content-start gap-2", className)}>
      <div className="flex items-start gap-2">
        <AppIconMark className="size-16" />
        {showRow &&
          [0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden
              data-home-slot=""
              className="invisible aspect-square w-16 min-w-0 rounded-rl-md border border-dashed border-rl-line-strong group-has-[details[open]]/hint:visible"
            />
          ))}
      </div>
      <figcaption className="text-xs text-rl-muted">ホームに並ぶアイコン</figcaption>
    </figure>
  );
}

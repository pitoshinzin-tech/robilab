import { cn } from "@/lib/utils";
import { BAR_CELLS, barCells } from "@/lib/aim/stroke-accuracy";

const CELLS = Array.from({ length: BAR_CELLS }, (_, i) => i);

/**
 * 結果の「画ごとの正確さ」を、画ごとに 1 行の 10 マスのバーで(行の頭に画の番号)。
 * いちばんずれた画(worst)だけ --rl-warning で塗り、「ここがずれました」にマゼンタの下線が 1 回引かれる(動きの参考 074。1 画面 1 か所)。
 * 塗りは結果を出したとき 1 回だけ steps(10) で埋まる(動きを減らす設定では止まった形)。
 */
export function StrokeBars({ perStroke, worst }: { perStroke: readonly number[]; worst: number }) {
  return (
    <figure className="grid gap-2">
      <figcaption className="text-sm text-rl-muted">画ごとの正確さ</figcaption>
      <ol className="grid gap-1">
        {perStroke.map((x, i) => {
          const filled = barCells(x);
          const isWorst = i === worst;
          return (
            <li key={i} className="grid grid-cols-[2rem_auto_3.5rem_minmax(0,1fr)] items-center gap-3">
              <span className="text-sm font-bold tabular-nums text-rl-muted">{i + 1}<span className="sr-only">画目</span></span>
              <span aria-hidden className="rl-bar-fill flex gap-0.5">
                {CELLS.map((c) => (
                  <span key={c} className={cn("h-2 w-4", c < filled ? (isWorst ? "bg-rl-warning" : "bg-rl-secondary") : "bg-rl-surface-2")} />
                ))}
              </span>
              <span className="text-right text-sm tabular-nums">{Math.round(x * 100)}%</span>
              {isWorst ? <span className="justify-self-start text-sm text-rl-warning"><span className="rl-marker">ここがずれました</span></span> : <span />}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

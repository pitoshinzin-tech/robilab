import { cn } from "@/lib/utils";
import { progressCells } from "@/lib/diagnosis-progress";

/**
 * 進み具合。数字「3 / 12」(Orbitron・マゼンタ)と、12 個のマスの帯(高さ 8px・間 2px)。
 * 答えた問題のマスはパープルで埋まり、今の問題のマスは薄く点く。埋まるときは 120ms・4 段で左から(width は動かさず transform)。
 * 動きを減らす設定では globals.css の決まりで transition がすぐ終わる。
 */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="grid gap-2">
      <p aria-hidden className="font-display text-base tabular-nums text-rl-highlight">{current} / {total}</p>
      <div role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} aria-label={`${total} 問中 ${current} 問目`}
        className="flex gap-0.5">
        {progressCells(current, total).map((cell, i) => (
          <span key={i} data-cell={cell} className="relative h-2 min-w-0 flex-1 overflow-hidden bg-rl-surface-2">
            <span
              className={cn(
                "absolute inset-0 origin-left bg-rl-secondary transition-transform duration-(--rl-dur-fast) ease-(--rl-ease-pixel)",
                cell === "todo" ? "scale-x-0" : "scale-x-100",
                cell === "now" && "opacity-45",
              )}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

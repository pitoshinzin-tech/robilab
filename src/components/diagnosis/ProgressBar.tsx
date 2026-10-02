import { cn } from "@/lib/utils";
import { progressCells } from "@/lib/diagnosis-progress";
import { NumUnit } from "@/components/ui/num-unit";

/**
 * 進み具合。数字「3 / 12」(NumUnit。今の問題の数は Orbitron・マゼンタの表示用の段、「/ 12」は単位の大きさ)と、12 個のマスの帯(高さ 8px・間 2px)。
 * 答えた問題のマスはパープルで埋まり、今の問題のマスは薄く点く。埋まるときは 120ms・4 段で左から(width は動かさず transform)。
 * 動きを減らす設定では globals.css の決まりで transition がすぐ終わる。
 */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="grid gap-2">
      {/* 採点(最終)の直し:質問の画面の主役の数字。何問目を表示用の段で出す(スマホ display-1・PC display-2) */}
      <p aria-hidden className="leading-none"><NumUnit value={current} unit={`/ ${total}`} className="text-rl-display-1 lg:text-rl-display-2" /></p>
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

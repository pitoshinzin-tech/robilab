import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 追補 6 章:自分と相手の絵を左右に並べ、間を線でつなぐ(線の言葉)。相性 % は線の上、「なぜ合うか」は線の下。
 * drawLine:成立したときだけ、線が 1 回だけ引かれる(300ms。.rl-pair-line)。演出はそれだけ。顔写真・ハートは使わない(出会い系に見せない)。
 * 絵はサーバーで作って渡す。
 */
export function PairFigure({ me, partner, score, reason, drawLine = false, className }: {
  me: ReactNode; partner: ReactNode; score?: number | null; reason?: string | null; drawLine?: boolean; className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3", className)}>
      {me}
      <div className="grid min-w-0 justify-items-center gap-1 text-center">
        {score != null && (
          <p>
            <span className="font-display text-rl-display-1 font-extrabold tabular-nums text-rl-highlight">{score}</span>
            <span className="text-xl">%</span><span className="sr-only">の相性</span>
          </p>
        )}
        <svg aria-hidden viewBox="0 0 100 2" preserveAspectRatio="none" className="h-0.5 w-full">
          <line x1={0} y1={1} x2={100} y2={1} pathLength={1} stroke="var(--rl-line-strong)" strokeWidth={2} vectorEffect="non-scaling-stroke"
            className={drawLine ? "rl-pair-line" : undefined} />
        </svg>
        {reason && <p className="text-sm [word-break:auto-phrase] text-balance">{reason}</p>}
      </div>
      {partner}
    </div>
  );
}

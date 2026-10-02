import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * 追補 6 章:マスのバー。1 マス 8px の四角・間 2px。filled の分だけ塗る。
 * animate のとき、表示したとき 1 回だけ、左から 1 マスずつ埋まる(steps。動きを減らす設定では止まった形)。animate={false} は最初から止まった形。
 * 飾りなので読み上げない(数字は呼ぶ側の文字で伝える)。
 */
export function PixelMeter({ cells, filled, tone = "secondary", animate = true, className }: { cells: number; filled: number; tone?: "secondary" | "highlight"; animate?: boolean; className?: string }) {
  const n = Math.min(cells, Math.max(0, Math.round(filled)));
  return (
    <span aria-hidden className={cn("relative inline-flex gap-0.5", className)}>
      {Array.from({ length: cells }, (_, i) => <span key={i} className="size-2 bg-rl-surface-2" />)}
      {n > 0 && (
        <span className={cn("absolute inset-y-0 left-0 flex gap-0.5", animate && "rl-meter-fill")} style={{ "--rl-meter-steps": n } as CSSProperties}>
          {Array.from({ length: n }, (_, i) => <span key={i} className={cn("size-2", tone === "highlight" ? "bg-rl-highlight" : "bg-rl-secondary")} />)}
        </span>
      )}
    </span>
  );
}

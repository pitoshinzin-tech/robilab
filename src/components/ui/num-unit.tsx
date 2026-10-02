import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 追補 4-4:数字 + 単位の組み。数字は Orbitron 800(マゼンタ・桁をそろえる)、単位は Zen Kaku 700 で数字の 0.4 倍、
 * ベースラインをそろえ、間は 0.15em。単位はマゼンタにしない。大きさは className の text-* で決める。
 * muted:本人の値ではない数(未入力のときの平均など)。マゼンタにせず補足の色で出す。
 */
export function NumUnit({ value, unit, className, muted = false }: { value: React.ReactNode; unit: string; className?: string; muted?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline", className)}>
      <span className={cn("font-display font-extrabold tabular-nums", muted ? "text-rl-muted" : "text-rl-highlight")}>{value}</span>
      <span className={cn("ml-[0.15em] text-[0.4em] font-bold", muted ? "text-rl-muted" : "text-rl-text")}>{unit}</span>
    </span>
  );
}

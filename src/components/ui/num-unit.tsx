import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 追補 4-4:数字 + 単位の組み。数字は Orbitron 800(マゼンタ・桁をそろえる)、単位は Zen Kaku 700 で数字の 0.4 倍、
 * ベースラインをそろえ、間は 0.15em。単位はマゼンタにしない。大きさは className の text-* で決める。
 */
export function NumUnit({ value, unit, className }: { value: React.ReactNode; unit: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline", className)}>
      <span className="font-display font-extrabold tabular-nums text-rl-highlight">{value}</span>
      <span className="ml-[0.15em] text-[0.4em] font-bold text-rl-text">{unit}</span>
    </span>
  );
}

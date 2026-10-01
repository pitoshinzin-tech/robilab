import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 読み込み中の面(中身と同じ大きさ・角丸で置く)。動きを減らす設定では明滅しない。
 * (追補 6 章)pixel:明るさの明滅の代わりに、8px のマスが左から 1 段ずつ点く形(重さは同じ。CSS だけ)。
 */
export function Skeleton({ className, pixel = false, ...props }: React.ComponentProps<"div"> & { pixel?: boolean }) {
  return <div aria-hidden data-slot="skeleton" className={cn(pixel ? "rl-skeleton-pixel" : "rl-skeleton", "rounded-rl-sm bg-rl-surface-2", className)} {...props} />;
}

/** Skeleton のまとまり。読み上げには「読み込み中」だけを伝える。 */
export function LoadingRegion({ label = "読み込み中", className, children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">{label}</span>
      {children}
    </div>
  );
}

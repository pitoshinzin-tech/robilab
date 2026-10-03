import { cn } from "@/lib/utils";

/**
 * 選んでいないチップの印:チェックと同じ 16px の場所に、8px の線の四角(枠だけ)。
 * 文字の前に「マス」が見えるので、チェックの場所の空きに理由ができ、選ぶとチェックに替わっても幅が変わらない。読み上げない(aria-hidden)。
 */
export function ChipBox({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center", className)}>
      <span className="size-2 border border-rl-line-strong" />
    </span>
  );
}

import { cn } from "@/lib/utils";

/** 行の頭に 8px のパープルの四角を付けた短い箇条書き(マスの言葉)。トップ・/aim の遊び方と、診断の始める画面で共通。 */
export function SquareList({ items, className, itemClassName }: { items: readonly string[]; className?: string; itemClassName?: string }) {
  return (
    <ul className={cn("grid gap-2", className)}>
      {items.map((line) => (
        <li key={line} className={cn("flex items-center gap-3 text-base", itemClassName)}>
          <span aria-hidden className="size-2 shrink-0 bg-rl-secondary" />
          {line}
        </li>
      ))}
    </ul>
  );
}

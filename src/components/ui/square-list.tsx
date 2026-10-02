import { cn } from "@/lib/utils";

/** 行の頭に 8px のパープルの四角を付けた短い箇条書き(マスの言葉)。トップ・/aim の遊び方と、診断の始める画面で共通。 */
export function SquareList({ items, className, itemClassName }: { items: readonly string[]; className?: string; itemClassName?: string }) {
  return (
    <ul className={cn("grid gap-2", className)}>
      {items.map((line) => (
        <li key={line} className={cn("flex items-start gap-3 text-base", itemClassName)}>
          {/* 1 行目の真ん中に置く(2 行に折れても印が行の間に浮かない) */}
          <span aria-hidden className="mt-[calc((1lh_-_8px)/2)] size-2 shrink-0 bg-rl-secondary" />
          {line}
        </li>
      ))}
    </ul>
  );
}

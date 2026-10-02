import { cn } from "@/lib/utils";
import { HOW_TO_PLAY } from "@/lib/aim/how-to-play";

/** 遊び方の 3 行(行の頭に 8px のパープルの四角)。トップと /aim で共通。 */
export function HowToPlay({ className }: { className?: string }) {
  return (
    <ul className={cn("grid gap-2", className)}>
      {HOW_TO_PLAY.map((line) => (
        <li key={line} className="flex items-center gap-3 text-base">
          <span aria-hidden className="size-2 shrink-0 bg-rl-secondary" />
          {line}
        </li>
      ))}
    </ul>
  );
}

import { HOW_TO_PLAY } from "@/lib/aim/how-to-play";
import { SquareList } from "@/components/ui/square-list";

/** 遊び方の 3 行(行の頭に 8px のパープルの四角)。トップと /aim で共通。 */
export function HowToPlay({ className }: { className?: string }) {
  return <SquareList items={HOW_TO_PLAY} className={className} />;
}

import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

/** 名刺のページの読み込み中(設計書 3-11)。見出し・画像の枠・説明・ボタンを、できあがりと同じ大きさで置く。 */
export default function Loading() {
  return (
    <main className={pageContainerClass("narrow")}>
      <LoadingRegion label="名刺を読み込み中" className="grid gap-6">
        <Skeleton className="h-10 w-56 max-w-full" />
        <Skeleton className="aspect-[1200/630] w-full rounded-rl-md" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-12 w-48 rounded-rl-pill" />
      </LoadingRegion>
    </main>
  );
}

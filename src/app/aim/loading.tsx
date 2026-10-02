import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

/** page.tsx と同じ形:見出しの帯(左に漢字と縦組み、右に遊び方の 3 行と 1 位)・遊ぶ面・ランキングの 5 行 */
export default function Loading() {
  return (
    <main className={pageContainerClass("wide")}>
      <LoadingRegion label="今日の文字を読み込み中" className="grid">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="flex items-start gap-4 md:gap-6 lg:col-span-7">
            <Skeleton className="size-(--rl-text-display-3)" />
            <Skeleton className="h-40 w-12" />
          </div>
          <div className="grid gap-4 lg:col-span-5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-6 w-64 max-w-full" />)}
            <Skeleton className="h-14 w-48" />
          </div>
        </div>
        <Skeleton className="mt-rl-ma-sm aspect-video w-full rounded-rl-md" />
        <div className="mt-rl-ma-md grid gap-2">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
        </div>
      </LoadingRegion>
    </main>
  );
}

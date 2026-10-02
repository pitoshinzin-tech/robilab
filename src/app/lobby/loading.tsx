import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

/** ロビーの読み込み中(見出し・絞り込み・札 3 枚。中身と同じ大きさで置く) */
export default function Loading() {
  return (
    <main className={pageContainerClass("wide")}>
      <LoadingRegion label="ロビーを読み込み中" className="grid gap-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-12 w-full md:max-w-[640px] lg:max-w-none" />
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-rl-md" />)}
        </div>
      </LoadingRegion>
    </main>
  );
}

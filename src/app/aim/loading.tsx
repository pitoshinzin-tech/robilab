import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <main className={pageContainerClass("wide")}>
      <LoadingRegion label="今日の文字を読み込み中" className="grid gap-8">
        <div className="flex items-start gap-4">
          <Skeleton className="size-(--rl-text-display-3)" />
          <Skeleton className="h-40 w-12" />
        </div>
        <Skeleton className="aspect-video w-full rounded-rl-md" />
        <div className="grid gap-2">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
        </div>
      </LoadingRegion>
    </main>
  );
}

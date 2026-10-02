import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

/** 通知の読み込み中(見出しと 3 つのまとまり。中身と同じ大きさで置く) */
export default function Loading() {
  return (
    <main className={pageContainerClass("narrow")}>
      <LoadingRegion label="通知を読み込み中" className="grid gap-6">
        <Skeleton className="h-10 w-32" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-28 w-full rounded-rl-md" /></div>
        ))}
      </LoadingRegion>
    </main>
  );
}

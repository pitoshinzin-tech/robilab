import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <main className={pageContainerClass("narrow")}>
      <LoadingRegion label="プロフィールを読み込み中" className="grid gap-6">
        <Skeleton className="h-10 w-40" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="grid gap-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-12 w-full" /></div>)}
      </LoadingRegion>
    </main>
  );
}

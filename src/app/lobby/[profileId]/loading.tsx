import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { pageContainerClass } from "@/components/ui/page-shell";

/** プレイヤーのプロフィールの読み込み中(戻るリンク・名前・2 人の絵・札・主ボタン。中身と同じ大きさで置く) */
export default function Loading() {
  return (
    <main className={pageContainerClass("narrow")}>
      <LoadingRegion label="プロフィールを読み込み中" className="grid gap-6">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-rl-md" />
        <Skeleton className="h-14 w-full rounded-rl-pill md:w-64" />
      </LoadingRegion>
    </main>
  );
}

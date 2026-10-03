"use client";
import { useDeferredValue } from "react";
import { useIsClient } from "@/lib/use-is-client";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { MySettingsEditor } from "./MySettingsEditor";

/** localStorage はブラウザでしか読めないので、ハイドレーションが終わってからエディターを出す。読み込み中は項目と名刺の形を置く。 */
export function MySettingsClient() {
  // 表示速度(docs/design/perf.md):エディターの最初の描画は大きい(CPU が遅い端末で 1 回 0.5 秒ほどの長い処理になっていた)。
  // useDeferredValue で後回しの描画にすると、React が途中で手を離せるので、長い処理に分かれず、入力や描画を止めない。中身は同じ。
  const isClient = useDeferredValue(useIsClient(), false);
  if (!isClient) return (
    <LoadingRegion label="マイ設定を読み込み中" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <Skeleton className="h-7 w-56 lg:col-span-2" />
      <Skeleton className="aspect-[1200/630] w-full rounded-rl-md lg:col-start-2 lg:row-start-2" />
      <div className="grid gap-6 lg:col-start-1 lg:row-start-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-rl-md" />)}</div>
    </LoadingRegion>
  );
  return <MySettingsEditor />;
}

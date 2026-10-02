"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

type Phase = "loading" | "loaded" | "failed";

/**
 * 名刺の画像(設計書 3-11)。読み込むまでは同じ大きさの Skeleton が後ろに見え、失敗したら枠の中でもう一度読める。
 * 画像そのもの(opengraph-image)は今回の対象外(読み替え 12)。ここは枠と状態だけ。
 */
export function CardImageFrame({ slug }: { slug: string }) {
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const src = `/c/${slug}/opengraph-image${attempt > 0 ? `?r=${attempt}` : ""}`;
  const failed = phase === "failed";
  return (
    // 失敗のときは overflow を切らない:aspect-ratio の箱は中身が高ければ伸びる(375px でボタンが切れない)
    <div className={cn("relative aspect-[1200/630] w-full rounded-rl-md border border-rl-line bg-rl-surface", failed ? "grid place-items-center p-4" : "overflow-hidden")}>
      {failed ? (
        <ErrorState compact title="画像を読み込めませんでした" message="通信状態を確かめて、もう一度お試しください。"
          onRetry={() => { setPhase("loading"); setAttempt((n) => n + 1); }} />
      ) : (
        <>
          {phase === "loading" && <Skeleton className="absolute inset-0 rounded-none" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- 動的な OG 画像をそのまま見せる */}
          <img key={src} src={src} alt="名刺カード" width={1200} height={630} className="relative h-full w-full object-cover"
            // ハイドレーションより前に読み終わった・失敗していたときも拾う(イベントを取りこぼすため)
            ref={(img) => { if (img?.complete) setPhase(img.naturalWidth === 0 ? "failed" : "loaded"); }}
            onLoad={() => setPhase("loaded")}
            onError={() => setPhase("failed")} />
        </>
      )}
    </div>
  );
}

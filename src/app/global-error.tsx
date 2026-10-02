"use client"; // Error boundaries must be Client Components

import "./globals.css";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

/**
 * 設計書 3-14:ルートのレイアウトが壊れたときの画面。レイアウトの代わりに自分で <html><body> と globals.css を持つ
 * (error.md の global-error)。next/font は読み込まれないので system-ui。metadata は使えないので React の <title>。
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="ja">
      <body className="antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
        <title>表示できませんでした|ロビラボ</title>
        <main className="mx-auto grid min-h-dvh w-full max-w-[688px] place-items-center px-4">
          <ErrorState titleAs="h1" message="通信状態を確認して、もう一度お試しください。直らないときは、トップから開き直してください。" onRetry={() => retry()} showHome />
        </main>
      </body>
    </html>
  );
}

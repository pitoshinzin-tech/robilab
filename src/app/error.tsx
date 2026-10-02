"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { pageContainerClass } from "@/components/ui/page-shell";

/** 設計書 3-14:ErrorState(もう一度試す+トップへ戻る)。Next 16.3 の復帰は retry(error.md) */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className={pageContainerClass("narrow")}>
      <ErrorState titleAs="h1" message="通信状態を確認して、もう一度お試しください。直らないときは、トップから開き直してください。" onRetry={() => retry()} showHome />
    </main>
  );
}

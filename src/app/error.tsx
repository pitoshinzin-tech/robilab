"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid max-w-md gap-4 px-4 py-10 text-center">
      <p className="text-sm text-[var(--rl-muted)]">
        うまく表示できませんでした。通信状態を確認して、もう一度お試しください。
      </p>
      <div>
        <button
          type="button"
          onClick={() => reset()}
          className="h-12 rounded-full bg-[var(--rl-accent)] px-6 font-bold text-[var(--rl-on-accent)]"
        >
          もう一度試す
        </button>
      </div>
    </main>
  );
}

"use client";
import { useState, useTransition } from "react";
import { blockAction } from "@/app/lobby/actions";

export function BlockButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <button type="button" disabled={pending}
        onClick={() => {
          if (confirm("この人をブロックしますか?おたがいに表示されなくなります。")) {
            start(async () => {
              const res = await blockAction(id);
              if (res?.error) setError(res.error);
            });
          }
        }}
        className="text-sm text-[var(--rl-muted)] underline">
        ブロックする
      </button>
      {error && <p role="alert" className="text-sm text-[var(--rl-magenta)]">{error}</p>}
    </div>
  );
}

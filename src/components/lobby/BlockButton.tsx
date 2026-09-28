"use client";
import { useTransition } from "react";
import { blockAction } from "@/app/lobby/actions";

export function BlockButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending}
      onClick={() => { if (confirm("この人をブロックしますか?おたがいに表示されなくなります。")) start(async () => { await blockAction(id); }); }}
      className="text-sm text-[var(--rl-muted)] underline">
      ブロックする
    </button>
  );
}

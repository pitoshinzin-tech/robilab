"use client";
import { useState, useTransition } from "react";
import { sendApproachAction } from "@/app/lobby/actions";

export function ApproachButton({ id }: { id: string }) {
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [pending, start] = useTransition();
  const done = Boolean(msg.ok);
  return (
    <div className="grid gap-2">
      <button type="button" disabled={pending || done} onClick={() => start(async () => setMsg(await sendApproachAction(id)))}
        className="h-12 rounded-full bg-[var(--rl-accent)] font-bold text-[var(--rl-on-accent)] disabled:opacity-50">
        {done ? "声をかけました" : "一緒にやりたい!"}
      </button>
      {msg.error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{msg.error}</p>}
      {msg.ok && <p className="text-sm text-[var(--rl-lime)]">{msg.ok}</p>}
    </div>
  );
}

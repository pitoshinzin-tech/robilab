"use client";
import { useState, useTransition } from "react";
import { Check, Send, TriangleAlert } from "lucide-react";
import { sendApproachAction } from "@/app/lobby/actions";
import { lobbyErrorMessage } from "@/lib/lobby-errors";
import { PlainButton } from "@/components/ui/plain-button";
import { FieldError } from "@/components/ui/field";

/** 「一緒にやりたい!」(この画面の主ボタン)。送っている間は loading、送れたらライムの文、上限なら黄色の注意。 */
export function ApproachButton({ id }: { id: string }) {
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [pending, start] = useTransition();
  const done = Boolean(msg.ok);
  const limit = msg.error === lobbyErrorMessage("DAILY_LIMIT");
  return (
    <div className="grid gap-2">
      <PlainButton variant="primary" size="lg" className="w-full md:w-auto md:justify-self-start" loading={pending} loadingText="送信中…" disabled={done}
        onClick={() => start(async () => setMsg(await sendApproachAction(id)))}>
        <Send aria-hidden />{done ? "声をかけました" : "一緒にやりたい!"}
      </PlainButton>
      {msg.error && (limit
        ? <p role="alert" className="flex items-start gap-2 text-sm text-rl-warning"><TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /><span className="min-w-0">{msg.error}</span></p>
        : <FieldError>{msg.error}</FieldError>)}
      {msg.ok && <p role="status" className="flex items-start gap-2 text-sm text-rl-success"><Check aria-hidden className="mt-0.5 size-4 shrink-0" /><span className="min-w-0">{msg.ok}</span></p>}
    </div>
  );
}

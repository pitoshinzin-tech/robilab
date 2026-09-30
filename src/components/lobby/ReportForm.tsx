"use client";
import { useState, useTransition } from "react";
import { reportAction } from "@/app/lobby/actions";

const REASONS = [
  { id: "harassment", label: "迷惑行為・暴言" },
  { id: "age_fake", label: "年齢を偽っている" },
  { id: "dating", label: "出会い目的" },
  { id: "spam", label: "勧誘・宣伝" },
  { id: "other", label: "その他" },
];

export function ReportForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("harassment");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-sm text-[var(--rl-muted)] underline">通報する</button>;
  return (
    <div className="grid gap-2 rounded-xl border border-white/10 p-4 text-sm">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="rounded bg-[var(--rl-card)] px-2 py-2">
        {REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={200} placeholder="くわしい内容(任意・200文字まで)" className="rounded bg-[var(--rl-card)] p-2" />
      <p className="text-xs text-[var(--rl-muted)]">通報すると、この人はあなたには表示されなくなり(ブロック)、運営が内容を確認します。年齢詐称の通報は、確認が終わるまで相手が利用停止になります。嫌がらせ目的の通報はご遠慮ください。</p>
      {error && <p role="alert" className="text-[var(--rl-danger)]">{error}</p>}
      <button type="button" disabled={pending} onClick={() => start(async () => setError((await reportAction(id, reason, detail)).error))}
        className="h-10 rounded-full bg-white/15 font-bold">通報を送る</button>
    </div>
  );
}

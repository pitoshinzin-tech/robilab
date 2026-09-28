"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { respondAction } from "@/app/lobby/actions";
import type { InboxRow } from "@/lib/lobby-types";
import { discordProfileUrl } from "@/lib/discord-link";

export function InboxList({ rows }: { rows: InboxRow[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const received = rows.filter((r) => r.kind === "received");
  const matched = rows.filter((r) => r.kind === "matched");
  const sent = rows.filter((r) => r.kind === "sent");
  const respond = (id: string, accept: boolean) =>
    start(async () => {
      const res = await respondAction(id, accept);
      setDone((d) => ({ ...d, [id]: res.error ?? res.ok ?? "" }));
    });
  return (
    <div className="grid gap-8">
      <section>
        <h2 className="mb-3 font-bold">届いた声かけ</h2>
        {received.length === 0 ? <p className="text-sm text-[var(--rl-muted)]">まだありません。</p> : (
          <ul className="grid gap-3">
            {received.map((r) => (
              <li key={r.approach_id} className="rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4">
                <Link href={`/lobby/${r.partner_id}`} className="font-bold underline">{r.nickname}</Link>
                <span className="ml-2 text-xs text-[var(--rl-magenta)]">{r.type_code ?? ""}</span>
                <p className="text-sm">「一緒にやりたい!」が届きました</p>
                {done[r.approach_id] ? <p className="mt-2 text-sm text-[var(--rl-lime)]">{done[r.approach_id]}</p> : (
                  <div className="mt-3 flex gap-3">
                    <button disabled={pending} onClick={() => respond(r.approach_id, true)} className="h-10 flex-1 rounded-full bg-[var(--rl-cyan)] font-bold text-[#0a0c16]">OK</button>
                    <button disabled={pending} onClick={() => respond(r.approach_id, false)} className="h-10 flex-1 rounded-full bg-white/10">今回はパス</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-bold">つながった相手</h2>
        {matched.length === 0 ? <p className="text-sm text-[var(--rl-muted)]">まだいません。</p> : (
          <ul className="grid gap-3">
            {matched.map((r) => {
              const profileUrl = discordProfileUrl(r.discord_user_id);
              return (
                <li key={r.approach_id} className="rounded-xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
                  <div className="font-bold">{r.nickname}</div>
                  {profileUrl && (
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex h-10 items-center rounded-full bg-[var(--rl-cyan)] px-4 text-sm font-bold text-[#0a0c16]">
                      Discord のプロフィールを開く
                    </a>
                  )}
                  <div className="mt-2 text-sm">登録時の Discord 名:<b className="select-all text-[var(--rl-cyan)]">{r.discord_username}</b></div>
                  <p className="mt-1 text-xs text-[var(--rl-muted)]">
                    プロフィールからフレンド申請して、一緒に遊ぼう。名前は変わることがあるので、申請前にプロフィールで本人か確かめてね。
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-bold">送った声かけ</h2>
        {sent.length === 0 ? <p className="text-sm text-[var(--rl-muted)]">まだありません。</p> : (
          <ul className="grid gap-2 text-sm">
            {sent.map((r) => <li key={r.approach_id}>{r.nickname} — {r.status === "pending" ? "返事待ち" : "期限切れ"}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";
import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Check, ExternalLink, Inbox } from "lucide-react";
import { respondAction } from "@/app/lobby/actions";
import type { InboxRow } from "@/lib/lobby-types";
import { discordProfileUrl } from "@/lib/discord-link";
import { NAV_FORWARD } from "@/lib/motion/vt-names";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor } from "@/components/ui/button-link";
import { PlainButton } from "@/components/ui/plain-button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { PairFigure } from "@/components/lobby/PairFigure";

type Done = { ok: boolean; text: string };

/** (追補 6 章)絵はサーバーで作って icons で受け取る(タイプのコード → 48px の絵)。ないときは空の四角 */
const noIcon = <span aria-hidden className="size-12 shrink-0 rounded-rl-sm bg-rl-surface-2" />;

/**
 * 通知の 3 つのまとまり(届いた・つながった・送った)。届いた声かけは押した行のボタンだけ loading、ほかは押せない見た目。
 * この画面で自動で動くのは、つながった相手の行の線が 1 回だけ引かれることだけ。
 * 届いた声かけの絵は、名前のリンクにホバー・フォーカスすると上から 4 段で塗り替わる(動きの参考 025。CSS だけ)。
 */
export function InboxList({ rows, icons, myType }: { rows: InboxRow[]; icons: Record<string, ReactNode>; myType: string | null }) {
  const iconOf = (code: string | null) => (code && icons[code]) || noIcon;
  const [done, setDone] = useState<Record<string, Done>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const received = rows.filter((r) => r.kind === "received");
  const matched = rows.filter((r) => r.kind === "matched");
  const sent = rows.filter((r) => r.kind === "sent");
  const respond = (id: string, accept: boolean) => {
    setBusy(`${id}:${accept}`);
    start(async () => {
      try {
        const res = await respondAction(id, accept);
        setDone((d) => ({ ...d, [id]: res.error ? { ok: false, text: res.error } : { ok: true, text: res.ok ?? "" } }));
      } finally {
        // 通信が落ちて throw しても、押した行の loading を必ず戻す(エラーは一番近い error.tsx へ)
        setBusy(null);
      }
    });
  };
  return (
    <div className="grid gap-12">
      <section aria-labelledby="inbox-received" className="grid gap-4">
        <SectionHeading id="inbox-received" title="届いた声かけ" count={received.length} />
        {received.length === 0 ? <EmptyState icon={Inbox} title="まだありません。" /> : (
          <ul className="grid gap-3">
            {received.map((r) => (
              <Card as="li" key={r.approach_id} className="grid gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                  <Link href={`/lobby/${r.partner_id}`} transitionTypes={[NAV_FORWARD]} className="rl-dissolve-host inline-flex min-h-11 min-w-0 items-center gap-3 rounded-rl-sm text-base font-bold text-rl-accent underline-offset-4 hover:underline">
                    {iconOf(r.type_code)}
                    <span data-long-name className="min-w-0 wrap-anywhere">{r.nickname}</span>
                  </Link>
                  {r.type_code && <Badge variant="code">{r.type_code}</Badge>}
                </div>
                <p className="text-base">「一緒にやりたい!」が届きました</p>
                {done[r.approach_id] ? (
                  <p role="status" className={done[r.approach_id].ok ? "text-sm text-rl-success" : "text-sm text-rl-danger"}>{done[r.approach_id].text}</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <PlainButton variant="secondary" size="sm" fixedWidth disabled={pending} loading={busy === `${r.approach_id}:true`} loadingText="送信中…" onClick={() => respond(r.approach_id, true)}><Check aria-hidden />OK</PlainButton>
                    <PlainButton variant="ghost" size="sm" fixedWidth disabled={pending} loading={busy === `${r.approach_id}:false`} loadingText="送信中…" onClick={() => respond(r.approach_id, false)}>今回はパス</PlainButton>
                  </div>
                )}
              </Card>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="inbox-matched" className="grid gap-4">
        <SectionHeading id="inbox-matched" title="つながった相手" count={matched.length} />
        {matched.length === 0 ? <EmptyState icon={Inbox} title="まだいません。" /> : (
          <ul className="grid gap-3">
            {matched.map((r) => {
              const profileUrl = discordProfileUrl(r.discord_user_id);
              return (
                <Card as="li" key={r.approach_id} className="grid gap-3">
                  {/* 追補 6 章:成立した行だけ、2 つの絵の間の線が 1 回だけ引かれる */}
                  <PairFigure className="max-w-[320px]" me={iconOf(myType)} partner={iconOf(r.type_code)} drawLine />
                  <p data-long-name className="text-base font-bold wrap-anywhere">{r.nickname}</p>
                  {r.discord_username && (
                    <p className="min-w-0 text-sm">登録時の Discord 名:<b className="select-all text-base text-rl-text wrap-anywhere">{r.discord_username}</b></p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    {r.discord_username && <CopyButton text={r.discord_username} label="Discord 名をコピー" size="sm" />}
                    {profileUrl && <ButtonAnchor href={profileUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">Discord のプロフィールを開く<ExternalLink aria-hidden className="size-4" /></ButtonAnchor>}
                  </div>
                  <p className="text-sm text-rl-muted">プロフィールからフレンド申請して、一緒に遊ぼう。名前は変わることがあるので、申請前にプロフィールで本人か確かめてね。</p>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby="inbox-sent" className="grid gap-4">
        <SectionHeading id="inbox-sent" title="送った声かけ" count={sent.length} />
        {sent.length === 0 ? <EmptyState icon={Inbox} title="まだありません。" /> : (
          <ul className="grid gap-2">
            {sent.map((r) => (
              <li key={r.approach_id} className="flex min-w-0 items-center justify-between gap-3 rounded-rl-sm bg-rl-surface px-4 py-3 text-base">
                <span data-long-name className="min-w-0 wrap-anywhere">{r.nickname}</span>
                <span className="shrink-0 text-sm text-rl-muted">{r.status === "pending" ? "返事待ち" : "期限切れ"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

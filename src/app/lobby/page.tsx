import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell as BellIcon, Check, Inbox, ShieldCheck, UserRound } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertNoRpcError } from "@/lib/lobby-errors";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { LoginButton } from "@/components/lobby/LoginButton";
import { CandidateCard } from "@/components/lobby/CandidateCard";
import { AccountStatusNotice } from "@/components/lobby/AccountStatusNotice";
import { LobbyFilters } from "@/components/lobby/LobbyFilters";
import { PairFigure } from "@/components/lobby/PairFigure";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { sortAndFilter } from "@/lib/lobby-sort";
import type { Candidate } from "@/lib/lobby-types";
import type { Axes } from "@/data/axes";

export const metadata: Metadata = { title: "仲間を探す" };

type Props = { searchParams: Promise<{ game?: string; slot?: string; voice?: string; login?: string; reported?: string }> };

const STEPS = [
  "Discord でログイン(18 歳以上)",
  "気になる人に「一緒にやりたい!」を送る(1 日 10 人まで)",
  "おたがいが OK したら Discord 名が見える",
];
const SAFETY = [
  "Discord 名は、おたがいが OK するまでだれにも見えません",
  "パスしても相手には伝わりません",
  "ブロック・通報ができます",
  "生年月日は公開しません",
];

type MyProfileRow = { status: "active" | "suspended" | "banned"; axes: Axes | null };

export default async function LobbyPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageShell title="仲間を探す" description={<span className="block [word-break:auto-phrase] text-balance">Discord でログインして、一緒に遊ぶ人を見つけよう。</span>}>
        <div className="grid gap-8">
          {/*
            追補 6 章:流れの 3 段を線でつないだ 3 つの点(待合室の掲示板)。点は 8px のマス、線は 2px。PC は横、スマホは縦。
            線は段ごとに「自分の点 → 次の点」の 1 本(スマホ:点の中心 12px から、間 24px+次の点の中心 12px = 36px 下まで。
            PC:点の中心 4px から、間 16px+次の点の中心 4px = 20px 右まで)。開いたとき 1 回だけ引かれる(rl-flow-*、動きの参考 012)。
          */}
          <ol aria-label="使い方の流れ" className="grid gap-6 md:grid-cols-3 md:gap-4">
            {STEPS.map((s, i) => (
              <li key={s} className="relative grid grid-cols-[8px_minmax(0,1fr)] content-start gap-4 md:grid-cols-1" style={{ "--i": i } as React.CSSProperties}>
                {i < STEPS.length - 1 && (
                  <span aria-hidden className="rl-flow-seg absolute top-3 -bottom-9 left-[3px] w-0.5 bg-rl-line-strong md:top-[3px] md:-right-5 md:bottom-auto md:left-1 md:h-0.5 md:w-auto" />
                )}
                <span aria-hidden className="rl-flow-dot relative mt-2 size-2 bg-rl-highlight md:mt-0" />
                <span className="grid gap-2 text-base">
                  <span className="font-display text-rl-display-1 leading-none font-extrabold tabular-nums text-rl-highlight">{i + 1}</span>
                  <span className="[word-break:auto-phrase] text-balance">{s}</span>
                </span>
              </li>
            ))}
          </ol>
          {/*
            ロビーの中身の見本(ログイン前でも、成立すると 2 人の絵が線でつながることが分かる)。相性 % は作り物の数に見えるので出さない。
            線は引く動きを付けない(この画面の線の見せ場は上の流れの 1 つだけ)。
          */}
          <figure className="grid gap-3 border-t border-rl-line pt-6">
            <figcaption className="text-xs font-bold text-rl-muted">見本</figcaption>
            <PairFigure className="max-w-[480px]" me={<TypeIcon code="ARCH" size={64} />} partner={<TypeIcon code="GBLH" size={64} />}
              reason="おたがいが OK すると線がつながる" />
          </figure>
          {/* 箱(Card)にしない(追補 5-3:箱は押せる一覧・入力・プレイヤーの札だけ)。上の線で区切る */}
          <section aria-labelledby="safety-heading" className="grid gap-4 border-t border-rl-line pt-6">
            <h2 id="safety-heading" className="text-xl font-bold">安心して使うために</h2>
            <ul className="grid gap-2">
              {SAFETY.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-rl-success" />
                  <span className="min-w-0">{s}</span>
                </li>
              ))}
            </ul>
          </section>
          {sp.login === "failed" && <p role="alert" className="text-sm text-rl-danger">ログインできませんでした。もう一度お試しください。</p>}
          <LoginButton next="/lobby" size="lg" className="justify-self-start" />
        </div>
      </PageShell>
    );
  }

  const meRows = assertNoRpcError(await supabase.rpc("my_profile"));
  const me = (meRows as MyProfileRow[] | null)?.[0];
  if (!me) redirect("/lobby/join");
  if (me.status !== "active") return <AccountStatusNotice status={me.status} />;

  const data = assertNoRpcError(await supabase.rpc("lobby_candidates"));
  const rows = sortAndFilter({ axes: me.axes }, (data ?? []) as Candidate[], { game: sp.game, slot: sp.slot, voice: sp.voice === "1" });

  const filtered = Boolean(sp.game || sp.slot || sp.voice === "1");

  return (
    <PageShell
      width="wide"
      title="ロビー"
      actions={
        <>
          {/* 件数は出さない(ヘッダーのベルが出す。設計書との読み替え 8) */}
          <ButtonLink href="/lobby/inbox" variant="secondary" size="icon" aria-label="通知"><BellIcon aria-hidden /></ButtonLink>
          <ButtonLink href="/lobby/me" variant="secondary" size="icon" aria-label="プロフィール"><UserRound aria-hidden /></ButtonLink>
        </>
      }
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:max-w-[640px] lg:max-w-none">
          {sp.reported && (
            <p role="status" className="flex items-start gap-2 text-sm text-rl-success">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
              通報を受け付けました。ご協力ありがとうございます。
            </p>
          )}
          <LobbyFilters game={sp.game} slot={sp.slot} voice={sp.voice === "1"} />
        </div>
        {rows.length === 0 ? (
          filtered ? (
            <EmptyState icon={Inbox} title="条件に合う人がまだいません" description="ゲームや時間帯を増やすと見つかりやすくなります。"
              action={<ButtonLink href="/lobby" variant="secondary">条件をゆるめる</ButtonLink>} />
          ) : (
            // 絞り込みなしで 0 人のときは「ゆるめる」条件がないので、プロフィールへ案内する
            <EmptyState icon={Inbox} title="ロビーにまだ人がいません" description="新しい人が入ると、ここに相性の順で出ます。"
              action={<ButtonLink href="/lobby/me" variant="secondary">プロフィールを見直す</ButtonLink>} />
          )
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => <li key={r.candidate.id} className="min-w-0"><CandidateCard c={r.candidate} match={r.match} /></li>)}
          </ul>
        )}
      </div>
    </PageShell>
  );
}

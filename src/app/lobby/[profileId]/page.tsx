import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertNoRpcError } from "@/lib/lobby-errors";
import { peopleScore } from "@/lib/people-match";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { CandidateCard } from "@/components/lobby/CandidateCard";
import { PairFigure } from "@/components/lobby/PairFigure";
import { ApproachButton } from "@/components/lobby/ApproachButton";
import { BlockButton } from "@/components/lobby/BlockButton";
import { ReportForm } from "@/components/lobby/ReportForm";
import { AccountStatusNotice } from "@/components/lobby/AccountStatusNotice";
import { ButtonLink } from "@/components/ui/button-link";
import { PageShell } from "@/components/ui/page-shell";
import { isUuid } from "@/lib/uuid";
import type { Candidate } from "@/lib/lobby-types";
import type { Axes } from "@/data/axes";

type MyProfileRow = { status: "active" | "suspended" | "banned"; axes: Axes | null; type_code: string | null };

export default async function ProfilePage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  if (!isUuid(profileId)) notFound();
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");
  const meRows = assertNoRpcError(await supabase.rpc("my_profile"));
  const me = (meRows as MyProfileRow[] | null)?.[0];
  if (!me) redirect("/lobby/join");
  if (me.status !== "active") return <AccountStatusNotice status={me.status} />;
  const data = assertNoRpcError(await supabase.rpc("get_profile", { p_id: profileId }));
  const c = (data as Candidate[] | null)?.[0];
  if (!c) notFound();
  const match = me.axes && c.axes ? peopleScore(me.axes, c.axes) : null;
  // 追補 6 章:自分と相手の絵を左右に並べる(絵はサーバーで作る)。未診断の側は空の四角
  const figure = (code: string | null | undefined, caption: string) => (
    <figure className="grid justify-items-center gap-1">
      {code ? <TypeIcon code={code} size={64} /> : <span aria-hidden className="size-16 rounded-rl-sm bg-rl-surface-2" />}
      <figcaption data-long-name className="max-w-24 truncate text-sm text-rl-muted">{caption}</figcaption>
    </figure>
  );
  return (
    <PageShell title={c.nickname} back={{ href: "/lobby", label: "ロビーへ" }}>
      <div className="grid gap-6">
        <PairFigure className="max-w-[480px]" me={figure(me.type_code, "あなた")} partner={figure(c.type_code, c.nickname)}
          score={match?.score ?? null} reason={match?.reasons[0] ?? null} />
        <CandidateCard c={c} match={match} link={false} />
        {c.type_code && (
          <ButtonLink href={`/type/${c.type_code}`} variant="ghost" size="sm" className="justify-self-start">{c.type_code} タイプの説明を見る</ButtonLink>
        )}
        <ApproachButton id={c.id} />
        <p className="text-sm text-rl-muted">相手が OK すると、おたがいの Discord 名が通知に表示されます。</p>
        <section aria-labelledby="trouble-heading" className="grid gap-3 border-t border-rl-line pt-6">
          <h2 id="trouble-heading" className="text-xl font-bold">困ったとき</h2>
          <div className="flex flex-wrap items-start gap-3"><BlockButton id={c.id} /><ReportForm id={c.id} /></div>
        </section>
      </div>
    </PageShell>
  );
}

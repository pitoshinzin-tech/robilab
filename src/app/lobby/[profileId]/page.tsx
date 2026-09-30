import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertNoRpcError } from "@/lib/lobby-errors";
import { peopleScore } from "@/lib/people-match";
import { CandidateCard } from "@/components/lobby/CandidateCard";
import { ApproachButton } from "@/components/lobby/ApproachButton";
import { BlockButton } from "@/components/lobby/BlockButton";
import { ReportForm } from "@/components/lobby/ReportForm";
import { AccountStatusNotice } from "@/components/lobby/AccountStatusNotice";
import { isUuid } from "@/lib/uuid";
import type { Candidate } from "@/lib/lobby-types";
import type { Axes } from "@/data/axes";

type MyProfileRow = { status: "active" | "suspended" | "banned"; axes: Axes | null };

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
  return (
    <main className="mx-auto grid max-w-md gap-5 px-4 py-6">
      <Link href="/lobby" className="text-sm text-[var(--rl-muted)]">← ロビーに戻る</Link>
      <CandidateCard c={c} match={match} />
      {c.type_code && <Link href={`/type/${c.type_code}`} className="text-sm underline">{c.type_code} タイプの説明を見る</Link>}
      <ApproachButton id={c.id} />
      <p className="text-xs text-[var(--rl-muted)]">相手が OK すると、おたがいの Discord 名が通知に表示されます。</p>
      <div className="flex gap-6"><BlockButton id={c.id} /><ReportForm id={c.id} /></div>
    </main>
  );
}

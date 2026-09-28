import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LoginButton } from "@/components/lobby/LoginButton";
import { CandidateCard } from "@/components/lobby/CandidateCard";
import { sortAndFilter } from "@/lib/lobby-sort";
import { GAMES } from "@/data/games";
import { TIME_SLOTS } from "@/data/lobby-options";
import type { Candidate } from "@/lib/lobby-types";
import type { Axes } from "@/data/axes";

export const metadata: Metadata = { title: "仲間を探す" };

type Props = { searchParams: Promise<{ game?: string; slot?: string; voice?: string; login?: string; reported?: string }> };

type MyProfileRow = { status: "active" | "suspended" | "banned"; axes: Axes | null };

export default async function LobbyPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto grid max-w-md gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">仲間を探す</h1>
        <p className="text-sm text-[var(--rl-muted)]">Discord でログインして、一緒に遊ぶ人を見つけよう。18歳以上の方が対象です。</p>
        {sp.login === "failed" && <p role="alert" className="text-sm text-[var(--rl-magenta)]">ログインできませんでした。もう一度お試しください。</p>}
        <div><LoginButton next="/lobby" /></div>
      </main>
    );
  }

  const { data: meRows } = await supabase.rpc("my_profile");
  const me = (meRows as MyProfileRow[] | null)?.[0];
  if (!me) redirect("/lobby/join");
  if (me.status !== "active") {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p>現在、アカウントが{me.status === "banned" ? "利用停止" : "一時停止"}中です。</p>
        <p className="mt-2 text-sm text-[var(--rl-muted)]">お問い合わせは <Link href="/terms" className="underline">利用規約</Link> の連絡先からお願いします。</p>
      </main>
    );
  }

  const { data } = await supabase.rpc("lobby_candidates");
  const rows = sortAndFilter({ axes: me.axes }, (data ?? []) as Candidate[], { game: sp.game, slot: sp.slot, voice: sp.voice === "1" });

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ロビー</h1>
        <div className="flex gap-3 text-sm"><Link href="/lobby/inbox">🔔 通知</Link><Link href="/lobby/me">プロフィール</Link></div>
      </div>
      {sp.reported && <p className="mb-3 text-sm text-[var(--rl-lime)]">通報を受け付けました。ご協力ありがとうございます。</p>}
      <form className="mb-4 grid grid-cols-3 gap-2 text-sm">
        <select name="game" defaultValue={sp.game ?? ""} className="rounded bg-[#151a33] px-2 py-2">
          <option value="">全ゲーム</option>
          {GAMES.map((g) => <option key={g.id} value={g.id}>{g.shortName}</option>)}
        </select>
        <select name="slot" defaultValue={sp.slot ?? ""} className="rounded bg-[#151a33] px-2 py-2">
          <option value="">全時間帯</option>
          {TIME_SLOTS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-1"><input type="checkbox" name="voice" value="1" defaultChecked={sp.voice === "1"} />VC</label>
        <button className="col-span-3 h-10 rounded-full bg-white/10">絞り込む</button>
      </form>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--rl-muted)]">条件に合う人がまだいません。ゲームや時間帯を増やすと見つかりやすくなります。</p>
      ) : (
        <ul className="grid gap-3">{rows.map((r) => <li key={r.candidate.id}><CandidateCard c={r.candidate} match={r.match} /></li>)}</ul>
      )}
    </main>
  );
}

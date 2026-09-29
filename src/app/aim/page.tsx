import type { Metadata } from "next";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { createSupabaseAnon } from "@/lib/supabase/anon";
import type { RankingRow } from "@/components/aim/Ranking";
import { AimClient } from "./AimClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "今日の文字(エイム練習)",
  description: "毎日1文字の漢字を、ゲームと同じ感度でなぞるエイム練習。ランキングで腕試し。",
};

async function loadRanking(date: string): Promise<RankingRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { data, error } = await createSupabaseAnon().rpc("get_aim_ranking", { p_date: date });
  if (error) return [];
  return (data ?? []) as RankingRow[];
}

export default async function AimPage() {
  const date = jstDate(new Date());
  const char = aimCharForDate(date);
  const rows = await loadRanking(date);
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-6">
      <header className="flex items-end gap-4">
        <div className="text-7xl font-bold text-[var(--rl-accent)]">{char.glyph}</div>
        <div>
          <h1 className="text-2xl font-bold">今日の文字</h1>
          <p className="text-sm text-[var(--rl-muted)]">{date} ・ {char.strokes.length} 画 ・ 書き順どおりに線をなぞろう</p>
        </div>
      </header>
      <AimClient char={char} date={date} rows={rows} />
      <p className="text-xs text-[var(--rl-muted)]">文字データ:<a href="https://kanjivg.tagaini.net/" className="underline" target="_blank" rel="noopener">KanjiVG</a>(© Ulrich Apel、CC BY-SA 3.0)</p>
    </main>
  );
}

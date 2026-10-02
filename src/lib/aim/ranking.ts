import { createSupabaseAnon } from "@/lib/supabase/anon";

export type RankingRow = { rank: number; name: string; score: number; accuracy: number; time_ms: number };

/** 今日のランキング(だれでも読める)。Supabase が未設定・エラーのときは空。 */
export async function loadRanking(date: string): Promise<RankingRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { data, error } = await createSupabaseAnon().rpc("get_aim_ranking", { p_date: date });
  if (error) return [];
  return (data ?? []) as RankingRow[];
}

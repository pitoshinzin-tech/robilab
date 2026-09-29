import type { Axes } from "@/data/axes";

/**
 * 診断結果を匿名で記録する。設定がない・失敗したときは何もしない(結果の表示を止めない)。
 * 記録は DB の関数 record_diagnosis を通す(値の検証とサイト全体の件数上限は DB 側で行う)。
 */
export async function recordDiagnosis(code: string, axes: Axes, fetchImpl: typeof fetch = fetch): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    await fetchImpl(`${url}/rest/v1/rpc/record_diagnosis`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ p_type_code: code, p_axes: axes }),
    });
  } catch {
    // 記録だけあきらめる
  }
}

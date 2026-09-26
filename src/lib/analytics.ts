import type { Axes } from "@/data/axes";

/** 診断結果を匿名で記録する。設定がない・失敗したときは何もしない(結果の表示を止めない)。 */
export async function recordDiagnosis(code: string, axes: Axes, fetchImpl: typeof fetch = fetch): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    await fetchImpl(`${url}/rest/v1/diagnosis_results`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ type_code: code, axes }),
    });
  } catch {
    // 記録だけあきらめる
  }
}

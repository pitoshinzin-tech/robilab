import { createClient } from "@supabase/supabase-js";

/** ログイン情報を使わない読み取り専用のクライアント(公開カードの取得用)。 */
export function createSupabaseAnon() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}

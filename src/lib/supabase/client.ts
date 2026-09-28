import { createBrowserClient } from "@supabase/ssr";

/** ブラウザ(クライアントコンポーネント)から使う Supabase クライアント。 */
export function createSupabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * サーバーコンポーネント・Route Handler・Server Action から使う Supabase クライアント。
 * `cookies()` は Next.js 16 で非同期になったため await する。
 */
export async function createSupabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // サーバーコンポーネントからの呼び出しでは書き込めない(proxy が更新する)
        }
      },
    },
  });
}

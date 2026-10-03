/**
 * 表示速度(docs/design/perf.md):Supabase のクライアント(@supabase/ssr・supabase-js。gzip 約 67KB)を、使う時に読む。
 * 静的に import すると、ヘッダーの通知(Bell)から全ページの最初の JS に入り、CSS と回線を取り合い、最初の描画の前に実行されていた。
 * ここを通すと別のチャンクになり、ハイドレーションのあと(effect・押したとき)に読む。作るクライアントは createSupabaseBrowser と同じ。
 */
export async function loadSupabaseBrowser() {
  const { createSupabaseBrowser } = await import("./client");
  return createSupabaseBrowser();
}

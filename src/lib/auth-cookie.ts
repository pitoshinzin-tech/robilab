/**
 * Supabase のログインの cookie(@supabase/ssr の既定の名前 `sb-<project-ref>-auth-token`、長いときは `.0` `.1` に分割)があるか。
 * ないならログインしていないので、Supabase の JS(gzip 約 66KB)を読む前に「サーバーの設定はない」と分かる(docs/design/perf.md)。
 * あるとき(古い cookie でも)は今までどおり Supabase で確かめる。
 */
export const SUPABASE_SESSION_COOKIE_RE = /(?:^|;\s*)sb-[^=;\s]+-auth-token(?:\.\d+)?=/;

export function mayHaveSupabaseSession(cookie: string): boolean {
  return SUPABASE_SESSION_COOKIE_RE.test(cookie);
}

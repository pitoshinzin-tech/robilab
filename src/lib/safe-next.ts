/**
 * `next` クエリパラメータとして渡された遷移先を検証する。
 * サイト内の絶対パス(`/` 始まり)だけを許可し、それ以外(外部 URL・
 * プロトコル相対 URL・バックスラッシュを使ったトリック)はすべて `/lobby` に
 * フォールバックすることで、オープンリダイレクトを防ぐ。
 */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/lobby";
  return raw;
}

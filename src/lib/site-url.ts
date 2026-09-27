/** サイトの絶対 URL のベースを返す。og:image やシェア URL の生成に使う。 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

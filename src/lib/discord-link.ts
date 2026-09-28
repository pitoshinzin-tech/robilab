// Discord のユーザー ID(snowflake)は数字だけ。変わらない ID からプロフィールの URL を作る。
// 形が違う値(テスト用のダミー ID など)ではリンクを作らない。
export function discordProfileUrl(id: string | null | undefined): string | null {
  if (!id || !/^\d{17,20}$/.test(id)) return null;
  return `https://discord.com/users/${id}`;
}

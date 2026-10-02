/**
 * 動きの参考 086(パタパタの表示板):ランキングが更新されたとき、中身(名前・点数)が入れ替わった順位だけを返す。
 * 前がない(初めて出す)ときと、読み込み直して同じ中身のときは何も返さない(自動では動かさない)。
 */
type Row = { rank: number; name: string; score: number };

export function flapRanks(prev: readonly Row[] | null, next: readonly Row[]): number[] {
  if (!prev) return [];
  const before = new Map(prev.map((r) => [r.rank, `${r.name}\u0000${r.score}`]));
  return next.filter((r) => before.get(r.rank) !== `${r.name}\u0000${r.score}`).map((r) => r.rank).sort((a, b) => a - b);
}

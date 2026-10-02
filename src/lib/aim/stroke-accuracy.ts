/** 結果の「画ごとの正確さ」を 10 マスのバーで見せる(追補 6 章のマスの言葉)。表示だけ(点数の計算には使わない)。 */
export const BAR_CELLS = 10;

/** 正確さ(0〜1)を、塗るマスの数(0〜10)にする。 */
export function barCells(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(BAR_CELLS, Math.max(0, Math.round(ratio * BAR_CELLS)));
}

/** いちばんずれた画の番号(0 から)。1 画だけ・全部同じ・空のときは示す意味がないので -1。 */
export function worstStroke(perStroke: readonly number[]): number {
  if (perStroke.length < 2) return -1;
  let worst = 0;
  for (let i = 1; i < perStroke.length; i++) if (perStroke[i] < perStroke[worst]) worst = i;
  return perStroke.every((x) => x === perStroke[worst]) ? -1 : worst;
}

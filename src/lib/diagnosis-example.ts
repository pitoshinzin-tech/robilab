/** 診断の始める画面で見せる「例の絵」を、押した回数の順に 1 つずつ選ぶ(最後まで行ったら最初へ)。空なら null。 */
export function pickExample<T>(list: readonly T[], turn: number): T | null {
  if (list.length === 0) return null;
  return list[((turn % list.length) + list.length) % list.length];
}

/** 例の絵に使うタイプ(コードと名前だけ。説明文はブラウザに送らない) */
export type DiagnosisExample = { code: string; name: string };

import { AXES } from "@/data/axes";

/** 4 文字のコードを軸の言葉にする(追補 S5:名簿で軸が読める)。おかしなコードは空。 */
export function axisWords(code: string): string[] {
  if (code.length !== AXES.length) return [];
  const words = AXES.map((a, i) => (code[i] === a.leftLetter ? a.left : code[i] === a.rightLetter ? a.right : null));
  return words.every((w): w is NonNullable<typeof w> => w !== null) ? words : [];
}

export const axisLine = (code: string): string => axisWords(code).join("・");
export const axisInitials = (code: string): string => axisWords(code).map((w) => w[0]).join("");

/** 名簿の凡例の 1 行(「A 攻め/G 守り・R 直感/B 戦略・…」)。4 文字のコードの読み方。 */
export const axisLegend = (): string => AXES.map((a) => `${a.leftLetter} ${a.left}/${a.rightLetter} ${a.right}`).join("・");

/** 一覧の凡例の 2 択(軸ごとに 1 文字か null)にコードが合うか。null の軸は問わない。 */
export function matchesAxisFilter(code: string, picked: readonly (string | null)[]): boolean {
  return picked.every((letter, i) => letter === null || code[i] === letter);
}

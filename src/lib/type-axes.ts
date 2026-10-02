import { AXES } from "@/data/axes";

/** 4 文字のコードを軸の言葉にする(追補 S5:名簿で軸が読める)。おかしなコードは空。 */
export function axisWords(code: string): string[] {
  if (code.length !== AXES.length) return [];
  const words = AXES.map((a, i) => (code[i] === a.leftLetter ? a.left : code[i] === a.rightLetter ? a.right : null));
  return words.every((w): w is NonNullable<typeof w> => w !== null) ? words : [];
}

export const axisLine = (code: string): string => axisWords(code).join("・");
export const axisInitials = (code: string): string => axisWords(code).map((w) => w[0]).join("");

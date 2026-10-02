import { axisWords } from "@/lib/type-axes";

/** 診断の始める画面で見せる「例の絵」を、押した回数の順に 1 つずつ選ぶ(最後まで行ったら最初へ)。空なら null。 */
export function pickExample<T>(list: readonly T[], turn: number): T | null {
  if (list.length === 0) return null;
  return list[((turn % list.length) + list.length) % list.length];
}

/** 例の絵に使うタイプ(コードと名前だけ。説明文はブラウザに送らない) */
export type DiagnosisExample = { code: string; name: string };

/** 絵の部分(軸の順:攻め/守り・直感/戦略・チーム/ソロ・熱血/冷静)。結果の SpriteReading と同じ言葉 */
const SPRITE_PARTS = ["頭", "目", "体の横", "色"] as const;

/** 例の絵の読み方(「頭 = 攻め・目 = 直感・体の横 = チーム・色 = 熱血」)。おかしなコードは空。 */
export function spriteReading(code: string): string {
  const words = axisWords(code);
  return words.length === SPRITE_PARTS.length ? words.map((w, i) => `${SPRITE_PARTS[i]} = ${w}`).join("・") : "";
}

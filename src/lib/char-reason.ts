import { AXES, type Axes } from "@/data/axes";
import type { Char, CharTagId } from "@/data/char-types";
import type { Role } from "@/data/games";
import { TAG_AXIS } from "@/lib/char-match";

/**
 * 「ロールは同じでも、手ざわりが違うかも」の言い回し(設計書 5-2)。言い回しはここ 1 か所(CEO・社長が直せる)。
 * 「苦手」「向いていない」「弱い」は使わない。キャラの強さの話にしない(理由は、あなたの軸とキャラの札の向きの違いだけ)。
 */

/** 根拠の表に出す札の短い名前 */
export const TAG_LABEL: Record<CharTagId, string> = {
  front: "前に出る", hold: "守る", mobile: "機動", setup: "準備", ally: "味方を助ける", lone: "単独", aggro: "押し続ける", calm: "冷静に狙う",
};

/** 「〇〇は〈ここ〉キャラ」に入る言葉 */
export const TAG_PHRASE: Record<CharTagId, string> = {
  front: "前に出て仕掛ける", hold: "守りを固める", mobile: "素早く動き回る", setup: "準備して待ち構える",
  ally: "味方を助ける", lone: "単独で動く", aggro: "押し続ける", calm: "冷静に狙い澄ます",
};

export const CHAR_REASON_TEXT = {
  heading: "ロールは同じでも、手ざわりが違うかも",
  badge: "意外な 1 体",
  sentence: (p: { roleName: string; charName: string; tagPhrase: string; yours: string; theirs: string }) =>
    `${p.roleName}が合うあなたでも、${p.charName}は${p.tagPhrase}キャラ。相性の良し悪しではなく、遊び方が違うだけ。${p.yours}より${p.theirs}寄りの日に試すと発見があるかも。`,
};

export const BANNED_WORDS = ["苦手", "向いていない", "弱い", "合わない"] as const;

/** tag はあなたの軸と逆向きの札(char-match の opposingTags の先頭) */
export function surpriseReason(user: Axes, char: Char, role: Role, tag: CharTagId): string {
  const { axis, sign } = TAG_AXIS[tag];
  const a = AXES.find((x) => x.id === axis)!;
  return CHAR_REASON_TEXT.sentence({
    roleName: role.name,
    charName: char.nameJa,
    tagPhrase: TAG_PHRASE[tag],
    yours: user[axis] > 0 ? a.left : a.right,
    theirs: sign > 0 ? a.left : a.right,
  });
}

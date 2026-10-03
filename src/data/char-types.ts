/**
 * キャラ図鑑の型。データは scripts/char-data.ts が docs/content/chars/*.json から作る(手で直さない)。
 * 文は公式の原文の短い引用(40 字まで)と、ロビラボの言葉の要約(80 字まで)だけ。調べた人のメモは持たない。
 */
export type CharGameId = "overwatch" | "valorant" | "apex" | "sf6" | "dbd";
/** 公式の言葉の札(設計書 3-2)。1 枚で 1 つの軸を 0.3 動かす */
export type CharTagId = "front" | "hold" | "mobile" | "setup" | "ally" | "lone" | "aggro" | "calm";
/** 代表に選んだ根拠(設計書 2-2):公式の初心者向け/最初から無料/ロールの中で向きが違う */
export type CharPickedBy = "official-beginner" | "free" | "variety";
/** 公式の原文の引用(40 字まで)と出典 */
export type CharQuote = { text: string; url: string };
export type CharEvidence = { tag: CharTagId; quote: string; url: string };

export type Char = {
  /** URL に使う。英小文字・数字・ハイフン(ゲームの中で重ならない) */
  id: string;
  game: CharGameId;
  /** src/data/games.ts のそのゲームの role.id */
  roleId: string;
  /** 公式の日本語表記 */
  nameJa: string;
  nameEn: string;
  /** 公式の原文の表記(OW のサブロール、Apex のクラスなど) */
  officialRole: string;
  /** ロビラボの言葉の要約(80 字まで) */
  summary: string;
  quote: CharQuote;
  /** 0〜2 枚。軸が重ならない */
  evidence: CharEvidence[];
  pickedBy: CharPickedBy;
  /** そのキャラの公式ページ */
  sourceUrl: string;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
  /** ロールの割り当てに公式の根拠があり、相性の計算に入れるか */
  matchable: boolean;
  /** 型(ロール)の割り当ての公式の原文(DbD)。相性の根拠としてだけ持ち、画面に出さない */
  roleBasis: CharQuote | null;
  /** 予備(画面に出さない) */
  reserve: boolean;
};

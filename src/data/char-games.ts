import type { CharGameId } from "./char-types";

/**
 * キャラ図鑑のゲームごとの出し分け(台帳 .superpowers/sdd/2026-10-03-char-dex/progress.md の CEO の判断)。
 * published はすぐ外せるスイッチ:false のゲームは図鑑の一覧・ページ・SubNav・sitemap・結果ページの導線から消え、URL は 404。
 * notices は各社の決まりが求める文の原文(書き換えない。docs/content/chars/policies-summary.md)+日本語の非公式の一文。
 */
export type CharGameSetting = {
  id: CharGameId;
  published: boolean;
  /** 合うキャラ(相性)を出すか。スト6 は公式の紹介にスタイルの言葉がないので false */
  matching: boolean;
  /** 公式の紹介文の引用を画面に出すか。DbD は規約の「Contents の再利用」に配慮して false */
  showQuotes: boolean;
  /** title・description・パンくずの構造化データにキャラ名を入れるか。VALORANT は Riot の「検索タグ」の条項に配慮して false */
  nameInTitle: boolean;
  /** 一覧をロールで段に分けるか。スト6 は仮の分類を出さないので false */
  groupByRole: boolean;
  /** ゲーム名の初出に付ける商標の印(Blizzard の商標の決まり) */
  nameMark: string;
  notices: readonly string[];
  /** 分類がロビラボの分け方であることなどの注記 */
  styleNote: string | null;
  /** 相性に入らないキャラのページに出す一文 */
  unmatchableNote: string;
};

export const CHAR_GAME_SETTINGS: Record<CharGameId, CharGameSetting> = {
  overwatch: {
    id: "overwatch", published: true, matching: true, showQuotes: true, nameInTitle: true, groupByRole: true, nameMark: "™",
    notices: [
      "Overwatch is a trademark of Blizzard Entertainment, Inc., in the U.S. and/or other countries.",
      "オーバーウォッチは Blizzard Entertainment, Inc. の商標です。ロビラボは非公式のファンサイトで、Blizzard Entertainment とは関係ありません。",
    ],
    styleNote: null,
    unmatchableNote: "公式のロールの根拠がないため、相性には入れていません。",
  },
  valorant: {
    id: "valorant", published: true, matching: true, showQuotes: true, nameInTitle: false, groupByRole: true, nameMark: "",
    notices: [
      "ロビラボ was created under Riot Games' \"Legal Jibber Jabber\" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.",
      "VALORANT は Riot Games, Inc. の商標です。ロビラボは非公式のファンサイトで、Riot Games とは関係ありません。",
    ],
    styleNote: null,
    unmatchableNote: "公式のロールの根拠がないため、相性には入れていません。",
  },
  apex: {
    id: "apex", published: true, matching: true, showQuotes: true, nameInTitle: true, groupByRole: true, nameMark: "",
    notices: [
      "This website is not endorsed by or affiliated with EA or its licensors.",
      "Apex Legends は Electronic Arts Inc. の商標です。ロビラボは非公式のファンサイトで、EA とは関係ありません。",
    ],
    styleNote: null,
    unmatchableNote: "公式のロールの根拠がないため、相性には入れていません。",
  },
  sf6: {
    // 台帳:図鑑だけ(合うキャラは出さない)。5 社の最後に公開するので、社長の確認まで false
    id: "sf6", published: false, matching: false, showQuotes: true, nameInTitle: true, groupByRole: false, nameMark: "",
    notices: ["本作品は二次創作です。", "ロビラボは非公式のファンサイトで、カプコンとは関係ありません。"],
    styleNote: "スト6 には公式のロールがないため、キャラを分けず、合うキャラも出していません(公式の紹介に戦い方を示す言葉が載ったら加えます)。",
    unmatchableNote: "公式の紹介にスタイルを示す言葉がないため、相性には入れていません。",
  },
  dbd: {
    id: "dbd", published: true, matching: true, showQuotes: false, nameInTitle: true, groupByRole: true, nameMark: "",
    notices: [
      "© 2015-2026 and BEHAVIOUR, DEAD BY DAYLIGHT and other related trademarks and logos belong to Behaviour Interactive Inc. All rights reserved.",
      "ロビラボは非公式のファンサイトで、Behaviour Interactive とは関係ありません。",
    ],
    styleNote: "キラー・サバイバーの型はロビラボの分け方です。公式の紹介文かパークの説明に型を示す言葉があるキャラだけを型に入れています。",
    unmatchableNote: "公式の紹介に型を示す言葉がないため、相性には入れていません。",
  },
};

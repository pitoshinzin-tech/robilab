// アプリのアイコンの絵(8×8 のドット絵の「ロ」)。PNG を作る scripts/app-icons.mjs と、画面の案内(AppIconMark)が同じものを使う。
// Node の道具を import しない(ブラウザの JS に入っても小さいままにする)。社長のロゴができたら、ここを差し替えて node scripts/app-icons.mjs。

/** 色の記号 → 色。"." は背景(--rl-bg)・M はマゼンタ(--rl-highlight)・P はパープルの文字色(--rl-secondary-text) */
export const COLORS = { ".": "#0A0C16", M: "#FF4FD8", P: "#A99BFF" };

/** @type {readonly string[]} */
export const GRID = [
  "........",
  "..MMMM..",
  ".M....M.",
  ".M.PP.M.",
  ".M.PP.M.",
  ".M....M.",
  "..MMMM..",
  "........",
];

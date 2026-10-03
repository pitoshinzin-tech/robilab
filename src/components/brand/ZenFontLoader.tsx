"use client";

/*
 * Zen Kaku の @font-face を、最初の描画を止めずに読む(ZenFontFaces の説明)。
 * ハイドレーションを待たず、この JS が動いた時に読み始める(字の入れ替わりを早め、入れ替わりの行の折り直しを最初の描画に近づける)。
 * 読めなかったとき(回線が切れたなど)は何もしない(代わりの書体のまま。ページをエラーにしない)。
 */
if (typeof window !== "undefined") {
  import("./ZenFontFaces").catch(() => {});
}

/** layout に置くための印(何も描かない。上の読み込みをこのファイルごと layout の JS に入れる) */
export function ZenFontLoader() {
  return null;
}

"use client";
import { Zen_Kaku_Gothic_New } from "next/font/google";

/*
 * 表示速度(docs/design/perf.md の「全ページ共通の下限」):Zen Kaku Gothic New の @font-face(約 240 個・CSS gzip 64KB)だけを、
 * このファイルの CSS として最初の描画のあとに読む(ZenFontLoader が next/dynamic で読み込む)。
 * 最初の描画を止める CSS から外れ、最初のレイアウトで約 240 の文字の範囲を調べなくて済む。
 * 書体の名前(--font-zen)と英数字の寸法合わせの代わり(Zen Kaku Gothic New Fallback)は globals.css に置いてあるので、
 * 届くまでの見た目は今まで(字のファイルが届くまでの代わりの書体)と同じ。届いたあとも同じ書体。
 * 設定はもとの layout.tsx と同じ(900 は読まない・先読みしない・swap)。
 */
const zen = Zen_Kaku_Gothic_New({ weight: ["500", "700"], subsets: ["latin"], display: "swap", preload: false });

export default function ZenFontFaces() {
  // CSS を読ませるためだけの部品(何も描かない)
  void zen.className;
  return null;
}

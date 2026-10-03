/**
 * チップの見た目のクラス。"use client" のないファイルに置く(サーバーの部品 ChipLink からも文字として読めるように。
 * "use client" のファイルの export をサーバーから読むと、文字ではなくクライアントの参照になる)。chip-button.tsx からも同じものを出す。
 */
/**
 * 選ぶもの(チップ)の見た目。角丸はボタンと見分けるため sm。aria-pressed="true" で選んだ見た目(パープルの枠+チェック)。
 * base-ui を読まないファイルに分けてある(chip.tsx の Chip は base-ui の Toggle を読む)。
 * 1 つ選ぶ・押して重ねるだけの画面(/mouse)は、ここの ChipButton と ChipButtonGroup で base-ui のチャンクを読まずに済む。
 */
export const chipClassName =
  "group/chip relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-rl-sm border-2 border-rl-line-strong bg-rl-surface-2 px-4 text-sm font-bold text-rl-text transition-[background-color,border-color,transform] duration-(--rl-dur-fast) ease-rl-out hover:border-rl-text/60 active:translate-y-px aria-pressed:border-rl-selected aria-pressed:bg-rl-selected-bg disabled:cursor-not-allowed disabled:opacity-45";

// (追補 S4)選んだときにチェックが線で引かれる(rl-draw-check は globals.css)。
// 引くのは押したあと(チップに data-rl-touched があるとき)だけ。開いたときに最初から選ばれているチップは動かない
export const chipCheckClassName = "rl-draw-check hidden size-4 shrink-0 group-aria-pressed/chip:block";

// 選んでいないときの 8px の線の四角(ChipBox)。押すと消えてチェックに替わる(同じ 16px の場所なので幅は変わらない)
export const chipBoxClassName = "group-aria-pressed/chip:hidden";

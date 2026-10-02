"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 選ぶもの(チップ)の見た目。角丸はボタンと見分けるため sm。aria-pressed="true" で選んだ見た目(パープルの枠+チェック)。
 * base-ui を読まないファイルに分けてある(chip.tsx の Chip は base-ui の Toggle を読む)。
 * 1 つ選ぶ・押して重ねるだけの画面(/mouse)は、ここの ChipButton と ChipButtonGroup で base-ui のチャンクを読まずに済む。
 */
export const chipClassName =
  "group/chip relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-rl-sm border-2 border-rl-line-strong bg-rl-surface-2 px-4 text-sm font-bold text-rl-text transition-[background-color,border-color,transform] duration-(--rl-dur-fast) ease-rl-out hover:border-rl-text/60 active:translate-y-px aria-pressed:border-rl-selected aria-pressed:bg-rl-selected-bg disabled:cursor-not-allowed disabled:opacity-45";

// (追補 S4)選んだときにチェックが線で引かれる(rl-draw-check は globals.css)
export const chipCheckClassName = "rl-draw-check hidden size-4 shrink-0 group-aria-pressed/chip:block";

/** ふつうの <button aria-pressed> のチップ。 */
export function ChipButton({ pressed, className, children, ...props }: Omit<React.ComponentProps<"button">, "aria-pressed"> & { pressed: boolean }) {
  return (
    <button type="button" aria-pressed={pressed} className={cn(chipClassName, className)} {...props}>
      <Check aria-hidden className={chipCheckClassName} />
      {children}
    </button>
  );
}

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

/** ChipButton のまとまり(role="group")。矢印キー・Home・End で、まとまりの中のチップへフォーカスを移す(選ぶのは Enter・Space)。 */
export function ChipButtonGroup({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let next = -1;
    if (NEXT_KEYS.has(e.key)) next = (i + 1) % buttons.length;
    else if (PREV_KEYS.has(e.key)) next = (i - 1 + buttons.length) % buttons.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = buttons.length - 1;
    if (next < 0) return;
    e.preventDefault();
    buttons[next].focus();
  };
  return (
    <div role="group" aria-label={label} onKeyDown={onKeyDown} className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}

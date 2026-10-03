"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { chipBoxClassName, chipCheckClassName, chipClassName } from "./chip-style";
import { ChipBox } from "./chip-box";

export { chipBoxClassName, chipCheckClassName, chipClassName };

/** ふつうの <button aria-pressed> のチップ。選んでいないときは 8px の線の四角、押すとチェック(同じ 16px の場所。ChipLink と同じ形)。 */
export function ChipButton({ pressed, className, children, onClick, ...props }: Omit<React.ComponentProps<"button">, "aria-pressed"> & { pressed: boolean }) {
  // 押したら(Enter・Space も click になる)チェックを引けるようにする。effect は使わない
  const [touched, setTouched] = React.useState(false);
  return (
    <button type="button" aria-pressed={pressed} data-rl-touched={touched || undefined} className={cn(chipClassName, className)}
      onClick={(e) => { setTouched(true); onClick?.(e); }} {...props}>
      <ChipBox className={chipBoxClassName} />
      <Check aria-hidden className={chipCheckClassName} />
      {children}
    </button>
  );
}

/**
 * フォームで送るチェックボックスのチップ(GET の絞り込み・プロフィールの選択)。中身は本物の <input type="checkbox">(Tab で線・Space で切り替え)。
 * base-ui を読まないのでここに置く(chip.tsx からも同じものを出す)。
 */
export function CheckChip({ children, className, onChange, ...props }: Omit<React.ComponentProps<"input">, "type"> & { children: React.ReactNode; className?: string }) {
  // 切り替えたら(クリック・Space)チェックを引けるようにする。最初から入っているチェックは動かない
  const [touched, setTouched] = React.useState(false);
  return (
    <label
      data-rl-touched={touched || undefined}
      className={cn(
        chipClassName,
        "has-checked:border-rl-selected has-checked:bg-rl-selected-bg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rl-focus has-disabled:cursor-not-allowed has-disabled:opacity-45",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" onChange={(e) => { setTouched(true); onChange?.(e); }} {...props} />
      <Check aria-hidden className="rl-draw-check hidden size-4 shrink-0 peer-checked:block" />
      {children}
    </label>
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

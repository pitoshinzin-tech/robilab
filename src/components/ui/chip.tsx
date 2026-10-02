"use client";
import * as React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { chipCheckClassName, chipClassName } from "./chip-button";

// 見た目のクラスは base-ui を読まない chip-button.tsx にある(/mouse などはそちらの ChipButton を使う)
export { chipClassName };
const checkClassName = chipCheckClassName;

type ChipProps = Omit<React.ComponentProps<typeof Toggle>, "className"> & { className?: string };

export function Chip({ className, children, ...props }: ChipProps) {
  return (
    <Toggle className={cn(chipClassName, className)} {...props}>
      <Check aria-hidden className={checkClassName} />
      {children}
    </Toggle>
  );
}

/** フォームで送るチェックボックスのチップ(GET の絞り込み・プロフィールの選択)。 */
export function CheckChip({ children, className, ...props }: Omit<React.ComponentProps<"input">, "type"> & { children: React.ReactNode; className?: string }) {
  return (
    <label
      className={cn(
        chipClassName,
        "has-checked:border-rl-selected has-checked:bg-rl-selected-bg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rl-focus has-disabled:cursor-not-allowed has-disabled:opacity-45",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <Check aria-hidden className="rl-draw-check hidden size-4 shrink-0 peer-checked:block" />
      {children}
    </label>
  );
}

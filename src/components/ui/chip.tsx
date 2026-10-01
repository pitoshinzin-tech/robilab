"use client";
import * as React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** 選ぶもの(チップ)の見た目。角丸はボタンと見分けるため sm。aria-pressed="true" で選んだ見た目(パープルの枠+チェック)。 */
export const chipClassName =
  "group/chip relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-rl-sm border-2 border-rl-line-strong bg-rl-surface-2 px-4 text-sm font-bold text-rl-text transition-[background-color,border-color,transform] duration-(--rl-dur-fast) ease-rl-out hover:border-rl-text/60 active:translate-y-px aria-pressed:border-rl-selected aria-pressed:bg-rl-selected-bg disabled:cursor-not-allowed disabled:opacity-45";

// (追補 S4)選んだときにチェックが線で引かれる(rl-draw-check は globals.css)
const checkClassName = "rl-draw-check hidden size-4 shrink-0 group-aria-pressed/chip:block";

type ChipProps = Omit<React.ComponentProps<typeof Toggle>, "className"> & { className?: string };

export function Chip({ className, children, ...props }: ChipProps) {
  return (
    <Toggle className={cn(chipClassName, className)} {...props}>
      <Check aria-hidden className={checkClassName} />
      {children}
    </Toggle>
  );
}

/** チップのまとまり(矢印キーで移動)。既定は 1 つだけ選び、選んだものをもう一度押しても外れない(allowEmpty で外せる)。 */
export function ChipGroup<V extends string>({ label, value, onValueChange, multiple = false, allowEmpty = false, className, children }: {
  label: string; value: readonly V[]; onValueChange: (value: V[]) => void; multiple?: boolean; allowEmpty?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={value}
      multiple={multiple}
      onValueChange={(next: V[]) => {
        if (!allowEmpty && next.length === 0) return;
        onValueChange(next);
      }}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {children}
    </ToggleGroup>
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

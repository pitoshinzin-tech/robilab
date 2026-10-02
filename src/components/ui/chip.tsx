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

/** フォームで送るチェックボックスのチップ。本体は base-ui を読まない chip-button.tsx(/lobby の絞り込みはそちらから読む) */
export { CheckChip } from "./chip-button";

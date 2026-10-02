"use client";
import * as React from "react";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

// chip.tsx から分けた(1 つだけのチップを使う画面に ToggleGroup を連れていかないため)。中に置くのは chip.tsx の Chip。

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

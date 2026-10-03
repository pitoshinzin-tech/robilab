import * as React from "react";
import { cn } from "@/lib/utils";

/** h2(24px)。左に 8px のパープルの四角(ドット絵のブランドの小さな印)。英字の大文字ラベルは付けない。件数は本文の書体(Orbitron の小さな 0・8 は箱の記号に見えるため)の太字・マゼンタ。 */
export function SectionHeading({ title, description, action, count, as: Tag = "h2", id, className }: {
  title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; count?: number; as?: "h2" | "h3"; id?: string; className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="grid min-w-0 gap-1">
        <Tag id={id} className="flex min-w-0 items-center gap-3 text-2xl font-bold tracking-[0.01em]">
          <span aria-hidden className="size-2 shrink-0 bg-rl-secondary" />
          <span className="min-w-0 wrap-anywhere">{title}</span>
          {count !== undefined && (
            <span className="text-xl font-bold tabular-nums text-rl-highlight">
              {count}
              <span className="ml-1 text-sm text-rl-muted">件</span>
            </span>
          )}
        </Tag>
        {description && <p className="text-sm text-rl-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

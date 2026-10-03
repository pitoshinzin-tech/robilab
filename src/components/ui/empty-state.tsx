import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** 空の状態。「なにがないか+次になにをすればいいか」。謝らない。 */
export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("grid justify-items-start gap-3 rounded-rl-md border border-rl-line bg-rl-surface p-4 md:p-6", className)}>
      <span className="grid size-16 place-items-center rounded-rl-sm bg-rl-surface-2">
        <Icon aria-hidden className="size-8 text-rl-muted" />
      </span>
      <p className="text-base font-bold">{title}</p>
      {description && <p className="text-sm text-rl-muted text-balance [word-break:auto-phrase]">{description}</p>}
      {action}
    </div>
  );
}

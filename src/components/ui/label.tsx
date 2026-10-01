import * as React from "react";
import { cn } from "@/lib/utils";

/** 欄の上の 14px 太字。必須は色でなく文字で示す。 */
function Label({ className, required, children, ...props }: React.ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label data-slot="label" className={cn("flex flex-wrap items-center gap-2 text-sm font-bold text-rl-text", className)} {...props}>
      {children}
      {required && <span className="rounded-rl-sm border border-rl-line-strong px-2 text-xs font-bold text-rl-muted">必須</span>}
    </label>
  );
}

export { Label };

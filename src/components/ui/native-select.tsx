import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldBase } from "./input";

/** GET のフォームなどで使う、ネイティブの <select> を入力欄と同じ見た目にしたもの。 */
function NativeSelect({ className, wrapperClassName, children, ...props }: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative block", wrapperClassName)}>
      <select className={cn(fieldBase, "h-12 cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-rl-muted" />
    </span>
  );
}

export { NativeSelect };

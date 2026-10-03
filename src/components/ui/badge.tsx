import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-rl-sm font-bold", {
  variants: {
    variant: {
      pr: "h-6 border border-rl-line-strong px-2 text-xs text-rl-muted",
      count: "h-5 min-w-5 rounded-rl-pill bg-rl-highlight px-1 text-xs tabular-nums text-rl-on-highlight",
      success: "h-6 bg-rl-success/16 px-2 text-xs text-rl-success",
      code: "h-6 font-display text-sm tracking-[0.08em] text-rl-highlight",
      rank: "h-6 min-w-6 font-display text-sm tabular-nums",
      status: "h-6 border border-rl-warning px-2 text-xs text-rl-warning",
    },
  },
  defaultVariants: { variant: "pr" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** 順位(1〜3 位はマゼンタ、それ以外は補足の色) */
function RankBadge({ rank, className }: { rank: number; className?: string }) {
  return (
    <Badge variant="rank" className={cn(rank <= 3 ? "text-rl-highlight" : "text-rl-muted", className)}>
      {rank}
      <span className="sr-only">位</span>
    </Badge>
  );
}

export { Badge, RankBadge, badgeVariants };

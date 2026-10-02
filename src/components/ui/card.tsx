import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-rl-md border bg-rl-surface p-4 text-rl-text md:p-6", {
  variants: {
    variant: {
      default: "border-rl-line",
      selected: "border-2 border-rl-selected bg-rl-selected-bg",
      feature: "border-rl-line-strong",
      danger: "border-rl-danger",
    },
  },
  defaultVariants: { variant: "default" },
});

type CardProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof cardVariants> & { as?: "div" | "section" | "li" | "article" };

/** カード。中にカードを入れない(区切りは border-rl-line の線)。 */
function Card({ as: Tag = "div", variant, className, ...props }: CardProps) {
  return <Tag data-slot="card" className={cn(cardVariants({ variant }), className)} {...props} />;
}

/** カード全体がリンク。ホバーで面が明るくなり、右の ChevronRight で押せると分かる。中にリンクやボタンを入れない。 */
function CardLink({ className, children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      data-slot="card"
      className={cn(
        "rl-lock group flex min-w-0 cursor-pointer items-center gap-4 rounded-rl-md border border-rl-line bg-rl-surface p-4 text-rl-text transition-[background-color,border-color,transform] duration-(--rl-dur-fast) ease-rl-out hover:border-rl-line-strong hover:bg-rl-surface-2 active:translate-y-px md:p-6",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-rl-muted transition-colors group-hover:text-rl-text" />
    </Link>
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-xl font-bold", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-rl-muted", className)} {...props} />;
}

export { Card, CardLink, CardTitle, CardDescription, cardVariants };

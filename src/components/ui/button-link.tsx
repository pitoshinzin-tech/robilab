import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * ボタンの見た目(設計書 2-5)と、見た目だけボタンのリンク。primary は 1 画面に 1 つだけ。
 * base-ui の Button を import しないファイルに分けてある:リンクだけを使うサーバーのページ(結果・一覧)が、
 * 押すボタンの部品(base-ui の useButton など 約 10KB)をブラウザで読まずに済む。`@/components/ui/button` からも同じものを出す。
 */
export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-rl-pill border border-transparent font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-(--rl-dur-fast) ease-rl-out active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "rl-lock bg-rl-accent text-rl-on-accent hover:bg-rl-accent-hover hover:shadow-rl-glow-1 focus-visible:shadow-rl-glow-1",
        secondary: "rl-lock border-rl-line-strong bg-rl-surface-2 text-rl-text hover:border-rl-text/60",
        ghost: "bg-transparent text-rl-muted underline-offset-4 hover:text-rl-text hover:underline",
        danger: "border-rl-danger bg-transparent text-rl-danger hover:bg-rl-danger/10",
        discord: "bg-rl-discord text-white hover:brightness-110",
      },
      size: {
        sm: "h-11 px-4 text-sm",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-8 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariants["variant"]>;

/** 見た目だけボタンのページ内リンク(<a> のまま。role="button" にしない) */
export function ButtonLink({ className, variant, size, ...props }: React.ComponentProps<typeof Link> & ButtonVariants) {
  return <Link data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** 見た目だけボタンの外へのリンク・ダウンロード(target / rel / download は呼ぶ側が渡す) */
export function ButtonAnchor({ className, variant, size, ...props }: React.ComponentProps<"a"> & ButtonVariants) {
  return <a data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

"use client";
import * as React from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonAnchor, buttonVariants } from "./button-link";

/**
 * 読み込み・表示の失敗。もう一度試す(と、トップへ戻る)。
 * ボタンは base-ui を読まない、buttonVariants のクラスを付けたふつうの <button>(error.tsx と global-error.tsx は
 * どのページでも読まれるので、base-ui の useButton も PlainButton の loading の形も連れてこない)。
 * titleAs:ページ全体のエラー(error.tsx・global-error.tsx)では見出し h1 にする。
 */
export function ErrorState({ title = "表示できませんでした", titleAs: Title = "p", message, onRetry, showHome = false, compact = false, className }: {
  title?: string; titleAs?: "p" | "h1" | "h2"; message: React.ReactNode; onRetry?: () => void; showHome?: boolean; compact?: boolean; className?: string;
}) {
  return (
    <div role="alert" className={cn("grid justify-items-start gap-3", !compact && "rounded-rl-md border border-rl-line bg-rl-surface p-4 md:p-6", className)}>
      <TriangleAlert aria-hidden className={cn("text-rl-danger", compact ? "size-6" : "size-8")} />
      <Title className={cn("font-bold", compact ? "text-base" : "text-xl")}>{title}</Title>
      <p className="text-sm text-rl-muted">{message}</p>
      {(onRetry || showHome) && (
        <div className="flex flex-wrap gap-3">
          {onRetry && (
            <button type="button" data-slot="button" className={buttonVariants({ variant: compact ? "ghost" : "primary", size: compact ? "sm" : "md" })} onClick={onRetry}>
              <RotateCcw aria-hidden />もう一度試す
            </button>
          )}
          {showHome && (
            <ButtonAnchor href="/" variant="ghost">
              <House aria-hidden />トップへ戻る
            </ButtonAnchor>
          )}
        </div>
      )}
    </div>
  );
}

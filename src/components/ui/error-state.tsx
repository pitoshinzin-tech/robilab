"use client";
import * as React from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonAnchor } from "./button";

export function ErrorState({ title = "表示できませんでした", message, onRetry, showHome = false, compact = false, className }: {
  title?: string; message: React.ReactNode; onRetry?: () => void; showHome?: boolean; compact?: boolean; className?: string;
}) {
  return (
    <div role="alert" className={cn("grid justify-items-start gap-3", !compact && "rounded-rl-md border border-rl-line bg-rl-surface p-4 md:p-6", className)}>
      <TriangleAlert aria-hidden className={cn("text-rl-danger", compact ? "size-6" : "size-8")} />
      <p className={cn("font-bold", compact ? "text-base" : "text-xl")}>{title}</p>
      <p className="text-sm text-rl-muted">{message}</p>
      {(onRetry || showHome) && (
        <div className="flex flex-wrap gap-3">
          {onRetry && (
            <Button type="button" variant={compact ? "ghost" : "primary"} size={compact ? "sm" : "md"} onClick={onRetry}>
              <RotateCcw aria-hidden />もう一度試す
            </Button>
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

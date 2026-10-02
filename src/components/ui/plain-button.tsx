import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./button-link";

type PlainButtonProps = React.ComponentProps<"button"> & ButtonVariants & { loading?: boolean; loadingText?: string };

/**
 * ui/button の Button と同じ見た目・同じ loading の形の、ふつうの <button>(base-ui を import しない)。
 * ロビーのプロフィール・通知のように、base-ui の useButton(約 10KB)を読む必要のない画面で使う。
 * loading の間は押せず、元の文字を見えないまま残すので幅が変わらない。
 */
export function PlainButton({ className, variant, size, loading = false, loadingText, disabled, type = "button", children, ...props }: PlainButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span aria-hidden className="invisible inline-flex items-center justify-center gap-2">{children}</span>
          <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
            <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
            {loadingText ?? children}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

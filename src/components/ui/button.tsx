import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonAnchor, ButtonLink, buttonVariants, type ButtonVariant, type ButtonVariants } from "./button-link";

export type { ButtonVariant };

type ButtonProps = Omit<ButtonPrimitive.Props, "className"> & ButtonVariants & { className?: string; loading?: boolean; loadingText?: string };

/**
 * 押すボタン。loading の間は押せず、中央に回るアイコンと「〜中…」を出す(連打で 2 回動かない)。
 * 元の文字は見えない状態で残すので、loading で幅が変わらない。
 * 見た目(buttonVariants)とリンクの ButtonLink / ButtonAnchor は ./button-link にある(リンクだけのページはそちらを直接 import すると軽い)。
 */
function Button({ className, variant, size, loading = false, loadingText, disabled, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
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
    </ButtonPrimitive>
  );
}

export { Button, ButtonLink, ButtonAnchor, buttonVariants };

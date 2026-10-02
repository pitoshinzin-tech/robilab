import * as React from "react";
import { Check, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./button-link";

type PlainButtonProps = React.ComponentProps<"button"> & ButtonVariants & {
  loading?: boolean;
  loadingText?: string;
  /** (動きの参考 009)送った → 保存中 → できた。success の間は Check と successText を出す(押せるまま) */
  success?: boolean;
  successText?: string;
  /** true で、元の文字・loading(・success)を同じマスに重ね、いちばん広いものの幅で固定する。successText を渡すと常にこの形 */
  fixedWidth?: boolean;
};

const layer = "col-start-1 row-start-1 inline-flex items-center justify-center gap-2";

/**
 * ui/button の Button と同じ見た目・同じ loading の形の、ふつうの <button>(base-ui を import しない)。
 * ロビーのプロフィール・通知のように、base-ui の useButton(約 10KB)を読む必要のない画面で使う。
 * loading の間は押せず、元の文字を見えないまま残すので幅が変わらない。
 * fixedWidth か successText を渡すと、元の文字・loading・success を同じマスに重ね、いちばん広いものの幅で固定する
 * (loadingText が元の文字より長くても、状態が変わってもボタンの幅が変わらず、はみ出さない)。
 */
export function PlainButton({ className, variant, size, loading = false, loadingText, success = false, successText, fixedWidth = false, disabled, type = "button", children, ...props }: PlainButtonProps) {
  if (fixedWidth || successText !== undefined) {
    const phase = loading ? "loading" : success && successText !== undefined ? "success" : "idle";
    return (
      <button
        data-slot="button"
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        <span className="grid">
          <span className={cn(layer, phase !== "idle" && "invisible")}>{children}</span>
          <span className={cn(layer, phase !== "loading" && "invisible")}>
            <LoaderCircle aria-hidden className={cn(phase === "loading" && "animate-spin motion-reduce:animate-none")} />
            {loadingText ?? children}
          </span>
          {successText !== undefined && (
            <span className={cn(layer, phase !== "success" && "invisible")}>
              <Check aria-hidden />
              {successText}
            </span>
          )}
        </span>
      </button>
    );
  }
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

import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-rl-sm border border-rl-line-strong bg-rl-surface px-3 text-base text-rl-text transition-colors duration-(--rl-dur-fast) ease-rl-out placeholder:text-rl-muted hover:border-rl-text/60 focus-visible:border-rl-text aria-invalid:border-rl-danger disabled:cursor-not-allowed disabled:opacity-45";

/** 入力欄(高さ 48、文字 16px。iOS の拡大を防ぐ)。invalid で赤い枠と aria-invalid。 */
function Input({ className, invalid, ...props }: React.ComponentProps<"input"> & { invalid?: boolean }) {
  return <input data-slot="input" aria-invalid={invalid || undefined} className={cn(fieldBase, "h-12", className)} {...props} />;
}

function Textarea({ className, invalid, ...props }: React.ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea data-slot="textarea" aria-invalid={invalid || undefined} className={cn(fieldBase, "min-h-24 py-3", className)} {...props} />;
}

export { Input, Textarea, fieldBase };

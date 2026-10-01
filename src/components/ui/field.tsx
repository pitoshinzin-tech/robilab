import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** 入力欄の aria-describedby に入れる id(補足とエラーがあるときだけ) */
export function fieldDescribedBy(id: string, opts: { hint?: boolean; error?: boolean }): string | undefined {
  const ids = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null].filter((v): v is string => v !== null);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/** エラー文(14px、アイコン+何が違うか+どう直すか) */
export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-2 text-sm text-rl-danger">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * Label・補足・欄・エラーのまとまり。中の欄には id={id} と
 * aria-describedby={fieldDescribedBy(id, { hint, error })} を付ける。
 */
export function Field({ id, label, required, hint, error, className, children }: {
  id: string; label: React.ReactNode; required?: boolean; hint?: React.ReactNode; error?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id} required={required}>{label}</Label>
      {hint && <p id={`${id}-hint`} className="text-sm text-rl-muted">{hint}</p>}
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

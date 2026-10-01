"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";

/** 文字や URL をコピーするボタン。結果は role="status" で読み上げる。 */
export function CopyButton({ text, path, label, copiedLabel = "コピーしました", variant = "secondary", size = "md", className }: {
  text?: string; path?: string; label: string; copiedLabel?: string; variant?: "secondary" | "ghost"; size?: "sm" | "md"; className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copy = () => {
    const value = path ? `${window.location.origin}${path}` : (text ?? "");
    try {
      navigator.clipboard.writeText(value).then(() => setStatus("copied"), () => setStatus("failed"));
    } catch {
      setStatus("failed");
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant={variant} size={size} onClick={copy} className={className}>
        <Copy aria-hidden />{label}
      </Button>
      <span role="status" className="text-sm">
        {status === "copied" && <span className="inline-flex items-center gap-1 text-rl-success"><Check aria-hidden className="size-4" />{copiedLabel}</span>}
        {status === "failed" && <span className="text-rl-danger">コピーできませんでした</span>}
      </span>
    </span>
  );
}

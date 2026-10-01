"use client";
import { useState } from "react";

/** 診断(?debug=1)の JSON をクリップボードにコピーするボタン。 */
export function DiagCopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copy = () => {
    try {
      navigator.clipboard.writeText(text).then(() => setStatus("copied"), () => setStatus("failed"));
    } catch {
      setStatus("failed");
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={copy} className="rounded-full bg-white/10 px-4 py-2 text-sm">診断をコピー</button>
      {status === "copied" && <span role="status" className="text-xs">コピーしました</span>}
      {status === "failed" && <span role="alert" className="text-xs text-[var(--rl-danger)]">コピーできませんでした</span>}
    </span>
  );
}

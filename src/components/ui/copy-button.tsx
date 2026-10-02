"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { PlainButton } from "./plain-button";

/** 「コピーしました」を出しておく時間。過ぎたら元に戻すので、もう一度押したときも読み上げられる */
const COPIED_MS = 2000;

/**
 * 文字や URL をコピーするボタン。結果は role="status" で読み上げる。
 * 動きの参考 017(Copy → Copied):コピーできたら、ボタンのアイコンが Copy から Check に変わる(120ms。幅は変えない)。
 * 押すたびに一度 idle に戻してから結果を出すので、続けて押しても毎回「コピーしました」が読み上げられる。
 * base-ui の Button は使わない(ふつうの <button>。読む JS を増やさない)。
 */
export function CopyButton({ text, path, label, copiedLabel = "コピーしました", variant = "secondary", size = "md", className }: {
  text?: string; path?: string; label: string; copiedLabel?: string; variant?: "secondary" | "ghost"; size?: "sm" | "md"; className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (next: "copied" | "failed") => {
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), COPIED_MS);
  };
  const copy = () => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("idle");
    const value = path ? `${window.location.origin}${path}` : (text ?? "");
    try {
      navigator.clipboard.writeText(value).then(() => show("copied"), () => show("failed"));
    } catch {
      show("failed");
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <PlainButton variant={variant} size={size} onClick={copy} className={className}>
        {status === "copied" ? <Check aria-hidden className="rl-icon-swap text-rl-success" /> : <Copy aria-hidden />}
        {label}
      </PlainButton>
      <span role="status" className="text-sm">
        {status === "copied" && <span className="text-rl-success">{copiedLabel}</span>}
        {status === "failed" && <span className="text-rl-danger">コピーできませんでした</span>}
      </span>
    </span>
  );
}

"use client";
import { CopyButton } from "@/components/ui/copy-button";

/** 診断(?debug=1)の JSON をクリップボードにコピーするボタン。 */
export function DiagCopyButton({ text }: { text: string }) {
  return <CopyButton text={text} label="診断をコピー" size="sm" />;
}

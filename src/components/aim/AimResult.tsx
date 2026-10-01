"use client";
import { buildXShareUrl } from "@/lib/share";
import { buildAimShareText } from "@/lib/aim/share";
import { computeScore } from "@/lib/aim/trace";
import { DiagCopyButton } from "@/components/aim/DiagCopyButton";

type Props = {
  glyph: string; strokes: number; accuracy: number; timeMs: number; perStroke: number[]; sendMessage: string | null; canResend: boolean; sending: boolean; onResend: () => void; onRetry: () => void;
  /** ?debug=1 のときだけ:この回の診断の JSON(あれば「診断をコピー」を出す)。 */
  diagnostics?: string | null;
};

export function AimResult({ glyph, strokes, accuracy, timeMs, perStroke, sendMessage, canResend, sending, onResend, onRetry, diagnostics = null }: Props) {
  const score = computeScore(accuracy, timeMs, strokes);
  const url = typeof window !== "undefined" ? `${window.location.origin}/aim` : "/aim";
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--rl-border)] bg-[var(--rl-card)] p-4">
      <div className="font-[family-name:var(--font-display)] text-4xl text-[var(--rl-highlight)]">{score.toLocaleString("ja-JP")} 点</div>
      <p className="text-sm">正確さ {accuracy.toFixed(1)}% ・ {(timeMs / 1000).toFixed(1)} 秒</p>
      <p className="text-xs text-[var(--rl-muted)]">画ごとの正確さ:{perStroke.map((x) => `${Math.round(x * 100)}%`).join(" / ")}</p>
      {sendMessage && <p role="status" className="text-sm">{sendMessage}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRetry} className="rounded-full bg-[var(--rl-accent)] px-6 py-3 font-bold text-[var(--rl-on-accent)]">もう一度</button>
        <a href={buildXShareUrl(buildAimShareText(glyph, score, accuracy, timeMs), url)} target="_blank" rel="noopener" className="rounded-full bg-white/10 px-6 py-3">X でシェア</a>
        {canResend && <button type="button" onClick={onResend} disabled={sending} className="rounded-full bg-white/10 px-6 py-3 disabled:opacity-50">{sending ? "送信中…" : "ランキングにもう一度送る"}</button>}
      </div>
      {diagnostics && <div><DiagCopyButton text={diagnostics} /></div>}
    </section>
  );
}

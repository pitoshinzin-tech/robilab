"use client";
import { RotateCcw, Share2 } from "lucide-react";
import { buildXShareUrl } from "@/lib/share";
import { buildAimShareText } from "@/lib/aim/share";
import { computeScore } from "@/lib/aim/trace";
import type { Point } from "@/lib/aim/view";
import { DiagCopyButton } from "@/components/aim/DiagCopyButton";
import { TraceOverlay } from "@/components/aim/TraceOverlay";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumUnit } from "@/components/ui/num-unit";
import { Odometer } from "@/components/ui/odometer";
import { StrokeBars } from "@/components/aim/StrokeBars";
import { worstStroke } from "@/lib/aim/stroke-accuracy";

type Props = {
  glyph: string; strokes: number; accuracy: number; timeMs: number; perStroke: number[]; sendMessage: string | null; canResend: boolean; sending: boolean; onResend: () => void; onRetry: () => void;
  /** 追補 6 章:お手本の線(KanjiVG の path)と、なぞった線(重ねの図に使うだけ) */
  strokePaths: readonly string[]; trail?: Point[][] | null;
  /** ?debug=1 のときだけ:この回の診断の JSON(あれば「診断をコピー」を出す)。 */
  diagnostics?: string | null;
};

export function AimResult({ glyph, strokes, accuracy, timeMs, perStroke, sendMessage, canResend, sending, onResend, onRetry, strokePaths, trail = null, diagnostics = null }: Props) {
  const score = computeScore(accuracy, timeMs, strokes);
  const worst = worstStroke(perStroke);
  const url = typeof window !== "undefined" ? `${window.location.origin}/aim` : "/aim";
  return (
    <Card as="section" aria-label="結果" className="grid gap-3">
      {/* 追補 6 章+動きの参考 070:点数は display-1 で、0 から 600ms で桁の輪が回って止まる(読み上げは最後の数だけ) */}
      <NumUnit className="text-rl-display-1" unit="点" value={<Odometer value={score} />} />
      {trail && trail.length > 0 && <TraceOverlay strokes={strokePaths} trail={trail} focus={worst} />}
      <p className="text-base">正確さ {accuracy.toFixed(1)}% ・ {(timeMs / 1000).toFixed(1)} 秒</p>
      <StrokeBars perStroke={perStroke} worst={worst} />
      {sendMessage && <p role="status" className="text-sm">{sendMessage}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={onRetry}><RotateCcw aria-hidden />もう一度</Button>
        <ButtonAnchor href={buildXShareUrl(buildAimShareText(glyph, score, accuracy, timeMs), url)} target="_blank" rel="noopener" variant="secondary"><Share2 aria-hidden />X でシェア</ButtonAnchor>
        {canResend && <Button type="button" variant="secondary" onClick={onResend} loading={sending} loadingText="送信中…">ランキングにもう一度送る</Button>}
      </div>
      {diagnostics && <div><DiagCopyButton text={diagnostics} /></div>}
    </Card>
  );
}

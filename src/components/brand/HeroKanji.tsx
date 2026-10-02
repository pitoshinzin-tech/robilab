"use client";
import { useEffect, useRef, useState, useSyncExternalStore, ViewTransition, type CSSProperties } from "react";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StrokeSlot } from "@/lib/motion/stroke-schedule";
import { appendPoint, pointsToPath, toViewBox, type TracePoint } from "@/lib/motion/hero-trace";
import { MORPH_LINE, VT_TODAY_KANJI } from "@/lib/motion/vt-names";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/use-reduced-motion";
import { KanjiStrokes } from "@/components/brand/KanjiStrokes";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

const FINE = "(hover: hover) and (pointer: fine)";
function subscribeFine(onChange: () => void) {
  const m = window.matchMedia(FINE);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

/**
 * 追補 S1:トップのヒーローの漢字。線は KanjiStrokes が CSS で引く(ここに JS の動きはない)。ここは「触ると答える」部分だけ。
 * PC:描き終わると「漢字をなぞってみる(ドラッグ)」の案内が出る。漢字の上で照準(細い十字と 4 つの角)が出る。押したままなぞると、その線がライムで重なり「この感じで全部の画をなぞる」。点数は付けない。
 * なぞっている間は、速さで色ズレの縁が開き閉じする(動きの参考 045。PC・スマホとも)。
 * スマホ:「1 画なぞってみる」を押したときだけ、漢字の箱が指の入力を受ける(押す前は touch-action: auto でスクロールを奪わない)。
 * (HeroKanji は @/data/types も TypeIcon も import しない。ブラウザの JS を小さくするため。)
 */
export function HeroKanji({ strokes, schedule, className }: { strokes: readonly string[]; schedule: readonly StrokeSlot[]; className?: string }) {
  const fine = useSyncExternalStore(subscribeFine, () => window.matchMedia(FINE).matches, () => false);
  const [trying, setTrying] = useState(false);
  const [aim, setAim] = useState<TracePoint | null>(null);
  const [trace, setTrace] = useState<readonly TracePoint[]>([]);
  const [traced, setTraced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const points = useRef<readonly TracePoint[]>([]);
  const pending = useRef<TracePoint | null>(null);
  const frame = useRef(0);
  const lastPoint = useRef<TracePoint | null>(null);
  const speed = useRef(0);
  // スマホはお試しの 1 画を描き終えたら入力を受けるのをやめる(スクロールを返し、「続きは PC で。」を消さない)
  const capture = trying && !traced;
  const active = fine || capture;
  const lastSlot = schedule.at(-1);
  const drawnAt = lastSlot ? lastSlot.delay + lastSlot.duration : 0;

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const at = (e: React.PointerEvent): TracePoint | null => {
    const el = box.current;
    return el ? toViewBox(e.clientX, e.clientY, el.getBoundingClientRect()) : null;
  };
  /** まだ描いていない点を捨てる(予約したフレームも取り消す) */
  const takePending = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const p = pending.current;
    pending.current = null;
    return p;
  };
  const extend = (p: TracePoint) => {
    const next = appendPoint(points.current, p);
    if (next !== points.current) {
      points.current = next;
      setTrace(next);
    }
  };
  /**
   * 動きの参考 045:なぞる速さで色ズレの縁を開く(0 = 閉じる、1 = ふだんの 3px。それより広げない)。
   * 値は箱の CSS 変数 --rl-shift に直接書く(毎フレームの再描画を足さない)。動きを減らす設定では触らない。
   */
  const setShift = (value: number | null) => {
    const el = box.current;
    if (!el) return;
    if (value === null) el.style.removeProperty("--rl-shift");
    else if (!window.matchMedia(REDUCED_MOTION_QUERY).matches) el.style.setProperty("--rl-shift", value.toFixed(2));
  };
  const trackSpeed = (p: TracePoint) => {
    const prev = lastPoint.current;
    lastPoint.current = p;
    if (!prev) return;
    // 1 フレームに 6 単位(箱の約 5.5%)動けば最大。急に跳ねないよう前の値と混ぜる
    speed.current = speed.current * 0.6 + Math.min(1, Math.hypot(p.x - prev.x, p.y - prev.y) / 6) * 0.4;
    setShift(speed.current);
  };
  // pointermove は 1 フレームに 1 回にまとめる
  const flush = () => {
    frame.current = 0;
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    if (fine) setAim(p);
    if (drawing.current) {
      extend(p);
      trackSpeed(p);
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!active) return;
    pending.current = at(e);
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  };
  const onDown = (e: React.PointerEvent) => {
    if (!active || e.button !== 0) return;
    const p = at(e);
    if (!p) return;
    if (e.pointerType === "mouse") e.preventDefault(); // なぞる間に文字を選ばない
    takePending();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    points.current = [p];
    lastPoint.current = p;
    speed.current = 0;
    setShift(0);
    setDragging(true);
    setTraced(false);
    setTrace(points.current);
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const p = takePending();
    if (p) {
      if (fine) setAim(p);
      extend(p);
    }
    // 離すと 200ms でふだんの 3px に戻って止まる(transition は globals.css の .rl-hero-kanji)
    lastPoint.current = null;
    setShift(null);
    setDragging(false);
    setTraced(points.current.length >= 2);
  };
  const onLeave = () => {
    takePending();
    setAim(null);
  };

  return (
    <div className={cn("grid justify-items-center gap-3", className)}>
      <div ref={box} className={cn("rl-hero-kanji relative size-(--rl-text-hero) lg:size-(--rl-text-hero-lg)", fine && "cursor-crosshair", dragging && "select-none")} style={{ touchAction: capture ? "none" : "auto" }}
        onPointerMove={onMove} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onLeave}>
        {/* 追補 S3:「今日の文字に挑戦」で /aim へ行くと、この漢字が /aim の見出しの漢字へ移る(共有の要素 today-kanji) */}
        <ViewTransition name={VT_TODAY_KANJI} share={MORPH_LINE} default="none">
          <KanjiStrokes strokes={strokes} schedule={schedule} className="size-full" />
        </ViewTransition>
        <svg viewBox="0 0 109 109" aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {trace.length > 1 && <path d={pointsToPath(trace)} fill="none" stroke="var(--rl-success)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
          {fine && aim && (
            <g transform={`translate(${aim.x} ${aim.y})`} fill="none" stroke="var(--rl-accent)" strokeWidth={0.6}>
              <path d="M-7 0H-2M2 0H7M0 -7V-2M0 2V7" />
              <path d="M-5 -3V-5H-3M3 -5H5V-3M5 3V5H3M-3 5H-5V3" />
            </g>
          )}
        </svg>
      </div>
      <div aria-live="polite" className="grid min-h-11 justify-items-center gap-2 text-center">
        {fine && traced && <p className="text-sm">この感じで全部の画をなぞる</p>}
        {/* PC の案内はなぞる前から出す。サーバーの描画では fine=false なので、出し分けは CSS(FINE と同じ条件)で行う */}
        {!traced && !dragging && !trying && (
          <p className="rl-trace-hint hidden text-sm text-rl-muted [@media(hover:hover)_and_(pointer:fine)]:block" style={{ "--rl-drawn-at": `${drawnAt}ms` } as CSSProperties}>
            漢字をなぞってみる(ドラッグ)
          </p>
        )}
        {/* サーバーの描画では fine=false なので、PC ではハイドレーションの前から CSS(FINE と同じ条件)で隠す */}
        {!fine && !trying && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setTrying(true)} className="[@media(hover:hover)_and_(pointer:fine)]:hidden">
            <PenLine aria-hidden />1 画なぞってみる
          </Button>
        )}
        {!fine && trying && !traced && <p className="text-sm text-rl-muted">漢字の上を指でなぞってください</p>}
        {!fine && traced && (
          <>
            <p className="text-sm">続きは PC で。</p>
            <CopyButton path="/aim" label="リンクをコピー" size="sm" />
          </>
        )}
      </div>
    </div>
  );
}

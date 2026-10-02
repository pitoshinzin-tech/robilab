"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PX_PER_CM, rulerLayout, rulerRoomCm } from "@/lib/ruler";

/**
 * 追補 6 章:振り向きの長さの実寸の定規(線の言葉)。1cm ごとの目盛り(5cm ごとに長い)。
 * 入力を変えると、マゼンタの帯が 200ms で新しい長さへ伸び縮みする(transform: scaleX。動きの参考 012 の「線が引かれる」を
 * 人の操作に答える形で。ページを開いたときは最初から引き終わった形で、動かない)。動きを減らす設定では globals.css が transition を止める。
 * 読み上げない(数字は上の文字で読める)。幅は ResizeObserver で測る(測るまでは同じ高さの空きを取っておくので CLS 0)。
 * 画面より長いときは折り返さず、出せる分と、右に ChevronRight と「あと n cm」(rulerRoomCm がその文字の分を空ける)。
 */
export function TurnRuler({ cm }: { cm: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [availableCm, setAvailableCm] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setAvailableCm(entry.contentRect.width / PX_PER_CM));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const room = availableCm === null ? 0 : rulerRoomCm(cm, availableCm);
  const layout = availableCm === null ? null : rulerLayout(cm, room);
  const scale = layout && room > 0 ? layout.shownCm / room : 0;
  return (
    <figure aria-hidden className="grid gap-2">
      <figcaption className="text-sm text-rl-muted">画面上の長さは目安です</figcaption>
      <div ref={box} className="flex h-12 min-w-0 items-start gap-2">
        {layout && room > 0 && (
          <svg width={`${room}cm`} height="12mm" viewBox={`0 0 ${room * 10} 12`} className="shrink-0 overflow-visible">
            <rect x={0} y={0} width={room * 10} height={2} fill="var(--rl-highlight)"
              style={{ transform: `scaleX(${scale})`, transformOrigin: "left", transformBox: "fill-box", transition: "transform 200ms var(--rl-ease-line)" }} />
            <g stroke="var(--rl-text)">
              {layout.ticks.map((t) => <line key={t.cm} x1={t.cm * 10} y1={2} x2={t.cm * 10} y2={t.major ? 10 : 6} strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
            </g>
          </svg>
        )}
        {layout && layout.restCm > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm"><ChevronRight className="size-4" />あと {layout.restCm}cm</span>
        )}
      </div>
    </figure>
  );
}

"use client";
import { COUNT_UP_MS, useCountUpRaw } from "@/lib/motion/use-count-up";
import { odometerWheels } from "@/lib/motion/odometer";

const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/**
 * 動きの参考 070(回転式カウンター)+追補 6 章の数え上げ:0 から durationMs で 1 回だけ数え上げる。
 * 各桁は 0〜9 の帯を transform で回す(1 の位は速く、上の桁は繰り上がりのときだけ回る)。
 * 幅と高さは最後の数の文字で最初から取る(CLS 0)。読み上げは最後の数だけ。動きを減らす設定では最初から最後の数。
 */
export function Odometer({ value, durationMs = COUNT_UP_MS }: { value: number; durationMs?: number }) {
  const raw = useCountUpRaw(value, durationMs);
  const text = value.toLocaleString("ja-JP");
  const chars = [...text];
  const digitCount = chars.filter((c) => c >= "0" && c <= "9").length;
  const wheels = odometerWheels(raw, digitCount);
  // 文字ごとの輪の番号(数字でない「,」は -1)
  const wheelOf: number[] = [];
  for (let i = 0, d = 0; i < chars.length; i++) wheelOf.push(chars[i] >= "0" && chars[i] <= "9" ? d++ : -1);
  return (
    <span className="relative inline-block leading-none">
      <span aria-hidden className="invisible">{text}</span>
      <span aria-hidden className="absolute inset-0 flex overflow-hidden">
        {chars.map((ch, i) => wheelOf[i] < 0 ? <span key={i}>{ch}</span> : (
          <span key={i} className="relative">
            <span className="invisible">{ch}</span>
            <span className="absolute inset-x-0 top-0 flex flex-col items-center" style={{ transform: `translateY(${-wheels[wheelOf[i]]}em)` }}>
              {STRIP.map((n, j) => <span key={j} className="h-[1em]">{n}</span>)}
            </span>
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

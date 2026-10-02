"use client";
import { COUNT_UP_MS, useCountUpRaw } from "@/lib/motion/use-count-up";
import { decimalPlaces, odometerWheels } from "@/lib/motion/odometer";
import { useRollRaw } from "@/lib/motion/use-roll";

const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const isDigit = (c: string) => c >= "0" && c <= "9";

/**
 * 回転式カウンターの見た目。text(最後の数の文字)で幅と高さを最初から取り(CLS 0)、各桁は 0〜9 の帯を transform で回す。
 * raw は「text の数字を小数点を外して 1 つの整数として読んだもの」の、いまの値(丸めない)。読み上げは text だけ。
 */
function OdometerFace({ text, raw }: { text: string; raw: number }) {
  const chars = [...text];
  const wheels = odometerWheels(raw, chars.filter(isDigit).length);
  // 文字ごとの輪の番号(数字でない「,」「.」は -1)
  const wheelOf: number[] = [];
  for (let i = 0, d = 0; i < chars.length; i++) wheelOf.push(isDigit(chars[i]) ? d++ : -1);
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

/**
 * 動きの参考 070(回転式カウンター)+追補 6 章の数え上げ:0 から durationMs で 1 回だけ数え上げる。
 * 各桁は 0〜9 の帯を transform で回す(1 の位は速く、上の桁は繰り上がりのときだけ回る)。
 * 幅と高さは最後の数の文字で最初から取る(CLS 0)。読み上げは最後の数だけ。動きを減らす設定では最初から最後の数。
 */
export function Odometer({ value, durationMs = COUNT_UP_MS }: { value: number; durationMs?: number }) {
  const raw = useCountUpRaw(value, durationMs);
  return <OdometerFace text={value.toLocaleString("ja-JP")} raw={raw} />;
}

/**
 * 動きの参考 070 を人の操作に答える形で:値が変わったら、前の数から新しい数へ 200ms で輪を回す。
 * ページを開いたとき(最初の描画)は回らない(自動の動きを増やさない)。小数もそのまま出す(text は String(value))。
 * 動きを減らす設定ではすぐ新しい数。読み上げは新しい数の文字だけ。
 */
export function RollingNumber({ value }: { value: number }) {
  const text = String(value);
  const raw = useRollRaw(value);
  const f = 10 ** decimalPlaces(text);
  // 止まったときは整数にそろえる(34.64 * 100 = 3464.0000000000005 のような誤差で輪がずれないように)
  return <OdometerFace text={text} raw={raw === value ? Math.round(value * f) : raw * f} />;
}

"use client";
import { useEffect, useState } from "react";
import { DECODE_STEPS, decodeFrame } from "@/lib/motion/decode";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/** 1 段の長さ(2 段で 120ms。押した手応えと同じ長さ) */
const STEP_MS = 60;

/**
 * 動きの参考 064:数字が 2 段だけ乱れてから決まる(1 回だけ。描き直すときは key を変える)。
 * 読み上げは本当の数だけ。動きを減らす設定では最初から本当の数。桁の数は変わらない(幅は tabular-nums でそろう)。
 */
export function DecodeNumber({ value }: { value: string }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timers = Array.from({ length: DECODE_STEPS }, (_, i) => setTimeout(() => setStep(i + 1), STEP_MS * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  return (
    <>
      <span aria-hidden>{reduced ? value : decodeFrame(value, step)}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}

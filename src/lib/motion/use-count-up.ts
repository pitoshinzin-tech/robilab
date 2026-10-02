import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/** 追補 6 章:結果の点数を 0 から 600ms で数え上げる(1 回だけ)。動きを減らす設定では最初から最後の数。 */
export const COUNT_UP_MS = 600;

/** 丸めない値(回転式カウンターの輪を、なめらかに回すために使う)。終わりはちょうど target。 */
export function countUpRaw(target: number, elapsedMs: number, durationMs = COUNT_UP_MS): number {
  if (!(durationMs > 0) || elapsedMs >= durationMs) return target;
  const t = Math.max(0, elapsedMs) / durationMs;
  return target * (1 - (1 - t) ** 3);
}

export function countUpValue(target: number, elapsedMs: number, durationMs = COUNT_UP_MS): number {
  return Math.round(countUpRaw(target, elapsedMs, durationMs));
}

/** 数え上げの今の値(丸めない)。target が変わったら 0 から数え直す。 */
export function useCountUpRaw(target: number, durationMs = COUNT_UP_MS): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const v = countUpRaw(target, now - start, durationMs);
      setShown(v);
      if (v !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);
  return reduced ? target : shown;
}

export function useCountUp(target: number, durationMs = COUNT_UP_MS): number {
  return Math.round(useCountUpRaw(target, durationMs));
}

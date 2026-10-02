import { useEffect, useRef, useState } from "react";
import { rollValue, ROLL_MS } from "./odometer";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * 動きの参考 070:target が変わったら、いま見えている数から新しい数へ durationMs で回す(丸めない値を返す)。
 * 最初の描画では回らない(ページを開いたときの自動の動きにしない)。動きを減らす設定では、いつもすぐ新しい数。
 * 途中で target が変わったら、そのとき見えている数から回し直す。
 */
export function useRollRaw(target: number, durationMs = ROLL_MS): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(target);
  const last = useRef(target);
  useEffect(() => {
    let raf = 0;
    const from = reduced ? target : last.current;
    const start = performance.now();
    const tick = (now: number) => {
      const v = from === target ? target : rollValue(from, target, now - start, durationMs);
      last.current = v;
      setShown(v);
      if (v !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);
  return reduced ? target : shown;
}

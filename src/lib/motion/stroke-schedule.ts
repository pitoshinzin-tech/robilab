/**
 * 追補 S1:今日の漢字を書き順どおりに 1 画ずつ引く時間割。
 * 線の長さに比例して時間を配り、画と画の間は 60ms。合計は画数によらず 1,400ms 以内(画数が多いほど 1 画が速い)。
 * 画数が多い字では、間の合計が全体の 4 割を超えないように間を縮める(線を引く時間を残すため)。
 */
export const STROKE_TOTAL_MS = 1400;
export const STROKE_GAP_MS = 60;
const MAX_GAP_SHARE = 0.4;

export type StrokeSlot = { delay: number; duration: number };

export function strokeSchedule(lengths: readonly number[], totalMs = STROKE_TOTAL_MS, gapMs = STROKE_GAP_MS): StrokeSlot[] {
  const n = lengths.length;
  if (n === 0) return [];
  const safe = lengths.map((l) => (Number.isFinite(l) && l > 0 ? l : 0));
  const gap = n > 1 ? Math.min(gapMs, (totalMs * MAX_GAP_SHARE) / (n - 1)) : 0;
  const drawMs = totalMs - gap * (n - 1);
  const sum = safe.reduce((a, b) => a + b, 0);
  const out: StrokeSlot[] = [];
  let t = 0;
  for (const l of safe) {
    const duration = Math.floor(drawMs * (sum > 0 ? l / sum : 1 / n));
    out.push({ delay: t, duration });
    t += duration + gap;
  }
  return out;
}

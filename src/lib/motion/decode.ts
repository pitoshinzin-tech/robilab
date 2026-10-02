/**
 * 動きの参考 064(文字が乱れてから決まる):数字を DECODE_STEPS 段だけ別の数字にしてから、本当の数にする。
 * 乱れ方は決まった計算(毎回同じ形・テストできる)。桁の数と数字でない文字(「,」など)は変えない。
 */
export const DECODE_STEPS = 2;

export function decodeFrame(value: string, step: number): string {
  if (step < 0 || step >= DECODE_STEPS) return value;
  let i = 0;
  return value.replace(/\d/g, (c) => {
    // 1〜9 だけずらすので、本当の数字と同じにはならない
    const off = 1 + ((2 + 4 * step + 3 * i++) % 9);
    return String((Number(c) + off) % 10);
  });
}

import { AXES, AXIS_LETTERS, type Axes } from "@/data/axes";

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

export function parseAxesParam(raw: string | undefined, code: string): Axes {
  const fromCode = Object.fromEntries(
    AXES.map((a, i) => [a.id, code[i] === AXIS_LETTERS[a.id][0] ? 0.6 : -0.6]),
  ) as Axes;
  if (!raw) return fromCode;
  const nums = raw.split(",").map(Number);
  if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n))) return fromCode;
  const parsed = Object.fromEntries(AXES.map((a, i) => [a.id, clamp(nums[i])])) as Axes;
  const consistent = AXES.every((a) => Math.sign(parsed[a.id]) === Math.sign(fromCode[a.id]));
  return consistent ? parsed : fromCode;
}

/**
 * ?axes= が診断の結果として読めるか(4 つの数で、どれも -1〜1 の中、向きがタイプコードの文字と合う)。
 * 読めないときは、直接開いたのと同じに扱う(%・診断から来た見た目を出さない)。
 */
export function isDiagnosisAxesParam(raw: string | undefined, code: string): boolean {
  if (!raw) return false;
  const nums = raw.split(",").map((s) => (s.trim() === "" ? NaN : Number(s)));
  if (nums.length !== 4) return false;
  return AXES.every((a, i) => {
    const n = nums[i];
    if (!Number.isFinite(n) || n < -1 || n > 1 || n === 0) return false;
    return (n > 0) === (code[i] === AXIS_LETTERS[a.id][0]);
  });
}

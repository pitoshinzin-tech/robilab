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

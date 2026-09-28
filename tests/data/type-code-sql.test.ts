import { describe, it, expect } from "vitest";
import { toTypeCode } from "@/lib/scoring";
import { AXES, type Axes, type AxisId } from "@/data/axes";

// DB 側では type_code を正規表現 ^[AG][RB][CL][HZ]$ でチェックしている
// (supabase/migrations の profiles / diagnosis_results の check 制約と
// _validate_profile_input 関数)。ここでは toTypeCode が生成しうるすべての
// 組み合わせがその正規表現に一致することを保証する。
//
// 注意: AXIS_LETTERS (src/data/axes.ts) の文字を変更する場合は、
// 上記の DB 側の check 制約と _validate_profile_input も同時に
// マイグレーションで更新すること。
const TYPE_CODE_RE = /^[AG][RB][CL][HZ]$/;

function allSignCombinations(): Axes[] {
  const axisIds = AXES.map((a) => a.id) as AxisId[];
  const combos: Axes[] = [];
  for (let mask = 0; mask < 1 << axisIds.length; mask++) {
    const axes = {} as Axes;
    axisIds.forEach((id, i) => {
      axes[id] = (mask & (1 << i)) === 0 ? 0.5 : -0.5;
    });
    combos.push(axes);
  }
  return combos;
}

describe("toTypeCode vs DB check constraint", () => {
  it("produces a code matching ^[AG][RB][CL][HZ]$ for all 16 axis sign combinations", () => {
    const combos = allSignCombinations();
    expect(combos).toHaveLength(16);
    for (const axes of combos) {
      expect(toTypeCode(axes)).toMatch(TYPE_CODE_RE);
    }
  });
});

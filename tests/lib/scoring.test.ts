import { describe, it, expect } from "vitest";
import { scoreAxes, toTypeCode } from "@/lib/scoring";
import { QUESTIONS, type AnswerValue } from "@/data/questions";
import { AXES } from "@/data/axes";

const VALUES: AnswerValue[] = [3, 1, -1, -3];
const all = (v: AnswerValue) => Object.fromEntries(QUESTIONS.map((q) => [q.id, v])) as Record<string, AnswerValue>;

describe("QUESTIONS", () => {
  it("has 12 questions, 3 per axis, 1 reversed per axis", () => {
    expect(QUESTIONS).toHaveLength(12);
    for (const axis of AXES) {
      const qs = QUESTIONS.filter((q) => q.axis === axis.id);
      expect(qs).toHaveLength(3);
      expect(qs.filter((q) => q.reversed)).toHaveLength(1);
    }
  });
});

describe("scoreAxes", () => {
  it("throws when an answer is missing", () => {
    const answers = all(3);
    delete answers.q1;
    expect(() => scoreAxes(answers)).toThrow();
  });

  it("never produces a tie for any of the 64 combinations on an axis", () => {
    const attack = QUESTIONS.filter((q) => q.axis === "attack");
    for (const a of VALUES) for (const b of VALUES) for (const c of VALUES) {
      const answers = all(1);
      answers[attack[0].id] = a;
      answers[attack[1].id] = b;
      answers[attack[2].id] = c;
      const axes = scoreAxes(answers);
      expect(axes.attack).not.toBe(0);
      expect(Math.abs(axes.attack)).toBeLessThanOrEqual(1);
    }
  });

  it("flips reversed questions", () => {
    // 全問「とても当てはまる」→ 各軸 +3 +3 −3 = +3 → 3/9
    const axes = scoreAxes(all(3));
    for (const axis of AXES) expect(axes[axis.id]).toBeCloseTo(3 / 9);
  });
});

describe("toTypeCode", () => {
  it("uses the left letter for positive and right for negative", () => {
    expect(toTypeCode({ attack: 0.3, instinct: 0.3, team: 0.3, heat: 0.3 })).toBe("ARCH");
    expect(toTypeCode({ attack: -0.3, instinct: -0.3, team: -0.3, heat: -0.3 })).toBe("GBLZ");
  });

  it("reaches all 16 types", () => {
    const codes = new Set<string>();
    for (let mask = 0; mask < 16; mask++) {
      codes.add(
        toTypeCode({
          attack: mask & 1 ? 1 : -1,
          instinct: mask & 2 ? 1 : -1,
          team: mask & 4 ? 1 : -1,
          heat: mask & 8 ? 1 : -1,
        }),
      );
    }
    expect(codes.size).toBe(16);
  });
});

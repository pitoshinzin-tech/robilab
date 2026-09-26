import { AXES, AXIS_LETTERS, type Axes, type AxisId } from "@/data/axes";
import { QUESTIONS, type AnswerValue } from "@/data/questions";

/** 回答から4軸の強さ(−1〜+1)を出す。未回答があれば Error。 */
export function scoreAxes(answers: Record<string, AnswerValue>): Axes {
  const sums: Record<AxisId, number> = { attack: 0, instinct: 0, team: 0, heat: 0 };
  for (const q of QUESTIONS) {
    const value = answers[q.id];
    if (value === undefined) throw new Error(`未回答の設問があります: ${q.id}`);
    sums[q.axis] += q.reversed ? -value : value;
  }
  return {
    attack: sums.attack / 9,
    instinct: sums.instinct / 9,
    team: sums.team / 9,
    heat: sums.heat / 9,
  };
}

export function toTypeCode(axes: Axes): string {
  return AXES.map((a) => (axes[a.id] > 0 ? AXIS_LETTERS[a.id][0] : AXIS_LETTERS[a.id][1])).join("");
}

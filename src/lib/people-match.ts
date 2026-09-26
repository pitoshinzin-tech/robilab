import type { Axes, AxisId } from "@/data/axes";

export type PeopleMatch = { score: number; reasons: string[] };

type Rule = { id: AxisId; weight: number; score: (u: number, v: number) => number; reason: string };

const RULES: Rule[] = [
  { id: "heat", weight: 0.4, score: (u, v) => 1 - Math.abs(u - v) / 2, reason: "熱量が近い" },
  { id: "attack", weight: 0.2, score: (u, v) => 1 - Math.abs(u + v) / 2, reason: "攻めと守りで補い合える" },
  { id: "team", weight: 0.2, score: (u, v) => 1 - Math.abs(u + v) / 2, reason: "チームとソロで役割を分けられる" },
  { id: "instinct", weight: 0.2, score: (u, v) => 1 - Math.abs(Math.abs(u - v) - 1), reason: "直感と作戦がほどよく混ざる" },
];

export function peopleScore(u: Axes, v: Axes): PeopleMatch {
  const parts = RULES.map((r) => ({ reason: r.reason, value: r.weight * r.score(u[r.id], v[r.id]), weight: r.weight }));
  const score = Math.round(100 * parts.reduce((s, p) => s + p.value, 0));
  const reasons = parts
    .filter((p) => p.value / p.weight >= 0.6)
    .sort((x, y) => y.value - x.value)
    .slice(0, 2)
    .map((p) => p.reason);
  return { score, reasons };
}

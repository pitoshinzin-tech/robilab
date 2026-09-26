export type AxisId = "attack" | "instinct" | "team" | "heat";

export const AXES = [
  { id: "attack", left: "攻め", right: "守り", leftLetter: "A", rightLetter: "G" },
  { id: "instinct", left: "直感", right: "戦略", leftLetter: "R", rightLetter: "B" },
  { id: "team", left: "チーム", right: "ソロ", leftLetter: "C", rightLetter: "L" },
  { id: "heat", left: "熱血", right: "冷静", leftLetter: "H", rightLetter: "Z" },
] as const satisfies readonly { id: AxisId; left: string; right: string; leftLetter: string; rightLetter: string }[];

export const AXIS_LETTERS: Record<AxisId, [string, string]> = {
  attack: ["A", "G"],
  instinct: ["R", "B"],
  team: ["C", "L"],
  heat: ["H", "Z"],
};

export type Axes = Record<AxisId, number>;

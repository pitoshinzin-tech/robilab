import type { AxisId } from "./axes";

export type AnswerValue = 3 | 1 | -1 | -3;

export const ANSWER_OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: 3, label: "とても当てはまる" },
  { value: 1, label: "やや当てはまる" },
  { value: -1, label: "あまり当てはまらない" },
  { value: -3, label: "全く当てはまらない" },
];

export type Question = { id: string; axis: AxisId; text: string; reversed: boolean };

const ALL: Record<string, Question> = {
  q1: { id: "q1", axis: "attack", text: "有利だと思ったら、自分から先に仕掛けにいく", reversed: false },
  q2: { id: "q2", axis: "attack", text: "じっと待つより、動いて状況を変えたい", reversed: false },
  q3: { id: "q3", axis: "attack", text: "危ない場面では、まず生き残ることを優先する", reversed: true },
  q4: { id: "q4", axis: "instinct", text: "考えるより先に、手が動いていることが多い", reversed: false },
  q5: { id: "q5", axis: "instinct", text: "試合の前に、どう立ち回るか作戦を立てておきたい", reversed: true },
  q6: { id: "q6", axis: "instinct", text: "その場のひらめきで動いたほうが、うまくいく気がする", reversed: false },
  q7: { id: "q7", axis: "team", text: "仲間と声をかけ合いながら遊ぶのが楽しい", reversed: false },
  q8: { id: "q8", axis: "team", text: "自分の腕ひとつで勝ち切る瞬間がたまらない", reversed: true },
  q9: { id: "q9", axis: "team", text: "自分の活躍より、仲間と勝てたことがうれしい", reversed: false },
  q10: { id: "q10", axis: "heat", text: "接戦になるほど、テンションが上がる", reversed: false },
  q11: { id: "q11", axis: "heat", text: "負けたら、すぐにもう1戦やりたくなる", reversed: false },
  q12: { id: "q12", axis: "heat", text: "劣勢でも、いつもと同じテンションでプレイできる", reversed: true },
};

const ORDER = ["q1", "q4", "q7", "q10", "q2", "q5", "q8", "q11", "q3", "q6", "q9", "q12"];

export const QUESTIONS: Question[] = ORDER.map((id) => ALL[id]);

export const DIAGNOSIS_NOTE = "ふだん遊ぶゲーム全体を思い浮かべて答えてください";

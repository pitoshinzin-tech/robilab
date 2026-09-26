import { QUESTIONS, type AnswerValue } from "@/data/questions";

export type DiagnosisState = { index: number; answers: Record<string, AnswerValue>; done: boolean };
export type DiagnosisAction = { type: "answer"; value: AnswerValue } | { type: "back" } | { type: "reset" };

export const initialState: DiagnosisState = { index: 0, answers: {}, done: false };

export function diagnosisReducer(state: DiagnosisState, action: DiagnosisAction): DiagnosisState {
  switch (action.type) {
    case "answer": {
      if (state.done) return state;
      const q = QUESTIONS[state.index];
      const answers = { ...state.answers, [q.id]: action.value };
      const isLast = state.index === QUESTIONS.length - 1;
      return { answers, index: isLast ? state.index : state.index + 1, done: isLast };
    }
    case "back":
      return state.done ? state : { ...state, index: Math.max(0, state.index - 1) };
    case "reset":
      return initialState;
  }
}

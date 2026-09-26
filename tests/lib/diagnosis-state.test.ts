import { describe, it, expect } from "vitest";
import { diagnosisReducer, initialState } from "@/lib/diagnosis-state";
import { QUESTIONS } from "@/data/questions";

describe("diagnosisReducer", () => {
  it("records an answer and advances", () => {
    const s = diagnosisReducer(initialState, { type: "answer", value: 3 });
    expect(s.index).toBe(1);
    expect(s.answers[QUESTIONS[0].id]).toBe(3);
  });
  it("keeps answers when going back", () => {
    let s = diagnosisReducer(initialState, { type: "answer", value: 3 });
    s = diagnosisReducer(s, { type: "answer", value: -1 });
    s = diagnosisReducer(s, { type: "back" });
    expect(s.index).toBe(1);
    expect(s.answers[QUESTIONS[0].id]).toBe(3);
    expect(s.answers[QUESTIONS[1].id]).toBe(-1);
  });
  it("does not go below the first question", () => {
    expect(diagnosisReducer(initialState, { type: "back" }).index).toBe(0);
  });
  it("marks done after the last answer and ignores further answers", () => {
    let s = initialState;
    for (let i = 0; i < QUESTIONS.length; i++) s = diagnosisReducer(s, { type: "answer", value: 1 });
    expect(s.done).toBe(true);
    expect(s.index).toBe(QUESTIONS.length - 1);
    const again = diagnosisReducer(s, { type: "answer", value: -3 });
    expect(again).toBe(s); // 二重送信しても状態は変わらない
  });
  it("resets", () => {
    const s = diagnosisReducer(diagnosisReducer(initialState, { type: "answer", value: 3 }), { type: "reset" });
    expect(s).toEqual(initialState);
  });
});

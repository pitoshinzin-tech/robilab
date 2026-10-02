import { describe, it, expect } from "vitest";
import { QUESTIONS, ANSWER_OPTIONS } from "@/data/questions";
import { diagnosisReducer, initialState } from "@/lib/diagnosis-state";
import { scoreAxes, toTypeCode } from "@/lib/scoring";
import { resultPath, shouldPrefetch } from "@/lib/diagnosis-result";

describe("resultPath(結果の URL は今と同じ形)", () => {
  it("コードと、小数 2 桁の axes", () => {
    const axes = { attack: 0.5, instinct: -0.25, team: 1, heat: -1 };
    const code = toTypeCode(axes);
    expect(resultPath(axes)).toEqual({ code, path: `/type/${code}?axes=0.50,-0.25,1.00,-1.00` });
  });
  it("最後の答えを押した時点で計算した URL は、reducer が終わったあとの URL と同じ", () => {
    for (const opt of ANSWER_OPTIONS) {
      let state = initialState;
      for (let i = 0; i < QUESTIONS.length - 1; i++) state = diagnosisReducer(state, { type: "answer", value: opt.value });
      const last = QUESTIONS[state.index];
      const early = resultPath(scoreAxes({ ...state.answers, [last.id]: opt.value }));
      const done = diagnosisReducer(state, { type: "answer", value: opt.value });
      expect(done.done).toBe(true);
      expect(early).toEqual(resultPath(scoreAxes(done.answers)));
    }
  });
});

describe("shouldPrefetch(節約モードでは先読みしない)", () => {
  it.each([
    [undefined, true], [{}, true], [{ connection: {} }, true], [{ connection: { saveData: false } }, true], [{ connection: { saveData: true } }, false],
  ])("%o → %s", (nav, ok) => {
    expect(shouldPrefetch(nav)).toBe(ok);
  });
});

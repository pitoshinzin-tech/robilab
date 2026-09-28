"use client";
import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, DIAGNOSIS_NOTE } from "@/data/questions";
import { diagnosisReducer, initialState } from "@/lib/diagnosis-state";
import { scoreAxes, toTypeCode } from "@/lib/scoring";
import { recordDiagnosis } from "@/lib/analytics";
import { ProgressBar } from "@/components/diagnosis/ProgressBar";
import { QuestionCard } from "@/components/diagnosis/QuestionCard";

export function DiagnosisClient() {
  const [state, dispatch] = useReducer(diagnosisReducer, initialState);
  const router = useRouter();
  const sent = useRef(false);

  useEffect(() => {
    if (!state.done || sent.current) return;
    sent.current = true;
    const axes = scoreAxes(state.answers);
    const code = toTypeCode(axes);
    void recordDiagnosis(code, axes);
    const packed = [axes.attack, axes.instinct, axes.team, axes.heat].map((n) => n.toFixed(2)).join(",");
    try { sessionStorage.setItem("robilab:lastDiagnosis", JSON.stringify({ code, axes: JSON.stringify(axes) })); } catch {}
    router.push(`/type/${code}?axes=${packed}`);
  }, [state.done, state.answers, router]);

  const q = QUESTIONS[state.index];
  return (
    <div className="grid gap-5">
      <ProgressBar current={state.index + 1} total={QUESTIONS.length} />
      <p className="text-sm text-[var(--rl-muted)]">{DIAGNOSIS_NOTE}</p>
      <QuestionCard question={q} selected={state.answers[q.id]} onAnswer={(value) => dispatch({ type: "answer", value })} />
      <button type="button" onClick={() => dispatch({ type: "back" })} disabled={state.index === 0 || state.done} className="justify-self-start text-sm text-[var(--rl-muted)] disabled:opacity-30">
        ← ひとつ戻る
      </button>
      {state.done && <p className="text-center text-[var(--rl-cyan)]">結果を表示しています…</p>}
    </div>
  );
}

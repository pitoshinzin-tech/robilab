import type { Ref } from "react";
import { ANSWER_OPTIONS, type AnswerValue, type Question } from "@/data/questions";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

/** 1 問の画面。答えは大きなチップ(選んだらパープルの枠+チェック)。次へ進むまでの 200ms も押せる見た目のまま(ちらつかせない)。 */
export function QuestionCard({ question, selected, onAnswer, headingRef }: {
  question: Question; selected?: AnswerValue; onAnswer: (v: AnswerValue) => void; headingRef?: Ref<HTMLHeadingElement>;
}) {
  const headingId = `q-${question.id}`;
  return (
    <Card as="section" aria-labelledby={headingId} className="grid gap-6">
      {/* 追補 6 章:1 問 1 画面で余白が多いので、質問の文を主役に(20 → 24px) */}
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="text-2xl font-bold leading-[1.5]">{question.text}</h2>
      <div role="group" aria-labelledby={headingId} className="grid gap-4">
        {ANSWER_OPTIONS.map((o) => (
          <Chip key={o.value} pressed={selected === o.value} onPressedChange={() => onAnswer(o.value)} className="min-h-14 w-full justify-start text-base">
            {o.label}
          </Chip>
        ))}
      </div>
    </Card>
  );
}

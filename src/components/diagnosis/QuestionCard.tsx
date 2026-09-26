import { ANSWER_OPTIONS, type AnswerValue, type Question } from "@/data/questions";

export function QuestionCard({ question, selected, onAnswer }: { question: Question; selected?: AnswerValue; onAnswer: (v: AnswerValue) => void }) {
  return (
    <div className="rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-5">
      <p className="mb-5 text-lg font-bold leading-relaxed">{question.text}</p>
      <div className="grid gap-3">
        {ANSWER_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onAnswer(o.value)}
            className={`min-h-12 rounded-xl border px-4 text-left transition active:scale-[0.99] ${
              selected === o.value ? "border-[var(--rl-cyan)] bg-[var(--rl-cyan)]/15" : "border-white/15 hover:border-[var(--rl-cyan)]/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

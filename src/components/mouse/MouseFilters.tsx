"use client";
import type { MouseFilter } from "@/lib/mouse-fit";

const GROUPS: { key: keyof MouseFilter; label: string; options: [string, string][] }[] = [
  { key: "weight", label: "重さ", options: [["all", "すべて"], ["le55", "〜55g"], ["le70", "〜70g"], ["gt70", "70g より重い"]] },
  { key: "shape", label: "形", options: [["all", "すべて"], ["symmetric", "左右対称"], ["right", "右手用"]] },
  { key: "connection", label: "接続", options: [["all", "すべて"], ["wireless", "無線"], ["wired", "有線"]] },
];

export function MouseFilters({ value, onChange }: { value: MouseFilter; onChange: (f: MouseFilter) => void }) {
  return (
    <div className="grid gap-2">
      {GROUPS.map((g) => (
        <div key={g.key} className="flex flex-wrap items-center gap-2 text-sm" role="radiogroup" aria-label={g.label}>
          <span className="w-10 text-[var(--rl-muted)]">{g.label}</span>
          {g.options.map(([v, text]) => (
            <button key={v} type="button" role="radio" aria-checked={value[g.key] === v}
              onClick={() => onChange({ ...value, [g.key]: v } as MouseFilter)}
              className={`rounded-full border px-3 py-1 ${value[g.key] === v ? "border-[var(--rl-secondary)] bg-[var(--rl-card)]" : "border-white/10"}`}>
              {text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

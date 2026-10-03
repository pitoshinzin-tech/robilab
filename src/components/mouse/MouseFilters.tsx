"use client";
import type { MouseFilter } from "@/lib/mouse-fit";
import { Card } from "@/components/ui/card";
import { ChipButton, ChipButtonGroup } from "@/components/ui/chip-button";

const GROUPS: { key: keyof MouseFilter; label: string; options: [string, string][] }[] = [
  { key: "weight", label: "重さ", options: [["all", "すべて"], ["le55", "〜55g"], ["le70", "〜70g"], ["gt70", "70g より重い"]] },
  { key: "shape", label: "形", options: [["all", "すべて"], ["symmetric", "左右対称"], ["right", "右手用"]] },
  { key: "connection", label: "接続", options: [["all", "すべて"], ["wireless", "無線"], ["wired", "有線"]] },
];

/**
 * 絞り込みのチップ。
 * bare:箱と見出しを付けない(lg 未満で結果の見出しの下の <details> に入れるとき。見出しは <summary> の「絞り込み」)。
 */
export function MouseFilters({ value, onChange, bare = false }: { value: MouseFilter; onChange: (f: MouseFilter) => void; bare?: boolean }) {
  const groups = GROUPS.map((g) => (
    <div key={g.key} className="grid gap-2">
      <p aria-hidden className="text-sm font-bold text-rl-muted">{g.label}</p>
      <ChipButtonGroup label={g.label}>
        {g.options.map(([v, text]) => (
          <ChipButton key={v} pressed={value[g.key] === v} onClick={() => onChange({ ...value, [g.key]: v } as MouseFilter)}>{text}</ChipButton>
        ))}
      </ChipButtonGroup>
    </div>
  ));
  if (bare) return <div className="grid gap-4">{groups}</div>;
  return (
    <Card as="section" aria-labelledby="mouse-filters" className="grid gap-4">
      <h2 id="mouse-filters" className="text-xl font-bold">絞り込み</h2>
      {groups}
    </Card>
  );
}

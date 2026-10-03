import { ChipLink } from "@/components/ui/chip-link";

export type FilterOption = { key: string; text: string; href: string; current: boolean };

/** 1 つの絞り込みのまとまり(見出し+リンクのチップ)。role="group" と aria-label で読み上げる。hint は目安の説明(14px) */
export function FilterGroup({ label, hint, options }: { label: string; hint?: string; options: FilterOption[] }) {
  return (
    <div className="grid gap-2">
      <p aria-hidden className="text-sm font-bold text-rl-muted">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => <ChipLink key={o.key} href={o.href} current={o.current}>{o.text}</ChipLink>)}
      </div>
      {hint && <p className="text-sm text-rl-muted">{hint}</p>}
    </div>
  );
}

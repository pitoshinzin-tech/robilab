"use client";
import { useState } from "react";
import { normalizeText, type ItemRef } from "@/lib/my-settings";
import { itemLabel, type Option } from "@/lib/item-ref";

type Props = { label: string; listId: string; options: Option[]; value: ItemRef | null; onValue: (v: ItemRef | null) => void; error?: string };

/** 候補から選ぶか、自由入力する欄。候補の名前と完全に一致したら候補の id で保存する。 */
export function ItemPicker({ label, listId, options, value, onValue, error }: Props) {
  const [text, setText] = useState(itemLabel(value, options) ?? "");
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        list={listId}
        value={text}
        placeholder="候補から選ぶか、入力"
        onChange={(e) => {
          setText(e.target.value);
          const t = normalizeText(e.target.value);
          if (t === null) return onValue(null);
          const hit = options.find((o) => o.label === t);
          onValue(hit ? { id: hit.id } : { name: t });
        }}
        className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3 text-base"
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>
      {error && <span role="alert" className="text-xs text-[var(--rl-magenta)]">{error}</span>}
    </label>
  );
}

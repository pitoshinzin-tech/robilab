"use client";
import { useId, useState } from "react";
import { normalizeText, type ItemRef } from "@/lib/my-settings";
import { itemLabel, type Option } from "@/lib/item-ref";
import { Input } from "@/components/ui/input";
import { Field, fieldDescribedBy } from "@/components/ui/field";

type Props = { label: string; listId: string; options: Option[]; value: ItemRef | null; onValue: (v: ItemRef | null) => void; error?: string };

/** 候補から選ぶか、自由入力する欄。候補の名前と完全に一致したら候補の id で保存する。 */
export function ItemPicker({ label, listId, options, value, onValue, error }: Props) {
  const id = useId();
  const [text, setText] = useState(itemLabel(value, options) ?? "");
  return (
    <Field id={id} label={label} error={error}>
      <Input
        id={id}
        list={listId}
        value={text}
        placeholder="候補から選ぶか、入力"
        invalid={Boolean(error)}
        aria-describedby={fieldDescribedBy(id, { error: Boolean(error) })}
        onChange={(e) => {
          setText(e.target.value);
          const t = normalizeText(e.target.value);
          if (t === null) return onValue(null);
          const hit = options.find((o) => o.label === t);
          onValue(hit ? { id: hit.id } : { name: t });
        }}
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>
    </Field>
  );
}

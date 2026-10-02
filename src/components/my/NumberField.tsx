"use client";
import { useId, useState } from "react";
import { parseNumber } from "@/lib/parse-number";
import { Input } from "@/components/ui/input";
import { Field, fieldDescribedBy } from "@/components/ui/field";

type Props = {
  label: string;
  value: number | null;
  onValue: (n: number | null) => void;
  error?: string;
  suffix?: string;
  hint?: string;
  /** 欄の下に出す説明(14px・muted)。ラベルの高さを隣の欄とそろえたいときに、補足をラベルから外してここへ */
  note?: string;
  /** 読めない文字のときに true、空欄か読めたときに false を知らせる(任意) */
  onInvalid?: (invalid: boolean) => void;
};

/** 数字の入力欄。全角や読めない文字はその場で注意し、保存には回さない。 */
export function NumberField({ label, value, onValue, error, suffix, hint, note, onInvalid }: Props) {
  const id = useId();
  const [text, setText] = useState(value === null ? "" : String(value));
  const [parseError, setParseError] = useState(false);
  const message = parseError ? "数字で入力してください。" : error;
  const noteId = `${id}-note`;
  const describedBy = [fieldDescribedBy(id, { hint: Boolean(hint), error: Boolean(message) }), note ? noteId : undefined].filter(Boolean).join(" ") || undefined;
  return (
    <Field id={id} label={label} hint={hint} error={message}>
      <span className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          value={text}
          invalid={Boolean(message)}
          aria-describedby={describedBy}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            if (t.trim() === "") { setParseError(false); onInvalid?.(false); onValue(null); return; }
            const n = parseNumber(t);
            if (n === null) { setParseError(true); onInvalid?.(true); return; }
            setParseError(false);
            onInvalid?.(false);
            onValue(n);
          }}
        />
        {suffix && <span className="text-sm text-rl-muted">{suffix}</span>}
      </span>
      {note && <p id={noteId} className="text-sm text-rl-muted">{note}</p>}
    </Field>
  );
}

"use client";
import { useState } from "react";
import { parseNumber } from "@/lib/parse-number";

type Props = {
  label: string;
  value: number | null;
  onValue: (n: number | null) => void;
  error?: string;
  suffix?: string;
  /** 読めない文字のときに true、空欄か読めたときに false を知らせる(任意) */
  onInvalid?: (invalid: boolean) => void;
};

/** 数字の入力欄。全角や読めない文字はその場で注意し、保存には回さない。 */
export function NumberField({ label, value, onValue, error, suffix, onInvalid }: Props) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [parseError, setParseError] = useState(false);
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <span className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={text}
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
          className="h-12 w-full rounded-xl border border-white/15 bg-[var(--rl-card)] px-3 text-base"
        />
        {suffix && <span className="text-[var(--rl-muted)]">{suffix}</span>}
      </span>
      {(parseError || error) && <span role="alert" className="text-xs text-[var(--rl-danger)]">{parseError ? "数字で入力してください。" : error}</span>}
    </label>
  );
}

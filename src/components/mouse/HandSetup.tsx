"use client";
import { useState } from "react";
import { GRIPS, MY_SETTINGS_LIMITS, type Grip, type MySettings } from "@/lib/my-settings";
import { browserStorage, saveHandToLocal } from "@/lib/my-settings-store";
import { NumberField } from "@/components/my/NumberField";
import { HandGuide } from "./HandGuide";
import { GripFigure } from "./GripFigure";

export const GRIP_INFO: Record<Grip, { label: string; note: string }> = {
  palm: { label: "かぶせ持ち", note: "手のひら全体をマウスに乗せる。安定しやすい" },
  claw: { label: "つかみ持ち", note: "手のひらの付け根だけ乗せ、指を立てる。細かい操作と安定の中間" },
  fingertip: { label: "つまみ持ち", note: "指先だけでつまむ。小さく軽いマウス向き" },
};

type Hand = MySettings["hand"];
const L = MY_SETTINGS_LIMITS;

/** 手の長さ・幅・持ち方の入力。保存はマイ設定(ブラウザ)。保存できなくても、その場の値で結果を出せるように返す。 */
export function HandSetup({ initial, onDone, onCancel }: {
  initial: Hand;
  onDone: (hand: Hand, saved: boolean) => void;
  /** 渡されたときだけ「変えずに戻る」を出す */
  onCancel?: () => void;
}) {
  const [hand, setHand] = useState<Hand>(initial);
  const [error, setError] = useState<string | null>(null);
  // 欄に読めない文字が残っているか(残っていれば送らない)
  const [invalid, setInvalid] = useState({ length: false, width: false });

  const submit = () => {
    if (invalid.length || invalid.width) {
      setError("手の長さ・幅は数字で入力してください。");
      return;
    }
    if (hand.lengthCm === null || hand.lengthCm < L.handLengthMin || hand.lengthCm > L.handLengthMax) {
      setError(`手の長さは ${L.handLengthMin}〜${L.handLengthMax}cm で入力してください。`);
      return;
    }
    if (hand.widthCm !== null && (hand.widthCm < L.handWidthMin || hand.widthCm > L.handWidthMax)) {
      setError(`手の幅は ${L.handWidthMin}〜${L.handWidthMax}cm で入力してください(わからなければ空欄で大丈夫です)。`);
      return;
    }
    if (hand.grip === null) {
      setError("持ち方を選んでください。");
      return;
    }
    setError(null);
    const storage = browserStorage();
    const saved = storage !== null && saveHandToLocal(storage, hand) !== null;
    onDone(hand, saved);
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
      <h2 className="font-bold">手の大きさと持ち方</h2>
      <p className="text-sm text-[var(--rl-muted)]">入力はマイ設定に保存され、次からは自動で使われます。</p>
      <HandGuide />
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="手の長さ" suffix="cm" value={hand.lengthCm} onValue={(lengthCm) => setHand((h) => ({ ...h, lengthCm }))}
          onInvalid={(v) => setInvalid((s) => ({ ...s, length: v }))} />
        <NumberField label="手の幅(任意)" suffix="cm" value={hand.widthCm} onValue={(widthCm) => setHand((h) => ({ ...h, widthCm }))}
          onInvalid={(v) => setInvalid((s) => ({ ...s, width: v }))} />
      </div>
      <div className="grid gap-2" role="group" aria-label="持ち方">
        {GRIPS.map((g) => (
          <button key={g} type="button" aria-pressed={hand.grip === g}
            onClick={() => setHand((h) => ({ ...h, grip: g }))}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${hand.grip === g ? "border-[var(--rl-secondary)] bg-[var(--rl-card)]" : "border-white/10 bg-white/5"}`}>
            <GripFigure grip={g} />
            <span className="grid">
              <span className="font-bold">{GRIP_INFO[g].label}</span>
              <span className="text-xs text-[var(--rl-muted)]">{GRIP_INFO[g].note}</span>
            </span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
      <button type="button" onClick={submit} className="h-12 rounded-full bg-[var(--rl-accent)] font-bold text-[var(--rl-on-accent)]">
        合うマウスを見る
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="h-10 rounded-full bg-white/10 text-sm">変えずに戻る</button>
      )}
    </section>
  );
}

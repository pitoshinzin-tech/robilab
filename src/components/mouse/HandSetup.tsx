"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GRIPS, MY_SETTINGS_LIMITS, type Grip, type MySettings } from "@/lib/my-settings";
import { browserStorage, saveHandToLocal } from "@/lib/my-settings-store";
import { previewHand, rankMice } from "@/lib/mouse-fit";
import { DEVICES } from "@/data/devices";
import { MICE } from "@/data/mice";
import { NumberField } from "@/components/my/NumberField";
import { buttonVariants } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { NumUnit } from "@/components/ui/num-unit";
import { FieldError } from "@/components/ui/field";
import { ChipButton, ChipButtonGroup } from "@/components/ui/chip-button";
import { HandGuide } from "./HandGuide";
import { GripFigure } from "./GripFigure";
import { FitOverlay } from "./FitOverlay";

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
    // 長さは任意(空欄なら平均で計算する)。入っているときだけ範囲を確かめる
    if (hand.lengthCm !== null && (hand.lengthCm < L.handLengthMin || hand.lengthCm > L.handLengthMax)) {
      setError(`手の長さは ${L.handLengthMin}〜${L.handLengthMax}cm で入力してください(わからなければ空欄で大丈夫です)。`);
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

  // 右の列の見本:入力中の値(空・範囲の外は平均、持ち方が未選択ならかぶせ持ち)で、いちばん近いマウスと重ねる。表示だけ
  const preview = previewHand(hand);
  const top = rankMice(preview.hand, MICE)[0]?.mouse;
  const topName = top ? (DEVICES.find((d) => d.id === top.id)?.name ?? "") : "";

  return (
    <Card as="section" aria-labelledby="hand-setup" className="grid gap-4 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-x-12">
      <div className="grid min-w-0 content-start gap-4">
        <h2 id="hand-setup" className="text-xl font-bold">手の大きさと持ち方</h2>
        <p className="text-sm text-rl-muted">入力はマイ設定に保存され、次からは自動で使われます。測り方がわからなければ、持ち方だけでも探せます。</p>
        <details className="group rounded-rl-sm border border-rl-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
            手の測り方を見る<ChevronDown aria-hidden className="size-5 transition-transform duration-(--rl-dur-base) group-open:rotate-180" />
          </summary>
          <div className="p-4 pt-0"><HandGuide /></div>
        </details>
        <div className="grid grid-cols-2 items-start gap-4">
          <NumberField label="手の長さ" note="空欄でも OK" suffix="cm" value={hand.lengthCm} onValue={(lengthCm) => setHand((h) => ({ ...h, lengthCm }))}
            onInvalid={(v) => setInvalid((s) => ({ ...s, length: v }))} />
          <NumberField label="手の幅(任意)" suffix="cm" value={hand.widthCm} onValue={(widthCm) => setHand((h) => ({ ...h, widthCm }))}
            onInvalid={(v) => setInvalid((s) => ({ ...s, width: v }))} />
        </div>
        <div className="grid gap-2">
          <p aria-hidden className="text-sm font-bold">持ち方</p>
          <ChipButtonGroup label="持ち方" className="grid">
            {GRIPS.map((g) => (
              <ChipButton key={g} pressed={hand.grip === g} onClick={() => setHand((h) => ({ ...h, grip: g }))} className="h-auto w-full justify-start gap-3 py-3 text-left">
                <GripFigure grip={g} />
                <span className="grid">
                  <span className="text-base font-bold">{GRIP_INFO[g].label}</span>
                  <span className="text-sm font-medium text-rl-muted">{GRIP_INFO[g].note}</span>
                </span>
              </ChipButton>
            ))}
          </ChipButtonGroup>
        </div>
      </div>
      {/* スマホは入力の下、1024px 以上は右の列。手を入れるたびに数と図が変わる(手の線を引く動きは付けない) */}
      {top && (
        <div className="grid min-w-0 content-start gap-4 border-t border-rl-line pt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          <div className="grid gap-1">
            <p className="text-sm text-rl-muted">{preview.estimated ? "手の長さ(未入力なので平均)" : "あなたの手の長さ"}</p>
            <NumUnit value={preview.hand.lengthCm} unit="cm" muted={preview.estimated} className="text-rl-display-2" />
          </div>
          <FitOverlay handLengthCm={preview.hand.lengthCm} handWidthCm={preview.hand.widthCm} drawHand={false} svgClassName="h-40 lg:h-72"
            mouse={{ id: top.id, name: topName, lengthMm: top.lengthMm, widthMm: top.widthMm }} />
        </div>
      )}
      <div className="grid min-w-0 content-start gap-4 lg:col-start-1">
        {error && <FieldError>{error}</FieldError>}
        <button type="button" className={buttonVariants({ variant: "primary" })} onClick={submit}>合うマウスを見る</button>
        {onCancel && <button type="button" className={buttonVariants({ variant: "ghost" })} onClick={onCancel}>変えずに戻る</button>}
      </div>
    </Card>
  );
}

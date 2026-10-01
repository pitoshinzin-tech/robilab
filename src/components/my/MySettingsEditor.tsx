"use client";
import { useState } from "react";
import Link from "next/link";
import { SENS_GAMES } from "@/data/sensitivity";
import { getType } from "@/data/types";
import { deviceOptions } from "@/data/devices";
import { gameOptions } from "@/data/popular-games";
import { DEVICE_SLOTS, GRIPS, MY_SETTINGS_LIMITS, normalizeText, type Grip, type ItemRef } from "@/lib/my-settings";
import { toPublicCardData } from "@/lib/card-view";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { NumberField } from "./NumberField";
import { ItemPicker } from "./ItemPicker";
import { CrosshairEditor } from "./CrosshairEditor";
import { CardPreview } from "./CardPreview";
import { SyncPanel } from "./SyncPanel";
import { useMySettings } from "./useMySettings";

const SLOT_LABEL = { mouse: "マウス", pad: "マウスパッド", keyboard: "キーボード", headset: "ヘッドセット" } as const;
const GRIP_LABEL: Record<Grip, string> = { palm: "かぶせ", claw: "つかみ", fingertip: "つまみ" };
const box = "grid gap-3 rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4";

/** 6つの枠の位置をここで持つ。画面の枠と保存される並びを常に一致させる。 */
function FavoriteGames({ initial, error, onChange }: { initial: ItemRef[]; error?: string; onChange: (list: ItemRef[]) => void }) {
  const max = MY_SETTINGS_LIMITS.favoriteGamesMax;
  const games = gameOptions();
  const [slots, setSlots] = useState<(ItemRef | null)[]>(() => Array.from({ length: max }, (_, i) => initial[i] ?? null));
  return (
    <section className={box}>
      <h2 className="font-bold">好きなゲーム(最大{max}つ)</h2>
      {slots.map((g, i) => (
        <ItemPicker key={i} label={`${i + 1}つ目`} listId={`fav-games-${i}`} options={games} value={g}
          onValue={(v) => {
            const next = [...slots];
            next[i] = v;
            setSlots(next);
            onChange(next.filter((x): x is ItemRef => x !== null));
          }} />
      ))}
      {error && <p role="alert" className="text-xs text-[var(--rl-danger)]">{error}</p>}
    </section>
  );
}

export function MySettingsEditor() {
  const { draft, errors, update, loggedIn, slug, status, serverError, revision, setPublic, removeAll } = useMySettings();
  const type = draft.typeCode ? getType(draft.typeCode) : undefined;
  const valid = Object.keys(errors).length === 0;

  return (
    <div className="grid gap-5">
      <div key={revision} className="grid gap-5">
      <section className={box}>
        <h2 className="font-bold">タイプ</h2>
        {type ? (
          <div className="flex items-center gap-3"><TypeIcon code={type.code} size={48} /><div><b>{type.code}</b> {type.name}</div></div>
        ) : (
          <Link href="/diagnosis" className="justify-self-start rounded-full bg-[var(--rl-accent)] px-5 py-2 font-bold text-[var(--rl-on-accent)]">診断する(約1分半)</Link>
        )}
      </section>

      <section className={box}>
        <h2 className="font-bold">感度</h2>
        <NumberField label="マウスの DPI" value={draft.dpi} error={errors.dpi} onValue={(dpi) => update({ dpi })} />
        <label className="grid gap-1 text-sm">
          メインのゲーム
          <select value={draft.mainGame ?? ""} onChange={(e) => update({ mainGame: e.target.value || null })}
            className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3 text-base">
            <option value="">選ばない</option>
            {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        {SENS_GAMES.map((g) => (
          <NumberField key={g.id} label={`${g.name} の感度`} value={draft.sens[g.id] ?? null} error={errors[`sens.${g.id}`]}
            onValue={(v) => {
              const sens = { ...draft.sens };
              if (v === null) delete sens[g.id]; else sens[g.id] = v;
              update({ sens });
            }} />
        ))}
      </section>

      <section className={box}>
        <h2 className="font-bold">手と持ち方</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="手の長さ" suffix="cm" value={draft.hand.lengthCm} error={errors["hand.lengthCm"]} onValue={(lengthCm) => update({ hand: { ...draft.hand, lengthCm } })} />
          <NumberField label="手の幅" suffix="cm" value={draft.hand.widthCm} error={errors["hand.widthCm"]} onValue={(widthCm) => update({ hand: { ...draft.hand, widthCm } })} />
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="持ち方">
          {GRIPS.map((g) => (
            <button key={g} type="button" role="radio" aria-checked={draft.hand.grip === g}
              onClick={() => update({ hand: { ...draft.hand, grip: draft.hand.grip === g ? null : g } })}
              className={`h-10 flex-1 rounded-full ${draft.hand.grip === g ? "bg-[var(--rl-accent)] text-[var(--rl-on-accent)]" : "bg-white/10"}`}>
              {GRIP_LABEL[g]}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--rl-muted)]">手の大きさはマウス探しで使います。公開する名刺には出しません。</p>
        <Link href="/mouse" className="text-sm underline">合うマウスを探す</Link>
      </section>

      <section className={box}>
        <h2 className="font-bold">使っているデバイス</h2>
        {DEVICE_SLOTS.map((slot) => (
          <ItemPicker key={slot} label={SLOT_LABEL[slot]} listId={`dev-${slot}`} options={deviceOptions(slot)} value={draft.devices[slot]}
            error={errors[`devices.${slot}`]} onValue={(v) => update({ devices: { ...draft.devices, [slot]: v } })} />
        ))}
      </section>

      <FavoriteGames initial={draft.favoriteGames} error={errors.favoriteGames} onChange={(favoriteGames) => update({ favoriteGames })} />

      <CrosshairEditor value={draft.crosshair} onChange={(crosshair) => update({ crosshair })} />

      <section className={box}>
        <h2 className="font-bold">名刺の表示名</h2>
        <label className="grid gap-1 text-sm">
          カードに出す名前({MY_SETTINGS_LIMITS.cardNameMax}字まで)
          <input defaultValue={draft.cardName ?? ""} onChange={(e) => update({ cardName: normalizeText(e.target.value) })}
            className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3 text-base" />
          {errors.cardName && <span role="alert" className="text-xs text-[var(--rl-danger)]">{errors.cardName}</span>}
        </label>
      </section>
      </div>

      <CardPreview data={valid ? toPublicCardData(draft) : null} />
      <SyncPanel loggedIn={loggedIn} slug={slug} status={status} serverError={serverError} canPublish={valid && status !== "server-error"} hasErrors={!valid}
        onPublic={(on) => void setPublic(on)} onRemove={() => void removeAll().then((ok) => { if (ok) window.location.reload(); })} />
    </div>
  );
}

"use client";
import Link from "next/link";
import { SENS_GAMES } from "@/data/sensitivity";
import { getType } from "@/data/types";
import { deviceOptions } from "@/data/devices";
import { gameOptions } from "@/data/popular-games";
import { DEVICE_SLOTS, GRIPS, MY_SETTINGS_LIMITS, normalizeText, type Grip, type ItemRef } from "@/lib/my-settings";
import { toPublicCardData } from "@/lib/card-view";
import { PixelIcon } from "@/components/brand/PixelIcon";
import { NumberField } from "./NumberField";
import { ItemPicker } from "./ItemPicker";
import { CardPreview } from "./CardPreview";
import { SyncPanel } from "./SyncPanel";
import { useMySettings } from "./useMySettings";

const SLOT_LABEL = { mouse: "マウス", pad: "マウスパッド", keyboard: "キーボード", headset: "ヘッドセット" } as const;
const GRIP_LABEL: Record<Grip, string> = { palm: "かぶせ", claw: "つかみ", fingertip: "つまみ" };
const box = "grid gap-3 rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4";

export function MySettingsEditor() {
  const { draft, errors, update, loggedIn, slug, status, serverError, setPublic, removeAll } = useMySettings();
  const type = draft.typeCode ? getType(draft.typeCode) : undefined;
  const games = gameOptions();
  const favSlots: (ItemRef | null)[] = Array.from({ length: MY_SETTINGS_LIMITS.favoriteGamesMax }, (_, i) => draft.favoriteGames[i] ?? null);
  const valid = Object.keys(errors).length === 0;

  return (
    <div className="grid gap-5">
      <section className={box}>
        <h2 className="font-bold">タイプ</h2>
        {type ? (
          <div className="flex items-center gap-3"><PixelIcon code={type.code} /><div><b>{type.code}</b> {type.name}</div></div>
        ) : (
          <Link href="/diagnosis" className="justify-self-start rounded-full bg-[var(--rl-magenta)] px-5 py-2 font-bold text-[#0a0c16]">診断する(約1分半)</Link>
        )}
      </section>

      <section className={box}>
        <h2 className="font-bold">感度</h2>
        <NumberField label="マウスの DPI" value={draft.dpi} error={errors.dpi} onValue={(dpi) => update({ dpi })} />
        <label className="grid gap-1 text-sm">
          メインのゲーム
          <select value={draft.mainGame ?? ""} onChange={(e) => update({ mainGame: e.target.value || null })}
            className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3 text-base">
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
              className={`h-10 flex-1 rounded-full ${draft.hand.grip === g ? "bg-[var(--rl-cyan)] text-[#0a0c16]" : "bg-white/10"}`}>
              {GRIP_LABEL[g]}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--rl-muted)]">手の大きさはマウス探しで使います。公開する名刺には出しません。</p>
      </section>

      <section className={box}>
        <h2 className="font-bold">使っているデバイス</h2>
        {DEVICE_SLOTS.map((slot) => (
          <ItemPicker key={slot} label={SLOT_LABEL[slot]} listId={`dev-${slot}`} options={deviceOptions(slot)} value={draft.devices[slot]}
            error={errors[`devices.${slot}`]} onValue={(v) => update({ devices: { ...draft.devices, [slot]: v } })} />
        ))}
      </section>

      <section className={box}>
        <h2 className="font-bold">好きなゲーム(最大{MY_SETTINGS_LIMITS.favoriteGamesMax}つ)</h2>
        {favSlots.map((g, i) => (
          <ItemPicker key={i} label={`${i + 1}つ目`} listId={`fav-games-${i}`} options={games} value={g}
            onValue={(v) => {
              const next = [...favSlots];
              next[i] = v;
              update({ favoriteGames: next.filter((x): x is ItemRef => x !== null) });
            }} />
        ))}
        {errors.favoriteGames && <p role="alert" className="text-xs text-[var(--rl-magenta)]">{errors.favoriteGames}</p>}
      </section>

      <section className={box}>
        <h2 className="font-bold">名刺の表示名</h2>
        <label className="grid gap-1 text-sm">
          カードに出す名前({MY_SETTINGS_LIMITS.cardNameMax}字まで)
          <input defaultValue={draft.cardName ?? ""} onChange={(e) => update({ cardName: normalizeText(e.target.value) })}
            className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3 text-base" />
          {errors.cardName && <span role="alert" className="text-xs text-[var(--rl-magenta)]">{errors.cardName}</span>}
        </label>
      </section>

      <CardPreview data={valid ? toPublicCardData(draft) : null} />
      <SyncPanel loggedIn={loggedIn} slug={slug} status={status} serverError={serverError} canPublish={valid && status !== "server-error"}
        onPublic={(on) => void setPublic(on)} onRemove={() => void removeAll().then(() => window.location.reload())} />
    </div>
  );
}

"use client";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronDown, FlaskConical } from "lucide-react";
import { SENS_GAMES, type SensGame } from "@/data/sensitivity";
import { getType } from "@/data/types";
import { deviceOptions } from "@/data/devices";
import { gameOptions } from "@/data/popular-games";
import { DEVICE_SLOTS, GRIPS, MY_SETTINGS_LIMITS, normalizeText, type FieldErrors, type Grip, type ItemRef, type MySettings } from "@/lib/my-settings";
import { toPublicCardData } from "@/lib/card-view";
import { settingsProgress, visibleSensGames, type ProgressItem } from "@/lib/my-progress";
import { cn } from "@/lib/utils";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { NumUnit } from "@/components/ui/num-unit";
import { Badge } from "@/components/ui/badge";
import { ChipButton, ChipButtonGroup } from "@/components/ui/chip-button";
import { Field, FieldError, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SectionHeading } from "@/components/ui/section-heading";
import { NumberField } from "./NumberField";
import { ItemPicker } from "./ItemPicker";
import { CrosshairEditor } from "./CrosshairEditor";
import { CardPreview } from "./CardPreview";
import { SyncPanel } from "./SyncPanel";
import { MyDangerZone } from "./MyDangerZone";
import { useMySettings } from "./useMySettings";

const SLOT_LABEL = { mouse: "マウス", pad: "マウスパッド", keyboard: "キーボード", headset: "ヘッドセット" } as const;
const GRIP_LABEL: Record<Grip, string> = { palm: "かぶせ", claw: "つかみ", fingertip: "つまみ" };
const SENS_IDS = SENS_GAMES.map((g) => g.id);
type Update = (patch: Partial<MySettings>) => void;

/** 入力で埋まり具合が増えたときの印。from から to の手前までの、新しく埋まったマスだけが点く(n で毎回作り直す) */
type Pulse = { from: number; to: number; n: number };

/**
 * (追補 6 章)埋まり具合の 8 マスのバー(1 項目 = 1 マス。1 マス 16px・間 2px)。
 * 開いたときは止まった形。入力で増えたマスだけが、左から 1 マスずつ 2 段で点く(rl-cell-on。動きを減らす設定では止まる)。
 */
function ProgressCells({ total, done, pulse }: { total: number; done: number; pulse: Pulse | null }) {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {Array.from({ length: total }, (_, i) => {
        const on = i < done;
        const fresh = on && pulse !== null && i >= pulse.from && i < pulse.to;
        return (
          <span key={i} className="relative size-4 bg-rl-surface-2">
            {on && (
              <span key={fresh ? `on-${pulse?.n}` : "on"} className={cn("absolute inset-0 bg-rl-secondary", fresh && "rl-cell-on")}
                style={fresh ? ({ "--rl-cell-i": i - (pulse?.from ?? 0) } as CSSProperties) : undefined} />
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * (追補 5-3・6 章)見出しは幅いっぱいの行。埋まった項目は右に Check、まだの項目は「まだ」と文字で。
 * boxed=false:入力が 1 つだけの節は箱にせず、上の線で区切る行にする(箱は入力のまとまりだけ。同じ形の箱が続かないように)。
 */
function Section({ id, title, filled, boxed = true, children }: { id: string; title: string; filled?: boolean; boxed?: boolean; children: ReactNode }) {
  const head = (
    <div className={cn("flex items-center justify-between gap-3", boxed && "border-b border-rl-line pb-3")}>
      <SectionHeading id={id} title={title} className="min-w-0" />
      {filled === true && <span className="inline-flex shrink-0 items-center text-rl-success"><Check aria-hidden className="size-5" /><span className="sr-only">入力済み</span></span>}
      {filled === false && <span className="shrink-0 text-sm text-rl-muted">まだ</span>}
    </div>
  );
  if (!boxed) {
    return <section aria-labelledby={id} className="grid gap-4 border-t border-rl-line pt-6">{head}{children}</section>;
  }
  return <Card as="section" aria-labelledby={id} className="grid gap-4">{head}{children}</Card>;
}

/** 6つの枠の位置をここで持つ。画面の枠と保存される並びを常に一致させる。 */
function FavoriteGames({ initial, error, filled, onChange }: { initial: ItemRef[]; error?: string; filled: boolean; onChange: (list: ItemRef[]) => void }) {
  const max = MY_SETTINGS_LIMITS.favoriteGamesMax;
  const games = gameOptions();
  const [slots, setSlots] = useState<(ItemRef | null)[]>(() => Array.from({ length: max }, (_, i) => initial[i] ?? null));
  return (
    <Section id="my-fav" title={`好きなゲーム(最大${max}つ)`} filled={filled}>
      <div className="grid gap-4 sm:grid-cols-2">
        {slots.map((g, i) => (
          <ItemPicker key={i} label={`${i + 1}つ目`} listId={`fav-games-${i}`} options={games} value={g}
            onValue={(v) => {
              const next = [...slots];
              next[i] = v;
              setSlots(next);
              onChange(next.filter((x): x is ItemRef => x !== null));
            }} />
        ))}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Section>
  );
}

/**
 * 感度。開いておくゲームは、この欄を作った時(読み込み・サーバーの設定を取り込んだ時)に 1 回だけ決める。
 * 入力中に欄が「ほかのゲーム」から上へ移ると、入力の途中で欄が作り直されるため。
 */
function SensSection({ draft, errors, update, filled }: { draft: MySettings; errors: FieldErrors; update: Update; filled: boolean }) {
  const [shown] = useState(() => visibleSensGames(draft, SENS_IDS));
  const field = (g: SensGame) => (
    <NumberField key={g.id} label={`${g.name} の感度`} value={draft.sens[g.id] ?? null} error={errors[`sens.${g.id}`]}
      onValue={(v) => {
        const sens = { ...draft.sens };
        if (v === null) delete sens[g.id]; else sens[g.id] = v;
        update({ sens });
      }} />
  );
  const rest = SENS_GAMES.filter((g) => !shown.includes(g.id));
  return (
    <Section id="my-sens" title="感度" filled={filled}>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="マウスの DPI" value={draft.dpi} error={errors.dpi} onValue={(dpi) => update({ dpi })} />
        <Field id="my-main-game" label="メインのゲーム">
          <NativeSelect id="my-main-game" value={draft.mainGame ?? ""} onChange={(e) => update({ mainGame: e.target.value || null })}>
            <option value="">選ばない</option>
            {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </NativeSelect>
        </Field>
      </div>
      {shown.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{SENS_GAMES.filter((g) => shown.includes(g.id)).map(field)}</div>}
      {rest.length > 0 && (
        <details className="group rounded-rl-sm border border-rl-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
            {shown.length > 0 ? "ほかのゲームを足す" : "ゲームごとの感度を入れる"}
            <ChevronDown aria-hidden className="size-5 shrink-0 transition-transform duration-(--rl-dur-base) ease-rl-out group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 p-4 pt-0 sm:grid-cols-2">{rest.map(field)}</div>
        </details>
      )}
    </Section>
  );
}

export function MySettingsEditor() {
  const { draft, errors, update: save, loggedIn, slug, status, serverError, revision, setPublic, removeAll } = useMySettings();
  const type = draft.typeCode ? getType(draft.typeCode) : undefined;
  const valid = Object.keys(errors).length === 0;
  const progress = settingsProgress(draft);
  const filled = (items: ProgressItem[]) => items.every((i) => !progress.missing.includes(i));
  // 入力したときだけ、埋まり具合のマスと名刺の書き換えを動かす(開いたとき・サーバーの設定を取り込んだときは動かさない)
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const update: Update = (patch) => {
    const after = settingsProgress({ ...draft, ...patch }).done;
    if (after > progress.done) setPulse((p) => ({ from: progress.done, to: after, n: (p?.n ?? 0) + 1 }));
    else if (pulse === null) setPulse({ from: 0, to: 0, n: 0 });
    save(patch);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      {/* 追補 6 章:埋まり具合は 8 マスのバー(1 項目 = 1 マス)と数字 */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 lg:col-span-2">
        <p className="grid gap-1">
          <span className="text-sm text-rl-muted">入力済み</span>
          {/* 0 のときはマゼンタにしない(斜線つきの 0 が「禁止」の印に見えるため) */}
          <NumUnit value={progress.done} unit={`/ ${progress.total} 項目`} muted={progress.done === 0} className="text-rl-display-1" />
        </p>
        <ProgressCells total={progress.total} done={progress.done} pulse={pulse} />
      </div>

      {/* スマホは「名刺 → 項目 → 保存と公開 → 消す操作」の順。1024px 以上は右の列に名刺と保存と公開を固定する */}
      <div className="contents lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-2 lg:grid lg:gap-4">
        <div className="order-1 min-w-0 lg:order-none"><CardPreview data={valid ? toPublicCardData(draft) : null} rewrite={pulse !== null} hasType={Boolean(type)} /></div>
        <div className="order-3 min-w-0 lg:order-none">
          <SyncPanel loggedIn={loggedIn} slug={slug} status={status} serverError={serverError} canPublish={valid && status !== "server-error"} hasErrors={!valid}
            onPublic={(on) => void setPublic(on)} />
        </div>
      </div>

      <div key={revision} className="order-2 grid min-w-0 gap-6 lg:order-none lg:col-start-1 lg:row-start-2">
        <Section id="my-type" title="タイプ" filled={filled(["type"])} boxed={false}>
          {type ? (
            <div className="flex min-w-0 items-center gap-3">
              <TypeIcon code={type.code} size={48} />
              <div className="grid min-w-0 gap-1">
                <Badge variant="code" className="justify-self-start">{type.code}</Badge>
                <span className="text-base font-bold wrap-anywhere">{type.name}</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="text-sm text-rl-muted [word-break:auto-phrase]">診断すると、タイプが名刺に入ります。</p>
              {/* タイプがないときは、名刺の保存ではなく診断がこの画面の主ボタン(CardPreview の hasType と対) */}
              <ButtonLink href="/diagnosis" variant="primary" className="justify-self-start">
                <FlaskConical aria-hidden />1 分半で診断する
              </ButtonLink>
            </div>
          )}
        </Section>

        <SensSection draft={draft} errors={errors} update={update} filled={filled(["dpi", "sens"])} />

        <Section id="my-hand" title="手と持ち方" filled={filled(["handSize", "grip"])}>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="手の長さ" suffix="cm" value={draft.hand.lengthCm} error={errors["hand.lengthCm"]} onValue={(lengthCm) => update({ hand: { ...draft.hand, lengthCm } })} />
            <NumberField label="手の幅" suffix="cm" value={draft.hand.widthCm} error={errors["hand.widthCm"]} onValue={(widthCm) => update({ hand: { ...draft.hand, widthCm } })} />
          </div>
          <div className="grid gap-2">
            <p aria-hidden className="text-sm font-bold">持ち方</p>
            <ChipButtonGroup label="持ち方">
              {GRIPS.map((g) => (
                <ChipButton key={g} pressed={draft.hand.grip === g}
                  onClick={() => update({ hand: { ...draft.hand, grip: draft.hand.grip === g ? null : g } })}>
                  {GRIP_LABEL[g]}
                </ChipButton>
              ))}
            </ChipButtonGroup>
          </div>
          <p className="text-sm text-rl-muted [word-break:auto-phrase]">手の大きさはマウス探しで使います。公開する名刺には出しません。</p>
          <ButtonLink href="/mouse" variant="ghost" size="sm" className="-ml-4 justify-self-start">合うマウスを探す</ButtonLink>
        </Section>

        <Section id="my-devices" title="使っているデバイス" filled={filled(["devices"])}>
          <div className="grid gap-4 sm:grid-cols-2">
            {DEVICE_SLOTS.map((slot) => (
              <ItemPicker key={slot} label={SLOT_LABEL[slot]} listId={`dev-${slot}`} options={deviceOptions(slot)} value={draft.devices[slot]}
                error={errors[`devices.${slot}`]} onValue={(v) => update({ devices: { ...draft.devices, [slot]: v } })} />
            ))}
          </div>
        </Section>

        <FavoriteGames initial={draft.favoriteGames} error={errors.favoriteGames} filled={filled(["favoriteGames"])} onChange={(favoriteGames) => update({ favoriteGames })} />

        <CrosshairEditor value={draft.crosshair} onChange={(crosshair) => update({ crosshair })} />

        <Section id="my-card-name" title="名刺の表示名" filled={filled(["cardName"])} boxed={false}>
          <Field id="my-card-name-input" label={`カードに出す名前(${MY_SETTINGS_LIMITS.cardNameMax}字まで)`} error={errors.cardName}>
            <Input id="my-card-name-input" defaultValue={draft.cardName ?? ""} invalid={Boolean(errors.cardName)}
              aria-describedby={fieldDescribedBy("my-card-name-input", { error: Boolean(errors.cardName) })}
              onChange={(e) => update({ cardName: normalizeText(e.target.value) })} />
          </Field>
        </Section>
      </div>

      <div className="order-4 min-w-0 lg:order-none lg:col-start-1 lg:row-start-3">
        <MyDangerZone loggedIn={loggedIn} onRemove={removeAll} />
      </div>
    </div>
  );
}

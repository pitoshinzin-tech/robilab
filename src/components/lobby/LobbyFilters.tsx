"use client";
import { useEffect, useRef } from "react";
import Form from "next/form";
import { Mic } from "lucide-react";
import { GAMES } from "@/data/games";
import { TIME_SLOTS } from "@/data/lobby-options";
import { buttonVariants } from "@/components/ui/button-link";
import { CheckChip } from "@/components/ui/chip-button";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";

/**
 * 絞り込み(GET で /lobby?game=…)。変えたらすぐ送る。JS がないときだけ「絞り込む」ボタンを出す。
 * base-ui を読まない部品だけで作る(CheckChip は chip-button、ボタンは buttonVariants のクラス)。
 * scroll={false}:絞り込みを変えても、いま見ている位置から動かさない。
 * 欄は uncontrolled なので、URL が外から変わったとき(「条件をゆるめる」で /lobby へ)は欄の値を URL に合わせ直す
 * (key で作り直すとフォーカスが外れるため、DOM の値だけを書き換える)。
 */
export function LobbyFilters({ game: rawGame, slot: rawSlot, voice }: { game?: string; slot?: string; voice: boolean }) {
  // URL の値が選択肢にないとき(古いリンク・手入力)は「全ゲーム」「全時間帯」を出す(欄が空に見えないように)
  const game = GAMES.some((g) => g.id === rawGame) ? rawGame : "";
  const slot = TIME_SLOTS.some((t) => t.id === rawSlot) ? rawSlot : "";
  const gameRef = useRef<HTMLSelectElement>(null);
  const slotRef = useRef<HTMLSelectElement>(null);
  const voiceRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (gameRef.current) gameRef.current.value = game ?? "";
    if (slotRef.current) slotRef.current.value = slot ?? "";
    if (voiceRef.current) voiceRef.current.checked = voice;
  }, [game, slot, voice]);
  const submit = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => e.currentTarget.form?.requestSubmit();
  return (
    <Form action="/lobby" scroll={false} aria-label="絞り込み" className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <Field id="lobby-game" label="ゲーム">
        <NativeSelect ref={gameRef} id="lobby-game" name="game" defaultValue={game ?? ""} onChange={submit}>
          <option value="">全ゲーム</option>
          {GAMES.map((g) => <option key={g.id} value={g.id}>{g.shortName}</option>)}
        </NativeSelect>
      </Field>
      <Field id="lobby-slot" label="時間帯">
        <NativeSelect ref={slotRef} id="lobby-slot" name="slot" defaultValue={slot ?? ""} onChange={submit}>
          <option value="">全時間帯</option>
          {TIME_SLOTS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </NativeSelect>
      </Field>
      <CheckChip ref={voiceRef} name="voice" value="1" defaultChecked={voice} onChange={submit} className="h-12 justify-self-start">
        <Mic aria-hidden className="size-4" />VC 可
      </CheckChip>
      <noscript><button type="submit" className={buttonVariants({ variant: "secondary" })}>絞り込む</button></noscript>
    </Form>
  );
}

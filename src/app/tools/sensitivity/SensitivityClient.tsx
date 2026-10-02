"use client";
import { useMemo, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { SENS_GAMES, getSensGame } from "@/data/sensitivity";
import { NearPros } from "@/components/pros/NearPros";
import { TurnRuler } from "@/components/sensitivity/TurnRuler";
import { Card } from "@/components/ui/card";
import { Field, FieldError, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { NumUnit } from "@/components/ui/num-unit";
import { RollingNumber } from "@/components/ui/odometer";
import { PlainButton } from "@/components/ui/plain-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { parseNumber } from "@/lib/parse-number";
import { edpi, cm360, convertSens, validateInput, isInGameRange } from "@/lib/sensitivity";

import { browserStorage, saveSensToLocal } from "@/lib/my-settings-store";

type Initial = { gameId: string; dpiText: string; sensText: string } | null;

const ERROR_ID = "sens-error";

/**
 * 振り向きの数の大きさ。ふつうの長さ(「34.64」まで 5 文字)は表示用の display-1(56〜72px)。
 * DPI と感度がとても小さいと 6 文字以上(最大「261257.14」)になるので、375px の答えのカードからはみ出さないよう段を下げる。
 */
function turnTextClass(cm: number): string {
  const len = String(cm).length;
  if (len <= 5) return "text-rl-display-1";
  if (len <= 7) return "text-rl-heading";
  return "text-rl-title";
}

export function SensitivityClient({ initial = null }: { initial?: Initial }) {
  const [gameId, setGameId] = useState(initial?.gameId ?? SENS_GAMES[0].id);
  const [dpiText, setDpiText] = useState(initial?.dpiText ?? "800");
  const [sensText, setSensText] = useState(initial?.sensText ?? "0.35");
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);
  const game = getSensGame(gameId)!;
  const dpi = parseNumber(dpiText);
  const sens = parseNumber(sensText);
  const error = validateInput(dpi, sens, game);

  const results = useMemo(() => {
    if (error || dpi === null || sens === null) return null;
    return {
      edpi: edpi(dpi, sens),
      cm: cm360(dpi, sens, game.yaw),
      others: SENS_GAMES.filter((g) => g.id !== game.id).map((g) => ({ game: g, sens: convertSens(sens, game, g) })),
    };
  }, [error, dpi, sens, game]);

  const save = () => {
    if (dpi === null || sens === null) return;
    const ok = saveSensToLocal(browserStorage(), gameId, Math.round(dpi), sens);
    setSaved(ok
      ? { ok: true, text: "マイ設定に保存しました。" }
      : { ok: false, text: "保存できませんでした(DPI は整数、感度は範囲内で入力してください。この端末に保存できない設定のときも保存できません)。" });
  };
  // 入力を変えたら、前の保存の結果の文は消す(保存したのは前の値なので)
  const edit = (set: (v: string) => void) => (v: string) => { set(v); setSaved(null); };
  const inputDescribedBy = error ? ERROR_ID : undefined;

  return (
    <div className="grid gap-8">
      <section aria-label="入力" className="grid gap-4">
        <Field id="sens-game" label="いま遊んでいるゲーム" hint={game.note}>
          <NativeSelect id="sens-game" value={gameId} aria-describedby={fieldDescribedBy("sens-game", { hint: Boolean(game.note) })}
            onChange={(e) => edit(setGameId)(e.target.value)}>
            {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </NativeSelect>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="sens-dpi" label="マウスの DPI">
            <Input id="sens-dpi" inputMode="decimal" value={dpiText} invalid={Boolean(error)} aria-describedby={inputDescribedBy} onChange={(e) => edit(setDpiText)(e.target.value)} />
          </Field>
          <Field id="sens-value" label="ゲーム内の感度">
            <Input id="sens-value" inputMode="decimal" value={sensText} invalid={Boolean(error)} aria-describedby={inputDescribedBy} onChange={(e) => edit(setSensText)(e.target.value)} />
          </Field>
        </div>
        {error && <FieldError id={ERROR_ID}>{error}</FieldError>}
      </section>

      {results && (
        <>
          {/* 追補 6 章:振り向きは display-1 の「34.6」+「cm」(4-4 の組み)。その下に実寸の定規。数は入力を変えたときだけ回る(070) */}
          <Card as="section" aria-label="答え" className="grid gap-6">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
              <div className="grid min-w-0 gap-2">
                <p className="text-sm text-rl-muted">振り向き</p>
                <NumUnit value={<RollingNumber value={results.cm} />} unit="cm" className={turnTextClass(results.cm)} />
              </div>
              <div className="grid gap-2">
                <p className="text-sm text-rl-muted">eDPI</p>
                <p className="font-display text-2xl tabular-nums text-rl-highlight">{results.edpi}</p>
              </div>
            </div>
            <TurnRuler cm={results.cm} />
          </Card>
          <div className="grid gap-2">
            <PlainButton variant="secondary" className="justify-self-start" onClick={save}>マイ設定に保存</PlainButton>
            {saved && (
              <p role="status" className={saved.ok ? "flex items-start gap-2 text-sm text-rl-success" : "flex items-start gap-2 text-sm text-rl-danger"}>
                {saved.ok ? <Check aria-hidden className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
                <span className="min-w-0">{saved.text}</span>
              </p>
            )}
          </div>
          <section aria-labelledby="sens-others" className="grid gap-4">
            <SectionHeading id="sens-others" title="ほかのゲームだと…" />
            <ul className="grid gap-2">
              {results.others.map((o) => (
                <li key={o.game.id} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-rl-sm bg-rl-surface px-4 py-3">
                  <span className="min-w-0 text-base">{o.game.name}</span>
                  {isInGameRange(o.sens, o.game) ? (
                    <span className="font-display text-base tabular-nums">{o.sens}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-rl-warning"><TriangleAlert aria-hidden className="size-4 shrink-0" />設定できる範囲({o.game.min}〜{o.game.max})の外です</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <NearPros cm={results.cm} gameId={gameId} />
        </>
      )}
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import { SENS_GAMES, getSensGame } from "@/data/sensitivity";
import { NearPros } from "@/components/pros/NearPros";
import { parseNumber } from "@/lib/parse-number";
import { edpi, cm360, convertSens, validateInput, isInGameRange } from "@/lib/sensitivity";

import { browserStorage, saveSensToLocal } from "@/lib/my-settings-store";

type Initial = { gameId: string; dpiText: string; sensText: string } | null;

export function SensitivityClient({ initial = null }: { initial?: Initial }) {
  const [gameId, setGameId] = useState(initial?.gameId ?? SENS_GAMES[0].id);
  const [dpiText, setDpiText] = useState(initial?.dpiText ?? "800");
  const [sensText, setSensText] = useState(initial?.sensText ?? "0.35");
  const [saved, setSaved] = useState<string | null>(null);
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

  return (
    <div className="grid gap-5">
      <label className="grid gap-1 text-sm">
        いま遊んでいるゲーム
        <select value={gameId} onChange={(e) => setGameId(e.target.value)} className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3 text-base">
          {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </label>
      {game.note && <p className="text-xs text-[var(--rl-lime)]">{game.note}</p>}
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          マウスの DPI
          <input inputMode="decimal" value={dpiText} onChange={(e) => setDpiText(e.target.value)} className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3 text-base" />
        </label>
        <label className="grid gap-1 text-sm">
          ゲーム内の感度
          <input inputMode="decimal" value={sensText} onChange={(e) => setSensText(e.target.value)} className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3 text-base" />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
      {!error && dpi !== null && sens !== null && (
        <div className="grid gap-1">
          <button type="button"
            onClick={() => setSaved(saveSensToLocal(browserStorage(), gameId, Math.round(dpi), sens) ? "マイ設定に保存しました。" : "保存できませんでした(DPI は整数、感度は範囲内で入力してください。この端末に保存できない設定のときも保存できません)。")}
            className="justify-self-start rounded-full bg-white/10 px-5 py-2 text-sm">
            マイ設定に保存
          </button>
          {saved && <p className="text-xs text-[var(--rl-lime)]">{saved}</p>}
        </div>
      )}
      {results && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
              <div className="text-xs text-[var(--rl-muted)]">振り向き</div>
              <div className="font-display text-2xl text-[var(--rl-cyan)]">{results.cm} cm</div>
            </div>
            <div className="rounded-xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
              <div className="text-xs text-[var(--rl-muted)]">eDPI</div>
              <div className="font-display text-2xl text-[var(--rl-magenta)]">{results.edpi}</div>
            </div>
          </div>
          <div>
            <h2 className="mb-2 font-bold">ほかのゲームだと…</h2>
            <ul className="grid gap-2">
              {results.others.map((o) => (
                <li key={o.game.id} className="flex justify-between rounded-lg bg-white/5 px-4 py-3">
                  <span>{o.game.name}</span>
                  <span className="font-display">
                    {isInGameRange(o.sens, o.game) ? o.sens : "範囲外"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <NearPros cm={results.cm} gameId={gameId} />
        </div>
      )}
    </div>
  );
}

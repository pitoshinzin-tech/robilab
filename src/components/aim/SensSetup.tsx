"use client";
import { useState } from "react";
import { SENS_GAMES } from "@/data/sensitivity";
import { parseNumber } from "@/lib/parse-number";
import { browserStorage, saveSensToLocal } from "@/lib/my-settings-store";

/** マイ設定に感度がない人に、ゲーム・感度・DPI を聞いてマイ設定に保存する。 */
export function SensSetup({ onSaved, initialGameId, loggedIn = false }: { onSaved: () => void; initialGameId?: string | null; loggedIn?: boolean }) {
  const [gameId, setGameId] = useState(SENS_GAMES.some((g) => g.id === initialGameId) ? initialGameId! : SENS_GAMES[0].id);
  const [dpi, setDpi] = useState("800");
  const [sens, setSens] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4">
      <p className="text-sm">ゲームと同じ感度で練習するために、ふだんの設定を教えてください(マイ設定に保存されます)。</p>
      <select value={gameId} onChange={(e) => setGameId(e.target.value)} aria-label="ゲーム" className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3">
        {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input inputMode="decimal" value={dpi} onChange={(e) => setDpi(e.target.value)} placeholder="DPI" aria-label="DPI" className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3" />
        <input inputMode="decimal" value={sens} onChange={(e) => setSens(e.target.value)} placeholder="ゲーム内の感度" aria-label="ゲーム内の感度" className="h-12 rounded-xl border border-white/15 bg-[var(--rl-card)] px-3" />
      </div>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
      <button type="button" className="h-12 rounded-full bg-[var(--rl-accent)] font-bold text-[var(--rl-on-accent)]"
        onClick={() => {
          const d = parseNumber(dpi), s = parseNumber(sens);
          if (d === null || s === null) {
            setError("DPI(50〜64000の整数)と、ゲームの範囲内の感度を入力してください。");
            return;
          }
          if (!saveSensToLocal(browserStorage(), gameId, Math.round(d), s)) {
            setError("保存できませんでした。DPI(50〜64000の整数)と、ゲームの範囲内の感度を確かめてください(この端末に保存できない設定のときも保存できません)。");
            return;
          }
          onSaved();
        }}>
        保存して練習する
      </button>
      {!loggedIn && <p className="text-xs text-[var(--rl-muted)]">ログインするとランキングに載ります</p>}
    </div>
  );
}

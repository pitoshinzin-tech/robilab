"use client";
import { useState } from "react";
import { SENS_GAMES } from "@/data/sensitivity";
import { parseNumber } from "@/lib/parse-number";
import { browserStorage, saveSensToLocal } from "@/lib/my-settings-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

/** マイ設定に感度がない人に、ゲーム・感度・DPI を聞いてマイ設定に保存する。 */
export function SensSetup({ onSaved, initialGameId, loggedIn = false }: { onSaved: () => void; initialGameId?: string | null; loggedIn?: boolean }) {
  const [gameId, setGameId] = useState(SENS_GAMES.some((g) => g.id === initialGameId) ? initialGameId! : SENS_GAMES[0].id);
  const [dpi, setDpi] = useState("800");
  const [sens, setSens] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = () => {
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
  };
  return (
    <Card className="grid gap-4">
      <p className="text-base">ゲームと同じ感度で練習するために、ふだんの設定を教えてください(マイ設定に保存されます)。</p>
      <Field id="aim-sens-game" label="ゲーム">
        <NativeSelect id="aim-sens-game" value={gameId} onChange={(e) => setGameId(e.target.value)}>
          {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </NativeSelect>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="aim-sens-dpi" label="DPI"><Input id="aim-sens-dpi" inputMode="decimal" value={dpi} onChange={(e) => setDpi(e.target.value)} invalid={Boolean(error)} /></Field>
        <Field id="aim-sens-value" label="ゲーム内の感度"><Input id="aim-sens-value" inputMode="decimal" value={sens} onChange={(e) => setSens(e.target.value)} invalid={Boolean(error)} /></Field>
      </div>
      {error && <FieldError>{error}</FieldError>}
      <Button type="button" variant="primary" className="justify-self-start" onClick={save}>保存して練習する</Button>
      {!loggedIn && <p className="text-sm text-rl-muted">ログインするとランキングに載ります</p>}
    </Card>
  );
}

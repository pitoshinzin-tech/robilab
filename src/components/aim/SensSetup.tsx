"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { SENS_GAMES } from "@/data/sensitivity";
import { parseNumber } from "@/lib/parse-number";
import { browserStorage, saveSensToLocal } from "@/lib/my-settings-store";
import { parsePath, toStroke } from "@/lib/aim/path";
import { strokeSchedule } from "@/lib/motion/stroke-schedule";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { KanjiStrokes } from "@/components/brand/KanjiStrokes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

/** 保存したあと、線を引き終えてから遊ぶ面に変わるまでの余韻 */
const AFTER_DRAW_MS = 200;

/**
 * マイ設定に感度がない人に、ゲーム・感度・DPI を聞いてマイ設定に保存する。
 * PC(lg 以上)は 2 列:左 5 列にフォーム、右 7 列に「遊ぶ面の予告」(遊ぶ面と同じ高さの暗い枠に、今日の漢字のお手本の線)。
 * 動きの参考 012:保存したら、予告の枠の線が S1 と同じ時間割で引かれてから遊ぶ面に変わる(人の操作に答える 1 回だけ。
 * 動きを減らす設定では引かずにすぐ変わる)。保存の処理と文言は前と同じ。
 */
export function SensSetup({ onSaved, initialGameId, loggedIn = false, strokes, loginHint }: {
  onSaved: () => void; initialGameId?: string | null; loggedIn?: boolean;
  /** 今日の漢字の線(KanjiVG の path) */
  strokes: readonly string[];
  /** 未ログインのときの案内(文+ログインのボタン) */
  loginHint?: ReactNode;
}) {
  const [gameId, setGameId] = useState(SENS_GAMES.some((g) => g.id === initialGameId) ? initialGameId! : SENS_GAMES[0].id);
  const [dpi, setDpi] = useState("800");
  const [sens, setSens] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const reduced = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const schedule = useMemo(() => strokeSchedule(strokes.map((d) => toStroke(parsePath(d)).length)), [strokes]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const save = () => {
    if (drawing) return;
    const d = parseNumber(dpi), s = parseNumber(sens);
    if (d === null || s === null) {
      setError("DPI(50〜64000の整数)と、ゲームの範囲内の感度を入力してください。");
      return;
    }
    if (!saveSensToLocal(browserStorage(), gameId, Math.round(d), s)) {
      setError("保存できませんでした。DPI(50〜64000の整数)と、ゲームの範囲内の感度を確かめてください(この端末に保存できない設定のときも保存できません)。");
      return;
    }
    setError(null);
    // 予告の枠が見えない幅(lg 未満)と、動きを減らす設定では、すぐ遊ぶ面にする
    if (reduced || !window.matchMedia("(min-width: 64rem)").matches) {
      onSaved();
      return;
    }
    setDrawing(true);
    const last = schedule.at(-1);
    timer.current = setTimeout(onSaved, (last ? last.delay + last.duration : 0) + AFTER_DRAW_MS);
  };

  return (
    <Card className="grid gap-6 lg:grid-cols-12">
      {/* 予告の枠(遊ぶ面と同じ高さ)の横で、フォームの列は縦の真ん中に置く */}
      <div className="grid max-w-[480px] content-start gap-4 lg:col-span-5 lg:content-center">
        <p className="text-xl font-bold">この面で、今日の文字をなぞります</p>
        <p className="text-base">ゲームと同じ感度で練習するために、ふだんの設定を教えてください(マイ設定に保存されます)。</p>
        <Field id="aim-sens-game" label="ゲーム">
          <NativeSelect id="aim-sens-game" value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </NativeSelect>
        </Field>
        <div className="flex flex-wrap gap-3">
          <Field id="aim-sens-dpi" label="DPI" className="w-40"><Input id="aim-sens-dpi" inputMode="decimal" value={dpi} onChange={(e) => setDpi(e.target.value)} invalid={Boolean(error)} /></Field>
          <Field id="aim-sens-value" label="ゲーム内の感度" className="w-40"><Input id="aim-sens-value" inputMode="decimal" placeholder="例 0.4" value={sens} onChange={(e) => setSens(e.target.value)} invalid={Boolean(error)} aria-describedby="aim-sens-help" /></Field>
        </div>
        <p id="aim-sens-help" className="text-sm text-rl-muted">
          感度が分からないときは、ゲームの設定の「マウス感度」の数字です。ほかのゲームから換算するなら<Link href="/tools/sensitivity" className="text-rl-accent underline">感度計算</Link>
        </p>
        {error && <FieldError>{error}</FieldError>}
        <Button type="button" variant="primary" className="justify-self-start" onClick={save} disabled={drawing}>保存して練習する</Button>
        {drawing && <p role="status" className="text-sm">保存しました。書く面を用意しています</p>}
        {!loggedIn && loginHint}
        <p className="text-sm text-rl-muted">保存した感度はマイ設定で変えられます</p>
      </div>
      {/* 遊ぶ面の予告。遊ぶ面と同じ高さの箱を取っておき、保存したあとに画面が跳ねないようにする */}
      <div aria-hidden className="relative hidden h-[min(70vh,640px)] place-items-center rounded-rl-md border border-rl-line bg-rl-bg lg:col-span-7 lg:grid">
        <KanjiStrokes key={drawing ? "draw" : "guide"} strokes={strokes} tone={drawing ? "hero" : "muted"} schedule={drawing ? schedule : undefined} className="aspect-square w-1/2 max-w-80" />
        {!drawing && <p className="absolute bottom-6 text-sm text-rl-muted">感度を入れると、ここで書けます</p>}
      </div>
    </Card>
  );
}

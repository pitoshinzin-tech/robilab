"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AimChar } from "@/lib/aim/daily";
import { jstDate } from "@/lib/aim/daily";
import { degreesPerCount } from "@/lib/aim/view";
import { aimErrorMessage } from "@/lib/aim/share";
import { CROSSHAIR_DEFAULT } from "@/lib/crosshair";
import { adoptServerIfLocalEmpty, browserStorage, loadLocal } from "@/lib/my-settings-store";
import { useIsClient } from "@/lib/use-is-client";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { errorCodeOf } from "@/lib/lobby-errors";
import { AimGame } from "@/components/aim/AimGame";
import { SensSetup } from "@/components/aim/SensSetup";
import { AimResult } from "@/components/aim/AimResult";
import { Ranking, type RankingRow } from "@/components/aim/Ranking";
import { LoginButton } from "@/components/lobby/LoginButton";

type Result = { accuracy: number; timeMs: number; perStroke: number[] };
const noSubscribe = () => () => {};
const finePointer = () => window.matchMedia("(pointer: fine)").matches;
// ?debug=1 のときだけ、遊ぶ画面に診断を出す
const debugParam = () => new URLSearchParams(window.location.search).get("debug") === "1";
// 再送しても結果が変わらないエラー
const NO_RETRY = ["NOT_LOGGED_IN", "WRONG_DATE", "WRONG_CHAR", "NOT_ACTIVE", "BANNED", "INVALID_INPUT"];

export function AimClient({ char, date, rows }: { char: AimChar; date: string; rows: RankingRow[] }) {
  const router = useRouter();
  const isClient = useIsClient();
  const hasMouse = useSyncExternalStore(noSubscribe, finePointer, () => true);
  const debug = useSyncExternalStore(noSubscribe, debugParam, () => false);
  const [settingsRev, setSettingsRev] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [round, setRound] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState<{ rank: number; score: number } | null>(null);

  const settings = isClient ? loadLocal(browserStorage()) : null;
  void settingsRev;
  const deg = settings?.mainGame && settings.sens[settings.mainGame] ? degreesPerCount(settings.mainGame, settings.sens[settings.mainGame]) : null;
  const crosshair = settings?.crosshair ?? CROSSHAIR_DEFAULT;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setLoggedIn(Boolean(data.user));
      if (!data.user) return;
      // この端末にマイ設定がなければ、サーバーの設定を使う(新しい端末で感度を聞き直さず、ほかのゲームの感度も消さない)
      // サーバーへは何も送らない(全体の同期は /my がする)
      const storage = browserStorage();
      if (loadLocal(storage)) return;
      const { data: row, error } = await supabase.from("my_settings").select("data").maybeSingle();
      if (cancelled || error) return;
      if (adoptServerIfLocalEmpty(storage, row?.data ?? null)) setSettingsRev((n) => n + 1);
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshMine = useCallback(() => {
    if (!loggedIn) return;
    createSupabaseBrowser().rpc("my_aim_rank", { p_date: date }).then(({ data }) => {
      const row = (data as { rank: number; score: number }[] | null)?.[0];
      setMine(row ? { rank: row.rank, score: row.score } : null);
    });
  }, [loggedIn, date]);
  useEffect(() => { refreshMine(); }, [refreshMine]);

  const sendingRef = useRef(false);
  const submit = useCallback(async (r: Result) => {
    if (!loggedIn || sendingRef.current) return;
    if (jstDate(new Date()) !== date) { setSendMessage(aimErrorMessage("WRONG_DATE")); setCanResend(false); router.refresh(); return; }
    sendingRef.current = true;
    setSending(true);
    try {
      const { data, error } = await createSupabaseBrowser().rpc("submit_aim_score", {
        p_date: date, p_char_id: char.id, p_accuracy: r.accuracy, p_time_ms: r.timeMs, p_strokes: char.strokes.length,
      });
      if (error) {
        const code = errorCodeOf(error);
        setSendMessage(aimErrorMessage(code));
        setCanResend(!NO_RETRY.includes(code ?? ""));
        if (code === "NOT_LOGGED_IN") setLoggedIn(false);
        // 日付・お題が変わっていたら、新しい今日の文字を読み込む
        if (code === "WRONG_DATE" || code === "WRONG_CHAR") router.refresh();
        return;
      }
      setSendMessage(`ランキングに送りました(今日の自己ベスト ${Number(data).toLocaleString("ja-JP")} 点)。`);
      setCanResend(false);
      refreshMine();
      router.refresh();
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [loggedIn, date, char, refreshMine, router]);

  // 日付が変わっていたら、もう一度の前に新しい今日の文字を読み込む
  const retry = () => {
    if (jstDate(new Date()) !== date) router.refresh();
    setResult(null); setSendMessage(null); setCanResend(false); setRound((n) => n + 1);
  };

  let play;
  if (!isClient) play = <div className="aspect-video w-full animate-pulse rounded-xl bg-white/5" />;
  else if (!hasMouse) play = <p className="rounded-xl bg-[var(--rl-card)] p-4 text-sm">「今日の文字」は PC(マウス)で遊べます。スマホでは、今日の文字とランキングを見られます。{!loggedIn && <span className="mt-2 block text-xs text-[var(--rl-muted)]">ログインするとランキングに載ります</span>}</p>;
  else if (deg === null) play = <SensSetup onSaved={() => setSettingsRev((n) => n + 1)} initialGameId={settings?.mainGame} loggedIn={loggedIn} />;
  else {
    play = (
      <div className="grid gap-4">
        {result ? (
          <AimResult glyph={char.glyph} strokes={char.strokes.length} {...result} sendMessage={sendMessage} canResend={canResend} sending={sending}
            onResend={() => void submit(result)} onRetry={retry} />
        ) : (
          <AimGame key={`${date}:${char.id}:${round}`} char={char} degPerCount={deg} crosshair={crosshair} debug={debug}
            onFinish={(r) => { setResult(r); void submit(r); }}
            onAbort={() => setRound((n) => n + 1)} />
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/my" className="underline">クロスヘアと感度を変える(マイ設定)</Link>
          {!loggedIn && <><span className="text-[var(--rl-muted)]">ログインするとランキングに載ります</span><LoginButton next="/aim" /></>}
        </div>
      </div>
    );
  }

  return (
    <>
      {play}
      <Ranking rows={rows} mine={mine} loggedIn={loggedIn} />
    </>
  );
}

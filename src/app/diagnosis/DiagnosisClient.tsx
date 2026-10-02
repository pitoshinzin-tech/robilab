"use client";
import { useEffect, useReducer, useRef, useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { QUESTIONS, DIAGNOSIS_NOTE, type AnswerValue } from "@/data/questions";
import { diagnosisReducer, initialState } from "@/lib/diagnosis-state";
import { scoreAxes } from "@/lib/scoring";
import { recordDiagnosis } from "@/lib/analytics";
import { applyDiagnosisToLocal, browserStorage } from "@/lib/my-settings-store";
import { resultPath, shouldPrefetch } from "@/lib/diagnosis-result";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { MORPH_PIXEL, TYPE_REVEAL, VT_TYPE_SPRITE } from "@/lib/motion/vt-names";
import { ProgressBar } from "@/components/diagnosis/ProgressBar";
import { QuestionCard } from "@/components/diagnosis/QuestionCard";
import { SpriteScreen } from "@/components/diagnosis/SpriteScreen";
import { Button } from "@/components/ui/button";
import { NumUnit } from "@/components/ui/num-unit";
import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";

/** 押した答えを見せてから次へ進むまでの時間(押した手応え) */
const PICK_MS = 200;
/** 塗り替え(12 行 × 30ms)が終わったと知らせが来ないとき(タブが裏にある等)でも、ここまで待ったら結果へ進む */
const REVEAL_FALLBACK_MS = 500;
// 追補 6 章:問題の数は「12 問」として大きく出すので、ここには入れない
const FACTS = ["約 1 分半", "16 タイプのどれかが分かる", "向いているロール・相性のいい仲間も分かる"];

export function DiagnosisClient() {
  const [state, dispatch] = useReducer(diagnosisReducer, initialState);
  const [started, setStarted] = useState(false);
  const [picked, setPicked] = useState<AnswerValue | null>(null);
  // 追補 S2:最後の答えを押した時点で決まるタイプ(塗り替えに使う)と、塗り替えが終わったか
  const [reveal, setReveal] = useState<string | null>(null);
  const [painted, setPainted] = useState(false);
  const reduced = useReducedMotion();
  const pickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const sent = useRef(false);

  useEffect(() => {
    if (!state.done || sent.current) return;
    // 塗り替えが終わるまで待つ(動きを減らす設定では待たない)
    if (reveal && !reduced && !painted) return;
    sent.current = true;
    const axes = scoreAxes(state.answers);
    const { code, path } = resultPath(axes);
    void recordDiagnosis(code, axes);
    applyDiagnosisToLocal(browserStorage(), code, axes);
    try { sessionStorage.setItem("robilab:lastDiagnosis", JSON.stringify({ code, axes: JSON.stringify(axes) })); } catch {}
    router.push(path, { transitionTypes: [TYPE_REVEAL] });
  }, [state.done, state.answers, router, reveal, reduced, painted]);

  useEffect(() => () => {
    if (pickTimer.current) clearTimeout(pickTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);
  // 「はじめる」のボタンが消えるので、読み上げとキーボードの位置を最初の質問へ移す
  useEffect(() => { if (started) headingRef.current?.focus(); }, [started]);

  const answer = (value: AnswerValue) => {
    if (picked !== null || state.done) return;
    setPicked(value);
    if (state.index === QUESTIONS.length - 1) {
      // 最後の答え:タイプはここで決まる。すぐ塗り替えを始め、結果のページを先読みする
      const { code, path } = resultPath(scoreAxes({ ...state.answers, [QUESTIONS[state.index].id]: value }));
      setReveal(code);
      revealTimer.current = setTimeout(() => setPainted(true), REVEAL_FALLBACK_MS);
      if (shouldPrefetch(navigator as Navigator & { connection?: { saveData?: boolean } })) router.prefetch(path);
    }
    pickTimer.current = setTimeout(() => {
      pickTimer.current = null;
      setPicked(null);
      dispatch({ type: "answer", value });
    }, PICK_MS);
  };

  if (!started) {
    // 追補 6 章:左に「12 問」(display-1・Orbitron 800・マゼンタ)と事実、右に 12×12 の空のマス(160px)
    return (
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="grid gap-6">
          <NumUnit value={QUESTIONS.length} unit="問" className="text-rl-display-1" />
          <ul className="grid gap-3">
            {FACTS.map((f) => (
              <li key={f} className="flex items-start gap-3 text-base"><Check aria-hidden className="mt-1 size-5 shrink-0 text-rl-success" />{f}</li>
            ))}
          </ul>
          <Button type="button" variant="primary" size="lg" className="justify-self-start" onClick={() => setStarted(true)}>診断をはじめる</Button>
          <p className="text-sm text-rl-muted">{DIAGNOSIS_NOTE}</p>
        </div>
        <figure className="grid justify-items-center gap-2">
          <SpriteScreen size={160} />
          <figcaption className="text-sm text-rl-muted">この 12 行が、あなたのタイプの絵になります</figcaption>
        </figure>
      </div>
    );
  }

  const q = QUESTIONS[state.index];
  // 押した瞬間に、その問いの行が点く
  const lit = state.done ? QUESTIONS.length : state.index + (picked !== null ? 1 : 0);
  return (
    <div className="grid gap-6">
      {/* 追補 S2:スマホはマスの画面(64px)を進み具合の帯の上に、PC は右(96px) */}
      <div className="flex flex-col-reverse items-start gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="w-full min-w-0 md:flex-1"><ProgressBar current={state.index + 1} total={QUESTIONS.length} /></div>
        <ViewTransition name={VT_TYPE_SPRITE} share={MORPH_PIXEL} default="none">
          <SpriteScreen size={96} litRows={lit} revealCode={reveal} onRevealed={() => setPainted(true)} className="size-16 md:size-24" />
        </ViewTransition>
      </div>
      <QuestionCard question={q} selected={picked ?? state.answers[q.id]} onAnswer={answer} headingRef={headingRef} />
      <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => dispatch({ type: "back" })}
        disabled={state.index === 0 || state.done || picked !== null}>
        <ChevronLeft aria-hidden />ひとつ前へ
      </Button>
      {state.done && (
        <LoadingRegion label="結果を表示しています" className="grid gap-3">
          <p aria-hidden className="text-center text-base text-rl-muted">結果を表示しています…</p>
          <Skeleton className="h-40 w-full rounded-rl-md" />
        </LoadingRegion>
      )}
    </div>
  );
}

"use client";
import { useEffect, useReducer, useRef, useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { QUESTIONS, DIAGNOSIS_NOTE, type AnswerValue } from "@/data/questions";
import { diagnosisReducer, initialState } from "@/lib/diagnosis-state";
import { scoreAxes } from "@/lib/scoring";
import { recordDiagnosis } from "@/lib/analytics";
import { applyDiagnosisToLocal, browserStorage } from "@/lib/my-settings-store";
import { resultPath, shouldPrefetch } from "@/lib/diagnosis-result";
import { pickExample, spriteReading, type DiagnosisExample } from "@/lib/diagnosis-example";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { MORPH_PIXEL, TYPE_REVEAL, VT_TYPE_SPRITE } from "@/lib/motion/vt-names";
import { ProgressBar } from "@/components/diagnosis/ProgressBar";
import { QuestionCard } from "@/components/diagnosis/QuestionCard";
import { SpriteScreen } from "@/components/diagnosis/SpriteScreen";
import { Button } from "@/components/ui/button";
import { NumUnit } from "@/components/ui/num-unit";
import { SquareList } from "@/components/ui/square-list";
import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";

/** 押した答えを見せてから次へ進むまでの時間(押した手応え) */
const PICK_MS = 200;
/** 塗り替え(12 行 × 30ms)が終わったと知らせが来ないとき(タブが裏にある等)でも、ここまで待ったら結果へ進む */
const REVEAL_FALLBACK_MS = 500;
// 追補 6 章:問題の数は「12 問」として大きく出すので、ここには入れない
const FACTS = ["約 1 分半", "16 タイプのどれかが分かる", "向いているロール・相性のいい仲間も分かる"];

export function DiagnosisClient({ examples }: { examples: readonly DiagnosisExample[] }) {
  const [state, dispatch] = useReducer(diagnosisReducer, initialState);
  const [started, setStarted] = useState(false);
  const [picked, setPicked] = useState<AnswerValue | null>(null);
  // 始める画面の例の絵(何回目か・今見せているタイプ)
  const [turn, setTurn] = useState(0);
  const [example, setExample] = useState<DiagnosisExample | null>(null);
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

  // 採点 D-3:始める画面のマスに触れる(マウスを乗せる・押す・Enter)と、例のタイプの絵が上から塗り替わる。離すと消える
  const showExample = () => {
    setExample(pickExample(examples, turn));
    setTurn((t) => t + 1);
  };
  const hideExample = () => setExample(null);

  if (!started) {
    // 採点 D-1・D-2:広い幅の 12 列。左 5 列に「12 問」(display-2)・事実・注意・ボタン、右 7 列に 12×12 のマス(PC 288px・スマホ 160px)
    return (
      <div className="grid gap-8 md:grid-cols-12 md:items-center md:gap-6">
        <div className="grid gap-6 md:col-span-5">
          <NumUnit value={QUESTIONS.length} unit="問" className="text-rl-display-2" />
          <SquareList items={FACTS} className="gap-3" itemClassName="[word-break:auto-phrase] text-balance" />
          <p className="text-sm text-rl-muted [word-break:auto-phrase] text-balance">{DIAGNOSIS_NOTE}</p>
          <Button type="button" variant="primary" size="lg" className="justify-self-start" onClick={() => setStarted(true)}>診断をはじめる</Button>
        </div>
        <figure className="grid justify-items-center gap-2 md:col-span-7">
          <button type="button" aria-label="例のタイプの絵を見る(押すたびに次のタイプ)"
            className="rl-lock cursor-pointer rounded-rl-sm transition-transform duration-(--rl-dur-fast) ease-rl-out active:translate-y-px"
            onPointerEnter={(e) => { if (e.pointerType === "mouse") showExample(); }}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") hideExample(); }}
            onClick={showExample} onBlur={hideExample}>
            <SpriteScreen size={288} revealCode={example?.code ?? null} className="size-40 md:size-72" />
          </button>
          <figcaption className="grid max-w-[36em] justify-items-center gap-1 text-center text-sm text-rl-muted [word-break:auto-phrase] text-balance">
            <span>この 12 行が、あなたのタイプの絵になります</span>
            {/* 採点 D2-1:触れられることを言う。言い方は入力で変える(CSS で出し分けるので、ハイドレーションの前から正しい) */}
            {example ? (
              <span>押すたびに次のタイプ</span>
            ) : (
              <span><span className="hidden pointer-fine:inline">マスにマウスを乗せると</span><span className="pointer-fine:hidden">マスを押すと</span>、例の絵になります</span>
            )}
            {/* 採点 D2-2:例の絵の読み方。箱は 2 行ぶん最初から取っておく(出たり消えたりで下がずれない) */}
            <span aria-live="polite" className="min-h-[3.4em] text-rl-text">
              {example ? <>例:<span className="font-display">{example.code}</span> {example.name}({spriteReading(example.code)})</> : null}
            </span>
          </figcaption>
        </figure>
      </div>
    );
  }

  const q = QUESTIONS[state.index];
  // 押した瞬間に、その問いの行が点く
  const lit = state.done ? QUESTIONS.length : state.index + (picked !== null ? 1 : 0);
  return (
    // 採点(最終)の直し:PC は 12 列の 2 列。左 7 列に進み具合・問い・戻る、右 5 列に始める画面と同じ 288px のマスの画面
    // (答えるたびに行が点く S2 が、質問の間ずっと主役になる)。lg より狭い幅は 640px までで、
    // マスの画面(96px)と何問目を横に並べる(375×812 で 4 つ目の答えがタブバーの下に隠れないように。最終 2 回目の直し)
    <div className="grid max-w-[640px] grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-6 lg:max-w-none lg:grid-cols-12 lg:items-start lg:gap-6">
      {/* 追補 S2:スマホはマスの画面(96px)を何問目の左に。PC は右の列で 3 行ぶんの高さ */}
      <div className="col-start-1 row-start-1 justify-self-start lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1 lg:justify-self-center">
        <ViewTransition name={VT_TYPE_SPRITE} share={MORPH_PIXEL} default="none">
          <SpriteScreen size={288} litRows={lit} revealCode={reveal} onRevealed={() => setPainted(true)} className="size-24 lg:size-72" />
        </ViewTransition>
      </div>
      <div className="col-start-2 row-start-1 min-w-0 self-end lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:self-auto"><ProgressBar current={state.index + 1} total={QUESTIONS.length} /></div>
      <div className="col-span-2 min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-2">
        <QuestionCard question={q} selected={picked ?? state.answers[q.id]} onAnswer={answer} headingRef={headingRef} />
      </div>
      <Button type="button" variant="ghost" size="sm" className="col-span-2 justify-self-start lg:col-span-7 lg:col-start-1 lg:row-start-3" onClick={() => dispatch({ type: "back" })}
        disabled={state.index === 0 || state.done || picked !== null}>
        <ChevronLeft aria-hidden />ひとつ前へ
      </Button>
      {state.done && (
        <LoadingRegion label="結果を表示しています" className="col-span-2 grid gap-4 lg:col-span-7 lg:col-start-1 lg:row-start-4">
          <p aria-hidden className="text-center text-base text-rl-muted">結果を表示しています…</p>
          <Skeleton className="h-40 w-full rounded-rl-md" />
        </LoadingRegion>
      )}
    </div>
  );
}

"use client";
import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { AXES } from "@/data/axes";
import { matchesAxisFilter } from "@/lib/type-axes";

type Picked = [string | null, string | null, string | null, string | null];

/**
 * チップの見た目(src/components/ui/chip.tsx の chipClassName と同じ)。chip.tsx は base-ui の Toggle を読むので、
 * この画面では import せずクラスだけ写す(/types が base-ui のチャンクを読まないように)。
 */
const chipClass =
  "group/chip relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-rl-sm border-2 border-rl-line-strong bg-rl-surface-2 px-4 text-sm font-bold text-rl-text transition-[background-color,border-color,transform] duration-(--rl-dur-fast) ease-rl-out hover:border-rl-text/60 active:translate-y-px aria-pressed:border-rl-selected aria-pressed:bg-rl-selected-bg";

/**
 * /types の凡例(4 軸の読み方)を、押せる 2 択にする。選んだ文字を持たないタイプは名簿の中で薄くなる(opacity 0.35。CSS)。
 * 軸ごとに 1 つ選べ、重ねると絞り込まれる(4 つ選ぶと 1 体)。選んだものをもう一度押すと外れる。
 * ふつうの <button aria-pressed>(Tab で移る)。JS は選んだ状態だけ。名簿(children)はサーバーで作った TypeRoster をそのまま受け取る。
 */
export function TypeAxisFilter({ codes, rules, children }: { codes: readonly string[]; rules: readonly string[]; children: ReactNode }) {
  const [picked, setPicked] = useState<Picked>([null, null, null, null]);
  const any = picked.some((p) => p !== null);
  const count = codes.filter((c) => matchesAxisFilter(c, picked)).length;
  const toggle = (i: number, letter: string) => setPicked((prev) => prev.map((p, j) => (j === i ? (p === letter ? null : letter) : p)) as Picked);
  return (
    <div className="grid gap-6">
      {/* 追補 5-3:箱にせず、上下の線だけ */}
      <section aria-label="4 つの軸の読み方(押すと名簿を絞れる)" className="grid gap-4 border-y border-rl-line py-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {AXES.map((a, i) => (
            <li key={a.id} className="grid gap-2">
              <div role="group" aria-label={`${a.left}か${a.right}で絞る`} className="flex flex-wrap gap-2">
                {[[a.leftLetter, a.left], [a.rightLetter, a.right]].map(([letter, word]) => (
                  <button key={letter} type="button" aria-pressed={picked[i] === letter} onClick={() => toggle(i, letter)} className={chipClass}>
                    {/* (追補 S4)選んだときにチェックが線で引かれる(rl-draw-check は globals.css) */}
                    <Check aria-hidden className="rl-draw-check hidden size-4 shrink-0 group-aria-pressed/chip:block" />
                    <span className="font-display">{letter}</span>{word}
                  </button>
                ))}
              </div>
              <p className="text-sm text-rl-muted">{rules[i]}</p>
            </li>
          ))}
        </ul>
        <p role="status" className="text-sm text-rl-muted">
          {any ? <><span className="font-display tabular-nums text-rl-highlight">{count}</span> タイプが残っています(もう一度押すと外れます)</> : "文字を押すと、その文字を持つタイプだけが名簿に残ります"}
        </p>
      </section>
      <div className="rl-roster-filter" data-f0={picked[0] ?? undefined} data-f1={picked[1] ?? undefined} data-f2={picked[2] ?? undefined} data-f3={picked[3] ?? undefined}>
        {children}
      </div>
    </div>
  );
}

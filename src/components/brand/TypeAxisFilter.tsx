"use client";
import { useState, type ReactNode } from "react";
import { AXES } from "@/data/axes";
import { matchesAxisFilter } from "@/lib/type-axes";
import { Chip } from "@/components/ui/chip";
import { ChipGroup } from "@/components/ui/chip-group";

type Picked = [string | null, string | null, string | null, string | null];

/**
 * /types の凡例(4 軸の読み方)を、押せる 2 択にする。選んだ文字を持たないタイプは名簿の中で薄くなる(opacity 0.35。CSS)。
 * 軸ごとに 1 つ選べ、重ねると絞り込まれる(4 つ選ぶと 1 体)。選んだものをもう一度押すと外れる。
 * JS は選んだ状態だけ。名簿(children)はサーバーで作った TypeRoster をそのまま受け取る。
 */
export function TypeAxisFilter({ codes, rules, children }: { codes: readonly string[]; rules: readonly string[]; children: ReactNode }) {
  const [picked, setPicked] = useState<Picked>([null, null, null, null]);
  const any = picked.some((p) => p !== null);
  const count = codes.filter((c) => matchesAxisFilter(c, picked)).length;
  const pick = (i: number, letter: string | null) => setPicked((prev) => prev.map((p, j) => (j === i ? letter : p)) as Picked);
  return (
    <div className="grid gap-6">
      {/* 追補 5-3:箱にせず、上下の線だけ */}
      <section aria-label="4 つの軸の読み方(押すと名簿を絞れる)" className="grid gap-4 border-y border-rl-line py-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {AXES.map((a, i) => (
            <li key={a.id} className="grid gap-2">
              <ChipGroup label={`${a.left}か${a.right}で絞る`} allowEmpty value={picked[i] ? [picked[i]] : []} onValueChange={(v) => pick(i, v[0] ?? null)}>
                <Chip value={a.leftLetter}><span className="font-display">{a.leftLetter}</span>{a.left}</Chip>
                <Chip value={a.rightLetter}><span className="font-display">{a.rightLetter}</span>{a.right}</Chip>
              </ChipGroup>
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

import { bestDay, lastNDays, streakDays, type AimDays } from "@/lib/aim/history";
import { buildChart, CHART_H, CHART_PAD, CHART_W } from "@/lib/aim/history-chart";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const DAYS = 30;
const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const jpDate = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
const fmt = (n: number) => n.toLocaleString("ja-JP");

/** 点数は「7,600 点」、正確さは「92%」(数字と単位を分けて返す) */
const valueParts = (n: number, unit: "点" | "%") => (unit === "点" ? { num: fmt(n), unit: " 点" } : { num: String(n), unit: "%" });

function Chart({ title, label, values, max, unit, from, to }: {
  title: string; label: string; values: (number | null)[]; max: number; unit: "点" | "%"; from: string; to: string;
}) {
  // 採点(最終)の直し:遊ばなかった日で線を切らず、遊んだ日を 1 本でつなぐ(またぐ所だけ破線)
  const g = buildChart(values, max, { bridge: true });
  const todayValue = values[values.length - 1];
  const top = valueParts(max, unit);
  const now = todayValue != null ? valueParts(todayValue, unit) : null;
  return (
    <figure className="grid gap-1">
      {/* 縦の目盛りの代わりに、上の端が何点・何 % かと、今日の値(マゼンタの丸と同じ色)を文字で出す */}
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-rl-muted">
        <span>{title}</span>
        <span className="flex flex-wrap items-baseline gap-x-4">
          {now && <span>今日 <span className="font-bold tabular-nums text-rl-highlight">{now.num}</span>{now.unit}</span>}
          <span className="text-xs">上の端 <span className="font-bold tabular-nums text-rl-text">{top.num}</span>{top.unit}</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-auto w-full rounded-lg bg-rl-surface" role="img" aria-label={label}>
        {/* 上の端(max)の線 */}
        <line x1={0} x2={CHART_W} y1={CHART_PAD} y2={CHART_PAD} stroke="var(--rl-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {g.gaps.map((pts) => (
          <polyline key={pts} points={pts} fill="none" stroke="var(--rl-line-strong)" strokeWidth={1.5} strokeDasharray="2 3" strokeLinecap="round" />
        ))}
        {g.lines.map((pts) => (
          <polyline key={pts} points={pts} fill="none" stroke="var(--rl-secondary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {g.dots.map((p) => <circle key={p.index} cx={p.x} cy={p.y} r={2.5} fill="var(--rl-secondary)" />)}
        {g.today && <circle cx={g.today.x} cy={g.today.y} r={4.5} fill="var(--rl-highlight)" />}
      </svg>
      <div className="flex justify-between text-xs text-rl-muted"><span>{md(from)}</span><span>{md(to)}</span></div>
    </figure>
  );
}

export function AimHistory({ days, today, loggedIn, serverError, canClear, onClear, streakIcon, className }: {
  days: AimDays; today: string; loggedIn: boolean; serverError: boolean; canClear: boolean; onClear: () => void;
  /** 追補 6 章:連続日数の 8×8 の炎のドット(サーバーで描いて渡す。ドット絵のデータをブラウザの JS に入れないため) */
  streakIcon?: ReactNode;
  className?: string;
}) {
  const slots = lastNDays(days, today, DAYS);
  const played = slots.filter((s) => s.day);
  const streak = streakDays(days, today);
  const best = bestDay(days, today);
  const clear = () => {
    if (window.confirm("この端末のエイムの記録を消しますか?")) onClear();
  };

  return (
    <section aria-labelledby="history-heading" className={cn("grid gap-4", className)}>
      <SectionHeading id="history-heading" title="あなたの記録" />
      {serverError && <p className="text-sm text-rl-warning">サーバーの記録を読めませんでした(この端末の記録だけを出しています)</p>}
      {!best ? (
        <p className="text-sm text-rl-muted">遊ぶと、ここに毎日の記録が残ります</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-base">
            {streak > 0 && <span className="inline-flex items-center gap-2 font-bold text-rl-highlight">{streakIcon}<span className="tabular-nums">{streak}</span>日連続</span>}
            <span>最高 <b className="tabular-nums">{fmt(best.day.score)}</b> 点({jpDate(best.date)})</span>
          </div>
          {/* 採点(最終)の直し:PC は 2 つを横に並べる(1 つ 約 550×185px。幅いっぱいの 370px の高さの箱にしない) */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Chart title="自己ベストの点数(直近30日)" label={`直近30日の自己ベストの点数。遊んだ日 ${played.length} 日、最高 ${fmt(Math.max(0, ...played.map((s) => s.day!.score)))} 点`}
              values={slots.map((s) => s.day?.score ?? null)} max={10000} unit="点" from={slots[0].date} to={today} />
            <Chart title="正確さ(直近30日)" label={`直近30日の正確さ。遊んだ日 ${played.length} 日、最高 ${Math.max(0, ...played.map((s) => s.day!.accuracy))}%`}
              values={slots.map((s) => s.day?.accuracy ?? null)} max={100} unit="%" from={slots[0].date} to={today} />
          </div>
        </>
      )}
      {canClear && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>この端末の記録を消す</Button>
          {loggedIn && <span className="text-sm text-rl-muted">サーバーの記録は残ります(退会すると消えます)</span>}
        </div>
      )}
    </section>
  );
}

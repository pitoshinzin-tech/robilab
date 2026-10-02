"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/aim/ranking";
import { flapRanks } from "@/lib/motion/flap";
import { RankBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
export type { RankingRow } from "@/lib/aim/ranking";

/** 一度にめくる行の時間差の上限(10 行目より下は同時にめくる) */
const FLAP_STAGGER_MAX = 9;

export function Ranking({ rows, mine, loggedIn = false }: { rows: RankingRow[]; mine: { rank: number; score: number } | null; loggedIn?: boolean }) {
  // 動きの参考 086(パタパタの表示板):送信のあとの読み込み直しで、中身が入れ替わった順位の行だけをめくる。
  // 最初に出したとき・同じ中身のときは動かさない。前の rows は state に持ち、変わった描画の中で比べる(effect で setState しない)
  const [prev, setPrev] = useState<{ rows: RankingRow[]; flips: number[] }>({ rows, flips: [] });
  let flips = prev.flips;
  if (prev.rows !== rows) {
    flips = flapRanks(prev.rows, rows);
    setPrev({ rows, flips });
  }
  return (
    <section aria-labelledby="ranking" className="grid gap-4">
      <SectionHeading id="ranking" title="今日のランキング" />
      {rows.length === 0 ? (
        <EmptyState icon={Trophy} title="今日はまだだれも載っていません" description="1 番乗りしよう。" />
      ) : (
        <ol className="grid gap-2">
          {rows.map((r) => {
            const podium = r.rank <= 3;
            const flip = flips.indexOf(r.rank);
            const flap = flip >= 0 ? "rl-flap" : undefined;
            const style = flip >= 0 ? ({ "--i": Math.min(flip, FLAP_STAGGER_MAX) } as CSSProperties) : undefined;
            return (
              // 中身が変わった行は key が変わって描き直される(めくる動きが 1 回だけ出る)
              <li key={`${r.rank}:${r.name}:${r.score}`} className={cn("flex min-w-0 items-center gap-3 rounded-rl-sm bg-rl-surface px-3", podium ? "h-16" : "h-12", mine?.rank === r.rank && "border-2 border-rl-selected bg-rl-selected-bg")}>
                <RankBadge rank={r.rank} />
                <span data-long-name title={r.name} className={cn("min-w-0 flex-1 truncate text-base", flap)} style={style}>{r.name}</span>
                <span className={cn("font-display tabular-nums text-rl-highlight", podium ? "text-[32px] font-extrabold" : "text-xl", flap)} style={style}>{r.score.toLocaleString("ja-JP")}</span>
              </li>
            );
          })}
        </ol>
      )}
      {mine && <p className="text-base">今日のあなたの順位:<b className="font-display tabular-nums text-rl-highlight">{mine.rank}</b> 位({mine.score.toLocaleString("ja-JP")} 点)</p>}
      {loggedIn && (
        <p className="text-sm text-rl-muted">
          ランキングの名前は、<Link href="/my" className="text-rl-accent underline">マイ設定</Link>で名刺を公開すると表示されます
        </p>
      )}
    </section>
  );
}

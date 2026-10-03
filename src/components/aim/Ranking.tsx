"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/aim/ranking";
import { flapRanks } from "@/lib/motion/flap";
import { ArrowUp } from "lucide-react";
import { RankBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DecodeNumber } from "@/components/aim/DecodeNumber";
import { SectionHeading } from "@/components/ui/section-heading";
export type { RankingRow } from "@/lib/aim/ranking";

/** 一度にめくる行の時間差の上限(10 行目より下は同時にめくる) */
const FLAP_STAGGER_MAX = 9;

/** 空のときに出す「空いている席」(1〜3 位の行の形) */
const EMPTY_SEATS = [1, 2, 3] as const;

export function Ranking({ rows, mine, loggedIn = false, canPlay = false, decodeKey = 0, className }: {
  rows: RankingRow[]; mine: { rank: number; score: number } | null; loggedIn?: boolean;
  /** PC で遊べるとき true(空のときに「上の面で書く」を出す) */
  canPlay?: boolean;
  /** 送信が済んだ回数。1 以上なら、自分の順位の数字が 2 段だけ乱れてから決まる(動きの参考 064) */
  decodeKey?: number;
  className?: string;
}) {
  // 動きの参考 086(パタパタの表示板):送信のあとの読み込み直しで、中身が入れ替わった順位の行だけをめくる。
  // 最初に出したとき・同じ中身のときは動かさない。前の rows は state に持ち、変わった描画の中で比べる(effect で setState しない)
  const [prev, setPrev] = useState<{ rows: RankingRow[]; flips: number[] }>({ rows, flips: [] });
  let flips = prev.flips;
  if (prev.rows !== rows) {
    flips = flapRanks(prev.rows, rows);
    setPrev({ rows, flips });
  }
  return (
    <section aria-labelledby="ranking" className={cn("grid gap-4", className)}>
      <SectionHeading id="ranking" title="今日のランキング" />
      {rows.length === 0 ? (
        // 空のときも 1〜3 位の行の形を出し、点線の枠で「空いている席」に見せる(ロビー = 待合室の言葉)
        <div className="grid gap-4">
          <ol aria-label="今日はまだだれも載っていません" className="grid gap-2">
            {EMPTY_SEATS.map((rank) => (
              <li key={rank} className="flex h-16 min-w-0 items-center gap-3 rounded-rl-sm border border-dashed border-rl-line-strong px-3">
                <RankBadge rank={rank} />
                <span aria-hidden className="flex-1 text-base text-rl-muted">—</span>
                <span className="sr-only">空いています</span>
              </li>
            ))}
          </ol>
          <p className="text-sm">最初の記録が 1 位になります</p>
          {/* スマホは上の札に「PC で開くリンクをコピー」があるので、ここには出さない(同じ行き先のボタンを 1 画面に 2 つ置かない) */}
          {canPlay && <div><ButtonLink href="#play" variant="ghost" size="sm" className="px-0">上の面で書く<ArrowUp aria-hidden /></ButtonLink></div>}
        </div>
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
                <span className={cn("font-display tabular-nums text-rl-highlight", podium ? "text-rl-title font-extrabold" : "text-xl", flap)} style={style}>{r.score.toLocaleString("ja-JP")}</span>
              </li>
            );
          })}
        </ol>
      )}
      {mine && <p className="text-base">今日のあなたの順位:<b className="tabular-nums text-rl-highlight">{decodeKey > 0 ? <DecodeNumber key={`${decodeKey}:${mine.rank}:${mine.score}`} value={String(mine.rank)} /> : mine.rank}</b> 位({mine.score.toLocaleString("ja-JP")} 点)</p>}
      {loggedIn && (
        <p className="text-sm text-rl-muted">
          ランキングの名前は、<Link href="/my" className="text-rl-accent underline">マイ設定</Link>で名刺を公開すると表示されます
        </p>
      )}
    </section>
  );
}

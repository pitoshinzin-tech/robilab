import type { RankingRow } from "@/lib/aim/ranking";
export type { RankingRow } from "@/lib/aim/ranking";
import Link from "next/link";

export function Ranking({ rows, mine, loggedIn = false }: { rows: RankingRow[]; mine: { rank: number; score: number } | null; loggedIn?: boolean }) {
  return (
    <section className="grid gap-2">
      <h2 className="font-bold">今日のランキング</h2>
      {rows.length === 0 ? <p className="text-sm text-[var(--rl-muted)]">まだ記録がありません。一番乗りしよう。</p> : (
        <ol className="grid gap-1 text-sm">
          {rows.map((r) => (
            <li key={r.rank} className="flex justify-between rounded-lg bg-[var(--rl-card)] px-3 py-2">
              <span><b className="mr-2 text-[var(--rl-highlight)]">{r.rank}</b>{r.name}</span>
              <span className="font-display">{r.score.toLocaleString("ja-JP")}</span>
            </li>
          ))}
        </ol>
      )}
      {mine && <p className="text-sm">今日のあなたの順位:<b className="text-[var(--rl-highlight)]">{mine.rank} 位</b>({mine.score.toLocaleString("ja-JP")} 点)</p>}
      {loggedIn && (
        <p className="text-xs text-[var(--rl-muted)]">
          ランキングの名前は、<Link href="/my" className="underline">マイ設定</Link>で名刺を公開すると表示されます
        </p>
      )}
    </section>
  );
}

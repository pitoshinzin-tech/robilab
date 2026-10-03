import type { GameRank } from "@/lib/role-match";
import { Card } from "@/components/ui/card";

/**
 * おすすめゲームと合うロール。showScore={false}(直接開いた結果):% はタイプのコードからの既定の軸で計算した数で
 * 本人の数ではないので出さない。順位・ロール・理由はタイプの 4 文字で決まるので、そのまま出す。
 */
export function GameRanking({ ranks, showScore = true }: { ranks: GameRank[]; showScore?: boolean }) {
  return (
    <ol className="grid gap-4">
      {ranks.map((r, i) => (
        <Card as="li" key={r.game.id} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-base font-bold">{i + 1}. {r.game.name}</span>
            {showScore && <span className="text-xl font-bold tabular-nums text-rl-highlight">{r.best.score}%</span>}
          </div>
          <p className="text-base">合うロール:<b>{r.best.role.name}</b> — {r.best.role.reason}</p>
          <p className="text-sm text-rl-muted">{r.roles.slice(1).map((x) => (showScore ? `${x.role.name} ${x.score}%` : x.role.name)).join(" / ")}</p>
        </Card>
      ))}
    </ol>
  );
}

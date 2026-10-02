import type { GameRank } from "@/lib/role-match";
import { Card } from "@/components/ui/card";

export function GameRanking({ ranks }: { ranks: GameRank[] }) {
  return (
    <ol className="grid gap-3">
      {ranks.map((r, i) => (
        <Card as="li" key={r.game.id} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-base font-bold">{i + 1}. {r.game.name}</span>
            <span className="font-display text-xl tabular-nums text-rl-highlight">{r.best.score}%</span>
          </div>
          <p className="text-base">合うロール:<b>{r.best.role.name}</b> — {r.best.role.reason}</p>
          <p className="text-sm text-rl-muted">{r.roles.slice(1).map((x) => `${x.role.name} ${x.score}%`).join(" / ")}</p>
        </Card>
      ))}
    </ol>
  );
}

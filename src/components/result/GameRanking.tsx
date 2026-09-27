import type { GameRank } from "@/lib/role-match";

export function GameRanking({ ranks }: { ranks: GameRank[] }) {
  return (
    <ol className="grid gap-3">
      {ranks.map((r, i) => (
        <li key={r.game.id} className="rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-bold">{i + 1}. {r.game.name}</span>
            <span className="font-[family-name:var(--font-display)] text-[var(--rl-cyan)]">{r.best.score}%</span>
          </div>
          <p className="mt-1 text-sm">合うロール:<b>{r.best.role.name}</b> — {r.best.role.reason}</p>
          <p className="mt-1 text-xs text-[var(--rl-muted)]">
            {r.roles.slice(1).map((x) => `${x.role.name} ${x.score}%`).join(" / ")}
          </p>
        </li>
      ))}
    </ol>
  );
}

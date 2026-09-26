export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div aria-label={`${current} / ${total} 問`} className="w-full">
      <div className="mb-1 flex justify-between text-xs text-[var(--rl-muted)]">
        <span className="font-[family-name:var(--font-display)]">Q{current}</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--rl-cyan)] to-[var(--rl-purple)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

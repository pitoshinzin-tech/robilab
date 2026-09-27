import { AXES, type Axes } from "@/data/axes";

export function AxisBars({ axes }: { axes: Axes }) {
  return (
    <div className="grid gap-3">
      {AXES.map((a) => {
        const v = axes[a.id];
        const leftPct = Math.round(((v + 1) / 2) * 100);
        return (
          <div key={a.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span className={v > 0 ? "font-bold text-[var(--rl-cyan)]" : "text-[var(--rl-muted)]"}>{a.left} {a.leftLetter}</span>
              <span className={v < 0 ? "font-bold text-[var(--rl-magenta)]" : "text-[var(--rl-muted)]"}>{a.rightLetter} {a.right}</span>
            </div>
            <div className="relative h-2 rounded-full bg-white/10">
              <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--rl-purple)]" style={{ left: `${100 - leftPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

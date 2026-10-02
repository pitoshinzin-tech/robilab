import { AXES, type Axes } from "@/data/axes";
import { pixelBarFill } from "@/lib/pixel-art";
import { PixelMeter } from "@/components/ui/pixel-meter";
import { Odometer } from "@/components/ui/odometer";

/** マスが埋まる時間(10 マス × 40ms。globals.css の .rl-meter-fill と同じ)に、% の数え上げの長さをそろえる */
const FILL_MS = 400;

/**
 * 4 つの軸。左の % の分だけ 10 マスを左から塗る(S2 の続きの動きとして、表示時に 1 回だけ埋まる)。
 * % は動きの参考 070(回転式カウンター)で、マスが埋まるのと同じ長さで 0 から回って止まる(動きを減らす設定では最初から最後の数)。
 */
export function AxisBars({ axes }: { axes: Axes }) {
  return (
    <div className="grid gap-4">
      {AXES.map((a) => {
        const v = axes[a.id];
        const leftPct = Math.round(((v + 1) / 2) * 100);
        const leftWins = v > 0;
        const rightWins = v < 0;
        const pct = (wins: boolean) => (wins ? "font-display tabular-nums text-rl-highlight" : "font-display tabular-nums");
        return (
          <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
            <span className={leftWins ? "font-bold text-rl-text" : "text-rl-muted"}>{a.left} {a.leftLetter} <span className={pct(leftWins)}><Odometer value={leftPct} durationMs={FILL_MS} />%</span></span>
            <PixelMeter cells={10} filled={pixelBarFill(leftPct)} />
            <span className={rightWins ? "text-right font-bold text-rl-text" : "text-right text-rl-muted"}><span className={pct(rightWins)}><Odometer value={100 - leftPct} durationMs={FILL_MS} />%</span> {a.rightLetter} {a.right}</span>
          </div>
        );
      })}
    </div>
  );
}

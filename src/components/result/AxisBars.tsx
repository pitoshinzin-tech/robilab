import { AXES, type Axes } from "@/data/axes";
import { pixelBarFill } from "@/lib/pixel-art";
import { PixelMeter } from "@/components/ui/pixel-meter";

/**
 * 4 つの軸。左の % の分だけ 10 マスを左から塗る。
 * fromDiagnosis:診断から来た結果。% を出し、マスは S2 の続きの動きとして表示時に 1 回だけ埋まる。
 * そうでないとき(直接開いた・一覧や相性の行から来た):% はタイプのコードからの既定値で本人の数ではないので出さず、
 * マスは止まった形で勝っている側だけを見せ、「診断すると、あなたの割合が出ます」を 1 行添える。
 */
export function AxisBars({ axes, fromDiagnosis }: { axes: Axes; fromDiagnosis: boolean }) {
  return (
    <div className="grid gap-4">
      {AXES.map((a) => {
        const v = axes[a.id];
        const leftPct = Math.round(((v + 1) / 2) * 100);
        const leftWins = v > 0;
        const rightWins = v < 0;
        const pct = (wins: boolean) => (wins ? "font-bold tabular-nums text-rl-highlight" : "font-bold tabular-nums");
        return (
          <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
            <span className={leftWins ? "font-bold text-rl-text" : "text-rl-muted"}>
              {a.left} {a.leftLetter}{fromDiagnosis && <> <span className={pct(leftWins)}>{leftPct}%</span></>}
            </span>
            <PixelMeter cells={10} filled={pixelBarFill(leftPct)} animate={fromDiagnosis} />
            <span className={rightWins ? "text-right font-bold text-rl-text" : "text-right text-rl-muted"}>
              {fromDiagnosis && <><span className={pct(rightWins)}>{100 - leftPct}%</span> </>}{a.rightLetter} {a.right}
            </span>
          </div>
        );
      })}
      {!fromDiagnosis && <p className="text-sm text-rl-muted">診断すると、あなたの割合が出ます</p>}
    </div>
  );
}

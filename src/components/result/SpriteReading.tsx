import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { axisWords } from "@/lib/type-axes";

/** 絵のどこがどの軸か(src/lib/type-sprite.ts の形の決まりと同じ)。y は絵のマスの行(viewBox -1 -1 14 14 の中) */
const PARTS = [
  { part: "色", axis: 3, y: 0.5 },
  { part: "頭", axis: 0, y: 3 },
  { part: "目", axis: 1, y: 6.5 },
  { part: "体の横", axis: 2, y: 9.5 },
] as const;

/**
 * 追補 6 章:結果の大きな絵に「この絵の読み方」を添える。PC は絵の部分から右へ細い引き出し線(線の言葉)と言葉、スマホは文だけ。
 * 絵(TypeIcon)はサーバーで作って icon で受け取る。PC は引き出し線が同じことを示すので、文は読み上げだけに残す(lg:sr-only)。
 * 線の終わり(x 14.5)は絵の右端から約 26px(240px のとき)。言葉は 32px の所から置き、線と重ねない。
 */
export function SpriteReading({ code, icon, className }: { code: string; icon: ReactNode; className?: string }) {
  const words = axisWords(code);
  return (
    <figure className={cn("grid justify-items-center gap-3 lg:justify-items-start", className)}>
      <div className="relative w-fit">
        {icon}
        <svg viewBox="-1 -1 14 14" aria-hidden className="pointer-events-none absolute inset-0 hidden size-full overflow-visible lg:block">
          {PARTS.map((p) => <line key={p.part} x1={10.5} y1={p.y} x2={14.5} y2={p.y} stroke="var(--rl-line-strong)" strokeWidth={0.08} />)}
        </svg>
        <ul aria-hidden className="absolute inset-y-0 left-full hidden w-40 lg:block">
          {PARTS.map((p) => (
            <li key={p.part} className="absolute left-8 -translate-y-1/2 whitespace-nowrap text-sm" style={{ top: `${((p.y + 1) / 14) * 100}%` }}>
              <span className="text-rl-muted">{p.part}</span> {words[p.axis] ?? ""}
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="max-w-[30em] text-center text-sm text-balance text-rl-muted [word-break:auto-phrase] lg:sr-only">この絵の読み方:頭 = 攻め/守り、目 = 直感/戦略、体の横 = チーム/ソロ、色 = 熱血/冷静</figcaption>
    </figure>
  );
}

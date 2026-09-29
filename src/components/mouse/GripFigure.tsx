import type { Grip } from "@/lib/my-settings";

// 手の線(横から見た形)。左が手首側、右がマウスの先。
const HAND: Record<Grip, string> = {
  palm: "M2 32 Q8 16 30 14 Q50 13 60 36", // 手のひら全体がマウスに沿う
  claw: "M2 30 Q8 20 20 20 Q28 6 40 10 L54 38", // 付け根だけ乗せ、指を立てる
  fingertip: "M4 10 Q20 2 36 8 L52 38", // 手のひらは浮かせ、指先だけ触れる
};

/** 持ち方の図(横から見たマウスと手)。説明は横の文字にあるので、読み上げでは飛ばす。 */
export function GripFigure({ grip }: { grip: Grip }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true" className="h-12 w-16 shrink-0">
      {/* マウス */}
      <path d="M6 42 Q8 26 30 22 Q52 20 58 42 Z" fill="var(--rl-card)" stroke="var(--rl-muted)" strokeWidth="2" strokeLinejoin="round" />
      {/* 手 */}
      <path d={HAND[grip]} fill="none" stroke="var(--rl-secondary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

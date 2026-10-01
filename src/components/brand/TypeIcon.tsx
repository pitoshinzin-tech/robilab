import Image from "next/image";
import { cn } from "cn";
import { getType } from "@/data/types";
import { CUSTOM_TYPE_ICONS } from "@/data/type-icons";
import { SPRITE_ROLES, buildTypeSprite, heatOf, spriteFill } from "@/lib/type-sprite";

export type TypeIconSize = 32 | 48 | 64 | 160;

/**
 * 16 タイプのアイコン。本人のドット絵(public/types/CODE.png)があればそれを、なければ 4 軸から組み立てた仮の絵を出す。
 * labelled:1 つだけで出すとき true(読み上げに名前を出す)。名前の横に出すときは false(飾り)。
 * animate:診断から来たときだけ、ドットから組み上がる見せ場の動き。glow:結果の大きな絵だけ。
 */
export function TypeIcon({ code, size = 48, labelled = false, animate = false, glow = false, className }: {
  code: string; size?: TypeIconSize; labelled?: boolean; animate?: boolean; glow?: boolean; className?: string;
}) {
  const type = getType(code);
  const name = type ? `${type.code} ${type.name}のアイコン` : "";
  const box = cn("shrink-0 rounded-rl-sm bg-rl-surface", glow && "shadow-rl-glow-2", animate && "rl-assemble", className);
  if (CUSTOM_TYPE_ICONS.includes(code)) {
    return <Image src={`/types/${code}.png`} alt={labelled ? name : ""} width={size} height={size} unoptimized className={cn("rl-pixel", box)} />;
  }
  const sprite = buildTypeSprite(code);
  const heat = heatOf(code);
  const a11y = labelled && type ? { role: "img" as const, "aria-label": name } : { "aria-hidden": true as const };
  return (
    <svg viewBox="-1 -1 14 14" width={size} height={size} shapeRendering="crispEdges" className={box} {...a11y}>
      {sprite &&
        SPRITE_ROLES.map((role) => (
          <g key={role} fill={spriteFill(role, heat)}>
            {sprite.filter((c) => c.role === role).map((c) => (
              <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={c.w} height={c.h} />
            ))}
          </g>
        ))}
    </svg>
  );
}

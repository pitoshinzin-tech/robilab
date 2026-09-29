import Image from "next/image";
import { getType } from "@/data/types";
import { CUSTOM_TYPE_ICONS } from "@/data/type-icons";

const ACCENT = { cyan: "#39F3FF", magenta: "#FF4FD8", purple: "#7B61FF", lime: "#B6FF3B" } as const;

/** 本人のドット絵(public/types/CODE.png)があればそれを、なければ仮のスプライトを表示する。 */
export function PixelIcon({ code, size = 56 }: { code: string; size?: number }) {
  if (CUSTOM_TYPE_ICONS.includes(code)) {
    return (
      <Image
        src={`/types/${code}.png`}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="rl-pixel rounded-xl"
      />
    );
  }
  const color = ACCENT[getType(code)?.accent ?? "cyan"];
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} className="rl-pixel rounded-xl bg-[var(--rl-card)] p-1" aria-hidden>
      <g fill={color}>
        <rect x="2" y="0" width="4" height="1" /><rect x="1" y="1" width="6" height="1" />
        <rect x="1" y="2" width="1" height="2" /><rect x="6" y="2" width="1" height="2" />
        <rect x="2" y="4" width="4" height="1" /><rect x="0" y="5" width="8" height="1" />
        <rect x="2" y="6" width="1" height="2" /><rect x="5" y="6" width="1" height="2" />
      </g>
      <g fill="#FF4FD8"><rect x="2" y="2" width="1" height="1" /><rect x="5" y="2" width="1" height="1" /></g>
    </svg>
  );
}

import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { getType } from "@/data/types";

const ACCENT = { cyan: "#39F3FF", magenta: "#FF4FD8", purple: "#7B61FF", lime: "#B6FF3B" } as const;

/** 本人のドット絵(public/types/CODE.png)があればそれを、なければ仮のスプライトを表示する。サーバーコンポーネント専用。 */
export function PixelIcon({ code, size = 56 }: { code: string; size?: number }) {
  const file = path.join(process.cwd(), "public", "types", `${code}.png`);
  if (fs.existsSync(file)) {
    return <Image src={`/types/${code}.png`} alt="" width={size} height={size} className="rl-pixel rounded-xl" />;
  }
  const color = ACCENT[getType(code)?.accent ?? "cyan"];
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} className="rl-pixel rounded-xl bg-[#151a33] p-1" aria-hidden>
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

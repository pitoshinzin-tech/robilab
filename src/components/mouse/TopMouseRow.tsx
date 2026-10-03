import { ChevronRight } from "lucide-react";
import type { Ranked } from "@/lib/mouse-fit";
import type { ShopLinks } from "@/lib/shop-links";
import { ButtonLink } from "@/components/ui/button-link";
import { ShopButtons } from "@/components/gear/ShopButtons";
import { ChipButton } from "@/components/ui/chip-button";
import { NumUnit } from "@/components/ui/num-unit";
import { NO_DATA } from "@/lib/gear-labels";

/**
 * 追補 6 章:先頭は箱ではなく大きな行。左に順位(display-2・Orbitron・マゼンタ。ふだんは「1」、絞り込みで 1 位が外れたときは残った先頭の本当の順位)、真ん中に名前と理由、右に店のボタン(主ボタンはここだけ)。
 * 合う度は本文の書体の太字(14px の Orbitron の 0 は斜線入りの箱に見えるため)。寸法は Orbitron の数字 + 小さい単位(NumUnit)。単位が 12px を割らないよう、数字は 32px(text-rl-title)。
 */
export function TopMouseRow({ rank, item, brand, name, reason, links, overlaid, onOverlay, compare = null, skateHref = null }: {
  /** 本当の順位(絞り込みの前の並びで何位か) */
  rank: number;
  item: Ranked; brand: string; name: string; reason: string; links: ShopLinks; overlaid: boolean; onOverlay: () => void;
  /** 今のマウスとの比べ(マイ設定にマウスがあるときだけ) */
  compare?: string | null;
  /** このマウス専用のソールがあるときだけ(/skates?mouse=<id>) */
  skateHref?: string | null;
}) {
  const m = item.mouse;
  return (
    <li className="grid gap-4 border-y border-rl-line py-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-6">
      <p className="font-display text-rl-display-2 font-black tabular-nums text-rl-highlight">{rank}<span className="sr-only">位</span></p>
      <div className="grid min-w-0 gap-2">
        <p className="text-sm text-rl-muted">{brand}・合う度 <span className="font-bold tabular-nums text-rl-highlight">{item.score}</span></p>
        <h3 data-long-name className="text-2xl font-bold wrap-anywhere">{name}</h3>
        <p className="text-base">{reason}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-rl-muted">
          <span>長さ <NumUnit value={m.lengthMm} unit="mm" className="text-rl-title" /></span>
          <span>幅 <NumUnit value={m.widthMm} unit="mm" className="text-rl-title" /></span>
          <span>重さ {m.weightG === null ? <span className="text-rl-text">{NO_DATA}</span> : <NumUnit value={m.weightG} unit="g" className="text-rl-title" />}</span>
        </p>
        {compare && <p className="text-sm text-rl-secondary-text">{compare}</p>}
        <ChipButton pressed={overlaid} onClick={onOverlay} className="justify-self-start">手と重ねる</ChipButton>
        {skateHref && <ButtonLink href={skateHref} variant="ghost" size="sm" className="justify-self-start px-0">このマウスのソール<ChevronRight aria-hidden className="size-4" /></ButtonLink>}
      </div>
      <ShopButtons links={links} primary className="md:flex-col md:items-end" />
    </li>
  );
}

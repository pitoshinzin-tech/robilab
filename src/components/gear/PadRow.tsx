import type { PadSize } from "@/data/gear-types";
import type { VisiblePad } from "@/lib/pad-filter";
import type { ShopLinks } from "@/lib/shop-links";
import { NO_DATA, padSizeText, surfaceLabel, withUnit } from "@/lib/gear-labels";
import { Badge } from "@/components/ui/badge";
import { ShopButtons } from "@/components/gear/ShopButtons";

/**
 * マウスパッドの 1 行(設計書 3-2)。箱にせず、上の線で区切る幅いっぱいの行。
 * 速さ・止めは点数にせず、メーカー公式の言葉を引用の形で出す(出典は公式ページ)。数字は公式の表記のまま。
 */
export function PadRow({ pad, sizes, links, primary, narrowed }: {
  pad: VisiblePad; sizes: PadSize[]; links: ShopLinks;
  /** 一覧の先頭だけ true(主ボタンは 1 画面に 1 つ) */
  primary: boolean;
  /** 大きさ・厚さで絞り込んでいて、合うサイズだけを出しているか */
  narrowed: boolean;
}) {
  return (
    <li className="grid gap-4 border-t border-rl-line py-6">
      <div className="grid min-w-0 gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rl-muted">
          {pad.brand}<span aria-hidden>・</span>{surfaceLabel(pad.surface)}
          {pad.discontinued && <Badge variant="status">生産終了</Badge>}
        </p>
        <h3 data-long-name className="text-2xl font-bold wrap-anywhere">{pad.name}</h3>
      </div>
      <figure className="grid gap-2">
        <figcaption className="text-sm font-bold text-rl-muted">速さ・止め(メーカー公式の言葉)</figcaption>
        {pad.speedOfficial
          ? <blockquote cite={pad.officialUrl} className="border-l-2 border-rl-line-strong pl-4 text-base wrap-anywhere">{pad.speedOfficial}</blockquote>
          : <p className="text-base text-rl-muted">{NO_DATA}</p>}
      </figure>
      <div className="grid gap-2">
        <p className="text-sm font-bold text-rl-muted">サイズ(公式){narrowed && "・絞り込みに合うものだけ"}</p>
        {sizes.length === 0 ? (
          <p className="text-base text-rl-muted">{NO_DATA}</p>
        ) : (
          <table className="w-full max-w-[560px] text-sm">
            <thead className="text-left text-rl-muted">
              <tr><th scope="col" className="py-1 pr-3 font-bold">名前</th><th scope="col" className="py-1 pr-3 font-bold">幅×奥行き</th><th scope="col" className="py-1 font-bold">厚さ</th></tr>
            </thead>
            <tbody>
              {sizes.map((s, i) => (
                <tr key={`${s.label}-${i}`} className="border-t border-rl-line">
                  <td className="py-2 pr-3 wrap-anywhere">{s.label}</td>
                  <td className="py-2 pr-3 tabular-nums">{padSizeText(s.widthMm, s.depthMm)}</td>
                  <td className="py-2 tabular-nums">{withUnit(s.thicknessMm, "mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pad.firmnessVariants.length > 0 && (
        <p className="text-sm text-rl-muted wrap-anywhere">硬さ(公式):<span className="text-rl-text">{pad.firmnessVariants.join("・")}</span></p>
      )}
      <details className="group rounded-rl-sm border border-rl-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-bold [&::-webkit-details-marker]:hidden">公式の表記のメモ</summary>
        <p className="px-4 pb-4 text-sm text-rl-muted wrap-anywhere">{pad.note}</p>
      </details>
      <div className="grid gap-2">
        <ShopButtons links={links} primary={primary} />
        <p className="text-xs text-rl-muted">確認日 {pad.checkedAt}</p>
      </div>
    </li>
  );
}

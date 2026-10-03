import type { PadSize } from "@/data/gear-types";
import type { VisiblePad } from "@/lib/pad-filter";
import type { ShopLinks } from "@/lib/shop-links";
import { NO_DATA, surfaceLabel } from "@/lib/gear-labels";
import { Badge } from "@/components/ui/badge";
import { ShopButtons } from "@/components/gear/ShopButtons";
import { SpecNum } from "@/components/gear/SpecValue";
import { PadScale } from "@/components/gear/PadScale";
import { padOutlineIndexer } from "@/lib/pad-scale";

/**
 * マウスパッドの 1 行(設計書 3-2)。箱にせず、上の線で区切る幅いっぱいの行。
 * 表のサイズの行と縮尺図の外形は同じ番号(data-size-i ↔ data-outline-i)でつなぎ、乗せると互いに光る(CSS だけ・JS 0。行はフォーカスの順に入れない)。
 * 速さ・止めは点数にせず、メーカー公式の言葉(原文の「…」の中身だけ)を引用の形で出す(出典は公式ページ)。調べた人の注記は出さない。数字は公式の表記のまま。
 */
export function PadRow({ pad, sizes, links, primary, narrowed }: {
  pad: VisiblePad; sizes: PadSize[]; links: ShopLinks;
  /** 一覧の先頭だけ true(主ボタンは 1 画面に 1 つ。縮尺図の説明もこの行だけ見せる) */
  primary: boolean;
  /** 大きさ・厚さで絞り込んでいて、合うサイズだけを出しているか */
  narrowed: boolean;
}) {
  const outlineOf = padOutlineIndexer(pad.sizes);
  return (
    <li className="rl-size-link grid gap-4 border-t border-rl-line py-6">
      <div className="grid min-w-0 gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rl-muted">
          {pad.brand}<span aria-hidden>・</span>{surfaceLabel(pad.surface)}
          {pad.discontinued && <Badge variant="status">生産終了</Badge>}
        </p>
        <h3 data-long-name className="text-2xl font-bold wrap-anywhere">{pad.name}</h3>
      </div>
      <figure className="grid gap-2">
        <figcaption className="text-sm font-bold text-rl-muted">速さ・止め(メーカー公式の言葉)</figcaption>
        {pad.speedQuotes.length > 0
          ? pad.speedQuotes.map((q, i) => (
              <blockquote key={i} cite={pad.officialUrl} className="border-l-2 border-rl-line-strong pl-4 text-base wrap-anywhere">{q}</blockquote>
            ))
          : <p className="text-base text-rl-muted">{NO_DATA}</p>}
      </figure>
      <div className="grid gap-2">
        <p className="text-sm font-bold text-rl-muted">サイズ(公式){narrowed && "・絞り込みに合うものだけ"}</p>
        {sizes.length === 0 ? (
          <p className="text-base text-rl-muted">{NO_DATA}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] md:items-start">
            <table className="w-full table-fixed text-sm">
              <colgroup><col className="w-[35%]" /><col className="w-[40%]" /><col className="w-[25%]" /></colgroup>
              <thead className="text-left text-rl-muted">
                <tr><th scope="col" className="py-1 pr-3 pl-2 font-bold">名前</th><th scope="col" className="py-1 pr-3 font-bold">幅×奥行き</th><th scope="col" className="py-1 font-bold">厚さ</th></tr>
              </thead>
              <tbody>
                {sizes.map((s, i) => (
                  <tr key={`${s.label}-${i}`} data-size-i={outlineOf(s) ?? undefined} className="border-t border-rl-line">
                    <td className="py-2 pr-3 pl-2 wrap-anywhere">{s.label}</td>
                    <td className="py-2 pr-3">
                      {s.widthMm === null || s.depthMm === null
                        ? <span className="text-rl-muted">{NO_DATA}</span>
                        : <><SpecNum value={s.widthMm} /><span className="px-0.5 text-rl-muted">×</span><SpecNum value={s.depthMm} unit="mm" /></>}
                    </td>
                    <td className="py-2">{s.thicknessMm === null ? <span className="text-rl-muted">{NO_DATA}</span> : <SpecNum value={s.thicknessMm} unit="mm" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PadScale sizes={pad.sizes} matched={narrowed ? sizes : null} showCaption={primary} />
          </div>
        )}
      </div>
      {pad.firmnessVariants.length > 0 && (
        <p className="text-sm text-rl-muted wrap-anywhere">硬さ(公式):<span className="text-rl-text">{pad.firmnessVariants.join("・")}</span></p>
      )}
      <div className="grid gap-2">
        <ShopButtons links={links} primary={primary} />
        <p className="text-xs text-rl-muted">確認日 {pad.checkedAt}</p>
      </div>
    </li>
  );
}

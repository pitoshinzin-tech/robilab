import type { SkateSpec } from "@/data/gear-types";
import type { ShopLinks } from "@/lib/shop-links";
import { SKATE_SHAPE_LABEL, materialLabel, packText, skateThicknessLabel } from "@/lib/gear-labels";
import { Badge } from "@/components/ui/badge";
import { ShopButtons } from "@/components/gear/ShopButtons";
import { SkateCellMark } from "@/components/gear/SkateGrid";
import { ThicknessScale } from "@/components/gear/ThicknessScale";
import { skateCellKind } from "@/lib/skate-grid";

/**
 * マウスソールの 1 行(設計書 3-3)。箱にせず、上の線で区切る 1 列の縦の流れ(/pads の PadRow と同じ)。
 * ブランド名の前に、上のマスと同じ印(専用 = 面・汎用 = 線)。
 * 厚さは公式に 1 つの数字があるときだけ mm(マゼンタ。14〜16px の Orbitron の 0・8 は箱の記号に見えるので、見出しの件数と同じ本文の書体の太字)と 0〜1.5mm の目盛り、幅の表記は公式の原文のまま(目盛りなし)。作業者向けのメモ(note・selectionBasis)は出さない。
 */
export function SkateRow({ skate, links, primary }: { skate: SkateSpec; links: ShopLinks; primary: boolean }) {
  return (
    <li className="grid gap-4 border-t border-rl-line py-6">
      <div className="grid min-w-0 gap-2">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rl-muted">
          <SkateCellMark kind={skateCellKind(skate)} />
          {skate.brand}<span aria-hidden>・</span>{SKATE_SHAPE_LABEL[skate.shape]}
          {skate.discontinued && <Badge variant="status">生産終了</Badge>}
        </p>
        <h3 data-long-name className="text-xl font-bold wrap-anywhere">{skate.name}</h3>
        <p className="text-sm text-rl-muted wrap-anywhere">対応(公式の表記):{skate.forMouse}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
          <div className="min-w-0"><dt className="text-rl-muted">素材</dt><dd className="wrap-anywhere">{materialLabel(skate.material)}</dd></div>
          <div className="min-w-0"><dt className="text-rl-muted">入数</dt><dd className="wrap-anywhere">{packText(skate.piecesPerPack, skate.setsPerPack)}</dd></div>
          <div className="col-span-2 min-w-0 md:col-span-1"><dt className="text-rl-muted">厚さ</dt>{skate.thicknessMm !== null ? (
            <dd className="flex flex-wrap items-center gap-x-3 gap-y-1"><span><span className="text-base font-bold tabular-nums text-rl-highlight">{skate.thicknessMm}</span><span className="ml-0.5 text-xs font-bold">mm</span></span><ThicknessScale mm={skate.thicknessMm} /></dd>
          ) : (
            <dd className="wrap-anywhere">{skateThicknessLabel(skate.thicknessMm, skate.thicknessOfficial)}</dd>
          )}</div>
        </dl>
        {skate.materialOfficial && <p className="text-sm text-rl-muted wrap-anywhere">素材の公式の表記:「{skate.materialOfficial}」</p>}
        {skate.extras.length > 0 && <p className="text-sm text-rl-muted wrap-anywhere">付属(公式):{skate.extras.join("・")}</p>}
        <p className="text-xs text-rl-muted">確認日 {skate.checkedAt}</p>
      </div>
      <ShopButtons links={links} primary={primary} />
    </li>
  );
}

import type { OtherMouseRow } from "@/lib/mouse-rows";
import { connectionLabel, shapeLabel, withUnit } from "@/lib/gear-labels";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShopButtons } from "@/components/gear/ShopButtons";

/** 公式の長さか幅がないマウス(設計書 3-1)。手に合う順には入れず、わかっている公式の数字と店へのリンクだけを出す(人気の順)。 */
export function OtherMiceList({ items }: { items: OtherMouseRow[] }) {
  return (
    <section aria-labelledby="mouse-other" className="grid gap-4">
      <SectionHeading id="mouse-other" title="公式の大きさがないため比べられません" count={items.length}
        description="メーカー公式に長さか幅の数字がないマウスです。手に合う順には入れていません(人気の順)。" />
      <ul className="grid">
        {items.map((m) => (
          <li key={m.id} className="grid gap-4 border-t border-rl-line py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
            <div className="grid min-w-0 gap-1">
              <p className="text-sm text-rl-muted">{m.brand}</p>
              <h3 data-long-name className="text-xl font-bold wrap-anywhere">{m.name}</h3>
              <p className="text-sm text-rl-muted">公式に数字がない項目:{m.missing.join("・")}</p>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-rl-muted">
                <div className="flex gap-1"><dt>長さ</dt><dd className="text-rl-text">{withUnit(m.lengthMm, "mm")}</dd></div>
                <div className="flex gap-1"><dt>幅</dt><dd className="text-rl-text">{withUnit(m.widthMm, "mm")}</dd></div>
                <div className="flex gap-1"><dt>高さ</dt><dd className="text-rl-text">{withUnit(m.heightMm, "mm")}</dd></div>
                <div className="flex gap-1"><dt>重さ</dt><dd className="text-rl-text">{withUnit(m.weightG, "g")}</dd></div>
                <div className="flex gap-1"><dt>形</dt><dd className="text-rl-text">{shapeLabel(m.shape)}</dd></div>
                <div className="flex gap-1"><dt>接続</dt><dd className="text-rl-text">{connectionLabel(m.connection)}</dd></div>
              </dl>
            </div>
            <ShopButtons links={m.links} className="md:justify-end" />
          </li>
        ))}
      </ul>
    </section>
  );
}

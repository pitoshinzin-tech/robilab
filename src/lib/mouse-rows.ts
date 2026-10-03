import type { MouseConnection, MouseShape } from "@/data/gear-types";
import { byPopularity } from "@/lib/gear-popularity";
import { isFitMouse, type FitMouse } from "@/lib/mouse-fit";
import { affiliateEnv, shopLinks, type AffiliateEnv, type ShopLinks } from "@/lib/shop-links";

/** データの形(src/data/mice.ts の MouseSpec が当てはまる)。名前は devices.ts から引く */
export type MouseSource = {
  id: string;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  weightG: number | null;
  shape: MouseShape | null;
  connection: MouseConnection | null;
  officialUrl: string;
  /** 人気の根拠(ないときはデータの順) */
  selectionBasis?: string;
};
export type NameLookup = (id: string) => { brand: string; name: string } | undefined;
type RowExtras = { brand: string; name: string; links: ShopLinks; imageUrl: string | null; skateCount: number };
/** ブラウザへ送る行(表示に要る分だけ。出典の文・メモ・センサー名は送らない) */
export type MouseRow = FitMouse & RowExtras;
/** 公式の長さか幅がないマウス(順位に入れない。サーバーの部品で出す) */
export type OtherMouseRow = Omit<MouseSource, "officialUrl" | "selectionBasis"> & RowExtras & { missing: string[] };

/**
 * マウスのデータを、画面に出す行にする(サーバーで呼ぶ)。
 * 長さと幅がそろうものは合う順に並べる行(並びはデータのまま。ブラウザで手に合う順にする)、ないものは「比べられません」の行(人気の順)。
 */
export function toMouseRows(
  mice: readonly MouseSource[],
  names: NameLookup,
  rakuten: Readonly<Record<string, { itemUrl: string; imageUrl: string }>>,
  skateCounts: Readonly<Record<string, number>> = {},
  env: AffiliateEnv = affiliateEnv(),
): { comparable: MouseRow[]; other: OtherMouseRow[] } {
  const comparable: MouseRow[] = [];
  const others: { row: OtherMouseRow; selectionBasis: string }[] = [];
  for (const m of mice) {
    const n = names(m.id);
    if (!n) continue; // devices.ts にない(tests/data/mice.test.ts が 0 件を確かめる)
    const r = rakuten[m.id];
    const links = shopLinks(`${n.brand} ${n.name}`, m.officialUrl, env, r?.itemUrl);
    const extras: RowExtras = { brand: n.brand, name: n.name, links, imageUrl: r && links.rakutenIsItem ? r.imageUrl : null, skateCount: skateCounts[m.id] ?? 0 };
    const base = { id: m.id, heightMm: m.heightMm, weightG: m.weightG, shape: m.shape, connection: m.connection, ...extras };
    if (isFitMouse(m)) {
      comparable.push({ ...base, lengthMm: m.lengthMm, widthMm: m.widthMm });
    } else {
      const missing = [m.lengthMm === null ? "長さ" : null, m.widthMm === null ? "幅" : null].filter((x): x is string => x !== null);
      others.push({ row: { ...base, lengthMm: m.lengthMm, widthMm: m.widthMm, missing }, selectionBasis: m.selectionBasis ?? "" });
    }
  }
  return { comparable, other: byPopularity(others).map((o) => o.row) };
}

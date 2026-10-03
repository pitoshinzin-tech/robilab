import type { SkateSpec } from "@/data/gear-types";
import { firstParam, pick, queryHref, type SearchParams } from "@/lib/gear-query";

export type SkateFilter = {
  /** devices.ts のマウスの id(知らない id・空は null = 選ばない) */
  mouse: string | null;
  material: "all" | "PTFE" | "glass" | "UPE" | "other";
  shape: "all" | "full" | "dot";
};
export const NO_SKATE_FILTER: SkateFilter = { mouse: null, material: "all", shape: "all" };

export function parseSkateFilter(sp: SearchParams, knownMouseIds: ReadonlySet<string>): SkateFilter {
  const mouse = firstParam(sp, "mouse");
  return {
    mouse: mouse !== null && knownMouseIds.has(mouse) ? mouse : null,
    material: pick(firstParam(sp, "material"), ["all", "PTFE", "glass", "UPE", "other"] as const, "all"),
    shape: pick(firstParam(sp, "shape"), ["all", "full", "dot"] as const, "all"),
  };
}

/** 素のリンク(この中だけで使う。画面のリンクは skateChipHref か skatesHrefFor。マウス未選択のとき mouse= を付けないので、そのまま使うとマイ設定に選び直される) */
function skateFilterHref(f: SkateFilter, patch: Partial<SkateFilter> = {}): string {
  const n = { ...f, ...patch };
  return queryHref("/skates", [["mouse", n.mouse], ["material", n.material], ["shape", n.shape]]);
}

/** そのマウス専用のソール(公式の対応表から結び付けたもの) */
export function skatesForMouse(skates: readonly SkateSpec[], mouseId: string): SkateSpec[] {
  return skates.filter((s) => s.mouseIds.includes(mouseId));
}

/** どのマウスにも使える汎用のドット(機種に結び付けていないドット) */
export function universalSkates(skates: readonly SkateSpec[]): SkateSpec[] {
  return skates.filter((s) => s.shape === "dot" && s.mouseIds.length === 0);
}

/** マウスの id ごとの専用ソールの数(/mouse の「このマウスのソール」と、マウスを選ぶ欄の件数) */
export function skateCounts(skates: readonly SkateSpec[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of skates) for (const id of s.mouseIds) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/** 素材・形で絞る(並びは変えない)。素材が公式にないものは素材の絞り込みで外れる */
export function filterSkates(skates: readonly SkateSpec[], f: Pick<SkateFilter, "material" | "shape">): SkateSpec[] {
  return skates.filter((s) => (f.material === "all" || s.material === f.material) && (f.shape === "all" || s.shape === f.shape));
}

/** ブランドごと(最初に出た順。中の並びはデータの順) */
export function groupByBrand(skates: readonly SkateSpec[]): { brand: string; items: SkateSpec[] }[] {
  const groups = new Map<string, SkateSpec[]>();
  for (const s of skates) groups.set(s.brand, [...(groups.get(s.brand) ?? []), s]);
  return [...groups].map(([brand, items]) => ({ brand, items }));
}

export type SkateView =
  | { kind: "mouse"; mouseId: string; dedicated: SkateSpec[]; universal: SkateSpec[] }
  | { kind: "all"; groups: { brand: string; items: SkateSpec[] }[]; total: number };

/** 画面の形:マウスを選んだら「専用」と「汎用のドット」、選ばなければブランド別 */
export function skateView(skates: readonly SkateSpec[], f: SkateFilter): SkateView {
  const narrowed = filterSkates(skates, f);
  if (f.mouse !== null) return { kind: "mouse", mouseId: f.mouse, dedicated: skatesForMouse(narrowed, f.mouse), universal: universalSkates(narrowed) };
  return { kind: "all", groups: groupByBrand(narrowed), total: narrowed.length };
}

/**
 * ページ内の絞り込みのリンク。マウスを選んでいないときは空の `mouse=` を残す
 * (URL に mouse がないと MyMousePreselect がマイ設定のマウスに選び直すため。チップを押したら以後は選び直さない)。
 */
export function skateChipHref(f: SkateFilter, patch: Partial<SkateFilter> = {}): string {
  const href = skateFilterHref(f, patch);
  const mouse = "mouse" in patch ? patch.mouse : f.mouse;
  if (mouse !== null && mouse !== undefined) return href;
  return href.includes("?") ? href.replace("?", "?mouse=&") : `${href}?mouse=`;
}

/** /mouse などから「このマウスのソール」へ。選んだマウスつき(画面のリンクはこの関数にそろえる) */
export function skatesHrefFor(mouseId: string): string {
  return skateChipHref(NO_SKATE_FILTER, { mouse: mouseId });
}

export type MouseOptionGroup = { brand: string; options: { id: string; text: string }[] };

/**
 * マウスを選ぶ欄の optgroup。ブランドごと(専用のソールがあるブランドを先に、元の順を保つ)。
 * ブランドの中は専用があるものを先に「名前(N 件)」、ないものは名前だけ(375 で切れないよう、ブランド名は繰り返さない)。
 */
export function mouseOptionGroups(mice: readonly { id: string; brand: string; name: string }[], counts: Readonly<Record<string, number>>): MouseOptionGroup[] {
  const n = (id: string) => (Object.hasOwn(counts, id) ? counts[id] : 0);
  const groups = new Map<string, { id: string; brand: string; name: string }[]>();
  for (const m of mice) groups.set(m.brand, [...(groups.get(m.brand) ?? []), m]);
  const list = [...groups].map(([brand, items]) => ({
    brand,
    has: items.some((m) => n(m.id) > 0),
    options: [...items.filter((m) => n(m.id) > 0), ...items.filter((m) => n(m.id) === 0)]
      .map((m) => ({ id: m.id, text: n(m.id) > 0 ? `${m.name}(${n(m.id)} 件)` : m.name })),
  }));
  return [...list.filter((g) => g.has), ...list.filter((g) => !g.has)].map(({ brand, options }) => ({ brand, options }));
}

/** 素材・形で「すべて」でない条件の数(375 の畳んだ絞り込みの見出しに出す。マウスは別の箱なので数えない) */
export function skateFilterCount(f: SkateFilter): number {
  return [f.material, f.shape].filter((v) => v !== "all").length;
}

/**
 * 上の大きな数字の説明(/pads の padCountCaption と同じ考え)。
 * total:絞り込む前の数(マウスを選んでいるときはそのマウスに使える数、選んでいないときは全件)。
 */
export function skateCountCaption(f: SkateFilter, total: number): string {
  const filtered = skateFilterCount(f) > 0;
  if (f.mouse !== null) return filtered ? `絞り込みに合う数(このマウスに使える ${total} 件)` : "このマウスに使える数";
  return filtered ? `絞り込みに合う数(全 ${total} 件)` : "公式の数字で比べられる数";
}

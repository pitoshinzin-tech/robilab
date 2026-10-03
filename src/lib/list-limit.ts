import { firstParam, type SearchParams } from "@/lib/gear-query";

/**
 * /pads・/skates の一覧を、最初は人気の順の上位だけ描く(スマホの遅い回線で HTML を軽くするため。docs/design/perf.md)。
 * 「すべて見る」は ?all=1 のリンクで、サーバーが全件を描く(JS は足さない)。
 */
export const LIST_LIMIT = 12;

/** ?all=1 のときだけ全件。ほかの値は無視する(重なりは最初の値) */
export function parseShowAll(sp: SearchParams): boolean {
  return firstParam(sp, "all") === "1";
}

/** 上限より多いときだけ上位を切る(並びは変えない)。total は切る前の数、cut は切ったか */
export function limitRows<T>(items: readonly T[], showAll: boolean, limit: number = LIST_LIMIT): { shown: T[]; total: number; cut: boolean } {
  const cut = !showAll && items.length > limit;
  return { shown: cut ? items.slice(0, limit) : [...items], total: items.length, cut };
}

/** /skates でマウスを選ばないときの、ブランドの段ごとの上限 */
export const GROUP_LIMIT = 2;

/**
 * 段(ブランド)ごとに上位を切る(段の並び・段の中の並びは変えない)。全体が LIST_LIMIT 以下・どの段も上限以下・すべて見るのときは切らない。
 * total は段の全件(見出しの件数に使う)。
 */
export function limitPerGroup<T>(groups: readonly { brand: string; items: readonly T[] }[], showAll: boolean, perGroup: number = GROUP_LIMIT): {
  groups: { brand: string; items: T[]; total: number }[]; total: number; cut: boolean;
} {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const cut = !showAll && total > LIST_LIMIT && groups.some((g) => g.items.length > perGroup);
  return { groups: groups.map((g) => ({ brand: g.brand, items: cut ? g.items.slice(0, perGroup) : [...g.items], total: g.items.length })), total, cut };
}

/** 見出しの近くに出す説明 */
export function shownNote(shown: number): string {
  return `上位 ${shown} 件を表示中`;
}

/** 一覧の下のリンクの文 */
export function showAllText(total: number): string {
  return `すべて見る(全 ${total} 件)`;
}

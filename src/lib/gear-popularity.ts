/**
 * 人気の順(設計書 3-2)。selectionBasis(出典と順位の文)から、売れ筋ランキングのいちばん高い順位を読む。
 * ProSettings.net のプロ使用率は「選ぶときの参考」なので数えない(docs/content/gear/mice-notes.md)。URL の中の数字は読まない。
 */
export function bestRank(basis: string): number | null {
  const text = basis.replace(/https?:\/\/\S+/g, "");
  let best: number | null = null;
  for (const segment of text.split("/")) {
    if (segment.includes("プロ使用率")) continue;
    for (const m of segment.matchAll(/(\d+)\s*位/g)) {
      const n = Number(m[1]);
      if (n >= 1 && (best === null || n < best)) best = n;
    }
  }
  return best;
}

/** 順位の高い順。順位のないものは後ろ。同じならもとの並び(データの順)。もとの配列は変えない。 */
export function byPopularity<T extends { selectionBasis: string }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, rank: bestRank(item.selectionBasis) }))
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      }
      return a.index - b.index;
    })
    .map((x) => x.item);
}

/** 画面の下に出す、並びの根拠の 1 行 */
export const POPULARITY_NOTE =
  "並びは、Amazon.co.jp・価格.com などの売れ筋ランキング(2026-10-03 取得)で、いちばん高い順位の順です。順位が載っていないものは後ろにあります。";

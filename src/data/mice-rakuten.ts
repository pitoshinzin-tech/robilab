// scripts/rakuten-mice.mjs が作る。手で直さない。月 1 回くらい作り直す。
// 楽天の商品検索 API の結果のスナップショット(キーはマウスの id。並びは src/data/mice.ts と同じ)。

export type RakutenItem = { itemCode: string; itemName: string; shopName: string; itemUrl: string; imageUrl: string; checkedAt: string };

export const MICE_RAKUTEN: Record<string, RakutenItem> = {};

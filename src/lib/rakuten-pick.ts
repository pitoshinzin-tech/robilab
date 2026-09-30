import type { RakutenItem } from "@/data/mice-rakuten";

/**
 * 楽天の商品検索の結果から、そのマウス本体の商品を 1 件選ぶ(scripts/rakuten-mice.mjs が使う)。
 * ネットにはつながない純粋な関数だけを置く。Node の型の除去でそのまま読めるよう、
 * 実行時に読み込むもの(import)は置かず、TypeScript だけの書き方(enum など)も使わない。
 */

/** 検索結果の Items[].Item のうち、使う項目だけ */
export type RakutenCandidate = {
  itemCode: string;
  itemName: string;
  itemUrl: string;
  shopName: string;
  reviewCount: number;
  mediumImageUrls?: { imageUrl: string }[];
};

/** 商品名にあったら除く語(マウス本体ではない、または状態の悪い品) */
export const ACCESSORY_WORDS = ["グリップテープ", "ソール", "スケート", "ケース", "カバー", "交換", "互換", "保護", "フィルム", "中古", "訳あり", "ジャンク", "美品", "アウトレット", "掘り出し", "展示品", "開封品"];

/**
 * 同じ名前の別の型・版を表す語。製品名に入っていないのに商品名にあれば、別の型なので除く
 * (例:DeathAdder V3 に対する HyperSpeed、M75 WIRELESS に対する AIR、Haste 2 に対する Core、OP1 8k に対する V2、Xlite V3 に対する eS)
 */
export const VARIANT_WORDS = ["hyperspeed", "air", "core", "v2", "v3", "es", "se", "lite", "cobra", "mini", "max", "ultra", "elite", "origin", "pro", "plus", "dex"];

/** メーカー名の言い換え(商品名にどれか 1 つあればよい) */
const BRAND_ALIASES: Record<string, string[]> = {
  "logicool g": ["logicool", "ロジクール"],
};

/** 全角を半角に、英字を小文字に、区切りの記号を空白にそろえる */
export function normalizeName(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[-_/・|()[\]【】「」]/g, " ").replace(/\s+/g, " ").trim();
}

function brandWords(brand: string): string[] {
  const b = normalizeName(brand);
  return BRAND_ALIASES[b] ?? [b];
}

/** 製品名の語(型番の英数字)。区切りの記号でも分ける(EC2-C → ec2, c) */
export function modelTokens(name: string): string[] {
  return normalizeName(name).split(" ").filter(Boolean);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 語が単独の語として入っているか(G305 が G3050 に、C が CW に当たらないように) */
function hasWord(text: string, word: string): boolean {
  return new RegExp(`(?<![a-z0-9])${escapeRe(word)}(?![a-z0-9])`).test(text);
}

/**
 * 製品名の語が、ひと続きの並びとして入っているか(「Haste 2」が「Haste … 2年保証」に当たらないように)。
 * 並びのすぐ後に短い英数字の語(2C・Gen・V2 など)が続くときは、別の型とみなして当てない。
 */
function matchesModel(text: string, name: string): boolean {
  const tokens = modelTokens(name);
  if (tokens.length === 0) return false;
  const re = new RegExp(`(?<![a-z0-9])${tokens.map(escapeRe).join(String.raw`\s*`)}(?![a-z0-9])`, "g");
  for (const m of text.matchAll(re)) {
    const after = text.slice((m.index ?? 0) + m[0].length);
    if (/^\s+[a-z0-9]{1,3}(?![a-z0-9])/.test(after)) continue;
    return true;
  }
  return false;
}

/**
 * 条件に合う候補のうち、レビュー数がいちばん多いものを返す。なければ null。
 * - 商品名にメーカー名と、製品名の語がすべて入っている
 * - アクセサリーなどの語が入っていない
 * - siblings(同じメーカーの、名前がこのマウスの名前を含む別のマウス。例:PRO X SUPERLIGHT に対する PRO X SUPERLIGHT 2)に当たる商品は除く
 */
export function pickRakutenItem(candidates: RakutenCandidate[], brand: string, name: string, siblings: string[] = []): RakutenCandidate | null {
  const brands = brandWords(brand);
  const own = new Set(modelTokens(name));
  const longer = siblings.filter((s) => {
    const t = modelTokens(s);
    return t.length > own.size && [...own].every((w) => t.includes(w));
  });
  let best: RakutenCandidate | null = null;
  for (const c of candidates) {
    const raw = c.itemName.normalize("NFKC");
    const text = normalizeName(c.itemName);
    if (!brands.some((b) => text.includes(b))) continue;
    if (!matchesModel(text, name)) continue;
    if (ACCESSORY_WORDS.some((w) => raw.includes(w))) continue;
    if (longer.some((s) => matchesModel(text, s))) continue;
    if (VARIANT_WORDS.some((w) => !own.has(w) && hasWord(text, w))) continue;
    // 別のマウスとのセット(「&」「＆」「セット」)も除く
    if (/[&＆]|&amp;|セット/.test(raw)) continue;
    if (!best || c.reviewCount > best.reviewCount) best = c;
  }
  return best;
}

/** 商品ページの URL から ? 以降を削る。https の楽天市場の商品ページでなければ null */
export function cleanItemUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== "item.rakuten.co.jp") return null;
    return `${u.origin}${u.pathname}`;
  } catch {
    return null;
  }
}

/** 画像の URL を 300x300 にする。https の楽天の画像サーバーでなければ null */
export function imageUrl300(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== "thumbnail.image.rakuten.co.jp") return null;
    u.searchParams.set("_ex", "300x300");
    return u.toString();
  } catch {
    return null;
  }
}

/** 候補を、保存する形にする。URL が使えなければ null */
export function toRakutenItem(c: RakutenCandidate, checkedAt: string): RakutenItem | null {
  const itemUrl = cleanItemUrl(c.itemUrl);
  const first = c.mediumImageUrls?.[0]?.imageUrl;
  const image = first ? imageUrl300(first) : null;
  if (!itemUrl || !image) return null;
  return { itemCode: c.itemCode, itemName: c.itemName, shopName: c.shopName, itemUrl, imageUrl: image, checkedAt };
}

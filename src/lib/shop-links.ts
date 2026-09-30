/**
 * 公式ページと Amazon・楽天の検索リンク。
 * アフィリエイトの審査が通ったら、Vercel に NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG / NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID を入れると
 * 成果報酬付きのリンクになり、そのときだけ「PR」を表示する。形が正しくない値は未設定として扱う。
 * 楽天の商品ページ(src/data/mice-rakuten.ts のスナップショット)があれば、楽天は検索ではなくその商品ページへつなぐ。
 */
export type AffiliateEnv = { amazonTag?: string; rakutenId?: string };
export type ShopLinks = {
  official: string;
  amazon: string;
  rakuten: string;
  amazonPr: boolean;
  rakutenPr: boolean;
  /** 楽天のリンクが商品ページか(false なら検索) */
  rakutenIsItem: boolean;
};

const AMAZON_TAG_RE = /^[A-Za-z0-9-]{1,64}$/;
const RAKUTEN_ID_RE = /^[0-9a-f]{8}(\.[0-9a-f]{8}){3}$/i;

export function affiliateEnv(): AffiliateEnv {
  // NEXT_PUBLIC_ の値は組み立て時に埋め込まれる(ブラウザでも読める公開の値)
  return { amazonTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG, rakutenId: process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID };
}

/** https の楽天市場の商品ページだけ使う(それ以外は検索リンクにする) */
function safeRakutenItemUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "item.rakuten.co.jp" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function shopLinks(query: string, officialUrl: string, env: AffiliateEnv = affiliateEnv(), rakutenItemUrl?: string): ShopLinks {
  const amazonTag = env.amazonTag && AMAZON_TAG_RE.test(env.amazonTag) ? env.amazonTag : null;
  const rakutenId = env.rakutenId && RAKUTEN_ID_RE.test(env.rakutenId) ? env.rakutenId : null;

  const amazon = new URL("https://www.amazon.co.jp/s");
  amazon.searchParams.set("k", query);
  if (amazonTag) amazon.searchParams.set("tag", amazonTag);

  const itemUrl = safeRakutenItemUrl(rakutenItemUrl);
  const rakutenTarget = itemUrl ?? `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(query)}/`;
  let rakuten = rakutenTarget;
  if (rakutenId) {
    const u = new URL(`https://hb.afl.rakuten.co.jp/hgc/${rakutenId}/`);
    u.searchParams.set("pc", rakutenTarget);
    rakuten = u.toString();
  }
  return { official: officialUrl, amazon: amazon.toString(), rakuten, amazonPr: amazonTag !== null, rakutenPr: rakutenId !== null, rakutenIsItem: itemUrl !== null };
}

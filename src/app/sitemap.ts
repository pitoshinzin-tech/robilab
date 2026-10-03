import type { MetadataRoute } from "next";
import { ALL_TYPE_CODES } from "@/data/types";
import { PROS_READY } from "@/data/pros";
import { charHref, dexChars, publishedGames } from "@/lib/char-dex";
import { getSiteUrl } from "@/lib/site-url";

/**
 * 検索エンジン向けの URL の一覧(設計書 6-6)。名刺(/c/)・ログインの要る画面・開発用・公開していないゲーム・予備は入れない。
 * キャラのページの lastModified は公式の確認日。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const fixed = ["/", "/diagnosis", "/types", "/aim", "/mouse", "/pads", "/skates", "/tools/sensitivity", ...(PROS_READY ? ["/pros"] : []), "/games"];
  const games = publishedGames();
  return [
    ...fixed.map((p) => ({ url: `${site}${p}` })),
    ...ALL_TYPE_CODES.map((c) => ({ url: `${site}/type/${c}` })),
    ...games.map((g) => ({ url: `${site}/games/${g.id}/chars` })),
    ...games.flatMap((g) => dexChars(g.id).map((c) => ({ url: `${site}${charHref(c)}`, lastModified: c.checkedAt }))),
  ];
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** 開発用・名刺(個人のページ)・ログイン・API はクロールさせない(設計書 6-6) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dev/", "/c/", "/auth/", "/api/"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}

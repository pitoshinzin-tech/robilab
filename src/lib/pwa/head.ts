import type { Metadata, Viewport } from "next";
import { BRAND } from "@/lib/brand";

/**
 * iPhone のアプリ表示(設計書 2-2)。black-translucent にするとヘッダーの下にページが潜り、上の余白の直しが要るので black。
 * Next.js は mobile-web-app-capable・apple-mobile-web-app-title・apple-mobile-web-app-status-bar-style を出す。
 */
export const APPLE_WEB_APP = { capable: true, title: BRAND.name, statusBarStyle: "black" } satisfies NonNullable<Metadata["appleWebApp"]>;

/**
 * themeColor は manifest の theme_color と同じ(BRAND.colors.bg)。
 * viewport-fit=cover で、下のタブバーの env(safe-area-inset-bottom) が iPhone で初めて効く(ホームバーの下に背景の帯を残さない)。
 */
export const SITE_VIEWPORT: Viewport = { themeColor: BRAND.colors.bg, colorScheme: "dark", viewportFit: "cover" };

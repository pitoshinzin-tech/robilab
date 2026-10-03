import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** PNG は scripts/app-icons.mjs で作る(同じ名前で差し替えれば manifest は変えなくてよい) */
export const APP_ICONS = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
] satisfies NonNullable<MetadataRoute.Manifest["icons"]>;

/** 長押し・右クリックのショートカット。アイコンは書かない(アプリのアイコンが使われる) */
export const APP_SHORTCUTS = [
  { name: "今日の文字", url: "/aim" },
  { name: "仲間", url: "/lobby" },
  { name: "マウス探し", url: "/mouse" },
] satisfies NonNullable<MetadataRoute.Manifest["shortcuts"]>;

/** 設計書 2 章。文字は BRAND から作り、直書きしない。英字の表記は未決定なので入れない */
export function appManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND.colors.bg,
    theme_color: BRAND.colors.bg,
    lang: "ja",
    dir: "ltr",
    categories: ["games", "entertainment"],
    icons: APP_ICONS,
    shortcuts: APP_SHORTCUTS,
  };
}

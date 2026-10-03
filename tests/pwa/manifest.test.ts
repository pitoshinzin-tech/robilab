import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { BRAND } from "@/lib/brand";
import { APP_ICONS, APP_SHORTCUTS, appManifest } from "@/lib/pwa/manifest-data";
import { SITE_VIEWPORT } from "@/lib/pwa/head";
import manifest from "@/app/manifest";
import { decodePng } from "../../scripts/app-icons.mjs";

const m = appManifest();
// ショートカットの行き先のページのファイル(ルートグループを含むので表で持つ)
const PAGE_FILE: Record<string, string> = {
  "/aim": "src/app/aim/page.tsx",
  "/lobby": "src/app/lobby/(list)/page.tsx",
  "/mouse": "src/app/mouse/page.tsx",
};

describe("manifest(設計書 2 章)", () => {
  it("必須の項目と値", () => {
    expect(m).toMatchObject({
      id: "/", name: BRAND.name, short_name: BRAND.name, description: BRAND.description,
      start_url: "/", scope: "/", display: "standalone",
      background_color: BRAND.colors.bg, theme_color: BRAND.colors.bg,
      lang: "ja", dir: "ltr", categories: ["games", "entertainment"],
    });
    expect(m.orientation).toBeUndefined();
    expect(m.name).toBe("ロビラボ");
  });
  it("theme_color は layout の viewport.themeColor と同じ(ずれると起動の途中でバーの色が変わる)", () => {
    // layout は next/font を読むので import せず、viewport が SITE_VIEWPORT そのものであることを文字で確かめる
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toMatch(/export const viewport: Viewport = SITE_VIEWPORT;/);
    expect(m.theme_color).toBe(SITE_VIEWPORT.themeColor);
  });
  it("src/app/manifest.ts は appManifest() をそのまま返す", () => {
    expect(manifest()).toEqual(m);
  });
  it("外の URL を 1 つも含まない(scope・start_url・ショートカット・アイコンは同じ origin)", () => {
    const text = JSON.stringify(m);
    expect(text).not.toMatch(/https?:|\/\//);
  });
});

describe("アイコン", () => {
  it("192 any・512 any・512 maskable の 3 つ", () => {
    expect(APP_ICONS.map((i) => [i.sizes, i.purpose])).toEqual([["192x192", "any"], ["512x512", "any"], ["512x512", "maskable"]]);
    expect(m.icons).toEqual(APP_ICONS);
  });
  it.each(APP_ICONS.map((i) => [i.src, i] as const))("%s が public にあり、PNG の大きさが sizes と同じ", (src, icon) => {
    const file = `public${src}`;
    expect(existsSync(file)).toBe(true);
    const img = decodePng(readFileSync(file));
    expect(`${img.width}x${img.height}`).toBe(icon.sizes);
    expect(icon.type).toBe("image/png");
  });
  it("iPhone のアイコンは src/app/apple-icon.png(180×180)", () => {
    const img = decodePng(readFileSync("src/app/apple-icon.png"));
    expect([img.width, img.height]).toEqual([180, 180]);
  });
});

describe("ショートカット", () => {
  it("今日の文字・仲間・マウス探しの順で、アイコンは書かない", () => {
    expect(APP_SHORTCUTS.map((s) => [s.name, s.url])).toEqual([["今日の文字", "/aim"], ["仲間", "/lobby"], ["マウス探し", "/mouse"]]);
    expect(m.shortcuts).toEqual(APP_SHORTCUTS);
    for (const s of APP_SHORTCUTS) expect("icons" in s).toBe(false);
  });
  it.each(APP_SHORTCUTS.map((s) => [s.url] as const))("%s は scope の中で、ページが実在する", (url) => {
    expect(url.startsWith(m.scope!)).toBe(true);
    expect(existsSync(PAGE_FILE[url])).toBe(true);
  });
});

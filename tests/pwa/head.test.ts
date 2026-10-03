import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { BRAND } from "@/lib/brand";
import { APPLE_WEB_APP, SITE_VIEWPORT } from "@/lib/pwa/head";
import { appManifest } from "@/lib/pwa/manifest-data";

describe("head の値(設計書 2-2)", () => {
  it("上のバーの色は BRAND・manifest と同じ(ずれると途中で色が変わる)", () => {
    expect(SITE_VIEWPORT.themeColor).toBe(BRAND.colors.bg);
    expect(appManifest().theme_color).toBe(SITE_VIEWPORT.themeColor);
  });
  it("viewport-fit=cover と、今までの colorScheme", () => {
    expect(SITE_VIEWPORT).toMatchObject({ viewportFit: "cover", colorScheme: "dark" });
  });
  it("iPhone のアプリ表示:capable・名前・上のバーは black", () => {
    expect(APPLE_WEB_APP).toEqual({ capable: true, title: BRAND.name, statusBarStyle: "black" });
  });
});

describe("layout.tsx がつないでいる", () => {
  const src = readFileSync("src/app/layout.tsx", "utf8");
  it("viewport と appleWebApp は head.ts の値を使い、直書きの themeColor が残っていない", () => {
    expect(src).toMatch(/export const viewport: Viewport = SITE_VIEWPORT;/);
    expect(src).toMatch(/appleWebApp: APPLE_WEB_APP/);
    expect(src).not.toMatch(/themeColor:\s*"/);
    expect(src).not.toMatch(/manifest:/);
  });
  it("<SwRegister /> を置いている", () => {
    expect(src).toContain("<SwRegister />");
  });
  it("SwRegister は client 部品", () => {
    expect(readFileSync("src/components/pwa/SwRegister.tsx", "utf8").startsWith('"use client";')).toBe(true);
  });
});

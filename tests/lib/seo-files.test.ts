import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { ALL_TYPE_CODES } from "@/data/types";
import { dexParams, publishedGames } from "@/lib/char-dex";
import { getSiteUrl } from "@/lib/site-url";

const site = getSiteUrl();
const paths = () => sitemap().map((e) => e.url.slice(site.length) || "/");

describe("sitemap.xml", () => {
  it("トップ・診断・16 タイプ・図鑑の目次・公開しているゲームの一覧と代表キャラが入る", () => {
    const p = paths();
    for (const x of ["/", "/diagnosis", "/types", "/games"]) expect(p).toContain(x);
    for (const c of ALL_TYPE_CODES) expect(p).toContain(`/type/${c}`);
    for (const g of publishedGames()) expect(p).toContain(`/games/${g.id}/chars`);
    for (const d of dexParams()) expect(p).toContain(`/games/${d.game}/chars/${d.char}`);
  });
  it("名刺・ログイン・API・開発用・公開していないゲーム・予備を入れない", () => {
    for (const x of paths()) {
      expect(x).not.toMatch(/^\/(c|auth|api|dev|my|lobby)(\/|$)/);
      expect(x).not.toMatch(/^\/games\/sf6\//);
      expect(x).not.toContain("/reyna");
    }
  });
  it("URL はサイトの絶対 URL で、重ならない", () => {
    const urls = sitemap().map((e) => e.url);
    for (const u of urls) expect(u.startsWith(site)).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("robots.txt", () => {
  it("開発用・名刺・ログイン・API を止め(個人・ログインの /my/ /lobby/ も)、sitemap の場所を書く", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/dev/", "/c/", "/auth/", "/api/", "/my/", "/lobby/"] });
    expect(r.sitemap).toBe(`${site}/sitemap.xml`);
  });
});

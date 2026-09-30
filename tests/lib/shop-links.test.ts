import { describe, it, expect } from "vitest";
import { shopLinks } from "@/lib/shop-links";

const OFFICIAL = "https://gaming.logicool.co.jp/ja-jp/products/gaming-mice/pro-x2-superlight-wireless-mouse.html";

describe("shopLinks", () => {
  it("builds plain search links without affiliate settings", () => {
    const l = shopLinks("Logicool G PRO X SUPERLIGHT 2", OFFICIAL, {});
    expect(l.official).toBe(OFFICIAL);
    const a = new URL(l.amazon);
    expect(a.origin + a.pathname).toBe("https://www.amazon.co.jp/s");
    expect(a.searchParams.get("k")).toBe("Logicool G PRO X SUPERLIGHT 2");
    expect(a.searchParams.has("tag")).toBe(false);
    expect(l.rakuten).toBe("https://search.rakuten.co.jp/search/mall/Logicool%20G%20PRO%20X%20SUPERLIGHT%202/");
    expect(l.amazonPr).toBe(false);
    expect(l.rakutenPr).toBe(false);
  });
  it("adds the Amazon tag and wraps Rakuten when configured", () => {
    const l = shopLinks("Razer Viper V3 Pro", OFFICIAL, { amazonTag: "robilab-22", rakutenId: "1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b" });
    expect(new URL(l.amazon).searchParams.get("tag")).toBe("robilab-22");
    const r = new URL(l.rakuten);
    expect(r.origin + r.pathname).toBe("https://hb.afl.rakuten.co.jp/hgc/1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b/");
    expect(r.searchParams.get("pc")).toBe("https://search.rakuten.co.jp/search/mall/Razer%20Viper%20V3%20Pro/");
    expect(l.amazonPr).toBe(true);
    expect(l.rakutenPr).toBe(true);
  });
  it("treats malformed settings as unset", () => {
    const l = shopLinks("X", OFFICIAL, { amazonTag: " bad tag ", rakutenId: "../evil" });
    expect(new URL(l.amazon).searchParams.has("tag")).toBe(false);
    expect(l.rakuten.startsWith("https://search.rakuten.co.jp/")).toBe(true);
    expect(l.amazonPr).toBe(false);
    expect(l.rakutenPr).toBe(false);
  });
  it("encodes symbols in the query", () => {
    const l = shopLinks("A&B/C #1", OFFICIAL, {});
    expect(new URL(l.amazon).searchParams.get("k")).toBe("A&B/C #1");
    expect(l.rakuten).toBe("https://search.rakuten.co.jp/search/mall/A%26B%2FC%20%231/");
  });
});

describe("shopLinks with a Rakuten item page", () => {
  const ITEM = "https://item.rakuten.co.jp/example-shop/mouse-001/";
  it("links to the item page without affiliate settings", () => {
    const l = shopLinks("Razer Viper V3 Pro", OFFICIAL, {}, ITEM);
    expect(l.rakuten).toBe(ITEM);
    expect(l.rakutenIsItem).toBe(true);
    expect(l.rakutenPr).toBe(false);
  });
  it("wraps the item page with the affiliate id", () => {
    const l = shopLinks("Razer Viper V3 Pro", OFFICIAL, { rakutenId: "1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b" }, ITEM);
    const r = new URL(l.rakuten);
    expect(r.origin + r.pathname).toBe("https://hb.afl.rakuten.co.jp/hgc/1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b/");
    expect(r.searchParams.get("pc")).toBe(ITEM);
    expect(l.rakutenIsItem).toBe(true);
    expect(l.rakutenPr).toBe(true);
  });
  it("keeps the search link when there is no item page", () => {
    const plain = shopLinks("Razer Viper V3 Pro", OFFICIAL, {});
    expect(plain.rakutenIsItem).toBe(false);
    expect(plain.rakuten).toBe("https://search.rakuten.co.jp/search/mall/Razer%20Viper%20V3%20Pro/");
    const wrapped = shopLinks("Razer Viper V3 Pro", OFFICIAL, { rakutenId: "1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b" });
    expect(wrapped.rakutenIsItem).toBe(false);
    expect(new URL(wrapped.rakuten).searchParams.get("pc")).toBe("https://search.rakuten.co.jp/search/mall/Razer%20Viper%20V3%20Pro/");
  });
  it("ignores item URLs that are not https Rakuten item pages", () => {
    for (const bad of ["http://item.rakuten.co.jp/a/b/", "https://evil.example/a/", "javascript:alert(1)", "not a url"]) {
      const l = shopLinks("X", OFFICIAL, {}, bad);
      expect(l.rakutenIsItem, bad).toBe(false);
      expect(l.rakuten.startsWith("https://search.rakuten.co.jp/"), bad).toBe(true);
    }
  });
});

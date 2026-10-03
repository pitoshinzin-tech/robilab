import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { shopLinks } from "@/lib/shop-links";
import { TopMouseRow } from "@/components/mouse/TopMouseRow";

describe("TopMouseRow の店のボタン", () => {
  const item = { score: 90, mouse: { id: "m", lengthMm: 120, widthMm: 63, heightMm: 40, weightG: 60 } } as unknown as Parameters<typeof TopMouseRow>[0]["item"];
  const html = renderToStaticMarkup(createElement("ul", null, createElement(TopMouseRow, {
    rank: 1, item, brand: "B", name: "N", reason: "r", links: shopLinks("B N", "https://example.com/", {}), overlaid: false, onOverlay: () => {},
  })));
  it("375 では ShopButtons の横並び(折り返し)。縦に並べるのは md 以上だけ", () => {
    const m = html.match(/<div class="(flex flex-wrap items-center gap-2[^"]*)"/);
    expect(m).not.toBeNull();
    expect(m![1].split(" ")).not.toContain("flex-col");
    expect(m![1]).toContain("md:flex-col");
  });
});

describe("TopMouseRow の合う度", () => {
  const item = { score: 100, mouse: { id: "m", lengthMm: 120, widthMm: 63, heightMm: 40, weightG: 60 } } as unknown as Parameters<typeof TopMouseRow>[0]["item"];
  const html = renderToStaticMarkup(createElement("ul", null, createElement(TopMouseRow, {
    rank: 1, item, brand: "B", name: "N", reason: "r", links: shopLinks("B N", "https://example.com/", {}), overlaid: false, onOverlay: () => {},
  })));
  it("小さな「合う度 100」は本文の書体の太字・マゼンタ(Orbitron の小さな 0 は箱の記号に見えるため)", () => {
    const m = html.match(/<span class="([^"]*)">100</);
    expect(m).not.toBeNull();
    expect(m![1]).not.toContain("font-display");
    expect(m![1]).toContain("font-bold");
    expect(m![1]).toContain("text-rl-highlight");
  });
});

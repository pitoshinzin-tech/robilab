import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MouseCard } from "@/components/mouse/MouseCard";
import { shopLinks } from "@/lib/shop-links";

const mouse = { id: "x", lengthMm: 120, widthMm: 61, heightMm: 40, weightG: null, shape: "right" as const, connection: "wireless" as const };
const render = (skateHref: string | null) =>
  renderToStaticMarkup(createElement("ol", null, createElement(MouseCard, {
    rank: 2, item: { mouse, score: 90 } as never, brand: "B", name: "N", reason: "r", compare: null,
    links: shopLinks("B N", "https://example.com/", {}), skateHref,
  })));

describe("MouseCard", () => {
  const html = render("/skates?mouse=x");
  it("長さ・幅・高さの数字はマゼンタの display、重さがなければ「公式の記載なし」を本文の色で", () => {
    for (const n of [120, 61, 40]) expect(html).toContain(`<span class="font-bold tabular-nums text-rl-highlight">${n}</span>`);
    expect(html).toMatch(/<dd class="text-rl-text">公式の記載なし<\/dd>/);
    expect(html).toMatch(/<dd class="text-rl-text">右手用<\/dd>/);
  });
  it("「このマウスのソール」は店のリンクと同じ並び(1 つの flex-wrap の中)で、左に余白を持たない", () => {
    const row = html.match(/<div class="flex flex-wrap items-center gap-2[^"]*">([^]*?)<\/div>/)?.[1] ?? "";
    expect(row).toContain("公式ページ");
    expect(row).toContain("このマウスのソール");
    expect(html).toMatch(/px-0[^"]*"[^>]*href="\/skates\?mouse=x"|href="\/skates\?mouse=x"[^>]*class="[^"]*px-0/);
  });
  it("ソールがなければ出さない", () => {
    expect(render(null)).not.toContain("このマウスのソール");
  });
});

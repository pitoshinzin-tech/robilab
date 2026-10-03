import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { extractQuotes, officialTerm, toPadSpecs, toSkateSpecs, toMouseSpecs } from "../../scripts/gear-data";
import { PADS } from "@/data/pads";
import { SKATES } from "@/data/skates";
import { visiblePads } from "@/lib/pad-filter";
import { shopLinks } from "@/lib/shop-links";
import { PadRow } from "@/components/gear/PadRow";
import { SkateRow } from "@/components/gear/SkateRow";

const json = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("extractQuotes(「…」の中身=原文だけ)", () => {
  it("かぎ括弧の中身を順に取り出し、外の説明は捨てる", () => {
    expect(extractQuotes("「適度な表面摩擦」「高DPI」(公式の表現)。")).toEqual(["適度な表面摩擦", "高DPI"]);
    expect(extractQuotes("公式セレクションガイドの分類「ロースピード」。製品ページ: タイプ「止め重視」。")).toEqual(["ロースピード", "止め重視"]);
  });
  it("かぎ括弧がない・null・空の括弧は空の配列", () => {
    expect(extractQuotes(null)).toEqual([]);
    expect(extractQuotes("数値スケールの記載なし")).toEqual([]);
    expect(extractQuotes("「」「  」")).toEqual([]);
  });
});

describe("officialTerm(硬さ・付属の 1 項目)", () => {
  it("かぎ括弧があれば中身だけ、なければ「(公式…)」の注記だけ外す", () => {
    expect(officialTerm("Center-Ring(センサー周りのリング)入り — 公式「kompletten Sets – inklusive Center-Ring」")).toEqual(["kompletten Sets – inklusive Center-Ring"]);
    expect(officialTerm("ソフト程度(公式の硬度表記)")).toEqual(["ソフト程度"]);
    expect(officialTerm("XSOFT")).toEqual(["XSOFT"]);
    expect(officialTerm("ソフト程度 (公式の硬度表記)")).toEqual(["ソフト程度"]);
    expect(officialTerm("ソフト程度（公式の硬度表記）")).toEqual(["ソフト程度"]);
    expect(officialTerm("cleaning wipes(included cleaning wipes)")).toEqual(["cleaning wipes(included cleaning wipes)"]);
  });
});

describe("生成物に作業者の注記が入らない", () => {
  const rawPads = json("docs/content/gear/pads.json");
  it("PADS は speedOfficial を持たず、speedQuotes は JSON の「…」と一致する", () => {
    for (const r of rawPads.pads as { id: string; speedOfficial: string | null }[]) {
      const p = PADS.find((x) => x.id === r.id)!;
      expect("speedOfficial" in p, r.id).toBe(false);
      expect(p.speedQuotes, r.id).toEqual(extractQuotes(r.speedOfficial));
    }
    expect(toPadSpecs(rawPads).some((p) => p.speedQuotes.length > 1)).toBe(true);
  });
  it("硬さ・付属に「(公式の硬度表記)」「センサー周りのリング」が残らない", () => {
    expect(PADS.flatMap((p) => p.firmnessVariants).join("|")).not.toMatch(/公式の硬度表記/);
    expect(SKATES.flatMap((s) => s.extras).join("|")).not.toMatch(/センサー周りのリング/);
  });
});

describe("画面に作業者の注記が出ない(本物の全データ)", () => {
  const NOTES = /公式の表現|原文|記号の数|スケールの記載なし|null|公式の硬度表記|センサー周りのリング|公式セレクションガイド|製品ページ:/;
  const padHtml = (pad: ReturnType<typeof visiblePads>[number]) =>
    renderToStaticMarkup(createElement("ul", null, createElement(PadRow, { pad, sizes: pad.sizes, narrowed: false, primary: false, links: shopLinks(`${pad.brand} ${pad.name}`, pad.officialUrl, {}) })));
  it("パッドの行:引用は「…」の中身だけで、注記・元の文が出ない", () => {
    const raw = new Map((json("docs/content/gear/pads.json").pads as { id: string; speedOfficial: string | null }[]).map((r) => [r.id, r.speedOfficial]));
    for (const pad of visiblePads(PADS)) {
      const html = padHtml(pad);
      expect(html, pad.id).not.toMatch(NOTES);
      for (const q of pad.speedQuotes) expect(html, pad.id).toContain(esc(q));
      const original = raw.get(pad.id);
      if (original && pad.speedQuotes.length > 0 && original !== pad.speedQuotes[0]) expect(html, pad.id).not.toContain(esc(original));
      if (pad.speedQuotes.length === 0) expect(html, pad.id).not.toContain("<blockquote");
    }
  });
  it("ソールの行:付属に注記が出ない", () => {
    for (const skate of SKATES) {
      const html = renderToStaticMarkup(createElement("ul", null, createElement(SkateRow, { skate, primary: false, links: shopLinks(`${skate.brand} ${skate.name}`, skate.officialUrl, {}) })));
      expect(html, skate.id).not.toMatch(NOTES);
    }
  });
});

describe("公式 URL は https だけ(生成時に止める)", () => {
  const pads = json("docs/content/gear/pads.json");
  const skates = json("docs/content/gear/skates.json");
  const mice = json("docs/content/gear/mice.json");
  const bad = ["http://example.com/x", "javascript:alert(1)", "//example.com/x", "data:text/html,x"];
  it.each(bad)("マウス・パッド・ソールの officialUrl が %s なら throw", (url) => {
    expect(() => toMouseSpecs(mice.map((m: object, i: number) => (i === 0 ? { ...m, officialUrl: url } : m)))).toThrow(/https/);
    const withPad = pads.pads.findIndex((p: { officialUrl: string | null }) => p.officialUrl !== null);
    expect(() => toPadSpecs({ pads: pads.pads.map((p: object, i: number) => (i === withPad ? { ...p, officialUrl: url } : p)) })).toThrow(/https/);
    expect(() => toSkateSpecs({ items: skates.items.map((s: object, i: number) => (i === 0 ? { ...s, officialUrl: url } : s)) })).toThrow(/https/);
  });
  it("パッドの officialUrl が null なのはよい", () => {
    expect(() => toPadSpecs(pads)).not.toThrow();
  });
});

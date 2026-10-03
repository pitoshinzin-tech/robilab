import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PADS } from "@/data/pads";
import type { PadSize } from "@/data/gear-types";
import { visiblePads } from "@/lib/pad-filter";
import { PAD_LINK_SLOTS, padOutlineIndexer, padScale } from "@/lib/pad-scale";
import { shopLinks } from "@/lib/shop-links";
import { PadRow } from "@/components/gear/PadRow";
import { PadScale } from "@/components/gear/PadScale";

const s = (label: string, widthMm: number | null, depthMm: number | null, thicknessMm: number | null = 4): PadSize => ({ label, widthMm, depthMm, thicknessMm });
const css = readFileSync("src/app/globals.css", "utf8");
const pads = visiblePads(PADS);

describe("padOutlineIndexer(表の行 → 図の外形の番号)", () => {
  it("padScale の外形の並び(大きい順)と同じ番号。同じ大きさ(硬さ違い)は同じ番号、数字がないサイズは null", () => {
    const sizes = [s("M", 360, 300), s("XL", 900, 400), s("M 硬め", 360, 300), s("L", 450, null)];
    const at = padOutlineIndexer(sizes);
    const g = padScale(sizes, null)!;
    expect(g.outlines.map((o) => o.label)).toEqual(["XL", "M・M 硬め"]);
    expect(sizes.map(at)).toEqual([1, 0, 1, null]);
  });
  it("本物のデータ:どのパッドも、行の番号が指す外形はその行と同じ幅×奥行き", () => {
    for (const p of pads) {
      const g = padScale(p.sizes, null);
      const at = padOutlineIndexer(p.sizes);
      for (const size of p.sizes) {
        const i = at(size);
        if (i === null) continue;
        expect([g!.outlines[i].widthMm, g!.outlines[i].depthMm], `${p.id} ${size.label}`).toEqual([size.widthMm, size.depthMm]);
      }
    }
  });
});

describe("行と外形をつなぐ CSS(globals.css)", () => {
  it("データのいちばん多い外形の数まで、番号ごとの決まりがある(PAD_LINK_SLOTS 以内)", () => {
    const max = Math.max(...PADS.map((p) => padScale(p.sizes, null)?.outlines.length ?? 0));
    expect(max).toBeLessThanOrEqual(PAD_LINK_SLOTS);
    for (let i = 0; i < PAD_LINK_SLOTS; i++) {
      expect(css, `番号 ${i}`).toContain(`[data-size-i="${i}"]:hover`);
      expect(css, `番号 ${i}`).toContain(`[data-outline-i="${i}"]:hover`);
    }
  });
  it("乗せたときだけ(hover: hover)・reduced-motion では即時", () => {
    const block = css.slice(css.indexOf(".rl-size-link"));
    expect(block).toContain("@media (hover: hover)");
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\.rl-size-link/);
  });
});

describe("PadRow・PadScale の番号", () => {
  const multi = pads.find((p) => (padScale(p.sizes, null)?.outlines.length ?? 0) >= 3)!;
  const row = renderToStaticMarkup(createElement("ul", null, createElement(PadRow, { pad: multi, sizes: multi.sizes, narrowed: false, primary: false, links: shopLinks(multi.name, multi.officialUrl, {}) })));
  it("行(li)に rl-size-link、表の行に data-size-i、外形に data-outline-i(同じ番号)", () => {
    expect(row).toContain("rl-size-link");
    const n = padScale(multi.sizes, null)!.outlines.length;
    for (let i = 0; i < n; i++) {
      expect(row).toMatch(new RegExp(`<tr[^>]*data-size-i="${i}"`));
      expect(row).toMatch(new RegExp(`<rect[^>]*data-outline-i="${i}"`));
    }
  });
  it("表の行はフォーカスの順に入れない(tabindex を付けない)", () => {
    expect(row).not.toMatch(/<tr[^>]*tabindex/);
  });
  it("札にも同じ番号、マウスの面には付けない", () => {
    const html = renderToStaticMarkup(createElement(PadScale, { sizes: [s("S", 250, 210), s("XL", 900, 400)], matched: null }));
    expect(html).toMatch(/<span[^>]*data-outline-i="0"[^>]*>XL</);
    expect(html.match(/data-outline-i=/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/<rect[^>]*rx=[^>]*data-outline-i/);
  });
});

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { THICKNESS_SCALE, thicknessScale } from "@/lib/skate-thickness";
import { ThicknessScale } from "@/components/gear/ThicknessScale";

describe("thicknessScale(厚さの目盛り)", () => {
  it("0〜1.5mm を 120px に。目盛りは 0.5mm ごとの 4 本", () => {
    expect(THICKNESS_SCALE.widthPx).toBe(120);
    const g = thicknessScale(0.8)!;
    expect(g.ticks.map((t) => t.mm)).toEqual([0, 0.5, 1, 1.5]);
    expect(g.ticks.map((t) => t.x - g.ticks[0].x)).toEqual([0, 40, 80, 120]);
  });
  it("印の位置は厚さに比例する(同じ物差し)", () => {
    const at = (mm: number) => { const g = thicknessScale(mm)!; return g.markX - g.ticks[0].x; };
    expect(at(0.5)).toBe(40);
    expect(at(0.8)).toBeCloseTo(64);
    expect(at(1)).toBe(80);
    expect(at(0.85)).toBeCloseTo(68);
    expect(at(1.5)).toBe(120);
  });
  it("公式に 1 つの数字がないとき(null)・物差しの外のときは目盛りを出さない", () => {
    expect(thicknessScale(null)).toBeNull();
    expect(thicknessScale(0)).toBeNull();
    expect(thicknessScale(-1)).toBeNull();
    expect(thicknessScale(1.6)).toBeNull();
    expect(thicknessScale(Number.NaN)).toBeNull();
  });
  it("部品:数字があるときだけ SVG(role=img、aria-label に厚さ)。null なら何も出さない", () => {
    const html = renderToStaticMarkup(createElement(ThicknessScale, { mm: 0.8 }));
    expect(html).toContain('role="img"');
    expect(html).toContain("0.8mm");
    expect(html).toContain("<svg");
    expect(renderToStaticMarkup(createElement(ThicknessScale, { mm: null }))).toBe("");
  });
});

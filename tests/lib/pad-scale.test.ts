import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PADS } from "@/data/pads";
import type { PadSize } from "@/data/gear-types";
import { visiblePads } from "@/lib/pad-filter";
import { AVG_MOUSE, padScale, padScaleLabel, SCALE_FRAME } from "@/lib/pad-scale";
import { PadScale } from "@/components/gear/PadScale";

const s = (label: string, widthMm: number | null, depthMm: number | null, thicknessMm: number | null = 4): PadSize => ({ label, widthMm, depthMm, thicknessMm });

describe("padScale(描く・描かない)", () => {
  it("幅と奥行きがそろうサイズが 1 つもなければ null(図を出さない)", () => {
    expect(padScale([], null)).toBeNull();
    expect(padScale([s("M", null, 280), s("L", 450, null), s("XL", null, null)], null)).toBeNull();
  });
  it("幅か奥行きが null のサイズは描かない(作った数字を出さない)", () => {
    const g = padScale([s("標準", 340, 280), s("大", 450, null)], null)!;
    expect(g.outlines.map((o) => o.label)).toEqual(["標準"]);
  });
  it("同じ大きさのサイズは 1 本の線にまとめ、名前を「・」でつなぐ", () => {
    const g = padScale([s("SOFT XL", 490, 420), s("MID XL", 490, 420), s("L", 420, 330)], null)!;
    expect(g.outlines.map((o) => o.label)).toEqual(["SOFT XL・MID XL", "L"]);
  });
});

describe("padScale(縮尺)", () => {
  it("一番大きいサイズが枠に収まる縮尺(1mm あたりの px)を、枠の幅と高さの小さい方で決める", () => {
    const wide = padScale([s("XXL", 1600, 800)], null)!;
    expect(wide.pxPerMm).toBeCloseTo(Math.min(SCALE_FRAME.maxWidthPx / 1600, SCALE_FRAME.heightPx / 800));
    const square = padScale([s("標準", 340, 280)], null)!;
    expect(square.pxPerMm).toBeCloseTo(Math.min(SCALE_FRAME.maxWidthPx / 340, SCALE_FRAME.heightPx / 280));
  });
  it("同じパッドの中のサイズとマウスは同じ縮尺(viewBox は mm、左下をそろえる)", () => {
    const g = padScale([s("L", 450, 400), s("M", 320, 270)], null)!;
    expect(g.viewBox).toBe("0 0 450 400");
    const m = g.outlines.find((o) => o.label === "M")!;
    expect([m.x, m.y + m.height]).toEqual([0, 400]);
    expect([m.width, m.height]).toEqual([320, 270]);
    expect([g.mouse.width, g.mouse.height]).toEqual([AVG_MOUSE.widthMm, AVG_MOUSE.lengthMm]);
    // マウスは一番小さいサイズの真ん中
    expect(g.mouse.x + g.mouse.width / 2).toBe(160);
    expect(g.mouse.y + g.mouse.height / 2).toBe(400 - 135);
  });
  it("大きい順に並べ、名前の場所が重ならないように下へずらす", () => {
    const g = padScale([s("A", 500, 490), s("B", 495, 488)], null)!;
    const [a, b] = g.outlines;
    expect(a.label).toBe("A");
    expect(b.labelTopMm - a.labelTopMm).toBeGreaterThanOrEqual(SCALE_FRAME.labelLinePx / g.pxPerMmMin - 0.001);
  });
  it("巨大なサイズでマウスが小さくなるときは tinyMouse", () => {
    expect(padScale([s("XXL", 1600, 800)], null)!.tinyMouse).toBe(true);
    expect(padScale([s("標準", 340, 280)], null)!.tinyMouse).toBe(false);
  });
});

describe("padScale(絞り込みに合うサイズ)", () => {
  it("絞り込み中は合うサイズの線だけ matched", () => {
    const sizes = [s("XL", 490, 420), s("L", 420, 330)];
    const g = padScale(sizes, [sizes[1]])!;
    expect(g.outlines.map((o) => [o.label, o.matched])).toEqual([["XL", false], ["L", true]]);
    expect(padScale(sizes, null)!.outlines.every((o) => !o.matched)).toBe(true);
  });
});

describe("padScaleLabel", () => {
  it("サイズの名前と寸法、平均的なマウス、同じ縮尺を言葉で書く", () => {
    const g = padScale([s("標準", 340, 280)], null)!;
    expect(padScaleLabel(g)).toBe("標準 340×280mm の上に、平均的なマウス 120×63mm を同じ縮尺で置いた図");
  });
  it("絞り込み中は合うサイズを添える", () => {
    const sizes = [s("XL", 490, 420), s("L", 420, 330)];
    expect(padScaleLabel(padScale(sizes, [sizes[0]])!)).toContain("(絞り込みに合うサイズ:XL)");
  });
});

describe("PadScale(部品)", () => {
  it("role=img と aria-label を持ち、aria-hidden にしない", () => {
    const html = renderToStaticMarkup(createElement(PadScale, { sizes: [s("標準", 340, 280)], matched: null }));
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="標準 340×280mm の上に、平均的なマウス 120×63mm を同じ縮尺で置いた図"');
    expect(html).toContain("var(--rl-line-strong)");
    expect(html).toContain("var(--rl-selected-bg)");
    expect(html).not.toContain("var(--rl-selected)");
  });
  it("絞り込み中は合う線だけ --rl-selected、ほかは --rl-line", () => {
    const sizes = [s("XL", 490, 420), s("L", 420, 330)];
    const html = renderToStaticMarkup(createElement(PadScale, { sizes, matched: [sizes[1]] }));
    expect(html.match(/stroke="var\(--rl-selected\)"/g)).toHaveLength(1);
    expect(html.match(/stroke="var\(--rl-line\)"/g)).toHaveLength(1);
  });
  it("描けるサイズがなければ何も出さない", () => {
    expect(renderToStaticMarkup(createElement(PadScale, { sizes: [s("M", null, 280)], matched: null }))).toBe("");
  });
  it("本物の全パッドで null・NaN・undefined を出さない", () => {
    for (const p of visiblePads(PADS)) {
      const html = renderToStaticMarkup(createElement(PadScale, { sizes: p.sizes, matched: null }));
      expect(html).not.toMatch(/null|NaN|undefined|Infinity/);
    }
  });
});

describe("padScale(マウスの置き場所)", () => {
  it("一番小さいサイズの名前と重なるときは、左下の角に寄せる(パッドの上からはみ出さない)", () => {
    const g = padScale([s("5XL", 1600, 800), s("Small", 250, 210)], null)!;
    const small = g.outlines.find((o) => o.label === "Small")!;
    expect(g.mouse.x).toBeGreaterThanOrEqual(0);
    expect(g.mouse.x + g.mouse.width).toBeLessThanOrEqual(small.width);
    expect(g.mouse.y + g.mouse.height).toBeLessThanOrEqual(800);
    expect(g.mouse.y).toBeGreaterThanOrEqual(small.y);
    expect(g.mouse.y).toBeGreaterThan(small.labelTopMm);
  });
});

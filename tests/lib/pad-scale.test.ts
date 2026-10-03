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
  it("一番小さいサイズの名前がマウスと重なるときは、マウスを左下の角に寄せる(パッドの上からはみ出さない)", () => {
    const g = padScale([s("L", 450, 400), s("Med", 200, 170)], null)!;
    const med = g.outlines.find((o) => o.label === "Med")!;
    expect(med.labelShown).toBe(true);
    expect(g.mouse.x).toBeGreaterThanOrEqual(0);
    expect(g.mouse.x + g.mouse.width).toBeLessThanOrEqual(med.width);
    expect(g.mouse.y + g.mouse.height).toBeLessThanOrEqual(400);
    expect(g.mouse.y).toBeGreaterThanOrEqual(med.y);
    expect(overlaps(labelBox(g, med), g.mouse)).toBe(false);
  });
  it("角に寄せても重なるときは、名前を描かずマウスを真ん中のまま(面を隠さない)", () => {
    const g = padScale([s("L", 450, 400), s("Small", 200, 170)], null)!;
    const small = g.outlines.find((o) => o.label === "Small")!;
    expect(small.labelShown).toBe(false);
    expect(g.mouse.x + g.mouse.width / 2).toBe(100);
    expect(g.hiddenLabels).toEqual(["Small"]);
  });
});

type Box = { x: number; y: number; width: number; height: number };
const labelBox = (g: NonNullable<ReturnType<typeof padScale>>, o: (typeof g.outlines)[number]): Box => ({
  x: o.labelLeftMm, y: o.labelTopMm, width: o.width - LABEL_INSET_MM(g) - o.labelLeftMm, height: SCALE_FRAME.labelLinePx / g.pxPerMmMin,
});
const LABEL_INSET_MM = (g: NonNullable<ReturnType<typeof padScale>>) => g.widthMm - g.outlines[0].labelRightMm;
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("padScale(名前の札が重ならない・マウスの面を隠さない)", () => {
  it("375 の枠で外形に入らない小さいサイズの名前は描かず、hiddenLabels に小さい順で残す(QcK)", () => {
    const qck = visiblePads(PADS).find((p) => p.id === "steelseries-qck")!;
    const g = padScale(qck.sizes, null)!;
    const shown = g.outlines.filter((o) => o.labelShown).map((o) => o.label);
    expect(shown).toEqual(expect.arrayContaining(["5XL", "4XL", "3XL", "XXL", "Large"]));
    expect(shown).not.toContain("Small");
    expect(shown).not.toContain("Medium");
    expect(g.hiddenLabels).toEqual(["Small", "Medium"]);
  });
  it("本物の全パッドで、描く名前どうしが重ならず、マウスの面とも重ならず、自分の外形の中に収まる", () => {
    for (const p of visiblePads(PADS)) {
      const g = padScale(p.sizes, null);
      if (g === null) continue;
      const shown = g.outlines.filter((o) => o.labelShown);
      for (const [i, a] of shown.entries()) {
        const box = labelBox(g, a);
        expect(overlaps(box, g.mouse), `${p.name} ${a.label} とマウス`).toBe(false);
        expect(box.x, `${p.name} ${a.label} が外形の左にはみ出す`).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height, `${p.name} ${a.label} が下にはみ出す`).toBeLessThanOrEqual(g.depthMm + 0.001);
        for (const b of shown.slice(i + 1)) expect(overlaps(box, labelBox(g, b)), `${p.name} ${a.label} と ${b.label}`).toBe(false);
      }
      expect(g.hiddenLabels).toEqual(g.outlines.filter((o) => !o.labelShown).map((o) => o.label).reverse());
    }
  });
});

describe("PadScale(省いた名前・図の説明)", () => {
  it("描かない名前は札にせず、図の下に「左下の小さい線」としてまとめる", () => {
    const qck = visiblePads(PADS).find((p) => p.id === "steelseries-qck")!;
    const html = renderToStaticMarkup(createElement(PadScale, { sizes: qck.sizes, matched: null }));
    expect(html).toContain("左下の小さい線:Small・Medium");
    expect(html).not.toMatch(/>Small<\/span>/);
    expect(html).toMatch(/>5XL<\/span>/);
  });
  it("省く名前がなければ、まとめの行は出さない", () => {
    const html = renderToStaticMarkup(createElement(PadScale, { sizes: [s("標準", 340, 280)], matched: null }));
    expect(html).not.toContain("左下の小さい線");
  });
  it("showCaption=false のときは図の説明を sr-only(読み上げには残す)", () => {
    const shown = renderToStaticMarkup(createElement(PadScale, { sizes: [s("標準", 340, 280)], matched: null }));
    const hidden = renderToStaticMarkup(createElement(PadScale, { sizes: [s("標準", 340, 280)], matched: null, showCaption: false }));
    expect(shown).toMatch(/<figcaption class="(?![^"]*sr-only)[^"]*">線は公式のサイズ/);
    expect(hidden).toMatch(/<figcaption class="sr-only">線は公式のサイズ/);
  });
});

import { describe, it, expect } from "vitest";
import type { PadSize, PadSpec } from "@/data/gear-types";
import { PADS } from "@/data/pads";
import {
  NO_PAD_FILTER, filterPads, isPadFilterEmpty, padFilterHref, parsePadFilter, sizeClass, thicknessClass, visiblePads, type VisiblePad, padFilterCount, padCountCaption,
} from "@/lib/pad-filter";
import { padSizeText, surfaceLabel, withUnit } from "@/lib/gear-labels";

const size = (label: string, w: number | null, d: number | null, t: number | null): PadSize => ({ label, widthMm: w, depthMm: d, thicknessMm: t });
const pad = (id: string, extra: Partial<PadSpec> = {}): VisiblePad => ({
  id, brand: "B", name: id, surface: "cloth", speedQuotes: [], firmnessVariants: [], sizes: [size("L", 450, 400, 4)], base: null, stitchedEdge: null,
  officialUrl: `https://example.com/${id}`, checkedAt: "2026-10-03", selectionBasis: "", note: "", hidden: false, discontinued: false, ...extra,
} as VisiblePad);

describe("sizeClass(公式の横幅で分ける)", () => {
  it.each([[240, "S"], [299, "S"], [300, "M"], [399, "M"], [400, "L"], [479, "L"], [480, "XL"], [599, "XL"], [600, "XXL"], [1600, "XXL"]] as const)("%d → %s", (w, c) => {
    expect(sizeClass(w)).toBe(c);
  });
  it("null・0 以下は分けない", () => {
    expect(sizeClass(null)).toBeNull();
    expect(sizeClass(0)).toBeNull();
  });
  it("NaN・負の数も分けない", () => {
    expect(sizeClass(NaN)).toBeNull();
    expect(sizeClass(-5)).toBeNull();
  });
});

describe("thicknessClass", () => {
  it.each([[1, "thin"], [2.9, "thin"], [3, "normal"], [4.9, "normal"], [5, "thick"], [6, "thick"]] as const)("%d → %s", (mm, c) => {
    expect(thicknessClass(mm)).toBe(c);
  });
  it("公式の厚さがないものはどこにも入らない", () => {
    expect(thicknessClass(null)).toBeNull();
    expect(thicknessClass(0)).toBeNull();
    expect(thicknessClass(NaN)).toBeNull();
  });
});

describe("parsePadFilter / padFilterHref", () => {
  it("決まった値だけ読む。ほかは「すべて」", () => {
    expect(parsePadFilter({ surface: "glass", size: "XL", thickness: "thin", firmness: "variants" })).toEqual({ surface: "glass", size: "XL", thickness: "thin", firmness: "variants" });
    expect(parsePadFilter({ surface: "GLASS", size: "XS", thickness: ["thick", "thin"], firmness: "1" })).toEqual({ ...NO_PAD_FILTER, thickness: "thick" });
    expect(parsePadFilter({ surface: "other" })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({})).toEqual(NO_PAD_FILTER);
  });
  it("想定外の値(大文字違い・同じキー 2 つ・空・長い文字)で落ちず「すべて」になる", () => {
    expect(parsePadFilter({ surface: "GLASS" })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({ size: "XS" })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({ surface: ["bogus", "glass"] })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({ surface: "", size: "", thickness: "", firmness: "" })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({ surface: "x".repeat(10000), size: "y".repeat(10000) })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({ surface: [], size: undefined })).toEqual(NO_PAD_FILTER);
  });
  it("リンクは今の絞り込みに 1 つだけ変えたもの", () => {
    const f = { ...NO_PAD_FILTER, surface: "glass" as const };
    expect(padFilterHref(f, { size: "L" })).toBe("/pads?surface=glass&size=L");
    expect(padFilterHref(f, { surface: "all" })).toBe("/pads");
    expect(isPadFilterEmpty(NO_PAD_FILTER)).toBe(true);
    expect(isPadFilterEmpty(f)).toBe(false);
  });
});

describe("visiblePads / filterPads", () => {
  it("hidden と公式 URL のないものは出さない", () => {
    expect(visiblePads([pad("a"), pad("h", { hidden: true }), pad("n", { officialUrl: null })]).map((p) => p.id)).toEqual(["a"]);
  });
  it("面・硬さで絞る(面がないものは面の絞り込みで外れる。硬さは 2 種類以上で「選べる」)", () => {
    const pads = [pad("c"), pad("g", { surface: "glass" }), pad("n", { surface: null }), pad("f", { firmnessVariants: ["SOFT", "HARD"] }), pad("one", { firmnessVariants: ["ソフト程度"] })];
    expect(filterPads(pads, { ...NO_PAD_FILTER, surface: "glass" }).map((m) => m.pad.id)).toEqual(["g"]);
    expect(filterPads(pads, { ...NO_PAD_FILTER, firmness: "variants" }).map((m) => m.pad.id)).toEqual(["f"]);
    expect(filterPads(pads, NO_PAD_FILTER).map((m) => m.pad.id)).toEqual(["c", "g", "n", "f", "one"]);
  });
  it("大きさ・厚さで絞ると、合うサイズだけ残す。厚さのないサイズは厚さの絞り込みに入らない", () => {
    const p = pad("p", { sizes: [size("S", 240, 210, 4), size("XXL", 900, 400, null), size("L", 450, 400, 2)] });
    expect(filterPads([p], { ...NO_PAD_FILTER, size: "XXL" })[0].sizes.map((s) => s.label)).toEqual(["XXL"]);
    expect(filterPads([p], { ...NO_PAD_FILTER, thickness: "thin" })[0].sizes.map((s) => s.label)).toEqual(["L"]);
    expect(filterPads([p], { ...NO_PAD_FILTER, size: "XXL", thickness: "normal" })).toEqual([]);
    expect(filterPads([p], NO_PAD_FILTER)[0].sizes).toHaveLength(3);
  });
  it("空の一覧は空", () => {
    expect(filterPads([], NO_PAD_FILTER)).toEqual([]);
  });
});

describe("本物のデータ", () => {
  const visible = visiblePads(PADS);
  it("画面に出すのは 41 件", () => {
    expect(visible).toHaveLength(41);
  });
  it("どのチップを押しても 1 件以上ある(面・大きさ・厚さ・硬さ)", () => {
    for (const surface of ["cloth", "hybrid", "glass", "hard"] as const) expect(filterPads(visible, { ...NO_PAD_FILTER, surface }).length, surface).toBeGreaterThan(0);
    for (const s of ["S", "M", "L", "XL", "XXL"] as const) expect(filterPads(visible, { ...NO_PAD_FILTER, size: s }).length, s).toBeGreaterThan(0);
    for (const t of ["thin", "normal", "thick"] as const) expect(filterPads(visible, { ...NO_PAD_FILTER, thickness: t }).length, t).toBeGreaterThan(0);
    expect(filterPads(visible, { ...NO_PAD_FILTER, firmness: "variants" }).length).toBeGreaterThan(0);
  });
  it("表示の言葉に null・NaN・undefined が出ない", () => {
    for (const p of visible) {
      const text = [surfaceLabel(p.surface), ...p.sizes.map((s) => `${s.label} ${padSizeText(s.widthMm, s.depthMm)} ${withUnit(s.thicknessMm, "mm")}`)].join(" ");
      expect(text, p.id).not.toMatch(/null|NaN|undefined/);
    }
  });
});

describe("padFilterCount・padCountCaption(上の大きな数字の説明)", () => {
  it("すべてのときは 0、条件の数を数える", () => {
    expect(padFilterCount(NO_PAD_FILTER)).toBe(0);
    expect(padFilterCount({ ...NO_PAD_FILTER, surface: "glass", size: "XL" })).toBe(2);
  });
  it("絞り込みがないときは「公式の数字で比べられる数」、あるときは全体の数を添える", () => {
    expect(padCountCaption(NO_PAD_FILTER, 41)).toBe("公式の数字で比べられる数");
    expect(padCountCaption({ ...NO_PAD_FILTER, thickness: "thick" }, 41)).toBe("絞り込みに合う数(全 41 枚)");
  });
});

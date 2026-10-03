import { describe, it, expect } from "vitest";
import type { SkateSpec } from "@/data/gear-types";
import { SKATES } from "@/data/skates";
import {
  NO_SKATE_FILTER, filterSkates, groupByBrand, parseSkateFilter, skateCounts, skateFilterHref, skateView, skatesForMouse, universalSkates,
} from "@/lib/skate-match";
import { materialLabel, packText, skateThicknessText } from "@/lib/gear-labels";

const skate = (id: string, extra: Partial<SkateSpec> = {}): SkateSpec => ({
  id, brand: "B", line: "L", name: id, forMouse: "x", mouseIds: [], material: "PTFE", materialOfficial: null, shape: "full",
  thicknessMm: null, thicknessOfficial: null, piecesPerPack: null, setsPerPack: null, extras: [], officialUrl: `https://example.com/${id}`,
  checkedAt: "2026-10-03", selectionBasis: "", note: "", discontinued: false, ...extra,
});
const KNOWN = new Set(["m1", "m2"]);

describe("parseSkateFilter / skateFilterHref", () => {
  it("知っているマウスの id だけ読む。空・知らない id は選ばない", () => {
    expect(parseSkateFilter({ mouse: "m1", material: "glass", shape: "dot" }, KNOWN)).toEqual({ mouse: "m1", material: "glass", shape: "dot" });
    expect(parseSkateFilter({ mouse: "", material: "ceramic", shape: "other" }, KNOWN)).toEqual(NO_SKATE_FILTER);
    expect(parseSkateFilter({ mouse: "no-such", material: ["UPE", "PTFE"] }, KNOWN)).toEqual({ ...NO_SKATE_FILTER, material: "UPE" });
  });
  it("想定外の値(?mouse=no-such-mouse・同じキー 2 つ・大文字違い・とても長い文字)で落ちない", () => {
    expect(parseSkateFilter({ mouse: "no-such-mouse" }, KNOWN)).toEqual(NO_SKATE_FILTER);
    expect(parseSkateFilter({ mouse: ["m2", "m1"] }, KNOWN).mouse).toBe("m2");
    expect(parseSkateFilter({ mouse: ["nope", "m1"] }, KNOWN).mouse).toBeNull();
    expect(parseSkateFilter({ mouse: "M1", material: "GLASS", shape: "DOT" }, KNOWN)).toEqual(NO_SKATE_FILTER);
    expect(parseSkateFilter({ mouse: "m".repeat(100000), material: "g".repeat(100000) }, KNOWN)).toEqual(NO_SKATE_FILTER);
    expect(parseSkateFilter({ mouse: "constructor" }, KNOWN)).toEqual(NO_SKATE_FILTER);
    expect(parseSkateFilter({}, KNOWN)).toEqual(NO_SKATE_FILTER);
  });
  it("リンクは今の絞り込みに 1 つだけ変えたもの", () => {
    expect(skateFilterHref({ mouse: "m1", material: "all", shape: "all" }, { shape: "dot" })).toBe("/skates?mouse=m1&shape=dot");
    expect(skateFilterHref(NO_SKATE_FILTER)).toBe("/skates");
  });
});

describe("結び付け", () => {
  const list = [
    skate("a", { mouseIds: ["m1"] }), skate("b", { mouseIds: ["m1", "m2"], material: "glass" }), skate("u", { shape: "dot" }),
    skate("held", { mouseIds: [] }), skate("n", { shape: "dot", material: null }),
  ];
  it("専用は mouseIds、汎用は機種に結び付けないドット", () => {
    expect(skatesForMouse(list, "m1").map((s) => s.id)).toEqual(["a", "b"]);
    expect(skatesForMouse(list, "m2").map((s) => s.id)).toEqual(["b"]);
    expect(universalSkates(list).map((s) => s.id)).toEqual(["u", "n"]);
    expect(skateCounts(list)).toEqual({ m1: 2, m2: 1 });
  });
  it("素材・形で絞る(素材がないものは素材の絞り込みで外れる)", () => {
    expect(filterSkates(list, { material: "glass", shape: "all" }).map((s) => s.id)).toEqual(["b"]);
    expect(filterSkates(list, { material: "all", shape: "dot" }).map((s) => s.id)).toEqual(["u", "n"]);
    expect(filterSkates(list, { material: "PTFE", shape: "dot" }).map((s) => s.id)).toEqual(["u"]);
  });
  it("マウスを選んだら専用と汎用、選ばなければブランド別(最初に出た順)", () => {
    expect(skateView(list, { mouse: "m1", material: "all", shape: "all" })).toEqual({ kind: "mouse", mouseId: "m1", dedicated: [list[0], list[1]], universal: [list[2], list[4]] });
    const all = skateView([skate("x", { brand: "Z" }), skate("y", { brand: "A" }), skate("z", { brand: "Z" })], NO_SKATE_FILTER);
    expect(all.kind === "all" && all.groups.map((g) => [g.brand, g.items.map((s) => s.id)])).toEqual([["Z", ["x", "z"]], ["A", ["y"]]]);
    expect(all.kind === "all" && all.total).toBe(3);
  });
  it("空の一覧は空", () => {
    expect(skateView([], NO_SKATE_FILTER)).toEqual({ kind: "all", groups: [], total: 0 });
    expect(skateCounts([])).toEqual({});
  });
});

describe("本物のデータ", () => {
  it("PRO X SUPERLIGHT 2 の専用は 13 件、汎用のドットは 8 件", () => {
    expect(skatesForMouse(SKATES, "logicool-g-pro-x-superlight-2")).toHaveLength(13);
    expect(universalSkates(SKATES)).toHaveLength(8);
  });
  it("ブランド別にすると 58 件がそろう", () => {
    const groups = groupByBrand(SKATES);
    expect(groups.map((g) => g.brand)).toEqual([...new Set(SKATES.map((s) => s.brand))]);
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(58);
  });
  it("表示の言葉に null・NaN・undefined が出ない", () => {
    for (const s of SKATES) {
      const text = `${materialLabel(s.material)} ${skateThicknessText(s.thicknessMm, s.thicknessOfficial)} ${packText(s.piecesPerPack, s.setsPerPack)}`;
      expect(text, s.id).not.toMatch(/null|NaN|undefined/);
    }
  });
});

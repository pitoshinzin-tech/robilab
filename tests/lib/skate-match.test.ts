import { describe, it, expect } from "vitest";
import * as skateMatch from "@/lib/skate-match";
import type { SkateSpec } from "@/data/gear-types";
import { SKATES } from "@/data/skates";
import {
  NO_SKATE_FILTER, filterSkates, skateChipHref, groupByBrand, parseSkateFilter, skateCounts, skateView, skatesHrefFor, skatesForMouse, universalSkates,
} from "@/lib/skate-match";
import { materialLabel, packText, skateThicknessText } from "@/lib/gear-labels";

const skate = (id: string, extra: Partial<SkateSpec> = {}): SkateSpec => ({
  id, brand: "B", line: "L", name: id, forMouse: "x", mouseIds: [], material: "PTFE", materialOfficial: null, shape: "full",
  thicknessMm: null, thicknessOfficial: null, piecesPerPack: null, setsPerPack: null, extras: [], officialUrl: `https://example.com/${id}`,
  checkedAt: "2026-10-03", selectionBasis: "", note: "", discontinued: false, ...extra,
});
const KNOWN = new Set(["m1", "m2"]);

describe("parseSkateFilter / skateChipHref", () => {
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
    expect(skateChipHref({ mouse: "m1", material: "all", shape: "all" }, { shape: "dot" })).toBe("/skates?mouse=m1&shape=dot");
    expect(skateChipHref({ mouse: "m1", material: "all", shape: "all" }, { mouse: null })).toBe("/skates?mouse=");
  });
  it("素の skateFilterHref は外に出さない(リンクに使うとマイ設定に選び直される)", () => {
    expect("skateFilterHref" in skateMatch).toBe(false);
  });
  it("skatesHrefFor は /mouse からのリンク(選んだマウスつき)", () => {
    expect(skatesHrefFor("m1")).toBe("/skates?mouse=m1");
    expect(skatesHrefFor("a b")).toBe("/skates?mouse=a+b");
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
  it("マウスと素材の両方で絞る(マウス m1 + ガラス)と、専用はガラスだけ・汎用は素材が合わず空", () => {
    expect(skateView(list, { mouse: "m1", material: "glass", shape: "all" })).toEqual({ kind: "mouse", mouseId: "m1", dedicated: [list[1]], universal: [] });
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
describe("skateChipHref(絞り込みのリンク)", () => {
  it("マウスを選んでいないときは空の mouse= を残し、マイ設定に戻されない", () => {
    expect(skateChipHref(NO_SKATE_FILTER, { material: "PTFE" })).toBe("/skates?mouse=&material=PTFE");
    expect(skateChipHref({ mouse: null, material: "PTFE", shape: "all" }, { material: "all" })).toBe("/skates?mouse=");
  });
  it("マウスを選んでいるときは素のリンクと同じ", () => {
    expect(skateChipHref({ mouse: "m1", material: "all", shape: "all" }, { shape: "dot" })).toBe("/skates?mouse=m1&shape=dot");
  });
});

describe("mouseOptionGroups(マウスを選ぶ欄)", () => {
  const mice = [
    { id: "a1", brand: "A", name: "A-One" }, { id: "b1", brand: "B", name: "B-One" }, { id: "a2", brand: "A", name: "A-Two" },
    { id: "c1", brand: "C", name: "C-One" }, { id: "b2", brand: "B", name: "B-Two" },
  ];
  const counts = { a2: 3, b2: 1 };
  const groups = skateMatch.mouseOptionGroups(mice, counts);
  it("ブランドごとの optgroup。専用のソールがあるブランドを先に(元の順を保つ)", () => {
    expect(groups.map((g) => g.brand)).toEqual(["A", "B", "C"]);
  });
  it("ブランドの中は専用があるものを先に、文字は「名前(N 件)」と短く(ブランド名を繰り返さない)", () => {
    expect(groups[0].options).toEqual([{ id: "a2", text: "A-Two(3 件)" }, { id: "a1", text: "A-One" }]);
    expect(groups[1].options.map((o) => o.text)).toEqual(["B-Two(1 件)", "B-One"]);
    expect(groups[2].options).toEqual([{ id: "c1", text: "C-One" }]);
  });
  it("専用が 1 つもないブランドは後ろ", () => {
    const g = skateMatch.mouseOptionGroups([{ id: "z", brand: "Z", name: "Z" }, ...mice], counts);
    expect(g.map((x) => x.brand)).toEqual(["A", "B", "Z", "C"]);
  });
});

describe("skateCountCaption / skateFilterCount(上の数字の説明・畳んだ絞り込みの見出し)", () => {
  it("絞り込みなし・マウスなしは「公式の数字で比べられる数」", () => {
    expect(skateMatch.skateCountCaption(NO_SKATE_FILTER, 58)).toBe("公式の数字で比べられる数");
  });
  it("マウスなしで絞り込み中は「絞り込みに合う数(全 N 件)」(0 件でも)", () => {
    expect(skateMatch.skateCountCaption({ mouse: null, material: "UPE", shape: "full" }, 58)).toBe("絞り込みに合う数(全 58 件)");
  });
  it("マウスを選んでいて絞り込みなしは「このマウスに使える数」、絞り込み中はこのマウスに使える数を添える", () => {
    expect(skateMatch.skateCountCaption({ mouse: "m1", material: "all", shape: "all" }, 9)).toBe("このマウスに使える数");
    expect(skateMatch.skateCountCaption({ mouse: "m1", material: "glass", shape: "all" }, 9)).toBe("絞り込みに合う数(このマウスに使える 9 件)");
  });
  it("「すべて」でない条件の数(マウスは数えない)", () => {
    expect(skateMatch.skateFilterCount(NO_SKATE_FILTER)).toBe(0);
    expect(skateMatch.skateFilterCount({ mouse: "m1", material: "glass", shape: "all" })).toBe(1);
    expect(skateMatch.skateFilterCount({ mouse: null, material: "UPE", shape: "dot" })).toBe(2);
  });
});

describe("skateChipHref の all(すべて見るの状態を保つ)", () => {
  it("showAll のときだけ all=1 を付ける(マウス未選択の空の mouse= は残す)", () => {
    expect(skateChipHref(NO_SKATE_FILTER, {}, true)).toBe("/skates?mouse=&all=1");
    expect(skateChipHref(NO_SKATE_FILTER, { material: "PTFE" }, true)).toBe("/skates?mouse=&material=PTFE&all=1");
    expect(skateChipHref({ mouse: "m1", material: "all", shape: "all" }, { shape: "dot" }, true)).toBe("/skates?mouse=m1&shape=dot&all=1");
    expect(skateChipHref({ mouse: "m1", material: "all", shape: "all" }, { shape: "dot" }, false)).toBe("/skates?mouse=m1&shape=dot");
  });
  it("all は絞り込みの条件に入らない", () => {
    expect(parseSkateFilter({ all: "1" }, KNOWN)).toEqual(NO_SKATE_FILTER);
  });
});

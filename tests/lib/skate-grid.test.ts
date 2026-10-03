import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SkateSpec } from "@/data/gear-types";
import { SKATES } from "@/data/skates";
import { NO_SKATE_FILTER, skateView } from "@/lib/skate-match";
import { SKATE_CELL, skateCellKind, skateGrid, skateGridLabel } from "@/lib/skate-grid";
import { SkateGrid, SkateCellMark } from "@/components/gear/SkateGrid";

const skate = (id: string, extra: Partial<SkateSpec> = {}): SkateSpec => ({
  id, brand: "B", line: "L", name: id, forMouse: "x", mouseIds: [], material: "PTFE", materialOfficial: null, shape: "full",
  thicknessMm: null, thicknessOfficial: null, piecesPerPack: null, setsPerPack: null, extras: [], officialUrl: `https://example.com/${id}`,
  checkedAt: "2026-10-03", selectionBasis: "", note: "", discontinued: false, ...extra,
});

describe("skateCellKind", () => {
  it("機種専用の形は専用(面)、ドットは汎用(線)", () => {
    expect(skateCellKind(skate("a", { shape: "full" }))).toBe("dedicated");
    expect(skateCellKind(skate("b", { shape: "dot" }))).toBe("universal");
  });
  it("ドットでも特定のマウスに結び付いていれば専用(skateView の「汎用 = ドットで mouseIds が空」とそろえる)", () => {
    expect(skateCellKind(skate("c", { shape: "dot", mouseIds: ["pulsar-x2-v2-medium"] }))).toBe("dedicated");
    for (const s of SKATES) expect(skateCellKind(s), s.id).toBe(s.shape === "dot" && s.mouseIds.length === 0 ? "universal" : "dedicated");
  });
});

describe("skateGrid(マスの数と種類)", () => {
  const list = [
    skate("a1", { brand: "A", mouseIds: ["m1"] }), skate("b1", { brand: "B", shape: "dot" }), skate("a2", { brand: "A", mouseIds: ["m2"] }),
    skate("c1", { brand: "C" }), skate("b2", { brand: "B", shape: "dot" }),
  ];
  it("選んでいないときは全製品を 1 マスずつ、ブランドの順に並べる", () => {
    const g = skateGrid(skateView(list, NO_SKATE_FILTER));
    expect(g.mode).toBe("all");
    expect(g.cells.map((c) => c.id)).toEqual(["a1", "a2", "b1", "b2", "c1"]);
    expect(g.cells.map((c) => c.kind)).toEqual(["dedicated", "dedicated", "universal", "universal", "dedicated"]);
    expect([g.dedicated, g.universal]).toEqual([3, 2]);
  });
  it("マウスを選ぶと、そのマウスの専用(面)のあとに汎用のドット(線)。選び直すと数が変わる", () => {
    const m1 = skateGrid(skateView(list, { ...NO_SKATE_FILTER, mouse: "m1" }));
    expect(m1.mode).toBe("mouse");
    expect(m1.cells.map((c) => [c.id, c.kind])).toEqual([["a1", "dedicated"], ["b1", "universal"], ["b2", "universal"]]);
    expect([m1.dedicated, m1.universal]).toEqual([1, 2]);
    const none = skateGrid(skateView(list, { ...NO_SKATE_FILTER, mouse: "m9" }));
    expect([none.dedicated, none.universal]).toEqual([0, 2]);
  });
  it("マウスを選んだときは、汎用のドットを新しい段から始める(10 の倍数ならそのまま続ける)", () => {
    const step = SKATE_CELL.sizePx + SKATE_CELL.gapPx;
    const many = [...Array.from({ length: 13 }, (_, i) => skate(`d${i}`, { mouseIds: ["m1"] })), ...Array.from({ length: 8 }, (_, i) => skate(`u${i}`, { shape: "dot" }))];
    const g = skateGrid(skateView(many, { ...NO_SKATE_FILTER, mouse: "m1" }));
    const u0 = g.cells.find((c) => c.id === "u0")!;
    expect([u0.x, u0.y]).toEqual([0, 2 * step]);
    expect(g.height).toBe(3 * step - SKATE_CELL.gapPx);
    const ten = [...Array.from({ length: 10 }, (_, i) => skate(`d${i}`, { mouseIds: ["m1"] })), skate("u", { shape: "dot" })];
    const t = skateGrid(skateView(ten, { ...NO_SKATE_FILTER, mouse: "m1" }));
    expect([t.cells[10].x, t.cells[10].y]).toEqual([0, step]);
    const onlyDed = skateGrid(skateView([skate("d", { mouseIds: ["m1"] })], { ...NO_SKATE_FILTER, mouse: "m1" }));
    expect([onlyDed.width, onlyDed.height]).toEqual([SKATE_CELL.sizePx, SKATE_CELL.sizePx]);
  });
  it("絞り込みのあとの数だけマスにする(上の数字と同じ)", () => {
    const g = skateGrid(skateView(list, { ...NO_SKATE_FILTER, shape: "dot" }));
    expect(g.cells.map((c) => c.id)).toEqual(["b1", "b2"]);
  });
  it("マスは 16px、間 8px(8px の倍数)で、10 列で折り返す", () => {
    expect(SKATE_CELL.sizePx % 8).toBe(0);
    expect(SKATE_CELL.gapPx % 8).toBe(0);
    const many = Array.from({ length: 23 }, (_, i) => skate(`s${i}`));
    const g = skateGrid(skateView(many, NO_SKATE_FILTER));
    const step = SKATE_CELL.sizePx + SKATE_CELL.gapPx;
    expect([g.cells[0].x, g.cells[0].y]).toEqual([0, 0]);
    expect([g.cells[9].x, g.cells[9].y]).toEqual([9 * step, 0]);
    expect([g.cells[10].x, g.cells[10].y]).toEqual([0, step]);
    expect([g.cells[22].x, g.cells[22].y]).toEqual([2 * step, 2 * step]);
    expect(g.width).toBe(SKATE_CELL.columns * step - SKATE_CELL.gapPx);
    expect(g.height).toBe(3 * step - SKATE_CELL.gapPx);
  });
  it("1 列に満たないときは幅を詰める・0 件は大きさ 0", () => {
    const step = SKATE_CELL.sizePx + SKATE_CELL.gapPx;
    const three = skateGrid(skateView([skate("a"), skate("b"), skate("c")], NO_SKATE_FILTER));
    expect([three.width, three.height]).toEqual([3 * step - SKATE_CELL.gapPx, SKATE_CELL.sizePx]);
    const zero = skateGrid(skateView([], NO_SKATE_FILTER));
    expect([zero.cells.length, zero.width, zero.height]).toEqual([0, 0, 0]);
  });
  it("本物のデータ:選ばないときは全 58 件、G PRO X SUPERLIGHT 2 は専用 13・汎用 8、G203 は専用 0", () => {
    const all = skateGrid(skateView(SKATES, NO_SKATE_FILTER));
    expect(all.cells.length).toBe(SKATES.length);
    const sl2 = skateGrid(skateView(SKATES, { ...NO_SKATE_FILTER, mouse: "logicool-g-pro-x-superlight-2" }));
    expect(sl2.dedicated).toBe(SKATES.filter((s) => s.mouseIds.includes("logicool-g-pro-x-superlight-2")).length);
    expect(sl2.universal).toBe(SKATES.filter((s) => s.shape === "dot" && s.mouseIds.length === 0).length);
    const g203 = skateGrid(skateView(SKATES, { ...NO_SKATE_FILTER, mouse: "logicool-g203" }));
    expect(g203.dedicated).toBe(0);
  });
});

describe("skateGridLabel", () => {
  const list = [skate("a1", { mouseIds: ["m1"] }), skate("b1", { shape: "dot" })];
  it("マウスを選んだとき:マウスの名前・専用と汎用の数・塗りと線の意味", () => {
    const label = skateGridLabel(skateGrid(skateView(list, { ...NO_SKATE_FILTER, mouse: "m1" })), "Logicool G PRO");
    expect(label).toContain("Logicool G PRO");
    expect(label).toContain("専用 1 件");
    expect(label).toContain("汎用のドット 1 件");
    expect(label).toMatch(/塗り/);
    expect(label).toMatch(/線/);
  });
  it("選ばないとき:全部の数とブランドの順", () => {
    const label = skateGridLabel(skateGrid(skateView(list, NO_SKATE_FILTER)), null);
    expect(label).toContain("2 件");
    expect(label).toContain("ブランドの順");
    expect(label).not.toMatch(/null|undefined|NaN/);
  });
});

describe("SkateGrid(サーバーの部品)", () => {
  const list = [skate("a1", { mouseIds: ["m1"] }), skate("b1", { shape: "dot" }), skate("b2", { shape: "dot" })];
  const html = renderToStaticMarkup(createElement(SkateGrid, { grid: skateGrid(skateView(list, { ...NO_SKATE_FILTER, mouse: "m1" })), mouseName: "M1" }));
  it("role=img と意味の分かる aria-label", () => {
    expect(html).toContain('role="img"');
    expect(html).toMatch(/aria-label="[^"]*M1[^"]*"/);
  });
  it("専用は面(--rl-selected の塗り)、汎用は線(--rl-line-strong の線)の四角を、製品の数だけ描く", () => {
    expect(html.match(/fill="var\(--rl-selected\)"/g)?.length).toBe(1 + 1); // マス 1 + 下の印 1
    expect(html.match(/stroke="var\(--rl-line-strong\)"/g)?.length).toBe(2 + 1);
  });
  it("下に「専用 N・汎用 M」(数字はマゼンタ)", () => {
    expect(html).toMatch(/専用[\s\S]*text-rl-highlight[^>]*>1</);
    expect(html).toMatch(/汎用[\s\S]*text-rl-highlight[^>]*>2</);
  });
  it("0 件ならマスの図を出さず、数だけ出す", () => {
    const zero = renderToStaticMarkup(createElement(SkateGrid, { grid: skateGrid(skateView([], NO_SKATE_FILTER)), mouseName: null }));
    expect(zero).not.toContain('role="img"');
    expect(zero).toContain(">0<");
  });
  it("行の印:専用は面、汎用は線(飾りなので aria-hidden)", () => {
    const d = renderToStaticMarkup(createElement(SkateCellMark, { kind: "dedicated" }));
    const u = renderToStaticMarkup(createElement(SkateCellMark, { kind: "universal" }));
    expect(d).toContain('fill="var(--rl-selected)"');
    expect(u).toContain('stroke="var(--rl-line-strong)"');
    expect(d).toContain('aria-hidden="true"');
  });
});

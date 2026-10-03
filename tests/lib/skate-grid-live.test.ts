import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SKATES } from "@/data/skates";
import { DEVICES } from "@/data/devices";
import { NO_SKATE_FILTER, skateGridSource, skateView, type SkateFilter } from "@/lib/skate-match";
import { skateGrid, skateGridFromSource, type SkateGridModel } from "@/lib/skate-grid";
import { SkateGrid } from "@/components/gear/SkateGrid";
import { SkateGridLive } from "@/components/gear/SkateGridLive";

/** 製品の id はブラウザに渡さないので、比べるのは種類・置き場所・数・大きさ */
const shape = (g: SkateGridModel) => ({ ...g, cells: g.cells.map(({ kind, x, y }) => ({ kind, x, y })) });
const mice = DEVICES.filter((d) => d.category === "mouse").map((m) => m.id);

const FILTERS: Pick<SkateFilter, "material" | "shape">[] = [
  { material: "all", shape: "all" },
  ...(["PTFE", "glass", "UPE", "other"] as const).map((material) => ({ material, shape: "all" as const })),
  { material: "all", shape: "full" },
  { material: "all", shape: "dot" },
  { material: "PTFE", shape: "dot" },
  { material: "glass", shape: "full" },
];

describe("skateGridFromSource(ブラウザ)と skateGrid(サーバー)が同じマスになる", () => {
  it.each(FILTERS.map((f) => [`${f.material}・${f.shape}`, f] as const))("%s:選ばない・全部のマウス", (_n, f) => {
    const src = skateGridSource(SKATES, f);
    expect(shape(skateGridFromSource(src, null))).toEqual(shape(skateGrid(skateView(SKATES, { ...NO_SKATE_FILTER, ...f }))));
    for (const mouse of mice) {
      expect(shape(skateGridFromSource(src, mouse)), mouse).toEqual(shape(skateGrid(skateView(SKATES, { ...f, mouse }))));
    }
  });
  it("知らない id は専用 0(汎用のドットだけ)", () => {
    const g = skateGridFromSource(skateGridSource(SKATES, NO_SKATE_FILTER), "toString");
    expect(g.dedicated).toBe(0);
    expect(g.mode).toBe("mouse");
  });
});

describe("skateGridSource(ブラウザへ渡す数)", () => {
  const src = skateGridSource(SKATES, NO_SKATE_FILTER);
  it("数と種類の並びだけ(ソールの名前・出典の URL・文を含まない)", () => {
    const json = JSON.stringify(src);
    for (const s of SKATES.slice(0, 10)) {
      expect(json).not.toContain(s.officialUrl);
      expect(json).not.toContain(`"${s.id}"`);
    }
    expect(json).not.toMatch(/https?:/);
    expect(src.allKinds).toMatch(/^[du]*$/);
    expect(src.allKinds.length).toBe(SKATES.length);
  });
});

describe("SkateGridLive(client の部品)", () => {
  const src = skateGridSource(SKATES, NO_SKATE_FILTER);
  const mouse = "logicool-g-pro-x-superlight-2";
  it("最初の描画は、サーバーの SkateGrid と同じ HTML(JS が無くても同じマス)", () => {
    const live = renderToStaticMarkup(createElement(SkateGridLive, { selectId: "s", source: src, mouseId: mouse, mouseName: "Logicool G PRO" }));
    const server = renderToStaticMarkup(createElement(SkateGrid, { grid: skateGrid(skateView(SKATES, { ...NO_SKATE_FILTER, mouse })), mouseName: "Logicool G PRO", live: true }));
    expect(live).toBe(server);
  });
  it("\"use client\" で、効果の中で同期の setState をしない(change のときだけ)", () => {
    const text = readFileSync("src/components/gear/SkateGridLive.tsx", "utf8");
    expect(text).toMatch(/^"use client";/);
    expect(text).toContain('addEventListener("change"');
  });
});

describe("凡例の数(小さな数字の決まり)", () => {
  it("「専用 N」「汎用のドット M」の数は本文の書体の太字(Orbitron の font-display を使わない)。0 でも同じ", () => {
    const zero = renderToStaticMarkup(createElement(SkateGrid, { grid: skateGridFromSource({ dedicatedByMouse: {}, universal: 0, allKinds: "" }, null), mouseName: null }));
    const nums = zero.match(/<span class="[^"]*text-rl-highlight[^"]*">0<\/span>/g) ?? [];
    expect(nums).toHaveLength(2);
    for (const n of nums) {
      expect(n).toContain("font-bold");
      expect(n).not.toContain("font-display");
    }
  });
});

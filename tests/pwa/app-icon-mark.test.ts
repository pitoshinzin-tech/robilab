import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppIconMark, HomeRowArt } from "@/components/pwa/AppIconMark";
import { AndroidSteps, DesktopSteps, IosSteps } from "@/components/pwa/InstallSteps";
import { COLORS, GRID } from "@/lib/pwa/app-icon-grid.mjs";
import * as script from "../../scripts/app-icons.mjs";

const GLOBALS = readFileSync("src/app/globals.css", "utf8").replace(/\r\n/g, "\n");
const token = (name: string) => GLOBALS.match(new RegExp(`${name}: *(#[0-9a-fA-F]{6})`))?.[1]?.toUpperCase();

/** SVG の 1×1 の四角(x・y・class)を 8×8 の格子に起こす */
function gridOf(svg: string, keyOfClass: Record<string, string>) {
  const cells = Array.from({ length: 8 }, () => Array<string>(8).fill("."));
  for (const m of svg.matchAll(/<rect x="(\d)" y="(\d)" width="1" height="1" class="([^"]+)"/g)) cells[Number(m[2])][Number(m[1])] = keyOfClass[m[3]] ?? "?";
  return cells.map((r) => r.join(""));
}

describe("アイコンの絵は 1 つ(scripts/app-icons.mjs と画面の案内で使い回す)", () => {
  it("PNG を作るスクリプトは同じ GRID・COLORS を使う", () => {
    expect(script.GRID).toBe(GRID);
    expect(script.COLORS).toBe(COLORS);
  });
  it("色は globals.css の役割の色と同じ値(背景・マゼンタ・パープルの文字色)", () => {
    expect(COLORS["."].toUpperCase()).toBe(token("--rl-bg"));
    expect(COLORS.M.toUpperCase()).toBe(token("--rl-magenta"));
    expect(COLORS.P.toUpperCase()).toBe(token("--rl-secondary-text"));
  });
});

describe("AppIconMark", () => {
  const h = renderToStaticMarkup(createElement(AppIconMark, { className: "size-16" }));
  it("8×8 のマスの SVG で、GRID と同じ絵。色は役割のクラスだけ(色の値を直書きしない)", () => {
    expect(h).toMatch(/<svg[^>]+viewBox="0 0 8 8"/);
    expect(h).toContain('aria-hidden="true"');
    expect(h).toContain('shape-rendering="crispEdges"');
    expect(gridOf(h, { "fill-rl-highlight": "M", "fill-rl-secondary-text": "P" })).toEqual(GRID);
    expect(h).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(h).toContain("fill-rl-bg");
  });
});

describe("HomeRowArt(ホームの列)", () => {
  it("アイコン 64px と、線の四角 3 つ(開いたときだけ見える・場所は取ったまま)と、12px の説明", () => {
    const h = renderToStaticMarkup(createElement(HomeRowArt));
    expect(h).toContain("<figure");
    expect(h).toContain("size-16");
    const slots = h.match(/<span aria-hidden="true" data-home-slot=""[^>]*>/g) ?? [];
    expect(slots).toHaveLength(3);
    for (const s of slots) {
      expect(s).toContain("invisible");
      expect(s).toContain("group-has-[details[open]]/hint:visible");
      expect(s).toContain("border-dashed");
      expect(s).not.toMatch(/transition|animate/);
    }
    expect(h).toMatch(/<figcaption class="[^"]*text-xs[^"]*">ホームに並ぶアイコン<\/figcaption>/);
  });
  it("手順を開けない端末(showRow=false)はアイコンだけ", () => {
    const h = renderToStaticMarkup(createElement(HomeRowArt, { showRow: false }));
    expect(h).not.toContain("data-home-slot");
    expect(h).toContain("data-app-icon");
  });
});

describe("案内(InstallHint)の形", () => {
  const src = readFileSync("src/components/pwa/InstallHint.tsx", "utf8");
  it("ホームの列を出し、開く・閉じるは group/hint の has(CSS だけ)", () => {
    expect(src).toContain("<HomeRowArt");
    expect(src).toContain("group/hint");
  });
  it("「追加のしかた」に開閉の印(ChevronDown・開いたら上向き、動きなし)と、Safari の三角を消す", () => {
    expect(src).toMatch(/<ChevronDown aria-hidden className="[^"]*group-open:rotate-180/);
    expect(src).toContain("[&::-webkit-details-marker]:hidden");
    expect(src).not.toMatch(/ChevronDown[^/]*transition/);
  });
  it("/aim のカードは PC の幅で 2 列(右にアイコン)、文は 720px まで", () => {
    expect(src).toContain("lg:grid-cols-[minmax(0,1fr)_auto]");
    expect(src).toContain("max-w-[720px]");
  });
});

describe("手順(番号・アイコン・読み上げ)", () => {
  it.each([["iPhone", IosSteps, 3], ["Android", AndroidSteps, 3], ["PC", DesktopSteps, 2]] as const)("%s:どの手順にもアイコンがあり、「手順 n:」を読み上げる", (_name, C, n) => {
    const h = renderToStaticMarkup(createElement(C));
    const items = h.split("<li").slice(1);
    expect(items).toHaveLength(n);
    items.forEach((li, i) => {
      expect(li.match(/<svg/g)?.length, `${i + 1} 番目のアイコン`).toBe(1);
      // React の静的な描画は、文字と数字の間に <!-- --> を挟む
      expect(li.replace(/<!-- -->/g, "")).toContain(`<span class="sr-only">手順 ${i + 1}:</span>`);
    });
  });
  it("番号と文は同じ行の高さ(text-sm leading-6)で 1 行目がそろう", () => {
    const h = renderToStaticMarkup(createElement(IosSteps));
    expect(h).toMatch(/<span aria-hidden="true" class="[^"]*text-sm leading-6[^"]*text-rl-highlight[^"]*">1<\/span>/);
    expect(h).toMatch(/<span class="min-w-0 text-sm leading-6 text-rl-text">/);
  });
});

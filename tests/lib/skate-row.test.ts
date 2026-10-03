import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SKATES } from "@/data/skates";
import { shopLinks } from "@/lib/shop-links";
import { SkateRow } from "@/components/gear/SkateRow";
import { OtherMiceList } from "@/components/mouse/OtherMiceList";
import { toMouseRows, type MouseSource } from "@/lib/mouse-rows";

const render = (skate: (typeof SKATES)[number], primary = false) =>
  renderToStaticMarkup(createElement("ul", null, createElement(SkateRow, { skate, primary, links: shopLinks(`${skate.brand} ${skate.name}`, skate.officialUrl, {}) })));

describe("SkateRow", () => {
  it("名前・ブランド・対応の表記・確認日を出す", () => {
    const s = SKATES[0];
    const html = render(s);
    expect(html).toContain(s.name);
    expect(html).toContain(s.brand);
    expect(html).toContain(`確認日 ${s.checkedAt}`);
  });
  it("厚さの公式の原文をそのまま出す", () => {
    const s = SKATES.find((x) => x.thicknessOfficial)!;
    expect(render(s)).toContain(s.thicknessOfficial!.replace(/&/g, "&amp;"));
  });
  it("生産終了だけに札を付ける", () => {
    const d = SKATES.find((x) => x.discontinued);
    const n = SKATES.find((x) => !x.discontinued)!;
    if (d) expect(render(d)).toContain("生産終了");
    expect(render(n)).not.toContain("生産終了");
  });
  it("作業者向けのメモ(note・selectionBasis)を画面に出さない", () => {
    for (const s of SKATES) {
      const html = render(s);
      if (s.note.length > 0) expect(html).not.toContain(s.note);
      if (s.selectionBasis.length > 0) expect(html).not.toContain(s.selectionBasis);
      expect(html).not.toContain("<details");
    }
  });
  it("行は 1 列の縦の流れ(md の 2 列をやめる)。店のボタンは右に寄せない", () => {
    const html = render(SKATES[0]);
    expect(html).not.toContain("md:grid-cols-[minmax(0,1fr)_auto]");
    expect(html).not.toContain("md:justify-end");
  });
  it("ブランド名の前に専用(面)・汎用(線)の印のマス", () => {
    const full = SKATES.find((x) => x.shape === "full")!;
    const dot = SKATES.find((x) => x.shape === "dot")!;
    expect(render(full)).toContain('fill="var(--rl-selected)"');
    expect(render(dot)).toContain('stroke="var(--rl-line-strong)"');
  });
  it("厚さが 1 つの数字のとき:数字はマゼンタ、0〜1.5mm の目盛りを出す", () => {
    const s = SKATES.find((x) => x.thicknessMm !== null)!;
    const html = render(s);
    expect(html).toMatch(new RegExp(`text-rl-highlight[^>]*>${s.thicknessMm}<`));
    expect(html).toContain('role="img"');
  });
  it("厚さが幅の表記・記載なしのときは、目盛りを出さない(作った数字を出さない)", () => {
    const range = SKATES.find((x) => x.thicknessMm === null && x.thicknessOfficial)!;
    const html = render(range);
    expect(html).toContain("(公式の表記)");
    expect(html).not.toContain('role="img"');
    const none = SKATES.find((x) => x.thicknessMm === null && !x.thicknessOfficial);
    if (none) expect(render(none)).not.toContain('role="img"');
  });
  it("行全体に null・NaN・undefined を出さない", () => {
    for (const s of SKATES) expect(render(s)).not.toMatch(/null|NaN|undefined/);
  });
});
describe("OtherMiceList の「このマウスのソール」", () => {
  const src = (id: string): MouseSource => ({ id, lengthMm: null, widthMm: 60, heightMm: null, weightG: null, shape: null, connection: null, officialUrl: "https://example.com/" });
  const html = renderToStaticMarkup(createElement(OtherMiceList, {
    items: toMouseRows([src("a"), src("b")], (id) => ({ brand: "B", name: id }), {}, { a: 2 }, {}).other,
  }));
  it("専用のソールがあるマウスだけにリンクが出る", () => {
    expect(html).toContain('href="/skates?mouse=a"');
    expect(html).not.toContain("mouse=b");
  });
});

describe("SkateRow の厚さの数字", () => {
  it("SpecNum と同じ形(本文の書体の太字・マゼンタ・桁そろえ、単位は小さい字)。Orbitron を使わない", () => {
    const sk = SKATES.find((x) => x.thicknessMm !== null)!;
    const html = render(sk);
    expect(html).toContain(`<span class="font-bold tabular-nums text-rl-highlight">${sk.thicknessMm}</span><span class="ml-0.5 text-xs font-bold">mm</span>`);
    expect(html).not.toContain("font-display");
  });
});

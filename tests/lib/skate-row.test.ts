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

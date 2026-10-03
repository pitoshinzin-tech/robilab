import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PADS } from "@/data/pads";
import { visiblePads } from "@/lib/pad-filter";
import { shopLinks } from "@/lib/shop-links";
import { PadRow } from "@/components/gear/PadRow";
import { FilterGroup } from "@/components/gear/FilterGroup";
import { chipClassName, chipCheckClassName } from "@/components/ui/chip-style";
import { chipClassName as viaButton } from "@/components/ui/chip-button";

const pads = visiblePads(PADS);
const render = (pad: (typeof pads)[number], narrowed = false) =>
  renderToStaticMarkup(createElement("ul", null, createElement(PadRow, { pad, sizes: pad.sizes, narrowed, primary: false, links: shopLinks(`${pad.brand} ${pad.name}`, pad.officialUrl, {}) })));

describe("chip-style", () => {
  it("文字として読め、chip-button からも同じものが出る", () => {
    expect(typeof chipClassName).toBe("string");
    expect(chipCheckClassName).toContain("rl-draw-check");
    expect(viaButton).toBe(chipClassName);
  });
});

describe("PadRow", () => {
  it("公式の言葉を引用で出し、名前と確認日がある", () => {
    const p = pads.find((x) => x.speedQuotes.length > 0)!;
    const html = render(p);
    expect(html).toContain("<blockquote");
    expect(html).toContain(p.name);
    expect(html).toContain(`確認日 ${p.checkedAt}`);
  });
  it("生産終了だけに札を付ける", () => {
    const d = pads.find((x) => x.discontinued);
    const n = pads.find((x) => !x.discontinued)!;
    expect(render(d!)).toContain("生産終了");
    expect(d).toBeDefined();
    expect(render(n)).not.toContain("生産終了");
  });
  it("作業者向けのメモ(note)を画面に出さない", () => {
    const p = pads.find((x) => x.note.length > 0)!;
    const html = render(p);
    expect(html).not.toContain(p.note);
    expect(html).not.toContain("<details");
  });
  it("絞り込み中は注記が出る", () => {
    expect(render(pads[0], true)).toContain("絞り込みに合うものだけ");
    expect(render(pads[0], false)).not.toContain("絞り込みに合うものだけ");
  });
  it("行全体に null・NaN・undefined を出さない", () => {
    for (const p of pads) expect(render(p)).not.toMatch(/null|NaN|undefined/);
  });
});

describe("FilterGroup", () => {
  it("選んでいるチップに aria-current が付く", () => {
    const html = renderToStaticMarkup(createElement(FilterGroup, { label: "面", options: [
      { key: "all", text: "すべて", href: "/pads", current: false }, { key: "glass", text: "ガラス", href: "/pads?surface=glass", current: true }] }));
    expect(html).toContain('role="group"');
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toContain('href="/pads?surface=glass"');
  });
});

describe("PadRow のサイズ表", () => {
  const withSizes = pads.find((x) => x.sizes.some((s) => s.widthMm !== null && s.depthMm !== null && s.thicknessMm !== null))!;
  it("列の幅を colgroup で固定する(名前 35%・幅×奥行き 40%・厚さ 25%)", () => {
    const html = render(withSizes);
    expect(html).toContain("table-fixed");
    expect(html).toContain('<colgroup><col class="w-[35%]"/><col class="w-[40%]"/><col class="w-[25%]"/></colgroup>');
  });
  it("数字はマゼンタ、公式の記載なしは別の色", () => {
    const html = render(withSizes);
    expect(html).toContain("text-rl-highlight");
    const p = { ...withSizes, sizes: [{ label: "M", widthMm: null, depthMm: 280, thicknessMm: null }] };
    const none = renderToStaticMarkup(createElement("ul", null, createElement(PadRow, { pad: p, sizes: p.sizes, narrowed: false, primary: false, links: shopLinks("x", p.officialUrl, {}) })));
    expect(none).not.toContain("text-rl-highlight");
    expect(none).toContain("text-rl-muted\">公式の記載なし");
  });
  it("縮尺図を表の横に置く(描けるサイズがあるとき)", () => {
    expect(render(withSizes)).toContain('role="img"');
  });
});

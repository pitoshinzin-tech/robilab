import { describe, it, expect } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NumUnit } from "@/components/ui/num-unit";

const numClass = (value: ReactNode) => {
  const html = renderToStaticMarkup(createElement(NumUnit, { value, unit: "件", className: "text-rl-display-2" }));
  return html.match(/<span class="([^"]*)">[^<]*<\/span><span/)![1];
};

describe("NumUnit", () => {
  it("ふつうの数字は Orbitron(font-display)の太字・マゼンタ", () => {
    expect(numClass(13)).toContain("font-display");
    expect(numClass(13)).toContain("text-rl-highlight");
  });
  it("0 は本文の書体の太字(Orbitron の 0 は斜線の四角に見えるため)。マゼンタ・桁そろえのまま", () => {
    for (const v of [0, "0"]) {
      const c = numClass(v);
      expect(c).not.toContain("font-display");
      expect(c).toContain("font-bold");
      expect(c).toContain("tabular-nums");
      expect(c).toContain("text-rl-highlight");
    }
  });
  it("10・100 など 0 を含むほかの数は Orbitron のまま(大きな見せ場の数字)", () => {
    expect(numClass(10)).toContain("font-display");
  });
});

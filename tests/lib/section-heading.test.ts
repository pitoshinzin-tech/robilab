import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionHeading } from "@/components/ui/section-heading";

describe("SectionHeading の件数", () => {
  const html = renderToStaticMarkup(createElement(SectionHeading, { title: "見出し", count: 80 }));
  it("件数は本文の書体(Orbitron の小さな 0・8 は箱の記号に見えるため)。太字・桁そろえ・マゼンタのまま", () => {
    const m = html.match(/<span class="([^"]*)">80/);
    expect(m).not.toBeNull();
    expect(m![1]).not.toContain("font-display");
    expect(m![1]).toContain("font-bold");
    expect(m![1]).toContain("tabular-nums");
    expect(m![1]).toContain("text-rl-highlight");
  });
  it("単位「件」が見える", () => {
    expect(html).toMatch(/>件</);
    expect(html).not.toContain("sr-only");
  });
});

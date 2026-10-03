import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OtherMiceList } from "@/components/mouse/OtherMiceList";
import { toMouseRows } from "@/lib/mouse-rows";
import { MICE } from "@/data/mice";

describe("OtherMiceList", () => {
  const { other } = toMouseRows(MICE, (id) => MICE.find((m) => m.id === id), {}, {}, {});
  const html = renderToStaticMarkup(createElement(OtherMiceList, { items: other }));
  it("長さ・幅・高さ・重さを出し、ある数字はその値、ないものは「公式の記載なし」", () => {
    const withLength = other.find((r) => r.lengthMm !== null)!;
    expect(html).toContain(`${withLength.lengthMm}mm`);
    for (const label of ["長さ", "幅", "高さ", "重さ"]) expect(html).toContain(`<dt>${label}</dt>`);
    expect(html).toContain("公式の記載なし");
  });
  it("null・NaN・undefined・0mm を出さない", () => {
    expect(html).not.toMatch(/null|NaN|undefined|(^|[^\d.])0mm/);
  });
});

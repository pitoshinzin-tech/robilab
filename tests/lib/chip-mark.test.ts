import { describe, it, expect } from "vitest";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChipLink } from "@/components/ui/chip-link";
import { ChipButton } from "@/components/ui/chip-button";

const link = (current: boolean) => renderToStaticMarkup(createElement(ChipLink, { href: "/pads?size=S", current } as ComponentProps<typeof ChipLink>, "S"));

describe("チップの印(選んでいない = 8px の線の四角、選んだ = チェック)", () => {
  it("ChipLink:選んでいないときは 16px の場所に 8px の線の四角(aria-hidden)。チェックは出さない・invisible を使わない", () => {
    const html = link(false);
    expect(html).toMatch(/<span aria-hidden="true" class="[^"]*size-4[^"]*"><span class="[^"]*size-2[^"]*border-rl-line-strong[^"]*"><\/span><\/span>/);
    expect(html).not.toContain("lucide-check");
    expect(html).not.toContain("invisible");
  });
  it("ChipLink:選んだときはチェックだけ(四角は出さない)", () => {
    const html = link(true);
    expect(html).toContain("lucide-check");
    expect(html).not.toContain("size-2");
  });
  it("ChipButton:四角とチェックの両方を持ち、押したかどうかで切り替える(幅は変わらない)", () => {
    const html = renderToStaticMarkup(createElement(ChipButton, { pressed: false } as ComponentProps<typeof ChipButton>, "かぶせ"));
    expect(html).toMatch(/<span aria-hidden="true" class="[^"]*size-4[^"]*group-aria-pressed\/chip:hidden[^"]*"><span class="[^"]*size-2[^"]*border-rl-line-strong/);
    expect(html).toContain("group-aria-pressed/chip:block");
  });
});

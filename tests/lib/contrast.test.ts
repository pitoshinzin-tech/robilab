import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { composite, contrastRatio, parseColor, readRootTokens, type RGB } from "@/lib/contrast";

describe("contrast の計算", () => {
  it("色を読める", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
    expect(parseColor("#0A0C16")).toEqual([10, 12, 22, 1]);
    expect(parseColor("rgba(255, 255, 255, 0.4)")).toEqual([255, 255, 255, 0.4]);
    expect(parseColor("var(--x)")).toBeNull();
  });
  it("白と黒は 21、同じ色は 1", () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(contrastRatio([20, 20, 20], [20, 20, 20])).toBeCloseTo(1, 5);
  });
  it("透明の色を地に重ねる", () => {
    expect(composite([255, 255, 255, 0.5], [0, 0, 0])).toEqual([127.5, 127.5, 127.5]);
  });
  it(":root の var() をたどり、コメントを無視する", () => {
    const css = ":root {\n  /* --a: #000; */\n  --a: #123456;\n  --b: var(--a);\n}\n.x { --a: #fff; }";
    expect(readRootTokens(css)).toEqual({ "--a": "#123456", "--b": "#123456" });
  });
});

describe("globals.css のトークン(設計書 2-1)", () => {
  const tokens = readRootTokens(readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"));
  const solid = (name: string): RGB => {
    const c = parseColor(tokens[name] ?? "");
    if (!c || c[3] !== 1) throw new Error(`${name} は不透明の色にする(今:${tokens[name]})`);
    return [c[0], c[1], c[2]];
  };
  const over = (name: string, bg: RGB): RGB => {
    const c = parseColor(tokens[name] ?? "");
    if (!c) throw new Error(`${name} が読めない(今:${tokens[name]})`);
    return composite(c, bg);
  };
  const grounds = ["--rl-bg", "--rl-surface", "--rl-surface-2"];

  it("本文の色は、地・面・面2 のどれの上でも 4.5:1 以上", () => {
    for (const fg of ["--rl-text", "--rl-muted", "--rl-accent", "--rl-highlight", "--rl-secondary-text", "--rl-success", "--rl-warning", "--rl-danger"]) {
      for (const bg of grounds) expect(contrastRatio(solid(fg), solid(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("線・枠・選択・フォーカスは 3:1 以上", () => {
    for (const fg of ["--rl-secondary", "--rl-selected", "--rl-focus"]) {
      for (const bg of grounds) expect(contrastRatio(solid(fg), solid(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
    }
    for (const bg of grounds) {
      expect(contrastRatio(over("--rl-line-strong", solid(bg)), solid(bg)), `line-strong on ${bg}`).toBeGreaterThanOrEqual(3);
    }
    const selectedBg = over("--rl-selected-bg", solid("--rl-surface"));
    expect(contrastRatio(solid("--rl-selected"), selectedBg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(solid("--rl-text"), selectedBg)).toBeGreaterThanOrEqual(4.5);
  });
  it("塗りの上の文字", () => {
    expect(contrastRatio(solid("--rl-on-accent"), solid("--rl-accent"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(solid("--rl-on-accent"), solid("--rl-accent-hover"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(solid("--rl-on-highlight"), solid("--rl-highlight"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio([255, 255, 255], solid("--rl-discord"))).toBeGreaterThanOrEqual(4.5);
  });
  it("フォーカスの線は押せる色と同じ", () => {
    expect(tokens["--rl-focus"]).toBe(tokens["--rl-accent"]);
  });
  it("面は不透明", () => {
    expect(() => solid("--rl-surface")).not.toThrow();
    expect(() => solid("--rl-surface-2")).not.toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio, parseColor, readRootTokens, type RGB } from "@/lib/contrast";

const HTML = readFileSync("public/offline.html", "utf8");
const tokens = readRootTokens(HTML.slice(HTML.indexOf("<style>"), HTML.indexOf("</style>")));
const rgb = (name: string): RGB => {
  const c = parseColor(tokens[name] ?? "");
  if (!c) throw new Error(`${name} が読めない`);
  return [c[0], c[1], c[2]];
};

describe("offline.html(設計書 3-2)", () => {
  it("JS なし・外の読み込みなし", () => {
    expect(HTML).not.toMatch(/<script/i);
    expect(HTML).not.toMatch(/\son\w+=/i);
    expect(HTML).not.toMatch(/(src|href)="(https?:)?\/\//i);
    expect(HTML).not.toMatch(/<link[^>]+stylesheet/i);
    expect(HTML).not.toMatch(/@import|url\(/i);
  });
  it("日本語のページで、文とボタンがある", () => {
    expect(HTML).toContain('<html lang="ja">');
    expect(HTML).toContain('<meta name="viewport"');
    expect(HTML).toContain('<meta name="robots" content="noindex">');
    expect(HTML).toContain("電波が届いていません");
    expect(HTML).toContain("つながったら、もう一度読み込んでください。");
    expect(HTML).toMatch(/<a href="\/"[^>]*>もう一度読み込む<\/a>/);
  });
  it("色はデザインシステムの値で、コントラストは 4.5:1 以上", () => {
    expect(tokens["--bg"].toUpperCase()).toBe("#0A0C16");
    expect(tokens["--text"].toUpperCase()).toBe("#EAF6FF");
    expect(tokens["--accent"].toUpperCase()).toBe("#39F3FF");
    expect(contrastRatio(rgb("--text"), rgb("--bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(rgb("--muted"), rgb("--bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(rgb("--on-accent"), rgb("--accent"))).toBeGreaterThanOrEqual(4.5);
  });
  it("押せる高さ 48px・フォーカスの線・ドット絵の「ロ」の SVG", () => {
    expect(HTML).toMatch(/min-height:\s*48px/);
    expect(HTML).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid/);
    expect(HTML).toMatch(/<svg[^>]+viewBox="0 0 8 8"[^>]+aria-hidden="true"/);
  });
  it("絵文字と文字の矢印を使わない", () => {
    expect(HTML).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(HTML).not.toMatch(/[←→]/);
  });
});

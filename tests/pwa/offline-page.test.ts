import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio, parseColor, readRootTokens, type RGB } from "@/lib/contrast";
import { COLORS, GRID } from "@/lib/pwa/app-icon-grid.mjs";

const HTML = readFileSync("public/offline.html", "utf8").replace(/\r\n/g, "\n");
const CSS = HTML.slice(HTML.indexOf("<style>"), HTML.indexOf("</style>"));
const GLOBALS = readFileSync("src/app/globals.css", "utf8").replace(/\r\n/g, "\n");
/** globals.css の :root の値(var(--x) は 1 段だけたどる) */
const globalToken = (name: string): string => {
  const v = GLOBALS.match(new RegExp(`\\n *${name}: *([^;]+);`))?.[1]?.trim() ?? "";
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref ? globalToken(ref[1]) : v;
};
const tokens = readRootTokens(CSS);
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
    // href="" で今の URL を読み直すので、開こうとしていたページに戻るのは本当のこと(採点 2 回目の P1)
    expect(HTML).toContain("つながったら、もう一度読み込むと、開こうとしていたページに戻ります。");
    // href="" は今の URL(電波が切れたときに開こうとしていたページ)を読み直す。トップには戻さない
    expect(HTML).toMatch(/<a href=""[^>]*>もう一度読み込む<\/a>/);
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
  it("色の値は globals.css の役割の色(--rl-*)と同じ", () => {
    const pairs: [string, string][] = [["--bg", "--rl-bg"], ["--text", "--rl-text"], ["--muted", "--rl-muted"], ["--accent", "--rl-accent"], ["--accent-hover", "--rl-accent-hover"], ["--on-accent", "--rl-on-accent"], ["--line", "--rl-line-strong"]];
    for (const [mine, theirs] of pairs) {
      const norm = (v: string) => v.replace(/\s+/g, "").toUpperCase();
      expect(norm(tokens[mine] ?? ""), mine).toBe(norm(globalToken(theirs)));
    }
  });
  it("ドット絵の「ロ」はアプリのアイコンと同じ絵(app-icon-grid.mjs の GRID と COLORS)", () => {
    const svg = HTML.slice(HTML.indexOf('<svg class="mark"'), HTML.indexOf("</svg>"));
    const keyOf = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [String(v).toUpperCase(), k]));
    const cells = Array.from({ length: 8 }, () => Array<string>(8).fill("."));
    for (const g of svg.matchAll(/<g fill="(#[0-9A-Fa-f]{6})">([\s\S]*?)<\/g>/g)) {
      const key = keyOf[g[1].toUpperCase()];
      expect(key, g[1]).toBeDefined();
      for (const r of g[2].matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"\/>/g)) {
        const [x, y, w, h] = r.slice(1).map(Number);
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) cells[yy][xx] = key;
      }
    }
    expect(cells.map((row) => row.join(""))).toEqual(GRID);
  });
  it("「ロ」は大きく(スマホ 128px = 1 マス 16px、768px から 192px = 1 マス 24px)、見出しは 24px → 32px", () => {
    expect(CSS).toMatch(/\.mark \{[^}]*width: 128px; height: 128px;/);
    const wide = CSS.slice(CSS.indexOf("@media (min-width: 768px)"));
    expect(wide).toMatch(/\.mark \{[^}]*width: 192px; height: 192px;/);
    expect(wide).toMatch(/h1 \{ font-size: 32px; \}/);
  });
  it("「ロ」の下に真ん中が 32px 切れた線。ボタンの hover・フォーカスで、切れ目が opacity でつながる(CSS だけ・200ms)", () => {
    expect(HTML).toContain('<div class="cut"><span class="seg"></span><span class="bridge"></span><span class="seg"></span></div>');
    expect(CSS).toMatch(/\.cut \.bridge \{[^}]*flex: 0 0 32px;[^}]*opacity: 0;[^}]*transition: opacity 200ms/);
    expect(CSS).toMatch(/main:has\(a:focus-visible\) \.bridge \{ opacity: 1; \}/);
    const hover = CSS.slice(CSS.indexOf("@media (hover: hover)"));
    expect(hover).toMatch(/main:has\(a:hover\) \.bridge \{ opacity: 1; \}/);
    // 動きを減らす設定では、すぐ切り替える
    const reduced = CSS.slice(CSS.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/\.cut \.bridge \{ transition: none; \}/);
    // 色・大きさ・位置は動かさない(opacity だけ)
    expect(CSS).not.toMatch(/transition:\s*(all|transform|width)/);
  });
  it("中身のまとまりは画面の真ん中(幅は中身に合わせる)、縦の間は 8 の倍数", () => {
    expect(CSS).toMatch(/main \{[^}]*width: fit-content;[^}]*margin: 0 auto;/);
    // gap・margin・padding の px はすべて 8 の倍数
    for (const m of CSS.matchAll(/(?:gap|margin(?:-bottom|-top)?):\s*([^;]+);/g)) {
      for (const px of m[1].matchAll(/(\d+)px/g)) expect(Number(px[1]) % 8, m[0]).toBe(0);
    }
    expect(CSS).toMatch(/\.art \{[^}]*margin-bottom: 32px;/);
    expect(CSS).toMatch(/h1 \{ margin: 0 0 16px;/);
    expect(CSS).toMatch(/p \{ margin: 0 0 32px;/);
  });
  it("絵文字と文字の矢印を使わない", () => {
    expect(HTML).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(HTML).not.toMatch(/[←→]/);
  });
});

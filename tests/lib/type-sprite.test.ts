import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { readRootTokens } from "@/lib/contrast";
import { SPRITE_HEX, SPRITE_ROLES, SPRITE_SIZE, buildTypeSprite, spriteFill, typeSpriteSvg, type SpriteCell, type SpriteRole } from "@/lib/type-sprite";

const CODES = ["A", "G"].flatMap((a) => ["R", "B"].flatMap((b) => ["C", "L"].flatMap((c) => ["H", "Z"].map((d) => a + b + c + d))));
const of = (code: string, role: SpriteRole): SpriteCell[] => buildTypeSprite(code)!.filter((c) => c.role === role);
const xsAt = (cells: SpriteCell[], y: number) => cells.filter((c) => c.y === y).map((c) => c.x).sort((p, q) => p - q);
const has = (cells: SpriteCell[], x: number, y: number) => cells.some((c) => c.x === x && c.y === y);

describe("buildTypeSprite", () => {
  it("16 タイプの絵がすべて違う", () => {
    expect(CODES).toHaveLength(16);
    expect(new Set(CODES.map((c) => JSON.stringify(buildTypeSprite(c)))).size).toBe(16);
  });
  it("すべてのマスが 12×12 の中で、1 マスずつ", () => {
    for (const code of CODES) for (const c of buildTypeSprite(code)!) {
      expect(c.x).toBeGreaterThanOrEqual(0); expect(c.x).toBeLessThan(SPRITE_SIZE);
      expect(c.y).toBeGreaterThanOrEqual(0); expect(c.y).toBeLessThan(SPRITE_SIZE);
      expect([c.w, c.h]).toEqual([1, 1]);
    }
  });
  it("A はとがった頭(2 → 4 → 6 マスと角)、G は平らな兜とつば", () => {
    const a = of("ARCH", "head");
    expect(xsAt(a, 2)).toEqual([2, 5, 6, 9]);
    expect(xsAt(a, 3)).toEqual([4, 5, 6, 7]);
    expect(xsAt(a, 4)).toEqual([3, 4, 5, 6, 7, 8]);
    const g = of("GRCH", "head");
    expect(xsAt(g, 2)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(xsAt(g, 4)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it("R は斜めの目と稲妻、B はつながったゴーグル", () => {
    const r = of("ARCH", "eye");
    for (const [x, y] of [[2, 6], [3, 7], [9, 6], [8, 7], [6, 5], [5, 6], [6, 7]]) expect(has(r, x, y)).toBe(true);
    const b = of("ABCH", "eye");
    expect(b).toHaveLength(10);
    expect(has(b, 5, 6) && has(b, 6, 6)).toBe(true);
  });
  it("C は両わきの仲間の点と帯、L は右だけのマント", () => {
    const c = of("ARCH", "side");
    expect(has(c, 0, 6) && has(c, 11, 6)).toBe(true);
    expect(xsAt(c, 10)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    const l = of("ARLH", "side");
    expect(l.every((p) => p.x >= 9)).toBe(true);
    expect(has(l, 11, 10)).toBe(true);
  });
  it("L 以外の左右対称の型(GBCZ)は、頭上の印を除いて左右対称", () => {
    const cells = buildTypeSprite("GBCZ")!.filter((c) => c.role !== "aura");
    for (const c of cells) expect(cells.some((d) => d.role === c.role && d.x === SPRITE_SIZE - 1 - c.x && d.y === c.y), `${c.role} ${c.x},${c.y}`).toBe(true);
  });
  it("H は炎、Z は雪(頭上の 3 マス)", () => {
    expect(of("ARCH", "aura").map((c) => [c.x, c.y])).toEqual([[6, 0], [5, 1], [6, 1]]);
    expect(of("ARCZ", "aura").map((c) => [c.x, c.y])).toEqual([[5, 0], [7, 0], [6, 1]]);
  });
  it("知らないコードは null", () => {
    for (const bad of ["", "arch", "ABCD", "ARCHX", "XRCH"]) expect(buildTypeSprite(bad)).toBeNull();
  });
});

describe("spriteFill と SVG の書き出し", () => {
  it("色は軸から決まり、シアン(押せる色)を使わない", () => {
    expect(spriteFill("body", "H")).toBe("var(--rl-highlight)");
    expect(spriteFill("body", "Z")).toBe("var(--rl-secondary-text)");
    expect(spriteFill("eye", "H")).toBe("var(--rl-bg)");
    expect(spriteFill("aura", "H")).toBe("var(--rl-success)");
    expect(spriteFill("aura", "Z")).toBe("var(--rl-text)");
    for (const role of SPRITE_ROLES) for (const heat of ["H", "Z"] as const) {
      expect(spriteFill(role, heat)).not.toMatch(/accent|cyan|focus/);
    }
  });
  it("SPRITE_HEX は globals.css の値と同じ", () => {
    const tokens = readRootTokens(readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"));
    for (const [ref, hex] of Object.entries(SPRITE_HEX)) {
      const name = ref.slice(4, -1);
      expect(tokens[name]?.toLowerCase(), name).toBe(hex.toLowerCase());
    }
  });
  it("SVG はレイヤー名つきで、CSS の変数を含まない", () => {
    const svg = typeSpriteSvg("ARCH")!;
    expect(svg).toContain('viewBox="0 0 12 12"');
    for (const id of ["background", "body", "head", "sides", "aura", "eyes"]) expect(svg).toContain(`<g id="${id}"`);
    expect(svg).not.toContain("var(");
    expect(typeSpriteSvg("nope")).toBeNull();
  });
});

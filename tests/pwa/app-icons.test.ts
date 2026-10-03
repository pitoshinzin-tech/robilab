import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { BG, GRID, COLORS, ICONS, ICON_SOURCE, MASKABLE_SAFE_RADIUS, SVG_OUT, decodePng, renderPixels, renderSvg } from "../../scripts/app-icons.mjs";

const norm = (s: string) => s.replace(/\r\n/g, "\n");
const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const pixel = (img: { width: number; rgb: Buffer }, x: number, y: number) => {
  const i = (y * img.width + x) * 3;
  return hex(img.rgb[i], img.rgb[i + 1], img.rgb[i + 2]);
};

describe("ドット絵の元は今のファビコン(src/app/icon.svg)と同じ", () => {
  it("icon.svg の色ごとの四角を 8×8 に起こすと GRID と同じ", () => {
    const svg = readFileSync("src/app/icon.svg", "utf8");
    const cells = Array.from({ length: 8 }, () => Array<string>(8).fill("."));
    const keyOf = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [String(v).toUpperCase(), k]));
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
});

describe.each(ICONS.map((i) => [i.out, i] as const))("%s", (_out, icon) => {
  it("コミットしたファイルがあり、大きさが表どおりで、透明を持たない(RGB)", () => {
    expect(existsSync(icon.out)).toBe(true);
    const img = decodePng(readFileSync(icon.out));
    expect([img.width, img.height]).toEqual([icon.size, icon.size]);
    expect(img.colorType).toBe(2);
  });
  it("四すみは背景色(角を丸めない・透明にしない)", () => {
    const img = decodePng(readFileSync(icon.out));
    const s = icon.size - 1;
    for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s]]) expect(pixel(img, x, y)).toBe(BG.toUpperCase());
  });
  it.skipIf(ICON_SOURCE !== "grid")("スクリプトで作り直した画素と同じ(作り直し忘れがない)", () => {
    const img = decodePng(readFileSync(icon.out));
    expect(img.rgb.equals(renderPixels(icon.size, icon.cell))).toBe(true);
  });
  it("Photoshop 用の写しが export/app-icon にあり、同じ画素", () => {
    expect(existsSync(icon.copy)).toBe(true);
    expect(decodePng(readFileSync(icon.copy)).rgb.equals(decodePng(readFileSync(icon.out)).rgb)).toBe(true);
  });
});

describe("maskable", () => {
  it("背景色でない点は、すべて中心から半径 205px の円の中", () => {
    const icon = ICONS.find((i) => i.out.endsWith("icon-maskable-512.png"))!;
    const img = decodePng(readFileSync(icon.out));
    let painted = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        if (pixel(img, x, y) === BG.toUpperCase()) continue;
        painted++;
        // 画素の 4 すみのうち、いちばん遠いすみで測る
        const dx = Math.max(Math.abs(x - 256), Math.abs(x + 1 - 256));
        const dy = Math.max(Math.abs(y - 256), Math.abs(y + 1 - 256));
        expect(Math.hypot(dx, dy), `${x},${y}`).toBeLessThanOrEqual(MASKABLE_SAFE_RADIUS);
      }
    }
    expect(painted).toBeGreaterThan(0);
  });
});

describe("Illustrator 用の SVG", () => {
  it("作り直した文と同じで、名前つきのグループと仕上がりの大きさがある", () => {
    const svg = norm(readFileSync(SVG_OUT, "utf8"));
    expect(svg).toBe(renderSvg());
    expect(svg).toContain('viewBox="0 0 512 512"');
    for (const id of ["01_background", "02_mark", "guide_maskable_safe_zone"]) expect(svg).toContain(`<g id="${id}"`);
    expect(svg).not.toContain("<image");
  });
});

// KanjiVG(https://kanjivg.tagaini.net/ 、CC BY-SA 3.0、© Ulrich Apel)の SVG から、
// 画ごとの path だけを取り出して src/data/aim-chars.json を作る。
// 使い方: node scripts/kanjivg-to-json.mjs <SVG を置いたフォルダ>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("SVG のフォルダを指定してください");
const list = readFileSync(new URL("./aim-char-list.txt", import.meta.url), "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const out = list.map((glyph) => {
  const hex = glyph.codePointAt(0).toString(16).padStart(5, "0");
  const svg = readFileSync(join(dir, `${hex}.svg`), "utf8");
  const strokes = [...svg.matchAll(/<path[^>]*id="kvg:[0-9a-f]+-s(\d+)"[^>]*\sd="([^"]+)"/g)]
    .map((m) => ({ n: Number(m[1]), d: m[2] }))
    .sort((a, b) => a.n - b.n)
    .map((s) => s.d);
  if (strokes.length === 0) throw new Error(`線が見つかりません: ${glyph}`);
  return { id: `u${glyph.codePointAt(0).toString(16)}`, glyph, strokes };
});
writeFileSync(new URL("../src/data/aim-chars.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${out.length} chars`);

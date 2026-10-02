// 追補 7-1:コードで描くドット絵と階段の境目を、Illustrator で開ける SVG に書き出す(export/pixel-art/*.svg)。
// レイヤー名は <g id="..."> の id。使い方:node scripts/export-pixel-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { PIXEL_GRIDS, pixelGridSvg, stairSvg } from "../src/lib/pixel-art.ts";

const dir = new URL("../export/pixel-art/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const g of PIXEL_GRIDS) writeFileSync(new URL(`${g.id}.svg`, dir), pixelGridSvg(g));
writeFileSync(new URL("stair.svg", dir), stairSvg());
console.log(`${PIXEL_GRIDS.length + 1} 個の SVG を export/pixel-art/ に書き出しました`);

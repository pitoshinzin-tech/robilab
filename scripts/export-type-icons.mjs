// 16 タイプの仮のドット絵を、Illustrator で開ける SVG に書き出す(export/type-icons/CODE.svg)。
// レイヤー名:background / body / head / sides / aura / eyes。社長が描くときの下書きに使う。
// 使い方:node scripts/export-type-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { typeSpriteSvg } from "../src/lib/type-sprite.ts";

const dir = new URL("../export/type-icons/", import.meta.url);
mkdirSync(dir, { recursive: true });
let count = 0;
for (const a of ["A", "G"]) for (const b of ["R", "B"]) for (const c of ["C", "L"]) for (const d of ["H", "Z"]) {
  const code = a + b + c + d;
  writeFileSync(new URL(`${code}.svg`, dir), typeSpriteSvg(code));
  count++;
}
console.log(`${count} 個の SVG を export/type-icons/ に書き出しました`);

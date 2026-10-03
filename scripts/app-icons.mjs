// アプリのアイコン(PWA・iPhone)を、8×8 のドット絵の色の表から作る。Node の標準(zlib)だけ(パッケージを足さない)。
// 使い方: node scripts/app-icons.mjs
// 絵は src/app/icon.svg(タブのアイコン)と同じ。社長のロゴができたら src/lib/pwa/app-icon-grid.mjs の GRID と COLORS を差し替えて作り直す(docs/ops/launch.md)。
// ドット絵でないロゴを Photoshop で書き出して置き換えたときは ICON_SOURCE を "photoshop" にする(画素の比べのテストが止まる)。
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { COLORS, GRID } from "../src/lib/pwa/app-icon-grid.mjs";

/** "grid" = このスクリプトの GRID から作る / "photoshop" = 社長が書き出した PNG を置いた */
export const ICON_SOURCE = "grid";

// 絵(GRID)と色(COLORS)は src/lib/pwa/app-icon-grid.mjs に置く(画面の案内の AppIconMark と同じものを使う)
export { COLORS, GRID };
export const BG = COLORS["."];

/** maskable のアイコンで、マークを収める円の半径(512 の中央 80%) */
export const MASKABLE_SAFE_RADIUS = 205;

/** out = サイトで使う場所、copy = Photoshop 用の写し、cell = 1 マスの px(整数。ぼかさない) */
export const ICONS = [
  { out: "public/icons/icon-192.png", copy: "export/app-icon/icon-192.png", size: 192, cell: 24 },
  { out: "public/icons/icon-512.png", copy: "export/app-icon/icon-512.png", size: 512, cell: 64 },
  { out: "public/icons/icon-maskable-512.png", copy: "export/app-icon/icon-maskable-512.png", size: 512, cell: 48 },
  { out: "src/app/apple-icon.png", copy: "export/app-icon/apple-icon-180.png", size: 180, cell: 22 },
];

export const SVG_OUT = "export/app-icon/app-icon.svg";

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function rgbOf(color) {
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
}

/** 8×8 の格子を 1 マス cell px で中央に置き、外は背景色。RGB(1 画素 3 バイト)を返す */
export function renderPixels(size, cell) {
  const offset = Math.floor((size - cell * 8) / 2);
  const rgb = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offset) / cell);
      const gy = Math.floor((y - offset) / cell);
      const inside = x >= offset && y >= offset && gx < 8 && gy < 8;
      const [r, g, b] = rgbOf(COLORS[inside ? GRID[gy][gx] : "."]);
      const i = (y * size + x) * 3;
      rgb[i] = r;
      rgb[i + 1] = g;
      rgb[i + 2] = b;
    }
  }
  return rgb;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** 8bit・RGB(color type 2)・フィルター 0 の PNG */
export function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // ビットの深さ
  ihdr[9] = 2; // RGB(透明なし)
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([SIG, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/** 大きさと color type はどの PNG でも読む。画素(rgb)は encodePng と同じ形(RGB・フィルター 0)のときだけ */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error("PNG ではありません");
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  let rgb = Buffer.alloc(0);
  if (colorType === 2) {
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = width * 3;
    rgb = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) {
      if (raw[y * (stride + 1)] !== 0) throw new Error("フィルター 0 の PNG だけ画素を読めます");
      raw.copy(rgb, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    }
  }
  return { width, height, colorType, rgb };
}

/** Illustrator 用(仕上がり 512×512、1 マス 64px)。レイヤー = 01_background・02_mark・guide_maskable_safe_zone(非表示) */
export function renderSvg() {
  const cell = 64;
  const groups = new Map();
  GRID.forEach((row, y) => {
    [...row].forEach((key, x) => {
      if (key === ".") return;
      const color = COLORS[key];
      if (!groups.has(color)) groups.set(color, []);
      groups.get(color).push(`    <rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`);
    });
  });
  const mark = [...groups].map(([color, rects]) => `   <g fill="${color}">\n${rects.join("\n")}\n   </g>`).join("\n");
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" shape-rendering="crispEdges">',
    "  <title>ロビラボ アプリのアイコン(仮。ドット絵の「ロ」)</title>",
    '  <g id="01_background">',
    `    <rect width="512" height="512" fill="${BG}"/>`,
    "  </g>",
    '  <g id="02_mark">',
    mark,
    "  </g>",
    '  <g id="guide_maskable_safe_zone" display="none">',
    `    <circle cx="256" cy="256" r="${MASKABLE_SAFE_RADIUS}" fill="none" stroke="#39F3FF" stroke-width="2"/>`,
    "  </g>",
    "</svg>",
    "",
  ].join("\n");
}

function main() {
  for (const icon of ICONS) {
    const png = encodePng(icon.size, icon.size, renderPixels(icon.size, icon.cell));
    for (const file of [icon.out, icon.copy]) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, png);
      console.log(`${file}\t${icon.size}×${icon.size}\t${png.length} bytes`);
    }
  }
  fs.mkdirSync(path.dirname(SVG_OUT), { recursive: true });
  fs.writeFileSync(SVG_OUT, renderSvg());
  console.log(SVG_OUT);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

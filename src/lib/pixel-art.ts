/**
 * 追補 7-1:コードで描くドット絵。"#" が塗るマス、"." が空き。
 * scripts/export-pixel-art.mjs からも読むので "@/" の import を使わない。
 */
export type PixelRole = "highlight" | "secondary";
export type PixelGrid = { id: string; title: string; size: 8 | 12 | 16; role: PixelRole; rows: readonly string[] };

/** 画面で使う色(CSS の変数)と、Illustrator に書き出す色(globals.css の値と同じ) */
export const PIXEL_VAR: Record<PixelRole, string> = { highlight: "var(--rl-highlight)", secondary: "var(--rl-secondary-text)" };
export const PIXEL_HEX: Record<PixelRole, string> = { highlight: "#FF4FD8", secondary: "#A99BFF" };

/** 入口:診断(フラスコ) */
export const FLASK_16: PixelGrid = {
  id: "flask", title: "診断(フラスコ)", size: 16, role: "secondary",
  rows: [
    "....########....",
    "......#..#......",
    "......#..#......",
    "......#..#......",
    ".....#....#.....",
    "....#......#....",
    "...#........#...",
    "..#..........#..",
    ".#............#.",
    ".##############.",
    ".##############.",
    ".##############.",
    ".##############.",
    "..############..",
    "................",
    "................",
  ],
};

/** 入口:感度(定規) */
export const RULER_16: PixelGrid = {
  id: "ruler", title: "感度(定規)", size: 16, role: "secondary",
  rows: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "################",
    "#.#.#.#.#.#.#.##",
    "#...#...#...#..#",
    "#..............#",
    "################",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
};

/** 入口:仲間(3 人) */
export const PARTY_16: PixelGrid = {
  id: "party", title: "仲間(3 人)", size: 16, role: "secondary",
  rows: [
    "................",
    "................",
    "......####......",
    "......####......",
    "..##..####..##..",
    "..##...##...##..",
    ".####.####.####.",
    ".####.####.####.",
    ".####.####.####.",
    ".####.####.####.",
    ".#..#.#..#.#..#.",
    ".#..#.#..#.#..#.",
    "................",
    "................",
    "................",
    "................",
  ],
};

/** /aim の連続日数(炎) */
export const FLAME_8: PixelGrid = {
  id: "flame", title: "連続日数(炎)", size: 8, role: "highlight",
  rows: [
    "...#....",
    "...##...",
    "..###...",
    "..####..",
    ".######.",
    ".##.###.",
    ".#...##.",
    "..###...",
  ],
};

/** 404(一部が欠けた 12×12 のマス) */
export const BROKEN_12: PixelGrid = {
  id: "broken", title: "404(欠けたマス)", size: 12, role: "secondary",
  rows: [
    "############",
    "############",
    "############",
    "############",
    "#########.##",
    "########...#",
    "#######.....",
    "######......",
    "#####.......",
    "######..#...",
    "#######.....",
    "########..#.",
  ],
};

export const PIXEL_GRIDS: readonly PixelGrid[] = [FLASK_16, RULER_16, PARTY_16, FLAME_8, BROKEN_12];

export function pixelCells(grid: PixelGrid): { x: number; y: number }[] {
  return grid.rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === "#" ? [{ x, y }] : [])));
}

/** Illustrator で開ける SVG(1 マス 8px。レイヤー名は <g id>) */
export function pixelGridSvg(grid: PixelGrid): string {
  const rects = pixelCells(grid).map(({ x, y }) => `    <rect x="${x}" y="${y}" width="1" height="1"/>`).join("\n");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid.size} ${grid.size}" width="${grid.size * 8}" height="${grid.size * 8}" shape-rendering="crispEdges">`,
    `  <title>${grid.title}</title>`,
    `  <g id="${grid.id}" fill="${PIXEL_HEX[grid.role]}">`,
    rects,
    `  </g>`,
    `</svg>`,
    "",
  ].join("\n");
}

/** 追補 5-4:ヒーローの下の階段の境目(8px の段、高さ 24px)の 1 枚分。塗った所が下の地(--rl-bg)になる */
export const STAIR_TILE = { width: 64, height: 24, path: "M0 24V16H16V8H32V0H48V24Z" } as const;

export function stairSvg(tiles = 4): string {
  const w = STAIR_TILE.width * tiles;
  const paths = Array.from({ length: tiles }, (_, i) => `    <path transform="translate(${i * STAIR_TILE.width} 0)" d="${STAIR_TILE.path}"/>`).join("\n");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${STAIR_TILE.height}" width="${w}" height="${STAIR_TILE.height}" shape-rendering="crispEdges">`,
    `  <title>ヒーローの下の階段の境目</title>`,
    `  <g id="stair" fill="#0A0C16">`,
    paths,
    `  </g>`,
    `</svg>`,
    "",
  ].join("\n");
}

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

/** キャラ図鑑のロールの記号(自前のドット絵。公式の絵・アイコンは使わない):盾=前に立つ・守る */
export const SHIELD_12: PixelGrid = {
  id: "shield", title: "ロールの記号(盾)", size: 12, role: "secondary",
  rows: [
    "............",
    ".##########.",
    ".#........#.",
    ".#..####..#.",
    ".#..####..#.",
    ".#..####..#.",
    ".#........#.",
    "..#......#..",
    "..#......#..",
    "...#....#...",
    "....####....",
    "............",
  ],
};

/** ロールの記号(照準)=撃ち合い・火力 */
export const CROSSHAIR_12: PixelGrid = {
  id: "crosshair", title: "ロールの記号(照準)", size: 12, role: "secondary",
  rows: [
    "###......###",
    "#..........#",
    "#..........#",
    "............",
    "............",
    ".....##.....",
    ".....##.....",
    "............",
    "............",
    "#..........#",
    "#..........#",
    "###......###",
  ],
};

/** ロールの記号(十字)=味方を支える */
export const CROSS_12: PixelGrid = {
  id: "cross", title: "ロールの記号(十字)", size: 12, role: "secondary",
  rows: [
    "....####....",
    "....####....",
    "....####....",
    "....####....",
    "############",
    "############",
    "############",
    "############",
    "....####....",
    "....####....",
    "....####....",
    "....####....",
  ],
};

/** ロールの記号(目)=情報・隠れる。ロールのないゲームと、型を決めていないキャラにも使う */
export const EYE_12: PixelGrid = {
  id: "eye", title: "ロールの記号(目)", size: 12, role: "secondary",
  rows: [
    "............",
    "............",
    "....####....",
    "..##....##..",
    ".#...##...#.",
    "#...####...#",
    "#...####...#",
    ".#...##...#.",
    "..##....##..",
    "....####....",
    "............",
    "............",
  ],
};

/** ロールの記号(旗)=陣地・設置 */
export const FLAG_12: PixelGrid = {
  id: "flag", title: "ロールの記号(旗)", size: 12, role: "secondary",
  rows: [
    ".#..........",
    ".########...",
    ".#########..",
    ".##########.",
    ".#########..",
    ".########...",
    ".#..........",
    ".#..........",
    ".#..........",
    ".#..........",
    ".#..........",
    "###.........",
  ],
};

/** ロールの記号(稲妻)=機動・追う */
export const BOLT_12: PixelGrid = {
  id: "bolt", title: "ロールの記号(稲妻)", size: 12, role: "secondary",
  rows: [
    "......###...",
    ".....###....",
    "....###.....",
    "...###......",
    "..########..",
    "..########..",
    "......###...",
    ".....###....",
    "....###.....",
    "...###......",
    "..##........",
    "............",
  ],
};

/** ゲームの記号(Apex):3 人の部隊。キャラ図鑑の目次で VALORANT の照準と見分けるため(採点 1 回目 P1) */
export const SQUAD_12: PixelGrid = {
  id: "squad", title: "ゲームの記号(3 人の部隊)", size: 12, role: "secondary",
  rows: [
    "............",
    ".....##.....",
    ".....##.....",
    "............",
    ".##..##..##.",
    ".##.####.##.",
    "....####....",
    "####.##.####",
    "####....####",
    "####....####",
    "............",
    "############",
  ],
};

export const PIXEL_GRIDS: readonly PixelGrid[] = [FLASK_16, RULER_16, PARTY_16, FLAME_8, BROKEN_12, SHIELD_12, CROSSHAIR_12, CROSS_12, EYE_12, FLAG_12, BOLT_12, SQUAD_12];

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
export const STAIR_TILE = { width: 64, height: 24, path: "M0 24V16H16V8H32V0H48V24Z", upper: "M0 0H32V8H16V16H0Z M48 0H64V24H48Z" } as const;

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

/** 追補 6 章:マスのバー(既定 10 マス)で塗るマスの数。% を四捨五入し、0〜cells に収める */
export const PIXEL_BAR_CELLS = 10;

export function pixelBarFill(pct: number, cells = PIXEL_BAR_CELLS): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(cells, Math.max(0, Math.round((pct / 100) * cells)));
}

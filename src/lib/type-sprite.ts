/**
 * 16 タイプの仮のドット絵(12×12)を、4 文字のコードから組み立てる(設計書 2-5)。
 * 社長の絵(public/types/CODE.png)ができたら、TypeIcon がそちらを優先する。
 * scripts/export-type-icons.mjs からも読むので、"@/" の import を使わない。
 */
export type SpriteRole = "body" | "head" | "side" | "aura" | "eye";
export type SpriteCell = { x: number; y: number; w: number; h: number; role: SpriteRole };
export type Heat = "H" | "Z";

export const SPRITE_SIZE = 12;
/** 描く順(目は体の上に重ねて穴に見せる) */
export const SPRITE_ROLES: readonly SpriteRole[] = ["body", "head", "side", "aura", "eye"];

const CODE_RE = /^[AG][RB][CL][HZ]$/;
type P = readonly [number, number];
const LAST = SPRITE_SIZE - 1;
const mirror = (cells: readonly P[]): P[] => cells.flatMap(([x, y]): P[] => [[x, y], [LAST - x, y]]);
const row = (y: number, from: number, to: number): P[] => Array.from({ length: to - from + 1 }, (_, i): P => [from + i, y]);

const BODY: readonly P[] = [...row(5, 2, 9), ...row(6, 2, 9), ...row(7, 2, 9), ...row(8, 2, 9), ...mirror([[3, 9], [4, 9]])];
const HEAD: Record<"A" | "G", readonly P[]> = {
  A: mirror([[5, 2], [2, 2], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4]]),
  G: [...row(2, 3, 8), ...row(3, 3, 8), ...row(4, 1, 10)],
};
const EYES: Record<"R" | "B", readonly P[]> = {
  R: [...mirror([[2, 6], [3, 7]]), [6, 5], [5, 6], [6, 7]],
  B: mirror([[3, 6], [4, 6], [5, 6], [3, 7], [4, 7]]),
};
const SIDES: Record<"C" | "L", readonly P[]> = {
  C: [[0, 6], [11, 6], ...row(10, 2, 9)],
  L: [...row(9, 9, 11), ...row(10, 9, 11)],
};
const AURA: Record<Heat, readonly P[]> = {
  H: [[6, 0], [5, 1], [6, 1]],
  Z: [[5, 0], [7, 0], [6, 1]],
};

const cells = (points: readonly P[], role: SpriteRole): SpriteCell[] => points.map(([x, y]) => ({ x, y, w: 1, h: 1, role }));

export function buildTypeSprite(code: string): SpriteCell[] | null {
  if (!CODE_RE.test(code)) return null;
  const [attack, instinct, team, heat] = code.split("") as ["A" | "G", "R" | "B", "C" | "L", Heat];
  return [
    ...cells(BODY, "body"),
    ...cells(HEAD[attack], "head"),
    ...cells(SIDES[team], "side"),
    ...cells(AURA[heat], "aura"),
    ...cells(EYES[instinct], "eye"),
  ];
}

export type SpriteRow = { y: number; cells: SpriteCell[] };

/**
 * 12 行に分けた絵(追補 S2:診断で 1 行ずつ点け、最後に行ごとに塗り替えるため)。
 * 空の行も含めて必ず 12 行。行の中の順は buildTypeSprite と同じ(目は体の後)。
 */
export function spriteRows(code: string): SpriteRow[] | null {
  const sprite = buildTypeSprite(code);
  if (!sprite) return null;
  return Array.from({ length: SPRITE_SIZE }, (_, y) => ({ y, cells: sprite.filter((c) => c.y === y) }));
}

export function heatOf(code: string): Heat {
  return code.endsWith("H") ? "H" : "Z";
}

export function spriteFill(role: SpriteRole, heat: Heat): string {
  if (role === "eye") return "var(--rl-bg)";
  if (role === "aura") return heat === "H" ? "var(--rl-success)" : "var(--rl-text)";
  return heat === "H" ? "var(--rl-highlight)" : "var(--rl-secondary-text)";
}

/** CSS の変数を読めない所(Illustrator)に書き出すときの色。globals.css の値と同じ(テストで確かめる)。 */
export const SPRITE_HEX: Readonly<Record<string, string>> = {
  "var(--rl-bg)": "#0A0C16",
  "var(--rl-surface)": "#151A33",
  "var(--rl-success)": "#B6FF3B",
  "var(--rl-text)": "#EAF6FF",
  "var(--rl-highlight)": "#FF4FD8",
  "var(--rl-secondary-text)": "#A99BFF",
};

const GROUP_ID: Record<SpriteRole, string> = { body: "body", head: "head", side: "sides", aura: "aura", eye: "eyes" };

export function typeSpriteSvg(code: string): string | null {
  const sprite = buildTypeSprite(code);
  if (!sprite) return null;
  const heat = heatOf(code);
  const groups = SPRITE_ROLES.map((role) => {
    const rects = sprite
      .filter((c) => c.role === role)
      .map((c) => `    <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}"/>`)
      .join("\n");
    return `  <g id="${GROUP_ID[role]}" fill="${SPRITE_HEX[spriteFill(role, heat)]}">\n${rects}\n  </g>`;
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="480" height="480" shape-rendering="crispEdges">`,
    `  <title>${code}</title>`,
    `  <g id="background"><rect width="12" height="12" fill="${SPRITE_HEX["var(--rl-surface)"]}"/></g>`,
    ...groups,
    `</svg>`,
    "",
  ].join("\n");
}

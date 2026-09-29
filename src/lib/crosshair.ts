export type CrosshairShape = "cross" | "dot" | "circle" | "cross-dot";
export type Crosshair = { shape: CrosshairShape; color: string; length: number; thickness: number; gap: number; outline: boolean };

export const CROSSHAIR_SHAPES: CrosshairShape[] = ["cross", "dot", "circle", "cross-dot"];
/** 色の候補:ブランドの4色+白・黄・赤・緑 */
export const CROSSHAIR_COLORS = ["#39f3ff", "#ff4fd8", "#7b61ff", "#b6ff3b", "#ffffff", "#ffe14d", "#ff6b6b", "#4dff88"];
// DB の save_my_settings(20261001001300)と同じ値
export const CROSSHAIR_LIMITS = { lengthMin: 1, lengthMax: 20, thicknessMin: 1, thicknessMax: 6, gapMin: 0, gapMax: 10 } as const;
export const CROSSHAIR_DEFAULT: Crosshair = { shape: "cross", color: "#39f3ff", length: 6, thickness: 2, gap: 3, outline: true };

const KEYS = ["shape", "color", "length", "thickness", "gap", "outline"];
const intIn = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function isValidCrosshair(v: unknown): v is Crosshair {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o);
  const L = CROSSHAIR_LIMITS;
  return (
    keys.length === KEYS.length && KEYS.every((k) => keys.includes(k)) &&
    CROSSHAIR_SHAPES.includes(o.shape as CrosshairShape) &&
    typeof o.color === "string" && /^#[0-9a-fA-F]{6}$/.test(o.color) &&
    intIn(o.length, L.lengthMin, L.lengthMax) && intIn(o.thickness, L.thicknessMin, L.thicknessMax) && intIn(o.gap, L.gapMin, L.gapMax) &&
    typeof o.outline === "boolean"
  );
}

/** Canvas の中心 (cx, cy) にクロスヘアを描く。縁取りは黒で1px外側。 */
export function drawCrosshair(ctx: CanvasRenderingContext2D, c: Crosshair, cx: number, cy: number): void {
  const t = c.thickness;
  const rects: [number, number, number, number][] = [];
  if (c.shape === "cross" || c.shape === "cross-dot") {
    const h = t / 2;
    rects.push([cx + c.gap, cy - h, c.length, t], [cx - c.gap - c.length, cy - h, c.length, t]);
    rects.push([cx - h, cy + c.gap, t, c.length], [cx - h, cy - c.gap - c.length, t, c.length]);
  }
  if (c.shape === "dot" || c.shape === "cross-dot") rects.push([cx - t / 2, cy - t / 2, t, t]);
  if (c.outline) {
    ctx.fillStyle = "#000000";
    for (const [x, y, w, h] of rects) ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  }
  ctx.fillStyle = c.color;
  for (const [x, y, w, h] of rects) ctx.fillRect(x, y, w, h);
  if (c.shape === "circle") {
    const r = c.gap + c.length / 2;
    if (c.outline) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = t + 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = c.color;
    ctx.lineWidth = t;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

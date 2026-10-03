/**
 * ソールの厚さの目盛り(同じ物差しで行どうしを比べる)。0〜1.5mm を横 120px、0.5mm ごとの目盛り。
 * 公式に 1 つの数字があるときだけ描く(幅の表記・記載なし・物差しの外は描かない。作った数字を出さない)。単位は px。
 */
export const THICKNESS_SCALE = { maxMm: 1.5, stepMm: 0.5, widthPx: 120, padPx: 4, heightPx: 16, markPx: 8 } as const;

export type ThicknessScaleGeometry = {
  viewBox: string; width: number; height: number;
  ticks: { mm: number; x: number }[];
  markX: number;
  lineY: number;
};

export function thicknessScale(mm: number | null): ThicknessScaleGeometry | null {
  if (mm === null || !Number.isFinite(mm) || mm <= 0 || mm > THICKNESS_SCALE.maxMm) return null;
  const { maxMm, stepMm, widthPx, padPx, heightPx } = THICKNESS_SCALE;
  const pxPerMm = widthPx / maxMm;
  const n = Math.round(maxMm / stepMm);
  const ticks = Array.from({ length: n + 1 }, (_, i) => ({ mm: Math.round(i * stepMm * 10) / 10, x: padPx + i * stepMm * pxPerMm }));
  const width = widthPx + padPx * 2;
  return { viewBox: `0 0 ${width} ${heightPx}`, width, height: heightPx, ticks, markX: padPx + mm * pxPerMm, lineY: heightPx - 4 };
}

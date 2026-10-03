import type { MouseConnection, MouseShape, PadSurface, SkateMaterial, SkateShape } from "@/data/gear-types";

/** 公式に数字・言葉がないとき(作らない。空欄の代わりにこの言葉を出す) */
export const NO_DATA = "公式の記載なし";

const SHAPE: Record<MouseShape, string> = { symmetric: "左右対称", right: "右手用" };
const CONNECTION: Record<MouseConnection, string> = { wired: "有線", wireless: "無線", both: "有線・無線" };
export const SURFACE_LABEL: Record<PadSurface, string> = { cloth: "布", hybrid: "ハイブリッド", glass: "ガラス", hard: "ハード", other: "その他" };
export const SKATE_MATERIAL_LABEL: Record<SkateMaterial, string> = {
  PTFE: "PTFE", glass: "ガラス", ceramic: "セラミック", UPE: "UPE(超高分子量ポリエチレン)", other: "その他",
};
export const SKATE_SHAPE_LABEL: Record<SkateShape, string> = { full: "機種専用の形", dot: "汎用のドット", other: "その他の形" };

export const shapeLabel = (s: MouseShape | null): string => (s === null ? NO_DATA : SHAPE[s]);
export const connectionLabel = (c: MouseConnection | null): string => (c === null ? NO_DATA : CONNECTION[c]);
export const surfaceLabel = (s: PadSurface | null): string => (s === null ? NO_DATA : SURFACE_LABEL[s]);
export const materialLabel = (m: SkateMaterial | null): string => (m === null ? NO_DATA : SKATE_MATERIAL_LABEL[m]);

/** 数字+単位。公式の表記のまま(丸めない)。null は NO_DATA */
export function withUnit(n: number | null, unit: "mm" | "g"): string {
  return n === null ? NO_DATA : `${n}${unit}`;
}

/** ソールの入数(粒・枚の数とセット数。公式に書いてあるものだけ) */
export function packText(pieces: number | null, sets: number | null): string {
  if (pieces !== null && sets !== null) return `${sets} セット(${pieces} 枚)`;
  if (sets !== null) return `${sets} セット`;
  if (pieces !== null) return `${pieces} 枚`;
  return NO_DATA;
}

/** パッドの幅×奥行き(片方でもなければ NO_DATA) */
export function padSizeText(widthMm: number | null, depthMm: number | null): string {
  return widthMm === null || depthMm === null ? NO_DATA : `${widthMm}×${depthMm}mm`;
}

/** ソールの厚さ:公式に 1 つの数字があるときだけ mm。幅の表記などは公式の原文のまま */
export function skateThicknessText(mm: number | null, official: string | null): string {
  if (mm !== null) return `${mm}mm`;
  return official ?? NO_DATA;
}

/** 画面用の厚さ:1 つの数字は mm、公式の原文(幅の表記など)はかぎ括弧と注記で原文だと分かるように */
export function skateThicknessLabel(mm: number | null, official: string | null): string {
  if (mm !== null) return `${mm}mm`;
  return official === null ? NO_DATA : `「${official}」(公式の表記)`;
}

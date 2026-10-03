/**
 * マウス・マウスパッド・マウスソールの型。データは scripts/gear-data.ts が docs/content/gear/*.json から作る(手で直さない)。
 * 数字はメーカー公式の表記だけ。公式にないものは null(理由は note)。価格は持たない。
 */
export type MouseShape = "symmetric" | "right";
export type MouseConnection = "wired" | "wireless" | "both";

export type MouseSpec = {
  id: string;
  brand: string;
  name: string;
  lengthMm: number | null;
  /** いちばん広いところ */
  widthMm: number | null;
  heightMm: number | null;
  /** 標準の構成(公式の表記どおり。電池式は電池込み) */
  weightG: number | null;
  shape: MouseShape | null;
  connection: MouseConnection | null;
  sensor: string | null;
  /** 数字の出典(メーカー公式のページ) */
  officialUrl: string;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
  /** 人気の根拠(出典と順位) */
  selectionBasis: string;
  /** null の理由・原文の表記 */
  note: string;
  discontinued: boolean;
};

export type PadSurface = "cloth" | "hybrid" | "glass" | "hard" | "other";
/** 1 つのサイズ(公式の表記。widthMm = 横幅、depthMm = 奥行き、thicknessMm = 厚さ) */
export type PadSize = { label: string; widthMm: number | null; depthMm: number | null; thicknessMm: number | null };
export type PadSpec = {
  id: string;
  brand: string;
  name: string;
  surface: PadSurface | null;
  /** 滑り・止めの公式の言葉(そのまま。点数にしない) */
  speedOfficial: string | null;
  /** 硬さ違い(公式の呼び名) */
  firmnessVariants: string[];
  sizes: PadSize[];
  base: string | null;
  stitchedEdge: boolean | null;
  officialUrl: string | null;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
  /** 人気の根拠(出典と順位) */
  selectionBasis: string;
  note: string;
  /** 公式の数字が 1 つもない(画面に出さない) */
  hidden: boolean;
  discontinued: boolean;
};

export type SkateMaterial = "PTFE" | "glass" | "ceramic" | "UPE" | "other";
export type SkateShape = "full" | "dot" | "other";
export type SkateSpec = {
  id: string;
  brand: string;
  line: string;
  name: string;
  /** 公式の対応マウスの表記(原文) */
  forMouse: string;
  /** 合うマウスの id(src/data/devices.ts)。汎用・結び付けを保留したものは空 */
  mouseIds: string[];
  material: SkateMaterial | null;
  materialOfficial: string | null;
  shape: SkateShape;
  /** 公式に 1 つの値で書かれているときだけ */
  thicknessMm: number | null;
  /** 厚さの公式の原文(幅の表記など) */
  thicknessOfficial: string | null;
  piecesPerPack: number | null;
  setsPerPack: number | null;
  extras: string[];
  officialUrl: string;
  checkedAt: string;
  selectionBasis: string;
  note: string;
  discontinued: boolean;
};

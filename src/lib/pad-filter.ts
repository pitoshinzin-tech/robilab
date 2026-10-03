import type { PadSize, PadSpec, PadSurface } from "@/data/gear-types";
import { firstParam, pick, queryHref, type SearchParams } from "@/lib/gear-query";

export type PadSizeClass = "S" | "M" | "L" | "XL" | "XXL";
export type PadThickness = "thin" | "normal" | "thick";
export type PadFilter = {
  surface: "all" | Exclude<PadSurface, "other">;
  size: "all" | PadSizeClass;
  thickness: "all" | PadThickness;
  /** variants = 硬さを 2 種類以上から選べるもの */
  firmness: "all" | "variants";
};
export const NO_PAD_FILTER: PadFilter = { surface: "all", size: "all", thickness: "all", firmness: "all" };

/** 大きさの目安(ロビラボの決め方:公式の横幅で分ける。机の幅に合わせて選ぶため) */
export const SIZE_CLASSES: readonly { id: PadSizeClass; minWidthMm: number; hint: string }[] = [
  { id: "S", minWidthMm: 0, hint: "幅 300mm 未満" },
  { id: "M", minWidthMm: 300, hint: "幅 300〜399mm" },
  { id: "L", minWidthMm: 400, hint: "幅 400〜479mm" },
  { id: "XL", minWidthMm: 480, hint: "幅 480〜599mm" },
  { id: "XXL", minWidthMm: 600, hint: "幅 600mm 以上(キーボードも乗る)" },
];
export const THICKNESS_CLASSES: readonly { id: PadThickness; label: string; hint: string }[] = [
  { id: "thin", label: "薄い", hint: "3mm 未満" },
  { id: "normal", label: "ふつう", hint: "3〜4.9mm" },
  { id: "thick", label: "厚い", hint: "5mm 以上" },
];

export function sizeClass(widthMm: number | null): PadSizeClass | null {
  if (widthMm === null || !(widthMm > 0)) return null;
  let found: PadSizeClass = "S";
  for (const c of SIZE_CLASSES) if (widthMm >= c.minWidthMm) found = c.id;
  return found;
}

export function thicknessClass(mm: number | null): PadThickness | null {
  if (mm === null || !(mm > 0)) return null;
  return mm < 3 ? "thin" : mm < 5 ? "normal" : "thick";
}

export function parsePadFilter(sp: SearchParams): PadFilter {
  return {
    surface: pick(firstParam(sp, "surface"), ["all", "cloth", "hybrid", "glass", "hard"] as const, "all"),
    size: pick(firstParam(sp, "size"), ["all", "S", "M", "L", "XL", "XXL"] as const, "all"),
    thickness: pick(firstParam(sp, "thickness"), ["all", "thin", "normal", "thick"] as const, "all"),
    firmness: pick(firstParam(sp, "firmness"), ["all", "variants"] as const, "all"),
  };
}

export function padFilterHref(f: PadFilter, patch: Partial<PadFilter> = {}): string {
  const n = { ...f, ...patch };
  return queryHref("/pads", [["surface", n.surface], ["size", n.size], ["thickness", n.thickness], ["firmness", n.firmness]]);
}

export function isPadFilterEmpty(f: PadFilter): boolean {
  return f.surface === "all" && f.size === "all" && f.thickness === "all" && f.firmness === "all";
}

/** 画面に出すパッド(公式の数字が 1 つもない hidden と、公式 URL のないものを除く) */
export type VisiblePad = PadSpec & { officialUrl: string };
export function visiblePads(pads: readonly PadSpec[]): VisiblePad[] {
  return pads.filter((p): p is VisiblePad => !p.hidden && p.officialUrl !== null);
}

export type PadMatch = { pad: VisiblePad; sizes: PadSize[] };
/**
 * 絞り込み(並びは変えない)。面・硬さはパッドで、大きさ・厚さはサイズごとに見る。
 * 大きさか厚さで絞ったときは、合うサイズだけを sizes に残す。公式の数字がないサイズはどの目安にも入らない。
 */
export function filterPads(pads: readonly VisiblePad[], f: PadFilter): PadMatch[] {
  const bySize = f.size !== "all" || f.thickness !== "all";
  const out: PadMatch[] = [];
  for (const pad of pads) {
    if (f.surface !== "all" && pad.surface !== f.surface) continue;
    if (f.firmness === "variants" && pad.firmnessVariants.length < 2) continue;
    const sizes = pad.sizes.filter(
      (s) => (f.size === "all" || sizeClass(s.widthMm) === f.size) && (f.thickness === "all" || thicknessClass(s.thicknessMm) === f.thickness),
    );
    if (bySize && sizes.length === 0) continue;
    out.push({ pad, sizes });
  }
  return out;
}

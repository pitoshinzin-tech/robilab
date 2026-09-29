import type { Grip, MySettings } from "@/lib/my-settings";
import type { MouseSpec } from "@/data/mice";

/**
 * 手の大きさ × 係数 = ちょうどいいマウスの長さ・幅の目安(docs/superpowers/specs/2026-09-29-mouse-finder-design.md 4.1)。
 * 係数は一般的な手のサイズ表の考え方を元にした仮の値。本人の手応えで調整する。
 */
export const FIT_COEF: Record<Grip, { length: number; width: number }> = {
  palm: { length: 0.64, width: 0.62 },
  claw: { length: 0.6, width: 0.6 },
  fingertip: { length: 0.56, width: 0.56 },
};
/** 目安の範囲(±mm) */
export const RANGE_MM = { length: 4, width: 3 };
/** ずれの距離で「1」とみなす mm(幅のずれを長さより重く見る) */
const SCALE_MM = { length: 6, width: 4 };
/** この距離で合う度が 0 になる */
const ZERO_AT = 3;

export type Hand = { lengthCm: number; widthCm: number | null; grip: Grip };
export type Target = { lengthMm: number; widthMm: number | null };
export type Ranked = { mouse: MouseSpec; distance: number; score: number; reasons: string[] };
export type MouseFilter = {
  weight: "all" | "le55" | "le70" | "gt70";
  shape: "all" | MouseSpec["shape"];
  connection: "all" | MouseSpec["connection"];
};
export const NO_FILTER: MouseFilter = { weight: "all", shape: "all", connection: "all" };

const round1 = (x: number) => Math.round(x * 10) / 10;

export function fitTarget(h: Hand): Target {
  const c = FIT_COEF[h.grip];
  return { lengthMm: round1(h.lengthCm * 10 * c.length), widthMm: h.widthCm === null ? null : round1(h.widthCm * 10 * c.width) };
}

export function targetText(t: Target): string {
  const range = (v: number, r: number) => `${Math.round(v - r)}〜${Math.round(v + r)}mm`;
  const length = `長さ ${range(t.lengthMm, RANGE_MM.length)}`;
  return t.widthMm === null ? length : `${length}・幅 ${range(t.widthMm, RANGE_MM.width)}`;
}

export function fitDistance(t: Target, m: Pick<MouseSpec, "lengthMm" | "widthMm">): number {
  const dl = (m.lengthMm - t.lengthMm) / SCALE_MM.length;
  const dw = t.widthMm === null ? 0 : (m.widthMm - t.widthMm) / SCALE_MM.width;
  return Math.sqrt(dl * dl + dw * dw);
}

export function fitScore(d: number): number {
  return Math.round(100 * Math.max(0, 1 - d / ZERO_AT));
}

type Verdict = "ok" | "small" | "large";
function verdict(actual: number, target: number, range: number): Verdict {
  // 浮動小数の誤差で境目がずれないよう、0.1mm 単位にそろえて比べる
  const diff = round1(actual - target);
  if (diff < -range) return "small";
  if (diff > range) return "large";
  return "ok";
}
const REASON: Record<"length" | "width", Record<Verdict, string>> = {
  length: { ok: "長さが目安どおり", small: "長さがやや短め(細かい操作向き)", large: "長さがやや長め(安定しやすい)" },
  width: { ok: "幅が目安どおり", small: "幅がやや狭め", large: "幅がやや広め" },
};

/** 目安に近い順(同じなら軽い順、それも同じなら id 順)。 */
export function rankMice(h: Hand, mice: MouseSpec[]): Ranked[] {
  const t = fitTarget(h);
  return mice
    .map((mouse) => {
      const distance = fitDistance(t, mouse);
      const reasons = [REASON.length[verdict(mouse.lengthMm, t.lengthMm, RANGE_MM.length)]];
      if (t.widthMm !== null) reasons.push(REASON.width[verdict(mouse.widthMm, t.widthMm, RANGE_MM.width)]);
      return { mouse, distance, score: fitScore(distance), reasons };
    })
    .sort((a, b) => a.distance - b.distance || a.mouse.weightG - b.mouse.weightG || (a.mouse.id < b.mouse.id ? -1 : a.mouse.id > b.mouse.id ? 1 : 0));
}

/** 絞り込み(並び順は変えない)。 */
export function applyFilter(list: Ranked[], f: MouseFilter): Ranked[] {
  return list.filter(({ mouse: m }) => {
    if (f.weight === "le55" && m.weightG > 55) return false;
    if (f.weight === "le70" && m.weightG > 70) return false;
    if (f.weight === "gt70" && m.weightG <= 70) return false;
    if (f.shape !== "all" && m.shape !== f.shape) return false;
    if (f.connection !== "all" && m.connection !== f.connection) return false;
    return true;
  });
}

/** 今のマウスとの差。差の絶対値が 1 以下は「ほぼ同じ」。 */
export function compareWith(current: MouseSpec, m: MouseSpec): string {
  if (current.id === m.id) return "今使っているマウス";
  const items: [string, number, string][] = [
    ["長さ", m.lengthMm - current.lengthMm, "mm"],
    ["幅", m.widthMm - current.widthMm, "mm"],
    ["高さ", m.heightMm - current.heightMm, "mm"],
    ["重さ", m.weightG - current.weightG, "g"],
  ];
  if (items.every(([, d]) => Math.abs(d) <= 1)) return "今のマウスとほぼ同じ大きさ・重さ";
  const fmt = (d: number, unit: string) => {
    if (Math.abs(d) <= 1) return "ほぼ同じ";
    const v = round1(Math.abs(d));
    return `${d < 0 ? "−" : "+"}${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  };
  return "今のマウスより " + items.map(([label, d, unit]) => `${label} ${fmt(d, unit)}`).join("・");
}

/** マイ設定の手の情報から、計算に使える形にする(長さと持ち方が必要。幅はなくてよい)。 */
export function handFrom(hand: MySettings["hand"] | null): Hand | null {
  if (!hand || hand.lengthCm === null || hand.grip === null) return null;
  return { lengthCm: hand.lengthCm, widthCm: hand.widthCm, grip: hand.grip };
}

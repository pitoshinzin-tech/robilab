import { MY_SETTINGS_LIMITS, type Grip, type MySettings } from "@/lib/my-settings";
import type { MouseConnection, MouseShape } from "@/data/gear-types";

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
/** 手に合う順に並べられるマウス(公式の長さと幅があるもの)。高さ・重さ・形・接続は公式にないことがある(null) */
export type FitMouse = {
  id: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number | null;
  weightG: number | null;
  shape: MouseShape | null;
  connection: MouseConnection | null;
};
/** 今のマウスとの比べに使う数字(どれも公式にないことがある) */
export type CompareMouse = { id: string; lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightG: number | null };
export type Ranked<M extends FitMouse = FitMouse> = { mouse: M; distance: number; score: number; reasons: string[] };
export type MouseFilter = {
  weight: "all" | "le55" | "le70" | "gt70";
  shape: "all" | MouseShape;
  /** both(有線・無線)のマウスは wired にも wireless にも入る */
  connection: "all" | "wired" | "wireless";
};
export const NO_FILTER: MouseFilter = { weight: "all", shape: "all", connection: "all" };

/** 「すべて」ではない絞り込みの数(畳んだ絞り込みの見出しに出す) */
export function activeFilterCount(f: MouseFilter): number {
  return (Object.keys(NO_FILTER) as (keyof MouseFilter)[]).filter((k) => f[k] !== NO_FILTER[k]).length;
}

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

export function fitDistance(t: Target, m: Pick<FitMouse, "lengthMm" | "widthMm">): number {
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

/** 公式の長さと幅があるか(ないものは順位に入れず「比べられません」へ) */
export function isFitMouse<M extends { lengthMm: number | null; widthMm: number | null }>(m: M): m is M & { lengthMm: number; widthMm: number } {
  return m.lengthMm !== null && m.widthMm !== null;
}

/** 小さい順。null は後ろ */
function nullLast(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

/** 目安に近い順(同じなら軽い順・重さが公式にないものは後ろ、それも同じなら id 順)。 */
export function rankMice<M extends FitMouse>(h: Hand, mice: readonly M[]): Ranked<M>[] {
  const t = fitTarget(h);
  return mice
    .map((mouse) => {
      const distance = fitDistance(t, mouse);
      const reasons = [REASON.length[verdict(mouse.lengthMm, t.lengthMm, RANGE_MM.length)]];
      if (t.widthMm !== null) reasons.push(REASON.width[verdict(mouse.widthMm, t.widthMm, RANGE_MM.width)]);
      return { mouse, distance, score: fitScore(distance), reasons };
    })
    .sort((a, b) => a.distance - b.distance || nullLast(a.mouse.weightG, b.mouse.weightG) || (a.mouse.id < b.mouse.id ? -1 : a.mouse.id > b.mouse.id ? 1 : 0));
}

/** 絞り込み(並び順は変えない)。重さ・形が公式にないものは、その絞り込みでは外れる。 */
export function applyFilter<M extends FitMouse>(list: readonly Ranked<M>[], f: MouseFilter): Ranked<M>[] {
  return list.filter(({ mouse: m }) => {
    if (f.weight !== "all") {
      if (m.weightG === null) return false;
      if (f.weight === "le55" && m.weightG > 55) return false;
      if (f.weight === "le70" && m.weightG > 70) return false;
      if (f.weight === "gt70" && m.weightG <= 70) return false;
    }
    if (f.shape !== "all" && m.shape !== f.shape) return false;
    if (f.connection !== "all" && m.connection !== f.connection && m.connection !== "both") return false;
    return true;
  });
}

/** 今のマウスとの差(両方に公式の数字がある項目だけ)。差の絶対値が 1 以下は「ほぼ同じ」。比べられる項目がなければ null。 */
export function compareWith(current: CompareMouse, m: CompareMouse): string | null {
  if (current.id === m.id) return "今使っているマウス";
  const all: [string, number | null, number | null, string][] = [
    ["長さ", m.lengthMm, current.lengthMm, "mm"],
    ["幅", m.widthMm, current.widthMm, "mm"],
    ["高さ", m.heightMm, current.heightMm, "mm"],
    ["重さ", m.weightG, current.weightG, "g"],
  ];
  const items: [string, number, string][] = [];
  for (const [label, a, b, unit] of all) if (a !== null && b !== null) items.push([label, a - b, unit]);
  if (items.length === 0) return null;
  if (items.every(([, d]) => Math.abs(d) <= 1)) {
    return items.length === all.length ? "今のマウスとほぼ同じ大きさ・重さ" : `今のマウスと${items.map(([label]) => label).join("・")}がほぼ同じ`;
  }
  const fmt = (d: number, unit: string) => {
    if (Math.abs(d) <= 1) return "ほぼ同じ";
    const v = round1(Math.abs(d));
    return `${d < 0 ? "−" : "+"}${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  };
  return "今のマウスより " + items.map(([label, d, unit]) => `${label} ${fmt(d, unit)}`).join("・");
}

/** 手の長さが未入力のときに使う長さ(cm)。成人の手の長さのおおよその平均。測った値があればそちらを使う。 */
export const DEFAULT_HAND_LENGTH_CM = 18;

/**
 * マイ設定の手の情報から、計算に使える形にする(持ち方が必要。幅・長さはなくてよい)。
 * 長さが未入力なら平均(DEFAULT_HAND_LENGTH_CM)で補い、estimated を true にする。
 */
export function handFrom(hand: MySettings["hand"] | null): { hand: Hand; estimated: boolean } | null {
  if (!hand || hand.grip === null) return null;
  const estimated = hand.lengthCm === null;
  return {
    hand: { lengthCm: hand.lengthCm ?? DEFAULT_HAND_LENGTH_CM, widthCm: hand.widthCm, grip: hand.grip },
    estimated,
  };
}

/**
 * 入力の途中の値から、見本の重ね図に使う手を作る(表示だけ。保存・計算の結果には使わない)。
 * 範囲の外・空欄の長さは平均(DEFAULT_HAND_LENGTH_CM)にして estimated を true、範囲の外の幅は null、持ち方が未選択ならかぶせ持ち。
 */
export function previewHand(hand: MySettings["hand"]): { hand: Hand; estimated: boolean } {
  const L = MY_SETTINGS_LIMITS;
  const inLength = hand.lengthCm !== null && hand.lengthCm >= L.handLengthMin && hand.lengthCm <= L.handLengthMax;
  const inWidth = hand.widthCm !== null && hand.widthCm >= L.handWidthMin && hand.widthCm <= L.handWidthMax;
  return {
    hand: { lengthCm: inLength ? hand.lengthCm! : DEFAULT_HAND_LENGTH_CM, widthCm: inWidth ? hand.widthCm : null, grip: hand.grip ?? "palm" },
    estimated: !inLength,
  };
}

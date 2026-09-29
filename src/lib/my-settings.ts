import { getSensGame } from "@/data/sensitivity";
import { DPI_MIN, DPI_MAX } from "@/lib/sensitivity";
import type { Axes } from "@/data/axes";

/** マイ設定のデータ(版 1)。ブラウザとサーバーで同じ形を使う。 */
export type Grip = "palm" | "claw" | "fingertip";
export type DeviceSlot = "mouse" | "pad" | "keyboard" | "headset";
export type ItemRef = { id: string } | { name: string };

export type MySettings = {
  version: 1;
  updatedAt: string;
  typeCode: string | null;
  axes: Axes | null;
  dpi: number | null;
  mainGame: string | null;
  sens: Record<string, number>;
  hand: { lengthCm: number | null; widthCm: number | null; grip: Grip | null };
  devices: Record<DeviceSlot, ItemRef | null>;
  favoriteGames: ItemRef[];
  cardName: string | null;
};

export type FieldErrors = Record<string, string>;

export const DEVICE_SLOTS: DeviceSlot[] = ["mouse", "pad", "keyboard", "headset"];
export const GRIPS: Grip[] = ["palm", "claw", "fingertip"];
export const TYPE_CODE_RE = /^[AG][RB][CL][HZ]$/;
export const CATALOG_ID_RE = /^[a-z0-9-]{1,40}$/;
// DB の save_my_settings(supabase/migrations/20261001001100_my_settings.sql)と同じ値。
// 変えるときは両方を変える(tests/data/my-settings-sql.test.ts が一致を確認する)。
export const MY_SETTINGS_LIMITS = {
  dpiMin: DPI_MIN,
  dpiMax: DPI_MAX,
  handLengthMin: 10,
  handLengthMax: 25,
  handWidthMin: 5,
  handWidthMax: 15,
  freeTextMax: 40,
  cardNameMax: 20,
  favoriteGamesMax: 6,
} as const;

const KEYS = ["version", "updatedAt", "typeCode", "axes", "dpi", "mainGame", "sens", "hand", "devices", "favoriteGames", "cardName"];
const AXIS_KEYS = ["attack", "instinct", "team", "heat"];
const CONTROL_RE = /[\x00-\x1f\x7f]/;

export function emptyMySettings(now: Date = new Date()): MySettings {
  return {
    version: 1,
    updatedAt: now.toISOString(),
    typeCode: null,
    axes: null,
    dpi: null,
    mainGame: null,
    sens: {},
    hand: { lengthCm: null, widthCm: null, grip: null },
    devices: { mouse: null, pad: null, keyboard: null, headset: null },
    favoriteGames: [],
    cardName: null,
  };
}

/** 入力欄の文字を保存用に整える。前後の空白を削り、空なら null。 */
export function normalizeText(raw: string): string | null {
  const t = raw.trim();
  return t === "" ? null : t;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isCleanText(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length >= 1 && [...v].length <= max && v.trim() === v && !CONTROL_RE.test(v);
}

export function isValidItemRef(v: unknown): v is ItemRef {
  if (!isPlainObject(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== 1) return false;
  if (keys[0] === "id") return typeof v.id === "string" && CATALOG_ID_RE.test(v.id);
  if (keys[0] === "name") return isCleanText(v.name, MY_SETTINGS_LIMITS.freeTextMax);
  return false;
}

const refKey = (r: ItemRef) => ("id" in r ? `id:${r.id}` : `name:${r.name}`);

function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

export function validateMySettings(input: unknown): { ok: true; value: MySettings } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!isPlainObject(input)) return { ok: false, errors: { _: "設定の形が正しくありません。" } };
  const keys = Object.keys(input);
  if (keys.length !== KEYS.length || !KEYS.every((k) => keys.includes(k))) errors._ = "設定の形が正しくありません。";
  if (input.version !== 1) errors.version = "対応していない版です。";
  if (typeof input.updatedAt !== "string" || Number.isNaN(Date.parse(input.updatedAt))) errors.updatedAt = "更新日時が正しくありません。";

  if (input.typeCode !== null && !(typeof input.typeCode === "string" && TYPE_CODE_RE.test(input.typeCode))) errors.typeCode = "タイプが正しくありません。";
  if (input.axes !== null) {
    const a = input.axes;
    const ok = isPlainObject(a) && Object.keys(a).length === 4 && AXIS_KEYS.every((k) => inRange(a[k], -1, 1));
    if (!ok) errors.axes = "診断の値が正しくありません。";
  }

  const L = MY_SETTINGS_LIMITS;
  if (input.dpi !== null && !(inRange(input.dpi, L.dpiMin, L.dpiMax) && Number.isInteger(input.dpi)))
    errors.dpi = `DPI は ${L.dpiMin}〜${L.dpiMax} の整数で入力してください。`;
  if (input.mainGame !== null && !(typeof input.mainGame === "string" && getSensGame(input.mainGame)))
    errors.mainGame = "メインのゲームを選び直してください。";

  if (!isPlainObject(input.sens)) errors.sens = "感度の形が正しくありません。";
  else
    for (const [id, v] of Object.entries(input.sens)) {
      const g = getSensGame(id);
      if (!g) errors[`sens.${id}`] = "対応していないゲームです。";
      else if (!inRange(v, g.min, g.max) || v <= 0) errors[`sens.${id}`] = `${g.name} の感度は ${g.min}〜${g.max} の範囲で入力してください。`;
    }

  const h = input.hand;
  if (!isPlainObject(h) || Object.keys(h).length !== 3) errors.hand = "手の情報の形が正しくありません。";
  else {
    if (h.lengthCm !== null && !inRange(h.lengthCm, L.handLengthMin, L.handLengthMax))
      errors["hand.lengthCm"] = `手の長さは ${L.handLengthMin}〜${L.handLengthMax}cm で入力してください。`;
    if (h.widthCm !== null && !inRange(h.widthCm, L.handWidthMin, L.handWidthMax))
      errors["hand.widthCm"] = `手の幅は ${L.handWidthMin}〜${L.handWidthMax}cm で入力してください。`;
    if (h.grip !== null && !GRIPS.includes(h.grip as Grip)) errors["hand.grip"] = "持ち方を選び直してください。";
  }

  const d = input.devices;
  if (!isPlainObject(d) || Object.keys(d).length !== 4 || !DEVICE_SLOTS.every((s) => s in d)) errors.devices = "デバイスの形が正しくありません。";
  else for (const s of DEVICE_SLOTS) if (d[s] !== null && !isValidItemRef(d[s])) errors[`devices.${s}`] = `${L.freeTextMax}字以内で入力してください。`;

  const f = input.favoriteGames;
  if (!Array.isArray(f) || f.length > L.favoriteGamesMax || !f.every(isValidItemRef))
    errors.favoriteGames = `好きなゲームは ${L.favoriteGamesMax}つまで、${L.freeTextMax}字以内で入力してください。`;
  else if (new Set(f.map(refKey)).size !== f.length) errors.favoriteGames = "同じゲームが2回入っています。";

  if (input.cardName !== null && !isCleanText(input.cardName, L.cardNameMax)) errors.cardName = `表示名は ${L.cardNameMax}字以内で入力してください。`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as MySettings };
}

/** 保存されていたデータを読む。壊れていたら null(画面を止めない)。 */
export function parseMySettings(raw: unknown): MySettings | null {
  const r = validateMySettings(raw);
  return r.ok ? r.value : null;
}

import { getType } from "@/data/types";
import { getSensGame } from "@/data/sensitivity";
import { deviceOptions } from "@/data/devices";
import { gameOptions } from "@/data/popular-games";
import { cm360, edpi, DPI_MIN, DPI_MAX } from "@/lib/sensitivity";
import { itemLabel } from "@/lib/item-ref";
import {
  DEVICE_SLOTS, GRIPS, MY_SETTINGS_LIMITS, TYPE_CODE_RE, isValidItemRef,
  type DeviceSlot, type Grip, type ItemRef, type MySettings,
} from "@/lib/my-settings";

/** 公開カードに出す項目だけ(DB の get_public_card と同じ形)。 */
export type PublicCardData = {
  typeCode: string | null;
  cardName: string | null;
  dpi: number | null;
  mainGame: string | null;
  mainSens: number | null;
  grip: Grip | null;
  devices: Record<DeviceSlot, ItemRef | null>;
  favoriteGames: ItemRef[];
};

export type CardView = {
  typeCode: string | null;
  typeName: string | null;
  accent: "cyan" | "magenta" | "purple" | "lime";
  cardName: string | null;
  main: { gameName: string; sens: number; dpi: number; edpi: number; cm360: number } | null;
  grip: string | null;
  devices: { label: string; name: string }[];
  favoriteGames: string[];
};

export const CARD_REQUEST_MAX_BYTES = 8192;
const PUBLIC_KEYS = ["typeCode", "cardName", "dpi", "mainGame", "mainSens", "grip", "devices", "favoriteGames"];
const SLOT_LABEL: Record<DeviceSlot, string> = { mouse: "マウス", pad: "マウスパッド", keyboard: "キーボード", headset: "ヘッドセット" };
const GRIP_LABEL: Record<Grip, string> = { palm: "かぶせ持ち", claw: "つかみ持ち", fingertip: "つまみ持ち" };

export function toPublicCardData(s: MySettings): PublicCardData {
  return {
    typeCode: s.typeCode,
    cardName: s.cardName,
    dpi: s.dpi,
    mainGame: s.mainGame,
    mainSens: s.mainGame ? (s.sens[s.mainGame] ?? null) : null,
    grip: s.hand.grip,
    devices: s.devices,
    favoriteGames: s.favoriteGames,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function validatePublicCardData(v: unknown): v is PublicCardData {
  if (!isObj(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== PUBLIC_KEYS.length || !PUBLIC_KEYS.every((k) => keys.includes(k))) return false;
  if (v.typeCode !== null && !(typeof v.typeCode === "string" && TYPE_CODE_RE.test(v.typeCode))) return false;
  if (v.cardName !== null && !isValidItemRef({ name: v.cardName })) return false;
  if (typeof v.cardName === "string" && [...v.cardName].length > MY_SETTINGS_LIMITS.cardNameMax) return false;
  if (v.dpi !== null && !(typeof v.dpi === "number" && Number.isInteger(v.dpi) && v.dpi >= DPI_MIN && v.dpi <= DPI_MAX)) return false;
  if (v.mainSens !== null && !(typeof v.mainSens === "number" && Number.isFinite(v.mainSens) && v.mainSens > 0)) return false;
  if (v.mainGame !== null && !(typeof v.mainGame === "string" && getSensGame(v.mainGame))) return false;
  if (v.mainGame !== null && v.mainSens !== null) {
    const game = getSensGame(v.mainGame);
    if (!game || v.mainSens < game.min || v.mainSens > game.max) return false;
  }
  if (v.grip !== null && !GRIPS.includes(v.grip as Grip)) return false;
  const d = v.devices;
  if (!isObj(d) || Object.keys(d).length !== 4 || !DEVICE_SLOTS.every((s) => s in d && (d[s] === null || isValidItemRef(d[s])))) return false;
  const f = v.favoriteGames;
  if (!Array.isArray(f) || f.length > MY_SETTINGS_LIMITS.favoriteGamesMax || !f.every(isValidItemRef)) return false;
  return true;
}

export function buildCardView(d: PublicCardData): CardView {
  const type = d.typeCode ? getType(d.typeCode) : undefined;
  const game = d.mainGame ? getSensGame(d.mainGame) : undefined;
  const main =
    game && d.mainSens !== null && d.dpi !== null
      ? { gameName: game.name, sens: d.mainSens, dpi: d.dpi, edpi: edpi(d.dpi, d.mainSens), cm360: cm360(d.dpi, d.mainSens, game.yaw) }
      : null;
  const devices = DEVICE_SLOTS.flatMap((slot) => {
    const name = itemLabel(d.devices[slot], deviceOptions(slot));
    return name ? [{ label: SLOT_LABEL[slot], name }] : [];
  });
  const games = gameOptions();
  return {
    typeCode: type?.code ?? null,
    typeName: type?.name ?? null,
    accent: type?.accent ?? "cyan",
    cardName: d.cardName,
    main,
    grip: d.grip ? GRIP_LABEL[d.grip] : null,
    devices,
    favoriteGames: d.favoriteGames.flatMap((g) => {
      const name = itemLabel(g, games);
      return name ? [name] : [];
    }),
  };
}

/** Content-Length で上限を超えると分かる本文は、読み込む前に断る(数字でなければ本文の検査に任せる)。 */
export function contentLengthTooLarge(value: string | null): boolean {
  if (value === null || !/^[0-9]+$/.test(value)) return false;
  return Number(value) > CARD_REQUEST_MAX_BYTES;
}

/** POST /api/card-image の本文を読む。壊れていれば null(400 にする)。 */
export function parseCardRequest(body: string): PublicCardData | null {
  if (new TextEncoder().encode(body).length > CARD_REQUEST_MAX_BYTES) return null;
  try {
    const v: unknown = JSON.parse(body);
    return validatePublicCardData(v) ? v : null;
  } catch {
    return null;
  }
}

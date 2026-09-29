import type { Axes } from "@/data/axes";
import { emptyMySettings, parseMySettings, validateMySettings, type MySettings } from "@/lib/my-settings";

export type SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const MY_SETTINGS_KEY = "robilab:mySettings";

/** localStorage が使えれば返す。プライベートモードなどで使えなければ null。 */
export function browserStorage(): SettingsStorage | null {
  try {
    const s = window.localStorage;
    const probe = "robilab:probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function loadLocal(storage: SettingsStorage | null): MySettings | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MY_SETTINGS_KEY);
    return raw ? parseMySettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLocal(storage: SettingsStorage | null, s: MySettings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(MY_SETTINGS_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearLocal(storage: SettingsStorage | null): void {
  try {
    storage?.removeItem(MY_SETTINGS_KEY);
  } catch {
    // 消せなくても画面は止めない
  }
}

/** ブラウザとサーバーのどちらを採用するか。updatedAt が新しい方。同じならサーバー。 */
export function pickNewer(local: MySettings | null, server: MySettings | null): "local" | "server" | "none" {
  if (!local && !server) return "none";
  if (!server) return "local";
  if (!local) return "server";
  return Date.parse(local.updatedAt) > Date.parse(server.updatedAt) ? "local" : "server";
}

/** この端末で前回の同期以降に変えた項目(トップレベルのキー)を覚えておく場所。 */
export const MY_SETTINGS_DIRTY_KEY = "robilab:mySettings:dirty";
export const SYNC_FIELDS = ["typeCode", "axes", "dpi", "mainGame", "sens", "hand", "devices", "favoriteGames", "cardName", "crosshair"] as const;
export type SyncField = (typeof SYNC_FIELDS)[number];

function isSyncField(k: unknown): k is SyncField {
  return typeof k === "string" && (SYNC_FIELDS as readonly string[]).includes(k);
}

export function loadDirty(storage: SettingsStorage | null): SyncField[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(MY_SETTINGS_DIRTY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? [...new Set(parsed.filter(isSyncField))] : [];
  } catch {
    return [];
  }
}

export function markDirty(storage: SettingsStorage | null, keys: string[]): void {
  if (!storage) return;
  const next = [...new Set([...loadDirty(storage), ...keys.filter(isSyncField)])];
  try {
    storage.setItem(MY_SETTINGS_DIRTY_KEY, JSON.stringify(next));
  } catch {
    // 覚えられなくても画面は止めない
  }
}

export function clearDirty(storage: SettingsStorage | null): void {
  try {
    storage?.removeItem(MY_SETTINGS_DIRTY_KEY);
  } catch {
    // 消せなくても画面は止めない
  }
}

/**
 * ログインしたときの同期。サーバーの設定を土台にし、この端末で前回の同期以降に変えた項目(dirty)だけを上書きする。
 * push が true なら、結果をサーバーへ保存する。
 */
export function mergeForSync(
  local: MySettings | null,
  server: MySettings | null,
  dirty: string[],
): { result: MySettings | null; push: boolean } {
  if (!server) return { result: local, push: local !== null };
  if (!local) return { result: server, push: false };
  const keys = [...new Set(dirty.filter(isSyncField))];
  if (keys.length === 0) return { result: server, push: false };
  const merged: Record<string, unknown> = { ...server };
  for (const k of keys) merged[k] = local[k];
  merged.updatedAt = Date.parse(local.updatedAt) > Date.parse(server.updatedAt) ? local.updatedAt : server.updatedAt;
  const r = validateMySettings(merged);
  if (!r.ok) return { result: server, push: false };
  return { result: r.value, push: true };
}

/** ローカルの設定を変えて保存し、変えた項目を dirty にする。change は変えた値と、変えた項目の名前を返す。 */
function updateLocal(
  storage: SettingsStorage | null,
  change: (s: MySettings) => { next: MySettings; keys: SyncField[] },
  now: Date,
): MySettings | null {
  const current = loadLocal(storage) ?? emptyMySettings(now);
  const { next, keys } = change(current);
  const r = validateMySettings({ ...next, updatedAt: now.toISOString() });
  if (!r.ok) return null;
  saveLocal(storage, r.value);
  markDirty(storage, keys);
  return r.value;
}

/**
 * この端末にマイ設定がないときだけ、サーバーの設定(読み込み時に v1→v2 に直したもの)をこの端末に入れる。
 * 入れたら、この端末の変更の印は消す(サーバーの内容をそのまま使うため)。入れたときだけ true。
 */
export function adoptServerIfLocalEmpty(storage: SettingsStorage | null, serverRaw: unknown): boolean {
  const server = parseMySettings(serverRaw);
  if (!server || loadLocal(storage)) return false;
  if (!saveLocal(storage, server)) return false;
  clearDirty(storage);
  return true;
}

/** 診断が終わったときに、タイプと4軸の値をマイ設定に入れる。 */
export function applyDiagnosisToLocal(storage: SettingsStorage | null, typeCode: string, axes: Axes, now: Date = new Date()) {
  return updateLocal(storage, (s) => ({ next: { ...s, typeCode, axes }, keys: ["typeCode", "axes"] }), now);
}

/** 感度計算ツールの「マイ設定に保存」。メインゲームが未設定ならこのゲームにする。 */
export function saveSensToLocal(storage: SettingsStorage | null, gameId: string, dpi: number, sens: number, now: Date = new Date()) {
  return updateLocal(storage, (s) => {
    // メインゲームの感度が未入力なら、今保存するゲームをメインにする(「今日の文字」が感度なしで止まらないように)
    const keepMain = s.mainGame !== null && s.sens[s.mainGame] !== undefined;
    return {
      next: { ...s, dpi, sens: { ...s.sens, [gameId]: sens }, mainGame: keepMain ? s.mainGame : gameId },
      keys: keepMain || s.mainGame === gameId ? ["dpi", "sens"] : ["dpi", "sens", "mainGame"],
    };
  }, now);
}

/** 感度計算ツールの初期値(マイ設定のメインゲーム・DPI・感度)。そろっていなければ null。 */
export function sensDefaults(s: MySettings | null): { gameId: string; dpiText: string; sensText: string } | null {
  if (!s || s.dpi === null || !s.mainGame) return null;
  const sens = s.sens[s.mainGame];
  if (sens === undefined) return null;
  return { gameId: s.mainGame, dpiText: String(s.dpi), sensText: String(sens) };
}

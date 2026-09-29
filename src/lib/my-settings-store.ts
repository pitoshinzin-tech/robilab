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

function updateLocal(storage: SettingsStorage | null, change: (s: MySettings) => MySettings, now: Date): MySettings | null {
  const current = loadLocal(storage) ?? emptyMySettings(now);
  const next = { ...change(current), updatedAt: now.toISOString() };
  const r = validateMySettings(next);
  if (!r.ok) return null;
  saveLocal(storage, r.value);
  return r.value;
}

/** 診断が終わったときに、タイプと4軸の値をマイ設定に入れる。 */
export function applyDiagnosisToLocal(storage: SettingsStorage | null, typeCode: string, axes: Axes, now: Date = new Date()) {
  return updateLocal(storage, (s) => ({ ...s, typeCode, axes }), now);
}

/** 感度計算ツールの「マイ設定に保存」。メインゲームが未設定ならこのゲームにする。 */
export function saveSensToLocal(storage: SettingsStorage | null, gameId: string, dpi: number, sens: number, now: Date = new Date()) {
  return updateLocal(storage, (s) => ({ ...s, dpi, sens: { ...s.sens, [gameId]: sens }, mainGame: s.mainGame ?? gameId }), now);
}

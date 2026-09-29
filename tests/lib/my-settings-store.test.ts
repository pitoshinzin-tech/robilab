import { describe, it, expect } from "vitest";
import { emptyMySettings, type MySettings } from "@/lib/my-settings";
import {
  MY_SETTINGS_KEY, loadLocal, saveLocal, clearLocal, pickNewer, applyDiagnosisToLocal, saveSensToLocal, type SettingsStorage,
} from "@/lib/my-settings-store";

function memoryStorage(initial: Record<string, string> = {}): SettingsStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
}
const at = (iso: string): MySettings => emptyMySettings(new Date(iso));

describe("loadLocal / saveLocal / clearLocal", () => {
  it("round-trips valid settings", () => {
    const st = memoryStorage();
    const s = at("2026-10-01T00:00:00.000Z");
    expect(saveLocal(st, s)).toBe(true);
    expect(loadLocal(st)).toEqual(s);
    clearLocal(st);
    expect(loadLocal(st)).toBeNull();
  });
  it("returns null for broken JSON, invalid shapes, and unknown versions", () => {
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: "{broken" }))).toBeNull();
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: JSON.stringify({ version: 1 }) }))).toBeNull();
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: JSON.stringify({ ...at("2026-10-01T00:00:00.000Z"), version: 2 }) }))).toBeNull();
  });
  it("does nothing without storage", () => {
    expect(loadLocal(null)).toBeNull();
    expect(saveLocal(null, at("2026-10-01T00:00:00.000Z"))).toBe(false);
  });
  it("reports failure when the storage throws (quota, private mode)", () => {
    const st: SettingsStorage = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    expect(saveLocal(st, at("2026-10-01T00:00:00.000Z"))).toBe(false);
  });
});

describe("pickNewer", () => {
  const older = at("2026-10-01T00:00:00.000Z");
  const newer = at("2026-10-02T00:00:00.000Z");
  it("picks the newer side", () => {
    expect(pickNewer(newer, older)).toBe("local");
    expect(pickNewer(older, newer)).toBe("server");
  });
  it("prefers the server on a tie and handles missing sides", () => {
    expect(pickNewer(older, older)).toBe("server");
    expect(pickNewer(older, null)).toBe("local");
    expect(pickNewer(null, older)).toBe("server");
    expect(pickNewer(null, null)).toBe("none");
  });
});

describe("applyDiagnosisToLocal / saveSensToLocal", () => {
  it("writes the diagnosis type into new or existing settings", () => {
    const st = memoryStorage();
    const axes = { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 };
    const s = applyDiagnosisToLocal(st, "ARCH", axes, new Date("2026-10-03T00:00:00.000Z"));
    expect(s?.typeCode).toBe("ARCH");
    expect(loadLocal(st)?.axes).toEqual(axes);
    expect(loadLocal(st)?.updatedAt).toBe("2026-10-03T00:00:00.000Z");
  });
  it("saves DPI and sensitivity, and sets the main game only when empty", () => {
    const st = memoryStorage();
    saveSensToLocal(st, "valorant", 800, 0.35, new Date("2026-10-03T00:00:00.000Z"));
    saveSensToLocal(st, "apex", 800, 1.2, new Date("2026-10-04T00:00:00.000Z"));
    const s = loadLocal(st)!;
    expect(s.dpi).toBe(800);
    expect(s.sens).toEqual({ valorant: 0.35, apex: 1.2 });
    expect(s.mainGame).toBe("valorant");
  });
  it("refuses values that would make the settings invalid", () => {
    const st = memoryStorage();
    expect(saveSensToLocal(st, "valorant", 800, 999)).toBeNull();
    expect(loadLocal(st)).toBeNull();
  });
});

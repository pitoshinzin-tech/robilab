import { describe, it, expect } from "vitest";
import { emptyMySettings, type MySettings } from "@/lib/my-settings";
import {
  MY_SETTINGS_KEY, MY_SETTINGS_DIRTY_KEY, loadLocal, saveLocal, clearLocal, pickNewer, applyDiagnosisToLocal, saveSensToLocal, saveHandToLocal,
  loadDirty, markDirty, clearDirty, mergeForSync, adoptServerIfLocalEmpty, type SettingsStorage,
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
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: JSON.stringify({ ...at("2026-10-01T00:00:00.000Z"), version: 3 }) }))).toBeNull();
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
  it("moves the main game to the saved game when the main game has no sensitivity", () => {
    const st = memoryStorage();
    saveLocal(st, { ...at("2026-10-01T00:00:00.000Z"), mainGame: "apex" });
    saveSensToLocal(st, "valorant", 800, 0.35, new Date("2026-10-03T00:00:00.000Z"));
    expect(loadLocal(st)?.mainGame).toBe("valorant");
    expect(loadDirty(st)).toContain("mainGame");
  });
  it("refuses values that would make the settings invalid", () => {
    const st = memoryStorage();
    expect(saveSensToLocal(st, "valorant", 800, 999)).toBeNull();
    expect(loadLocal(st)).toBeNull();
  });
});

describe("dirty keys", () => {
  it("round-trips, merges without duplicates, and clears", () => {
    const st = memoryStorage();
    expect(loadDirty(st)).toEqual([]);
    markDirty(st, ["typeCode", "axes"]);
    markDirty(st, ["axes", "dpi"]);
    expect(loadDirty(st).sort()).toEqual(["axes", "dpi", "typeCode"]);
    clearDirty(st);
    expect(loadDirty(st)).toEqual([]);
  });
  it("ignores unknown keys and tolerates broken JSON, null and throwing storage", () => {
    expect(loadDirty(memoryStorage({ [MY_SETTINGS_DIRTY_KEY]: "{broken" }))).toEqual([]);
    expect(loadDirty(memoryStorage({ [MY_SETTINGS_DIRTY_KEY]: JSON.stringify({ a: 1 }) }))).toEqual([]);
    expect(loadDirty(memoryStorage({ [MY_SETTINGS_DIRTY_KEY]: JSON.stringify(["dpi", "version", "updatedAt", "evil", 3]) }))).toEqual(["dpi"]);
    const broken = memoryStorage({ [MY_SETTINGS_DIRTY_KEY]: "{broken" });
    markDirty(broken, ["dpi"]);
    expect(loadDirty(broken)).toEqual(["dpi"]);
    expect(loadDirty(null)).toEqual([]);
    expect(() => { markDirty(null, ["dpi"]); clearDirty(null); }).not.toThrow();
    const throwing: SettingsStorage = {
      getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); }, removeItem: () => { throw new Error("x"); },
    };
    expect(loadDirty(throwing)).toEqual([]);
    expect(() => { markDirty(throwing, ["dpi"]); clearDirty(throwing); }).not.toThrow();
  });
  it("marks the keys changed by the diagnosis and the sensitivity tool", () => {
    const st = memoryStorage();
    applyDiagnosisToLocal(st, "ARCH", { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 });
    expect(loadDirty(st).sort()).toEqual(["axes", "typeCode"]);
    clearDirty(st);
    saveSensToLocal(st, "valorant", 800, 0.35);
    expect(loadDirty(st).sort()).toEqual(["dpi", "mainGame", "sens"]);
    clearDirty(st);
    saveSensToLocal(st, "apex", 800, 1.2);
    expect(loadDirty(st).sort()).toEqual(["dpi", "sens"]);
  });
  it("does not mark anything when the change is refused", () => {
    const st = memoryStorage();
    saveSensToLocal(st, "valorant", 800, 999);
    expect(loadDirty(st)).toEqual([]);
  });
});

describe("mergeForSync", () => {
  const axes = { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 };
  const server: MySettings = {
    ...at("2026-10-01T00:00:00.000Z"),
    typeCode: "GBLZ",
    dpi: 1600,
    mainGame: "valorant",
    sens: { valorant: 0.2 },
    devices: { mouse: { name: "My Mouse" }, pad: null, keyboard: null, headset: null },
  };
  it("keeps the server fields and takes only the dirty fields from a new device", () => {
    const local: MySettings = { ...at("2026-10-05T00:00:00.000Z"), typeCode: "ARCH", axes };
    const { result, push } = mergeForSync(local, server, ["typeCode", "axes"]);
    expect(push).toBe(true);
    expect(result?.typeCode).toBe("ARCH");
    expect(result?.axes).toEqual(axes);
    expect(result?.dpi).toBe(1600);
    expect(result?.sens).toEqual({ valorant: 0.2 });
    expect(result?.mainGame).toBe("valorant");
    expect(result?.devices.mouse).toEqual({ name: "My Mouse" });
    expect(result?.updatedAt).toBe("2026-10-05T00:00:00.000Z");
  });
  it("uses the newer updatedAt of the two", () => {
    const local: MySettings = { ...at("2026-09-01T00:00:00.000Z"), typeCode: "ARCH" };
    expect(mergeForSync(local, server, ["typeCode"]).result?.updatedAt).toBe("2026-10-01T00:00:00.000Z");
  });
  it("adopts the server entirely when nothing is dirty", () => {
    const local: MySettings = { ...at("2026-10-05T00:00:00.000Z"), typeCode: "ARCH", dpi: 400 };
    expect(mergeForSync(local, server, [])).toEqual({ result: server, push: false });
  });
  it("pushes local when the server has nothing", () => {
    const local: MySettings = { ...at("2026-10-05T00:00:00.000Z"), typeCode: "ARCH" };
    expect(mergeForSync(local, null, [])).toEqual({ result: local, push: true });
    expect(mergeForSync(null, null, [])).toEqual({ result: null, push: false });
  });
  it("adopts the server without pushing when local is missing", () => {
    expect(mergeForSync(null, server, ["dpi"])).toEqual({ result: server, push: false });
  });
  it("falls back to the server when the merged result is invalid", () => {
    // 範囲外の DPI など、組み合わせた結果が保存できない形になる例
    const local = { ...at("2026-10-05T00:00:00.000Z"), dpi: 999999 } as MySettings;
    expect(mergeForSync(local, server, ["dpi"])).toEqual({ result: server, push: false });
  });
});

describe("adoptServerIfLocalEmpty", () => {
  it("copies the server settings into an empty device and clears stale dirty marks", () => {
    const st = memoryStorage({ [MY_SETTINGS_DIRTY_KEY]: JSON.stringify(["sens"]) });
    const server = { ...at("2026-10-01T00:00:00.000Z"), dpi: 800, mainGame: "valorant", sens: { valorant: 0.35, apex: 1.2 } };
    expect(adoptServerIfLocalEmpty(st, server)).toBe(true);
    expect(loadLocal(st)).toEqual(server);
    expect(loadDirty(st)).toEqual([]);
  });
  it("upgrades a v1 server row to v2 on the way in", () => {
    const st = memoryStorage();
    const v1: Record<string, unknown> = { ...at("2026-10-01T00:00:00.000Z"), version: 1 };
    delete v1.crosshair;
    expect(adoptServerIfLocalEmpty(st, v1)).toBe(true);
    const got = loadLocal(st);
    expect(got?.version).toBe(2);
    expect(got?.crosshair).toBeDefined();
  });
  it("never overwrites settings already on this device", () => {
    const local = { ...at("2026-09-01T00:00:00.000Z"), dpi: 400 };
    const st = memoryStorage();
    saveLocal(st, local);
    markDirty(st, ["dpi"]);
    expect(adoptServerIfLocalEmpty(st, { ...at("2026-10-01T00:00:00.000Z"), dpi: 1600 })).toBe(false);
    expect(loadLocal(st)).toEqual(local);
    expect(loadDirty(st)).toEqual(["dpi"]);
  });
  it("does nothing for a missing or invalid server row, or without storage", () => {
    const st = memoryStorage();
    expect(adoptServerIfLocalEmpty(st, null)).toBe(false);
    expect(adoptServerIfLocalEmpty(st, { version: 1 })).toBe(false);
    expect(st.data[MY_SETTINGS_KEY]).toBeUndefined();
    expect(adoptServerIfLocalEmpty(null, at("2026-10-01T00:00:00.000Z"))).toBe(false);
  });
});

describe("saveHandToLocal", () => {
  it("saves the hand and marks it dirty for sync", () => {
    const s = memoryStorage();
    const saved = saveHandToLocal(s, { lengthCm: 18.5, widthCm: null, grip: "claw" }, new Date("2026-10-01T00:00:00Z"));
    expect(saved?.hand).toEqual({ lengthCm: 18.5, widthCm: null, grip: "claw" });
    expect(loadLocal(s)?.hand).toEqual({ lengthCm: 18.5, widthCm: null, grip: "claw" });
    expect(loadDirty(s)).toContain("hand");
  });
  it("saves only the grip when the length is unknown (length stays null)", () => {
    const s = memoryStorage();
    const saved = saveHandToLocal(s, { lengthCm: null, widthCm: null, grip: "palm" });
    expect(saved?.hand).toEqual({ lengthCm: null, widthCm: null, grip: "palm" });
    expect(loadLocal(s)?.hand).toEqual({ lengthCm: null, widthCm: null, grip: "palm" });
  });
  it("refuses values outside the limits", () => {
    const s = memoryStorage();
    expect(saveHandToLocal(s, { lengthCm: 30, widthCm: null, grip: "palm" })).toBeNull();
    expect(loadLocal(s)).toBeNull();
  });
  it("returns null and does not mark dirty when the storage cannot be written", () => {
    const data: Record<string, string> = {};
    const st: SettingsStorage = {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => { if (k === MY_SETTINGS_KEY) throw new Error("quota"); data[k] = v; },
      removeItem: (k) => { delete data[k]; },
    };
    expect(saveHandToLocal(st, { lengthCm: 18.5, widthCm: null, grip: "claw" })).toBeNull();
    expect(loadDirty(st)).not.toContain("hand");
  });
  it("returns null when every write throws", () => {
    const st: SettingsStorage = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    expect(saveHandToLocal(st, { lengthCm: 18.5, widthCm: null, grip: "claw" })).toBeNull();
    expect(saveSensToLocal(st, "valorant", 800, 0.35)).toBeNull();
    expect(loadDirty(st)).toEqual([]);
  });
});

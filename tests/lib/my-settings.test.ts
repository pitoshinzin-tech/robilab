import { describe, it, expect } from "vitest";
import { emptyMySettings, validateMySettings, parseMySettings, normalizeText, isValidItemRef, MY_SETTINGS_LIMITS } from "@/lib/my-settings";

const base = () => emptyMySettings(new Date("2026-10-01T00:00:00.000Z"));

describe("emptyMySettings", () => {
  it("is valid and version 1", () => {
    const r = validateMySettings(base());
    expect(r.ok).toBe(true);
    expect(base().version).toBe(1);
    expect(base().updatedAt).toBe("2026-10-01T00:00:00.000Z");
  });
});

describe("normalizeText (trims free text)", () => {
  it("trims and turns blank into null", () => {
    expect(normalizeText("  G PRO  ")).toBe("G PRO");
    expect(normalizeText("   ")).toBeNull();
    expect(normalizeText("")).toBeNull();
  });
});

describe("isValidItemRef", () => {
  it("accepts catalog ids and free names", () => {
    expect(isValidItemRef({ id: "logicool-g-pro-x-superlight-2" })).toBe(true);
    expect(isValidItemRef({ name: "自作マウス" })).toBe(true);
  });
  it("rejects bad shapes", () => {
    expect(isValidItemRef({ id: "Bad ID" })).toBe(false);
    expect(isValidItemRef({ name: "x".repeat(41) })).toBe(false);
    expect(isValidItemRef({ name: " 前後に空白 " })).toBe(false);
    expect(isValidItemRef({ name: "改行\nあり" })).toBe(false);
    expect(isValidItemRef({ id: "a", name: "b" })).toBe(false);
    expect(isValidItemRef({})).toBe(false);
    expect(isValidItemRef("x")).toBe(false);
  });
});

describe("validateMySettings", () => {
  it("accepts a full valid settings object", () => {
    const s = {
      ...base(),
      typeCode: "ARCH",
      axes: { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 },
      dpi: 800,
      mainGame: "valorant",
      sens: { valorant: 0.35, apex: 1.2 },
      hand: { lengthCm: 18.5, widthCm: 9, grip: "claw" as const },
      devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "布パッド" }, keyboard: null, headset: null },
      favoriteGames: [{ id: "valorant" }, { name: "昔のゲーム" }],
      cardName: "ロビ太",
    };
    expect(validateMySettings(s)).toEqual({ ok: true, value: s });
  });

  it("reports field errors for out-of-range values", () => {
    const s = {
      ...base(),
      dpi: 10,
      mainGame: "unknown-game",
      sens: { valorant: 99 },
      hand: { lengthCm: 40, widthCm: 1, grip: "fist" },
      cardName: "x".repeat(MY_SETTINGS_LIMITS.cardNameMax + 1),
    };
    const r = validateMySettings(s);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(
      ["cardName", "dpi", "hand.grip", "hand.lengthCm", "hand.widthCm", "mainGame", "sens.valorant"].sort(),
    );
  });

  it("rejects non-integer DPI, duplicate or too many favorite games, and bad type codes", () => {
    const r1 = validateMySettings({ ...base(), dpi: 800.5 });
    expect(r1.ok).toBe(false);
    const r2 = validateMySettings({ ...base(), favoriteGames: [{ id: "valorant" }, { id: "valorant" }] });
    expect(r2.ok).toBe(false);
    const seven = Array.from({ length: 7 }, (_, i) => ({ name: `game${i}` }));
    expect(validateMySettings({ ...base(), favoriteGames: seven }).ok).toBe(false);
    expect(validateMySettings({ ...base(), typeCode: "XXXX" }).ok).toBe(false);
  });

  it("rejects unknown keys and wrong versions", () => {
    expect(validateMySettings({ ...base(), extra: 1 }).ok).toBe(false);
    expect(validateMySettings({ ...base(), version: 2 }).ok).toBe(false);
    expect(validateMySettings(null).ok).toBe(false);
  });
});

describe("parseMySettings", () => {
  it("returns null for broken data instead of throwing", () => {
    expect(parseMySettings("not json object")).toBeNull();
    expect(parseMySettings({ version: 1 })).toBeNull();
    expect(parseMySettings(base())).toEqual(base());
  });
});

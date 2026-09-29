import { describe, it, expect } from "vitest";
import { emptyMySettings } from "@/lib/my-settings";
import { toPublicCardData, validatePublicCardData, buildCardView, parseCardRequest, CARD_REQUEST_MAX_BYTES } from "@/lib/card-view";

const settings = () => ({
  ...emptyMySettings(new Date("2026-10-01T00:00:00.000Z")),
  typeCode: "ARCH",
  axes: { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 },
  dpi: 800,
  mainGame: "valorant",
  sens: { valorant: 0.35 },
  hand: { lengthCm: 18.5, widthCm: 9, grip: "claw" as const },
  devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "布パッド" }, keyboard: { id: "unknown-id" }, headset: null },
  favoriteGames: [{ id: "valorant" }, { name: "昔のゲーム" }],
  cardName: "ロビ太",
});

describe("toPublicCardData", () => {
  it("keeps only public fields (no hand size, no axes)", () => {
    const d = toPublicCardData(settings());
    expect(Object.keys(d).sort()).toEqual(["cardName", "devices", "dpi", "favoriteGames", "grip", "mainGame", "mainSens", "typeCode"]);
    expect(d.mainSens).toBe(0.35);
    expect(validatePublicCardData(d)).toBe(true);
  });
});

describe("buildCardView", () => {
  it("resolves names and computes eDPI / cm360", () => {
    const v = buildCardView(toPublicCardData(settings()));
    expect(v.typeName).toBe("先陣ヒーロータイプ");
    expect(v.main).toEqual({ gameName: "VALORANT", sens: 0.35, dpi: 800, edpi: 280, cm360: 46.65 });
    expect(v.grip).toBe("つかみ持ち");
    expect(v.devices).toEqual([
      { label: "マウス", name: "Logicool G PRO X SUPERLIGHT 2" },
      { label: "マウスパッド", name: "布パッド" },
    ]);
    expect(v.favoriteGames).toEqual(["VALORANT", "昔のゲーム"]);
  });
  it("omits the main game line when the sensitivity for the main game is missing", () => {
    const s = { ...settings(), mainGame: "apex" };
    expect(buildCardView(toPublicCardData(s)).main).toBeNull();
  });
});

describe("parseCardRequest", () => {
  it("accepts a valid body", () => {
    expect(parseCardRequest(JSON.stringify(toPublicCardData(settings())))).not.toBeNull();
  });
  it("returns null for broken, oversized, or unexpected bodies", () => {
    expect(parseCardRequest("{broken")).toBeNull();
    expect(parseCardRequest("x".repeat(CARD_REQUEST_MAX_BYTES + 1))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), extra: 1 }))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), cardName: "x".repeat(21) }))).toBeNull();
    expect(parseCardRequest("null")).toBeNull();
  });
  it("returns null for invalid dpi values", () => {
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), dpi: 0 }))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), dpi: 12.5 }))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), dpi: 70000 }))).toBeNull();
  });
  it("returns null for invalid mainSens values", () => {
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), mainSens: 0 }))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), mainSens: -1 }))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), mainGame: "valorant", mainSens: 99 }))).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { emptyMySettings, type MySettings } from "@/lib/my-settings";
import { PROGRESS_ITEMS, settingsProgress, visibleSensGames } from "@/lib/my-progress";

const base = (): MySettings => emptyMySettings(new Date(0));
const full = (): MySettings => ({
  ...base(),
  typeCode: "ARCH",
  dpi: 800,
  mainGame: "valorant",
  sens: { valorant: 0.35 },
  hand: { lengthCm: 18, widthCm: null, grip: "claw" },
  devices: { ...base().devices, mouse: { name: "テストマウス" } },
  favoriteGames: [{ name: "VALORANT" }],
  cardName: "ぴと",
});

describe("settingsProgress", () => {
  it("空は 0 / 8", () => {
    expect(settingsProgress(base())).toEqual({ done: 0, total: 8, missing: [...PROGRESS_ITEMS] });
  });
  it("全部入ると 8 / 8", () => {
    expect(settingsProgress(full())).toEqual({ done: 8, total: 8, missing: [] });
  });
  it("メインのゲームの感度がないと「感度」は未入力", () => {
    const s = { ...full(), sens: { apex: 1 } };
    expect(settingsProgress(s).missing).toEqual(["sens"]);
  });
  it("名刺の名前が空文字なら未入力、手の大きさと持ち方は別に数える", () => {
    const s = { ...full(), cardName: "", hand: { lengthCm: null, widthCm: null, grip: "palm" as const } };
    expect(settingsProgress(s).missing).toEqual(["handSize", "cardName"]);
  });
});

describe("visibleSensGames", () => {
  const order = ["valorant", "overwatch", "apex", "cs2"];
  it("メインと値のあるゲームを、決まった順で", () => {
    expect(visibleSensGames({ mainGame: "apex", sens: { overwatch: 5 } }, order)).toEqual(["overwatch", "apex"]);
  });
  it("何もなければ空", () => {
    expect(visibleSensGames({ mainGame: null, sens: {} }, order)).toEqual([]);
  });
});

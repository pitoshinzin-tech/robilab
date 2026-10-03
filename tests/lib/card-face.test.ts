import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CARD_FALLBACK_GAMES, cardMainLines } from "@/lib/card-face";
import { CardFace } from "@/components/card/CardFace";
import type { CardView } from "@/lib/card-view";

const view = (extra: Partial<CardView> = {}): CardView => ({
  typeCode: "ARCH", typeName: "先陣ヒーロータイプ", accent: "magenta", cardName: "ろびお",
  main: { gameName: "VALORANT", sens: 0.35, dpi: 800, edpi: 280, cm360: 46.4 }, grip: "つかみ持ち",
  devices: [{ label: "マウス", name: "Logicool G PRO X SUPERLIGHT 2" }], favoriteGames: ["VALORANT", "APEX"], ...extra,
});

describe("cardMainLines(画像とプレビューで同じ文)", () => {
  it("感度・DPI と eDPI・振り向きの 2 行", () => {
    expect(cardMainLines(view())).toEqual({ sens: "VALORANT 感度 0.35 / 800 DPI", edpi: "eDPI 280 ・ 振り向き 46.4 cm" });
  });
  it("メインのゲームがなければ null", () => expect(cardMainLines(view({ main: null }))).toBeNull());
});

describe("CardFace(HTML の名刺)", () => {
  it("画像と同じ文字を出す", () => {
    const html = renderToStaticMarkup(createElement(CardFace, { view: view() }));
    for (const s of ["ARCH", "先陣ヒーロータイプ", "ロビラボ マイ設定", "ろびお", "VALORANT 感度 0.35 / 800 DPI", "eDPI 280 ・ 振り向き 46.4 cm", "つかみ持ち", "マウス", "Logicool G PRO X SUPERLIGHT 2", "APEX"]) {
      expect(html).toContain(s);
    }
    expect(html).toContain('role="img"');
  });
  it("タイプがないときは ????・タイプ未診断、好きなゲームが空なら未登録の札", () => {
    const html = renderToStaticMarkup(createElement(CardFace, { view: view({ typeCode: null, typeName: null, favoriteGames: [] }) }));
    expect(html).toContain("????");
    expect(html).toContain("タイプ未診断");
    expect(html).toContain(CARD_FALLBACK_GAMES[0]);
  });
  it("入力の文字は HTML として解釈しない(React の文字の扱い)", () => {
    const html = renderToStaticMarkup(createElement(CardFace, { view: view({ cardName: "<img src=x onerror=alert(1)>" }) }));
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("cardSummary(名刺の読み上げの文)", () => {
  it("画面に出ている中身を短く伝える", async () => {
    const { cardSummary } = await import("@/lib/card-face");
    expect(cardSummary(view())).toBe(
      "名刺カード:ろびお、ARCH 先陣ヒーロータイプ、VALORANT 感度 0.35 / 800 DPI、eDPI 280 ・ 振り向き 46.4 cm、つかみ持ち、マウス Logicool G PRO X SUPERLIGHT 2、好きなゲーム VALORANT・APEX",
    );
  });
  it("空の項目は省き、タイプがなければ ????・タイプ未診断", async () => {
    const { cardSummary } = await import("@/lib/card-face");
    expect(cardSummary(view({ cardName: null, typeCode: null, typeName: null, main: null, grip: null, devices: [], favoriteGames: [] })))
      .toBe("名刺カード:???? タイプ未診断、好きなゲーム 未登録");
  });
  it("CardFace の読み上げは cardSummary", () => {
    const html = renderToStaticMarkup(createElement(CardFace, { view: view() }));
    expect(html).toContain('aria-label="名刺カード:ろびお、ARCH 先陣ヒーロータイプ');
  });
});

describe("cardSaveState(保存のボタン)", () => {
  it("今の入力の PNG があれば押せる", async () => {
    const { cardSaveState } = await import("@/lib/card-face");
    expect(cardSaveState({ pngBody: "a", body: "a", failed: false })).toBe("ready");
  });
  it("PNG がまだ・入力の後で古い間は「準備中」で押せない", async () => {
    const { cardSaveState } = await import("@/lib/card-face");
    expect(cardSaveState({ pngBody: null, body: "a", failed: false })).toBe("preparing");
    expect(cardSaveState({ pngBody: "a", body: "b", failed: false })).toBe("preparing");
  });
  it("作れなかった・入力が正しくない(本文なし)ときは押せない", async () => {
    const { cardSaveState } = await import("@/lib/card-face");
    expect(cardSaveState({ pngBody: "a", body: "b", failed: true })).toBe("unavailable");
    expect(cardSaveState({ pngBody: "a", body: null, failed: false })).toBe("unavailable");
  });
});

describe("CARD_LAYOUT(画像と HTML で同じ寸法の表)", () => {
  it("CardFace の寸法は表の値を 1200 の幅の割合(cqw)にしたもの", async () => {
    const { CARD_LAYOUT } = await import("@/lib/card-face");
    const html = renderToStaticMarkup(createElement(CardFace, { view: view() }));
    const cqw = (px: number) => `${Math.round((px / 12) * 10000) / 10000}cqw`;
    for (const px of [CARD_LAYOUT.padding, CARD_LAYOUT.code.size, CARD_LAYOUT.name.size, CARD_LAYOUT.main.sensSize, CARD_LAYOUT.games.size, CARD_LAYOUT.devices.labelWidth]) {
      expect(html).toContain(cqw(px));
    }
  });
});

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
    const html = renderToStaticMarkup(createElement(CardFace, { view: view(), label: "名刺カードのプレビュー" }));
    for (const s of ["ARCH", "先陣ヒーロータイプ", "ロビラボ マイ設定", "ろびお", "VALORANT 感度 0.35 / 800 DPI", "eDPI 280 ・ 振り向き 46.4 cm", "つかみ持ち", "マウス", "Logicool G PRO X SUPERLIGHT 2", "APEX"]) {
      expect(html).toContain(s);
    }
    expect(html).toContain('role="img"');
  });
  it("タイプがないときは ????・タイプ未診断、好きなゲームが空なら未登録の札", () => {
    const html = renderToStaticMarkup(createElement(CardFace, { view: view({ typeCode: null, typeName: null, favoriteGames: [] }), label: "x" }));
    expect(html).toContain("????");
    expect(html).toContain("タイプ未診断");
    expect(html).toContain(CARD_FALLBACK_GAMES[0]);
  });
  it("入力の文字は HTML として解釈しない(React の文字の扱い)", () => {
    const html = renderToStaticMarkup(createElement(CardFace, { view: view({ cardName: "<img src=x onerror=alert(1)>" }), label: "x" }));
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

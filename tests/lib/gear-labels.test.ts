import { describe, it, expect } from "vitest";
import { NO_DATA, connectionLabel, materialLabel, packText, padSizeText, shapeLabel, skateThicknessText, surfaceLabel, withUnit } from "@/lib/gear-labels";

describe("gear-labels", () => {
  it("形・接続(null は公式の記載なし)", () => {
    expect(NO_DATA).toBe("公式の記載なし");
    expect(shapeLabel("symmetric")).toBe("左右対称");
    expect(shapeLabel("right")).toBe("右手用");
    expect(shapeLabel(null)).toBe(NO_DATA);
    expect(connectionLabel("wired")).toBe("有線");
    expect(connectionLabel("wireless")).toBe("無線");
    expect(connectionLabel("both")).toBe("有線・無線");
    expect(connectionLabel(null)).toBe(NO_DATA);
  });
  it("面・素材", () => {
    expect(surfaceLabel("cloth")).toBe("布");
    expect(surfaceLabel("glass")).toBe("ガラス");
    expect(surfaceLabel(null)).toBe(NO_DATA);
    expect(materialLabel("UPE")).toBe("UPE(超高分子量ポリエチレン)");
    expect(materialLabel(null)).toBe(NO_DATA);
  });
  it("数字+単位は公式の表記のまま(丸めない)、null は記載なし", () => {
    expect(withUnit(62.15, "mm")).toBe("62.15mm");
    expect(withUnit(60, "g")).toBe("60g");
    expect(withUnit(null, "g")).toBe(NO_DATA);
  });
  it("入数", () => {
    expect(packText(8, 2)).toBe("2 セット(8 枚)");
    expect(packText(null, 2)).toBe("2 セット");
    expect(packText(8, null)).toBe("8 枚");
    expect(packText(null, null)).toBe(NO_DATA);
  });
  it("パッドの大きさ(片方でもなければ記載なし)", () => {
    expect(padSizeText(490, 420)).toBe("490×420mm");
    expect(padSizeText(null, 420)).toBe(NO_DATA);
  });
  it("ソールの厚さ:1 つの数字は mm、幅の表記は公式の原文のまま", () => {
    expect(skateThicknessText(0.8, null)).toBe("0.8mm");
    expect(skateThicknessText(null, "a thickness ranging from 0.7 to 0.8mm")).toBe("a thickness ranging from 0.7 to 0.8mm");
    expect(skateThicknessText(null, null)).toBe(NO_DATA);
  });
});

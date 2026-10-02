import { describe, it, expect } from "vitest";
import { TYPES } from "@/data/types";
import { axisInitials, axisLegend, axisLine, axisWords } from "@/lib/type-axes";

describe("タイプのコード → 軸の言葉(名簿のホバーの 1 行)", () => {
  it("ARCH と GBLZ", () => {
    expect(axisWords("ARCH")).toEqual(["攻め", "直感", "チーム", "熱血"]);
    expect(axisLine("GBLZ")).toBe("守り・戦略・ソロ・冷静");
    expect(axisInitials("ARCH")).toBe("攻直チ熱");
  });
  it("16 タイプとも 4 つの言葉", () => {
    for (const t of TYPES) expect(axisWords(t.code), t.code).toHaveLength(4);
  });
  it("名簿の凡例:4 文字の英字と軸の言葉(data/axes から作る)", () => {
    expect(axisLegend()).toBe("A 攻め/G 守り・R 直感/B 戦略・C チーム/L ソロ・H 熱血/Z 冷静");
  });
  it("おかしなコードは空", () => {
    expect(axisWords("XXXX")).toEqual([]);
    expect(axisWords("ARC")).toEqual([]);
    expect(axisLine("")).toBe("");
  });
});

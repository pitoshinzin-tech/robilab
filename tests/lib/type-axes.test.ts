import { describe, it, expect } from "vitest";
import { TYPES } from "@/data/types";
import { axisInitials, axisLegend, axisLine, axisWords, matchesAxisFilter } from "@/lib/type-axes";

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

describe("matchesAxisFilter(一覧の凡例の 2 択で名簿を絞る)", () => {
  it("何も選ばないと全部残る", () => {
    expect(TYPES.every((t) => matchesAxisFilter(t.code, [null, null, null, null]))).toBe(true);
  });
  it("1 つの軸を選ぶと、その文字のタイプだけ(8 体)", () => {
    expect(matchesAxisFilter("ARCH", ["A", null, null, null])).toBe(true);
    expect(matchesAxisFilter("GRCH", ["A", null, null, null])).toBe(false);
    expect(TYPES.filter((t) => matchesAxisFilter(t.code, [null, "B", null, null]))).toHaveLength(8);
  });
  it("重ねると絞り込まれ、4 つ選ぶと 1 体", () => {
    expect(TYPES.filter((t) => matchesAxisFilter(t.code, ["A", null, "L", null]))).toHaveLength(4);
    expect(TYPES.filter((t) => matchesAxisFilter(t.code, ["G", "B", "L", "Z"])).map((t) => t.code)).toEqual(["GBLZ"]);
  });
});

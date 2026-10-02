import { describe, it, expect } from "vitest";
import { pickExample, spriteReading } from "@/lib/diagnosis-example";

describe("pickExample", () => {
  const list = ["A", "B", "C"] as const;
  it("回数の順に 1 つずつ選ぶ", () => {
    expect(pickExample(list, 0)).toBe("A");
    expect(pickExample(list, 2)).toBe("C");
  });
  it("最後まで行ったら最初に戻る", () => {
    expect(pickExample(list, 3)).toBe("A");
    expect(pickExample(list, 7)).toBe("B");
  });
  it("負の数でも範囲の中を返す", () => {
    expect(pickExample(list, -1)).toBe("C");
  });
  it("空の一覧は null", () => {
    expect(pickExample([], 0)).toBeNull();
  });
});

describe("spriteReading", () => {
  it("絵の部分と軸の言葉を、頭・目・体の横・色の順に並べる", () => {
    expect(spriteReading("ARCH")).toBe("頭 = 攻め・目 = 直感・体の横 = チーム・色 = 熱血");
    expect(spriteReading("GBLZ")).toBe("頭 = 守り・目 = 戦略・体の横 = ソロ・色 = 冷静");
  });
  it("おかしなコードは空", () => {
    expect(spriteReading("XXXX")).toBe("");
    expect(spriteReading("AR")).toBe("");
  });
});

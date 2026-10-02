import { describe, it, expect } from "vitest";
import { pickExample } from "@/lib/diagnosis-example";

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

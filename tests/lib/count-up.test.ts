import { describe, it, expect } from "vitest";
import { COUNT_UP_MS, countUpRaw, countUpValue } from "@/lib/motion/use-count-up";

describe("countUpValue(結果の点数を 0 から 600ms で 1 回だけ数える)", () => {
  it("始まりは 0、600ms で最後の数", () => {
    expect(countUpValue(8420, 0)).toBe(0);
    expect(countUpValue(8420, COUNT_UP_MS)).toBe(8420);
    expect(countUpValue(8420, 99999)).toBe(8420);
  });
  it("終わりがゆっくり(半分の時間で 8 割を超える)", () => {
    expect(countUpValue(1000, 300)).toBe(875);
  });
  it("ずっと増えていく", () => {
    let prev = -1;
    for (let t = 0; t <= COUNT_UP_MS; t += 50) {
      const v = countUpValue(5000, t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
  it("長さ 0 と負の時間でも壊れない", () => {
    expect(countUpValue(10, 5, 0)).toBe(10);
    expect(countUpValue(10, -100)).toBe(0);
  });
});

describe("countUpRaw(回転式カウンターの輪に使う、丸めない値)", () => {
  it("途中は小数、終わりはちょうど最後の数", () => {
    expect(countUpRaw(1000, 300)).toBeCloseTo(875, 6);
    expect(countUpRaw(8421, 100) % 1).not.toBe(0);
    expect(countUpRaw(8421, COUNT_UP_MS)).toBe(8421);
  });
  it("countUpValue は countUpRaw を丸めたもの", () => {
    for (let t = -50; t <= 700; t += 37) expect(countUpValue(7777, t)).toBe(Math.round(countUpRaw(7777, t)));
  });
});

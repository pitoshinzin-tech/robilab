import { describe, it, expect } from "vitest";
import { decimalPlaces, odometerWheels, rollValue, ROLL_MS } from "@/lib/motion/odometer";

describe("odometerWheels(回転式カウンターの各桁の輪の位置。上の桁から)", () => {
  it("整数のときは、どの輪もちょうど数字の位置(止まった形)", () => {
    expect(odometerWheels(8420, 4)).toEqual([8, 4, 2, 0]);
    expect(odometerWheels(42, 4)).toEqual([0, 0, 4, 2]);
    expect(odometerWheels(0, 3)).toEqual([0, 0, 0]);
    expect(odometerWheels(9999, 4)).toEqual([9, 9, 9, 9]);
  });
  it("1 の位は小数のまま回り、上の輪は下の輪が 9 を越えるときだけ一緒に回る(機械式の繰り上がり)", () => {
    const [h, t, o] = odometerWheels(199.5, 3);
    expect(o).toBeCloseTo(9.5, 6);
    expect(t).toBeCloseTo(9.5, 6);
    expect(h).toBeCloseTo(1.5, 6);
    const [t2, o2] = odometerWheels(42.5, 2);
    expect(t2).toBe(4);
    expect(o2).toBeCloseTo(2.5, 6);
  });
  it("輪の数より桁が多いときは、下の桁の輪だけを返す", () => {
    expect(odometerWheels(12345, 3)).toEqual([3, 4, 5]);
  });
  it("負の数・NaN は 0", () => {
    expect(odometerWheels(-5, 2)).toEqual([0, 0]);
    expect(odometerWheels(Number.NaN, 2)).toEqual([0, 0]);
  });
});

describe("rollValue(入力を変えたとき、前の数から新しい数へ回す)", () => {
  it("始まりは前の数、ROLL_MS で新しい数ちょうど", () => {
    expect(rollValue(34.64, 17.32, 0)).toBe(34.64);
    expect(rollValue(34.64, 17.32, ROLL_MS)).toBe(17.32);
    expect(rollValue(34.64, 17.32, 99999)).toBe(17.32);
  });
  it("増えるときも減るときも、行き過ぎずに近づく", () => {
    let prev = 10;
    for (let t = 0; t <= ROLL_MS; t += 20) {
      const v = rollValue(10, 40, t);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(40);
      prev = v;
    }
    prev = 40;
    for (let t = 0; t <= ROLL_MS; t += 20) {
      const v = rollValue(40, 10, t);
      expect(v).toBeLessThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(10);
      prev = v;
    }
  });
  it("時間が 0 以下なら、すぐ新しい数", () => {
    expect(rollValue(1, 2, 0, 0)).toBe(2);
  });
});

describe("decimalPlaces(小数点より下の桁の数。輪を回すときの倍率に使う)", () => {
  it("文字のとおりの桁の数", () => {
    expect(decimalPlaces("34.64")).toBe(2);
    expect(decimalPlaces("34.6")).toBe(1);
    expect(decimalPlaces("35")).toBe(0);
  });
});

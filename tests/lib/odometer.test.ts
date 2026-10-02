import { describe, it, expect } from "vitest";
import { odometerWheels } from "@/lib/motion/odometer";

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

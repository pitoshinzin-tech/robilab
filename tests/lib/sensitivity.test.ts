import { describe, it, expect } from "vitest";
import { edpi, cm360, convertSens, validateInput, DPI_MIN, DPI_MAX } from "@/lib/sensitivity";
import { getSensGame } from "@/data/sensitivity";

const val = getSensGame("valorant")!;
const ow = getSensGame("overwatch")!;
const r6 = getSensGame("r6")!;

describe("sensitivity math", () => {
  it("computes eDPI", () => {
    expect(edpi(800, 0.35)).toBe(280);
  });
  it("computes cm/360 (research check value)", () => {
    expect(cm360(800, 0.35, val.yaw)).toBe(46.65);
  });
  it("converts VALORANT 0.35 to Overwatch 3.71", () => {
    expect(convertSens(0.35, val, ow)).toBe(3.71);
  });
  it("rounds to integer for R6", () => {
    expect(Number.isInteger(convertSens(0.35, val, r6))).toBe(true);
  });
  it("round-trips within rounding", () => {
    const back = convertSens(convertSens(0.35, val, ow), ow, val);
    expect(Math.abs(back - 0.35)).toBeLessThan(0.002);
  });
});

describe("validateInput", () => {
  it("accepts normal input", () => {
    expect(validateInput(800, 0.35, val)).toBeNull();
  });
  it("rejects missing numbers", () => {
    expect(validateInput(null, 0.35, val)).toMatch(/DPI/);
    expect(validateInput(800, null, val)).toMatch(/感度/);
  });
  it("rejects DPI outside range", () => {
    expect(validateInput(0, 0.35, val)).toMatch(/DPI/);
    expect(validateInput(DPI_MIN - 1, 0.35, val)).toMatch(/DPI/);
    expect(validateInput(DPI_MAX + 1, 0.35, val)).toMatch(/DPI/);
    expect(validateInput(100000, 0.35, val)).toMatch(/DPI/);
  });
  it("rejects sensitivity outside the game's range", () => {
    expect(validateInput(800, -1, val)).toMatch(/感度/);
    expect(validateInput(800, 0, val)).toMatch(/感度/);
    expect(validateInput(800, 11, val)).toMatch(/感度/);
  });
});

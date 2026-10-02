import { describe, it, expect } from "vitest";
import { DECODE_STEPS, decodeFrame } from "@/lib/motion/decode";

describe("decodeFrame(動きの参考 064:順位の数字が 2 段だけ乱れてから決まる)", () => {
  it("2 段", () => {
    expect(DECODE_STEPS).toBe(2);
  });
  it("乱れている間も桁の数は同じで、本当の数とは違う", () => {
    for (const v of ["1", "12", "305"]) {
      for (let s = 0; s < DECODE_STEPS; s++) {
        const f = decodeFrame(v, s);
        expect(f).toHaveLength(v.length);
        expect(f).toMatch(/^\d+$/);
        expect(f).not.toBe(v);
      }
    }
  });
  it("段ごとに違う形", () => {
    expect(decodeFrame("12", 0)).not.toBe(decodeFrame("12", 1));
  });
  it("2 段目のあと(と負の段)は本当の数", () => {
    expect(decodeFrame("12", 2)).toBe("12");
    expect(decodeFrame("12", 9)).toBe("12");
    expect(decodeFrame("12", -1)).toBe("12");
  });
  it("数字でない文字はそのまま", () => {
    expect(decodeFrame("1,234", 0)[1]).toBe(",");
  });
});

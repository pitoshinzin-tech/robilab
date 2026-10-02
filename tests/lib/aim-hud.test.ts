import { describe, it, expect } from "vitest";
import { hudCoords } from "@/lib/aim/hud";

describe("hudCoords(遊ぶ面の照準の横の小さな座標。板の単位・3 桁)", () => {
  it("丸めて 3 桁にそろえる", () => {
    expect(hudCoords({ x: 54.5, y: 3.2 })).toBe("X 055  Y 003");
    expect(hudCoords({ x: 0, y: 109 })).toBe("X 000  Y 109");
  });
  it("板の外は符号つき", () => {
    expect(hudCoords({ x: -12.4, y: 120 })).toBe("X-012  Y 120");
  });
});

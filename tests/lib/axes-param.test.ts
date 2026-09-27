import { describe, it, expect } from "vitest";
import { parseAxesParam } from "@/lib/axes-param";

describe("parseAxesParam", () => {
  it("reads four numbers", () => {
    expect(parseAxesParam("0.33,-1.00,0.11,0.78", "ABCH")).toEqual({ attack: 0.33, instinct: -1, team: 0.11, heat: 0.78 });
  });
  it("falls back to the code when missing or broken", () => {
    expect(parseAxesParam(undefined, "ARCH")).toEqual({ attack: 0.6, instinct: 0.6, team: 0.6, heat: 0.6 });
    expect(parseAxesParam("x,y", "GBLZ")).toEqual({ attack: -0.6, instinct: -0.6, team: -0.6, heat: -0.6 });
  });
  it("falls back when the numbers contradict the code", () => {
    // ARCH なのに攻守がマイナス → URL をいじったとみなしてタイプコードを優先
    expect(parseAxesParam("-0.5,0.3,0.3,0.3", "ARCH").attack).toBe(0.6);
  });
  it("clamps values into -1..1", () => {
    expect(parseAxesParam("5,0.3,0.3,0.3", "ARCH").attack).toBe(1);
  });
});

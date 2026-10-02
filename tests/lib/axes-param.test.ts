import { describe, it, expect } from "vitest";
import { isDiagnosisAxesParam, parseAxesParam } from "@/lib/axes-param";
import { resultPath } from "@/lib/diagnosis-result";

describe("isDiagnosisAxesParam", () => {
  it("accepts four in-range numbers whose signs match the code", () => {
    expect(isDiagnosisAxesParam("0.33,0.50,0.11,0.78", "ARCH")).toBe(true);
    expect(isDiagnosisAxesParam("-1.00,-0.20,-0.11,-0.78", "GBLZ")).toBe(true);
    expect(isDiagnosisAxesParam("1,-1,0.2,-0.2", "ABCZ")).toBe(true);
  });
  it("accepts what the diagnosis itself links to", () => {
    const { code, path } = resultPath({ attack: -0.33, instinct: 0.56, team: -0.11, heat: 1 });
    expect(isDiagnosisAxesParam(new URLSearchParams(path.split("?")[1]).get("axes") ?? undefined, code)).toBe(true);
  });
  it("rejects missing, empty or garbage values", () => {
    expect(isDiagnosisAxesParam(undefined, "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("x", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.3,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.3,0.3,0.3,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.3,,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.3,abc,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.3,Infinity,0.3,0.3", "ARCH")).toBe(false);
  });
  it("rejects numbers out of -1..1 or zero", () => {
    expect(isDiagnosisAxesParam("5,0.3,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.3,-1.01,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0,0.3,0.3,0.3", "ARCH")).toBe(false);
  });
  it("rejects signs that contradict the code letters", () => {
    expect(isDiagnosisAxesParam("-0.5,0.3,0.3,0.3", "ARCH")).toBe(false);
    expect(isDiagnosisAxesParam("0.5,0.3,0.3,0.3", "ARCZ")).toBe(false);
  });
});

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

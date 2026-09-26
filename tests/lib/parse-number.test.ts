import { describe, it, expect } from "vitest";
import { parseNumber } from "@/lib/parse-number";

describe("parseNumber", () => {
  it("reads half-width numbers", () => {
    expect(parseNumber("0.35")).toBe(0.35);
    expect(parseNumber("800")).toBe(800);
  });
  it("reads full-width digits and dot (Japanese IME)", () => {
    expect(parseNumber("０.３５")).toBe(0.35);
    expect(parseNumber("８００")).toBe(800);
    expect(parseNumber("０．３５")).toBe(0.35);
  });
  it("treats a single comma as a decimal point", () => {
    expect(parseNumber("0,35")).toBe(0.35);
  });
  it("trims spaces", () => {
    expect(parseNumber("  1600 ")).toBe(1600);
  });
  it("returns null for empty or non-numbers", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("1.2.3")).toBeNull();
    expect(parseNumber("１,０００,０００")).toBeNull();
  });
});

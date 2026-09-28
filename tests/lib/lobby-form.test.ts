import { describe, it, expect } from "vitest";
import { parseAxesField } from "@/lib/lobby-form";

describe("parseAxesField", () => {
  it("returns null for empty input", () => {
    expect(parseAxesField(null)).toBeNull();
    expect(parseAxesField("")).toBeNull();
  });

  it("returns the parsed object for valid JSON object", () => {
    expect(parseAxesField('{"attack":1,"instinct":0,"team":-1,"heat":0.5}')).toEqual({ attack: 1, instinct: 0, team: -1, heat: 0.5 });
  });

  it("returns \"invalid\" for malformed JSON", () => {
    expect(parseAxesField("{not json")).toBe("invalid");
  });

  it("returns \"invalid\" for a JSON array or number", () => {
    expect(parseAxesField("[1,2,3]")).toBe("invalid");
    expect(parseAxesField("42")).toBe("invalid");
  });
});

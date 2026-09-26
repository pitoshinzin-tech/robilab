import { describe, it, expect } from "vitest";
import { normalizeTypeCode } from "@/lib/type-code";

describe("normalizeTypeCode", () => {
  it("accepts upper and lower case", () => {
    expect(normalizeTypeCode("ARCH")).toBe("ARCH");
    expect(normalizeTypeCode("arch")).toBe("ARCH");
    expect(normalizeTypeCode(" gblz ")).toBe("GBLZ");
  });
  it("rejects unknown codes", () => {
    expect(normalizeTypeCode("ABCD")).toBeNull();
    expect(normalizeTypeCode("")).toBeNull();
    expect(normalizeTypeCode("ARCHX")).toBeNull();
  });
});

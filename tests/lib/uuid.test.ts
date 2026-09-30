import { describe, expect, it } from "vitest";
import { isUuid } from "@/lib/uuid";

describe("isUuid", () => {
  it("accepts UUIDs (any case)", () => {
    expect(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(true);
    expect(isUuid("3F2504E0-4F89-11D3-9A0C-0305E82C3301")).toBe(true);
  });

  it("rejects other strings", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c33011")).toBe(false);
    expect(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301\n")).toBe(false);
    expect(isUuid("../3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(false);
  });
});

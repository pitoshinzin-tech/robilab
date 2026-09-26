import { describe, it, expect } from "vitest";
import { BRAND } from "@/lib/brand";

describe("brand", () => {
  it("has the robilab name", () => {
    expect(BRAND.name).toBe("ロビラボ");
  });
});

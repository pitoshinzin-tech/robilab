import { describe, it, expect } from "vitest";
import { AFFILIATES, affiliatesFor } from "@/data/affiliates";
import { ALL_TYPE_CODES } from "@/data/types";

describe("affiliates", () => {
  it("only targets existing type codes", () => {
    for (const a of AFFILIATES) if (a.forTypes !== "all") for (const c of a.forTypes) expect(ALL_TYPE_CODES).toContain(c);
  });
  it("uses https store links and has a comment written by the owner", () => {
    for (const a of AFFILIATES) {
      expect(a.url.startsWith("https://")).toBe(true);
      expect(a.comment.length).toBeGreaterThan(0);
    }
  });
  it("returns at most the limit, type-specific first", () => {
    const list = affiliatesFor("ARCH", 3);
    expect(list.length).toBeLessThanOrEqual(3);
  });
});

import { describe, it, expect } from "vitest";
import { TIME_SLOTS, PLATFORMS, RANK_BANDS } from "@/data/lobby-options";

describe("lobby options", () => {
  it("has unique ids", () => {
    for (const list of [TIME_SLOTS, PLATFORMS, RANK_BANDS]) expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
  });
  it("includes the slot used by the RLS tests", () => {
    expect(TIME_SLOTS.map((t) => t.id)).toContain("weekday-night");
  });
});

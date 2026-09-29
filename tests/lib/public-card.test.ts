import { describe, it, expect } from "vitest";
import { isSlug } from "@/lib/public-card";

describe("isSlug", () => {
  it("accepts only 10 alphanumeric characters", () => {
    expect(isSlug("Ab3dEf9hIj")).toBe(true);
    expect(isSlug("short")).toBe(false);
    expect(isSlug("Ab3dEf9hIj!")).toBe(false);
    expect(isSlug("../../etc/x")).toBe(false);
  });
});

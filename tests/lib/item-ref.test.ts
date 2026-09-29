import { describe, it, expect } from "vitest";
import { itemLabel } from "@/lib/item-ref";

const options = [{ id: "a-mouse", label: "Brand A Mouse" }];

describe("itemLabel", () => {
  it("resolves catalog ids and free names", () => {
    expect(itemLabel({ id: "a-mouse" }, options)).toBe("Brand A Mouse");
    expect(itemLabel({ name: "自作" }, options)).toBe("自作");
  });
  it("hides unknown ids and null", () => {
    expect(itemLabel({ id: "unknown" }, options)).toBeNull();
    expect(itemLabel(null, options)).toBeNull();
  });
});

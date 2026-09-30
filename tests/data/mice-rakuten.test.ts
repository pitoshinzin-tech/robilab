import { describe, it, expect } from "vitest";
import { MICE } from "@/data/mice";
import { MICE_RAKUTEN } from "@/data/mice-rakuten";

describe("mice-rakuten snapshot", () => {
  it("only has mice that exist in mice.ts, in the same order", () => {
    const ids = MICE.map((m) => m.id);
    const keys = Object.keys(MICE_RAKUTEN);
    for (const k of keys) expect(ids, k).toContain(k);
    expect(keys).toEqual(ids.filter((id) => id in MICE_RAKUTEN));
  });
  it("uses https Rakuten URLs and a check date", () => {
    for (const [id, r] of Object.entries(MICE_RAKUTEN)) {
      const item = new URL(r.itemUrl);
      expect(item.protocol, id).toBe("https:");
      expect(item.hostname, id).toBe("item.rakuten.co.jp");
      const img = new URL(r.imageUrl);
      expect(img.protocol, id).toBe("https:");
      expect(img.hostname, id).toBe("thumbnail.image.rakuten.co.jp");
      expect(r.checkedAt, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.itemName, id).not.toBe("");
      expect(r.shopName, id).not.toBe("");
    }
  });
});

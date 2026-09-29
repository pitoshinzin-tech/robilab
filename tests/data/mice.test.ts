import { describe, it, expect } from "vitest";
import { MICE, mouseById } from "@/data/mice";
import { DEVICES } from "@/data/devices";

const MAKER_HOSTS = ["logi.com", "logitechg.com", "logicool.co.jp", "razer.com", "benq.com", "pulsar.gg", "finalmouse.com", "lamzu.com", "endgamegear.com", "vaxee.co", "gloriousgaming.com", "steelseries.com", "corsair.com", "hyperx.com"];

describe("mice data", () => {
  it("has at least 20 mice with unique ids that exist as mice in devices.ts", () => {
    expect(MICE.length).toBeGreaterThanOrEqual(20);
    const ids = MICE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MICE) {
      const d = DEVICES.find((x) => x.id === m.id);
      expect(d, m.id).toBeDefined();
      expect(d!.category, m.id).toBe("mouse");
    }
  });
  it("keeps numbers in realistic ranges", () => {
    for (const m of MICE) {
      expect(m.lengthMm, m.id).toBeGreaterThanOrEqual(90);
      expect(m.lengthMm, m.id).toBeLessThanOrEqual(140);
      expect(m.widthMm, m.id).toBeGreaterThanOrEqual(50);
      expect(m.widthMm, m.id).toBeLessThanOrEqual(80);
      expect(m.heightMm, m.id).toBeGreaterThanOrEqual(20);
      expect(m.heightMm, m.id).toBeLessThanOrEqual(50);
      expect(m.weightG, m.id).toBeGreaterThanOrEqual(30);
      expect(m.weightG, m.id).toBeLessThanOrEqual(150);
    }
  });
  it("cites an https manufacturer page (not a shop) and a check date", () => {
    for (const m of MICE) {
      const u = new URL(m.officialUrl);
      expect(u.protocol, m.id).toBe("https:");
      // 出典はメーカーのサイトだけ(増やすときはこの一覧にメーカーのドメインを足す)
      expect(MAKER_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h)), `${m.id}: ${u.hostname}`).toBe(true);
      expect(m.checkedAt, m.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("finds a mouse by id", () => {
    expect(mouseById(MICE[0].id)).toBe(MICE[0]);
    expect(mouseById("no-such-mouse")).toBeUndefined();
  });
});

import { describe, it, expect } from "vitest";
import { DEVICES, deviceOptions } from "@/data/devices";
import { POPULAR_GAMES, gameOptions } from "@/data/popular-games";
import { CATALOG_ID_RE, DEVICE_SLOTS } from "@/lib/my-settings";
import { GAMES } from "@/data/games";

describe("device candidates", () => {
  it("have unique ids in the catalog id format", () => {
    expect(new Set(DEVICES.map((d) => d.id)).size).toBe(DEVICES.length);
    for (const d of DEVICES) expect(d.id).toMatch(CATALOG_ID_RE);
  });
  it("cover every device slot with enough candidates", () => {
    for (const slot of DEVICE_SLOTS) expect(deviceOptions(slot).length).toBeGreaterThanOrEqual(10);
    expect(deviceOptions("mouse").length).toBeGreaterThanOrEqual(25);
  });
});

describe("popular games", () => {
  it("have unique ids in the catalog id format and include the diagnosis games", () => {
    expect(new Set(POPULAR_GAMES.map((g) => g.id)).size).toBe(POPULAR_GAMES.length);
    for (const g of POPULAR_GAMES) expect(g.id).toMatch(CATALOG_ID_RE);
    for (const g of GAMES) expect(POPULAR_GAMES.map((p) => p.id)).toContain(g.id);
    expect(gameOptions().length).toBeGreaterThanOrEqual(35);
  });
});

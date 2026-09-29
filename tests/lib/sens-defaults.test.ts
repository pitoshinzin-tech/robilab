import { describe, it, expect } from "vitest";
import { emptyMySettings } from "@/lib/my-settings";
import { sensDefaults } from "@/lib/my-settings-store";

describe("sensDefaults", () => {
  it("uses the main game, DPI and its sensitivity", () => {
    const s = { ...emptyMySettings(), dpi: 800, mainGame: "apex", sens: { apex: 1.2 } };
    expect(sensDefaults(s)).toEqual({ gameId: "apex", dpiText: "800", sensText: "1.2" });
  });
  it("returns null when something is missing", () => {
    expect(sensDefaults(null)).toBeNull();
    expect(sensDefaults({ ...emptyMySettings(), dpi: 800, mainGame: "apex", sens: {} })).toBeNull();
    expect(sensDefaults({ ...emptyMySettings(), dpi: null, mainGame: "apex", sens: { apex: 1.2 } })).toBeNull();
  });
});

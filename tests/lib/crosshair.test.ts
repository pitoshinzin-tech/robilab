import { describe, it, expect } from "vitest";
import { CROSSHAIR_DEFAULT, CROSSHAIR_COLORS, isValidCrosshair, drawCrosshair } from "@/lib/crosshair";

describe("isValidCrosshair", () => {
  it("accepts the default and rejects out-of-range or wrong shapes", () => {
    expect(isValidCrosshair(CROSSHAIR_DEFAULT)).toBe(true);
    expect(isValidCrosshair({ ...CROSSHAIR_DEFAULT, length: 21 })).toBe(false);
    expect(isValidCrosshair({ ...CROSSHAIR_DEFAULT, thickness: 1.5 })).toBe(false);
    expect(isValidCrosshair({ ...CROSSHAIR_DEFAULT, gap: -1 })).toBe(false);
    expect(isValidCrosshair({ ...CROSSHAIR_DEFAULT, color: "red" })).toBe(false);
    expect(isValidCrosshair({ ...CROSSHAIR_DEFAULT, shape: "star" })).toBe(false);
    expect(isValidCrosshair({ ...CROSSHAIR_DEFAULT, extra: 1 })).toBe(false);
  });
  it("has 8 color presets in #RRGGBB", () => {
    expect(CROSSHAIR_COLORS).toHaveLength(8);
    for (const c of CROSSHAIR_COLORS) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("drawCrosshair", () => {
  it("draws four arms for a cross and a dot for cross-dot", () => {
    const calls: string[] = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === "canvas" ? {} : (..._a: unknown[]) => calls.push(String(k))), set: () => true }) as unknown as CanvasRenderingContext2D;
    drawCrosshair(ctx, { ...CROSSHAIR_DEFAULT, shape: "cross", outline: false }, 50, 50);
    expect(calls.filter((c) => c === "fillRect")).toHaveLength(4);
    calls.length = 0;
    drawCrosshair(ctx, { ...CROSSHAIR_DEFAULT, shape: "cross-dot", outline: false }, 50, 50);
    expect(calls.filter((c) => c === "fillRect")).toHaveLength(5);
  });
});

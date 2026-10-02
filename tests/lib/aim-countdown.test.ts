import { describe, it, expect } from "vitest";
import { COUNTDOWN_MS, COUNTDOWN_STEP_MS, countdownDigit, display2Px } from "@/lib/aim/countdown";

describe("3・2・1(1 つ 600ms で置き換え)", () => {
  it("合計 1,800ms", () => {
    expect(COUNTDOWN_STEP_MS).toBe(600);
    expect(COUNTDOWN_MS).toBe(1800);
  });
  it.each([[1800, 3], [1201, 3], [1200, 2], [601, 2], [600, 1], [1, 1], [0, 1], [-5, 1], [5000, 3]])("残り %i ms → %i", (ms, d) => {
    expect(countdownDigit(ms)).toBe(d);
  });
});

describe("display2Px(--rl-text-display-2 と同じ clamp)", () => {
  it.each([[320, 72], [375, 72], [1440, 120], [2000, 120]])("幅 %i → %i px", (w, px) => {
    expect(display2Px(w)).toBe(px);
  });
});

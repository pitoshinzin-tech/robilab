import { describe, it, expect } from "vitest";
import { REDUCED_MOTION_QUERY, readReducedMotion, reducedMotionServerSnapshot } from "@/lib/motion/use-reduced-motion";

describe("useReducedMotion の部品", () => {
  it("サーバーでは false(ハイドレーションのずれを起こさない)", () => {
    expect(reducedMotionServerSnapshot()).toBe(false);
  });
  it("matchMedia の答えをそのまま返す", () => {
    expect(readReducedMotion((q) => ({ matches: q === REDUCED_MOTION_QUERY }))).toBe(true);
    expect(readReducedMotion(() => ({ matches: false }))).toBe(false);
  });
  it("matchMedia がない環境では false", () => {
    expect(readReducedMotion(undefined)).toBe(false);
  });
});

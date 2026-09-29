import { describe, it, expect } from "vitest";
import { reduceAim, canStepTrace } from "@/lib/aim/game-state";

describe("reduceAim", () => {
  it("idle → countdown → playing → finished", () => {
    expect(reduceAim("idle", "start")).toBe("countdown");
    expect(reduceAim("countdown", "go")).toBe("playing");
    expect(reduceAim("playing", "done")).toBe("finished");
  });
  it("abort: losing pointer lock during countdown or play aborts, and reset returns to idle", () => {
    expect(reduceAim("countdown", "lost")).toBe("aborted");
    expect(reduceAim("playing", "lost")).toBe("aborted");
    expect(reduceAim("finished", "lost")).toBe("finished");
    expect(reduceAim("aborted", "reset")).toBe("idle");
  });
  it("ignores events that do not apply", () => {
    expect(reduceAim("idle", "done")).toBe("idle");
    expect(reduceAim("finished", "go")).toBe("finished");
  });
});

describe("canStepTrace", () => {
  it("板の前方(|yaw| < 80 かつ |pitch| < 80)なら判定を進める", () => {
    expect(canStepTrace({ yaw: 0, pitch: 0 })).toBe(true);
    expect(canStepTrace({ yaw: 79.9, pitch: -79.9 })).toBe(true);
  });
  it("|yaw| または |pitch| が 80° 以上なら進めない(鏡写しの誤判定を防ぐ)", () => {
    expect(canStepTrace({ yaw: 80, pitch: 0 })).toBe(false);
    expect(canStepTrace({ yaw: -95, pitch: 0 })).toBe(false);
    expect(canStepTrace({ yaw: 0, pitch: 80 })).toBe(false);
    expect(canStepTrace({ yaw: 0, pitch: -89 })).toBe(false);
    expect(canStepTrace({ yaw: 270, pitch: 0 })).toBe(false);
  });
});

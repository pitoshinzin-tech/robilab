import { describe, it, expect } from "vitest";
import { reduceAim, reducePen, canStepTrace } from "@/lib/aim/game-state";

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

describe("reducePen", () => {
  it("遊んでいる間に左ボタンを押すと筆が下り、離すと上がる", () => {
    expect(reducePen(false, { kind: "down", button: 0 }, "playing")).toBe(true);
    expect(reducePen(true, { kind: "up", button: 0 }, "playing")).toBe(false);
  });
  it("スタートのクリックやカウントダウン中の押し下げは数えない", () => {
    expect(reducePen(false, { kind: "down", button: 0 }, "idle")).toBe(false);
    expect(reducePen(false, { kind: "down", button: 0 }, "countdown")).toBe(false);
  });
  it("左以外のボタンは無視する", () => {
    expect(reducePen(false, { kind: "down", button: 2 }, "playing")).toBe(false);
    expect(reducePen(true, { kind: "up", button: 2 }, "playing")).toBe(true);
  });
  it("ロックが外れたときやウィンドウから外れたときは筆を上げる", () => {
    expect(reducePen(true, { kind: "lost" }, "playing")).toBe(false);
    expect(reducePen(true, { kind: "blur" }, "playing")).toBe(false);
  });
});

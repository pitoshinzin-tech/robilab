import { describe, it, expect } from "vitest";
import { degreesPerCount, applyMouse, aimPoint, projectPoint, KVG_SIZE } from "@/lib/aim/view";
import { cm360 } from "@/lib/sensitivity";
import { getSensGame } from "@/data/sensitivity";

describe("degreesPerCount", () => {
  it("matches the sensitivity tool: 360° takes cm360 of mouse travel", () => {
    const dpi = 800, sens = 0.35;
    const deg = degreesPerCount("valorant", sens)!;
    const countsFor360 = 360 / deg;
    const cm = (countsFor360 / dpi) * 2.54;
    expect(cm).toBeCloseTo(cm360(dpi, sens, getSensGame("valorant")!.yaw), 1);
  });
  it("returns null for unknown games or non-positive sensitivity", () => {
    expect(degreesPerCount("nope", 1)).toBeNull();
    expect(degreesPerCount("valorant", 0)).toBeNull();
  });
});

describe("applyMouse", () => {
  it("turns right on +dx and up on -dy, clamping pitch to ±89", () => {
    const v = applyMouse({ yaw: 0, pitch: 0 }, 100, -50, 0.1);
    expect(v.yaw).toBeCloseTo(10);
    expect(v.pitch).toBeCloseTo(5);
    expect(applyMouse({ yaw: 0, pitch: 0 }, 0, -100000, 0.1).pitch).toBe(89);
    expect(applyMouse({ yaw: 0, pitch: 0 }, 0, 100000, 0.1).pitch).toBe(-89);
  });
});

describe("aimPoint / projectPoint", () => {
  it("looking straight ahead aims at the board center, which projects to the screen center", () => {
    const c = aimPoint({ yaw: 0, pitch: 0 });
    expect(c.x).toBeCloseTo(KVG_SIZE / 2);
    expect(c.y).toBeCloseTo(KVG_SIZE / 2);
    const s = projectPoint(c, { yaw: 0, pitch: 0 }, 1000, 600)!;
    expect(s.x).toBeCloseTo(500);
    expect(s.y).toBeCloseTo(300);
  });
  it("turning right moves the aim to the right edge side of the board (x grows) and the board left on screen", () => {
    const p = aimPoint({ yaw: 10, pitch: 0 });
    expect(p.x).toBeGreaterThan(KVG_SIZE / 2);
    const s = projectPoint({ x: KVG_SIZE / 2, y: KVG_SIZE / 2 }, { yaw: 10, pitch: 0 }, 1000, 600)!;
    expect(s.x).toBeLessThan(500);
  });
  it("looking up aims at the upper part of the board (y shrinks, since KanjiVG y points down)", () => {
    expect(aimPoint({ yaw: 0, pitch: 5 }).y).toBeLessThan(KVG_SIZE / 2);
  });
  it("the point the view aims at always projects to the screen center", () => {
    const v = { yaw: 12, pitch: -7 };
    const s = projectPoint(aimPoint(v), v, 1280, 720)!;
    expect(s.x).toBeCloseTo(640, 3);
    expect(s.y).toBeCloseTo(360, 3);
  });
  it("the board edge is 20° from the center", () => {
    expect(aimPoint({ yaw: 20, pitch: 0 }).x).toBeCloseTo(KVG_SIZE, 3);
  });
  it("returns null for points behind the camera", () => {
    expect(projectPoint({ x: 54.5, y: 54.5 }, { yaw: 180, pitch: 0 }, 1000, 600)).toBeNull();
  });
});

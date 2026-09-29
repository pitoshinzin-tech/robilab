import { describe, it, expect } from "vitest";
import { parsePath, toStroke, closestOnStroke } from "@/lib/aim/path";

describe("parsePath", () => {
  it("handles absolute/relative moves and lines", () => {
    expect(parsePath("M10,20L30,20")).toEqual([{ x: 10, y: 20 }, { x: 30, y: 20 }]);
    expect(parsePath("m10 20 l20 0 v10 h-5")).toEqual([{ x: 10, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 30 }, { x: 25, y: 30 }]);
  });
  it("samples cubic curves including KanjiVG-style number packing (c-1.2,3.4-5,6)", () => {
    const pts = parsePath("M0,0c0,10,10,10,10,0s10-10,10,0");
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts.at(-1)!.x).toBeCloseTo(20);
    expect(pts.at(-1)!.y).toBeCloseTo(0);
    expect(pts.length).toBe(1 + 16 + 16);
  });
  it("reads numbers like 1.5.5 and 1e2", () => {
    expect(parsePath("M1.5.5L1e1,2")).toEqual([{ x: 1.5, y: 0.5 }, { x: 10, y: 2 }]);
  });
});

describe("closestOnStroke", () => {
  const s = toStroke(parsePath("M0,0L100,0"));
  it("returns distance to the polyline and progress along it", () => {
    const q = closestOnStroke(s, { x: 25, y: 3 });
    expect(q.dist).toBeCloseTo(3);
    expect(q.t).toBeCloseTo(0.25);
  });
  it("clamps before the start and after the end", () => {
    expect(closestOnStroke(s, { x: -10, y: 0 }).t).toBe(0);
    expect(closestOnStroke(s, { x: 130, y: 0 }).t).toBe(1);
  });
  it("stroke length is the polyline length", () => {
    expect(toStroke(parsePath("M0,0L3,4L3,10")).length).toBeCloseTo(11);
  });
});

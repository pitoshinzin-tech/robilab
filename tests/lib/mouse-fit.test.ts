import { describe, it, expect } from "vitest";
import type { MouseSpec } from "@/data/mice";
import {
  applyFilter, compareWith, fitDistance, fitScore, fitTarget, handFrom, NO_FILTER, rankMice, targetText,
} from "@/lib/mouse-fit";

const m = (id: string, lengthMm: number, widthMm: number, weightG: number, extra: Partial<MouseSpec> = {}): MouseSpec => ({
  id, lengthMm, widthMm, heightMm: 38, weightG, shape: "symmetric", connection: "wireless",
  officialUrl: "https://example.com/" + id, checkedAt: "2026-09-29", ...extra,
});

describe("fitTarget", () => {
  it("uses the grip coefficients (palm 0.64/0.62, claw 0.60/0.60, fingertip 0.56/0.56)", () => {
    expect(fitTarget({ lengthCm: 18.5, widthCm: 9, grip: "palm" })).toEqual({ lengthMm: 118.4, widthMm: 55.8 });
    expect(fitTarget({ lengthCm: 18.5, widthCm: 9, grip: "claw" })).toEqual({ lengthMm: 111, widthMm: 54 });
    expect(fitTarget({ lengthCm: 18.5, widthCm: 9, grip: "fingertip" })).toEqual({ lengthMm: 103.6, widthMm: 50.4 });
  });
  it("keeps width null when the hand width is unknown", () => {
    expect(fitTarget({ lengthCm: 18.5, widthCm: null, grip: "palm" })).toEqual({ lengthMm: 118.4, widthMm: null });
  });
  it("describes the range in whole millimetres", () => {
    expect(targetText({ lengthMm: 118.4, widthMm: 55.8 })).toBe("長さ 114〜122mm・幅 53〜59mm");
    expect(targetText({ lengthMm: 118.4, widthMm: null })).toBe("長さ 114〜122mm");
  });
});

describe("fitDistance / fitScore", () => {
  it("scales length by 6mm and width by 4mm", () => {
    expect(fitDistance({ lengthMm: 120, widthMm: 60 }, { lengthMm: 126, widthMm: 60 })).toBeCloseTo(1);
    expect(fitDistance({ lengthMm: 120, widthMm: 60 }, { lengthMm: 120, widthMm: 64 })).toBeCloseTo(1);
    expect(fitDistance({ lengthMm: 120, widthMm: 60 }, { lengthMm: 126, widthMm: 64 })).toBeCloseTo(Math.SQRT2);
  });
  it("ignores width when the target width is null", () => {
    expect(fitDistance({ lengthMm: 120, widthMm: null }, { lengthMm: 126, widthMm: 99 })).toBeCloseTo(1);
  });
  it("maps distance 0 to 100 and 3 or more to 0", () => {
    expect(fitScore(0)).toBe(100);
    expect(fitScore(1.5)).toBe(50);
    expect(fitScore(3)).toBe(0);
    expect(fitScore(10)).toBe(0);
  });
});

describe("rankMice", () => {
  const hand = { lengthCm: 18.5, widthCm: 9, grip: "palm" as const }; // 目安 118.4 / 55.8
  it("orders by distance, then lighter, then id", () => {
    const list = rankMice(hand, [m("far", 130, 66, 50), m("b-close", 118, 56, 60), m("a-close", 118, 56, 60), m("light", 118, 56, 55)]);
    expect(list.map((r) => r.mouse.id)).toEqual(["light", "a-close", "b-close", "far"]);
  });
  it("explains length and width against the range (±4mm / ±3mm)", () => {
    const [ok] = rankMice(hand, [m("ok", 122.4, 58.8, 60)]);
    expect(ok.reasons).toEqual(["長さが目安どおり", "幅が目安どおり"]);
    const [small] = rankMice(hand, [m("s", 114.3, 52.7, 60)]);
    expect(small.reasons).toEqual(["長さがやや短め(細かい操作向き)", "幅がやや狭め"]);
    const [large] = rankMice(hand, [m("l", 122.5, 58.9, 60)]);
    expect(large.reasons).toEqual(["長さがやや長め(安定しやすい)", "幅がやや広め"]);
  });
  it("gives only the length reason when the hand width is unknown", () => {
    const [r] = rankMice({ ...hand, widthCm: null }, [m("x", 118, 70, 60)]);
    expect(r.reasons).toEqual(["長さが目安どおり"]);
    expect(r.score).toBe(fitScore(Math.abs(118 - 118.4) / 6));
  });
});

describe("applyFilter", () => {
  const list = rankMice({ lengthCm: 18.5, widthCm: 9, grip: "palm" }, [
    m("a", 118, 56, 50, { shape: "right", connection: "wired" }),
    m("b", 119, 56, 65),
    m("c", 120, 57, 80),
  ]);
  it("keeps the order and filters by weight, shape and connection", () => {
    expect(applyFilter(list, NO_FILTER).map((r) => r.mouse.id)).toEqual(["a", "b", "c"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "le55" }).map((r) => r.mouse.id)).toEqual(["a"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "le70" }).map((r) => r.mouse.id)).toEqual(["a", "b"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "gt70" }).map((r) => r.mouse.id)).toEqual(["c"]);
    expect(applyFilter(list, { ...NO_FILTER, shape: "right" }).map((r) => r.mouse.id)).toEqual(["a"]);
    expect(applyFilter(list, { ...NO_FILTER, connection: "wireless" }).map((r) => r.mouse.id)).toEqual(["b", "c"]);
  });
  it("can return an empty list", () => {
    expect(applyFilter(list, { weight: "le55", shape: "symmetric", connection: "all" })).toEqual([]);
  });
});

describe("compareWith", () => {
  const cur = m("cur", 125, 63, 60, { heightMm: 40 });
  it("shows signed differences and ほぼ同じ within 1", () => {
    expect(compareWith(cur, m("x", 121, 63.5, 48, { heightMm: 38 }))).toBe("今のマウスより 長さ −4mm・幅 ほぼ同じ・高さ −2mm・重さ −12g");
    expect(compareWith(cur, m("y", 130.5, 66, 61, { heightMm: 40 }))).toBe("今のマウスより 長さ +5.5mm・幅 +3mm・高さ ほぼ同じ・重さ ほぼ同じ");
  });
  it("says so when everything is within 1", () => {
    expect(compareWith(cur, m("z", 125.5, 63, 60.5, { heightMm: 40 }))).toBe("今のマウスとほぼ同じ大きさ・重さ");
  });
  it("marks the mouse you already use", () => {
    expect(compareWith(cur, cur)).toBe("今使っているマウス");
  });
});

describe("handFrom", () => {
  it("needs length and grip; width is optional", () => {
    expect(handFrom({ lengthCm: 18.5, widthCm: null, grip: "claw" })).toEqual({ lengthCm: 18.5, widthCm: null, grip: "claw" });
    expect(handFrom({ lengthCm: null, widthCm: 9, grip: "claw" })).toBeNull();
    expect(handFrom({ lengthCm: 18.5, widthCm: 9, grip: null })).toBeNull();
    expect(handFrom(null)).toBeNull();
  });
});

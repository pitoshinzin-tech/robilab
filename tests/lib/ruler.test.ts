import { describe, it, expect } from "vitest";
import { RULER_LABEL_CM, rulerLayout, rulerRoomCm } from "@/lib/ruler";

describe("rulerLayout(振り向きの実寸の定規)", () => {
  it("画面に収まるときは全部を出し、目盛りは 1cm ごと(5cm ごとに長い)", () => {
    const r = rulerLayout(10, 30);
    expect(r.shownCm).toBe(10);
    expect(r.restCm).toBe(0);
    expect(r.ticks.map((t) => t.cm)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.ticks.filter((t) => t.major).map((t) => t.cm)).toEqual([0, 5, 10]);
  });
  it("画面より長いときは折り返さず、出せる分と「あと n cm」", () => {
    const r = rulerLayout(34.6, 8.4);
    expect(r.shownCm).toBe(8);
    expect(r.restCm).toBe(26.6);
    expect(r.ticks).toHaveLength(9);
  });
  it("振り向き 10〜80cm・画面 4〜30cm で、出す長さは画面より長くならない", () => {
    for (let cm = 10; cm <= 80; cm += 0.7) for (const room of [4, 8.4, 12, 30]) {
      const r = rulerLayout(cm, room);
      expect(r.shownCm).toBeLessThanOrEqual(room);
      expect(r.shownCm + r.restCm).toBeCloseTo(cm, 0);
      expect(r.ticks.length).toBe(Math.floor(r.shownCm) + 1);
    }
  });
  it("おかしな値でも壊れない", () => {
    expect(rulerLayout(Number.NaN, 10)).toEqual({ shownCm: 0, restCm: 0, ticks: [{ cm: 0, major: true }] });
    expect(rulerLayout(20, 0).shownCm).toBe(0);
  });
});

describe("rulerRoomCm(定規に使う長さ。整数の cm)", () => {
  it("収まるときは測った幅の整数の cm、収まらないときは「あと n cm」の分を空ける", () => {
    expect(rulerRoomCm(10, 8.23)).toBe(4);
    expect(rulerRoomCm(5, 8.23)).toBe(8);
    expect(rulerRoomCm(34.6, 15.6)).toBe(11);
    // 整数に切ると収まらなくなる長さ(8.1cm・幅 8.23cm)は、「あと 0.1cm」の分も空ける
    expect(rulerRoomCm(8.1, 8.23)).toBe(4);
    expect(rulerRoomCm(8, 8.23)).toBe(8);
  });
  it("10〜80cm・幅 4〜30cm で、定規と「あと n cm」が測った幅を越えない", () => {
    for (let cm = 10; cm <= 80; cm += 0.7) for (const avail of [4, 8.23, 10.5, 12, 15.6, 30]) {
      const room = rulerRoomCm(cm, avail);
      expect(room).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(room)).toBe(true);
      const r = rulerLayout(cm, room);
      expect(r.shownCm + (r.restCm > 0 ? RULER_LABEL_CM : 0)).toBeLessThanOrEqual(avail);
    }
  });
  it("おかしな値でも負にならない", () => {
    expect(rulerRoomCm(Number.NaN, 10)).toBe(10);
    expect(rulerRoomCm(20, Number.NaN)).toBe(0);
    expect(rulerRoomCm(20, 2)).toBe(0);
  });
});

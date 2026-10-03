import { describe, it, expect } from "vitest";
import { MICE, mouseById } from "@/data/mice";
import { MICE_IDS } from "@/data/mice-ids";
import { DEVICES } from "@/data/devices";
import { compareWith, fitTarget, isFitMouse, rankMice } from "@/lib/mouse-fit";
import { recommendReason } from "@/lib/mouse-reason";
import { connectionLabel, shapeLabel, withUnit } from "@/lib/gear-labels";
import { GRIPS } from "@/lib/my-settings";

const MAKER_HOSTS = ["logi.com", "logitechg.com", "logicool.co.jp", "razer.com", "benq.com", "pulsar.gg", "finalmouse.com", "lamzu.com", "endgamegear.com", "vaxee.co", "gloriousgaming.com", "steelseries.com", "corsair.com", "hyperx.com", "atk.store", "scyrox.com", "asus.com", "elecom.co.jp"];
const NOT_COMPARABLE = ["finalmouse-ultralightx", "glorious-model-o-2-wireless", "scyrox-v8", "vaxee-e1-wireless", "zowie-ec2-cw", "zowie-ec2-dw", "zowie-u2-dw", "zowie-za13-dw"];

describe("mice data", () => {
  it("54 機種で id が重ならず、devices.ts に同じ名前のマウスとして入っている", () => {
    expect(MICE).toHaveLength(54);
    expect(new Set(MICE.map((m) => m.id)).size).toBe(MICE.length);
    for (const m of MICE) {
      const d = DEVICES.find((x) => x.id === m.id);
      expect(d?.category, m.id).toBe("mouse");
      expect(`${d?.brand} ${d?.name}`, m.id).toBe(`${m.brand} ${m.name}`);
    }
  });
  it("MICE_IDS は MICE と同じ並び", () => {
    expect([...MICE_IDS]).toEqual(MICE.map((m) => m.id));
  });
  it("数字は現実の範囲か null(公式にないものは作らない)", () => {
    const range = (v: number | null, lo: number, hi: number, id: string) => {
      if (v === null) return;
      expect(v, id).toBeGreaterThanOrEqual(lo);
      expect(v, id).toBeLessThanOrEqual(hi);
    };
    for (const m of MICE) {
      range(m.lengthMm, 90, 140, m.id);
      range(m.widthMm, 50, 80, m.id);
      range(m.heightMm, 20, 50, m.id);
      range(m.weightG, 30, 150, m.id);
    }
  });
  it("長さか幅がない 8 機種だけが、順位の外(比べられません)", () => {
    expect(MICE.filter((m) => !isFitMouse(m)).map((m) => m.id).sort()).toEqual(NOT_COMPARABLE);
  });
  it("https のメーカーのページ(店ではない)と確認日", () => {
    for (const m of MICE) {
      const u = new URL(m.officialUrl);
      expect(u.protocol, m.id).toBe("https:");
      expect(MAKER_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h)), `${m.id}: ${u.hostname}`).toBe(true);
      expect(m.checkedAt, m.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("生産終了は 0 件(公式に記載がない)", () => {
    expect(MICE.filter((m) => m.discontinued)).toEqual([]);
  });
  it("finds a mouse by id", () => {
    expect(mouseById(MICE[0].id)).toBe(MICE[0]);
    expect(mouseById("no-such-mouse")).toBeUndefined();
  });
  it("本物の全機種 × 持ち方 × 手の幅で、距離は数、文と表示に null・NaN・undefined が出ない", () => {
    const fit = MICE.filter(isFitMouse);
    for (const grip of GRIPS) {
      for (const widthCm of [null, 9]) {
        const hand = { lengthCm: 18.5, widthCm, grip };
        const t = fitTarget(hand);
        for (const r of rankMice(hand, fit)) {
          expect(Number.isFinite(r.distance), r.mouse.id).toBe(true);
          const text = recommendReason(hand, t, r.mouse, fit[0]) + (compareWith(fit[0], r.mouse) ?? "");
          expect(text, r.mouse.id).not.toMatch(/null|NaN|undefined/);
        }
      }
    }
    for (const m of MICE) {
      const shown = [withUnit(m.heightMm, "mm"), withUnit(m.weightG, "g"), shapeLabel(m.shape), connectionLabel(m.connection)].join(" ");
      expect(shown, m.id).not.toMatch(/null|NaN|undefined/);
    }
  });
});

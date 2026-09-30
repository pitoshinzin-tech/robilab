import { describe, it, expect } from "vitest";
import type { MouseSpec } from "@/data/mice";
import { MICE } from "@/data/mice";
import { fitTarget, type Hand } from "@/lib/mouse-fit";
import { BANNED_WORDS, compareClause, recommendReason } from "@/lib/mouse-reason";
import { GRIPS } from "@/lib/my-settings";

const m = (lengthMm: number, widthMm: number, weightG: number, extra: Partial<MouseSpec> = {}): MouseSpec => ({
  id: "x", lengthMm, widthMm, heightMm: 38, weightG, shape: "symmetric", connection: "wireless",
  officialUrl: "https://example.com/x", checkedAt: "2026-10-01", ...extra,
});
const palm: Hand = { lengthCm: 18.5, widthCm: null, grip: "palm" }; // 目安の長さ 118.4mm
const reason = (h: Hand & { estimated?: boolean }, mouse: MouseSpec, current?: MouseSpec | null) =>
  recommendReason(h, fitTarget(h), mouse, current);

describe("recommendReason", () => {
  it("matches the owner's example shape (palm 18.5cm, Viper Mini-like numbers)", () => {
    const r = reason(palm, m(118, 53.5, 61, { connection: "wired" }));
    expect(r).toBe(
      "手の長さ 18.5cm のかぶせ持ちには、長さ 118mm がちょうどいい大きさです。" +
      "幅は 53.5mm と細めで指先で細かく動かしやすく、左右対称で持ち方を選ばない形です。" +
      "重さは 61g と、軽さと安定のバランスがいい、充電のいらない有線です。",
    );
  });

  it("uses grip-specific wording for each grip", () => {
    expect(reason({ ...palm, grip: "palm" }, m(100, 60, 60))).toContain("かぶせ持ちには、長さ 100mm はやや小さめで、細かく動かしやすい");
    expect(reason({ ...palm, grip: "claw" }, m(100, 60, 60))).toContain("つかみ持ちには、長さ 100mm はやや小さめで、指を立てて");
    expect(reason({ ...palm, grip: "fingertip" }, m(90, 60, 60))).toContain("つまみ持ちには、長さ 90mm はやや小さめで、指先だけで動かしやすい");
    expect(reason({ ...palm, grip: "claw" }, m(125, 60, 60))).toContain("付け根で支えて安定させやすい");
    expect(reason({ ...palm, grip: "fingertip" }, m(125, 70, 60))).toContain("広めのつくりで");
  });

  it("classifies length as within / short / long around the ±4mm range", () => {
    expect(reason(palm, m(122.4, 60, 60))).toContain("長さ 122.4mm がちょうどいい大きさです");
    expect(reason(palm, m(114.4, 60, 60))).toContain("がちょうどいい大きさです");
    expect(reason(palm, m(114.3, 60, 60))).toContain("はやや小さめで");
    expect(reason(palm, m(122.5, 60, 60))).toContain("はやや大きめで、手のひら全体で支えやすいです");
  });

  it("compares width with the target when the hand width is known", () => {
    const h: Hand = { lengthCm: 18.5, widthCm: 9, grip: "palm" }; // 目安の幅 55.8mm(±3)
    expect(reason(h, m(118, 56, 60))).toContain("幅は 56mm と手の幅に合っていて、");
    expect(reason(h, m(118, 52, 60))).toContain("幅は 52mm と細めで");
    expect(reason(h, m(118, 59.8, 60))).toContain("幅は 59.8mm と広めで手のひらで包み");
  });

  it("uses absolute width classes when the hand width is unknown", () => {
    expect(reason(palm, m(118, 58, 60))).toContain("と細めで");
    expect(reason(palm, m(118, 62, 60))).toContain("幅は 62mm と標準的な太さで、");
    expect(reason(palm, m(118, 66, 60))).toContain("と広めで");
  });

  it("describes the shape", () => {
    expect(reason(palm, m(118, 60, 60))).toContain("左右対称で持ち方を選ばない形です");
    expect(reason(palm, m(118, 60, 60, { shape: "right" }))).toContain("右手用(かぶせ・つかみ持ち向き)の形です");
  });

  it("classifies weight at 55 / 56 / 75 / 76g", () => {
    expect(reason(palm, m(118, 60, 55))).toContain("55g と軽く、素早い振り向き・細かい操作向きの");
    expect(reason(palm, m(118, 60, 56))).toContain("56g と、軽さと安定のバランスがいい");
    expect(reason(palm, m(118, 60, 75))).toContain("75g と、軽さと安定");
    expect(reason(palm, m(118, 60, 76))).toContain("76g と重めで、狙いを止めやすい");
  });

  it("mentions wired / wireless", () => {
    expect(reason(palm, m(118, 60, 60))).toMatch(/ケーブルが引っかからない無線です。$/);
    expect(reason(palm, m(118, 60, 60, { connection: "wired" }))).toMatch(/充電のいらない有線です。$/);
  });

  it("says the hand length is an average when estimated", () => {
    const r = reason({ lengthCm: 18, widthCm: null, grip: "claw", estimated: true }, m(108, 60, 60));
    expect(r.startsWith("平均的な手(18cm)として、つかみ持ちには長さ 108mm がちょうどいい大きさです。")).toBe(true);
    expect(r).not.toContain("手の長さ 18cm");
  });

  it("appends a comparison with the current mouse only when it differs", () => {
    const cur = m(125, 60, 73, { id: "cur" });
    expect(reason(palm, m(118, 60.5, 61), cur)).toMatch(/今のマウスより 7mm 短く、12g 軽いです。$/);
    expect(reason(palm, m(128, 64, 80), cur)).toMatch(/今のマウスより 3mm 長く、4mm 太く、7g 重いです。$/);
    expect(reason(palm, m(125.5, 61, 74), cur)).not.toContain("今のマウス");
    expect(reason(palm, { ...cur }, cur)).not.toContain("今のマウス");
    expect(reason(palm, m(118, 60, 61), null)).not.toContain("今のマウス");
    expect(compareClause(cur, m(119.5, 60, 73))).toBe("今のマウスより 5.5mm 短いです。");
  });

  it("stays short and never uses exaggerated words (every mouse × grip × hand)", () => {
    for (const grip of GRIPS) {
      for (const widthCm of [null, 9]) {
        for (const mouse of MICE) {
          const r = reason({ lengthCm: 18.5, widthCm, grip }, mouse);
          expect(r.split("。").filter(Boolean)).toHaveLength(3);
          expect(r.length).toBeLessThanOrEqual(145);
          for (const w of BANNED_WORDS) expect(r).not.toContain(w);
        }
      }
    }
  });
});

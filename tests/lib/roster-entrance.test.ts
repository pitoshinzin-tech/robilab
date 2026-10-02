import { describe, it, expect } from "vitest";
import { createSeenFlag, isMostlyVisible, rosterSeen, visibleFraction } from "@/lib/motion/roster-entrance";

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}
const throwing = () => {
  throw new Error("SecurityError");
};

describe("名簿が画面に入っている割合(IntersectionObserver の 0.2 とそろえる)", () => {
  it("全部入っている・全部外・半分", () => {
    expect(visibleFraction({ top: 100, bottom: 300 }, 800)).toBe(1);
    expect(visibleFraction({ top: 900, bottom: 1100 }, 800)).toBe(0);
    expect(visibleFraction({ top: -500, bottom: -100 }, 800)).toBe(0);
    expect(visibleFraction({ top: 700, bottom: 900 }, 800)).toBe(0.5);
    expect(visibleFraction({ top: -100, bottom: 100 }, 800)).toBe(0.5);
  });
  it("高さ 0 は 0", () => {
    expect(visibleFraction({ top: 100, bottom: 100 }, 800)).toBe(0);
  });
  it("折り目のすぐ下で少しだけ見えている名簿は「見えている」にしない(入場が 1 回動く)", () => {
    expect(isMostlyVisible({ top: 760, bottom: 1160 }, 800)).toBe(false); // 10%
    expect(isMostlyVisible({ top: 720, bottom: 1120 }, 800)).toBe(true); // 20%
  });
});

describe("入場を見たかどうか(セッションの間おぼえる)", () => {
  it("はじめは見ていない。mark のあとは見た", () => {
    const s = memoryStorage();
    const flag = createSeenFlag("k");
    expect(flag.has(() => s)).toBe(false);
    flag.mark(() => s);
    expect(flag.has(() => s)).toBe(true);
    expect(s.getItem("k")).toBe("1");
  });
  it("ページを読み直した後(新しいフラグ)も、sessionStorage から見たと分かる", () => {
    const s = memoryStorage();
    createSeenFlag("k").mark(() => s);
    expect(createSeenFlag("k").has(() => s)).toBe(true);
  });
  it("storage が使えないとき(例外・なし)も落ちず、同じページの中ではおぼえる", () => {
    const flag = createSeenFlag("k");
    expect(flag.has(throwing)).toBe(false);
    expect(() => flag.mark(throwing)).not.toThrow();
    expect(flag.has(throwing)).toBe(true);
    const flag2 = createSeenFlag("k");
    expect(flag2.has(() => undefined)).toBe(false);
    flag2.mark(() => undefined);
    expect(flag2.has(() => undefined)).toBe(true);
  });
  it("ページごとに別(トップで見ても /types は初めての 1 回が動く)。同じページは同じフラグ", () => {
    const s = memoryStorage();
    rosterSeen("/").mark(() => s);
    expect(rosterSeen("/").has(() => s)).toBe(true);
    expect(rosterSeen("/types").has(() => s)).toBe(false);
    expect(rosterSeen("/")).toBe(rosterSeen("/"));
  });
});

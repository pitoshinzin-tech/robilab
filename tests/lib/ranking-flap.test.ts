import { describe, it, expect } from "vitest";
import { flapRanks } from "@/lib/motion/flap";

const row = (rank: number, name: string, score: number) => ({ rank, name, score });

describe("flapRanks(ランキングが更新されたとき、入れ替わった順位だけをめくる)", () => {
  it("同じ中身なら何もめくらない(読み込み直しただけ)", () => {
    const a = [row(1, "A", 900), row(2, "B", 800)];
    expect(flapRanks(a, a.map((r) => ({ ...r })))).toEqual([]);
  });
  it("名前か点数が変わった順位と、新しく増えた順位だけ", () => {
    const prev = [row(1, "A", 900), row(2, "B", 800)];
    const next = [row(1, "C", 950), row(2, "A", 900), row(3, "B", 800)];
    expect(flapRanks(prev, next)).toEqual([1, 2, 3]);
    expect(flapRanks([row(1, "A", 900), row(2, "B", 800)], [row(1, "A", 900), row(2, "B", 850)])).toEqual([2]);
  });
  it("初めて(前がない)ときはめくらない", () => {
    expect(flapRanks(null, [row(1, "A", 900)])).toEqual([]);
  });
});

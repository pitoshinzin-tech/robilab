import { describe, it, expect } from "vitest";
import { createMoveFilter, filterMovement, inSettle, moveFilterOptions, pushTrailPoint, type MoveDecision, type MoveFilterOptions } from "@/lib/aim/input";
import { AIM_TUNING } from "@/lib/aim/tuning";

function feed(deltas: [number, number][], opts?: MoveFilterOptions) {
  const f = createMoveFilter();
  let sx = 0, sy = 0;
  const decisions: MoveDecision[] = [];
  for (const [dx, dy] of deltas) {
    const m = filterMovement(f, dx, dy, opts);
    sx += m.dx;
    sy += m.dy;
    decisions.push(m.decision);
  }
  return { f, sx, sy, decisions };
}
const steady = (n: number, d: number): [number, number][] => Array.from({ length: n }, () => [d, 0]);

describe("filterMovement(マウスの飛びを捨てる)", () => {
  it("ふつうの動きはそのまま通す", () => {
    const { f, sx, sy } = feed([...steady(20, 5), [3, -4], [0, 0]]);
    expect(sx).toBe(103);
    expect(sy).toBe(-4);
    expect(f.dropped).toBe(0);
  });
  it("1 回きりの巨大な動きは捨てる", () => {
    const { f, sx, sy } = feed([...steady(20, 5), [900, -700], ...steady(5, 5)]);
    expect(sx).toBe(125);
    expect(sy).toBe(0);
    expect(f.dropped).toBe(1);
  });
  it("大きい動きが 2 回続いたら本物の速い動きとして、両方とも足す", () => {
    const { f, sx } = feed([...steady(20, 5), [400, 0], [450, 0], [420, 0], ...steady(3, 5)]);
    expect(sx).toBe(100 + 400 + 450 + 420 + 15);
    expect(f.dropped).toBe(0);
  });
  it("minCounts 以下の動きは、中央値よりずっと大きくても捨てない", () => {
    const opts = moveFilterOptions(0.028);
    const { f, sx } = feed([...steady(20, 2), [35, 0], ...steady(2, 2)], opts);
    expect(sx).toBe(40 + 35 + 4);
    expect(f.dropped).toBe(0);
  });
  it("minCounts を少し超える 1 回きりの動きは捨てる(下限は角度で決める)", () => {
    const opts = moveFilterOptions(0.028);
    const { f, sx } = feed([...steady(20, 2), [40, 0], ...steady(2, 2)], opts);
    expect(sx).toBe(40 + 4);
    expect(f.dropped).toBe(1);
  });
  it("速く動かしている間(中央値が大きい)は、その factor 倍までは捨てない", () => {
    const { f, sx } = feed([...steady(16, 60), [400, 0], ...steady(2, 60)]);
    expect(sx).toBe(16 * 60 + 400 + 120);
    expect(f.dropped).toBe(0);
  });
  it("動きの記録がないときも、1 回きりの巨大な動きは捨てる", () => {
    const { f, sx } = feed([[2000, 0], [3, 0]]);
    expect(sx).toBe(3);
    expect(f.dropped).toBe(1);
  });
  it("中央値は直近の outlierWindow 回ぶんで見る", () => {
    const f = createMoveFilter();
    for (let i = 0; i < 100; i++) filterMovement(f, 5, 0);
    expect(f.recent.length).toBe(AIM_TUNING.outlierWindow);
  });
});

describe("moveFilterOptions(下限を角度で決める)", () => {
  it("感度が低い(度/カウントが小さい)ほど、下限のカウントは大きい", () => {
    expect(moveFilterOptions(0.028).minCounts).toBeCloseTo(AIM_TUNING.outlierMinDeg / 0.028, 5);
    expect(Math.round(moveFilterOptions(0.028).minCounts)).toBe(36);
  });
  it("感度が高くても、下限は outlierMinCountsFloor より小さくならない", () => {
    expect(moveFilterOptions(0.2).minCounts).toBe(AIM_TUNING.outlierMinCountsFloor);
    expect(moveFilterOptions(0.2).minCounts).toBe(15);
  });
  it("おかしな感度(0 以下・数でない)でも下限の値を返す", () => {
    expect(moveFilterOptions(0).minCounts).toBe(AIM_TUNING.outlierMinCountsFloor);
    expect(moveFilterOptions(Number.NaN).minCounts).toBe(AIM_TUNING.outlierMinCountsFloor);
  });
  it("ほかの値は tuning の値", () => {
    const o = moveFilterOptions(0.05);
    expect(o.factor).toBe(AIM_TUNING.outlierFactor);
    expect(o.window).toBe(AIM_TUNING.outlierWindow);
    expect(o.pairCos).toBe(AIM_TUNING.outlierPairCos);
    expect(o.pairRatio).toBe(AIM_TUNING.outlierPairRatio);
    expect(o.burstJumpFactor).toBe(AIM_TUNING.burstJumpFactor);
  });
});

describe("filterMovement(2 回続いた大きい動きの見分け)", () => {
  it("同じ向き・そろった大きさの 2 回は本物の速い動きとして通す", () => {
    const { f, sx, sy, decisions } = feed([...steady(20, 5), [300, 40], [260, 20], ...steady(2, 5)]);
    expect(sx).toBe(100 + 300 + 260 + 10);
    expect(sy).toBe(60);
    expect(f.dropped).toBe(0);
    expect(decisions[20]).toBe("held");
    expect(decisions[21]).toBe("pair-pass");
  });
  it("逆向きの 2 回は、1 回目を捨てて 2 回目を保留する(次が小さければ 2 回目も捨てる)", () => {
    const { f, sx, decisions } = feed([...steady(20, 5), [400, 0], [-400, 0], ...steady(2, 5)]);
    expect(sx).toBe(100 + 10);
    expect(f.dropped).toBe(2);
    expect(decisions[21]).toBe("dropped-held");
    expect(decisions[22]).toBe("dropped");
  });
  it("直角(cos 0)の 2 回も、1 回目を捨てる", () => {
    const { f, sy } = feed([...steady(20, 5), [400, 0], [0, 400], [0, 380], ...steady(2, 5)]);
    // 1 回目は捨て、2 回目と 3 回目はそろっているので通す
    expect(sy).toBe(780);
    expect(f.dropped).toBe(1);
  });
  it("大きさが 3 倍より違う 2 回は、1 回目を捨てる", () => {
    const { f, sx } = feed([...steady(20, 5), [100, 0], [2000, 0], ...steady(2, 5)]);
    // 100 を捨て、2000 を保留し、次が小さいので 2000 も捨てる
    expect(sx).toBe(100 + 10);
    expect(f.dropped).toBe(2);
  });
  it("大きさの比がちょうど 3 倍なら通す", () => {
    const { f, sx } = feed([...steady(20, 5), [100, 0], [300, 0], ...steady(2, 5)]);
    expect(sx).toBe(100 + 100 + 300 + 10);
    expect(f.dropped).toBe(0);
  });
  it("速い動きの途中でも、直前に通した動きの 4 倍を超える動きは保留する", () => {
    const { f, sx, decisions } = feed([...steady(20, 5), [200, 0], [200, 0], [1000, 0], ...steady(2, 5)]);
    // 200, 200 は通し、1000(200 の 5 倍)は保留して、次が小さいので捨てる
    expect(sx).toBe(100 + 400 + 10);
    expect(f.dropped).toBe(1);
    expect(decisions[22]).toBe("held");
  });
  it("速い動きの途中で 4 倍以内の動きは保留しない", () => {
    const { f, sx, decisions } = feed([...steady(20, 5), [200, 0], [200, 0], [800, 0], ...steady(2, 5)]);
    expect(sx).toBe(100 + 1200 + 10);
    expect(f.dropped).toBe(0);
    // 速い動きの途中で通した大きい動きは、診断で見分けられるよう burst-pass
    expect(decisions[22]).toBe("burst-pass");
  });
  it("速い動きが加速していく(毎回 4 倍以内)ときは捨てない", () => {
    const { f, sx } = feed([...steady(20, 5), [150, 0], [200, 0], [400, 0], [900, 0], [1500, 0], ...steady(2, 5)]);
    expect(sx).toBe(100 + 150 + 200 + 400 + 900 + 1500 + 10);
    expect(f.dropped).toBe(0);
  });
  it("大きさが 3 倍より違う大きい動きが交互に続いても、照準が止まりっぱなしにならない", () => {
    const opts = moveFilterOptions(0.028);
    const seq: [number, number][] = [[300, 0], [80, 0], [300, 0], [80, 0], [300, 0], [80, 0]];
    const { sx, decisions } = feed([...steady(16, 5), ...seq], opts);
    const fast = decisions.slice(16);
    const passedCount = fast.filter((d) => d === "passed" || d === "burst-pass" || d === "pair-pass" || d === "mismatch-pass").length;
    expect(passedCount).toBeGreaterThanOrEqual(seq.length / 2);
    // 大きい動きの合計(1140)の半分以上は視点に届く
    expect(sx - 80).toBeGreaterThanOrEqual(1140 / 2);
    // 2 回続けてそろわなかったら、2 回目は通す
    expect(fast[2]).toBe("mismatch-pass");
  });
  it("そろわない大きい動きは、捨てても中央値に入る(しきい値がついてくる)", () => {
    const opts = moveFilterOptions(0.028);
    const f = createMoveFilter();
    for (let i = 0; i < 16; i++) filterMovement(f, 5, 0, opts);
    filterMovement(f, 300, 0, opts);
    const m = filterMovement(f, 80, 0, opts);
    expect(m.decision).toBe("dropped-held");
    expect(f.recent.at(-1)).toBe(80);
  });
  it("動きが 0 のイベントは、保留している動きを捨てない", () => {
    const { f, sx, decisions } = feed([...steady(20, 5), [300, 0], [0, 0], [280, 0], ...steady(2, 5)]);
    expect(decisions[21]).toBe("passed");
    expect(decisions[22]).toBe("pair-pass");
    expect(sx).toBe(100 + 300 + 280 + 10);
    expect(f.dropped).toBe(0);
  });
  it("動きが 0 のイベントは、中央値・burst を変えない", () => {
    const f = createMoveFilter();
    for (let i = 0; i < 16; i++) filterMovement(f, 5, 0);
    filterMovement(f, 200, 0);
    filterMovement(f, 200, 0);
    const before = { recent: [...f.recent], burst: f.burst, lastMag: f.lastMag };
    filterMovement(f, 0, 0);
    expect({ recent: f.recent, burst: f.burst, lastMag: f.lastMag }).toEqual(before);
  });
  it("返す limit と median は、その動きを判断したときの値", () => {
    const f = createMoveFilter();
    for (let i = 0; i < 16; i++) filterMovement(f, 2, 0, moveFilterOptions(0.028));
    const m = filterMovement(f, 3, 4, moveFilterOptions(0.028));
    expect(m.median).toBe(2);
    expect(m.limit).toBeCloseTo(1 / 0.028, 5);
    expect(m.decision).toBe("passed");
  });
});

describe("inSettle(ロック・全画面・大きさの変化の直後)", () => {
  it("変化がまだないときは false", () => {
    expect(inSettle(1000, null, 150)).toBe(false);
  });
  it("変化から settleMs より前は true、settleMs 以後は false", () => {
    expect(inSettle(1000, 1000, 150)).toBe(true);
    expect(inSettle(1149, 1000, 150)).toBe(true);
    expect(inSettle(1150, 1000, 150)).toBe(false);
    expect(inSettle(5000, 1000, 150)).toBe(false);
  });
  it("時刻が戻っている(変化の時刻より前)ときは false", () => {
    expect(inSettle(900, 1000, 150)).toBe(false);
  });
});

describe("pushTrailPoint(軌跡の点を減らす)", () => {
  it("前の点に近すぎる点は足さない", () => {
    const seg: { x: number; y: number }[] = [];
    expect(pushTrailPoint(seg, { x: 0, y: 0 })).toBe(true);
    expect(pushTrailPoint(seg, { x: 0.1, y: 0 })).toBe(false);
    expect(pushTrailPoint(seg, { x: 0.5, y: 0 })).toBe(true);
    expect(seg).toHaveLength(2);
  });
  it("点が多くなりすぎたら古い点から消し、最新の点は残す", () => {
    const seg: { x: number; y: number }[] = [];
    for (let i = 0; i < 5000; i++) pushTrailPoint(seg, { x: i, y: 0 }, 0.3, 100);
    expect(seg.length).toBeLessThanOrEqual(100);
    expect(seg.at(-1)).toEqual({ x: 4999, y: 0 });
  });
  it("足した点は、渡した点のコピー(あとで書き換えられても変わらない)", () => {
    const seg: { x: number; y: number }[] = [];
    const p = { x: 1, y: 1 };
    pushTrailPoint(seg, p);
    p.x = 99;
    expect(seg[0].x).toBe(1);
  });
});

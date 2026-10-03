import { describe, it, expect } from "vitest";
import { bestRank, byPopularity } from "@/lib/gear-popularity";
import { PADS } from "@/data/pads";

describe("bestRank", () => {
  it("売れ筋のいちばん高い順位を読む(URL の中の数字は読まない)", () => {
    expect(bestRank("Amazon.co.jp 売れ筋ランキング(https://www.amazon.co.jp/gp/bestsellers/computers/8417538051 、2026-10-03 取得) 15位(NINJA FX ゼロ SOFT XXL)/ 価格.com マウスパッド人気ランキング 2026年9月 3位(ゼロ XL)ほか")).toBe(3);
    expect(bestRank("Amazon.co.jp 売れ筋ランキング 32位(99式 XSOFT L)・41位(99式 SOFT XXL)")).toBe(32);
  });
  it("プロ使用率は数えない", () => {
    expect(bestRank("Amazon.co.jp 11位 / ProSettings.net プロ使用率 1位(2026-10-03 取得)")).toBe(11);
    expect(bestRank("ProSettings.net プロ使用率 3位")).toBeNull();
  });
  it("順位がなければ null", () => {
    expect(bestRank("ランキング上位には無いが、主要ブランドの定番として CEO 確認用に追加(編集判断)")).toBeNull();
    expect(bestRank("src/data/devices.ts に既に登録済み(category: pad)")).toBeNull();
    expect(bestRank("")).toBeNull();
  });
});

describe("byPopularity", () => {
  it("順位の高い順・順位なしは後ろ・同じならもとの並び", () => {
    const items = [
      { id: "a", selectionBasis: "編集判断" },
      { id: "b", selectionBasis: "Amazon 5位" },
      { id: "c", selectionBasis: "価格.com 2位" },
      { id: "d", selectionBasis: "" },
      { id: "e", selectionBasis: "Amazon 2位" },
    ];
    expect(byPopularity(items).map((x) => x.id)).toEqual(["c", "e", "b", "a", "d"]);
  });
  it("もとの配列は変えない", () => {
    const items = [{ selectionBasis: "9位" }, { selectionBasis: "1位" }];
    byPopularity(items);
    expect(items[0].selectionBasis).toBe("9位");
  });
  it("本物のデータ:画面に出すパッドの先頭は Amazon 1 位の G240", () => {
    expect(byPopularity(PADS.filter((p) => !p.hidden))[0].id).toBe("logicool-g240");
  });
});

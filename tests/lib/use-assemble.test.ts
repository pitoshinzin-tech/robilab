import { describe, it, expect } from "vitest";
import { shouldAssemble } from "@/lib/motion/use-assemble";

describe("shouldAssemble(結果の絵を組み上げるか)", () => {
  it("ページを読み込んだとき(ハイドレーション)は組み上げる", () => {
    expect(shouldAssemble(true, true)).toBe(true);
    expect(shouldAssemble(true, false)).toBe(true);
  });
  it("View Transition で移ってきたとき(対応するブラウザ)は組み上げない(移る動きだけ)", () => {
    expect(shouldAssemble(false, true)).toBe(false);
  });
  it("View Transition がないブラウザで移ってきたときは組み上げる(代わりの動き)", () => {
    expect(shouldAssemble(false, false)).toBe(true);
  });
});

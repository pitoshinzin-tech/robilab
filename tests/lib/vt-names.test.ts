import { describe, it, expect } from "vitest";
import { TYPES } from "@/data/types";
import {
  MORPH_LINE, MORPH_PIXEL, NAV_BACK, NAV_FORWARD, PAGE_VT_CLASSES, TYPE_REVEAL, TYPE_ROW,
  VT_SITE_HEADER, VT_TAB_BAR, VT_TODAY_KANJI, VT_TYPE_SPRITE, isVtIdent, playerVtName, typeVtName,
} from "@/lib/motion/vt-names";

describe("View Transition の名前(1 ページに同じ名前が 2 つあるとブラウザは遷移をやめる)", () => {
  const fixed = [VT_SITE_HEADER, VT_TAB_BAR, VT_TODAY_KANJI, VT_TYPE_SPRITE];
  const typed = TYPES.map((t) => typeVtName(t.code));
  it("どれも CSS の識別子として正しい", () => {
    for (const n of [...fixed, ...typed, playerVtName("0b7c2f8e-1d2a-4c55-9a7e-3f1e2d4c5b6a")]) expect(isVtIdent(n), n).toBe(true);
  });
  it("決まった名前と 16 タイプの名前が重ならない", () => {
    const all = [...fixed, ...typed];
    expect(new Set(all).size).toBe(all.length);
  });
  it("player の名前は記号を落とし、数字で始まる id でも識別子になる", () => {
    expect(playerVtName("12ab-CD_ef")).toBe("player-12ab-CD_ef");
    expect(playerVtName("a/b c")).toBe("player-abc");
    expect(isVtIdent(playerVtName("9"))).toBe(true);
  });
  it("isVtIdent は none / auto と数字始まりを外す", () => {
    expect(isVtIdent("none")).toBe(false);
    expect(isVtIdent("auto")).toBe(false);
    expect(isVtIdent("1abc")).toBe(false);
    expect(isVtIdent("")).toBe(false);
  });
});

describe("遷移の型とクラス", () => {
  it("型は 4 つで重ならない", () => {
    expect(new Set([NAV_FORWARD, NAV_BACK, TYPE_REVEAL, TYPE_ROW]).size).toBe(4);
  });
  it("ページの切り替えは、型のない移動(ブラウザの戻るを含む)でもスキャンライン", () => {
    expect(PAGE_VT_CLASSES.default).toBe("rl-scan");
    expect(PAGE_VT_CLASSES[NAV_FORWARD]).toBe("rl-forward");
    expect(PAGE_VT_CLASSES[NAV_BACK]).toBe("rl-back");
    expect(PAGE_VT_CLASSES[TYPE_REVEAL]).toBe("none");
  });
  it("共有の要素のクラスも識別子", () => {
    expect(isVtIdent(MORPH_PIXEL) && isVtIdent(MORPH_LINE)).toBe(true);
  });
});

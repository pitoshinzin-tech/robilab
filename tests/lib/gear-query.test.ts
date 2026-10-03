import { describe, it, expect } from "vitest";
import { firstParam, pick, queryHref } from "@/lib/gear-query";

describe("gear-query", () => {
  it("firstParam:重なりは最初の値、なければ null", () => {
    expect(firstParam({ a: "x" }, "a")).toBe("x");
    expect(firstParam({ a: ["y", "z"] }, "a")).toBe("y");
    expect(firstParam({ a: [] }, "a")).toBeNull();
    expect(firstParam({}, "a")).toBeNull();
  });
  it("firstParam:空の文字は空のまま返す(選ばないの印)", () => {
    expect(firstParam({ a: "" }, "a")).toBe("");
  });
  it("pick:決まった値だけ通し、ほか(大文字違い・長い文字)は fallback", () => {
    const allowed = ["all", "glass"] as const;
    expect(pick("glass", allowed, "all")).toBe("glass");
    expect(pick("GLASS", allowed, "all")).toBe("all");
    expect(pick("x".repeat(5000), allowed, "all")).toBe("all");
    expect(pick(null, allowed, "all")).toBe("all");
    expect(pick("", allowed, "all")).toBe("all");
  });
  it("pick:prototype 由来の名前は通さない", () => {
    expect(pick("constructor", ["all"] as const, "all")).toBe("all");
    expect(pick("__proto__", ["all"] as const, "all")).toBe("all");
  });
  it("queryHref:all と null は書かず、決まった順で並べる", () => {
    expect(queryHref("/pads", [["surface", "all"], ["size", null]])).toBe("/pads");
    expect(queryHref("/pads", [["surface", "glass"], ["size", "XL"]])).toBe("/pads?surface=glass&size=XL");
    expect(queryHref("/skates", [["mouse", "a b"]])).toBe("/skates?mouse=a+b");
  });
  it("queryHref:& や = や日本語は壊れずに符号化される", () => {
    expect(queryHref("/x", [["q", "a&b=c"]])).toBe("/x?q=a%26b%3Dc");
    expect(queryHref("/x", [["q", "あ"]])).toBe("/x?q=%E3%81%82");
  });
});

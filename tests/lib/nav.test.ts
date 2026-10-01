import { describe, it, expect } from "vitest";
import { NAV_TABS, activeSubnavHref, activeTabId, matchesPath, normalizePath, subnavFor } from "@/lib/nav";

describe("normalizePath / matchesPath", () => {
  it("? と # と末尾の / を外す", () => {
    expect(normalizePath("/lobby/?game=x#a")).toBe("/lobby");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath(null)).toBe("");
  });
  it("区切り単位で一致する", () => {
    expect(matchesPath("/type/ARCH", "/type")).toBe(true);
    expect(matchesPath("/types", "/type")).toBe(false);
    expect(matchesPath("/mypage", "/my")).toBe(false);
  });
});

describe("activeTabId", () => {
  it("タブの順と名前", () => {
    expect(NAV_TABS.map((t) => t.label)).toEqual(["今日の文字", "診断", "マウス", "仲間", "マイ設定"]);
  });
  it.each([
    ["/aim", "aim"], ["/aim#ranking", "aim"],
    ["/diagnosis", "diagnosis"], ["/type/ARCH", "diagnosis"], ["/types", "diagnosis"], ["/types/", "diagnosis"],
    ["/mouse", "mouse"], ["/tools/sensitivity", "mouse"], ["/pros", "mouse"],
    ["/lobby", "lobby"], ["/lobby/", "lobby"], ["/lobby/inbox", "lobby"], ["/lobby/abc/x", "lobby"],
    ["/my", "my"], ["/my?x=1", "my"],
  ])("%s → %s", (path, id) => {
    expect(activeTabId(path)).toBe(id);
  });
  it.each([["/"], [""], [null], [undefined], ["/tools"], ["/mypage"], ["/typesx"], ["/c/abc"], ["/terms"]])("%s → null", (path) => {
    expect(activeTabId(path)).toBeNull();
  });
});

describe("subnav", () => {
  it("プロ設定はデータが入るまで出さない", () => {
    expect(subnavFor("mouse", false).map((i) => i.href)).toEqual(["/mouse", "/tools/sensitivity"]);
    expect(subnavFor("mouse", true).map((i) => i.href)).toEqual(["/mouse", "/tools/sensitivity", "/pros"]);
    expect(subnavFor("diagnosis", false).map((i) => i.label)).toEqual(["診断", "タイプ一覧"]);
  });
  it("今いるページの印", () => {
    const items = subnavFor("diagnosis", false);
    expect(activeSubnavHref("/types/", items)).toBe("/types");
    expect(activeSubnavHref("/diagnosis", items)).toBe("/diagnosis");
    expect(activeSubnavHref("/type/ARCH", items)).toBeNull();
    expect(activeSubnavHref(null, items)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { MOUSE_ID_RE, MY_SETTINGS_STORAGE_KEY, myMouseIdFrom, preselectQuery, shouldPreselect } from "@/lib/my-mouse";
import { MY_SETTINGS_KEY } from "@/lib/my-settings-store";
import { CATALOG_ID_RE } from "@/lib/my-settings";

describe("my-mouse", () => {
  it("保存のキーと id の形は、マイ設定と同じ", () => {
    expect(MY_SETTINGS_STORAGE_KEY).toBe(MY_SETTINGS_KEY);
    expect(MOUSE_ID_RE.source).toBe(CATALOG_ID_RE.source);
  });
  it("候補から選んだマウスの id だけ読む", () => {
    expect(myMouseIdFrom(JSON.stringify({ devices: { mouse: { id: "razer-viper-v3-pro" } } }))).toBe("razer-viper-v3-pro");
  });
  it.each([
    [null], [""], ["{"], ["null"], ["[]"], ['"text"'], ["12"],
    [JSON.stringify({ devices: null })],
    [JSON.stringify({ devices: "x" })],
    [JSON.stringify({})],
    [JSON.stringify({ devices: { mouse: null } })],
    [JSON.stringify({ devices: { mouse: { name: "自作マウス" } } })],
    [JSON.stringify({ devices: { mouse: { id: "Razer-Viper" } } })],
    [JSON.stringify({ devices: { mouse: { id: "../evil" } } })],
    [JSON.stringify({ devices: { mouse: { id: "x".repeat(41) } } })],
    [JSON.stringify({ devices: { mouse: { id: 12 } } })],
    [JSON.stringify({ devices: { mouse: { id: "" } } })],
  ])("読めないもの(%s)は null", (raw) => {
    expect(myMouseIdFrom(raw)).toBeNull();
  });
  it("URL にマウスの指定がまったくないときだけ選び直す(?mouse= は「選ばない」を選んだ印)", () => {
    expect(shouldPreselect("")).toBe(true);
    expect(shouldPreselect("?material=glass")).toBe(true);
    expect(shouldPreselect("?mouse=")).toBe(false);
    expect(shouldPreselect("?mouse=razer-viper-v3-pro")).toBe(false);
  });
});

describe("preselectQuery(選び直しの URL に写すもの)", () => {
  it("mouse と from=my に、決まった material・shape だけを写す", () => {
    expect(preselectQuery("?material=glass&shape=dot", "m1")).toBe("mouse=m1&material=glass&shape=dot&from=my");
    expect(preselectQuery("", "m1")).toBe("mouse=m1&from=my");
  });
  it("決まっていない値・ほかのキー・元の from は捨てる", () => {
    expect(preselectQuery("?material=ceramic&shape=<x>&utm_source=a&next=//evil.example&from=evil&foo=1", "m1")).toBe("mouse=m1&from=my");
    expect(preselectQuery("?material=GLASS&shape=dot&shape=full", "m1")).toBe("mouse=m1&shape=dot&from=my");
  });
});

describe("preselectQuery の all", () => {
  it("決まった値 1 の all だけ写す", () => {
    expect(preselectQuery("?all=1", "m1")).toBe("mouse=m1&all=1&from=my");
    expect(preselectQuery("?material=glass&all=1", "m1")).toBe("mouse=m1&material=glass&all=1&from=my");
  });
  it("ほかの値は捨てる", () => {
    expect(preselectQuery("?all=true", "m1")).toBe("mouse=m1&from=my");
    expect(preselectQuery("?all=0&all=1", "m1")).toBe("mouse=m1&from=my");
    expect(preselectQuery("?all=", "m1")).toBe("mouse=m1&from=my");
  });
});

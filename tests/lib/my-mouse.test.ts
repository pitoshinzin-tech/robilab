import { describe, it, expect } from "vitest";
import { MOUSE_ID_RE, MY_SETTINGS_STORAGE_KEY, myMouseIdFrom, shouldPreselect } from "@/lib/my-mouse";
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

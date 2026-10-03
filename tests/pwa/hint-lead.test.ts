import { describe, it, expect } from "vitest";
import { SHORTCUT_NAMES, hintLead } from "@/lib/pwa/install-hint";
import { APP_SHORTCUTS } from "@/lib/pwa/manifest-data";

describe("hintLead(案内の 1 行目)", () => {
  it("ショートカットの名前は manifest の表(APP_SHORTCUTS)と同じ", () => {
    expect(SHORTCUT_NAMES).toBe(APP_SHORTCUTS.map((s) => s.name).join("・"));
    expect(SHORTCUT_NAMES).toBe("今日の文字・仲間・マウス探し");
  });
  it("/aim は今日の文字の画面にいる理由とつなげる(端末によらない)", () => {
    for (const p of ["ios", "android", "desktop"] as const) expect(hintLead("aim", p)).toBe("アイコンから、毎日の今日の文字にワンタップで。");
  });
  it("/my の Android は長押し、PC は右クリックのショートカットでできることを言う", () => {
    expect(hintLead("my", "android")).toBe("アプリのように全画面で開けます。アイコンを長押しすると、今日の文字・仲間・マウス探しにすぐ行けます。");
    expect(hintLead("my", "desktop")).toBe("アプリのように別のウインドウで開けます。アイコンを右クリックすると、今日の文字・仲間・マウス探しにすぐ行けます。");
  });
  it("/my の iPhone はショートカットがないので言わない", () => {
    expect(hintLead("my", "ios")).not.toMatch(/長押し|右クリック/);
    expect(hintLead("my", "ios")).toContain("1 回で");
    expect(hintLead("my", "other")).toBe("アプリのように全画面で開けます。");
  });
  it("謝らない・矢印を使わない", () => {
    for (const place of ["my", "aim"] as const) for (const p of ["ios", "android", "desktop", "other"] as const) {
      expect(hintLead(place, p)).not.toMatch(/すみません|申し訳|[←→]/);
    }
  });
});

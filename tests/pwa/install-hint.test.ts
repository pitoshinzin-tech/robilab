import { describe, it, expect } from "vitest";
import { jstDate } from "@/lib/aim/daily";
import { EMPTY_HINT, HINT_MAX_DAYS, HINT_STORAGE_KEY, detectPlatform, dismissHint, hintView, jstToday, nextHintState, parseHintState, shouldShowHint, type HintState } from "@/lib/pwa/install-hint";

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1",
  ipadOs: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
  winChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  winEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
  winFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
  macChrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
};

describe("detectPlatform(設計書 4-2・4-3)", () => {
  it.each([
    ["iPhone の Safari", UA.iphoneSafari, 5, "ios"],
    ["iPhone の Chrome", UA.iphoneChrome, 5, "ios"],
    ["iPadOS(Mac の顔+タッチ)", UA.ipadOs, 5, "ios"],
    ["Android の Chrome", UA.androidChrome, 5, "android"],
    ["Android の Firefox", UA.androidFirefox, 5, "android"],
    ["PC の Chrome", UA.winChrome, 0, "desktop"],
    ["PC の Edge", UA.winEdge, 0, "desktop"],
    ["Mac の Chrome", UA.macChrome, 0, "desktop"],
    ["PC の Firefox", UA.winFirefox, 0, "other"],
    ["Mac の Safari(タッチなし)", UA.macSafari, 0, "other"],
    ["UA が空", "", 0, "other"],
  ] as const)("%s → %s", (_name, userAgent, maxTouchPoints, expected) => {
    expect(detectPlatform({ userAgent, maxTouchPoints, standalone: false })).toBe(expected);
  });
  it("アプリ表示で開いていれば、端末に関係なく installed", () => {
    for (const userAgent of Object.values(UA)) expect(detectPlatform({ userAgent, maxTouchPoints: 5, standalone: true })).toBe("installed");
  });
});

describe("jstToday(日付の境目は JST の 0 時)", () => {
  it("UTC 14:59:59 はまだ同じ日、15:00 で次の日", () => {
    expect(jstToday(new Date("2026-10-03T14:59:59Z"))).toBe("2026-10-03");
    expect(jstToday(new Date("2026-10-03T15:00:00Z"))).toBe("2026-10-04");
  });
  it.each(["2026-01-01T00:00:00Z", "2026-02-28T15:30:00Z", "2026-12-31T14:59:59Z", "2027-03-01T09:00:00Z"])("今日の文字の jstDate と同じ答え: %s", (iso) => {
    expect(jstToday(new Date(iso))).toBe(jstDate(new Date(iso)));
  });
});

describe("parseHintState(壊れた値でも落ちない)", () => {
  it.each([null, "", "{", "null", "1", '"x"', "[]", '{"v":2,"days":["2026-10-01"],"dismissed":false}', '{"v":1,"days":"2026-10-01"}'])("読めない値は空にする: %s", (raw) => {
    expect(parseHintState(raw)).toEqual(EMPTY_HINT);
  });
  it("days が壊れていても、閉じた記録(dismissed: true)は消さない", () => {
    for (const days of ["2026-10-01", null, 3, { a: 1 }]) {
      expect(parseHintState(JSON.stringify({ v: 1, days, dismissed: true }))).toEqual({ v: 1, days: [], dismissed: true });
    }
    expect(parseHintState(JSON.stringify({ v: 1, dismissed: true }))).toEqual({ v: 1, days: [], dismissed: true });
    expect(parseHintState(JSON.stringify({ v: 1, days: "x", dismissed: false }))).toEqual(EMPTY_HINT);
  });
  it("日付でない要素・重なりを捨て、最初の 4 件だけ。dismissed は true のときだけ", () => {
    const raw = JSON.stringify({ v: 1, days: ["2026-10-01", "x", 3, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"], dismissed: "yes" });
    expect(parseHintState(raw)).toEqual({ v: 1, days: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], dismissed: false });
    expect(parseHintState(JSON.stringify({ v: 1, days: [], dismissed: true })).dismissed).toBe(true);
  });
  it("保存のキーと上限", () => {
    expect(HINT_STORAGE_KEY).toBe("robilab:pwaHint");
    expect(HINT_MAX_DAYS).toBe(4);
  });
});

describe("nextHintState・shouldShowHint(2 日目から最大 3 日)", () => {
  const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"];
  it("1 日目は出さず、2・3・4 日目に出し、5 日目は出さない", () => {
    let s: HintState = EMPTY_HINT;
    const shown = days.map((d) => {
      s = nextHintState(s, d);
      return shouldShowHint(s, d, "android");
    });
    expect(shown).toEqual([false, true, true, true, false]);
    expect(s.days).toEqual(days.slice(0, 4));
  });
  it("同じ日に何度開いても数えるのは 1 回で、同じオブジェクトを返す", () => {
    const s = nextHintState(EMPTY_HINT, "2026-10-01");
    expect(nextHintState(s, "2026-10-01")).toBe(s);
  });
  it("閉じたら二度と出さず、記録も増やさない", () => {
    const s = dismissHint({ v: 1, days: ["2026-10-01"], dismissed: false });
    expect(nextHintState(s, "2026-10-02")).toBe(s);
    expect(shouldShowHint(s, "2026-10-01", "ios")).toBe(false);
  });
  it("other と installed には出さない", () => {
    const s: HintState = { v: 1, days: ["2026-10-01", "2026-10-02"], dismissed: false };
    expect(shouldShowHint(s, "2026-10-02", "ios")).toBe(true);
    expect(shouldShowHint(s, "2026-10-02", "desktop")).toBe(true);
    expect(shouldShowHint(s, "2026-10-02", "other")).toBe(false);
    expect(shouldShowHint(s, "2026-10-02", "installed")).toBe(false);
  });
  it("端末の時計を戻しても落ちない(前の日付も 1 日として数える)", () => {
    const s = nextHintState({ v: 1, days: ["2026-10-03", "2026-10-04"], dismissed: false }, "2026-10-02");
    expect(s.days).toEqual(["2026-10-03", "2026-10-04", "2026-10-02"]);
    expect(typeof shouldShowHint(s, "2026-10-02", "ios")).toBe("boolean");
  });
});

describe("hintView", () => {
  const today = "2026-10-03";
  it("/aim の 1 日目:出さず、今日を記録する", () => {
    expect(hintView({ place: "aim", platform: "android", stored: null, today })).toEqual({ show: false, platform: "android", next: { v: 1, days: [today], dismissed: false } });
  });
  it("/aim の 2 日目:出し、今日を足す", () => {
    const v = hintView({ place: "aim", platform: "ios", stored: JSON.stringify({ v: 1, days: ["2026-10-02"], dismissed: false }), today });
    expect(v.show).toBe(true);
    expect(v.next?.days).toEqual(["2026-10-02", today]);
  });
  it("/aim の同じ日の 2 回目:出し、保存し直さない", () => {
    const v = hintView({ place: "aim", platform: "ios", stored: JSON.stringify({ v: 1, days: ["2026-10-02", today], dismissed: false }), today });
    expect(v).toEqual({ show: true, platform: "ios", next: null });
  });
  it("/aim で localStorage が使えないときは出さず、保存もしない", () => {
    expect(hintView({ place: "aim", platform: "ios", stored: undefined, today })).toEqual({ show: false, platform: "ios", next: null });
  });
  it("/aim をアプリ表示で開いたら出さず、閉じたことにする(ブラウザに戻っても二度と出さない)", () => {
    const v = hintView({ place: "aim", platform: "installed", stored: JSON.stringify({ v: 1, days: ["2026-10-02"], dismissed: false }), today });
    expect(v.show).toBe(false);
    expect(v.next?.dismissed).toBe(true);
  });
  it("/aim で today が無いときは出さない", () => {
    expect(hintView({ place: "aim", platform: "ios", stored: null }).show).toBe(false);
  });
  it.each(["ios", "android", "desktop", "other"] as const)("/my は %s に出し、来訪を数えない", (platform) => {
    expect(hintView({ place: "my", platform, stored: null })).toEqual({ show: true, platform, next: null });
  });
  it("/my もアプリ表示では出さない", () => {
    expect(hintView({ place: "my", platform: "installed", stored: null }).show).toBe(false);
  });
});

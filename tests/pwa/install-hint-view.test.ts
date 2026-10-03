import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AndroidSteps, DesktopSteps, IosSteps, OtherBrowserNote } from "@/components/pwa/InstallSteps";
import { InstallHint, openHintStorage } from "@/components/pwa/InstallHint";
import { InstallHintBlock } from "@/components/pwa/InstallHintBlock";

const html = (el: Parameters<typeof createElement>[0]) => renderToStaticMarkup(createElement(el));
const NO_EMOJI = /\p{Extended_Pictographic}/u;

describe("手順の文(サーバーで HTML に入れる)", () => {
  it("iPhone:番号つきの 3 つの手順と、共有・追加のアイコン(SVG)", () => {
    const h = html(IosSteps);
    expect(h).toContain("<ol");
    expect(h.match(/<li/g)?.length).toBe(3);
    expect(h).toContain("共有ボタン(四角から上向きの矢印)を押す。見当たらないときは、下か右上の「…」の中にあります。");
    expect(h).toContain("「ホーム画面に追加」を選ぶ(なければ下にスクロール)。");
    expect(h).toContain("右上の「追加」を押す。");
    expect(h).toContain("<svg");
  });
  it("Android と PC は 3 つと 2 つの手順、other は 1 文", () => {
    expect(html(AndroidSteps).match(/<li/g)?.length).toBe(3);
    expect(html(DesktopSteps).match(/<li/g)?.length).toBe(2);
    expect(html(OtherBrowserNote)).toContain("このブラウザでは追加できないことがあります。iPhone は Safari、Android と PC は Chrome か Edge で開くと追加できます。");
  });
  it.each([IosSteps, AndroidSteps, DesktopSteps, OtherBrowserNote])("絵文字と文字の矢印を使わない", (C) => {
    const h = html(C);
    expect(h).not.toMatch(NO_EMOJI);
    expect(h).not.toMatch(/[←→]/);
  });
});

describe("InstallHint(client)", () => {
  it("サーバーの描画では何も出さない(ハイドレーションのあとに出す。最初の画面の外なので CLS を起こさない)", () => {
    const steps = { ios: "i", android: "a", desktop: "d", other: "o" };
    expect(renderToStaticMarkup(createElement(InstallHint, { place: "aim", today: "2026-10-03", steps }))).toBe("");
    expect(renderToStaticMarkup(createElement(InstallHint, { place: "my", steps }))).toBe("");
    expect(renderToStaticMarkup(createElement(InstallHintBlock, { place: "my" }))).toBe("");
  });
  it("base-ui と今日の文字のデータを読まない(JS を増やさない)", () => {
    for (const f of ["src/components/pwa/InstallHint.tsx", "src/components/pwa/InstallSteps.tsx", "src/components/pwa/InstallHintBlock.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toContain("@base-ui");
      expect(src, f).not.toContain("@/lib/aim/daily");
    }
    expect(readFileSync("src/components/pwa/InstallHint.tsx", "utf8").startsWith('"use client";')).toBe(true);
    expect(readFileSync("src/components/pwa/InstallSteps.tsx", "utf8")).not.toContain("use client");
  });
  it("主ボタン(primary)を使わない(読み替え 1)", () => {
    expect(readFileSync("src/components/pwa/InstallHint.tsx", "utf8")).not.toContain('"primary"');
  });
});

describe("openHintStorage(プライベートモードなど)", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("localStorage が投げるときは null", () => {
    vi.stubGlobal("window", { get localStorage(): Storage { throw new Error("SecurityError"); } });
    expect(openHintStorage()).toBeNull();
  });
  it("書き込みが投げるときも null", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => {} } });
    expect(openHintStorage()).toBeNull();
  });
  it("使えるときはそのまま返す", () => {
    const ls = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    vi.stubGlobal("window", { localStorage: ls });
    expect(openHintStorage()).toBe(ls);
  });
});

describe("置き場所(設計書 4-1)", () => {
  it("/my に段を置き、トップには置かない", () => {
    expect(readFileSync("src/app/my/page.tsx", "utf8")).toContain('<InstallHintBlock place="my"');
    expect(readFileSync("src/app/page.tsx", "utf8")).not.toContain("InstallHint");
  });
  it("/aim はサーバーの今日の日付を渡し、AimClient は記録の直後に差し込む", () => {
    expect(readFileSync("src/app/aim/page.tsx", "utf8")).toMatch(/installHint=\{<InstallHintBlock place="aim" today=\{date\}/);
    const client = readFileSync("src/app/aim/AimClient.tsx", "utf8");
    expect(client.indexOf("{installHint}")).toBeGreaterThan(client.indexOf("<AimHistory"));
    expect(client.indexOf("{installHint}")).toBeLessThan(client.indexOf("<Ranking"));
  });
});

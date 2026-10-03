import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CHARS, type Char } from "@/data/chars";
import { CHAR_GAME_SETTINGS } from "@/data/char-games";
import { GAMES } from "@/data/games";
import { charAxisRows, fitTypes, roleOf } from "@/lib/char-match";
import { charHref, charSources, dexParams, sameRoleChars } from "@/lib/char-dex";
import { CharProfile } from "@/components/chars/CharProfile";
import * as charPage from "@/app/games/[game]/chars/[char]/page";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const primaryCount = (html: string) => (html.match(/(?<![:\w-])bg-rl-accent(?![\w-])/g) ?? []).length;
/** 画面に出る文字だけ(クラス名の tracking-[0.01em] などを数字の確認に入れない) */
const textOf = (html: string) => html.replace(/<[^>]*>/g, " ");
const shown = CHARS.filter((c) => !c.reserve);

function render(c: Char) {
  const game = GAMES.find((g) => g.id === c.game)!;
  const setting = CHAR_GAME_SETTINGS[c.game];
  const matched = setting.matching && c.matchable;
  return renderToStaticMarkup(createElement(CharProfile, {
    char: c, game, role: roleOf(c), setting,
    axisRows: matched ? charAxisRows(c) : null,
    fits: matched ? fitTypes(c) : [],
    sameRole: matched ? sameRoleChars(c).map((x) => ({ href: charHref(x), name: x.nameJa })) : [],
    sources: charSources(c, setting),
  }));
}

describe("1 体のページの中身(代表 66 体すべて。スト6 も描けることを確かめる)", () => {
  it.each(shown.map((c) => [`${c.game}/${c.id}`, c] as const))("%s:非公式・主ボタン 1 つ・作った数字なし・広告なし", (_k, c) => {
    const html = render(c);
    expect(html).toContain("非公式");
    expect(primaryCount(html)).toBe(1);
    expect(html).not.toMatch(/null|undefined|NaN/);
    expect(textOf(html)).not.toMatch(/\d+%|-?\d\.\d/);
    expect(html).not.toMatch(/sponsored|amazon|rakuten|>PR</i);
  });
  it.each(shown.map((c) => [`${c.game}/${c.id}`, c] as const))("%s:外へのリンクはすべて新しいタブ・noopener noreferrer", (_k, c) => {
    const html = render(c);
    for (const a of html.match(/<a [^>]*href="https:[^>]*>/g) ?? []) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
  });
  it("相性に入るキャラ:傾向の言葉 4 つ・合うタイプ 3 つへのリンク", () => {
    for (const c of shown.filter((x) => x.matchable && CHAR_GAME_SETTINGS[x.game].matching)) {
      const html = render(c);
      for (const r of charAxisRows(c)) expect(html, c.id).toContain(r.word);
      for (const t of fitTypes(c)) expect(html, c.id).toContain(`href="/type/${t.code}"`);
    }
  });
  it("相性に入るキャラ:左の列の頭に一番合うタイプのコード(display-1)と絵、札と表の行は同じ軸で data-axis がつながる", () => {
    for (const c of shown.filter((x) => x.matchable && CHAR_GAME_SETTINGS[x.game].matching)) {
      const html = render(c);
      const top = fitTypes(c)[0];
      expect(html, c.id).toContain("一番合うタイプ");
      expect(html, c.id).toMatch(new RegExp(`text-rl-display-1[^"]*"[^>]*>${top.code}<`));
      expect(html, c.id).toContain("rl-axis-link");
      expect((html.match(new RegExp(`href="/type/${top.code}"`, "g")) ?? []).length, c.id).toBe(1);
      expect(html.indexOf("char-same") < 0 || html.indexOf("char-same") < html.indexOf("char-lean"), `${c.id}:同じロールは左の列(傾向より前)`).toBe(true);
      for (const r of charAxisRows(c)) expect((html.match(new RegExp(`data-axis="${r.axis}"`, "g")) ?? []).length, c.id).toBe(2);
    }
  });
  it("相性に入らないキャラ(ヒルビリー・ネア・スト6):一文だけで、傾向・合うタイプ・同じロールを出さない", () => {
    for (const c of shown.filter((x) => !x.matchable || !CHAR_GAME_SETTINGS[x.game].matching)) {
      const html = render(c);
      expect(html, c.id).toContain(CHAR_GAME_SETTINGS[c.game].unmatchableNote);
      expect(html, c.id).not.toContain('href="/type/');
      expect(html, c.id).not.toContain("このキャラの傾向");
      expect(html, c.id).not.toContain("一番合うタイプ");
    }
  });
  it("引用を出すゲーム:公式の言葉をかぎ括弧で・英語の根拠に lang=\"en\"", () => {
    const w = shown.find((c) => c.game === "overwatch" && c.id === "widowmaker")!;
    const html = render(w);
    expect(html).toContain(`「${esc(w.quote.text)}」`);
    expect(html).toContain('lang="en"');
    expect(html).toContain(esc(w.evidence.find((e) => e.tag === "calm")!.quote));
  });
  it("DbD:公式の引用(紹介文・札の根拠・roleBasis)を 1 つも出さない", () => {
    for (const c of shown.filter((x) => x.game === "dbd")) {
      const html = render(c);
      expect(html, c.id).not.toContain(esc(c.quote.text));
      for (const e of c.evidence) expect(html, c.id).not.toContain(esc(e.quote));
      if (c.roleBasis) expect(html, c.id).not.toContain(esc(c.roleBasis.text));
    }
  });
  it("DbD:説明は自分たちの言葉で、「公式は…紹介」型や公式の紹介文の写しを使わない", () => {
    for (const c of shown.filter((x) => x.game === "dbd")) {
      expect(c.summary, c.id).not.toMatch(/公式は|紹介している/);
      expect(c.quote.text.includes(c.summary) || c.summary.includes(c.quote.text), c.id).toBe(false);
      expect(textOf(render(c)), c.id).not.toContain("公式の言葉に手がかり");
    }
  });
  it("どのキャラの roleBasis も画面に出さない", () => {
    for (const c of shown.filter((x) => x.roleBasis)) expect(render(c), c.id).not.toContain(esc(c.roleBasis!.text));
  });
});

describe("1 体のページ(静的に作る)", () => {
  it("知らない値は 404(dynamicParams = false)で、params は公開しているゲームの代表だけ", () => {
    expect(charPage.dynamicParams).toBe(false);
    expect(charPage.generateStaticParams()).toEqual(dexParams());
  });
  it("metadata:VALORANT は名前なし、OW は名前入り、canonical あり、keywords なし", async () => {
    const v = await charPage.generateMetadata({ params: Promise.resolve({ game: "valorant", char: "jett" }) });
    expect(String(v.title)).not.toContain("ジェット");
    expect(String(v.description)).not.toContain("ジェット");
    expect(v.alternates?.canonical).toBe("/games/valorant/chars/jett");
    expect(v).not.toHaveProperty("keywords");
    for (const name of ["ジェット", "Jett"]) {
      expect(String(v.openGraph?.title)).not.toContain(name);
      expect(String(v.openGraph?.description)).not.toContain(name);
    }
    const o = await charPage.generateMetadata({ params: Promise.resolve({ game: "overwatch", char: "winston" }) });
    expect(o.title).toBe("ウィンストン(オーバーウォッチ)はどんなタイプに合う?");
  });
  it("スト6(未公開)の metadata は空(title・OG に出さない)", async () => {
    expect(await charPage.generateMetadata({ params: Promise.resolve({ game: "sf6", char: "ken" }) })).toEqual({});
  });
  it("予備・知らないキャラの metadata は空", async () => {
    expect(await charPage.generateMetadata({ params: Promise.resolve({ game: "valorant", char: "reyna" }) })).toEqual({});
    expect(await charPage.generateMetadata({ params: Promise.resolve({ game: "valorant", char: "JETT" }) })).toEqual({});
  });
});

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CHARS } from "@/data/chars";
import { CHAR_GAME_SETTINGS } from "@/data/char-games";
import { GAMES } from "@/data/games";
import { fitTypes } from "@/lib/char-match";
import { dexChars, dexSections, latestCheckedAt, publishedGames } from "@/lib/char-dex";
import { CharListBody } from "@/components/chars/CharListBody";
import { DexNotices } from "@/components/chars/DexNotices";
import * as listPage from "@/app/games/[game]/chars/page";

/** 主ボタン(variant="primary")の塗りのクラスの数(hover: の付いたものは数えない) */
const primaryCount = (html: string) => (html.match(/(?<![:\w-])bg-rl-accent(?![\w-])/g) ?? []).length;
/** 画面に出る文字だけ(クラス名の tracking-[0.01em] などを数字の確認に入れない) */
const textOf = (html: string) => html.replace(/<[^>]*>/g, " ");

function renderList(gameId: string) {
  const game = GAMES.find((g) => g.id === gameId)!;
  const setting = { ...CHAR_GAME_SETTINGS[game.id as keyof typeof CHAR_GAME_SETTINGS], published: true };
  const sections = dexSections(game, setting);
  const fits = Object.fromEntries(dexChars(game.id).map((c) => [c.id, setting.matching && c.matchable ? fitTypes(c)[0] : null]));
  return renderToStaticMarkup(createElement(CharListBody, { game, setting, sections, fits, checkedAt: latestCheckedAt(dexChars(game.id)) }));
}

describe("一覧の中身(全 5 本。スト6 も描けることを確かめる)", () => {
  it.each(GAMES.map((g) => [g.id] as const))("%s:代表の全員へのリンクがあり、予備へのリンクがない", (id) => {
    const html = renderList(id);
    for (const c of CHARS.filter((x) => x.game === id)) {
      const href = `href="/games/${id}/chars/${c.id}"`;
      if (c.reserve) expect(html, c.id).not.toContain(href);
      else expect(html, c.id).toContain(href);
    }
  });
  it.each(GAMES.map((g) => [g.id] as const))("%s:非公式の表記・主ボタン 1 つ・広告なし・作った数字なし", (id) => {
    const html = renderList(id);
    expect(html).toContain("非公式");
    expect(primaryCount(html)).toBe(1);
    expect(html).not.toMatch(/sponsored|amazon|rakuten|>PR</i);
    expect(html).not.toMatch(/null|undefined|NaN/);
    expect(textOf(html)).not.toMatch(/\d+%/);
  });
  it("スト6 は「キャラ一覧」1 段で、仮のロール名の見出しを出さず、合うタイプの絵もない", () => {
    const html = renderList("sf6");
    expect(html).toContain(">キャラ一覧</h2>");
    for (const r of GAMES.find((g) => g.id === "sf6")!.roles) expect(html).not.toContain(`>${r.name}</h2>`);
    expect(html).not.toContain("合うタイプ");
  });
  it("DbD は「型を決めていないキャラ」の段と、型がロビラボの分け方である注記", () => {
    const html = renderList("dbd");
    expect(html).toContain("型を決めていないキャラ");
    expect(html).toContain("ロビラボの分け方");
  });
  it("日本語と英語の名前が同じキャラ(D.Va)は名前を 2 回出さない", () => {
    const html = renderList("overwatch");
    expect(html.match(/>D.Va</g) ?? []).toHaveLength(1);
  });
  it("DbD の一覧に公式の引用が入らない", () => {
    const html = renderList("dbd");
    for (const c of CHARS.filter((x) => x.game === "dbd")) {
      expect(html, c.id).not.toContain(c.quote.text);
      for (const e of c.evidence) expect(html, c.id).not.toContain(e.quote);
      if (c.roleBasis) expect(html, c.id).not.toContain(c.roleBasis.text);
    }
  });
});

describe("DexNotices", () => {
  it("外への出典リンクは新しいタブ・noopener noreferrer、英語の断り書きに lang=\"en\"", () => {
    const html = renderToStaticMarkup(createElement(DexNotices, {
      settings: [CHAR_GAME_SETTINGS.apex], checkedAt: "2026-10-03", sources: [{ url: "https://www.ea.com/ja/games/apex-legends", label: "公式のキャラページ" }],
    }));
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('lang="en"');
    expect(html).toContain("確認日 2026-10-03");
  });
});

describe("一覧のページ(静的に作る)", () => {
  it("知らない値は 404(dynamicParams = false)で、params は公開しているゲームだけ", () => {
    expect(listPage.dynamicParams).toBe(false);
    expect(listPage.generateStaticParams()).toEqual(publishedGames().map((g) => ({ game: g.id })));
  });
  it("metadata:title・canonical があり、keywords を出さない", async () => {
    const m = await listPage.generateMetadata({ params: Promise.resolve({ game: "valorant" }) });
    expect(m.title).toBe("VALORANT のキャラ図鑑|合うキャラが分かる");
    expect(m.alternates?.canonical).toBe("/games/valorant/chars");
    expect(m).not.toHaveProperty("keywords");
  });
  it("公開していないゲームの metadata は空", async () => {
    expect(await listPage.generateMetadata({ params: Promise.resolve({ game: "nope" }) })).toEqual({});
  });
});

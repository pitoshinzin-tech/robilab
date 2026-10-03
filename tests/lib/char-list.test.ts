import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CHARS } from "@/data/chars";
import { CHAR_GAME_SETTINGS } from "@/data/char-games";
import { GAMES } from "@/data/games";
import { roleFitType, shiftedRows } from "@/lib/char-match";
import { dexChars, dexSections, latestCheckedAt, publishedGames } from "@/lib/char-dex";
import { CharListBody } from "@/components/chars/CharListBody";
import { DexNotices } from "@/components/chars/DexNotices";
import * as listPage from "@/app/games/[game]/chars/page";
import GameRedirect from "@/app/games/[game]/page";
import { DexCount } from "@/components/chars/DexCount";

/** 主ボタン(variant="primary")の塗りのクラスの数(hover: の付いたものは数えない) */
const primaryCount = (html: string) => (html.match(/(?<![:\w-])bg-rl-accent(?![\w-])/g) ?? []).length;
/** 画面に出る文字だけ(クラス名の tracking-[0.01em] などを数字の確認に入れない) */
const textOf = (html: string) => html.replace(/<[^>]*>/g, " ");

function renderList(gameId: string) {
  const game = GAMES.find((g) => g.id === gameId)!;
  const setting = { ...CHAR_GAME_SETTINGS[game.id as keyof typeof CHAR_GAME_SETTINGS], published: true };
  const sections = dexSections(game, setting);
  return renderToStaticMarkup(createElement(CharListBody, { game, setting, sections, checkedAt: latestCheckedAt(dexChars(game.id)) }));
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
  it("OW:合うタイプの絵はロールの段ごとに 1 回だけ(行ごとに並べない)", () => {
    const html = renderList("overwatch");
    const ow = GAMES.find((g) => g.id === "overwatch")!;
    for (const r of ow.roles) expect(html, r.id).toContain(roleFitType(r).code);
    expect((html.match(/このロールに合うタイプ/g) ?? []).length).toBe(dexSections(ow, { ...CHAR_GAME_SETTINGS.overwatch, published: true }).filter((s) => s.roleId).length);
  });
  it("触ると答える(JS 0):ロールの段に rl-role-link、見出しの絵に data-role-type、札に data-shift。型を決めていない段には付けない", () => {
    const html = renderList("dbd");
    const dbd = GAMES.find((g) => g.id === "dbd")!;
    const typed = dexSections(dbd, { ...CHAR_GAME_SETTINGS.dbd, published: true }).filter((s) => s.roleId).length;
    expect((html.match(/rl-role-link/g) ?? []).length).toBe(typed);
    expect((html.match(/data-role-type/g) ?? []).length).toBe(typed);
    expect(renderList("overwatch")).toContain("data-shift");
  });
  it("h1 の下にロールの段へのページ内リンク(DbD は「型を決めていないキャラ」も)。飛び先の id がある", () => {
    for (const id of ["overwatch", "dbd"]) {
      const html = renderList(id);
      const game = GAMES.find((g) => g.id === id)!;
      for (const s of dexSections(game, { ...CHAR_GAME_SETTINGS[id as "overwatch" | "dbd"], published: true })) {
        expect(html, s.key).toContain(`href="#role-${s.key}"`);
        expect(html, s.key).toContain(`id="role-${s.key}"`);
      }
    }
    expect(renderList("dbd")).toContain('href="#role-unmatched"');
  });
  it("行の札は、ロールの土台からずれた軸だけ(ウィンストンは「直感寄り」、札のないキャラは札なし)", () => {
    const html = renderList("overwatch");
    const w = CHARS.find((c) => c.game === "overwatch" && c.id === "winston")!;
    expect(shiftedRows(w).map((r) => r.word)).toEqual(["直感寄り"]);
    const row = html.slice(html.indexOf('href="/games/overwatch/chars/winston"'));
    expect(row.slice(0, row.indexOf("</li>"))).toMatch(/>直感\/戦略<\/span><span[^>]*>直感寄り</);
    for (const c of CHARS.filter((x) => x.game === "overwatch" && x.evidence.length === 0 && !x.reserve)) {
      const r = html.slice(html.indexOf(`href="/games/overwatch/chars/${c.id}"`));
      expect(r.slice(0, r.indexOf("</li>")), c.id).not.toContain("寄り<");
    }
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

describe("DexNotices(複数ゲーム)は会社ごとにまとめる", () => {
  it("DbD の注記は DbD の断り書きの直前で、ほかの会社の断り書きをまたがない", () => {
    const { overwatch, dbd, apex } = CHAR_GAME_SETTINGS;
    const html = renderToStaticMarkup(createElement(DexNotices, { settings: [overwatch, dbd, apex] }));
    const at = (s: string) => html.indexOf(s);
    expect(at(dbd.styleNote!)).toBeGreaterThan(at(overwatch.notices[1]));
    expect(at(dbd.styleNote!)).toBeLessThan(at(dbd.notices[0]));
    expect(at(dbd.notices[1])).toBeLessThan(at(apex.notices[0]));
    expect(at(overwatch.notices[1])).toBeLessThan(at(dbd.styleNote!));
  });
});

/** redirect / notFound は例外を投げる。その digest(状態コードを含む)を取り出す */
async function digestOf(game: string): Promise<string> {
  try {
    await GameRedirect({ params: Promise.resolve({ game }) });
  } catch (e) {
    return String((e as { digest?: unknown }).digest ?? "");
  }
  return "";
}

describe("/games/[game](307 と 404)", () => {
  it("公開しているゲームは図鑑の一覧へ 307", async () => {
    for (const id of ["overwatch", "valorant", "apex", "dbd"]) {
      const d = await digestOf(id);
      expect(d, id).toMatch(/^NEXT_REDIRECT/);
      expect(d, id).toContain(`/games/${id}/chars`);
      expect(d, id).toContain(";307;");
    }
  });
  it("公開していない(スト6)・知らない・大文字・__proto__ は 404 で、転送しない", async () => {
    for (const id of ["sf6", "nope", "VALORANT", "__proto__", "constructor", ""]) {
      const d = await digestOf(id);
      expect(d, id).toContain("404");
      expect(d, id).not.toMatch(/^NEXT_REDIRECT/);
    }
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

describe("表示の段の数", () => {
  it("/games の数は公開している代表の数(スト6・予備を数えない。いまは 4 本で 51 体)", () => {
    expect(publishedGames().reduce((n, g) => n + dexChars(g.id).length, 0)).toBe(51);
  });
  it("数は Orbitron の display-2 で「N 体」", () => {
    const html = renderToStaticMarkup(createElement(DexCount, { value: 12, caption: "3 つのロールの代表キャラ" }));
    expect(html).toContain("text-rl-display-2");
    expect(html).toMatch(/font-display[^>]*>12<\/span><span[^>]*>体</);
  });
});

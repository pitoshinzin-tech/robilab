import { describe, it, expect } from "vitest";
import { CHARS } from "@/data/chars";
import { CHAR_GAME_SETTINGS } from "@/data/char-games";
import { GAMES } from "@/data/games";
import { charMeta, charCrumbs, breadcrumbJsonLd, dexIndexMeta, isLatinText, listCrumbs, listLead, listMeta } from "@/lib/char-seo";
import { fitTypes, roleOf } from "@/lib/char-match";

const game = (id: string) => GAMES.find((g) => g.id === id)!;
const get = (g: string, id: string) => CHARS.find((c) => c.game === g && c.id === id)!;
const metaOf = (g: string, id: string) => {
  const c = get(g, id);
  const s = CHAR_GAME_SETTINGS[c.game];
  return charMeta(c, game(g), roleOf(c), s, s.matching && c.matchable ? fitTypes(c) : []);
};

describe("1 体のページの title・description", () => {
  it("OW:名前とゲーム名の問いの形、description に合うタイプ", () => {
    const m = metaOf("overwatch", "winston");
    expect(m.title).toBe("ウィンストン(オーバーウォッチ)はどんなタイプに合う?");
    expect(m.description).toContain("合うタイプ:");
  });
  it("VALORANT:全キャラで title・description に名前(日本語・英語)を入れない", () => {
    for (const c of CHARS.filter((x) => x.game === "valorant")) {
      const m = metaOf("valorant", c.id);
      for (const name of [c.nameJa, c.nameEn]) {
        expect(m.title, c.id).not.toContain(name);
        expect(m.description, c.id).not.toContain(name);
      }
      expect(m.title).toContain("VALORANT のキャラ図鑑");
    }
  });
  it("相性に入らないキャラ(ヒルビリー・スト6)は問いの形にせず、合うタイプを書かない", () => {
    for (const [g, id] of [["dbd", "hillbilly"], ["sf6", "ken"]] as const) {
      const m = metaOf(g, id);
      expect(m.title).toBe(`${get(g, id).nameJa}(${game(g).name})|キャラ図鑑`);
      expect(m.description).not.toContain("合うタイプ");
    }
  });
  it("全キャラで、description に null・undefined・数字の % が出ない", () => {
    for (const c of CHARS) {
      const m = metaOf(c.game, c.id);
      expect(`${m.title}${m.description}`, c.id).not.toMatch(/null|undefined|NaN|\d+%/);
    }
  });
});

describe("一覧と目次の文", () => {
  it("合うキャラを出すゲームと出さないゲームで文を変える", () => {
    expect(listMeta(game("valorant"), CHAR_GAME_SETTINGS.valorant, 12).title).toBe("VALORANT のキャラ図鑑|合うキャラが分かる");
    expect(listMeta(game("sf6"), CHAR_GAME_SETTINGS.sf6, 15).title).toBe("ストリートファイター6 のキャラ図鑑");
    expect(listLead(CHAR_GAME_SETTINGS.sf6, 15)).not.toContain("合う");
    expect(listLead(CHAR_GAME_SETTINGS.overwatch, 12)).toBe("代表キャラ 12 体。公式のロールと公式の言葉から、どんなタイプに合うかをまとめました。");
  });
  it("目次はゲームの数を入れる", () => {
    expect(dexIndexMeta(4).description).toContain("4 本");
  });
});

describe("パンくず", () => {
  it("一覧は 2 段、1 体のページは 3 段(VALORANT はキャラの段を入れない)", () => {
    expect(listCrumbs(game("apex")).map((c) => c.path)).toEqual(["/games", "/games/apex/chars"]);
    expect(charCrumbs(get("apex", "wraith"), game("apex"), CHAR_GAME_SETTINGS.apex).map((c) => c.path)).toEqual(["/games", "/games/apex/chars", "/games/apex/chars/wraith"]);
    const v = charCrumbs(get("valorant", "jett"), game("valorant"), CHAR_GAME_SETTINGS.valorant);
    expect(v.map((c) => c.path)).toEqual(["/games", "/games/valorant/chars"]);
    expect(JSON.stringify(v)).not.toContain("ジェット");
  });
  it("JSON-LD は < を \\u003c にし、読み戻すと同じ中身", () => {
    const json = breadcrumbJsonLd([{ name: "</script><script>alert(1)</script>", path: "/games" }], "https://example.com");
    expect(json).not.toContain("<");
    expect(json).toContain("\\u003c");
    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("BreadcrumbList");
    expect(parsed.itemListElement[0]).toEqual({ "@type": "ListItem", position: 1, name: "</script><script>alert(1)</script>", item: "https://example.com/games" });
  });
});

describe("isLatinText(英語の文に lang=\"en\" を付けるか)", () => {
  it.each([
    ["expels aggressors with deadly precision", true],
    ["© 2015-2026 and BEHAVIOUR, DEAD BY DAYLIGHT", true],
    ["俊敏で捉え難い戦闘スタイルを持ち", false],
    ["ロビラボ was created under Riot Games'", false],
  ])("%s → %s", (s, expected) => {
    expect(isLatinText(s)).toBe(expected);
  });
});

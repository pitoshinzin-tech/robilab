import { describe, it, expect } from "vitest";
import { CHARS } from "@/data/chars";
import { CHAR_GAME_SETTINGS, type CharGameSetting } from "@/data/char-games";
import type { CharGameId } from "@/data/char-types";
import { GAMES } from "@/data/games";
import { TYPES } from "@/data/types";
import { parseAxesParam } from "@/lib/axes-param";
import { BANNED_WORDS } from "@/lib/char-reason";
import {
  charHref, charSources, dexChars, dexParams, dexSections, findDexChar, latestCheckedAt, publishedGame, publishedGames,
  resultCharPicks, sameRoleChars, settingOf, type DexSettings,
} from "@/lib/char-dex";

/** 全部公開した設定(patch で 1 本ずつ変える) */
const all = (patch: Partial<Record<CharGameId, Partial<CharGameSetting>>> = {}): DexSettings =>
  Object.fromEntries(Object.entries(CHAR_GAME_SETTINGS).map(([k, s]) => [k, { ...s, published: true, ...patch[k as CharGameId] }])) as DexSettings;
const game = (id: string) => GAMES.find((g) => g.id === id)!;
const get = (g: string, id: string) => CHARS.find((c) => c.game === g && c.id === id)!;
const HREF_RE = /^\/games\/[a-z0-9]+(?:-[a-z0-9]+)*\/chars\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("設定の引き当て(URL の想定外の値)", () => {
  it.each([["__proto__"], ["constructor"], ["toString"], ["VALORANT"], [""], ["valorant/"]])("%s は設定なし", (id) => {
    expect(settingOf(id)).toBeUndefined();
    expect(publishedGame(id, all())).toBeUndefined();
  });
});

describe("公開のスイッチ", () => {
  it("全部公開なら 5 本、games.ts の順", () => {
    expect(publishedGames(all()).map((g) => g.id)).toEqual(["overwatch", "valorant", "apex", "sf6", "dbd"]);
  });
  it("published: false のゲームは一覧・ページの params・1 体の引き当て・結果の導線から消える", () => {
    const s = all({ valorant: { published: false } });
    expect(publishedGames(s).map((g) => g.id)).not.toContain("valorant");
    expect(publishedGame("valorant", s)).toBeUndefined();
    expect(dexParams(s).some((p) => p.game === "valorant")).toBe(false);
    expect(findDexChar("valorant", "jett", s)).toBeUndefined();
    expect(Object.keys(resultCharPicks(parseAxesParam(undefined, "ARCH"), s))).not.toContain("valorant");
  });
  it("今の設定ではスト6 は出さない(台帳:最後に公開)", () => {
    expect(CHAR_GAME_SETTINGS.sf6.published).toBe(false);
    expect(publishedGames().map((g) => g.id)).not.toContain("sf6");
    expect(dexParams().some((p) => p.game === "sf6")).toBe(false);
  });
});

describe("図鑑のキャラ(予備を出さない)", () => {
  it("dexParams は全部公開で 66 体、予備は 1 体も入らない", () => {
    const params = dexParams(all());
    expect(params).toHaveLength(66);
    for (const p of params) expect(get(p.game, p.char).reserve, `${p.game}/${p.char}`).toBe(false);
  });
  it("findDexChar:予備・大文字・知らない id・空は undefined", () => {
    expect(findDexChar("valorant", "jett", all())?.char.nameJa).toBe("ジェット");
    for (const id of ["reyna", "JETT", "nope", "", "__proto__"]) expect(findDexChar("valorant", id, all()), id).toBeUndefined();
  });
  it("dexChars はそのゲームの代表だけ、データの順", () => {
    expect(dexChars("overwatch").map((c) => c.id)).toEqual(CHARS.filter((c) => c.game === "overwatch" && !c.reserve).map((c) => c.id));
  });
});

describe("dexSections", () => {
  it("OW はロールごとに 4 体の 3 段", () => {
    const s = dexSections(game("overwatch"), CHAR_GAME_SETTINGS.overwatch);
    expect(s.map((x) => x.title)).toEqual(["タンク", "ダメージ", "サポート"]);
    for (const x of s) expect(x.chars).toHaveLength(4);
  });
  it("スト6 は段を分けず「キャラ一覧」1 段に 15 体(仮のロールを出さない)", () => {
    const s = dexSections(game("sf6"), CHAR_GAME_SETTINGS.sf6);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ key: "all", title: "キャラ一覧", roleId: null });
    expect(s[0].chars).toHaveLength(15);
  });
  it("DbD は相性に入るキャラだけを型の段に入れ、ほかは最後の「型を決めていないキャラ」", () => {
    const s = dexSections(game("dbd"), CHAR_GAME_SETTINGS.dbd);
    const last = s.at(-1)!;
    expect(last.title).toBe("型を決めていないキャラ");
    expect(last.chars.map((c) => c.id)).toEqual(["hillbilly", "nea"]);
    for (const x of s.slice(0, -1)) for (const c of x.chars) expect(c.matchable, c.id).toBe(true);
  });
});

describe("同じロールのキャラ・確認日・出典", () => {
  it("同じロールの代表(相性に入るものだけ・自分を除く)。相性に入らないキャラは空", () => {
    expect(sameRoleChars(get("overwatch", "winston")).map((c) => c.id)).toEqual(["reinhardt", "dva", "orisa"]);
    expect(sameRoleChars(get("dbd", "hillbilly"))).toEqual([]);
    expect(sameRoleChars(get("dbd", "huntress"))).toEqual([]);
  });
  it("latestCheckedAt は一番新しい確認日", () => {
    expect(latestCheckedAt([{ ...get("overwatch", "winston"), checkedAt: "2026-09-01" }, get("overwatch", "dva")])).toBe(get("overwatch", "dva").checkedAt);
  });
  it("DbD の出典は公式のキャラページだけ(引用の出典を出さない)。ほかは重ねずに並べる", () => {
    const dbd = get("dbd", "claudette");
    expect(charSources(dbd, CHAR_GAME_SETTINGS.dbd)).toEqual([{ url: dbd.sourceUrl, label: "公式のキャラページ" }]);
    const w = get("overwatch", "widowmaker");
    const urls = charSources(w, CHAR_GAME_SETTINGS.overwatch).map((s) => s.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(w.evidence.find((e) => e.tag === "calm")!.url);
  });
  it("charHref", () => {
    expect(charHref(get("overwatch", "dva"))).toBe("/games/overwatch/chars/dva");
  });
});

describe("resultCharPicks(結果ページの導線)", () => {
  it("OW の ABCZ:合うキャラ 3 体と、手ざわりが違うかも=ウィンストンと理由", () => {
    const p = resultCharPicks(parseAxesParam(undefined, "ABCZ"), all()).overwatch;
    expect(p.fits.map((f) => f.href)).toEqual(["/games/overwatch/chars/reinhardt", "/games/overwatch/chars/orisa", "/games/overwatch/chars/mercy"]);
    expect(p.surprise?.href).toBe("/games/overwatch/chars/winston");
    expect(p.surprise?.reason).toContain("ウィンストンは素早く動き回るキャラ");
  });
  it("スト6 は全部公開でも出さない(matching: false)", () => {
    expect(Object.keys(resultCharPicks(parseAxesParam(undefined, "ARCH"), all()))).not.toContain("sf6");
  });
  it("全 16 タイプで:リンクは図鑑の形・予備と相性に入らないキャラなし・理由に否定の言葉なし", () => {
    for (const t of TYPES) {
      const picks = resultCharPicks(parseAxesParam(undefined, t.code), all());
      for (const [g, p] of Object.entries(picks)) {
        expect(p.fits.length, `${t.code} ${g}`).toBeGreaterThan(0);
        for (const l of [...p.fits, ...(p.surprise ? [p.surprise] : [])]) {
          expect(l.href, t.code).toMatch(HREF_RE);
          const id = l.href.split("/").at(-1)!;
          const c = get(g, id);
          expect(c.matchable && !c.reserve, `${t.code} ${l.href}`).toBe(true);
          expect(l.name).toBe(c.nameJa);
        }
        if (p.surprise) for (const w of BANNED_WORDS) expect(p.surprise.reason).not.toContain(w);
      }
    }
  });
});

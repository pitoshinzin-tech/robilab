import { describe, it, expect } from "vitest";
import { CHARS } from "@/data/chars";
import type { Char, CharTagId } from "@/data/char-types";
import { GAMES } from "@/data/games";
import { TYPES } from "@/data/types";
import { parseAxesParam } from "@/lib/axes-param";
import { roleScore } from "@/lib/role-match";
import { LEAN, TAG_AXIS, TAG_SHIFT, charAxisRows, charTarget, fitTypes, leanOf, opposingTags, pickForGame, rankChars } from "@/lib/char-match";
import { TAGS, TAG_AXIS_ID } from "../../scripts/char-data";

const OW = GAMES.find((g) => g.id === "overwatch")!;
const URL_ = "https://overwatch.blizzard.com/ja-jp/heroes/";
const ev = (tag: CharTagId) => ({ tag, quote: "引用", url: URL_ });
const char = (over: Partial<Char> = {}): Char => ({
  id: "x", game: "overwatch", roleId: "tank", nameJa: "テスト", nameEn: "Test", officialRole: "タンク", summary: "要約",
  quote: { text: "引用", url: URL_ }, evidence: [], pickedBy: "variety", sourceUrl: URL_, checkedAt: "2026-10-03",
  matchable: true, roleBasis: null, reserve: false, ...over,
});
const user = (code: string) => parseAxesParam(undefined, code);
const ids = (cs: Char[]) => cs.map((c) => c.id);

describe("札の表", () => {
  it("生成スクリプトの札と軸の表と同じ", () => {
    expect(Object.keys(TAG_AXIS).sort()).toEqual([...TAGS].sort());
    for (const t of TAGS) expect(TAG_AXIS[t].axis, t).toBe(TAG_AXIS_ID[t]);
  });
  it("幅は 0.3、寄りの境目は 0.25(設計書 3-2)", () => {
    expect(TAG_SHIFT).toBe(0.3);
    expect(LEAN).toBe(0.25);
  });
});

describe("charTarget", () => {
  it("札なしならロールの値と同じ", () => {
    expect(charTarget(char())).toEqual(OW.roles[0].target);
  });
  it("札 1 枚で 1 軸を 0.3 だけ動かす(小数の誤差を残さない)", () => {
    expect(charTarget(char({ evidence: [ev("mobile")] }))).toEqual({ attack: 0.5, instinct: 0.3, team: 1, heat: 0.5 });
    expect(charTarget(char({ evidence: [ev("hold"), ev("calm")] }))).toEqual({ attack: 0.2, instinct: 0, team: 1, heat: 0.2 });
  });
  it("−1〜+1 に収める", () => {
    expect(charTarget(char({ evidence: [ev("ally")] })).team).toBe(1);
  });
  it("−1 側にも収める(下限に当たる札を足しても −1 のまま)", () => {
    // スト6 の待ち・差し返し:attack は −1。hold(守る=攻め−)を足しても −1 を下回らない
    const t = charTarget(char({ game: "sf6", roleId: "zoner", evidence: [ev("hold")] }));
    expect(t.attack).toBe(-1);
    for (const v of Object.values(t)) expect(v).toBeGreaterThanOrEqual(-1);
  });
  it("札 2 枚(別の軸)はそれぞれの軸だけを動かし、ほかの軸は動かさない", () => {
    expect(charTarget(char({ evidence: [ev("mobile"), ev("aggro")] }))).toEqual({ attack: 0.5, instinct: 0.3, team: 1, heat: 0.8 });
  });
  it("games.ts にないロールは止める(データの間違い)", () => {
    expect(() => charTarget(char({ roleId: "healer" }))).toThrow();
  });
  it("本物のデータは全員 −1〜+1 で、0.1 の刻み", () => {
    for (const c of CHARS) {
      for (const v of Object.values(charTarget(c))) {
        expect(v, c.id).toBeGreaterThanOrEqual(-1);
        expect(v, c.id).toBeLessThanOrEqual(1);
        expect(Math.round(v * 10) / 10, c.id).toBe(v);
      }
    }
  });
});

describe("rankChars", () => {
  it("matchable でないキャラと予備は入らない", () => {
    const list = [char({ id: "a" }), char({ id: "b", matchable: false }), char({ id: "c", reserve: true })];
    expect(rankChars(user("ARCH"), list).map((r) => r.char.id)).toEqual(["a"]);
  });
  it("score の大きい順、同点は渡した順", () => {
    const list = [char({ id: "a" }), char({ id: "b", evidence: [ev("mobile")] }), char({ id: "c" })];
    const r = rankChars(user("ARCH"), list);
    expect(r.map((x) => x.char.id)).toEqual(["b", "a", "c"]);
    expect(r[0].score).toBe(roleScore(user("ARCH"), charTarget(list[1])));
  });
});

describe("pickForGame(本物のデータ)", () => {
  it("OW の ABCZ:合うキャラ 3 体と、手ざわりが違うかも=ウィンストン", () => {
    const p = pickForGame(user("ABCZ"), OW, CHARS);
    expect(ids(p.fits)).toEqual(["reinhardt", "orisa", "mercy"]);
    expect(p.surprise?.char.id).toBe("winston");
    expect(p.surprise?.role.id).toBe("tank");
    expect(p.surprise?.tag).toBe("mobile");
  });
  it("OW の ARCH:条件を満たすキャラがいなければ出さない", () => {
    const p = pickForGame(user("ARCH"), OW, CHARS);
    expect(ids(p.fits)).toEqual(["winston", "dva", "reinhardt"]);
    expect(p.surprise).toBeNull();
  });
  it("VALORANT の GRCH はソーヴァ、Apex の ARCZ はヴァンテージ", () => {
    expect(pickForGame(user("GRCH"), GAMES.find((g) => g.id === "valorant")!, CHARS).surprise?.char.id).toBe("sova");
    expect(pickForGame(user("ARCZ"), GAMES.find((g) => g.id === "apex")!, CHARS).surprise?.char.id).toBe("vantage");
  });
  it("スト6 は相性に入るキャラがいないので、何も出さない", () => {
    expect(pickForGame(user("ARCH"), GAMES.find((g) => g.id === "sf6")!, CHARS)).toEqual({ fits: [], surprise: null });
  });
  it("全 16 タイプ × 全ゲームで:合うキャラは 3 体まで・予備と相性に入らないキャラを出さない・違うかもは一番合うロールの中で合うキャラと重ならない", () => {
    for (const t of TYPES) {
      for (const g of GAMES) {
        const p = pickForGame(user(t.code), g, CHARS);
        expect(p.fits.length).toBeLessThanOrEqual(3);
        for (const c of [...p.fits, ...(p.surprise ? [p.surprise.char] : [])]) {
          expect(c.game, `${t.code} ${c.id}`).toBe(g.id);
          expect(c.matchable && !c.reserve, `${t.code} ${c.id}`).toBe(true);
        }
        if (p.surprise) {
          expect(p.fits, `${t.code} ${g.id}`).not.toContain(p.surprise.char);
          expect(p.surprise.char.roleId).toBe(p.surprise.role.id);
          expect(opposingTags(user(t.code), p.surprise.char)).toContain(p.surprise.tag);
        }
      }
    }
  });
});

describe("pickForGame(作った例。設計書 5-1 と読み替え 4)", () => {
  // ABCZ の人は OW で一番合うロールがタンク(タンク 67・サポート 65)
  const u = user("ABCZ");
  it("一番合うロールの中で、ほかのロールの一番手より低く、合うキャラに入らず、逆向きの札があるキャラを出す", () => {
    const list = [
      char({ id: "t1" }), char({ id: "t2" }),
      char({ id: "s1", roleId: "support" }), char({ id: "s2", roleId: "support" }),
      char({ id: "t3", evidence: [ev("mobile")] }),
    ];
    const p = pickForGame(u, OW, list);
    expect(ids(p.fits)).toEqual(["t1", "t2", "s1"]);
    expect(p.surprise?.char.id).toBe("t3");
  });
  it("逆向きの札がないキャラは、低くても出さない(理由が書けない)", () => {
    const list = [char({ id: "s1", roleId: "support", evidence: [ev("front")] }), char({ id: "t1" }), char({ id: "t2" }), char({ id: "t3" })];
    expect(pickForGame(u, OW, list).surprise).toBeNull();
  });
  it("合うキャラ 3 体に入っているキャラは出さない", () => {
    const list = [char({ id: "s1", roleId: "support" }), char({ id: "t3", evidence: [ev("mobile")] })];
    expect(pickForGame(u, OW, list).surprise).toBeNull();
  });
  it("ほかのロールのキャラがいなければ出さない", () => {
    const list = [char({ id: "t1" }), char({ id: "t2" }), char({ id: "t3" }), char({ id: "t4", evidence: [ev("mobile")] })];
    expect(pickForGame(u, OW, list).surprise).toBeNull();
  });
});

describe("fitTypes(このキャラが合うタイプ)", () => {
  it("相性に入る全キャラで 3 つ、近い順、同点はタイプの並び順", () => {
    for (const c of CHARS.filter((x) => x.matchable)) {
      const fits = fitTypes(c);
      expect(fits, c.id).toHaveLength(3);
      const target = charTarget(c);
      const scored = TYPES.map((t, i) => ({ code: t.code, i, s: roleScore(parseAxesParam(undefined, t.code), target) }))
        .sort((a, b) => b.s - a.s || a.i - b.i);
      expect(fits.map((t) => t.code), c.id).toEqual(scored.slice(0, 3).map((x) => x.code));
    }
  });
});

describe("傾向の言葉(数字を出さない)", () => {
  it("leanOf の境目は ±0.25", () => {
    expect([leanOf(0.25), leanOf(0.24), leanOf(0), leanOf(-0.24), leanOf(-0.25)]).toEqual(["left", "neutral", "neutral", "neutral", "right"]);
  });
  it("ウィンストン:攻め寄り(ロール)・直感寄り(札 mobile)・チーム寄り・熱血寄り", () => {
    const w = CHARS.find((c) => c.game === "overwatch" && c.id === "winston")!;
    const rows = charAxisRows(w);
    expect(rows.map((r) => r.word)).toEqual(["攻め寄り", "直感寄り", "チーム寄り", "熱血寄り"]);
    expect(rows[0].basis).toEqual({ kind: "role", roleName: "タンク" });
    expect(rows[1].basis).toMatchObject({ kind: "tag", tag: "mobile" });
  });
  it("0.2 は「どちらでもない」", () => {
    expect(charAxisRows(char({ evidence: [ev("hold")] }))[0].word).toBe("どちらでもない");
  });
  it("言葉に数字が入らない(全キャラ)", () => {
    for (const c of CHARS) for (const r of charAxisRows(c)) expect(r.word, c.id).not.toMatch(/\d/);
  });
});

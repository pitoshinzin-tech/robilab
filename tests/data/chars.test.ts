import { describe, it, expect } from "vitest";
import { CHARS } from "@/data/chars";
import { CHAR_GAME_SETTINGS } from "@/data/char-games";
import type { CharGameId } from "@/data/char-types";
import { GAMES } from "@/data/games";
import { GAME_FILES, ID_RE, QUOTE_MAX, SUMMARY_MAX, TAGS, TAG_AXIS_ID, isOfficialUrl, toChars } from "../../scripts/char-data";

const len = (s: string) => [...s].length;
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
/** 設計書 2-1:1 ロールの代表の体数 */
const PER_ROLE: Record<CharGameId, number> = { overwatch: 4, valorant: 3, apex: 3, sf6: 3, dbd: 2 };
const TOTAL: Record<CharGameId, number> = { overwatch: 15, valorant: 16, apex: 20, sf6: 20, dbd: 20 };

describe("キャラのデータ(照合済みの一次情報)", () => {
  it("91 件で、ゲームの中で id が重ならず、URL に使える文字だけ", () => {
    expect(CHARS).toHaveLength(91);
    for (const g of GAME_FILES) {
      const ids = CHARS.filter((c) => c.game === g).map((c) => c.id);
      expect(ids, g).toHaveLength(TOTAL[g]);
      expect(new Set(ids).size, g).toBe(ids.length);
      for (const id of ids) expect(ID_RE.test(id), `${g}/${id}`).toBe(true);
    }
  });
  it("代表(予備でない)はロールごとに設計書 2-1 の体数で、合計 66", () => {
    for (const game of GAMES) {
      for (const role of game.roles) {
        const n = CHARS.filter((c) => c.game === game.id && c.roleId === role.id && !c.reserve).length;
        expect(n, `${game.id}/${role.id}`).toBe(PER_ROLE[game.id as CharGameId]);
      }
    }
    expect(CHARS.filter((c) => !c.reserve)).toHaveLength(66);
  });
  it("roleId はそのゲームの games.ts のロールにある", () => {
    for (const c of CHARS) {
      const game = GAMES.find((g) => g.id === c.game);
      expect(game?.roles.some((r) => r.id === c.roleId), `${c.game}/${c.id} → ${c.roleId}`).toBe(true);
    }
  });
  it("出典はすべて https の各社の公式ドメインで、確認日は日付", () => {
    for (const c of CHARS) {
      const urls = [c.sourceUrl, c.quote.url, ...c.evidence.map((e) => e.url), ...(c.roleBasis ? [c.roleBasis.url] : [])];
      for (const u of urls) expect(isOfficialUrl(u, c.game), `${c.game}/${c.id}: ${u}`).toBe(true);
      expect(isDate(c.checkedAt), c.id).toBe(true);
    }
  });
  it("要約は 80 字まで・引用は 40 字まで・名前と公式のロールは空でない", () => {
    for (const c of CHARS) {
      expect(len(c.summary), c.id).toBeLessThanOrEqual(SUMMARY_MAX);
      expect(len(c.quote.text), c.id).toBeLessThanOrEqual(QUOTE_MAX);
      for (const e of c.evidence) expect(len(e.quote), `${c.id} ${e.tag}`).toBeLessThanOrEqual(QUOTE_MAX);
      if (c.roleBasis) expect(len(c.roleBasis.text), c.id).toBeLessThanOrEqual(QUOTE_MAX);
      for (const s of [c.nameJa, c.nameEn, c.officialRole, c.summary, c.quote.text]) expect(s.trim().length, c.id).toBeGreaterThan(0);
    }
  });
  it("札は 8 種類のどれかで 2 枚まで、同じ軸に 2 枚はない", () => {
    for (const c of CHARS) {
      expect(c.evidence.length, c.id).toBeLessThanOrEqual(2);
      for (const e of c.evidence) expect(TAGS, c.id).toContain(e.tag);
      const axes = c.evidence.map((e) => TAG_AXIS_ID[e.tag]);
      expect(new Set(axes).size, c.id).toBe(axes.length);
    }
  });
  it("相性に入る根拠:OW・VALORANT・Apex は公式のロール、DbD は roleBasis、スト6 は 0 体(台帳)", () => {
    for (const c of CHARS.filter((x) => ["overwatch", "valorant", "apex"].includes(x.game))) {
      expect(c.matchable, c.id).toBe(true);
      expect(c.roleBasis, c.id).toBeNull();
    }
    for (const c of CHARS.filter((x) => x.game === "dbd" && x.matchable)) expect(c.roleBasis, c.id).not.toBeNull();
    expect(CHARS.filter((c) => c.game === "sf6" && c.matchable)).toEqual([]);
  });
  it("文に < > がない(描くときは文字として描くが、念のため)", () => {
    for (const c of CHARS) {
      const text = [c.nameJa, c.nameEn, c.officialRole, c.summary, c.quote.text, ...c.evidence.map((e) => e.quote), c.roleBasis?.text ?? ""].join("");
      expect(/[<>]/.test(text), c.id).toBe(false);
    }
  });
});

describe("生成の検査(決まりに合わないデータは書き出さずに止める)", () => {
  const base = {
    id: "jett", game: "valorant", roleId: "duelist", nameJa: "ジェット", nameEn: "Jett", officialRole: "デュエリスト", summary: "要約",
    quote: { text: "俊敏", url: "https://playvalorant.com/ja-jp/agents/jett/" }, evidence: [] as { tag: string; quote: string; url: string }[],
    pickedBy: "variety", sourceUrl: "https://playvalorant.com/ja-jp/agents/jett/", checkedAt: "2026-10-03", matchable: true,
  };
  const ev = (tag: string) => ({ tag, quote: "引用", url: "https://playvalorant.com/ja-jp/agents/jett/" });
  it("正しい 1 件は通り、reserve と roleBasis の既定は false と null", () => {
    expect(toChars("valorant", [base])[0]).toMatchObject({ id: "jett", reserve: false, roleBasis: null });
  });
  it.each([
    ["id が大文字", { id: "Jett" }],
    ["id に ../", { id: "../jett" }],
    ["game が違う", { game: "apex" }],
    ["要約が 81 字", { summary: "あ".repeat(81) }],
    ["引用が 41 字", { quote: { text: "あ".repeat(41), url: base.sourceUrl } }],
    ["http の出典", { sourceUrl: "http://playvalorant.com/ja-jp/agents/jett/" }],
    ["公式でないドメイン", { sourceUrl: "https://example.com/jett" }],
    ["似せたドメイン", { sourceUrl: "https://playvalorant.com.evil.example/jett" }],
    ["確認日の形", { checkedAt: "2026/10/03" }],
    ["pickedBy が想定外", { pickedBy: "popular" }],
    ["札が 3 枚", { evidence: [ev("front"), ev("mobile"), ev("ally")] }],
    ["同じ軸に 2 枚", { evidence: [ev("front"), ev("hold")] }],
    ["知らない札", { evidence: [ev("tank")] }],
    ["札の引用が公式でない", { evidence: [{ tag: "front", quote: "引用", url: "https://wiki.example/jett" }] }],
  ])("%s → 止まる", (_name, patch) => {
    expect(() => toChars("valorant", [{ ...base, ...patch }])).toThrow();
  });
});

describe("ゲームごとの設定(台帳)", () => {
  it("5 本すべてに設定があり、どのゲームにも非公式の一文がある", () => {
    expect(Object.keys(CHAR_GAME_SETTINGS).sort()).toEqual([...GAME_FILES].sort());
    for (const s of Object.values(CHAR_GAME_SETTINGS)) {
      expect(s.notices.some((n) => n.includes("非公式")), s.id).toBe(true);
      expect(s.unmatchableNote.length, s.id).toBeGreaterThan(0);
    }
  });
  it("スト6 は合うキャラを出さず段も分けない・DbD は引用を出さない・VALORANT は title に名前を入れない", () => {
    expect(CHAR_GAME_SETTINGS.sf6).toMatchObject({ matching: false, groupByRole: false });
    expect(CHAR_GAME_SETTINGS.dbd.showQuotes).toBe(false);
    expect(CHAR_GAME_SETTINGS.valorant.nameInTitle).toBe(false);
    for (const id of ["overwatch", "valorant", "apex", "dbd"] as const) expect(CHAR_GAME_SETTINGS[id].matching, id).toBe(true);
  });
  it("会社の求める断り書きが原文で入っている(スト6 に ©CAPCOM を書かない)", () => {
    expect(CHAR_GAME_SETTINGS.overwatch.notices).toContain("Overwatch is a trademark of Blizzard Entertainment, Inc., in the U.S. and/or other countries.");
    expect(CHAR_GAME_SETTINGS.apex.notices).toContain("This website is not endorsed by or affiliated with EA or its licensors.");
    expect(CHAR_GAME_SETTINGS.valorant.notices.join("")).toContain("Legal Jibber Jabber");
    expect(CHAR_GAME_SETTINGS.dbd.notices.join("")).toContain("Behaviour Interactive Inc. All rights reserved.");
    expect(CHAR_GAME_SETTINGS.sf6.notices).toContain("本作品は二次創作です。");
    expect(CHAR_GAME_SETTINGS.sf6.notices.join("")).not.toMatch(/©|CAPCOM/);
  });
});

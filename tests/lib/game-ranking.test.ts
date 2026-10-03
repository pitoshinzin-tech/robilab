import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseAxesParam } from "@/lib/axes-param";
import { rankGames } from "@/lib/role-match";
import { resultCharPicks } from "@/lib/char-dex";
import { BANNED_WORDS } from "@/lib/char-reason";
import { GameRanking } from "@/components/result/GameRanking";

const axes = parseAxesParam(undefined, "ABCZ");
const render = (chars?: Parameters<typeof GameRanking>[0]["chars"], showScore = false) =>
  renderToStaticMarkup(createElement(GameRanking, { ranks: rankGames(axes), showScore, chars }));

describe("GameRanking の合うキャラの行", () => {
  it("chars を渡さなければ今までと同じ(キャラの行なし)", () => {
    expect(render()).not.toContain("合うキャラ");
  });
  it("公開していて合うキャラを出すゲームの行に、3 体へのリンクと、条件を満たすときだけ手ざわりが違うかも", () => {
    const html = render(resultCharPicks(axes));
    expect(html).toContain('href="/games/overwatch/chars/reinhardt"');
    expect(html).toContain('href="/games/overwatch/chars/winston"');
    expect(html).toContain("ロールは同じでも、手ざわりが違うかも");
    expect(html).toContain("意外な 1 体");
    expect(html).toContain("ウィンストンは素早く動き回るキャラ");
  });
  it("キャラのリンクは、ロールの記号 16px+名前(ラベル「合うキャラ」は別の行)", () => {
    const html = render(resultCharPicks(axes));
    const links = html.match(/<a [^>]*href="\/games\/[^"]+\/chars\/[^"]+"[^>]*>.*?<\/a>/g) ?? [];
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) expect(a).toMatch(/<svg[^>]*width="16"[^>]*height="16"/);
    expect(html).toMatch(/<p[^>]*>合うキャラ<\/p>/);
    expect(html).toContain("sm:grid-cols-3");
  });
  it("キャラのマスに照準の印(rl-lock)と、ずれた軸の札を 1 つだけ(札のないキャラは「ロールのとおり」・数字なし)。sm 以上で 3 列", () => {
    const picks = resultCharPicks(axes);
    const html = render(picks);
    for (const p of Object.values(picks)) {
      for (const f of [...p.fits, ...(p.surprise ? [p.surprise] : [])]) {
        const i = html.indexOf(`href="${f.href}"`);
        const a = html.slice(html.lastIndexOf("<a ", i), html.indexOf("</a>", i));
        expect(a, f.href).toContain("rl-lock");
        if (f.shift) expect(a, f.href).toContain(`>${f.shift.word}<`);
        else expect(a, f.href).toContain(">ロールのとおり<");
        expect(a.replace(/<[^>]*>/g, ""), f.href).not.toMatch(/\d/);
      }
    }
  });
  it("スト6 の行にはキャラのリンクを出さない", () => {
    expect(render(resultCharPicks(axes))).not.toContain("/games/sf6/");
  });
  it("直接開いた結果(% なし)でもキャラは出て、キャラの行に % を出さない", () => {
    const html = render(resultCharPicks(axes), false);
    expect(html).toContain("合うキャラ");
    expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/\d+%/);
  });
  it("?axes 付き(% を出す結果)でも、キャラの行(合うキャラ以降)に % が出ない", () => {
    const html = render(resultCharPicks(axes), true);
    expect(html).toMatch(/\d+%/); // ゲームの行の % は出ている
    const rows = html.split("<li").filter((li) => li.includes("合うキャラ"));
    expect(rows.length).toBeGreaterThan(0);
    for (const li of rows) expect(li.slice(li.indexOf("合うキャラ")).replace(/<[^>]*>/g, " ")).not.toMatch(/\d+%/);
  });
  it("理由の文に否定の言葉を出さない", () => {
    for (const w of BANNED_WORDS) expect(render(resultCharPicks(axes))).not.toContain(w);
  });
});

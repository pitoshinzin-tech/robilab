import { describe, it, expect } from "vitest";
import { GAMES } from "@/data/games";
import { EYE_12, PIXEL_GRIDS } from "@/lib/pixel-art";
import { gameSymbol, roleSymbol } from "@/lib/role-symbols";
import { publishedGames } from "@/lib/char-dex";

describe("ロールの記号(自前のドット絵。公式の絵は使わない)", () => {
  it("6 つの記号が PIXEL_GRIDS に入っている(Illustrator 用に書き出される)", () => {
    for (const id of ["shield", "crosshair", "cross", "eye", "flag", "bolt"]) expect(PIXEL_GRIDS.map((g) => g.id), id).toContain(id);
  });
  it("スト6 以外の全ロールに専用の記号がある", () => {
    for (const g of GAMES.filter((x) => x.id !== "sf6")) {
      for (const r of g.roles) expect(PIXEL_GRIDS, `${g.id}/${r.id}`).toContain(roleSymbol(g.id, r.id));
    }
  });
  it("ロールなし・知らないロール・プロトタイプの名前は「目」", () => {
    expect(roleSymbol("sf6", null)).toBe(EYE_12);
    expect(roleSymbol("overwatch", "healer")).toBe(EYE_12);
    expect(roleSymbol("__proto__", "constructor")).toBe(EYE_12);
  });
});

describe("ゲームの記号(目次)", () => {
  it("公開しているゲームは、それぞれ違う絵で、PIXEL_GRIDS に入っている", () => {
    const ids = publishedGames().map((g) => gameSymbol(g.id).id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of publishedGames()) expect(PIXEL_GRIDS).toContain(gameSymbol(g.id));
  });
  it("知らないゲーム・プロトタイプの名前は「目」", () => {
    expect(gameSymbol("sf6")).toBe(EYE_12);
    expect(gameSymbol("__proto__")).toBe(EYE_12);
  });
});

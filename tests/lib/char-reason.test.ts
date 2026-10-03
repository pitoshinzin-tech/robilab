import { describe, it, expect } from "vitest";
import { CHARS } from "@/data/chars";
import type { CharTagId } from "@/data/char-types";
import { GAMES } from "@/data/games";
import { TYPES } from "@/data/types";
import { parseAxesParam } from "@/lib/axes-param";
import { pickForGame } from "@/lib/char-match";
import { BANNED_WORDS, CHAR_REASON_TEXT, TAG_LABEL, TAG_PHRASE, surpriseReason } from "@/lib/char-reason";

const OW = GAMES.find((g) => g.id === "overwatch")!;
const TANK = OW.roles[0];
const winston = CHARS.find((c) => c.game === "overwatch" && c.id === "winston")!;

describe("手ざわりが違うかも の言い回し(設計書 5-2)", () => {
  it("見出しは否定の言葉を使わない", () => {
    expect(CHAR_REASON_TEXT.heading).toBe("ロールは同じでも、手ざわりが違うかも");
    expect(CHAR_REASON_TEXT.heading).not.toContain("合わない");
  });
  it("理由の文は、ロール・キャラ・札の言葉・あなたの軸とキャラの向きだけで作る", () => {
    expect(surpriseReason(parseAxesParam(undefined, "ABCZ"), winston, TANK, "mobile")).toBe(
      "タンクが合うあなたでも、ウィンストンは素早く動き回るキャラ。相性の良し悪しではなく、遊び方が違うだけ。戦略より直感寄りの日に試すと発見があるかも。",
    );
  });
  it("8 種の札すべてに言葉と短い名前がある", () => {
    const tags: CharTagId[] = ["front", "hold", "mobile", "setup", "ally", "lone", "aggro", "calm"];
    for (const t of tags) {
      expect(TAG_PHRASE[t].length, t).toBeGreaterThan(0);
      expect(TAG_LABEL[t].length, t).toBeGreaterThan(0);
    }
  });
  it("全 16 タイプ × 全ゲームで、出る理由の文に否定の言葉(BANNED_WORDS)が入らない", () => {
    let shown = 0;
    for (const t of TYPES) {
      const u = parseAxesParam(undefined, t.code);
      for (const g of GAMES) {
        const s = pickForGame(u, g, CHARS).surprise;
        if (!s) continue;
        shown++;
        const text = surpriseReason(u, s.char, s.role, s.tag);
        for (const w of BANNED_WORDS) expect(text, `${t.code} ${s.char.id}`).not.toContain(w);
        expect(text).toContain(s.char.nameJa);
      }
    }
    expect(shown).toBeGreaterThan(0);
  });
});

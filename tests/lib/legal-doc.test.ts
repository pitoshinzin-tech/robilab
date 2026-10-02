import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { TOC_MIN, parseLegal } from "@/lib/legal-doc";

describe("parseLegal", () => {
  it("見出しと段落を分け、h2 に順の id を付ける", () => {
    const doc = parseLegal("# 規約\n\n本文1\n\n## 第1条\n\n本文2\n行2\n\n## 第2条");
    expect(doc.blocks).toEqual([
      { kind: "h1", text: "規約" },
      { kind: "p", text: "本文1" },
      { kind: "h2", text: "第1条", id: "sec-1" },
      { kind: "p", text: "本文2\n行2" },
      { kind: "h2", text: "第2条", id: "sec-2" },
    ]);
  });
  it(`h2 が ${TOC_MIN} つ未満なら目次なし、以上ならあり`, () => {
    expect(parseLegal("## a\n\n## b\n\n## c").toc).toEqual([]);
    expect(parseLegal("## a\n\n## b\n\n## c\n\n## d").toc.map((t) => t.id)).toEqual(["sec-1", "sec-2", "sec-3", "sec-4"]);
  });
  it("Windows の改行(\\r\\n)でも分けられる", () => {
    expect(parseLegal("# 規約\r\n\r\n本文").blocks).toEqual([{ kind: "h1", text: "規約" }, { kind: "p", text: "本文" }]);
  });
  it("日付の段落は上に出すため本文から外す", () => {
    const doc = parseLegal("# 規約\n\n本文\n\n制定日:2026年10月");
    expect(doc.dateLine).toBe("制定日:2026年10月");
    expect(doc.blocks.some((b) => b.text.startsWith("制定日"))).toBe(false);
  });
  it("日付の段落は全角・半角のどちらのコロンでも拾う", () => {
    expect(parseLegal("最終更新日:2026年10月1日").dateLine).toBe("最終更新日:2026年10月1日");
    expect(parseLegal("最終更新日：2026年10月1日").dateLine).toBe("最終更新日：2026年10月1日");
    expect(parseLegal("制定日のお知らせ").dateLine).toBeNull();
  });
  it("今の規約とプライバシーポリシーは目次が出る", () => {
    for (const f of ["terms.md", "privacy.md"]) {
      const doc = parseLegal(readFileSync(join(process.cwd(), "content/legal", f), "utf8"));
      expect(doc.toc.length, f).toBeGreaterThanOrEqual(TOC_MIN);
    }
  });
  it("プライバシーポリシーの制定日は上に出し、本文の見出しと段落は 1 つも落とさない", () => {
    const text = readFileSync(join(process.cwd(), "content/legal", "privacy.md"), "utf8");
    const doc = parseLegal(text);
    expect(doc.dateLine).toMatch(/^制定日/);
    const blocks = text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    expect(doc.blocks.length + 1).toBe(blocks.length);
  });
});

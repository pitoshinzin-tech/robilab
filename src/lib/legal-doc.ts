/** 規約・プライバシーポリシーの Markdown(# 見出し・## 見出し・段落だけ)を読む。 */
export type LegalBlock = { kind: "h1"; text: string } | { kind: "h2"; text: string; id: string } | { kind: "p"; text: string };
export type LegalDoc = { blocks: LegalBlock[]; toc: { id: string; text: string }[]; dateLine: string | null };

/** h2 がこの数以上なら目次を出す */
export const TOC_MIN = 4;
/** 「最終更新日:」「制定日:」で始まる段落(コロンは半角・全角のどちらも) */
const DATE_RE = /^(最終更新日|制定日)[:：]/;

export function parseLegal(text: string): LegalDoc {
  const blocks: LegalBlock[] = [];
  let dateLine: string | null = null;
  let n = 0;
  for (const raw of text.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const block = raw.trim();
    if (block === "") continue;
    if (block.startsWith("## ")) {
      n++;
      blocks.push({ kind: "h2", text: block.replace(/^##\s*/, ""), id: `sec-${n}` });
    } else if (block.startsWith("# ")) {
      blocks.push({ kind: "h1", text: block.replace(/^#\s*/, "") });
    } else if (dateLine === null && DATE_RE.test(block)) {
      dateLine = block;
    } else {
      blocks.push({ kind: "p", text: block });
    }
  }
  const h2 = blocks.filter((b): b is Extract<LegalBlock, { kind: "h2" }> => b.kind === "h2");
  return { blocks, dateLine, toc: h2.length >= TOC_MIN ? h2.map(({ id, text }) => ({ id, text })) : [] };
}

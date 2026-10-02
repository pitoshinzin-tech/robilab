import { ExternalLink } from "lucide-react";
import { parseLegal } from "@/lib/legal-doc";
import { PageShell } from "@/components/ui/page-shell";

const URL_RE = /(https?:\/\/[^\s、。()()]+)/;

/** 段落の中の URL だけを外へのリンクにする(文はそのまま) */
function withLinks(text: string) {
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-rl-accent underline underline-offset-4 wrap-anywhere">
        {part}
        <ExternalLink aria-hidden className="size-4 shrink-0" />
        <span className="sr-only">(新しいタブで開きます)</span>
      </a>
    ) : (
      part
    ),
  );
}

/**
 * 規約・プライバシーポリシー(設計書 3-13)。幅 narrow・本文 16px・行間 1.9。
 * 上に制定日・最終更新日、h2 が 4 つ以上なら目次(ページ内のリンク)。文は content/legal の Markdown のまま。
 */
export function LegalText({ text }: { text: string }) {
  const doc = parseLegal(text);
  const title = doc.blocks.find((b) => b.kind === "h1")?.text ?? "";
  return (
    <PageShell title={title} description={doc.dateLine && <span className="text-sm">{doc.dateLine}</span>}>
      <div className="grid gap-4">
        {doc.toc.length > 0 && (
          <nav aria-label="目次" className="mb-4 rounded-rl-md border border-rl-line bg-rl-surface p-4 md:p-6">
            <p className="mb-2 text-sm font-bold text-rl-muted">目次</p>
            <ol className="grid md:grid-cols-2 md:gap-x-6">
              {doc.toc.map((t) => (
                <li key={t.id} className="min-w-0">
                  <a href={`#${t.id}`} className="inline-flex min-h-11 items-center text-sm text-rl-accent underline-offset-4 wrap-anywhere hover:underline">{t.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {doc.blocks.map((b, i) => {
          if (b.kind === "h1") return null;
          if (b.kind === "h2") return <h2 key={i} id={b.id} className="mt-8 scroll-mt-6 text-2xl font-bold [word-break:auto-phrase] text-balance first:mt-0">{b.text}</h2>;
          return <p key={i} className="whitespace-pre-wrap text-base leading-[1.9] wrap-anywhere">{withLinks(b.text)}</p>;
        })}
      </div>
    </PageShell>
  );
}

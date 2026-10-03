/**
 * 構造化データ(パンくずだけ。設計書 6-6)。json は src/lib/char-seo.ts の breadcrumbJsonLd が < を < にしたもの
 * (Next の JSON-LD の手引きどおり)。dangerouslySetInnerHTML はこのサイトの図鑑でここ 1 か所だけ。
 */
export function JsonLd({ json }: { json: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

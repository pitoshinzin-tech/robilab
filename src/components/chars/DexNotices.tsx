import { ExternalLink } from "lucide-react";
import type { CharGameSetting } from "@/data/char-games";
import type { CharSource } from "@/lib/char-dex";
import { isLatinText } from "@/lib/char-seo";

/**
 * 図鑑のページの下の「出典と権利の表記」(設計書 4 章・台帳)。各社の求める断り書きは原文のまま。
 * 外へのリンクは新しいタブで、noopener noreferrer。広告・アフィリエイトは置かない。
 */
export function DexNotices({ settings, checkedAt, sources }: { settings: readonly CharGameSetting[]; checkedAt?: string; sources?: readonly CharSource[] }) {
  return (
    <section aria-labelledby="dex-notices" className="grid gap-4 border-t border-rl-line pt-6">
      <h2 id="dex-notices" className="text-base font-bold">出典と権利の表記</h2>
      {sources && sources.length > 0 && (
        <ul className="grid text-sm">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-rl-accent underline underline-offset-4 wrap-anywhere">
                {s.label}
                <ExternalLink aria-hidden className="size-4 shrink-0" />
                <span className="sr-only">(新しいタブで開きます)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {checkedAt && <p className="text-sm text-rl-muted">確認日 {checkedAt}(公式の内容は変わることがあります)</p>}
      {/* 会社ごとにまとめる(そのゲームの注記は、そのゲームの断り書きの上) */}
      {settings.map((s) => (
        <div key={s.id} data-notice-game={s.id} className="grid gap-2">
          {s.styleNote && <p className="text-sm text-rl-muted">{s.styleNote}</p>}
          <ul className="grid gap-2 text-sm text-rl-muted">
            {s.notices.map((n) => (
              <li key={n} lang={isLatinText(n) ? "en" : undefined} className="wrap-anywhere">{n}</li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-sm text-rl-muted">公式の画像・ロゴは使っていません。キャラの強さ・使用率・勝率は載せていません。</p>
    </section>
  );
}

"use client"; // Error boundaries must be Client Components

import "./globals.css";
import { useEffect } from "react";

// ErrorState・buttonVariants・lucide を import しない:global-error のチャンクはどのページの HTML からも読まれるため、
// 見た目のクラス(ErrorState と buttonVariants の primary / ghost・md)をここに写して軽くしている。見た目を変えるときは両方を直す。
const BTN = "relative inline-flex h-12 shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-rl-pill border border-transparent px-6 text-base font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-(--rl-dur-fast) ease-rl-out active:translate-y-px active:brightness-95";
const PRIMARY = `${BTN} rl-lock bg-rl-accent text-rl-on-accent hover:bg-rl-accent-hover hover:shadow-rl-glow-1 focus-visible:shadow-rl-glow-1`;
const GHOST = `${BTN} bg-transparent text-rl-muted underline-offset-4 hover:text-rl-text hover:underline`;
const ICON = { "aria-hidden": true, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const MESSAGE = "通信状態を確認して、もう一度お試しください。直らないときは、トップから開き直してください。";

/**
 * 設計書 3-14:ルートのレイアウトが壊れたときの画面。レイアウトの代わりに自分で <html><body> と globals.css を持つ
 * (error.md の global-error)。next/font は読み込まれないので system-ui。metadata は使えないので React の <title>。
 * 見た目は error.tsx の ErrorState と同じ(アイコンは lucide の TriangleAlert・RotateCcw・House と同じ線をそのまま書く)。
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="ja">
      <body className="antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
        <title>表示できませんでした|ロビラボ</title>
        <main className="mx-auto grid min-h-dvh w-full max-w-[688px] place-items-center px-4">
          <div role="alert" className="grid justify-items-start gap-3 rounded-rl-md border border-rl-line bg-rl-surface p-4 md:p-6">
            <svg {...ICON} className="size-8 text-rl-danger">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <h1 className="text-xl font-bold">表示できませんでした</h1>
            <p className="text-sm text-rl-muted">{MESSAGE}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className={PRIMARY} onClick={() => retry()}>
                <svg {...ICON} className="size-5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                もう一度試す
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- ルートのレイアウトが壊れているので、Link ではなく読み込み直す */}
              <a href="/" className={GHOST}>
                <svg {...ICON} className="size-5"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                トップへ戻る
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

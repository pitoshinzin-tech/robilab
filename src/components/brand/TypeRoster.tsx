"use client";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { axisInitials, axisLine } from "@/lib/type-axes";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/use-reduced-motion";
import { ROSTER_THRESHOLD, isMostlyVisible, rosterSeen } from "@/lib/motion/roster-entrance";
import { useIsClient } from "@/lib/use-is-client";

/** name は画面に出す名前(短くしてよい)、label は読み上げる正式な名前(なければ name) */
export type RosterItem = { code: string; name: string; label?: string; icon: ReactNode };

/**
 * 追補 S5:16 タイプの名簿(箱なしの絵 + コード)。画面に入ったとき 1 回だけ 1 体ずつ現れる。サイトで「スクロールで動く」のはここだけ。
 * IntersectionObserver で 1 回だけ data-in を付けて外す(スクロールで戻っても再生しない)。
 * 入場が済んだことはページごとに sessionStorage(とモジュールの変数)でおぼえ、別のページから戻ってきても再生しない。
 * ハイドレーションの時点ですでに 2 割以上見えている名簿は動かさない(見えていたものが消えて組み直すちらつきを出さない)。
 * 絵(TypeIcon)はサーバーで作って icon で受け取る(16 タイプの文章をブラウザの JS に入れない)。
 */
export function TypeRoster({ items, showName = false, className }: { items: readonly RosterItem[]; showName?: boolean; className?: string }) {
  const list = useRef<HTMLUListElement>(null);
  const clientMount = useIsClient();
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const seen = rosterSeen(window.location.pathname);
    const session = () => window.sessionStorage;
    // もう見た名簿(このセッションで入場が済んだ・戻ってきた)は、最初から並んだ形のまま
    if (seen.has(session)) return;
    // ハイドレーションの時点で 2 割以上見えている名簿は、動かさずに「見た」にする(しきい値は IntersectionObserver と同じ)
    if (!clientMount && isMostlyVisible(el.getBoundingClientRect(), window.innerHeight)) {
      seen.mark(session);
      return;
    }
    el.dataset.armed = "";
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      el.dataset.in = "";
      seen.mark(session);
      io.disconnect();
    }, { threshold: ROSTER_THRESHOLD });
    io.observe(el);
    return () => io.disconnect();
    // 最初の 1 回だけ(clientMount は最初の描画の値を使う)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul ref={list} className={cn("rl-roster relative grid grid-cols-4 gap-x-2 gap-y-4 pb-10 md:grid-cols-8", className)}>
      {items.map((t, i) => (
        <li key={t.code} className="rl-roster-item rl-dissolve-host" style={{ "--i": i } as CSSProperties}>
          <Link href={`/type/${t.code}`} className="rl-lock grid min-h-11 place-items-center content-start gap-1 p-2">
            {/* 動きの参考 025:ホバー・フォーカスで絵が上から 4 段で 1 段明るくなる */}
            <span className="relative grid">
              {t.icon}
              <span aria-hidden className="rl-dissolve-lit rl-dissolve-tint pointer-events-none absolute inset-0 rounded-rl-sm" />
            </span>
            <span className="font-display text-sm text-rl-highlight">{t.code}</span>
            {/* 名前は日本語の文節で折る(対応しないブラウザは今までどおりどこでも折れる)。読み上げは下の sr-only の正式な名前 */}
            {showName && <span aria-hidden className="text-center text-xs font-bold wrap-anywhere [word-break:auto-phrase] text-balance md:text-sm">{t.name}</span>}
            <span aria-hidden className="text-xs text-rl-muted pointer-fine:hidden">{axisInitials(t.code)}</span>
            <span className="sr-only">{`${t.label ?? t.name}(${axisLine(t.code)})`}</span>
          </Link>
          <span aria-hidden className="rl-roster-axes pointer-events-none absolute inset-x-0 bottom-0 hidden h-8 items-center justify-center text-sm pointer-fine:flex">
            {axisLine(t.code)}
          </span>
        </li>
      ))}
    </ul>
  );
}

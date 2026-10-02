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
export function TypeRoster({ items, showName = false, mobileName = true, nameSize = "xs", className }: {
  items: readonly RosterItem[]; showName?: boolean; mobileName?: boolean; nameSize?: "xs" | "sm"; className?: string;
}) {
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
        // data-l0〜l3:コードの 4 文字(一覧の凡例の 2 択で絞るとき、CSS が合わないタイプを薄くする)
        <li key={t.code} className="rl-roster-item rl-dissolve-host" style={{ "--i": i } as CSSProperties} data-l0={t.code[0]} data-l1={t.code[1]} data-l2={t.code[2]} data-l3={t.code[3]}>
          {/* PC は横の余白を 0 にして名前の幅を取る(列の間 gap-x-2 で足りる)。
              絵の塗り替え(動きの参考 025)は、icon に dissolve を付けた TypeIcon を渡す(li が .rl-dissolve-host) */}
          <Link href={`/type/${t.code}`} className="rl-lock grid min-h-11 place-items-center content-start gap-1 p-2 md:px-0 md:py-2">
            {t.icon}
            <span className="font-display text-sm text-rl-highlight">{t.code}</span>
            {/* 名前は日本語の文節で折る(対応しないブラウザは今までどおりどこでも折れる)。読み上げは下の sr-only の正式な名前。
                mobileName={false} のときスマホは名前を出さず、絵・コード・頭文字の 3 段にそろえる */}
            {showName && (
              <span aria-hidden className={cn("text-center font-bold wrap-anywhere [word-break:auto-phrase] text-balance", nameSize === "sm" ? "text-sm" : "text-xs md:text-sm", !mobileName && "hidden md:block")}>{t.name}</span>
            )}
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

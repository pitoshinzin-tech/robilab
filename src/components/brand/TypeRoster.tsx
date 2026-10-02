"use client";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { axisInitials, axisLine } from "@/lib/type-axes";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/use-reduced-motion";
import { useIsClient } from "@/lib/use-is-client";

export type RosterItem = { code: string; name: string; icon: ReactNode };

/**
 * 追補 S5:16 タイプの名簿(箱なしの絵 + コード)。画面に入ったとき 1 回だけ 1 体ずつ現れる。サイトで「スクロールで動く」のはここだけ。
 * IntersectionObserver で 1 回だけ data-in を付けて外す(スクロールで戻っても再生しない)。
 * ハイドレーションの時点ですでに見えている名簿は動かさない(見えていたものが消えて組み直すちらつきを出さない)。
 * 絵(TypeIcon)はサーバーで作って icon で受け取る(16 タイプの文章をブラウザの JS に入れない)。
 */
export function TypeRoster({ items, showName = false, className }: { items: readonly RosterItem[]; showName?: boolean; className?: string }) {
  const list = useRef<HTMLUListElement>(null);
  const clientMount = useIsClient();
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const inView = el.getBoundingClientRect().top < window.innerHeight;
    if (!clientMount && inView) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      el.dataset.in = "";
      io.disconnect();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
    // 最初の 1 回だけ(clientMount は最初の描画の値を使う)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul ref={list} className={cn("rl-roster relative grid grid-cols-4 gap-x-2 gap-y-4 pb-10 md:grid-cols-8", className)}>
      {items.map((t, i) => (
        <li key={t.code} className="rl-roster-item" style={{ "--i": i } as CSSProperties}>
          <Link href={`/type/${t.code}`} className="rl-lock grid min-h-11 place-items-center gap-1 p-2">
            {t.icon}
            <span className="font-display text-sm text-rl-highlight">{t.code}</span>
            {showName && <span className="text-center text-sm font-bold wrap-anywhere">{t.name}</span>}
            <span aria-hidden className="text-xs text-rl-muted pointer-fine:hidden">{axisInitials(t.code)}</span>
            <span className="sr-only">{showName ? "" : t.name}({axisLine(t.code)})</span>
          </Link>
          <span aria-hidden className="rl-roster-axes pointer-events-none absolute inset-x-0 bottom-0 hidden h-8 items-center justify-center text-sm pointer-fine:flex">
            {axisLine(t.code)}
          </span>
        </li>
      ))}
    </ul>
  );
}

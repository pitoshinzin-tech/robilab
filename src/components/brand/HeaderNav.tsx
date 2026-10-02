"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS, activeTabId } from "@/lib/nav";

/** 768px 以上の上のナビ(タブバーと同じ 5 つ)。今いる場所は文字を明るく+パープルの下線。 */
export function HeaderNav() {
  const active = activeTabId(usePathname());
  return (
    <nav aria-label="メイン" className="hidden flex-1 items-center justify-end gap-1 md:flex">
      {NAV_TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? "page" : undefined}
          className="relative inline-flex h-11 items-center rounded-rl-sm px-3 text-sm font-bold text-rl-muted after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-transparent hover:text-rl-text aria-[current=page]:text-rl-text aria-[current=page]:after:bg-rl-selected"
        >
          <span className="rl-lock-in inline-flex h-8 items-center">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

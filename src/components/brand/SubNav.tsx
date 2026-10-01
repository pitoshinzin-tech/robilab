"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeSubnavHref, type SubnavItem } from "@/lib/nav";

/** 同じタブの中のページの切り替え(例:マウス探し/感度計算/プロ設定)。今いるページはパープルの下線。 */
export function SubNav({ label, items }: { label: string; items: readonly SubnavItem[] }) {
  const active = activeSubnavHref(usePathname(), items);
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className="mb-4 flex flex-wrap gap-x-4 border-b border-rl-line">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active === i.href ? "page" : undefined}
          className="relative inline-flex h-11 items-center text-sm font-bold text-rl-muted after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent hover:text-rl-text aria-[current=page]:text-rl-text aria-[current=page]:after:bg-rl-selected"
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

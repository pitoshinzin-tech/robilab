import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Char } from "@/data/char-types";
import type { GamerType } from "@/data/types";
import { TypeIcon } from "@/components/brand/TypeIcon";

/**
 * 図鑑の一覧の 1 行(箱にせず幅いっぱいの行。追補 5-3)。名前・英語の名前・公式のロール・ロビラボの要約・合うタイプの絵 1 つ。
 * 公式の引用は一覧に出さない(1 体のページだけ)。
 */
export function CharRow({ char, href, showRole, fit }: { char: Char; href: string; showRole: boolean; fit: GamerType | null }) {
  return (
    <li className="border-b border-rl-line">
      <Link href={href} className="rl-lock group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-4">
        <span className="grid min-w-0 gap-1">
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span data-long-name className="text-xl font-bold wrap-anywhere">{char.nameJa}</span>
            {char.nameEn !== char.nameJa && <span lang="en" className="text-sm text-rl-muted wrap-anywhere">{char.nameEn}</span>}
          </span>
          {showRole && <span className="text-sm text-rl-muted wrap-anywhere">{char.officialRole}</span>}
          <span className="text-sm text-pretty [word-break:auto-phrase]">{char.summary}</span>
        </span>
        {fit ? (
          <span className="grid justify-items-center gap-1">
            <TypeIcon code={fit.code} size={48} />
            <span aria-hidden className="font-display text-sm text-rl-highlight">{fit.code}</span>
            <span className="sr-only">合うタイプ {fit.name}</span>
          </span>
        ) : (
          <span aria-hidden />
        )}
        <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
      </Link>
    </li>
  );
}

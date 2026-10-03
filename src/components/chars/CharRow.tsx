import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Char } from "@/data/char-types";

/**
 * 図鑑の一覧の 1 行(箱にせず幅いっぱいの行。追補 5-3)。名前・英語の名前・公式のロール・ロビラボの要約。
 * 合うタイプの絵はロールの段の見出しに 1 回だけ(採点 1 回目 P0)。行には、公式の言葉の札でロールの土台からずれた軸だけを言葉の札で出す
 * (ずれがなければ何も出さない。数字は出さない)。公式の引用は一覧に出さない(1 体のページだけ)。
 */
export function CharRow({ char, href, showRole, shifts }: { char: Char; href: string; showRole: boolean; shifts: readonly string[] }) {
  return (
    <li className="border-b border-rl-line">
      <Link href={href} className="rl-lock group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
        <span className="grid min-w-0 gap-1">
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span data-long-name className="text-xl font-bold wrap-anywhere">{char.nameJa}</span>
            {char.nameEn !== char.nameJa && <span lang="en" className="text-sm text-rl-muted wrap-anywhere">{char.nameEn}</span>}
          </span>
          {showRole && <span className="text-sm text-rl-muted wrap-anywhere">{char.officialRole}</span>}
          <span className="text-sm text-pretty [word-break:auto-phrase]">{char.summary}</span>
          {shifts.length > 0 && (
            <span className="flex flex-wrap gap-2 pt-1">
              <span className="sr-only">ロールの土台からずれた軸:</span>
              {shifts.map((w) => (
                <span key={w} className="inline-flex h-7 items-center rounded-rl-sm border border-rl-line-strong px-2 text-sm font-bold">{w}</span>
              ))}
            </span>
          )}
        </span>
        <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
      </Link>
    </li>
  );
}

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Bell } from "@/components/lobby/Bell";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
      <Link href="/" className="rl-glitch shrink-0 whitespace-nowrap text-xl font-bold">{BRAND.name}</Link>
      <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-[var(--rl-muted)]">
        <Link href="/diagnosis" className="whitespace-nowrap">診断</Link>
        <Link href="/tools/sensitivity" className="whitespace-nowrap">感度計算</Link>
        <Link href="/my" className="whitespace-nowrap">マイ設定</Link>
        <Link href="/types" className="whitespace-nowrap">タイプ一覧</Link>
        <Link href="/lobby" className="whitespace-nowrap">仲間</Link>
        <Bell />
      </nav>
    </header>
  );
}

import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <Link href="/" className="rl-glitch text-xl font-bold">{BRAND.name}</Link>
      <nav className="flex gap-4 text-sm text-[var(--rl-muted)]">
        <Link href="/diagnosis">診断</Link>
        <Link href="/tools/sensitivity">感度計算</Link>
        <Link href="/types">タイプ一覧</Link>
      </nav>
    </header>
  );
}

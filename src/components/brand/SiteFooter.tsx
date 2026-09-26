import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-5xl px-4 py-8 text-xs text-[var(--rl-muted)]">
      <nav className="mb-3 flex flex-wrap gap-4">
        <Link href="/terms">利用規約</Link>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/disclosure">広告表記</Link>
      </nav>
      <p>© {new Date().getFullYear()} {BRAND.name} / {BRAND.nameEn}。ゲームの名称は各社の商標です。当サイトは各ゲームの公式サイトではありません。</p>
    </footer>
  );
}

import Link from "next/link";
import { BRAND } from "@/lib/brand";

const LINKS = [["/terms", "利用規約"], ["/privacy", "プライバシーポリシー"], ["/disclosure", "広告表記"]] as const;

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 w-full max-w-[1168px] border-t border-rl-line px-4 py-8 text-sm text-rl-muted md:px-6">
      <nav aria-label="サイトの情報" className="mb-4 flex flex-wrap gap-x-6">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-rl-sm hover:text-rl-text hover:underline">{label}</Link>
        ))}
      </nav>
      <p className="text-xs">© {new Date().getFullYear()} {BRAND.name} / {BRAND.nameEn}。ゲームの名称は各社の商標です。当サイトは各ゲームの公式サイトではありません。</p>
    </footer>
  );
}

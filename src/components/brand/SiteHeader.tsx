import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { VT_SITE_HEADER } from "@/lib/motion/vt-names";
import { Bell } from "@/components/lobby/Bell";
import { BrandMark } from "./BrandMark";
import { HeaderNav } from "./HeaderNav";

/**
 * 上のヘッダー(固定しない)。プロ設定・感度計算・タイプ一覧はタブの中の SubNav へ移した。
 * (追補 4-3・4-5)ロゴの組みは「カタカナ Zen Kaku 900(表示速度のため 700 + 縁の .rl-black で近づける。docs/design/perf.md)+ ROBILAB Orbitron 600・字間 0.08em」。20px なので色ズレは付けない。
 * (追補 S3)ページが切り替わる間は動かない。
 */
export function SiteHeader() {
  return (
    <header className="border-b border-rl-line" style={{ viewTransitionName: VT_SITE_HEADER }}>
      <div className="mx-auto flex h-14 w-full max-w-[1168px] items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2 rounded-rl-sm">
          <BrandMark />
          <span className="grid leading-none">
            <span className="rl-black text-xl">{BRAND.name}</span>
            <span className="font-display text-xs font-semibold tracking-[0.08em] text-rl-muted">{BRAND.nameEn}</span>
          </span>
        </Link>
        <HeaderNav />
        <div className="flex shrink-0 items-center">
          <Bell />
        </div>
      </div>
    </header>
  );
}

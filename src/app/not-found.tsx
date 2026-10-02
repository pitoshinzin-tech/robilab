import { cn } from "@/lib/utils";
import { BROKEN_12 } from "@/lib/pixel-art";
import { PixelArt } from "@/components/brand/PixelArt";
import { ButtonLink } from "@/components/ui/button-link";
import { pageContainerClass } from "@/components/ui/page-shell";

/**
 * 設計書 3-14・追補 6 章:「404」は display-2 の Orbitron(マゼンタ)、その下に右下が欠けた 12×12 のマス(96px・1 マス 8px)。
 * 開いたときは動かない。マスはホバー・フォーカス(ボタンに Tab で来たとき)で上から 4 段で塗り替わる(動きの参考 025。main が .rl-dissolve-host)。
 */
export default function NotFound() {
  return (
    <main className={cn(pageContainerClass("narrow"), "rl-dissolve-host grid justify-items-start gap-4")}>
      <p aria-hidden className="font-display text-rl-display-2 font-black text-rl-highlight">404</p>
      <PixelArt grid={BROKEN_12} size={96} dissolve className="mb-4" />
      <h1 className="text-rl-title font-bold [word-break:auto-phrase] text-balance">ページが見つかりません</h1>
      <p className="text-base text-rl-muted [word-break:auto-phrase] text-balance">URL を確かめるか、トップから探してください。</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/" variant="primary">トップへ</ButtonLink>
        <ButtonLink href="/diagnosis" variant="secondary">タイプ診断をする</ButtonLink>
      </div>
    </main>
  );
}

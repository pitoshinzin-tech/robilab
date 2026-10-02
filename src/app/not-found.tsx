import { cn } from "@/lib/utils";
import { BROKEN_12 } from "@/lib/pixel-art";
import { PixelArt } from "@/components/brand/PixelArt";
import { ButtonLink } from "@/components/ui/button-link";
import { pageContainerClass } from "@/components/ui/page-shell";

/**
 * 設計書 3-14・追補 6 章:「404」は display-2 の Orbitron(マゼンタ)、その下に右下が欠けた 12×12 のマス(96px・1 マス 8px)。
 * 開いたときは動かない。マスはホバー・フォーカスで上から 4 段で塗り替わる(動きの参考 025)。
 * 塗り替えるのは、絵に乗ったとき(絵の箱が .rl-dissolve-host)と、ボタンの列に乗る・Tab で来たとき(main が .rl-dissolve-scope、
 * ボタンの列が .rl-dissolve-trigger)だけ。main 全体にしないのは、開いたときにマウスが中にあるとすぐ動いてしまうため。
 */
export default function NotFound() {
  return (
    <main className={cn(pageContainerClass("narrow"), "rl-dissolve-scope grid justify-items-start gap-4")}>
      <p aria-hidden className="font-display text-rl-display-2 font-black text-rl-highlight">404</p>
      <span className="rl-dissolve-host mb-4 inline-flex"><PixelArt grid={BROKEN_12} size={96} dissolve /></span>
      <h1 className="text-rl-title font-bold [word-break:auto-phrase] text-balance">ページが見つかりません</h1>
      <p className="text-base text-rl-muted [word-break:auto-phrase] text-balance">URL を確かめるか、トップから探してください。</p>
      <div className="rl-dissolve-trigger flex flex-wrap gap-3">
        <ButtonLink href="/" variant="primary">トップへ</ButtonLink>
        <ButtonLink href="/diagnosis" variant="secondary">タイプ診断をする</ButtonLink>
      </div>
    </main>
  );
}

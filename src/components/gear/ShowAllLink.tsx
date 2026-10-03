import { ButtonLink } from "@/components/ui/button-link";
import { showAllText } from "@/lib/list-limit";

/**
 * 一覧の下の「すべて見る(全 N 件)」。?all=1 を足した URL へのふつうのリンク(サーバーが全件を描く。JS 0)。
 * 押したあとも同じ位置から読み進められるよう、上に戻さない。
 */
export function ShowAllLink({ href, total }: { href: string; total: number }) {
  return (
    <ButtonLink href={href} scroll={false} variant="secondary" size="sm" className="justify-self-start">
      {showAllText(total)}
    </ButtonLink>
  );
}

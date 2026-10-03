import type * as React from "react";
import { ExternalLink } from "lucide-react";
import type { ShopLinks } from "@/lib/shop-links";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * 店(Amazon・楽天)と公式ページのリンク。店のリンクは広告(rel="sponsored")で、紹介料の設定があるときは PR を付ける。
 * primary は 1 画面に 1 つだけ(一覧の先頭だけ true)。hooks を使わないので、サーバーでもブラウザでも使える。
 * children:同じ並びの最後に足すリンク(「このマウスのソール」など。ghost は px-0 で左の端をそろえる)。
 */
export function ShopButtons({ links, primary = false, className, children }: { links: ShopLinks; primary?: boolean; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {(links.amazonPr || links.rakutenPr) && <Badge variant="pr">PR</Badge>}
      <ButtonAnchor href={links.amazon} target="_blank" rel="sponsored noopener noreferrer" variant={primary ? "primary" : "secondary"} size={primary ? "md" : "sm"}>
        Amazon で探す<ExternalLink aria-hidden className="size-4" />
      </ButtonAnchor>
      <ButtonAnchor href={links.rakuten} target="_blank" rel="sponsored noopener noreferrer" variant="secondary" size="sm">
        {links.rakutenIsItem ? "楽天で見る" : "楽天で探す"}<ExternalLink aria-hidden className="size-4" />
      </ButtonAnchor>
      <ButtonAnchor href={links.official} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" className="px-0">
        公式ページ<ExternalLink aria-hidden className="size-4" />
      </ButtonAnchor>
      {children}
    </div>
  );
}

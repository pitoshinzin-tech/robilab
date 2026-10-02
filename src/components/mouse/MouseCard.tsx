import { ExternalLink } from "lucide-react";
import type { Ranked } from "@/lib/mouse-fit";
import type { ShopLinks } from "@/lib/shop-links";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Badge, RankBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChipButton } from "@/components/ui/chip-button";

const SHAPE = { symmetric: "左右対称", right: "右手用" } as const;
const CONNECTION = { wired: "有線", wireless: "無線" } as const;

export function MouseCard({ rank, primaryShop, item, brand, name, reason, compare, links, imageUrl, overlaid = false, onOverlay }: {
  rank: number;
  /** 1 位のカードだけ true(Amazon のボタンを主ボタンにする。主ボタンは 1 画面に 1 つ)。追補 6 章で 1 位は TopMouseRow になったので、今はいつも false */
  primaryShop: boolean;
  item: Ranked; brand: string; name: string;
  /** おすすめの理由(src/lib/mouse-reason.ts。手の情報と公式の数字だけから作る) */
  reason: string;
  compare: string | null; links: ShopLinks;
  /** 楽天の商品画像(スナップショットにあるときだけ。クリックで楽天の商品ページへ) */
  imageUrl?: string | null;
  /** (追補 6 章)実寸の重ね図に出しているか、と「手と重ねる」を押したとき */
  overlaid?: boolean;
  onOverlay?: () => void;
}) {
  const m = item.mouse;
  const image = imageUrl && links.rakutenIsItem ? imageUrl : null;
  const specs: [string, string][] = [["長さ", `${m.lengthMm}mm`], ["幅", `${m.widthMm}mm`], ["高さ", `${m.heightMm}mm`], ["重さ", `${m.weightG}g`], ["形", SHAPE[m.shape]], ["接続", CONNECTION[m.connection]]];
  return (
    <Card as="li" className={image ? "grid gap-4 md:grid-cols-[8rem_minmax(0,1fr)] md:items-start" : "grid gap-4"}>
      {image && (
        <a href={links.rakuten} target="_blank" rel="sponsored noopener noreferrer" className="relative justify-self-center rounded-rl-sm md:justify-self-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- 楽天の画像サーバーの画像をそのまま出す(next/image の最適化は通さない) */}
          <img src={image} alt={`${brand} ${name}(楽天市場の商品画像)`} width={300} height={300} loading="lazy" className="size-32 rounded-rl-sm bg-white object-contain" />
          {links.rakutenPr && <Badge variant="pr" className="absolute left-1 top-1 bg-rl-bg">PR</Badge>}
        </a>
      )}
      <div className="grid min-w-0 gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <p className="flex items-center gap-2 text-sm text-rl-muted"><RankBadge rank={rank} />{brand}</p>
            <h3 data-long-name className="text-xl font-bold wrap-anywhere">{name}</h3>
          </div>
          <p className="shrink-0 text-right"><span className="font-display text-2xl tabular-nums text-rl-highlight">{item.score}</span><span className="block text-sm text-rl-muted">合う度</span></p>
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-bold text-rl-muted">おすすめの理由</p>
          <p className="text-base">{reason}</p>
        </div>
        <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm text-rl-muted md:grid-cols-6">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="tabular-nums text-rl-text">{v}</dd></div>)}
        </dl>
        {compare && <p className="text-sm text-rl-secondary-text">{compare}</p>}
        {onOverlay && <ChipButton pressed={overlaid} onClick={onOverlay} className="justify-self-start">手と重ねる</ChipButton>}
        <div className="grid gap-3 border-t border-rl-line pt-4">
          {(links.amazonPr || links.rakutenPr) && <Badge variant="pr" className="justify-self-start">PR</Badge>}
          <div className="flex flex-wrap gap-2">
            <ButtonAnchor href={links.amazon} target="_blank" rel="sponsored noopener noreferrer" variant={primaryShop ? "primary" : "secondary"} size="sm">Amazon で探す<ExternalLink aria-hidden className="size-4" /></ButtonAnchor>
            <ButtonAnchor href={links.rakuten} target="_blank" rel="sponsored noopener noreferrer" variant="secondary" size="sm">{links.rakutenIsItem ? "楽天で見る" : "楽天で探す"}<ExternalLink aria-hidden className="size-4" /></ButtonAnchor>
          </div>
          <ButtonAnchor href={links.official} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" className="justify-self-start">公式ページ<ExternalLink aria-hidden className="size-4" /></ButtonAnchor>
        </div>
      </div>
    </Card>
  );
}

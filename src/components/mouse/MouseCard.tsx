import type { Ranked } from "@/lib/mouse-fit";
import type { ShopLinks } from "@/lib/shop-links";

const SHAPE = { symmetric: "左右対称", right: "右手用" } as const;
const CONNECTION = { wired: "有線", wireless: "無線" } as const;

export function MouseCard({ rank, item, brand, name, compare, links }: {
  rank: number; item: Ranked; brand: string; name: string; compare: string | null; links: ShopLinks;
}) {
  const m = item.mouse;
  return (
    <li className="grid gap-3 rounded-2xl border border-white/10 bg-[var(--rl-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--rl-muted)]">{rank}位 ・ {brand}</p>
          <p className="text-lg font-bold">{name}</p>
        </div>
        <p className="shrink-0 text-right"><span className="text-2xl font-bold text-[var(--rl-highlight)]">{item.score}</span><span className="block text-xs text-[var(--rl-muted)]">合う度</span></p>
      </div>
      <p className="text-sm">{item.reasons.join(" ・ ")}</p>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs text-[var(--rl-muted)] sm:grid-cols-6">
        <div><dt>長さ</dt><dd className="text-[var(--rl-text)]">{m.lengthMm}mm</dd></div>
        <div><dt>幅</dt><dd className="text-[var(--rl-text)]">{m.widthMm}mm</dd></div>
        <div><dt>高さ</dt><dd className="text-[var(--rl-text)]">{m.heightMm}mm</dd></div>
        <div><dt>重さ</dt><dd className="text-[var(--rl-text)]">{m.weightG}g</dd></div>
        <div><dt>形</dt><dd className="text-[var(--rl-text)]">{SHAPE[m.shape]}</dd></div>
        <div><dt>接続</dt><dd className="text-[var(--rl-text)]">{CONNECTION[m.connection]}</dd></div>
      </dl>
      {compare && <p className="text-xs text-[var(--rl-secondary)]">{compare}</p>}
      <div className="flex flex-wrap gap-2 text-sm">
        <a href={links.official} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2">公式ページ</a>
        <a href={links.amazon} target="_blank" rel="sponsored noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2">
          Amazon で探す{links.amazonPr && <span className="ml-1 text-xs text-[var(--rl-muted)]">PR</span>}
        </a>
        <a href={links.rakuten} target="_blank" rel="sponsored noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2">
          楽天で探す{links.rakutenPr && <span className="ml-1 text-xs text-[var(--rl-muted)]">PR</span>}
        </a>
      </div>
    </li>
  );
}

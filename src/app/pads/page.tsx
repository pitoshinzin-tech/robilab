import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, SearchX } from "lucide-react";
import { PADS } from "@/data/pads";
import { PROS_READY } from "@/data/pros";
import { byPopularity, POPULARITY_NOTE } from "@/lib/gear-popularity";
import type { SearchParams } from "@/lib/gear-query";
import { SURFACE_LABEL } from "@/lib/gear-labels";
import { subnavFor } from "@/lib/nav";
import {
  NO_PAD_FILTER, SIZE_CLASSES, THICKNESS_CLASSES, filterPads, isPadFilterEmpty, padCountCaption, padFilterCount, padFilterHref, parsePadFilter, visiblePads, type PadFilter,
} from "@/lib/pad-filter";
import { limitRows, parseShowAll, shownNote } from "@/lib/list-limit";
import { affiliateEnv, shopLinks } from "@/lib/shop-links";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { NumUnit } from "@/components/ui/num-unit";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { FilterGroup, type FilterOption } from "@/components/gear/FilterGroup";
import { PadRow } from "@/components/gear/PadRow";
import { FilterDisclosure } from "@/components/gear/FilterDisclosure";
import { ShowAllLink } from "@/components/gear/ShowAllLink";

const TITLE = "マウスパッド探し(面・大きさ・厚さで選ぶ)";
const DESCRIPTION = "人気のゲーミングマウスパッドを、メーカー公式の大きさ・厚さと、公式の言葉の「速さ・止め」で比べます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const SURFACES = ["cloth", "hybrid", "glass", "hard"] as const;

function options<K extends keyof PadFilter>(filter: PadFilter, showAll: boolean, key: K, items: readonly (readonly [PadFilter[K], string])[]): FilterOption[] {
  return items.map(([value, text]) => ({ key: String(value), text, href: padFilterHref(filter, { [key]: value } as Partial<PadFilter>, showAll), current: filter[key] === value }));
}

export default async function PadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filter = parsePadFilter(sp);
  const showAll = parseShowAll(sp);
  const all = byPopularity(visiblePads(PADS));
  const matches = filterPads(all, filter);
  // 最初は人気の順の上位 12 行だけ描く(HTML を軽く。?all=1 で全件)。数の表示は全件のまま
  const list = limitRows(matches, showAll);
  const clearHref = padFilterHref(NO_PAD_FILTER, {}, showAll);
  const env = affiliateEnv();
  const narrowed = filter.size !== "all" || filter.thickness !== "all";
  const filterCount = padFilterCount(filter);
  const filters = (
    <>
      <FilterGroup label="面" options={options(filter, showAll, "surface", [["all", "すべて"], ...SURFACES.map((s) => [s, SURFACE_LABEL[s]] as const)])} />
      <FilterGroup label="大きさ" hint={`公式の横幅で分けた目安です(${SIZE_CLASSES.map((c) => `${c.id} ${c.hint}`).join("・")})。`}
        options={options(filter, showAll, "size", [["all", "すべて"], ...SIZE_CLASSES.map((c) => [c.id, c.id] as const)])} />
      <FilterGroup label="厚さ" hint={`公式の厚さがあるサイズだけで分けます(${THICKNESS_CLASSES.map((c) => `${c.label} ${c.hint}`).join("・")})。`}
        options={options(filter, showAll, "thickness", [["all", "すべて"], ...THICKNESS_CLASSES.map((c) => [c.id, c.label] as const)])} />
      <FilterGroup label="硬さ" options={options(filter, showAll, "firmness", [["all", "すべて"], ["variants", "硬さを選べる"]])} />
      {!isPadFilterEmpty(filter) && <ButtonLink href={clearHref} scroll={false} variant="ghost" size="sm" className="justify-self-start px-0">絞り込みを外す</ButtonLink>}
    </>
  );

  return (
    <PageShell width="wide" title="マウスパッド探し" description="面・大きさ・厚さで絞り込み、メーカー公式の言葉で「速さ・止め」を読めます。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}
      actions={<p className="grid justify-items-start md:justify-items-end"><NumUnit value={matches.length} unit="枚" className="text-rl-display-2" /><span className="text-sm text-rl-muted">{padCountCaption(filter, all.length)}</span></p>}>
      <div className="grid gap-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          {/* lg 以上は左の列に開いたまま。lg 未満は結果の見出しの下に畳む(一覧を上に。/mouse と同じ) */}
          <Card as="section" aria-labelledby="pads-filters" className="hidden gap-4 lg:sticky lg:top-6 lg:grid">
            <h2 id="pads-filters" className="text-xl font-bold">絞り込み</h2>
            {filters}
          </Card>

          <section aria-labelledby="pads-results" className="grid gap-4">
            <SectionHeading id="pads-results" title="人気の順" count={matches.length} description={list.cut ? shownNote(list.shown.length) : undefined} />
            <FilterDisclosure count={filterCount}>{filters}</FilterDisclosure>
            {matches.length > 0 && <p className="flex flex-wrap items-center gap-2 text-sm text-rl-muted"><Badge variant="pr">PR</Badge>このリンクから買うと、ロビラボに紹介料が入ることがあります</p>}
            {all.length === 0 ? (
              <EmptyState icon={PackageOpen} title="マウスパッドのデータがまだありません" description="先にマウス探しで、手に合うマウスを見られます。"
                action={<ButtonLink href="/mouse" variant="secondary">マウス探しへ</ButtonLink>} />
            ) : matches.length === 0 ? (
              <EmptyState icon={SearchX} title="条件に合うマウスパッドがありません" description="絞り込みを 1 つ外すと見つかりやすくなります。"
                action={<ButtonLink href={clearHref} scroll={false} variant="secondary">絞り込みを外す</ButtonLink>} />
            ) : (
              <>
                <ol className="grid">
                  {list.shown.map((m, i) => (
                    <PadRow key={m.pad.id} pad={m.pad} sizes={m.sizes} narrowed={narrowed} primary={i === 0}
                      links={shopLinks(`${m.pad.brand} ${m.pad.name}`, m.pad.officialUrl, env)} />
                  ))}
                </ol>
                {list.cut && <ShowAllLink href={padFilterHref(filter, {}, true)} total={list.total} />}
              </>
            )}
          </section>
        </div>
        <div className="grid gap-2 text-xs text-rl-muted">
          <p className="text-sm">{POPULARITY_NOTE}</p>
          <p>大きさ・厚さ・速さと止めの言葉は、各メーカー公式サイトの表記です(確認日は製品ごと)。公式に書いていないものは「公式の記載なし」と出し、速さ・止めは点数にしません。生産終了は公式ページに書いてあるものだけ札を付けています。</p>
          <p>価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。</p>
        </div>
      </div>
    </PageShell>
  );
}

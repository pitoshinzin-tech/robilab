import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { SKATES } from "@/data/skates";
import { DEVICES } from "@/data/devices";
import { PROS_READY } from "@/data/pros";
import type { SkateSpec } from "@/data/gear-types";
import { firstParam, type SearchParams } from "@/lib/gear-query";
import { subnavFor } from "@/lib/nav";
import { affiliateEnv, shopLinks, type AffiliateEnv } from "@/lib/shop-links";
import { limitPerGroup, limitRows, parseShowAll, shownNote } from "@/lib/list-limit";
import { mouseOptionGroups, parseSkateFilter, skateCountCaption, skateCounts, skateChipHref, skateFilterCount, skateGridSource, skateView, type SkateFilter } from "@/lib/skate-match";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { NumUnit } from "@/components/ui/num-unit";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink, buttonVariants } from "@/components/ui/button-link";
import { NativeSelect } from "@/components/ui/native-select";
import { SectionHeading } from "@/components/ui/section-heading";
import { FilterGroup, type FilterOption } from "@/components/gear/FilterGroup";
import { SkateRow } from "@/components/gear/SkateRow";
import { SkateGridLive } from "@/components/gear/SkateGridLive";
import { MyMousePreselect } from "@/components/gear/MyMousePreselect";
import { FilterDisclosure } from "@/components/gear/FilterDisclosure";
import { ShowAllLink } from "@/components/gear/ShowAllLink";

const TITLE = "マウスソール探し(自分のマウスに合うソール)";
const DESCRIPTION = "使っているマウスに合うマウスソール(マウスフィート)を、メーカー公式の素材・厚さ・入数で一覧します。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const MATERIALS = [["all", "すべて"], ["PTFE", "PTFE"], ["glass", "ガラス"], ["UPE", "UPE"], ["other", "その他"]] as const;
const SHAPES = [["all", "すべて"], ["full", "機種専用の形"], ["dot", "汎用のドット"]] as const;

function options<K extends "material" | "shape">(filter: SkateFilter, showAll: boolean, key: K, items: readonly (readonly [SkateFilter[K], string])[]): FilterOption[] {
  return items.map(([value, text]) => ({ key: String(value), text, href: skateChipHref(filter, { [key]: value } as Partial<SkateFilter>, showAll), current: filter[key] === value }));
}

function SkateList({ skates, env, primaryFirst }: { skates: SkateSpec[]; env: AffiliateEnv; primaryFirst: boolean }) {
  return (
    <ul className="grid">
      {skates.map((s, i) => <SkateRow key={s.id} skate={s} primary={primaryFirst && i === 0} links={shopLinks(`${s.brand} ${s.name}`, s.officialUrl, env)} />)}
    </ul>
  );
}

export default async function SkatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const mice = DEVICES.filter((d) => d.category === "mouse");
  const counts = skateCounts(SKATES);
  const filter = parseSkateFilter(sp, new Set(mice.map((m) => m.id)));
  const showAll = parseShowAll(sp);
  const view = skateView(SKATES, filter);
  const selected = filter.mouse === null ? undefined : mice.find((m) => m.id === filter.mouse);
  const fromMy = firstParam(sp, "from") === "my" && selected !== undefined;
  const env = affiliateEnv();
  const optionGroups = mouseOptionGroups(mice, counts);
  // 選ぶ欄を変えたら送る前にマスを描き直すための数(ソールのデータ本体はブラウザに入れない)
  const gridSource = skateGridSource(SKATES, filter);
  const shownCount = view.kind === "mouse" ? view.dedicated.length + view.universal.length : view.total;
  const clearHref = skateChipHref(filter, { material: "all", shape: "all" }, showAll);
  // 最初は人気の順の上位 12 行だけ描く(HTML を軽く。?all=1 で全件)。マウスを選んだら専用・汎用の段ごとに、多いときだけ切る。数の表示は全件のまま
  const showAllHref = skateChipHref(filter, {}, true);
  const dedicated = limitRows(view.kind === "mouse" ? view.dedicated : [], showAll);
  const universal = limitRows(view.kind === "mouse" ? view.universal : [], showAll);
  // マウスを選ばないときは、ブランドの段ごとに上位 2 件(ブランドの並びはそのまま。全体が 12 件以下なら全部)
  const allList = limitPerGroup(view.kind === "all" ? view.groups : [], showAll);
  const filterCount = skateFilterCount(filter);
  const filtered = filterCount > 0;
  // 上の数字の説明の「全 N 件」:マウスを選んでいればそのマウスに使える数(素材・形で絞る前)、選んでいなければ全件
  const unfiltered = skateView(SKATES, { ...filter, material: "all", shape: "all" });
  const baseCount = unfiltered.kind === "mouse" ? unfiltered.dedicated.length + unfiltered.universal.length : unfiltered.total;
  const filters = (
    <>
      <FilterGroup label="素材" options={options(filter, showAll, "material", MATERIALS)} />
      <FilterGroup label="形" options={options(filter, showAll, "shape", SHAPES)} />
      {filtered && <ButtonLink href={clearHref} scroll={false} variant="ghost" size="sm" className="justify-self-start px-0">絞り込みを外す</ButtonLink>}
    </>
  );

  return (
    <PageShell width="wide" title="マウスソール探し" description="使っているマウスを選ぶと、合うソールだけを公式の素材・厚さ・入数で並べます。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}
      actions={<p className="grid justify-items-start md:justify-items-end"><NumUnit value={shownCount} unit="件" className="text-rl-display-2" /><span className="text-sm text-rl-muted">{skateCountCaption(filter, baseCount)}</span></p>}>
      <div className="grid gap-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <div className="grid gap-6 lg:sticky lg:top-6">
            <Card as="section" aria-labelledby="skate-mouse" className="grid gap-4">
              <h2 id="skate-mouse" className="text-xl font-bold">マウスを選ぶ</h2>
              <form action="/skates" method="get" className="grid gap-3">
                <label htmlFor="skate-mouse-select" className="text-sm font-bold">使っているマウス</label>
                <NativeSelect key={filter.mouse ?? ""} id="skate-mouse-select" name="mouse" defaultValue={filter.mouse ?? ""}>
                  <option value="">選ばない(ブランド別にすべて)</option>
                  {optionGroups.map((g) => (
                    <optgroup key={g.brand} label={g.brand}>
                      {g.options.map((o) => <option key={o.id} value={o.id}>{o.text}</option>)}
                    </optgroup>
                  ))}
                </NativeSelect>
                {filter.material !== "all" && <input type="hidden" name="material" value={filter.material} />}
                {filter.shape !== "all" && <input type="hidden" name="shape" value={filter.shape} />}
                {showAll && <input type="hidden" name="all" value="1" />}
                <button type="submit" className={buttonVariants({ variant: selected ? "secondary" : "primary" })}>このマウスで絞り込む</button>
              </form>
              <SkateGridLive key={`${filter.mouse ?? ""}|${filter.material}|${filter.shape}`} selectId="skate-mouse-select" source={gridSource}
                mouseId={filter.mouse} mouseName={selected ? `${selected.brand} ${selected.name}` : null} />
              {fromMy && <p className="text-sm text-rl-muted">マイ設定のマウス({selected.brand} {selected.name})で絞り込みました。</p>}
              <MyMousePreselect />
            </Card>
            {/* lg 以上は左の列に開いたまま。lg 未満は一覧の上に畳む(/pads・/mouse と同じ) */}
            <Card as="section" aria-labelledby="skate-filters" className="hidden gap-4 lg:grid">
              <h2 id="skate-filters" className="text-xl font-bold">絞り込み</h2>
              {filters}
            </Card>
          </div>

          <div className="grid gap-6">
            <FilterDisclosure count={filterCount}>{filters}</FilterDisclosure>
            {shownCount > 0 && <p className="flex flex-wrap items-center gap-2 text-sm text-rl-muted"><Badge variant="pr">PR</Badge>このリンクから買うと、ロビラボに紹介料が入ることがあります</p>}
            {view.kind === "mouse" ? (
              <>
                <section aria-labelledby="skates-dedicated" className="grid gap-4">
                  <SectionHeading id="skates-dedicated" title={`${selected?.brand ?? ""} ${selected?.name ?? ""} 専用`} count={view.dedicated.length}
                    description={dedicated.cut ? shownNote(dedicated.shown.length) : undefined} />
                  {view.dedicated.length === 0 ? (
                    <EmptyState icon={SearchX} title={filtered ? "条件に合う専用のソールがありません" : "このマウス専用のソールはまだ載っていません"}
                      description={filtered ? "絞り込みを外すと見つかることがあります。" : "下の汎用のドットなら、どのマウスにも貼れます。"}
                      action={filtered ? <ButtonLink href={clearHref} scroll={false} variant="secondary">絞り込みを外す</ButtonLink> : undefined} />
                  ) : (
                    <SkateList skates={dedicated.shown} env={env} primaryFirst />
                  )}
                  {dedicated.cut && <ShowAllLink href={showAllHref} total={dedicated.total} />}
                </section>
                <section aria-labelledby="skates-universal" className="grid gap-4">
                  <SectionHeading id="skates-universal" title="どのマウスにも使える汎用のドット" count={view.universal.length}
                    description={universal.cut ? shownNote(universal.shown.length) : undefined} />
                  {view.universal.length === 0
                    ? <p className="text-sm text-rl-muted">この絞り込みでは、汎用のドットはありません。</p>
                    : <SkateList skates={universal.shown} env={env} primaryFirst={view.dedicated.length === 0} />}
                  {universal.cut && <ShowAllLink href={showAllHref} total={universal.total} />}
                </section>
              </>
            ) : view.total === 0 ? (
              <EmptyState icon={SearchX} title="条件に合うソールがありません" description="絞り込みを 1 つ外すと見つかりやすくなります。"
                action={<ButtonLink href={clearHref} scroll={false} variant="secondary">絞り込みを外す</ButtonLink>} />
            ) : (
              <>
                <div className="grid gap-1">
                  <p className="text-base">マウスを選ぶと、合うソールだけに絞り込めます。</p>
                  {allList.cut && <p className="text-sm text-rl-muted">ブランドごとに上位 2 件を表示中(全 {allList.total} 件)</p>}
                </div>
                {allList.groups.map((g, i) => (
                  <section key={g.brand} aria-labelledby={`skates-brand-${i}`} className="grid gap-4">
                    <SectionHeading id={`skates-brand-${i}`} title={g.brand} count={g.total}
                      description={g.items.length < g.total ? shownNote(g.items.length) : undefined} />
                    <SkateList skates={g.items} env={env} primaryFirst={false} />
                  </section>
                ))}
                {allList.cut && <ShowAllLink href={showAllHref} total={allList.total} />}
              </>
            )}
          </div>
        </div>
        <div className="grid gap-2 text-xs text-rl-muted">
          <p>素材・厚さ・入数は、各メーカー公式サイトの表記です(確認日は製品ごと)。厚さは公式に 1 つの数字があるときだけ mm で出し、幅のある表記は公式の文をそのまま載せています。公式に書いていないものは「公式の記載なし」です。</p>
          <p>「専用」は、メーカー公式の対応の表記からマウスに結び付けたものです。名前が同じか確かめられないものは結び付けず、「選ばない」の一覧にだけ出しています。</p>
          <p>価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。</p>
        </div>
      </div>
    </PageShell>
  );
}

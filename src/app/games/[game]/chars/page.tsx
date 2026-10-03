import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fitTypes } from "@/lib/char-match";
import { dexChars, dexSections, latestCheckedAt, publishedGame, publishedGames } from "@/lib/char-dex";
import { breadcrumbJsonLd, listCrumbs, listLead, listMeta } from "@/lib/char-seo";
import { getSiteUrl } from "@/lib/site-url";
import { SubNav } from "@/components/brand/SubNav";
import { CharListBody } from "@/components/chars/CharListBody";
import { JsonLd } from "@/components/chars/JsonLd";
import { PageShell } from "@/components/ui/page-shell";

type Props = { params: Promise<{ game: string }> };

/** 公開しているゲームだけを build で作り、ほかの値は 404(searchParams は読まない) */
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedGames().map((g) => ({ game: g.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { game: id } = await params;
  const found = publishedGame(id);
  if (!found) return {};
  const m = listMeta(found.game, found.setting, dexChars(id).length);
  return { title: m.title, description: m.description, alternates: { canonical: `/games/${id}/chars` }, openGraph: { title: m.title, description: m.description } };
}

/** そのゲームの代表キャラの一覧(設計書 6-2) */
export default async function CharListPage({ params }: Props) {
  const { game: id } = await params;
  const found = publishedGame(id);
  if (!found) notFound();
  const { game, setting } = found;
  const list = dexChars(game.id);
  const fits = Object.fromEntries(list.map((c) => [c.id, setting.matching && c.matchable ? fitTypes(c)[0] : null]));
  const games = publishedGames();
  return (
    <PageShell width="wide" title={`${game.name}${setting.nameMark} のキャラ図鑑`} description={listLead(setting, list.length)}
      back={{ href: "/games", label: "キャラ図鑑" }}
      subnav={games.length > 1 ? <SubNav label="ゲームの切り替え" items={games.map((g) => ({ href: `/games/${g.id}/chars`, label: g.shortName }))} /> : undefined}>
      <CharListBody game={game} setting={setting} sections={dexSections(game, setting)} fits={fits} checkedAt={latestCheckedAt(list)} />
      <JsonLd json={breadcrumbJsonLd(listCrumbs(game), getSiteUrl())} />
    </PageShell>
  );
}

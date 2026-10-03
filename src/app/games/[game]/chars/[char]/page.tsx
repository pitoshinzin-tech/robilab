import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { charAxisRows, fitTypes, roleOf } from "@/lib/char-match";
import { charHref, charSources, dexParams, findDexChar, sameRoleChars } from "@/lib/char-dex";
import { breadcrumbJsonLd, charCrumbs, charMeta } from "@/lib/char-seo";
import { getSiteUrl } from "@/lib/site-url";
import { CharProfile } from "@/components/chars/CharProfile";
import { JsonLd } from "@/components/chars/JsonLd";
import { PageShell } from "@/components/ui/page-shell";

type Props = { params: Promise<{ game: string; char: string }> };

/** 公開しているゲームの代表だけを build で作り、ほかの値(予備・大文字・知らない id)は 404 */
export const dynamicParams = false;

export function generateStaticParams() {
  return dexParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { game, char } = await params;
  const found = findDexChar(game, char);
  if (!found) return {};
  const matched = found.setting.matching && found.char.matchable;
  const m = charMeta(found.char, found.game, roleOf(found.char), found.setting, matched ? fitTypes(found.char) : []);
  return { title: m.title, description: m.description, alternates: { canonical: charHref(found.char) }, openGraph: { title: m.title, description: m.description } };
}

/** 1 体のページ(設計書 2-3・6-3)。見出しは名前(公式の日本語表記)と英語表記、説明はロビラボの言葉の要約 */
export default async function CharPage({ params }: Props) {
  const { game: gameId, char: charId } = await params;
  const found = findDexChar(gameId, charId);
  if (!found) notFound();
  const { game, setting, char } = found;
  const matched = setting.matching && char.matchable;
  return (
    <PageShell width="wide" back={{ href: `/games/${game.id}/chars`, label: `${game.name} のキャラ図鑑` }}
      title={<>{char.nameJa}<span lang="en" data-long-name className="mt-1 block text-base font-normal text-rl-muted wrap-anywhere">{char.nameEn}</span></>}
      description={char.summary}>
      <CharProfile char={char} game={game} role={roleOf(char)} setting={setting}
        axisRows={matched ? charAxisRows(char) : null}
        fits={matched ? fitTypes(char) : []}
        sameRole={matched ? sameRoleChars(char).map((c) => ({ href: charHref(c), name: c.nameJa })) : []}
        sources={charSources(char, setting)} />
      <JsonLd json={breadcrumbJsonLd(charCrumbs(char, game, setting), getSiteUrl())} />
    </PageShell>
  );
}

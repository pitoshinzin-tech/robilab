import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ALL_TYPE_CODES, getType } from "@/data/types";
import { normalizeTypeCode } from "@/lib/type-code";
import { parseAxesParam } from "@/lib/axes-param";
import { rankGames } from "@/lib/role-match";
import { buildShareText, buildXShareUrl } from "@/lib/share";
import { getSiteUrl } from "@/lib/site-url";
import { GlitchTitle } from "@/components/brand/GlitchTitle";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { AxisBars } from "@/components/result/AxisBars";
import { GameRanking } from "@/components/result/GameRanking";
import { AffiliateList } from "@/components/affiliate/AffiliateList";
import { ShareButton } from "./ShareButton";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ axes?: string }> };

export function generateStaticParams() {
  return ALL_TYPE_CODES.map((code) => ({ code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const type = getType(code);
  if (!type) return {};
  return { title: `【${type.code}】${type.name}`, description: type.catchcopy };
}

export default async function TypePage({ params, searchParams }: Props) {
  const { code: raw } = await params;
  const normalized = normalizeTypeCode(raw);
  if (!normalized) notFound();
  if (normalized !== raw) {
    const { axes: rawAxes } = await searchParams;
    const query = rawAxes ? `?axes=${encodeURIComponent(rawAxes)}` : "";
    redirect(`/type/${normalized}${query}`);
  }
  const type = getType(normalized)!;
  const { axes: axesParam } = await searchParams;
  const axes = parseAxesParam(axesParam, type.code);
  const ranks = rankGames(axes);
  const site = getSiteUrl();
  const shareUrl = buildXShareUrl(
    buildShareText(type, { name: ranks[0].game.name, role: ranks[0].best.role.name }),
    `${site}/type/${type.code}`,
  );
  const best = getType(type.bestMatch)!;
  const second = getType(type.secondMatch)!;

  return (
    <main className="mx-auto grid max-w-md gap-8 px-4 py-6">
      <section className="grid justify-items-center gap-3 text-center">
        <TypeIcon code={type.code} size={160} labelled glow />
        <p className="font-display text-3xl tracking-[.15em] text-[var(--rl-magenta)]">{type.code}</p>
        <GlitchTitle className="text-2xl">{type.name}</GlitchTitle>
        <p className="text-[var(--rl-cyan)]">「{type.catchcopy}」</p>
        <ShareButton href={shareUrl} />
        <Link href="/my" className="inline-block rounded-full border border-[var(--rl-border)] px-6 py-3 font-bold">マイ設定に登録しよう</Link>
      </section>
      <section><AxisBars axes={axes} /></section>
      <section><p className="leading-relaxed">{type.description}</p></section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div><h2 className="mb-2 font-bold">強み</h2><ul className="list-disc pl-5 text-sm">{type.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div><h2 className="mb-2 font-bold">伸びしろ</h2><ul className="list-disc pl-5 text-sm">{type.growth.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">おすすめゲームと合うロール</h2>
        <GameRanking ranks={ranks} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">相性のいいタイプ</h2>
        <div className="grid gap-2 text-sm">
          <Link href={`/type/${best.code}`}>ベスト:<b>{best.code} {best.name}</b></Link>
          <Link href={`/type/${second.code}`}>次点:<b>{second.code} {second.name}</b></Link>
        </div>
        <Link href="/lobby" className="mt-4 inline-block rounded-full border border-[var(--rl-cyan)] px-5 py-2 text-sm">このタイプで仲間を探す →</Link>
      </section>
      <AffiliateList typeCode={type.code} />
      <section className="text-center text-sm"><Link href="/diagnosis" className="text-[var(--rl-muted)] underline">もう一度診断する</Link></section>
    </main>
  );
}

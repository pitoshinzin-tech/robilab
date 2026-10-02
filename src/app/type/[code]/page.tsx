import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, FlaskConical, Share2, Users } from "lucide-react";
import { ALL_TYPE_CODES, getType } from "@/data/types";
import { normalizeTypeCode } from "@/lib/type-code";
import { parseAxesParam } from "@/lib/axes-param";
import { rankGames } from "@/lib/role-match";
import { buildShareText, buildXShareUrl } from "@/lib/share";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { GlitchTitle } from "@/components/brand/GlitchTitle";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { AxisBars } from "@/components/result/AxisBars";
import { GameRanking } from "@/components/result/GameRanking";
import { SpriteReading } from "@/components/result/SpriteReading";
import { AffiliateList } from "@/components/affiliate/AffiliateList";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { pageContainerClass } from "@/components/ui/page-shell";

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

/** 動きの参考 074:説明の要の 1 文(最初の文)と、その残り。「。」がなければ全部が要の文 */
function splitKeySentence(text: string): [string, string] {
  const cut = text.indexOf("。") + 1;
  return cut > 0 ? [text.slice(0, cut), text.slice(cut)] : [text, ""];
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
  const fromDiagnosis = Boolean(axesParam);
  const ranks = rankGames(axes);
  const site = getSiteUrl();
  const shareUrl = buildXShareUrl(
    buildShareText(type, { name: ranks[0].game.name, role: ranks[0].best.role.name }),
    `${site}/type/${type.code}`,
  );
  const best = getType(type.bestMatch)!;
  const second = getType(type.secondMatch)!;
  const matches = [{ label: "ベスト", t: best }, { label: "次点", t: second }];
  const [keySentence, rest] = splitKeySentence(type.description);

  return (
    <main className={cn(pageContainerClass("wide"), "grid gap-12")}>
      <section className="grid items-center gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SpriteReading code={type.code} icon={<TypeIcon code={type.code} size={240} labelled glow animate={fromDiagnosis} className="size-40 lg:size-60" />} />
        </div>
        <div className="grid justify-items-center gap-3 text-center lg:col-span-7 lg:justify-items-start lg:text-left">
          {/* 動きの参考 082:コードだけ、開いたとき 1 回マスクの中からせり上がる(1 画面 1 か所) */}
          <p className="font-display text-rl-display-1 font-black tracking-[0.04em] text-rl-highlight"><span className="rl-mask-rise">{type.code}</span></p>
          <GlitchTitle className="text-[40px] leading-[1.2]">{type.name}</GlitchTitle>
          <p className="text-xl">「{type.catchcopy}」</p>
          {!fromDiagnosis && <ButtonLink href="/diagnosis" variant="secondary"><FlaskConical aria-hidden />自分も診断する</ButtonLink>}
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[640px] gap-12">
        {/* key:同じタイプで軸だけ違う結果へ移ったときも、マスの埋まりと % の数え上げを 1 回やり直す */}
        <section aria-label="4 つの軸"><AxisBars key={`${type.code}:${axesParam ?? ""}`} axes={axes} /></section>
        <section aria-label="説明">
          <p className="text-base leading-[1.8]"><span className="rl-marker-text">{keySentence}</span>{rest}</p>
        </section>

        <section aria-label="シェアと次の行動" className="grid gap-3">
          {/* 追補 6 章:何がシェアされるかを先に見せる */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 動的な OG 画像をそのまま小さく見せる */}
          <img src={`/type/${type.code}/opengraph-image`} alt="シェアされる画像のプレビュー" width={1200} height={630} loading="lazy" className="h-auto w-full max-w-80 rounded-rl-sm border border-rl-line" />
          <div className="flex flex-wrap gap-3">
            <ButtonAnchor href={shareUrl} target="_blank" rel="noopener" variant={fromDiagnosis ? "primary" : "secondary"}><Share2 aria-hidden />結果を X でシェア</ButtonAnchor>
            <ButtonLink href="/my" variant="secondary">マイ設定に登録</ButtonLink>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="grid content-start gap-3"><SectionHeading title="強み" /><ul className="list-disc pl-5 text-base">{type.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <div className="grid content-start gap-3"><SectionHeading title="伸びしろ" /><ul className="list-disc pl-5 text-base">{type.growth.map((s) => <li key={s}>{s}</li>)}</ul></div>
        </section>

        <section className="grid gap-4">
          <SectionHeading title="おすすめゲームと合うロール" />
          <GameRanking ranks={ranks} />
        </section>

        <section className="grid gap-4">
          <SectionHeading title="相性のいいタイプ" />
          {/* 追補 5-3:カードにせず、幅いっぱいの行 */}
          <ul className="border-t border-rl-line">
            {matches.map(({ label, t }) => (
              <li key={label} className="border-b border-rl-line">
                <Link href={`/type/${t.code}`} className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-4">
                  <TypeIcon code={t.code} size={48} />
                  <span className="grid min-w-0">
                    <span className="text-sm text-rl-muted">{label}・<span className="font-display">{t.code}</span></span>
                    <span className="text-[32px] font-bold leading-[1.3] wrap-anywhere">{t.name}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/lobby" variant="secondary" className="justify-self-start"><Users aria-hidden />このタイプで仲間を探す</ButtonLink>
        </section>

        <AffiliateList typeCode={type.code} />
        <ButtonLink href="/diagnosis" variant="ghost" className="justify-self-center">もう一度診断する</ButtonLink>
      </div>
    </main>
  );
}

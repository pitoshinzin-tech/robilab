import type { Metadata } from "next";
import { ViewTransition } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, FlaskConical, Share2, Users } from "lucide-react";
import { ALL_TYPE_CODES, getType } from "@/data/types";
import { normalizeTypeCode } from "@/lib/type-code";
import { isDiagnosisAxesParam, parseAxesParam } from "@/lib/axes-param";
import { rankGames } from "@/lib/role-match";
import { buildShareText, buildXShareUrl } from "@/lib/share";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { MORPH_PIXEL, NAV_FORWARD, PAGE_VT_CLASSES, TYPE_ROW, VT_TYPE_SPRITE, typeVtName } from "@/lib/motion/vt-names";
import { GlitchTitle } from "@/components/brand/GlitchTitle";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { AxisBars } from "@/components/result/AxisBars";
import { GameRanking } from "@/components/result/GameRanking";
import { SpriteReading } from "@/components/result/SpriteReading";
import { ResultTypeIcon } from "@/components/result/ResultTypeIcon";
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
  // 読める ?axes= のときだけ「診断から来た」。壊れた値は直接開いたのと同じ(タイプの既定の軸・% なし・「診断する」)
  const fromDiagnosis = isDiagnosisAxesParam(axesParam, type.code);
  const axes = parseAxesParam(fromDiagnosis ? axesParam : undefined, type.code);
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
  // 追補 S2:直接開いたときは組み上がり、診断から来たときは診断のマスの画面がこの絵へ移る(type-sprite)
  const bigIcon = (
    <ResultTypeIcon>
      <TypeIcon code={type.code} size={240} labelled glow className="size-40 lg:size-60" />
    </ResultTypeIcon>
  );

  return (
    // 追補 S3:PageShell と同じ enter / exit(深く入る・戻る・型なし・診断から)。このページは PageShell を使わないので、ここで包む。
    // 大きな絵と相性の行の絵は内側の名前付きの ViewTransition が別に移る(名前は 1 ページで重ならない)
    <ViewTransition enter={PAGE_VT_CLASSES} exit={PAGE_VT_CLASSES} default="none">
    <main className={cn(pageContainerClass("wide"), "grid gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0")}>
      {/* 左の 5 列:絵と読み方。PC はスクロールしても横に残る(読んでいる間も自分の絵が見える) */}
      <div className="lg:col-span-5 lg:row-span-2">
        <div className="lg:sticky lg:top-8">
          {/* 大きな絵は、診断から来たときは type-sprite(診断のマスの画面から)、それ以外は type-CODE(名簿・相性の行から移る) */}
          <SpriteReading code={type.code} icon={<ViewTransition name={fromDiagnosis ? VT_TYPE_SPRITE : typeVtName(type.code)} share={MORPH_PIXEL} default="none">{bigIcon}</ViewTransition>} />
        </div>
      </div>

      {/* 右の 7 列:コード・名前・キャッチコピー。下の本文も同じ 7 列にそろえる(左の端が 1 本になる) */}
      <section className="grid justify-items-center gap-4 text-center lg:col-span-7 lg:col-start-6 lg:justify-items-start lg:pt-6 lg:text-left">
        {/* 動きの参考 082:コードは診断から来たときだけ 1 回マスクの中からせり上がる(S2 の芯。直接開いたときは止まった形) */}
        <p className="font-display text-rl-display-1 font-black lg:text-rl-display-2 tracking-[0.04em] text-rl-highlight">
          <span className={fromDiagnosis ? "rl-mask-rise" : undefined}>{type.code}</span>
        </p>
        <GlitchTitle className="text-rl-title text-balance [word-break:auto-phrase] lg:text-rl-heading">{type.name}</GlitchTitle>
        <p className="text-xl text-balance [word-break:auto-phrase]">「{type.catchcopy}」</p>
        {!fromDiagnosis && <ButtonLink href="/diagnosis" variant="primary"><FlaskConical aria-hidden />自分も診断する</ButtonLink>}
      </section>

      <div className="mt-rl-ma-sm grid min-w-0 gap-rl-ma-sm lg:col-span-7 lg:col-start-6 lg:mt-rl-ma-md">
        {/* key:同じタイプで軸だけ違う結果へ移ったときも、マスの埋まりを 1 回やり直す */}
        <section aria-label="4 つの軸"><AxisBars key={`${type.code}:${fromDiagnosis ? axesParam : ""}`} axes={axes} fromDiagnosis={fromDiagnosis} /></section>
        <section aria-label="説明">
          {/* 要の 1 文に止まった下線(文字組み。動かさない) */}
          <p className="text-base leading-[1.8]"><span className="rl-marker-text">{keySentence}</span>{rest}</p>
        </section>

        <section aria-label="シェアと次の行動" className="grid gap-4">
          {/* 追補 6 章:何がシェアされるかを先に見せる */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 動的な OG 画像をそのまま小さく見せる */}
          <img src={`/type/${type.code}/opengraph-image`} alt="シェアされる画像のプレビュー" width={1200} height={630} loading="lazy" className="h-auto w-full max-w-80 rounded-rl-sm border border-rl-line" />
          <div className="flex flex-wrap gap-3">
            <ButtonAnchor href={shareUrl} target="_blank" rel="noopener" variant={fromDiagnosis ? "primary" : "secondary"}><Share2 aria-hidden />結果を X でシェア</ButtonAnchor>
            <ButtonLink href="/my" variant="secondary">マイ設定に登録</ButtonLink>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="grid content-start gap-4"><SectionHeading title="強み" /><ul className="list-disc pl-5 text-base [word-break:auto-phrase] text-pretty">{type.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <div className="grid content-start gap-4"><SectionHeading title="伸びしろ" /><ul className="list-disc pl-5 text-base [word-break:auto-phrase] text-pretty">{type.growth.map((s) => <li key={s}>{s}</li>)}</ul></div>
        </section>

        <section className="grid gap-4">
          <SectionHeading title="おすすめゲームと合うロール" />
          <GameRanking ranks={ranks} showScore={fromDiagnosis} />
        </section>

        <section className="grid gap-4">
          <SectionHeading title="相性のいいタイプ" />
          {/* 追補 5-3:カードにせず、幅いっぱいの行。名前は見出しが「タイプ」なので「タイプ」を外す(名簿と同じ。読み上げは正式な名前) */}
          <ul className="border-t border-rl-line">
            {matches.map(({ label, t }) => (
              <li key={label} className="border-b border-rl-line">
                {/* 行の絵は、行から次の結果へ移るとき(type-row)だけ次の結果の大きな絵と対になる(名簿から来たときに行の絵まで飛んでこない) */}
                <Link href={`/type/${t.code}`} transitionTypes={[NAV_FORWARD, TYPE_ROW]} className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-4">
                  <ViewTransition name={typeVtName(t.code)} share={{ [TYPE_ROW]: MORPH_PIXEL, default: "none" }} default="none">
                    <TypeIcon code={t.code} size={48} />
                  </ViewTransition>
                  <span className="grid min-w-0">
                    <span className="text-sm text-rl-muted">{label}・<span className="font-display">{t.code}</span></span>
                    <span aria-hidden className="text-2xl font-bold text-balance [word-break:auto-phrase] wrap-anywhere md:text-rl-title">{t.name.replace(/タイプ$/, "")}</span>
                    <span className="sr-only">{t.name}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/lobby" variant="secondary" className="justify-self-start"><Users aria-hidden />このタイプで仲間を探す</ButtonLink>
        </section>

        <AffiliateList typeCode={type.code} />
        <ButtonLink href="/diagnosis" variant="ghost" className="justify-self-start">{fromDiagnosis ? "もう一度診断する" : "診断する"}</ButtonLink>
      </div>
    </main>
    </ViewTransition>
  );
}

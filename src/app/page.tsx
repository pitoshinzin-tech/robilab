import Link from "next/link";
import { ChevronRight, FlaskConical, Mouse, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { TYPES } from "@/data/types";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { loadRanking } from "@/lib/aim/ranking";
import { FLASK_16, PARTY_16, RULER_16 } from "@/lib/pixel-art";
import { KanjiStrokes } from "@/components/brand/KanjiStrokes";
import { TodayLabel } from "@/components/brand/TodayLabel";
import { PixelStair } from "@/components/brand/PixelStair";
import { PixelArt } from "@/components/brand/PixelArt";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { ButtonLink } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { NumUnit } from "@/components/ui/num-unit";
import { SectionHeading } from "@/components/ui/section-heading";

// 今日の文字と 1 位は日付で変わるので、60 秒ごとに作り直す
export const revalidate = 60;

/** 中身の幅(1120px + 左右の余白)。名簿の帯だけ幅いっぱいにするので、main ではなくセクションごとに付ける */
const inner = "mx-auto w-full max-w-[1168px] px-4 md:px-6";
const MOUSE_LINKS = [["/mouse", "マウス探し"], ["/tools/sensitivity", "感度計算"]] as const;
const yesterdayOf = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

export default async function Home() {
  const date = jstDate(new Date());
  const char = aimCharForDate(date);
  const yesterday = aimCharForDate(yesterdayOf(date));
  const top = (await loadRanking(date))[0] ?? null;

  return (
    <main className="pb-12 md:pb-16">
      {/* 1. ヒーロー:箱にしない。地に点の格子とノイズ。12 列のうち 7 列に漢字と縦組み、5 列に文と行動 */}
      <section aria-labelledby="today-heading" className="rl-hero-ground">
        <div className={cn(inner, "grid gap-8 pt-8 pb-8 lg:grid-cols-12 lg:items-center lg:gap-6 lg:pt-16")}>
          <div className="flex items-start justify-center gap-4 lg:col-span-7 lg:justify-start">
            <KanjiStrokes strokes={char.strokes} className="size-(--rl-text-hero)" />
            <TodayLabel as="h2" id="today-heading" glyph={char.glyph} date={date} strokes={char.strokes.length} />
          </div>
          <div className="grid content-center gap-4 lg:col-span-5">
            <p className="text-xl font-bold">書き順どおりになぞるエイム練習</p>
            {top && (
              <p className="grid gap-1">
                <span className="text-sm text-rl-muted">今日の 1 位</span>
                <NumUnit value={top.score.toLocaleString("ja-JP")} unit="点" className="text-rl-display-1" />
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/aim" prefetch variant="primary" size="lg" className="hidden pointer-fine:inline-flex">今日の文字に挑戦</ButtonLink>
              <ButtonLink href="/aim#ranking" variant="secondary" className="pointer-fine:hidden">ランキングを見る</ButtonLink>
              <span className="pointer-fine:hidden"><CopyButton path="/aim" label="PC で遊ぶリンクをコピー" /></span>
            </div>
          </div>
        </div>
      </section>
      {/* ヒーローの点の格子を、階段の形で終わらせる(ヒーローの地の外に置く) */}
      <PixelStair />

      {/* 2. h1 = ロゴの組み(カタカナ 900 + ROBILAB)と 1 行の説明。このあとが「間・大」 */}
      <section className={cn(inner, "grid gap-2 pt-8")}>
        <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="rl-glitch text-rl-display-1 font-black">{BRAND.name}</span>
          <span className="font-display text-xl font-semibold tracking-[0.08em] text-rl-muted">{BRAND.nameEn}</span>
        </h1>
        <p className="max-w-[38em] text-base text-rl-muted">{BRAND.lead}</p>
      </section>

      {/* 3. 入口 = 幅いっぱいの 3 行(カードにしない)。スマホは主ボタンがないので、診断の行だけ主ボタンの見た目の札を持つ */}
      <section aria-label="入口" className={cn(inner, "mt-rl-ma-lg")}>
        <ul className="border-t border-rl-line">
          <li className="border-b border-rl-line">
            <Link href="/diagnosis" className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-6 md:gap-6 md:py-8">
              <PixelArt grid={FLASK_16} size={48} />
              <div className="grid min-w-0 gap-1">
                <h2 className="flex items-center gap-2 text-[32px] font-bold leading-[1.3]">自分を知る<FlaskConical aria-hidden className="size-5 text-rl-muted" /></h2>
                <span className="text-base text-rl-muted">1 分半のゲーマータイプ診断</span>
                <span className="mt-2 inline-flex h-11 items-center justify-self-start rounded-rl-pill bg-rl-accent px-4 text-sm font-bold text-rl-on-accent pointer-fine:hidden">1 分半で診断する</span>
              </div>
              <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
            </Link>
          </li>
          <li className="border-b border-rl-line">
            <div className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-4 py-6 md:gap-6 md:py-8">
              <PixelArt grid={RULER_16} size={48} />
              <div className="grid min-w-0 gap-1">
                <h2 className="flex items-center gap-2 text-[32px] font-bold leading-[1.3]">感度・マウス<Mouse aria-hidden className="size-5 text-rl-muted" /></h2>
                <p className="text-base text-rl-muted">手に合うマウスと、ゲーム間の感度の換算</p>
                <ul className="mt-2 flex flex-wrap gap-x-6">
                  {MOUSE_LINKS.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="rl-lock inline-flex h-11 items-center gap-1 text-base font-bold hover:underline">
                        {label}<ChevronRight aria-hidden className="size-5 text-rl-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
          <li className="border-b border-rl-line">
            <Link href="/lobby" className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-6 md:gap-6 md:py-8">
              <PixelArt grid={PARTY_16} size={48} />
              <div className="grid min-w-0 gap-1">
                <h2 className="flex items-center gap-2 text-[32px] font-bold leading-[1.3]">仲間を探す<Users aria-hidden className="size-5 text-rl-muted" /></h2>
                <span className="text-base text-rl-muted">一緒に遊ぶ人を見つける。18 歳以上が対象です</span>
              </div>
              <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
            </Link>
          </li>
        </ul>
      </section>

      {/* 4. 16 タイプの名簿 = ページの幅を 1 回だけ破る帯(Task 7B で入場の動きとホバーの軸の文を足す) */}
      <section aria-labelledby="types-heading" className="rl-dot-grid mt-rl-ma-md bg-rl-surface py-12">
        <div className={cn(inner, "grid gap-6")}>
          <SectionHeading id="types-heading" title="16 のゲーマータイプ" action={<ButtonLink href="/types" variant="ghost" size="sm">タイプ一覧へ</ButtonLink>} />
          <ul className="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-8">
            {TYPES.map((t) => (
              <li key={t.code}>
                <Link href={`/type/${t.code}`} className="rl-lock grid min-h-11 place-items-center gap-1 p-2">
                  <TypeIcon code={t.code} size={48} />
                  <span className="font-display text-sm text-rl-highlight">{t.code}</span>
                  <span className="sr-only">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. 記録(データがない行は出さない) */}
      <section aria-labelledby="records-heading" className={cn(inner, "mt-rl-ma-md grid gap-4")}>
        <SectionHeading id="records-heading" title="記録" />
        <dl className="border-t border-rl-line">
          {top && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rl-line py-4">
              <dt className="text-base">今日の 1 位</dt>
              <dd className="flex min-w-0 items-baseline gap-3">
                <span data-long-name className="min-w-0 truncate text-base">{top.name}</span>
                <NumUnit value={top.score.toLocaleString("ja-JP")} unit="点" className="text-2xl" />
              </dd>
            </div>
          )}
          {yesterday.id !== char.id && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rl-line py-4">
              <dt className="text-base">きのうの文字</dt>
              <dd className="flex items-baseline gap-2"><span className="text-2xl font-bold">{yesterday.glyph}</span><span className="text-sm text-rl-muted">{yesterday.strokes.length} 画</span></dd>
            </div>
          )}
        </dl>
      </section>
    </main>
  );
}

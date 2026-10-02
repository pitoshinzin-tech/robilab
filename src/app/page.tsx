import Link from "next/link";
import { ChevronRight, FlaskConical, Mouse, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { TYPES } from "@/data/types";
import { BRAND } from "@/lib/brand";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { loadRanking } from "@/lib/aim/ranking";
import { parsePath, toStroke } from "@/lib/aim/path";
import { strokeSchedule } from "@/lib/motion/stroke-schedule";
import { axisLegend } from "@/lib/type-axes";
import { FLASK_16, PARTY_16, RULER_16 } from "@/lib/pixel-art";
import { HeroKanji } from "@/components/brand/HeroKanji";
import { TodayLabel } from "@/components/brand/TodayLabel";
import { PixelStair } from "@/components/brand/PixelStair";
import { PixelArt } from "@/components/brand/PixelArt";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { TypeRoster } from "@/components/brand/TypeRoster";
import { ButtonLink } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { NumUnit } from "@/components/ui/num-unit";
import { SectionHeading } from "@/components/ui/section-heading";

// 今日の文字と 1 位は日付で変わるので、60 秒ごとに作り直す
export const revalidate = 60;

/** 中身の幅(1120px + 左右の余白)。名簿の帯だけ幅いっぱいにするので、main ではなくセクションごとに付ける */
const inner = "mx-auto w-full max-w-[1168px] px-4 md:px-6";
const MOUSE_LINKS = [["/mouse", "マウス探し"], ["/tools/sensitivity", "感度計算"]] as const;
/** ヒーローの「今日の挑戦の札」の遊び方(点数の式は src/lib/aim/trace.ts の computeScore:ずれの少なさ × 速さ) */
const HOW_TO_PLAY = ["1 画ずつ、書き順どおりになぞる", "ずれの少なさと速さで点数が付く", "日本時間の 0 時に次の文字へ"] as const;
const yesterdayOf = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

export default async function Home() {
  const date = jstDate(new Date());
  const char = aimCharForDate(date);
  const yesterday = aimCharForDate(yesterdayOf(date));
  const top = (await loadRanking(date))[0] ?? null;
  // 追補 S1:線の長さに比例した時間割(合計 1,400ms 以内)。長さはサーバーで計算するので、ブラウザでは測らない
  const schedule = strokeSchedule(char.strokes.map((d) => toStroke(parsePath(d)).length));
  // 記録はデータがある行だけ。1 行もない日は段ごと出さない(見出しと線だけの空の段を作らない)
  const showYesterday = yesterday.id !== char.id;
  const hasRecords = top !== null || showYesterday;

  return (
    <main className={hasRecords ? "pb-12 md:pb-16" : undefined}>
      {/* 1. ヒーロー:箱にしない。地に点の格子とノイズ。PC は最初の画面をヒーローで埋める(ヘッダー 64px と階段 24px を引いた高さ。
          大きな画面で間延びしないよう 760px まで)。12 列のうち 7 列に漢字(PC は画面の高さで最大 440px)と縦組み、
          5 列に「今日の挑戦の札」。札は漢字の下の端にそろえて、真ん中の 1 本の帯ではなく斜めの流れにする */}
      <section aria-labelledby="today-heading" className="rl-hero-ground">
        <div className={cn(inner, "grid gap-8 pt-8 pb-8 lg:min-h-[min(calc(100svh-88px),760px)] lg:grid-cols-12 lg:content-center lg:items-center lg:gap-6 lg:pt-16")}>
          <div className="flex items-start justify-center gap-4 lg:col-span-7 lg:justify-end lg:pr-16">
            <HeroKanji strokes={char.strokes} schedule={schedule} />
            <TodayLabel id="today-heading" glyph={char.glyph} date={date} strokes={char.strokes.length} />
          </div>
          <div className="grid content-center gap-6 lg:col-span-5 lg:self-end lg:pb-12">
            <div className="grid gap-4">
              <p className="text-xl font-bold">書き順どおりになぞるエイム練習</p>
              <ul className="grid gap-2">
                {HOW_TO_PLAY.map((line) => (
                  <li key={line} className="flex items-center gap-3 text-base">
                    <span aria-hidden className="size-2 shrink-0 bg-rl-secondary" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            {top ? (
              <p className="grid gap-1">
                <span className="text-sm text-rl-muted">今日の 1 位</span>
                <NumUnit value={top.score.toLocaleString("ja-JP")} unit="点" className="text-rl-display-1" />
              </p>
            ) : (
              <p className="text-sm text-rl-muted [word-break:auto-phrase] text-balance">今日の 1 位はまだいません。最初の記録がランキングの 1 位になります</p>
            )}
            {/* PC は主ボタン 1 つ。スマホは押す形のボタンを漢字の下の「1 画なぞってみる」1 つにし、ここは文字のリンク 2 つだけ */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <ButtonLink href="/aim" prefetch variant="primary" size="lg" className="hidden pointer-fine:inline-flex">今日の文字に挑戦</ButtonLink>
              <ButtonLink href="/aim#ranking" variant="ghost" size="sm" className="px-0 pointer-fine:hidden">ランキングを見る<ChevronRight aria-hidden /></ButtonLink>
              <span className="pointer-fine:hidden"><CopyButton path="/aim" label="PC で遊ぶリンクをコピー" variant="ghost" size="sm" className="px-0" /></span>
            </div>
          </div>
        </div>
      </section>
      {/* ヒーローの点の格子を、階段の形で終わらせる(ヒーローの地の外に置く) */}
      <PixelStair />

      {/* 2. h1 = このページで何ができるか(サイトの名前はヘッダーのロゴと読み上げだけ)。ヒーローのあとが「間・大」。
          色ズレは最初の画面で漢字の縁の 1 つだけにするので、ここには付けない */}
      <section aria-labelledby="start-heading" className={cn(inner, "pt-rl-ma-lg")}>
        {/* スマホは 24px(3 行)、PC は 32px(2 行)。日本語の文節で折り、行の長さをそろえる */}
        <h1 className="max-w-[24em] text-2xl font-bold [word-break:auto-phrase] text-balance md:text-rl-title">
          <span className="sr-only">{BRAND.name} — </span>
          {BRAND.lead}
        </h1>

        {/* 3. 入口 = 幅いっぱいの 3 行(カードにしない)。h1 と同じ話題なので間は「小」。
            スマホは主ボタンがないので、診断の行だけ主ボタンの見た目の札を持つ */}
        <h2 id="start-heading" className="sr-only">はじめる</h2>
        <ul className="mt-rl-ma-sm border-t border-rl-line">
          <li className="rl-draw-row rl-dissolve-host relative border-b border-rl-line">
            <Link href="/diagnosis" className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-6 md:gap-6 md:py-8">
              <PixelArt grid={FLASK_16} size={48} dissolve />
              <div className="grid min-w-0 gap-1">
                <h3 className="flex items-center gap-2 text-rl-title font-bold">自分を知る<FlaskConical aria-hidden className="size-5 text-rl-muted" /></h3>
                <span className="text-base text-rl-muted">1 分半のゲーマータイプ診断</span>
                <span className="mt-2 inline-flex h-11 items-center justify-self-start rounded-rl-pill bg-rl-accent px-4 text-sm font-bold text-rl-on-accent pointer-fine:hidden">1 分半で診断する</span>
              </div>
              <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
            </Link>
            <span aria-hidden className="rl-draw-line pointer-events-none absolute inset-x-0 -bottom-px h-px bg-rl-text" />
          </li>
          <li className="rl-draw-row rl-dissolve-host relative border-b border-rl-line">
            <div className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-4 py-6 md:gap-6 md:py-8">
              <PixelArt grid={RULER_16} size={48} dissolve />
              <div className="grid min-w-0 gap-1">
                <h3 className="flex items-center gap-2 text-rl-title font-bold">感度・マウス<Mouse aria-hidden className="size-5 text-rl-muted" /></h3>
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
            <span aria-hidden className="rl-draw-line pointer-events-none absolute inset-x-0 -bottom-px h-px bg-rl-text" />
          </li>
          <li className="rl-draw-row rl-dissolve-host relative border-b border-rl-line">
            <Link href="/lobby" className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-6 md:gap-6 md:py-8">
              <PixelArt grid={PARTY_16} size={48} dissolve />
              <div className="grid min-w-0 gap-1">
                <h3 className="flex items-center gap-2 text-rl-title font-bold">仲間を探す<Users aria-hidden className="size-5 text-rl-muted" /></h3>
                <span className="text-base text-rl-muted">一緒に遊ぶ人を見つける。18 歳以上が対象です</span>
              </div>
              <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
            </Link>
            <span aria-hidden className="rl-draw-line pointer-events-none absolute inset-x-0 -bottom-px h-px bg-rl-text" />
          </li>
        </ul>
      </section>

      {/* 4. 16 タイプの名簿 = ページの幅を 1 回だけ破る帯。追補 S5:画面に入ったとき 1 回だけ 1 体ずつ現れ、ホバーで軸の言葉が出る。
          トップだけ PC は 64px の絵と名前つき(スマホは 48px) */}
      <section aria-labelledby="types-heading" className="rl-dot-grid mt-rl-ma-md bg-rl-surface py-12">
        <div className={cn(inner, "grid gap-6")}>
          {/* 「タイプ一覧へ」は PC は見出しの右、スマホは名簿の下の左端(見出しの下に回って半端にずれないように) */}
          <SectionHeading id="types-heading" title="16 のゲーマータイプ" description={`4 文字は ${axisLegend()}`} action={<ButtonLink href="/types" variant="ghost" size="sm" className="hidden md:inline-flex">タイプ一覧へ</ButtonLink>} />
          {/* 見出しが「16 のゲーマータイプ」なので、名簿の名前は「タイプ」を外して短くする(読み上げは正式な名前) */}
          <TypeRoster
            showName
            mobileName={false}
            className="gap-y-6"
            items={TYPES.map((t) => ({ code: t.code, name: t.name.replace(/タイプ$/, ""), label: t.name, icon: <TypeIcon code={t.code} size={64} dissolve className="size-12 md:size-16" /> }))}
          />
          <ButtonLink href="/types" variant="ghost" size="sm" className="justify-self-start px-0 md:hidden">タイプ一覧へ<ChevronRight aria-hidden /></ButtonLink>
        </div>
      </section>

      {/* 5. 記録(データがない行は出さない。1 行もない日は段ごと出さない) */}
      {hasRecords && (
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
            {showYesterday && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rl-line py-4">
                <dt className="text-base">きのうの文字</dt>
                <dd className="flex items-baseline gap-2"><span className="text-2xl font-bold">{yesterday.glyph}</span><span className="text-sm text-rl-muted">{yesterday.strokes.length} 画</span></dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </main>
  );
}

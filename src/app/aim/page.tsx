import type { Metadata } from "next";
import { Suspense } from "react";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { aimOgImagePath } from "@/lib/aim/share";
import { loadRanking, type RankingRow } from "@/lib/aim/ranking";
import type { AimChar } from "@/lib/aim/daily";
import { pageContainerClass } from "@/components/ui/page-shell";
import { HeroKanji } from "@/components/brand/HeroKanji";
import { NumUnit } from "@/components/ui/num-unit";
import { HowToPlay } from "@/components/aim/HowToPlay";
import { TodayLabel } from "@/components/brand/TodayLabel";
import { PixelArt } from "@/components/brand/PixelArt";
import { FLAME_8 } from "@/lib/pixel-art";
import { Skeleton } from "@/components/ui/skeleton";
import { AimClient, PlayPlaceholder } from "./AimClient";
import { InstallHintBlock } from "@/components/pwa/InstallHintBlock";

export const dynamic = "force-dynamic";
const TITLE = "今日の文字(エイム練習)";
const DESCRIPTION = "毎日1文字の漢字を、ゲームと同じ感度でなぞるエイム練習。ランキングで腕試し。";

// シェア画像の URL に今日の日付を入れる(X・Discord は URL ごとに画像を覚えるため)
export function generateMetadata(): Metadata {
  const image = aimOgImagePath(jstDate(new Date()));
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [image] },
  };
}

/** 今日の 1 位(ランキングを読んでから出す) */
async function TodayTop({ rows }: { rows: Promise<RankingRow[]> }) {
  const top = (await rows)[0];
  return top ? (
    <p className="grid gap-1">
      <span className="text-sm text-rl-muted">今日の 1 位</span>
      <NumUnit value={top.score.toLocaleString("ja-JP")} unit="点" className="text-rl-display-1" />
    </p>
  ) : (
    <p className="text-sm text-rl-muted">今日の 1 位はまだいません。最初の記録が 1 位です</p>
  );
}

/** 1 位の行を読み込むまでの間、同じ高さを見えないまま取っておく */
function TodayTopPlaceholder() {
  return (
    <p aria-hidden className="invisible grid gap-1">
      <span className="text-sm">今日の 1 位</span>
      <NumUnit value="0" unit="点" className="text-rl-display-1" />
    </p>
  );
}

async function AimBody({ char, date, rows }: { char: AimChar; date: string; rows: Promise<RankingRow[]> }) {
  // 連続日数の炎のドットはサーバーで描いて渡す(ドット絵のデータをブラウザの JS に入れない)
  // 「ホーム画面に追加」のカードは記録の下(設計書 4-1)。今日の日付(JST)はサーバーから渡す
  return <AimClient char={char} date={date} rows={await rows} streakIcon={<PixelArt grid={FLAME_8} size={16} />}
    installHint={<InstallHintBlock place="aim" today={date} className="mt-rl-ma-sm" />} />;
}

/** ランキングを読み込むまでの面(AimClient のハイドレーション前と同じ遊ぶ面+ランキングの行の形) */
function AimBodyPlaceholder() {
  return (
    <>
      <div className="mt-rl-ma-sm"><PlayPlaceholder /></div>
      <div aria-hidden className="mt-rl-ma-md grid gap-2">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    </>
  );
}

/*
 * 表示速度(docs/design/perf.md):ページ全体でランキングを待つと、直接開いたときも loading.tsx の面が先に出て、
 * 見出し(漢字・遊び方)が 300ms 以上あとから出ていた(React の Suspense の表示のまとめ)。
 * 見出しはすぐ出し、ランキングを使う所(1 位の行と遊ぶ面・ランキング)だけを Suspense で待つ。読むのは 1 回(同じ Promise を渡す)。
 */
export default function AimPage() {
  const date = jstDate(new Date());
  const char = aimCharForDate(date);
  const rows = loadRanking(date);
  return (
    <main className={pageContainerClass("wide")}>
      {/* 見出しの帯:漢字+縦組みのすぐ右に遊び方の札(間 64px)。札の下の端を漢字の下の端にそろえ、左に固めて読む流れを 1 本にする */}
      <header className="flex flex-wrap items-end gap-x-16 gap-y-6">
        <div className="flex items-start gap-4 md:gap-6">
          {/* 追補 S3:漢字は共有の要素 today-kanji(HeroKanji の中。1 ページに 1 つ)。スマホは「1 画なぞってみる」 */}
          <HeroKanji strokes={char.strokes} variant="aim" />
          <TodayLabel as="h1" glyph={char.glyph} date={date} strokes={char.strokes.length} />
        </div>
        <div className="grid max-w-[28em] gap-4">
          <HowToPlay />
          <Suspense fallback={<TodayTopPlaceholder />}><TodayTop rows={rows} /></Suspense>
        </div>
      </header>
      <Suspense fallback={<AimBodyPlaceholder />}><AimBody char={char} date={date} rows={rows} /></Suspense>
      <p className="mt-rl-ma-md text-xs text-rl-muted">文字データ:<a href="https://kanjivg.tagaini.net/" className="text-rl-accent underline" target="_blank" rel="noopener">KanjiVG</a>(© Ulrich Apel、CC BY-SA 3.0)</p>
    </main>
  );
}

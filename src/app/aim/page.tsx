import type { Metadata } from "next";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { aimOgImagePath } from "@/lib/aim/share";
import { loadRanking } from "@/lib/aim/ranking";
import { pageContainerClass } from "@/components/ui/page-shell";
import { HeroKanji } from "@/components/brand/HeroKanji";
import { NumUnit } from "@/components/ui/num-unit";
import { HowToPlay } from "@/components/aim/HowToPlay";
import { TodayLabel } from "@/components/brand/TodayLabel";
import { PixelArt } from "@/components/brand/PixelArt";
import { FLAME_8 } from "@/lib/pixel-art";
import { AimClient } from "./AimClient";

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

export default async function AimPage() {
  const date = jstDate(new Date());
  const char = aimCharForDate(date);
  const rows = await loadRanking(date);
  return (
    <main className={pageContainerClass("wide")}>
      {/* 見出しの帯は 12 列:左 7 列に漢字と縦組みの h1、右 5 列に遊び方の 3 行(トップと共通)と今日の 1 位 */}
      <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="flex items-start gap-4 md:gap-6 lg:col-span-7">
          {/* 追補 S3:漢字は共有の要素 today-kanji(HeroKanji の中。1 ページに 1 つ)。スマホは「1 画なぞってみる」 */}
          <HeroKanji strokes={char.strokes} variant="aim" />
          <TodayLabel as="h1" glyph={char.glyph} date={date} strokes={char.strokes.length} />
        </div>
        <div className="grid gap-4 lg:col-span-5">
          <HowToPlay />
          {rows[0] ? (
            <p className="grid gap-1">
              <span className="text-sm text-rl-muted">今日の 1 位</span>
              <NumUnit value={rows[0].score.toLocaleString("ja-JP")} unit="点" className="text-rl-display-1" />
            </p>
          ) : (
            <p className="text-sm text-rl-muted">今日の 1 位はまだいません。最初の記録が 1 位です</p>
          )}
        </div>
      </header>
      {/* 連続日数の炎のドットはサーバーで描いて渡す(ドット絵のデータをブラウザの JS に入れない) */}
      <AimClient char={char} date={date} rows={rows} streakIcon={<PixelArt grid={FLAME_8} size={16} />} />
      <p className="mt-rl-ma-md text-xs text-rl-muted">文字データ:<a href="https://kanjivg.tagaini.net/" className="text-rl-accent underline" target="_blank" rel="noopener">KanjiVG</a>(© Ulrich Apel、CC BY-SA 3.0)</p>
    </main>
  );
}

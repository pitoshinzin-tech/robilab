import type { Metadata } from "next";
import { ViewTransition } from "react";
import { cn } from "@/lib/utils";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { aimOgImagePath } from "@/lib/aim/share";
import { loadRanking } from "@/lib/aim/ranking";
import { MORPH_LINE, VT_TODAY_KANJI } from "@/lib/motion/vt-names";
import { pageContainerClass } from "@/components/ui/page-shell";
import { KanjiStrokes } from "@/components/brand/KanjiStrokes";
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
    <main className={cn(pageContainerClass("wide"), "grid gap-8")}>
      <header className="flex flex-wrap items-start gap-4 md:gap-6">
        <ViewTransition name={VT_TODAY_KANJI} share={MORPH_LINE} default="none">
          <KanjiStrokes strokes={char.strokes} className="size-(--rl-text-display-3)" />
        </ViewTransition>
        <TodayLabel as="h1" glyph={char.glyph} date={date} strokes={char.strokes.length} />
        <p className="basis-full text-base md:basis-auto md:self-end">書き順どおりに線をなぞろう</p>
      </header>
      {/* 連続日数の炎のドットはサーバーで描いて渡す(ドット絵のデータをブラウザの JS に入れない) */}
      <AimClient char={char} date={date} rows={rows} streakIcon={<PixelArt grid={FLAME_8} size={16} />} />
      <p className="text-xs text-rl-muted">文字データ:<a href="https://kanjivg.tagaini.net/" className="text-rl-accent underline" target="_blank" rel="noopener">KanjiVG</a>(© Ulrich Apel、CC BY-SA 3.0)</p>
    </main>
  );
}

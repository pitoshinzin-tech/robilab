import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { BottomTabBar } from "@/components/brand/BottomTabBar";
import { ZenFontLoader } from "@/components/brand/ZenFontLoader";

/*
 * 表示速度(docs/design/perf.md):日本語のフォント Zen Kaku Gothic New は、ここ(最初の描画を止める CSS)では読まない。
 * Google の日本語のフォントは 1 つの太さが約 120 の小さなファイル(文字の範囲ごとの @font-face)に分かれていて、
 * その CSS(gzip 64KB)が回線を JS と取り合い、最初のレイアウトも重くしていた。
 * @font-face は ZenFontLoader が最初の描画のあとに読み、書体の名前と英数字の代わりの書体は globals.css に置く。
 * 前の経緯:先読み(preload)は 240 ファイルを毎ページ読んでいたのでやめた・900 は読まない(.rl-black)。
 */
// 追補 4-3:weight を書かないと 400〜900 の可変の 1 ファイルになる(表示用の数字 800・コード 900・ROBILAB 600 を 1 つで出す)
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${BRAND.name}|${BRAND.tagline}`, template: `%s|${BRAND.name}` },
  description: BRAND.description,
};

export const viewport: Viewport = { themeColor: "#0A0C16", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning:/mouse の freshVisitorScript がハイドレーションの前に <html> に印のクラスを足すため(src/lib/fresh-visitor.ts)
    <html lang="ja" className={orbitron.variable} suppressHydrationWarning>
      <body className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))] antialiased md:pb-0">
        <SiteHeader />
        {children}
        <SiteFooter />
        <BottomTabBar />
        <ZenFontLoader />
      </body>
    </html>
  );
}

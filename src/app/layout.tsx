import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Orbitron } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { BottomTabBar } from "@/components/brand/BottomTabBar";

/*
 * 表示速度(docs/design/perf.md):日本語のフォントは先読み(preload)しない。
 * Google の日本語のフォントは約 120 の小さなファイルに分かれていて、next/font の先読みの判定がずれ、
 * 700・900 の全部(240 ファイル・約 2.8MB)を毎ページ先読みしていた(CSS と HTML の読み込みを押しのけ、最初の描画が遅れていた)。
 * 先読みをやめると、ページで実際に使う字のファイルだけを、描画のあとに読む(display: swap なので文字は先に出る)。
 * 読み込むまでの間の日本語の書体は globals.css の --font-sans(かなが全角の幅の書体を system-ui より先に置く)。
 * ここで fallback を書くと、英数字の寸法を合わせた代わりの書体(Zen Kaku Gothic New Fallback)が消えるので書かない。
 */
const zen = Zen_Kaku_Gothic_New({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
  preload: false,
});
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
    <html lang="ja" className={`${zen.variable} ${orbitron.variable}`}>
      <body className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))] antialiased md:pb-0">
        <SiteHeader />
        {children}
        <SiteFooter />
        <BottomTabBar />
      </body>
    </html>
  );
}

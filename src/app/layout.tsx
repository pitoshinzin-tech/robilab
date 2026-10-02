import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Orbitron } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { BottomTabBar } from "@/components/brand/BottomTabBar";

const zen = Zen_Kaku_Gothic_New({ weight: ["500", "700", "900"], subsets: ["latin"], variable: "--font-zen", display: "swap" });
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

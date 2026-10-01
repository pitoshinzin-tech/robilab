import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Orbitron } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";

const zen = Zen_Kaku_Gothic_New({ weight: ["500", "700", "900"], subsets: ["latin"], variable: "--font-zen", display: "swap" });
const orbitron = Orbitron({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-orbitron", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${BRAND.name}|${BRAND.tagline}`, template: `%s|${BRAND.name}` },
  description: BRAND.description,
};

export const viewport: Viewport = { themeColor: "#0A0C16", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${zen.variable} ${orbitron.variable}`}>
      <body className="antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Orbitron } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";

const body = Zen_Kaku_Gothic_New({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Orbitron({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${BRAND.name}|${BRAND.tagline}`, template: `%s|${BRAND.name}` },
  description: BRAND.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${body.variable} ${display.variable}`}>
      <body className="antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

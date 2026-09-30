import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ブラウザから直接つなぐのは Supabase だけ(診断の記録、ログイン、未読数)
function supabaseOrigins(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "https://*.supabase.co wss://*.supabase.co";
  const origin = new URL(raw).origin;
  return `${origin} ${origin.replace(/^http/, "ws")}`;
}

// nonce なしの CSP(Next.js ガイド「Without Nonces」)。静的に作るページを保つため、
// script は 'unsafe-inline' を許可し、そのぶん接続先・フレーム・フォーム送信先を絞る。
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // 楽天の商品画像(マウス探し。src/data/mice-rakuten.ts)
  "img-src 'self' blob: data: https://thumbnail.image.rakuten.co.jp",
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigins()}${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

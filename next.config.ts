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
  // service worker は同じ origin の /sw.js だけ(blob: data: で登録させない)。manifest も同じ origin だけ
  "worker-src 'self'",
  "manifest-src 'self'",
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
      {
        // Next.js の PWA の説明どおり。全体のルールのあとに置く(同じキーは後ろが勝つ)。
        // sw.js の中の通信の決まりはこの応答の CSP で決まる。no-store で、壊れた版を直したら次に開いたときに入れ替わる
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;

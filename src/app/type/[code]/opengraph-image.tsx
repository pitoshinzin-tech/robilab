import { ImageResponse } from "next/og";
import { ALL_TYPE_CODES, getType } from "@/data/types";
import { loadOgFont } from "@/lib/og-font";

const ACCENT = { cyan: "#39F3FF", magenta: "#FF4FD8", purple: "#7B61FF", lime: "#B6FF3B" } as const;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ロビラボ ゲーマータイプ診断の結果";

export function generateStaticParams() {
  return ALL_TYPE_CODES.map((code) => ({ code }));
}

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const type = getType(code.toUpperCase()) ?? getType("ARCH")!;
  const text = `ロビラボわたしのゲーマータイプは…${type.name}${type.catchcopy}`;
  const font = await loadOgFont(text);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 48, padding: "0 72px",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)", color: "#eaf6ff", fontFamily: "ZenKaku" }}>
        <div style={{ width: 260, height: 260, borderRadius: 32, background: "#151a33", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 60px ${ACCENT[type.accent]}4d` }}>
          <svg viewBox="0 0 8 8" width={160} height={160}>
            <g fill={ACCENT[type.accent]}>
              <rect x="2" y="0" width="4" height="1" /><rect x="1" y="1" width="6" height="1" />
              <rect x="1" y="2" width="1" height="2" /><rect x="6" y="2" width="1" height="2" />
              <rect x="2" y="4" width="4" height="1" /><rect x="0" y="5" width="8" height="1" />
              <rect x="2" y="6" width="1" height="2" /><rect x="5" y="6" width="1" height="2" />
            </g>
            <g fill="#FF4FD8"><rect x="2" y="2" width="1" height="1" /><rect x="5" y="2" width="1" height="1" /></g>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, textShadow: "2px 0 0 #FF4FD8, -2px 0 0 #39F3FF" }}>ロビラボ</div>
          <div style={{ fontSize: 28, opacity: 0.8, marginTop: 16 }}>わたしのゲーマータイプは…</div>
          <div style={{ fontSize: 110, color: "#FF4FD8", letterSpacing: 12 }}>{type.code}</div>
          <div style={{ fontSize: 56 }}>{type.name}</div>
          <div style={{ display: "flex", fontSize: 30, color: "#39F3FF", marginTop: 12 }}>「{type.catchcopy}」</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "ZenKaku", data: font, weight: 700, style: "normal" }] : [] },
  );
}

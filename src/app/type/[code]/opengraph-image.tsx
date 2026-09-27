import { ImageResponse } from "next/og";
import { ALL_TYPE_CODES, getType } from "@/data/types";
import { loadOgFont } from "@/lib/og-font";

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
          fontSize: 120, color: "#39F3FF", boxShadow: "0 0 60px rgba(57,243,255,.3)" }}>▣</div>
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

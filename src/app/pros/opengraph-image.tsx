import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ロビラボ プロ設定";

export default async function Image() {
  const text = "ロビラボプロ設定VALORANT・Apex・OW2・CS2あなたに近いプロの感度";
  const font = await loadOgFont([...new Set(text)].sort().join(""));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 96px", color: "#eaf6ff",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)", fontFamily: "ZenKaku" }}>
        <div style={{ fontSize: 34, textShadow: "2px 0 0 #FF4FD8, -2px 0 0 #39F3FF" }}>ロビラボ</div>
        <div style={{ fontSize: 110, marginTop: 12, color: "#39f3ff" }}>プロ設定</div>
        <div style={{ fontSize: 40, marginTop: 24, opacity: 0.85 }}>VALORANT・Apex・OW2・CS2</div>
        <div style={{ fontSize: 34, marginTop: 8, color: "#FF4FD8" }}>あなたに近いプロの感度</div>
      </div>
    ),
    { ...size, ...(font ? { fonts: [{ name: "ZenKaku", data: font, weight: 700 as const, style: "normal" as const }] } : {}) },
  );
}

import { ImageResponse } from "next/og";
import { aimCharForDate, jstDate } from "@/lib/aim/daily";
import { loadOgFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ロビラボ 今日の文字";
export const dynamic = "force-dynamic";

export default async function Image() {
  const date = jstDate(new Date());
  const char = aimCharForDate(date);
  const text = `ロビラボ今日の文字${char.glyph}${date}ゲームと同じ感度でなぞるエイム練習`;
  const font = await loadOgFont([...new Set(text)].sort().join(""));
  const img = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 80px", color: "#eaf6ff",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)", fontFamily: "ZenKaku" }}>
        <div style={{ fontSize: 360, color: "#39f3ff", lineHeight: 1 }}>{char.glyph}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, textShadow: "2px 0 0 #FF4FD8, -2px 0 0 #39F3FF" }}>ロビラボ</div>
          <div style={{ fontSize: 72, marginTop: 8 }}>今日の文字</div>
          <div style={{ fontSize: 32, color: "#FF4FD8", marginTop: 8 }}>{date}</div>
          <div style={{ fontSize: 28, opacity: 0.8, marginTop: 16 }}>ゲームと同じ感度でなぞるエイム練習</div>
        </div>
      </div>
    ),
    { ...size, ...(font ? { fonts: [{ name: "ZenKaku", data: font, weight: 700 as const, style: "normal" as const }] } : {}) },
  );
  // 日付で変わる画像なので、長く保存させない
  return new Response(img.body, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=600" } });
}

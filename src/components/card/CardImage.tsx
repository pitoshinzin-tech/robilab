import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/og-font";
import type { CardView } from "@/lib/card-view";

export const CARD_SIZE = { width: 1200, height: 630 };
const ACCENT = { cyan: "#39F3FF", magenta: "#FF4FD8", purple: "#7B61FF", lime: "#B6FF3B" } as const;

/** 名刺カード(1200×630)。見た目の最終調整は本人が行う前提の叩き台。 */
export async function renderCardImage(view: CardView): Promise<ImageResponse> {
  const accent = ACCENT[view.accent];
  const typeCode = view.typeCode ?? "????";
  const typeName = view.typeName ?? "タイプ未診断";
  const lines = [
    "ロビラボ マイ設定",
    typeCode,
    typeName,
    view.cardName ?? "",
    view.main ? `${view.main.gameName} 感度 ${view.main.sens} / ${view.main.dpi} DPI` : "",
    view.main ? `eDPI ${view.main.edpi} ・ 振り向き ${view.main.cm360} cm` : "",
    view.grip ?? "",
    ...view.devices.map((d) => `${d.label} ${d.name}`),
    ...view.favoriteGames,
    "好きなゲーム 未登録",
  ];
  const font = await loadOgFont(lines.join(""));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 56, gap: 48, color: "#eaf6ff", fontFamily: "ZenKaku",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 280 }}>
          <div style={{ width: 240, height: 240, borderRadius: 32, background: "#151a33", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 60px ${accent}4d` }}>
            <svg viewBox="0 0 8 8" width={150} height={150}>
              <g fill={accent}>
                <rect x="2" y="0" width="4" height="1" /><rect x="1" y="1" width="6" height="1" />
                <rect x="1" y="2" width="1" height="2" /><rect x="6" y="2" width="1" height="2" />
                <rect x="2" y="4" width="4" height="1" /><rect x="0" y="5" width="8" height="1" />
                <rect x="2" y="6" width="1" height="2" /><rect x="5" y="6" width="1" height="2" />
              </g>
              <g fill="#FF4FD8"><rect x="2" y="2" width="1" height="1" /><rect x="5" y="2" width="1" height="1" /></g>
            </svg>
          </div>
          <div style={{ fontSize: 64, color: "#FF4FD8", letterSpacing: 8, marginTop: 20 }}>{typeCode}</div>
          <div style={{ fontSize: 26 }}>{typeName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 22, opacity: 0.7, textShadow: "2px 0 0 #FF4FD8, -2px 0 0 #39F3FF" }}>ロビラボ マイ設定</div>
          <div style={{ fontSize: 56, marginTop: 8 }}>{view.cardName ?? ""}</div>
          {view.main && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 16, color: "#39F3FF" }}>
              <div style={{ fontSize: 30 }}>{`${view.main.gameName} 感度 ${view.main.sens} / ${view.main.dpi} DPI`}</div>
              <div style={{ fontSize: 26 }}>{`eDPI ${view.main.edpi} ・ 振り向き ${view.main.cm360} cm`}</div>
            </div>
          )}
          {view.grip && <div style={{ fontSize: 24, marginTop: 8, color: "#B6FF3B" }}>{view.grip}</div>}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 16, gap: 4 }}>
            {view.devices.map((d) => (
              <div key={d.label} style={{ display: "flex", fontSize: 24 }}>
                <span style={{ width: 170, opacity: 0.6 }}>{d.label}</span>
                <span>{d.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {(view.favoriteGames.length ? view.favoriteGames : ["好きなゲーム 未登録"]).map((g) => (
              <div key={g} style={{ fontSize: 20, padding: "4px 14px", borderRadius: 999, border: "2px solid #7B61FF" }}>{g}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, ...(font ? { fonts: [{ name: "ZenKaku", data: font, weight: 700 as const, style: "normal" as const }] } : {}) },
  );
}

import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/og-font";
import type { CardView } from "@/lib/card-view";
import { CARD_ACCENT, CARD_FALLBACK_GAMES, CARD_LAYOUT as L, cardMainLines } from "@/lib/card-face";

export const CARD_SIZE = { width: 1200, height: 630 };

/** 名刺カード(1200×630)。見た目の最終調整は本人が行う前提の叩き台。/my のプレビューは同じ組みの HTML(CardFace.tsx)。寸法は両方とも CARD_LAYOUT(src/lib/card-face.ts)から読む。組み(要素の並び)を変えるときは両方を直す。 */
export async function renderCardImage(view: CardView): Promise<ImageResponse> {
  const accent = CARD_ACCENT[view.accent];
  const main = cardMainLines(view);
  const typeCode = view.typeCode ?? "????";
  const typeName = view.typeName ?? "タイプ未診断";
  const lines = [
    "ロビラボ マイ設定",
    typeCode,
    typeName,
    view.cardName ?? "",
    main?.sens ?? "",
    main?.edpi ?? "",
    view.grip ?? "",
    ...view.devices.map((d) => `${d.label} ${d.name}`),
    ...view.favoriteGames,
    ...CARD_FALLBACK_GAMES,
  ];
  // 使う文字だけを、重複なし・並べ替えて渡す(入力した文の並びがフォント取得の URL に残らないように)
  const font = await loadOgFont([...new Set(lines.join(""))].sort().join(""));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: L.padding, gap: L.gap, color: "#eaf6ff", fontFamily: "ZenKaku",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: L.left.width }}>
          <div style={{ width: L.box.size, height: L.box.size, borderRadius: L.box.radius, background: "#151a33", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 ${L.box.glow}px ${accent}4d` }}>
            <svg viewBox="0 0 8 8" width={L.box.pixel} height={L.box.pixel}>
              <g fill={accent}>
                <rect x="2" y="0" width="4" height="1" /><rect x="1" y="1" width="6" height="1" />
                <rect x="1" y="2" width="1" height="2" /><rect x="6" y="2" width="1" height="2" />
                <rect x="2" y="4" width="4" height="1" /><rect x="0" y="5" width="8" height="1" />
                <rect x="2" y="6" width="1" height="2" /><rect x="5" y="6" width="1" height="2" />
              </g>
              <g fill="#FF4FD8"><rect x="2" y="2" width="1" height="1" /><rect x="5" y="2" width="1" height="1" /></g>
            </svg>
          </div>
          <div style={{ fontSize: L.code.size, color: "#FF4FD8", letterSpacing: L.code.spacing, marginTop: L.code.marginTop }}>{typeCode}</div>
          <div style={{ fontSize: L.typeName.size }}>{typeName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: L.title.size, opacity: 0.7, textShadow: `${L.title.shadow}px 0 0 #FF4FD8, -${L.title.shadow}px 0 0 #39F3FF` }}>ロビラボ マイ設定</div>
          <div style={{ fontSize: L.name.size, marginTop: L.name.marginTop }}>{view.cardName ?? ""}</div>
          {main && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: L.main.marginTop, color: "#39F3FF" }}>
              <div style={{ fontSize: L.main.sensSize }}>{main.sens}</div>
              <div style={{ fontSize: L.main.edpiSize }}>{main.edpi}</div>
            </div>
          )}
          {view.grip && <div style={{ fontSize: L.grip.size, marginTop: L.grip.marginTop, color: "#B6FF3B" }}>{view.grip}</div>}
          <div style={{ display: "flex", flexDirection: "column", marginTop: L.devices.marginTop, gap: L.devices.gap }}>
            {view.devices.map((d) => (
              <div key={d.label} style={{ display: "flex", fontSize: L.devices.size }}>
                <span style={{ width: L.devices.labelWidth, opacity: 0.6 }}>{d.label}</span>
                <span>{d.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: L.games.gap, marginTop: L.games.marginTop }}>
            {(view.favoriteGames.length ? view.favoriteGames : CARD_FALLBACK_GAMES).map((g) => (
              <div key={g} style={{ fontSize: L.games.size, padding: `${L.games.padY}px ${L.games.padX}px`, borderRadius: L.games.radius, border: `${L.games.border}px solid #7B61FF` }}>{g}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, ...(font ? { fonts: [{ name: "ZenKaku", data: font, weight: 700 as const, style: "normal" as const }] } : {}) },
  );
}

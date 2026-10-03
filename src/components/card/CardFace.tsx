import type * as React from "react";
import type { CardView } from "@/lib/card-view";
import { CARD_ACCENT, CARD_FALLBACK_GAMES, cardMainLines } from "@/lib/card-face";

/** 1200×630 の画像の 1px を、入れ物の幅に対する cqw にする(入れ物の幅が変わっても同じ割合で描く) */
const u = (px: number) => `${Math.round((px / 12) * 10000) / 10000}cqw`;

/**
 * 名刺カードを HTML で描く(/my のプレビュー。表示速度:docs/design/perf.md)。
 * 画像(CardImage.tsx の renderCardImage、保存用の PNG)と同じ組み・同じ文字・同じドット絵。数字は 1200×630 の px を cqw にしたもの。
 * 文字は React の文字として出す(利用者の入力をそのまま HTML にしない)。書体は Zen Kaku の 700(画像と同じ)。
 * 入れ物(この部品の外側)に container-type: inline-size と aspect-ratio 1200/630 が要る。
 */
export function CardFace({ view, label }: { view: CardView; label: string }) {
  const accent = CARD_ACCENT[view.accent];
  const typeCode = view.typeCode ?? "????";
  const typeName = view.typeName ?? "タイプ未診断";
  const main = cardMainLines(view);
  const games = view.favoriteGames.length ? view.favoriteGames : CARD_FALLBACK_GAMES;
  const text: React.CSSProperties = { display: "flex", lineHeight: "normal", letterSpacing: "normal" };
  return (
    <div role="img" aria-label={label}
      style={{ position: "absolute", inset: 0, display: "flex", padding: u(56), gap: u(48), color: "#eaf6ff", fontFamily: "var(--font-zen), var(--rl-font-ja-fallback), sans-serif",
        fontWeight: 700, lineHeight: "normal", letterSpacing: "normal", overflow: "hidden", boxSizing: "border-box",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: u(280), flexShrink: 0 }}>
        <div style={{ width: u(240), height: u(240), borderRadius: u(32), background: "#151a33", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${u(60)} ${accent}4d`, flexShrink: 0 }}>
          <svg viewBox="0 0 8 8" aria-hidden style={{ width: u(150), height: u(150), display: "block" }}>
            <g fill={accent}>
              <rect x="2" y="0" width="4" height="1" /><rect x="1" y="1" width="6" height="1" />
              <rect x="1" y="2" width="1" height="2" /><rect x="6" y="2" width="1" height="2" />
              <rect x="2" y="4" width="4" height="1" /><rect x="0" y="5" width="8" height="1" />
              <rect x="2" y="6" width="1" height="2" /><rect x="5" y="6" width="1" height="2" />
            </g>
            <g fill="#FF4FD8"><rect x="2" y="2" width="1" height="1" /><rect x="5" y="2" width="1" height="1" /></g>
          </svg>
        </div>
        <div style={{ ...text, fontSize: u(64), color: "#FF4FD8", letterSpacing: u(8), marginTop: u(20) }}>{typeCode}</div>
        <div style={{ ...text, fontSize: u(26) }}>{typeName}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ ...text, fontSize: u(22), opacity: 0.7, textShadow: `${u(2)} 0 0 #FF4FD8, ${u(-2)} 0 0 #39F3FF` }}>ロビラボ マイ設定</div>
        <div style={{ ...text, fontSize: u(56), marginTop: u(8) }}>{view.cardName ?? ""}</div>
        {main && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: u(16), color: "#39F3FF" }}>
            <div style={{ ...text, fontSize: u(30) }}>{main.sens}</div>
            <div style={{ ...text, fontSize: u(26) }}>{main.edpi}</div>
          </div>
        )}
        {view.grip && <div style={{ ...text, fontSize: u(24), marginTop: u(8), color: "#B6FF3B" }}>{view.grip}</div>}
        <div style={{ display: "flex", flexDirection: "column", marginTop: u(16), gap: u(4) }}>
          {view.devices.map((d) => (
            <div key={d.label} style={{ ...text, fontSize: u(24) }}>
              <span style={{ width: u(170), opacity: 0.6, flexShrink: 0 }}>{d.label}</span>
              <span>{d.name}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: u(10), marginTop: u(18) }}>
          {games.map((g) => (
            <div key={g} style={{ ...text, fontSize: u(20), padding: `${u(4)} ${u(14)}`, borderRadius: u(999), border: `${u(2)} solid #7B61FF` }}>{g}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

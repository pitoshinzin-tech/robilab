import type * as React from "react";
import type { CardView } from "@/lib/card-view";
import { CARD_ACCENT, CARD_FALLBACK_GAMES, cardMainLines } from "@/lib/card-face";

/** 1200×630 の画像の 1px を、入れ物の幅に対する cqw にする(入れ物の幅が変わっても同じ割合で描く) */
/** 「ロビラボ マイ設定」の文字(画像では #eaf6ff を不透明度 0.7 で描く) */
const TITLE_TEXT = "rgba(234, 246, 255, 0.7)";

const u = (px: number) => `${Math.round((px / 12) * 10000) / 10000}cqw`;
/** 「ロビラボ マイ設定」の影(画像の textShadow のうち、実際に描かれるシアンの分) */
const TITLE_SHADOW = `${u(-2)} 0 0 rgba(57, 243, 255, 0.7)`;

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
        {/*
          * 色ズレの影は、画像(satori → resvg)で実際に描かれる形に合わせる。画像の画素を読むと、
          * 「不透明度 0.7 の文字 + 左に 2px ずれたシアンの影(0.7)」が 2 枚重なった形で、マゼンタの影は出ていない
          * (satori は影ごとに結果を作って重ねる作りだが、resvg ではシアンの結果が 2 回重なる)。
          * そこで同じ 2 枚を重ねて描く(文字の縁のシアンが約 0.91、文字が #eaf6ff の約 0.91 になり、画像の画素と同じ)。
          */}
        <div style={{ ...text, fontSize: u(22), position: "relative" }}>
          <span style={{ color: TITLE_TEXT, textShadow: TITLE_SHADOW }}>ロビラボ マイ設定</span>
          <span aria-hidden style={{ position: "absolute", left: 0, top: 0, color: TITLE_TEXT, textShadow: TITLE_SHADOW }}>ロビラボ マイ設定</span>
        </div>
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
            // 札の線は画像と同じ 2px(1200 の幅で)。border は 1 物理ピクセルより細くできず太く見えるので、細さがそのまま縮む内側の影で描く(内側の大きさは同じ)
            <div key={g} style={{ ...text, fontSize: u(20), padding: `${u(6)} ${u(16)}`, borderRadius: u(999), boxShadow: `inset 0 0 0 ${u(2)} #7B61FF` }}>{g}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

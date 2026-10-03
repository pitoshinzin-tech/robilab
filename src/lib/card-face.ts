import type { CardView } from "@/lib/card-view";

/**
 * 名刺カードの、画像(CardImage.tsx の PNG)と HTML(CardFace.tsx のプレビュー)で同じにする値と文。
 * ここをそろえて、プレビューと保存する画像の文字・色が食い違わないようにする。
 */
export const CARD_ACCENT = { cyan: "#39F3FF", magenta: "#FF4FD8", purple: "#7B61FF", lime: "#B6FF3B" } as const;
/** 好きなゲームが空のときの札 */
export const CARD_FALLBACK_GAMES: readonly string[] = ["好きなゲーム 未登録"];

/** メインのゲームの 2 行(感度・DPI と eDPI・振り向き)。ないときは null */
export function cardMainLines(view: Pick<CardView, "main">): { sens: string; edpi: string } | null {
  const m = view.main;
  if (!m) return null;
  return { sens: `${m.gameName} 感度 ${m.sens} / ${m.dpi} DPI`, edpi: `eDPI ${m.edpi} ・ 振り向き ${m.cm360} cm` };
}

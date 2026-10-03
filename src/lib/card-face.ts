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

/**
 * 名刺の寸法の表(1200×630 の画像の px)。画像(CardImage.tsx)は px のまま、HTML(CardFace.tsx)は幅の割合(cqw)にして使う。
 * 片方だけ寸法を変えて食い違わないよう、両方ともこの表から読む。
 */
export const CARD_LAYOUT = {
  padding: 56,
  gap: 48,
  left: { width: 280 },
  box: { size: 240, radius: 32, glow: 60, pixel: 150 },
  code: { size: 64, spacing: 8, marginTop: 20 },
  typeName: { size: 26 },
  title: { size: 22, shadow: 2 },
  name: { size: 56, marginTop: 8 },
  main: { marginTop: 16, sensSize: 30, edpiSize: 26 },
  grip: { size: 24, marginTop: 8 },
  devices: { marginTop: 16, gap: 4, size: 24, labelWidth: 170 },
  games: { gap: 10, marginTop: 18, size: 20, padY: 4, padX: 14, radius: 999, border: 2 },
} as const;

/** 名刺の中身を短く伝える文(HTML の名刺の読み上げ。画面に出ているものだけ、空の項目は省く) */
export function cardSummary(view: CardView): string {
  const main = cardMainLines(view);
  const games = view.favoriteGames.length ? `好きなゲーム ${view.favoriteGames.join("・")}` : CARD_FALLBACK_GAMES[0];
  const parts = [
    view.cardName,
    `${view.typeCode ?? "????"} ${view.typeName ?? "タイプ未診断"}`,
    main?.sens, main?.edpi, view.grip,
    ...view.devices.map((d) => `${d.label} ${d.name}`),
    games,
  ].filter((p): p is string => typeof p === "string" && p !== "");
  return `名刺カード:${parts.join("、")}`;
}

/**
 * 保存のボタンの状態。ready:今の入力の PNG がある(押したらすぐ保存)。preparing:作っている間(押せない「画像を準備中…」)。
 * unavailable:作れなかった・入力が正しくない(押せない)。
 * 押したあとに待ってから保存する形にしない(待つとユーザーの操作と見なされず、Safari などで保存が止まることがある)。
 */
export function cardSaveState({ pngBody, body, failed }: { pngBody: string | null; body: string | null; failed: boolean }): "ready" | "preparing" | "unavailable" {
  if (body === null) return "unavailable";
  if (pngBody === body) return "ready";
  return failed ? "unavailable" : "preparing";
}

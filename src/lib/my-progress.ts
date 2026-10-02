import type { MySettings } from "@/lib/my-settings";

/** マイ設定の「どこまで埋まっているか」に数える 8 項目(クロスヘアは初めから値があるので数えない) */
export type ProgressItem = "type" | "dpi" | "sens" | "handSize" | "grip" | "devices" | "favoriteGames" | "cardName";
export const PROGRESS_ITEMS: readonly ProgressItem[] = ["type", "dpi", "sens", "handSize", "grip", "devices", "favoriteGames", "cardName"];

const FILLED: Record<ProgressItem, (s: MySettings) => boolean> = {
  type: (s) => s.typeCode !== null,
  dpi: (s) => s.dpi !== null,
  sens: (s) => s.mainGame !== null && typeof s.sens[s.mainGame] === "number",
  handSize: (s) => s.hand.lengthCm !== null,
  grip: (s) => s.hand.grip !== null,
  devices: (s) => Object.values(s.devices).some((v) => v !== null),
  favoriteGames: (s) => s.favoriteGames.length > 0,
  cardName: (s) => s.cardName !== null && s.cardName !== "",
};

export function settingsProgress(s: MySettings): { done: number; total: number; missing: ProgressItem[] } {
  const missing = PROGRESS_ITEMS.filter((item) => !FILLED[item](s));
  return { done: PROGRESS_ITEMS.length - missing.length, total: PROGRESS_ITEMS.length, missing };
}

/** 感度の欄を最初から開いておくゲーム(メインのゲームと、値の入ったゲーム)。ほかは「ほかのゲームを足す」にしまう。 */
export function visibleSensGames(s: Pick<MySettings, "mainGame" | "sens">, order: readonly string[]): string[] {
  return order.filter((id) => id === s.mainGame || s.sens[id] !== undefined);
}

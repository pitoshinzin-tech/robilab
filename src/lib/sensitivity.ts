import type { SensGame } from "@/data/sensitivity";

export const DPI_MIN = 50;
export const DPI_MAX = 64000;

const round = (value: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

export function edpi(dpi: number, sens: number): number {
  return round(dpi * sens, 2);
}

/** 360°回転に必要なマウスの移動距離(cm) */
export function cm360(dpi: number, sens: number, yaw: number): number {
  return round((360 / (dpi * sens * yaw)) * 2.54, 2);
}

/** 振り向きを保ったまま、別のゲームの感度に換算する */
export function convertSens(sens: number, from: SensGame, to: SensGame): number {
  return round(sens * (from.yaw / to.yaw), to.decimals);
}

export function validateInput(dpi: number | null, sens: number | null, game: SensGame): string | null {
  if (dpi === null) return "DPI を数字で入力してください。";
  if (dpi < DPI_MIN || dpi > DPI_MAX) return `DPI は ${DPI_MIN}〜${DPI_MAX} の範囲で入力してください。`;
  if (sens === null) return "感度を数字で入力してください。";
  if (sens <= 0 || sens < game.min || sens > game.max)
    return `${game.name} の感度は ${game.min}〜${game.max} の範囲で入力してください。`;
  return null;
}

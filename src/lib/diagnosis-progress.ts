export type ProgressCell = "done" | "now" | "todo";

/**
 * 診断の進み具合のマス。current は今の問題の番号(1 から)。
 * 答えた問題は done、今の問題は now、まだの問題は todo。範囲の外の数は 1〜total にそろえる。
 */
export function progressCells(current: number, total: number): ProgressCell[] {
  const now = Math.min(Math.max(current, 1), total);
  return Array.from({ length: total }, (_, i) => (i + 1 < now ? "done" : i + 1 === now ? "now" : "todo"));
}

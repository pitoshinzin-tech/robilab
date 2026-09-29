import chars from "@/data/aim-chars.json";

export type AimChar = { id: string; glyph: string; strokes: string[] };
export const AIM_CHARS = chars as AimChar[];
/** お題の開始日(この日が一覧の1文字目)。DB の _aim_char_for と同じ。 */
export const AIM_START_DATE = "2026-11-01";

/** 日本時間の日付(YYYY-MM-DD)。 */
export function jstDate(now: Date): string {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function aimIndexForDate(date: string, count: number): number {
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${AIM_START_DATE}T00:00:00Z`)) / 86_400_000);
  return Math.max(0, days) % count;
}

export function aimCharForDate(date: string): AimChar {
  return AIM_CHARS[aimIndexForDate(date, AIM_CHARS.length)];
}

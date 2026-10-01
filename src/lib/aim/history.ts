// エイム記録と成長グラフ(plan.md D43)。日付はすべて日本時間の YYYY-MM-DD。
import type { SettingsStorage } from "@/lib/my-settings-store";

export type AimDay = { score: number; accuracy: number; timeMs: number };
export type AimDays = Record<string, AimDay>;
export type AimHistoryRow = { play_date: string; score: number; accuracy: number | string; time_ms: number };

export const HISTORY_KEY = "robilab:aimHistory";
export const HISTORY_MAX_DAYS = 400;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isDay(v: unknown): v is AimDay {
  if (typeof v !== "object" || v === null) return false;
  const { score, accuracy, timeMs } = v as Record<string, unknown>;
  return Number.isInteger(score) && (score as number) >= 0 && (score as number) <= 10000
    && typeof accuracy === "number" && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= 100
    && Number.isInteger(timeMs) && (timeMs as number) >= 1;
}

/** 日付を n 日ずらす(UTC の日付として計算し、端末のタイムゾーンに左右されない) */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** ブラウザの記録を読む。形のおかしい日は捨て、全体が読めなければ空 */
export function loadHistory(storage: SettingsStorage | null): AimDays {
  if (!storage) return {};
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { v?: unknown; days?: unknown };
    if (parsed?.v !== 1 || typeof parsed.days !== "object" || parsed.days === null) return {};
    const out: AimDays = {};
    for (const [date, v] of Object.entries(parsed.days as Record<string, unknown>)) {
      if (isDate(date) && isDay(v)) out[date] = { score: v.score, accuracy: v.accuracy, timeMs: v.timeMs };
    }
    return out;
  } catch {
    return {};
  }
}

/** その日の自己ベストを上回ったときだけ保存する。保存したら true */
export function recordLocal(storage: SettingsStorage | null, date: string, day: AimDay): boolean {
  if (!storage || !isDate(date)) return false;
  const next: AimDay = { score: day.score, accuracy: Math.round(day.accuracy * 100) / 100, timeMs: day.timeMs };
  if (!isDay(next)) return false;
  const days = loadHistory(storage);
  const prev = days[date];
  if (prev && prev.score >= next.score) return false;
  days[date] = next;
  const kept: AimDays = {};
  for (const d of Object.keys(days).sort().reverse().slice(0, HISTORY_MAX_DAYS)) kept[d] = days[d];
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify({ v: 1, days: kept }));
    return true;
  } catch {
    return false;
  }
}

/** この端末の記録だけを消す */
export function clearLocal(storage: SettingsStorage | null): void {
  try { storage?.removeItem(HISTORY_KEY); } catch { /* 消せなくても画面は止めない */ }
}

/** my_aim_history の行を記録の形にする(numeric は文字列で来てもよい) */
export function serverRowsToDays(rows: AimHistoryRow[] | null): AimDays {
  const out: AimDays = {};
  for (const r of rows ?? []) {
    const d = { score: r.score, accuracy: Number(r.accuracy), timeMs: r.time_ms };
    if (typeof r.play_date === "string" && isDate(r.play_date) && isDay(d)) out[r.play_date] = d;
  }
  return out;
}

/** 日付ごとに点数の高いほうを使う(同点はサーバー) */
export function mergeHistory(local: AimDays, server: AimDays): AimDays {
  const out: AimDays = { ...local };
  for (const [date, s] of Object.entries(server)) {
    const l = out[date];
    if (!l || s.score >= l.score) out[date] = s;
  }
  return out;
}

/** 連続日数。今日遊んでいれば今日から、まだなら昨日から数える */
export function streakDays(days: AimDays, today: string): number {
  let d = days[today] ? today : addDays(today, -1);
  let n = 0;
  while (days[d]) { n++; d = addDays(d, -1); }
  return n;
}

/** 今日を右端にした直近 n 日(古い順) */
export function lastNDays(days: AimDays, today: string, n: number): { date: string; day: AimDay | null }[] {
  const out: { date: string; day: AimDay | null }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    out.push({ date, day: days[date] ?? null });
  }
  return out;
}

/** 今日までの記録の中の最高点(同点は古い日) */
export function bestDay(days: AimDays, today: string): { date: string; day: AimDay } | null {
  let best: { date: string; day: AimDay } | null = null;
  for (const date of Object.keys(days).sort()) {
    if (date > today) continue;
    if (!best || days[date].score > best.day.score) best = { date, day: days[date] };
  }
  return best;
}

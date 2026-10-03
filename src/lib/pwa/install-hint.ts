// 「ホーム画面に追加」の案内を出すか・どの手順を見せるか(設計書 4 章)。ブラウザに触らない純粋な関数だけ。
// 記録はこの端末の localStorage だけ(日付と真偽。個人の情報は入れない・サーバーに送らない)。

export type HintPlatform = "ios" | "android" | "desktop" | "other" | "installed";
export type StepsPlatform = Exclude<HintPlatform, "installed">;
export type HintPlace = "my" | "aim";
export type HintState = { v: 1; days: string[]; dismissed: boolean };

export const HINT_STORAGE_KEY = "robilab:pwaHint";
/** 記録する来訪日の数(1 日目 + 案内を出す 3 日) */
export const HINT_MAX_DAYS = 4;
export const EMPTY_HINT: HintState = { v: 1, days: [], dismissed: false };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** JST の今日(YYYY-MM-DD)。式は今日の文字の jstDate と同じ(@/lib/aim/daily をブラウザに入れないため、ここに持つ) */
export function jstToday(now: Date): string {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** iPadOS は Mac の顔をするので、タッチの点の数でも見る。PC の Safari・Firefox は「other」(インストールの道が違う・無い) */
export function detectPlatform(input: { userAgent: string; maxTouchPoints: number; standalone: boolean }): HintPlatform {
  if (input.standalone) return "installed";
  const ua = input.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && input.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/(Chrome|Chromium|Edg)\//.test(ua)) return "desktop";
  return "other";
}

/** 読めない値は空にする(days だけ壊れていて dismissed が true のときは、閉じた記録を残す)。日付でない要素・重なりは捨て、最初の 4 件だけ */
export function parseHintState(raw: string | null): HintState {
  if (!raw) return EMPTY_HINT;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_HINT;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return EMPTY_HINT;
  const o = data as { v?: unknown; days?: unknown; dismissed?: unknown };
  if (o.v !== 1) return EMPTY_HINT;
  const days: string[] = [];
  // days が壊れていても、「閉じた」の記録は消さない(閉じた人に案内がまた出ないように)
  for (const d of Array.isArray(o.days) ? o.days : []) {
    if (typeof d === "string" && DATE_RE.test(d) && !days.includes(d)) days.push(d);
    if (days.length >= HINT_MAX_DAYS) break;
  }
  return { v: 1, days, dismissed: o.dismissed === true };
}

/** 今日を来訪日に足す。閉じた・今日は記録済み・4 件そろっている、のときは同じオブジェクトを返す */
export function nextHintState(state: HintState, today: string): HintState {
  if (state.dismissed || state.days.includes(today) || state.days.length >= HINT_MAX_DAYS) return state;
  return { ...state, days: [...state.days, today] };
}

export function dismissHint(state: HintState): HintState {
  return state.dismissed ? state : { ...state, dismissed: true };
}

/** /aim のカード:2 日目から最大 3 日(今日が来訪日の 2〜4 番目)。閉じたら出さない。追加できる端末だけ */
export function shouldShowHint(state: HintState, today: string, platform: HintPlatform): boolean {
  if (state.dismissed || platform === "installed" || platform === "other") return false;
  const i = state.days.indexOf(today);
  return i >= 1 && i <= HINT_MAX_DAYS - 1;
}

/**
 * 1 回の表示で出すか・保存し直す状態。stored が undefined = localStorage が使えない(出さない)。
 * /my はアプリ表示以外のいつでも出し、来訪を数えない。/aim は today(サーバーの JST の日付)が要る。
 */
export function hintView(input: { place: HintPlace; platform: HintPlatform; stored: string | null | undefined; today?: string }): {
  show: boolean;
  platform: HintPlatform;
  next: HintState | null;
} {
  const { place, platform, stored, today } = input;
  if (place === "my") return { show: platform !== "installed", platform, next: null };
  if (stored === undefined || !today) return { show: false, platform, next: null };
  const state = parseHintState(stored);
  if (platform === "installed") {
    const dismissed = dismissHint(state);
    return { show: false, platform, next: dismissed === state ? null : dismissed };
  }
  const next = nextHintState(state, today);
  return { show: shouldShowHint(next, today, platform), platform, next: next === state ? null : next };
}

/**
 * manifest のショートカットの名前(manifest-data.ts の APP_SHORTCUTS と同じ並び。tests/pwa/hint-lead.test.ts が照らす)。
 * manifest-data を import しないのは、BRAND などをブラウザの JS に入れないため
 */
export const SHORTCUT_NAMES = "今日の文字・仲間・マウス探し";

/**
 * 案内の 1 行目。/aim は今日の文字の画面にいる理由とつなげる。/my は、追加するとできるようになることを端末ごとに言う
 * (長押し・右クリックのショートカットは Android と PC だけ。iPhone のホーム画面のアイコンにはショートカットがない)。
 */
export function hintLead(place: HintPlace, platform: HintPlatform): string {
  if (place === "aim") return "アイコンから、毎日の今日の文字にワンタップで。";
  if (platform === "android") return `アプリのように全画面で開けます。アイコンを長押しすると、${SHORTCUT_NAMES}にすぐ行けます。`;
  if (platform === "desktop") return `アプリのように別のウインドウで開けます。アイコンを右クリックすると、${SHORTCUT_NAMES}にすぐ行けます。`;
  if (platform === "ios") return "ホーム画面のアイコンから 1 回で、アプリのように全画面で開けます。";
  return "アプリのように全画面で開けます。";
}

# エイム記録と成長グラフ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/aim` の下に「あなたの記録」(連続日数・最高記録・直近 30 日の自己ベストの点数と正確さの折れ線)を出す。

**Architecture:** 記録の計算はすべて純粋な関数(`src/lib/aim/history.ts`・`src/lib/aim/history-chart.ts`)にまとめ、Vitest で確かめる。ブラウザの記録は localStorage(`robilab:aimHistory`)、ログインしていればサーバーの今の表 `aim_scores` を新しい関数 `my_aim_history` で読み、日付ごとに高いほうを使う。画面は `src/components/aim/AimHistory.tsx`(自作の SVG)で、`AimClient.tsx` から置く。

**Tech Stack:** TypeScript / Next.js 16 / React 19 / Tailwind / Supabase / Vitest(新しい道具は足さない)

**Spec:** `docs/superpowers/specs/2026-10-01-aim-history-design.md`

## Global Constraints

- 新しいライブラリは入れない(グラフは自作の SVG)。
- 画面の文言・コメントは日本語。既存のコードの書き方(短いコメント、Tailwind の `var(--rl-*)` の色)にそろえる。
- 日付はすべて日本時間の `YYYY-MM-DD`。日付の足し引きは UTC の日付として行い、端末のタイムゾーンに左右されない。
- localStorage のキーは `robilab:aimHistory`、中身は `{ "v": 1, "days": { "YYYY-MM-DD": { "score", "accuracy", "timeMs" } } }`、最大 400 日。
- 点数は `computeScore(accuracy, timeMs, strokes)`(`src/lib/aim/trace.ts`)で出す。正確さは小数 2 桁に丸めて保存する。
- 押してほしい色(`--rl-accent`)をグラフに使わない。線は `--rl-secondary`、今日の点は `--rl-highlight`。
- React 19 の lint:effect の中で同期的に setState しない。描画中に ref を読まない。
- 本番の Supabase(`bncjzilfehkjftzraajd`)には触らない。migration は dev(`hmipbsncbemuttxxxbqn`)にだけ、コントローラーが MCP で適用する。
- `.env*` を読まない。キー・トークンを書かない・出さない。
- コミットは `git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit`、最後の行に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus

1. 端末の時計がずれて、ブラウザに今日より先の日付の記録がある → 連続日数・最高記録・グラフのどれにも使わない(Task 1 のテスト)。
2. サーバーの `accuracy`(numeric)が文字列 `"97.50"` で返る → 数として扱う(Task 1 のテスト)。
3. localStorage の中身が手で書き換えられている(400 日を超える、型が違う、`NaN`)→ 読める日だけ使い、次の保存で 400 日に切り詰める(Task 1 のテスト)。
4. 遊んだ日が 1 日だけ・30 日すべて・前後が空いた 1 日 → 線にならない日は点だけを描く(Task 2 のテスト)。
5. 0 点・10,000 点・上限を超える値 → グラフの枠の外に出ない(Task 2 のテスト)。

---

### Task 1: 記録の計算(`src/lib/aim/history.ts`)

**Files:**
- Create: `src/lib/aim/history.ts`
- Test: `tests/lib/aim-history.test.ts`

**Interfaces:**
- Consumes: `SettingsStorage`(`src/lib/my-settings-store.ts` の `Pick<Storage, "getItem" | "setItem" | "removeItem">`)
- Produces:
  - `type AimDay = { score: number; accuracy: number; timeMs: number }`
  - `type AimDays = Record<string, AimDay>`
  - `type AimHistoryRow = { play_date: string; score: number; accuracy: number | string; time_ms: number }`
  - `HISTORY_KEY = "robilab:aimHistory"`, `HISTORY_MAX_DAYS = 400`
  - `addDays(date: string, n: number): string`
  - `loadHistory(storage: SettingsStorage | null): AimDays`
  - `recordLocal(storage: SettingsStorage | null, date: string, day: AimDay): boolean`
  - `clearLocal(storage: SettingsStorage | null): void`
  - `serverRowsToDays(rows: AimHistoryRow[] | null): AimDays`
  - `mergeHistory(local: AimDays, server: AimDays): AimDays`
  - `streakDays(days: AimDays, today: string): number`
  - `lastNDays(days: AimDays, today: string, n: number): { date: string; day: AimDay | null }[]`
  - `bestDay(days: AimDays, today: string): { date: string; day: AimDay } | null`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/aim-history.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  HISTORY_KEY, addDays, loadHistory, recordLocal, clearLocal, serverRowsToDays,
  mergeHistory, streakDays, lastNDays, bestDay, type AimDays,
} from "@/lib/aim/history";

function memStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    raw: m,
  };
}
const day = (score: number, accuracy = 90, timeMs = 10000) => ({ score, accuracy, timeMs });

describe("addDays", () => {
  it("adds and subtracts across month and year ends", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-10-01", -399)).toBe("2025-08-28");
  });
});

describe("browser history", () => {
  it("records the first day and only overwrites with a higher score", () => {
    const s = memStorage();
    expect(recordLocal(s, "2026-10-01", day(5000, 80.123))).toBe(true);
    expect(loadHistory(s)["2026-10-01"]).toEqual({ score: 5000, accuracy: 80.12, timeMs: 10000 });
    expect(recordLocal(s, "2026-10-01", day(4000))).toBe(false);
    expect(recordLocal(s, "2026-10-01", day(5000, 99))).toBe(false);
    expect(recordLocal(s, "2026-10-01", day(6000, 70))).toBe(true);
    expect(loadHistory(s)["2026-10-01"].score).toBe(6000);
    expect(JSON.parse(s.raw.get(HISTORY_KEY)!).v).toBe(1);
  });

  it("keeps only the newest 400 days", () => {
    const days: AimDays = {};
    for (let i = 0; i < 400; i++) days[addDays("2026-10-01", -i)] = day(100);
    const s = memStorage({ [HISTORY_KEY]: JSON.stringify({ v: 1, days }) });
    expect(recordLocal(s, "2026-10-02", day(200))).toBe(true);
    const after = loadHistory(s);
    expect(Object.keys(after)).toHaveLength(400);
    expect(after[addDays("2026-10-01", -399)]).toBeUndefined();
    expect(after["2026-10-02"].score).toBe(200);
  });

  it("drops malformed days and survives broken JSON or missing storage", () => {
    const s = memStorage({ [HISTORY_KEY]: JSON.stringify({ v: 1, days: {
      "2026-10-01": day(100),
      "2026-13-01": day(100),
      "bad": day(100),
      "2026-09-30": { score: 10001, accuracy: 50, timeMs: 1 },
      "2026-09-29": { score: 1.5, accuracy: 50, timeMs: 1 },
      "2026-09-28": { score: 10, accuracy: 101, timeMs: 1 },
      "2026-09-27": { score: 10, accuracy: 50, timeMs: 0 },
      "2026-09-26": { score: 10, accuracy: "50", timeMs: 1 },
      "2026-09-25": null,
    } }) });
    expect(Object.keys(loadHistory(s))).toEqual(["2026-10-01"]);
    expect(loadHistory(memStorage({ [HISTORY_KEY]: "{" }))).toEqual({});
    expect(loadHistory(memStorage({ [HISTORY_KEY]: JSON.stringify({ v: 2, days: {} }) }))).toEqual({});
    expect(loadHistory(null)).toEqual({});
    expect(recordLocal(null, "2026-10-01", day(1))).toBe(false);
    expect(recordLocal(memStorage(), "2026-10-01", { score: Number.NaN, accuracy: 1, timeMs: 1 })).toBe(false);
  });

  it("returns false when the storage refuses to save", () => {
    const s = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    expect(recordLocal(s, "2026-10-01", day(1))).toBe(false);
  });

  it("clears only the history key", () => {
    const s = memStorage({ [HISTORY_KEY]: JSON.stringify({ v: 1, days: { "2026-10-01": day(1) } }), other: "x" });
    clearLocal(s);
    expect(s.raw.has(HISTORY_KEY)).toBe(false);
    expect(s.raw.get("other")).toBe("x");
    expect(() => clearLocal(null)).not.toThrow();
  });
});

describe("server rows and merge", () => {
  it("converts rows, accepting numeric accuracy as a string and dropping bad rows", () => {
    expect(serverRowsToDays([
      { play_date: "2026-10-01", score: 5000, accuracy: "97.50", time_ms: 8000 },
      { play_date: "2026-09-30", score: -1, accuracy: 50, time_ms: 8000 },
    ])).toEqual({ "2026-10-01": { score: 5000, accuracy: 97.5, timeMs: 8000 } });
    expect(serverRowsToDays(null)).toEqual({});
  });

  it("keeps the higher score per day and prefers the server on ties", () => {
    const merged = mergeHistory(
      { "2026-10-01": day(5000, 80), "2026-09-30": day(3000, 70), "2026-09-29": day(100) },
      { "2026-10-01": day(4000, 99), "2026-09-30": day(3000, 95), "2026-09-28": day(200) },
    );
    expect(merged["2026-10-01"]).toEqual(day(5000, 80));
    expect(merged["2026-09-30"]).toEqual(day(3000, 95));
    expect(merged["2026-09-29"].score).toBe(100);
    expect(merged["2026-09-28"].score).toBe(200);
  });
});

describe("streak, last days, best", () => {
  const today = "2026-10-01";
  const run = (from: string, n: number): AimDays => {
    const d: AimDays = {};
    for (let i = 0; i < n; i++) d[addDays(from, -i)] = day(100);
    return d;
  };

  it("counts from today, or from yesterday when today is not played yet", () => {
    expect(streakDays(run(today, 3), today)).toBe(3);
    expect(streakDays(run("2026-09-30", 4), today)).toBe(4);
    expect(streakDays(run("2026-09-29", 5), today)).toBe(0);
    expect(streakDays({}, today)).toBe(0);
    expect(streakDays({ ...run(today, 2), "2026-09-28": day(1) }, today)).toBe(2);
    expect(streakDays(run(today, 45), today)).toBe(45);
    expect(streakDays(run("2027-01-02", 5), "2027-01-02")).toBe(5);
  });

  it("ignores days after today", () => {
    const d = { ...run(today, 2), [today]: day(500), "2026-10-05": day(9999) };
    expect(streakDays(d, today)).toBe(2);
    expect(bestDay(d, today)?.date).toBe(today);
    expect(lastNDays(d, today, 30).some((x) => x.date === "2026-10-05")).toBe(false);
  });

  it("returns exactly n slots, oldest first, ending today", () => {
    const d = { [today]: day(1), "2026-09-02": day(2), "2026-09-01": day(3) };
    const slots = lastNDays(d, today, 30);
    expect(slots).toHaveLength(30);
    expect(slots[0]).toEqual({ date: "2026-09-02", day: day(2) });
    expect(slots[29]).toEqual({ date: today, day: day(1) });
    expect(slots.filter((s) => s.day).length).toBe(2);
  });

  it("picks the best score of all days, older day on ties", () => {
    expect(bestDay({}, today)).toBeNull();
    expect(bestDay({ "2025-01-01": day(9000), [today]: day(9000), "2026-09-30": day(100) }, today))
      .toEqual({ date: "2025-01-01", day: day(9000) });
  });
});
```

- [ ] **Step 2: テストが失敗するのを確かめる**

Run: `npx vitest run tests/lib/aim-history.test.ts`
Expected: FAIL(`@/lib/aim/history` が見つからない)

- [ ] **Step 3: 実装を書く**

`src/lib/aim/history.ts`:

```ts
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
```

- [ ] **Step 4: テストが通るのを確かめる**

Run: `npx vitest run tests/lib/aim-history.test.ts`
Expected: PASS(全件)

- [ ] **Step 5: コミット**

```bash
git add src/lib/aim/history.ts tests/lib/aim-history.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: エイム記録の計算(ブラウザの記録・合わせ方・連続日数・最高記録)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: グラフの点の計算(`src/lib/aim/history-chart.ts`)

**Files:**
- Create: `src/lib/aim/history-chart.ts`
- Test: `tests/lib/aim-history-chart.test.ts`

**Interfaces:**
- Consumes: なし(数の配列だけを受け取る)
- Produces:
  - `CHART_W = 300`, `CHART_H = 100`, `CHART_PAD = 6`
  - `type ChartPoint = { x: number; y: number; index: number }`
  - `type ChartGeometry = { lines: string[]; dots: ChartPoint[]; today: ChartPoint | null }`
  - `buildChart(values: (number | null)[], max: number): ChartGeometry`
    - `lines`:2 点以上続く区間ごとの `<polyline points>` の文字列(`"x,y x,y"`、小数 1 桁)
    - `dots`:前後に遊んだ日がない日(1 点だけの区間)
    - `today`:最後の値(今日)があればその点、なければ `null`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/aim-history-chart.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildChart, CHART_W, CHART_H, CHART_PAD } from "@/lib/aim/history-chart";

describe("buildChart", () => {
  it("maps 0 to the bottom and max to the top, first slot left and last slot right", () => {
    const g = buildChart([0, 10000], 10000);
    expect(g.lines).toEqual([`${CHART_PAD},${CHART_H - CHART_PAD} ${CHART_W - CHART_PAD},${CHART_PAD}`]);
    expect(g.today).toEqual({ x: CHART_W - CHART_PAD, y: CHART_PAD, index: 1 });
  });

  it("breaks the line on missing days and draws lone days as dots", () => {
    const g = buildChart([1, 2, null, 3, null, 4, 5], 10);
    expect(g.lines).toHaveLength(2);
    expect(g.dots.map((d) => d.index)).toEqual([3]);
    expect(g.today?.index).toBe(6);
  });

  it("has no today point when today is not played", () => {
    expect(buildChart([1, null], 10).today).toBeNull();
    expect(buildChart([null, null], 10)).toEqual({ lines: [], dots: [], today: null });
  });

  it("draws a single played day (only slot) as a dot", () => {
    const g = buildChart([null, null, 5], 10);
    expect(g.lines).toEqual([]);
    expect(g.dots.map((d) => d.index)).toEqual([2]);
  });

  it("clamps values outside 0..max into the frame", () => {
    const g = buildChart([-5, 20], 10);
    const ys = g.lines[0].split(" ").map((p) => Number(p.split(",")[1]));
    expect(ys).toEqual([CHART_H - CHART_PAD, CHART_PAD]);
  });

  it("keeps every point inside the frame for 30 full days", () => {
    const g = buildChart(Array.from({ length: 30 }, (_, i) => i * 400), 10000);
    expect(g.lines).toHaveLength(1);
    for (const p of g.lines[0].split(" ")) {
      const [x, y] = p.split(",").map(Number);
      expect(x).toBeGreaterThanOrEqual(CHART_PAD);
      expect(x).toBeLessThanOrEqual(CHART_W - CHART_PAD);
      expect(y).toBeGreaterThanOrEqual(CHART_PAD);
      expect(y).toBeLessThanOrEqual(CHART_H - CHART_PAD);
    }
  });
});
```

- [ ] **Step 2: テストが失敗するのを確かめる**

Run: `npx vitest run tests/lib/aim-history-chart.test.ts`
Expected: FAIL(`@/lib/aim/history-chart` が見つからない)

- [ ] **Step 3: 実装を書く**

`src/lib/aim/history-chart.ts`:

```ts
// 「あなたの記録」の折れ線の点(SVG の viewBox 0 0 CHART_W CHART_H)
export const CHART_W = 300;
export const CHART_H = 100;
export const CHART_PAD = 6;

export type ChartPoint = { x: number; y: number; index: number };
export type ChartGeometry = { lines: string[]; dots: ChartPoint[]; today: ChartPoint | null };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 遊ばなかった日(null)で線を切る。1 点だけの区間は点として描く */
export function buildChart(values: (number | null)[], max: number): ChartGeometry {
  const n = values.length;
  const step = n > 1 ? (CHART_W - 2 * CHART_PAD) / (n - 1) : 0;
  const point = (v: number, i: number): ChartPoint => {
    const t = Math.min(1, Math.max(0, v / max));
    return { x: r1(CHART_PAD + i * step), y: r1(CHART_PAD + (1 - t) * (CHART_H - 2 * CHART_PAD)), index: i };
  };
  const lines: string[] = [];
  const dots: ChartPoint[] = [];
  let run: ChartPoint[] = [];
  const flush = () => {
    if (run.length === 1) dots.push(run[0]);
    else if (run.length > 1) lines.push(run.map((p) => `${p.x},${p.y}`).join(" "));
    run = [];
  };
  values.forEach((v, i) => {
    if (v === null) flush();
    else run.push(point(v, i));
  });
  flush();
  const last = values[n - 1];
  return { lines, dots, today: n > 0 && last !== null && last !== undefined ? point(last, n - 1) : null };
}
```

- [ ] **Step 4: テストが通るのを確かめる**

Run: `npx vitest run tests/lib/aim-history-chart.test.ts`
Expected: PASS(全件)

- [ ] **Step 5: コミット**

```bash
git add src/lib/aim/history-chart.ts tests/lib/aim-history-chart.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: エイム記録のグラフの点を計算する" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: サーバーの関数 `my_aim_history`(migration 1800)

**Files:**
- Create: `supabase/migrations/20261001001800_aim_history.sql`
- Create: `tests/data/aim-history-sql.test.ts`
- Modify: `tests/rls/aim.rls.test.ts`(末尾に describe を足す)
- Modify: `docs/ops/launch.md`(37 行目・50 行目のあと・122 行目)

**Interfaces:**
- Consumes: 表 `public.aim_scores`、関数 `public._aim_today()`(1400)。Task 1 の `addDays`(RLS テストで使う)
- Produces: RPC `my_aim_history(p_from date)` → 行 `{ play_date: string; score: number; accuracy: number; time_ms: number }[]`(日付の順、最大 400 行)。ログインしていなければエラー `NOT_LOGGED_IN`

- [ ] **Step 1: 失敗するテストを書く(SQL の文面)**

`tests/data/aim-history-sql.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// エイム記録(1800、plan.md D43):自分の行だけ、4 列だけ、ログインした人だけ
const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20261001001800_aim_history.sql"), "utf8")
  .replace(/--[^\n]*/g, "");

describe("my_aim_history (1800)", () => {
  it("is security definer with a fixed search_path", () => {
    expect(sql).toMatch(/function public\.my_aim_history\(p_from date\)/);
    expect(sql).toMatch(/security definer/);
    expect(sql).toMatch(/set search_path = public/);
  });
  it("returns only the caller's rows, four columns, within 400 days up to today", () => {
    expect(sql).toMatch(/raise exception 'NOT_LOGGED_IN'/);
    expect(sql).toMatch(/s\.user_id = v_uid/);
    expect(sql).toMatch(/returns table \(play_date date, score int, accuracy numeric, time_ms int\)/);
    expect(sql).toMatch(/v_today - 399/);
    expect(sql).toMatch(/s\.play_date <= v_today/);
    expect(sql).toMatch(/limit 400/);
  });
  it("is callable only by authenticated users", () => {
    expect(sql).toMatch(/revoke all on function public\.my_aim_history\(date\) from public, anon;/);
    expect(sql).toMatch(/grant execute on function public\.my_aim_history\(date\) to authenticated;/);
  });
});
```

- [ ] **Step 2: テストが失敗するのを確かめる**

Run: `npx vitest run tests/data/aim-history-sql.test.ts`
Expected: FAIL(ファイルがない)

- [ ] **Step 3: migration を書く**

`supabase/migrations/20261001001800_aim_history.sql`:

```sql
-- エイム記録と成長グラフ(plan.md D43)
-- 自分の自己ベスト(aim_scores、1 人 1 日 1 行)だけを、今日から 400 日前までの範囲で日付の順に返す。
-- 返すのは日付・点数・正確さ・時間だけ(char_id・submitted_at は返さない)。
-- 利用停止・BAN の人も自分の記録は読める(ほかの人には何も見えないため)。
create or replace function public.my_aim_history(p_from date)
returns table (play_date date, score int, accuracy numeric, time_ms int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_today date := public._aim_today();
begin
  if v_uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  return query
    select s.play_date, s.score, s.accuracy, s.time_ms
    from public.aim_scores s
    where s.user_id = v_uid
      and s.play_date >= greatest(coalesce(p_from, v_today - 399), v_today - 399)
      and s.play_date <= v_today
    order by s.play_date
    limit 400;
end $$;

revoke all on function public.my_aim_history(date) from public, anon;
grant execute on function public.my_aim_history(date) to authenticated;
```

- [ ] **Step 4: テストが通るのを確かめる**

Run: `npx vitest run tests/data/aim-history-sql.test.ts`
Expected: PASS

- [ ] **Step 5: RLS テストを足す**

`tests/rls/aim.rls.test.ts` の import に `import { addDays } from "@/lib/aim/history";` を足し、ファイルの末尾に次を足す(`admin`・`makeUser`・`anon`・`today`・`errorCode` は既存のもの):

```ts
describe("my_aim_history", () => {
  const row = (user_id: string, play_date: string, score: number) =>
    ({ user_id, play_date, char_id: "u91ce", accuracy: 80, time_ms: 9000, score });

  it("returns only the caller's rows with four columns, within 400 days up to today", async () => {
    const a = await makeUser({ register: false });
    const b = await makeUser({ register: false });
    const t = today();
    const { error } = await admin.from("aim_scores").insert([
      row(a.id, t, 5000),
      row(a.id, addDays(t, -1), 4000),
      row(a.id, addDays(t, -400), 3000),
      row(a.id, addDays(t, 1), 9999),
      row(b.id, t, 7000),
    ]);
    expect(error).toBeNull();
    const { data, error: e2 } = await a.client!.rpc("my_aim_history", { p_from: addDays(t, -1000) });
    expect(e2).toBeNull();
    const rows = data as Record<string, unknown>[];
    expect(rows.map((r) => r.play_date)).toEqual([addDays(t, -1), t]);
    expect(rows.map((r) => r.score)).toEqual([4000, 5000]);
    expect(Object.keys(rows[0]).sort()).toEqual(["accuracy", "play_date", "score", "time_ms"]);
  });

  it("respects p_from inside the 400-day window", async () => {
    const a = await makeUser({ register: false });
    const t = today();
    await admin.from("aim_scores").insert([row(a.id, t, 5000), row(a.id, addDays(t, -10), 4000)]);
    const { data } = await a.client!.rpc("my_aim_history", { p_from: addDays(t, -5) });
    expect((data as { play_date: string }[]).map((r) => r.play_date)).toEqual([t]);
  });

  it("cannot be called without logging in", async () => {
    const { error } = await anon().rpc("my_aim_history", { p_from: today() });
    expect(error).not.toBeNull();
  });
});
```

(RLS テストは dev の DB が要る。実装者は実行しなくてよい。コントローラーが migration を dev に適用してから `npx vitest run -c vitest.rls.config.ts tests/rls/aim.rls.test.ts` で確かめる。)

- [ ] **Step 6: launch.md を更新する**

`docs/ops/launch.md` を次のとおり直す:
- 37 行目の `0500〜1700` → `0500〜1800`
- 50 行目(`20261001001700_report_review.sql` の項目)のすぐ下に、同じ字下げで 1 行足す:
  `   - [ ] \`supabase/migrations/20261001001800_aim_history.sql\`(エイム記録と成長グラフ:自分の記録を読む関数 \`my_aim_history\`。これがないと \`/aim\` の「あなたの記録」にサーバーの記録が出ない(ブラウザの記録だけで出る))`
- 122 行目の `0500〜1700` → `0500〜1800`

ほかに `1700` までと書いてある「適用する範囲」の表記が見つかれば、同じく `1800` にそろえる(`grep -n "0500〜1700" docs/ops/*.md docs/ops/owner-review.md plan.md` で確かめる。plan.md の進捗ログの過去の行は直さない)。

- [ ] **Step 7: 全部のテストを流してコミット**

Run: `npx vitest run`
Expected: PASS(全件)

```bash
git add supabase/migrations/20261001001800_aim_history.sql tests/data/aim-history-sql.test.ts tests/rls/aim.rls.test.ts docs/ops/launch.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: 自分のエイム記録を読む my_aim_history(migration 1800)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 「あなたの記録」の画面と `/aim` へのつなぎ込み

**Files:**
- Create: `src/components/aim/AimHistory.tsx`
- Modify: `src/app/aim/AimClient.tsx`

**Interfaces:**
- Consumes:
  - Task 1:`AimDays`、`loadHistory`、`recordLocal`、`clearLocal`、`serverRowsToDays`、`mergeHistory`、`streakDays`、`lastNDays`、`bestDay`、`addDays`、`AimHistoryRow`
  - Task 2:`buildChart`、`CHART_W`、`CHART_H`
  - Task 3:RPC `my_aim_history(p_from)`
  - 既存:`computeScore`(`src/lib/aim/trace.ts`)、`browserStorage`(`src/lib/my-settings-store.ts`)、`errorCodeOf`(`src/lib/lobby-errors.ts`)
- Produces:`AimHistory` 部品(props は下のとおり)

- [ ] **Step 1: `AimHistory.tsx` を書く**

`src/components/aim/AimHistory.tsx`:

```tsx
import { bestDay, lastNDays, streakDays, type AimDays } from "@/lib/aim/history";
import { buildChart, CHART_H, CHART_W } from "@/lib/aim/history-chart";

const DAYS = 30;
const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const jpDate = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
const fmt = (n: number) => n.toLocaleString("ja-JP");

function Chart({ title, label, values, max, from, to }: {
  title: string; label: string; values: (number | null)[]; max: number; from: string; to: string;
}) {
  const g = buildChart(values, max);
  return (
    <figure className="grid gap-1">
      <figcaption className="text-xs text-[var(--rl-muted)]">{title}</figcaption>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-auto w-full rounded-lg bg-[var(--rl-card)]" role="img" aria-label={label}>
        {g.lines.map((pts) => (
          <polyline key={pts} points={pts} fill="none" stroke="var(--rl-secondary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {g.dots.map((p) => <circle key={p.index} cx={p.x} cy={p.y} r={2.5} fill="var(--rl-secondary)" />)}
        {g.today && <circle cx={g.today.x} cy={g.today.y} r={4.5} fill="var(--rl-highlight)" />}
      </svg>
      <div className="flex justify-between text-xs text-[var(--rl-muted)]"><span>{md(from)}</span><span>{md(to)}</span></div>
    </figure>
  );
}

export function AimHistory({ days, today, loggedIn, serverError, canClear, onClear }: {
  days: AimDays; today: string; loggedIn: boolean; serverError: boolean; canClear: boolean; onClear: () => void;
}) {
  const slots = lastNDays(days, today, DAYS);
  const played = slots.filter((s) => s.day);
  const streak = streakDays(days, today);
  const best = bestDay(days, today);
  const clear = () => {
    if (window.confirm("この端末のエイムの記録を消しますか?")) onClear();
  };

  return (
    <section className="grid gap-3">
      <h2 className="font-bold">あなたの記録</h2>
      {serverError && <p className="text-xs text-[var(--rl-muted)]">サーバーの記録を読めませんでした</p>}
      {!best ? (
        <p className="text-sm text-[var(--rl-muted)]">遊ぶと、ここに毎日の記録が残ります</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            {streak > 0 && <span>🔥 <b className="text-[var(--rl-highlight)]">{streak}日連続</b></span>}
            <span>最高 <b className="font-[family-name:var(--font-display)]">{fmt(best.day.score)}</b> 点({jpDate(best.date)})</span>
          </div>
          <Chart
            title="自己ベストの点数(直近30日)"
            label={`直近30日の自己ベストの点数。遊んだ日 ${played.length} 日、最高 ${fmt(Math.max(0, ...played.map((s) => s.day!.score)))} 点`}
            values={slots.map((s) => s.day?.score ?? null)} max={10000} from={slots[0].date} to={today}
          />
          <Chart
            title="正確さ(直近30日)"
            label={`直近30日の正確さ。遊んだ日 ${played.length} 日、最高 ${Math.max(0, ...played.map((s) => s.day!.accuracy))}%`}
            values={slots.map((s) => s.day?.accuracy ?? null)} max={100} from={slots[0].date} to={today}
          />
        </>
      )}
      {canClear && (
        <p className="text-xs text-[var(--rl-muted)]">
          <button type="button" onClick={clear} className="underline">この端末の記録を消す</button>
          {loggedIn && <span className="ml-2">サーバーの記録は残ります(退会すると消えます)</span>}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: `AimClient.tsx` につなぐ**

`src/app/aim/AimClient.tsx` を次のとおり直す。

(a) import を足す:

```tsx
import { computeScore } from "@/lib/aim/trace";
import { addDays, clearLocal, loadHistory, mergeHistory, recordLocal, serverRowsToDays, type AimDays, type AimHistoryRow } from "@/lib/aim/history";
import { AimHistory } from "@/components/aim/AimHistory";
```

(b) `const [mine, setMine] = ...` の下に state を足す:

```tsx
  const [historyRev, setHistoryRev] = useState(0);
  const [serverDays, setServerDays] = useState<AimDays | null>(null);
  const [serverError, setServerError] = useState(false);
```

(c) `const crosshair = ...` の下に、表示に使う記録を足す(ブラウザの記録は描画のたびに読む。`settingsRev` と同じやり方):

```tsx
  void historyRev;
  const localDays = isClient ? loadHistory(browserStorage()) : {};
  // ログアウトしたらサーバーの記録は使わない(effect の中で setState しないよう、ここで外す)
  const days = loggedIn && serverDays ? mergeHistory(localDays, serverDays) : localDays;
```

(d) `refreshMine` の `useEffect` の下に、サーバーの記録を読む関数を足す:

```tsx
  // 連続日数を 30 日より長く数えられるよう、400 日分を読む(グラフは直近 30 日だけ)
  const refreshHistory = useCallback(() => {
    if (!loggedIn) return;
    createSupabaseBrowser().rpc("my_aim_history", { p_from: addDays(date, -399) }).then(({ data, error }) => {
      if (error) {
        // ログインが切れていたらブラウザの記録だけで出す(メッセージは出さない)
        if (errorCodeOf(error) === "NOT_LOGGED_IN") { setServerDays(null); setServerError(false); }
        else setServerError(true);
        return;
      }
      setServerDays(serverRowsToDays(data as AimHistoryRow[] | null));
      setServerError(false);
    });
  }, [loggedIn, date]);
  useEffect(() => { refreshHistory(); }, [refreshHistory]);
```

(e) `submit` の成功のところ(`refreshMine();` の次の行)に `refreshHistory();` を足し、`useCallback` の依存配列に `refreshHistory` を足す:

```tsx
      refreshMine();
      refreshHistory();
      router.refresh();
```
```tsx
  }, [loggedIn, date, char, refreshMine, refreshHistory, router]);
```

(f) 遊び終えたときにブラウザへ記録する。`onFinish` を次に置き換える:

```tsx
            onFinish={(r) => {
              recordLocal(browserStorage(), date, { score: computeScore(r.accuracy, r.timeMs, char.strokes.length), accuracy: r.accuracy, timeMs: r.timeMs });
              setHistoryRev((n) => n + 1);
              setResult(r);
              void submit(r);
            }}
```

(g) `return` の中で、ランキングの前に「あなたの記録」を置く:

```tsx
  return (
    <>
      {play}
      {isClient && (
        <AimHistory days={days} today={date} loggedIn={loggedIn} serverError={loggedIn && serverError}
          canClear={Object.keys(localDays).length > 0}
          onClear={() => { clearLocal(browserStorage()); setHistoryRev((n) => n + 1); }} />
      )}
      <Ranking rows={rows} mine={mine} loggedIn={loggedIn} />
    </>
  );
```

- [ ] **Step 3: 型・lint・テスト・ビルドを確かめる**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: どれもエラーなし(lint の警告も、今回足した行からは出ない)

- [ ] **Step 4: コミット**

```bash
git add src/components/aim/AimHistory.tsx src/app/aim/AimClient.tsx
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: /aim に「あなたの記録」(連続日数・最高記録・直近30日のグラフ)を出す" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## コントローラーが最後にやること(実装者の作業ではない)

1. migration 1800 を dev(`hmipbsncbemuttxxxbqn`)に MCP の `apply_migration` で適用し、`npx vitest run -c vitest.rls.config.ts tests/rls/aim.rls.test.ts` を流す。
2. `npm run build` のあと `robilab-prod-build`(port 3100)で `/aim` を開き、記録なしの文 → テスト用の記録を localStorage に入れてグラフ・連続日数・最高記録 → スマホの幅 → 「この端末の記録を消す」を確かめる。
3. 差分のセキュリティ監査(quick)。
4. plan.md の進捗ログを更新し、push。

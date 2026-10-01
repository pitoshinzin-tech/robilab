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

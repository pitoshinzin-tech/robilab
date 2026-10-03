import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DEVICE_RECORD_KEYS, clearDeviceRecords } from "@/lib/device-records";
import { HISTORY_KEY } from "@/lib/aim/history";
import { HINT_STORAGE_KEY } from "@/lib/pwa/install-hint";

function memStorage(init: Record<string, string> = {}) {
  const raw = new Map(Object.entries(init));
  return {
    raw,
    getItem: (k: string) => raw.get(k) ?? null,
    setItem: (k: string, v: string) => void raw.set(k, v),
    removeItem: (k: string) => void raw.delete(k),
  };
}

describe("退会のときに消すこの端末の記録", () => {
  it("エイムの記録とホーム画面に追加の案内の記録を消し、ほかは残す", () => {
    expect(DEVICE_RECORD_KEYS).toEqual([HISTORY_KEY, HINT_STORAGE_KEY]);
    const s = memStorage({ [HISTORY_KEY]: "h", [HINT_STORAGE_KEY]: "p", other: "x" });
    clearDeviceRecords(s);
    expect(s.raw.has(HISTORY_KEY)).toBe(false);
    expect(s.raw.has(HINT_STORAGE_KEY)).toBe(false);
    expect(s.raw.get("other")).toBe("x");
  });
  it("戻す(退会できなかったとき)と、あったものだけ元の値に戻る", () => {
    const s = memStorage({ [HINT_STORAGE_KEY]: '{"v":1,"days":[],"dismissed":true}' });
    const restore = clearDeviceRecords(s);
    expect(s.raw.size).toBe(0);
    restore();
    expect(s.raw.get(HINT_STORAGE_KEY)).toBe('{"v":1,"days":[],"dismissed":true}');
    expect(s.raw.has(HISTORY_KEY)).toBe(false);
  });
  it("storage が無い・投げるときも落ちない", () => {
    expect(() => clearDeviceRecords(null)()).not.toThrow();
    const bad = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); }, removeItem: () => { throw new Error("x"); } };
    expect(() => clearDeviceRecords(bad)()).not.toThrow();
  });
  it("退会の操作がこの関数を使う", () => {
    const src = readFileSync("src/app/lobby/me/DeleteAccount.tsx", "utf8");
    expect(src).toContain("clearDeviceRecords(");
    expect(src).not.toContain("HISTORY_KEY");
  });
});

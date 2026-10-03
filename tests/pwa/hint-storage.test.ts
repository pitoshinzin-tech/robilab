import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { openHintStorage, recordInstalled } from "@/lib/pwa/hint-storage";
import { HINT_STORAGE_KEY, hintView } from "@/lib/pwa/install-hint";
import { createInstallPromptStore } from "@/lib/pwa/install-prompt";

function memStorage(init: Record<string, string> = {}) {
  const raw = new Map(Object.entries(init));
  return { raw, getItem: (k: string) => raw.get(k) ?? null, setItem: (k: string, v: string) => void raw.set(k, v), removeItem: (k: string) => void raw.delete(k) };
}

describe("recordInstalled(インストールしたら二度と出さない、をどのページでも残す)", () => {
  it("記録がなくても dismissed を書き、次の日の /aim でカードが出ない", () => {
    const s = memStorage();
    recordInstalled(s);
    expect(JSON.parse(s.raw.get(HINT_STORAGE_KEY)!)).toEqual({ v: 1, days: [], dismissed: true });
    const v = hintView({ place: "aim", platform: "android", stored: s.raw.get(HINT_STORAGE_KEY)!, today: "2026-10-05" });
    expect(v.show).toBe(false);
  });
  it("来訪日は残し、dismissed だけ立てる(今の形に合わせる)", () => {
    const s = memStorage({ [HINT_STORAGE_KEY]: JSON.stringify({ v: 1, days: ["2026-10-01", "2026-10-02"], dismissed: false }) });
    recordInstalled(s);
    expect(JSON.parse(s.raw.get(HINT_STORAGE_KEY)!)).toEqual({ v: 1, days: ["2026-10-01", "2026-10-02"], dismissed: true });
  });
  it("storage が無い・投げるときも落ちない", () => {
    expect(() => recordInstalled(null)).not.toThrow();
    const bad = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
    expect(() => recordInstalled(bad)).not.toThrow();
  });
});

describe("appinstalled を受けたときに記録する(layout の SwRegister。/my の「追加する」も、ブラウザのメニューからも)", () => {
  it("installPromptStore は appinstalled で onInstalled を 1 回呼ぶ", () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    const onInstalled = vi.fn();
    store.start(target, onInstalled);
    target.dispatchEvent(new Event("appinstalled"));
    expect(onInstalled).toHaveBeenCalledTimes(1);
    expect(store.get().installed).toBe(true);
  });
  it("onInstalled が投げても、installed の知らせは止まらない", () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.start(target, () => { throw new Error("x"); });
    target.dispatchEvent(new Event("appinstalled"));
    expect(store.get().installed).toBe(true);
  });
  it("SwRegister が recordInstalled を渡す", () => {
    const src = readFileSync("src/components/pwa/SwRegister.tsx", "utf8");
    expect(src).toMatch(/installPromptStore\.start\(window, \(\) => recordInstalled\(openHintStorage\(\)\)\)/);
  });
});

describe("openHintStorage(プライベートモードなど)", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("localStorage が投げるときは null", () => {
    vi.stubGlobal("window", { get localStorage(): Storage { throw new Error("SecurityError"); } });
    expect(openHintStorage()).toBeNull();
  });
  it("書き込みが投げるときも null", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => {} } });
    expect(openHintStorage()).toBeNull();
  });
  it("使えるときはそのまま返す", () => {
    const ls = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    vi.stubGlobal("window", { localStorage: ls });
    expect(openHintStorage()).toBe(ls);
  });
});

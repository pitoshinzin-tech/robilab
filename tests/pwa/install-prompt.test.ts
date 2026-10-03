import { describe, it, expect, vi } from "vitest";
import { createInstallPromptStore, SERVER_SNAPSHOT, type InstallPromptEvent } from "@/lib/pwa/install-prompt";

const promptEvent = (impl: () => Promise<unknown> = async () => ({ outcome: "accepted" })) =>
  Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(impl) }) as InstallPromptEvent & { prompt: ReturnType<typeof vi.fn> };

describe("installPromptStore(読み替え 4)", () => {
  it("はじめは何もない(サーバーの値と同じ形)", () => {
    const store = createInstallPromptStore();
    expect(store.get()).toEqual({ event: null, installed: false });
    expect(SERVER_SNAPSHOT).toEqual({ event: null, installed: false });
  });
  it("beforeinstallprompt を持ち、知らせる。preventDefault はしない(ブラウザ自身の案内を消さない)", () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    const fn = vi.fn();
    store.subscribe(fn);
    store.start(target);
    const ev = promptEvent();
    target.dispatchEvent(ev);
    expect(store.get().event).toBe(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("start を 2 回呼んでも耳は 1 組だけ", () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    const fn = vi.fn();
    store.subscribe(fn);
    store.start(target);
    store.start(target);
    target.dispatchEvent(promptEvent());
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("prompt() は 1 回だけ使い、使ったら手放す", async () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.start(target);
    const ev = promptEvent();
    target.dispatchEvent(ev);
    await store.prompt();
    await store.prompt();
    expect(ev.prompt).toHaveBeenCalledTimes(1);
    expect(store.get().event).toBeNull();
  });
  it("prompt() が失敗しても投げない", async () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.start(target);
    target.dispatchEvent(promptEvent(async () => { throw new Error("NotAllowedError"); }));
    await expect(store.prompt()).resolves.toBeUndefined();
  });
  it("appinstalled でインストール済みにし、prompt を手放す", () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    store.start(target);
    target.dispatchEvent(promptEvent());
    target.dispatchEvent(new Event("appinstalled"));
    expect(store.get()).toEqual({ event: null, installed: true });
  });
  it("subscribe の戻り値で外すと、もう知らせない", () => {
    const store = createInstallPromptStore();
    const target = new EventTarget();
    const fn = vi.fn();
    const off = store.subscribe(fn);
    store.start(target);
    off();
    target.dispatchEvent(promptEvent());
    expect(fn).not.toHaveBeenCalled();
  });
});

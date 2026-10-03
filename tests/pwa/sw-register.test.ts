import { describe, it, expect, vi } from "vitest";
import { SW_URL, scheduleSwRegister, type SwRegisterEnv } from "@/lib/pwa/sw-register";

function env(over: Partial<SwRegisterEnv> = {}) {
  const register = vi.fn(async () => ({}));
  let onLoad: (() => void) | null = null;
  const cleanup = vi.fn();
  const e: SwRegisterEnv = {
    nodeEnv: "production",
    serviceWorker: { register },
    readyState: "complete",
    addLoadListener: vi.fn((fn: () => void) => { onLoad = fn; return cleanup; }),
    ...over,
  };
  return { e, register, cleanup, fireLoad: () => onLoad?.() };
}

describe("scheduleSwRegister(設計書 3-2)", () => {
  it.each(["development", "test", undefined])("本番のビルドでなければ登録しない(NODE_ENV=%s)", (nodeEnv) => {
    const { e, register } = env({ nodeEnv });
    scheduleSwRegister(e);
    expect(register).not.toHaveBeenCalled();
    expect(e.addLoadListener).not.toHaveBeenCalled();
  });
  it("serviceWorker の無いブラウザでは何もしない", () => {
    const { e } = env({ serviceWorker: undefined });
    expect(() => scheduleSwRegister(e)()).not.toThrow();
    expect(e.addLoadListener).not.toHaveBeenCalled();
  });
  it("読み込みが終わっていれば、すぐ /sw.js をスコープ / と updateViaCache none で登録する", () => {
    const { e, register } = env();
    scheduleSwRegister(e);
    expect(register).toHaveBeenCalledWith(SW_URL, { scope: "/", updateViaCache: "none" });
    expect(SW_URL).toBe("/sw.js");
  });
  it("読み込み中なら load を待ってから登録し、後片付けは load の耳を外す", () => {
    const { e, register, cleanup, fireLoad } = env({ readyState: "loading" });
    const dispose = scheduleSwRegister(e);
    expect(register).not.toHaveBeenCalled();
    fireLoad();
    expect(register).toHaveBeenCalledTimes(1);
    dispose();
    expect(cleanup).toHaveBeenCalled();
  });
  it("登録の失敗を外に投げない(画面に何も出さない)", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const { e } = env({ serviceWorker: { register: vi.fn(async () => { throw new Error("SecurityError"); }) } });
    scheduleSwRegister(e);
    await new Promise((r) => setTimeout(r, 0));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

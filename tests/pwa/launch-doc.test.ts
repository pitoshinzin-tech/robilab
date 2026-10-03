import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";

const DOC = readFileSync("docs/ops/launch.md", "utf8").replace(/\r\n/g, "\n"); // 取り出し方(CRLF)に左右されないように

describe("docs/ops/launch.md の service worker の止め方", () => {
  it("節がある", () => {
    expect(DOC).toContain("## service worker を止めるとき");
    expect(DOC).toContain("## アプリのアイコンを本物に差し替えるとき");
  });
  it("止める版の sw.js は、全部の robilab-* のキャッシュを消して登録を外し、fetch を持たない", async () => {
    const block = DOC.match(/```js sw-kill\n([\s\S]*?)```/);
    expect(block, "```js sw-kill のコードの段がない").not.toBeNull();
    const src = block![1];
    const handlers: Record<string, (e: unknown) => void> = {};
    const self = {
      addEventListener: (t: string, fn: (e: unknown) => void) => { handlers[t] = fn; },
      skipWaiting: vi.fn(async () => {}),
      registration: { unregister: vi.fn(async () => true) },
      clients: { matchAll: vi.fn(async () => [{ navigate: vi.fn(async () => {}), url: "https://robilab.example/" }]) },
    };
    const caches = { keys: vi.fn(async () => ["robilab-offline-v1", "robilab-offline-v2", "other"]), delete: vi.fn(async (key: string) => key.length > 0) };
    new Function("self", "caches", src)(self, caches);
    expect(Object.keys(handlers).sort()).toEqual(["activate", "install"]);
    let p: Promise<unknown> | undefined;
    handlers.install({ waitUntil: (x: Promise<unknown>) => { p = x; } });
    await p;
    expect(self.skipWaiting).toHaveBeenCalled();
    handlers.activate({ waitUntil: (x: Promise<unknown>) => { p = x; } });
    await p;
    expect(caches.delete.mock.calls.map((c) => c[0]).sort()).toEqual(["robilab-offline-v1", "robilab-offline-v2"]);
    expect(self.registration.unregister).toHaveBeenCalled();
  });
});

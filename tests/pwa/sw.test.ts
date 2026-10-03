import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const SRC = readFileSync("public/sw.js", "utf8");
const ORIGIN = "https://robilab.example";

type Req = { url: string; mode: string; method: string };
type Store = { addAll: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
type SwApi = { shouldHandle: (r: Req, origin: string) => boolean; CACHE: string; OFFLINE_URL: string; PRECACHE: string[] };

const nav = (path: string, init: Partial<Req> = {}): Req => ({ url: path.startsWith("http") ? path : `${ORIGIN}${path}`, mode: "navigate", method: "GET", ...init });

/** sw.js の文をそのまま、偽の self・caches・fetch で動かす(ビルドしない) */
function loadSw(opts: { fetchImpl?: () => Promise<Response>; offlinePage?: Response | undefined; existingKeys?: string[]; noPreload?: boolean } = {}) {
  const handlers: Record<string, (event: unknown) => void> = {};
  const stores = new Map<string, Store>();
  const caches = {
    open: vi.fn(async (name: string) => {
      if (!stores.has(name)) stores.set(name, { addAll: vi.fn(async () => {}), put: vi.fn(async () => {}) });
      return stores.get(name)!;
    }),
    keys: vi.fn(async () => opts.existingKeys ?? []),
    delete: vi.fn(async () => true),
    match: vi.fn(async (url: string) => (url === "/offline.html" ? opts.offlinePage : undefined)),
  };
  const self = {
    addEventListener: (type: string, fn: (event: unknown) => void) => { handlers[type] = fn; },
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
    registration: { navigationPreload: opts.noPreload ? undefined : { enable: vi.fn(async () => {}) } },
    location: { origin: ORIGIN },
  };
  const fetchFn = vi.fn(opts.fetchImpl ?? (async () => new Response("page", { status: 200 })));
  const api = new Function("self", "caches", "fetch", `${SRC}\n;return { shouldHandle, CACHE, OFFLINE_URL, PRECACHE };`)(self, caches, fetchFn) as SwApi;

  async function extendable(type: "install" | "activate") {
    let p: Promise<unknown> | undefined;
    handlers[type]({ waitUntil: (x: Promise<unknown>) => { p = x; } });
    await p;
  }
  function fetchEvent(request: Req, preload: Promise<Response | undefined> = Promise.resolve(undefined)) {
    let p: Promise<Response> | undefined;
    const respondWith = vi.fn((x: Promise<Response>) => { p = x; });
    handlers.fetch({ request, preloadResponse: preload, respondWith });
    return { respondWith, response: () => p! };
  }
  return { api, self, caches, stores, fetchFn, handlers, extendable, fetchEvent };
}

describe("shouldHandle(どのリクエストを受け持つか)", () => {
  const { api } = loadSw();
  it.each(["/", "/mouse?surface=glass", "/lobby/abc", "/authors", "/aim#play"])("同じ origin のページを開く GET は受け持つ: %s", (path) => {
    expect(api.shouldHandle(nav(path), ORIGIN)).toBe(true);
  });
  it.each(["/auth", "/auth/", "/auth/callback?code=abc&next=%2Flobby", "/auth/confirm"])("ログインの往復は触らない: %s", (path) => {
    expect(api.shouldHandle(nav(path), ORIGIN)).toBe(false);
  });
  it("POST(server actions のフォーム)は触らない", () => {
    expect(api.shouldHandle(nav("/lobby", { method: "POST" }), ORIGIN)).toBe(false);
  });
  it.each(["no-cors", "cors", "same-origin"])("ページを開く以外(画像・JS・fetch:mode=%s)は触らない", (mode) => {
    expect(api.shouldHandle(nav("/icons/icon-192.png", { mode }), ORIGIN)).toBe(false);
  });
  it.each(["https://xyz.supabase.co/auth/v1/authorize", "https://discord.com/oauth2/authorize", "https://www.amazon.co.jp/s?k=mouse", "http://robilab.example/"])("別の origin は触らない: %s", (url) => {
    expect(api.shouldHandle(nav(url), ORIGIN)).toBe(false);
  });
  it("壊れた URL でも落ちずに触らない", () => {
    expect(api.shouldHandle(nav("not a url"), ORIGIN)).toBe(false);
  });
});

describe("fetch", () => {
  it("受け持たないリクエストには respondWith しない(ブラウザに任せる)", () => {
    const sw = loadSw();
    for (const req of [nav("/auth/callback?code=x"), nav("/lobby", { method: "POST" }), nav("/x.js", { mode: "no-cors" }), nav("https://xyz.supabase.co/rest/v1/x")]) {
      const ev = sw.fetchEvent(req);
      expect(ev.respondWith).not.toHaveBeenCalled();
    }
    expect(sw.fetchFn).not.toHaveBeenCalled();
  });
  it("つながるときはネットの応答をそのまま返し、保存しない", async () => {
    const sw = loadSw();
    const ev = sw.fetchEvent(nav("/my"));
    const res = await ev.response();
    expect(await res.text()).toBe("page");
    expect(sw.fetchFn).toHaveBeenCalledTimes(1);
    expect(sw.caches.open).not.toHaveBeenCalled();
    for (const s of sw.stores.values()) expect(s.put).not.toHaveBeenCalled();
  });
  it("Navigation Preload の応答があれば、それを使い fetch しない", async () => {
    const sw = loadSw();
    const ev = sw.fetchEvent(nav("/"), Promise.resolve(new Response("preloaded")));
    expect(await (await ev.response()).text()).toBe("preloaded");
    expect(sw.fetchFn).not.toHaveBeenCalled();
  });
  it("サーバーの 500 はオフラインの画面に変えない", async () => {
    const sw = loadSw({ fetchImpl: async () => new Response("err", { status: 500 }), offlinePage: new Response("offline") });
    const res = await sw.fetchEvent(nav("/")).response();
    expect(res.status).toBe(500);
  });
  it("ネットにつながらないときだけ offline.html を返す", async () => {
    const sw = loadSw({ fetchImpl: async () => { throw new TypeError("Failed to fetch"); }, offlinePage: new Response("offline") });
    const res = await sw.fetchEvent(nav("/mouse")).response();
    expect(await res.text()).toBe("offline");
    expect(sw.caches.match).toHaveBeenCalledWith("/offline.html");
  });
  it("preload が失敗しても offline.html を返す", async () => {
    const sw = loadSw({ offlinePage: new Response("offline") });
    const res = await sw.fetchEvent(nav("/"), Promise.reject(new TypeError("offline"))).response();
    expect(await res.text()).toBe("offline");
  });
  it("キャッシュにも無いときはブラウザのいつものエラー(Response.error)", async () => {
    const sw = loadSw({ fetchImpl: async () => { throw new TypeError("Failed to fetch"); }, offlinePage: undefined });
    const res = await sw.fetchEvent(nav("/")).response();
    expect(res.type).toBe("error");
  });
});

describe("install / activate", () => {
  it("install で入れるのは offline.html とアイコン 1 つだけ、そのあと skipWaiting", async () => {
    const sw = loadSw();
    await sw.extendable("install");
    expect(sw.caches.open).toHaveBeenCalledWith("robilab-offline-v1");
    expect(sw.stores.get("robilab-offline-v1")!.addAll).toHaveBeenCalledWith(["/offline.html", "/icons/icon-192.png"]);
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });
  it("activate で古い robilab-* だけ消し、Navigation Preload を有効にして clients.claim", async () => {
    const sw = loadSw({ existingKeys: ["robilab-offline-v0", "robilab-offline-v1", "other-app-cache"] });
    await sw.extendable("activate");
    expect(sw.caches.delete).toHaveBeenCalledTimes(1);
    expect(sw.caches.delete).toHaveBeenCalledWith("robilab-offline-v0");
    expect(sw.self.registration.navigationPreload!.enable).toHaveBeenCalled();
    expect(sw.self.clients.claim).toHaveBeenCalled();
  });
  it("Navigation Preload の無いブラウザでも activate が落ちない", async () => {
    const sw = loadSw({ noPreload: true });
    await expect(sw.extendable("activate")).resolves.toBeUndefined();
    expect(sw.self.clients.claim).toHaveBeenCalled();
  });
});

describe("文の決まり(設計書 3-2・7 章)", () => {
  const { api } = loadSw();
  it("CACHE の名前と、持つファイルが実在する", () => {
    expect(api.CACHE).toMatch(/^robilab-offline-v\d+$/);
    expect(api.PRECACHE).toEqual([api.OFFLINE_URL, "/icons/icon-192.png"]);
    for (const p of api.PRECACHE) expect(existsSync(`public${p}`)).toBe(true);
  });
  it("cache.put・importScripts・message / push / sync を書かない", () => {
    expect(SRC).not.toMatch(/\.put\(/);
    expect(SRC).not.toMatch(/importScripts/);
    expect(SRC).not.toMatch(/addEventListener\(\s*["'](message|push|sync|notificationclick)["']/);
  });
});

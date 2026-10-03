import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const SRC = readFileSync("public/sw.js", "utf8");
const ORIGIN = "https://robilab.example";

type Req = { url: string; mode: string; method: string };
type Store = { addAll: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; match: ReturnType<typeof vi.fn> };
type ReloadReq = { url: string; cache: string };
type SwApi = { shouldHandle: (r: Req, origin: string) => boolean; CACHE: string; OFFLINE_URL: string; PRECACHE: string[] };

const CURRENT_CACHE = SRC.match(/const CACHE = "([^"]+)"/)![1];
const nav = (path: string, init: Partial<Req> = {}): Req => ({ url: path.startsWith("http") ? path : `${ORIGIN}${path}`, mode: "navigate", method: "GET", ...init });

/** sw.js の文をそのまま、偽の self・caches・fetch で動かす(ビルドしない) */
/** offlinePage = 今の版のキャッシュ(CACHE)にある offline.html。otherCachePage = ほかのキャッシュ(古い版など)にあるもの */
function loadSw(opts: { fetchImpl?: () => Promise<Response>; offlinePage?: Response | undefined; otherCachePage?: Response; existingKeys?: string[]; noPreload?: boolean } = {}) {
  const handlers: Record<string, (event: unknown) => void> = {};
  const stores = new Map<string, Store>();
  const caches = {
    open: vi.fn(async (name: string) => {
      if (!stores.has(name)) {
        const own = name === CURRENT_CACHE;
        stores.set(name, {
          addAll: vi.fn(async () => {}),
          put: vi.fn(async () => {}),
          match: vi.fn(async (url: string) => (url === "/offline.html" ? (own ? opts.offlinePage : opts.otherCachePage) : undefined)),
        });
      }
      return stores.get(name)!;
    }),
    keys: vi.fn(async () => opts.existingKeys ?? []),
    delete: vi.fn(async (key: string) => key.length > 0),
    // 全部のキャッシュから探す(使わない決まり。今の版のキャッシュだけ見る)
    match: vi.fn(async (url: string) => (url === "/offline.html" ? opts.offlinePage ?? opts.otherCachePage : undefined)),
  };
  const self = {
    addEventListener: (type: string, fn: (event: unknown) => void) => { handlers[type] = fn; },
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
    registration: { navigationPreload: opts.noPreload ? undefined : { enable: vi.fn(async () => {}), disable: vi.fn(async () => {}) } },
    location: { origin: ORIGIN },
  };
  const fetchFn = vi.fn(opts.fetchImpl ?? (async () => new Response("page", { status: 200 })));
  const RequestAtOrigin = class extends Request { constructor(input: string, init?: RequestInit) { super(new URL(input, ORIGIN), init); } };
  const api = new Function("self", "caches", "fetch", "Request", `${SRC}\n;return { shouldHandle, CACHE, OFFLINE_URL, PRECACHE };`)(self, caches, fetchFn, RequestAtOrigin) as SwApi;

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
  it("fetch には event.request をそのまま渡す", async () => {
    const sw = loadSw();
    const req = nav("/mouse?surface=glass");
    await sw.fetchEvent(req).response();
    expect(sw.fetchFn).toHaveBeenCalledWith(req);
  });
  it("Navigation Preload の応答は使わず(読まない)、いつも fetch する", async () => {
    const sw = loadSw();
    const preload = Promise.resolve(new Response("preloaded"));
    expect(await (await sw.fetchEvent(nav("/"), preload).response()).text()).toBe("page");
    expect(sw.fetchFn).toHaveBeenCalledTimes(1);
  });
  it("/auth/callback?code=… には respondWith せず、preload があっても fetch もしない(code を 1 回しか使わせない)", () => {
    const sw = loadSw();
    const ev = sw.fetchEvent(nav("/auth/callback?code=abc&next=%2Flobby"), Promise.resolve(new Response("preloaded")));
    expect(ev.respondWith).not.toHaveBeenCalled();
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
    expect(sw.caches.open).toHaveBeenCalledWith(sw.api.CACHE);
    expect(sw.stores.get(sw.api.CACHE)!.match).toHaveBeenCalledWith("/offline.html");
  });
  it("offline.html は今の版のキャッシュ(CACHE)からだけ探す(古い版・ほかのキャッシュのものは返さない)", async () => {
    const sw = loadSw({ fetchImpl: async () => { throw new TypeError("Failed to fetch"); }, offlinePage: undefined, otherCachePage: new Response("old offline") });
    const res = await sw.fetchEvent(nav("/")).response();
    expect(res.type).toBe("error");
    expect(sw.caches.match).not.toHaveBeenCalled();
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
    expect(sw.caches.open).toHaveBeenCalledWith(sw.api.CACHE);
    const reqs = sw.stores.get(sw.api.CACHE)!.addAll.mock.calls[0][0] as ReloadReq[];
    expect(reqs.map((r) => new URL(r.url).pathname)).toEqual(["/offline.html", "/icons/icon-192.png"]);
    // ブラウザの HTTP キャッシュの古いものを拾わない
    for (const r of reqs) expect(r.cache).toBe("reload");
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });
  it("activate で古い robilab-* だけ消し、Navigation Preload は有効にせず(すでに有効な端末では無効にし)、clients.claim", async () => {
    const sw = loadSw({ existingKeys: ["robilab-offline-v1", "robilab-offline-v2", "robilab-offline-v3", "other-app-cache"] });
    await sw.extendable("activate");
    expect(sw.api.CACHE).toBe("robilab-offline-v3");
    expect(sw.caches.delete.mock.calls.map((c) => c[0]).sort()).toEqual(["robilab-offline-v1", "robilab-offline-v2"]);
    expect(sw.self.registration.navigationPreload!.enable).not.toHaveBeenCalled();
    expect(sw.self.registration.navigationPreload!.disable).toHaveBeenCalled();
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
    expect(SRC).not.toMatch(/navigationPreload\.enable|preloadResponse/);
    expect(SRC).not.toMatch(/importScripts/);
    expect(SRC).not.toMatch(/addEventListener\(\s*["'](message|push|sync|notificationclick)["']/);
  });
  it("Navigation Preload を有効にしない(enable を書かない。/auth/callback の code の取り合いを防ぐ)", () => {
    expect(SRC).not.toMatch(/\.enable\s*\(/);
    expect(SRC).not.toMatch(/navigationPreload\s*\??\.\s*enable/);
  });
  it("cache.add / addAll は install の中だけ", () => {
    const [install, rest] = SRC.split('addEventListener("activate"');
    expect(install).toMatch(/\.addAll\(/);
    expect(rest).not.toMatch(/\.add\(|\.addAll\(/);
  });
  it("offline.html かアイコンを変えたら、CACHE の数字を上げて sw.js の ASSETS-HASH を直す(上げ忘れの検出)", () => {
    const lf = (b: Buffer) => Buffer.from(b.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
    const hash = createHash("sha256")
      .update(lf(readFileSync("public/offline.html")))
      .update(readFileSync("public/icons/icon-192.png"))
      .digest("hex")
      .slice(0, 12);
    const m = SRC.match(/ASSETS-HASH:\s*([0-9a-f]{12})/);
    expect(m, "sw.js に ASSETS-HASH のコメントがない").not.toBeNull();
    expect(m![1], `offline.html かアイコンの中身が変わった。CACHE の数字を上げ、ASSETS-HASH を ${hash} に直す`).toBe(hash);
  });
});

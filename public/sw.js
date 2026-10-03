/* global self, caches */
/*
 * ロビラボの service worker(PWA 段 1)。持つのはオフラインの画面とアイコン 1 つだけ。ページ・データは保存しない。
 * 設計書:docs/superpowers/specs/2026-10-03-pwa-design.md 3 章。止め方:docs/ops/launch.md「service worker を止めるとき」。
 * offline.html かアイコンを変えたら CACHE の数字を上げる。cache.put・message・push・sync と外部スクリプトの読み込みは書かない
 * (段 2 のプッシュ通知を足すときも、このファイルに足す。スコープ / の service worker は 1 つだけ)。
 */
const CACHE = "robilab-offline-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

/** 受け持つのは「同じ origin のページを開く GET」で、ログインの往復(/auth)以外だけ。ほかはブラウザに任せる */
function shouldHandle(request, origin) {
  if (request.mode !== "navigate" || request.method !== "GET") return false;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;
  return !(url.pathname === "/auth" || url.pathname.startsWith("/auth/"));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("robilab-") && key !== CACHE).map((key) => caches.delete(key)));
      // service worker の起動を待つ間に、ページの通信を先に始める(開くのが遅くならないように)
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandle(event.request, self.location.origin)) return;
  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(event.request);
      } catch {
        // ネットにつながらないときだけ。成功した応答は保存しない
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      }
    })(),
  );
});

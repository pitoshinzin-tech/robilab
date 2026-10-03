/* global self, caches */
/*
 * ロビラボの service worker(PWA 段 1)。持つのはオフラインの画面とアイコン 1 つだけ。ページ・データは保存しない。
 * 設計書:docs/superpowers/specs/2026-10-03-pwa-design.md 3 章。止め方:docs/ops/launch.md「service worker を止めるとき」。
 * offline.html かアイコンを変えたら CACHE の数字を上げる。cache.put・message・push・sync と外部スクリプトの読み込みは書かない
 * (段 2 のプッシュ通知を足すときも、このファイルに足す。スコープ / の service worker は 1 つだけ)。
 */
// ASSETS-HASH: bcd0e53e69f2(offline.html とアイコンの中身の印。tests/pwa/sw.test.ts が教える値に直す)
const CACHE = "robilab-offline-v2";
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
      // HTTP キャッシュの古いものを拾わないよう、毎回ネットから取り直す
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("robilab-") && key !== CACHE).map((key) => caches.delete(key)));
      // Navigation Preload は使わない。有効だと /auth/callback にも先行の要求が飛び、1 回しか使えない code を取り合うため。
      // すでに有効にした端末のために、ここで無効にする
      // 失敗しても clients.claim() は続ける
      if (self.registration.navigationPreload) await self.registration.navigationPreload.disable().catch(() => {});
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandle(event.request, self.location.origin)) return;
  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        // ネットにつながらないときだけ。成功した応答は保存しない
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      }
    })(),
  );
});

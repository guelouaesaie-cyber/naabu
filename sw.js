/* NAABU — Service Worker (mode hors-ligne) */
const CACHE = "naabu-v2";
const ASSETS = [
  "./",
  "index.html",
  "css/style.css",
  "css/onboarding.css",
  "js/app.js",
  "js/engine.js",
  "js/store.js",
  "js/onboarding.js",
  "js/util.js",
  "js/vocab.js",
  "js/modules/dashboard.js",
  "js/modules/sales.js",
  "js/modules/products.js",
  "js/modules/orders.js",
  "js/modules/misc.js",
  "manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  // Cache d'abord, réseau en repli ; on met à jour le cache au passage.
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && request.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

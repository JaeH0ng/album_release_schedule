const CACHE_NAME = "album-release-pwa-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./pwa-reset.html",
];
const NETWORK_FIRST_ASSETS = new Set([
  `${self.location.origin}/album_release_schedule/`,
  `${self.location.origin}/album_release_schedule/index.html`,
  `${self.location.origin}/album_release_schedule/styles.css`,
  `${self.location.origin}/album_release_schedule/app.js`,
  `${self.location.origin}/album_release_schedule/manifest.webmanifest`,
  `${self.location.origin}/album_release_schedule/service-worker.js`,
  `${self.location.origin}/album_release_schedule/pwa-reset.html`,
]);

function shouldUseNetworkFirst(request) {
  const url = new URL(request.url);
  return NETWORK_FIRST_ASSETS.has(url.href);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate" || shouldUseNetworkFirst(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) return;
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          })
          .catch(() => null);
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

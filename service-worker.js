const BUILD_VERSION = "20260626102329";
const CACHE_NAME = `album-release-pwa-${BUILD_VERSION}`;
const APP_SHELL = [
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./pwa-reset.html",
];
const APP_SHELL_PATHS = new Set(APP_SHELL.map((path) => new URL(path, self.location.href).pathname));

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
  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(new Request(event.request, { cache: "reload" }))
        .catch(async () => {
          const cached = await caches.match("./index.html");
          if (cached) return cached;
          throw new Error("Navigation request failed");
        })
    );
    return;
  }

  if (APP_SHELL_PATHS.has(url.pathname)) {
    event.respondWith(
      fetch(new Request(event.request, { cache: "reload" }))
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw new Error("Request failed");
    })
  );
});

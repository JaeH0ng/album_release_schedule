const RAW_BUILD_VERSION = "20260712080953";
// 빌드를 거치지 않고(루트 직접 서빙) __BUILD_VERSION__이 치환되지 않은 경우,
// 등록 URL의 ?v= 값을 폴백 버전으로 써서 배포마다 캐시 세대가 갈리도록 한다.
const BUILD_VERSION =
  RAW_BUILD_VERSION.indexOf("BUILD_VERSION") === -1
    ? RAW_BUILD_VERSION
    : new URL(self.location.href).searchParams.get("v") || "dev";
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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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

  // 동일 오리진 JS/CSS(app.js, styles.css)는 앱 셸과 동일하게 항상 네트워크에서
  // 최신을 받아 HTTP 캐시로 인한 stale 실행을 막고, 실패 시에만 캐시로 폴백한다.
  const isSameOriginAsset =
    url.origin === self.location.origin && /\.(?:js|css)$/.test(url.pathname);
  if (isSameOriginAsset) {
    event.respondWith(
      fetch(new Request(event.request, { cache: "reload" }))
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
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

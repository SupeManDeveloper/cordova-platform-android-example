let pendingSyncResolver = null;

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-post-data") {
    event.waitUntil(syncPostData());
  }
});

async function syncPostData() {
  console.debug("[SW] Background Sync triggered!");
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "periodic-fetch") {
    event.waitUntil(fetchLatestData());
  }
});

async function fetchLatestData() {
  console.debug("[SW] Periodic Sync triggered!");
}

const CACHE = "pwabuilder-offline-page";

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);

const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "PENDING_DATA" && pendingSyncResolver) {
    pendingSyncResolver(event.data.payload);
    pendingSyncResolver = null;
  }
});

self.addEventListener("install", async (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      self.clients.claim();
    })()
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(
  new RegExp("/*"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE,
  })
);

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;

          if (preloadResp) {
            return preloadResp;
          }

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          const cache = await caches.open(CACHE);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  }
});

(function () {
  const runtime = typeof chrome !== "undefined" && chrome.runtime
    ? chrome.runtime
    : (typeof browser !== "undefined" ? browser.runtime : null);

  if (!runtime) {
    console.warn("Runtime API not available in this environment");
    return;
  }

  runtime.onConnect.addListener((port) => {
    if (port.name === "keepAlivePort") {
      console.log("KeepAlive connection established");

      port.onMessage.addListener((msg) => {
        if (msg.type === "ping") {
          port.postMessage({ type: "pong" });
        }
      });

      const interval = setInterval(() => {
        try {
          port.postMessage({ type: "keepAlive" });
        } catch (e) {
          clearInterval(interval);
        }
      }, 60 * 60 * 1000); // 1 giờ
    }
  });
})();

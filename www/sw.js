/* Lật Hình Cổ Tích — service worker
 * Strategy:
 *   - Navigations (the HTML page): network-first, fall back to cache. This means
 *     a fresh deploy shows up immediately when online, and the game still opens
 *     offline once it has been visited.
 *   - Same-origin static assets (audio, icon, manifest): cache-first.
 *   - Cross-origin (Google Fonts): left to the network / the browser HTTP cache.
 *
 * Bump CACHE when you change cached assets so old caches are purged on activate.
 */
const CACHE = 'lhct-v1';

// Best-effort precache of the audio + PWA files. The HTML itself is cached
// lazily on first navigation (its filename differs between local dev and the
// deployed index.html, so we don't hard-code it here).
const PRECACHE = [
  './assets/BGM1.mp3',
  './assets/BGM2.mp3',
  './assets/click.mp3',
  './assets/matched.mp3',
  './assets/completed.mp3',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((u) => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // HTML navigations → network-first, fall back to cached page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Same-origin assets → cache-first, then network (and cache it).
  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }
  // Cross-origin (fonts, etc.) → default network handling.
});

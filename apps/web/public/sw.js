/**
 * RVCC Web Service Worker
 * Strategy: Network-first with App Shell cache + Offline Fallback
 * 
 * - Static assets & images → Stale-while-revalidate
 * - API/data requests → Network-first
 * - Navigation → Network-first with offline.html fallback
 */

const CACHE_VERSION = 'build-1788410539795';
const SHELL_CACHE = `rvcc-web-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rvcc-web-runtime-${CACHE_VERSION}`;
const FONT_CACHE = `rvcc-web-fonts-${CACHE_VERSION}`;
const IMAGE_CACHE = `rvcc-web-images-${CACHE_VERSION}`;
const ALL_CACHES = [SHELL_CACHE, RUNTIME_CACHE, FONT_CACHE, IMAGE_CACHE];

const PRECACHE_URLS = [
  '/offline.html',
];

const IMAGE_CACHE_LIMIT = 60;
const RUNTIME_CACHE_LIMIT = 100;
const FONT_CACHE_LIMIT = 10;

// ─── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable();
      }
    }).then(() => self.clients.claim())
  );
});

// Helper: Trim cache to limit
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// ─── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // Ignore chrome-extension or other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // 1. Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try preload response first
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;

          // Network fetch
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          // Offline fallback
          const cache = await caches.open(SHELL_CACHE);
          const cachedOffline = await cache.match('/offline.html');
          return cachedOffline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
    return;
  }

  // 2. Fonts
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/) || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
            trimCache(FONT_CACHE, FONT_CACHE_LIMIT);
          }
          return response;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 3. Static Images (Stale-while-revalidate)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|avif|ico|gif)$/) || request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            trimCache(IMAGE_CACHE, IMAGE_CACHE_LIMIT);
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Next.js Static Chunks & Scripts
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
            trimCache(RUNTIME_CACHE, RUNTIME_CACHE_LIMIT);
          }
          return response;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }
});

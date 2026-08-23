/**
 * RVCC Admin Service Worker
 * Strategy: Network-first with App Shell cache + Offline Fallback
 * 
 * - PWA manifest + icons → Network-first (always pick up branding changes)
 * - Other images → Stale-while-revalidate
 * - API/data requests → Network-first (never serve stale business data)
 * - Navigation → Network-first with offline.html fallback
 * - Push notifications + Background sync support
 */

const CACHE_VERSION = 'v3';
const SHELL_CACHE = `rvcc-admin-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rvcc-admin-runtime-${CACHE_VERSION}`;
const FONT_CACHE = `rvcc-admin-fonts-${CACHE_VERSION}`;
const IMAGE_CACHE = `rvcc-admin-images-${CACHE_VERSION}`;
const ALL_CACHES = [SHELL_CACHE, RUNTIME_CACHE, FONT_CACHE, IMAGE_CACHE];

// Offline fallback only — manifest/icons are fetched network-first at runtime
const PRECACHE_URLS = [
  '/offline.html',
];

// Max cached items per cache bucket
const IMAGE_CACHE_LIMIT = 60;
const RUNTIME_CACHE_LIMIT = 100;
const FONT_CACHE_LIMIT = 10;

// ─── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Take over immediately, don't wait for old tabs
  );
});

// Handle SKIP_WAITING message from the client
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
      // Enable navigation preload if supported
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable();
      }
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (let them pass through)
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except Google Fonts
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Google Fonts → Stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE, FONT_CACHE_LIMIT));
    return;
  }

  // API requests → Network-only (never cache business data)
  if (url.pathname.startsWith('/api/')) {
    return; // Let the browser handle normally
  }

  // PWA manifest + install icons → Network-first so name/logo changes deploy immediately
  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/')) {
    event.respondWith(networkFirst(request, SHELL_CACHE, RUNTIME_CACHE_LIMIT));
    return;
  }

  // Navigation requests → Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(event));
    return;
  }

  // Next.js JS/CSS chunks → Network-first so HMR and deployments always deliver fresh code
  if (isStaticAsset(url.pathname)) {
    event.respondWith(networkFirst(request, SHELL_CACHE, RUNTIME_CACHE_LIMIT));
    return;
  }

  // Images → Stale-while-revalidate so updates appear without stale lock-in
  if (isImageRequest(url.pathname, request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
    return;
  }

  // Everything else → Network-first
  event.respondWith(networkFirst(request, RUNTIME_CACHE, RUNTIME_CACHE_LIMIT));
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'RVCC Admin',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
    };
  }

  const { title = 'RVCC Admin', body, icon, badge, data, tag, actions } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-192x192.png',
      tag: tag || 'rvcc-notification',
      data: data || {},
      actions: actions || [],
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if found
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window if none exists
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── BACKGROUND SYNC ─────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'rvcc-sync-queue') {
    event.waitUntil(replaySyncQueue());
  }
});

async function replaySyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const allRequests = await idbGetAll(store);

  for (const entry of allRequests) {
    try {
      await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });
      store.delete(entry.id);
    } catch {
      // Will retry on next sync
      break;
    }
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rvcc-sync', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── CACHING STRATEGIES ──────────────────────────────────────────

/** Cache-first: Serve from cache, fall back to network (and cache the response) */
async function cacheFirst(request, cacheName, limit) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (limit) trimCache(cacheName, limit);
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Network-first: Try network, fall back to cache */
async function networkFirst(request, cacheName, limit) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (limit) trimCache(cacheName, limit);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Stale-while-revalidate: Serve from cache immediately, update in background */
async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      if (limit) trimCache(cacheName, limit);
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

/** Network-first for navigations with offline.html fallback */
async function networkFirstWithOfflineFallback(event) {
  try {
    // Use navigation preload response if available
    const preloadResponse = event.preloadResponse && await event.preloadResponse;
    if (preloadResponse) return preloadResponse;

    return await fetch(event.request);
  } catch {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    // Serve the offline page as fallback
    return caches.match('/offline.html');
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|otf|eot)(\?.*)?$/.test(pathname) ||
         pathname.startsWith('/_next/static/');
}

function isImageRequest(pathname, request) {
  const acceptHeader = request.headers.get('Accept') || '';
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)(\?.*)?$/.test(pathname) ||
         acceptHeader.includes('image/') ||
         pathname.startsWith('/_next/image');
}

/** Trim cache to a maximum number of entries (FIFO) */
async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > limit) {
    await cache.delete(keys[0]);
    trimCache(cacheName, limit);
  }
}

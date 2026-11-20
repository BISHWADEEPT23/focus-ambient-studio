/**
 * Service Worker: Focus & Ambient Studio
 * True Offline-First Application Shell and Asset Caching Strategy
 */

const CACHE_VERSION = 'flocus-v1.0.1';
const SHELL_CACHE = `flocus-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `flocus-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Install Event: Pre-cache core application shell and discover runtime bundles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      try {
        const indexRes = await fetch('/index.html');
        if (indexRes.ok) {
          const text = await indexRes.text();
          const matches = [...text.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)];
          for (const match of matches) {
            try {
              await cache.add(match[1]);
            } catch (_) {}
          }
        }
      } catch (err) {
        // Fallback to runtime caching if dynamic fetch fails during install
      }
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Purge old cache generations and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('flocus-') && name !== SHELL_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: True offline-first handling
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET requests or unsupported schemes (e.g. chrome-extension)
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // 1. Navigation requests: Network-first with cache fallback to /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedReq = await caches.match(request);
          if (cachedReq) return cachedReq;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 2. Static Assets (/assets/*, .js, .css, .svg, .json, fonts): Cache-first with network fill
  const url = new URL(request.url);
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.json');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
      })
    );
    return;
  }

  // 3. Default: Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

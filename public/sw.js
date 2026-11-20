/**
 * Service Worker: Focus & Ambient Studio
 * True Offline-First Application Shell and Asset Caching Strategy
 * Fully compatible with root and subpath deployments (GitHub Pages)
 */

const CACHE_VERSION = 'flocus-v1.0.2';
const SHELL_CACHE = `flocus-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `flocus-runtime-${CACHE_VERSION}`;

// Compute base scope dynamically from registration
function getScopePath() {
  if (typeof self !== 'undefined' && self.registration && self.registration.scope) {
    try {
      const url = new URL(self.registration.scope);
      return url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    } catch (_) {}
  }
  return '/';
}

const SCOPE_PATH = getScopePath();
const PRECACHE_URLS = [
  SCOPE_PATH,
  `${SCOPE_PATH}index.html`,
  `${SCOPE_PATH}manifest.json`,
  `${SCOPE_PATH}icon-192.svg`,
  `${SCOPE_PATH}icon-512.svg`,
];

// Install Event: Pre-cache core application shell and discover runtime bundles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      try {
        const indexUrl = `${SCOPE_PATH}index.html`;
        const indexRes = await fetch(indexUrl);
        if (indexRes.ok) {
          const text = await indexRes.text();
          // Match any asset referenced in HTML
          const matches = [...text.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)];
          for (const match of matches) {
            try {
              const assetUrl = match[1].startsWith('/')
                ? match[1]
                : `${SCOPE_PATH}${match[1].replace(/^\.\//, '')}`;
              await cache.add(assetUrl);
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

  // 1. Navigation requests: Network-first with cache fallback to index.html
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
          const cachedIndex = await caches.match(`${SCOPE_PATH}index.html`);
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match(SCOPE_PATH);
          if (cachedRoot) return cachedRoot;
          const fallbackAny = await caches.match('/index.html');
          if (fallbackAny) return fallbackAny;
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 2. Static Assets: Cache-first with network fill
  const url = new URL(request.url);
  const isStaticAsset =
    url.pathname.includes('/assets/') ||
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

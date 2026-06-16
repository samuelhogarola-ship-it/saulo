const CACHE_NAME = 'saulo-fitness-pwa-v6';
const APP_SHELL = [
  '/app/',
  '/app/index.html',
  '/app/styles.css?v=saulo-v6',
  '/app/demo-store.js?v=saulo-v6',
  '/app/app.js?v=saulo-v6',
  '/app/manifest.webmanifest?v=saulo-v6',
  '/app/icons/icon-192.png?v=saulo-v6',
  '/app/icons/icon-512.png?v=saulo-v6',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key.startsWith('saulo-fitness-') && key !== CACHE_NAME) {
              return caches.delete(key);
            }

            return Promise.resolve();
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isAppRequest =
    requestUrl.origin === self.location.origin &&
    requestUrl.pathname.startsWith('/app/');

  if (!isAppRequest) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/app/index.html'));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone()).catch(() => null);
    return networkResponse;
  } catch (_error) {
    return (
      (await cache.match(request)) ||
      (await cache.match(fallbackUrl)) ||
      (await cache.match('/app/'))
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone()).catch(() => null);
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || networkPromise || cache.match('/app/index.html');
}

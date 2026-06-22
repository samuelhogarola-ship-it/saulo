const CACHE_NAME = 'saulo-trainer-pwa-v1';
const APP_SHELL = [
  '/trainer/',
  '/trainer/index.html',
  '/trainer/styles.css?v=saulo-trainer-v3',
  '/trainer/app.js?v=saulo-trainer-v1',
  '/trainer/manifest.webmanifest?v=saulo-trainer-v1',
  '/trainer/icons/coach-icon-192.png?v=saulo-trainer-v1',
  '/trainer/icons/coach-icon-512.png?v=saulo-trainer-v1',
  '/trainer/assets/saulo-mark.png',
  '/trainer/assets/reference-dashboard.jpeg',
  '/app/demo-store.js?v=saulo-trainer-v1',
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
            if (key.startsWith('saulo-trainer-') && key !== CACHE_NAME) {
              return caches.delete(key);
            }

            return Promise.resolve();
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isTrainerRequest =
    requestUrl.origin === self.location.origin &&
    (requestUrl.pathname.startsWith('/trainer/') ||
      requestUrl.pathname === '/trainer' ||
      requestUrl.pathname === '/app/demo-store.js');

  if (!isTrainerRequest) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/trainer/index.html'));
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
      (await cache.match('/trainer/'))
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

  return cachedResponse || networkPromise || cache.match('/trainer/index.html');
}

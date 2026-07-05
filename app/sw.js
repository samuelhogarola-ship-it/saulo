const CACHE_NAME = 'saulo-fitness-app-v13';
const APP_SHELL = [
  '/app/',
  '/app/index.html',
  '/app/styles.css?v=saulo-v13',
  '/app/api.js?v=saulo-v13',
  '/app/pwa.js?v=saulo-v13',
  '/app/utils.js?v=saulo-v13',
  '/app/chat.js?v=saulo-v13',
  '/app/navigation.js?v=saulo-v13',
  '/app/sections.js?v=saulo-v13',
  '/app/routines.js?v=saulo-v13',
  '/app/state.js?v=saulo-v13',
  '/app/ui.js?v=saulo-v13',
  '/app/refs.js?v=saulo-v13',
  '/app/controller-bindings.js?v=saulo-v13',
  '/app/controller-renderer.js?v=saulo-v13',
  '/app/controller.js?v=saulo-v13',
  '/app/app.js?v=saulo-v13',
  '/app/manifest.webmanifest?v=saulo-v13',
  '/app/icons/icon-192.png?v=saulo-v13',
  '/app/icons/icon-512.png?v=saulo-v13',
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
            if (key.startsWith('saulo-fitness-app-') && key !== CACHE_NAME) {
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
  const isAppRequest =
    requestUrl.origin === self.location.origin &&
    requestUrl.pathname.startsWith('/app/');

  if (!isAppRequest) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone))
          .catch(() => null);
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.match('/app/');
        }),
      ),
  );
});

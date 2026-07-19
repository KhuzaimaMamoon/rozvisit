const CACHE = 'rozvisit-caregiver-shell-v1';
const SHELL = ['/'];

self.addEventListener('install', (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))),
);
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)
    return;
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});

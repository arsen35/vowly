
const CACHE_NAME = 'annabella-bridal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.shopify.com/s/files/1/0733/2285/6611/files/FAV-CENTER-LOGO-1.png?v=1770124550'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

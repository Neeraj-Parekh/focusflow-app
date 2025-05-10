const staticCacheName = 'focusflow-static-v1';
const dynamicCacheName = 'focusflow-dynamic-v1';
const assets = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './images/icon-72x72.png',
  './images/icon-96x96.png',
  './images/icon-128x128.png',
  './images/icon-144x144.png',
  './images/icon-152x152.png',
  './images/icon-192x192.png',
  './images/icon-384x384.png',
  './images/icon-512x512.png',
  './sounds/timer-end.mp3',
  './sounds/rain.mp3',
  './sounds/cafe.mp3',
  './sounds/forest.mp3',
  './sounds/fire.mp3',
  './sounds/whitenoise.mp3'
];

// Install event - cache the app shell resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Caching app shell assets');
      return cache.addAll(assets);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== staticCacheName && key !== dynamicCacheName)
          .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      return cacheRes || fetch(event.request).then(fetchRes => {
        return caches.open(dynamicCacheName).then(cache => {
          // Don't cache responses with status other than 200
          if(fetchRes.status === 200) {
            cache.put(event.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Fallback for HTML pages if offline
      if (event.request.url.indexOf('.html') > -1) {
        return caches.match('./index.html');
      }
    })
  );
});

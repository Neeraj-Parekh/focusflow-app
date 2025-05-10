const staticCacheName = 'focusflow-static-v202505110113';
const dynamicCacheName = 'focusflow-dynamic-v202505110113';
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
      }).catch(error => {
        // Network error, serve appropriate fallback based on request type
        const url = new URL(event.request.url);
        
        // Handle audio file fallbacks
        if (url.pathname.includes('/sounds/')) {
          console.log('Audio file fetch failed, returning silent audio fallback');
          // Return a minimal silent audio file for sound requests when offline
          return new Response(new ArrayBuffer(0), {
            status: 200,
            headers: {'Content-Type': 'audio/mp3'}
          });
        }
        
        // Handle image fallbacks
        if (url.pathname.includes('/images/')) {
          console.log('Image fetch failed, returning image fallback');
          return caches.match('./images/icon-72x72.png');
        }
        
        // Handle HTML fallbacks
        if (event.request.headers.get('accept').includes('text/html')) {
          console.log('HTML fetch failed, returning cached index page');
          return caches.match('./index.html');
        }
        
        // Default - just report the error
        console.log('Network request failed and no fallback available', error);
      });
    })
  );
});

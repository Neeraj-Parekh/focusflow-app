// Enhanced Service Worker with Memory-Efficient Caching and Background Sync
const CACHE_VERSION = 'focusflow-v2.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_CACHE = `${CACHE_VERSION}-offline`;

// Comprehensive caching strategy
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './src/services/ActivityTracker.js', // Will be compiled from TS
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

// Memory management for offline data
const MAX_OFFLINE_ENTRIES = 100;
const CACHE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

// Install event with proper cache management
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then(cache => {
          console.log('Caching app shell assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Initialize offline storage
      caches.open(OFFLINE_CACHE)
        .then(cache => {
          console.log('Initialized offline cache');
          return cache;
        }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event with comprehensive cache cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key => !key.startsWith(CACHE_VERSION))
            .map(key => {
              console.log('Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
      
      // Initialize background sync
      self.registration.sync.register('background-sync')
    ])
  );
});

// Enhanced fetch strategy with fallbacks
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

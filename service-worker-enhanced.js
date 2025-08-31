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
    handleFetchRequest(event.request)
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_USAGE') {
    event.ports[0].postMessage(getCacheUsage());
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE_DATA') {
    storeOfflineData(event.data.data);
  }
});

async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  }
  
  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '')))) {
    return handleStaticAsset(request);
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    return handleNavigationRequest(request);
  }
  
  // Default cache-first strategy
  return handleCacheFirst(request);
}

async function handleApiRequest(request) {
  try {
    // Network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful responses for offline access
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline message for API failures
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'This request failed and no cached version is available' }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleStaticAsset(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Handle specific asset type fallbacks
    const url = new URL(request.url);
    
    if (url.pathname.includes('/sounds/')) {
      return new Response(new ArrayBuffer(0), {
        status: 200,
        headers: {'Content-Type': 'audio/mp3'}
      });
    }
    
    if (url.pathname.includes('/images/')) {
      const fallbackIcon = await caches.match('./images/icon-72x72.png');
      return fallbackIcon || new Response('Image not available offline', { status: 503 });
    }
    
    return new Response('Asset not available offline', { status: 503 });
  }
}

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Always return the main HTML for navigation
    const cachedResponse = await caches.match('./index.html');
    return cachedResponse || new Response('App not available offline', { status: 503 });
  }
}

async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      
      // Check cache size before adding
      await enforceCacheLimit(cache);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', { status: 503 });
  }
}

async function performBackgroundSync() {
  try {
    console.log('Performing background sync');
    
    // Sync offline data when back online
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData);
      await clearOfflineData();
    }
    
    // Sync activity tracking data
    await syncActivityData();
    
    // Update cache with fresh content
    await updateCriticalCache();
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineData() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const requests = await cache.keys();
    const data = [];
    
    for (const request of requests) {
      const response = await cache.match(request);
      const responseData = await response.json();
      data.push(responseData);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return [];
  }
}

async function syncOfflineData(data) {
  for (const item of data) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Failed to sync item:', error);
    }
  }
}

async function syncActivityData() {
  // Sync activity tracking data stored in IndexedDB or cache
  try {
    const activityData = await getStoredActivityData();
    if (activityData.length > 0) {
      await fetch('/api/activity/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      await clearStoredActivityData();
    }
  } catch (error) {
    console.error('Failed to sync activity data:', error);
  }
}

async function getStoredActivityData() {
  // Retrieve activity data from storage
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = await cache.match('activity-data');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to get activity data:', error);
  }
  return [];
}

async function clearStoredActivityData() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.delete('activity-data');
  } catch (error) {
    console.error('Failed to clear activity data:', error);
  }
}

async function clearOfflineData() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (!request.url.includes('activity-data')) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
}

async function updateCriticalCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Refresh critical assets
    const criticalAssets = ['./index.html', './app.js', './style.css'];
    
    for (const asset of criticalAssets) {
      try {
        const response = await fetch(asset, { cache: 'no-cache' });
        if (response.status === 200) {
          await cache.put(asset, response);
        }
      } catch (error) {
        console.warn(`Failed to update ${asset}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to update critical cache:', error);
  }
}

async function storeOfflineData(data) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const requests = await cache.keys();
    
    // Enforce offline storage limit
    if (requests.length >= MAX_OFFLINE_ENTRIES) {
      // Remove oldest entries
      const oldestRequest = requests[0];
      await cache.delete(oldestRequest);
    }
    
    // Store new data
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`offline-data-${Date.now()}`, response);
  } catch (error) {
    console.error('Failed to store offline data:', error);
  }
}

async function enforceCacheLimit(cache) {
  try {
    const keys = await cache.keys();
    const cacheSize = await getCacheSizeBytes(cache);
    
    if (cacheSize > CACHE_SIZE_LIMIT) {
      // Remove oldest entries until under limit
      const sortedKeys = keys.sort((a, b) => {
        // Sort by timestamp if available, otherwise by URL
        const aTime = a.url.match(/timestamp=(\d+)/);
        const bTime = b.url.match(/timestamp=(\d+)/);
        
        if (aTime && bTime) {
          return parseInt(aTime[1]) - parseInt(bTime[1]);
        }
        
        return a.url.localeCompare(b.url);
      });
      
      // Remove oldest 25% of entries
      const removeCount = Math.floor(sortedKeys.length * 0.25);
      for (let i = 0; i < removeCount; i++) {
        await cache.delete(sortedKeys[i]);
      }
    }
  } catch (error) {
    console.error('Failed to enforce cache limit:', error);
  }
}

async function getCacheSizeBytes(cache) {
  let totalSize = 0;
  const keys = await cache.keys();
  
  for (const key of keys) {
    try {
      const response = await cache.match(key);
      const blob = await response.blob();
      totalSize += blob.size;
    } catch (error) {
      // Skip failed entries
      continue;
    }
  }
  
  return totalSize;
}

async function getCacheUsage() {
  try {
    const caches_data = await caches.keys();
    const usage = {};
    
    for (const cacheName of caches_data) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const size = await getCacheSizeBytes(cache);
      
      usage[cacheName] = {
        entries: keys.length,
        sizeBytes: size,
        sizeMB: (size / (1024 * 1024)).toFixed(2)
      };
    }
    
    return usage;
  } catch (error) {
    console.error('Failed to get cache usage:', error);
    return {};
  }
}

// Periodic cleanup
setInterval(async () => {
  try {
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    await enforceCacheLimit(dynamicCache);
  } catch (error) {
    console.error('Periodic cleanup failed:', error);
  }
}, 60000); // Every minute
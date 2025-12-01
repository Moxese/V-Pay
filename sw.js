// Service Worker for V-PAY PWA
const CACHE_NAME = 'vpay-v1.2';
const urlsToCache = [
  '/index.html/',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://i.postimg.cc/GtHqWWbV/wallet.png',
  'https://accounts.google.com/gsi/client'
];

self.addEventListener('install', function(event) {
  console.log('🔄 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('❌ Cache installation failed:', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', function(event) {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', function(event) {
  // Skip non-GET requests and external APIs
  if (event.request.method !== 'GET') return;
  
  // Skip Google Sign-In and external API requests
  if (event.request.url.includes('googleapis.com') || 
      event.request.url.includes('exchangerate-api.com') ||
      event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch
        if (response) {
          console.log('📂 Serving from cache:', event.request.url);
          return response;
        }

        console.log('🌐 Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(function(error) {
            console.error('❌ Fetch failed:', error);
            // You could return a custom offline page here
            return new Response('You are offline. Please check your connection.', {
              status: 408,
              statusText: 'Offline',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle background sync (for offline payments)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-payment-sync') {
    console.log('🔄 Background sync for payments');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // This would sync pending payments when back online
  console.log('Syncing pending payments...');
}

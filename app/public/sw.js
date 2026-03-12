// Basic service worker for PWA
self.addEventListener('install', () => {
    // Skip waiting to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim clients to take control immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network first, fallback to cache for HTML, script, etc.
    // Extremely basic fallback strategy
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

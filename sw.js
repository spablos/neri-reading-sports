// Service Worker for נרי לומד לקרוא — caches all assets for offline play
const CACHE_NAME = 'neri-v25';

// Core app files
const CORE_FILES = [
    '/neri/',
    '/neri/index.html',
    '/neri/styles.css',
    '/neri/app.js',
    '/neri/players.js',
    '/neri/descriptions.js',
    '/neri/hebrew.js',
    '/neri/manifest.json',
    '/neri/icon-192.png',
    '/neri/icon-512.png',
];

// Install: cache core files immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for audio, network-first for everything else
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API calls and version.json: always network (never cache)
    if (url.pathname.includes('/api/') || url.pathname.endsWith('version.json')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Audio files: network-first (may be re-recorded via back office), falls back to cache
    if (url.pathname.includes('/audio/')) {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // App files: network-first (picks up updates), falls back to cache
    event.respondWith(
        fetch(event.request).then(response => {
            if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
        }).catch(() => caches.match(event.request))
    );
});

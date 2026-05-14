const CACHE = 'majormatch-v5';
const SHELL  = ['/', '/index.html', '/favicon.svg', '/manifest.json',
                 '/icons/icon-192.png', '/icons/icon-512.png'];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML pages: network-first (always get latest, fall back to cache offline)
// - API calls: network-only
// - Assets (icons, svg): cache-first
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline' }), { headers: { 'Content-Type': 'application/json' } })
    ));
  } else if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    // Network-first for HTML so updates always show immediately
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});

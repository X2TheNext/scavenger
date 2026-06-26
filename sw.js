const CACHE_NAME = 'ustreet-hunt-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/register.html',
  '/hunt.html',
  '/map.html',
  '/leaderboard.html',
  '/prizes.html',
  '/checkpoint.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(err => {
        console.warn('Precache partial failure:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Skip Supabase API calls — don't cache live data
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('auth/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached immediately; fetch in background
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
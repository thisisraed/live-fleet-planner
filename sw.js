const CACHE = 'live-fleet-planner-shell-v0.9.80';
const APP_SHELL = [
  './',
  './index.html',
  './setup.html',
  './setup-data.json',
  './assets/setup/airbus-setup-0.txt',
  './assets/setup/airbus-setup-1.txt',
  './assets/setup/airbus-setup-2.txt',
  './assets/setup/airbus-setup-3.txt',
  './assets/setup/airbus-setup-4.txt',
  './assets/setup/airbus-setup.webp',
  './manifest.webmanifest',
  './icons/icon-192-v0.9.71.png',
  './icons/icon-512-v0.9.71.png',
  './icons/apple-touch-icon-v0.9.71.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache API calls: GitHub, SimBrief and live weather must remain network-first.
  if (url.hostname === 'api.github.com' || url.hostname.includes('simbrief.com') || url.hostname.includes('aviationweather.gov') || url.hostname.includes('vatsim.net')) return;
  if (req.mode === 'navigate' && url.pathname.endsWith('/setup.html')) {
    event.respondWith(fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./setup.html', copy));
      }
      return res;
    }).catch(() => caches.match('./setup.html')));
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    if (res.ok && url.origin === location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  })));
});

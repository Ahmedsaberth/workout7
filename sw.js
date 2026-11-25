const CACHE_NAME = 'ahmed-saber-workout-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isPage(req) {
  return req.mode === 'navigate' || new URL(req.url).pathname.endsWith('/index.html');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;

  // الصفحة نفسها: من النت الأول عشان أي تعديل يظهر على طول، ولو مفيش نت من الكاش
  if (isPage(req)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html').then(c => c || caches.match('./')))
    );
    return;
  }

  // باقي الملفات (أيقونات وغيرها): من الكاش وبتتحدث في الخلفية
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkResp => {
        if (networkResp && networkResp.status === 200 && req.url.startsWith(self.location.origin)) {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

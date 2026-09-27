// HKSBC 羽毛球編排 App 離線快取
// 呢個 Service Worker 負責令個 App 第一次開完之後，就算冇網絡都用得返（純離線）。
// 資料本身（會員、設定、活動紀錄）一直都係存喺瀏覽器嘅 localStorage，同呢個快取無關，
// 呢個快取淨係負責令個網頁本身（HTML／CSS／圖示）喺冇網絡時都載入得返。
const CACHE_VERSION = 'hksbc-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first：有快取就即刻用（保證離線都開得到），背後同時試下攞返新版本更新快取，
// 令下次開個 App 嗰陣（有網絡時）自動用返最新版本。
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached); // 冇網絡：跌返用快取
      return cached || fetchPromise;
    })
  );
});

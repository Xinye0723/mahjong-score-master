const CACHE_NAME = 'mahjong-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// 安裝時快取所有資源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('正在預載離線資源...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 啟動時清理舊快取
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

// 攔截請求：先看快取，沒快取才找網路
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});

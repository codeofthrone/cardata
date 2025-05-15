// Service Worker for 車輛資訊系統 PWA
const CACHE_NAME = 'cardata-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js'
];

// 安裝 Service Worker 並緩存核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('已開啟緩存');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網絡請求，優先使用緩存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在緩存中找到匹配的資源，則返回緩存的版本
        if (response) {
          return response;
        }
        
        // 否則發送網絡請求
        return fetch(event.request).then(
          (response) => {
            // 檢查是否收到有效的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆響應，因為響應是流，只能使用一次
            const responseToCache = response.clone();

            // 將新獲取的資源添加到緩存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 當新版本的 Service Worker 激活時，清理舊緩存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 刪除不在白名單中的緩存
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
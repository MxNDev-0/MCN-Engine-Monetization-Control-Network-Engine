const CACHE_NAME = "mcn-engine-v3";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./dashboard.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.log("Cache install failed:", err);
      }
    })
  );
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// FETCH (offline-first)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(networkRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("./offline.html") || caches.match("./index.html");
          }
        });
    })
  );
});

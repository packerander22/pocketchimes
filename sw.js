// PWA service worker for PocketChimes
// Aggressive cache ONLY for audio + favicons

// Bump these names any time you want to force-clear old SW caches
const STATIC_CACHE = "pocketchimes-static-v2";
const MEDIA_CACHE  = "pocketchimes-media-v2";

// Long-lived static assets (favicons, manifest, etc.)
const STATIC_ASSETS = [
  "/favicons/favicon_16_transparent.png",
  "/favicons/favicon_32_transparent.png",
  "/favicons/favicon_48_transparent.png",
  "/favicons/favicon_64_transparent.png",
  "/favicons/favicon_180_transparent.png",
  "/favicons/favicon_192_transparent.png",
  "/favicons/favicon_256_transparent.png",
  "/favicons/favicon_384_transparent.png",
  "/favicons/favicon_512_transparent.png",
  "/favicons/favicon_2048_transparent.png",
  "/favicons/favicon_maskable_512_transparent.png",
  "/favicons/site.webmanifest"
  // If you ever have a separate logo file you want cached hard,
  // just add its path here, e.g. "/logo.png"
];

// Optional: audio files you want *pre*-cached on install.
// You can leave this empty; runtime caching below will still
// cache anything under /audio/ the first time it's requested.
const MEDIA_ASSETS = [
  // "/audio/C5.wav",
  // "/audio/C6.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(MEDIA_CACHE).then(cache => cache.addAll(MEDIA_ASSETS))
    ])
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const allowedCaches = [STATIC_CACHE, MEDIA_CACHE];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !allowedCaches.includes(key))
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1) AUDIO: cache-first using MEDIA_CACHE
  if (url.pathname.startsWith("/audio/")) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;

          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 2) FAVICONS: cache-first using STATIC_CACHE
  if (url.pathname.startsWith("/favicons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;

          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 3) Everything else: normal network/Cloudflare behavior
  //    (no event.respondWith here on purpose)
});
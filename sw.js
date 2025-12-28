// PWA service worker for PocketChimes
// Aggressive cache ONLY for audio + favicons, with full bell precache

// Bump these if you ever want to force-clear all SW caches again
const STATIC_CACHE = "pocketchimes-static-v3";
const MEDIA_CACHE  = "pocketchimes-media-v3";

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
  // If you add a standalone logo you want hard-cached, add it here,
  // e.g. "/logo.png"
];

// All bell audio files, URL-encoded where "#" => "%23"
const MEDIA_ASSETS = [
  "/audio/A%235.wav", "/audio/A%236.wav", "/audio/A%237.wav",
  "/audio/A5.wav",    "/audio/A6.wav",    "/audio/A7.wav",

  "/audio/B5.wav",    "/audio/B6.wav",    "/audio/B7.wav",

  "/audio/C%235.wav", "/audio/C%236.wav", "/audio/C%237.wav",
  "/audio/C5.wav",    "/audio/C6.wav",    "/audio/C7.wav", "/audio/C8.wav",

  "/audio/D%235.wav", "/audio/D%236.wav", "/audio/D%237.wav",
  "/audio/D5.wav",    "/audio/D6.wav",    "/audio/D7.wav",

  "/audio/E5.wav",    "/audio/E6.wav",    "/audio/E7.wav",

  "/audio/F%235.wav", "/audio/F%236.wav", "/audio/F%237.wav",
  "/audio/F5.wav",    "/audio/F6.wav",    "/audio/F7.wav",

  "/audio/G%235.wav", "/audio/G%236.wav", "/audio/G%237.wav",
  "/audio/G5.wav",    "/audio/G6.wav",    "/audio/G7.wav"
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
  //    (no SW caching here on purpose)
});
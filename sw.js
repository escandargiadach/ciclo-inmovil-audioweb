const SHELL_CACHE = "el-ciclo-inmovil-shell-v32";
const AUDIO_CACHE = "el-ciclo-inmovil-audio-v28";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./content.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/cover/portada.webp",
  "./assets/icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => ![SHELL_CACHE, AUDIO_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isAudio = request.destination === "audio" || /\.(mp3|m4a|ogg|wav)$/i.test(url.pathname);

  if (isAudio) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
    return;
  }

  event.respondWith(
    fetch(new Request(request, { cache: "no-cache" })).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
  );
});

/* Service worker per la PWA Burraco.
   Cache-first sull'app shell (same-origin); le chiamate esterne (API Anthropic) non vengono intercettate. */
const CACHE = "burraco-v1";
const ASSETS = [
  "./burraco.html",
  "./burraco.webmanifest",
  "./burraco-icon-192.png",
  "./burraco-icon-512.png",
  "./burraco-icon-192-maskable.png",
  "./burraco-icon-512-maskable.png",
  "./burraco-icon-180.png",
  "./burraco-favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {}) // se un asset manca non bloccare l'installazione
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // non intercettare l'API Anthropic o altre risorse esterne

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      // offline e non in cache: se è una navigazione, ripiega sull'app
      if (req.mode === "navigate") {
        const shell = await caches.match("./burraco.html");
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});

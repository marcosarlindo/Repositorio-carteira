// Service worker do dashboard "Minha Carteira".
// Só cuida dos arquivos do próprio app (pra abrir rápido / funcionar offline).
// Cotações (brapi.dev) NUNCA passam por aqui — sempre direto da rede, sempre atuais.

var CACHE_NAME = "carteira-app-shell-v1";
var APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = new URL(req.url);

  // Só mexe em GET do mesmo domínio (o app em si). Tudo que for pra outro
  // domínio (ex: brapi.dev) passa direto, sem passar pelo cache.
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
  );
});

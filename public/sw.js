/* eslint-disable no-restricted-globals */
/**
 * Service Worker — dovo PWA offline.
 *
 * Estrategias por tipo de request:
 *   - /api/*                → network-only (datos sensibles, NUNCA cache)
 *   - /_next/static/*       → cache-first (immutable, hash-versioned)
 *   - /icon.svg, fonts, etc → cache-first
 *   - HTML (navigate)       → network-first con fallback a cache
 *   - Otros same-origin     → network-only
 *
 * Versionado: bumpea VERSION cuando cambies estrategias. Las caches con
 * prefijo distinto se purgan en activate.
 *
 * El cliente registra este SW solo en producción (ver
 * components/ServiceWorkerRegister.tsx). En dev causa más problemas que
 * los que resuelve (HMR + cache stale).
 */

const VERSION = "dovo-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const PAGES_CACHE = `${VERSION}-pages`;

// Assets pre-cacheados al instalar el SW
const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          SHELL_URLS.map((url) =>
            // Best-effort: si falla algún asset, no rompe el install
            cache.add(url).catch(() => {}),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Solo same-origin
  if (url.origin !== self.location.origin) return;

  // /api/* nunca se cachea — datos sensibles o mutaciones
  if (url.pathname.startsWith("/api/")) return;

  // /unlock no se cachea — auth flow
  if (url.pathname.startsWith("/unlock")) return;

  // Static assets immutable: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(svg|png|jpg|jpeg|webp|ico|woff2?|css|js|json)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  // HTML pages (navigate o accept: text/html): network-first con fallback
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(networkFirst(req, PAGES_CACHE));
    return;
  }

  // Resto: dejar pasar al network sin tocar
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // Revalidate en background para próxima visita (stale-while-revalidate light)
    fetchAndCache(req, cacheName).catch(() => {});
    return cached;
  }
  return fetchAndCache(req, cacheName);
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      // Clone antes de devolver — el stream solo se puede leer 1 vez
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    // Offline: intenta servir desde cache la URL exacta
    const cached = await cache.match(req);
    if (cached) return cached;
    // Último recurso: la home (que el shell tiene pre-cacheada)
    const home = await caches.match("/");
    if (home) return home;
    return new Response(offlineHtml(), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

async function fetchAndCache(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    // Si no hay red y no había cache, devolver un placeholder mínimo
    return new Response("", { status: 503 });
  }
}

/** HTML mínimo para el caso extremo: navegación sin red ni cache. */
function offlineHtml() {
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>dovo · sin conexión</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#08080a;color:#f3f3f5;font-family:system-ui,sans-serif}
  main{max-width:32rem;padding:2rem;text-align:center}
  h1{font-size:3rem;font-weight:800;letter-spacing:-.04em;line-height:1;margin:0 0 1rem;
     color:#c8f135;text-transform:lowercase}
  p{color:#b5b5bd;line-height:1.6;font-size:.95rem}
  button{margin-top:2rem;padding:.75rem 1.5rem;background:#c8f135;color:#000;border:0;
         font-family:monospace;letter-spacing:.2em;text-transform:uppercase;
         font-size:.75rem;cursor:pointer}
</style></head><body>
<main>
  <h1>sin conexión.</h1>
  <p>No alcanzo a llegar al servidor. Lo que ya marcaste sigue guardado en este dispositivo y se sincroniza cuando vuelva la red.</p>
  <button onclick="location.reload()">Reintentar</button>
</main>
</body></html>`;
}

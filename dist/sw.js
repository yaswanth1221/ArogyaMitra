/* Bump CACHE_VERSION whenever the cache strategy or precached shell changes. */
const CACHE_VERSION = 'arogyamitra-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './arogyamitra-logo.svg'];

async function appAssets() {
  const scope = self.registration.scope;
  const response = await fetch(new URL('./index.html', scope));
  if (!response.ok) throw new Error(`Could not load the app shell (${response.status}).`);
  const html = await response.text();
  const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], scope))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href);
  const uniqueUrls = [...new Set(assetUrls)];

  const manifestResponse = await fetch(new URL('./manifest.webmanifest', scope));
  if (!manifestResponse.ok) throw new Error(`Could not load the app manifest (${manifestResponse.status}).`);
  const manifest = await manifestResponse.json();
  for (const icon of manifest.icons ?? []) {
    const url = new URL(icon.src, scope);
    if (url.origin === self.location.origin) uniqueUrls.push(url.href);
  }
  return [...new Set(uniqueUrls)];
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(SHELL);
    await cache.addAll(await appAssets());
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(request, response.clone())));
      }
      return response;
    } catch {
      if (request.mode === 'navigate') {
        const appShell = await caches.match('./index.html');
        if (appShell) return appShell;
      }
      return Response.error();
    }
  })());
});

/* Landfall — service worker. Keeps what has been fetched so a second visit loads from the device.
   Pictures, music, sound effects and fonts: from the cache first (they do not change under a name). The page, scripts and
   styles: from the network first, so a new build is picked up, falling back to the cache when offline. */
const CACHE = 'landfall-v201';   // bump whenever a picture, cue or font is replaced under the same name
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const media = /\/(art|music|sfx|fonts)\//.test(u.pathname);
  if (media) e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.status === 200) c.put(e.request, r.clone()); return r; }))));
  else e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
});

/* Landfall — service worker. Keeps what has been fetched so a second visit loads from the device.
   Pictures, music, sound effects and fonts: from the cache first (they do not change under a name). The page, scripts and
   styles: from the network first, revalidated past the browser's cache, so a new build is picked up, falling back to the cache when offline. */
const CACHE = 'landfall-v292';   // bump whenever a picture, cue or font is replaced under the same name
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const media = /\/(art|music|sfx|fonts)\//.test(u.pathname);
  // a video asks for byte ranges, and Safari will not play one answered with the whole file: cut the range from the cached copy
  if (media && e.request.headers.has('range')) return e.respondWith(caches.open(CACHE).then(c => c.match(u.href)).then(hit => hit ? ranged(e.request, hit) : fetch(e.request)));
  if (media) e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.status === 200) c.put(e.request, r.clone()); return r; }))));
  // no-cache: ask the server every time (a 304 when nothing changed), so the browser's own cache (GitHub Pages: ten minutes) never holds back a new build
  else e.respondWith(fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
});
/* A 206 for a cached file: bytes=a-b, a- or -n (the last n). */
function ranged(req, hit) {
  return hit.arrayBuffer().then(buf => { const n = buf.byteLength, m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
    if (!m || (m[1] === '' && m[2] === '')) return fetch(req);
    let a = m[1] === '' ? Math.max(0, n - +m[2]) : +m[1], b = m[1] === '' || m[2] === '' ? n - 1 : Math.min(+m[2], n - 1);
    if (a >= n || a > b) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${n}` } });
    return new Response(buf.slice(a, b + 1), { status: 206, statusText: 'Partial Content', headers: { 'Content-Type': hit.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } }); });
}

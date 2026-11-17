/* Landfall — loading. UI only.
   The first visit shows a loading bar while the first screen's assets arrive, and nothing more: the fonts, the
   crest, the icons, the adrift picture and the intro's shots. Everything else loads when a view or card needs it,
   with the next card's picture fetched quietly while the player looks the view over, and each music cue only when
   its mood is first wanted (js/music.js). A service worker (sw.js) keeps what has been fetched, where the browser
   allows one (https or localhost; not plain http on the LAN, where the server's own caching does the job), so a
   second visit has no bar. */
(function () {
'use strict';
const KEY = 'landfall.loaded';
const seen = (() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
const ICONS = ['array', 'world', 'ship', 'people', 'food', 'water', 'parts', 'danger', 'lander', 'machines', 'time', 'good', 'bad', 'unknown', 'difficulty', 'notable', 'faction', 'mat'];
const done = new Set();
function one(url) {
  if (done.has(url)) return Promise.resolve();
  done.add(url);
  return new Promise(res => {
    if (/\.(png|webp|jpg)$/.test(url)) { const i = new Image(); i.onload = i.onerror = () => res(); i.decoding = 'async'; i.src = url; }
    else fetch(url).then(r => r.blob()).then(() => res(), () => res());
  });
}
// Fetch quietly, nothing shown: the next card's picture, the next intro shot.
function prefetch(urls) { for (const u of [].concat(urls)) if (u) one(u); }
// The first screen. bar: show the loading bar (first visit only).
function first(urls, cb) {
  urls = ['fonts/nunito-latin-wght-normal.woff2', 'fonts/cinzel-latin-wght-normal.woff2', 'art/crest.webp', 'art/crest-icon.png'].concat(ICONS.map(n => `art/icons/${n}.png`), urls || []);
  const el = document.getElementById('boot');
  if (seen || !el) { if (el) el.remove(); prefetch(urls); return cb(); }
  el.hidden = false;
  const fill = el.querySelector('i'), n = urls.length; let k = 0, over = false;
  const end = () => { if (over) return; over = true; try { localStorage.setItem(KEY, '1'); } catch (e) {} el.classList.add('out'); setTimeout(() => el.remove(), 350); cb(); };
  setTimeout(end, 20000);    // a slow connection still gets a game, eventually
  for (const u of urls) one(u).then(() => { k++; fill.style.transform = `scaleX(${k / n})`; if (k === n) setTimeout(end, 200); });
}
const scene = id => id ? `art/scenes/${id}.webp` : null;
window.LFBoot = { first, prefetch, scene, get seen() { return seen; } };
if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();

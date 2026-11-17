/* Landfall — a new build is out. UI only (Lachlan, 2026-11-16: will people playing now get the changes?).
   Where the build id comes from: on the public site, the latest commit of the public repo the publish step pushes to
   (GitHub's API, one small unauthenticated request every five minutes, well inside its 60 an hour); on the LAN,
   version.txt, which tools/serve.py answers from git HEAD. The page reads it once when it loads, then every five
   minutes and whenever the tab comes back into view. When it changes, a strip under the header says so and offers a
   reload, two minutes later so GitHub Pages has finished deploying. Reload first refetches the scripts and stylesheet
   past the browser's cache (Pages lets them be cached for ten minutes), then reloads. The game is saved after every
   choice, so the colony picks up where it was (a new LF.VERSION would start a fresh one, so that is only ever bumped on
   purpose). Nothing reloads without a tap; nothing happens on file:// or when no build id can be had. */
(function () {
'use strict';
if (!/^https?:$/.test(location.protocol)) return;
let mine = null, shown = false;
const PUBLIC = /(^|\.)play-landfall\.com$|(^|\.)campbellcraigie\.com$|\.github\.io$/.test(location.hostname);
const SRC = PUBLIC ? 'https://api.github.com/repos/play-landfall/landfall-public/commits/main' : 'version.txt';
const read = () => fetch(SRC, { cache: 'no-store', headers: PUBLIC ? { Accept: 'application/vnd.github.sha' } : {} })
  .then(r => r.ok ? r.text() : null).then(t => (t || '').trim().slice(0, 40) || null).catch(() => null);
function check() {
  if (shown) return;
  read().then(v => { if (!v) return; if (mine === null) { mine = v; return; } if (v !== mine) { shown = true; setTimeout(offer, PUBLIC ? 120000 : 0); } });
}
function offer() {
  const el = document.createElement('div'); el.id = 'update'; el.setAttribute('role', 'status');
  el.innerHTML = '<span>A new version of the game is out. Your colony is saved.</span><button type="button">Reload</button>';
  el.querySelector('button').addEventListener('click', () => {
    const urls = [...document.scripts].map(x => x.src).concat([...document.querySelectorAll('link[rel=stylesheet]')].map(x => x.href)).filter(u => u && u.startsWith(location.origin));
    Promise.all(urls.map(u => fetch(u, { cache: 'reload' }).catch(() => null))).then(() => location.reload()); });
  const head = document.querySelector('header'); if (head && head.parentNode) head.parentNode.insertBefore(el, head.nextSibling); else document.body.appendChild(el);
}
check();
setInterval(check, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
window.LFUpdate = { check };
})();

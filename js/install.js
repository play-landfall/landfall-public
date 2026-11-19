/* Landfall — offer to put the game on the home screen (Lachlan, 2026-11-19). UI only.
   The manifest lives in art/app/ because the publish step copies art/ wholesale but only named files from the root; its
   scope and start_url point back up to the page, so the installed app opens index.html with the same storage as the
   browser on Android, and the colony saved after every choice picks up where it was. Chrome and Edge fire
   beforeinstallprompt when the page qualifies; the strip shows a while after the page loads, never in the installed app,
   and "Not now" keeps it away for a fortnight. Safari has no such event, so nothing shows there. */
(function () {
'use strict';
const KEY = 'landfall.installNo', WAIT = 45 * 1000, AGAIN = 14 * 24 * 3600 * 1000;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const snoozed = () => { try { return Date.now() - (+localStorage.getItem(KEY) || 0) < AGAIN; } catch (e) { return false; } };
let ask = null, el = null;
function hide() { if (el) { el.remove(); el = null; } }
function offer() {
  if (!ask || el || standalone() || snoozed()) return;
  if (document.getElementById('boot')) return void setTimeout(offer, 10 * 1000);   // still on the loading screen
  el = document.createElement('div'); el.id = 'install'; el.setAttribute('role', 'status');
  el.innerHTML = '<span>Put Landfall on your home screen. Your colony comes with it.</span><button type="button" data-k="no">Not now</button><button type="button" data-k="yes">Install</button>';
  el.addEventListener('click', ev => {
    const k = ev.target.dataset && ev.target.dataset.k; if (!k) return;
    if (k === 'yes' && ask) { const p = ask; ask = null; p.prompt(); p.userChoice.catch(() => {}); }
    else { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
    hide();
  });
  const head = document.querySelector('header'); if (head && head.parentNode) head.parentNode.insertBefore(el, head.nextSibling); else document.body.appendChild(el);
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); ask = e; setTimeout(offer, WAIT); });
addEventListener('appinstalled', () => { ask = null; hide(); });
})();

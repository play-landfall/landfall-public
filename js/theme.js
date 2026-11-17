/* Landfall — colour themes. UI only. Sets the palette variables that style.css reads, and recolours the raster art.
   The art is printed in three colours (navy, rust, cream). An affine map on its red and blue channels sends each one
   to a theme colour exactly, and blends stay blends, so no image is regenerated per theme. The two filters live in
   index.html (#ink-icon for icons, #ink-pic for the emblem and vignettes); this file only writes their matrices. */
(function () {
'use strict';
const KEY = 'landfall.theme', DEFAULT = 'frontier';
// on: text on the accent. plate: the dark of a recoloured picture. shade: drop shadows. glint: the top edge of a raised surface.
const THEMES = {
  // Taken from the scene art's own colours (its dominant navy, rust, cream, ochre and teal), so pictures and page match.
  frontier: { name: 'Frontier', bg: '#09182d', paper: '#0e1f37', card: '#12233c', raise: '#1c304e', ink: '#e1d6b4', rust: '#d26a36', dim: '#8f8a76', line: '#2a3b55', good: '#7fb3a3', bad: '#e0704e', plate: '#1c304e' },
  watch: { name: 'Night Watch', bg: '#0c1218', paper: '#131b22', card: '#1b2630', raise: '#243340', ink: '#ece3d0', rust: '#e2703f', dim: '#9a9a8c', line: '#33424e', good: '#74c2a4', bad: '#f0795c', plate: '#243440' },
  fire: { name: 'Banked Fire', bg: '#100c0a', paper: '#191411', card: '#231c17', raise: '#30261e', ink: '#f1e4cc', rust: '#f08a3c', dim: '#a3927c', line: '#43362b', good: '#9ec27a', bad: '#f0694f', plate: '#33281f' },
  sleep: { name: 'Cold Sleep', bg: '#080d11', paper: '#0e161c', card: '#152129', raise: '#1e2f3a', ink: '#d8e6ea', rust: '#58c8d8', dim: '#8198a3', line: '#2a3d49', good: '#7fd3a0', bad: '#f27a6a', plate: '#1d303b' },
  phosphor: { name: 'Phosphor', bg: '#0a0e0a', paper: '#111611', card: '#19201a', raise: '#232d24', ink: '#dfe5cc', rust: '#e8b04a', dim: '#8f9a80', line: '#334034', good: '#8fd08a', bad: '#ef7558', plate: '#243026' },
  lamp: { name: 'Lamp Black', bg: '#000000', paper: '#0a0a0a', card: '#141414', raise: '#202020', ink: '#f2ede2', rust: '#ef4f2f', dim: '#99948a', line: '#333333', good: '#7cc7a0', bad: '#ff8f7a', plate: '#202020' },
  dusk: { name: 'Long Dusk', bg: '#0f0b14', paper: '#17121d', card: '#211a2a', raise: '#2d2439', ink: '#e9e0ee', rust: '#f2b25c', dim: '#9c90a8', line: '#3b3048', good: '#7fcfb0', bad: '#f47b82', plate: '#2e2439' },
  light: { name: 'Paper', light: true, bg: '#d9cfb8', paper: '#ece3d0', card: '#f7f0e1', raise: '#fffaf0', ink: '#1c2730', rust: '#c2552d', dim: '#6f6859', line: '#cfc3a8', good: '#2f6f5e', bad: '#a5371f', on: '#fff8ec',
    shade: 'rgba(70,52,20,.16)', glint: 'rgba(255,255,255,.7)' },
};
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const SRC = [rgb('#1a2c36'), rgb('#b84a1e'), rgb('#f0e2d2')]; // the art's navy, rust and cream
const SAME = '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
function matrix(to) {
  const [a, b, c] = SRC.map(p => [p[0], p[2], 1]);
  const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det([a, b, c]), rows = [];
  for (let ch = 0; ch < 3; ch++) {
    const col = k => det([a, b, c].map((r, i) => r.map((v, j) => j === k ? to[i][ch] : v))) / D;
    rows.push(`${col(0).toFixed(4)} 0 ${col(1).toFixed(4)} 0 ${col(2).toFixed(4)}`);
  }
  return rows.join(' ') + ' 0 0 0 1 0';
}
let current = DEFAULT, grimV = 0;
/* Low humanity (js/humanity.js LF.grim; Lachlan, 2026-11-16): every theme drains toward one palette of dried blood and
   ash, by up to 70% at nothing. The page eases into it (style.css transitions the surfaces), and the card art is
   desaturated in CSS through --grim. The light theme darkens with the rest. */
const GRIM = { bg: '#0b0505', paper: '#130908', card: '#1a0d0b', raise: '#261310', ink: '#d6c3b0', rust: '#9e2a1e', dim: '#86695d', line: '#36201b', good: '#7f8f78', bad: '#c9442f', plate: '#261310' };
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(255 * (v + (B[i] - v) * k)).toString(16).padStart(2, '0')).join(''); };
function set(key, keep) {
  const t0 = THEMES[key] || THEMES[DEFAULT], root = document.documentElement; current = THEMES[key] ? key : DEFAULT;
  const k0 = 0.7 * grimV, t = grimV ? Object.assign({}, t0, ...Object.keys(GRIM).map(k => ({ [k]: mix(t0[k] || t0.card, GRIM[k], k0) })), grimV > 0.5 ? { light: false, on: null, shade: null, glint: null } : {}) : t0;
  root.style.setProperty('--grim', grimV.toFixed(3)); root.classList.toggle('grim', grimV > 0); root.classList.toggle('grim2', grimV > 0.5);
  for (const k of ['bg', 'paper', 'card', 'raise', 'ink', 'rust', 'dim', 'line', 'good', 'bad']) root.style.setProperty('--' + k, t[k]);
  root.style.setProperty('--on', t.on || t.bg);
  root.style.setProperty('--shade', t.shade || 'rgba(0,0,0,.42)'); root.style.setProperty('--glint', t.glint || 'rgba(255,255,255,.055)');
  root.style.colorScheme = t.light ? 'light' : 'dark';
  const m = (id, to) => { const el = document.getElementById(id); if (el) el.setAttribute('values', t.light ? SAME : matrix(to.map(rgb))); };
  m('ink-icon-m', [t.ink, t.rust, t.card]); m('ink-pic-m', [t.plate || t.card, t.rust, t.ink]);
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = t.paper;
  if (keep !== false) try { localStorage.setItem(KEY, current); } catch (e) {}
}
let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
set(saved, false);
/* grim(g): called by the UI after every render; only redraws when the value has moved. */
function grim(g) { g = Math.max(0, Math.min(1, +g || 0)); if (Math.abs(g - grimV) < 0.004) return; grimV = g; set(current, false); }
window.LFTheme = { THEMES, set, grim, get current() { return current; } };
})();

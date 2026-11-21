/* Landfall — colour themes. UI only. Sets the palette variables that style.css reads, and recolours the raster art.
   The art is printed in three colours (navy, rust, cream). An affine map on its red and blue channels sends each one
   to a theme colour exactly, and blends stay blends, so no image is regenerated per theme. The two filters live in
   index.html (#ink-icon for icons, #ink-pic for the emblem and vignettes); this file only writes their matrices. */
(function () {
'use strict';
const KEY = 'landfall.theme', DEFAULT = 'frontier';
// on: text on the accent. plate: the dark of a recoloured picture. shade: drop shadows. glint: the top edge of a raised surface.
// Three since 2026-11-18 (Lachlan): Ariadne (the default), Dark and Light. Keys kept so saved choices survive; any other saved key falls back to Ariadne.
const THEMES = {
  // Taken from the scene art's own colours (its dominant navy, rust, cream, ochre and teal), so pictures and page match.
  frontier: { name: 'Ariadne', bg: '#09182d', paper: '#0e1f37', card: '#12233c', raise: '#1c304e', ink: '#e1d6b4', rust: '#d26a36', dim: '#8f8a76', line: '#2a3b55', good: '#7fb3a3', bad: '#e0704e', was: '#6f9be0', plate: '#1c304e' },
  lamp: { name: 'Dark', bg: '#000000', paper: '#0a0a0a', card: '#141414', raise: '#202020', ink: '#f2ede2', rust: '#ef4f2f', dim: '#99948a', line: '#333333', good: '#7cc7a0', bad: '#ff8f7a', was: '#78a8f0', plate: '#202020' },
  light: { name: 'Light', light: true, bg: '#d9cfb8', paper: '#ece3d0', card: '#f7f0e1', raise: '#fffaf0', ink: '#1c2730', rust: '#c2552d', dim: '#6f6859', line: '#cfc3a8', good: '#2f6f5e', bad: '#a5371f', was: '#2f5f9e', on: '#fff8ec',
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
const SPEAK = { command: '#e9b93c', security: '#e2553f', engineer: '#f08a2e', doctor: '#39c2a0', scientist: '#5aa2f2', crew: '#93cf4a' };
const GRIM = { bg: '#0b0505', paper: '#130908', card: '#1a0d0b', raise: '#261310', ink: '#d6c3b0', rust: '#9e2a1e', dim: '#86695d', line: '#36201b', good: '#7f8f78', bad: '#c9442f', was: '#5d6f8c', plate: '#261310' };
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(255 * (v + (B[i] - v) * k)).toString(16).padStart(2, '0')).join(''); };
function set(key, keep) {
  const t0 = THEMES[key] || THEMES[DEFAULT], root = document.documentElement; current = THEMES[key] ? key : DEFAULT;
  const k0 = 0.7 * grimV, t = grimV ? Object.assign({}, t0, ...Object.keys(GRIM).map(k => ({ [k]: mix(t0[k] || t0.card, GRIM[k], k0) })), grimV > 0.5 ? { light: false, on: null, shade: null, glint: null } : {}) : t0;
  root.style.setProperty('--grim', grimV.toFixed(3)); root.classList.toggle('grim', grimV > 0); root.classList.toggle('grim2', grimV > 0.5);
  for (const k of ['bg', 'paper', 'card', 'raise', 'ink', 'rust', 'dim', 'line', 'good', 'bad', 'was']) root.style.setProperty('--' + k, t[k]);
  // Whose line it is (js/speak.js): one colour a seat, fixed whoever holds it, mixed toward the theme's ink so it reads on every palette.
  for (const k in SPEAK) root.style.setProperty('--sp-' + k, `color-mix(in oklab, ${SPEAK[k]} ${t.light ? 62 : 58}%, ${t.ink})`);
  // Anyone who is not one of the twelve (a colonist, a child, a stranger): a light grey, set apart from the narration (Lachlan, 2026-11-18).
  root.style.setProperty('--sp-other', `color-mix(in oklab, ${t.light ? '#6c7078' : '#b4b9c2'} 80%, ${t.ink})`);
  // The key crew's name and post over their speech (Lachlan, 2026-11-19): gold, darkened on the light theme so it reads on cream.
  root.style.setProperty('--gold', t.light ? '#9a6f0e' : `color-mix(in oklab, ${SPEAK.command} 88%, ${t.ink})`);
  // the middle band of a roll's chance, "Even" (Lachlan, 2026-11-21): a lemon yellow, apart from the roll's gold edge
  root.style.setProperty('--even', t.light ? '#8a6d00' : '#ecd35c');
  // A colonist's portrait ground, and the blank of one not painted yet (white).
  root.style.setProperty('--face-col', '#bebcb6'); root.style.setProperty('--face-off', '#02223a'); root.style.setProperty('--face-blank', '#ffffff'); root.style.setProperty('--face-static', t.light ? '#42474e' : '#1a1d21');
  root.style.setProperty('--on', t.on || t.bg);
  root.style.setProperty('--shade', t.shade || 'rgba(0,0,0,.42)'); root.style.setProperty('--glint', t.glint || 'rgba(255,255,255,.055)');
  root.style.colorScheme = t.light ? 'light' : 'dark';
  const m = (id, to) => { const el = document.getElementById(id); if (el) el.setAttribute('values', t.light ? SAME : matrix(to.map(rgb))); };
  m('ink-icon-m', [t.ink, t.rust, t.card]); m('ink-pic-m', [t.plate || t.card, t.rust, t.ink]);
  // the marks under an option, flat in the text colour, or the loss colour (js/ui.js mk)
  for (const [id, c] of [['ink-flat-c', t.ink], ['ink-loss-c', t.bad]]) { const el = document.getElementById(id); if (el) el.setAttribute('flood-color', c); }
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = t.paper;
  if (keep !== false) try { localStorage.setItem(KEY, current); } catch (e) {}
}
let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
set(saved, false);
/* grim(g): called by the UI after every render; only redraws when the value has moved. */
function grim(g) { g = Math.max(0, Math.min(1, +g || 0)); if (Math.abs(g - grimV) < 0.004) return; grimV = g; set(current, false); }
window.LFTheme = { THEMES, set, grim, get current() { return current; } };
})();

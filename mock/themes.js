/* Dark mode mock-up (NEXT.md item 7). Candidate palettes, applied over the real game without changing it:
   mock/dark.html loads index.html in a frame and calls LFMOCK.apply on its document. Nothing here is used by the game. */
(function () {
'use strict';
const THEMES = {
  watch: { name: 'Night Watch', note: 'The two inks swapped: navy ground, cream line, rust.',
    bg: '#0c1218', paper: '#131b22', card: '#1b2630', raise: '#22303b', ink: '#ece3d0', accent: '#e2703f', dim: '#9a9a8c', line: '#33424e', good: '#74c2a4', bad: '#f0795c', plate: '#243440' },
  fire: { name: 'Banked Fire', note: 'Warm charcoal and ember. The campfire at night.',
    bg: '#100c0a', paper: '#191411', card: '#231c17', raise: '#2d241d', ink: '#f1e4cc', accent: '#f08a3c', dim: '#a3927c', line: '#43362b', good: '#9ec27a', bad: '#f0694f', plate: '#33281f' },
  sleep: { name: 'Cold Sleep', note: 'Blue-black, ice and cyan. A ship console.',
    bg: '#080d11', paper: '#0e161c', card: '#152129', raise: '#1c2c36', ink: '#d8e6ea', accent: '#58c8d8', dim: '#8198a3', line: '#2a3d49', good: '#7fd3a0', bad: '#f27a6a', plate: '#1d303b' },
  phosphor: { name: 'Phosphor', note: 'Green-black with amber. An old field instrument.',
    bg: '#0a0e0a', paper: '#111611', card: '#19201a', raise: '#212a22', ink: '#dfe5cc', accent: '#e8b04a', dim: '#8f9a80', line: '#334034', good: '#8fd08a', bad: '#ef7558', plate: '#243026' },
  lamp: { name: 'Lamp Black', note: 'True black, bone and vermilion. Highest contrast; kind to OLED.',
    bg: '#000000', paper: '#0a0a0a', card: '#141414', raise: '#1d1d1d', ink: '#f2ede2', accent: '#ef4f2f', dim: '#99948a', line: '#333333', good: '#7cc7a0', bad: '#ff8f7a', plate: '#202020' },
  dusk: { name: 'Long Dusk', note: 'Plum night, lilac line, gold. The alien evening.',
    bg: '#0f0b14', paper: '#17121d', card: '#211a2a', raise: '#2b2236', ink: '#e9e0ee', accent: '#f2b25c', dim: '#9c90a8', line: '#3b3048', good: '#7fcfb0', bad: '#f47b82', plate: '#2e2439' },
};

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
// The art is printed in three colours. An affine map on (R, B) sends each to a theme colour exactly, and blends stay blends (no fringes).
const SRC = [rgb('#1a2c36'), rgb('#b84a1e'), rgb('#f0e2d2')]; // navy ink, rust, cream
function matrix(to) {
  const [a, b, c] = SRC.map(p => [p[0], p[2], 1]);
  const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det([a, b, c]), rows = [];
  for (let ch = 0; ch < 3; ch++) {
    const y = to.map(t => t[ch]);
    const col = k => det([a, b, c].map((r, i) => r.map((v, j) => j === k ? y[i] : v))) / D;
    rows.push(`${col(0).toFixed(4)} 0 ${col(1).toFixed(4)} 0 ${col(2).toFixed(4)}`);
  }
  return rows.join(' ') + ' 0 0 0 1 0';
}

/* Shape: how boxes are cut. Type: which faces. Both are independent of the palette. */
const SHAPES = {
  block: { name: 'Block print', note: 'As now: square corners, cream outlines, hard offset shadows.' },
  blockq: { name: 'Block print, quiet', note: 'Square corners, muted outlines, black shadows.' },
  round: { name: 'Rounded print', note: 'Still outlined and offset, but with round corners and pill chips.' },
  soft: { name: 'Soft', note: 'No outlines: rounded cards lifted by soft shadows.' },
};
const F = (fam, file, weight, style) => `@font-face { font-family:"${fam}"; src:url(mock/fonts/${file}.woff2) format("woff2"); font-weight:${weight}; font-style:${style || 'normal'}; font-display:swap; }`;
const VAR = (fam, slug, italic) => F(fam, slug + '-latin-wght-normal', '200 900') + (italic ? F(fam, slug + '-latin-wght-italic', '200 900', 'italic') : '');
const FONTS = {
  journal: { name: 'Journal', note: 'As now: Palatino-style serif with condensed labels (whatever the phone has).' },
  story: { name: 'Storybook', note: 'Fraunces, a soft old-style serif, with Figtree labels.', face: VAR('Fraunces', 'fraunces', 1) + VAR('Figtree', 'figtree', 1), serif: '"Fraunces",Georgia,serif', label: '"Figtree",system-ui,sans-serif', track: '.08em' },
  reader: { name: 'Reader', note: 'Literata, a book face made for screens, with Figtree labels.', face: VAR('Literata', 'literata', 1) + VAR('Figtree', 'figtree', 1), serif: '"Literata",Georgia,serif', label: '"Figtree",system-ui,sans-serif', track: '.08em', size: '15.5px' },
  round: { name: 'Rounded sans', note: 'Nunito throughout. Friendly, least bookish.', face: VAR('Nunito', 'nunito', 1), serif: '"Nunito",system-ui,sans-serif', label: '"Nunito",system-ui,sans-serif', track: '.07em', size: '15.5px' },
  console: { name: 'Console', note: 'Space Grotesk with IBM Plex Mono labels. Reads as ship systems.', face: VAR('Space Grotesk', 'space-grotesk') + F('IBM Plex Mono', 'ibm-plex-mono-latin-500-normal', 500) + F('IBM Plex Mono', 'ibm-plex-mono-latin-600-normal', '600 700'),
    serif: '"Space Grotesk",system-ui,sans-serif', label: '"IBM Plex Mono",ui-monospace,monospace', track: '.01em', size: '15.5px', shrink: 1 },
};

function css(t, shape, font) {
  const bold = shape === 'block' || shape === 'round', soft = shape === 'soft', f = FONTS[font] || FONTS.journal;
  let out = `
:root { --paper:${t.paper}; --card:${t.card}; --ink:${t.ink}; --rust:${t.accent}; --dim:${t.dim}; --line:${t.line}; --good:${t.good}; --bad:${t.bad};
  --raise:${t.raise}; --edge:${bold ? t.ink : t.line}; --shadow:${bold ? t.ink : '#000'}; color-scheme:dark; }
html { background:${t.bg}; }
#app { background-image:radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px); }
header, .view, .view .cap { border-color:var(--edge); }
#menuBtn, .box, .card, .opt, .step button, .seg, .pbtn, .att, .att button, .pbar, .cand .ch .lbl { border-color:var(--edge); }
.box { box-shadow:3px 3px 0 var(--shadow); } .card { box-shadow:4px 4px 0 var(--shadow); }
.opt { background:var(--raise); box-shadow:2px 2px 0 var(--shadow); } .opt:active:not(:disabled) { background:var(--card); }
.opt:disabled, .opt.gone:disabled { border-color:var(--line); box-shadow:none; } .opt.picked:disabled { border-color:var(--rust); box-shadow:none; }
.go { background:var(--rust); color:${t.bg}; border-color:var(--rust); } .opt.big { box-shadow:3px 3px 0 var(--ink); }
.step button, .pbtn, .att button { background:var(--raise); } .step button:disabled, .pbtn:disabled { border-color:var(--line); }
.att button.on { background:var(--ink); color:var(--paper); border-color:var(--ink); } .att button.on span { color:${t.line}; }
.bar, .axis .track { background:rgba(255,255,255,.13); } .eb { background:rgba(255,255,255,.1); }
#sheet { background:rgba(0,0,0,.62); } #sheet .box { box-shadow:none; }
nav { background:${t.bg}; border-top:1px solid var(--line); } nav button { color:var(--ink); } nav .dot { border-color:${t.bg}; }
img[src*="art/icons/"] { filter:url(#lf-icon); }
nav button img { filter:url(#lf-icon); } nav button.on img { filter:none; background:var(--ink); }
img[src*=".webp"], .emblem { filter:url(#lf-pic); }
`;
  if (shape === 'round' || soft) out += `
.card { border-radius:20px; padding:18px 16px 14px; } .box { border-radius:16px; } .opt { border-radius:12px; } .opt.big { border-radius:16px; }
.seg { border-radius:12px; } .att { border-radius:12px; } .att button { border-radius:10px; } .pbtn { border-radius:999px; padding:6px 14px; }
.cords span, .chips span, .cand .ch .lbl { border-radius:999px; padding-left:10px; padding-right:10px; }
.bar, .axis .track, .pbar { border-radius:999px; } .eb, .eb i { border-radius:5px; }
#sheet .box { border-radius:24px 24px 0 0; }
`;
  if (soft) out += `
header, .view, .view .cap { border-width:1px; border-color:var(--line); }
#menuBtn, .box, .card, .opt, .step button, .seg, .pbtn, .att button, .pbar, .cand .ch .lbl { border-width:1px; border-color:var(--line); }
.att { border-width:1px; }
.box { box-shadow:0 1px 0 rgba(255,255,255,.04) inset, 0 6px 18px rgba(0,0,0,.32); } .card { box-shadow:0 1px 0 rgba(255,255,255,.05) inset, 0 10px 30px rgba(0,0,0,.4); }
.opt { box-shadow:0 1px 0 rgba(255,255,255,.05) inset, 0 2px 6px rgba(0,0,0,.28); border-color:transparent; }
.opt:active:not(:disabled) { transform:scale(.985); box-shadow:none; }
.opt:disabled, .opt.gone:disabled { background:transparent; border-color:var(--line); } .opt.picked:disabled { transform:none; border-color:var(--rust); }
.go { border-color:transparent; } .opt.big { box-shadow:0 8px 24px rgba(0,0,0,.45); }
.cords span { border-width:1px; } .chips span { border-width:1px; }
`;
  if (f.serif) out += `${f.face}
:root { --serif:${f.serif}; --label:${f.label}; } body { font-size:${f.size || '16px'}; }
.lbl, h3, .where span, #res span, nav button, .tips span, .cords span, .seg button, .axis span, .mini span, .word, .verdict { letter-spacing:${f.track}; }
.card h2, .where b, .view .cap b, .banner .cap b { letter-spacing:0; }
${f.shrink ? '#res span { font-size:8.5px; } #res b { font-size:11.5px; } nav button { font-size:9px; }' : ''}
`;
  return out;
}

function apply(doc, key, shape, font) {
  for (const id of ['lf-theme', 'lf-filters']) { const el = doc.getElementById(id); if (el) el.remove(); }
  const t = THEMES[key], meta = doc.querySelector('meta[name=theme-color]');
  if (meta) meta.content = t ? t.paper : '#ece3d0';
  if (!t) return;
  if (shape === 'bold') shape = 'block'; if (shape === 'quiet') shape = 'blockq';
  const st = doc.createElement('style'); st.id = 'lf-theme'; st.textContent = css(t, shape || 'block', font || 'journal'); doc.head.appendChild(st);
  const f = (id, to) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix(to.map(rgb))}"/></filter>`;
  const holder = doc.createElement('div'); holder.id = 'lf-filters';
  holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${f('lf-icon', [t.ink, t.accent, t.card])}${f('lf-pic', [t.plate, t.accent, t.ink])}</svg>`;
  doc.body.appendChild(holder);
}

window.LFMOCK = { THEMES, SHAPES, FONTS, apply };
})();

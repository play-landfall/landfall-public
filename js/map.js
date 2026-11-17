/* Landfall — the world, seen from much higher up than the settlement.
   LF.worldMap(s) returns one SVG string: the country around the landing site, laid out from the game's seed so it
   is the same world every time it is shown. Ground the colony has not covered stays under hatching; the survey,
   the parties sent out and the things that have shown themselves uncover it. Pure function of s, no DOM, same paint
   classes as js/scene.js (k ink, p paper, r rust, l-suffixed strokes). A stand-in until the raster world map. */
(function () {
'use strict';
const W = 360, H = 300, CX = 180, CY = 158;
const f = n => Math.round(n * 10) / 10;
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const at = (x, y, body, sc) => `<g transform="translate(${f(x)} ${f(y)})${sc && sc !== 1 ? ` scale(${f(sc)})` : ''}">${body}</g>`;

/* terrain, one family per world type */
const T = {
  mesa: v => `<path class="k" d="M-12 0L-8 -${7 + v * 4}H${7 + v * 2}L12 0Z"/><path class="pl" d="M-6 -3H6"/>`,
  spire: v => `<path class="k" d="M-3 0L-1 -${12 + v * 8}L1 -${10 + v * 7}L3 0Z"/>`,
  peak: v => `<path class="k" d="M-13 0L-2 -${14 + v * 6}L12 0Z"/><path class="p" d="M-2 -${14 + v * 6}L-6 -${8 + v * 4}L-2 -${10 + v * 4}L2 -${8 + v * 4}Z"/>`,
  islet: v => `<path class="k" d="M-${8 + v * 4} 0Q0 -${6 + v * 3} ${8 + v * 4} 0Q0 3 -${8 + v * 4} 0Z"/>`,
  canopy: v => `<circle class="k" cx="-5" cy="-4" r="${5 + v}"/><circle class="k" cx="4" cy="-5" r="${6 + v}"/><circle class="k" cx="0" cy="0" r="5"/><path class="pl" d="M-6 -6Q-4 -8 -1 -7"/>`,
  hill: v => `<path class="kl" style="stroke-width:1.4" d="M-14 0Q0 -${10 + v * 5} 14 0"/><path class="kl" d="M-7 0Q0 -${5 + v * 3} 7 0"/>`,
  rock: () => `<circle class="k" r="1.4"/>`,
  tuft: () => `<path class="kl" d="M-2 0L-3 -3M0 0V-4M2 0L3 -3"/>`,
};
const LAND = { barren: [['mesa', 14], ['rock', 40]], ruin: [['spire', 22], ['mesa', 4], ['rock', 30]], ice: [['peak', 18], ['rock', 20]],
  drowned: [['islet', 12], ['tuft', 20]], jungle: [['canopy', 34], ['tuft', 16]], garden: [['hill', 16], ['canopy', 8], ['tuft', 30]] };
const MARK = {
  fauna: `<path class="k" d="M-6 2L-5 -2Q-3 -6 2 -5L6 -6L5 -2L4 2Z"/>`,
  flora: `<path class="rl" style="stroke-width:1.6" d="M0 3Q-1 -2 -5 -5M0 3Q0 -3 0 -7M0 3Q1 -2 5 -5"/>`,
  plague: `<circle class="r" r="3"/><circle class="rl" r="6" style="stroke-dasharray:2 2"/>`,
  ruin: `<path class="k" d="M-2.5 3L-1.5 -8H1.5L2.5 3Z"/><path class="rl" d="M-1.6 -2H1.6"/>`,
  natives: `<path class="k" d="M-7 3L-4 -3L-1 3ZM0 3L3 -5L6 3Z"/>`,
  humans: `<path class="k" d="M-6 3V-2L-4 -4L-2 -2L0 -4L2 -2L4 -4L6 -2V3Z"/>`,
  lead: `<path class="rl" style="stroke-width:1.8" d="M-3 -3L3 3M3 -3L-3 3"/>`,
};
const RES_WORD = { destroyed: 'gone now', accord: 'at peace with the colony', contained: 'held back', harnessed: 'put to use', lost: 'the colony lives in what it left' };
const KIND_WORD = { fauna: 'hunting ground', flora: 'where it grows thickest', plague: 'where it came from', ruin: 'the ruin', natives: 'where they live', humans: 'their camp' };

/* Where a thing out there sits: fixed by its id and the seed, so it never moves between views. Pressing threats
   are drawn a little closer in. */
function spot(s, key, near) {
  const h = hash(key + ':' + s.seed), a = (h % 3600) / 3600 * Math.PI * 2, d = 78 + (h >>> 12) % 70;
  const k = 1 - 0.35 * (near || 0);
  return [LF.clamp(CX + Math.cos(a) * d * k * 1.25, 18, W - 18), LF.clamp(CY + Math.sin(a) * d * k * 0.82, 20, H - 16)];
}
LF.mapSpot = spot;

LF.worldMap = function (s) {
  if (!s.world) return '';
  const w = s.world, r = rng((s.seed | 0) ^ 0x3a9e1), marks = [], holes = [], lines = [];
  const known = Math.min(150, 46 + (s.survey || 0) * 0.7 + (w.report ? 18 : 0));
  holes.push([CX, CY, known]);
  // the sea, on an ocean world or a delta landing
  let sea = '';
  if (w.type === 'drowned' || s.flags.site_delta || s.flags.site_coast) {
    const side = (s.seed >>> 3) & 1, x0 = side ? W - 70 - r() * 30 : 70 + r() * 30, X = x => side ? x : W - x;
    let d = `M${X(W + 5)} -5L${f(x0)} -5`;
    for (let y = 20; y <= H + 20; y += 28) d += `Q${f(x0 + (side ? -1 : 1) * (r() - 0.5) * 50)} ${y - 14} ${f(x0 + (side ? 1 : -1) * (r() - 0.4) * 30)} ${y}`;
    d += `L${X(W + 5)} ${H + 25}Z`;
    if (w.type === 'drowned') d = `M-5 -5H${W + 5}V${H + 5}H-5Z`;
    sea = `<g data-act="spot" data-v="${w.type === 'drowned' ? 'Open sea, nearly everywhere' : 'The coast'}"><path fill="url(#wm-sea)" d="${d}"/>${w.type === 'drowned' ? '' : `<path class="kl" style="stroke-width:1.4" d="${d}"/>`}</g>`;
  }
  // terrain
  let land = '';
  const fam = LAND[w.type] || LAND.barren;
  for (const [piece, n] of fam) for (let i = 0; i < n; i++) {
    const x = r() * W, y = 10 + r() * (H - 14), v = r() < 0.4 ? 1 : 0;
    if (Math.hypot((x - CX) / 1.3, y - CY) < 26) continue;            // the clearing round the landing site
    land += at(x, y, T[piece](v), 0.7 + r() * 0.5);
  }
  // what has shown itself
  for (const F of s.factors) {
    if (F.kind === 'land') { for (const id in F.seen || {}) { const fr = (LF.frames || []).find(x => x.id === id), [x, y] = spot(s, id);
      const t = fr ? (typeof fr.title === 'function' ? 'A lead from the interior' : fr.title) : 'A lead';
      marks.push(`<g data-act="spot" data-v="${esc(t)}">${at(x, y, MARK.lead)}</g>`); holes.push([x, y, 20]); } continue; }
    if (F.stage < 1 || F.kind === 'faction' || F.kind === 'plague' && !F.res || F.res === 'destroyed') continue;   // wiped out or broken: off the map
    const near = F.res ? 0 : LF.clamp(F.threat / 100, 0, 1), [x, y] = spot(s, F.id, near), dim = F.res === 'destroyed';
    const cap = `${F.Name} · ${F.res ? RES_WORD[F.res] : KIND_WORD[F.kind] || 'out there'}`;
    marks.push(`<g data-act="spot" data-v="${esc(cap)}"${dim ? ' opacity=".4"' : ''}>${at(x, y, MARK[F.kind] || MARK.lead, 1.5)}${!F.res && near > 0.55 ? `<circle class="rl gl" cx="${f(x)}" cy="${f(y)}" r="13"/>` : ''}</g>`);
    holes.push([x, y, 24]);
  }
  // what the orbital report named: labelled once the fog has lifted off it
  const named = [];
  for (const F of (w.report && w.report.features) || []) { const [x, y] = spot(s, 'feat:' + F.name);
    named.push([x, y, `<g data-act="spot" data-v="${esc(`${F.name.charAt(0).toUpperCase() + F.name.slice(1)} · ${F.see}`)}"><circle class="k" cx="${f(x)}" cy="${f(y)}" r="2"/><text class="mt" x="${f(x)}" y="${f(y - 5)}">${esc(F.name.replace(/^the /, ''))}</text></g>`]); }
  // the signature groups have places too
  if (w.arcs.includes('others') && s.used['oth.signal'] !== undefined) { const [x, y] = spot(s, 'reach'); marks.push(`<g data-act="spot" data-v="The Reach · the other ship's people">${at(x, y, MARK.humans, 1.5)}</g>`); holes.push([x, y, 24]); }
  if (w.arcs.includes('hive') && s.used['hive.tracks'] !== undefined) { const [x, y] = spot(s, 'drummers'); marks.push(`<g data-act="spot" data-v="The drummers' warrens">${at(x, y, MARK.natives, 1.5)}</g>`); holes.push([x, y, 24]); }
  if (w.arcs.includes('builders') && s.used['bld.find'] !== undefined) { const [x, y] = spot(s, 'spire'); marks.push(`<g data-act="spot" data-v="The spire">${at(x, y, MARK.ruin, 1.8)}</g>`); holes.push([x, y, 24]); }
  // parties in the field: a trail from the wire toward wherever they went, and how far along it they are
  for (const a of s.away) {
    const F = a.fid && s.factors.find(x => x.id === a.fid), [tx, ty] = F ? spot(s, F.id, F.res ? 0 : LF.clamp(F.threat / 100, 0, 1)) : spot(s, 'to:' + a.to);
    const p = a.silent ? 1 : LF.clamp((s.day - a.left) / Math.max(1, a.due - a.left), 0, 1), half = p < 0.5 ? p * 2 : (1 - p) * 2;
    const px = CX + (tx - CX) * half, py = CY + (ty - CY) * half;
    lines.push(`<g data-act="spot" data-v="${esc(`${a.n} away · ${a.to}${a.silent ? ' · overdue' : ''}`)}"><path class="rl" style="stroke-dasharray:1.5 4;stroke-width:1.8" d="M${CX} ${CY}L${f(tx)} ${f(ty)}"/>${at(px, py, `<circle class="${a.silent ? 'p' : 'r'}" r="3.4"/><circle class="kl" r="3.4"/>`)}</g>`);
    holes.push([tx, ty, 16]);
  }
  for (const [x, y, m] of named) if (holes.some(h => Math.hypot(x - h[0], y - h[1]) < h[2] * 0.9)) marks.push(m);
  const fog = `<mask id="wm-seen"><rect width="${W}" height="${H}" fill="#fff"/>${holes.map(([x, y, rad]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="#000"/>`).join('')}</mask>`;
  const site = `<g data-act="spot" data-v="${esc(`${w.planet}: the colony, ${LF.num(LF.heads(s))} people`)}"><circle class="kl" style="stroke-dasharray:3 2.5" cx="${CX}" cy="${CY}" r="11"/><circle class="r" cx="${CX}" cy="${CY}" r="4.5"/><circle class="kl" cx="${CX}" cy="${CY}" r="4.5"/></g>`;
  return `<svg class="scene map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The country around the colony">
<defs><pattern id="wm-sea" width="16" height="8" patternUnits="userSpaceOnUse"><path class="kl" style="stroke-width:.8" d="M0 4q4 -3.5 8 0t8 0"/></pattern>
<pattern id="wm-fog" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect class="p" width="6" height="6" opacity=".78"/><path class="kl" style="stroke-width:.7;opacity:.5" d="M0 0V6"/></pattern>${fog}</defs>
${sea}${land}<rect width="${W}" height="${H}" fill="url(#wm-fog)" mask="url(#wm-seen)" data-act="spot" data-v="Ground nobody has walked yet"/>${lines.join('')}${marks.join('')}${site}</svg>`;
};
})();

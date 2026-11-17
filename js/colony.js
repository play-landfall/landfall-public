/* Landfall — what stands in the colony picture, from the growth plan (tools/plan.py -> js/colony-plan.js).
   LF.colonyShown(s) reads the state and returns the slots that exist now, each with the state it is in, plus the
   paths worn between them, the ground cleared and which ring of the wire is up. No DOM, no dice, nothing stored:
   a pure function of s. A slot only ever appears where the plan put it, so whatever the build order, the picture
   is a planned site at every moment. LF.colonyPlace turns a slot into a place and a size on a world's plate. LF.colonyView is the picture itself. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// The town (2026-11-18; DESIGN.md "The settlement picture"). Everything is read off the state as it stands, nothing is
// remembered, so two sums stand in for the past. LF.colonyGrown is everyone who has ever lived here, near enough: the
// living and the dead. What is permanent (the first blocks, stone, paving, the hall) goes by it and so never comes down.
// LF.colonyOnce is how many the place was built to house: the living, and the dead counted for less the longer the
// colony has stood (forty years of ordinary dying is not a town that was once twice the size). The rows of houses go
// by it; who lives in them is LF.heads, and the gap between the two is the empty houses.
LF.colonyGrown = s => LF.heads(s) + (s.deaths || 0);
LF.colonyYears = s => Math.max(0, (s.day - (s.landed || 0)) / LF.YEAR);
LF.colonyOnce = s => LF.heads(s) + (s.deaths || 0) / (1 + LF.colonyYears(s) / 8);
LF.colonyBlocks = s => clamp(Math.ceil(Math.ceil((s.built.housing ? LF.colonyGrown(s) : LF.heads(s)) / 9) / 4), 1, 4);
// A town takes years as well as people: [how many must have lived here, how many years down].
LF.TOWN = { paved: [300, 8], hall: [300, 10], gate: [300, 10], homes: [[300, 12], [300, 12], [600, 20], [600, 20]], old: 15, empty: 0.85, ruin: 0.5 };

LF.colonyShown = function (s) {
  const P = LF.COLONY_PLAN, out = { slots: {}, paths: [], zones: [], ring: 0, wear: {}, paved: false, old: false };
  if (!s.world || !P) return out;
  const b = s.built, fl = s.flags, live = k => s.factors.some(F => F.kind === k && F.stage >= 1 && F.res !== 'destroyed');
  const T = LF.TOWN, h = LF.heads(s), ever = LF.colonyGrown(s), once = LF.colonyOnce(s), yrs = LF.colonyYears(s), perm = a => !!b.housing && ever >= a[0] && yrs >= a[1], kids = LF.children ? LF.children(s).n : 0;
  const blocks = LF.colonyBlocks(s), sown = b.fields || fl.first_sow === 'all' ? 4 : fl.first_sow ? 2 : 0;
  const mach = id => { const m = s.machines[id]; return m.lost ? 'lost' : m.hp < 40 ? 'bad' : 'ok'; };
  const project = id => b[id] ? 'built' : s.project === id ? 'scaffold' : null;
  // a group of houses raised for `at` people: lived in, standing empty, or (well short of that many) roofless
  const wear = (id, at) => { if (h < at * T.empty) out.wear[id] = h >= at * T.ruin ? 'empty' : 'ruin'; };
  const test = (id, sl) => {
    const [k, v] = sl.when.split(':');
    if (k === 'start') return s.machines[id] ? mach(id) : id === 'flag' ? (s.morale < 30 ? 'low' : 'high') : 'built';
    if (k === 'block') { if (+v > blocks) return null; if (!b.housing) return 'pods';
      wear(id, (+v - 1) * 36 + 1); return perm(T.homes[+v - 1]) ? 'homes' : 'habitats'; }
    if (k === 'built') return project(v);
    if (k === 'sown') return sown >= +v ? 'built' : null;
    if (k === 'shelter') return (s.world.climate === 'storm') === (v === 'wall') ? project('shelter') : null;
    if (k === 'deaths') return s.deaths > 0 ? (s.deaths < 12 ? 'few' : 'many') : null;
    if (k === 'plague' || k === 'faction') return live(k) ? 'built' : null;
    if (k === 'overdue') return s.away.some(a => a.silent) ? 'built' : null;
    // the town: rows of houses once that many have lived here; the tall ones want metal of the colony's own
    if (k === 'grown' || k === 'tall') { if (!b.housing || once < +v || (k === 'tall' && !b.smelter && !b.machineshop)) return null; wear(id, +v); return 'built'; }
    if (k === 'hall') return b.school && perm(T.hall) ? 'built' : null;
    if (k === 'gate') return perm(T.gate) ? 'built' : null;
    if (k === 'farther') return b.fields && once >= +v && h >= +v * T.ruin ? 'built' : null;   // far fields go back to the wild when there is nobody to work them
    if (k === 'buried') return s.deaths >= +v ? 'built' : null;
    if (k === 'yard') return b.school && kids >= +v ? 'built' : null;
    return null;
  };
  const paths = new Set(), zones = new Set();
  for (const [id, sl] of Object.entries(P.slots)) {
    const st = test(id, sl); if (!st) continue;
    out.slots[id] = st; if (!sl.free) out.ring = Math.max(out.ring, sl.ring);
    if (P.zones[sl.zone]) zones.add(sl.zone);
    for (let p of sl.paths) while (p && !paths.has(p)) { paths.add(p); p = P.paths[p].after; }   // a path brings the one it branches from
  }
  // the wire goes up once the colony has built something or been down ten days; a larger ring implies the smaller
  if (out.ring < 2 && s.day < 10 && !Object.keys(b).length) out.ring = 0;
  out.paths = Object.keys(P.paths).filter(p => paths.has(p));
  out.zones = Object.keys(P.zones).filter(z => zones.has(z));
  out.paved = perm(T.paved);                                               // a town paves its streets
  out.old = !!(s.machines.lander && s.machines.lander.lost) && yrs >= T.old;                        // the lander that will not fly again, fifteen years on: its pad grown over
  return out;
};

// A ground point in metres (x east, z south of the lander) on a world's plate: [x, y] as fractions of the plate's
// width and height, and the size of a metre there as a share of the plate's height. Same sum as tools/plan.py.
LF.colonyPlace = function (world, x, z) {
  const P = LF.COLONY_PLAN, c = P.cam[world] || P.cam.default, H = (c.yl - c.yh) / c.ppm, Zl = H / c.fore, f = c.ppm * Zl;
  const Z = Math.max(6, Zl - z), m = f / Z;
  return [c.x0 + x * m / P.aspect, c.yh + f * H / Z, m];
};

/* ---------- the picture ---------- */
// LF.colonyView(s): the Colony view's picture as one SVG string. The painted plate; over it the painted ground, shown
// only where the plan says it is cleared (the yard, and four metres round each thing that stands) and where a path is
// worn; then the build patches from far to near; then the plate's foreground. Everything can be tapped for a caption,
// as in the old drawing. Where a world has no painted pieces it falls back to the code-drawn settlement (LF.scene).
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = n => Math.round(n * 10) / 10;
// The part of the plate the view shows: the sky's top and the far edges are trimmed so the colony is larger on a phone.
const VIEW = '100 90 1080 760';
const SUFFIX = { pods: 1, habitats: 1, homes: 1 }, BACK = { homes: 'habitats' };
const job = (id, st) => SUFFIX[st] ? `${id}_${st}` : id;

LF.colonyCaption = function (s, id, st, v2) {
  const sl = LF.COLONY_PLAN.slots[id], [k, v] = sl.when.split(':');
  const built = p => s.built[p] ? ` · built ${LF.dateStr(s.built[p]).toLowerCase()}` : '';
  if (s.machines[id]) return `${LF.MACHINES[id].name} · ${LF.machineWord(s, id).toLowerCase()}`;
  if (id === 'flag') return s.morale < 30 ? 'The colony flag, low on its pole' : 'The colony flag';
  if (id === 'stores') return 'The stores';
  const worn = (w => w === 'ruin' ? ' · roofs gone, nobody left to live there' : w === 'empty' ? ' · standing empty' : '')(v2 && v2.wear[id]);
  if (k === 'block') return st === 'pods' ? 'Cargo pods · where people sleep' : st === 'homes' ? `Stone houses, where the first habitats stood${worn}` : `Permanent housing${built('housing')}${worn}`;
  if (k === 'grown') return `${id === 'rowe' ? 'East Row' : id.startsWith('high') ? 'High Street' : 'Hill Row'}${worn}`;
  if (k === 'tall') return `Top Street · three storeys${worn}`;
  if (k === 'hall') return 'The hall, and its bell';
  if (k === 'gate') return 'The town gate, at the foot of Landing Street';
  if (k === 'farther') return 'The far fields';
  if (k === 'buried') return `The new burial ground · ${LF.num(s.deaths)} buried here since the landing`;
  if (k === 'yard') { const n = LF.children(s).n; return `The schoolyard · ${LF.num(n)} children in the colony`; }
  if (k === 'built' || k === 'shelter') { const p = k === 'shelter' ? 'shelter' : v; return st === 'scaffold' ? `${LF.projName(s, p)} · going up` : `${LF.projName(s, p)}${built(p)}`; }
  if (k === 'sown') return s.built.fields ? 'The first plots' : 'Trial plots';
  if (k === 'deaths') return 'The burial ground';
  if (k === 'overdue') { const a = s.away.find(x => x.silent); return `A lamp for the party sent to ${a ? a.to : 'the country'} · overdue`; }
  if (k === 'plague' || k === 'faction') { const F = s.factors.find(x => x.kind === k && x.stage >= 1 && x.res !== 'destroyed'); return F ? F.Name : ''; }
  return '';
};

LF.colonyView = function (s) {
  const P = LF.COLONY_PLAN, A = LF.COLONY_ART, art = s.world && A && A.worlds[s.world.type];
  if (!P || !art) return LF.scene ? LF.scene(s) : '';
  const W = A.w, H = A.h, world = s.world.type, v = LF.colonyShown(s), dir = 'art/pieces/colony/';
  const XY = (x, z) => { const p = LF.colonyPlace(world, x, z); return `${r1(p[0] * W)},${r1(p[1] * H)}`; };
  const rect = (sl, g) => { const w = sl.foot[0], d = sl.foot[1], half = (sl.n - 1) / 2 * (w + sl.gap) + w / 2;
    return [[sl.x - half - g, sl.z - d - g], [sl.x + half + g, sl.z - d - g], [sl.x + half + g, sl.z + g], [sl.x - half - g, sl.z + g]].map(p => XY(p[0], p[1])).join(' '); };
  // a path as the ground it covers: one quad a stretch, a little wider than surveyed
  const band = (id, g) => { const p = P.paths[id], r = p.w / 2 + g; let o = '';
    for (let i = 1; i < p.pts.length; i++) { const [x1, z1] = p.pts[i - 1], [x2, z2] = p.pts[i], L = Math.hypot(x2 - x1, z2 - z1) || 1, ux = (x2 - x1) / L * r, uz = (z2 - z1) / L * r;
      o += `<polygon points="${XY(x1 - ux + uz, z1 - uz - ux)} ${XY(x2 + ux + uz, z2 + uz - ux)} ${XY(x2 + ux - uz, z2 + uz + ux)} ${XY(x1 - ux - uz, z1 - uz + ux)}"/>`; }
    return o; };
  let clear = `<polygon points="${P.zones.core.map(p => XY(p[0], p[1])).join(' ')}"/>`, townClear = '', things = [], pads = '';
  const isTown = z => P.townZones && P.townZones.includes(z);
  for (const id of Object.keys(v.slots)) { const sl = P.slots[id], st = v.slots[id], cap = LF.colonyCaption(s, id, st, v), wear = v.wear[id];
    if (P.zones[sl.zone]) { if (isTown(sl.zone)) townClear += `<polygon points="${rect(sl, 4)}"/>`; else clear += `<polygon points="${rect(sl, 4)}"/>`; }
    if (st === 'scaffold') { pads += `<polygon class="pad"${cap ? ` data-act="spot" data-v="${esc(cap)}"` : ''} points="${rect(sl, 0)}"/>`; continue; }   // going up: a pegged-out pad
    // which painting: the roofless one for a ruin, the aged lander, the state's own, else the one it was before (stone homes not painted: habitats)
    let name = job(id, st), cls = st === 'lost' ? 'lost' : '';
    if (!art.patches[name]) name = art.patches[job(id, BACK[st])] ? job(id, BACK[st]) : id;
    if (id === 'lander' && v.old && art.patches.lander_old) { name = 'lander_old'; cls = ''; }   // the painting says it: no need to darken it too
    if (wear === 'ruin' && art.patches[id + '_ruin']) name = id + '_ruin'; else if (wear) cls = wear;
    const p = art.patches[name];
    if (!p) { if (!sl.town) pads += `<polygon class="pad"${cap ? ` data-act="spot" data-v="${esc(cap)}"` : ''} points="${rect(sl, 0)}"/>`; continue; }   // a town slot nobody has painted on this world is left out
    const fresh = s.lastBuilt && s.day - s.lastBuilt.d < 2 && sl.when.split(':')[1] === s.lastBuilt.id;
    things.push([sl.z, `<image${cap ? ` data-act="spot" data-v="${esc(cap)}"` : ''}${cls ? ` class="${cls}"` : fresh ? ' class="new"' : ''} href="${dir}${world}_${p[4] || name}.webp" x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}"${p[4] ? ' preserveAspectRatio="none"' : ''}/>`]);
  }
  // the build in hand (T2-2): a soft ring on the ground round the slot it stands on, an ellipse in metres so it lies flat
  let here = '';
  if (s.project) for (const [id, sl] of Object.entries(P.slots)) { const [k, w] = sl.when.split(':');
    if (!v.slots[id] || !(k === 'built' && w === s.project || k === 'shelter' && s.project === 'shelter' || k === 'block' && s.project === 'housing' && v.slots[id] === 'pods')) continue;
    const hw = (sl.n - 1) / 2 * (sl.foot[0] + sl.gap) + sl.foot[0] / 2 + 2.5, hd = sl.foot[1] / 2 + 2.5, cz = sl.z - sl.foot[1] / 2;
    here += `<polygon class="here" points="${Array.from({ length: 32 }, (_, i) => { const a = i / 32 * 2 * Math.PI; return XY(sl.x + Math.cos(a) * hw, cz + Math.sin(a) * hd); }).join(' ')}"/>`; }
  const old = v.paths.filter(id => !P.paths[id].town), town = v.paths.filter(id => P.paths[id].town), paved = v.paved && art.paved ? (P.paved || []).filter(id => v.paths.includes(id)) : [];
  const paths = old.map(id => `<polyline points="${P.paths[id].pts.map(p => XY(p[0], p[1])).join(' ')}" stroke-width="${r1(P.paths[id].w * LF.colonyPlace(world, P.paths[id].pts[0][0], P.paths[id].pts[0][1])[2] * H * 0.55 + 5)}"/>`).join('');
  const full = `maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"`, img = k => `<image href="${dir}${world}_ground_${k}.webp" width="${W}" height="${H}"`;
  const ground = art.ground ? `<defs><filter id="lf-b6" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="lf-b2" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="2.5"/></filter>
<mask id="lf-zm" ${full}><g fill="#fff" filter="url(#lf-b6)">${clear}</g></mask>
<mask id="lf-pm" ${full}><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" filter="url(#lf-b2)">${paths}</g></mask>${
  art.town && (townClear || town.length) ? `<mask id="lf-tm" ${full}><g fill="#fff" filter="url(#lf-b6)">${townClear}</g><g fill="#fff" filter="url(#lf-b2)">${town.map(id => band(id, 0.4)).join('')}</g></mask>` : ''}${
  paved.length ? `<mask id="lf-vm" ${full}><g fill="#fff" filter="url(#lf-b2)">${paved.map(id => band(id, 0.8)).join('')}</g></mask>` : ''}</defs>
${img('clear')} mask="url(#lf-zm)"/>${img('paths')} mask="url(#lf-pm)"/>${art.town && (townClear || town.length) ? `${img('town')} mask="url(#lf-tm)"/>` : ''}${paved.length ? `${img('paved')} mask="url(#lf-vm)"/>` : ''}` : '';
  // what on the plate itself stands nearer than something built: cut from the plate, drawn over whatever is behind it
  for (const o of art.occ || []) things.push([o[0], `<image href="${dir}${world}_${o[1]}.webp" x="${o[2]}" y="${o[3]}" width="${o[4]}" height="${o[5]}" pointer-events="none"/>`]);
  things.sort((a, b) => a[0] - b[0]);
  return `<svg class="scene painted" viewBox="${VIEW}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The settlement">
<image href="${art.plate}" width="${W}" height="${H}"/>${ground}${pads}${here}${things.map(t => t[1]).join('')}${art.fg ? `<image href="art/pieces/fg_${world}.webp" width="${W}" height="${H}" pointer-events="none"/>` : ''}</svg>`;
};
})();

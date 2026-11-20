/* Landfall — the painted world map, from the map plan (tools/worldplan.py -> js/world-plan.js).
   LF.mapSlots(s) gives everything out there its slot on the world's painted map: the same slot every time, and never
   one that something else has. LF.mapShown(s) is what the map shows now (the colony at its size, what has been
   found, the leads, the parties away, the ground still unwalked). LF.worldView(s) is the picture: the plate, a
   painted patch in each slot in use, and over them what moves or changes, drawn in code: fog, trails, rings, labels.
   The fog is the map itself blurred past reading (Lachlan, 2026-11-20), so nothing unwalked can be made out.
   Where a world has no plan or no painted pieces it falls back to the drawn map (LF.worldMap, js/map.js).
   No DOM, no dice, nothing stored: pure functions of s. */
(function () {
'use strict';
const hash = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = n => Math.round(n * 10) / 10;
const plan = s => s.world && LF.WORLD_PLAN && LF.WORLD_PLAN.maps[s.world.type];

// The three peoples of the hand-written arcs take a slot painted for a camp, a settlement and a ruin.
const SIG = [['others', 'oth.signal', 'reach', 'humans', "The Reach · the other ship's people"],
  ['hive', 'hive.tracks', 'drummers', 'natives', "The drummers' warrens"], ['builders', 'bld.find', 'spire', 'ruin', 'The spire']];
const TO = { 'the spire': 'spire', 'the warrens': 'drummers', 'the beacon': 'reach' };
const RES_WORD = { destroyed: 'gone now', accord: 'at peace with the colony', contained: 'held back', harnessed: 'put to use', lost: 'the colony lives in what it left' };
const KIND_WORD = { fauna: 'hunting ground', flora: 'where it grows thickest', plague: 'where it came from', ruin: 'the ruin', natives: 'where they live', humans: 'their camp' };

/* Which slot each thing has. Decided from what the world was made with (its arcs and factors, in the order they
   were made) and the seed, never from what has been found so far, so finding one thing cannot move another.
   A thing takes a free slot painted for its kind; the hash of its id, the seed and the slot picks which. On a
   landing made to be near the anomaly, the anomaly takes the nearest. Leads take the small slots in the order the
   colony came on them (the keys of the interior's `seen`, which keep their order), painted slots first. */
LF.mapSlots = function (s) {
  const P = plan(s), out = { site: null, at: {} }; if (!P) return out;
  const w = s.world, site = (w.type === 'drowned' || s.flags.site_delta) && P.colony.wet ? 'wet' : P.colony.dry ? 'dry' : 'wet';
  const col = P.colony[site], taken = {}; out.site = site;
  const want = [], fs = s.factors.filter(F => F.kind !== 'land' && F.kind !== 'faction'), painted = k => P.major.some(m => m.kinds.includes(k));
  const near = s.flags.site_coast && fs.find(F => F.id === w.rumour);
  if (near) want.push([near.id, near.kind, true]);
  for (const [arc, , key, kind] of SIG) if (w.arcs.includes(arc)) want.push([key, kind]);
  for (const F of fs) if (F !== near && painted(F.kind)) want.push([F.id, F.kind]);
  for (const F of fs) if (F !== near && !painted(F.kind)) want.push([F.id, F.kind]);
  for (const [key, kind, nearest] of want) {
    let c = P.major.map((m, i) => i).filter(i => !taken[i] && P.major[i].kinds.includes(kind));
    if (!c.length) c = P.major.map((m, i) => i).filter(i => !taken[i]);
    if (!c.length) continue;
    const rank = i => nearest ? Math.hypot(P.major[i].x - col.x, P.major[i].y - col.y) : hash(key + ':' + s.seed + ':' + i);
    const i = c.sort((a, b) => rank(a) - rank(b))[0]; taken[i] = 1; out.at[key] = 'M' + (i + 1);
  }
  const land = s.factors.find(F => F.kind === 'land');
  const order = P.minor.map((m, i) => i).sort((a, b) => (P.minor[b].paint - P.minor[a].paint) || hash(s.seed + ':m:' + a) - hash(s.seed + ':m:' + b));
  // A place of the colony's own (js/places.js) holds its slot: a lead found after it was given steps round it.
  const held = LF.placeSlots ? LF.placeSlots(s) : [], had = new Set();
  Object.keys((land && land.seen) || {}).forEach((id, n) => { const skip = new Set(held.filter(h => h.nl <= n).map(h => h.slot));
    const i = order.find(j => !had.has(j) && !skip.has('m' + (j + 1))); if (i === undefined) return; had.add(i); out.at[id] = 'm' + (i + 1); });
  return out;
};
const slotOf = (P, name) => name && (name[0] === 'M' ? P.major : name[0] === 'T' ? P.town || [] : name[0] === 'f' ? P.far || [] : P.minor)[+name.slice(1) - 1];

// How big the colony is drawn: the wire it wears in the Colony view (camp, town, full).
LF.mapStage = s => { const ring = LF.colonyShown ? LF.colonyShown(s).ring : 0; return clamp(ring - 1, 0, 2); };

LF.mapShown = function (s) {
  const P = plan(s); if (!P) return null;
  const w = s.world, A = LF.mapSlots(s), col = P.colony[A.site], st = LF.mapStage(s), k = P.view[2] / 360;
  // until a landing site is chosen there is no colony: the map is the orbital report's, all of it unwalked
  const down = !!w.zone, out = { site: down ? A.site : null, colony: down ? { x: col.x, y: col.y, size: col.sizes[st], stage: LF.WORLD_PLAN.stages[st] } : null, things: [], feats: [], parties: [], holes: [] };
  if (down) out.holes.push([col.x, col.y, Math.round(Math.min(150, 46 + (s.survey || 0) * 0.7 + (w.report ? 18 : 0)) * k)]);
  const put = (key, kind, cap, o) => { const name = A.at[key], sl = slotOf(P, name); if (!sl) { out.things.push({ key, kind, cap, slot: null }); return; }
    const paint = name[0] === 'M' ? sl.kinds.includes(kind) : sl.paint;
    out.things.push(Object.assign({ key, kind, cap, slot: name, x: sl.x, y: sl.y, size: sl.size, dim: false, press: false, painted: paint, patch: paint ? `${name}_${kind}` : null }, o));
    out.holes.push([sl.x, sl.y, Math.round(sl.size * 0.7 + 22)]); };
  for (const F of s.factors) {
    if (F.kind === 'land') { for (const id in F.seen || {}) { const fr = (LF.frames || []).find(x => x.id === id);
      put(id, 'lead', fr ? (typeof fr.title === 'function' ? 'A lead from the interior' : fr.title) : 'A lead'); } continue; }
    if (F.stage < 1 || F.kind === 'faction' || F.kind === 'plague' && !F.res || F.res === 'destroyed') continue;   // wiped out or broken: off the map (Lachlan, 2026-11-16)
    put(F.id, F.kind, `${F.Name} · ${F.res ? RES_WORD[F.res] : KIND_WORD[F.kind] || 'out there'}`, { dim: F.res === 'destroyed', press: !F.res && F.threat > 55 });
  }
  for (const [arc, used, key, kind, cap] of SIG) if (w.arcs.includes(arc) && s.used[used] !== undefined) put(key, kind, cap);
  // the colony's own settlements, each in the town slot it was founded on (js/settlements.js): a patch once raised, a pin while the frames go up
  for (const t of (LF.stlOnMap ? LF.stlOnMap(s) : [])) { const sl = slotOf(P, t.slot); if (!sl) continue;
    out.things.push({ key: t.key, kind: 'town', cap: t.cap, slot: t.slot, x: sl.x, y: sl.y, size: sl.size, dim: t.dim, press: false, painted: !t.raising, patch: t.raising ? null : `${t.slot}_town` });
    out.holes.push([sl.x, sl.y, Math.round(sl.size * 0.7 + 22)]); }
  // the colony's own places (js/places.js): rumoured, a dotted ring over the fog; located, a pin over it; visited, its
  // cairn where the slot is painted (a pin where not) with the fog lifted. Further off than the map holds: an arrow at the edge.
  out.arrows = [];
  if (down && LF.poiOwn) for (const p of LF.poiOwn(s)) { const sl = slotOf(P, p.slot);
    if (!sl) { const f = LF.poiFar(s, p); out.arrows.push({ key: p.key, cap: p.name, ang: f.ang, months: f.months, bearing: f.bearing }); continue; }
    const been = p.state !== 'rumoured' && p.state !== 'located', paint = p.slot[0] === 'f' || !!sl.paint;
    out.things.push({ key: p.key, kind: p.kind, place: true, state: p.state, cap: p.name, slot: p.slot, x: sl.x, y: sl.y, size: sl.size, dim: p.state === 'gone', press: false,
      painted: been && paint, patch: been && paint ? `${p.slot}_lead` : null });
    if (been) out.holes.push([sl.x, sl.y, Math.round(sl.size * 0.7 + 22)]); }
  for (const c of s.walked || []) out.holes.push(c.slice());   // walked ground: round each place a party came back from, and the way there
  const feats = (w.report && w.report.features) || [];
  for (const F of feats) { const p = P.feats[F.name]; if (p) out.feats.push({ name: F.name.replace(/^the /, ''), full: F.name, x: p[0], y: p[1], cap: `${F.name.charAt(0).toUpperCase() + F.name.slice(1)} · ${F.see}` }); }
  // parties away: to the thing they were sent to, the lead that sent them, a named feature, or off into the country
  for (const a of s.away) {
    const t = LF.partyGoal(s, a, P, A);
    const p = a.silent ? 1 : clamp((s.day - a.left) / Math.max(1, a.due - a.left), 0, 1), half = a.silent ? 1 : p < 0.5 ? p * 2 : (1 - p) * 2, P0 = LF.party(s, a);
    out.parties.push({ n: P0.n, x: t.x, y: t.y, px: r1(col.x + (t.x - col.x) * half), py: r1(col.y + (t.y - col.y) * half), silent: !!a.silent, back: !a.silent && p > 0.55,
      to: a.to, cap: `Party ${P0.n}: ${P0.who} · ${P0.state}` });
    out.holes.push([t.x, t.y, 46]);
  }
  // A named feature is on the map once the fog has lifted off it: orbit named it, but nobody has been there to mark it.
  out.feats = out.feats.filter(f => out.holes.some(h => Math.hypot(f.x - h[0], f.y - h[1]) < h[2] * 0.9));
  return out;
};
/* Where a party out past the wire is going, on this map: { key, x, y }. key names the place (js/places.js), or is null
   for a party bound nowhere in particular, which walks to one of the plan's wander points. */
LF.partyGoal = function (s, a, P, A) {
  P = P || plan(s); if (!P) return null; A = A || LF.mapSlots(s);
  const at = key => { const t = slotOf(P, A.at[key]); return t ? { key, x: t.x, y: t.y } : null; };
  if (a.poi) { const own = (s.pois || []).find(p => p.key === a.poi) || (s.poiAt || {})[a.poi], t = own && slotOf(P, own.slot);
    if (t) return { key: a.poi, x: t.x, y: t.y };
    const f = /^feat:/.test(a.poi) && P.feats[a.poi.slice(5)]; if (f) return { key: a.poi, x: f[0], y: f[1] };
    const r = at(a.poi); if (r) return r; }
  let g = (a.fid && at(a.fid)) || (TO[a.to] && at(TO[a.to]));
  const land = s.factors.find(F => F.kind === 'land');
  if (!g && land) { const id = Object.keys(land.seen || {}).find(i => land.seen[i] === a.left); if (id) g = at(id); }
  if (!g && P.feats[a.to]) g = { key: 'feat:' + a.to, x: P.feats[a.to][0], y: P.feats[a.to][1] };
  if (!g) { const W = P.wander || P.far, f = W[hash(a.to + ':' + a.left + ':' + s.seed) % W.length]; g = { key: null, x: f.x === undefined ? f[0] : f.x, y: f.y === undefined ? f[1] : f.y }; }
  return g;
};
/* One party out past the wire, in words: for the map's caption and the list under it. No DOM. */
LF.party = function (s, a) {
  const n = s.away.indexOf(a) + 1, L = a.lead && LF.h.byPid(s, a.lead), w = (a.with || []).map(id => LF.h.byPid(s, id)).filter(p => p && p.alive);
  const p = clamp((s.day - a.left) / Math.max(1, a.due - a.left), 0, 1), left = Math.max(0, a.due - s.day), mo = x => LF.monthsWord(Math.max(1, x / LF.MONTH));
  const state = a.silent ? `overdue${s.day > a.left ? `, ${mo(s.day - a.left)} out` : ''}, and no word` : p < 0.45 ? `heading out, ${mo(left)} until they're due back` : p <= 0.55 ? `at ${a.to} now` : `on the way back, due in ${mo(left)}`;
  const who = L ? `${a.n} led by ${L.name}` : `${a.n} people`;
  return { n, who, with: w.map(x => x.name), to: a.to, state, danger: a.danger || 0, silent: !!a.silent, lead: L || null };
};
// kept for anything that still asks where a thing is (js/pieces.js): the slot, in the old map's 360 by 300
LF.mapSpotPlan = function (s, key) { const P = plan(s), sl = P && slotOf(P, LF.mapSlots(s).at[key]); return sl ? [sl.x, sl.y] : null; };

/* ---------- the picture ---------- */
// A thing with no painted patch (not painted yet, or a kind nobody paints) is a pin: the old map's mark on a paper disc.
const PIN = {
  fauna: `<path class="k" d="M-6 2L-5 -2Q-3 -6 2 -5L6 -6L5 -2L4 2Z"/>`,
  flora: `<path class="rl" style="stroke-width:1.6" d="M0 3Q-1 -2 -5 -5M0 3Q0 -3 0 -7M0 3Q1 -2 5 -5"/>`,
  plague: `<circle class="r" r="3"/><circle class="rl" r="6" style="stroke-dasharray:2 2"/>`,
  ruin: `<path class="k" d="M-2.5 3L-1.5 -8H1.5L2.5 3Z"/><path class="rl" d="M-1.6 -2H1.6"/>`,
  natives: `<path class="k" d="M-7 3L-4 -3L-1 3ZM0 3L3 -5L6 3Z"/>`,
  humans: `<path class="k" d="M-6 3V-2L-4 -4L-2 -2L0 -4L2 -2L4 -4L6 -2V3Z"/>`,
  lead: `<path class="rl" style="stroke-width:1.8" d="M-3 -3L3 3M3 -3L-3 3"/>`,
  place: `<path class="kl" style="stroke-width:1.4" d="M-2 5V-6"/><path class="r" d="M-1.4 -6L5 -3.6L-1.4 -1.2Z"/>`,
  colony: `<circle class="r" r="4.5"/><circle class="kl" r="4.5"/>`,
  town: `<path class="k" d="M-6 3V-1L-3 -4L0 -1V3ZM1 3V-2L4 -5L7 -2V3Z"/>`,
};
const pin = (x, y, kind, sc) => `<g transform="translate(${x} ${y}) scale(${sc})"><circle class="p" r="10" opacity=".85"/><circle class="kl" r="10" style="stroke-width:.8"/>${PIN[kind] || PIN.lead}</g>`;

LF.worldView = function (s) {
  const P = plan(s), A = LF.WORLD_ART, art = s.world && A && A.worlds[s.world.type], v = P && art && LF.mapShown(s);
  if (!v) return LF.worldMap ? LF.worldMap(s) : '';
  const world = s.world.type, [vx, vy, vw, vh] = P.view, dir = 'art/pieces/world/' + world + '_', k = vw / 360;
  const img = (name, cls) => { const p = art.patches[name]; return p ? `<image${cls || ''} href="${dir}${name}.webp" x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}"/>` : ''; };
  const tap = (cap, body, extra) => `<g data-act="spot" data-v="${esc(cap)}"${extra || ''}>${body}</g>`;
  const hit = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r1(r)}" fill="#000" fill-opacity="0"/>`;
  // everything out there that is a place (js/places.js) opens it when tapped; the colony, features and parties keep their caption
  const tapP = (key, body, extra) => `<g data-act="poi" data-v="${esc(key)}"${extra || ''}>${body}</g>`;
  let things = '', over = '', hits = '';   // hits: what lies under the fog still takes a tap, drawn over it (a mask does not stop a tap)
  for (const t of v.things) { if (!t.slot) continue;
    if (t.place && (t.state === 'rumoured' || t.state === 'located')) {   // over the fog: a dotted ring for word of a place, a pin for one found
      over += tapP(t.key, (t.state === 'rumoured' ? `<circle class="rl" style="stroke-width:${r1(k * 1.3)};stroke-dasharray:${r1(k * 2)} ${r1(k * 2.6)}" cx="${t.x}" cy="${t.y}" r="${r1(Math.max(t.size * 0.5, k * 9))}" fill="none"/><text class="mt" x="${t.x}" y="${r1(t.y + k * 2.6)}">?</text>`
        : pin(t.x, t.y, 'place', r1(k * 0.85))) + hit(t.x, t.y, t.size / 2)); continue; }
    const body = (t.patch && img(t.patch)) || pin(t.x, t.y, t.place ? 'place' : t.kind, r1(k * (t.kind === 'lead' || t.place ? 0.8 : 1.15)));
    hits += tapP(t.key, hit(t.x, t.y, t.kind === 'town' ? t.size * 0.8 : t.size / 2));
    things += tapP(t.key, body + hit(t.x, t.y, t.kind === 'town' ? t.size * 0.8 : t.size / 2) + (t.press ? `<circle class="rl gl" style="stroke-width:${r1(k * 1.4)}" cx="${t.x}" cy="${t.y}" r="${r1(t.size * 0.72)}"/>` : ''), t.dim ? ' opacity=".4"' : ''); }
  // further off than the map holds: an arrow at the edge of the view, with the bearing and how many months away
  const seenDir = {};
  const arrows = !v.colony ? '' : (v.arrows || []).map(a => { const c = v.colony, m = k * 16, dx = Math.sin(a.ang), dy = -Math.cos(a.ang);
    const tx = dx > 0 ? (vx + vw - m - c.x) / dx : dx < 0 ? (vx + m - c.x) / dx : Infinity, ty = dy > 0 ? (vy + vh - m - c.y) / dy : dy < 0 ? (vy + m - c.y) / dy : Infinity, d = Math.min(tx, ty);
    const n = seenDir[a.bearing] = (seenDir[a.bearing] || 0) + 1, x = r1(c.x + dx * d), y = r1(c.y + dy * d + (n - 1) * k * 11), deg = Math.round(a.ang * 180 / Math.PI);
    const lx = r1(x - dx * k * 13), ly = r1(y - dy * k * 13 + k * 2.5), anchor = dx > 0.4 ? 'end' : dx < -0.4 ? 'start' : 'middle';
    return tapP(a.key, `<path class="r" transform="translate(${x} ${y}) rotate(${deg}) scale(${r1(k)})" d="M0 -6L5 3L0 1L-5 3Z"/><text class="mt" style="text-anchor:${anchor}" x="${lx}" y="${ly}">${esc(`${a.months} months ${a.bearing}`)}</text>${hit(x, y, k * 9)}`); }).join('');
  const out = LF.outlying ? LF.outlying(s) : 0;
  const c = v.colony, siteCap = `${s.world.planet}: the colony, ${LF.num(LF.heads(s))} people${out ? `, ${LF.num(out)} of them in the settlements` : ''}`, site = !c ? '' : tap(siteCap,
    (img(`colony_${v.site}_${c.stage}`) || pin(c.x, c.y, 'colony', r1(k * 1.3))) + hit(c.x, c.y, c.size / 2));
  const feats = v.feats.map(f => tap(f.cap, `<circle class="k" cx="${f.x}" cy="${f.y}" r="${r1(k * 1.6)}"/><text class="mt" x="${f.x}" y="${r1(f.y - k * 4)}">${esc(f.name)}</text>`)).join('');
  const lines = !c ? '' : v.parties.map(p => tap(p.cap, `<path class="pl" style="stroke-width:${r1(k * 3.2)};opacity:.7" d="M${c.x} ${c.y}L${p.x} ${p.y}"/><path class="rl" style="stroke-dasharray:${r1(k * 1.5)} ${r1(k * 4)};stroke-width:${r1(k * 1.8)}" d="M${c.x} ${c.y}L${p.x} ${p.y}"/><circle class="rl" style="stroke-width:${r1(k * 1.2)}" cx="${p.x}" cy="${p.y}" r="${r1(k * 6)}"/><path class="rl" style="stroke-width:${r1(k * 1.2)}" d="M${p.x} ${r1(p.y - k * 6)}V${r1(p.y - k * 15)}"/><path class="r" d="M${p.x} ${r1(p.y - k * 15)}l${r1(k * 7)} ${r1(k * 2.5)}l${r1(-k * 7)} ${r1(k * 2.5)}Z"/>`
    + `<circle class="${p.silent ? 'p' : 'r'}" cx="${p.px}" cy="${p.py}" r="${r1(k * 5.5)}"/><circle class="kl" style="stroke-width:${r1(k)}" cx="${p.px}" cy="${p.py}" r="${r1(k * 5.5)}"/><text class="pn" x="${p.px}" y="${r1(p.py + k * 2.6)}" style="font-size:${r1(k * 7.5)}px">${p.n}</text>`
    + (v.feats.some(f => f.name === p.to.replace(/^the /, '')) ? '' : `<text class="mt" x="${p.x}" y="${r1(p.y + k * 14)}">${esc(p.to.replace(/^the /, ''))}</text>`))).join('');   // a named place already has its label
  const box = `x="${vx}" y="${vy}" width="${vw}" height="${vh}"`;
  return `<svg class="scene painted country" viewBox="${vx} ${vy} ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The country around the colony">
<defs><filter id="wv-b" ${box} filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${r1(k * 5)}"/></filter>
<filter id="wv-fog" ${box} filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${r1(k * 22)}" edgeMode="duplicate"/></filter>
<pattern id="wv-h" width="${r1(k * 6)}" height="${r1(k * 6)}" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path class="kl" style="stroke-width:${r1(k * 0.7)};opacity:.35" d="M0 0V${r1(k * 6)}"/></pattern>
<mask id="wv-seen" maskUnits="userSpaceOnUse" ${box}><g filter="url(#wv-b)"><rect ${box} fill="#fff"/>${v.holes.map(h => `<circle cx="${h[0]}" cy="${h[1]}" r="${h[2]}" fill="#000"/>`).join('')}</g></mask></defs>
<image href="${art.plate}" width="${A.w}" height="${A.h}"/>${things}${site}<g mask="url(#wv-seen)" data-act="spot" data-v="Ground nobody has walked yet"><image href="${art.plate}" width="${A.w}" height="${A.h}" filter="url(#wv-fog)"/><rect class="p" ${box} opacity=".3"/></g>${hits}${c ? tap(siteCap, hit(c.x, c.y, c.size / 2)) : ''}${feats}${over}${lines}${arrows}</svg>`;
};
})();

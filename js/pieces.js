/* Landfall — the raster colony and world (NEXT.md item 2), assembled from generated pieces (tools/pieces.py).
   LF.colonyArt(s) and LF.worldArt(s) return HTML strings: a painted plate (the sky and horizon carry the scene-art
   look) with cut-out pieces layered over it, each anchored by its bottom centre where it meets the ground, sorted
   by depth and scaled by distance. Pure functions of s, no DOM, same rules as js/scene.js, which they will replace
   once the full catalog is painted. Positions are in percent of the plate, so the view scales with the phone.
   Only the test batch exists so far; LF.PIECES lists what is on disk and anything missing is simply left out. */
(function () {
'use strict';
const f = n => Math.round(n * 10) / 10;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const HAS = () => new Set(LF.PIECES || []);
// The ground band of a colony plate, in percent of its height: far edge (just under the horizon) to the near edge.
const FAR = 44, NEAR = 99;
// Width of each piece in percent of the plate when it stands at the near edge.
const SIZE = { lander: 24, reactor: 15, hydroponics: 20, pod: 12, house: 12, dome: 14, well: 9, smelter: 15, turbine: 10, field: 15, colonist: 3.6, flag: 5, scaffold: 14 };
function place(items, has, id, x, depth, cap, extra) {
  if (!has.has(id)) return;
  const y = FAR + (NEAR - FAR) * depth, k = 0.42 + 0.58 * depth, w = (SIZE[id] || 10) * k;
  items.push({ y, h: `<img class="pc" src="art/pieces/${id}.webp" alt="" style="left:${f(x - w / 2)}%;bottom:${f(100 - y)}%;width:${f(w)}%;z-index:${Math.round(y * 10)}"${cap ? ` data-act="spot" data-v="${esc(cap)}"` : ''}${extra || ''}>` });
}
LF.colonyArt = function (s) {
  if (!s.world) return '';
  const has = HAS(), plate = `plate_${s.world.type}`, items = [], r = rng((s.seed | 0) ^ 0x7a11);
  if (!has.has(plate)) return '';
  const m = id => `${LF.MACHINES[id].name} · ${LF.machineWord(s, id).toLowerCase()}`;
  place(items, has, 'lander', 50, 0.45, m('lander'));
  place(items, has, 'reactor', 34, 0.3, m('reactor'));
  place(items, has, 'hydroponics', 66, 0.35, m('hydroponics'));
  place(items, has, 'flag', 57, 0.5, 'The colony flag');
  const roofs = Math.ceil(LF.heads(s) / 9), houses = s.built.housing ? Math.min(8, roofs - 2) : 0, pods = s.built.housing ? 2 : Math.min(6, Math.max(3, roofs - 3));
  for (let i = 0; i < pods; i++) place(items, has, 'pod', 18 + i * 9 + (i % 2) * 3, 0.62 + (i % 2) * 0.14, 'Cargo pods · where people sleep');
  for (let i = 0; i < houses; i++) place(items, has, 'house', 14 + i * 10, 0.82 + (i % 2) * 0.1, 'Permanent housing');
  if (s.built.greenhouse) { place(items, has, 'dome', 80, 0.55, 'Greenhouse domes'); place(items, has, 'dome', 89, 0.7, 'Greenhouse domes'); }
  if (s.built.wells) place(items, has, 'well', 42, 0.75, 'Wells');
  if (s.built.smelter) place(items, has, 'smelter', 12, 0.35, 'Kiln and smelter');
  if (s.built.turbines) for (let i = 0; i < 3; i++) place(items, has, 'turbine', 74 + i * 8, 0.05 + i * 0.04, 'Turbine field');
  const plots = s.built.fields ? 4 : s.flags.first_sow ? 2 : 0;
  for (let i = 0; i < plots; i++) place(items, has, 'field', 64 + i * 11, 0.86 + (i % 2) * 0.08, 'The fields');
  if (s.project && !['spares', 'shuttle'].includes(s.project)) place(items, has, 'scaffold', 28, 0.9, `${LF.projName(s, s.project)} · going up`);
  const folk = Math.min(9, Math.round(LF.hands(s) / 12));
  for (let i = 0; i < folk; i++) place(items, has, 'colonist', 22 + r() * 60, 0.5 + r() * 0.45, '');
  items.sort((a, b) => a.y - b.y);
  return `<div class="art colony" role="img" aria-label="The settlement"><img class="plate" src="art/pieces/${plate}.webp" alt="">${items.map(i => i.h).join('')}</div>`;
};
LF.worldArt = function (s) {
  if (!s.world) return '';
  const has = HAS(), plate = `map_${s.world.type}`; if (!has.has(plate)) return '';
  const items = [], spot = LF.mapSpot || (() => [180, 150]), pc = ([x, y]) => [100 * x / 360, 100 * y / 300];
  const put = (id, at, w, cap) => { if (!has.has(id)) return; const [x, y] = pc(at);
    items.push(`<img class="pc" src="art/pieces/${id}.webp" alt="" style="left:${f(x - w / 2)}%;bottom:${f(100 - y)}%;width:${f(w)}%;z-index:${Math.round(y * 10)}" data-act="spot" data-v="${esc(cap)}">`); };
  put('m_camp', [180, 166], 13, `${s.world.planet}: the colony, ${s.pop} people`);
  for (const F of (s.world.report && s.world.report.features) || []) { const [x, y] = pc(spot(s, 'feat:' + F.name));
    items.push(`<span class="ml" style="left:${f(Math.min(88, Math.max(12, x)))}%;top:${f(y)}%">${esc(F.name.replace(/^the /, ''))}</span>`); }
  for (const F of s.factors) if (F.stage >= 1 && F.kind === 'ruin') put('m_ruin', spot(s, F.id), 9, F.Name);
  const known = Math.min(150, 46 + (s.survey || 0) * 0.7 + 18) / 3.6;   // the radius of walked ground, % of width
  return `<div class="art world" role="img" aria-label="The country round the colony"><img class="plate" src="art/pieces/${plate}.webp" alt="">${items.join('')}
    <i class="fog" style="--r:${f(known)}%"></i></div>`;
};
})();

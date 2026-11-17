/* Landfall — the Ariadne's schematic, for the Ship view (Lachlan, 2026-11-16: the ship card should show what is
   still on board and what is damaged). A side elevation drawn as a blueprint, fore to aft: the bridge, the crew deck
   with whoever is awake aboard, cryo banks B to D with a cell per pod (lit, amber or dark), the hold with a cradle per
   system (its condition, or empty once it is down), the lander dock, and the drive with the empty reactor bay. Damage
   comes from what has happened (a tumble, a jettisoned bank, failing pods, a dry tank) and from anything a thread
   says about the ship (LF.shipMarks: a section can be dark, sealed, unknown or overgrown). A pure function of s that
   returns an SVG string; colours are the theme's variables, so it recolours with the rest. No DOM. */
(function () {
'use strict';
const BANKS = ['B', 'C', 'D'], SYS = ['hydroponics', 'reclaimer', 'medbay', 'fabricator'];
const SHORT = { hydroponics: 'HYDRO', reclaimer: 'RECLAIM', medbay: 'AUTODOC', fabricator: 'FAB' };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const col = v => `style="fill:var(--${v})"`, str = (v, w) => `style="stroke:var(--${v});stroke-width:${w || 1};fill:none"`;

/* What threads and events have done to each section: { bridge, crew, banks, hold, dock, drive } -> mark. Threads add
   their own through LF.SHIP_MARKS (functions of s returning { section: 'dark'|'sealed'|'unknown'|'growth'|'breach' }). */
LF.SHIP_MARKS = LF.SHIP_MARKS || [];
LF.shipMarks = function (s) {
  const m = {}, f = s.flags || {}, mo = s.memo && s.memo['ship.orbit'];
  if (mo && mo.i === 1 && mo.ok === false) { m.banks = 'breach'; m.hold = 'breach'; }
  for (const fn of LF.SHIP_MARKS) { try { Object.assign(m, fn(s) || {}); } catch (e) {} }
  return m;
};
/* One line under the schematic, the worst thing about the ship right now, or nothing. */
LF.shipDamage = function (s) {
  const m = LF.shipMarks(s), f = s.flags || {}, out = [];
  if (m.bridge === 'dark' || m.crew === 'dark') out.push('No answer from the bridge');
  if (m.hold === 'growth') out.push('Something growing in the hold');
  if (Object.values(m).includes('sealed')) out.push('Sections sealed');
  if (m.banks === 'breach') out.push('Hull scarred where she tumbled');
  if (f.lim_jettisoned) out.push('Bank D let go');
  if (f.lim_amber_cut || (s.memo && s.memo['ship.pods'])) out.push('Bank B patched');
  const worn = LF.aboard(s).filter(id => s.machines[id].hp < 30); if (worn.length) out.push(`${worn.length === 1 ? LF.MACHINES[worn[0]].name : worn.length + ' systems'} failing in the cradles`);
  return out;
};
LF.shipPlan = function (s) {
  const W = 360, H = 150, y0 = 44, hh = 62, mk = LF.shipMarks(s), f = s.flags || {}, up = LF.inOrbit(s), L = s.machines.lander;
  const parts = [];
  const sec = (x, w, label, key) => { const m = mk[key];
    parts.push(`<rect x="${x}" y="${y0}" width="${w}" height="${hh}" rx="4" ${str(m === 'breach' ? 'bad' : 'dim', m === 'breach' ? 1.4 : 0.8)}${m === 'breach' ? ' stroke-dasharray="4 2"' : ''}/>`);
    parts.push(`<text x="${x + w / 2}" y="${y0 - 6}" text-anchor="middle" font-size="7.5" letter-spacing=".08em" ${col('dim')}>${label}</text>`);
    if (m === 'dark' || m === 'unknown' || m === 'sealed') parts.push(`<rect x="${x + 1}" y="${y0 + 1}" width="${w - 2}" height="${hh - 2}" rx="3" style="fill:var(--bg);opacity:.78"/><text x="${x + w / 2}" y="${y0 + hh / 2 + 3}" text-anchor="middle" font-size="7" letter-spacing=".1em" ${col(m === 'sealed' ? 'rust' : 'bad')}>${m === 'dark' ? (w < 44 ? 'DARK' : 'NO SIGNAL') : m === 'sealed' ? (w < 44 ? 'SEAL' : 'SEALED') : '?'}</text>`);
    if (m === 'growth') parts.push(`<path d="M${x + 4} ${y0 + hh - 3} q ${w / 4} -${hh / 2} ${w / 2} -6 t ${w / 2 - 8} -${hh / 3}" ${str('bad', 1.2)}/><path d="M${x + 8} ${y0 + 4} q ${w / 3} ${hh / 3} ${w - 16} ${hh / 4}" ${str('bad', 0.9)}/>`); };
  // the hull: a long spine with a blunt bow to the left
  parts.push(`<path d="M18 ${y0 + hh / 2} L34 ${y0 - 4} L${W - 40} ${y0 - 4} L${W - 18} ${y0 + 6} L${W - 18} ${y0 + hh - 6} L${W - 40} ${y0 + hh + 4} L34 ${y0 + hh + 4} Z" ${str('line', 1.2)}/>`);
  // bridge
  sec(36, 34, 'BRIDGE', 'bridge');
  if (mk.bridge !== 'dark' && mk.bridge !== 'unknown') parts.push(`<circle cx="53" cy="${y0 + hh / 2}" r="4" ${col(up.length ? 'good' : 'dim')}/>`);
  // crew deck: one dot per officer awake aboard, initials under it
  sec(74, 38, 'CREW', 'crew');
  if (mk.crew !== 'dark' && mk.crew !== 'unknown') up.slice(0, 3).forEach((p, i) => { const cx = 84 + i * 9;
    parts.push(`<circle cx="${cx}" cy="${y0 + 22}" r="3.2" ${col(p.stranded ? 'bad' : 'ink')}/><text x="${cx}" y="${y0 + 36}" text-anchor="middle" font-size="6" ${col('dim')}>${esc(p.first[0] + p.last[0])}</text>`); });
  // the banks: a cell per pod, filled in order B, C, D
  const cap = Math.max(150, s.sleepers + (s.flags.woken || 0) * 20), per = Math.ceil(cap / 3), lit = s.sleepers;
  let left = lit;
  BANKS.forEach((b, j) => { const x = 116 + j * 46, gone = b === 'D' && f.lim_jettisoned;
    if (gone) { parts.push(`<rect x="${x}" y="${y0}" width="42" height="${hh}" rx="4" ${str('bad', 0.8)} stroke-dasharray="2 3"/><text x="${x + 21}" y="${y0 - 6}" text-anchor="middle" font-size="7.5" ${col('bad')}>BANK D</text><text x="${x + 21}" y="${y0 + hh / 2 + 3}" text-anchor="middle" font-size="6.5" ${col('bad')}>GONE</text>`); return; }
    sec(x, 42, 'BANK ' + b, 'banks');
    if (mk.banks === 'dark' || mk.banks === 'unknown' || mk.banks === 'sealed') return;
    const n = Math.min(per, left); left -= n; const cells = 48, on = Math.round(cells * n / per), amber = b === 'B' && s.memo && !s.memo['ship.pods'] && s.day >= 240 && s.sleepers >= 30 ? 4 : 0;
    for (let k = 0; k < cells; k++) { const cx = x + 4 + (k % 6) * 6.2, cy = y0 + 5 + Math.floor(k / 6) * 7;
      parts.push(`<rect x="${cx.toFixed(1)}" y="${cy}" width="4.4" height="5" rx="1" ${col(k < on ? (k >= on - amber ? 'rust' : 'good') : 'line')}/>`); } });
  // the hold: a cradle per system, filled while it is still aboard
  sec(256, 52, 'HOLD', 'hold');
  if (mk.hold !== 'dark' && mk.hold !== 'unknown' && mk.hold !== 'sealed') SYS.forEach((id, i) => { const m = s.machines[id], x = 260 + (i % 2) * 23, y = y0 + 6 + Math.floor(i / 2) * 28, here = m && m.up && !m.lost;
    parts.push(`<rect x="${x}" y="${y}" width="21" height="24" rx="2" ${here ? col(m.hp < 30 ? 'bad' : m.hp < 55 ? 'rust' : 'raise') : str('line', 0.8)}/>`);
    parts.push(`<text x="${x + 10.5}" y="${y + 15}" text-anchor="middle" font-size="4.6" ${col(here ? 'ink' : 'dim')}>${here ? SHORT[id] : m && m.lost ? 'LOST' : 'DOWN'}</text>`); });
  // dock and drive
  sec(312, 28, 'DOCK', 'dock');
  parts.push(L.lost ? `<text x="326" y="${y0 + hh / 2 + 3}" text-anchor="middle" font-size="6" ${col('bad')}>NONE</text>`
    : `<path d="M318 ${y0 + 40} l8 -20 l8 20 z" ${s.flags.qs_lander_up ? col('ink') : str('dim', 0.8)}/><text x="326" y="${y0 + 54}" text-anchor="middle" font-size="5.5" ${col('dim')}>${s.flags.qs_lander_up ? 'DOCKED' : 'BELOW'}</text>`);
  parts.push(`<path d="M${W - 18} ${y0 + 14} l12 -6 l0 ${hh - 16} l-12 -6" ${str('dim', 0.8)}/>`);
  // fuel and orbit along the bottom
  const fuel = L.lost ? 'no lander' : s.flags.lander_grounded ? 'lander grounded' : `fuel ${s.fuel || 0} flight${s.fuel === 1 ? '' : 's'}${!s.fuel && s.flags.digester ? ' (digester)' : ''}`;
  const orb = s.memo && s.memo['ship.orbit'] ? (s.memo['ship.orbit'].ok === false ? 'orbit held, hull scarred' : 'orbit held') : s.day >= 130 ? 'orbit decaying' : 'orbit stable';
  parts.push(`<text x="36" y="${H - 14}" font-size="7.5" ${col('dim')}>${s.sleepers} ASLEEP · ${esc(fuel.toUpperCase())} · ${esc(orb.toUpperCase())}</text>`);
  parts.push(`<text x="36" y="22" font-size="9" letter-spacing=".14em" ${col('ink')}>${esc(String(s.world.ship || 'ARIADNE').toUpperCase())}</text>`);
  return `<svg class="shipplan" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic of the ship" font-family="var(--sans, inherit)">${parts.join('')}</svg>`;
};
})();

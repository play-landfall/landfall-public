/* Landfall — engine: state, simulation tick, storylet runner, director.
   No DOM in this file: it runs unchanged in the browser and in tools/sim.js. */
(function (G) {
'use strict';
const LF = G.LF = { storylets: [], byId: {}, reports: [], VERSION: 15 };
// A tick is a third of a day or so of fiction; what the player sees is months. One decision a month (LF.MONTH ticks),
// three months a season, twelve a year, then the year's recap (council.js).
const YEAR = LF.YEAR = 120, SEASON = LF.SEASON = 30, MONTH = LF.MONTH = 10;
LF.SEASONS = ['Thaw', 'Brightening', 'Seedfall', 'Dim'];
const SEASON_YIELD = [0.9, 1.25, 1.0, 0.45];
const EASE = 0.18;   // each cord the colony has cut takes this share off the attrition: a colony that can live without the ship loses a tenth of what a new one does
const ATTRITION = 0.0003;   // deaths per person per tick from the place itself, before EASE. 0.0011 before the six officers and the dreads; 0.0001 from 2026-11-15 to 2026-11-17, while the wheat card was dealt in three games in ten and the other seven could not be won; 0.0003 since that card comes of its own accord (content-core.js). Past about 0.0005 the towns of the long game die out by year twenty

LF.MACHINES = {
  reactor:     { name: 'Fusion Reactor',   wear: 0.11, role: 'Power for everything else.' },
  fabricator:  { name: 'Fabricator',       wear: 0.15, role: 'Prints spare parts, but not its own.' },
  reclaimer:   { name: 'Water Reclaimer',  wear: 0.17, role: 'Clean water and air.' },
  hydroponics: { name: 'Hydroponics Bay',  wear: 0.15, role: 'Feeds about 24 people, whatever the weather.' },
  medbay:      { name: 'Autodoc',          wear: 0.12, role: 'Surgery and diagnosis.' },
  lander:      { name: 'Lander',           wear: 0.05, role: 'The only way back up to the sleepers.' },
};
/* Where the ship's systems are (Lachlan, 2026-11-15). The first flight brings the reactor and one more; the rest stay
   aboard the ship (m.up) until a shuttle run brings them down, one a flight (ship.cargo, content-ship.js). A system
   aboard does nothing for the ground and wears slowly in the cold. LF.down: on the ground and working. */
LF.down = (s, id) => { const m = s.machines[id]; return !!m && !m.lost && !m.up; };
/* "Needs the Autodoc" on a locked option, while the autodoc is still in orbit: say where it is. */
const NEEDS = { Autodoc: 'medbay', Fabricator: 'fabricator', Reclaimer: 'reclaimer', 'Hydroponics Bay': 'hydroponics' };
LF.upLock = (s, t) => { const m = /^Needs the (Autodoc|Fabricator|Reclaimer|Hydroponics Bay)\b/.exec(t || ''), mc = m && s.machines && s.machines[NEEDS[m[1]]];
  return mc && mc.up && !mc.lost ? `The ${m[1] === 'Hydroponics Bay' ? 'hydroponics bay' : m[1].toLowerCase()} is still aboard the ship` : t; };
/* How many the next run would wake, in words: "twenty sleepers", "seven sleepers", "one sleeper". */
LF.wakeWord = s => { const n = Math.min(20, s.sleepers || 0), W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']; return `${W[n]} sleeper${n === 1 ? '' : 's'}`; };
LF.aboard = s => Object.keys(s.machines).filter(id => id !== 'lander' && !s.machines[id].lost && s.machines[id].up);
/* The lander's tanks: s.fuel is how many flights are left in them (LF.TANK, js/orders.js). Fuel comes only from a refuel
   in the digester (order.refuel, FUEL_FOOD a flight, less once the colony renders its dead: content-ship.js, ship.dry). */
const FUEL_FOOD = LF.FUEL_FOOD = 260;
LF.flightFood = s => s.flags.render_dead ? Math.round(FUEL_FOOD / 2) : FUEL_FOOD;
LF.canFly = (s, n) => (s.fuel || 0) >= (n || 1);
LF.flyWhy = (s, n) => (s.fuel || 0) >= (n || 1) ? '' : s.refuel ? 'The digester is still filling the tanks' : (s.flags.digester || s.built.digester) ? 'The tanks are dry: refuel from the Ship view' : 'The tanks are dry';
LF.fly = function (s, n, chips) { for (let i = 0; i < (n || 1); i++) {
  if ((s.fuel || 0) > 0) { s.fuel--; if (chips) chips.push({ t: s.fuel ? `Fuel: ${s.fuel} flight${s.fuel === 1 ? '' : 's'} left` : 'The tanks are dry', good: false }); } }
  s.flown = (s.flown || 0) + (n || 1); };
LF.ROLES = {
  engineer:      { title: 'Chief Engineer', crew: 'the engineering crew' },
  physician:     { title: 'Physician',      crew: 'the medical team' },
  botanist:      { title: 'Agronomist',     crew: 'the field crew' },
  xenobio:       { title: 'Xenobiologist',  crew: 'the survey team' },
  pilot:         { title: 'Pilot',          crew: 'the flight crew' },
  security:      { title: 'Warden',         crew: 'the watch' },
  geologist:     { title: 'Geologist',      crew: 'the survey team' },
  teacher:       { title: 'Archivist',      crew: 'the archive committee' },
  quartermaster: { title: 'Quartermaster',  crew: 'the stores office' },
  chaplain:      { title: 'Counsellor',     crew: 'the counselling circle' },
};
LF.JOBS = {
  farm:     { name: 'Farming',     desc: 'Field and greenhouse food.' },
  maintain: { name: 'Maintenance', desc: 'Repairs ship machinery. Uses spare parts.' },
  build:    { name: 'Construction',desc: 'Progress on the active project.' },
  extract:  { name: 'Salvage & Mining', desc: 'Materials.' },
};
LF.PILLARS = {
  food:     { name: 'Food',     how: 'Open Fields',          replaces: 'Hydroponics Bay' },
  water:    { name: 'Water',    how: 'Wells & Sand Filters', replaces: 'Water Reclaimer' },
  energy:   { name: 'Energy',   how: 'Turbine Field',        replaces: 'Fusion Reactor' },
  industry: { name: 'Industry', how: 'Machine Shop',         replaces: 'Fabricator' },
  people:   { name: 'People',   how: 'School & Clinic, 100+ colonists', replaces: 'Autodoc and the sleepers' },
};
const SHELTER = { flare: 'Shielded Vaults', winter: 'Deep Cellars', storm: 'Storm Walls' };
LF.PROJECTS = {
  greenhouse: { name: 'Greenhouse Domes', mat: 40, labor: 70, desc: 'Shelters Earth crops from the local soil, so they yield more.' },
  soillab:    { name: 'Soil Laboratory', mat: 30, labor: 60, desc: 'Lets the agronomists work out why Earth crops sicken here.' },
  housing:    { name: 'Permanent Housing', mat: 70, labor: 110, desc: s => LF.harsh(s) ? 'Out of the cargo pods, which were never built for this climate. People will be much steadier for it.' : 'Out of the cargo pods, and people are steadier for it.' },
  wells:      { name: 'Wells & Sand Filters', mat: 60, labor: 120, pillar: 'water', desc: s => 'Water that does not depend on the reclaimer.' + (s.world.truth.water < 20 ? ' On a world this dry, it will be a long dig.' : s.world.truth.water > 60 ? ' Easy digging here.' : ''),
                req: s => !!s.flags.water_found, reqText: s => LF.findWhy ? LF.findWhy(s, 'water') : 'Needs water found' },
  fields:     { name: 'Open Fields', mat: 50, labor: 160, pillar: 'food', desc: 'Adapted crops under the open sky.',
                req: s => !!s.flags.crops_adapted, reqText: 'Needs crops adapted to local soil' },
  smelter:    { name: 'Kiln & Smelter', mat: 60, labor: 140, desc: 'Local metal, more than doubling material output.',
                req: s => !!s.flags.ore_found, reqText: s => LF.findWhy ? LF.findWhy(s, 'ore') : 'Needs a surveyed ore body' },
  machineshop:{ name: 'Machine Shop', mat: 120, labor: 220, pillar: 'industry', desc: 'Lathes, mills, forges. Parts without the fabricator, better odds on repairs, and fewer spares spent on each.',
                req: s => !!s.built.smelter, reqText: 'Needs the smelter' },
  turbines:   { name: 'Turbine Field', mat: 110, labor: 200, pillar: 'energy', desc: 'Power that can be repaired with a hammer.',
                req: s => !!s.built.smelter && !!s.flags.wind_found, reqText: s => !s.built.smelter ? 'Needs the smelter' : LF.findWhy ? LF.findWhy(s, 'wind') : 'Needs a windy site' },
  school:     { name: 'School & Clinic', mat: 50, labor: 130, pillar: 'people', desc: 'Teaching and a clinic, so children learn what the founders know.' },
  shelter:    { name: s => SHELTER[s.world.climate], mat: 80, labor: 150, desc: 'Protection from what this world does every year.',
                req: s => !!s.flags.climate_known, reqText: 'You do not yet know what to build against' },
  // Buildings that matter (WO-3, DESIGN.md "Buildings"): each helps a kind of work in the odds (LF.buildMods) and
  // has its own place in the rules, read through LF.has.
  lab:        { extra: true, name: 'Laboratory', mat: 60, labor: 110, desc: 'Benches, a fume hood, an incubator and a cold room. Better odds on research, more learned from every study, and assays without the autodoc.',
                req: s => !!s.built.soillab, reqText: 'Needs the soil laboratory to grow from' },
  comms:      { extra: true, name: 'Signals Room', mat: 35, labor: 70, desc: 'A mast, a dish and a room under it. Officers still in orbit run their departments better by radio, and parties out go silent less often.',
                req: s => LF.power(s) > 0.3, reqText: 'Needs power to run the mast' },
  cannery:    { extra: true, name: 'Cannery & Cold Store', mat: 45, labor: 90, desc: 'Boilers, jars and a cold room dug into the bank. A seventh more of every harvest kept, and short rations bite less.',
                req: s => !!(s.flags.harvests || s.built.greenhouse), reqText: 'Needs a harvest in, or the greenhouse' },
  watch:      { extra: true, name: 'Watchtowers & Wall Walk', mat: 70, labor: 120, desc: 'Towers at the corners and a walk along the wire. Better odds fighting, slower threat from what lives out there, a lighter night toll.',
                req: s => LF.wireThreat(s) > 0, reqText: 'Nothing out there to watch for yet' },
  hall:       { extra: true, name: 'Meeting Hall', mat: 60, labor: 120, desc: 'A long room with benches and a raised end. A floor under morale, a later low ebb, and better odds talking.',
                req: s => !!s.built.housing, reqText: 'Needs permanent housing first' },
  spares:     { name: 'Fabricate Spares', mat: 25, labor: 30, repeat: true, desc: 'A batch of spare parts.',
                req: s => !!s.built.machineshop || (LF.down(s, 'fabricator') && LF.power(s) > 0.3),
                reqText: s => s.machines.fabricator.up ? 'The fabricator is still aboard the ship' : 'Needs a working fabricator or the machine shop',
                done: s => { s.res.parts += 6; } },
  // The digester (T2-1): biomass into lander fuel. Fuel then comes from a refuel order (js/orders.js), never on the spot.
  digester:   { name: 'Digester', mat: 40, labor: 40, desc: s => `Two tanks and a still behind the lander pad. Food goes in, lander fuel comes out: about ${LF.flightFood(s)} a flight.`,
                req: s => !!s.machines.lander && !s.machines.lander.lost && !s.flags.digester, reqText: s => s.flags.digester ? 'Built' : 'There is no lander to fuel',
                done: s => { s.flags.digester = s.flags.digester || s.day; } },
};

/* ---------- utilities ---------- */
const clamp = LF.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
LF.rand = s => { s.rng = (s.rng + 0x6D2B79F5) | 0; let t = s.rng; t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
LF.ri = (s, a, b) => a + Math.floor(LF.rand(s) * (b - a + 1));
LF.pick = (s, arr) => arr[Math.floor(LF.rand(s) * arr.length)];
LF.date = d => ({ year: Math.floor(d / YEAR) + 1, season: Math.floor((d % YEAR) / SEASON), dos: (d % SEASON) + 1, month: Math.floor((d % YEAR) / MONTH) + 1 });
LF.dateStr = d => { const x = LF.date(d); return `Year ${x.year}, month ${x.month}`; };
/* Whether this harvest gets a card: the first only. Every later one goes in with a Meanwhile line. */
LF.harvestCard = function (s, n) {
  return (s.flags.harvests || 0) < 1;   // the first, and never again (Lachlan, 2026-11-16: two; 2026-11-17: "repeated harvest decisions", so one)
};
LF.monthsWord = n => { const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']; n = Math.max(1, Math.round(n)); return n === 1 ? 'a month' : `${W[n] || n} months`; };
// The harvest: field crops stand until the end of each season and are brought in then. Hydroponics feeds every day.
LF.toHarvest = s => Math.max(1, Math.ceil((SEASON - (s.day % SEASON)) / MONTH));
LF.log = (s, t, k) => { if (LF.unmark) t = LF.unmark(s, t); s.log.push({ d: s.day, t, k: k || '' }); if (s.log.length > 250) s.log.shift(); };
LF.chron = (s, t) => { if (LF.unmark) t = LF.unmark(s, t); s.chron.push({ d: s.day, t }); };
LF.storyPoint = s => { if (s.recap) s.recap.major = true; };   // something the next recap should not wait for

/* ---------- people ---------- */
const GIVEN = ['Imani','Ottilie','Oksana','Rafael','Mei','Jonah','Wiremu','Soren','Leila','Kofi','Yuki','Mateo','Ingrid','Dev','Noor','Callum','Zofia','Hemi','Anneke','Tomas','Sefa','Priya','Elias','Ruth','Teodor','Wren','Ilse','Marcus',
  'Ayesha','Bao','Chidi','Dalia','Emeka','Farah','Goran','Hana','Ifeoma','Jae','Kalani','Lucia','Malik','Nadia','Oren','Paloma','Quinn','Rania','Sami','Tariq','Uma','Viktor','Wanjiru','Xochitl','Yara','Zeynep',
  'Aiko','Bram','Carmen','Diego','Esi','Fintan','Gaia','Hamid','Ines','Jun','Kaveh','Lerato','Mirela','Niamh','Obi','Pita','Rosa','Saoirse','Thandi','Ulla','Vasco','Wei','Yusuf','Zainab',
  'Anaru','Birgit','Cyrus','Dagny','Eitan','Femi','Greta','Hiro','Isadora','Jalen','Kenji','Lowanna','Mosi','Nilufar','Odette','Pavel','Rangi','Sunita','Tobias','Veda'];
const FAMILY = ['Okafor','Lindqvist','Reyes','Tanaka','Mbeki','Haldane','Castellanos','Petrov','Kerrigan','Aguilar','Brandt','Sato','Iyer','Szabo','Ferreira','Whitlock','Adeyemi','Varga','Moana','Osei','Rahimi','Doyle','Zheng','Halloran','Eze','Marchetti','Thorsen','Bell',
  'Abebe','Bergstrom','Chaudhry','Dlamini','Esposito','Farouk','Gallagher','Hakimi','Ivanova','Jovanovic','Kamau','Laurent','Mendoza','Ngata','Oyelaran','Park','Quispe','Rosen','Sandoval','Tran','Uchenna','Vasquez','Wojcik',
  'Yilmaz','Zuniga','Achterberg','Banerjee','Cohen','Duarte','Ekwueme','Fujita','Grenier','Hosseini','Ishikawa','Jaramillo','Kahananui','Lindgren','Mwangi','Nordin','Obuya','Pereira','Rautenbach','Sorensen','Tuilagi',
  'Ulloa','Valdivia','Waititi','Xiong','Yamada','Zielinski','Arslan','Boateng','Chen','Brekke','Quiroga','Fonoti','Gunawardena','Haddad','Ito','Kowalczyk','Mahlangu','Novak','Oduya','Rasmussen'];
const TRAITS = ['cautious','reckless','devout','bitter','beloved','brilliant','stubborn','gentle'];
/* A named colonist is one of the roster's forty (Lachlan, 2026-11-19; js/roster.js, DESIGN.md "Who is speaking"), never the same one
   twice in a game: p.rk is the roster key, and the portrait. band: 'child', or 'born' for someone born in the colony; otherwise a grown
   colonist, of working age (prime) two times in three. Those who stand in for a department and the outsiders are never drawn. Only when
   every fitting one is taken does the old name list give a stranger with no portrait. */
const ADULT = ['prime', 'young', 'older-prime', 'older'];
function makePerson(s, role, green, band) {
  const R = LF.ROSTER || {}, used = new Set(s.people.map(p => p.rk).filter(Boolean));
  const fit = b => Object.values(R).filter(r => r.kind === 'colonist' && !r.stands && !used.has(r.key) && b.includes(r.band));
  let pool = band ? fit([band]) : fit(['prime']);
  // Born-here people only once the colony is old enough to have raised them (roster of sixty, 2026-11-20): roster ages do not move.
  if (band === 'born') { const y = LF.date(s.day || 1).year, ok = pool.filter(r => r.age === null || r.age === undefined || r.age <= y); if (ok.length) pool = ok; } if (!band && (!pool.length || LF.rand(s) < 0.34)) pool = fit(ADULT).length ? fit(ADULT) : pool;
  let first, last, rk = null, tries = 0;
  if (pool.length) { const r = LF.pick(s, pool); first = r.first; last = r.last; rk = r.key; }
  else do { first = LF.pick(s, GIVEN); last = LF.pick(s, FAMILY); }
  while (!rk && s.people.some(p => (p.first === first && p.last === last) || (tries < 25 && (p.first === first || p.last === last))) && ++tries < 60);
  const p = { id: 'p' + s.people.length, first, last, name: (first + ' ' + last).trim(), role, trait: LF.pick(s, TRAITS), alive: true, green: !!green, marks: {}, perks: [], deeds: [] };
  if (rk) p.rk = rk;
  s.people.push(p); return p;
}
LF.makePerson = makePerson;
/* Key settlers: an officer is only "known" to the player once they have been named in something that happened. */
LF.notice = function (s, text) { if (!text) return; for (const p of s.people) if (!p.known && (text.includes(p.name) || (p.first.length > 3 && new RegExp('\\b' + p.first + '\\b').test(text)))) p.known = s.day || 1; };
LF.keySettlers = s => s.people.filter(p => p.alive && (p.known || !p.role)); // role null: a colonist the colony has started to know by name (people.js)
// The seat's officer, if they are here to ask: an officer leading a party, or still in orbit, is not. The old ten role
// keys reach the six seats through LF.SEAT_OF (officers.js).
const P = (s, role) => { const seat = LF.SEAT_OF[role] || role; return s.people.find(p => p.seat === seat && p.role && p.alive && !p.away) || null; };
const byPid = (s, id) => s.people.find(p => p.id === id);
// With nobody at the post, the narration names the colonist who stands in for the department, the same one the speech
// bubble shows (Lachlan, 2026-11-19; LF.standIn in js/speak.js, DESIGN.md "Who is speaking"); the department's word only without one.
const N = (s, role) => { const p = P(s, role); if (p) return p.name; const r = LF.standIn && LF.standIn(s, role); return r ? r.name : LF.seatWord(s, role); };
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
LF.h = {
  P, N, byPid,
  Nc: (s, role) => cap1(N(s, role)),
  // N for a first mention: a stand-in comes with the department they stand in for ("Marco Bellini of the engineering crew"),
  // so a name the player has never met means something. An officer in the seat is just their name.
  Nw: (s, role) => { if (P(s, role)) return N(s, role); const r = LF.standIn && LF.standIn(s, role); return r ? `${r.name} of ${LF.seatWord(s, role)}` : LF.seatWord(s, role); },
  Nwc: (s, role) => cap1(LF.h.Nw(s, role)),
  F: (s, role) => { const p = P(s, role); if (p) return p.first; const r = LF.standIn && LF.standIn(s, role); return r ? r.first : LF.seatWord(s, role); },
  title: role => LF.ROLES[role].title,
  anyNamed: (s, exclude) => { const ex = (exclude || []).map(k => LF.SEAT_OF[k] || k), a = s.people.filter(p => p.alive && !p.away && !(p.seat && p.role && ex.includes(p.seat)) && !ex.includes(p.id));
    if (a.length) return LF.pick(s, a);
    // With six officers there is not always a name to hand: a story that needs one takes somebody out of the crowd.
    if (s.pop < 12 || !s.world) return null; const n = makePerson(s, null); n.known = s.day || 1; return n; },
  R: (role, v) => ({ k: 'role', role, v }),
  M: (id, v) => ({ k: 'machine', id, v }),
  Fl: (flag, v, label) => ({ k: 'flag', flag, v, label }),
  If: (fn, v, label) => ({ k: 'if', fn, v, label }),
  Tr: (role, trait, v) => ({ k: 'trait', role, trait, v }),
  foodDays: s => s.res.food / Math.max(1, LF.foodCons(s)),
  did: (s, id) => s.memo[id] || null,
};
LF.an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;   /* 'an open colony' */
LF.killPerson = function (s, who, cause) {
  const p = typeof who === 'string' ? (who[0] === 'p' && byPid(s, who)) || P(s, who) : who;
  if (!p || !p.alive) return null;
  p.alive = false; p.died = s.day; p.cause = cause || 'lost';
  if (p.src && LF.lateDeath) LF.lateDeath(s, p);
  if (p.away && !p.orbit) { p.away = false; for (const a of s.away) { if (a.lead === p.id) a.lead = null; if (a.with) a.with = a.with.filter(id => id !== p.id); } }   // dead while out with a party
  s.pop = Math.max(0, s.pop - 1); s.deaths++; s.grief = Math.min(40, s.grief + 5); s.tension += 8;
  s.morale = clamp(s.morale - (p.trait === 'beloved' ? 8 : 3), 0, 100);
  if (!s.firstDead) s.firstDead = p.name;
  LF.chron(s, `${p.name}, ${LF.title(p)}, died: ${p.cause}.`);
  LF.log(s, `${p.name} is dead.`, 'bad');
  if (p.seat && p.role) s.vacancies.push({ role: p.role, seat: p.seat, day: s.day + LF.ri(s, 8, 20) });
  else if (p.deeds.length >= 2) s.morale = clamp(s.morale - 3, 0, 100); // a name people knew
  const any = LF.h.anyNamed(s), kin = (LF.mourner && LF.mourner(s, p)) || any; // every named death leaves someone who remembers how it happened: someone tied to them, if anyone was
  if (LF.shift && LF.close) for (const o of LF.close(s, p)) LF.shift(s, o, 'mind', -8);
  if (kin && !kin.marks.bereaved) kin.marks.bereaved = { d: s.day, txt: `buried ${p.first} ${p.last}` };
  if (kin && kin.loyal !== undefined && /went wrong|with the party/.test(p.cause)) kin.loyal = clamp(kin.loyal - 10, 0, 100);   // it was your order
  return p;
};
/* Someone with a name leaves the colony alive: walks out, is exiled, goes with a party that is not coming back (2026-11-16,
   after a playtester's officer walked out and every later card called her dead). No grave and no grief: p.left is the
   day, p.died stays unset, and whatever speaks of the dead asks LF.isDead. On a card: fx.depart: [{ who, cause }]. */
LF.depart = function (s, who, cause) {
  const p = typeof who === 'string' ? (who[0] === 'p' && byPid(s, who)) || P(s, who) : who;
  if (!p || !p.alive) return null;
  p.alive = false; p.left = s.day; p.cause = cause || 'left the colony';
  if (p.away && !p.orbit) { p.away = false; for (const a of s.away) { if (a.lead === p.id) a.lead = null; if (a.with) a.with = a.with.filter(id => id !== p.id); } }
  s.pop = Math.max(0, s.pop - 1); s.tension += 4;
  s.morale = clamp(s.morale - (p.trait === 'beloved' ? 5 : 2), 0, 100);
  LF.chron(s, `${p.name}, ${LF.title(p)}, left the colony: ${p.cause}.`);
  LF.log(s, `${p.name} has left the colony.`, 'bad');
  if (p.seat && p.role) s.vacancies.push({ role: p.role, seat: p.seat, day: s.day + LF.ri(s, 8, 20) });
  return p;
};
LF.isDead = p => !!p && !p.alive && !p.left;
/* ---------- losses at any size (2026-11-18; DESIGN.md "Generations, and a colony the size of a city") ----------
   Every loss on a card or in the tick is written for the colony the ship carried: LF.SCALE people. Up to that size it
   is what it says. Past it, it is multiplied by heads / LF.SCALE (LF.scale), so three dead of two hundred is three
   hundred dead of twenty thousand. LF.toll(s, n) is that number; LF.deaths applies it, here and nowhere else, and
   past LF.SCALE the dead are adults and children in proportion. A loss already worked out as a share of the colony
   (a calamity's, js/late.js) is passed with exact = true, or as fx.dead. Grief and tension go by the number as
   written, so a city mourns three hundred as the camp mourned three. What happens to a named person, or to a party of
   a stated size, is never scaled. Returns how many died. */
LF.SCALE = 200;
LF.kidCount = s => (s.gen && s.gen.kids) || 0;                 // children born here and not yet of age (js/generations.js)
LF.heads = s => s.pop + LF.kidCount(s);                        // everyone alive on the ground: what the stock bar calls Colonists
LF.scale = s => Math.max(1, LF.heads(s) / LF.SCALE);
LF.toll = (s, n) => Math.round(n * LF.scale(s));
LF.sized = s => Math.min(s.pop, LF.SCALE);                     // the colony as a card written for the founding one sees it: for "a tenth of the colony" that then goes through LF.toll
LF.num = n => Math.round(n).toLocaleString('en');              // 12,400
LF.short = n => { n = Math.round(n); const a = Math.abs(n); return a < 100000 ? n.toLocaleString('en') : a < 999500 ? Math.round(n / 1000) + 'k' : (n / 1e6).toFixed(a < 9995000 ? 2 : 1) + 'm'; };   // 99,999 then 100k, 1.25m
// How many of a loss are children: their share of it, once the colony is past LF.SCALE (the number has been scaled by
// everyone, so it falls on everyone) or the loss was a share of everyone to begin with and is a crowd. Up to LF.SCALE a
// handful on a card are the grown it was written about.
const split = (s, tot, k, kids, exact) => kids && (k > 1 || (exact && tot >= 10)) ? Math.min(kids, Math.round(tot * kids / (s.pop + kids))) : 0;
LF.deaths = function (s, n, exact) {
  const k = LF.scale(s), kids = LF.kidCount(s), tot = exact ? Math.round(n) : Math.round(n * k);
  const kd = split(s, tot, k, kids, exact), ad = Math.min(tot - kd, LF.hands(s));
  if (ad <= 0 && kd <= 0) return 0;
  const w = (ad + kd) / k;   // as written
  if (ad > 0) { if (s.gen && s.gen.born) s.gen.born = Math.max(0, s.gen.born - Math.round(ad * s.gen.born / Math.max(1, s.pop))); s.pop -= ad; }
  if (kd && LF.loseYoung) LF.loseYoung(s, kd);
  s.deaths += ad + kd; s.grief = Math.min(40, s.grief + 2.5 * w); s.tension += 3 * w;
  return ad + kd;
};
/* People who walk out rather than die: the same rule, and the same split. */
LF.leave = function (s, n, exact) {
  const k = LF.scale(s), kids = LF.kidCount(s), tot = exact ? Math.round(n) : Math.round(n * k);
  const kd = split(s, tot, k, kids, exact), ad = Math.min(tot - kd, s.pop);
  if (ad > 0) { if (s.gen && s.gen.born) s.gen.born = Math.max(0, s.gen.born - Math.round(ad * s.gen.born / Math.max(1, s.pop))); s.pop -= ad; }
  if (kd && LF.loseYoung) LF.loseYoung(s, kd);
  return Math.max(0, ad) + kd;
};
/* An expected number of events as a whole number: 0.3 is one, three times in ten. One draw, whatever the size. */
const lot = (s, x) => { const r = LF.rand(s), n = Math.floor(x); return n + (r < x - n ? 1 : 0); };
/* An outcome's text names its dead in words ("Three dead in the row"), and is true of what the card shows. Past
   LF.SCALE the colony's count is larger than the word, and a closing line says what it came to. (Replacing the word
   was tried and dropped: "100 of the three are dead", "the bell is moved 100 hours". node tools/sim.js 300 toll
   lists every outcome this touches.) */
LF.tollText = function (s, text, fx) {
  if (!fx || !text || LF.scale(s) <= 1) return text;
  const dead = fx.pop < 0 ? LF.toll(s, -fx.pop) : 0, gone = fx.leave ? LF.toll(s, fx.leave) : 0, alt = text.length % 2; let tail = '';
  if (dead > 0 && dead > -(fx.pop || 0)) tail = alt ? `That was one street. Counted across the whole colony, it was ${LF.num(dead)} dead.` : `It was the same in every quarter. The colony's count was ${LF.num(dead)} dead.`;
  if (gone > (fx.leave || 0)) tail += (tail ? ' ' : '') + (dead ? `${LF.num(gone)} more left.` : alt ? `They did not go from one street only. Across the colony, ${LF.num(gone)} are gone.` : `Every quarter lost some the same way. ${LF.num(gone)} are gone from the colony.`);
  return tail ? text + '\n\n' + tail : text;
};

/* ---------- machines & economy ---------- */
LF.eff = (s, id) => { const m = s.machines[id]; return m.lost || m.up ? 0 : m.hp >= 50 ? 1 : Math.max(0.2, m.hp / 50); };
LF.pillars = s => ({
  food: !!s.built.fields, water: !!s.built.wells,
  energy: !!s.built.turbines || !!s.flags.builders_power,
  industry: !!s.built.machineshop,
  people: !!s.built.school && LF.heads(s) >= LF.peopleNeed(s),
});
/* The people cord (2026-11-17, after a playtester sat under it for twenty-five years): a school, and enough people to
   keep it full. A hundred while the banks can still be emptied; sixty once nobody else is coming down (no sleepers
   left, or no lander), so a colony cut off from the ship is never left one cord short for good. */
LF.PEOPLE_CORD = 100;
LF.peopleNeed = s => (s.sleepers > 0 && s.machines && s.machines.lander && !s.machines.lander.lost) ? LF.PEOPLE_CORD : 60;
LF.power = s => {
  if (s.built.turbines || s.flags.builders_power) return 1;
  const r = s.machines.reactor; if (r.lost || r.up) return 0.25;
  return (r.hp >= 50 ? 1 : 0.5 + r.hp / 100) * (s.flags.reactor_derated ? 0.8 : 1);
};
LF.hurt = function (s, id, dhp, dcap) {
  const m = s.machines[id]; if (!m || m.lost) return;
  if (dcap) m.cap = clamp(m.cap + dcap, 0, 100);
  m.hp = clamp(m.hp + dhp, 0, m.cap);
  if (m.hp <= 0) loseMachine(s, id);
};
function loseMachine(s, id) {
  const m = s.machines[id]; if (m.lost) return;
  const up = m.up; m.lost = true; m.up = false; m.hp = 0; s.tension += 15;
  const nm = LF.MACHINES[id].name;
  LF.log(s, up ? `The ${nm} died aboard the ship before anyone could bring it down.` : `The ${nm} is gone for good.`, 'bad');
  LF.chron(s, `The ${nm} failed and could not be brought back.`); LF.storyPoint(s);
}
LF.yieldOf = s => Math.max(0.05, 0.3 + LF.pressure(s).yield + (s.built.greenhouse ? 0.25 : 0) + (s.flags.crops_adapted ? 0.45 : 0) + (s.built.fields ? 0.5 : 0) + s.yieldBonus);
LF.seasonYield = s => { const q = LF.date(s.day).season; return (s.world.climate === 'winter' && q === 3) ? 0.05 : SEASON_YIELD[q]; };
LF.harsh = s => s.world.truth.temp < -15 || s.world.truth.temp > 32;   // cargo pods were not built for it
LF.hands = s => Math.max(0, s.pop - s.away.reduce((a, x) => a + x.n, 0));
LF.hydroProd = s => 24 * (s.world.hydro || 1) * LF.eff(s, 'hydroponics') * LF.power(s);
LF.foodProd = s => 0.15 * LF.hands(s) * s.jobs.farm * LF.ration(s).work * (0.8 + 0.2 * LF.dept(s, 'crew')) * LF.pressure(s).labor * LF.yieldOf(s) * LF.seasonYield(s) * (s.flags.ration_by_work ? 1.08 : 1) * (LF.edge ? LF.edge(s, 'grow') : 1)
  + LF.hydroProd(s);
LF.KID_EATS = 0.2;   // a child's share of an adult's ration
LF.mouths = s => LF.hands(s) + LF.KID_EATS * LF.kidCount(s);
/* What a harvest is multiplied by on its way into the store (the card's "into the store" pays the same: the balance
   is set on it). It grows with the mouths as far as LF.SCALE of them and then stops: past that the crop already
   grows with the hands that sowed it, and a city's harvest read "104 months of eating". */
LF.fed = s => Math.max(1, Math.min(LF.mouths(s), LF.SCALE) / 60);
/* The three ration steps (Lachlan, 2026-11-20: five were too many; js/orders.js): what each eats, the morale target it
   sets (morale drifts towards it, so it sinks or rises a little every month) and what it does to accidents. 'tight' is
   reduced (half the food), the step every card that cuts the ladle sets; 'generous' eats a quarter more. A save from the
   five steps reads 'half' as reduced and 'double' as generous (LF.migrateOrders puts them right on load). */
LF.RATIONS = { tight: { eat: 0.5, morale: -20, att: 1.8, work: 0.85 }, normal: { eat: 1, morale: 0, att: 1, work: 1 }, generous: { eat: 1.25, morale: 8, att: 1, work: 1 } };
LF.RATIONS.half = LF.RATIONS.tight; LF.RATIONS.double = LF.RATIONS.generous;
LF.RATION_STEPS = ['tight', 'normal', 'generous'];
LF.RATION_NAME = { tight: 'reduced', half: 'reduced', normal: 'normal', generous: 'generous', double: 'generous' };
LF.ration = s => LF.RATIONS[s.rations] || LF.RATIONS.normal;
LF.lean = s => s.rations === 'tight' || s.rations === 'half';   // on reduced rations
LF.foodCons = s => LF.mouths(s) * LF.ration(s).eat;
/* Materials: plate, beams and metal for building. They come from three places, in this order, and the colony view
   says which (LF.matSource): the wreck (cargo pods, the lander's fairings and landing gear, cut up by the salvage
   crews; finite, s.wreck), then picking over the country once the wreck is stripped, and the ore body once it is
   found and the smelter is built. Cards add and spend lumps. */
const MAT_RATE = { wreck: 1, country: 0.45, ore: 2.2 };
LF.matSource = s => s.built.smelter ? 'ore' : (s.wreck || 0) > 0 ? 'wreck' : 'country';
LF.matIn = function (s, lab, take) {
  if (lab === undefined) lab = LF.crews(s) * LF.pressure(s).labor;
  const src = LF.matSource(s), v = s.jobs.extract * 0.5 * lab * (0.8 + 0.2 * LF.dept(s, 'crew')) * MAT_RATE[src] * (s.flags.site_highland ? 1.15 : 1) * (LF.edge ? LF.edge(s, 'extract') : 1);
  if (take && src === 'wreck') { s.wreck = Math.max(0, s.wreck - v);
    if (!s.wreck) s.flags.wreck_out = s.day;
    if (!s.wreck) LF.log(s, 'The last of the cargo pods has been cut up. The salvage crews are out picking over the country for whatever can be used.', 'bad'); }
  return v;
};
/* The yard and the build crews, in sixties. The colony's builds, materials and spares are all written for the founding
   colony, so the crews stop growing at LF.SCALE hands: past that the extra hands are raising the town itself (its
   streets are LF.capacity's business, js/generations.js) and the yard's figures stay ones a card can spend. */
LF.crews = s => Math.min(LF.hands(s), LF.SCALE) / 60;
/* BUILD: how much longer a founding build takes than its listed labour: the second dial, and the one that does not kill. 1.3 until
   2026-11-17. With the wheat card coming of its own accord the bot won a third of its games, and 1.75 with ATTRITION 0.0003 put it
   back at 12%. The same day the orders landed (js/orders.js: the player wakes sleepers and flies the lander at will, so there are
   forty more hands on the ground in the early years) and the same dials read 41%: 3 puts it at 12% on two samples of 1,200
   games, worlds within six points, and 22 of 57 colonies that win are alive at year 40. */
const BUILD = (typeof process !== 'undefined' && process.env && +process.env.BUILD_X) || 4.0;   // 4.0 since 2026-11-22 (3.6 before): the deck cut to three options a card plays easier, 24% for the bot at 3.6 and 14% on 1,200 at 4.0. BUILD_X=3.5 node tools/sim.js: try another figure without editing (Node only)
LF.cost = function (s, id) {
  const p = LF.PROJECTS[id]; let mat = p.mat, labor = p.labor * (p.repeat ? 1 : BUILD);
  if (id === 'machineshop' && s.flags.toolset) labor *= 0.65;
  if (id === 'turbines' && s.flags.geothermal) labor *= 0.7;
  if (id === 'wells' && s.flags.biofilm_studied) mat *= 0.7;
  if (id === 'school' && s.cargo && s.cargo.archive) labor *= 0.7;                       // the archive came down with the first load
  if (id === 'wells') { const w = s.world.truth.water; labor *= w < 20 ? 1.3 : w > 60 ? 0.8 : 1; }   // dry worlds dig deeper
  if (LF.edge && !p.repeat) labor *= LF.edge(s, 'build');   // who is in the chair (LF.EDGE)
  return { mat: Math.round(mat), labor: Math.round(labor) };
};
/* A building standing (WO-3): s.built.<id> is the day it was finished. The meeting hall can be shut by order (bu.hall). */
LF.has = (s, id) => !!(s && s.built && s.built[id]) && !(id === 'hall' && s.flags && s.flags.hall_shut && s.day - s.flags.hall_shut < YEAR);
/* How hard something out past the wire is pressing, 0-100: the worst live animal, people or growth that is not at
   peace with the colony, and the two dreads that come to the wire at night (the Guest, the Warrens) count as 50. */
LF.wireThreat = function (s) {
  let w = 0; for (const f of s.factors || []) if (f.stage >= 1 && !f.res && !f.dormant && f.accord < 40 && ['fauna', 'natives', 'humans', 'flora'].includes(f.kind)) w = Math.max(w, f.threat);
  for (const id of ['hunter', 'feral']) { const t = s.threads && s.threads[id]; if (t && t.on && t.phase !== 'latent' && !t.end) w = Math.max(w, 50); }
  return Math.round(w);
};
LF.projName = (s, id) => { const n = LF.PROJECTS[id].name; return typeof n === 'function' ? n(s) : n; };
LF.canStart = function (s, id) {
  const p = LF.PROJECTS[id];
  if (!p.repeat && s.built[id]) return 'Built';
  if (p.req && !p.req(s)) return typeof p.reqText === 'function' ? p.reqText(s) : p.reqText;
  if (s.res.mat < LF.cost(s, id).mat) return 'Not enough materials';
  return '';
};
LF.startProject = function (s, id) {
  if (s.project || LF.canStart(s, id)) return false;
  s.res.mat -= LF.cost(s, id).mat; s.project = id; s.progress = 0; return true;
};
LF.cancelProject = function (s) {
  if (!s.project) return; s.res.mat += Math.round(LF.cost(s, s.project).mat * 0.5); s.project = null; s.progress = 0;
};
LF.setJob = function (s, job, d) {
  const total = Object.values(s.jobs).reduce((a, b) => a + b, 0);
  if (d > 0 && total >= 10) return; if (d < 0 && s.jobs[job] <= 0) return;
  s.jobs[job] += d;
};

/* ---------- new game ---------- */
/* A game begins adrift: s.adrift holds the candidate worlds and there is no s.world until LF.embark (world.js)
   commits to one. LF.land then sets the colony down. */
LF.newGame = function (seed) {
  const s = {
    v: LF.VERSION, seed, rng: seed | 0, day: 0, world: null, adrift: null, arrival: false,
    res: {}, pop: 60, sleepers: 140, morale: 60, rations: 'normal',
    jobs: { farm: 4, maintain: 2, build: 2, extract: 2 },
    machines: {}, built: {}, project: null, progress: 0, yieldBonus: 0,
    flags: {}, survey: 0, tension: 20, grief: 0, deaths: 0, lowMorale: 0,
    used: {}, arcLast: {}, sched: [], vacancies: [], people: [], log: [], chron: [], repUsed: {},
    away: [], awayN: 0, factors: [], ledger: [], val: { mercy: 0, bold: 0, open: 0, free: 0 }, sigs: {},
    memo: {}, passed: {}, cond: {}, signs: [], seeds: [], storySeen: {}, blames: [], cargo: {}, slate: null, threads: null, plot: null, focus: null, nextPlan: 0, paid: {}, pend: null, last: null, yearMark: null,
    recap: { n: 0, d: 0, major: false, y: 1 }, crop: 0, wreck: 0, due: false, hud: null, hudNext: null, cur: null, nextDilemma: 10, nextReport: 4, lastTone: null, over: null, won: false, dilemmas: 0, firstDead: null,
  };
  for (let i = 0; i < 5; i++) LF.rand(s);
  s.premise = LF.premiseOf(seed);
  LF.makeAdrift(s);
  return s;
};
LF.land = function (s) {
  const j = s.world.j;
  for (const id in LF.MACHINES) s.machines[id] = { hp: LF.ri(s, 84, 93) - 4 - Math.round(3 * j), cap: 95 - Math.round(2.5 * j), lost: false };
  // One machine took the landing badly (sometimes two, after a long burn). Which one shapes the whole run.
  const ids = Object.keys(LF.MACHINES), hurt = LF.pick(s, ids);
  s.machines[hurt].hp = 60; s.machines[hurt].cap = 82; s.world.landingDamage = hurt;
  // the wreck: what the salvage crews can cut from the pods and the lander's fairings before they must look further (LF.matIn)
  s.wreck = (LF.ARCHETYPES[s.world.type] || {}).wreck || 320;   // a hard site's salvage (world.js)
  // Only the reactor goes down with the first flight for certain; the rest wait aboard (setup.load can bring the hydroponics bay or the autodoc).
  for (const id in s.machines) if (id !== 'reactor' && id !== 'lander') s.machines[id].up = true;
  s.fuel = 2;   // two flights after landfall, then the digester (Lachlan, 2026-11-16)
  LF.makeOfficers(s);   // the six (officers.js)
  const PM = LF.PREMISES[s.premise]; if (PM) { LF.chron(s, PM.chron); if (PM.touch) PM.touch(s, ids.filter(i => i !== hurt)); }
  LF.log(s, `The ${LF.MACHINES[hurt].name} took damage ${hurt === 'reactor' || hurt === 'lander' ? 'in the descent' : 'on the crossing'}. It will never be quite right again.`, 'bad');
  if (s.world.secondWound) { const h2 = LF.pick(s, ids.filter(i => i !== hurt)); s.machines[h2].hp = 66; s.machines[h2].cap = 86;
    LF.log(s, `So did the ${LF.MACHINES[h2].name}. It had been running too long before it ever saw a gravity well.`, 'bad'); }
  if (LF.societyInit) LF.societyInit(s);
  if (LF.plot && !s.world.siteOpen) LF.plot(s);   // which story threads this world holds (threads.js); a site still to choose deals them then (LF.pickSite)
  // Before the descent: who goes down first, and what rides with the reactor (content-setup.js: setup.wake1, setup.load).
  // First the crossing, if this game has one to play (s.voyage, set by LF.embark), then orbit and a name for the world.
  if (LF.makeSlate) LF.makeSlate(s);
  if (s.voyage && LF.crossing) { s.voyage.next = 'setup.wake1'; LF.crossing(s); }   // two incidents on the way, then orbit (content-setup.js)
  else { LF.orbitChron(s); LF.fire(s, 'setup.wake1'); }
};
LF.orbitChron = s => LF.chron(s, `After ${s.world.transit.years} more years under way, the ${s.world.ship} made orbit over ${s.world.planet}. ${s.pop} were woken and ${s.sleepers} left asleep.`);
const STRIKE = ['in the hills, close enough to rattle the pods', 'on the far side of the ridge', 'in the river, which ran brown for the rest of the month'];
LF.meteor = function (s) { // debris in the system comes down now and then; rarely on anything that matters
  const r = LF.rand(s);
  if (r < 0.45) { LF.log(s, `A meteor came down ${LF.pick(s, STRIKE)}. Everyone has started watching the sky.`); s.morale = clamp(s.morale - 1, 0, 100); }
  else if (r < 0.7) { s.res.mat = Math.max(0, s.res.mat - 12); LF.log(s, 'A meteor burst over the plate yard. Some of the plate is slag and splinters now.', 'bad'); }
  else if (r < 0.9) { const ids = Object.keys(s.machines).filter(k => LF.down(s, k)); if (!ids.length) return; const id = LF.pick(s, ids); LF.hurt(s, id, -9, -3);
    LF.log(s, `Fragments from a meteor burst went through the housing of the ${LF.MACHINES[id].name}.`, 'bad'); }
  else { LF.deaths(s, 1); LF.log(s, 'A meteor fragment the size of a fist came through a pod roof at night and killed the person asleep beneath it.', 'bad'); }
};

/* ---------- daily tick ---------- */
LF.tick = function (s) {
  if (s.adrift || s.cur || (s.over && !s.over.cont)) return;
  s.day++;
  if (s.refuel && LF.refuelTick) LF.refuelTick(s);   // a refuel ordered last month: the tanks read full (js/orders.js)
  LF.steward(s);
  const PR = LF.pressure(s), lab = LF.crews(s) * PR.labor * LF.ration(s).work, pf = LF.power(s), pil = LF.pillars(s);
  const D = k => LF.dept(s, k);   // how well each of the six departments is running (officers.js): 1 with its officer at work
  LF.factorTick(s);
  if (s.day % 20 === 0) LF.factionCheck(s);
  if (LF.societyTick) LF.societyTick(s);
  if (LF.threadTick) LF.threadTick(s);
  if (LF.limitsTick) LF.limitsTick(s);   // standing practices the colony took up at its limits (content-limits.js)
  if (LF.storyTick) LF.storyTick(s);   // the colony model (story.js) only observes; it never draws on s.rng

  // food
  const hyd = LF.hydroProd(s);
  s.crop = (s.crop || 0) + LF.foodProd(s) - hyd;
  s.res.food += hyd - LF.foodCons(s) - PR.drain * s.pop;
  if (s.res.food < 0 && s.crop > 0) {   // the bins are empty and the crop is still in the ground: it is cut green, and half of it is wasted
    const need = -s.res.food, take = Math.min(s.crop, need * 2); s.crop -= take; s.res.food += take / 2;
    if (!s.flags._green || s.day - s.flags._green > YEAR) { s.flags._green = s.day; LF.log(s, 'The stores ran dry before the harvest. The crop is being cut green, and half of it is wasted.', 'bad'); }
  }
  // The harvest is cut at the season's end, and comes into the store only with its card (plan.harvest, dealt the same
  // month): food never arrives from the fields without a card to say so (Lachlan, 2026-11-15). A crop too small to
  // be worth the name (trial plots, a dead winter) goes straight in, unremarked.
  // Only the first two harvests get a card (Lachlan, 2026-11-16: after one or two nobody cares). After that the crop
  // goes in with a line under Meanwhile, and the card only comes back for a harvest worth stopping for: a failed one,
  // or a big one the colony had stopped hoping for (LF.harvestCard).
  if (s.day % SEASON === 0 && s.crop > 0) {
    if (LF.has(s, 'cannery')) s.crop *= 1.15;   // the cannery and cold store: a seventh more of every harvest kept
    if (s.crop >= 40 && LF.byId['plan.harvest'] && LF.harvestCard(s, s.crop)) s.reap = (s.reap || 0) + s.crop;
    else { if (s.crop >= 40) s.crop = Math.round(s.crop * LF.fed(s) / 10) * 10;   // what the card's "into the store" pays (LF.apply scales food by mouths); the balance is set on it
      if (s.crop >= 40) LF.log(s, `The ${LF.SEASONS[LF.date(s.day - 1).season].toLowerCase()} harvest is in: about ${LF.monthsWord(s.crop / Math.max(1, LF.foodCons(s) * MONTH))} of eating, straight into the store.`, s.crop / Math.max(1, LF.foodCons(s) * MONTH) < 1.2 ? 'bad' : 'good'); s.res.food += s.crop; }
    s.crop = 0; }
  if (s.res.food < 0 && s.reap > 0) { const t = Math.min(s.reap, -s.res.food); s.reap -= t; s.res.food += t; }   // a hungry colony eats off the threshing floor
  if (s.res.food <= 0) {
    s.res.food = 0; s.morale -= 0.7;
    if (LF.rand(s) < 0.6) { LF.deaths(s, 1 + (s.pop > 50 ? 1 : 0) + (s.pop > 90 ? 1 : 0)); if (!s.flags._starved) { s.flags._starved = true; LF.chron(s, 'The stores ran out. People began to starve.'); } }
  }
  if (s.world.debris > 0.15 && LF.rand(s) < 0.0035 * s.world.debris) LF.meteor(s);
  // materials. There is no survey crew: what is known of the country comes from the orbital report on arrival and
  // from the parties the colony decides to send (s.survey only moves through decisions).
  s.res.mat += LF.matIn(s, lab, true);
  // ore is no longer found by itself (2026-11-18): the orbital report's lead is a place on the World map, and a party has to reach it (js/places.js LF.FINDS)
  if (!s.flags.climate_known && s.day >= 200) {
    s.flags.climate_known = true;
    LF.log(s, 'After most of two years here, the pattern of this world\'s violence is plain enough to build against.');
  }
  // wear
  for (const id in s.machines) {
    const m = s.machines[id]; if (m.lost) continue;
    // Service life: maintenance restores condition, but only up to a ceiling that never stops falling.
    m.cap = Math.max(0, m.cap - 0.085);
    m.hp = Math.min(m.cap, m.hp - LF.MACHINES[id].wear * (m.up ? 0.4 : PR.wear * (s.flags.push_on ? 1.5 : 1) * (1.25 - 0.25 * D('engineer')) * LF.edge(s, 'wear')));   // aboard: cold and idle
    if (m.hp <= 0 || m.cap < 8) loseMachine(s, id);
  }
  // maintenance: worst machine first
  let cap = s.jobs.maintain * 0.19 * Math.sqrt(lab);
  const order = Object.keys(s.machines).filter(id => !s.machines[id].lost && !s.machines[id].up).sort((a, b) => s.machines[a].hp - s.machines[b].hp);
  const per = LF.has(s, 'machineshop') ? 0.12 : 0.2;   // spares a point of repair costs: the machine shop turns what it can instead of taking it off the shelf
  for (const id of order) {
    if (cap <= 0 || s.res.parts <= 0) break;
    const m = s.machines[id], r = Math.min(cap, m.cap - m.hp, s.res.parts / per);
    if (r > 0) { m.hp += r; cap -= r; s.res.parts = Math.max(0, s.res.parts - r * per); }
  }
  // construction
  if (s.project) {
    s.progress += s.jobs.build * lab * (0.8 + 0.2 * D('engineer')) * (0.5 + 0.5 * pf) * (s.flags.push_on ? 1.5 : 1);   // double shifts: builds half as fast again (Lachlan, 2026-11-20)
    const c = LF.cost(s, s.project);
    if (s.progress >= c.labor) {
      const id = s.project, p = LF.PROJECTS[id]; s.project = null; s.progress = 0;
      if (!p.repeat) { s.built[id] = s.day; LF.log(s, `${LF.projName(s, id)} complete.`, 'good'); }
      if (p.done) p.done(s);
      s.pend = id;
      if (p.pillar && LF.pillars(s)[p.pillar]) { LF.chron(s, `${LF.projName(s, id)} finished. The colony no longer depends on the ${LF.PILLARS[p.pillar].replaces} alone.`); LF.storyPoint(s); if (p.pillar === 'people') s.flags.people_cut = s.day; }
      else if (p.pillar) LF.chron(s, `${LF.projName(s, id)} finished. The people cord will be cut when ${LF.peopleNeed(s)} live here.`);
    }
  }
  if (LF.yardTick) LF.yardTick(s);   // the yard (js/orders.js): the queue's next build starts, a salvage push comes in
  // lost machines with no native replacement
  if (s.machines.reclaimer.lost && !pil.water) { s.morale -= 0.35; LF.deaths(s, lot(s, 0.005 * s.pop), true); }
  if (s.machines.reactor.lost && !pil.energy) s.morale -= 0.2;
  if (s.machines.medbay.lost && !s.built.school) LF.deaths(s, lot(s, 0.0015 * s.pop), true);
  // still aboard: the lander's water tanks and a boiling pot instead of the reclaimer, a field kit instead of the autodoc
  if (s.machines.reclaimer.up && !pil.water) { s.morale -= 0.1; LF.deaths(s, lot(s, 0.0001 * s.pop), true); }
  if (s.machines.medbay.up && !s.built.school) LF.deaths(s, lot(s, 0.0001 * s.pop), true);
  // The place kills people on its own account: falls, cold, the water, a cut that goes bad. Worse without a roof or a clinic.
  if (s.day > 20) LF.deaths(s, lot(s, ATTRITION * (s.won ? 1 - 5 * EASE : 1 - EASE * Object.values(LF.pillars(s)).filter(Boolean).length) * s.pop * (LF.harsh(s) && !s.built.housing ? 1.3 : 1) * (s.built.school ? 0.7 : 1) * LF.ration(s).att * (1 - Math.min(0.6, (s.flags.stain || 0) / 90)) * (1.35 - 0.35 * D('doctor')) * (1.25 - 0.25 * D('security'))), true);   // a colony that has stopped carrying its weak loses fewer by accident: that is what the stain buys
  // births, the children growing, and the ones who come of age (js/generations.js)
  if (LF.genTick) LF.genTick(s);
  // morale drifts toward what conditions justify
  const done = Object.values(pil).filter(Boolean).length;
  let target = 50 + (LF.lean(s) && LF.has(s, 'cannery') ? LF.ration(s).morale / 2 : LF.ration(s).morale) + (s.built.housing ? 8 : 0) + done * 3 - s.grief
    - 8 * (1 - D('command')) - (s.res.food <= 0 ? 25 : 0) - (pf < 0.5 ? 8 : 0) - (LF.harsh(s) && !s.built.housing ? 3 : 0) + (s.flags.council ? 4 : 0) - (s.pop > 110 && !s.built.housing ? 6 : 0) + (s.lift || 0);   // s.lift: hope lent by a card, fading (js/ebb.js)
  if (target > 0) target *= LF.edge(s, 'morale');   // a Chief Agronomist who keeps the table cheerful (LF.EDGE)
  if (LF.has(s, 'hall')) target = Math.max(target + 3, 27);   // the meeting hall: a floor under what conditions justify
  s.morale += PR.morale;
  s.morale = clamp(s.morale + (target - s.morale) * 0.02, 0, 100);
  if (s.lift) { s.lift *= 0.985; if (Math.abs(s.lift) < 0.5) s.lift = 0; }
  s.grief *= 0.975; s.tension = clamp(s.tension - 0.6, 0, 100);
  // vacancies
  for (let i = s.vacancies.length - 1; i >= 0; i--) {
    const v = s.vacancies[i];
    if (!v.role && !v.seat) { s.vacancies.splice(i, 1); continue; }             // a notable colonist leaves no office to fill
    if (s.day < v.day) continue;
    s.vacancies.splice(i, 1);
  }
  if (LF.seatFill && s.day % 5 === 0 && !s.vacancies.some(v => v.seat)) LF.seatFill(s);   // a seat with nobody left in it is empty for good (officers.js)
  if (LF.officerTick) LF.officerTick(s);
  // A colony at the end of its patience does not end the game; it bleeds. People walk off to make their own camps,
  // and the longer it lasts the closer the officers come to being thrown out (pol.mutiny). The player stays in post.
  s.lowMorale = s.morale < 12 ? s.lowMorale + 1 : Math.max(0, s.lowMorale - 2);
  if (s.morale < 12 && s.pop > 20 && LF.rand(s) < 0.03) { const n0 = Math.min(s.pop - 20, LF.ri(s, 1, 3)), n = LF.leave(s, n0); s.deserted = (s.deserted || 0) + n;
    LF.log(s, n === 1 ? 'Someone packed a bag in the night and walked out past the wire. Nobody stopped them.' : n > 12 ? `${LF.num(n)} people left the colony this month, by night, in families. Nobody stopped them.` : `${n} people walked out in the night with packs and a tent. They left a note on the stores door.`, 'bad'); }
  if (pil.people && !s.flags.people_cut) { s.flags.people_cut = s.day; LF.chron(s, `The colony reached ${LF.peopleNeed(s)} people, children counted, with a school to teach them. It no longer depends on the Autodoc and the sleepers alone.`); LF.log(s, 'The people cord is cut.', 'good'); LF.storyPoint(s); }
  // endings: the colony dying out, or something existential. Internal politics never end the game.
  // Cutting the cord is not safety: a colony that plays on after winning can still starve.
  if (!s.over || s.over.cont) {
    const fell = s.pop <= 8 ? 'dead' : null;
    if (fell) s.over = { kind: fell, day: s.day, after: s.won ? s.wonDay : 0 };
    else if (!s.won && Object.values(pil).every(Boolean)) { s.won = true; s.wonDay = s.day; s.over = { kind: 'win', day: s.day }; LF.chron(s, 'The colony could now live without the ship that brought it.'); }
    if (s.over && !s.over.cont) return;
  }
  // Meanwhile lines run on their own clock, between the cards
  if (s.day >= s.nextReport) { LF.fireReport(s); s.nextReport = s.day + LF.ri(s, 4, 8); }
  // One card a month. What happens in between (a party back, a build finished, hunger) waits for the month's end.
  if (s.day % MONTH === 0) { s.due = true; s.hud = s.hudNext || LF.stocks(s); s.hudNext = LF.stocks(s); }
  if (s.due) LF.deal(s);
};
/* What the stock bar compares against: the colony at the start of the last month (LF.stocks). */
LF.stocks = s => ({ pop: LF.heads(s), food: Math.round(s.res.food), mat: Math.round(s.res.mat), parts: Math.round(s.res.parts), d: s.day });
/* The month's card. A recap at the turn of the year comes first and costs no month. */
LF.deal = function (s) {
  if (s.cur || (s.over && !s.over.cont)) return;
  dealOne(s);
  // The year's recap costs no month, and neither does the build crews' question or a finished build (Lachlan, 2026-11-15:
  // what to build is not what the month is about): the month's real card follows them.
  // A storylet marked aside (2026-11-18: a first death, a first class come of age, js/content-born.js) is dealt like the harvest:
  // it comes with its own card when it happens, and the month's real card follows it. Never two in one month (s.asideDay).
  const aside = s.cur && !s.cur.gen && LF.byId[s.cur.id] && LF.byId[s.cur.id].aside;
  if (aside) s.asideDay = s.day;
  if (s.cur && !aside && s.cur.id !== 'recap' && s.cur.id !== 'plan.harvest' && s.cur.id !== 'order.standing' && !(s.cur.side && (s.cur.plan || s.cur.id === 'done'))) s.due = false;
};
function dealOne(s) {
  if (LF.recapDue(s)) { LF.fireRecap(s); return; }
  if (s.reap > 0) { LF.fire(s, 'plan.harvest'); return; }   // the harvest comes in with its own card, and costs no month
  // parties in the field: a return (or a silence) interrupts whatever else was due
  if (LF.awayTick(s)) return;
  // the council: a finished build is reported, and an idle build crew wants an answer
  if (s.pend) { LF.fireDone(s); return; }
  if (LF.planDue(s) && LF.firePlan(s)) return;   // First Things, until a first build is started (T2-2: after that the build card comes only when a build finishes with nothing queued, or a card asks for it)
  // The colony's own condition goes first: hunger, a strike, bins full enough to end the rationing.
  for (const st of URGENT) if (open(s, st, false)) { s.lastUrgent = s.day; LF.fire(s, st.id); return; }
  // director
  // A card under a standing order (LF.standing) is carried out without coming to the player, and the month's card is drawn again.
  let st = LF.direct(s);
  for (let k = 0; k < 3 && st && !st.gen && byRote(s, st); k++) { if (s.cur) return; st = LF.direct(s); }
  if (st && st.gen) LF.fireGen(s, st.f, st.fr); else if (st) LF.fire(s, st.id);
  else if (LF.planDue(s) && LF.firePlan(s)) return;   // nothing out there is ready: the council has a question instead (not before the crews are due: salvage put it off, and it used to come straight back, the same day, for ever)
}

/* ---------- standing orders (2026-11-17) ----------
   A playtester answered the proton storm the same way for fifteen years. A repeating card marked standing: true keeps
   count of the same answer given running (s.habit); after two, order.standing (content-plan.js) asks whether to make it
   the standing order (s.standing[id] = option). From then on the card is carried out as a line in the log and never
   dealt, until that option is no longer open, when the order lapses and the card comes back. */
function byRote(s, st) {
  const j = st.standing && s.standing ? s.standing[st.id] : undefined;
  if (j === undefined || j === null) return false;
  LF.fire(s, st.id); s.dilemmas--;
  const o = LF.choices(s).find(x => x.i === j);
  if (!o || o.lock) { delete s.standing[st.id]; if (s.habit) delete s.habit[st.id]; LF.log(s, `${st.title}: the standing order could not be carried out this time.`, 'bad'); s.dilemmas++; return true; }   // the card stays up
  s.rote = true; LF.choose(s, j); s.rote = false;
  const c = s.cur, r = c && c.result;
  if (!r || c.phase !== 'result' || r.then) { s.dilemmas++; return true; }   // it led somewhere that needs the player
  LF.log(s, `${st.title}. The standing order held: ${r.label.replace(/\.$/, '')}. ${r.text}${r.chips && r.chips.length ? ' (' + r.chips.map(x => x.t).join(', ') + ')' : ''}`, r.success === false ? 'bad' : '');
  s.cur = null; return true;
}
LF.habit = function (s, st, i) {
  if (!st.standing || s.rote) return;
  s.habit = s.habit || {}; const hb = s.habit[st.id] || (s.habit[st.id] = { i: -1, n: 0 });
  if (hb.i === i) hb.n++; else { hb.i = i; hb.n = 1; }
};
/* The repeating card that is due a standing order, if any: answered the same way twice running, and not yet asked. */
LF.habitDue = s => Object.keys(s.habit || {}).find(id => { const hb = s.habit[id]; return hb.n >= 2 && !hb.asked && LF.byId[id] && !(s.standing && s.standing[id] !== undefined); }) || null;

/* ---------- director ---------- */
const OPTIONAL = ['understory', 'builders', 'others', 'hive', 'flare', 'winter', 'storm', 'fever'];
function open(s, st, viaSched) {
  if (OPTIONAL.includes(st.arc) && !s.world.arcs.includes(st.arc)) return false;
  const u = s.used[st.id];
  if (u !== undefined && (!st.repeat || s.day - u < st.repeat)) return false;
  if (st.max && ((s.nfired || {})[st.id] || 0) >= st.max) return false;   // st.max: a repeating card stops after this many (Lachlan, 2026-11-16: after one or two, new decisions instead)
  if (st.chain && !viaSched) return false;
  return !st.when || !!st.when(s);
}
LF.direct = function (s) {
  // 1. Consequences that have come due always get the next slot.
  s.sched.sort((a, b) => a.day - b.day);
  for (let i = 0; i < s.sched.length; i++) {
    const e = s.sched[i]; if (e.day > s.day) break;
    const st = LF.byId[e.id];
    if (st && open(s, st, true)) { s.sched.splice(i, 1); return st; }
    if (s.day - e.day > 60) { s.sched.splice(i, 1); i--; }
  }
  // 2. Otherwise weigh everything that could happen now.
  const hot = s.tension > 60, calm = s.tension < 28;
  const TONE = hot ? { crisis: 0.25, pressure: 0.7, quiet: 2.2, opportunity: 1.6 }
    : calm ? { crisis: 1.7, pressure: 1.3, quiet: 0.6, opportunity: 0.9 }
    : { crisis: 1, pressure: 1, quiet: 1, opportunity: 1 };
  const pool = [];
  for (const st of LF.storylets) {
    if (!open(s, st, false)) continue;
    if (st.arc !== 'state' && s.day - (s.arcLast[st.arc] ?? -999) < (st.gap ?? 28)) continue;
    let w = (typeof st.w === 'function' ? st.w(s) : st.w ?? 1) * (TONE[st.tone] ?? 1);
    if (s.lastTone === 'crisis' && st.tone === 'crisis') w *= 0.4;
    if (st.arc === 'state') w *= 3;                                   // the colony's actual condition speaks loudest
    if (w > 0) pool.push([st, w]);
  }
  // Generated dilemmas: every factor the world holds that has something to say right now.
  for (const c of LF.genCandidates(s)) {
    let w = c.w * 1.3 * (TONE[c.fr[0].tone] ?? 1);
    if (s.lastTone === 'crisis' && c.fr[0].tone === 'crisis') w *= 0.5;
    pool.push([{ gen: true, f: c.f, fr: c.fr }, w]);
  }
  if (!pool.length) return null;
  let r = LF.rand(s) * pool.reduce((a, x) => a + x[1], 0);
  for (const [st, w] of pool) { r -= w; if (r <= 0) return st; }
  return pool[pool.length - 1][0];
};
LF.fireReport = function (s) {
  const pool = LF.reports.filter(r => (s.repUsed[r.id] === undefined || (r.repeat && s.day - s.repUsed[r.id] > r.repeat)) && (!r.when || r.when(s)));
  if (!pool.length) return;
  const urgent = pool.filter(r => r.urgent);
  const r = LF.pick(s, urgent.length ? urgent : pool);
  s.repUsed[r.id] = s.day;
  const m = r.make ? r.make(s) : null; if (r.make && !m) return;   // make: the line and its effect, built together from one drawn event
  const out = []; LF.apply(s, m ? m.fx : typeof r.fx === 'function' ? r.fx(s) : r.fx, out, {});
  LF.log(s, (m ? m.t : r.text(s)) + (out.length ? ' (' + out.map(c => c.t).join(', ') + ')' : ''), (m && m.k) || r.k || '');
};

/* ---------- storylets ---------- */
/* Where a decision lives. The game takes the player to the view a card belongs to: the colony (internal questions),
   the world (anything out there) or the people (the named, the factions, the politics). A storylet may say so with
   view:; otherwise its arc decides. Generated frames go by the factor's kind (gen.js), side cards say it themselves. */
LF.VIEWS = ['colony', 'world', 'people', 'ship'];
LF.ARC_VIEW = { core: 'colony', crops: 'colony', machines: 'colony', state: 'colony', sleepers: 'colony', fever: 'colony', plan: 'colony',
  flare: 'colony', winter: 'colony', storm: 'colony', politics: 'people', quiet: 'people', returned: 'people', after: 'people', others: 'people', hive: 'people',
  understory: 'world', builders: 'world' };
const URGENT = [];
LF.add = st => { LF.storylets.push(st); LF.byId[st.id] = st; if (st.urgent) URGENT.push(st); };
LF.addReport = (id, o) => { LF.reports.push(Object.assign({ id }, o)); };
LF.fire = function (s, id) {
  const st = LF.byId[id];
  s.cur = { id, ctx: (st.setup && st.setup(s)) || {}, phase: 'choose', attach: [], view: (typeof st.view === 'function' ? st.view(s) : st.view) || LF.ARC_VIEW[st.arc] };
  if (st.aboard) s.cur.aboard = true;   // it happens on the ship: only the officers aboard can be sent (people.js)
  // A thread's card says what it belongs to: what the colony calls the thing, if it has a name for it yet, and what
  // was last decided about it (s.cur.story; the UI shows it over the title).
  if (st.thread && LF.T) { const th = LF.T(s, st.thread), d = LF.THREADS[st.thread];
    if (th) s.cur.story = { name: (d && d.called && d.called(s, th)) || null, prev: th.last || null }; }
  LF.notice(s, st.text(s, s.cur.ctx));
  s.used[id] = s.day; s.nfired = s.nfired || {}; s.nfired[id] = (s.nfired[id] || 0) + 1; s.arcLast[st.arc] = s.day; s.lastTone = st.tone; s.dilemmas++;
  s.tension = clamp(s.tension + ({ crisis: 18, pressure: 8, quiet: -12, opportunity: -4 }[st.tone] || 0), 0, 100);
};
LF.view = s => s.cur.gen ? s.cur : { title: LF.byId[s.cur.id].titleOf ? LF.byId[s.cur.id].titleOf(s, s.cur.ctx) : LF.byId[s.cur.id].title, tone: LF.byId[s.cur.id].tone, text: LF.byId[s.cur.id].text(s, s.cur.ctx) };
/* The line over a thread card's title: "The sickness in the well water · after “Not Themselves”, three months ago: Test everyone". */
// a thread's own 'last' can be a date of its own (the Red Month keeps the night of its last red week there): only a decision counts
LF.storyLine = function (s) { const y0 = s.cur && s.cur.story, y = y0 && Object.assign({}, y0, { prev: y0.prev && typeof y0.prev === 'object' && y0.prev.title && y0.prev.label ? y0.prev : null }); if (!y || (!y.name && !y.prev)) return '';
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1), ago = y.prev ? Math.round((s.day - y.prev.d) / MONTH) : 0;
  const prev = y.prev ? `after “${y.prev.title}”${ago >= 1 ? ', ' + LF.monthsWord(ago) + ' ago' : ''}: you chose “${y.prev.label}”` : '';
  return y.name ? cap(y.name) + (prev ? ' · ' + prev : '') : cap(prev); };
/* The mark beside each option: promising, costly, or unknown. Indicative only; the world is not obliged. */
function fxScore(fx) { if (!fx) return 0; let n = 0;
  for (const k of ['food', 'mat', 'parts', 'morale', 'yield', 'pop', 'survey']) if (fx[k]) n += Math.sign(fx[k]);
  if (fx.machine) for (const k in fx.machine) n += Math.sign(fx.machine[k]);
  if (fx.kill || fx.depart || fx.leave || fx.dead || fx.gone) n -= 2;
  if (fx.fops) for (const o of fx.fops) n += (o.threat ? -Math.sign(o.threat) : 0) + (o.resolve && o.resolve !== 'lost' ? 2 : 0);
  return n; }
LF.tenor = function (s, o) {
  if (o.ch.hint) return o.ch.hint;
  if (o.odds) return o.odds.p >= 65 ? 'good' : o.odds.p < 42 ? 'bad' : 'unknown';
  const out = o.ch.out; if (!out) return 'unknown';
  let fx = out.fx; if (typeof fx === 'function') { try { fx = fx(s, s.cur.ctx); } catch (e) { fx = null; } }
  const n = fxScore(fx); return n > 0 ? 'good' : n < 0 ? 'bad' : 'unknown';
};
LF.choices = function (s) {
  if (s.cur.gen) { const kf = s.factors.find(x => x.id === s.cur.fid);
    return seatLocks(s, s.cur.choices.map((ch, i) => ({ i, ch, lock: ch.lock, label: ch.label, note: ch.note, odds: LF.withAttach(s, ch.odds, ch.ap, kf && kf.kind, { mods: ch.roles || [], ap: ch.ap }), against: ch.against, send: ch.send, info: ch.info, cost: ch.cost, rank: ch.rank }))); }
  const st = LF.byId[s.cur.id], c = s.cur.ctx;
  const list = st.choices.map((ch, i) => {
    if (ch.show && !ch.show(s, c)) return null;
    let lock = ''; const cc = typeof ch.cost === 'function' ? ch.cost(s, c) : ch.cost;   // a cost may depend on what the card is about
    if (ch.req && !ch.req(s, c)) lock = LF.upLock(s, (typeof ch.reqText === 'function' ? ch.reqText(s, c) : ch.reqText) || 'Not possible');
    else if (ch.fly && !LF.canFly(s, ch.fly)) lock = LF.flyWhy(s, ch.fly) || 'The lander cannot fly';   // fly: n, 2026-11-21
    else if (cc) for (const k in cc) if (s.res[k] < cc[k]) lock = `Not enough ${RES[k]}: it needs ${Math.round(cc[k])}, the colony holds ${Math.round(s.res[k])}`;
    // A hand-written choice can send a party too: send: { n, days: [min, max], danger, to, ret }.
    let send = null, cost = cc;
    if (ch.send) { const d = (ch.send.days[0] + ch.send.days[1]) / 2, food = Math.round(ch.send.n * d * 0.5 / 10) * 10;
      send = { n: ch.send.n, months: Math.max(1, Math.round(d / LF.MONTH)), danger: ch.send.danger }; cost = Object.assign({ food }, cc);
      if (!lock && LF.hands(s) - ch.send.n < 18) lock = `Needs ${ch.send.n} people to spare`; else if (!lock && s.res.food < food) lock = `Needs ${food} food`; }
    return { i, ch, lock, send, cost, info: (typeof ch.info === 'function' ? ch.info(s, c) : ch.info) || autoInfo(s, ch, c), label: typeof ch.label === 'function' ? ch.label(s, c) : ch.label,
      note: typeof ch.note === 'function' ? ch.note(s, c) : ch.note, odds: ch.test ? LF.withAttach(s, LF.odds(s, ch.test, c), null, null, ch.test, c) : null, auto: !ch.info };
  }).filter(Boolean);
  // A loss every option carries (a death already told in the card) is not part of the choice: drop that read-off chip.
  const autos = list.filter(o => o.auto);
  if (autos.length > 1) for (const [k, t] of autos[0].info || []) {
    if ((k !== 'danger' && k !== 'fail') || !autos.every(o => (o.info || []).some(([k2, t2]) => k2 === k && t2 === t))) continue;
    for (const o of autos) { o.info = o.info.filter(([k2, t2]) => !(k2 === k && t2 === t)); if (!o.info.length) o.info = null; } }
  return seatLocks(s, list.map(o => { delete o.auto; return o; }));
};
/* A seat with nobody left in it closes what needed it: an option whose test names that office is locked. Never the
   last open option on a card: a card always leaves the player something to do. */
function seatLocks(s, list) {
  const hit = list.filter(o => !o.lock && o.odds && o.odds.parts.some(q => q.gone));
  if (!hit.length || !list.some(o => !o.lock && !hit.includes(o))) return list;
  for (const o of hit) o.lock = o.odds.parts.find(q => q.gone).label;
  return list;
}
/* Info chips for a hand-written choice that has none of its own: read off what its outcome does. A yield from what
   it gives, a danger from what failure costs. Indicative, like the hint marks; authored info always wins. */
const YIELD = [['food', 'Food'], ['mat', 'Materials'], ['parts', 'Spares'], ['yield', 'Better harvests'], ['morale', 'Morale'], ['pop', 'More hands'], ['survey', 'The map']];
function autoInfo(s, ch, c) {
  const fxOf = o => { if (!o) return null; let fx = o.fx; if (typeof fx === 'function') { try { fx = fx(s, c); } catch (e) { fx = null; } } return fx || null; };
  const out = [], good = fxOf(ch.out || ch.ok), bad = ch.test ? fxOf(ch.bad) : ch.out ? good : null;
  if (good) { const y = YIELD.find(([k]) => good[k] > 0); if (y) out.push(['yield', y[1]]); else if (good.machine && Object.values(good.machine).some(v => v > 0)) out.push(['yield', 'Repairs']); }
  // on a roll the loss is what failing costs ('fail', drawn as "If it fails"); on a sure option it is part of the deal ('danger')
  if (bad) { const dk = ch.test ? 'fail' : 'danger';
    if (bad.kill || bad.pop < 0 || bad.dead) out.push([dk, 'Lives']);
    else if (bad.machine && Object.entries(bad.machine).some(([, v]) => v < 0)) out.push([dk, `The ${LF.MACHINES[Object.entries(bad.machine).find(([, v]) => v < 0)[0]].name}`]);
    else if (ch.test && bad.morale < 0) out.push([dk, 'Morale']); }
  return out.length ? out : null;
}
const h5 = v => Math.sign(v) * Math.max(5, Math.round(Math.abs(v) / 10) * 5);   // half a figure, in steps of 5 (the odds go in fives)
LF.odds = function (s, test, c) {
  const parts = []; let p = test.base;
  for (const m of test.mods || []) {
    let v = 0, label = typeof m.label === 'function' ? m.label(s, c) : m.label;   // a label may name whoever holds a seat
    // An office named on the card counts only through the officer sent in person (Lachlan, 2026-11-19): LF.attachMods, js/people.js.
    if (m.k === 'role') continue;
    if (m.k === 'machine') { const mm = s.machines[m.id], n = LF.MACHINES[m.id].name;
      // The laboratory stands in for the autodoc wherever a card needs an assay: half its weight, never a penalty.
      if (m.id === 'medbay' && (mm.lost || (mm.up && !test.aboard)) && LF.has(s, 'lab')) { v = h5(m.v); label = 'The laboratory, in the autodoc\'s place'; }
      else if (mm.lost) { v = -m.v; label = `${n} lost`; } else if (mm.up && !test.aboard) { v = -h5(m.v); label = `${n} still aboard the ship`; } else if (mm.hp < 50) { v = h5(m.v); label = `${n}, worn`; } else { v = m.v; label = `${n} online`; } }
    else if (m.k === 'flag') { if (s.flags[m.flag]) v = m.v; }
    else if (m.k === 'if') { if (m.fn(s, c)) v = m.v; }
    else if (m.k === 'trait') { const x = P(s, m.role); if (x && x.trait === m.trait && LF.attached && LF.attached(s).includes(x)) { v = m.v; label = `${x.first} is ${m.trait}`; } }   // only the officer sent
    if (v) { parts.push({ label, v }); p += v; }
  }
  for (const q of LF.buildMods(s, test)) { parts.push(q); p += q.v; }
  return { p: clamp(Math.round(p), 5, 95), raw: Math.round(p), base: test.base, parts };
};
/* Buildings that help a kind of work (WO-3, DESIGN.md "Buildings"). One place in the odds for every card, hand-written or
   generated: the work a test is (its kind, else its approach, else the offices it names) against what stands. A test
   aboard the ship, or before landfall, gets none of it. */
LF.BUILD_WORK = [['lab', 'research', 10, 'The laboratory'], ['machineshop', 'fix', 10, 'The machine shop'], ['watch', 'fight', 10, 'The watchtowers'], ['hall', 'talk', 5, 'The meeting hall']];
const BW_ROLE = { research: ['xenobio', 'geologist', 'scientist', 'physician', 'doctor'], fix: ['engineer'], fight: ['security'], talk: ['command', 'teacher', 'chaplain'] };
const BW_AP = { study: 'research', exploit: 'fix', force: 'fight', accord: 'talk' };
const BW_MACH = ['reactor', 'reclaimer', 'fabricator', 'hydroponics'];
/* The kinds of work a test is: its kind, else its approach, else the offices and machines it names. */
LF.workKinds = function (test) { const k = [].concat(test.kind || []);
  if (!k.length) { if (BW_AP[test.ap]) k.push(BW_AP[test.ap]);
    for (const m of test.mods || []) { if (m.k === 'role') { for (const w in BW_ROLE) if (BW_ROLE[w].includes(m.role)) k.push(w); } else if (m.k === 'machine' && BW_MACH.includes(m.id)) k.push('fix'); } }
  return k; };
LF.buildMods = function (s, test) {
  if (!s.world || !s.built || test.aboard || s.adrift || (LF.aloft && LF.aloft(s))) return [];
  const k = LF.workKinds(test);
  // a building the card already counts in its own mods (same label), or one the card names in test.nobuild (it can only be
  // there when the building stands, so the line would always be on), is not counted again (2026-11-21)
  const own = new Set((test.mods || []).map(m => typeof m.label === 'string' ? m.label : null).filter(Boolean)), skip = test.nobuild || [];
  return LF.BUILD_WORK.filter(b => k.includes(b[1]) && LF.has(s, b[0]) && !own.has(b[3]) && !skip.includes(b[0])).map(b => ({ label: b[3], v: b[2] }));
};
const ARC_PERK = { crops: 'observer', machines: 'fixer', fever: 'medic', politics: 'speaker', flare: 'survivor', winter: 'survivor', storm: 'survivor', builders: 'touched', hive: 'speaker', others: 'speaker', understory: 'observer', sleepers: 'pathfinder' };
const RES = { food: 'food', mat: 'materials', parts: 'spare parts' };
/* An amount a player can weigh against the stores line on the card and the stock bar: plain counts, in the same
   units the bar shows. */
LF.amount = function (s, k, v, before) {
  const sg = v > 0 ? '+' : '−', a = Math.abs(v), held = before === undefined ? s.res[k] : before;
  const name = { food: 'food', mat: 'materials', parts: 'spare parts' }[k] || k, n = Math.max(1, Math.round(a));
  if (v < 0 && a >= held) return `all the ${name} (${LF.num(held)})`;
  return `${sg}${LF.num(n)} ${k === 'parts' && n === 1 ? 'spare part' : name}`;
};
LF.moraleWord = v => v >= 5 ? 'Morale lifts a good deal' : v > 0 ? 'Morale lifts a little' : v <= -5 ? 'Morale sinks badly' : 'Morale sinks a little';
const MARK = { convict: 'dug latrines for stealing from the common store', hero: 'went into the reactor loop with a welding torch', touched: 'touched the spire', slighted: 'you passed over', spared: 'you let off with a warning' };
LF.TAGS = {};
LF.choose = function (s, i) {
  if (s.cur.gen) return LF.chooseGen(s, i);
  const st = LF.byId[s.cur.id], c = s.cur.ctx, ch = st.choices[i], before = LF.beforePick ? LF.beforePick(s) : null;
  // A pick card answered through LF.choose (the headless tools do): that option and the first others, confirmed.
  if (st.pick) { s.cur.picked = [i]; for (const o of LF.choices(s)) if (s.cur.picked.length < st.pick && !o.lock && !s.cur.picked.includes(o.i)) s.cur.picked.push(o.i); return LF.pickConfirm(s); }
  const lbl = typeof ch.label === 'function' ? ch.label(s, c) : ch.label;
  const chips = [];
  const cost = (LF.choices(s).find(o => o.i === i) || {}).cost;
  if (LF.fitAttach) LF.fitAttach(s, ch);   // whoever was marked but can't do this option's work stays behind (people.js)
  if (cost) for (const k in cost) { const b = s.res[k]; s.res[k] = Math.max(0, s.res[k] - cost[k]); chips.push({ t: LF.amount(s, k, -cost[k], b), good: false }); }
  let o, res = { label: lbl };
  if (ch.test) {
    const od = LF.withAttach(s, LF.odds(s, ch.test, c), null, null, ch.test, c), roll = Math.floor(LF.rand(s) * 100);
    res.p = od.p; res.success = roll < od.p; o = res.success ? ch.ok : ch.bad;
  } else o = ch.out;
  // Text is rendered before effects, so "X goes in" still names X when the effect kills them.
  res.text = typeof o.text === 'function' ? o.text(s, c) : o.text;
  let fx = typeof o.fx === 'function' ? o.fx(s, c) : o.fx;
  // a choice marked fly: n takes the lander up whatever comes of it: the flights are spent unless the outcome already spends them
  if (ch.fly && !(fx && fx.fly)) fx = Object.assign({}, fx || {}, { fly: ch.fly });
  if (ch.dark && LF.numb) fx = LF.numb(s, fx);   // a colony that has done such things before minds the next one less (content-limits.js)
  res.text = LF.tollText(s, res.text, fx);       // past LF.SCALE the dead are more than the words say
  LF.apply(s, fx, chips, c);
  // Only a dangerous failure can hurt the people sent: a crisis, or one that costs lives. A month of readings that ends
  // in an argument about calibration kills nobody.
  const risky = st.tone === 'crisis' || !!ch.risky || !!(fx && ((fx.pop || 0) < 0 || fx.dead || fx.kill));
  if (ch.test && !s.adrift) LF.afterTest(s, { success: res.success, title: st.title, ap: null, f: null, crisis: st.tone === 'crisis', perk: ARC_PERK[st.arc], safe: !risky, work: LF.workOf(null, ch.test, ch.send, ch.kind) }, chips);
  if (ch.send) LF.sendAway(s, { n: ch.send.n, days: LF.ri(s, ch.send.days[0], ch.send.days[1]), danger: ch.send.danger, to: ch.send.to, ret: ch.send.ret, fid: null, with: LF.attached(s).map(p => p.id) }, (t, good) => chips.push({ t, good }));
  if (LF.officerAfter) LF.officerAfter(s, { crisis: st.tone === 'crisis', dark: !!ch.dark, ok: ch.test ? res.success : null, sent: (s.cur.attach || []).slice(), dead: chips.some(c => / dead$/.test(c.t)), world: s.cur.view === 'world' }, chips);
  res.chips = chips; res.remember = !!(fx && (fx.flags || fx.sched || fx.mark));
  LF.notice(s, res.text);
  s.memo[st.id] = { i, k: ch.key || null, ok: ch.test ? res.success : null, d: s.day };
  if (st.thread && LF.T && LF.T(s, st.thread)) LF.T(s, st.thread).last = { title: st.title, label: lbl, d: s.day };
  s.last = { title: st.title, label: lbl, fid: null, ok: ch.test ? res.success : null, dead: chips.some(c => / dead$/.test(c.t)), tone: st.tone };
  const then = typeof o.then === 'function' ? o.then(s, c) : o.then;
  res.then = then || (st.chain || st.arc === 'after' ? null : LF.aftermath(s)) || null;
  s.cur.phase = 'result'; s.cur.result = res;
  if (st.after) st.after(s, c);
  const tags = ((LF.TAGS[st.id] || [])[i] || '').split(' ').filter(Boolean);
  LF.shiftValues(s, tags);
  LF.record(s, { t: st.title, v: tags, ok: ch.test ? res.success : null });
  LF.log(s, `${st.title}: ${lbl}.`, 'event');
  LF.habit(s, st, i);
  if (LF.picked) LF.picked(s, { id: st.id, i, res, ch, before });
  if (st.preflight && s.flight) LF.flightNext(s); else LF.holdForFlight(s);
};
/* A card that asks for several of its options at once (st.pick: how many): the six officers, three seats. The player
   marks options (LF.pickToggle) and confirms (LF.pickConfirm), which runs st.confirm(s, ctx, picked) for the outcome. */
LF.pickToggle = function (s, i) { const c = s.cur, st = c && !c.gen && LF.byId[c.id]; if (!st || !st.pick || c.phase !== 'choose') return;
  c.picked = c.picked || []; const k = c.picked.indexOf(i);
  if (k >= 0) c.picked.splice(k, 1); else if (c.picked.length < st.pick && LF.choices(s).some(o => o.i === i && !o.lock)) c.picked.push(i); };
LF.pickConfirm = function (s) { const c = s.cur, st = c && !c.gen && LF.byId[c.id]; if (!st || !st.pick || c.phase !== 'choose' || (c.picked || []).length !== st.pick) return false;
  const before = LF.beforePick ? LF.beforePick(s) : null;
  const o = st.confirm(s, c.ctx, c.picked.slice().sort((a, b) => a - b)), chips = [], res = { label: o.label, text: o.text };
  LF.apply(s, o.fx, chips, c.ctx); res.chips = chips; res.remember = false; res.then = o.then || null;
  LF.notice(s, res.text); s.memo[st.id] = { i: c.picked[0], k: null, ok: null, d: s.day, picked: c.picked.slice() };
  s.last = { title: st.title, label: o.label, fid: null, ok: null, dead: false, tone: st.tone };
  c.phase = 'result'; c.result = res; LF.log(s, `${st.title}: ${o.label}.`, 'event');
  if (LF.picked) LF.picked(s, { id: st.id, i: c.picked[0], res, ch: null, before, picked: c.picked });
  LF.holdForFlight(s); return true; };
/* A lander run, told in order (Lachlan, 2026-11-16): every flight has one seat that is not for a sleeper and one cargo
   cradle. Who takes the seat (seat.down) and what rides in the cradle (ship.cargo) are asked before the flight, and the
   card that launched it is held back; when both are answered it comes back with the landing, the officer and the system
   in one outcome. Neither pick costs a month. Called whenever a card lands in its result phase. */
LF.holdForFlight = function (s) {
  const c = s.cur; if (!c || c.phase !== 'result' || s.flight) return false;
  if ((s.flags.woken || 0) <= (s.flights || 0)) return false;
  s.flights = s.flags.woken || 0;
  const q = []; if (LF.byId['seat.down'] && LF.inOrbit(s).some(p => !p.stranded)) q.push('seat.down'); if (LF.byId['ship.cargo'] && LF.aboard(s).length) q.push('ship.cargo');
  if (!q.length) return false;
  s.flight = { held: c, q: q.slice(1), text: [], chips: [], orbit0: LF.inOrbit(s).map(p => p.id), sys0: LF.aboard(s).slice() };
  s.cur = null; LF.fire(s, q[0]); s.dilemmas--; return true;
};
/* A pre-flight pick is answered: its outcome is kept for the landing, and the next pick or the held card comes up. */
LF.flightNext = function (s) {
  const F = s.flight, r = s.cur && s.cur.result; if (!F) return;
  if (r) { if (r.text) F.text.push(r.text); F.chips.push(...(r.chips || [])); }
  s.cur = null;
  if (F.q.length) { const id = F.q.shift(); LF.fire(s, id); s.dilemmas--; return; }
  const c = F.held; s.flight = null;
  c.result.text = [c.result.text].concat(F.text).filter(Boolean).join('\n\n'); c.result.chips = (c.result.chips || []).concat(F.chips);
  if (c.result.label === undefined) c.result.label = '';
  // What came down, for the landing's picture (Lachlan, 2026-11-16): an officer first, then a system, then colonists.
  const off = (F.orbit0 || []).map(id => LF.h.byPid(s, id)).find(p => p && p.alive && !p.orbit), sys = (F.sys0 || []).find(id => !LF.aboard(s).includes(id));
  c.down = { pid: off ? off.id : null, key: off ? off.key || null : null, sys: sys || null, people: c.build === 'shuttle' || (c.result.chips || []).some(x => /colonists|sleepers wake|More hands/.test(x.t)) };
  c.landed = true; s.cur = c;
};
/* Accepting an outcome. Most return the player to the settlement; some demand an answer at once (result.then).
   Side cards (a party's return, a finished build, the council) do not use up the next dilemma. */
LF.dismiss = function (s) {
  const c = s.cur, then = c && c.result && c.result.then;
  // A launch ordered from the Ship view (js/orders.js) told its landing over the month's card: the month's card comes back.
  if (c && c.id === 'launch') { s.cur = s.heldCur || null; s.heldCur = null; return; }
  if (c && c.sig) s.sigs[c.sig] = 1;
  if (c && c.id !== 'recap' && s.recap) s.recap.n++;
  s.cur = null;
  if (c && c.side) s.nextDilemma = Math.max(s.nextDilemma, s.day + 4); else s.nextDilemma = s.day + LF.ri(s, 17, 29);
  if (then === 'plan') { if (!s.project) LF.firePlan(s); }
  else if (then && LF.byId[then] && open(s, LF.byId[then], true)) LF.fire(s, then);
};
/* One turn: the days run until something needs the player. Returns how many passed. */
LF.advance = function (s, max) {
  const d0 = s.day; let n = 0;
  while (!s.adrift && !s.cur && !(s.over && !s.over.cont) && n++ < (max || 60)) { if (s.due) { LF.deal(s); if (s.cur) break; } LF.tick(s); }
  return s.day - d0;
};

LF.apply = function (s, fx, out, c) {
  if (!fx) return;
  const chip = (t, good) => out && out.push({ t, good });
  const sg = v => (v > 0 ? '+' : '−') + Math.abs(v);
  for (const k of ['food', 'mat', 'parts']) if (fx[k]) {
    // Food effects are written for the founding sixty and scale with the mouths involved.
    const v = k === 'food' ? Math.round(fx[k] * Math.max(1, LF.mouths(s) / 60) / 10) * 10 : fx[k];   // children are mouths too, at LF.KID_EATS each
    const b = s.res[k]; s.res[k] = Math.max(0, s.res[k] + v); chip(LF.amount(s, k, v, b), v > 0); }
  if (fx.morale) { s.morale = clamp(s.morale + fx.morale, 0, 100); chip(LF.moraleWord(fx.morale), fx.morale > 0); if (fx.morale < 0) s.tension += -fx.morale / 2; }
  // Losses are written for the founding colony and scale past it (LF.toll); fx.dead and fx.gone are exact counts.
  if (fx.pop) { if (fx.pop < 0) { const n = LF.toll(s, -fx.pop); LF.deaths(s, -fx.pop); chip(`${LF.num(n)} dead`, false); } else { s.pop += fx.pop; chip(`+${LF.num(fx.pop)} colonists`, true); } }
  if (fx.dead > 0) { LF.deaths(s, fx.dead, true); chip(`${LF.num(fx.dead)} dead`, false); }
  if (fx.leave) { const n = LF.toll(s, fx.leave); LF.leave(s, fx.leave); chip(`${LF.num(n)} leave the colony`, false); }
  if (fx.gone > 0) { LF.leave(s, fx.gone, true); chip(`${LF.num(fx.gone)} leave the colony`, false); }
  if (fx.sleepers) { const n = Math.max(-s.sleepers, fx.sleepers); s.sleepers += n; if (n) chip(`${sg(n)} sleepers`, n > 0); }
  if (fx.survey) { s.survey += fx.survey; chip('The map grows', true); }
  if (fx.yield) { s.yieldBonus += fx.yield; chip(`Crop yield ${fx.yield > 0 ? 'up' : 'down'}`, fx.yield > 0); }
  if (fx.fly) LF.fly(s, fx.fly, out);   // a flight of the lander: a tank of fuel, or food rendered into it
  if (fx.machine) for (const id in fx.machine) { const lost0 = s.machines[id].lost; if (s.machines[id].up && !fx.aboard) continue;   // a system still aboard is out of reach of what happens down here
    LF.hurt(s, id, fx.machine[id], fx.cap && fx.cap[id]);
    if (!lost0) chip(s.machines[id].lost ? `${LF.MACHINES[id].name} lost` : `${LF.MACHINES[id].name} ${fx.machine[id] > 0 ? 'restored' : 'damaged'}`, fx.machine[id] > 0); }
  if (fx.rations) { s.rations = fx.rations; chip(`Rations: ${LF.RATION_NAME[fx.rations] || fx.rations}`, fx.rations !== 'tight' && fx.rations !== 'half'); }
  if (fx.flags) Object.assign(s.flags, fx.flags);
  if (fx.poi && LF.addPoi) { const n = [].concat(fx.poi).filter(p => LF.addPoi(s, p)).length; if (n) chip(n > 1 ? 'Places marked on the map' : 'A place marked on the map', true); }   // a place for the World view (js/places.js)
  if (fx.kill) for (const k of [].concat(fx.kill)) { const p = LF.killPerson(s, k.who || k, k.cause || fx.cause); if (p) chip(`${p.name} dead`, false); }
  if (fx.depart) for (const k of [].concat(fx.depart)) { const p = LF.depart(s, k.who || k, k.cause); if (p) chip(`${p.name} gone`, false); }
  if (fx.mark) { const p = byPid(s, fx.mark[0]) || (LF.ROLES[fx.mark[0]] && P(s, fx.mark[0])); if (p) p.marks[fx.mark[1]] = { d: s.day, txt: fx.mark[2] || MARK[fx.mark[1]] || '' }; }
  if (fx.progress && s.project) { s.progress = Math.max(0, s.progress * (1 + fx.progress)); chip('Project set back', false); }
  if (fx.fops) for (const o of fx.fops) { const f = s.factors.find(x => x.id === o.id); if (!f || (f.res && !o.resolve)) continue;
    const t0 = f.threat, a0 = f.accord, i0 = f.insight;
    for (const k of ['threat', 'insight', 'accord', 'harm']) if (o[k]) f[k] = clamp(f[k] + (k === 'insight' && o[k] > 0 ? o[k] * (0.7 + 0.3 * LF.dept(s, 'scientist')) * (LF.has(s, 'lab') ? 1.33 : 1) * LF.edge(s, 'insight') : o[k]), k === 'accord' ? -100 : 0, 100);
    if (o.kills) f.kills += o.kills; if (o.wall) f.wall = 1;
    if (Math.abs(f.threat - t0) >= 5) chip(`${f.Name}: threat ${f.threat > t0 ? 'rising' : 'falling'}`, f.threat < t0);
    if (f.insight - i0 >= 5) chip(`${f.Name}: better understood`, true);
    if (Math.abs(f.accord - a0) >= 5 && f.kind !== 'plague') chip(`${f.Name}: relations ${f.accord > a0 ? 'warmer' : 'colder'}`, f.accord > a0);
    if (o.resolve) LF.resolve(s, f, o.resolve); }
  if (fx.start) { if (LF.yardStart) LF.yardStart(s, fx.start, 'card'); else { s.project = fx.start; s.progress = 0; } }   // a parked build resumes where it stopped (js/orders.js, the yard)
  if (fx.focus !== undefined) s.focus = fx.focus;
  if (fx.plan) s.nextPlan = s.day + fx.plan;
  if (fx.sched) for (const [id, a, b] of fx.sched) s.sched.push({ id, day: s.day + LF.ri(s, a, b) });
  if (fx.away) LF.sendAway(s, fx.away, chip);
  if (fx.awayOp) LF.awayOp(s, fx.awayOp, chip);
  if (fx.hook && LF.useHook) { LF.useHook(s, fx.hook); const hp = byPid(s, fx.hook); if (hp) chip(`${hp.name} will remember being leaned on`, false); }
  if (fx.chips) for (const c of fx.chips) chip(c[0], !!c[1]);   // an effect with no stock behind it (years, wear), said in the same place as the others
  // The Limits (content-limits.js), as plain data so a generated card can carry them: a stain [practice, weight],
  // people bonded, people harnessed (out of the count, into the yoke).
  if (fx.harness) { const n = Math.min(fx.exact ? fx.harness : LF.toll(s, fx.harness), Math.max(0, s.pop - 9)); s.pop -= n; s.flags.servitors = (s.flags.servitors || 0) + n; if (n) chip(`${LF.num(n)} colonist${n === 1 ? '' : 's'} harnessed`, false); }
  if (fx.thralls) s.flags.thralls = Math.max(0, (s.flags.thralls || 0) + fx.thralls);
  // A few deed names are also the Limits' own practices (the scapegoat card, the compound, the list): a deed done on
  // some other card is recorded under its own name so that it does not switch those on or off.
  if (fx.stain && LF.stain) LF.stain(s, { goat: 'scapegoat', bond: 'bonded', cull: 'culled' }[fx.stain[0]] || fx.stain[0], fx.stain[1]);
  if (fx.off && LF.shift) for (const [who, k, d] of fx.off) LF.shift(s, who === 'ctx' ? c && c.pid : who, k, d, out);   // an officer's health, nerve or closeness to this world (officers.js)
  if (fx.tension) s.tension = clamp(s.tension + fx.tension, 0, 100);
  if (fx.chron) LF.chron(s, typeof fx.chron === 'function' ? fx.chron(s, c) : fx.chron);
  if (fx.do) fx.do(s, c);
};
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* Landfall — places on the map (Tranche 2, T2-4, 2026-11-17; DESIGN.md "The four views", Places). No DOM: it runs
   under Node too, and it never rolls a die.
   One list of places, LF.pois(s): everything the World view can point at and, from T2-5, send a party to. Some are on
   the map by a read and nothing about them is copied into the save (the world's actors with a slot, the three
   signature peoples, the interior's leads, the colony's own settlements, the orbital report's features once the fog is
   off them). The rest are the colony's own record (s.pois, made on demand): a card's outcome marks one with
   fx.poi: { key, kind, name, dist, from, danger, state, known, off } (LF.addPoi), and a thread may define
   pois(s, t) returning its places as they stand ({ k, name, kind, dist, danger, state, known }), each keyed
   '<thread>.<k>'. The slot a thread's place gets, and the day it was first on the map, are kept in s.poiAt when the
   thread first shows it (LF.placesTick), so nothing moves once given.
   A place is { id, key, name, kind, slot, from, d, state, dist, danger, owner } and, as read here, also says what is
   known, who has been, how far in months and which way. state: rumoured, located, visited, worked out, gone.
   dist: near (one or two months there and back), far (three to five), long (six or more). Near and far places take
   the map's minor slots (a painted cairn where there is one), long ones the far slots at the edge of the view; a place
   further off than the map holds (off: true, or no slot left) is an arrow at the edge with its bearing.
   The fog is a list of walked circles (s.walked, LF.addWalk): round each place a party came back from and along the
   way there. T2-5 sends parties: LF.poiVisit(s, id, who) is the hook its return calls. */
(function () {
'use strict';
const LF = globalThis.LF, MONTH = LF.MONTH;
const hash = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const cap1 = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
const plan = s => s.world && LF.WORLD_PLAN && LF.WORLD_PLAN.maps[s.world.type];

/* What kind of place it is, in this world's words where the ground comes into it. */
LF.POI_KINDS = {
  wreck:  { n: 'a wreck' },
  crater: { n: 'a crater', w: { ice: 'a crater in the ice', drowned: 'a blast hole in the reef' } },
  spring: { n: 'a spring', w: { ice: 'a warm spring in the ice', drowned: 'a fresh-water seep', barren: 'a seep under the stones', ruin: 'a seep in the old stone' } },
  ridge:  { n: 'high ground', w: { ice: 'an ice ridge', drowned: 'a reef crest', barren: 'a basalt ridge', jungle: 'a rise above the canopy', garden: 'a chalk ridge', ruin: 'a terrace above the grid' } },
  ore:    { n: 'an ore body' },
  cave:   { n: 'a cave', w: { ice: 'an ice cave', drowned: 'a sea cave' } },
  ruin:   { n: 'a ruin' },
  growth: { n: 'thick growth', w: { barren: 'a crust field', ruin: 'a moss bank', ice: 'a bed of red weed', drowned: 'a wrack bed', jungle: 'a thicket', garden: 'a thicket' } },
  herd:   { n: 'grazing ground', w: { drowned: 'shoal water', ice: 'a feeding ground on the ice' } },
  camp:   { n: 'a camp' },
  signal: { n: 'a signal' },
  track:  { n: 'a track', w: { ice: 'a track in the snow', drowned: 'a trail over the flats', barren: 'a track in the dust' } },
  mark:   { n: 'a marked spot' },
  town:   { n: 'a settlement of the colony\'s' },
};
LF.poiWord = (s, kind) => { const K = LF.POI_KINDS[kind] || LF.POI_KINDS.mark; return (K.w && s.world && K.w[s.world.type]) || K.n; };
LF.POI_STATES = ['rumoured', 'located', 'visited', 'worked out', 'gone'];
const rank = st => LF.POI_STATES.indexOf(st);
LF.poiDanger = n => ['Quiet ground', 'Little danger', 'Some danger', 'Dangerous', 'Very dangerous', 'Deadly'][clamp(Math.round(n || 0), 0, 5)];
const BAND = { near: [1, 2], far: [3, 5], long: [6, 12] };
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

/* ---------- slots ---------- */
const colAt = (s, P) => { const site = LF.mapSlots ? LF.mapSlots(s).site : null; return P.colony[site] || P.colony.wet || P.colony.dry; };
const slotXY = (P, name) => { if (!name) return null; const L = { M: P.major, m: P.minor, T: P.town || [], f: P.far || [] }[name[0]]; return L && L[+name.slice(1) - 1] || null; };
LF.poiSlotXY = (s, name) => { const P = plan(s); return P ? slotXY(P, name) : null; };
/* Every slot a place of the colony's own holds, and how many leads the interior had shown when it was given. The
   leads (js/worldmap.js LF.mapSlots) step round a place given before them, so neither ever moves. */
LF.placeSlots = function (s) {
  const out = [];
  for (const p of s.pois || []) if (p.slot) out.push({ slot: p.slot, nl: p.nl || 0 });
  for (const k in s.poiAt || {}) if (s.poiAt[k].slot) out.push({ slot: s.poiAt[k].slot, nl: s.poiAt[k].nl || 0 });
  return out;
};
const leadsSeen = s => { const land = s.factors.find(F => F.kind === 'land'); return land ? Object.keys(land.seen || {}).length : 0; };
function assign(s, key, dist, off) {
  const P = plan(s); if (!P || off || !LF.mapSlots) return null;
  const A = LF.mapSlots(s), used = new Set(Object.values(A.at).concat(LF.placeSlots(s).map(x => x.slot)));
  if (LF.stlOnMap) for (const t of LF.stlOnMap(s)) used.add(t.slot);
  const c = colAt(s, P), far = (P.far || []).map((f, i) => ['f' + (i + 1), f]).filter(([n]) => !used.has(n));
  const minor = P.minor.map((m, i) => ['m' + (i + 1), m]).filter(([n]) => !used.has(n));
  const d = m => Math.hypot(m.x - c.x, m.y - c.y);
  if (dist === 'long') return far.length ? far.sort((a, b) => hash(key + ':' + s.seed + ':' + a[0]) - hash(key + ':' + s.seed + ':' + b[0]))[0][0] : null;
  const score = ([, m]) => (dist === 'near' ? d(m) : -d(m)) + (m.paint ? 0 : 160);
  return minor.length ? minor.sort((a, b) => score(a) - score(b))[0][0] : far.length ? far[0][0] : null;
}

/* ---------- the colony's own record ---------- */
/* Mark a place (fx.poi, a party's find, a survey). Returns the place if it is new or better known than it was. */
LF.addPoi = function (s, p, from) {
  if (!p || !p.key || !s.world) return null;
  s.pois = s.pois || [];
  const old = s.pois.find(x => x.key === p.key), st = p.state || 'located';
  if (old) { if (rank(st) > rank(old.state)) { old.state = st; return old; } return null; }
  const c = s.cur, st0 = c && LF.byId[c.id], src = from || p.from || (c ? { k: c.away ? 'party' : 'card', id: c.id || null, t: c.title || (st0 && typeof st0.title === 'string' ? st0.title : '') } : { k: 'record' });
  const e = { id: p.key, key: p.key, name: p.name, kind: p.kind || 'mark', slot: assign(s, p.key, p.dist || 'near', p.off), from: Object.assign({ d: s.day }, src),
    d: s.day, state: st, dist: p.dist || 'near', danger: p.danger || 0, owner: p.owner || null, nl: leadsSeen(s) };
  if (p.known) e.known = p.known; if (p.off) e.off = true;
  s.pois.push(e);
  if (st === 'visited') walkTo(s, e);
  return e;
};
/* The card that showed a place, for "how it came to be known". */
const fromCard = (s, id, d) => { const st = id && LF.byId[id]; if (!st) return null; const t = typeof st.title === 'function' ? '' : st.title; return t ? { k: 'card', id, t, d } : null; };
/* A thread's places, as they stand: what pois(s, t) returns, with the slot and the day kept in s.poiAt. */
function threadPlaces(s) {
  const out = [];
  for (const id in s.threads || {}) { const d = LF.THREADS[id], t = s.threads[id]; if (!d || !d.pois || !t) continue;
    let list = []; try { list = d.pois(s, t) || []; } catch (e) { if (LF.DEBUG) throw e; list = []; }
    for (const p of list) { if (!p) continue; const key = id + '.' + p.k, at = (s.poiAt || {})[key];
      out.push(Object.assign({ id: key, key, owner: id, kind: 'mark', dist: 'near', danger: 0, state: 'located' }, p, { slot: at ? at.slot : null, d: at ? at.d : s.day, seen: !!at,
        from: fromCard(s, p.card, at ? at.d : s.day) || { k: 'thread', t: (d.called && d.called(s, t)) || 'what the colony has seen', d: at ? at.d : s.day }, st: at && at.st })); } }
  return out;
}
/* Called every tick (wrapped round LF.threadTick below): a thread's new place gets its slot and its day. */
LF.placesTick = function (s) {
  if (!s.world || s.adrift || (LF.aloft && LF.aloft(s))) return;
  if (!s.flags.finds_seeded && LF.seedFinds) LF.seedFinds(s);
  if (LF.huntTick) LF.huntTick(s);
  for (const p of threadPlaces(s)) if (!p.seen) { s.poiAt = s.poiAt || {}; s.poiAt[p.key] = { slot: assign(s, p.key, p.dist, p.off), d: s.day, nl: leadsSeen(s) }; }
};
const tick0 = LF.threadTick;
LF.threadTick = function (s) { const r = tick0 ? tick0(s) : undefined; LF.placesTick(s); return r; };
/* The colony's own places with their slots: what js/worldmap.js draws over the read ones. */
LF.poiOwn = function (s) {
  const out = (s.pois || []).map(p => Object.assign({}, p));
  for (const p of threadPlaces(s)) if (p.seen) out.push(p);
  for (const p of out) { const b = (s.been || {})[p.key], st = p.st || p.state;
    p.state = b && rank(st) < rank('visited') ? 'visited' : rank(p.st || '') > rank(p.state) ? p.st : p.state; }
  return out;
};

/* ---------- walked ground ---------- */
/* The fog is a list of circles (s.walked, at most 40): round each place a party came back from and along its way.
   A circle inside another is dropped; past forty the two whose merging adds least are merged. */
LF.WALKED_MAX = 40;
LF.addWalk = function (s, x, y, r) {
  const W = s.walked = s.walked || []; x = Math.round(x); y = Math.round(y); r = Math.round(r);
  if (W.some(c => Math.hypot(c[0] - x, c[1] - y) + r <= c[2] * 1.05)) return;
  for (let i = W.length - 1; i >= 0; i--) if (Math.hypot(W[i][0] - x, W[i][1] - y) + W[i][2] <= r * 1.05) W.splice(i, 1);
  W.push([x, y, r]);
  const join = (a, b) => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d + b[2] <= a[2]) return a; if (d + a[2] <= b[2]) return b;
    const R = (d + a[2] + b[2]) / 2, t = (R - a[2]) / (d || 1); return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(R)]; };
  while (W.length > LF.WALKED_MAX) { let best = null;
    for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { const m = join(W[i], W[j]), cost = m[2] - Math.max(W[i][2], W[j][2]); if (!best || cost < best[0]) best = [cost, i, j, m]; }
    W.splice(best[2], 1); W.splice(best[1], 1, best[3]); }
};
/* The ground between the colony and somewhere a party went: a circle at the place and smaller ones along the way. */
function walkLine(s, x, y, r) {
  const P = plan(s); if (!P || !s.world.zone) return; const c = colAt(s, P), k = P.view[2] / 360, L = Math.hypot(x - c.x, y - c.y), n = Math.floor(L / (60 * k));
  for (let i = 1; i <= n; i++) LF.addWalk(s, c.x + (x - c.x) * i / (n + 1), c.y + (y - c.y) * i / (n + 1), 18 * k);
  LF.addWalk(s, x, y, r || 34 * k);
}
function walkTo(s, p) { const xy = LF.poiSlotXY(s, p.slot); if (xy) walkLine(s, xy.x, xy.y); }

/* Someone has been there: a party came home from it (T2-5 calls this from the return; a card party's return is
   wrapped below). who: words for the list, "a party of five under Ama Osei". */
LF.poiVisit = function (s, id, who, xy) {
  if (!id) return; s.been = s.been || {}; const b = s.been[id] = s.been[id] || [];
  b.push({ d: s.day, t: who || 'A party' }); if (b.length > 4) b.shift();
  const own = (s.pois || []).find(p => p.key === id); if (own && rank(own.state) < rank('visited')) own.state = 'visited';
  const at = (s.poiAt || {})[id]; if (at && rank(at.st || '') < rank('visited')) at.st = 'visited';
  const pt = xy || (own && LF.poiSlotXY(s, own.slot)) || (at && LF.poiSlotXY(s, at.slot));
  if (pt) walkLine(s, pt.x, pt.y);
};
/* A card's party coming home (js/gen.js LF.awayReturn): the place it went is visited, and the way there walked.
   A party that has not come back (no word) is still out, and nothing is marked. */
const ret0 = LF.awayReturn;
LF.awayReturn = function (s, a, forced) {
  const goal = LF.partyGoal ? LF.partyGoal(s, a) : null, P0 = LF.party ? LF.party(s, a) : null;
  const r = ret0(s, a, forced);
  if (goal && !s.away.includes(a)) LF.poiVisit(s, goal.key, P0 ? cap1(P0.who.replace(/^(\d+) led by/, (m, n) => `a party of ${NUMW[n] || n} under`).replace(/^(\d+) people$/, (m, n) => `a party of ${NUMW[n] || n}`)) : 'A party', goal);
  if (goal && !s.away.includes(a) && a.n > 0 && a.ret !== 'astray' && a.ret !== 'recalled') LF.findAt(s, goal.key, s.cur && s.cur.away && s.cur.result ? s.cur.result.chips : null);
  return r;
};

/* ---------- finds (2026-11-18, Lachlan: "a reason to explore proactively") ----------
   Some things the colony needs are out in the country, and orbit only says where to look. A party has to reach the
   place and come home (any return but astray or recalled, with someone left to tell it): then s.flags[flag] is set.
   Three open a build in the yard: an ore body the smelter, high ground with a steady wind the turbine field, a spring
   or seep the wells. Two pay for the finding: wild stock from thick growth (+10 on the wheat card, crops.adapt, while
   it is still to come) and a hunting ground (food every month, and every month a kill on whatever animal the colony
   knows of, which the Grudge counts: js/thread-deathworld.js reads f.kills). The orbital report's three leads for the
   builds are marked at landfall (LF.seedFinds, from placesTick, so an old save gets them too); a survey party or a
   card can turn up others of the same kind, and any of them will do. A factor's own place (an animal's ground, a camp)
   is that factor's, not a find. Cards that set a flag outright (the flyover on plan.prospect, the drummers' treaty,
   the highland turbines, the deep site's spring) still count. */
LF.FINDS = {
  ore:   { kinds: ['ore'], flag: 'ore_found', build: 'smelter', tag: 'For the smelter', got: 'Ore found: the smelter can be built',
    log: 'Ore, on the ground and in the sample bags. The smelter can go on the yard\'s list.', chron: 'Ore was found at {p}.',
    say: 'The smelter waits on this. Any party that gets there and comes home opens it in the yard, and the machine shop and turbines after it.' },
  wind:  { kinds: ['ridge'], flag: 'wind_found', build: 'turbines', tag: 'For the turbines', got: 'A site for the turbine field',
    log: 'High ground with a steady wind on it, walked and measured. The turbine field has somewhere to stand.', chron: 'A site for the turbines was walked at {p}.',
    say: 'The turbine field waits on this. Any party that gets there and comes home with the wind measured opens it in the yard, once the smelter stands.' },
  water: { kinds: ['spring'], flag: 'water_found', build: 'wells', tag: 'For the wells', got: 'Water found: the wells can be dug',
    log: 'Water under the ground, found and tasted, and a line drawn from it to the camp. The wells can go on the yard\'s list.', chron: 'Water was found at {p}, and the wells could be dug.',
    say: 'The wells wait on this. Any party that gets there and comes home with the water traced opens them in the yard.' },
  stock: { kinds: ['growth'], flag: 'wild_stock', tag: 'Seed stock', got: 'Wild stock for the seed bench', need: s => !s.flags.crops_adapted,
    log: 'Seed and cuttings of what grows wild out there, on the bench beside the Earth wheat. The botanists have something to cross it with.', chron: 'Wild stock was brought in from {p} for the wheat.',
    say: 'What grows here might give the wheat what it lacks. A party that brings seed home from it makes the wheat card likelier to come right.' },
  hunt:  { kinds: ['herd'], flag: 'hunt_ground', tag: 'Hunting ground', got: 'A hunting ground: food every month',
    log: 'The party knows where the herds water and when. A crew can hunt it every month from now on.', chron: 'The colony began to hunt {p}.',
    say: 'Once a party has learned it, a crew can hunt it every month for meat. Hunting is killing, and what lives here may keep count.' },
};
const FACTOR_OWN = { fauna: 1, flora: 1, ruin: 1, natives: 1, humans: 1, plague: 1 };
LF.found = (s, k) => !!(LF.FINDS[k] && s.flags[LF.FINDS[k].flag]);
/* The find a place could give that the colony still needs, or null. */
LF.findOf = (s, p) => { if (!p || p.state === 'gone' || p.owner === 'colony' || FACTOR_OWN[p.owner]) return null;
  for (const k in LF.FINDS) { const F = LF.FINDS[k]; if (F.kinds.includes(p.kind) && !LF.found(s, k) && (!F.need || F.need(s))) return k; } return null; };
/* What the yard says while a build waits on a find. */
const WHY = { ore: ['ore found on the ground', 'the ore'], wind: ['a windy site walked first', 'the high ground'], water: ['water found and traced first', 'the spring'] };
LF.findWhy = (s, k) => { const F = LF.FINDS[k], n = LF.pois(s).some(p => F.kinds.includes(p.kind) && LF.findOf(s, p) === k);
  return `Needs ${WHY[k][0]}: send a party to ${n ? WHY[k][1] + ' on the World map' : 'look for some'}`; };
LF.findAt = function (s, key, chips) {
  const p = LF.poi(s, key), k = LF.findOf(s, p); if (!k) return null; const F = LF.FINDS[k];
  s.flags[F.flag] = s.day || 1; if (chips) chips.push({ t: F.got, good: true });
  LF.log(s, F.log, 'good'); if (LF.chron) LF.chron(s, F.chron.replace('{p}', p.name.replace(/^The /, 'the ')));
  return k;
};
/* A dread's or a thread's place, while the thread is open and nobody has been: a party there brings back evidence
   (each thread's visit hook, js/orders.js LF.threadVisit). The tile says so, under the colony's name for it. */
LF.placeThread = (s, p) => { if (!p || !p.owner || !s.threads || !s.threads[p.owner] || !LF.THREADS[p.owner] || !p.id.startsWith(p.owner + '.')) return null;
  const d = LF.THREADS[p.owner], t = s.threads[p.owner]; if (t.end || t.res || ['visited', 'worked out', 'gone'].includes(p.state) || (p.been && p.been.length)) return null;
  let n = ''; try { n = d.called ? d.called(s, t) || '' : ''; } catch (e) { n = ''; }
  return { id: p.owner, dread: !!d.dread, name: n }; };
/* The hunting ground, once a month: meat (less in the Dim), and a kill on the animal the colony knows best. */
LF.huntTick = function (s) {
  if (!s.flags.hunt_ground || s.day % MONTH) return;
  s.res.food += Math.round(LF.mouths(s) * MONTH * 0.06 * (LF.date(s.day).season === 3 ? 0.5 : 1));
  const f = s.factors.find(x => x.kind === 'fauna' && x.stage > 0 && !x.res); if (f) f.kills = (f.kills || 0) + 1;
};
const ORE_LEAD = { near: ['near', 'located', 1], hills: ['far', 'located', 2], far: ['long', 'rumoured', 3] };
const orbit = { k: 'orbit', t: 'the orbital report', d: 0 };
LF.seedFinds = function (s) {
  if (s.flags.finds_seeded || !s.world || !s.world.report) return; s.flags.finds_seeded = true;
  if (s.built.turbines) s.flags.wind_found = s.flags.wind_found || s.day;   // a save from before: what stands was sited
  if (s.built.smelter) s.flags.ore_found = s.flags.ore_found || s.day;
  if (s.built.wells) s.flags.water_found = s.flags.water_found || s.day;
  const R = s.world.report, [od, ost, odg] = ORE_LEAD[s.world.oreBody] || ORE_LEAD.hills, near = s.flags.site_highland && od === 'far';
  if (!LF.found(s, 'ore')) LF.addPoi(s, { key: 'find.ore', kind: 'ore', name: 'The ore signature', dist: near ? 'near' : od, state: ost, danger: near ? 1 : odg,
    known: `The orbital report: "${R.ore ? R.ore.text : 'Metal, somewhere.'}" Somebody has to stand on it with a hammer before the smelter can be built.` }, orbit);
  const h = hash('wind:' + s.seed), wd = s.flags.site_highland || h % 3 === 0 ? 'near' : 'far', word = cap1(LF.poiWord(s, 'ridge').replace(/^(a|an) /, ''));
  if (!LF.found(s, 'wind')) LF.addPoi(s, { key: 'find.wind', kind: 'ridge', name: `${word} to windward`, dist: wd, state: 'located', danger: 1 + (h >>> 3) % 2,
    known: 'The orbital wind maps put the steadiest wind in the country here. The turbine field needs ground like it, and a party to walk it and measure first.' }, orbit);
  const dry = s.world.truth.water < 20, sw = cap1(LF.poiWord(s, 'spring').replace(/^(a|an) /, ''));
  if (!LF.found(s, 'water')) LF.addPoi(s, { key: 'find.water', kind: 'spring', name: dry ? `The deep ${sw.toLowerCase()}` : `${sw} upstream`, dist: dry ? 'far' : 'near', state: dry ? 'rumoured' : 'located', danger: dry ? 2 : 1,
    known: `The orbital report: "${R.water || 'Water, somewhere.'}" The infrared shows a cold line in the ground here. Somebody has to find where it comes up and trace it home before a well is sunk.` }, orbit);
};

/* ---------- a survey party (orders.js order.survey, T2-5) ----------
   Three to five people walk the country on a bearing with no goal: the fog goes back a ring that way, and they turn up
   one to three places nobody has been to, seen from a distance (rumoured). Seeded by the party, never a die. */
const SURVEY_KINDS = ['spring', 'ridge', 'wreck', 'ore', 'cave', 'growth', 'herd', 'crater', 'track', 'ridge', 'growth', 'camp'];
LF.surveyBearing = (s, i) => COMPASS[((i % 8) + 8) % 8];
LF.surveyWalk = function (s, dir) {
  const P = plan(s); if (!P || !s.world.zone) return; const c = colAt(s, P), k = P.view[2] / 360;
  const R = Math.min(150, 46 + (s.survey || 0) * 0.7 + 18) * k + 28 * k;
  for (const off of [-0.5, 0, 0.5]) { const ang = (dir + off) * Math.PI / 4;
    LF.addWalk(s, c.x + Math.sin(ang) * R, c.y - Math.cos(ang) * R, (off ? 30 : 40) * k); }
};
LF.surveyFind = function (s, a, frac) {
  const dir = a.bear || 0; LF.surveyWalk(s, dir);
  const h = hash(a.id + ':' + s.seed), n = frac < 0.6 ? 1 : 1 + h % 3, found = [];
  for (let i = 0; i < n; i++) { const x = hash(a.id + ':' + i + ':' + s.seed), kind = SURVEY_KINDS[x % SURVEY_KINDS.length], d = LF.surveyBearing(s, dir + [0, 1, -1][i]);
    let name = `${cap1(LF.poiWord(s, kind))} to the ${d}`;
    if ((s.pois || []).some(p => p.name === name)) name = `${cap1(LF.poiWord(s, kind))} far to the ${d}`;
    const e = LF.addPoi(s, { key: `svy.${a.id}.${i}`, kind, name, dist: i === 0 || x % 3 === 0 ? 'near' : 'far', state: 'rumoured', danger: 1 + (x >>> 4) % 3,
      known: 'The survey party saw it from a distance, off their line, and did not go closer.' }, { k: 'survey', t: 'a survey party' });
    if (e) found.push(e.name.charAt(0).toLowerCase() + e.name.slice(1)); }
  return found.length ? ` On the way they marked ${found.length === 1 ? 'a place' : `${NUMW[found.length]} places`} nobody has been to: ${found.length > 1 ? found.slice(0, -1).join(', ') + ' and ' + found[found.length - 1] : found[0]}.` : '';
};

/* ---------- reading them all ---------- */
const LEAD_KIND = { springs: 'spring', salvage: 'wreck', ore: 'ore', soil: 'growth', mystery: 'signal', pod: 'wreck', herd: 'herd', salt: 'mark', cave: 'cave', timber: 'growth', bones: 'mark', pass: 'ridge', wax: 'growth' };
const F_KIND = { fauna: 'herd', flora: 'growth', ruin: 'ruin', natives: 'camp', humans: 'camp', plague: 'mark' };
const SIG_ARC = { reach: 'others', drummers: 'hive', spire: 'builders' }, SIG_CARD = { reach: 'oth.signal', drummers: 'hive.tracks', spire: 'bld.find' };
function bearing(c, x, y) { const a = Math.atan2(x - c.x, -(y - c.y)); return COMPASS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }
/* How far in months, there and back being twice that: from the slot's distance on the plate, held inside its band. */
function months(s, P, c, p) {
  const band = BAND[p.dist] || BAND.near;
  if (p.off || !p.slot) return LF.poiFar(s, p).months;
  const xy = slotXY(P, p.slot), d = xy ? Math.hypot(xy.x - c.x, xy.y - c.y) : 0;
  return clamp(p.slot[0] === 'f' ? 6 + Math.round((d - 300) / 160) : Math.round(d / 150), band[0], band[1]);
}
const distOf = mo => mo <= 2 ? 'near' : mo <= 5 ? 'far' : 'long';
function described(s, P, c, p) {
  const xy = P && slotXY(P, p.slot), mo = P ? months(s, P, c, p) : (BAND[p.dist] || BAND.near)[0];
  let dir = null;
  if (P && xy) dir = bearing(c, xy.x, xy.y);
  else if (P) dir = LF.poiFar(s, p).bearing;
  return Object.assign(p, { kindWord: LF.poiWord(s, p.kind), months: mo, dist: p.dist || distOf(mo), bearing: dir, x: xy ? xy.x : null, y: xy ? xy.y : null, size: xy ? xy.size : 0,
    been: ((s.been || {})[p.key] || []).slice(), dangerWord: LF.poiDanger(p.danger) });
}
LF.pois = function (s) {
  if (!s.world || s.adrift || (LF.aloft && LF.aloft(s))) return [];
  const P = plan(s), c = P ? colAt(s, P) : null, out = [], v = P && LF.mapShown ? LF.mapShown(s) : null;
  const known = F => { const S = (LF.KINDS[F.kind] || { subs: {} }).subs[F.sub] || {};
    return [F.insight >= 40 && S.form ? cap1(S.form) + '.' : S.sign ? `What was seen: ${S.sign}.` : '', F.insight >= 60 ? 'Well understood now.' : F.insight >= 25 ? 'Partly understood.' : 'Seen, and not much more.',
      !F.res && F.threat > 55 ? 'Pressing on the colony.' : ''].filter(Boolean).join(' '); };
  const land = s.factors.find(F => F.kind === 'land');
  if (v) for (const t of v.things) {
    if (t.place) continue;
    const F = s.factors.find(x => x.id === t.key), b = (s.been || {})[t.key];
    let p;
    if (F) p = { key: t.key, name: F.Name, kind: F_KIND[F.kind] || 'mark', from: { k: 'map', t: 'what the colony has seen of it', d: F.onset }, d: F.onset,
      state: F.res === 'destroyed' ? 'gone' : F.res ? 'worked out' : b ? 'visited' : 'located', danger: F.res ? 1 : Math.round(F.threat / 20), owner: F.kind, known: known(F) };
    else if (t.kind === 'lead') { const fr = (LF.frames || []).find(x => x.id === t.key), sd = (land.seen || {})[t.key], ch = fr && (fr.choices || []).find(o => o.send);
      p = { key: t.key, name: t.cap, kind: LEAD_KIND[ch && ch.send.ret] || 'mark', from: { k: 'survey', t: 'the survey crews', d: sd }, d: sd, state: b ? 'visited' : 'located',
        danger: ch ? ch.send.danger || 2 : 2, owner: 'land', known: 'A lead from the interior. It went on the survey map with a question mark.' }; }
    else if (t.kind === 'town') { const T = LF.stlById ? LF.stlById(s, t.key) : null;
      p = { key: t.key, name: t.cap.split(' · ')[0], kind: 'town', from: { k: 'colony', t: 'founded by the colony', d: T ? T.d : s.day }, d: T ? T.d : s.day,
        state: t.dim ? 'gone' : 'visited', danger: 0, owner: 'colony', known: t.cap.split(' · ').slice(1).join(' · ') }; }
    else p = { key: t.key, name: t.cap.split(' · ')[0], kind: t.kind === 'ruin' ? 'ruin' : 'camp', from: { k: 'map', t: 'what the colony has seen of them', d: s.used[SIG_CARD[t.key]] || 0 },
      d: 0, state: b ? 'visited' : 'located', danger: 2, owner: SIG_ARC[t.key] || null, known: t.cap.split(' · ').slice(1).join(' · ') };
    p.id = p.key; p.slot = t.slot; p.dist = null; out.push(described(s, P, c, p));
  }
  if (v) for (const f of v.feats) { const key = 'feat:' + (f.full || f.name), b = (s.been || {})[key];
    out.push(Object.assign(described(s, null, c, { key, name: cap1(f.full || f.name), kind: 'mark', from: { k: 'orbit', t: 'the orbital report', d: 0 }, d: 0, state: b ? 'visited' : 'located', danger: 1, owner: null,
      known: f.cap.split(' · ').slice(1).join(' · '), dist: null }), { id: key, x: f.x, y: f.y, months: clamp(Math.round(Math.hypot(f.x - c.x, f.y - c.y) / 150), 1, 5), bearing: bearing(c, f.x, f.y) }, { dist: null }));
    const q = out[out.length - 1]; q.dist = distOf(q.months); }
  for (const p of LF.poiOwn(s)) out.push(described(s, P, c, Object.assign({}, p)));
  return out;
};
/* Which way and how far a place off the map is: for the arrow at the edge. */
LF.poiFar = function (s, p) { const i = hash(p.key + ':' + s.seed) % 8; return { ang: i * Math.PI / 4, bearing: COMPASS[i], months: clamp(8 + hash(p.key + ':' + s.seed) % 5, (BAND[p.dist] || BAND.long)[0], 12) }; };
LF.poi = (s, id) => LF.pois(s).find(p => p.id === id) || null;
/* How a place came to be known, in words: "From 'The Last Burn', year 1, month 3." */
LF.poiHow = function (s, p) {
  const f = p.from || {}, when = LF.dateStr(f.d || 0).replace(/^Year/, 'year');
  return ({ card: f.t ? `From “${f.t}”, ${when}` : `Marked ${when}`, party: `Found by ${f.t ? `“${f.t}”` : 'a party'}, ${when}`, thread: `${f.t}, ${when}`, survey: `From the survey crews, ${when}`,
    orbit: 'Named from orbit by the survey before landfall', site: 'Offered as a landing site by the orbital survey', colony: `Founded ${when}`, map: `First seen ${when}` }[f.k] || `Marked ${when}`) + '.';
};
/* Wild stock on the wheat card (LF.FINDS.stock): +10 on every test it has. */
{ const st = LF.byId && LF.byId['crops.adapt']; if (st) for (const ch of st.choices) if (ch.test && ch.test.mods) ch.test.mods.push(LF.h.Fl('wild_stock', 10, 'Wild stock from out past the wire')); }
})();

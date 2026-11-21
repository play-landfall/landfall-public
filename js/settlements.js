/* Landfall — outlying settlements (Lachlan, 2026-11-18; DESIGN.md "Settlements").
   "By year 40 the population should be in the tens of thousands. We need satellite settlements."
   (The same day the birth rate was brought down to a believable one, js/generations.js: a year-40 colony is a town of a
   few hundred, so a settlement here is a hamlet of twenty to a hundred people. NEED and the shares below are set for that.)
   A grown colony founds settlements past the wire. There is no screen for it: when the colony is big enough, or what
   it has built is running out of room, the council pegs out two places and asks (stl.found: where; stl.who: who goes).
   Each takes one of the six town slots on the world's map plan (tools/worldplan.py, `town`) and keeps it.

   How they are counted
   - Their people are INSIDE the count. s.pop, s.gen and LF.heads(s) are everyone on the world, as before, and every
     card, harvest and loss reads them unchanged. A settlement's n is how many of those live there: it follows the
     colony's size toward the settlement's room (no dice), and LF.outlying(s) is the sum. A printed head count is
     still LF.heads; LF.stlLine says how many of them live out.
   - A settlement that is lost takes its n out of the colony through LF.leave / LF.deaths, exact (LF.stlLose): a share
     already worked out, never scaled twice. Its room goes with it.
   What they do
   - room: LF.OUTLYING gets the room of every settlement standing and raised.
   - purpose: a farm adds to the harvest (LF.pressure yield), a mine sends materials in every month, a town has more
     room than the others and steadies morale a little. What a farm or a mine is called goes by the world (LF.lex).
   - births: people with ground of their own have more children (LF.BIRTH_MODS, 6% more for each settlement).
   - calamities: a colony in several places loses less to one (LF.LATE_RELIEF: half the share of people living out).
   - cost: materials and months to raise, hands on the roads, and whatever the cards cost.
   State: s.stl = { list: [{ id, slot, name, kind, far, d, up, n, room, who, sour, ... , gone: { d, how, n } }], ask, n },
   plain JSON, made on demand (LF.stl), so an old save simply starts founding them. Dice from LF.srand; names and
   which slot suits what from a hash of the seed. No DOM. */
(function () {
'use strict';
const { add, clamp, h } = LF; const { P, R } = h;
const YEAR = LF.YEAR, MONTH = LF.MONTH;
const hash = t => { let x = 2166136261; for (const c of String(t)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => ONES[n] || LF.num(n), cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const and = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const round = n => n >= 1000 ? Math.round(n / 100) * 100 : n >= 100 ? Math.round(n / 10) * 10 : Math.round(n);
LF.SLOTS = 6;
LF.ARC_VIEW.stl = 'world';

/* World words: the way out to a settlement, and what a farm and a mine are there. */
Object.assign(LF.ARCHETYPES.barren.lex, { road: 'the track across the dust flats', farm: 'cistern farm', mine: 'open pit', out: 'out on the flats' });
Object.assign(LF.ARCHETYPES.ruin.lex, { road: 'the old causeway', farm: 'terrace farm', mine: 'salvage yard', out: 'out in the grid' });
Object.assign(LF.ARCHETYPES.ice.lex, { road: 'the ice road', farm: 'hot-spring farm', mine: 'drift mine', out: 'out on the ice' });
Object.assign(LF.ARCHETYPES.drowned.lex, { road: 'the reef causeway', farm: 'fishery', mine: 'reef quarry', out: 'out across the lagoon' });
Object.assign(LF.ARCHETYPES.jungle.lex, { road: 'the cut trail', farm: 'clearing farm', mine: 'river diggings', out: 'out under the canopy' });
Object.assign(LF.ARCHETYPES.garden.lex, { road: 'the cart road', farm: 'hill farm', mine: 'chalk quarry', out: 'out on the downs' });
const WORLD_ROOM = { garden: 1.5, jungle: 1.2, drowned: 1, ruin: 1, ice: 0.7, barren: 0.6 };

/* ---------- state, and who is where ---------- */
LF.stl = s => s.stl || (s.stl = { list: [], ask: 0, n: 0 });
const all = s => (s.stl && s.stl.list) || [];
LF.settlements = s => all(s).filter(t => !t.gone);                       // standing, raised or not
LF.settled = s => all(s).filter(t => !t.gone && s.day >= t.up);          // standing and lived in
LF.stlById = (s, id) => all(s).find(t => t.id === id) || null;
LF.outlying = s => LF.settlements(s).reduce((a, t) => a + t.n, 0);
LF.kindWord = (s, t) => t.kind === 'town' ? 'township' : LF.lex(s, t.kind);
const working = (s, t) => !t.gone && s.day >= t.up && !(t.hold && s.day < t.hold);

/* Where the slots are, nearest the colony first. From the map plan when it is loaded, else from the seed alone. */
const site = (s, Pl) => (s.world.type === 'drowned' || s.flags.site_delta) && Pl.colony.wet ? 'wet' : Pl.colony.dry ? 'dry' : 'wet';
LF.stlDist = function (s, slot) {
  const Pl = LF.WORLD_PLAN && LF.WORLD_PLAN.maps[s.world.type], T = Pl && Pl.town && Pl.town[slot];
  if (!T) return 100 + hash(s.seed + ':stl:d:' + slot) % 400;
  const c = Pl.colony[site(s, Pl)]; return Math.round(Math.hypot(T.x - c.x, T.y - c.y));
};
/* What each slot suits: two of each purpose, dealt by the seed, the same all game. */
LF.stlKind = function (s, slot) {
  const k = ['farm', 'mine', 'town', 'farm', 'mine', 'town'].map((v, i) => [hash(s.seed + ':stl:k:' + i), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return k[slot % k.length];
};
const FIRST = ['Far', 'Low', 'High', 'Second', 'Little', 'Long', 'Grey', 'Upper', 'Outer', 'New', 'Old', 'East', 'West', 'North', 'South'];
const NOUN = { farm: ['Furrow', 'Orchard', 'Granary', 'Harrow', 'Tilth', 'Gleaning', 'Larder'], mine: ['Anvil', 'Seam', 'Cut', 'Delve', 'Adit', 'Tailings', 'Hammer'], town: ['Hearth', 'Lantern', 'Haven', 'Bell', 'Lintel', 'Threshold', 'Commons'] };
LF.stlName = function (s, slot, kind) {
  const taken = all(s).map(t => t.name);
  for (let i = 0; i < 40; i++) { const x = hash(s.seed + ':stl:n:' + slot + ':' + i), n = `${FIRST[x % FIRST.length]} ${NOUN[kind][(x >>> 8) % NOUN[kind].length]}`;
    if (!taken.includes(n) && !taken.some(t => t.split(' ')[1] === n.split(' ')[1])) return n; }
  return `${s.world.planet} ${slot + 1}`;
};
const stale = (s, t) => !!t.gone && t.gone.how !== 'burned' && s.day - t.gone.d >= 2 * YEAR && !s.flags.stl_hold;   // ground that has stood empty two years can be raised again
const free = s => { const used = all(s).filter(t => !stale(s, t)).map(t => t.slot), out = []; for (let i = 0; i < LF.SLOTS; i++) if (!used.includes(i)) out.push(i); return out.sort((a, b) => LF.stlDist(s, a) - LF.stlDist(s, b)); };

/* ---------- room, and what a settlement is worth ---------- */
const roomOf = (s, t) => { const yrs = Math.max(0, (s.day - t.up) / YEAR), top = (t.far ? 600 : 250) * (WORLD_ROOM[s.world.type] || 1) * (t.kind === 'town' ? 1.6 : 1);
  return Math.round(Math.min(top, (t.far ? 100 : 60) * (t.kind === 'town' ? 1.6 : 1) * Math.pow(1.3, yrs))); };
LF.OUTLYING.push(s => LF.settled(s).reduce((a, t) => a + t.room, 0));
LF.BIRTH_MODS.push(s => 1 + 0.06 * Math.min(6, LF.settled(s).length));
if (LF.LATE_RELIEF) LF.LATE_RELIEF.push(s => 1 - 0.5 * clamp(LF.outlying(s) / Math.max(1, LF.heads(s)), 0, 0.6));
(function () { const p0 = LF.pressure; LF.pressure = function (s) { const Pr = p0(s); let farms = 0;
  for (const t of LF.settlements(s)) { if (s.day < t.up) { Pr.labor -= 0.03; continue; }
    Pr.labor -= t.watch ? 0.012 : 0.004;                                           // carts, the road, the doctor's round, and a section of the watch if one is out there
    if (!working(s, t)) continue;
    if (t.kind === 'farm') farms++; else if (t.kind === 'town') Pr.morale += 0.01; }
  Pr.yield += Math.min(0.15, 0.05 * farms);
  if (s.flags.stl_drain && s.day < s.flags.stl_drain) Pr.labor -= 0.03;          // the young and able went out to raise it (stl.who)
  Pr.labor = clamp(Pr.labor, 0.4, 1.3); return Pr; }; })();

/* ---------- founding and losing ---------- */
LF.stlFound = function (s, slot, name, far) {
  const S = LF.stl(s), kind = LF.stlKind(s, slot), hd = LF.heads(s);
  S.list = S.list.filter(x => x.slot !== slot);   // raised again on ground that stood empty: the old settlement is off the map
  const t = { id: 'stl' + (++S.n), slot, name, kind, far: !!far, d: s.day, up: s.day + (far ? 5 : 3) * MONTH, n: Math.round(clamp(hd * 0.07, 12, far ? 60 : 40)), room: 0, who: 'vol', sour: 0 };
  t.room = roomOf(s, t); S.list.push(t); S.ask = s.day; S.f = (S.f || 0) + 1; if (!S.first) S.first = s.day;
  LF.chron(s, `${name} was founded ${LF.lex(s, 'out')}, the colony's ${['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][S.f - 1] || 'next'} settlement.`); LF.storyPoint(s);
  return t;
};
/* A settlement is lost. how: 'dark' (nobody knows: its people are gone), 'dead' (they are known dead), 'in' (given up:
   its people come inside the wire and stay in the count), 'left' (they walked away from the colony). Returns how many
   people went with it. share: the part of its people lost, for a place emptied only in part before it was given up. */
LF.stlLose = function (s, t, how, share) {
  if (!t || t.gone) return 0;
  const n0 = t.n, n = how === 'in' ? 0 : Math.min(Math.round(n0 * (share === undefined ? 1 : share)), Math.max(0, LF.heads(s) - 12));
  t.gone = { d: s.day, how, n }; t.n = 0; t.room = 0;
  if (n > 0) { if (how === 'dead') LF.deaths(s, n, true); else LF.leave(s, n, true); }
  { const S = LF.stl(s); if (how === 'in') S.gk = (S.gk || 0) + 1; else { S.lost = (S.lost || 0) + n; S.lk = (S.lk || 0) + 1; } }
  return n;
};
/* Some of a settlement's people, lost where they live (a raid, a fever, a bad season): exact, and out of its n. */
LF.stlHurt = function (s, t, n, dead) { n = Math.min(Math.round(n), Math.max(0, t.n - 5), Math.max(0, LF.heads(s) - 12)); if (n <= 0) return 0;
  t.n -= n; if (dead) LF.deaths(s, n, true); else LF.leave(s, n, true); return n; };

/* ---------- the clock ---------- */
const NEED = [160, 220, 280, 360, 480, 650];   // heads before a first, second ... sixth standing settlement is proposed: set for a town of hundreds (the believable birth rate, 2026-11-18)
const GAP = 12 * MONTH;
const FROM = 11 * YEAR;
LF.canSettle = function (s) {
  if (!s.world || LF.aloft(s) || (s.over && !s.over.cont) || s.flags.stl_hold) return false;
  if (s.day < FROM && !s.won) return false;                                 // a grown colony: from year twelve, or once the cords are cut
  const S = LF.stl(s), k = LF.settlements(s).length; if (k >= LF.SLOTS || !free(s).length) return false;   // by how many stand: a colony that has lost some may raise them again
  if (S.ask && s.day - S.ask < GAP) return false;
  if (LF.settlements(s).some(t => s.day < t.up)) return false;             // one at a time
  const hd = LF.heads(s), c = LF.capacity(s);
  const site = s.flags.stl_site ? 0.88 : 1;                                // a site a party pegged out (a spring, a ridge: gen.js REWARD, T2-5) brings the question on sooner
  return hd >= NEED[k] * site || (hd >= 140 * site && hd > c.n * 0.72 && !c.full);       // big enough, or running out of what it has built
};
LF.stlTick = function (s) {
  if (!s.world || LF.aloft(s) || s.day % MONTH) return;
  if (!s.stl && !LF.canSettle(s)) return;
  const S = LF.stl(s), hd = LF.heads(s);
  for (const t of S.list) { if (t.gone) continue;
    if (s.day >= t.up && !t.raised) { t.raised = s.day; LF.log(s, `${t.name} is roofed and lived in: ${LF.num(t.n)} people, ${an(LF.kindWord(s, t))} ${LF.lex(s, 'out')}.`, 'good'); }
    t.room = roomOf(s, t);
    if (s.day < t.up) continue;
    const want = Math.min(t.room * 0.9, hd * (t.far ? 0.1 : 0.07) * (t.who === 'young' ? 0.8 : 1));   // 'young': only a save from before 2026-11-21, when stl.who could send the eldest children
    t.n = Math.max(5, Math.round(t.n + (want - t.n) * 0.15));
    if (working(s, t) && t.kind === 'mine') s.res.mat += 6; }
  // never more than 45% of the colony lives out
  const out = LF.outlying(s); if (out > hd * 0.45) { const f = hd * 0.45 / out; for (const t of LF.settlements(s)) t.n = Math.max(5, Math.round(t.n * f)); }
  if (LF.canSettle(s)) LF.cue(s, 'stl.found', 0, 20);
  // the ordinary business of having them: one card at a time, a year or so apart
  const up = LF.settled(s).filter(t => s.day - t.up >= 10 * MONTH);
  if (up.length && !s.flags.stl_hold && s.day >= (S.card || 0) && !s.sched.some(e => /^stl\./.test(e.id))) {
    const pool = ['stl.council', 'stl.share', 'stl.watch'].filter(id => LF.byId[id].fits(s));
    if (pool.length) { const least = Math.min(...pool.map(id => (s.nfired && s.nfired[id]) || 0)), pick = LF.spick(s, pool.filter(id => ((s.nfired && s.nfired[id]) || 0) === least));
      LF.cue(s, pick, 0, 15); S.card = s.day + 11 * MONTH + LF.sri(s, 0, 40); } }
};
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { if (t0) t0(s); LF.stlTick(s); }; })();

/* ---------- in words ---------- */
LF.stlLine = function (s) {
  const st = LF.settlements(s); if (!st.length) return all(s).length ? 'No settlement stands outside the wire now.' : '';
  const up = st.filter(t => s.day >= t.up), n = LF.outlying(s), dark = all(s).filter(t => t.gone && t.gone.how !== 'in').length;
  return `${up.length ? `${LF.num(n)} of the colony's people live ${LF.lex(s, 'out')}, at ${and(up.map(t => t.name))}.` : ''}${st.length > up.length ? ` ${and(st.filter(t => s.day < t.up).map(t => t.name))} is being raised.` : ''}${dark ? ` ${Num(dark)} settlement${dark === 1 ? ' stands' : 's stand'} empty.` : ''}`.trim();
};
(function () { const g0 = LF.genLine; LF.genLine = function (s) { const a = g0(s), b = a && s.stl ? LF.stlLine(s) : ''; return b ? `${a} ${b}` : a; }; })();
/* What the World view shows of them: the slot, and a caption. */
LF.stlOnMap = function (s) {
  return all(s).map(t => ({ key: t.id, slot: 'T' + (t.slot + 1), dim: !!t.gone, raising: !t.gone && s.day < t.up,
    cap: t.gone ? `${t.name} · ${t.gone.how === 'in' ? 'given up' : t.gone.how === 'burned' ? 'burned' : 'empty'} since year ${LF.date(t.gone.d).year}`
      : s.day < t.up ? `${t.name} · being raised` : `${t.name} · ${LF.kindWord(s, t)}, ${LF.num(t.n)} people` }));
};

/* ---------- the cards ---------- */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const pickStl = (s, ok, by) => { const c = LF.settled(s).filter(ok); if (!c.length) return null; return c.sort((a, b) => by(b) - by(a) || a.d - b.d)[0]; };
const ctxOf = (s, t) => ({ sid: t.id, name: t.name, kind: LF.kindWord(s, t), n: t.n, far: t.far, who: t.who, sour: t.sour, out: LF.lex(s, 'out'), road: LF.lex(s, 'road') });
const T_ = (s, c) => LF.stlById(s, c.sid);
const sour = (s, c, v) => { const t = T_(s, c); if (t) t.sour = Math.max(0, (t.sour || 0) + v); };

/* 1. Where. Costs no month: who goes is asked at once. */
add({ id: 'stl.found', arc: 'stl', tone: 'opportunity', title: 'A Second Wire', chain: true, repeat: 1, gap: 0, city: true,
  when: s => LF.canSettle(s),
  setup: s => { const f = free(s), a = f[0], b = f.length > 1 ? f[f.length - 1] : null, cp = LF.capacity(s), hd = LF.heads(s), outN = LF.outlying(s);
    const old = i => { const o = all(s).find(x => x.slot === i); return o ? o.name : ''; };
    const A = { slot: a, kind: LF.stlKind(s, a), old: old(a) }, B = b === null ? null : { slot: b, kind: LF.stlKind(s, b), old: old(b) };
    A.name = LF.stlName(s, a, A.kind); A.word = A.kind === 'town' ? 'township' : LF.lex(s, A.kind);
    if (B) { B.name = LF.stlName(s, b, B.kind); B.word = B.kind === 'town' ? 'township' : LF.lex(s, B.kind); }
    return { A, B: B || A, two: !!B, hd, home: hd - outN, outN, k: LF.settlements(s).length, tight: hd > cp.n * 0.72 && !cp.full ? LF.LIMITS[cp.by].why(s) : '', road: LF.lex(s, 'road'), out: LF.lex(s, 'out'), sv: nm(s, 'geologist'), q: nm(s, 'quartermaster') }; },
  text: (s, c) => `${LF.num(c.home)} people live inside ${c.outN ? 'the wire' : 'one wire'}${c.tight ? `, and what holds the number there is ${c.tight}` : ', and people sleep in the bunk rows by turns'}. ${c.k ? 'The council wants another settlement' : 'The council wants a settlement of its own people past the wire, the first'}, and ${c.sv} has ${c.two ? 'two places' : 'one place'} pegged out.\n\n`
    + `${c.A.name} would be ${an(c.A.word)} a morning's walk along ${c.road}, on ground the colony's own crews already work${c.A.old ? `, where ${c.A.old} stood` : ''}.${c.two ? ` ${c.B.name} would be ${an(c.B.word)} far ${c.out}, past the last marker, ${c.B.old ? `on the ground plates of ${c.B.old}, ` : ''}with room to grow for a generation.` : ''} ${cap(c.q)} has the plate for one of them.`,
  choices: [
    { label: (s, c) => `Raise ${c.A.name}, the near one`, cost: { mat: 60 }, note: 'It is in reach of the watch and the clinic. It takes the outer field for its ground and will never hold many.',
      info: [['people', 'A little room'], ['danger', 'The outer field']],
      out: { text: (s, c) => `The pegs at ${c.A.name} are driven the same month. The crews who worked that ground are given other ground, further off, and say what they think of it. The first frames go up within sight of the wall lamps.`,
        fx: (s, c) => ({ yield: -0.02, do: s2 => { const t = LF.stlFound(s2, c.A.slot, c.A.name, false); s2.flags.stl_new = t.id; } }), then: 'stl.who' } },
    { label: (s, c) => `Raise ${c.B.name}, the far one`, show: (s, c) => c.two, cost: { mat: 90 }, note: 'There is room there to grow for a generation. It is beyond the reach of the watch, the doctor and the wall lamps.',
      info: [['people', 'Room to grow'], ['later', 'Whoever lives out of reach']],
      out: { text: (s, c) => `Carts go out along ${c.road} loaded with plate and come back empty for the rest of the season. ${c.B.name} is a ring of frames on bare ground, further from the wire than most of the colony has ever walked.`,
        fx: (s, c) => ({ do: s2 => { const t = LF.stlFound(s2, c.B.slot, c.B.name, true); s2.flags.stl_new = t.id; } }), then: 'stl.who' } },
    { label: 'Not yet: everyone stays inside one wire', note: 'The crowding goes on, and the households that asked for ground of their own are told to wait another year.',
      info: [['danger', 'Morale']],
      out: { text: 'The pegs are pulled and the plate goes back on the rack. People go on sleeping in the bunk rows by turns. The list of households asking for ground is kept, and it is longer by the end of the month.',
        fx: s => ({ morale: -3, tension: 4, do: s2 => { LF.stl(s2).ask = s2.day + 4 * MONTH; } }) } },
  ] });

/* 2. Who goes. */
add({ id: 'stl.who', arc: 'stl', tone: 'pressure', title: 'Who Goes', chain: true, repeat: 1, gap: 0, city: true, view: 'people',
  setup: s => { const t = LF.stlById(s, s.flags.stl_new) || LF.settlements(s).slice(-1)[0];
    return Object.assign(t ? ctxOf(s, t) : { name: 'the new settlement', n: 40, kind: 'township' }, { lock: Math.max(4, Math.round(LF.sized(s) * 0.05)) }); },
  text: (s, c) => `${c.name} needs about ${num(round(c.n))} people to hold it through its first year. More names are down for it than there are places, and nearly all of them are young${LF.children(s).eldest >= LF.AGE ? ', many of them born here' : ''}. The founding households have put down almost none.\n\nWhoever goes will live out of sight of the wall. The list is yours to settle.`,
  choices: [
    { label: 'Let the ones who asked go', note: 'The young and the able leave the yard and the field crews, which are short of exactly them.',
      info: [['yield', 'A settlement that wants to be there'], ['danger', 'Hands, for a year']],
      out: { text: (s, c) => `The list is read out as it stands. They leave in one column with handcarts, and half the mess walks with them as far as the last marker. The yard is short on every shift for the rest of the year.`,
        fx: s => ({ morale: 2, do: s2 => { s2.flags.stl_drain = s2.day + YEAR; const t = LF.stlById(s2, s2.flags.stl_new); if (t) t.who = 'vol'; } }) } },
    { label: 'Send the lock-up, the short-rationed and the names the watch keeps', dark: true, note: (s, c) => `The colony is quieter within the month. ${c.name} is founded by people who were made to go.`,
      info: [['yield', 'A quieter colony'], ['danger', 'The ones sent, and what they make of it']],
      out: { text: (s, c) => `The watch reads the list at the gate, and it is the list everybody expected. They go out under escort with their households and what they can carry. The escort comes back the same month. The lock-up is empty and the mess is calmer.`,
        fx: s => ({ morale: 1, tension: -10, stain: ['stl_exiled', 2], do: s2 => { const t = LF.stlById(s2, s2.flags.stl_new); if (t) { t.who = 'out'; t.sour = 3; } },
          chron: (s2, c) => `${c.name} was settled with the people the colony wanted rid of.` }) } },
  ] });

/* 3. A council of its own. */
add({ id: 'stl.council', arc: 'stl', tone: 'pressure', title: 'A Table of Their Own', chain: true, repeat: 1, gap: 0, city: true, view: 'people',
  fits: s => !!pickStl(s, t => !t.council && !t.ruled && t.n >= 15, t => t.sour), when: s => LF.byId['stl.council'].fits(s),
  setup: s => { const t = pickStl(s, x => !x.council && !x.ruled && x.n >= 15, x => x.sour) || LF.settled(s)[0]; return Object.assign(ctxOf(s, t), { others: LF.settled(s).length - 1, dead: Math.max(2, Math.round(t.n * 0.06)) }); },
  text: (s, c) => `${c.name} has elected three people to a table of its own and sent the minutes in by cart. They mean to hear their own disputes, keep their own lock-up and set their own rations, and they ask for one voice on your council.${c.who === 'out' ? ' Two of the three were on the watch\'s list the year they were sent out.' : c.who === 'young' ? ' All three were sent out as children to raise the place.' : ''}\n\nNothing in the charter says that a settlement may do this, and nothing says it may not.`,
  choices: [
    { label: 'Grant it, and seat their voice', note: (s, c) => `The colony stops being one place under one table${c.others > 0 ? ', and the other settlements will ask for the same' : ''}.`,
      out: { text: (s, c) => `The three are entered in the record and one more chair is put at the council table for ${c.name}. Their voice votes against the first levy that comes up, and loses, and stays in the chair.`,
        fx: (s, c) => ({ morale: 1, tension: 4, do: s2 => { const t = T_(s2, c); if (t) t.council = s2.day; sour(s2, c, -1); } }) } },
    { label: 'Refuse, and send a steward to sit at their table', note: 'Somebody from your council goes to live among people who voted against having one.',
      out: { text: (s, c) => `A steward goes out with a clerk and the colony's seal. The three meet anyway, in a kitchen, and call it supper. The steward's reports come in on time and say that all is in order.`,
        fx: (s, c) => ({ morale: -2, do: s2 => { const t = T_(s2, c); if (t) t.ruled = s2.day; sour(s2, c, 1); } }) } },
    { label: 'Arrest the three, and bring them in', dark: true, note: 'It ends the table in a night, and everyone living past the wire learns what an election is worth.',
      info: [['yield', 'One table'], ['danger', 'The three, and how it is taken out there']],
      out: { text: (s, c) => `The watch goes out at night and is back by morning with three people on a cart. They are held in the long store without a charge, since nobody can find one. ${c.name} sends its carts in on time, with nobody riding on them who will speak to the gate.`,
        fx: (s, c) => ({ tension: -6, stain: ['stl_five', 2], do: s2 => { const t = T_(s2, c); if (t) t.ruled = s2.day; sour(s2, c, 2); },
          chron: `The three people ${c.name} elected were arrested and brought in.` }) } },
  ] });

/* 4. A settlement stops sending its share. */
add({ id: 'stl.share', arc: 'stl', tone: 'pressure', title: 'The Carts Come In Light', chain: true, repeat: 1, gap: 0, city: true,
  fits: s => !!pickStl(s, t => !t.shared, t => t.sour + (t.council ? 1 : 0)), when: s => LF.byId['stl.share'].fits(s),
  setup: s => { const t = pickStl(s, x => !x.shared, x => x.sour + (x.council ? 1 : 0)) || LF.settled(s)[0]; t.shared = s.day;
    return Object.assign(ctxOf(s, t), { others: LF.settled(s).length - 1, q: nm(s, 'quartermaster'), w: nm(s, 'security'), what: t.kind === 'farm' ? 'grain' : t.kind === 'mine' ? 'ore' : 'levy', dead: Math.max(1, Math.round(t.n * 0.04)), truth: LF.srand(s) < 0.45 + 0.1 * Math.min(3, t.sour) }); },
  text: (s, c) => `The carts from ${c.name} have come in at a third of the tally, for the second time. The note with them says the season was poor and that the settlement has kept back what it needs to live. ${cap(c.q)} has seen the same season from inside the wire and does not call it poor.\n\nThe ${c.what} was counted on, and ${c.others > 0 ? 'the other settlements will hear what is done about it' : 'whatever is done about it will be remembered when the next settlement is raised'}.`,
  choices: [
    { label: 'Take the note at its word, and write the season off', note: 'The colony goes without the share, and it is learned out there that a note will do.',
      out: { text: (s, c) => `The tally is struck through and initialled. ${c.name} sends thanks, and a smaller cart. ${cap(c.q)} files the note with the others.`,
        fx: (s, c) => ({ food: c.what === 'grain' ? -30 : 0, mat: c.what === 'ore' ? -10 : 0, do: s2 => { const t = T_(s2, c); if (t) t.hold = s2.day + 8 * MONTH; s2.flags.stl_soft = (s2.flags.stl_soft || 0) + 1; } }) } },
    { label: 'Send the clerks out to count their stores', note: 'Either the settlement is caught lying or the colony is seen calling it a liar.', test: { base: 50, mods: [R('quartermaster', 10)] },
      ok: { text: (s, c) => c.truth ? `The clerks count for a month and find a second store, dug in behind the cart shed and roofed with turf. ${c.name} sends the full tally from then on, and the clerks are not thanked for it.` : `The clerks count for a month. The bins are as low as the note said. ${c.name} is let off the season in writing, and somebody there frames the letter.`,
        fx: (s, c) => ({ food: c.truth && c.what !== 'ore' ? 30 : 0, mat: c.truth && c.what === 'ore' ? 15 : 0, do: s2 => { sour(s2, c, c.truth ? 1 : -1); const t = T_(s2, c); if (t && !c.truth) t.hold = s2.day + 4 * MONTH; } }) },
      bad: { text: (s, c) => `The clerks are shown every bin and find nothing they can call hidden. They are fed badly and lodged in the cart shed. ${c.name} sends the same light carts, with a second note about the manners of clerks.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { sour(s2, c, 2); const t = T_(s2, c); if (t) t.hold = s2.day + 6 * MONTH; } }) } },
    { label: 'Send the watch to load the share themselves', dark: true, note: 'The carts come back full. Somebody will stand in a store doorway, and the watch has its orders.',
      info: [['yield', 'The share, in full'], ['danger', 'Whoever stands in the doorway']],
      out: { text: (s, c) => `${cap(c.w)} goes out with rifles and empty carts. A storekeeper bars the door and is shot through it. The carts come back full, and are unloaded by people who do not ask how.`,
        fx: (s, c) => ({ food: c.what === 'ore' ? 20 : 50, mat: c.what === 'ore' ? 25 : 0, stain: ['stl_levy', 2], do: s2 => { const t = T_(s2, c); if (t) LF.stlHurt(s2, t, 1, true); sour(s2, c, 2); },
          chron: `The watch took ${c.name}'s share by force, and shot a storekeeper to get it.` }) } },
  ] });

/* 5. A settlement asks for the watch. */
add({ id: 'stl.watch', arc: 'stl', tone: 'pressure', title: 'They Ask for the Watch', chain: true, repeat: 1, gap: 0, city: true,
  fits: s => !!pickStl(s, t => !t.watch && !t.armed, t => (t.far ? 2 : 0) + t.sour), when: s => LF.byId['stl.watch'].fits(s),
  setup: s => { const t = pickStl(s, x => !x.watch && !x.armed, x => (x.far ? 2 : 0) + x.sour) || LF.settled(s)[0]; return Object.assign(ctxOf(s, t), { w: nm(s, 'security'), back: Math.round(t.n * 0.25), inside: LF.srand(s) < 0.5 }); },
  text: (s, c) => `Stores have been going from ${c.name} at night, and a herder was found beaten at the edge of the lamps. The settlement asks for six of the watch to be quartered there, and says it cannot hold its own ground without them.\n\n${cap(c.w)} has rifles enough to hold one wire properly, and says so.`,
  choices: [
    { label: 'Quarter six of the watch there', note: 'The colony\'s own wall is six rifles thinner for as long as they stay out.',
      info: [['danger', 'The home wall']],
      out: { text: (s, c) => `Six of the watch march out along ${c.road} with their bedding on a cart. The thefts at ${c.name} stop. On the home wall the night posts are stood singly where there were pairs.`,
        fx: (s, c) => ({ tension: 3, do: s2 => { const t = T_(s2, c); if (t) t.watch = s2.day; sour(s2, c, -1); } }) } },
    { label: 'Send them rifles, and let them keep their own watch', cost: { mat: 15, parts: 2 }, note: 'Rifles leave the armoury for people who answer to their own table first.',
      out: { text: (s, c) => `Eight rifles go out under canvas with a sergeant to teach the drill. The sergeant is back within the season. ${c.name} posts its own sentries now, and they challenge the colony's carts like anybody else's.`,
        fx: (s, c) => ({ tension: 3, do: s2 => { const t = T_(s2, c); if (t) t.armed = s2.day; } }) } },
    { label: 'Send six of the watch, with orders to search every house', dark: true, note: 'The colony thinks the thief lives there. Somebody will be made to answer for it in front of the rest.',
      info: [['yield', 'An end to it'], ['danger', 'Whoever the search settles on']],
      out: { text: (s, c) => c.inside ? `The watch turns out every house in ${c.name} and finds the stores under a floor. The householder is hanged from the cart crane by the sergeant before any word can come from the council. The thefts stop.`
          : `The watch turns out every house in ${c.name} and finds nothing. A herder who would not open a door is hanged from the cart crane as an example. The stores go on thinning for a month and then stop of themselves.`,
        fx: (s, c) => ({ stain: ['stl_searched', 2], do: s2 => { const t = T_(s2, c); if (t) { t.watch = s2.day; LF.stlHurt(s2, t, 1, true); } sour(s2, c, c.inside ? 1 : 2); } }) } },
  ] });

LF.TAGS['stl.found'] = ['cautious order', 'bold open', 'cautious closed'];
LF.TAGS['stl.who'] = ['free open', 'severe closed'];
LF.TAGS['stl.council'] = ['free open', 'cautious order', 'severe closed'];
LF.TAGS['stl.share'] = ['mercy open', 'cautious order', 'severe order'];
LF.TAGS['stl.watch'] = ['cautious order', 'free open', 'severe order'];
Object.assign(LF.DEEDS || {}, {
  stl_exiled: 'the settlement founded with the people the colony wanted rid of',
  stl_children: 'the children sent out to raise a town',
  stl_five: 'the three a settlement elected, brought in on a cart',
  stl_starved: 'the settlement starved until it voted its own table away',
  stl_levy: 'the share taken by the watch, and the storekeeper shot through the door',
  stl_withheld: 'the doctor\'s round stopped at the last marker until the carts came in full',
  stl_searched: 'the hanging from the cart crane at a settlement',
});
})();

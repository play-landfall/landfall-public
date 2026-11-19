/* Landfall — generations (2026-11-18; DESIGN.md "Generations, and a colony the size of a city").
   Lachlan: a happy colony should be having babies by the end of year one, and by year 40 it should be a city of tens
   of thousands. This file is the rules for that and nothing else: no cards. Three later pieces of work build on it
   (dilemmas about the generations, satellite settlements, a city view), and the hooks they need are listed below.

   The model
   - s.pop is the grown: everyone who works and eats a full ration. It is what it always was, and every card reads it.
   - s.gen.co is the children born here, by the year they were born ({ year: n }); s.gen.kids is how many in all.
     A child eats LF.KID_EATS of a ration, is not a pair of hands, and comes of age at LF.AGE (twelve) at the turn
     of the year: into s.pop, and into s.gen.born (the grown who were born here).
   - LF.heads(s) = s.pop + s.gen.kids: what the stock bar calls Colonists, and what the people cord counts.
   - The children who came down on the ship are in s.pop, as they always were (the Children dread counts them there,
     and the balance was set with them carrying and eating like anyone). LF.shipKids(s) says how many of the grown
     count are still under twelve, so nothing printed says "no children" while the schoolroom is full.
   - Births (LF.birthRate, a year): the grown of childbearing age, times how good a heart the colony is in
     (LF.heart: nothing at morale 25, everything at 65), times food, room and policy. The first cannot come before
     month nine. Founders bear at B_FOUND until year twelve and are past it by twenty-two; the born bear at B_BORN.
   - Room (LF.capacity): the lowest of five ceilings set by what is built (LF.LIMITS: roofs, water, power, care,
     ground), plus whatever LF.OUTLYING adds. Births thin out over the last third of it.

   Hooks for what comes next
   - LF.birthRate(s), LF.heart(s), LF.fertile(s), LF.children(s), LF.shipKids(s), s.gen.born, LF.genLine(s)
   - LF.capacity(s) -> { n, by, own, out }; LF.LIMITS (add or replace a ceiling); LF.OUTLYING (push s => room a
     satellite settlement adds); LF.cityTier(s) for a view that wants to know how big to draw it
   - LF.BIRTH_MODS: push s => a multiplier (a policy, a practice, a machine). LF.HEART_FLOOR: push s => a floor
     under LF.heart (births that do not need the colony to be glad: a roster, a vat)
   - LF.bear(s, n, by) puts n children in this year's cohort; LF.loseYoung(s, n, eldest) takes n out
   - LF.GEN_ON: { birth, ofAge } lists of (s, n) called when children are born and when a cohort comes of age
   - LF.KID_RISK: push s => a multiplier on the children's yearly deaths
   - the condition 'cradles' (LF.cv(s, 'cradles')): people of childbearing age, and no child born in a year
   State: s.gen, plain JSON, made on demand (LF.gen), so an old save simply starts having children. */
(function () {
'use strict';
const { clamp } = LF, YEAR = LF.YEAR, MONTH = LF.MONTH;
LF.AGE = 15;                       // coming of age (twelve until 2026-11-18, when the rate below had to reach tens of thousands)
// Births a year for each of the grown of an age, in a colony in the best of heart. Lachlan, 2026-11-18: "it doesn't need to reach five
// figures, just a believable birth rate". 0.25 is a child every two years for each woman, a frontier's rate; the born
// were at 2.8, a number chosen to hit a target.
const B_FOUND = 0.25, B_BORN = 0.25;
const FIRST = 85;                  // no birth before the ninth month on the ground
LF.COND.cradles = { kind: 'bodily', name: 'Empty cradles' };

LF.gen = s => s.gen || (s.gen = { co: {}, kids: 0, born: 0, acc: 0, cm: 0, n: 0, yb: 0, last: 0, y: LF.date(s.day).year });
const landed = s => s.landed || 0;                              // the day the lander came down (set below)
const yearsDown = s => Math.max(0, (s.day - landed(s)) / YEAR);

/* ---------- who is here ---------- */
LF.shipKids = function (s) {
  if (!s.world || LF.aloft(s)) return 0;
  const t = s.threads && s.threads.children, base = t && t.on && t.d0 ? t.kids : 16 + 5 * (s.flags.woken || 0);
  return Math.max(0, Math.min(Math.floor(s.pop * 0.3), Math.round(base * clamp(1 - yearsDown(s) / 9, 0, 1))));
};
/* The young: n in all, born here and off the ship, the age of the eldest born here, and the cohorts [age, n]. */
LF.children = function (s) {
  const G = LF.gen(s), y = LF.date(s.day).year, ages = Object.keys(G.co).map(k => [y - +k, G.co[k]]).filter(a => a[1] > 0).sort((a, b) => a[0] - b[0]);
  const ship = LF.shipKids(s);
  return { n: G.kids + ship, born: G.kids, ship, eldest: ages.length ? ages[ages.length - 1][0] : 0, ages, share: G.kids / Math.max(1, LF.heads(s)) };
};
/* The grown of childbearing age. Founders were woken as adults: past it between years twelve and twenty-two. */
LF.fertile = function (s) {
  const G = LF.gen(s), born = Math.min(G.born, s.pop), yrs = yearsDown(s);
  return { born, found: (s.pop - born) * clamp(1 - (yrs - 12) / 10, 0, 1) };
};
LF.heart = function (s) {
  let f = clamp((s.morale - 15) / 30, 0, 1);   // nothing at 15, everything at 45 (20 and 60 until the rate came down to a believable one, 2026-11-18)
  for (const fn of LF.HEART_FLOOR) f = Math.max(f, fn(s) || 0);
  return f;
};
LF.HEART_FLOOR = [s => (s.flags.lim_roster && s.flags.lim_roster !== 'refused' ? 0.6 : 0)];   // childbearing made a duty (lim.roster)
LF.BIRTH_MODS = [
  s => (LF.edge ? LF.edge(s, 'births') : 1),   // a Head Surgeon who wants the cradles full (LF.EDGE)
  s => (s.flags.births_deferred ? 0.1 : 1),          // implants for everyone (pol.births): the few that happen anyway
  s => (s.flags.births ? 1.35 : 1),                  // the colony has said children are the point
  s => (s.flags.embryo_program ? 1.25 : 1),          // and assigns them from the bank as well
  s => (s.built.school && !LF.pillars(s).people ? 1.5 : 1),   // a school short of its people (2026-11-17)
];

/* ---------- room ---------- */
const WORLD_ROOM = { garden: 1.5, jungle: 1.2, drowned: 1, ruin: 1, ice: 0.7, barren: 0.6 };
LF.CITY = 40000;   // what a colony with every cord cut can hold on middling ground
const big = s => Math.round(LF.CITY * (WORLD_ROOM[s.world.type] || 1));
LF.LIMITS = {
  roofs:  { n: s => !s.built.housing ? 170 : s.built.smelter || s.built.machineshop ? big(s) : 600, why: s => !s.built.housing ? 'the pods' : 'streets with no metal of its own to put up more' },
  water:  { n: s => s.built.wells ? big(s) : LF.down(s, 'reclaimer') ? 280 : 130, why: s => LF.down(s, 'reclaimer') ? 'what the reclaimer can clean' : 'water carried by hand' },
  power:  { n: s => s.built.turbines || s.flags.builders_power ? big(s) : LF.down(s, 'reactor') ? 1500 : 220, why: s => LF.down(s, 'reactor') ? 'one reactor' : 'no power to speak of' },
  care:   { n: s => s.built.school ? big(s) : 340, why: () => 'no school and no clinic' },
  ground: { n: s => s.built.fields ? big(s) : s.built.greenhouse ? 420 : 260, why: s => s.built.greenhouse ? 'what grows under glass' : 'the trial plots' },
};
LF.OUTLYING = [];   // satellite settlements: push s => how many more people they make room for
LF.capacity = function (s) {
  let own = Infinity, by = null;
  for (const k in LF.LIMITS) { const n = LF.LIMITS[k].n(s); if (n < own) { own = n; by = k; } }
  const out = LF.OUTLYING.reduce((a, fn) => a + (fn(s) || 0), 0);
  return { n: own + out, own, out, by, full: own >= big(s) };
};
LF.roomFor = s => { const c = LF.capacity(s).n; return clamp((c - LF.heads(s)) / (c * 0.33), 0, 1); };
/* How big to draw it: 0 a camp, 1 a village (200), 2 a town (1,000), 3 a large town (5,000), 4 a city (15,000). */
LF.cityTier = s => { const h = LF.heads(s); return h >= 1200 ? 4 : h >= 600 ? 3 : h >= 300 ? 2 : h >= 150 ? 1 : 0; };   // a camp, a village from 150, a town from 300, 600, 1,200 (was 200 to 15,000 when the rate reached tens of thousands)

/* ---------- births ---------- */
LF.birthRate = function (s) {
  if (!s.world || LF.aloft(s) || s.day - landed(s) < FIRST) return 0;
  const F = LF.fertile(s), fd = LF.h.foodDays(s);
  let r = (F.found * B_FOUND + F.born * B_BORN) * LF.heart(s) * clamp((fd - 30) / 60, 0, 1) * LF.roomFor(s);
  for (const fn of LF.BIRTH_MODS) r *= fn(s);
  return Math.max(0, r);
};
LF.GEN_ON = { birth: [], ofAge: [] };
LF.KID_RISK = [];   // push s => a multiplier on how easily the small ones die (what the school teaches, what the clinic learned: js/content-generations.js)
LF.bear = function (s, n, by) {
  n = Math.round(n); if (n <= 0) return;
  const G = LF.gen(s), y = LF.date(s.day).year;
  G.co[y] = (G.co[y] || 0) + n; G.kids += n; G.n += n; G.yb += n; G.last = s.day;
  if (G.n > n) s.morale = clamp(s.morale + Math.min(2, 0.5 * n / LF.scale(s)), 0, 100);   // a child in the colony: a little hope, as written for a colony of two hundred
  if (!G.first) { G.first = s.day; LF.chron(s, `The first child conceived on ${s.world.planet} was born.`); LF.log(s, `A child was born in the ${s.built.school ? 'clinic' : 'pods'} last night, the first conceived on ${s.world.planet}. Half the colony has been past to look.`, 'good');
    s.morale = clamp(s.morale + 3, 0, 100); }
  for (const fn of LF.GEN_ON.birth) fn(s, n, by);
};
/* Children die or are lost: the youngest first unless eldest is set. Returns how many. */
LF.loseYoung = function (s, n, eldest) {
  const G = LF.gen(s); let left = Math.min(Math.round(n), G.kids), took = 0;
  const ys = Object.keys(G.co).map(Number).sort((a, b) => eldest ? a - b : b - a);
  // a large loss falls across every age; a small one on the end it was aimed at
  if (left > 20 && G.kids > 0) { const f = left / G.kids; for (const y of ys) { const d = Math.min(G.co[y], Math.floor(G.co[y] * f)); G.co[y] -= d; left -= d; took += d; } }
  for (const y of ys) { if (left <= 0) break; const d = Math.min(G.co[y], left); G.co[y] -= d; left -= d; took += d; }
  for (const y of ys) if (!G.co[y]) delete G.co[y];
  G.kids -= took; return took;
};

/* ---------- the tick ---------- */
LF.genTick = function (s) {
  if (!s.world || LF.aloft(s)) return;
  if (!s.landed) s.landed = s.day;
  const G = LF.gen(s), y = LF.date(s.day).year;
  // the turn of the year: whoever is twelve is grown
  if (y !== G.y) { G.y = y; let n = 0;
    for (const k of Object.keys(G.co)) if (y - +k >= LF.AGE) { n += G.co[k]; delete G.co[k]; }
    if (n) { G.kids -= n; s.pop += n; G.born += n;
      if (!G.ofAge) { G.ofAge = s.day; LF.chron(s, `The first children born on ${s.world.planet} came of age and were given tools.`); LF.storyPoint(s); }
      LF.log(s, n === 1 ? `One of the children born here turned ${AGEW} at the turn of the year, and is on the work roster.` : `${LF.num(n)} of the children born here turned ${AGEW} at the turn of the year, and are on the work roster.`, 'good');
      for (const fn of LF.GEN_ON.ofAge) fn(s, n); }
    // A chair left empty "for good" was the founders' promise. Once most of the grown were born here, nobody alive made it.
    if (!G.chairs && G.born > s.pop / 2) { G.chairs = s.day; let any = 0;
      for (const k of LF.SEAT_ORDER) if (s.flags['nopromote_' + k] && !LF.officer(s, k) && LF.altOf(s, k)) { delete s.flags['nopromote_' + k]; s.flags['due_' + k] = s.day + any * 8 * MONTH; any++; }   // one chair at a time, eight months apart; only where a deputy is left to take it
      if (any) LF.log(s, 'Most of the grown were born here now. They have started asking why there are chairs at the council table that nobody is allowed to sit in.'); } }
  // the implants come out when the fields can feed a child (pol.births, "not until the fields can feed them")
  if (s.flags.births_deferred && s.built.fields && LF.h.foodDays(s) > 60) { s.flags.births_deferred = false;
    LF.log(s, 'The fields are in and the store is holding. The clinic has started taking the implants out, for anyone who asks.', 'good'); }
  G.born = Math.min(G.born, s.pop);
  // births: so many a year, counted out evenly, with no dice
  G.acc += LF.birthRate(s) / YEAR;
  if (G.acc >= 1) { const n = Math.floor(G.acc); G.acc -= n; LF.bear(s, n); }
  if (s.day % MONTH) return;
  // the small ones die more easily than the grown: about one in fifty a year with a clinic, one in twenty without, and three times that in a famine
  if (G.kids) { G.cm += G.kids * (s.built.school ? 0.02 : 0.05) * (s.res.food <= 0 ? 3 : 1) * LF.KID_RISK.reduce((a, fn) => a * fn(s), 1) / 12;
    if (G.cm >= 1) { const n = Math.floor(G.cm); G.cm -= n; const d = LF.loseYoung(s, n); s.deaths += d; const w = d / LF.scale(s); s.grief = Math.min(40, s.grief + 3 * w); } }
  // the cradles are empty: people of an age to have children, and none born in a year (not while the clinic's list is full of
  // women at term and nothing born: s.flags.qk_open, js/thread-quickening.js)
  const F = LF.fertile(s), since = s.day - Math.max(G.last || 0, landed(s) + FIRST);
  if (F.found + F.born >= 20 && since >= YEAR && !s.flags.qk_open) LF.emit(s, 'cradles', 'gen', clamp(40 + (since - YEAR) / YEAR * 30, 40, 90), MONTH + 5,
    G.n ? `no child has been born here in ${since >= 2 * YEAR ? 'years' : 'a year'}` : 'no child has ever been born here');
};
LF.cradlesEmpty = s => LF.cv(s, 'cradles') >= 40;

/* ---------- in words: one line for the People view and the recap ---------- */
const AGEW = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'][LF.AGE];
LF.ageWord = AGEW;
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen'];
const count = n => n < W.length ? W[n] : LF.num(n);
LF.genLine = function (s) {
  if (!s.world || LF.aloft(s)) return '';
  const G = LF.gen(s), C = LF.children(s), out = [];
  if (!C.n) out.push(s.day - landed(s) < FIRST ? 'No child has been born here yet.' : 'There are no children in the colony.');
  else if (!C.born) out.push(`${C.ship === 1 ? 'One child' : count(C.ship).replace(/^./, x => x.toUpperCase()) + ' children'} came down on the ship. None has been born here yet.`);
  else out.push(`${C.born === 1 ? 'One child has' : count(C.born).replace(/^./, x => x.toUpperCase()) + ' children have'} been born here and ${C.born === 1 ? 'is' : 'are'} not yet grown${C.eldest >= 2 ? `, the eldest ${count(C.eldest)}` : ''}${C.ship ? `; ${count(C.ship)} more came down on the ship` : ''}.`);
  if (G.born) out.push(`${G.born === 1 ? 'One' : count(G.born).replace(/^./, x => x.toUpperCase())} of the grown ${G.born === 1 ? 'was' : 'were'} born on ${s.world.planet}.`);
  if (LF.cradlesEmpty(s)) out.push(`${LF.because(s, 'cradles').replace(/^./, x => x.toUpperCase())}.`);
  const cap = LF.capacity(s), h = LF.heads(s);
  if (h > cap.n * 0.67) out.push(cap.full ? `The valley is filling: it will hold about ${LF.num(Math.round(cap.n / 1000) * 1000)}.` : `There is room here for about ${LF.num(Math.round(cap.n / 10) * 10)}, and what sets it is ${LF.LIMITS[cap.by].why(s)}.`);
  return out.join(' ');
};
/* The year's births, for the recap; reading it starts the next year's count. */
LF.genYear = function (s, keep) { const G = LF.gen(s), n = G.yb; if (!keep) G.yb = 0; return n; };
})();

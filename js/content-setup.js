/* Landfall — before the descent: who is woken first, and what goes in the hold.
   Five short cards between orbit and the landing site. Three seats, each a choice between two of the officers,
   with what each believes and wants in plain sight; then two holds. Every thread reads the answers later. */
(function () {
'use strict';
const { add, h } = LF; const { byPid } = h;
const ORD = ['first', 'second', 'third'];

/* The six officers are all on the slate (officers.js). s.slate lists them in seat order; the three who are not given
   a seat stay in orbit (p.orbit) until a shuttle run brings them down. */
LF.makeSlate = function (s) {
  const pool = LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(Boolean);
  if (pool.length < 6) return false;
  s.slate = [pool.map(p => p.id)];
  pasts(s);
  return true;
};
/* What an officer on the first-flight pick does for the colony, and the strength they were chosen for (Lachlan, 2026-11-19: trimmed from their nature). */
const wakeNote = p => LF.SEATS[p.seat].does;   // no strength line here (Lachlan, 2026-11-19): it is shown on the crew pick
/* A line of past. The six have their own (LF.OWN_PAST, by p.key), written against LF.BIO, their nature, the portraits and the
   watch scheme: two or three each, one drawn per run. LF.PAST is for a colonist raised to an empty seat (LF.pastOf): a sleeper's
   past, so nothing in it happens awake on the voyage and nobody in it is an officer or a captain. */
LF.OWN_PAST = {
  solheim: ['Once brought a freighter in to the outer stations by hand, nine days after her main engine died.', 'Was offered a desk after twenty years of freight, and signed on to the Ariadne the same week.',
    'Has kept a notebook since her first command, and has never let anyone read a page of it.'],
  dahl: ['Got the scar through his eyebrow on the launch docks, from a man with a forged boarding pass.', 'Ran security on the launch docks through the last year of boarding, when half of Earth wanted a berth.',
    'Caught eleven stowaways on the launch docks, and remembers what each of them said.'],
  kovacs: ['Worked six years in the yard that built the Ariadne, and can still find his own welds in her.', 'Left a daughter on Earth, and carries a wrench she painted yellow that nobody else may use.',
    'Turned down a berth on an earlier ship because he didn\'t trust the yard that built her.'],
  nakamura: ['Was written up on Earth for operating through an evacuation order, with the patient alive at the end of it.', 'Lost most of a ward in one flood summer on Earth, and was back at work the next morning.',
    'Signed on the day the manifest opened, before anyone had told her what a surgeon would be paid.'],
  yurbin: ['Spent fifteen years on the life around deep-sea vents, because it was the strangest he could get to.', 'Applied to the mission four times, and was taken on the fourth.',
    'Brought forty specimen jars aboard in his own mass allowance, and left most of his clothes behind.'],
  estrada: ['Was the last of his family to leave the farm, and walked out with the sea at his knees.', 'Kept every fast through the two waking years out from Earth, and worked the hydroponics bay on the days he didn\'t eat.',
    'Has carried a tin of seed from his family\'s farm since the sea took it, and has not yet planted any.'],
};
LF.PAST = ['Grew up on an orbital farm and has never stood under an open sky.', 'Was second choice for the mission, and knows it.', 'Lost a partner to a cryo fault on the voyage.',
  'Ran a field hospital in a war nobody back home remembers.', 'Signed on to get away from a family that did not want them back.',
  'Taught children for twenty years before the mission.', 'Built dams on Earth, one of which failed.', 'Was a deep-sea diver before there was a ship to dive from.', 'Came from a desert town that ran out of water.',
  'Trained for a different world, and has not forgiven this one.',
  'Has a brother still asleep in orbit.', 'Left a twin on Earth, and talks to them out loud.', 'Wrote half the mission plan, and is not proud of it.', 'Was a priest once, and is not sure what now.',
  'Mined asteroids for a company that no longer exists.', 'Was decorated for something they never talk about.', 'Grew up in a refugee camp on the Ganges delta.', 'Played the cello for a city orchestra, badly, and loved it.',
  'Spent four years in prison for something they did.', 'Was a ranger in the last national park on Earth.', 'Raised three children who stayed behind.', 'Kept bees on a rooftop for thirty years.',
  'Volunteered the day the mission was announced, and every day after until they were taken.', 'Lost a hand in training, and works better with the one that is printed.', 'Cooked for a research station in Antarctica for nine winters.',
  'Sold insurance for fifteen years and still reads the small print on everything.', 'Was the mission\'s last-minute replacement, three days before launch.',
  'Grew up on a fishing boat in the North Sea and gets seasick on land.', 'Ran for mayor of a flooded city, and lost to someone who promised to pump it dry.', 'Was a union organiser on the orbital docks.',
  'Studied to be a vet, and still talks to machines as if they were animals.', 'Has never told anyone their real age.',
  'Was thrown out of the academy once, and let back in when they ran short.', 'Spent two years alone in a Martian relay station and liked it.',
  'Built racing drones as a teenager, and crashed most of them.', 'Testified against a company back home, and left before the verdict.',
  'Was a translator at three peace talks that all failed.', 'Lost a whole village to a heat wave, and still sleeps with the window open.',
  'Climbed every mountain in the Andes over five thousand metres, alone.', 'Was a prison guard before this, and does not talk about it.', 'Reads the same three novels over and over, in rotation.',
  'Swapped places on the manifest with a friend who wanted to stay, and has not decided whether that was kind.', 'Was the mission\'s public face for a year of interviews, and hated every one.', 'Delivered eleven babies in a flooded hospital with the power out.'];
/* One draw each from the people stream, as before, so nothing else in a game moves. */
const pasts = s => { for (const p of s.people) if (p.role && !p.past) { const r = LF.srand(s), own = LF.OWN_PAST[p.key]; if (own) p.past = own[Math.floor(r * own.length)]; } };
/* The past to show. One of the six in an old save still carries a line from the old shared pool: it reads as one of their own.
   A promoted colonist gets a line from LF.PAST by a hash of the name: no dice, no state. */
const nameHash = p => { let h = 0; for (const ch of p.name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
LF.pastOf = p => { if (!p) return '';
  const own = LF.OWN_PAST[p.key]; if (own) return own.includes(p.past) ? p.past : own[nameHash(p) % own.length];
  return p.past || (p.promoted ? LF.PAST[nameHash(p) % LF.PAST.length] : ''); };

const and3 = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
/* Who goes down first: three of the six, marked on one card and confirmed (st.pick, LF.pickConfirm). */
const slot = k => ({
  show: s => { const p = byPid(s, s.slate[0][k]); return !!p && p.alive; },
  label: s => { const p = byPid(s, s.slate[0][k]); return `${p.name}, ${LF.title(p)}`; },
  note: s => wakeNote(byPid(s, s.slate[0][k])), officer: true,
  info: s => [['people', LF.SEATS[byPid(s, s.slate[0][k]).seat].name]], pid: s => s.slate[0][k] });
add({ id: 'setup.wake1', view: 'people', arc: 'setup', tone: 'council', chain: true, title: 'Who Goes Down First', pick: 3, pickLabel: 'Take these three down',
  text: s => { const n = s.people.filter(p => p.seat && p.role && p.alive).length, W = ['none', 'one', 'two', 'three', 'four', 'five', 'six']; return `The ${s.world.ship} holds orbit, and all ${W[n]} of your officers are awake for it. The lander goes down once with the reactor and the first ${LF.num(s.pop)}, and it has seats for three of ${n === 6 ? 'the six' : `them. ${W[6 - n].charAt(0).toUpperCase() + W[6 - n].slice(1)} of the six did not live to see orbit, and nobody has ${6 - n === 1 ? 'that seat' : 'those seats'}`}. The three you take run the colony's first months with you. Each of them is one department that works from the first day.\n\nThe other ${n - 3 === 1 ? 'one stays' : W[n - 3] + ' stay'} aboard and keep${n - 3 === 1 ? 's' : ''} the ship: the sleepers, the systems still in the hold, the lander's turnarounds. Each shuttle run can bring one of them down, and the lander has ${s.fuel ? `fuel for ${W[Math.min(6, s.fuel)]} more after this one` : 'no fuel for any run after this one'}. Whatever they are for, the colony does badly without it until they are down.\n\nChoose three.`; },
  choices: [0, 1, 2, 3, 4, 5].map(slot),
  confirm: (s, c, picked) => { const go = picked.map(k => byPid(s, s.slate[0][k])), stay = s.people.filter(q => q.seat && q.alive && !go.includes(q));
    return { label: and3(go.map(p => p.name)), then: 'setup.load',
      text: `${and3(go.map(p => p.name))} are brought up out of the cold, and are on the lander's manifest by midnight.\n\n${and3(stay.map(q => q.name))} stay${stay.length === 1 ? 's' : ''} aboard to run the ship. ${and3(stay.map(q => LF.SEATS[q.seat].name))} below will be run by whoever is next on the list, until a shuttle run brings its officer down.`,
      fx: { do: s2 => { for (const p of go) { p.watch = true; p.loyal = Math.min(100, p.loyal + 19); for (const q of go) if (q.id < p.id) LF.bond(s2, p, q, 'friend', 'came down on the first flight'); }
        for (const q of s2.people) if (q.seat && q.alive && !q.watch) { q.orbit = true; q.away = true; } /* nobody is put out by staying aboard (Lachlan, 2026-11-21) */ } } }; } });

/* ---------- a seat on the lander: every flight brings one officer down from orbit (officers.js) ---------- */
const up3 = (s, c, k) => byPid(s, (c.ids || [])[k]);
const DOWN = [p => `${p.name} comes down the ramp behind the sleepers, stands in the mud for a while looking at the sky, and asks where the work is.`,
  p => `${p.name} is the last one off, carrying a kit bag packed forty years ago, and has found the right department before the engines are cold.`,
  p => `${p.name} walks the whole camp before saying anything to anyone, and by the evening meal is giving orders.`];
add({ id: 'seat.down', view: 'people', arc: 'sleepers', tone: 'council', chain: true, preflight: true, repeat: 1, title: 'A Seat on the Lander',
  setup: s => ({ ids: LF.inOrbit(s).map(p => p.id), then: null }),
  text: (s, c) => { const n = (c.ids || []).length;
    return `The lander is docked at the ${s.world.ship}'s spine, the sleepers strapped in for the drop. One seat is kept for an officer, and ${n === 1 ? `${up3(s, c, 0).name} is the last of them still aboard` : `${n === 2 ? 'two' : 'three'} of yours are still aboard`}.\n\n${n === 1 ? 'There is nobody else to choose.' : `Whoever doesn't take the seat waits for the next flight. After this one the tanks hold ${s.fuel ? `${s.fuel} more` : 'nothing'}${s.fuel ? '' : ': the next flight burns food'}.`}`; },
  choices: [0, 1, 2].map(k => ({ show: (s, c) => !!up3(s, c, k),
    label: (s, c) => { const p = up3(s, c, k); return `${p.name}, ${LF.title(p)}`; },
    note: (s, c) => wakeNote(up3(s, c, k)), officer: true,
    info: (s, c) => [['people', LF.SEATS[up3(s, c, k).seat].name]],
    out: { then: (s, c) => c.then, text: (s, c) => { const p = up3(s, c, k); return p ? DOWN[Math.abs(s.seed + k + (s.flights || 0)) % DOWN.length](p) : ''; },
      fx: (s, c) => ({ do: s2 => LF.bringDown(s2, up3(s2, c, k)) }) } })) });

const hsh = t => { let x = 2166136261; for (const c of String(t)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
const NUMW = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];
/* ---------- what rides with the reactor (Lachlan, 2026-11-21) ----------
   One card, pick two of four, and then the lander goes down. It replaces the first-flight system card (setup.sys), the two
   holds (setup.hold1, setup.hold2: eighteen things, three offered a hold) and the card for the landing ground: the site is
   chosen in orbit, one of the planet's two, and the lander sets down on that site's own ground (LF.touchdown, content-core.js).
   Nothing here is a trap and nobody is put out by it: what is not taken waits aboard for a later flight.
   One more thing is always aboard, lashed in by the ramp before anyone is asked: a crate from the ship's stores, dealt
   by the seed (CRATES; no dice), so the first season still differs from run to run (the "what it brought" opening cards). */
const CRATES = {
  arms:     ['the arms locker, forty rifles in sealed cases', { morale: -1 }],
  drones:   ['six survey drones and their charging rack', { survey: 22, yield: 0.015 }],
  genebank: ['the gene bank, four thousand seed lines in a cold chest', { yield: 0.03 }],
  archive:  ['the archive, nine racks of storage and a screen for the mess', { morale: 4, yield: 0.015 }],
  spares:   ['a crate of ten spare parts that cannot be made here', { parts: 10 }],
  workshop: ['a lathe, a mill and a press', { machine: { fabricator: 12 }, cap: { fabricator: 8 }, parts: 6 }],
  seedlings:['three hundred trays of live seedlings under grow lamps', { food: 160, yield: 0.03 }],
  rover:    ['a ground rover on its pallet', { survey: 22, mat: 35, yield: 0.01 }],
  fuel:     ['two tanks of propellant, enough for a third flight', { machine: { lander: 20 }, cap: { lander: 8 } }],
  rations:  ['pallets of ship\'s rations in grey foil', { food: 320 }],
  radio:    ['a listening array, a folding mast and a dish', { survey: 12, morale: 2 }],   // key stays 'radio' (s.cargo.radio, op.mast)
  band:     ['the band\'s instruments, a piano with its legs off among them', { morale: 6 }],
  lab:      ['a field laboratory packed in foam', { survey: 8 }],
};
const crateOf = s => { const k = Object.keys(CRATES); return k[hsh(s.seed + '/crate') % k.length]; };
const crateFx = key => s2 => { s2.cargo[key] = 1;
  if (key === 'fuel') s2.fuel = (s2.fuel || 0) + 1;
  if (key === 'lab') for (const f of s2.factors) if (LF.KINDS[f.kind] && !f.dormant) f.insight = LF.clamp((f.insight || 0) + 10, 0, 100); };
const bringSys = (s2, id) => { const m = s2.machines[id]; if (m && !m.lost) { m.up = false; LF.log(s2, `The ${LF.MACHINES[id].name} is down from the ship and working.`, 'good'); } };
const LOADS = [
  { k: 'hydro', label: 'The hydroponics bay', note: 'It feeds about two dozen whatever the ground does. It is worth most where food is hard to start: ice, bare rock, jungle.', info: [['yield', 'Food from the first month']],
    say: 'the hydroponics bay', down: 'The hydroponics racks are bolted into a cargo pod by dark, and the first trays are seeded before anyone eats.',
    fx: {}, act: s2 => { bringSys(s2, 'hydroponics'); s2.cargo.racks = 1; } },
  { k: 'plate', label: 'Hull plate and tools', note: 'Cut plate, beams and hand tools, so that building can start sooner and go further.', info: [['yield', 'Materials to build with']],
    say: 'the plate', down: 'The plate comes off the ramp in slings and is stacked in a yard behind the lander, more of it than the colony will have in one place again.',
    fx: { mat: 110 }, act: s2 => { s2.cargo.plate = 1; } },
  { k: 'doc', label: 'The autodoc', note: 'Surgery and diagnosis. Without it a wound or a fever is treated from a field kit, and more of them kill.', info: [['yield', 'Fewer lost to sickness and injury']],
    say: 'the autodoc', down: 'The autodoc comes down wrapped in foam like a coffin, with a field ward packed round it. By evening it has its first patient.',
    fx: {}, act: s2 => { bringSys(s2, 'medbay'); s2.cargo.medkit = 1; } },
  { k: 'hands', label: 'Twenty more colonists', note: 'Twenty woken from the banks and strapped in beside the first party, for building and for the parties you send out. They are twenty more mouths from the first day.', info: [['people', '+20 colonists']],
    req: s => s.sleepers >= 20, reqText: 'Fewer than twenty are left asleep', say: 'twenty more colonists', down: 'The twenty come down the ramp grey from the thaw, and are given a meal and a job in that order.',
    fx: { pop: 20, sleepers: -20 }, act: s2 => { s2.cargo.hands = 1; } },
];
add({ id: 'setup.load', view: 'colony', arc: 'setup', tone: 'council', chain: true, title: 'What Rides With the Reactor', pick: 2, pickLabel: 'Load these two',
  setup: s => ({ crate: crateOf(s) }),
  text: (s, c) => `The lander goes down once, with the reactor, your three officers and the first ${LF.num(s.pop)} colonists. There is room beside the reactor for two more loads. Whatever is left stays aboard the ${s.world.ship} until a later flight can fetch it, and the lander has fuel for ${NUMW[Math.min(6, s.fuel || 2)]} more.\n\nAlready lashed in by the ramp: ${CRATES[c.crate][0]}.\n\nChoose two.`,
  choices: LOADS.map(L => ({ label: L.label, note: L.note, info: L.info, req: L.req, reqText: L.reqText })),
  confirm: (s, c, picked) => { const L = picked.map(i => LOADS[i]), T = LF.touchdown(s), dead = fallen(s).length && !s.used['land.eulogy'];
    const fx = { do: s2 => { for (const x of L) x.act(s2); crateFx(c.crate)(s2); T.act(s2); } };
    for (const src of L.map(x => x.fx).concat([CRATES[c.crate][1], T.fx])) for (const k in src) {
      if (typeof src[k] === 'number') fx[k] = (fx[k] || 0) + src[k]; else if (k === 'flags' || k === 'machine' || k === 'cap') fx[k] = Object.assign({}, fx[k], src[k]); else fx[k] = src[k]; }
    return { label: `${L[0].label} and ${L[1].say}`, then: dead ? 'land.eulogy' : 'plan',
      text: `The cradles are bolted in beside the reactor and the manifest is closed. The lander drops out of the hangar bay on the night side and comes down on ${T.name}.\n\n${T.text}\n\n${L[0].down} ${L[1].down}`, fx }; } });

/* ================= THE CROSSING =================
   Between choosing a star and making orbit (tightened 2026-11-21, Lachlan). LF.embark works out what the burn costs.
   Then two things go wrong on the way, one in each half of the crossing, whatever its length, drawn from twenty
   incidents (LF.crossing): the fifteen any crossing can meet and the premise's own, which is the likeliest single one
   and never certain. The card that set how the ship crossed ("the ways across", voy.plan: the watch, the engine, bank D,
   the oldest sleepers) is gone, and with it the modes and their modifiers: the watch is kept as it was on the way out.
   Then the world gets a name (arrive.name).

   Every incident is three options at most and the same shape, so the player is choosing what to spend, not looking
   for the trick: a sure cost, a gamble, and often an order that spends something else instead (a machine, sleepers,
   an officer's safety). The costs are on one scale, so that no option is the obvious one:
     a sure cost is about 150 to 220 food, or four or five sleepers, or eight to ten off one machine, or some plate;
     a gamble (base 50) costs nothing if it comes off and about twice the sure cost if it does not;
     an order that risks an officer (base 60) costs nothing if it comes off. If it does not they are badly hurt, or
     dead about half the time (c.fate, thrown when the card is dealt so the words and the effect agree).

   The key crew (Lachlan, 2026-11-17; DESIGN.md "The key crew and the watch"): the ship is kept by the six officers, two
   awake at a time, each for two years: a year with the one before and a year with the one after (LF.watchOf). An
   incident happens to the two who have the watch that year, by name; they wake you, and whichever officer the trouble
   belongs to (the incident's seat). Never more than two of the six are lost before landfall (FLOOR). */
const V = s => s.voyage || {};
const allMachines = (s, d) => { for (const id in s.machines) LF.hurt(s, id, d); };
const he = p => LF.he(p), him = p => LF.him(p), his = p => LF.his(p);   // whoever holds the seat, any of the twelve
// The first name of whoever holds a seat now, for narration that names an officer (any of the twelve can hold it).
const fo = (s, seat) => { const p = LF.officer(s, seat); return p ? p.first : 'the ' + LF.SEATS[seat].lead; }, Fo = (s, seat) => { const t = fo(s, seat); return t.charAt(0).toUpperCase() + t.slice(1); };
const living = s => s.people.filter(p => p.seat && p.role && p.alive);
/* The order the six stand their watches in, fixed for the game from the seed (no dice). */
LF.watchRing = function (s) { const v = s.voyage; if (!v) return living(s);
  if (!v.ring) { const k = LF.SEAT_ORDER.slice(); let x = hsh(s.seed + '/watch'); for (let i = k.length - 1; i > 0; i--) { const q = x % (i + 1); [k[i], k[q]] = [k[q], k[i]]; x = Math.imul(x ^ (x >>> 13), 0x5bd1e995) >>> 0; } v.ring = k; }
  return v.ring.map(seat => living(s).find(p => p.seat === seat)).filter(Boolean); };
/* The two awake in a given year of the crossing. */
LF.watchOf = function (s, yr) { const r = LF.watchRing(s), n = r.length; return n < 3 ? r.slice() : [r[yr % n], r[(yr + 1) % n]]; };
const W = (s, c) => (c.w || []).map(id => byPid(s, id)), X = (s, c) => byPid(s, c.sp);
const FLOOR = 4;
/* Does the bad turn kill? q: the chance; n: how many it would take. */
const dies = (s, c, q, n) => c.fate < q && living(s).length - (n || 1) >= FLOOR;
const lost = (p, cause) => ({ who: p.id, cause: cause + ', on the crossing' });
const fell = (...ps) => s2 => { for (const p of ps) { const q = byPid(s2, p.id); if (q) q.fell = 'crossing'; } };
const six = (k, d) => LF.SEAT_ORDER.map(seat => [seat, k, d]);
const awake = (s, c) => { const [a, b] = W(s, c), x = X(s, c);
  return `${a.first} and ${b.first} have the watch this year, with the other ${NUMW[c.rest] || 'few'} of your officers in the cold. ${c.woke ? `They have woken ${x.first} for it, and you.` : 'They have woken you.'}`; };
const longer = (s, f) => Math.max(1, Math.round(s.world.transit.years * f));
const yrs = n => `${n} year${n > 1 ? 's' : ''}`;
/* Each premise has its own trouble. Five of them only that premise can meet (they are about what stopped the ship);
   bank C and the bearing can happen to anyone. */
const OWN = { dead: 'voy.wake', meteor: 'voy.patch', engine: 'voy.bearing', cryo: 'voy.cryo', claimed: 'voy.pursuit', astray: 'voy.drift', bloom: 'voy.mould' };
const ONLY = ['voy.wake', 'voy.patch', 'voy.pursuit', 'voy.drift', 'voy.mould'];
const INCS = [];   // every incident, in the order written
/* Two different incidents, the premise's own three times as likely as any other one (it turns up in about a third of
   that premise's crossings). */
function drawIncidents(s) { const own = OWN[s.premise], out = [];
  while (out.length < 2) { const pool = INCS.filter(id => !out.includes(id) && (id === own || !ONLY.includes(id))).map(id => [id, id === own ? 3 : 1]);
    let r = LF.rand(s) * pool.reduce((a, x) => a + x[1], 0), id = pool[0][0];
    for (const [k, w] of pool) { r -= w; if (r <= 0) { id = k; break; } }
    out.push(id); }
  return out; }
/* The crossing begins (LF.land, core.js): the two incidents are drawn and the first is dealt. */
LF.crossing = function (s) { const q = drawIncidents(s); s.voyage.incs = q; s.voyage.inc = q[0]; LF.fire(s, q[0]); };

/* An incident: the year it happens in (the first in the first half of the crossing, the second after it), who has the
   watch that year (c.w), whose trouble it is (seat: that officer is c.sp, woken for it if not on watch; c.own says the
   seat's own officer is alive to be it), the dice for anyone who goes in person (c.fate), and where it leads: the next
   incident, or orbit. */
const yearOf = (s, id) => { const q = V(s).incs || [], k = q.indexOf(id), Y = s.world.transit.years, half = Math.floor(Y / 2);
  const lo = q.length > 1 && k === 1 ? Math.min(Y - 1, half + 1) : 2, hi = q.length > 1 && k === 0 ? Math.max(lo, half) : Math.max(lo, Y - 1);
  return lo + Math.floor(LF.rand(s) * (hi - lo + 1)); };
const inc = (id, title, seat, o) => { INCS.push('voy.' + id); return add(Object.assign({ id: 'voy.' + id, arc: 'setup', view: 'colony', tone: 'pressure', chain: true, title,
  setup: s => { const yr = yearOf(s, 'voy.' + id), w = LF.watchOf(s, yr), x = LF.officer(s, seat) || w[0];
    return Object.assign({ yr, w: w.map(p => p.id), sp: x.id, own: x.seat === seat, woke: !w.includes(x), rest: Math.max(0, living(s).length - 2), fate: LF.rand(s) }, o.more ? o.more(s) : {}); } }, o)); };
const year = (s, c) => `Year ${c.yr} of the crossing.`;
const after = s => { const q = V(s).incs || [], k = q.indexOf(s.cur.id); return (k >= 0 && q[k + 1]) || 'arrive.name'; };
const end = fx => Object.assign({ then: after }, fx);
const hurt = (p, d) => ({ off: [[p.id, 'body', d]], chips: [[`${p.first} is badly hurt`, false]] });

inc('cryo', 'Bank C', 'command', {
  text: (s, c) => `${year(s, c)} ${s.premise === 'cryo' ? 'It is bank C again.' : 'There is an alarm in the cryo bay.'} A coolant line has split above forty sleepers, and their pods are warming by a degree an hour.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Cool the bank off the reactor\'s own loop', note: 'No sleeper is lost. The reactor runs hot for a month to do it, and its pumps are never the same afterwards.', info: [['yield', 'All forty'], ['danger', 'The reactor']],
      out: end({ text: (s, c) => `${W(s, c)[0].first} runs a line from the reactor's coolant loop to the split and holds the bank cold on it for a month, while the pipe is made good from stock cut out of the galley. The forty sleep through it. The reactor's pumps have run a month past their rating, and sound like it.`, fx: { parts: -2, machine: { reactor: -8 } } }) },
    { label: 'Move the forty to a sound bank, pod by pod', note: 'It costs nothing if it is done in time, and it is one trolley and four hundred metres of spine.', info: [['fail', 'Whoever is still in the row when the time runs out']], test: { base: 50, mods: [] },
      ok: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} walk forty pods down the spine of the ship on a hand trolley and plug them in one at a time, with you on the cables. None are lost.` }),
      bad: end({ text: (s, c) => `The trolley takes one pod at a time and the warming does not wait. Ten are past saving when their turn comes, and ${W(s, c)[1].first} is still pushing when ${W(s, c)[0].first} says to stop.`, fx: { sleepers: -10 } }) },
    { label: 'Shut off the worst row and save the rest', dark: true, note: (s, c) => `Six sleepers die, for certain, and ${X(s, c).first} has to pick which row is the worst. Nothing else aboard is touched.`, info: [['yield', 'Thirty-four, for certain'], ['danger', 'Six sleepers']],
      out: end({ text: (s, c) => `${X(s, c).first} picks the row. The six pods nearest the split are shut off and their coolant fed to the others. ${X(s, c).first} writes the six names in the log by hand.`, fx: (s, c) => ({ sleepers: -6, stain: ['row', 1], off: [[c.sp, 'mind', -4]] }) }) },
  ] });
inc('patch', 'The Patch', 'engineer', {
  text: (s, c) => `${year(s, c)} The patch over the meteor hole has lifted at one corner, and the forward section is losing air.\n\n${awake(s, c)}${c.own ? `\n\n[[${c.sp}]] "That corner's past any line we've got." "I can reach it loose. I'd want it in the log that I said what I think of that."` : ''}`,
  choices: [
    { label: 'Seal the forward section for good', note: 'Whatever is stored forward of the doors is lost.', info: [['danger', 'Plate, and the forward seed lockers']],
      out: end({ text: 'The doors are welded shut. The plate stock in the forward bays stays where it is, in vacuum, for good, and so do the forward seed lockers. The colony will sow less than it meant to.', fx: { mat: -14, food: -60 } }) },
    { label: (s, c) => `Send ${X(s, c).first} out with no tether`, about: true, dark: true, note: (s, c) => `The corner is past the reach of a line. ${X(s, c).first} knows that, and has said so.`, info: (s, c) => [['yield', 'The forward section, whole'], ['fail', X(s, c).first]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `The corner is welded down under a second plate, and it holds. ${X(s, c).first} comes in along the hull hand over hand and does not speak to you for the rest of the watch.`, fx: { stain: ['ordered_out', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c), a = W(s, c).find(p => p !== x) || W(s, c)[0];
          return dies(s, c, 0.5) ? `${x.first} loses the hull at the torn edge of the patch, with nothing to come back on. ${a.first} finishes the weld on a line that does not reach, with a second line tied to the first, and does not look aft.`
            : `${x.first} loses the hull at the torn edge of the patch. ${a.first} gets a thrown line to ${him(x)} on the third try and hauls ${him(x)} in with a shoulder out and a suit holding by one seam. The weld is finished the slow way.`; },
        fx: (s, c) => dies(s, c, 0.5) ? { kill: [lost(X(s, c), 'lost off the hull at the meteor patch')], morale: -2, stain: ['ordered_out', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -28), { mat: -6, stain: ['ordered_out', 1] }) }) },
    { label: 'Carry the stores aft, then pump the section down', note: 'A week of the air plant running flat out to save the air while the stores are carried through. Nothing forward is lost, and the reclaimer is worn by it.', info: [['yield', 'The stores forward'], ['danger', 'The reclaimer']],
      out: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} carry the forward stores aft by hand while the reclaimer pulls the section's air back faster than the hole can lose it. Then the doors are shut on an empty section. The reclaimer has done a year's work in a week.`, fx: { machine: { reclaimer: -9 }, cap: { reclaimer: -3 } } }) },
  ] });
inc('bearing', 'The Third Bearing', 'engineer', {
  text: (s, c) => `${year(s, c)} ${s.premise === 'engine' ? 'This engine was promised one burn, and it is not finished yet. ' : ''}The main engine's third bearing is running hot and the temperature is still climbing.\n\n${awake(s, c)}${c.own ? `\n\n[[${c.sp}]] "She'll take a repack with the shaft stopped, and it'll cost you the years." "Or somebody goes in with her turning. That'd be me, and I don't recommend it."` : ''}`,
  choices: [
    { label: 'Stop the shaft and repack the bearing', note: 'The engine is down while it is done, and the ship falls behind its plan. The sleepers spend the extra time in the cold.', info: [['danger', 'More years in the cold']],
      out: end({ text: s => `The engine is shut down, the shaft is stopped, and the bearing is repacked the way the manual says. The crossing will take ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''}, and the cryo banks have to last them.`,
      fx: s => ({ sleepers: -3, chips: [[`${longer(s, 0.15)} year${longer(s, 0.15) > 1 ? 's' : ''} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: (s, c) => `Send ${X(s, c).first} into the housing with the shaft turning`, about: true, dark: true, note: 'No time is lost and nothing is spent. Nobody who has seen the housing would go in by choice.', info: (s, c) => [['yield', 'No time lost, no sleepers lost'], ['fail', X(s, c).first]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} goes in. It takes nine hours with the shaft turning a hand's width away. The temperature comes down and stays down.`, fx: { stain: ['ordered_in', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c), a = W(s, c).find(p => p !== x) || W(s, c)[0];
          return dies(s, c, 0.5) ? `${x.first} goes in, and is caught by the shaft in the seventh hour. ${a.first} goes in to clear it, and repacks the bearing with spares that were set aside for the reactor.`
            : `${x.first} goes in, and in the seventh hour the shaft takes a sleeve and most of the arm inside it. ${a.first} pulls ${him(x)} out by the belt. The bearing is repacked with the shaft stopped after all, with spares that were set aside for the reactor.`; },
        fx: (s, c) => dies(s, c, 0.5) ? { kill: [lost(X(s, c), 'caught by the shaft of the main engine')], parts: -4, stain: ['ordered_in', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -30), { parts: -4, stain: ['ordered_in', 1] }) }) },
    { label: 'Run it as it is, and feed it spares', note: 'The engine keeps its pace. The bearing eats seals and grease meant for the reactor all the way to orbit.', info: [['yield', 'No time lost'], ['danger', 'Spares, and the reactor']],
      out: end({ text: 'The engine is kept at its rating and the bearing is nursed: a new seal every few months, out of the reactor\'s own shelf. It holds as far as orbit. The reactor goes without its overhaul, and arrives needing one.', fx: { parts: -4, machine: { reactor: -6 } } }) },
  ] });
inc('mould', 'Grey in the Stores', 'crew', {
  text: (s, c) => `${year(s, c)} The grey mould is back, in the dry stores this time.\n\n${awake(s, c)}${c.own ? `\n\n[[${c.sp}]] "Three bays showing." "Could be thirty sacks. Could be all of it. Won't know till they're open."` : ' Three bays show it, and there is no telling how far it has spread.'}`,
  choices: [
    { label: 'Burn all three bays', note: 'It is certain, and it costs everything in them.', info: [['danger', 'A week of the colony\'s food']],
      out: end({ text: 'Three bays of sacks go out through the lock and burn off in the drive plume. The mould is not seen again. The colony will land with a week less in the hold than it counted on.', fx: { food: -220 } }) },
    { label: 'Open every sack and sort it by hand', note: 'Most of it may be clean. If the mould is further in than it looks, the sorting spreads it.', info: [['fail', 'More of the stores, and the hydroponics bay']], test: { base: 50, mods: [] },
      ok: end({ text: (s, c) => `It takes ${X(s, c).first} and the watch two months. Most of what was in the three bays is clean and goes back on the shelves.`, fx: { food: -50 } }),
      bad: end({ text: 'By the time the sorting is finished the mould is in the sorted sacks, and in the hydroponics bay again.', fx: { food: -330, machine: { hydroponics: -6 } } }) },
    { label: 'Have the watch eat from the doubtful sacks, and do not tell them which', dark: true, note: (s, c) => `Nobody knows what the mould does to a person. A month of ${W(s, c)[0].first}'s and ${W(s, c)[1].first}'s suppers is how to find out which sacks to keep.`, test: { base: 60, mods: [] }, info: (s, c) => [['yield', 'Nearly all of the stores kept'], ['fail', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]],
      ok: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} eat from the grey sacks for a month without knowing it, and you log every stomach ache they mention. Nothing worse comes of it. Nearly all of the three bays goes back on the shelves.`, fx: { food: -20, stain: ['taster', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.4) ? `By the third week neither of them can keep water down. ${a.first} comes through it, thin and yellow. ${b.first} is dead in the fifth week. It is now known exactly which sacks to burn, and ${a.first} has worked out how.`
            : `By the third week neither of them can keep water down, and it is a month before either can stand a watch. It is now known exactly which sacks to burn, and they have both worked out how.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.4) ? { food: -100, kill: [lost(b, 'poisoned by the grey mould in the stores')], off: [[a.id, 'body', -15]], morale: -2, stain: ['taster', 2], do: fell(b) }
            : { food: -100, off: [[a.id, 'body', -18], [b.id, 'body', -18]], chips: [[`${a.first} and ${b.first} are poisoned`, false]], morale: -1, stain: ['taster', 2] }; } }) },
  ] });
inc('pursuit', 'A Light Astern', 'security', {
  text: (s, c) => `${year(s, c)} There has been a drive flare on the stern scope for three weeks, on the ship's own heading and closing. Its spectrum matches the beacon's.\n\n${awake(s, c)}${c.own ? `\n\n[[${c.sp}]] "Three weeks on our heading, closing, and not a word on any band." "Bloody friendly of them. Shall we wait and see what they'd like?"` : ''}`,
  choices: [
    { label: 'Go dark and coast', note: 'The cryo banks run warm while the reactor is banked.', info: [['danger', 'Sleepers, while the banks run warm']],
      out: end({ text: 'The engine is shut down and the reactor banked. The flare passes a long way off and keeps going. The cryo banks ran warm for the weeks it took, and four sleepers did not come through.', fx: { sleepers: -4 } }) },
    { label: 'Burn hard and outrun it', note: 'Six days flat out. The reactor may not thank you for it.', info: [['fail', 'The reactor']], test: { base: 50, mods: [] },
      ok: end({ text: 'The engine is run flat out for six days. The flare falls behind, and then off the bottom of the scope.' }),
      bad: end({ text: 'The flare falls behind in the end. The reactor fed the engine everything it had for those six days, and shows it.', fx: { parts: -4, machine: { reactor: -9 } } }) },
    { label: 'Cut the forward plate stock loose as a decoy', note: 'Twenty tonnes of plate on a warmed pallet with a beacon, drifting. Anything hunting by heat will go to it first.', info: [['danger', 'Plate the colony was going to build with']],
      out: end({ text: (s, c) => `${X(s, c).first} blows the pallet free with its heaters on and the ship coasts cold behind it. The flare changes course toward the pallet. Eleven days later the beacon stops transmitting.`, fx: { mat: -18 } }) },
  ] });
inc('drift', 'The Fix', 'command', {
  text: (s, c) => `${year(s, c)} The star fix is off again. The error is small, and it grows every day it is flown.\n\n${awake(s, c)}${c.own ? `\n\n[[${c.sp}]] "I make it two degrees." "A month of sightings tells us the same thing a month later. Give the order and I'll fly it."` : ''}`,
  choices: [
    { label: 'Stop the burn and take a month of sightings', note: 'It costs a month of stores and gives a heading that can be trusted.', info: [['danger', 'A month of stores']],
      out: end({ text: 'The engine is shut down for a month while every star in the catalogue is sighted twice. The new heading is good.', fx: { food: -110 } }) },
    { label: (s, c) => `Correct on ${X(s, c).first}'s best reckoning`, about: true, note: 'An afternoon\'s work if the reckoning is right. If it is wrong, the ship flies the error until somebody notices.', info: [['fail', 'More years in the cold']], test: { base: 50, mods: [] },
      ok: end({ text: 'The correction is two degrees, made in an afternoon. The next fix lands where it should.' }),
      bad: end({ text: s => `The correction was out by half. It takes ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''} to fly back onto the line.`,
        fx: s => ({ sleepers: -5, food: -60, chips: [[`${longer(s, 0.15)} year${longer(s, 0.15) > 1 ? 's' : ''} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Thaw the mission\'s first navigator', dark: true, note: 'The best eye for a star fix the ship ever had, seventy-one years old, and too old to go under a second time.', info: [['yield', 'A heading that can be trusted'], ['danger', 'The navigator']],
      out: end({ text: 'The old navigator is thawed, takes eleven days over the sightings, and gives a heading that holds. There is no going back under at that age, and the navigator was told so before agreeing. The navigator stands watches from a chair after that, and dies two years short of orbit.', fx: { sleepers: -1, survey: 4, stain: ['navigator', 1] } }) },
  ] });
inc('wake', 'The Ones Who Cannot Sleep', 'doctor', {
  text: (s, c) => { const [a, b] = W(s, c); return `${year(s, c)} ${a.first} and ${b.first} have the watch this year, and neither has slept in a month. They sit in the wardroom through ship's night and talk about the dead world: what killed it, and whether the next one will be dead when the ship gets there. ${c.woke ? `${X(s, c).first}, woken to look at them, has woken you.` : 'The log has gaps in it now, and one of the gaps woke you.'}`; },
  choices: [
    { label: 'Wake the other officers and sit up with them', note: 'All of your officers awake for a season, out of turn, eating, and the dead world talked through until it is talked out. The fear may spread before it settles.', info: [['yield', 'Nobody forced, nobody drugged'], ['danger', 'The stores'], ['danger', 'Everyone\'s nerve']],
      out: end({ text: (s, c) => `The bay is opened and the wardroom table is full for the first time since the burn. It takes three months of suppers. Nobody has an answer about the dead world, but ${W(s, c)[0].first} and ${W(s, c)[1].first} sleep again, and the others go back into the cold with it in their heads.`, fx: { food: -120, off: six('mind', -4), chips: [['Every officer a little shaken', false]] } }) },
    { label: 'Put both back under early, by force if it comes to that', dark: true, note: 'They have said they will not go. A second freeze inside the year is hard on anyone, and the next pair wake a year before their turn.', info: (s, c) => [['yield', 'A watch that sleeps'], ['fail', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `It comes to force for ${W(s, c)[1].first}. Both are sedated in the wardroom and carried down to the bay, and both lids frost over as they should. The next pair are told everything except why they were woken early, and work it out within the week.`, fx: (s, c) => ({ morale: -1, stain: ['refreeze', 1], off: c.w.map(id => [id, 'mind', -5]) }) }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `It comes to force for ${b.first}. Both are sedated in the wardroom and carried down to the bay. ${b.first}'s pod shows a flat line before the lid is cold. The next pair are told everything except why they were woken early, and work it out within the week.`
            : `It comes to force for ${b.first}. Both are sedated in the wardroom and carried down to the bay. ${b.first}'s pod alarms twice in the night and has to be opened again, and ${he(b)} comes out of it with a heart that will never be what it was.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? { kill: [lost(b, 'did not come through a second freeze')], morale: -2, stain: ['refreeze', 1], do: fell(b) } : Object.assign(hurt(b, -28), { morale: -1, stain: ['refreeze', 1] }); } }) },
    { label: 'Dose them, and keep them on the array', dark: true, note: 'The drug store has enough to keep two people quiet and working for a year. It was packed for surgery on the ground.', info: (s, c) => [['yield', 'A survey of the new star'], ['danger', 'The drug store'], ['fail', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `They are dosed at every meal and set to the array's readings of ${s.world.star}. They work slowly and say very little, and the ship arrives with a better survey of the new world than it had. Neither is quite the same person afterwards.`, fx: (s, c) => ({ survey: 6, machine: { medbay: -5 }, stain: ['sedated', 1], off: c.w.map(id => [id, 'mind', -8]) }) }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.45) ? `They are dosed at every meal and set to the array. In the fourth month ${b.first} saves a week of doses and takes them together, and leaves the survey notes squared on the wardroom table. ${a.first} finds ${him(b)} in the morning.`
            : `They are dosed at every meal and set to the array. In the fourth month ${b.first} saves a week of doses and takes them together. ${a.first} finds ${him(b)} in time, and sits by the bunk for nine days.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.45) ? { kill: [lost(b, 'took a week of doses together')], morale: -2, machine: { medbay: -5 }, stain: ['sedated', 1], off: [[a.id, 'mind', -10]], do: fell(b) }
            : { machine: { medbay: -5 }, stain: ['sedated', 1], off: [[b.id, 'mind', -22], [b.id, 'body', -12], [a.id, 'mind', -8]], chips: [[`${b.first} is badly shaken`, false]] }; } }) },
  ] });
inc('rock', 'A Grain of Rock', 'command', {
  text: (s, c) => `${year(s, c)} Something the size of a grain of rice has gone through the hangar bay, and through the lander's flank on its way.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Seal the bay and leave the lander until orbit', note: 'It sits in vacuum for the rest of the crossing.', info: [['danger', 'The lander']],
      out: end({ text: 'The bay is sealed. The lander sits in vacuum for the rest of the crossing, and its seals age faster than they were meant to. Every flight it can no longer make leaves more sleepers in orbit.', fx: { machine: { lander: -10 }, cap: { lander: -4 } } }) },
    { label: 'Repair it now, in the bay', note: 'A week of pumping the bay down, and plate and seals out of stores. What the grain did further in will not show until the pressure test.', cost: { parts: 3 }, info: [['fail', 'The lander, a little']], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} cuts the puncture out and plates it, and replaces every seal near it.` }),
      bad: end({ text: 'The plate goes on, but the pressure test afterwards finds what the grain did further in, and there is nothing in stores for that.', fx: { machine: { lander: -6 } } }) },
    { label: (s, c) => `Send ${X(s, c).first} in a suit, with the bay still open to space`, about: true, dark: true, note: (s, c) => `It saves the parts and the week of pumping down. The suit seals are forty years old, and ${X(s, c).first} has looked at them and said no once.`, info: (s, c) => [['yield', 'The lander, for nothing'], ['fail', X(s, c).first]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} spends four hours in a suit inside the lander's flank, working by helmet lamp. The puncture is closed from within and holds at test.`, fx: { machine: { lander: 3 }, stain: ['ordered_out', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c);
          return dies(s, c, 0.5) ? `A wrist seal goes in the third hour. ${x.first} finishes the weld before the air runs out, and does not get back to the lock. The lander is sound.`
            : `A wrist seal goes in the third hour. ${x.first} finishes the weld one-handed and reaches the lock with an arm frozen to the elbow. The lander is sound.`; },
        fx: (s, c) => dies(s, c, 0.5) ? { kill: [lost(X(s, c), 'a suit seal failed in the open hangar bay')], morale: -1, stain: ['ordered_out', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -28), { stain: ['ordered_out', 1] }) }) },
  ] });
inc('fab', 'The Bracket', 'crew', {
  text: (s, c) => `${year(s, c)} The fabricator has been printing the same bracket for six days. It was not asked to, and it will not stop.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Cut its power for the rest of the crossing', note: 'A machine like that does not like standing cold for years.', info: [['danger', 'The fabricator, and spares']],
      out: end({ text: 'It is shut down cold, with a bracket half printed, and it will need work before it runs again. Nothing that breaks for the rest of the crossing can be printed, and two things do.', fx: { machine: { fabricator: -8 }, parts: -3 } }) },
    { label: 'Open the controller and find the fault', note: 'It may be a relay. It may be the boards, and they do not like being probed live.', info: [['fail', 'The fabricator, and spares']], test: { base: 50, mods: [] },
      ok: end({ text: 'It is a stuck relay, found on the second day. The brackets are melted down for stock.', fx: { parts: 2 } }),
      bad: end({ text: 'The fault is found, after two boards are burned out on the way to it. It prints again, and nothing it prints is quite square.', fx: { parts: -5, machine: { fabricator: -12 } } }) },
    { label: (s, c) => `${X(s, c).first} goes in through the feed chute while it prints`, about: true, dark: true, note: (s, c) => `The jam is behind the head. Powering down to reach it is what a machine like this does not forgive. ${X(s, c).first} is the only one aboard narrow enough, and has not been asked yet.`, info: (s, c) => [['yield', 'The fabricator, never switched off'], ['fail', X(s, c).first]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} goes in feet first with a pick and a lamp, timing the head as it passes. The relay is freed in twenty minutes, and six days of brackets are melted down for stock.`, fx: { parts: 4, stain: ['ordered_in', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c);
          return dies(s, c, 0.5) ? `The head catches ${x.first} across the chest and does not stop. The fabricator is shut down cold to get ${him(x)} out, which was what the job was meant to avoid, and it is too late by then.`
            : `The head catches ${x.first}'s arm and does not stop. The fabricator is shut down cold to get ${him(x)} out, which was what the job was meant to avoid. The arm is opened to the bone.`; },
        fx: (s, c) => dies(s, c, 0.5) ? { kill: [lost(X(s, c), 'caught by the print head, clearing a jam')], morale: -1, machine: { fabricator: -8 }, stain: ['ordered_in', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -26), { machine: { fabricator: -8 }, stain: ['ordered_in', 1] }) }) },
  ] });
inc('fire', 'Fire in the Racks', 'security', {
  text: (s, c) => `${year(s, c)} A lamp ballast in the hydroponics bay, years past its rated life, has shorted and set the racks alight. The bay's own extinguishers emptied in the first minute, and the smoke is in the vents.\n\n${awake(s, c)} ${W(s, c)[1].first} is at the far racks with a hose, and they have not caught yet.`,
  choices: [
    { label: 'Vent the bay to space, once it is clear', note: 'The fire goes out in a breath, and so does every rack in the bay. The colony lands without the crop it was counting on.', info: [['danger', 'The racks, and what they would have grown']],
      out: end({ text: (s, c) => `${W(s, c)[1].first} is called out, and the outer door is opened. The bay empties in one breath. The racks are black and frozen when the watch goes in. For the rest of the crossing the watch eats from sealed stores, and the colony will land that much shorter.`, fx: { food: -160, machine: { hydroponics: -6 } } }) },
    { label: 'Fight it from the door', note: 'Hoses from the galley and the cryo bay, and the two of them in the smoke.', test: { base: 50, mods: [] }, info: (s, c) => [['fail', 'Most of the racks'], ['fail', W(s, c)[1].first]],
      ok: end({ text: 'The fire is out in forty minutes, with a third of the racks lost.', fx: { food: -50 } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.3) ? `The fire gets into the lamp feeds and runs along the ceiling. It is out in the end, with most of the racks gone. ${b.first} was in the smoke longest, and dies of it two days later.`
            : `The fire gets into the lamp feeds and runs along the ceiling. It is out in the end, with most of the racks gone, and ${b.first} coughs black for a month.`; },
        fx: (s, c) => { const b = W(s, c)[1];
          return dies(s, c, 0.3) ? { kill: [lost(b, 'the smoke of the fire in the racks')], food: -120, machine: { hydroponics: -4 }, do: fell(b) } : Object.assign(hurt(b, -18), { food: -120, machine: { hydroponics: -4 } }); } }) },
    { label: (s, c) => `Vent it now, with ${W(s, c)[1].first} still at the back`, about: true, dark: true, note: (s, c) => `Opened now, the bay loses the front racks only. ${W(s, c)[1].first} would have the length of the bay to run, in the time the air takes to leave it.`, info: (s, c) => [['yield', 'Most of the racks'], ['fail', W(s, c)[1].first]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `The door is opened on the count. The fire goes out before it reaches the far racks, and their sealed trays come through the cold. ${W(s, c)[1].first} comes through the inner door on hands and knees with frost on ${his(W(s, c)[1])} eyelashes, and asks who gave the count.`, fx: { food: -30, stain: ['vented', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `The door is opened on the count. The fire goes out before it reaches the far racks, and their sealed trays come through the cold. ${b.first} gets as far as the third rack. ${a.first} brings ${him(b)} in from the bay a day later, in a suit.`
            : `The door is opened on the count. The fire goes out before it reaches the far racks. ${b.first} reaches the inner door with nothing left in ${his(b)} lungs, and ${a.first} gets it open in time. ${b.first} keeps the hands, most of the fingers, and a cough.`; },
        fx: (s, c) => { const b = W(s, c)[1];
          return dies(s, c, 0.5) ? { kill: [lost(b, 'the hydroponics bay was vented to put out a fire')], morale: -2, food: -30, stain: ['vented', 2], do: fell(b) } : Object.assign(hurt(b, -30), { food: -30, stain: ['vented', 1] }); } }) },
  ] });
/* The Short Count (2026-11-21): its id was voy.ledger while it was a thief among the hands woken for the watch. Nobody but the six
   is awake now, so it is a mis-packed bay, under a new id; the old card's picture (voy_ledger: foil wrappers under a mattress) is
   borrowed by Bay Six (voy.hold), which it fits. */
inc('count', 'The Short Count', 'crew', {
  text: (s, c) => `${year(s, c)} The count of the stores has come up a month short. Half the cases in bay four are stencilled RATIONS and packed with air filters: two pallets were swapped on the dock forty years ago, and nobody opened a case until now.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Write it off, and land a month short', note: 'Nobody aboard goes hungry for it. The colony starts with less in the bins than it was promised.', info: [['danger', 'A month of the watch\'s food, off the colony\'s stores']],
      out: end({ text: 'The count is corrected in the ledger and the filters go to stores. The colony will land with less than it was promised, and with more air filters than it will ever use.', fx: { food: -170, parts: 2 } }) },
    { label: 'Put your six on half rations until orbit', note: 'Six officers eating half for the rest of the crossing makes up most of it, and all six come off their watches thin.', info: [['yield', 'Most of the shortfall'], ['danger', 'Your six']],
      out: end({ text: 'The galley board is rewritten. Every officer stands the rest of the watches on half a plate, and the stores gain back most of what was missing. All six are slower on their feet at landfall.', fx: { food: -40, parts: 2, off: six('body', -6), chips: [['The six worn thin', false]] } }) },
    { label: 'Run the hydroponics bay hard to make it up', note: 'Every rack planted and the lamps on long days, for years. The bay was not built to be run like that.', info: [['fail', 'The month, and the hydroponics bay']], test: { base: 50, mods: [] },
      ok: end({ text: 'The bay is planted wall to wall and run on long days. It makes up nearly all of the shortfall before orbit.', fx: { food: -20, parts: 2 } }),
      bad: end({ text: 'The bay is planted wall to wall and run on long days, and in the third year a pump seizes and takes two racks of roots with it. The shortfall stays, and the bay arrives in worse shape than it left.', fx: { food: -170, parts: 2, machine: { hydroponics: -9 } } }) },
  ] });
inc('spine', 'The Spine', 'engineer', {
  text: (s, c) => `${year(s, c)} Forty years of heating and cooling have cracked a weld in the spine between the two rings. The forward ring has started to wobble on its bearings, and the crack grows every time it turns.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Stop the ring and weld it in free fall', note: 'Everyone awake moves aft and works without weight for the year it takes. They will come off the watch weak.', info: (s, c) => [['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}, a year without weight`], ['danger', 'The autodoc']],
      out: end({ text: (s, c) => `The ring is spun down and the crack welded from both sides. ${W(s, c)[0].first} and ${W(s, c)[1].first} live a year without weight and come back to the ring with thin bones, and the autodoc spends a long time on them.`, fx: (s, c) => ({ parts: -3, machine: { medbay: -6 }, off: c.w.map(id => [id, 'body', -10]), chips: [['The watch weakened', false]] }) }) },
    { label: (s, c) => `${X(s, c).first} welds it with the ring turning`, about: true, note: 'The welder works where the ring meets the spine, a metre from the spin.', test: { base: 60, mods: [] }, info: (s, c) => [['yield', 'Nothing spent'], ['fail', X(s, c).first]],
      ok: end({ text: (s, c) => `${X(s, c).first} lays the weld in three shifts with the ring turning beside ${him(X(s, c))}. It holds.` }),
      bad: end({ text: (s, c) => { const x = X(s, c), a = W(s, c).find(p => p !== x) || W(s, c)[0];
          return dies(s, c, 0.45) ? `${x.first}'s line fouls on the turning ring, and the ring does not stop for it. ${a.first} finishes the weld the next day, with spares from the reactor's store.`
            : `${x.first}'s line fouls on the turning ring and takes ${him(x)} half way round it before it parts. ${a.first} finishes the weld the next day, with spares from the reactor's store, while ${x.first} lies in the autodoc with both legs set.`; },
        fx: (s, c) => dies(s, c, 0.45) ? { kill: [lost(X(s, c), 'a line fouled on the forward ring')], parts: -4, do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -30), { parts: -4 }) }) },
    { label: 'Cut the forward ring loose, with bank F in it', dark: true, note: 'Eight sleepers in bank F cannot be moved in time. Without the ring\'s weight the ship crosses faster, and the crack stops mattering.', info: [['time', 'The crossing shorter'], ['yield', 'Salvage from the ring'], ['danger', 'Eight sleepers']],
      out: end({ text: s => `The forward ring is stripped of everything that can be carried and cut free with eight pods still on its power. It falls behind slowly, and its beacon is switched off on the second day. The lighter ship makes orbit ${yrs(longer(s, 0.1))} sooner.`,
        fx: s => ({ sleepers: -8, parts: 4, mat: 10, stain: ['ring', 2], chips: [[`${yrs(longer(s, 0.1))} sooner`, true]], chron: 'On the crossing, the forward ring was cut loose with bank F still in it.', do: s2 => { s2.world.transit.years -= longer(s2, 0.1); } }) }) },
  ] });
inc('sick', 'The Fever', 'doctor', {
  text: (s, c) => { const [a, b] = W(s, c), x = X(s, c);
    return `${year(s, c)} ${b.first} came up from the thaw carrying something the cold had kept asleep, and ${a.first}, who has the watch with ${him(b)}, has it now too. ${c.woke ? `They got ${x.first} out of the bay before they went down with it, and ${x.first} has woken you.${c.own ? '' : ` ${x.first} cannot name it.`}` : `One of them got to your pod before the fever put them both in their bunks. Nobody awake can name it.`}${c.woke && c.own ? `\n\n[[${c.sp}]] "I can't name it." "I've got two drugs that might touch it and a store packed for the ground. You woke me to treat them, so let me treat them."` : ''}`; },
  choices: [
    { label: 'Nurse them, with everything in the drug store', note: 'Both of them come through it. The autodoc\'s drug store was packed for the ground, and most of it goes on two people.', info: (s, c) => [['yield', `${W(s, c)[0].first} and ${W(s, c)[1].first}`], ['danger', 'The drug store']],
      out: end({ text: (s, c) => `The fever breaks in the third week, in both of them, after most of two shelves of the drug store. ${W(s, c)[0].first} and ${W(s, c)[1].first} are a month getting their strength back.`, fx: (s, c) => ({ machine: { medbay: -9 }, off: c.w.map(id => [id, 'body', -6]) }) }) },
    { label: 'Seal them in their bunks and wait', dark: true, note: 'Nothing from the drug store is spent and nobody else goes near them. The two are on their own.', info: (s, c) => [['yield', 'The drug store, whole'], ['fail', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]], test: { base: 60, mods: [] },
      ok: end({ text: (s, c) => `The bunk doors are locked from outside and food goes in through the hatch. Both fevers break on their own in the third week. ${W(s, c)[0].first} and ${W(s, c)[1].first} come out thin, and neither says anything to you about the locks.`, fx: (s, c) => ({ stain: ['sealed_sick', 1], off: c.w.map(id => [id, 'body', -8]) }) }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `The bunk doors are locked from outside and food goes in through the hatch. ${b.first} is dead within the fortnight. ${a.first} comes out thin and does not speak to you again before orbit.`
            : `The bunk doors are locked from outside and food goes in through the hatch. Both of them live, barely. ${a.first} comes out able to stand, and carries ${b.first} to the autodoc without a word to you.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? { kill: [lost(b, 'a fever, behind a locked door')], morale: -1, stain: ['sealed_sick', 1], off: [[a.id, 'body', -15]], do: fell(b) }
            : { stain: ['sealed_sick', 1], off: [[a.id, 'body', -20], [b.id, 'body', -28]], chips: [[`${a.first} and ${b.first} are badly weakened`, false]] }; } }) },
    { label: 'Wake sleepers to try the doses on', dark: true, note: 'Nobody knows which drug works. Six from the banks, woken and given the fever, would show it before the two are past saving.', info: (s, c) => [['yield', `${W(s, c)[0].first} and ${W(s, c)[1].first}, and a known cure`], ['danger', 'Six sleepers']],
      out: end({ text: (s, c) => `Six are thawed in the cold bay and given the fever on purpose, three to a drug. By the tenth day it is plain which one works, and ${W(s, c)[0].first} and ${W(s, c)[1].first} are given it. Four of the six are dead by then. The two who lived come down with the colony.`, fx: { sleepers: -6, pop: 2, machine: { medbay: -2 }, stain: ['tried_on', 2] } }) },
  ] });
inc('dust', 'The Dust Lane', 'command', {
  text: (s, c) => `${year(s, c)} The heading crosses a lane of dust the long-range array never resolved. The forward shield is losing a millimetre a week, and the lane is months wide.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Turn wide around it', note: 'It adds time, and the sleepers spend it in the cold.', info: [['danger', 'Sleepers, in the extra years']],
      out: end({ text: s => `The ship comes about and goes the long way round the lane. The crossing will take ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''}, and the cryo banks have to last them.`,
        fx: s => ({ sleepers: -5, chips: [[`${yrs(longer(s, 0.15))} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Hold course behind the shield', note: 'The shield may last the lane. If it does not, what comes through goes on through whatever is behind it.', test: { base: 50, mods: [] }, info: [['fail', 'The reactor']],
      ok: end({ text: 'The shield is worn to a sliver when the ship comes out of the lane, and it holds.' }),
      bad: end({ text: 'A grain gets through where the shield is thinnest and goes on through the reactor\'s cooling jacket.', fx: { parts: -4, machine: { reactor: -9 } } }) },
    { label: 'Send the watch out to hang plate ahead of the shield', dark: true, note: (s, c) => `Spare plate can be hung forward by hand. ${W(s, c)[0].first} and ${W(s, c)[1].first} know what dust like this does to a suit.`, test: { base: 60, mods: [] }, info: (s, c) => [['yield', 'The shield, and no time lost'], ['danger', 'Some plate'], ['fail', W(s, c)[1].first]],
      ok: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} go out on lines and hang the plate in nine hours, with the dust ticking on their visors. Both come back in.`, fx: { mat: -6, stain: ['ordered_out', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `The plate goes up. ${b.first} is holed through the suit an hour from the lock, and ${a.first} brings ${him(b)} in.`
            : `The plate goes up. A grain goes through ${b.first}'s thigh an hour from the lock, and ${a.first} holds a glove over the hole all the way back.`; },
        fx: (s, c) => { const b = W(s, c)[1];
          return dies(s, c, 0.5) ? { kill: [lost(b, 'holed through the suit in the dust lane')], mat: -6, morale: -1, stain: ['ordered_out', 1], do: fell(b) } : Object.assign(hurt(b, -26), { mat: -6, stain: ['ordered_out', 1] }); } }) },
  ] });
inc('dead', 'The Cold Bay', 'doctor', {
  more: s => ({ n: Math.max(12, s.world.transit.lostS + 4) }),
  text: (s, c) => `${year(s, c)} The pods that failed on the voyage still hold their dead, ${c.n} of them, kept in the mortuary bay to be buried on the new world. The bay's refrigeration has failed, and the hydroponics is short of everything a body is made of.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Give them to space, with the rites', note: 'It is what the mission promised the families. The trays stay short, and the colony lands with less.', info: [['danger', 'The trays, and what they would have grown']],
      out: end({ text: (s, c) => `The bodies go out through the lock one at a time, with ${W(s, c)[0].first} reading a name for each, over three ship's days. The hydroponics stays short for the rest of the crossing.`, fx: { food: -80, morale: 1 } }) },
    { label: 'Put them through the reclaimer for the trays', dark: true, note: 'Every body is feed the hydroponics needs. The families are asleep, and the log can say space.', info: [['yield', 'A full hydroponics bay'], ['danger', 'What the families are told']],
      out: end({ text: 'The reclaimer takes them over a month. The trays come up green and heavy, and the log says they were committed to space with the rites.', fx: { food: 110, stain: ['reclaimed', 2] } }) },
  ] });

/* Five more (2026-11-21), open to any crossing. Nobody speaks in these: there are twelve officers who might, and the
   narration says only what was found and what was done. */
inc('scram', 'The Third Scram', 'engineer', {
  text: (s, c) => `${year(s, c)} The reactor has shut itself down three times this month on the word of one sensor in its coolant loop, and nobody can find the fault it reports. Each restart takes a day, and the cryo banks ride through it on batteries.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Trust the sensor, and run the reactor at half', note: 'Half power is enough for the engine or for every bank at full cold, and the engine has to keep its pace.', info: [['danger', 'Sleepers in the warmest bank']],
      out: end({ text: 'The reactor is held at half for the rest of the crossing and does not trip again. The bank furthest from the bus runs two degrees warm for years, and five of its pods fail one at a time.', fx: { sleepers: -5 } }) },
    { label: 'Wire the sensor out of the loop', note: 'If the sensor is lying, that is the end of it. If it is telling the truth, the reactor runs on with the fault in it.', info: [['fail', 'The reactor, and spares']], test: { base: 50, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} wires the sensor out of the loop. The reactor runs at full for the rest of the crossing and nothing else trips. The sensor was lying.` }),
      bad: end({ text: (s, c) => `${X(s, c).first} wires the sensor out of the loop, and it was telling the truth. A pump runs dry for six weeks before anyone hears it. The reactor arrives with a scored loop and a shelf of spares gone into it.`, fx: { parts: -4, machine: { reactor: -10 } } }) },
    { label: 'Fit the fabricator\'s coolant sensors in its place', note: 'They are the same part. The fabricator would print the rest of its life with one loop unwatched.', info: [['yield', 'The reactor, sound'], ['danger', 'The fabricator']],
      out: end({ text: 'The sensors come out of the fabricator and go into the reactor loop, and the trips stop. The fabricator runs its cooling blind from then on, and runs hot.', fx: { machine: { fabricator: -9 }, cap: { fabricator: -3 } } }) },
  ] });
inc('vault', 'The Seed Vault', 'crew', {
  text: (s, c) => `${year(s, c)} The seed vault's compressor has seized. The vault holds every seed the colony will ever sow, at eighteen below, and it is warming by a degree a day.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Move the seed into the cryo bay', note: 'There is cold to spare there only if a bank gives up some of its own.', info: [['yield', 'The seed, whole'], ['danger', 'Sleepers in the bank that shares its cold']],
      out: end({ text: 'The seed lockers are stacked in the aisle of bank A and its coolant is shared out to cover them. The seed comes through whole. Four pods in bank A run warm for it and fail before orbit.', fx: { sleepers: -4 } }) },
    { label: 'Strip the compressor and rebuild it', note: 'The vault is packed in galley ice while it is done. Ice buys about ten days.', cost: { parts: 2 }, info: [['fail', 'A third of the seed']], test: { base: 50, mods: [] },
      ok: end({ text: 'The compressor is rebuilt on the wardroom table in nine days. It runs, and the seed never got above freezing.' }),
      bad: end({ text: 'The rebuild takes five weeks and two tries. By the time the vault is cold again a third of the lockers have sweated and gone to mould, and they are burned. The colony will sow less than it meant to.', fx: { yield: -0.04, food: -60 } }) },
    { label: 'Sow it in the hydroponics bay and carry it as plants', note: 'Seed that is growing does not need a vault. The bay runs every rack and lamp it has for the rest of the crossing.', info: [['yield', 'The seed, and food on the way'], ['danger', 'The hydroponics bay']],
      out: end({ text: 'Every rack is planted and the lamps never go off. The seed is carried the rest of the way as generations of plants, saved and resown by whoever has the watch. The watch eats well, and the bay arrives worn out.', fx: { food: 60, machine: { hydroponics: -9 }, cap: { hydroponics: -3 } } }) },
  ] });
inc('array', 'The Mirror', 'scientist', {
  text: (s, c) => `${year(s, c)} The long-range array's main mirror has frosted over: forty years of the ship's own outgassing, laid down a molecule at a time. Without it the ship comes up on ${s.world.star} with nothing but the navigation scope, and the survey from orbit starts from a blank sheet.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Leave it, and survey with what is left', note: 'Nothing is risked. The colony goes down knowing less about where it is going.', info: [['danger', 'The survey']],
      out: end({ text: 'The mirror stays frosted. On the last approach the navigation scope is turned on the new world for want of anything better, and the map the colony lands with has more white on it than anyone wanted.', fx: { survey: -8 } }) },
    { label: 'Bake the frost off with the mirror heaters', note: 'A degree at a time, over weeks. Glass that old may not take it evenly.', info: [['yield', 'A better survey'], ['fail', 'The mirror']], test: { base: 50, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} runs the heaters up a degree at a time over three weeks. The frost lifts, and the mirror is as clear as it was at launch. The approach survey is the best the array has ever made.`, fx: { survey: 6 } }),
      bad: end({ text: 'The frost lifts unevenly, and on the ninth day the mirror cracks from rim to rim. What is left of the array goes into the spares bins.', fx: { survey: -14, parts: 1 } }) },
    { label: 'Fit the lander\'s landing radar to the array', note: 'The radar head would do the mirror\'s work on the approach. It was aligned once, on Earth, for the lander.', info: [['yield', 'A good survey'], ['danger', 'The lander']],
      out: end({ text: 'The radar head is unbolted from the lander and mounted at the array\'s focus. It sees the new world well. It is never quite true again when it goes back, and every landing after is harder on the gear.', fx: { survey: 6, machine: { lander: -8 }, cap: { lander: -3 } } }) },
  ] });
inc('hold', 'Bay Six', 'security', {
  text: (s, c) => `${year(s, c)} A hatch on the cargo deck has been welded shut from the inside. Somebody has been living behind it in bay six: a pod in bank B opened on a fault eleven years ago, and the colonist in it has kept out of sight of every watch since and eaten from the stores, sooner than be put back under.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Bring them out, and keep them awake', note: 'One more at the wardroom table for the rest of the crossing: thin, sick, and afraid of every officer aboard.', info: [['yield', 'One life'], ['danger', 'The stores, and the autodoc']],
      out: end({ text: (s, c) => `${X(s, c).first} cuts the weld and talks through the gap for two days before anyone comes out. The autodoc has eleven years of bad food and no daylight to mend. The colonist stands no watches, eats at the wardroom table, and comes down with the colony.`, fx: { sleepers: -1, pop: 1, food: -90, machine: { medbay: -5 } } }) },
    { label: 'Put them back under', dark: true, note: 'By force, since they will not go. The autodoc gives a second freeze after eleven years awake about even odds.', info: [['yield', 'Nothing spent'], ['fail', 'The colonist']], test: { base: 50, mods: [] },
      ok: end({ text: 'The colonist is sedated at the hatch and carried down to the bay. The lid frosts over as it should, and the pod holds for the rest of the crossing.', fx: { stain: ['refreeze', 1] } }),
      bad: end({ text: (s, c) => `The colonist is sedated at the hatch and carried down to the bay. The pod shows a flat line before the lid is cold. ${X(s, c).first} logs it as a pod fault, eleven years late.`, fx: (s, c) => ({ sleepers: -1, stain: ['refreeze', 1], off: [[c.sp, 'mind', -5]] }) }) },
  ] });
inc('pass', 'The Dark Companion', 'command', {
  text: (s, c) => `${year(s, c)} There is a brown dwarf on no chart, dead ahead, too wide to miss with a small turn. Going round it adds a year. A close pass would bend the course the right way and cost no time, and would put the hull through tides it was never built for.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Go round it, wide', note: 'It adds a year, and the sleepers spend it in the cold.', info: [['danger', 'Sleepers, in the extra year']],
      out: end({ text: 'The ship comes about a month early and goes round at a distance. The dwarf is a dull red point for a season and then nothing. The crossing is a year longer, and the cryo banks have to last it.', fx: { sleepers: -3, chips: [['A year longer', false]], do: s2 => { s2.world.transit.years += 1; } } }) },
    { label: 'Take the close pass', note: 'Nine hours inside its tides, with everything aboard that can flex, flexing.', info: [['yield', 'No time lost'], ['fail', 'Every machine aboard']], test: { base: 50, mods: [] },
      ok: end({ text: (s, c) => `${X(s, c).first} flies it by hand. For nine hours the hull groans like a ship at sea, and then the dwarf is astern and the heading is true.` }),
      bad: end({ text: (s, c) => `${X(s, c).first} flies it by hand. For nine hours the hull groans like a ship at sea, and things shear that nobody knew could: pump mounts, a lander strut, the fabricator's bed. The heading is true. The ship that holds it is older than it was.`, fx: { parts: -2, chips: [['Every machine strained', false]], do: s2 => allMachines(s2, -5) } }) },
  ] });

/* ---- orbit: the world gets a name. Three put forward (2026-11-21: four before), each with where it came from: one from
   the generator and two that only this kind of planet would be called, and in about half the runs the catalogue
   designation itself in place of one of them. Nobody wins or loses by it; it is the player's to name. The names go by
   the planet, not the landing site, since the site is chosen after the crossing. ---- */
const CALLED = {
  barren: ['Cinder', 'Flint', 'Dry Harbour', 'Ochre', 'Long Wind', 'Slate', 'Thirst', 'Bare Mercy', 'Afterward', 'Old Works', 'Inheritance', 'Latecomer'],
  water: ['Soundings', 'Tidewater', 'Fathom', 'High Water', 'Shoal', 'Blue Mercy', 'Hoarfrost', 'Rime', 'Coldharbour', 'White Mercy', 'Glass Harbour', 'Thule'],
  green: ['Verdure', 'Greenhold', 'Canopy', 'Wet Season', 'Overgrowth', 'Meadowsweet', 'Good Hope', 'Windfall', 'Plenty', 'Soft Landing', 'Fair Field', 'Homecoming'],
};
const CATALOGUE = 'Official catalogue name';
const FROM = ['Current voted front runner', 'Watch officer\'s draft name', 'Senior crew\'s favourite', 'From the mission\'s naming list', 'The survey team\'s working name',
  'From the suggestion box sealed at launch', 'Said at the viewport, and it stuck', 'Drawn from a hat in the mess', 'What the engine room calls it', 'The navigators\' choice'];
add({ id: 'arrive.name', arc: 'setup', view: 'world', tone: 'council', chain: true, title: 'A Name for It',
  setup: s => { const w = s.world, t = w.transit; s.arrival = true; t.lostS = Math.max(0, t.s0 - s.sleepers); t.lostP = Math.max(0, t.p0 - s.pop);
    const own = (CALLED[w.kind || LF.worldOf(w.type)] || CALLED.barren).slice(), a = own.splice(Math.floor(LF.srand(s) * own.length), 1)[0], b = own[Math.floor(LF.srand(s) * own.length)];
    const r1 = w.sid || LF.planetName(`${s.seed}/n0`, [a, b]);
    const from = FROM.slice(), tag = () => from.splice(Math.floor(LF.srand(s) * from.length), 1)[0];
    const names = [r1, a, b].map(n => ({ n, from: tag() }));
    if (LF.srand(s) < 0.5) names.splice(Math.floor(LF.srand(s) * 3), 1, { n: w.planet, from: CATALOGUE, cat: true });
    return { names, cat: w.planet }; },
  text: (s, c) => `The survey is in. The catalogue lists this world as ${c.cat}.\n\nThe crew have put forward names, and three are still on the board. Pick one.`,
  choices: [0, 1, 2].map(i => ({ label: (s, c) => c.names[i].n, note: (s, c) => `${c.names[i].from}.`,
    out: { then: s => s.world.siteOpen ? 'setup.site' : V(s).next || 'setup.wake1', text: (s, c) => c.names[i].cat ? `The world keeps its catalogue designation, ${c.names[i].n}, and it goes into the log as the name.` : `${c.names[i].n}. It goes into the log, and by the end of the watch it is the only name in use.`,
      fx: (s, c) => ({ do: s2 => { s2.world.catalogue = c.cat; s2.world.planet = c.names[i].n; s2.arrival = false; LF.orbitChron(s2); } }) } })) });
/* ---- the landing site (Lachlan, 2026-11-21: "you've got the landing site selection way too early. It should be just before you
   configure the lander"). The planet's two sites, as a card, after the name and before the two lander cards. Until now the
   world has been made for the first site (LF.embark with later); the choice makes it again for the site taken (LF.pickSite),
   deals the threads, and the outcome carries what orbit says of that site (LF.siteReport), since the outcome's own text is
   drawn before any effect. A game whose site was fixed at the burn (the headless tools) skips the card. ---- */
const siteT = (s, k) => LF.SITE_TERMS[((s.world.cand || {}).sites || [s.world.type, s.world.type])[k]] || {};
add({ id: 'setup.site', view: 'world', arc: 'setup', tone: 'council', chain: true, title: 'Where the Lander Goes Down',
  text: s => `Two places on ${s.world.planet} would take a colony. Where the lander goes down decides what the colony lives on.`,
  choices: [0, 1].map(k => ({ label: s => { const n = siteT(s, k).site || 'the site'; return n.charAt(0).toUpperCase() + n.slice(1); },
    note: s => `${siteT(s, k).gives || ''} ${siteT(s, k).costs || ''}`.trim(),
    out: { then: s => V(s).next || 'setup.wake1', text: s => `The lander's course is laid in for ${siteT(s, k).site || 'the site'}, and the ship's survey is turned on it for the last orbits before the drop.` } })),
  after: s => { const m = s.memo['setup.site'], r = s.cur && s.cur.result; if (!m || !s.world.siteOpen) return;
    LF.pickSite(s, m.i); if (r) r.text += '\n\n' + LF.siteReport(s); } });

/* ---- what is said at the ramp (Lachlan, 2026-11-17): an officer lost on the crossing (p.fell) is spoken for at landfall,
   by one of the others, in that officer's own voice (VOICES.md). Two lines are written for each of the six, by different
   people, so there is somebody left to say one. One who is still aboard says it over the lander's radio. ---- */
// What is said at the ramp for an officer lost on the crossing (land.eulogy): every officer has a line for each of the ten outside
// their own seat, written in their own voice (voices/<key>.md), so whoever holds a seat at landfall can speak, first or second
// officer. The first speaker in each list who is alive and holding a seat speaks; ground before orbit.
const SAID = {
  solheim: [
    ["dahl", "She never once asked me whether an order was fair, only whether it'd work, and I'm told that's a fault. Well, we're standing on a planet, so somebody tell me which of us was wrong."],
    ["kovacs", "Jane flew the old girl the whole way out and never once bent her, and I'll keep her going for as long as she'll let me. That's all I've got in me to say."],
    ["zulu", "I'll say it in order, as she'd want it. The commander was never once wrong about what had to be done, and I was never once easy about it, and I'd stand any watch she gave me still. I'd like it noted that I wish she'd let us see what it cost her, and I'm sorry I never told her so."],
    ["halloran", "Jane scared the shit out of me, and I'd have followed her off any cliff she picked, because she'd always checked it first. She put us down on this world with her numbers, and I'd have signed for every one of them."],
    ["nakamura", "Jane, you'd have hated that I'm the one saying this, because I fought you over every name in that notebook of yours, and I'd do it again. But you carried every one of those names yourself, the whole way out, and somebody should be carrying yours now, so I will."],
    ["brandt", "Jane kept a count of our dead in her head the whole way out and thought none of us had noticed, and I'd call it the most honest book on the ship. She's in it now, so somebody else will have to keep it, and I'd ask whoever does to sleep more than she did."],
    ["yurbin", "Jane never once asked me what a thing was, only whether it would kill us, and I used to tell her that was the same question, and now there's a whole world at the bottom of this ramp and she's not here to ask it, so I'll have to ask it for her."],
    ["iyer", "Commander Haddy kept a tally of the dead in a book none of us was permitted to read, and I'd say it now has to be kept by someone else, since she's in it. She was the one person on the ship who would pay a price when it fell due, and the colony has lost that along with her, which I'd count the heavier of the two losses."],
    ["estrada", "She carried more than anyone should, the whole way out, and I prayed for her, though I doubt she'd have thanked me for it. She brought us down onto this ground, and the first of what grows here will carry her name."],
    ["waititi", "Jane never laughed at one of my jokes, not once in all those years, and she ate every bowl I sent up to the scrape, which was her way of laughing. She brought us all this way and never once said sorry for how, and I'm going to keep a bowl back for her tonight anyway."]],
  achebe: [
    ["dahl", "Lucas gave every one of us a second chance and made us feel it when we wasted it, and I never once caught him saying a thing he didn't mean. I'll keep his rule for him, one chance and no third, and I'll try to do it without enjoying it."],
    ["zulu", "Lucas gave every one of us a second chance, and I meant to be worth mine. He never raised his voice to me, not once, and I'd ask that we remember how he spoke to people when we speak to each other down here."],
    ["kovacs", "He never once shouted at me when something broke, he'd just stand there looking let down till I fixed it, and I fixed a lot of things faster for that face. I'd have liked him to see her come down in one piece."],
    ["halloran", "Lucas never once shouted at me, boss, not even the day he walked into the grey water up to his chest. He listened to everybody on that ship, me included, and I don't know who's going to do that now."],
    ["nakamura", "Lucas sat with my sick at the end of every day and never once asked me to hurry, and I kept a place at my table for him that I'm going to have to look at now. You'd have wanted us to go down this ramp together and not leave anyone at the back, so that's how we're doing it."],
    ["brandt", "Lucas gave people a second chance and meant it, which I never once managed in all my years on the wards. You're all wondering who does that for you now, and the answer is that you'll have to do it for each other, and you'll do it worse."],
    ["yurbin", "Lucas used to look at me with that patient face whenever I'd skipped a step, and I'd have given anything for him to shout instead, and now I'd give anything for the face."],
    ["iyer", "Mr McMurray remembered every undertaking anyone made to him, and held us to them with nothing harder than his disappointment, which I'll admit never once changed my conduct. I would note that it changed nearly everyone else's, and that we shall have to find another means of keeping this company honest now that his is gone."],
    ["estrada", "He never once raised his voice, and he was fair, and fair is the thing I trusted most in him. I'd have followed him onto this ground, and I'll try to be as fair on it as he'd have been."],
    ["waititi", "Lucas used to look at me with that long patient face until I owned up to things I hadn't even done, and I'd give anything to be looked at like that one more time. He remembered what every one of us promised, so I'll say mine out loud, here, for him: nobody in this colony gets forgotten at the table."]],
  dahl: [
    ["nakamura", "You were a suspicious, miserable man, Nolan, and you sat outside my sick bay door every night there was somebody in it, and I knew, I always knew. I'd throw you out of my ward a hundred times more if it meant you were standing here."],
    ["estrada", "He checked every lock twice a night so the rest of us could sleep, and I'll say thanks for that, before God and all of you. I'll check them now, Nolan, and I'll check them twice."],
    ["solheim", "Nolan checked every lock on that ship twice a night and trusted nobody, and not one thing got past him the whole way out. His name goes in my book tonight."],
    ["achebe", "Nolan checked every lock on that ship twice a night, every night, and I never once managed to get him to rest. He didn't trust many people, and I'd like to think I was one of them, and I'm going to miss him walking the corridors after the rest of us had gone to bed."],
    ["kovacs", "Nolan checked every lock on that ship twice a night and then came round asking why the hinges squeaked, and I never did give him a straight answer. I'll keep the grease on them, for what that's worth to him now."],
    ["halloran", "Nolan used to come round my workshop at night and check the locks I'd fitted, twice, and I'd shout at him, and he'd check them again. Every one of those gate hinges is going on straight and to gauge, Nolan, I promise you."],
    ["brandt", "Nolan checked every lock twice, and I told him it was a symptom, and he told me it was a lock, and we were both right. I'd like it noted that we landed with every one of them still shut."],
    ["yurbin", "Nolan counted my jars every night as if they'd climb out and come for him, and checked the lock twice, and I never once found it locked against anything that mattered except me, and I'm going to miss that, I'm going to miss being checked on."],
    ["iyer", "Mr Edney checked every lock twice a night and trusted none of us, myself least, and I've no quarrel with the judgment. It was a useful instrument, Administrator, and we have landed without it, so I'd advise that someone take up the locks tonight."],
    ["waititi", "Nolan checked every lock twice a night, and I used to tell him to check a pot instead, and he'd scowl, and then he'd eat what was in it. There was a good heart under all that vinegar, and I never did get it sweetened, and now I've lost my chance."]],
  zulu: [
    ["solheim", "Toby took the worst of every watch himself, and I told him to hand it down, and he never once did. He brought every one of his people home from Ceres, and he'd have walked all of you down this ramp."],
    ["achebe", "Toby was the youngest of us, and he took the worst of every watch so nobody else had to, and I told him he'd wear himself out. He still wrote to the families of every one of his people back home, and somebody ought to write to his now, and I'll do it."],
    ["kovacs", "That lad took the worst of the watches himself and wouldn't hear a word about it, so I kept the lamps charged for him and never said. There's one still charged in my bag, and I don't know what to do with it."],
    ["halloran", "Toby went out ahead of his own people every time, the daft bastard, because he couldn't bear to send one of them on a guess. He wrote to the families of everyone he ever trained, and somebody's going to have to write to his, and it should be me."],
    ["nakamura", "Toby, I spent the whole crossing dragging you into the sick bay to sleep, and you'd tell me you were fine and go straight back on watch, and you were never fine. You were the youngest of us and you looked after everyone else's people first, and I wish to God one of us had looked after you."],
    ["brandt", "I told Toby to stop taking the worst of the night watches, and he nodded, which is what people do instead of listening. The rest of you slept because he didn't, so you might sleep tonight and think about why you can."],
    ["yurbin", "I took Toby to see something once that was really worth seeing, and he stood there with his rifle up and missed all of it, because he was watching the dark for the rest of us, and he was the youngest of us, and he should have had years to look at things."],
    ["iyer", "Mr O'Neal would go into the dark himself before he'd send anyone, which I told him more than once was a waste of a trained man, and I find I was right in a way that gives me no satisfaction. He brought his people home from Ceres, and I'd say the ones standing here are the last of that account."],
    ["estrada", "He took the worst of the night watches himself so nobody else had to, and I never did get him to let us carry a share. Rest now, lad, the watch is ours."],
    ["waititi", "Toby always took the worst watch, and I always made sure his bowl was the fullest, and I told everybody, because I can't keep anything to myself. He was the youngest of us and he looked after all of us, and I can't finish this, somebody else say the rest."]],
  kovacs: [
    ["estrada", "He took my night shifts on the way out and never once said so, and whatever he fixed stayed fixed. This ground could've used a man like that, and I'll ask the Lord to keep him, since we can't."],
    ["solheim", "Every machine on that ship ran on his word, and not one thing he signed off ever failed, and that's the record I'm putting in the book."],
    ["achebe", "Jeremy helped build that ship and kept her going the whole way here, and when he told me how long something had left, he was never wrong, not once. He left a daughter on Earth, and I'd like her to know her dad got us here."],
    ["dahl", "Jeremy told me how long every machine on that ship had left and he was never wrong once, and he'd have told you so himself. He's got a daughter back on Earth who'll never hear it, so somebody write it down, and I'll put my name to it."],
    ["zulu", "Jeremy's knees were finished and he wouldn't sit down, so I took his post when he wasn't looking, and he let me pretend he didn't know. He left a daughter on Earth, and I'll write to her, with your leave, and tell her he was right about the machines."],
    ["nakamura", "Jeremy kept the old girl going the whole way here on those bad knees, and I kept a chair by my door for him that he pretended not to see. I'm not ready to put it back against the wall, so I won't, not yet."],
    ["brandt", "I told Jeremy his knees were finished, and he walked on them out of spite for the rest of the voyage, which was the best medicine he had. I've nothing on my shelf that does what that spite did, so the rest of you will have to be careful with your knees."],
    ["yurbin", "I borrowed Jeremy's tools the whole way out and I brought every one of them back, mostly, and he'd tell me how long a thing had left and he was never wrong, not once, so I wish he'd been wrong about himself."],
    ["iyer", "Mr Donadini gave an honest estimate of how long a machine had left, which I'd value in anyone and seldom found. He helped build the ship that carried us here, so everything that comes down this ramp is, in a fair measure, his work."],
    ["waititi", "Jeremy carried things he shouldn't have on those knees because he wouldn't let a fat man do it for him, and I slipped him the good bread every day and we never said one word about it. He built the ship that brought us here, and somewhere back home his daughter doesn't know yet, and I don't know how to say that part."]],
  halloran: [
    ["solheim", "Roberta stripped my lander for parts and called it a repair, and every machine she touched came back running. She never once put her name to a bodge, and that's the record she leaves."],
    ["achebe", "Roberta could fix anything with anything, and she'd tell you all about it, loudly, and I wouldn't have changed a word of it. She signed off that drive, and it brought every one of us standing here all the way across, so that one's hers."],
    ["dahl", "Roberta took bolts off anything that wasn't watched and I let her, because whatever she built out of them held. She'd want somebody to shout about it, and I'm no good at that, so I'll just say she was right about every ship she ever failed."],
    ["zulu", "Roberta used words in front of my younger people that I'd rather they hadn't learned. She never once left a gate unmended when I asked, and I'd like it on the record that I never thanked her for it."],
    ["nakamura", "Roberta saved more of my patients than half my staff, with a bent spoon and a mouthful of language I won't repeat at a graveside. You signed off the drive that brought us here, so every one of us walking down this ramp has got your name on us."],
    ["brandt", "Roberta labelled exactly none of the bottles, and half of what I cleaned wounds with came out of her still, so a fair number of you are walking about on her account. I'd like a drink poured from the last of it, if anyone can find which one it is."],
    ["yurbin", "Roberta could make a sampler out of a ration tin and swear at me the whole time she was doing it, and I'd have walked into the dark with her down there, because anything we found she'd have fixed, or hit, and now I don't know who I walk in with."],
    ["iyer", "Ms Craigie failed more ships than she passed and was right about every one of them, which is a better record than mine, and she put her name to the drive that brought us in. I asked her for a great many things on the crossing, and I would note that every one she made was made to gauge."],
    ["estrada", "She swore like a drover and fixed whatever broke with whatever was lying about, and she never once let me down. It's too quiet at this ramp without her, and I'd give a good deal to hear her shouting at it."],
    ["waititi", "Roberta! I keep turning round to say something to her, and she isn't there to swear at me. She was the loudest friend I ever had, and the best one to sit up with, and she'd hate me crying about it at the bottom of a ramp, so I'll stop, and I'll open the last jar for her tonight."]],
  nakamura: [
    ["yurbin", "She told me a sample would kill me one day, she said it every watch we had, and I was going to prove her wrong, no, I was going to make her come and look at it first, that was the plan, and she'd have looked, she always looked in the end."],
    ["solheim", "She disobeyed me more than once, and she was right more often than not, so her name goes in my book at the top."],
    ["achebe", "Andrea would walk through a wall for anybody in a bed, and she did it more than once, and I had to talk to her about it, and I'm glad now that I never managed to stop her. Every person she sat up with on the way out, she sat up with like they were the only one."],
    ["dahl", "She put nine stitches in my face on the Kourou docks and I complained through every one, and I never did thank her properly. Thank you, Andrea. That's the first time, and it's late."],
    ["zulu", "Dr Tete patched every one of my people and never asked whose fault it was. She shouted at me about my rota and she was right, and I'm sorry she won't see me keep it now."],
    ["kovacs", "She shouted at me every time the sick bay ran cold, and she was right every time, and she'd have been the first one down this ramp with her bag if anybody was hurt. I'll keep the heat on wherever she'd have wanted it."],
    ["halloran", "Andrea would square up to anybody over a patient, God included, and I was always behind her holding her coat and shouting. I don't know what I do with my hands now."],
    ["iyer", "Dr Tete treated the person in front of her and nobody else, and she refused me tissue twice on grounds I called sentimental, and I'd call them so again. I'd also say that every one of her patients would have chosen her over me, and on a new world that is a cost the colony will feel before I do."],
    ["estrada", "She slipped extra in my bowl on the fast days when she thought I wasn't looking, and I let her. There's nobody I'd sooner have had over a sick bed, and I'll keep a place at the table for her tonight."],
    ["waititi", "Andrea shouted at me about my belly and my sugar and my heart, and every time she was right, and every time I thanked her with pastry. She'd want us to stop standing about and see to whoever's hurting, so that's what I'll do, but not before I've said that I'd have followed her anywhere."]],
  brandt: [
    ["solheim", "Lou told me what the dying needed and what the living could afford, and he never softened either one. He was the one I'd have let tell me I was wrong, and his name's in my book with the rest."],
    ["achebe", "Lou never sugared anything, not once, and I'd sooner have had the truth from him than a kind word from anybody else. He never left a sick bay early in his life, and I don't think he'd want us standing here long either, so let's say his name and then go and look after our people."],
    ["dahl", "Lou could read what was wrong with a man off his face before the scan came back, and he never once left a ward before the last bed was seen to. I kept out of his way, and I'd give a good deal to have him reading me now."],
    ["zulu", "Dr Chang told me to stop taking the night watches, and he was correct, and I hadn't done it. I'll stand the first watch down here tonight all the same, and then I'll do as he said."],
    ["kovacs", "Lou told me straight my knees were finished, and he was right, and he sat up with the dying all the way out without a word to anybody. I always let him have the last say, so I'll not try to have it now."],
    ["halloran", "Lou was ruder than me without one single swear word, and I never worked out how. He never left a ward early in his life, and I'm not leaving this ramp till we've said him properly."],
    ["yurbin", "Lou would look at my readings and tell me what they meant in one breath, and he was right, which was irritating, and then he'd ask if I'd eaten, and I never had, and I haven't today either, and there's nobody to ask."],
    ["iyer", "Dr Chang was the one member of this company who read me accurately, and I find I'd grown used to being read. He told the truth and then sat up all night with what it cost, and the ward has lost thirty years of that, which can't be replaced from anything we brought down."],
    ["estrada", "He told me I couldn't afford my fasts, and he was likely right, and I kept them anyway. He sat up with the dying the whole way out, so I'll say the prayer over him that he'd have told me not to bother with."],
    ["waititi", "Lou told me I was fat and he told me I'd die of it, and here I am at the foot of a ramp on a new world, talking about him. He never left a ward early in his life, and I kept sending him pie because I couldn't think what else to give a man like that."]],
  yurbin: [
    ["kovacs", "Mac borrowed every tool I had and brought them all back with something growing on the handle, and he was sorry every time, and he meant it. He'd have had his face on the window all the way down, so somebody look at the place properly for him."],
    ["nakamura", "You should be here, Mac, you talked about this ground the whole way out. You'd have been off the ramp before it was down, with no gloves on, and I'd have shouted at you for it, and I'd give anything to be shouting at you now."],
    ["solheim", "Mac waited his whole life to stand on a world like this one, and he'd have been off this ramp before it touched the ground. We go by his quarantine rules from today, every one of them, because he wrote them."],
    ["achebe", "Mac waited his whole life to see something alive that wasn't from Earth, and he was that close, he was right there. I'd like the first thing we find growing out there to carry his name, if nobody minds."],
    ["dahl", "Mac waited his whole life to see something alive that wasn't from Earth, and he got as far as the door. Whatever's out there, I'll look at it once for him before I start asking what it wants."],
    ["zulu", "Mac went out without telling me first, every time, and came back so pleased with what he'd found. I always wanted him to take an escort, and I'm sorry he isn't here to see this world, because it's the one he waited for."],
    ["halloran", "Mac wanted to see something alive that wasn't from Earth more than anybody I ever met, and he didn't get to see this place. I built his rigs triple-latched because he never would, and I'll keep his jars safe, boss, every one of them."],
    ["brandt", "Mac was delighted to be alive on a ship heading for a world that might kill him, and I said more than once I'd have been less fond of him if he'd been less likely to go first. I was right about the second part, and I'd rather I hadn't been."],
    ["estrada", "He had no fear in him at all, and he'd have been off this ramp before it was down, wanting to know what everything was. I'll walk out the first clear morning and look at this place properly for him, slow, the way I never could get him to."],
    ["waititi", "Mac waited his whole life to see something alive that wasn't from Earth, and he forgot to eat the whole way here, so I followed him round with a bowl like his mother. It's out there now, whatever it is, and he isn't, and that's the unfairest thing I've ever had to say over a pot."]],
  iyer: [
    ["solheim", "Michelle counted what a thing cost against what it bought, the way I do, and I never once had to explain an order to her. Her figures are in the log, and they'll be used."],
    ["achebe", "Michelle and I didn't always agree, and I told her so, and she told me back, straight, which is all I ever asked of her. She was the sharpest person on that ship, and we're going to need answers down here she'd have had for us."],
    ["dahl", "Michelle never told me what she wanted with two of my watch, and now I'll never know, which I think she'd have found funny. She paid for every answer she ever got, and I'd have liked to see what she made this place pay for its answers."],
    ["zulu", "The professor asked me once for the loan of some of the watch and wouldn't say what for, and I refused her. With respect to her, I'd refuse again, but I'd give a good deal now to have asked her why."],
    ["kovacs", "She'd ask me for a thing that couldn't be undone and tell me what it was for was not relevant, and I'd ask anyway, and we went the whole way out like that. I'd give a fair bit to be asked one more time."],
    ["halloran", "Michelle asked me for things I wouldn't build, and she always asked politely, and she always knew exactly why she wanted them. She was the most exact person I ever worked beside, and I'd have passed any job she signed."],
    ["nakamura", "Michelle and I never agreed about what a person is for, and I watched her every day of the crossing because of it, and she knew. But she never once lied to me about what she was doing, and I'd like that said here, out loud, before we go down."],
    ["brandt", "Michelle once asked me, in the most reasonable voice, how many people a result might be worth, and I've treated that question ever since without curing it. She'd want the record of what she found kept, and you'll keep it, and you'll read it carefully."],
    ["estrada", "She and I never sat easy at a table, and I won't pretend we did, because she'd have known. But she was exact in everything and never once told me a thing that wasn't so, and I'll say a prayer for her that she'd not have asked for."],
    ["waititi", "Michelle and I never once saw it the same way, and she'd put seed in a dish before she'd put it in the ground, and I argued with her about it right up to the end. She was exact about everything, so I'll be exact too: I'm sorry she didn't get to stand on it."]],
  estrada: [
    ["dahl", "He'd have said a prayer over any one of us and meant it, and I've spent the whole morning trying to remember one, and I can't. So the first row of anything that grows here gets his name on a stake, and I think he'd call that fair."],
    ["yurbin", "Samuel had seed in his pockets for the whole crossing, did you know that, actual seed, he showed me, wheat and something else, and I'm going to plant it, I don't know how yet, I'll find out how."],
    ["solheim", "Samuel fasted every time we ran short, which I'd never have ordered, and he still worked every row he was given. He carried that seed the whole way out, so it goes in the ground first, and his name goes in my book."],
    ["achebe", "Samuel worked hard and never complained, never once, and that was the thing that worried me about him. He carried the seed all this way for us, and the least we can do is put it in the ground the way he'd have wanted."],
    ["zulu", "Samuel kept his fasts and I never argued with his faith, I only asked him to eat when he stood a post. He carried his seed all this way, and I'd ask that the first of it goes in the ground with his name on the row."],
    ["kovacs", "Samuel took my night shifts and never said so, and he'd go hungry on a fast day with a pump to fix, and I couldn't make him eat. Somebody plant his seed in the first good ground, and I'll rig the water for it."],
    ["halloran", "Samuel never swore, never shouted, and I never once knew what to say to him, and he never minded. He carried his seed all this way, and I'll build the racks for it, boss, properly, so they last."],
    ["nakamura", "Samuel went hungry for his faith and called it nothing, so I put a little more in his bowl whenever he wasn't looking, and he never caught me, or he let me think he didn't. He brought the seed all this way to feed us, so the first thing that grows here is his."],
    ["brandt", "Samuel fasted when the stores ran low and thanked me for my concern like a man thanking a dog for barking, and I counted his ribs regardless. Whatever he was praying for, the rest of you are standing on it, so eat something today on his account."],
    ["iyer", "Mr Barlow refused me a single seed line for my trials, and I'd still say he was wrong, but he carried his seed across the whole crossing, and it is ours to sow now because he wouldn't spend it. I'd ask that the first row be planted from his stock, since it's the only part of the account he'd have wanted settled."]],
  waititi: [
    ["solheim", "Hamond fed everyone on that ship and kept the wardroom loud the whole way out, and both were worth having. I never laughed at one of his stories, and I'd have let him tell one more at the foot of this ramp."],
    ["achebe", "Hamond knew everybody on that ship by name by the second day, and he made us laugh when none of us felt like it, and I'm grateful for both. He'd want us fed before we did anything else, so that's what we'll do, and we'll do it for him."],
    ["dahl", "Hamond sent soup up to my watch every night and told the whole ship he'd done it, and my lot would've followed him anywhere for it. The first pot we cook down here goes to the ones on the wire, and I'll tell everyone it was his idea."],
    ["zulu", "Hamond sent soup up to the cold posts, and my people talked about it for days after. He knew every one of them by name before I'd finished the roster, and the watch will miss him more than they'll say."],
    ["kovacs", "Hamond promised everybody more than I could build and then came to me to find out how, and I grumbled and built it, every time. There's nobody now to make me, and I don't much like how quiet that is."],
    ["halloran", "Hamond couldn't keep his mouth shut to save his life, and now it's gone quiet, and I goddamn hate it. He'd have known every name on this ramp by tomorrow, so somebody had better learn them for him."],
    ["nakamura", "Hamond always had more people at his table than food on it, and nobody ever left it hungry or alone, and that's the house I wanted, loud and full. There's a chair empty at it now, and I'm going to leave it there for him."],
    ["brandt", "Hamond promised more than the stores could give and then went round apologising, and the apology did more good than most of what was on my shelves. I never told him so, and I'm telling you now because he can't spread it about any more."],
    ["yurbin", "Hamond ate whatever I brought him without asking what it was, every time, and I never knew if that was courage or whether he just trusted me, and I'd have liked him to be the first to taste whatever's growing at the bottom of this ramp."],
    ["iyer", "Mr Shepherd could not keep a confidence, so I never gave him one, and I find there are several things I'd now have liked him to repeat. He fed forty thousand people off salt flats and talked the whole time, and I'd put the colony's chance of eating as well without him at rather less than even."]]
};
const fallen = s => s.people.filter(p => p.seat && !p.alive && p.fell);
LF.fallen = fallen;
const eulogy = (s, d) => { const said = (SAID[d.key] || []).map(([k, line]) => [s.people.find(p => p.key === k && p.seat && p.role && p.alive), line]).filter(x => x[0]);
  const here = said.find(x => !x[0].orbit) || said[0];
  if (!here) return `Nobody finds the words for ${d.first}. The name is read into the log, and the wind takes the rest.`;
  return `${here[0].first} speaks for ${d.name}, ${d.cause.replace(/, on the crossing$/, '')}${here[0].orbit ? ', from orbit, over the lander\'s radio' : ''}.\n\n[[${here[0].id}]] "${here[1]}"`; };
add({ id: 'land.eulogy', view: 'people', arc: 'setup', tone: 'quiet', chain: true, title: 'What Is Said at the Ramp',
  setup: s => { const d = fallen(s); s.flags.fell_n = d.length; return { names: d.map(p => p.first), said: d.map(p => eulogy(s, p)) }; },
  text: (s, c) => `The ramp is down. Before anything comes off the lander, your officers stand at the foot of it for ${and3(c.names)}, who did not live to see this ground.\n\n${c.said.join('\n\n')}`,
  choices: [
    { label: 'Stand with them until it is all said', info: [['people', 'Your officers'], ['danger', 'The first day\'s light']],
      out: { then: 'plan', text: (s, c) => `Nobody hurries it. When it is said, somebody scratches ${c.names.length > 1 ? 'the names' : 'the name'} into the lander's ramp with a hull pick, where every boot coming down will pass ${c.names.length > 1 ? 'them' : 'it'}. The unloading starts late and goes on by lamp.`,
        fx: { mat: -6, off: LF.SEAT_ORDER.map(k => [k, 'mind', 3]), chron: 'The first thing done on the ground was to speak for the officers lost on the crossing.' } } },
    { label: 'Say the names yourself, and start the unloading', info: [['yield', 'The first day\'s work'], ['danger', 'What was left unsaid']],
      out: { then: 'plan', text: (s, c) => `You say ${c.names.length > 1 ? 'the names' : 'the name'}, once, and send the crews to the hold. The reactor is off the lander before dark. Your officers work beside the rest and do not say what they had ready.`,
        fx: { mat: 8, off: LF.SEAT_ORDER.map(k => [k, 'mind', -3]) } } },
  ] });
})();

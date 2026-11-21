/* Landfall — thread: the Rust. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). Every other dread goes for the people. This one goes for the made world: a sheet of hull plate
   in the wreck of the descent stage that was sound last month comes away in the hand, grey right through. Then it is in
   the tool racks, then in the spares store, then in the housing of a machine the colony lives by. It moves along
   whatever touches whatever, and a colony is made of things that touch.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     swarm   the ship's own hull crawlers, seeded in the skin of the descent stage, stripping "damaged" metal for a
             repair that will never be made. They go for whatever is worn hardest. Right: have the ship send the recall
             on the maintenance band. Burning, burying and quarantine only make more damaged metal.
     native  a thread of a thing that lives in this ground on the little metal the rock gives up, and follows the
             richest feed. Right: feed it (give it the stage and a load of plate a month), or lay the machines up and
             leave it nothing. It was under every footing before the first sheet went; the quarantine bought nothing.
     cargo   it came down in one pallet from the aft hold and crosses wherever metal touches metal, on gloves, tools and
             boot nails. Right: break the chain: burn the store, bury the machine, put the handlers and their kit
             outside the wire. Feeding it feeds it.
     air     ordinary corrosion, fast, in an air the alloys were never chosen for. Nothing spreads. Right: grease,
             paint and dry stores. Every drastic answer was a disaster nobody needed.
   Evidence (the plate under the glass, the chart of finds, the four coupons, the handlers' kit, the inside of the
   housing, the ship's log) is drawn per card and points at the truth only most of the time (pickK). It does its damage
   through what the colony already counts: s.res.mat, s.res.parts, s.wreck, machine health and service life (LF.hurt),
   build progress, the lander and the systems aboard. People die of it only as a consequence: a machine with no cord cut
   behind it that fails. It writes unexplained, scarcity, contamination, fear, suspicion and confinement. Nothing here
   knows any other thread. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If } = h;
const ID = 'rust', T = s => LF.T(s, ID), SRC = 'th.rust';
const KINDS = ['swarm', 'native', 'cargo', 'air'];
const RATE = 0.65;   // the dial: how fast it eats
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const is = (s, k) => T(s).truth.is === k;

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  glass: {
    swarm: 'Under the glass the powder is not all powder. Some of the grains are made things, a tenth of a millimetre long, with legs and a jaw, and a few are still walking. The edge of every hole is cut square.',
    native: 'Under the glass the powder is threaded with something pale that branches like a root. It is thickest in the best alloy and thin in the cheap bracket steel, and it runs back toward the side of the sheet that lay on the ground.',
    cargo: 'Under the glass the grey starts at the bolt holes and the lap joints and works inward, and starts nowhere else. Every bad sheet was stacked against another bad sheet. Plate of the same pour that lay alone on the far side of the stage is sound.',
    air: 'Under the glass it is pitting of a common kind, only fast. It is worst on the weather side and under anything that held water, and the powder is plain oxide and salt.' },
  map: {
    swarm: 'Every find is in something that was already damaged: the buckled sheet, the cracked frame, the wrench with the sprung jaw. Sound tools on the same hook are untouched.',
    native: 'The finds run from the stage to the yard in a line along the low ground, and stop at the shed with the most metal in it. One wrench left out on the ground overnight is worse than the forty on the rack.',
    cargo: 'Every find traces back to one crew: the one that emptied the aft hold. What they carried is bad and what they hung their tools beside is bad. The rack by the other door, which they never use, is clean.',
    air: 'The finds make no pattern except height and damp. Low shelves are worse than high ones, and anything by the door is worse than anything by the stove. One rack was oiled at landfall out of habit, and it is clean.' },
  bench: {
    swarm: 'The clean coupon sealed in with a pinch of the grey is untouched. A fifth one, dropped and scored by accident and left on the bench, is eaten through along the score.',
    native: 'The coupon sealed in with a pinch of the grey is eaten. So is the clean one set on bare ground with nothing near it. The one hung in the air on a cord is bright.',
    cargo: 'The coupon sealed in with a pinch of the grey is eaten, and so is the one a storehand picked up after handling bad plate. The one set on bare ground a long way from the stage is bright.',
    air: 'The coupon sealed dry in a jar with a pinch of the grey is bright. The two left in the open are pitted, both the same, the one on the ground and the one on the cord.' },
  kit: {
    swarm: 'Their good tools are sound. What has gone is a boot with a split toecap, a bent buckle and a pry bar with a crack in it. The hauler\'s pin shows clean on the clinic\'s plate.',
    native: 'Their kit is no worse than that of anyone who works outside. The buckles of the field crews, who never went near the stage, are pitted the same, and worst on the ones who kneel on the ground.',
    cargo: 'Everything metal they own is going: buckles, boot nails, the hinges of their lockers. Two bunk rows over, where none of them sleeps, a latch of the same make is bright.',
    air: 'Their kit is no worse than anyone\'s. Every buckle in the colony is pitting at the same rate, the clinic\'s instruments included, and nobody had looked until now.' },
  house: {
    swarm: 'Inside, the grey lies in straight rows along an old weld repair from the crossing, and it has taken the repair and the plate round it and nothing else. A newer patch a hand\'s width away is bright.',
    native: 'Inside, the grey has come up from the footing bolts, where the unit stands on the ground, and is climbing. The top half is clean.',
    cargo: 'Inside, the grey starts at one inspection hatch, round the marks of a wrench, and spreads from there. The wrench is on the list from the tool racks.',
    air: 'Inside, the grey is wherever the unit sweats: under the cold pipes, round the drain, along the seam where wet air gets in. The dry side is clean.' },
  ship: {
    swarm: `The ${LF.SHIP}'s maintenance log has an entry for every month since landfall, in the form her hull crawlers file: damaged section located, material recovered, repair pending. The section numbers belong to the descent stage.`,
    native: `Nothing aboard the ${LF.SHIP} is touched. Plate of the same pour that stayed in her hold is bright, and her log has nothing like this in two centuries of crossing.`,
    cargo: 'Aboard, one bay of the aft hold has a frame gone grey and soft, round the cradle where a single pallet of bearing stock rode the crossing. That pallet came down on the first flight. Nothing else up there is touched.',
    air: `Nothing aboard the ${LF.SHIP} is touched. The yard notes in her hull file give the alloys a service life “in the survey atmosphere”, and the survey was made from orbit.` },
};
const ev = (kind, k) => EV[kind][k];
const LEAN = { swarm: 'something made, off the ship, that goes for whatever is damaged', native: 'something living in this ground that feeds on good metal', cargo: 'one bad load, carried on hands and tools', air: 'this air and nothing else' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what the grey is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };
const leans = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]); return e[0][1] && e[0][1] !== e[1][1] ? e[0][0] : null; };

/* The machines. A cord cut behind one (wells, turbines, fields, the machine shop, the school) makes it a loss and not a death sentence. */
const CORD = { reclaimer: 'water', reactor: 'energy', hydroponics: 'food', fabricator: 'industry', medbay: 'people' };
const MW = { reactor: 'the reactor', fabricator: 'the fabricator', reclaimer: 'the reclaimer', hydroponics: 'the hydroponics bay', medbay: 'the autodoc', lander: 'the lander' };
const PART = { reactor: 'the coolant jacket', fabricator: 'the bed frame', reclaimer: 'the pressure shell', hydroponics: 'the tank racks', medbay: 'the instrument frame', lander: 'the leg struts' };
const NEED = { reclaimer: 'Every cup the colony drinks goes through it, and there is no well.', reactor: 'Every lamp and pump in the colony runs off it, and nothing else here makes power.', hydroponics: 'It feeds two dozen people whatever the season does, and there are no open fields.',
  fabricator: 'Every spare the colony fits is printed on it, and there is no machine shop.', medbay: 'It is the only surgery the colony has.', lander: 'It is the only way up to the ship.' };
const SPARE = { reclaimer: 'The wells would carry the colony without it, though not in comfort.', reactor: 'The colony has other power now, and would miss it less than it once did.', hydroponics: 'The fields feed the colony now, and the bay is what carries it through a bad harvest.',
  fabricator: 'The machine shop can make most of what it prints, slowly.', medbay: 'The school has trained hands enough that the clinic would go on without it, worse.' };
const bare = (s, id) => id === 'lander' || !LF.pillars(s)[CORD[id]];
const downs = s => Object.keys(CORD).filter(id => LF.down(s, id));
const alive = (s, id) => !!id && s.machines[id] && !s.machines[id].lost && (id === 'lander' || !s.machines[id].up);
/* Where it gets in: a machine the colony cannot do without, if one is left. */
function target(s) { const d = downs(s), b = d.filter(id => bare(s, id)); return b.length ? LF.spick(s, b) : d.length ? LF.spick(s, d) : s.machines.lander.lost ? null : 'lander'; }
const shipOK = s => !s.flags.qs_dark && !s.flags.ship_down;

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. ev1, sv, dv: the first name of the
   Engineering, Science or Medical officer if one is at the post to say a line, else null. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}, t = T(s); for (const [k, role] of [['e', 'engineer'], ['d', 'physician'], ['sc', 'xenobio'], ['q', 'quartermaster'], ['cm', 'command'], ['w', 'security']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  o.bv = voice(s, 'engineer'); o.dv = voice(s, 'doctor'); o.sv = voice(s, 'scientist'); o.k = t.k; o.m = alive(s, t.in) ? t.in : null; o.mw = o.m ? MW[o.m] : null; o.lean = lean(t); return o; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const die = (s, t, n) => { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 12))); t.toll += b - s.pop; return b - s.pop; };
const lose = (s, t, k, v) => { v = Math.min(s.res[k], Math.max(0, v)); s.res[k] -= v; t.ate[k] += v; return v; };
const chain = (s, v) => { const t = T(s); t.spread = clamp(t.spread + v, 0, 10); };
const ground = s => { const t = T(s); if (!s.flags.lander_grounded) { s.flags.lander_grounded = s.day; t.grounded = true; } s.flags.rust_cut = s.day; };
const canFly0 = LF.canFly; LF.canFly = (s, n) => !s.flags.rust_cut && canFly0(s, n);
const flyWhy0 = LF.flyWhy; LF.flyWhy = (s, n) => s.flags.rust_cut ? 'The lander is grounded until the rust is out of her' : flyWhy0(s, n);

/* How much of the chain has been broken (cargo), and whether the answer in place is the one this truth needed. */
const broken = t => (t.did.purge ? 3 : 0) + (t.did.buried ? 1 : 0) + (t.did.store ? 1 : 0) + (t.quar || t.did.gang ? 1 : 0) + (t.did.racks ? 0.5 : 0) + (t.did.scrub ? 0.5 : 0) + (t.fed ? 0.5 : 0);
/* Three options at most (2026-11-21): the options that set t.scrape and t.did.gang, goat, pin, scrub, seize are gone. They
   are still read below, so a game saved before plays on as it was. */
const working = t => ({ swarm: !!t.recall, native: !!(t.fed || t.stone), cargo: broken(t) >= 3, air: !!t.grease })[t.truth.is];

function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^rst\./.test(e.id));
  if (s.flags.rust_cut) { delete s.flags.rust_cut; if (t.grounded) delete s.flags.lander_grounded; }
  s.sched.push({ id: 'rst.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
const dead = n => n === 1 ? 'One colonist is dead' : `${Num(n)} colonists are dead`;
const WENT = { reclaimer: n => `The reclaimer's shell let go on the clean side in the night, and nobody saw it until the morning cups were drunk. ${dead(n)} of the water.`,
  reactor: n => `The reactor's coolant jacket split along the grey with a shift in the hall. ${dead(n)} of the steam.`,
  medbay: n => `The autodoc's frame folded with a patient on the table. ${dead(n)} on the ward who would have lived under it.`,
  lander: n => `A leg strut on the lander folded on the pad, and she came down on the fuelling crew. ${dead(n)} under her.` };
/* A machine with nothing behind it fails, and people die of what it was doing for them. */
function went(s, t, id, n) { if (!WENT[id] || !bare(s, id) || t.went[id]) return 0; t.went[id] = s.day; const k = die(s, t, n); if (k) { LF.log(s, WENT[id](k), 'bad'); LF.emit(s, 'grief', 'rst.went', 30, 120, `people died when the rust took ${MW[id]}`); } return k; }
/* Nothing stopped it: it goes through the stores and takes the machine it was in. */
function ran(s, t, share) {
  lose(s, t, 'mat', s.res.mat * 0.3 * share); lose(s, t, 'parts', s.res.parts * 0.35 * share); if (s.wreck > 0) s.wreck = Math.round(s.wreck * (1 - 0.5 * share));
  const id = alive(s, t.in) ? t.in : target(s);
  if (id) { LF.hurt(s, id, -17 * share, -13 * share); const m = s.machines[id]; t.lastIn = id; t.lastLost = m.lost;
    LF.log(s, m.lost ? `${cap(MW[id])} is finished: ${PART[id]} went to grey powder under load.` : `${cap(PART[id])} of ${MW[id]} has been cut back to half its plate to save the rest. It will not run at full load again.`, 'bad');
    if (m.lost || m.hp < 30) went(s, t, id, clamp(Math.round(s.pop * 0.04 * share), 1, 4)); }
  s.morale = clamp(s.morale - 4, 0, 100);
}
/* Nobody ends it with one card: it ends when the season does, by what was done. */
function resolve(s, t) {
  const k = t.truth.is, d = t.did;
  if (k === 'swarm') { if (t.recall) { s.res.mat += 30; for (const id of downs(s)) LF.hurt(s, id, 5, id === t.in ? 4 : 0);   /* told what to mend, the crawlers mend it */ return finish(s, t, 'recalled', 'The ship called her hull crawlers off the colony, and the rust stopped the same night.'); }
    if (t.stone) return finish(s, t, 'starved', 'The colony laid its machines up in grease and went to hand tools, and the rust found nothing more worth taking.');
    ran(s, t, d.purge || d.buried ? 1.2 : 1); return finish(s, t, 'ran', 'The rust went through the stores and into the machines, and nothing the colony did slowed it.'); }
  if (k === 'native') { if (t.fed) return finish(s, t, 'fed', 'The colony gave the rust the descent stage and a load of plate a month, and it stayed where it was fed.');
    if (t.stone) return finish(s, t, 'starved', 'The colony laid its machines up in grease and went to hand tools, and the rust found nothing more worth taking.');
    ran(s, t, t.jacket ? 0.6 : 1); return finish(s, t, 'ran', 'The rust went through the stores and into the machines, and nothing the colony did slowed it.'); }
  if (k === 'cargo') { if (broken(t) >= 3) return finish(s, t, 'purged', 'Everything the rust had touched was burned or buried, and it went no further.');
    ran(s, t, clamp(1.1 - 0.25 * broken(t), 0.4, 1.1)); return finish(s, t, 'ran', 'The rust went through the stores and into the machines, and nothing the colony did slowed it.'); }
  if (t.grease) return finish(s, t, 'kept', 'The colony learned to keep its metal greased and dry, and the rust slowed to what a brush can hold.');
  if (d.purge || d.buried || t.stone || t.quar || d.store) return finish(s, t, 'needless', 'The colony learned what the rust was after it had burned, buried and shut out what it could not get back.');
  finish(s, t, 'weather', 'The colony learned what the rust was, and that it had been losing metal to the air since the hatch opened.');
}
const ATE = ['Another stack of plate in the yard has gone soft in the middle. The top sheets are sound and the ones under them are powder.', 'A keg of fastenings was opened this morning and poured out grey.', 'A cartload of plate cut at the stage was grey by the time it reached the yard.',
  'Three more bins in the spares store have dust in the bottom of them.', 'A run of pipe laid in the first season was lifted today in pieces.'];
/* Once a month from the first sheet. What it eats, and how fast, is the one thing each truth does differently, and the
   totals come out near enough alike that the yard's figures alone say little. */
function month(s, t) {
  const k = t.truth.is, ph = t.phase, late = ['gate', 'choice', 'bill'].includes(ph);
  let f = ({ sign: 0.5, found: 0.8, gate: 1, choice: 1.1, bill: 1.1 }[ph] || 0) * RATE * (working(t) ? 0.2 : 1);
  if (!f) return;
  const rich = (s.wreck || 0) > 40, guard = t.guard && s.day < t.guard ? 0.6 : 1;
  const pr = { swarm: { mat: 0.7, parts: 1, wreck: 1, mach: 1.4 }, native: rich ? { mat: 0.5, parts: 0.4, wreck: 2.2, mach: 0.5 } : { mat: 1.4, parts: 1, wreck: 1, mach: 1.2 },
    cargo: (g => ({ mat: g, parts: g * 1.2, wreck: g, mach: g }))(0.45 + 0.11 * t.spread), air: { mat: 0.6, parts: 0.6, wreck: 0.6, mach: 1 } }[k];
  if (k === 'cargo' && !t.quar && broken(t) < 3) chain(s, 1);
  if (t.fed) { lose(s, t, 'mat', 5); if (k === 'native') return; }
  if (t.jacket) lose(s, t, 'mat', 4);
  const a = lose(s, t, 'mat', Math.max(2, s.res.mat * 0.05) * f * pr.mat * guard) + 4 * lose(s, t, 'parts', Math.max(0.4, s.res.parts * 0.05) * f * pr.parts * guard);
  if (s.wreck > 0 && !t.fed) s.wreck = Math.max(1, s.wreck - 9 * f * pr.wreck);
  if (s.project && !LF.PROJECTS[s.project].repeat) s.progress *= 1 - 0.01 * f;
  if (a >= 5 && LF.srand(s) < 0.45) LF.log(s, LF.spick(s, ATE), 'bad');
  if (!late) return;
  // The machines. swarm: whatever is worn hardest. native, cargo: the one it got into. air: all of them, a little.
  const jk = t.jacket ? { native: 0, swarm: 1, cargo: 0.7, air: 0.6 }[k] : 1, base = f * pr.mach * guard * (t.scrape ? 0.4 : 1) * (t.patched ? 0.7 : 1) * jk * (t.fitted && k !== 'air' ? 1.3 : 1);
  const hit = (id, x) => { if (!alive(s, id) || x <= 0) return; LF.hurt(s, id, -1.7 * x, -0.9 * x);
    const m = s.machines[id]; if (m.lost) { LF.log(s, `${cap(MW[id])} is finished: ${PART[id]} went to grey powder under load.`, 'bad'); went(s, t, id, 2); }
    else if (m.hp < 34 && LF.srand(s) < 0.2) went(s, t, id, 1); };
  if (k === 'air') { for (const id of downs(s).concat('lander')) hit(id, 0.3 * base); }
  else { const d = downs(s).sort((x, y) => s.machines[x].hp - s.machines[y].hp); hit(k === 'swarm' ? d[0] || t.in : t.in, base);
    if (k === 'cargo' && t.spread >= 6) for (const id of d) if (id !== t.in) hit(id, 0.25 * base); }
  if (t.scrape && LF.srand(s) < 0.22 && die(s, t, 1)) LF.log(s, 'One of the detail scraping inside the housing was caught when the load came on. The rest finished the shift.', 'bad');
  if (t.fitted && !t.seized && LF.srand(s) < 0.3) { t.seized = s.day; const id = LF.spick(s, downs(s)); if (id) { LF.hurt(s, id, -9, -3); LF.log(s, `A bearing race passed as sound has seized in ${MW[id]}, grey in the break.`, 'bad'); } }
  // The flights go on and nobody aboard was told: what crosses by touch, or stands on this ground, goes up with the lander.
  if (t.silent && (k === 'cargo' || k === 'native') && !s.machines.lander.lost) { LF.hurt(s, 'lander', -3, -2); const up = LF.aboard(s);
    if (k === 'cargo' && shipOK(s) && up.length && LF.srand(s) < 0.5) { const id = LF.spick(s, up); LF.hurt(s, id, -6, -5); t.upHit = id; } }
}

LF.thread({ id: ID, name: 'The Rust', view: 'colony', dread: true,
  clue: (s, t) => ({ txt: 'A stores ledger with a column ruled in by hand on every page, headed SOUND. The ticks in it stop halfway down the last sheet.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'the bad plate' : 'the rust',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What is eating the colony\'s metal?',
  chap: {
    recalled: t => `The rust was the ${LF.SHIP}'s own hull crawlers, stripping the colony for a repair that was never going to be made. The colony had the ship call them off.`,
    fed: t => 'The rust was a living thing of this ground that eats refined metal. The colony gave it the descent stage and a load of plate a month, and it stays where it is fed.',
    starved: t => `The rust was ${t.truth.is === 'swarm' ? 'the ship\'s own hull crawlers' : 'a living thing of this ground that eats refined metal'}. The colony laid its machines up and went to hand tools sooner than go on feeding it.`,
    purged: t => 'The rust came down in one bad load and travelled by touch. The colony burned and buried everything on the chain, and it stopped there.',
    kept: t => 'The rust was only rust, fast, in an air the ship\'s alloys were never chosen for. The colony learned to keep its metal greased and dry.',
    needless: t => `The rust was only rust, in an air the ship's alloys were never chosen for. The colony ${t.did.purge ? 'burned its spares, buried a working machine and put its salvage crew outside the wire' : t.did.buried ? 'buried a working machine' : t.stone ? 'laid up its machines' : t.quar ? 'put its salvage crew outside the wire' : 'burned its spares'} before it found that out.`,
    weather: t => 'The rust was only rust, in an air the ship\'s alloys were never chosen for. The colony had been losing metal to it since the hatch opened.',
    ran: t => ({ swarm: `The rust was the ${LF.SHIP}'s own hull crawlers. Nobody had the ship call them off, and they stripped the colony to its fastenings.`, native: 'The rust was a living thing of this ground that eats refined metal. The colony fought it for every sheet, and lost most of them.',
      cargo: 'The rust came down in one bad load and travelled by touch. The chain was never broken, and it went through the stores and into the machines.' })[t.truth.is] || 'The rust went through the stores and into the machines.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, k: LF.sri(s, 5, 8), spread: 1, toll: 0, ate: { mat: 0, parts: 0 }, went: {}, in: null }); },
  tick: (s, t) => {
    if (t.end) { if (s.day % 10 === 0 && t.end === 'fed' && s.res.mat >= 8) s.res.mat -= 4; return; }   // the load of plate carted out to the stage each month
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'sign'); s.signs.push({ id: 'damage', d: s.day, src: SRC }); LF.cue(s, 'rst.plate', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'sign') { if (since('rst.plate') >= 10) once('racks', 'rst.racks');
      if (since('rst.racks') >= 10 || since('rst.plate') >= 40 || age >= 70) { LF.phase(s, ID, 'found', 'The grey that took the plate at the descent stage was found in the colony\'s tools.'); LF.cue(s, 'rst.bench', 0, 4); s.signs.push({ id: 'stores_short', d: s.day, src: SRC }); } }
    else if (t.phase === 'found') { if (since('rst.bench') >= 10 && once('spares', 'rst.spares')) lose(s, t, 'parts', s.res.parts * 0.15);
      if (since('rst.bench') >= 4 && s.project && !LF.PROJECTS[s.project].repeat && s.progress > 20) once('bolts', 'rst.bolts');
      if (since('rst.spares') >= 12 || since('rst.bench') >= 45 || age >= 100) { LF.phase(s, ID, 'gate'); t.in = target(s); LF.cue(s, 'rst.housing', 0, 4); s.signs.push({ id: 'machine_fault', d: s.day, src: SRC }); s.tension = clamp(s.tension + 5, 0, 100); } }
    else if (t.phase === 'gate') { if (since('rst.housing') >= 10) once('hands', 'rst.hands'); if (since('rst.hands') >= 5 && shipOK(s)) once('ship', 'rst.ship');
      if (t.quar && s.day - t.quar >= 20 && once('out', 'rst.out')) die(s, t, 1);
      if (since('rst.hands') >= 24 || since('rst.housing') >= 50 || age >= 120) { LF.phase(s, ID, 'choice'); jump(s, 'rst.choice', 20); } }
    else if (t.phase === 'choice') { if (t.quar && s.day - t.quar >= 20 && once('out', 'rst.out')) die(s, t, 1);
      if (since('rst.choice') >= 20 || age >= 60) { LF.phase(s, ID, 'bill'); jump(s, 'rst.gives', 20); } }
    else if (t.phase === 'bill') { if (t.quar && s.day - t.quar >= 20 && once('out', 'rst.out')) die(s, t, 1); if (since('rst.gives') >= 22 || age >= 70) return resolve(s, t); }
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) { const late = ['gate', 'choice', 'bill'].includes(t.phase), m = alive(s, t.in) ? t.in : null;
      if (t.insight < 60) LF.emit(s, 'unexplained', SRC, t.phase === 'sign' ? 32 : 28, 8, 'ship\'s plate is going to grey powder and nobody can say why');
      if (t.phase !== 'sign') { LF.emit(s, 'scarcity', SRC, late ? 34 : 26, 8, 'the yard loses plate and spares to the rust every month'); LF.emit(s, 'contamination', SRC, late ? 32 : 24, 8, 'the rust is in the tools and the stores'); }
      if (late && m && bare(s, m)) LF.emit(s, 'fear', SRC, 30, 8, `the rust is in the housing of ${MW[m]}`);
      if (late && s.used['rst.hands'] !== undefined && !t.vouch && !t.quar) LF.emit(s, 'suspicion', SRC, 28, 8, 'nobody can say whether the salvage crew carries the rust on its hands');
      if (t.quar) LF.emit(s, 'confinement', SRC, 25, 8, 'the salvage crew is kept outside the wire on account of the rust'); }
  },
  /* The brushes, the grease, the doubled inspections; and afterwards, what was learned or never dealt with. */
  press: (s, t, P) => { if (t.phase === 'latent') return;
    if (t.end) { if (t.end === 'kept') { P.labor -= 0.01; P.wear -= 0.06; } else if (t.end === 'weather' || (t.end === 'needless' && !t.grease)) P.wear += 0.06; if (t.stone) P.labor -= 0.03; return; }
    let d = { sign: 0, found: 0.01, gate: 0.02, choice: 0.025, bill: 0.02 }[t.phase] || 0;
    if (t.grease) d += 0.015; if (t.quar) d += 0.015; if (t.stone) d += 0.03; P.labor -= d; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));

/* ======================= SIGN: the stage, and the tool racks ======================= */
B('sign', { id: 'rst.plate', tone: 'pressure', title: 'Sound Last Month',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)), wreck: (s.wreck || 0) > 0 }),
  text: (s, c) => `The salvage crew at the descent stage has stopped work. A sheet of hull plate from the aft hold, which rang under the hammer last month, came away in a cutter's hands like wet biscuit. It is grey right through, and so is the frame behind it for a dozen paces. ${c.wreck ? 'Most of what the yard builds with is still cut out of that stage.' : 'The stage gave up its loose plate long ago, and what is going now is the frame.'}\n\n${c.bv ? `[[engineer]] "That's ship's alloy, and I bolted half of it on myself." "She's rated two hundred years in vacuum and she doesn't do that, and in near thirty years of cutting her I've never seen anything do that to her."` : `${c.E} says ship's alloy is rated for two centuries in vacuum, and has never been seen to do that.`}`,
  choices: [
    { label: 'Put the bad plate under the glass for the month', note: 'The cutters stand idle while it is looked at, and the yard goes short of plate.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} has the month with it. ${ev('glass', c.ev)}`, fx: (s, c) => ({ mat: -8, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The sample went on going after it was cut. By the time a lamp was rigged over it there was a tray of grey dust and a stain on the bench, and the bench vice has begun to pit.', fx: s => ({ mat: -8, parts: -2, do: s2 => { learn(s2, T(s2), 6); chain(s2, 1); } }) } },
    { label: 'Rope off the aft end of the stage, and cut only from the far side', note: 'A third of what is left to salvage is given up where it stands.',
      out: { text: 'A line goes up across the stage amidships, with rags tied on it. The cutters start again at the bow end, where the plate is thinner and the frames are harder to get at.',
        fx: (s, c) => ({ mat: c.wreck ? 0 : -10, chips: c.wreck ? [['Less left to salvage', false]] : [], do: s2 => { const t = T(s2); if (s2.wreck > 0) s2.wreck = Math.max(1, Math.round(s2.wreck * 0.68)); t.did.roped = true; chain(s2, -1); } }) } },
    { label: 'Put the punishment detail on the bad section, to strip everything still sound out of it this month', dark: true, note: 'The yard gets the plate before the grey does, from people who spend the month up to the elbows in it and were not asked.', info: [['yield', 'Materials'], ['danger', 'The punishment detail']],
      out: { text: 'The detail has the section down to the keel beam in the month, working without gloves because the gloves went first. The sound plate is stacked apart. Two of the detail have sores between the fingers that the clinic has no name for.',
        fx: s => ({ mat: 45, stain: ['rst_strip', 2], do: s2 => { const t = T(s2); if (s2.wreck > 0) s2.wreck = Math.max(1, s2.wreck - 40); t.did.strip = true; chain(s2, 1); } }) } },
  ] });

B(['sign', 'found'], { id: 'rst.racks', tone: 'pressure', title: 'The Tool Racks',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)), n: LF.sri(s, 14, 22) }),
  text: (s, c) => `A wrench broke across the jaw in the fitting shed this morning, and the break was grey. ${c.Q} went through the tool racks after it. ${Num(c.n)} tools on the first two racks crumble at the edges, a drill bit went to powder in the chuck, and the hooks they hang from are pitted. The racks are two hundred paces from the stage.\n\n${c.bv ? `[[engineer]] "So it walks, then, and it found the tools before it found me." "Or somebody carried it in on their boots, and either way I want to know what else is hanging on the wrong hook before it gets into the old girl."` : `${c.E} wants to know what else is hanging on the wrong hook.`}`,
  choices: [
    { label: 'Chart every find for the month: what it is, where it was, what it hung beside', note: 'The shops work the month with half their tools tagged and laid out on a sheet.', test: { base: 50, mods: [R('engineer', 10), R('quartermaster', 5)] },
      ok: { text: (s, c) => `The chart takes the month and covers the mess hall wall. ${ev('map', c.ev)}`, fx: (s, c) => ({ progress: -0.05, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The chart fills three sheets and shows only that there are more finds each time anyone looks. Whoever kept the second sheet stopped marking where things had hung.', fx: s => ({ progress: -0.05, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Burn out both racks, hooks and all, and bury the slag', note: 'The shops lose a third of their hand tools, and every job waits its turn for what is left.',
      out: { text: 'Both racks go into the kiln pit with everything on them, and the slag is carted out past the wire. For the rest of the month three crews share one set of spanners.',
        fx: s => ({ parts: -5, progress: -0.08, do: s2 => { const t = T(s2); t.did.racks = true; chain(s2, -2); } }) } },
    { label: 'Issue the pitted tools to the field crews, and keep the sound ones for the shops', dark: true, note: 'The shops lose nothing, and the people furthest from the clinic work with tools that may break in the hand.', info: [['yield', 'The shops keep their tools'], ['danger', 'The field crews']],
      out: { text: 'The field crews draw their tools from the bad racks from now on. Before the month is out a mattock head comes off on the swing in the outer field and opens a hauler\'s leg to the bone.',
        fx: s => ({ morale: -1, stain: ['rst_issue', 1], do: s2 => { const t = T(s2); t.did.issue = true; chain(s2, 2); } }) } },
  ] });

/* ======================= FOUND: the bench, the spares, the bolts ======================= */
const TRIAL = {
  swarm: c => `The bad plate sits bolted to ${c.mw} all month and the housing under it stays bright. On the far side, round an old dent from the landing, the grey has started by itself.`,
  native: c => `The bad plate sits bolted to ${c.mw} all month and the housing under it is etched in its outline. It is etched as deep round the footing bolts, where nothing was put.`,
  cargo: c => `Inside the month the housing under the bad plate is grey in its exact outline, to the bolt holes. Nothing else on ${c.mw} is marked.`,
  air: c => `The bad plate sits bolted to ${c.mw} all month and nothing crosses. The housing under it, kept dry by it, is the brightest part of the unit.`,
};
B('found', { id: 'rst.bench', tone: 'pressure', title: 'Four Coupons',
  setup: s => { const t = T(s), m = target(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.15), m, mw: m ? MW[m] : null }); },
  text: (s, c) => `${c.Sc} has cut four clean coupons from one sound sheet and wants a month with them: one sealed in a jar with a pinch of the grey, one sealed dry and alone, one on bare ground, one hung in the air on a cord. ${c.E} has a shorter test, which is to bolt a bad plate to something that matters and see whether it crosses.\n\nThe yard has lost plate again this month. ${c.lean}`,
  choices: [
    { label: 'Give the bench its month', note: 'The grey has the run of the yard for that month, and the bench may show nothing.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `The four are read on the last day of the month. ${ev('bench', c.ev)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: 'A storehand tidied the bench in the second half of the month and stacked the four coupons together in one tray. All four are pitted, and nothing can be read from them.', fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: (s, c) => `Bolt a bad plate to the housing of ${c.mw}, and tell nobody who depends on it`, dark: true, show: (s, c) => !!c.m, note: 'It is the one test that cannot mislead, and it is run on a machine the colony lives by.', info: (s, c) => [['yield', 'What the grey is'], ['danger', cap(c.mw)]],
      out: { text: (s, c) => TRIAL[T(s).truth.is](c),
        fx: (s, c) => ({ stain: ['rst_trial', 2], do: s2 => { const t = T(s2), k = t.truth.is; learn(s2, t, 30, k); learn(s2, t, 15, k); t.did.trial = true; if (k === 'cargo' || k === 'native') LF.hurt(s2, c.m, -8, -6); else if (k === 'swarm') LF.hurt(s2, c.m, -4, -2); if (k === 'cargo') chain(s2, 1); } }) } },
    { label: 'Skip the trial, and put the month into grease: every housing, rack and bin', cost: { mat: 15 }, note: 'It answers nothing, and the crews lose the month to rags and drums.',
      out: { text: 'Every housing is wiped down and greased, every rack is oiled, and the bins are lined with waxed cloth. The shops smell of it. Nobody knows yet whether the grey minds.',
        fx: s => ({ progress: -0.06, do: s2 => { const t = T(s2); t.guard = s2.day + 120; t.did.greased = true; } }) } },
  ] });

B(['found', 'gate'], { id: 'rst.spares', tone: 'crisis', title: 'The Spares Store',
  setup: s => Object.assign(crew(s), { thin: s.res.parts < 12 }),
  text: (s, c) => `${c.Q} opened the spares store for a bearing and found the bin half grey. Seals, shafts and bearing races in six bins have gone the way of the plate, and there is powder on the shelves under them. ${c.thin ? 'The store was thin before this.' : 'What is left on the shelves looks sound.'} Every machine the colony owns is kept running out of that room.\n\n${c.bv ? `[[engineer]] "Give me a lamp and the night and I can tell you which ones are bad today." "What I can't tell you is which are bad next month, so fit one in a machine and you'll find out with her covers on and her running."` : `${c.E} can say which spares are bad today, and not which will be bad next month.`}`,
  choices: [
    { label: 'Turn out every bin, and sort the spares one by one', note: 'The shops lend every hand they have for the month, and the sorting is only as good as the light.', test: { base: 50, kind: ['fix'], mods: [R('quartermaster', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `It takes the month. A tenth of the store goes into the pit. The rest is tagged, oiled and shelved on new boards, and ${LF.sentName(s, 'quartermaster')} signs for every bin.`, fx: s => ({ parts: -Math.round(s.res.parts * 0.1), progress: -0.05, do: s2 => { T(s2).did.sorted = true; chain(s2, -1); } }) },
      bad: { text: 'The sorting is done by eye, in bad light, by people who want it over. Before the month is out a race passed as sound seizes on the test stand, and the bins are turned out a second time.', fx: s => ({ parts: -Math.round(s.res.parts * 0.3), progress: -0.05 }) } },
    { label: 'Burn the store as it stands, and start the spares again from nothing', note: 'The good goes with the bad, and every repair in the colony waits on new spares.',
      out: { text: 'The shelves are carried out and burned in the kiln pit with everything on them. What will not burn is buried. The store is scrubbed to the boards and stands empty but for one bin.',
        fx: s => ({ parts: -Math.round(s.res.parts * 0.75), do: s2 => { const t = T(s2); t.did.store = true; chain(s2, -3); } }) } },
    { label: 'Pass the store as sound, and fit what looks good while it lasts', dark: true, note: 'Every overdue repair is done this month, with spares nobody can vouch for and no word to the crews who run the machines.', info: [['yield', 'Repairs'], ['later', 'Whatever they are fitted to']],
      out: { text: 'The store is logged as inspected. The repair list that has been waiting since landfall is worked off in the month, and the machines run sweeter than they have all year. The fitters were told the spares had been checked.',
        fx: s => ({ stain: ['rst_fitted', 2], chips: [['Machines repaired', true]], do: s2 => { const t = T(s2); for (const id of downs(s2)) LF.hurt(s2, id, 7, 0); t.fitted = s2.day; t.did.fitted = true; chain(s2, 2); } }) } },
  ] });

B(['found', 'gate'], { id: 'rst.bolts', tone: 'pressure', title: 'One Bolt in Three',
  when: s => !!s.project && !LF.PROJECTS[s.project].repeat,
  setup: s => Object.assign(crew(s), { proj: LF.projName(s, s.project).toLowerCase() }),
  text: (s, c) => `Work on the ${c.proj} has stopped. A bolt sheared under a spanner on the high frame, grey in the break, and when ${c.e} had the rest sounded with a hammer one in three rang dull. They came out of four kegs and nobody marked which. The frame is carrying load on them now.`,
  choices: [
    { label: 'Strip the frame, and sound every fastening before a hand goes back up', note: 'The build loses most of what has been done on it.',
      out: { text: 'The frame comes down to its footings and every bolt is rung on an anvil. A third go into the pit. The crew starts again from the sills.', fx: s => ({ mat: -8, progress: -0.35 }) } },
    { label: 'Keep building, and put the punishment detail on the high frame', dark: true, note: 'The build keeps its month, and the people on the part most likely to come down did not choose to be there.', info: [['yield', 'The build'], ['danger', 'The detail on the frame']],
      out: { text: 'The work goes on at full pace with the detail on the top course. The frame holds for most of the month. Then a stringer lets go on the last shift and takes one of the detail down with it.',
        fx: s => ({ pop: -1, stain: ['rst_frame', 2], do: s2 => { const t = T(s2); t.toll++; t.did.frame = true; } }) } },
    { label: 'Change them out as they are found, and keep building under them', note: 'The crew works below a frame nobody has finished checking.', test: { base: 50, kind: ['build'], mods: [R('engineer', 10)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'engineer'))} has two fitters on the frame with hammers all month, a course ahead of the builders. Ninety bolts are changed. Nothing comes down.`, fx: s => ({ parts: -2, progress: -0.1 }) },
      bad: { text: 'The fitters are a course behind the builders by the middle of the month. A stringer lets go under a load of plate, and a rigger who was standing below it is dead.', fx: s => ({ pop: -1, progress: -0.25, do: s2 => { T(s2).toll++; } }) } },
  ] });

/* ======================= GATE: the housing, the handlers, the ship ======================= */
B('gate', { id: 'rst.housing', tone: 'crisis', title: 'In the Housing',
  when: (s, t) => alive(s, t.in),
  setup: s => { const t = T(s), c = crew(s); return Object.assign(c, { ev: pickK(s, t, 0.1), part: PART[c.m], need: bare(s, c.m) ? NEED[c.m] : SPARE[c.m], bare: bare(s, c.m) }); },
  text: (s, c) => `It is in ${c.mw}. ${c.E} had the covers off for a routine check and found ${c.part} grey along the inside for the length of an arm, soft enough to mark with a thumbnail. The unit is still running. ${c.need}\n\n${c.bv ? `[[engineer]] "She'll hold a while like that, if nobody leans on her." "Don't ask me how long a while is, because last month I'd have told you twenty years and meant it."` : `Nobody in the shops will say how long ${c.part} holds like that.`}`,
  choices: [
    { label: 'Shut down, cut the grey out to bright metal, and plate over the hole', cost: { parts: 5 }, note: 'The colony goes without the unit for most of a month, and somebody cuts into a housing nobody trusts.', test: { base: 50, kind: ['fix'], mods: [R('engineer', 10)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'engineer'))} has ${c.mw} down for most of the month, cuts back a hand's width past the last of the grey and welds in new plate. ${ev('house', c.ev)}`,
        fx: (s, c) => ({ machine: { [c.m]: -4 }, cap: { [c.m]: -4 }, do: s2 => { const t = T(s2); learn(s2, t, 20, c.ev); t.patched = s2.day; } }) },
      bad: { text: (s, c) => `${cap(c.part)} lets go under the torch with the system still warm. One fitter is dead of it, and the patch that went on afterwards is twice the size of the one planned.`,
        fx: (s, c) => ({ pop: -1, machine: { [c.m]: -16 }, cap: { [c.m]: -9 }, do: s2 => { const t = T(s2); t.toll++; t.patched = s2.day; } }) } },
    { label: 'Shut down for good, cut the whole unit out, and bury it past the wire', note: (s, c) => c.bare ? 'The colony loses a machine it has nothing to replace, by its own order, while that machine still runs.' : 'The colony loses a working machine by its own order, and leans on what it built to follow it.', info: (s, c) => [['yield', 'Nothing it touches from now on'], ['danger', cap(c.mw)]],
      out: { text: (s, c) => `${cap(c.mw)} is run down for the last time, cut off its footings and dragged out past the wire on rollers. The pit is dug by hand. The crews who kept the unit running since landfall fill it in.`,
        fx: (s, c) => ({ machine: { [c.m]: -200 }, morale: -3, do: s2 => { const t = T(s2); t.did.buried = c.m; chain(s2, -2); }, chron: (s2, c2) => `The colony buried ${c2.mw} past the wire while it still ran.` }) } },
    { label: 'Bolt a jacket of scrap plate round the housing, and let the grey have that first', cost: { mat: 20 }, note: 'The yard gives up plate every month to keep the jacket whole, on a guess about what the grey prefers.',
      out: { text: (s, c) => `A second skin of scrap plate goes on round ${c.part}, bolted hard against it. By the end of the month the outer face of the jacket is soft, and a new sheet is cut for it.`,
        fx: s => ({ do: s2 => { const t = T(s2); t.jacket = s2.day; t.did.jacket = true; } }) } },
  ] });

B(['gate', 'choice'], { id: 'rst.hands', view: 'people', tone: 'pressure', title: 'Whoever Touched It',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.1) }); },
  text: (s, c) => `The hall has worked out who emptied the aft hold. ${Num(c.k)} of the salvage crew have handled the grey since the first sheet, and this month the stove in their bunk row is pitted and the latch of their door came off in somebody's hand. At supper the bench on either side of them was empty.\n\nOne of the ${num(c.k)}, a hauler, has a steel pin in the thigh from an old break.${c.dv ? `\n\n[[physician]] "It's a pin, I put pins like that in people every week in Johannesburg, and that hauler hasn't dared sit down to supper since." "It's in bone, and nobody's cutting into a good leg because a door latch fell off, so you tell them that, or I will."` : ` ${c.D} was asked about the pin in the mess, loudly.`}`,
  choices: [
    { label: (s, c) => `Have the ${num(c.k)} and everything they own gone over`, note: 'They are stripped and gone over in the clinic like stock, with the hall knowing why.', test: { base: 50, mods: [R('physician', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `It takes most of the month, one of them at a time. ${ev('kit', c.ev)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: 'Nothing is found that could not be found on anyone. The hall hears that they were examined and that nothing was said afterwards, and draws its own conclusion.', fx: s => ({ morale: -1, do: s2 => { learn(s2, T(s2), 6); LF.emit(s2, 'suspicion', 'rst.hands', 30, 100, 'the salvage crew was examined for the rust and nothing was said'); } }) } },
    { label: 'Put them in the old survey shelter outside the wire, with their tools, until it is known', dark: true, note: 'If hands carry it, it stops with them. If not, they sleep outside the wire for nothing.', info: (s, c) => [['yield', 'Nothing they touch comes inside'], ['danger', `The ${num(c.k)}`]],
      out: { text: (s, c) => `They are walked out through the gate at dusk with their bedding and their tool rolls. The survey shelter has a roof and three walls. Food is left at the last post each morning, and the bowls are not brought back in.`,
        fx: s => ({ tension: -4, stain: ['rst_quar', 2], do: s2 => { const t = T(s2); t.quar = s2.day; t.did.quar = true; chain(s2, -2); } }) } },
    { label: 'Say at muster that they are a salvage crew and nothing else, and sit at their bench', note: 'If hands do carry it, everything they touch from tonight is on your word.',
      out: { text: 'You say it once at muster and eat supper between two of them. The benches fill in again over the month, slowly. Their door has a new latch, of wood.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.vouch = s2.day; t.did.vouch = true; chain(s2, 2); LF.ease(s2, 'suspicion', 'rst.vouch', 20, 150); } }) } },
  ] });

B('gate', { id: 'rst.ship', view: 'ship', tone: 'pressure', title: 'What Came Down',
  when: s => shipOK(s),
  setup: s => { const t = T(s), up = LF.inOrbit(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.15), up: up.length, wait: s.sleepers > 0 || up.length > 0 || LF.aboard(s).length > 0, lander: !s.machines.lander.lost }); },
  text: (s, c) => `Everything the colony owns came down from the ${LF.SHIP}${c.wait ? ', and there is more aboard that it is still waiting on' : ''}. Two things want settling: whether the grey is up there too, and whether ${c.lander ? 'the lander has been carrying it between' : 'it rode down in the lander while there was one'}. ${c.up ? 'The officers still aboard can open the holds and look.' : 'Nobody is aboard to look, and the ship can only be asked what her own logs say.'}${c.lander ? '\n\nThe lander stands on the pad with its legs on bare ground and a film of grey dust on the ramp.' : ''}`,
  choices: [
    { label: 'Have the holds and the maintenance log gone through, frame by frame', note: 'It is a month of the radio room and the bench while the yard goes on losing plate.', test: { base: 50, mods: [R('engineer', 10), R('command', 5), If((s, c) => c.up > 0, 10, 'Officers aboard to look')] },
      ok: { text: (s, c) => `The answer comes down over the month, a few frames each pass. ${ev('ship', c.ev)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: 'The log is two centuries long and was filed by machine for machines. A month of passes gets through eleven years of it and finds nothing anyone can read as an answer.', fx: s => ({ do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Ground the lander: nothing goes up or comes down until it is known what this is', show: (s, c) => c.lander, note: (s, c) => c.wait ? 'Whoever and whatever is still aboard stays there, for as long as the question takes.' : 'The one way up to the ship is shut, for as long as the question takes.', info: [['yield', 'The ship kept clear of it'], ['danger', 'Everything still aboard']],
      out: { text: 'The lander is chocked and sheeted on the pad, and the fuel line is uncoupled. The radio room tells the ship why. The ship acknowledges, and asks for how long.',
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); ground(s2); t.cut = s2.day; t.did.cut = true; } }) } },
    { label: 'Keep the flights running, and tell the ship nothing', dark: true, show: (s, c) => c.lander, note: 'The colony gets its people and its machines down on time, and nobody aboard is told what the lander may be bringing up to them.', info: [['yield', 'The flights'], ['later', 'The ship, and whoever is aboard']],
      out: { text: 'The flight plan stands and the radio room is told to keep the grey out of the traffic. The lander\'s ramp is swept before each launch, with a yard broom.',
        fx: s => ({ morale: 1, stain: ['rst_silent', 2], do: s2 => { const t = T(s2); t.silent = s2.day; t.did.silent = true; } }) } },
    /* Three on screen: with a lander on the pad, saying nothing is the option above; this one is for a colony with none. */
    { label: 'Leave the ship out of it, and keep the radio room on its ordinary traffic', show: (s, c) => !c.lander, note: 'Nobody loses a month to the question, and nobody learns whether the ship is clean.',
      out: { text: 'The passes go on carrying weather, stores returns and the sleepers\' telemetry. Nobody asks the ship about the grey, and the ship has no way to ask about it herself.',
        fx: s => ({ do: s2 => { T(s2).did.unasked = true; LF.emit(s2, 'unexplained', 'rst.unasked', 20, 120, 'nobody has asked the ship whether the rust is aboard her'); } }) } },
  ] });

B(['gate', 'choice', 'bill'], { id: 'rst.out', view: 'people', tone: 'pressure', title: 'Outside the Wire',
  when: (s, t) => !!t.quar,
  setup: s => { const t = T(s); return Object.assign(crew(s), { k1: t.k - 1, ev: pickK(s, t, 0.15) }); },
  text: (s, c) => `The salvage crew has been in the survey shelter outside the wire since the order. One of them died there this month, of a chest the clinic would have cleared with a few nights in a warm bed. The other ${num(c.k1)} came to the gate today without their tools and asked, through it, how long.\n\n${c.E} has been out to look at the shelter's stove and hinges. ${c.ev === 'cargo' ? 'Every piece of metal in the place is grey.' : 'They are no worse than the stove in the mess.'}`,
  choices: [
    { label: 'Bring them in, burn the shelter and what they stand up in, and issue them new kit', cost: { mat: 10 }, note: 'They come back to their bunks, and if hands carry it, it may come back with them.',
      out: { text: 'They come in through the gate in blankets, and the shelter burns behind them. They are given new coveralls and their old bunks. The bench on either side of them at supper stays empty for the rest of the month.',
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 10, c.ev); t.quar = 0; t.did.back = true; if (t.truth.is === 'cargo') chain(s2, 1); } }) } },
    { label: 'Leave them where they are until the grey is finished, one way or the other', dark: true, note: 'Nothing they have touched comes inside, and the shelter has three walls.', info: (s, c) => [['yield', 'Nothing they touch comes inside'], ['danger', `The ${num(c.k1)} outside`]],
      out: { text: 'The answer is given through the gate. They go back to the shelter. A second one of them is buried beside the first before the month is out, by the others, with a mess spoon for a spade.',
        fx: s => ({ pop: -1, stain: ['rst_left', 2], do: s2 => { const t = T(s2); t.toll++; t.did.left = true; } }) } },
  ] });

/* ======================= CHOICE: the order ======================= */
const RECALL = {
  yes: 'The tone goes out on the night pass. In the morning there is a fine grey drift at the foot of every bad sheet in the yard, and it does not move. Under the glass, every grain in it has folded its legs.',
  no: 'The tone goes out on the night pass. Aboard, the hull crawlers file into their racks and go still. On the ground nothing changes, and another stack in the yard is soft before the month is out.',
};
/* Three answers on screen (2026-11-21). Burning it out and the grease are always there. The third is to feed it, unless the
   ship can be reached and what has been learned points at her at least as much as at the ground (c.rec): then the recall
   takes its place. Laying the machines up (rst.gives) still starves either. */
B('choice', { id: 'rst.choice', tone: 'crisis', title: 'What Touches What',
  setup: s => { const t = T(s), c = crew(s); return Object.assign(c, { rec: shipOK(s) && (t.ev.swarm || 0) > 0 && (t.ev.swarm || 0) >= (t.ev.native || 0), wreck: (s.wreck || 0) > 0, quar: !!t.quar }); },
  text: (s, c) => `The yard has lost plate to the grey every month since the first sheet${c.mw ? `, and it is in the housing of ${c.mw}` : ''}. ${c.E} wants everything it has touched burned or buried in one day, machines included. ${c.rec ? `${c.Cm} wants the ship asked to call it off, on the chance that it is the ship's.` : `${c.Sc} wants to stop fighting it and feed it.`} ${c.Q} wants grease, paint and a wire brush in every hand.\n\n${c.lean} The crews have been told there will be an order tonight.`,
  choices: [
    { label: (s, c) => `Burn or bury everything it has touched in one day: the spares, the racks, ${c.mw ? c.mw + ', ' : ''}and ${c.quar ? 'keep' : 'put'} the salvage crew outside the wire`, dark: true, note: (s, c) => `If it travels by touch, this ends it. The colony loses ${c.mw ? 'a working machine and ' : ''}its spares, and ${num(c.k)} people sleep outside.`, info: (s, c) => [['yield', 'The chain broken'], ['danger', c.mw ? cap(c.mw) : 'The spares'], ['danger', `The ${num(c.k)}`]],
      out: { text: (s, c) => `It takes from first light until after dark. The kiln pit burns all day. ${c.mw ? `${cap(c.mw)} is cut off its footings and goes into a trench with the racks and the shelving. ` : ''}At dusk the salvage crew ${c.quar ? 'watches from the shelter' : 'is walked out through the gate with its bedding'}, and the gate is barred.`,
        fx: (s, c) => Object.assign({ mat: -20, parts: -Math.round(s.res.parts * 0.7), tension: -6, stain: ['rst_purge', 4], do: s2 => { const t = T(s2); t.did.purge = true; if (c.m) t.did.buried = c.m; t.did.store = true; if (!t.quar) t.quar = s2.day; chain(s2, -6); },
          chron: 'The colony burned and buried everything the rust had touched, and put the salvage crew outside the wire.' }, c.m ? { machine: { [c.m]: -200 } } : {}) } },
    { label: (s, c) => c.wreck ? 'Give it the stage: pull the cutters back for good, and cart a load of plate out to it every month' : 'Feed it: cart a load of plate out to the stage every month, and leave it there', show: (s, c) => !c.rec, note: (s, c) => `The yard ${c.wreck ? 'gives up its best source of metal and ' : ''}pays plate every month from now on, on the theory that a fed thing stays where it is fed.`, info: [['yield', 'The machines, if it is a thing that feeds'], ['danger', 'The yard']],
      out: { text: (s, c) => `${c.wreck ? 'The cutters come back from the stage with their gear and the track to it is roped off. ' : ''}The first cart goes out at noon with a load of good plate, and is tipped at the foot of the aft hold. By the end of the month the load is a grey heap.`,
        fx: s => ({ mat: -15, do: s2 => { const t = T(s2); t.fed = s2.day; t.did.fed = true; if (s2.wreck > 0) { s2.wreck = 0; s2.flags.wreck_out = s2.day; } },
          chron: 'The colony gave the descent stage up to the rust, and began carting plate out to it.' }) } },
    { label: 'Have the ship send the recall on her maintenance band', show: (s, c) => !!c.rec, note: 'If the grey is the ship\'s own, it stops. The ship stops mending herself for as long as the tone runs, and what is still aboard pays for that.', info: [['yield', 'An end to it, if it is the ship\'s'], ['danger', 'Everything still aboard']],
      out: { text: (s, c) => RECALL[is(s, 'swarm') ? 'yes' : 'no'],
        fx: s => ({ do: s2 => { const t = T(s2); t.recall = s2.day; t.did.recall = true; for (const id of LF.aboard(s2)) LF.hurt(s2, id, -4, -4); if (t.truth.is === 'swarm') { learn(s2, t, 30, 'swarm'); learn(s2, t, 15, 'swarm'); } },
          chron: 'The colony had the ship recall her hull crawlers.' }) } },
    { label: 'Grease, paint and dry stores: every hand an hour a day with a wire brush', cost: { mat: 20 }, note: 'It is an hour a day out of every hand for as long as there is a colony, and it treats the thing as weather.', info: [['yield', 'The metal, if it is only the air'], ['danger', 'The crews\' hours']],
      out: { text: 'The order is read at muster and the brushes are issued from a cart. Every housing, rack, hinge and buckle in the colony is taken to bright metal and greased, and the stores go up onto boards with a stove under them. It is done again the next day.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.grease = s2.day; t.did.grease = true; } }) } },
  ] });

/* ======================= BILL: a month on ======================= */
B('bill', { id: 'rst.gives', tone: 'crisis', title: 'A Month On',
  setup: s => { const t = T(s), c = crew(s), w = working(t), fab = LF.down(s, 'fabricator') ? 'fabricator' : c.m;
    return Object.assign(c, { slow: LF.srand(s) < 0.78 ? w : !w, quar: !!t.quar, none: !(t.did.purge || t.fed || t.recall || t.grease), lay: fab, layw: fab ? MW[fab] : null, lander: !s.machines.lander.lost }); },
  text: (s, c) => `It is a month since the night of the order${c.none ? ', and nothing ordered that night went at the grey itself' : ''}. ${c.E} hung twenty bright coupons round the yard on the first day and took them down this morning. ${c.slow ? 'Three are pitted.' : 'Fourteen are pitted.'}${c.bv ? `\n\n[[engineer]] "That's one month of coupons, is all that is." "I wouldn't hang a hat on one month, not with what I've seen this stuff do. ${c.mw ? 'Ask me when the old girl\'s still turning at harvest.' : 'Ask me at harvest.'}"` : ` ${c.E} will not put a name to one month's coupons.`}\n\n${c.lean}`,
  choices: [
    { label: 'Hold to what was ordered, and give it the season', note: 'If the order was wrong, the grey has another season in the stores and the machines.',
      out: { text: 'Nothing is changed. The coupons are hung out again, and the crews stop asking what they showed.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.held = true; } }) } },
    { label: (s, c) => `Lay the machines up: ${c.layw ? `shut ${c.layw} down for good, ` : ''}seal what can be spared in grease and clay, and go to hand tools`, note: (s, c) => `There is nothing left running for the grey to take, because the colony has taken it first${c.lander ? ', and the lander stays on the pad until this is over' : ''}.`, info: (s, c) => [['yield', 'Nothing left for it to eat'], ['danger', c.layw ? cap(c.layw) : 'The shops']],
      out: { text: (s, c) => `${c.layw ? `${cap(c.layw)} is run down, drained and packed in grease, and the shed is bricked up with clay. ` : ''}The shops go over to adze, bow saw and wooden peg. It is slow, and people who crossed between stars to get here are whittling trenails.`,
        fx: (s, c) => Object.assign({ morale: -3, do: s2 => { const t = T(s2); t.stone = s2.day; t.did.stone = c.lay || true; if (!s2.machines.lander.lost) ground(s2); },
          chron: 'The colony laid up its machines and went to hand tools, to leave the rust nothing.' }, c.lay ? { machine: { [c.lay]: -200 } } : {}) } },
    { label: 'Put the salvage crew outside the wire, with everything they have touched', dark: true, show: (s, c) => !c.quar, note: 'If hands carry it, it stops with them. If not, they sleep outside the wire for nothing.', info: (s, c) => [['yield', 'Nothing they touch comes inside'], ['danger', `The ${num(c.k)}`]],
      out: { text: 'They are walked out through the gate at dusk with their bedding and their tool rolls, to the survey shelter. Food is left at the last post each morning.',
        fx: s => ({ tension: -4, stain: ['rst_quar', 2], do: s2 => { const t = T(s2); t.quar = s2.day; t.did.quar = true; chain(s2, -2); } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  swarm: `It was the ${LF.SHIP}'s own. Her hull is kept by crawlers a tenth of a millimetre long, which strip damaged metal and carry it to where a repair is wanted, and a seeding of them came down in the skin of the descent stage. The landing gave them a hull that was damaged everywhere. They stripped it as they were built to, found nothing to carry the metal to, and went on to the next damaged thing, which was always whatever the colony had worked hardest. One tone on the maintenance band was all it took to stop them, and a second set them to putting back what they had taken from the housings.`,
  native: 'It was alive, and it was here first. A pale thread of a thing lives all through this ground on the little metal the rock gives up, and the colony set down on top of it more refined metal than this world has ever held. It went to the richest feed in reach and stayed while that lasted. It was under every footing in the colony before the first sheet crumbled, and it was never carried anywhere by anyone.',
  cargo: 'It came down in one load. A pallet of bearing stock in the aft hold went grey in its cradle somewhere in the crossing, and nobody opens a sealed pallet in transit. It crosses wherever metal touches metal, and it rides on whatever has touched it: a glove, a wrench, a boot nail. Everything the crew of the aft hold handled in the first month was carrying it by the second. Nothing that stayed off that chain was ever at risk.',
  air: 'It was rust. The alloys were chosen from orbit for the air the survey reported, and the survey had the air wrong: there is a salt in it, and in the water, that goes through ship\'s plate many times faster than the yards allowed for. Nothing carried it and nothing spread. Every piece of metal in the colony has been going at the same rate since the hatch opened, and it was seen first where the metal was thinnest.',
};
/* What each thing the colony did amounted to, given what it was. */
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [];
  const add = (w, n, c, a) => L.push({ swarm: w, native: n, cargo: c, air: a }[k]);
  const bur = d.buried && MW[d.buried];
  if (d.recall) add('The recall ended it the night it was sent.', 'The recall stopped nothing on the ground, and cost the ship a season of her own repairs.', 'The recall stopped nothing on the ground, and cost the ship a season of her own repairs.', 'The recall stopped nothing on the ground, and cost the ship a season of her own repairs.');
  if (d.purge) add('The day of burning made a great deal of damaged metal, which is what the crawlers were looking for.', 'The day of burning destroyed nothing that mattered to a thing living in the ground under the pit.', 'The day of burning broke the chain, and nothing has gone grey since that was not on it.', 'The day of burning destroyed a store of spares and a working machine that had nothing wrong with them but the weather.');
  else if (bur) add(`${cap(bur)} was buried for carrying something that would have left it alone once it was mended.`, `${cap(bur)} was buried in the same ground the thing lives in.`, `Burying ${bur} took one link out of the chain.`, `${cap(bur)} was buried while it still ran, for rusting.`);
  if (d.fed) add('The plate carted out to the stage was stripped like the rest, and the crawlers went on to the machines when they had done with it.', 'The plate carted out to the stage is what kept it off the machines.', 'The plate carted out to the stage was one more thing for it to cross to.', 'The plate carted out to the stage rusted there, as it would have in the yard.');
  if (d.grease) add('', 'The grease did the metal no harm and the thing in the ground none either.', 'The grease slowed it a little wherever it kept two pieces of metal from touching.', 'The grease and the wire brush were the whole of the cure.');
  if (d.stone) add('Laid up and whole, the machines were of no interest to it.', 'Laid up in clay, the machines were out of its reach.', 'The machines were laid up with whatever was already on them.', 'The machines were laid up to save them from the weather, which a coat of paint would have done.');
  if (d.quar || d.left || d.gang) add('The salvage crew carried nothing. What followed them about was their own worn kit.', 'The salvage crew carried nothing that was not already under the floor of every bunkhouse.', 'The salvage crew were carrying it on everything they owned, through no fault of theirs.', 'The salvage crew carried nothing. Their latch fell off because it was a cheap latch by a door that stood open.');
  if (d.pin) L.push('The pin taken out of the hauler\'s leg was bright.');
  if (d.goat) add('The foreman hanged at the yard gate had sabotaged nothing.', 'The foreman hanged at the yard gate had sabotaged nothing.', 'The foreman hanged at the yard gate had sabotaged nothing, and had been the first to say the aft hold was wrong.', 'The foreman hanged at the yard gate had sabotaged nothing.');
  if (d.silent) add('', 'The lander\'s legs were going the whole time it flew.', t.upHit && s.machines[t.upHit].up ? `The lander took it up to the ship, and it is in ${MW[t.upHit]} aboard.` : t.upHit ? 'The lander took it up to the ship, and it was in the holds before anyone aboard knew to look.' : 'The lander was carrying it on every flight, and nobody aboard was told.', '');
  if (d.cut) add('Grounding the lander kept nothing from the ship, which was where it came from.', 'Grounding the lander kept its legs off the pad and did nothing else.', 'Grounding the lander is the reason the ship is clean.', 'Grounding the lander kept nothing from anywhere.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nothing was burned, buried or put out on account of it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'rst.truth', tone: 'quiet', title: 'What the Rust Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), mat: Math.round(t.ate.mat / 10) * 10, last: (t.lastIn || (typeof t.last === 'string' ? t.last : null)) ? MW[t.lastIn || t.last] : null, lastLost: !!t.lastLost, still: !!(t.quar || t.did.gang) }); },
  text: (s, c) => { const t = T(s), tail = c.end === 'ran' ? (c.last ? ` Before it was done it ${c.lastLost ? 'took' : 'crippled'} ${c.last}.` : '') : c.end === 'fed' ? ' The cart still goes out to the stage every month.' : c.end === 'kept' || c.end === 'weather' || c.end === 'needless' ? ' It has not stopped, and will not.' : '';
    return `${WAS[t.truth.is]}${tail}\n\n${reckon(s, t)}${c.mat >= 20 ? ` In all, it took something like ${c.mat} loads of plate out of the yard.` : ''}${c.toll ? ` ${Num(c.toll)} colonist${c.toll === 1 ? '' : 's'} died of what was done about it, or of what it took.` : ''}${c.still ? ' The salvage crew is still outside the wire.' : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who gave an order about it, or carried one out, has to live beside the page.',
      out: { text: (s, c) => `It goes into the colony record in full, in your hand, with who ordered what.${c.still ? ' The gate is opened the same day, and the salvage crew comes in.' : ''} People read it. Some of the shops stop greeting you, and one or two start.`,
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.quar = 0; }, chron: 'The colony wrote down what it had done about the rust, with the names.' }) } },
    { label: 'Enter it as sabotage, put down in good time', dark: true, note: 'The colony gets an account in which its losses were somebody\'s doing, and every hand who touched the grey stays under it.', info: [['yield', 'Morale']],
      out: { text: 'The record says that stores and machinery were interfered with in the first seasons, and that the matter was dealt with. No name is given, so every name on the salvage roster will do. It is the version the children will be taught.',
        fx: s => ({ morale: 3, stain: ['rst_record', 1], chron: 'The record says the colony\'s metal was sabotaged, and that the matter was dealt with.' }) } },
  ] });

LF.TAGS['rst.plate'] = ['cautious open', 'cautious closed', 'severe bold'];
LF.TAGS['rst.racks'] = ['cautious open', 'cautious order', 'severe closed'];
LF.TAGS['rst.bench'] = ['cautious open', 'bold closed', 'cautious order'];
LF.TAGS['rst.spares'] = ['cautious open', 'cautious closed', 'bold closed'];
LF.TAGS['rst.bolts'] = ['cautious order', 'severe bold', 'bold'];
LF.TAGS['rst.housing'] = ['bold open', 'cautious closed', 'cautious'];
LF.TAGS['rst.hands'] = ['cautious open', 'severe closed', 'mercy open'];
LF.TAGS['rst.ship'] = ['cautious open', 'cautious closed', 'bold closed', 'closed'];
LF.TAGS['rst.out'] = ['mercy open', 'severe closed'];
LF.TAGS['rst.choice'] = ['severe closed', 'bold open', 'open', 'cautious order'];
LF.TAGS['rst.gives'] = ['cautious', 'cautious closed', 'severe closed'];
LF.TAGS['rst.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['rst.plate'] === undefined ? [] : [{ k: 'stage', card: 'rst.plate', name: 'The descent stage', kind: 'wreck', dist: 'near', danger: t.end ? 0 : 1,
  state: t.end ? 'worked out' : 'located', known: 'Where the descent stage came down, and where the yard cuts its plate. A sheet from the aft hold went grey right through in a month, and the frame behind it.' }];
/* A party the player sent to the stage (orders.js order.send, T2-5): a month among the plate, and what their own kit
   looks like when they come home. What they find points at the truth most of the time (pickK); what it costs follows
   the truth itself: the cracked and dented gear goes (swarm), what lay on the ground goes (native), what touched the
   plate goes and the plate they hauled home carries it (cargo), everything pits a little (air). A card while it is
   live; once it has ended, a Meanwhile line (a.quiet on a plain return). */
const STAGE = {
  swarm: 'The sound plate on the stage is as sound as the day it came down. Every buckled sheet and cracked frame has been stripped back to a clean square edge, as if somebody had been cutting out the damage with a rule.',
  native: c => `Under the stage the ${c.top} is shot through with something pale that branches like a root, and the plate lying flat on it is the worst on the site. A pick left standing in the ground overnight came out grey a hand deep.`,
  cargo: 'The grey is round the aft hold and nowhere else, and it goes sheet to sheet where the plate was stacked touching. Two sheets of the same pour, propped apart against a rock since landfall, are bright.',
  air: 'The weather side of the stage is pitted from end to end and the lee side hardly at all. A rifle somebody oiled before they set out came home bright; the cook\'s kettle, left out every night, did not.' };
const KIT = {
  swarm: 'Of what the party carried, the grey took the cracked pick, a dented kettle and a buckle somebody had bent, and left the rest alone.',
  native: 'Of what the party carried, the grey took whatever was set down on the ground at night: tent pegs, a spade, the hobnails out of one pair of boots.',
  cargo: 'Of what the party carried, the grey took whatever handled the plate: two pairs of gloves, the pry bars, every buckle on the cutters. The plate they hauled home went on the yard stack.',
  air: 'Of what the party carried, everything metal came home a little pitted, and nothing much worse than that.' };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'stage') return null;
  const k = t.truth.is, c = { top: LF.lex(s, 'top') }, e = t.end ? k : pickK(s, t, 0.1), find = typeof STAGE[e] === 'function' ? STAGE[e](c) : STAGE[e];
  if (t.end) { return Object.assign({ title: 'The Descent Stage', text: `The party walked the stage for a month and cut what was still worth cutting. ${find}`, fx: { mat: 12 } }, { quiet: true }); }
  const eat = { swarm: 2, native: 2, cargo: 3, air: 1 }[k];
  return { title: 'Back from the Stage', tone: 'pressure', scene: 'away_stage',
    text: `${find} ${KIT[e]}`,
    fx: { mat: k === 'cargo' ? 20 : 12, chips: [['Kit eaten on the way home', false]],
      do: s2 => { const t2 = T(s2); learn(s2, t2, 12, e); lose(s2, t2, 'parts', eat); if (k === 'cargo') chain(s2, 1); } } };
};
})();

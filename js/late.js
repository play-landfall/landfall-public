/* Landfall — the Long Years (2026-11-17; DESIGN.md "The Long Years").
   A playtester reached year 40: after year 15 the threads had all closed and the game was one proton storm a year.
   From year nine (or the day the colony wins and plays on) the world stops being a place the colony is settling and
   starts trying to end it. A calamity is one large card, cued through the schedule, drawn without repeats from the
   catalogue below until every one has been met, and then again. Each is worse than the last: what it costs is a share
   of the colony (part), and the share grows with every calamity already faced (s.late.n), so no colony outlasts them
   for ever. The gap between them shrinks from most of a year to three months, and two months with nothing to decide
   pulls the next one forward: the late game is never quiet.
   Dice from the second stream (LF.srand). State: s.late = { n, next, used, dil, dd }, plain JSON. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { R, M, If, N, Nc, byPid } = h;
const sri = (s, a, b) => a + Math.floor(LF.srand(s) * (b - a + 1));
const YEAR = LF.YEAR, MONTH = LF.MONTH;
LF.LATE_START = 8 * YEAR;   // the first month of year nine (year seven until the second dread went back to year one, 2026-11-17: together they took wins to 7%)
const tier = s => (s.late && s.late.n) || 1;
/* A share of the colony: f is the share at the first calamity. It grows with each one met, but only as far as the
   fourth (LF.LATE_TOP), and a colony that has grown and prepared gives up less of itself (LF.lateRelief): a city is
   not all in one place, walls and cellars are what they were built for, and people in good heart get each other
   out. The share is of everyone, children counted, and is taken exactly (fx.dead, fx.gone: no second scaling). */
LF.LATE_TOP = 3;   // 5 until 2026-11-18: colonies stay in the hundreds now, and cannot give up half every year
LF.LATE_RELIEF = [
  s => 1 - 0.6 * clamp(Math.log10(Math.max(1, LF.heads(s) / 100)), 0, 1),   // size: up to 100 gives nothing back, 300 three parts in ten, 1,000 and more six (rescaled 2026-11-18 with the believable birth rate: a town, not a city)
  s => (s.built.shelter ? 0.85 : 1),
  s => (s.morale >= 55 ? 0.8 : s.morale < 25 ? 1.7 : s.morale < 42 ? 1.35 : 1),   // a colony that has stopped looking out for itself loses far more
];
LF.lateRelief = s => LF.LATE_RELIEF.reduce((a, fn) => a * fn(s), 1);
const part = (s, f, min) => { const h = LF.heads(s); return Math.max(min || 2, Math.min(h, Math.round(h * Math.min(0.5, f * (0.55 + 0.15 * Math.min(LF.LATE_TOP, tier(s))) * LF.lateRelief(s))))); };
const num = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || LF.num(n);
const Num = n => { const w = num(n); return w.charAt(0).toUpperCase() + w.slice(1); };
const ship = s => s.world.ship;
const ok = (s, id) => LF.down(s, id);
const and = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const yearOf = d => LF.date(d).year;
const CAL = [];
const cal = (st, fits) => { CAL.push([st.id, fits || (() => true)]); add(Object.assign({ arc: 'late', tone: 'crisis', chain: true, repeat: 1, gap: 0, late: true }, st)); };
LF.ARC_VIEW.late = 'colony';

/* ---------- the clock ----------
   The gap between calamities is about a year, ten months at the least (2026-11-18: it used to
   shrink to three, with a share that grew without limit, and no colony saw year 18). A colony growing well can
   lose a fifth of itself every year and still be larger at the end of it; one that is not growing cannot. */
const GAP_MAX = 12 * MONTH, GAP_MIN = 10 * MONTH;
/* The country does not run out (2026-11-18). By year fifteen every actor the world was dealt at landfall has been
   settled one way or another, and the generated dilemmas stop. In the long years, whenever fewer than two are still
   open, another comes: first whatever the plot put to sleep at landfall, then something new from the world's own
   generator, a year and a half apart at the least. */
function lateWorld(s) {
  const L = s.late, A = LF.ARCHETYPES[s.world.type]; if (s.day < (L.wnext || 0)) return;
  const open = s.factors.filter(f => LF.KINDS[f.kind] && !f.res && !f.dormant);
  if (open.length >= 2) return;
  L.wnext = s.day + 18 * MONTH + sri(s, 0, 60);
  const slept = s.factors.find(f => f.dormant && !f.res && LF.KINDS[f.kind]);
  if (slept) { slept.dormant = false; slept.late = true; slept.onset = s.day + sri(s, 10, 40); return; }
  const ks = Object.keys(A.kinds).filter(k => LF.KINDS[k] && k !== 'humans' && !open.some(f => f.kind === k)); if (!ks.length) return;
  let r = LF.srand(s) * ks.reduce((a, k) => a + A.kinds[k], 0), kind = ks[ks.length - 1]; for (const k of ks) { r -= A.kinds[k]; if (r <= 0) { kind = k; break; } }
  const f = LF.makeFactor(s, A, kind, sri(s, 2, 3), true, s.factors.map(x => x.name)); f.onset = s.day + sri(s, 10, 40); f.wave = 2; s.factors.push(f);
}
LF.lateTick = function (s) {
  if (s.day % MONTH || !s.world || LF.aloft(s) || (s.over && !s.over.cont)) return;
  if (!s.late) { if (s.day < LF.LATE_START && !(s.won && s.over && s.over.cont)) return;
    s.late = { n: 0, next: s.day + sri(s, 10, 50), used: [], dil: s.dilemmas, dd: s.day }; }
  const L = s.late;
  if (s.dilemmas !== L.dil) { L.dil = s.dilemmas; L.dd = s.day; }
  else if (s.day - L.dd >= 3 * MONTH && s.day - (L.at || 0) >= 6 * MONTH) L.next = Math.min(L.next, s.day);   // three months with nothing to decide, and half a year since the last
  lateWorld(s);
  if (s.day < L.next || s.sched.some(e => /^late\./.test(e.id))) return;
  let pool = CAL.filter(([id, fits]) => !L.used.includes(id) && fits(s));
  if (!pool.length) { L.used = []; pool = CAL.filter(([id, fits]) => fits(s)); }
  if (!pool.length) return;
  const id = pool[Math.floor(LF.srand(s) * pool.length)][0];
  L.used.push(id); L.n++; L.at = s.day; L.next = s.day + Math.max(GAP_MIN, GAP_MAX - 2 * MONTH * L.n) + sri(s, 0, 30);
  s.sched.push({ id, day: s.day });
};
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { if (t0) t0(s); LF.lateTick(s); }; })();

/* A year with no thaw (late.winter): the fields give a quarter of what they should until it lifts. */
(function () { const y0 = LF.seasonYield; LF.seasonYield = function (s) { const y = y0(s); return s.flags.no_thaw && s.day < s.flags.no_thaw ? y * 0.25 : y; }; })();

/* ---------- the ship comes down ----------
   how: 'lost' (broken up high: everyone and everything aboard is gone), 'wreck' (down whole, nobody alive in her),
   'flown' (set down by the sleepers: the officers aboard walk out). */
LF.shipDown = function (s, how) {
  s.flags.ship_down = s.day;
  for (const p of LF.inOrbit(s)) { p.orbit = false; p.away = false; p.stranded = 0;
    if (how === 'flown') { p.down = s.day; LF.log(s, `${p.name} came down with the ship, alive.`, 'good'); }
    else LF.killPerson(s, p, `aboard the ${ship(s)} when she came down`); }
  for (const id of LF.aboard(s)) { const m = s.machines[id];
    if (how === 'lost') LF.hurt(s, id, -999); else { m.up = false; m.cap = Math.round(m.cap * 0.6); m.hp = Math.min(m.hp, Math.round(m.cap * 0.5)); } }
  s.sleepers = 0; s.fuel = 0;
  LF.chron(s, how === 'lost' ? `The ${ship(s)} was broken up in the high air on the colony's order.` : how === 'flown' ? `The ${ship(s)} was flown down by the sleepers woken aboard her.` : `The ${ship(s)} came down.`);
};
/* Nothing happens aboard a ship that is on the ground in pieces. */
for (const st of LF.storylets) if (st.aboard || st.view === 'ship' || /^ship\./.test(st.id)) { const w0 = st.when; st.when = s => !s.flags.ship_down && (!w0 || w0(s)); }
(function () { const l0 = LF.shipLine; if (l0) LF.shipLine = s => s.flags.ship_down ? `The ${ship(s)} came down in year ${yearOf(s.flags.ship_down)}. Nothing crosses the sky at dusk now.` : l0(s); })();

/* ---------- 1. the Ariadne comes down ---------- */
cal({ id: 'late.fall', view: 'ship', title: 'The Ship Comes Down',
  setup: s => ({ sl: s.sleepers, up: LF.inOrbit(s).map(p => p.name), few: part(s, 0.03, 1), many: part(s, 0.3, 6), walk: Math.round(s.sleepers * 0.45) }),
  text: (s, c) => `The ${ship(s)} has been losing height since before the first harvest, and tonight ${h.Nw(s, 'engineer')} stopped giving the figure in years. She comes down on the next pass but one. Her track runs across the continent and over the colony, and the drive section is built to reach the ground whole.\n\n`
    + `${c.sl ? `${LF.num(c.sl)} people are still asleep in her banks.` : 'Her banks are empty.'}${c.up.length ? ` ${and(c.up)} ${c.up.length === 1 ? 'is' : 'are'} aboard, awake.` : ''} There is one firing left in her, and it can be sent from the ground.`,
  choices: [
    { label: 'Send the firing now, and break her up in the high air', note: (s, c) => c.sl || c.up.length ? 'Nothing bigger than a door reaches the ground. Everyone still aboard goes with her.' : 'Nothing bigger than a door reaches the ground, and nothing of her is ever salvaged.',
      info: (s, c) => [['yield', 'The colony untouched'], ['danger', c.sl || c.up.length ? 'Everyone aboard' : 'Everything aboard']],
      out: { text: (s, c) => `The order goes up at dusk. She breaks into four lights and then into a great many, and they are down past the horizon before anyone has finished counting. Nothing lands inside the wire.${c.sl ? ` The manifest for the banks is read out in the hall that month, all ${LF.num(c.sl)} names.` : ''}`,
        fx: (s, c) => ({ morale: c.sl || c.up.length ? -9 : -4, do: s2 => LF.shipDown(s2, 'lost') }) } },
    { label: 'Leave her whole, and get the colony out from under the track', note: 'A starship is more steel than the colony has seen since landfall. She comes down where she comes down.', test: { base: 50, mods: [R('pilot', 10), R('engineer', 5)] },
      info: [['yield', 'A hull to cut up'], ['danger', 'Whatever is under her'], ['danger', 'Everyone aboard']],
      ok: { text: (s, c) => `The colony spends the pass in open country with what it could carry. She comes down eleven kilometres short, in one long piece, and the ground shakes for a minute after. ${Num(c.few)} ${c.few === 1 ? 'is' : 'are'} dead under what fell from her on the way. The cutting crews are on the hull before it has cooled.`,
        fx: (s, c) => ({ dead: c.few, mat: 600, parts: 30, food: -150, morale: -3, do: s2 => LF.shipDown(s2, 'wreck') }) },
      bad: { text: (s, c) => `She comes in low and early, across the fields and the bunkhouse row, and the people who stayed to load the last cart are under her. ${Num(c.many)} dead. The hull is lying where the east fence was, and it will be cut up by the people who dug the graves.`,
        fx: (s, c) => ({ dead: c.many, mat: 350, parts: 15, food: -350, morale: -10, machine: { reactor: -20, reclaimer: -20, hydroponics: -20 }, do: s2 => LF.shipDown(s2, 'wreck') }) } },
    { label: 'Wake the banks, and have the sleepers fly her down by hand', dark: true, show: (s, c) => c.sl >= 10,
      note: 'They are woken by radio into a falling ship and told what to do with her. Whoever is on the controls at the end stays on them.', test: { base: 40, mods: [R('pilot', 10), R('engineer', 5)] },
      info: (s, c) => [['people', `Perhaps ${LF.num(c.walk)} of them, alive`], ['yield', 'The ship, whole'], ['danger', 'The rest of the banks'], ['fail', 'Where she lands']],
      ok: { text: (s, c) => `They are talked through it from the comms hut by people reading out of a manual. She is flown down by sleepers who had been awake for six hours, and put on her belly two kilometres from the wire. ${LF.num(c.walk)} walk out of her. The rest were in the banks that took the ground first, or at the controls.`,
        fx: (s, c) => ({ pop: c.walk, mat: 500, parts: 40, morale: 3, stain: ['flown_down', 2], do: s2 => LF.shipDown(s2, 'flown') }) },
      bad: { text: (s, c) => `They are talked through it from the comms hut, and it holds until the last minute, when whoever has the controls stops answering. She comes down across the colony. ${Num(c.many)} dead on the ground, and nobody walks out of her.`,
        fx: (s, c) => ({ dead: c.many, mat: 300, food: -300, morale: -12, stain: ['flown_down', 2], machine: { reactor: -20, reclaimer: -20 }, do: s2 => LF.shipDown(s2, 'wreck') }) } },
  ] }, s => !s.flags.ship_down && !s.flags.qs_dark && !(s.threads && s.threads.quiet));
LF.TAGS['late.fall'] = ['cautious severe', 'bold', 'bold severe'];

/* ---------- 2. the white season ---------- */
cal({ id: 'late.sun', view: 'world', title: 'The White Season',
  setup: s => ({ lot: part(s, 0.16, 3), old: part(s, 0.1, 2) }),
  text: s => `The sun has been wrong since the turn of the season: whiter, and harder, and ${h.Nw(s, 'geologist')} has stopped calling it a flare, because flares end, and keeps going back to the readings as if they were good news. The dose badges at the wire take a year's allowance every month. The crop is standing out in it and will be ready to cut inside the season.\n\n${s.built.shelter ? 'The vaults' : 'The reactor hall and the cellars under the store'} will hold everyone, standing, if nobody goes out.`,
  choices: [
    { label: 'Everyone under cover until it passes. The crop burns where it stands', note: 'Nobody takes the dose. The colony comes out into empty fields and eats what is in the store.', info: [['yield', 'Nobody burned'], ['danger', 'The harvest, and the hungry months after it']],
      out: { text: 'The colony lives a season under a roof, by lamp, on short water. When the badges say it is safe to come up, the fields are the colour of paper and break when they are walked on.', fx: s => ({ food: -520, morale: -5, do: s2 => { s2.crop = 0; s2.reap = 0; } }) } },
    { label: 'Cut it in short shifts, drawn by lot from everyone', note: 'Nobody takes more than their share of the dose. A share is still a dose.', info: (s, c) => [['yield', 'The harvest'], ['danger', `About ${LF.num(c.lot)}, by the end of the year`]],
      out: { text: (s, c) => `The lots are drawn at the hall door every evening and the shifts are forty minutes. The harvest comes in. The first of the cutters is in the clinic before the threshing is done, and by the turn of the year ${num(c.lot)} of them are in the ground.`, fx: (s, c) => ({ dead: c.lot, food: 160, morale: -4 }) } },
    { label: 'The outside shifts go to everyone past fifty', dark: true, note: 'They have the fewest years for it to take, and there are enough of them to bring it in.', info: (s, c) => [['yield', 'The harvest'], ['danger', `The old: about ${LF.num(c.old)}`]],
      out: { text: (s, c) => `The list is read out by age. Most of them go out without being asked twice. The harvest comes in. ${Num(c.old)} of the old are buried that winter, and nobody is left to teach the things only they knew.`, fx: (s, c) => ({ dead: c.old, food: 160, morale: -2, stain: ['old_out', 2] }) } },
  ] });
LF.TAGS['late.sun'] = ['cautious mercy', 'free', 'severe order'];

/* ---------- 3. the ground goes ---------- */
cal({ id: 'late.ground', view: 'colony', title: 'The Ground Goes',
  setup: s => ({ few: part(s, 0.04, 1), some: part(s, 0.14, 3), many: part(s, 0.3, 6) }),
  text: s => `A crack opened across the yard at the turn of the month. It is wider than a cart now, it runs under the bunkhouse row and the reactor hall, and at night the whole yard can hear it working. ${h.Nwc(s, 'geologist')} went down it on a rope without asking, and was talking before reaching the top: there is a cavern under the yard, and the colony is built on its roof.\n\nNobody can say how long the roof has. The far side of the crack is sound, and bare.`,
  choices: [
    { label: 'Move the colony across, all of it, starting tonight', note: 'People first, then what can be carried. What cannot be carried in time goes in with the roof.', info: [['yield', 'Nearly everyone'], ['danger', 'The stores and the machines']],
      out: { text: (s, c) => `It takes most of the month, by hand and by cart, and the roof goes on the twentieth night with the stores half emptied and the last carrying party still under the hall. ${Num(c.few)} dead. The colony wakes on bare ground with what it carried.`,
        fx: (s, c) => ({ dead: c.few, food: -380, mat: -80, morale: -4, progress: -0.6, do: s2 => { for (const id in s2.machines) if (id !== 'lander' && LF.down(s2, id)) LF.hurt(s2, id, -16, -6); } }) } },
    { label: 'Shore it. Every beam the colony owns goes down the crack', cost: { mat: 80 }, note: 'If it holds, nothing is lost. The shoring crews work under the bunkhouses.', test: { base: 40, mods: [R('engineer', 10), R('geologist', 5), If(s => !!s.built.machineshop, 5, 'The machine shop')] },
      info: [['yield', 'Everything kept'], ['fail', 'Everyone above it']],
      ok: { text: 'They work in the crack for the month, in shifts, with the yard listening. The noise stops on a night nobody can afterwards put a date to. The crack is still there, and has a bridge over it.', fx: { morale: 4 } },
      bad: { text: (s, c) => `It goes in the small hours with the night shoring crew under it and the bunkhouse row on top. ${Num(c.many)} dead, most of them asleep. The reactor hall is hanging over the edge at an angle, still running.`,
        fx: (s, c) => ({ dead: c.many, morale: -10, food: -200, machine: { reactor: -35 }, cap: { reactor: -15 } }) } },
    { label: 'Move the stores and the machines first. People sleep where they sleep until there is room across', dark: true, note: 'The colony loses nothing it cannot replace. The bunkhouse row stays on the roof until the carts are free.', info: (s, c) => [['yield', 'Stores and machines whole'], ['danger', `The bunkhouse row: about ${LF.num(c.some)}`]],
      out: { text: (s, c) => `The carts run day and night with grain and machine parts, past the doors of the people who are told to wait. The roof goes before their turn comes. ${Num(c.some)} dead in the bunkhouse row. Every sack and every machine is safe across.`,
        fx: (s, c) => ({ dead: c.some, morale: -6, stain: ['roof_slept', 2] }) } },
  ] });
LF.TAGS['late.ground'] = ['cautious mercy', 'bold', 'severe order'];

/* ---------- 4. the second ship ---------- */
const OTHER = 'Perdix';
cal({ id: 'late.fleet', view: 'world', title: 'The Second Ship',
  setup: s => ({ few: part(s, 0.05, 2), many: part(s, 0.32, 8), come: 60 + sri(s, 0, 40) }),
  text: s => `A ship is braking into orbit. She is the ${OTHER}, forty years newer than the ${ship(s)}. She left after you and crossed faster, with four thousand awake aboard and a governor. Her first message is a charter that supersedes yours. Her second is a list of what the colony will hand to the landing parties: the reactor hall, the stores, every field under crop.\n\nHer first lander is asking where to put down.`,
  choices: [
    { label: 'Give them the pad, and the keys', note: 'The colony lives, as a district of somebody else\'s. They will take what is on the list.', info: [['yield', 'Nobody dies for it'], ['danger', 'The stores'], ['danger', 'Everything the colony decided for itself']],
      out: { text: (s, c) => `The governor walks the colony in an afternoon with a clerk behind, and takes the hall. Half the store goes up the ramp of the second lander, and ${LF.num(c.come)} of their people come down it to stay, with their own rules about who eats first. You keep a desk.`,
        fx: (s, c) => ({ pop: c.come, morale: -12, rations: 'tight', flags: { fleet_rule: s.day }, chron: `The ${OTHER} arrived from Earth, and the colony was handed over to her governor.`, do: s2 => { s2.res.food = Math.round(s2.res.food * 0.5); s2.res.mat = Math.round(s2.res.mat * 0.5); s2.res.parts = Math.round(s2.res.parts * 0.6); } }) } },
    { label: 'Refuse them the ground. Every rifle to the pad', note: 'They have armour, and four thousand people. The colony has the ground and knows it.', test: { base: 40, mods: [R('security', 10), R('pilot', 5), If(s => s.pop >= 150, 10, 'A colony big enough to fight')] },
      info: [['yield', 'The colony, still its own'], ['danger', 'Everyone at the pad']],
      ok: { text: (s, c) => `Their first lander puts down into aimed fire and lifts again with the ramp still open. ${Num(c.few)} of yours are dead at the pad. The ${OTHER} holds orbit for a month, reading the charter out every evening, and then her drive lights and she goes to look at the other continent.`,
        fx: (s, c) => ({ dead: c.few, morale: 8, chron: `The ${OTHER} arrived from Earth with a governor, and was refused the ground.` }) },
      bad: { text: (s, c) => `They land anyway, on the fields, behind armour. It is over by the second morning. ${Num(c.many)} dead. The governor has the hall, and the names of everyone who was at the pad.`,
        fx: (s, c) => ({ dead: c.many, morale: -14, food: -300, rations: 'tight', flags: { fleet_rule: s.day }, chron: `The ${OTHER} arrived from Earth, and took the colony by force.` }) } },
    { label: 'Send their landers the coordinates you would never use yourself', dark: true, note: 'Four landers and a thousand people, onto ground this colony learned about by burying people in it.', info: [['yield', 'Their cargo, to salvage'], ['yield', 'No governor'], ['danger', 'A thousand people who asked where to land']],
      out: { text: s => `The first two go in a minute apart, and the third is too low to turn. By the time the ${OTHER} understands what she was given, she has no landers and no way down, and she is still up there, calling. The salvage parties go out within the month. They bring back plate, seed and tools still in their grease, and are told not to talk about the rest of what is out there.`,
        fx: s => ({ mat: 500, parts: 45, food: 260, morale: -7, stain: ['wrecked_fleet', 4], flags: { fleet_wrecked: s.day }, chron: `The ${OTHER} arrived from Earth. Her landers were sent onto bad ground, and nobody came down alive.` }) } },
  ] }, s => !LF.T(s, 'ship') && !s.flags.fleet_rule && !s.flags.fleet_wrecked);
LF.TAGS['late.fleet'] = ['open cautious', 'closed bold', 'closed severe'];

/* ---------- 5. the ones who do not wake ---------- */
cal({ id: 'late.sleep', view: 'people', title: 'The Ones Who Do Not Wake',
  setup: s => { const n = Math.max(6, Math.round(part(s, 0.24, 6) * s.pop / Math.max(1, LF.heads(s)))); return { n,   // the grown: the children do not catch it
    a: Math.round(n * 0.3), b: Math.max(1, Math.round(n * 0.1)), c: Math.round(n * 0.7) }; },
  text: (s, c) => `It began in the east bunkhouse: people who did not get up at the bell and could not be shaken awake. This morning it is ${LF.num(c.n)} of the colony. They breathe, they swallow water off a spoon, and their eyes move under the lids, all the same way at the same moment. ${h.Nwc(s, 'physician')} has no name for it and says so.\n\nIt was one bunkhouse at the start of the month. It is four now.`,
  choices: [
    { label: 'Nurse them, every one, for as long as it takes', note: 'One pair of waking hands for each three asleep, out of the fields and the workshops, in the same rooms as whatever this is.', test: { base: 50, mods: [R('physician', 10), If(s => !!s.built.school, 5, 'The clinic')] },
      info: (s, c) => [['yield', 'Most of them, perhaps'], ['danger', 'The season\'s work'], ['danger', 'The nurses']],
      ok: { text: (s, c) => `Most of them open their eyes inside the season, a few each morning. ${Num(c.a)} never do, and stop breathing one at a time. None of the ones who woke will say where they were, and they sit together at meals.`, fx: (s, c) => ({ dead: c.a, food: -260, morale: -2, progress: -0.4 }) },
      bad: { text: (s, c) => `The nurses go down with it in the second month, in the chairs beside the beds. By the time it stops there are ${LF.num(c.c)} graves, dug by people who kept their mouths covered, and nobody left asleep.`, fx: (s, c) => ({ dead: c.c, food: -260, morale: -9, progress: -0.4 }) } },
    { label: 'Wake them the hard way, on the autodoc\'s table', req: s => ok(s, 'medbay'), reqText: s => s.machines.medbay.up ? 'The autodoc is still aboard the ship' : 'The autodoc is gone', test: { base: 40, mods: [R('physician', 10)] },
      note: 'Current through the brain stem, one after another. The machine was not built for this many, or for this.', info: (s, c) => [['yield', 'Nearly all of them'], ['danger', 'The ones it does not work on'], ['danger', 'The autodoc']],
      ok: { text: (s, c) => `It works on the first one, who comes up screaming, and on nearly all the rest. ${Num(c.b)} die on the table. The ones it woke are back at work inside the month, and flinch at the bell.`, fx: (s, c) => ({ dead: c.b, morale: 2, machine: { medbay: -10 } }) },
      bad: { text: (s, c) => `It works on the first one. Partway down the line the machine starts cooking them, and ${N(s, 'physician')} does not see it for an hour. ${Num(c.c)} dead, and the autodoc has to be stripped to the frame.`, fx: (s, c) => ({ dead: c.c, morale: -8, machine: { medbay: -30 }, cap: { medbay: -15 } }) } },
    { label: 'They can be walked, and they can pull. Put them in the yoke', dark: true, note: 'A sleeper led to a capstan will turn it all day and take water at night. They will not be nursed, and they will not be counted.', info: (s, c) => [['yield', `${LF.num(c.n)} in harness`], ['danger', 'Everyone asleep'], ['later', 'What it makes of the ones leading them']],
      out: { text: (s, c) => `They are led out of the bunkhouses in files, by the hand, and they go wherever they are led. By the end of the month they are turning the pumps and the mill, eyes still moving under the lids. Their families are told not to come to the yard, and come anyway.`,
        fx: (s, c) => ({ harness: c.n, exact: true, morale: -8, stain: ['yoked_sleepers', 3] }) } },
  ] });
LF.TAGS['late.sleep'] = ['mercy', 'bold', 'severe order'];

/* ---------- 6. the ones who were children ---------- */
const young = s => s.people.find(p => p.alive && !p.role && !p.away && !p.orbit && p.known) || null;
cal({ id: 'late.born', view: 'people', title: 'The Ones Who Were Children',
  setup: s => { const p = young(s) || h.anyNamed(s, LF.SEAT_ORDER), n = part(s, 0.34, 8);
    return Object.assign(p ? { pid: p.id, name: p.name, first: p.first } : { name: 'A rigger from the east row', first: 'the rigger' }, { n, go: Math.round(n * 0.7), few: Math.min(5, part(s, 0.03, 3)), many: part(s, 0.22, 5), olds: LF.seated(s).filter(q => !q.promoted).length }); },
  text: (s, c) => `They were children when the lander came down, and none of them ever agreed to any of it. Tonight ${LF.num(c.n)} of them are sitting in the yard with the stores keys, the armoury keys and the gate. Their terms are on one sheet: the founders out of every office, the ship's rules struck off, the wire taken down.\n\nThey are most of the colony's strong backs. ${c.name}, who was one of those children, speaks for them, and is being polite about it.`,
  choices: [
    { label: 'Sign it. The colony is theirs', note: (s, c) => c.olds ? `Every officer who came on the ship leaves the chair tonight, and their deputies with them. The departments are run by whoever the yard puts up, with no officer over them again.` : 'The rules that got the colony this far are struck off in an evening.', info: (s, c) => [['yield', 'Morale'], ['danger', c.olds ? 'Every founder\'s chair, empty' : 'The ship\'s rules']],
      out: { text: (s, c) => `It is signed on the bonnet of a cart, by lamp. ${c.first} shakes your hand and means it. ${c.olds ? 'The officers hand over their keys one at a time, with the yard watching, and go to their bunks as colonists.' : 'The rule book goes on the fire page by page.'} The wire starts coming down in the morning.`,
        fx: (s, c) => ({ morale: 12, flags: { born_rule: s.day }, chron: 'The ones who had been children at landfall took the colony from its founders.', do: s2 => { for (const q of LF.seated(s2).filter(x => !x.promoted)) LF.vacate(s2, q, 'elder', `was ${LF.title(q)} until the yard asked for the keys`, true); } }) } },   // flags.born_rule closes every chair for good: the deputies came on the ship too (LF.altOpen)
    { label: 'Refuse, and open the gate for anyone who wants to go', note: 'Nobody is hurt. The colony keeps its rules and loses its strong backs.', info: (s, c) => [['yield', 'The colony as it was'], ['danger', `About ${LF.num(c.go)} of the young, gone`]],
      out: { text: (s, c) => `${c.first} folds the sheet and puts it away. They go at first light, ${LF.num(c.go)} of them, with packs and two carts they loaded in the night, and they leave the keys on the hall step. The ones who stay are the ones with small children, and the old.`, fx: (s, c) => ({ gone: c.go, mat: -40, food: -200, morale: -7 }) } },
    { label: (s, c) => `Take ${c.first} tonight, and the four behind ${c.first}`, about: true, dark: true, note: 'A sit-down has five people who thought of it, and they sleep like anyone else.', test: { base: 50, mods: [R('security', 10)] },
      info: [['yield', 'The yard cleared by morning'], ['danger', 'The five'], ['fail', 'What the yard does if it is seen']],
      ok: { text: (s, c) => `By morning the yard is empty and so are five bunks. The keys are back on their hooks. Nobody asks where the five went, in the hall or anywhere else, and the crews work the month without looking up.`, fx: (s, c) => ({ dead: c.few, morale: -7, stain: ['took_speakers', 3] }) },
      bad: { text: (s, c) => `The watch is seen at the bunkhouse door. It is fought out in the yard with tools and two rifles, and it lasts until it is light enough to see who is down. ${Num(c.many)} dead. The rest of the young are gone by noon, and they took the armoury with them.`, fx: (s, c) => ({ dead: c.many, gone: Math.round(c.go * 0.6), morale: -12, stain: ['took_speakers', 2] }) } },
  ] }, s => !s.flags.born_rule);
LF.TAGS['late.born'] = ['free open', 'order', 'severe order'];

/* ---------- 7. the reactor hall ---------- */
cal({ id: 'late.core', view: 'colony', title: 'The Reactor Hall',
  setup: s => ({ few: part(s, 0.03, 2), many: part(s, 0.3, 6) }),
  text: s => `The reactor hall was cleared an hour ago and the door barred from the outside. The core is climbing, and the rods that should stop it are jammed half home. ${h.Nwc(s, 'engineer')} gives it until the shift bell, and says the hall, the workshops and the bunkhouse row are all inside what it will take.\n\nThe rods can be driven home by hand, from inside the hall.`,
  choices: [
    { label: 'Clear the colony to the far fields, and let it go', note: s => s.built.turbines ? 'Nobody goes into the hall. The reactor and everything near it are gone by the bell.' : 'Nobody goes into the hall. The colony has no other power, and will not have this again.', info: [['yield', 'Nearly everyone'], ['danger', 'The reactor, for good'], ['danger', 'The workshops and the stores beside it']],
      out: { text: (s, c) => `It goes at the bell, as promised. ${Num(c.few)} who went back for something are dead. Where the hall stood there is a pit that steams when it rains, and it will be fenced off for longer than the colony has existed.`,
        fx: (s, c) => ({ dead: c.few, mat: -90, food: -220, morale: -6, machine: { reactor: -999, fabricator: -20 } }) } },
    { label: 'Ask who will go in and drive the rods', note: 'Whoever goes in does not need telling what the hall will do to them.', test: { base: 50, mods: [R('engineer', 10), If(s => s.morale >= 50, 5, 'A colony that still volunteers')] },
      info: [['yield', 'The reactor'], ['danger', 'The ones who go in'], ['fail', 'Everything near it']],
      ok: { text: 'Three step forward before the question is finished, and one of them has done the job in a drill. The rods go home with minutes left. All three walk out, and all three are dead of it before the turn of the year.', fx: { dead: 3, morale: 4, machine: { reactor: -10 } } },
      bad: { text: (s, c) => `Three go in. The last rod is still a hand's width out when the bell rings. ${Num(c.many)} dead in the hall, the workshops and the near end of the bunkhouse row.`, fx: (s, c) => ({ dead: c.many, mat: -90, morale: -12, machine: { reactor: -999, fabricator: -20 } }) } },
    { label: 'Send the prisoners in, a pair at a time, until the rods are home', dark: true, note: 'It takes as many pairs as it takes, and there is no question of asking.', info: [['yield', 'The reactor, certainly'], ['danger', 'The prisoners']],
      out: { text: 'The first pair gets one rod home and does not come out. The watch sends in the second, and the third. The fourth pair finishes it. The reactor is running at the bell, and eight bunks in the lock-up are empty.', fx: { dead: 8, morale: -4, stain: ['rods', 3], machine: { reactor: -8 } } } },
  ] }, s => ok(s, 'reactor'));
LF.TAGS['late.core'] = ['cautious', 'bold mercy', 'severe order'];

/* ---------- 8. everything that walks ---------- */
cal({ id: 'late.tide', view: 'world', title: 'Everything That Walks',
  setup: s => ({ few: part(s, 0.05, 2), many: part(s, 0.3, 6) }),
  text: s => `Everything alive between here and the horizon is moving the same way, and has been for a month: the small things first, then what eats them, then things nobody has a drawing of. The front is wider than a party can walk across between dawn and dark, and the colony is standing in it. The outer fence went this morning without slowing anything down.`,
  choices: [
    { label: 'Open the gates, get on the roofs, and let it through', note: 'What is in the way is eaten or trampled. That is the fields, and anyone slow.', info: [['yield', 'Most of the colony'], ['danger', 'The crop and the store'], ['danger', 'Anyone caught on the ground']],
      out: { text: (s, c) => `It takes most of the month to pass, and the colony watches it from the roofs, roped on. ${Num(c.few)} did not get up in time. When the ground is still again the fields are bare earth, and the store has a hole in the wall the height of a cart.`,
        fx: (s, c) => ({ dead: c.few, food: -420, mat: -30, morale: -5, do: s2 => { s2.crop = 0; s2.reap = 0; } }) } },
    { label: 'Hold the inner wire with every rifle', note: 'Meat for a year if it holds. If it does not, the front comes through the bunkhouses.', test: { base: 40, mods: [R('security', 10), If(s => !!s.built.shelter, 10, 'Walls to stand on')] },
      info: [['yield', 'The fields, and meat'], ['danger', 'Everyone on the wire']],
      ok: { text: (s, c) => `The wire holds for nine nights behind a bank of carcasses higher than the posts, and on the tenth the front turns and goes round. ${Num(c.few)} dead on the line. The smoke houses run until the turn of the season.`, fx: (s, c) => ({ dead: c.few, food: 300, morale: 5 }) },
      bad: { text: (s, c) => `The wire holds for three nights. On the fourth something comes through that the rifles do not stop, and everything behind it follows. ${Num(c.many)} dead, between the fence and the hall doors.`, fx: (s, c) => ({ dead: c.many, food: -300, morale: -11, do: s2 => { s2.crop = 0; s2.reap = 0; } }) } },
    { label: 'Fire the country ahead of it', dark: true, note: 'A burn that wide turns the front, and takes everything that was not running with it.', info: [['yield', 'The colony untouched'], ['danger', 'The country, for years'], ['danger', 'Whoever else lives out there']],
      out: { text: 'It is lit along a line longer than the colony has ever walked, with the wind behind it. The front breaks on it and goes round, and the burn goes on to the horizon. Nothing comes to the snares after that, and the rain runs black off the ground and into the fields.',
        fx: s => ({ yield: -0.1, morale: -3, stain: ['burned_country', 3], fops: s.factors.filter(f => (f.kind === 'natives' || f.kind === 'fauna' || f.kind === 'flora') && f.stage && !f.res).map(f => ({ id: f.id, harm: 40, accord: -40, threat: -15, kills: 20 })) }) } },
  ] }, s => s.world.type !== 'ice' && s.world.type !== 'barren');
LF.TAGS['late.tide'] = ['cautious', 'bold', 'severe closed'];

/* ---------- 9. no thaw ---------- */
cal({ id: 'late.winter', view: 'colony', title: 'No Thaw',
  setup: s => ({ a: part(s, 0.18, 3), b: part(s, 0.1, 2), store: Math.max(1, Math.round(h.foodDays(s) / MONTH)) }),
  text: (s, c) => `The Thaw did not come. Ash has been falling since the turn of the year, from something past the horizon that nobody saw go up, and the sky is the colour of slate at noon. ${h.Nwc(s, 'botanist')} has stopped walking the fields, because there is nothing in them to look at.\n\nThe store holds ${LF.monthsWord(c.store)} of eating. The next harvest anyone will promise is a year off.`,
  choices: [
    { label: 'Short ladles for everyone, the same for all, for the year', note: 'Shared evenly, it is not quite enough for anyone. The old and the smallest go first.', info: (s, c) => [['yield', 'A colony that shared it'], ['danger', `About ${LF.num(c.a)}, by the next Thaw`]],
      out: { text: (s, c) => `The ladle is measured in front of the line every evening, and it is the same ladle for the Commander's table as for the lock-up. It is not enough. ${Num(c.a)} are dead by the time the sky clears, most of them old, and some of them in arms.`, fx: (s, c) => ({ dead: c.a, rations: 'tight', morale: -6 }) } },
    { label: 'Feed the ones who work. The rest get what is left', dark: true, note: 'The colony comes out of it with its strong backs fed. There is very little left.', info: (s, c) => [['yield', 'The crews at full strength'], ['danger', `The ones who cannot work: about ${LF.num(c.b)}`]],
      out: { text: (s, c) => `Two lines at the kitchen door, and everyone can see which one they are sent to. The crews keep their weight. ${Num(c.b)} from the other line are dead by the time the sky clears, and the people who carried them out were fed that evening.`, fx: (s, c) => ({ dead: c.b, morale: -5, stain: ['fed_workers', 3] }) } },
    { label: 'Eat the seed and slaughter the breeding stock', note: 'Nobody starves this year. What goes in the ground afterwards is whatever was not worth eating.', info: [['yield', 'Nobody starves'], ['danger', 'Every harvest after this one']],
      out: { text: 'The seed vault is emptied into the kitchen by the sack, and the last of the breeding animals go the same month. Everyone eats. In the first clear month the fields are sown with sweepings.', fx: { food: 420, yield: -0.14, morale: 1 } } },
  ],
  after: s => { s.flags.no_thaw = s.day + YEAR; s.crop = 0; } });
LF.TAGS['late.winter'] = ['mercy free', 'severe order', 'bold'];

/* ---------- 10. back through the gate ---------- */
const risen = s => s.people.filter(p => !p.alive && !p.left && p.died && !p.risen && s.day - p.died > YEAR && p.name && !/came down|high air/.test(p.cause || '')).sort((a, b) => (b.seat ? 1 : 0) - (a.seat ? 1 : 0) || a.died - b.died)[0] || null;
cal({ id: 'late.risen', view: 'people', title: 'Back Through the Gate',
  setup: s => { const p = risen(s); p.risen = s.day; return { name: p.name, first: p.first, y: yearOf(p.died), go: part(s, 0.2, 4), few: part(s, 0.05, 2), many: part(s, 0.16, 4) }; },
  text: (s, c) => `${c.name} walked in through the gate at the change of the watch, in the clothes ${c.first} was buried in. ${c.name} has been dead since year ${c.y}. Whatever this is knows every name in the hall and has asked after the ones who are missing, and half the colony has been on its knees in the yard since. The other half is at the armoury door.\n\nIt has not asked for anything yet. It says it will, tomorrow.`,
  choices: [
    { label: (s, c) => `Let ${c.first} stay, and speak`, note: 'The colony has not been this glad in years. Nobody knows what it will ask for.', info: [['yield', 'Morale'], ['danger', 'Whoever follows it out']],
      out: { text: (s, c) => `It speaks in the hall every evening for a month, quietly, about the ground and what is under it, and people who have not slept properly in years sleep. At the turn of the month it walks back out through the gate. ${Num(c.go)} of the colony go with it, without packs, and none of them looks back at the wall.`, fx: (s, c) => ({ gone: c.go, morale: 9, chron: `${c.name}, dead since year ${c.y}, came back through the gate, and ${LF.num(c.go)} followed it out again.` }) } },
    { label: 'Open the grave, in front of everyone', note: 'Either the grave is full or it is empty, and the hall will hear which within the hour.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] }, info: [['yield', 'The truth of it'], ['fail', 'What the hall does with the answer']],
      ok: { text: (s, c) => `The grave is full, and what is in it is ${c.name}. The thing in the hall hears this from forty mouths at once and smiles at each of them. It is gone from the hall by morning, and the gate watch saw nothing. The kneeling stops. People go back to work a little ashamed, and angrier with you than with it.`, fx: { morale: -4 } },
      bad: { text: (s, c) => `The grave is empty, and the boards were broken from the inside. The hall hears it before you are back down the hill. By dark the ones who knelt and the ones at the armoury are fighting across the yard. ${Num(c.few)} dead, and ${LF.num(c.go)} gone through the gate after it by morning.`, fx: (s, c) => ({ dead: c.few, gone: c.go, morale: -9 }) } },
    { label: 'Shoot it in the yard, where everyone can see', dark: true, note: 'It will not get to ask. The people on their knees are between it and the rifles.', info: (s, c) => [['yield', 'It never asks'], ['danger', 'The ones in front of it'], ['danger', 'Whatever it was']],
      out: { text: (s, c) => `The ones who would not get up are shot with it. It dies the way a person does, and takes as long. ${Num(c.few)} dead in the yard, and ${c.name} buried a second time, deeper, by a party that drew lots for it. Nobody kneels after that.`, fx: (s, c) => ({ dead: c.few, morale: -9, stain: ['shot_risen', 3], chron: `${c.name}, dead since year ${c.y}, came back through the gate and was shot in the yard.` }) } },
  ] }, s => !!risen(s));
LF.TAGS['late.risen'] = ['open', 'cautious', 'closed severe'];

Object.assign(LF.DEEDS || {}, { flown_down: 'the sleepers woken to fly a falling ship', old_out: 'the old sent out to cut the harvest under the white sun', roof_slept: 'the bunkhouse row left on the roof while the stores were moved',
  wrecked_fleet: 'the landers from Earth sent onto bad ground', yoked_sleepers: 'the ones who would not wake, put in the yoke', took_speakers: 'the five taken from their bunks for speaking for the young',
  rods: 'the lock-up sent into the reactor hall in pairs', burned_country: 'the country burned to the horizon', fed_workers: 'the year the kitchen had two lines', shot_risen: 'the one who came back, shot in the yard' });
})();

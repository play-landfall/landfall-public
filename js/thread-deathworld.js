/* Landfall — thread: the Grudge. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). Everything alive outside the wire is getting worse at the colony, a season at a time: the
   vermin learn the traps, the weeds grow an edge, things that ran at landfall now come on. The field crews call it
   the grudge, because it looks as if the country is answering what is done to it.
   t.host (0..100) is how hostile the country is. It is fed once a month from the colony's own record: kills and harm
   written on the living factors (fx.fops), deeds done to the country (the burned country of late.tide among them),
   the stain, and what this thread's own cards do (hit). It eases when ground is given (give). It sets the monthly
   toll in people and stores, and what the fields and the crews lose.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     blood  it answers killing. It climbs with every kill and falls when the killing stops. Right: stand down, lock
            the rifles away, give ground. Laying the country waste brings all of it at once.
     mood   it answers what the colony feels: fear, hatred, a wall with rifles on it, cruelty inside the wire. Right:
            quiet the ones who hate it most (the gate) or learn to walk out easy. Standing down while the
            colony is still afraid gets unarmed people killed.
     heart  one old thing out in the country steers the rest and is defending itself. Right: find it and burn it (the
            march, or laying the country waste once the place has been found). Nothing else slows it for long.
     none   nothing is linked. A colony is a heap of food, and fast breeders changed to get at it. It peaks and falls
            off by itself. Right: hold on. The waste and the open gate bought nothing.
   Evidence (the watch log, the bench, the two quarters, the night at the wire, the one who walks out, the place) is
   drawn per card and points at the truth only most of the time (pickK). The world's own words come from LAND and
   LF.lex, so it reads on a lichen world as on a hothouse. Nothing here knows any other thread: it reads factors,
   flags and conditions. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If, byPid, anyNamed } = h;
const ID = 'deathworld', T = s => LF.T(s, ID), SRC = 'th.deathworld';
const KINDS = ['blood', 'mood', 'heart', 'none'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const is = (s, k) => T(s).truth.is === k;

/* What "everything alive" means here, world by world. */
const LAND = {
  barren: { small: 'the crust-mites', weed: 'the grey crust', big: 'the borers', land: 'the flats',
    all: 'There is not much alive on this world: a crust on the stones, the mites that graze it, and the borers under the dust.',
    teeth: 'The mites that grazed the crust and ran from a boot now come up the boot.',
    sting: 'The grey crust has crept onto the outer beds. It used to flake off a glove, and now it raises blisters through one.',
    scorch: 'Burn the crust off the flats, to the horizon',
    fire: 'Fuel is sprayed from the carts and lit along a line longer than the colony has ever walked. The crust burns low and blue, and it burns for a long time.' },
  ice: { small: 'the rime-lice', weed: 'the red rime', big: 'the floe-hunters', land: 'the ice',
    all: 'There is not much alive on this world: red rime on the thaw pools, the lice that graze it, and the white things that hunt along the floe edge.',
    teeth: 'The lice that grazed the rime and froze when a lamp found them now come toward the lamp.',
    sting: 'The red rime has come onto the outer beds. It used to wipe off, and now it burns bare skin like lye.',
    scorch: 'Poison every thaw pool and oil the floe edge, to the horizon',
    fire: 'Reactor salt and waste oil go out on the sledges and into every thaw pool for as far as the colony has ever walked. The pools go black, and then they go still.' },
  ruin: { small: 'the wall-runners', weed: 'the scrub', big: 'the things in the old cellars', land: 'the rubble fields',
    all: 'Scrub in the cracks, the runners that nest in the walls, whatever dens in the old cellars: none of it was any trouble at landfall.',
    teeth: 'The wall-runners that scattered from a thrown stone now hold their ground and watch the thrower.',
    sting: 'The scrub in the outer beds has put out thorns as long as a finger. They are hollow, and what is in them numbs a hand for most of a month.',
    scorch: 'Fire the scrub and smoke every cellar, to the horizon',
    fire: 'It is lit along a line longer than the colony has ever walked, with the wind behind it, and smoke pots go down every stair the survey has mapped.' },
  drowned: { small: 'the reed-skippers', weed: 'the reeds', big: 'the things in the lagoon', land: 'the shallows',
    all: 'Reeds, the skippers that live in them, the slow things in the lagoon: none of it was any trouble at landfall.',
    teeth: 'The skippers that fled a wading boot now gather on it.',
    sting: 'The reeds along the outer beds have grown an edge that opens a hand to the bone, and the cut is slow to close.',
    scorch: 'Burn the reed beds and poison the lagoon, to the horizon',
    fire: 'The reed beds are lit from the boats with the wind behind them, and drums of reactor salt are tipped into the lagoon at every channel the survey has mapped.' },
  jungle: { small: 'the leaf-runners', weed: 'the undergrowth', big: 'the things in the canopy', land: 'the forest',
    all: 'This world is as alive as any the array ever saw, and at landfall most of it ran from a raised voice.',
    teeth: 'The leaf-runners that fled a raised voice now come to one.',
    sting: 'The undergrowth along the outer beds has grown spines as long as a finger. They are hollow, and what is in them stops a hand working for most of a month.',
    scorch: 'Fire the forest, to the horizon',
    fire: 'It is lit along a line longer than the colony has ever walked, with the wind behind it. At night the whole sky on that side is the colour of the lamps.' },
  garden: { small: 'the meadow-hoppers', weed: 'the grass', big: 'the grazers', land: 'the downs',
    all: 'Grass, the hoppers in it, the herds of grazers on the downs: at landfall the children fed them by hand.',
    teeth: 'The hoppers the children used to catch in jars now bite through the cloth of a sleeve.',
    sting: 'The grass along the outer beds has grown a saw edge that opens a hand to the bone, and seed heads with barbs that work inward.',
    scorch: 'Fire the downs, to the horizon',
    fire: 'It is lit along a line longer than the colony has ever walked, with the wind behind it. The herds run ahead of it until they cannot.' },
};
const L = s => LAND[s.world.type] || LAND.garden;

/* ---------- the record, and what the country makes of it ---------- */
const LIVING = { fauna: 1, flora: 1, natives: 1 }, OUT = ['burned_country', 'genocide', 'nest', 'native_meat', 'terror', 'well', 'plaguegift', 'vivisect', 'reprisal'];
/* Violence done to what lives here, as the game already keeps it: kills and harm on the living factors, and the worst deeds done past the wire. */
const record = s => s.factors.reduce((a, f) => a + (LIVING[f.kind] ? Math.min(60, f.kills || 0) * 0.4 + (f.harm || 0) * 0.25 : 0), 0) + OUT.reduce((a, k) => a + (s.flags['lim_' + k] ? 10 : 0), 0);
/* t.kill: the killing the colony does as routine (the trap line, the wall), a month. Violent answers become habits and raise it; ground given lowers it. */
const hit = (t, n) => { t.blood += n; t.kill = clamp(t.kill + n / 8, 0, 8); }, give = (t, n) => { t.gave += n; t.kill = clamp(t.kill - n / 4, 0, 8); };
const heat = (s, t) => Math.max(LF.cv(s, 'fear'), LF.cv(s, 'resentment') * 0.7, LF.cv(s, 'siege') * 0.7) + (t.armed ? 12 : 0) - (t.calm ? 40 : 0) - (t.walkers ? 10 : 0);
function feed(s, t) {
  const k = t.truth.is, rec = record(s), st = s.flags.stain || 0, dK = Math.max(0, rec - t.rec) + t.blood, dS = Math.max(0, st - t.st), g = t.gave;
  t.rec = rec; t.st = st; t.blood = 0; t.gave = 0; t.viol += dK;
  let d;
  if (k === 'blood') d = t.kill > 0 || dK > 0 ? t.kill * 0.9 + dK : -(t.open ? 10 : 6);   // 0.7 and 0.8 until 2026-11-21: with three options a card there is less killing on offer, and blood had gone tame
  else if (k === 'mood') d = clamp((heat(s, t) - 35) / 6, -8, 6) + dK * 0.4 + dS * 0.8;
  else if (k === 'heart') d = t.heartDead ? -30 : 1.7 + dK * 0.8 - Math.min(1.5, g * 0.2);
  else d = (s.day - (t.woke || s.day) < 220 ? 2.2 : -4) + dK * 0.4;
  t.host = clamp(t.host + d, 0, 100); t.peak = Math.max(t.peak, t.host);
}
function die(s, t, n) { const b = s.pop; LF.deaths(s, n); t.toll += b - s.pop; }
const part = (s, f, min) => Math.max(2, Math.min(s.pop - 12, Math.max(min, Math.round(s.pop * f))));
const are = n => n === 1 ? 'is' : 'are';
/* Once a month: what the country takes, by how hostile it has become. */
function toll(s, t) {
  if (t.quiet && s.day < t.quiet) return;
  const hh = t.host * (t.end ? 0.3 : 1) * (t.inner ? 0.75 : 1), w = L(s);
  const loss = Math.round(hh * 0.2); s.res.food = Math.max(0, s.res.food - loss); t.ate += loss;
  if (s.pop <= 16 || LF.srand(s) >= hh / 520 * (t.sure ? 1.25 : 1)) return;
  const n = 1 + (hh >= 60 && LF.srand(s) < 0.5 ? 1 : 0) + (hh >= 85 ? LF.sri(s, 0, 1) : 0); die(s, t, n);
  LF.log(s, n > 2 ? `${cap(w.big)} came over the wire in the night with everything smaller behind them. ${Num(n)} of the night crew are dead.`
    : hh >= 60 ? LF.spick(s, [`${Num(n)} of a field crew did not come in from the outer beds. The search found ${w.small} on what was left, in daylight, and they did not scatter.`, `${cap(w.big)} took ${num(n)} off the wire last night. At landfall they would not come within sight of a lamp.`])
    : LF.spick(s, [`One of the night crew was bitten through a boot at the wire, and was dead of it by morning.${n > 1 ? ' The one who carried the body in went the same way.' : ''}`, `A field hand went down in ${w.weed} at the edge of the outer beds and did not get up.${n > 1 ? ' Neither did the one who went in after.' : ''}`]), 'bad');
}

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  log: {
    blood: 'Laid beside the trap book, the bad nights in the watch log follow the bag. A heavy month of killing is answered by a heavy month at the wire, one month on.',
    mood: 'Laid beside the trap book, the bad nights in the watch log do not follow the bag at all. They follow the colony\'s own bad days: the night after a funeral, the night after a fight in the mess.',
    heart: 'In the watch log every bad night is bad along the whole wire at once, in the same hour, whichever crew has the wall and whatever was killed that month.',
    none: 'In the watch log the bad nights follow the weather and the galley: warm nights, and nights after the waste is tipped.' },
  bench: {
    blood: (s, c) => `The change is in the kinds the colony kills. A burrower nobody ever troubled to trap is the same animal it was at landfall, down to the tooth.`,
    mood: (s, c) => `The change does not follow the trap line. It is strongest in what was taken at the wall and the watch posts, and weakest at the far beds, where two old hands work alone and sing.`,
    heart: (s, c) => `The same barb has turned up this season on ${L(s).weed} and on ${L(s).small}, built alike down to the hook. Two kinds with nothing in common did not each arrive at that alone.`,
    none: (s, c) => `Every change is small, and each has cost its owner something: the new jaw is slower, the new edge sets half the seed. The fast breeders changed first, and kinds the colony never touched have changed as well.` },
  plot: {
    blood: 'Along the quarter where nothing was killed the nights went quiet inside the month. Along the quarter where everything was killed they got worse.',
    mood: 'The two quarters came out the same. What differed was the crew: the quarter stood by people who buried friends last season was hit hardest, with their rifles racked and under orders.',
    heart: 'The two quarters came out the same, and to the minute: whatever hit one end of the wire hit the other end at the same moment, a kilometre away.',
    none: 'The quiet quarter was overrun inside the month by everything the traps had been holding down. The killing quarter did a little better. Both were worst on the side nearest the stores.' },
  night: {
    blood: s => `By daylight the dead on the wire are all of kinds the colony has had on the trap line. Nothing came that the colony has let alone.`,
    mood: s => `By daylight the pattern on the wire is plain. They came hardest where the screaming was, at the bunkhouse end, and went past an open store to do it.`,
    heart: s => `By daylight the tracks say that every kind arrived in the same minute and off the same bearing, ${L(s).small} and ${L(s).big} together.`,
    none: s => `By daylight the pattern on the wire is plain. They came for the stores and the midden, they were thin, and half the dead on the wire were killed by each other.` },
  walker: {
    blood: (s, c) => `They go round ${c.first} as if round a post. They do not go round the watch pair, who have both shot from the wall this season: the pair are followed home at ten paces.`,
    mood: (s, c) => `They go round ${c.first}, who hums and does not look up. The watch pair, unarmed for the purpose and badly frightened, are followed home at ten paces.`,
    heart: (s, c) => `They leave ${c.first} alone and sit to watch. Every so often all of them turn together, every kind in sight, and face the same quarter of the horizon.`,
    none: (s, c) => `${c.Name} knows where to step and when to stand still, and goes out at the hour when they are fed and slow. An old hand's craft, and the pair could learn most of it.` },
  place: {
    blood: s => `What is there is the colony's own: the pit where the watch has been tipping carcasses since the first season. Everything in the country passes it and stops, and goes on toward the wire.`,
    mood: s => `There is no place. The bearings swing from night to night, and when they are run backward they cross at the colony's own lamps.`,
    heart: s => `What is there is one thing: a mass under ${LF.lex(s, 'under')}, warm to the hand, wider across than the colony's whole claim. Every kind the colony fights goes down to it and comes away fed.`,
    none: s => `What is there is a warm seep where half the country comes to breed. The bearings are the season's traffic to it and from it.` },
};
const ev = (kind, k, s, c) => { const x = EV[kind][k]; return typeof x === 'function' ? x(s, c) : x; };
const WORD = { blood: 'the killing', mood: 'the colony\'s own temper', heart: 'one place out in the country', none: 'nothing but hungry animals' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing found so far says why.' : e[0][1] === e[1][1] ? 'What has been found so far points two ways at once.' : `What has been found so far points at ${WORD[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. */
const STAND = { security: 'the watch sergeant', physician: 'the duty medic', xenobio: 'the survey lead', engineer: 'the shift engineer', botanist: 'the field foreman', command: 'the duty officer' };
const nm = (s, role, pid) => { const p = P(s, role); return p && p.id !== pid ? p.name : STAND[role]; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const crew = (s, pid) => { const o = {}; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['q', 'botanist'], ['cm', 'command']]) { o[k] = nm(s, role, pid); o[cap(k)] = cap(o[k]); } return o; };
const who = (p, none, first) => p ? { pid: p.id, name: p.name, first: p.first, Name: p.name } : { pid: null, name: none, first, Name: cap(none) };
const sour = (s, c, v, txt) => { const p = c.pid && byPid(s, c.pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };

function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^dw\./.test(e.id)); LF.cue(s, 'dw.truth', 4, 10); }
/* It ends when the season does, by what the country was and what was done. */
function resolve(s, t) {
  const k = t.truth.is;
  if (k === 'heart') return t.heartDead ? finish(s, t, 'heart', 'The thing that had been steering the country against the colony was burned where it lay.') : finish(s, t, 'siege', 'The country went on coming at the colony, season after season.');
  if (k === 'none') { t.host = Math.min(t.host, 20); return finish(s, t, t.burned ? 'ash' : 'spent', t.burned ? 'The country the colony laid waste came back no worse and no better than it had been.' : 'The bad seasons at the wire eased, as bad seasons do.'); }
  if (t.host <= 40 && !t.burned) return finish(s, t, k === 'blood' ? 'truce' : 'calm', k === 'blood' ? 'The colony stopped killing what lived outside the wire, and what lived outside the wire stopped coming.' : 'The colony stopped being afraid of the country, and the country let it alone.');
  finish(s, t, 'siege', 'The country went on coming at the colony, season after season.');
}
/* The season after the drastic answer: what it bought, by what the country was. */
function bill(s, t) {
  const k = t.truth.is; LF.phase(s, ID, 'bill'); t.quiet = 0;
  if (t.burned) { if (k === 'heart' && (t.found || LF.srand(s) < 0.35)) t.heartDead = s.day;
    const back = k === 'blood' || k === 'mood' || (k === 'heart' && !t.heartDead); t.ash = { back, n: 0 };
    if (back) { t.host = k === 'blood' ? 100 : Math.max(t.host, 80); const b = s.pop; die(s, t, part(s, k === 'blood' ? 0.1 : 0.05, 3)); t.ash.n = b - s.pop; }
    else t.host = k === 'none' ? Math.min(t.host, 30) : 0;
    t.billId = 'dw.ash'; }
  else if (t.open) { const held = k === 'blood' || (k === 'mood' && (!!t.calm || heat(s, t) < 40)); t.opened = { held, n: 0 };
    if (held) t.host = Math.max(0, t.host - 40); else { const b = s.pop; die(s, t, part(s, 0.07, 3)); t.opened.n = b - s.pop; }
    t.billId = 'dw.open'; }
  else if (t.host >= 30) t.billId = 'dw.siege'; else return resolve(s, t);
  jump(s, t.billId, 20);
}

LF.thread({ id: ID, name: 'The Grudge', view: 'world', dread: true,
  clue: (s, t) => ({ txt: 'The last pages are a tally of kills, kept by the night and added up by the month, in a hand that presses harder as the totals climb. In the margin of the last page, underlined twice: it was not like this when we came.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase !== 'latent' && t.phase !== 'signs' ? 'the grudge' : null,
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'Why is everything outside the wire worse every season?',
  chap: {
    truce: t => 'Everything alive here answered killing with killing. The colony stopped, and so did the country.',
    calm: t => 'Everything alive here answered the colony\'s fear and hatred. The colony learned to go out easy, or was made to.',
    heart: t => 'One old thing out in the country had been steering the rest against the colony. The colony found it and burned it.',
    spent: t => 'The bad seasons at the wire were fast breeders after an easy meal, and nothing more. They passed.',
    ash: t => 'The colony laid the country waste to the horizon to stop something that would have stopped by itself.',
    siege: t => t.insight >= 60 ? 'The country went on getting worse at the colony, and the colony learned why too late to stop it.' : 'The country went on getting worse at the colony, and the colony never learned why.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, host: 12, peak: 12, kill: 3, rec: 0, st: 0, blood: 0, gave: 0, viol: 0, toll: 0, ate: 0 }); },
  tick: (s, t) => {
    if (s.day === 3 * LF.YEAR && t.phase !== 'latent') t.h3 = t.host;   // for the sim: where it stood at the end of year three
    if (t.end) { if (t.end === 'siege' && s.day % 10 === 0 && s.day < t.endDay + 240 && t.host >= 10) { feed(s, t); toll(s, t); } return; }   // nothing ended it, so it goes on, for as long as the record feeds it
    if (t.phase === 'latent') { if (s.day >= t.at) { t.rec = record(s); t.st = s.flags.stain || 0; LF.phase(s, ID, 'signs'); s.signs.push({ id: 'damage', d: s.day, src: SRC }); LF.cue(s, 'dw.first', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); } };
    if (t.phase === 'signs') { if (since('dw.first') >= 12 || age >= 60) { LF.phase(s, ID, 'turn', 'The field crews began to say that the country outside the wire held a grudge.'); s.signs.push({ id: 'tracks', d: s.day, src: SRC }); LF.cue(s, 'dw.fields', 0, 4); } }
    else if (t.phase === 'turn') { if (since('dw.fields') >= 10) once('bench', 'dw.bench'); if (since('dw.bench') >= 10) once('hater', 'dw.hater');
      if ((since('dw.fields') >= 40 && since('dw.bench') >= 8) || age >= 110) { if (t.host < 25) return resolve(s, t); if (t.host >= 40 || age >= 160) { LF.phase(s, ID, 'war'); jump(s, 'dw.wall', 10); } } }
    else if (t.phase === 'war') { if (since('dw.wall') >= 10) { once('walker', 'dw.walker'); once('hater', 'dw.hater'); } if (since('dw.wall') >= 20) once('place', 'dw.place');
      if ((since('dw.wall') >= 40 && since('dw.place') >= 8) || age >= 110) { if (t.host < 20) return resolve(s, t); LF.phase(s, ID, 'choice'); jump(s, 'dw.choice', 20); } }
    else if (t.phase === 'choice' && (since('dw.choice') >= 20 || age >= 90)) return bill(s, t);
    else if (t.phase === 'bill' && (since(t.billId) >= 25 || age >= 70)) return resolve(s, t);
    if (s.day % 10 === 0) { feed(s, t); if (t.phase !== 'signs') toll(s, t); }
    if (s.day % 5 === 0) { const late = ['war', 'choice', 'bill'].includes(t.phase);
      if (!late) LF.emit(s, 'unexplained', SRC, 35, 8, 'everything outside the wire is worse than it was last season');
      if (t.phase !== 'signs') LF.emit(s, 'fear', SRC, 15 + t.host * 0.3 - (t.calm ? 15 : 0), 8, 'the country outside the wire is turning on the colony');
      if (t.host >= 60 && !t.open) LF.emit(s, 'siege', SRC, 30 + (t.host - 60) * 0.5, 8, 'nothing that goes out past the wire is safe');
      if (t.inner) LF.emit(s, 'confinement', SRC, 30, 8, 'the colony has drawn in behind an inner wire'); }
  },
  /* Crews that will not go to the outer beds, beds that are eaten or overgrown, and the hands every measure takes. */
  press: (s, t, P) => { if (t.phase === 'latent' || t.phase === 'signs' || (t.end && t.end !== 'siege') || (t.quiet && s.day < t.quiet)) return;
    const x = t.host / 100 * (t.end ? 0.6 : 1); P.labor -= x * 0.03 + (t.armed ? 0.02 : 0); if (!t.inner) P.yield -= x * 0.04; if (t.host >= 70 && !t.end) P.morale -= 0.01; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'world', chain: true }, st));

/* ======================= SIGNS ======================= */
B('signs', { id: 'dw.first', tone: 'pressure', title: 'Teeth',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)), thin: (s.world.truth && s.world.truth.bio < 35) }),
  text: (s, c) => `${c.W} has the trap book. Last season the line filled a barrow every morning. It has caught nothing for four nights, and every trap on it was sprung with a stone.\n\n${L(s).all} ${L(s).teeth} ${c.Sc} has one from the wire on the bench beside one pickled at landfall.\n\n[[xenobio]] "It's the same animal, the same animal, look at the jaw, there's one season between those two, and that ought to take, no, never mind what it ought to take, just look at the jaw!"`,
  choices: [
    { label: 'Set the trap book beside the watch log, night by night', note: 'The survey team is off its own work for the month, and the galley runs short while two crews sit over the books.', test: { base: 50, mods: [R('xenobio', 10), R('security', 5), If(s => !!(s.cargo && s.cargo.lab), 10, 'The field laboratory')] },
      ok: { text: (s, c) => `${ev('log', c.ev, s, c)} It is one season of two books kept by tired people.`, fx: (s, c) => ({ food: -30, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The trap book was kept by whoever had the barrow, in four hands and two ways of counting. A month of reading it against the watch log proves that the colony cannot say what it has killed.', fx: s => ({ food: -30, morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Take the trap line in and leave the midden to them', note: 'Whatever was being kept off the stores is no longer kept off, and the crews who lost a barrow of meat a morning go without it.',
      out: { text: (s, c) => `The traps come in on a cart. ${cap(L(s).small)} are in the midden by dusk and in the seed store before the month is out. Nobody is bitten at the wire that month. The galley serves what it has.`, fx: s => ({ food: -70, morale: -1, do: s2 => give(T(s2), 6) }) } },
    { label: 'Lay poisoned bait along the whole wire', dark: true, note: 'It kills what takes the bait, what eats the dead, and whatever drinks below the wire, and the colony drinks below the wire.', info: [['yield', 'The stores'], ['later', 'Whoever drinks downstream']],
      out: { text: (s, c) => `${c.D} mixes it from the clinic's stock and will not sign for it. In the morning there are dead things along the wire in drifts, of more kinds than the survey had drawn. The stores are untouched all month. Two children are in the clinic with their hands blistered, and the lower well is closed.`,
        fx: s => ({ food: 60, stain: ['dw_poison', 1], do: s2 => { const t = T(s2); hit(t, 8); t.did.poison = true; LF.emit(s2, 'sickness', 'dw.poison', 25, 80, 'bait was laid along the wire, and the lower well is closed'); } }) } },
  ] });

/* ======================= TURN ======================= */
B('turn', { id: 'dw.fields', tone: 'pressure', view: 'colony', title: 'The Outer Beds',
  setup: s => crew(s),
  text: (s, c) => `${L(s).sting} Four of the field crew are in the clinic and the rest will not go past the second marker. The crews have a name for it now. They call it the grudge.\n\n[[botanist]] "I've farmed bad ground before, salt ground, and I know what bad ground does." "Bad ground doesn't change its mind about you inside a season, and this has, so it isn't the ground."\n\nThe outer beds are a third of the harvest.`,
  choices: [
    { label: 'Clear the beds by hand, in every glove and mask the stores have', note: 'The crop is saved by people working a hand\'s width from what put four of them in the clinic.', info: [['yield', 'The harvest'], ['danger', 'The field crew']],
      out: { text: (s, c) => `It is cleared a bed at a time, on hands and knees, with the watch standing over the crews. The crop is saved. One of the field crew is dead of it, and ${c.d} has a ward of people who cannot close their hands.`, fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); hit(t, 4); t.toll += 1; } }) } },
    { label: 'Give up the outer beds and plant closer in', note: 'A third of the harvest is given away, and everybody eats the difference.',
      out: { text: (s, c) => `The markers are pulled and the outer beds are left. By the end of the month they cannot be told from ${L(s).land} beyond them. The inner beds are planted closer, and the galley cuts the evening plate.`, fx: s => ({ yield: -0.06, food: -40, do: s2 => { const t = T(s2); give(t, 8); t.did.gave = true; } }) } },
    { label: 'Spray the beds and the ground beyond them from the ship\'s defoliant', dark: true, cost: { mat: 10 }, note: 'The beds are clean for a season, and what the spray does to the people who work them and eat from them is in a manual written for another planet.', info: [['yield', 'The harvest, and more'], ['danger', 'Whoever eats from the beds']],
      out: { text: (s, c) => `Three drums go on from the carts with the wind behind them. Within the month the outer beds are bare of everything except the crop, and so is the ground for two hundred metres past them. The crop comes up heavy. ${c.D} has started keeping a list of who has a rash.`,
        fx: s => ({ yield: 0.04, stain: ['dw_spray', 2], do: s2 => { const t = T(s2); hit(t, 12); t.did.spray = true; LF.emit(s2, 'sickness', 'dw.spray', 25, 120, 'the outer beds were sprayed from the ship\'s drums'); } }) } },
  ] });

B(['turn', 'war'], { id: 'dw.bench', tone: 'pressure', view: 'colony', title: 'Side by Side',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.1), lean: lean(t) }); },
  text: (s, c) => `${c.Sc} has two rows of jars on the long bench: what the colony took at landfall, and the same kinds taken this month. No jar in the second row matches its partner in the first.\n\n[[xenobio]] "It's too fast, much too fast, and every change runs the same way, toward us, and nothing evolves like that, that isn't evolving, that's answering, so what's it answering, what does it think we did?"\n\n${c.lean} Every theory in the mess wants something different done, and the crews are waiting to hear which.`,
  choices: [
    { label: 'Give it the bench and a month', note: 'A month of the survey team on jars, while the wire is held by guesswork.', test: { base: 50, mods: [R('xenobio', 10), R('physician', 5), If(s => !!(s.cargo && s.cargo.lab), 10, 'The field laboratory')] },
      ok: { text: (s, c) => `${ev('bench', c.ev, s, c)} That is the reading of one bench, from jars filled by whoever had a hand free.`, fx: (s, c) => ({ food: -40, do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: 'A month at the bench ends in two readings of the same jars, and two people on the survey team who now eat at different tables.', fx: s => ({ food: -40, morale: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Split the wire in two for a month: kill nothing along one half, everything along the other', note: 'The crews on the quiet half stand their posts with the rifles racked, whatever comes.', info: [['yield', 'What it shows'], ['danger', 'The crews on the quiet half']],
      out: { text: (s, c) => `The wire is chalked at the gate and the two halves are stood for the month under two sets of orders. ${EV.plot[c.ev2]} One of the quiet half's crew was taken off the wire with the rifle still in the rack.`,
        fx: (s, c) => ({ pop: -1, do: s2 => { const t = T(s2); learn(s2, t, 26, c.ev2); hit(t, 5); t.toll++; t.did.plot = true; } }) } },
    { label: 'Announce that it is a hard season, and that hard seasons pass', dark: true, note: 'The crews go back to the outer beds on an answer you do not have, and go less carefully.', info: [['yield', 'Morale, and work'], ['danger', 'Whoever believes it']],
      out: { text: 'It is read out at the evening meal as the survey team\'s finding. The mess breathes out. The second marker is passed again the next morning, by crews who have stopped looking at the ground.',
        fx: s => ({ morale: 4, stain: ['false_certainty', 1], do: s2 => { const t = T(s2); t.sure = s2.day; t.did.sure = true; LF.ease(s2, 'fear', 'dw.sure', 15, 120); } }) } },
  ] });

/* The ones who hate it most. Under one truth they are what it is answering. */
B(['turn', 'war', 'choice'], { id: 'dw.hater', tone: 'pressure', view: 'people', title: 'The Bag',
  setup: s => { const p = anyNamed(s, LF.SEAT_ORDER), c = who(p, 'the night hauler\'s lead', 'the lead'); T(s).hater = { pid: c.pid, name: c.name, Name: c.Name }; return Object.assign(c, crew(s, c.pid), { n: clamp(Math.round(s.pop * 0.07), 4, 9) }); },
  text: (s, c) => `${c.Name}${c.pid ? ', who hauls on the night crew,' : ''} buried a bunkmate last month and has not put the rifle down since. Every dusk ${c.first} and a dozen others go out past the wire and kill whatever moves until the light goes. They bring the bag back on poles, and the mess stands up and cheers it in.\n\n[[security]] "Oh, they're happy, happiest they've been since we came down, and they cheer every bag in like it was a wage." "And I've counted, and every one they carry in brings two more looking for it, and the country's counting too, I promise you, and it likes the number."`,
  choices: [
    { label: 'Put it on the board: an extra ration for every head brought in', dark: true, note: 'The galley gets meat and the mess gets something to cheer, and killing becomes what a colonist is paid for.', info: [['yield', 'Meat, and morale'], ['danger', 'Whatever is out there']],
      out: { text: (s, c) => `A board goes up by the galley hatch with a column for each party. The smoke house runs every night. Children too young for a rifle set snares along the wire and bring in ${L(s).small} on strings for the half ration.`,
        fx: s => ({ food: 120, morale: 3, stain: ['dw_bounty', 2], do: s2 => { const t = T(s2); hit(t, 14); t.armed = s2.day; t.did.bounty = true; } }) } },
    { label: 'Forbid it, and lock the rifles up at dusk', note: (s, c) => `The people who lost someone are told they may not answer it, and ${c.first} is told so in front of the mess.`,
      out: { text: (s, c) => `The rifles are counted into the armoury at dusk and the key goes on your belt. ${c.Name} hears it standing, says nothing, and goes on sitting up at the wire all night with a spade.`,
        fx: (s, c) => ({ morale: -3, do: s2 => { const t = T(s2); give(t, 4); t.did.forbid = true; sour(s2, c, 15, 'you forbade to answer for a dead bunkmate'); LF.emit(s2, 'resentment', 'dw.forbid', 30, 120, 'the crews were forbidden to kill what is killing them'); } }) } },
    { label: (s, c) => `Put ${c.first} and the ${num(c.n)} worst of them out through the gate, with their rifles`, dark: true, note: (s, c) => `If the hatred is what it comes for, the hatred goes out to it. ${Num(c.n + 1)} colonists who have done nothing but kill vermin are put outside the wire for good.`, info: (s, c) => [['yield', 'Quiet in the mess'], ['danger', `${cap(c.first)} and the ${num(c.n)}`]],
      out: { text: (s, c) => `They are walked to the gate at dusk with a rifle and a blanket each. ${c.Name} does not look back. For some nights there is shooting out in ${L(s).land}, further off each time. The mess is quiet, and nobody cheers anything.`,
        fx: (s, c) => Object.assign({ leave: c.n, tension: -8, stain: ['dw_exile', 3] }, c.pid ? { depart: [{ who: c.pid, cause: 'put out through the gate with a rifle, for hating the country too well' }] } : { pop: -1 },
          { do: s2 => { const t = T(s2), k = t.truth.is; t.did.exile = c.n + 1; t.toll += c.n + 1; t.calm = s2.day; if (k === 'mood') t.host = Math.max(0, t.host - 20); else hit(t, 8); LF.ease(s2, 'fear', 'dw.exile', 10, 100); }, chron: `${Num(c.n + 1)} colonists were put out through the gate for hating the country too well.` }) } },
  ] });

/* ======================= WAR ======================= */
B('war', { id: 'dw.wall', tone: 'crisis', title: 'Everything at Once',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)), few: part(s, 0.03, 2), many: part(s, 0.06, 4) }),
  text: (s, c) => `It comes after lamp-down, along the whole wire. ${cap(L(s).small)} are through the mesh in their thousands, ${L(s).big} are on the posts, and kinds that eat each other are coming over side by side. The outer fence is already down.\n\n${c.W} is at the inner gate.\n\n[[security]] "That's the lot, then, everything with a mouth, and they've stopped quarrelling with each other to do it, which is the nicest thing they've ever done for us. I don't suppose you've got an order?"`,
  choices: [
    { label: 'Hold the inner wire with every rifle', note: 'If the line holds there is meat for a season. If it breaks, it breaks at the bunkhouse doors.', test: { base: 50, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker'), If(s => !!s.built.shelter, 5, 'Walls to stand on')] },
      ok: { text: (s, c) => `The line holds until first light behind a bank of dead things as high as the posts. ${Num(c.few)} of the watch are dead on it. ${ev('night', c.ev, s, c)}`, fx: (s, c) => ({ pop: -c.few, food: 150, morale: 2, do: s2 => { const t = T(s2); hit(t, 14); t.toll += c.few; learn(s2, t, 18, c.ev); t.did.held = true; } }) },
      bad: { text: (s, c) => `The line holds until the rifles run dry, a little after midnight. What comes through then goes into the bunkhouse row. ${Num(c.many)} are dead by first light, most of them in their blankets.`, fx: (s, c) => ({ pop: -c.many, food: -100, morale: -6, do: s2 => { const t = T(s2); hit(t, 10); t.toll += c.many; learn(s2, t, 6); t.did.broke = true; } }) } },
    { label: 'Give them the yard: everyone into the hall, and bar it', note: 'Nobody stands on the wire, and whatever is in the stores and the yard by morning belongs to what came for it.', info: [['yield', 'The people'], ['danger', 'The stores, and anyone slow']],
      out: { text: (s, c) => `The bell is rung and the hall is barred with everyone in it who could reach it. The yard is theirs until first light, and from the hall it sounds like a storm. In the morning the stores have a hole in them a cart could pass. ${ev('night', c.ev, s, c)}`,
        fx: (s, c) => ({ pop: -1, food: -250, mat: -20, morale: -3, do: s2 => { const t = T(s2); give(t, 10); t.toll++; learn(s2, t, 18, c.ev); t.did.yard = true; LF.emit(s2, 'confinement', 'dw.yard', 25, 60, 'the colony sat out a night barred in the hall'); } }) } },
    { label: 'Put a weapon in every hand over ten years old', dark: true, note: 'The wire has twice the hands and holds, and children stand on it and do what the wire asks.', info: [['yield', 'The wire holds'], ['danger', 'The children on it']],
      out: { text: (s, c) => `Spades, flare pistols and kitchen steel go out from the galley hatch to anyone tall enough to carry them. The wire holds. ${c.D} is busy until noon. In the morning there are children sitting along the foot of the wall who have stopped answering to their names, and one small body under a blanket.`,
        fx: s => ({ pop: -1, morale: -3, food: 80, stain: ['dw_children', 2], do: s2 => { const t = T(s2); hit(t, 12); t.toll++; t.armed = s2.day; t.did.children = true; LF.emit(s2, 'fear', 'dw.children', 35, 150, 'the children stood on the wire with kitchen steel'); } }) } },
  ] });

/* Somebody it does not touch. */
B(['war', 'choice'], { id: 'dw.walker', tone: 'pressure', view: 'people', title: 'The One It Leaves Alone',
  setup: s => { const t = T(s), not = t.hater && t.hater.pid, p = anyNamed(s, LF.SEAT_ORDER.concat(not ? [not] : [])), c = who(p, 'one of the seed crew', 'the seed hand'); t.walker = { pid: c.pid, name: c.name, Name: c.Name };
    return Object.assign(c, crew(s, c.pid), { ev: pickK(s, t), lean: lean(t) }); },
  text: (s, c) => `${c.Name} has gone out past the wire at first light all season, alone, with a seed bag and no rifle, to the far beds nobody else will work. Nothing has touched ${c.first}.\n\n[[security]] "Walked through a mob of them like they were washing on a line and never looked round once." "So that's either the luckiest fool we've got or somebody who knows something, and I'd like to hear which before I bury anyone else."\n\n${c.lean}`,
  choices: [
    { label: (s, c) => `Have a watch pair follow ${c.first} out and write down everything`, about: true, note: 'Two of the watch go out unarmed behind someone the country may be sparing for reasons that do not cover them.', test: { base: 50, mods: [R('security', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The pair follow at fifty paces for the month, with a slate. ${ev('walker', c.ev, s, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `The pair follow at fifty paces. On the fourth morning something comes between them and ${c.first}, and only one of the pair reaches the gate. The slate is still out there.`, fx: s => ({ pop: -1, morale: -1, do: s2 => { const t = T(s2); t.toll++; learn(s2, t, 6); } }) } },
    { label: (s, c) => `Lock ${c.first} up, as gone over to it`, dark: true, note: (s, c) => `The mess has been asking why the country spares one of its own, and ${c.first} is given to it as the answer.`, info: (s, c) => [['yield', 'Morale'], ['danger', cap(c.first)]],
      out: { text: (s, c) => `${c.Name} goes into the tool store without arguing and asks only that somebody water the far beds. Nobody does. The mess is easier for having a door with the reason behind it, and the far beds are lost before the month is out.`,
        fx: (s, c) => ({ morale: 2, tension: -6, yield: -0.02, stain: ['dw_walker', 2], do: s2 => { const t = T(s2); t.did.locked = true; sour(s2, c, 30, 'you locked up for being the one the country did not bite'); LF.ease(s2, 'suspicion', 'dw.locked', 10, 80); } }) } },
    { label: (s, c) => `Let ${c.first} take out anyone who asks to learn it`, note: 'Whoever goes out to learn goes without a rifle, and the families of the dead watch them make friends with what did the killing.',
      out: { text: (s, c) => { const k = T(s).truth.is; return `Eleven ask. They go out at first light behind ${c.name} in a line, empty-handed. ${k === 'blood' || k === 'mood' ? 'All eleven are still going out at the end of the month, and two more have asked.' : 'Nine are still going out at the end of the month. The other two are on the board by the gate.'} In the mess they sit by themselves, and are called the tame ones by people who mean it badly.`; },
        fx: s => { const n = is(s, 'blood') || is(s, 'mood') ? 0 : 2; return { pop: -n, morale: -1, do: s2 => { const t = T(s2); t.walkers = s2.day; t.toll += n; t.did.walkers = true; give(t, 6); LF.emit(s2, 'schism', 'dw.walkers', 30, 150, 'some of the colony go out unarmed among what killed the others'); } }; } } },
  ] });

/* Where it all comes from, if it comes from anywhere. */
B(['war', 'choice'], { id: 'dw.place', tone: 'crisis', title: 'Where It Comes From',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.3), few: part(s, 0.03, 2), lean: lean(t) }); },
  text: (s, c) => `${c.Sc} has taken a bearing on every attack since the big night and run the lines back across the survey map. Most of them cross inside one circle, out in ${L(s).land}, a hard day from the wire.\n\n[[xenobio]] "There, right there, either that's where it's coming from or it's where everything goes anyway, and I can't tell which from a map, so somebody has to go and look, and I'll go, I've been packed since the lines crossed!"\n\n${c.W} wants to go too, with fuel. ${c.lean}`,
  choices: [
    { label: 'March on it in strength and burn whatever is there', dark: true, note: 'If the country has a centre this ends it. If it has none, thirty people have gone a day past the wire to burn something nobody has looked at.', test: { base: 50, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker')] }, info: [['yield', 'An end to it, perhaps'], ['danger', 'The column']],
      ok: { text: (s, c) => { const k = T(s).truth.is, go = `Thirty go out with the fuel cart and are home on the third day, ${num(c.few)} short.`;
          return k === 'heart' ? `${go} There was one thing there, under ${LF.lex(s, 'under')}, warm, and wider than the camp. It took a day to burn and it moved while it burned. On the walk home nothing came near the column. Nothing has come near the wire since.`
            : k === 'blood' ? `${go} What they burned was the colony's own carcass pit and everything that had gathered at it, which was a great deal. The wire was hit that same night, harder than on the big night.`
            : k === 'mood' ? `${go} They found nothing that looked like a centre, and burned a square kilometre to be sure of it. They came home hating the place worse than they went out, and the wire was hit that same night.`
            : `${go} What they burned was a warm seep, and everything that had come to it to breed. The wire was hit that same night, no harder and no less hard than before.`; },
        fx: (s, c) => ({ pop: -c.few, stain: ['dw_heart', 2], morale: is(s, 'heart') ? 4 : -3, do: s2 => { const t = T(s2), k = t.truth.is; t.toll += c.few; t.did.march = true; learn(s2, t, 25, k);
          if (k === 'heart') { t.heartDead = s2.day; t.host = 0; finish(s2, t, 'heart', 'A column marched a day past the wire and burned the thing that had been steering the country against the colony.'); } else hit(t, k === 'none' ? 6 : 22); } }) },
      bad: { text: (s, c) => `Thirty go out with the fuel cart. They are met half way, in daylight, by more than the survey has ever counted in one place. The cart is lost with the fuel still in it. ${Num(c.few + 2)} do not come home, and nobody got near enough to say what is in the circle.`,
        fx: (s, c) => ({ pop: -(c.few + 2), mat: -15, morale: -4, stain: ['dw_heart', 1], do: s2 => { const t = T(s2); t.toll += c.few + 2; t.did.marchFailed = true; hit(t, 10); learn(s2, t, 5); } }) } },
    { label: 'Send the survey team to lie up in sight of it and watch', note: 'The colony\'s only people who can read the country spend the month a day from help.', test: { base: 50, mods: [R('xenobio', 10)] },
      ok: { text: (s, c) => `They lie up on high ground with a glass for most of the month and come home thin, all of them. ${ev('place', c.ev2, s, c)}`, fx: (s, c) => ({ food: -30, do: s2 => { const t = T(s2); learn(s2, t, 30, c.ev2); if (c.ev2 === 'heart') { t.circle = s2.day; if (t.truth.is === 'heart') t.found = s2.day; } } }) },
      bad: { text: 'They lie up on high ground with a glass and are found there on the sixth night. Two come home. What they saw of the place is a long way off, in poor light, and they do not agree about it.', fx: s => ({ pop: -2, morale: -2, do: s2 => { const t = T(s2); t.toll += 2; learn(s2, t, 8); } }) } },
    { label: 'Cart a month of stores out to it and leave them', cost: { food: 120 }, note: 'The galley goes short to feed something that has killed colonists, on the chance that it can be bought.',
      out: { text: (s, c) => { const k = T(s).truth.is; return `Twelve crates are left inside the circle and the carts come home empty. ${k === 'heart' ? 'The crates are gone in the morning, every board of them. The wire is quieter that month than it has been since the season turned, and then it is as it was.' : k === 'blood' ? 'The crates are found broken open and fouled. Nobody was touched on the road, going or coming, and the party carried no rifles.' : 'The crates are found broken open and fouled, and the wire is hit that night as on any other.'}`; },
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2), k = t.truth.is; t.did.fed = true; give(t, 8); if (k === 'heart') t.host = Math.max(0, t.host - 12); } }) } },
  ] });

/* ======================= CHOICE: the drastic answers ======================= */
B('choice', { id: 'dw.choice', tone: 'crisis', title: 'Ways to End It',
  setup: s => { const t = T(s); return Object.assign(crew(s), { lean: lean(t), few: part(s, 0.04, 2), dead: t.toll, circle: !!t.circle }); },
  text: (s, c) => `The board by the gate has ${num(Math.max(2, c.dead))} names on it. Your officers have stopped explaining the country and started offering ways to finish with it. ${c.W} wants everything dead as far as the eye can see. ${c.Q} wants the rifles locked away and the gate left open.\n\n${c.lean} The hall has been told there will be an answer tonight.`,
  choices: [
    { label: (s, c) => L(s).scorch, dark: true, cost: { mat: 25 }, note: (s, c) => `Nothing is left alive within a day of the wire, the colony's own snares and forage included, and whoever else lives out there burns with it.${c.circle ? ' The circle on the survey map is well inside the line.' : ''}`, info: [['yield', 'Quiet at the wire'], ['danger', 'The country, and the harvest']],
      out: { text: (s, c) => `${L(s).fire} When it is over the wall looks out on black ground to the edge of sight. Nothing comes to the wire. People sleep with the shutters open for the first time in a year.`,
        fx: s => ({ morale: 4, tension: -10, yield: -0.08, stain: ['dw_burn', 3], fops: s.factors.filter(f => LIVING[f.kind] && f.stage && !f.res).map(f => ({ id: f.id, harm: 40, accord: -40, threat: -15, kills: 20 })),
          do: s2 => { const t = T(s2); t.burned = s2.day; t.did.burn = true; t.quiet = s2.day + 90; hit(t, 30); LF.ease(s2, 'fear', 'dw.burn', 20, 60); }, chron: 'The colony laid waste the country outside its wire, as far as the horizon.' }) } },
    { label: 'Take down the outer wire, bury the rifles, and kill nothing', note: (s, c) => `If it is answering the rifles, this is the end of it. If it is answering anything else, the colony will be standing in the open with empty hands when it comes.`, info: [['yield', 'An end to it, perhaps'], ['danger', 'Everyone']],
      out: { text: (s, c) => `The outer wire is rolled and stacked. The rifles are crated and buried under the landing ground, by your order, so that nobody can change their mind in a bad hour. The first nights are the worst anyone remembers: ${num(c.few)} die with nothing in their hands. After that the colony waits to see what it has bought.`,
        fx: (s, c) => ({ pop: -c.few, morale: -4, do: s2 => { const t = T(s2); t.open = s2.day; t.did.open = true; t.toll += c.few; t.armed = 0; give(t, 15); t.kill = 0; }, chron: 'The colony took down its outer wire and locked its rifles away.' }) } },
    { label: 'Draw in behind an inner wire, and outlast it', note: 'The outer beds and half the yard are given up, and everyone lives on top of everyone else for as long as it takes.',
      out: { text: (s, c) => `A second wire goes up round the hall, the stores and the nearest beds, and everything outside it is let go. The colony fits inside it, at two to a bunk. From the wall you can see the old outer fence going under.`,
        fx: s => ({ yield: -0.08, morale: -3, do: s2 => { const t = T(s2); t.inner = s2.day; t.did.inner = true; give(t, 6); } }) } },
  ] });

/* ======================= BILL ======================= */
B('bill', { id: 'dw.ash', tone: 'crisis', title: 'Black Ground',
  when: (s, t) => t.billId === 'dw.ash',
  setup: s => { const t = T(s); return Object.assign(crew(s), { back: t.ash.back, n: t.ash.n, few: part(s, 0.05, 2) }); },
  text: (s, c) => c.back ? `The quiet lasted until the first growth came up through the black. What came up with it came all together, and it came already knowing the wire. ${Num(Math.max(1, c.n))} ${are(c.n)} dead in one night, and the wall could not say afterwards what half of it was.\n\n[[security]] "Well, we showed it the worst we can do, and it's in my book who asked for that." "And it had a good look, and here it is anyway, so whoever asked for it can come and explain that to the families."`
    : `The black ground has stayed quiet. Nothing has come to the wire, and nothing has come to the snares either. The rain runs off it the colour of ink and into the beds, and what the beds are giving would not feed the field crew that works them.\n\n[[botanist]] "It's dead out there, all of it, I've walked it." "That's what we asked for, and I wouldn't go back to it now and ask for a harvest as well."`,
  choices: [
    { label: 'Do it again, further out, and keep doing it', dark: true, show: (s, c) => c.back, cost: { mat: 20 }, note: 'Each time has bought a quiet month, and the crews that walk the line out further each time are the ones who do not all walk back.', info: [['yield', 'A quiet month'], ['danger', 'The crews on the line']],
      out: { text: (s, c) => `The line is walked out again with the carts, half a day further than the last. It buys a month. ${Num(c.few)} of the crew were caught on open ground a long way from the wall, and after that the crews draw lots for the carts.`,
        fx: (s, c) => ({ pop: -c.few, yield: -0.04, morale: 1, stain: ['dw_again', 2], do: s2 => { const t = T(s2); hit(t, 20); t.toll += c.few; t.quiet = s2.day + 30; t.did.again = true; } }) } },
    { label: 'Draw in behind an inner wire and let the rest go', show: (s, c) => c.back, note: 'The outer beds and half the yard are given up, and the colony lives two to a bunk behind what is left.',
      out: { text: 'The second wire goes up in four days, by everyone who can lift a post. What is outside it is let go. The nights are no quieter, but they are further off.', fx: s => ({ yield: -0.06, morale: -3, do: s2 => { const t = T(s2); t.inner = s2.day; t.did.inner = true; give(t, 6); } }) } },
    { label: 'Lock the rifles away now, and kill nothing more', show: (s, c) => c.back, note: 'It is asked of people who have just buried the dead of one night, and whatever is out there has no reason yet to know that anything has changed.', info: [['danger', 'Everyone on the wire']],
      out: { text: (s, c) => `The rifles are counted into the armoury and the door is welded shut. The watch stands the wall with poles. ${Num(c.few)} more die that month with nothing in their hands, and the colony buries them and still kills nothing.`,
        fx: (s, c) => ({ pop: -c.few, morale: -4, do: s2 => { const t = T(s2); t.toll += c.few; t.did.late = true; t.armed = 0; give(t, 20); t.kill = 0; if (t.truth.is === 'blood') t.host = Math.max(0, t.host - 35); } }) } },
    { label: 'Cut every plate by a third until something grows', show: (s, c) => !c.back, note: 'Everyone goes hungry together, and the oldest and the youngest feel it first.',
      out: { text: 'The plate is cut and the galley weighs it out in front of whoever wants to watch. The colony gets thin together. Two of the old hands do not see the first green come back through the black.', fx: s => ({ pop: -2, food: 60, morale: -3, do: s2 => { T(s2).toll += 2; } }) } },
    { label: 'Send foragers past the edge of the dead ground', show: (s, c) => !c.back, note: 'There is food where the killing stopped, two days out, and so is everything that got ahead of it.', test: { base: 50, mods: [R('botanist', 10), R('security', 5)] },
      ok: { text: 'They are gone most of the month and come back with the carts full, and with a description of the country at the edge of the dead ground that the survey team writes down twice.', fx: s => ({ food: 180, morale: 1 }) },
      bad: { text: (s, c) => `They reach the edge of the dead ground. Everything that got ahead of it is still there, in a band, with nowhere further to go. ${Num(c.few)} do not come home, and the carts are left.`, fx: (s, c) => ({ pop: -c.few, morale: -3, do: s2 => { T(s2).toll += c.few; } }) } },
    { label: 'Feed the colony first, and put the lock-up on what is left', dark: true, show: (s, c) => !c.back, note: 'The crews that work keep their strength, and the people who cannot refuse are the ones who starve.', info: [['yield', 'Food, and work'], ['danger', 'The lock-up']],
      out: { text: 'The lock-up\'s plate is whatever comes back from the tables. It is enough for most of them. The field crews stay on their feet until the first green shows, and three bunks in the lock-up are stripped before then.',
        fx: s => ({ pop: -3, food: 120, stain: ['dw_scraps', 2], do: s2 => { const t = T(s2); t.toll += 3; t.did.scraps = true; } }) } },
  ] });

B('bill', { id: 'dw.open', tone: 'crisis', view: 'people', title: 'Empty Hands',
  when: (s, t) => t.billId === 'dw.open',
  setup: s => { const t = T(s); return Object.assign(crew(s), { held: t.opened.held, n: t.opened.n, few: part(s, 0.04, 2) }); },
  text: (s, c) => c.held ? `Since the rifles were buried, nothing has touched anyone. ${cap(L(s).small)} come through the yard at dusk and go round people's feet. Last night one got into the bunkhouse, and a hauler with a child in the next bunk killed it with a spade before anyone was awake enough to stop it.\n\nThe mess is split down the middle this morning. Half want the hauler put out past the last post before the country takes it out of everyone. Half want the rifles back.`
    : `The open gate lasted until last night. They came through the yard with nothing to stop them, and ${num(Math.max(1, c.n))} ${are(c.n)} dead between the bunkhouse and the hall, with nothing in their hands.\n\n[[security]] "We asked it nicely, and there they are between the bunkhouse and the hall, so who was it decided my rifles were the problem? I'd like the list." "Can I have my rifles back now, or is the plan to sing to it?"\n\n${c.Q} says that it has to be given longer, and cannot look at the board while saying so.`,
  choices: [
    { label: 'Put the hauler out past the last post, to answer for it', dark: true, show: (s, c) => c.held, note: 'The peace is kept by handing over a parent who killed a thing beside a child\'s bunk.', info: [['yield', 'The peace'], ['danger', 'The hauler']],
      out: { text: 'The hauler is walked out at dusk and left at the last post with a blanket. The child is held back at the gate by two of the watch. In the morning the blanket is there, folded. Nothing comes into the bunkhouse again, and nobody raises a spade to anything.',
        fx: s => ({ pop: -1, morale: -3, stain: ['dw_answer', 2], do: s2 => { const t = T(s2); t.toll++; t.did.answer = true; give(t, 10); LF.emit(s2, 'fear', 'dw.answer', 25, 120, 'a colonist was put out to the country for killing one of its animals'); } }) } },
    { label: 'Dig the rifles up', show: (s, c) => c.held, note: 'Everyone who wanted them back gets them, and whatever the empty hands had bought is handed back with them.',
      out: { text: 'The crates are dug up, and the rifles are on the wall by evening. The watch is glad of them. Nobody can say afterwards who fired first, or at what, only that by the end of the month the wall is firing every night.',
        fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.open = 0; t.armed = s2.day; t.did.rearmed = true; hit(t, 16); } }) } },
    { label: 'Bury the thing where it fell, and say nothing to anyone', show: (s, c) => c.held, note: 'The hauler is not punished and the rifles stay away, and the colony waits to find out whether one dead animal is noticed.',
      out: { text: (s, c) => `It is buried under the bunkhouse step before the day shift is up. The half that wanted the hauler put out goes on wanting it, and says so at every meal. Whether anything out in ${L(s).land} counted its dead that night, nothing comes of it.`,
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); hit(t, 2); LF.emit(s2, 'schism', 'dw.spade', 30, 150, 'half the colony wanted a parent put out for killing an animal'); } }) } },
    { label: 'Dig the rifles up and put the wire back up', show: (s, c) => !c.held, cost: { mat: 15 }, note: 'The colony goes back to the wall it had, short by everyone who died finding out.',
      out: { text: 'The rifles are dug up and the wire goes up in three days, by everyone who can lift a post. Nobody speaks of the open gate. The wall fires on anything that moves, and is thanked for it.',
        fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.open = 0; t.armed = s2.day; t.did.rearmed = true; hit(t, 12); } }) } },
    { label: 'Hold to it another month, with empty hands', show: (s, c) => !c.held, note: 'If the country only needed longer, this gives it longer, and the price of the month is paid by whoever is caught in the open.', info: [['danger', 'Everyone']],
      out: { text: (s, c) => `The gate stays open and the rifles stay buried. ${Num(c.few)} more die that month. ${is(s, 'mood') ? 'Toward the end of it there are mornings when things cross the yard and go round the people in it, and mornings when they do not.' : 'Nothing about the last night of the month is different from the first.'}`,
        fx: (s, c) => ({ pop: -c.few, morale: -5, do: s2 => { const t = T(s2); t.toll += c.few; t.did.heldOn = true; give(t, 10); } }) } },
  ] });

B('bill', { id: 'dw.siege', tone: 'crisis', view: 'colony', title: 'The Far Beds',
  when: (s, t) => t.billId === 'dw.siege',
  setup: s => Object.assign(crew(s), { few: part(s, 0.03, 2), inner: !!T(s).inner }),
  text: (s, c) => `The colony eats from beds that somebody has to walk out to. Nobody who walks out to the far ones can count on walking back, and the field crew has put its tools down at the gate.\n\n[[botanist]] "They're right, and I'd have put my own tools down beside theirs." "I can't ask them again, and somebody's got to go out there or there's no winter in the store, but I won't be the one who chooses who."${c.inner ? '\n\nFrom the inner wire the far beds are a long way off.' : ''}`,
  choices: [
    { label: 'Everyone draws for the far beds, the top table included', note: 'It is fair, and it sends cooks and children\'s teachers out to do a field hand\'s work among things that kill field hands.', info: [['yield', 'The harvest'], ['danger', 'Whoever draws it']],
      out: { text: (s, c) => `Tiles go into a pot each evening and twenty come out. The far beds are worked. ${Num(c.few)} of those who drew a tile are on the board by the end of the month, a clerk and a midwife among them.`, fx: (s, c) => ({ pop: -c.few, food: 60, do: s2 => { T(s2).toll += c.few; } }) } },
    { label: 'Let the far beds go', note: 'Nobody dies in them, and the store goes into the cold season short by everything they would have given.',
      out: { text: 'The far beds are struck off the plan. By the end of the month they are gone under. The galley works out the cold season on what is left, and the figure is read aloud so that nobody can say they were not told.', fx: s => ({ yield: -0.06, food: -80, morale: -2, do: s2 => { give(T(s2), 6); } }) } },
    { label: 'Send the field crew out behind a line of rifles that shoots everything first', dark: true, note: 'The field crew is as safe as rifles can make it, and every morning starts with killing whatever is between the gate and the beds.', info: [['yield', 'The harvest, and meat'], ['danger', 'Whatever is out there']],
      out: { text: (s, c) => `The watch goes out ahead at first light in a line abreast and clears the ground to the far beds. The crew works behind it. The smoke house has not been so full since the first season, and ${c.w} has asked for more rifles.`,
        fx: s => ({ food: 160, morale: 1, stain: ['dw_line', 1], do: s2 => { const t = T(s2); hit(t, 16); t.armed = s2.day; t.did.line = true; } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  blood: (s, t, c) => `It answered killing. Everything alive here is tied to everything else, and what is done to one kind is paid back by all of them, a season on. ${c.Sc}'s chart of the colony's bag against the colony's dead is one line laid over another. It kept no account past the debt: where the killing stopped, so did it.`,
  mood: (s, t, c) => `It answered what the colony felt. ${c.Sc} cannot say how the country reads a frightened crew at four hundred metres, only that it does, and that it comes to fear and hatred the way ${L(s).small} come to the midden. The rifles and the wall counted for what it did to people to stand behind them. Crews that went out easy came home.`,
  heart: (s, t, c) => `There was a centre to it. One old thing under ${LF.lex(s, 'under')}, wider at the root than the colony's whole claim, fed everything that came at the wire and handed each kind the pattern for its next tooth. Something had landed on it and begun to dig, and it was defending itself.`,
  none: (s, t, c) => `There was nothing behind it. A colony is the largest heap of food and warmth this country has ever held, and things that breed fast changed fast to get at it, each kind by itself, as pests did at home. Nothing was tied to anything else. It peaked when the easy changes were used up, and fell away as the things that eat the biters caught up with them.`,
};
/* What each thing the colony did amounted to, given what the country was. doubt: the same deeds with nothing to weigh them against. */
function reckon(s, t, c, doubt) {
  const d = t.did, k = t.truth.is, out = [];
  const add = (plain, b, m, he, n) => out.push(doubt ? plain : k === 'blood' ? b : k === 'mood' ? m : k === 'heart' ? he : n);
  if (d.burn) add('The country was laid waste to the horizon.', 'Laying the country waste was the largest killing the colony ever did, and it was answered in full.', 'The country was laid waste in hatred, and the hatred was what it answered.', t.heartDead ? 'Laying the country waste reached the thing at the centre, along with everything that had no part in it.' : 'Laying the country waste missed the one thing that mattered and killed everything else.', 'The country was laid waste to the horizon to stop something that was already stopping.');
  if (d.open) add('The outer wire came down and the rifles were locked away.', 'Locking the rifles away was the answer, and the dead of the first nights were the last of the debt.', t.calm ? 'With the worst of the hatred quieted, the open gate held.' : 'The gate was opened by people who were still afraid, and fear was what it came for.', 'The gate was opened to something that was never answering the rifles.', 'The gate was opened to hungry animals, who took it as animals would.');
  if (d.exile) add(`${Num(d.exile)} were put out through the gate with their rifles.`, `The ${num(d.exile)} put out with their rifles went on killing out there for as long as they lasted, and the colony was billed for it.`, `Putting out the ${num(d.exile)} who hated it most did ease the wire, for the reason given at the gate.`, `The ${num(d.exile)} put out with their rifles were colonists the wall could have used.`, `The ${num(d.exile)} put out with their rifles were colonists the wall could have used.`);
  if (d.march) add('A column marched on a circle on the map and burned what was in it.', 'The column burned the colony\'s own carcass pit and a great many animals, and added both to the account.', 'The column burned empty country and came home hating it worse.', 'The march on the circle ended it.', 'The column burned a breeding seep, which made no difference to anything.');
  if (d.bounty || d.line) add('Killing was paid for by the head.', 'Every head on the bounty board was paid for twice, once at the hatch and once at the wire.', 'The bounty board taught the colony to enjoy it, which was worse than the killing.', 'The bounty board killed a great many things that were only doing as they were told.', 'The bounty board fed the galley and changed nothing else.');
  if (d.locked && t.walker) add(`${t.walker.Name} was locked up for not being bitten.`, `${t.walker.Name} was locked up for the one habit that would have saved everyone: killing nothing.`, `${t.walker.Name} was locked up for the one habit that would have saved everyone: not being afraid.`, `${t.walker.Name} was locked up for being lucky.`, `${t.walker.Name} was locked up for knowing how to walk past animals.`);
  if (d.children) add('Children stood on the wire with kitchen steel.', 'Children stood on the wire and killed, and that was entered against the colony with the rest.', 'Putting children on the wire frightened the whole colony, and fright was what it came for.', 'Children stood on the wire against something that could have been burned in its bed.', 'Children stood on the wire against a hungry night that the hall doors would have kept out.');
  if (d.spray || d.poison) add('Poison and fire were used along the wire from the first season.', 'The poison and the dead strip were the first entries in the account.', 'The poison and the dead strip made the wire a place to be afraid of, on both sides.', 'The poison and the dead strip killed a great deal and never touched what mattered.', 'The poison and the dead strip worked as they would have at home, for about as long.');
  if (d.answer) add('A parent was put out for killing an animal by a child\'s bunk.', 'Putting the hauler out kept the peace. Nobody knows whether one dead animal would have broken it.', 'The hauler was put out for a killing the country never would have noticed.', '', '');
  const L2 = out.filter(Boolean).slice(0, 4);
  return L2.length ? L2.join(' ') : doubt ? 'The colony did nothing drastic about it.' : 'The colony did nothing drastic about it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'dw.truth', tone: 'quiet', title: 'What the Grudge Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { doubt: t.end === 'siege' && t.insight < 60, end: t.end, toll: Math.max(0, t.toll) }); },
  text: (s, c) => { const t = T(s), k = t.truth.is, cost = c.toll ? ` The board by the gate has ${num(c.toll)} names on it from the grudge.` : '';
    if (c.doubt) return `It has not ended. The colony counts its nights by what came over the wire, and nobody can say why the country turned on it or what would turn it back.\n\n${reckon(s, t, c, true)}${cost} There is nothing to weigh any of it against.`;
    const tail = c.end === 'siege' ? (k === 'heart' ? ' It is still there, and it has not stopped.' : k === 'mood' ? ' It has not stopped, because the colony is still afraid of it.' : ' It has not stopped, because the colony has not.') : c.end === 'truce' ? ' Nothing has come over the wire since.' : c.end === 'calm' ? ' The wire has been quiet since the colony\'s temper eased.' : '';
    return `${WAS[k](s, t, c)}${tail}\n\n${reckon(s, t, c, false)}${cost}`; },
  choices: [
    { label: 'Enter it in the record as it happened, with the names', note: 'Everyone who gave an order or carried one out has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who gave each order and who carried it out. People read it. Some of them stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the grudge, with the names.' }) } },
    { label: 'Enter it as a war the colony was forced into, and won', dark: true, note: 'The children are taught that the country attacked and was beaten, and they will meet it believing that.', info: [['yield', 'Morale'], ['danger', 'Whoever is taught it']],
      out: { text: 'The record says the country attacked without cause and was thrown back. The dead are listed as fallen. It is read in the school at the turn of each year, and the children play at it afterwards along the wire.',
        fx: s => ({ morale: 3, stain: ['dw_record', 1], do: s2 => { hit(T(s2), 6); }, chron: 'The record says the country attacked the colony without cause, and was beaten.' }) } },
    { label: 'Make it law that nothing past the wire is killed except to eat', note: 'The stores lose a share to vermin every season from now on, and anyone who raises a spade in anger answers to the hall for it.',
      out: { text: 'It is written into the charter and read at the gate. The trap line stays in the shed. The galley learns to weigh out a share for what comes in the night, and people learn to stamp their feet before they walk through a door.',
        fx: s => ({ yield: -0.02, do: s2 => { const t = T(s2); t.law = s2.day; give(t, 10); t.kill = 0; LF.emit(s2, 'resentment', 'dw.law', 20, 150, 'nothing past the wire may be killed except to eat'); }, chron: 'The colony made it law that nothing past the wire is killed except to eat.' }) } },
  ] });

LF.TAGS['dw.first'] = ['cautious open', 'mercy cautious', 'severe closed'];
LF.TAGS['dw.fields'] = ['bold order', 'cautious mercy', 'severe bold'];
LF.TAGS['dw.bench'] = ['cautious open', 'open bold', 'closed order'];
LF.TAGS['dw.hater'] = ['severe bold', 'order mercy', 'severe closed'];
LF.TAGS['dw.wall'] = ['bold order', 'cautious mercy', 'severe order'];
LF.TAGS['dw.walker'] = ['cautious open', 'severe closed', 'free open'];
LF.TAGS['dw.place'] = ['severe bold', 'cautious open', 'mercy open'];
LF.TAGS['dw.choice'] = ['severe bold', 'mercy open bold', 'cautious closed'];
LF.TAGS['dw.ash'] = ['severe bold', 'cautious closed', 'mercy open', 'cautious order', 'bold open', 'severe order'];
LF.TAGS['dw.open'] = ['severe order', 'bold closed', 'mercy closed', 'cautious closed', 'mercy bold'];
LF.TAGS['dw.siege'] = ['free order', 'cautious mercy', 'severe bold'];
LF.TAGS['dw.truth'] = ['open', 'closed order', 'mercy order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { const out = [], burned = OUT.slice(0, 1).concat(['dw_burn', 'scorched']).some(k => s.flags['lim_' + k]) || s.used['dw.ash'] !== undefined;
  if (s.used['dw.place'] !== undefined) out.push({ k: 'heart', card: 'dw.place', name: 'Where it comes from', kind: 'growth', dist: 'far', danger: t.end ? 2 : 3, state: t.end ? 'worked out' : 'rumoured',
    known: `The bearings on every attack since the big night, run back across the survey map, cross inside one circle out in ${L(s).land}, a hard day from the wire.` });
  if (burned) out.push({ k: 'ash', card: s.used['dw.ash'] !== undefined ? 'dw.ash' : null, name: 'The burned country', kind: 'mark', dist: 'near', danger: 2, state: 'located',
    known: `Black ground past the outer beds, where the colony set fire to ${L(s).weed} and everything that lived in it. Nobody has walked it since.` });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5). The circle: a day's walk into the country,
   and what is there points at the truth most of the time (pickK), as the survey team's look does on dw.place; a find that
   reads as one thing sets t.circle, and under heart t.found, so a later burning can reach it. The party shoots its way
   in and out by how hostile the country is: every kill out there is fed to t.host (hit), and the country takes some
   of the party when it is bad. The burned country: a Meanwhile line on what has come back onto the black ground. */
const CIRCLE = {
  blood: (s, c) => `In the middle of the circle is the colony's own carcass pit, where the watch has tipped the trap line's bag since the first season. Every track in ${c.land} runs to it and away from it toward the wire, and nothing there would let the party near.`,
  mood: (s, c) => `There is nothing in the circle: open ${c.top}, a few old tracks, wind. The party sat up the night in the middle of it with the rifles out, and toward morning everything in ${c.land} came and stood round them, closest on the side where the youngest of them sat.`,
  heart: (s, c) => `Under ${LF.lex(s, 'under')} in the middle of the circle there is one thing, warm to a bare hand, wider than the colony's whole claim. ${cap(c.small)} and ${c.big} go down to it by every path and come away fed, and none of them turned on the party while it stood on top.`,
  none: (s, c) => `In the middle of the circle is a warm seep, and half the country is breeding round it: ${c.small} by the thousand and ${c.big} lying up in the shallows. They took no notice of the party at all until it went near the young.` };
const ASH = {
  blood: c => `Nothing has come back onto the black ground but tracks, and every set of them runs one way: toward the wire.`,
  mood: c => `${cap(c.weed)} is coming back over the black ground in thin streaks. The party camped on it a night, and the only thing that came near was drawn to whoever cried out in their sleep.`,
  heart: c => `${cap(c.weed)} is coming back onto the black ground in rings, every ring round the same point a day further out in ${c.land}.`,
  none: c => `${cap(c.weed)} is already back across the black ground, and ${c.small} with it, thicker than before the fire. The fast breeders came first.` };
LF.THREADS[ID].visit = (s, t, a) => {
  const pk = String(a.poi || '').split('.')[1]; if (pk !== 'heart' && pk !== 'ash') return null;
  const w = L(s), c = { land: w.land, small: w.small, big: w.big, weed: w.weed, top: LF.lex(s, 'top') }, e = pickK(s, t, 0.1);
  if (pk === 'ash') { return Object.assign({ title: 'The Burned Country', text: ASH[e](c), fx: { do: s2 => learn(s2, T(s2), 8, e) } }, { quiet: true }); }
  if (t.end) { return Object.assign({ title: 'Where It Came From', text: t.heartDead ? `The circle is a crater of ash and slag, and the country round it is quiet. ${cap(w.small)} run from a boot again out there.` : CIRCLE[t.truth.is](s, c), fx: { do: s2 => learn(s2, T(s2), 10, t.truth.is) } }, { quiet: true }); }
  const shot = t.host >= 30 ? Math.round(t.host / 10) : 0, k = t.host >= 55 ? Math.min(a.n - 1, t.host >= 80 ? 2 : 1) : 0;
  const fight = !shot ? 'Nothing came at them on the road, going or coming.'
    : k > 0 ? `They shot their way in and shot their way home, and the country followed them to the wire. ${cap(num(k))} of them did not come back.`
    : 'They had to shoot their way in and shoot their way home, and the rifles were hot most of both days.';
  return { title: 'Inside the Circle', tone: 'pressure', scene: 'away_circle', text: `${CIRCLE[e](s, c)} ${fight}`,
    fx: { ...(k > 0 ? { chips: [[`${k} dead`, false]] } : {}), ...(e === 'mood' ? { morale: -2 } : {}),
      do: s2 => { const t2 = T(s2); learn(s2, t2, 20, e); if (shot) hit(t2, shot);
        if (e === 'heart') { t2.circle = s2.day; if (t2.truth.is === 'heart') t2.found = s2.day; }
        if (k > 0) { s2.pop -= k; s2.deaths += k; s2.grief = Math.min(40, s2.grief + 2.5 * k); a.n -= k; t2.toll += k; } } } };
};
})();

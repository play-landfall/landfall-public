/* Landfall — thread: the Hum. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). Lachlan, NEXT.md WO-5: a sound too low to hear comes up through the ground. People feel it in
   their teeth. Nosebleeds, no sleep, the small grazing things past the wire lying down facing the same way, a pregnancy
   lost, then three. Instruments show it some nights and not others. Its cost is nerve, sleep and births, and its real
   choice is whether to leave the site.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     ours   the colony's own reactor and pumps have found a resonance in the bedrock. Turning her down (t.derate) or off
            for a season (t.off) ends it; moving the people is pointless, since the machine goes with them.
     fault  the ground under the site is building to something, and the hum is the warning. The right answer is to move
            the colony off the site before it goes (t.strain; blasting adds to it). Nothing else helps.
     alive  something very large under the site is calling, and noise answers it (t.stir). Quiet, the reactor off, or
            leaving sends it down; sinking a shaft and blasting brings it up.
     ears   there is no sound. The sleepless hear it, the talk spreads it (t.talk), and the measures taken against it
            (t.harm) are what do the harm. Every drastic answer was needless.
   Kept clear of the Hard Ground (one cord failing for a dull reason) and the Deep Mind (an attention that costs): this
   one costs sleep, nerve and the cradles. Evidence (the teeth, the bleeds, the trace, the cradles, the animals, the worst
   of them, the reactor, the line of posts) points at the truth only most of the time (pickK); the camp, the stake, the
   burst ears and the shaft cannot mislead, and they are the cruel or the dangerous ones. Moving the colony is a cost
   (labour, materials, yield, morale, the road's dead, s.progress) and a flag (s.flags.inf_moved); s.built is untouched.
   Nothing here knows any other thread. Every card's text reads only what setup put in ctx.
   Three options at most (Lachlan, 2026-11-21): each card keeps its reading (a test), the plain answer and one hard one.
   Whether to Leave is move, stay and shut everything down, or stay and hold: one for the ground or the thing under it,
   one for the machines, one for no sound at all. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, byPid } = h;
const ID = 'infra', T = s => LF.T(s, ID), SRC = 'th.infra';
const KINDS = ['ours', 'fault', 'alive', 'ears'];
/* The dials: how often the sleepless have an accident that kills somebody, how fast it grows, how hard it bears on births. */
const RATE = 1, RISE = 0.12, CRADLE = 0.35;
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : LF.num(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  teeth: {
    ours: c => `It is worst in the bunks along the ${c.mach} side, and it lets up for an hour at the morning changeover, when the pumps are switched across.`,
    fault: c => 'It is the same in every row, and stronger lying down than standing. Two of the night watch, ears to the floor plates, say it is louder each night than the night before.',
    alive: c => 'It swells on the days the shop\'s hammers are going and the yard is loud, and an hour after they stop it is gone.',
    ears: c => 'Nobody who sleeps well feels it. The ones who feel it were the ones already up at night, and the more the mess talks of it, the more of the rows feel it.' },
  nose: {
    ours: c => `The bleeds come in the shifts that work by the ${c.mach} and the pump shed. The field crews, out all day, have had none.`,
    fault: c => 'The bleeds come at night, lying down, in every row alike. A glass of water left on the clinic floor overnight has a ring of fine grit in the bottom by morning.',
    alive: c => 'The bleeds come on the nights after the loudest days: the day the plates were riveted, the day the generators were run up. On the rest day nobody bled.',
    ears: c => 'The clinic can find no cause. Everyone who bled had slept less than four hours a night since it began, and the bleeds stop in the ones the clinic gets to sleep.' },
  needle: {
    ours: c => `The trace shows it on the nights the ${c.mach} runs above half load, and never on the two nights she was turned down for maintenance.`,
    fault: c => 'The trace shows it every night, a little stronger each time, and under the tone there is a slow tick that is getting faster.',
    alive: c => 'The trace shows it some nights and not others. On the nights it shows, it moves: the strongest reading walks from one sensor to the next across the site.',
    ears: c => 'The trace shows nothing on any night somebody sat with it. On the nights it shows something, the hand on watch was asleep and the cable was found kicked loose.' },
  cradle: {
    ours: c => `All three who lost a child sleep in the rows on the ${c.mach} side. The one still carrying, in the far pod, is well.`,
    fault: c => 'It is the same in every row. The ward\'s scale, kept for the newborn, will not settle at zero: the needle shivers on its own with nothing on the pan.',
    alive: c => 'All three were lost on the same night, at the same hour, and the three of them slept in three different rows.',
    ears: c => 'Two of the three were early, of the kind a clinic sees every year in a colony this size. The third was carried by somebody who had stopped sleeping altogether.' },
  facing: {
    ours: c => `They lie in a ring round the colony at a fixed distance, every one facing in, and the ring is thickest on the ${c.mach} side.`,
    fault: c => 'They face away from the site, every one of them, toward the high ground, and the ones that can still walk are walking that way.',
    alive: c => 'They face a single spot in the middle of the colony from every side, like the spokes of a wheel, and the spot is under the plate yard.',
    ears: c => 'They face the way the wind has come from all month. The lab\'s notes from the first season have them lying the same way then, before anyone felt anything.' },
  worst: {
    ours: c => `The worst of them all work the ${c.mach} shift, or sleep against the housing wall.`,
    fault: c => 'The worst of them are the ones who sleep on the floor rather than in a bunk. Two who were given hammocks are better within the week.',
    alive: c => 'The worst of them are the ones who make the most noise at work: the riveters, the smiths, the generator crew.',
    ears: c => 'The worst of them are the ones who sit up together at night talking about it. Two who were moved to a row where nobody had heard of it slept through.' },
  reactor: {
    ours: c => 'Turned down to half for an hour, the hum on the clinic floor drops away within minutes. Turned back up, it is there again before the lamps are bright.',
    fault: c => 'Turned down to half for an hour, nothing changes on the clinic floor. The housing\'s level gauge shows the pad she stands on has tilted a finger\'s width since landfall.',
    alive: c => 'Turned down to half, the hum fades over an hour. Turned back up, it comes back late, as if it were answering.',
    ears: c => 'Turned down to half for an hour without telling anybody, nobody notices. Turned down for an hour with the rows told, half of them say it has stopped.' },
  line: {
    ours: c => `The posts nearest the ${c.mach} read loudest, and it falls off with distance like rings from a stone dropped in a tank.`,
    fault: c => 'The posts read it loudest along a line that runs straight under the colony, from the high ground to the low.',
    alive: c => 'The posts read it loudest at a single point under the plate yard, and the point has moved twice in the month.',
    ears: c => 'The posts read nothing on any night they are watched. The rows feel it every night just the same.' },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { ours: 'the colony\'s own machines ringing the rock', fault: 'the ground under the site giving way, slowly', alive: 'something under the site that answers noise', ears: 'nothing at all, except what no sleep does' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx. bv, dv, wv, sv, mv, kv: the first name of the Engineering, Medical, Security, Science,
   Command or Works officer if one is at the post to say a line, else null. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}, t = T(s); for (const [k, role] of [['e', 'engineer'], ['d', 'physician'], ['sc', 'xenobio'], ['w', 'security'], ['cm', 'command']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  o.bv = voice(s, 'engineer'); o.dv = voice(s, 'doctor'); o.wv = voice(s, 'security'); o.sv = voice(s, 'scientist'); o.mv = voice(s, 'command'); o.kv = voice(s, 'crew');
  o.rx = LF.down(s, 'reactor'); o.mach = o.rx ? 'reactor' : 'pump shed'; o.lean = lean(t); return o; };
/* Somebody with a name and no office, out of the crowd (thread dice only). */
const someone = s => { const a = s.people.filter(p => p.alive && !p.away && !p.orbit && !p.role && p.known); return a.length ? LF.spick(s, a) : null; };
const who = (s, fall, first) => { const p = someone(s); return p ? { pid: p.id, name: p.name, first: p.first, title: LF.title(p).toLowerCase() } : { pid: null, name: fall, first: first || fall, title: null }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
/* A phase's card still waiting behind other threads' cards after forty days goes to the front of the queue. */
const nudge = (s, id) => { const e = s.sched.find(x => x.id === id); if (e) e.day = Math.min(e.day, s.day - 20); };
const die = (s, t, n) => { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 12))); t.toll += b - s.pop; return b - s.pop; };
const nerveAll = (s, v) => { for (const p of LF.seated(s)) if (!p.away) LF.shift(s, p, 'mind', v); };

/* How hard it bears this month, 0 to about 2. What it is settles what quiets it. */
function loud(s, t) {
  const k = t.truth.is, b = t.level, off = t.off > s.day, gone = t.did.move && !t.did.back;
  if (k === 'ours') return b * (off ? 0 : t.derate ? 0.25 : 1);
  if (k === 'fault') return b * (0.6 + 0.5 * clamp(t.strain, 0, 1.5)) * (gone ? 0.1 : 1);
  if (k === 'alive') return b * clamp(0.4 + t.stir, 0.2, 1.8) * (gone ? 0.15 : 1) * (off ? 0.5 : 1);
  return b * clamp(0.6 + 0.25 * t.talk + 0.35 * t.harm - 0.3 * t.calm, 0.15, 2);
}
/* A measure taken against it: noise, quiet, shut, derate, blast, move, harm (a measure that hurts people), calm, talk. */
function act(s, t, kind, v) { v = v === undefined ? 1 : v; const k = t.truth.is;
  if (kind === 'noise') { if (k === 'alive') t.stir += 0.15 * v; if (k === 'ears') t.harm += 0.1 * v; }
  else if (kind === 'quiet') { if (k === 'alive') t.stir = Math.max(0, t.stir - 0.3 * v); }
  else if (kind === 'shut') { t.off = s.day + 90; if (k === 'alive') t.stir = Math.max(0, t.stir - 0.5); if (k === 'ears') t.harm += 0.3; }
  else if (kind === 'derate') { t.derate = true; if (k === 'alive') t.stir = Math.max(0, t.stir - 0.2); }
  else if (kind === 'blast') { if (k === 'fault') t.strain += 0.6; if (k === 'alive') t.stir += 0.8; if (k === 'ears') t.harm += 0.2; }
  else if (kind === 'harm') { if (k === 'ears') t.harm += 0.35 * v; }
  else if (kind === 'calm') { if (k === 'ears') t.calm += 0.35 * v; else t.level = Math.max(0, t.level - 0.05 * v); }
  else if (kind === 'talk') { t.talk = Math.max(0, t.talk + v); }
}
function move(s, t, late) { t.did.move = true; t.did.back = false; t.road = s.day; t.late = !!late; s.flags.inf_moved = s.day;
  if (t.truth.is === 'ears') t.harm += 0.4; if (t.truth.is === 'alive') t.stir = 0.2;
  LF.emit(s, 'exhaustion', 'inf.road', 30, 120, 'the colony is hauling itself to a new site');
  LF.chron(s, `The colony left its first site${late ? ' in a hurry' : ''}, on account of the Hum.`); }
/* Whether what has been done is quieting it, for the bill cards. */
const working = (s, t) => ({ ours: !!(t.derate || t.off > s.day), fault: !!(t.did.move && !t.did.back), alive: !!(t.did.move && !t.did.back) || t.stir < 0.4, ears: t.harm < 0.45 && t.talk < 0.7 })[t.truth.is];

/* What it costs between cards: sleep, nerve, an accident among the sleepless, and the cradles (LF.BIRTH_MODS below). */
const SLIP = ['A rigger who had not slept in a month walked off the edge of the plate yard scaffold in broad day.', 'One of the sleepless was found in the water tank at dawn, face down.',
  'A cook nodded over the stove at the second watch and the pod burned round them.', 'Somebody on the night ditch detail lay down in the cut and did not get up when the bank came in.'];
const LOSS = ['The clinic lost another pregnancy this month.', 'Somebody in the rows miscarried in the night, and the ward did not hear of it till morning.'];
function month(s, t) {
  const L = loud(s, t);
  if (t.truth.is === 'ours' || t.truth.is === 'ears') t.level = Math.min(1.5, t.level + RISE); else t.level = Math.min(1.6, t.level + RISE);
  if (t.truth.is === 'fault' && !(t.did.move && !t.did.back)) t.strain += 0.07;
  if (t.truth.is === 'alive' && !(t.off > s.day) && !t.derate && !(t.quiet && s.day - t.quiet < 120)) t.stir += 0.04;
  if (t.truth.is === 'ears') t.talk += 0.04;
  if (L >= 0.8 && LF.srand(s) < 0.6) nerveAll(s, -1);
  if (L >= 1.3) { const o = LF.seated(s).filter(p => !p.away); if (o.length) LF.shift(s, LF.spick(s, o), 'mind', -1); }
  if (s.pop > 16 && LF.srand(s) < 0.09 * L * RATE && die(s, t, 1)) LF.log(s, LF.spick(s, SLIP), 'bad');
  if (L >= 0.8 && LF.birthRate(s) > 0 && LF.srand(s) < 0.3) { t.lost++; LF.log(s, LF.spick(s, LOSS), 'bad'); }
  if (t.truth.is === 'fault' && t.strain > 0.9 && ['rising', 'choice', 'bill'].includes(t.phase) && !(t.did.move && !t.did.back) && LF.srand(s) < 0.25) LF.log(s, 'A crack opened across the plate yard pad in the night, a finger wide, and the hum was louder for an hour after.', 'bad');
}

/* The end: when the last answer has had its month. What it was settles what that cost. */
function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^inf\./.test(e.id)); s.sched.push({ id: 'inf.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
function share(s, t, f, lo, hi) { return clamp(Math.round(LF.sized(s) * f), lo, hi); }
function resolve(s, t) {
  const k = t.truth.is, d = t.did, gone = d.move && !d.back;
  if (k === 'ours') {
    if (t.derate || d.shut) return finish(s, t, gone ? 'followed' : 'quieted', gone ? 'The colony moved for the Hum, and it stopped only when the reactor was turned down.' : 'The Hum stopped when the colony turned its own reactor down.');
    t.tail = s.day + LF.YEAR; nerveAll(s, -6); s.morale = clamp(s.morale - 4, 0, 100);
    return finish(s, t, gone ? 'followed' : 'endured', gone ? 'The colony moved for the Hum, and the Hum came with it.' : 'The colony lived with the Hum, and slept badly for a year after.'); }
  if (k === 'fault') {
    if (gone) { const n = t.strip ? die(s, t, 2) : 0; if (n) LF.log(s, 'The old site went in the night: the ground dropped along a line under the pods, and the ones sent back to strip it went with it.', 'bad');
      else LF.log(s, 'The old site went in the night. The ground dropped along a line under the empty pods, and the hum stopped with it.', '');
      return finish(s, t, 'left', 'The ground under the colony\'s first site gave way a season after the colony left it.'); }
    const n = die(s, t, share(s, t, 0.05 * (1 + clamp(t.strain - 1, 0, 1)), 4, 14)); s.res.mat = Math.max(0, s.res.mat - 25); s.morale = clamp(s.morale - 8, 0, 100);
    if (s.project) s.progress = 0;
    LF.log(s, `The ground went in the night. A crack opened along the line of the bunk rows and two pods dropped into it. ${Num(n)} died.`, 'bad');
    return finish(s, t, 'ground', 'The ground under the colony gave way along a line nobody had looked for.'); }
  if (k === 'alive') {
    if (d.blast && !gone) { const n = die(s, t, share(s, t, 0.045, 4, 12)); s.morale = clamp(s.morale - 8, 0, 100);
      LF.log(s, `In the night the ground under the plate yard heaved up and fell back, twice. The shaft closed, and the pods round it split. ${Num(n)} died.`, 'bad');
      return finish(s, t, 'woke', 'The colony blasted at the thing under the site, and it came up.'); }
    if (gone) return finish(s, t, 'left', 'The colony left the site, and whatever was under it went quiet.');
    if (d.shut || (t.quiet && s.day - t.quiet < 200) || t.stir < 0.5) return finish(s, t, 'stilled', 'The colony went quiet, and the thing under the site sank back down.');
    const n = die(s, t, share(s, t, 0.025, 2, 6)); LF.log(s, `The ground shook for a minute at midnight and was still. ${Num(n)} were under fallen plate by morning.`, 'bad');
    return finish(s, t, 'answered', 'Something under the colony rose to its noise, shook the site once, and went down again.'); }
  const drastic = (d.move && !d.back) || d.shut || d.blast || d.sedate || d.deaf || d.dose;
  return finish(s, t, drastic ? 'needless' : 'faded', drastic ? 'The Hum faded when the colony stopped fighting it.' : 'The Hum faded as the colony got its sleep back.');
}

LF.thread({ id: ID, name: 'The Hum', view: 'colony', dread: true,
  clue: (s, t) => ({ txt: 'A water glass on the clinic shelf, left standing for a month. The water in it has never once been still, and nobody has touched the shelf.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'something in the teeth' : 'the Hum',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What is coming up through the floor?',
  chap: {
    quieted: t => 'The Hum was the colony\'s own reactor ringing the rock under the site. The colony turned her down, and it stopped.',
    followed: t => t.derate || t.did.shut ? 'The Hum was the colony\'s own reactor ringing the rock. The colony hauled itself to a new site for it, and only turning the reactor down ended it.' : 'The Hum was the colony\'s own reactor ringing the rock. The colony hauled itself to a new site, and the Hum came with the reactor.',
    endured: t => 'The Hum was the colony\'s own reactor ringing the rock under the site. Nobody turned her down, and the colony slept badly and buried its losses for a year.',
    left: t => t.truth.is === 'fault' ? 'The Hum was the ground under the site giving way, slowly. The colony left before it went, and a season later it did.' : 'The Hum was something very large under the site, calling. The colony left, and it went quiet behind them.',
    ground: t => 'The Hum was the ground under the site giving way. The colony stayed, and the ground went under the bunk rows one night.',
    woke: t => 'The Hum was something very large under the site, calling. The colony sank a shaft and blasted at it, and it came up.',
    stilled: t => 'The Hum was something very large under the site, and noise drew it. The colony went quiet, and it sank back down.',
    answered: t => 'The Hum was something very large under the site, and the colony\'s noise drew it close enough to shake the pods once.',
    faded: t => 'There was no sound. The Hum was what no sleep does to people, and it faded as the colony slept again.',
    needless: t => `There was no sound. The Hum was what no sleep does to people, and the colony ${t.did.move ? 'hauled itself to a new site' : t.did.blast ? 'blasted a shaft under its own bunk rows' : t.did.deaf ? 'burst the eardrums of its sleepless' : 'drugged and moved and shut down' } before it found that out.`,
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, level: 0.4, strain: 0.2, stir: 0.3, talk: 0.2, harm: 0, calm: 0, off: 0, derate: false, quiet: 0, toll: 0, lost: 0, tail: 0, road: 0 }); },
  tick: (s, t) => {
    if (t.end) { if (t.tail > s.day && s.day % 10 === 0 && LF.srand(s) < 0.5) nerveAll(s, -1); return; }
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'sign'); s.signs.push({ id: 'hum', d: s.day, src: SRC }); LF.cue(s, 'inf.teeth', 0, 4); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'sign') { if (age >= 40 && since('inf.teeth') < 0) nudge(s, 'inf.teeth'); if (since('inf.teeth') >= 10 || age >= 90) { LF.phase(s, ID, 'nights', 'People began to feel a hum in their teeth, coming up through the floor, and stopped sleeping.'); LF.cue(s, 'inf.blood', 0, 4); } }
    else if (t.phase === 'nights') { if (since('inf.blood') >= 10) once('needle', 'inf.needle'); if (age >= 40 && since('inf.blood') < 0) nudge(s, 'inf.blood'); if (t.q.needle && s.day - t.q.needle >= 40 && since('inf.needle') < 0) nudge(s, 'inf.needle');
      if (since('inf.needle') >= 10 || age >= 150) { LF.phase(s, ID, 'loss'); LF.cue(s, 'inf.lost', 0, 4); s.tension = clamp(s.tension + 4, 0, 100); } }
    else if (t.phase === 'loss') { if (since('inf.lost') >= 10) once('facing', 'inf.facing'); if (age >= 40 && since('inf.lost') < 0) nudge(s, 'inf.lost'); if (t.q.facing && s.day - t.q.facing >= 40 && since('inf.facing') < 0) nudge(s, 'inf.facing');
      if (since('inf.facing') >= 10 || age >= 150) { LF.phase(s, ID, 'rising'); LF.cue(s, 'inf.worst', 0, 4); } }
    else if (t.phase === 'rising') { const rx = LF.down(s, 'reactor');
      if (since('inf.worst') >= 10 && rx) once('reactor', 'inf.reactor');
      if (since('inf.worst') >= 10 && (since('inf.reactor') >= 10 || !rx)) once('shaft', 'inf.shaft');
      if (age >= 40 && since('inf.worst') < 0) nudge(s, 'inf.worst'); for (const k of ['reactor', 'shaft']) if (t.q[k] && s.day - t.q[k] >= 40 && since('inf.' + k) < 0) nudge(s, 'inf.' + k);
      if (since('inf.shaft') >= 10 || age >= 180) { LF.phase(s, ID, 'choice'); jump(s, 'inf.leave', 20); } }
    else if (t.phase === 'choice') { if (age >= 30 && since('inf.leave') < 0) nudge(s, 'inf.leave'); if (since('inf.leave') >= 20 || age >= 120) { LF.phase(s, ID, 'bill'); t.billId = t.did.move && !t.did.back ? 'inf.road' : 'inf.still'; jump(s, t.billId, 20); } }
    else if (t.phase === 'bill') { if (age >= 30 && since(t.billId) < 0) nudge(s, t.billId); if (since(t.billId) >= 20 || age >= 120) return resolve(s, t); }
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) { const L = loud(s, t);
      if (t.insight < 60) LF.emit(s, 'unexplained', SRC, 26, 8, 'a hum nobody can hear comes up through the floor at night');
      if (L >= 0.5) LF.emit(s, 'exhaustion', SRC, L >= 1 ? 34 : 26, 8, 'half the colony has stopped sleeping for the hum');
      if (L >= 0.8) LF.emit(s, 'fear', SRC, 26, 8, 'the hum under the colony is louder every month');
      if (t.lost >= 1 || ['loss', 'rising', 'choice', 'bill'].includes(t.phase)) LF.emit(s, 'grief', SRC, 22, 8, 'the ward keeps losing pregnancies to the hum'); }
  },
  /* The lost sleep; the season on the road; a reactor at half or off. */
  press: (s, t, P) => { if (t.phase === 'latent') return;
    if (t.road && s.day - t.road < 90) P.labor -= t.late ? 0.25 : 0.2; if (t.road && s.day - t.road < 200) P.yield -= 0.08;
    if (t.off > s.day) { P.labor -= 0.1; P.morale -= 0.02; } if (t.derate) P.labor -= 0.03; if (t.quiet && s.day - t.quiet < 120) P.labor -= 0.04;
    if (t.end) return; const L = loud(s, t); P.labor -= 0.025 * L; P.morale -= 0.008 * L; },
});
/* The cradles: while it bears down, fewer children come to term; for a year after under ours, if it was lived with. */
LF.BIRTH_MODS.push(s => { const t = T(s); if (!t || t.phase === 'latent') return 1; if (t.end) return t.tail > s.day ? 0.6 : 1;
  let m = clamp(1 - CRADLE * loud(s, t), 0.25, 1); if (t.defer) m *= 0.3; if (t.ward) m = Math.min(1, m + 0.15); return m; });
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));

/* ======================= SIGN: in the teeth ======================= */
B('sign', { id: 'inf.teeth', tone: 'pressure', title: 'In the Teeth',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)) }),
  text: (s, c) => `The night watch noticed it first: a pressure in the back teeth, like biting on foil, that comes up through the floor plates after lamp-down. By the end of the month half the bunk rows have felt it, and the ones who feel it do not sleep. A cup of water set on the mess floor shows fine rings on its surface, and nothing else in the room is moving.\n\n${c.sv ? `[[scientist]] "You can't hear it." "That's the lovely part, it's under hearing, something down there's ringing and we're all sitting on the bell, and I don't even care what it is yet, I just want one geophone on the mess floor, one, is that so much to ask?"` : `${c.Sc} has asked for a geophone and a month.`}`,
  choices: [
    { label: 'Set a geophone in the mess floor and have the lab watch it', note: 'The lab gives up a month of nights to it, and whoever cannot sleep goes on not sleeping.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `${c.Sc} sits up with the trace through the month. ${ev('teeth', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The geophone picks up every boot on the plates and the mess kettle, and nothing under them anyone will swear to. Two of the lab hands have stopped sleeping too.', fx: s => ({ do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Tell the rows it is the new pads settling, and will pass', note: 'The rows are told something that may be true, and anyone it is not true for lies awake knowing it.',
      out: { text: 'The word goes round at supper, and some of the rows are glad of it. The night watch go on finding people sitting up in their bunks with a hand on the jaw.', fx: s => ({ morale: 1, do: s2 => act(s2, T(s2), 'talk', -0.15) }) } },
    { label: 'Put everyone who is up at night on a night shift, and get a second day out of them', dark: true, note: 'The work goes on round the clock, and the people who cannot sleep are not let rest either.', info: [['yield', 'Materials'], ['danger', 'The sleepless']],
      out: { text: 'The shop and the plate yard run lamps all night. The sleepless work them, slow and quiet, and the yard has never turned out so much. By the end of the month two of them have the shakes.',
        fx: s => ({ mat: 12, stain: ['inf_nights', 1], do: s2 => { const t = T(s2); t.did.nights = true; act(s2, t, 'noise'); act(s2, t, 'harm', 0.5); t.level += 0.08; } }) } },
  ] });

/* ======================= NIGHTS: the bleeds, and the trace ======================= */
B('nights', { id: 'inf.blood', view: 'people', tone: 'pressure', title: 'Nosebleeds',
  setup: s => { const p = who(s, 'one of the pump hands', 'the pump hand'); return Object.assign(crew(s), { ev: pickK(s, T(s), 0.05), pt: p.name, Pt: cap(p.name), ptf: p.first, ptt: p.title }); },
  text: (s, c) => `The clinic has had somebody in with a nosebleed most nights this month, always after midnight, always out of what passes for sleep now. ${c.Pt}${c.ptt ? `, ${c.ptt},` : ''} came in tonight with both nostrils packed and has not slept more than an hour at a stretch since the hum began.\n\n${c.dv ? `[[doctor]] "Look at ${c.ptf}, sitting there with both nostrils packed and apologising to me for the blood on my floor." "That's what no sleep does to the eyes, and it's doing it to half the rows, so talk about the floor all you like, but you come down and look first."` : `${c.D} has a cot by the door kept for the bleeds.`}`,
  choices: [
    { label: 'Have the clinic chart every bleed: who, where they sleep, what they work at', note: 'The clinic spends its nights on a chart, and the bleeders wait for anything else it might do.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.D} pins a plan of the bunk rows to the clinic wall and marks every bleed on it. ${ev('nose', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The chart fills with marks and no shape. Half the people on it gave the wrong bunk, for fear of being moved.', fx: s => ({ do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Give everyone who bleeds a sleeping draught from the clinic\'s stores', note: 'They sleep, and the clinic\'s stores of it are gone before anyone else needs them.',
      out: { text: 'The draught goes out at lamp-down in paper twists. The bleeders sleep heavily and wake slow, and the clinic\'s shelf is bare by the end of the month.', fx: s => ({ parts: -2, do: s2 => act(s2, T(s2), 'calm') }) } },
    { label: 'Keep the sleeping draught for the officers and the work crews', dark: true, note: 'The people running the colony sleep, and the bleeders are told there is none.', info: [['yield', 'The officers sleep'], ['danger', 'Everyone else']],
      out: { text: 'The draught goes into a locked box in the command pod. The officers sleep. The bleeders are told the shelf is empty, and one of them has seen it is not.',
        fx: s => ({ stain: ['inf_draught', 2], do: s2 => { nerveAll(s2, 4); T(s2).did.draught = true; LF.emit(s2, 'resentment', 'inf.draught', 22, 120, 'the officers keep the sleeping draught for themselves'); } }) } },
  ] });

B('nights', { id: 'inf.needle', tone: 'pressure', title: 'Some Nights',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.05), ev2: pickK(s, t, 0.12) }); },
  text: (s, c) => `The geophone in the mess floor shows it some nights and not others. On the nights it shows, it is there from the first watch to the last. On the nights it does not, the rows feel it just the same, or say they do.\n\n${c.sv ? `[[scientist]] "Why some nights?" "It's there and then it isn't, which means something's switching it, which is the best news we've had, so give me sensors in a line across the site and one quiet night, just one, and I'll tell you where it lives."\n\n` : `${c.Sc} wants sensors in a line across the site, and one quiet night. `}${c.lean}`,
  choices: [
    { label: 'Lay sensors across the site and log every night for a month', cost: { mat: 6 }, note: 'The plate and wire go into the ground, and the lab sits up with the log while the rows wait.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `The sensors go in along the bunk rows and out to the wire. ${ev('needle', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'Half the sensors are kicked loose or rained on, and the other half disagree. The log fills a notebook and settles nothing.', fx: s => ({ do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Stop every machine and every hammer for one night, and listen', note: 'The colony loses a night\'s power and a day\'s work, and the clinic\'s frail lie cold in the dark.',
      out: { text: (s, c) => `Everything is switched off at dusk. The colony sits in the dark and listens. ${ev('needle', c.ev2, c)}`, fx: (s, c) => ({ mat: -4, morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 16, c.ev2); act(s2, t, 'quiet', 0.5); } }) } },
    { label: 'Use the sleepless as the instrument: wake whoever hears it every hour, and log what they say', dark: true, note: 'The log gets a reading every hour of every night, and the people who give it get no sleep at all.', info: [['yield', 'A reading every night'], ['danger', 'The sleepless']],
      out: { text: (s, c) => `The watch goes round the rows with a lamp and a slate every hour. ${ev('needle', c.ev2, c)} By the end of the month three of the ones woken have stopped answering at all.`,
        fx: (s, c) => ({ stain: ['inf_wake', 2], do: s2 => { const t = T(s2); learn(s2, t, 26, c.ev2); t.level += 0.1; act(s2, t, 'harm'); t.did.wake = true; } }) } },
  ] });

/* ======================= LOSS: the cradles, and the grazers ======================= */
const CAMP = {
  ours: 'Out there, away from the machines, the ones in the tents sleep through the first night, and the next.',
  fault: 'Out there it is as strong as in the rows, stronger lying on the bare ground.',
  alive: 'Out there it is quieter, until a night the colony works late, when it comes on strong even in the tents.',
  ears: 'Out there, alone and guarded, they lie awake listening for it, and by the end of the month every one of them hears it.' };
B('loss', { id: 'inf.lost', view: 'people', tone: 'crisis', title: 'Lost',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s), 0.08) }),
  text: (s, c) => `The ward lost a pregnancy early in the month, and the clinic put it down to bad luck. Then there were two more in as many nights. Every one of them had been sleeping badly since the hum came up through the floor.\n\n${c.dv ? `[[doctor]] "That's three women I've sat with this month, and every one of them asked me what they did wrong." "Three in a month, in a colony this size, so don't tell me it's the floor and don't tell me it isn't, just tell me what you're doing for the ones still carrying."` : `${c.D} has asked what is to be done for the ones still carrying.`}`,
  choices: [
    { label: 'Take everyone carrying into the clinic\'s far room and keep them there', note: 'The clinic is full of the carrying for as long as it takes, and everyone else who falls sick waits.', test: { base: 50, mods: [R('physician', 10)] },
      ok: { text: (s, c) => `${c.D} fills the far room with cots and a guard on the door against visitors. ${ev('cradle', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 20, c.ev); t.ward = true; } }) },
      bad: { text: 'The far room is as bad as anywhere. Another is lost in the clinic itself, and the rest go back to their rows.', fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Ask the colony to put off children until it is over', note: 'Fewer will be lost, and the ones who wanted a child now are told to wait for something nobody can date.',
      out: { text: 'It is said at muster, plainly. Some of the rows are relieved. Some of them stop talking to you.', fx: s => ({ morale: -2, do: s2 => { T(s2).defer = true; } }) } },
    { label: 'Send everyone carrying out to a camp at the far edge of the fields, whether they will or not', dark: true, note: 'They sleep away from the colony and whatever is under it, in tents, with a guard, and nobody asks them.', info: [['yield', 'Distance from it'], ['danger', 'The carrying']],
      out: { text: (s, c) => `The watch walks them out at dusk with their bedding. ${CAMP[T(s).truth.is]}`,
        fx: s => ({ stain: ['inf_camp', 2], do: s2 => { const t = T(s2), k = t.truth.is; learn(s2, t, 26, k); t.did.camp = true; if (k === 'ours') t.ward = true; act(s2, t, 'harm'); } }) } },
  ] });

const STAKE = {
  ours: 'By dawn the one staked out is asleep, the first whole night in a month, and the animals have not moved.',
  fault: 'By dawn the one staked out has turned on the tether to face where the animals face, and is asleep that way, and cannot say why.',
  alive: 'At dawn the one staked out is awake and facing the same spot they face, and says something under the colony called all night.',
  ears: 'By dawn the one staked out has worked the stake loose and is sitting among the animals, wide awake, and swears it was louder out there than anywhere.' };
B('loss', { id: 'inf.facing', view: 'world', tone: 'pressure', title: 'Facing the Same Way',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s), 0.08), cover: LF.lex(s, 'cover') }),
  text: (s, c) => `The small grazing things that live in ${c.cover} came out in the night and lay down in the open past the wire, more of them than anybody knew were out there. They are alive. They do not graze or move, and every one of them faces the same way.\n\n${c.kv ? `[[crew]] "Beasts know things before we do, and my father's cows always lay down before the weather." "So I'd find out what they know before we do anything at all."` : c.wv ? `[[security]] "So now the wildlife's in on it, every one of them lying down facing the same way." "Which tells me they know something we don't, and I'd like someone to check which way they're looking before I'm asked to stand on that side of the wire."` : `The field crews have stopped at the gate to look.`}`,
  choices: [
    { label: 'Send the lab out among them to see what they face', note: 'The lab walks out past the wire among a field of animals nobody understands.', test: { base: 60, mods: [R('xenobio', 10), R('security', 5)] },
      ok: { text: (s, c) => `${c.Sc} walks the field of them with a compass and a notebook. ${ev('facing', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'They get up and scatter when the lab walks in among them, and lie down again further off. The compass readings are taken from a long way away and disagree.', fx: s => ({ do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Kill them where they lie and bring them in for the pot', note: 'The stores fill with meat, and nobody knows what is in it or what it was lying down for.',
      out: { text: 'They do not run. The crews go along the rows of them with bars, and the carts come in loaded. Some of the rows will not eat it.', fx: s => ({ food: 40, morale: -2 }) } },
    { label: 'Stake one of the sleepless out among them overnight, and see if they turn too', dark: true, note: 'You learn whether a person turns the way they do, from someone too tired to refuse.', info: [['yield', 'What they face'], ['danger', 'The one staked out']],
      out: { text: (s, c) => `The watch drives a stake past the wire at dusk and ties one of the sleepless to it with a lamp and a blanket. ${STAKE[T(s).truth.is]}`,
        fx: s => ({ stain: ['inf_stake', 2], do: s2 => { const t = T(s2); learn(s2, t, 28, t.truth.is); t.did.stake = true; } }) } },
  ] });

/* ======================= RISING: the worst of them, the reactor, the shaft ======================= */
const SED = { ours: 'They lie quiet. One of them does not come up when the dose is lowered.', fault: 'They lie quiet. One of them does not come up when the dose is lowered.',
  alive: 'They lie quiet. One of them does not come up when the dose is lowered.', ears: 'They lie quiet. Two of them do not come up when the dose is lowered, and the rest come up hearing it.' };
const DEAF = { ours: 'They are deaf by evening. They still feel it in the teeth, every one, and can no longer hear anybody tell them it will pass.', fault: 'They are deaf by evening. They still feel it in the teeth, every one, and can no longer hear anybody tell them it will pass.',
  alive: 'They are deaf by evening. They still feel it in the teeth, every one, and can no longer hear anybody tell them it will pass.', ears: 'They are deaf by evening, and every one of them still hears it, louder than before.' };
B('rising', { id: 'inf.worst', view: 'people', tone: 'crisis', title: 'The Worst of Them',
  setup: s => { const p = who(s, 'one of the riggers', 'the rigger'); return Object.assign(crew(s), { ev: pickK(s, T(s), 0.1), pt: p.name, Pt: cap(p.name), ptt: p.title }); },
  text: (s, c) => `A handful of the colony have stopped sleeping altogether. ${c.Pt}${c.ptt ? `, ${c.ptt},` : ''} was found at the water butt before dawn, pouring water into one ear to drown it out. The rest of them sit up together in the mess with their hands over their jaws, and the rows will not have them back.\n\n${c.dv ? `[[doctor]] "I can put them under, and they'd thank me for it tonight, because they'll take anything that makes it stop." "I don't want to, because you don't know what a season under does to a person, so if you want it, you ask me out loud and then I'll do it."` : `${c.D} can put them under for the season, and has said what that costs.`}`,
  choices: [
    { label: 'Give them a quiet room off the clinic, and somebody to sit up with them', note: 'The clinic loses a room, and the rows lose the hands who sit up with them.', test: { base: 50, mods: [R('physician', 10), R('crew', 5)] },
      ok: { text: (s, c) => `${c.D} takes the store room behind the clinic and lines it with blankets. ${ev('worst', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 18, c.ev); act(s2, t, 'calm'); } }) },
      bad: { text: 'The quiet room is not quiet. By the end of the month two more have joined them, and the hands who sat up are on the list themselves.', fx: s => ({ morale: -1, do: s2 => { T(s2).level += 0.1; } }) } },
    { label: 'Put them under for the season, on the clinic\'s drugs', dark: true, note: 'They will not suffer it, and some of them will not wake from a season under.', info: [['yield', 'The rows sleep'], ['danger', 'The worst of them']],
      out: { text: (s, c) => `${c.D} puts them under one by one in the far room. ${SED[T(s).truth.is]}`,
        fx: s => ({ pop: T(s).truth.is === 'ears' ? -2 : -1, morale: 2, stain: ['inf_sedate', 2], do: s2 => { const t = T(s2); t.toll += t.truth.is === 'ears' ? 2 : 1; t.did.sedate = true; act(s2, t, 'harm', 1.2); act(s2, t, 'talk', -0.3); } }) } },
    { label: 'Burst their eardrums, so there is nothing for it to get in by', dark: true, note: 'If it comes in by the ears it stops, and they are deaf for good either way.', info: [['yield', 'Maybe an end of it, for them'], ['danger', 'The worst of them']],
      out: { text: (s, c) => `${c.dv ? `${c.D} refuses, and the watch does it with a steel needle.` : 'The watch does it with a steel needle.'} ${DEAF[T(s).truth.is]}`,
        fx: s => ({ morale: -2, stain: ['inf_deaf', 3], do: s2 => { const t = T(s2); learn(s2, t, 24, t.truth.is); t.did.deaf = true; act(s2, t, 'harm', 1.2); } }) } },
  ] });

B('rising', { id: 'inf.reactor', tone: 'pressure', title: 'Under the Reactor',
  when: s => LF.down(s, 'reactor'),
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s), 0.12) }),
  text: (s, c) => `${c.E} has had the reactor's housing open to see if she is the source. She is the biggest thing on the site that turns, and the pumps that cool her run day and night. The rows on her side sleep worst, or say so.\n\n${c.bv ? `[[engineer]] "I think she might be singing, and I'd know, because I've heard every other noise she's got." "Might, I said, because the old girl's never done it before in all the years I've had her. I can turn her down an hour and you tell me if it stops, or I turn her off, and everything else goes off with her."\n\n` : `${c.E} can turn her down for an hour to see, or off for a season. `}${c.lean}`,
  choices: [
    { label: 'Turn her down for an hour one night, without telling the rows, and watch the trace', note: 'The colony loses nothing but an hour of light, and the lab learns only what an hour can show.', test: { base: 60, mods: [R('engineer', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.E} brings her down at the third watch with the lab at the trace. ${ev('reactor', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: 'The trace jumps when the coolant pumps cycle and tells nobody anything else. The night watch noticed the lamps dim, and by morning the rows have their own story about it.', fx: s => ({ do: s2 => { const t = T(s2); learn(s2, t, 5); act(s2, t, 'talk', 0.2); } }) } },
    { label: 'Derate her to half load, for good', note: 'The colony runs on half power: slower building, colder rows and lamps out early, for as long as it stands here.',
      out: { text: (s, c) => `${c.E} sets her to half and locks the setting. The pod lamps go out at the second watch now, and the shop works to daylight.`, fx: s => ({ morale: -1, do: s2 => { const t = T(s2); act(s2, t, 'derate'); t.did.derate = true; } }) } },
    { label: 'Shut her down for a season', note: 'Everything stops for a season, the heat, the pumps and the clinic\'s machines with it, and the frail go cold.', info: [['yield', 'Silence under the colony'], ['danger', 'The frail']],
      out: { text: 'The reactor goes cold at dusk. The colony runs on the lander\'s cells and whatever can be burned. By the end of the first month the clinic has lost one of its oldest to the cold.',
        fx: s => ({ pop: -1, morale: -3, do: s2 => { const t = T(s2); t.toll++; act(s2, t, 'shut'); t.did.shut = true; } }) } },
  ] });

const SHAFT = {
  ours: c => `Thirty metres down the rock is solid and quiet. The hum is in the shaft walls only near the top, where the ${c.mach}'s footings are.`,
  fault: c => 'At thirty metres the shaft cuts a seam of crushed rock, warm to the hand. After the charge, the walls of the shaft go on cracking for a day, and the cracks run toward the bunk rows.',
  alive: c => 'At thirty metres the bit comes up wet and warm. After the charge the hum stops dead for an hour. Then the whole site lifts, once, and the shaft is full of water to the brim by morning.',
  ears: c => 'Thirty metres of plain rock, dry and cold. The blast shakes the colony for a moment, and that night the rows sleep better than they have in months, believing it done.' };
B('rising', { id: 'inf.shaft', tone: 'crisis', title: 'Sink a Shaft',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s), 0.12) }),
  text: (s, c) => `${c.Sc} wants a shaft sunk in the middle of the site, down to whatever is ringing, and a charge set at the bottom. ${c.E} says the drill can make thirty metres in a month. The shaft would go down beside the plate yard, among the bunk rows.\n\n${c.sv ? `[[scientist]] "Thirty metres and a charge." "And then we'd know, wouldn't you want to know, it's right under us, it's been under us the whole time, and we're all lying on top of it asking what it is when we could just go down and ask it."\n\n` : `${c.Sc}'s notes on it end in a question mark. `}${c.lean}`,
  choices: [
    { label: 'Sink the shaft and set the charge', cost: { mat: 10 }, note: 'The drill crew go down it, and whatever the charge wakes or breaks is under the bunk rows.', info: [['yield', 'An answer, of one kind or another'], ['danger', 'The drill crew, and the rows']],
      out: { text: (s, c) => `The shaft goes down through the month, and the charge is fired at noon with the colony at the wire. ${SHAFT[T(s).truth.is](c)}`,
        fx: s => { const k = T(s).truth.is; return { pop: k === 'alive' ? -2 : k === 'fault' ? -1 : 0, do: s2 => { const t = T(s2); learn(s2, t, 30, k); act(s2, t, 'blast'); t.did.blast = true; if (k === 'alive') t.toll += 2; if (k === 'fault') t.toll++; } }; } } },
    { label: 'Lay a line of listening posts instead, and drill nothing', note: 'It takes the lab a season, and the rows go on not sleeping while it does.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `The posts go in a line across the site and out past the wire. ${ev('line', c.ev, c)}`, fx: (s, c) => ({ mat: -4, do: s2 => learn(s2, T(s2), 20, c.ev) }) },
      bad: { text: 'The posts are set too shallow, and every one of them reads the bunk rows turning over in their sleep, or not sleeping.', fx: s => ({ mat: -4, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Silence the colony after dark: no hammers, no machines, no night shifts', note: 'Every hour of night work is lost, and the colony builds by daylight for as long as it lasts.',
      out: { text: 'The shop shuts at dusk, the pumps run low, and the yard is dark. The nights are very quiet. Some of the rows say they can feel it better now.', fx: s => ({ do: s2 => { const t = T(s2); t.quiet = s2.day; act(s2, t, 'quiet'); } }) } },
  ] });

/* ======================= CHOICE: whether to leave ======================= */
B('choice', { id: 'inf.leave', tone: 'crisis', title: 'Whether to Leave',
  setup: s => { const t = T(s); return Object.assign(crew(s), { off: t.off > s.day || t.derate }); },
  text: (s, c) => `The rows want an answer: stay on this site, or go. ${c.Cm} has a second site picked on higher ground past the fields, and says a season of hauling would put the colony down on it with most of what it owns. Whatever is half built here stays half built.\n\n${c.mv ? `[[command]] "I see two headings from here, and there isn't a third." "We pack and haul for a season and lose whatever we can't carry, or we stay and stop asking about it, and I want one of those by tonight."\n\n` : 'The officers have put it to you by tonight. '}${c.lean}`,
  choices: [
    { label: 'Move the colony to the new site', note: 'A season on the road: the half-built is lost, the old and the carrying haul with everyone else, and some of them will not get there.', info: [['yield', 'Off this ground'], ['danger', 'The old and the carrying, on the road']],
      out: { text: 'The hauling starts at first light and goes on all season. What can be unbolted goes on the carts; what cannot is left standing with its doors open. The old site is empty by the end of it.',
        fx: s => ({ mat: -20, food: -30, morale: -4, pop: -2, progress: -1, do: s2 => { const t = T(s2); t.toll += 2; move(s2, t); } }) } },
    { label: (s, c) => c.rx ? 'Stay, and shut the reactor down for a season to see if it stops' : 'Stay, and stop every pump and engine for a season to see if it stops', note: 'The colony keeps its site and spends a season cold and dark, and the frail pay for the cold.',
      out: { text: (s, c) => `${c.rx ? 'The reactor goes cold' : 'The pumps and engines stop'} at dusk. The rows sleep in their coats. By the end of the first month the clinic has lost one of its oldest to the cold.`,
        fx: s => ({ pop: -1, morale: -3, do: s2 => { const t = T(s2); t.toll++; act(s2, t, 'shut'); t.did.shut = true; t.did.stay = true; } }) } },
    { label: 'Stay, and hold to what has been done', note: 'Nobody hauls, nobody is drugged, and the carrying and the sleepless go on paying for it.',
      out: { text: 'You say it at muster: the colony stays. The rows go back to their bunks. The clinic keeps the far room ready.', fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.did.hold = true; t.did.stay = true; } }) } },
  ] });

/* ======================= BILL: the new site, or a month on ======================= */
B('bill', { id: 'inf.road', tone: 'pressure', title: 'The New Site',
  when: (s, t) => !!t.did.move && !t.did.back,
  setup: s => { const t = T(s), w = working(s, t); return Object.assign(crew(s), { quiet: LF.srand(s) < 0.78 ? w : !w, top: LF.lex(s, 'top') }); },
  text: (s, c) => `The colony is down on the new site in tents and half-bolted pods, with the carts still being unloaded. ${c.quiet ? 'The first night the rows slept. Nobody woke the watch with a hand on the jaw, and the clinic had nobody in.' : `The first night the ${c.rx ? 'reactor' : 'pumps'} ran on the new pad, the cup on the mess table began to walk again.`}\n\n${c.kv ? `[[crew]] "The ${c.top}'s poor here, thin and sour, I've had it in my hand." "It'll be a season before the fields are what they were, and we'll go short till then, but we'll manage."\n\n` : 'The fields here will take a season to make. '}${c.lean}`,
  choices: [
    { label: 'Build here, and make the best of it', note: 'The fields and the pods start again, and the colony goes short while they do.',
      out: { text: 'The pods go up in rows on the new pad. The fields are staked out and dug, and the first rows go in before the carts are empty.', fx: s => ({ mat: -8, morale: 1, do: s2 => { T(s2).did.settle = true; } }) } },
    { label: 'Send the slowest back to the old site to strip what was left', dark: true, note: 'The colony gets its plate and wire back, and the ones sent back live on the old site for as long as it takes.', info: [['yield', 'Materials'], ['danger', 'The ones sent back']],
      out: { text: 'A handful of the slowest go back with a cart. They strip the old pods to the frames and send back wire and plate all month.', fx: s => ({ mat: 20, stain: ['inf_strip', 2], do: s2 => { T(s2).strip = true; } }) } },
    { label: 'Go back to the old site: this one is worse', note: 'Another haul, and whatever made the colony leave is waiting there.',
      out: { text: 'The carts go back the way they came. The old pods are cold and empty and still standing, and the rows go back into them without a word.', fx: s => ({ mat: -6, morale: -4, do: s2 => { const t = T(s2); t.did.back = true; delete s2.flags.inf_moved; } }) } },
  ] });

B('bill', { id: 'inf.still', tone: 'pressure', title: 'Still Here',
  when: (s, t) => !t.did.move || !!t.did.back,
  setup: s => { const t = T(s), w = working(s, t); return Object.assign(crew(s), { slow: LF.srand(s) < 0.78 ? w : !w }); },
  text: (s, c) => `It is a month since the colony chose to stay. ${c.D} keeps a sheet on the clinic wall with a box for every night somebody was in with a bleed or a loss. ${c.slow ? 'Few of the boxes were filled this month, fewer than the month before.' : 'Most of the boxes were filled this month, more than the month before.'}\n\n${c.lean}`,
  choices: [
    { label: 'Hold to it, and give it the season', note: 'If staying was wrong, the colony pays for it in the rows and the cradles.',
      out: { text: 'Nothing is changed. The sheet goes on, and the rows stop asking what it shows.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.held = true; } }) } },
    { label: 'Leave after all, late, with what can be carried in a hurry', note: 'A rushed haul: more is left behind and more die on the road than if the colony had gone when it was asked.', info: [['yield', 'Off this ground'], ['danger', 'Everyone on the road']],
      out: { text: 'The carts are loaded in a day and a night. What will not go on them is left. The road is longer in a hurry, and the old site is empty by the end of the season.',
        fx: s => ({ mat: -30, food: -40, morale: -6, pop: -3, progress: -1, do: s2 => { const t = T(s2); t.toll += 3; move(s2, t, true); } }) } },
    { label: 'Put the worst of the sleepless out of the colony for good', dark: true, note: 'The rows are rid of the ones who keep them awake, and those put out go with a cart and no way back.', info: [['yield', 'Quiet rows'], ['danger', 'The worst of the sleepless']],
      out: { text: 'They go at dawn with a cart, a tent and a month of food. The rows sleep a little better, or say so.', fx: s => ({ leave: 3, morale: 2, tension: -4, stain: ['inf_out', 2], do: s2 => { const t = T(s2); t.did.out = true; act(s2, t, 'talk', -0.4); act(s2, t, 'harm', 0.5); } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  ours: 'It was the colony\'s own reactor and the pumps that cool it, ringing the bedrock under the site like a struck bell. Turned down, it went quiet. Moving the people did nothing while the machine went with them.',
  fault: 'It was the ground under the site taking up a strain, deep down, and the hum was the sound of it going. Nothing done on the site could have stopped it. The only right answer was to be somewhere else when it went.',
  alive: 'Something very large lies under the site, and it was calling. Every loud night answered it, and it rose a little to the noise. Quiet sent it down again, and blasting brought it up.',
  ears: 'There was no sound. The instruments read loose cables and boots on the plates, and the sleepless heard what the sleepless hear. The bleeds, the losses and the dead came from no sleep, and from what was done about it.' };
const TAIL = { quieted: 'Turning her down was the whole of the cure.', followed: 'The colony hauled itself to a new site, and the reactor went with it.', endured: 'Nobody turned her down, and the cradles stayed emptier than they should have for a year after.',
  ground: 'The ground went under the bunk rows one night.', woke: 'The charge at the bottom of the shaft was answered.', stilled: 'In the quiet it sank back down.',
  answered: 'It came close enough to shake the pods once, and then went down on its own.', faded: 'It faded as the rows got their sleep back.', needless: 'Every measure taken against it was taken against nothing.' };
const LEFT = { fault: 'The old site went a season after the colony left it: the ground dropped along a line under the empty pods.', alive: 'Behind the colony, the old site went quiet once nobody was making noise on it.' };
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [], add = (o, f, a, e) => L.push({ ours: o, fault: f, alive: a, ears: e }[k]);
  if (d.move) add(d.back ? 'The colony hauled itself away and back again, and the reactor went both ways with it.' : 'The haul to the new site was for nothing while the reactor came too.', d.back ? 'The colony went back to the old site, which was the one thing not to do.' : 'The haul to the new site was the answer, and it cost a season.',
    d.back ? 'The colony went back to where it had been calling.' : 'The haul took the colony out of its hearing.', 'The haul to the new site was a season lost to nothing.');
  if (d.behind) L.push(k === 'fault' ? 'The ones left behind on the old site were there when the ground went.' : 'The ones left behind on the old site were left for a guess.');
  if (d.shut) add('Shutting the reactor down was right, and it cost the frail the cold.', 'The reactor went cold for a season for nothing.', 'The season without the reactor let it sink.', 'The season without the reactor was cold for nothing.');
  if (d.derate) add('Turning the reactor down to half was the answer.', 'The reactor at half did nothing to the ground.', 'The reactor at half made the nights a little quieter.', 'The reactor at half did nothing but darken the rows.');
  if (d.blast) add('The shaft found only the reactor\'s footings.', 'The shaft and the charge added to the strain.', 'The shaft and the charge called it up.', 'The shaft found plain rock, and the colony slept a night believing it was done.');
  if (d.sedate || d.dose) add('The drugs gave the sleepless sleep and did nothing to the reactor.', 'The drugs gave the sleepless sleep and did nothing to the ground.', 'The drugs gave the sleepless sleep and did nothing to what was under them.', 'The drugs killed people who only needed to be let rest.');
  if (d.deaf) L.push(k === 'ears' ? 'The ones whose ears were burst went on hearing it, because it was never in the ears.' : 'The ones whose ears were burst went on feeling it in their teeth, deaf.');
  if (d.camp) add('The carrying sent out to the camp were the only ones sleeping clear of it.', 'The carrying sent out to the camp were no further from it than anyone.', 'The carrying sent out to the camp were a little further from the noise.', 'The carrying sent out to the camp lay awake alone and learned to hear it.');
  if (!(d.move && !d.back)) add(t.derate || d.shut ? null : 'Nobody turned the reactor down, which was all it ever needed.', 'The colony stayed on ground that was going, and the hum had been saying so from the first night.', t.end === 'answered' || t.end === 'woke' ? 'The colony stayed where it was being called, and kept making noise.' : null, null);
  if (d.out) L.push('The sleepless put out of the colony were put out for something that was not their fault.');
  if (d.draught) L.push('The officers slept on the clinic\'s draught while the rows bled, and the rows know it.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was hauled, drugged or deafened on account of it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'inf.truth', tone: 'quiet', title: 'What the Hum Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), lost: t.lost }); },
  text: (s, c) => { const t = T(s), tail = c.end === 'left' ? ' ' + (LEFT[t.truth.is] || '') : TAIL[c.end] ? ' ' + TAIL[c.end] : ''; return `${WAS[t.truth.is]}${tail}\n\n${reckon(s, t)}${c.toll ? ` ${Num(c.toll)} colonist${c.toll === 1 ? '' : 's'} died of it, or of what was done about it.` : ''}${c.lost ? ` The ward lost ${num(c.lost)} pregnanc${c.lost === 1 ? 'y' : 'ies'} besides.` : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who gave an order about it, or carried one out, has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who ordered what. People read it. Some of the rows stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the Hum, with the names.' }) } },
    { label: 'Enter it as a bad season for sleep, and nothing more', dark: true, note: 'The colony gets an account with nobody in it, and every order given about the Hum goes unanswered.', info: [['yield', 'Morale']],
      out: { text: 'The record says the colony slept badly in its early years and came through. The site is not mentioned. It is the version the children will be taught.', fx: s => ({ morale: 3, stain: ['inf_record', 1], chron: 'The record says the colony slept badly in its early years, and came through.' }) } },
  ] });

/* The deeds these cards can add to the colony's record (content-limits.js DEEDS). Three options at most (2026-11-21): the
   options behind inf_dock, inf_unfit, inf_trace, inf_hide, inf_wall, inf_detail, inf_gag, inf_behind, inf_dose, inf_half and
   inf_shifts were cut; their phrases stay for saved games that carry the deed. */
Object.assign(LF.DEEDS || {}, {
  inf_nights: 'the sleepless worked through the nights because they could not sleep anyway',
  inf_dock: 'a ration docked from anyone who spoke of the hum',
  inf_unfit: 'the bleeders kept at work with cotton in their noses',
  inf_draught: 'the sleeping draught kept for the officers while the rows bled',
  inf_trace: 'half the trace posted on the mess door and the rest kept back',
  inf_wake: 'the sleepless woken every hour to be used as an instrument',
  inf_camp: 'the carrying marched out to a guarded camp at the edge of the fields',
  inf_hide: 'the lost pregnancies logged as ordinary and kept from the rows',
  inf_stake: 'one of the sleepless staked out past the wire among the grazers',
  inf_sedate: 'the worst of the sleepless put under for a season',
  inf_deaf: 'the eardrums of the sleepless burst with a steel needle',
  inf_wall: 'whoever complained moved to sleep against the reactor housing',
  inf_detail: 'the punishment detail roped to the drill line when the charge was set',
  inf_gag: 'the punishment detail for anyone who spoke of the hum',
  inf_behind: 'the old and the sick left behind on the old site',
  inf_dose: 'the whole colony dosed to sleep from the evening pot',
  inf_strip: 'the slowest sent back to strip the old site',
  inf_half: 'the old and the sick put on half rations on the new site',
  inf_out: 'the sleepless put out of the colony for good',
  inf_shifts: 'full shifts worked by people who had not slept',
  inf_record: 'the account of the Hum that called it a bad season for sleep',
});

LF.TAGS['inf.teeth'] = ['cautious open', 'closed', 'severe bold'];
LF.TAGS['inf.blood'] = ['cautious open', 'mercy', 'severe closed'];
LF.TAGS['inf.needle'] = ['cautious open', 'bold open', 'severe open'];
LF.TAGS['inf.lost'] = ['mercy cautious', 'cautious open', 'severe order'];
LF.TAGS['inf.facing'] = ['bold open', 'bold', 'severe open'];
LF.TAGS['inf.worst'] = ['mercy', 'severe order', 'severe bold'];
LF.TAGS['inf.reactor'] = ['cautious open', 'cautious', 'bold'];
LF.TAGS['inf.shaft'] = ['bold open', 'cautious open', 'cautious order'];
LF.TAGS['inf.leave'] = ['bold', 'cautious', 'cautious'];
LF.TAGS['inf.road'] = ['cautious', 'severe order', 'bold'];
LF.TAGS['inf.still'] = ['cautious', 'bold', 'severe closed'];
LF.TAGS['inf.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['inf.facing'] === undefined ? [] : [{ k: 'grazers', card: 'inf.facing', name: 'Where the grazers lay down', kind: 'herd', dist: 'near', danger: 1,
  state: t.end ? 'worked out' : 'located', known: `Open ground past the wire where the small grazing things of ${LF.lex(s, 'cover')} came out in the night and lay down, more of them than anybody knew were out there, every one facing the same way.` }];
/* A party the player sent to its place (orders.js order.send, T2-5): what they found among the grazers, which points at
   the truth most of the time (pickK), as the cards' evidence does. A crack running toward the colony, or the herd standing
   up to the party's own mallet, comes home as a card; the rest as a Meanwhile line. The mallet is noise (act), and a night
   slept well out there is calm. line(): a find with nothing to decide is a line when the return itself had nothing to
   decide either (LF.AWAY_QUIET). */
const line = (a, v) => { if (v) v.quiet = true; return v; };   // nothing to decide: a Meanwhile line when the return itself was quiet (js/orders.js needsCard)
const GRAZE = {
  ours: c => `They walked the ring of lying grazers out past the wire. The lying ones are all within one distance of the ${c.mach}, as if a line had been drawn round it; past that the herds are up and grazing and pay the party no mind.`,
  fault: c => 'Out where the grazers lay, the ground has opened: a crack a hand wide runs straight across the open ground and on toward the colony. The grazers have all moved off to the high side of it. A stone dropped in was not heard to land.',
  alive: c => 'They drove stakes for a night camp among the lying grazers. At the first blows of the mallet every animal in sight got up and turned to face the stakes, and stood like that until the hammering stopped. Then they lay down again.',
  ears: c => 'The grazers lie where the first season\'s notes put them, the way the wind lies, and get up and wander off when the party comes near. The party slept out among them and slept well, most of them for the first time in months.' };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'grazers' || t.end) return null;
  const c = { mach: LF.down(s, 'reactor') ? 'reactor' : 'pump shed' }, e = pickK(s, t, 0.05);
  const fx = { survey: 6, do: s2 => { const t2 = T(s2); learn(s2, t2, 10, e); if (e === 'alive') act(s2, t2, 'noise', 0.5); if (e === 'ears') act(s2, t2, 'calm', 0.5); } };
  if (e === 'fault') return { title: 'The Crack', tone: 'pressure', scene: 'away_inf_crack', text: GRAZE[e](c), fx };
  if (e === 'alive') return { title: 'They Stood Up', tone: 'pressure', scene: 'away_inf_stakes', text: GRAZE[e](c), fx };
  return line(a, { title: 'Where the Grazers Lay', tone: 'quiet', text: GRAZE[e](c), fx });
};
})();

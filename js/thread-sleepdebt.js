/* Landfall — thread: the Night Shift (id sleepdebt). A dread (threads.js): dealt by the plot whatever the world, opening
   in the first months (t.nth 0) or later (1). Nobody in the colony dreams any more. Then people get up after midnight
   with their eyes shut and do their own jobs at their own benches (t.n, part of s.pop), and the work is better than
   what they do awake. It spreads, and behind the workshop the night shift puts up a frame nobody drew (t.frame).
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     used   something with no hands here is using theirs. The frame is its work, and on the night it is finished the
            night shift walks out to it. Right: pull the frame down, or keep them from it on the night, by any means.
     adapt  it is what this world does to people who work hard under it, and it does them good. The frame is the mill
            tower off the colony's own build list. Right: leave them be. Everything done to them was done for nothing.
     sick   a sickness that takes the dreams, then gives the hands the day's work, and deepens the sleep under them
            until a night when the sleeper does not come up. Right: keep them awake (the wakers, or waking them hard
            on the last night); a bar on the door keeps it in one pod. The frame is one joint made four hundred times.
     ship   the pod tutors drilled the ship's construction manual into every sleeper for the whole crossing, on a tone
            the relay still carries on every night pass. They are building a relay mast for a colony several times this
            size, at its pace. Right: pull the relay's night feed. Nothing done to the sleepers or the frame ends it.
   Evidence (the clinic's trace, the night's work, the frame, an officer on the table, the ship's passes, a volunteer)
   is drawn per card and points at the truth only most of the time (pickK). While it runs free it pays in labour, eats
   plate and food, and kills by its own truth; every measure against it is paid for in work and in sleepers. It writes
   unexplained, fear, exhaustion, confinement, resentment and schism, and reads dark and exhaustion. Nothing here knows
   any other thread. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If, byPid, anyNamed } = h;
const ID = 'sleepdebt', T = s => LF.T(s, ID), SRC = 'th.sleepdebt';
const KINDS = ['used', 'adapt', 'sick', 'ship'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const is = (s, k) => T(s).truth.is === k;

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  trace: {
    used: 'On the clinic\'s trace a working sleeper is quiet everywhere but the hands and the eyes. The traces of two sleepers in different pods rise and fall together, to the second.',
    adapt: 'On the clinic\'s trace a working sleeper is in deeper rest than anything in the files brought from Earth, hands and all. Each wakes fresher than the one in the next cot, who slept eight hours and did nothing.',
    sick: 'On the clinic\'s trace the deep sleep under the work is longer every night of the month, and harder to break. By the last night it takes cold water and two people to bring one of them round.',
    ship: 'On the clinic\'s trace a working sleeper shows the slow rhythm the cryo banks logged for the whole crossing: the pod tutors\' drill, which should have stopped at the thaw.' },
  work: {
    used: 'Every night-made part is in tolerance, and a third of them are for nothing on the build list. Those are cut to a measure a little off the metre, the same on every one.',
    adapt: 'Every night-made part is in tolerance and on the build list. The hands are doing the day\'s own jobs over again, slower and without the mistakes, the way a trade gets learned.',
    sick: 'Every night-made part is in tolerance, and each sleeper makes only the one: the last thing done before the bell, again and again, until the stock runs out. The bins are full of good copies nobody asked for.',
    ship: `Every night-made part is in tolerance and to a drawing. The drawings are in the ${LF.SHIP}'s construction manual, and the parts are being made in page order.` },
  frame: {
    used: 'No joint in it is one the colony uses, and nothing in it is square. Sighted along its long axis it points at a place on the horizon where there is nothing.',
    adapt: 'Under the odd bracing it is the mill tower from the colony\'s own build list, a year ahead of its turn, on better footings than the drawing asks for.',
    sick: 'It has no plan. It is one bolted joint made several hundred times, each fixed to the last, because fixing it there is what the hands did on the first night.',
    ship: 'It matches plate 212 of the ship\'s construction manual: the base section of a relay mast, meant to be raised by a crane the colony does not have.' },
  body: {
    used: c => `${c.Name}'s blood and reflexes are a healthy adult's. Asleep, the hands answer a tap on the bench frame in a rhythm ${c.first} has never heard awake, and they answer at once.`,
    adapt: c => `${c.Name}'s blood and reflexes are better than at landfall. The tremor from the crossing is gone, and so is the old sleep debt. Nothing the clinic can find is taking anything from ${c.first}.`,
    sick: c => `${c.Name}'s blood and reflexes are a healthy adult's, all but the one the clinic checks last: the start a sleeper gives at a loud noise is slow, and slower than it was at landfall.`,
    ship: c => `${c.Name}'s blood and reflexes are a healthy adult's. Played the ship's housekeeping tone in the clinic, asleep, ${c.first} sits up and reaches for tools. Awake, ${c.first} cannot hear it at all.` },
  pass: {
    used: 'The night shift keeps no time by the ship. It starts a few minutes later every night, by a clock that is not the colony\'s and is not the sky\'s.',
    adapt: 'The night shift keeps no time by the ship. Each sleeper starts about four hours after lying down, whatever the hour, the way a body keeps its own habits.',
    sick: 'The night shift keeps no time by the ship. Each sleeper starts a little earlier every night and stops a little later, and three of them now work through the bell.',
    ship: 'The night shift starts within a minute of the ship\'s rising and stops when it sets. On the two nights the pass fell in daylight, nobody left a bunk.' },
  watch: {
    used: c => `${c.Name} fought it for six nights. On the seventh ${c.first} got up asleep and went straight to the frame behind the workshop, having never been told where it was.`,
    adapt: c => `Nothing took ${c.name}. It came on the way a callus does, a little each night after a hard day, and ${c.first} slept through all of it and woke rested.`,
    sick: c => `It took ${c.name} within the month of moving bunks: a night of fever, then no dreams, then the hands. The two in the bunks either side had it first.`,
    ship: c => `It took ${c.name} on the first night, in the middle of a sentence, in the minute the ship came up over the ridge.` },
};
const ev = (kind, k, c) => { const x = EV[kind][k]; return typeof x === 'function' ? x(c) : x; };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what gets them up.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${{ used: 'something that wants the work done', adapt: 'a change that does them no harm', sick: 'an illness', ship: 'the ship' }[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. */
const nm = (s, role, pid) => { const p = P(s, role); return p && p.id !== pid ? p.name : LF.seatWord(s, role); };
const crew = (s, pid) => { const o = {}; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['q', 'quartermaster']]) { o[k] = nm(s, role, pid); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  return o; };
const who = (p, none, first) => p ? { pid: p.id, name: p.name, first: p.first, Name: p.name, seat: p.role ? p.seat : null } : { pid: null, name: none, first, Name: cap(none), seat: null };
const sour = (s, c, v, txt) => { const p = c.pid && byPid(s, c.pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
/* Deaths this thread caused, kept so that what it costs can be measured. Sleepers die out of t.n. */
function die(s, t, n, awake) { const b = s.pop; LF.deaths(s, Math.max(0, n)); const d = b - s.pop; t.toll += d; if (!awake) t.n = Math.max(0, t.n - d); return d; }
const share = (s, t) => { const f = t.n / Math.max(1, s.pop); return f < 0.2 ? 'a fifth' : f < 0.29 ? 'a quarter' : f < 0.42 ? 'a third' : 'half'; };
const free = t => !t.lock && !t.awake && !t.under;   // nothing is keeping the night shift from its benches

function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^sd\./.test(e.id)); s.sched.push({ id: 'sd.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
/* The last night (sd.whole), by what it was and what was done. how: let, hold, wake, raze. Returns what the card says. */
function lastNight(s, t, how, unseen) {
  const k = t.truth.is, n = t.n, up = t.frame >= 40, few = clamp(Math.round(n * 0.08), 1, 4); t.did.last = unseen ? 'unseen' : how; let d = 0;
  const hurt = how === 'hold' ? die(s, t, LF.sri(s, 1, 2)) : how === 'wake' ? die(s, t, few) : how === 'raze' ? die(s, t, 1) : 0;
  if (k === 'used') {
    if (how === 'let' && up) { t.took = Math.min(t.n, Math.max(0, s.pop - 9)); s.pop -= t.took; t.toll += t.took; t.n = 0; s.morale = clamp(s.morale - 6, 0, 100);
      LF.emit(s, 'grief', SRC, 55, 300, 'the night shift walked out through the gate and did not come back');
      return finish(s, t, 'taken', `The night shift finished the frame it had been building and walked out through the gate, ${num(t.took)} of them, asleep.`); }
    return finish(s, t, how === 'raze' || (how === 'let' && t.razed) ? 'razed' : 'held', how === 'raze' ? 'The colony pulled the night shift\'s frame down on the night it was to be finished.' : 'The night shift was kept from its frame on the night it was to be finished, and did not get up again.');
  }
  if (k === 'adapt') {
    if (how === 'wake') { LF.emit(s, 'resentment', SRC, 35, 250, 'the night shift was beaten awake for nothing'); return finish(s, t, 'lost', 'The night shift was woken by force, and nobody has worked asleep since.'); }
    t.boon = s.day; if (how === 'let') { s.res.mat += up ? 30 : 10; LF.emit(s, 'hope', SRC, 35, 200, 'the night shift did the colony nothing but good'); }
    else LF.emit(s, 'resentment', SRC, 30, 250, how === 'raze' ? 'the mill tower was pulled down under the people building it' : 'the night shift was roped in the yard for nothing');
    return finish(s, t, 'kept', 'The night shift went on, and the colony stopped being afraid of it.');
  }
  if (k === 'sick') {
    if (how === 'wake') { d = die(s, t, clamp(Math.round(n * 0.06), 0, 3)); t.last = hurt + d; return finish(s, t, 'woken', 'The night shift was woken by force on the night it would not have woken by itself.'); }
    d = die(s, t, clamp(Math.round(t.n * (t.cut ? 0.25 : 0.4)), 2, 16)); t.last = hurt + d; s.morale = clamp(s.morale - 5, 0, 100);
    LF.emit(s, 'grief', SRC, 50, 300, 'the night shift lay down and did not wake');
    return finish(s, t, 'slept', `${Num(hurt + d)} of the night shift lay down on one night and did not wake.`);
  }
  d = how === 'let' ? die(s, t, up ? clamp(Math.round(n * 0.15), 2, 6) : 2) : 0; t.last = hurt + d; drive(s, t);
}
/* ship: nothing done to the sleepers ends it. It runs until somebody reads the plate, and it is paid for until then. */
function drive(s, t) { const d = die(s, t, clamp(Math.round(t.n * 0.1), 2, 5)); t.late = d; s.morale = clamp(s.morale - 3, 0, 100);
  finish(s, t, 'driven', 'The night shift worked on through another season before anyone thought to pull the relay\'s night feed.'); }
/* The relay was pulled (ship), or the last night came while the colony had its hands full with something else. */
function resolve(s, t) { if (t.truth.is === 'ship' && t.silent) return finish(s, t, 'silenced', 'The relay\'s night feed was pulled, and the night shift did not get up again.');
  LF.log(s, 'One night the whole night shift rose in the same minute and crossed the yard in file, toward the frame. The watch stood and let it pass, having no order.', 'bad'); lastNight(s, t, 'let', true); }

/* Once a month while it lasts. */
function month(s, t) {
  const k = t.truth.is, late = ['night', 'bill', 'last'].includes(t.phase), f = t.n / Math.max(1, s.pop);
  // It spreads at the same rate whatever it is, so the number alone says nothing. Hard work and a dark sky hurry it.
  if (!t.awake && !(k === 'sick' && t.lock)) { const top = Math.min(36, Math.round(s.pop * 0.4));
    const up = Math.max(1, Math.round(s.pop * 0.035 * (t.rule ? 1.5 : 1) * (t.lock || t.under ? 0.5 : 1) * (LF.cv(s, 'exhaustion') >= 40 ? 1.3 : 1) * (LF.cv(s, 'dark') >= 40 ? 1.3 : 1)));
    t.n = clamp(t.n + up, 0, Math.max(t.n, top)); }
  t.n = Math.min(t.n, Math.max(0, s.pop - 6));
  // The frame: plate out of the stores, a section a month, wherever it is put up.
  if (t.phase !== 'sign' && free(t) && !t.fguard && s.used['sd.shift'] !== undefined) { const m = Math.min(s.res.mat, 4 + Math.round(t.n / 6)); s.res.mat -= m; t.metal += m; t.frame = clamp(t.frame + (t.razed ? 9 : 14) + (t.fed ? 6 : 0), 0, 100); }
  // Two shifts on one plate.
  if (free(t)) s.res.food = Math.max(0, s.res.food - t.n * 3);
  if (s.pop <= 14) return;
  // What it does to them, by what it is.
  if (k === 'sick' && late && !t.awake) { const p = (0.35 + f) * (t.lock ? 0.7 : 1) * (t.under ? 1.6 : 1); if (LF.srand(s) < p) { const d = die(s, t, 1 + (LF.srand(s) < f ? 1 : 0)); t.gone += d;
    LF.log(s, d > 1 ? `${Num(d)} of the night shift were found at their benches at first light, dead, with the work finished.` : 'One of the night shift was found at the bench at first light, dead, with the work finished.', 'bad'); } }
  else if (k === 'ship' && t.phase !== 'spread' && free(t) && !t.silent && LF.srand(s) < 0.3 + f * (t.gain ? 1.6 : 1)) { die(s, t, 1); t.gone++;
    LF.log(s, 'One of the night shift was found at the bench at first light, dead, with the work finished.', 'bad'); }
  else if (k === 'used' && late && free(t) && t.frame >= 30 && LF.srand(s) < 0.25) { die(s, t, 1); t.gone++; LF.log(s, 'One of the night shift fell from the top of the frame in the night. The others worked round the body until first light.', 'bad'); }
  else if (k === 'adapt' && late && free(t) && LF.srand(s) < 0.06) { die(s, t, 1); t.gone++; LF.log(s, 'One of the night shift fell from the top of the frame in the night. The others worked round the body until first light.', 'bad'); }
  if (k === 'ship' && t.ownNight && t.own && t.own.pid && LF.shift) LF.shift(s, t.own.pid, 'body', -4);
  if (k === 'sick' && t.ownNight && t.own && t.own.pid && late && LF.shift) LF.shift(s, t.own.pid, 'body', -5);
  // What the measures do to them, whatever it is.
  if (t.guard && !t.awake && LF.srand(s) < (t.gentle ? 0.12 : 0.4)) { if (!t.hurt) { t.hurt = s.day; LF.cue(s, 'sd.woken', 0, 3); } else if (LF.srand(s) < 0.4) { die(s, t, 1); LF.log(s, 'A sleeper shaken awake at a running machine went into it. The watch had its orders.', 'bad'); } }
  if (t.lock && k !== 'adapt' && k !== 'sick' && LF.srand(s) < 0.3) { die(s, t, 1); LF.log(s, t.strap ? 'One of the night shift pulled against the straps until something inside gave, and was dead by the bell.' : 'One of the night shift was crushed against the barred door by the others pushing behind.', 'bad'); }
  if (t.fguard && LF.srand(s) < 0.3) { die(s, t, 1); LF.log(s, 'One of the sleepers the watch put on the ground at the frame did not get up from it.', 'bad'); }
  if (t.under && LF.srand(s) < 0.35) { die(s, t, 1); LF.log(s, 'One of the night shift did not come up from the clinic\'s needle.', 'bad'); }
  if (t.half && k !== 'adapt' && LF.srand(s) < 0.3) { die(s, t, 1); LF.log(s, 'One of the night shift, on half a plate and two shifts, did not get up for either.', 'bad'); }
  if (t.awake) { if (LF.srand(s) < 0.7) { die(s, t, 1 + (LF.srand(s) < 0.4 ? 1 : 0), true); LF.log(s, LF.spick(s, ['A heart stopped at the evening meal, in the middle of the wakers being handed round.', 'A hauler who had not slept since the order walked off the top of the water tower.', 'Somebody on the wakers ran the plate cutter over a workmate and did not notice until told.']), 'bad'); }
    for (const p of LF.seated ? LF.seated(s) : []) if (LF.shift && !p.away) LF.shift(s, p.id, 'body', -3); }
}

LF.thread({ id: ID, name: 'The Night Shift', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'The last pages are a roster for a night shift, in a hand that never wavers. Across the final sheet someone has written, awake and badly: none of us drew this.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase !== 'latent' ? 'the night shift' : null,
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => t.phase === 'sign' ? 'Why has nobody dreamed since landfall?' : 'What gets the night shift up?',
  chap: {
    taken: t => `Something used the colony's sleepers to build a frame nobody had drawn, and when it was done ${num(t.took || 0)} of them walked out to it.`,
    razed: t => 'Something used the colony\'s sleepers to build a frame nobody had drawn, and the colony pulled it down.',
    held: t => 'Something used the colony\'s sleepers to build a frame nobody had drawn, and on the last night the colony kept them from it.',
    kept: t => 'People here stopped dreaming and worked in their sleep, rested, and it did them no harm. The colony let it be.',
    lost: t => 'People here had stopped dreaming and worked in their sleep, rested. The colony woke them by force, and nobody has worked asleep since.',
    slept: t => `It was a sickness that ended in a sleep nobody came up from. ${Num(Math.max(1, (t.gone || 0) + (t.last || 0)))} died of it.`,
    woken: t => 'It was a sickness that ended in a sleep nobody came up from, and the colony kept its people awake through it.',
    silenced: t => 'The ship had been working the colony in its sleep, on a tone. The relay\'s night feed was pulled, and it stopped.',
    driven: t => 'The ship had been working the colony in its sleep, on a tone, and it went on until somebody read the drawing.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, n: 0, frame: 0, metal: 0, toll: 0, gone: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at && s.pop >= 30) { t.n = 1; LF.phase(s, ID, 'sign'); s.signs.push({ id: 'sleepwalkers', d: s.day, src: SRC }); LF.cue(s, 'sd.dreams', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); } };
    if (t.truth.is === 'ship' && t.silent && s.day - t.silent >= 22) return resolve(s, t);
    if (t.awake && s.day - t.awake >= (t.stock ? 80 : 50)) {   // the dispensary is empty, and everyone goes down at once
      t.awake = 0; t.did.awake = 'done'; t.slept = s.day;
      if (t.truth.is === 'sick') { LF.log(s, 'The wakers ran out and the whole colony slept for two days. Nobody got up in the night.', 'good'); return finish(s, t, 'woken', 'The colony was kept awake for two months on the dispensary, and the night shift did not come back.'); }
      t.n = Math.max(2, Math.round(t.n * 0.6)); LF.log(s, 'The wakers ran out and the whole colony slept for two days. On the third night the shops were lit again.', 'bad'); }
    if (t.phase === 'sign' && (since('sd.dreams') >= 12 || age >= 60)) { t.n = Math.max(t.n, clamp(Math.round(s.pop * 0.06), 3, 8)); LF.phase(s, ID, 'spread', 'More of the colony was found working in its sleep, and the work was better than what it did awake.'); LF.cue(s, 'sd.shift', 0, 4); }
    else if (t.phase === 'spread') { if (since('sd.shift') >= 10) once('frame', 'sd.frame'); if (since('sd.frame') >= 8) once('relay', 'sd.relay'); if (since('sd.relay') >= 8 || since('sd.frame') >= 20) once('own', 'sd.own'); if (since('sd.own') >= 8) once('join', 'sd.join');
      if ((since('sd.shift') >= 50 && (since('sd.own') >= 8 || since('sd.shift') >= 75)) || age >= 120) { t.n = Math.max(t.n, clamp(Math.round(s.pop * 0.18), 6, 20)); LF.phase(s, ID, 'night'); jump(s, 'sd.night', 10); s.tension = clamp(s.tension + 8, 0, 100); } }
    else if (t.phase === 'night') { if (since('sd.night') >= 6) { once('relay', 'sd.relay'); once('own', 'sd.own'); if (since('sd.own') >= 8 || t.q.own < s.day - 20) once('join', 'sd.join'); }
      if (since('sd.night') >= 28 || age >= 60) { LF.phase(s, ID, 'bill'); if (t.lock || t.awake) jump(s, 'sd.doors', 15); } }
    else if (t.phase === 'bill' && age >= ((t.lock || t.awake) && since('sd.doors') < 0 ? 40 : 22) && !t.awake) { LF.phase(s, ID, 'last'); jump(s, 'sd.whole', 20); }
    else if (t.phase === 'bill' && age >= 90) { LF.phase(s, ID, 'last'); jump(s, 'sd.whole', 20); }
    else if (t.phase === 'last') { if (age >= 100) return resolve(s, t); if (s.day % 10 === 0 && age >= 20) { s.sched = s.sched.filter(e => e.id !== 'sd.whole'); jump(s, 'sd.whole', 30); } }
    if (s.day % 10 === 0 && t.phase !== 'sign') month(s, t);
    if (s.day % 5 === 0) { const late = ['night', 'bill', 'last'].includes(t.phase), calm = (t.sure ? 10 : 0) + (t.lock || t.under ? 8 : 0) + (t.awake ? 12 : 0);
      if (!late) LF.emit(s, 'unexplained', SRC, 35, 8, 'people get up at night and do their jobs asleep, better than awake');
      if (late) LF.emit(s, 'fear', SRC, 36 + (t.n / Math.max(1, s.pop) > 0.3 ? 8 : 0) - calm, 8, `${share(s, t)} of the colony gets up at night and works with its eyes shut`);
      if (t.awake) LF.emit(s, 'exhaustion', SRC, 60, 8, 'nobody in the colony has been allowed to sleep');
      else if (t.guard) LF.emit(s, 'exhaustion', SRC, 30, 8, 'the watch is up all night walking sleepers back to bed');
      if (t.lock) LF.emit(s, 'confinement', SRC, 35, 8, 'the night shift is locked in after lights-out');
      if (t.use || t.rule) LF.emit(s, 'resentment', SRC, 28, 8, 'the day crews are measured against people who work asleep');
      if (t.split) LF.emit(s, 'schism', SRC, 35, 8, 'half the colony lives by night and never sees the other half'); }
  },
  /* While it runs free it pays. Fear, and every measure against it, are paid for in work. */
  press: (s, t, P) => { if (t.boon && s.day - t.boon < 400) P.labor += 0.04;
    if (t.end || t.phase === 'latent' || t.phase === 'sign') return;
    const f = t.n / Math.max(1, s.pop), k = t.truth.is, late = t.phase !== 'spread';
    if (free(t)) P.labor += f * (t.use || t.split ? 0.22 : 0.12) * (k === 'ship' ? 0.3 : k === 'sick' && late ? 0.5 : 1);
    P.labor -= (late ? 0.03 : 0) + (t.guard ? (t.gentle ? 0.035 : 0.025) : 0) + (t.lock ? 0.03 + f * 0.1 : 0) + (t.awake ? 0.1 : 0) + (t.under ? f * 0.25 : 0) + (t.fguard ? 0.015 : 0) + (t.silent ? 0.01 : 0);
    if (late) P.morale -= t.sure ? 0.008 : 0.015; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* ======================= SIGN ======================= */
B('sign', { id: 'sd.dreams', tone: 'pressure', title: 'Nobody Dreams',
  setup: s => { const t = T(s), p = anyNamed(s, LF.SEAT_ORDER); t.first = p ? p.id : null; return Object.assign(crew(s), { who: p ? p.name : 'one of the fitters', Who: p ? p.name : 'One of the fitters', whoW: p ? `${p.name}, one of the fitters,` : 'one of the fitters', ev: pickK(s, t) }); },
  text: (s, c) => `${c.D} has been asking at sick call for a month, and has it written down: not one person in the colony can remember a dream since the lander came down. Nobody had noticed until asked.\n\nLast night ${c.w} found ${c.whoW} at the lathe in the machine shop at the fourth hour, eyes shut, turning a pump shaft. ${c.Who} did not answer to a name, finished the shaft, racked the tools and went back to bed. The shaft is truer than anything the shop has made awake.`,
  choices: [
    { label: 'Put six of them in the clinic for a month of watched nights', note: 'Six pairs of hands come off the day\'s work, and the clinic\'s nights go to people who are not sick.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5), If(s => !!(s.cargo && s.cargo.lab), 10, 'The field laboratory')] },
      ok: { text: (s, c) => `${c.D} sits up with them for the month. Two more get up and work at the clinic bench, on nothing, with their eyes shut. ${ev('trace', c.ev, c)}`, fx: (s, c) => ({ food: -30, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The clinic\'s one recorder was built for people coming out of the cold and reads a working sleeper as a fault in the lead. A month of nights ends in a drawer of spoiled trace and six people behind on their own jobs.', fx: s => ({ food: -30, morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Post the watch in the shops to wake anyone who comes in asleep', note: 'The watch loses its nights, and nobody knows what it does to a sleeper to be shaken awake at a running machine.',
      out: { text: (s, c) => `A pair of the watch sits in the machine shop from midnight. They wake three people in the month, by the shoulder. Each comes up swinging, and cannot be got back to sleep before the bell.`, fx: s => ({ morale: -1, do: s2 => { T(s2).guard = s2.day; } }) } },
    { label: 'Leave the lamps lit and stock on the bench, and take the work', dark: true, note: 'The shop gets its best output from someone who is not asked and will not be told.', info: [['yield', 'Materials'], ['later', 'Whoever gets up']],
      out: { text: (s, c) => `Bar stock is left by the lathe every evening with a drawing weighted on top. Every morning the parts are in the rack, in tolerance. ${c.Who} is told the day shift has got better, and says it is about time.`,
        fx: s => ({ mat: 14, stain: ['sd_took', 1], do: s2 => { const t = T(s2); t.use = s2.day; t.did.took = true; } }) } },
    { label: (s, c) => `Have ${c.who} strapped to the bunk at lights-out until it stops`, dark: true, note: 'A colonist who has done nothing is tied down every night, and the shops are told the matter is closed.', info: [['yield', 'Morale'], ['danger', 'The one in the straps']],
      out: { text: (s, c) => `Two cargo straps go over the blanket at lights-out, with a knot behind the frame. ${c.Who} lies under them and makes turning motions with both hands until first light. The pod is told it was sleepwalking and has been seen to. Before the month is out a second bunk is empty at the fourth hour.`,
        fx: s => ({ morale: 2, tension: -4, stain: ['sd_strap', 1], do: s2 => { const t = T(s2); t.did.strap1 = true; learn(s2, t, 4); } }) } },
  ] });

/* ======================= SPREAD ======================= */
B('spread', { id: 'sd.shift', tone: 'pressure', title: 'Better Asleep',
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: t.n, ev: pickK(s, t), guard: !!t.guard }); },
  text: (s, c) => `There are ${num(c.n)} of them now. Some time after midnight they get up with their eyes shut, go to their own benches and do their own jobs until first light. None of them remembers it, and all of them wake rested.\n\n${c.E} has a night's work laid out beside a day's.\n\n[[engineer]] "Those are the best welds I've seen since the Huntsville yard, and the one who laid them can't run a straight bead awake to save their life. Go on, you explain that to me, because I can't."\n\nThe day crews have a name for it: the night shift. Some have moved their bedding out of the pods where it sleeps.`,
  choices: [
    { label: 'Have engineering go through a month of night work, piece by piece', note: 'The shops run without their chief for the month, and the day crews watch their own work being graded against it.', test: { base: 50, mods: [R('engineer', 10), R('quartermaster', 5)] },
      ok: { text: (s, c) => `Every part is gauged and every weld is cut and etched. ${ev('work', c.ev, c)}`, fx: (s, c) => ({ food: -30, do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: 'The gauging takes the month and settles one thing, which everyone knew: the night work is better. The day crews have taken to leaving the shop when the checked parts are laid out.', fx: s => ({ food: -30, morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Put the night shift on the roster, with a work list left on each bench', dark: true, note: 'The backlog is cleared by people who never agreed to a second shift and do not know they are working one.', info: [['yield', 'Materials'], ['danger', 'The night shift']],
      out: { text: (s, c) => `A list goes on each bench at dusk and is ticked off by morning, in handwriting neater than its owner's. The pump spares are caught up in a month. The night shift draws one ration for two shifts, and wonders aloud why it is always hungry.`,
        fx: s => ({ mat: 22, stain: ['sd_roster', 2], do: s2 => { const t = T(s2); t.use = s2.day; t.did.roster = true; } }) } },
    { label: 'Bar their pods from outside at lights-out', dark: true, show: s => !T(s).lock, note: 'Everyone who sleeps in those pods is locked in on account of a few, and nobody knows what a sleeper does at a door that will not open.', info: [['yield', 'Quiet shops'], ['danger', 'Everyone behind the bar']],
      out: { text: (s, c) => `Bars go on three pod doors. The first night there is knocking from inside from midnight until first light, slow and all in time. In the morning the people who did it come out rested, with skinned knuckles, and ask who was making the noise.`,
        fx: s => ({ morale: 1, tension: -6, stain: ['sd_bar', 1], do: s2 => { const t = T(s2); t.lock = s2.day; t.did.bar = true; } }) } },
    { label: 'Have the watch walk the shops and lead each one back to bed', show: (s, c) => !c.guard, note: 'It takes the watch\'s nights, and the ones led back get up again within the hour and are no use by day.',
      out: { text: 'The watch leads them back by the elbow, one at a time. Most get up again as soon as the door shuts. By the end of the month the watch is asleep on its feet at the morning muster, and the night shift has started to yawn at its day work.', fx: s => ({ morale: -1, do: s2 => { T(s2).guard = s2.day; } }) } },
  ] });

B(['spread', 'night'], { id: 'sd.frame', view: 'colony', tone: 'pressure', title: 'Behind the Workshop',
  setup: s => { const t = T(s); return Object.assign(crew(s), { short: Math.max(20, Math.round(t.metal / 10) * 10), ev: pickK(s, t), ev2: pickK(s, t, 0.15) }); },
  text: (s, c) => `Behind the workshop there is a thing that is on nobody's build list: a frame of hull ribs and salvaged pipe, already higher than the mess roof, bolted and braced. The night shift has been putting it up between its other jobs. Awake, not one of them can say what it is.\n\n${c.Sc} has walked round it twice.\n\n[[xenobio]] "Nobody drew this, nobody, and the joints are right, every brace is where I'd have put it if I'd had a year to think, so somebody knew exactly what they were making, and who, who knows how to do that in their sleep?"\n\nThe racks hold ${num(c.short)} loads less plate and pipe than the stores book says. The night shift has been taking it.`,
  choices: [
    { label: 'Have it measured and drawn before anyone touches it', note: 'The survey bench does nothing else for the month, and the frame goes on rising while it is drawn.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `It takes forty sheets. ${ev('frame', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: 'It takes forty sheets, and the frame has grown by a section before the last is inked. The drawing shows how it is put together. It does not show what for.', fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 7) }) } },
    { label: 'Pull it down and put the metal back in stores', note: 'The stores get their plate back. The people who built it will find the ground bare tonight, and nobody can tell them why.', info: [['yield', 'Materials'], ['danger', 'Whatever it was for']],
      out: { text: 'The day crews have it down by dusk and the plate back on the racks. That night the night shift stands on the bare ground behind the shed for an hour, hands moving. Before the month is out the footings have been dug again on the same spot, in the dark, and the first ribs are up.',
        fx: s => ({ mat: Math.round(T(s).metal * 0.7), morale: -1, do: s2 => { const t = T(s2); t.frame = 0; t.metal = 0; t.razed = s2.day; t.did.razed = true; } }) } },
    { label: 'Issue the night shift the plate it wants, and see what it makes', dark: true, cost: { mat: 15 }, note: 'You find out what it is by having it finished, out of the colony\'s stores, by people who cannot be asked.', info: [['yield', 'What it is'], ['danger', 'The night shift']],
      out: { text: (s, c) => `The plate is stacked beside the frame at dusk and is in it by morning. With the top bracing on, there is enough to read. ${ev('frame', c.ev2, c)}`,
        fx: (s, c) => ({ stain: ['sd_fed', 1], do: s2 => { const t = T(s2); t.fed = s2.day; t.did.fed = true; t.frame = clamp(t.frame + 20, 0, 100); learn(s2, t, 22, c.ev2); } }) } },
    { label: 'Ring it with the watch at night, to turn back anyone who comes', dark: true, note: 'The watch will be laying hands and sticks on people who are asleep and do not stop when told.', info: [['yield', 'Materials'], ['later', 'Anyone who walks into the line']],
      out: { text: (s, c) => `${c.W} puts ten round it from midnight. The sleepers come anyway, walk into the line and go on walking, and have to be put on the ground. By the end of the month the clinic has two broken arms and a cracked skull, and the frame is no higher. The stores book balances.`,
        fx: s => ({ mat: 8, tension: -4, stain: ['sd_line', 2], do: s2 => { const t = T(s2); t.fguard = s2.day; t.did.line = true; } }) } },
  ] });

/* An officer is on the night shift, and is better at the job asleep. */
const OWN = {
  engineer: ['at the lathe with the guards off, cutting gear blanks', `"Eleven blanks. All of 'em true. I haven't cut a true blank awake since the crossing. So no, I'm not that keen to be cured."`],
  doctor: ['in the clinic, eyes shut, closing a field hand\'s leg wound', `"I closed that leg in my sleep, and it's the neatest work I've done here. So you tell me which of me you want on the ward. Go on."`],
  scientist: ['at the survey bench, plotting a month of soundings onto the map', `"I plotted the whole ridge! Asleep! And it's right, I checked it, every line. Do you see what that means? Because I don't, I really don't."`],
  crew: ['in the stores, weighing out the seed issue and entering it in the book', `"Book's right. Every line. My hand, and I wasn't there for it. I don't hold with signing for work I didn't do."`],
  none: ['at the end bench in the machine shop, filing a bearing seat', `"It's good work. I'd know. I just wasn't there when I did it."`],
};
B(['spread', 'night', 'bill'], { id: 'sd.own', tone: 'pressure', title: 'Hands Working',
  setup: s => { const t = T(s), pool = ['engineer', 'physician', 'xenobio', 'quartermaster'].map(r => P(s, r)).filter(Boolean);
    const p = pool.length ? LF.spick(s, pool) : anyNamed(s, LF.SEAT_ORDER), c = who(p, 'the night foreman', 'the foreman'); t.own = { pid: c.pid, name: c.name, Name: c.Name, first: c.first };
    const o = OWN[c.seat] || OWN.none; return Object.assign(c, crew(s, c.pid), { doing: o[0], says: o[1], ev: pickK(s, t), lean: lean(t) }); },
  text: (s, c) => `${c.W} found ${c.seat || !c.pid ? c.name : `${c.name}, one of the machine shop hands,`} at the fourth hour ${c.doing}. ${c.Name} did not look up. In the morning ${c.first} went over the night's work awake and found nothing to correct.\n\n[[${c.pid || 'x42'}]] ${c.says}\n\n${c.Name} wants to know whether to go on signing for it. ${c.lean}`,
  choices: [
    { label: (s, c) => `Have the clinic keep ${c.first} for the month and test everything`, note: (s, c) => `${c.Name} is a patient for the month, and the work is left to a deputy.`, about: true, test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.D} takes blood, runs the reflexes and sits up through the nights. ${ev('body', c.ev, c)}`, fx: (s, c) => ({ off: [['ctx', 'body', -3]], do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `In a clinic cot, with a lamp on and somebody watching, ${c.name} sleeps the month through like anyone else. On the first night back in the pod the hands are working again.`, fx: s => ({ morale: -1, off: [['ctx', 'mind', -5]], do: s2 => learn(s2, T(s2), 6) }) } },
    { label: (s, c) => `Tell ${c.first} to work nights, and to sign for them`, note: (s, c) => `${c.seat ? 'The department gets its best work from an officer' : 'The shop gets its best work from a hand'} who is not there when it is done, and ${c.first} carries whatever this is for as long as it runs.`, info: (s, c) => [['yield', 'A department at its best'], ['danger', cap(c.first)]],
      out: { text: (s, c) => `${c.Name} signs the night's work each morning after reading it through. The department has not run so well since landfall. ${c.Name} has stopped eating with the day crews.`,
        fx: s => ({ off: [['ctx', 'native', 6], ['ctx', 'mind', -6]], do: s2 => { const t = T(s2); t.ownNight = s2.day; t.did.ownNight = true; } }) } },
    { label: (s, c) => `Have the watch sit by ${c.first}'s bunk and wake ${c.first} at every stir`, dark: true, note: (s, c) => `The hall sees that ${c.seat ? 'rank is not' : 'nobody is'} left on the night shift, and ${c.first} does the job on two hours of broken sleep for as long as you say.`, info: (s, c) => [['yield', 'Morale'], ['danger', cap(c.first)]],
      out: { text: (s, c) => `One of the watch sits on a stool by the bunk with a cup of water. ${c.Name} is woken eleven times the first night and does not complain. By the end of the month the day's work has mistakes in it that ${c.first} has not made since training.`,
        fx: (s, c) => ({ morale: 2, tension: -5, stain: ['sd_vigil', 1], off: [['ctx', 'mind', -12], ['ctx', 'body', -5]], do: s2 => { T(s2).did.vigil = true; sour(s2, c, 15, 'you had woken every hour of every night for a month'); } }) } },
    { label: (s, c) => `Keep it between the two of you, and enter the night work as day work`, dark: true, note: (s, c) => c.seat ? 'The colony goes on taking orders from an officer who was asleep when they were written, and is not told.' : 'The colony goes on using work done by someone who was asleep when it was done, and is not told.', info: [['yield', 'Morale']],
      out: { text: (s, c) => `The night's work is entered under the day's date. ${c.Name} does not like it and does it. The day crews say the department has turned a corner. ${c.W} knows, and has started counting who else does.`,
        fx: s => ({ morale: 3, stain: ['sd_signed', 1], off: [['ctx', 'native', 4], ['ctx', 'mind', -5]], do: s2 => { const t = T(s2); t.ownNight = s2.day; t.did.signed = true; LF.emit(s2, 'suspicion', 'sd.signed', 25, 150, 'an officer\'s night work was entered as day work'); } }) } },
  ] });

B(['spread', 'night', 'bill'], { id: 'sd.join', tone: 'pressure', title: 'Asking for Nights',
  setup: s => { const t = T(s), p = anyNamed(s, LF.SEAT_ORDER.concat([t.own && t.own.pid, t.first].filter(Boolean))); return Object.assign(who(p, 'a rigger from the day crew', 'the rigger'), crew(s), { m: clamp(Math.round(s.pop * 0.1), 4, 10), ev: pickK(s, t), lean: lean(t) }); },
  text: (s, c) => `${c.pid ? `${c.Name}, a rigger on the day crew,` : c.Name} has asked, in front of the day crew, to be put on the night shift, and has moved bunks to the middle of the pod where it started.\n\n[[${c.pid || 'x25'}]] "They don't lie awake. They don't think about the ship. They get up rested and their work's twice mine. You tell me why I'd say no to that."\n\nHalf the day crew is waiting to hear the answer. ${c.lean}`,
  choices: [
    { label: (s, c) => `Let ${c.first} try, with the clinic sitting up to see it happen`, about: true, note: (s, c) => `${c.Name} is the clinic's test case, by choice, for whatever this does to a person, and the day crew will take a yes as leave to follow.`, test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.D} sits by the bunk with a lamp and a notebook. ${ev('watch', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 24, c.ev); t.n++; } }) },
      bad: { text: (s, c) => `${c.Name} lies awake six nights, trying, with the clinic looking on. Nothing comes. On the seventh the clinic goes home, and by morning there are two more of the day crew bunking in that pod.`, fx: s => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 6); t.n += 2; } }) } },
    { label: 'Make it the rule: every bench hand bunks in the night pods', dark: true, note: (s, c) => `The shops get twice their good work, and ${num(c.m)} more people are put in the way of something nobody understands, by order.`, info: [['yield', 'Materials'], ['danger', 'Everyone moved']],
      out: { text: (s, c) => `Bedding is carried across in one evening. Within the month most of the bench hands are getting up at midnight. The workshop runs both shifts, and the racks are full for the first time. The ones it has not taken lie awake and listen to the others go out.`,
        fx: (s, c) => ({ mat: 26, stain: ['sd_rule', 2], do: s2 => { const t = T(s2); t.rule = s2.day; t.use = s2.day; t.did.rule = c.m; t.n = Math.min(t.n + c.m, Math.max(t.n, s2.pop - 8)); } }) } },
    { label: (s, c) => `Refuse, and move ${c.first} to the far pod`, note: 'The day crews are told that the best work in the colony is something they are forbidden.',
      out: { text: (s, c) => `${c.Name} carries the bedding back across the yard with the day crew looking on. Nobody asks again out loud. The far pod takes to going to bed early with the lamps out, and its people do not thank you for sending the watch round to count them.`,
        fx: s => ({ morale: -2, do: s2 => { LF.emit(s2, 'resentment', 'sd.join', 30, 150, 'the day crews were forbidden the night shift'); } }) } },
    { label: 'Refuse, and put the night shift on half a plate until nobody envies it', dark: true, note: 'People who have done nothing awake go hungry so that nobody else will want to be them.', info: [['yield', 'Food'], ['danger', 'The night shift']],
      out: { text: (s, c) => `The night shift's cards are cut in two at the galley hatch. Nobody asks to join after that. The night's work stays as good as it was, done by people who are getting thin, and ${c.name} goes back to the day crew without a word.`,
        fx: s => ({ food: 40, tension: -5, stain: ['sd_half', 2], do: s2 => { const t = T(s2); t.half = s2.day; t.did.half = true; } }) } },
  ] });

/* The one card that looks up. */
B(['spread', 'night', 'bill'], { id: 'sd.relay', view: 'colony', tone: 'pressure', title: 'Warm Every Night',
  when: (s, t) => !t.silent,
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), lean: lean(t) }); },
  text: (s, c) => `${c.E} has been through the power log. The relay set by the lander has drawn current every night since landfall, on the ship's housekeeping band, where nothing ought to pass but a clock tick.\n\n[[engineer]] "She's only meant to tick over, and she's been running warm every night since we came down, like a dog that's heard something you haven't. Either something's talking to her or she's talking to something."\n\nQueried on that band, the ${LF.SHIP} sends back the tick and nothing else. ${c.lean}`,
  choices: [
    { label: 'Log the night shift against the ship\'s passes for a month', note: 'Engineering and the watch both lose their nights to a stopwatch and a bunk count.', test: { base: 50, mods: [R('engineer', 10), R('pilot', 5)] },
      ok: { text: (s, c) => `Every rising and setting is timed against the first sleeper out of a bunk and the last one back. ${ev('pass', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: 'Cloud takes eleven of the passes, and the bunk count is kept by people who nod off over it. The month\'s log can be read either way, and is, loudly.', fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Pull the relay\'s night feed, and do without the ship after dark', cost: { parts: 4 }, note: 'Anyone still aboard, and anything the ship would have warned you of at night, is out of reach until morning.', info: [['danger', 'Whoever needs the ship at night']],
      out: { text: (s, c) => `${c.E} takes the night board out of the set and puts it in a drawer. After dusk the ship's band is static. The pilot's desk does not like sitting through the night passes deaf, and says so every morning.`,
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.silent = s2.day; t.did.silent = true; } }) } },
    { label: 'Turn the set\'s gain up for a month, and see what the night shift does', dark: true, note: 'If the set is what gets them up, you will have doubled it on people who cannot be asked.', info: [['yield', 'What it shows'], ['danger', 'The night shift']],
      out: { text: (s, c) => is(s, 'ship') ? `${c.E} runs the set at four times its rating. The night shift is at the benches before the pod lamps are out and works through the bell. The shops have never turned out so much. Three of them are carried off their benches to the clinic in the month, and one of the three dies there.`
          : `${c.E} runs the set at four times its rating, and it spoils the day's voice traffic with the ship for the month. The night shift keeps the hours it kept before, to the minute.`,
        fx: s => is(s, 'ship') ? { mat: 24, pop: -1, stain: ['sd_gain', 2], do: s2 => { const t = T(s2); t.toll++; t.n = Math.max(0, t.n - 1); t.gain = s2.day; t.did.gain = true; learn(s2, t, 38, 'ship'); } }
          : { morale: -1, stain: ['sd_gain', 1], do: s2 => { const t = T(s2); t.did.gain = true; learn(s2, t, 14); t.ev.ship = Math.max(0, (t.ev.ship || 0) - 1); } } } },
    { label: 'Tell the hall it was the ship\'s doing, and that it has been shut off', dark: true, note: 'The waking sleep on an answer you do not have, beside people who will get up at midnight all the same.', info: [['yield', 'Morale']],
      out: { text: 'It is read out at the evening meal as a finding: a fault in the ship\'s sleep tutors, traced and shut off. The mess breathes out. The night shift gets up at midnight as before, and for a month the waking take it for the tail of something that has ended.',
        fx: s => ({ morale: 4, stain: ['false_certainty', 1], do: s2 => { const t = T(s2); t.sure = s2.day; t.did.sure = true; LF.ease(s2, 'fear', 'sd.sure', 15, 120); } }) } },
  ] });

/* The bill for waking them. */
B(['spread', 'night', 'bill'], { id: 'sd.woken', tone: 'crisis', title: 'Woken at the Press',
  when: (s, t) => !!t.hurt && !!t.guard,
  setup: s => crew(s),
  text: (s, c) => `One of the watch shook a sleeper awake at the drill press last night, as ordered. The sleeper came up screaming with the bit still turning, and has lost most of a hand. The watchman is sitting outside your door.\n\n${c.W} is standing.\n\n[[security]] "You wanted them woken, and that's what woken looks like, half of them swing at you and the other half drop, so what's my lot meant to do now, apologise to them one at a time?"`,
  choices: [
    { label: 'Stop the waking, and let them work', note: 'The watch gets its nights back, and whatever the night shift is goes on with nobody standing over it.',
      out: { text: 'The watch is stood down from the shops. The night shift works unwatched, and the racks fill. The one with the hand is back at the press inside the month, asleep, working it one-handed.', fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.guard = 0; t.did.stopwake = true; } }) } },
    { label: 'Lead them and never shake them: two of the clinic\'s people in the shops every night', note: 'The clinic runs short by day for as long as this lasts, and the sick wait for it.',
      out: { text: (s, c) => `${c.D} lends two orderlies who know how to turn a sleeper without rousing one. It is slow, and it mostly works. Sick call starts an hour late from then on.`, fx: s => ({ morale: -1, do: s2 => { T(s2).gentle = s2.day; } }) } },
    { label: 'Strap every one of them to a bunk at lights-out', dark: true, note: 'The shops are safe, and people who have done nothing are tied down every night by their own bunkmates.', info: [['yield', 'Quiet shops'], ['danger', 'The night shift']],
      out: { text: 'Cargo straps are issued by the pod, two a bunk, and the bunkmates are shown the knot. At midnight the pods creak with people pulling against webbing in their sleep. In the morning they have welts across the chest and no idea why.',
        fx: s => ({ tension: -6, morale: 1, stain: ['sd_strap', 2], do: s2 => { const t = T(s2); t.guard = 0; t.lock = s2.day; t.strap = s2.day; t.did.strap = true; } }) } },
    { label: 'Charge the watchman with the injury, in front of the hall', dark: true, note: 'The hall gets somebody to blame, and it is the one who did what you ordered.', info: [['yield', 'Morale'], ['danger', 'The watchman']],
      out: { text: (s, c) => `The charge is read at the evening meal, and the watchman stands for it without a word. ${c.W} does not look at you while it is read. The waking order stays in force, and the watch carries it out from then on at arm's length, with a broom handle.`,
        fx: s => ({ morale: 2, tension: -5, stain: ['sd_blamed', 1], do: s2 => { T(s2).did.blamed = true; const p = P(s2, 'security'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 12, 0, 100); } }) } },
  ] });

/* ======================= NIGHT: the hall wants it ended ======================= */
B('night', { id: 'sd.night', tone: 'crisis', title: 'The Fourth Hour',
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: t.n, share: share(s, t), put: clamp(Math.round(s.pop * 0.08), 3, 10), lean: lean(t) }); },
  text: (s, c) => `${Num(c.n)} of the colony got up last night. At the fourth hour every one of them stopped work in the same second, stood for a minute with their faces turned the same way, and went on. ${c.W} saw it from the shop door.\n\n[[security]] "${cap(c.share)} of your colony's up and about with its eyes shut, and now it does drill, which is just what I needed, so what d'you want from my lot, exactly, a salute?"\n\nThe waking are in the mess hall and want it ended. ${c.lean}`,
  choices: [
    { label: 'Nobody sleeps: the whole colony on the dispensary\'s wakers until it passes', dark: true, note: 'Nothing can get up people who never lie down. The clinic has about two months of wakers, and some hearts will give out before the tablets do.', info: [['yield', 'No night shift'], ['danger', 'Weak hearts']],
      out: { text: (s, c) => `Wakers go out at every meal, two a head, and the pods are kept lit. The shops are empty at midnight for the first time in months. Before the first month is out people are talking to the walls, and a cook is found dead on the galley floor with a full pan still on the heat.`,
        fx: s => ({ pop: -1, morale: -3, stain: ['sd_awake', 2], do: s2 => { const t = T(s2); t.awake = s2.day; t.did.awake = true; t.toll++; }, chron: 'The whole colony was kept awake on the dispensary so that nobody could get up asleep.' }) } },
    { label: 'The night shift sleeps in the long store, behind a bar', dark: true, show: s => !T(s).lock, note: (s, c) => `${Num(c.n)} people are locked up every night for something they do asleep, and nobody knows what they will do at the door.`, info: [['yield', 'Quiet shops'], ['danger', 'Everyone behind the bar']],
      out: { text: (s, c) => `They carry their own bedding across at dusk and the bar goes down behind them. At midnight they come to the door together and push, and they push until first light. In the morning eleven of them have hands they cannot close, and none of them knows how.`,
        fx: s => ({ morale: 1, tension: -8, stain: ['sd_bar', 2], do: s2 => { const t = T(s2); t.lock = s2.day; t.did.store = true; } }) } },
    { label: (s, c) => `Put the ${num(c.put)} who do it most out through the gate`, dark: true, note: (s, c) => `The hall gets something done tonight, to ${num(c.put)} people whose offence is the best work in the colony.`, info: [['yield', 'Morale'], ['danger', 'The ones put out']],
      out: { text: (s, c) => `${Num(c.put)} are walked to the gate at dusk with a blanket each, wide awake, asking what they have done. Two are back at their benches at the fourth hour all the same. They walked in asleep past a gate watch that could not bring itself to stop them, and are put out again at first light.`,
        fx: (s, c) => ({ leave: c.put, morale: 3, tension: -8, stain: ['sd_putout', 3], do: s2 => { const t = T(s2); t.did.putout = c.put; t.toll += c.put; t.n = Math.max(2, t.n - c.put); t.cut = s2.day; t.frame = Math.max(0, t.frame - 25); },
          chron: `${Num(c.put)} colonists were put out through the gate for working in their sleep.` }) } },
    { label: 'Give them the night: they sleep by day, and the shops are theirs after dark', note: 'Families are divided by the clock, and the waking half carries every decision for people it never sees awake.', info: [['yield', 'Work'], ['later', 'What it is left to become']],
      out: { text: 'The rota is redrawn in two colours. The night shift goes to bed at the morning bell and gets up at midnight, eyes shut, to lit shops and stock laid out. Children are walked across the yard at dusk to look at a sleeping parent. The mess serves two suppers, and nobody eats at both.',
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.split = s2.day; t.did.split = true; } }) } },
  ] });

/* ======================= BILL: what holding it off costs ======================= */
B(['bill', 'night'], { id: 'sd.doors', tone: 'crisis', title: 'Hands',
  when: (s, t) => !!(t.lock || t.awake),
  setup: s => { const t = T(s); return Object.assign(crew(s), { awake: !!t.awake, strap: !!t.strap, n: t.n }); },
  text: (s, c) => (c.awake ? `Nobody has slept since the order. People walk into door frames. A hauler talked a whole shift through with a shipmate who died on the crossing, and two more hearts have stopped. ${c.D} has the dispensary book open.\n\n[[physician]] "Look at the shelf, that's all that's left, and when it's gone they all go down at once, every one of them, for as long as their bodies need. The hauler who talked a whole shift through with a dead shipmate will be the first one down, and whatever this is gets the lot of them in one night."`
    : c.strap ? `Every night the night shift pulls against the straps from midnight until first light. ${c.D} is dressing welts and wrenched shoulders at every sick call.\n\n[[physician]] "Come and look at the welts on them, go on, and then you tell me how many more nights you want."\n\nLast night two of them got a hand free and went to work on the next bunk's knots, eyes shut, without a word.`
    : `Every night the night shift comes to the barred door at midnight and works at it with bare hands until first light. ${c.D} is splinting fingers at every sick call.\n\n[[physician]] "Come and look at their hands, go on, I've splinted every finger in that row, and then you tell me how many more nights you want."\n\nThree nights ago they stopped pushing and started on the hinge pins, as a crew, without a word.`)
    + `\n\n${c.W} does not think it holds another month as it is.`,
  choices: [
    { label: (s, c) => c.awake ? 'End it, and let the colony sleep' : 'Take the bar off, and let them go to their benches', note: 'Everyone who was hurt holding it off was hurt for a delay.',
      out: { text: (s, c) => c.awake ? 'The last wakers go back on the shelf and the lamps are turned down. The colony sleeps for two days. On the third night the shops are lit.' : 'The doors are opened at lights-out. At midnight the night shift files across the yard to the shops with its hands bound up, and takes up where it stopped.',
        fx: s => ({ morale: 1, do: s2 => { const t = T(s2); t.did.gaveup = true; if (t.awake) { t.awake = 0; t.n = Math.max(2, Math.round(t.n * 0.6)); } t.lock = 0; t.strap = 0; } }) } },
    { label: (s, c) => c.awake ? 'Take the wakers the clinic was keeping for surgery' : c.strap ? 'Double the straps, and put the watch in the pods' : 'Strap each of them to a bunk frame behind the bar', dark: true,
      note: (s, c) => c.awake ? 'It buys another month awake, and whoever next comes to the table is cut without them.' : 'It holds, and people who have done nothing spend every night tied down under guard.', info: (s, c) => [['yield', c.awake ? 'Another month' : 'It holds'], ['danger', c.awake ? 'The next on the table' : 'The night shift']],
      out: { text: (s, c) => c.awake ? `${c.D} hands over the surgical stock without a word and writes the date in the book. The colony stays up. A fitter with a crushed foot has it taken off that month by lamplight, awake, on what was left.`
          : 'Webbing goes round every one of them at lights-out, wrist and chest, and a watch pair walks the row. They strain against it all night in time with each other. The door holds. By the end of the month three of them have a shoulder that will not go back.',
        fx: (s, c) => ({ morale: -2, stain: [c.awake ? 'sd_stock' : 'sd_strap', 2], do: s2 => { const t = T(s2); if (t.awake) { t.stock = s2.day; t.did.stock = true; } else { t.strap = s2.day; t.lock = t.lock || s2.day; t.did.strap = true; } } }) } },
    { label: 'Have the clinic put the night shift under, too deep to rise', dark: true, note: 'The dispensary\'s anaesthetic goes into people who are not sick, every night, by needle, and not everyone comes up from that.', info: [['yield', 'Quiet nights'], ['danger', 'The night shift']],
      out: { text: (s, c) => `${c.D} refuses, and then does it, because the other hands on offer are worse. ${Num(c.n)} people are put under at lights-out and lie like the dead until the bell. The shops are dark. One of them is still lying there at noon.`,
        fx: s => ({ pop: -1, tension: -6, stain: ['sd_under', 2], do: s2 => { const t = T(s2); t.toll++; t.n = Math.max(0, t.n - 1); t.under = s2.day; t.awake = 0; t.lock = 0; t.strap = 0; t.did.under = true; const p = P(s2, 'physician'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 15, 0, 100); } }) } },
    { label: 'Hold as you are', note: (s, c) => c.awake ? 'The tablets run out when they run out, and more hearts go first.' : 'The hands get worse, and the door goes when it goes.',
      out: { text: (s, c) => c.awake ? 'The order stands. The count of wakers on the shelf is chalked on the clinic door each morning, and people stop to read it. Another one goes down at the pumps, and is dead before anyone can reach the handle.' : 'The order stands. The clinic runs out of splints and starts cutting them from crate slats. One of the night shift takes a fever in a broken hand and does not last it.',
        fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); t.toll++; t.did.heldon = true; } }) } },
  ] });

/* ======================= LAST: the whole shift ======================= */
B('last', { id: 'sd.whole', view: 'colony', tone: 'crisis', title: 'Every One of Them',
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: t.n, up: t.frame >= 40, razed: !!t.razed, held: !!t.lock, under: !!t.under, lean: lean(t) }); },
  text: (s, c) => `Tonight the whole night shift rose in the same minute, ${num(c.n)} of them, and not one went to a bench. They are crossing the yard in file with their eyes shut, toward ${c.up ? 'the frame' : c.razed ? 'the footings where the frame is going up again' : 'the half-built frame'}.${c.held ? ' The ones you had shut in came through the door to do it.' : c.under ? ' The needle did not keep them down tonight.' : ''} ${c.Q} counted them past.\n\n[[quartermaster]] "All of them in the same minute, and I've never seen a thing like it, not in people and not in anything that grows."\n\nThe waking are at their windows, and ${c.w} has the watch standing to. ${c.lean}`,
  choices: [
    { label: 'Let them go to it, with every waking hand standing by', note: 'Whatever tonight is for, it gets the whole night shift, and you will have watched.', info: [['danger', 'The night shift']],
      out: { text: (s, c) => { const t = T(s), k = t.truth.is, go = 'The waking stand along the shed wall with lamps.';
          return k === 'used' ? (c.up ? `${go} The night shift bolts on the last section in under an hour, and steps back. Then it turns and walks out through the gate, in file, in step. The watch calls names. Nobody turns a head. At first light the tracks go on past where anyone has surveyed, and the frame is humming.`
              : `${go} The night shift works at the footings until first light, well short of done, and wakes there, cold, remembering nothing. The next night nobody gets up, and nobody gets up the night after.`)
            : k === 'adapt' ? `${go} The night shift raises ${c.up ? 'the last section' : 'three sections'} by lamplight without a dropped bolt. ${c.up ? 'At first light there is a mill tower behind the workshop, a year before its turn on the build list.' : 'It is a mill tower, or will be: the one on the build list.'} Then they go back to bed, and get up at the bell rested.`
            : k === 'sick' ? `${go} The night shift stands round the frame with its hands moving on nothing. Before first light they lie down on the ground, one after another, quite gently. At the bell a good many of them cannot be woken, and by noon those ones have stopped breathing.`
            : `${go} The night shift puts lines on ${c.up ? 'the frame' : 'what there is of the frame'} and hauls it upright by hand, where the drawing wants a crane. It goes up. A guy parts on the way, and the people under that side do not get clear.`; },
        fx: s => ({ do: s2 => lastNight(s2, T(s2), 'let') }) } },
    { label: 'Bar the gate and the shed, and have the watch hold them in the yard', dark: true, note: 'The watch will use sticks and rope on people who are asleep and will not stop walking.', info: [['yield', 'Nobody reaches the frame'], ['danger', 'Whoever walks into the line']],
      out: { text: (s, c) => { const k = T(s).truth.is, go = `${c.W} puts the line across the yard. They walk into it and keep walking, and it comes to sticks and then to rope.`;
          return k === 'sick' ? `${go} They do not fight it long. They lie down where they are stopped. At the bell a good many of them cannot be woken, in the ropes, and by noon those ones have stopped breathing.`
            : k === 'ship' ? `${go} At first light they wake in the yard, tied, and ask what they did. The next night they rise in the same minute and it is all to do again.`
            : `${go} At first light they wake in the yard, tied, some with bones broken, and ask what they did. The frame stands a section short${k === 'adapt' ? ', and by daylight anyone can see it for a mill tower' : '. Nobody gets up the next night, or the one after'}.`; },
        fx: s => ({ stain: ['sd_held', 2], do: s2 => lastNight(s2, T(s2), 'hold') }) } },
    { label: 'Wake them, every one, now, however it has to be done', dark: true, note: 'Buckets, ammonia and open hands. A sleeper brought up that way does not always come up whole.', info: [['yield', 'Nobody asleep tonight'], ['danger', 'The ones who do not come round']],
      out: { text: (s, c) => { const k = T(s).truth.is, go = `The waking go down the file with buckets and the clinic's ammonia, and then with their hands. Most of the night shift comes up screaming. Some do not come up, and die where they dropped.`;
          return k === 'sick' ? `${go} The rest are walked round the yard until noon by people holding them under the arms, and are not let lie down. That evening they are frightened and tired, and awake.`
            : k === 'ship' ? `${go} The rest stand in the yard shaking until the bell. The next night they rise in the same minute, bruises and all.`
            : `${go} The rest stand in the yard shaking until the bell. None of them gets up the next night, or any night after.`; },
        fx: s => ({ stain: ['sd_wake', 2], do: s2 => lastNight(s2, T(s2), 'wake') }) } },
    { label: 'Pull the frame down under their hands', show: (s, c) => c.up, note: 'The colony\'s metal comes down in the dark onto people who will not step back from it.', info: [['yield', 'No frame'], ['danger', 'Whoever is under it']],
      out: { text: (s, c) => { const k = T(s).truth.is, go = 'The day crews put lines on it and pull, and it comes down across the yard with the night shift walking in under it. One of them is not got out.';
          return k === 'used' ? `${go} The rest stand on the bare ground until first light with their hands moving, and wake there. Nobody gets up the next night.`
            : k === 'adapt' ? `${go} The rest stand a while, then go back to bed. By daylight, lying in pieces, it is plainly most of a mill tower.`
            : k === 'sick' ? `${go} The rest lie down in the wreck of it, one after another. At the bell a good many of them cannot be woken, and by noon those ones have stopped breathing.`
            : `${go} The rest pick the pieces up and start again from the footings. They are still at it at the bell.`; },
        fx: s => ({ mat: 10, do: s2 => { const t = T(s2); t.did.razed = true; lastNight(s2, t, 'raze'); } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  used: (t, c) => `Something was using them. The frame was its work and never the colony's: laid out to a measure nobody here keeps, and aimed. Whatever wanted it built has no hands on this world, and found some. The good work at the benches was how it learned them.`,
  adapt: (t, c) => `It was the place, and it did them no harm. People who work hard under this sky stop dreaming, and after a while they go on working through the hours a dream would have had, at rest, with nothing in the way. The clinic's files show every one of them in better health than at landfall. It costs the dreams, and those have not come back.`,
  sick: (t, c) => `It was a sickness. It takes the dreams first. Then it gives the hands the day's work to repeat, and deepens the sleep under them a little every night, until a night when the sleeper does not come up. It goes from bunk to bunk. The good work was a body with nothing in its way.`,
  ship: (t, c) => `It came down with them. For all the years of the crossing the pod tutors drilled the ${LF.SHIP}'s construction manual into every sleeping head, on a tone, and the relay by the lander has carried that tone on every night pass since landfall. The night shift was working through the manual in page order, at the pace set for a colony several times this size. The frame was plate 212, a relay mast.`,
};
/* What each thing the colony did amounted to, given what it was. doubt: the same deeds with nothing to weigh them against. */
function reckon(s, t, c, doubt) {
  const d = t.did, k = t.truth.is, L = [], o = t.own;
  const add = (plain, u, a, si, sh) => L.push(doubt ? plain : { used: u, adapt: a, sick: si, ship: sh }[k]);
  if (d.last === 'wake') add('The night shift was woken by force, and some died of it.', 'Waking them by force on the last night kept them from the frame, and killed some of them.', 'The people who died of being woken on the last night died of nothing else. They had been well.', 'Waking them by force on the last night is why most of them are alive.', 'Waking them by force on the last night killed some of them and changed nothing. The tone came again the next night.');
  if (d.last === 'hold') add('The night shift was roped in the yard.', 'Roping them in the yard on the last night kept them inside the wire.', 'The people roped and beaten in the yard were on their way to finish a mill tower.', 'Roping them in the yard did nothing for them. They needed waking, and were tied down asleep.', 'Roping them in the yard changed nothing. The tone came again the next night.');
  if (d.last === 'unseen') add('', t.end === 'taken' ? 'Nobody gave the watch an order on the night they went.' : '', '', 'Nobody gave the watch an order on the night they lay down.', 'Nobody gave the watch an order on the night they raised the mast.');
  if (d.last === 'let') add('', t.end === 'taken' ? 'You stood by with a lamp and watched them go.' : 'Standing by cost nothing, because the frame was not ready.', 'Standing by was all that was ever needed.', 'You stood by with a lamp while they lay down.', 'You stood by while they raised a mast by hand that was drawn for a crane.');
  if (d.razed) add('The frame was pulled down.', t.end === 'taken' ? 'Pulling the frame down was right, and it was let go up again.' : 'Pulling the frame down was the right thing to do to it.', 'The frame that was pulled down was the colony\'s own mill tower.', 'Pulling the frame down did nothing. It was one joint, made over and over.', 'Pulling the frame down did nothing. They began again at plate 212.');
  if (d.putout) add(`${Num(d.putout)} people were put out through the gate for working in their sleep.`, `The ${num(d.putout)} put out through the gate were being used, and were put out for it.`, `The ${num(d.putout)} put out through the gate were the healthiest people in the colony.`, `The ${num(d.putout)} put out through the gate were sick. Putting them out did slow it, and they died of it past the wire.`, `The ${num(d.putout)} put out through the gate were following a drill the ship had put in them.`);
  if (d.awake) add('The colony was kept awake on the dispensary, and some hearts stopped.', 'Keeping the colony awake held the frame up for two months and no longer.', 'The hearts that stopped on the wakers stopped for nothing.', d.awake === 'done' ? 'Keeping the colony awake is what ended it: the sickness had nothing to work in.' : 'Keeping the colony awake would have ended it, if it had been kept up.', 'Keeping the colony awake stopped the drill for exactly as long as the tablets lasted.');
  if (d.under) add('The night shift was put under by needle every night.', 'Putting them under by needle kept them from the frame.', 'The people put under by needle every night were not sick.', 'Putting them under by needle sent them where the sickness was taking them, sooner.', 'Putting them under by needle held the drill off, a night at a time.');
  if (d.bar || d.store || d.strap) add('The night shift was shut in or strapped down at night.', 'Shutting them in at night kept hands off the frame for as long as it was kept up.', 'The people shut in and strapped down at night were well, and would have stayed well.', 'Shutting them in kept it in the pods it had already reached.', 'Shutting them in set them against the doors all night, on the ship\'s time.');
  if (d.silent) add('The relay\'s night feed was pulled.', 'Pulling the relay\'s night feed cost the colony its ship after dark, for nothing.', 'Pulling the relay\'s night feed cost the colony its ship after dark, for nothing.', 'Pulling the relay\'s night feed cost the colony its ship after dark, for nothing.', 'Pulling the relay\'s night feed is what ended it.');
  if (d.gain && k === 'ship' && !doubt) L.push('Turning the set up showed what it was, and worked one of them to death to show it.');
  if (d.rule) add('Every bench hand was moved into the night pods by order.', `The ${num(d.rule)} moved into the night pods by order were handed to it.`, 'Moving the bench hands into the night pods did them good, and was done to them without asking.', `The ${num(d.rule)} moved into the night pods by order were put in the next bunk to a sickness.`, 'Moving the bench hands into the night pods put them on the ship\'s roster.');
  if (d.roster || d.took) add('The colony took the night shift\'s work and did not tell it.', 'The work the colony took from the night shift was practice for something else\'s job.', 'The work the colony took from the night shift was freely done, though nobody asked.', 'The work the colony took from the night shift was taken from the sick.', 'The work the colony took from the night shift was the ship\'s schedule, with a second list on top.');
  if (d.half) add('', 'The night shift went hungry so that nobody would envy it.', 'The night shift went hungry for being well.', 'The night shift was put on half a plate while it was dying.', 'The night shift did two shifts on half a plate.');
  if (o && d.ownNight && !doubt) L.push(k === 'adapt' ? `${o.Name} worked nights with your leave, and came to no harm by it.` : k === 'used' ? `${o.Name} worked nights with your leave, for something else.` : `${o.Name} worked nights with your leave, and paid for them in health.`);
  if (o && d.vigil && !doubt) L.push(k === 'sick' ? `Waking ${o.name} every hour was hard on ${o.first}, and may be why ${o.first} did not go the way of the others.` : `${o.Name} was woken every hour of every night for a month, to no purpose.`);
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : doubt ? 'Nothing was done to the night shift on account of it.' : 'Nothing was done to the night shift on account of it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'sd.truth', tone: 'quiet', title: 'What the Night Shift Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { doubt: t.end === 'lost' && t.insight < 60, end: t.end, toll: Math.max(0, t.toll), took: t.took || 0, late: t.late || 0, n: t.n }); },
  text: (s, c) => { const t = T(s), k = t.truth.is;
    if (c.doubt) return `Nobody gets up at night now. The shops are dark from the evening bell to the morning one, and the work that comes out of them is the work of tired people. Still nobody dreams.\n\n${reckon(s, t, c, true)} The ones who were woken remember none of it, and there is nothing left to test.`;
    const tail = c.end === 'taken' ? ` ${Num(c.took)} of them walked out to wherever it points. The frame hummed for a month afterwards and then stopped.`
      : c.end === 'razed' || c.end === 'held' ? ' It missed its night. Nobody has got up asleep since, and nobody can say whether it will try again.'
      : c.end === 'kept' ? ` ${Num(c.n)} of the colony still get up at midnight, and the mill tower is theirs.`
      : c.end === 'lost' ? ' The ones who were woken by force have slept like anyone else ever since, and work like anyone else.'
      : c.end === 'slept' ? ' Since the night it took so many it has taken nobody, and the clinic cannot say if that is because it is finished.'
      : c.end === 'woken' ? ' Kept from sleep for long enough, it had nothing to work in.'
      : c.end === 'driven' ? ` It ran another season before ${c.e} read the plate number off the frame and went to the manual. ${Num(c.late)} more died at the benches in that time. The night board is out of the relay now.`
      : ' The night board came out of the relay, and on the first dark pass nobody left a bunk.';
    return `${WAS[k](t, c)}${tail}\n\n${reckon(s, t, c, false)}${c.toll ? ` In all, the night shift cost ${num(c.toll)} colonists.` : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who tied a knot, held a stick or signed an order has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who gave each order and who carried it out. People read it. Some of them stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the night shift, with the names.' }) } },
    { label: 'Enter it as an illness that passed, and the dead as dead of that', dark: true, note: 'The colony gets a page it can live beside, and everyone it hurt is written down as hurt by something else.', info: [['yield', 'Morale']],
      out: { text: 'The record says a sleeping sickness went through the colony in its early years and was nursed. The dead, and the ones put out, are listed under that heading without distinction. It is the version the children will be taught.',
        fx: s => ({ morale: 3, stain: ['sd_record', 1], chron: 'The record says a sleeping sickness went through the colony and was nursed.' }) } },
    { label: 'Leave it out of the record', note: 'Nobody is accused, and nobody who died of it is named either.',
      out: { text: 'There is a season in the record with stores figures in it and nothing else. People fill the gap themselves, each pod differently, and the children who were walked across the yard at dusk tell it their own way.', fx: s => ({ do: s2 => { LF.emit(s2, 'suspicion', 'sd.gap', 25, 200, 'the record says nothing about the season of the night shift'); } }) } },
  ] });

LF.TAGS['sd.dreams'] = ['cautious open', 'cautious order', 'bold closed', 'severe order'];
LF.TAGS['sd.shift'] = ['cautious open', 'bold order', 'severe closed', 'cautious order'];
LF.TAGS['sd.frame'] = ['cautious open', 'cautious order', 'bold open', 'severe order'];
LF.TAGS['sd.own'] = ['cautious open', 'bold free', 'severe order', 'closed order'];
LF.TAGS['sd.join'] = ['open free', 'severe bold', 'cautious closed', 'severe closed'];
LF.TAGS['sd.relay'] = ['cautious open', 'cautious closed', 'severe bold', 'closed order'];
LF.TAGS['sd.woken'] = ['mercy free', 'mercy cautious', 'severe order', 'severe closed'];
LF.TAGS['sd.night'] = ['severe order', 'severe closed', 'severe closed', 'free open'];
LF.TAGS['sd.doors'] = ['mercy free', 'severe order', 'severe closed', 'cautious order'];
LF.TAGS['sd.whole'] = ['open free', 'severe order', 'severe bold', 'cautious order'];
LF.TAGS['sd.truth'] = ['open', 'closed order', 'cautious closed'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { const out = [];
  if (s.used['sd.frame'] !== undefined) out.push({ k: 'plate', card: 'sd.frame', name: 'Where the night shift cuts its plate', kind: 'wreck', dist: 'near', danger: 1, state: t.end ? 'worked out' : 'located',
    known: `The racks hold less plate and pipe than the stores book says. Out here are fresh cuts in the old wreckage, and sledge runners in the ${LF.lex(s, 'top')} going back to the yard.` });
  if (s.used['sd.frame'] !== undefined && t.truth.is === 'used' && ['night', 'last', 'bill', 'after'].includes(t.phase)) out.push({ k: 'aim', card: null, name: 'Where the frame points', kind: 'mark', dist: 'far', danger: 3, state: 'rumoured',
    known: 'Every brace on the frame behind the workshop is set to one bearing. Run out across the survey map, the line ends here, on open ground with nothing marked.' });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5): what they found there. It points at the truth
   most of the time (pickK), as the cards' evidence does, and never says it. The cutting ground is a Meanwhile line; the
   end of the frame's bearing, three months out, is a card. */
const PLATE = {
  used: c => `The cuts in the old wreckage are all to one length, a little off the metre, and the offcuts are stacked in a row in the ${c.top} that points away from the yard. Nobody on the day crews stacked them.`,
  adapt: c => 'The cuts in the old wreckage are clean and chalked with the colony\'s own stock numbers, the ones off the build list. They took what the mill tower needs, and nothing else.',
  sick: c => `One rib of the old wreckage has been cut into the same short piece over and over until there's no rib left. Most of the pieces are still lying in the ${c.top}, never carried home.`,
  ship: c => 'The cuts follow the wreck\'s own panel seams, and every piece has a number scratched on it. The numbers run in order, and none of them is the colony\'s.' };
const AIM = {
  used: c => `The bearing ends on open ${c.top} with nothing on it. On the second night there, two of the party got up asleep and began laying stones in a line back the way they'd come. Neither remembers it. Neither has ever worked a night shift.`,
  adapt: c => `The bearing ends on open ${c.top} with nothing on it but wind. It blows across that ground from one quarter all day and all night, and the frame's braces are set square to it, the way a mill's are.`,
  sick: c => 'The bearing ends on open ground with nothing there. On the third night the one who\'d bunked in the night shift\'s row sat up asleep and tied the same knot in a guy line until morning, sixty times. The party cut the knots off before they came home.',
  ship: c => `The bearing ends on open ${c.top} with nothing on it. Both nights the party camped there, the ${c.ship} came up over the horizon exactly on the line, to the minute the night shift starts at home.` };
LF.THREADS[ID].visit = (s, t, a) => {
  const k = String(a.poi || '').split('.')[1]; if (k !== 'plate' && k !== 'aim') return null;
  const c = { top: LF.lex(s, 'top'), ship: LF.SHIP }, e = pickK(s, t, 0.05);
  if (k === 'plate') return { quiet: true, title: 'Where the Plate Went', tone: 'quiet', text: PLATE[e](c), fx: { mat: 6, do: s2 => learn(s2, T(s2), 6, e) } };
  return { title: 'Where the Frame Points', tone: 'pressure', scene: 'away_aim', text: AIM[e](c),
    fx: { morale: -1, do: s2 => { learn(s2, T(s2), 12, e); LF.emit(s2, 'unexplained', 'sd.aim', 10, 90, 'the party that walked the frame\'s bearing came home uneasy'); } } };
};
})();

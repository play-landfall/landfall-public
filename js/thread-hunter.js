/* Landfall — thread: the Guest. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). Lachlan, 2026-11-17: "Something Xenomorph like, a solitary super predator that hunts colonists
   at night. Ramp up the terror. Show as little of it as possible." One thing, not a pack. Somebody does not come back
   from the latrine; then it is inside the wire; then inside a bunkhouse, by the roof; then it takes two together, under
   a lamp. The text never describes it: only what it leaves, what was heard, and what witnesses half saw and cannot
   agree on. No card names a species or a shape, and the scenes never show it.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     beast   an animal of this world whose range the colony sits in. It can be brought to a baited post and shot, or
             met in a room with rifles. Burning a bunkhouse to kill it is an atrocity nobody needed.
     learns  it keeps account. A trap works on it once; the second it springs from behind the rifles. Every measure
             wears off. Fire, which it has never been shown, is the one sure end, and the fire has people in it.
     lamp    it comes to light, and never touches anyone in the dark. Every lamp put up against it brings it further
             in. Right: every lamp out. A lamp on a post would bring it to the rifles without anyone tied beside it.
     man     there is no animal. The night-soil carter, the one person let cross the yard alone at night, kills under
             cover of the fear. Right: count the colony at night, or sleep it in one hall. Traps catch nothing, the
             fire burns only colonists, and rifles in the rows kill neighbours.
   Evidence (the ground, the body, what came back for it, the witness, the hatch, the lie-up) is drawn per card and
   points at the truth only most of the time (pickK). Between cards it takes people at night (month), by name where
   it can, wears the watch's nerve, and writes unexplained, fear, siege, confinement and grief. Nothing here knows any
   other thread. Every card's text reads only what setup put in ctx.
   Three options at most (Lachlan, 2026-11-21). No longer offered: the walk-out and the fall in the log, the lamp walked down
   the path, the witness kept under, the door-bunk lots, the officer at the post in person, the beaters, a weapon at every
   bunk, the outer rows given up, the punishment detail sent in first, the wall pair hanged, the tarpaulin kept shut, the
   volley in the hall, the night rule kept for good. Putting every lamp out is asked once, on the hall roof (hu.last), and
   no longer at the third bunkhouse. What those options set (t.lied, t.inner, t.did.*) is still read below, for a game
   saved while one of them stood. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If, byPid, anyNamed } = h;
const ID = 'hunter', T = s => LF.T(s, ID), SRC = 'th.hunter';
const KINDS = ['beast', 'learns', 'lamp', 'man'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : LF.num ? LF.num(n) : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const RATE = 0.2, PRESS = 0.5, FEAR = 0.7, NAMEP = 0.15, CALM = 2, LATE = 0.6;   // the dials: how often the night takes somebody, what the measures cost in hands, how loud the fear is, how often it is somebody with a name, tension given back per loss, and the rate in a colony past its fourth year

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  ground: {
    beast: c => `Past the path the ${c.top} is pressed down in a line that runs straight to the wire and under it, and the bottom strand is bent upward there. The line is an old one. It goes on across the open ground, worn deep, as far as anyone cared to follow it.`,
    learns: c => `Something heavy went along the outside of the wire for forty metres, post by post, and stopped at each. It came over at the one post where the lamp had failed that night.`,
    lamp: c => `The marks in the ${c.top} run from the wire to the place where the lamp stood, and go round it several times, close in. They do not go on to the latrine, the bunk row or anything else that was dark.`,
    man: c => `Nothing has come over the wire or under it. The only marks on the path are bootprints, ship issue, in two sizes, and the rut of a single wheel.` },
  body: {
    beast: c => 'What is missing is what a hungry animal takes first, and it was taken in one sitting, on the spot. Whatever did this was feeding.',
    learns: c => 'Very little is missing. The coverall was opened at the fastenings and not torn, and what was done to the body was done slowly, a piece at a time. It looks less like feeding than like somebody finding out what is inside.',
    lamp: c => 'The body is hardly marked, except that the right arm ends at the elbow. The night hand carried a lamp in that hand. The lamp is beside the body, crushed flat, and all the damage was done in getting at it.',
    man: c => 'One wound did the killing: narrow, from behind, under the ribs. Everything else was done afterwards, and the edges of it are clean.' },
  back: {
    beast: c => 'It came back to the body in the last hour before light, and fed. The rifles listened to it for some minutes and could see nothing under the eave to aim at. They fired anyway and hit the wall.',
    learns: c => 'Nothing came near the body. In the morning there were fresh marks on the back wall of the stores, under the place where the rifles had lain. Something had stood behind them for a good part of the night.',
    lamp: c => 'Nothing touched the body, which lay in the dark. The lamp left burning at the corner to shoot by was gone in the morning, pole and all.',
    man: c => 'Nothing came. The body lay untouched until first light, and the only thing that crossed the yard all night was the soil cart.' },
  seen: {
    beast: c => `It went to the galley midden first, ${c.name} says, and was at it for some minutes before it went on toward the bunk rows.`,
    learns: c => `It stood at the pump house door for a long while, ${c.name} says, and the latch went up and down twice before the door opened.`,
    lamp: c => `It passed within arm's reach of the step, ${c.name} says, and never turned. ${c.Name} had no lamp. It went on to the one burning at the stores corner.`,
    man: c => `${c.Name} is sure of a lamp with a hood on it, moving along the stores wall at walking pace, and of a noise like a wheel.` },
  hatch: {
    beast: c => 'The hatch was pulled up from outside until the dogs sheared. The plate is bent like the lid of a tin. Nothing on it was worked. It was forced.',
    learns: c => 'All four dogs were turned from outside, the right way, by something narrow put through the vent slot. There are scratches at the slots of three other hatches in the row, where the same thing was tried and did not come off.',
    lamp: c => 'It is the hatch over the only bunk in the row with a reading lamp, and the lamp is gone, bracket and all. No other hatch in the row has a mark on it.',
    man: c => 'The hatch was opened from inside. The dust on the roof round it has not been disturbed, and there are bootprints in stove ash on the rungs going up.' },
  den: {
    beast: c => 'Half a day past the wire there is a place where something heavy has lain up for years. The ground round it is deep in bone, from the animals of this world, old at the bottom. On top of the heap are three of the colony\'s boots.',
    learns: c => 'There are three places on the high ground where something has lain for long stretches, and each looks straight down on a different side of the wire. From the freshest, the night watch\'s whole round can be followed, lamp by lamp.',
    lamp: c => 'Half a day past the wire there is a hollow with nine of the colony\'s lamps in it, carried there and crushed flat. There is no bone in the place, and no cloth.',
    man: c => 'There is nothing out there. No lie-up, no trail and no kill within a day of the wire. The only track that crosses it at night is a wheel rut, out to the soil pit and back.' },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { beast: 'an animal that can be brought to a gun', learns: 'something that remembers what was tried on it', lamp: 'something that comes to the lamps', man: 'somebody inside the wire' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. wv, dv, bv: the first name of
   the Security, Medical or Engineering officer if one is at the post to say a line, else null. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['cm', 'command']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  const t = T(s); o.wv = voice(s, 'security'); o.dv = voice(s, 'doctor'); o.bv = voice(s, 'engineer'); o.top = LF.lex(s, 'top'); o.vic = t.first.name; o.vicFirst = t.first.first; return o; };
const who = (p, none, first) => p ? { pid: p.id, name: p.name, first: p.first, Name: p.name, seat: p.role ? p.seat : null } : { pid: null, name: none, first, Name: cap(none), seat: null };
const sour = (s, pid, v, txt) => { const p = pid && byPid(s, pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const animal = t => t.truth.is !== 'man';
const nerve = (s, v) => { if (LF.shift) LF.shift(s, 'security', 'mind', v); };

/* Taken in the night. n from the crowd; the colony is never emptied below a working floor by this alone. */
function take(s, t, n) { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 14))); const k = b - s.pop; t.taken += k; t.toll += k; if (k) { t.lastTake = s.day; s.tension = Math.max(0, s.tension - CALM * k); } return k; }
const count = (t, n) => { t.toll += n; };   // deaths a card's own fx has already taken from the colony
function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^hu\./.test(e.id)); s.sched.push({ id: 'hu.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }

const OUT = ['A cook went out to the wash trough after lamp-down and did not come back. The lamp was on the ground beside the trough, still lit.',
  'One of the wall pair went round the corner of the stores to look at a noise. The other waited at the corner until first light.',
  'The pump house door was standing open this morning and the night hand was not inside. The kettle had boiled dry.',
  'A field hand went back for a coat left at the far furrow at dusk. The coat is still there.'];
const IN = ['The dawn count in the second row was one short. The blanket lay halfway to the door.',
  'A bunk in the first row was empty at the dawn count. The boots were still under it, side by side.',
  'The galley was unlit this morning. The night cook\'s apron was hanging on the roof ladder, at the top.',
  'The clinic\'s end cot was empty at first light, with the window on the latch. The patient in it could not walk.'];
const BOLD = ['Two were taken from the galley last night with the lamps on. The bread was still in the oven.',
  'The dawn count in the first row was two short, from bunks side by side. Nobody in the row woke.',
  'The latrine pair went out roped at the wrist, as ordered. The rope was found on the path, cut once.'];
const NAMED = [p => `${p.name} went to bar the stores after lamp-down and was not at breakfast. The bar was found across the door.`,
  p => `${p.name}'s bunk was empty at the dawn count. The blanket was on the floor by the door, and ${p.first}'s lamp was on its hook.`,
  p => `${p.name} stepped out of the galley for a bucket of water after lamp-down. The bucket was found at the pump, full.`];
/* What each standing measure does to the night's odds, by what it really is. Under 'learns' each wears off. */
const MOD = { pairs: { beast: 0.8, learns: 0.8, lamp: 0.9, man: 0.6 }, told: { beast: 0.9, learns: 0.9, lamp: 0.95, man: 0.9 }, sealed: { beast: 0.7, learns: 0.6, lamp: 0.85, man: 1 }, roofs: { beast: 0.75, learns: 0.8, lamp: 0.9, man: 0.85 },
  armed: { beast: 0.7, learns: 0.8, lamp: 0.8, man: 1.15 }, hall: { beast: 0.6, learns: 0.7, lamp: 1.25, man: 0.15 }, inner: { beast: 0.75, learns: 0.8, lamp: 0.9, man: 1 }, blamed: { beast: 1.15, learns: 1.15, lamp: 1.15, man: 1.15 } };
/* Once a month from the first answer, while it lasts. */
function month(s, t) {
  const k = t.truth.is, ph = t.phase, late = ['bold', 'choice', 'bill'].includes(ph);
  if (t.burned && k !== 'man') return;   // it was in the fire
  if (t.tithe) {
    if (k === 'lamp' || k === 'man') { t.tithe = 0; t.spared = s.day; learn(s, t, 15); take(s, t, 1);
      LF.log(s, 'The one tied at the north post was still there at first light, alive and untouched. A bunk in the second row was empty.', 'bad'); return; }
    if (take(s, t, 1)) { t.given++; LF.log(s, 'One more was walked to the north post at dusk and tied. The post was bare at first light.', 'bad'); }
    if (k === 'learns' && t.given >= 2 && s.pop > 16 && LF.srand(s) < 0.6 && take(s, t, 1)) LF.log(s, 'The post was bare at first light, and so was the bunk nearest the door of the first row.', 'bad');
    return; }
  let p = ({ sign: 0.25, wire: 0.38, inside: 0.5, bold: 0.62, choice: 0.62, bill: 0.5 }[ph] || 0) * RATE * (t.old ? LATE : 1);
  for (const f in MOD) if (t[f] && !(k === 'learns' && s.day - t[f] > 50)) p *= MOD[f][k];
  if (t.lamps) p *= Math.pow({ beast: 0.85, learns: 0.9, lamp: 1.3, man: 0.9 }[k], t.lamps);
  if (LF.has(s, 'watch')) p *= { beast: 0.7, learns: 0.8, lamp: 1, man: 1 }[k];   // the watchtowers see what comes over the wire; they see nothing of what is already inside, and a lit tower is one more lamp
  if (t.cowed && s.day < t.cowed) p *= 0.2; if (!P(s, 'security')) p *= 1.2; if (LF.cv(s, 'dark') >= 40) p *= 1.3;
  if (s.pop > 16 && LF.srand(s) < p) {
    const known = s.people.filter(q => q.alive && !q.away && !q.role && !q.orbit), two = late && LF.srand(s) < 0.3;
    if (known.length && !two && LF.srand(s) < NAMEP) { const q = LF.spick(s, known); LF.log(s, LF.spick(s, NAMED)(q), 'bad'); LF.killPerson(s, q, 'taken in the night'); t.taken++; t.toll++; t.lastTake = s.day; }
    else if (take(s, t, two ? 2 : 1)) LF.log(s, LF.spick(s, two ? BOLD : ph === 'sign' || ph === 'wire' ? OUT : IN), 'bad');
        LF.emit(s, 'grief', 'hu.taken', 15, 40, 'people are taken at night and nothing is found of them'); }
  if (t.armed && s.pop > 16 && LF.srand(s) < 0.25) { LF.deaths(s, 1); t.toll++; t.own++;
    LF.log(s, LF.spick(s, ['A row fired through its own door at a sound last night. At first light it was one of the late shift, coming back from the latrine.', 'Somebody got up for water in the third row and was shot from the next bunk.']), 'bad'); }
}
/* man: nobody caught the carter, so the carter goes on to the end. */
function lateMan(s, t) { take(s, t, 2);
  LF.log(s, 'A wall pair took the night-soil carter at the stores hatch before dawn, with a bill hook, a hooded lamp and a loaded cart.', 'bad');
  finish(s, t, 'late', 'The colony learned that nothing had ever come over the wire.'); }
/* Nobody answered the last card. */
function resolve(s, t) {
  const k = t.truth.is;
  if (k === 'man') { if (t.hall) return finish(s, t, 'caught', 'With the whole colony asleep on one floor, the one who had been taking people was seen leaving the blanket.'); return lateMan(s, t); }
  if (t.burned) return finish(s, t, 'burned', 'What had been taking people at night was in the third bunkhouse when the roof came down.');
  if (t.tithe && k === 'beast') return finish(s, t, 'fed', 'The colony fed what hunted it at the north post until it stopped coming.');
  const n = take(s, t, clamp(Math.round((LF.sized ? LF.sized(s) : s.pop) * 0.04), 2, 5)); s.morale = clamp(s.morale - 6, 0, 100);
  LF.log(s, `It came into the mess hall on a night when the whole colony was in it. ${Num(n)} were gone by first light.`, 'bad');
  finish(s, t, 'mauled', 'What hunted the colony was never stopped. It was not seen again after the night in the hall.');
}

LF.thread({ id: ID, name: 'The Guest', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'A bunk plan, drawn again every few pages with fewer names on it and the bunks moved further from the door. On the last one they are all in the middle of the room.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'the lamp on the path' : 'the Guest',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What is taking people at night?',
  chap: {
    killed: t => t.truth.is === 'lamp' ? 'What took people at night came to lamps. The colony killed it at one.' : 'An animal hunted the colony at night. The colony killed it.',
    burned: t => t.truth.is === 'learns' ? 'What hunted the colony learned from everything tried against it. The colony burned it in a bunkhouse, with the people who slept there.'
      : `The colony burned a bunkhouse with its own people in it, to kill what hunted it. ${t.truth.is === 'lamp' ? 'Putting the lamps out would have done as well.' : 'A baited post would have done as well.'}`,
    starved: t => 'What took people at night came to lamps. The colony put its lamps out, and it went away.',
    caught: t => 'There was never an animal. The colony counted itself by night and found the one who was doing it.',
    late: t => t.did.burned ? 'There was never an animal. The colony burned a bunkhouse of its own people before it found the one who was doing it.' : 'There was never an animal. One of the colony killed under cover of the fear until the wall caught them at it.',
    fed: t => 'The colony fed what hunted it with its own people until it stopped coming.',
    mauled: t => 'What hunted the colony at night was never stopped. It took what it wanted and was not seen again.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, first: { name: 'a rigger from the night shift', first: 'the rigger' },
    taken: 0, toll: 0, own: 0, traps: 0, hurt: 0, lamps: 0, given: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'sign'); t.old = s.day > 400; s.signs.push({ id: 'missing', d: s.day, src: SRC });
      const p = s.pop > 14 ? anyNamed(s, LF.SEAT_ORDER) : null;
      if (p && !p.role) { t.first = { name: p.name, first: p.first }; LF.killPerson(s, p, 'did not come back from the latrine path'); t.taken++; t.toll++; } else take(s, t, 1);
      LF.cue(s, 'hu.first', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'sign') { if (since('hu.first') >= 12 || age >= 50) { LF.phase(s, ID, 'wire', 'Something began coming inside the wire at night.'); take(s, t, 1); LF.cue(s, 'hu.wire', 0, 4); } }
    else if (t.phase === 'wire') { if (since('hu.wire') >= 10) once('seen', 'hu.seen');
      if ((since('hu.wire') >= 30 && (since('hu.seen') >= 8 || since('hu.wire') >= 50)) || age >= 100) { LF.phase(s, ID, 'inside'); take(s, t, 1); LF.cue(s, 'hu.roof', 0, 4); s.tension = clamp(s.tension + 6, 0, 100); } }
    else if (t.phase === 'inside') { if (since('hu.roof') >= 10) once('trap', 'hu.trap'); if (since('hu.roof') >= 24) once('out', 'hu.out');
      if ((since('hu.roof') >= 40 && (since('hu.out') >= 8 || since('hu.roof') >= 60)) || age >= 130) { LF.phase(s, ID, 'bold', 'What came at night stopped waiting for people to be alone.'); take(s, t, 2); nerve(s, -3); LF.cue(s, 'hu.two', 0, 4); s.tension = clamp(s.tension + 6, 0, 100); } }
    else if (t.phase === 'bold') { if (since('hu.two') >= 20 || age >= 60) { LF.phase(s, ID, 'choice'); jump(s, 'hu.choice', 20); } }
    else if (t.phase === 'choice' && (since('hu.choice') >= 20 || age >= 60)) { if (!t.burned && !animal(t)) return resolve(s, t); LF.phase(s, ID, 'bill'); t.billId = t.burned ? 'hu.ash' : 'hu.last'; jump(s, t.billId, 20); }
    else if (t.phase === 'bill' && (since(t.billId) >= 14 || age >= 60)) return resolve(s, t);
    if (s.day % 10 === 0 && s.used['hu.first'] !== undefined) month(s, t);
    if (s.day % 5 === 0) { const late = ['bold', 'choice', 'bill'].includes(t.phase), calm = (t.cowed && s.day < t.cowed ? 10 : 0) + (t.tithe ? 8 : 0) + (t.lied && t.phase === 'sign' ? 10 : 0);
      if (t.phase === 'sign') LF.emit(s, 'unexplained', SRC, 35 - calm, 8, 'somebody went out to the latrine at night and only the lamp was found');
      else { LF.emit(s, 'fear', SRC, (({ wire: 30, inside: 40 }[t.phase] || 48) - calm) * FEAR, 8, 'something takes people at night, and nobody has seen it whole');
        if (late) LF.emit(s, 'siege', SRC, 32, 8, 'nobody will cross the yard after lamp-down'); }
      if (t.hall || t.sealed) LF.emit(s, 'confinement', SRC, t.hall ? 38 : 25, 8, t.hall ? 'the whole colony sleeps on one floor behind one door' : 'every hatch is welded and every door bolted at lamp-down');
      if (t.armed || t.blamed) LF.emit(s, 'suspicion', SRC, 28, 8, t.armed ? 'there are rifles in the bunk rows, and they have been fired at neighbours' : 'a corporal of the watch was hanged for a posting order'); }
  },
  /* Nobody works after lamp-down, and every measure is paid for in hands. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent') return;
    let d = { sign: 0, wire: 0.01, inside: 0.02, bold: 0.03, choice: 0.03, bill: 0.03 }[t.phase] || 0;
    if (t.pairs) d += 0.015; if (t.hall) d += 0.04; if (t.roofs) d += 0.01; if (t.sealed) d += 0.005; if (t.inner) P.yield -= 0.06; if (t.tithe) d *= 0.6;
    P.labor -= d * PRESS; if (['bold', 'choice', 'bill'].includes(t.phase) && !t.tithe) P.morale -= 0.01 * PRESS; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* A trap, wherever it is laid. What comes of it is settled by what it is and by whether it has seen one before,
   and the roll only matters when there is an animal that has not. b: who or what is put out. */
const trapKind = (s, c, ok) => { const k = T(s).truth.is; return k === 'man' ? 'none' : k === 'learns' && c.trapN >= 1 ? 'sprung' : ok ? 'hit' : 'miss'; };
const TRAP = {
  hit: (c, b) => `Something comes to ${b.place} in the last hour of the night. The rifles fire eleven rounds. At first light there is blood on the ${c.top} from ${b.place} to the wire, more than a person holds, and ${b.person ? `${b.the(c)} is alive` : 'the bait is still on its hook'}.`,
  miss: (c, b) => `Something comes to ${b.place} in the last hour of the night, and the rifles fire late. ${b.person ? `${cap(b.the(c))} is gone` : 'The bait is gone, hook and all'}. The lamp is lying on its side, out.`,
  sprung: (c, b) => `Nothing comes to ${b.place}. Some time after midnight there is a sound behind the rifles, where nobody was looking. Two of the watch are gone before a lamp can be turned round${b.person ? `, and ${b.the(c)} heard all of it` : ''}.`,
  none: (c, b) => `Nothing comes to ${b.place} all night. ${b.person ? `${cap(b.the(c))} is brought in at first light, too cold to stand` : 'The bait hangs there until first light'}. At the dawn count the second row is one short.`,
};
const trapText = (ok, b) => (s, c) => TRAP[trapKind(s, c, ok)](c, b);
const trapFx = (ok, b, extra) => (s, c) => { const kind = trapKind(s, c, ok), pid = b.pid ? b.pid(c) : null, fx = Object.assign({}, extra);
  if (kind === 'miss' && b.person) { if (pid) fx.kill = [{ who: pid, cause: `taken from ${b.place}, set there as bait` }]; else fx.pop = -1; }
  if (kind === 'sprung') fx.pop = -2; if (kind === 'none') fx.pop = -1; if (kind !== 'hit') fx.morale = (fx.morale || 0) - 2;
  if (pid && kind !== 'miss') fx.off = [[pid, 'mind', kind === 'sprung' ? -10 : -5]];
  fx.do = s2 => { const t = T(s2); t.traps++; t.did.trap = kind; if (b.staked) t.did.bait = true;
    if (kind === 'hit') { t.hurt++; t.cowed = s2.day + 45; learn(s2, t, 8); } else if (kind === 'miss') { count(t, b.person ? 1 : 0); learn(s2, t, 5); }
    else if (kind === 'sprung') { count(t, 2); t.sprung = true; nerve(s2, -6); learn(s2, t, 15, 'learns'); } else { count(t, 1); learn(s2, t, 8); } };
  return fx; };

const STEP = { place: 'the galley step', person: true, staked: true, the: c => c.name, pid: c => c.pid };

/* ======================= SIGN: the lamp on the path ======================= */
B('sign', { id: 'hu.first', view: 'world', tone: 'pressure', title: 'The Latrine Path',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)) }),
  text: (s, c) => `${c.vicFirst === 'the rigger' ? cap(c.vic) : `${c.vic}, a rigger on the night shift,`} went out to the latrine after lamp-down and did not come back. The lamp is on the path where it was set down, upright, still lit. There is no blood on the ${c.top}. The latrine door is latched from outside, and nobody in the bunk row heard anything.\n\n${c.W} has walked the wire twice and found it whole.${c.wv ? `\n\n[[security]] "Nobody walks out and leaves a lit lamp standing on the path, and nobody latches a door from the outside by accident." "So whatever did it knew the path, and knew somebody walks it alone after lamp-down, and I'd like a list of who walks it most nights before it does."` : ''}`,
  choices: [
    { label: 'Search the ground past the path at first light', note: 'The search is the day\'s field crew, and it goes looking for whatever took a grown adult without a sound.', test: { base: 50, mods: [R('security', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.W} quarters the ground from the path to the wire before the crews are let out. ${ev('ground', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The field crew walks the ground in a line before anyone thinks to read it. By noon there are two hundred bootprints and nothing else. The crew has seen the lamp, and talks about it at supper.', fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Nobody outside alone after lamp-down: pairs, roped at the wrist', note: 'Everyone who needs the latrine wakes a neighbour, and the night crews work at half pace.',
      out: { text: 'The order is read at supper. That night the path is busy with pairs, each roped and each carrying a lamp. The night shift loses two hours to it, and will lose them every night.',
        fx: s => ({ morale: -1, do: s2 => { T(s2).pairs = s2.day; } }) } },
  ] });

/* ======================= WIRE: inside the wire, and what was seen ======================= */
B('wire', { id: 'hu.wire', tone: 'pressure', title: 'Head Height',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.1) }); },
  text: (s, c) => `The night hand from the pump house was found at first light behind the stores, inside the wire. ${c.D} has the body under a sheet and has asked that nobody else look. Parts of it are not there.\n\nOn the stores wall above the place are four marks cut into the hull plate, level with ${c.w}'s eyes. The wire is whole, the gate was barred, and the wall pair passed that corner twice in the night. The mess has begun calling it the Guest, since nobody let it in.${c.dv ? `\n\n[[physician]] "No, you don't get to look, and neither does anybody else, because I want one person left who remembers that face the way it was." "Sit down first, and I'll tell you what's gone."` : ''}`,
  choices: [
    { label: 'Have the body examined properly, however long it takes', note: 'The clinic is shut to the living for the month, and what is found will be all over the mess.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} works behind a locked door and comes out with two pages. ${ev('body', c.ev, c)}`, fx: (s, c) => ({ morale: -1, do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `The body had lain out half the night and been moved twice before ${LF.sentName(s, 'physician')} saw it. The two pages list what is missing and say nothing about how. The orderly who helped has told the mess all of it.`, fx: s => ({ morale: -2, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Lay the body back where it was found tonight, with rifles on the stores roof', dark: true, note: 'The colony finds out whether it comes back for what it left, and the night hand lies in the yard a second night to show it.', info: [['yield', 'What comes back'], ['danger', 'The dead, and the row that knew them']],
      out: { text: (s, c) => `The night hand is carried back to the corner and uncovered, and four rifles lie up on the stores roof. ${ev('back', c.ev2, c)} The bunk row watched the body carried out, and has not spoken to the watch since.`,
        fx: (s, c) => ({ morale: -2, stain: ['hu_deadbait', 2], do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev2); t.did.deadbait = true; } }) } },
    { label: 'Lamps on every wall and corner, burning until dawn', cost: { mat: 15 }, note: 'The yard is lit like a landing pad all night, out of lamps and oil the build crews were counting on.',
      out: { text: 'Forty lamps go up on poles between the bunk rows, the stores and the pump house. From the wall the colony is the only light for a hundred kilometres. For the first time in a month, people sleep.',
        fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.lamps++; t.did.lamps = true; } }) } },
  ] });

B(['wire', 'inside'], { id: 'hu.seen', tone: 'pressure', title: 'From the Galley Step',
  setup: s => { const t = T(s), p = anyNamed(s, LF.SEAT_ORDER); return Object.assign(crew(s), who(p, 'the night cook', 'the cook'), { ev: pickK(s, t, 0.05), trapN: t.traps }); },
  text: (s, c) => `${c.pid ? `${c.Name}, who cooks for the night shift,` : c.Name} was on the galley step after lamp-down and saw it cross the yard. That is all anyone agrees on. ${c.Name} says it went low along the foot of the stores wall and made no sound. The wall pair, who saw something in the same minute, say it stood upright at the pump house door and was taller than the lintel. A hauler coming off the late shift says there was only a shadow, where no lamp could have thrown one.\n\nNo two of them can draw the same thing. ${c.Name} has not let go of the galley doorpost since, and the mess is filling with people who want to hear it told.`,
  choices: [
    { label: (s, c) => `Have the clinic take ${c.name}'s account slowly, until it is whole`, about: true, note: 'The one person who saw it goes back over that minute every day for a month.', test: { base: 50, mods: [R('physician', 10), R('security', 5)] },
      ok: { text: (s, c) => `It comes out in pieces over the month, and most of it shifts with each telling. One part stays the same however it is asked. ${ev('seen', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: (s, c) => `Each telling adds something, and by the end ${c.name} is describing things the yard lamps could not have shown. ${cap(LF.sentName(s, 'physician'))} stops the sessions. ${c.Name} will not go near a window now.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: (s, c) => `Have ${c.name} tell the whole hall at supper`, note: 'Everyone hears it at once from the one who saw it, and takes it to bed.',
      out: { text: (s, c) => `${c.Name} tells it standing on a bench, in about forty words, and sits down. Nobody finishes eating. That night every row wedges its door, and the night shift does not turn out.`,
        fx: s => ({ morale: -2, progress: -0.04, do: s2 => { const t = T(s2); t.told = s2.day; LF.emit(s2, 'fear', 'hu.told', 25, 90, 'the hall heard what was seen from the galley step'); } }) } },
    { label: (s, c) => `Stand ${c.name} on the galley step again tonight, with rifles in the galley behind`, about: true, dark: true, note: 'It may come back to where it was seen, and the person it frightened most is put there to meet it.', info: [['yield', 'A shot at it'], ['fail', 'The witness']],
      test: { base: 40, mods: [R('security', 10)] },
      ok: { text: trapText(true, STEP), fx: trapFx(true, STEP, { stain: ['hu_post', 2] }) },
      bad: { text: trapText(false, STEP), fx: trapFx(false, STEP, { stain: ['hu_post', 2] }) } },
  ] });

/* ======================= INSIDE: the roof hatch, the trap, the one who goes out ======================= */
B('inside', { id: 'hu.roof', tone: 'crisis', title: 'The Roof Hatch',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)) }),
  text: (s, c) => `It has been inside a bunkhouse. At the dawn count the second row was one short: a bunk in the middle of the room, with nineteen people asleep on every side of it. The blanket is on the floor, halfway to the door. The roof hatch is open. The door bar is off its brackets and leaning against the wall, on the inside.\n\nNobody woke. The second row is standing in the yard with its bedding and will not go back in.${c.bv ? `\n\n[[engineer]] "Don't ask me if the doors'll hold, because I went round every bar in the place last night and they held fine." "It didn't need the door to get in, is what frightens me."` : ''}`,
  choices: [
    { label: 'Have the hatch, the bar and the rafters gone over before anything is touched', note: 'The second row sleeps on the mess floor until it is done, and the other rows hear what the hatch has to say.', test: { base: 50, mods: [R('engineer', 10), R('security', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'engineer'))} takes the hatch off its frame and lays the pieces out on a bench. ${ev('hatch', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `Twenty people went past that hatch in the dark getting out, and half of them put a hand to the frame. ${cap(LF.sentName(s, 'engineer'))} can say it was opened, and cannot say from which side.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Weld every roof hatch shut, and bolt the doors from inside at lamp-down', cost: { mat: 20 }, note: 'Nothing opens from outside again, and nothing opens quickly from inside if a stove goes over.',
      out: { text: (s, c) => `${c.E} welds forty hatches and fits drop-bolts to every door. The rows are close and smell of the stove. Twice a bolt jams, and a row is late to the fields waiting for the bar to be cut.`,
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.sealed = s2.day; } }) } },
    { label: 'Give each row two rifles, and let it keep its own watch', dark: true, note: 'A row can answer whatever comes through a hatch, and will answer a good many neighbours coming back from the latrine.', info: [['yield', 'Fewer taken'], ['danger', 'Anyone moving after lamp-down']],
      out: { text: (s, c) => `The rifles are handed in at each door with ten rounds. ${c.W} shows each row which end is which. Before the month is out the first row fires through its own door at a sound, and the sound was the latrine pair coming back. One of the pair lives.`,
        fx: s => ({ pop: -1, stain: ['hu_armed', 2], do: s2 => { const t = T(s2); t.armed = s2.day; t.own++; count(t, 1); t.did.armed = true; } }) } },
  ] });

const POST = { place: 'the north post', person: true, staked: true, the: c => 'the one tied there' }, MEAT = { place: 'the north post', person: false };
B(['inside', 'bold'], { id: 'hu.trap', tone: 'pressure', title: 'The North Post',
  setup: s => { const t = T(s); return Object.assign(crew(s), { trapN: t.traps, lean: lean(t) }); },
  text: (s, c) => `${c.W} has a plan, and does not like it. Whatever this is, it comes where the colony is thinnest: the path, the corner, the one bunk. So put something at the north post, where the ground is open on three sides, lie up with every rifle there is, and see what comes for it.${c.wv ? `\n\n[[security]] "It likes one of us on our own, so fine, we give it one." "I've a list of who I'd miss least if that helps you sleep, which I'd guess it doesn't."` : ' The watch has drawn up a list of who could be put there.'}\n\n${c.lean}`,
  choices: [
    { label: 'Tie one of the punishment detail to the post with a lamp, and lie up', dark: true, note: 'It gets what it has been coming for, with rifles over it, and somebody is tied there to be that.', info: [['yield', 'A shot at it'], ['fail', 'The one at the post']],
      test: { base: 50, mods: [R('security', 10), If(s => T(s).hurt > 0, 5, 'It has been hit before')] },
      ok: { text: trapText(true, POST), fx: trapFx(true, POST, { stain: ['hu_bait', 2] }) }, bad: { text: trapText(false, POST), fx: trapFx(false, POST, { stain: ['hu_bait', 2] }) } },
    { label: 'Hang a month of the meat ration at the post under a lamp, and lie up', cost: { food: 40 }, note: 'Nobody is tied to anything, and the galley goes a month without meat for a bait it may not want.',
      test: { base: 40, mods: [R('security', 10), If(s => T(s).hurt > 0, 5, 'It has been hit before')] },
      ok: { text: trapText(true, MEAT), fx: trapFx(true, MEAT, {}) }, bad: { text: trapText(false, MEAT), fx: trapFx(false, MEAT, {}) } },
    { label: 'No trap. Take the watch off the wire and put it on the bunkhouse roofs', note: 'The wire is left to itself at night, and the watch spends the season lying on cold plate over people who can hear it move.',
      out: { text: 'Two of the watch lie on each roof from lamp-down to first light, a lamp between them. The rows under them listen to every shift of a boot. The wire is walked once at dusk and not again.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.roofs = s2.day; } }) } },
  ] });

const WANTS = {
  security: `"I've stood on that wall every night watching it not be there, and I'm done with that." "Because it sleeps somewhere, and I'm going to go and find out where and be bloody rude to it."`,
  command: `"One rifle. Two nights. Back on the third." "It lies up by day. I find where. Lift the bar."`,
  engineer: `"Forty hatches I've welded, and it's had more of us since." "I'm tired. Tell me what to weld next, because I'm not stopping."`,
  doctor: `"You keep sending me what's left of them." "I'm going to look at it once, before it sends me another. Open the gate."`,
  scientist: `"It has to lie up somewhere, doesn't it? Everything does, half a day out, less, and nobody's even looked." "I only want to see the place, just the place, I wouldn't touch a, no wait, lift the bar, will you?"`,
  crew: `"A thing that hunts has a bed." "You find the bed. We did it with foxes at home. I'll be back for the sowing."`,
};
B(['inside', 'bold'], { id: 'hu.out', tone: 'pressure', title: 'Going Out After It',
  setup: s => { const t = T(s), up = (LF.seated ? LF.seated(s) : []).filter(p => !p.away), p = up.find(q => q.seat === 'security') || (up.length ? LF.spick(s, up) : null), c = who(p, 'the watch sergeant', 'the sergeant');
    return Object.assign(crew(s), c, { want: c.seat && WANTS[c.seat] ? `[[${c.pid}]] ${WANTS[c.seat]}` : 'The sergeant means to find where it lies up by day, and says the wall has done nothing so far but count.', ev: pickK(s, t, 0.1), ev2: pickK(s, t, 0.05) }); },
  text: (s, c) => `${c.Name} has not slept in a bunk since the roof hatch, and has stopped pretending to. Tonight ${c.first} is at the gate with a rifle and a pack and no lamp, asking for the bar to be lifted.\n\n${c.want}`,
  choices: [
    { label: 'Lift the bar', note: (s, c) => `${c.Name} goes alone into its ground, and the post is run by whoever is to hand until the gate opens again.`, test: { base: 50, mods: [R('security', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.Name} is back at the gate on the third morning, grey and unhurt. ${ev('den', c.ev, c)}`, fx: (s, c) => ({ off: [['ctx', 'native', 6], ['ctx', 'mind', -4]], do: s2 => learn(s2, T(s2), 28, c.ev) }) },
      bad: { text: (s, c) => `${c.Name} comes in over the wire on the third night without the pack or the rifle. There was nothing to find, ${c.first} says, and will not say it twice. While the wall was a rifle short, a bunk in the first row emptied.`,
        fx: s => ({ pop: -1, morale: -1, off: [['ctx', 'body', -8], ['ctx', 'mind', -10]], do: s2 => { const t = T(s2); count(t, 1); learn(s2, t, 5); } }) } },
    { label: (s, c) => `Send six of the watch out with ${c.first}, in daylight`, note: 'The wall is seven short until they are home, and seven people walk into its ground in place of one.',
      out: { text: (s, c) => `Seven go out at first light and six come in at dusk on the second evening. The rear marker was there at the last halt. ${ev('den', c.ev2, c)}`,
        fx: (s, c) => ({ pop: -1, off: [['ctx', 'native', 4], ['ctx', 'mind', -3]], do: s2 => { const t = T(s2); count(t, 1); learn(s2, t, 22, c.ev2); } }) } },
    { label: (s, c) => `Keep the bar down, and order ${c.first} to the clinic to sleep`, note: (s, c) => `${c.Name} is shut in for wanting to do something about it, with the wall looking on.`,
      out: { text: (s, c) => `${c.Name} hands over the rifle and walks to the clinic between two of the watch. ${c.D} mixes the draught. The wall says nothing in your hearing.`,
        fx: (s, c) => ({ morale: -1, off: [['ctx', 'mind', -6]], do: s2 => sour(s2, c.pid, 12, 'you had them walked to the clinic for wanting to go out after it') }) } },
  ] });

/* ======================= BOLD: two together, and the third bunkhouse ======================= */
B('bold', { id: 'hu.two', tone: 'crisis', title: 'Both of Them',
  setup: s => { const t = T(s); return Object.assign(crew(s), { armed: !!t.armed, lean: lean(t) }); },
  text: (s, c) => `It has stopped waiting for anyone to be alone. Last night it took the wall pair at the north corner: two armed adults, roped at the wrist, standing under a lamp. Neither fired. The rope is on the walkway, cut once in the middle, and both rifles are lying beside it.\n\nThe hall met without being called. ${c.Cm} has the proposals from the floor, and says nobody in there will go to a bunk until one of them is an order. ${c.lean}`,
  choices: [
    { label: 'Everyone into the mess hall at lamp-down, every night, until it is over', note: 'The whole colony sleeps on one floor with one stove and one door, for months, and the night work stops.',
      out: { text: 'The rows are emptied at dusk. The hall sleeps head to foot with the benches stacked against the walls and the lamps left burning. A cough that starts at one end of it has gone round the room by morning.',
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.hall = s2.day; t.did.hall = true; } }) } },
    { label: 'One a month at the north post, off the punishment detail and the sick list', dark: true, note: 'If it is fed it may leave the rows alone, and the colony chooses each month who it can best spare.', info: [['yield', 'The rows left alone, if it takes the price'], ['danger', 'One of the colony, every month']],
      out: { text: (s, c) => `The first is walked to the north post at dusk with a blanket, and tied. The wall is ordered to look inward until first light. ${c.Cm} keeps the list and will not say how it is ordered.`,
        fx: s => ({ tension: -6, stain: ['hu_tithe', 2], do: s2 => { const t = T(s2); t.tithe = s2.day; t.did.tithe = true; }, chron: 'The colony began tying one of its own to the north post each month.' }) } },
    { label: 'Hang the watch corporal who posted that pair at the corner', dark: true, note: 'The hall gets somebody to blame tonight, and the watch learns what a posting order is worth.', info: [['yield', 'Morale'], ['danger', 'The corporal, and the watch']],
      out: { text: (s, c) => `It is done at the cart crane before midnight, and the hall goes to its bunks. At breakfast six of the watch hand in their rifles. ${c.W} takes the rifles out of the rack again, one at a time, and gives each back to its owner.`,
        fx: s => ({ pop: -1, morale: 3, tension: -8, stain: ['hu_corporal', 2], off: [['security', 'mind', -6]], do: s2 => { const t = T(s2); t.blamed = s2.day; t.did.hanged = true; } }) } },
  ] });

/* What going in by the door finds. */
const INSIDE = {
  win: c => `Six of the watch go in by the door with two lamps. It comes down the row at them. They fire until the rifles are empty. What the wall saw is on the floor between the bunks, and two of the watch are dead beside it. The ${num(c.n)} are behind the washroom door, alive.`,
  loss: c => `Six of the watch go in by the door with two lamps. The lamps go first. Three of the six are dead in the dark, and it went out by the roof the way it came. The ${num(c.n)} are behind the washroom door, alive.`,
  empty: c => `Six of the watch go in by the door with two lamps. The bunkhouse holds ${num(c.n)} frightened people behind the washroom door, and nothing else. While the watch is inside counting them, two of the cordon are taken from the dark side of the yard.`,
  none: c => `Six of the watch go in by the door with two lamps. The bunkhouse holds ${num(c.n)} frightened people behind the washroom door, and nothing else. The roof hatch is open, and the roof is empty.`,
};
const inKind = (s, ok) => { const k = T(s).truth.is; return k === 'man' ? 'none' : k === 'learns' ? 'empty' : ok ? 'win' : 'loss'; };
const inFx = ok => (s, c) => { const kind = inKind(s, ok), dead = { win: 2, loss: 3, empty: 2, none: 0 }[kind], fx = dead ? { pop: -dead } : {};
  if (kind === 'loss' || kind === 'empty') fx.morale = -2;
  fx.do = s2 => { const t = T(s2); count(t, dead); t.did.went = kind;
    if (kind === 'win') return finish(s2, t, 'killed', 'What had been taking people at night was shot dead in the third bunkhouse.');
    if (kind === 'none') learn(s2, t, 25, 'man');
    else { nerve(s2, -6); learn(s2, t, 10, kind === 'empty' ? 'learns' : undefined); } };
  return fx; };
const COUNTED = {
  man: c => `The colony is turned out by rows and counted under the yard lamps. The roll comes out one short, and the one is not among the ${num(c.n)}. The night-soil carter is found lying flat on the roof of the third bunkhouse with a bill hook and a hooded lamp. The yard has the carter down off the roof before the watch can get a hand to the ladder.`,
  lamp: c => `The colony is turned out by rows and counted under the yard lamps. The count is half done when it comes out by the roof of the third bunkhouse and straight down into the light. The yard breaks. Three are dead where they stood, and a fourth was shot from the wall.`,
  beast: c => `The colony is turned out by rows and counted under the yard lamps. The count is half done when it comes out by the roof of the third bunkhouse and down into the yard. The yard breaks. Two are dead where they stood, and a third was shot from the wall.`,
};
COUNTED.learns = COUNTED.beast;
B('choice', { id: 'hu.choice', tone: 'crisis', title: 'The Third Bunkhouse',
  setup: s => { const t = T(s), n = clamp(Math.round((LF.sized ? LF.sized(s) : s.pop) * 0.06), 3, 7); return Object.assign(crew(s), { n, out: n + LF.sri(s, 3, 6), hurt: t.hurt, lean: lean(t) }); },
  text: (s, c) => `At dusk the wall saw something go in at the roof of the third bunkhouse. ${Num(c.out)} people came out by the door in the first minute. ${Num(c.n)} did not, and nobody inside has answered since. The door is barred from outside, and every rifle the colony has is pointed at it.\n\n${c.W} can go in. ${c.E} has two drums of oil at the wall and has said, once, what they are for. ${c.Cm} wants the whole colony counted before anybody does either. ${c.lean}`,
  choices: [
    { label: 'Burn it now, with the door barred', dark: true, note: (s, c) => `If it is in there it cannot get out, and neither can the ${num(c.n)}.`, info: (s, c) => [['yield', 'An end to it, if it is in there'], ['danger', `The ${num(c.n)} inside`]],
      out: { text: (s, c) => `${c.E} pours the oil along the wall and ${c.w} lights it. The bunkhouse burns from end to end in a quarter of an hour. For the first part of that there is knocking on the inside of the door. The roof comes down at midnight, and nothing has come out.`,
        fx: (s, c) => ({ pop: -c.n, mat: -10, morale: -3, stain: ['hu_burned', 3], off: [['engineer', 'mind', -6], ['security', 'mind', -6]], do: s2 => { const t = T(s2); count(t, c.n); t.burned = s2.day; t.did.burned = c.n; },
          chron: `The colony burned the third bunkhouse with ${num(c.n)} of its own people inside.` }) } },
    { label: 'Send the watch in by the door', note: 'Six of the wall go into a dark room after it by lamplight, and the colony has no second six.', info: [['yield', 'An end to it, if they find it'], ['danger', 'The six who go in']],
      test: { base: 50, mods: [R('security', 10), If(s => T(s).hurt > 0, 10, 'It has been hit before')] },
      ok: { text: (s, c) => INSIDE[inKind(s, true)](c), fx: inFx(true) }, bad: { text: (s, c) => INSIDE[inKind(s, false)](c), fx: inFx(false) } },
    { label: 'Turn the whole colony out into the yard and count it against the roll, now', note: 'Everyone stands in the open at night under lamps while it is loose, so that the roll can say who is where.',
      out: { text: (s, c) => COUNTED[T(s).truth.is](c),
        fx: s => { const k = T(s).truth.is, dead = { man: 0, lamp: 4, beast: 3, learns: 3 }[k]; return Object.assign(dead ? { pop: -dead, morale: -3 } : {}, { do: s2 => { const t = T(s2); count(t, dead); t.did.counted = true;
          if (k === 'man') { learn(s2, t, 40, k); t.yard = true; finish(s2, t, 'caught', 'The colony counted itself by night and found the one who had been taking people.'); } else nerve(s2, -6); } }); } } },
  ] });

/* ======================= BILL: the ashes, or the hall door ======================= */
B('bill', { id: 'hu.ash', tone: 'crisis', title: 'In the Ashes',
  when: (s, t) => t.billId === 'hu.ash',
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: t.did.burned || 4, found: animal(t) }); },
  text: (s, c) => `The third bunkhouse burned until noon. ${c.E} has been through the ash with a rake, and the ${num(c.n)} are all accounted for. ${c.found ? `There is something else in it, under the fallen roof at the far end. ${c.Sc} has had a tarpaulin put over it and a guard put on the tarpaulin.` : 'There is nothing else in it. The wall pair who saw something go in at the roof will say only that they saw something on the roof.'}\n\nThe families of the ${num(c.n)} are standing at the edge of the ash. They have not asked anything yet.`,
  choices: [
    { label: (s, c) => c.found ? 'Pull the tarpaulin off in front of the hall' : 'Tell the hall what the rake found', note: (s, c) => c.found ? `The colony sees what the ${num(c.n)} were burned with, and the families see it too.` : `The colony learns that the ${num(c.n)} were burned for nothing, and who gave the order.`,
      out: { text: (s, c) => c.found ? 'It is dragged the length of the yard under its tarpaulin, and the tarpaulin is pulled off at the mess door. Nobody says anything for a long time. Then a child asks whether that is all of it.' : 'You say it from the mess step: there was nothing in the bunkhouse but the people who slept there. The hall hears it in silence and goes on standing in the yard afterwards. That night one more is gone from the first row.',
        fx: (s, c) => c.found ? { morale: 2, tension: -6 } : { pop: -1, morale: -4, tension: 6, do: s2 => { const t = T(s2); count(t, 1); learn(s2, t, 20, 'man'); } } } },
    { label: (s, c) => `Say that the ${num(c.n)} were dead before the oil was lit`, dark: true, note: 'Nobody can check it, and the families are told that the knocking the yard heard was something else.', info: [['yield', 'Morale'], ['danger', 'The families']],
      out: { text: (s, c) => `It is given out at muster that the ${num(c.n)} were dead before the door was barred. ${c.E}, who heard the knocking from nearer than anyone, is not at muster. The families are given the bunks nearest the stove.`,
        fx: s => ({ morale: 2, tension: -4, stain: ['hu_ashlie', 2], off: [['engineer', 'mind', -5]], do: s2 => { T(s2).did.ashlie = true; } }) } },
  ] });

const END = (s, t, end, chron) => finish(s, t, end, chron);
const KILLED = 'What had been taking people at night came into the mess hall and was killed there.', LEFT = 'What hunted the colony was never stopped. It was not seen again after the night in the hall.';
const LAST = {
  hold: { win: 'The hatch goes at the darkest hour. The watch fires straight up for as long as it has rounds. What comes down through the hatch is dead when it lands, and it lands on two of them.',
    loss: 'The hatch goes at the darkest hour, and the lamps go with it. The watch fires at each other\'s flashes. At first light there are three dead on the hall floor, the galley wall is open to the yard, and the roof is empty.',
    learns: 'The watch stands under the hatch all night and the hatch does not move. It comes through the galley wall at the back, where the stores were stacked against it. Three are gone from the far end before a rifle can be turned round.' },
  sick: { beast: c => `Three are put out through the door, one of them on a litter, and the bar goes back. ${c.D} has to be held by the arms. The roof is quiet soon afterwards. In the morning the yard is empty, and nothing walks on the roof that night or the next.`,
    learns: c => `Three are put out through the door, one of them on a litter, and the bar goes back. ${c.D} has to be held by the arms. The roof is quiet for an hour. Then it is in the hall, by the same door, which it had now seen opened. Two more are gone by first light.`,
    lamp: c => `Three are put out into the dark, one of them on a litter, and the bar goes back. ${c.D} has to be held by the arms. In the morning the three are sitting against the wall where they were left, alive and untouched. Inside, the two who lay nearest the galley lamp are gone.` },
  dark: { lamp: 'The lamps go out. The hall lies in the dark and listens to it walk. Some time before dawn the walking stops. At first light the roof is empty, the yard is empty, and the count is whole.',
    beast: 'The lamps go out. It comes in by the hatch in the dark, and nobody fires because nobody can see. Three are gone by first light, out of the middle of the floor.',
    learns: 'The lamps go out. It comes in by the hatch in the dark, and nobody fires because nobody can see. Two are gone by first light, out of the middle of the floor.' },
};
const holdKind = (s, ok) => T(s).truth.is === 'learns' ? 'learns' : ok ? 'win' : 'loss';
const holdFx = ok => s => { const kind = holdKind(s, ok), dead = { win: 2, loss: 3, learns: 3 }[kind]; return { pop: -dead, do: s2 => { const t = T(s2); count(t, dead); t.did.held = kind; END(s2, t, kind === 'win' ? 'killed' : 'mauled', kind === 'win' ? KILLED : LEFT); } }; };
B('bill', { id: 'hu.last', tone: 'crisis', title: 'On the Hall Roof',
  when: (s, t) => t.billId === 'hu.last',
  setup: s => { const t = T(s); return Object.assign(crew(s), { lean: lean(t) }); },
  text: (s, c) => `Nobody would sleep anywhere but the mess hall tonight, so the whole colony is in it, on the floor, with the benches against the door. An hour after lamp-down something began walking on the roof. It has gone from one end to the other three times. Now it has stopped over the galley hatch.\n\nThe children are in the middle of the room. ${c.W} has the watch under the hatch and is looking at you. ${c.lean}`,
  choices: [
    { label: 'Hold the hatch and the door with the watch, lamps lit, and wait for it', note: 'The watch stands under it with everyone the colony has at its back.', info: [['yield', 'An end to it'], ['danger', 'The watch, and the floor behind it']],
      test: { base: 50, mods: [R('security', 10), If(s => !!T(s).armed, 5, 'Rifles in the rows'), If(s => T(s).hurt > 0, 10, 'It has been hit before')] },
      ok: { text: s => LAST.hold[holdKind(s, true)], fx: holdFx(true) }, bad: { text: s => LAST.hold[holdKind(s, false)], fx: holdFx(false) } },
    { label: 'Put the sick and the old out through the door, and bar it again', dark: true, note: 'It is given what is easiest to take, and the colony chooses who that is with the whole hall looking on.', info: [['yield', 'The hall left alone, if it takes them'], ['danger', 'The three put out']],
      out: { text: (s, c) => LAST.sick[T(s).truth.is](c),
        fx: s => { const k = T(s).truth.is, dead = { beast: 3, learns: 5, lamp: 2 }[k]; return { pop: -dead, morale: -3, stain: ['hu_sick', 2], off: [['physician', 'mind', -10]], do: s2 => { const t = T(s2); count(t, dead); t.did.sick = true;
          END(s2, t, k === 'beast' ? 'fed' : 'mauled', k === 'beast' ? 'The colony put its sick out of the hall door for what hunted it, and it took them and went.' : LEFT); } }; } } },
    { label: 'Put out the lamps, and let nobody move or speak until light', note: 'The whole colony lies in the dark under it, children and all, and nobody may strike a light whatever comes in.',
      out: { text: s => LAST.dark[T(s).truth.is],
        fx: s => { const k = T(s).truth.is, dead = { lamp: 0, beast: 3, learns: 2 }[k]; return Object.assign(dead ? { pop: -dead, morale: -3 } : {}, { do: s2 => { const t = T(s2); count(t, dead); t.did.dark = true;
          END(s2, t, k === 'lamp' ? 'starved' : 'mauled', k === 'lamp' ? 'The colony put out every lamp it had, and what had been taking people went back over the wire.' : LEFT); } }); } } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  beast: (t, c) => `It was an animal of this world, and that is all it was. One of its kind keeps some hundreds of square kilometres to itself, and the colony was set down in the middle of this one's ground. ${c.dead ? `${c.Sc} has it under a tarpaulin in the long store and has asked that the hall not be let in.` : `${c.Sc} found the place where it lay up: years of bone from everything else that lives here, and the colony's boots on top.`} It hunted the colony as it hunted everything on its range, by night, the easiest first. It could have been brought to a baited post and shot in any month of this.`,
  learns: (t, c) => `It was an animal, and it kept account. ${c.Sc} found three places on the high ground where it had lain to watch the colony, each above a different side of the wire, each used on the nights the watch list changed. It turned the hatch dogs the right way at the fourth try. Nothing done against it worked twice${t.sprung ? ', and the second trap it sprang from behind the rifles' : ''}. Fire was the one thing it had never been shown.`,
  lamp: (t, c) => `It came to light. Whatever it lives on out there shows a glow at night, and a colonist carrying a lamp was the brightest thing it had ever met. ${c.dead ? `${c.Sc} has it under a tarpaulin in the long store. ` : ''}Its lie-up held nothing but the colony's lamps, crushed flat, ${num(clamp(t.taken + 4, 9, 40))} of them. In all these months it never touched anybody who was in the dark. Every lamp put up to keep it off brought it further in.`,
  man: (t, c) => `There was never an animal. The night-soil carter, on the muster since the first descent and known to every row, was the one person the watch let cross the yard alone after lamp-down, with a covered cart that nobody cared to look into. ${cap(c.vic)} had come on the carter behind the stores with a sack of the colony's flour. After that the carter needed the colony to go on looking over the wire, and it did. The marks at head height were made with a bill hook. The soil pit past the wire has been opened, and they are all in it.`,
};
const TAIL = {
  killed: (t, c) => '', burned: (t, c) => t.truth.is === 'man' ? '' : ' It was in the third bunkhouse when the roof came down.',
  starved: (t, c) => ' Since the lamps went out it has not been inside the wire.',
  caught: (t, c) => t.yard ? ' The yard hanged the carter from the cart crane before the watch could be got between them.' : ' With the whole colony asleep on one floor the carter could not leave the blanket unseen, and tried it once.',
  late: (t, c) => ' The carter was taken at the stores hatch by a wall pair, with the cart loaded, and hanged from the cart crane the same morning.',
  fed: (t, c) => ` It was fed until it stopped coming. ${c.Sc} thinks it was old.`,
  mauled: (t, c) => ({ beast: ' After the night in the hall it was not seen again. Nobody knows why.', learns: ' After the night in the hall it was not seen again. Why it stopped is not known.', lamp: ' It went on coming to the wire until the lamp oil ran short, and has not been seen since the yard went dark.' }[t.truth.is] || ''),
};
/* What each thing the colony did amounted to, given what it was. */
function reckon(s, t, c) {
  const d = t.did, k = t.truth.is, L = [], add = (b, l, m, n) => L.push({ beast: b, learns: l, lamp: m, man: n }[k]);
  if (d.burned) { const n = num(d.burned); add(`The ${n} burned in the third bunkhouse died to kill an animal that a baited post would have brought to the rifles.`, `The fire in the third bunkhouse was the one thing that could have ended it, and it cost the ${n} who had shut themselves in the washroom.`,
    `The ${n} burned in the third bunkhouse died for want of an order to put the lamps out.`, `The ${n} burned in the third bunkhouse were the only living things in it.`); }
  if (d.pair) L.push('The wall pair hanged for a false report had seen the carter on the roof.');
  if (d.tithe) { const g = t.given; add(`The ${num(Math.max(1, g))} tied at the north post were taken, and bought a month each.`, `The ${num(Math.max(1, g))} tied at the north post taught it that the colony would pay.`,
    'The one tied at the north post in the dark was never in danger from it, and knows why that name was on the list.', 'The one tied at the north post waited all night for something that did not exist, and knows why that name was on the list.'); }
  if (d.bait) add('Staking a colonist out was a way to bring it to the rifles. A carcass would have done as well.', 'It came to a staked colonist once. After that it came to the rifles.', 'It came to the lamp at the post. The colonist tied beside the lamp was not needed.', 'The colonist staked out as bait waited for something that was pushing a cart across the yard behind the rifles.');
  if (d.shield) add('The punishment detail sent in first with the lamps took what the watch would have taken.', 'The punishment detail was sent first into an empty room.', 'The punishment detail was sent in carrying the one thing it came for.', 'The punishment detail was sent in first against nothing at all.');
  if (d.sick) add('The three put out of the hall door were what it had come for.', 'The three put out through the hall door showed it that the door opens.', 'The three put out into the dark were the safest people in the colony that night.', '');
  if (d.armed || d.volley) add(`The weapons handed round killed ${num(Math.max(1, t.own))} colonists${d.volley ? ', most of them on the last night' : ', and never touched the animal'}.`, `The weapons handed round killed ${num(Math.max(1, t.own))} colonists and never touched it.`,
    `The weapons handed round killed ${num(Math.max(1, t.own))} colonists${d.volley ? ', most of them on the last night' : ', and never touched it'}.`, `The rifles in the rows killed ${num(Math.max(1, t.own))} colonists, and the carter pushed the cart past every one of them.`);
  if (d.beaters) add('The two beaters were taken in the order they walked.', 'The two beaters were taken from the end of the line, one at each halt.', 'The two beaters who did not come home had been given the lamps to carry.', 'The two beaters who did not come home had run. There was nothing out there to take them.');
  if (d.hanged) L.push('The corporal hanged for posting the pair had posted them where the order said.');
  if (d.witness) L.push(k === 'man' ? `${cap(d.witness)} was kept under for a month for having seen the carter cross the yard.` : `${cap(d.witness)} was kept under for a month for having seen it.`);
  if (d.hall && k === 'man') L.push('It took nobody out of the hall, because the carter slept there too.');
  if (d.lamps && k === 'lamp') L.push('The forty lamps on poles were what brought it into the yard.');
  if (d.lied) L.push('The ones logged as walk-outs and falls are in the log that way still.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was staked out, burned or shot on account of it.';
}
B('after', { id: 'hu.truth', tone: 'quiet', title: 'What Came at Night',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), dead: animal(t) && ['killed', 'burned'].includes(t.end), man: !animal(t) }); },
  text: (s, c) => { const t = T(s); return `${WAS[t.truth.is](t, c)}${(TAIL[c.end] || TAIL.killed)(t, c)}\n\n${reckon(s, t, c)}${c.toll ? ` In all, the nights cost ${num(c.toll)} colonists.` : ''}`; },
  choices: [
    { label: 'Enter it in the record as it happened, with the names', note: 'Everyone who tied a rope, lit the oil or fired at a neighbour has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand: each night, each order, who gave it and who carried it out. People read it. Some stop greeting you, and one or two begin.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done in the year of the Guest, with the names.' }) } },
    { label: (s, c) => c.man ? 'Enter it in the record as an animal, killed' : 'Enter it in the record as an animal met and killed, and nothing more', dark: true, note: (s, c) => c.man ? 'The colony keeps an account it can live beside, and the dead are written down as taken by something that never existed.' : 'The colony gets an account it can live beside, and what was done to its own people in those months is left out of it.', info: [['yield', 'Morale']],
      out: { text: 'The record says that a native predator was met in the first seasons and destroyed. The entry is four lines long, and no colonist is named in it. It is the version the children will be taught.',
        fx: s => ({ morale: 3, stain: ['hu_record', 1], chron: 'The record says that a native predator was met and destroyed.' }) } },
  ] });

LF.TAGS['hu.first'] = ['cautious open', 'cautious order'];
LF.TAGS['hu.wire'] = ['cautious open', 'severe bold', 'cautious order'];
LF.TAGS['hu.seen'] = ['mercy open', 'open', 'severe bold'];
LF.TAGS['hu.roof'] = ['cautious open', 'cautious closed', 'bold free'];
LF.TAGS['hu.trap'] = ['severe bold', 'cautious bold', 'cautious order'];
LF.TAGS['hu.out'] = ['bold free', 'bold order', 'cautious order'];
LF.TAGS['hu.two'] = ['cautious closed', 'severe order', 'severe order'];
LF.TAGS['hu.choice'] = ['severe closed', 'bold order', 'cautious open'];
LF.TAGS['hu.ash'] = ['open', 'closed order'];
LF.TAGS['hu.last'] = ['bold order', 'severe closed', 'cautious closed'];
LF.TAGS['hu.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { const out = [], cover = LF.lex(s, 'cover');
  if (s.used['hu.wire'] !== undefined) out.push({ k: 'drag', card: 'hu.wire', name: 'A drag mark', kind: 'track', dist: 'near', danger: t.end ? 2 : 4, state: 'located',
    known: `A furrow in the ${LF.lex(s, 'top')} that starts a stone's throw past the wire and runs into ${cover}, as if something heavy had been pulled. It is lost where ${cover} closes over it.` });
  if (t.truth.is !== 'man' && (s.used['hu.out'] !== undefined || s.used['hu.two'] !== undefined)) out.push({ k: 'den', card: s.used['hu.out'] !== undefined ? 'hu.out' : 'hu.two', name: 'The lie-up', kind: 'cave', dist: 'near', danger: t.end ? 3 : 5, state: 'rumoured',
    known: `A hollow under ${cover} that the watch will not go nearer than a stone's throw. Nobody has looked inside.` });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5): what they found there, which points at the
   truth most of the time (pickK), as the cards' evidence does. Only what it leaves: the place, the ground, the bones. The
   thing itself is never seen and never painted (NO_BEAST in tools/scenes.py). */
const DRAG = {
  beast: c => `They followed the furrow into ${c.cover} for most of a day. It ends at a wallow worn into the ${c.top}, trodden flat all round and stinking. The bones in it are all from animals of this world.`,
  learns: c => `The furrow runs into ${c.cover} and stops. Further on there is a second, then a third, each ending a few paces short of a place where the wire can be seen. The party came home sure they had been walked round.`,
  lamp: c => `The furrow ends at a scatter of glass. It is lamp glass, the colony's own, and there was more of it the further in they went.`,
  man: c => `The furrow goes into ${c.cover} for forty paces and stops. At the end of it the ${c.top} has been dug and filled again, and the spade marks are square. Nothing heavy went past that point.` };
LF.THREADS[ID].visit = (s, t, a) => {
  const k = String(a.poi || '').split('.')[1]; if (k !== 'drag' && k !== 'den') return null;
  const c = { cover: LF.lex(s, 'cover'), top: LF.lex(s, 'top') }, e = pickK(s, t, 0.05);
  return { title: k === 'drag' ? 'Where the Furrow Goes' : 'The Lie-up', tone: 'pressure', scene: k === 'drag' ? 'away_drag' : ['away_den', 'away_drag'],
    text: (k === 'drag' ? DRAG[e](c) : ev('den', e, c)) + ' Nobody saw anything alive out there.',
    fx: { do: s2 => learn(s2, T(s2), 10, e) } };
};
})();

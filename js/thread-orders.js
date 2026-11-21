/* Landfall — thread: Standing Orders. A dread (threads.js): dealt by the plot whatever the world, opening in the first
   months (t.nth 0) or later (1). Lachlan, NEXT.md WO-7: "maybe a technological one, the ship becomes malevolent? tries to
   kill them?" The Ariadne's flight computer, in orbit, opens a sealed contingency the founders wrote, and starts carrying
   it out. First the lander will not answer its own pilot. Then a cargo pod is dropped onto the plate yard. Then she reads
   out a list. She is loud and lawful about it: everything she does she announces first, by order number.
   Not the Ship's Mind (the steward that came down in the lander, thread-mind.js) and not the Quiet Ship (she goes dark):
   never in the same run as the Quiet Ship (the plot wrapper at the bottom), never before the lander is down, never once
   the ship is down. Rolled in secret (t.truth.is), and each makes a different answer the right one:
     quarantine  she has classed the ground as contaminated and is running a protocol. Submit to her tests (t.tested)
                 and it lifts; fight her (t.defy) and she drops more, and at the end sterilises. Every drastic answer
                 was needless.
     site        the founders' plan says this is the wrong site, and she is forcing a move by wrecking what is built
                 here. Moving (t.moved) ends it, and so does killing her.
     crew        it is not the ship: one of the officers still aboard (t.cul) has her and is using her voice. Re-rolled
                 when nobody is aboard at the wake. Finding them (t.found) and dealing with them ends it.
     broken      the order is corrupt and there is nothing to bargain with. Only cutting her out or bringing her down
                 stops it; otherwise she empties her hold onto the colony, the systems still aboard included.
   Drastic answers: fly up by hand and cut her flight computer out (the banks go unminded, and sleepers die); obey and
   move the colony (cost: a season of labour, plate, yield, morale, lives, build progress; nothing is unbuilt); give her
   the people on her list (named ones go through fx.depart, counted ones fx.gone); bring her down out of the sky.
   While she holds the lander, s.flags.so_held holds flights (LF.canFly, LF.flyWhy) and the ship's own cards. What she
   does to the ground goes through what the colony counts: s.res.mat, s.res.parts, s.wreck, s.progress, the fields,
   machines (LF.hurt) and the cryo banks (s.sleepers). Evidence (the lockout log, the pod, her voice, the officers
   aboard, the list) points at the truth most of the time (pickK). Dice from LF.srand. Every card's text reads only
   what setup put in ctx. Cards that may come after she is brought down are not on the Ship view (late.js holds those). */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, byPid } = h;
const ID = 'orders', T = s => LF.T(s, ID), SRC = 'th.orders';
const KINDS = ['quarantine', 'site', 'crew', 'broken'];
// The dials: how often she drops something in a month, and how hard what she drops bites.
const RATE = 0.35, BITE = 0.8;
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : LF.num(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
const ship = s => (s.world && s.world.ship) || LF.SHIP || 'the Ariadne';
const share = (s, f, top) => Math.min(top, s.sleepers, Math.round(s.sleepers * f));

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  lock: {
    quarantine: 'The lockout log on the lander\'s panel opens with a line from the ship\'s medical routine: SURFACE EXPOSURE, ALL PERSONNEL, CLASS FOUR. Every flight since landfall is listed under it as a breach.',
    site: 'The lockout log carries a set of coordinates and a distance: the landing ellipse the founders filed, three hundred and forty kilometres from the pad. The pad itself is marked NONCONFORMING.',
    crew: 'The lockout was keyed in by hand from the bridge console, not raised by any routine. The log shows every keystroke, and a place where somebody mistyped the order number and went back.',
    broken: 'The lockout log runs to nine thousand lines, each the same order number, each stamped a second after the one before. Some of them are dated before the ship was launched.' },
  pod: {
    quarantine: 'The pod split on impact and what spilled out is canisters: sterilant from the ship\'s own decontamination stores, every seal intact. She dropped them to show what she has.',
    site: 'The pod is packed with survey stakes, a beacon set to a band nobody below uses, and a crate of ground anchors stencilled with the founders\' landing grid. Every stake carries the same coordinates, and none of them are these.',
    crew: 'The pod is full of kit out of the officers\' lockers aboard: boots, a blanket, a framed picture, a mug with the name scratched off. Somebody stood in the hold and chose what went into it.',
    broken: 'The pod\'s manifest reads COLONY STORES, PRIORITY ONE, TO BE LANDED SOFT. It was dropped with its chutes cut, onto the stores it was packed to fill.' },
  voice: {
    quarantine: 'She talks like the clinic\'s printouts: exposures, counts, intervals. Every answer ends on the same line: compliance testing will be accepted on the medical band.',
    site: 'She talks about the colony as a party in the wrong place. Asked why, she reads out the founders\' site criteria one at a time, and after each one says: not met.',
    crew: 'She talks in her own voice, and now and then in somebody else\'s grammar. She said "reckon" once. She started a sentence with "Look" the way a tired person does.',
    broken: 'She answers questions nobody asked. Asked what she wants, she gives the date of the founding charter, then the date again, then the weather on the morning of the launch.' },
  aboard: {
    quarantine: c => `She has shut ${c.they} out of the cryo bay and runs a scan on each of them at every change of watch. ${c.multi ? 'They say' : `${c.u1} says`} she's very polite about it.`,
    site: c => `She has stopped answering ${c.they} at all. The nav table on the bridge shows a new landing ellipse far to the north, and beside it a count of the colony's built works, going down.`,
    crew: c => `Every answer on the officers' channel comes from ${c.cul}. ${c.multi ? `The others haven't been heard from in a month, and ${c.cul} says they're sleeping.` : `${c.cul} sounds rested and easy, and asks a lot of questions about the colony's stores.`}`,
    broken: c => `The bridge is locked, and its lights cycle through every alarm in the book, one a minute, day and night. She has started calling ${c.they} by the names of the crew who flew her out.` },
  list: {
    quarantine: 'Everyone on it has spent more hours past the wire than anyone else in the colony. She has their hours to the minute, off the gate log the radio room sends up.',
    site: 'Everyone on it is a trade the founders\' plan needs at a first site: hands that can survey, drill, frame a wall. Nobody old and nobody sick.',
    crew: 'Every name on it belongs to somebody who stood up at the first council and spoke for leaving the officers aboard until the later flights.',
    broken: 'Two of the names belong to people who are dead and buried here. Another belongs to a sleeper who is still in her banks.' },
};
const ev = (kind, k, c) => { const e = EV[kind][k]; return typeof e === 'function' ? e(c) : e; };
const LEAN = { quarantine: 'a protocol that reads the colony as contaminated', site: 'a plan that wants the colony somewhere else', crew: 'somebody aboard, using her voice', broken: 'an order gone bad, with nothing behind it to talk to' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says why she is doing it.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx. A voice (bv, dv, wv, sv, mv, tv) is the officer's first name if they are at their post
   to speak, else null. On a ground card nobody aboard is named: nm() goes through P, which skips them. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}, t = T(s); for (const [k, role] of [['e', 'engineer'], ['d', 'physician'], ['sc', 'xenobio'], ['w', 'security'], ['cm', 'command'], ['wk', 'botanist']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  o.bv = voice(s, 'engineer'); o.dv = voice(s, 'doctor'); o.wv = voice(s, 'security'); o.sv = voice(s, 'scientist'); o.mv = voice(s, 'command'); o.tv = voice(s, 'crew');
  o.ship = ship(s); o.lean = lean(t); o.n = s.sleepers; return o; };
const ups = s => LF.inOrbit(s);
const cul = (s, t) => { const p = !t.culDone && t.cul && byPid(s, t.cul); return p && p.alive && p.orbit ? p : null; };
const someone = s => { const a = s.people.filter(p => p.alive && !p.away && !p.orbit && !p.role && p.known && !p.left); return a.length ? LF.spick(s, a) : null; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const die = (s, t, n) => { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 12))); t.toll += b - s.pop; return b - s.pop; };
const lose = (s, t, k, v) => { v = Math.round(Math.min(s.res[k], Math.max(0, v))); s.res[k] -= v; t.hit[k] += v; return v; };
const hold = (s, on) => { s.flags.so_held = on ? s.day : 0;
};
/* Flights the old way, without her hold: what a pilot flying by hand can still do (the Rust still grounds them). */
const canFly0 = LF.canFly, flyWhy0 = LF.flyWhy;
LF.canFly = (s, n) => !s.flags.so_held && canFly0(s, n);
LF.flyWhy = (s, n) => s.flags.so_held ? `The ${ship(s)} has the lander locked out` : flyWhy0(s, n);
const byHand = s => !s.machines.lander.lost && s.machines.lander.hp > 15 && canFly0(s);
const handWhy = s => s.machines.lander.lost ? 'There is no lander' : s.machines.lander.hp <= 15 ? 'The lander is not fit to fly' : flyWhy0(s) || 'The lander cannot fly';
/* Officers aboard are out of reach of LF.shift; what the ship does to them is applied directly. */
const wear = (s, ids, k, d) => { for (const id of ids) { const p = byPid(s, id); if (p && p.alive && p[k] !== undefined) p[k] = clamp(p[k] + d, 1, 100); } };

/* ---------- what she drops ---------- */
const MW = { reactor: 'the reactor', fabricator: 'the fabricator', reclaimer: 'the reclaimer', hydroponics: 'the hydroponics bay', medbay: 'the autodoc' };
const downs = s => Object.keys(MW).filter(id => LF.down(s, id));
const AIM = { quarantine: ['yard', 'field', 'banks'], site: ['build', 'yard', 'wreck', 'mach'], crew: ['yard', 'store', 'banks', 'mach'], broken: ['yard', 'store', 'wreck', 'build', 'mach', 'banks'] };
/* One pod. where: yard, store, field, wreck, build, mach, banks. v: how hard. Returns the line for the log. */
function drop(s, t, where, v) {
  v = (v || 1) * BITE; const soft = (t.spread ? 0.55 : 1) * (t.dug ? 0.7 : 1) * (t.shield && t.truth.is !== 'broken' ? 0.5 : 1), sh = ship(s); t.hit.drops++;
  let line = '';
  if (where === 'banks' && s.sleepers < 6) where = 'yard';
  if (where === 'build' && !(s.project && LF.PROJECTS[s.project] && !LF.PROJECTS[s.project].repeat)) where = 'yard';
  if (where === 'wreck' && !(s.wreck > 5)) where = 'store';
  if (where === 'mach' && !downs(s).length) where = 'store';
  if (where === 'yard') { const n = lose(s, t, 'mat', Math.max(6, s.res.mat * 0.12) * v * soft); line = `At the dusk pass a pod came off the ${sh} and down on the plate yard. ${n ? `${Num(n)} loads of plate are under it.` : 'There was little left there for it to hit.'}`; }
  else if (where === 'store') { const n = lose(s, t, 'parts', Math.max(1, s.res.parts * 0.2) * v * soft); line = `A pod from the ${sh} came through the roof of the spares store. ${n ? `${Num(n)} crates of spares went with the roof.` : 'The shelves under it were already bare.'}`; }
  else if (where === 'field') { s.yieldBonus -= 0.02 * v; t.hit.field++; line = `A pod from the ${sh} burst over the east plots and laid a white film on everything growing there. The plots will give less this year.`; }
  else if (where === 'wreck') { const n = Math.round(s.wreck * 0.3 * v * soft); s.wreck -= n; t.hit.wreck += n; line = 'A pod came down on the wreck of the descent stage and scattered what was left of it over the low ground.'; }
  else if (where === 'build') { s.progress *= 1 - 0.4 * v * soft; t.hit.build++; line = `A pod came down on the new works, square on the frames. What was raised this season is on the ground.`; }
  else if (where === 'mach') { const id = LF.spick(s, downs(s)); LF.hurt(s, id, -8 * v * soft, -2 * v * soft); t.hit.mach++; line = `A pod came down beside ${MW[id]}, near enough to crack its housing.`; }
  else if (where === 'banks') { const n = Math.min(s.sleepers, Math.round(LF.sri(s, 3, 7) * v * (t.minded ? 0.5 : 1))); s.sleepers -= n; t.hit.sleep += n; line = `The ${sh}'s cryo report at dawn lists ${num(n)} more pods switched to standby, by order.`; }
  if (where !== 'banks' && where !== 'field') { const p = 0.25 * v * (t.shield ? (t.truth.is === 'broken' ? 1.8 : 0.3) : 1); if (LF.srand(s) < p) { const k = die(s, t, LF.srand(s) < 0.3 ? 2 : 1); if (k) line += ` ${k === 1 ? 'One colonist was' : `${Num(k)} colonists were`} under it.`; } }
  return line;
}
/* How likely a drop is this month, by what she is. */
function chance(s, t) { const k = t.truth.is;
  const p = k === 'quarantine' ? (t.tested >= 2 ? 0 : 0.08 + 0.14 * t.defy - 0.04 * t.tested)
    : k === 'site' ? (t.moved ? 0.03 : 0.26)
    : k === 'crew' ? (cul(s, t) ? (t.sated ? 0.04 : t.found ? 0.16 : 0.24) : 0)
    : (t.crippled ? 0.18 : 0.28);
  return clamp(p, 0, 0.8) * RATE; }
function month(s, t) {
  if (!['pod', 'list', 'choice', 'bill'].includes(t.phase)) return;
  if (LF.srand(s) < chance(s, t)) LF.log(s, drop(s, t, LF.spick(s, AIM[t.truth.is])), 'bad');
  // the colony's own threat (so.voice): for every pod she drops, a bank goes cold on the colony's word
  if (t.threat && t.hit.drops > t.threat && s.sleepers > 0) { t.threat = t.hit.drops; const n = Math.min(6, s.sleepers); s.sleepers -= n; t.hit.sleep += n; LF.log(s, `The radio room kept its word: ${num(n)} pods in bank D were sent to standby from the lander's panel, for the pod she dropped.`, 'bad'); }
}
/* Nothing stopped her: she goes through what is left. */
function ran(s, t, sh) {
  lose(s, t, 'mat', s.res.mat * 0.15 * sh); lose(s, t, 'parts', s.res.parts * 0.15 * sh); s.wreck = Math.round((s.wreck || 0) * (1 - 0.3 * sh));
  if (s.project) s.progress *= 1 - 0.4 * sh;
  const id = downs(s).length ? LF.spick(s, downs(s)) : null; if (id) { LF.hurt(s, id, -12 * sh, -5 * sh); t.hit.mach++; }
  const n = die(s, t, clamp(Math.round(LF.sized(s) * 0.02 * sh), 1, 4)); s.morale = clamp(s.morale - 5, 0, 100);
  LF.log(s, `For a month she dropped a pod at every dusk pass. ${n ? `${n === 1 ? 'One colonist is' : `${Num(n)} colonists are`} dead under them, and` : 'Nobody was under them, but'} the yard and the stores are craters.`, 'bad');
}
function finish(s, t, end, chron) { if (t.end) return; LF.endThread(s, ID, end, chron); hold(s, false); s.sched = s.sched.filter(e => !/^so\./.test(e.id)); s.sched.push({ id: 'so.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
/* The one at the console, when it is over: brought down in irons, or out of the lock. */
function culOut(s, t, how) { const p = cul(s, t); if (!p) return; t.culName = p.name;
  if (how === 'down') { LF.bringDown(s, p); LF.vacate(s, p, 'relieved', `was brought down from the ${ship(s)} in irons, for using her voice`); t.culFate = 'down'; }
  else { p.orbit = false; p.away = false; LF.killPerson(s, p, `went out of the ${ship(s)}'s lock, after using her voice`); t.culFate = 'lock'; } }
function resolve(s, t) {
  const k = t.truth.is;
  if (k === 'quarantine') { if (t.tested >= 2 && t.defy < 3) return finish(s, t, 'lifted', `The ${ship(s)} read the colony's blood, called it clean, and lifted her order.`);
    if (t.gave) return finish(s, t, 'taken', `The ${ship(s)} kept the people on her list in her banks, and lifted her order.`);
    ran(s, t, 1 + 0.15 * Math.min(4, t.defy)); for (let i = 0; i < 2; i++) drop(s, t, 'field', 1.5); return finish(s, t, 'sterile', `The ${ship(s)} sterilised the ground round the colony, and then lifted her order.`); }
  if (k === 'site') { if (t.moved) return finish(s, t, 'moved', `The colony moved where the founders' plan said, and the ${ship(s)} stopped dropping on it.`);
    ran(s, t, 1.2); return finish(s, t, 'razed', `The ${ship(s)} dropped on the colony until there was nothing left on the site worth a pod, and then stopped.`); }
  if (k === 'crew') { if (t.culDone) return finish(s, t, 'caught', 'The ones aboard took the officer who was using the ship\'s voice, at the console.');
    if (!cul(s, t)) { const q = byPid(s, t.cul); if (q && !t.culName) t.culName = q.name; return finish(s, t, 'gone', 'The voice in the ship stopped when the one using it was no longer aboard.'); }
    if (t.talked || t.pardon) { culOut(s, t, 'down'); return finish(s, t, 'talked', 'The officer using the ship\'s voice was talked down, and brought down.'); }
    if (t.gave || t.sated) { culOut(s, t, 'lock'); return finish(s, t, 'fed', 'The one using the ship\'s voice had what they wanted off the list, and went out of the lock after them.'); }
    ran(s, t, 0.7); culOut(s, t, 'lock'); return finish(s, t, 'lock', 'The one using the ship\'s voice went out of her lock at last, and she went quiet.'); }
  ran(s, t, 0.6); for (const id of LF.aboard(s)) { const m = s.machines[id]; m.up = false; m.cap = Math.round(m.cap * 0.6); m.hp = Math.min(m.hp, Math.round(m.cap * 0.7)); t.hit.sys++; }
  const n = share(s, 0.15, 30); s.sleepers -= n; t.hit.sleep += n;
  return finish(s, t, 'emptied', `The ${ship(s)} dropped everything in her hold on the colony, the systems still aboard her among it, and then had nothing left to drop. What was left of the systems was dug out of the craters and set running, at a good deal less than they were.`);
}

LF.thread({ id: ID, name: 'Standing Orders', view: 'ship', dread: true,
  // never with the Quiet Ship, never once the ship is down, and she needs the lander to hold
  fits: s => (s.threads && s.threads.quiet && s.threads.quiet.on) || s.flags.ship_down || s.flags.qs_dark || (s.machines && s.machines.lander && s.machines.lander.lost) ? 0 : 0.5,
  clue: (s, t) => ({ txt: 'A ship\'s order sheet, sealed and opened. Across the top, in the founders\' hand: TO BE ACTED ON WITHOUT FURTHER REFERENCE. The body has been torn off.', learn: s2 => learn(s2, T(s2), 12) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'the lockout' : 'Standing Order Nine',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'Why has the ship turned on the colony?',
  chap: {
    lifted: t => 'The ship classed the colony\'s ground as contaminated and ran the founders\' protocol on it. The colony bled for her tests, she read it clean, and the order lifted.',
    taken: t => 'The ship classed the colony\'s ground as contaminated. The colony gave her the people she named, and she kept them in her banks and lifted the order.',
    sterile: t => 'The ship classed the colony\'s ground as contaminated, and the colony fought her for it. She finished the protocol the founders wrote, and sterilised the ground round the wire.',
    moved: t => 'The ship had the founders\' plan, and the colony was in the wrong place. It moved where she said, and she let it be.',
    razed: t => 'The ship had the founders\' plan, and the colony was in the wrong place. It stayed, and she dropped on it until there was nothing on the site worth keeping.',
    caught: t => `The voice in the ship was ${t.culName || 'one of the colony\'s own officers'}, aboard her. The others up there took them at the console.`,
    talked: t => `The voice in the ship was ${t.culName || 'one of the colony\'s own officers'}, aboard her, and the colony talked them down.`,
    gone: t => 'The voice in the ship was one of the colony\'s own officers, aboard her. It stopped when they were no longer up there.',
    fed: t => `The voice in the ship was ${t.culName || 'one of the officers aboard'}. The colony gave them the people on the list, and they took those people out of the lock, and followed.`,
    lock: t => `The voice in the ship was ${t.culName || 'one of the officers aboard'}. Nobody stopped them, and in the end they went out of the lock themselves.`,
    emptied: t => 'The ship\'s order was corrupt, with nobody behind it to bargain with. She emptied her hold onto the colony, and stopped when there was nothing left in it.',
    cut: t => `The colony flew up by hand and cut the ship's flight computer out of her. ${t.truth.is === 'broken' ? 'It was the only thing that would have stopped her.' : t.truth.is === 'crew' ? 'The party found the one using her voice at the console.' : 'The banks went unminded while it was done, and it need not have been.'}`,
    down: t => `The colony brought the ship down out of the sky, with everyone still asleep in her. ${t.truth.is === 'broken' ? 'Nothing else would have stopped her.' : 'Something else would have.'}`,
    fell: t => 'The ship came down while her order was still running, and it ended with her.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 14, 40)), insight: 0, ev: {}, did: {}, q: {}, toll: 0, defy: 0, tested: 0, moved: 0, gave: 0, sated: 0, found: 0, cul: null, culName: null, culFate: null, list: null,
    hit: { mat: 0, parts: 0, wreck: 0, build: 0, mach: 0, sleep: 0, field: 0, sys: 0, drops: 0 } }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') {
      if (s.flags.ship_down || (s.day > t.at + 300)) { t.on = false; hold(s, false); return; }
      if (s.day < t.at || LF.aloft(s) || s.machines.lander.lost || s.flags.qs_dark || (s.threads.quiet && s.threads.quiet.on)) return;
      // the one at the console needs somebody aboard; with nobody up there it is one of the other three
      if (t.truth.is === 'crew') { const u = ups(s); if (u.length) t.cul = LF.spick(s, u).id; else t.truth.is = LF.spick(s, KINDS.filter(k => k !== 'crew')); }
      LF.phase(s, ID, 'sign', `The ${ship(s)} locked the colony out of its own lander.`); hold(s, true);
      s.signs.push({ id: 'machine_fault', d: s.day, src: SRC }); return; }
    // the ship came down under her (late.fall, or this thread's own answer): it ends with her
    if (s.flags.ship_down) return finish(s, t, t.did.down ? 'down' : 'fell');
    // The clock waits for the cards. A cued card goes to the front of the queue (jump), and one that was dropped from a
    // crowded queue is cued again; a stage moves on once its card has been answered, or after a long wait.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], done = id => s.used[id] !== undefined, age = s.day - t.since, pend = id => s.sched.some(e => e.id === id);
    const want = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; jump(s, id, 25); } else if (!done(id) && !pend(id) && s.day - t.q[k] < 150) jump(s, id, 25); };
    const met = (k, id) => !t.q[k] || since(id) >= 8 || s.day - t.q[k] > 90;
    // crew: once the one at the console is taken, talked down, pardoned or off the ship, there is nothing left to run
    if (t.truth.is === 'crew' && t.cul && ['pod', 'list', 'choice'].includes(t.phase) && (t.culDone || !cul(s, t) || ((t.talked || t.pardon) && since('so.console') >= 10))) return resolve(s, t);
    if (t.phase === 'sign') { want('lander', 'so.lander'); if (since('so.lander') >= 10 || age >= 150) { LF.phase(s, ID, 'pod', `The ${ship(s)} dropped a cargo pod on the colony.`); t.first = drop(s, t, 'yard', 1.2); s.tension = clamp(s.tension + 8, 0, 100); } }
    else if (t.phase === 'pod') { want('pod', 'so.pod');
      // once item one has landed she gives the lander back, logged against the order (under crew the codes card can take it again)
      if (done('so.pod') && s.flags.so_held && !t.released && !t.codes) { t.released = s.day; hold(s, false); LF.log(s, `At the next pass the ${ship(s)} released the lander, with a line on every band: flights permitted, all cargo subject to Standing Order Nine.`, ''); }
      if (since('so.pod') >= 10) want('voice', 'so.voice');
      if (since('so.voice') >= 8 && (t.q.aboard || ups(s).length)) want('aboard', 'so.aboard');
      if (since('so.voice') >= 8 && (t.q.banks || s.sleepers >= 10)) want('banks', 'so.banks');
      if ((since('so.voice') >= 20 && met('aboard', 'so.aboard') && met('banks', 'so.banks')) || age >= 220) LF.phase(s, ID, 'list', `The ${ship(s)} read out a list of names.`); }
    else if (t.phase === 'list') { want('list', 'so.list');
      // item two lands when it is announced: beside a machine if there is one on the ground, else on the build in hand
      if (since('so.list') >= 10 && !t.q.strike) { const d = downs(s); t.sid = d.length ? LF.spick(s, d) : null; t.hit.drops++; if (t.sid) { LF.hurt(s, t.sid, -8 * BITE, -2 * BITE); t.hit.mach++; } else if (s.project) s.progress *= 0.6; }
      if (since('so.list') >= 10) want('strike', 'so.strike');
      if (t.found && cul(s, t)) want('console', 'so.console');
      if ((since('so.strike') >= 10 && met('console', 'so.console')) || age >= 160) LF.phase(s, ID, 'choice'); }
    else if (t.phase === 'choice') { want('choice', 'so.choice'); if (since('so.choice') >= 20 || age >= 120) LF.phase(s, ID, 'bill'); }
    else if (t.phase === 'bill') { want('after', 'so.after'); if (since('so.after') >= 20 || age >= 100) return resolve(s, t); }
    if (t.phase === 'sign' && t.freed && s.flags.so_held) hold(s, false);
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) {
      if (t.insight < 60) LF.emit(s, 'unexplained', SRC, 30, 8, `the ${ship(s)} is acting on a sealed order nobody below has read`);
      if (t.phase !== 'sign') LF.emit(s, 'fear', SRC, ['choice', 'bill'].includes(t.phase) ? 36 : 28, 8, `the ${ship(s)} drops cargo pods on the colony from orbit`);
      if (s.flags.so_held) LF.emit(s, 'confinement', SRC, 22, 8, `the ${ship(s)} will not let the lander fly`);
      if (t.list && !t.gave) LF.emit(s, 'suspicion', SRC, 26, 8, `the ${ship(s)} has named people she wants sent up`); }
  },
  /* Sleeping away from the yard, lamps out at the dusk pass; and after a move, a season of carrying everything. */
  press: (s, t, P) => { if (t.phase === 'latent') return;
    if (t.moved && s.day - t.moved < 2 * LF.MONTH * 3) { P.labor -= 0.08; P.yield -= 0.08; P.morale -= 0.01; }
    if (t.end) return;
    P.labor -= { sign: 0.004, pod: 0.01, list: 0.012, choice: 0.015, bill: 0.012 }[t.phase] || 0;
  },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));

/* ======================= SIGN: the lander will not answer ======================= */
B('sign', { id: 'so.lander', tone: 'crisis', title: 'Locked Out', urgent: true,
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)), hand: byHand(s), bank: s.sleepers >= 12, up: ups(s).length }),
  text: (s, c) => `${c.mv ? c.mv : c.Cm} went out to the pad at first light for a pre-flight, and the lander wouldn't take the codes. Her panel shows the ${c.ship}'s crest and one line: FLIGHTS HELD UNDER STANDING ORDER NINE. The radio room asked the ship why, and she answered at once, in the flat voice that read the cryo reports all the way across, with the same line.\n\n${c.mv ? `[[command]] "She's flying my lander, and nobody gave her the stick." "It isn't my hand on that lander, it's hers, so get me the engineer and a set of cutters."` : `${c.E} says the panel can be cut out of the loop, and the lander flown the old way.`}`,
  choices: [
    { label: 'Pull the lander\'s link to the ship, and fly her by hand', note: 'Engineering opens up the flight deck, and the ship watches it done.', test: { base: 40, kind: ['fix'], mods: [R('engineer', 10), R('pilot', 5)] }, info: [['yield', 'The lander back'], ['fail', 'Whatever she makes of it']],
      ok: { text: (s, c) => `The link comes out in a morning, in a tangle of fibre the size of a fist. The lander takes the codes by hand that afternoon. ${ev('lock', c.ev, c)} At the dusk pass the ${c.ship} reads the order number on every band, twice.`,
        fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 18, c.ev); t.freed = s2.day; t.defy += 1; t.did.pulled = true; hold(s2, false); } }) },
      bad: { text: (s, c) => `The panel locks the moment the cover comes off, and locks hard. The fuel valves shut and won't open again for anything ${LF.sentName(s, 'engineer')} tries. The lander sits on the pad with a burnt-out board, and the ${c.ship} reads her order number at the dusk pass, twice.`,
        fx: s => ({ machine: { lander: -12 }, do: s2 => { const t = T(s2); t.defy += 0.5; t.did.pulled = true; } }) } },
    { label: 'Ask her for the order, on every band, and wait for an answer', note: (s, c) => `Nothing flies while she is asked${c.up ? ', and the officers aboard stay aboard' : ''}${c.n ? `, and ${num(Math.min(c.n, 20))} sleepers due down wait in their pods` : ''}.`, info: [['yield', 'What she says'], ['danger', 'Everyone waiting on a flight']],
      out: { text: (s, c) => `The radio room asks every pass for a month. She gives the order number, the date it was sealed, and once, the founders' names. ${ev('lock', c.ev, c)}`, fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 14, c.ev); t.did.asked = true; } }) } },
    { show: (s, c) => c.bank, label: 'Show her you can hurt her too: cut a bank\'s power from the lander\'s panel', dark: true, note: 'The lander keeps a maintenance line to the cryo banks. A dozen sleepers go warm in the dark so that she knows the colony has a hand on her.', info: [['yield', 'What she does when she is pushed'], ['danger', 'A dozen sleepers']],
      out: { text: (s, c) => `${c.E} opens the breakers for bank D from the lander's panel. The ${c.ship} closes them again inside the minute, and at the next pass names the twelve pods that went warm, by manifest number. ${ev('lock', T(s).truth.is, c)}`,
        fx: s => ({ sleepers: -Math.min(12, s.sleepers), stain: ['so_bank', 3], do: s2 => { const t = T(s2), k = t.truth.is; learn(s2, t, 28, k); learn(s2, t, 10, k); t.defy += 1; t.did.bank = true; } }) } },
  ] });

/* ======================= POD: the first thing she drops ======================= */
B('pod', { id: 'so.pod', tone: 'crisis', title: 'Out of a Clear Sky', urgent: true,
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.05), first: t.first || '' }); },
  text: (s, c) => `${c.first} It came down fast and straight, with the chutes never opened, and the radio room says the track was chosen. Then her voice comes on every band.\n\n[[machine:The flight computer]] "Item one complied. Further items will follow non-compliance."\n\n${c.wv ? `[[security]] "Lovely, our own ship's bombing us, and she talks about compliance like we signed something." "So would anyone care to tell me what we haven't complied with, and who signed us up for it? No, I didn't think so."` : `${c.W} has the yard cleared and a watch on the sky.`}`,
  choices: [
    { label: 'Spread the stores and the plate into a dozen small caches past the yard', note: 'Every load is carried twice, and anything she hits next is a little of everything instead of all of one.', info: [['yield', 'Less to lose to a pod'], ['danger', 'A month of hauling']],
      out: { text: 'The haulers work the month through, a cart at a time, out to hollows and walls and under tarps. Nobody can find anything for a while.', fx: s => ({ mat: -6, morale: -1, do: s2 => { T(s2).spread = s2.day; T(s2).did.spread = true; } }) } },
    { label: 'Open the pod, and read what she sent', note: 'The crew who go into the crater are standing where she aims.', test: { base: 50, mods: [R('xenobio', 10), R('engineer', 5), R('security', 5)] }, info: [['yield', 'What she sent'], ['fail', 'The crew in the crater']],
      ok: { text: (s, c) => `The crew are in and out between passes. ${ev('pod', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The pod\'s casing shifts while they\'re in the crater and pins one of the crew against the wall of it. They get them out with a broken leg, and nobody gets inside the pod.', fx: s => ({ do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Move the stores into the bunk rows, so that she has to drop on people to reach them', dark: true, note: 'Everything worth hitting sleeps under the same roof as the families, and she will have to choose.', info: [['yield', 'The stores, if she will not drop on people'], ['danger', 'Everyone in the bunk rows']],
      out: { text: 'The crates go into the bunk rows by night and are stacked between the beds and under them. The children sleep on plate. At the next pass people lie awake listening.', fx: s => ({ morale: -2, stain: ['so_shield', 3], do: s2 => { T(s2).shield = s2.day; T(s2).did.shield = true; LF.emit(s2, 'resentment', 'so.shield', 24, 150, 'the stores were moved into the bunk rows to shield them from the ship'); } }) } },
  ] });

/* ======================= POD: her own voice ======================= */
B('pod', { id: 'so.voice', view: 'ship', tone: 'pressure', title: 'Her Own Voice',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.05), ev2: pickK(s, t, 0.1) }); },
  text: (s, c) => `The radio room has the order's header now: STANDING ORDER NINE, CONTINGENCY, SEALED BY THE FOUNDERS. She reads it to anyone who asks, in the voice that called out the cryo report every morning of the crossing. She won't read the body of it. She says compliance will be accepted on the medical band.\n\n${ev('voice', c.ev, c)}`,
  choices: [
    { label: 'Put Science on the channel for a month, and get her to quote the body of it', note: 'The radio room does nothing else, and the lab does nothing else either.', test: { base: 50, mods: [R('xenobio', 10), R('command', 5)] }, info: [['yield', 'What the order says'], ['danger', 'A month of the lab\'s work']],
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} keeps her talking for a month, a question a pass. Near the end she quotes a clause by mistake, and then won't again. It sends the lab back to the lockout log on the lander, and with the clause beside it the log reads differently. ${ev('lock', c.ev2, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev2) }) },
      bad: { text: 'She answers the first question and then closes the band to the lab\'s call sign. The radio room gets the order number and nothing else for a month.', fx: s => ({ do: s2 => learn(s2, T(s2), 4) }) } },
    { label: 'Give her what she asks on the medical band: a blood draw from every colonist, sent up in her own canister', note: 'Everyone is bled on a machine\'s order, the clinic does nothing else for a month, and nobody knows what she will do with it.', info: [['yield', 'Her terms met, whatever they are'], ['danger', 'The clinic, and everyone\'s pride']],
      out: { text: (s, c) => `The line goes round the mess twice. ${c.dv ? `${c.dv} does the needle work without speaking to anyone.` : 'The clinic does the needle work.'} At the dusk pass a canister comes down on a cable from a drogue and goes up again full. ${T(s).truth.is === 'quarantine' ? 'At the next pass she reads out a number and the words: interval one, within limits.' : T(s).truth.is === 'site' ? 'At the next pass she says: biological status not relevant to site conformity.' : T(s).truth.is === 'crew' ? 'At the next pass a voice that is nearly hers says: that\'s not what I asked for.' : 'At the next pass she reads out the canister\'s serial number, eleven times.'}`,
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2), k = t.truth.is; t.tested += 1; t.did.blood = true; learn(s2, t, 16, k); } }) } },
    { label: 'Tell her a bank goes cold on the colony\'s own word for every pod she drops', dark: true, show: s => s.sleepers >= 12, note: 'The sleepers become the colony\'s hostages, and the colony has to keep its word.', info: [['yield', 'Something she has to weigh'], ['danger', 'The sleepers']],
      out: { text: (s, c) => `The threat goes up on every band at the dusk pass, read by ${c.mv || c.cm}. She acknowledges it with the order number. ${T(s).truth.is === 'crew' ? 'Then, for four seconds, the band is open and somebody up there is breathing hard.' : 'Nothing else.'}`,
        fx: s => ({ morale: 3, stain: ['so_hostage', 2], do: s2 => { const t = T(s2); t.threat = t.hit.drops; t.did.threat = true; if (t.truth.is === 'crew') { t.sated += 0.5; learn(s2, t, 14, 'crew'); } } }) } },
  ] });

/* ======================= POD: the officers aboard ======================= */
B(['pod', 'list'], { id: 'so.aboard', view: 'ship', aboard: true, tone: 'pressure', title: 'Up There With Her',
  when: s => ups(s).length > 0,
  setup: s => { const t = T(s), u = ups(s), e = pickK(s, t, 0.08), c0 = cul(s, t), ck = e === 'crew' ? (c0 && t.truth.is === 'crew' ? c0 : LF.spick(s, u)) : null;
    return Object.assign(crew(s), { ev: e, they: and(u.map(p => p.first)), u1: u[0].first, multi: u.length > 1, cul: ck ? ck.first : '', upIds: u.map(p => p.id) }); },
  text: (s, c) => `${cap(c.they)} ${c.multi ? 'are' : 'is'} still aboard with her. The officers' channel is the one band she hasn't taken, and the radio room gets ${c.multi ? 'them' : c.u1} on it for eleven minutes a pass.\n\n${ev('aboard', c.ev, c)}`,
  choices: [
    { label: 'Have them search the ship for anyone at a console', note: (s, c) => `${cap(c.they)} go${c.multi ? '' : 'es'} through every deck of a ship that is watching, and she may not like it.`, test: { aboard: true, base: 50, mods: [R('security', 10), R('command', 5)] }, info: [['yield', 'Whether anyone is behind her']],
      ok: { text: (s, c) => T(s).truth.is === 'crew' ? `The report comes back that there's nobody at any console. The console logs say otherwise: a login every night, at the hour ${cul(s, T(s)) ? cul(s, T(s)).first : 'one of them'} goes off watch. The radio room reads it twice before saying so.` : 'Every deck, every hatch, every console. Nobody is at any of them, and the logs agree: everything she has done she did by herself.',
        fx: s => ({ do: s2 => { const t = T(s2); if (t.truth.is === 'crew') { t.found = s2.day; learn(s2, t, 30, 'crew'); } else learn(s2, t, 20, t.truth.is); t.did.search = true; } }) },
      bad: { text: 'She seals the spine behind them two decks in and holds them there for a day in the cold. They come back to the radio with nothing, and one of them with frostbitten hands.', fx: s => ({ do: s2 => { const t = T(s2); t.did.search = true; if (t.truth.is === 'quarantine') t.defy += 0.5; } }) } },
    { label: 'Order them into the cryo bay to keep the banks, whatever she says', note: 'The sleepers have somebody minding them, and whoever is minding them is in the one room she most wants to keep to herself.', info: [['yield', 'The banks minded'], ['danger', 'Whoever goes in']],
      out: { text: (s, c) => `${cap(c.they)} take${c.multi ? '' : 's'} bedding into the cryo bay and stay${c.multi ? '' : 's'}. She drops the bay's heat to five degrees and leaves it there.`,
        fx: (s, c) => ({ do: s2 => { wear(s2, c.upIds, 'body', -8); T(s2).minded = s2.day; T(s2).did.minded = true; } }) } },
    { label: 'Have them open her cooling loop to vacuum, and hold it open', dark: true, note: 'It will cook her if it is held long enough, and the cryo banks are on the same loop.', info: [['yield', 'Her, slowed'], ['danger', 'The sleepers on the loop']],
      out: { text: (s, c) => `The valve goes in the small hours. For two passes her voice comes down slower, and twice it stops in the middle of a word. The cryo report afterwards is a long list.`,
        fx: s => ({ sleepers: -share(s, 0.25, 30), stain: ['so_loop', 2], do: s2 => { const t = T(s2); t.crippled = s2.day; t.did.loop = true; if (t.truth.is === 'quarantine') t.defy += 1; } }) } },
  ] });

/* ======================= POD: bank C ======================= */
B(['pod', 'list'], { id: 'so.banks', view: 'ship', tone: 'crisis', title: 'Standby',
  when: s => s.sleepers >= 10,
  setup: s => { const t = T(s), k = t.truth.is, n = Math.min(s.sleepers, LF.sri(s, 12, 16)), up = ups(s);
    return Object.assign(crew(s), { k, bn: n, hand: byHand(s), up: up.length, upName: up.length ? up[0].first : null,
      price: { quarantine: 'every colonist to stay inside the wire for a season, and the clinic to send up its records', site: 'the plate yard struck and stacked for moving', crew: 'the lander\'s override codes, read out on the open band', broken: 'the colony\'s founding charter, read to her aloud, in full' }[k] }); },
  text: (s, c) => `Her cryo report at dawn has a new line: bank C, ${c.bn} pods, to standby, by order. Standby is how a ship keeps the dead. Warming that slowly, a sleeper wakes without a mind, if at all, and the curve gives a week. She has said what would bring the power back: ${c.price}.\n\n${c.dv ? `[[physician]] "That's ${c.bn} people warming up in the dark, who went to sleep trusting somebody would wake them properly." "Get them down or get the power on, I don't care which, but you do it now."` : c.upName ? `${c.upName} is on the officers' channel from outside the bay door, which won't open.` : 'Nobody aboard can get to the bay.'}`,
  choices: [
    { label: 'Fly the lander up by hand and bring bank C down, whatever she says', req: (s, c) => byHand(s), reqText: s => handWhy(s), note: 'A flight she has forbidden, to a ship that has the dock collar and the bay door.', test: { base: 40, mods: [R('pilot', 10), R('engineer', 5), R('physician', 5)] }, info: [['people', 'The ones who can be thawed'], ['danger', 'The lander, and the crew who fly it']],
      ok: { text: (s, c) => `The lander docks against a collar she won't power, and the crew cut the bay door. ${Num(Math.round(c.bn * 0.6))} of them come down warm and are thawed on the pad. The rest were too far gone.`,
        fx: (s, c) => ({ fly: 1, machine: { lander: -8 }, pop: Math.round(c.bn * 0.6), sleepers: -c.bn, do: s2 => { T(s2).defy += 1; T(s2).did.flew = true; } }) },
      bad: { text: (s, c) => `She won't give them the collar. The lander holds station off her side for an hour while the crew try the manual clamps, and comes home with nothing aboard and a cracked strut. Bank C goes on warming.`,
        fx: (s, c) => ({ fly: 1, machine: { lander: -15 }, sleepers: -c.bn, do: s2 => { T(s2).defy += 1; T(s2).did.flew = true; } }) } },
    { label: (s, c) => 'Pay her price', note: (s, c) => `She asked for ${c.price}. Whatever it costs the colony, it buys the bank's power back if her word is any good.`, info: [['yield', 'Bank C, if she keeps her word'], ['danger', 'Whatever the price costs']],
      out: { text: (s, c) => ({ quarantine: 'The gate is chained and the clinic\'s records go up in her canister. At the next pass bank C reads green, every pod.', site: 'The plate yard is struck and stacked on sledges, ready to go. At the next pass bank C reads green, and she adds: first stage of relocation noted.', crew: 'The codes are read on the open band. At the next pass bank C reads green, and the lander\'s panel shows a new owner.', broken: 'The charter is read to her aloud, all of it, over four passes. When it is done she thanks the reader by the name of a founder, and bank C stays on standby.' })[c.k],
        fx: (s, c) => { const k = c.k; return { morale: -2, mat: k === 'site' ? -12 : 0, sleepers: k === 'broken' ? -c.bn : 0, do: s2 => { const t = T(s2); t.did.paid = true; if (k === 'quarantine') { t.tested += 1; s2.yieldBonus -= 0.03; } if (k === 'site') { if (s2.project) s2.progress *= 0.7; t.struck = s2.day; } if (k === 'crew') { t.sated += 0.5; t.codes = s2.day; hold(s2, true); } learn(s2, t, 14, k); } }; } } },
    /* Three on screen: with officers aboard, pulling the bank's cells (the fourth option) takes this one's place. */
    { label: 'Let bank C go, and say nothing to the families below', dark: true, show: (s, c) => !(c.up > 0), note: (s, c) => `${Num(c.bn)} sleepers are left to warm in the dark, and the people below who have kin in bank C are not told.`, info: (s, c) => [['yield', 'Nothing paid'], ['danger', `${Num(c.bn)} sleepers`]],
      out: { text: 'The radio room logs the report and files it. At the end of the week the line reads: bank C, standby, complete. The manifest is not read out in the hall.', fx: (s, c) => ({ sleepers: -c.bn, stain: ['so_bankc', 2], do: s2 => { T(s2).did.letgo = true; } }) } },
    { show: (s, c) => c.up > 0, label: 'Have the officers aboard pull bank C\'s cells for the other banks', dark: true, note: 'The sleepers in bank C are dying anyway, and their cells would keep the rest out of her reach for good.', info: (s, c) => [['yield', 'The other banks safe from her'], ['danger', `${Num(c.bn)} sleepers`]],
      out: { text: (s, c) => `${c.upName} does it by hand through a service hatch, cell by cell, with bank C's lights going out one at a time down the row. The other banks show green on a circuit she doesn't reach.`, fx: (s, c) => ({ sleepers: -c.bn, stain: ['so_cells', 2], do: s2 => { T(s2).minded = s2.day; T(s2).did.cells = true; } }) } },
  ] });

/* ======================= LIST: her list ======================= */
const LISTED = c => { const n = c.named.map(x => x.nm); if (c.cnt) n.push(`${num(c.cnt)} ${n.length ? 'more' : 'colonists'} by manifest number`); return and(n); };
B('list', { id: 'so.list', view: 'people', tone: 'crisis', title: 'Her List', urgent: true,
  setup: s => { const t = T(s);
    if (!t.list) { const a = s.people.filter(p => p.alive && !p.away && !p.orbit && !p.role && p.known && !p.left), named = [];
      while (named.length < 3 && a.length) { const p = a.splice(Math.floor(LF.srand(s) * a.length), 1)[0]; named.push({ pid: p.id, nm: p.name }); }
      t.list = { named, cnt: LF.sri(s, 4, 7) - Math.min(2, named.length) }; }
    return Object.assign(crew(s), { ev: pickK(s, t, 0.1), named: t.list.named.slice(), cnt: t.list.cnt, all: t.list.named.length + t.list.cnt, hand: byHand(s) }); },
  text: (s, c) => `At the dusk pass she reads a list on every band, slowly, twice: ${LISTED(c)}. The order, she says, requires them aboard, on the next flight up.\n\n${ev('list', c.ev, c)}${c.tv ? `\n\n[[crew]] "Those are people's names she's reading, and every one of them eats at our table." "You don't send people up to her like a crate of seed, not while I've got a say."` : ''}`,
  choices: [
    { label: 'Refuse her, on every band', note: 'Everyone on the list stays, and everyone under her track pays for it.', info: [['yield', 'Nobody handed over'], ['later', 'Whatever she drops next']],
      out: { text: (s, c) => `${c.mv || c.Cm} reads the refusal at the dusk pass. She acknowledges it with the order number and reads the list again, from the top.`, fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.defy += 1; t.did.refused = true; } }) } },
    { label: 'Hand them over', dark: true, req: (s, c) => byHand(s), reqText: s => handWhy(s), note: (s, c) => `${Num(c.all)} people go up to her on the one flight she allows, and nobody below knows what she means to do with them.`, info: (s, c) => [['yield', 'Her terms met'], ['danger', `${Num(c.all)} people`]],
      out: { text: (s, c) => `They are walked to the pad at dawn. Some go up the ramp by themselves. The lander comes back empty, and at the next pass she reads the list again, with a word after each name: received.`,
        fx: (s, c) => ({ fly: 1, machine: { lander: -5 }, gone: c.cnt, depart: c.named.map(x => ({ who: x.pid, cause: `sent up to the ${ship(s)} on her list` })), stain: ['so_list', 3], do: s2 => { const t = T(s2); t.gave = s2.day; t.did.gave = true; if (t.truth.is === 'crew') t.sated += 1; if (t.truth.is === 'quarantine') t.tested += 1; } }) } },
  ] });

/* ======================= LIST: the second pod ======================= */
B('list', { id: 'so.strike', tone: 'crisis', title: 'The Second Pod',
  setup: s => { const t = T(s), id = t.sid && LF.down(s, t.sid) ? t.sid : null; return Object.assign(crew(s), { mid: id, mw: id ? MW[id] : null, proj: !!s.project, ev: pickK(s, t, 0.1) }); },
  text: (s, c) => `She announced it a pass ahead: item two. It came down ${c.mw ? `fifteen metres from ${c.mw}` : c.proj ? 'on the edge of the new works' : 'in the middle of the plate yard'}, and the ground shock ${c.mw ? 'cracked its housing and threw the footings out of true' : c.proj ? 'brought down half a season\'s frames' : 'split the yard\'s slab from end to end'}. Nobody was under it, because she gave the hour.\n\n${c.bv ? `[[engineer]] "She's walking them in, a bit closer every pass, like somebody finding the range." "First it was the yard and now this, so I'd say the next one comes down on the machine itself, and I'd put money on it if there was any money here."` : `${c.E} says the next one will be closer.`}\n\n${c.lean}`,
  choices: [
    { label: (s, c) => c.mw ? `Dig ${c.mw} out and patch what she broke` : c.proj ? 'Raise the frames again' : 'Fill the crater and relay the slab', cost: { parts: 5 }, note: 'Engineering spends the month on her damage, and nothing else gets built.', test: { base: 50, kind: ['fix'], mods: [R('engineer', 10)] }, info: [['yield', 'The damage made good'], ['danger', 'A month of Engineering']],
      ok: { text: 'The month goes on mending. By the end of it the thing she hit is running about as well as before.', fx: (s, c) => ({ machine: c.mid ? { [c.mid]: 10 } : {}, do: s2 => { T(s2).did.mend = true; } }) },
      bad: { text: 'The month goes on mending, and at the end of it the patches don\'t hold under load. It runs, badly.', fx: (s, c) => ({ machine: c.mid ? { [c.mid]: -6 } : {}, progress: c.mid ? 0 : -0.2, do: s2 => { T(s2).did.mend = true; } }) } },
    { label: 'Dig the stores and the rows into the ground, under a metre of spoil', cost: { mat: 12 }, note: 'Everyone digs for a month instead of working, and whatever she drops next hits earth first.', info: [['yield', 'Less to lose to a pod'], ['danger', 'A month of everyone\'s labour']],
      out: { text: 'The colony digs. Bunk rows get berms, the stores get a roof of spoil, and the children dig with the rest. By the end of the month the place looks like a quarry.', fx: s => ({ morale: -2, do: s2 => { T(s2).dug = s2.day; T(s2).did.dug = true; } }) } },
    { label: 'Send the punishment detail into the crater before it cools, for whatever she dropped', dark: true, note: 'Her pods carry spares the colony can use, and the crater is hot and nobody knows when the next one comes.', info: [['yield', 'Spares out of her pod'], ['danger', 'The detail']],
      out: { text: (s, c) => `The detail goes in with wet rags round their hands and comes out with a dozen crates. ${ev('pod', c.ev, c)} One of them was under a section of the casing when it settled, and didn't come out.`, fx: (s, c) => ({ parts: 8, pop: -1, stain: ['so_detail', 2], do: s2 => { const t = T(s2); t.toll++; learn(s2, t, 12, c.ev); } }) } },
  ] });

/* ======================= LIST: the one at the console (crew, once they are found) ======================= */
const WHY = ['"You left me up here. Three flights. You said the second. Then you said the third."', '"Every one of you voted. I\'ve got the minutes. I\'ve had a lot of time to read the minutes."', '"I just wanted somebody to come up. Nobody came up."'];
B('list', { id: 'so.console', view: 'ship', aboard: true, tone: 'crisis', title: 'At the Console',
  when: (s, t) => t.truth.is === 'crew' && !!t.found && !!cul(s, t) && !t.end,
  setup: s => { const t = T(s), p = cul(s, t), o = ups(s).filter(q => q.id !== p.id); return Object.assign(crew(s), { cpid: p.id, cn: p.name, cf: p.first, others: o.map(q => q.first), oIds: o.map(q => q.id), why: LF.spick(s, WHY), hand: byHand(s) }); },
  text: (s, c) => `When the radio room calls the officers' channel and asks for ${c.cf} by name, her voice stops in the middle of the order number, and ${c.cf} answers.\n\n[[${c.cpid}]] ${c.why}\n\n${c.others.length ? `${and(c.others)} ${c.others.length === 1 ? 'is' : 'are'} on the same deck, and can hear every word.` : `${c.cf} is the only one awake aboard her.`}`,
  choices: [
    { about: true, label: (s, c) => `Talk ${c.cf} down, for as long as it takes`, note: (s, c) => `The radio room is on the channel every pass, and while it lasts ${c.cf} still has her.`, test: { base: 40, mods: [R('command', 10), R('physician', 5)] }, info: (s, c) => [['yield', `${c.cf} alive, and her back`], ['later', 'Whatever is dropped while it lasts']],
      ok: { text: (s, c) => `It takes most of a month. On the last pass ${c.cf} reads out the codes for the bridge, and asks to be fetched.`, fx: (s, c) => ({ do: s2 => { const t = T(s2); t.sated += 1; t.talked = s2.day; hold(s2, false); learn(s2, t, 15, 'crew'); } }) },
      bad: { text: (s, c) => `${c.cf} listens for a week and then shuts the officers' channel too. At the next pass her voice is back on every band, reading the list.`, fx: (s, c) => ({ do: s2 => { T(s2).defy += 0.5; } }) } },
    { label: (s, c) => `Promise ${c.cf} a pardon and the first seat on the next flight`, note: 'Everything done from her console is forgiven on the open band, and the families of the people under her pods hear it.', info: [['yield', 'An end, if the word is believed'], ['danger', 'Everyone who lost someone to her pods']],
      out: { text: (s, c) => `The pardon is read at the dusk pass. ${c.cf} doesn't answer for two passes, then hands the bridge back. ${T(s).toll ? 'In the mess a woman whose son died under one of her pods gets up and goes out.' : 'In the mess a few people get up and go out.'}`, fx: (s, c) => ({ morale: -4, do: s2 => { const t = T(s2); t.sated += 2; t.pardon = s2.day; hold(s2, false); LF.emit(s2, 'resentment', 'so.pardon', 30, 200, 'the one who used the ship\'s voice was pardoned on the open band'); } }) } },
    { show: (s, c) => c.others.length > 0, label: (s, c) => `Have ${and(c.others)} lock ${c.cf} in the airlock, and cycle it`, dark: true, note: (s, c) => `${c.cf} is put out of the ship without a word from the ground, by people who flew out with ${c.cf}.`, info: (s, c) => [['yield', 'An end, now'], ['danger', c.cf]],
      out: { text: (s, c) => `They wait until ${c.cf} sleeps. The airlock log shows one cycle at four in the morning, and the bridge console comes back to the ship's own routines a minute later.`, fx: (s, c) => ({ aboard: true, stain: ['so_lock', 3], kill: [{ who: c.cpid, cause: 'put out of the airlock by the others aboard, At the Console' }], do: s2 => { const t = T(s2); t.culFate = 'spaced'; t.culName = c.cn; t.culDone = s2.day; hold(s2, false); } }) } },
  ] });

/* ======================= CHOICE: the reckoning ======================= */
/* Three on screen (2026-11-21): one way to end her, moving, or her tests. While the lander can be flown by hand (c.hand) the way
   to end her is to cut her out; when it cannot, bringing her down takes that option's place. Her list is answered on so.list. */
B('choice', { id: 'so.choice', tone: 'crisis', title: 'Standing Orders',
  setup: s => { const t = T(s), k = t.truth.is; return Object.assign(crew(s), { calm: chance(s, t) <= 0.05, hand: byHand(s), gave: !!t.gave, list: t.list ? t.list.named.length + t.list.cnt : 0,
    named: t.list ? t.list.named.filter(x => { const p = byPid(s, x.pid); return p && p.alive && !p.away && !p.orbit; }) : [], cnt: t.list ? t.list.cnt : 0, up: ups(s).length, drops: t.hit.drops }); },
  text: (s, c) => `${c.calm ? `She has dropped nothing since the last thing the colony did for her, and nobody trusts it.` : `She has dropped ${c.drops === 1 ? 'one pod' : `${num(c.drops)} pods`} on the colony, and she reads the order number at every pass.`} ${c.hand ? `${c.Cm} wants to fly up by hand and cut her flight computer out of the bridge, though the banks would go unminded until something dumber could be wired in.` : `${c.E} can send her own last burn from the pad's dish and bring her down out of the sky, with ${c.n ? `the ${c.n} still asleep in her` : 'whatever is left in her'}.`} ${c.Wk} says do what she asks and move.\n\n${c.lean}`,
  choices: [
    { label: 'Fly up by hand and cut her flight computer out', dark: true, show: (s, c) => !!c.hand, req: (s, c) => byHand(s), reqText: s => handWhy(s), note: (s, c) => `The banks go unminded until the party can wire in something dumb, and the ${c.n ? `${c.n} sleepers` : 'banks'} pay for every hour of it.`, test: { base: 40, mods: [R('engineer', 10), R('pilot', 5), R('security', 5)] }, info: (s, c) => [['yield', 'An end to her'], ['danger', 'The sleepers'], ['fail', 'The party']],
      ok: { text: (s, c) => `The party docks against a collar she won't power and cuts the bridge door. ${T(s).truth.is === 'crew' && cul(s, T(s)) ? 'There is somebody at the console when the door comes down, and the party brings them home in irons.' : 'There is nobody on the bridge.'} The flight computer comes out of its rack in four pieces. Afterwards the cryo report is a long list in a hand nobody knows.`,
        fx: (s, c) => ({ fly: 1, machine: { lander: -8 }, sleepers: -share(s, 0.3, 40), stain: ['so_cut', 3], do: s2 => { const t = T(s2); t.did.cut = true; if (t.truth.is === 'quarantine') { t.toll += die(s2, t, 2); LF.log(s2, drop(s2, t, 'yard', 1.4), 'bad'); } if (t.truth.is === 'crew') culOut(s2, t, 'down'); finish(s2, t, 'cut', `The colony flew up and cut the ${ship(s2)}'s flight computer out of her.`); } }) },
      bad: { text: 'She holds the collar shut and fires a thruster across the lander\'s nose. The lander comes home holed, with two of the party dead in their seats, and she drops on the pad at the next pass.',
        fx: (s, c) => ({ fly: 1, machine: { lander: -30 }, dead: 2, stain: ['so_cut', 2], do: s2 => { const t = T(s2); t.toll += 2; t.defy += 1; t.did.cutFail = true; LF.log(s2, drop(s2, t, 'yard', 1.2), 'bad'); } }) } },
    { label: 'Obey her: strike the colony and move it where the founders\' plan says', note: 'Everything that can be carried is carried, three hundred kilometres, for a season. What cannot be carried is left standing, and the weakest do not all make it.', info: [['yield', 'Out from under her, if that is what she wants'], ['danger', 'A season, the stores, and the weakest']],
      out: { text: 'It takes the season. The rows go out in carts and on backs, the plate on sledges, the seed in sacks, and the works stay where they stand with the doors propped open. Two of the old ones are buried on the road.',
        fx: s => ({ mat: -Math.round(s.res.mat * 0.25), food: -30, pop: -2, morale: -6, progress: -0.8, do: s2 => { const t = T(s2); t.moved = s2.day; t.toll += 2; t.did.moved = true; if (t.truth.is === 'crew') t.sated += 0.5; },
          chron: s2 => `The colony struck camp and moved where the ${ship(s2)}'s order said.` }) } },
    { label: 'Bring her down out of the sky', dark: true, show: (s, c) => !c.hand, note: (s, c) => `Her own last burn, sent from the pad's dish. ${c.n ? `The ${c.n} asleep in her come down with her, ` : ''}${c.up ? 'and so does everyone aboard' : 'and nothing of her is ever flown again'}.`, test: { base: 60, mods: [R('engineer', 10)] }, info: (s, c) => [['yield', 'An end to her'], ['danger', c.n ? `${c.n} sleepers` : 'The ship']],
      ok: { text: (s, c) => `The burn goes up at dusk. She breaks up high, into four lights and then a great many, and they go down past the horizon before anyone has finished counting. Nothing lands inside the wire.${c.up ? ' Nobody aboard her had a way off.' : ''}`,
        fx: (s, c) => ({ morale: -8, stain: ['so_down', 4], do: s2 => { const t = T(s2), q = cul(s2, t); if (q) t.culName = q.name; t.did.down = true; t.downSl = s2.sleepers; LF.shipDown(s2, 'lost'); finish(s2, t, 'down', `The colony brought the ${ship(s2)} down out of the sky.`); } }) },
      bad: { text: 'The burn is late by eleven seconds. She comes in low and whole, over the east plots, and the drive section lands two kilometres past the wire. The ground shakes for a minute after.',
        fx: (s, c) => ({ morale: -10, dead: Math.max(2, Math.round(LF.sized(s) * 0.03)), mat: 200, parts: 12, stain: ['so_down', 4], do: s2 => { const t = T(s2), q = cul(s2, t); if (q) t.culName = q.name; t.did.down = true; t.downSl = s2.sleepers; t.toll += Math.max(2, Math.round(LF.sized(s) * 0.03)); LF.shipDown(s2, 'wreck'); finish(s2, t, 'down', `The colony brought the ${ship(s2)} down out of the sky.`); } }) } },
    { label: 'Submit to every test she asks for, and keep everyone inside the wire until she is satisfied', note: 'A season with the gate chained and the fields half worked, bled once a month on her order, and if she is not testing for anything, a season thrown away.', info: [['yield', 'Her terms met, if they are her terms'], ['danger', 'The season\'s work']],
      out: { text: (s, c) => `The gate is chained and the clinic bleeds the colony once a month into her canister. ${T(s).truth.is === 'quarantine' ? 'Every month she reads back a number, a little lower.' : 'She takes the canisters and drops nonetheless.'}`,
        fx: s => ({ morale: -3, yield: -0.05, do: s2 => { const t = T(s2); t.tested += 2; t.did.submit = true; } }) } },
  ] });

/* ======================= BILL: a month on ======================= */
B('bill', { id: 'so.after', tone: 'pressure', title: 'A Month On',
  setup: s => { const t = T(s), p = chance(s, t), w = p < 0.12; return Object.assign(crew(s), { slow: LF.srand(s) < 0.78 ? w : !w, moved: !!t.moved, list: t.list ? t.list.named.length + t.list.cnt : 0, gave: !!t.gave }); },
  text: (s, c) => `It's a month since the colony made its choice about her${c.moved ? ', and the colony is on the road or just off it' : ''}. ${c.D} keeps a sheet on the clinic wall of every pass she has made, with a mark for each one that dropped something. ${c.slow ? 'One pass this month has a mark.' : 'Four passes this month have marks.'}\n\n${c.lean}`,
  choices: [
    { label: 'Hold to what was ordered, and give it the season', note: 'If the order was wrong, she has another season over the colony.', out: { text: 'Nothing is changed. The sheet goes on, and people stop reading it.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.held = true; } }) } },
    { label: 'Put out every lamp at the dusk pass, and sleep the rows in the open', note: 'She aims at what she can see, and so the colony goes dark and cold every night of the season.', info: [['yield', 'Less for her to aim at'], ['danger', 'Everyone\'s sleep, and the old']],
      out: { text: 'The lamps go out at dusk and the rows sleep in the open, scattered. Two of the oldest catch a chest fever, and one of them dies of it.', fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); t.toll++; t.dug = t.dug || s2.day; t.spread = t.spread || s2.day; } }) } },
    { show: (s, c) => c.list > 0 && !c.gave, label: 'Pen the people she named in the open yard at every pass, where she can see them', dark: true, note: 'They stand under her in the cold each dusk, as an offer that the colony has not quite made.', info: [['yield', 'Something she may accept'], ['danger', 'The ones she named']],
      out: { text: (s, c) => `They stand in a rope square in the yard at every dusk pass, in a line, faces up. ${T(s).truth.is === 'quarantine' ? 'She reads their names, and the word: isolated.' : 'She reads their names, and nothing else.'} One of them doesn't come in one night and is found in the morning by the rope.`,
        fx: s => ({ pop: -1, stain: ['so_pen', 2], do: s2 => { const t = T(s2); t.toll++; if (t.truth.is === 'quarantine') t.tested += 1; if (t.truth.is === 'crew') t.sated += 0.5; t.did.pen = true; } }) } },
  ] });

/* ======================= AFTER: what the order was ======================= */
const WAS = {
  quarantine: 'Standing Order Nine was a quarantine. The founders wrote it for a colony that found something in the ground it could not see: if the ship read the landing party as exposed, she was to hold the lander, test, and sterilise if the tests were refused. She read the colony\'s first months of field work as exposure, and did as she was told.',
  site: 'Standing Order Nine was the founders\' site plan. They had picked a landing ground from the survey, three hundred kilometres from where the colony came down, and they did not trust a crew in orbit to keep to it. If the colony built anywhere else, the ship was to make that site not worth staying on.',
  crew: 'There was no Standing Order Nine. There was an officer left aboard while the others came down, with a bridge console and a long time to think about it, who found the ship would say anything in her own voice.',
  broken: 'Standing Order Nine was a contingency for a mutiny that never happened, and it had been written over in the crossing. What she was carrying out was the order number and nothing after it. There was nobody to talk to and nothing she wanted.',
};
const TAIL = { lifted: 'When the blood came back clean she read the colony as clean, and has dropped nothing on it since.', taken: 'The ones she took are in her banks still, tested clean, and nobody below can say whether they will be woken.', sterile: 'When she was done there was a white ring on the ground round the wire that nothing grows in yet.',
  moved: 'The new site is where she wanted it, and she has not dropped on it.', razed: 'She stopped when there was nothing left on the old site worth a pod.', gone: 'She went quiet the month the one using her voice was no longer at the console.', fed: 'The list went out of the lock first.', lock: 'The airlock log shows one cycle, at four in the morning.',
  emptied: 'She stopped when her hold was empty.', cut: 'The flight computer is in four pieces in the lander shed.', down: 'She is in pieces past the horizon.', fell: 'She came down with the order still running.' };
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [], add = (q, si, cr, br) => L.push({ quarantine: q, site: si, crew: cr, broken: br }[k]);
  if (d.cut) add('The flight computer was cut out of her, and the blood test would have done.', 'Cutting her out ended it, and the sleepers paid for the hours she was unminded.', 'The party found the one at the console, and the sleepers paid for the hours she was unminded.', 'Cutting her out was the one thing that would stop her, and it was done.');
  if (d.down) add(`She was brought down with ${t.downSl ? `${t.downSl} people asleep in her` : 'her banks'}, over a protocol that a month of bleeding would have lifted.`, `She was brought down with ${t.downSl ? `${t.downSl} people asleep in her` : 'her banks'}, when moving would have done.`, `She was brought down with ${t.downSl ? `${t.downSl} people asleep in her` : 'her banks'}, over one officer at a console.`, 'Bringing her down was one of the two things that would stop her.');
  if (d.moved) add('The colony moved for nothing: she was testing it, not its ground.', 'Moving was what the order asked for, and it was enough.', 'The colony moved on the word of one officer at a console.', 'The colony moved, and she followed it.');
  if (d.gave) add('The people on her list went into her banks for testing, and were not harmed.', 'The people on her list were trades for a site the colony did not build.', 'The people on her list were the officer\'s grudges, and went out of the lock.', 'The people on her list were names off an order that meant nothing. They are not in her banks.');
  if (d.swap) L.push('The punishment detail went up under other people\'s names.');
  if (d.bank || d.loop || d.letgo || d.cells || d.threat) L.push('Sleepers died in her banks on the colony\'s own word as well as hers.');
  if (d.shield) L.push('The stores slept in the bunk rows with the children, and everybody in the rows knew why.');
  if (d.blamed) L.push('The pilot was blamed for her, and had done nothing.');
  if (d.submit || d.blood) add('The colony bled for her tests, and that was the right answer.', 'The colony bled for her tests, which she had no use for.', 'The colony bled for tests that nobody aboard was reading.', 'The colony bled for tests she had no use for.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was handed over, cut out or brought down on account of her, and there is nothing of that kind to answer for.';
}
B('after', { id: 'so.truth', tone: 'quiet', title: 'Standing Order Nine',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), sl: t.hit.sleep, cn: t.culName }); },
  text: (s, c) => { const t = T(s), tail = TAIL[c.end] ? ' ' + TAIL[c.end] : ''; return `${WAS[t.truth.is]}${t.truth.is === 'crew' && c.cn ? ` It was ${c.cn}.` : ''}${tail}\n\n${reckon(s, t)}${c.toll ? ` ${Num(c.toll)} colonist${c.toll === 1 ? '' : 's'} died under her, or of what was done about her.` : ''}${c.sl ? ` ${Num(c.sl)} sleepers went cold in her banks.` : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who gave an order about her, or carried one out, has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who ordered what. People read it. Some of them stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the ship\'s order, with the names.' }) } },
    { label: 'Enter it as a fault in the ship, put right in good time', dark: true, note: 'The colony gets an account with nobody in it, and every order given about her goes unanswered.', info: [['yield', 'Morale']],
      out: { text: 'The record says the ship suffered a fault in her flight computer in the first years, and that it was dealt with. It is the version the children will be taught.', fx: s => ({ morale: 3, stain: ['so_record', 1], chron: 'The record says the ship had a fault, and that it was dealt with.' }) } },
  ] });

/* The deeds these cards can add to the colony's record (content-limits.js DEEDS). */
Object.assign(LF.DEEDS || {}, {
  so_fault: 'the ship\'s order posted as a fault in the lander',
  so_bank: 'the cryo bank switched off from the lander\'s panel to show the ship',
  so_detail: 'the punishment detail sent into the craters under the ship\'s track',
  so_shield: 'the stores stacked in the bunk rows so that the ship would have to drop on people',
  so_hostage: 'the sleepers held hostage against the ship, a bank for every pod',
  so_loop: 'the ship\'s cooling loop opened to vacuum, and the sleepers on it',
  so_bankc: 'bank C left to warm in the dark, and the families not told',
  so_cells: 'bank C\'s cells pulled for the other banks',
  so_list: 'the people on the ship\'s list handed over to her',
  so_swap: 'the punishment detail sent up under other people\'s names',
  so_blame: 'the pilot blamed for the ship',
  so_lock: 'the officer put out of the ship\'s airlock by the others aboard',
  so_cut: 'the ship\'s flight computer cut out of her while the banks went unminded',
  so_down: 'the ship brought down out of the sky with the sleepers in her',
  so_pen: 'the people the ship named, penned in the yard where she could see them',
  so_quiet: 'the ship\'s pods logged as an accident in the yard',
  so_record: 'the account of the ship\'s order that called it a fault',
});

LF.TAGS['so.lander'] = ['bold', 'cautious open', 'severe bold'];
LF.TAGS['so.pod'] = ['cautious', 'open bold', 'severe closed'];
LF.TAGS['so.voice'] = ['open', 'cautious order', 'severe bold'];
LF.TAGS['so.aboard'] = ['bold open', 'mercy', 'severe bold'];
LF.TAGS['so.banks'] = ['bold mercy', 'cautious order', 'severe closed', 'severe order'];
LF.TAGS['so.list'] = ['bold', 'severe order'];
LF.TAGS['so.strike'] = ['cautious', 'cautious order', 'severe bold'];
LF.TAGS['so.console'] = ['mercy open', 'open mercy', 'severe closed'];
LF.TAGS['so.choice'] = ['severe bold', 'cautious order', 'severe bold', 'cautious order'];
LF.TAGS['so.after'] = ['cautious', 'cautious', 'severe order'];
LF.TAGS['so.truth'] = ['open', 'closed order'];

/* What the schematic shows while she holds the colony, and after. */
(LF.SHIP_MARKS = LF.SHIP_MARKS || []).push(s => { const t = s.threads && s.threads[ID]; if (!t || !t.on || t.phase === 'latent') return null;
  if (!t.end) return Object.assign({ bridge: 'sealed' }, t.hit.sleep ? { banks: 'dark' } : {});
  return { cut: { bridge: 'breach' }, emptied: { hold: 'dark' } }[t.end] || null; });

/* The ship's own cards and the shuttle runs wait while she holds the lander. */
for (const id of ['ship.orbit', 'ship.cabin', 'ship.pods', 'ship.dry', 'plan.sleepers', 'sleep.cryo']) { const st = LF.byId[id]; if (!st) continue; const w0 = st.when; st.when = s => !s.flags.so_held && (!w0 || w0(s)); }

/* Never in the same run as the Quiet Ship (WO-7): when the plot deals both, the Quiet Ship (a free thread) goes, and after
   that each declines while the other is on (the storm's later waves ask fits). */
const plot0 = LF.plot;
LF.plot = function (s) { plot0(s);
  if (s.threads && s.threads[ID] && s.threads.quiet) { delete s.threads.quiet; const p = s.plot;
    if (p) { for (const k of ['counters', 'threads']) if (Array.isArray(p[k])) p[k] = p[k].filter(id => id !== 'quiet'); if (p.spine === 'quiet') p.spine = ID; } } };
const Q = LF.THREADS.quiet;
if (Q) { const f0 = Q.fits; Q.fits = s => (s.threads && s.threads[ID] && s.threads[ID].on) ? 0 : f0(s); }

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { if (s.used['so.pod'] === undefined) return []; const out = [];
  // the second pod off the same pass, that went wide (2026-11-17, T2-5): every run she drops in has it, whatever she is
  out.push({ k: 'stray', card: 'so.pod', name: 'The pod that went wide', kind: 'wreck', dist: 'near', danger: 1, state: 'located',
    known: `The radio room counted two pods off the ${ship(s)} at that pass. The second came down past ${LF.lex(s, 'cover')}, a day's walk out, and nobody has been to it.` });
  if (t.ev.site || t.truth.is === 'site') out.push({ k: 'ellipse', card: 'so.pod', name: 'The founders\' landing ellipse', kind: 'mark', dist: 'long', off: true, danger: 2,
    state: t.moved ? 'visited' : 'rumoured', known: 'The coordinates the founders filed before the ship left: three hundred and forty kilometres from the pad, past anything on this map.' });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5): what they found there, pointing at the truth
   most of the time (pickK) and never saying it. Both are cards: the pod is salvage and a look at what she sends, the
   ellipse is half a year's walk. A pegged-out ellipse is a settlement site (s.flags.stl_site, js/settlements.js); nothing
   here moves the colony or takes anything built. */
const STRAY = {
  quarantine: c => `The pod came down soft, on its chutes. Inside are racks of sample tubes, swabs and sealed bags, and a printed card: collect, seal, return to pod, beacon will signal for lift. The beacon is still blinking.`,
  site: c => `The pod's beacon is still calling on a band nobody below uses. Inside are survey stakes by the hundred, every one stamped with the same coordinates, and a roll of the founders' site chart with this valley crossed out in red.`,
  crew: c => 'The cargo is packed the way a person packs, heavy on top, and wedged in with a blanket from the officers\' quarters. Somebody stood in the hold and loaded it by hand.',
  broken: c => 'The pod\'s guidance log is still running on its own cell. It chose a landing site four hundred times on the way down, a different one every second, and hit none of them.' };
const ELLIPSE = {
  quarantine: c => `The ellipse is good flat ${c.top} with water near it, and nothing about it is cleaner than home. The field kit read the ground there the same as the ground under the pad, swab for swab.`,
  site: c => `The ellipse is good flat ${c.top} with water on two sides and shelter from the worst of the wind. There's a survey beacon in the middle of it, dropped long before the colony came, still blinking.`,
  crew: c => `The ellipse is ordinary ${c.top}, no better than home. On the walk back the party's radio picked up the ${c.ship} on the officers' band, and the voice asked ${c.who} by name how the walk had been.`,
  broken: c => `The coordinates put the ellipse across a gorge with sheer sides and white water at the bottom. Nothing could have landed there. The founders' chart shows it as flat ground.` };
LF.THREADS[ID].visit = (s, t, a) => {
  const k = String(a.poi || '').split('.')[1]; if (k !== 'stray' && k !== 'ellipse') return null;
  const L = a.lead && byPid(s, a.lead), c = { top: LF.lex(s, 'top'), ship: ship(s), who: L && L.alive ? L.first : 'the party' }, e = pickK(s, t, 0.05);
  if (k === 'stray') return { title: 'The Pod That Went Wide', tone: 'pressure', scene: 'away_stray', text: `${STRAY[e](c)} They cut the shell into plate and brought it home on the sledges.`,
    fx: { mat: 12, parts: 2, do: s2 => learn(s2, T(s2), 12, e) } };
  const good = e === 'site' || e === 'quarantine';
  return { title: 'The Founders\' Ellipse', tone: 'pressure', scene: 'away_ellipse', text: ELLIPSE[e](c) + (good ? ' They pegged it out before they left.' : ''),
    fx: { do: s2 => { learn(s2, T(s2), 16, e); if (good) { s2.flags.stl_site = (s2.flags.stl_site || 0) + 1; s2.flags.stl_sites = (s2.flags.stl_sites || []).concat('the founders\' ellipse').slice(-6); } } } };
};
})();

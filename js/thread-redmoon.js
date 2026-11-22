/* Landfall — thread: the Red Month. A dread (threads.js): dealt by the plot whatever the world, opening in the first
   months (t.nth 0) or later (1). Lachlan, NEXT.md WO-6: a red moon at night that makes people who look at it go mad.
   Every four to six months a second, small moon comes round low and red for a week of nights, and some of the people
   who watch it are not the same afterwards (the moon-struck). It is periodic: the colony knows the date of the next one
   (t.next), and every card is the week before or the morning after. Each red week is paid for in the tick (pass), by
   what the colony did to prepare (t.prep: none, shutters, high, holds) and what it did with the watch and the struck.
   Rolled in secret (t.truth.is):
     light  it is the light. Shutters and a curfew work; a roof is enough.
     tide   it is what the moon's pull brings up out of the low ground on those nights. Shutters do nothing; the high
            ground or the sealed holds do.
     fear   nothing is in the light. The confinement, the lost sleep and the watch on each other are the madness, and
            every measure makes it worse. Left alone, the struck mend.
     sight  the ones who look see something real and coming, and what they say afterwards is true. Blinding them or
            putting them out loses the only warning the colony has.
   The struck say things (t.says: plain data, each with a due day, checked against the real state when it comes). Under
   sight a saying is read off the run itself (the hottest condition the colony feels that is not this thread's own, or
   the food running out); under the others it is a guess. Whether the sayings come true is evidence. Other evidence
   (the first week, the glass, the mornings after, the walker, the eyes) points at the truth only most of the time
   (pickK). Nothing here knows any other thread. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, byPid } = h;
const ID = 'redmoon', T = s => LF.T(s, ID), SRC = 'th.redmoon';
const KINDS = ['light', 'tide', 'fear', 'sight'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : LF.num(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
/* The dials: how hard a red week and the months between bear (RATE), what the measures cost in hands (PRESS), and how
   many red weeks there are before it comes to an end (LAST). */
const RATE = 1, PRESS = 1, LAST = 5;

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  first: {
    light: c => 'Every one of them sat out in the full light of it, in the open yard or at a window on the east side. The bunk row behind the stores, which never sees the east sky, has nobody struck in it.',
    tide: c => 'Every one of them sleeps in the low rows by the drain, and two of them swear they never looked at the moon at all. The ones on the bank above the yard who sat up watching it every night are well.',
    fear: c => 'Nothing joins them. Some watched every night and some hardly at all. All of them sat up the whole week, though, and most share a row with somebody who was afraid of them before it was out.',
    sight: c => 'They are calm, and they agree with each other. Asked one at a time, each of them says the same thing: there was something on the face of it, and it was coming this way.' },
  glass: {
    light: c => `${c.Sf} has the lab's glass on it all night and comes down at dawn with a headache and a page of numbers. The light off it is wrong at one narrow band, a deep red the ship's charts don't have, and it's strongest straight overhead.`,
    tide: c => `${c.Sf} has the lab's glass on it all night and comes down with a page of numbers. It's an ordinary rock with an iron skin. What changes on the nights it's close is the ground: the gauges in the low bore-holes rise a hand's width after dark and fall by morning.`,
    fear: c => `${c.Sf} has the lab's glass on it all night. The light off it is ordinary sunlight off red rock, and nothing on the glass changes when it's close. ${c.Sf} sat alone under it till dawn and came down well, and hungry.`,
    sight: c => `${c.Sf} has the lab's glass on it all night. There's a mark on its face like a thumbprint that moves between one night and the next, and each night it has turned a little further toward this world. ${c.Sf} comes down and won't stop drawing it.` },
  after: {
    light: c => 'Every new one of them was somewhere the light fell on them: a window, a gap in a shutter, the open yard. A roof between them and the sky was enough for the rest.',
    tide: c => 'The new ones slept low: the drain rows, the cellar store, the pump house. Nobody who slept on the bank above the yard is among them, shutters or no shutters.',
    fear: c => 'The new ones are the ones who sat up: who kept watch on a bunkmate, or sat by a shutter listening, or were shut in with somebody they were afraid of. The ones who slept through the week are well, wherever they slept.',
    sight: c => 'The new ones say what the first ones said, in nearly the same words, and none of them is frightened of the moon. What frightens them is the rest of the colony, which won\'t listen.' },
  out: {
    light: c => `${c.Name} is on the highest open ground there is, face up to where the moon set, and puts both hands over both eyes when the watch's lamp comes near.`,
    tide: c => `${c.Name} is standing in the lowest part of the open ground, ankle deep in a seep that wasn't there last month. The ground round it smells of struck iron.`,
    fear: c => `${c.Name} is just outside the gate, with no idea how ${c.first} got there, and asks the watch not to be shut in again.`,
    sight: c => `${c.Name} is facing the point of the horizon where the moon set, and has scored a line on the ground toward it with a boot heel, and tells the watch which way.\n\n[[${c.pid || c.rk || 'x26'}]] "It's that way." "It's still coming."\n\n` },
  eyes: {
    light: c => 'With a cloth tied over their eyes the struck sleep for the first time since the moon. Take it off at night, and they go straight back to the window.',
    tide: c => 'A cloth over the eyes makes no difference. They still get up in the night and walk downhill until something stops them.',
    fear: c => 'They sleep when they\'re left alone and nobody sits watching them, cloth or no cloth. Watched, they don\'t sleep at all.',
    sight: c => `With their eyes covered they say the same things, more quietly. One of them says it for the rest.\n\n[[${c.named && c.named.length ? c.named[0].pid : 'x26'}]] "We don't need to see it now." "We know where it is."` },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { light: 'the light itself, falling on whoever stands under it', tide: 'the low ground on those nights, and not the light at all', fear: 'nothing in the moon, and everything in how the colony waits for it', sight: 'the struck seeing something that is really there' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* ---------- people around it ---------- */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const PLAN = { none: 'nothing changed, and whoever wants to watch it watches', shutters: 'shutters on every window and a curfew from dusk', high: 'the whole colony up on the high ground in tents for the week', holds: 'everyone below in the windowless holds for the week' };
function crew(s) { const o = {}, t = T(s);
  for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['cm', 'command']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  o.wv = voice(s, 'security'); o.dv = voice(s, 'doctor'); o.sv = voice(s, 'scientist'); o.bv = voice(s, 'engineer'); o.tv = voice(s, 'crew');
  const sp = LF.officer(s, 'scientist'), st = LF.seatState(s, 'scientist'); o.spid = sp && st === 'here' ? sp.id : null; o.sf = o.spid ? sp.first : 'the lab'; o.Sf = cap(o.sf);
  o.lean = lean(t); o.prep = t.prep; o.plan = PLAN[t.prep]; o.n = t.n; o.tot = total(s, t); o.low = LF.lex(s, 'under'); o.months = LF.monthsWord(Math.max(1, (t.next - s.day) / LF.MONTH));
  o.moon = t.moons > 1 ? 'the smallest of the moons' : 'the little second moon the survey never logged'; return o; }
const sour = (s, pid, v, txt) => { const p = pid && byPid(s, pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
/* Somebody with a name and no office, out of the crowd (thread dice only), not already struck. */
const someone = (s, t) => { const a = s.people.filter(p => p.alive && !p.away && !p.orbit && !p.role && p.known && !(t && t.named.includes(p.id))); return a.length ? LF.spick(s, a) : null; };
/* The moon-struck: the counted ones (t.cnt) and the named ones still alive and at home. */
const namedHere = (s, t) => t.named.map(id => byPid(s, id)).filter(p => p && p.alive && !p.away && !p.orbit);
const total = (s, t) => t.cnt + namedHere(s, t).length;
const LABS = ['a hauler from the low rows', 'the second cook', 'the pump hand', 'a rigger off the night shift', 'the wash-house hand', 'a fitter from the yard', 'a field hand from the far furrow', 'the stores clerk', 'the lamp trimmer', 'a digger from the pits'];
/* Who each of them is on the card (js/roster.js): the face and name in the speech bubble (DESIGN.md "Who is speaking"). */
const LAB_RK = ['x26', 'x43', 'x45', 'x25', 'x33', 'x27', 'x17', 'x44', 'x46', 'x24'];   // roster of sixty (2026-11-20): cook, pump hand, clerk and lamp trimmer are their own people
const whoStruck = (s, t) => { const n = namedHere(s, t); if (n.length) { const p = LF.spick(s, n); return { pid: p.id, name: p.name, Name: p.name, first: p.first }; }
  const lab = LF.spick(s, LABS), the = lab.replace(/^an? /, 'the '); return { pid: null, rk: LAB_RK[LABS.indexOf(lab)], name: lab, Name: cap(the), first: the }; };
const names = (s, t, cut) => { const n = namedHere(s, t).map(p => p.name), parts = n.slice(0, cut || 4); if (n.length > parts.length) parts.push(`${num(n.length - parts.length)} more`);
  if (t.cnt) parts.push(`${num(t.cnt)} ${parts.length ? 'others' : 'of them'}`); return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0] || 'nobody'; };

/* Deaths: n from the crowd, never below a working floor. struck: they come off the counted moon-struck first. */
function die(s, t, n, struck) { if (n <= 0) return 0; const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 14))); const k = b - s.pop; t.toll += k; if (struck) t.cnt = Math.max(0, t.cnt - k); return k; }
const count = (t, n) => { t.toll += n; };

/* ---------- the sayings ---------- */
const SAY = {
  hunger: 'There\'ll be hungry mouths at every table when it comes round again.', sickness: 'The clinic\'ll be full when it comes round again.',
  cold: 'It\'ll come round on a night that freezes the water butts, and you\'ll all be cold.', dark: 'It\'ll come round in the dark, and the lamps won\'t help.',
  storm: 'There\'ll be weather tearing at the roofs when it comes round again.', siege: 'There\'ll be something at the wire when it comes round again.',
  grief: 'There\'ll be fresh graves by the wire when it comes round again.', resentment: 'You\'ll have the rows against you when it comes round again.',
  scarcity: 'You\'ll be short of everything when it comes round again.', watched: 'Something\'ll be watching the colony when it comes round again.',
  strangers: 'There\'ll be strangers inside the wire when it comes round again.', contamination: 'Something\'ll be in the water when it comes round again.',
  schism: 'The colony\'ll be two colonies when it comes round again.', suspicion: 'You\'ll none of you trust each other when it comes round again.',
  bare: 'The bins\'ll be scraped bare when it comes round again.', full: 'There\'ll be bread on every table when it comes round again.' };
const COND_KEYS = Object.keys(SAY).filter(k => LF.COND[k]);
const sayTxt = y => SAY[y.key];
/* A saying is made the night of a red week, due the night of the next. Under sight it is read off the run as it is;
   under the others it is a guess. Plain data. */
function say(s, t) {
  const sp = whoStruck(s, t), due = t.next, D = due - s.day, fd = h.foodDays(s), y = { d: s.day, due, who: sp.name, pid: sp.pid, rk: sp.rk || null, ok: null, v0: Math.round(s.res.food) };
  if (t.truth.is === 'sight') { const hot = COND_KEYS.map(k => [k, LF.cv(s, k)]).filter(([k, v]) => v >= 35 && LF.source(s, k) !== SRC).sort((a, b) => b[1] - a[1]);
    if (hot.length && LF.srand(s) < 0.7) Object.assign(y, { kind: 'cond', key: hot[0][0] }); else Object.assign(y, { kind: 'food', key: fd < D + 10 ? 'bare' : 'full' }); }
  else if (LF.srand(s) < 0.55) { const cold = COND_KEYS.filter(k => LF.cv(s, k) < 15); Object.assign(y, { kind: 'cond', key: LF.spick(s, cold.length ? cold : COND_KEYS) }); }
  else Object.assign(y, { kind: 'food', key: LF.srand(s) < 0.5 ? 'bare' : 'full' });
  t.says.push(y); return y;
}
const cameTrue = (s, y) => y.kind === 'food' ? (y.key === 'bare' ? h.foodDays(s) < 15 || s.res.food < y.v0 * 0.5 : h.foodDays(s) >= 15) : LF.cv(s, y.key) >= 30;
/* On the night it was due: did it come true? Heeded, a true saying was a warning the colony could use. */
function check(s, t) {
  for (const y of t.says) { if (y.ok !== null || y.due > s.day) continue; y.ok = cameTrue(s, y); t.said++;
    if (y.ok) { t.hits++; if (y.key !== 'full') learn(s, t, 8, 'sight');
      if (t.listen) { t.heeded++; if (y.kind === 'food' && y.key === 'bare') s.res.food += Math.round(LF.foodCons(s) * 8); else if (y.kind === 'cond') LF.ease(s, y.key, 'rm.heed' + t.n, 15, 30); s.morale = clamp(s.morale + 1, 0, 100);
        LF.log(s, `What ${y.who} said at the window came true, and the colony had made ready for it.`, 'good'); }
      else LF.log(s, `What ${y.who} said at the window came true.`, ''); } }
}

/* ---------- a red week ---------- */
const EXPO = { light: { none: 1, shutters: 0.2, high: 1.1, holds: 0 }, tide: { none: 1, shutters: 0.95, high: 0.15, holds: 0.1 },
  fear: { none: 0.4, shutters: 1.1, high: 0.9, holds: 1.6 }, sight: { none: 1, shutters: 0.3, high: 1, holds: 0 } };
const NIGHT = {
  light: ['A rigger pried the shutter off a bunk-row window on the fourth night to look at it, and walked off the wall walk after it.', 'One of the night watch who looked up too long sat down on the wall and would not come off it.'],
  tide: ['Two of the low rows were found at dawn face down in the drain, where the water is a hand deep.', 'The pump house crew were found asleep on the floor at first light, and one of them did not wake.'],
  fear: ['A bunk row fought in the dark over who had looked and who had not, and one of them went down with a cracked skull.', 'Somebody shut in for the week broke a door down on the fifth night, and somebody on the other side of it was standing too close.'],
  sight: ['The struck stood at the windows all week, facing the same way, and said the same few things to anyone who would stop.'] };
const redDay = t => t.redDay || (typeof t.last === 'number' ? t.last : 0);   // a save from before 2026-11-21 kept it in t.last
function pass(s, t) {
  const k = t.truth.is, n = ++t.n, prep = t.prep; t.redDay = s.day;   // not t.last: the engine keeps the last decision there
  check(s, t);
  let m = EXPO[k][prep] * RATE;
  if (k === 'fear') m += (t.ward ? 0.3 : 0) + (t.shoot ? 0.3 : 0) + (t.chain ? 0.3 : 0) + (t.watch === 'rows' ? 0.2 : 0);
  let nw = Math.round((2 + LF.sri(s, 0, 2)) * (1 + 0.2 * (n - 1)) * m);
  if (t.blind && (k === 'light' || k === 'sight')) nw = Math.max(0, nw - 1);
  nw = Math.max(0, Math.min(nw, s.pop - 24 - total(s, t)));
  let one = null; if (nw && LF.srand(s) < 0.6) { const p = someone(s, t); if (p) { one = p; t.named.push(p.id); p.marks.struck = { d: s.day, txt: 'watched the red moon, and was not the same after' }; } }
  t.cnt += nw - (one ? 1 : 0); t.seen += nw; t.lastNew = nw; t.peak = Math.max(t.peak, total(s, t));
  const dd = Math.round(({ light: nw * 0.3, tide: nw * 0.4 + (prep === 'none' || prep === 'shutters' ? 1 : 0), fear: nw * 0.25 + (prep === 'holds' ? 1 : 0), sight: 0 }[k]) * RATE);
  const lost = die(s, t, dd, k !== 'tide');
  if (lost) LF.log(s, LF.spick(s, NIGHT[k]) + (lost > 1 ? ` ${Num(lost)} died that week.` : ''), 'bad');
  if (t.shoot && total(s, t) > 0 && LF.srand(s) < 0.7) { const sh = die(s, t, 1, true); if (sh) { t.shot += sh; LF.log(s, 'The wall shot one of the moon-struck walking out across the open ground on the third night, as it had been told to.', 'bad'); } }
  if (t.blind === 'hood' && LF.srand(s) < 0.2 && die(s, t, 1, false)) LF.log(s, 'One of the hooded watch walked off the edge of the wall walk in the dark and broke on the yard.', 'bad');
  if (prep === 'holds') { s.morale = clamp(s.morale - 2, 0, 100); t.holdsN++; }
  if (nw) LF.log(s, `The red moon went down at the end of the week, and ${num(nw)} more of the colony ${nw === 1 ? 'is' : 'are'} moon-struck.`, 'bad');
  else LF.log(s, 'The red moon went down at the end of the week, and nobody new is moon-struck.', 'good');
  if (n >= LAST) return resolve(s, t);
  t.next = s.day + LF.sri(s, 40, 60);
  if (n >= 2 && total(s, t) > 0 && !t.dumb) say(s, t);
}
/* The months between: the struck are a weight on the work, and now and then one of them is a death. */
const INC = {
  light: 'One of the moon-struck pried a shutter off in the night to look at an empty sky, and went off the wall walk after it.',
  tide: 'One of the moon-struck was found at dawn face down in the low drain, where the water is a hand deep.',
  fear: 'Two of a row came to blows over a moon-struck bunkmate who would not stop watching them sleep, and one of them did not get up.',
  sight: 'One of the moon-struck stopped eating, said there was no need now, and died in the clinic.' };
function month(s, t) {
  const k = t.truth.is, tot = total(s, t); if (!tot) return;
  if (k === 'fear' && t.prep === 'none' && !t.ward && !t.chain && t.cnt > 0 && LF.srand(s) < 0.5) { t.cnt--; t.mended++; }
  let p = RATE * Math.min(1, tot / 6) * { light: 0.2, tide: 0.16, fear: 0.22, sight: 0.04 }[k];
  if (t.ward) p *= k === 'fear' ? 1.3 : 0.5; if (t.chain) p *= k === 'fear' ? 1.3 : 0.3; if (t.blinded) p *= { light: 0.3, tide: 1, fear: 1.4, sight: 1 }[k];
  if (s.pop > 16 && LF.srand(s) < p && die(s, t, 1, true)) LF.log(s, INC[k], 'bad');
}
function finish(s, t, end, chron) { if (t.end) return; LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^rm\./.test(e.id)); s.sched.push({ id: 'rm.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
function ran(s, t, share) { const n = die(s, t, clamp(Math.round(LF.sized(s) * 0.03 * share), 2, 6), false); s.morale = clamp(s.morale - 4, 0, 100);
  if (n) LF.log(s, `The last red week was the worst of them. ${Num(n)} died of it before the moon went down.`, 'bad'); }
const BAD = { struck: 1, risen: 1.2, turned: 1, blinded: 0.8, unheard: 0.5 };
function resolve(s, t) {
  const k = t.truth.is, prep = t.prep; let end;
  if (k === 'light') end = prep === 'shutters' ? 'shuttered' : prep === 'holds' ? 'sealed' : 'struck';
  else if (k === 'tide') end = prep === 'high' ? 'ridge' : prep === 'holds' ? 'sealed' : 'risen';
  else if (k === 'fear') end = prep === 'none' && !t.ward && !t.shoot && !t.chain ? 'eased' : 'turned';
  else end = t.blinded || t.did.outed ? 'blinded' : t.listen ? 'heeded' : prep === 'holds' ? 'sealed' : 'unheard';
  if (BAD[end]) ran(s, t, BAD[end]);
  if (end === 'eased') { t.mended += Math.ceil(t.cnt / 2); t.cnt = Math.floor(t.cnt / 2); }
  if (end === 'heeded') s.morale = clamp(s.morale + 4, 0, 100);
  return finish(s, t, end, { shuttered: 'The colony shuttered its windows against the red moon, and that held.', sealed: 'The colony went below into the holds for every red week.', ridge: 'The colony slept on the high ground through the red weeks, and that held.',
    struck: 'The red moon went on striking whoever stood under it.', risen: 'Whatever came up out of the low ground on the red nights went on taking the low rows.', eased: 'The colony stopped shutting itself in against the red moon, and the madness passed.',
    turned: 'The colony turned on itself every time the red moon came round.', heeded: 'The colony wrote down what the moon-struck said, and acted on it.', blinded: 'The colony took the sight from the ones who had it.', unheard: 'The moon-struck said what they saw, and the colony did not listen.' }[end]);
}

LF.thread({ id: ID, name: 'The Red Month', view: 'colony', dread: true,
  clue: (s, t) => ({ txt: 'A page torn from somebody\'s calendar, one week in every few months circled in red pencil, and in the margin in the same pencil: don\'t look up.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'first' ? 'the red week' : 'the Red Month',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What does the red moon do to the ones who watch it?',
  chap: {
    shuttered: t => 'It was the light of the second moon. Shutters and a curfew were all it ever needed.',
    sealed: t => ({ light: 'It was the light of the second moon. The colony went below into windowless holds every red week, and shutters would have done.', tide: 'It came up out of the low ground on the second moon\'s nights. The colony sealed itself into the holds every red week, and that was the answer.',
      fear: 'There was nothing in the moon. The colony shut itself in the dark every red week, and made the madness worse.', sight: 'The ones who looked were seeing something real. The colony shut everyone in the dark every red week and stopped hearing what they saw.' })[t.truth.is],
    ridge: t => 'It came up out of the low ground on the second moon\'s nights. The colony took to the high ground, and it never reached them.',
    struck: t => 'It was the light of the second moon, and the colony went on standing under it.',
    risen: t => 'It came up out of the low ground on the second moon\'s nights, and the colony shut its windows against the sky.',
    eased: t => 'There was nothing in the moon. The colony opened its shutters and slept, and the madness passed.',
    turned: t => 'There was nothing in the moon. The shutters, the holds and the watch on each other were the madness.',
    heeded: t => 'The ones who looked at the red moon saw something real and coming. The colony wrote down what they said and acted on it.',
    blinded: t => `The ones who looked at the red moon saw something real and coming. The colony ${t.did.outed ? 'put them out through the gate' : 'took their eyes'}, and met what came without warning.`,
    unheard: t => 'The ones who looked at the red moon saw something real and coming, and the colony did not listen.',
  },
  start: (s, t) => { const at = t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35));
    Object.assign(t, { at, next: at, n: 0, moons: s.world ? LF.sky(s).moons : 1, prep: 'none', watch: null, blind: null, shoot: false, ward: false, chain: false, listen: false, dumb: false, blinded: false,
      cnt: 0, named: [], seen: 0, peak: 0, lastNew: 0, toll: 0, shot: 0, mended: 0, holdsN: 0, says: [], said: 0, hits: 0, heeded: 0, insight: 0, ev: {}, did: {}, q: {}, last: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.next && s.pop > 30) { LF.phase(s, ID, 'first', 'A small moon came round low and red for a week of nights.'); s.signs.push({ id: 'lights', d: s.day, src: SRC }); pass(s, t); jump(s, 'rm.first', 55); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], once = (k, id, back) => { if (!t.q[k]) { t.q[k] = s.day; if (back) jump(s, id, back); else LF.cue(s, id, 0, 4); return true; } }, toGo = t.next - s.day;
    /* The card before a red week waits to be answered: the date slips a little rather than the week come unasked (never more than a month). */
    const gate = { 2: 'rm.date', 4: 'rm.before', 5: 'rm.holds' }[t.n + 1];
    if (s.day >= t.next && gate && s.used[gate] === undefined && (t.slip || 0) < 30) { t.slip = (t.slip || 0) + 1; t.next++; }
    if (s.day >= t.next) { pass(s, t); t.slip = 0; if (t.end) return;
      if (t.n === 2) { LF.phase(s, ID, 'struck', 'The red moon came round a second time, on the night it was chalked for.'); once('after2', 'rm.after', 50); }
      if (t.n === 3) { if (t.says.some(y => y.ok !== null)) once('said', 'rm.said', 50); else once('eyes', 'rm.eyes', 10); }
      if (t.n === 4) { LF.phase(s, ID, 'last'); once('holds', 'rm.holds', 55); once('after4', 'rm.after', 50); } }
    if (t.phase === 'first' && since('rm.first') >= 5) { LF.phase(s, ID, 'between'); once('date', 'rm.date', 55); }
    if (t.phase === 'between' && toGo <= 20 && since('rm.date') >= 0) once('watch', 'rm.watch');
    if (t.phase === 'struck' && t.n === 2) { if (since('rm.after') >= 5) once('ward', 'rm.ward'); if (toGo <= 20 && (since('rm.ward') >= 0 || toGo <= 10)) once('out', 'rm.out'); }
    if (t.phase === 'struck' && t.n === 3) { if (since('rm.said') >= 5 || s.day - redDay(t) >= 12) once('eyes', 'rm.eyes', 30); if (toGo <= 25) once('before', 'rm.before', 55); }
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) { const tot = total(s, t), near = toGo <= 15;
      LF.emit(s, 'fear', SRC, near ? 34 : 22, 8, 'the red moon comes round again on the date chalked on the mess door');
      if (tot) LF.emit(s, 'changed', SRC, clamp(18 + 3 * tot, 0, 45), 8, 'some of the ones who watched the red moon are not who they were');
      if (t.insight < 60) LF.emit(s, 'unexplained', SRC, 24, 8, 'nobody can say what the red moon does to the ones who watch it');
      if (near && t.prep !== 'none') LF.emit(s, 'exhaustion', SRC, t.prep === 'holds' ? 34 : 24, 8, 'nobody sleeps the week the red moon is up');
      if ((near && t.prep === 'holds') || t.ward || t.chain) LF.emit(s, 'confinement', SRC, near && t.prep === 'holds' ? 40 : 22, 8, near && t.prep === 'holds' ? 'the colony goes below into the holds every red week' : 'the moon-struck are kept behind a door'); }
  },
  /* The struck are hands the work does without; the red week itself costs what the colony does about it. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent') return;
    let d = Math.min(0.06, 0.004 * total(s, t)); const wk = t.next - s.day;
    if (wk > 0 && wk <= 7) d += { none: 0, shutters: 0.05, high: 0.12, holds: 0.3 }[t.prep];
    if (t.ward) d += 0.01; if (t.minders) d += 0.01;
    P.labor -= d * PRESS; if (t.truth.is === 'fear' && t.prep !== 'none') P.morale -= 0.004; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));

/* ---------- what the colony does before a red week (rm.date, rm.before, rm.holds) ----------
   Three options at most (Lachlan, 2026-11-21). rm.date offers shutters, the high ground or nothing (the three the officers
   argue for); rm.before offers the plan as it stands or one of the other two of those; the holds are offered once, on
   rm.holds, beside the measure in place and dropping everything. The shoot order is given only on rm.out now. */
const PREP_OUT = {
  shutters: 'Shutters go up on every east window by the end of the month, made from crate lids where there\'s nothing else, and the curfew bell is hung by the mess door. The date stays chalked beside it.',
  high: 'The work crews peg out a tent line on the high ground and carry up bedding, water and a stove. When the red week comes the colony will walk up at dusk and down at dawn.',
  holds: 'The holds are swept and the vents taped dark. Each family is given a square of floor and a bucket, and told it\'s theirs every red week from now on.',
  none: 'The date stays on the mess door and nothing else changes. Some say they\'ll sit up for it, and some say they\'ll sleep.',
};
const setPrep = (key, extra) => (s, c) => Object.assign({ do: s2 => { const t = T(s2); t.prep = key === 'shoot' ? 'shutters' : key; if (key === 'shoot') { t.shoot = true; t.did.shoot = true; } if (key === 'holds') t.did.holds = true; if (key === 'none' && extra && extra.free) { t.ward = false; t.chain = false; t.shoot = false; } if (extra && extra.then) extra.then(s2, t, c); } },
  extra && extra.fx ? (typeof extra.fx === 'function' ? extra.fx(s, c) : extra.fx) : {});
const PREPS = {
  shutters: { label: 'Shutters on every window, and a curfew from dusk for the red week', note: 'The night shift stands down for the week, the rows sleep in stale air, and whoever is caught out after dusk loses a ration.' },
  high: { label: 'Everyone up to the high ground for the red week, in tents', note: 'The colony sleeps under canvas for seven nights, and the pens, the fields and the low rows are left to a skeleton watch.' },
  holds: { label: 'Everyone below in the windowless holds for the week, children too, every time it comes', dark: true, note: 'Nobody sees the sky for seven nights, and the colony stops dead every time the moon comes round.', info: [['yield', 'Nobody under the moon'], ['danger', 'Everyone, a week in the dark']] },
  none: { label: 'Change nothing: whoever wants to watch it watches, and everyone else sleeps', note: 'Whoever looks takes their chances, and the frightened are told there\'s nothing to be done.' },
};
const prepFx = { shutters: { mat: -6 }, high: { mat: -4, food: -10 }, holds: { morale: 1, tension: -5, stain: ['rm_holds', 1] }, none: {} };
const prepChoice = (key, over) => Object.assign({}, PREPS[key], { out: { text: PREP_OUT[key], fx: setPrep(key, { fx: prepFx[key] }) } }, over || {});

/* ======================= FIRST: the morning after the first red week ======================= */
B(['first', 'between'], { id: 'rm.first', tone: 'pressure', title: 'The Red Week',
  setup: s => { const t = T(s), sp = namedHere(s, t)[0]; return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.05), nw: total(s, t), one: sp ? sp.name : null, pid0: sp ? sp.id : null }); },
  text: (s, c) => `For seven nights ${c.moon} came up over the wire a little after dusk, low and dull red, and half the colony stayed up to watch it. This morning ${c.nw === 1 ? 'one of the ones who watched longest isn\'t' : `${num(c.nw)} of the ones who watched longest aren't`} right. ${c.one ? `${c.one} is one of them: sitting on a bunk with boots on, facing the east wall, answering in single words.` : 'They sit on their bunks facing the east wall and answer in single words.'}\n\n${c.sv ? `[[scientist]] "It's on a long ellipse." "It comes round every few months, and I've got the next one to the night, ${c.months} from now, and that's the lovely thing about an ellipse, it can't be late, it can't change its mind, so whatever it does to people, at least we'll see it coming."` : `The lab has its orbit from the ship's logs. It comes round again in ${c.months}, and the date goes up in chalk on the mess door.`}`,
  choices: [
    { label: 'Have the clinic sit with the struck and find out what they saw', note: 'The clinic gives the month to the ones who watched, and the rest of the sick wait their turn.', test: { base: 50, mods: [R('physician', 10)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} sits with each of them in turn behind a shut door. ${ev('first', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} gets single words and long looks at the east wall. Two of the sick who were waiting got worse on the bench outside.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Put the lab\'s glass on the moon itself, all night, with whoever can read it', note: (s, c) => `Whoever is on the glass spends a night looking straight at the thing that did this.`, test: { base: 50, mods: [R('xenobio', 10)] },
      ok: { text: (s, c) => ev('glass', c.ev2, Object.assign({}, c, { Sf: cap(LF.sentFirst(s, 'xenobio')) })), fx: (s, c) => ({ do: s2 => { learn(s2, T(s2), 24, c.ev2); if (c.spid && LF.shift) LF.shift(s2, 'scientist', 'mind', T(s2).truth.is === 'light' ? -8 : -2); } }) },
      bad: { text: 'Cloud comes in after midnight and stays. The glass gets an hour of it and a page of numbers that don\'t agree.', fx: s => ({ do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Lock the struck in the pump house until they\'re themselves again', dark: true, note: 'The rows sleep without them, and they sit behind a bar for having looked up.', info: [['yield', 'The rows calm'], ['danger', 'The struck']],
      out: { text: 'The watch walks them to the pump house at supper. None of them argues. In the night they stand at the one high window, all of them, facing east, though the moon is long gone.',
        fx: (s, c) => ({ morale: 1, tension: -4, stain: ['rm_pen', 1], do: s2 => { const t = T(s2); t.ward = true; t.did.pen = true; sour(s2, c.pid0, 10, 'was locked in the pump house for looking at the moon'); } }) } },
  ] });

/* ======================= BETWEEN: the date on the mess door ======================= */
B(['between', 'struck'], { id: 'rm.date', tone: 'crisis', title: 'The Date on the Mess Door',
  setup: s => crew(s),
  text: (s, c) => `The date is in chalk on the mess door, and somebody has started rubbing out a day at a time. The officers don't agree what to do when it comes.${c.wv ? `\n\n[[security]] "I'd have shutters on every east window and a curfew from dusk, and anyone out after it can explain to me why." "If it's the light, bloody well keep it out, and if it isn't then we've lost some sleep, and nobody ever died of a closed window."` : ''}${c.tv ? `\n\n[[crew]] "The struck all sleep in the low rows, every one of them, I've been round and asked." "So I'd take everyone up the hill for the week, and the low rows can stand empty till it's past."` : ''}${c.dv ? `\n\n[[doctor]] "Or we do nothing, and let them sleep in their own beds with somebody sitting up beside them." "Half of what I saw last time was people who hadn't slept for seven nights, and if you shut them in they won't sleep for seven more."` : ''}\n\n${c.lean}`,
  choices: [ prepChoice('shutters'), prepChoice('high'), prepChoice('none') ] });

/* The night watch: somebody has to stand the wall facing it. */
B(['between', 'struck', 'last'], { id: 'rm.watch', tone: 'pressure', title: 'Who Stands the Watch', view: 'people',
  setup: s => Object.assign(crew(s), { tot: total(s, T(s)) }),
  text: (s, c) => `Whatever the colony does with its windows, the wall can't be left empty for a week of nights, and the wall faces east. Whoever stands it will have the red moon in front of them till dawn.${c.wv ? `\n\n[[security]] "I'll stand the first night myself, and after that I want an order, not volunteers." "Because the ones who volunteer to stare at a red moon all week are exactly the ones I don't want on my wall."` : ''}`,
  choices: [
    { label: 'Draw lots every night from the whole watch roster', note: 'Anyone on the roster can come off the wall struck, and nobody knows who until the lot is drawn.',
      out: { text: (s, c) => `The lots go in a tin by the gate. Every night of the red week ${c.w} draws four names, and the four go up the ladder at dusk with a lamp and a whistle.`, fx: s => ({ tension: 2, do: s2 => { T(s2).watch = 'lots'; } }) } },
    { label: 'Put the struck on the wall: they\'ve seen it already', dark: true, show: (s, c) => c.tot > 0, note: 'The rest of the colony is spared the moon, and the struck stand under it again every night of the week.', info: [['yield', 'Nobody new on the wall'], ['danger', 'The struck']],
      out: { text: 'The struck go up the ladder at dusk with a lamp each and no rifles. They stand the whole night facing east, and talk to each other in low voices, and come down at dawn without being told.',
        fx: (s, c) => ({ tension: -3, stain: ['rm_struckwatch', 1], do: s2 => { const t = T(s2); t.watch = 'struck'; t.did.struckwatch = true; t.cnt += { light: 1, tide: 0, fear: 1, sight: 0 }[t.truth.is]; if (t.truth.is !== 'fear') learn(s2, t, 10, t.truth.is === 'sight' ? 'sight' : null); } }) } },
    { label: 'Hood the watch, and hold the wall by ear', note: 'Nobody on the wall sees the moon, and nobody on the wall sees anything else either.', info: [['later', 'The hooded watch']],
      out: { text: 'Canvas hoods go over the watch at the foot of the ladder, and a rope runs the length of the wall walk to keep them on it. They call to each other every few minutes through the night.',
        fx: s => ({ mat: -2, do: s2 => { const t = T(s2); t.blind = 'hood'; t.watch = 'hood'; } }) } },
  ] });

/* ======================= STRUCK: the morning after ======================= */
B(['struck', 'last'], { id: 'rm.after', tone: 'pressure', title: 'The Morning After', view: 'people', repeat: 25, max: 2, when: (s, t) => total(s, t) > 0,
  setup: s => { const t = T(s), y = t.says.length ? t.says[t.says.length - 1] : null, fresh = y && y.d === redDay(t);
    return Object.assign(crew(s), { ev: pickK(s, t), nw: t.lastNew, tot: total(s, t), who: names(s, t), say: fresh ? sayTxt(y) : null, sayer: fresh ? y.who : null, sayPid: fresh ? y.pid : null, sayRk: fresh ? y.rk : null }); },
  text: (s, c) => `The red moon went down this morning on the seventh night, on the day it was chalked for. ${c.nw ? `${Num(c.nw)} more of the colony ${c.nw === 1 ? 'is' : 'are'} moon-struck${c.tot >= c.nw ? `, ${num(c.tot)} in all` : c.tot ? `, and ${num(c.tot)} of the struck are left in the colony` : ', and none of the struck from before are left in the colony'}. ${ev('after', c.ev, c)}` : c.tot ? `Nobody new is struck. ${c.tot === 1 ? 'There is one' : `There are ${num(c.tot)}`} from before.` : 'Nobody new is struck, and none of the struck from before are left in the colony.'}${c.say ? `\n\n${cap(c.sayer)}, one of the struck, has said one thing since dawn, to anyone who stops.\n\n[[${c.sayPid || c.sayRk || 'x26'}]] "${c.say}"` : ''}`,
  choices: [
    { label: 'Write down every word the struck say, and read it to the council', note: 'The colony goes about its month with what the moon-struck say chalked beside the date, and the frightened read it.',
      out: { text: 'A ledger goes on the table in the clinic and a hand from the stores sits by it. Everything the struck say goes in, dated. The council has it read out at every meeting, and people come early to hear it.', fx: (s, c) => ({ tension: 2, do: s2 => { const t = T(s2); if (c.nw) learn(s2, t, 6, c.ev); t.listen = true; t.did.listen = true; learn(s2, t, 6); } }) } },
    { label: 'Hush them: the struck eat apart and speak to nobody but the clinic', dark: true, note: 'The rows stop hearing it, and the struck are cut off from everyone they knew for what they say.', info: [['yield', 'The rows calm'], ['danger', 'The struck']],
      out: { text: 'The struck eat at a table by the wash-house door, after everyone else. Anyone caught talking with them loses a ration. The rows stop repeating things, mostly.', fx: (s, c) => ({ morale: 1, tension: -5, stain: ['rm_hush', 1], do: s2 => { const t = T(s2); if (c.nw) learn(s2, t, 6, c.ev); t.listen = false; t.did.hush = true; sour(s2, c.sayPid, 10, 'was hushed for what the red moon showed'); } }) } },
    { label: 'Back on their own shifts, with a minder each from their own row', note: 'The minders lose sleep and work of their own, and every row has one of its own to watch.',
      out: { text: 'Each of the struck goes back to the old shift with somebody from the same row at the next bench. The minders are tired within the month. Nobody has to be told twice.', fx: (s, c) => ({ tension: 1, do: s2 => { const t = T(s2); if (c.nw) learn(s2, t, 6, c.ev); t.minders = true; if (t.truth.is === 'fear') t.watch = 'rows'; } }) } },
  ] });

/* What to do with them, now there are this many. */
B(['struck', 'last'], { id: 'rm.ward', tone: 'crisis', title: 'The Moon-Struck', view: 'people',
  when: (s, t) => total(s, t) > 0,
  setup: s => { const t = T(s), nh = namedHere(s, t); return Object.assign(crew(s), { tot: total(s, t), who: names(s, t), named: nh.map(p => ({ pid: p.id, name: p.name })), cnt: t.cnt }); },
  text: (s, c) => `There are ${num(c.tot)} moon-struck now${c.named.length ? `: ${c.who}` : ''}. They do their work when told and sleep when they can, and at night they stand at whatever window faces east. The rows want them somewhere else.${c.dv ? `\n\n[[doctor]] "They're not dangerous, they stand at that window because they want to, and they're frightened of the rows, not the other way round." "They're no danger to you, and I won't hear anyone call them that in my ward."` : ''}${c.wv ? `\n\n[[security]] "Not yet, they aren't." "Everything's harmless until the day it isn't, and I'd like to be standing nearer than the rest of you when that day comes."` : ''}`,
  choices: [
    { label: 'A ward of their own in the old store, with two hands to keep it', note: 'Two hands come off the work for good, and the struck live behind one door the colony can point at.',
      out: { text: 'Cots go into the old store and a lamp on a hook. Two hands from the yard keep the door in shifts. The struck settle in without a word, and push their cots round to face east.', fx: s => ({ do: s2 => { const t = T(s2); t.ward = true; t.did.ward = true; } }) } },
    { label: 'Put them out past the wire with a tent and a month of food', dark: true, cost: { food: 20 }, note: 'The rows are rid of them, and they live or die past the wire for having looked at the sky.', info: (s, c) => [['yield', 'The rows clear of them'], ['danger', `The ${num(c.tot)} struck`]],
      out: { text: (s, c) => `${cap(c.who)} go out through the gate at noon with a tent and a month of food. None of them looks back. By dusk the tent is up on the far side of the open ground, with its flap facing east.`,
        fx: (s, c) => Object.assign(c.named.length ? { depart: c.named.map(x => ({ who: x.pid, cause: 'put out past the wire for being moon-struck' })) } : {}, c.cnt ? { gone: c.cnt } : {}, { morale: 1, tension: -6, stain: ['rm_out', 2],
          do: s2 => { const t = T(s2); t.did.outed = (t.did.outed || 0) + c.tot; t.cnt = 0; t.named = []; t.ward = false; } }) } },
    { label: 'Keep them in the rows, and have the rows sit up with them by turns', note: 'Every row loses a night\'s sleep in four, watching people they used to eat beside.',
      out: { text: 'A rota goes up in every row: one awake each night, sitting by the struck. It costs every row its sleep. Some of the watchers start sitting by the window too.', fx: s => ({ tension: 3, do: s2 => { const t = T(s2); t.watch = 'rows'; t.did.rows = true; } }) } },
  ] });

/* One of them walked out on the last red night, and is still out there at dawn. */
B(['struck', 'last'], { id: 'rm.out', tone: 'crisis', title: 'Out After Dark',
  when: (s, t) => total(s, t) > 0,
  setup: s => { const t = T(s); return Object.assign(crew(s), whoStruck(s, t), { ev: pickK(s, t), ev2: pickK(s, t, 0.1), shoot: t.shoot }); },
  text: (s, c) => `At first light the watch found ${c.name}, one of the moon-struck, out past the wire, standing alone on the open ground and refusing to come in. Nobody saw anyone go out. ${c.shoot ? 'The wall has its order, and a rifle on the figure, and is waiting to be told whether the order still stands in daylight.' : 'The wall has a rifle on the figure and is waiting for an order.'}`,
  choices: [
    { about: true, label: (s, c) => `Send three of the watch to carry ${c.first} in`, note: 'Whoever goes out walks where the struck one walked, under the same sky, to bring in somebody who doesn\'t want to come.', test: { base: 50, mods: [R('security', 10)] },
      ok: { text: (s, c) => `The three of them go out at a walk with a blanket. ${ev('out', c.ev, c)} They bring ${c.first} in wrapped in it, without a fight.`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 18, c.ev) }) },
      bad: { text: (s, c) => T(s).truth.is === 'tide' ? `The ground out there is soft and smells of iron. One of the watch goes in up to the waist at the low point and doesn't come up. ${c.Name} is still standing there when the others come back.` : `${c.Name} sees them coming and runs, further out. They lose ${c.first} in ${LF.lex(s, 'cover')} by noon, and come back without.`,
        fx: (s, c) => T(s).truth.is === 'tide' ? { pop: -1, morale: -2, do: s2 => { const t = T(s2); count(t, 1); learn(s2, t, 14, 'tide'); } } : Object.assign(c.pid ? { depart: [{ who: c.pid, cause: 'walked out under the red moon and was not found' }] } : { gone: 1 }, { morale: -1, do: s2 => { const t = T(s2); if (!c.pid) t.cnt = Math.max(0, t.cnt - 1); learn(s2, t, 5); } }) } },
    { about: true, label: (s, c) => `Have ${c.first} followed at a distance, and see where the walk leads`, note: (s, c) => `${c.Name} is left alone out there all day to be watched like an animal, by somebody walking where the struck walk.`, test: { base: 50, mods: [R('xenobio', 10), R('security', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} keeps a ridge between them all day. ${ev('out', c.ev2, c)} At dusk ${c.first} walks back to the gate alone and waits to be let in.`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev2) }) },
      bad: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} loses sight of ${c.first} behind a rise and spends the afternoon looking. ${c.Name} is back at the gate at dusk, with nothing to say about the day.`, fx: s => ({ do: s2 => learn(s2, T(s2), 6) }) } },
    { label: (s, c) => `Shoot ${c.first} from the wall, where the rows can see it`, dark: true, note: (s, c) => `No one walks out under the moon again, and ${c.name} is shot by somebody who knows the name.`, info: (s, c) => [['yield', 'Nobody walks out after this'], ['danger', c.Name]],
      out: { text: (s, c) => `The wall fires once. ${c.Name} goes down on the open ground and the rows see it from the yard. The watch brings the body in at noon, and the struck turn their heads to watch it carried past.`,
        fx: (s, c) => Object.assign(c.pid ? { kill: [{ who: c.pid, cause: 'shot from the wall, out under the red moon' }] } : { pop: -1 }, { tension: -7, morale: 1, stain: ['rm_shot', 2], do: s2 => { const t = T(s2); if (!c.pid) { t.cnt = Math.max(0, t.cnt - 1); } count(t, 1); t.shot++; t.shoot = true; t.did.shoot = true; } }) } },
  ] });

/* A saying has come due. */
B(['struck', 'last'], { id: 'rm.said', tone: 'pressure', title: 'What They Said',
  when: (s, t) => t.says.some(y => y.ok !== null),
  setup: s => { const t = T(s), done = t.says.filter(y => y.ok !== null), y = done[done.length - 1], nx = t.says.find(z => z.ok === null);
    return Object.assign(crew(s), { old: sayTxt(y), oldWho: y.who, oldPid: y.pid, oldRk: y.rk || null, ok: y.ok, said: t.said, hits: t.hits, nxt: nx ? sayTxt(nx) : null, nxWho: nx ? nx.who : null, nxPid: nx ? nx.pid : null, nxRk: nx ? nx.rk || null : null }); },
  text: (s, c) => `When the red moon went down the time before, ${c.oldWho} said a thing that was written down, with the date, in a ledger kept for what the struck say.\n\n[[${c.oldPid || c.oldRk || 'x26'}]] "${c.old}"\n\n${c.ok ? 'It came true.' : 'It didn\'t come true.'} ${c.said === 1 ? 'It is the first thing the struck have said that could be checked.' : `Of the ${num(c.said)} things the struck have said would happen, ${num(c.hits)} ${c.hits === 1 ? 'has' : 'have'}.`}${c.nxt ? `\n\nThe night the moon last went down, ${c.nxWho} said something new.\n\n[[${c.nxPid || c.nxRk || 'x26'}]] "${c.nxt}"` : ''}${c.sv ? `\n\n[[scientist]] "I wouldn't call that madness." "Not yet, not until somebody checks it, and I'd really like it to be me, so can we please write every word of it down, with the date, before anyone decides what it is?"` : ''}`,
  choices: [
    { label: 'Make ready for what the struck say next, whatever it costs the work', note: 'Hands and stores go to getting ready for what a moon-struck person said, and the colony is laughed at by its own if it doesn\'t come.',
      out: { text: 'The council takes the ledger as an order of business. Stores are put by and the roster is shifted for what the struck have said is coming. Some of the rows think the council has gone mad too.', fx: s => ({ progress: -0.05, do: s2 => { const t = T(s2); t.listen = true; t.did.listen = true; } }) } },
    { label: (s, c) => `Have ${c.w} question ${c.oldWho} until it's plain where it comes from`, dark: true, note: (s, c) => `The colony gets an answer of some kind, and ${c.oldWho} is kept awake and asked the same thing until there is one.`, info: (s, c) => [['yield', 'An answer'], ['danger', cap(c.oldWho)]],
      out: { text: (s, c) => `It takes three nights in the pump house with a lamp and no sleep. ${cap(c.oldWho)} says the same thing every time, in the same words.\n\n[[${c.oldPid || c.oldRk || 'x26'}]] "I looked at it, and it showed me."\n\n${({ light: `Then, the third night, only this.\n\n[[${c.oldPid || c.oldRk || 'x26'}]] "It's in the light. Shut the light out."`, tide: `Then, the third night, this.\n\n[[${c.oldPid || c.oldRk || 'x26'}]] "It came up out of the ground. I smelled it."`, fear: 'By the third night it\'s anything the questioner wants.', sight: 'And on the third night, one more thing about the next red week, which turns out right.' })[T(s).truth.is]}`,
        fx: (s, c) => ({ tension: -3, stain: ['rm_question', 1], do: s2 => { const t = T(s2); learn(s2, t, 16, t.truth.is); t.did.question = c.oldWho; sour(s2, c.oldPid, 15, 'was questioned for three nights over what the red moon showed'); } }) } },
    { label: 'Leave the ledger on the mess door and let people make of it what they will', note: 'Everyone reads it, and the frightened read the most into it.',
      out: { text: 'The ledger hangs on a nail beside the date. There is always somebody reading it. Some go and stand at the east windows themselves, to see what the struck see.', fx: s => ({ tension: 3, do: s2 => { const t = T(s2); t.cnt += t.truth.is === 'fear' ? 1 : 0; } }) } },
  ] });

/* Their eyes: shut them, take them, or let them look. */
B(['struck', 'last'], { id: 'rm.eyes', tone: 'crisis', title: 'Their Eyes', view: 'people',
  when: (s, t) => total(s, t) > 0,
  setup: s => { const t = T(s), nh = namedHere(s, t); return Object.assign(crew(s), { ev: pickK(s, t), tot: total(s, t), who: names(s, t), named: nh.map(p => ({ pid: p.id, name: p.name })) }); },
  text: (s, c) => `One of the struck was found at dawn scratching at both eyes with a thumbnail, hard enough to bleed, and saying it was still in there.${c.wv ? `\n\n[[security]] "So that's the answer, then, they want it out." "And if it's going to be done at all we could do it properly, once, in the clinic, instead of leaving them to do it with their thumbnails."` : ' The watch says out loud what half the colony is thinking: take the eyes, and the moon has nothing to get in by.'}${c.dv ? `\n\n[[doctor]] "You'll take their eyes over my body, and I mean that. The one with the thumbnail let me clean them this morning and held on to my wrist the whole time, and that's my patient, not the moon's."` : ''}${c.named.length ? `\n\nThe struck: ${c.who}.` : ''}`,
  choices: [
    { label: 'Bind their eyes through every red week, by force if it comes to it', note: (s, c) => `The struck spend a week of every few months blind and held, and the ones who fight it are held down.`,
      out: { text: (s, c) => `The cloths are cut and kept in a box by the clinic door. ${ev('eyes', c.ev, c)}`, fx: (s, c) => ({ tension: -1, do: s2 => { const t = T(s2); learn(s2, t, 16, c.ev); t.did.bind = true; } }) } },
    { label: 'Take their eyes, in the clinic, once and for good', dark: true, note: (s, c) => `Whatever the moon does through the eyes, it can't do again, and ${num(c.tot)} people are blinded for having looked.`, info: (s, c) => [['yield', 'An end to it, if it comes in by the eyes'], ['danger', `The ${num(c.tot)} struck`]],
      out: { text: (s, c) => `It's done over two days, ${c.dv ? `by an orderly, because ${c.dv} won't` : 'by an orderly with the manual open'}. None of the struck fights it. Afterwards they sit in the ward with bandaged faces turned toward the east wall.`,
        fx: (s, c) => ({ tension: -6, morale: 1, stain: ['rm_eyes', 3], do: s2 => { const t = T(s2); t.blinded = true; t.did.eyes = c.tot; if (t.truth.is === 'sight') t.dumb = true; for (const x of c.named) { const p = byPid(s2, x.pid); if (p && p.alive) p.marks.blinded = { d: s2.day, txt: 'was blinded in the clinic for being moon-struck' }; } } }) } },
    { label: 'Let them look, every red week, and write down what they say', note: 'The struck stand at the windows all week by order, and whatever the moon does to them it goes on doing.',
      out: { text: 'The struck are given the east windows for the red week, and a hand with a ledger sits behind them through the night. They are quiet, mostly. Now and then one of them says something, and it goes in the ledger.', fx: s => ({ tension: 2, do: s2 => { const t = T(s2); t.listen = true; t.did.listen = true; if (t.truth.is === 'light') t.cnt += 1; } }) } },
  ] });

/* The week before: keep to the plan, or change it. */
B(['struck', 'last'], { id: 'rm.before', tone: 'pressure', title: 'The Week Before',
  setup: s => { const t = T(s); return Object.assign(crew(s), { tot: total(s, t), seen: t.seen, toll: t.toll }); },
  text: (s, c) => `The chalk on the mess door is down to a handful of days. The plan, as it stands, is ${c.plan}. Since the first red week ${num(c.seen)} of the colony ${c.seen === 1 ? 'has' : 'have'} been struck and ${c.toll ? `${num(c.toll)} ${c.toll === 1 ? 'has' : 'have'} died of it in one way or another` : 'nobody has died of it yet'}, and the hall wants to know whether the plan is working.\n\n${c.lean}`,
  choices: [
    { label: 'Keep to the plan as it stands', note: 'Whatever the plan has been costing, it goes on costing, and whoever it hasn\'t protected stays unprotected.', out: { text: 'The plan is read out again in the hall, word for word, and nobody new speaks against it. The days come off the mess door one at a time.', fx: s => ({ tension: 1 }) } },
    /* Three on screen, never four: the plan kept, and the two other plans among shutters, the high ground and nothing.
       Nothing is hidden while the colony has no plan (or, in an old save, is in the holds), where shutters and the high
       ground are the two on offer. */
    prepChoice('shutters', { show: (s, c) => c.prep !== 'shutters' }), prepChoice('high', { show: (s, c) => c.prep !== 'high' }), prepChoice('none', { show: (s, c) => c.prep === 'shutters' || c.prep === 'high' }),
  ] });

/* ======================= LAST: the reckoning before the last red week ======================= */
B('last', { id: 'rm.holds', tone: 'crisis', title: 'Before the Next One',
  /* Three on screen, never four: the holds, the middle measure, or everything dropped. The middle one (c.mid) is the measure
     in place made to last: the high ground if the colony sleeps up there, shutters if those are up; with neither in place it
     is whichever of the two the evidence leans to (t.ev), shutters on a tie. The two have opposite shows. */
  setup: s => { const t = T(s); return Object.assign(crew(s), { tot: total(s, t), seen: t.seen, toll: t.toll, mid: t.prep === 'high' ? 'high' : t.prep === 'shutters' ? 'shutters' : (t.ev.tide || 0) > (t.ev.light || 0) ? 'high' : 'shutters' }); },
  text: (s, c) => `Every red week has been worse than the one before, and the hall has split over the next one. One half wants the colony below ground. The other half wants every measure against it dropped, and says the colony has been doing this to itself. ${Num(c.seen)} ${c.seen === 1 ? 'has' : 'have'} been struck since the first week, and ${c.toll ? `${num(c.toll)} ${c.toll === 1 ? 'is' : 'are'} dead of it` : 'nobody is dead of it yet'}.\n\nThe plan, as it stands, is ${c.plan}.\n\n${c.lean}`,
  choices: [
    prepChoice('holds', { label: 'Everyone into the holds, this time and every time after it, for good', out: { text: PREP_OUT.holds, fx: setPrep('holds', { fx: { morale: 1, tension: -8, stain: ['rm_holds', 2] } }) } }),
    prepChoice('high', { show: (s, c) => c.mid === 'high', label: 'Move the bunks up to the high ground, for good', note: 'The colony rebuilds its rows on the ridge and walks down to the fields, and every month of building goes into it.',
      out: { text: 'The low rows are stripped for their panels and carried up the hill a section at a time. The colony sleeps under canvas for a month while they go up again. The drain rows stand empty after that.', fx: setPrep('high', { fx: { mat: -15, progress: -0.1 } }) } }),
    prepChoice('shutters', { show: (s, c) => c.mid === 'shutters', label: 'Shutters and the curfew, and hold to them' }),
    { label: 'Drop every measure against it, and let the struck sleep where they like', note: 'Whoever looks up looks up, and the frightened are told there\'s nothing to be afraid of.',
      out: { text: 'Whatever was put up against the moon comes down and is stacked by the shed, and nobody rings a curfew. The struck are let out of wherever they\'ve been kept and go back to their old bunks, and some of the rows move out.', fx: setPrep('none', { free: true, fx: { tension: 4 } }) } },
  ] });

/* ======================= AFTER: what the moon was ======================= */
const WAS = {
  light: 'It was the light. Something in the red off the second moon, at one narrow band the ship\'s charts never had, gets in through the eyes of whoever stands under it long enough, and stays. A roof was enough, and so was a shutter.',
  tide: 'It was never the light. On the nights the second moon comes close it pulls something up out of the low ground, a gas heavier than air that pools wherever the colony is lowest. The ones who slept low breathed it. Shutters kept out the moon and nothing else.',
  fear: 'There was nothing in the moon. Its light was sunlight off red rock. The colony made the madness itself: a week of nights awake behind shutters, shut in with people it had been told to watch, counting down to a date chalked on a door.',
  sight: 'The ones who looked saw something that was there. What the red moon shows whoever watches it long enough is what is coming toward them, and what the struck said afterwards was true.' };
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [], add2 = (a, b, c2, e) => L.push({ light: a, tide: b, fear: c2, sight: e }[k]);
  if (d.holds) add2('The holds worked, and shutters would have done as well without the week in the dark.', 'The holds were an answer, as the high ground was.', 'Every week in the holds made it worse.', 'In the holds nobody saw anything, and nobody was warned.');
  if (d.blindwatch) add2('The watch gave its eyes for something a hood would have kept off.', 'The watch gave its eyes for nothing: it was never the light.', 'The watch gave its eyes for nothing.', 'The watch gave its eyes, and with them any chance of seeing what was coming.');
  if (d.eyes) add2(`The ${num(d.eyes)} struck who were blinded stopped getting worse, as they would have under a cloth.`, `The ${num(d.eyes)} struck who were blinded went on walking downhill in the dark.`, `The ${num(d.eyes)} struck who were blinded had nothing wrong with their eyes.`, `The ${num(d.eyes)} struck who were blinded were the only ones who could see it coming.`);
  if (d.outed) add2(`The ${num(d.outed)} put out through the gate were a danger to nobody but themselves.`, `The ${num(d.outed)} put out through the gate went out onto the low ground, which was the worst place for them.`, `The ${num(d.outed)} put out through the gate would have mended in their own bunks.`, `The ${num(d.outed)} put out through the gate were the colony's warning, and went out of earshot.`);
  if (t.shot) L.push(`${t.shot === 1 ? 'One was' : `${Num(t.shot)} were`} shot from the wall for being out under the moon.`);
  if (d.chain || d.pen || d.ward) add2('Keeping the struck behind a door did no harm and little good.', 'Keeping the struck behind a door did little, unless the door was up the hill.', 'The doors the struck were kept behind did them harm.', 'Behind a door, the struck were harder to hear.');
  if (d.book) add2('The burned ledger was only ever a ledger of madness.', 'The burned ledger was only ever a ledger of madness.', 'Burning the ledger quietened the rows.', 'The burned ledger was the truest thing the colony ever wrote.');
  if (t.mended) L.push(`${t.mended === 1 ? 'One of the struck' : `${Num(t.mended)} of the struck`} mended in time, and could not say afterwards what had been the matter.`);
  return L.filter(Boolean).slice(0, 5).join(' ') || 'Nobody was shut in, blinded or put out on account of it.';
}
B('after', { id: 'rm.truth', tone: 'quiet', title: 'What the Moon Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { toll: Math.max(0, t.toll), said: t.said, hits: t.hits, seen: t.seen }); },
  text: (s, c) => { const t = T(s); return `${WAS[t.truth.is]}\n\n${c.said ? `Of the ${num(c.said)} things the struck said would happen, ${num(c.hits)} did. ` : ''}${reckon(s, t)}${c.toll ? ` In all it cost ${num(c.toll)} colonist${c.toll === 1 ? '' : 's'}, and ${num(c.seen)} were moon-struck.` : ''}`; },
  choices: [
    { label: 'Enter it in the record as it happened, with every red week and every name', note: 'Everyone who barred a door, held a hood or gave an order on the wall has to live beside the page.',
      out: { text: 'The red weeks go into the colony record one by one, with the date of each, the names of the struck and what was done to them. People read it. Some stop greeting you, and one or two begin.', fx: s => ({ morale: -2, chron: 'The colony wrote the red weeks into the record, with the names.' }) } },
    { label: 'Enter it in the record as a sickness of the eyes, met and ended', dark: true, note: 'The colony gets an account it can live beside, and the struck and what was done to them are left out of it.', info: [['yield', 'Morale']],
      out: { text: 'The record says that a sickness of the eyes came with the second moon in the first years and was dealt with. The entry is three lines long. It is the version the children will be taught.', fx: s => ({ morale: 3, stain: ['rm_record', 1], chron: 'The record says that a sickness of the eyes came with the second moon.' }) } },
  ] });

/* The options behind rm_lie, rm_shoot, rm_blind, rm_pits, rm_chain, rm_left, rm_book and rm_dose were cut (three options at
   most, 2026-11-21); their phrases stay for saved games that carry the deed. */
Object.assign(LF.DEEDS || {}, {
  rm_pen: 'the moon-struck barred in the pump house for looking up', rm_lie: 'the moon-struck worked as if nothing had happened to them', rm_holds: 'the whole colony shut in the dark below every red week',
  rm_shoot: 'the order to shoot anyone out under the red moon', rm_struckwatch: 'the moon-struck stood on the wall under the moon again', rm_blind: 'the eyes the watch gave to stand the wall',
  rm_hush: 'the moon-struck made to eat apart and speak to nobody', rm_pits: 'the moon-struck sent down the night pits', rm_out: 'the moon-struck put out past the wire',
  rm_chain: 'the moon-struck chained to their bunks', rm_left: 'the one left outside the wire under the red moon', rm_shot: 'the one shot from the wall under the red moon',
  rm_question: 'the three nights of questions in the pump house', rm_book: 'the burned ledger of what the moon-struck said', rm_eyes: 'the moon-struck blinded in the clinic',
  rm_dose: 'the moon-struck drugged asleep every red week', rm_record: 'the three lines in the record about a sickness of the eyes',
});

LF.TAGS['rm.first'] = ['mercy open', 'bold open', 'severe closed'];
LF.TAGS['rm.date'] = ['cautious order', 'cautious', 'free'];
LF.TAGS['rm.watch'] = ['order', 'severe', 'cautious'];
LF.TAGS['rm.after'] = ['open', 'closed order', 'mercy order'];
LF.TAGS['rm.ward'] = ['mercy cautious', 'severe', 'open'];
LF.TAGS['rm.out'] = ['mercy bold', 'bold open', 'severe order'];
LF.TAGS['rm.said'] = ['open bold', 'severe', 'free open'];
LF.TAGS['rm.eyes'] = ['cautious order', 'severe', 'open free'];
LF.TAGS['rm.before'] = ['order', 'cautious order', 'cautious', 'free'];
LF.TAGS['rm.holds'] = ['severe order', 'bold', 'cautious order', 'free open'];
LF.TAGS['rm.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
const HIGH = { barren: 'The basalt rise', ruin: 'The terrace above the grid', ice: 'The pressure ridge', drowned: 'The reef crest', jungle: 'The bald hill', garden: 'The down above the camp' };
LF.THREADS[ID].pois = (s, t) => s.used['rm.first'] === undefined ? [] : [{ k: 'high', card: s.used['rm.out'] !== undefined ? 'rm.out' : 'rm.first', name: HIGH[s.world.type] || HIGH.garden, kind: 'ridge', dist: 'near', danger: 2,
  state: s.used['rm.out'] !== undefined || t.prep === 'high' ? 'located' : 'rumoured',
  known: s.used['rm.out'] !== undefined ? 'The red moon comes up over it. The watch found one of the struck standing out here at first light, alone, and nobody saw anyone go out.'
    : 'The red moon comes up over it. The ones who watched longest sit on their bunks facing this way.' }];
/* A party the player sent to the high ground (orders.js order.send, T2-5): what they found where the struck walk to,
   which points at the truth most of the time (pickK), as the cards' evidence does. A seep on the low side, or a line of
   stones laid and laid again toward one point of the horizon, comes home as a card; the rest as a Meanwhile line. No find
   paints or describes the moon. line(): a find with nothing to decide is a line when the return itself had nothing to
   decide either (LF.AWAY_QUIET). */
const line = (a, v) => { if (v) v.quiet = true; return v; };   // nothing to decide: a Meanwhile line when the return itself was quiet (js/orders.js needsCard)
const CROWN = {
  light: c => `On the open crown of ${c.at} the ground is bleached pale in a wide round patch, as if something had lain on it a long time. In the lee of the one big boulder, out of the sky's line, it keeps its own colour.`,
  tide: c => `Most of the struck's prints never reach the crown. They go round its foot to the lowest ground on that side, where a seep the survey never logged has opened in a crust the colour of struck iron, and the rust line round it stands a hand above the water.`,
  fear: c => `Nobody has been up there but the colony's own: boot prints, a tin cup, a scrap of blanket. The party sat out a night on the crown under the whole sky, saw nothing in it, and came down well.`,
  sight: c => `On the crown someone has built a cairn and laid a line of stones out from it toward one point of the horizon. The line has been lifted and laid again, a little further round each time, and the old sockets are still in the ground: four of them, like the hand of a slow clock.` };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'high' || t.end) return null;
  const e = pickK(s, t, 0.05), c = { at: String(HIGH[s.world.type] || HIGH.garden).replace(/^The /, 'the ') };
  const fx = { survey: 8, do: s2 => learn(s2, T(s2), 10, e) };
  if (e === 'tide') return { title: 'The Seep', tone: 'pressure', scene: 'away_rm_seep', text: CROWN[e](c), fx };
  if (e === 'sight') return { title: 'The Line of Stones', tone: 'pressure', scene: 'away_rm_line', text: CROWN[e](c), fx };
  return line(a, { title: 'Where the Struck Walk', tone: 'quiet', text: CROWN[e](c), fx });
};
})();

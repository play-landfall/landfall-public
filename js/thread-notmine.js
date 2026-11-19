/* Landfall — thread: Not Mine. A next-generation dread (NEXT.md WO-9; DESIGN.md "The dreads").
   A mother says the child in the cradle is not the one she bore. Then another does. The children are healthy, and the
   clinic's book of births says each is where it should be. It is about recognition: a parent, a healthy child, and a
   book that says they belong together. It keeps to children carried and born the ordinary way: the incubators'
   children (gen.bank) and the made (thread-made.js) are outside the doubt, and the cards say so where they exist.
   The clinic's book here is the book of births (hour, weight, ankle tag, the midwife's initials), the thread's own
   record, and not gen.lines (the book of who descends from whom). No card is a child bearing a child, and children
   lost on a card are a count worked out at setup and taken exactly (LF.gn.young).
   Not dealt by the plot or the storm (own: true, fits 0): LF.nmTick opens it once there are children born here, a
   clinic or an autodoc on the ground, and the colony is into its second year, at ODDS a year; never while the Friend
   (WO-8) is pressing, so the two next-generation dreads do not share their years.
   Rolled in secret (t.truth.is), each making a different answer the right one:
     mixup  the clinic did swap two, once, on a night with two births in an hour. The first mother is right and the
            rest is fear. Right: test, and move a child only where two results point at each other.
     fever  it is in the mothers, a sickness of recognition, and every child is its own parents'. Right: nurse the
            mothers with the children beside them. The nursery makes it worse; the test breaks households for nothing.
     real   something does change infants in their first month, and the mothers are right. The test reads their
            blood as their parents' (the body is the same) and cannot place the changed ones. Right: watch the
            first month (the nursery, or a lamp in every house); putting out the ones the test cannot place stops it.
     hand   one midwife (t.mw) has been changing them on purpose. Right: take the births from the midwives.
   t.list holds the households in question (up to twelve: named where the card needs a face, counted otherwise), with
   what is true of each (swapped, changed, fevered) and what the test said (res: match, cross, none). The test's
   accuracy (t.truth.acc) is never stated. Between cards (month) it costs by its own arithmetic. Dice: LF.srand.
   Every card's text reads only what setup put in ctx: the UI draws the card again under its outcome. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, M, byPid } = h;
const ID = 'notmine', T = s => LF.T(s, ID), SRC = 'th.notmine', YEAR = LF.YEAR, MONTH = LF.MONTH;
const KINDS = ['mixup', 'fever', 'real', 'hand'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const num = n => { n = Math.max(0, Math.round(n)); return n < ONES.length ? ONES[n] : LF.num(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
// The dials. ODDS: the chance a year that it opens in a colony that qualifies. RATE: how fast it spreads between cards, by truth.
const ODDS = 0.3, KIDS = 6, RATE = { mixup: 0.25, fever: 0.4, real: 0.35, hand: 0.35 }, LOSS = { fever: 0.1, real: 0.08 };
const MAXLIST = 12;

/* ---------- evidence: what each look seems to say, right more often than not ---------- */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  exam: {
    mixup: c => `The ankle tag on the child is tied with a reef knot. Every other tag on the ward is tied with the clinic's slip knot, and the book has the child born an hour before ${c.m1f} remembers.`,
    fever: c => `The child is well and feeding. ${c.M1} isn't: a temperature of thirty-eight, a pulse that won't settle, and no memory of the last two feeds.`,
    real: c => 'The child is well and heavier than the birth weight by more than a month should add. It follows the lamp with its eyes and nothing else, and it doesn\'t cry at the heel prick.',
    hand: c => 'The child is well. The mark from the birth prick is on the left heel. The clinic has pricked the right heel since the landing.' },
  night: {
    mixup: c => `Nothing happens in the night. ${c.M1} sits up talking to the child, and by morning is holding it like any parent, and still says it isn't the one.`,
    fever: c => `The neighbour sits up and sees nothing but ${c.m1}, awake all night, checking the child's face against something only ${c.m1f} can see. By dawn the neighbour has a temperature too.`,
    real: c => `In the small hours the child stops breathing for a long minute and then starts again. ${c.M1} was awake the moment before it stopped, and says that's what happened the first time.`,
    hand: c => 'Near midnight somebody knocks and asks through the door whether the baby needs changing, the way the clinic asks. Nobody sent for anyone. When the neighbour opens the door the yard is empty.' },
  mothers: {
    mixup: c => `Of every birth in the book, only two fell in the same hour: ${c.m1}'s, and a household that hasn't said a word.`,
    fever: c => 'Both mothers ran the same fever in the second week after the birth, and so has every parent who has spoken up since. None of the others has.',
    real: c => 'Both children were born well and both mothers were sure of them for three weeks. Both say it changed in the fourth, overnight, and they name the same night.',
    hand: c => `Both births were on ${c.mw}'s nights on the ward, and both children were taken out to be washed while the mother slept.` },
  book: {
    mixup: c => 'Two births in one hour on the same night, with one midwife on the ward. The tags were tied after both children were washed, and the two weights are entered the wrong way round, crossed through and entered again.',
    fever: c => 'The book is clean: every child weighed, tagged and handed back inside the hour, in two hands the clinic knows. In the margin, against each doubting household, the duty clerk has noted a fever in the mother in the second week.',
    real: c => 'The book is clean to the birth. After that each child is weighed every week, and in every doubting household the weight jumps in the fourth week, by more than a child can drink.',
    hand: c => `The book is clean, and too clean. Every entry on ${c.mw}'s nights is in the same ink and the same hand, written up at the end of the shift, and none carries the second initial the clinic's rule asks for.` },
  midwife: {
    mixup: c => `${c.Mw} remembers the night: two births in an hour, one lamp, and the tags tied afterwards at the washing table. ${c.Mwf} went white saying it, and asked whether it could have been those two.`,
    fever: c => `${c.Mw} answers everything, twice, and has nothing to hide. By the third hour ${c.mwf} is asking the watch whether any parent ever really knows.`,
    real: c => `${c.Mw} says what the old midwives on the ship used to say: for the first month a child is only half here. ${c.Mwf} won't say more, and asks to be let go before dark.`,
    hand: c => `${c.Mw} keeps to the story until the third hour, then asks which children the colony means. It's a strange question, and ${c.mwf} asks it as if there were a list.` },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { mixup: 'a mistake in the clinic, once, and fear after it', fever: 'something in the parents, and not the children', real: 'the children themselves, and something in their first month', hand: 'somebody at the births' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* ---------- the households ---------- */
const LABS = ['a household in the second row', 'the pump hand\'s household', 'a household by the wash-house', 'the night cook\'s household', 'a household at the end of the east row',
  'the net mender\'s household', 'a household over the stores', 'the carter\'s household', 'a household by the gate', 'the bread hand\'s household', 'a household in the old pods', 'the lamp trimmer\'s household', 'a household by the drying sheds'];
const person = (s, e) => e && e.pid ? byPid(s, e.pid) : null;
const GONE = { out: 1, lost: 1 };
const here = e => !GONE[e.fate];
const nameOf = (s, e) => { const p = person(s, e); return p ? p.name : cap(e.lab); };
const nm = (s, e) => { const p = person(s, e); return p ? p.name : e.lab; };
const firstOf = (s, e) => { const p = person(s, e); return p ? p.first : 'the household'; };
const byK = (t, k) => t.list.find(e => e.k === k);
function add(s, t, o) { if (t.list.length >= MAXLIST) return null; const e = Object.assign({ k: 'h' + (t.next++), pid: null, lab: null, asked: false, swapped: null, changed: false, fev: false, res: [], fate: null }, o);
  if (!e.pid && !e.lab) { const used = t.list.map(x => x.lab); e.lab = LF.spick(s, LABS.filter(l => !used.includes(l))) || 'a household in the far row'; }
  t.list.push(e); return e; }
/* The two mothers are given names a reader takes for a mother's (the cast has no pronouns, so the name carries it). */
const MOTHERS = ['Imani', 'Oksana', 'Mei', 'Leila', 'Ingrid', 'Noor', 'Zofia', 'Anneke', 'Priya', 'Ruth', 'Ilse', 'Ayesha', 'Dalia', 'Farah', 'Hana', 'Ifeoma', 'Lucia', 'Nadia', 'Paloma', 'Rania',
  'Wanjiru', 'Yara', 'Zeynep', 'Aiko', 'Carmen', 'Esi', 'Ines', 'Lerato', 'Mirela', 'Niamh', 'Rosa', 'Saoirse', 'Thandi', 'Zainab', 'Birgit', 'Dagny', 'Greta', 'Isadora', 'Nilufar', 'Odette', 'Sunita'];
const named = (s, why, mother) => { const p = LF.makePerson(s, null); p.known = s.day || 1; if (why) p.marks.notmine = { d: s.day, txt: why };
  if (mother) { const free = MOTHERS.filter(f => !s.people.some(q => q.first === f)); if (free.length) { p.first = LF.spick(s, free); p.name = p.first + ' ' + p.last; } }
  return p; };
const last = e => e.res.length ? e.res[e.res.length - 1] : null;
const RES = { match: 'the test says the child is theirs', cross: 'the test gives the child to another household', none: 'the test can\'t place the child with anyone' };
const FATE = { given: 'the child moved', out: 'put out at the gate', ward: 'the child on the ward', step: 'left on the clinic step', back: 'given back' };
function listText(s, t, keys) {
  const L = keys ? keys.map(k => byK(t, k)).filter(Boolean) : t.list;
  return L.map(e => `${nameOf(s, e)}: ${last(e) ? RES[last(e)] : e.asked ? 'says the child isn\'t theirs' : 'hasn\'t said anything'}${e.fate && FATE[e.fate] ? ` (${FATE[e.fate]})` : ''}`).join('\n'); }
/* The test, one household: what it reads depends on what is true, how well it reads it on t.truth.acc and the bench. */
const accOf = (s, t, bonus) => clamp(t.truth.acc + (LF.has(s, 'lab') ? 0.05 : 0) + (LF.down(s, 'medbay') ? 0.04 : 0) + (bonus || 0), 0.6, 0.97);
function testOne(s, t, e, bonus) { const a = accOf(s, t, bonus), r = LF.srand(s);
  if (e.swapped) return r < a ? 'cross' : 'match';
  if (e.changed) return r < a ? 'none' : 'match';
  return r < a ? 'match' : LF.srand(s) < 0.5 ? 'none' : 'cross'; }
const round = (s, t, keys, bonus) => { const o = {}; for (const e of t.list) if (here(e) && e.fate !== 'given' && (!keys || keys.includes(e.k))) o[e.k] = testOne(s, t, e, bonus); return o; };
const truthOf = e => e.swapped ? 'cross' : e.changed ? 'none' : 'match';
function apply(t, rr) { for (const k in rr) { const e = byK(t, k); if (!e) continue; e.res.push(rr[k]); t.tests++; if (rr[k] === truthOf(e)) t.right++; } t.tested = true; }
const resLine = (s, t, rr) => Object.keys(rr).map(k => { const e = byK(t, k); return e ? `${nameOf(s, e)}: ${RES[rr[k]]}` : ''; }).filter(Boolean).join('\n');
/* Moving children by the test. all: every cross is moved; else only where two results point at each other (a real pair, both read). */
function give(s, t, all) { let moved = 0, broke = 0, right = 0;
  for (const e of t.list) { if (!here(e) || e.fate === 'given' || last(e) !== 'cross') continue;
    const mate = e.swapped && byK(t, e.swapped), pair = mate && last(mate) === 'cross';
    if (!all && !pair) continue;
    e.fate = 'given'; moved++; if (e.swapped) right++; else broke++; }
  t.moved += moved; t.broken += broke; t.returned += right;
  if (t.truth.is === 'mixup') { const a = byK(t, t.pair[0]), b = byK(t, t.pair[1]); if (a && b && a.fate === 'given' && b.fate === 'given') t.pairBack = true; }
  return { moved, broke, right }; }
const unplaced = t => t.list.filter(e => here(e) && e.fate !== 'given' && last(e) === 'none');
const atStep = t => t.stepN || 0;

/* ---------- people around it ---------- */
const nmR = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
/* An officer speaks in their own voice only when it is the authored officer, here: a promoted colonist has none. */
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.CAST[seat] && p.key === LF.CAST[seat][0].key && LF.seatState(s, seat) === 'here' ? p.first : null; };
const glassLine = s => { const x = s.gen && s.gen.x, tank = x && x.tank && x.tank.born > 0, made = LF.T(s, 'made') && !LF.T(s, 'made').end;
  return tank && made ? ' Nobody doubts the children from the incubators or the made ones in the schoolroom: nobody ever claimed to have borne them.'
    : tank ? ' Nobody doubts the children from the incubators: nobody carried them, and nobody claims them as born.' : made ? ' Nobody doubts the made children in the schoolroom: nobody ever claimed to have borne them.' : ''; };
function crew(s) { const t = T(s), o = { d: nmR(s, 'physician'), w: nmR(s, 'security'), q: nmR(s, 'quartermaster') }; o.D = cap(o.d); o.W = cap(o.w); o.Q = cap(o.q);
  { const wp = P(s, 'security'); o.wn = wp ? wp.name : null; }
  o.dv = voice(s, 'doctor'); o.wv = voice(s, 'security'); o.cv = voice(s, 'command');
  o.bench = LF.down(s, 'medbay') ? 'the autodoc' : LF.has(s, 'lab') ? 'the laboratory bench' : 'the clinic\'s bench';
  o.glass = glassLine(s); o.lean = t ? lean(t) : '';
  const m1 = t && byK(t, t.m1), m2 = t && byK(t, t.m2), mw = t && byPid(s, t.mw);
  Object.assign(o, { m1: m1 ? nm(s, m1) : 'the first mother', M1: m1 ? nameOf(s, m1) : 'The first mother', m1f: m1 ? firstOf(s, m1) : 'the mother',
    m2: m2 ? nm(s, m2) : 'the second mother', M2: m2 ? nameOf(s, m2) : 'The second mother', m2f: m2 ? firstOf(s, m2) : 'the mother',
    mw: mw ? mw.name : 'the night midwife', Mw: mw ? mw.name : 'The night midwife', mwf: mw ? mw.first : 'the midwife', Mwf: mw ? mw.first : 'The midwife', mwpid: mw && mw.alive ? mw.id : null,
    asked: t ? t.asked : 2 });
  return o; }
const who = (s, e) => e ? { k: e.k, pid: e.pid, name: nm(s, e), Name: nameOf(s, e), first: firstOf(s, e), First: cap(firstOf(s, e)) } : { k: null, pid: null, name: 'a household in the far row', Name: 'A household in the far row', first: 'the household', First: 'The household' };
const sour = (s, pid, v, txt) => { const p = pid && byPid(s, pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
/* Deaths of the grown between cards, never below a working floor; children through LF.gn.young, exact. */
function take(s, t, n) { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 14)), true); const k = b - s.pop; t.toll += k; return k; }
function infants(s, t, n) { const d = LF.gn.young(s, Math.min(n, LF.kidCount(s))); t.kids += d; return d; }

/* ---------- how it ends ---------- */
function endOf(t) { const k = t.truth.is, d = t.did;
  if (k === 'real') return d.out ? 'out' : t.nursery || t.lamps ? 'watched' : 'kept';
  if (k === 'fever') return d.out ? 'out' : d.given && t.broken ? 'broken' : d.nursed ? 'nursed' : t.nursery ? 'worse' : 'passed';
  if (k === 'mixup') return t.pairBack || t.returned ? (t.broken ? 'broken' : 'swapped') : d.out ? 'out' : d.given && t.broken ? 'broken' : 'book';
  return t.mwOut ? 'caught' : d.out ? 'out' : 'ran'; }
const CHRON = { out: 'The colony put out at the gate the infants its blood test could not place.', watched: 'The colony watched its infants through their first month, and no more of them changed.',
  kept: 'The changed children grew up in the rows.', broken: 'The colony gave its infants back to whoever the blood test named, and broke households that had been whole.',
  nursed: 'The mothers who doubted their children were nursed, and the doubt broke.', worse: 'The colony took its infants from their mothers into one nursery, and the doubt spread.',
  passed: 'The mothers\' doubt passed in its own time.', swapped: 'Two children the clinic had given to the wrong households were given back.', book: 'The clinic\'s book stood, and two children grew up in each other\'s houses.',
  caught: 'The midwife who had been changing the colony\'s infants was taken off the births.', ran: 'Somebody at the births went on changing the colony\'s infants until it stopped by itself.' };
function finish(s, t, end) { if (t.end) return; LF.endThread(s, ID, end, CHRON[end]); s.sched = s.sched.filter(e => !/^nm\./.test(e.id)); s.sched.push({ id: 'nm.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
/* What each end costs on top of what the cards cost. */
function bill(s, t, end) {
  if (end === 'worse') { const n = take(s, t, 2); LF.log(s, `${n === 1 ? 'A mother' : `${Num(n)} mothers`} kept from the nursery stopped eating, and the clinic could not bring them back.`, 'bad'); }
  if (end === 'kept') { take(s, t, 1); s.morale = clamp(s.morale - 3, 0, 100); LF.log(s, 'A mother in one of the doubting households was found cold beside the cradle at first light. The child was asleep, and well.', 'bad'); }
  if (end === 'ran') { t.swaps += 2; s.morale = clamp(s.morale - 3, 0, 100); s.tension = clamp(s.tension + 6, 0, 100); }
  if (end === 'book' || end === 'passed') s.morale = clamp(s.morale - 2, 0, 100);
}
function close(s, t) { if (t.end) return; const end = endOf(t); t.pend = end;
  if (atStep(t) && s.used['nm.step'] === undefined) { LF.phase(s, ID, 'bill'); jump(s, 'nm.step', 20); return; }
  bill(s, t, end); finish(s, t, end); }

LF.thread({ id: ID, name: 'Not Mine', view: 'people', dread: true, own: true,
  fits: () => 0,
  clue: (s, t) => ({ txt: 'A clinic ankle tag cut through, in a drawer with eleven others still knotted, each knot a little different.', learn: s2 => learn(s2, T(s2), 12) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'first' ? 'the mother on the ward' : 'Not Mine',
  roll: s => ({ is: LF.spick(s, KINDS), acc: 0.72 + LF.srand(s) * 0.2 }),
  sig: t => t.truth.is,
  ask: (s, t) => 'Whose children are in the cradles?',
  chap: {
    swapped: t => 'The clinic had given two children to the wrong households on a night with two births in an hour. The test found it, and the children went back where they belonged. The rest was fear.',
    broken: t => ({ mixup: 'The clinic had swapped two children once. The colony gave every child back by the test, and the test broke households that had been whole.', fever: 'It was in the mothers, and every child was its own parents\'. The colony gave the children out by a blood test, and broke households for a fever.' })[t.truth.is] || 'The colony gave its children out by a blood test, and broke households that had been whole.',
    nursed: t => 'It was in the mothers, a sickness of knowing, and every child was its own parents\'. The clinic nursed the mothers with the children beside them, and the doubt broke.',
    worse: t => 'It was in the mothers, and every child was its own parents\'. The colony took the infants from them into one nursery, and the doubt spread.',
    passed: t => t.truth.is === 'fever' ? 'It was in the mothers, and every child was its own parents\'. It passed in its own time.' : 'The fear passed in its own time.',
    book: t => 'The clinic had swapped two children once, and the colony held to its book. Two children grew up in each other\'s houses, and one mother never stopped saying so.',
    out: t => t.truth.is === 'real' ? 'Something did change the infants in their first month, and the mothers were right. The colony put out at the gate the ones its test could not place, and no more changed.' : 'The colony put out at the gate the infants its blood test could not place. Nothing had been wrong with them but the test.',
    watched: t => 'Something did change the infants in their first month, and the mothers were right. The colony watched every child through the first month, and no more changed.',
    kept: t => 'Something did change the infants in their first month, and the mothers were right. The changed ones grew up in the rows with everyone else.',
    caught: t => 'One midwife had been changing the colony\'s infants on purpose. The births were taken from the midwives, and it stopped.',
    ran: t => 'One midwife had been changing the colony\'s infants on purpose, and went on until there was no one left on the ward to stop.',
  },
  start: (s, t) => { Object.assign(t, { list: [], next: 1, insight: 0, ev: {}, did: {}, q: {}, toll: 0, kids: 0, tests: 0, right: 0, tested: false, moved: 0, broken: 0, returned: 0, outN: 0, stepN: 0,
    asked: 2, swaps: 0, changed: 0, nursery: 0, lamps: 0, mwOut: false, pairBack: false, pair: null, m1: null, m2: null, m3: null, mw: null, pend: null }); },
  tick: (s, t) => {
    if (t.end) return;
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'first') { if (since('nm.first') < 0 && age < 90) jump(s, 'nm.first', 20); if (since('nm.first') >= 10 || age >= 90) { LF.phase(s, ID, 'second'); t.list.forEach(e => { if (e.k === t.m2) e.asked = true; }); LF.cue(s, 'nm.second', 0, 4); } }
    else if (t.phase === 'second') { if (since('nm.second') >= 6) once('book', 'nm.book'); if (since('nm.second') >= 14) once('mw', 'nm.midwives'); if (since('nm.second') >= 22) once('nur', 'nm.nursery');
      if ((since('nm.second') >= 30 && (since('nm.midwives') >= 6 || since('nm.second') >= 50)) || age >= 100) { LF.phase(s, ID, 'test', 'The clinic began to test the colony\'s infants by blood.'); LF.cue(s, 'nm.test', 0, 4); } }
    else if (t.phase === 'test') { const ts = since('nm.test');
      if (ts >= 6 && t.tested && cradle(s, t)) once('cradle', 'nm.cradle'); if (ts >= 12 && t.tested && unplaced(t).length) once('gate', 'nm.gate');
      if (!t.q.nur && ts >= 4) once('nur', 'nm.nursery');
      if ((ts >= 26 && (since('nm.gate') >= 6 || !unplaced(t).length || ts >= 45)) || age >= 90) { LF.phase(s, ID, 'reckon', 'The hall split over the colony\'s infants.'); jump(s, 'nm.reckon', 20); } }
    else if (t.phase === 'reckon' && since('nm.reckon') < 0 && age < 50) jump(s, 'nm.reckon', 20);
    else if (t.phase === 'reckon' && (since('nm.reckon') >= 20 || age >= 50)) { if (since('nm.reckon') < 0) { t.did.left = true; LF.log(s, 'Nobody gave an order about the infants. The book stood, because nothing replaced it.', 'bad'); } return close(s, t); }
    else if (t.phase === 'bill' && (since('nm.step') >= 8 || age >= 40)) { bill(s, t, t.pend || endOf(t)); return finish(s, t, t.pend || endOf(t)); }
    if (s.day % MONTH === 0 && t.phase !== 'latent') month(s, t);
    if (s.day % 5 === 0) { const late = ['test', 'reckon', 'bill'].includes(t.phase);
      LF.emit(s, 'suspicion', SRC, late ? 40 : 28, 8, 'mothers are saying the children in the cradles are not the ones they bore');
      if (late) LF.emit(s, 'fear', SRC, 30, 8, 'nobody with an infant is sure whose it is');
      if (t.truth.is === 'fever') LF.emit(s, 'sickness', SRC, 18, 8, 'the doubting mothers are running a fever');
      if (t.truth.is === 'real' && t.changed > 2) LF.emit(s, 'changed', SRC, 22, 8, 'the mothers say the infants change in their first month'); }
  },
  /* The doubt is paid for in hands: parents off shift, a watch at the clinic, minders in the nursery. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent') return;
    let d = { first: 0.003, second: 0.008, test: 0.012, reckon: 0.015, bill: 0.006 }[t.phase] || 0;
    if (t.nursery) d += 0.015; if (t.lamps) d += 0.012;
    P.labor -= d; if (['test', 'reckon'].includes(t.phase)) P.morale -= 0.006; },
});
/* Fewer children are started in a colony that doubts the ones it has, and fewer for a while after it broke households. */
LF.BIRTH_MODS.push(s => { const t = s.threads && s.threads[ID]; if (!t || !t.on || t.phase === 'latent') return 1;
  if (!t.end) return t.nursery ? 0.8 : 0.88;
  return (t.end === 'broken' || t.end === 'out' || t.end === 'worse') && s.day - (t.endDay || 0) < 2 * YEAR ? 0.9 : 1; });
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* ---------- opening it: the households, by what is true ---------- */
function open(s, t) {
  const G = LF.gen(s), y = LF.date(s.day).year, recent = (G.co[y] || 0) + (G.co[y - 1] || 0), n = clamp(recent, 6, MAXLIST);
  const p1 = named(s, 'said the child in the cradle was not the one born', true), p2 = named(s, 'said the child in the cradle was not the one born', true), p3 = named(s, null), mw = named(s, null);
  mw.marks.midwife = { d: s.day, txt: 'a midwife on the clinic\'s nights' }; t.mw = mw.id;
  const e1 = add(s, t, { pid: p1.id, asked: true }), e2 = add(s, t, { pid: p2.id }), e3 = add(s, t, { pid: p3.id });
  while (t.list.length < n) add(s, t, {});
  t.m1 = e1.k; t.m2 = e2.k; t.m3 = e3.k;
  const k = t.truth.is, rest = t.list.slice(3);
  if (k === 'mixup') { e1.swapped = e3.k; e3.swapped = e1.k; t.pair = [e1.k, e3.k]; }
  if (k === 'hand') { const o = rest[0] || e3; e1.swapped = e3.k; e3.swapped = e1.k; e2.swapped = o.k; o.swapped = e2.k; t.swaps = 2; }
  if (k === 'real') { e1.changed = e2.changed = true; t.changed = 2; }
  if (k === 'fever') { e1.fev = e2.fev = true; }
}
/* Once a month, while it lasts. */
function month(s, t) {
  const k = t.truth.is, r = LF.srand(s), free = t.list.filter(e => here(e) && !e.swapped && !e.changed && !e.res.length);
  if (k === 'fever') { if (r < RATE.fever * (t.nursery ? 1.6 : 1)) { t.asked++; const e = free.find(x => !x.fev); if (e) { e.fev = true; e.asked = true; } }
    if (LF.srand(s) < LOSS.fever * (t.nursery ? 2 : 1) && !t.did.nursed && LF.kidCount(s) > 0 && infants(s, t, 1)) LF.log(s, 'The clinic lost an infant from one of the doubting households. The mother had stopped feeding a child she did not believe was hers, and nobody had noticed in time.', 'bad');
    if (LF.srand(s) < 0.15 && !t.did.nursed) t.stepN++; }
  else if (k === 'real') { const hold = t.nursery ? 0 : t.lamps ? 0.5 : 1;
    if (r < RATE.real * hold) { t.changed++; t.asked++; const e = free[0]; if (e) { e.changed = true; e.asked = true; } }
    if (LF.srand(s) < LOSS.real * Math.min(3, t.changed / 2) && take(s, t, 1)) LF.log(s, 'A mother in one of the doubting households was found cold beside the cradle at first light. The child was asleep, and well.', 'bad'); }
  else if (k === 'hand') { if (!t.mwOut && r < RATE.hand * (t.nursery ? 1.5 : 1)) { t.swaps++; t.asked++; const a = free[0], b = free[1]; if (a && b) { a.swapped = b.k; b.swapped = a.k; a.asked = true; } } }
  else { if (r < RATE.mixup) t.asked++; if (LF.srand(s) < 0.1) t.stepN++; }
  s.morale = clamp(s.morale - 0.5, 0, 100);
}
/* The household that was fine until the test: one that never asked, and that the test says is not the child's. */
const cradle = (s, t) => t.list.find(e => here(e) && !e.asked && e.res.length && last(e) !== 'match' && !e.done) || null;

/* ======================= FIRST: the mother on the ward ======================= */
B('first', { id: 'nm.first', tone: 'pressure', title: 'Not the One',
  setup: s => { const t = T(s), c = crew(s); return Object.assign(c, { ev: pickK(s, t), ev2: pickK(s, t, -0.05), m1pid: byK(t, t.m1).pid, wk: LF.sri(s, 3, 6) }); },
  text: (s, c) => `${c.M1} brought the child back to the clinic at first light and put it on the bench. It is ${num(c.wk)} weeks old, feeding and well, and the clinic's book has it weighed, tagged and handed to ${c.m1f} an hour after the birth. ${c.M1} says the child in the cradle isn't the one ${c.m1f} bore, and won't pick it up again.${c.dv ? `\n\n[[physician]] "There's nothing wrong with this baby." "So I'm looking at the parent. Give me a day with both of them."` : ''}`,
  choices: [
    { label: (s, c) => `Have ${c.d} examine them both, and keep the child with ${c.m1f}`, note: (s, c) => `${c.M1} goes home with a child ${c.m1f} won't hold, and the clinic says nothing else is wrong.`, test: { base: 55, mods: [R('physician', 14), M('medbay', 6)] },
      ok: { text: (s, c) => `${c.D} spends the day with them. ${ev('exam', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `${c.D} finds a healthy child and a parent who hasn't slept, and writes down both. ${c.M1} goes home with the child in a sling and the sling held away from the body.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: (s, c) => `Send them home, with a neighbour to sit up with them nights`, note: (s, c) => `The neighbour loses a month of sleep, and ${c.m1} learns the colony thinks ${c.m1f} needs watching.`,
      out: { text: (s, c) => `A neighbour from the same row takes the stool by the cradle. ${ev('night', c.ev2, c)}`, fx: (s, c) => ({ do: s2 => { learn(s2, T(s2), 14, c.ev2); sour(s2, c.m1pid, 5, null); } }) } },
    { label: (s, c) => `Dose ${c.m1f} at the clinic until the child is fed without a fight`, dark: true, note: (s, c) => `The child is fed and the row is quiet, and ${c.m1} spends the month too slow to say anything.`, info: (s, c) => [['yield', 'The child fed, the row quiet'], ['danger', c.M1]],
      out: { text: (s, c) => `${c.D} writes the dose. ${c.M1} feeds the child on the clinic bench twice a day, slowly, and says nothing about it to anyone. The row stops asking.`,
        fx: (s, c) => ({ morale: 1, tension: -3, stain: ['nm_dosed', 1], do: s2 => { const t = T(s2); t.did.dosed = true; sour(s2, c.m1pid, 15, 'was dosed at the clinic until the child was fed'); } }) } },
    { label: (s, c) => `Enter ${c.m1f} as unfit, and give the child to a household that wants one`, dark: true, note: (s, c) => `The child goes to a household that asked for one, and ${c.m1} is entered in the clinic's book as unfit to raise it.`, info: (s, c) => [['yield', 'The child in a house that wants it'], ['danger', c.M1]],
      out: { text: (s, c) => `The clinic finds a household on the second row that asked for a child last year. The child goes there in a basket at noon. ${c.M1} watches it go from the clinic step and doesn't follow.`,
        fx: (s, c) => ({ morale: 1, tension: -2, stain: ['nm_unfit', 2], do: s2 => { const t = T(s2), e = byK(t, t.m1); if (e) { e.fate = 'given'; t.moved++; if (!e.swapped) t.broken++; } t.did.unfit = true; sour(s2, c.m1pid, 25, 'was entered as unfit to raise a child'); } }) } },
  ] });

/* ======================= SECOND: then another ======================= */
B(['second', 'test'], { id: 'nm.second', tone: 'pressure', title: 'Then Another',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.05), m2pid: byK(t, t.m2).pid, m1pid: byK(t, t.m1).pid }); },
  text: (s, c) => `${c.M2} is the second. Another row, another cradle, the same words: the child is healthy, the book says it's theirs, and it isn't the one ${c.m2f} bore. ${c.Mw} was the midwife on the ward for both births.${c.glass}\n\nThe rows have started saying it in the mess. Every parent of an infant has looked twice at the cradle tonight.`,
  choices: [
    { label: 'Call every parent of an infant to the hall, and tell them what is known', note: 'Everyone hears it at once, and every parent in the hall goes home and looks at the child in the cradle.',
      out: { text: (s, c) => `The hall is full and very quiet. You tell them what the clinic knows, which is little. ${ev('mothers', c.ev, c)} By lamp-out two more households have come to the clinic door.`,
        fx: (s, c) => ({ tension: 3, do: s2 => { const t = T(s2); learn(s2, t, 16, c.ev); t.asked += 2; t.did.hall = true; if (t.truth.is === 'fever') for (const e of t.list) if (!e.fev && LF.srand(s2) < 0.25) { e.fev = true; e.asked = true; } } }) } },
    { label: (s, c) => `${c.D} sees both mothers in private, with the children kept beside them`, note: 'The clinic is shut to everyone else for the month, and the rows draw their own conclusions from the shut door.', test: { base: 52, mods: [R('physician', 14)] },
      ok: { text: (s, c) => `${c.D} sees them one at a time behind the clinic door. ${ev('mothers', c.ev2, c)}`, fx: (s, c) => ({ morale: -1, do: s2 => learn(s2, T(s2), 20, c.ev2) }) },
      bad: { text: (s, c) => `${c.D} sees them both and learns nothing a page could hold. The shut door does more to the rows than anything said behind it.`, fx: s => ({ morale: -1, tension: 2, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Order both mothers to stop saying it, on pain of the lock-up', dark: true, note: 'The mess goes quiet, and two parents who may be right are told to hold their tongues.', info: (s, c) => [['yield', 'The mess quiet'], ['danger', `${c.M1} and ${c.m2}`]],
      out: { text: (s, c) => `${c.W} delivers it at both doors, in front of the rows. The mess goes quiet about it within the week. ${c.M2} stops coming to the mess.`,
        fx: (s, c) => ({ morale: 2, tension: -5, stain: ['nm_silence', 1], do: s2 => { const t = T(s2); t.did.silence = true; sour(s2, c.m1pid, 12, 'was told to stop saying it on pain of the lock-up'); sour(s2, c.m2pid, 12, 'was told to stop saying it on pain of the lock-up'); } }) } },
    { label: 'Take both children onto the ward for a month, and put the mothers on light duty', dark: true, note: 'Neither mother has to look at a child they doubt, and two infants spend their second month on a ward with a rota.', info: (s, c) => [['yield', 'Two households calm'], ['danger', 'Two infants, and their mothers']],
      out: { text: (s, c) => `The two children go to the ward in the clinic's baskets. ${c.M1} and ${c.m2} go back to work on light duty, and neither comes to visit.`,
        fx: (s, c) => ({ morale: 1, tension: -3, stain: ['nm_taken', 1], do: s2 => { const t = T(s2); t.did.taken = true; if (t.truth.is === 'fever') t.asked++; for (const k of [t.m1, t.m2]) { const e = byK(t, k); if (e && !e.fate) e.fate = 'ward'; } } }) } },
  ] });

/* ======================= The clinic's book of births ======================= */
B(['second', 'test'], { id: 'nm.book', tone: 'pressure', title: 'The Book of Births',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, -0.05) }); },
  text: (s, c) => `The clinic keeps a book of every birth here: the hour, the weight, the tag tied on the ankle, the initials of whoever delivered. ${c.D} has brought it to your office. By the book, every child is where it should be.\n\n${c.asked >= 4 ? `${Num(c.asked)} households have now said the child isn't theirs.` : 'The doubting households want to read it.'}${c.dv ? `\n\n[[physician]] "I've been through it twice." "Every line's right. That's not the same as every child."` : ''}`,
  choices: [
    { label: (s, c) => `Have ${c.d} check every line against the infants themselves`, note: 'Every infant on the book is weighed and looked over in front of a parent, and the clinic does nothing else that month.', test: { base: 54, mods: [R('physician', 12), M('medbay', 6)] },
      ok: { text: (s, c) => `It takes the month. ${ev('book', c.ev, c)}`, fx: (s, c) => ({ progress: -0.03, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `It takes the month and ends where it began: every line right, every child where the book says. The parents who watched their infants weighed go home no surer.`, fx: s => ({ progress: -0.03, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Open the book on a table in the hall', note: 'Every parent can read every line, including the stillbirths and the ones that came early.',
      out: { text: (s, c) => `The book lies open in the hall for a week. People read their own child's line and then everyone else's. ${ev('book', c.ev2, c)} The stillbirths are in there too, and some of the readers hadn't known about them.`,
        fx: (s, c) => ({ morale: -2, tension: 3, do: s2 => { const t = T(s2); learn(s2, t, 14, c.ev2); t.asked++; } }) } },
    { label: 'Strike the complaints from the book, and enter the doubting mothers as unwell', dark: true, note: 'The book is right again by its own pages, and every doubting parent is on record as ill.', info: [['yield', 'A clean book'], ['danger', 'The doubting parents']],
      out: { text: (s, c) => `The clerk rules a line through each complaint and writes the same words in the margin beside each.\n\n[[note:In the margin of the clinic's book]] "Unwell, under the clinic."\n\nNobody can say from the book that anything happened. The doubting parents are asked about their health in the mess.`,
        fx: s => ({ morale: 1, tension: -3, stain: ['nm_struck', 1], do: s2 => { T(s2).did.struck = true; } }) } },
    { label: 'Tell the households the book has been checked and is right, without checking it', dark: true, note: 'The rows get an answer this week, and nobody looks at the book at all.', info: [['yield', 'Morale'], ['danger', 'The doubting households, if they are right']],
      out: { text: 'The word goes round the rows from your office: the book has been checked, and every child is where it should be. The rows want to believe it, and most of them do.',
        fx: s => ({ morale: 2, tension: -4, stain: ['nm_lie', 1], do: s2 => { T(s2).did.lied = true; } }) } },
  ] });

/* ======================= The midwives ======================= */
B(['second', 'test'], { id: 'nm.midwives', tone: 'pressure', title: 'Who Was on the Ward',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.12), ev2: pickK(s, t), hand: t.truth.is === 'hand' }); },
  text: (s, c) => `${c.Mw} has delivered more of the colony's children than anyone, most of them on nights, with one lamp and one orderly. ${c.Mwf} was on the ward for both of the first two, and for more of the doubting households than the rest of the clinic put together.\n\n${c.Mw} has heard what the rows are saying, and still comes in for every night shift.${c.wv ? `\n\n[[security]] "I'm not saying anything, you understand." "I'm just saying who had the lamp, and who was on the ward for the first two, and who still comes in every night like nothing's the matter."` : ''}`,
  choices: [
    { label: 'New hands at every birth from now, and both midwives off the ward', note: (s, c) => `Two orderlies learn midwifery from a manual, and ${c.mw} is taken off the work of a lifetime on a rumour.`,
      out: { text: (s, c) => `The orderlies take the ward in pairs, with the manual open on the bench. The first two births under them go slowly and end well. ${c.Mw} hands over the keys and sits in the mess with nothing to do.`,
        fx: (s, c) => ({ morale: -1, progress: -0.03, do: s2 => { const t = T(s2); t.mwOut = true; t.did.newhands = true; sour(s2, c.mwpid, 12, 'was taken off the births on a rumour'); } }) } },
    { label: (s, c) => `Have the watch question ${c.mw} through the night`, dark: true, note: (s, c) => `The colony learns what ${c.mw} knows, and ${c.mwf} learns what the colony thinks of a midwife.`, info: (s, c) => [['yield', 'What the midwife knows'], ['danger', c.Mw]],
      out: { text: (s, c) => `${c.wn ? `${c.wn} and two of the watch sit` : 'Three of the watch sit'} with ${c.mw} in the pump house from lamp-out to first light. ${ev('midwife', c.ev, c)}${c.hand ? ` Toward dawn ${c.mwf} stops answering and asks for paper.` : ''}`,
        fx: (s, c) => ({ tension: -2, stain: ['nm_question', 2], do: s2 => { const t = T(s2); learn(s2, t, 26, c.ev); t.did.question = true; if (c.hand) t.mwOut = true; sour(s2, c.mwpid, 20, 'was questioned through the night by the watch'); } }) } },
    { label: (s, c) => `Stand ${c.mw} down quietly, and log it as illness`, dark: true, note: (s, c) => `The ward has new hands by morning and no rumour to feed, and ${c.mw} is entered as ill and isn't.`, info: (s, c) => [['yield', 'The ward changed without a word'], ['danger', c.Mw]],
      out: { text: (s, c) => `The log says ${c.mw} is ill and off the ward until further notice. ${c.Mwf} reads the log on the clinic wall, and goes home without asking anyone what illness it is.`,
        fx: (s, c) => ({ tension: -3, stain: ['nm_stood', 1], do: s2 => { const t = T(s2); t.mwOut = true; t.did.stood = true; sour(s2, c.mwpid, 15, 'was logged as ill to get off the ward'); } }) } },
    { label: 'Leave the midwives at work. They have delivered every child here', note: 'The doubting households give birth again under the same hands they doubt.',
      out: { text: (s, c) => `${c.Mw} is on the ward that night, and the night after. ${ev('midwife', c.ev2, c)} A household on the east row asks for a different midwife for its next birth and is told there isn't one.`,
        fx: (s, c) => ({ tension: 2, do: s2 => { const t = T(s2); learn(s2, t, 8, c.ev2); t.did.keptMw = true; } }) } },
  ] });

/* ======================= The nursery, proposed ======================= */
B(['second', 'test', 'reckon'], { id: 'nm.nursery', tone: 'pressure', title: 'One Room, One Watch',
  when: (s, t) => !t.nursery,
  setup: s => { const t = T(s), G = LF.gen(s), y = LF.date(s.day).year; return Object.assign(crew(s), { inf: Math.max(4, (G.co[y] || 0) + Math.round((G.co[y - 1] || 0) / 2)), ev: pickK(s, t) }); },
  text: (s, c) => `${c.W} has a plan on one sheet. Every infant under a year goes into one room at the clinic, under a lamp and a watch through every hour. The parents feed and visit on a roster. Whatever is happening to the children happens in front of somebody.${c.wv ? `\n\n[[security]] "You can't swap what you can't reach and you can't change what's being stared at." "So whatever this is, it won't enjoy the audience, and neither will the parents, and I'll be the one they take it out on."` : ''}\n\nThere are about ${num(c.inf)} infants that young.`,
  choices: [
    { label: 'Every infant into the nursery, under the watch, and the parents on the roster', dark: true, note: 'Nothing happens to a child that nobody sees, and every parent of an infant hands it over at the clinic door.', info: [['yield', 'Every infant watched, day and night'], ['danger', 'Every parent of an infant']],
      out: { text: (s, c) => `The room is cleared and the cradles carried in that week, one row at a time. The watch sits at the door. Parents come at their hour on the roster, feed, and go. The rows are quieter, and nobody hears a baby at night anywhere but the clinic.`,
        fx: (s, c) => ({ tension: -6, morale: -2, stain: ['nm_nursery', 2], do: s2 => { const t = T(s2); t.nursery = s2.day; t.did.nursery = true; } }) } },
    { label: 'A lamp and a sitter in every house with an infant, through the nights', note: 'Every house with an infant gives up a sitter\'s sleep, and the field crews lose the hands.',
      out: { text: 'The lamps are issued from the stores, one a house. The sitters change at midnight. The crews are short in the morning and say so, and most nights nothing happens anywhere.',
        fx: s => ({ food: -30, do: s2 => { const t = T(s2); t.lamps = s2.day; t.did.lamps = true; } }) } },
    { label: 'Only the children of the households that asked go into the room', dark: true, note: 'The doubting households are spared the child they doubt, and the children go to strangers for their first year.', info: [['yield', 'The doubting households calm'], ['danger', 'Their children']],
      out: { text: (s, c) => `The doubting households carry their children to the clinic themselves. Some don't look back. The room has a few cradles in it and a watch at the door, and the rest of the colony keeps its infants at home.`,
        fx: (s, c) => ({ tension: -3, morale: 1, stain: ['nm_taken', 1], do: s2 => { const t = T(s2); t.did.taken = true; for (const e of t.list) if (e.asked && !e.fate) e.fate = 'ward'; if (t.truth.is === 'real') t.lamps = t.lamps || s2.day; } }) } },
    { label: 'No. Every child stays with its parents', note: 'If something is happening to the children, it goes on happening in the dark.',
      out: { text: (s, c) => `${c.W} takes the sheet back. The colony's infants sleep where they slept, and the parents who doubt them lie awake beside them.`,
        fx: s => ({ tension: 2, do: s2 => { T(s2).did.noNursery = true; } }) } },
  ] });

/* ======================= TEST: a drop from each ======================= */
B('test', { id: 'nm.test', tone: 'crisis', title: 'A Drop From Each',
  setup: s => { const t = T(s); const keys = t.list.filter(e => here(e) && e.fate !== 'given').map(e => e.k), asked = t.list.filter(e => here(e) && e.asked && e.fate !== 'given').map(e => e.k);
    return Object.assign(crew(s), { n: keys.length, list: listText(s, t), rr: round(s, t), ra: round(s, t, asked) }); },
  text: (s, c) => `${c.D} can type an infant's blood against both parents' on ${c.bench}: a heel prick, a thumb prick, and an answer in a day. Nobody has asked how often it's right, because nobody can say.${c.dv ? `\n\n[[physician]] "It'll give you an answer." "I can't promise you it's the truth. Those aren't the same thing, and you'd better hear that from me now."` : ''}\n\nThe ${num(c.n)} households in question:\n${c.list}`,
  choices: [
    { label: 'Test every one, and give each child to whoever the test says', dark: true, note: 'It ends the argument in a day, and any household the test reads wrong loses its child on the test\'s word.', info: [['yield', 'An answer for every cradle'], ['danger', 'Every household the test reads wrong']],
      out: { text: (s, c) => `The heel pricks are done in a morning, the cards come off ${c.bench} by dusk, and the baskets go from house to house the next day.\n\n${resLine(s, T(s), c.rr)}`,
        fx: (s, c) => ({ tension: -10, morale: 2, stain: ['nm_given', 2], do: s2 => { const t = T(s2); apply(t, c.rr); t.did.given = true; const g = give(s2, t, true); if (g.broke) t.stepN += Math.ceil(g.broke / 2); } }) } },
    { label: 'Test every one, and move a child only where two results point at each other', note: 'Most households keep the child they have whatever the card says, and live beside the card.',
      out: { text: (s, c) => `The cards come off ${c.bench} by dusk and go up on the clinic wall. Where two cards name each other's household, the children change houses. Everywhere else the children stay where they are, with the card on the wall above the cradle's name.\n\n${resLine(s, T(s), c.rr)}`,
        fx: (s, c) => ({ tension: -3, do: s2 => { const t = T(s2); apply(t, c.rr); t.did.careful = true; give(s2, t, false); } }) } },
    { label: 'Test only the households that asked', note: 'The households that never doubted are left alone, and anything wrong in them stays unread.',
      out: { text: (s, c) => `Only the doubting households bring their children in. The cards come back by dusk, and the parents read them standing at the clinic door.\n\n${resLine(s, T(s), c.ra) || 'Nothing could be read.'}`,
        fx: (s, c) => ({ do: s2 => { const t = T(s2); apply(t, c.ra); t.did.asked = true; } }) } },
    { label: 'No test. The book stands', note: 'Every child stays where the book says, and every doubting parent goes on living with a child they don\'t believe is theirs.',
      out: { text: (s, c) => `${c.D} puts the kit back in its case. The book stands. ${c.M1} hears it at the clinic door and walks home without the child, and a neighbour brings the child home after.`,
        fx: s => ({ morale: -2, tension: 4, do: s2 => { const t = T(s2); t.did.notest = true; t.stepN++; } }) } },
  ] });

/* ======================= A household that was fine until the test ======================= */
B(['test', 'reckon'], { id: 'nm.cradle', tone: 'pressure', title: 'A House That Was Fine',
  when: (s, t) => t.tested && !!cradle(s, t),
  setup: s => { const t = T(s), e = cradle(s, t); e.done = true;
    return Object.assign(crew(s), who(s, e), { moved: e.fate === 'given', res: last(e), rr: testOne(s, t, e, 0.08) }); },
  text: (s, c) => `${c.Name} never doubted the child in the cradle, and never came to the clinic door. The test says ${c.res === 'none' ? 'the child can\'t be placed with anyone' : 'the child belongs to another household'}.${c.moved ? ' By the order, the child has already gone to the house the test named.' : ''}\n\n${c.First} has come to your office with the card from the clinic wall, and asks whether a drop of blood outweighs a year of nights.`,
  choices: [
    { label: 'Hold to the test', dark: true, note: (s, c) => `Every household tested is answered the same way, and ${c.name} ${c.moved ? 'doesn\'t get the child back' : 'loses the child to the card'}.`, info: (s, c) => [['yield', 'One rule for every household'], ['danger', c.Name]],
      out: { text: (s, c) => c.moved ? `The answer goes back with the card. ${c.Name} goes home to an empty cradle and sits beside it.` : `The child goes ${c.res === 'none' ? 'to the ward' : 'to the house the test named'} the next morning. ${c.Name} carries the basket to the door, and doesn't go in.`,
        fx: (s, c) => ({ tension: -3, stain: ['nm_held', 1], do: s2 => { const t = T(s2), e = byK(t, c.k); if (e && !c.moved) { e.fate = c.res === 'none' ? 'ward' : 'given'; if (c.res !== 'none') { t.moved++; if (e.swapped) t.returned++; else t.broken++; } } t.did.held = true; sour(s2, c.pid, 20, 'lost a child to a blood test'); } }) } },
    { label: 'Test them again, with new hands on the needle', note: 'The clinic loses another day to one household, and the household waits on a second card.',
      out: { text: (s, c) => `The second card comes back at dusk: ${RES[c.rr]}. ${c.rr === 'match' ? `${c.Name} ${c.moved ? 'gets the child back that night' : 'keeps the child'}, and the colony learns the test can be wrong.` : `${c.Name} reads it twice and hands it back.`}`,
        fx: (s, c) => ({ progress: -0.01, do: s2 => { const t = T(s2), e = byK(t, c.k); if (!e) return; e.res.push(c.rr); t.tests++; if (c.rr === truthOf(e)) t.right++; if (c.rr === 'match') { if (e.fate === 'given') { e.fate = 'back'; t.moved--; if (!e.swapped) t.broken = Math.max(0, t.broken - 1); } learn(s2, t, 6); } t.did.retest = true; } }) } },
    { label: 'Give them the child they raised, and strike the result', note: 'The household keeps its child, and every household the test has already moved asks why it can\'t do the same.',
      out: { text: (s, c) => `The card comes off the clinic wall. ${c.Name} takes the child home${c.moved ? ' from the other house, which hands it over without a word' : ''}. Before the week is out three more households are at your door with cards of their own.`,
        fx: (s, c) => ({ tension: 4, morale: 1, do: s2 => { const t = T(s2), e = byK(t, c.k); if (e) { if (e.fate === 'given') { e.fate = 'back'; t.moved--; if (!e.swapped) t.broken = Math.max(0, t.broken - 1); } e.res.push('match'); } t.did.struck2 = true; } }) } },
    { label: 'The child goes to the ward until the colony is sure, and the household visits on a roster', dark: true, note: (s, c) => `Neither house can claim the child, and ${c.name} visits a cradle on a ward at an hour on a sheet.`, info: (s, c) => [['yield', 'No household wronged by the colony yet'], ['danger', `${c.Name}, and the child`]],
      out: { text: (s, c) => `The child goes to the ward in a clinic basket. ${c.Name} comes at the hour on the roster, every day, and leaves at the end of it.`,
        fx: (s, c) => ({ tension: -2, stain: ['nm_ward', 1], do: s2 => { const t = T(s2), e = byK(t, c.k); if (e) e.fate = 'ward'; sour(s2, c.pid, 12, 'visits a child on the ward by roster'); } }) } },
  ] });

/* ======================= The ones the test cannot place ======================= */
B(['test', 'reckon'], { id: 'nm.gate', tone: 'crisis', title: 'Nobody\'s by the Test',
  when: (s, t) => t.tested && unplaced(t).length > 0,
  setup: s => { const t = T(s), u = unplaced(t), ward = s.people.filter(p => p.alive && !p.role && !p.seat && !p.away && !p.orbit && p.id !== t.mw && !t.list.some(e => e.pid === p.id));
    const r = ward.length ? LF.spick(s, ward) : null, ref = r || named(s, null);
    return Object.assign(crew(s), { keys: u.map(e => e.k), n: u.length, homes: u.map(e => nm(s, e)), rpid: ref.id, rname: ref.name, rfirst: ref.first, kd: Math.min(u.length, LF.kidCount(s)) }); },
  text: (s, c) => `${c.n === 1 ? 'One child' : `${Num(c.n)} children`} on the list can't be placed by the test with any household in the colony: not the one ${c.n === 1 ? 'it was' : 'they were'} born to, and not any other. ${c.W} has put an order on your desk, written out and unsigned. The ones the test can't place are not the colony's, and go out at the gate.\n\nThe households: ${c.homes.join('; ')}.`,
  choices: [
    { label: 'Sign it', dark: true, note: 'Whatever the test could not place is gone from the colony by dusk, and somebody has to carry the baskets to the gate.', info: (s, c) => [['yield', 'An end to the ones nobody can place'], ['danger', c.n === 1 ? 'One infant' : `${Num(c.n)} infants`]],
      out: { text: (s, c) => `The order is signed at your desk and read at the watch-house at noon. ${c.rname} is on the gate roster that evening, and refuses to carry it, and is relieved and locked up. Two of the watch carry the baskets to the gate at dusk. The bar goes down behind them. The households stand at their doors and do not come out.`,
        fx: (s, c) => ({ tension: -8, morale: 1, stain: ['nm_out', 4], chips: [[c.kd === 1 ? 'One infant put out at the gate' : `${Num(c.kd)} infants put out at the gate`, false]], mark: [c.rpid, 'refused', 'refused to carry the order to the gate'], chron: 'The colony put out at the gate the infants its blood test could not place.',
          do: s2 => { const t = T(s2); infants(s2, t, c.kd); t.outN += c.kd; t.did.out = true; for (const k of c.keys) { const e = byK(t, k); if (e) { if (e.changed) { t.changed = Math.max(0, t.changed - 1); t.outReal = (t.outReal || 0) + 1; } e.fate = 'out'; } } } }) } },
    { label: (s, c) => c.n === 1 ? 'The child is the colony\'s: the ward, and a rota to raise it' : 'They are the colony\'s children: the ward, and a rota to raise them', note: 'They are raised by whoever is on shift, and their households have to walk past the ward every day.', cost: { food: 30 },
      out: { text: (s, c) => `The ward takes ${c.n === 1 ? 'the child' : 'them'}. The rota goes up on the clinic wall beside the test cards: two hours a night, by row. ${c.n === 1 ? 'The household it was born to comes' : 'The households they were born to come'} by at first, then less.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); for (const k of c.keys) { const e = byK(t, k); if (e) e.fate = 'ward'; } t.did.ward = true; } }) } },
    { label: (s, c) => c.n === 1 ? 'Back to the household it was born to, on the book\'s word' : 'Back to the households they were born to, on the book\'s word', note: 'The book says they belong, and the parents who doubted them have them back whether they will or not.',
      out: { text: (s, c) => c.n > 1 ? 'They go home in the clinic\'s baskets with the book\'s page copied out for each house. Most doors open. One basket is back on the clinic step by morning.' : 'The child goes home in a clinic basket with the book\'s page copied out. The door opens. The basket is back on the clinic step by morning.',
        fx: (s, c) => ({ tension: 3, do: s2 => { const t = T(s2); t.stepN += 1; t.did.home = true; for (const k of c.keys) { const e = byK(t, k); if (e) e.done = true; } } }) } },
    { label: (s, c) => c.n === 1 ? 'Keep the child, entered as nobody\'s: no line on the roll and no ration of its own' : 'Keep them, entered as nobody\'s: no line on the roll and no ration of their own', dark: true, note: 'The colony keeps them alive on what the rows spare, and nowhere is it written that they were born.', info: (s, c) => [['yield', 'Rations, and the roll clean'], ['danger', c.n === 1 ? 'The child' : 'The children']],
      out: { text: (s, c) => c.n === 1 ? 'The line is struck from the book. The child stays in the house it was born to, fed from other plates. The clerk is told not to count it, and doesn\'t.' : 'Their lines are struck from the book. They stay in the houses they were born to, fed from other plates. The clerk is told not to count them, and doesn\'t.',
        fx: (s, c) => ({ food: 25, tension: -3, stain: ['nm_noname', 2], do: s2 => { const t = T(s2); t.did.noname = true; for (const k of c.keys) { const e = byK(t, k); if (e) e.done = true; } } }) } },
  ] });

/* ======================= RECKON: whose child ======================= */
B('reckon', { id: 'nm.reckon', tone: 'crisis', title: 'Whose Child',
  setup: s => { const t = T(s); return Object.assign(crew(s), { list: listText(s, t), tested: t.tested, given: !!t.did.given, nursery: !!t.nursery, rr: t.tested ? {} : round(s, t), mwOut: t.mwOut }); },
  text: (s, c) => `${Num(c.asked)} households have now said the child in the cradle isn't theirs. The hall has split: the ones who believe the parents, and the ones who believe the book. Both want an order before another child is born.\n\n${c.list}\n\n${c.lean}`,
  choices: [
    { label: 'Every infant into one nursery under the watch, from today', dark: true, show: (s, c) => !c.nursery, note: 'Every parent of an infant hands it over at the clinic door and comes back at an hour on a roster.', info: [['yield', 'Every infant watched'], ['danger', 'Every parent of an infant']],
      out: { text: 'The cradles go to the clinic in a line from every row. The watch takes the door. The rows go quiet at night for the first time since the landing.',
        fx: s => ({ tension: -8, morale: -2, stain: ['nm_nursery', 2], do: s2 => { const t = T(s2); t.nursery = s2.day; t.did.nursery = true; close(s2, t); } }) } },
    { label: (s, c) => c.tested ? 'Give every child to whoever the test says' : 'Test every infant now, and give each to whoever the test says', dark: true, show: (s, c) => !c.given, note: 'The argument is over by the end of the week, and every household the test reads wrong loses its child.', info: [['yield', 'An answer for every cradle'], ['danger', 'Every household the test reads wrong']],
      out: { text: (s, c) => `${c.tested ? 'The cards on the clinic wall are read as orders.' : 'The heel pricks are done in a morning and the cards read as orders.'} The baskets go from house to house for two days. Some doors open, and some have to be opened.`,
        fx: (s, c) => ({ tension: -10, morale: 1, stain: ['nm_given', 2], do: s2 => { const t = T(s2); if (!c.tested) apply(t, c.rr); t.did.given = true; const g = give(s2, t, true); if (g.broke) t.stepN += Math.ceil(g.broke / 2); close(s2, t); } }) } },
    { label: 'Treat it as a sickness: the doubting parents on the ward, with the children beside them', note: 'The parents are nursed and dosed and told they are ill, and if they are right, nobody is listening to them.',
      out: { text: (s, c) => `The ward fills with cots, a parent and a cradle to each. ${c.D} doses for sleep and takes temperatures twice a day. ${({ fever: 'The fevers come down inside the month, and with them the doubt, one bed at a time.', mixup: 'Most of them go home inside the month, sure again. One doesn\'t.', real: 'The parents sleep. Their children don\'t, and the night orderly asks to be moved.', hand: 'The births go on at night in the other room, under the same hands.' })[T(s).truth.is]}`,
        fx: s => ({ morale: 1, food: -20, do: s2 => { const t = T(s2); t.did.nursed = true; close(s2, t); } }) } },
    { label: (s, c) => c.mwOut ? 'The midwife who had the lamp goes to the lock-up until this is over' : 'Take the births from the midwives, and the night midwife to the lock-up until this is over', dark: true, note: (s, c) => `The births go to new hands, and ${c.mw} sits behind a bar on what the rows say.`, info: (s, c) => [['yield', 'The births in new hands'], ['danger', c.Mw]],
      out: { text: (s, c) => `${c.Mw} is walked to the pump house at noon with a bedroll. ${T(s).truth.is === 'hand' ? 'The doubting stops inside the month: no new household comes to the clinic door.' : 'The doubting goes on as before, under new hands.'}`,
        fx: (s, c) => ({ tension: -6, morale: 1, stain: ['nm_midwife', 2], do: s2 => { const t = T(s2); t.mwOut = true; t.did.midwife = true; sour(s2, c.mwpid, 25, 'was locked up for the births'); close(s2, t); } }) } },
    { label: 'The book stands. Every child stays where it says', note: 'The doubting parents raise children they don\'t believe are theirs, and if they are right, nothing is done.',
      out: { text: (s, c) => `The order is a line long and read at supper. ${c.M1} gets up from the long table and leaves the mess. The rest of the hall finishes eating.`,
        fx: s => ({ morale: -2, tension: 3, do: s2 => { const t = T(s2); t.did.book = true; t.stepN++; close(s2, t); } }) } },
  ] });

/* ======================= BILL: left on the clinic step ======================= */
B(['test', 'reckon', 'bill'], { id: 'nm.step', tone: 'pressure', title: 'On the Clinic Step',
  when: (s, t) => atStep(t) > 0,
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: Math.max(1, atStep(t)) }); },
  text: (s, c) => `${c.n === 1 ? 'A basket was on the clinic step at first light with an infant in it, fed and wrapped, and no note. The household that left it won\'t have the child back, and says it isn\'t the one born there.' : `${Num(c.n)} baskets were on the clinic step at first light, each with an infant in it, fed and wrapped, and no note. The households that left them won't have them back. Each says the child it was given isn't the one born there.`}${c.dv ? `\n\n[[physician]] "They're fine." "Somebody's got to want them. That's all I need. One person."` : ''}`,
  choices: [
    { label: (s, c) => c.n === 1 ? 'The ward takes the child, and a rota raises it' : 'The ward takes them, and a rota raises them', cost: { food: 20 }, note: 'They are fed and changed by whoever is on shift, and belong to nobody.',
      out: { text: (s, c) => c.n === 1 ? 'The ward takes the child in. The rota goes up beside the clinic door, two hours a night by row. It\'s a quiet child, and the orderlies notice it.' : 'The ward takes them in. The rota goes up beside the clinic door, two hours a night by row. They are quiet children, and the orderlies notice it.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.did.stepWard = true; t.stepN = 0; } }) } },
    { label: (s, c) => c.n === 1 ? 'The household takes the child back, and the watch sees that it does' : 'The households take them back, and the watch sees that they do', dark: true, note: 'Every child goes home to a house that has said it won\'t have it, with a watch at the door.', info: [['yield', 'No children on the ward'], ['danger', 'The children, and the households']],
      out: { text: (s, c) => `${c.wn ? `${c.wn} carries the first basket back with two of the watch` : 'Three of the watch carry the first basket back'}. The door opens on the third knock. A hand from the watch calls at each house at dusk for a month, and writes down what is seen.`,
        fx: s => ({ tension: -3, stain: ['nm_made', 2], do: s2 => { const t = T(s2); t.did.made = true; t.stepN = 0; } }) } },
    { label: (s, c) => c.n === 1 ? 'Ask in the hall for a household that will take the child, with a second ladle for it' : 'Ask in the hall for households who will take one, with a second ladle for it', cost: { food: 50 }, note: 'The common pot feeds them, and the hall hears who stood up and who didn\'t.',
      out: { text: 'It is asked at supper. Hands go up slowly, and then there are enough. The second ladle comes out of the common pot, and the field crews notice whose plates are full.',
        fx: s => ({ morale: 1, do: s2 => { const t = T(s2); t.did.asked2 = true; t.stepN = 0; } }) } },
    { label: (s, c) => c.n === 1 ? 'Strike the child from the book of births. The clinic raises it, and it was never born here' : 'Strike them from the book of births. The clinic raises them, and they were never born here', dark: true, note: 'The households are spared the shame, and the children have no line in any book the colony keeps.', info: [['yield', 'The households spared'], ['danger', 'The children']],
      out: { text: (s, c) => c.n === 1 ? 'The clerk rules out the line. The ward takes the child under a number. The household goes back to work, and nobody in the rows mentions the step again.' : 'The clerk rules out their lines. The ward takes them under numbers. The households go back to work, and nobody in the rows mentions the step again.',
        fx: s => ({ morale: 2, tension: -4, stain: ['nm_unborn', 2], do: s2 => { const t = T(s2); t.did.unborn = true; t.stepN = 0; } }) } },
  ] });

/* ======================= AFTER: whose they were ======================= */
const WAS = {
  mixup: (t, c) => `The clinic swapped two children once, on a night with two births in an hour and one lamp lit. ${c.m1} was right, and so was the household that never said a word. Every doubt after that was fear.`,
  fever: (t, c) => 'Every child was its own parents\'. A fever of this world went through the mothers in the second week after a birth, and took from them the one thing a parent knows without being told. The children were never in any danger except from the people who doubted them.',
  real: (t, c) => 'Something did change the infants in their first month, in the dark, when nobody was looking. The mothers were right. The changed ones were healthy, and their blood was their parents\' blood, and the test could only fail to place them.',
  hand: (t, c) => `${c.mw} changed the colony's infants on the night shift, a few at a time, for a reason that came out only in pieces. Every doubting mother of a changed child was right.`,
};
function reckon(s, t, c) { const d = t.did, k = t.truth.is, L = [];
  if (t.broken) L.push(`${t.broken === 1 ? 'One household that had been whole' : `${Num(t.broken)} households that had been whole`} lost ${t.broken === 1 ? 'its child' : 'their children'} to the test.`);
  if (t.returned) L.push(`${t.returned === 1 ? 'One child' : `${Num(t.returned)} children`} went back where ${t.returned === 1 ? 'it' : 'they'} belonged.`);
  if (t.outN) L.push(k === 'real' ? `Of the ${t.outN === 1 ? 'one infant' : `${num(t.outN)} infants`} put out at the gate, ${t.outReal === t.outN ? (t.outN === 1 ? 'that one had' : 'every one had') : `${num(t.outReal || 0)} had`} been changed.` : `${t.outN === 1 ? 'The infant' : `The ${num(t.outN)} infants`} put out at the gate had nothing wrong with them but the test.`);
  if (t.nursery) L.push(k === 'fever' ? 'The nursery took the children from the people who most needed to hold them.' : k === 'real' ? 'The nursery watched the children through the month it happened in.' : 'The nursery cost every parent of an infant a year of nights.');
  if (d.question || d.midwife || d.stood) L.push(k === 'hand' ? `What was done to ${c.mw} was done to the right person.` : `What was done to ${c.mw} was done to a midwife who had done nothing.`);
  if (d.dosed || d.unfit || d.silence) L.push(k === 'fever' ? 'The mother dosed or silenced was ill, and was treated as a problem.' : 'The mother dosed or silenced had been telling the truth.');
  return L.slice(0, 5).join(' ') || 'Nobody was moved, put out or locked up on account of it.'; }
B('after', { id: 'nm.truth', tone: 'quiet', title: 'Whose They Were',
  setup: s => { const t = T(s); return Object.assign(crew(s), { toll: t.toll + t.kids, pct: num(Math.round(10 * (t.tests ? t.right / t.tests : t.truth.acc))), tested: t.tests > 0 }); },
  text: (s, c) => { const t = T(s); return `${WAS[t.truth.is](t, c)}${c.tested ? ` The test read true ${c.pct} times in ten.` : ''}\n\n${reckon(s, t, c)}${c.toll ? ` In all it cost ${num(c.toll)} lives, the infants counted.` : ''}`; },
  choices: [
    { label: 'Enter it in the record as it happened, with the households named', note: 'Every parent who gave a child up or took one, and everyone who carried a basket, has to live beside the page.',
      out: { text: 'It goes into the record in your hand, with every household named and what became of each child. Parents come to the hall to read their own line, and some of them read it more than once.', fx: s => ({ morale: -2, chron: 'The colony wrote down whose children were whose, and what it had done about it.' }) } },
    { label: 'Enter it as a fever of the mothers, met and ended', dark: true, note: 'The colony gets an account it can raise children beside, and every household is left out of it.', info: [['yield', 'Morale']],
      out: { text: 'The record says a fever went through the mothers in the early years and passed. The entry is two lines long and names nobody. It is what the children will be taught, the ones who were moved among them.',
        fx: s => ({ morale: 3, stain: ['nm_record', 1], chron: 'The record says a fever of the mothers passed.' }) } },
    { label: 'Keep the test for good: every child born here is typed at birth and tagged twice', note: 'Every birth gets a heel prick and a second pair of hands, and every new parent waits on a card before they take the child home.',
      out: { text: 'A second tag and a card go on every child before it leaves the clinic, and two initials in the book. In time the parents stop reading the card. The clinic doesn\'t.',
        fx: s => ({ morale: -1, progress: -0.01, do: s2 => LF.emit(s2, 'suspicion', 'nm.typed', 12, 250, 'every child born here is typed by blood before it goes home') }) } },
  ] });

/* ---------- when it opens ---------- */
/* force: a truth to open it with now, whatever the dice and the month (for reading the cards: tools/nm-read.js). */
LF.nmTick = function (s, force) {
  if ((s.day % MONTH && !force) || !LF.THREADS[ID] || !s.threads || s.threads[ID] || !s.world || LF.aloft(s) || (s.over && !s.over.cont)) return;
  const f = s.threads.friend; if (f && f.on && !f.end && f.phase !== 'latent') return;   // the other next-generation dread (WO-8): not in the same years
  const G = LF.gen(s), y = LF.date(s.day).year;
  if (s.day - (s.landed || 0) < 1.5 * YEAR || s.pop < 30 || (G.co[y] || 0) + (G.co[y - 1] || 0) < KIDS || !(LF.down(s, 'medbay') || s.built.school)) return;
  if (!force && LF.srand(s) >= 1 - Math.pow(1 - ODDS, 1 / 12)) return;
  const d = LF.THREADS[ID], t = s.threads[ID] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll(s), end: null, own: true };
  if (force) t.truth.is = force;
  d.start(s, t); if (s.plot && s.plot.threads) s.plot.threads.push(ID);
  open(s, t); LF.phase(s, ID, 'first'); jump(s, 'nm.first', 20);
};
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { LF.nmTick(s); if (t0) t0(s); }; })();

Object.assign(LF.DEEDS || {}, {
  nm_dosed: 'the mother dosed at the clinic until the child was fed', nm_unfit: 'the mother entered as unfit, and the child given to another house',
  nm_silence: 'the mothers told to stop saying it on pain of the lock-up', nm_taken: 'the doubted infants taken onto the ward from their mothers',
  nm_struck: 'the complaints struck from the book of births', nm_lie: 'the book of births called checked when nobody had checked it',
  nm_question: 'the midwife questioned through the night by the watch', nm_stood: 'the midwife logged as ill to take the births away',
  nm_nursery: 'every infant taken into one nursery under the watch', nm_given: 'the children given out by a blood test, households broken on its word',
  nm_held: 'the household that lost its child to a card on the clinic wall', nm_ward: 'the child kept on the ward, its household visiting by roster',
  nm_out: 'the infants the test could not place, carried out to the gate at dusk', nm_noname: 'the children kept with no line on the roll and no ration of their own',
  nm_midwife: 'the midwife locked up for the births', nm_made: 'the children carried back by the watch to houses that would not have them',
  nm_unborn: 'the children on the clinic step, struck from the book of births', nm_record: 'the two lines in the record about a fever of the mothers',
});

LF.TAGS['nm.first'] = ['cautious mercy', 'cautious open', 'severe closed', 'severe order'];
LF.TAGS['nm.second'] = ['open', 'cautious', 'closed order', 'severe order'];
LF.TAGS['nm.book'] = ['cautious', 'open', 'closed', 'closed'];
LF.TAGS['nm.midwives'] = ['cautious order', 'severe order', 'closed', 'free'];
LF.TAGS['nm.nursery'] = ['severe order', 'cautious mercy', 'severe', 'free mercy'];
LF.TAGS['nm.test'] = ['severe order bold', 'cautious open', 'cautious', 'free closed'];
LF.TAGS['nm.cradle'] = ['severe order', 'cautious', 'mercy free', 'severe cautious'];
LF.TAGS['nm.gate'] = ['severe bold', 'mercy order', 'free', 'severe closed'];
LF.TAGS['nm.reckon'] = ['severe order', 'severe bold', 'mercy cautious', 'severe order', 'free closed'];
LF.TAGS['nm.step'] = ['mercy order', 'severe order', 'mercy open', 'closed severe'];
LF.TAGS['nm.truth'] = ['open', 'closed order', 'cautious order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['nm.second'] === undefined ? [] : [{ k: 'stone', card: 'nm.second', name: 'The flat stone by the water', kind: 'mark', dist: 'near', danger: 0, state: t.end ? 'worked out' : 'located',
  known: 'The parents who doubt carry their children out here at dusk to look at them in the last of the light. Nobody can say who began it.' }];
/* A party the player sent to the stone (orders.js order.send, T2-5): what they found there, pointing at the truth most of
   the time (pickK) and never saying it. The party waits out a dusk and a night by the water. A find with something to
   act on (marks out of the water, a bundle under the stone) is a card; a dusk of parents and nothing else is a Meanwhile
   line. No child is hurt or lost here. */
const STONE = {
  mixup: c => 'The stone is worn smooth by sitting. They watched a dusk there: the parents look a long time in the low light, and most go home quieter than they came. One said the light makes it plain whose child it is.',
  fever: c => `The parents who came at dusk were flushed and slow to answer, and sat too close to the water. ${c.Who} sat with them an hour, and walked home with a temperature, unsure for a day which pack was whose.`,
  real: c => `In the ${c.top} at the edge of the water, below the stone, there's a trail of small marks that comes up out of the water to the stone and goes back. It's fresh each morning, after the parents have gone home, and nothing on the survey sheets makes a mark like it.`,
  hand: c => 'Under the stone, wrapped in one of the clinic\'s wash cloths, there\'s a bundle of birth tags: blank ones, already tied in the clinic\'s slip knot, and a stub of the ward\'s marking ink.' };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'stone') return null;
  const L = a.lead && byPid(s, a.lead), c = { top: LF.lex(s, 'top'), Who: L && L.alive ? L.first : 'One of the party' }, e = pickK(s, t, 0.05);
  if (e === 'mixup' || e === 'fever') return { quiet: true, title: 'The Flat Stone', tone: 'quiet', text: STONE[e](c), fx: { do: s2 => learn(s2, T(s2), 6, e) } };
  return { title: e === 'real' ? 'Out of the Water' : 'Under the Stone', tone: 'pressure', scene: e === 'real' ? 'away_marks' : 'away_tags', text: STONE[e](c),
    fx: { do: s2 => { learn(s2, T(s2), 14, e); LF.emit(s2, e === 'real' ? 'fear' : 'suspicion', 'nm.stone', 10, 90, e === 'real' ? 'what comes up out of the water at the flat stone' : 'who hid the birth tags under the flat stone'); } } };
};
})();

/* Landfall — thread: the Blood Test. A dread (threads.js): dealt by the plot whatever the world, opening in the first
   months (t.nth 0) or later (1). Lachlan, NEXT.md WO-2: a work party brings back a sick animal, or a body, from outside
   the wire. Afterwards somebody behaves slightly wrong. Paranoia in a small group: the six who went, whoever bunks with
   them, and a physical test that may or may not work. The player never sees the thing; the player sees a list of names
   with a test result beside each. Small and indoors, never more than about fifteen on the list, over inside a year.
   Rolled in secret (t.truth.is), with the test's accuracy (t.truth.acc, never stated):
     spread  it is real and goes person to person, so the list grows and the test is the only tool. Locking the list in
             alone shows who has it; burning or putting out the failures works only as well as the test.
     dead    it only takes the dead. The thing in the cold room gets up; the living were never at risk, and everyone
             put out or burned was a healthy colonist. Right: burn the cold room and the dead.
     fever   nobody is infected. A fever makes people paranoid, the officers included, and the test reads the fever.
             Right: tear up the list and treat the temperatures. Locked in alone, it gets worse in the dark.
     faking  one person on the list is faking the signs, on themselves or on someone else, for a reason of their own.
             Right: new hands on the needle, or everyone alone (where nothing can be faked).
   Evidence (what came back, the first one, the blood, the refusal, the cold room, the row) is drawn per card and
   points at the truth only most of the time (pickK). Between cards (month) it costs people by its own arithmetic.
   t.list holds the people under suspicion (named people where the colony has them, counted ones otherwise), each with
   its results; a card shows it. Nothing here knows any other thread. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, byPid, anyNamed } = h;
const ID = 'bloodtest', T = s => LF.T(s, ID), SRC = 'th.bloodtest';
const KINDS = ['spread', 'dead', 'fever', 'faking'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const MAXLIST = 15;
// The dials: how often what it is costs a life between cards, by truth; what the measures cost in hands.
const RATE = { spread: 0.3, dead: 0.25, fever: 0.18, faking: 0.2 }, PRESS = 1;

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  cart: {
    spread: c => `The blood in ${c.it} has not clotted, and does not. A drop of it on a plate creeps toward the next drop. ${c.Opener} has put the plate under a bell jar and will not say what that means.`,
    dead: c => `Everything in ${c.it} has been dead for days, longer than the six say it was walking. And it is warm. The cold room is at two degrees, and the thing on the slab is at blood heat.`,
    fever: c => `There is nothing in ${c.it} but a fever, an ordinary one, of the kind that goes round a bunk row in a wet month. The six breathed on it the whole way home, and it on them.`,
    faking: c => `There is nothing wrong with ${c.it} that could pass to anyone. ${c.Opener} finds a broken neck and nothing else, and asks twice who said it was sick.` },
  wrong: {
    spread: c => `${c.Name}'s blood pressure is that of somebody asleep. ${c.Name} is wide awake, and the pupils don't close to the lamp. The bunkmate has a cough that started the night after the cut.`,
    dead: c => `There is nothing wrong with ${c.name} when it comes to it: a little thin, a little short of sleep. ${c.Name} was the one who lifted it out of the cart, and the row has not let that go.`,
    fever: c => `${c.Name} is hot to the touch, and sure the row talks about ${c.first} at night. The row does. Two of the row are hot as well.`,
    faking: c => `It comes on after meals and is gone by the next, the way a dose works and an illness does not. On the one day ${c.name} ate alone from the pot, there was nothing wrong at all.` },
  blood: {
    spread: c => 'The failed samples do not only flinch from the wire. They draw back from it across the plate, every one of them the same way.',
    dead: c => 'The failed samples flinch from the wire. So did a drop of water from the pump, when somebody thought to try it.',
    fever: c => 'Every sample that failed came from somebody with a temperature, and every one that passed from somebody without.',
    faking: c => 'Two of the failed samples smell of the clinic\'s cleaning spirit. Nobody in the clinic uses it on blood.' },
  refuse: {
    spread: c => `\n\n[[${c.pid || c.rk || 'x17'}]] "Because I know what it'll say."\n\n${c.Name} says nothing more all night.`,
    dead: c => ` ${c.Name} will bleed anywhere but the mess, which is next to the cold room.\n\n[[${c.pid || c.rk || 'x17'}]] "It's cold in there." "It's not supposed to be cold right through the wall."`,
    fever: c => ` ${c.Name} is shaking and hot, and says the needle has been dipped in something, and that the clinic wants ${c.first} dead.`,
    faking: c => ` ${c.Name} says the samples on the plate are not the samples that were drawn, and will say who carried the tray only to you.` },
  cold: {
    spread: c => 'The sheet over it has a stain spreading out from the middle, and the stain is warmer than the room.',
    dead: c => 'The sheet is on the floor. It is lying a metre from the slab, on its side, facing the door.',
    fever: c => 'It is where it was put. The cold-room hand who swore it moved has a temperature of thirty-nine and is sent to bed.',
    faking: c => 'It is where it was put. The scratches on the inside of the door were made with a file, and the filings are on the floor.' },
  row: {
    spread: c => `The row says ${c.name} bit the hand that shook ${c.first} awake for the shift, and the hand has gone grey round the bite.`,
    dead: c => `The row says ${c.name} sat up in the night and talked about the cold room. ${c.Name} says it was a dream. Half the row has had the same dream.`,
    fever: c => `The whole row is hot. Every one of them is sure of somebody different, and ${c.name} is only the one they caught.`,
    faking: c => `The row found a vial in ${c.name}'s boot. ${c.Name} says it was put there, and the boot was under the bunk by the door, where anyone could reach it.` },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { spread: 'something that passes from one of them to the next', dead: 'the dead, and not the living', fever: 'a fever, and the fear that comes with it', faking: 'somebody on the list making it look worse than it is' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* ---------- the list ---------- */
const LABS = ['a hauler from the second row', 'the second cook', 'the pump hand', 'a rigger off the night shift', 'the wash-house hand', 'a fitter from the yard', 'a sower from the east field',
  'the stores clerk', 'a welder from the shed', 'the net mender', 'a carter', 'the night cook', 'a field hand from the far furrow', 'the boot mender', 'a stoker', 'the lamp trimmer', 'a digger from the pits', 'the bread hand'];
/* Who each label is on the card (js/roster.js), one face each so no two on the list share one (roster of sixty, 2026-11-20). */
const LAB_RK = ['x26', 'x43', 'x45', 'x25', 'x33', 'x27', 'x13', 'x44', 'x34', 'x02', 'x48', 'x12', 'x17', 'x32', 'x47', 'x46', 'x24', 'x50'];
const rkOf = lab => LAB_RK[LABS.indexOf(lab)] || (lab === 'the clinic orderly' ? 'x49' : 'x17');
const person = (s, e) => e && e.pid ? byPid(s, e.pid) : null;
const OUT = { burned: 1, out: 1, dead: 1, back: 1, shot: 1, gone: 1 };
const live = (s, e) => { if (OUT[e.fate]) return false; const p = person(s, e); return !e.pid || (!!p && p.alive); };
const here = (s, e) => { const p = person(s, e); return live(s, e) && !(p && (p.away || p.orbit)); };
const nameOf = (s, e) => { const p = person(s, e); return p ? p.name : cap(e.lab); };
const nm = (s, e) => { const p = person(s, e); return p ? p.name : e.lab; };
const firstOf = (s, e) => { const p = person(s, e); return p ? p.first : e.lab.replace(/^an? /, 'the '); };
const last = e => e.res.length ? e.res[e.res.length - 1] : null;
const carries = (t, e) => t.truth.is === 'spread' && e.inf;
function add(s, t, o) { if (t.list.length >= MAXLIST) return null; const e = Object.assign({ k: 'e' + (t.next++), pid: null, lab: null, inf: false, fev: false, res: [], fate: null }, o);
  if (!e.pid && !e.lab) { const used = t.list.map(x => x.lab); e.lab = LF.spick(s, LABS.filter(l => !used.includes(l))) || 'a hand from the yard'; }
  t.list.push(e); return e; }
const byK = (t, k) => t.list.find(e => e.k === k);
/* One line per name: who passed, who failed, and what has become of them. */
const RW = { pass: 'passed', fail: 'failed', refused: 'refused' };
const TIMES = ['', '', ' twice', ' three times', ' four times', ' five times'];
function resWords(e) { if (!e.res.length) return 'not yet tested'; const runs = []; for (const r of e.res) { const l = runs[runs.length - 1]; if (l && l[0] === r) l[1]++; else runs.push([r, 1]); }
  return runs.map(([r, n]) => RW[r] + (n < TIMES.length ? TIMES[n] : ` ${n} times`)).join(', then '); }
const FATE = { burned: 'burned', out: 'put out', dead: 'dead', back: 'put out, and came back', shot: 'shot at the gate', gone: 'put out', held: 'locked up' };
function listText(s, t, keys) {
  const L = (keys ? keys.map(k => byK(t, k)).filter(Boolean) : t.list).filter(e => !e.hid && !(person(s, e) && person(s, e).orbit));
  return L.map(e => { const p = person(s, e), dead = e.pid && p && !p.alive && !e.fate ? (LF.isDead(p) ? 'dead' : 'gone') : null, f = e.fate && FATE[e.fate] ? ` (${FATE[e.fate]})` : dead ? ` (${dead})` : '';
    return `${nameOf(s, e)}${p ? ', ' + LF.title(p).toLowerCase() : ''}: ${resWords(e)}${f}`; }).join('\n'); }
/* A test of one person. What it reads depends on what this is; how well it reads it, on t.truth.acc and the method. */
function testOne(s, t, e, test) {
  const k = t.truth.is, acc = clamp(t.truth.acc + (test === 'assay' ? (LF.down(s, 'medbay') ? 0.1 : 0.05) : 0), 0.5, 0.95), r = LF.srand(s);
  if (k === 'spread') return e.inf ? (r < acc ? 'fail' : 'pass') : (r < acc ? 'pass' : 'fail');
  if (k === 'fever') return e.fev ? (r < 0.85 ? 'fail' : 'pass') : (r < 0.9 ? 'pass' : 'fail');
  if (k === 'faking') { if (e.k === t.target) return 'fail'; if (e.k === t.faker) return 'pass'; }
  return r < acc ? 'pass' : 'fail';
}
/* A round of testing worked out in setup, as plain data: { key: result }. Applied by apply(). */
const round = (s, t, test, keys) => { const o = {}; for (const e of t.list) if (here(s, e) && (!keys || keys.includes(e.k))) o[e.k] = testOne(s, t, e, test); return o; };
function apply(s, t, rr) { for (const k in rr) { const e = byK(t, k); if (!e) continue; e.res.push(rr[k]); t.tests++; if ((rr[k] === 'fail') === carries(t, e)) t.right++; } }
const resLine = (s, t, rr) => listText(s, t, Object.keys(rr)).split('\n').map((l, i) => { const k = Object.keys(rr)[i], e = byK(t, k); return e ? `${nameOf(s, e)}: ${RW[rr[k]]}` : l; }).join('\n');
const failed = (s, t) => t.list.filter(e => here(s, e) && last(e) === 'fail');
const onList = (s, t) => t.list.filter(e => here(s, e) && !e.hid);
const infected = (s, t) => t.list.filter(e => here(s, e) && carries(t, e));
/* Victims as plain data for ctx. */
const vic = (s, es) => es.map(e => ({ k: e.k, pid: e.pid, nm: nm(s, e) }));
const names = (v, cut) => { const n = v.filter(x => x.pid).map(x => x.nm), c = v.length - n.length, parts = n.slice(0, cut || 6); if (n.length > parts.length) parts.push(`${num(n.length - parts.length)} more`);
  if (c) parts.push(`${num(c)} ${parts.length ? 'others' : 'of them'}`); return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0] || 'nobody'; };

/* ---------- people around it ---------- */
const nmR = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['cm', 'command']]) { o[k] = nmR(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  const t = T(s); o.wv = voice(s, 'security'); o.dv = voice(s, 'doctor'); o.sv = voice(s, 'scientist'); o.what = t.what; o.it = t.what === 'body' ? 'the body' : 'the animal'; o.It = cap(o.it); o.lean = lean(t); return o; };
const who = (s, e) => e ? { k: e.k, pid: e.pid, rk: e.pid ? null : rkOf(e.lab), name: nm(s, e), Name: nameOf(s, e), first: firstOf(s, e), First: cap(firstOf(s, e)) } : { k: null, pid: null, name: 'one of the six', Name: 'One of the six', first: 'the hauler', First: 'The hauler' };
const sour = (s, pid, v, txt) => { const p = pid && byPid(s, pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };

/* Deaths between cards: n from the crowd, never below a working floor. */
function take(s, t, n) { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 14))); const k = b - s.pop; t.toll += k; return k; }
const count = (t, n) => { t.toll += n; };
function finish(s, t, end, chron) { if (t.end) return; LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^bt\./.test(e.id)); s.sched.push({ id: 'bt.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
/* The thread is over, but the ones put out may still be at the gate: they get their card first. */
const atGate = (s, t) => t.list.filter(e => e.fate === 'out' && !e.pid);
function close(s, t, end, chron) { if (t.end) return; if (atGate(s, t).length && s.used['bt.out'] === undefined) { t.pend = { end, chron }; LF.phase(s, ID, 'bill'); jump(s, 'bt.out', 20); return; } finish(s, t, end, chron); }

/* What the drastic answers do, by what it is. how: burn, out, alone, pyre (the list torn up and the dead burned: the old calm is
   folded into it, 2026-11-21). es: the people it is done to (ctx). */
function deed(how, es, extra) { return (s, c) => {
  const t = T(s), k = t.truth.is, v = c[es] || [], named = v.filter(x => x.pid), n = v.length - named.length, ex = (typeof extra === 'function' ? extra(s, c) : extra) || {}, fin = ex.then, fx = Object.assign({}, ex); delete fx.then;
  if (how === 'burn') { fx.kill = named.map(x => ({ who: x.pid, cause: 'burned at the wire for failing the blood test' })); if (n) fx.dead = n; }
  if (how === 'out') { fx.depart = named.map(x => ({ who: x.pid, cause: 'put out through the gate for the blood test' })); if (n) fx.gone = n; }
  const keys = v.map(x => x.k), restInf = c.inf.filter(x => !keys.includes(x.k)).length;
  // alone: whoever carries it shows it, alone in a pod, and is burned in it. Nobody else is touched.
  if (how === 'alone' && k === 'spread') { const iv = c.inf, inn = iv.filter(x => x.pid); fx.kill = inn.map(x => ({ who: x.pid, cause: 'found changed, alone in a pod, and burned in it' })); if (iv.length - inn.length) fx.dead = iv.length - inn.length; }
  const after = { burn: { spread: c.night && restInf ? 3 : 0, dead: c.night && c.risen ? 1 : 0, fever: 0, faking: 0 }, out: { spread: c.night && restInf ? 3 : 0, dead: c.night && c.risen ? 1 : 0, fever: 0, faking: 0 },
    alone: { spread: 0, dead: c.risen ? 2 : 0, fever: 2, faking: 0 }, pyre: { spread: 3, dead: 0, fever: 0, faking: 0 } }[how][k];
  if (after) fx.pop = (fx.pop || 0) - after;
  fx.do = s2 => { const t2 = T(s2);
    for (const x of v) { const e = byK(t2, x.k); if (e) e.fate = how === 'burn' ? 'burned' : 'out'; }
    if (how === 'burn') { t2.burned += v.length; count(t2, v.length); t2.did.burned = (t2.did.burned || 0) + v.length; }
    if (how === 'out') { t2.outN += v.length; t2.did.out = (t2.did.out || 0) + v.length; }
    if (how === 'alone' && k === 'spread') { for (const x of c.inf) { const e = byK(t2, x.k); if (e) e.fate = 'burned'; } count(t2, c.inf.length); }
    if (how === 'alone') { t2.alone = s2.day; t2.did.alone = (t2.did.alone || 0) + 1; }
    if (how === 'pyre') { t2.pyre = true; t2.did.pyre = true; }
    count(t2, after);
    if (fin) fin(s2, t2, c); }; return fx; }; }

LF.thread({ id: ID, name: 'The Blood Test', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'A sheet of ruled paper with a column of names and a column of ticks and crosses, copied out again and again, each copy a little longer than the last.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : ['cart', 'wrong'].includes(t.phase) ? 'the cart from the cut' : 'the Blood Test',
  roll: s => ({ is: LF.spick(s, KINDS), acc: 0.55 + LF.srand(s) * 0.33 }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What came back in the cart?',
  chap: {
    burned: t => ({ spread: `What came back from the cut passed from one person to the next. The colony burned everyone the test failed${t.did.restInf ? ', and it went on in the ones it passed' : ''}.`, dead: 'What came back from the cut only ever took the dead. The colony burned living people who had failed a test for it.',
      fever: 'Nobody in the colony carried anything. A fever made the bunk rows afraid, and the colony burned the people the test found hot.', faking: 'Nobody carried anything. One of the colony faked the signs, and the colony burned the people that one wanted burned.' }[t.truth.is]),
    outside: t => ({ spread: 'What came back from the cut passed from one person to the next. The colony put its suspects out through the gate.', dead: 'What came back from the cut only took the dead. The colony put healthy people out through the gate for it.',
      fever: 'A fever made the colony afraid of its own. It put the feverish out through the gate.', faking: 'One of the colony faked the signs, and the colony put its suspects out through the gate.' }[t.truth.is]),
    shown: t => 'What came back from the cut passed from one person to the next. Locked in alone, the ones who had it showed it, and nobody else was touched.',
    caught: t => 'Nobody carried anything. One of the colony faked the signs for a reason of their own, and was caught at it.',
    risen: t => 'What came back from the cut only took the dead. The colony tested its living and left its dead alone, and the dead got up.',
    pyre: t => 'What came back from the cut only took the dead. The colony burned its dead, and that was the end of it.',
    dark: t => 'A fever made the colony afraid of its own. Locked in alone in the dark, it got worse.',
    broke: t => 'A fever made the colony afraid of its own. The colony tore up the list and nursed it, and the fever broke.',
    passed: t => 'A fever made the colony afraid of its own, and passed in its own time.',
    ran: t => 'What came back from the cut passed from one person to the next, and ran through the bunk rows until it stopped.',
    quiet: t => t.truth.is === 'faking' ? 'Nobody carried anything. One of the colony faked the signs, and was never found out.' : 'Whatever came back from the cut went quiet, and the colony never learned what it had been.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), what: LF.srand(s) < 0.5 ? 'animal' : 'body', list: [], next: 1, test: null, insight: 0, ev: {}, did: {}, q: {},
    toll: 0, burned: 0, outN: 0, tests: 0, right: 0, kept: false, pyre: false, held: 0, alone: 0, faker: null, target: null, how: null }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at && s.pop > 20) { LF.phase(s, ID, 'cart'); s.signs.push({ id: 'sickness', d: s.day, src: SRC }); party(s, t); if (t.what === 'body') take(s, t, 1); LF.cue(s, 'bt.cart', 0, 4); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'cart') { if (since('bt.cart') >= 10 || age >= 50) { LF.phase(s, ID, 'wrong'); LF.cue(s, 'bt.wrong', 0, 4); } }
    else if (t.phase === 'wrong') { if (since('bt.wrong') >= 10 || age >= 60) { LF.phase(s, ID, 'test', 'The colony began testing its own blood.'); LF.cue(s, 'bt.test', 0, 4); } }
    else if (t.phase === 'test') { if (since('bt.test') >= 6) once('refuse', 'bt.refuse'); if (since('bt.test') >= 14 && t.kept && !t.pyre) once('cold', 'bt.cold');
      if ((since('bt.test') >= 24 && (since('bt.refuse') >= 6 || since('bt.test') >= 40)) || (age >= 70 && since('bt.test') >= 0) || age >= 110) { LF.phase(s, ID, 'second'); second(s, t); LF.cue(s, 'bt.second', 0, 4); s.tension = clamp(s.tension + 6, 0, 100); } }
    else if (t.phase === 'second') { if (since('bt.second') >= 6) once('fight', 'bt.fight'); if (since('bt.second') >= 14) once('officer', 'bt.officer');
      if ((since('bt.second') >= 24 && (since('bt.officer') >= 6 || since('bt.second') >= 45)) || age >= 75) { LF.phase(s, ID, 'night', 'The list came to a head.'); jump(s, 'bt.night', 20); } }
    else if (t.phase === 'night' && (since('bt.night') >= 20 || age >= 50)) return resolve(s, t);
    else if (t.phase === 'bill' && (since('bt.out') >= 8 || age >= 40)) return finish(s, t, t.pend ? t.pend.end : 'quiet', t.pend && t.pend.chron);
    if (s.day % 10 === 0 && s.used['bt.cart'] !== undefined) month(s, t);
    if (s.day % 5 === 0) { const late = ['second', 'night', 'bill'].includes(t.phase);
      LF.emit(s, 'suspicion', SRC, late ? 42 : t.phase === 'test' ? 34 : 24, 8, 'there is a list on the mess door, and a result beside every name on it');
      if (late) LF.emit(s, 'fear', SRC, 30, 8, 'nobody is sure who on the bunk rows is still who they were');
      if (t.truth.is === 'fever' || t.truth.is === 'spread') LF.emit(s, 'sickness', SRC, 22, 8, 'half the bunk rows have a temperature');
      if (t.held || (t.alone && s.day - t.alone < 12)) LF.emit(s, 'confinement', SRC, t.alone && s.day - t.alone < 12 ? 40 : 22, 8, t.alone && s.day - t.alone < 12 ? 'everyone is locked in a pod alone' : 'people from the list are behind a bar in the pump house'); }
  },
  /* The testing is paid for in hands, and the lock-in stops the colony's work outright. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent') return;
    let d = { cart: 0, wrong: 0.005, test: 0.015, second: 0.02, night: 0.025, bill: 0.01 }[t.phase] || 0;
    if (t.held) d += 0.01; if (t.alone && s.day - t.alone < 10) d += 0.3; if (t.truth.is === 'fever' && ['test', 'second', 'night'].includes(t.phase)) d += 0.01;
    P.labor -= d * PRESS; if (['second', 'night'].includes(t.phase)) P.morale -= 0.008; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* The six who went to the cut: the colony's named people where it has them (never an officer), and enough new names that
   the list has faces; the rest are counted. Under faking one of them is doing it, to themselves or to somebody else. */
function party(s, t) {
  const known = s.people.filter(p => p.alive && !p.role && !p.away && !p.orbit), pick = [];
  while (pick.length < 2 && known.length) { const p = LF.spick(s, known); known.splice(known.indexOf(p), 1); pick.push(p); }
  while (pick.length < 3 && s.world && s.pop > 20) { const p = LF.makePerson(s, null); p.known = s.day || 1; pick.push(p); }
  for (const p of pick) add(s, t, { pid: p.id });
  while (t.list.length < 6) add(s, t, {});
  const k = t.truth.is, sr = LF.srand;
  if (k === 'spread') { t.list[0].inf = sr(s) < 0.75; for (const e of t.list.slice(1)) if (sr(s) < 0.2) e.inf = true; if (!t.list.some(e => e.inf)) t.list[1].inf = true; }
  if (k === 'fever') { t.list[0].fev = sr(s) < 0.8; for (const e of t.list.slice(1)) if (sr(s) < 0.4) e.fev = true; }
  if (k === 'faking') { const named = t.list.filter(e => e.pid); t.how = named.length > 1 && sr(s) < 0.6 ? 'other' : 'self';
    if (t.how === 'self') { t.faker = t.target = t.list[0].k; t.why = 'work'; } else { t.target = t.list[0].k; t.faker = LF.spick(s, named.slice(1)).k; t.why = LF.spick(s, ['grudge', 'rival']); } }
}
/* The second round: the ones who bunk beside them and the ones who carried the cart in go on the list, and everyone is tested. */
function second(s, t) {
  const listed = t.list.map(e => e.pid).filter(Boolean), more = s.people.filter(p => p.alive && !p.role && !p.away && !p.orbit && !listed.includes(p.id));
  const k = t.truth.is, sr = LF.srand, nIn = infected(s, t).length, n0 = t.list.length;
  if (more.length) add(s, t, { pid: LF.spick(s, more).id });
  for (let i = LF.sri(s, 3, 5); i > 0; i--) add(s, t, {});
  for (const e of t.list.slice(n0)) { if (k === 'spread' && nIn && sr(s) < 0.3) e.inf = true; if (k === 'fever' && sr(s) < 0.55) e.fev = true; }
  apply(s, t, round(s, t, t.test || 'wire'));
}
/* Once a month from the cart, while it lasts. */
function month(s, t) {
  const k = t.truth.is, alone = t.alone && s.day - t.alone < 12;
  if (k === 'spread') { const inf = infected(s, t).filter(e => !e.held).length; if (!inf || alone) return;
    if (LF.srand(s) < clamp(RATE.spread + 0.06 * (inf - 1) + (t.clinic ? 0.1 : 0), 0, 0.55)) { if (take(s, t, 1)) LF.log(s, LF.spick(s, ['A bunk in the second row was empty at the dawn count, and the one beside it was soaked through.', 'One of the night shift was found sitting against the wash-house wall at first light, cold, with both hands over the mouth.', 'The galley hand who carried bowls to the pump house did not get up this morning.']), 'bad');
      const e = add(s, t, { inf: true }); if (e) LF.log(s, `${cap(e.lab)} has been added to the list on the mess door.`, ''); } }
  else if (k === 'dead') { if (!t.kept || t.pyre) return; if (LF.srand(s) < RATE.dead && take(s, t, 1)) { t.risen = (t.risen || 0) + 1; LF.log(s, LF.spick(s, ['The cold-room hand was found at the foot of the slab this morning. The sheet was on the floor.', 'One of the watch on the cold-room door was found inside it at first light, though the bar was still across.']), 'bad'); } }
  else if (k === 'fever') { for (const e of t.list) if (!e.fev && LF.srand(s) < 0.08) e.fev = true; if (LF.shift) LF.shift(s, 'doctor', 'mind', -2);
    if (LF.srand(s) < RATE.fever * (alone ? 2 : 1) && take(s, t, 1)) LF.log(s, LF.spick(s, ['A fight in the third row ended with a stove iron. Both of them had a temperature, and both were sure of the other.', 'Somebody on the list was found at the foot of the wash-house steps, and the row says nobody pushed.']), 'bad'); }
  else if (k === 'faking') { const e = byK(t, t.target); if (e && here(s, e) && LF.srand(s) < RATE.faking) { s.morale = clamp(s.morale - 1, 0, 100); sour(s, e.pid, 6, 'was made to look sick and could not prove otherwise'); LF.log(s, `${nameOf(s, e)} was sick again after supper, in front of the whole mess, and the mess moved tables.`, 'bad'); } }
}
/* Nobody answered the last card: the night happened anyway, and nobody gave an order. */
function resolve(s, t) {
  const k = t.truth.is;
  if (k === 'spread') { const n = take(s, t, 3); for (const e of infected(s, t)) { if (e.pid) LF.killPerson(s, e.pid, 'died of what came back from the cut'); else take(s, t, 1); e.fate = 'dead'; t.toll += e.pid ? 1 : 0; }
    LF.log(s, `Nobody gave an order, and it went through the bunk rows. ${Num(n)} were dead before it stopped.`, 'bad'); return close(s, t, 'ran', 'What came back from the cut went through the bunk rows until it stopped.'); }
  if (k === 'dead') { if (t.kept && !t.pyre) { take(s, t, 2); LF.log(s, 'The cold-room door was found open from inside, and two of the night watch were found further down the yard.', 'bad'); return close(s, t, 'risen', 'The dead in the cold room got up.'); }
    return close(s, t, 'quiet', 'The list was left on the mess door until the paper yellowed.'); }
  if (k === 'fever') return close(s, t, 'passed', 'The fever went round the colony and out again, and the list came down.');
  return close(s, t, 'quiet', 'The list was left on the mess door until the paper yellowed.');
}

/* ======================= CART: what came back ======================= */
const OPENER = { animal: c => c.sc, body: c => c.d };
B('cart', { id: 'bt.cart', view: 'colony', tone: 'pressure', title: 'What Came Back in the Cart',
  setup: s => { const t = T(s), c = crew(s), lead = who(s, t.list.find(e => e.pid) || t.list[0]); c.opener = OPENER[t.what](c); c.Opener = cap(c.opener);
    return Object.assign(c, { ev: pickK(s, t), party: names(vic(s, t.list.filter(e => live(s, e))), 6), lead: lead.name, Lead: lead.Name, keys: t.list.map(e => e.k) }); },
  text: (s, c) => `The six who went out to work the far cut, a long day past the wire, came back at dusk walking beside the cart, not riding it. ${c.what === 'body' ? 'Under the tarpaulin in the back is a seventh, a hauler who sat down on the road home complaining of the cold and was dead by the wire. There is not a mark on the body.' : 'Under the tarpaulin in the back is an animal of this world the size of a calf. It walked into their camp at the cut, lay down by the fire and did not get up, and it died in the cart on the way home.'}${c.dv ? `\n\n[[physician]] "Gloves on anyone who touches it, and nobody touches it who doesn't have to, and the six who brought it home come straight to me before they've hugged anybody." "I mean it, and that goes for you too."` : c.sv ? `\n\n[[scientist]] "Don't burn it." "Please, whatever killed it, it's the first whole one we've had, and if there's anything in it at all, any, hold on, just give me the table before anyone lights anything."` : ''}\n\nThe six: ${c.party}.`,
  choices: [
    { label: 'Into the cold room, and open it up', note: 'The cold room holds the colony\'s meat as well, and whoever opens it breathes what it died of.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, c.what === 'body' ? 'physician' : 'xenobio'))} works on ${c.it} under the cold-room lamp with the door shut. ${ev('cart', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev); t.kept = true; } }) },
      bad: { text: (s, c) => `The cold-room motor stalls in the night, and ${c.it} lies a whole shift at room heat before anyone finds it. ${cap(LF.sentName(s, c.what === 'body' ? 'physician' : 'xenobio'))} can say what it was and not what killed it, and the meat on the next hooks goes in the pit.`, fx: s => ({ food: -20, do: s2 => { const t = T(s2); learn(s2, t, 5); t.kept = true; } }) } },
    { label: (s, c) => c.what === 'body' ? 'Burn the body at the wire, with the cart and the six\'s clothes' : 'Burn it at the wire, with the cart and the six\'s clothes', note: (s, c) => c.what === 'body' ? 'The family gets no grave, the six are scrubbed in the yard in front of the colony, and what the hauler died of goes up unread.' : 'The six are stripped and scrubbed in the yard in front of the colony, and whatever it died of goes up unread.',
      out: { text: (s, c) => c.what === 'body' ? 'The hauler is burned by the wire before the family has finished asking for a grave. The six stand in the wash-house doorway in blankets while their clothes burn after. Nobody can say now what the hauler died of.' : 'It goes up on a pile of crate wood by the wire, cart and all. The six stand in the wash-house doorway in blankets while their clothes burn after it. Nobody watching asks what it died of, and nobody could say.',
        fx: (s, c) => ({ mat: -5, morale: c.what === 'body' ? -2 : -1, do: s2 => { const t = T(s2); t.pyre = true; t.did.burnt = true; } }) } },
    { label: 'Shut the six in the pump house for the month, and tell them neither why nor for how long', dark: true, note: 'Whatever they carry stays behind one door, and six people who came home tired are locked up without a word.', info: [['yield', 'The colony kept from them'], ['danger', 'The six']],
      out: { text: (s, c) => `The watch walks the six to the pump house at supper and drops the bar. ${c.Lead} asks through the door what they've done, and keeps asking until lamp-down. The cart goes into the cold room as it is, tarpaulin and all.`,
        fx: (s, c) => ({ morale: 1, tension: -4, stain: ['bt_pen', 1], do: s2 => { const t = T(s2); t.held = s2.day; t.kept = true; t.did.pen = true; for (const k of c.keys) { const e = byK(t, k); if (e) { e.held = true; sour(s2, e.pid, 10, 'was locked in the pump house without a word, back from the cut'); } } } }) } },
  ] });

/* ======================= WRONG: the first one who is slightly wrong ======================= */
B(['wrong', 'test'], { id: 'bt.wrong', tone: 'pressure', title: 'A Beat Late',
  setup: s => { const t = T(s), e = t.list.find(x => here(s, x)) || t.list[0]; return Object.assign(crew(s), who(s, e), { ev: pickK(s, t) }); },
  text: (s, c) => `${c.Name} came back from the cut with the rest and went to work the next morning like the rest. Something is off. ${c.First} eats alone at the end of the long table, answers a beat late when spoken to, and sleeps with the lamp lit. The other five noticed first, and have moved their bunks to the far end of the row.${c.wv ? `\n\n[[security]] "Who sat with ${c.first} at the long table before the cut, and who'd swear it was any different then? Nobody can, so it could be nothing, and it could be that's always been the way of it and nobody ever looked." "Funny how nobody remembers a thing about anyone until they've a reason to, and now the whole row's got one."` : ''}`,
  choices: [
    { about: true, label: (s, c) => `Have ${c.first} looked over properly`, note: (s, c) => `${c.Name} is examined in front of whoever is in the clinic, and the row hears what was looked for.`, test: { base: 50, mods: [R('physician', 10)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} takes an hour over it. ${ev('wrong', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} finds a temperature and a cough and writes them down. ${c.Name} walks back to the row knowing what the clinic was looking for, and so does the row.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: (s, c) => `Move ${c.first} to the pump house, and say it's for a cough`, dark: true, note: (s, c) => `The row sleeps without ${c.first} in it, and ${c.name} is locked up for a cough nobody has.`, info: (s, c) => [['yield', 'The row calm'], ['danger', c.Name]],
      out: { text: (s, c) => `${c.Name} carries a bedroll to the pump house at supper and doesn't argue. The row sleeps better. At breakfast people ask kindly after the cough.`,
        fx: (s, c) => ({ morale: 1, tension: -3, stain: ['bt_lie', 1], do: s2 => { const t = T(s2), e = byK(t, c.k); if (e) e.held = true; t.held = t.held || s2.day; t.did.lied = true; } }) } },
    { label: (s, c) => `Leave ${c.first} at work and in the row, and say nothing`, note: 'The five who moved their bunks go on sleeping in the same room as whatever this is, if it is anything.', info: [['later', 'The row, if it is catching']],
      out: { text: (s, c) => `${c.Name} stays where ${c.first} is. The row goes on sleeping at the far end of the room and watching the lamp at the near one.`,
        fx: s => ({ tension: 3, do: s2 => { const t = T(s2); t.did.left = true; if (t.truth.is === 'spread' && infected(s2, t).length) add(s2, t, { inf: LF.srand(s2) < 0.6 }); } }) } },
  ] });

/* ======================= TEST: the test proposed ======================= */
B('test', { id: 'bt.test', tone: 'crisis', title: 'A Drop of Blood',
  setup: s => { const t = T(s); return Object.assign(crew(s), { list: listText(s, t), rw: round(s, t, 'wire'), ra: round(s, t, 'assay') }); },
  text: (s, c) => `There are two ways to test the list, and the officers don't agree which. ${c.W} wants a drop of each one's blood on a plate and a hot wire put to it, in the mess, so everyone sees. ${c.D} wants the clinic's assay: slower, behind a door, and the clinic shut to the sick while it runs.${c.wv ? `\n\n[[security]] "Ask them and every one of them's got a story, so who do we ask? The blood, because it's the only thing in the mess with no reason to lie." "And we ask it where they can all watch, because a result nobody saw is a result somebody will say was fixed."` : ''}${c.dv ? `\n\n[[physician]] "You'd put a hot wire to their blood in front of the whole mess, with their children watching." "That isn't a test, it's a party trick, and whoever it reads wrong has to walk home past everyone they know, so give me the bench."` : ''}\n\nOn the list:\n${c.list}`,
  choices: [
    { label: 'The wire, in the mess, in front of everyone', note: 'Everyone on the list bleeds in front of the hall, and whoever fails does it in front of the people they sleep beside.',
      out: { text: (s, c) => `The plates go out on the long table under the lamps. One at a time they hold out a thumb, and ${c.w} puts the wire to each drop. The hall watches every one.\n\n${resLine(s, T(s), c.rw)}`, fx: (s, c) => ({ tension: 2, do: s2 => { const t = T(s2); t.test = 'wire'; apply(s2, t, c.rw); } }) } },
    { label: 'The clinic\'s assay, behind a closed door', note: 'The clinic is shut to the sick for the month, and the list waits on a bench outside it for an answer.',
      out: { text: (s, c) => `The clinic shuts its door. The list sits on the bench outside it in turns, and the sheet comes out at the end of the month.\n\n${resLine(s, T(s), c.ra)}`, fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); t.test = 'assay'; apply(s2, t, c.ra); } }) } },
    { label: 'The wire, and anyone who fails goes into the pump house that night with no hearing', dark: true, note: 'The hall sleeps knowing the failures are behind a bar, and the failures are barred in on a drop of blood.', info: [['yield', 'The rows calm'], ['danger', 'Whoever fails']],
      out: { text: (s, c) => `The wire goes round the table in front of the hall. Each one who fails is walked straight across the yard to the pump house, still holding a thumb.\n\n${resLine(s, T(s), c.rw)}`,
        fx: (s, c) => ({ morale: 1, tension: -5, stain: ['bt_pen', 1], do: s2 => { const t = T(s2); t.test = 'wire'; apply(s2, t, c.rw); t.held = s2.day; t.did.pen = true; for (const k in c.rw) if (c.rw[k] === 'fail') { const e = byK(t, k); if (e) e.held = true; } } }) } },
  ] });

/* The refusal: the next name on the list will not hold out an arm. */
B(['test', 'second'], { id: 'bt.refuse', tone: 'pressure', title: 'Will Not Bleed',
  setup: s => { const t = T(s), listed = t.list.map(e => e.pid).filter(Boolean), pool = s.people.filter(p => p.alive && !p.role && !p.away && !p.orbit && !listed.includes(p.id));
    const p = pool.length ? LF.spick(s, pool) : null, k = t.truth.is, inf = k === 'spread' && infected(s, t).length > 0 && LF.srand(s) < 0.45, fev = k === 'fever' && LF.srand(s) < 0.6;
    const e0 = t.list.find(x => x.pid && here(s, x)) || t.list[0], lab = p ? null : (LF.spick(s, LABS.filter(l => !t.list.some(e => e.lab === l))) || 'a hand from the yard'), c = Object.assign(crew(s), p ? { pid: p.id, name: p.name, Name: p.name, first: p.first } : { pid: null, name: lab, Name: cap(lab), first: lab.replace(/^an? /, 'the ') });
    const probe = { k: '_', inf, fev }; return Object.assign(c, { subj: nameOf(s, e0), inf, fev, ev: pickK(s, t), rr: testOne(s, t, probe, t.test || 'wire'), list: listText(s, t) }); },
  text: (s, c) => `${c.Name} sleeps in the bunk next to ${c.subj}, is the next name on the list, and won't hold out an arm.${ev('refuse', c.ev, c)}\n\nThe list so far:\n${c.list}`,
  choices: [
    { label: (s, c) => `Let ${c.first} refuse, and write it on the list`, note: (s, c) => `${c.Name} goes on sleeping in the row with "refused" beside the name, and the row sleeps beside that.`,
      out: { text: (s, c) => `"Refused" goes on the list in ${c.w}'s hand. ${c.Name} goes back to the row, and nobody in it says goodnight.`,
        fx: (s, c) => ({ tension: 3, do: s2 => { const t = T(s2); add(s2, t, { pid: c.pid, lab: c.pid ? null : c.name, inf: c.inf, fev: c.fev, res: ['refused'] }); learn(s2, t, 6, c.ev); LF.emit(s2, 'suspicion', 'bt.refused', 25, 90, 'somebody on the list would not bleed'); } }) } },
    { label: (s, c) => `Have the watch hold ${c.first} down and take it`, dark: true, note: (s, c) => `The colony gets its result, and ${c.name} is held face down on a mess table to give it.`, info: (s, c) => [['yield', 'A result'], ['danger', c.Name]],
      out: { text: (s, c) => `It takes four of the watch, and ${c.first} doesn't stop fighting until the needle is out. ${c.Name} ${c.rr === 'fail' ? 'failed' : 'passed'}. The row heard all of it through the wall.`,
        fx: (s, c) => ({ morale: 1, tension: -3, stain: ['bt_held', 2], do: s2 => { const t = T(s2); const e = add(s2, t, { pid: c.pid, lab: c.pid ? null : c.name, inf: c.inf, fev: c.fev }); if (e) apply(s2, t, { [e.k]: c.rr }); learn(s2, t, 8, c.ev); t.did.held = true; sour(s2, c.pid, 20, 'was held down for the needle'); } }) } },
    { label: (s, c) => `Let ${c.first} bleed in private, with only you to see the wire`, note: 'The hall has to take your word for the result, and some of it won\'t.',
      out: { text: (s, c) => `${c.Name} holds out an arm in your quarters with the door shut, and watches the wire as closely as you do. You tell the hall ${c.first} ${c.rr === 'fail' ? 'failed' : 'passed'}. Some of the hall believes you.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); const e = add(s2, t, { pid: c.pid, lab: c.pid ? null : c.name, inf: c.inf, fev: c.fev }); if (e) apply(s2, t, { [e.k]: c.rr }); learn(s2, t, 6, c.ev); LF.emit(s2, 'suspicion', 'bt.private', 22, 90, 'a result was given out that only the commander saw'); } }) } },
  ] });

/* ======================= The cold room (only while it is kept there) ======================= */
B(['test', 'second'], { id: 'bt.cold', tone: 'pressure', title: 'On the Slab',
  when: (s, t) => t.kept && !t.pyre,
  setup: s => { const t = T(s), e = t.list.find(x => x.pid && here(s, x)); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.1), subj: e ? nm(s, e) : null, Subj: e ? nameOf(s, e) : null, sk: e ? e.k : null, spid: e ? e.pid : null }); },
  text: (s, c) => `The cold-room hand won't go back in. ${c.It} has lain on the slab under a sheet at two degrees since the cart came home. This morning the hand opened the door for the meat, shut it again, and has sat on the step since without saying what was seen.${c.sv ? `\n\n[[scientist]] "Let me in there." "Just me, with a lamp, nobody else, because whatever it's doing it's doing it now, and if we wait till morning we'll only be looking at what it's finished doing."` : ''}`,
  choices: [
    { label: 'Open the door, with rifles behind', note: 'Whoever goes in first goes in with it, and the watch stands in the doorway with no idea what to aim at.', test: { base: 50, mods: [R('xenobio', 10), R('security', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} goes in with a lamp and the watch in the doorway. ${ev('cold', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => T(s).truth.is === 'dead' ? `The lamp goes out in the doorway. When it is lit again one of the watch is on the floor and won't get up, and nothing on the slab has moved. ${cap(LF.sentName(s, 'xenobio'))} won't go in again without a second lamp.` : `${cap(LF.sentName(s, 'xenobio'))} slips on the frost inside the door and goes down hard with the lamp. The cut needs stitches and the look gets nothing. The hand who saw something has stopped saying so.`,
        fx: s => T(s).truth.is === 'dead' ? { pop: -1, morale: -1, do: s2 => { const t = T(s2); count(t, 1); learn(s2, t, 12, 'dead'); } } : { morale: -1, do: s2 => learn(s2, T(s2), 5) } } },
    { label: 'Burn the cold room with it inside, and the meat with it', note: 'The colony loses its cold store and every hook of meat in it, to burn something nobody has looked at.',
      out: { text: (s, c) => `The cold room burns for an hour, and the smell of the meat hangs over the colony at supper. When it is cool enough ${c.e} rakes it out. There is nothing left to say what was on the slab.`,
        fx: s => ({ food: -30, mat: -10, morale: -1, do: s2 => { const t = T(s2); t.pyre = true; t.did.coldburn = true; } }) } },
    { label: (s, c) => `Shut ${c.subj} in the cold room with it for a night, and see what each of them does`, dark: true, show: (s, c) => !!c.subj, note: (s, c) => `The colony learns something, and ${c.subj} spends a night at two degrees beside it to teach it.`, info: (s, c) => [['yield', 'What it does'], ['danger', c.Subj]],
      out: { text: (s, c) => `${c.Subj} is shut in at lamp-down with a lamp and a blanket, and the bar goes across. In the morning ${c.subj} comes out grey with cold and won't speak to anyone. ${ev('cold', c.ev2, c)}`,
        fx: (s, c) => ({ tension: -2, stain: ['bt_cold', 2], do: s2 => { const t = T(s2); learn(s2, t, 28, c.ev2); t.did.coldnight = c.subj; sour(s2, c.spid, 20, 'was shut in the cold room for a night with what came back from the cut'); } }) } },
  ] });

/* ======================= SECOND: the list grows ======================= */
B('second', { id: 'bt.second', tone: 'crisis', title: 'The Second List',
  setup: s => { const t = T(s), f = failed(s, t), L = onList(s, t), tg = byK(t, t.target), fk = byK(t, t.faker);
    return Object.assign(crew(s), { n: L.length, shown: t.list.filter(e => !e.hid).length, list: listText(s, t), fail: vic(s, f), inf: vic(s, infected(s, t)), nf: f.length, ev: pickK(s, t), risen: t.kept && !t.pyre && t.truth.is === 'dead',
      target: tg ? nm(s, tg) : 'one of the six', faker: fk ? nameOf(s, fk) : 'One of the six', fakerFirst: fk ? firstOf(s, fk) : 'that one', self: t.how === 'self' }); },
  text: (s, c) => `The second round is done. The list has the six on it, and now the ones who bunk beside them and the ones who carried the cart in: ${num(c.shown)} names in ${c.w}'s hand, on a sheet pinned to the mess door.\n\n${c.list}\n\n${c.lean}`,
  choices: [
    { label: 'New hands on the needle: test them all again, and test whoever drew the blood', note: 'The work stops again for the testing, and whoever has been drawing the blood goes on the list.',
      out: { text: (s, c) => T(s).truth.is === 'faking' ? `The needle goes to two of the watch, and everyone who has handled a sample sits down to be tested with the rest. This time the samples are drawn and carried by hands that never touched the old ones, and ${c.self ? `${c.target} passes` : `${c.target} passes, and so does everyone else`}. ${c.self ? `${cap(c.target)} sits very still when it's read out.` : `When the watch goes through ${c.fakerFirst}'s bunk they find a vial of the clinic's spirit and a list of names in the same order as the sheet on the mess door.`}`
        : `The needle changes hands and every one of them bleeds again. The sheet comes out much as it did the first time. ${ev('blood', c.ev, c)}`,
        fx: (s, c) => ({ progress: -0.05, do: s2 => { const t = T(s2); if (t.truth.is === 'faking') { t.did.needle = true; close(s2, t, 'caught', 'The one faking the signs was caught when the needle changed hands.'); } else learn(s2, t, 15, c.ev); } }) } },
    { label: 'Put the ones who failed outside the wire with a tent and a month of food', dark: true, show: (s, c) => c.nf > 0, cost: { food: 20 }, note: 'The rows are clear of them, and the ones put out live or die past the wire on one drop of blood.', info: (s, c) => [['yield', 'The rows clear of them'], ['danger', `The ${num(c.nf)} put out`]],
      out: { text: (s, c) => `${cap(names(c.fail))} go out through the gate at noon with a tent, a month of food and nothing else. The bar goes down behind them. By dusk they have the tent up on the far side of the open ground, where the wall can see it.`,
        fx: deed('out', 'fail', { morale: 1, tension: -6, stain: ['bt_out', 2], then: (s2, t, c) => { if (t.truth.is === 'spread' && !infected(s2, t).length) close(s2, t, 'outside', 'The colony put the people who failed the blood test outside the wire.'); } }) } },
    { label: 'Lock everyone on the list in alone, one to a pod, until it shows itself', note: 'The list stops working and is fed through a hatch, and every one of them spends a month alone with the fear.',
      out: { text: (s, c) => ({ spread: `The ${num(c.n)} go into pods one to a door, and the hatches are fed twice a day. ${c.inf.length ? `Before the month is out ${names(c.inf)} ${c.inf.length === 1 ? 'stops' : 'stop'} answering at the hatch, and the wall burns those pods shut without opening them.` : 'Nothing answers wrong at any hatch.'} The rest come out thin and blinking and are let go back to their rows.`,
          dead: `The ${num(c.n)} go into pods one to a door, and the hatches are fed twice a day. Nothing happens in any of them.${c.risen ? ' While they are in, the cold-room door is found open from inside, and two of the watch who fed the hatches are found further down the yard.' : ''} They come out at the end of the month thin and furious, and nobody can say what it showed.`,
          fever: `The ${num(c.n)} go into pods one to a door. Alone in the dark the hot ones get hotter, and by the end of the month two of them have to be carried out. Nobody can say what it showed.`,
          faking: `The ${num(c.n)} go into pods one to a door. Alone, nobody gets sick: not ${c.target}, not anyone. ${c.self ? `${cap(c.target)} asks for the bar to be lifted, and has been sick in front of nobody since.` : `When the watch searches the pods they find a vial of the clinic's spirit in ${c.fakerFirst}'s bedroll.`}` })[T(s).truth.is],
        fx: deed('alone', 'none', (s, c) => ({ food: -20, morale: -2, then: (s2, t) => { const k = t.truth.is; if (k === 'spread') close(s2, t, 'shown', 'Locked in alone, the ones who carried it showed it.'); if (k === 'faking') close(s2, t, 'caught', 'Locked in alone, nobody could fake anything, and the one who had been was found out.'); } })) } },
  ] });

/* The row that tied one of its own. */
B(['second', 'night'], { id: 'bt.fight', tone: 'crisis', title: 'In the Second Row',
  setup: s => { const t = T(s), cand = t.list.filter(e => e.pid && here(s, e) && !e.held), e = cand.find(x => last(x) === 'pass') || cand[0] || t.list.find(x => here(s, x)); return Object.assign(crew(s), who(s, e), { passed: !!e && last(e) === 'pass', ev: pickK(s, t) }); },
  text: (s, c) => `The second row has tied ${c.name} to a bunk frame with cargo strap, and won't untie ${c.first} until somebody does something. ${c.passed ? `${c.Name} passed the wire. The row says the wire is wrong.` : `${c.Name} failed the wire, and the row is done waiting to be told what that means.`} ${ev('row', c.ev, c)}\n\n${c.wv ? `${c.W} is at the door with two of the watch` : 'The watch is at the door'}, and the row is behind the bunks with the stove irons.`,
  choices: [
    { label: (s, c) => `Cut ${c.first} loose, and put the whole row on the punishment detail`, note: (s, c) => `Twenty frightened people are punished for being frightened, and sleep beside ${c.name} again.`,
      out: { text: (s, c) => `${c.W} goes in with the watch and cuts the strap. The row puts the irons down when told. It's on the latrine pits for the season, and ${c.name} sleeps in the row again because there's nowhere else.`,
        fx: (s, c) => ({ morale: -2, tension: 4, do: s2 => { learn(s2, T(s2), 6, c.ev); LF.emit(s2, 'resentment', 'bt.row', 26, 120, 'a bunk row was punished for tying up somebody it was afraid of'); } }) } },
    { label: (s, c) => `Take ${c.first} into the pump house yourself, and tell the row why`, note: (s, c) => `${c.Name} is locked up for having been accused, and the row learns that tying somebody up gets them taken away.`,
      out: { text: (s, c) => `You walk ${c.name} across the yard to the pump house with the strap still on one wrist. The row watches from the door. By morning another row has a name it wants walked across the yard.`,
        fx: (s, c) => ({ tension: -2, do: s2 => { const t = T(s2), e = byK(t, c.k); if (e) e.held = true; t.held = t.held || s2.day; learn(s2, t, 6, c.ev); } }) } },
    { label: (s, c) => `Give the row what it wants: ${c.first} goes out through the gate tonight`, dark: true, note: (s, c) => `The row is calm by lamp-down, and ${c.name} walks out alone with a blanket and a water can.`, info: (s, c) => [['yield', 'The row calm'], ['danger', c.Name]],
      out: { text: (s, c) => `${c.Name} is walked to the gate at lamp-down with a blanket and a water can. The row comes out to watch the bar go down. ${c.Name} stands at the wire for a long while, and then isn't there.`,
        fx: (s, c) => Object.assign(c.pid ? { depart: [{ who: c.pid, cause: 'put out through the gate by a frightened bunk row' }] } : { gone: 1 }, { morale: 1, tension: -6, stain: ['bt_out', 2], do: s2 => { const t = T(s2), e = byK(t, c.k); if (e) e.fate = 'out'; t.outN++; t.did.out = (t.did.out || 0) + 1; learn(s2, t, 6, c.ev); } }) } },
  ] });

/* The one drawing the blood has drawn their own, and it failed. */
const OWN = {
  doctor: `[[doctor]] "Mine failed, and I ran it twice, so you can stop staring at the plate." "Put me on your list, then, but you're not taking the needle off me until somebody else here can find a vein."`,
  scientist: `[[scientist]] "Mine failed." "Which is interesting, isn't it, because I feel exactly the same as I did this morning, so either the test's wrong or I'm the kind of thing that wouldn't know, and I can't think of an experiment that tells those two apart from the inside."`,
};
B(['second', 'night'], { id: 'bt.officer', tone: 'pressure', title: 'Their Own Sample',
  setup: s => { const t = T(s), seat = ['doctor', 'scientist'].find(k => voice(s, k)), o = seat ? LF.officer(s, seat) : anyNamed(s, LF.SEAT_ORDER.concat(t.list.map(e => e.pid).filter(Boolean)));
    const k = t.truth.is, c = crew(s); return Object.assign(c, o ? { pid: o.id, oname: o.name, Oname: o.name, ofirst: o.first } : { pid: null, oname: 'the clinic orderly', Oname: 'The clinic orderly', ofirst: 'the orderly' },
      { seat: seat || null, line: seat ? OWN[seat] : '', inf: k === 'spread' && LF.srand(s) < 0.35, fev: k === 'fever' && LF.srand(s) < 0.7 }); },
  text: (s, c) => `${c.seat ? c.Oname : `${c.Oname}, the clinic orderly,`} has been drawing the list's blood since the cart came in, and last night drew ${c.ofirst}'s own, to be fair about it. It failed. It failed again on the second plate.${c.line ? `\n\n${c.line}` : ''}`,
  choices: [
    { label: (s, c) => `${cap(c.ofirst)} stays at the bench, on the list, and the hall is told`, note: 'The sick are treated by somebody on the list, and the hall knows it.',
      out: { text: (s, c) => `It goes up on the mess door in ${c.ofirst}'s own hand. The clinic stays open. Fewer people come to it.`,
        fx: (s, c) => ({ morale: -2, tension: 3, do: s2 => { const t = T(s2); add(s2, t, { pid: c.pid, lab: c.pid ? null : c.oname, inf: c.inf, fev: c.fev, res: ['fail', 'fail'] }); if (c.inf) t.clinic = true; } }) } },
    { label: (s, c) => `Stand ${c.ofirst} down, and shut ${c.ofirst} in the pump house until it's over`, note: (s, c) => `The clinic is run by whoever is to hand, and ${c.oname} sits behind a bar for having been honest.`,
      out: { text: (s, c) => `${c.Oname} hands over the needle and the bench keys and walks to the pump house without being told twice. The clinic is run by an orderly with a manual open on the bench.`,
        fx: (s, c) => ({ morale: -1, off: [['ctx', 'mind', -8]], do: s2 => { const t = T(s2); add(s2, t, { pid: c.pid, lab: c.pid ? null : c.oname, inf: c.inf, fev: c.fev, res: ['fail', 'fail'], held: true }); t.held = t.held || s2.day; sour(s2, c.pid, 12, 'was shut in the pump house for an honest result'); } }) } },
    { label: (s, c) => `Say the plate was dirty, burn the sheet, and keep ${c.ofirst} at the bench`, dark: true, note: (s, c) => `The clinic keeps its hands, and everyone ${c.ofirst} treats is treated by somebody who failed.`, info: (s, c) => [['yield', 'Morale, and a clinic'], ['danger', `Everyone ${c.ofirst} treats`]],
      out: { text: (s, c) => `The sheet goes in the galley stove. ${c.Oname} goes back to the bench and keeps drawing blood, and the hall is told the plate was dirty.`,
        fx: (s, c) => ({ morale: 2, tension: -4, stain: ['bt_lie', 1], do: s2 => { const t = T(s2); add(s2, t, { pid: c.pid, lab: c.pid ? null : c.oname, inf: c.inf, fev: c.fev, res: ['fail', 'fail'], hid: true }); if (c.inf) t.clinic = true; t.did.lied = true; } }) } },
  ] });

/* ======================= NIGHT: it comes to a head ======================= */
B('night', { id: 'bt.night', tone: 'crisis', title: 'The Night of the List',
  setup: s => { const t = T(s), f = failed(s, t), L = onList(s, t);
    return Object.assign(crew(s), { night: true, list: listText(s, t), fail: vic(s, f), all: vic(s, L), inf: vic(s, infected(s, t)), nf: f.length, n: L.length, kept: t.kept && !t.pyre, risen: t.kept && !t.pyre && t.truth.is === 'dead',
      target: (byK(t, t.target) && nm(s, byK(t, t.target))) || 'one of the six', fakerFirst: (byK(t, t.faker) && firstOf(s, byK(t, t.faker))) || 'that one', self: t.how === 'self' }); },
  text: (s, c) => `At supper somebody on the list sat down at the wrong end of the long table, and the table emptied. By lamp-down the hall has split down the middle, and the watch is standing between the halves with every rifle the colony has. Both halves want an order before anybody sleeps.\n\nThe list on the mess door:\n${c.list}\n\n${c.lean}`,
  choices: [
    { label: 'Burn everyone who failed, tonight', dark: true, show: (s, c) => c.nf > 0, note: (s, c) => `The ${num(c.nf)} who failed go to the wire, and anyone who loved one of them watches.`, info: (s, c) => [['yield', 'An end to it, if the test is right'], ['danger', `The ${num(c.nf)} who failed`]],
      out: { text: (s, c) => `${cap(names(c.fail))} are taken to the wire at midnight. It is quick for some of them. ${({ spread: c.inf.every(x => c.fail.some(y => y.k === x.k)) ? 'The rows sleep after that, and nobody on them is found in the morning, then or later.' : 'Before the month is out a bunk in the second row is empty, and its neighbour was on nobody\'s list.', dead: c.risen ? 'The month after is quiet, except in the cold room, where the hand on the door asks to be moved and is found inside it.' : 'The month after is quiet.', fever: 'The hall goes on being hot and sure of itself for a month, and then the fever goes round the rest of the colony and leaves it.', faking: `${cap(c.target)} was among them${c.self ? '' : `, and ${c.fakerFirst} sleeps better since`}.` })[T(s).truth.is]}`,
        fx: deed('burn', 'fail', { morale: 2, tension: -12, stain: ['bt_burned', 3], chron: 'The colony burned everyone who had failed the blood test.', then: (s2, t, c) => { const k = t.truth.is; if (k === 'spread') t.did.restInf = !c.inf.every(x => c.fail.some(y => y.k === x.k)); close(s2, t, k === 'spread' && t.did.restInf ? 'ran' : k === 'dead' && c.risen ? 'risen' : 'burned', 'The colony burned everyone on the list who had failed.'); } }) } },
    // Three on screen (2026-11-21): the whole list put out takes the burning's place when nobody on the list stands failed (opposite shows).
    { label: 'Put everyone on the list outside the wire, with tents and a month of food', dark: true, show: (s, c) => c.nf === 0, cost: { food: 30 }, note: 'Everyone named on the mess door goes out through the gate, failed or passed, and the colony sleeps without them.', info: (s, c) => [['yield', 'The colony clear of it, if it is on the list'], ['danger', `The ${num(c.n)} named`]],
      out: { text: (s, c) => `The ${num(c.n)} named on the mess door go out through the gate at first light with tents, food and their bedrolls, ${names(c.all, 4)} among them. The bar goes down. ${({ spread: c.inf.every(x => c.all.some(y => y.k === x.k)) ? 'The rows are quiet after that.' : 'Inside the month a bunk in the second row is empty, and its neighbour was on nobody\'s list.', dead: c.risen ? 'The rows are quiet after that, apart from the cold room.' : 'The rows are quiet after that.', fever: 'The fever goes round the rest of the colony anyway, a month later, and leaves it.', faking: 'The rows are quiet after that.' })[T(s).truth.is]}`,
        fx: deed('out', 'all', { morale: 1, tension: -8, stain: ['bt_out', 2], chron: 'The colony put everyone on the blood-test list outside the wire.', then: (s2, t, c) => close(s2, t, t.truth.is === 'dead' && c.risen ? 'risen' : t.truth.is === 'spread' && !c.inf.every(x => c.all.some(y => y.k === x.k)) ? 'ran' : 'outside', 'The colony put everyone on the list outside the wire.') }) } },
    { label: 'Lock everyone in alone, one to a pod, until it shows itself', note: 'The colony stops working for a month and is fed through hatches, and every child spends it alone in a room.',
      out: { text: (s, c) => ({ spread: `The whole colony goes into pods one to a door, children too, and the watch feeds the hatches. ${c.inf.length ? `Inside the month ${num(c.inf.length)} ${c.inf.length === 1 ? 'hatch stops' : 'hatches stop'} answering: ${names(c.inf)}. The wall burns each pod shut without opening it.` : 'Nothing answers wrong at any hatch.'} Then the doors open, and everyone else walks out.`,
          dead: `The whole colony goes into pods one to a door, children too, and the watch feeds the hatches. Nothing happens in any pod.${c.risen ? ' On the third night the cold-room door is found open from inside, and two of the watch feeding the hatches are found further down the yard.' : ''} Then the doors open, and nobody can say what it showed.`,
          fever: 'The whole colony goes into pods one to a door, children too. Alone in the dark the hot ones get hotter and frightened past anything a hatch can talk down. Two are dead in their pods before the doors open.',
          faking: `The whole colony goes into pods one to a door. Alone, nobody gets sick: not ${c.target}, not anyone. ${c.self ? `${cap(c.target)} asks for the bar to be lifted on the second day and says why, to you, through the hatch.` : `The watch searches every pod and finds a vial of the clinic's spirit in ${c.fakerFirst}'s bedroll.`}` })[T(s).truth.is],
        fx: deed('alone', 'none', { food: -40, morale: -3, then: (s2, t, c) => { const k = t.truth.is; close(s2, t, { spread: 'shown', dead: c.risen ? 'risen' : 'quiet', fever: 'dark', faking: 'caught' }[k], { spread: 'Locked in alone, the ones who carried it showed it.', dead: 'The colony locked itself in alone, and nothing showed.', fever: 'The colony locked itself in alone, and the fever got worse in the dark.', faking: 'Locked in alone, nobody could fake anything, and the one who had been was found out.' }[k]); } }) } },
    // The fold (2026-11-21, three options at most): burning the dead (right under dead) and tearing up the list (right under fever) were two
    // answers that both leave the living alone. They are one option now, and its outcome reads the truth.
    { label: (s, c) => c.kept ? 'Tear up the list, and burn the cold room and everyone buried since the cart came home' : 'Tear up the list, and dig up and burn everyone buried since the cart came home', note: 'The families watch their dead burned, and whoever on the list carries anything goes back into the rows with nobody watching.',
      out: { text: (s, c) => `The list comes off the mess door and goes in the stove. ${c.kept ? 'The cold room goes up next, then the new graves, one at a time.' : 'Then the new graves are opened one at a time.'} The families stand at the wire with the watch between. ${({ spread: 'Inside the month the second row is three short, and the third is starting.', dead: c.risen ? 'When the last of them is ash the cold weather goes out of the mess wall, and the hall eats at one table again.' : 'When the last of them is ash the hall eats at one table again.', fever: 'The clinic opens to anyone with a temperature, and there is a line. Nursed and cooled and told nobody is on any list, the hot ones come down, and the hall eats at one table again.', faking: 'With no list, there is nothing to fake on, and the sick stop being sick.' })[T(s).truth.is]}`,
        fx: deed('pyre', 'none', (s, c) => ({ mat: -10, morale: -1, food: c.kept ? -20 : 0, then: (s2, t) => close(s2, t, { spread: 'ran', dead: 'pyre', fever: 'broke', faking: 'quiet' }[t.truth.is], 'The colony tore up the list and burned its dead.') })) } },
  ] });

/* ======================= BILL: the ones put out, at the gate ======================= */
B(['second', 'night', 'bill'], { id: 'bt.out', tone: 'pressure', title: 'At the Gate',
  when: (s, t) => atGate(s, t).length > 0,
  setup: s => { const t = T(s), back = atGate(s, t), named = t.list.filter(e => e.fate === 'out' && e.pid);
    return Object.assign(crew(s), { back: back.map(e => e.k), n: back.length, named: named.length ? names(vic(s, named)) : null, nNamed: named.length, sick: back.filter(e => carries(t, e)).length }); },
  text: (s, c) => `${Num(c.n)} of the ones put out are at the gate at first light, thin and filthy, asking to be let in.${c.named ? ` ${cap(c.named)} ${c.nNamed === 1 ? 'is' : 'are'} not with them, and they won't say why.` : ''} The wall has rifles on them and is waiting for an order.`,
  choices: [
    { label: 'Let them in, and test them again at the gate', note: 'The rows take back people the colony sent out, and nobody knows what they bring back with them.',
      out: { text: (s, c) => c.sick ? `They come in one at a time through the gate and bleed at it. The wire passes most of them. Inside the month ${num(Math.min(2, c.sick + 1))} of the bunks they came back to ${c.sick ? 'are empty at the dawn count' : ''}.` : 'They come in one at a time through the gate and bleed at it, and go back to their rows. The rows make room.',
        fx: (s, c) => ({ pop: c.n - (c.sick ? Math.min(2, c.sick + 1) : 0), morale: c.sick ? -2 : 2, do: s2 => { const t = T(s2); for (const k of c.back) { const e = byK(t, k); if (e) e.fate = 'back'; } count(t, c.sick ? Math.min(2, c.sick + 1) : 0); t.did.back = c.n; if (t.phase === 'bill') finish(s2, t, t.pend ? t.pend.end : 'quiet', t.pend && t.pend.chron); } }) } },
    { label: 'Keep the gate shut, and throw food over the wire', cost: { food: 20 }, note: 'They live or die out there on what the colony throws them, in sight of the wall.',
      out: { text: 'The wall throws sacks over the wire at noon. They sit by the gate for a while and eat, and then walk away together toward the cut.',
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); for (const k of c.back) { const e = byK(t, k); if (e) e.fate = 'gone'; } if (t.phase === 'bill') finish(s2, t, t.pend ? t.pend.end : 'quiet', t.pend && t.pend.chron); } }) } },
    { label: 'Fire at them', dark: true, note: 'If they carry it, it ends at the gate, and the wall shoots people it knows by name.', info: [['yield', 'An end to it, if they carry it'], ['danger', 'The ones at the gate']],
      out: { text: (s, c) => `The wall fires on the third call to go. ${Num(c.n)} are lying at the gate when the smoke clears, and the wall has to go out and burn them where they lie.`,
        fx: (s, c) => ({ tension: -6, stain: ['bt_shot', 3], chips: [[`${cap(num(c.n))} shot at the gate`, false]], do: s2 => { const t = T(s2); for (const k of c.back) { const e = byK(t, k); if (e) e.fate = 'shot'; } t.did.shot = c.n; if (t.phase === 'bill') finish(s2, t, t.pend ? t.pend.end : 'quiet', t.pend && t.pend.chron); } }) } },
  ] });

/* ======================= AFTER: what was in the blood ======================= */
const WAS = {
  spread: (t, c) => `It was real, and it went from one person to the next by the breath and the blood. Nobody ever saw it. It lived in the people it took, and it showed only in what they did, and in the blood on a plate under a hot wire. The wire was right ${c.pct} times in ten.`,
  dead: (t, c) => `It only ever took the dead. ${c.it === 'the body' ? 'The hauler who sat down on the road home had died at the cut, and walked most of the way back dead.' : 'The animal in the cart had been dead for days when it walked into the camp at the cut.'} The living were never at risk from it. Nobody on the list carried anything. Every fail on the mess door was the wire, wrong.`,
  fever: (t, c) => `Nobody carried anything. ${c.It} in the cart died of a fever of this world, an ordinary one that makes people hot and certain and afraid of each other, and the officers had it too. The test read the fever, and the fever was all it read.`,
  faking: (t, c) => `Nobody carried anything. ${c.faker ? `${cap(c.faker)} faked the signs ${c.self ? `on ${c.fakerFirst === 'that one' ? 'themselves' : c.fakerFirst}, ${c.why}` : `on ${c.target}, ${c.why}`}.` : 'One of the six faked the signs.'} Every fail on the mess door that was not an honest mistake was a vial of the clinic's spirit.`,
};
const WHY = { work: 'for a way off the far cut and the work list', grudge: 'over an old grudge from the ship', rival: 'for a place one of them wanted' };
/* Who was really what, by name where there is one. */
function who2(s, t) {
  const k = t.truth.is, L = [], named = t.list.filter(e => e.pid && !e.hid), counted = t.list.filter(e => !e.pid);
  for (const e of named.slice(0, 7)) { const r = e.res, f = r.includes('fail'), real = k === 'spread' ? e.inf : k === 'fever' ? e.fev : k === 'faking' ? e.k === t.faker : false;
    const what = k === 'spread' ? (real ? 'carried it' : 'carried nothing') : k === 'fever' ? (real ? 'had the fever' : 'was well') : k === 'faking' ? (e.k === t.faker ? 'did it' : e.k === t.target ? 'was the one it was done to' : 'carried nothing') : 'carried nothing';
    const fate = { burned: ' and was burned', out: ' and was put out', gone: ' and was put out', shot: ' and was shot at the gate', back: ' and was put out and let back in' }[e.fate] || '';
    const did = !r.length ? 'was never tested' : f ? 'failed' : r.includes('refused') && r.length === 1 ? 'refused' : 'passed';
    L.push(fate ? `${nameOf(s, e)} ${did}, ${what},${fate}.` : `${nameOf(s, e)} ${did}, and ${what}.`); }
  const ci = counted.filter(e => k === 'spread' ? e.inf : k === 'fever' ? e.fev : false).length;
  if (counted.length) L.push(`Of the ${num(counted.length)} others on the list, ${ci && ci === counted.length ? (counted.length === 2 ? 'both' : `all ${num(ci)}`) : num(ci)} ${k === 'spread' ? 'carried it' : k === 'fever' ? 'had the fever' : 'carried anything'}.`.replace(/, no carried anything/, ', none carried anything'));
  return L.join(' ');
}
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [], add2 = (a, b, c2, e) => L.push({ spread: a, dead: b, fever: c2, faking: e }[k]);
  const G = (n, a, one, many) => n === 1 ? `The one ${a} ${one}` : `The ${num(n)} ${a} ${many}`;
  if (d.burned) add2(t.did.restInf ? G(d.burned, 'burned at the wire', 'was not the only one who had it.', 'were not all of the ones who had it.') : G(d.burned, 'burned at the wire', 'was burned', 'were burned') + ' on the word of a test that was right most of the time.',
    G(d.burned, 'burned at the wire', 'was healthy.', 'were healthy.'), G(d.burned, 'burned at the wire', 'had a fever.', 'had a fever.'), G(d.burned, 'burned at the wire', 'was', 'were') + ' burned for somebody else\'s reason.');
  if (d.out) add2(G(d.out, 'put out through the gate', 'was', 'were') + ' put out on a drop of blood.', G(d.out, 'put out through the gate', 'was', 'were') + ' never at risk of anything.', G(d.out, 'put out through the gate', 'had a fever, or had been near somebody who did.', 'had a fever, or had been near somebody who did.'), G(d.out, 'put out through the gate', 'was', 'were') + ' never sick.');
  if (d.shot) L.push(G(d.shot, 'shot at the gate', 'had', 'had') + ' come home to be let in.');
  if (d.coldnight) add2(`${cap(d.coldnight)} spent a night in the cold room for nothing that could be learned there.`, `${cap(d.coldnight)} spent a night in the cold room beside the one thing that was dangerous.`, `${cap(d.coldnight)} spent a night at two degrees beside a dead animal for a fever.`, `${cap(d.coldnight)} spent a night at two degrees beside a dead animal for a lie.`);
  if (d.pen) L.push('The ones barred in the pump house were barred on what the wire said.');
  if (d.lied) L.push('What the hall was told, and what the sheet said, are in the log side by side.');
  if (d.alone && k === 'fever') L.push('The ones who died alone in the pods died of the fever and the dark.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was burned, put out or held down on account of it.';
}
B('after', { id: 'bt.truth', tone: 'quiet', title: 'What Was in the Blood',
  setup: s => { const t = T(s), fk = byK(t, t.faker), tg = byK(t, t.target);
    return Object.assign(crew(s), { toll: Math.max(0, t.toll), pct: num(Math.round(10 * (t.tests ? t.right / t.tests : t.truth.acc))), faker: fk ? nm(s, fk) : null, fakerFirst: fk ? firstOf(s, fk) : 'that one', target: tg ? nm(s, tg) : 'one of the six', self: t.how === 'self', why: WHY[t.why] || WHY.work }); },
  text: (s, c) => { const t = T(s); return `${WAS[t.truth.is](t, c)}\n\n${who2(s, t)}\n\n${reckon(s, t)}${c.toll ? ` In all it cost ${num(c.toll)} colonist${c.toll === 1 ? '' : 's'}.` : ''}`; },
  choices: [
    { label: 'Enter it in the record as it happened, with the list', note: 'Everyone who held somebody down, barred a door or lit the pyre has to live beside the page.',
      out: { text: 'The list goes into the colony record as it stood on the mess door, with what each name turned out to be written beside it in your hand. People read it. Some stop greeting you, and one or two begin.', fx: s => ({ morale: -2, chron: 'The colony wrote the blood-test list into the record, with the names.' }) } },
    { label: 'Enter it in the record as a sickness from the cut, met and ended', dark: true, note: 'The colony gets an account it can live beside, and the names on the list are left out of it.', info: [['yield', 'Morale']],
      out: { text: 'The record says that a sickness came back from the far cut in the first years and was contained. The entry is three lines long, and no colonist is named in it. It is the version the children will be taught.',
        fx: s => ({ morale: 3, stain: ['bt_record', 1], chron: 'The record says that a sickness from the cut was contained.' }) } },
  ] });

/* bt_meat, bt_informer, bt_door, bt_tied, bt_gun and bt_gate have had no option since the cut to three (2026-11-21): their phrases stay
   for saved games that already carry the stain. */
Object.assign(LF.DEEDS || {}, {
  bt_pen: 'the people barred in the pump house on a drop of blood', bt_meat: 'the sick animal served at the long table', bt_lie: 'what the hall was told about the blood test',
  bt_informer: 'the bunkmate set to report on the bunk beside', bt_held: 'the one held face down on a mess table for the needle', bt_door: 'the punishment detail set on the cold-room door',
  bt_cold: 'the night in the cold room beside what came back', bt_burned: 'the ones burned at the wire for failing the blood test', bt_out: 'the ones put out through the gate for the blood test',
  bt_tied: 'the one left strapped to a bunk frame', bt_gun: 'the blood drawn under a rifle', bt_gate: 'the volley over the heads of the ones at the gate', bt_shot: 'the ones shot at the gate, asking to come home',
  bt_record: 'the three lines in the record about the sickness from the cut',
});

LF.TAGS['bt.cart'] = ['cautious open', 'cautious order', 'severe closed'];
LF.TAGS['bt.wrong'] = ['mercy open', 'closed order', 'free'];
LF.TAGS['bt.test'] = ['open order', 'cautious', 'severe order'];
LF.TAGS['bt.refuse'] = ['free mercy', 'severe order', 'open'];
LF.TAGS['bt.cold'] = ['bold open', 'cautious', 'severe bold'];
LF.TAGS['bt.second'] = ['open', 'severe order', 'cautious order'];
LF.TAGS['bt.fight'] = ['order mercy', 'cautious order', 'severe free'];
LF.TAGS['bt.officer'] = ['open', 'cautious order', 'closed'];
LF.TAGS['bt.night'] = ['severe bold', 'severe order', 'cautious order', 'mercy open'];
LF.TAGS['bt.out'] = ['mercy open', 'cautious', 'severe bold'];
LF.TAGS['bt.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['bt.cart'] === undefined ? [] : [{ k: 'cut', card: 'bt.cart', name: 'The far cut', kind: 'mark', dist: 'near', danger: t.end ? 1 : 2,
  state: t.end ? 'worked out' : 'located', known: t.what === 'body' ? 'Where the six were working when a hauler sat down complaining of the cold. There was not a mark on the body.'
    : 'Where the six were working when an animal the size of a calf walked into their camp, lay down by the fire and did not get up.' }];
/* A party the player sent to the cut (orders.js order.send, T2-5; the place is located, not visited: the six worked there,
   nobody has gone back to look). What they found points at the truth most of the time (pickK), as the cards' evidence
   does, and never shows the thing. Something still dying at the cut, or a carcass that walked off, comes home as a card:
   a bitten hand goes on the list (carrying it only under spread). The rest is a Meanwhile line. line(): a find with
   nothing to decide is a line when the return itself had nothing to decide either (LF.AWAY_QUIET). */
const line = (a, v) => { if (v) v.quiet = true; return v; };   // nothing to decide: a Meanwhile line when the return itself was quiet (js/orders.js needsCard)
const CUT = {
  spread: c => `Round the cold fire pit at the cut lie four small scavengers of this world, dead where they fed. A fifth, a little way off, was still breathing and did not shut its eyes to the lamp. ${c.lab ? `${cap(c.lab.replace(/^an? /, 'the '))} was bitten putting it out of its misery, and is on the list on the mess door by nightfall.` : 'They left it where it lay.'}`,
  dead: c => `The six shot a scavenger at the cut and left it lying by the fire pit. It is not there now. Its own prints lead off from where it lay, short and dragging, into ${c.cover}, and nothing else has been near the spot.`,
  fever: c => 'The cut sits beside standing water, and at dusk the party\'s lamps drew clouds of small biters off it. Three of the party came home hot, and were well again inside the week.',
  faking: c => 'In the ash of the six\'s fire there is a small glass vial, burned black, of the clinic\'s own kind. Nothing the six were issued for the cut came in glass.' };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'cut' || t.end) return null;
  const e = pickK(s, t, 0.05), c = { cover: LF.lex(s, 'cover'), lab: null };
  if (e === 'spread' && t.list.length < MAXLIST) { const used = t.list.map(x => x.lab); c.lab = LF.spick(s, LABS.filter(l => !used.includes(l))) || null; }
  const inf = t.truth.is === 'spread' && LF.srand(s) < 0.5;
  const fx = { survey: 4, do: s2 => { const t2 = T(s2); learn(s2, t2, 10, e); if (c.lab) add(s2, t2, { lab: c.lab, inf }); } };
  if (e === 'spread') return { title: 'Still Breathing', tone: 'pressure', scene: 'away_bt_scav', text: CUT[e](c), fx };
  if (e === 'dead') return { title: 'Where It Lay', tone: 'pressure', scene: 'away_bt_prints', text: CUT[e](c), fx };
  return line(a, { title: 'The Far Cut', tone: 'quiet', text: CUT[e](c), fx });
};
})();

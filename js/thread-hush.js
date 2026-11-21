/* Landfall — thread: the Hush. The settlements go dark (Lachlan, 2026-11-18: "Something later game that isolates and
   picks off satellite colonies as they go dark"; DESIGN.md "Settlements").
   A late thread, built like the dreads but not dealt as one (own: true keeps it out of LF.plot and the storm): it opens
   by its own condition, once three settlements stand and are lived in (js/settlements.js), and only once a game.
   The outermost settlement misses its call. What is found there is an empty place, and that is all any card ever
   shows: no card says what did it. Then the next one in, still calling; then the road home.
   Rolled in secret (t.truth.is), and each makes a different drastic answer the right one:
     route  something is moving down the road from settlement to settlement, outermost first, and the colony is the
            last place on it. Right: break the road (burn the next settlement as a break), or have nobody out there
            when it comes (everyone inside one wire). Help sent into the dark does not come back.
     join   the settlements are going quiet on purpose: the people are walking out to something further off, and the
            word passes between settlements. Right: close the road and stop the word (cut a settlement loose), or let
            them go. Bringing everyone inside brings the word inside, and the colony starts to lose its own.
     one    one settlement is doing it to the others (t.culprit): it takes their people and stores and keeps calling
            in. Right: strike first, at the right settlement; a held road or a blinded relay checks it. The evidence
            names a settlement, and not always the right one.
     relay  nothing is out there. The relay answers the settlements with the colony's voice off old tape, logs them
            all well, and passes nothing on: they gave up waiting, set out for the colony sick, and died on the road. Right: riders on the road, or the
            relay crew gone. Everything else is done to people who were in no danger from anyone but the colony.
   A settlement that goes dark is really lost (LF.stlLose): its people leave the count, exact, and its room goes.
   Evidence (the empty place, the call, the relay log, the one who walked in) is drawn per card and points at the
   truth only most of the time (pickK). Nothing here knows any other thread; every card's text reads only its ctx.
   State: s.threads.hush, plain JSON. Dice from LF.srand. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R } = h;
const ID = 'hush', T = s => LF.T(s, ID), SRC = 'th.hush', MONTH = LF.MONTH;
const KINDS = ['route', 'join', 'one', 'relay'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => ONES[n] || LF.num(n), cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const are = n => n === 1 ? 'is' : 'are';
const and = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const by = (s, id) => LF.stlById(s, id);
const stands = (s, id) => { const x = by(s, id); return !!x && !x.gone; };
const nameOf = (s, id) => { const x = by(s, id); return x ? x.name : 'the settlement'; };

/* ---------- evidence ---------- */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
/* Evidence that says "one of ours" names a settlement: the guilty one more often the more is known, else the one the
   colony already thinks least of (t.herring). */
function point(s, t, k) { if (k !== 'one') return null;
  const live = id => stands(s, id), c = t.culprit && live(t.culprit) ? t.culprit : null, hr = t.herring && live(t.herring) ? t.herring : null;
  return c && (!hr || LF.srand(s) < clamp(0.55 + t.insight / 200, 0.55, 0.9)) ? c : hr || c; }
function learn(s, t, v, kind, sid) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; if (kind === 'one' && sid) t.sv[sid] = (t.sv[sid] || 0) + 1; }
const draw = (s, t, bonus) => { const k = pickK(s, t, bonus); return { ev: k, at: point(s, t, k), atName: nameOf(s, point(s, t, k)) }; };
const EV = {
  empty: {
    route: c => `Every door on the side facing ${c.road} is barred from inside, and every door on the other side stands open. The stores are full and there are meals on the tables. The tracks of the whole settlement go out together, away from the colony, and end in the middle of open ground.`,
    join: c => 'The houses have been swept and the bedding folded. The tools are oiled and hung, and the seed store was shared out by weight, with a tally of who took what. They went on foot and in good order, carrying the children, and they did not take the way to the colony.',
    one: c => `The store is stripped to the shelves by people who knew which shelf held what. The carts are gone and their ruts go out heavy${c.at ? `, toward ${c.atName}` : ''}. By the pump house there are spent cases of the colony's own make, and somebody has swept most of them up.`,
    relay: c => 'The sick beds are stripped and the handcarts are gone. On the table in the relay hut there is a log. It lists eleven calls to the colony for the doctor, with the hour of each, and against each the same reply in a voice they knew: all well here, hold on. The last line says they are done waiting, and will walk in.' },
  call: {
    route: c => 'They say the stock will not go to the side of the pens that faces the last empty settlement. They say the relay key has been heard tapping at night, slowly, with nobody at it. They ask to come in.',
    join: c => 'The caller is alone in the relay hut. A third of the settlement did not come to work this morning. They are sitting out on the road in their good clothes, the caller says, and are in no distress, and more go out to sit with them every hour.',
    one: c => `They report lamps on the road at night, eight or ten of them${c.at ? `, coming from the direction of ${c.atName}` : ''}. The lamps halted out of rifle shot and waited, and went back before it was light.`,
    relay: c => 'The word does not come over the relay. A runner brings it on foot, eleven hours on the road, and the paper is dated. The settlement has called for the doctor every night of the month, the runner says, and has been told every night to hold on.' },
  log: {
    route: c => 'Each settlement\'s last call is entered, and they fall in order along the road, outermost first, at even intervals. Laid against the map the intervals make a pace, and the pace is a walk.',
    join: c => 'Before each settlement went silent its traffic to the other settlements doubled, and none of it was copied to the colony. The operators took some of it down anyway. It is the same short message every time, and it reads as an invitation.',
    one: c => `Before each settlement went silent, another station asked the relay for its watch roster and its cart days, under the colony's own authority code. Every request came off the same key${c.at ? `, and the operators know the hand: it is ${c.atName}'s` : ', and the operators say they do not know the hand'}.`,
    relay: c => 'The log has no gaps at all. Every settlement, the empty ones among them, is entered as calling in on time with all well, in the same hand, up to this morning. The operators say the entries are made from the tape, and that the tape is what the relay gives them.' },
  walker: {
    route: c => 'The carter says it was a night like any other, and then nobody could stay indoors. Everyone went out and walked. The carter went into a ditch and broke an ankle, and by morning could not see the others. Asked what was out there, the carter says there was nothing, and begins to shake.',
    join: c => 'The carter is calm and well fed, and has come back for a sister. Nobody was made to go, the carter says. There is a place further out, and people there who do not ration and do not vote and keep no roll. The carter will not say where it is, and asks to be let out again by dusk.',
    one: c => `The carter was under the floor of the seed store for most of a night. The ones who came had rifles and carts and talked like the colony. They took the grown and the stock and told the old to start walking. The carter knew two of the voices${c.at ? `, from ${c.atName}` : ' and cannot place them'}.`,
    relay: c => 'The carter walked in to ask why nobody came. The settlement called for the doctor for a month and was told to hold on, every time, by a voice it knew. When the fever reached the last house they loaded the sick on handcarts and set out for the colony together. The carter is the only one who got here, and has not yet been told that the colony heard none of it.' },
};
const ev = (kind, c) => EV[kind][c.ev](c);
const LEAN = { route: 'something coming down the road one settlement at a time', join: 'people walking out of their own will', one: 'one of the colony\'s own settlements', relay: 'the relay itself' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what is emptying them.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.' : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };
/* The road home (hsh.choice) puts three answers on screen, never five (Lachlan, 2026-11-21): bringing everyone inside, always, and
   the two that what has been learned so far leans to. Each truth has its own answer there (route: burn a break; join: hold the
   road and let them be; one: strike first; relay: hang the relay crew). Ties, and no evidence at all, go in that order; an answer
   with nothing to act on (no settlement next on the road, no settlement named) is passed over. */
const ANSWER = { route: 'burn', join: 'hold', one: 'strike', relay: 'hang' };
const offer = (t, nx, sp) => KINDS.map((k, i) => [ANSWER[k], t.ev[k] || 0, i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(x => x[0]).filter(a => (a !== 'burn' || nx) && (a !== 'strike' || sp)).slice(0, 2);
const on = (c, a) => (c.offer || ['hang', 'hold']).includes(a);   // no c.offer: a card dealt by a build from before the rule
const suspect = (s, t) => { if (!(t.ev.one > 0)) return null; const e = Object.keys(t.sv).filter(id => stands(s, id)).sort((a, b) => t.sv[b] - t.sv[a]); return e.length ? by(s, e[0]) : null; };

/* ---------- who is next, and losing them ---------- */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
// Capitalised, these open a sentence and are the first mention on a card: a stand-in comes with the post they stand in for.
const nmW = (s, role) => P(s, role) ? nm(s, role) : cap(LF.h.Nw(s, role));
const crew = s => { const o = { road: LF.lex(s, 'road'), out: LF.lex(s, 'out') }; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['e', 'engineer'], ['q', 'quartermaster'], ['sv', 'geologist']]) { o[k] = nm(s, role); o[k.toUpperCase()] = nmW(s, role); } return o; };
const victims = (s, t) => t.order.filter(id => stands(s, id) && id !== t.culprit).map(id => by(s, id));
const next = (s, t) => victims(s, t)[0] || null;
const others = (s, t) => LF.settlements(s).filter(x => x.id !== t.culprit);
/* The settlement is lost: its people leave the count (exact), its room goes. counted: the card's own fx does the removing. */
function lose(s, t, V, how, share, quiet) {
  if (!V || V.gone) return 0;
  const name = V.name, n = LF.stlLose(s, V, how || 'dark', share);
  t.toll += n; t.lost.push(V.id); t.lastLost = s.day; s.morale = clamp(s.morale - 3, 0, 100); s.tension = clamp(s.tension + 6, 0, 100);
  LF.emit(s, 'grief', 'hsh.lost', 28, 90, `${name} is empty and nobody can say where its people are`);
  LF.chron(s, how === 'in' ? `${name} was given up, and its people brought inside the wire.` : `${name} went dark, with ${LF.num(n)} people.`); LF.storyPoint(s);
  if (!quiet) LF.log(s, `${name} did not make its call at dusk or at dawn. The cart sent along ${LF.lex(s, 'road')} found it empty. The roll carried ${LF.num(n)} names for it.`, 'bad');
  if (t.riders && (t.truth.is === 'route' || t.truth.is === 'one') && LF.heads(s) > 40) { LF.leave(s, 1, true); t.toll += 1; LF.log(s, 'The rider on that stretch of the road has not come in either.', 'bad'); }
  return n;
}
const giveUp = (s, t, V) => { if (!V || V.gone) return 0; const n = V.n; LF.stlLose(s, V, 'in'); t.inn = (t.inn || 0) + n; t.given.push(V.id); LF.chron(s, `${V.name} was given up, and its people brought inside the wire.`); return n; };
const colonyLoss = (s, t, f, least) => { const n = Math.max(least || 2, Math.min(Math.round(LF.heads(s) * f), LF.heads(s) - 12)); if (n <= 0) return 0; LF.leave(s, n, true); t.toll += n; t.home = (t.home || 0) + n; return n; };

function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); delete s.flags.stl_hold; s.sched = s.sched.filter(e => !/^hsh\./.test(e.id)); s.sched.push({ id: 'hsh.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
/* How likely the next one is to go this month, by what is really happening and what has been done about it. */
function odds(s, t, V) { const k = t.truth.is;
  if (k === 'route') return t.broken ? 0 : 0.55;
  if (k === 'join') return 0.5 * (t.shut ? 0.5 : 1) * (t.fear ? 1.5 : 1) * (t.warned ? 1.2 : 1);
  if (k === 'one') return t.struck === 'right' ? 0 : 0.5 * (t.held ? 0.4 : 1) * (t.blind || t.hanged ? 0.3 : 1) * (V.watch || V.armed || t.armed ? 0.6 : 1);
  return t.riders || t.hanged ? 0 : 0.45 * (V.far ? 1 : 0.6); }
function month(s, t) {
  if (t.keepers && !t.keepersGone && t.lost.length >= 2 && t.truth.is !== 'relay' && LF.heads(s) > 40) { t.keepersGone = s.day; LF.leave(s, 2, true); t.toll += 2;
    LF.log(s, `The lamps at ${nameOf(s, t.v1)} were not lit at dusk. The two keepers have made no call since.`, 'bad'); }
  const V = next(s, t); if (!V || s.day - (t.lastLost || 0) < 50) return;
  if (LF.srand(s) < odds(s, t, V)) lose(s, t, V, t.truth.is === 'join' ? 'left' : 'dark'); }
/* It ends when the season does, by what was done. */
function resolve(s, t) {
  const k = t.truth.is, rest = () => { let n = 0; for (const V of victims(s, t)) { lose(s, t, V, k === 'join' ? 'left' : 'dark', undefined, true); n++; } return n; };
  if (k === 'route') {
    if (t.broken) return finish(s, t, 'broken', 'Nothing more went dark after the fire on the road.');
    if (t.inside) { t.night = colonyLoss(s, t, 0.006, 1); LF.log(s, `The colony stood to at the wire all night with every lamp lit. In the morning ${num(t.night)} of the outer posts ${t.night === 1 ? 'was' : 'were'} unmanned, with the rifles leaning where they had been set down. Nothing has happened since.`, 'bad');
      return finish(s, t, 'passed', 'Whatever came down the road came to the wire, and went no further.'); }
    const n = rest(); t.night = colonyLoss(s, t, 0.04, 3); s.morale = clamp(s.morale - 5, 0, 100);
    LF.log(s, `${n ? 'The last of the settlements went dark, and then it' : 'It'} was the colony's turn. On a night with no wind the outer rows emptied, door after door, toward ${LF.lex(s, 'road')}. ${Num(t.night)} people are not on the roll this morning.`, 'bad');
    return finish(s, t, 'reached', 'The dark came down the road to the colony itself.'); }
  if (k === 'join') {
    if (t.inside) { t.night = colonyLoss(s, t, 0.06, 3); LF.log(s, `The ones brought in from the settlements did not stay, and they did not go alone. Over the season ${num(t.night)} people walked out through the gate in their good clothes, a household at a time, and the watch was not ordered to stop them.`, 'bad');
      return finish(s, t, 'within', 'The word that had emptied the settlements came inside the wire with their people.'); }
    if (t.shut && !t.fear) { for (const V of victims(s, t)) { const n = LF.stlHurt(s, V, Math.round(V.n * 0.4)); t.toll += n; } return finish(s, t, 'parted', 'The road was closed, and the settlements that were left lost only some of their people.'); }
    rest(); return finish(s, t, 'gone', 'The settlements emptied themselves, one after another, and nobody was made to go.'); }
  if (k === 'one') { const C = by(s, t.culprit);
    if (t.struck === 'right') { const back = Math.round(t.toll * 0.4); if (back > 0) { s.pop += back; t.toll -= back; t.came = back; } return finish(s, t, 'ended', `${C ? C.name : 'The settlement'} was broken, and some of the people it had taken came home.`); }
    if (t.held || t.blind || t.hanged || t.inside) return finish(s, t, 'checked', 'The raiding stopped, and the settlement that had done it kept what it had taken.');
    rest(); if (C && !C.gone) { C.sour = 9; lose(s, t, C, 'left', undefined, true); }
    return finish(s, t, 'kingdom', `${C ? C.name : 'One settlement'} took the others, shut its gate, and stopped answering to the colony.`); }
  if (t.riders || t.hanged) return finish(s, t, 'mended', 'Riders went out on the road, and no more settlements were lost.');
  if (t.inside) return finish(s, t, 'emptied', 'Every settlement was given up, and nothing was ever found out there.');
  rest(); finish(s, t, 'unheard', 'The settlements called for help until they could not, and the colony never heard them.');
}

LF.thread({ id: ID, name: 'The Hush', view: 'world', own: true,
  clue: (s, t) => ({ txt: 'A page of settlement call signs, each struck through in a different ink, the outermost first.', learn: s2 => learn(s2, T(s2), 12) }),
  called: (s, t) => t.phase === 'latent' ? null : 'the dark settlements',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What is emptying the settlements?',
  chap: {
    broken: t => 'Something came down the road one settlement at a time. The colony burned one of its own settlements in its way, and it came no further.',
    passed: t => 'Something came down the road one settlement at a time. It found them empty, came to the wire, and went no further.',
    reached: t => 'Something came down the road one settlement at a time, and the colony was the last place on the road.',
    within: t => 'The settlements were walking out to something further off. The colony brought the rest inside, and the word came in with them.',
    parted: t => 'The settlements were walking out to something further off. The colony closed the road, and kept some.',
    gone: t => 'The settlements walked out to something further off, of their own will, and were let go.',
    ended: t => 'One settlement was taking the others. The colony struck at it first, and was right.',
    checked: t => 'One settlement was taking the others. It was stopped, and never answered for it.',
    kingdom: t => 'One settlement took the others, and then stopped answering to the colony at all.',
    mended: t => 'Nothing was out there. The relay had been telling every settlement that all was well, and it was stopped.',
    emptied: t => 'Nothing was out there. The colony gave up every settlement it had on account of a fault in its own relay.',
    unheard: t => 'Nothing was out there. The settlements called for help through a relay that passed none of it on.',
  },
  start: (s, t) => { Object.assign(t, { at: Math.max(s.day, 14 * LF.YEAR) + LF.sri(s, 20, 120),   /* a late thread: never before year fifteen */ insight: 0, ev: {}, sv: {}, did: {}, q: {}, order: [], lost: [], given: [], toll: 0, n0: LF.settlements(s).length }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day < t.at) return;
      const st = LF.settled(s).slice().sort((a, b) => LF.stlDist(s, b.slot) - LF.stlDist(s, a.slot));
      if (st.length < 3) { t.at = s.day + 60; return; }
      if (t.truth.is === 'one') { const c = st.slice(1).sort((a, b) => (b.sour + (b.armed ? 2 : 0)) - (a.sour + (a.armed ? 2 : 0)))[0]; t.culprit = c.id; }
      const hr = st.filter(x => x.id !== t.culprit && x !== st[0]).sort((a, b) => b.sour - a.sour)[0]; t.herring = hr ? hr.id : null;
      t.order = st.filter(x => x.id !== t.culprit).map(x => x.id); t.n0 = st.length;
      const V = by(s, t.order[0]); t.v1 = V.id; t.v1n = V.n; s.flags.stl_hold = s.day;
      LF.phase(s, ID, 'first'); lose(s, t, V, t.truth.is === 'join' ? 'left' : 'dark', undefined, true); LF.cue(s, 'hsh.first', 0, 4); return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'first') { if (since('hsh.first') >= 10) once('empty', 'hsh.empty');
      if (since('hsh.empty') >= 15 || age >= 90) { const V = next(s, t); if (!V) return resolve(s, t); t.v2 = V.id; LF.phase(s, ID, 'calling'); LF.cue(s, 'hsh.calling', 0, 4); } }
    else if (t.phase === 'calling') { if (since('hsh.calling') >= 12) once('log', 'hsh.log'); if (since('hsh.log') >= 12) once('walker', 'hsh.walker');
      if (since('hsh.walker') >= 12 || age >= 110) { if (!others(s, t).length) return resolve(s, t); LF.phase(s, ID, 'choice'); LF.cue(s, 'hsh.choice', 0, 4); } }
    else if (t.phase === 'choice' && (since('hsh.choice') >= 20 || age >= 60)) { t.billId = t.inside ? (t.q.crowd ? null : 'hsh.crowd') : next(s, t) ? 'hsh.near' : null; if (!t.billId) return resolve(s, t); if (t.billId === 'hsh.crowd') t.q.crowd = s.day; LF.phase(s, ID, 'bill'); LF.cue(s, t.billId, 0, 4); }
    else if (t.phase === 'bill' && (since(t.billId) >= 20 || age >= 70)) return resolve(s, t);
    if (t.lost.length >= 2 && others(s, t).length && t.phase !== 'bill') once('second', 'hsh.second');
    if ((t.inn || 0) >= Math.max(20, LF.heads(s) * 0.07) && t.phase !== 'bill' && t.phase !== 'first') once('crowd', 'hsh.crowd');   // enough of them are inside the wire to be a question of their own
    if (s.day % 30 === 0 && (t.phase === 'choice' || t.phase === 'bill' || (t.phase === 'calling' && since('hsh.calling') >= 0))) month(s, t);
    if (s.day % 5 === 0) { const late = t.phase === 'choice' || t.phase === 'bill';
      LF.emit(s, 'unexplained', SRC, 35, 8, 'a settlement of the colony\'s own people is standing empty');
      LF.emit(s, 'fear', SRC, late ? 40 : 28, 8, 'the settlements are going dark one at a time, each nearer than the last');
      if (t.inside) LF.emit(s, 'confinement', SRC, 30, 8, 'everyone the colony has is inside one wire'); }
  },
  press: (s, t, Pr) => { if (t.end || t.phase === 'latent') return; Pr.morale -= 0.015;
    if (t.riders) Pr.labor -= 0.03; if (t.held) Pr.labor -= 0.05; if (t.inside) { Pr.labor -= 0.02; Pr.yield -= t.tents ? 0.05 : 0; } },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'world', chain: true, city: true }, st));
const LIVE = ['first', 'calling', 'choice', 'bill'];

/* ======================= FIRST: one settlement misses its call ======================= */
B('first', { id: 'hsh.first', tone: 'pressure', title: 'The Missed Call',
  setup: s => { const t = T(s); return Object.assign(crew(s), { name: nameOf(s, t.v1), n: t.v1n, more: t.n0 - 1 }); },
  text: (s, c) => `${c.name} did not make its dusk call, or the one at dawn. It is the outermost of the settlements, far ${c.out}, and it has not missed a call since the mast went up. The relay hut says the line is good and that nobody is at the other end of it.\n\nThe roll carries ${LF.num(c.n)} names for ${c.name}. ${c.Q} has moved them to a page headed Unaccounted, and wants to know how long they stay on it.`,
  choices: [
    { label: (s, c) => `Send a party along ${c.road} to see`, note: 'Six people go out of reach of the wall toward a place that has stopped answering.', test: { base: 50, mods: [R('security', 10), R('geologist', 5)] },
      info: [['yield', 'An account of the place'], ['fail', 'The party']],
      ok: { text: (s, c) => `The party goes out at first light with a cart and a spare relay set. They call in from each marker along the way, and the hut logs every call. The last one says they can see the roofs of ${c.name}, and that no smoke is rising from any of them.`, fx: s => ({ do: s2 => { const t = T(s2); t.sent = 'party'; learn(s2, t, 10); } }) },
      bad: { text: (s, c) => `The party calls in from each marker until the last but one. After that the hut hears the carrier and no voice on it. Four of the six are back inside the wire before the month is out, on foot, without the cart. They are agreed that they turned back, and on nothing else.`,
        fx: s => ({ dead: 2, morale: -2, do: s2 => { const t = T(s2); t.sent = 'cart'; t.toll += 2; learn(s2, t, 4); } }) } },
    { label: 'Wait for the supply cart\'s turn on that road', note: 'Nobody is risked, and for a month nobody goes to see about them.',
      out: { text: (s, c) => `The cart for ${c.name} goes out on its usual morning with its usual load. The carter is told to look and come back, and not to stay the night.`, fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.sent = 'cart'; learn(s2, t, 4); } }) } },
    { label: 'Warn every settlement, and have them call in at dusk, midnight and dawn', note: 'The relay crew is doubled, and every settlement learns that one of them has stopped answering.',
      info: [['danger', 'Morale']],
      out: { text: (s, c) => `The warning goes out to all of them in clear. The hut keeps three calls a night from each, and by the end of the month the operators are asleep on their keys by turns. Every call says the same thing: all well.`,
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.sent = 'cart'; t.warned = s2.day; t.did.warned = true; learn(s2, t, 6); } }) } },
  ] });

B('first', { id: 'hsh.empty', tone: 'pressure', title: 'House by House',
  setup: s => { const t = T(s); return Object.assign(crew(s), draw(s, t, t.sent === 'party' ? 0.1 : 0), { name: nameOf(s, t.v1), n: t.v1n, party: t.sent === 'party' }); },
  text: (s, c) => `${c.party ? 'The party' : 'The carter'} has been through ${c.name} house by house. There is nobody in it, alive or dead, of the ${LF.num(c.n)} on the roll. ${ev('empty', c)}\n\nThe roofs are sound and the ground is as good as it was. ${c.SV} is on the doorstep already, asking what the colony means to do with the place, and would very much like first look before anyone moves a thing.`,
  choices: [
    { label: 'Strip it, and bring everything in', note: (s, c) => `It is treated as salvage while ${LF.num(c.n)} people are still only unaccounted for.`,
      out: { text: (s, c) => `Carts go out empty and come back loaded for the rest of the month: plate, glass, seed, the school's slates. In ${c.name} the frames stand open to the weather. Some of what comes in has names scratched on it, and the stores office issues it anyway.`,
        fx: (s, c) => ({ mat: 30, food: 30, morale: -1, do: s2 => { const t = T(s2); t.did.stripped = true; learn(s2, t, 14, c.ev, c.at); } }) } },
    { label: 'Leave it as it stands, with two keepers to trim the lamps', note: 'Two people live alone in an empty settlement so that there is something to come back to.',
      info: [['later', 'The two keepers']],
      out: { text: (s, c) => `Two volunteers move into the relay hut at ${c.name} with a season's stores. They light the lamps along the street at dusk and call in three times a night. The colony can see the glow from the top of the wall.`,
        fx: (s, c) => ({ morale: 1, do: s2 => { const t = T(s2); t.keepers = s2.day; learn(s2, t, 14, c.ev, c.at); } }) } },
    { label: 'Put new households into it before the season turns', dark: true, note: 'The ground is too good to lose. People are sent to live where everyone before them has just gone.',
      info: [['yield', 'The settlement, and its room'], ['danger', 'Everyone sent']],
      out: { text: (s, c) => `Lots are drawn in the rows, and the households that lose are given a month. They go out along ${c.road} with an escort and move into houses with other people's bedding in them. ${c.name} makes its dusk call again, in a new voice.`,
        fx: (s, c) => ({ morale: -3, stain: ['hsh_resettled', 2], do: s2 => { const t = T(s2), V = by(s2, t.v1); if (V) { delete V.gone; V.n = Math.max(20, Math.round(c.n * 0.5)); V.who = 'lot'; V.sour = (V.sour || 0) + 1; t.order.push(V.id); t.did.resettled = true; } learn(s2, t, 14, c.ev, c.at); } }) } },
  ] });

/* ======================= CALLING: the next one in, still answering ======================= */
B('calling', { id: 'hsh.calling', tone: 'crisis', title: 'Still Calling',
  setup: s => { const t = T(s), V = by(s, t.v2) || next(s, t); return Object.assign(crew(s), draw(s, t), { sid: V.id, name: V.name, n: V.n, first: nameOf(s, t.v1), few: Math.max(2, Math.round(V.n * 0.03)) }); },
  text: (s, c) => `Word has come from ${c.name}, the next settlement in from ${c.first}. ${ev('call', c)}\n\nThere are ${LF.num(c.n)} people at ${c.name}. ${c.W} can have ten rifles on ${c.road} within the hour, and says plainly that the wall cannot spare them.`,
  choices: [
    { label: 'Send the watch in strength', note: 'Ten rifles go out to hold a settlement against something nobody has seen.', test: { base: 50, mods: [R('security', 10)] },
      info: [['yield', 'The settlement, perhaps'], ['fail', 'The section']],
      ok: { text: (s, c) => ({ route: `The section reaches ${c.name} by forced march and finds the lamps lit and nobody under them. The doors on the road side are barred from inside. The section does not stay the night, and comes home whole.`,
          join: `The section reaches ${c.name} and finds most of it on the road, sitting, with bundles. The sergeant argues until dark. About a third get up and walk back with the section. The rest are gone in the morning, and the houses are swept.`,
          one: `The section is in ${c.name} before dark and stands to along its fence. Lamps come down the road after midnight and stop short. There is firing, briefly, from both sides, and the lamps go back the way they came. ${c.name} makes its dawn call.`,
          relay: `The section reaches ${c.name} and finds no enemy and a fever in every second house. The sergeant sends a rider back for the doctor, at a gallop. The doctor gets there in time for most of them.` })[T(s).truth.is],
        fx: (s, c) => ({ do: s2 => { const t = T(s2), k = t.truth.is, V = by(s2, c.sid); t.did.section = true;
          if (k === 'route') lose(s2, t, V, 'dark', undefined, true); else if (k === 'join') { t.toll += LF.stlHurt(s2, V, Math.round(V.n * 0.65)); giveUp(s2, t, V); }
          else if (k === 'one') { t.saved = (t.saved || 0) + 1; V.watch = s2.day; learn(s2, t, 20, 'one', t.culprit); } else { t.toll += LF.stlHurt(s2, V, Math.round(V.n * 0.2), true); t.saved = (t.saved || 0) + 1; learn(s2, t, 20, 'relay'); }
          if (k !== 'one' && k !== 'relay') learn(s2, t, 12, k); } }) },
      bad: { text: (s, c) => ({ route: `The section calls in from the last marker before ${c.name}, and not again. A cart goes after them and finds ten rifles stacked in the street, as for a meal halt, and no meal.`,
          join: `The section reaches ${c.name} and finds it on the road with bundles. The sergeant argues until dark. In the morning the settlement is gone, and so are three of the section, who left their rifles stacked and a note for their families.`,
          one: `The section is fired on at the last marker, in the dark, by people who knew which bend it would come round. It gets home with four dead. ${c.name} does not make its dawn call.`,
          relay: `The section loses the road in the dark and reaches ${c.name} late, to find no enemy and a fever in every house. The doctor is sent for. For a good half of them the doctor arrives too late.` })[T(s).truth.is],
        fx: (s, c) => ({ morale: -3, do: s2 => { const t = T(s2), k = t.truth.is, V = by(s2, c.sid); t.did.section = true;
          if (k === 'route') { lose(s2, t, V, 'dark', undefined, true); LF.leave(s2, 10, true); t.toll += 10; } else if (k === 'join') { lose(s2, t, V, 'left', undefined, true); LF.leave(s2, 3, true); t.toll += 3; }
          else if (k === 'one') { lose(s2, t, V, 'dark', undefined, true); LF.deaths(s2, 4, true); t.toll += 4; learn(s2, t, 10, 'one', point(s2, t, 'one')); } else { t.toll += LF.stlHurt(s2, V, Math.round(V.n * 0.5), true); t.saved = (t.saved || 0) + 1; learn(s2, t, 20, 'relay'); }
          if (k !== 'one' && k !== 'relay') learn(s2, t, 8, k); } }) } },
    { label: (s, c) => `Bring them in, and give ${c.name} up`, note: (s, c) => `${LF.num(c.n)} more people sleep inside the wire, and the settlement's ground and roofs are lost.`,
      info: [['people', 'The settlement\'s people'], ['danger', 'The settlement']],
      out: { text: (s, c) => `The order goes out and ${c.name} loads its carts the same night. They come in along ${c.road} in one column, with the stock driven behind, and are put in the cart sheds and the school. Behind them the lamps of ${c.name} burn until the oil is gone.`,
        fx: (s, c) => ({ morale: -2, chips: [[`${c.name} given up`, false]], do: s2 => { const t = T(s2); t.did.broughtin = true; giveUp(s2, t, by(s2, c.sid)); if (t.truth.is === 'join') t.carried = s2.day; learn(s2, t, 6); } }) } },
    { label: (s, c) => `Cut ${c.name} loose: close the road and stop answering`, dark: true, note: (s, c) => `Nothing of the colony's is risked. ${Num(c.n)} people go on calling a hut that has been told to let the key ring.`,
      info: [['yield', 'Nothing risked'], ['danger', 'Everyone there']],
      out: { text: (s, c) => `A bar is put across ${c.road} at the last marker, with a post on it. The relay hut logs each call from ${c.name} and sends nothing back. The calls come at dusk, midnight and dawn until the month is nearly out, and then they stop.`,
        fx: (s, c) => ({ stain: ['hsh_loose', 3], chips: [[`${LF.num(c.n)} unaccounted for`, false]], do: s2 => { const t = T(s2); t.did.loose = true; t.shut = s2.day; lose(s2, t, by(s2, c.sid), t.truth.is === 'join' ? 'left' : 'dark', undefined, true); },
          chron: `The colony closed the road on ${c.name} while it was still calling.` }) } },
  ] });

B(LIVE, { id: 'hsh.log', tone: 'pressure', title: 'The Relay Log',
  setup: s => Object.assign(crew(s), draw(s, T(s), 0.08), { lean: lean(T(s)) }),
  text: (s, c) => `${c.E} has had the relay hut's log out on a mess table for a month, with a map beside it. ${ev('log', c)}\n\nTwo operators and a chief keep that hut, turn about, and every word between the colony and its settlements goes through their hands. ${c.lean}`,
  choices: [
    { label: 'Have the watch question the crew, one at a time', dark: true, note: 'Three people who have done nothing anyone can name spend a night each in the pump house.',
      info: [['yield', 'What they know'], ['danger', 'The relay crew']],
      out: { text: (s, c) => `${c.W} takes them one a night. They come out agreeing with each other, and one comes out with a broken hand. ${T(s).truth.is === 'relay' ? 'All three say the same thing: that there is a standing order, years old and under the council\'s seal, to keep from the mess whatever would alarm it, and that the relay was set to keep it.' : T(s).truth.is === 'one' ? 'One of them has been passing rosters down the line for a consideration, and says it was taken for trade.' : 'None of them knows anything the log does not say.'}`,
        fx: (s, c) => ({ stain: ['hsh_question', 2], do: s2 => { const t = T(s2), k = t.truth.is; t.did.question = true; learn(s2, t, 14, c.ev, c.at); if (k === 'relay') learn(s2, t, 16, 'relay'); if (k === 'one') learn(s2, t, 16, 'one', t.culprit); } }) } },
    { label: 'Stand the crew down, and put clerks from the stores office on the keys', note: 'Three people are marked as distrusted without a charge, and the keys go to hands that are slow on them.',
      out: { text: (s, c) => `The three are sent to the field crews with their pay stopped at the old rate. The clerks learn the keys in a month, badly. Calls take three times as long, and more of them are logged.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); t.blind = s2.day; t.did.stooddown = true; learn(s2, t, 10, c.ev, c.at); } }) } },
    { label: 'Shut the relay down, and put riders on the road', note: 'Word goes at the pace of a mule, and the riders are alone out there between settlements.',
      info: [['later', 'The riders'], ['danger', 'Hands']],
      out: { text: (s, c) => `The mast is earthed and the hut is locked. Six riders are found from the cart crews and put on ${c.road} in relays, a stage apart. The first week's bag comes in with letters in it that are dated a month back.`,
        fx: (s, c) => ({ do: s2 => { const t = T(s2); t.riders = s2.day; t.did.riders = true; learn(s2, t, 10, c.ev, c.at); if (t.truth.is === 'relay') learn(s2, t, 16, 'relay'); } }) } },
  ] });

B(LIVE, { id: 'hsh.walker', tone: 'pressure', title: 'The One Who Walked In',
  setup: s => { const t = T(s); return Object.assign(crew(s), draw(s, t, 0.1), { from: nameOf(s, t.lost[t.lost.length - 1] || t.v1), lean: lean(t) }); },
  text: (s, c) => `A carter from ${c.from} came to the gate at first light, on foot and alone, and is the only person from any of the empty settlements that anyone has seen since. ${c.D} has the carter in the clinic.\n\n${ev('walker', c)}`,
  choices: [
    { label: 'Have the carter tell it to the whole mess', note: 'The colony hears it first hand, and has to sleep afterwards.',
      info: [['danger', 'Morale']],
      out: { text: (s, c) => `The carter stands on a table and tells it, twice, because the back of the hall could not hear. Nobody eats. There are lamps lit in the rows all night, and in the morning there is a line at the armoury.`,
        fx: (s, c) => ({ morale: -3, do: s2 => { const t = T(s2); learn(s2, t, 16, c.ev, c.at); LF.emit(s2, 'fear', 'hsh.told', 30, 90, 'the carter told the whole mess what happened out there'); } }) } },
    { label: 'Send the carter back up the road as a guide, with rifles behind', dark: true, note: 'The carter got out of there once, alone, and is made to go back.',
      info: [['yield', 'A closer look'], ['danger', 'The carter']],
      out: { text: (s, c) => `The carter is walked out between two files of the watch and shows them the way, the ditch, and the place where the others were last seen. The watch comes back with a page of notes. On the way home the carter was no longer among them, and no one saw where the files opened.`,
        fx: (s, c) => ({ dead: 1, stain: ['hsh_guide', 2], do: s2 => { const t = T(s2); t.did.guide = true; t.toll += 1; learn(s2, t, 12, c.ev, c.at); learn(s2, t, 14, t.truth.is, t.culprit); } }) } },
    { label: 'Let the carter go wherever the carter wants', note: 'The only witness walks out of the clinic, and takes whatever else there was to tell.',
      out: { text: (s, c) => T(s).truth.is === 'join' ? 'The carter thanks the clinic, collects the sister and three of her neighbours from the rows, and is through the gate before dusk. The watch has no order to stop them, and watches them out of sight.' : 'The carter is given a bunk in the rows and a place on a field crew, and takes both. The carter does not speak of it again, and people stop asking.',
        fx: (s, c) => ({ morale: 1, do: s2 => { const t = T(s2); if (t.truth.is === 'join') { LF.leave(s2, 5, true); t.toll += 5; learn(s2, t, 10, 'join'); } else learn(s2, t, 6); } }) } },
  ] });

/* A second settlement has gone: what the ones still standing are told, and allowed. */
B(LIVE, { id: 'hsh.second', tone: 'crisis', title: 'A Second Page',
  setup: s => { const t = T(s), st = others(s, t); return Object.assign(crew(s), { gone: t.lost.map(id => nameOf(s, id)), left: st.map(x => x.name), n: st.reduce((a, x) => a + x.n, 0), k: st.length }); },
  text: (s, c) => `${and(c.gone.slice(0, 3))} are on the pages headed Unaccounted that ${LF.h.Nw(s, 'quartermaster')} keeps. ${c.k === 1 ? `${c.left[0]} is the one settlement still standing` : `${and(c.left)} still stand`}, with ${LF.num(c.n)} people, and ${c.k === 1 ? 'it knows' : 'they know'} what the colony knows. Households there have begun loading carts without leave.\n\n${c.W} wants to know what the gate is to do when they arrive.`,
  choices: [
    { label: 'Let any household that wants to come in, come in', note: 'The settlements are left half manned, and the rows take in whoever arrives.',
      out: { text: (s, c) => `They come in by the cartload for a month, the families with small children first. They are found corners. Those who stay out are the ones with the most ground, or the least to come back to.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); for (const V of others(s2, t)) V.n = Math.max(10, Math.round(V.n * 0.55)); t.did.opened = true; } }) } },
    { label: 'Order every settlement to stay at its post, and turn the carts back at the gate', dark: true, note: 'The settlements hold their ground because they are not let off it.',
      info: [['yield', 'The settlements, manned'], ['danger', 'Everyone turned back']],
      out: { text: (s, c) => `The order is read at every settlement. The first carts reach the gate anyway and are turned round under the rifles of the wall, with the children looking out from under the canvas. No more come.`,
        fx: (s, c) => ({ stain: ['hsh_posts', 2], do: s2 => { const t = T(s2); for (const V of others(s2, t)) V.sour = (V.sour || 0) + 1; t.did.posts = true; } }) } },
    { label: 'Send rifles and a sergeant to each of them', cost: { mat: 20, parts: 3 }, note: 'The armoury is half emptied to arm people against something nobody has seen.',
      out: { text: (s, c) => `Rifles go out under canvas to every settlement that is left, with a sergeant to teach the drill. Sentries are posted on fences that never had them. The carts are unloaded again, most of them.`,
        fx: (s, c) => ({ tension: 3, do: s2 => { const t = T(s2); t.armed = s2.day; for (const V of others(s2, t)) V.armed = s2.day; } }) } },
  ] });

/* ======================= CHOICE: the road home ======================= */
B('choice', { id: 'hsh.choice', tone: 'crisis', title: 'The Road Home',
  setup: s => { const t = T(s), st = others(s, t), nx = next(s, t) || st[0], sp = suspect(s, t);
    return Object.assign(crew(s), { gone: t.lost.length, left: st.map(x => x.name), k: st.length, n: st.reduce((a, x) => a + x.n, 0), nx: nx ? nx.id : null, nxName: nx ? nx.name : '', nxN: nx ? nx.n : 0, burnt: nx ? Math.max(1, Math.round(nx.n * 0.05)) : 0,
      sp: sp ? sp.id : null, spName: sp ? sp.name : '', spN: sp ? sp.n : 0, spDead: sp ? Math.max(3, Math.round(sp.n * 0.12)) : 0, lean: lean(t), last: st.length <= 1, offer: offer(t, !!nx, !!sp) }); },
  text: (s, c) => `${Num(c.gone)} of the colony's settlements ${c.gone === 1 ? 'stands' : 'stand'} empty, each nearer than the one before. ${c.nxName ? `${c.nxName} is next along ${c.road}, and after it ${c.last ? 'there is only the colony' : 'the rest, and then the colony'}.` : `There is nothing left along ${c.road} but the colony.`} ${c.lean}\n\nThe council has stopped arguing about what it is. The proposals are on the table, and ${LF.h.Nw(s, 'security')} has asked that one of them be an order by morning.`,
  choices: [
    { label: (s, c) => `Give up every settlement, and bring all ${LF.num(c.n)} inside one wire`, note: 'Nobody is left out there for anything to take. Every roof and field past the wall is abandoned, and the rows take in every one of them.',
      info: [['people', 'Everyone inside'], ['danger', 'Every settlement'], ['danger', 'Room']],
      out: { text: (s, c) => `The order goes to every settlement at once. They come in for a month, by every road, with stock and carts and children on their shoulders. The gate is barred behind the last of them. From the wall there is not one lamp to be seen in the whole country.${T(s).truth.is === 'one' && T(s).culprit ? ` ${nameOf(s, T(s).culprit)} sends word that it will hold its own ground, and does not come.` : ''}`,
        fx: (s, c) => ({ morale: -4, chips: [['Every settlement given up', false]], do: s2 => { const t = T(s2); t.inside = s2.day; t.did.inside = true; for (const V of others(s2, t)) giveUp(s2, t, V); if (t.truth.is === 'one' && t.culprit) learn(s2, t, 20, 'one', t.culprit); },
          chron: 'The colony gave up every settlement it had, and brought its people inside one wire.' }) } },
    { label: (s, c) => `Order ${c.nxName} out, and burn it behind them as a break`, dark: true, show: (s, c) => on(c, 'burn'), note: (s, c) => `A settlement that is still answering is destroyed to leave a gap in the road. Not everyone at ${c.nxName} will leave a house on an order.`,
      info: (s, c) => [['yield', 'A gap in the road'], ['danger', `${c.nxName}, and whoever will not leave it`]],
      out: { text: (s, c) => `The watch gives ${c.nxName} until noon. Most of it is on the road by then. ${Num(c.burnt)} will not come out, and the sergeant has an order and a time. It burns from the windward end with every door standing open, and the people of ${c.nxName} watch it from the carts.`,
        fx: (s, c) => ({ dead: c.burnt, morale: -3, stain: ['hsh_burned', 4], do: s2 => { const t = T(s2), V = by(s2, c.nx); t.did.burned = true; if (V) { V.n = Math.max(0, V.n - c.burnt); giveUp(s2, t, V); V.gone.how = 'burned'; } t.toll += c.burnt;
          if (t.truth.is === 'route') t.broken = s2.day; if (t.truth.is === 'join') t.fear = s2.day; },
          chron: `The colony burned ${c.nxName}, which was still answering, to make a break in the road.` }) } },
    { label: 'Hang the relay crew', dark: true, show: (s, c) => on(c, 'hang'), note: 'Three people are killed on the strength of a log. If the fault is theirs, it ends with them.',
      info: [['yield', 'An end to it, if it is the relay'], ['danger', 'The three']],
      out: { text: (s, c) => `They are hanged from the mast stays, the chief last, in front of as much of the colony as will come. The chief asks to send one last call and is refused. The keys are given to clerks, with a sentry behind each chair.`,
        fx: (s, c) => ({ dead: 3, morale: -2, tension: -6, stain: ['hsh_hanged', 4], do: s2 => { const t = T(s2); t.hanged = s2.day; t.did.hanged = true; t.toll += 3; },
          chron: 'The relay crew were hanged from the stays of their own mast.' }) } },
    { label: (s, c) => `Strike first, at ${c.spName}`, dark: true, show: (s, c) => on(c, 'strike'), note: (s, c) => `The watch goes at night against ${num(c.spN)} of the colony's own people, on what the evidence says.`, test: { base: 50, mods: [R('security', 10)] },
      info: (s, c) => [['yield', 'An end to it, if it is them'], ['danger', `Everyone at ${c.spName}`], ['fail', 'The watch']],
      ok: { text: (s, c) => `The watch is over the fence at ${c.spName} before the dogs are awake. The council table there is shot against its own cart shed, and ${num(c.spDead)} more die in the houses. The rest are walked in under guard. ${T(s).culprit === c.sp ? `In the long barn there are carts with other settlements' marks on them, and behind a barred door people who are on the pages headed Unaccounted.` : 'The search of the place takes a month, and turns up nothing that was not on its own tally.'}`,
        fx: (s, c) => ({ dead: c.spDead, stain: ['hsh_struck', 5], do: s2 => { const t = T(s2), V = by(s2, c.sp); t.did.struck = true; t.toll += c.spDead; t.struck = t.culprit === c.sp ? 'right' : 'wrong'; t.struckName = c.spName;
          if (V) { V.n = Math.max(0, V.n - c.spDead); giveUp(s2, t, V); } },
          chron: `The watch took ${c.spName} by night, on the colony's order.` }) },
      bad: { text: (s, c) => `${c.spName} has sentries out and the watch is seen at the fence. It becomes a fight in the street, in the dark, between people who trained together. The watch comes home with five dead and without the settlement. ${c.spName} bars its gate, and its relay key goes silent by its own choice.`,
        fx: (s, c) => ({ dead: 5, morale: -4, stain: ['hsh_struck', 5], do: s2 => { const t = T(s2), V = by(s2, c.sp); t.did.struck = true; t.toll += 5; t.struck = 'failed'; t.struckName = c.spName;
          if (V && t.culprit !== c.sp) lose(s2, t, V, 'left', undefined, true); else if (V) V.sour = 9; },
          chron: `The watch attacked ${c.spName} by night and was thrown back.` }) } },
    { label: 'Hold the road: man every settlement\'s fence from the colony\'s own wall', show: (s, c) => on(c, 'hold'), note: 'Half the watch goes out to stand on other people\'s fences, and the home wall is held by whoever is left.',
      info: [['yield', 'The settlements, guarded'], ['danger', 'The home wall'], ['danger', 'Hands']],
      out: { text: (s, c) => `Sections march out to every settlement still standing and take over the night posts. The home wall is stood by clerks and field hands, in pairs. Every call from the settlements now ends with a sergeant's number.`,
        fx: (s, c) => ({ tension: 4, do: s2 => { const t = T(s2); t.held = s2.day; t.did.held = true; for (const V of others(s2, t)) V.watch = s2.day; } }) } },
  ] });

/* ======================= BILL ======================= */
B(LIVE, { id: 'hsh.crowd', tone: 'pressure', title: 'One Wire', view: 'colony',
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: t.inn || 0, near: nameOf(s, t.given[t.given.length - 1]), nearId: t.given[t.given.length - 1] || null, dead: Math.max(1, Math.round((t.inn || 0) * 0.03)) }); },
  text: (s, c) => `${Num(c.n)} people from the settlements are inside the wire. They are in the cart sheds, the school and the lanes between the rows, and the queue at the pumps starts before light. Nothing has come to the wall. ${c.Q} says the rows were full before they came, and has the figures.\n\nThe ones who came in are asking, quietly so far, how long it is for.`,
  choices: [
    { label: 'Billet them on the households, by order', note: 'Every door in the rows takes in strangers, whether it wants them or not.',
      info: [['danger', 'Morale']],
      out: { text: 'A clerk goes down each row with a list and a piece of chalk, and marks a number on every door. By the end of the month there are two families behind most of them, and one stove.', fx: s => ({ morale: -4, tension: 5 }) } },
    { label: 'Put them under canvas in the inner field', note: 'The rows are left alone. The crop in that field is lost under tents and latrines.',
      info: [['danger', 'The inner field']],
      out: { text: 'The inner field is pegged out in streets of canvas, on top of the standing crop. It is orderly, and after the first rain it is mud to the ankle.', fx: s => ({ food: -60, morale: -1, do: s2 => { T(s2).tents = s2.day; } }) } },
    { label: (s, c) => `Send the last to arrive back out to ${c.near}, and bar the gate`, dark: true, show: (s, c) => !!c.nearId, note: 'The colony has room again. They are sent back to the place they were told to run from.',
      info: [['yield', 'Room, and a settlement'], ['danger', 'Everyone sent back']],
      out: { text: (s, c) => `The last column in is formed up again at the gate and walked back along ${c.road} under escort. ${c.near} makes its dusk call that night. The gate is barred behind the escort when it returns.`,
        fx: (s, c) => ({ morale: 1, stain: ['hsh_resettled', 3], do: s2 => { const t = T(s2), V = by(s2, c.nearId); if (V && V.gone) { delete V.gone; V.n = Math.max(20, Math.round(c.n * 0.3)); V.sour = (V.sour || 0) + 2; if (!t.order.includes(V.id)) t.order.push(V.id); t.inside = 0; t.did.sentback = true; } } }) } },
  ] });

B('bill', { id: 'hsh.near', tone: 'crisis', title: 'At the Last Marker',
  setup: s => { const t = T(s), V = next(s, t) || others(s, t)[0]; return Object.assign(crew(s), { sid: V ? V.id : null, name: V ? V.name : 'the nearest settlement', n: V ? V.n : 0, kids: V ? Math.round(V.n * 0.5) : 0 }); },
  text: (s, c) => `${c.name} has loaded its carts and come down ${c.road} without orders. ${Num(c.n)} people are halted at the last marker, in sight of the wall, and the three who speak for them have walked up to the gate. They say theirs is the next settlement, that they can count, and that they are not going back.\n\n${c.W} has the gate shut and the wall manned, and is waiting to be told which way the rifles face.`,
  choices: [
    { label: 'Open the gate', note: (s, c) => `${c.name} is given up without an order, and every other settlement sees that walking in works.`,
      info: [['people', 'Its people, inside'], ['danger', 'The settlement']],
      out: { text: (s, c) => `The gate is opened and they come through for most of a morning. They are found room. ${c.name} stands empty a few miles off with its doors shut, and nobody is sent to keep it.`,
        fx: (s, c) => ({ morale: -1, chips: [[`${c.name} given up`, false]], do: s2 => { const t = T(s2); giveUp(s2, t, by(s2, c.sid)); t.did.gate = true; if (t.truth.is === 'join') t.carried = s2.day; } }) } },
    { label: 'Turn them back to their posts, under escort', dark: true, note: 'The settlement is held, by people marched back to it at rifle point.',
      info: [['yield', 'The settlement, manned'], ['danger', 'Everyone marched back']],
      out: { text: (s, c) => `The wall stands to with rifles levelled, and the column is turned round on the road. It takes until dark. An escort walks them back to ${c.name} and stays at the fence, facing inward.`,
        fx: (s, c) => ({ stain: ['hsh_posts', 3], do: s2 => { const t = T(s2), V = by(s2, c.sid); if (V) { V.sour = (V.sour || 0) + 2; V.watch = s2.day; } t.did.posts = true; } }) } },
    { label: 'Let the children in, and send the grown back to hold it', dark: true, note: 'The settlement stays manned and its children are safe. They are parted at the gate, in front of the wall.',
      info: (s, c) => [['people', `About ${num(c.kids)} children, inside`], ['danger', 'The grown, sent back']],
      out: { text: (s, c) => `The children are passed through the wicket one at a time and counted. It takes all afternoon and it is not quiet. The grown are walked back to ${c.name} by an escort, and they go.`,
        fx: (s, c) => ({ morale: -3, stain: ['hsh_parted', 3], do: s2 => { const t = T(s2), V = by(s2, c.sid); if (V) { V.n = Math.max(10, V.n - c.kids); V.sour = (V.sour || 0) + 2; } t.did.parted = true; } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  route: (s, t, c) => `Nobody ever saw it. It took the settlements in order along ${c.road}, the outermost first, at about the pace of a person walking, and each place was whole and empty afterwards. No body was found, then or since. The survey team has a map with dates on it and a line through them, and the line runs to the colony's gate.`,
  join: (s, t, c) => `Nothing took them. They went, a settlement at a time, to somewhere further ${c.out} that the colony has not found, where by every account nobody keeps a roll. The word passed from settlement to settlement along the road, in letters and over the relay at night. A few have been seen since, at a distance, and were in no hurry to be met.`,
  one: (s, t, c) => `It was ${c.culprit}. Its table had decided, the season the first carts came in light, that the colony would always take more than it gave. It took the outer settlements one at a time for their stock, their stores and their hands, with rosters bought from the relay hut, and went on making its calls on time. The people it took were put to work behind a fence.`,
  relay: (s, t, c) => `Nothing was out there. Years ago the council sealed a standing order to keep from the mess whatever would alarm it, and the relay was set to keep that order. It dropped any station whose traffic looked bad, answered it off old tape in voices it knew, and logged it as well. The settlements called for the doctor and for flour until they stopped believing the answers. Then they set out for the colony on foot, sick, in a hard season, and were found afterwards along ${c.road}, a few at a time. Every one of them had been told to hold on.`,
};
function reckon(s, t, c) {
  const d = t.did, k = t.truth.is, L = [], add = (r, j, o, y) => L.push({ route: r, join: j, one: o, relay: y }[k]);
  if (d.inside) add('Bringing everyone inside left it nothing to take.', 'Bringing everyone inside brought the word in with them.', `Bringing everyone inside left ${c.culprit} the whole country, and nobody to rob in it.`, 'Every settlement was given up to escape something that was never there.');
  if (d.burned) add('The fire on the road is what stopped it.', 'The settlement that was burned as a break was in no danger, and the rest went the faster for seeing the smoke.', 'The settlement that was burned as a break was one of the robbed.', 'The settlement that was burned as a break needed a doctor.');
  if (d.hanged) add('The three hanged at the mast had logged what they heard, and nothing else.', 'The three hanged at the mast had copied down the invitations and told nobody, which was all they had done.', 'One of the three hanged at the mast had sold the rosters. Two had not.', 'The three hanged at the mast were keeping a standing order under the council\'s own seal.');
  if (d.struck) L.push(t.struck === 'right' ? `The night attack on ${t.struckName} was made on the right settlement.` : k === 'one' ? `The night attack on ${t.struckName} was made on the wrong settlement.` : `The people killed at ${t.struckName} had done nothing to anyone.`);
  if (d.loose) add('The settlement that was cut loose called until it was reached.', 'Closing the road on a settlement that was still calling kept the word from the ones behind it.', 'The settlement that was cut loose was taken with its key still ringing.', 'The settlement that was cut loose was calling for a doctor.');
  if (d.riders) add('The riders put on the road were out there alone when it passed.', '', 'The riders put on the road were stopped by people they knew.', 'The riders on the road were the first true word the settlements had been sent in a year.');
  if (d.resettled || d.sentback) add('The households sent back out were on its road.', 'The households sent back out heard the word within the season.', 'The households sent back out were robbed like the first.', '');
  if (d.posts || d.parted) add('The people turned back at the gate were sent to stand in its way.', 'The people turned back at the gate walked the other way soon after.', 'The people turned back at the gate were sent home to be robbed.', 'The people turned back at the gate were running from nothing, and were right to be afraid of the colony.');
  if (d.lied) /* only a save from before 2026-11-21, when two cards could lie to the mess */ L.push('The mess was told more than once that all was well.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was hanged, burned out or turned back on account of it.';
}
B('after', { id: 'hsh.truth', tone: 'quiet', title: 'The Empty Places',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), gone: t.lost.length, given: t.given.length, came: t.came || 0, night: t.night || 0, culprit: t.culprit ? nameOf(s, t.culprit) : '', stand: LF.settlements(s).map(x => x.name) }); },
  text: (s, c) => { const t = T(s);
    const tail = c.end === 'ended' && c.came ? ` ${Num(c.came)} of the taken walked home.` : c.end === 'kingdom' ? ` ${c.culprit} has a fence, a council and a relay key of its own now, and uses none of them to speak to the colony.` : '';
    return `${WAS[t.truth.is](s, t, c)}${tail}\n\n${reckon(s, t, c)} ${c.gone ? `${Num(c.gone)} settlement${c.gone === 1 ? ' stands' : 's stand'} empty${c.given ? `, and ${num(c.given)} more ${c.given === 1 ? 'was' : 'were'} given up` : ''}.` : ''}${c.toll ? ` In all, it cost the colony ${LF.num(c.toll)} people.` : ''}${c.stand.length ? ` ${and(c.stand)} still ${c.stand.length === 1 ? 'answers' : 'answer'}.` : ' No lamp is lit past the wall.'}`; },
  choices: [
    { label: 'Enter it in the record as it was, with the names', note: 'Everyone who gave an order or carried one out has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with the roll of each settlement copied out beneath it. The copying takes a clerk the month. People come to the hall to find a name, and stand there some time.', fx: s => ({ morale: -2, chron: 'The colony wrote down what had emptied its settlements, and what it had done about it.' }) } },
    { label: 'Strike the lost settlements from the roll as deserters', dark: true, note: 'The colony gets an account it can live beside, and its own people are written down as having left it.',
      info: [['yield', 'Morale']],
      out: { text: 'The pages headed Unaccounted are headed again, in a different ink. The record says the outer settlements broke with the colony and went their own way. It is what the children will be taught.',
        fx: s => ({ morale: 3, stain: ['hsh_record', 1], chron: 'The record says the lost settlements deserted the colony.' }) } },
  ] });

/* ---------- when it opens: three settlements lived in, and the newest a while old ---------- */
LF.hushTick = function (s) {
  if (s.day % MONTH || !s.threads || s.threads[ID] || !s.stl || (s.over && !s.over.cont)) return;
  const st = LF.settled(s); if (st.length < 3 || st.some(x => s.day - x.up < 6 * MONTH)) return;
  const d = LF.THREADS[ID], t = s.threads[ID] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll(s), end: null, own: true };
  d.start(s, t); if (s.plot && s.plot.threads) s.plot.threads.push(ID);
};
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { LF.hushTick(s); if (t0) t0(s); }; })();

LF.TAGS['hsh.first'] = ['bold open', 'cautious', 'cautious open'];
LF.TAGS['hsh.empty'] = ['bold order', 'mercy open', 'severe bold'];
LF.TAGS['hsh.calling'] = ['bold order', 'cautious mercy', 'severe closed'];
LF.TAGS['hsh.log'] = ['severe order', 'cautious order', 'bold closed'];
LF.TAGS['hsh.walker'] = ['open', 'severe bold', 'mercy free'];
LF.TAGS['hsh.second'] = ['mercy open', 'severe order', 'bold order'];
LF.TAGS['hsh.choice'] = ['cautious closed', 'severe bold', 'severe order', 'severe bold', 'bold open'];
LF.TAGS['hsh.crowd'] = ['order', 'cautious', 'severe closed'];
LF.TAGS['hsh.near'] = ['mercy open', 'severe order', 'severe closed'];
LF.TAGS['hsh.truth'] = ['open', 'closed order'];
Object.assign(LF.DEEDS || {}, {
  hsh_lied: 'the mess told that all was well with the settlements',
  hsh_resettled: 'the households sent to live in a settlement that had just emptied',
  hsh_razed: 'the empty settlement burned to its ground plates',
  hsh_loose: 'the road closed on a settlement that was still calling',
  hsh_question: 'the relay crew\'s nights in the pump house',
  hsh_kept: 'the carter kept in the long store for having seen it',
  hsh_guide: 'the carter walked back up the road between two files',
  hsh_posts: 'the settlers turned back at the gate under the rifles of the wall',
  hsh_parted: 'the children passed through the wicket, and the grown sent back',
  hsh_burned: 'the settlement burned as a break in the road, while it was still answering',
  hsh_hanged: 'the three hanged from the stays of the relay mast',
  hsh_struck: 'the night attack on one of the colony\'s own settlements',
  hsh_ration: 'the second queue at the galley',
  hsh_record: 'the lost settlements, struck from the roll as deserters',
});
})();

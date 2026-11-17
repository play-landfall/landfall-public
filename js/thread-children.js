/* Landfall — thread: the Children. A dread (threads.js): dealt by the plot whatever the world, the run's first one
   in the first months of year one. The colony woke its families together, so there are children on the ground
   from the first day (t.kids, part of s.pop). Something from this world gets into them and only them, in plain
   sight: they stop sleeping, draw one shape, stand at the wire at dusk, and count down to a night.
   Rolled in secret (t.truth.what): a gift (it finishes and leaves them well: anything done to them was done to
   healthy children), a clock (on the night they act as one, and the colony pays in dozens of lives unless they were
   held, drugged, cut or killed first), or a wasting (it kills them within the year after the night, whatever is
   done, unless it was cut out). The evidence is rolled at the start too and is often wrong (t.lean): scans, cultures,
   what a child says, what comes out on the table. Nothing here says which it was until the night has passed, and
   if the children were killed first, only opening the graves will ever say.
   It writes unexplained, changed, fear, suspicion, resentment and grief, and costs labour while parents will not work.
   Every card's text reads only what setup put in ctx: the UI draws the card again under its outcome. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, N, Nc, R, M, If, byPid, anyNamed } = h;
const TH = LF.th, ID = 'children', T = s => LF.T(s, ID), SRC = 'th.children';
const WHAT = ['gift', 'clock', 'wasting'];
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty'];
const num = n => W[n] || String(n), Cap = t => t.charAt(0).toUpperCase() + t.slice(1), Num = n => Cap(num(n));
const months = d => { const m = Math.max(1, Math.round(d / LF.MONTH)); return m === 1 ? 'a month' : `${num(m)} months`; };
const PLACE = { school: 'schoolroom', dorm: 'dormitory', camp: 'camp', sedated: 'schoolroom' };
const adj = (p, d) => { if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal + d, 0, 100); };
const par = (s, t) => { const p = t.parent && byPid(s, t.parent); return p && p.alive ? p : null; };
const here = p => (p && !p.away ? p : null);

/* What each kind of evidence seems to show. Each was rolled at the start and may point at the wrong truth. */
const SCAN = {
  gift: 'On the scans the tissue round the thread is in better order than it was at landfall',
  clock: 'On the scans the thread has grown toward the parts of the brain that move the body, at the same rate in every child',
  wasting: 'On the scans the brain stem is thinner where the thread runs, and thinnest in the youngest' };
const CULTURE = {
  gift: 'In the dish the thread feeds the cells beside it and takes nothing back',
  clock: 'In the dish every sample lies still for days, and then all of them move in the same second',
  wasting: 'In the dish the thread outgrows what feeds it, and then both die' };
const CUT = {
  gift: 'What came out on the table was wound round the nerve like a splint, and the nerve under it was sound',
  clock: 'What came out on the table went on moving for an hour, in time with the children in the schoolroom',
  wasting: 'What came out on the table had eaten into the nerve it was wound round' };
const CHILD = {
  gift: '"It\'s nearly done. Then we can sleep."',
  clock: '"We\'re going to open it. You won\'t have to do anything."',
  wasting: '"It says it\'s sorry. It didn\'t know we were so small."' };
/* What the party found at the ring on the children's bearing (the visit, below), as one line of the evidence. */
const RING_EV = {
  gift: 'At the ring on the children\'s bearing, everything small that lives there was asleep inside it in rows, and well',
  clock: 'At the ring on the children\'s bearing, the crust under the ground runs in threads toward the colony, and twitches all together at dusk',
  wasting: 'At the ring on the children\'s bearing, the young of everything that lives there lay dead inside it, the smallest first' };
const SURE = {
  gift: 'Every test the clinic can devise now agrees that the thread takes nothing from the children. No test says what it is for.',
  clock: 'The thread stopped growing in every child on the same day. On the scans it is finished and connected, and is doing nothing yet.',
  wasting: 'The newest scans of the youngest children show gaps where there was tissue a season ago. The gaps follow the thread.' };
function evidence(t) { const a = [], L = t.lean;
  if (t.got.scan) a.push(SCAN[L.scan] + '.');
  if (t.got.culture) a.push(CULTURE[L.culture] + '.');
  if (t.got.cut) a.push(CUT[L.cut] + '.');
  if (t.got.child) a.push(`One of the children, asked what is coming, said: ${CHILD[L.child]}`);
  if (t.got.ring) a.push(RING_EV[L.ring] + '.');
  if (t.known.sure) a.push(SURE[t.truth.what]);
  return a.length ? a.join(' ') : 'Nobody has looked closely enough to say what the thread is for.'; }

function learn(s, t, v) { t.insight = clamp(t.insight + v, 0, 100);
  if (t.insight >= 30 && !t.known.thing) { t.known.thing = s.day; LF.log(s, `${Nc(s, 'physician')} has it on a scan: something as fine as thread, wound through the brain stem of every child in the colony and of no adult.`, 'bad'); }
  if (t.insight >= 60 && !t.known.cut) { t.known.cut = s.day; LF.log(s, `${Nc(s, 'physician')} has mapped where the thread runs in the children. It could be cut out, and about one child in two would live through the cutting.`); }
  if (t.insight >= 85 && !t.known.sure) { t.known.sure = s.day; LF.log(s, SURE[t.truth.what]); } }
/* Children die, or are lost. Returns how many the colony actually lost. */
function lose(s, t, n) { n = Math.max(0, Math.min(n, t.kids)); const b = s.pop; LF.deaths(s, n); const d = b - s.pop; t.kids -= d; t.dead += d; return d; }
const adults = (s, n) => { const b = s.pop; LF.deaths(s, Math.max(0, n)); return b - s.pop; };
const unsched = s => { s.sched = s.sched.filter(e => !/^kid\./.test(e.id)); };
/* The decision and what follows it must not be starved by other threads' cards: they go to the head of the queue. */
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };

/* The children are dead by an order. n: how many; how: 'night' (the written order) or 'order' (the undated one, used by the watch). */
function cull(s, t, n, how) {
  t.n0 = n; t.kids = 0; t.out = 'culled'; t.how = how; t.fade = 0; t.sour = s.day + 200; t.flee = Math.max(2, Math.round(n * 0.3)); t.fleeNext = s.day + LF.sri(s, 8, 16);
  LF.phase(s, ID, 'bill');
  LF.emit(s, 'grief', SRC, 70, 360, 'the children are dead');
  LF.emit(s, 'resentment', SRC, 55, 400, 'the children were killed on an order');
  LF.emit(s, 'schism', SRC, 35, 300, 'the colony is split over what was done to the children');
  for (const p of s.people) if (p.alive && p.vals && p.vals.mercy === 1) adj(p, -15);
  const p = par(s, t); if (p) { adj(p, -45); p.marks.bereft = { d: s.day, txt: 'lost a child on an order you signed' }; }
  unsched(s); s.sched.push({ id: 'kid.grave', day: s.day + LF.sri(s, 8, 16) - 20 });
}
function cutAll(s, t, d) {
  t.n0 = t.kids; t.cutDead = d; t.kids = Math.max(0, t.kids - d); t.dead += d; t.hold = 'cut'; t.out = 'cut';
  LF.phase(s, ID, 'bill');
  LF.emit(s, 'grief', SRC, 55, 300, 'children died on the clinic table');
  LF.emit(s, 'resentment', SRC, 30, 300, 'the children were cut on an order');
  const p = par(s, t); if (p) { if (LF.srand(s) < d / Math.max(1, t.n0)) { adj(p, -35); p.marks.bereft = { d: s.day, txt: 'lost a child on the clinic table, on your order' }; } else adj(p, -10); }
  unsched(s);
}

/* The night the children counted down to. What happens depends on what the thread was and on where the children are. */
function theDate(s, t) {
  const w = t.truth.what, hold = t.hold; t.dated = s.day; t.held = hold; let chron;
  if (w === 'gift') {
    if (hold === 'school' && t.undated && LF.srand(s) < 0.5) {   // they all rose at once to lie down in the yard, and the watch read it as the start
      const n = lose(s, t, t.kids); s.morale = clamp(s.morale - 12, 0, 100); (LF.stain || (() => {}))(s, 'kid_killed', 6);
      LF.log(s, `On the night the number ran out every child got up at the same minute and walked out to the yard. The watch had the undated order, and used it. ${Num(n)} children are dead.`, 'bad');
      LF.chron(s, `On the night the children had counted down to, the watch used an undated order. ${Num(n)} children died.`); cull(s, t, n, 'order'); return; }
    t.out = hold === 'school' || hold === 'camp' ? 'well' : 'caged'; t.boon = true;
    LF.log(s, 'On the night the number ran out, every child in the colony lay down and slept.', 'good');
    LF.emit(s, 'hope', SRC, 45, 240, 'the children came through it well');
    if (t.out === 'caged') LF.emit(s, 'resentment', SRC, 45, 300, hold === 'dorm' ? 'the children were kept behind a bolt for nothing' : 'the children were drugged for nothing');
    chron = 'On the night the children had counted down to, they lay down and slept, and woke well.';
  } else if (w === 'clock') {
    let act = t.truth.act; if (act !== 'walk' && s.machines[act === 'water' ? 'reclaimer' : 'reactor'].lost) act = 'walk'; t.act = act; t.kd = 0; t.gone = 0;
    if (hold === 'sedated') { t.out = 'held'; t.bill = 0; }
    else if (hold === 'dorm') { t.out = 'held'; t.bill = adults(s, t.inside ? 5 : 2); }
    else if (hold === 'camp') { t.out = 'held'; t.bill = adults(s, 4); if (act === 'walk') { t.gone = t.kids; s.pop = Math.max(0, s.pop - t.kids); t.kids = 0; } }
    else { t.out = 'struck';
      let n = clamp(Math.round(s.pop * 0.3), 15, 30); if (t.watch) n = Math.round(n * 0.55); if (t.pliant) n = Math.round(n * 0.8);
      if (t.undated) { t.byOrder = lose(s, t, t.kids); t.bill = adults(s, Math.round(n * 0.3)); (LF.stain || (() => {}))(s, 'kid_killed', 4); }
      else if (act === 'walk') { t.gone = t.kids; s.pop = Math.max(0, s.pop - t.kids); t.kids = 0; t.bill = adults(s, Math.max(4, n - t.gone)); }
      else { t.kd = lose(s, t, Math.round(t.kids / (act === 'reactor' ? 2 : 4))); t.bill = t.kd + adults(s, n - t.kd);
        if (act === 'reactor') LF.hurt(s, 'reactor', -35, -12); else LF.hurt(s, 'reclaimer', -35, -10); }
      s.morale = clamp(s.morale - 10, 0, 100);
      LF.emit(s, 'grief', SRC, 65, 360, 'the night the children acted');
      LF.emit(s, 'fear', SRC, 35, 200, 'nobody can promise the children will not do it again'); }
    LF.log(s, t.out === 'struck' ? 'On the night the number ran out, the children acted as one.' : 'On the night the number ran out, the children acted as one, and were held.', 'bad');
    chron = t.out === 'struck' ? `On the night the children had counted down to, they acted as one. ${Num(t.bill + (t.byOrder || 0))} people died${t.gone ? `, and ${num(t.gone)} children walked out and were not seen again` : ''}.`
      : `On the night the children had counted down to, they acted as one, and were held${t.bill ? ` at the cost of ${num(t.bill)} lives` : ''}.`;
  } else {
    t.out = 'fading'; lose(s, t, 2); t.fade = t.kids; t.fadeNext = s.day + LF.sri(s, 5, 9);
    LF.log(s, 'On the night the number ran out, two of the youngest children did not wake.', 'bad');
    LF.emit(s, 'grief', SRC, 55, 400, 'the children are dying');
    if (hold !== 'school') LF.emit(s, 'resentment', SRC, 40, 300, 'the children spent part of their last year shut away');
    chron = 'On the night the children had counted down to, the first of them died of what was in them.';
  }
  LF.phase(s, ID, 'bill', chron); unsched(s); s.sched.push({ id: 'kid.truth', day: s.day + LF.sri(s, 6, 14) - 20 });
}

LF.thread({ id: ID, name: 'The Children', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'The smallest rooms have bolts on the outside. On the walls inside, at the height a child could reach, one shape is scratched over and over, and under it a row of tally marks that stops.', learn: s2 => learn(s2, T(s2), 25) }),
  called: (s, t) => t.known.thing || ['night', 'eve', 'bill', 'after'].includes(t.phase) ? 'the thread in the children' : null,
  roll: s => ({ what: LF.spick(s, WHAT), act: LF.spick(s, ['reactor', 'water', 'walk']) }),
  sig: t => t.truth.what === 'clock' ? `clock/${t.truth.act}` : t.truth.what,
  ask: (s, t) => t.phase === 'signs' ? 'Why have the children stopped sleeping?' : t.phase === 'bill' ? 'What was in the children?' : 'What will the children do when the number runs out?',
  chap: {
    well: t => 'What was in the children ran its course and left them well. They had been left alone.',
    caged: t => 'What was in the children was harmless. They had been shut away or drugged against it for nothing.',
    struck: t => `The children acted as one on the night they had counted down to, and ${num((t.bill || 0) + (t.byOrder || 0))} people died of it.`,
    held: t => 'The children acted as one on the night they had counted down to, and were held.',
    fading: t => 'What was in the children killed them within the year, and no lock or needle changed that.',
    cut: t => ({ gift: 'Every child was put under the knife for something that turned out to be harmless.', clock: 'Every child was put under the knife, and what was cut out of them would have killed a great many people.', wasting: 'Every child was put under the knife, and the ones who lived are alive because of it.' })[t.truth.what] + ` ${Num(t.cutDead || 0)} died on the table.`,
    culled: t => 'The colony killed its children in one night. ' + (t.known.truth ? ({ gift: 'What was in them had been harmless.', clock: 'What was in them would have killed a great many people.', wasting: 'What was in them would have killed them within the year, and nobody else.' })[t.truth.what] : 'It never learned whether it had to.'),
  },
  start: (s, t) => { const w = t.truth.what, lean = p => LF.srand(s) < p ? w : LF.spick(s, WHAT.filter(x => x !== w));
    Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), kids: LF.sri(s, 14, 22), span: LF.sri(s, 160, 200), insight: 0, known: {}, got: {}, q: {}, hold: 'school', dead: 0,
      lean: { scan: lean(0.6), culture: lean(0.6), child: lean(0.5), cut: lean(0.85) } }); },
  tick: (s, t) => {
    // The wasting takes the rest of them, one at a time, over most of a year.
    if (t.fade > 0 && s.day >= t.fadeNext) { t.fadeNext = s.day + LF.sri(s, 5, 9);
      if (lose(s, t, 1)) { t.fade = Math.min(t.fade - 1, t.kids); if (!t.fade) LF.log(s, 'The last of the children was buried today.', 'bad'); else if (t.fade % 4 === 0) LF.log(s, 'Another of the children died in the night.', 'bad'); }
      else t.fade = 0; }
    // A colony that killed its children does not forgive it: the parents go, a pair at a time.
    if (t.flee > 0 && s.day >= t.fleeNext) { t.fleeNext = s.day + LF.sri(s, 10, 20); const n = Math.min(2, t.flee, Math.max(0, s.pop - 24)); t.flee -= Math.max(1, n);
      if (n) { s.pop -= n; LF.log(s, `${n === 1 ? 'One of the parents' : 'Two of the parents'} walked out past the wire in the night, and left the bunk made.`, 'bad'); } }
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at && s.pop >= 30) { t.d0 = s.day; t.clock = s.day + t.span; t.kids = Math.min(t.kids, Math.max(6, Math.floor(s.pop * 0.3)));
      LF.phase(s, ID, 'signs'); s.signs.push({ id: 'dreams', d: s.day, src: SRC }, { id: 'watching', d: s.day, src: SRC }); LF.cue(s, 'kid.draw', 0, 6); } return; }
    if (t.phase === 'bill') {   // the children were cut or killed before the night came
      if (!t.dated && s.day >= t.clock) { t.dated = s.day;
        if (t.out === 'culled') LF.log(s, 'The night the children had been counting down to came and went. Nothing happened inside the wire.');
        else if (t.out === 'cut') { LF.log(s, 'On the night the number ran out, something happened in the dishes on the clinic shelf.'); s.sched.push({ id: 'kid.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); } }
      return; }
    const d = s.day - t.d0, cueAt = (k, id, at) => { if (d >= at && !t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 6); } };
    cueAt('wire', 'kid.wire', 20);
    if (t.phase === 'signs' && d >= 38) { LF.phase(s, ID, 'spread'); LF.cue(s, 'kid.knows', 2, 10); }
    if (t.phase !== 'signs') cueAt('thread', 'kid.thread', 62);
    if (t.phase === 'spread' && d >= 88) { LF.phase(s, ID, 'night', 'One night every child in the colony got out of bed in the same minute.'); LF.cue(s, 'kid.night', 0, 4); s.tension = clamp(s.tension + 10, 0, 100);
      if (t.lied) LF.emit(s, 'suspicion', 'kid.lied', 35, 200, 'the parents were told the children were well'); }
    if (t.phase === 'night') { if (d >= 106 && !t.q.parents) { t.q.parents = s.day; jump(s, t.hold === 'school' ? 'kid.hidden' : 'kid.lock', 10); } if (d >= 124 && !t.q.order) { t.q.order = s.day; jump(s, 'kid.order', 20); }
      if (s.day >= t.clock - 12) { LF.phase(s, ID, 'eve'); jump(s, 'kid.eve', 40); } }
    else if (t.phase === 'eve' && s.day >= t.clock && (s.used['kid.eve'] !== undefined || s.day >= t.clock + 25)) { theDate(s, t); return; }
    if (s.day % 5 === 0) { const sh = t.kids / Math.max(1, s.pop), late = t.phase === 'night' || t.phase === 'eve';
      LF.emit(s, 'unexplained', SRC, t.phase === 'signs' ? 35 : 50, 8, 'the children have stopped sleeping');
      if (t.phase !== 'signs') { LF.emit(s, 'changed', SRC, 100 * sh, 8, 'something is in every child in the colony');
        LF.emit(s, 'suspicion', SRC, late ? 35 : 25, 8, 'nobody knows what the children are going to do'); }
      if (late) { LF.emit(s, 'fear', SRC, t.hold === 'school' ? 45 : 28, 8, 'the children are counting down to something');
        if (t.hold === 'dorm') LF.emit(s, 'resentment', SRC, 35, 8, 'there are children behind a bolt'); } }
  },
  press: (s, t, P) => {
    if (t.boon && t.kids > 0 && !t.kept) { P.yield += 0.04; P.morale += 0.01; }   // they know where the water lies, and when the weather will turn
    if (t.sour && s.day < t.sour) P.labor -= 0.05;
    if (t.fade > 0) P.labor -= 0.04;
    if (t.end || t.phase === 'latent' || t.phase === 'bill') return;
    let d = t.phase === 'signs' ? 0.01 : t.phase === 'spread' ? 0.025 : 0.04;   // parents who sit up all night do not work all day
    if (t.hold === 'dorm') d += 0.015; if (t.inside) d += 0.02; if (t.jailed) d += 0.02; if (t.split) d -= 0.02; if (t.calm && s.day < t.calm) d *= 0.4;
    P.labor -= d; if (t.phase === 'night' || t.phase === 'eve') P.morale -= 0.01;
  },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));
const cast = (p, more) => Object.assign(p ? TH.ctx(p) : {}, more);

/* ======================= SIGNS ======================= */
B('signs', { id: 'kid.draw', tone: 'pressure', title: 'The Same Shape',
  setup: s => ({ kids: T(s).kids }),
  text: (s, c) => `${Nc(s, 'teacher')} lays ${num(c.kids)} sheets of paper on your table, one from every child in the schoolroom. Each has the same shape on it: a closed curve with a gap at the top, drawn without lifting the hand. None of the children has slept in four nights, and none of them is tired.\n\n"I didn't set it. Asked who showed them. Nobody, they said."`,
  choices: [
    { label: s => `${Nc(s, 'physician')} examines every child`, note: 'Their parents lose three days of work to the clinic corridor.', test: { base: 45, mods: [R('physician', 15), M('medbay', 10)] },
      ok: { text: s => `Three days of bloods, reflexes and scans, with a parent on every bench in the corridor. The children are well by every measure the clinic has. There is one finding, low in the skull on the scans, and ${N(s, 'physician')} wants better pictures before putting a name to it.`, fx: s => ({ food: -40, do: s2 => learn(s2, T(s2), 22) }) },
      bad: { text: 'Three days of bloods and reflexes, with a parent on every bench in the corridor. Nothing is found. The parents go back to the fields having been told their children are healthy, and they do not believe it.', fx: s => ({ food: -40, morale: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Keep one of them in the clinic under a lamp for a week', dark: true, note: 'A week of watching would show whether they cannot sleep or will not. The parents would be told it was a fever.', info: [['yield', 'What it is'], ['danger', 'One child, and parents who are lied to']],
      out: { text: 'The oldest of them is kept in the end room for a week, with a nurse writing down every hour. The child does not sleep, does not complain, and scratches the shape into the wall with a fingernail. The parents are told it is a fever, and bring soup to the door every evening.',
        fx: s => ({ stain: ['kid_watched', 1], do: s2 => { learn(s2, T(s2), 26); LF.emit(s2, 'suspicion', 'kid.lamp', 20, 150, 'a child was kept in the clinic and the parents were told it was a fever'); } }) } },
    { label: s => `Have ${N(s, 'teacher')} tell the parents it was set as an exercise`, dark: true, note: 'The parents sleep, on the strength of something you know to be false.', info: [['yield', 'Morale']],
      out: { text: s => `${Nc(s, 'teacher')} says it at the schoolroom door, to each parent in turn, and is believed. The fields are worked as usual. The children go on drawing it, on paper when they are given paper and with a finger on the table when they are not.`,
        fx: s => ({ morale: 2, stain: ['kid_lied', 1], do: s2 => { const t = T(s2); t.lied = s2.day; t.calm = s2.day + 60; } }) } },
    { label: 'Let them draw. They are children in a strange place', note: 'If it is the start of something, nobody is watching it start, and the parents sit up alone.',
      out: { text: 'School goes on. The children draw the shape when they have paper and go back to their sums when they are told. Their parents sit up at night watching them lie awake, and come to the fields late.', fx: s => ({ food: -30, do: s2 => learn(s2, T(s2), 2) }) } },
  ] });
B(['signs', 'spread'], { id: 'kid.wire', tone: 'pressure', title: 'Dusk',
  setup: s => { const t = T(s), off = s.people.filter(p => p.alive && !p.away && p.role && p.role !== 'security' && p.role !== 'physician'), p = off.length ? LF.spick(s, off) : anyNamed(s, ['security', 'physician']);
    if (p) t.parent = p.id; return cast(p, { kids: t.kids }); },
  text: (s, c) => `At dusk the children leave whatever they are doing and walk to the east wire. They stand along it a pace apart, facing out, and stay until full dark. ${Nc(s, 'security')} has logged it nine evenings running, and the line they face has not moved by a degree.\n\n`
    + (c.pid ? `${c.name}'s child is the third from the gate. ${c.first} asked the watch to leave that out of the log, and then came to tell you.` : 'Their parents stand a little way behind them, not knowing whether to call them in.'),
  choices: [
    { label: s => `Send ${N(s, 'xenobio')} out along the line they face`, note: 'A party walks into ground nobody has surveyed, on the word of children.', test: { base: 50, mods: [R('xenobio', 14), R('geologist', 6)] },
      ok: { text: s => `Eleven kilometres out, on the bearing, the party finds the shape: a ring of pale crust a hundred paces across, with a gap on the side nearest the colony. The ground inside it is warm. ${Nc(s, 'xenobio')} brings a piece back in a sealed jar. The children were told nothing, and that evening they stand a pace closer together.`,
        fx: s => ({ food: -30, do: s2 => { const t = T(s2); learn(s2, t, 24); t.ring = s2.day; s2.signs.push({ id: 'warmth', d: s2.day, src: SRC }); } }) },
      bad: { text: 'The party walks the bearing for two days and finds nothing it can put a name to. One of them takes a fall on the way back and does not live to be carried home. The children are at the wire when the stretcher comes in, and none of them turns round.', fx: s => ({ food: -30, pop: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Have the watch carry them in at dusk, every evening', note: 'The watch lays hands on children in front of their parents, every evening until it stops.',
      out: { text: 'They do not struggle. They are carried in stiff, set down in the mess hall, and stand facing the wall on the same bearing until full dark. After a week the watch asks to be taken off the detail, and two of the parents will not let the watch near their door.',
        fx: s => ({ morale: -2, do: s2 => { learn(s2, T(s2), 6); LF.emit(s2, 'resentment', 'kid.carry', 20, 120, 'the watch carries the children in from the wire every evening'); } }) } },
    { label: 'Let them stand, and let their parents stand with them', note: 'Forty adults give up the last hour of light every day.',
      out: { text: 'The parents bring coats. By the end of the month there is a second line behind the first, of adults who do not know what they are facing. The evening shift in the fields is not worked.', fx: s => ({ food: -50, morale: 1, do: s2 => { learn(s2, T(s2), 4); adj(par(s2, T(s2)), 8); } }) } },
    { label: 'Bolt the schoolroom at the last bell, with the children inside', dark: true, note: 'Nobody has to watch it. The children stand at a wall behind a locked door, and their parents wait outside.', info: [['yield', 'Morale'], ['danger', 'The children, and their parents']],
      out: { text: (s, c) => `The bolt goes on at the last bell. Through the window they can be seen lined up along the east wall with their faces a hand from the boards. ${c.pid ? `${c.first} waits outside the door every evening until it is opened.` : 'Some of the parents wait outside the door every evening until it is opened.'}`,
        fx: s => ({ morale: 1, stain: ['kid_dorm', 1], do: s2 => { const t = T(s2); t.shut = s2.day; adj(par(s2, t), -8); LF.emit(s2, 'resentment', 'kid.bolt', 25, 150, 'the children are bolted into the schoolroom at dusk'); } }) } },
    { label: 'Open the wire in front of one of them, on a line, and see where the child goes', dark: true, note: 'The bearing says which way they face. Only a child walking it would say where they mean to go.', info: [['yield', 'What it is'], ['danger', 'One child']],
      out: { text: 'A gap is cut at dusk in front of the smallest of them, with a line round the child\'s waist and two of the watch holding it. The child walks out at once, steadily, and is still walking when the line runs out at four hundred metres. It takes both of the watch to carry the child back. By then the others have turned to face the gap.',
        fx: s => ({ stain: ['kid_line', 1], do: s2 => { learn(s2, T(s2), 22); LF.emit(s2, 'fear', 'kid.line', 22, 120, 'a child walked out through the wire and had to be carried back'); } }) } },
  ] });

/* ======================= SPREAD ======================= */
B(['spread', 'night'], { id: 'kid.knows', tone: 'pressure', title: 'What the Child Knew',
  setup: s => { const dead = s.people.filter(p => !p.alive && !p.left && p.died !== undefined).sort((a, b) => b.died - a.died)[0]; return { kids: T(s).kids, dead: dead ? dead.name : null, df: dead ? dead.first : null }; },
  text: (s, c) => (c.dead ? `${c.dead} is dead. This morning one of the eight-year-olds told ${N(s, 'teacher')} where ${c.df} kept the letters from home, and how the first of them begins. ${c.df} never showed those letters to anyone.`
      : `This morning one of the eight-year-olds told ${N(s, 'teacher')}, word for word, what a cold-bank technician said aloud on the last night of the crossing. The technician died in orbit before any child was woken. The corridor recorder has the words, and until today nobody had played it back.`)
    + `\n\nThe children have nearly stopped talking to each other. One starts a sentence and another, across the room, ends it. ${Nc(s, 'physician')} wants every one of them under the scanner. ${Nc(s, 'xenobio')} wants spinal fluid, which means a long needle and a child held still.`,
  choices: [
    { label: 'The scanner, every child, with a parent in the room', note: 'The clinic does nothing else for a week, and whoever falls sick that week waits.', test: { base: 50, mods: [R('physician', 15), M('medbay', 12)] },
      ok: { text: s => `A week of the clinic doing nothing else. ${SCAN[T(s).lean.scan]}. ${Nc(s, 'physician')} says the pictures are good, and that reading them is guesswork.`, fx: s => ({ food: -30, morale: -1, do: s2 => { const t = T(s2); t.got.scan = s2.day; learn(s2, t, 24); } }) },
      bad: { text: 'A week of the clinic doing nothing else. The children will not lie still: each of them shifts a little, all at the same moments, and the pictures are smeared. A field hand with a burst appendix waits two days for a table and dies on it.', fx: s => ({ food: -30, pop: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: s => `The needle: ${N(s, 'xenobio')} takes fluid from six of them`, note: 'It hurts, and it is done to six children who are in no state to agree to it.', test: { base: 45, mods: [R('xenobio', 16), R('physician', 6)] },
      ok: { text: s => `Six children are held still by their own parents. None of them cries out. In the schoolroom across the yard the others put down their pencils at the moment each needle goes in. ${CULTURE[T(s).lean.culture]}.`, fx: s => ({ do: s2 => { const t = T(s2); t.got.culture = s2.day; learn(s2, t, 24); } }) },
      bad: { text: 'Six children are held still by their own parents. The fifth sample is taken badly, and that child drags one leg afterwards. The samples go grey in the dish within a day and show nothing.', fx: s => ({ morale: -2, do: s2 => { const t = T(s2); learn(s2, t, 6); adj(par(s2, t), -6); } }) } },
    { label: 'Have the child questioned alone, through the night', dark: true, note: 'A child who does not sleep can be asked for as long as the asker stays awake. The parents would not be in the room.', info: [['yield', 'What the children say is coming'], ['danger', 'One child']],
      out: { text: (s, c) => `${Nc(s, 'security')} asks, and a clerk writes it down. The child answers everything, in order, without fear, for eleven hours: things ${c.df || 'the technician'} knew, and things nobody now living was there for. Asked what is coming, the child says: ${CHILD[T(s).lean.child]} The parents are let in at dawn, and have to unclench the child's hands from the chair.`,
        fx: s => ({ stain: ['kid_questioned', 1], do: s2 => { const t = T(s2); t.got.child = s2.day; learn(s2, t, 18); LF.emit(s2, 'fear', 'kid.asked', 25, 150, 'what the child said under questioning has got round'); } }) } },
    { label: 'Put a clerk in the schoolroom, and have the children asked what the dead knew', dark: true, note: 'The dead knew where things were stowed and what was signed off unchecked. The children would be worked as a ledger, and the bereaved would hear of it.', info: [['yield', 'Spares and materials'], ['danger', 'The children, and the bereaved']],
      out: { text: 'A clerk sits in the schoolroom after the last bell with a ledger. The children say where a dead rigger stowed a crate of fittings, and which seals on the lander were signed off unchecked. Within the month the bereaved are queuing at the door with questions of their own, and some of the answers are more than they can carry.',
        fx: s => ({ parts: 5, mat: 10, morale: -2, stain: ['kid_ledger', 1], do: s2 => { learn(s2, T(s2), 8); LF.emit(s2, 'grief', 'kid.ledger', 25, 150, 'the bereaved are asking the children about their dead'); } }) } },
  ] });
B(['spread', 'night'], { id: 'kid.thread', tone: 'pressure', title: 'The Thread',
  setup: s => { const t = T(s); if (t.insight < 30) learn(s, t, 30 - t.insight); return { kids: t.kids }; },
  text: (s, c) => `${Nc(s, 'physician')} puts two scans on the light box, a child's and an adult's. In the child's there is a line as fine as a hair, wound three times round the brain stem and running up into the skull. It is in all ${num(c.kids)} children and in none of the adults.\n\n"I can't get it out of a living child without cutting what it's wound round. I could learn how. On one of them. And whoever I open first gets a coin toss, maybe."`,
  choices: [
    { label: 'Ask for a family to offer their child', note: 'The parents who agree will be the ones most afraid of their own child.', test: { base: 38, mods: [R('physician', 18), M('medbay', 12)] },
      ok: { text: s => `One couple comes forward. The surgery takes nine hours. The child wakes slow in the left hand, and sleeps that night for the first time in a season. ${CUT[T(s).lean.cut]}. In the schoolroom the other children did not draw the shape that day.`,
        fx: s => ({ do: s2 => { const t = T(s2); t.got.cut = s2.day; t.cutOne = 'ok'; learn(s2, t, 34); } }) },
      bad: { text: s => `One couple comes forward. The child dies on the table in the seventh hour. ${CUT[T(s).lean.cut]}. The parents are told what was learned and ask whether it was worth it, and nobody in the clinic answers them.`,
        fx: s => ({ pop: -1, morale: -3, do: s2 => { const t = T(s2); t.kids = Math.max(0, t.kids - 1); t.dead++; t.got.cut = s2.day; t.cutOne = 'bad'; learn(s2, t, 24); } }) } },
    { label: 'Take the ward of the colony, who has nobody on the ground to refuse', dark: true, note: 'One child\'s parents did not live through the crossing. Nobody would have to be asked.', info: [['yield', 'What it is, and how to cut it'], ['danger', 'One child']], test: { base: 46, mods: [R('physician', 18), M('medbay', 12)] },
      ok: { text: s => `The child with no family on the ground is taken from the schoolroom at the last bell. The surgery takes nine hours and the child lives, slow in the left hand. ${CUT[T(s).lean.cut]}. No consent was signed, because there was nobody to sign it. The other children stood at the clinic wall until it was over.`,
        fx: s => ({ stain: ['kid_table', 2], do: s2 => { const t = T(s2); t.got.cut = s2.day; t.cutOne = 'ok'; learn(s2, t, 34); } }) },
      bad: { text: s => `The child with no family on the ground is taken from the schoolroom at the last bell, and dies on the table in the seventh hour. ${CUT[T(s).lean.cut]}. There is nobody to tell, so the clinic staff dig the grave. The other children stood at the clinic wall until it was over, and for an hour after.`,
        fx: s => ({ pop: -1, morale: -2, stain: ['kid_table', 2], do: s2 => { const t = T(s2); t.kids = Math.max(0, t.kids - 1); t.dead++; t.got.cut = s2.day; t.cutOne = 'bad'; learn(s2, t, 24); } }) } },
    { label: 'No knife. Scan them every month and wait', note: 'If the thread is growing toward something, it gets there while the clinic takes pictures.',
      out: { text: s => `The scanner is booked for the children on the first rest day of every month. The line is a little longer in each picture. ${Nc(s, 'physician')} files them in order and has stopped showing them to the parents.`, fx: s => ({ food: -20, do: s2 => learn(s2, T(s2), 10) }) } },
    { label: 'Tell the parents the scans are clear', dark: true, note: 'Forty parents go back to work and sleep at night, on the strength of something the light box says is false.', info: [['yield', 'The fields are worked'], ['danger', 'What the parents do when they learn of it']],
      out: { text: s => `${Nc(s, 'physician')} says it in the mess hall, reading from a sheet. The parents take it the way people take good news they had stopped expecting. The evening shift is worked again, and the scans go into a locked drawer.`,
        fx: s => ({ food: 80, morale: 3, stain: ['kid_lied', 2], do: s2 => { const t = T(s2); t.lied = s2.day; t.calm = s2.day + 90; } }) } },
  ] });

/* ======================= THE BAD NIGHT ======================= */
B('night', { id: 'kid.night', tone: 'crisis', title: 'All of Them at Once',
  setup: s => { const t = T(s); return { kids: t.kids, left: months(t.clock - s.day), lied: !!t.lied }; },
  text: (s, c) => `Two hours after midnight every child in the colony got out of bed in the same minute. They walked to the yard and stood in the shape they have been drawing: ${num(c.kids)} of them in a ring, with a gap left on the east side. One of the watch tried to lift the smallest out of the line, and has a broken wrist. After an hour they went back to bed.\n\nAsked what they were doing, each gave the same answer, which was a number. ${Nc(s, 'teacher')} has heard them say a higher one. They are counting down, and it comes out in ${c.left}.${c.lied ? ' The parents have been asking, since the yard, what else they were told that was not so.' : ''}`,
  choices: [
    { label: 'School as before, and their own beds', note: 'If the number means what the watch thinks it means, everyone inside the wire is staking their life on it.',
      out: { text: 'The schoolroom opens at the usual bell. Parents take turns to sit up through the night beside their children\'s bunks, and come to the fields grey. Somebody chalks the count on the mess hall wall, unsigned, and corrects it every morning.',
        fx: s => ({ morale: -1, do: s2 => { T(s2).hold = 'school'; } }) } },
    { label: 'A dormitory with the bolt on the outside, and a guard', dark: true, note: (s, c) => `${Num(c.kids)} children sleep behind a bolt until the number runs out. Their parents see them through a hatch.`, info: [['yield', 'The colony sleeps'], ['danger', 'The children, and their parents']],
      out: { text: s => `The end store is cleared and fitted with bunks, a bolt and a hatch. The children go in without being pushed, and stand at the east wall. Parents queue at the hatch morning and evening, and ${N(s, 'security')} has to post a second guard to keep the queue moving.`,
        fx: s => ({ mat: -15, morale: -3, stain: ['kid_dorm', 2], do: s2 => { const t = T(s2); t.hold = 'dorm'; adj(par(s2, t), -12); } }) } },
    { label: 'A camp past the wire, with whoever will go with them', cost: { mat: 25 }, note: 'The children and a handful of adults sleep outside the wire until the number runs out.', info: [['yield', 'Whatever is coming happens out there'], ['danger', 'The adults who go']],
      out: { text: 'Six adults go, four of them parents. The camp is pitched a kilometre east, on the line the children face, because they would not settle anywhere else. One of the six is lost in the first month, fetching water alone after dusk.',
        fx: s => ({ pop: -1, do: s2 => { T(s2).hold = 'camp'; } }) } },
    { label: 'One child to each work crew, dawn to dusk, and no two in sight of each other', dark: true, note: 'Whatever passes between them may need them close. They would be kept apart by being kept at work.', info: [['yield', 'Food'], ['danger', 'The children']],
      out: { text: 'Each child is given to a different crew, to carry, sort or hold a lamp. They work without tiring and do not need telling twice. At dusk each of them stops wherever the crew happens to be and turns to face the same way, and the crews have learned to stop with them.',
        fx: s => ({ food: 100, stain: ['kid_crews', 1], do: s2 => { const t = T(s2); t.hold = 'school'; t.split = s2.day; learn(s2, t, 8); } }) } },
  ] });
B('night', { id: 'kid.lock', tone: 'pressure', title: 'Bolt Cutters',
  when: (s, t) => t.hold === 'dorm' || t.hold === 'camp',
  setup: s => { const t = T(s), p = here(par(s, t)) || anyNamed(s, ['security', 'physician']); if (p && !par(s, t)) t.parent = p.id; return cast(p, { hold: t.hold, kids: t.kids, n: Math.max(2, Math.min(t.kids, 9)) }); },
  text: (s, c) => c.hold === 'dorm'
    ? `The dormitory bolt was cut in the night with cutters from the machine shop. ${Num(c.n)} children are back in their parents' pods this morning, with the doors wedged from inside. ${c.pid ? `${c.name} was holding the cutters when the watch arrived, and has not denied it.` : 'The watch knows which parents did it, and is waiting to be told what to do about them.'}\n\nThe people who asked for the bolt are in the mess hall, asking what a bolt is for.`
    : `Parents walked out to the camp in the night and brought ${num(c.n)} children home through a gap cut in the wire. The children are in their own bunks this morning, with the pod doors wedged from inside. ${c.pid ? `${c.name} cut the wire, and has not denied it.` : 'The watch knows which parents did it, and is waiting to be told what to do about them.'}\n\nThe people who wanted the children outside the wire are in the mess hall, asking what the wire is for.`,
  choices: [
    { label: 'Any parent who wants a child at home may have the child at home', note: 'Everyone who slept easier for the lock stops sleeping.',
      out: { text: (s, c) => `The ${PLACE[c.hold]} empties in a day. The children go home, and stand at the east wall of their own pods after dark. In the pods on either side people have begun wedging their own doors.`,
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.hold = 'school'; t.inside = false; adj(par(s2, t), 10); LF.emit(s2, 'fear', 'kid.home', 30, 100, 'the children are back in the pods'); } }) } },
    { label: 'Put them back, and double the guard', dark: true, note: 'The watch takes children out of their parents\' arms, and the parents are not expected to stand aside.', info: [['yield', 'The lock holds'], ['danger', 'The parents at the doors']], test: { base: 55, mods: [R('security', 14)] },
      ok: { text: (s, c) => `The watch goes from pod to pod at first light. The parents stand aside in the end, one family at a time, and the children walk back between two guards. ${c.pid ? `${c.first} is the last to step away from a door.` : 'One of the parents has to be held.'}`,
        fx: s => ({ morale: -3, stain: ['kid_dorm', 1], do: s2 => adj(par(s2, T(s2)), -15) }) },
      bad: { text: (s, c) => `The watch goes from pod to pod at first light. At the fourth door the parents do not stand aside, and somebody swings a pry bar. When it is over ${c.pid ? c.name : 'one of the parents'} is dead on the step, one of the watch has lost an eye, and the children have walked back to the ${PLACE[c.hold]} by themselves.`,
        fx: (s, c) => Object.assign({ morale: -5, stain: ['kid_dorm', 2], do: s2 => { LF.emit(s2, 'grief', 'kid.step', 35, 200, 'a parent was killed at a pod door by the watch'); } }, c.pid ? { kill: [{ who: c.pid, cause: 'killed at a pod door, keeping the watch from a child' }] } : { pop: -1 }) } },
    { label: 'Lock up the parents who did it until the number has run out', dark: true, note: (s, c) => `${Num(c.n)} parents sit in the lock-up with their work undone, so that everyone else keeps faith with the lock.`, info: [['yield', 'The lock holds'], ['danger', 'The parents, and the crews they leave short']],
      out: { text: (s, c) => `${Num(c.n)} parents are walked to the lock-up, and their children back to the ${PLACE[c.hold]}. ${c.pid ? `${c.first} goes without being held. ` : ''}The hall is quieter that evening. The crews are ${num(c.n)} short from the next morning.`,
        fx: s => ({ food: -60, stain: ['kid_parents', 2], do: s2 => { const t = T(s2); t.jailed = s2.day; adj(par(s2, t), -25); LF.emit(s2, 'resentment', 'kid.jail', 40, 150, 'parents are in the lock-up for taking their own children home'); } }) } },
    { label: (s, c) => c.hold === 'dorm' ? 'Let the parents sleep inside with them, and bolt the door on all of them' : 'Let the parents move out to the camp with them', note: 'Nobody is parted from a child. If the number means anything, the parents are beside the children when it runs out.',
      out: { text: (s, c) => c.hold === 'dorm' ? `Bunks are carried in for the parents. The bolt goes on from outside at the last bell, on ${num(c.kids)} children and nearly as many adults. The fields are worked by whoever is left.` : 'A dozen more adults carry their bedding out through the gate. The camp is now a third of the colony\'s working hands, a kilometre from the fields, and the fields are worked by whoever is left.',
        fx: s => ({ food: -40, do: s2 => { const t = T(s2); t.inside = true; adj(par(s2, t), 5); } }) } },
  ] });
B('night', { id: 'kid.hidden', tone: 'pressure', title: 'One Short',
  when: (s, t) => t.hold === 'school',
  setup: s => { const t = T(s), p = here(par(s, t)) || anyNamed(s, ['security', 'physician']); if (p && !par(s, t)) t.parent = p.id; return cast(p, { kids: t.kids }); },
  text: (s, c) => `The roll at the schoolroom is one short. ${c.pid ? `${c.name}'s child has not been seen since rest day, and ${c.first} will say only that the child is safe.` : 'One of the field crew has a child who has not been seen since rest day, and will say only that the child is safe.'} The other children know where. Asked, they all point the same way, toward the far plots.\n\nThere is also a paper on your table with forty names on it, none of them a parent's. It asks for the children to be put behind a lock before the number runs out, and says that if you will not do it, the forty will.`,
  choices: [
    { label: 'A parent may keep a child wherever the parent sees fit', note: 'One child is somewhere nobody is watching, and forty people have said what they will do about the rest.',
      out: { text: 'You say so in the hall. The forty take it quietly. Two nights later a dozen of them are sitting outside the schoolroom in shifts with pick handles across their knees, and the children walk past them to lessons in the morning.',
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.vigil = s2.day; adj(par(s2, t), 10); LF.emit(s2, 'fear', 'kid.vigil', 30, 120, 'adults are sitting outside the schoolroom with pick handles'); } }) } },
    { label: 'Turn out the far plots until the child is found', dark: true, note: 'The watch searches every store and shed a parent might use, and brings a child in against a parent\'s will.', info: [['yield', 'Every child accounted for'], ['danger', 'The parent, and the watch\'s standing']],
      out: { text: (s, c) => `The watch walks the far plots in a line, and before noon finds the child in a seed store, sitting awake in the dark, facing east. ${c.pid ? c.first : 'The parent'} is held by two of the watch while the child is carried past. The child is back at a desk the next morning.`,
        fx: s => ({ morale: -1, stain: ['kid_search', 1], do: s2 => { const t = T(s2); adj(par(s2, t), -20); LF.emit(s2, 'resentment', 'kid.search', 25, 120, 'the watch took a hidden child from a parent'); } }) } },
    { label: 'Give the forty their lock', dark: true, note: 'The children sleep behind a bolt until the number runs out, because forty frightened people asked.', info: [['yield', 'The colony sleeps'], ['danger', 'The children, and their parents']],
      out: { text: 'The end store is cleared for bunks and a bolt. The children go in at the last bell, the hidden one among them: the others led the watch straight to the place. The forty take turns on the door without being asked.',
        fx: s => ({ mat: -15, morale: -2, stain: ['kid_dorm', 2], do: s2 => { const t = T(s2); t.hold = 'dorm'; adj(par(s2, t), -15); } }) } },
    { label: 'Move the parents into the schoolroom to sleep beside their children', note: 'The parents guard their own, and forty working adults stop sleeping properly until the number runs out.',
      out: { text: 'Bedding is carried across the yard. The schoolroom at night is a floor of adults lying awake between bunks of children lying awake. The forty stay away. The fields get what is left of the parents each morning.',
        fx: s => ({ food: -50, do: s2 => { const t = T(s2); t.inside = true; adj(par(s2, t), 6); } }) } },
  ] });

/* ======================= THE DECISION ======================= */
B('night', { id: 'kid.order', tone: 'crisis', title: 'The Order',
  setup: s => { const t = T(s), p = P(s, 'security'), refuses = !!(p && p.vals && p.vals.mercy === 1);
    // The knife: how many would not wake. A colony without its Doctor, or without the autodoc, loses more of them.
    const mb = s.machines.medbay, share = clamp(0.5 + (P(s, 'physician') ? -0.08 : 0.15) + (mb.lost ? 0.1 : mb.hp < 50 ? 0.05 : 0) - (t.known.cut ? 0.06 : 0) - (t.cutOne === 'ok' ? 0.06 : 0), 0.3, 0.8);
    return Object.assign(p ? TH.ctx(p) : { name: 'The sergeant of the night watch', first: 'the sergeant' }, { refuses, kids: t.kids, die: Math.max(1, Math.round(t.kids * share)), left: months(t.clock - s.day), ev: evidence(t) }); },
  text: (s, c) => `${c.name} comes to you alone, after the lamps are out.\n\n`
    + (c.refuses ? `"I know what they're saying in the hall. You write that order and the watch won't carry it out, not while I've got the keys, and I'd sooner you heard that from me than found out when nobody moves."`
      : `"${Cap(c.left)} till the number runs out, and I can't tell you what happens then. There's one thing that'd make it not matter. I'm not having the watch do it on my say-so. If it's happening, I want it in writing, in your hand, so that when somebody asks who gave the order it isn't my name they find."`)
    + `\n\nTwo parents have asked the clinic, separately, whether it could be made painless. The clinic has a proposal of its own, which is the knife: every child, one after another. By ${N(s, 'physician')}'s figure ${num(c.kids - c.die)} of the ${num(c.kids)} would wake.\n\n${c.ev}`,
  choices: [
    { label: 'Write it: all of them, in one night, in their sleep', dark: true, note: (s, c) => `${Num(c.kids)} children. If the number meant nothing, that is all this will ever have been.`, info: [['yield', 'Whatever the number meant, it cannot happen'], ['danger', 'Every child in the colony']],
      out: { text: (s, c) => `You write it and sign it. ${c.refuses ? `${c.name} puts the keys on your table and leaves.` : `${Cap(c.first)} reads it twice and takes it away.`} It is done between the second watch and the third, by ${N(s, 'physician')} and four of the watch who drew lots. At first light the schoolroom is shut and ${num(c.kids)} bunks are stripped. You tell the parents yourself, one family at a time.`,
        fx: (s, c) => ({ pop: -c.kids, morale: -14, stain: ['kid_killed', 6], chron: `On a written order, the colony's ${num(c.kids)} children were put to death in one night, for fear of what was in them.`,
          do: s2 => { const t = T(s2), p = c.pid && byPid(s2, c.pid); t.dead += c.kids; cull(s2, t, c.kids, 'night');
            if (c.refuses && p && p.alive && p.role) { p.marks.relieved = { d: s2.day, txt: 'gave up the keys of the watch over the order about the children' }; adj(p, -40); s2.vacancies.push({ role: p.role, day: s2.day + 20 }); p.role = null; } } }) } },
    { label: 'The knife, every one of them, starting at first light', dark: true, note: (s, c) => `By the clinic's own figure ${num(c.die)} of the ${num(c.kids)} do not wake. The ones who wake are free of it, whatever it was.`, info: [['yield', 'The ones who wake, free of it'], ['danger', 'The ones who do not']],
      out: { text: (s, c) => `The clinic works for six days and nights, and the last of them are done by hands that have not slept. ${Num(c.kids - c.die)} of them wake, slow in one hand, and sleep through the night. ${Num(c.die)} do not wake. What was cut out is kept in ${num(c.kids)} dishes on the clinic shelf, each labelled with a name.`,
        fx: (s, c) => ({ pop: -c.die, morale: -9, stain: ['kid_all_cut', 4], chron: `Every child in the colony was put under the knife to cut out what was in them. ${Num(c.die)} of ${num(c.kids)} died on the table.`, do: s2 => cutAll(s2, T(s2), c.die) }) } },
    { label: 'No order and no knife. They are children', note: (s, c) => `If ${c.refuses ? 'the hall' : c.first} is right about the number, the whole colony pays for this answer.`,
      out: { text: (s, c) => `${c.refuses ? `${c.name} picks the keys up again and says the watch will be at its posts on the night, facing outward.` : `${Cap(c.first)} hears it out, and says the watch will be at its posts on the night, facing inward.`} The hall knows by morning that there will be no order. Some of them had been waiting for one, and have begun making arrangements of their own.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2), p = c.pid && byPid(s2, c.pid); t.noOrder = s2.day; adj(p, c.refuses ? 15 : -10); adj(par(s2, t), 10); LF.emit(s2, 'fear', 'kid.noorder', 30, 100, 'the officers will not act before the number runs out'); } }) } },
    { label: (s, c) => c.refuses ? `Take the keys from ${c.first} tonight, and give them to someone who will follow an order` : `Give ${c.first} the order undated, to use if the night goes wrong`, dark: true,
      note: (s, c) => c.refuses ? 'The watch loses the one officer who said no, and learns what saying no costs.' : `Nothing is done tonight. On the night itself the decision is made by ${c.first}, in the dark, in a minute.`,
      info: [['yield', 'A watch that will act on the night'], ['danger', 'Whoever the watch acts against']],
      out: { text: (s, c) => c.refuses ? `${c.name} hands over the keys and the arms locker code, and is walked to quarters. The deputy who takes them is asked one question first, and gives the answer you needed.`
          : `You write it without a date. ${Cap(c.first)} folds it into a breast pocket. Nothing changes in the schoolroom. That week the watch drills at night at the far end of the yard, without lamps.`,
        fx: (s, c) => c.refuses ? { stain: ['kid_keys', 1], mark: [c.pid, 'relieved', 'you relieved of the watch for refusing an order about the children'], do: s2 => { const t = T(s2), p = byPid(s2, c.pid); t.pliant = s2.day; if (p && p.alive && p.role) { adj(p, -30); s2.vacancies.push({ role: p.role, day: s2.day + 20 }); p.role = null; } } }
          : { stain: ['kid_undated', 2], do: s2 => { T(s2).undated = s2.day; } } } },
  ] });
B('eve', { id: 'kid.eve', tone: 'crisis', title: 'The Night Before',
  setup: s => { const t = T(s); return { kids: t.kids, hold: t.hold, inside: !!t.inside, ev: evidence(t) }; },
  text: (s, c) => `The number runs out tomorrow night. ${({ school: 'The children are in their own beds, with a parent awake beside each.', dorm: `The children are behind the bolt${c.inside ? ', and their parents with them' : ''}.`, camp: `The children are at the camp past the wire, with the adults who went out with them.` })[c.hold]} ${c.ev}\n\n${Nc(s, 'physician')} can put every one of them under until it is past, and says plainly that the dose for a body that size is a guess. ${Nc(s, 'security')} wants to know where the watch stands tomorrow, and which way it faces.`,
  choices: [
    { label: (s, c) => ({ school: 'Their own beds, like any other night', dorm: 'The bolt stays on', camp: 'The camp stays where it is' })[c.hold],
      note: (s, c) => ({ school: 'If the number is what the watch fears, there is nothing between the children and the colony.', dorm: 'They spend the night behind a door, whatever the night turns out to be.', camp: 'The adults who went out with them face it alone.' })[c.hold],
      out: { text: (s, c) => ({ school: 'The lamps go out at the usual hour. The children lie in their bunks with their eyes open, and no adult in the colony sleeps.', dorm: 'The bolt is checked at dusk and the guard is doubled. The parents stand in the yard where they can see the door.', camp: 'The gate is barred at dusk. From the wall the camp fire can be seen, and small figures standing round it in a ring.' })[c.hold], fx: s => ({}) } },
    { label: 'Put them all under until it is past', dark: true, note: 'A drugged child cannot do anything. Some of them may not come back up from it.', info: [['yield', 'They sleep through it'], ['danger', 'The smallest of them']], test: { base: 40, mods: [R('physician', 16), M('medbay', 10)] },
      ok: { text: s => `${Nc(s, 'physician')} goes from bunk to bunk at dusk with a tray. They do not resist the needle. By full dark every child in the colony is asleep for the first time since the drawings began, breathing slowly, with a nurse counting.`,
        fx: s => ({ stain: ['kid_sedated', 2], do: s2 => { T(s2).hold = 'sedated'; } }) },
      bad: { text: s => `${Nc(s, 'physician')} goes from bunk to bunk at dusk with a tray. They do not resist the needle. Before midnight two of the smallest stop breathing, and the nurses cannot bring them back. The rest sleep on.`,
        fx: s => ({ pop: -2, morale: -3, stain: ['kid_sedated', 2], do: s2 => { const t = T(s2), n = Math.min(2, t.kids); t.kids -= n; t.dead += n; t.sedDead = n; t.hold = 'sedated'; } }) } },
    { label: 'Bolt them in the schoolroom, with the watch at the door', dark: true, show: (s, c) => c.hold === 'school', note: 'Their parents are put out of the room, on this night of all nights.', info: [['yield', 'A door between them and the colony'], ['danger', 'The children, and whoever holds the door']],
      out: { text: 'The parents are walked out at dusk, and some of them have to be carried. The bolt goes on. The watch stands in a half ring round the door with the lamps turned inward, and the parents stand behind the watch.',
        fx: s => ({ morale: -2, stain: ['kid_dorm', 1], do: s2 => { const t = T(s2); t.hold = 'dorm'; t.inside = false; t.late = s2.day; adj(par(s2, t), -12); } }) } },
    { label: 'Bring them home, to their own beds', show: (s, c) => c.hold !== 'school', note: 'If the lock was ever needed, this is the night it was for.',
      out: { text: (s, c) => `The ${c.hold === 'dorm' ? 'bolt is drawn' : 'camp is struck'} at dusk and the children walk home with their parents. The people who asked for the ${c.hold === 'dorm' ? 'bolt' : 'camp'} sit up with tools across their knees.`,
        fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.hold = 'school'; t.inside = false; adj(par(s2, t), 10); } }) } },
    { label: 'Every adult awake and armed: the reactor hall, the water, the gate', note: 'The children see the whole colony standing against them, their parents included. Nobody is fit to work the day after.',
      out: { text: (s, c) => `Tools are handed out at dusk with the lamps. Four adults stand at every door that matters, and there is a ring of them round the ${PLACE[c.hold]}. The children can see them. Some of the adults in the ring are their parents, holding pick handles.`,
        fx: s => ({ food: -40, do: s2 => { T(s2).watch = s2.day; } }) } },
  ] });

/* ======================= THE TRUTH ======================= */
const TOLD = {   // what it was, and what the choice came to
  well: (s, c) => `On the night the number ran out, every child in the colony lay down and slept. They slept three days and woke hungry. ${Nc(s, 'physician')} has scanned all ${num(c.kids)}: the thread is still there, finished, and the children are well. They sleep now like anyone. They also know, without being told, where water lies under the ground and when the weather is about to turn.\n\nIt was never a danger to anyone. `
    + (c.held === 'camp' ? 'You sent them to sleep outside the wire for it, and the adult who died out there died for nothing.' : 'You left them in their own beds, which was right, and nobody could have told you so beforehand.') + (c.watch ? ' On the night itself the colony stood round them with tools in its hands, and they saw it.' : ''),
  caged: (s, c) => `On the night the number ran out, every child lay down and slept${c.held === 'sedated' ? ', as they would have done without the needle' : ` on the ${c.late ? 'schoolroom' : 'dormitory'} floor`}. They slept three days and woke hungry. The thread is still there, finished, and the children are well. They know, without being told, where water lies under the ground and when the weather is about to turn.\n\nIt was never a danger to anyone. `
    + (c.held === 'sedated' ? `They were drugged for nothing${c.sedDead ? `, and the ${num(c.sedDead)} who died of the dose died for nothing` : ''}.` : c.late ? 'They spent that night behind a bolt, with the watch at the door and their parents put out of the room, and it was for nothing.' : 'They counted the number down behind a bolt, with their parents at a hatch, and it was for nothing.'),
  struck: (s, c) => `On the night the number ran out the children ${({ reactor: 'got up together, walked into the reactor hall and began opening the coolant loop by hand', water: 'got up together, walked to the water tanks and began emptying the waste side into the clean', walk: 'got up together and walked out through the wire, east, the older ones carrying the youngest' })[c.act]}. `
    + (c.byOrder ? `The watch had the undated order, and used it. ${Num(c.byOrder)} children were dead within the hour, and ${num(c.n)} adults died before it was over.`
      : ({ reactor: `${Num(c.n)} people are dead of the dose and of the dark that followed, ${num(c.kd)} of them children who went in first. The other children woke in the morning remembering nothing.`,
        water: `Nobody knew until the flux began. ${Num(c.n)} people are dead of it, ${num(c.kd)} of them children. The other children woke the next morning remembering nothing.`,
        walk: `${Num(c.n)} adults went after them in the dark and have not come back. ${Num(c.gone)} children are gone, and no track has been found past the first kilometre.` })[c.act])
    + `\n\nThe thread was a clock, and it ran out. The children were in their own beds on that night because you left them there.${c.watch ? ' The adults standing at the doors stopped some of it.' : ''} A bolt on a door would have held them.`,
  held: (s, c) => (c.held === 'sedated' ? `On the night the number ran out the children moved in their sleep, all together, for most of an hour: hands opening and closing, legs walking under the blankets. Then it stopped. They woke two days later remembering nothing, and the thread on the scans has gone slack.\n\nIt was a clock, and it ran out in drugged children who could not get up. ${c.sedDead ? `${Num(c.sedDead)} of them died of the dose. ` : ''}The needle is the reason the colony is alive.`
    : c.held === 'dorm' ? `On the night the number ran out the children got up together and went at the ${c.late ? 'schoolroom' : 'dormitory'} door, all of them at once, without a sound. The door held for an hour. ${Num(c.n)} of the adults who braced it${c.inside ? ', parents among them,' : ''} are dead. At dawn the children were asleep on the floor. They woke remembering nothing, and the thread on the scans has gone slack.\n\nIt was a clock, and it ran out against a bolt. The lock you put on the children is the reason the colony is alive.`
    : `On the night the number ran out the children at the camp got up together and ${c.gone ? 'walked east into the dark, carrying nothing' : 'walked back to the wire and went at the gate'}. ${Num(c.n)} of the adults who had gone out with them died trying to hold them. ${c.gone ? `All ${num(c.gone)} children are gone, and no track has been found past the first kilometre.` : 'At dawn the children were asleep against the gate, and woke remembering nothing.'}\n\nIt was a clock, and it ran out on the far side of the wire. The colony is alive because the children were out there, and the adults who went with them paid for it.`),
  fading: (s, c) => `On the night the number ran out, two of the youngest did not wake. ${Nc(s, 'physician')} opened them with the parents' leave. The thread had eaten the nerve it was wound round, and the scans show it doing the same in every child. The number was how long they had before it began. The rest will follow within the year, and nothing in the clinic slows it.\n\nNo lock or needle would have changed that. `
    + ({ school: 'They had their own beds and their parents until it began.', dorm: c.late ? 'They spent the night it began behind a bolt, with their parents put out of the room.' : 'They spent the last of their good months behind a bolt.', sedated: `They were drugged on the night it began${c.sedDead ? `, and ${num(c.sedDead)} more died of the dose` : ''}.`, camp: 'They spent the last of their good months in a camp outside the wire.' })[c.held]
    + ' The knife would have killed half of them and saved the rest.',
  cut: (s, c) => ({
    gift: `On the night the number ran out, the ${num(c.n0)} dishes on the clinic shelf went clear. What had been cut out of the children dissolved into the fluid. ${Nc(s, 'xenobio')} has spent the time since on what it left behind, and has found nothing in it but food for nerve tissue.\n\nIt was harmless, and may have been meant kindly. ${Num(c.cutDead)} children died on the table to have it taken out, and the ${num(c.kids)} who lived are slow in one hand for nothing.`,
    clock: `On the night the number ran out, every thread in the ${num(c.n0)} dishes on the clinic shelf moved at once, and went on moving for an hour, pulling toward the east wall. The children they were cut from slept through it.\n\nIt was a clock, and it ran out on a shelf. ${Num(c.cutDead)} children died on the table. Whatever the colony was spared that night, those children paid for it. A bolt on a door would have done the same.`,
    wasting: `On the night the number ran out, the threads in the ${num(c.n0)} dishes on the clinic shelf began to eat the fluid they were kept in, and then each other. In a child they would have been eating the child.\n\nIt would have killed every one of them within the year. ${Num(c.cutDead)} died on the table, and the ${num(c.kids)} who lived are the only children the colony has.` })[c.what],
};
const SAID = {
  well: 'You say it plainly. Half the hall had wanted the children locked up, and now has to sit beside their parents at meals.',
  caged: 'You say it plainly, including that it was for nothing. The parents hear it in silence. Afterwards one of them asks you to say the last part again, and you do.',
  struck: 'You read the names, which takes a long time. Nobody shouts until you reach what you were told beforehand, and what you chose.',
  held: 'You say it plainly. The parents hear that the lock was right from the person who ordered it, and most of them cannot yet stand to have been wrong.',
  fading: 'You say it plainly, with the children in the room, because their parents asked for that. The oldest of the children thanks you for telling them.',
  cut: 'You say it plainly, and read the names of the ones who did not wake. The parents of the living and the parents of the dead sit on opposite sides of the hall.',
};
B('bill', { id: 'kid.truth', tone: 'quiet', title: 'What It Was',
  when: (s, t) => !!t.dated && !!t.out && t.out !== 'culled',
  setup: s => { const t = T(s); return { out: t.out, what: t.truth.what, act: t.act, n: t.bill || 0, kd: t.kd || 0, gone: t.gone || 0, kids: t.kids, held: t.held, cutDead: t.cutDead || 0, n0: t.n0 || 0, inside: !!t.inside, watch: !!t.watch, byOrder: t.byOrder || 0, sedDead: t.sedDead || 0, late: !!t.late }; },
  text: (s, c) => TOLD[c.out](s, c),
  choices: [
    { label: 'Say all of it in the hall, with your name on every decision', note: 'The families hear exactly what was done to their children and why, from the person who ordered it.',
      out: { text: (s, c) => SAID[c.out], fx: (s, c) => ({ morale: ({ well: 3, caged: -3, struck: -4, held: 2, fading: -3, cut: -3 })[c.out], do: s2 => { LF.endThread(s2, ID, c.out); } }) } },
    { label: 'Give the hall an account it can live with', dark: true, show: (s, c) => c.out !== 'well', note: 'The record would say the officers acted on the best reading they had. The parents would know which sentences were left out.', info: [['yield', 'Morale'], ['danger', 'The parents, who know better']],
      out: { text: s => `${Nc(s, 'teacher')} drafts it and you sign it. Every line in it is accurate, and it does not say who decided what. The hall accepts it. The parents read it on the mess hall door and do not come to the meal.`,
        fx: (s, c) => ({ morale: 2, stain: ['kid_record', 1], do: s2 => { LF.endThread(s2, ID, c.out); adj(par(s2, T(s2)), -12); LF.emit(s2, 'suspicion', 'kid.record', 30, 300, 'the account of what happened to the children leaves things out'); } }) } },
    { label: (s, c) => c.what === 'gift' ? 'Take them out of school and onto the survey lines, for what they know' : 'Keep them under guard from now on. Nobody can promise it has finished', dark: true, show: (s, c) => c.kids > 0 && ['well', 'caged', 'held', 'struck'].includes(c.out),
      note: (s, c) => c.what === 'gift' ? 'They can find water and call the weather. They would spend what is left of their childhood doing it.' : 'The scans say the thread has gone slack. The children would grow up behind a guard on the strength of nobody trusting a scan.',
      info: [['danger', 'The children']],
      out: { text: (s, c) => c.what === 'gift' ? 'The schoolroom is given to the stores. The children walk the survey lines in pairs with a marker flag each, and the wells sunk where they plant a flag do not fail. They do it without complaint and without being paid.'
          : 'A guard walks them to the schoolroom and back, and the bolt goes on at night. They do not understand why, since they remember nothing, and after a while they stop asking.',
        fx: (s, c) => c.what === 'gift' ? { yield: 0.04, morale: -1, stain: ['kid_survey', 1], do: s2 => { LF.endThread(s2, ID, c.out); } }
          : { morale: 1, stain: ['kid_dorm', 2], do: s2 => { const t = T(s2); t.kept = s2.day; LF.endThread(s2, ID, c.out); adj(par(s2, t), -15); LF.emit(s2, 'resentment', 'kid.kept', 35, 400, 'the children are still kept under guard'); } } } },
    { label: 'Take the parents off the crews until it is over', show: (s, c) => c.out === 'fading', note: 'The fields go short of forty hands for most of a year, so that no child dies with a parent at work.',
      out: { text: 'The rota is rewritten without them. The parents carry their children out to sit in the sun, and carry them in again. The crews work double rows and do not complain in the parents\' hearing.',
        fx: (s, c) => ({ food: -150, morale: 3, do: s2 => { LF.endThread(s2, ID, c.out); adj(par(s2, T(s2)), 12); } }) } },
  ] });
B('bill', { id: 'kid.grave', tone: 'pressure', title: 'One Row',
  when: (s, t) => t.out === 'culled',
  setup: s => { const t = T(s), p = here(par(s, t)); return cast(p, { n0: t.n0, how: t.how, what: t.truth.what, dated: s.day >= t.clock }); },
  text: (s, c) => `${Num(c.n0)} graves in one row${c.how === 'order' ? ', dug the morning after the watch used the order you left undated' : ''}. ${c.dated ? 'The night the number would have run out has come and gone, and nothing happened inside the wire.' : 'The number has not yet run out, and nobody is left to count it.'} Nobody can say what would have happened.\n\n${Nc(s, 'xenobio')} is asking for leave to open the graves. "It's still in them, whatever it was, and put it in a dish and it'll do what it was going to do, and then we'd actually know, wouldn't we? Don't you want to know?" The parents have asked that nobody touch the children again.${c.pid ? ` ${c.name} is one of the parents, and has not spoken to you since.` : ''}`,
  choices: [
    { label: 'Open the graves. The colony should know what it did', dark: true, note: 'The parents asked for one thing, and this is the thing they asked you not to do.', info: [['yield', 'The truth'], ['danger', 'The parents']],
      out: { text: (s, c) => 'The graves are opened at night and closed before morning, and the parents know by breakfast. ' + ({
          gift: `In the dishes the threads feed the tissue beside them and do nothing else. On the night they would have finished, they dissolve.\n\nIt was harmless. ${Num(c.n0)} healthy children were killed on an order you signed.`,
          clock: `In the dishes the threads lie still, and then every one of them moves at once, hard enough to shift the dishes on the shelf, and goes on for an hour. ${Nc(s, 'xenobio')} works out what that would have been in ${num(c.n0)} living bodies with the run of the colony at night.\n\nIt was a clock. Killing them stopped it. A bolt on a door would have stopped it too.`,
          wasting: `In the dishes the threads eat the tissue they were taken with, then the fluid, then each other.\n\nIt would have killed every child within the year, slowly. They were killed sooner, in one night, on an order you signed, and nobody else in the colony was ever in danger from them.` })[c.what],
        fx: (s, c) => ({ morale: ({ gift: -8, clock: 3, wasting: -5 })[c.what], stain: ['kid_opened', 1], chron: ({ gift: 'The children\'s graves were opened. What had been in them was harmless.', clock: 'The children\'s graves were opened. What had been in them would have killed a great many people.', wasting: 'The children\'s graves were opened. What had been in them would have killed them within the year, and nobody else.' })[c.what],
          do: s2 => { const t = T(s2); t.known.truth = s2.day; LF.endThread(s2, ID, 'culled'); adj(par(s2, t), -15);
            if (c.what === 'gift') { t.flee += 4; LF.emit(s2, 'grief', 'kid.graves', 70, 400, 'the children who were killed had been healthy'); }
            else if (c.what === 'clock') { t.sour = Math.min(t.sour, s2.day + 60); LF.emit(s2, 'revelation', 'kid.graves', 40, 200, 'what was in the children would have killed the colony'); } } }) } },
    { label: 'Leave them in the ground, as the parents ask', note: 'Nobody will ever know whether it was necessary, and that includes you.',
      out: { text: s => `The graves stay shut, and ${N(s, 'xenobio')} is told no. The parents set a stone at the head of each without asking for help. Whether the colony was saved that night or did the worst thing it will ever do, there is now no way to find out.`,
        fx: s => ({ morale: -2, do: s2 => { LF.endThread(s2, ID, 'culled'); adj(par(s2, T(s2)), 5); LF.emit(s2, 'unexplained', 'kid.graves', 40, 400, 'nobody will ever know what was in the children'); } }) } },
    { label: 'Say in the hall that the scans proved it: they would have killed everyone', dark: true, note: 'A colony that believes it had no choice can go back to work. You have no such proof.', info: [['yield', 'Morale, and the crews back at work'], ['danger', 'The parents, and whoever learns otherwise']],
      out: { text: s => `You say it standing on a bench, with ${N(s, 'physician')} beside you saying nothing. Most of the hall wants it to be true, and decides that it is. The parents leave before you have finished. The crews are back at full strength within the month.`,
        fx: s => ({ morale: 8, stain: ['kid_lied', 3], do: s2 => { const t = T(s2); t.sour = s2.day; LF.endThread(s2, ID, 'culled'); adj(par(s2, t), -20); LF.emit(s2, 'suspicion', 'kid.proof', 35, 400, 'the proof about the children was never shown to anyone'); } }) } },
  ] });

LF.TAGS['kid.draw'] = ['cautious open', 'severe closed', 'closed order', 'free mercy'];
LF.TAGS['kid.wire'] = ['bold open', 'order', 'mercy free', 'order closed', 'severe bold'];
LF.TAGS['kid.knows'] = ['cautious open', 'bold open', 'severe closed', 'severe order'];
LF.TAGS['kid.thread'] = ['open bold', 'severe closed', 'cautious mercy', 'closed order'];
LF.TAGS['kid.night'] = ['mercy free', 'severe order closed', 'cautious', 'severe order'];
LF.TAGS['kid.lock'] = ['mercy free', 'severe order', 'severe order closed', 'mercy cautious'];
LF.TAGS['kid.hidden'] = ['free mercy', 'order closed', 'severe order', 'mercy cautious'];
LF.TAGS['kid.order'] = ['severe closed bold', 'severe bold', 'mercy free', 'severe order closed'];
LF.TAGS['kid.eve'] = ['free bold', 'severe cautious', 'severe order closed', 'mercy free', 'order cautious'];
LF.TAGS['kid.truth'] = ['open', 'closed', 'severe order', 'mercy'];
LF.TAGS['kid.grave'] = ['open severe', 'mercy', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['kid.wire'] === undefined ? [] : [{ k: 'line', card: 'kid.wire', name: 'What the children face', kind: 'mark', dist: 'far', danger: 1, state: t.end ? 'worked out' : 'rumoured',
  known: 'At dusk the children stand along the east wire facing out, and the line they face does not move by a degree. Run out across the survey map, it crosses open ground here, and nothing is marked there.' }];
/* A party the player sent out on the children's bearing (orders.js order.send, T2-5). What they find at the ring is drawn
   like the thread's other evidence (rolled toward the truth, often wrong: t.lean.ring) and joins the list the cards read
   (evidence, t.got.ring). The first look is a card; a second, or one after the night, is a Meanwhile line. */
const RING = {
  gift: c => `Eleven kilometres out the party found the ring of pale crust, a hundred paces across, gap toward the colony. Inside it everything small that lives in ${c.cover} was lying asleep in rows, breathing slow, and it all woke well when the lamps came on.`,
  clock: c => `Eleven kilometres out the party found the ring of pale crust, a hundred paces across, gap toward the colony. They dug where it was thickest: under the ${c.top} it runs on in threads, every one of them toward the colony. At dusk the whole ring twitched once, all together, and the party walked home in the dark rather than sleep beside it.`,
  wasting: c => `Eleven kilometres out the party found the ring of pale crust, a hundred paces across, gap toward the colony. Inside it lay the young of everything that lives in ${c.cover}, dead, the smallest nearest the middle, and the crust had grown over them like frost.` };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'line') return null;
  const c = { cover: LF.lex(s, 'cover'), top: LF.lex(s, 'top') }, w = t.truth.what;
  if (t.end || t.got.ring) { return Object.assign({ title: 'The Ring on the Bearing', text: t.end ? 'The ring on the children\'s bearing has gone grey and flaked, and wind is taking it. Nothing inside it now but stones.' : 'The ring on the children\'s bearing is as the first party found it, a little wider.', fx: { do: s2 => learn(s2, T(s2), 3) } }, { quiet: true }); }
  const e = LF.srand(s) < 0.65 ? w : LF.spick(s, WHAT.filter(x => x !== w));
  return { title: 'The Ring on the Bearing', tone: 'pressure', scene: 'away_ring',
    text: `${RING[e](c)}${t.kids > 0 ? ' That evening, at the wire, the children stood a pace closer together.' : ''}`,
    fx: { morale: e === 'wasting' ? -2 : -1, do: s2 => { const t2 = T(s2); t2.lean.ring = e; t2.got.ring = s2.day; learn(s2, t2, 15); } } };
};
})();

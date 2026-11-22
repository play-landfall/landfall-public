/* Landfall — thread: the Friend (NEXT.md WO-8, Lachlan: "child/next generation dreads" that keep clear of the new child
   dilemmas). The children born here all have the same imaginary friend: the same name (t.nm, one per game from NAMES),
   in every row, among children who have never played together. It tells them things to come: where to dig, which of
   the old ones will not see the spring. Nothing here is about the children's own words, their bodies, a shape they
   draw, a night they count down to, their courts or their quarrel with the founders' rule (js/content-born.js,
   js/thread-children.js): it is about one name, what it gets right, and what the grown do to their own children
   because of it. It never tells a child what the dead knew, and nobody works the children as a ledger.
   Not a dread and not dealt by the plot: own: true keeps it out of LF.plot and the storm, and LF.friendTick opens it
   once the eldest child born here is five and there are enough of them to matter, at OPEN a year, never while Not
   Mine (s.threads.notmine) is live. Rolled in secret (t.truth.is), and each makes a different answer the right one:
     game   a game that spread. The hits are luck and the children's sharp ears; the grown's fear does the harm (the
            old one it names dies of being told). Every drastic answer was done for nothing,
            and the eldest grow out of it.
     one    one child (t.ear, the one who hears it best) is running the others, on what it overhears at the clinic
            hatch and the stores. Taking that child away from the rest ends it; keeping the child close can find
            it out. Left alone, the hits it engineers start to cost grown lives.
     world  something of this world is talking to the only people born into it, and is working up to asking for
            them. Burning the place they go to meet it ends it; giving it what it asks costs children; left alone,
            children walk out to the place at night and are not found.
     ours   a channel the ship has been talking down on, in the slow voice that woke every founder from the cold.
            It wants to be answered: answering it on the band ends it. Nothing drastic was needed, and if the ship
            is down or dark at the start the truth is rolled again.
   Evidence (the two children, the dig, the old one, the rows, the one who hears it, the place) is drawn per card and
   points at the truth only most of the time (pickK). Its bill (month): parents off the work, children lost at night,
   grown lives under one. Children lost on a card are a share of the cohorts worked out at setup and taken exactly
   (LF.gn.young); no card is a child bearing a child, none dwells on a child being hurt, and nothing is sexual.
   State: s.threads.friend, plain JSON. Dice from LF.srand. Every card's text reads only what setup put in ctx.
   Three options at most (Lachlan, 2026-11-21): each card keeps its reading (a test), a plain answer and one hard one;
   fr.choice offers two harsh measures and one option that touches nobody (its comment says which). */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, byPid } = h;
// A named person's post, for a first mention: ", your Chief Engineer," or ", a mechanic," (LF.job).
const post = (s, pid) => { const p = pid && byPid(s, pid); if (!p) return ''; const j = LF.job(p);
  return p.seat && p.role ? `, your ${j},` : j === 'Colonist' ? ', one of the colonists,' : `, ${/^[AEIOU]/.test(j) ? 'an' : 'a'} ${j.toLowerCase()},`; };
const ID = 'friend', T = s => LF.T(s, ID), SRC = 'th.friend', MONTH = LF.MONTH, YEAR = LF.YEAR;
const KINDS = ['game', 'one', 'world', 'ours'];
// The dials: the chance a year that it opens once the children are old enough, and how hard its monthly bill bites.
const OPEN = 0.3, RATE = 1.2;
const NAMES = ['Ennet', 'Sull', 'Imbry', 'Olo', 'Wemmet', 'Hobbin', 'Annic', 'Dorrow'];
const KIDS = ['Ash', 'Bryn', 'Teo', 'Sabe', 'Rook', 'Juno', 'Kit', 'Nell', 'Ode', 'Fen', 'Lark', 'Pim', 'Ari', 'Zev', 'Iko', 'Moss'];
const { num, Num, young, share, kidChip, grudge } = LF.gn;
const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
const is = (s, k) => T(s).truth.is === k;

/* ---------- where they go to meet it, by world ---------- */
const PLACE = { barren: 'the hollow under the leaning stones out on the flats', ruin: 'a roofless room in the old walls past the last row', ice: 'a snow cave in the lee of the ridge',
  drowned: 'the wreck of a reed float on the far shingle', jungle: 'a hollow trunk a little way past the cut', garden: 'a ring of grey stones on the near downs' };
const place = s => PLACE[s.world.type] || PLACE.garden;

/* ---------- evidence ---------- */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  name: {
    game: c => `Both say it in the same breath as a skipping rhyme the eldest made up in the wet month. ${c.nm} is the last word of the rhyme, the one you're out on.`,
    one: c => 'Both say they had it from somebody who knows it best, and neither will say who. Asked twice, both look at the door.',
    world: c => 'Both say it only talks when they are past the last row with the wind coming in from outside, and never indoors. The younger one points at the wire when asked where it lives.',
    ours: c => 'Both say it talks at night, low and slow, in a grown-up\'s voice, and that it says good morning when they wake. The founders were woken from the cold by a voice that talked like that.' },
  dig: {
    game: c => 'The seep shows on the old survey sheet as a damp patch, and the eldest children play on that slope every day. A child sitting on it in the wet month would have felt the cold of the water under it.',
    one: c => 'The seep is marked in the Works notebook from last season, with a question mark beside it. The notebook hangs on a nail by the schoolroom door, at a child\'s height.',
    world: c => 'Nothing on the surface says water. The bore went down through dry stuff and hit it in a crack no survey could have seen, and the crack runs straight out under the wire.',
    ours: c => `From the ground there is no sign of it. From high up there would be: the pictures the ${c.ship} took before the landing show a dark line there, and they were never brought down.` },
  spring: {
    game: c => `${c.OldF} is sound: heart, lungs and blood. What the clinic finds is somebody who has stopped sleeping since a child said a thing at the water line.`,
    one: c => `There is a murmur in ${c.oldF}'s heart, and the clinic has known of it since the winter. It is in the book on the clinic desk, under the hatch where the children hand in the water.`,
    world: c => `${c.OldF} is failing in a way the clinic has no name for, slowly, from the feet up. There was no sign of it at the last count.`,
    ours: c => `There is a fault in ${c.oldF}'s heart that nothing in the clinic would find. The cold bank aboard the ${c.ship} read every founder's heart for the whole crossing, and would have.` },
  rows: {
    game: c => `Most of them laugh when asked about ${c.nm}, and tell different stories: it is tall, it is small, it lives under the stores. The older ones are a little ashamed of it.`,
    one: c => `Asked what ${c.nm} says, the little ones answer in the same words and the same order, like a lesson. Asked who taught them, they look at the floor.`,
    world: c => `Each child tells it a little differently, and each says ${c.nm} is out past the last row, and lonely. None of them is afraid of it.`,
    ours: c => `When they do ${c.nm}'s part, each child says the same slow phrases in the same grown-up voice: hold on, not long now, are you all there. Two of the founders in the clinic leave the room.` },
  ear: {
    game: c => `${c.Ear} likes being the one who knows. With nobody to tell, ${c.ear} never mentions ${c.nm}, and plays like anyone else.`,
    one: c => `${c.Ear} knows more than any child should about the clinic book and the stores rota, and goes quiet when asked how.`,
    world: c => `${c.Ear} stops in the middle of things and turns toward the wire, and is sorry afterwards, the way a child is sorry for not listening.`,
    ours: c => `${c.Ear} sleeps by the cupboard in the school where the first year's baby monitors were put away, and can say the words of the wake call. Nobody taught the children those.` },
  place: {
    game: c => `Nothing comes. The children come instead, a few at a time, and sit in a ring and take turns being ${c.nm} in a deep voice, until one of them laughs.`,
    one: c => 'The children come at dusk and wait. One of them comes last and talks for the rest from the dark behind the ring, and the watch cannot see which.',
    world: c => `The children sit facing outward and say nothing for an hour. The watch hears nothing at all. In the morning there are ${c.wild} laid out in a row in the middle of the ring, and nobody brought them.`,
    ours: c => 'Under the litter in the middle is a cargo-drop marker from the first year, its little lamp still lit. At midnight it clicks, and a voice comes out of it too low for the watch to make out.' },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { game: 'a game the children made up and passed round', one: 'one of the children, running the rest', world: 'something out there that talks only to the children', ours: 'something with a voice the founders would know' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* ---------- people round it ---------- */
const nmR = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
/* An officer's first name if the authored officer is in the seat and at work to say a line; a promoted colonist has no voice. */
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && !p.promoted && LF.seatState(s, seat) === 'here' ? p.first : null; };
const person = (s, x) => { const p = x && x.pid && byPid(s, x.pid); return p && p.alive && !p.away && !p.orbit ? p : null; };
function crew(s) { const t = T(s), o = { nm: t.nm, ship: s.world.ship, plc: place(s), lean: lean(t), wild: LF.lex(s, 'wild') };
  for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['cm', 'command'], ['q', 'quartermaster']]) { o[k] = nmR(s, role); o[cap(k)] = cap(o[k]); }
  o.wv = voice(s, 'security'); o.dv = voice(s, 'doctor'); o.sv = voice(s, 'scientist'); o.cv = voice(s, 'command'); o.qv = voice(s, 'crew');
  const tp = person(s, t.teach); o.teach = tp ? tp.name : 'the teacher'; o.Teach = cap(o.teach); o.tpid = tp ? tp.id : null;
  o.Nm = t.nm; o.ear = t.ear; o.Ear = t.ear; o.kids = LF.kidCount(s); return o; }
/* Somebody with a name and no office, out of the crowd (thread dice only). */
const someone = (s, not) => { const a = s.people.filter(p => p.alive && !p.away && !p.orbit && !p.role && p.known && !(not || []).includes(p.id)); return a.length ? LF.spick(s, a) : null; };
const die = (s, t, n) => { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 12))); t.toll += b - s.pop; return b - s.pop; };
const lose = (s, t, n, eldest) => { const d = young(s, n, eldest); t.kids += d; return d; };
const did = (t, k) => { t.did[k] = t.did[k] || 0; t.did[k]++; };
const DRASTIC = ['split', 'strap', 'taken', 'burned'];
const drastic = t => DRASTIC.some(k => t.did[k]);

/* ---------- the bill: between cards ---------- */
const OUTW = ['A child from the far rows was missing at the dawn count. The tracks went out toward the place the children go, and stopped.', 'One of the small ones was not in the bunk this morning. The blanket was folded at the foot, the way the children leave it when they go out to it.'];
const OUTO = ['A ladder rung gave under a hand on the stores roof, as the children had said one would. The hand fell, and did not get up.', 'A cart came loose on the slope where the children said somebody would be hurt this month. The carter is dead.'];
const OUTG = ['A child ran from a shut row to a friend in the next one after dark, fell in the drain ditch, and was found too late.', 'One of the children hid in the cold store sooner than be strapped for the name, and was found there in the morning.'];
function month(s, t) {
  const k = t.truth.is, live = ['hits', 'ask', 'choice', 'bill'].includes(t.phase);
  if (!live) return;
  if (k === 'world' && !t.burned && LF.kidCount(s) > 4) { const p = 0.09 * RATE * (t.locked ? 0.3 : 1) * (t.given ? 0 : 1) * (t.angry ? 1.6 : 1);
    if (LF.srand(s) < p && lose(s, t, 1, true)) { LF.log(s, LF.spick(s, OUTW), 'bad'); if (s.pop > 16 && LF.srand(s) < 0.4 && die(s, t, 1)) LF.log(s, 'One of the child\'s parents went out after the tracks at first light, alone, and did not come back either.', 'bad'); } }
  if (k === 'one' && !t.taken && !t.caught) { const p = 0.07 * RATE * (t.split ? 0.4 : 1) * (1 + 0.5 * (t.power || 0));
    if (s.pop > 16 && LF.srand(s) < p && die(s, t, 1)) { t.hits++; LF.log(s, LF.spick(s, OUTO), 'bad'); } }
  if ((t.split || t.strap) && LF.kidCount(s) > 4 && LF.srand(s) < 0.05 * RATE * ((t.split ? 1 : 0) + (t.strap ? 1 : 0)) && lose(s, t, 1)) LF.log(s, LF.spick(s, OUTG), 'bad');
  // ours: the children sit up for the voice, and the parents with them
  if (k === 'ours' && !t.answered) s.morale = clamp(s.morale - 0.3, 0, 100);
}
/* The old one it named: by the spring, or not. Under game only the telling kills. */
function spring(s, t) {
  const o = t.old; if (!o || o.done || s.day < o.by) return; o.done = s.day;
  const p = o.pid && byPid(s, o.pid), alive = !o.pid || (p && p.alive);
  const dies = alive && (t.truth.is !== 'game' || (o.told && LF.srand(s) < 0.65));
  if (!alive) return;
  if (dies) { t.hits++; o.died = true; if (p) { LF.killPerson(s, p, `died before the spring, as the children's friend had said`); t.toll++; } else die(s, t, 1);
    LF.log(s, `${cap(o.name)} died in the night, before the spring, as ${t.nm} had said.`, 'bad'); LF.emit(s, 'fear', SRC, 32, 60, `${o.name} died before the spring, as the children said`); }
  else { t.miss++; LF.log(s, `The spring came, and ${o.name} saw it. Some of the children say ${t.nm} was wrong, and some say it changed its mind.`, 'good'); }
}

/* ---------- the end ---------- */
function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^fr\./.test(e.id)); s.sched.push({ id: 'fr.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
function resolve(s, t) {
  const k = t.truth.is, n = t.nm;
  if (k === 'game') return finish(s, t, drastic(t) ? 'needless' : 'outgrown', drastic(t) ? `The children's friend ${n} was a game. The colony did what it did about it before it found that out.` : `The children's friend ${n} was a game, and the eldest grew out of it.`);
  if (k === 'one') { if (t.taken) return finish(s, t, 'found', `The child who heard ${n} best was taken from the others, and ${n} stopped.`);
    if (t.caught) return finish(s, t, 'caught', `One child had been running ${n}, and was found out.`);
    if (t.split) return finish(s, t, 'cut', `The children were kept apart until ${n} faded.`);
    const d = die(s, t, clamp(Math.round(LF.sized(s) * 0.02), 2, 4)); if (d) LF.log(s, `Before it was over, ${num(d)} more of the grown were hurt where the children said they would be, and died of it.`, 'bad');
    return finish(s, t, 'ran', `One child ran ${n} until the others grew out of it, and grown people died of what it arranged.`); }
  if (k === 'world') { if (t.burned) return finish(s, t, 'burned', `The colony burned the place the children went to meet ${n}, and it never spoke to them again.`);
    if (t.given) return finish(s, t, 'given', `The colony gave ${n} the children's night it asked for, and it went quiet.`);
    const sh = share(s, 0.03, 1, 12), d = lose(s, t, sh, true); die(s, t, 1); if (d) LF.log(s, `Before the season turned, ${num(d)} of the children walked out to ${place(s)} in the night and were never found.`, 'bad');
    s.morale = clamp(s.morale - 3, 0, 100); return finish(s, t, 'took', `${n} called the children out past the wire, and some of them went.`); }
  if (t.answered) return finish(s, t, 'answered', `The colony answered the voice on the old band, and ${n} stopped talking to the children.`);
  s.morale = clamp(s.morale - 4, 0, 100); return finish(s, t, s.flags.ship_down ? 'fell' : 'unanswered', s.flags.ship_down ? `The voice the children called ${n} stopped when the ship came down.` : `The voice the children called ${n} stopped, and was never answered.`);
}

LF.thread({ id: ID, name: 'The Friend', view: 'people', own: true,
  clue: (s, t) => ({ txt: 'A school slate with the same short word chalked in the corner by a dozen different hands, some of them too young to write anything else.', learn: s2 => learn(s2, T(s2), 12) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'name' ? 'the name in the rows' : t.nm,
  roll: s => { const ok = !s.flags.ship_down && !s.flags.qs_dark; return { is: LF.spick(s, ok ? KINDS : KINDS.filter(k => k !== 'ours')) }; },
  sig: t => t.truth.is,
  ask: (s, t) => `Who is ${t.nm}?`,
  chap: {
    outgrown: t => `The children born here all had the same friend, ${t.nm}. It was a game, and the hits were luck, and the eldest grew out of it.`,
    needless: t => `The children born here all had the same friend, ${t.nm}. It was a game, and the colony ${t.did.burned ? 'burned the place they played it' : t.did.taken ? 'took a child away from the others' : t.did.strap ? 'strapped its children for saying a name' : 'kept its children apart'} before it found that out.`,
    found: t => `One child was running the friend the others called ${t.nm}. The colony took that child away from the rest, and it stopped.`,
    caught: t => `One child was running the friend the others called ${t.nm}, on what it heard at the clinic hatch, and was found out.`,
    cut: t => `One child was running the friend the others called ${t.nm}. The colony kept its children apart until it faded.`,
    ran: t => `One child ran the friend the others called ${t.nm}, and grown people died where it said they would.`,
    burned: t => `Something of this world talked to the children born here, and they called it ${t.nm}. The colony burned the place they met it, and it stopped.`,
    given: t => `Something of this world talked to the children born here, and they called it ${t.nm}. The colony gave it the night it asked for, and paid in children.`,
    took: t => `Something of this world talked to the children born here, and they called it ${t.nm}. It called some of them out past the wire, and they went.`,
    answered: t => `The voice the children called ${t.nm} came down from the ship on the old crèche band. The colony answered it, and it stopped.`,
    unanswered: t => `The voice the children called ${t.nm} came down from the ship on the old crèche band, and nobody ever answered it.`,
    fell: t => `The voice the children called ${t.nm} came down from the ship, and stopped when the ship came down.`,
  },
  start: (s, t) => { const teach = someone(s), kid = LF.spick(s, KIDS);
    Object.assign(t, { at: s.day + LF.sri(s, 5, 30), d0: s.day, nm: LF.spick(s, NAMES), ear: kid, teach: teach ? { pid: teach.id, name: teach.name } : null, old: null,
      insight: 0, ev: {}, did: {}, q: {}, toll: 0, kids: 0, hits: 1, miss: 0, power: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'name', `The children born here started talking about a friend called ${t.nm}.`); LF.cue(s, 'fr.name', 0, 4); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    const jump = (id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
    if (t.phase === 'name') { if (since('fr.name') >= 10 || age >= 60) { LF.phase(s, ID, 'hits'); LF.cue(s, 'fr.dig', 0, 4); } }
    else if (t.phase === 'hits') {
      if (since('fr.dig') >= 10) once('spring', 'fr.spring');
      if (since('fr.spring') >= 10) once('school', 'fr.school');
      if (since('fr.school') >= 10) once('ear', 'fr.ear');
      if (since('fr.ear') >= 10) once('place', 'fr.place');
      if (since('fr.place') >= 12 || age >= 220) { LF.phase(s, ID, 'ask', `The children said ${t.nm} had asked for something.`); LF.cue(s, 'fr.ask', 0, 4); } }
    else if (t.phase === 'ask') { if (since('fr.ask') >= 14 || age >= 60) { LF.phase(s, ID, 'choice'); jump('fr.choice', 20); } }
    else if (t.phase === 'choice') { if (since('fr.choice') >= 20 || age >= 60) { LF.phase(s, ID, 'bill'); jump('fr.after', 20); } }
    else if (t.phase === 'bill') { if (since('fr.after') >= 20 || age >= 70) return resolve(s, t); }
    spring(s, t);
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) { const late = ['ask', 'choice', 'bill'].includes(t.phase);
      if (t.insight < 60) LF.emit(s, 'unexplained', SRC, 26, 8, `the children born here all have the same friend, ${t.nm}, and it gets things right`);
      if (t.phase !== 'name') LF.emit(s, 'fear', SRC, late ? 30 : 22, 8, `parents are afraid of what their children's friend ${t.nm} says`);
      if (t.split || t.locked) LF.emit(s, 'confinement', SRC, 24, 8, t.split ? 'the children are kept to their own rows' : 'the children are locked in at dusk');
      if (t.strap || t.did.taken) LF.emit(s, 'resentment', SRC, 22, 8, t.strap ? 'children are strapped for saying a name' : 'a child was taken from the others on account of a name'); }
  },
  /* Parents who sit up, rows kept apart, and the gate barred at dusk. */
  press: (s, t, Pr) => { if (t.end || t.phase === 'latent' || t.phase === 'name') return;
    let d = 0.006; if (t.split) d += 0.025; if (t.locked) d += 0.01; Pr.labor -= d; if (t.strap) Pr.morale -= 0.01; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* ======================= NAME: two rows ======================= */
B('name', { id: 'fr.name', tone: 'pressure', title: 'A Name in Two Rows',
  setup: s => { const t = T(s), C = LF.children(s), a = LF.spick(s, KIDS.filter(k => k !== t.ear)), b = LF.spick(s, KIDS.filter(k => k !== t.ear && k !== a));
    return Object.assign(crew(s), { ev: pickK(s, t), a, b, ageA: num(Math.max(5, C.eldest)), ageB: num(Math.max(3, C.eldest - 2)) }); },
  text: (s, c) => `In the morning a ${c.ageA}-year-old in the east rows called ${c.a} told ${c.teach}${c.tpid ? ', who runs the school,' : ''} that ${c.nm} said the rain would come before the noon bell. It did. By evening ${c.b}, who is ${c.ageB} and lives at the far end of the colony, had said the same name to a different grown-up about something else. The two have never played together. Their rows do not share a yard.\n\n${c.wv ? `[[security]] "Same friend at opposite ends of the wire, two children who've never shared a yard, so who's been talking to both of them? That's the first thing I'd ask." "So it's either coaching or something worse, and I'd like to ask it for a surname and what's for supper next month and see how it likes being questioned."` : `${c.W} has written the name down and asked the school whether anyone else says it.`}`,
  choices: [
    { label: 'Have the school ask each child, gently, who it is and what it says', note: 'Every child in the school is asked about it by a grown-up, and learns that the grown-ups are frightened of it.', test: { base: 50, mods: [R('physician', 10), R('command', 5)] },
      ok: { text: (s, c) => `It takes a week of mornings. Most of the children know the name, and the ones who don't learn it from being asked. ${ev('name', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 20, c.ev) }) },
      bad: { text: (s, c) => `The children answer the first morning and stop by the third. By the end of the week they say ${c.nm} to each other and not to anyone grown.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Leave it. Children have friends nobody else can see', note: 'If it is anything, nobody is watching it start, and the parents lie awake listening at the bunk curtain.',
      out: { text: (s, c) => `Nothing is said to the children. By the end of the month the name is in every row, and the parents compare what their own child has said at the wash trough, quietly.`, fx: s => ({ food: -20, do: s2 => learn(s2, T(s2), 2) }) } },
    { label: (s, c) => `Keep ${c.a} and ${c.b} in the clinic's end room for a month, away from the others`, dark: true, note: 'Two children are shut away from their rows to see whether the name stops with them, and their parents are let in at meals.', info: (s, c) => [['yield', 'What it is'], ['danger', `${c.a} and ${c.b}, and their parents`]],
      out: { text: (s, c) => `The two are put in the end room with a cot each and a box of the school's slates. They say ${c.nm} to each other the first night. ${ev('name', c.ev, c)}`, fx: (s, c) => ({ stain: ['fr_twokids', 1], do: s2 => { const t = T(s2); learn(s2, t, 24, c.ev); t.did.two = 1; } }) } },
  ] });

/* ======================= HITS: the dig, the old one, the rows, the one who hears it, the place ======================= */
B('hits', { id: 'fr.dig', view: 'colony', tone: 'pressure', title: 'Where to Dig',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s), 0.05), slope: LF.spick(s, ['the slope behind the east rows', 'the corner of the yard by the old pods', 'the bare ground past the latrines']) }),
  text: (s, c) => `The children said ${c.nm} said there was water under ${c.slope}, and that the grown should dig. ${c.Q} dug there yesterday to stop them saying it. Four metres down there is a seep of clean water, cold and steady, where every survey the colony has made says there is none.\n\n${c.sv ? `[[scientist]] "Four metres." "Four, and we drilled sixty metres off and got dust, so how does a kid know, no, never mind how, I'll get to how, I want to walk that ground tonight, with a lamp, before anyone else does."` : `${c.Sc} wants to know how a child could have known it.`}`,
  choices: [
    { label: 'Send Science over the ground to find how a child could have known', note: 'The survey crew loses its month to a hole in the yard, and the children watch them do it.', test: { base: 50, mods: [R('scientist', 10)] },
      ok: { text: (s, c) => `They walk the slope with the old sheets and the new bore log. ${ev('dig', c.ev, c)}`, fx: (s, c) => ({ food: 30, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'They walk the slope for a week and come back with a map of where they walked. The children ask them what they found, and laugh.', fx: s => ({ food: 30, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Sink a well there, and give the children\'s rows the first draw', note: 'The colony drinks from a well a voice nobody can see chose, and the parents know it.',
      out: { text: (s, c) => `The well is lined by the end of the month. The children carry the first buckets, and pour a cup out on the ground for ${c.nm} before they drink. Some of the parents will not drink from it.`, fx: s => ({ food: 60, morale: -1, do: s2 => { learn(s2, T(s2), 3); LF.emit(s2, 'fear', 'fr.well', 18, 60, 'the colony drinks from a well the children\'s friend chose'); } }) } },
    { label: 'Fill it in, and tell the children it was dry', dark: true, note: 'The colony gives up good water sooner than drink what a child\'s friend found, and the children are lied to by everyone they trust.', info: [['yield', 'Nothing it said comes true'], ['danger', 'The water, and the children']],
      out: { text: (s, c) => `The seep is filled at dusk and tamped flat. The children are told it was dry. The next morning a child is found lying on the tamped ground with an ear to it.`, fx: s => ({ morale: 1, tension: -3, stain: ['fr_filled', 1], do: s2 => { const t = T(s2); t.did.filled = 1; t.miss++; LF.ease(s2, 'fear', 'fr.filled', 10, 60); } }) } },
  ] });

B('hits', { id: 'fr.spring', tone: 'pressure', title: 'Before the Spring',
  setup: s => { const t = T(s), c = crew(s), p = someone(s, [c.tpid]), by = s.day + LF.sri(s, 30, 60);
    t.old = { pid: p ? p.id : null, name: p ? p.name : 'the oldest of the net menders', by, told: false };
    return Object.assign(c, { ev: pickK(s, t, 0.08), opid: p ? p.id : null, old: t.old.name, oldF: p ? p.first : 'the old mender', OldF: p ? p.first : 'The old mender', kid: LF.spick(s, KIDS.filter(k => k !== t.ear)) }); },
  text: (s, c) => `At the water line this morning a child called ${c.kid} looked up at ${c.old}${post(s, c.opid)} and said that ${c.nm} says ${c.oldF} will not see the spring. ${c.OldF} laughed and finished filling the can. By supper ${c.oldF} had heard it again, from three people who were sorry to say so.\n\n${c.dv ? `[[physician]] "There's nothing wrong with ${c.oldF} that I know of, and it's been eating at that poor soul all day that I can't say more." "That's what frightens me, so let me look, and keep the child away from the ward while I do."` : `${c.D} has asked to see ${c.oldF} in the clinic.`}`,
  choices: [
    { label: (s, c) => `Have the clinic go over ${c.oldF}`, about: true, note: (s, c) => `${c.OldF} is told why, and goes into the clinic knowing what the children said.`, test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The clinic spends a day on it. ${ev('spring', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 24, c.ev); if (t.old) t.old.told = true; } }) },
      bad: { text: (s, c) => `The clinic finds nothing and says so. ${c.OldF} goes home with a clean bill and does not believe it.`, fx: s => ({ do: s2 => { const t = T(s2); learn(s2, t, 5); if (t.old) t.old.told = true; } }) } },
    { label: (s, c) => `Have the child told never to say a thing like that again, and keep it from ${c.oldF}`, note: (s, c) => `If it is true, ${c.oldF} has no warning. A child is told off for saying what it heard.`,
      out: { text: (s, c) => `${c.kid} is spoken to at school and cries. The water line is told it was a child's spite. ${c.OldF} hears it as a joke, and makes one of it at supper.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 2) }) } },
    { label: (s, c) => `Put ${c.oldF} on the haul crew till the spring, to show the hall the friend is wrong`, dark: true, note: (s, c) => `${c.OldF} works the hardest shift there is at that age to make a point for you, and everyone knows why.`, info: (s, c) => [['yield', 'Materials'], ['danger', c.OldF]],
      out: { text: (s, c) => `${c.OldF} is on the haul line at first light, between two who are a third of that age, and keeps the pace. The hall watches, and so do the children.`, fx: s => ({ mat: 20, stain: ['fr_spite', 1], do: s2 => { const t = T(s2); if (t.old) { t.old.told = true; t.old.by = Math.max(s2.day + 10, t.old.by - 15); } t.did.spite = 1; } }) } },
  ] });

B('hits', { id: 'fr.school', tone: 'pressure', title: 'What the Rows Want',
  setup: s => { const t = T(s), k = LF.kidCount(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.08), n: clamp(Math.round(k / 4), 6, 60), hit: t.hits, miss: t.miss, kd: share(s, 0.01, 1, 3) }); },
  text: (s, c) => `${Num(c.n)} parents have put their names to a paper asking for ${c.nm} to be stopped, and the school wants to know how. In every row the children now stop before they answer a grown-up, as if asking ${c.nm} first, and then answer. ${c.hit > c.miss ? `The parents count ${c.hit === 1 ? 'one thing' : `${num(c.hit)} things`} it has got right.` : 'The parents count what it got right and forget what it got wrong.'}\n\n${c.Cm} wants an order before the next bell.`,
  choices: [
    { label: 'Keep every child to its own row. No mixing, and the school shut', dark: true, note: 'The children are kept apart from each other for as long as it takes, and their parents keep them.', info: [['yield', 'Nothing passes from row to row'], ['danger', 'The children, and the parents\' work']],
      out: { text: (s, c) => `Chalk lines go down between the rows. The school is locked, and each household keeps its own children from dawn to dark. The first week a few run between the rows at night${c.kd ? `, and ${c.kd === 1 ? 'one of them is' : `${num(c.kd)} of them are`} found in the drain ditch` : ' and are walked back'}.`,
        fx: (s, c) => ({ tension: -5, stain: ['fr_split', 2], chips: c.kd ? kidChip(c.kd) : undefined, do: s2 => { const t = T(s2); t.split = s2.day; did(t, 'split'); if (c.kd) lose(s2, t, c.kd); } }) } },
    { label: 'Let the school go on, and have the clinic sit with each child once', note: 'The clinic gives the school a month, and the sick wait for it.', test: { base: 50, mods: [R('physician', 10), R('command', 5)] },
      ok: { text: (s, c) => `Someone from the clinic sits with each of them for the length of a story. ${ev('rows', c.ev, c)}`, fx: (s, c) => ({ food: -20, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The clinic is behind by the end of the first week and stops. A field hand with a fever waited four days for a bed and is still not right.', fx: s => ({ food: -20, morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Tell the parents it will pass, and to leave it alone', note: 'The parents who are afraid of their own children are told to live with it.',
      out: { text: (s, c) => `It is said at the evening meal. Some of the parents nod. The ones who signed the paper sit together afterwards and do not look up when ${c.nm} is mentioned at the next table.`, fx: s => ({ morale: -2, tension: 4 }) } },
  ] });

B('hits', { id: 'fr.ear', tone: 'pressure', title: 'The One Who Hears It Best',
  setup: s => { const t = T(s), C = LF.children(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.1), age: num(clamp(C.eldest - 1, 5, 11)), caught: t.truth.is === 'one' ? LF.srand(s) < 0.6 : false }); },
  text: (s, c) => `Of all of them, ${c.ear} hears ${c.nm} clearest. The others go to ${c.ear} to ask what ${c.nm} said, and ${c.ear} tells them, and they do it. ${c.Ear} is ${c.age}, and has stopped playing with anyone.\n\n${c.dv ? `[[physician]] "Whatever this is, it's a child doing it, and a lonely one, who's stopped playing with anybody." "So before you say whatever you're about to say, you remember that, and if you want ${c.ear} for something you come through me first."` : `${c.D} has asked to be told before anything is done.`}`,
  choices: [
    { label: (s, c) => `Take ${c.ear} away from the rest: to a keeper's hut at the far field, alone, until it stops`, dark: true, note: (s, c) => `${c.Ear} is taken from family, school and every other child, on account of a name.`, info: (s, c) => [['yield', 'Whatever is passing through the child, stopped'], ['danger', `${c.Ear}, and the family`]],
      out: { text: (s, c) => `${c.W} takes ${c.ear} at first light, with a bag packed by the parents. The other children stand at the row ends to watch the cart go. The keeper at the far field sends word each week that ${c.ear} eats and does not talk.`,
        fx: s => ({ tension: -3, stain: ['fr_taken', 3], do: s2 => { const t = T(s2); t.taken = s2.day; did(t, 'taken'); } }) } },
    { label: (s, c) => `Keep ${c.ear} close, and listen`, note: (s, c) => `Whoever goes gives up their work to one child, and the rest of the school goes to whoever has a spare hour.`, test: { base: 50, mods: [R('command', 10), R('physician', 5)] },
      ok: { text: (s, c) => `A month at ${LF.sentName(s, 'command')}'s elbow. ${ev('ear', c.ev, c)}${c.caught ? ` In the last week ${c.ear} tells ${LF.sentName(s, 'command')} how it is done, and seems glad to.` : ''}`, fx: (s, c) => ({ food: -20, do: s2 => { const t = T(s2); learn(s2, t, 18, c.ev); if (c.caught) t.caught = s2.day; } }) },
      bad: { text: (s, c) => `${c.Ear} is polite and tells ${LF.sentName(s, 'command')} nothing. The other children go to ${c.ear} at break as before.`, fx: s => ({ food: -20, do: s2 => learn(s2, T(s2), 4) }) } },
    { label: (s, c) => `Leave ${c.ear} with the others`, note: (s, c) => `If it comes through ${c.ear}, it goes on coming, to all of them.`,
      out: { text: (s, c) => `Nothing is done. ${c.Ear} sits at the centre of a ring at every break, and the ring is bigger each week.`, fx: s => ({ do: s2 => { const t = T(s2); t.power++; } }) } },
  ] });

B('hits', { id: 'fr.place', view: 'world', tone: 'pressure', title: 'Where They Go',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s), 0.1), wdie: LF.srand(s) < 0.5 }),
  text: (s, c) => `The children have been going out at dusk, a few at a time, to ${c.plc}, and coming back after dark. That is where ${c.nm} is, they say, and it is easier to hear there. The gate watch has let them through for a month because nobody told the watch not to.\n\n${c.wv ? `[[security]] "So I've got children walking out past my wire at dusk to talk to nobody, and who's holding the gate for them? My own gate watch, that's who." "And I'm to put that in the log under weather, am I, which is grand."` : `${c.W} wants an order for the gate.`}`,
  choices: [
    { label: (s, c) => `Burn it, and have the children turned out to watch`, dark: true, note: 'The place is gone, and every child learns what the grown do to the things they love.', info: [['yield', 'Nowhere left to meet it'], ['danger', 'The children']],
      out: { text: (s, c) => `It is done at dusk with the school lined up at the wire. Whatever would burn there burns, and the rest is broken with bars. The children watch it without a sound. ${c.ev === 'ours' ? 'In the ashes the watch finds a small cargo-drop marker from the first year, melted.' : ''}`.trim(),
        fx: s => ({ tension: -4, stain: ['fr_burn', 2], do: s2 => { const t = T(s2); t.burned = s2.day; did(t, 'burned'); grudge(s2, 1); } }) } },
    { label: 'Put two of the watch there through the night, and see what comes', note: 'Two of the watch sit past the wire in the dark, where the children say something is.', test: { base: 50, mods: [R('security', 10), R('scientist', 5)] },
      ok: { text: (s, c) => `They go out with a lamp and a rifle and come back at dawn. ${ev('place', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `They go out with a lamp and a rifle. At dawn one comes back and the other ${is(s, 'world') && c.wdie ? 'does not. The tracks go out from the ring and stop' : 'is found asleep by the ring with the lamp out, and nothing to report'}.`,
        fx: (s, c) => ({ pop: is(s, 'world') && c.wdie ? -1 : 0, do: s2 => { const t = T(s2); learn(s2, t, 6); if (is(s2, 'world') && c.wdie) t.toll++; } }) } },
    { label: 'Let them go, with one of the grown walking behind', note: 'One of the grown goes out past the wire every dusk with them, to wherever they are going.',
      out: { text: (s, c) => `A field hand walks behind them with a lamp, each dusk, and waits at the edge of the ring. The field hand says it is the most peaceful hour of the day, and will not say more.`, fx: s => ({ do: s2 => { const t = T(s2); learn(s2, t, 6); t.walked = 1; } }) } },
  ] });

/* ======================= ASK: what it wants ======================= */
const ASK = {
  game: c => `a feast at ${c.plc} with all the children, and a song for ${c.nm}`,
  one: c => 'one family put out of the east rows: the family of a child who fought with a good many of the others last winter',
  world: c => `every child out at ${c.plc} for one whole night, with no grown-up there`,
  ours: c => 'the grown-ups to come to it and say their names, all of them, one at a time',
};
const GIVE = {
  game: c => 'The feast is laid at dusk and the children sing a song nobody taught them, badly, and eat everything.',
  one: c => 'The family is moved to the far rows with their things on a cart. Their child walks behind it, and the other children watch from the row ends.',
  world: c => 'At dusk every child walks out past the wire in a long file and the gate is shut behind them. The parents stand at the wire all night.',
  ours: c => 'The founders go to the place one at a time over a week of nights, and say their names into the dark. Some of them weep.' };
const GOT = {
  game: c => 'Nothing comes of it but a full store of leftovers and children who sleep through to the bell.',
  one: c => `The children say ${c.nm} is pleased. The family who were moved say their child has nobody to sit with now.`,
  world: c => c.gone ? `At dawn the file comes back in, and the count at the gate is short by ${num(c.gone)}. The ones who came back say ${c.nm} has gone quiet.` : 'At dawn the file comes back in, every one, cold and quiet.',
  ours: c => `On the last night the voice at the place says each name back, slowly, and says thank you, and says goodnight.` };
B('ask', { id: 'fr.ask', tone: 'crisis', title: 'What It Wants',
  setup: s => { const t = T(s), e = pickK(s, t, 0.12), c = crew(s), gone = t.truth.is === 'world' && e === 'world' ? share(s, 0.025, 1, 8) : 0, cold = e === 'world' && t.truth.is !== 'world' && LF.srand(s) < 0.3 ? 1 : 0;
    return Object.assign(c, { ev: e, gone, cold, ask: ASK[e](c) }); },
  text: (s, c) => `The children came to the hall together this evening, which they have never done, and the smallest said it for them: ${c.nm} has asked for something. It wants ${c.ask}. They will not say what happens if it does not get it, because ${c.nm} has not said.\n\n${c.lean}`,
  choices: [
    { label: 'Give it what it asks', note: 'Whatever it is, it is done on the word of children, and whoever it falls on carries it.',
      out: { text: (s, c) => `${GIVE[c.ev](c)} ${GOT[c.ev](c)}${c.cold ? ' One of the smallest took a chill out there and did not get up again.' : ''}`,
        fx: (s, c) => ({ food: c.ev === 'game' ? -30 : 0, morale: c.ev === 'game' ? 3 : c.ev === 'one' ? -2 : 0, tension: c.ev === 'one' ? 4 : 0, chips: c.gone || c.cold ? kidChip(c.gone + c.cold) : undefined,
          do: s2 => { const t = T(s2), k = t.truth.is; t.did.gave = c.ev; if (c.gone || c.cold) lose(s2, t, c.gone + c.cold, !!c.gone);
            if (k === 'world' && c.ev === 'world') { t.given = s2.day; s2.res.food += 60; }
            if (k === 'ours' && c.ev === 'ours') t.answered = s2.day;
            if (k === 'one' && c.ev === 'one') t.power++; } }) } },
    { label: 'Refuse, and tell the children why', note: 'The children carry the refusal back to it, and whatever it does next, it does to them first.',
      out: { text: (s, c) => `You tell them in the hall, plainly. The smallest nods as if it had expected that, and they file out. That night the rows are very quiet.`, fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.did.refused = 1; if (t.truth.is === 'world') t.angry = s2.day; } }) } },
    { label: 'Send the watch out to the place the children go, in their stead', dark: true, note: 'The children are put to bed early and told nothing, and the watch goes out to the place with rifles instead.', info: [['yield', 'Whatever comes, met by rifles'], ['danger', 'The watch, and the children\'s trust']],
      out: { text: (s, c) => `The children are put to bed early and the watch goes out at dark. ${is(s, 'world') ? 'Two of the watch are not at the gate at dawn, and the rest did not see them go.' : is(s, 'ours') ? 'At midnight a voice in the dark asks them their names. They do not give them, and come back unnerved.' : is(s, 'one') ? 'Nothing comes. In the morning one of the children asks the watch how the night went, and smiles.' : 'Nothing comes, all night. The children ask in the morning why the watch was out there.'}`,
        fx: s => ({ pop: is(s, 'world') ? -2 : 0, stain: ['fr_bait', 1], do: s2 => { const t = T(s2); t.did.bait = 1; if (t.truth.is === 'world') { t.toll += 2; t.angry = s2.day; } learn(s2, t, 15, t.truth.is); } }) } },
  ] });

/* ======================= CHOICE: the ways to end it ======================= */
const onMenu = k => (s, c) => (c.menu || ['taken', 'burned']).includes(k);   // a card saved before 2026-11-21 has no c.menu
B('choice', { id: 'fr.choice', tone: 'crisis', title: 'Ways to End It',
  /* Three on screen at most (2026-11-21), by c.menu. Two harsh measures: taking the child and burning the place, the two
     that are the answer under some truth; where one has been done already its stand-in takes its place (the rows kept
     apart for the child, the strap for the place), and a measure already taken is never offered again. The third is to
     touch nobody: letting it run and listening on every band, folded into one option whose outcome reads the truth. */
  setup: s => { const t = T(s), c = crew(s), menu = [!t.did.taken ? 'taken' : !t.did.split ? 'split' : null, !t.did.burned ? 'burned' : !t.did.strap ? 'strap' : null].filter(Boolean); return Object.assign(c, { mo: (m => m < 10 ? `${num(m)} months` : m < 15 ? 'about a year' : m < 21 ? 'more than a year' : 'nearly two years')(Math.max(2, Math.round((s.day - t.d0) / MONTH))), menu,
    kd: share(s, 0.015, 1, 4), caughtNow: t.truth.is === 'one' && LF.srand(s) < 0.35 }); },
  text: (s, c) => `${c.Nm} has been in the rows ${c.mo}. ${c.Ear} still hears it best, and the children still ask it before they answer anyone. ${c.Cm} wants it ended, the parents want their children back, and ${c.d} wants nobody touched on the word of a name.\n\n${c.lean} The school has been told there will be an order tonight.`,
  choices: [
    { label: 'Keep every child to its own row until it stops', dark: true, show: onMenu('split'), note: 'The children are kept from each other for a season, and the parents from their work.', info: [['yield', 'Nothing passes between them'], ['danger', 'The children, and the parents\' work']],
      out: { text: (s, c) => `The chalk lines go down between the rows and the school is locked.${c.kd ? ` ${c.kd === 1 ? 'One child' : `${Num(c.kd)} children`} running between the rows after dark ${c.kd === 1 ? 'is' : 'are'} not found until morning.` : ''}`, fx: (s, c) => ({ tension: -5, stain: ['fr_split', 2], chips: c.kd ? kidChip(c.kd) : undefined, do: s2 => { const t = T(s2); t.split = s2.day; did(t, 'split'); if (c.kd) lose(s2, t, c.kd); } }) } },
    { label: 'Forbid the name, with the strap', dark: true, show: onMenu('strap'), note: 'The parents get a rule, and the children are beaten for a word.', info: [['yield', 'Morale'], ['danger', 'The children']],
      out: { text: (s, c) => `The rule is read at every row end. The strap is used that week, and the next. The name goes out of the rows as far as any grown-up can hear.`, fx: s => ({ morale: 3, tension: -4, stain: ['fr_strap', 2], do: s2 => { const t = T(s2); t.strap = s2.day; did(t, 'strap'); grudge(s2, 1); } }) } },
    { label: (s, c) => `Take ${c.ear} away from the others for good`, dark: true, show: onMenu('taken'), note: (s, c) => `${c.Ear} is sent to live at the far field with a keeper, away from every other child.`, info: (s, c) => [['yield', 'Whatever comes through the child, stopped'], ['danger', c.Ear]],
      out: { text: (s, c) => `${c.Ear} goes on the morning cart with a keeper and a bag. The parents walk beside the cart as far as the gate.`, fx: s => ({ tension: -3, stain: ['fr_taken', 3], do: s2 => { const t = T(s2); t.taken = s2.day; did(t, 'taken'); } }) } },
    { label: (s, c) => `Burn the place they go to meet it`, dark: true, show: onMenu('burned'), note: 'The place is burned and broken, and the children are not asked.', info: [['yield', 'Nowhere left to meet it'], ['danger', 'The children']],
      out: { text: (s, c) => `It burns at dusk. The children are kept in the school and smell it through the shutters.`, fx: s => ({ tension: -4, stain: ['fr_burn', 2], do: s2 => { const t = T(s2); t.burned = s2.day; did(t, 'burned'); grudge(s2, 1); } }) } },
    { label: 'Let it run, and listen on every band at night for whatever is there', note: 'Nobody is taken, burned or strapped on a guess. The radio crew gives up its nights and a box of spares, and whatever it is keeps the children while they listen.', info: [['danger', 'The children, in the meantime']],
      out: { text: (s, c) => is(s, 'ours') ? `On the third night, on the old crèche band nobody retuned, there is a slow voice saying good morning. ${c.Cm} answers it with the colony's name, and then with everyone's.` : `You say it once: no order tonight. The parents go home, and the radio crew sits a month of nights with the headsets on. There is static and nothing else. ${c.caughtNow ? `Before the month is out ${c.teach} finds ${c.ear} at the clinic hatch with an ear to the board, and the whole thing comes out in an afternoon.` : 'The children go to bed and say goodnight to it.'}`,
        fx: (s, c) => ({ morale: -1, parts: -3, do: s2 => { const t = T(s2); t.did.listen = 1; t.did.hold = 1; if (c.caughtNow) t.caught = s2.day; if (t.truth.is === 'ours') { t.answered = s2.day; learn(s2, t, 30, 'ours'); } } }) } },
  ] });

/* ======================= BILL: a month on ======================= */
B('bill', { id: 'fr.after', tone: 'pressure', title: 'A Month On',
  setup: s => { const t = T(s), k = t.truth.is, w = ({ game: true, one: !!(t.taken || t.caught || t.split), world: !!(t.burned || t.given), ours: !!t.answered })[k]; return Object.assign(crew(s), { slow: LF.srand(s) < 0.78 ? w : !w }); },
  text: (s, c) => `It is a month since the order. ${c.Teach}${c.tpid ? ', who runs the school,' : ''} keeps a tally of how often the name is said in school, for whoever wants to see it. ${c.slow ? `${c.Nm} came up twice this month, both times from the smallest.` : `${c.Nm} came up every day this month, and the tally has run onto a second slate.`}\n\n${c.lean}`,
  choices: [
    { label: 'Hold to what was ordered, and give it the season', note: 'If the order was wrong, it has the children for another season.',
      out: { text: 'Nothing is changed. The tally goes on, and the parents stop asking to see it.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.held = 1; } }) } },
    { label: (s, c) => `Ask the children what ${c.nm} says now`, note: 'The children are asked again, and learn again that the grown are watching.', test: { base: 50, mods: [R('physician', 10), R('command', 5)] },
      ok: { text: (s, c) => `They tell it as they always have. ${is(s, 'world') ? `${c.Nm} is sad, they say, and further off.` : is(s, 'ours') ? `${c.Nm} asks if everyone is still there.` : is(s, 'one') ? 'The little ones look at each other before they answer.' : 'Half of them have forgotten the rhyme it came from.'}`, fx: s => ({ do: s2 => learn(s2, T(s2), 15, T(s2).truth.is) }) },
      bad: { text: 'They say nothing at all, politely, one after another.', fx: s => ({ morale: -1 }) } },
    { label: 'Send the eldest who still say it out to the far field crews', dark: true, note: 'The children who will not let it go are put to work away from the rest, and the yard gets their hands.', info: [['yield', 'Materials'], ['danger', 'The eldest children']],
      out: { text: 'The eldest are listed by who still says the name, and the list goes out on the cart to the far field. They work, and send nothing home.', fx: s => ({ mat: 25, stain: ['fr_sent', 2], do: s2 => { const t = T(s2); t.did.sent = 1; if (t.truth.is === 'one') t.power = Math.max(0, t.power - 1); grudge(s2, 1); } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  game: n => `${n} was a game. The eldest made it up in a wet month, at the end of a skipping rhyme, and it went from row to row the way games do. What it got right was luck and sharp ears: the rain, the water a child had felt cold under a slope.`,
  one: n => `${n} was one child's work. It began as a game. Then one of them found that the others would do what ${n} said, and that the clinic hatch and the stores door let a small listener hear what the grown were short of and who was sick.`,
  world: n => `${n} was something of this world. It talked to the only people born into it, from outside the wire, and it was lonely, and it wanted them.`,
  ours: n => 'It was the ship. The children heard it on the old crèche band, in the slow voice of the wake call that brought every founder out of the cold, talking down to whoever would listen. It read the ground and the founders\' hearts from up there, and it wanted to be answered.',
};
const TAIL = { outgrown: 'It went the way games go.', needless: 'It would have gone the way games go.', found: 'Away from the others, the child had nobody to tell.', caught: 'Found out, the child stopped.', cut: 'Kept apart, the others stopped listening.',
  ran: 'Nobody stopped it.', burned: 'With the place gone, it never spoke to them again.', given: 'It took what it was given and went quiet.', took: 'It called, and some of them went.', answered: 'Answered, it stopped.', unanswered: 'It stopped, unanswered.', fell: 'It stopped when the ship came down.' };
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [], add = (g, o, w, u) => L.push({ game: g, one: o, world: w, ours: u }[k]);
  if (d.split) add('The children were kept apart from each other for a game.', 'Keeping them apart cut the one child off from the rest, slowly.', 'Keeping them apart did nothing: it talked to each of them alone.', 'Keeping them apart did nothing: the voice reached every row.');
  if (d.strap) add('Children were strapped for saying the name of a game.', 'The strap made it a secret, and secrets were what the one child traded in.', 'The strap taught the children to go out to it quietly.', 'The strap was used on children for repeating what the ship said.');
  if (d.taken) add('The child taken from the others had done nothing but be good at a game.', 'Taking that child from the others was the whole of the cure.', 'The child taken away went on hearing it at the far field, and the others found someone else to listen.', 'The child taken away heard it as well at the far field as anywhere.');
  if (d.burned) add('The children\'s playing place was burned for nothing.', 'Burning the place moved the meetings indoors.', 'Burning the place was the answer. It never spoke to them again.', 'Burning the place broke a marker from the first year, and the voice came through the school\'s old monitors instead.');
  if (d.asked) L.push(k === 'one' ? 'The night in the watch hut found the truth, and the child who told it paid for that.' : 'The child questioned through the night knew nothing worth the asking.');
  if (t.old && t.old.done) L.push(k !== 'game' ? `${cap(t.old.name)} was going to die before the spring whatever was done.` : t.old.died ? `${cap(t.old.name)} was well, and died of being told otherwise.` : `${cap(t.old.name)} was well, and saw the spring.`);
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was taken, strapped or burned out on account of it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'fr.truth', tone: 'quiet', title: 'What the Friend Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), kd: t.kids, was: WAS[t.truth.is](t.nm), rk: reckon(s, t) }); },
  text: (s, c) => `${c.was}${TAIL[c.end] ? ' ' + TAIL[c.end] : ''}\n\n${c.rk}${c.toll ? ` ${Num(c.toll)} of the grown died of it, or of what was done about it.` : ''}${c.kd ? ` ${Num(c.kd)} of the children ${c.kd === 1 ? 'was' : 'were'} lost.` : ''}`,
  choices: [
    { label: 'Enter it in the record as it was, with the orders and the names', note: 'Everyone who gave an order about it, or carried one out, lives beside the page, and so do the children it was done to.',
      out: { text: 'It goes into the record in your hand, with who ordered what. The children born here read it when they are older, and some of them come to the hall to ask about it.', fx: s => ({ morale: -2, chron: (s2, c) => `The colony wrote down what it had done about the children's friend ${c.nm}, with the names.` }) } },
    { label: 'Enter it as a children\'s game that passed', dark: true, note: 'The colony gets an account with nobody in it, and every order given about the name goes unanswered.', info: [['yield', 'Morale']],
      out: { text: 'The record says the children had a game with an imaginary friend, as children do, and outgrew it. It is the version the children will be taught.', fx: s => ({ morale: 3, stain: ['fr_record', 1], chron: 'The record says the children\'s friend was a game they outgrew.' }) } },
  ] });

/* ---------- when it opens: the eldest born here is five, and there are enough of them ---------- */
LF.friendTick = function (s) {
  if (s.day % MONTH || !s.threads || s.threads[ID] || !LF.THREADS[ID] || !s.world || LF.aloft(s) || (s.over && !s.over.cont)) return;
  const C = LF.children(s); if (C.eldest < 5 || C.born < 10) return;
  const nm = s.threads.notmine; if (nm && nm.on && !nm.end) return;   // Not Mine (WO-9): never both pressing in the same years
  if (!(LF.srand(s) < OPEN / 12)) return;
  const d = LF.THREADS[ID], t = s.threads[ID] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll(s), end: null, own: true };
  d.start(s, t); if (s.plot && s.plot.threads) s.plot.threads.push(ID);
};
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { LF.friendTick(s); if (t0) t0(s); }; })();
/* It does not count as a thread pressing (LF.heat), like the Made: it is a slow thing in the schoolroom that runs for a
   year or more in the middle years, and counted, it held back the storm's other threads, so the colonies that held it
   were safer at year forty than the ones that did not (four long samples, 2026-11-16). */
(function () { const h0 = LF.heat; LF.heat = s => { const t = s.threads && s.threads[ID], n = h0(s);
  return t && t.on && !t.end && !['latent', 'quiet', 'after'].includes(t.phase) ? Math.max(0, n - 1) : n; }; })();

LF.TAGS['fr.name'] = ['cautious open', 'free', 'severe closed'];
LF.TAGS['fr.dig'] = ['bold open', 'mercy open', 'severe closed'];
LF.TAGS['fr.spring'] = ['cautious open', 'mercy closed', 'severe order'];
LF.TAGS['fr.school'] = ['severe order', 'cautious mercy', 'free'];
LF.TAGS['fr.ear'] = ['severe bold', 'mercy open', 'free'];
LF.TAGS['fr.place'] = ['severe bold', 'bold open', 'mercy free'];
LF.TAGS['fr.ask'] = ['bold free', 'cautious order', 'severe bold'];
LF.TAGS['fr.choice'] = ['severe order', 'severe order', 'severe bold', 'severe bold', 'cautious open'];
LF.TAGS['fr.after'] = ['cautious', 'open', 'severe order'];
LF.TAGS['fr.truth'] = ['open', 'closed order'];
/* The options behind fr_lie, fr_credit, fr_waiting, fr_asked, fr_locked, fr_promise and fr_closed were cut (three options at
   most, 2026-11-21); their phrases stay for saved games that carry the deed. */
Object.assign(LF.DEEDS || {}, {
  fr_lie: 'the parents told the children\'s friend was a school game',
  fr_twokids: 'the two children kept in the clinic\'s end room over a name',
  fr_credit: 'the children\'s well, claimed for the survey',
  fr_filled: 'the well the children found, filled in and called dry',
  fr_waiting: 'the old one moved into the clinic\'s end room to wait out the spring',
  fr_spite: 'the old one put on the haul crew to prove the children wrong',
  fr_split: 'the children kept to their own rows with chalk lines between them',
  fr_strap: 'the strap for any child who said the friend\'s name',
  fr_taken: 'the child who heard it best, taken from the others to a keeper\'s hut',
  fr_asked: 'the child questioned through the night in the watch hut',
  fr_burn: 'the children\'s place burned in front of them',
  fr_locked: 'the children locked into the rows at dusk',
  fr_promise: 'the promise made to the children in the hall, and not kept',
  fr_bait: 'the watch sent out on the children\'s night in their place',
  fr_sent: 'the eldest children sent to the far field crews for saying a name',
  fr_closed: 'the matter of the children\'s friend, written up as closed',
  fr_record: 'the account that called the children\'s friend a game they outgrew',
});

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['fr.place'] === undefined ? [] : [{ k: 'meet', card: 'fr.place', name: place(s).replace(/^(a|the) /, m => m === 'a ' ? 'A ' : 'The '), kind: 'mark', dist: 'near', danger: 1,
  state: t.end ? 'worked out' : 'located', known: `The children go out to it at dusk, a few at a time, and come back after dark. That is where ${t.nm} is, they say, and it is easier to hear there.` }];
})();

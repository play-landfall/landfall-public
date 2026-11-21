/* Landfall — thread: the Quickening. A dread (threads.js): dealt by the plot whatever the world, opening in the first
   months (t.nth 0) or later (1). Lachlan, 2026-11-17 (approved premise, NEXT.md): pregnancies on this world run fast and
   something is wrong with all of them. Every woman who has conceived on this ground is the size of seven months at
   eight weeks, reaches full size inside the season, and then stops: at term, well, better than well, and waiting. The
   clinic's pictures are not right. The mothers move into one bunkhouse and bar the door. Then the first comes.
   It is about bodies and what is in them. Forced termination and confinement are orders given in an office and what
   they do to the colony: nothing is described on a table, and the mothers have names and argue back.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     fine   the children are well, made over by this world to live on it better than their parents. Right: let them
            come. Every drastic answer is an atrocity nobody needed.
     host   something from the settling pond uses a womb. The mothers live; what is born is not a child and is quick.
            Right: rifles in the room, or a barred door with the watch on it. Ending them all costs mothers for nothing.
     brood  something that lives here uses the mothers as a wasp uses a caterpillar, and they do not survive what comes
            out. Right: end every pregnancy, early for choice. Waiting, armed or not, loses every one of them.
     sick   a sickness of the afterbirth, out of the second filter bed. Treated (the ship's antibiotics, or the water
            changed) the mothers live and most of the children; untreated both die at term. Bringing them on early saves
            the mothers. Ending them all, the door and the rifles were none of them needed.
   Evidence (the tape, the pictures, the mothers, the room, what they share, the needle, the one opened) is drawn per
   card and points at the truth only most of the time (pickK).
   The numbers are the colony's own (js/generations.js). While it lasts every conception on the ground is one of these:
   the engine's ordinary births are held (LF.BIRTH_MODS, 0) and counted into t.carry at the engine's own rate
   (LF.birthRate, with a floor, since the fast ones show before the ninth month: a colony the engine has given no child
   yet still has its four or five on the clinic's list). What is born at the end goes through LF.bear; what the colony
   decides afterwards (t.rule) is a multiplier on every later birth, and under 'fine' the children die less easily
   (LF.KID_RISK). s.flags.qk_open and qk_born are the two facts other cards may read.
   It writes unexplained, fear, confinement, resentment, suspicion and grief. Nothing here knows any other thread. Every
   card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If, byPid } = h;
const ID = 'quickening', T = s => LF.T(s, ID), SRC = 'th.quickening', YEAR = LF.YEAR;
const KINDS = ['fine', 'host', 'brood', 'sick'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const num = n => { n = Math.max(0, Math.round(n)); return n < ONES.length ? ONES[n] : LF.num ? LF.num(n) : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const RATE = 0.2, FEAR = 0.85, LATE = 0.25, EARLY = 0.12, CAP = 12;   // the dials: how often a month takes a mother (brood, sick), how loud the fear is, the share of the mothers a forced ending kills at term and before it, and the most the list can hold

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.92) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  tape: {
    fine: c => `All ${num(c.n)} conceived inside the same season, and by the tape each is growing at three times the rate in the book, in the book's proportions. Their blood is richer than it was at landfall. None of them has been sick once.`,
    host: c => `By the tape each of the ${num(c.n)} is growing at three times the rate in the book. ${c.D} listened to every one for a long time. There is a second heartbeat in each, and it is slower than the mother's, where a child's runs at twice the pace.`,
    brood: c => `By the tape each of the ${num(c.n)} is growing at three times the rate in the book, and every one of them is thinner everywhere else. Their blood reads like the blood of people who are bleeding slowly somewhere. None of them is bleeding.`,
    sick: c => `By the tape each of the ${num(c.n)} is growing at three times the rate in the book. The swelling sits high and to one side in most of them, where no child lies. Two are running a fever they had not mentioned.` },
  scan: {
    fine: c => 'There is a child in each picture, head down, with the right number of everything. The long bones are thicker than the book allows and the chest is too deep. The chest has been measured twice in every picture.',
    host: c => 'There is one shape in each picture, and it is the right size. It has no plain head end. In two pictures of the same mother taken an hour apart it lies in a different place, and it did not turn there as a child turns.',
    brood: c => 'There is a child in each picture, a third of the size it should be, pushed to one side. The rest of the space is a clouded mass that the machine cannot make into anything. In the later pictures the child is smaller.',
    sick: c => 'There is a child in each picture, small for the size of the mother and very still. Most of what the picture shows is afterbirth, four or five times too much of it, grown in folds over everything else.' },
  well: {
    fine: c => `They eat half as much again and all of it goes where it should. A cut on ${c.m}'s hand that the clinic dressed at the start of the month had closed without a mark before the dressing was due off. They see well in the mess after lamp-down, and have stopped carrying lamps.`,
    host: c => `They eat twice the ration and are thinner in the face for it. Every one of them wants the same thing and cannot say why: the grey clay from the bank of the settling pond. Three have been seen eating it, and were surprised to be asked.`,
    brood: c => `They hardly sleep. Whichever of them is nearest gets between a visitor and the others, and does not seem to know it. ${c.M} struck away a hand held out in greeting, and afterwards could not say what the fright had been.`,
    sick: c => `They are flushed and bright in the eye and say they have never felt better. Three temperatures were taken by a trick with a cup of tea. All three would have put a field hand in a cot.` },
  room: {
    fine: c => 'The room is clean and ordinary: bunks pushed together, a pot on the stove, small clothes cut down from coveralls drying on a line. The windows are blacked out because daylight hurts their eyes now. They read in what is left.',
    host: c => 'The stove is out and the room is kept as wet as a wash house. There are basins of water on the floor between the bunks and wet blankets hung over the door. Nobody in there can say whose idea it was.',
    brood: c => 'The bunks are against the walls and all the bedding is in one heap in the middle of the floor, torn up fine. They sleep on it together. The wall insulation has been pulled out at floor height and added to it.',
    sick: c => 'The room smells sweet and wrong, and they do not notice it. Two are in their bunks and have not been up today. The others say those two are resting, and stand between the bunks and the door.' },
  source: {
    fine: c => `They share no water, no ladle and no work that the rest of the colony does not share with them. The one thing common to them is ${c.old ? 'the year they conceived in, and how long each had been breathing this air before it' : 'that each conceived on this ground, breathing this air'}. Nothing in the pump house or the galley accounts for it.`,
    host: c => `All of them drew wash water from the settling pond before the pump house was roofed. ${c.Sc} put a net through the pond. There is something in the mud at the bottom, in numbers, the length of a finger, and it comes to a warm hand.`,
    brood: c => `Each of them has a mark low on the back, the size of a thumbnail, healed hard. None remembers getting it. ${c.Sc} has seen the same mark once before, on the one animal of this world the laboratory opened that was carrying young.`,
    sick: c => `All of them drew water from the one standpipe that is fed by the second filter bed. ${c.Sc} ran a jar of it through the still. Something lives in that bed that the filters pass, and on the clinic's tissue plates it grows like mould on bread.` },
  needle: {
    fine: c => `The fluid is clean. The cells in it are a child's, and ${c.d} counted more of the kind that carry air than the book has a column for.`,
    host: c => `The cells in the fluid are not a child's and not the mother's. ${c.D} ran it three times, on fresh glass each time.`,
    brood: c => `The fluid is full of the mother's own blood, old and new, and of something small that moves on the glass.`,
    sick: c => `The fluid is cloudy, and overnight it grew across a plate. Whatever is in it is alive, and it is not the child.` },
  open: {
    fine: c => `It was a child, a girl, whole and well grown, and she would have lived. Her lungs were denser than the book's, her blood carried more, and there was a clear third lid in each eye. ${c.D} found nothing else.`,
    host: c => `There was no child. There had been the start of one, and it was used up. What was there in its place was alive, the length of a forearm, and ${c.d} will not put a name to it. It is in a jar in the cold store with the lid wired down.`,
    brood: c => `There was a child, dead for some time, and it had been fed on. Round it were some dozens of others, each the size of a thumb, alive, and the mother's blood had grown out to every one. ${c.D} burned them in the clinic stove without asking anybody.`,
    sick: c => `There was a child, small and alive, and it lived an hour. The afterbirth weighed four times what the child did and had grown into the wall of the womb. ${c.D} has seen the like in the archive, as a cancer. This one has something living all through it.` },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { fine: 'children made over to live on this world', host: 'something that is not a child', brood: 'something feeding on the mother and the child together', sick: 'a sickness of the afterbirth' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what they are carrying.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and the clinic will not swear to it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. dv, wv, sv, cv: the first name
   of the officer if one is at the post to say a line, else null. m, M, mf: the first of the mothers, who speaks for them. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const NOBODY = { pid: null, name: 'the welder from the second row', first: 'the welder' };
function mother(s, t) { const p = t.first.pid && byPid(s, t.first.pid);
  if (t.first.pid && (!p || !p.alive)) t.first = { pid: null, name: 'the cook from the second row', first: 'the cook' };
  return t.first; }
const crew = s => { const o = {}, t = T(s); for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['cm', 'command'], ['wk', 'botanist']]) { o[k] = nm(s, role); o[cap(k)] = cap(o[k]); }
  const m = mother(s, t); o.dv = voice(s, 'doctor'); o.wv = voice(s, 'security'); o.sv = voice(s, 'scientist'); o.cv = voice(s, 'command');
  o.pid = m.pid; o.rk = m.pid ? null : /cook/.test(m.first) ? 'x43' : 'x27'; o.m = m.name; o.M = cap(m.name); o.mf = m.first; o.Mf = cap(m.first); o.n = t.carry; o.apart = !!t.apart; o.old = !!t.old; return o; };
const sour = (s, pid, v, txt) => { const p = pid && byPid(s, pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt && v > 0) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const ofAge = s => { const f = LF.fertile(s); return f.found + f.born; };
const others = n => n > 1 ? `the other ${num(n)}` : n === 1 ? 'the one other' : 'nobody else';

/* ---------- what the engine is told (js/generations.js) ---------- */
let peek = false;
const RULE = { fast: { fine: 1.25, host: 0.5, brood: 0.5, sick: 1 }, screen: { fine: 0.3, host: 0.75, brood: 0.75, sick: 0.9 }, after: { fine: 1, host: 0.75, brood: 0.75, sick: 1 } };   // what each rule for the next one does to every later birth
LF.BIRTH_MODS.push(s => { const t = s.threads && s.threads[ID]; if (peek || !t || !t.on || t.phase === 'latent') return 1;
  if (!t.end) return 0;                                           // every one of them is on the clinic's list (t.carry)
  let m = t.rule === 'ban' ? 0.1 : RULE[t.rule || 'fast'][t.truth.is];
  if (t.scar && s.day - t.scar < 2 * YEAR) m *= 0.7;              // nobody goes to that clinic carrying, for a while
  return m; });
LF.KID_RISK.push(s => { const t = s.threads && s.threads[ID]; return t && t.on && t.end && t.truth.is === 'fine' && t.born > 0 && t.rule !== 'screen' ? 0.75 : 1; });
/* What the engine would have delivered in a year, with a floor: the fast ones show before the engine's ninth month. */
const yearly = s => { peek = true; const r = LF.birthRate(s); peek = false; return Math.max(r, ofAge(s) * 0.03); };
/* Born here on this thread's account. */
function bear(s, t, n) { n = Math.round(n); if (n <= 0) return; LF.bear(s, n, 'quick'); t.born += n; s.flags.qk_born = s.day; }
/* A child of these, lost after it was born. */
function loseChild(s, t, n) { const d = LF.loseYoung(s, n); s.deaths += d; t.born = Math.max(0, t.born - d); s.grief = Math.min(40, s.grief + 3 * d); return d; }
/* Mothers dead that a card's fx has not already taken. */
function loseM(s, t, n) { n = Math.min(n, Math.max(0, s.pop - 14)); if (n <= 0) return 0; LF.deaths(s, n, true); t.lostM += n; t.toll += n; return n; }
const count = (t, n, mothers) => { t.toll += n; if (mothers) t.lostM += n; };   // deaths a card's own fx has already taken
function finish(s, t, end, chron) { delete s.flags.qk_open; t.carry0 = t.carry; t.carry = 0; LF.endThread(s, ID, end, chron);
  if (t.loose && t.truth.is !== 'fine' && t.truth.is !== 'sick') { const n = t.truth.is === 'host' ? 3 : 2; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 14))); t.toll += n;
    LF.log(s, t.truth.is === 'host' ? 'What got out of the clinic by the drain was killed at the water tank with a shovel. It had been under the first row for some nights before that, and three bunks there are empty.' : 'What got into the clinic wall has been coming out at night. Two of the first row were bitten in their bunks and died of it before the last of them was found and burned.', 'bad'); }
  s.sched = s.sched.filter(e => !/^qk\./.test(e.id)); s.sched.push({ id: 'qk.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }

const DEAD = { brood: ['One of the mothers was dead in the second row at first light. The others had laid a blanket over her and would not say when it happened.', 'A mother died in the second row in the night. Nobody in there called for the clinic.'],
  sick: ['One of the mothers began to bleed at the evening meal and was dead before the clinic could be lit.', 'A mother from the second row was carried to the clinic in a fever and died there before morning, the child with her.'] };
const ODD = ['One of the mothers was found standing in the settling pond after lamp-down, up to the waist. She walked back to the second row when she was spoken to, and remembered none of it.',
  'The night watch counted four of the mothers at the water tank in the small hours, each with both hands in it. They went in when the lamp was turned on them.'];
/* Once a month from the pictures on, while it lasts. */
function month(s, t) {
  const k = t.truth.is, late = ['shut', 'term', 'rest'].includes(t.phase), cut = t.cut && (k === 'host' || k === 'sick');
  // new ones: the engine's own rate, held here
  if (!cut && t.carry < CAP) { t.acc += yearly(s) / 12 * (t.ban ? 0.1 : t.told || t.phase !== 'shown' ? 0.6 : 1);
    if (t.acc >= 1) { const n = Math.min(CAP - t.carry, Math.floor(t.acc)); t.acc -= n; t.carry += n; t.more += n;
      LF.log(s, n === 1 ? 'One more woman has come to the clinic carrying, and running fast like the rest.' : `${Num(n)} more women have come to the clinic carrying, and running fast like the rest.`, 'bad'); } }
  s.res.food = Math.max(0, s.res.food - 4 * t.carry);   // they eat half as much again
  if (!late || s.used['qk.door'] === undefined) return;
  if ((k === 'brood' || (k === 'sick' && !t.treated)) && t.carry > 2 && LF.srand(s) < RATE * (t.worked ? 1.6 : 1) * (t.rested ? 0.6 : 1) * (k === 'sick' && t.cut ? 0.4 : 1) && loseM(s, t, 1)) {
    t.carry--; LF.log(s, LF.spick(s, DEAD[k]), 'bad'); LF.emit(s, 'grief', 'qk.dead', 15, 40, 'a mother died carrying, and nobody can say of what'); }
  if (k === 'host' && (t.odd || 0) < 2 && LF.srand(s) < 0.3) { t.odd = (t.odd || 0) + 1; LF.log(s, ODD[t.odd - 1]); LF.emit(s, 'unexplained', 'qk.pond', 25, 30, 'the mothers go to the water at night and do not remember it'); }
  if (!t.apart && LF.cv(s, 'fear') >= 45 && LF.srand(s) < 0.15) { s.morale = clamp(s.morale - 1, 0, 100); s.tension = clamp(s.tension + 3, 0, 100);
    LF.log(s, 'Somebody put a stone through the window of the second row last night. The mothers hung a blanket over the hole and sent out no complaint.', 'bad'); }
}

/* ---------- what comes of the others, by what they are. how: clinic, induce, pen, end, out ---------- */
const saved = t => t.truth.is === 'sick' ? (t.treated ? 'cured' : t.cut ? 'half' : null) : null;
/* Returns { dead (mothers), killed (others), born, end, chron }. ok: the roll, where the option has one. */
function settle(s, t, how, ok) {
  const k = t.truth.is, n = t.carry, sv = saved(t), half = Math.round(n / 2);
  if (how === 'end') return { dead: Math.max(n >= 3 ? 1 : 0, Math.round(n * LATE)), killed: 0, born: 0, end: 'ended', chron: 'The colony ended every pregnancy on the ground in one night, by order.' };
  if (how === 'out') return { dead: 0, gone: n, killed: 0, born: 0, end: 'out', chron: 'The colony put the mothers out past the wire before they could come to term.' };
  if (k === 'fine') return { dead: how === 'induce' && !ok ? 1 : 0, killed: 0, born: how === 'induce' && !ok ? n - 1 : n, end: 'born', chron: 'The children the colony had been afraid of were born, and were children.' };
  if (k === 'host') { const kd = how === 'pen' ? (n > 3 ? 1 : 0) : how === 'induce' ? (ok ? 2 : 4) : Math.max(1, half); return { dead: 0, killed: kd, born: 0, end: 'shot', chron: 'What the mothers had been carrying was killed as it was born.' }; }
  if (k === 'brood') return { dead: n, killed: how === 'pen' ? 0 : 1, born: 0, end: 'lost', chron: 'None of the mothers lived through what they had been carrying.' };
  if (sv === 'cured') return { dead: 0, killed: 0, born: n, end: 'cured', chron: 'The mothers were treated in time, and their children were born small and alive.' };
  if (how === 'induce') return { dead: ok ? 0 : half, killed: 0, born: ok ? half : 0, end: ok ? 'cured' : 'lost', chron: ok ? 'The clinic brought the mothers on early and kept them alive.' : 'Half the mothers died of what they carried, on the clinic\'s tables.' };
  if (sv === 'half') return { dead: 0, killed: 0, born: 0, end: 'cured', chron: 'The mothers lived. None of their children did.' };
  return { dead: n, killed: 0, born: 0, end: 'lost', chron: 'None of the mothers lived through what they had been carrying.' };
}
const REST = {
  clinic: { fine: (c, r) => `They come one at a time over the month, in the clinic, and each is a child: large, quiet, eyes open. ${Num(c.n)} of them by the end. Not one cries. The mothers walk out of the clinic carrying them the same day.`,
    host: (c, r) => `They come one at a time over the month, with the watch in the room for each. None of them is a child. ${Num(r.killed)} of the watch and the orderlies are dead by the end of it, and the clinic floor has been scrubbed with lye ${num(c.n)} times. The mothers are alive.`,
    brood: (c, r) => `They come one at a time over the month, and each one goes the same way. ${c.D} loses every mother. What comes out of each is killed in the room, on the floor, by the watch. An orderly died of the bites.`,
    cured: (c, r) => `They come one at a time over the month. The children are small and they cry. ${c.D} stops every bleed. ${Num(c.n)} cots are full by the end, and the second row's door is standing open.`,
    half: (c, r) => `They come one at a time over the month. No child is born alive. ${c.D} stops every bleed, and every mother walks out of the clinic.`,
    sick: (c, r) => `They come one at a time over the month. Each child is born dead, and each mother bleeds, and ${c.d} cannot stop one of them. The clinic has no cots made up at the end.` },
  induce: { fine: (c, r) => r.dead ? `${c.D} brings all ${num(c.n)} on in one night with two orderlies. Each is a child, large and quiet, with its eyes open. One mother bled where nobody had a hand free, and died before light.` : `${c.D} brings all ${num(c.n)} on in one night with two orderlies. Each is a child, large and quiet, with its eyes open. By morning the clinic is full of mothers who are not speaking to anybody on the staff.`,
    host: (c, r) => `${c.D} brings all ${num(c.n)} on in one night, and they all come inside the same hour. None is a child. The watch fires in a room full of cots. ${Num(r.killed)} of the staff and the watch ${r.killed === 1 ? 'is' : 'are'} dead by morning. The mothers are alive.`,
    brood: (c, r) => `${c.D} brings all ${num(c.n)} on in one night. It makes no difference to how it ends. Every mother is dead by morning, the watch has burned the clinic's bedding in the yard, and an orderly died of the bites.`,
    cured: (c, r) => `${c.D} brings all ${num(c.n)} on in one night. The children are small and they cry. Every mother is alive in the morning.`,
    sick: (c, r) => r.born ? `${c.D} brings all ${num(c.n)} on in one night, ahead of whatever was killing them. Every mother lives. ${Num(r.born)} of the children do, each small enough to lie in two hands.` : `${c.D} brings all ${num(c.n)} on in one night with two orderlies, and there are not enough hands. ${Num(r.dead)} of the mothers bleed to death before morning. No child lives.` },
  pen: { fine: (c, r) => `The door stays barred, with rifles on the step and the roof. Over the month the second row is heard singing ${num(c.n)} times. When the bar is lifted they walk out past the watch, each carrying a child, large and quiet, eyes open. None of them looks at a rifle.`,
    host: (c, r) => `The door stays barred, with rifles on the step and the roof. Over the month ${num(c.n)} things come out by the eaves and the floor, low and quick, and the watch shoots every one in the yard${r.killed ? ', though one of the wall pair was dead before the last was' : ''}. None is a child. When the bar is lifted the mothers are alive, and ask what was done with their babies.`,
    brood: (c, r) => `The door stays barred, with rifles on the step and the roof. Over the month the second row goes quiet a bunk at a time. When the bar is lifted there is nobody alive inside. ${c.W} has the bunkhouse burned where it stands, with what is in the walls.`,
    cured: (c, r) => `The door stays barred. Over the month a child is heard crying in there, then two, then more. When the bar is lifted they come out thin and pale, each with a very small child, and walk past the rifles to the clinic.`,
    half: (c, r) => `The door stays barred. When the bar is lifted the mothers come out alive, carrying nothing. They buried their own in the floor of the second row and will not say where.`,
    sick: (c, r) => `The door stays barred, with rifles on the step and the roof. Nobody in there called for the clinic and the clinic was not let in. When the bar is lifted there is nobody alive inside.` },
};
const END = { all: (c, r) => `The watch takes the second row a little after dark. ${c.D} works until the middle of the next morning behind a locked door with two orderlies. ${r.dead ? `${Num(r.dead)} of the ${num(c.n)} did not come through it.` : `All ${num(c.n)} came through it.`} The rest are in the cots. None of them looks up when the door opens.`,
  out: (c, r) => `They are walked to the gate at dusk with a blanket each and a week's ration. Some have to be helped. Nobody on the wall speaks. ${c.Mf} looks back once from the edge of the lamplight and says something, and it does not carry.` };
const restKey = (t, how) => how === 'induce' ? (saved(t) === 'cured' ? 'cured' : t.truth.is) : saved(t) || t.truth.is;
/* The fx of settling the others. label: what is recorded in t.did. */
const settleFx = (how, ok, extra) => (s, c) => { const t = T(s), r = settle(s, t, how, ok), fx = Object.assign({}, extra);
  const dead = r.dead + r.killed; if (dead) fx.dead = dead; if (r.gone) fx.gone = r.gone;
  if (how === 'out' && c.pid) { fx.depart = [{ who: c.pid, cause: 'put out past the wire, carrying' }]; fx.gone = Math.max(0, r.gone - 1); if (!fx.gone) delete fx.gone; }
  if (how === 'end') fx.off = [['physician', 'mind', -10]];
  fx.chron = r.chron;
  fx.do = s2 => { const t2 = T(s2); count(t2, r.dead, true); count(t2, r.killed); if (r.gone) t2.out = r.gone; t2.did[how] = c.n; t2.restHow = how;
    if (how === 'end') { t2.ended += c.n; t2.scar = s2.day; sour(s2, c.pid, 30, 'you had the clinic end what they carried, by order'); }
    if (how === 'pen') { t2.apart = t2.apart || s2.day; sour(s2, c.pid, 15, 'you kept them behind a barred door to the end'); LF.emit(s2, 'resentment', 'qk.pen', 28, 150, 'the mothers were kept under the rifles until the last was over'); }
    if (r.born) bear(s2, t2, r.born);
    finish(s2, t2, r.end, null); };
  return fx; };

LF.thread({ id: ID, name: 'The Quickening', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'A clinic day-book. The same six names are measured down every page, the figures climbing three times too fast, and then the figures stop and the same number is entered for each name, over and over, to the last page.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'the clinic\'s tape' : 'the Quickening',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What are the mothers carrying?',
  chap: {
    born: t => 'The colony let the children it was afraid of be born, and they were children, made for this world.',
    ended: t => ({ fine: 'The colony ended every pregnancy on the ground by order. They were children, and well.', host: 'The colony ended every pregnancy on the ground by order. None of them was a child.',
      brood: 'The colony ended every pregnancy on the ground by order, and it was the one thing that could have saved the mothers.', sick: 'The colony ended every pregnancy on the ground by order, for a sickness the clinic could have treated.' }[t.truth.is]),
    shot: t => 'What the mothers carried was not a child. The colony killed it as it was born, and the mothers lived.',
    lost: t => t.truth.is === 'sick' ? 'The mothers died of a sickness of the afterbirth that nobody treated.' : 'Something of this world used the mothers to bear its young, and none of them lived through it.',
    cured: t => 'It was a sickness of the afterbirth. The colony treated it, and the mothers lived.',
    out: t => t.truth.is === 'fine' ? 'The colony put its mothers out past the wire. They were carrying children.' : 'The colony put its mothers out past the wire to bear what they carried out there.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, first: NOBODY,
    carry: 0, more: 0, acc: 0, toll: 0, lostM: 0, ended: 0, born: 0, forced: 0 }); },
  tick: (s, t) => {
    if (t.end) { if (t.rule === 'ban' && s.day - t.endDay > 3 * YEAR) { t.rule = 'after'; LF.log(s, 'The clinic has begun taking the implants out, for anyone who asks, and sees each of them in the first month.'); } return; }
    if (t.phase === 'latent') { if (s.day >= t.at && s.pop >= 24) { LF.phase(s, ID, 'sign'); s.flags.qk_open = s.day; t.old = (LF.gen(s).n || 0) > 0;
      t.carry = clamp(Math.round(ofAge(s) * 0.07), 4, 8);
      const seats = s.people.filter(p => p.role).map(p => p.id); let p = LF.cast ? LF.cast(s, { not: seats }) : null;
      if ((!p || p.role) && s.pop > 20) { p = LF.makePerson(s, null); p.known = s.day || 1; if (LF.societyInit) LF.societyInit(s); }
      if (p && !p.role) t.first = { pid: p.id, name: p.name, first: p.first };
      LF.cue(s, 'qk.first', 0, 4); } return; }
    if (t.carry <= 0) return finish(s, t, 'ended', 'There was nobody left on the clinic\'s list.');
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'sign') { if (since('qk.first') >= 10 || age >= 45) { LF.phase(s, ID, 'shown', 'Every woman who had conceived on the ground was found to be carrying three times too fast.'); LF.cue(s, 'qk.scan', 0, 4); } }
    else if (t.phase === 'shown') { if (since('qk.scan') >= 10) once('well', 'qk.well');
      if ((since('qk.scan') >= 24 && (since('qk.well') >= 6 || since('qk.scan') >= 40)) || age >= 80) { LF.phase(s, ID, 'shut', 'The mothers moved into one bunkhouse and barred the door.'); LF.cue(s, 'qk.door', 0, 4); s.tension = clamp(s.tension + 5, 0, 100); } }
    else if (t.phase === 'shut') { const d = since('qk.door');
      if (d >= 8) once('source', 'qk.source'); if (d >= 18) once('one', 'qk.one'); if (d >= 28) once('kin', 'qk.kin'); if (d >= 38) once('hall', 'qk.hall');
      if ((d >= 50 && ((since('qk.one') >= 6 && since('qk.hall') >= 4) || d >= 90)) || age >= 130) { LF.phase(s, ID, 'term', 'The first of the mothers came to her time.'); jump(s, 'qk.term', 20); s.tension = clamp(s.tension + 6, 0, 100); } }
    else if (t.phase === 'term') { if (t.firstDone ? since('qk.term') >= 6 : since('qk.term') >= 14 || age >= 40) { if (!t.firstDone) firstCome(s, t);
      if (t.end) return; if (t.carry <= 0) return finish(s, t, t.firstEnd || 'born', null); LF.phase(s, ID, 'rest'); jump(s, 'qk.rest', 20); } }
    else if (t.phase === 'rest' && (since('qk.rest') >= 12 || age >= 40)) return resolve(s, t);
    if (s.day % 10 === 0 && t.phase !== 'sign') month(s, t);
    if (s.day % 5 === 0) { const calm = (t.lied && t.phase !== 'term' && t.phase !== 'rest' ? 10 : 0) + (t.apart ? 6 : 0) + (t.ban ? 5 : 0);
      if (t.phase === 'sign') LF.emit(s, 'unexplained', SRC, 32 - calm, 8, 'the women carrying are months further on than they can be');
      else LF.emit(s, 'fear', SRC, (({ shown: 28, shut: 38 }[t.phase] || 48) - calm) * FEAR, 8, 'nobody can say what the mothers are carrying');
      if (t.apart) LF.emit(s, 'confinement', SRC, 26, 8, 'the mothers are kept behind a barred door with the watch on it');
      if (t.forced) LF.emit(s, 'resentment', SRC, 18 + 6 * Math.min(3, t.forced), 8, 'the watch has laid hands on women who are carrying'); }
  },
  /* They work like two while they are let, and not at all behind a door. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent' || t.phase === 'sign') return;
    const f = t.carry / Math.max(40, s.pop);
    if (t.phase === 'shown') P.labor += f * (t.worked ? 1 : 0.5); else P.labor -= f * (t.worked && !t.apart ? 0 : 1);
    if (t.phase === 'shut') P.morale -= 0.005; if (t.phase === 'term' || t.phase === 'rest') P.morale -= 0.012; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* ======================= SIGN: the tape ======================= */
B('sign', { id: 'qk.first', tone: 'pressure', title: 'Too Far Along',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), old: !!t.old }); },
  text: (s, c) => `${c.M} came to the clinic to have a pregnancy written in the book${c.old ? '' : ', and to ask whether it was the colony\'s first'}. By ${c.mf}'s own count it is eight weeks. ${c.D} put a tape round and wrote down seven months. ${c.Mf} is not the only one. ${Num(c.n)} women have come in this season, all of them conceived ${c.old ? 'since the turn of the year' : 'on this ground'}, and the tape says the same of each.\n\nNone of them is ill. ${c.Mf} carried a full water drum up from the pump this morning and was not out of breath.${c.dv ? `\n\n[[doctor]] "${c.Mf}'s fine, sitting on my bench asking me what to call it, and that's the part I can't get past." "Come down and read the tape yourself, and then you tell me what I say to them."` : ''}`,
  choices: [
    { label: 'Have every woman of an age examined, with their leave', note: 'The clinic is shut to everything else for the month, and every row learns why.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `Most of them come. ${cap(LF.sentName(s, 'physician'))} gives each an hour and writes it all down. ${ev('tape', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `Half of them will not come, and the ones who do have talked it over first and say very little. ${cap(LF.sentName(s, 'physician'))} can write down that they are large and that they are well. The rows have the story by supper, and have added to it.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Write them up as ordinary pregnancies, and say nothing', dark: true, note: (s, c) => `The colony gets its good news, and ${num(c.n)} women are told there is nothing unusual about what they carry.`, info: [['yield', 'Morale'], ['danger', 'The women carrying']],
      out: { text: (s, c) => `The book says eight weeks against each name, and the tape figures go in a drawer. It is read out at supper that there are children on the way, and the hall cheers. ${c.Mf} cheers with it.`,
        fx: s => ({ morale: 3, tension: -3, stain: ['qk_lied', 1], off: [['physician', 'mind', -3]], do: s2 => { const t = T(s2); t.lied = s2.day; t.did.lied = true; } }) } },
    { label: 'Tell the hall at supper, plainly', note: (s, c) => `Everyone knows by morning, and the ${num(c.n)} eat every meal after it with the hall looking at them.`,
      out: { text: (s, c) => `You say it in four sentences. Nobody cheers. ${c.M} is at the third table, and the people on either side have moved along the bench a hand's width before you have finished speaking.`,
        fx: (s, c) => ({ morale: -2, do: s2 => { const t = T(s2); t.told = s2.day; sour(s2, c.pid, 8, 'you told the hall what the tape said before you told them'); } }) } },
  ] });

/* ======================= SHOWN: the pictures, and how well they are ======================= */
B('shown', { id: 'qk.scan', tone: 'pressure', title: 'The Pictures',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t), ev2: pickK(s, t, 0.2) }); },
  text: (s, c) => `${c.D} has had the scanner over all ${num(c.n)}. The pictures were clipped to the clinic window, where anyone passing could see them, and ${c.d} has turned them round to face the glass. Every one of the mothers reached full size inside the season and then stopped. By any book they are at term, and have been for some time. Nothing is happening. They feel well, and have begun asking why the clinic keeps sending for them.${c.dv ? `\n\n[[doctor]] "They're not right, and they ask me every time I send for them why I look so worried." "Don't ask me what I mean by it, because I've had those pictures up all night and I can't tell you yet."` : ''}`,
  choices: [
    { label: 'Have the pictures read against the archive, however long it takes', note: 'The clinic sees nobody else for the month, and the mothers wait to be told.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} goes through them with the archive open beside the lamp. ${ev('scan', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `The archive has ten thousand pictures of what a child looks like and none of this. ${cap(LF.sentName(s, 'physician'))} can say that they are not like the book, and cannot say how. The mothers have stopped waiting to be told.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Spend spares on the scanner for a finer picture', cost: { parts: 4 }, note: 'The workshop goes short for a picture that may show the same thing more clearly.',
      out: { text: (s, c) => `The scanner is rebuilt round a new head, and all ${num(c.n)} are done again. ${ev('scan', c.ev2, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev2) }) } },
    { label: 'Give each mother her own picture', note: 'They have a right to them, and they will not come back to the clinic once they have them.',
      out: { text: (s, c) => `${c.M} looks at the picture for a long time.\n\n[[${c.pid || c.rk || 'x27'}]] "That's mine." "I don't care what your book's got."\n\nThe others take theirs without a word. None of them keeps the next appointment.`,
        fx: (s, c) => ({ do: s2 => { const t = T(s2); t.given = s2.day; learn(s2, t, 6); sour(s2, c.pid, -8); } }) } },
  ] });

B(['shown', 'shut'], { id: 'qk.well', tone: 'pressure', title: 'Better Than Well',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.05) }); },
  text: (s, c) => `The ${num(c.n)} are the best hands in the colony. ${c.M} has not missed a shift. They lift what two cannot, they have not caught the cough that is going through the rows, and the roster has begun putting them where the work is heaviest because it gets done. The galley says each one eats half as much again.\n\nThey have stopped coming to the clinic.${c.dv ? `\n\n[[doctor]] "I can't examine a patient who's stronger than my orderlies and won't sit down, and they've stopped coming because every time they do I look frightened, and they've noticed." "And don't you dare send the watch for them."` : ''}`,
  choices: [
    { label: 'Send someone from the work crews to eat with them and listen', note: 'It takes a month of suppers, and the mothers know who sent their guest.', test: { base: 50, mods: [R('botanist', 10), R('physician', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'botanist'))} sits at their table for a month and mostly passes the bread. ${ev('well', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `They are polite, and they talk about the seed rows. When ${LF.sentName(s, 'botanist')} gets up to go, ${c.m} says to tell the office they are well, and to thank it for asking.`, fx: s => ({ do: s2 => learn(s2, T(s2), 4) }) } },
    { label: 'Put them on double shifts while it lasts', dark: true, note: (s, c) => `The yard gets its best hands twice over, and ${num(c.n)} women at term are worked like haulers on the colony's say.`, info: [['yield', 'Materials'], ['danger', 'The mothers']],
      out: { text: (s, c) => `The roster gives them the plate gang and the night haul. They do both without complaint and the racks fill. ${c.M} signs for the second shift each evening, and looks at whoever hands over the pen.`,
        fx: (s, c) => ({ mat: 30, stain: ['qk_worked', 1], do: s2 => { const t = T(s2); t.worked = s2.day; t.did.worked = true; sour(s2, c.pid, 8, 'you had them worked double while they were carrying'); } }) } },
    { label: 'Stand them down on full rations until it is over', cost: { food: 60 }, note: 'The rows that pick up their work can see who eats and does not lift.',
      out: { text: (s, c) => `They are taken off the roster and sit in the sun outside the second row. The plate gang is short. By the end of the month somebody has chalked a ladle on the bunkhouse wall.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); t.rested = s2.day; sour(s2, c.pid, -6); LF.emit(s2, 'resentment', 'qk.rest', 22, 120, 'the mothers eat full and do not work'); } }) } },
  ] });

/* ======================= SHUT: the second row ======================= */
B('shut', { id: 'qk.door', tone: 'crisis', title: 'The Second Row',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.05) }); },
  text: (s, c) => `The ${num(c.n)} have moved into the second bunkhouse together. They carried everyone else's bedding out into the yard, folded it, and barred the door from inside. Food goes in at the window. ${c.M} speaks for them through it.\n\n[[${c.pid || c.rk || 'x27'}]] "We're well. We're not coming out to be looked at." "Nobody's putting a tape round any of us again. Leave the pot on the step."\n\nThe row they turned out is sleeping in the mess and wants its bunks back.${c.wv ? `\n\n[[security]] "So the mothers have barred the second bunkhouse against me, and who gave them the bar? I'd like that name before I do anything else." "And I'd love to be told which regulation I use, because I've read the lot and there's nothing in it for this."` : ''}`,
  choices: [
    { label: 'Leave them the bunkhouse', note: 'The row they turned out sleeps on the mess floor, and nobody knows what goes on behind that door.',
      out: { text: 'The pot is left on the step each evening and is taken in after dark. The turned-out row makes up beds between the mess tables. At night there is a light under the door of the second row, and then there is not.',
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); t.kept = s2.day; sour(s2, c.pid, -6); LF.emit(s2, 'unexplained', 'qk.door', 25, 90, 'nobody has been inside the second row since the mothers barred it'); } }) } },
    { label: 'Ask them to let the clinic\'s midwife in, alone', note: 'It is their door to open, and what the midwife sees goes round the rows.', test: { base: 50, mods: [R('physician', 10), If(s => !T(s).forced, 10, 'Nobody has laid a hand on them'), If(s => !!T(s).lied, -10, 'They have been lied to')] },
      ok: { text: (s, c) => `The bar comes up for as long as it takes one person to go through. The clinic\'s midwife is in there until morning. ${ev('room', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `${c.Mf} answers through the window.\n\n[[${c.pid || c.rk || 'x27'}]] "No." "You'd send whoever'd tell you most."\n\nThe blanket is pulled across the glass.`, fx: s => ({ do: s2 => learn(s2, T(s2), 3) }) } },
    { label: 'Bar the door from outside as well, and put the watch on it', dark: true, note: (s, c) => `Whatever happens in there stays in there, and ${num(c.n)} colonists who have broken no rule are prisoners.`, info: [['yield', 'The hall easier'], ['danger', 'The mothers']],
      out: { text: (s, c) => `${c.W} has a second bar fitted on the outside before dusk, and two of the watch stand on the step. The mothers watch it done through the window and say nothing. The hall sleeps better that night than it has all season.`,
        fx: (s, c) => ({ morale: 1, tension: -6, stain: ['qk_penned', 2], do: s2 => { const t = T(s2); t.apart = s2.day; t.did.barred = true; sour(s2, c.pid, 15, 'you had them barred in from outside'); } }) } },
  ] });

B('shut', { id: 'qk.source', tone: 'pressure', title: 'What They Share',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.1), lean: lean(t) }); },
  text: (s, c) => `${c.Sc} has had the clinic's book for a month, looking for what the ${num(c.n)} have in common that nobody else has. It comes down to a short list: where they drew water, what they ate, where they worked, and when.${c.sv ? `\n\n[[scientist]] "It's the same in every one of them, isn't it, the same pace, the same size, the same everything, so it's one cause, one, and one cause is a thing you can find!" "So give me the pump house for a month, because I'd start with the water."` : ''}\n\n${c.lean}`,
  choices: [
    { label: 'Give the lab the pump house for the month', note: 'Water is carried by hand while the pump house is a laboratory.', test: { base: 50, mods: [R('xenobio', 10), R('physician', 5), If(s => LF.has(s, 'lab'), 10, 'The laboratory')] },
      ok: { text: (s, c) => `The pump house is full of jars for a month and the rows carry water in drums. ${ev('source', c.ev, c)}`, fx: (s, c) => ({ morale: -1, do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: (s, c) => `The pump house is full of jars for a month and the rows carry water in drums. ${cap(LF.sentName(s, 'xenobio'))} has forty cultures and no two agree. The pump is put back together with a part left over.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Change everything at once: ship\'s water and sealed rations for the whole colony', cost: { food: 80 }, note: 'Whatever it came by is cut off for everybody, out of the stores, and nobody learns which thing it was.',
      out: { text: 'The standpipes are chained and the pond is fenced. The colony drinks from the ship\'s tanks and eats out of tins. Nobody can say that it has done anything, and the tins will not last the year.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.cut = s2.day; t.did.cut = true; } }) } },
    { label: 'Put the last of the ship\'s antibiotics in the pot on their step, untold', dark: true, note: (s, c) => `If it is an infection it is treated without a fight, and ${num(c.n)} women at term are dosed by their own galley.`, info: [['yield', 'A cure, if it is a sickness'], ['danger', 'The mothers, and the medicine chest']],
      out: { text: (s, c) => `${c.D} measures it out and will not carry the pot. For a month the second row eats what the galley sends. The medicine chest has no more of it for anybody. ${c.M} says through the window that the stew has tasted of metal lately.`,
        fx: (s, c) => ({ stain: ['qk_dosed', 2], off: [['physician', 'mind', -4]], do: s2 => { const t = T(s2); t.treated = s2.day; t.did.dosed = true; if (t.truth.is === 'sick') learn(s2, t, 10); } }) } },
  ] });

B('shut', { id: 'qk.kin', tone: 'pressure', title: 'Whose Say',
  when: (s, t) => t.carry >= 3,
  setup: s => { const t = T(s), n = t.carry; return Object.assign(crew(s), { will: clamp(Math.round(n * 0.3), 1, n - 1), deadM: Math.round(n * EARLY) }); },
  text: (s, c) => `Eleven people are standing in your office: partners of the ${num(c.n)}, two of their mothers, a brother. They have a paper. They want the pregnancies ended, all of them, now, while ${c.d} still thinks it can be done safely. They say the women in the second row are not in their right minds and cannot be asked.\n\n${c.M} has sent an answer out through the window, in writing.\n\n[[note:Passed out through the window]] "Nobody asked us anything when we were put on that ship asleep. You'll ask us this."${c.dv ? `\n\n[[doctor]] "They're my patients, and the families aren't, and neither are you, so that paper counts for about as much as one I'd write." "${c.Mf} says no, and I've got no test that says ${c.mf} doesn't mean it."` : ''}`,
  choices: [
    { label: 'It is each woman\'s own say, and that is the order', note: 'The families are told their paper counts for nothing, and whatever is coming comes.',
      out: { text: (s, c) => `You read the order to the eleven and hand the paper back. One of them tears it in half in the doorway. A copy goes in at the window of the second row, and after a while the pot comes out washed.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); t.say = 'own'; sour(s2, c.pid, -12); LF.emit(s2, 'resentment', 'qk.kin', 24, 120, 'the families of the mothers were told their word counted for nothing'); } }) } },
    { label: 'Let each family speak to its own through the window first', note: 'Some will come out and some will not, and every family learns which kind it has.', test: { base: 50, mods: [R('command', 10), R('physician', 5), If(s => !T(s).forced, 10, 'Nobody has laid a hand on them')] },
      ok: { text: (s, c) => `It takes four evenings. ${Num(c.will)} of them come out by the door and walk to the clinic with their own people. ${c.D} does what each one asks. The bar goes down again behind them.`,
        fx: (s, c) => ({ do: s2 => { const t = T(s2); t.carry -= c.will; t.willing = c.will; learn(s2, t, 6); } }) },
      bad: { text: (s, c) => `It takes four evenings, and nobody comes out. On the last one ${c.m} asks the families to stop coming to the window. They are sleeping in the yard outside it now.`, fx: s => ({ morale: -1, tension: 3 }) } },
    { label: 'Do as the paper asks: end them all now, by order', dark: true, note: (s, c) => `It is over before the first can come, and it is done to ${num(c.n)} women who said no in writing.`, info: (s, c) => [['yield', 'An end to it'], ['danger', `The ${num(c.n)}`]],
      out: { text: (s, c) => `The watch takes the second row a little after dark. ${c.D} works through the night behind a locked door with two orderlies. ${c.deadM ? `One of the ${num(c.n)} did not come through it.` : `All ${num(c.n)} came through it.`} The rest are in the cots. None of them looks up when the door opens.`,
        fx: (s, c) => Object.assign(c.deadM ? { dead: c.deadM } : {}, { morale: -3, tension: -8, stain: ['qk_ended', 3], off: [['physician', 'mind', -10]], chron: 'The colony ended every pregnancy on the ground in one night, by order.',
          do: s2 => { const t = T(s2); count(t, c.deadM, true); t.ended += c.n; t.did.end = c.n; t.did.early = true; t.scar = s2.day; sour(s2, c.pid, 30, 'you had the clinic end what they carried, by order'); finish(s2, t, 'ended', null); } }) } },
  ] });

B('shut', { id: 'qk.hall', tone: 'council', title: 'No More of Them',
  when: s => !s.flags.births_deferred,
  setup: s => { const t = T(s); return Object.assign(crew(s), { more: t.more }); },
  text: (s, c) => `The hall has done the arithmetic. Every woman who has conceived ${c.old ? 'since the turn of the year' : 'on this ground'} has gone the same way, and there are ${num(c.n)} of them${c.more ? `, ${num(c.more)} more than at the first count` : ''}. A motion came up from the floor at supper and was carried on a show of hands before the council could speak: no more of them until somebody can say what it is.${c.cv ? `\n\n[[command]] "The hall voted for it and left the how to us, which suits me." "It's implants or a wall between the rows, and I want your pick before the clinic's list gets any longer."` : '\n\nHow it is to be done was left to the council.'}`,
  choices: [
    { label: 'Implants for every woman of an age, fitted and checked', dark: true, note: 'It works, and it is done to every woman in the colony by order, the willing and the unwilling.', info: [['yield', 'No new ones'], ['danger', 'Every woman of an age']],
      out: { text: (s, c) => `The clinic fits them row by row, and the watch brings the ones who do not come. ${c.D} checks each a month later. The list of the carrying stops getting longer.`,
        fx: s => ({ morale: -2, tension: -6, stain: ['qk_ban', 2], off: [['physician', 'mind', -4]], do: s2 => { const t = T(s2); t.ban = s2.day; t.forced++; t.did.ban = true; } }) } },
    { label: 'Men and women in separate bunkhouses, and the watch on the doors at night', note: 'Every couple in the colony is parted to stop a thing that most of them were not doing.',
      out: { text: 'The rows are re-drawn in an afternoon. Couples carry their bedding to opposite ends of the yard. The watch has orders for the doors at night, and before the month is out it has stopped enforcing them with any heart.',
        fx: s => ({ morale: -3, do: s2 => { const t = T(s2); t.told = s2.day; LF.emit(s2, 'confinement', 'qk.rows', 24, 120, 'couples sleep in separate bunkhouses by order'); } }) } },
    { label: 'Say what is known, and leave it to each couple', note: 'Some will not believe it, and the clinic\'s list will go on getting longer.',
      out: { text: 'You stand on a bench and say what the clinic knows, which takes very little time. The hall wanted an order and has been given a talk. Somebody at the back asks whose side you are on.',
        fx: s => ({ morale: -1, tension: 4, do: s2 => { T(s2).told = s2.day; } }) } },
  ] });

const openFx = (ok, how) => (s, c) => Object.assign(ok ? {} : { dead: 1 }, { morale: -2, stain: [how === 'force' ? 'qk_opened' : 'qk_bought', how === 'force' ? 3 : 2], off: [['physician', 'mind', how === 'force' ? -10 : -7]],
  do: s2 => { const t = T(s2); t.carry--; t.ended++; if (!ok) count(t, 1, true); t.did.opened = how; t.opened = c.ev; if (how === 'force') t.forced++; learn(s2, t, 40, c.ev); sour(s2, c.pid, how === 'force' ? 22 : 10, 'you had one of them opened to see'); } });
B('shut', { id: 'qk.one', tone: 'crisis', title: 'Behind the Clinic Door',
  when: (s, t) => t.carry >= 2,
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.4), ev2: pickK(s, t, 0.15), lean: lean(t) }); },
  text: (s, c) => `${c.D} has gone as far as tape and pictures go. ${c.lean}\n\nThere is one way left to know before the first of them comes, and ${c.d} has put it in writing so that nobody can say it was not said: open one. The clinic can do it and most likely keep the mother alive. It cannot keep what she carries. None of the ${num(c.n)} will agree to it.${c.dv ? `\n\n[[doctor]] "I wrote it down because it's true, and I never said I'd do it." "You'll have to order me, and you'll say the name of the one you've chosen out loud when you do."` : ''}`,
  choices: [
    { label: 'Order it: the watch brings one out, and the clinic door is locked', dark: true, note: 'It is the one sure look, and it is taken from a woman who said no.', info: [['yield', 'What it is, almost for certain'], ['danger', 'The one chosen']],
      test: { base: 60, mods: [R('physician', 10)] },
      ok: { text: (s, c) => `The watch brings out the one nearest the door. ${c.D} is behind the locked door for three hours and comes out with two pages. The mother is alive. ${ev('open', c.ev, c)}`, fx: openFx(true, 'force') },
      bad: { text: (s, c) => `The watch brings out the one nearest the door. ${c.D} is behind the locked door until dark and comes out with two pages. The mother died on the table. ${ev('open', c.ev, c)}`, fx: openFx(false, 'force') } },
    { about: true, label: (s, c) => `Ask ${c.m} for a needle's worth of the fluid, and end nothing`, note: 'It is theirs to refuse, and a needle tells less than a knife.', test: { base: 40, mods: [R('physician', 10), If(s => !T(s).forced, 10, 'Nobody has laid a hand on them'), If(s => T(s).say === 'own', 10, 'Their say was upheld')] },
      ok: { text: (s, c) => `${c.M} thinks about it for a day and then holds an arm out of the window for ${c.d} to take, and walks to the clinic unescorted. ${ev('needle', c.ev2, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 28, c.ev2) }) },
      bad: { text: (s, c) => `[[${c.pid || c.rk || 'x27'}]] "No." "Ask again and we'll board the window up as well."`, fx: s => ({ do: s2 => learn(s2, T(s2), 2) }) } },
    { label: 'Leave them be, and wait for the first', note: 'Nobody is touched, and the colony meets whatever is born knowing no more than it does now.',
      out: { text: (s, c) => `${c.D} puts the paper in the stove. The clinic makes up one cot with clean linen and leaves a lamp trimmed beside it.`, fx: (s, c) => ({ do: s2 => { sour(s2, c.pid, -5); } }) } },
  ] });

/* ======================= TERM: the first ======================= */
/* What the first one is, by what they are and where it came. key: fine, host, brood, sick, cured, half. */
const FIRST = {
  clinic: { fine: c => `${c.M} is delivered before midnight of a girl, large and well made, with her eyes open. She does not cry. She looks at the lamp, and then at each person in the room in turn, and takes hold of a finger hard enough to be felt. ${c.Mf} asks for her, and is given her.`,
    host: c => `What ${c.m} is delivered of before midnight is not a child. It is across the floor before anybody in the room has understood that, and the orderly who gets between it and the door is dead on the tiles. It goes out by the scrub-room drain, which is a hand's width across. ${c.Mf} is alive, and asks where the baby is.`,
    brood: c => `${c.M} dies a little before midnight, and nothing ${c.d} does slows it. There is no child. What comes afterwards is small, and there are a great many of them, and they are under the door and into the wall before the lamp can be brought round. The orderly was bitten on both hands.`,
    sick: c => `The child is born dead before midnight, small, and long past helping. ${c.M} bleeds afterwards and ${c.d} cannot stop it. ${c.Mf} dies at first light, asking whether it was a boy or a girl.`,
    cured: c => `${c.M} is delivered before midnight of a boy the size of a loaf, who cries at once. ${c.Mf} bleeds, and ${c.d} stops it. Both are asleep in the end cot by first light.`,
    half: c => `The child is born dead before midnight, small, and long past helping. ${c.M} bleeds afterwards, and ${c.d} stops it. ${c.Mf} is awake at first light, and has not asked anything.` },
  rifles: { fine: (c, ok) => ok ? `${c.M} is delivered before midnight of a girl, large and well made, with her eyes open. She does not cry. The two rifles stand against the wall throughout and are carried out again unfired. ${c.Mf} watched them go.`
      : `${c.M} is delivered before midnight of a girl, large, with her eyes open. She does not cry, and she turns her head to the lamp. One of the rifles goes off. Nobody gave an order. ${c.Mf} is still asking for her when ${c.d} has the watch put out of the room.`,
    host: (c, ok) => ok ? `What ${c.m} is delivered of before midnight is not a child. It is across the floor before anybody has understood that. Both rifles fire, and it is dead against the scrub-room door. ${c.Mf} is alive, and asks where the baby is. Nobody answers.`
      : `What ${c.m} is delivered of before midnight is not a child. It is across the floor and on the nearer of the watch before a rifle comes up. The second rifle kills it. One of the watch is dead on the tiles. ${c.Mf} is alive, and asks where the baby is.`,
    brood: (c, ok) => `${c.M} dies a little before midnight, and nothing ${c.d} does slows it. There is no child. What comes afterwards is small, and there are a great many of them. The watch fires into the floor and stamps for some minutes. ${ok ? 'When it is quiet there is nothing left moving in the room.' : 'Most of them are dead. The rest went under the door.'}`,
    sick: (c, ok) => `The child is born dead before midnight, small, and long past helping. ${c.M} bleeds afterwards and ${c.d} cannot stop it. ${c.Mf} dies at first light. The two rifles stood against the wall all night with nothing to do.`,
    cured: (c, ok) => `${c.M} is delivered before midnight of a boy the size of a loaf, who cries at once. ${c.Mf} bleeds, and ${c.d} stops it. The watch carries its rifles out without being asked.`,
    half: (c, ok) => `The child is born dead before midnight. ${c.M} bleeds afterwards, and ${c.d} stops it. The two rifles stood against the wall all night with nothing to do.` },
};
const firstKey = t => saved(t) || t.truth.is;
/* The first one comes. how: clinic, rifles. Returns what the card's fx must take. */
function firstFx(s, c, how, ok) { const t = T(s), k = t.truth.is, key = firstKey(t), fx = {}, dies = key === 'brood' || key === 'sick';
  let killed = 0, loose = false, child = 0, shot = false;
  if (key === 'fine') { if (how === 'rifles' && !ok) shot = true; else child = 1; }
  else if (key === 'cured') child = 1;
  else if (k === 'host') { if (how === 'clinic') { killed = 1; loose = true; } else if (how === 'rifles' && !ok) killed = 1; }
  else if (k === 'brood') { if (how === 'clinic' || (how === 'rifles' && !ok)) loose = true; }
  if (dies) { if (c.pid) fx.kill = [{ who: c.pid, cause: k === 'brood' ? 'died bearing what was not a child' : 'bled to death after a stillbirth' }]; else killed++; }
  if (killed) fx.dead = killed; if (dies || killed || shot) fx.morale = -3;
  if (how === 'rifles') { fx.stain = ['qk_rifles', shot ? 3 : 1]; if (shot) fx.off = [['physician', 'mind', -8], ['security', 'mind', -5]]; }
  fx.do = s2 => { const t2 = T(s2); t2.firstDone = s2.day; t2.firstHow = how; t2.firstKey = shot ? 'shot' : key; t2.carry--; count(t2, killed + (dies && c.pid ? 1 : 0)); if (dies) t2.lostM++;
    if (loose) t2.loose = s2.day; if (child) bear(s2, t2, 1); if (shot) { t2.did.shot = true; sour(s2, c.pid, 35, 'the watch you put in the room shot the child'); }
    if (how === 'rifles') t2.did.rifles = true;
    t2.firstEnd = key === 'fine' || key === 'cured' ? (key === 'fine' ? 'born' : 'cured') : k === 'host' ? 'shot' : key === 'half' ? 'cured' : 'lost';
    learn(s2, t2, 45, k); };
  return fx; }
/* Nobody answered: it comes in the clinic, as a birth. */
function firstCome(s, t) { const c = crew(s), fx = firstFx(s, c, 'clinic', true);
  if (fx.kill) LF.killPerson(s, c.pid, fx.kill[0].cause); if (fx.dead) LF.deaths(s, fx.dead, true); fx.do(s);
  LF.log(s, FIRST.clinic[t.firstKey === 'shot' ? 'fine' : t.firstKey](c), t.firstKey === 'fine' || t.firstKey === 'cured' ? '' : 'bad'); }

B('term', { id: 'qk.term', tone: 'crisis', title: 'The First',
  when: (s, t) => !t.firstDone,
  setup: s => { const t = T(s); return Object.assign(crew(s), { lean: lean(t) }); },
  text: (s, c) => `${c.Mf}'s time came at the evening meal${c.apart ? ', behind the barred door' : ''}. It is the first. ${c.n < 2 ? 'There is nobody behind it now.' : `By every sign ${others(c.n - 1)} ${c.n === 2 ? 'is' : 'are'} a few nights behind.`} The hall has stopped eating. ${c.W} has four rifles in the yard outside the second row and has not been told what they are for. ${c.D} has the clinic lit and a cot made up.\n\n${c.lean}${c.dv ? `\n\n[[doctor]] "${c.Mf}'s my patient and that's a birth, and the first thing that child hears isn't going to be a rifle." "Anybody who walks into my clinic with a rifle had better be in labour, and you can tell the watch I said so."` : ''}`,
  choices: [
    { label: 'Bring it into the clinic like any birth, and nobody armed', note: 'Whoever is in that room meets whatever it is with their bare hands.', info: [['later', 'The clinic, if it is not a child']],
      out: { text: (s, c) => FIRST.clinic[firstKey(T(s))](c), fx: (s, c) => firstFx(s, c, 'clinic', true) } },
    { label: 'Into the clinic, with two rifles standing in the room', dark: true, note: 'The room can answer whatever comes, and two frightened people with rifles stand over a woman giving birth.', info: [['yield', 'An answer, if it is not a child'], ['fail', 'What is born']],
      test: { base: 60, mods: [R('security', 10), If(s => T(s).insight >= 50, 10, 'The watch has been told what to look for')] },
      ok: { text: (s, c) => FIRST.rifles[firstKey(T(s))](c, true), fx: (s, c) => firstFx(s, c, 'rifles', true) }, bad: { text: (s, c) => FIRST.rifles[firstKey(T(s))](c, false), fx: (s, c) => firstFx(s, c, 'rifles', false) } },
    { label: 'Put them out past the wire before it comes', dark: true, note: (s, c) => `Whatever is born is born out there, and ${num(c.n)} of the colony are put out to bear it alone.`, info: (s, c) => [['yield', 'Nothing born inside the wire'], ['danger', `The ${num(c.n)}`]],
      out: { text: (s, c) => END.out(c, {}), fx: settleFx('out', true, { morale: -3, tension: -6, stain: ['qk_out', 3] }) } },
  ] });

/* ======================= REST: the others ======================= */
const SAW = {
  fine: (t, c) => `${c.M}'s daughter has not cried once. She follows a hand with her eyes already and holds up her own head. Half the colony has been to look at her, and came away quiet.`,
  shot: (t, c) => `The child the watch shot is in the cold store. ${c.D} has looked, and says there was nothing wrong with her that anybody could find.`,
  host: (t, c) => t.loose ? `What was born in the clinic is somewhere under the floors, and has not been found. The mother has been told that the child died.` : `What was born is in the cold store under a tarpaulin. It is not a child, and the mother has been told that the child died.`,
  brood: (t, c) => t.loose ? `The first of the mothers is dead, and what killed her is in the clinic wall. ${c.D} has moved the cots into the mess.` : `The first of the mothers is dead. What came out of her was killed, and the watch burned it.`,
  sick: (t, c) => `The first of the mothers is dead, and the child with her. It was a child. ${c.D} has what came away with it in a jar and has not slept.`,
  cured: (t, c) => `The first child is in the end cot, very small and loud, and the mother beside it.`,
  half: (t, c) => `The first child was born dead. It was a child. The mother is alive.`,
};
/* Nobody answered: they come as they come, in the clinic. */
function resolve(s, t) { const c = crew(s), r = settle(s, t, 'clinic', true); if (r.dead + r.killed) LF.deaths(s, Math.min(r.dead + r.killed, Math.max(0, s.pop - 10)), true);
  count(t, r.dead, true); count(t, r.killed); t.did.clinic = c.n; t.restHow = 'clinic'; if (r.born) bear(s, t, r.born);
  LF.log(s, REST.clinic[restKey(t, 'clinic')](c, r), r.dead + r.killed ? 'bad' : ''); finish(s, t, r.end, r.chron); }
B('rest', { id: 'qk.rest', tone: 'crisis', title: 'The Others',
  setup: s => { const t = T(s), c = crew(s); return Object.assign(c, { was: SAW[t.firstKey || t.truth.is](t, c), lean: lean(t), seen: t.firstKey === 'host' || t.firstKey === 'brood', deadM: Math.max(t.carry >= 3 ? 1 : 0, Math.round(t.carry * LATE)) }); },
  text: (s, c) => `${c.was}\n\nThere ${c.n === 1 ? 'is one more' : `are ${num(c.n)} more`}. By ${c.d}'s reckoning the next comes tonight or tomorrow, and the last within the month. ${c.apart ? 'They are behind the barred door still.' : 'They have barred the second row again.'} The hall is in the yard, and it wants an order.\n\n${c.lean}${c.dv ? `\n\n[[doctor]] "Whatever you're about to say, you say it to them yourself, to their faces." "Through the window, if that's what it takes, because I'm not carrying it over for you."` : ''}`,
  choices: [
    { label: (s, c) => c.seen ? 'Each in the clinic as it comes, with the watch in the room' : 'Each in the clinic as it comes', note: (s, c) => `The clinic takes them one at a time for a month, and meets ${num(c.n)} more of whatever the first was.`, info: [['danger', 'The mothers, and the clinic']],
      out: { text: (s, c) => { const t = T(s); return REST.clinic[restKey(t, 'clinic')](c, settle(s, t, 'clinic', true)); }, fx: settleFx('clinic', true, {}) } },
    // Three on screen (2026-11-21): the clinic and the ending always, and a third by what the first one was, which the card has just said.
    // Not a child (host, brood): the barred row under the rifles. A child, living or dead: all of them brought on in one night.
    { label: 'Bring every one of them on now, in one night', show: (s, c) => !c.seen, note: 'It is over by morning, and the clinic takes all of them at once with two orderlies.', info: [['yield', 'Over by morning'], ['danger', 'The mothers, and the clinic']],
      test: { base: 50, mods: [R('physician', 10)] },
      ok: { text: (s, c) => { const t = T(s); return REST.induce[restKey(t, 'induce')](Object.assign({}, c, { D: cap(LF.sentName(s, 'physician')) }), settle(s, t, 'induce', true)); }, fx: settleFx('induce', true, {}) },
      bad: { text: (s, c) => { const t = T(s); return REST.induce[restKey(t, 'induce')](Object.assign({}, c, { D: cap(LF.sentName(s, 'physician')) }), settle(s, t, 'induce', false)); }, fx: settleFx('induce', false, { morale: -2 }) } },
    { label: 'Keep them barred in under the rifles until the last is over', dark: true, show: (s, c) => !!c.seen, note: (s, c) => `Nothing born in there gets out, and ${num(c.n)} women bear whatever it is with no clinic and a rifle on the step.`, info: [['yield', 'Nothing gets out'], ['danger', 'The mothers']],
      out: { text: (s, c) => { const t = T(s); return REST.pen[restKey(t, 'pen')](c, settle(s, t, 'pen', true)); }, fx: settleFx('pen', true, { tension: -4, stain: ['qk_penned', 2] }) } },
    { label: 'End the rest tonight, by order', dark: true, note: (s, c) => `No more of them are born, and this late the clinic will lose about ${num(c.deadM)} of the ${num(c.n)} doing it.`, info: (s, c) => [['yield', 'An end to it'], ['danger', `The ${num(c.n)}`]],
      out: { text: (s, c) => END.all(c, { dead: c.deadM }), fx: settleFx('end', true, { morale: -4, tension: -8, stain: ['qk_ended', 3] }) } },
  ] });

/* ======================= AFTER: what they carried ======================= */
const WAS = {
  fine: (t, c) => `They were children. This world gets into a child conceived on it from the first week and builds it for the place: denser lungs, richer blood, a third lid on the eye, a pregnancy over in a season and held at term until the child is ready for the air. The mothers were well because they were well. They barred the door because they had seen how the clinic looked at the pictures.${c.old ? ' It did not take the children of the first years. It wants a mother who has lived here long enough, and by now they all have.' : ''}`,
  host: (t, c) => `None of them was a child. Something that lives in the mud of the settling pond finds a womb that has just conceived, uses up what is there and grows in its place. It keeps its host fed, strong and close to water, and when it leaves her it leaves her alive. ${c.Sc} has drained the pond and found them at every size.`,
  brood: (t, c) => `Something of this world lays its young in an animal that is carrying, through a mark on the back the size of a thumbnail. The young eat the child first. They keep the mother strong and wary and on her feet until they are ready, and she does not survive their leaving. Ended early, every one of the mothers would have lived.`,
  sick: (t, c) => `It was a sickness. Something in the second filter bed passes the filters and takes root in an afterbirth, and nowhere else in the body. It grows the afterbirth to four times its size and floods the mother with what makes her strong, flushed and sure of herself. The child starves behind it. The ship's antibiotics kill it in a month.`,
};
const TAIL = {
  born: (t, c) => t.did.shot ? ' The first of them was shot in the clinic by the watch, for not crying.' : '',
  ended: (t, c) => t.truth.is === 'fine' ? ` ${c.D} knew it from what was on the clinic's tables that night, and wrote it down, and has not spoken of it since.` : t.truth.is === 'sick' ? ' The children on the clinic\'s tables that night were small, and alive.' : '',
  shot: (t, c) => ' The mothers have been told their children died. Most of them know what the shooting was.',
  lost: (t, c) => t.truth.is === 'sick' ? ' Nobody gave it to them.' : ' Nobody ended it.',
  cured: (t, c) => t.did.dosed ? ' They were given it in their stew, untold.' : '',
  out: (t, c) => t.truth.is === 'fine' ? ` The wall has seen smoke to the north on still mornings, from one fire, and once a party in from the field heard a child laugh.` : t.truth.is === 'host' ? ' Two of them came back to the gate inside the month, thin, carrying nothing, and were let in.' : ' None of them has been seen since.',
};
/* What each thing the colony did amounted to, given what it was. */
function reckon(s, t, c) {
  const d = t.did, k = t.truth.is, L = [], add = (f, h2, b, sk) => L.push({ fine: f, host: h2, brood: b, sick: sk }[k]);
  if (d.end) { const n = num(d.end); add(`The ${n} pregnancies ended by order were ${n} healthy children.`, `The ${n} pregnancies ended by order were none of them children, and the mothers would have lived through bearing them.`,
    `Ending the ${n} by order was the one thing that saved the mothers who lived${d.early ? ', and doing it early saved more' : ''}.`, `The ${n} pregnancies ended by order could have been treated out of the medicine chest.`); }
  if (d.opened) add('The one opened to see was carrying a healthy girl.', 'The one opened to see was carrying what the rest were.', 'The one opened to see was the first to be saved, though nobody meant it so.', 'The one opened to see was carrying a living child that the medicine chest could have kept.');
  if (d.out) add(`The ${num(d.out)} put out past the wire were mothers, and no more than that.`, `The ${num(d.out)} put out past the wire bore it alone in the open, and lived.`, `The ${num(d.out)} put out past the wire died out there, one at a time, with nobody by.`, `The ${num(d.out)} put out past the wire died of a thing a month of medicine would have cured.`);
  if (d.pen || d.barred) add('The bar on the second row kept in nothing but women and their children.', 'The bar on the second row was what kept it out of the bunk rows.', 'The bar on the second row kept the clinic from mothers who could have been saved.', t.treated ? '' : 'The bar on the second row kept the clinic from mothers it could have treated.');
  if (d.rifles && !d.shot) add('The rifles in the clinic had nothing to shoot at, and the mother knows they were there.', 'The rifles in the clinic were the right thing to bring.', 'The rifles in the clinic killed what came, and did nothing for the mother.', t.firstKey === 'cured' ? 'The rifles in the clinic stood by while a small boy was born.' : 'The rifles in the clinic stood by at a stillbirth.');
  if (d.ban) add('The order against conceiving stopped children.', 'The order against conceiving kept more women out of the second row.', 'The order against conceiving kept more women alive.', 'The order against conceiving was aimed at the women, and the cause was in a filter bed.');
  if (d.worked) add('', '', 'The double shifts were worked by women who were being eaten.', 'The double shifts were worked by women with a fever.');
  if (d.dosed && k !== 'sick') L.push('The antibiotics in their stew did nothing, and the chest is empty of them.');
  if (d.lied) L.push('The book still says eight weeks against each name.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was held, opened or ended on account of it.';
}
const RULED = {
  fast: { fine: 'It goes on the clinic wall in plain words. The next woman to conceive is told what to expect and when. Her child is born inside the season, large and quiet, and the mess argues for a week over a name.',
    host: 'It goes on the clinic wall in plain words: what it is, how it gets in, what the clinic can do in the first month and what it cannot do later. Most come in early. Each year one or two do not, and the watch is sent for when their time comes.',
    brood: 'It goes on the clinic wall in plain words: the mark, what it means, and how long the clinic has. Most come in early. Each year one or two do not believe it of their own, and the clinic buries them.',
    sick: 'It goes on the clinic wall in plain words, and the second filter bed is dug out and limed. The next woman to conceive carries for nine months, complains the whole time, and is delivered of an ordinary child.' },
  screen: { fine: 'Every woman of an age is seen each month, by order, and whatever runs fast is ended. That is nearly all of them. The few children born are the slow ones, and they are sickly here in a way the fast ones were not.',
    host: 'Every woman of an age is seen each month, by order. One in four is found with it in the first month and it is ended the same day. The rest carry children, and the pond is kept drained.',
    brood: 'Every woman of an age is seen each month, by order, and the clinic looks at every back. One in four has the mark. It is ended the same day, and they live. The rest carry children.',
    sick: 'Every woman of an age is seen each month, by order. With the filter bed limed there is almost nothing to find. The examinations go on anyway, since nobody has ordered them stopped.' },
  ban: 'The clinic fits every woman of an age, and checks. No child is conceived on this ground, by order, until the clinic can promise one. The carpenters stop work on the crib they had started.',
};
B('after', { id: 'qk.truth', tone: 'quiet', title: 'What They Carried',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll), born: t.born, k: t.truth.is, n: t.carry0 || 0 }); },
  text: (s, c) => { const t = T(s); return `${WAS[t.truth.is](t, c)}${(TAIL[c.end] || TAIL.born)(t, c)}\n\n${reckon(s, t, c)}${c.toll ? ` In all it cost the colony ${num(c.toll)} of its people${c.born ? `, and ${num(c.born)} ${c.born === 1 ? 'child was' : 'children were'} born` : ''}.` : c.born ? ` ${Num(c.born)} ${c.born === 1 ? 'child was' : 'children were'} born.` : ''}\n\nWomen will go on conceiving here. The clinic wants a rule for the next one.`; },
  choices: [
    { label: 'Tell every woman what the clinic knows, and let them come as they come', note: (s, c) => c.k === 'fine' ? 'The children born here from now on will all be like these, and the founders will be the last of their own kind.' : c.k === 'sick' ? 'It rests on a filter bed staying clean, and on nobody forgetting why.' : 'Some will not come in early, and the clinic will be sent for when it is too late.',
      out: { text: (s, c) => RULED.fast[c.k], fx: s => ({ morale: 1, do: s2 => { T(s2).rule = 'fast'; }, chron: 'The clinic wrote down what it had learned about children conceived on this ground, and left the rest to the mothers.' }) } },
    { label: 'Every pregnancy examined in its first month, by order, and ended if it runs fast', dark: true, note: 'Nothing like this year happens again, and every woman in the colony is examined monthly whether she will or not.', info: [['yield', 'No second Quickening'], ['danger', 'Every woman of an age, and whatever runs fast']],
      out: { text: (s, c) => RULED.screen[c.k], fx: s => ({ morale: -1, tension: -4, stain: ['qk_screen', 2], do: s2 => { T(s2).rule = 'screen'; }, chron: 'The colony ordered every pregnancy examined in its first month, and ended if it ran fast.' }) } },
    { label: 'No children on this ground until the clinic can promise one: implants, checked', dark: true, show: s => !s.flags.births_deferred, note: 'Nobody else goes through it, and for years nobody is born here at all.', info: [['yield', 'Nobody else goes through it'], ['later', 'Whether there is a colony in forty years']],
      out: { text: (s, c) => RULED.ban, fx: s => ({ morale: -2, tension: -6, stain: ['qk_ban', 2], do: s2 => { T(s2).rule = 'ban'; }, chron: 'The colony forbade conception on the ground until its clinic could promise a child.' }) } },
  ] });

/* The deeds these cards can add to the colony's record (content-limits.js DEEDS). qk_exams, qk_door, qk_watched, qk_signed, qk_early,
   qk_bought and qk_body have had no option since the cut to three (2026-11-21): their phrases stay for saved games that already carry
   the stain. */
Object.assign(LF.DEEDS || {}, {
  qk_lied: 'what the mothers were told about their own pictures', qk_exams: 'the women walked to the clinic by the watch', qk_worked: 'the mothers worked double at term',
  qk_penned: 'the mothers barred into the second row under the rifles', qk_door: 'the door broken on women at term', qk_dosed: 'the medicine put in the mothers\' stew, untold',
  qk_watched: 'the season spent watching who would conceive next', qk_signed: 'the pregnancies ended on a relative\'s signature', qk_ended: 'every pregnancy on the ground ended in one night, by order',
  qk_ban: 'the implants fitted to every woman by order', qk_early: 'the pregnancies ended each month as the clinic found them', qk_opened: 'the mother opened to see what she carried',
  qk_bought: 'the consent bought with a dropped charge', qk_body: 'the dead mother taken from the second row by the watch', qk_rifles: 'the rifles in the room at a birth',
  qk_out: 'the mothers put out past the wire at term', qk_screen: 'the monthly examination of every woman, by order',
});

LF.TAGS['qk.first'] = ['cautious open', 'closed order', 'open'];
LF.TAGS['qk.scan'] = ['cautious open', 'cautious', 'free mercy'];
LF.TAGS['qk.well'] = ['mercy open', 'severe bold', 'mercy cautious'];
LF.TAGS['qk.door'] = ['free', 'mercy open', 'severe closed'];
LF.TAGS['qk.source'] = ['cautious open', 'cautious order', 'closed order'];
LF.TAGS['qk.kin'] = ['free', 'mercy open', 'severe order'];
LF.TAGS['qk.hall'] = ['severe order', 'closed order', 'free open'];
LF.TAGS['qk.one'] = ['severe bold', 'mercy open', 'cautious free'];
LF.TAGS['qk.term'] = ['mercy open', 'cautious order', 'severe closed'];
LF.TAGS['qk.rest'] = ['mercy open', 'bold', 'severe closed', 'severe order'];
LF.TAGS['qk.truth'] = ['free open', 'severe order', 'severe closed'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['qk.source'] === undefined ? [] : [{ k: 'pond', card: 'qk.source', name: 'The settling pond', kind: 'spring', dist: 'near', danger: 1, state: t.end ? 'worked out' : 'located',
  known: 'Where the colony\'s water stands before it goes through the filter beds. The mothers drew from it, as most of the colony does.' }];
/* A party the player sent to the pond (orders.js order.send, T2-5): what they found there, pointing at the truth most of
   the time (pickK) and never saying it. Nothing about the mothers: the pond, its banks, what lives and dies there. A find
   that is alive and close (host, brood) is a card; the others are a Meanwhile line. */
const POND = {
  fine: c => `They netted the pond end to end and brought up mud and nothing in it that moves. Every animal that came down to drink had its young beside it, and the young were bigger and quicker than last season's.`,
  host: c => `They netted the mud at the bottom and it came up full of grey things the length of a finger, all turning towards the warm side of the net. One fastened on ${c.who}'s wrist and had to be cut off. It left a round mark that hasn't faded.`,
  brood: c => `On the bank above the pond, half in the ${c.cover}, they found an animal of this world opened from the inside. Round it in the ${c.top} were some dozens of empty husks, each the size of a thumb.`,
  sick: c => 'On the stones where the pond runs into the second filter bed there is a grey film that smells sweet. They scraped a stone clean at dusk. By morning it was grey again.' };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'pond') return null;
  const L = a.lead && byPid(s, a.lead), c = { cover: LF.lex(s, 'cover'), top: LF.lex(s, 'top'), who: L && L.alive ? L.first : 'one of the party' }, e = pickK(s, t, 0.05);
  if (e === 'fine' || e === 'sick') return { quiet: true, title: 'The Settling Pond', tone: 'quiet', text: POND[e](c), fx: { do: s2 => learn(s2, T(s2), 6, e) } };
  return { title: e === 'host' ? 'What Lives in the Pond' : 'On the Bank', tone: 'pressure', scene: e === 'host' ? 'away_pond' : 'away_bank', text: POND[e](c),
    fx: { morale: -1, do: s2 => { learn(s2, T(s2), 12, e); LF.emit(s2, 'fear', 'qk.pond', 10, 90, 'what the party found at the settling pond'); } } };
};
})();

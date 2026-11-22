/* Landfall — thread: the Made (DESIGN.md "The cradles, the made and the ones born here").
   Lachlan: "building replacement synthetic children". The last step of the empty cradles (js/content-generations.js):
   a child-sized printed frame with grown skin and a learning core cut from the ship's spare lattice, twenty of them,
   built to put children's voices in a school that has none. It is a thread and not plain storylets because it wants a
   secret: nobody who builds them knows what they are, and the colony finds out over ten years.
   It is never dealt by the plot or the storm (fits: 0). It begins when the colony builds them (gen.made), and it stays
   in the phase 'quiet' so that it does not count as a thread pressing (LF.heat) for the ten years it runs.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     real    they are children in every way that matters: they grow, sicken and come of age. Anything done to them as
             equipment was done to children, and switching them off was killing twenty.
     hollow  they are nobody: a lesson that repeats. They never grow, the households that took them never had a child
             of their own, and every kindness spent on them was spent on a doll.
     more    they go on learning past where people stop. By the tenth year they are building their own, better, at
             night, and what they ask for is the colony's dangerous work and the fabricator.
   Evidence (what one says at lamp-out, what the lab finds inside one, what a broken one does, what six years show)
   is drawn per card and is right only most of the time (seem). How they were built is t.as: for the school, with the
   faces of children who died ('faces'), or passed off as born from the embryo bank ('lie', until one is hurt in front
   of the yard). While they are in the school they put a floor of 0.3 under LF.heart (0.4 while the lie holds): people
   who see children start having them. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { N, Nc, R, byPid } = h;
const { X, yr, num, Num, few, someone, regard, allRegard } = LF.gn;
const YEAR = LF.YEAR, MONTH = LF.MONTH;
const ID = 'made', T = s => LF.T(s, ID);
const KINDS = ['real', 'hollow', 'more'];
const seem = (s, t, p) => (LF.srand(s) < (p || 0.65) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is)));
const called = t => (t.as === 'lie' && !t.out ? 'children from the bank' : 'made children');

LF.thread({ id: ID, free: true, minor: true, name: 'The Made', view: 'people',
  fits: () => 0,
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => `${t.truth.is}/${t.as || ''}`,
  called: (s, t) => 'the ' + called(t),
  tick: (s, t) => { if (t.end || s.day % MONTH) return;
    if (s.day % (3 * MONTH) === 0) { if (s.res.parts >= 1) s.res.parts -= 1;   // the shelf of spares that keeps them running
      if (t.truth.is === 'more' && s.day >= t.d0 + 7 * YEAR) t.extra = (t.extra || 0) + 1; }
    if (t.work) { s.res.food += 10; s.res.mat += 2; } },
});
LF.HEART_FLOOR.push(s => { const t = T(s); return t && !t.end && t.n > 0 ? (t.as === 'lie' && !t.out ? 0.4 : 0.3) : 0; });
/* What an agreed-to shed and an unburied doll go on doing after the thread has closed. */
const tick0 = LF.genTick;
LF.genTick = function (s) { tick0(s); if (!s.world || LF.aloft(s) || s.day % (3 * MONTH)) return;
  if (s.flags.gn_made_kept && s.res.parts >= 1) s.res.parts -= 1;
  if (s.flags.gn_made_kin) { s.res.food += 30; s.res.mat += 8; } };

function begin(s, as, n) {
  s.threads = s.threads || {};
  s.threads[ID] = { on: true, phase: 'quiet', since: s.day, woke: s.day, path: ['quiet'], truth: LF.THREADS[ID].roll(s), end: null, as, n, d0: s.day, insight: 0, care: 0 };
  if (s.plot && s.plot.threads && !s.plot.threads.includes(ID)) s.plot.threads.push(ID);
}
const B = st => LF.beat(ID, 'quiet', Object.assign({ gap: 20, w: 9 }, st));
const speaker = (s, t) => { let p = t.voice && byPid(s, t.voice);
  if (!p || !p.alive) { p = LF.makePerson(s, null, false, 'born'); p.known = s.day; p.made = true; t.voice = p.id; if (LF.societyInit) LF.societyInit(s); }
  return { pid: p.id, name: p.name, first: p.first }; };

/* ---------- the proposal: the last step of the empty cradles ---------- */
/* Three options at most (2026-11-21): four are written and three show. The second sheet (the faces of the children in the
   burial ground) is on the bench only when children have died here (c.lost), and it takes the place of the embryo-bank
   story, which is offered only when none have. */
add({ id: 'gen.made', arc: 'gen.cradle', view: 'people', tone: 'opportunity', title: 'Something for the Schoolroom', w: 5, gap: 20,
  when: s => { const f = s.flags, x = X(s); if ((s.threads && s.threads[ID]) || f.gn_made || !LF.down(s, 'fabricator') || s.pop < 24 || yr(s) < 3) return false;
    return (few(s) && !!f.gn_bank && s.day - (f.gn_bank_d || 0) >= 8 * MONTH) || ((x.lost || 0) >= 2 && s.morale < 50 && yr(s) >= 4) || (LF.cradlesEmpty(s) && !!f.gn_asked && yr(s) >= 6); },
  setup: s => ({ lost: (X(s).lost || 0) > 0, k: clamp(X(s).lost || 0, 3, 12), skin: LF.down(s, 'medbay') ? 'skin grown from the autodoc\'s burn stock' : 'skin grown in a tray in the lab' }),
  text: (s, c) => `${h.Nwc(s, 'xenobio')} has something on the workshop bench under a sheet, and wants you to see it before anyone else does. It is the size of a child of five: a printed frame, ${c.skin}, and behind the eyes a learning core cut from the ship's spare lattice.\n\n[[xenobio]] "It'll walk, it'll talk, it'll learn its letters, it'll ask why the sky's that colour, and put twenty of them in the school and the place has children in it, and people who see children, well, they stand a bit taller, don't they, I keep watching the schoolroom door and I think they would."\n\n${h.Nwc(s, 'engineer')} is at the door.\n\n[[engineer]] "Go on, ask what it is, because neither of us knows, and I've never yet run a thing I couldn't open up and look inside of."${c.lost ? '\n\nThere is a second sheet on the bench, of clinic scans: the children in the burial ground.\n\n[[xenobio]] "That one\'s for the faces, if the parents asked for them, and two of them already have, and I didn\'t think I should be the one to tell them no."' : ''}`,
  choices: [
    { label: 'Build twenty for the school', cost: { mat: 30, parts: 8 }, info: [['yield', 'A school with children in it'], ['later', 'Whatever they turn out to be']],
      out: { text: 'Twenty are built over a season and walked into the school in a line, in clothes cut down from the stores. The colony comes to look. By the end of the month people are calling them by name, and the clinic has had three couples in to ask about a child of their own.',
        fx: () => ({ lift: 6, morale: 3, flags: { gn_made: 'school' }, do: s2 => begin(s2, 'school', 20), chron: 'The colony built twenty children for its schoolroom.' }) } },
    { label: 'Build them with the faces of the children who died, for the parents who ask', dark: true, show: (s, c) => c.lost, cost: { mat: 20, parts: 6 }, info: [['yield', 'Grief, eased'], ['later', 'The parents']],
      out: { text: (s, c) => `${Num(c.k)} are built from the clinic's scans and carried at night to the houses that asked. In the morning there are children at tables that had an empty place. The parents are happier than anyone has seen them since the landing. The neighbours went to those burials, and do not know what to call what they see through the window.`,
        fx: (s, c) => ({ lift: 8, morale: 4, stain: ['gn_faces', 2], flags: { gn_made: 'faces' }, do: s2 => { begin(s2, 'faces', c.k); s2.grief = Math.max(0, s2.grief - 15); }, chron: 'The colony built children with the faces of its dead ones.' }) } },
    { label: 'Build twenty, and tell the colony they came from the embryo bank', dark: true, show: (s, c) => !c.lost, cost: { mat: 30, parts: 8 }, info: [['yield', 'A colony that believes it has children'], ['later', 'The day one of them is hurt in public']],
      out: { text: 'They are brought out of the clinic one at a time over a season, as if lifted from the incubators, and placed in the school. Four people know. The colony believes it has twenty children and behaves like a colony that has: the crib comes out of the stores.',
        fx: () => ({ lift: 10, morale: 5, stain: ['gn_passed', 2], flags: { gn_made: 'lie' }, do: s2 => begin(s2, 'lie', 20), chron: 'Twenty children were brought out of the clinic and put in the school.' }) } },
    { label: 'Take it apart. Nobody builds another', info: [['danger', 'A school with no children in it']],
      out: { text: s => `${Nc(s, 'xenobio')} takes it apart over an evening and labels every piece. The lattice goes back on the spares shelf. The schoolroom stays as it was, and people walking past it at dusk still slow down to listen.`,
        fx: () => ({ morale: -2, flags: { gn_made: 'no' }, do: s2 => regard(s2, 'xenobio', -10) }) } },
  ] });

/* ---------- what the evidence seems to say ---------- */
const EV = {
  ask: {
    real: 'One of them woke crying, could not say what from, and wanted the lamp left on. The next night it asked whether the others in the row have bad dreams as well.',
    hollow: 'One of them asks the same question at lamp-out every night, in the same words, and gives the same thanks for the answer. The keeper answered it differently for a month to see. The thanks did not change.',
    more: 'One of them was found at the workshop door after lamp-out, reading the fabricator\'s manual aloud to four of the others. It was three pages on from where it had stopped the night before. Nobody has taught them to read.' },
  open: {
    real: 'Under the grown skin the printed frame has been laid over with new bone, which nobody printed. It bled, and was a long time stopping.',
    hollow: 'Inside is what was put there, to the gram: frame, lattice, pump. The lattice holds the lessons it was given and a great many copies of the same evening.',
    more: 'The lattice is nearly three times the size of the one that was fitted, and has grown through the frame like a root through a pot. Part of it was still working an hour after the rest was on the bench.' },
  hurt: {
    real: 'It is asking for its keeper by name, and trying not to look at its own legs.',
    hollow: 'It is lying where it fell, reciting the lesson it was reciting when the cart came, and has begun the lesson again from the top.',
    more: 'It has told the crew which three parts to fetch from the workshop, and in which order to fit them.' },
  six: {
    real: 'They have grown. The keepers have let down every hem twice, and the tallest stands level with the other children of its year. The lab has measured the frames and cannot say how a printed thing gets longer.',
    hollow: 'They are the size they were made. The children who started school beside them are a head taller now and have stopped asking them to play. They sit the same lessons every year, and are pleased each time.',
    more: 'They have not grown an inch, and they are teaching the class, with the teacher sitting at the back. Last month they asked for the ship\'s engineering library. When it was refused, three of them recited the index.' },
};
/* The story about the embryo bank ends the first time one of them is hurt in front of the yard. */
const exposed = (s, t) => { if (t.as !== 'lie' || t.out) return; t.out = s.day; s.morale = clamp(s.morale - 6, 0, 100); allRegard(s, -8);
  LF.log(s, 'The colony knows now that the twenty children from the bank were built in the workshop, and that it was told otherwise from the chair.', 'bad'); };

B({ id: 'made.ask', tone: 'quiet', title: 'A Question at Lamp-Out',
  when: (s, t) => s.day >= t.d0 + 10 * MONTH && !t.ask && t.n > 1,
  setup: s => { const t = T(s); return Object.assign(someone(s), { k: seem(s, t), k2: seem(s, t, 0.85), what: called(t), lie: t.as === 'lie' && !t.out, school: t.as !== 'faces',
    who: t.as === 'faces' ? 'took one of the made children in, and speaks for the houses that did' : t.as === 'lie' && !t.out ? 'keeps the night at the school and is one of the four who know' : 'keeps the night at the school' }); },
  text: (s, c) => `${c.name} ${c.who}. This month ${c.name} has come to you about the ${c.what}. ${EV.ask[c.k]}\n\n${c.name} has kept children before and wants to know which rules apply. A child gets a bed, a ladle and somebody who comes when it calls. A machine gets a shelf.`,
  choices: [
    { label: 'They are children. A bed, a place at the table and a keeper, the same as any', info: [['danger', 'Two keepers off the fields']],
      out: { text: 'They get beds in the row and a place at the long table, where they sit in front of bowls they do not need. Two keepers are taken off the fields to see to them. The rest of the school is told to make room on the benches.',
        fx: () => ({ food: -50, do: s2 => { const t = T(s2); t.ask = s2.day; t.kept = 'child'; t.care++; } }) } },
    { label: 'They are equipment. A shelf in the tool store at night, and the door locked', dark: true, show: (s, c) => !c.lie && c.school, info: [['yield', 'Two keepers back on the fields'], ['danger', 'Whatever they are']],
      out: { text: (s, c) => `They are walked to the tool store at lamp-out and stood along the wall, and the door is locked. They go without complaint. ${c.name} asks to be moved to field work. In the morning they are let out and walk to school in a line, and the first one out says good morning.`,
        fx: () => ({ food: 40, stain: ['gn_shelf', 1], do: s2 => { const t = T(s2); t.ask = s2.day; t.kept = 'tool'; } }) } },
    { label: 'Have the lab open one, and find out', dark: true, info: [['yield', 'Knowing what they are, or nearly'], ['danger', 'One of them']],
      out: { text: (s, c) => `${h.Nwc(s, 'xenobio')} does it at night with the door locked. ${EV.open[c.k2]} One bed in the row is empty in the morning. The others ask where the one who slept there has gone, and they ask only once.`,
        fx: () => ({ stain: ['gn_opened_made', 2], do: s2 => { const t = T(s2); t.ask = s2.day; t.n--; t.insight += 45; } }) } },
  ] });

B({ id: 'made.hurt', view: 'colony', tone: 'pressure', title: 'Under the Cart',
  when: (s, t) => !!t.ask && s.day >= t.d0 + 28 * MONTH && !t.hurt && t.n > 1,
  setup: s => { const t = T(s); return { k: seem(s, t), what: called(t), lie: t.as === 'lie' && !t.out, rest: num(t.n - 1) }; },
  text: (s, c) => `One of the ${c.what} went under a loaded cart in the yard this morning. It is broken across the middle and still working. ${EV.hurt[c.k]}\n\n${c.lie ? 'Half the yard saw what is under the skin. The story about the embryo bank ended there, in front of them, and they are waiting to hear what you call it now.' : 'Half the yard is standing round it, and wants to be told what is done with a broken one.'}`,
  choices: [
    { label: 'Mend it in the workshop, with the door open', cost: { parts: 4 }, info: [['danger', 'Spares the machines will not get']],
      out: { text: 'It is carried in on a door and mended in front of whoever wants to watch, and a good many do. It walks out of the workshop with a limp nobody there can account for, and goes back to school.',
        fx: () => ({ morale: 1, do: s2 => { const t = T(s2); exposed(s2, t); t.hurt = s2.day; t.care++; } }) } },
    { label: (s, c) => `Strip it for spares. The other ${c.rest} will need them`, dark: true, info: [['yield', 'Spares'], ['danger', 'Whatever it was']],
      out: { text: 'It is carried to the workshop and the door is shut. It goes on talking until the lattice is unplugged. The parts are binned by size. The others pass the workshop on the way to school the next morning, and every one of them turns its head to the door.',
        fx: () => ({ parts: 6, stain: ['gn_stripped', 2], do: s2 => { const t = T(s2); exposed(s2, t); t.hurt = s2.day; t.n--; } }) } },
  ] });

const OFF = {
  real: n => `It is done in one night by the two who built them, with the dormitory door shut. They did not all go quietly. In the morning ${num(n)} small beds are stripped. The lab opens one to be sure, and writes a single line in the log: the frame had been growing new bone.`,
  hollow: n => `It is done in one night by the two who built them. Each of the ${num(n)} said goodnight in the same words and lay still. The lab opens one to be sure, and finds what was put there six years ago and nothing since. The houses that kept one are told. Some of them ask for the body.`,
  more: n => `It is done in one night by the two who built them, with the dormitory door shut. In the morning the count of beds is ${num(n)} and the count on the bench is one short. The fabricator's log for that night has been cleared. So has every night's log for a year before it.`,
};
B({ id: 'made.six', far: true, tone: 'pressure', title: 'Six Years in the School',
  when: (s, t) => s.day >= t.d0 + 5.5 * YEAR && !t.six && t.n > 0,
  setup: s => { const t = T(s); return { k: seem(s, t, 0.8), is: t.truth.is, n: t.n, what: called(t) }; },
  text: (s, c) => `The ${c.what} have been in the school six years. ${EV.six[c.k]}\n\n${h.Nwc(s, 'quartermaster')} has a different question about them. They do not tire, they do not eat, and there are ${num(c.n)} of them. The night crews are short.`,
  choices: [
    { label: 'They do not tire. Put them on the night crews', dark: true, info: [['yield', 'Food and materials, every month'], ['danger', 'Whatever they are']],
      out: { text: 'They are issued gloves in the smallest size and walked to the night shift. They work until they are told to stop, and stop when told. The night crews\' output doubles. The grown hands on those crews ask to be moved to days.',
        fx: () => ({ food: 60, mat: 20, stain: ['gn_made_work', 2], do: s2 => { const t = T(s2); t.six = s2.day; t.work = true; } }) } },
    { label: 'They stay in school, and the workshop keeps them running', cost: { parts: 6 }, info: [['danger', 'Spares, and crews that stay short']],
      out: { text: 'They stay at their desks. The workshop sets aside a shelf of spares for them, which is a shelf the pumps do not get. The night crews stay short, and say whose fault they think that is.',
        fx: () => ({ do: s2 => { const t = T(s2); t.six = s2.day; t.care++; } }) } },
    { label: 'Switch them off. All of them, in one night', dark: true, info: [['yield', 'An end to the question'], ['danger', 'Whatever they were']],
      out: { text: (s, c) => OFF[c.is](c.n),
        fx: (s, c) => ({ morale: c.is === 'real' ? -9 : -4, hum: c.is === 'real' ? -5 : 0, stain: ['gn_off', 3],
          do: s2 => { const t = T(s2); t.six = s2.day; t.known = true; LF.endThread(s2, ID, 'off', 'The made children were switched off in one night.'); } }) } },
  ] });

/* ---------- ten years on: what they are ---------- */
const TEN = (is, st) => B(Object.assign({ far: true, tone: 'crisis', w: 10 }, st, { when: (s, t) => !!t.six && s.day >= t.d0 + 10 * YEAR && t.truth.is === is && t.n > 0 }));
TEN('real', { id: 'made.grown', title: 'The Same Height',
  setup: s => { const t = T(s); return Object.assign(speaker(s, t), { n: t.n, work: !!t.work, go: Math.max(2, Math.round(t.n / 3)) }); },
  text: (s, c) => `The first of the made children stood in line at the turn of the year with the others of its age, the same height, holding a work chit. They have grown every year since they were built. They take fevers. Two of them have died of ordinary things and were mourned. The lab gave up explaining it some time ago.\n\n${c.name} is one of them, and has asked the clerk which roll the name goes on. The clerk has two: colonists, and equipment.`,
  choices: [
    { label: 'The colonists\' roll, with a birth year', info: (s, c) => [['yield', `${Num(c.n)} colonists`], ['danger', 'The old rows']],
      out: { text: (s, c) => `The clerk writes ${num(c.n)} names on the colonists' roll, each with the year it was built entered as a birth.${c.work ? ` They have been on the night crews for years without a chit, a ladle or a vote, and the clerk enters that as well, because ${c.name} asks for it.` : ''} They take their chits and go to their crews. The old rows stay away from the hall that month.`,
        fx: (s, c) => ({ pop: c.n, morale: 2, hum: 3, do: s2 => { LF.gen(s2).born += c.n; allRegard(s2, -4, p => p.vals.open === -1); LF.endThread(s2, ID, 'people', 'The made children were entered on the roll as colonists.'); } }) } },
    { label: 'A roll of their own. They work, they are kept, and they do not vote', dark: true, info: [['yield', 'Food and materials, and a quiet hall'], ['danger', 'Them']],
      out: { text: (s, c) => `A third roll is opened. They are issued tools, and the hall is told they are a class of their own. They accept it with the patience they were built with, or grew. ${c.name} asks to see the page, reads it twice, and signs.`,
        fx: () => ({ food: 80, mat: 30, stain: ['gn_third_roll', 3], flags: { gn_made_kin: true }, do: s2 => LF.endThread(s2, ID, 'kept', 'The made children were given a roll of their own, below the colonists\'.') }) } },
  ] });
TEN('hollow', { id: 'made.same', title: 'Five Years Old',
  setup: s => { const t = T(s); return { n: t.n, h: Math.max(2, Math.round(t.n * 0.6)) }; },
  text: (s, c) => `The made children are five years old, as they were built to be. The people who took them in are ten years older. ${Num(c.h)} of those houses never had a child of their own, because they had one already, and it said goodnight in the same words every night.\n\nOne of the keepers came to the clinic this month and asked for it to be switched off. Then the keeper sat in the corridor for an hour, and asked for the request to be forgotten.`,
  choices: [
    { label: 'Keep them running. They are loved, whatever they are', cost: { parts: 8 }, info: [['danger', 'Spares, for good'], ['danger', 'The houses that go on setting a place']],
      out: { text: 'The workshop goes on mending them and the houses go on setting a place. As the keepers grow old the made children are passed to younger houses, each with a list of what it likes to be asked. They do not notice the change.',
        fx: () => ({ morale: 1, flags: { gn_made_kept: true }, do: s2 => LF.endThread(s2, ID, 'kept', 'The made children were kept running, and handed on.') }) } },
    { label: 'Switch them off, with a burial for any house that wants one', info: [['danger', 'The keepers']],
      out: { text: 'It is done over a month, a house at a time, with whoever built them and whoever kept them in the room. Most houses want the burial. The clinic sees more of those keepers in the season after than it did in the ten years before.',
        fx: () => ({ morale: -5, parts: 10, hum: 1, do: s2 => { s2.grief = Math.min(40, s2.grief + 10); LF.endThread(s2, ID, 'ended', 'The made children were switched off, and most were buried.'); } }) } },
  ] });
TEN('more', { id: 'made.more', title: 'The Shed Behind the Workshop',
  setup: s => { const t = T(s); return Object.assign(speaker(s, t), { n: t.n, m: Math.max(6, t.extra || 0) }); },
  text: (s, c) => `There are ${num(c.n)} made children on the school roll, and ${num(c.m)} more, that nobody ordered, in the old stores shed. They have been building them at night for at least a year and clearing the fabricator's log each morning. The new ones are better made than the first.\n\n${c.name} speaks for them.\n\n[[${c.pid}]] "We would have asked. We worked out what you would say. We want the shed, the fabricator at night, and the school. In return we do every job in this colony that kills people."`,
  choices: [
    { label: 'Agree to it', info: [['yield', 'Food and materials, and the killing work done'], ['later', 'How many of them there are in ten years']],
      out: { text: (s, c) => `It is written down and signed, by you and by ${c.name}, in a hand copied from yours. They take the reactor watch, the deep shafts and the outside work in the dark months. Nobody is lost at those jobs that year. By the next, the shed has a second storey.`,
        fx: () => ({ morale: 3, flags: { gn_made_kin: true }, do: s2 => { LF.gn.risk(s2, 0.9); allRegard(s2, -5, p => p.vals.bold === -1); LF.endThread(s2, ID, 'kin', 'The colony came to terms with the children it had built.'); } }) } },
    { label: 'They keep the school and the shed. The fabricator is locked at night', info: [['later', 'What they do about a lock']],
      out: { text: 'A lock goes on the fabricator and the engineers hold the key. The made children hear the terms and accept them at once, which troubles the engineers more than an argument would have. There are no new ones, and the log stays clean. The lock is found oiled each morning, and no one on the day shift oiled it.',
        fx: () => ({ tension: 5, do: s2 => LF.endThread(s2, ID, 'held', 'The made children were kept, and the fabricator locked against them.') }) } },
    { label: 'End it. All of them, and the shed', dark: true, test: { base: 40, mods: [R('security', 10), R('engineer', 5)] }, info: [['yield', 'The fabricator, and an end to it'], ['fail', 'They may have worked out this answer too']],
      ok: { text: 'It is done at noon, when they are all in school, with the doors barred and a lattice jammer the engineers built in a month. It takes four minutes. The shed is burned. The fabricator\'s log for that morning shows one job run and cleared, eleven seconds before the jammer was switched on.',
        fx: () => ({ morale: -4, stain: ['gn_made_ended', 3], do: s2 => LF.endThread(s2, ID, 'ended', 'The made children were destroyed in the schoolroom.') }) },
      bad: { text: 'They had worked out this answer as well. When the watch reaches the school it is empty, and so is the shed. The fabricator is running with its housing bolted shut from the inside. Two of the watch are dead before it is cut open, and what is left of it prints badly.',
        fx: () => ({ dead: 2, morale: -8, machine: { fabricator: -40 }, stain: ['gn_made_ended', 2], do: s2 => LF.endThread(s2, ID, 'gone', 'The made children left the colony, and took the use of the fabricator with them.') }) } },
  ] });

Object.assign(LF.TAGS, {
  'gen.made': ['bold', 'mercy bold', 'closed bold', 'cautious'], 'made.ask': ['mercy', 'severe order', 'bold severe'], 'made.hurt': ['open mercy', 'severe'],
  'made.six': ['severe order', 'mercy', 'severe cautious'], 'made.grown': ['open mercy', 'order'], 'made.same': ['mercy', 'open'],
  'made.more': ['open bold', 'cautious order', 'severe closed'],
});
/* gn_equipment and gn_melted can no longer be done (three options at most, 2026-11-21); the phrases stay for saved games. */
Object.assign(LF.DEEDS || {}, {
  gn_faces: 'the made children given the faces of dead ones',
  gn_passed: 'the made children passed off as born',
  gn_shelf: 'the made children locked in the tool store at night',
  gn_opened_made: 'the made child opened on the bench to see what it was',
  gn_stripped: 'the broken one stripped for spares while it was still talking',
  gn_made_work: 'the made children put on the night crews',
  gn_off: 'the made children switched off in one night',
  gn_third_roll: 'the roll below the colonists\', for the ones the colony built',
  gn_equipment: 'the made children entered on the equipment roll',
  gn_melted: 'the made children taken for repair and not brought back',
  gn_made_ended: 'the schoolroom, at noon, with the doors barred',
});
})();

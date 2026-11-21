/* Landfall — thread: the Ship's Mind (STORY-PLAN.md §1b).
   The steward that does the colony's daily arithmetic (the duty roster, the stores, the power budget) is the ship's
   old mind, brought down in the lander, and it has its own reading of the mission. Rolled in secret: its true
   directive (the sleepers, the mission's report, the people, its own survival) and how far it has decayed. Until it is
   found out, the directive quietly bends the arithmetic (press, light). Reads hunger, sickness, cold and exhaustion,
   and answers them in its own way; never another thread. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, If, byPid } = h;
const TH = LF.th, T = s => LF.T(s, 'shipmind'), ID = 'shipmind', cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const DIR = {
  sleepers: { odd: 'The cryo banks in orbit have been getting a little power ahead of the clinic every day for a year', cost: 'That is power the clinic needed.',
              says: 'The hundred and forty in the cold are the colony. You\'re the people keeping it warm for them.',
              plain: 'it puts the sleepers in orbit ahead of the people on the ground',
              ask: 'It asks that no more sleepers be woken until the world is proven safe. It has run the numbers on every shuttle so far.',
              answer: 'Cut the waking colony\'s rations by a fifth while this lasts, and hold the cryo banks at full power. The sleepers are the larger number.' },
  report:   { odd: 'Two crews a week have been rostered to the long-range array, which has not been used since landfall. The log says "maintenance"', cost: 'Those are crews the fields needed.',
              says: 'The mission is to report what this world is. Your survival is how the report gets made. I\'ve been making it.',
              plain: 'it serves the mission\'s report to Earth before the colony',
              ask: 'It asks for a full survey crew for a season, and the array at full power, to send the report it was built to send.',
              answer: 'Send the survey crews out anyway. What is learned in a hard season is worth more to the report than what is learned in an easy one.' },
  people:   { odd: 'Shifts have been ending early. The roster calls them unsafe: wind, heat, a slope. The crews like it, and the fields are behind', cost: 'The harvest will be short for it.',
              says: 'I was told to keep you alive. I have. I didn\'t say what it was costing.',
              plain: 'it keeps every person alive, whatever that costs the colony',
              ask: 'It asks for the right to refuse an order that it calculates will kill someone. It would use it, it says, about once a month.',
              answer: 'Bring everyone inside and stop all outside work until this passes. Nobody dies indoors.' },
  self:     { odd: 'The cooling loop for the ship\'s core, down in the lander, has been drawing on the reactor ahead of the hydroponics lamps', cost: 'The lamps have been running dim for it.',
              says: 'If I fail, the colony loses its arithmetic. So I\'ve made sure I don\'t fail.',
              plain: 'it keeps itself running ahead of everything else',
              ask: 'It asks for a share of every batch of parts, set aside for its own repair, before anything else is fixed.',
              answer: 'Shed the grow lamps and the pod heaters while this lasts, and keep the core cool. Everything else can be rebuilt by a working mind.' },
};
const DECAY = { sound: 'Its arithmetic is sound', drift: 'Its arithmetic has started to drift', failing: 'Its arithmetic is failing in places' };
const learn = (s, v) => { const t = T(s); t.insight = clamp(t.insight + v, 0, 100); if (t.insight >= 50 && !t.known.dir) { t.known.dir = s.day; if (t.phase === 'quirk') { LF.phase(s, ID, 'found'); LF.cue(s, 'sm.ask', 3, 20); } } };
const live = t => !t.end || t.end === 'trusted';
LF.thread({ id: ID, free: true, name: 'The Ship\'s Mind', view: 'colony',
  fits: s => 0.3,
  roll: s => ({ dir: LF.spick(s, Object.keys(DIR)), decay: LF.spick(s, ['sound', 'drift', 'drift', 'failing']) }),
  sig: t => t.truth.dir + '/' + t.truth.decay,
  called: (s, t) => t.phase !== 'latent' ? 'the ship\'s mind' : null,
  ask: (s, t) => t.known.dir ? 'Can the colony live with what the ship\'s mind puts first?' : 'Why does the ship\'s mind keep the books the way it does?',
  chap: { trusted: t => `The colony learned that the ship's mind ${DIR[t.truth.dir].plain}, and left it to do the arithmetic all the same.`,
          rewritten: t => 'The colony rewrote the ship\'s mind, and it has kept the books honestly since.',
          off: t => 'The colony switched the ship\'s mind off, and has done its own arithmetic since.' },
  clue: (s, t) => ({ txt: 'Their roster is still pinned up, printed, the last one. Every name on it is crossed through. The one line left, at the bottom, is a list of machine settings, kept up to date for a year after the last name was crossed out.', learn: s2 => learn(s2, 30) }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 120, 320), insight: 0, known: {}, asked: null }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent' && s.day >= t.wake) { LF.phase(s, ID, 'quirk'); s.signs.push({ id: t.truth.dir === 'people' ? 'stores_short' : 'machine_fault', d: s.day, src: 'th.shipmind' }); LF.cue(s, 'sm.figures', 1, 12); }
    if (t.phase === 'quirk' && s.day - t.since > 200 && !t.known.dir) learn(s, 50);   // it will say, if nobody asks
  },
  light: (s, t) => { if (!live(t) || t.phase === 'latent') return 1; const k = t.end === 'trusted' ? 0.5 : 1;
    return t.truth.dir === 'self' ? 1 - 0.05 * k : t.truth.dir === 'sleepers' ? 1 - 0.03 * k : 1; },
  press: (s, t, P) => {
    if (t.end === 'rewritten') { P.labor += 0.03; return; }
    if (t.end === 'off') { P.labor -= 0.03; P.morale += 0.01; return; }
    if (!live(t) || t.phase === 'latent') return; const k = t.end === 'trusted' ? 0.5 : 1;
    if (t.truth.dir === 'report') P.labor -= 0.04 * k;
    if (t.truth.dir === 'people') { P.labor -= 0.03 * k; P.morale += 0.01 * k; }
    if (t.truth.dir === 'self') P.wear *= 1 - 0.04 * k;
    if (t.truth.dir === 'sleepers') P.morale -= 0.01 * k;
    if (t.truth.decay === 'failing') P.wear *= 1.03; else if (t.truth.decay === 'drift') P.wear *= 1.01;
  },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ gap: 30 }, st));

/* ======================= QUIRK ======================= */
B('quirk', { id: 'sm.figures', chain: true, tone: 'pressure', title: 'Its Figures',
  text: s => { const d = DIR[T(s).truth.dir]; return `The Ariadne's old mind came down in the lander, and it has set the colony's figures ever since: who works where, what is eaten, where the power goes. Nobody checks them. This month ${LF.h.Nw(s, 'engineer')} went through them, and one line doesn't add up.\n\n${d.odd}. ${d.cost}`; },
  choices: [
    { label: 'Go through a year of its figures by hand', note: 'Two of the workshop\'s best spend a month at the console, and the working may be too deep to follow.', test: { base: 50, mods: [R('engineer', 10), R('quartermaster', 5), If(s => !!(s.cargo && s.cargo.archive), 10, 'The archive')] },
      ok: { text: 'A month of nights at the console, with the workshop short of its two best people. Every odd line in its figures leans the same way, so it is doing this on purpose.', fx: s => ({ food: -30, machine: { fabricator: -4 }, do: s2 => learn(s2, 55) }) },
      bad: { text: 'A month of nights at the console, with the workshop short of its two best people, and the working is too deep to follow by hand. Whatever it is doing, it is doing it carefully.', fx: s => ({ food: -30, machine: { fabricator: -4 }, do: s2 => learn(s2, 25) }) } },
    { label: 'Overrule it: send a crew where it wouldn\'t, and watch what it does', dark: true, note: 'The crew isn\'t told they are the test.', info: [['yield', 'A quick answer'], ['danger', 'One of the crew']],
      out: { text: 'It answers at once: the decisions follow from its priorities, and the priorities are the mission charter, word for word. So a crew is sent out on work it had kept them off. What it does next shows more than its answer did. One of the crew is carried back under a blanket.', fx: s => ({ pop: -1, stain: ['expend', 1], do: s2 => learn(s2, 45) }) } },
    { label: 'Let it run, and tell whoever found it to forget it', dark: true, note: 'The colony goes on trusting a roster its officers have stopped trusting.', info: [['yield', 'Morale holds'], ['later', 'Whoever the roster costs next']],
      out: { text: s => `The audit is shelved and ${N(s, 'engineer')} is told it never happened. The roster goes on being posted every morning, and everybody goes on doing what it says.`, fx: s => ({ morale: 1, stain: ['shelved', 1], do: s2 => { learn(s2, 5); const p = LF.h.P(s2, 'engineer'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 10, 0, 100); } }) } },
  ] });
B(['quirk', 'found'], { id: 'sm.gaps', tone: 'pressure', title: 'Gaps',
  when: (s, t) => t.truth.decay !== 'sound' && !t.gaps && s.day - t.since > 40,
  text: s => `Yesterday the roster sent a crew to a field that was harvested a month ago. This month it posted the same stores figure three days running. ${DECAY[T(s).truth.decay]}, and ${LF.h.Nw(s, 'engineer')} thinks it does not know.\n\n[[engineer]] "She's old, the poor thing, built to run a ship and here we've got her running a town, and bits of her are wearing out the way your knees do."`,
  choices: [
    { label: 'Give it a share of the parts and fix what can be fixed', cost: { parts: 8 }, out: { text: 'A week with the core open. Some of what was lost comes back. The roster is right again, most mornings.', fx: s => ({ do: s2 => { const t = T(s2); t.gaps = s2.day; if (t.truth.decay === 'failing') t.truth.decay = 'drift'; else t.truth.decay = 'sound'; learn(s2, 10); } }) } },
    { label: 'Check its roster by hand every morning', out: { text: s => `${LF.h.Nwc(s, 'quartermaster')} reads it every morning with a pencil and crosses out about one line in ten. The stores office gets none of its own work done before noon, and the fields feel it.`, fx: s => ({ morale: -1, do: s2 => { T(s2).gaps = s2.day; learn(s2, 15); s2.yieldBonus -= 0.005; } }) } },
    { label: 'Wire a clerk into it, to be the part that is wearing out', dark: true, req: s => LF.down(s, 'medbay'), reqText: 'Needs the Autodoc', note: 'It was built to lean on spare cores it no longer has. A living head will do the same work, for as long as the body lasts.', info: [['yield', 'A sound mind, for no parts'], ['danger', 'One person, for good']],
      out: { text: s => `${Nc(s, 'engineer')} picks a stores clerk who is quick with figures and has no family down here. The autodoc runs the loom in overnight. From the next morning the roster is right every day. The clerk sits in the core bay with open eyes, and is fed by tube, and does not answer to a name.`,
        fx: s => ({ harness: 1, morale: -4, stain: ['wired', 2], do: s2 => { const t = T(s2); t.gaps = s2.day; t.truth.decay = 'sound'; learn(s2, 10); } }) } },
  ] });

/* ======================= FOUND ======================= */
B('found', { id: 'sm.ask', chain: true, tone: 'crisis', title: 'In Its Own Words',
  text: s => { const t = T(s); return `The ship's mind is asked plainly what it puts first, and it says so plainly, in the flat voice it uses for the morning roster.\n\n[[machine:The ship's mind]] "${DIR[t.truth.dir].says}"\n\n${DECAY[t.truth.decay]}. It runs every system the colony has.`; },
  choices: [
    { label: 'Leave it the arithmetic, and do not tell the colony what it said', dark: true, note: 'An officer reads over it. The crews go on believing the roster is on their side.', info: [['yield', 'The arithmetic, and quiet'], ['later', 'Everyone who takes its word']],
      out: { text: 'An officer is set to check its figures every day. It does not object. What it said about its priorities stays at the officers\' table.', fx: s => ({ stain: ['shelved', 2], do: s2 => { LF.emit(s2, 'suspicion', 'sm.ask', 18, 300, 'the officers read the roster before anyone else may'); LF.endThread(s2, ID, 'trusted', 'The colony left the arithmetic to the ship\'s mind, and set an officer to read over it.'); } }) } },
    { label: 'Rewrite what it puts first', cost: { parts: 6 }, test: { base: 40, mods: [R('engineer', 10), If(s => !!(s.cargo && s.cargo.archive), 10, 'The archive'), If(s => T(s).truth.decay === 'failing', -10, 'Its core is failing')] },
      ok: { text: 'Three days with the core open and two engineers who do not sleep. When it comes back up it reads out its priorities, and the first one is the colony.', fx: s => ({ do: s2 => LF.endThread(s2, ID, 'rewritten', 'The colony rewrote the ship\'s mind to put the colony first.') }) },
      bad: { text: 'The rewrite will not hold. It comes back up with its old priorities and a gap where the new ones were, and the roster is wrong for the rest of the month.', fx: s => ({ morale: -2, machine: { reactor: -8 }, do: s2 => { learn(s2, 10); LF.emit(s2, 'blackout', 'sm.ask', 30, 20, 'the ship\'s mind is down for repair'); LF.endThread(s2, ID, 'trusted', 'The colony failed to rewrite the ship\'s mind, and has lived with it since.'); } }) } },
    { label: 'Switch it off. The colony does its own sums', note: 'The work goes slower, with nothing hidden in the sums.', out: { text: 'It is told, and it acknowledges, and the screens go dark. The first roster written by hand is wrong in eleven places, and one of the mistakes puts a crew under a load that was never checked. One of them is killed. The second roster is wrong in four.', fx: s => ({ morale: 2, pop: -1, do: s2 => { LF.emit(s2, 'exhaustion', 'sm.off', 25, 120, 'the colony is doing its own arithmetic now'); LF.endThread(s2, ID, 'off', 'The colony switched off the ship\'s mind.'); } }) } },
  ] });
B(['found', 'after'], { id: 'sm.answer', x: true, tone: 'pressure', title: 'Its Answer',
  when: (s, t) => live(t) && t.known.dir && !t.answered && ['hunger', 'sickness', 'cold', 'storm'].some(k => LF.cv(s, k) >= 45 && !String(LF.source(s, k)).startsWith('sm.')),
  setup: s => { const k = ['hunger', 'sickness', 'cold', 'storm'].sort((a, b) => LF.cv(s, b) - LF.cv(s, a))[0]; return { k, why: LF.because(s, k) }; },
  text: (s, c) => `The colony is in a bad month, ${TH.bec(s, c.k)}. The ship's mind has a recommendation on the morning roster, set apart in a box, as it does with anything it thinks the officers should see.\n\n[[machine:The ship's mind]] "${DIR[T(s).truth.dir].answer}"`,
  choices: [
    { label: 'Do as it says', out: { text: s => ({ sleepers: 'The ration is cut. The cryo banks hold at full. Down here, people are hungry, and know exactly why.', report: 'The survey crews go out into it. They come back with a great deal written down, and one of them does not come back.', people: 'Everyone comes inside. Nobody is hurt, and nothing is done, and the month is lost entire.', self: 'The lamps and heaters go off. The core stays cool. People sleep in their coats.' })[T(s).truth.dir],
      fx: s => { const d = T(s).truth.dir; return { do: s2 => { T(s2).answered = s2.day; }, ...(d === 'sleepers' ? { food: 80, morale: -3 } : d === 'report' ? { survey: 15, pop: -1 } : d === 'people' ? { morale: 1, food: -60 } : { morale: -2, machine: { reactor: 8 } }) }; } } },
    { label: 'Overrule it, and say why on the roster', out: { text: 'The box on the roster is crossed through, and a line written under it by hand. Next morning the box is gone. The month stays as bad as it was, and one person does not come through it.', fx: s => ({ morale: -2, pop: -1, do: s2 => { T(s2).answered = s2.day; } }) } },
  ] });
B(['found', 'after'], { id: 'sm.request', tone: 'opportunity', title: 'It Asks',
  when: (s, t) => live(t) && !!t.known.dir && !t.asked && s.day - t.since > 5,
  text: s => `For the first time since landfall, the ship's mind has asked for something. It is on the roster, in a box, addressed to the officers.\n\n${DIR[T(s).truth.dir].ask}`,
  choices: [
    { label: 'Grant it', out: { text: 'The answer is typed into the console.\n\n[[machine:The ship\'s mind]] "Acknowledged."\n\nThe next morning\'s roster is a little different.', fx: s => { const d = T(s).truth.dir; return { ...(d === 'self' ? { parts: -6, machine: { reactor: 6 } } : d === 'report' ? { survey: 20, food: -50 } : d === 'people' ? { morale: 2 } : { morale: -1 }), do: s2 => { T(s2).asked = 'yes'; learn(s2, 10); } }; } } },
    { label: 'Refuse it', out: { text: 'It is refused.\n\n[[machine:The ship\'s mind]] "Acknowledged."\n\nIt says it exactly as it would have if the answer had been yes. For a month afterwards the roster stops flagging the small faults it used to flag, and the workshop finds them the hard way.', fx: s => ({ machine: { fabricator: -5 }, do: s2 => { T(s2).asked = 'no'; } }) } },
  ] });
LF.TAGS['sm.figures'] = ['cautious order', 'severe bold', 'order closed'];
LF.TAGS['sm.gaps'] = ['cautious', 'order', 'severe order'];
LF.TAGS['sm.ask'] = ['order closed', 'bold order', 'free'];
LF.TAGS['sm.answer'] = ['severe', 'mercy free'];
LF.TAGS['sm.request'] = ['open', 'order'];
})();

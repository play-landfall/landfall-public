/* Landfall — threads: the Hard Ground, the Deep Mind, and a second Turn, the Thaw (STORY-PLAN.md §1).
   The Hard Ground is the planet with no malice: one of the colony's cords is failing for a dull physical reason,
   and the colony takes it for something else first. The Deep Mind is an intelligence too large to talk to; it is
   physical, it runs on something the world is made of, and its attention costs. The Thaw changes the world's rules
   once, as the Dark does: the ice goes, and whatever it was holding comes with the water. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, If, byPid } = h;
const TH = LF.th, cap = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ======================= THE HARD GROUND ======================= */
const HG = s => LF.T(s, 'ground'), GID = 'ground';
const CORD = {
  food:  { sign: 'crop_fail', what: 'The outer fields are giving a little less every cutting, in a band that moves inward a few metres a month', cause: 'It is salt: the irrigation is drawing it up from a layer two metres down, and every watering leaves a little more at the roots', fix: 'Deep drains under every field', lead: 'botanist' },
  water: { sign: 'water_taint', what: 'The water filters are clogging in days where they used to last a season, with a fine grey silt nobody can find the source of', cause: 'The aquifer is dropping, and what is left at the bottom of it is half mineral', fix: 'A new intake, upstream, in clean rock', lead: 'engineer' },
  power: { sign: 'machine_fault', what: 'Cable joints are failing all over the colony, one or two a week, always at night', cause: 'The ground moves a few millimetres between noon and midnight, every day, and no rigid joint lasts long under that', fix: 'Every run re-laid with slack in it', lead: 'engineer' },
  metal: { sign: 'damage', what: 'Plate that was sound at landfall is flaking. Bolts shear. A ladder rung came away in somebody\'s hand', cause: 'There is something in the dust that is harmless to people and eats the alloy the ship was built from, slowly, from the surface in', fix: 'Seal and paint everything that matters', lead: 'geologist' },
};
const MIS = {
  sabotage: { say: 'People are saying it is being done on purpose, by somebody', cond: 'suspicion', why: 'people think someone among them is breaking things' },
  sickness: { say: 'People are saying it is the same thing that makes people ill, getting into everything', cond: 'fear', why: 'people think the failures and the sick list are one thing' },
  creature: { say: 'People are saying something comes in at night and does it', cond: 'fear', why: 'people think something comes inside the wire at night' },
};
LF.thread({ id: GID, name: 'The Hard Ground', view: 'colony', minor: true,
  fits: s => 0.55, roll: s => ({ cord: LF.spick(s, Object.keys(CORD)), mis: LF.spick(s, Object.keys(MIS)), cyclic: LF.srand(s) < 0.4 }), sig: t => t.truth.cord + '/' + t.truth.mis,
  called: (s, t) => t.known ? 'the ground itself' : null,
  ask: (s, t) => t.known ? 'Can the colony build for ground that will not hold still?' : `What is ${t.truth.cord === 'food' ? 'killing the outer fields' : t.truth.cord === 'water' ? 'fouling the water' : t.truth.cord === 'power' ? 'breaking the cables' : 'eating the plate'}?`,
  chap: { adapted: t => 'The ground was the cause, with no malice in it, and the colony rebuilt to suit it.', beaten: t => 'The ground was the cause, and the colony never did get ahead of it.', moved: t => 'The ground was the cause. The colony gave it best, and moved what could be moved.' },
  clue: (s, t) => ({ txt: `Their last year of entries is about repairs, the same four over and over, in handwriting that gets more careless. Nobody in the log ever asks why the same things keep breaking.`, learn: s2 => { HG(s2).insight = clamp(HG(s2).insight + 50, 0, 100); } }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 200, 420), insight: 0, known: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.wake) { LF.phase(s, GID, 'wrong'); s.signs.push({ id: CORD[t.truth.cord].sign, d: s.day, src: 'th.ground' }); LF.cue(s, 'hg.wrong', 5, 25); } return; }
    if (t.phase === 'wrong' && t.insight >= 50) { t.known = s.day; LF.phase(s, GID, 'known'); LF.cue(s, 'hg.known', 2, 12); }
    if (t.phase === 'wrong' && s.day % 5 === 0) LF.emit(s, MIS[t.truth.mis].cond, 'th.ground', 30, 8, MIS[t.truth.mis].why);
    if (s.day % 30 === 0) { const k = t.truth.cord; if (k === 'water') LF.hurt(s, 'reclaimer', -1.5); if (k === 'power') LF.hurt(s, 'reactor', -1.5); if (k === 'metal') s.res.mat = Math.max(0, s.res.mat - 3); }
  },
  light: (s, t) => !t.end && t.phase !== 'latent' && t.truth.cord === 'food' ? 0.95 : 1,
});
const BG = (ph, st) => LF.beat(GID, ph, Object.assign({ gap: 35 }, st));
BG('wrong', { id: 'hg.wrong', chain: true, x: true, tone: 'pressure', title: 'Something Is Doing This',
  setup: s => ({ why: MIS[HG(s).truth.mis].why }),
  text: (s, c) => { const t = HG(s), C = CORD[t.truth.cord]; return `${C.what}. ${Nc(s, C.lead)} has patched it, replaced it and started again, and it comes back.\n\n${MIS[t.truth.mis].say}. There is no evidence for that, and there is no evidence for anything else either.`; },
  choices: [
    { label: s => HG(s).truth.mis === 'sabotage' ? 'Post a watch on the works, and find who it is' : HG(s).truth.mis === 'sickness' ? 'Quarantine what is failing, as if it were catching' : 'Traps and lamps, and somebody awake all night', cost: { parts: 2 }, dark: true, note: 'Whoever was on shift for the failures is held while it is looked into.', info: [['yield', 'People see something done'], ['danger', 'The three who are held']],
      out: { text: 'A month of it, with the three who were on shift for most of the failures kept in the lock-up throughout. Nobody is caught and nothing is trapped, and the failures go on at exactly the rate they did before. The three are let out without a word said. Some people take all of it as proof of how clever the culprit is.', fx: s => ({ morale: 1, stain: ['held', 1], do: s2 => { const t = HG(s2); t.insight += 15; LF.emit(s2, MIS[t.truth.mis].cond, 'hg.wrong', 30, 150, MIS[t.truth.mis].why); } }) } },
    { label: 'Test the ground, the water and the air, and nothing else', test: { base: 55, mods: [R('geologist', 15), R('botanist', 6), R('engineer', 6), If(s => !!(s.cargo && s.cargo.archive), 8, 'The archive')] },
      ok: { text: 'Two months of cores, samples and strain gauges, and a result so dull that the first person to see it checks it twice.', fx: s => ({ do: s2 => { HG(s2).insight = 100; } }) },
      bad: { text: 'Two months of cores and samples. Every one of them is inside the limits in the manual, and the manual was written for Earth.', fx: s => ({ do: s2 => { HG(s2).insight += 30; } }) } },
    { label: 'Keep patching until it settles', out: { text: 'The patching goes on the rota as a standing job. It takes up two people\'s whole week, every week, and the talk about who is doing it gets a season longer to find a name.', fx: s => ({ food: -50, morale: -2, do: s2 => { HG(s2).insight += 8; } }) } },
  ] });
BG('wrong', { id: 'hg.blame', view: 'people', x: true, tone: 'pressure', title: 'Somebody Must Have',
  when: (s, t) => !t.blamed && s.day - t.since > 50 && LF.cv(s, MIS[t.truth.mis].cond) >= 35,
  setup: s => Object.assign(TH.ctx(LF.cast(s, { low: true, mark: 'convict' })), { why: MIS[HG(s).truth.mis].why }),
  text: (s, c) => `The talk has settled on ${c.name}, who was on shift for three of the last five failures and has complained about the way the colony is run.\n\nNobody has accused ${c.first} to your face, but nobody will sit at ${c.first}'s table in the mess.`,
  choices: [
    { label: (s, c) => `Stand up in the mess hall and say ${c.first} is clear`, out: { text: (s, c) => `You say it once, plainly, with ${c.first} beside you. People sit at ${c.first}'s table again. Then the next thing breaks, on a night when ${c.first} was nowhere near, and the ones who wanted a name start asking why you were so quick to rule one out.`, fx: (s, c) => ({ morale: -2, do: s2 => { HG(s2).blamed = c.pid; const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal + 18, 0, 100); LF.ease(s2, 'suspicion', 'hg.blame', 15, 200); } }) } },
    { label: (s, c) => `Have ${c.first} own up to carelessness, and dig for a month`, dark: true, note: 'A small confession to something that was not done costs one person a month and gives the colony its name.', info: [['yield', 'The talk stops'], ['danger', 'Someone who did nothing']],
      out: { text: (s, c) => `${c.first} is told what to say and says it in the mess hall: careless, and sorry. People are satisfied with that. ${c.first} digs latrine trenches for a month for something the ground did, and is moved to other work afterwards.`, fx: (s, c) => ({ morale: 4, stain: ['confession', 1], do: s2 => { HG(s2).blamed = c.pid; const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 12, 0, 100); p.marks.slighted = { d: s2.day, txt: 'was moved off shift on a rumour' }; } } }) } },
    { label: 'Say nothing and let the talk die down', out: { text: (s, c) => `The talk does not die down, and ${c.first} eats alone for a season.`, fx: (s, c) => ({ do: s2 => { HG(s2).blamed = c.pid; const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 18, 0, 100); p.marks.grudge = { d: s2.day, txt: 'was left to carry the blame for what the ground did' }; } } }) } },
    { label: (s, c) => `Give them ${c.first}. A hearing, and the wire`, dark: true, note: 'There is no evidence, and the colony has stopped sleeping.', info: [['yield', 'The talk stops'], ['danger', 'Someone who did nothing']],
      out: { text: (s, c) => `The hearing takes an afternoon. Being on shift for three failures out of five is called a pattern, and nobody asks who was on shift for the other two. ${c.name} is put out past the wire at dusk with a pack. The mess hall is easy that night for the first time in a season, and the failures go on at exactly the rate they did before.`,
        fx: (s, c) => ({ morale: 7, stain: ['goat', 2], chips: [[`${c.name} exiled`, false]], do: s2 => { const t = HG(s2); t.blamed = c.pid; t.goat = c.name; const p = byPid(s2, c.pid);
          if (p && p.alive && !p.away) { p.alive = false; p.left = s2.day; p.died = s2.day; p.cause = 'exiled for what the ground did'; s2.pop = Math.max(0, s2.pop - 1); if (p.role) s2.vacancies.push({ role: p.role, day: s2.day + 35 }); }
          LF.ease(s2, 'suspicion', 'hg.blame', 25, 200); LF.ease(s2, 'fear', 'hg.blame', 20, 200); }, chron: `${c.name} was exiled for sabotage. It was the ground.` }) } },
  ] });
BG('known', { id: 'hg.known', chain: true, tone: 'crisis', title: 'Only the Ground',
  text: s => { const t = HG(s), C = CORD[t.truth.cord]; return `Nobody was doing it. ${C.cause}.${t.goat ? ` ${t.goat} was put out past the wire for it a season ago, and everyone in the room is working that out at the same time.` : ''}\n\n${Nc(s, C.lead)} lays it out at the evening meeting without any triumph. The colony was built on assumptions brought from another world, and putting that right means rebuilding part of it.`; },
  choices: [
    { label: s => CORD[HG(s).truth.cord].fix, cost: { mat: 60, parts: 4 }, note: 'The plate was promised to the far row, who are still on bare ground.', out: { text: 'It takes a season and most of the plate yard. At the end of it the thing that kept breaking has stopped breaking. The far row spends another cold season on bare ground, and one of the old does not see the end of it.', fx: s => ({ morale: 2, pop: -1, yield: HG(s).truth.cord === 'food' ? 0.04 : 0, do: s2 => { const t = HG(s2), k = t.truth.cord; if (k === 'water') LF.hurt(s2, 'reclaimer', 12); if (k === 'power') LF.hurt(s2, 'reactor', 12); LF.ease(s2, MIS[t.truth.mis].cond, 'hg.known', 20, 300); LF.endThread(s2, GID, 'adapted', 'The colony rebuilt itself to suit the ground it stands on.'); } }) } },
    { label: 'Move the works to better ground. The far row stays where it is', dark: true, cost: { mat: 25 }, note: 'There is plate to move the machines and the crews. The pods of the old and the unassigned stay on the ground that is failing.', info: [['yield', 'The repairs stop'], ['danger', 'The far row']],
      out: { text: 'The works and the crews are shifted two hundred metres onto sound ground, and the repairs stop. The far row is left where it was built. A floor goes in it that winter, with two people asleep on it.', fx: s => ({ pop: -2, stain: ['left_behind', 1], do: s2 => { LF.ease(s2, MIS[HG(s2).truth.mis].cond, 'hg.known', 20, 300); LF.endThread(s2, GID, 'moved', 'The colony moved off the worst of the ground.'); } }) } },
    { label: 'Leave things as they are and budget for the repairs', out: { text: 'The repairs get a permanent line in the stores ledger, and two people who will do nothing else for as long as there is a colony. People are calmer now that they know what is causing it.', fx: s => ({ mat: -20, food: -40, do: s2 => { const t = HG(s2); t.end = null; LF.ease(s2, MIS[t.truth.mis].cond, 'hg.known', 25, 300); LF.endThread(s2, GID, 'beaten', 'The colony learned what the ground was doing, and paid for it every year after.'); if (t.truth.cord === 'food') s2.yieldBonus -= 0.03; } }) } },
    { label: 'Do it in a month. Double shifts, every hand, and the work does not stop', dark: true, cost: { mat: 40 }, note: 'A season of this failing costs more than a month of accidents.', info: [['yield', 'Fixed before the season turns'], ['danger', 'The crews']],
      out: { text: s => `It is done in twenty-six days, by people working sixteen hours with four hours\' sleep. A trench wall goes in the second week and a winch cable in the third. Three are buried beside the works. ${Nc(s, CORD[HG(s).truth.cord].lead)} signs it off as sound, and it is.`,
        fx: s => ({ pop: -3, morale: -3, yield: HG(s).truth.cord === 'food' ? 0.04 : 0, stain: ['driven', 1], do: s2 => { const t = HG(s2), k = t.truth.cord; if (k === 'water') LF.hurt(s2, 'reclaimer', 12); if (k === 'power') LF.hurt(s2, 'reactor', 12); LF.ease(s2, MIS[t.truth.mis].cond, 'hg.known', 20, 300); LF.endThread(s2, GID, 'adapted', 'The colony rebuilt itself to suit the ground it stands on, in a month, and buried three of the people who did it.'); } }) } },
  ] });
LF.TAGS['hg.wrong'] = ['order severe', 'cautious open', 'cautious'];
LF.TAGS['hg.blame'] = ['mercy free', 'order cautious', 'closed', 'severe order'];
LF.TAGS['hg.known'] = ['bold', 'cautious', 'cautious order', 'severe bold'];

/* ======================= THE DEEP MIND ======================= */
const DM = s => LF.T(s, 'mind'), MID = 'mind';
const SUB = {
  ocean:  { fits: ['drowned'], where: 'the tide', shape: 'The tide tables are wrong by a pattern. The same pattern is in the way the kelp lies on the beach each morning', name: 'the Tide' },
  lichen: { fits: ['barren', 'garden'], where: 'the lichen', shape: 'The lichen on the north rocks grows in rings, and the rings are in the same proportions on every rock for forty kilometres', name: 'the Crust' },
  ice:    { fits: ['ice'], where: 'the ice', shape: 'The ice cracks at night, and when the cracks are plotted they make the same figure every time, a little larger', name: 'the Sheet' },
  roots:  { fits: ['jungle', 'ruin'], where: 'the root mat', shape: 'Every tree for a day\'s walk is joined underground. Cut one, and sap rises in all the others within the minute', name: 'the Root' },
};
const COST = {
  sleep:   { is: 'Nobody it is looking at sleeps properly, and the clinic has given up logging the complaints', cond: 'exhaustion', why: 'nobody sleeps properly while it is paying attention' },
  memory:  { is: 'People near it lose small things: a name, a morning, the way to a hut they built themselves', cond: 'changed', why: 'people are forgetting things since it began to pay attention' },
  weather: { is: 'The weather over the colony has become particular. It rains on the fields and nowhere else, and then it hails on them', cond: 'storm', why: 'the weather over the colony has become particular' },
};
const dn = s => DM(s).name, Dn = s => cap(DM(s).name);
LF.thread({ id: MID, name: 'The Deep Mind', view: 'world',
  fits: s => (s.world.mysteries || []).includes('understory') ? 0 : 0.3,
  roll: s => { const a = s.world.type, subs = Object.keys(SUB).filter(k => SUB[k].fits.includes(a)); return { sub: LF.spick(s, subs.length ? subs : Object.keys(SUB)), cost: LF.spick(s, Object.keys(COST)), mirror: LF.srand(s) < 0.4 }; }, sig: t => t.truth.sub + '/' + t.truth.cost + (t.truth.mirror ? '/mirror' : ''),
  called: (s, t) => t.phase !== 'latent' ? t.name : null,
  ask: (s, t) => t.phase === 'pattern' ? `Is there a mind in ${SUB[t.truth.sub].where}?` : `What does ${t.name} want with the colony, if it wants anything?`,
  chap: { spoken: t => `The colony spoke to ${t.name}, once, and was answered.`, unnoticed: t => `The colony went quiet until ${t.name} lost interest in it.`, regarded: t => `${cap(t.name)} never stopped paying attention to the colony, and the colony learned to live inside that.`, withdrawn: t => `The colony put walls between itself and ${t.name}, and they have held.` },
  clue: (s, t) => ({ txt: `Their last drawings are all of one thing, drawn again and again by different hands: ${SUB[t.truth.sub].where}, with an eye in it. On the final sheet there is only the eye.`, learn: s2 => { DM(s2).insight = clamp(DM(s2).insight + 35, 0, 100); } }),
  start: (s, t) => { Object.assign(t, { name: SUB[t.truth.sub].name, att: LF.sri(s, 5, 20), insight: 0, wake: LF.sri(s, 180, 380), shield: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.wake) { LF.phase(s, MID, 'pattern'); s.signs.push({ id: 'watching', d: s.day, src: 'th.mind' }, { id: 'dreams', d: s.day, src: 'th.mind' }); LF.cue(s, 'dm.pattern', 3, 20); } return; }
    // It attends to what is loud: radio, numbers, lights. Shielding and quiet turn it away.
    t.att = clamp(t.att + 0.085 + LF.cv(s, 'heard') / 1500 + Math.max(0, s.pop - 90) / 4000 - t.shield * 0.02 - (t.quiet ? 0.06 : 0), 0, 100);
    if (t.phase === 'pattern' && t.att >= 40) { LF.phase(s, MID, 'regard', `${cap(t.name)} began to pay attention to the colony.`); LF.cue(s, 'dm.cost', 2, 12); }
    if (t.phase === 'regard' && t.att >= 60) { LF.phase(s, MID, 'answer'); LF.cue(s, 'dm.reply', 1, 10); }
    if (t.phase === 'regard' && t.quiet && t.att < 22) LF.endThread(s, MID, 'unnoticed', `${cap(t.name)} lost interest in the colony.`);
    // The mirror: every living thing that can hurt the colony grows, unseen, as hard as the colony has been with the world.
    if (t.truth.mirror && s.day % 30 === 0) { const f0 = force(s), d = t.peace ? (f0 > t.peace ? 8 : -2) : Math.min(3, f0 * 0.5);
      if (t.peace && f0 > t.peace) { t.peace = 0; LF.log(s, `The guns came out again. ${cap(t.name)} has noticed.`, 'bad'); }
      for (const f of bio(s)) f.threat = clamp(f.threat + d, 0, 100); }
    if (s.day % 5 === 0 && t.phase !== 'pattern') { const C = COST[t.truth.cost]; LF.emit(s, C.cond, 'th.mind', 20 + t.att * 0.35 - t.shield * 10, 8, C.why); LF.emit(s, 'watched', 'th.mind', 25 + t.att * 0.3, 8, `${t.name} is paying attention to the colony`); }
  },
  press: (s, t, P) => { if (!t.end && t.phase !== 'latent' && t.phase !== 'pattern' && t.truth.cost === 'sleep') P.labor -= 0.03 * (1 - t.shield * 0.4); },
});
const BM = (ph, st) => LF.beat(MID, ph, Object.assign({ gap: 30 }, st));
/* How hard the colony has been with the world: every time it went at a living thing by force. */
const force = s => s.factors.reduce((a, f) => a + ((f.uses && f.uses.force) || 0), 0);
const bio = s => s.factors.filter(f => ['fauna', 'flora', 'plague'].includes(f.kind) && !f.res && !f.dormant);
const mir = s => DM(s).truth.mirror;
BM('pattern', { id: 'dm.pattern', chain: true, tone: 'pressure', title: 'The Same Shape',
  text: s => `${SUB[DM(s).truth.sub].shape}.${mir(s) && force(s) ? ' It runs thickest where the colony has fought: the cleared ground, the burnt edges, the places where things were killed.' : ''} ${Nc(s, 'xenobio')} noticed it, checked it, and has not been sleeping well since.\n\n"Something in it's doing arithmetic, slowly, across a whole continent, and I've ruled out growth and I've ruled out weather, so does it know we're here, I don't know, I need to find out."`,
  choices: [
    { label: 'Study it. Instruments, and nothing that could be taken as a signal', test: { base: 55, mods: [R('xenobio', 12), R('geologist', 6), If(s => !!(s.cargo && s.cargo.drones), 8, 'The survey drones')] },
      ok: { text: 'A season of passive measurement, by people the fields went without. The arithmetic is real, and in the last month it has changed slightly around the colony.', fx: s => ({ food: -50, do: s2 => { const t = DM(s2); t.insight += 35; t.att += 4; } }) },
      bad: { text: 'A season of measurement, and a drone lost where it should not have been flown. The two who walked out to recover it were found sitting beside it, awake, unable to say their own names. One of them has not got that back. The pattern changed the day after.', fx: s => ({ food: -50, pop: -1, do: s2 => { const t = DM(s2); t.insight += 15; t.att += 12; } }) } },
    { label: 'Answer it. Send the same shape back', note: 'Then it will know the colony is here.', out: { text: 'Lamps are laid out on the flat in the same proportions and lit at dusk. By morning the shape around the colony has changed, and the change contains the lamps.', fx: s => ({ do: s2 => { const t = DM(s2); t.att += 28; t.insight += 20; t.hailed = s2.day; } }) } },
    { label: 'Lights down, radio off, and nobody goes near it', out: { text: 'The colony goes dark and quiet. It is cold, and nobody can tell whether it makes any difference. An operation in the clinic is done by candle that month, and the patient does not come through it.', fx: s => ({ morale: -1, pop: -1, do: s2 => { const t = DM(s2); t.quiet = s2.day; t.att -= 5; } }) } },
  ] });
BM('regard', { id: 'dm.cost', chain: true, tone: 'crisis', title: 'What Attention Costs',
  text: s => { const t = DM(s); return `Nobody doubts any more that ${dn(s)} knows the colony is here. ${COST[t.truth.cost].is}.${t.truth.mirror ? ' And everything out there that bites, spreads or sickens has been getting harder against the colony, a little at a time, for as long as the colony has been fighting it.' : ''}\n\n${Nc(s, 'physician')}: "I doubt it means anything by it. That's just what it's like when something that size looks at you."`; },
  choices: [
    { label: 'Shield the colony: earth banks, copper mesh, whatever stops it', cost: { mat: 50, parts: 3 }, note: 'Every hand that can lift a basket is on the banks through the cutting season.', out: { text: 'Nobody can say which part of it works. Inside the banks people sleep, remember, and get ordinary rain. A third of the cutting was left standing while the banks went up.', fx: s => ({ food: -70, do: s2 => { DM(s2).shield = 1.5; } }) } },
    { label: 'Go quiet, and wait for it to look away', out: { text: 'The lights go down, the radio goes off, and the field edges are left ragged so they look less like something made. It may take a year.', fx: s => ({ morale: -2, do: s2 => { const t = DM(s2); t.quiet = s2.day; LF.ease(s2, 'heard', 'dm.cost', 20, 400); } }) } },
    { label: 'Bear it, and shut away the ones who cannot', dark: true, note: 'Most people get used to it. The ones who do not are put where the rest need not hear them.', info: [['yield', 'The work goes on'], ['danger', 'The ones it breaks']],
      out: { text: 'People get used to it, the way they get used to living beside a road. The seven who do not are moved to the far shed with a bolt on the outside, and fed through the hatch. The colony works a full month again.', fx: s => ({ morale: -1, stain: ['chained', 2], do: s2 => { DM(s2).bear = s2.day; } }) } },
    { label: 'It looks at what is loud. Give it something else to look at', dark: true, note: 'Forty people, a kilometre out on the flat, with every lamp and the big radio.', info: [['yield', 'The colony is left alone'], ['danger', 'The forty']],
      out: { text: s => `A second camp goes up on the flat: forty people, picked for what the colony can do without, with every spare lamp and the long-range set left transmitting. Within the month ${dn(s)} has turned toward them. Inside the wire people sleep. Out on the flat nobody has, properly, since the lamps were lit, and the first three are carried back under blankets before the month is out.`,
        fx: s => ({ pop: -3, morale: -4, stain: ['lamp_camp', 2], do: s2 => { const t = DM(s2); t.shield = Math.max(t.shield, 1.5); t.att = clamp(t.att - 15, 0, 100); LF.emit(s2, 'resentment', 'dm.cost', 35, 300, 'forty people were put out on the flat to be looked at instead'); } }) } },
  ] });
BM(['regard', 'answer'], { id: 'dm.mirror', x: true, view: 'people', tone: 'pressure', title: 'It Shows Us',
  when: (s, t) => !t.mirror && Math.max(LF.cv(s, 'grief'), LF.cv(s, 'fear'), LF.cv(s, 'zeal')) >= 40,
  setup: s => { const k = ['grief', 'fear', 'zeal'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0][0]; return { k, why: LF.because(s, k) }; },
  text: (s, c) => { const t = DM(s), W = SUB[t.truth.sub].where; return (c.k === 'grief' ? `There are shapes in ${W} this morning that were not there last night. They are the names from the wall, every one, in the colony's own lettering, a hundred metres across.`
    : c.k === 'fear' ? `There is a shape in ${W} this morning: the colony, drawn from above, every pod and path. Outside the wire it has drawn a ring, and nothing inside the ring.`
    : `There is a shape in ${W} this morning. It is the sign the colony's believers make with their hands, a hundred metres across, and correct in every line.`) + `\n\n${cap(c.why)}. ${Dn(s)} has noticed that too, and has handed it back. Half the colony is already walking out to look.`; },
  choices: [
    { label: 'Let them look. Go with them', out: { text: (s, c) => `Everyone stands at the edge of it for a long time, and nobody can say what was meant. On the walk back people talk quietly, and a few of them are laughing. Two sat down at the edge of it and would not come back, and are still out there.`, fx: (s, c) => ({ morale: 2, leave: 2, do: s2 => { const t = DM(s2); t.mirror = s2.day; t.att += 8; LF.ease(s2, c.k === 'zeal' ? 'fear' : c.k, 'dm.mirror', 20, 200); LF.emit(s2, 'zeal', 'dm.mirror', 30, 300, `people think ${t.name} knows them`); } }) } },
    { label: 'Nobody goes out there', out: { text: 'The gate is shut. People look from the wall instead. By noon the shape has faded, and there is an argument that will run for years about what it said.', fx: (s, c) => ({ do: s2 => { const t = DM(s2); t.mirror = s2.day; LF.emit(s2, 'resentment', 'dm.mirror', 20, 150, 'the gate was shut on something meant for everyone'); } }) } },
    { label: 'Record every line of it, then rake it out in front of them', dark: true, info: [['yield', 'A year of knowledge in a day'], ['danger', 'The people it was drawn for']], out: { text: (s, c) => `It is photographed, measured and then broken up with harrows. ${Nc(s, 'xenobio')} gets more out of the measurements than out of a year of watching. ${c.k === 'grief' ? 'People stand on the wall and watch the names of their dead go under the harrow.' : 'People stand on the wall and watch it done, and do not speak to the harrow crew at supper.'}`, fx: (s, c) => ({ morale: -3, stain: ['harrowed', 1], do: s2 => { const t = DM(s2); t.mirror = s2.day; t.insight += 30; t.att -= 6; } }) } },
  ] });
BM(['regard', 'answer'], { id: 'dm.one', view: 'people', tone: 'pressure', title: 'The One It Favours',
  when: (s, t) => !t.one && s.day - t.since > 40,
  setup: s => TH.ctx(LF.cast(s, { want: 'know', mark: 'touched' })),
  text: (s, c) => `${c.name} knows things a day early: where the next crack will run, which field the rain will pick. ${c.first} is not pleased about it and did not want it mentioned.\n\n${Nc(s, 'physician')} can find nothing wrong. "If ${dn(s)} is talking to anyone, it's ${c.first}. Being used or being asked, I can't tell you which. And nobody's opening ${c.first} up to find out."`,
  choices: [
    { label: (s, c) => `Ask ${c.first} to listen, on the colony's behalf`, out: { text: (s, c) => `${c.first} agrees, and keeps a log, and the log is right more often than the forecasts. ${c.first} has started walking out to the edge of it in the evenings.`, fx: (s, c) => ({ yield: 0.03, mark: [c.pid, 'touched', `hears ${dn(s)} a day early`], do: s2 => { const t = DM(s2); t.one = c.pid; t.insight += 25; t.att += 6; } }) } },
    { label: (s, c) => `Shut ${c.first} in the reactor hall, behind the metal`, dark: true, note: (s, c) => `Whatever is using ${c.first} cannot be let walk about the colony. ${c.first} has not agreed to it.`, info: [['yield', 'It stops'], ['danger', 'The one who hears it']],
      out: { text: (s, c) => `${c.first} is put to work in the reactor hall, behind the most metal the colony has, and the door is locked at the end of each shift. The foreknowledge stops within the month. ${c.first} says, once, that it is like going deaf, and asks when the door will be left open.`, fx: (s, c) => ({ stain: ['chained', 1], do: s2 => { const t = DM(s2); t.one = c.pid; t.att = clamp(t.att - 6, 0, 100); const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 16, 0, 100); p.sore = { d: s2.day, t: 'The One It Favours' }; } } }) } },
    { label: 'Leave it between the two of them', out: { text: (s, c) => `Nobody asks ${c.first} for anything. ${c.first} keeps knowing things a day early and keeps quiet about it, including the morning the scaffold on the east pods comes down with two people on it.`, fx: (s, c) => ({ pop: -1, morale: -1, do: s2 => { DM(s2).one = c.pid; } }) } },
    { label: (s, c) => `A hut at the edge of it for ${c.first}, and a guard on the door`, dark: true, note: 'Whatever it tells one person is worth more than that person\'s wishes.', info: [['yield', 'A forecast nobody else has'], ['danger', 'The one who hears it']],
      out: { text: (s, c) => `The hut goes up where the pattern is thickest. ${c.name} is moved into it and is not asked. A clerk sits outside with a slate and writes down whatever is said through the door: rain, cracks, where not to dig. It is right every time. After the first month what comes through the door is no longer always in words.`,
        fx: (s, c) => ({ yield: 0.06, stain: ['oracle', 1], mark: [c.pid, 'touched', `is kept in a hut at the edge of ${dn(s)}, under guard, to listen`], do: s2 => { const t = DM(s2); t.one = c.pid; t.insight += 40; t.att += 10; const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 25, 0, 100); p.sore = { d: s2.day, t: 'The One It Favours' }; } } }) } },
  ] });
BM('answer', { id: 'dm.reply', chain: true, tone: 'crisis', title: 'The Reply',
  text: s => { const t = DM(s); return `Every pattern in ${SUB[t.truth.sub].where} for a hundred kilometres now centres on the colony. It has been building to something for months, and last night it stopped, complete, and has not changed since.\n\n${Nc(s, 'xenobio')}: "It's a question, I'm nearly sure it's a question, asking what, no idea, but look how it's stopped, it's waiting, it's got all the time in the world, and I'd very much like to be the one who answers it."`; },
  choices: [
    { label: 'Answer it', test: { base: 35, mods: [R('xenobio', 12), R('teacher', 6), If(s => DM(s).insight >= 50, 20, 'It is partly understood'), If(s => !!DM(s).one, 12, 'Somebody already hears it'), If(s => !!DM(s).hailed, 6, 'The colony spoke first')] },
      ok: { text: s => `The answer is laid out over three nights. On the fourth morning the pattern has changed everywhere at once. Nobody can read the whole of it. The part around the colony is plain enough: the rain comes when the fields want it, and the cost has stopped.${DM(s).truth.mirror ? ' The valley stops pushing back. Things still bite, but no harder than they have to.' : ''}`, fx: s => ({ morale: 5, yield: 0.06, do: s2 => { const t = DM(s2); LF.emit(s2, 'revelation', 'th.mind', 60, 300, `${t.name} answered`); LF.emit(s2, 'dependency', 'th.mind', 30, 900, `the colony lives on ${t.name}'s good will`); LF.endThread(s2, MID, 'spoken', `The colony answered ${t.name}, and was understood.`); } }) },
      bad: { text: 'The answer is laid out, and whatever it said, it did not answer the question. The attention grows stronger by the day.', fx: s => ({ morale: -3, do: s2 => { const t = DM(s2); t.att = 100; LF.emit(s2, 'fear', 'th.mind', 40, 300, `${t.name} was answered wrongly`); LF.endThread(s2, MID, 'regarded', `The colony answered ${t.name} wrongly, and has had its full attention since.`); } }) } },
    { label: 'Wall it out, with the outer households on the far side', dark: true, cost: { mat: 40 }, note: 'There is plate and mesh for a short wall. The outer plots and the six households on them do not fit inside it.', info: [['yield', 'An ordinary place again'], ['danger', 'Six households']],
      out: { text: 'Banks, mesh and a dead strip a hundred metres wide, salted. Inside it the colony is an ordinary place again. The six households on the outer plots are outside it, under whatever the pattern does next, and are told they may farm on as before.', fx: s => ({ leave: 12, stain: ['left_behind', 2], do: s2 => { const t = DM(s2); t.shield = 3; LF.endThread(s2, MID, 'withdrawn', `The colony walled itself off from ${t.name}.`); } }) } },
    { label: 'Leave the question standing', out: { text: 'Nothing is laid out. The pattern holds for a season, and then begins, very slowly, to include the colony as one more feature of the ground. The cost of being looked at goes on, and takes somebody most seasons.', fx: s => ({ pop: -1, do: s2 => { const t = DM(s2); LF.endThread(s2, MID, 'regarded', `The colony never answered ${t.name}, and learned to live under its attention.`); } }) } },
    { label: s => { const p = DM(s).one && byPid(s, DM(s).one); return `Send it ${p ? p.first : 'the one it favours'}, to keep`; }, dark: true, show: s => { const p = DM(s).one && byPid(s, DM(s).one); return !!p && p.alive && !p.away; },
      note: 'It has been asking one person all along. One person may be the whole of the answer.', info: [['yield', 'It is answered, for certain'], ['danger', 'The one it favours']],
      out: { text: s => { const p = DM(s).one && byPid(s, DM(s).one); if (!p) return ''; return `${p.name} is walked out to the centre of it at dusk by four of the watch, who come back without ${p.first} and will not say whether there was any struggle. In the morning the pattern has changed everywhere at once. The rain comes when the fields want it. Nobody is sent to look for a body, and nobody suggests it.`; },
        fx: s => ({ kill: [{ who: DM(s).one, cause: `given to ${dn(s)} as an answer` }], yield: 0.05, morale: -3, stain: ['given', 2], do: s2 => { const t = DM(s2); LF.emit(s2, 'dependency', 'th.mind', 30, 900, `the colony lives on ${t.name}'s good will`); LF.endThread(s2, MID, 'spoken', `The colony answered ${t.name} with one of its own people.`); } }) } },
  ] });
BM(['regard', 'answer', 'after'], { id: 'dm.hard', tone: 'pressure', title: 'As Hard as We Are',
  when: (s, t) => t.truth.mirror && !t.hard && force(s) >= 2 && (t.insight >= 35 || t.phase !== 'regard') && (!t.end || t.end === 'regarded' || t.end === 'spoken'),
  text: s => `${Nc(s, 'xenobio')} has laid every fight the colony has had beside the survey of what lives outside the wire. Each time the colony went at something by force, everything else out there grew a little harder: more teeth, faster spread, a worse fever.

"${Dn(s)} is giving us back what we give it, hit it and it hits back exactly that hard, no harder, I've checked the numbers twice, and I can't find any anger in it anywhere, which is either a comfort or the worst thing I've ever read."`,
  choices: [
    { label: 'Hang the guns up. Nothing is fought that can be lived with', note: 'Security will hate it, and one more fight will undo it.', out: { text: s => `The arms locker is sealed with a paper strip, and ${N(s, 'security')} signs it under protest. Within a season the traps on the perimeter catch less, and what they catch is smaller. In the first month of it a child is taken at the wire, on a stretch the old watch would have covered.`, fx: s => ({ pop: -1, do: s2 => { const t = DM(s2); t.hard = s2.day; t.peace = force(s2); const p = h.P(s2, 'security'); if (p) p.loyal = clamp(p.loyal - 12, 0, 100); for (const f of bio(s2)) f.threat = clamp(f.threat - 10, 0, 100); LF.ease(s2, 'fear', 'dm.hard', 15, 300); } }) } },
    { label: 'Study it before believing it', test: { base: 55, mods: [R('xenobio', 12), R('physician', 6)] },
      ok: { text: 'A season of counts, done twice by different people the fields went without. It holds. Every fight is in the numbers a month later, everywhere at once.', fx: s => ({ food: -40, do: s2 => { const t = DM(s2); t.hard = s2.day; t.insight = clamp(t.insight + 25, 0, 100); } }) },
      bad: { text: 'A season of counts by people the fields went without, and the two sets do not agree well enough to prove anything.', fx: s => ({ food: -40, do: s2 => { DM(s2).hard = s2.day; } }) } },
    { label: 'Then burn a dead kilometre round the wire, and keep it dead', dark: true, note: 'Nothing that bites or spreads will have anywhere to start from. Nothing else will live there either.', info: [['yield', 'Nothing gets near the wire'], ['danger', 'What it hands back for this']],
      out: { text: s => `${Nc(s, 'security')} gets the fuel and the crews, and is glad of them. Everything living for a kilometre round the wire is burned, and burned again each season, nests and burrows included. Nothing comes near the wire that year.`, fx: s => ({ stain: ['scorched', 2], do: s2 => { DM(s2).hard = s2.day; for (const f of bio(s2)) f.threat = clamp(f.threat - 14, 0, 100); LF.emit(s2, 'fear', 'dm.hard', 25, 300, 'the colony has decided to fight the world harder than it fights back'); } }) } },
  ] });
LF.TAGS['dm.hard'] = ['mercy open', 'cautious', 'severe bold'];
LF.TAGS['dm.pattern'] = ['cautious', 'bold open', 'closed cautious'];
LF.TAGS['dm.cost'] = ['closed cautious', 'cautious', 'bold', 'severe order'];
LF.TAGS['dm.mirror'] = ['open free', 'closed order', 'cautious'];
LF.TAGS['dm.one'] = ['bold open', 'cautious mercy', 'free', 'severe order'];
LF.TAGS['dm.reply'] = ['bold open', 'closed', 'cautious', 'severe order'];

/* ======================= THE THAW (a Turn) ======================= */
const TW = s => LF.T(s, 'thaw'), WID = 'thaw';
const HELD = {
  water: { is: 'It was only water, but a great deal of it', sig: 'water' },
  fever: { is: 'Something was frozen in it that had not been alive for a long time, and now is. The clinic has six cases of a fever with no name', sig: 'fever' },
  beasts:{ is: 'Things were sleeping under it. They are thin and slow and there are a great many of them, and all of them are hungry', sig: 'beasts' },
};
LF.thread({ id: WID, name: 'The Thaw', view: 'colony', turn: true,
  fits: s => s.world.climate === 'winter' ? 0.5 : (s.world.truth && s.world.truth.temp < -5) ? 0.35 : 0,
  roll: s => ({ held: LF.spick(s, Object.keys(HELD)) }), sig: t => t.truth.held,
  called: (s, t) => t.phase !== 'latent' ? 'the thaw' : null,
  ask: (s, t) => t.phase === 'melt' ? 'What was the ice holding?' : 'Why is the river running in the cold season?',
  chap: { green: t => 'The ice went, the valley flooded, and the colony came out the far side on green ground.', drowned: t => 'The ice went, and took the lower colony with it.' },
  clue: (s, t) => ({ txt: 'Their huts are on stilts. The oldest are on the ground; each rebuilding is a little higher. The last ones stand three metres up, and there is a tide line on the posts above the floors.', learn: s2 => { TW(s2).warned = s2.day; } }),
  start: (s, t) => { Object.assign(t, { at: LF.sri(s, 320, 520), len: LF.sri(s, 45, 80), prep: null }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at - 150) { LF.phase(s, WID, 'drip'); s.signs.push({ id: 'water_taint', d: s.day, src: 'th.thaw' }, { id: 'tracks', d: s.day, src: 'th.thaw' }); LF.cue(s, 'tw.drip', 3, 20); } return; }
    if (t.phase === 'drip' && s.day >= t.at) { LF.phase(s, WID, 'melt', `The ice above the valley let go.`); LF.cue(s, 'tw.flood', 0); LF.cue(s, 'tw.held', 20, 40); }
    if (t.phase === 'melt') {
      if (s.day % 5 === 0) { LF.emit(s, 'storm', 'th.thaw', 55, 8, 'the valley is in flood'); LF.emit(s, 'contamination', 'th.thaw', t.prep === 'dykes' ? 25 : 45, 8, 'meltwater is in everything');
        if (t.truth.held === 'fever') LF.emit(s, 'sickness', 'th.thaw', 45, 8, 'something that was frozen in the ice is in the water'); if (t.truth.held === 'beasts') LF.emit(s, 'siege', 'th.thaw', 40, 8, 'what was sleeping under the ice is awake and hungry'); }
      if (s.day >= t.at + t.len) { s.yieldBonus += 0.08; LF.ease(s, 'cold', 'th.thaw', 25, 2000); LF.emit(s, 'hope', 'th.thaw', 45, 250, 'the valley is green to the ridge'); LF.endThread(s, WID, 'green', 'The flood went down and left the valley green.'); LF.cue(s, 'tw.green', 3, 15); }
    }
  },
  light: (s, t) => t.phase === 'melt' ? (t.prep === 'early' ? 0.97 : 0.88) : 1,
  press: (s, t, P) => { if (t.phase === 'melt') P.wear *= t.prep === 'dykes' ? 1.03 : 1.1; },
});
const BT = (ph, st) => LF.beat(WID, ph, st);
BT('drip', { id: 'tw.drip', chain: true, tone: 'pressure', title: 'Running Water',
  text: s => `There is water running under the ice in the cold season. ${Nc(s, 'geologist')} has walked the glacier's foot and come back with wet boots and a set of stakes that have moved four metres in a month.\n\n"Four metres in a month! That's not a warm year, that's the whole sheet letting go, and when it goes it comes straight down this valley, and I know I shouldn't be this thrilled, but we've got months, and I can show you exactly where it goes."`,
  choices: [
    { label: 'Dykes and a spillway, above the colony', cost: { mat: 60 }, out: { text: 'Every hand that can lift a basket is on the bank for two months, and the plots go unweeded for both. It is the largest thing the colony has built, and nobody will know whether it is large enough until the day.', fx: s => ({ food: -70, do: s2 => { TW(s2).prep = 'dykes'; } }) } },
    { label: 'Stores, machines and the officers\' pods to high ground', dark: true, cost: { mat: 25 }, note: 'There is room on the shelf for what the colony cannot replace. Everyone else goes on sleeping in the valley.', info: [['yield', 'What matters is dry'], ['danger', 'Whoever sleeps below']],
      out: { text: 'Everything that matters goes up the slope on sledges, and the officers and the machine crews with it. The rest of the colony goes on sleeping in the valley, and can see the lamps on the hill from their doors.', fx: s => ({ morale: -3, stain: ['high_ground', 1], do: s2 => { LF.emit(s2, 'resentment', 'tw.drip', 30, 300, 'the officers sleep on the hill and everyone else in the path of the water'); TW(s2).prep = 'high'; } }) } },
    { label: 'Plant early and cut early, before it comes', out: { text: 'The seed goes in a month earlier than anyone sensible would plant. Some of it takes, and it should be in the stores before the water reaches the fields. Nothing else is moved and nothing is banked.', fx: s => ({ food: 200, do: s2 => { TW(s2).prep = 'early'; } }) } },
    { label: 'The dyke, in half the time, with half the plate. Nobody rests until it is closed', dark: true, cost: { mat: 30 }, note: 'Earth moved by hand stands in for plate. The hands are the cost.', info: [['yield', 'The dyke, cheaply'], ['danger', 'The crews']],
      out: { text: 'The bank goes up by basket and by back, in shifts that overlap so that the line never stops. A woman who sits down on the crest is covered to the knees before anyone notices she has not got up. Three are dead of the work by the time the last gap is closed. It is the largest thing the colony has built.',
        fx: s => ({ pop: -3, morale: -4, stain: ['driven', 1], do: s2 => { TW(s2).prep = 'dykes'; } }) } },
  ] });
BT('melt', { id: 'tw.flood', chain: true, tone: 'crisis', title: 'The River Is Back',
  text: s => { const t = TW(s); return `It came in the night, as a sound first. By dawn the lower fields are a lake and the stream is a brown river with whole trees in it. ${t.prep === 'dykes' ? 'The dyke is holding. Water is coming over the spillway in a sheet.' : t.prep === 'high' ? 'The stores and the machines are dry on the hill, but the pods are not.' : 'Nothing was moved and nothing was banked. The water is at the doors of the machine shop.'}`; },
  choices: [
    { label: 'Save the machines', test: { base: 45, mods: [R('engineer', 12), If(s => TW(s).prep === 'dykes', 25, 'The dyke'), If(s => TW(s).prep === 'high', 30, 'They are already on the hill')] },
      ok: { text: 'They are kept dry, by sandbags and by people standing in water to their chests. The fields are gone for the season.', fx: s => ({ morale: 1 }) },
      bad: { text: 'The water finds the reactor hall. It is pumped out in a day, and the damage is counted for a month.', fx: s => ({ machine: { reactor: -14, fabricator: -10 } }) } },
    { label: 'Save the stores. The lock-up carries, roped in a line, in the water', dark: true, note: 'Somebody has to stand in the current and pass sacks. It need not be anyone the colony will miss.', info: [['yield', 'The stores, for certain'], ['danger', 'The prisoners']],
      out: { text: 'Every sack goes up the slope hand to hand, along a line of prisoners roped together and standing in brown water to the chest. When a tree comes down the river it takes the two at the end of the rope. The line closes up and the sacks keep moving. The machines take their chances.', fx: s => ({ pop: -2, machine: { fabricator: -6 }, stain: ['expend', 2] }) } },
    { label: 'Save the people. Everyone to the ridge, now', out: { text: 'Nobody is lost. From the ridge the colony watches the valley fill, and counts what it will have to do without.', fx: s => ({ morale: 2, food: -100, machine: { reactor: -6, reclaimer: -6 } }) } },
    { label: 'Breach the bank on the low side. The water takes the lower pods, not the machines', dark: true, note: 'Sixty people sleep in the lower pods. There is time to wake most of them.', info: [['yield', 'The machines and the stores, for certain'], ['danger', 'Whoever is still in the lower pods']],
      out: { text: s => `${Nc(s, 'engineer')} sets the charge. The water turns, takes the lower pods off their footings in about four minutes, and goes round the machine hall and the stores as if they were not there. Most of the lower pods were empty by then. Five people were not out.`,
        fx: s => ({ pop: -5, morale: -6, stain: ['breach', 2], do: s2 => { LF.emit(s2, 'resentment', 'tw.flood', 40, 300, 'the flood was turned onto the lower pods to save the machines'); } }) } },
  ] });
BT('melt', { id: 'tw.held', chain: true, x: true, tone: 'crisis', title: 'What the Ice Kept',
  setup: s => ({ why: 'the ice above the valley has let go' }),
  text: (s, c) => { const t = TW(s); return `The water has brought things down with it that were in the ice a long time. ${HELD[t.truth.held].is}.\n\n${Nc(s, t.truth.held === 'beasts' ? 'security' : 'physician')}: "That's been in the ice since before there were people here. Sitting there. Waiting for a warm year like this one."`; },
  choices: [
    { label: s => TW(s).truth.held === 'water' ? 'Cut channels and put it to work' : TW(s).truth.held === 'fever' ? 'Boil everything, and isolate the cases' : 'Hold the wall until they have fed elsewhere', cost: { mat: 20 }, test: { base: 55, mods: [R('physician', 8), R('security', 8), R('engineer', 8)] },
      ok: { text: s => TW(s).truth.held === 'water' ? 'The flood is led round the colony and across the dry terraces. Ground that never grew anything is black and wet.' : TW(s).truth.held === 'fever' ? 'It burns through the six and stops there. Whatever it is, it is as weak from the long cold as everything else.' : 'They mill at the wire for nine days and then follow the water downstream. The watch has not fired a shot.', fx: s => ({ yield: TW(s).truth.held === 'water' ? 0.04 : 0, morale: 1 }) },
      bad: { text: s => TW(s).truth.held === 'water' ? 'The channels silt up as fast as they are cut. The water goes where it likes.' : TW(s).truth.held === 'fever' ? 'It spreads well past the first six cases.' : 'The wire gives way in two places before the herd moves on.', fx: s => ({ pop: TW(s).truth.held === 'water' ? 0 : -3, morale: -1 }) } },
    { label: 'Pull back to the ridge. The ones who cannot climb stay below', dark: true, note: 'Carrying the sick and the old up costs a day the colony does not have.', info: [['yield', 'The rest are out of its way tonight'], ['danger', 'The ones left in the valley']],
      out: { text: 'Everyone who can climb is on the ridge by dark. The clinic\'s beds and the two oldest pods are left where they stand, with water and a lamp each. The colony waits for it to pass. Three of those left below are alive when it has.', fx: s => ({ pop: -3, morale: -3, stain: ['left_behind', 2], do: s2 => { TW(s2).len += 6; } }) } },
    { label: s => TW(s).truth.held === 'fever' ? 'Wall the six cases in, tonight' : 'Bait them down the valley with our dead', dark: true, show: s => TW(s).truth.held !== 'water', info: [['yield', 'It ends here'], ['danger', 'Morale']],
      out: { text: s => TW(s).truth.held === 'fever' ? `The isolation hut has its door and its one window bricked up before morning, with the six inside and a week of water. ${Nc(s, 'physician')} is held back by two of the watch. There is no seventh case.`
          : 'The cold room is emptied onto sledges and dragged two kilometres down the valley, and tipped out in a line. The herd goes to it and keeps going. The watch does not fire a shot. People who buried someone this year are told afterwards, and some of them are not told at all.',
        fx: s => TW(s).truth.held === 'fever' ? { pop: -6, morale: -6, stain: ['carriers', 2] } : { morale: -5, stain: ['bait', 1] } } },
  ] });
BT('after', { id: 'tw.green', chain: true, tone: 'opportunity', title: 'Green to the Ridge',
  text: s => `The flood has gone down and left a metre of black silt over everything. Things are coming up through it that nobody planted. ${Nc(s, 'botanist')} has been on hands and knees in it for a month.\n\n"Different valley now. Warmer, wetter, richer soil. And nothing we learned farming the old one holds here."`,
  choices: [
    { label: 'Replant everything, to suit the new ground', cost: { food: 80 }, note: 'A season of learning is a season with nothing coming in.', out: { text: 'A season is spent learning it, on short bowls. Two of the weakest do not see the first cutting off the silt, which is the largest the colony has ever taken.', fx: s => ({ yield: 0.06, pop: -2 }) } },
    { label: 'Farm what was farmed before, and be glad of the warmth', out: { text: 'The old fields are dug out of a metre of silt by hand, which takes most of the season, and resown as they were. They do well enough. Beside them the silt grows weeds as tall as a child.', fx: s => ({ morale: 1, food: -60 }) } },
    { label: 'Replant everything, and feed the learning season from the ladles of those who cannot dig', dark: true, note: 'The stores stay whole. Somebody still goes short, and it is decided who.', info: [['yield', 'The best harvests the colony has had'], ['danger', 'The ones who cannot dig']],
      out: { text: 'A season is spent learning the new ground, with the diggers on full bowls and everyone else on a quarter. Four of the old and the sick are dead before the first cutting off the silt, which is the largest the colony has ever taken.', fx: s => ({ yield: 0.06, pop: -4, flags: { ration_by_work: true }, stain: ['starved_list', 2] }) } },
  ] });
LF.TAGS['tw.drip'] = ['bold order', 'cautious', 'bold', 'severe order'];
LF.TAGS['tw.flood'] = ['order', 'cautious', 'mercy', 'severe order'];
LF.TAGS['tw.held'] = ['bold', 'cautious', 'severe order'];
LF.TAGS['tw.green'] = ['bold', 'cautious', 'severe order'];
})();

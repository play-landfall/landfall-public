/* Landfall — two more Turns (STORY-PLAN.md §1b, "More Turns"). A Turn changes the world's rules once.
   The Fall: something comes down from orbit on a cycle, and anyone who settled here before would have built against
   it. Rolled in secret: what falls (iron, ice, or the wreck of somebody's old satellites). It fits barren and ruin
   worlds. The Flowering: the whole living mass of the world, the colony's fields and people included, crosses a
   threshold and the planet answers. Rolled in secret: how it answers (everything flowers at once, something hatches
   to graze the surplus, or the native life sheds itself in a die-back). It fits garden, jungle and ocean worlds.
   Neither reads another thread; dice come from LF.srand. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, Nw, Nwc, R, If, byPid } = h;
const TH = LF.th, cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const months = d => { const m = Math.max(1, Math.round(d / 10)); return m === 1 ? 'a month' : `${TH.num(m)} months`; };

/* ======================= THE FALL ======================= */
const FA = s => LF.T(s, 'fall'), FID = 'fall';
const WHAT = {
  iron:  { what: 'iron', streak: 'white streaks, dozens an hour, all from the same point in the sky', is: 'The world passes through a stream of iron grit and stones every few years, the leavings of something that broke up a long time ago', gift: { mat: 70 }, giftTxt: 'The craters are full of nickel-iron, clean and ready to smelt' },
  ice:   { what: 'ice', streak: 'long green streaks that break up into sparks', is: 'A comet\'s tail crosses the world\'s orbit every few years, and the world goes through it. Most of it is ice, and some of the ice is the size of a hut', gift: { machine: { reclaimer: 14 } }, giftTxt: 'Every crater is a pond of clean melt, the best water the colony has tasted since the ship' },
  wreck: { what: 'wreckage', streak: 'slow orange streaks that flare and split, as if each one were made of many parts', is: 'There is a ring of old wreckage in orbit, somebody\'s satellites from long ago, and every few years the drag pulls a belt of it down', gift: { parts: 10 }, giftTxt: 'Some of what came down is machinery, old and strange and still partly whole' },
};
LF.thread({ id: FID, name: 'The Fall', view: 'colony', turn: true,
  fits: s => ({ barren: 0.5, ruin: 0.5 })[s.world.type] || 0,
  roll: s => ({ what: LF.spick(s, s.world.type === 'ruin' ? ['iron', 'wreck', 'wreck', 'ice'] : ['iron', 'iron', 'ice', 'wreck']) }), sig: t => t.truth.what,
  called: (s, t) => t.known || ['fall', 'after'].includes(t.phase) ? 'the Fall' : null,
  ask: (s, t) => t.phase === 'scar' ? 'What made the craters in rows across the plain?' : 'Will the colony be under cover when the sky comes down?',
  chap: { endured: t => `The sky came down, as it had before the colony and will again, and the colony was ${t.hurt >= 2 ? 'badly hurt' : t.hurt ? 'hurt, and lived' : 'under cover when it did'}.` },
  clue: (s, t) => ({ txt: 'Every roof they built is a hand thick and domed, even the henhouse, and the log for one month in the autumn is nothing but a list of who was inside and who was not.', learn: s2 => { const t = FA(s2); t.insight = clamp(t.insight + 40, 0, 100); } }),
  start: (s, t) => { Object.assign(t, { at: LF.sri(s, 380, 560), len: LF.sri(s, 20, 35), insight: 0, prep: {}, hurt: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at - 240) { LF.phase(s, FID, 'scar'); s.signs.push({ id: 'damage', d: s.day, src: 'th.fall' }, { id: 'lights', d: s.day, src: 'th.fall' }); LF.cue(s, 'fall.scar', 3, 20); } return; }
    if (t.phase === 'scar' && s.day >= t.at - 50) { LF.phase(s, FID, 'streaks'); LF.cue(s, 'fall.streaks', 0, 6); }
    if (t.phase === 'streaks' && s.day % 5 === 0) LF.emit(s, 'fear', 'th.fall', t.known ? 35 : 25, 8, `there are ${WHAT[t.truth.what].what === 'ice' ? 'green' : 'white'} streaks across the night sky, more every week`);
    if (t.phase === 'streaks' && s.day >= t.at) { LF.phase(s, FID, 'fall', `The sky came down on ${s.world.planet}.`); LF.cue(s, 'fall.night', 0); LF.cue(s, 'fall.roofs', 5, 10); s.tension = clamp(s.tension + 15, 0, 100); }
    if (t.phase === 'fall') {
      if (s.day % 5 === 0) { const dug = !!t.prep.dig || !!s.built.shelter; LF.emit(s, 'confinement', 'th.fall', dug ? 55 : 35, 8, 'everyone is under cover while the sky falls'); LF.emit(s, 'fear', 'th.fall', dug ? 30 : 55, 8, 'the sky is falling on the colony'); }
      if (s.day >= t.at + t.len) { LF.endThread(s, FID, 'endured', 'The last of it came down, and the sky was quiet again.'); LF.emit(s, 'hope', 'th.fall', 40, 200, 'the sky is quiet again'); LF.cue(s, 'fall.after', 3, 15); }
    }
  },
  light: (s, t) => t.phase === 'fall' ? (t.prep.cover ? 0.92 : 0.8) : 1,
  press: (s, t, P) => { if (t.phase === 'fall') { P.wear *= t.prep.harden ? 1.03 : 1.1; P.labor -= t.prep.dig ? 0.01 : 0.04; } if (t.end && t.built) P.morale += 0.01; },
});
const FB = (ph, st) => LF.beat(FID, ph, Object.assign({ gap: 20 }, st));
FB('scar', { id: 'fall.scar', chain: true, tone: 'pressure', title: 'Craters in Rows',
  text: s => `${s.cargo && s.cargo.drones ? 'The survey drone has photographed the plain to the west from high up' : 'A party has climbed the ridge and looked down on the plain to the west'} for the first time. It is covered in craters, thousands of them, ${s.world.type === 'ruin' ? 'and every old building out there that still stands has a roof a metre thick' : 'and the oldest rock overhangs have been walled in and lived under by something'}. Some of the craters are old. Some have sharp edges, and nothing has grown in them yet, so whatever made them has been here lately.\n\n${Nwc(s, 'geologist')} has measured where the rows run.\n\n[[geologist]] "They all point at the same patch of sky, all of them, so whatever made them came from one place, and more than once, which means it has a schedule, no wait, I don't know that, I want to know that."`,
  choices: [
    { label: 'Date the craters, and work out when it comes back', test: { base: 50, mods: [R('geologist', 10), R('pilot', 5), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones'), If(s => !!(s.cargo && s.cargo.archive), 5, 'The archive')] },
      ok: { text: s => `A season of digging and counting. The craters come in layers, each a few years apart, and the youngest layer is old enough that the next one is due. Worked forward from the layers, it comes back in about ${months(Math.max(30, FA(s).at - s.day))}. The fields went short of hands for the whole of it.`, fx: s => ({ food: -50, do: s2 => { const t = FA(s2); t.insight = 100; t.known = s2.day; } }) },
      bad: { text: 'A season of digging. The craters come in layers, and the layers do not agree with each other, or with anyone\'s theory. The fields went short of hands for nothing.', fx: s => ({ food: -50, do: s2 => { FA(s2).insight += 30; } }) } },
    { label: 'Strip the plate off the far pods and thicken the roofs that matter', dark: true, note: 'There is not plate for every roof. The stores, the machines and the officers get a second skin, and the far pods give up theirs.', info: [['yield', 'Cover, for no new plate'], ['later', 'Whoever sleeps in the far pods']],
      out: { text: 'The stores, the machine halls and the near pods get a second skin of rammed earth over plate. It comes off the roofs of the far pods, where the field crews sleep, and they are given tarpaulin.', fx: s => ({ morale: -2, stain: ['roofs', 1], do: s2 => { const t = FA(s2); t.prep.cover = s2.day; t.insight += 10; } }) } },
    { label: 'Put the photographs in a drawer, and tell the survey office it is nothing', dark: true, note: 'People who are not afraid of the sky get more done. The one who measured the rows is told to stop.', info: [['yield', 'Morale holds'], ['later', 'Everyone, if it comes back']],
      out: { text: s => `The photographs go in a drawer in the survey office, and ${N(s, 'geologist')} is told the matter is closed.`, fx: s => ({ morale: 1, stain: ['shelved', 1], do: s2 => { FA(s2).insight += 5; const p = LF.h.P(s2, 'geologist'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 10, 0, 100); } }) } },
  ] });
FB('streaks', { id: 'fall.streaks', chain: true, tone: 'crisis', title: 'Streaks',
  text: s => { const t = FA(s), W = WHAT[t.truth.what]; return `There are ${W.streak}. Last month there were three in an evening. Now people stand in the yard after dark and count them aloud.\n\n${t.known ? `It is the Fall, as the craters said it would be. ${W.is}. It will be on the colony in about ${months(Math.max(10, t.at - s.day))}.` : `[[pilot]] "They're closer every night and there are more of them every night, and I don't like the margin we've got left."`}`; },
  choices: [
    { label: 'Dig in. Everyone sleeps below ground until it passes', cost: s => ({ mat: Math.min(30, Math.floor(s.res.mat)) }), note: 'The machines stand in the open.', out: { text: 'Trenches, roofed with plate and earth, and a ramp down to each. It is cramped and damp and everyone has a place. The machines are left standing where they are.', fx: s => ({ do: s2 => { FA(s2).prep.dig = s2.day; } }) } },
    { label: 'Bank the machines. People sleep where they can', cost: { mat: 25, parts: 2 }, note: 'There is time to cover the machines or the people. This covers the machines.', out: { text: 'The reactor and every machine the lander has brought down disappear behind berms of rammed earth, with a crawlway to each. Nothing is dug for the people.', fx: s => ({ do: s2 => { FA(s2).prep.harden = s2.day; } }) } },
    { label: 'Trenches and banks both. Nobody sleeps until they are done', dark: true, cost: { mat: 40 }, note: 'There is time for one job done decently, or for both done by people worked until they drop.', info: [['yield', 'People and machines both covered'], ['danger', 'The ones who drop']],
      out: { text: s => `${Nwc(s, 'security')} runs the shifts with a whistle and a list. Sixteen hours on, by lamp, and nobody is excused for a fever or a bad back. The trenches are roofed and the banks are up with two days to spare. Three people did not get up from the last shift.`,
        fx: s => ({ pop: -3, morale: -3, stain: ['driven', 2], do: s2 => { const p = FA(s2).prep; p.dig = s2.day; p.harden = s2.day; } }) } },
  ] });
FB('fall', { id: 'fall.night', chain: true, tone: 'crisis', title: 'The Sky Comes Down',
  text: s => { const t = FA(s), p = t.prep; return `It starts after dark: a hiss, then a sound like hail on a roof the size of the valley. ${WHAT[t.truth.what].what === 'ice' ? 'The ice comes down burning and steams where it lands.' : WHAT[t.truth.what].what === 'wreckage' ? 'The wreckage comes down in burning pieces, some the size of a hand and some the size of a hut.' : 'The stones come down glowing.'} By morning there are craters inside the wire.\n\n${p.dig ? 'Everyone is underground, and everyone is accounted for.' : 'There is nowhere for everyone to go.'} ${p.harden ? 'The machines are behind their banks.' : 'The machines are standing in the open.'}`; },
  choices: [
    { label: 'Keep everyone under cover, whatever it costs above', out: { text: s => FA(s).prep.dig ? 'Nobody goes up for nine days. What is up there is badly knocked about, but nobody is lost.' : 'Everyone crowds into the strongest buildings. Two of them are hit, and not everyone in them gets out.', fx: s => { const t = FA(s), p = t.prep; return { pop: p.dig ? 0 : -2, machine: p.harden ? { reactor: -3, fabricator: -3 } : { reactor: -8, fabricator: -6, reclaimer: -6 }, do: s2 => { FA(s2).hurt = (p.dig ? 0 : 1) + (p.harden ? 0 : 1); } }; } } },
    { label: 'Order the crews out between showers, to save the machines', risky: true, note: 'The engineers go first, because they know which housings matter.', test: { base: 40, mods: [R('engineer', 10), If(s => !!FA(s).prep.harden, 15, 'The banks are up'), If(s => !!FA(s).known, 10, 'The colony knew it was coming')] },
      ok: { text: 'The crews run out between showers with sandbags and tarpaulins, and every machine comes through.', fx: s => ({ machine: { reactor: -3 }, do: s2 => { FA(s2).hurt = FA(s2).prep.dig ? 0 : 1; } }) },
      bad: { text: 'A shower comes down early, with the crews in the open, and the machines are hit anyway.', fx: s => ({ pop: -2, machine: { reactor: -8, fabricator: -6 }, do: s2 => { FA(s2).hurt = 2; } }) } },
    { label: 'The lock-up goes out to the machines, and the door is barred behind them', dark: true, note: 'Somebody has to hold the plate over the reactor housing while it comes down. Nobody will volunteer twice.', info: [['yield', 'The machines come through'], ['danger', 'Everyone sent out']],
      out: { text: 'Five prisoners are given sandbags, a sheet of plate each and a promise about their sentences, and the trench door is barred from inside. They hold the plate over the housings for two nights. On the third morning two of them are still there to be let back in. Every machine comes through.',
        fx: s => ({ pop: -3, morale: -1, stain: ['expend', 2], do: s2 => { FA(s2).hurt = FA(s2).prep.dig ? 0 : 1; } }) } },
  ] });
FB('fall', { id: 'fall.roofs', x: true, view: 'people', tone: 'pressure', title: 'Under the Same Roof',
  when: (s, t) => !t.roofs && !!['grief', 'resentment', 'schism', 'suspicion'].find(k => LF.cv(s, k) >= 35 && LF.source(s, k) !== 'th.fall' && LF.because(s, k)),
  setup: s => { const k = ['grief', 'resentment', 'schism', 'suspicion'].filter(k => LF.cv(s, k) >= 35 && LF.source(s, k) !== 'th.fall' && LF.because(s, k)).sort((a, b) => LF.cv(s, b) - LF.cv(s, a))[0]; return { k, why: LF.because(s, k) }; },
  text: (s, c) => `Half the colony is shut ${FA(s).prep.dig ? 'underground' : 'in the strongest buildings'} with the other half, and the sky is still coming down. People were already at odds, ${TH.bec(s, c.k)}. Now they are at odds a metre apart, in the dark, for days, and somebody has drawn a chalk line across the floor of ${FA(s).prep.dig ? 'the long trench' : 'the crowded hall'}.`,
  choices: [
    { label: 'Rub the line out, and sit on it yourself', out: { text: 'The line is rubbed out and an officer is sat on it until the shower passes. The quarrel goes on in whispers at both ends of the room.', fx: (s, c) => ({ morale: 1, do: s2 => { FA(s2).roofs = s2.day; LF.ease(s2, c.k, 'fall.roofs', 18, 150); } }) } },
    { label: 'Whoever drew it spends the night outside', dark: true, note: 'One night in the open, under that, and nobody will draw anything again.', info: [['yield', 'Quiet in the trench'], ['danger', 'Two people']],
      out: { text: 'Two people are named by their neighbours and put out into it, and the door is shut behind them. One of them knocks to come in at dawn. The line is rubbed out by somebody\'s sleeve, and there is no more trouble under that roof.',
        fx: (s, c) => ({ pop: -1, morale: -1, stain: ['put_out', 1], do: s2 => { FA(s2).roofs = s2.day; LF.ease(s2, c.k, 'fall.roofs', 28, 150); LF.emit(s2, 'fear', 'fall.roofs', 30, 150, 'two people were shut out in the Fall for drawing a line on the floor'); } }) } },
  ] });
FB('after', { id: 'fall.after', chain: true, tone: 'opportunity', title: 'What Came Down',
  text: s => { const t = FA(s); return `The sky is quiet. The valley is pocked with fresh craters, inside the wire and out. ${WHAT[t.truth.what].giftTxt}.\n\n[[geologist]] "${t.known ? 'It\'ll come back. Every few years, the craters say.' : 'The craters out on the plain are layered, see? It\'s happened before. It\'ll happen again.'} So either we dig in every time it comes, or we build for it once, and I'd really like to watch it land from somewhere with a very thick roof."`; },
  choices: [
    { label: 'Build for it: thick roofs on everything, and keep them', cost: { mat: 40 }, out: { text: 'What fell is gathered in, and every new roof is a hand thick and domed.', fx: s => Object.assign({ morale: 2 }, WHAT[FA(s).truth.what].gift, { do: s2 => { FA(s2).built = s2.day; LF.ease(s2, 'fear', 'fall.after', 20, 600); } }) } },
    { label: 'Take what fell, and get back to work', note: 'Nothing is built for the next one.', out: { text: 'Crews go out with sledges and barrows, crater to crater. Nothing is built for the next Fall, and anyone who asks for a thicker roof is told there is no plate to spare.', fx: s => Object.assign({}, WHAT[FA(s).truth.what].gift, { do: s2 => { LF.emit(s2, 'fear', 'fall.after', 18, 400, 'nothing was built against the next Fall'); } }) } },
  ] });
LF.TAGS['fall.scar'] = ['cautious open', 'severe order', 'order closed'];
LF.TAGS['fall.streaks'] = ['cautious mercy', 'cautious', 'severe order'];
LF.TAGS['fall.night'] = ['mercy cautious', 'bold', 'severe order'];
LF.TAGS['fall.roofs'] = ['mercy free', 'severe order'];
LF.TAGS['fall.after'] = ['cautious order', 'bold'];

/* ======================= THE FLOWERING ======================= */
const FL = s => LF.T(s, 'flower'), LID = 'flower';
const ANS = {
  bloom: { is: 'Everything flowers at once. Every native plant for a hundred kilometres has put out its seed in the same fortnight, and the air is thick with it', mid: 'The pollen is in everything: the air, the water, the lungs. The clinic is full of people who cannot stop coughing',
           cond: 'sickness', why: 'the air is thick with the Flowering\'s pollen' },
  graze: { is: 'Something has hatched to eat the surplus. Grey grazers, by the thousand, came up out of the ground in a week and are working through every green thing in the valley, the colony\'s fields included', mid: 'The grazers have stripped the native growth and are at the fence lines of the colony\'s fields, pushing',
           cond: 'siege', why: 'the grazers the Flowering hatched are at the fences' },
  shed:  { is: 'The native life is shedding itself. Leaves, fronds, whole stands of growth are dying back to the root together, as if on an order, and rotting where they fall', mid: 'The die-back is rotting in heaps, and the rot has got into the water and the stores',
           cond: 'contamination', why: 'the die-back is rotting into the water' },
};
/* The living mass of the world, the colony's own included: what the threshold counts. */
const ours = s => (s.pop / 120) + (s.yieldBonus || 0) * 3 + Object.keys(s.built).filter(k => ['greenhouse', 'fields', 'soillab'].includes(k)).length * 0.3;
LF.thread({ id: LID, name: 'The Flowering', view: 'world', turn: true,
  fits: s => ({ garden: 0.5, jungle: 0.55, drowned: 0.45 })[s.world.type] || 0,
  roll: s => ({ ans: LF.spick(s, Object.keys(ANS)) }), sig: t => t.truth.ans,
  called: (s, t) => t.known || ['flower', 'after'].includes(t.phase) ? 'the Flowering' : null,
  ask: (s, t) => t.phase === 'swell' ? 'Why is everything in the valley growing so fast?' : 'How will the colony come through the Flowering?',
  chap: { passed: t => `Everything living on the world, the colony included, grew past some mark, and the world answered with the Flowering. The colony ${t.hurt ? 'came through it poorer' : 'came through it'}.` },
  clue: (s, t) => ({ txt: 'Their fields are drawn small and kept small on purpose, with a note in the margin every year: no more than this. One year the fields are drawn twice the size. The next year there is no map.', learn: s2 => { FL(s2).insight = clamp(FL(s2).insight + 40, 0, 100); } }),
  start: (s, t) => { Object.assign(t, { mass: LF.sri(s, 0, 15), insight: 0, hurt: 0, wake: LF.sri(s, 200, 330) }); },
  tick: (s, t) => {
    if (t.end) return;
    if (s.day < t.wake) return;
    if (t.phase === 'latent' || t.phase === 'swell') t.mass = clamp(t.mass + 0.12 + 0.08 * ours(s) - (t.cut ? 0.08 : 0), 0, 100);
    if (t.phase === 'latent' && t.mass >= 25) { LF.phase(s, LID, 'swell'); s.signs.push({ id: 'crop_fail', d: s.day, src: 'th.flower' }, { id: 'warmth', d: s.day, src: 'th.flower' }); LF.cue(s, 'fl.swell', 2, 15); }
    if (t.phase === 'swell' && t.mass >= 100) { t.at = s.day; t.len = LF.sri(s, 60, 100); LF.phase(s, LID, 'flower', `The Flowering came to ${s.world.planet}.`); LF.cue(s, 'fl.turn', 0); LF.cue(s, 'fl.mid', 20, 35); s.tension = clamp(s.tension + 12, 0, 100); }
    if (t.phase === 'swell' && s.day % 5 === 0) LF.emit(s, 'unexplained', 'th.flower', 25 + t.mass / 4, 8, 'everything in the valley is growing too fast');
    if (t.phase === 'flower') {
      const A = ANS[t.truth.ans]; if (s.day % 5 === 0) LF.emit(s, A.cond, 'th.flower', t.held ? 30 : 50, 8, A.why);
      if (s.day >= t.at + t.len) { LF.endThread(s, LID, 'passed', 'The Flowering passed, and the valley was quiet and bare.'); LF.emit(s, 'hope', 'th.flower', 45, 200, 'the Flowering has passed'); s.yieldBonus += t.truth.ans === 'shed' ? 0.06 : 0.03; LF.cue(s, 'fl.after', 3, 15); }
    }
  },
  light: (s, t) => t.phase === 'swell' ? 1.08 : t.phase === 'flower' ? (t.truth.ans === 'graze' ? (t.held ? 0.88 : 0.72) : t.truth.ans === 'bloom' ? 0.92 : 0.95) : 1,
  press: (s, t, P) => { if (t.phase === 'flower' && t.truth.ans === 'bloom') P.labor -= t.held ? 0.01 : 0.03; },
});
const LB = (ph, st) => LF.beat(LID, ph, Object.assign({ gap: 25 }, st));
LB('swell', { id: 'fl.swell', chain: true, tone: 'opportunity', title: 'Too Much',
  text: s => `The fields are giving more than the plans said they would. So is everything else: the native growth at the edge of the clearing has doubled in a season, the ponds are green to the bottom, and ${Nw(s, 'botanist')} has stopped weighing the cuttings because the scales are wrong every week.\n\n${Nwc(s, 'xenobio')} is less pleased than everyone else.\n\n[[xenobio]] "Something on this world's counting everything alive, everything, and I think we're in the sum, ours too, we're being added up, and I can't decide whether I'm frightened or just very, very curious."`,
  choices: [
    { label: 'Find out what it is counting toward', test: { base: 50, mods: [R('xenobio', 10), R('botanist', 5), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones')] },
      ok: { text: 'A season of sampling across the whole valley. The growth curves all bend toward one point, and the colony\'s own curve bends the same way. The crew that did the sampling brought in no harvest of its own.', fx: s => ({ food: -50, do: s2 => { const t = FL(s2); t.insight = 100; t.known = s2.day; } }) },
      bad: { text: 'A season of sampling, and every curve says something different. The crew that did it brought in no harvest of its own.', fx: s => ({ food: -50, do: s2 => { FL(s2).insight += 30; } }) } },
    { label: 'Take everything it gives, while it gives it', note: s => `${Nc(s, 'xenobio')} asks for it to be recorded that this was advised against.`, out: { text: 'Every bed is cut twice and replanted the same day. The stores fill faster than they have since landfall, and the warning goes in the log unanswered.', fx: s => ({ food: 180, do: s2 => { FL(s2).mass += 10; const p = LF.h.P(s2, 'xenobio'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 8, 0, 100); } }) } },
    { label: 'Cut our own fields back, and the ration of those who do not dig', dark: true, note: 'Two fields fewer has to come off somebody\'s plate. It comes off the plates of the people who are not in the fields.', info: [['yield', 'The count held, and the crews fed'], ['danger', 'The ones who do not dig']],
      out: { text: 'Two fields are let go to fallow in a good year. The crews are fed as before. The clinic, the school and the old are fed from what is left, and one of them does not see the next season.', fx: s => ({ yield: -0.02, food: 60, pop: -1, stain: ['starved_list', 1], do: s2 => { FL(s2).cut = s2.day; } }) } },
  ] });
LB('swell', { id: 'fl.hungry', x: true, tone: 'pressure', title: 'Plant More',
  when: (s, t) => !t.asked && !!['hunger', 'scarcity'].find(k => LF.cv(s, k) >= 40 && LF.source(s, k) !== 'th.flower' && LF.because(s, k)),
  setup: s => { const k = ['hunger', 'scarcity'].find(k => LF.cv(s, k) >= 40 && LF.source(s, k) !== 'th.flower' && LF.because(s, k)); return { k, why: LF.because(s, k) }; },
  text: (s, c) => `${Nwc(s, 'quartermaster')} wants every spare hand on new fields, ${TH.bec(s, c.k)}. In this valley, this year, anything planted comes up.\n\n${FL(s).known ? `${Nwc(s, 'xenobio')} has run the numbers and can't stop saying it: every field the colony adds brings the Flowering closer.` : `${Nwc(s, 'xenobio')} has asked again, a little breathlessly, that nobody plant anything more until somebody works out why everything grows so fast.`}`,
  choices: [
    { label: 'Plant. People need feeding now', note: 'Every new field is more for this world to count.', out: { text: 'Three new fields go in on the flat below the colony, and they come up within the week.', fx: s => ({ food: 120, do: s2 => { const t = FL(s2); t.asked = s2.day; t.mass += 15; } }) } },
    { label: 'No new fields. The diggers eat, and the rest go short', dark: true, note: 'The count holds if nothing is planted. The cut falls on the people who are not in the fields.', info: [['yield', 'The count held'], ['danger', 'The weakest two']],
      out: { text: 'The new fields are not dug. The crews keep their ladle and everyone else loses a third of theirs. The two who were weakest are buried before the season turns, in a valley where everything grows.', fx: (s, c) => ({ morale: -2, pop: -2, stain: ['starved_list', 1], do: s2 => { FL(s2).asked = s2.day; LF.emit(s2, 'resentment', 'fl.hungry', 25, 150, 'the colony went hungry in a green valley'); } }) } },
  ] });
LB('flower', { id: 'fl.turn', chain: true, tone: 'crisis', title: 'The Flowering',
  text: s => { const t = FL(s); return `${ANS[t.truth.ans].is}.\n\n${t.known ? `${Nwc(s, 'xenobio')} says it quietly, for once: the colony helped tip it over.` : 'Nobody saw it coming, and the colony is in the middle of it.'} It has the feel of something that happens once in a long while, and lasts a season.`; },
  choices: [
    { label: s => ({ bloom: 'Masks, sealed pods, and the clinic on full alert', graze: 'Fence the fields and hold them', shed: 'Clear the rot from the water before it sets in' })[FL(s).truth.ans], cost: s => FL(s).truth.ans === 'graze' ? { mat: 35 } : { parts: 3 },
      test: { base: 50, mods: [R('botanist', 10), R('physician', 5), R('security', 5), If(s => !!FL(s).known, 10, 'The colony saw it coming')] },
      ok: { text: 'It is hard work and it holds. The colony is in the Flowering, and getting through it.', fx: s => ({ do: s2 => { FL(s2).held = s2.day; } }) },
      bad: { text: 'It is hard work and it is not enough. The Flowering gets in.', fx: s => ({ morale: -2, do: s2 => { FL(s2).hurt = 1; } }) } },
    { label: 'Draw in now, and leave the far crews where they are', dark: true, note: 'Waiting for the outlying crews to walk in means opening the doors again in the middle of it.', info: [['yield', 'The stores, and everyone inside'], ['danger', 'The crews still outside']],
      out: { text: 'The colony shuts its doors the same hour and lives on what is in the stores. The two crews on the far fields reach the gate a day later and find it barred. Some of them are still camped outside it when the Flowering ends.', fx: s => ({ food: -40, pop: -2, stain: ['selection', 2], do: s2 => { FL(s2).hurt = 1; } }) } },
    { label: s => ({ bloom: 'Seal the pods, with the ones already coughing outside', graze: 'Drive the lock-up out to hold the fence line by hand', shed: 'Send the lock-up into the water to clear it by hand' })[FL(s).truth.ans], dark: true,
      note: 'It costs no parts and no plate, and it will hold.', info: [['yield', 'The colony holds'], ['danger', 'Everyone left outside']],
      out: { text: s => ({ bloom: 'The doors are sealed with nine people on the wrong side of them. They sleep in the lee of the stores for a fortnight, and food is put out for them at night. Five are alive when the doors open. Nobody inside caught it.',
          graze: 'Eight prisoners are put along the fence with poles and told their sentences end when the grazers do. The fence holds. Five of the eight are there at the end of it, and the grazers were not what killed the others.',
          shed: 'Eight prisoners go into the rot to the waist with rakes, and are kept at it in shifts until the intake runs clear. The water holds. Three of them sicken from it within the week, and do not get better.' })[FL(s).truth.ans],
        fx: s => ({ pop: FL(s).truth.ans === 'bloom' ? -4 : -3, morale: -2, stain: ['expend', 2], do: s2 => { FL(s2).held = s2.day; } }) } },
  ] });
LB('flower', { id: 'fl.mid', tone: 'pressure', title: 'The Middle of It',
  when: (s, t) => !t.mid && s.day - t.since > 15,
  text: s => `${ANS[FL(s).truth.ans].mid}.\n\n${Nwc(s, FL(s).truth.ans === 'graze' ? 'security' : 'physician')} wants a decision about what the colony gives up to get to the end of it.`,
  choices: [
    { label: s => ({ bloom: 'Close the fields and keep everyone inside', graze: 'Give them the outer fields and hold the inner', shed: 'Burn the heaps, all of them, now' })[FL(s).truth.ans], out: { text: s => ({ bloom: 'The work stops. The coughing slows, and the stores take the strain.', graze: 'The outer fences come down and the grazers pour through and strip the outer fields. The inner fields hold.', shed: 'The valley burns for three days. The smoke is terrible and the water clears.' })[FL(s).truth.ans],
      fx: s => ({ food: -60, do: s2 => { const t = FL(s2); t.mid = s2.day; t.held = t.held || s2.day; LF.ease(s2, ANS[t.truth.ans].cond, 'fl.mid', 20, 80); } }) } },
    { label: 'Work through it', note: 'The work gets done, at a cost to people.', out: { text: 'The rota stays as it is. People do their shifts sick, tired and frightened, and the colony keeps running. Two of them do not finish the season.', fx: s => ({ morale: -3, pop: -2, do: s2 => { FL(s2).mid = s2.day; } }) } },
  ] });
LB('after', { id: 'fl.after', chain: true, tone: 'opportunity', title: 'After the Flowering',
  text: s => { const t = FL(s); return `It is over. ${t.truth.ans === 'shed' ? 'The die-back has rotted down into a black mulch a hand deep over the whole valley.' : t.truth.ans === 'graze' ? 'The grazers have gone back into the ground, as suddenly as they came, leaving it cropped to the soil and thick with their droppings.' : 'The seed has settled, and the valley is green with a crop of seedlings nobody planted.'}\n\n[[botanist]] "The ground's richer than it's ever been, so the question is what we put in it, now we know this world keeps count of what we take."`; },
  choices: [
    { label: 'Plant hard, and take what it gives', out: { text: 'Every field is sown, and new ones are broken. The first cutting is the biggest the colony has had. The fields are already larger than they were when the world last answered.', fx: s => ({ yield: 0.04, do: s2 => { LF.emit(s2, 'hope', 'fl.after', 30, 300, 'the valley is richer for the Flowering'); LF.emit(s2, 'fear', 'fl.after', 15, 500, 'the fields are bigger than they were before the Flowering'); } }) } },
    { label: s => FL(s).known ? 'Plant under the mark, and keep the fields small' : 'Keep the fields small, in case their size set it off', out: { text: 'The fields are measured and kept to a size that is written into the plan, with a note in the margin about why. The ration stays short for another year to pay for it.', fx: s => ({ yield: 0.02, food: -60, do: s2 => { LF.ease(s2, 'fear', 'fl.after', 15, 400); } }) } },
  ] });
LF.TAGS['fl.swell'] = ['cautious open', 'bold', 'severe cautious'];
LF.TAGS['fl.hungry'] = ['mercy bold', 'severe cautious'];
LF.TAGS['fl.turn'] = ['bold order', 'severe cautious', 'severe order'];
LF.TAGS['fl.mid'] = ['cautious', 'severe bold'];
LF.TAGS['fl.after'] = ['bold', 'cautious'];
})();

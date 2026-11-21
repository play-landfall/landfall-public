/* Landfall — four minor threads (STORY-PLAN.md §1b, decision 6).
   The Verge (the plan's "Zone"): a bounded stretch of country where biology or physics is wrong, and it is growing.
   It owns the Returned: a party that comes back changed has been inside it. The Congregation: a faith that grows
   around whatever the colony can least explain, and takes its object from the strongest source of the hottest
   condition (LF.source). The Body: a killing among the named, cast from a real grudge in the tie graph. What We
   Carried: the colony's own crops, microbes or stowaways gone feral. None reads another thread's state; dice come
   from LF.srand. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, Nw, Nwc, R, If, byPid } = h;
const TH = LF.th, cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const other = (s, k, mine) => LF.source(s, k) && !String(LF.source(s, k)).startsWith(mine);
/* A condition felt at min or more, caused by something other than this thread, with a clause for why. */
const fromElse = (s, ks, mine, min) => ks.filter(k => LF.cv(s, k) >= (min || 40) && other(s, k, mine) && LF.because(s, k)).sort((a, b) => LF.cv(s, b) - LF.cv(s, a))[0] || null;

/* ======================= THE VERGE (the Zone) ======================= */
const Z = s => LF.T(s, 'zone'), ZID = 'zone';
const ZW = {
  growth: { edge: s => `On one side of it ${LF.lex(s, 'cover')} is ordinary. On the other, every stem has grown into the next, and the ground is one plant, warm to the touch`,
            back: 'Small cuts they came in with have closed over with something smooth and pale that is not skin. None of them minds',
            art: 'a seed head that fruits in nine days in any soil', artFx: { food: 160 }, artAfter: 'The beds that took the seed are still fruiting, and the plants have started to grow into each other',
            is: 'Inside the line, living things grow into one another. It is slow, and it is spreading outward, and it does not stop at skin' },
  echo:   { edge: 'Past it, every rock has a twin a few metres off, the same to the grain. A survey stake hammered in at the line was found next morning with two more beside it',
            back: 'They finish each other\'s sentences, and each of them remembers the others\' childhoods as well as their own',
            art: 'a lump of grey metal that, left against any part overnight, makes a second one beside it', artFx: { parts: 12 }, artAfter: 'The copied parts work, but some have started copying the parts stored next to them',
            is: 'Inside the line, things are copied. Rocks, stakes and memories come out of it twice' },
  still:  { edge: 'Past it nothing rots. Fallen leaves lie green, a dead animal lies as it fell, and a cup of water left there is still warm a week later',
            back: 'Their watches have lost eleven days. They have not eaten in all that time, and are not hungry, and their breath is warm on a cold morning',
            art: 'stones from inside the line that stay as warm as a hand for months', artFx: { machine: { reactor: 12 } }, artAfter: 'The warm stones have kept the heat banks up all season, and the ground under the store has gone still too: nothing in it rots, and nothing in it grows',
            is: 'Inside the line, things stop changing. Nothing rots, nothing cools and nothing grows' },
};
const zn = s => LF.known(s, 'th.zone') || 'the strange ground to the east';
/* The party that went in comes back changed: the same mark the expedition rules leave (gen.js), so the Returned cards fire. */
function returned(s, n, L) {
  s.flags.returned = (s.flags.returned || 0) + n; s.flags.returned_day = s.day; s.flags.returned_to = 'the Verge';
  if (L) { s.flags.returned_lead = L.id; if (!L.marks.touched) L.marks.touched = { d: s.day, txt: 'walked into the Verge and came back changed' }; }
}
LF.thread({ id: ZID, name: 'The Verge', view: 'world', minor: true,
  fits: s => ({ ruin: 0.45, jungle: 0.4, garden: 0.35, barren: 0.3, ice: 0.25, drowned: 0.25 })[s.world.type] || 0.3,
  roll: s => ({ what: LF.spick(s, Object.keys(ZW)) }), sig: t => t.truth.what,
  called: (s, t) => t.phase !== 'latent' ? 'the Verge' : null,
  ask: (s, t) => t.known ? 'How close to the Verge can the colony live?' : 'What is wrong with the ground past the line?',
  chap: { ceded: t => 'The Verge grew to the edge of the fields, and the colony gave it the ground.', held: t => 'The Verge grew toward the colony until a line was cut that it would not cross.',
          lived: t => 'The Verge grew over the outer fields, and some of the colony went on living in it.' },
  clue: (s, t) => ({ txt: 'A whole season of the log is about a line in the ground to the east, past which nothing was right. They went in to look, and wrote down what the ones who came back said, and stopped writing it down.', learn: s2 => { Z(s2).insight = clamp(Z(s2).insight + 40, 0, 100); } }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 120, 320), insight: 0, grow: 0, taken: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.wake) { LF.phase(s, ZID, 'edge', 'The colony found a line in the ground to the east, past which the country was wrong.'); s.signs.push({ id: 'placed', d: s.day, src: 'th.zone' }); LF.cue(s, 'zone.edge', 1, 10); } return; }
    t.grow += 0.16 + 0.06 * t.taken + (t.fed ? 0.05 : 0);
    if (s.day % 5 === 0) LF.emit(s, 'unexplained', 'th.zone', 20 + Math.round(t.grow / 4), 8, 'nobody knows what is happening past the line to the east');
    if (t.phase === 'edge' && t.grow >= 35) { LF.phase(s, ZID, 'growing'); LF.cue(s, 'zone.grows', 2, 15); }
    if (t.phase === 'growing' && t.grow >= 80 && !t.lineCued) { t.lineCued = true; LF.cue(s, 'zone.line', 5, 30); }
  },
});
/* A party that came back changed has been in the Verge. If this world has no Verge yet, it has one now. */
const away0 = LF.awayReturn;
LF.awayReturn = function (s, a, forced) {
  const n0 = s.flags.returned || 0, r = away0(s, a, forced);
  if ((s.flags.returned || 0) > n0 && s.threads && !s.threads.zone && LF.THREADS.zone) {
    const t = s.threads.zone = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: LF.THREADS.zone.roll(s), end: null, late: true };
    LF.THREADS.zone.start(s, t); t.wake = s.day; t.insight = 20; t.grow = 20;
    LF.phase(s, ZID, 'edge'); if (s.plot) { s.plot.threads.push(ZID); s.plot.counters.push(ZID); }
  }
  return r;
};
const ZB = (ph, st) => LF.beat(ZID, ph, Object.assign({ gap: 30, w: 2 }, st));
ZB('edge', { id: 'zone.edge', chain: true, tone: 'pressure', title: 'The Line',
  text: s => `The survey crew have found a line in ${LF.lex(s, 'cover')} east of the colony, as sharp as a property line. ${typeof ZW[Z(s).truth.what].edge === 'function' ? ZW[Z(s).truth.what].edge(s) : ZW[Z(s).truth.what].edge}.\n\n${Nwc(s, 'geologist')} has paced it for two kilometres in each direction and not found the end of it. The crew have started calling the far side the Verge.`,
  choices: [
    { label: 'Send four people in for a month', note: 'They may come back with answers, or changed.', risky: true, cost: { food: 40 }, info: [['danger', 'The four']],
      out: { text: 'Four volunteers go over the line at dawn with a radio and a month of food. The radio goes quiet an hour later.', fx: s => ({ do: s2 => { Z(s2).sent = s2.day; LF.cue(s2, 'zone.back', 10, 14); } }) } },
    { label: 'Take samples from the line, and do not cross it', test: { base: 50, mods: [R('geologist', 10), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones')] },
      ok: { text: 'A month of sampling from the safe side. What comes back is impossible, and every result can be repeated.', fx: s => ({ survey: 8, do: s2 => { const t = Z(s2); t.insight = clamp(t.insight + 50, 0, 100); t.known = s2.day; } }) },
      bad: { text: 'A month of sampling. Half the jars that came back from the far side of the line are not the jars that went in.', fx: s => ({ survey: 4, do: s2 => { Z(s2).insight += 20; } }) } },
    { label: 'Walk a prisoner in on a rope, a hundred metres at a time', dark: true, note: 'Whatever it does to a person, it does it to this one first, where it can be watched.', info: [['yield', 'What the Verge is'], ['danger', 'The one on the rope']],
      out: { text: s => `Somebody from the lock-up is walked over the line on four hundred metres of cable, and told to call out what they see. The calling goes on for most of an hour. Then it stops, and the cable goes on paying out, and when it is hauled in there is nothing on the end of it that ${Nw(s, 'physician')} will let the crew look at. The notes run to nine pages.`,
        fx: s => ({ pop: -1, stain: ['expend', 1], do: s2 => { const t = Z(s2); t.insight = clamp(t.insight + 55, 0, 100); t.known = s2.day; } }) } },
  ] });
ZB('edge', { id: 'zone.back', chain: true, view: 'people', tone: 'pressure', title: 'A Month Inside',
  setup: s => TH.ctx(LF.cast(s, { val: 'bold', not: ['security'] })),
  text: (s, c) => `The four come back across the line a month to the day, walking in step. ${ZW[Z(s).truth.what].back}.\n\n${c.name}, who led them, has a notebook full of measurements and cannot say how any of them were taken.`,
  choices: [
    { label: 'Welcome them home', info: [['later', 'Everyone who bunks beside them']], out: { text: 'They eat with everyone else and go back to work the next morning. People leave a space around them at the table. Whatever they brought back is in the pods now, in the water bottles and the bunkrooms, with nothing between it and the rest of the colony.', fx: (s, c) => ({ morale: -2, do: s2 => { const t = Z(s2); t.insight = clamp(t.insight + 35, 0, 100); t.known = s2.day; returned(s2, 4, byPid(s2, c.pid)); } }) } },
    { label: 'Shut them in a pod, with no date on it', dark: true, note: 'The physician cannot say when it would be safe, so nobody says when it ends.', info: [['yield', 'The colony kept apart from it'], ['danger', 'The four']],
      out: { text: 'The four of them go into one pod with a bar on the door and a hatch for the tray. They take it calmly and talk quietly all night. The physician finds nothing to treat and nothing to rule out, and the bar stays on.', fx: (s, c) => ({ stain: ['confined', 1], do: s2 => { const t = Z(s2); t.insight = clamp(t.insight + 45, 0, 100); t.known = s2.day; returned(s2, 4, byPid(s2, c.pid)); s2.flags.ret_slighted = true; LF.emit(s2, 'confinement', 'zone.back', 20, 60, 'four people are shut in a pod for what happened past the line'); } }) } },
  ] });
ZB(['edge', 'growing'], { id: 'zone.take', tone: 'opportunity', title: 'Something From Inside',
  when: (s, t) => !t.took && s.day - t.woke > 60 && (t.known || s.flags.returned >= 3),
  text: s => `Someone has been going over the line on rest days and coming back with things. The latest is ${ZW[Z(s).truth.what].art}.\n\n${Nwc(s, 'quartermaster')} has a list of what the colony is short of, and plainly wants it.`,
  choices: [
    { label: 'Bring out what can be used', note: 'The Verge seems to grow faster the more is taken from it.', out: { text: s => `It works. ${cap(ZW[Z(s).truth.what].art)} goes on the stores list, and three more are fetched that month.`, fx: s => Object.assign({}, ZW[Z(s).truth.what].artFx, { do: s2 => { const t = Z(s2); t.took = s2.day; t.taken++; LF.emit(s2, 'changed', 'zone.take', 15, 200, 'the colony is living on what it brings out of the Verge'); } }) } },
    { label: 'Take it back over the line', info: [['danger', 'Whoever needed what it would have given']], out: { text: s => `It is carried back over the line and set down. ${Nc(s, 'quartermaster')} crosses it off the list of things the colony is short of and writes the shortage back in. The person who brought it out does not speak to you for a month.`, fx: s => ({ morale: -2, food: -40, do: s2 => { const t = Z(s2); t.took = s2.day; t.grow = Math.max(0, t.grow - 10); } }) } },
  ] });
ZB(['edge', 'growing'], { id: 'zone.drift', x: true, view: 'people', tone: 'pressure', title: 'Over the Line',
  when: (s, t) => !t.drift && s.day - t.woke > 40 && !!fromElse(s, ['grief', 'fear', 'exhaustion'], 'zone.', 40),
  setup: s => { const k = fromElse(s, ['grief', 'fear', 'exhaustion'], 'zone.', 40), p = LF.cast(s, { mark: 'bereaved', not: ['security', 'physician'] }); return Object.assign(TH.ctx(p), { k, why: LF.because(s, k) }); },
  text: (s, c) => `People have started walking out to the line in the evening and standing at it, ${TH.bec(s, c.k)}. Last night ${c.name} stepped over and sat down on the far side, and is still there.\n\n[[${c.pid || 'x17'}]] "It's quiet in here. Nothing's wrong in here. Come and see."`,
  choices: [
    { label: (s, c) => `Go and sit with ${c.first} until morning`, info: [['danger', 'The others who come to watch']], out: { text: (s, c) => `Someone sits on the near side of the line and ${c.first} sits on the other, and they talk until it gets light. In the morning they walk back together. Half the colony heard about it, and the next evening there are twice as many standing at the line.`, fx: (s, c) => ({ food: -40, do: s2 => { Z(s2).drift = s2.day; const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal + 12, 0, 100); } }) } },
    { label: 'Have the watch bring them out', out: { text: (s, c) => `Two of the watch go over and carry ${c.first} out, not gently. A rope goes up along the line that month, with a guard on it at dusk.`, fx: (s, c) => ({ do: s2 => { Z(s2).drift = s2.day; const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal - 10, 0, 100); LF.emit(s2, 'confinement', 'zone.drift', 15, 120, 'the watch keeps people back from the Verge'); } }) } },
    { label: 'Let the ones who cannot bear it walk in', dark: true, note: 'They are no use to anyone as they are, and it is quiet in there.', info: [['yield', 'The grief goes with them'], ['danger', 'Two who will not come back']],
      out: { text: 'A path is worn out to the line, and a bench appears on the near side. Nobody is stopped. Two people stop coming back at night, and are seen from the stakes afterwards, working in the Verge, contented. The camp is easier without them, and people say so.', fx: (s, c) => ({ pop: -2, morale: 2, stain: ['let_go', 2], do: s2 => { const t = Z(s2); t.drift = s2.day; t.fed = 1; LF.ease(s2, 'grief', 'zone.drift', 15, 150); } }) } },
  ] });
ZB('growing', { id: 'zone.grows', chain: true, tone: 'pressure', title: 'Closer',
  text: s => `${Z(s).late && !s.memo['zone.edge'] ? `The ones who came back from ${s.flags.returned_to} talked about a line in the ground, past which nothing was right. The line has moved. It is three hundred metres from the outer fields now, and coming west.` : 'The Verge has come three hundred metres west since it was found, and the nearest field is the next thing in its way.'}\n\n${Z(s).known ? ZW[Z(s).truth.what].is + '.' : 'Nobody can say what is happening past the line, only that it is coming this way.'}${Z(s).taken ? ` ${ZW[Z(s).truth.what].artAfter}.` : ''}`,
  choices: [
    { label: 'Burn a firebreak along it and see whether it stops', cost: { mat: 20 }, test: { base: 50, mods: [R('engineer', 10), R('geologist', 5), If(s => Z(s).known, 10, 'The colony knows what it is')] },
      ok: { text: 'The burnt strip holds. The line creeps up to it and stops, and for a season it stays there.', fx: s => ({ do: s2 => { Z(s2).grow = Math.max(0, Z(s2).grow - 25); } }) },
      bad: { text: 'The burnt strip is inside the Verge within the month, and green again.', fx: s => ({ do: s2 => { Z(s2).grow += 5; } }) } },
    { label: 'Move the field onto the family plots', dark: true, note: 'The plots by the pods were promised to the people who dug them. They are the only good ground left to the west.', info: [['yield', 'No harvest lost'], ['danger', 'A promise, and the families']],
      out: { text: 'The crop is cut early and the field moved west, onto the garden plots that were handed out by name in the first year. The stakes with the names on them are pulled the same morning. The harvest is what it would have been.', fx: s => ({ morale: -3, stain: ['plots', 1], do: s2 => { Z(s2).grow = Math.max(0, Z(s2).grow - 10); } }) } },
    { label: 'Keep the crew on the nearest field until it is over them', dark: true, note: 'The field is worked to the last day, and somebody is standing in it when the line arrives.', info: [['yield', 'The whole crop, and what happens at the line'], ['danger', 'The crew of that field']],
      out: { text: 'Stakes go in every fifty metres with the date on them. The crew of the nearest field asks every morning whether it is still theirs to work, and is told yes. They bring in all of it. Two of them are in the last rows on the morning the line gets there, and what the stakes record that day is the first clear account of what it does.', fx: s => ({ pop: -2, food: 120, morale: -2, stain: ['expend', 2], do: s2 => { Z(s2).insight += 30; } }) } },
  ] });
ZB('growing', { id: 'zone.line', chain: true, tone: 'crisis', title: 'At the Fields',
  text: s => `The Verge is at the edge of the outer fields. ${Z(s).known ? ZW[Z(s).truth.what].is + '.' : 'Whatever it is, it has reached the crops.'} It will be in the fields by the next cutting, and then it will be in the colony.\n\n${s.flags.returned >= 3 && !s.flags.returned_gone ? 'The ones who came back from it say there is nothing to be afraid of.' : 'Nobody who has been inside it has an answer.'}`,
  choices: [
    { label: 'Give it the outer fields, and draw the colony in', info: [['danger', 'Every ladle, from now on']], out: { text: 'The outer fields are given up and a new line of stakes goes in behind them. The Verge stops there. The colony eats from what is left, which is less than it needs, and will for good.', fx: s => ({ yield: -0.04, morale: -2, do: s2 => LF.endThread(s2, ZID, 'ceded', 'The colony gave the Verge its outer fields.') }) } },
    { label: 'Cut a line it will not cross, whatever it costs', cost: { mat: 40, parts: 4 }, test: { base: 50, mods: [R('engineer', 10), R('geologist', 5), If(s => Z(s).known, 10, 'The colony knows what it is')] },
      ok: { text: 'A trench two metres deep, lined with ship\'s plate. The Verge comes up to it, and stops there.', fx: s => ({ do: s2 => LF.endThread(s2, ZID, 'held', 'A trench was cut that the Verge would not cross.') }) },
      bad: { text: 'The trench is dug, and the Verge goes under it. The colony loses the outer fields anyway, and a season of work with them.', fx: s => ({ yield: -0.05, morale: -3, do: s2 => LF.endThread(s2, ZID, 'ceded', 'The Verge crossed the trench and took the outer fields.') }) } },
    // The third option goes by who there is to send, so a fourth never shows: the returned while any are in the colony, the lock-up otherwise.
    { label: 'Give the fields to the ones who came back changed, and shut the gate behind them', dark: true, show: s => retOK(s), note: 'They are not afraid of it. They would be out of the pods, and the colony would still get the crop.', info: [['yield', 'The fields kept'], ['danger', 'The changed'], ['later', 'Whoever joins them']],
      out: { text: 'The ones the colony already keeps at arm\'s length are told the outer fields are theirs to work, and that their bunks have been given to others. They go without argument. The Verge comes over them in the fields. The crops are strange and can be eaten, and they are left at the gate each week by people who no longer come inside it.', fx: s => ({ morale: 1, stain: ['cast_out', 2], do: s2 => { returned(s2, 6, null); LF.emit(s2, 'changed', 'th.zone', 30, 600, 'part of the colony farms inside the Verge'); LF.endThread(s2, ZID, 'lived', 'Part of the colony went on farming inside the Verge.'); } }) } },
    { label: 'Farm inside it with people who are not asked', dark: true, show: s => !retOK(s), note: 'The fields are kept, and worked by the lock-up and whoever the watch adds to it. What comes out of them is no longer the colony\'s concern.', info: [['yield', 'The fields kept, and more'], ['danger', 'The ones sent in']],
      out: { text: s => `Ten are marched out to the outer fields each morning and counted back each night, for as long as counting them means anything. The crops are strange and heavy. By the second cutting the ten work without a guard, in step, and no longer answer to the names on the roll. ${Nwc(s, 'security')} has stopped calling the roll for them.`,
        fx: s => ({ yield: 0.03, morale: -3, stain: ['expend', 2], do: s2 => { returned(s2, 6, null); LF.emit(s2, 'changed', 'th.zone', 35, 600, 'prisoners farm inside the Verge, and are not themselves'); LF.endThread(s2, ZID, 'lived', 'The colony kept its outer fields by sending prisoners to farm inside the Verge.'); } }) } },
  ] });
/* The two Returned cards (once arc 'returned') are now beats of the Verge: the people they are about have been in it. */
const RP = s => s.flags.returned_lead && byPid(s, s.flags.returned_lead) && byPid(s, s.flags.returned_lead).alive ? s.flags.returned_lead : null;
const RN = s => s.flags.returned_lead && byPid(s, s.flags.returned_lead) && byPid(s, s.flags.returned_lead).alive ? byPid(s, s.flags.returned_lead).name : 'One of the returned';
const retOK = s => s.flags.returned >= 3 && !s.flags.returned_gone;
ZB(['edge', 'growing', 'after'], { id: 'ret.shed', view: 'people', tone: 'pressure', title: 'Behind the Workshop', gap: 20,
  when: s => retOK(s) && s.day - s.flags.returned_day >= 35,
  text: s => `The people who came back from ${s.flags.returned_to} have been building something behind the workshop, at night, from scrap. It is waist-high, symmetrical, and has no moving parts.\n\n${RN(s)} says only that it is nearly finished.`,
  choices: [
    { label: 'Let them finish it', test: { base: 50, mods: [R('engineer', 10)] },
      ok: { text: s => `When it is done they carry it to the ${LF.down(s, 'reclaimer') ? 'reclaimer' : 'reactor'} and set it against the housing. The ${LF.down(s, 'reclaimer') ? 'reclaimer' : 'reactor'} has not run so quietly since orbit. Nobody can say what the thing does.`, fx: s => ({ machine: LF.down(s, 'reclaimer') ? { reclaimer: 14 } : { reactor: 10 }, parts: 5, flags: { ret_trusted: true }, sched: [['ret.again', 40, 70]] }) },
      bad: { text: 'When it is done, every light in the colony dims. It is drawing power from the grid, through the ground, with no cable. They are surprised that anyone minds.', fx: { machine: { reactor: -10 }, morale: -3, flags: { ret_trusted: true }, sched: [['ret.again', 40, 70]] } } },
    { label: 'Ask what it is for', info: [['danger', 'What the camp makes of the answer']], out: { text: s => `${RN(s)} thinks about it for a long time.\n\n[[${RP(s) || 'x26'}]] "It's so the place we went can tell where we are. It already knows. This is just manners."\n\nThe answer is all round the camp by morning, and the bunks nearest theirs are empty by night.`, fx: { survey: 15, morale: -3, flags: { ret_heard: true }, sched: [['ret.again', 40, 70]], do: s2 => { const t = Z(s2); if (t) t.insight = clamp(t.insight + 20, 0, 100); } } } },
    { label: 'Break it up, and split them across the shifts', dark: true, note: 'They only build when they are together. One to a crew, one to a pod, and they are never together again.', info: [['yield', 'Scrap, and no second one'], ['danger', 'The returned, kept apart']],
      out: { text: 'They watch the watch take it apart, and none of them objects. Then each is given a different shift and a bunk in a different pod, with an order not to meet. Several of them are seen afterwards standing alone at the same hour, facing the same way.', fx: { mat: 20, morale: -2, stain: ['split_up', 1], flags: { ret_slighted: true }, sched: [['ret.again', 30, 55]] } } },
  ] });
ZB(['edge', 'growing', 'after'], { id: 'ret.again', view: 'people', tone: 'pressure', chain: true, title: 'They Want to Go Back',
  when: s => retOK(s),
  text: s => `The returned have asked, together, for leave to go back to ${s.flags.returned_to}. They mean to stay a while, and have no interest in surveying it. ${s.flags.ret_slighted ? 'They ask politely, the way people ask when they have already decided.' : 'They would like the colony\'s blessing, and say so.'}\n\nThere are ${Math.min(8, s.flags.returned)} of them, and they are good workers.`,
  choices: [
    { label: 'Let them go, with stores', cost: { food: 150 }, info: s => [['danger', `${cap(TH.num(Math.min(8, s.flags.returned)))} good workers, and the stores`]], out: { text: 'They leave at dawn, in step. At the ridge they turn, all at once, and raise a hand.', fx: s => ({ leave: Math.min(8, s.flags.returned), survey: 25, flags: { returned_gone: true }, chron: `The ones who came back changed went out again, to ${s.flags.returned_to}, and the colony let them.` }) } },
    { label: 'Send them as an official party, to come back', req: s => LF.hands(s) - Math.min(8, s.flags.returned) >= 18, reqText: 'Too few hands to spare them',
      out: { text: 'Orders are written, a return date set. They sign for their rations like anyone else.', fx: s => ({ away: { n: Math.min(8, s.flags.returned), days: LF.ri(s, 40, 70), danger: 2, to: s.flags.returned_to, ret: 'mystery', fid: null }, flags: { ret_trusted: true } }) } },
    { label: 'Nobody leaves. Lock them in the workshop and have them build', dark: true, note: 'Whatever they learned out there, their hands still have it. It can be had without their consent.', info: [['yield', 'What they can make'], ['danger', 'The returned']],
      out: { text: 'The workshop gets a bar on the outside of the door. They are given scrap and a list. What they build is beautiful and nobody understands it, and every machine in the camp runs better for having it near. They work in step, and at dusk they all turn to face the east wall.',
        fx: s => ({ machine: { reclaimer: 12, fabricator: 10 }, parts: 8, morale: -4, thralls: Math.min(8, s.flags.returned), stain: ['bond', 2], flags: { ret_slighted: true, ret_refused: true } }) } },
  ] });
if (LF.TAGS['ret.again']) LF.TAGS['ret.again'][2] = 'severe order';   // content-society.js sets both cards' tags; the third answer here is the workshop now
LF.TAGS['zone.edge'] = ['bold open', 'cautious open', 'severe order'];
LF.TAGS['zone.back'] = ['open mercy', 'severe order'];
LF.TAGS['zone.take'] = ['bold', 'closed'];
LF.TAGS['zone.drift'] = ['mercy', 'order severe', 'severe free'];
LF.TAGS['zone.grows'] = ['bold', 'severe order', 'severe'];
LF.TAGS['zone.line'] = ['cautious', 'bold order', 'severe closed', 'severe order'];

/* ======================= THE CONGREGATION ======================= */
const C = s => LF.T(s, 'faith'), CID = 'faith';
/* What a faith can form around: the condition, and the plain words for it when the colony has no name for the cause. */
const OBJ = { dark: 'the dark', cold: 'the cold', storm: 'the storms', sickness: 'the sickness', fear: 'what is out past the wire', unexplained: 'what nobody can explain',
  changed: 'the ones who came back changed', watched: 'whatever is watching the colony', heard: 'the voice on the radio', siege: 'what waits at the wire', revelation: 'what has come to light', grief: 'the dead' };
const CREED = {
  appease: { does: 'They leave a share of their rations at the wire every night, and say that this is what keeps the worst away', ask: 'a tenth of the stores, set out at the wire at every new season', cond: 'zeal' },
  join:    { does: 'They say the colony was brought here to be taken in by it, and that the ones who resist are the ones who suffer', ask: 'leave to go out and meet it, unguarded, whenever they choose', cond: 'zeal' },
  flee:    { does: 'They say the valley is marked, and that the colony must pack up and go before the year turns', ask: 'the lander, fuelled, and a promise that it will carry them', cond: 'fear' },
  await:   { does: 'They say something is coming that will settle everything, and have stopped planting anything that will not be ready by spring', ask: 'a rest day each week for the vigil, for everyone, by rule', cond: 'zeal' },
};
const obj = s => { const t = C(s); return (t && (LF.known(s, t.src) || OBJ[t.k])) || 'what nobody can explain'; };
const ldr = s => { const t = C(s), p = t && t.lead && byPid(s, t.lead); return p && p.alive && !p.away ? p : null; };
const lname = s => { const p = ldr(s); return p ? p.name : 'the one who leads the meetings'; };
LF.thread({ id: CID, name: 'The Congregation', view: 'people', minor: true,
  fits: s => 0.4,
  roll: s => ({ creed: LF.spick(s, Object.keys(CREED)) }), sig: t => t.truth.creed + '/' + (t.k || ''),
  called: (s, t) => t.phase !== 'latent' ? 'the congregation' : null,
  ask: (s, t) => `What will the congregation that has grown around ${OBJ[t.k] || 'the unexplained'} ask of the colony?`,
  chap: { church: t => `A congregation grew around ${OBJ[t.k]}, and was given a place in the colony.`, broken: t => `A congregation grew around ${OBJ[t.k]}, and the colony broke it up.`,
          gone: t => `A congregation grew around ${OBJ[t.k]}, and its faithful left the colony.`, faded: t => `A congregation grew around ${OBJ[t.k]}, and faded when that had passed.` },
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 150, 360), n: 0, k: null, src: null, lead: null }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day < t.wake || s.day % 5) return;
      const k = Object.keys(OBJ).filter(k => LF.cv(s, k) >= 42 && LF.source(s, k)).sort((a, b) => LF.cv(s, b) - LF.cv(s, a))[0]; if (!k) return;
      const p = LF.cast(s, { val: 'order', free: true, not: ['security'] }) || LF.cast(s, { free: true });
      Object.assign(t, { k, src: LF.source(s, k), lead: p ? p.id : null, n: 6 });
      LF.phase(s, CID, 'meeting'); s.signs.push({ id: 'placed', d: s.day, src: 'th.faith' }); LF.cue(s, 'cong.first', 1, 10); return; }
    if (s.day % 10 === 0 && t.phase === 'meeting' && LF.cv(s, t.k) >= 30) t.n += 1;   // it grows while what it is about is felt
    if (s.day % 5 === 0 && t.n) LF.emit(s, CREED[t.truth.creed].cond, 'th.faith', clamp(10 + t.n, 10, 60), 8, `a congregation has grown around ${obj(s)}`);
    if (t.phase === 'meeting' && (t.n >= 20 || s.day - t.since > 200) && !t.askCued) { t.askCued = true; LF.phase(s, CID, 'creed'); LF.cue(s, 'cong.ask', 10, 40); }
    if (!t.endCued && t.phase === 'creed' && LF.cv(s, t.k) < 15 && s.day - t.since > 120) LF.endThread(s, CID, 'faded', 'The congregation faded once what it had gathered around had passed.');
  },
  press: (s, t, P) => { if (!t.end && t.truth.creed === 'await' && t.n >= 20) P.labor -= 0.02; if (t.end === 'church') P.morale += 0.01; },
});
const CB = (ph, st) => LF.beat(CID, ph, Object.assign({ gap: 30, w: 2 }, st));
CB('meeting', { id: 'cong.first', chain: true, tone: 'pressure', title: 'After Shift',
  setup: s => Object.assign(TH.ctx(ldr(s)), { why: LF.because(s, C(s).k) }),
  text: (s, c) => `A few people have been meeting in the seed store after the last shift, ${c.why ? 'since ' + c.why : 'for a month now'}. ${c.name ? c.name + ' leads it' : 'Somebody leads it'}. They talk about ${obj(s)}, quietly, as if it were listening.\n\n${CREED[C(s).truth.creed].does}. There are six of them, and every month there are more.`,
  choices: [
    { label: 'Leave them to it. People need something', info: [['danger', 'The last shift, and the ones who do not go']], out: { text: 'Nobody bothers them. The seed store is full by the end of the month. The last shift ends early for everyone who goes, and the people who cover for them are told they would understand if they came.', fx: s => ({ morale: 1, food: -50, do: s2 => { C(s2).n += 6; LF.ease(s2, 'fear', 'cong.first', 10, 100); } }) } },
    { label: 'Send someone to sit with them, and take the meeting in hand', test: { base: 50, mods: [R('chaplain', 10), R('teacher', 5)] },
      ok: { text: 'Whoever goes sits with them twice and then leads the meeting. The talk turns from what is out there to how to bear it.', fx: s => ({ do: s2 => { const t = C(s2); t.n = Math.max(0, t.n - 4); t.tamed = s2.day; } }) },
      bad: { text: 'Whoever goes sits with them once and is not invited back. The meetings move somewhere nobody else knows about.', fx: s => ({ do: s2 => { C(s2).n += 8; LF.emit(s2, 'suspicion', 'cong.first', 20, 120, 'a congregation meets somewhere nobody else is told about'); } }) } },
    { label: (s, c) => `${c.first} goes out with the far survey line, and does not come back`, dark: true, show: (s, c) => !!c.pid, note: 'Six people in a seed store are only a congregation while somebody is leading it.', info: [['yield', 'It stops before it starts'], ['danger', 'The one who leads it']],
      out: { text: (s, c) => `${c.name} is added to a survey party at an hour's notice. The party comes back nine days later, one short, with an account of a fall that all three of them give in the same words. The meetings go on for a month without anyone to speak, and then there are four people in the seed store, and then two.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'did not come back from the far survey line' }], stain: ['vanish', 2], do: s2 => { const t = C(s2); t.n = Math.max(0, t.n - 4); t.wake = s2.day; LF.emit(s2, 'suspicion', 'cong.first', 25, 150, `nobody believes the account of how ${c.name} died`); } }) } },
  ] });
CB(['meeting', 'creed'], { id: 'cong.again', x: true, tone: 'pressure', title: 'They Were Right',
  when: (s, t) => !t.again && s.day - t.since > 30 && LF.cv(s, t.k) >= 40 && other(s, t.k, 'th.faith') && other(s, t.k, 'cong.'),
  setup: s => ({ k: C(s).k, why: LF.because(s, C(s).k) }),
  text: (s, c) => `The congregation has said all along that ${OBJ[c.k]} would come back. It has, ${TH.bec(s, c.k)}. Twelve more people went to the meeting last night. ${lname(s)} spoke for an hour, and nobody left early.`,
  choices: [
    { label: 'Tell the mess hall it is understood and in hand', dark: true, note: 'It is neither. People leave a meeting when they think somebody knows.', info: [['yield', 'Fewer in the seed store'], ['fail', 'Being caught out']], test: { base: 60, mods: [R('teacher', 10), R('xenobio', 5), If(s => !!LF.known(s, C(s).src), 10, 'The colony knows the cause')] },
      ok: { text: 'You give the mess hall a cause, a cure and a date, none of which you have, and take questions until there are none. Most of the twelve do not go back.', fx: s => ({ morale: 2, stain: ['false_certainty', 1], do: s2 => { const t = C(s2); t.again = s2.day; t.n = Math.max(0, t.n - 8); } }) },
      bad: { text: 'You give the mess hall a cause, a cure and a date. Somebody from the clinic stands up and asks which notebook that is in. It sounds thin beside what was said in the seed store.', fx: s => ({ morale: -3, stain: ['false_certainty', 1], do: s2 => { const t = C(s2); t.again = s2.day; t.n += 12; } }) } },
    { label: 'Let them have this. It helps people get through', info: [['danger', 'The ones who would not go, and the work']], out: { text: 'Nobody argues with them, and the meetings grow. The colony gets through the bad month with more singing than anyone expected. The people who stayed out of it are asked, at their own tables, why.', fx: s => ({ morale: 2, food: -50, do: s2 => { const t = C(s2); t.again = s2.day; t.n += 12; LF.ease(s2, 'fear', 'cong.again', 15, 90); } }) } },
    { label: 'Give them a sermon to preach: yours', dark: true, note: 'People who believe they were warned will believe the next thing they are told by the same voice.', info: [['yield', 'A colony that does what the meeting says'], ['danger', 'What you have taught it to believe']],
      out: { text: s => `You send word to ${lname(s)} of what the faithful need to hear next: that the short ration is an offering, that the double shift is a vigil, that the officers were sent. It is preached that night, word for word. The work has never gone so well. The seed store will not hold them any more, and nobody in it is asking what is true.`,
        fx: s => ({ morale: 5, food: 80, stain: ['pulpit', 1], do: s2 => { const t = C(s2); t.again = s2.day; t.n += 16; LF.ease(s2, 'fear', 'cong.again', 20, 120); LF.emit(s2, 'zeal', 'cong.again', 40, 250, 'the congregation preaches what the officers give it to preach'); } }) } },
  ] });
CB('creed', { id: 'cong.ask', chain: true, tone: 'pressure', title: 'What the Faithful Ask',
  setup: s => TH.ctx(ldr(s)),
  text: (s, c) => `There are about ${TH.num(C(s).n)} in the congregation now. ${lname(s)} comes to the officers' table with a request, written out, signed by every one of them: ${CREED[C(s).truth.creed].ask}.\n\n[[${c.pid || 'x22'}]] "All we're asking is that you let us believe it. Nobody else has to."`,
  choices: [
    { label: 'Grant it', note: 'It will cost the colony, every season.', info: [['danger', 'Everyone who is not one of them']], out: { text: 'The request is granted and posted on the mess hall door. The congregation sings that night, loud enough to hear from the landing pad.', fx: s => { const k = C(s).truth.creed; return { morale: 2, food: k === 'appease' ? -Math.round(s.res.food / 10) : 0, do: s2 => { const t = C(s2); t.granted = s2.day; t.n += 6; if (k === 'join') LF.emit(s2, 'changed', 'cong.ask', 15, 300, 'the faithful go out to meet what is out there'); LF.endThread(s2, CID, 'church', 'The colony gave its congregation what it asked for.'); } }; } } },
    { label: 'Grant a part of it, and say which part', test: { base: 50, mods: [R('chaplain', 10), R('teacher', 5)] },
      ok: { text: 'It is argued for a week and settled with a handshake. The congregation keeps its meetings and its songs, and the colony keeps the rest of its rules.', fx: s => ({ do: s2 => LF.endThread(s2, CID, 'church', 'The colony made room for its congregation, within limits.') }) },
      bad: { text: 'It is argued for a week and not settled. The faithful take the half measure as a refusal.', fx: s => ({ morale: -2, do: s2 => { LF.emit(s2, 'schism', 'cong.ask', 30, 250, 'the congregation was refused what it asked for'); LF.cue(s2, 'cong.split', 20, 60); } }) } },
    { label: (s, c) => c.name ? `Refuse, and make ${c.first} stand up and tell them it was folly` : 'Refuse, and make their speaker tell them it was folly', dark: true, note: 'It ends faster if they hear it from their own.', info: [['yield', 'The meetings stop'], ['danger', 'The one who leads it']],
      out: { text: (s, c) => `It is done in the yard, with the watch standing by. ${c.name || 'Their speaker'} reads out a statement that was written at the officers' table. The meetings stop, in public. The faithful work their shifts and speak to nobody outside their own.`, fx: (s, c) => ({ morale: -2, stain: ['recant', 1], do: s2 => { const p = byPid(s2, c.pid); if (p && p.alive) { p.loyal = clamp(p.loyal - 20, 0, 100); p.marks.slighted = { d: s2.day, txt: 'was made to tell the congregation its faith was folly' }; } LF.emit(s2, 'schism', 'cong.ask', 35, 250, 'the congregation was broken up by order'); LF.cue(s2, 'cong.split', 20, 60); } }) } },
  ] });
CB('creed', { id: 'cong.split', chain: true, tone: 'crisis', title: 'The Faithful Leave',
  setup: s => TH.ctx(ldr(s)),
  text: (s, c) => `${lname(s)} has told the officers that the congregation is going, all of it, ${C(s).truth.creed === 'flee' ? 'over the pass, away from this valley' : 'out to where ' + obj(s) + ' can be met without walls in the way'}. They have packed. There are ${Math.min(14, Math.round(C(s).n / 2))} of them who mean it.`,
  choices: [
    { label: 'Let them go, with a fair share of the stores', cost: s => ({ food: Math.min(14, Math.round(C(s).n / 2)) * 12 }), out: { text: 'They go at dawn, singing. A handful turn back at the ridge and are let in again without a word.', fx: s => ({ leave: Math.min(14, Math.round(C(s).n / 2)), do: s2 => LF.endThread(s2, CID, 'gone', 'The congregation left the colony, with its blessing.') }) } },
    { label: 'Talk them round, one at a time', test: { base: 40, mods: [R('chaplain', 10), R('teacher', 5)] },
      ok: { text: 'It takes three nights and every officer. In the end the packs are unpacked and the congregation goes back to meeting in the seed store, a little smaller.', fx: s => ({ morale: 1, do: s2 => LF.endThread(s2, CID, 'church', 'The congregation was talked out of leaving, and stayed.') }) },
      bad: { text: 'They listen politely to everyone and go anyway, without the stores, at night.', fx: s => ({ leave: Math.min(14, Math.round(C(s).n / 2)), morale: -3, do: s2 => LF.endThread(s2, CID, 'gone', 'The congregation left the colony in the night.') }) } },
    { label: 'Bar the gate, and take their packs', dark: true, note: 'Nobody leaves. The colony keeps every pair of hands, and they stay inside with a grievance.', info: [['yield', 'Every hand kept'], ['danger', 'The faithful, held']],
      out: { text: 'The gate is barred and the packs are taken to the stores. The faithful sit down in front of the gate and stay there two days, with the watch standing over them, and then go back to their pods and their shifts.', fx: s => ({ morale: -3, stain: ['kept_in', 2], do: s2 => { LF.emit(s2, 'resentment', 'cong.split', 40, 300, 'the faithful were kept in by force'); LF.endThread(s2, CID, 'broken', 'The congregation tried to leave and was kept in by force.'); } }) } },
  ] });
LF.TAGS['cong.first'] = ['free mercy', 'order', 'severe order'];
LF.TAGS['cong.again'] = ['order severe', 'mercy free', 'order'];
LF.TAGS['cong.ask'] = ['free mercy', 'cautious', 'order severe'];
LF.TAGS['cong.split'] = ['free mercy', 'mercy', 'order severe'];

/* ======================= THE BODY ======================= */
const BD = s => LF.T(s, 'body'), BID = 'body';
const WHO = {
  grudge:   'the one with the grudge did it',
  close:    'it was someone close to the dead, and the grudge was a cover',
  accident: 'nobody did it: it was a fall, and the grudge made everyone see a killing',
};
const PLACE = ['at the foot of the water tower', 'behind the pump house', 'in the drainage cut below the fields', 'in the dark end of the seed store', 'on the rocks under the east berm'];
const vic = s => { const t = BD(s); return t && byPid(s, t.vic); };
const sus = s => { const t = BD(s); return t && byPid(s, t.sus); };
const real = s => { const t = BD(s); return t && t.who && byPid(s, t.who); };
const ok = p => !!p && p.alive && !p.away;
const tied = (s, a, b) => (s.bonds || []).find(x => (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id));
/* A victim and a suspect from a real grudge: a rivalry or a grudge in the tie graph, else two people who want the same chair. */
function pairUp(s) {
  const bad = (s.bonds || []).filter(x => x.k === 'rival' || x.k === 'grudge').map(x => [byPid(s, x.a), byPid(s, x.b), x]).filter(([a, b]) => ok(a) && ok(b));
  if (bad.length) { const [a, b, x] = LF.spick(s, bad), [v, q] = a.loyal >= b.loyal ? [a, b] : [b, a];
    return [v, q, x.k === 'rival' ? `who has been ${v.first}'s rival since long before landfall` : `who has held a grudge against ${v.first} for a long time`]; }
  const ch = s.people.filter(p => ok(p) && p.vals && p.want === 'chair');
  if (ch.length >= 2) { const a = ch[0], b = ch[1]; LF.bond(s, b, a, 'grudge', 'both wanted the same say in things'); return [a, b, `who wanted the same say in things that ${a.first} did, and said so`]; }
  return null;
}
LF.thread({ id: BID, name: 'The Body', view: 'people', minor: true,
  fits: s => 0.32,
  roll: s => ({ who: LF.spick(s, ['grudge', 'grudge', 'close', 'accident']) }), sig: t => t.truth.who,
  called: (s, t) => t.solved ? 'what happened to ' + (t.vname || 'the dead') : null,
  ask: (s, t) => `Who killed ${t.vname || 'the one found dead'}?`,
  chap: { judged: t => `${t.vname} was killed, and the colony found out who did it.`, wrong: t => `${t.vname} was killed, and the colony punished the wrong person for it.`,
          open: t => `${t.vname} was found dead, and nobody ever learned how.`, fall: t => `${t.vname} died in a fall that everyone took for a killing until it was proved otherwise.` },
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 260, 620), insight: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day < t.wake || s.day % 7) return; const pr = pairUp(s); if (!pr) { t.wake += 60; return; }
      const [v, q, why] = pr; t.vic = v.id; t.vname = v.name; t.sus = q.id; t.why = why; t.place = LF.spick(s, PLACE);
      if (t.truth.who === 'close') { const c = LF.close(s, v).find(o => ok(o) && o.id !== q.id); if (c) t.who = c.id; else t.truth.who = 'grudge'; }
      if (t.truth.who === 'grudge') t.who = q.id;
      LF.killPerson(s, v, t.truth.who === 'accident' ? 'found dead after a fall' : 'found dead, killed');
      LF.phase(s, BID, 'found'); s.signs.push({ id: 'missing', d: s.day, src: 'th.body' }); LF.cue(s, 'body.found', 0, 2);
      LF.emit(s, 'fear', 'th.body', 30, 90, `${v.name} was found dead and nobody knows how`); LF.emit(s, 'suspicion', 'th.body', 40, 150, `someone in the colony may have killed ${v.name}`); return; }
    if (t.phase === 'found') t.insight += 0.2;   // people remember things, in time
    if (t.phase === 'found' && t.insight >= 60 && !t.truthCued) { t.truthCued = true; LF.cue(s, 'body.truth', 3, 15); }
    if (t.phase === 'found' && !t.truthCued && s.day - t.since > 260) LF.endThread(s, BID, 'open', `Nobody ever learned how ${t.vname} died.`);
  },
});
const BB = (ph, st) => LF.beat(BID, ph, Object.assign({ gap: 20, w: 2.2 }, st));
const bctx = s => { const t = BD(s), q = sus(s); return { vname: t.vname, vfirst: (vic(s) || {}).first || t.vname, sname: q ? q.name : 'the one people suspect', sfirst: q ? q.first : 'them', spid: t.sus, place: t.place, gr: t.why }; };
BB('found', { id: 'body.found', chain: true, tone: 'crisis', title: 'Found in the Morning',
  setup: s => bctx(s),
  text: (s, c) => `${c.vname} was found this morning ${c.place}, dead some hours. ${Nwc(s, 'physician')} says the head wound could be a fall. It could also be something else.\n\nBy breakfast everyone is saying the same name: ${c.sname}, ${c.gr}.`,
  choices: [
    { label: 'Have security look into it, quietly and properly', test: { base: 50, mods: [R('security', 10), R('physician', 5)] },
      ok: { text: 'Security walks the ground, takes statements and keeps them apart. There are three accounts that do not fit together, and now the colony knows which three.', fx: s => ({ do: s2 => { BD(s2).insight += 60; } }) },
      bad: { text: 'Security walks the ground, but half the colony has walked it first. What is left is a lot of footprints and a lot of opinions.', fx: s => ({ do: s2 => { BD(s2).insight += 20; } }) } },
    { label: 'An inquest in the mess hall, in front of everyone', note: 'Everyone hears every word, the suspect included.', info: [['danger', 'The one everybody is already looking at']], out: { text: (s, c) => `Everyone who was awake that night stands up and says where they were. ${c.sfirst} goes last, with the room turned toward the bench.`, fx: (s, c) => ({ do: s2 => { BD(s2).insight += 30; const q = byPid(s2, c.spid); if (q && q.alive) { q.loyal = clamp(q.loyal - 10, 0, 100); q.marks.questioned = { d: s2.day, txt: `was questioned in front of everyone over ${c.vname}'s death` }; } LF.emit(s2, 'suspicion', 'body.found', 25, 150, `the whole colony watched ${c.sname} questioned`); } }) } },
    { label: (s, c) => `Put ${c.sfirst} in the pump house until there is a confession`, dark: true, show: s => ok(sus(s)), note: 'Everyone already has the name. Security only needs it said by the one it belongs to.', info: [['yield', 'An answer, quickly'], ['danger', 'Whether it is true']],
      out: { text: (s, c) => `${Nwc(s, 'security')} has ${c.sname} for three nights. On the third there is a confession, signed. ${Nc(s, 'security')} tells you privately:\n\n[[security]] "Anybody signs by the third night, me included, so I'd read that paper as someone agreeing with whatever was said last."`,
        fx: (s, c) => ({ stain: ['torture', 2], do: s2 => { BD(s2).insight += 60; const q = byPid(s2, c.spid); if (q && q.alive) { q.loyal = clamp(q.loyal - 30, 0, 100); q.marks.questioned = { d: s2.day, txt: `spent three nights in the pump house over ${c.vname}'s death` }; } LF.ease(s2, 'suspicion', 'body.found', 15, 90); } }) } },
  ] });
BB('found', { id: 'body.locked', x: true, tone: 'pressure', title: 'One of Us',
  when: (s, t) => !t.locked && s.day - t.since > 10 && !!fromElse(s, ['confinement', 'dark'], 'body.', 38),
  setup: s => { const k = fromElse(s, ['confinement', 'dark'], 'body.', 38); return Object.assign(bctx(s), { k, why: LF.because(s, k) }); },
  text: (s, c) => `Nobody can get away from anybody now, ${TH.bec(s, c.k)}, and nobody has forgotten ${c.vname}. People have started sleeping with something heavy by the bunk. Two pods have asked to be moved away from ${c.sname}.`,
  choices: [
    { label: 'Double the night watch, and leave everyone where they are', cost: { parts: 1 }, info: [['later', 'Whoever the pods decide to deal with themselves']], out: { text: (s, c) => `Two of the watch walk the pod rows all night, and nobody is moved. Nobody sleeps better either. In the second week ${c.sname} is found in the wash house with a broken jaw, and nobody in three pods saw anything.`, fx: (s, c) => ({ morale: -2, do: s2 => { BD(s2).locked = s2.day; BD(s2).insight += 10; const q = byPid(s2, c.spid); if (q && q.alive) q.loyal = clamp(q.loyal - 10, 0, 100); } }) } },
    { label: (s, c) => `Chain ${c.sfirst} to the bunk at night, where everyone can see it`, dark: true, note: 'Nothing is proved. The colony would sleep.', info: [['yield', 'A colony that sleeps'], ['danger', 'Someone who may have done nothing']],
      out: { text: (s, c) => `A length of cargo chain and a padlock, with the key on a nail by the door. ${c.sfirst} holds out a wrist without being asked. The heavy things go back under the bunks, and people sleep. In the mornings ${c.sfirst} waits to be unlocked, and thanks whoever does it.`,
        fx: (s, c) => ({ morale: 2, stain: ['chained', 1], do: s2 => { BD(s2).locked = s2.day; const q = byPid(s2, c.spid); if (q && q.alive) { q.loyal = clamp(q.loyal - 28, 0, 100); q.marks.slighted = { d: s2.day, txt: 'was chained to a bunk at night on suspicion alone' }; } LF.ease(s2, 'fear', 'body.locked', 25, 120); } }) } },
  ] });
BB('found', { id: 'body.truth', chain: true, tone: 'pressure', title: 'What Happened to Them',
  setup: s => { const r = real(s); return Object.assign(bctx(s), r ? { rpid: r.id, rname: r.name, rfirst: r.first } : {}); },
  text: (s, c) => { const t = BD(s), r = real(s);
    if (t.truth.who === 'accident') return `The marks were read again by somebody who knew what to look for. ${c.vname} fell, alone, in the dark, and struck their head going down. There was no one else there.\n\n${c.sname} has been carrying the colony's suspicion for ${LF.monthsWord((s.day - t.since) / LF.MONTH)} for nothing.`;
    if (t.truth.who === 'close') return `${r ? r.name : 'Someone close to ' + c.vfirst}, who was closest to ${c.vfirst} of anyone, killed ${c.vfirst} and let the colony go on blaming ${c.sname}, because everyone already had that name ready.\n\n${r && r.alive ? `${r.first} does not deny it.` : 'The one who did it is beyond the colony\'s reach now.'}`;
    return `It was ${c.sname}. There was an argument, the same one as always, and it ended ${c.place}. ${r && r.alive ? `${r.first} does not deny it, and does not explain it either.` : 'The one who did it is beyond the colony\'s reach now.'}`; },
  choices: [
    { label: 'Exile', note: 'Out past the markers, for good.', show: s => BD(s).truth.who !== 'accident', req: s => ok(real(s)), reqText: 'Nobody to exile',
      out: { text: (s, c) => `${c.rname} walks out past the markers with a pack and a knife. The colony goes quiet for a month.`, fx: (s, c) => ({ morale: -2, do: s2 => { const p = byPid(s2, c.rpid); if (p && p.alive) { p.alive = false; p.left = s2.day; p.cause = 'exiled'; s2.pop--; if (p.role) s2.vacancies.push({ role: p.role, day: s2.day + 40 }); } const t = BD(s2); t.solved = s2.day; LF.endThread(s2, BID, 'judged', `${c.rname} was exiled for the death of ${c.vname}.`); } }) } },
    { label: (s, c) => BD(s).truth.who === 'accident' ? `Clear ${c.sfirst}'s name, in front of everyone` : 'Say what happened, and leave it there', out: { text: (s, c) => BD(s).truth.who === 'accident' ? `You say it in the mess hall: it was a fall, and ${c.sfirst} had nothing to do with it. A few people go over and shake ${c.sfirst}'s hand. Most do not know where to look.` : 'It is told once, plainly. There is no sentence. Some people think that is mercy, and some think it is weakness.',
      fx: (s, c) => ({ do: s2 => { const t = BD(s2), q = byPid(s2, c.spid); t.solved = s2.day; if (t.truth.who === 'accident') { if (q && q.alive) q.loyal = clamp(q.loyal + 15, 0, 100); LF.ease(s2, 'suspicion', 'body.truth', 25, 150); LF.endThread(s2, BID, 'fall', `${c.vname}'s death was proved a fall.`); } else { LF.emit(s2, 'resentment', 'body.truth', 25, 200, `nobody was punished for ${c.vname}'s death`); LF.endThread(s2, BID, 'judged', `It came out who killed ${c.vname}, and nothing more was done.`); } } }) } },
    { label: (s, c) => `A rope, at the place where ${c.vfirst} was found`, dark: true, show: s => BD(s).truth.who !== 'accident', req: s => ok(real(s)), reqText: 'Nobody to hang', note: 'The colony has never killed one of its own by decision. After this it will have.', info: [['yield', 'It is finished, and seen to be'], ['danger', 'What the colony can now do']],
      out: { text: (s, c) => `It is done at dusk, where ${c.vname} was found, with everyone there who chose to be, and that was nearly everyone. ${c.rname} says nothing. Afterwards people stand about as if waiting to be told it was right. For a long time nobody raises a hand to anyone.`,
        fx: (s, c) => ({ kill: [{ who: c.rpid, cause: `hanged for the death of ${c.vname}` }], morale: 4, stain: ['rope', 1], do: s2 => { BD(s2).solved = s2.day; LF.ease(s2, 'suspicion', 'body.truth', 25, 150); LF.emit(s2, 'fear', 'body.truth', 30, 250, 'the colony has hanged one of its own'); LF.endThread(s2, BID, 'judged', `${c.rname} was hanged for the death of ${c.vname}.`); } }) } },
    // a fall (2026-11-18): the other answer, so the card asks something when there is nobody to sentence
    { label: 'Say nothing in the hall. Let the talk die down on its own', show: s => BD(s).truth.who === 'accident', note: (s, c) => `${c.sfirst} goes on carrying it for a while, and the colony never has to say it was wrong.`,
      info: (s, c) => [['yield', 'No scene in the mess hall'], ['danger', c.sfirst || 'The one suspected']],
      out: { text: (s, c) => `The finding goes in the record and nowhere else. The talk about ${c.sfirst} thins out over a season without ever quite stopping, and ${c.sfirst} eats at the end of the table now, by choice.`,
        fx: (s, c) => ({ do: s2 => { const t = BD(s2), q = byPid(s2, c.spid); t.solved = s2.day; if (q && q.alive) q.loyal = clamp(q.loyal - 10, 0, 100); LF.ease(s2, 'suspicion', 'body.truth', 12, 150); LF.endThread(s2, BID, 'fall', `${c.vname}'s death was found to be a fall, and nobody was told.`); } }) } },
  ] });
BB('found', { id: 'body.blame', view: 'people', tone: 'pressure', title: 'Enough Is Known',
  when: (s, t) => !t.truthCued && !t.blamed && s.day - t.since > 50 && t.called !== 'fall' && ok(sus(s)),   // t.called: only a save from before 2026-11-21, when the death could be called a fall on body.found
  setup: s => bctx(s),
  text: (s, c) => `It has been ${LF.monthsWord((s.day - BD(s).since) / LF.MONTH)} since ${c.vname} was found. ${Nwc(s, 'security')} has nothing new, and the colony has stopped waiting. A petition is going round with sixty names on it, asking for ${c.sname} to be put out past the markers.`,
  choices: [
    { label: (s, c) => `Do it. ${c.sfirst} goes`, dark: true, note: 'Whether it was them or not.', info: [['yield', 'The petition answered'], ['danger', 'Someone who may have done nothing']],
      out: { text: (s, c) => `${c.sname} is walked to the markers at dawn on the strength of sixty signatures and no evidence, and does not argue. The pods are easier that night. There is talk afterwards about whether anyone was sure.`, fx: (s, c) => ({ morale: 3, stain: ['goat', 1], do: s2 => { const t = BD(s2), q = byPid(s2, c.spid); t.blamed = s2.day; if (q && q.alive) { q.alive = false; q.left = s2.day; q.cause = 'exiled'; s2.pop--; if (q.role) s2.vacancies.push({ role: q.role, day: s2.day + 40 }); } LF.ease(s2, 'suspicion', 'body.blame', 20, 120); LF.endThread(s2, BID, t.truth.who === 'grudge' ? 'judged' : 'wrong', `${c.sname} was exiled for the death of ${c.vname}${t.truth.who === 'grudge' ? '' : ', and it was the wrong person'}.`); } }) } },
    { label: 'Not without proof. Keep looking', info: [['danger', 'Sixty people told no']], test: { base: 40, mods: [R('security', 10), R('physician', 5)] },
      ok: { text: 'The petition is answered with a list of what is known and what is not. Before the month is out, someone remembers a thing they had not thought worth saying.', fx: s => ({ do: s2 => { const t = BD(s2); t.blamed = s2.day; t.insight = Math.max(t.insight, 60); } }) },
      bad: { text: 'The petition is refused. It is signed again, by more people, and the colony starts to look at you the way it looks at the suspect.', fx: s => ({ morale: -3, do: s2 => { BD(s2).blamed = s2.day; LF.emit(s2, 'resentment', 'body.blame', 25, 150, 'the colony was refused its petition over the killing'); } }) } },
    { label: (s, c) => `Sixty names is a verdict. Hang ${c.sfirst}`, dark: true, note: 'Whether it was them or not, it would be over, and nobody would sign anything again.', info: [['yield', 'Morale, and an end to it'], ['danger', 'Someone who may have done nothing']],
      out: { text: (s, c) => `The petition is read out as the charge and the sentence both. ${c.sname} is hanged from the water tower gantry at dusk, having said once, clearly, that it was not so. The colony sleeps that night. ${Nc(s, 'security')} takes the petition down and keeps it, with all sixty names.`,
        fx: (s, c) => ({ kill: [{ who: c.spid, cause: `hanged on a petition for the death of ${c.vname}` }], morale: 5, stain: ['goat', BD(s) && BD(s).truth.who === 'grudge' ? 1 : 2], do: s2 => { const t = BD(s2); t.blamed = s2.day; LF.ease(s2, 'suspicion', 'body.blame', 30, 150);
          LF.endThread(s2, BID, t.truth.who === 'grudge' ? 'judged' : 'wrong', `${c.sname} was hanged for the death of ${c.vname}${t.truth.who === 'grudge' ? '' : ', and it was the wrong person'}.`); } }) } },
  ] });
LF.TAGS['body.found'] = ['order cautious', 'free open', 'severe order'];
LF.TAGS['body.locked'] = ['cautious mercy', 'severe order'];
LF.TAGS['body.truth'] = ['severe', 'mercy', 'severe order', 'order'];
LF.TAGS['body.blame'] = ['severe bold', 'mercy cautious', 'severe order'];

/* ======================= WHAT WE CARRIED ======================= */
const WC = s => LF.T(s, 'carried'), WCID = 'carried';
const WHAT = {
  crop:    { find: 'The survey crew have found a stand of barley, waist-high and heavy in the ear, two kilometres from the nearest field', eats: 'a native leaf-beetle that has taken to barley', is: 'The barley has crossed with a native grass and spreads by root as well as seed. Where it grows, nothing native comes up', lead: 'botanist', gain: { food: 140 } },
  microbe: { find: 'The field crews have found a ring of dead native growth around the compost pits, widening a metre a week, and the soil inside it smells like soil on Earth', eats: 'a native fungus that crowds the Earth bacteria out of its own ground', is: 'The compost carried Earth soil bacteria out with it. They eat what holds the native soil together, and they do not stop at the colony\'s fields', lead: 'botanist', gain: { yield: 0.02 } },
  pest:    { find: 'The stores crew have found droppings in the seed store that no native animal leaves. Something from the ship\'s hold has been breeding under the floor since landfall', eats: 'a native burrowing hunter that will take a rat as readily as anything else', is: 'Rats came down in the cargo, and the planet has nothing that eats them. They are in the stores, and out in the country for kilometres around', lead: 'security', gain: { food: 0 } },
};
LF.thread({ id: WCID, name: 'What We Carried', view: 'world', minor: true,
  fits: s => ({ garden: 0.5, jungle: 0.45, drowned: 0.35, ruin: 0.35, barren: 0.2, ice: 0.2 })[s.world.type] || 0.3,
  roll: s => ({ what: LF.spick(s, Object.keys(WHAT)) }), sig: t => t.truth.what,
  called: (s, t) => t.phase !== 'latent' ? (t.truth.what === 'crop' ? 'the wild barley' : t.truth.what === 'microbe' ? 'the dead ring' : 'the rats') : null,
  ask: (s, t) => 'What has the colony let loose on this world?',
  chap: { culled: t => 'Something the colony brought with it got loose, and was hunted down and burned out.', naturalised: t => 'Something the colony brought with it got loose, and was left to become part of this world.',
          checked: t => 'Something the colony brought with it got loose, and was checked with a native thing that eats it.', wild: t => 'Something the colony brought with it got loose, and the colony could not stop it.' },
  clue: (s, t) => ({ txt: 'Every page of their last year mentions the fields: weeds they had brought themselves, in places they had never planted, and the native growth dying back wherever the weeds went.', learn: s2 => { WC(s2).insight = clamp(WC(s2).insight + 40, 0, 100); } }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 160, 380), insight: 0, spread: 0, ate: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.wake) { LF.phase(s, WCID, 'loose'); s.signs.push({ id: t.truth.what === 'pest' ? 'stores_short' : 'crop_fail', d: s.day, src: 'th.carried' }); LF.cue(s, 'wc.find', 1, 12); } return; }
    t.spread += 0.12 + (t.ate ? 0.06 : 0);
    if (t.truth.what === 'pest' && s.day % 10 === 0 && !t.end) s.res.food = Math.max(0, s.res.food - 6);
    if (t.phase === 'loose' && t.spread >= 50 && !t.turnCued) { t.turnCued = true; LF.phase(s, WCID, 'spread'); LF.cue(s, 'wc.turn', 5, 25); }
  },
});
const WB = (ph, st) => LF.beat(WCID, ph, Object.assign({ gap: 30, w: 2 }, st));
WB('loose', { id: 'wc.find', chain: true, tone: 'pressure', title: 'From the Hold',
  text: s => `${WHAT[WC(s).truth.what].find}.\n\n${Nwc(s, WHAT[WC(s).truth.what].lead)} has the cargo manifest open and is going down it line by line. Whatever this is, the colony brought it here.`,
  choices: [
    { label: 'Burn it out now, while it is small', cost: { mat: 15 }, test: { base: 50, mods: [R('botanist', 10), R('security', 5)] },
      ok: { text: 'It is burned and dug out, and the ground around it salted. Nothing comes back that season.', fx: s => ({ do: s2 => { WC(s2).spread = Math.max(0, WC(s2).spread - 30); WC(s2).insight += 20; } }) },
      bad: { text: 'It is burned and dug out, and a month later it is somewhere else.', fx: s => ({ do: s2 => { WC(s2).insight += 15; } }) } },
    { label: 'Find out how far it has gone first', test: { base: 50, mods: [R('botanist', 10), R('xenobio', 5), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones')] },
      ok: { text: 'A month of transects, walked by people the fields were short of. It is further than anyone thought, and now the colony knows exactly how far.', fx: s => ({ survey: 6, food: -40, do: s2 => { WC(s2).insight = clamp(WC(s2).insight + 60, 0, 100); WC(s2).known = s2.day; } }) },
      bad: { text: 'A month of transects, walked by people the fields were short of, and the count keeps changing under the counters.', fx: s => ({ food: -40, do: s2 => { WC(s2).insight += 25; } }) } },
    { label: 'It is ours. Let it take what ground it can', dark: true, note: 'It costs nothing and it is something of Earth. Whatever was growing there first is not the colony\'s to save.', info: [['yield', 'Nothing spent'], ['danger', 'What grew there before']],
      out: { text: 'Nobody goes after it. A few people say, half joking, that at least something from home is doing well. By the end of the season the gully it came up in has nothing else in it.', fx: s => ({ morale: 1, stain: ['overrun', 1], do: s2 => { WC(s2).spread += 10; } }) } },
  ] });
WB(['loose', 'spread'], { id: 'wc.eat', x: true, tone: 'opportunity', title: 'Free for the Taking',
  when: (s, t) => !t.ate && !t.noeat && t.truth.what !== 'microbe' && !!fromElse(s, ['hunger', 'scarcity'], 'wc.', 40),
  setup: s => { const k = fromElse(s, ['hunger', 'scarcity'], 'wc.', 40); return { k, why: LF.because(s, k) }; },
  text: (s, c) => WC(s).truth.what === 'crop'
    ? `People have started going out past the fields with sacks, ${TH.bec(s, c.k)}. The wild barley is there for the cutting, more of it every month, and it is good grain.\n\n${Nwc(s, 'botanist')} wants it left alone, because every sack spills seed on the way home.`
    : `Somebody has worked out that the rats are good eating, and people have started setting snares, ${TH.bec(s, c.k)}.\n\n${Nwc(s, 'physician')} has opinions about what the rats have been eating, and has written them on the mess hall door.`,
  choices: [
    { label: 'Let people take what they can', info: [['yield', 'Food'], ['danger', 'Whoever eats the wrong part of it']], out: { text: s => (WC(s).truth.what === 'crop' ? 'The sacks come in all month. There is bread in the mess hall again, and barley coming up along every path to it.' : 'Snares go out along every wall. The stew is better than it has been, and nobody asks what is in it.') + ' Within the month a field hand is dead of something the clinic has no name for, and nobody can say which meal it was.', fx: s => ({ food: WC(s).truth.what === 'crop' ? 160 : 60, pop: -1, do: s2 => { WC(s2).ate = s2.day; WC(s2).spread += 12; } }) } },
    { label: 'Nobody touches it', info: [['danger', 'The hungry who obey']], out: { text: 'The order is posted. Hungry people walk past food on the way to shift. Some go out after dark anyway, and the ones who do not are the ones who get thin. One of them is buried that month.', fx: s => ({ morale: -2, pop: -1, do: s2 => { WC(s2).noeat = s2.day; } }) } },   // refused: the card is done, and the spread is not fed
    { label: 'The lock-up eats it for a month. Then everyone, or no one', dark: true, note: 'Nobody knows what it has been feeding on out there. Somebody can find out for the rest.', info: [['yield', 'Food, known to be safe'], ['danger', 'The ones who eat first']],
      out: { text: s => WC(s).truth.what === 'crop' ? `Six prisoners get nothing but the wild grain for a month, weighed and written down. One goes yellow in the second week and is dead in the third: it is the ears with the black tips. Those are picked out by hand from then on, and the rest goes into the bins by the cartload.` : `Six prisoners get rat stew twice a day and are bled every week. One of them dies of something ${N(s, 'physician')} can now name, and knows how to boil out. After that the snares go out along every wall, and the stew is safe.`,
        fx: s => ({ food: WC(s).truth.what === 'crop' ? 220 : 110, pop: -1, stain: ['taster', 1], do: s2 => { WC(s2).ate = s2.day; WC(s2).spread += 8; } }) } },
  ] });
WB('spread', { id: 'wc.turn', chain: true, tone: 'pressure', title: 'Ours, Everywhere',
  text: s => { const t = WC(s); return `${t.known ? WHAT[t.truth.what].is + '.' : 'It is everywhere now, along every path and in every gully within a day\'s walk.'}\n\n${Nwc(s, 'xenobio')} has been counting native species in a square kilometre east of the fields. Last year there were forty. This year there are eleven.`; },
  choices: [
    // base 65 (was 40) since 2026-11-21: the certain cull (everyone on the line, three dead) is gone, so this roll is the only way to `culled`
    { label: 'Cut it out, everywhere, whatever it takes', cost: { mat: 30, parts: 3 }, test: { base: 65, mods: [R('botanist', 10), R('security', 5), If(s => !!WC(s).known, 10, 'The colony knows how far it has gone')] },
      ok: { text: 'It takes a whole season and every spare hand. When it is done, the native growth starts coming back at the edges.', fx: s => ({ do: s2 => LF.endThread(s2, WCID, 'culled', 'The colony hunted down what it had let loose, and burned it out.') }) },
      bad: { text: 'A whole season and every spare hand, and when it is over there is less of it, but it is still there.', fx: s => ({ morale: -2, do: s2 => LF.endThread(s2, WCID, 'wild', 'The colony could not stop what it had let loose.') }) } },
    { label: 'Find a native thing that eats it', req: s => !!P2(s, 'botanist') || !!P2(s, 'xenobio'), reqText: 'Needs the Lead Scientist or the Chief Agronomist', test: { base: 50, mods: [R('xenobio', 10), R('botanist', 5)] },
      ok: { text: s => `It is ${WHAT[WC(s).truth.what].eats}. It is turned loose along the edges and holds the line.`, fx: s => ({ survey: 5, do: s2 => LF.endThread(s2, WCID, 'checked', 'Something native was found that keeps what the colony let loose in check.') }) },
      bad: { text: 'The native thing that was meant to eat it eats the colony\'s own crops as well, and has to be dealt with too.', fx: s => ({ yield: -0.02, do: s2 => LF.endThread(s2, WCID, 'wild', 'The colony could not stop what it had let loose.') }) } },
    { label: 'Let it have this country', dark: true, note: 'Forty kinds of living thing were here before the colony, in that one square. The colony would be choosing its own weeds over all of them.', info: [['yield', 'What it gives, for good'], ['danger', 'Everything that grew here first']],
      out: { text: s => `The count is written up and filed, and nobody is sent to count again. ${WC(s).truth.what === 'crop' ? 'The wild barley feeds the colony in a bad year.' : WC(s).truth.what === 'microbe' ? 'The fields do well in soil that is turning more like home every year.' : 'The rats are part of the place now, like weather.'}`, fx: s => Object.assign({}, WHAT[WC(s).truth.what].gain, { stain: ['overrun', 2], do: s2 => { LF.emit(s2, 'resentment', 'wc.turn', 15, 200, 'the colony let its own weeds take over the land around it'); LF.endThread(s2, WCID, 'naturalised', 'What the colony let loose was left to become part of this world.'); } }) } },
  ] });
const P2 = (s, role) => h.P(s, role);
LF.TAGS['wc.find'] = ['bold severe', 'cautious open', 'closed'];
LF.TAGS['wc.eat'] = ['free', 'order cautious', 'severe order'];
LF.TAGS['wc.turn'] = ['bold severe', 'open cautious', 'closed'];
/* The Verge on the World view (js/places.js, T2-4): the line the survey crew found. */
LF.THREADS[ZID].pois = (s, t) => s.used['zone.edge'] === undefined ? [] : [{ k: 'line', card: 'zone.edge', name: 'The Verge', kind: 'mark', dist: 'near', danger: t.end ? 1 : 3, state: t.sent ? 'visited' : 'located',
  known: `A line in ${LF.lex(s, 'cover')} east of the colony, as sharp as a property line. Nobody has found the end of it. The crews call the far side the Verge.` }];

})();

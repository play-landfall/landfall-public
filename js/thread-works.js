/* Landfall — thread: the Works. Old machinery that is still doing its job (STORY-PLAN.md §1).
   Rolled in secret: what the job is (remake the air, hatch something, stand guard, call home) and what makes it
   run faster (our reactor, our digging, our radio, our numbers). It keeps a progress count; when that reaches a
   hundred the job is done, and the colony lives in the result. If the world holds a ruin, the Works is that ruin. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, If, byPid } = h;
const TH = LF.th, T = s => LF.T(s, 'works'), ID = 'works';
const JOB = {
  terraform: { is: 'It is changing the air. A little more of one gas and a little less of another, every day, toward a mixture nothing from Earth was built to breathe', done: 'remade',
    end: 'The air is what the machine was told to make it. The crops began to wilt before anyone felt it in their lungs.' },
  hatch:     { is: 'It is a nursery. Everything it does is done to keep something warm, and the something is nearly ready', done: 'hatched',
    end: 'The cells are open and empty. Whatever was in them left in the night, in good order, and went uphill.' },
  guard:     { is: 'It is a sentry. It has mapped everything that moves within a hundred kilometres, the colony included, and it is sorting what it has mapped into two lists', done: 'armed',
    end: 'It has finished its lists. Nothing large has come near the colony since, and no party from the colony has managed to get far from it either.' },
  call:      { is: 'It is a beacon, and it has been building itself. When it is finished it will say one thing, very loudly, toward somewhere a long way off', done: 'called',
    end: 'For eleven minutes every radio in the colony played one rising tone, and then the machine went quiet.' },
  /* Stasis: time runs slow inside it, and slower the deeper you go. Its job is to keep something until its makers come back. */
  stasis:    { is: 'It is a store, and inside it time runs slow: an hour in the outer corridors is a day out here, and deeper in it is slower still. It is keeping something for its makers, and the slow ground is spreading outward as it fills', done: 'stilled',
    end: 'The slow ground closed over the whole hill. From the colony it looks like any hill, except that the grass on it has not moved in the wind since, and a bird that landed on it is still landing.' },
};
const SW = {
  power:   { when: s => LF.power(s) >= 0.85, is: 'whenever the reactor runs near full load', stop: 'Hold the reactor at half', price: 'the reactor is held at half load' },
  digging: { when: s => !!(s.built.wells || s.built.mine), is: 'whenever anyone breaks deep ground', stop: 'Cap the deep shafts', price: 'the deep shafts are capped' },
  noise:   { when: s => LF.cv(s, 'heard') >= 20 || !!s.flags.wrote_home, is: 'whenever the long-range radio is in use', stop: 'Shut the long-range radio down', price: 'the long-range radio is silent' },
  numbers: { when: s => s.pop >= 105, is: 'as the colony grows. It is counting us', stop: '', price: '' },
};
const fac = (s, t) => t.fid ? s.factors.find(f => f.id === t.fid) : null;
const nm = s => T(s).name, Nm = s => nm(s).replace(/^./, x => x.toUpperCase());
function learn(s, t, v) { t.insight = clamp(t.insight + v, 0, 100);
  if (t.insight >= 45 && !t.known.job) { t.known.job = s.day; LF.log(s, `${JOB[t.truth.job].is}.`, 'bad'); LF.cue(s, 'wk.job', 2, 10); }
  if (t.insight >= 30 && !t.known.sw && SW[t.truth.sw].when(s)) { t.known.sw = s.day; LF.log(s, `${Nm(s)} runs faster ${SW[t.truth.sw].is}.`); } }
function finish(s, t, end, chron) {
  const f = fac(s, t), map = { stopped: 'destroyed', sealed: 'contained', harnessed: 'harnessed' };
  LF.endThread(s, ID, end, chron); if (f && !f.res && map[end]) LF.resolve(s, f, map[end]);
  LF.cue(s, 'wk.done', 3, 12);
}
function complete(s, t) {
  const job = t.truth.job;
  if (job === 'terraform') { s.yieldBonus -= 0.05; LF.emit(s, 'changed', 'th.works', 45, 600, 'the air is not the air the colony landed in'); LF.emit(s, 'sickness', 'th.works', 22, 300, 'the new air sits badly in the lungs'); }
  if (job === 'hatch') { LF.emit(s, 'watched', 'th.works', 55, 500, `what ${nm(s)} hatched is out there, and knows where the colony is`); LF.emit(s, 'fear', 'th.works', 28, 300, `nobody saw what came out of ${nm(s)}`); }
  if (job === 'guard') { for (const f of s.factors) if (f.kind === 'fauna' && !f.res) f.threat = clamp(f.threat - 30, 0, 100); LF.emit(s, 'confinement', 'th.works', 35, 600, `${nm(s)} lets nothing of ours travel far`); LF.emit(s, 'dependency', 'th.works', 40, 600, `${nm(s)} stands guard, on its own terms`); }
  if (job === 'stasis') { s.yieldBonus -= 0.02; LF.emit(s, 'unexplained', 'th.works', 35, 900, `time has stopped on the hill over ${nm(s)}`);
    const g = t.goer && byPid(s, t.goer); if (g && g.alive && !g.away && t.stayed) { g.alive = false; g.cause = `was inside ${nm(s)} when time stopped there`; s.pop = Math.max(0, s.pop - 1); if (g.role) s.vacancies.push({ role: g.role, day: s.day + 40 }); LF.log(s, `${g.name} was inside ${nm(s)} when it closed, and is still there, an afternoon into a visit that will last centuries.`, 'bad'); } }
  if (job === 'call') { LF.emit(s, 'heard', 'th.works', 80, 900, `${nm(s)} has called to something a long way off`); LF.emit(s, 'fear', 'th.works', 25, 300, 'something has been told the colony is here'); s.seeds.push({ id: 'works:call', k: 'thread', d: s.day, txt: `${nm(s)} called home, and nothing has answered yet` }); }
  finish(s, t, JOB[job].done, `${Nm(s)} finished what it was built to do.`);
}

LF.thread({ id: ID, name: 'The Works', view: 'world', needs: 'ruin',
  fits: s => (s.world.mysteries || []).includes('builders') ? 0 /* one ancient machine a world; the Builders arc is the other */ : s.factors.some(f => f.kind === 'ruin') ? 0.55 : s.world.techCause === 'made' ? 0.35 : 0.12,
  roll: s => ({ job: LF.spick(s, Object.keys(JOB)), sw: LF.spick(s, Object.keys(SW)) }),
  sig: t => t.truth.job + '/' + t.truth.sw,
  called: (s, t) => t.phase !== 'latent' ? t.name : null,
  clue: (s, t) => ({ txt: `Their huts stood in a ring around ${t.name}, doors facing inward. The last thing they built was a wall across every one of those doors, from the inside.`, learn: s2 => learn(s2, T(s2), 30) }),
  start: (s, t) => { const f = s.factors.find(f => f.kind === 'ruin' && !f.dormant && !f.res);
    if (f) f.owned = ID;
    Object.assign(t, { fid: f ? f.id : null, name: f ? f.name : LF.spick(s, ['the Anvil', 'the Loom', 'the Mill']), prog: LF.sri(s, 15, 32), insight: 0, known: {}, wake: LF.sri(s, 150, 330), off: false, slow: false, tapped: false }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { const f = fac(s, t); if (s.day >= t.wake || (f && f.stage >= 2) || LF.cv(s, 'heard') >= 40) { LF.phase(s, ID, 'stir'); s.signs.push({ id: 'hum', d: s.day, src: 'th.works' }, { id: 'warmth', d: s.day, src: 'th.works' }); LF.cue(s, 'wk.pulse', 2, 14); } return; }
    const fast = !t.off && SW[t.truth.sw].when(s);
    t.prog = clamp(t.prog + 0.075 * (fast ? 2.4 : 1) * (t.tapped ? 1.5 : 1) * (t.slow ? 0.55 : 1), 0, 100);
    if (fast && t.insight >= 30 && !t.known.sw) learn(s, t, 0);
    if (t.phase === 'stir' && t.prog >= 35) LF.phase(s, ID, 'working', `${Nm(s)} began to run in earnest.`);
    if (t.phase === 'working' && t.prog >= 75) { LF.phase(s, ID, 'near'); LF.cue(s, 'wk.near', 1, 10); }
    if (s.day % 5 === 0 && t.phase !== 'stir') {
      if (!t.known.job) LF.emit(s, 'unexplained', 'th.works', 28, 8, `nobody knows what ${nm(s)} is doing`);
      LF.emit(s, 'heard', 'th.works', 15, 8, `${nm(s)} is running, and it is not quiet`);
      if (t.phase === 'near') LF.emit(s, 'fear', 'th.works', 22, 8, `${nm(s)} is close to finishing something`);
    }
    if (t.prog >= 100) complete(s, t);
  },
  light: (s, t) => !t.end && t.truth.job === 'terraform' && t.phase !== 'latent' ? 1 - 0.04 * t.prog / 100 : 1,
  press: (s, t, P) => { if (t.tapped && !t.end) P.wear *= 0.9; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ gap: 30 }, st));

B('stir', { id: 'wk.pulse', chain: true, tone: 'pressure', title: 'On the Clock',
  text: s => `Every ninety-one minutes the water in every cup in the colony shivers. ${h.Nwc(s, 'geologist')} timed it for a month before saying anything: ninety-one minutes, to the second, day and night.\n\n[[geologist]] "Faults don't keep time, rock doesn't keep time, so something under ${nm(s)} is keeping it, to the second, and I know I should be frightened and what I actually am is dying to see it."`,
  choices: [
    { label: 'Seismographs, in a ring, for a month', cost: { parts: 2 }, note: 'Four people sit the instruments instead of working the planting.', out: { text: 'A month of traces. The pulses come from one place, quite shallow, and each is a very little stronger than the one before. The four who sat the instruments were four off the planting, and the plots they would have dug are bare.', fx: s => ({ food: -50, do: s2 => learn(s2, T(s2), 28) }) } },
    { label: 'Dig toward it, with prisoners at the face', dark: true, note: 'A shaft in wet ground kills whoever is at the bottom of it.', info: [['yield', 'What is down there'], ['fail', 'A prisoner']], test: { base: 50, mods: [R('geologist', 10), R('engineer', 5)] },
      ok: { text: 'Six prisoners dig in shifts with a guard at the ladder head. Twelve metres down the shovels ring on something warm that is not rock, with a seam in it too straight to be natural.', fx: s => ({ mat: 30, stain: ['expend', 1], do: s2 => { learn(s2, T(s2), 40); if (T(s2).truth.sw === 'digging') T(s2).prog += 6; } }) },
      bad: { text: 'The shaft floods with warm water at nine metres, faster than the ladder can be climbed. One prisoner is not on it. The pulses are stronger at the bottom of that shaft than anywhere else.', fx: s => ({ pop: -1, mat: 10, stain: ['expend', 1], do: s2 => { learn(s2, T(s2), 15); if (T(s2).truth.sw === 'digging') T(s2).prog += 6; } }) } },
    { label: 'Tell the colony it is the reactor settling', dark: true, note: 'It is a lie, and it will hold until somebody else times the pulses.', info: [['yield', 'Nobody loses sleep over it']],
      out: { text: s => `It is announced at the evening meal as a known fault in the coolant loop. People stop holding their cups. ${Nc(s, 'geologist')} is told to keep the month of timings in a drawer, and does, and goes on timing.`, fx: s => ({ morale: 2, stain: ['cover_story', 1], do: s2 => { learn(s2, T(s2), 6); LF.emit(s2, 'suspicion', 'wk.pulse', 25, 260, 'the officers said the shivering was the reactor, and it was not'); const p = h.P(s2, 'geologist'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 10, 0, 100); } }) } },
  ] });
B(['stir', 'working'], { id: 'wk.door', tone: 'opportunity', title: 'The Way In',
  when: (s, t) => t.insight >= 20 && !t.entered,
  text: s => `There is a way into ${nm(s)}: a slot in the hillside a metre wide, with air moving out of it, warm and dry. A drone went forty metres down it and came back with pictures of a corridor, lit, and clean.\n\n[[engineer]] "The lights are on and the air's moving, so somebody's been paying the power bill in there a long while, and I'd like a word with them about where they get their spares."`,
  choices: [
    { label: 'Four people, roped, for six hours', test: { base: 50, mods: [R('engineer', 10), R('geologist', 5), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones go first')] },
      ok: { text: s => T(s).truth.job === 'stasis' ? 'They come out six hours later by their watches, with full cameras and their pockets full of fittings nobody can name. Outside it has been nine days, and the search party was being picked.' : 'They come out with full cameras and their pockets full of fittings nobody can name. The corridors go down a long way, and machinery is running in every one of them.', fx: s => ({ parts: 6, mat: 30, do: s2 => { T(s2).entered = s2.day; learn(s2, T(s2), 35); } }) },
      bad: { text: s => T(s).truth.job === 'stasis' ? 'Three come out after six hours that were nine days outside. The fourth went one stair deeper, and walks out forty days after that, unhurt, sure it has been gone for the afternoon.' : `Three come out on time. The fourth walks out an hour later from a different opening, unhurt, and cannot say where the hour went.`, fx: s => ({ do: s2 => { const t = T(s2); t.entered = s2.day; learn(s2, t, 18); const p = LF.cast(s2, { want: 'know' }); if (p) p.marks.touched = { d: s2.day, txt: `lost an hour inside ${t.name}` }; } }) } },
    { label: 'Drones only. Nobody goes in', cost: { parts: 2 }, note: 'They are the drones that watch the outer plots at night.', out: { text: 'Two drones are lost to map nine hundred metres of it. They were the two that flew the outer plots after dark, and in the month it takes to replace them a field hand working late is taken at the wire.', fx: s => ({ pop: -1, do: s2 => { T(s2).entered = s2.day; learn(s2, T(s2), 20); } }) } },
    { label: 'Two prisoners go in first, unroped', dark: true, note: 'They are promised their sentences. Nobody the colony needs is risked.', info: [['yield', 'The best look inside anyone will get'], ['danger', 'One of the two']],
      out: { text: s => `Two prisoners go down the slot with a camera and a promise about their sentences. One walks out with the camera, sits down against the hillside, and will not say where the other is. The footage is the best account of ${nm(s)} the colony has, up to the point where the second lamp stops moving.`,
        fx: s => ({ pop: -1, parts: 6, mat: 30, stain: ['expend', 1], do: s2 => { T(s2).entered = s2.day; learn(s2, T(s2), 40); } }) } },
  ] });
B(['stir', 'working', 'near'], { id: 'wk.job', chain: true, tone: 'crisis', title: 'What It Is For',
  when: (s, t) => !!t.known.job && !t.answered,
  text: s => { const t = T(s); return `${h.Nwc(s, 'engineer')} and ${h.Nw(s, 'xenobio')} have agreed on something, which is rare enough to be worrying. ${JOB[t.truth.job].is}.\n\nIt was doing this before the ship left Earth, and it is ${t.prog >= 60 ? 'most of the way there' : t.prog >= 35 ? 'perhaps halfway there' : 'not far along'}.`; },
  choices: [
    { label: 'Slow it. Cut what feeds it, wherever we can reach', cost: { parts: 5 }, test: { base: 50, mods: [R('engineer', 10), If(s => T(s).insight >= 60, 10, 'It is well understood')] },
      ok: { text: 'Conduits are cut, and stay cut. The pulse comes every hundred and forty minutes now instead of every ninety-one.', fx: s => ({ do: s2 => { const t = T(s2); t.answered = s2.day; t.slow = true; } }) },
      bad: { text: 'Conduits are cut. By morning something has joined them again, neatly, with a better weld than the colony can make. One of the cutting crew is found beside the join, dead, with no mark on the body.', fx: s => ({ pop: -1, do: s2 => { T(s2).answered = s2.day; LF.emit(s2, 'fear', 'wk.job', 30, 150, `${nm(s2)} repairs itself`); } }) } },
    { label: 'Draw power from it while it runs', dark: true, note: 'The extra load makes it run harder. The colony gets steady lights now and whatever the machine is making sooner.', info: [['yield', 'Power'], ['danger', 'It finishes sooner, for everyone']], out: { text: s => `A cable as thick as a wrist goes from the hillside to the reactor hall. The lights in the pods stop flickering for the first time since landfall.`, fx: s => ({ machine: { reactor: 18 }, morale: 2, stain: ['fed_it', 1], do: s2 => { const t = T(s2); t.answered = s2.day; t.tapped = true; LF.emit(s2, 'dependency', 'wk.tap', 45, 900, `the lights run off ${t.name}`); } }) } },
    { label: 'Put six prisoners inside it for a month, logging', dark: true, note: 'It keeps working while they watch. Nobody knows what a month in there does to a person.', info: [['yield', 'Everything that can be measured'], ['danger', 'The six']],
      out: { text: 'Six prisoners live in the outer corridors for a month with notebooks and a guard at the slot. Every part of it that can be measured is measured. Five come out. They cannot agree on how long they were inside, and one of them will not sleep under a roof again.', fx: s => ({ pop: -1, stain: ['expend', 2], do: s2 => { const t = T(s2); t.answered = s2.day; learn(s2, t, 34); t.prog = Math.min(99, t.prog + 3); } }) } },
  ] });
B(['working', 'near'], { id: 'wk.switch', x: true, tone: 'pressure', title: 'It Answers',
  when: (s, t) => !!t.known.sw && !t.off && t.truth.sw !== 'numbers' && SW[t.truth.sw].when(s) && !t.asked,
  setup: s => ({ why: `${nm(s)} runs faster ${SW[T(s).truth.sw].is}` }),
  text: (s, c) => `The traces leave no room for doubt. ${Nm(s)} runs faster ${SW[T(s).truth.sw].is}. The colony has been helping it along without knowing.\n\n[[engineer]] "We can stop feeding it, easy enough, and then we lose whatever it was built for, and I couldn't tell you which is worse, not on what I know."`,
  choices: [
    { label: s => SW[T(s).truth.sw].stop, out: { text: s => `It is done the same day. Within the month the pulse slackens, and so does the colony\'s own work. The crews who lose by it are told why, and three of them pack and walk out.`, fx: s => ({ morale: -3, leave: 3, do: s2 => { const t = T(s2), k = t.truth.sw; t.asked = s2.day; t.off = true;
      if (k === 'power') LF.emit(s2, 'blackout', 'wk.switch', 25, 300, SW[k].price); if (k === 'digging') s2.yieldBonus -= 0.03; if (k === 'noise') { s2.flags.radio_silent = true; LF.ease(s2, 'heard', 'wk.switch', 20, 400); } } }) } },
    { label: 'Carry on, and take the trace down off the wall', dark: true, note: 'The colony goes on feeding it and is not told that it is.', info: [['yield', 'The work goes on'], ['danger', 'It finishes sooner']],
      out: { text: s => `The trace comes down and the survey office door gets a lock. The work goes on as before. ${Nc(s, 'engineer')} keeps the chart at home now and marks it every night.`, fx: s => ({ morale: 1, stain: ['cover_story', 1], do: s2 => { T(s2).asked = s2.day; LF.emit(s2, 'suspicion', 'wk.switch', 25, 300, 'the survey office has a lock on it now'); } }) } },
  ] });
B(['working', 'near'], { id: 'wk.tenants', x: true, tone: 'pressure', title: 'Other Tenants',
  when: (s, t) => !t.tenants && s.factors.some(f => ['fauna', 'natives'].includes(f.kind) && f.stage >= 1 && !f.res && !f.dormant && f.id !== t.fid),
  setup: s => { const f = s.factors.find(f => f.kind === 'natives' && f.stage >= 1 && !f.res && !f.dormant) || s.factors.find(f => f.kind === 'fauna' && f.stage >= 1 && !f.res && !f.dormant);
    return { fid: f.id, what: f.name, What: f.Name, kind: f.kind, why: `${nm(s)} is running, and it is not quiet` }; },
  text: (s, c) => c.kind === 'natives' ? `${c.What} have moved their whole camp, in two days, to the far side of the valley from ${nm(s)}. Before they went they left a line of stones between it and the colony, and they stood and watched until somebody from the colony came out and looked at it.\n\n[[xenobio]] "That's a warning, and a kind one, I think, no, I'm sure, they stood there and waited until somebody came out and looked, who does that for strangers, they wanted us to understand!"`
    : `${c.What} will not go within a kilometre of ${nm(s)} since it began to run. They used to range over the whole valley. Now all of them are on this side of it, which is the colony's side.\n\n[[security]] "Same number of them as there ever were, all in one place now, and whose place is it? Ours, we're standing in it."`,
  choices: [
    { label: (s, c) => c.kind === 'natives' ? 'Ask them what they know of it' : 'Use the ground they will not cross', test: { base: 50, mods: [R('xenobio', 10), R('security', 5)] },
      ok: { text: (s, c) => c.kind === 'natives' ? 'It takes a week of drawing in the dirt. They have a word for the thing, and the word is also their word for a debt that has come due.' : 'The fields are moved inside the kilometre. Nothing with teeth has been seen in them since.', fx: (s, c) => ({ fops: [{ id: c.fid, accord: c.kind === 'natives' ? 12 : 0, threat: c.kind === 'natives' ? 0 : -15 }], do: s2 => { T(s2).tenants = s2.day; learn(s2, T(s2), c.kind === 'natives' ? 25 : 8); } }) },
      bad: { text: (s, c) => c.kind === 'natives' ? 'They will not speak of it, and are offended to be asked twice.' : 'The ground inside the kilometre is poor and the walk to it is long. The fields come back out in a month.', fx: (s, c) => ({ fops: [{ id: c.fid, accord: c.kind === 'natives' ? -8 : 0, threat: c.kind === 'natives' ? 0 : 6 }], do: s2 => { T(s2).tenants = s2.day; } }) } },
    { label: (s, c) => c.kind === 'natives' ? 'Make the stones our line, and fire on anything this side of it' : 'Keep the watch on the wire. Prisoners work the outer plots', dark: true, info: [['yield', 'Nobody of ours at risk'], ['danger', 'Whoever is out there']],
      out: { text: (s, c) => c.kind === 'natives' ? 'The watch is doubled, with orders about anything on the colony side of the stones. In the second week it is one of their young, come back across for something left behind. They take the body away in the night and the stones with it.' : 'The watch stays on the wire and the outer plots are worked by prisoners, unarmed. In the second week one of them is taken from the furthest row in daylight. The planting is finished on time.',
        fx: (s, c) => c.kind === 'natives' ? { stain: ['stone_line', 2], fops: [{ id: c.fid, threat: 10, accord: -30 }], do: s2 => { T(s2).tenants = s2.day; } } : { pop: -1, food: 40, stain: ['expend', 1], fops: [{ id: c.fid, threat: 4 }], do: s2 => { T(s2).tenants = s2.day; } } } },
    { label: (s, c) => c.kind === 'natives' ? 'Take one of them, and walk it up the hill on a rope' : 'Drive them onto the hill and watch what it does', dark: true, info: [['yield', 'What they know of it']],
      out: { text: (s, c) => c.kind === 'natives' ? `One of them is taken at the stone line and walked up the hill on a rope. There is a rock it will not pass for anything the watch does to it, and what it does at that rock tells ${N(s, 'xenobio')} more than a month of drawing in the dirt. It is let go afterwards. By morning its people have taken the stones and gone.`
          : `The watch drives forty of them up the slope with fire and noise. They go in a line, screaming, and at one particular rock every one of them turns and comes back through the fire. Eleven are shot. ${Nc(s, 'xenobio')} marks the rock on the map.`,
        fx: (s, c) => Object.assign({ fops: [c.kind === 'natives' ? { id: c.fid, accord: -45, threat: 12 } : { id: c.fid, threat: -18, harm: 15 }], do: s2 => { T(s2).tenants = s2.day; learn(s2, T(s2), c.kind === 'natives' ? 32 : 22); } }, c.kind === 'natives' ? { morale: -2, stain: ['dragged', 1] } : { parts: -2 }) } },
  ] });
B(['working', 'near'], { id: 'wk.heat', x: true, view: 'colony', tone: 'opportunity', title: 'Warm Ground',
  when: (s, t) => !t.moved && Math.max(LF.cv(s, 'cold'), LF.cv(s, 'blackout')) >= 40,
  setup: s => { const k = LF.cv(s, 'cold') >= LF.cv(s, 'blackout') ? 'cold' : 'blackout'; return { k, why: LF.because(s, k) }; },
  text: (s, c) => `The ground over ${nm(s)} is warm. There is a strip of it two hundred metres wide where a hand laid flat on the soil comes away warm, day and night.\n\n${cap(c.why)}, and people have started carrying their bedding up there without asking anybody.`,
  choices: [
    { label: 'Move the pods onto it', cost: { mat: 30 }, note: 'There is ground for half the pods. The other half are whoever is slowest to move.', out: { text: 'Half the colony sleeps warm over the machine now, and some of them say they sleep in time with it. The half left below are the ones who could not carry a pod frame uphill, and one of them does not last the cold.', fx: (s, c) => ({ morale: 2, pop: -1, do: s2 => { const t = T(s2); t.moved = s2.day; LF.ease(s2, 'cold', 'wk.heat', 35, 300); LF.ease(s2, 'confinement', 'wk.heat', 12, 300); LF.emit(s2, 'dependency', 'wk.heat', 35, 600, `half the colony sleeps on ground ${t.name} keeps warm`); if (t.truth.sw === 'numbers') t.prog += 6; } }) } },
    { label: 'A warming hall there, at a day\'s ration a night', dark: true, cost: { mat: 15 }, note: 'The stores gain from the cold. The ones with nothing to spare stay cold.', info: [['yield', 'Food'], ['danger', 'Whoever cannot pay']],
      out: { text: s => `One long shed, with ${h.Nw(s, 'quartermaster')} at the door and a tally. By midwinter most of the colony has bought a night there. The ones who had no ration to give stood outside the door some nights and were not let in.`, fx: (s, c) => ({ food: 110, morale: -3, stain: ['door_price', 1], do: s2 => { T(s2).moved = s2.day; LF.ease(s2, 'cold', 'wk.heat', 14, 300); LF.emit(s2, 'resentment', 'wk.heat', 30, 300, 'a warm night was sold at the door for a day of food'); } }) } },
    { label: 'Nobody sleeps on that ground', out: { text: 'The bedding is carried back down. The warm strip stays empty, and visible from every pod door. One of the oldest, who had been sleeping up there, is found dead in a bunk at the end of the month, under every blanket they owned.', fx: (s, c) => ({ morale: -3, pop: -1, do: s2 => { T(s2).moved = s2.day; } }) } },
  ] });
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
B(['working', 'near'], { id: 'wk.back', view: 'people', tone: 'pressure', title: 'The One Who Goes Back',
  when: (s, t) => !!t.entered && !t.goer && s.day - t.entered > 40,
  setup: s => TH.ctx(LF.cast(s, { want: 'know', mark: 'touched' })),
  text: (s, c) => T(s).truth.job === 'stasis' ? `${c.name} has been going into ${nm(s)} alone, a few hours at a time. For the colony it has been most of a season. For ${c.first} it has been about a week, and ${c.first}'s hair has not grown, and a cut on ${c.first}'s hand from before the first trip is still healing.\n\n[[${c.pid || 'x17'}]] "Right at the bottom there's a room where an hour's a year out here. Whatever it's keeping, it's in there. I want to go and look. Just once."`
    : `${c.name} has been going into ${nm(s)} alone, at night, for months. Nobody ordered it and nobody was told. The notebooks ${c.first} brings out are the best account of the place the colony has.\n\n[[${c.pid || 'x17'}]] "It's safe enough if you go slow. And it's big. Bigger than you'd think. I'd like to keep going."`,
  choices: [
    { label: (s, c) => `Let ${c.first} go on`, note: 'Whatever the place does to a person, it will do it to this one.', out: { text: (s, c) => `${c.first} goes on, and the notebooks get better. ${c.first} gets quieter, and harder to find at meal times.`, fx: (s, c) => ({ mark: [c.pid, 'touched', `goes in and out of ${nm(s)} as if it were home`], do: s2 => { const t = T(s2); t.goer = c.pid; learn(s2, t, 28); if (t.truth.job === 'stasis') t.stayed = s2.day; } }) } },
    { label: 'Forbid it', out: { text: (s, c) => `${c.first} hands over the notebooks without a word, and the lamp, and the rope. The last notebook stops in the middle of a sentence.`, fx: (s, c) => ({ do: s2 => { T(s2).goer = c.pid; const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 12, 0, 100); p.sore = { d: s2.day, t: 'The One Who Goes Back' }; } learn(s2, T(s2), 10); } }) } },
    { label: (s, c) => `Send ${c.first} to the bottom, on a line, with a recorder`, dark: true, note: 'Nobody who knows the place as well would go if asked, so it is given as an order.', info: [['yield', 'Everything at the bottom of it'], ['danger', 'The one who goes']],
      out: { text: (s, c) => `${c.name} is given a recorder, a lamp and four hundred metres of line, and told how far down. The line pays out for most of a day and then stops. When it is hauled in the recorder is tied to the end of it, full, above a clean cut. What is on it answers nearly every question the colony had about ${nm(s)}.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: `sent to the bottom of ${nm(s)} on a line` }], morale: -3, stain: ['sent_down', 2], do: s2 => { const t = T(s2); t.goer = c.pid; learn(s2, t, 55); } }) } },
  ] });
B('near', { id: 'wk.near', chain: true, tone: 'crisis', title: 'Nearly Done',
  text: s => { const t = T(s); return `The pulse comes every forty minutes. ${t.known.job ? JOB[t.truth.job].is + ', and it is nearly finished' : `Nobody can say what ${nm(s)} is about to finish, only that it is about to`}.${t.truth.job === 'stasis' ? (t.known.job ? ' The edge of the slow ground is two hundred metres from the nearest field. A stake hammered in at the edge of it is still ringing from the hammer a month later.' : ' A survey stake hammered in on the hillside a month ago is still ringing from the hammer.') : ''}\n\n[[engineer]] "I'd give it weeks, not months, and not many weeks at that, so whatever we're doing about it, or not doing, it's now."`; },
  choices: [
    { label: 'Break it', cost: { parts: 6 }, test: { base: 40, mods: [R('engineer', 10), R('security', 5), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker'), If(s => T(s).insight >= 60, 15, 'You know where to cut'), If(s => T(s).slow, 10, 'It is already slowed')] },
      ok: { text: s => `Charges, in the six places the notebooks marked. The hill settles a metre and the cups stop shivering. For the rest of the month people still pause with their cups halfway to their mouths.`, fx: s => ({ do: s2 => finish(s2, T(s2), 'stopped', `The colony broke ${nm(s2)} before it could finish.`) }) },
      bad: { text: 'The charges go off. The pulse misses twice and comes back faster. Three of the party did not get clear.', fx: s => ({ pop: -3, do: s2 => { T(s2).prog = Math.min(99, T(s2).prog + 8); } }) } },
    { label: 'Seal it in, with the roofs off the far row', dark: true, cost: { mat: 30 }, note: 'The plate yard has not enough. The far row is where the old and the unassigned sleep.', info: [['yield', 'It stops getting stronger'], ['danger', 'The far row']],
      out: { text: 'It takes a month, what was in the plate yard, and the roof and floor plate of eleven pods. The pulse can still be felt through a boot sole, if you stand still, but it has stopped getting stronger. The people from the far row sleep in the mess hall, and two of them are dead of the cold before new plate is cut.', fx: s => ({ pop: -2, stain: ['roofs', 1], do: s2 => { s2.seeds.push({ id: 'works:sealed', k: 'thread', d: s2.day, txt: `${nm(s2)} was sealed, not stopped` }); finish(s2, T(s2), 'sealed', `The colony sealed ${nm(s2)} under concrete.`); } }) } },
    { label: 'Take the controls', show: s => T(s).insight >= 55, test: { base: 40, mods: [R('engineer', 10), R('teacher', 5), If(s => T(s).tapped, 10, 'The colony already draws on it'), If(s => !!T(s).goer, 10, 'Somebody knows the way')] },
      ok: { text: s => `It takes nine days inside. When they come out the pulse has stopped, and the lights in the colony are steadier than they have ever been. It does what it is told now, most of the time.`, fx: s => ({ machine: { reactor: 25 }, yield: 0.04, do: s2 => { LF.emit(s2, 'dependency', 'th.works', 50, 900, `the colony runs on ${nm(s2)}`); finish(s2, T(s2), 'harnessed', `The colony took control of ${nm(s2)}.`); } }) },
      bad: { text: 'Nine days inside, and it still will not take orders. When the party comes out, the pulse is coming a little faster than before.', fx: s => ({ morale: -2, do: s2 => { T(s2).prog = Math.min(99, T(s2).prog + 5); } }) } },
    // Three on screen at most: "Take the controls" (insight 55 or more) takes the place of this one, which shows only below that (opposite `show`).
    { label: 'Let it finish, and bar the gate until it has', dark: true, show: s => T(s).insight < 55, note: 'Left to choose, a good many would walk out before it ends. The colony cannot spare them.', info: [['yield', 'Nobody leaves'], ['danger', 'Everyone is here for it']],
      out: { text: 'Nothing is done to the machine. The watch is put on the gate, facing inward. Nine people with packs are turned back in the first night, and their names are taken.', fx: s => ({ morale: -5, stain: ['gate', 1], do: s2 => { T(s2).prog = Math.max(T(s2).prog, 92); } }) } },
  ] });
B('after', { id: 'wk.done', chain: true, tone: 'pressure', title: 'What It Left',
  text: s => { const t = T(s), e = t.end; return e === 'stopped' ? `${Nm(s)} is quiet. It is still there, all of it, kilometres of it, under the hill, and nobody has decided what to do with a dead machine that size.`
    : e === 'sealed' ? `The cap over ${nm(s)} has a crack in it already, a hand long, and warm air coming out. ${h.Nwc(s, 'engineer')} says a cap like that needs somebody to walk it every week for as long as there is a colony.`
    : e === 'harnessed' ? `${Nm(s)} does what the colony asks, and the colony has begun to ask a great deal of it. ${h.Nwc(s, 'teacher')} wants it written down who may give it an instruction, before somebody gives it a bad one.`
    : `${JOB[t.truth.job].end}\n\nNothing the colony has can reverse it, so you have to decide how to live with it.`; },
  choices: [
    { label: 'Make it somebody\'s whole job', note: 'Four people who will never work a field again.', out: { text: s => `A crew of four, a hut on the hill, a log that is read every week. It is dull work and it is done properly, by four people whose plots somebody else now has to dig.`, fx: s => ({ morale: 2, food: -60, do: s2 => { LF.ease(s2, 'fear', 'wk.done', 20, 400); LF.ease(s2, 'unexplained', 'wk.done', 25, 400); } }) } },
    { label: 'Teach it to the children as it happened, orders and all', note: 'Every officer who gave an order about it will be in the lesson by name.', out: { text: s => `${h.Nwc(s, 'teacher')} writes it up plainly, with the parts nobody understood left in as parts nobody understood, and who decided what. The officers hear their own names read out in the lessons.`, fx: s => ({ morale: 1, do: s2 => { LF.emit(s2, 'hope', 'wk.done', 30, 400, 'the colony met something very old and is still here'); for (const p of s2.people) if (p.alive && p.role && p.loyal !== undefined) p.loyal = clamp(p.loyal - 5, 0, 100); } }) } },
    { label: 'Burn the maps, and keep it out of the school', dark: true, note: 'The children grow up without it. They also grow up not knowing which side of the valley to keep off.', info: [['yield', 'Morale'], ['danger', 'The ones who are never told']],
      out: { text: 'The maps and the notebooks go into the kiln, and the word is dropped from the lessons. The children born since grow up calling it the hill, and play on it.', fx: s => ({ morale: 3, stain: ['rewritten', 1], do: s2 => { LF.emit(s2, 'unexplained', 'wk.done', 25, 500, 'nobody is allowed to say what is under the hill'); } }) } },
  ] });
LF.TAGS['wk.pulse'] = ['cautious', 'bold', 'cautious'];
LF.TAGS['wk.door'] = ['bold open', 'cautious', 'severe order'];
LF.TAGS['wk.job'] = ['cautious order', 'bold open', 'cautious'];
LF.TAGS['wk.switch'] = ['cautious', 'bold order'];
LF.TAGS['wk.tenants'] = ['open', 'closed cautious', 'severe closed'];
LF.TAGS['wk.heat'] = ['bold open', 'mercy', 'closed cautious'];
LF.TAGS['wk.back'] = ['free bold', 'order', 'severe order'];
LF.TAGS['wk.near'] = ['bold severe', 'closed cautious', 'bold open', 'open'];
LF.TAGS['wk.done'] = ['order', 'open', 'closed'];
})();

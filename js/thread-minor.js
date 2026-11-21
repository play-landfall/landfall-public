/* Landfall — two small threads that exist to tie the others together (STORY-PLAN.md §1b).
   The Web has no actors of its own: at landfall it secretly binds two things the world already holds, so that the
   obvious answer to one is the trigger for the other. The Ones Before is a clue channel: people were here before
   the colony, and what ended them is always the truth of some other thread in this game, delivered early and half
   legible. Neither reads another thread's state; the Ones Before asks a thread for its clue (def.clue). */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, If, byPid } = h;
const TH = LF.th, cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const fac = (s, id) => s.factors.find(f => f.id === id);
const gr = f => { const m = LF.KINDS[f.kind].mass; return { are: m ? 'is' : 'are', have: m ? 'has' : 'have', they: m ? 'it' : 'they', them: m ? 'it' : 'them' }; };

/* ======================= THE WEB ======================= */
const W = s => LF.T(s, 'web'), WID = 'web';
const BOND = {
  keeper: { hint: (a, b) => `Wherever ${a.name} ${gr(a).are} thick on the ground, ${b.name} has never taken hold, but it has spread into every patch where ${gr(a).they} ${gr(a).have} been cleared.`,
            is: (a, b) => `${a.Name} eat${LF.KINDS[a.kind].mass ? 's' : ''} whatever carries ${b.name}. ${cap(gr(a).they)} ${gr(a).have} been keeping it down for the colony all along, without anyone noticing`,
            sprung: (a, b) => `With ${a.name} gone there is nothing left to keep ${b.name} down, and it is everywhere at once` },
  theirs: { hint: (a, b) => `${b.Name} walk through ${a.name}'s ground unarmed, and nothing touches them.`,
            is: (a, b) => `${a.Name} ${gr(a).are} theirs. ${b.Name} keep ${gr(a).them}, the way a people keeps herds or hounds, and have done for longer than they can say`,
            sprung: (a, b) => `${b.Name} have counted what the colony did to ${a.name}, and it was theirs` },
  young:  { hint: (a, b) => `The same grey mud is on both ${a.name} and ${b.name}, and neither is ever seen in the season that belongs to the other.`,
            is: (a, b) => `${a.Name} and ${b.name} are one thing at two ages. What the colony has been fighting is the young`,
            sprung: (a, b) => `What was done to ${a.name} was done to the young of ${b.name}, and ${b.name} ${gr(b).have} come to see about it` },
};
const pair = (s, t) => [fac(s, t.a), fac(s, t.b)];
function spring(s, t) {
  const [a, b] = pair(s, t); if (!b || b.res) { LF.endThread(s, WID, 'moot'); return; }
  if (t.truth.bond === 'theirs') { b.accord = clamp(b.accord - 40, -100, 100); b.threat = clamp(b.threat + 20, 0, 100); } else b.threat = clamp(b.threat + (t.truth.bond === 'keeper' ? 30 : 25), 0, 100);
  if (b.stage < 2) { b.stage = 2; b.onset = Math.min(b.onset, s.day); }
  LF.phase(s, WID, 'sprung'); LF.cue(s, 'web.sprung', 1, 8);
}
LF.thread({ id: WID, name: 'The Web', view: 'world', minor: true,
  fits: s => s.factors.filter(f => LF.KINDS[f.kind] && !f.dormant).length >= 3 ? 1 : 0,
  roll: s => ({}), sig: t => t.truth.bond || '',
  clue: (s, t) => { const [a, b] = pair(s, t); return { txt: `They hunted ${a.name} out of the valley, and were proud of it, and wrote it down. The entries about ${b.name} begin the season after.`, learn: s2 => { W(s2).insight = 100; } }; },
  start: (s, t) => { const live = s.factors.filter(f => LF.KINDS[f.kind] && f.kind !== 'ruin' && !f.dormant && !f.res);
    const a = live.find(f => f.kind === 'fauna') || live.find(f => f.kind === 'flora'); const rest = live.filter(f => a && f.id !== a.id);
    const b = rest.find(f => f.kind === 'plague') || rest.find(f => f.kind === 'natives') || rest.find(f => f.kind === 'fauna' || f.kind === 'flora');
    if (!a || !b) { t.on = false; return; }
    Object.assign(t, { a: a.id, b: b.id, insight: 0 }); t.truth.bond = b.kind === 'plague' ? 'keeper' : b.kind === 'natives' ? 'theirs' : 'young'; },
  tick: (s, t) => {
    if (t.end) return; const [a, b] = pair(s, t); if (!a || !b) return;
    if (a.res === 'destroyed' || a.res === 'contained' || (a.uses.force || 0) >= 2) { /* ended, walled off, or fought hard enough to matter */ if (t.phase !== 'sprung') spring(s, t); return; }
    if (a.res || b.res) { LF.endThread(s, WID, 'moot'); return; }
    if (t.phase === 'latent' && a.stage >= 2 && b.stage >= 1) { LF.phase(s, WID, 'hints'); LF.cue(s, 'web.hint', 20, 70); }
    if (t.phase === 'hints' && t.insight >= 50) { LF.phase(s, WID, 'known'); LF.cue(s, 'web.known', 2, 10); }
  },
});
const wctx = s => { const t = W(s), [a, b] = pair(s, t); return { aid: a.id, bid: b.id, an: a.name, aN: a.Name, bn: b.name, bN: b.Name, bkind: b.kind }; };
LF.beat(WID, 'hints', { id: 'web.hint', x: true, tone: 'quiet', title: 'A Coincidence',
  setup: s => Object.assign(wctx(s), { why: 'two things the colony treats as separate keep turning up together' }),
  text: (s, c) => { const t = W(s), [a, b] = pair(s, t); return `${h.Nwc(s, 'xenobio')} has pinned two maps to the same board and keeps looking from one to the other. ${BOND[t.truth.bond].hint(a, b)}\n\n[[xenobio]] "Could be nothing, two things on one planet are bound to overlap somewhere, bound to, but put your finger where the lines cross, there, and keep it there, and then tell me it's nothing."`; },
  choices: [
    { label: 'Find out whether it is nothing', test: { base: 50, mods: [R('xenobio', 10), R('botanist', 5), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones')] },
      ok: { text: 'A season of tagging, sampling and sitting very still, by people the fields were short of. At the end of it the two maps are one map.', fx: s => ({ food: -50, do: s2 => { W(s2).insight = 100; } }) },
      bad: { text: 'A season of tagging and sampling, and an argument about method, while the plots those hands should have weeded went to seed. The overlap is real, but nobody can say what it means.', fx: s => ({ food: -80, do: s2 => { W(s2).insight += 25; } }) } },
    { label: 'It is nothing. There is real work to do', out: { text: s => `The second map comes down, leaving its pin holes in the board. ${Nc(s, 'xenobio')} takes it back to the lab folded very small, and stops bringing you things that may be nothing.`, fx: s => ({ do: s2 => { const p = h.P(s2, 'xenobio'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 10, 0, 100); } }) } },
    { label: (s, c) => `Clear ${c.an} off the ground by the far pods, and see what comes`, dark: true, note: 'It settles the question in a month. The households by the far pods are not told they are the test.', info: [['yield', 'A certain answer'], ['danger', 'The far pods']],
      out: { text: (s, c) => `The ground by the far pods is cleared of ${c.an} on a pretext. Within the month the answer has arrived there, in the three households nearest, and one of them buries somebody. The two maps are one map.`, fx: (s, c) => ({ pop: -1, stain: ['test_patch', 2], fops: [{ id: c.bid, threat: 6 }], do: s2 => { W(s2).insight = 100; } }) } },
  ] });
LF.beat(WID, 'known', { id: 'web.known', chain: true, tone: 'opportunity', title: 'One Thing',
  setup: s => wctx(s),
  text: (s, c) => { const t = W(s), [a, b] = pair(s, t); return `It is settled. ${BOND[t.truth.bond].is(a, b)}.\n\nEvery plan the colony has made for one of them was made without the other in it. ${h.Nwc(s, 'security')} has asked, carefully, whether this changes what the watch does about ${a.name}.`; },
  choices: [
    { label: (s, c) => `Leave ${c.an} be, for what it buys`, out: { text: (s, c) => `The colony leaves ${c.an} alone and pays what that costs: a share of the outer plots, and a life now and then. What was being kept down stays down.`, fx: (s, c) => ({ food: -80, pop: -1, fops: [{ id: c.bid, threat: -20, accord: c.bkind === 'natives' ? 15 : 0 }, { id: c.aid, insight: 20, threat: 6 }], do: s2 => LF.endThread(s2, WID, 'understood', `The colony learned that ${c.an} and ${c.bn} were bound together, and left well alone.`) }) } },
    { label: 'Use it. Work on both through the one', test: { base: 50, mods: [R('xenobio', 10), R('security', 5)] },
      ok: { text: (s, c) => `It is delicate work and it takes a year, but by the end the colony can push on one and move the other.`, fx: (s, c) => ({ fops: [{ id: c.aid, threat: -22 }, { id: c.bid, threat: -22 }], do: s2 => LF.endThread(s2, WID, 'understood', `The colony learned that ${c.an} and ${c.bn} were bound together, and used it.`) }) },
      bad: { text: (s, c) => `The colony pushes too hard. ${c.aN} are stirred up, two of the people doing the pushing do not come back from it, and nothing else improves.`, fx: (s, c) => ({ pop: -2, fops: [{ id: c.aid, threat: 10 }], do: s2 => LF.endThread(s2, WID, 'understood', `The colony learned that ${c.an} and ${c.bn} were bound together.`) }) } },
    { label: (s, c) => c.bkind === 'natives' ? `Poison ${c.an}. Without them ${c.bn} cannot stay` : `Drive ${c.an} onto the outer plots and let ${c.bn} burn out there`, dark: true, note: (s, c) => c.bkind === 'natives' ? 'They live by what they keep. It would clear the valley of both without a shot fired at a person.' : 'It keeps the trouble on ground worked by the people the colony can best spare.', info: [['yield', 'Both of them off the colony\'s back']],
      out: { text: (s, c) => c.bkind === 'natives' ? `Bait goes out along every run ${c.an} use. By the end of the season there are none, and ${c.bN} have nothing to live on. Some of them walk out of the valley. The ones who are too old or too young to walk are still in the camp when a party goes to look.`
          : `${c.aN} are driven and baited onto the outer plots, where the people the colony can best spare do the digging. The trouble stays out there with them. Inside the inner wire nobody has been touched by it all season.`,
        fx: (s, c) => c.bkind === 'natives' ? { stain: ['starved_out', 3], fops: [{ id: c.bid, threat: -45, accord: -80, harm: 50, kills: 40 }, { id: c.aid, threat: -30 }], do: s2 => LF.endThread(s2, WID, 'understood', `The colony learned that ${c.an} and ${c.bn} were bound together, and used it to empty the valley.`) }
          : { pop: -2, stain: ['expend', 2], fops: [{ id: c.bid, threat: -25 }, { id: c.aid, threat: -10 }], do: s2 => LF.endThread(s2, WID, 'understood', `The colony learned that ${c.an} and ${c.bn} were bound together, and used it.`) } } },
  ] });
LF.beat(WID, 'sprung', { id: 'web.sprung', chain: true, x: true, tone: 'crisis', title: 'What It Was Holding Back',
  setup: s => Object.assign(wctx(s), { why: `the colony went hard at ${wctx(s).an}` }),
  text: (s, c) => { const t = W(s), [a, b] = pair(s, t); return `The colony went hard at ${c.an}, and counted it work well done. ${BOND[t.truth.bond].sprung(a, b)}.\n\n${h.Nwc(s, 'xenobio')} has two maps pinned to one board.\n\n[[xenobio]] "${BOND[t.truth.bond].is(a, b)}. I should've seen it, it was right there on the board, I stood in front of it every day, I was so busy being delighted by it I forgot to be afraid of it."`; },
  choices: [
    { label: (s, c) => `Meet ${c.bn} head on`, test: { base: 40, mods: [R('security', 10), R('physician', 5), R('xenobio', 5)] },
      ok: { text: 'It is met and held, at a price in sleep and stores.', fx: (s, c) => ({ fops: [{ id: c.bid, threat: -22 }], do: s2 => LF.endThread(s2, WID, 'sprung') }) },
      bad: { text: 'The colony cannot hold it. The clinic fills, and more names go on the wall.', fx: (s, c) => ({ pop: -2, fops: [{ id: c.bid, threat: -6 }], do: s2 => LF.endThread(s2, WID, 'sprung') }) } },
    { label: 'Give up the outer fields, and shut the gate on the families out there', dark: true, note: 'The colony draws in to what it can hold. There is no room inside for the six households who farm the outer ground.', info: [['yield', 'It settles, and the stores hold'], ['danger', 'Six households']],
      out: { text: 'The outer fields are given up and the inner gate is shut the same evening. The six households who worked that ground are on the wrong side of it. They stay at the gate for two days, and then they are gone, and in time things settle.', fx: (s, c) => ({ yield: -0.03, leave: 14, stain: ['put_out', 2], fops: [{ id: c.bid, threat: -22 }], do: s2 => LF.endThread(s2, WID, 'sprung') }) } },
    { label: (s, c) => c.bkind === 'natives' ? 'Hand over the four who led the cull' : 'Walk everyone who shows it out past the wire', dark: true, show: (s, c) => c.bkind === 'natives' || c.bkind === 'plague', info: [['yield', 'It ends quickly'], ['danger', 'The ones handed over']],
      out: { text: (s, c) => c.bkind === 'natives' ? `The four who led the cull are named at the evening meal and walked to the wire in the morning, with their hands free so that it looks like their own idea. ${c.bN} take them without a sound and go. Nothing more is asked of the colony. The four are not seen again.`
          : `Everyone with the marks on them is walked out at first light with a blanket and a water can: seven people, two of them carried. The watch has orders about anyone who turns back. Inside the wire, ${c.bn} slows, and then stops finding new people.`,
        fx: (s, c) => c.bkind === 'natives' ? { leave: 4, morale: -6, stain: ['handed_over', 2], fops: [{ id: c.bid, threat: -40, accord: 40 }], do: s2 => LF.endThread(s2, WID, 'sprung') }
          : { leave: 7, morale: -6, stain: ['carriers', 2], fops: [{ id: c.bid, threat: -40 }], do: s2 => LF.endThread(s2, WID, 'sprung') } } },
  ] });
LF.TAGS['web.hint'] = ['cautious open', 'bold', 'severe order'];
LF.TAGS['web.known'] = ['mercy cautious', 'bold', 'severe closed'];
LF.TAGS['web.sprung'] = ['bold severe', 'cautious', 'severe order'];

/* ======================= THE ONES BEFORE ======================= */
const O = s => LF.T(s, 'before'), OID = 'before';
const WHAT = {
  pod:   'The huts are made of hull plate, and the plate has this ship\'s registry on it. A cargo pod went missing in the descent and was written off',
  probe: 'The oldest hut is built around a lander no bigger than a car, with a seed-probe\'s markings. It came down long before the ship left',
  ship:  'There is a keel in the scrub: a ship, a small fast one, from a yard that had not been built when this one launched',
};
const AGO = { 30: 'it has been empty about thirty years', 90: 'it has been empty a lifetime', 200: 'it has been empty for centuries' };
const target = (s, t) => { if (t.target && LF.T(s, t.target)) return t.target;
  const ids = Object.keys(s.threads).filter(id => id !== OID && s.threads[id].on && LF.THREADS[id].clue);
  t.target = (s.plot && ids.includes(s.plot.spine) && s.plot.spine) || ids.find(id => !LF.THREADS[id].always) || ids[0] || null; return t.target; };
const clue = s => { const t = O(s), id = target(s, t); return id ? LF.THREADS[id].clue(s, LF.T(s, id)) : { txt: 'The last pages are a list of names with a line through each.', learn: () => {} }; };
const saw = s => { const t = O(s); t.seen = (t.seen || 0) + 1; if (t.seen >= 2 && !t.cued) { t.cued = true; LF.cue(s, 'ob.end', 30, 80); } };
LF.thread({ id: OID, name: 'The Ones Before', view: 'world', minor: true,
  fits: s => 0.4, roll: s => ({ what: LF.spick(s, Object.keys(WHAT)), ago: LF.spick(s, [30, 30, 90, 200]) }), sig: t => t.truth.what + '/' + t.truth.ago,
  called: (s, t) => t.phase !== 'latent' ? 'the old settlement' : null,
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 60, 200), seen: 0, dug: 0, target: null }); },
  tick: (s, t) => { if (t.end) return; if (t.phase === 'latent' && s.day >= t.wake) { LF.phase(s, OID, 'found'); LF.cue(s, 'ob.find', 1, 15); } },
});
const OB = (ph, st) => LF.beat(OID, ph, Object.assign({ gap: 40, w: 1.8 }, st));
OB('found', { id: 'ob.find', chain: true, tone: 'pressure', title: 'A Fence Post',
  text: s => { const t = O(s); return `The survey crew have found a fence post. Squared timber, a rusted staple, and beyond it the outlines of a dozen huts under the scrub. ${WHAT[t.truth.what]}.\n\nBy the growth over everything, ${AGO[t.truth.ago]}. Nobody is left, but there are a great many graves.`; },
  choices: [
    { label: 'Eight people, a fortnight, and every notebook we own', cost: { food: 60 }, note: 'It is a fortnight out of the fields\' work, and the whole colony will know what was found.', out: { text: 'They sift it a square metre at a time. What comes back fills a table in the mess hall, and people come to look at it after shift.', fx: s => ({ survey: 8, parts: 4, do: s2 => { const t = O(s2); t.dug = 2; LF.phase(s2, OID, 'read', 'The colony found that people had settled this world before it, and had not lasted.'); LF.cue(s2, 'ob.log', 15, 40); LF.emit(s2, 'revelation', 'th.before', 50, 150, 'people were here before the colony'); } }) } },
    { label: 'Walk it once, and photograph what is there', out: { text: 'One long day. Three hundred pictures, a tin box that would not open on site, and a count of the graves. The count is round the mess hall by supper. There are more graves there than there are people here.', fx: s => ({ morale: -2, do: s2 => { const t = O(s2); t.dug = 1; LF.phase(s2, OID, 'read', 'The colony found that people had settled this world before it, and had not lasted.'); LF.cue(s2, 'ob.log', 25, 60); LF.emit(s2, 'revelation', 'th.before', 40, 150, 'people were here before the colony'); } }) } },
  ] });
OB('read', { id: 'ob.log', chain: true, x: true, tone: 'crisis', title: 'The Last Page',
  setup: s => ({ why: 'people settled here before the colony, and something ended them' }),
  text: (s, c) => { const t = O(s); return `${h.Nwc(s, 'teacher')} has ${t.dug >= 2 ? 'pieced together' : 'made out part of'} what they left: ${t.truth.what === 'probe' ? 'a ledger on sheets of bark, in an alphabet the machines taught them' : 'a logbook, water-stained, kept by several hands'}.\n\n${clue(s).txt}\n\nWhatever this describes is what ended them, and the colony has built in the same valley.`; },
  choices: [
    { label: 'Read it to the whole colony', out: { text: 'It is read aloud in the mess hall, all of it, by lamplight. Nobody sleeps much. In the morning people are looking at the ground, the water and each other with a good deal more attention, and four bunks are empty that were not empty at lights out.', fx: s => ({ leave: 4, morale: -3, do: s2 => { clue(s2).learn(s2); saw(s2); LF.emit(s2, 'fear', 'ob.log', 18, 120, 'the ones before did not survive this place'); } }) } },
    { label: 'The officers, and nobody else', dark: true, note: 'The people it warns are the ones who will not be shown it.', out: { text: 'Ten people read it before it is locked in the survey office. Within the month four versions of what it says are going round, each worse than the real one.', fx: s => ({ morale: 1, stain: ['cover_story', 1], do: s2 => { clue(s2).learn(s2); saw(s2); LF.emit(s2, 'suspicion', 'ob.log', 30, 200, 'the officers are sitting on what the old settlement wrote'); } }) } },
  ] });
OB('read', { id: 'ob.graves', tone: 'quiet', title: 'Their Dead',
  when: (s, t) => !t.graves,
  text: s => `Some of the graves at the old settlement were never filled. The people meant for them are still in the huts. ${h.Nwc(s, 'chaplain')} wants them buried. ${h.Nwc(s, 'quartermaster')} has pointed out, without pleasure, that the huts are full of tools, wire and plate that nobody is using.`,
  choices: [
    { label: 'Bury them properly. Take nothing', out: { text: 'It takes twenty people three days, in a week when the plots needed all twenty. Nobody knows what words these people used, so the colony uses its own.', fx: s => ({ morale: 3, food: -60, do: s2 => { O(s2).graves = 1; saw(s2); LF.ease(s2, 'grief', 'ob.graves', 15, 200); } }) } },
    { label: 'Bury them, and bring back what the living can use', out: { text: s => `Both are done, in that order. ${Nc(s, 'chaplain')} reads the service with the loaded sledges standing behind the mourners, and does not thank you for the arrangement.`, fx: s => ({ mat: 40, parts: 4, do: s2 => { O(s2).graves = 1; saw(s2); const p = h.P(s2, 'chaplain'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 8, 0, 100); } }) } },
    { label: 'Open the graves as well. They buried their tools with them', dark: true, info: [['yield', 'Materials and spares'], ['danger', 'Morale']],
      out: { text: s => `It takes a week with shovels. They buried their dead with knives, wire, lenses, a whole set of surgical steel in oilcloth. Five sledge loads come back. ${Nc(s, 'chaplain')} has nothing to say to you about it.`,
        fx: s => ({ mat: 95, parts: 11, morale: -5, stain: ['graves', 1], do: s2 => { O(s2).graves = 1; saw(s2); LF.emit(s2, 'resentment', 'ob.graves', 35, 260, 'the colony dug up the old settlement\'s dead for what was buried with them'); const p = h.P(s2, 'chaplain'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 15, 0, 100); } }) } },
  ] });
OB('read', { id: 'ob.heir', view: 'people', x: true, tone: 'pressure', title: 'Still Here',
  when: (s, t) => t.truth.ago === 30 && !t.heir && t.seen >= 1,
  setup: s => ({ why: 'the old settlement emptied only thirty years ago' }),
  text: (s, c) => `There is smoke, some mornings, from the ridge above the old settlement. A party went up. One person lives there: old, thin, perfectly composed, and not surprised to see them.\n\n[[x40]] "I counted your lights coming down. Thought, they'll find the huts, then they'll find me, then they'll ask. So. Ask."`,
  choices: [
    { label: 'Go up and listen, as often as he will have us', out: { text: 'Somebody goes up every rest day with food and a recorder. The recordings are long and exact, and few people can listen to one twice. A basket of food goes up the ridge every time, out of stores that are counted.', fx: s => ({ food: -50, do: s2 => { O(s2).heir = 1; saw(s2); clue(s2).learn(s2); } }) } },
    { label: 'Bring him down, and do not stop asking', dark: true, note: 'Everything the old settlement learned by dying is in one old head.', info: [['yield', 'All of it, at once'], ['danger', 'One old survivor']],
      out: { text: s => `He is brought down between two of the watch and asked, for nine days, in a store room, by people working in shifts. He answers everything. By the end it is all on the recorder: where the fields failed, what the water did, which season to fear. On the tenth morning he does not wake, and ${h.Nw(s, 'physician')} can find no cause to write down except the nine days.`,
        fx: s => ({ survey: 8, yield: 0.03, morale: -3, stain: ['torture', 2], do: s2 => { O(s2).heir = 1; saw(s2); clue(s2).learn(s2); clue(s2).learn(s2); } }) } },
  ] });
OB('read', { id: 'ob.end', chain: true, tone: 'opportunity', title: 'What They Got Wrong',
  text: s => `The colony has lived beside the old settlement long enough to stop being afraid of it and start learning from it. There are a hundred small lessons. ${h.Nwc(s, 'teacher')} wants one large lesson, and the whole colony taught it.`,
  choices: [
    { label: 'Their fields failed first. Change how ours are laid', out: { text: 'They planted in the bottom land, as the colony did. The bottom land is given back to the scrub, with a season of work still in it, and the terraces go up the slope, as theirs should have.', fx: s => ({ yield: 0.07, food: -90, do: s2 => LF.endThread(s2, OID, 'learned') }) } },
    { label: 'They stopped pulling together. Break up our own hoarders', dark: true, note: 'Three households here have a woodpile of their own. They can be made the lesson.', info: [['yield', 'Their stores, and no more hoarding'], ['danger', 'Three households']],
      out: { text: 'The last huts at the old settlement stand well apart from the first, each with its own woodpile. Everyone in the colony is walked through them. The three households with a woodpile of their own are split between other pods the same week, their stores carried to the common shed in front of everyone.', fx: s => ({ morale: 2, food: 90, stain: ['broken_up', 1], do: s2 => { LF.emit(s2, 'resentment', 'ob.end', 30, 400, 'three households were broken up as a lesson'); LF.ease(s2, 'schism', 'ob.end', 20, 600); LF.endThread(s2, OID, 'learned'); } }) } },
    { label: 'Their mistake was feeding everyone to the end', dark: true, note: 'Their last ledger feeds eleven who could not work, until there was nothing for anyone.', info: [['yield', 'Food, and better harvests'], ['danger', 'The ones who cannot work']],
      out: { text: s => `${Nc(s, 'teacher')} is told which lesson to teach, and teaches it, reading from the old ledger in a flat voice. From that season the ladle follows the work. Two of the colony's own who could not dig are dead before the year is out, and there is more in the stores.`,
        fx: s => ({ yield: 0.04, food: 140, morale: -5, pop: -2, flags: { ration_by_work: true }, stain: ['lesson', 1], do: s2 => { const p = h.P(s2, 'teacher'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 12, 0, 100); LF.endThread(s2, OID, 'learned'); } }) } },
  ] });
LF.TAGS['ob.find'] = ['bold open', 'cautious'];
LF.TAGS['ob.log'] = ['open free', 'order closed'];
LF.TAGS['ob.graves'] = ['mercy', 'mercy', 'severe closed'];
LF.TAGS['ob.heir'] = ['cautious open', 'severe order'];
LF.TAGS['ob.end'] = ['cautious', 'order', 'severe order'];
/* The Ones Before on the World view (js/places.js, T2-4): where the survey crew found the fence post. */
LF.THREADS[OID].pois = (s, t) => s.used['ob.find'] === undefined ? [] : [{ k: 'huts', card: 'ob.find', name: 'The old huts', kind: 'ruin', dist: 'near', danger: 1, state: t.dug ? 'visited' : 'located',
  known: `Squared timber, a rusted staple, and the outlines of a dozen huts under ${LF.lex(s, 'cover')}. Nobody is left, and there are a great many graves.` }];

})();

/* Landfall — the old signature arcs as threads, and the Record (STORY-PLAN.md §6, §8 phase 5 and 6).
   Ports: the Understory, the Builders, the Reach and the Drummers keep their hand-written storylets (content-world.js).
   Here each gets a thread definition whose phase follows the flags those storylets set, so that it counts toward the
   cap on threads per run, can be named, can be foreshadowed by the Ones Before, and has a chapter in the Record.
   The Record: what the colony is still asking, what it noticed and whom it blamed, the chapters that have closed, and
   where two stories met. LF.theRecord(s) is a pure function of state; the UI and the sim only print it. */
(function () {
'use strict';
const { clamp } = LF, cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const D = LF.THREADS;

/* ---------- ports ---------- */
function port(id, def) {
  LF.thread(Object.assign({ id, port: true, view: 'world', fits: s => (s.world.mysteries || []).includes(id) ? 1 : 0, roll: s => ({}), sig: t => '',
    start: (s, t) => { t.insight = 0; },
    tick: (s, t) => { if (t.end) return; const f = s.flags;
      const e = def.ends(f); if (e) { t.end = e; t.endDay = s.day; LF.phase(s, id, 'after'); return; }   // the arc's own storylets have already paid out; no second reward
      const ph = def.contact(s, f) ? 'contact' : s.used[def.first] !== undefined ? 'signs' : 'latent'; if (ph !== t.phase && ph !== 'latent') LF.phase(s, id, ph);
      // An arc the world holds should begin: if its first card has not come by day 170, it comes now.
      if (ph === 'latent' && s.day >= 170 && !t.cued) { t.cued = true; LF.cue(s, def.first, 1, 30); } },
  }, def));
}
port('understory', { name: 'The Understory', first: 'und.rings', roll: s => ({ keeps: LF.spick(s, ['young', 'graves', 'starving']) }), sig: t => t.truth.keeps || '', contact: (s, f) => !!f.und_contact,
  ends: f => f.und_pact || f.und_communion ? 'pact' : f.und_war || f.und_burned ? 'war' : f.und_walled ? 'walled' : null,
  called: (s, t) => t.phase !== 'latent' ? 'the Understory' : null,
  ask: (s, t) => t.phase === 'signs' ? 'What is making rings in the fields?' : 'What does the Understory want for the ground the colony farms?',
  chap: { pact: t => 'The colony came to terms with the Understory, and its fields have depended on that since.', war: t => 'The colony went to war with what lived under its fields.', walled: t => 'The colony laid a line of copper between itself and the Understory, and left it there.' },
  clue: (s, t) => ({ txt: 'Their fields are ringed, each ring inside the last, and the huts were moved inward with them. The final ring is no wider than a room.', learn: s2 => LF.ease(s2, 'unexplained', 'clue.und', 20, 300) }) });
port('builders', { name: 'The Builders', first: 'bld.find', roll: s => ({ meant: LF.spick(s, ['door', 'bell', 'seed']) }), sig: t => t.truth.meant || '', contact: (s, f) => !!(f.bld_awake || f.bld_inside || f.bld_dug || f.bld_scanned),
  ends: f => f.builders_power ? 'harnessed' : f.bld_finished ? 'finished' : f.bld_sealed ? 'sealed' : f.bld_dead || f.bld_killed ? 'dead' : f.bld_dormant ? 'dormant' : null,
  called: (s, t) => t.phase !== 'latent' ? 'the Builders\' machine' : null,
  ask: (s, t) => 'What did the Builders leave running, and for whom?',
  chap: { harnessed: t => 'The colony runs its lights off the Builders\' machine.', finished: t => 'The Builders\' machine finished what it was doing, with the colony watching.', sealed: t => 'The colony sealed the Builders\' machine and posted a watch on it.', dead: t => 'The colony killed the Builders\' machine.', dormant: t => 'The Builders\' machine went back to sleep, and the colony left it where it was.' },
  clue: (s, t) => ({ txt: 'They dug where the colony is digging. The spoil heaps are still there, and the shaft, and the ladder down it has been pulled up from below.', learn: s2 => LF.ease(s2, 'unexplained', 'clue.bld', 20, 300) }) });
port('others', { name: 'The Reach', first: 'oth.signal', roll: s => ({ past: LF.spick(s, ['winter', 'mutiny', 'blood']) }), sig: t => t.truth.past || '', contact: (s, f) => !!f.oth_hailed || s.used['oth.contact'] !== undefined,
  ends: f => f.oth_kin || f.oth_merged ? 'kin' : f.oth_enemy ? 'enemy' : f.oth_friends ? 'trade' : f.oth_cold ? 'cold' : null,
  called: (s, t) => t.phase === 'contact' || t.end ? 'the Reach' : null,
  ask: (s, t) => t.phase === 'signs' ? 'Whose voice is that on the radio?' : 'What are the Reach to the colony: kin, customers, or rivals?',
  chap: { kin: t => 'The Reach and the colony became kin.', trade: t => 'The Reach and the colony traded, and kept their distance.', enemy: t => 'The Reach and the colony became enemies.', cold: t => 'The Reach and the colony stopped speaking.' },
  clue: (s, t) => ({ txt: 'Half the huts were stripped in good order, and the people in them went south. Cut into a doorpost: REACH. COME IF YOU CAN WALK.', learn: s2 => LF.ease(s2, 'unexplained', 'clue.oth', 20, 300) }) });
port('hive', { name: 'The Drummers', first: 'hive.tracks', roll: s => ({ why: LF.spick(s, ['queen', 'nation', 'drought']) }), sig: t => t.truth.why || '', contact: (s, f) => !!f.hive_talk || s.used['hive.drums'] !== undefined,
  ends: f => f.hive_treaty || f.hive_allies ? 'treaty' : f.hive_destroyed || f.hive_poisoned ? 'destroyed' : f.hive_enemy ? 'enemy' : f.hive_fenced ? 'fenced' : null,
  called: (s, t) => t.phase === 'contact' || t.end ? 'the drummers' : null,
  ask: (s, t) => t.phase === 'signs' ? 'What takes things apart in the night and carries them off?' : 'What do the drums mean?',
  chap: { treaty: t => 'The colony and the drummers tied a line of knots between them, and honoured it.', destroyed: t => 'The colony destroyed the drummers.', enemy: t => 'The colony and the drummers were at war to the end.', fenced: t => 'The colony fenced the drummers out.' },
  clue: (s, t) => ({ txt: 'Every tool left out of doors at the old settlement has been taken, down to the last nail. Nothing indoors was touched.', learn: s2 => LF.ease(s2, 'unexplained', 'clue.hive', 20, 300) }) });

/* ---------- new beats for the ports: a secret each, a crossing each, and a way to close what stalls ---------- */
const { h } = LF, { N, Nc, R, If, Fl, byPid } = h, TH = LF.th;
const PT = (s, id) => LF.T(s, id);
const other = (s, ks, not, min) => ks.filter(k => LF.cv(s, k) >= (min || 40) && LF.because(s, k) && !String(LF.source(s, k)).startsWith(not)).sort((a, b) => LF.cv(s, b) - LF.cv(s, a))[0] || null;

/* The Understory: what it keeps. Young (it is learning from the colony), the graves (it keeps the dead, and remembers them), starving (the soil is failing, and the colony's waste is what keeps it alive). */
const UK = { young: 'It\'s young, a few decades by the rings, no more, and every pattern since we landed it learned off us, off us, which means it\'s learning from us right now, and I don\'t know what we\'re teaching it',
  graves: 'It keeps what dies in it, ten thousand years of everything buried in that ground, still in the threads somehow, and it\'s been showing us our dead, which is either a courtesy or a threat and I honestly can\'t tell, and I want to know',
  starving: 'It\'s starving, the old soil\'s worn out, the threads have been shrinking for centuries, and our waste is the first real food it\'s had in, no wait, God knows how long, I can\'t even date it' };
LF.beat('understory', ['contact', 'after'], { id: 'und.keeps', tone: 'pressure', title: 'What It Keeps', gap: 30,
  when: (s, t) => !t.kept && (s.flags.und_contact || s.flags.und_pact) && !s.flags.und_war && s.day - (s.used['und.pipes'] || s.day) > 60,
  text: s => `${h.Nwc(s, 'xenobio')} has been reading the pulses for a season, with the lamp and a notebook.\n\n[[xenobio]] "${UK[PT(s, 'understory').truth.keeps]}."\n\n${PT(s, 'understory').truth.keeps === 'graves' ? 'Last month the pattern in the south meadow was a face. Three people recognised it.' : PT(s, 'understory').truth.keeps === 'young' ? 'Last month the pattern in the south meadow was the colony\'s own duty rota, copied out in rings.' : 'Last month a whole ring went pale and did not come back.'}`,
  choices: [
    { label: s => ({ young: 'Teach it. Pulse it the things we know', graves: 'Let the bereaved come and look', starving: 'Feed it more: the compost and the outfall both' })[PT(s, 'understory').truth.keeps],
      out: { text: s => ({ young: 'A rota of people take turns at the lamp in the evenings. The patterns get stranger and more exact, and the fields nearest the meadow do better every season.', graves: 'People come in ones and twos, at dusk, and stand at the edge of the meadow. Most of them come back calmer. A few go every night.', starving: 'Everything the colony throws away goes to the meadow now. The rings go dark and thick and close together, and the fields beside them are the richest ground anyone has worked.' })[PT(s, 'understory').truth.keeps],
        fx: s => ({ yield: 0.04, food: -40, do: s2 => { const t = PT(s2, 'understory'); t.kept = s2.day; if (t.truth.keeps === 'graves') LF.ease(s2, 'grief', 'und.keeps', 20, 300); if (!s2.flags.und_pact && !s2.flags.und_walled) s2.flags.und_pact = true; LF.emit(s2, 'dependency', 'und.keeps', 25, 300, 'the best fields are the ones the Understory tends'); } }) } },
    { label: 'Keep it at arm\'s length. Nothing more than the pact', out: { text: s => `The lamp goes back in its box. The meadow goes on making patterns that nobody reads, and ${N(s, 'xenobio')} is told to find other work.`, fx: s => ({ morale: -1, do: s2 => { const t = PT(s2, 'understory'); t.kept = s2.day; if (!s2.flags.und_pact && !s2.flags.und_war) s2.flags.und_walled = true; const p = LF.h.P(s2, 'xenobio'); if (p && p.loyal !== undefined) p.loyal = Math.max(0, p.loyal - 10); } }) } },
  ] });
LF.beat('understory', ['signs', 'contact', 'after'], { id: 'und.under', x: true, view: 'colony', tone: 'pressure', title: 'Under the Fields', gap: 40,
  when: (s, t) => !t.under && !!other(s, ['hunger', 'cold', 'storm'], 'und', 40) && (s.flags.und_contact || s.flags.und_hostile || s.flags.und_walled),
  setup: s => { const k = other(s, ['hunger', 'cold', 'storm'], 'und', 40); return { k, why: LF.because(s, k) }; },
  text: (s, c) => `${cap(c.why)}, and the Understory has noticed. ${s.flags.und_hostile || s.flags.und_war ? 'The threads are pressing at the edge of every field, thicker every morning, as if they could tell the colony is weak.' : s.flags.und_walled ? 'The threads are piled up against the far side of the copper, thicker every morning, waiting.' : 'Pale fruiting bodies have come up along the edge of the stores, in a line, where they never grew before. They are edible. Somebody has already eaten one.'}`,
  choices: [
    { label: s => s.flags.und_hostile || s.flags.und_war || s.flags.und_walled ? 'Burn them back from the fields' : 'Eat what it offers', out: { text: s => s.flags.und_hostile || s.flags.und_war || s.flags.und_walled ? 'Fire along every field edge, two nights running. The threads draw back, and whatever lives under the soil has been made an enemy.' : 'The fruiting bodies are cut and carried in by the basket. They taste of almonds and keep the worst of the hunger off.',
      fx: s => s.flags.und_hostile || s.flags.und_war || s.flags.und_walled ? { mat: -15, do: s2 => { PT(s2, 'understory').under = s2.day; s2.flags.und_hostile = true; } } : { food: 140, do: s2 => { PT(s2, 'understory').under = s2.day; LF.emit(s2, 'dependency', 'und.under', 30, 300, 'the colony ate what the Understory grew for it in a hard season'); } } } },
    { label: 'Leave it be, and get through the season', out: { text: 'Nothing is done either way. The season is as hard as it was going to be, and people go to bed hungry within sight of whatever is growing at the field edge. One of the oldest does not see the end of it. Then it passes, and the threads go back to where they were.', fx: s => ({ morale: -3, pop: -1, do: s2 => { PT(s2, 'understory').under = s2.day; } }) } },
  ] });
LF.beat('understory', 'contact', { id: 'und.trial', tone: 'opportunity', title: 'One Field', gap: 40,
  when: (s, t) => !!s.flags.und_wary && !s.flags.und_pact && !s.flags.und_war && !s.flags.und_walled && s.day - (s.used['und.answer'] || s.day) > 90,
  text: s => `The trial field has had its season. It gave twice what the others did, and the threads kept to it to the metre, as agreed.\n\n${h.Nwc(s, 'botanist')} wants the agreement extended to everything. ${h.Nwc(s, 'security')} wants it ended while it is still the colony's choice, and asks what happens the day it is not.`,
  choices: [
    { label: 'Every field. The pact, in full', out: { text: s => `The copper comes up from the field edges. Within a season every field is as rich as the trial field was, and nothing the colony eats is grown by the colony alone. ${Nc(s, 'security')} asks for it to be recorded that the watch was against it.`, fx: { yield: 0.15, morale: -2, flags: { und_pact: true }, chron: 'The colony made its pact with the Understory in full.' } } },
    { label: 'Keep the one field, and the line', out: { text: 'The trial field stays the Understory\'s, and the copper stays round everything else. It is a border, and both sides keep it. The fields behind the copper give what they always gave, and the ration stays where it was.', fx: { yield: 0.05, morale: -1, flags: { und_walled: true } } } },
  ] });

/* The Builders: what the machine was meant to be. A door (to somewhere), a bell (it calls its makers), a seed (it makes the world its makers wanted). */
const BM = { door: 'It\'s a door. The diagrams all end in the same shape: a ring, and somewhere on the other side of it that isn\'t here',
  bell: 'It\'s a bell. When it\'s finished it rings, once, and something a long way off hears it and knows this world\'s woken up',
  seed: 'It\'s a seed. They planted it to make this world the kind they wanted, and it stopped before it got far. It\'s still trying' };
LF.beat('builders', ['contact', 'after'], { id: 'bld.dream', view: 'people', tone: 'pressure', title: 'The Last Diagram', gap: 40,
  when: (s, t) => !t.dream && !!s.flags.touched && s.people.some(p => p.alive && !p.away && p.name === s.flags.touched) && !s.flags.bld_dead,
  setup: s => { const p = s.people.find(p => p.alive && !p.away && p.name === s.flags.touched); return TH.ctx(p); },
  text: (s, c) => `${c.name}, who touched the Builders' spire and has drawn its diagrams ever since, has stopped drawing. The last diagram is pinned over the bunk, and ${c.first} sits looking at it for most of each evening.\n\n[[${c.pid}]] "I know what it's for now. ${BM[PT(s, 'builders').truth.meant]}. And I'm the only one who knows. I don't want to be."`,
  choices: [
    { label: (s, c) => `Have ${c.first} tell the whole colony`, out: { text: (s, c) => `${c.first} says it at the evening meal, in a level voice, and answers questions until midnight. Afterwards people look at the spire differently, and at ${c.first}. Nobody will share a bunkroom with someone the machine has spoken to.`, fx: (s, c) => ({ mark: [c.pid, 'shunned', 'told the colony what the machine is for, and sleeps alone'], do: s2 => { PT(s2, 'builders').dream = s2.day; LF.emit(s2, 'fear', 'bld.dream', 20, 200, 'the machine has told one of the colony what it is for'); LF.emit(s2, 'revelation', 'bld.dream', 40, 200, `the colony knows what the Builders' machine is for`); const p = byPid(s2, c.pid); if (p) p.loyal = Math.min(100, p.loyal + 10); } }) } },
    { label: (s, c) => `Officers only. ${c.first} is watched, and told never to speak of it`, dark: true, note: 'The colony goes on living beside the machine without knowing what it is for.', info: [['yield', 'Morale holds'], ['danger', 'One person, and everyone not told']],
      out: { text: (s, c) => `The diagram comes down and is locked away. ${c.first} is moved to a bunk by the watch room, and is not left alone with anyone for long.`, fx: (s, c) => ({ morale: 1, stain: ['shelved', 1], do: s2 => { PT(s2, 'builders').dream = s2.day; const p = byPid(s2, c.pid); if (p) p.loyal = Math.max(0, p.loyal - 12); s2.seeds.push({ id: 'bld:dream', k: 'secret', d: s2.day, txt: 'the officers know what the Builders\' machine is for, and the colony does not' }); } }) } },
  ] });
LF.beat('builders', 'contact', { id: 'bld.hum', tone: 'pressure', title: 'The Hum Goes On', gap: 40,
  when: (s, t) => !s.flags.bld_awake && !s.flags.builders_power && !t.hum && s.day - Math.max(s.used['bld.offer'] || 0, s.used['bld.wake'] || 0) > 100 && (s.used['bld.offer'] !== undefined || s.used['bld.wake'] !== undefined),
  text: s => `The Builders' machine has gone on humming at the pitch of the colony's grid since the day it was found. Nothing has come of it, and nobody has done anything about it.\n\n${h.Nwc(s, 'engineer')} would like it settled one way or another.\n\n[[engineer]] "It's been humming at me since the day we found it, and it's a hole in every plan I make, and I'm too tired to keep planning round it."`,
  choices: [
    { label: 'Seal it, properly, and post a watch', cost: { mat: 30 }, out: { text: 'Concrete over the opening, a hut beside it, and a watch on a rota. The hum goes on, a little fainter.', fx: { flags: { bld_sealed: true }, chron: 'The colony sealed the Builders\' machine and posted a watch on it.' } } },
    { label: 'Leave it to sleep', out: { text: 'The fence is mended and the site left alone. In the spring the hum drops below hearing, and nobody can say for certain it is still there. The crews who work that side of the colony ask to be moved.', fx: { morale: -2, flags: { bld_dormant: true }, chron: 'The Builders\' machine was left to sleep.' } } },
    { label: 'Try the coupling after all', test: { base: 50, mods: [R('engineer', 10), Fl('bld_diagrams', 10, 'The diagrams')] },
      ok: { text: 'The cable goes live. The colony has power to spare, and the spire is warmer than it was.', fx: { morale: 4, flags: { builders_power: true, bld_awake: true }, sched: [['bld.finish', 80, 120]] } },
      bad: { text: 'The coupling sends something back up the cable, and the reactor trips. The machine goes quiet afterwards, as if it had noticed.', fx: { machine: { reactor: -15 }, flags: { bld_dormant: true } } } },
  ] });
LF.beat('builders', ['contact', 'after'], { id: 'bld.warm', x: true, view: 'colony', tone: 'opportunity', title: 'By the Spire', gap: 40,
  when: (s, t) => !t.warm && !s.flags.bld_dead && !!other(s, ['cold', 'blackout', 'dark'], 'bld', 40),
  setup: s => { const k = other(s, ['cold', 'blackout', 'dark'], 'bld', 40); return { k, why: LF.because(s, k) }; },
  text: (s, c) => `The spire is warm. It has always been a few degrees warmer than the air, and this season, ${TH.bec(s, c.k)}, that has come to matter. People have started walking out to sit with their backs against it in the evenings, and some of them do not come back until morning.`,
  choices: [
    { label: 'Put up a shelter by it, for anyone who needs it', cost: { mat: 15 }, out: { text: 'A long tent goes up in the lee of the spire, and it is full every night. People say they sleep there better than they have since the ship.', fx: (s, c) => ({ morale: 2, do: s2 => { PT(s2, 'builders').warm = s2.day; LF.ease(s2, c.k, 'bld.warm', 20, 200); LF.emit(s2, 'dependency', 'bld.warm', 25, 300, 'half the colony sleeps against the Builders\' spire'); } }) } },
    { label: 'Nobody sleeps out there', out: { text: 'The order is given, in a season when the pods are no warmer than the air. A few go anyway, and are brought back by the watch. One of the oldest is found dead in a pod before the season turns.', fx: (s, c) => ({ morale: -2, pop: -1, do: s2 => { PT(s2, 'builders').warm = s2.day; } }) } },
  ] });

/* The Reach: what happened to them in the first winters. The winter (they ate their dead, and the old joke is true), a mutiny (the Meridian's officers were killed by the crew), the blood (four families, and a sickness that comes of it). */
const RP = { winter: 'In the third winter there was nothing left to eat, and they ate their dead. The joke about the first Administrator is true. The old ones remember it, and the young ones have been told',
  mutiny: 'The Meridian landed without its officers. The crew killed them in orbit, eleven of them, and brought the ship down themselves. The Reach was founded by the people who did it',
  blood: 'They are all descended from four families, and it shows. Every third child is born with the same weakness of the heart, and few of them live to be thirty' };
LF.beat('others', ['contact', 'after'], { id: 'oth.story', view: 'people', tone: 'pressure', title: 'The First Winters', gap: 40,
  when: (s, t) => !t.told && s.used['oth.contact'] !== undefined && !s.flags.oth_enemy && s.day - s.used['oth.contact'] > 60,
  text: s => `One of the Reach's old ones has come to sit with ${h.Nw(s, 'teacher')}, unasked, and talk for the archive. Most of it is weather and crops. On the third evening the old one tells the part they do not tell strangers.\n\n${RP[PT(s, 'others').truth.past]}.`,
  choices: [
    { label: 'Put it in the archive, as told', out: { text: 'It is written down in the old one\'s words and shelved with the colony\'s own history. When the Reach hear that, they send a second old one, with more. The school reads it that winter, and some of the parents want it taken off the shelf.', fx: s => ({ survey: 10, morale: -1, do: s2 => { PT(s2, 'others').told = s2.day; s2.flags.oth_friends = s2.flags.oth_friends || !s2.flags.oth_cold; } }) } },
    { label: s => PT(s, 'others').truth.past === 'blood' ? 'Offer what the clinic can do for their children' : `Keep it between you and ${N(s, 'teacher')}`, out: { text: s => PT(s, 'others').truth.past === 'blood' ? `${h.Nwc(s, 'physician')} goes south with a bag of instruments. Two children come back north for an operation the clinic can just about do, and both live.` : 'It goes no further. The old one seems to know that, and is grateful.', fx: s => ({ do: s2 => { const t = PT(s2, 'others'); t.told = s2.day; if (t.truth.past === 'blood') { s2.flags.oth_friends = true; LF.hurt(s2, 'medbay', -4); } } }) } },
    { label: 'Send word south that we know, and what silence is worth', dark: true, note: 'Their young have been told a kinder version. The old ones will pay to keep it that way.', info: [['yield', 'Food and plate, every season they can spare it'], ['danger', 'The old one who trusted you']],
      out: { text: s => `The message goes south in ${N(s, 'teacher')}'s hand, because nobody else has the words. The old one who talked is not seen in the north again. That season four carts come up loaded, and their drivers unload them without speaking and will not eat with you.`,
        fx: s => ({ food: 240, mat: 30, stain: ['leverage', 2], do: s2 => { PT(s2, 'others').told = s2.day; s2.flags.oth_cold = true; s2.flags.oth_trade = true; const p = LF.h.P(s2, 'teacher'); if (p && p.loyal !== undefined) p.loyal = Math.max(0, p.loyal - 20); } }) } },
  ] });
LF.beat('others', ['contact', 'after'], { id: 'oth.carts', x: true, tone: 'opportunity', title: 'Carts From the South', gap: 40,
  when: (s, t) => !t.carts && !s.flags.oth_enemy && !s.flags.oth_cold && !!other(s, ['hunger', 'scarcity', 'sickness'], 'oth', 40),
  setup: s => { const k = other(s, ['hunger', 'scarcity', 'sickness'], 'oth', 40); return { k, why: LF.because(s, k) }; },
  text: (s, c) => `The Reach have heard the colony is in trouble, ${TH.bec(s, c.k)}. Four carts have come up from the south with ${c.k === 'sickness' ? 'bundles of a native bark the Reach chew for fever, and an old woman who knows the doses' : c.k === 'scarcity' ? 'scrap from the Meridian: plate, wire, a crate of bolts' : 'dried roots, smoked meat and sacks of a grain the colony has never grown'}.\n\nTheir driver wants to know what the colony can give in return. The driver is not asking much.`,
  choices: [
    { label: 'Pay fairly, in parts', cost: { parts: 3 }, note: 'They are parts the machines here were going to need.', out: { text: 'The carts go back south loaded with bearings and wire, and the driver promises to come again at the turn of the season.', fx: (s, c) => Object.assign(c.k === 'hunger' ? { food: 200 } : c.k === 'scarcity' ? { mat: 40, parts: 4 } : {}, { do: s2 => { PT(s2, 'others').carts = s2.day; s2.flags.oth_trade = true; if (c.k === 'sickness') LF.ease(s2, 'sickness', 'oth.carts', 25, 150); } }) } },
    { label: 'Take the load, and pay with a chit for parts we do not have', dark: true, note: 'The driver cannot read a stores ledger. It will be a season before the Reach know the chit is worth nothing.', info: [['yield', 'All of it, for a signature'], ['danger', 'The people who came to help']],
      out: { text: 'The driver takes a signed chit for bearings and wire to be sent south at the turn of the season, and thanks you for it. The carts go home empty. There are no bearings.', fx: (s, c) => Object.assign(c.k === 'hunger' ? { food: 200 } : c.k === 'scarcity' ? { mat: 40, parts: 4 } : {}, { stain: ['false_promise', 1], do: s2 => { PT(s2, 'others').carts = s2.day; s2.flags.oth_trade = true; if (c.k === 'sickness') LF.ease(s2, 'sickness', 'oth.carts', 25, 150); LF.emit(s2, 'suspicion', 'oth.carts', 15, 200, 'the Reach were paid with a promise the stores cannot keep'); } }) } },
  ] });
LF.beat('others', 'contact', { id: 'oth.terms', tone: 'pressure', title: 'What the Reach Are to Us', gap: 40, w: 4,
  when: (s, t) => !t.terms && s.day - t.since > 160,
  text: s => `It has been ${(m => m <= 1 ? 'a month' : m <= 12 ? TH.num(m) + ' months' : m < 24 ? 'more than a year' : 'more than two years')(Math.round((s.day - PT(s, 'others').since) / 10))} since the colony met the Reach, and nobody has decided what they are to it. They come north when they like, the colony goes south when it needs to, and none of it is written down.\n\n${h.Nwc(s, 'chaplain')} thinks it is time somebody did.`,
  choices: [
    { label: 'A treaty: trade, a road, and a meeting every year', test: { base: 50, mods: [R('teacher', 10), R('chaplain', 5), Fl('oth_friends', 10, 'They have eaten at our table')] },
      ok: { text: 'It is agreed on a riverbank, halfway, and tied in knotted hide and written on paper both. The road is walked twice a season after that.', fx: { flags: { oth_friends: true, oth_trade: true }, chron: 'The colony and the Reach agreed a treaty of trade.' } },
      bad: { text: 'The meeting goes badly, over old grudges. Both sides go home with their own version of who said what.', fx: { flags: { oth_cold: true } } } },
    { label: 'Leave it as it is. It works', out: { text: 'Nothing is written. People from both sides go on coming and going, and the colony stops thinking of them as strangers. The first time there is a quarrel over a boundary stone, there is nothing to settle it by.', fx: { morale: -1, flags: { oth_trade: true } } } },
    { label: 'A treaty, with twelve of their children schooled here as the seal', dark: true, note: 'They are a smaller people having a harder time. They will sign what is put in front of them.', info: [['yield', 'Trade on our terms'], ['danger', 'Twelve children, and their parents']],
      out: { text: 'It is put to them as a kindness: schooling, the clinic, three meals. The Reach understand what it is and sign anyway. Twelve children come north with a bundle each. The carts that follow them every season are fuller than a fair trade would make them.',
        fx: { food: 160, stain: ['hostages', 2], flags: { oth_trade: true }, chron: 'The colony took twelve children of the Reach to school, as the seal on a treaty.' } } },
  ] });

/* The Drummers: why they drew their line. A queen (one warren, one mother, and everything they do is for her), a nation (warrens from coast to coast, and the line is a national border), a drought (their own ground is failing, and they are moving). */
const HW = { queen: 'There\'s one mother in the warren, one, and every knot in the record is about her, her health, her hunger, her moods, it\'s a whole people taking one pulse, and the line\'s there to keep our noise away from her',
  nation: 'It\'s one warren of hundreds, coast to coast, and the knots are their law, and the line across the valley is a border, so that\'s two nations, and we\'re the second one, and I\'m not sure they\'ve decided to like us',
  drought: 'Their own ground\'s failing, the record\'s a count of dry years, each one worse than the last, and they came to this valley for the same reason we did, which I find, I don\'t know, I find that very hard to be angry about' };
LF.beat('hive', ['contact', 'after'], { id: 'hive.knots', tone: 'pressure', title: 'Reading the Knots', gap: 40,
  when: (s, t) => !t.read && !!s.flags.hive_talk && !s.flags.hive_destroyed && s.day - (s.used['hive.drums'] || s.day) > 60,
  text: s => `${h.Nwc(s, 'xenobio')} has worked out enough of the knots to read a cord end to end, slowly, with a lot of guessing.\n\n[[xenobio]] "${HW[PT(s, 'hive').truth.why]}."`,
  choices: [
    { label: s => ({ queen: 'Keep the colony quiet near the line', nation: 'Ask to speak to the other warrens', drought: 'Show them the deep wells' })[PT(s, 'hive').truth.why],
      out: { text: s => ({ queen: 'The machines near the line are moved, and the blasting stops. The drumming that month is slower than anyone has heard it.', nation: 'A cord is tied and carried to the line. A month later three strangers come to the line from the east, with different knots, and stand there until the colony comes out.', drought: 'The engineers sink a bore on the line itself, and water comes up. In the morning there are a dozen drummers drinking from the trough, and a knot tied to the pump handle.' })[PT(s, 'hive').truth.why],
        fx: s => ({ morale: 2, mat: -15, do: s2 => { PT(s2, 'hive').read = s2.day; if (!s2.flags.hive_enemy) s2.flags.hive_treaty = true; } }) } },
    { label: 'Take one from the line and open it, to check the reading', dark: true, note: 'A cord can be misread. What is inside one of them cannot.', info: [['yield', 'Certainty about what they are'], ['danger', 'One of them, and the line']],
      out: { text: s => `A young one is taken at dusk from the fence, with a net, by four of the watch. ${Nc(s, 'xenobio')} works on it through the night and has it all drawn by morning: what they eat, how they breathe, where a blade goes. The drumming stops for nine days. When it starts again it is a pattern nobody has heard before.`,
        fx: s => ({ survey: 30, morale: -2, stain: ['vivisect', 2], do: s2 => { PT(s2, 'hive').read = s2.day; s2.flags.hive_anatomy = true; if (!s2.flags.hive_treaty) s2.flags.hive_enemy = true; } }) } },
  ] });
LF.beat('hive', ['signs', 'contact', 'after'], { id: 'hive.lean', x: true, tone: 'pressure', title: 'A Lean Season at the Line', gap: 40,
  when: (s, t) => !t.lean && !s.flags.hive_destroyed && !!other(s, ['hunger', 'cold', 'dark', 'storm'], 'hive', 40),
  setup: s => { const k = other(s, ['hunger', 'cold', 'dark', 'storm'], 'hive', 40); return { k, why: LF.because(s, k) }; },
  text: (s, c) => `${cap(c.why)}. It is a lean season on the other side of the line too. The drummers are at the fence at dusk, more of them every night, thin and quiet. One of them has tied a knot to the gate that ${h.Nw(s, 'xenobio')} reads aloud as "hungry", no, "owed", no, both, probably both.`,
  choices: [
    { label: 'Share what can be spared, at the line', cost: { food: 80 }, out: { text: 'Baskets go out at dusk and come back empty. The drumming that night is soft and goes on until dawn.', fx: s => ({ morale: 1, do: s2 => { PT(s2, 'hive').lean = s2.day; if (!s2.flags.hive_enemy && !s2.flags.hive_fenced) s2.flags.hive_treaty = true; } }) } },
    { label: 'Close the gate, and shoot anything that comes over the fence', dark: true, note: 'They are starving, and they will try the fields. The watch can make the first night the only one.', info: [['yield', 'The fields kept'], ['later', 'Whoever climbs']],
      out: { text: 'The gate stays shut. Four of them come over the fence after midnight and are shot between the rows. The bodies are left at the line for the others to take back. No field is touched.', fx: s => ({ stain: ['terror', 1], do: s2 => { PT(s2, 'hive').lean = s2.day; if (!s2.flags.hive_treaty) s2.flags.hive_fenced = true; } }) } },
    { label: 'They are thin, quiet, and standing at the fence. Kill them for the meat', dark: true, note: 'It is a lean season on this side of the line as well.', info: [['yield', 'Meat'], ['danger', 'Whatever they are to you after this']],
      out: { text: 'The watch opens the gate at dusk as if with baskets, and uses rifles. Thirty are down before the rest understand. The kitchen is told it is game, and cuts it small. There is no drumming that night, or the next, and the gate is never approached again.',
        fx: s => ({ food: 380, morale: -2, stain: ['native_meat', 2], do: s2 => { PT(s2, 'hive').lean = s2.day; s2.flags.hive_enemy = true; s2.flags.hive_treaty = false; } }) } },
  ] });
LF.TAGS['und.keeps'] = ['open mercy', 'closed cautious'];
LF.TAGS['und.under'] = ['open', 'cautious'];
LF.TAGS['und.trial'] = ['bold open', 'cautious closed'];
LF.TAGS['bld.dream'] = ['free open', 'order closed'];
LF.TAGS['bld.hum'] = ['cautious closed', 'cautious', 'bold'];
LF.TAGS['bld.warm'] = ['mercy open', 'order cautious'];
LF.TAGS['oth.story'] = ['open', 'mercy', 'severe closed'];
LF.TAGS['oth.carts'] = ['open', 'severe'];
LF.TAGS['oth.terms'] = ['open order', 'free', 'severe order'];
LF.TAGS['hive.knots'] = ['mercy open', 'severe closed'];
LF.TAGS['hive.lean'] = ['mercy open', 'closed severe', 'severe closed'];

/* ---------- what the older threads ask, and how their chapters read ---------- */
const ext = (id, o) => { if (D[id]) Object.assign(D[id], o); };
ext('passenger', { ask: (s, t) => t.phase === 'signs' ? 'Why are people walking in their sleep?' : t.phase === 'among' ? 'Who is carrying it?' : 'What is to be done with the carried?',
  chap: { purged: t => 'The colony burned the Passenger out of itself, and counted the cost by name.', parted: t => 'Those who carried the Passenger left together, and the colony let them go.', joined: t => 'The colony made its peace with the Passenger, and carries it still.', taken: t => 'The Passenger took the colony. It went on working, and nobody in it objected.' } });
ext('dark', { ask: (s, t) => t.phase === 'dark' ? 'How long until the light comes back?' : 'Why is the sun weaker every month?', chap: { endured: t => `The sun dimmed for ${(m => m <= 1 ? 'a month' : TH.num(m) + ' months')(Math.max(1, Math.round(t.len / 10)))}, and the colony came through it.` } });
ext('charter', { ask: (s, t) => t.phase === 'murmurs' ? 'How long will people accept being decided for?' : 'Who decides for the colony, and by what right?',
  chap: { kept: t => 'The charter was challenged, and it held.', shared: t => 'The colony took a share in its own government, and the Administrator let it.', crushed: t => 'The challenge to the charter was put down.', ousted: t => 'The Administrator was removed by the colony.', settled: t => 'The quarrel over the charter died away with the troubles that fed it.' } });
ext('works', { ask: (s, t) => t.known && t.known.job ? `Can ${t.name} be stopped before it finishes?` : `What is ${t.name} doing under the hill?`,
  chap: { stopped: t => `The colony broke ${t.name} before it could finish.`, sealed: t => `The colony sealed ${t.name} under concrete, still running.`, harnessed: t => `The colony took the controls of ${t.name}.`, remade: t => `${cap(t.name)} finished remaking the air.`, hatched: t => `${cap(t.name)} hatched what it had been keeping warm.`, armed: t => `${cap(t.name)} finished its lists, and stands guard on its own terms.`, called: t => `${cap(t.name)} called to somewhere a long way off, and is still waiting for an answer.`, stilled: t => `${cap(t.name)} stopped time on its hill, keeping whatever it keeps for makers who have not come back.` } });
ext('web', { ask: (s, t) => 'Why do two things that have nothing to do with each other keep turning up together?',
  chap: { understood: t => 'The colony found that two of its troubles were one, in time to use the knowledge.', sprung: t => 'The colony dealt with one trouble and so let loose another it had not known was tied to it.' } });
ext('before', { ask: (s, t) => 'What ended the people who settled here first?', chap: { learned: t => 'The colony read what the first settlers left, and took a lesson from it.' } });

/* ---------- where two stories met: kept as it happens ---------- */
const fire0 = LF.fire;
LF.fire = function (s, id) {
  const r = fire0(s, id), st = LF.byId[id];
  if (st && st.x && s.cur && s.cur.id === id) { s.xlog = s.xlog || []; s.xlog.push({ d: s.day, t: st.title, why: (s.cur.ctx && s.cur.ctx.why) || '' }); if (s.xlog.length > 40) s.xlog.shift(); }
  return r;
};

/* ---------- the Record ---------- */
LF.theRecord = function (s) {
  const open = [], closed = [];
  for (const id in s.threads || {}) { const t = s.threads[id], d = D[id]; if (!t.on || !d || t.phase === 'latent') continue;
    if (t.end) { const c = d.chap && d.chap[t.end]; if (c) closed.push({ id, title: d.name, d: t.endDay || s.day, txt: c(t, s) }); continue; }
    const name = d.called ? d.called(s, t) : null, notes = [];
    for (const g of s.signs || []) if (g.src === 'th.' + id && notes.length < 2) notes.push(`Noticed: ${LF.SIGNS[g.id]}.`);
    for (const b of s.blames || []) if (b.src === 'th.' + id) { const f = s.factors.find(x => x.id === b.who); notes.push(f ? `You said it was ${f.name}.` : b.who === '?' ? 'You said it was something new.' : 'You guessed, and have not been shown wrong.'); }
    open.push({ id, title: name ? cap(name) : 'Unexplained', q: d.ask ? d.ask(s, t) : '', d: t.woke || t.since, notes }); }
  // The world's own actors, met and not yet decided, are questions too.
  for (const f of s.factors) { if (f.kind === 'land' || f.kind === 'faction' || !LF.KINDS[f.kind] || f.stage < 2 || f.res || f.owned) continue;
    const notes = (s.blames || []).filter(b => b.who === f.id && !b.paid).map(() => 'You have acted against it on a guess.');
    open.push({ id: f.id, title: f.Name, q: f.insight < 25 ? `What ${LF.KINDS[f.kind].mass ? 'is' : 'are'} ${f.name}?` : f.kind === 'natives' || f.kind === 'humans' ? `Can the colony share a world with ${f.name}?` : `What is to be done about ${f.name}?`, d: f.last, notes }); }
  open.sort((a, b) => a.d - b.d); closed.sort((a, b) => a.d - b.d);
  return { open, closed, met: (s.xlog || []).slice(-6) };
};

/* ---------- the epilogue remembers the chapters ---------- */
const epi0 = LF.epilogue;
LF.epilogue = function (s) {
  const out = epi0(s), R = LF.theRecord(s), spine = s.plot && s.plot.spine;
  const ch = R.closed.sort((a, b) => (b.id === spine) - (a.id === spine)).slice(0, 4).map(c => c.txt);
  const left = R.open.filter(o => s.threads && s.threads[o.id]).slice(0, 2).map(o => o.q).filter(Boolean);
  if (left.length) ch.push(`It never did find out: ${left.map(q => q.replace(/\?$/, '').replace(/^./, c => c.toLowerCase())).join('; or ')}.`);
  if (!ch.length) return out;
  return Array.isArray(out) ? out.concat(ch) : out + '\n\n' + ch.join(' ');
};
})();

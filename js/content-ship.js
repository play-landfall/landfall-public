/* Landfall — the ship (Lachlan, 2026-11-15; DESIGN.md "The ship").
   The Ariadne stays in orbit with the sleepers, the three officers who did not come down first, and every system the
   first flight could not carry. Only the reactor goes down at landfall for certain (setup.load can add the hydroponics bay or the autodoc); each shuttle run after
   that brings one officer (seat.down) and one system (ship.cargo). The lander has fuel for two flights; dry, it burns
   food rendered in a digester (ship.dry). Cards that happen aboard (st.aboard) can only send the officers up there,
   and their tests count the officer aboard, not the one on the ground (LF.odds, test.aboard). No DOM. */
(function () {
'use strict';
const { add, h } = LF; const { P, N, Nc, F, R, M } = h;
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const SHIPV = 'ship';
const lc = x => x.charAt(0).toLowerCase() + x.slice(1);

/* What each system does for the ground, and what it costs to leave it aboard. */
const SYS = {
  hydroponics: { say: 'Feeds about two dozen whatever the weather.', wait: 'Every mouth eats from the store and the fields until it comes down.', down: 'The hydroponics racks are bolted into a cargo pod by dark, and the first trays are seeded before anyone eats.' },
  reclaimer:   { say: 'Clean water and air.', wait: 'Until it comes down the colony drinks from the lander\'s tanks and a boiling pot, and some of it makes people sick.', down: 'The reclaimer is craned off the ramp and coupled to the reactor. The boiling pots go back to the kitchen.' },
  medbay:      { say: 'Surgery and diagnosis.', wait: 'Until it comes down a wound or a fever is treated from a field kit, and more of them kill.', down: 'The autodoc comes down wrapped in foam like a coffin. By evening it has its first patient.' },
  fabricator:  { say: 'Prints spare parts for every other machine.', wait: 'Until it comes down nothing prints spares, and every repair eats the shelf.', down: 'The fabricator comes down in three crates and is printing its own bolts by the end of the week.' },
};
const ORDER = ['hydroponics', 'reclaimer', 'medbay', 'fabricator'];
const bring = id => s2 => { const m = s2.machines[id]; if (m && !m.lost) { m.up = false; LF.log(s2, `The ${LF.MACHINES[id].name} is down from the ship and working.`, 'good'); } };

/* ---------- every flight after: one system ---------- */
const sysOf = (s, c) => (c.ids || []);
add({ id: 'ship.cargo', view: SHIPV, arc: 'sleepers', tone: 'council', chain: true, preflight: true, repeat: 1, title: 'What Comes Down',
  setup: s => ({ ids: ORDER.filter(id => LF.aboard(s).includes(id)), then: null, fuel: s.fuel || 0 }),
  text: (s, c) => { const n = sysOf(s, c).length;
    return `Before the lander drops there is one cargo cradle to fill. ${n === 1 ? `The ${LF.MACHINES[c.ids[0]].name} is the last system still aboard.` : `${NUM[n] ? NUM[n].charAt(0).toUpperCase() + NUM[n].slice(1) : n} systems are still in the ${s.world.ship}'s hold.`}${N(s, 'engineer') === LF.seatWord(s, 'engineer') ? '' : `\n\n[[engineer]] "There's one cradle, so pick one, and pick the one you'd miss soonest." "Whatever stays up there goes on freezing, a bit worse every pass, and I can't mend what I can't get my hands on."`}\n\n${c.fuel ? `The tanks hold ${NUM[c.fuel] || c.fuel} more flight${c.fuel === 1 ? '' : 's'}.` : 'The tanks are dry. The next flight burns food.'}`; },
  // Three options at most (2026-11-21): with all four systems still aboard, the first three in ORDER are offered and the
  // fabricator waits its turn. The dark option that brought two at once (twelve sleepers' power for a second cradle) is gone.
  choices: ORDER.map(id => ({ show: (s, c) => sysOf(s, c).slice(0, 3).includes(id), label: `The ${LF.MACHINES[id].name}`, note: SYS[id].say + ' ' + SYS[id].wait.replace('Until it comes down', 'Leave it, and'),
    info: [['yield', LF.MACHINES[id].name], ['danger', 'Everything still aboard']],
    out: { then: (s, c) => c.then, text: SYS[id].down, fx: { do: bring(id) } } })) });

/* ---------- the tanks run dry ---------- */
add({ id: 'ship.dry', urgent: true, view: SHIPV, arc: 'sleepers', tone: 'crisis', title: 'Dry Tanks', repeat: 60,   // back every two months until the digester is built or the lander is grounded on purpose
  when: s => s.world && !s.adrift && (s.fuel || 0) <= 0 && !s.flags.digester && !s.built.digester && s.project !== 'digester' && !(s.parked && s.parked.digester) && !(s.bq || []).includes('digester') && !s.flags.lander_grounded && !s.machines.lander.lost && (s.sleepers > 0 || LF.inOrbit(s).length || LF.aboard(s).length),
  text: s => { const up = LF.inOrbit(s), sys = LF.aboard(s);
    return `The lander's tanks are dry. ${up.length ? `${up.map(p => p.first).join(' and ')} ${up.length === 1 ? 'is' : 'are'} still aboard, ` : ''}${sys.length ? `${sys.map(id => 'the ' + LF.MACHINES[id].name).join(', ')} still in the hold, ` : ''}and ${s.sleepers} sleepers in the banks.\n\n${P(s, 'engineer') ? `${F(s, 'engineer')} says` : 'The engineers say'} a digester could make fuel out of biomass.\n\n[[engineer]] "Food, mostly, or anything else that rots, about ${LF.FUEL_FOOD} a flight, and more while the digester's new and cranky. I'd not like to be the one telling the stores."`; },
  choices: [
    { label: 'Build the digester. Render food into fuel', note: s => `Every flight from now on burns about ${LF.FUEL_FOOD} food that people would otherwise eat.`, cost: { mat: 40 }, hint: 'unknown', info: [['yield', 'The lander flies again'], ['danger', 'The ladle, every flight']],
      out: { text: 'The digester goes up behind the lander pad: two tanks, a still and a smell that never leaves. The first sacks of food go in to a silence from the people watching.', fx: { morale: -2, do: s2 => { s2.flags.digester = s2.day; s2.built.digester = s2.day; } } } },
    { label: 'Ground the lander. What is up there stays up there', dark: true, note: s => `No food goes into the tanks. ${LF.inOrbit(s).length ? `${LF.inOrbit(s).map(p => p.first).join(' and ')} and the` : 'The'} ${s.sleepers} sleepers stay aboard for good.`, hint: 'unknown', info: [['yield', 'Every grain stays on the table'], ['danger', 'Everyone still aboard']],
      out: { text: s => `The lander is put under tarpaulin and its batteries pulled for the lamps. The ship crosses at dusk, the same as always.${LF.inOrbit(s).length ? ` ${LF.inOrbit(s).map(p => p.first).join(' and ')} send${LF.inOrbit(s).length === 1 ? 's' : ''} one message when the news reaches orbit, and then nothing.` : ''}`,
        fx: s => ({ morale: -4, stain: ['abandoned', 2], flags: { lander_grounded: s.day, sleepers_abandoned: true }, sched: s.sleepers > 0 ? [['sleep.lights', 20, 50]] : [], do: s2 => { for (const p of LF.inOrbit(s2)) { p.stranded = s2.day; } } }) } },
    // Never forced (Lachlan, 2026-11-16): a yard too thin for the digester puts it off; the card comes back in two months.
    { label: 'Not yet. Leave the lander on the pad until there is plate for a digester', note: s => `Nothing flies for now. ${LF.inOrbit(s).length ? LF.inOrbit(s).map(p => p.first).join(' and ') + ' and the' : 'The'} ${s.sleepers} sleepers wait aboard for as long as it takes.`, hint: 'unknown', info: [['danger', 'Everyone still aboard, for longer'], ['later', 'Whatever goes wrong aboard meanwhile']],
      out: { text: 'The lander is chocked and covered on the pad, its tanks open to the air. The engineers chalk the digester\'s plan on the hangar wall, for when the yard can spare the plate.', fx: { morale: -1 } } },
  ] });

/* ---------- aboard: what the officers up there deal with ---------- */
add({ id: 'ship.orbit', view: SHIPV, arc: 'sleepers', tone: 'crisis', title: 'Losing Height', aboard: true, two: true, repeat: 400, w: 1.4,
  when: s => s.day >= 130 && (s.sleepers > 20 || LF.aboard(s).length >= 1) && (s.sleepers >= 20 || LF.inOrbit(s).length > 0 || LF.canFly(s)),   // never with every option shut (2026-11-21: a system aboard, few sleepers, nobody up there and the tanks dry left only the locked fuel run)
  text: s => { const up = LF.inOrbit(s);
    return `The ${s.world.ship}'s orbit is decaying: the upper atmosphere is thicker than the survey said, and every pass drags her a little lower. In about a year she starts to burn.\n\n${up.length ? `${up[0].name} is aboard.\n\n[[${up[0].id}]] ` + (up[0].seat === 'command' ? '"I can boost her by hand. Or you can send me fuel. Decide."' : up[0].seat === 'security' ? '"Lovely. Now the ship\'s trying to kill us as well, and I\'m the one stuck up in her. What is it you want me to do about it?"' : up[0].seat === 'engineer' ? '"She\'ll take a hand burn, maybe. The thrusters haven\'t fired in forty years, so I wouldn\'t promise a second."' : up[0].seat === 'doctor' ? '"There are a hundred people asleep in here. Whatever you decide, decide it for them."' : up[0].seat === 'scientist' ? '"The drag figures are, no, sorry, they\'re fascinating, actually, but we need to burn, we do need to burn, I\'m just going to look at them for one more minute first."' : '"I\'ll do the work. Tell me which work."') : 'There is nobody aboard but the ship\'s own systems.'}`; },
  choices: [
    { label: 'Send up a tank of the lander\'s fuel', note: s => s.fuel ? 'One flight\'s fuel goes into station-keeping instead of a run down.' : 'The tanks are dry.', hint: 'good', req: s => LF.canFly(s), reqText: s => LF.flyWhy(s),
      info: [['yield', 'The ship holds her orbit'], ['danger', 'A flight\'s worth of fuel']],
      out: { text: 'The lander goes up empty and comes back empty, and in between the ship fires for eleven minutes. Her orbit holds.', fx: { fly: 1, machine: { lander: -6 } } } },
    { label: 'Boost her by hand from aboard', show: s => LF.inOrbit(s).length > 0, note: 'The old attitude thrusters, fired from the bridge by whoever is up there. If it goes wrong, it goes wrong in the hold.', hint: 'unknown',
      test: { aboard: true, base: 40, mods: [R('engineer', 10), R('pilot', 5)] },
      ok: { text: 'Six burns over a month, each one a little longer. The ship climbs. Down here nobody notices anything at all.', fx: { morale: 2 } },
      bad: { text: s => `A thruster fires and doesn't stop. The ship tumbles for nine minutes before it's caught. When the cryo report comes down, ${s.sleepers >= 18 ? 'bank D has lost power' : s.sleepers ? 'the last bank with anyone in it has lost power' : 'the empty banks have lost power'}${LF.aboard(s).length ? ', and so has something in the cargo hold' : ''}.`,
        fx: s => { const id = LF.aboard(s)[0]; return { sleepers: -Math.min(18, s.sleepers), aboard: true, machine: id ? { [id]: -25 } : {}, morale: -4 }; } } },
    { label: 'Lighten her. Jettison bank D', dark: true, show: s => s.sleepers >= 20, note: 'Twenty pods, and the mass of their bank. She climbs on what she has left, and nobody has to fire anything.', hint: 'unknown',
      info: [['yield', 'The ship holds, and the lander keeps its fuel'], ['danger', 'Twenty sleepers']],
      out: { text: 'Bank D is uncoupled from the spine and let go. It falls behind the ship over two orbits. People on the ridge watch a second light follow the first at dusk, closer to the horizon every evening, until one evening it flares and is gone.',
        fx: { sleepers: -20, morale: -5, stain: ['jettisoned', 2], chron: 'Twenty sleepers were jettisoned from the ship to keep her in orbit.' } } },
  ] });

const lonely = s => LF.inOrbit(s).find(p => !p.stranded && p.mind > 20) || LF.inOrbit(s)[0];
add({ id: 'ship.cabin', view: SHIPV, arc: 'sleepers', tone: 'pressure', title: 'Company', aboard: true, repeat: 9999, w: 1.2,
  when: s => s.day >= 150 && LF.inOrbit(s).length >= 1 && s.sleepers > 10,
  setup: s => { const p = lonely(s); return { pid: p.id, name: p.name, first: p.first, seat: p.seat }; },
  text: (s, c) => `The ship's own log, read out by the radio room: ${c.name} has been waking sleepers in the night. One at a time, for an hour or two, for company. Then back under. Eleven so far. The thaw is hard on a body and the log says two of the eleven didn't settle properly when they went back down.\n\n${c.first} answers on the next pass.\n\n[[${c.pid}]] ${c.seat === 'doctor' ? `"They're fine." "I'm a doctor. I'd know."` : c.seat === 'security' ? `"So I sit with them, and I like knowing who's down there before something goes wrong." "Arrest me, if you like."` : c.seat === 'scientist' ? `"I'm asking them about Earth." "The things nobody wrote down, what the rain smelled like, what a Tuesday was, somebody has to, and nobody else is, hold on, you're not putting that in the log, are you?"` : c.seat === 'engineer' ? `"I'd go mad up here otherwise." "Everything I can fix is fixed, so I talk to them. They don't complain."` : c.seat === 'command' ? `"Morale check." "Theirs and mine. It's handled."` : `"They're scared when they wake." "I sit with them. That's all."`}`,
  choices: [
    { label: (s, c) => `Bring ${c.first} down on a flight of their own`, note: (s, c) => s.fuel ? `A flight's fuel spent on one officer. ${c.first} is down early, and nobody minds the ship.` : 'The tanks are dry.', req: s => LF.canFly(s) && !s.machines.lander.lost, reqText: s => s.machines.lander.lost ? 'There is no lander' : LF.flyWhy(s), hint: 'unknown',
      info: [['people', 'The officer down'], ['danger', 'A flight, and nobody aboard to keep the ship']],
      out: { text: (s, c) => `${c.first} comes down alone in a lander built for twenty, and sleeps for two days straight in the first bunk anyone offers.`, fx: (s, c) => ({ fly: 1, machine: { lander: -6 }, do: s2 => LF.bringDown(s2, h.byPid(s2, c.pid)) }) } },
    { label: 'Let it go on', note: (s, c) => `It keeps ${c.first} sane. Every waking is a risk to the one woken.`, hint: 'unknown', info: [['yield', 'An officer who holds together'], ['danger', 'The ones woken']],
      out: { text: (s, c) => `Nobody tells ${c.first} to stop. The log goes on recording wakings, and once a month or so, a sleeper who doesn't go back under properly.`, fx: (s, c) => ({ sleepers: -4, do: s2 => { const p = h.byPid(s2, c.pid); if (p) p.mind = Math.min(100, p.mind + 15); } }) } },
    { label: (s, c) => `Have the ship lock ${c.first} out of the cryo bay`, dark: true, note: (s, c) => `The ship can do it on an order from the ground, and ${c.first} will be alone with it up there until a flight comes.`, hint: 'unknown', info: [['yield', 'The sleepers left alone'], ['danger', 'The officer, alone']],
      out: { text: (s, c) => `The bay doors seal on your order. ${c.first} calls the radio room every night for a week, then every other night, then stops calling. The ship reports the officer's quarters occupied, lights on, door shut.`,
        fx: (s, c) => ({ stain: ['locked_aboard', 1], do: s2 => { const p = h.byPid(s2, c.pid); if (p) p.mind = Math.max(1, p.mind - 35); } }) } },
  ] });

add({ id: 'ship.pods', view: SHIPV, arc: 'sleepers', tone: 'crisis', title: 'Amber Lights', aboard: true, two: true, repeat: 9999, w: 1.2,
  when: s => s.day >= 240 && s.sleepers >= 30,
  text: s => { const d = LF.officer(s, 'doctor'), up = d && d.orbit;
    return `Fifteen pods in bank B have gone amber. The cells are failing, and the people in them are warming by a fraction of a degree a day. Thawed slowly like that, they wake with their brains cooked.\n\n${up ? `${d.first} is aboard.\n\n[[${d.id}]] "I can thaw them properly up here, in the infirmary. Some of them. Give me the word."` : d && !d.orbit ? `${d.first} is on the ground, and nobody aboard knows how to do a thaw.\n\n[[${d.id}]] "Get them down here. Now. Or I'm talking someone through it by radio, and I won't promise anything."` : 'There is no doctor to ask.'}`; },
  choices: [
    { label: 'Thaw them aboard, in the ship\'s infirmary', note: 'Whoever is aboard does it. It goes well with a doctor up there, and badly without one.', hint: 'unknown',
      test: { aboard: true, base: 30, mods: [R('physician', 10), R('engineer', 5)] },
      ok: { text: 'Thirteen of the fifteen come out of the cold, confused and alive, and go back under in sound pods. The two who didn\'t make it are put out through the lock.', fx: { sleepers: -2 } },
      bad: { text: 'The infirmary was built for one patient at a time. Nine of the fifteen die on the table or in the corridor waiting for it.', fx: { sleepers: -9, morale: -3 } } },
    { label: 'Fly them down now', note: s => `A flight for fifteen people the colony didn't plan to feed this year.`, req: s => LF.canFly(s) && !s.machines.lander.lost && s.machines.lander.hp > 15, reqText: s => s.machines.lander.lost ? 'There is no lander' : LF.flyWhy(s) || 'The lander is not fit to fly', hint: 'unknown',
      info: [['people', 'Twelve more hands'], ['danger', 'Fifteen more mouths, and a flight']],
      out: { text: 'They come down warming in their pods and are opened on the pad. Three are too far gone. Twelve sit wrapped in blankets on the ramp, shaking, staring at the sky.', fx: { fly: 1, pop: 12, sleepers: -15, food: -60, machine: { lander: -10 } } } },
    { label: 'Pull their cells for the sound banks', dark: true, note: 'Fifteen people already on their way out, and their cells would keep a healthy bank going for years.', hint: 'unknown', info: [['yield', 'The other banks steadier'], ['danger', 'Fifteen sleepers']],
      out: { text: 'The order goes up on the next pass. Fifteen pods go dark in sequence and their cells are walked across the spine, one at a time, by the ship\'s maintenance arm. Every other bank in the ship goes green.', fx: { sleepers: -15, stain: ['amber_cut', 2], chron: 'Fifteen failing sleepers were shut down so their cells could keep the others alive.' } } },
  ] });

/* One or two sentences for the top of the Ship view. */
LF.shipLine = function (s) { const up = LF.inOrbit(s), sys = LF.aboard(s), L = s.machines.lander, out = [];
  const and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
  out.push(`The ${s.world.ship} crosses the sky at dusk, twelve minutes horizon to horizon.`);
  if (up.length) out.push(`${and(up.map(p => p.first))} ${up.length === 1 ? 'is' : 'are'} aboard${up.some(p => p.stranded) ? ', for good' : ''}, keeping her and ${s.sleepers ? `the ${s.sleepers} still asleep` : 'the empty banks'}.`);
  else out.push(s.sleepers ? `Nobody is awake aboard her. ${s.sleepers} are still asleep.` : 'Nobody is aboard her any more.');
  if (sys.length) out.push(`${and(sys.map((id, i) => (i ? 'the ' : 'The ') + LF.MACHINES[id].name))} ${sys.length === 1 ? 'is' : 'are'} still in the hold, doing nothing for anyone below.`);
  if (L.lost) out.push('With the lander gone there is no way up.');
  else if (!s.fuel && !s.flags.digester) out.push('The lander\'s tanks are dry.');
  return out.join(' '); };

/* ---------- the deeds these cards can add to the colony's record (content-limits.js DEEDS) ---------- */
Object.assign(LF.DEEDS || {}, {
  cryo_spares: 'the cryo spares left behind for two more cradles',
  pods_drained: 'the sleepers whose power warmed the cargo cradles',
  rendered: 'the dead rendered into lander fuel',
  jettisoned: 'bank D, let fall into the atmosphere',
  locked_aboard: 'the officer locked out of the cryo bay and left alone aboard',
  amber_cut: 'the fifteen failing sleepers switched off for their cells',
});

/* ---------- cards that already happen on or about the ship show the Ship view ---------- */
for (const id of ['plan.sleepers', 'sleep.manifest', 'sleep.cryo', 'mach.lander', 'seat.down']) if (LF.byId[id]) LF.byId[id].view = SHIPV;
if (LF.byId['sleep.cryo']) LF.byId['sleep.cryo'].aboard = true;
})();

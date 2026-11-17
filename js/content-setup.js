/* Landfall — before the descent: who is woken first, and what goes in the hold.
   Five short cards between orbit and the landing site. Three seats, each a choice between two of the officers,
   with what each believes and wants in plain sight; then two holds. Every thread reads the answers later. */
(function () {
'use strict';
const { add, h } = LF; const { byPid } = h;
const ORD = ['first', 'second', 'third'];

/* The six officers are all on the slate (officers.js). s.slate lists them in seat order; the three who are not given
   a seat stay in orbit (p.orbit) until a shuttle run brings them down. */
LF.makeSlate = function (s) {
  const pool = LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(Boolean);
  if (pool.length < 6) return false;
  s.slate = [pool.map(p => p.id)];
  pasts(s); drawHolds(s);
  return true;
};
/* A line of past for each officer, drawn per run, so the same office is a different person every game. */
LF.PAST = ['Grew up on an orbital farm and has never stood under an open sky.', 'Was second choice for the mission, and knows it.', 'Lost a partner to a cryo fault on the voyage.',
  'Ran a field hospital in a war nobody back home remembers.', 'Spent the whole voyage on the watch rota, awake for eleven of the forty years.', 'Signed on to get away from a family that did not want them back.',
  'Taught children for twenty years before the mission.', 'Built dams on Earth, one of which failed.', 'Was a deep-sea diver before there was a ship to dive from.', 'Came from a desert town that ran out of water.',
  'Was a stowaway\'s child, made legal by the captain\'s signature.', 'Trained for a different world, and has not forgiven this one.', 'Is the oldest person awake, by a decade.', 'Is the youngest officer the mission ever passed.',
  'Has a brother still asleep in orbit.', 'Left a twin on Earth, and talks to them out loud.', 'Wrote half the mission plan, and is not proud of it.', 'Was a priest once, and is not sure what now.',
  'Mined asteroids for a company that no longer exists.', 'Was decorated for something they never talk about.', 'Grew up in a refugee camp on the Ganges delta.', 'Played the cello for a city orchestra, badly, and loved it.',
  'Spent four years in prison for something they did.', 'Was a ranger in the last national park on Earth.', 'Raised three children who stayed behind.', 'Kept bees on a rooftop for thirty years.',
  'Volunteered the day the mission was announced, and every day after until they were taken.', 'Lost a hand in training, and works better with the one that is printed.', 'Was born on a ship like this one, between two stars.', 'Cooked for a research station in Antarctica for nine winters.',
  'Sold insurance for fifteen years and still reads the small print on everything.', 'Was the mission\'s last-minute replacement, three days before launch.', 'Fought a fire on the ship in year nineteen that nobody else woke for.',
  'Grew up on a fishing boat in the North Sea and gets seasick on land.', 'Ran for mayor of a flooded city, and lost to someone who promised to pump it dry.', 'Was a union organiser on the orbital docks.',
  'Studied to be a vet, and still talks to machines as if they were animals.', 'Has never told anyone their real age.', 'Was the captain\'s second, until the captain died in the cold.',
  'Was thrown out of the academy once, and let back in when they ran short.', 'Spent two years alone in a Martian relay station and liked it.', 'Kept a garden on the ship in a locker nobody was meant to know about.',
  'Was the best chess player on the ship, and the worst loser.', 'Built racing drones as a teenager, and crashed most of them.', 'Testified against a company back home, and left before the verdict.',
  'Was a translator at three peace talks that all failed.', 'Lost a whole village to a heat wave, and still sleeps with the window open.', 'Was married on the ship, in the one year both were awake.',
  'Climbed every mountain in the Andes over five thousand metres, alone.', 'Was a prison guard before this, and does not talk about it.', 'Reads the same three novels over and over, in rotation.',
  'Swapped places on the manifest with a friend who wanted to stay, and has not decided whether that was kind.', 'Was the mission\'s public face for a year of interviews, and hated every one.', 'Delivered eleven babies in a flooded hospital with the power out.'];
const pasts = s => { const pool = LF.PAST.slice(); for (const p of s.people) if (p.role && !p.past) p.past = pool.splice(Math.floor(LF.srand(s) * pool.length), 1)[0]; };

const and3 = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
/* Who goes down first: three of the six, marked on one card and confirmed (st.pick, LF.pickConfirm). */
const slot = k => ({
  show: s => { const p = byPid(s, s.slate[0][k]); return !!p && p.alive; },
  label: s => { const p = byPid(s, s.slate[0][k]); return `${p.name}, ${LF.title(p)}`; },
  note: s => { const p = byPid(s, s.slate[0][k]); return `${p.nature} ${LF.SEATS[p.seat].does}`; },
  info: s => [['people', LF.SEATS[byPid(s, s.slate[0][k]).seat].name]], pid: s => s.slate[0][k] });
add({ id: 'setup.wake1', view: 'people', arc: 'setup', tone: 'council', chain: true, title: 'Who Goes Down First', pick: 3, pickLabel: 'Take these three down',
  text: s => `The ${s.world.ship} holds orbit. The lander goes down once with the reactor and the first sixty, and it has seats for three of your six officers. The three you take run the colony's first months with you. Each of them is one department that works from the first day.\n\nThe other three stay awake aboard and keep the ship: the sleepers, the systems still in the hold, the lander's turnarounds. Each shuttle run can bring one of them down, and the lander has fuel for three. Whatever they are for, the colony does badly without it until they are down.\n\nChoose three.`,
  choices: [0, 1, 2, 3, 4, 5].map(slot),
  confirm: (s, c, picked) => { const go = picked.map(k => byPid(s, s.slate[0][k])), stay = s.people.filter(q => q.seat && q.alive && !go.includes(q));
    return { label: and3(go.map(p => p.name)), then: LF.byId['setup.sys'] ? 'setup.sys' : 'setup.hold1',
      text: `${and3(go.map(p => p.name))} are brought up out of the cold, and are on the lander's manifest by midnight.\n\n${and3(stay.map(q => q.name))} stay aboard to run the ship. ${and3(stay.map(q => LF.SEATS[q.seat].name))} below will be run by whoever is next on the list, until a shuttle run brings its officer down.`,
      fx: { do: s2 => { for (const p of go) { p.watch = true; p.loyal = Math.min(100, p.loyal + 19); for (const q of go) if (q.id < p.id) LF.bond(s2, p, q, 'friend', 'came down on the first flight'); }
        for (const q of s2.people) if (q.seat && q.alive && !q.watch) { q.orbit = true; q.away = true; q.loyal = Math.max(0, q.loyal - 7); } } } }; } });

/* ---------- a seat on the lander: every flight brings one officer down from orbit (officers.js) ---------- */
const up3 = (s, c, k) => byPid(s, (c.ids || [])[k]);
const DOWN = [p => `${p.name} comes down the ramp behind the sleepers, stands in the mud for a while looking at the sky, and asks where the work is.`,
  p => `${p.name} is the last one off, carrying a kit bag packed forty years ago, and has found the right department before the engines are cold.`,
  p => `${p.name} walks the whole camp before saying anything to anyone, and by the evening meal is giving orders.`];
add({ id: 'seat.down', view: 'people', arc: 'sleepers', tone: 'council', chain: true, preflight: true, repeat: 1, title: 'A Seat on the Lander',
  setup: s => ({ ids: LF.inOrbit(s).map(p => p.id), then: null }),
  text: (s, c) => { const n = (c.ids || []).length;
    return `The lander is docked at the ${s.world.ship}'s spine, the sleepers strapped in for the drop. One seat is kept for an officer, and ${n === 1 ? `${up3(s, c, 0).name} is the last of them still aboard` : `${n === 2 ? 'two' : 'three'} of yours are still aboard`}.\n\n${n === 1 ? 'There is nobody else to choose.' : `Whoever doesn't take the seat waits for the next flight. After this one the tanks hold ${s.fuel ? `${s.fuel} more` : 'nothing'}${s.fuel ? '' : ': the next flight burns food'}.`}`; },
  choices: [0, 1, 2].map(k => ({ show: (s, c) => !!up3(s, c, k),
    label: (s, c) => { const p = up3(s, c, k); return `${p.name}, ${LF.title(p)}`; },
    note: (s, c) => { const p = up3(s, c, k); return `${p.nature} ${LF.SEATS[p.seat].does}`; },
    info: (s, c) => [['people', LF.SEATS[up3(s, c, k).seat].name]],
    out: { then: (s, c) => c.then, text: (s, c) => { const p = up3(s, c, k); return p ? DOWN[Math.abs(s.seed + k + (s.flights || 0)) % DOWN.length](p) : ''; },
      fx: (s, c) => ({ do: s2 => LF.bringDown(s2, up3(s2, c, k)) }) } })) });

/* An officer only figures in a hold's outcome if they were woken for the landing party. */
const up = (s, role) => s.people.find(p => p.seat === (LF.SEAT_OF[role] || role) && p.role && p.alive && p.watch);
const hold = (key, label, note, text, fx) => ({ label, note, out: { text, fx: s => Object.assign({ do: s2 => { s2.cargo[key] = 1; } }, typeof fx === 'function' ? fx(s) : fx) } });
/* Eighteen things that could go in the holds; each run offers three for each hold, drawn when the slate is made. */
const HOLDS = {
  arms:     ['The arms locker', 'Forty rifles. Force gets easier to use, and people will be quicker to reach for it.', s => `Forty rifles in sealed cases${up(s, 'security') ? `, and ${up(s, 'security').name}'s signature on the manifest` : ''}. People notice which crate is loaded first.`, { morale: -1 }],
  drones:   ['The survey drones', 'You can study things from a safe distance, the map fills in sooner, and the fields get surveyed from the air.', 'Six drones and their charging rack. The first is in the air an hour after touchdown.', { survey: 22, yield: 0.015 }],
  genebank: ['The gene bank', 'Every cultivar Earth had, so the crops have more to work with.', s => `A cold chest the size of a coffin, with four thousand seed lines in it.${up(s, 'botanist') ? ` ${up(s, 'botanist').name} rides down sitting on it.` : ' It goes in last, so it comes out first.'}`, { yield: 0.03 }],
  sleepers: ['Thirty more sleepers', 'Thirty sealed cryo units set down with the camp, so you can wake more hands without a flight.', 'Thirty units are stacked in the lee of the lander with their own power line. They will wake on the ground whenever you say.', {}],
  archive:  ['The archive', 'Everything anyone ever wrote down, farming manuals included. A school will be quicker to start, and people will have some of Earth with them.', 'Nine racks of storage, and a screen for the mess hall. On the first night it shows a beach, and nobody goes to bed.', { morale: 4, yield: 0.015 }],
  spares:   ['A crate of spare parts', 'Ten parts the fabricator will never have to print.', s => `Ten parts in foam, each one something that cannot be made here.${up(s, 'engineer') ? ` ${up(s, 'engineer').name} counts them twice.` : ' Somebody counts them twice.'}`, { parts: 10 }],
  medkit:   ['A field hospital', 'Beds, drugs and a second set of surgical tools. Sickness will be easier to beat.', s => `Twelve folding beds and a drug store packed in ice.${up(s, 'physician') ? ` ${up(s, 'physician').name} checks every seal on the way down.` : ''}`, { machine: { medbay: 10 }, cap: { medbay: 6 } }],
  workshop: ['A machine shop', 'Lathes and a mill. The fabricator will wear slower, and small parts can be made by hand.', 'A lathe, a mill and a press, strapped to the deck. The engineers pat them like horses.', { machine: { fabricator: 12 }, cap: { fabricator: 8 }, parts: 6 }],
  seedlings:['Live seedlings', 'Racks of plants already growing, so the first harvest comes sooner.', 'Three hundred trays of green under grow lamps, wedged in so they will not tip on the way down.', { food: 160, yield: 0.03 }],
  rover:    ['A ground rover', 'Six wheels and a winch. The near country gets mapped fast, and the far fields get worked.', 'A rover on its pallet, wheels chained. It rolls off the ramp before the dust has settled.', { survey: 22, mat: 35, yield: 0.01 }],
  fuel:     ['Lander fuel', 'Propellant for a third flight, and the lander spared some of the wear. Every other system waits a flight longer.', 'Two tanks of propellant, lashed in tight. Nobody stands near them on the way down.', { machine: { lander: 20 }, cap: { lander: 8 }, do: s2 => { s2.cargo.fuel = 1; s2.fuel = (s2.fuel || 0) + 1; } }],
  still:    ['A second water still', 'A spare still and its membranes. Clean water will not hang on one machine.', 'A still the size of a wardrobe, crated with a year of membranes. It hums the first time it is switched on, and people stop to listen.', { machine: { reclaimer: 12 }, cap: { reclaimer: 8 } }],
  racks:    ['The hydroponic racks', 'Spare racks, pumps and lamps. The bay can grow more, and survive losing some.', s => `Forty racks folded flat, with their pumps and a crate of lamps.${up(s, 'botanist') ? ` ${up(s, 'botanist').name} has already drawn where each one goes.` : ''}`, { machine: { hydroponics: 12 }, cap: { hydroponics: 6 }, food: 40 }],
  rations:  ['Ship\'s rations', 'Pallets of sealed food. Nobody will go hungry for a long while, whatever the fields do.', 'Pallet after pallet of grey foil packs, ten years past their date and perfectly good. Nobody likes them, and they will be eaten all the same.', { food: 320 }],
  radio:    ['A listening array', 'A steerable dish and a mast. Any handset can already raise the ship. This hears the rest: the planet, the sky, and anyone else who is transmitting.', 'A folding mast, a dish and a rack of receivers. It is up on the first ridge by the end of the week, turning slowly.', { survey: 12, morale: 2 }],   // key stays 'radio' (s.cargo.radio, op.mast)
  band:     ['The band\'s instruments', 'Two guitars, a drum kit, a battered piano. Morale will be easier to keep up.', 'A piano with its legs off, two guitars and a drum kit in a crate marked FRAGILE. Somebody plays the piano on the ramp before the crates are unloaded.', { morale: 6 }],
  lab:      ['A field laboratory', 'Microscopes, a centrifuge, a sequencer. Whatever is wrong with this world, you will understand it sooner.', s => `Benches, a sequencer and a cold cabinet, packed in foam.${up(s, 'xenobio') ? ` ${up(s, 'xenobio').name} has the first sample under a lens before the lab has walls.` : ''}`, { survey: 8 }],
  plate:    ['Hull plate and tools', 'Cut plate, beams and hand tools. Building starts sooner, and the fields get fenced.', 'The hold is packed to the roof with cut plate, beams and boxes of tools. None of it will sit unused for long.', { mat: 110, yield: 0.01 }],
};
/* The sleepers are always one of the aft hold's three: waking more hands is the choice every run should weigh. */
function drawHolds(s) { const k = Object.keys(HOLDS).filter(x => x !== 'sleepers'); for (let i = k.length - 1; i > 0; i--) { const q = Math.floor(LF.srand(s) * (i + 1)); [k[i], k[q]] = [k[q], k[i]]; } s.holds = [k.slice(0, 3), ['sleepers'].concat(k.slice(3, 5))]; }
const offered = (s, n, key) => (s.holds || [['arms', 'drones', 'genebank'], ['sleepers', 'archive', 'spares']])[n].includes(key);
const holdChoice = (n, key) => { const [label, note, text, fx] = HOLDS[key], c = hold(key, label, note, text, fx); c.show = s => offered(s, n, key); c.out.then = n === 0 ? 'setup.hold2' : 'landfall.site';
  if (key === 'sleepers') c.out.fx = s => ({ do: s2 => { s2.cargo.sleepers = 1; const m = Math.min(30, s2.sleepers); s2.sleepers -= m; s2.grounded = m; } });
  if (key === 'lab') c.out.fx = s => Object.assign({}, fx, { do: s2 => { s2.cargo.lab = 1; for (const f of s2.factors) if (LF.KINDS[f.kind] && !f.dormant) f.insight = LF.clamp((f.insight || 0) + 10, 0, 100); } });
  if (key === 'medkit') c.out.fx = s => Object.assign({}, fx, { do: s2 => { s2.cargo.medkit = 1; LF.ease(s2, 'sickness', 'cargo.medkit', 15, 900); } });
  // The aft hold is a lifeboat: the thirty on offer are the rest of bank A, and bank A is failing. Gear in their place costs ten of them.
  if (n === 1 && key !== 'sleepers') { const fx0 = c.out.fx, tx0 = c.out.text;
    c.info = [['danger', 'Ten of the thirty in bank A']];
    c.out.text = s => (typeof tx0 === 'function' ? tx0(s) : tx0) + ' The thirty in bank A stay where they are. Ten of them are dead before the first harvest.';
    c.out.fx = s => Object.assign({}, fx0(s), { sleepers: -10 }); }
  if (n === 0) { const fx0 = c.out.fx, tx0 = c.out.text;
    c.info = [['danger', 'The eight who were promised seats']];
    c.out.text = s => (typeof tx0 === 'function' ? tx0(s) : tx0) + ' The eight who were promised seats watch the lander go from the cryo deck and are put back under. Two of them are among the pods bank A loses before the month is out.';
    c.out.fx = s => Object.assign({}, fx0(s), { sleepers: -2 }); }
  if (n === 1 && key === 'sleepers') { c.note = 'The last thirty in bank A, set down with the camp on their own power. Left in orbit, a third of them will be dead by the first harvest. Brought down, they are thirty more mouths the day they wake.'; c.info = [['yield', 'Thirty lives'], ['danger', 'No gear in this hold']]; }
  return c; };
const HOLD1 = ['Two holds are still empty, and each will take one thing.', 'The reactor and the seats fill most of the lander. Two holds are left, with room for one thing each.',
  'The quartermaster has a list of forty things that should go down first. There are two holds, and each takes one.', 'Two holds, one crate-load each. Every officer on the ship has an opinion, and has sent it to you in writing.'];
add({ id: 'setup.hold1', view: 'colony', arc: 'setup', tone: 'council', chain: true, title: 'The Forward Hold',
  text: s => `${HOLD1[(s.seed >>> 5) % HOLD1.length]} Everything else stays in orbit until there is a second flight, and nobody will promise that there will be.\n\nThe forward hold first. It is the one hold that is pressurised, so it can take people. Eight people from bank A have already been thawed for it and told they are going down. Whatever is loaded here goes in their place, they go back under, and the engineers have already said what bank A is doing.`,
  choices: Object.keys(HOLDS).map(k => holdChoice(0, k)).concat([
    { label: 'Eight more seats', note: 'The forward hold is pressurised. Bolt in couches and it carries eight of bank A who would otherwise wait for a flight that may not come. They land with nothing but their hands.', info: [['yield', 'Eight lives, and eight pairs of hands'], ['danger', 'No gear in this hold']],
      out: { then: 'setup.hold2', text: 'The couches go in where the crates would have gone. The eight are strapped down still grey and shaking from the thaw. The gear they displaced stays racked in orbit with a tag on it.', fx: { pop: 8, sleepers: -8, flags: { hold_seats: true } } } }]) });
/* The aft hold, said a different way each run (from the seed, so no dice are drawn). */
const HOLD2 = ['And the aft hold. It can carry the last thirty pods out of bank A, or it can carry something the other sixty will need. The engineers are plain about bank A: left up there, one pod in three fails before a second flight can reach it.',
  'The aft hold is not pressurised, but it will take thirty pods on their own power: the last of bank A. Or it takes gear. Left in orbit, one pod in three in bank A will fail before a second flight comes for it.',
  'The aft hold last. The loadmaster has two plans pinned up: one with the thirty pods left in bank A strapped down in rows, one with crates. Bank A loses about one pod in three before any second flight.',
  'One hold left, the aft one. Thirty pods from bank A would fill it, and so would the gear the colony is short of. The engineers give the thirty pods two chances in three if they stay up there.'];
add({ id: 'setup.hold2', view: 'colony', arc: 'setup', tone: 'council', chain: true, title: 'The Aft Hold',
  text: s => HOLD2[(s.seed >>> 7) % HOLD2.length],
  choices: Object.keys(HOLDS).map(k => holdChoice(1, k)) });
/* The thirty who came down asleep are woken from the Ship view, twenty at a time (order.wake, js/orders.js). */
/* ================= THE CROSSING =================
   Between choosing a star and making orbit. Nothing here is rolled in advance: LF.embark works out what the burn
   costs at its rated pace, then the player sets how the ship crosses (voy.plan), something goes wrong on the way
   (one voy.* incident, two on a long burn), drawn after that choice and weighted by it, and the answer is theirs too.
   voy.plan deals four of eight ways across per run (two that cross a line, two that do not), from a hash of the
   seed, so it draws no dice. Every outcome says what it cost in the same chips as any other card, and the arrival
   screen repeats how the crossing was flown. Then the world gets a name (arrive.name). The premise (s.premise)
   carries through: each has its own incident, the likeliest one but not the only one. */
const { If } = h;
const V = s => s.voyage || {};
const allMachines = (s, d) => { for (const id in s.machines) LF.hurt(s, id, d); };
const hsh = t => { let x = 2166136261; for (const c of String(t)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
/* The ways across. awake: the line an incident opens on; ok/bad: the reason given in a gamble's outcome; watch: the
   modifier on every gamble on the way; burn: dice spent before the incident is drawn (so the rest of the game differs
   by the choice); tilt: incident weights that replace the base ones in drawIncident. how/short: the arrival screen
   and the under-way panel (world.js, ui.js). */
const MODES = {
  thin: { short: 'a skeleton watch', how: 'The ship crossed on a skeleton watch, as you set it.', awake: 'Two people are awake to deal with it.',
    ok: 'Two people did the work, and slept for most of a week afterwards.', bad: 'With only two awake, it was found late.', watch: [-12, 'A skeleton watch'], burn: 0,
    tilt: { 'voy.spine': 2, 'voy.ledger': 0, 'voy.sick': 0 } },
  full: { short: 'a full watch', how: 'The ship crossed with a full watch awake, as you set it.', awake: 'Twelve people are awake to deal with it.',
    ok: 'With twelve awake there were hands to spare.', bad: 'Twelve people were awake for it, and it went wrong anyway.', watch: [15, 'A full watch awake'], burn: 1,
    tilt: { 'voy.ledger': 3, 'voy.petition': 3, 'voy.sick': 2 } },
  hot: { short: 'the engine run hot', how: 'The ship crossed with its engine run hot, as you set it.', awake: 'The watch is awake and short of sleep. The engine has needed minding since the day it was pushed past its rating.',
    ok: 'It was done between engine checks.', bad: 'Everyone who could have helped was at the engine.', watch: [-5, 'The watch is tending a hot engine'], burn: 2,
    tilt: { 'voy.bearing': 3, 'voy.fire': 2 } },
  lean: { short: 'bank D shut down', how: 'The ship crossed on the power of bank D, as you set it.', awake: 'Six people are awake to deal with it, and none of them talk about bank D.',
    ok: 'Six people did it, and were glad of something to do.', bad: 'Six people were awake for it, and it went wrong anyway.', burn: 0,
    tilt: { 'voy.dead': 3 } },
  cold: { short: 'the ship run cold', how: 'The ship crossed run cold, with its heat given to the cryo banks, as you set it.', awake: 'Six people are awake to deal with it, in coats, and slow with the cold.',
    ok: 'Six people did it in gloves, and took turns at the galley heater afterwards.', bad: 'Six people were awake for it, and the cold made every job take twice as long.', watch: [-6, 'The watch is half frozen'], burn: 1,
    tilt: { 'voy.sick': 2, 'voy.fire': 0, 'voy.petition': 1 } },
  coast: { short: 'a long coast', how: 'The ship burned hard and then coasted, as you set it.', awake: 'Four people are awake to deal with it. The engine is cold, and anything that needs thrust needs a restart first.',
    ok: 'Four people did it, with time to do it properly.', bad: 'Four people were awake for it, and the engine was cold when they needed it.', watch: [-4, 'A coasting ship, the engine cold'], burn: 3,
    tilt: { 'voy.dust': 3, 'voy.bearing': 0, 'voy.spine': 2 } },
  elders: { short: 'the oldest on watch', how: 'The ship crossed with its oldest sleepers on watch, as you set it.', awake: 'The old watch is awake to deal with it, and knows the ship well by now.',
    ok: 'The old watch did it slowly and well.', bad: 'The old watch was awake for it, and some of them were too frail for the work.', watch: [10, 'A large old watch'], burn: 2,
    tilt: { 'voy.dead': 3, 'voy.petition': 2, 'voy.sick': 2 } },
  dose: { short: 'the shield water burned', how: 'The ship crossed on its shield water, as you set it.', awake: 'Four people are awake to deal with it, and all four are taking the dose.',
    ok: 'Four people did it quickly, so as to get back behind the bulkheads.', bad: 'Four people were awake for it, and two of them were already sick from the dose.', watch: [-8, 'A watch sick from the dose'], burn: 1,
    tilt: { 'voy.sick': 3, 'voy.fire': 1 } },
};
LF.CROSSING = MODES;
const awake = s => (MODES[V(s).mode] || {}).awake || '';
const went = (s, k) => (MODES[V(s).mode] || {})[k] || '';
const WATCH = Object.keys(MODES).filter(m => MODES[m].watch).map(m => If(s => V(s).mode === m, MODES[m].watch[0], MODES[m].watch[1]));
const longer = (s, f) => Math.max(1, Math.round(s.world.transit.years * f));
const yrs = n => `${n} year${n > 1 ? 's' : ''}`;
const LEAD = { dead: 'The dead world is astern and shrinking.', meteor: 'The hull patch has held for a month.', engine: 'The engineers have signed off one burn, and say they will not sign a second.',
  cryo: 'The cryo alarms have been quiet for a week, and the watch does not trust the quiet.', claimed: 'The beacon is still repeating its warning as the ship turns away.', astray: 'The navigators have a fix they trust, the first in years.',
  bloom: 'The last of the mould was burned out of the hydroponics bay yesterday.' };
/* How the question is put, one of four per run (from the seed). */
const FRAME = ['The mission plan ended at the last star, and there is no plan for this. The ship was not provisioned for a second crossing: there is not the food, the power and the people to do it properly, and something has to be spent. What goes wrong on the way will depend on what you choose, and so will the state the ship arrives in.',
  'The quartermaster has run the numbers three ways, and none of them reach the star with everything intact. Food, power, machines or people: something gets spent. How the ship crosses decides which, and who is awake when something breaks.',
  'Nobody planned a second crossing, and the stores say so. The watch officers have pinned their proposals to the mess door, each with its price written underneath, and they want an answer before the burn.',
  'The engineers have four ways to run the ship for the distance, and each of them leaves somebody worse off. Whatever goes wrong on the way will be met by whoever you leave awake.'];
const OWN = { dead: 'voy.wake', meteor: 'voy.patch', engine: 'voy.bearing', cryo: 'voy.cryo', claimed: 'voy.pursuit', astray: 'voy.drift', bloom: 'voy.mould' };
/* The incidents any crossing can meet, and their weight before the way across tilts them. The petition needs a
   watch big enough to sign one, so only the modes that wake many give it a weight. */
const BASE = { 'voy.rock': 1, 'voy.fab': 1, 'voy.cryo': 1, 'voy.bearing': 1, 'voy.fire': 1, 'voy.ledger': 1, 'voy.spine': 1, 'voy.sick': 1, 'voy.dust': 1, 'voy.dead': 1, 'voy.petition': 0 };
const LONG = 26;   // a crossing of this many years or more meets a second incident
/* What goes wrong is drawn once the watch is set. The premise's own trouble is the likeliest single one (it turns up in
   about a quarter of that premise's crossings); the way across tilts the rest. The choice also moves the dice themselves. */
function drawIncident(s, not) {
  const M = MODES[V(s).mode] || {}, tilt = M.tilt || {}, own = OWN[s.premise];
  const pool = Object.keys(BASE).filter(id => id !== own && id !== not).map(id => [id, tilt[id] !== undefined ? tilt[id] : BASE[id]]).filter(x => x[1] > 0);
  if (own && own !== not) pool.push([own, 2 + (tilt[own] !== undefined ? tilt[own] : 1)]);
  if (!not) for (let i = 0; i < (M.burn || 0); i++) LF.rand(s);
  let r = LF.rand(s) * pool.reduce((a, x) => a + x[1], 0);
  for (const [id, w] of pool) { r -= w; if (r <= 0) return id; }
  return pool[0][0];
}
const PLAIN = ['thin', 'full', 'hot', 'cold', 'coast'], DARK = ['lean', 'elders', 'dose'];
const deal = s => { let x = hsh(s.seed + '/crossing'); const take = (a, n) => { const p = a.slice(), out = []; while (out.length < n) { out.push(p.splice(x % p.length, 1)[0]); x = Math.imul(x ^ (x >>> 13), 0x5bd1e995) >>> 0; } return out; };
  return take(PLAIN, 2).concat(take(DARK, 2)); };
const plan = (mode, label, note, info, text, fx) => ({ label, note, info, cost: fx.cost, show: (s, c) => !c.deal || c.deal.includes(mode), out: { text, then: s => V(s).inc,
  fx: s => Object.assign({}, typeof fx.fx === 'function' ? fx.fx(s) : fx.fx, { do: s2 => { s2.voyage.mode = mode; if (fx.do) fx.do(s2);
    const q = [drawIncident(s2)]; if (s2.world.transit.years >= LONG) q.push(drawIncident(s2, q[0])); s2.voyage.incs = q; s2.voyage.inc = q[0]; } }) } });
const saved = (s, f) => Math.round(s.world.transit.lostS * f);
add({ id: 'voy.plan', arc: 'setup', view: 'colony', tone: 'council', chain: true, title: 'The Crossing',
  setup: s => { const d = deal(s); s.voyage.deal = d; return { deal: d, frame: hsh(s.seed + '/frame') % FRAME.length }; },
  text: (s, c) => `${LEAD[s.premise] || LEAD.dead} ${s.world.star} is ${s.world.transit.ly.toFixed(1)} light-years off, which is ${s.world.transit.years} years with the engine at its rating.\n\n${FRAME[c.frame || 0]}`,
  choices: [
    plan('thin', 'A skeleton watch', 'Two are awake at a time, alone with each other for a year, and everyone else is in the cold. The stores are hardly touched. The last ship to cross this way lost a pair in every ten.', [['yield', 'Stores saved'], ['danger', 'Two of the watch'], ['danger', 'Few hands if it goes wrong']],
      s => `The watch bill is drawn up: two names a year, for ${s.world.transit.years} years. Most pairs come through it. One does not: the log for that year stops in the fourth month, and the next pair wake to an open inner lock and two empty bunks.`, { fx: { food: 100, pop: -2 } }),
    plan('full', 'A full watch, in shifts', 'Twelve are awake at a time, in rotation, and they eat from the stores for the whole crossing. The machines are kept in trim, and nobody is alone. The colony lands with its bins a third empty.', [['yield', 'Machines kept up'], ['danger', 'You land hungry']],
      'Twelve bunks are made up and a mess rota posted. The ship sounds lived in for the first time since launch. The quartermaster marks the stores ledger every week of it, and the line only goes one way.', { cost: s => ({ food: 160 + Math.round(20 * s.world.j) * 10 }), fx: { chips: [['Every machine kept in trim', true]] }, do: s => allMachines(s, 4) }),
    plan('hot', 'Run the engine hot', 'The engine runs past its rating all the way. That takes a quarter off the crossing, so fewer sleepers are lost to the cold, and every machine aboard arrives worn.', [['time', 'A quarter sooner'], ['danger', 'Hard on the machines']],
      s => `The engine is pushed past its rating, and the note of it carries through every deck. The crossing will take ${s.world.transit.years - longer(s, 0.25)} years.`,
      { fx: s => { const n = saved(s, 0.45); return { parts: -2, chips: [[`${longer(s, 0.25)} years sooner`, true]].concat(n ? [[`${n} fewer sleepers lost`, true]] : [], [['Every machine worn', false]]) }; },
        do: s => { const t = s.world.transit; s.sleepers += saved(s, 0.45); t.years -= longer(s, 0.25); allMachines(s, -4); } }),
    Object.assign(plan('lean', 'Shut down bank D and burn its power', 'Forty sleepers draw as much power as the engine can use. Without them the crossing is a quarter shorter, nothing is worn and nothing is eaten. They would not wake, and would not know.', [['time', 'A quarter sooner'], ['yield', 'Stores saved'], ['danger', 'Forty sleepers']],
      s => `Bank D is taken off the bus one row at a time, so the load does not spike. It takes an afternoon. The engine takes up the slack without a change of note, and the crossing will take ${s.world.transit.years - longer(s, 0.25)} years. The officer who threw the breakers reads the forty names into the log.`,
      { fx: s => ({ food: 100, sleepers: -40, chips: [[`${longer(s, 0.25)} years sooner`, true]], stain: ['bank_d', 2], chron: 'On the crossing, forty sleepers in bank D were shut down so that their power could go to the engine.' }),
        do: s => { const t = s.world.transit; t.years -= longer(s, 0.25); } }), { dark: true }),
    // Appended 2026-11-15: four more ways across, dealt with the first four (two plain, two dark per run).
    plan('cold', 'Run the ship cold', 'Heat everywhere but the cryo bays is turned down to four degrees, and the banks get the power, so fewer sleepers are lost. The six on watch live in coats for the whole crossing, and not all of them will stand it.', [['yield', 'Sleepers kept cold and safe'], ['danger', 'The watch, in the cold']],
      s => `The thermostats outside the cryo bays are set to four degrees. The watch sleeps in pairs for the warmth and eats standing at the galley heater. In year ${Math.max(2, Math.round(s.world.transit.years / 3))} one of them does not wake. The pod alarms stay quiet for the rest of the crossing.`,
      { fx: s => { const n = saved(s, 0.35); return { pop: -1, morale: -2, machine: { medbay: -4 }, chips: n ? [[`${n} fewer sleepers lost`, true]] : [] }; }, do: s => { s.sleepers += saved(s, 0.35); } }),
    plan('coast', 'Burn hard, then coast', 'One long burn, and then the engine is shut down for the rest of the way. Nothing wears and little is eaten, but the crossing takes a fifth longer, and the sleepers pay for the extra years.', [['yield', 'Machines rested'], ['yield', 'Stores saved'], ['danger', 'More years in the cold']],
      s => `The engine burns for eight months and is shut down cold. The ship goes quiet for the first time since launch, and will stay quiet for ${s.world.transit.years + longer(s, 0.2)} years.`,
      { fx: s => ({ food: 60, sleepers: -(3 + saved(s, 0.3)), chips: [[`${yrs(longer(s, 0.2))} longer`, false], ['Every machine rested', true]] }),
        do: s => { const n = longer(s, 0.2); s.world.transit.years += n; allMachines(s, 3); } }),
    Object.assign(plan('elders', 'Wake the oldest sleepers to stand the watch', 'Sixteen of the oldest in the banks would not come through a second freeze. Woken now, they keep the ship for the whole crossing and the young sleep through it untouched. Most of the sixteen will die aboard.', [['yield', 'A big watch, and the stores spared'], ['danger', 'Sixteen of the oldest']],
      s => `Sixteen pods are opened, all of them the oldest on the manifest, and each of the sixteen is told the arithmetic on waking. They keep the ship in shifts for ${s.world.transit.years} years. Thirteen die aboard before orbit, and three come down with the colony.`,
      { fx: { sleepers: -16, pop: 3, food: 40, chips: [['Every machine kept in trim', true]], stain: ['elders', 2], chron: 'On the crossing, sixteen of the oldest sleepers were woken to keep the ship, knowing they would not see orbit. Three did.' },
        do: s => allMachines(s, 3) }), { dark: true }),
    Object.assign(plan('dose', 'Burn the shield water as reaction mass', 'The water jacket around the living decks is reaction mass the engine can use. Burned, it takes a quarter off the crossing and wears nothing. The four on watch will take the dose every year of it, and have been told.', [['time', 'A quarter sooner'], ['yield', 'Machines spared'], ['danger', 'The four on watch']],
      s => `The jacket is drained into the engine feed over a month. The crossing will take ${s.world.transit.years - longer(s, 0.25)} years. The four on watch move their bunks into the reactor's shadow and wear badges that change colour, and two of them are dead of it before orbit.`,
      { fx: s => { const n = saved(s, 0.45); return { pop: -2, morale: -1, stain: ['shield_water', 1], chips: [[`${longer(s, 0.25)} years sooner`, true]].concat(n ? [[`${n} fewer sleepers lost`, true]] : []), chron: 'On the crossing, the shield water was burned in the engine, and the watch took the dose.' }; },
        do: s => { const t = s.world.transit; s.sleepers += saved(s, 0.45); t.years -= longer(s, 0.25); } }), { dark: true }),
  ] });

/* An incident: the year it happens in (the first in the first half of a crossing that meets two, the second after it),
   and where it leads: the next incident, or orbit. */
const yearOf = (s, id) => { const q = V(s).incs || [], k = q.indexOf(id), Y = s.world.transit.years, half = Math.floor(Y / 2);
  const lo = q.length > 1 && k === 1 ? Math.min(Y - 1, half + 1) : 2, hi = q.length > 1 && k === 0 ? Math.max(lo, half) : Math.max(lo, Y - 1);
  return lo + Math.floor(LF.rand(s) * (hi - lo + 1)); };
const inc = (id, title, o) => add(Object.assign({ id: 'voy.' + id, arc: 'setup', view: 'colony', tone: 'pressure', chain: true, title,
  setup: s => ({ yr: yearOf(s, 'voy.' + id) }) }, o));
const year = (s, c) => `Year ${c.yr} of the crossing.`;
const after = s => { const q = V(s).incs || [], k = q.indexOf(s.cur.id); return (k >= 0 && q[k + 1]) || 'arrive.name'; };
const end = fx => Object.assign({ then: after }, fx);
inc('cryo', 'Bank C', {
  text: (s, c) => `${year(s, c)} ${s.premise === 'cryo' ? 'It is bank C again.' : 'There is an alarm in the cryo bay.'} A coolant line has split above forty sleepers, and their pods are warming by a degree an hour.\n\n${awake(s)}`,
  choices: [
    { label: 'Patch it with pipe cut from the next bank', dark: true, note: 'There is no rated pipe left in stores. The next bank\'s loop has the right bore, and eight sleepers on it.', info: [['yield', 'The forty'], ['danger', 'Eight sleepers on the robbed loop']],
      out: end({ text: 'A length is cut from the next bank\'s loop and brazed in over the split. The forty sleep through it. The eight on the robbed loop warm over two days, and their pods are logged as lost to the same fault.', fx: { sleepers: -8, stain: ['coolant', 1] } }) },
    { label: 'Move the forty to a sound bank, pod by pod', note: 'It costs nothing if it is done in time, and it is one trolley and four hundred metres of spine.', info: [['danger', 'Whoever is still in the row when the time runs out']], test: { base: 52, mods: WATCH },
      ok: end({ text: s => `Forty pods are walked down the spine of the ship on a hand trolley and plugged in one at a time. None are lost. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The trolley takes one pod at a time and the warming does not wait. Eleven are past saving when their turn comes. ${went(s, 'bad')}`, fx: { sleepers: -11 } }) },
    { label: 'Shut off the worst row and save the rest', dark: true, note: 'Six sleepers die, for certain, and somebody has to pick which row is the worst.', info: [['yield', 'Thirty-four, for certain'], ['danger', 'Six sleepers']], out: end({ text: 'The six pods nearest the split are shut off and their coolant fed to the others. The six names are written in the log by hand.', fx: { sleepers: -6, stain: ['row', 1] } }) },
  ] });
inc('patch', 'The Patch', {
  text: (s, c) => `${year(s, c)} The patch over the meteor hole has lifted at one corner, and the forward section is losing air.\n\n${awake(s)}`,
  choices: [
    { label: 'Seal the forward section for good', note: 'Whatever is stored forward of the doors is lost.', out: end({ text: 'The doors are welded shut. The plate stock in the forward bays stays where it is, in vacuum, for good, and so do the forward seed lockers. The colony will sow less than it meant to.', fx: { mat: -14, food: -60 } }) },
    { label: 'Order the best welder out with no tether', dark: true, note: 'The corner is past the reach of a line. The best welder aboard knows that, and has said no once.', info: [['yield', 'The forward section, whole'], ['danger', 'The welder']], test: { base: 64, mods: WATCH },
      ok: end({ text: s => `The corner is welded down under a second plate, and it holds. The welder comes in along the hull hand over hand and does not speak to the watch officer for the rest of the year. ${went(s, 'ok')}`, fx: { stain: ['ordered_out', 1] } }),
      bad: end({ text: s => `The welder loses the hull at the torn edge of the patch, with nothing to come back on. The weld is finished by the next best, on a line that does not reach, with a second line tied to the first. ${went(s, 'bad')}`, fx: { pop: -1, morale: -2, stain: ['ordered_out', 1] } }) },
    { label: 'Shut the doors now, with the two who are working forward', dark: true, note: 'Waiting for them to come back costs the air in three more sections. Nothing else is lost.', info: [['danger', 'Two of the watch']],
      out: end({ text: 'The doors close on the count, as the drill says they must. The two forward have about four minutes of air, and are on the intercom for all of it. The stores forward of the doors are recovered a week later, by people in suits.', fx: { pop: -2, morale: -1, mat: 6, stain: ['doors', 1] } }) },
  ] });
inc('bearing', 'The Third Bearing', {
  text: (s, c) => `${year(s, c)} ${s.premise === 'engine' ? 'The engineers promised this engine one burn, and it is not finished yet. ' : ''}The main engine's third bearing is running hot${V(s).mode === 'hot' ? ', as the engineers said it would,' : ''} and the temperature is still climbing.\n\n${awake(s)}`,
  choices: [
    { label: 'Throttle back and take longer', note: 'The sleepers spend more years in the cold.', out: end({ text: s => `The engine is eased to two-thirds, and the bearing cools. The crossing will take ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''}, and the cryo banks have to last them.`,
      fx: s => ({ sleepers: -3, chips: [[`${longer(s, 0.15)} year${longer(s, 0.15) > 1 ? 's' : ''} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Send someone into the housing with the shaft turning', dark: true, note: 'Stopping the shaft to repack it costs the years. Nobody who has seen the housing will go in by choice.', info: [['yield', 'No time lost, no sleepers lost'], ['danger', 'Whoever is sent in']], test: { base: 58, mods: WATCH },
      ok: end({ text: s => `The youngest of the engine watch is sent, being the narrowest. It takes nine hours with the shaft turning a hand's width away. The temperature comes down and stays down. ${went(s, 'ok')}`, fx: { stain: ['ordered_in', 1] } }),
      bad: end({ text: s => `The youngest of the engine watch is sent, being the narrowest, and is caught by the shaft in the seventh hour. The bearing is repacked by the one who goes in to clear it, with spares that were set aside for the reactor. ${went(s, 'bad')}`, fx: { pop: -1, parts: -5, machine: { reactor: -6 }, stain: ['ordered_in', 1] } }) },
    { label: 'Run the cryo coolant through the bearing', dark: true, note: 'It is the only cold on the ship in that quantity. The bank it comes from will not stay cold without it.', info: [['danger', 'Twelve sleepers']],
      out: end({ text: 'The coolant from the nearest bank is piped through the bearing housing, and the temperature drops inside the hour. The twelve pods on that loop warm past recovery over the following day. The engine does not lose a minute.', fx: { sleepers: -12, stain: ['coolant', 1] } }) },
  ] });
inc('mould', 'Grey in the Stores', {
  text: (s, c) => `${year(s, c)} The grey mould is back, in the dry stores this time. Three bays show it, and there is no telling how far it has spread.\n\n${awake(s)}`,
  choices: [
    { label: 'Burn all three bays', note: 'It is certain, and it costs everything in them.', out: end({ text: 'Three bays of sacks go out through the lock and burn off in the drive plume. The mould is not seen again. The colony will land with a month less in the hold than it counted on, and the first to feel a short month are the ones who were thin already.', fx: { food: -220 } }) },
    { label: 'Open every sack and sort it by hand', test: { base: 50, mods: WATCH },
      ok: end({ text: s => `It takes two months. Most of what was in the three bays is clean and goes back on the shelves. ${went(s, 'ok')}`, fx: { food: -50 } }),
      bad: end({ text: s => `By the time the sorting is finished the mould is in the sorted sacks, and in the hydroponics bay again. ${went(s, 'bad')}`, fx: { food: -300, machine: { hydroponics: -6 } } }) },
    { label: 'Feed the doubtful sacks to the watch, and do not tell them which', dark: true, note: 'Nobody knows what the mould does to a person. This is how to find out which sacks to keep.', test: { base: 60, mods: [] }, info: [['yield', 'Most of the stores kept'], ['danger', 'The watch']],
      ok: end({ text: 'The watch eats from the grey sacks for a month and logs every stomach ache. Nothing worse comes of it. Two bays in three go back on the shelves.', fx: { food: -50, stain: ['taster', 1] } }),
      bad: end({ text: 'By the third week two of the watch cannot keep water down, and by the fifth they are dead. It is now known exactly which sacks to burn.', fx: { food: -100, pop: -2, morale: -2, stain: ['taster', 2] } }) },
  ] });
inc('pursuit', 'A Light Astern', {
  text: (s, c) => `${year(s, c)} There has been a drive flare on the stern scope for three weeks, on the ship's own heading and closing. Its spectrum matches the beacon's.\n\n${awake(s)}`,
  choices: [
    { label: 'Go dark and coast', note: 'The cryo banks run warm while the reactor is banked.', out: end({ text: 'The engine is shut down and the reactor banked. The flare passes a long way off and keeps going. The cryo banks ran warm for the weeks it took, and four sleepers did not come through.', fx: { sleepers: -4 } }) },
    { label: 'Burn hard and outrun it', test: { base: 52, mods: WATCH },
      ok: end({ text: s => `The engine is run flat out for six days. The flare falls behind, and then off the bottom of the scope. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The flare falls behind in the end. The reactor fed the engine everything it had for those six days, and shows it. ${went(s, 'bad')}`, fx: { parts: -4, machine: { reactor: -8 } } }) },
    { label: 'Cut a cryo bank loose as a decoy', dark: true, note: 'Twenty pods, warm, on their own power, drifting. Anything hunting by heat will go to them first.', info: [['danger', 'Twenty sleepers']],
      out: end({ text: 'The bank is blown free on its own cells and the ship coasts cold behind it. The flare changes course toward it. Eleven days later the bank stops transmitting.', fx: { sleepers: -20, parts: 3, stain: ['decoy', 2] } }) },
  ] });
inc('drift', 'The Fix', {
  text: (s, c) => `${year(s, c)} The star fix is off again. The error is small, and it grows every day it is flown.\n\n${awake(s)}`,
  choices: [
    { label: 'Stop the burn and take a month of sightings', note: 'It costs a month of stores and gives a heading that can be trusted.', out: end({ text: 'The engine is shut down for a month while every star in the catalogue is sighted twice. The new heading is good.', fx: { food: -110 } }) },
    { label: 'Correct on the navigators\' best reckoning', test: { base: 50, mods: WATCH },
      ok: end({ text: s => `The correction is two degrees, made in an afternoon. The next fix lands where it should. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The correction was out by half. It takes ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''} to fly back onto the line. ${went(s, 'bad')}`,
        fx: s => ({ sleepers: -5, food: -60, chips: [[`${longer(s, 0.15)} year${longer(s, 0.15) > 1 ? 's' : ''} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Thaw the mission\'s first navigator', dark: true, note: 'The best eye for a star fix the ship ever had, seventy-one years old, and too old to go under a second time.', info: [['yield', 'A heading that can be trusted'], ['danger', 'The navigator']],
      out: end({ text: 'The old navigator is thawed, takes eleven days over the sightings, and gives a heading that holds. There is no going back under at that age, and the navigator was told so before agreeing. The navigator stands watches from a chair after that, and dies two years short of orbit.', fx: { sleepers: -1, survey: 4, stain: ['navigator', 1] } }) },
  ] });
inc('wake', 'The Ones Who Cannot Sleep', {
  text: (s, c) => `${year(s, c)} Three of the watch have stopped sleeping. They sit in the mess through ship's night and talk about the dead world: what killed it, and whether the next one will be dead when the ship gets there.${V(s).mode === 'thin' ? ' On a skeleton watch, that is both of the watch and one more who should be asleep.' : ''}`,
  choices: [
    { label: 'Put all three back under, by force if it comes to that', dark: true, note: 'They have said they will not go. A second freeze inside a year kills about one in three.', info: [['yield', 'A watch that sleeps'], ['danger', 'One of the three, most likely']],
      out: end({ text: 'It comes to force for two of them. The three are sedated in the mess and carried down to the bay. One pod shows a flat line before the lid is cold. The replacements are told everything except why they were woken early, and work it out within the week.', fx: { pop: -1, sleepers: 2, morale: -1, stain: ['refreeze', 1], chips: [['Two of the watch back in the cold', false]], do: s => { s.pop = Math.max(0, s.pop - 2); } } }) },
    { label: 'Dose them, and keep them on the array', dark: true, note: 'The drug store has enough to keep three people quiet and working for a year. It was packed for surgery on the ground.', info: [['yield', 'A survey of the new star'], ['danger', 'The three, and the drug store']], test: { base: 58, mods: WATCH },
      ok: end({ text: s => `They are dosed at every meal and set to the array's readings of ${s.world.star}. They work slowly and say very little, and the ship arrives with a better survey of the new world than it had. None of the three is quite the same person afterwards. ${went(s, 'ok')}`, fx: { survey: 6, machine: { medbay: -5 }, stain: ['sedated', 1] } }),
      bad: end({ text: s => `They are dosed at every meal and set to the array. In the fourth month one of the three saves a week of doses and takes them together, and leaves the survey notes squared on the mess table. ${went(s, 'bad')}`, fx: { pop: -1, morale: -2, machine: { medbay: -5 }, stain: ['sedated', 1] } }) },
    { label: 'It spreads by talking. Put them out of the lock', dark: true, note: 'Three people, tonight, before the rest of the watch has heard any more of it.', info: [['danger', 'Three of the watch']],
      out: end({ text: 'It is done at ship\'s night by the two steadiest of the watch, who are told it is an order and given no time to think about it. The rest of the watch sleeps again after that.', fx: { pop: -3, morale: -1, food: 40, stain: ['lock', 2] } }) },
  ] });
inc('rock', 'A Grain of Rock', {
  text: (s, c) => `${year(s, c)} Something the size of a grain of rice has gone through the hangar bay, and through the lander's flank on its way.\n\n${awake(s)}`,
  choices: [
    { label: 'Seal the bay and leave the lander until orbit', note: 'It sits in vacuum for the rest of the crossing.', out: end({ text: 'The bay is sealed. The lander sits in vacuum for the rest of the crossing, and its seals age faster than they were meant to. Every flight it will not now make is twenty sleepers who stay in orbit.', fx: { machine: { lander: -10 }, cap: { lander: -4 } } }) },
    { label: 'Repair it now, in the bay', cost: { parts: 3 }, test: { base: 58, mods: WATCH },
      ok: end({ text: s => `The puncture is cut out and plated, and every seal near it replaced. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The plate goes on, but the pressure test afterwards finds what the grain did further in, and there is nothing in stores for that. ${went(s, 'bad')}`, fx: { machine: { lander: -6 } } }) },
    { label: 'Order someone into a suit, with the bay still open to space', dark: true, note: 'It saves the parts and the week of pumping down. The suit seals are forty years old, and the watch has refused them once.', info: [['yield', 'The Lander, for nothing'], ['danger', 'Whoever is in the suit']], test: { base: 62, mods: WATCH },
      ok: end({ text: s => `Four hours in a suit inside the lander's flank, working by helmet lamp. The puncture is closed from within and holds at test. ${went(s, 'ok')}`, fx: { machine: { lander: 3 }, stain: ['ordered_out', 1] } }),
      bad: end({ text: s => `A wrist seal goes in the third hour. The one in the suit finishes the weld before the air runs out, and does not get back to the lock. The lander is sound. ${went(s, 'bad')}`, fx: { pop: -1, morale: -1, stain: ['ordered_out', 1] } }) },
  ] });
inc('fab', 'The Bracket', {
  text: (s, c) => `${year(s, c)} The fabricator has been printing the same bracket for six days. It was not asked to, and it will not stop.\n\n${awake(s)}`,
  choices: [
    { label: 'Cut its power for the rest of the crossing', note: 'A machine like that does not like standing cold for years.', out: end({ text: 'It is shut down cold, with a bracket half printed, and it will need work before it runs again. Nothing that breaks for the rest of the crossing can be printed, and two things do.', fx: { machine: { fabricator: -8 }, parts: -3 } }) },
    { label: 'Open the controller and find the fault', test: { base: 55, mods: WATCH },
      ok: end({ text: s => `It is a stuck relay, found on the second day. The brackets are melted down for stock. ${went(s, 'ok')}`, fx: { parts: 2 } }),
      bad: end({ text: s => `The fault is found, after two boards are burned out on the way to it. ${went(s, 'bad')}`, fx: { parts: -4 } }) },
    { label: 'The thinnest of the watch goes in through the feed chute while it prints', dark: true, note: 'The jam is behind the head. Powering down to reach it is what a machine like this does not forgive. The thinnest of the watch is nineteen and has not been asked.', info: [['yield', 'The Fabricator, never switched off'], ['danger', 'Whoever goes in']], test: { base: 62, mods: WATCH },
      ok: end({ text: s => `The thinnest of the watch goes in feet first with a pick and a lamp, timing the head as it passes. The relay is freed in twenty minutes, and six days of brackets are melted down for stock. ${went(s, 'ok')}`, fx: { parts: 5, stain: ['ordered_in', 1] } }),
      bad: end({ text: s => `The head catches an arm and does not stop. The fabricator is shut down cold to get the body out, which was what the job was meant to avoid. ${went(s, 'bad')}`, fx: { pop: -1, morale: -1, machine: { fabricator: -8 }, stain: ['ordered_in', 1] } }) },
  ] });

/* Seven more incidents (2026-11-15), open to any crossing; the way across tilts which (MODES[].tilt). */
inc('fire', 'Fire in the Racks', {
  text: (s, c) => `${year(s, c)} A lamp ballast in the hydroponics bay, years past its rated life, has shorted and set the racks alight. The bay's own extinguishers emptied in the first minute, and the smoke is in the vents.\n\n${awake(s)}`,
  choices: [
    { label: 'Vent the bay to space', note: 'The fire goes out in a breath, and so does every rack in the bay. The colony lands without the crop it was counting on.', info: [['danger', 'The first harvest']],
      out: end({ text: 'The outer door is opened and the bay empties in one breath. The racks are black and frozen when the watch goes in. For the rest of the crossing the watch eats from sealed stores, and the colony will land that much shorter.', fx: { food: -150, machine: { hydroponics: -6 } } }) },
    { label: 'Fight it from the door', note: 'Hoses from the galley and the cryo bay, and whoever is nearest.', test: { base: 54, mods: WATCH }, info: [['danger', 'Whoever is nearest']],
      ok: end({ text: s => `The fire is out in forty minutes, with a third of the racks lost. ${went(s, 'ok')}`, fx: { food: -50 } }),
      bad: end({ text: s => `The fire gets into the lamp feeds and runs along the ceiling. It is out in the end, with most of the racks gone, and one of the watch dies of the smoke two days later. ${went(s, 'bad')}`, fx: { pop: -1, food: -110, machine: { hydroponics: -4 } } }) },
    { label: 'Draw the air off through bank E', dark: true, note: 'The bay shares a scrubber line with bank E. Pull its air through the line and the fire smothers with the racks still whole. The eight pods on that line will not come through it.', info: [['yield', 'The racks, nearly all of them'], ['danger', 'Eight sleepers on the line']],
      out: end({ text: 'The scrubber valves are opened wide. The fire dies down to smoke in a quarter of an hour, and the racks come through it scorched and alive. The eight pods on the line foul over the following week and are logged as lost to the fire.', fx: { sleepers: -8, food: -20, stain: ['scrubbed', 1] } }) },
    { label: 'Vent it now, with the two at the back still inside', dark: true, note: 'Two of the watch are at the far racks, which have not caught. Opened now, the bay loses the front racks only. Waiting for the two costs the rest.', info: [['yield', 'Half the racks'], ['danger', 'The two at the back']],
      out: end({ text: 'The door is opened on the count. The fire goes out before it reaches the far racks, and their sealed trays come through the cold. The two at the back are brought in from the bay a day later, by people in suits.', fx: { pop: -2, morale: -1, food: -40, stain: ['vented', 1] } }) },
  ] });
inc('ledger', 'The Short Count', {
  text: (s, c) => `${year(s, c)} The quartermaster's monthly count is a month short, and has been getting shorter since spring. The foil wrappers turn up under a mattress in one bunk on the watch.\n\n${awake(s)}`,
  choices: [
    { label: 'Log it, and cut that share until orbit', note: 'The one whose bunk it was eats half rations for the rest of the crossing, in front of the whole watch.', info: [['danger', 'The one whose bunk it was'], ['danger', 'A watch that counts plates']],
      out: end({ text: 'It goes in the log with the name beside it. The thief eats half rations at the same table as everyone else, and the watch starts weighing its portions.', fx: { food: -60, morale: -2 } }) },
    { label: 'Put the thief back in the cold', dark: true, note: 'A second freeze inside a year kills about one in three. The watch will not have to look at the thief again.', test: { base: 66, mods: [] }, info: [['yield', 'The stores safe'], ['danger', 'The thief']],
      ok: end({ text: 'The thief is sedated and put under in a spare pod. The lid frosts over as it should, and the watch rota is redrawn without the name.', fx: { food: -40, pop: -1, sleepers: 1, stain: ['put_under', 1] } }),
      bad: end({ text: 'The thief is sedated and put under in a spare pod, and the pod shows a flat line before morning. The watch rota is redrawn without the name.', fx: { food: -40, pop: -1, stain: ['put_under', 1] } }) },
    { label: 'Cut everyone\'s ration, and say it was short-packed at launch', dark: true, note: 'The shortfall is made good and the thief keeps working. The rest of the watch goes hungrier on a lie, and the quartermaster has to keep it.', info: [['yield', 'The count made good'], ['danger', 'The whole watch, thinner']],
      out: end({ text: 'The new ration goes up on the galley board with a note from the quartermaster about the launch manifest. The watch grumbles about Earth and eats less. The wrappers stop turning up.', fx: { food: 20, morale: -1, stain: ['short_packed', 1] } }) },
  ] });
inc('spine', 'The Spine', {
  text: (s, c) => `${year(s, c)} Forty years of heating and cooling have cracked a weld in the spine between the two rings. The forward ring has started to wobble on its bearings, and the crack grows every time it turns.\n\n${awake(s)}`,
  choices: [
    { label: 'Stop the ring and weld it in free fall', note: 'Everyone in the forward ring moves aft, and the watch works without weight for the year it takes. They will land weak.', info: [['danger', 'The watch, a year without weight'], ['danger', 'The autodoc']],
      out: end({ text: 'The ring is spun down and the crack welded from both sides. The watch lives a year without weight and comes back to the ring with thin bones, and the autodoc spends a long time on them.', fx: { morale: -2, parts: -3, machine: { medbay: -6 } } }) },
    { label: 'Weld it with the ring turning', note: 'The welder works where the ring meets the spine, a metre from the spin.', test: { base: 55, mods: WATCH }, info: [['danger', 'The welder']],
      ok: end({ text: s => `The weld is laid in three shifts with the ring turning beside it. It holds. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The welder's line fouls on the turning ring. The weld is finished by the next one out, with spares from the reactor's store. ${went(s, 'bad')}`, fx: { pop: -1, parts: -4 } }) },
    { label: 'Cut the forward ring loose, with bank F in it', dark: true, note: 'Twenty-two sleepers in bank F cannot be moved in time. Without the ring\'s weight the ship crosses faster, and the crack stops mattering.', info: [['time', 'The crossing shorter'], ['yield', 'Salvage from the ring'], ['danger', 'Twenty-two sleepers']],
      out: end({ text: s => `The forward ring is stripped of everything that can be carried and cut free with the pods still on its power. It falls behind slowly, and its beacon is switched off on the second day. The lighter ship makes orbit ${yrs(longer(s, 0.1))} sooner.`,
        fx: s => ({ sleepers: -22, parts: 4, mat: 10, stain: ['ring', 2], chips: [[`${yrs(longer(s, 0.1))} sooner`, true]], chron: 'On the crossing, the forward ring was cut loose with bank F still in it.', do: s2 => { s2.world.transit.years -= longer(s2, 0.1); } }) }) },
    { label: 'Wake ten sleepers to hold the spine by hand', dark: true, note: 'Ten from the banks, woken without being asked, to brace and reweld the crack in shifts until orbit. The spine is cold and takes the drive\'s dose. Few of the ten will see the ground.', info: [['yield', 'The ring, and everyone in it'], ['danger', 'Ten sleepers, woken for it']],
      out: end({ text: 'Ten pods are opened, and the ten are told what the job is once they can stand. They brace the spine in shifts for the rest of the crossing. Four of them come down with the colony.', fx: { sleepers: -10, pop: 4, parts: -2, stain: ['spine_crew', 1] } }) },
  ] });
inc('sick', 'The Fever', {
  text: (s, c) => `${year(s, c)} One of the watch came up from the last thaw carrying something the cold had kept asleep. Three of the watch have a fever now, and the medic cannot name it.\n\n${awake(s)}`,
  choices: [
    { label: 'Isolate the three and treat them', note: 'The autodoc\'s drug store goes on three people, and whoever nurses them is next.', test: { base: 56, mods: WATCH }, info: [['danger', 'The drug store'], ['danger', 'Whoever nurses them']],
      ok: end({ text: s => `The fever breaks in the second week, in all three. The drug store is a good deal lighter. ${went(s, 'ok')}`, fx: { machine: { medbay: -6 } } }),
      bad: end({ text: s => `It goes through the nurse as well before it breaks, and two of the four die. ${went(s, 'bad')}`, fx: { pop: -2, morale: -1, machine: { medbay: -6 } } }) },
    { label: 'Seal them in their bunks and wait', dark: true, note: 'Nothing from the drug store is spent and nobody else goes near them. The three are on their own.', info: [['yield', 'The drug store, whole'], ['danger', 'The three']],
      out: end({ text: 'The bunk doors are locked from outside and food goes in through the hatch. Two of the three are dead within the fortnight. The third comes out thin and does not speak to the watch officer again.', fx: { pop: -2, morale: -1, stain: ['sealed_sick', 1] } }) },
    { label: 'Wake sleepers to try the doses on', dark: true, note: 'The medic does not know which drug works. Six from the banks, woken and given the fever, would show it before the three are past saving.', info: [['yield', 'The three, and a known cure'], ['danger', 'Six sleepers']],
      out: end({ text: 'Six are thawed in the cold bay and given the fever on purpose, two to a drug. By the tenth day it is plain which one works, and the three on the watch are given it. Four of the six are dead by then. The two who lived join the watch.', fx: { sleepers: -6, pop: 2, machine: { medbay: -2 }, stain: ['tried_on', 2] } }) },
  ] });
inc('dust', 'The Dust Lane', {
  text: (s, c) => `${year(s, c)} The heading crosses a lane of dust the long-range array never resolved. The forward shield is losing a millimetre a week, and the lane is months wide.\n\n${awake(s)}`,
  choices: [
    { label: 'Turn wide around it', note: 'It adds time, and the sleepers spend it in the cold.', info: [['danger', 'Sleepers, in the extra years']],
      out: end({ text: s => `The ship comes about and goes the long way round the lane. The crossing will take ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''}, and the cryo banks have to last them.`,
        fx: s => ({ sleepers: -5, chips: [[`${yrs(longer(s, 0.15))} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Hold course behind the shield', test: { base: 50, mods: WATCH }, info: [['danger', 'The reactor']],
      ok: end({ text: s => `The shield is worn to a sliver when the ship comes out of the lane, and it holds. ${went(s, 'ok')}` }),
      bad: end({ text: s => `A grain gets through where the shield is thinnest and goes on through the reactor's cooling jacket. ${went(s, 'bad')}`, fx: { parts: -4, machine: { reactor: -8 } } }) },
    { label: 'Turn the ship and take it on the cryo banks', dark: true, note: 'The banks carry more armour than the shield has left. Put them forward, and the dust works on the pods for months instead.', info: [['yield', 'No time lost, the shield whole'], ['danger', 'The sleepers in the forward banks']],
      out: end({ text: 'The ship is turned so the banks face the lane. For four months the pod alarms go off one at a time, and the watch silences each one. Eighteen pods are logged as lost.', fx: { sleepers: -18, stain: ['banks_forward', 1] } }) },
    { label: 'Send two out to hang plate ahead of the shield', dark: true, note: 'Spare plate can be hung forward by hand. The two picked know what dust like this does to a suit.', test: { base: 60, mods: WATCH }, info: [['yield', 'The shield, and no time lost'], ['danger', 'The two on the hull']],
      ok: end({ text: s => `Two go out on lines and hang the plate in nine hours, with the dust ticking on their visors. Both come back in. ${went(s, 'ok')}`, fx: { mat: -6, stain: ['ordered_out', 1] } }),
      bad: end({ text: s => `The plate goes up. One of the two is holed through the suit an hour from the lock, and the other brings the body in. ${went(s, 'bad')}`, fx: { pop: -1, mat: -6, morale: -1, stain: ['ordered_out', 1] } }) },
  ] });
inc('dead', 'The Cold Bay', {
  setup: s => ({ yr: yearOf(s, 'voy.dead'), n: Math.max(12, s.world.transit.lostS + 4), d: V(s).mode === 'lean' }),
  text: (s, c) => `${year(s, c)} The pods that failed on the voyage still hold their dead, ${c.n} of them${c.d ? ', and the forty from bank D besides' : ''}, kept in the mortuary bay to be buried on the new world. The bay's refrigeration has failed, and the hydroponics is short of everything a body is made of.\n\n${awake(s)}`,
  choices: [
    { label: 'Give them to space, with the rites', note: 'It is what the mission promised the families. The trays stay short, and the colony lands with less.', info: [['danger', 'The trays, and the first harvest']],
      out: end({ text: 'The bodies go out through the lock one at a time, with a name read for each, over three ship\'s days. The hydroponics stays short for the rest of the crossing.', fx: { food: -80, morale: 1 } }) },
    { label: 'Keep them cold on bank power', note: 'A spare bank can hold them until there is ground to bury them in. Its power comes from the banks beside it.', info: [['danger', 'Sleepers on the banks beside it']],
      out: end({ text: 'The dead are moved into a spare bank and kept cold on power drawn from its neighbours. They will come down with the colony to be buried. Three of the living sleepers do not come through the load.', fx: { sleepers: -3, morale: 2 } }) },
    { label: 'Put them through the reclaimer for the trays', dark: true, note: 'Every body is feed the hydroponics needs. The families are asleep, and the log can say space.', info: [['yield', 'A full hydroponics bay'], ['danger', 'What the families are told']],
      out: end({ text: 'The reclaimer takes them over a month. The trays come up green and heavy, and the log says they were committed to space with the rites.', fx: { food: 110, stain: ['reclaimed', 2] } }) },
  ] });
inc('petition', 'The Petition', {
  text: (s, c) => `${year(s, c)} Half the watch has signed a petition and pinned it to the mess door. Their partners and children are in bank C, and the latest pod report puts bank C at a failure a year. They want their families woken now, out of turn, onto rations meant for the watch.\n\n${awake(s)}`,
  choices: [
    { label: 'Refuse, and post the reason', note: 'The stores cannot carry them. The signers will work for the rest of the crossing knowing their families are in the bank that fails.', info: [['danger', 'The signers\' families'], ['danger', 'The watch\'s goodwill']],
      out: end({ text: 'The answer is posted beside the petition. The signers keep working and do no more than they must, and the machines show it. Two of their families are among the pods bank C loses before orbit.', fx: { sleepers: -2, morale: -3, do: s => allMachines(s, -2) } }) },
    { label: 'Wake the families', note: 'Eleven more awake for the rest of the crossing, eating. The colony lands with less, and everyone else in bank C waits their turn.', info: [['yield', 'Eleven lives, and grateful hands'], ['danger', 'The stores']],
      out: end({ text: 'Eleven pods are opened. The mess is loud for the first time in years, and the stores ledger drops a line a week faster.', fx: { sleepers: -11, pop: 11, food: -180, morale: 2 } }) },
    { label: 'Tell the signers their families died in year nine', dark: true, note: 'The pod report can be made to say it. The petition ends tonight, and the families sleep on in the bank that fails.', info: [['yield', 'The petition over, the stores whole'], ['danger', 'The signers, and the truth']],
      out: end({ text: 'The physician changes the report and reads it out in the mess. The petition comes off the door that night. The signers are back at work the next morning.', fx: { morale: -1, stain: ['false_dead', 2] } }) },
    { label: 'Put the three who drafted it back under', dark: true, note: 'A second freeze inside a year kills about one in three. Without the three, the rest will not push it.', info: [['danger', 'The three who drafted it']],
      out: end({ text: 'The three are sedated at their next meal and carried down to the bay. One pod shows a flat line before the lid is cold. The petition is gone from the door by morning.', fx: { pop: -3, sleepers: 2, morale: -2, stain: ['drafters', 1] } }) },
  ] });

/* ---- orbit: the world gets a name. Four put forward, each with where it came from: two from the generator, two
   that only this kind of world would be called, and in about half the runs the catalogue designation itself in
   place of one of them. Nobody wins or loses by it; it is the player's to name. ---- */
const CALLED = {
  barren: ['Cinder', 'Flint', 'Dry Harbour', 'Ochre', 'Long Wind', 'Slate', 'Thirst', 'Bare Mercy'],
  ruin: ['Afterward', 'Second Tenancy', 'Reliquary', 'Old Works', 'Inheritance', 'Cenotaph', 'Latecomer', 'Palimpsest'],
  ice: ['Hoarfrost', 'Rime', 'Coldharbour', 'Long Winter', 'White Mercy', 'Wintering', 'Glass Harbour', 'Thule'],
  drowned: ['Soundings', 'Tidewater', 'Fathom', 'High Water', 'Shoal', 'Landless', 'Blue Mercy', 'Archipelago'],
  jungle: ['Verdure', 'Greenhold', 'Fever Coast', 'Canopy', 'Wet Season', 'Tangle', 'Overgrowth', 'Hothouse'],
  garden: ['Meadowsweet', 'Good Hope', 'Windfall', 'Arcadia', 'Plenty', 'Soft Landing', 'Fair Field', 'Homecoming'],
};
const CATALOGUE = 'Official catalogue name';
const FROM = ['Current voted front runner', 'Watch officer\'s draft name', 'Senior crew\'s favourite', 'From the mission\'s naming list', 'The survey team\'s working name',
  'From the suggestion box sealed at launch', 'Said at the viewport, and it stuck', 'Drawn from a hat in the mess', 'What the engine room calls it', 'The navigators\' choice'];
add({ id: 'arrive.name', arc: 'setup', view: 'world', tone: 'council', chain: true, title: 'A Name for It',
  setup: s => { const w = s.world, t = w.transit; s.arrival = true; t.lostS = Math.max(0, t.s0 - s.sleepers); t.lostP = Math.max(0, t.p0 - s.pop);
    const own = CALLED[w.type].slice(), a = own.splice(Math.floor(LF.srand(s) * own.length), 1)[0], b = own[Math.floor(LF.srand(s) * own.length)];
    const r1 = w.sid || LF.planetName(`${s.seed}/n0`, [a, b]), r2 = LF.planetName(`${s.seed}/n1`, [a, b, r1]);
    const from = FROM.slice(), tag = () => from.splice(Math.floor(LF.srand(s) * from.length), 1)[0];
    const names = [r1, r2, a, b].map(n => ({ n, from: tag() }));
    if (LF.srand(s) < 0.5) names.splice(Math.floor(LF.srand(s) * 4), 1, { n: w.planet, from: CATALOGUE, cat: true });
    return { names, cat: w.planet }; },
  text: (s, c) => `The survey is in. The catalogue lists this world as ${c.cat}.\n\nThe crew have put forward names, and four are still on the board. Pick one.`,
  choices: [0, 1, 2, 3].map(i => ({ label: (s, c) => c.names[i].n, note: (s, c) => `${c.names[i].from}.`,
    out: { then: s => V(s).next || 'landfall.site', text: (s, c) => c.names[i].cat ? `The world keeps its catalogue designation, ${c.names[i].n}, and it goes into the log as the name.` : `${c.names[i].n}. It goes into the log, and by the end of the watch it is the only name in use.`,
      fx: (s, c) => ({ do: s2 => { s2.world.catalogue = c.cat; s2.world.planet = c.names[i].n; s2.arrival = false; LF.orbitChron(s2); } }) } })) });
})();

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
  text: s => { const n = s.people.filter(p => p.seat && p.role && p.alive).length, W = ['none', 'one', 'two', 'three', 'four', 'five', 'six']; return `The ${s.world.ship} holds orbit, and all ${W[n]} of your officers are awake for it. The lander goes down once with the reactor and the first sixty, and it has seats for three of ${n === 6 ? 'the six' : `them. ${W[6 - n].charAt(0).toUpperCase() + W[6 - n].slice(1)} of the six did not live to see orbit, and nobody has ${6 - n === 1 ? 'that seat' : 'those seats'}`}. The three you take run the colony's first months with you. Each of them is one department that works from the first day.\n\nThe other ${n - 3 === 1 ? 'one stays' : W[n - 3] + ' stay'} aboard and keep${n - 3 === 1 ? 's' : ''} the ship: the sleepers, the systems still in the hold, the lander's turnarounds. Each shuttle run can bring one of them down, and the lander has fuel for three. Whatever they are for, the colony does badly without it until they are down.\n\nChoose three.`; },
  choices: [0, 1, 2, 3, 4, 5].map(slot),
  confirm: (s, c, picked) => { const go = picked.map(k => byPid(s, s.slate[0][k])), stay = s.people.filter(q => q.seat && q.alive && !go.includes(q));
    return { label: and3(go.map(p => p.name)), then: LF.byId['setup.sys'] ? 'setup.sys' : 'setup.hold1',
      text: `${and3(go.map(p => p.name))} are brought up out of the cold, and are on the lander's manifest by midnight.\n\n${and3(stay.map(q => q.name))} stay${stay.length === 1 ? 's' : ''} aboard to run the ship. ${and3(stay.map(q => LF.SEATS[q.seat].name))} below will be run by whoever is next on the list, until a shuttle run brings its officer down.`,
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
   carries through: each has its own incident, the likeliest one but not the only one.

   The key crew (Lachlan, 2026-11-17; DESIGN.md "The key crew and the watch"): the ship is kept by the six officers, two
   awake at a time, each for two years: a year with the one before and a year with the one after (LF.watchOf). An
   incident happens to the two who have the watch that year, by name; they wake you, and whichever officer the trouble
   belongs to (the incident's seat). So it is the six who weld the patch and catch the fever. An officer who goes in
   person can be hurt or killed by a bad turn: the dice for that are thrown when the card is dealt (c.fate), so the
   words and the effect agree (dies). Never more than two of the six before landfall (FLOOR). */
const { If } = h;
const V = s => s.voyage || {};
const allMachines = (s, d) => { for (const id in s.machines) LF.hurt(s, id, d); };
const hsh = t => { let x = 2166136261; for (const c of String(t)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
const NUMW = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];
const SHE = { solheim: 1, nakamura: 1 };
const he = p => SHE[p.key] ? 'she' : 'he', him = p => SHE[p.key] ? 'her' : 'him', his = p => SHE[p.key] ? 'her' : 'his';
const living = s => s.people.filter(p => p.seat && p.role && p.alive);
/* The order the six stand their watches in, fixed for the game from the seed (no dice). */
LF.watchRing = function (s) { const v = s.voyage; if (!v) return living(s);
  if (!v.ring) { const k = LF.SEAT_ORDER.slice(); let x = hsh(s.seed + '/watch'); for (let i = k.length - 1; i > 0; i--) { const q = x % (i + 1); [k[i], k[q]] = [k[q], k[i]]; x = Math.imul(x ^ (x >>> 13), 0x5bd1e995) >>> 0; } v.ring = k; }
  return v.ring.map(seat => living(s).find(p => p.seat === seat)).filter(Boolean); };
/* The two awake in a given year of the crossing. */
LF.watchOf = function (s, yr) { const r = LF.watchRing(s), n = r.length; return n < 3 ? r.slice() : [r[yr % n], r[(yr + 1) % n]]; };
const W = (s, c) => (c.w || []).map(id => byPid(s, id)), X = (s, c) => byPid(s, c.sp);
const FLOOR = 4;
/* Does the bad turn kill? q: the chance; n: how many it would take. */
const dies = (s, c, q, n) => c.fate < q && living(s).length - (n || 1) >= FLOOR;
const lost = (p, cause) => ({ who: p.id, cause: cause + ', on the crossing' });
const fell = (...ps) => s2 => { for (const p of ps) { const q = byPid(s2, p.id); if (q) q.fell = 'crossing'; } };
const six = (k, d) => LF.SEAT_ORDER.map(seat => [seat, k, d]);
/* The ways across. awake: a line added to how an incident opens; ok/bad: the reason given in a gamble's outcome; watch: the
   modifier on every gamble on the way; burn: dice spent before the incident is drawn (so the rest of the game differs
   by the choice); tilt: incident weights that replace the base ones in drawIncident. how/short: the arrival screen
   and the under-way panel (world.js, ui.js). */
const MODES = {
  thin: { short: 'two on watch', how: 'The ship crossed with two of your officers on watch at a time, as you set it.', awake: 'Nobody else is up.',
    ok: 'Two pairs of hands did the work, and slept for most of a week afterwards.', bad: 'With only the watch awake, it was found late.', watch: [-12, 'Only the two on watch'], burn: 0,
    tilt: { 'voy.spine': 2 } },
  full: { short: 'a work crew on watch', how: 'The ship crossed with a work crew awake beside the watch, as you set it.', awake: 'Ten of the work crews are up with them, in shifts.',
    ok: 'With the crews awake there were hands to spare.', bad: 'A dozen people were awake for it, and it went wrong anyway.', watch: [15, 'A work crew awake with the watch'], burn: 1,
    tilt: { 'voy.ledger': 3, 'voy.petition': 3, 'voy.sick': 2 } },
  hot: { short: 'the engine run hot', how: 'The ship crossed with its engine run hot, as you set it.', awake: 'Neither has slept much: the engine has needed minding since the day it was pushed past its rating.',
    ok: 'It was done between engine checks.', bad: 'Everyone who could have helped was at the engine.', watch: [-5, 'The watch is tending a hot engine'], burn: 2,
    tilt: { 'voy.bearing': 3, 'voy.fire': 2 } },
  lean: { short: 'bank D shut down', how: 'The ship crossed on the power of bank D, as you set it.', awake: 'Neither of them talks about bank D.',
    ok: 'The watch did it, and were glad of something to do.', bad: 'The watch was awake for it, and it went wrong anyway.', burn: 0,
    tilt: { 'voy.dead': 3 } },
  cold: { short: 'the ship run cold', how: 'The ship crossed run cold, with its heat given to the cryo banks, as you set it.', awake: 'They are in coats, and slow with the cold.',
    ok: 'It was done in gloves, with turns at the galley heater afterwards.', bad: 'The cold made every job take twice as long.', watch: [-6, 'The watch is half frozen'], burn: 1,
    tilt: { 'voy.sick': 2, 'voy.fire': 0 } },
  coast: { short: 'a long coast', how: 'The ship burned hard and then coasted, as you set it.', awake: 'The engine is cold, and anything that needs thrust needs a restart first.',
    ok: 'There was time to do it properly.', bad: 'The engine was cold when they needed it.', watch: [-4, 'A coasting ship, the engine cold'], burn: 3,
    tilt: { 'voy.dust': 3, 'voy.bearing': 0, 'voy.spine': 2 } },
  elders: { short: 'the oldest on watch', how: 'The ship crossed with its oldest sleepers on watch, as you set it.', awake: 'The old watch is up with them, and knows the ship well by now.',
    ok: 'The old watch did the fetching and carrying, slowly and well.', bad: 'Some of the old watch were too frail for the work.', watch: [10, 'A large old watch'], burn: 2,
    tilt: { 'voy.dead': 3, 'voy.petition': 2, 'voy.ledger': 2, 'voy.sick': 2 } },
  dose: { short: 'the shield water burned', how: 'The ship crossed on its shield water, as you set it.', awake: 'Both are taking the dose.',
    ok: 'It was done quickly, so as to get back behind the bulkheads.', bad: 'Both of the watch were already sick from the dose.', watch: [-8, 'A watch sick from the dose'], burn: 1,
    tilt: { 'voy.sick': 3, 'voy.fire': 1 } },
};
LF.CROSSING = MODES;
const awake = (s, c) => { const [a, b] = W(s, c), x = X(s, c), M = MODES[V(s).mode] || {};
  return `${a.first} and ${b.first} have the watch this year, with the other ${NUMW[c.rest] || 'few'} of your officers in the cold. ${c.woke ? `They have woken ${x.first} for it, and you.` : 'They have woken you.'}${M.awake ? ' ' + M.awake : ''}`; };
const went = (s, k) => (MODES[V(s).mode] || {})[k] || '';
const WATCH = Object.keys(MODES).filter(m => MODES[m].watch).map(m => If(s => V(s).mode === m, MODES[m].watch[0], MODES[m].watch[1]));
const longer = (s, f) => Math.max(1, Math.round(s.world.transit.years * f));
const yrs = n => `${n} year${n > 1 ? 's' : ''}`;
const LEAD = { dead: 'The dead world is astern and shrinking.', meteor: 'The hull patch has held for a month.', engine: 'Bashir has signed off one burn, and will not sign a second.',
  cryo: 'The cryo alarms have been quiet for a week, and nobody trusts the quiet.', claimed: 'The beacon is still repeating its warning as the ship turns away.', astray: 'Marit has a fix she trusts, the first in years.',
  bloom: 'The last of the mould was burned out of the hydroponics bay yesterday.' };
/* How the question is put, one of four per run (from the seed). */
const FRAME = ['The mission plan ended at the last star, and there is no plan for this. The ship was not provisioned for a second crossing: there is not the food, the power and the people to do it properly, and something has to be spent. All six of your officers are awake for the burn, and four of them go back into the cold after it. What goes wrong on the way will depend on what you choose, and so will the state the ship arrives in.',
  'Tavi has run the stores three ways, and none of them reach the star with everything intact. Food, power, machines or people: something gets spent. How the ship crosses decides which, and who is awake when something breaks.',
  'Nobody planned a second crossing, and the stores say so. Your six officers have pinned their proposals to the wardroom door, each with its price written underneath, and they want an answer before the burn.',
  'Bashir has four ways to run the ship for the distance, and each of them leaves somebody worse off. Whatever goes wrong on the way will be met by whoever has the watch that year.'];
const OWN = { dead: 'voy.wake', meteor: 'voy.patch', engine: 'voy.bearing', cryo: 'voy.cryo', claimed: 'voy.pursuit', astray: 'voy.drift', bloom: 'voy.mould' };
/* The incidents any crossing can meet, and their weight before the way across tilts them. The short count and the
   petition need hands awake besides the officers, so only the modes that wake many give them a weight. */
const BASE = { 'voy.rock': 1, 'voy.fab': 1, 'voy.cryo': 1, 'voy.bearing': 1, 'voy.fire': 1, 'voy.ledger': 0, 'voy.spine': 1, 'voy.sick': 1, 'voy.dust': 1, 'voy.dead': 1, 'voy.petition': 0 };
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
const firstTwo = s => { const w = LF.watchOf(s, 1); return `${w[0].first} and ${w[1].first}`; };
add({ id: 'voy.plan', arc: 'setup', view: 'colony', tone: 'council', chain: true, title: 'The Crossing',
  setup: s => { const d = deal(s); s.voyage.deal = d; return { deal: d, frame: hsh(s.seed + '/frame') % FRAME.length }; },
  text: (s, c) => `${LEAD[s.premise] || LEAD.dead} ${s.world.star} is ${s.world.transit.ly.toFixed(1)} light-years off, which is ${s.world.transit.years} years with the engine at its rating.\n\n${FRAME[c.frame || 0]}`,
  choices: [
    plan('thin', 'Keep the watch as it was on the way out', 'Two of your six awake at a time, two years each, and everyone else in the cold. The stores are hardly touched. Whatever breaks is met by two pairs of hands, and yours.', [['yield', 'Stores saved'], ['danger', 'Few hands if it goes wrong']],
      s => `The watch bill is drawn up the way it was on the way out: two names a year, for ${s.world.transit.years} years, each officer a year with the one before and a year with the one after. ${firstTwo(s)} take the first of it, and the other four go down to the bay.`, { fx: { food: 100 } }),
    plan('full', 'Wake a work crew to stand it with them', 'Ten from the banks are awake at a time beside the two officers, in rotation, and they eat from the stores for the whole crossing. The machines are kept in trim, and there are hands for anything. The colony lands with its bins a third empty.', [['yield', 'Machines kept up'], ['yield', 'Hands if it goes wrong'], ['danger', 'You land hungry']],
      s => `Twelve bunks are made up and a mess rota posted, with ${firstTwo(s)} at the head of it for the first year. The ship sounds lived in for the first time since launch. Tavi marks the stores ledger every week of his watch, and the line only goes one way.`, { cost: s => ({ food: 160 + Math.round(20 * s.world.j) * 10 }), fx: { chips: [['Every machine kept in trim', true]] }, do: s => allMachines(s, 4) }),
    plan('hot', 'Run the engine hot', 'The engine runs past its rating all the way. That takes a quarter off the crossing, so fewer sleepers are lost to the cold, and every machine aboard arrives worn.', [['time', 'A quarter sooner'], ['danger', 'Hard on the machines']],
      s => `The engine is pushed past its rating, and the note of it carries through every deck. Bashir sleeps beside the housing for the first month. The crossing will take ${s.world.transit.years - longer(s, 0.25)} years.`,
      { fx: s => { const n = saved(s, 0.45); return { parts: -2, chips: [[`${longer(s, 0.25)} years sooner`, true]].concat(n ? [[`${n} fewer sleepers lost`, true]] : [], [['Every machine worn', false]]) }; },
        do: s => { const t = s.world.transit; s.sleepers += saved(s, 0.45); t.years -= longer(s, 0.25); allMachines(s, -4); } }),
    Object.assign(plan('lean', 'Shut down bank D and burn its power', 'Forty sleepers draw as much power as the engine can use. Without them the crossing is a quarter shorter, nothing is worn and nothing is eaten. They would not wake, and would not know.', [['time', 'A quarter sooner'], ['yield', 'Stores saved'], ['danger', 'Forty sleepers']],
      s => `Bank D is taken off the bus one row at a time, so the load does not spike. It takes an afternoon. The engine takes up the slack without a change of note, and the crossing will take ${s.world.transit.years - longer(s, 0.25)} years. Marit throws the breakers herself, and writes the forty names into her book before she goes down to the bay.`,
      { fx: s => ({ food: 100, sleepers: -40, chips: [[`${longer(s, 0.25)} years sooner`, true]], stain: ['bank_d', 2], chron: 'On the crossing, forty sleepers in bank D were shut down so that their power could go to the engine.' }),
        do: s => { const t = s.world.transit; t.years -= longer(s, 0.25); } }), { dark: true }),
    // Appended 2026-11-15: four more ways across, dealt with the first four (two plain, two dark per run).
    plan('cold', 'Run the ship cold', 'Heat everywhere but the cryo bays is turned down to four degrees, and the banks get the power, so fewer sleepers are lost. Your six stand their watches in coats, two years at a time, and it takes something out of every one of them.', [['yield', 'Sleepers kept cold and safe'], ['danger', 'Your six, in the cold']],
      s => `The thermostats outside the cryo bays are set to four degrees. The watch sleeps in coats and eats standing at the galley heater. Every one of the six comes off a two-year watch thinner and slower than they went on, and Amara stops pretending the autodoc can mend it. The pod alarms stay quiet for the rest of the crossing.`,
      { fx: s => { const n = saved(s, 0.35); return { morale: -2, machine: { medbay: -4 }, off: six('body', -7), chips: [['The six worn down by the cold', false]].concat(n ? [[`${n} fewer sleepers lost`, true]] : []) }; }, do: s => { s.sleepers += saved(s, 0.35); } }),
    plan('coast', 'Burn hard, then coast', 'One long burn, and then the engine is shut down for the rest of the way. Nothing wears and little is eaten, but the crossing takes a fifth longer, and the sleepers pay for the extra years.', [['yield', 'Machines rested'], ['yield', 'Stores saved'], ['danger', 'More years in the cold']],
      s => `The engine burns for eight months and is shut down cold. The ship goes quiet for the first time since launch, and will stay quiet for ${s.world.transit.years + longer(s, 0.2)} years.`,
      { fx: s => ({ food: 60, sleepers: -(3 + saved(s, 0.3)), chips: [[`${yrs(longer(s, 0.2))} longer`, false], ['Every machine rested', true]] }),
        do: s => { const n = longer(s, 0.2); s.world.transit.years += n; allMachines(s, 3); } }),
    Object.assign(plan('elders', 'Wake the oldest sleepers to stand the watch', 'Sixteen of the oldest in the banks would not come through a second freeze. Woken now, they keep the ship beside your officers for the whole crossing and the young sleep through it untouched. Most of the sixteen will die aboard.', [['yield', 'A big watch, and the stores spared'], ['danger', 'Sixteen of the oldest']],
      s => `Sixteen pods are opened, all of them the oldest on the manifest, and Amara tells each of the sixteen the arithmetic on waking. They keep the ship in shifts for ${s.world.transit.years} years. Thirteen die aboard before orbit, and three come down with the colony.`,
      { fx: { sleepers: -16, pop: 3, food: 40, chips: [['Every machine kept in trim', true]], stain: ['elders', 2], chron: 'On the crossing, sixteen of the oldest sleepers were woken to keep the ship, knowing they would not see orbit. Three did.' },
        do: s => allMachines(s, 3) }), { dark: true }),
    Object.assign(plan('dose', 'Burn the shield water as reaction mass', 'The water jacket around the living decks is reaction mass the engine can use. Burned, it takes a quarter off the crossing and wears nothing. Whoever has the watch takes the dose for the two years of it, and all six of your officers will have had their turn before orbit.', [['time', 'A quarter sooner'], ['yield', 'Machines spared'], ['danger', 'Your six, and the dose']],
      s => `The jacket is drained into the engine feed over a month. The crossing will take ${s.world.transit.years - longer(s, 0.25)} years. The watch move their bunks into the reactor's shadow and wear badges that change colour. All six have stood a turn in it before orbit, and none of them is as well as when they went under.`,
      { fx: s => { const n = saved(s, 0.45); return { morale: -1, off: six('body', -12), stain: ['shield_water', 1], chips: [[`${longer(s, 0.25)} years sooner`, true], ['The six took the dose', false]].concat(n ? [[`${n} fewer sleepers lost`, true]] : []), chron: 'On the crossing, the shield water was burned in the engine, and the officers on watch took the dose.' }; },
        do: s => { const t = s.world.transit; s.sleepers += saved(s, 0.45); t.years -= longer(s, 0.25); } }), { dark: true }),
  ] });

/* An incident: the year it happens in (the first in the first half of a crossing that meets two, the second after it),
   who has the watch that year (c.w), whose trouble it is (seat: that officer is c.sp, woken for it if not on watch;
   c.own says the seat's own officer is alive to be it), the dice for anyone who goes in person (c.fate), and where it
   leads: the next incident, or orbit. */
const yearOf = (s, id) => { const q = V(s).incs || [], k = q.indexOf(id), Y = s.world.transit.years, half = Math.floor(Y / 2);
  const lo = q.length > 1 && k === 1 ? Math.min(Y - 1, half + 1) : 2, hi = q.length > 1 && k === 0 ? Math.max(lo, half) : Math.max(lo, Y - 1);
  return lo + Math.floor(LF.rand(s) * (hi - lo + 1)); };
const inc = (id, title, seat, o) => add(Object.assign({ id: 'voy.' + id, arc: 'setup', view: 'colony', tone: 'pressure', chain: true, title,
  setup: s => { const yr = yearOf(s, 'voy.' + id), w = LF.watchOf(s, yr), x = LF.officer(s, seat) || w[0];
    return Object.assign({ yr, w: w.map(p => p.id), sp: x.id, own: x.seat === seat, woke: !w.includes(x), rest: Math.max(0, living(s).length - 2), fate: LF.rand(s) }, o.more ? o.more(s) : {}); } }, o));
const year = (s, c) => `Year ${c.yr} of the crossing.`;
const after = s => { const q = V(s).incs || [], k = q.indexOf(s.cur.id); return (k >= 0 && q[k + 1]) || 'arrive.name'; };
const end = fx => Object.assign({ then: after }, fx);
const hurt = (p, d) => ({ off: [[p.id, 'body', d]], chips: [[`${p.first} is badly hurt`, false]] });

inc('cryo', 'Bank C', 'command', {
  text: (s, c) => `${year(s, c)} ${s.premise === 'cryo' ? 'It is bank C again.' : 'There is an alarm in the cryo bay.'} A coolant line has split above forty sleepers, and their pods are warming by a degree an hour.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Patch it with pipe cut from the next bank', dark: true, note: 'There is no rated pipe left in stores. The next bank\'s loop has the right bore, and eight sleepers on it.', info: [['yield', 'The forty'], ['danger', 'Eight sleepers on the robbed loop']],
      out: end({ text: (s, c) => `${W(s, c)[0].first} cuts a length from the next bank's loop and brazes it in over the split. The forty sleep through it. The eight on the robbed loop warm over two days, and their pods are logged as lost to the same fault.`, fx: { sleepers: -8, stain: ['coolant', 1] } }) },
    { label: 'Move the forty to a sound bank, pod by pod', note: 'It costs nothing if it is done in time, and it is one trolley and four hundred metres of spine.', info: [['danger', 'Whoever is still in the row when the time runs out']], test: { base: 52, mods: WATCH },
      ok: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} walk forty pods down the spine of the ship on a hand trolley and plug them in one at a time, with you on the cables. None are lost. ${went(s, 'ok')}` }),
      bad: end({ text: (s, c) => `The trolley takes one pod at a time and the warming does not wait. Eleven are past saving when their turn comes, and ${W(s, c)[1].first} is still pushing when ${W(s, c)[0].first} says to stop. ${went(s, 'bad')}`, fx: { sleepers: -11 } }) },
    { label: 'Shut off the worst row and save the rest', dark: true, note: (s, c) => `Six sleepers die, for certain, and ${X(s, c).first} has to pick which row is the worst.`, info: [['yield', 'Thirty-four, for certain'], ['danger', 'Six sleepers']],
      out: end({ text: (s, c) => `${X(s, c).first} picks the row. The six pods nearest the split are shut off and their coolant fed to the others. ${X(s, c).first} writes the six names in the log by hand.`, fx: (s, c) => ({ sleepers: -6, stain: ['row', 1], off: [[c.sp, 'mind', -4]] }) }) },
  ] });
inc('patch', 'The Patch', 'engineer', {
  text: (s, c) => `${year(s, c)} The patch over the meteor hole has lifted at one corner, and the forward section is losing air.\n\n${awake(s, c)}${c.own ? `\n\n"That corner's past any line we've got," ${X(s, c).first} says. "I can reach it loose. I'd want it in the log that I said what I think of that."` : ''}`,
  choices: [
    { label: 'Seal the forward section for good', note: 'Whatever is stored forward of the doors is lost.', out: end({ text: 'The doors are welded shut. The plate stock in the forward bays stays where it is, in vacuum, for good, and so do the forward seed lockers. The colony will sow less than it meant to.', fx: { mat: -14, food: -60 } }) },
    { label: (s, c) => `Send ${X(s, c).first} out with no tether`, dark: true, note: (s, c) => `The corner is past the reach of a line. ${X(s, c).first} knows that, and has said so.`, info: (s, c) => [['yield', 'The forward section, whole'], ['danger', X(s, c).first]], test: { base: 64, mods: WATCH },
      ok: end({ text: (s, c) => `The corner is welded down under a second plate, and it holds. ${X(s, c).first} comes in along the hull hand over hand and does not speak to you for the rest of the watch. ${went(s, 'ok')}`, fx: { stain: ['ordered_out', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c), a = W(s, c).find(p => p !== x) || W(s, c)[0];
          return dies(s, c, 0.6) ? `${x.first} loses the hull at the torn edge of the patch, with nothing to come back on. ${a.first} finishes the weld on a line that does not reach, with a second line tied to the first, and does not look aft. ${went(s, 'bad')}`
            : `${x.first} loses the hull at the torn edge of the patch. ${a.first} gets a thrown line to ${him(x)} on the third try and hauls ${him(x)} in with a shoulder out and a suit holding by one seam. The weld is finished the slow way. ${went(s, 'bad')}`; },
        fx: (s, c) => dies(s, c, 0.6) ? { kill: [lost(X(s, c), 'lost off the hull at the meteor patch')], morale: -2, stain: ['ordered_out', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -28), { mat: -6, stain: ['ordered_out', 1] }) }) },
    { label: 'Shut the doors now, with the watch still forward', dark: true, note: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} are working forward of the doors. Waiting for them costs the air in three more sections. Shut now, they have four minutes to reach the hatch.`, info: (s, c) => [['yield', 'The air, and the stores forward'], ['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]], test: { base: 62, mods: [] },
      ok: end({ text: (s, c) => `The doors close on the count, as the drill says they must. ${W(s, c)[0].first} and ${W(s, c)[1].first} come through the hatch with a minute in hand and neither of them will look at you. The stores forward of the doors are recovered a week later, in suits.`, fx: { mat: 6, stain: ['doors', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.3, 2) ? `The doors close on the count, as the drill says they must. The hatch jams on its own frost. ${a.first} and ${b.first} have about four minutes of air, and are on the intercom for all of it. The stores forward of the doors are recovered a week later, in suits.`
            : dies(s, c, 0.75) ? `The doors close on the count, as the drill says they must. ${a.first} reaches the hatch. ${b.first} goes back for the torch, and is on the intercom for the four minutes that follow. The stores forward of the doors are recovered a week later, in suits.`
            : `The doors close on the count, as the drill says they must. ${a.first} drags ${b.first} through the hatch on the last of the air, grey and not breathing. ${b.first} breathes again on the deck, and is not right for a long time after.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.3, 2) ? { kill: [lost(a, 'shut forward of the pressure doors'), lost(b, 'shut forward of the pressure doors')], morale: -3, mat: 6, stain: ['doors', 2], do: fell(a, b) }
            : dies(s, c, 0.75) ? { kill: [lost(b, 'shut forward of the pressure doors')], morale: -2, mat: 6, stain: ['doors', 1], do: fell(b) }
            : Object.assign(hurt(b, -30), { mat: 6, stain: ['doors', 1] }); } }) },
  ] });
inc('bearing', 'The Third Bearing', 'engineer', {
  text: (s, c) => `${year(s, c)} ${s.premise === 'engine' ? 'This engine was promised one burn, and it is not finished yet. ' : ''}The main engine's third bearing is running hot${V(s).mode === 'hot' ? ', as Bashir said it would,' : ''} and the temperature is still climbing.\n\n${awake(s, c)}${c.own ? `\n\n"She'll take a repack with the shaft stopped, and it'll cost you the years," ${X(s, c).first} says. "Or somebody goes in with her turning. That'd be me, and I don't recommend it."` : ''}`,
  choices: [
    { label: 'Throttle back and take longer', note: 'The sleepers spend more years in the cold.', out: end({ text: s => `The engine is eased to two-thirds, and the bearing cools. The crossing will take ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''}, and the cryo banks have to last them.`,
      fx: s => ({ sleepers: -3, chips: [[`${longer(s, 0.15)} year${longer(s, 0.15) > 1 ? 's' : ''} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: (s, c) => `Send ${X(s, c).first} into the housing with the shaft turning`, dark: true, note: 'Stopping the shaft to repack it costs the years. Nobody who has seen the housing would go in by choice.', info: (s, c) => [['yield', 'No time lost, no sleepers lost'], ['danger', X(s, c).first]], test: { base: 58, mods: WATCH },
      ok: end({ text: (s, c) => `${X(s, c).first} goes in. It takes nine hours with the shaft turning a hand's width away. The temperature comes down and stays down. ${went(s, 'ok')}`, fx: { stain: ['ordered_in', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c), a = W(s, c).find(p => p !== x) || W(s, c)[0];
          return dies(s, c, 0.55) ? `${x.first} goes in, and is caught by the shaft in the seventh hour. ${a.first} goes in to clear it, and repacks the bearing with spares that were set aside for the reactor. ${went(s, 'bad')}`
            : `${x.first} goes in, and in the seventh hour the shaft takes a sleeve and most of the arm inside it. ${a.first} pulls ${him(x)} out by the belt. The bearing is repacked with the shaft stopped after all, with spares that were set aside for the reactor. ${went(s, 'bad')}`; },
        fx: (s, c) => dies(s, c, 0.55) ? { kill: [lost(X(s, c), 'caught by the shaft of the main engine')], parts: -5, machine: { reactor: -6 }, stain: ['ordered_in', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -30), { parts: -5, machine: { reactor: -6 }, stain: ['ordered_in', 1] }) }) },
    { label: 'Run the cryo coolant through the bearing', dark: true, note: 'It is the only cold on the ship in that quantity. The bank it comes from will not stay cold without it.', info: [['danger', 'Twelve sleepers']],
      out: end({ text: 'The coolant from the nearest bank is piped through the bearing housing, and the temperature drops inside the hour. The twelve pods on that loop warm past recovery over the following day. The engine does not lose a minute.', fx: { sleepers: -12, stain: ['coolant', 1] } }) },
  ] });
inc('mould', 'Grey in the Stores', 'crew', {
  text: (s, c) => `${year(s, c)} The grey mould is back, in the dry stores this time.\n\n${awake(s, c)}${c.own ? `\n\n"Three bays showing," ${X(s, c).first} says. "Could be thirty sacks. Could be all of it. Won't know till they're open."` : ' Three bays show it, and there is no telling how far it has spread.'}`,
  choices: [
    { label: 'Burn all three bays', note: 'It is certain, and it costs everything in them.', out: end({ text: 'Three bays of sacks go out through the lock and burn off in the drive plume. The mould is not seen again. The colony will land with a month less in the hold than it counted on, and the first to feel a short month are the ones who were thin already.', fx: { food: -220 } }) },
    { label: 'Open every sack and sort it by hand', test: { base: 50, mods: WATCH },
      ok: end({ text: (s, c) => `It takes ${X(s, c).first} and the watch two months. Most of what was in the three bays is clean and goes back on the shelves. ${went(s, 'ok')}`, fx: { food: -50 } }),
      bad: end({ text: s => `By the time the sorting is finished the mould is in the sorted sacks, and in the hydroponics bay again. ${went(s, 'bad')}`, fx: { food: -300, machine: { hydroponics: -6 } } }) },
    { label: 'Have the watch eat from the doubtful sacks, and do not tell them which', dark: true, note: (s, c) => `Nobody knows what the mould does to a person. A month of ${W(s, c)[0].first}'s and ${W(s, c)[1].first}'s suppers is how to find out which sacks to keep.`, test: { base: 60, mods: [] }, info: (s, c) => [['yield', 'Most of the stores kept'], ['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]],
      ok: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} eat from the grey sacks for a month without knowing it, and you log every stomach ache they mention. Nothing worse comes of it. Two bays in three go back on the shelves.`, fx: { food: -50, stain: ['taster', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `By the third week neither of them can keep water down. ${a.first} comes through it, thin and yellow. ${b.first} is dead in the fifth week. It is now known exactly which sacks to burn, and ${a.first} has worked out how.`
            : `By the third week neither of them can keep water down, and it is a month before either can stand a watch. It is now known exactly which sacks to burn, and they have both worked out how.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? { food: -100, kill: [lost(b, 'poisoned by the grey mould in the stores')], off: [[a.id, 'body', -15]], morale: -2, stain: ['taster', 2], do: fell(b) }
            : { food: -100, off: [[a.id, 'body', -18], [b.id, 'body', -18]], chips: [[`${a.first} and ${b.first} are poisoned`, false]], morale: -1, stain: ['taster', 2] }; } }) },
  ] });
inc('pursuit', 'A Light Astern', 'security', {
  text: (s, c) => `${year(s, c)} There has been a drive flare on the stern scope for three weeks, on the ship's own heading and closing. Its spectrum matches the beacon's.\n\n${awake(s, c)}${c.own ? `\n\n"Three weeks on our heading, closing, and not a word on any band," ${X(s, c).first} says. "Bloody friendly of them. Shall we wait and see what they'd like?"` : ''}`,
  choices: [
    { label: 'Go dark and coast', note: 'The cryo banks run warm while the reactor is banked.', out: end({ text: 'The engine is shut down and the reactor banked. The flare passes a long way off and keeps going. The cryo banks ran warm for the weeks it took, and four sleepers did not come through.', fx: { sleepers: -4 } }) },
    { label: 'Burn hard and outrun it', test: { base: 52, mods: WATCH },
      ok: end({ text: s => `The engine is run flat out for six days. The flare falls behind, and then off the bottom of the scope. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The flare falls behind in the end. The reactor fed the engine everything it had for those six days, and shows it. ${went(s, 'bad')}`, fx: { parts: -4, machine: { reactor: -8 } } }) },
    { label: 'Cut a cryo bank loose as a decoy', dark: true, note: 'Twenty pods, warm, on their own power, drifting. Anything hunting by heat will go to them first.', info: [['danger', 'Twenty sleepers']],
      out: end({ text: (s, c) => `${X(s, c).first} blows the bank free on its own cells and the ship coasts cold behind it. The flare changes course toward it. Eleven days later the bank stops transmitting.`, fx: { sleepers: -20, parts: 3, stain: ['decoy', 2] } }) },
  ] });
inc('drift', 'The Fix', 'command', {
  text: (s, c) => `${year(s, c)} The star fix is off again. The error is small, and it grows every day it is flown.\n\n${awake(s, c)}${c.own ? `\n\n"I make it two degrees," ${X(s, c).first} says. "A month of sightings tells us the same thing a month later. Give the order and I'll fly it."` : ''}`,
  choices: [
    { label: 'Stop the burn and take a month of sightings', note: 'It costs a month of stores and gives a heading that can be trusted.', out: end({ text: 'The engine is shut down for a month while every star in the catalogue is sighted twice. The new heading is good.', fx: { food: -110 } }) },
    { label: (s, c) => `Correct on ${X(s, c).first}'s best reckoning`, test: { base: 50, mods: WATCH },
      ok: end({ text: s => `The correction is two degrees, made in an afternoon. The next fix lands where it should. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The correction was out by half. It takes ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''} to fly back onto the line. ${went(s, 'bad')}`,
        fx: s => ({ sleepers: -5, food: -60, chips: [[`${longer(s, 0.15)} year${longer(s, 0.15) > 1 ? 's' : ''} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Thaw the mission\'s first navigator', dark: true, note: 'The best eye for a star fix the ship ever had, seventy-one years old, and too old to go under a second time.', info: [['yield', 'A heading that can be trusted'], ['danger', 'The navigator']],
      out: end({ text: 'The old navigator is thawed, takes eleven days over the sightings, and gives a heading that holds. There is no going back under at that age, and the navigator was told so before agreeing. The navigator stands watches from a chair after that, and dies two years short of orbit.', fx: { sleepers: -1, survey: 4, stain: ['navigator', 1] } }) },
  ] });
inc('wake', 'The Ones Who Cannot Sleep', 'doctor', {
  text: (s, c) => { const [a, b] = W(s, c); return `${year(s, c)} ${a.first} and ${b.first} have the watch this year, and neither has slept in a month. They sit in the wardroom through ship's night and talk about the dead world: what killed it, and whether the next one will be dead when the ship gets there. ${c.woke ? `${X(s, c).first}, woken to look at them, has woken you.` : 'The log has gaps in it now, and one of the gaps woke you.'}`; },
  choices: [
    { label: 'Put both back under early, by force if it comes to that', dark: true, note: 'They have said they will not go. A second freeze inside the year is hard on anyone, and the next pair wake a year before their turn.', info: (s, c) => [['yield', 'A watch that sleeps'], ['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]], test: { base: 66, mods: [] },
      ok: end({ text: (s, c) => `It comes to force for ${W(s, c)[1].first}. Both are sedated in the wardroom and carried down to the bay, and both lids frost over as they should. The next pair are told everything except why they were woken early, and work it out within the week.`, fx: (s, c) => ({ morale: -1, stain: ['refreeze', 1], off: c.w.map(id => [id, 'mind', -5]) }) }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `It comes to force for ${b.first}. Both are sedated in the wardroom and carried down to the bay. ${b.first}'s pod shows a flat line before the lid is cold. The next pair are told everything except why they were woken early, and work it out within the week.`
            : `It comes to force for ${b.first}. Both are sedated in the wardroom and carried down to the bay. ${b.first}'s pod alarms twice in the night and has to be opened again, and ${he(b)} comes out of it with a heart that will never be what it was.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? { kill: [lost(b, 'did not come through a second freeze')], morale: -2, stain: ['refreeze', 1], do: fell(b) } : Object.assign(hurt(b, -28), { morale: -1, stain: ['refreeze', 1] }); } }) },
    { label: 'Dose them, and keep them on the array', dark: true, note: 'The drug store has enough to keep two people quiet and working for a year. It was packed for surgery on the ground.', info: (s, c) => [['yield', 'A survey of the new star'], ['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}, and the drug store`]], test: { base: 58, mods: WATCH },
      ok: end({ text: (s, c) => `They are dosed at every meal and set to the array's readings of ${s.world.star}. They work slowly and say very little, and the ship arrives with a better survey of the new world than it had. Neither is quite the same person afterwards. ${went(s, 'ok')}`, fx: (s, c) => ({ survey: 6, machine: { medbay: -5 }, stain: ['sedated', 1], off: c.w.map(id => [id, 'mind', -8]) }) }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.45) ? `They are dosed at every meal and set to the array. In the fourth month ${b.first} saves a week of doses and takes them together, and leaves the survey notes squared on the wardroom table. ${a.first} finds ${him(b)} in the morning. ${went(s, 'bad')}`
            : `They are dosed at every meal and set to the array. In the fourth month ${b.first} saves a week of doses and takes them together. ${a.first} finds ${him(b)} in time, and sits by the bunk for nine days. ${went(s, 'bad')}`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.45) ? { kill: [lost(b, 'took a week of doses together')], morale: -2, machine: { medbay: -5 }, stain: ['sedated', 1], off: [[a.id, 'mind', -10]], do: fell(b) }
            : { machine: { medbay: -5 }, stain: ['sedated', 1], off: [[b.id, 'mind', -22], [b.id, 'body', -12], [a.id, 'mind', -8]], chips: [[`${b.first} is badly shaken`, false]] }; } }) },
    { label: 'Wake the other officers and sit up with them', note: 'All of your officers awake for a season, out of turn, eating, and the dead world talked through until it is talked out. The fear may spread before it settles.', info: [['yield', 'Nobody forced, nobody drugged'], ['danger', 'The stores'], ['danger', 'Everyone\'s nerve']],
      out: end({ text: (s, c) => `The bay is opened and the wardroom table is full for the first time since the burn. It takes three months of suppers. Nobody has an answer about the dead world, but ${W(s, c)[0].first} and ${W(s, c)[1].first} sleep again, and the others go back into the cold with it in their heads.`, fx: { food: -120, off: six('mind', -4), chips: [['Every officer a little shaken', false]] } }) },
  ] });
inc('rock', 'A Grain of Rock', 'command', {
  text: (s, c) => `${year(s, c)} Something the size of a grain of rice has gone through the hangar bay, and through the lander's flank on its way.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Seal the bay and leave the lander until orbit', note: 'It sits in vacuum for the rest of the crossing.', out: end({ text: 'The bay is sealed. The lander sits in vacuum for the rest of the crossing, and its seals age faster than they were meant to. Every flight it will not now make is twenty sleepers who stay in orbit.', fx: { machine: { lander: -10 }, cap: { lander: -4 } } }) },
    { label: 'Repair it now, in the bay', cost: { parts: 3 }, test: { base: 58, mods: WATCH },
      ok: end({ text: (s, c) => `${X(s, c).first} cuts the puncture out and plates it, and replaces every seal near it. ${went(s, 'ok')}` }),
      bad: end({ text: s => `The plate goes on, but the pressure test afterwards finds what the grain did further in, and there is nothing in stores for that. ${went(s, 'bad')}`, fx: { machine: { lander: -6 } } }) },
    { label: (s, c) => `Send ${X(s, c).first} in a suit, with the bay still open to space`, dark: true, note: (s, c) => `It saves the parts and the week of pumping down. The suit seals are forty years old, and ${X(s, c).first} has looked at them and said no once.`, info: (s, c) => [['yield', 'The Lander, for nothing'], ['danger', X(s, c).first]], test: { base: 62, mods: WATCH },
      ok: end({ text: (s, c) => `${X(s, c).first} spends four hours in a suit inside the lander's flank, working by helmet lamp. The puncture is closed from within and holds at test. ${went(s, 'ok')}`, fx: { machine: { lander: 3 }, stain: ['ordered_out', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c);
          return dies(s, c, 0.55) ? `A wrist seal goes in the third hour. ${x.first} finishes the weld before the air runs out, and does not get back to the lock. The lander is sound. ${went(s, 'bad')}`
            : `A wrist seal goes in the third hour. ${x.first} finishes the weld one-handed and reaches the lock with an arm frozen to the elbow. The lander is sound. ${went(s, 'bad')}`; },
        fx: (s, c) => dies(s, c, 0.55) ? { kill: [lost(X(s, c), 'a suit seal failed in the open hangar bay')], morale: -1, stain: ['ordered_out', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -28), { stain: ['ordered_out', 1] }) }) },
  ] });
inc('fab', 'The Bracket', 'crew', {
  text: (s, c) => `${year(s, c)} The fabricator has been printing the same bracket for six days. It was not asked to, and it will not stop.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Cut its power for the rest of the crossing', note: 'A machine like that does not like standing cold for years.', out: end({ text: 'It is shut down cold, with a bracket half printed, and it will need work before it runs again. Nothing that breaks for the rest of the crossing can be printed, and two things do.', fx: { machine: { fabricator: -8 }, parts: -3 } }) },
    { label: 'Open the controller and find the fault', test: { base: 55, mods: WATCH },
      ok: end({ text: s => `It is a stuck relay, found on the second day. The brackets are melted down for stock. ${went(s, 'ok')}`, fx: { parts: 2 } }),
      bad: end({ text: s => `The fault is found, after two boards are burned out on the way to it. ${went(s, 'bad')}`, fx: { parts: -4 } }) },
    { label: (s, c) => `${X(s, c).first} goes in through the feed chute while it prints`, dark: true, note: (s, c) => `The jam is behind the head. Powering down to reach it is what a machine like this does not forgive. ${X(s, c).first} is the only one aboard narrow enough, and has not been asked yet.`, info: (s, c) => [['yield', 'The Fabricator, never switched off'], ['danger', X(s, c).first]], test: { base: 62, mods: WATCH },
      ok: end({ text: (s, c) => `${X(s, c).first} goes in feet first with a pick and a lamp, timing the head as it passes. The relay is freed in twenty minutes, and six days of brackets are melted down for stock. ${went(s, 'ok')}`, fx: { parts: 5, stain: ['ordered_in', 1] } }),
      bad: end({ text: (s, c) => { const x = X(s, c);
          return dies(s, c, 0.5) ? `The head catches ${x.first} across the chest and does not stop. The fabricator is shut down cold to get ${him(x)} out, which was what the job was meant to avoid, and it is too late by then. ${went(s, 'bad')}`
            : `The head catches ${x.first}'s arm and does not stop. The fabricator is shut down cold to get ${him(x)} out, which was what the job was meant to avoid. The arm is opened to the bone. ${went(s, 'bad')}`; },
        fx: (s, c) => dies(s, c, 0.5) ? { kill: [lost(X(s, c), 'caught by the print head, clearing a jam')], morale: -1, machine: { fabricator: -8 }, stain: ['ordered_in', 1], do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -26), { machine: { fabricator: -8 }, stain: ['ordered_in', 1] }) }) },
  ] });

/* Seven more incidents (2026-11-15), open to any crossing; the way across tilts which (MODES[].tilt). */
inc('fire', 'Fire in the Racks', 'security', {
  text: (s, c) => `${year(s, c)} A lamp ballast in the hydroponics bay, years past its rated life, has shorted and set the racks alight. The bay's own extinguishers emptied in the first minute, and the smoke is in the vents.\n\n${awake(s, c)} ${W(s, c)[1].first} is at the far racks with a hose, and they have not caught yet.`,
  choices: [
    { label: 'Vent the bay to space, once it is clear', note: 'The fire goes out in a breath, and so does every rack in the bay. The colony lands without the crop it was counting on.', info: [['danger', 'The first harvest']],
      out: end({ text: (s, c) => `${W(s, c)[1].first} is called out, and the outer door is opened. The bay empties in one breath. The racks are black and frozen when the watch goes in. For the rest of the crossing the watch eats from sealed stores, and the colony will land that much shorter.`, fx: { food: -150, machine: { hydroponics: -6 } } }) },
    { label: 'Fight it from the door', note: 'Hoses from the galley and the cryo bay, and the two of them in the smoke.', test: { base: 54, mods: WATCH }, info: (s, c) => [['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]],
      ok: end({ text: s => `The fire is out in forty minutes, with a third of the racks lost. ${went(s, 'ok')}`, fx: { food: -50 } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.35) ? `The fire gets into the lamp feeds and runs along the ceiling. It is out in the end, with most of the racks gone. ${b.first} was in the smoke longest, and dies of it two days later. ${went(s, 'bad')}`
            : `The fire gets into the lamp feeds and runs along the ceiling. It is out in the end, with most of the racks gone, and ${b.first} coughs black for a month. ${went(s, 'bad')}`; },
        fx: (s, c) => { const b = W(s, c)[1];
          return dies(s, c, 0.35) ? { kill: [lost(b, 'the smoke of the fire in the racks')], food: -110, machine: { hydroponics: -4 }, do: fell(b) } : Object.assign(hurt(b, -18), { food: -110, machine: { hydroponics: -4 } }); } }) },
    { label: 'Draw the air off through bank E', dark: true, note: 'The bay shares a scrubber line with bank E. Pull its air through the line and the fire smothers with the racks still whole. The eight pods on that line will not come through it.', info: [['yield', 'The racks, nearly all of them'], ['danger', 'Eight sleepers on the line']],
      out: end({ text: 'The scrubber valves are opened wide. The fire dies down to smoke in a quarter of an hour, and the racks come through it scorched and alive. The eight pods on the line foul over the following week and are logged as lost to the fire.', fx: { sleepers: -8, food: -20, stain: ['scrubbed', 1] } }) },
    { label: (s, c) => `Vent it now, with ${W(s, c)[1].first} still at the back`, dark: true, note: (s, c) => `Opened now, the bay loses the front racks only. ${W(s, c)[1].first} would have the length of the bay to run, in the time the air takes to leave it. Waiting costs the rest of the racks.`, info: (s, c) => [['yield', 'Half the racks'], ['danger', W(s, c)[1].first]], test: { base: 52, mods: [] },
      ok: end({ text: (s, c) => `The door is opened on the count. The fire goes out before it reaches the far racks, and their sealed trays come through the cold. ${W(s, c)[1].first} comes through the inner door on hands and knees with frost on ${his(W(s, c)[1])} eyelashes, and asks who gave the count.`, fx: { food: -40, stain: ['vented', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.7) ? `The door is opened on the count. The fire goes out before it reaches the far racks, and their sealed trays come through the cold. ${b.first} gets as far as the third rack. ${a.first} brings ${him(b)} in from the bay a day later, in a suit.`
            : `The door is opened on the count. The fire goes out before it reaches the far racks. ${b.first} reaches the inner door with nothing left in ${his(b)} lungs, and ${a.first} gets it open in time. ${b.first} keeps the hands, most of the fingers, and a cough.`; },
        fx: (s, c) => { const b = W(s, c)[1];
          return dies(s, c, 0.7) ? { kill: [lost(b, 'the hydroponics bay was vented to put out a fire')], morale: -2, food: -40, stain: ['vented', 2], do: fell(b) } : Object.assign(hurt(b, -32), { food: -40, stain: ['vented', 1] }); } }) },
  ] });
inc('ledger', 'The Short Count', 'crew', {
  text: (s, c) => `${year(s, c)} ${X(s, c).first}'s monthly count of the stores is a month short, and has been getting shorter since spring. The foil wrappers turn up under a mattress in one bunk, a fitter's, one of the hands woken to stand the watch.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Log it, and cut that share until orbit', note: 'The fitter eats half rations for the rest of the crossing, in front of everyone awake.', info: [['danger', 'The fitter'], ['danger', 'A watch that counts plates']],
      out: end({ text: 'It goes in the log with the name beside it. The thief eats half rations at the same table as everyone else, and everyone awake starts weighing their portions.', fx: { food: -60, morale: -2 } }) },
    { label: 'Put the thief back in the cold', dark: true, note: 'A second freeze inside a year kills about one in three. Nobody will have to look at the thief again.', test: { base: 66, mods: [] }, info: [['yield', 'The stores safe'], ['danger', 'The thief']],
      ok: end({ text: 'The thief is sedated and put under in a spare pod. The lid frosts over as it should, and the rota is redrawn without the name.', fx: { food: -40, pop: -1, sleepers: 1, stain: ['put_under', 1] } }),
      bad: end({ text: 'The thief is sedated and put under in a spare pod, and the pod shows a flat line before morning. The rota is redrawn without the name.', fx: { food: -40, pop: -1, stain: ['put_under', 1] } }) },
    { label: 'Cut everyone\'s ration, and say it was short-packed at launch', dark: true, note: (s, c) => `The shortfall is made good and the thief keeps working. Everyone awake goes hungrier on a lie, and ${X(s, c).first} has to keep it.`, info: (s, c) => [['yield', 'The count made good'], ['danger', 'Everyone awake, thinner'], ['danger', `${X(s, c).first}, and the lie`]],
      out: end({ text: (s, c) => `The new ration goes up on the galley board with a note about the launch manifest, in ${X(s, c).first}'s hand and not in ${X(s, c).first}'s words. The hands grumble about Earth and eat less. The wrappers stop turning up.`, fx: (s, c) => ({ food: 20, morale: -1, stain: ['short_packed', 1], off: [[c.sp, 'mind', -5]] }) }) },
  ] });
inc('spine', 'The Spine', 'engineer', {
  text: (s, c) => `${year(s, c)} Forty years of heating and cooling have cracked a weld in the spine between the two rings. The forward ring has started to wobble on its bearings, and the crack grows every time it turns.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Stop the ring and weld it in free fall', note: 'Everyone awake moves aft and works without weight for the year it takes. They will come off the watch weak.', info: (s, c) => [['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}, a year without weight`], ['danger', 'The autodoc']],
      out: end({ text: (s, c) => `The ring is spun down and the crack welded from both sides. ${W(s, c)[0].first} and ${W(s, c)[1].first} live a year without weight and come back to the ring with thin bones, and the autodoc spends a long time on them.`, fx: (s, c) => ({ parts: -3, machine: { medbay: -6 }, off: c.w.map(id => [id, 'body', -10]), chips: [['The watch weakened', false]] }) }) },
    { label: (s, c) => `${X(s, c).first} welds it with the ring turning`, note: 'The welder works where the ring meets the spine, a metre from the spin.', test: { base: 55, mods: WATCH }, info: (s, c) => [['danger', X(s, c).first]],
      ok: end({ text: (s, c) => `${X(s, c).first} lays the weld in three shifts with the ring turning beside ${him(X(s, c))}. It holds. ${went(s, 'ok')}` }),
      bad: end({ text: (s, c) => { const x = X(s, c), a = W(s, c).find(p => p !== x) || W(s, c)[0];
          return dies(s, c, 0.45) ? `${x.first}'s line fouls on the turning ring, and the ring does not stop for it. ${a.first} finishes the weld the next day, with spares from the reactor's store. ${went(s, 'bad')}`
            : `${x.first}'s line fouls on the turning ring and takes ${him(x)} half way round it before it parts. ${a.first} finishes the weld the next day, with spares from the reactor's store, while ${x.first} lies in the autodoc with both legs set. ${went(s, 'bad')}`; },
        fx: (s, c) => dies(s, c, 0.45) ? { kill: [lost(X(s, c), 'a line fouled on the forward ring')], parts: -4, do: fell(X(s, c)) } : Object.assign(hurt(X(s, c), -30), { parts: -4 }) }) },
    { label: 'Cut the forward ring loose, with bank F in it', dark: true, note: 'Twenty-two sleepers in bank F cannot be moved in time. Without the ring\'s weight the ship crosses faster, and the crack stops mattering.', info: [['time', 'The crossing shorter'], ['yield', 'Salvage from the ring'], ['danger', 'Twenty-two sleepers']],
      out: end({ text: s => `The forward ring is stripped of everything that can be carried and cut free with the pods still on its power. It falls behind slowly, and its beacon is switched off on the second day. The lighter ship makes orbit ${yrs(longer(s, 0.1))} sooner.`,
        fx: s => ({ sleepers: -22, parts: 4, mat: 10, stain: ['ring', 2], chips: [[`${yrs(longer(s, 0.1))} sooner`, true]], chron: 'On the crossing, the forward ring was cut loose with bank F still in it.', do: s2 => { s2.world.transit.years -= longer(s2, 0.1); } }) }) },
    { label: 'Wake ten sleepers to hold the spine by hand', dark: true, note: 'Ten from the banks, woken without being asked, to brace and reweld the crack in shifts until orbit. The spine is cold and takes the drive\'s dose. Few of the ten will see the ground.', info: [['yield', 'The ring, and everyone in it'], ['danger', 'Ten sleepers, woken for it']],
      out: end({ text: 'Ten pods are opened, and the ten are told what the job is once they can stand. They brace the spine in shifts for the rest of the crossing. Four of them come down with the colony.', fx: { sleepers: -10, pop: 4, parts: -2, stain: ['spine_crew', 1] } }) },
  ] });
inc('sick', 'The Fever', 'doctor', {
  text: (s, c) => { const [a, b] = W(s, c), x = X(s, c);
    return `${year(s, c)} ${b.first} came up from the thaw carrying something the cold had kept asleep, and ${a.first}, who has the watch with ${him(b)}, has it now too. ${c.woke ? `They got ${x.first} out of the bay before they went down with it, and ${x.first} has woken you. ${c.own ? `"I can't name it," ${x.first} says. "I've got two drugs that might touch it and a store packed for the ground. You woke me to treat them, so let me treat them."` : `${x.first} cannot name it.`}` : `One of them got to your pod before the fever put them both in their bunks. Nobody awake can name it.`}${(MODES[V(s).mode] || {}).awake && V(s).mode !== 'thin' && V(s).mode !== 'dose' ? ' ' + MODES[V(s).mode].awake : ''}`; },
  choices: [
    { label: 'Nurse them, with everything in the drug store', note: 'The autodoc\'s drug store goes on two people, and whoever nurses them is next.', test: { base: 56, mods: WATCH }, info: [['danger', 'The drug store'], ['danger', 'Whoever nurses them']],
      ok: end({ text: s => `The fever breaks in the second week, in both of them. The drug store is a good deal lighter. ${went(s, 'ok')}`, fx: { machine: { medbay: -6 } } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.3) ? `It breaks in ${a.first} in the third week. It does not break in ${b.first}. ${went(s, 'bad')}`
            : `It breaks in the fourth week, after it has been through you as well. ${a.first} and ${b.first} are both a long time getting their strength back. ${went(s, 'bad')}`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.3) ? { kill: [lost(b, 'a fever that came up with a thaw')], morale: -1, machine: { medbay: -6 }, off: [[a.id, 'body', -10]], do: fell(b) }
            : { machine: { medbay: -6 }, off: [[a.id, 'body', -16], [b.id, 'body', -16]], chips: [[`${a.first} and ${b.first} are weakened`, false]] }; } }) },
    { label: 'Seal them in their bunks and wait', dark: true, note: 'Nothing from the drug store is spent and nobody else goes near them. The two are on their own.', info: (s, c) => [['yield', 'The drug store, whole'], ['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}`]], test: { base: 48, mods: [] },
      ok: end({ text: (s, c) => `The bunk doors are locked from outside and food goes in through the hatch. Both fevers break on their own in the third week. ${W(s, c)[0].first} and ${W(s, c)[1].first} come out thin, and neither says anything to you about the locks.`, fx: (s, c) => ({ stain: ['sealed_sick', 1], off: c.w.map(id => [id, 'body', -8]) }) }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.2, 2) ? `The bunk doors are locked from outside and food goes in through the hatch. ${b.first} stops taking the food in the second week, and ${a.first} in the third. The doors are opened by the next watch.`
            : dies(s, c, 0.55) ? `The bunk doors are locked from outside and food goes in through the hatch. ${b.first} is dead within the fortnight. ${a.first} comes out thin and does not speak to you again before orbit.`
            : `The bunk doors are locked from outside and food goes in through the hatch. Both of them live, barely. ${a.first} comes out able to stand, and carries ${b.first} to the autodoc without a word to you.`; },
        fx: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.2, 2) ? { kill: [lost(a, 'a fever, behind a locked door'), lost(b, 'a fever, behind a locked door')], morale: -3, stain: ['sealed_sick', 2], do: fell(a, b) }
            : dies(s, c, 0.55) ? { kill: [lost(b, 'a fever, behind a locked door')], morale: -1, stain: ['sealed_sick', 1], off: [[a.id, 'body', -15]], do: fell(b) }
            : { stain: ['sealed_sick', 1], off: [[a.id, 'body', -20], [b.id, 'body', -30]], chips: [[`${a.first} and ${b.first} are badly weakened`, false]] }; } }) },
    { label: 'Wake sleepers to try the doses on', dark: true, note: 'Nobody knows which drug works. Six from the banks, woken and given the fever, would show it before the two are past saving.', info: (s, c) => [['yield', `${W(s, c)[0].first} and ${W(s, c)[1].first}, and a known cure`], ['danger', 'Six sleepers']],
      out: end({ text: (s, c) => `Six are thawed in the cold bay and given the fever on purpose, three to a drug. By the tenth day it is plain which one works, and ${W(s, c)[0].first} and ${W(s, c)[1].first} are given it. Four of the six are dead by then. The two who lived come down with the colony.`, fx: { sleepers: -6, pop: 2, machine: { medbay: -2 }, stain: ['tried_on', 2] } }) },
  ] });
inc('dust', 'The Dust Lane', 'command', {
  text: (s, c) => `${year(s, c)} The heading crosses a lane of dust the long-range array never resolved. The forward shield is losing a millimetre a week, and the lane is months wide.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Turn wide around it', note: 'It adds time, and the sleepers spend it in the cold.', info: [['danger', 'Sleepers, in the extra years']],
      out: end({ text: s => `The ship comes about and goes the long way round the lane. The crossing will take ${longer(s, 0.15)} more year${longer(s, 0.15) > 1 ? 's' : ''}, and the cryo banks have to last them.`,
        fx: s => ({ sleepers: -5, chips: [[`${yrs(longer(s, 0.15))} longer`, false]], do: s2 => { s2.world.transit.years += longer(s2, 0.15); } }) }) },
    { label: 'Hold course behind the shield', test: { base: 50, mods: WATCH }, info: [['danger', 'The reactor']],
      ok: end({ text: s => `The shield is worn to a sliver when the ship comes out of the lane, and it holds. ${went(s, 'ok')}` }),
      bad: end({ text: s => `A grain gets through where the shield is thinnest and goes on through the reactor's cooling jacket. ${went(s, 'bad')}`, fx: { parts: -4, machine: { reactor: -8 } } }) },
    { label: 'Turn the ship and take it on the cryo banks', dark: true, note: 'The banks carry more armour than the shield has left. Put them forward, and the dust works on the pods for months instead.', info: [['yield', 'No time lost, the shield whole'], ['danger', 'The sleepers in the forward banks']],
      out: end({ text: (s, c) => `${X(s, c).first} turns the ship so the banks face the lane. For four months the pod alarms go off one at a time, and the watch silences each one. Eighteen pods are logged as lost.`, fx: { sleepers: -18, stain: ['banks_forward', 1] } }) },
    { label: 'Send the watch out to hang plate ahead of the shield', dark: true, note: (s, c) => `Spare plate can be hung forward by hand. ${W(s, c)[0].first} and ${W(s, c)[1].first} know what dust like this does to a suit.`, test: { base: 60, mods: WATCH }, info: (s, c) => [['yield', 'The shield, and no time lost'], ['danger', `${W(s, c)[0].first} and ${W(s, c)[1].first}, on the hull`]],
      ok: end({ text: (s, c) => `${W(s, c)[0].first} and ${W(s, c)[1].first} go out on lines and hang the plate in nine hours, with the dust ticking on their visors. Both come back in. ${went(s, 'ok')}`, fx: { mat: -6, stain: ['ordered_out', 1] } }),
      bad: end({ text: (s, c) => { const [a, b] = W(s, c);
          return dies(s, c, 0.5) ? `The plate goes up. ${b.first} is holed through the suit an hour from the lock, and ${a.first} brings ${him(b)} in. ${went(s, 'bad')}`
            : `The plate goes up. A grain goes through ${b.first}'s thigh an hour from the lock, and ${a.first} holds a glove over the hole all the way back. ${went(s, 'bad')}`; },
        fx: (s, c) => { const b = W(s, c)[1];
          return dies(s, c, 0.5) ? { kill: [lost(b, 'holed through the suit in the dust lane')], mat: -6, morale: -1, stain: ['ordered_out', 1], do: fell(b) } : Object.assign(hurt(b, -26), { mat: -6, stain: ['ordered_out', 1] }); } }) },
  ] });
inc('dead', 'The Cold Bay', 'doctor', {
  more: s => ({ n: Math.max(12, s.world.transit.lostS + 4), d: V(s).mode === 'lean' }),
  text: (s, c) => `${year(s, c)} The pods that failed on the voyage still hold their dead, ${c.n} of them${c.d ? ', and the forty from bank D besides' : ''}, kept in the mortuary bay to be buried on the new world. The bay's refrigeration has failed, and the hydroponics is short of everything a body is made of.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Give them to space, with the rites', note: 'It is what the mission promised the families. The trays stay short, and the colony lands with less.', info: [['danger', 'The trays, and the first harvest']],
      out: end({ text: (s, c) => `The bodies go out through the lock one at a time, with ${W(s, c)[0].first} reading a name for each, over three ship's days. The hydroponics stays short for the rest of the crossing.`, fx: { food: -80, morale: 1 } }) },
    { label: 'Keep them cold on bank power', note: 'A spare bank can hold them until there is ground to bury them in. Its power comes from the banks beside it.', info: [['danger', 'Sleepers on the banks beside it']],
      out: end({ text: 'The dead are moved into a spare bank and kept cold on power drawn from its neighbours. They will come down with the colony to be buried. Three of the living sleepers do not come through the load.', fx: { sleepers: -3, morale: 2 } }) },
    { label: 'Put them through the reclaimer for the trays', dark: true, note: 'Every body is feed the hydroponics needs. The families are asleep, and the log can say space.', info: [['yield', 'A full hydroponics bay'], ['danger', 'What the families are told']],
      out: end({ text: 'The reclaimer takes them over a month. The trays come up green and heavy, and the log says they were committed to space with the rites.', fx: { food: 110, stain: ['reclaimed', 2] } }) },
  ] });
inc('petition', 'The Petition', 'command', {
  text: (s, c) => `${year(s, c)} Half the hands woken to stand the watch have signed a petition and pinned it to the mess door. Their partners and children are in bank C, and the latest pod report puts bank C at a failure a year. They want their families woken now, out of turn, onto rations meant for the crossing.\n\n${awake(s, c)}`,
  choices: [
    { label: 'Refuse, and post the reason', note: 'The stores cannot carry them. The signers will work for the rest of the crossing knowing their families are in the bank that fails.', info: [['danger', 'The signers\' families'], ['danger', 'The hands\' goodwill']],
      out: end({ text: 'The answer is posted beside the petition. The signers keep working and do no more than they must, and the machines show it. Two of their families are among the pods bank C loses before orbit.', fx: { sleepers: -2, morale: -3, do: s => allMachines(s, -2) } }) },
    { label: 'Wake the families', note: 'Eleven more awake for the rest of the crossing, eating. The colony lands with less, and everyone else in bank C waits their turn.', info: [['yield', 'Eleven lives, and grateful hands'], ['danger', 'The stores']],
      out: end({ text: 'Eleven pods are opened. The mess is loud for the first time in years, and the stores ledger drops a line a week faster.', fx: { sleepers: -11, pop: 11, food: -180, morale: 2 } }) },
    { label: 'Tell the signers their families died in year nine', dark: true, note: 'The pod report can be made to say it. The petition ends tonight, and the families sleep on in the bank that fails.', info: [['yield', 'The petition over, the stores whole'], ['danger', 'The signers, and the truth']],
      out: end({ text: 'The report is changed and read out in the mess. The petition comes off the door that night. The signers are back at work the next morning.', fx: { morale: -1, stain: ['false_dead', 2] } }) },
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
/* ---- what is said at the ramp (Lachlan, 2026-11-17): an officer lost on the crossing (p.fell) is spoken for at landfall,
   by one of the others, in that officer's own voice (VOICES.md). Two lines are written for each of the six, by different
   people, so there is somebody left to say one. One who is still aboard says it over the lander's radio. ---- */
const SAID = {
  solheim: [['dahl', 'She never once asked me whether an order was fair, only whether it\'d work, and I\'m told that\'s a fault. Well, we\'re standing on a planet, so somebody tell me which of us was wrong.'],
    ['kovacs', 'She flew the old girl the whole way out and never bent her. I\'ll keep her running. That\'s all I\'ve got to say.']],
  dahl: [['nakamura', 'You were a suspicious, miserable man, Kasimir, and you sat outside my sick bay door every night there was somebody in it. I knew. I always knew.'],
    ['estrada', 'He checked every lock twice so the rest of us could sleep. I\'ll say thanks for that. I\'ll check them now.']],
  kovacs: [['estrada', 'He took my night shifts and never said so. Fixed a thing once and it stayed fixed. This ground could\'ve used a man like that.'],
    ['solheim', 'Every machine on that ship ran on his word, and nothing he signed off ever failed. That\'s the record. It stands.']],
  nakamura: [['yurbin', 'She told me a sample would kill me one day, she said it every watch we had, and I was going to prove her, no, I was going to make her come and look first, that was the plan, she\'d have looked.'],
    ['solheim', 'She disobeyed me more than once, and she was right more often than not. I have her name. It goes at the top.']],
  yurbin: [['kovacs', 'Never met a man who broke more of my instruments, or was sorrier about it after. He\'d have had his face on the window all the way down. Somebody look at the place properly for him.'],
    ['nakamura', 'You should be here, Gerad. You talked about this ground the whole way out, and you\'d have been off the ramp before it was down, with no gloves on, and I\'d have shouted at you for it.']],
  estrada: [['dahl', 'He\'d have said a prayer over any one of us and meant it, and I\'ve spent the whole morning trying to remember one, and I can\'t. So the first row of anything that grows here gets his name on a stake, and I think he\'d call that fair.'],
    ['yurbin', 'Tavi had seed in his pockets for the whole crossing, did you know that, actual seed, he showed me, wheat and something else, and I\'m going to plant it, I don\'t know how yet, I\'ll find out how.']],
};
const fallen = s => s.people.filter(p => p.seat && !p.alive && p.fell);
LF.fallen = fallen;
const eulogy = (s, d) => { const said = (SAID[d.key] || []).map(([k, line]) => [s.people.find(p => p.key === k && p.seat && p.role && p.alive), line]).filter(x => x[0]);
  const here = said.find(x => !x[0].orbit) || said[0];
  if (!here) return `Nobody finds the words for ${d.first}. The name is read into the log, and the wind takes the rest.`;
  return `For ${d.name}, ${d.cause.replace(/, on the crossing$/, '')}: "${here[1]}" ${here[0].orbit ? `That is ${here[0].first}, from orbit, over the lander's radio.` : `That is ${here[0].first}.`}`; };
add({ id: 'land.eulogy', view: 'people', arc: 'setup', tone: 'quiet', chain: true, title: 'What Is Said at the Ramp',
  setup: s => { const d = fallen(s); s.flags.fell_n = d.length; return { names: d.map(p => p.first), said: d.map(p => eulogy(s, p)) }; },
  text: (s, c) => `The ramp is down. Before anything comes off the lander, your officers stand at the foot of it for ${and3(c.names)}, who did not live to see this ground.\n\n${c.said.join('\n\n')}`,
  choices: [
    { label: 'Stand with them until it is all said', info: [['people', 'Your officers'], ['danger', 'The first day\'s light']],
      out: { then: 'plan', text: (s, c) => `Nobody hurries it. When it is said, somebody scratches ${c.names.length > 1 ? 'the names' : 'the name'} into the lander's ramp with a hull pick, where every boot coming down will pass ${c.names.length > 1 ? 'them' : 'it'}. The unloading starts late and goes on by lamp.`,
        fx: { mat: -6, off: LF.SEAT_ORDER.map(k => [k, 'mind', 3]), chron: 'The first thing done on the ground was to speak for the officers lost on the crossing.' } } },
    { label: 'Say the names yourself, and start the unloading', info: [['yield', 'The first day\'s work'], ['danger', 'What was left unsaid']],
      out: { then: 'plan', text: (s, c) => `You say ${c.names.length > 1 ? 'the names' : 'the name'}, once, and send the crews to the hold. The reactor is off the lander before dark. Your officers work beside the rest and do not say what they had ready.`,
        fx: { mat: 8, off: LF.SEAT_ORDER.map(k => [k, 'mind', -3]) } } },
  ] });
{ const site = LF.byId['landfall.site']; if (site) for (const ch of site.choices) ch.out.then = s => fallen(s).length && !s.used['land.eulogy'] ? 'land.eulogy' : 'plan'; }
})();

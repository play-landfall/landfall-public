/* Landfall — openings: the first season, drawn from what this run actually is.
   Before this, every first year was the same five cards and the same food crunch on day 40. Now each run draws three
   opening cards, one from each of three piles: the world (its type), how the colony got here (the premise, the site,
   the machine the descent broke), and what it brought (the cargo, the officers). They arrive in the first hundred
   days. Starting stores also depend on the premise, so the first shortage comes early, late or not at all.
   Picks use the story stream (LF.srand), so the main dice are untouched until a card is played. */
(function () {
'use strict';
const { add, clamp, h } = LF; const { P, N, Nc, R, M, If, byPid } = h;
const OP = {};   // id -> { pile, fit(s) -> weight }
const op = (pile, fit, st) => { OP[st.id] = { pile, fit }; add(Object.assign({ arc: 'opening', chain: true, gap: 0 }, st)); };
const site = s => ['delta', 'highland', 'deep', 'coast'].find(k => s.flags['site_' + k]) || null;
const cargo = (s, k) => !!(s.cargo && s.cargo[k]);

/* How much food came down depends on why the ship stopped here. */
const STORES = { bloom: 0.9, cryo: 0.96, dead: 1.06 };
const land0 = LF.land;
/* Every colony lands hungry (LAND): the first count on the ground is already an argument about who eats. */
const LAND = 0.88;
LF.land = function (s) { const k = (STORES[s.premise] || 1) * LAND; if (s.res) s.res.food = Math.round(s.res.food * k / 10) * 10; return land0(s); };

/* The draw: once the site is chosen, one card from each pile, weighted by fit. */
function draw(s) {
  s.opening = []; const days = [[12, 30], [45, 70], [82, 112]];
  ['world', 'how', 'brought'].forEach((pile, i) => {
    const c = Object.keys(OP).filter(id => OP[id].pile === pile).map(id => [id, OP[id].fit(s)]).filter(x => x[1] > 0);
    const tot = c.reduce((a, x) => a + x[1], 0); if (!tot) return; let r = LF.srand(s) * tot, id = c[0][0];
    for (const [k, w] of c) { r -= w; if (r <= 0) { id = k; break; } }
    s.opening.push(id); s.sched.push({ id, day: s.day + LF.sri(s, days[i][0], days[i][1]) });
  });
}
const tick0 = LF.threadTick;
LF.threadTick = function (s) { if (s.world && !s.adrift && !s.opening && s.day >= 2 && s.used['landfall.site'] !== undefined) draw(s); return tick0 ? tick0(s) : undefined; };

/* ======================= THE WORLD ======================= */
op('world', s => s.world.type === 'ice' ? 1 : 0, { id: 'op.melt', view: 'colony', tone: 'pressure', title: 'Meltwater',
  text: s => `Every litre the colony drinks is ice first. ${LF.down(s, 'reclaimer') ? 'The reclaimer was built to clean water, not to make it' : 'The reclaimer is still up on the ship'}, and ${N(s, 'engineer')} has been melting blocks on a hotplate.\n\n"There's brine under the ice, a hundred metres down. Or I run a loop off the reactor's waste heat out to a melt pit. Pick one, before this hotplate packs in."`,
  choices: [
    { label: 'Run the pod heating loop out to a melt pit', dark: true, note: 'The reactor has heat for the pit or for the far row of pods, and the far row is where the old sleep.', info: [['yield', 'Water, and no hauling'], ['danger', 'The far row']],
      out: { text: 'The loop is cut where it reaches the far row and run out to the pit. The pit steams day and night and nobody hauls a block. The far row is given extra blankets. Two of the people in it are dead of the cold before the thaw.', fx: s => ({ machine: { reclaimer: 4 }, yield: 0.01, pop: -2, morale: -1, stain: ['unheated', 1], do: s2 => LF.ease(s2, 'cold', 'op.melt', 8, 300) }) } },
    { label: 'Drill for the brine lake', test: { base: 50, mods: [R('geologist', 15), R('engineer', 8)] },
      ok: { text: 'Fifth day of drilling, the bit drops a metre and the hole fills with warm, foul, salty water. It can be cleaned. There is a great deal of it.', fx: { yield: 0.03, survey: 8, machine: { reclaimer: 6 } } },
      bad: { text: 'The bit jams at eighty metres and the casing splits, and the driller standing over it does not get clear. The hole is capped and the hotplates go back on.', fx: { parts: -5, mat: -20, pop: -1 } } },
    { label: 'Haul ice by hand, on a rota', out: { text: 'Everyone takes a turn on the sledges. It is cold, slow work, and nobody can call it unfair. By the turn of the season it has cost six fingers and a man who went through the lake ice with a full load.', fx: s => ({ morale: -1, pop: -1, do: s2 => LF.emit(s2, 'exhaustion', 'op.melt', 10, 90, 'everyone hauls ice for the melt') }) } },
    { label: 'Ice is for the ones who do not dig', dark: true, note: 'The field crews stay in the fields. Everyone else hauls, before the day shift, in the dark.', info: [['yield', 'No field hand lost to the sledges'], ['danger', 'The ones who haul']],
      out: { text: 'The rota is written with the field crews left off it. The clerks, the medics and everyone over fifty haul ice before first light. Two of them are dead of the cold by the thaw. The fields are never short a hand.', fx: { pop: -2, yield: 0.03, morale: -1, stain: ['ice_rota', 1] } } },
  ] });
op('world', s => s.world.type === 'jungle' ? 1 : 0, { id: 'op.film', view: 'colony', tone: 'pressure', title: 'It Grows on the Hull',
  text: s => `A green-black film has crept over the lander's hull in a month. It is in the seals of the pods and the louvres of the reactor housing. ${Nc(s, 'xenobio')} scrapes a sample and it moves on the slide.\n\n"It'll grow on any metal that stays warm, under a fingernail too, two of the scraping crew have got it and it won't come off, no wait, don't scrub it yet, look at it move!"`,
  choices: [
    { label: 'The two who have it do the scraping, and whoever catches it joins them', dark: true, note: 'It cannot be given to them twice.', info: [['yield', 'Clean metal, and clean hands for everyone else'], ['danger', 'The scraping gang']],
      out: { text: 'The two are given the scrapers and a pod of their own. The gang is five by the end of the season and eats at its own table. The hull is clean, and one of the five has it in the lungs and is dead of it.', fx: s => ({ machine: { reactor: 3, lander: 3 }, pop: -1, morale: -1, stain: ['scrapers', 1] }) } },
    { label: 'Burn it off and coat everything', cost: { parts: 5 }, out: { text: 'Torches, then a coat of the reactor\'s own sealant. It does not come back to the treated metal, and spreads to whatever was missed. There is no sealant for skin. The two who have it lose the hands it was on.', fx: { machine: { reactor: 4, lander: 4 }, morale: -2 } } },
    { label: 'Let it be, and study it', out: { text: 'It is left on the lander. By the end of the season the lander is a green hill with a ramp, and the colony knows more about this film than about anything else on the planet. One of the two scrapers died of it while it was being studied.', fx: { survey: 12, machine: { lander: -10 }, pop: -1 } } },
    { label: 'Seal the two who have it in a pod, and watch', dark: true, note: 'They would be told it was quarantine.', info: [['yield', 'How to kill it'], ['danger', 'The two']],
      out: { text: 'The two are moved to a sealed pod and told it is quarantine. It is in their lungs within the month. Everything the colony knows about the film, including what kills it on metal, was written down at that window.', fx: { pop: -2, survey: 14, morale: -1, machine: { reactor: 6, lander: 6 }, stain: ['expend', 1] } } },
  ] });
op('world', s => s.world.type === 'drowned' ? 1 : 0, { id: 'op.tide', view: 'world', tone: 'crisis', title: 'Spring Tide',
  text: s => `The moons line up for the first time since landfall, and the sea comes up the beach further than anyone measured. It is over the bottom of the camp by midnight. The pods float. The seed lockers do not.\n\n${Nc(s, 'quartermaster')} has the stores half carried uphill already, and wants to know how far to take them.`,
  choices: [
    { label: 'Move the whole camp up the slope', cost: { mat: 30 }, out: { text: 'Three days of carrying, with the low field left to the water and the seed that was in it. The new camp is windier and further from the sea, and dry.', fx: { morale: -1, food: -60, yield: -0.01 } } },
    { label: 'Wall the low camp before the next one', cost: { mat: 45 }, test: { base: 55, mods: [R('engineer', 12), R('geologist', 8)] },
      ok: { text: 'A bank of rubble and cut plate, head high. The next spring tide comes up to it and goes back down.', fx: { morale: 3 } },
      bad: { text: 'The wall holds in the middle and fails at both ends. The camp is wet again, and a good deal of the wall is in the sea.', fx: { food: -90, morale: -3 } } },
    { label: 'Stores first. The low pods are woken when the stores are up', dark: true, note: 'Every hand that goes to wake sleepers is a hand off the sacks.', info: [['yield', 'The stores'], ['danger', 'Whoever is asleep in the low pods']],
      out: { text: 'Every hand goes on the sacks, and the stores are above the tide line by two in the morning. The low pods are reached after that. Two of them had gone over on the swell with their doors under water, and the two people in them are carried up the beach with the last of the meal.', fx: { food: -20, pop: -2, morale: -2, survey: 6, stain: ['stores_first', 1] } } },
    { label: 'A chain into the water for the seed lockers, roped together', dark: true, note: 'The lockers are the harvest and the sea is still rising. Roped, nobody can let go and wade out.', info: [['yield', 'The seed'], ['danger', 'Everyone on the rope']], test: { base: 64, mods: [R('quartermaster', 8), R('pilot', 6)] },
      ok: { text: 'Forty people stand waist deep in the dark and pass the lockers hand to hand up the beach. The last one comes out with the water at chest height. Nothing is lost that will be missed.', fx: { morale: 2, yield: 0.02, stain: ['roped', 1] } },
      bad: { text: 'The second surge comes in sideways and takes the bottom of the chain off its feet, and the rope takes the next four with it. The lockers are saved. Four of the people who saved them are found along the beach over the next three days.', fx: { pop: -4, morale: -3, yield: 0.01, stain: ['roped', 1] } } },
  ] });
op('world', s => s.world.type === 'barren' ? 1 : 0, { id: 'op.dust', view: 'colony', tone: 'pressure', title: 'Dust in Everything',
  text: s => `The dust here is finer than flour and it gets everywhere: the filters, the bearings, people's lungs. ${Nc(s, 'physician')} has eleven coughs in the clinic. ${Nc(s, 'engineer')} has a ${LF.down(s, 'fabricator') ? 'fabricator' : 'coolant pump'} that sounds like a gravel pit.\n\n"Plate for the machines or plate for the people, and I can't do both. Don't look at me, I didn't pack it."`,
  choices: [
    { label: 'Seal the machines', cost: { mat: 25 }, out: { text: 'Every housing is skinned and taped. The machines run quieter. The coughs go on, and before the year is out two of them have stopped for good.', fx: s => ({ machine: { fabricator: 6, reactor: 4 }, pop: -2, do: s2 => LF.emit(s2, 'sickness', 'op.dust', 12, 120, 'the dust is in everyone\'s lungs') }) } },
    { label: s => LF.down(s, 'fabricator') ? 'Seal the pods, and print masks' : 'Seal the pods, and sew masks', cost: { mat: 25 }, out: { text: s => `Airlocks of hanging plastic on every pod, and a mask on every face outdoors. ${LF.down(s, 'fabricator') ? 'The fabricator chews its way through the job, unsealed, and prints nothing else this season.' : 'The machines run on unsealed, and every bearing in the camp is grinding by the end of the season.'}`, fx: s => ({ machine: LF.down(s, 'fabricator') ? { fabricator: -10 } : { reactor: -8 }, cap: LF.down(s, 'fabricator') ? { fabricator: -4 } : { reactor: -3 }, parts: -3, morale: 2 }) } },
    { label: 'Dig in. The eleven with the cough dig first', dark: true, note: 'They are breathing it already, and digging raises more of it than anything else the colony does.', info: [['yield', 'Half the camp below the dust'], ['danger', 'The eleven']],
      out: { text: 'The eleven are taken out of the clinic and given shovels. Below a metre the dust stops and the ground is cool and still, and half the camp moves down into what they dug. Two of the eleven did not live to move in.', fx: s => ({ mat: 20, pop: -2, morale: -1, stain: ['diggers', 1], do: s2 => LF.emit(s2, 'confinement', 'op.dust', 15, 150, 'half the colony lives underground') }) } },
    { label: 'Masks for the thirty who run the machines', dark: true, cost: { mat: 10 }, note: 'There is filter cloth for thirty. The rest breathe what there is.', info: [['yield', 'The machines, and the people who run them'], ['danger', 'Everyone not on the list']],
      out: { text: 'The housings are sealed and thirty masks are cut. The thirty are chosen by trade. By the end of the year the clinic can tell who was not on the list by listening, and two of them are in the ground.', fx: s => ({ machine: { fabricator: 8, reactor: 6 }, pop: -2, morale: -1, stain: ['masks', 1], do: s2 => LF.emit(s2, 'resentment', 'op.dust', 20, 200, 'there were masks for thirty, chosen by trade') }) } },
  ] });
const HOMES = { key: 'op.homes', kind: 'camp', name: 'The homesteads', dist: 'near', state: 'visited', danger: 0, owner: 'colony', known: 'Nine stakes down the valley, a day\'s walk from the wire, each with a family\'s name burned into it.' };
op('world', s => s.world.type === 'garden' ? 1 : 0, { id: 'op.spread', view: 'people', tone: 'opportunity', title: 'Room to Spread',
  setup: s => LF.th.ctx(LF.cast(s, { val: 'free' })),
  text: (s, c) => `It is easy here, easier than anyone expected, and people have noticed. ${c.name || 'One of the field crew'} has asked, on behalf of nine families, to stake homesteads down the valley, a day's walk from the wire.\n\n"We'd still answer to the colony. We just want some room. Our own bit of ground."`,
  choices: [
    { label: 'Let them go, and mark the land as theirs', out: { text: 'Nine stakes go in down the valley, each with a name burned into it. The homesteads are farming within a month, and well. Their first harvest stays down the valley, and the kitchen inside the wire is nine families of field hands short.', fx: s => ({ yield: 0.03, food: -70, morale: 2, flags: { homesteads: true }, poi: HOMES, do: s2 => LF.emit(s2, 'schism', 'op.spread', 15, 200, 'part of the colony lives a day\'s walk from the rest') }) } },
    { label: 'One village, close by, inside a second wire', cost: { mat: 30 }, out: { text: 'A second hamlet goes up an hour from the first. It is less than they asked for, and near enough that they take it. The gate between the two wires is locked at dusk, and they are the ones on the outside of it.', fx: { yield: 0.015, morale: -1 } } },
    { label: (s, c) => `No, and ${c.first || 'their speaker'} goes on the ditch crew for asking`, dark: true, note: 'Nine families asked together. Nobody will ask together again.', info: [['yield', 'Every hand stays in the fields'], ['danger', 'Whoever spoke for them']],
      out: { text: (s, c) => `${c.name || 'Their speaker'} is read the answer in front of the field crew and handed a ditching spade. The stakes are burned with the kitchen waste. The nine families work the colony's fields through the season and do not bring anything to you again.`,
        fx: (s, c) => ({ yield: 0.01, morale: -2, stain: ['asked', 1], mark: c.pid ? [c.pid, 'ditch', 'was put on the ditch crew for asking for land'] : null, do: s2 => { const p = c.pid && byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 22, 0, 100); LF.emit(s2, 'resentment', 'op.spread', 20, 250, 'asking for land got someone put on the ditch crew'); } }) } },
    { label: 'Let them go. Their children board inside the wire', dark: true, note: 'It would be put as a matter of schooling.', info: [['yield', 'Farms that send in what they owe'], ['danger', 'Nine families']],
      out: { text: (s, c) => `The nine families stake their land. Their children sleep at the school inside the wire and walk home on rest days. ${c.first || 'Their speaker'} understands exactly what has been arranged, and signs. The homesteads farm well and send in every sack they owe.`,
        fx: s => ({ yield: 0.04, food: 120, morale: -1, flags: { homesteads: true }, stain: ['hostages', 1], poi: HOMES, do: s2 => LF.emit(s2, 'resentment', 'op.spread', 20, 300, 'the homesteaders\' children are kept inside the wire') }) } },
  ] });
op('world', s => s.world.type === 'ruin' ? 1 : 0, { id: 'op.pad', view: 'world', tone: 'opportunity', title: 'Under the Pad',
  text: s => `The lander came down on what everyone took for bare rock. A month of boots has scuffed it, and under the dirt it is paving: square-cut, fitted without mortar, running on under the camp. Something beneath it is warmer than the ground around it.\n\n${Nc(s, 'geologist')} has a pry bar and permission is being asked for, so far.`,
  choices: [
    { label: 'Lift a slab', test: { base: 55, mods: [R('geologist', 12), R('engineer', 6)] },
      ok: { text: 'A shaft, square, going down further than a lamp reaches. Fittings along one wall, still bright.', fx: { survey: 14, parts: 6 } },
      bad: { text: 'The slab comes up and the one next to it goes down, with two of the crew on it. One is brought up with a broken back. The other is not brought up. The hole is covered.', fx: { survey: 6, morale: -3, pop: -1 } } },
    { label: 'Move the camp off it', cost: { mat: 25 }, out: { text: 'The pods are walked a kilometre west onto ground that is only ground, and it takes every hand for nine days in the planting month. The paving is left to the weather.', fx: { morale: -1, food: -70 } } },
    { label: 'Build on it, and keep the night shift where it is', dark: true, note: 'The foundations are good. The people who work on them at night have asked to be moved.', info: [['yield', 'A workshop, for nothing'], ['danger', 'The night shift']],
      out: { text: 'The workshop goes up square on the old stones, the most level floor in the colony. The night shift say it is warm underfoot and that it hums. Three of them ask for other work and are told no. One of the three is found on the floor at the end of a shift with nothing wrong that the clinic can name.', fx: { mat: 35, parts: 3, pop: -1, morale: -1, stain: ['warm_floor', 1] } } },
    { label: 'Charges under four slabs, with the camp still on it', dark: true, note: 'Moving the pods first costs nine days in the planting month.', info: [['yield', 'Whatever is down there'], ['danger', 'The Lander, and whoever is near']], test: { base: 58, mods: [R('engineer', 12), R('geologist', 8)] },
      ok: { text: 'Four slabs go up and come down in pieces. Under them is a gallery the length of the camp, racked with fittings. A good many of them can be used as they are.', fx: { survey: 20, parts: 12, mat: 25, stain: ['blast', 1] } },
      bad: { text: 'The paving does not break. It carries the blast sideways under the camp, and the ground opens beneath the lander\'s forward leg and the two people nearest it.', fx: { pop: -2, survey: 6, machine: { lander: -10 }, stain: ['blast', 1] } } },
  ] });

/* ======================= HOW THE COLONY GOT HERE ======================= */
/* The caves behind a deep-site camp, once somebody has gone into them (js/places.js). */
const CAVES = st => ({ key: 'op.caves', kind: 'cave', name: 'The caves behind the camp', dist: 'near', state: st, danger: st === 'visited' ? 1 : 3,
  known: st === 'visited' ? 'They go back further than any lamp reaches. Two hundred metres in, a chamber with a cold clean spring.' : 'They go back further than any lamp reaches. A crew lost in them for a night came out one short, and they are roped off.' });
op('how', s => s.premise === 'meteor' && LF.down(s, 'reclaimer') ? 1.2 : 0, { id: 'op.shard', view: 'colony', tone: 'pressure', title: 'Still in the Housing',
  text: s => `The meteor that ended the voyage left pieces of itself in the ship, and some of those pieces came down in the lander. ${Nc(s, 'engineer')} has found three in the reclaimer's housing, fused into the casing.\n\n"They're holding a crack shut. Pull them and she splits. Leave them and they'll work loose on their own one day, whenever they feel like it. Probably at night."`,
  choices: [
    { label: 'Cut them out and reline the housing', cost: { parts: 8 }, out: { text: 'Two days with the reclaimer down and a cup of bottled water each. It runs better than it has since the strike. The clinic had two fever cases who needed more than a cup, and one of them died on the second night.', fx: { machine: { reclaimer: 10 }, cap: { reclaimer: 4 }, pop: -1 } } },
    { label: 'Leave them, and tell nobody what is holding it shut', dark: true, note: s => `Only ${N(s, 'engineer')} and you would know.`, info: [['yield', 'No spares spent, and nobody frightened'], ['danger', 'Everyone who drinks from it']],
      out: { text: 'A strain gauge is glued over each one and logged as a routine fitting. The colony drinks from the reclaimer without a second thought. The crack is still there, and so is whoever is standing beside the casing on the day it opens.', fx: { machine: { reclaimer: -4 }, cap: { reclaimer: -4 }, morale: 1, stain: ['shards', 1] } } },
    { label: s => `${h.F(s, 'engineer') === LF.ROLES.engineer.crew ? 'Someone' : h.F(s, 'engineer')} is ordered to weld a plate over it with the loop running`, dark: true, note: 'It saves the spares and the two dry days. The casing is under pressure the whole time, and nobody would volunteer.', info: [['yield', 'Repairs, for nothing'], ['danger', 'Whoever holds the torch']], test: { base: 62, mods: [R('engineer', 12)] },
      ok: { text: 'Six hours with a torch, a hand on the casing to feel it flex. The plate goes on over all three shards and the gauge needles settle.', fx: { machine: { reclaimer: 11 }, cap: { reclaimer: 4 }, stain: ['ordered_in', 1] } },
      bad: { text: s => `The casing lets go under the torch. ${Nc(s, 'engineer')} takes the steam full in the face and chest and lives four days. The reclaimer is patched afterwards by people reading the notes.`,
        fx: s => ({ kill: P(s, 'engineer') ? [{ who: 'engineer', cause: 'scalded welding the reclaimer casing under pressure' }] : [], pop: P(s, 'engineer') ? 0 : -1, machine: { reclaimer: -8 }, morale: -2, stain: ['ordered_in', 1] }) } },
  ] });
op('how', s => s.premise === 'cryo' && s.sleepers >= 12 ? 1.2 : 0, { id: 'op.thaw', when: s => s.sleepers >= 12, view: 'colony', tone: 'crisis', title: 'Thawing Early',
  text: s => `The cryo banks that ended the voyage are still failing, up in orbit. Twelve pods have gone amber on the board. ${Nc(s, 'physician')} gives them a month, perhaps two.\n\n"I can wake them now, into a colony that can't feed them. Or move them to the good banks, if the lander can make the trip. Or we wait, and you stand beside me and watch the board go red."`,
  choices: [
    { label: 'Wake them and bring them down', out: { text: 'Twelve people come down the ramp, sick and shaking, and are fed first, from bowls that other people were queuing for. Two of the twelve were thawed too fast and do not last the week.', fx: { pop: 10, sleepers: -12, food: -100, morale: -2, machine: { lander: -8 } } } },
    { label: 'Shift them to the good banks', cost: { parts: 6 }, test: { base: 55, mods: [R('pilot', 12), R('physician', 10)] },
      ok: { text: 'A long, careful flight. All twelve are moved and all twelve go green.', fx: { machine: { lander: -10 } } },
      bad: { text: 'Nine are moved. The other three are lost.', fx: { sleepers: -3, morale: -3, machine: { lander: -10 } } } },
    { label: 'Log them as stable, and wait', dark: true, note: s => `Half the colony has somebody in those banks. Only ${N(s, 'physician')} reads the board.`, info: [['yield', 'Nobody frightened, nothing spent'], ['danger', 'Some of the twelve']],
      out: { text: s => `The amber lights are entered in the log as green, and ${N(s, 'physician')} checks the board alone every morning. In the second month four of them go out. The four are logged as a fault found on that day, and the people who knew them are told it was quick.`, fx: { sleepers: -4, stain: ['amber', 1] } } },
    { label: 'Shut the twelve off and share out their coolant', dark: true, note: 'They are dying slowly as it is. What they are using would keep the other banks green.', info: [['yield', 'The other banks hold'], ['danger', 'Twelve sleepers']],
      out: { text: s => `It is done from the ground, by radio, one pod at a time. ${Nc(s, 'physician')} reads each name before the command is sent. The coolant and the cells go round the banks that are sound, and the board is green from end to end.`, fx: { sleepers: -12, parts: 8, machine: { lander: 4 }, stain: ['coolant', 1] } } },
  ] });
op('how', s => s.premise === 'bloom' ? 1.2 : 0, { id: 'op.grey', view: 'colony', tone: 'pressure', title: 'Grey in the Seed',
  text: s => `The grey mould that ate the ship's stores came down with the seed. ${Nc(s, 'botanist')} has found it in a third of the lockers, faint, a dusting on the husks.\n\n"That's a third of the seed. Burn it and it's gone. Sow it and the mould's in the ground for good."`,
  choices: [
    { label: 'Burn every locker it touched', out: { text: 'The smoke is grey too. A third of the colony\'s seed is gone in an afternoon, and the rest is clean. The first harvest will be short by that third, and the kitchen will be told to stretch it.', fx: { yield: -0.03, food: -60, morale: -1 } } },
    { label: 'Wash the seed, and sow it in its own plots', test: { base: 55, mods: [R('botanist', 15)] },
      ok: { text: 'Washed in hot brine and dried in the sun. The quarantined plots come up clean.', fx: { yield: 0.01 } },
      bad: { text: 'The quarantined plots come up grey. So, a month later, do the plots beside them.', fx: { yield: -0.04, food: -60 } } },
    { label: 'Sow it. The soil here may kill it', out: { text: 'It is sown with the rest. The soil here does not kill it. The mould takes a share of every crop the colony will ever grow, and in a wet year the share is most of it.', fx: { yield: -0.03 } } },
    { label: 'Mill the grey lockers into the field crews\' bread, and say nothing', dark: true, note: 'A third of the seed is a month of bread. Nobody knows what the mould does in a gut, and nobody would eat it if asked.', info: [['yield', 'Food'], ['danger', 'Whoever eats it']], test: { base: 62, mods: [R('physician', 10)] },
      ok: { text: 'The grey seed is milled, baked hard and eaten. It tastes of cellar. Nobody is worse for it, and the clean lockers go into clean ground.', fx: { food: 320, yield: -0.02, stain: ['dosed', 1] } },
      bad: { text: 'The bread tastes of cellar. In the third week the mould is found growing in the people who ate most of it, which is the people who work hardest. Three of them die of it, and the kitchen is asked what was in the flour.', fx: { food: 160, yield: -0.02, pop: -3, morale: -3, stain: ['dosed', 2] } } },
  ] });
op('how', s => s.premise === 'engine' ? 1.2 : 0, { id: 'op.burn', when: s => s.sleepers >= 25, view: 'world', tone: 'opportunity', title: 'The Last Burn',
  text: s => `The ship's engine had one burn left, and it was spent getting here. There is still propellant in the tanks: not enough to go anywhere, enough to drop the ship into a lower orbit, where the lander can reach it in an hour instead of a day.\n\n${Nc(s, 'pilot')}: "Lower means it comes down. Thirty years. Maybe on us. That's a problem for thirty years from now."`,
  choices: [
    { label: 'Bring it down low, and strip it', out: { text: 'The ship settles lower. The lander makes salvage runs every week, and the yard fills with plate. The burn shook the oldest cryo bank, and four of its lights went out on the way down.', fx: { mat: 70, parts: 6, sleepers: -4, machine: { lander: -8 }, flags: { ship_low: true } } } },
    { label: 'Keep it high, as a relay and a store', out: { text: 'It stays where it is, a bright star at dusk, with the sleepers in it. Every flight up to them costs the lander a day each way, and the plate in her hull stays where nobody can use it.', fx: { survey: 6, machine: { lander: -4 } } } },
    { label: 'Bring it low, and take the shielding off the cryo banks', dark: true, note: 'The banks are wrapped in the best plate on the ship. Without it they run warm.', info: [['yield', 'Plate and parts'], ['danger', 'A fifth of the sleepers']],
      out: { text: 'The ship settles lower and the salvage runs begin with the cryo deck. The shielding comes down in sheets and the yard has never been so full. The banks run warm behind what is left, and the board loses a light or two every week until it has lost twenty-five, or every light it had.', fx: s => ({ mat: 140, parts: 12, sleepers: -Math.min(25, s.sleepers), machine: { lander: -6 }, flags: { ship_low: true }, stain: ['shielding', 2] }) } },
  ] });
op('how', s => s.premise === 'claimed' ? 1.2 : 0, { id: 'op.listen', view: 'world', tone: 'pressure', title: 'The Same Voice',
  text: s => `The beacon that warned the ship off its first target is audible here, faint, on the same band. ${Nc(s, 'pilot')} has triangulated it. It is coming from somewhere in this system, and nowhere near the old target.\n\n"A post in this system, or a relay with someone listening at the far end. I want to know which."`,
  choices: [
    { label: 'Radio silence, starting now', out: { text: 'The long-range set is switched off and sealed. The colony talks to itself on hand radios turned down low.', fx: s => ({ morale: -1, do: s2 => LF.emit(s2, 'fear', 'op.listen', 15, 150, 'someone in the system may be listening') }) } },
    { label: 'Answer it, plainly', out: { text: 'A short message on the same band: who the colony is, how many, that it means no one any harm. Nothing answers. The beacon goes on.', fx: s => ({ do: s2 => LF.emit(s2, 'heard', 'op.listen', 30, 400, 'the colony answered the beacon on its own band') }) } },
    { label: 'Find the source', test: { base: 50, mods: [R('pilot', 12), If(s => !!(s.cargo && s.cargo.drones), 15, 'The survey drones')] },
      ok: { text: 'A buoy, old, solar, in orbit round the outer moon. Nobody has listened at the other end for a long time.', fx: { survey: 12, morale: 3 } },
      bad: { text: 'Two weeks of plotting, with the set transmitting the whole time to get a return, and a figure nobody trusts. Somewhere out past the outer moon. Whatever is there has had two weeks to plot the colony.', fx: s => ({ survey: 4, do: s2 => LF.emit(s2, 'fear', 'op.listen', 20, 200, 'the colony gave away its position looking for the beacon') }) } },
    { label: 'Answer it with a lie', note: 'Four thousand colonists, armed, with a second ship a year behind.', info: [['danger', 'If anyone comes to check']],
      out: { text: 'The message goes out on the beacon\'s own band, in the mission\'s formal style: four thousand, armed, a second ship a year behind. The camp sleeps better for having said it. Nothing answers, and now the claim is on the record of whoever was listening.', fx: s => ({ morale: 2, do: s2 => { LF.emit(s2, 'heard', 'op.listen', 35, 400, 'the colony told the beacon it was four thousand strong'); LF.ease(s2, 'fear', 'op.listen', 8, 150); } }) } },
  ] });
op('how', s => s.premise === 'astray' ? 1.2 : 0, { id: 'op.sky', view: 'world', tone: 'quiet', title: 'A Sky Nobody Charted',
  text: s => `The ship was never meant to be in this system, and there are no charts of it. No names for the planets, no tables for the tides, no warning of what comes round on long orbits. ${Nc(s, 'pilot')} wants a season with the telescope.\n\n"We don't know how long the year is. We don't know what comes round on the long orbits. One season with the telescope."`,
  choices: [
    { label: 'Give the pilot the season, and a crew', out: { text: 'A season of nights on the ridge, for six people who would otherwise have been digging. The year turns out to be longer than anyone guessed, and the colony has a calendar of its own and a thinner first harvest.', fx: { survey: 18, food: -70, poi: { key: 'op.ridge', kind: 'ridge', name: 'The telescope ridge', dist: 'near', state: 'visited', danger: 0, known: 'Six people spent a season of nights up here with the telescope, and worked out the length of the year.' } } } },
    { label: 'Let the colony name the stars', out: { text: 'A box in the mess hall, a slip each. The brightest star in the west is named after a dog that died on the voyage. The length of the year goes unmeasured, and the season turns three weeks before the field crews had planned for, with the last of the crop still standing.', fx: { morale: 4, food: -90 } } },
  ] });
op('how', s => s.premise === 'dead' ? 1.2 : 0, { id: 'op.plan', view: 'colony', tone: 'pressure', title: 'The Mission Plan',
  text: s => `The mission plan is four hundred pages, written for the dead world the ship was sent to: where to land, what to build first, which crops in which order. ${Nc(s, 'quartermaster')} has been following it, because it is the only plan there is.\n\n${Nc(s, 'botanist')} says the ground disagrees with nearly all of it.`,
  choices: [
    { label: 'Throw it out. Plan for this world', out: { text: 'The binders go on a shelf. The officers sit up three nights and write twelve pages of their own, and argue about every one.', fx: { morale: -1, survey: 8, yield: 0.02 } } },
    { label: 'Keep its order. It was thought through', out: { text: 'The plan is followed, chapter by chapter, adjusted where it plainly fails. People find it steadying. The second sowing goes in by the book, in the month the book says, which on this world is the wrong one.', fx: { morale: 3, yield: -0.02, food: -60 } } },
  ] });
op('how', s => ({ delta: 0.8, highland: 0.8, deep: 0.8, coast: 0.8 }[site(s)] || 0), { id: 'op.ground', view: 'world', tone: 'pressure', title: 'The Ground We Chose',
  text: s => ({
    delta: `The delta was chosen for its soil, and the soil is as good as promised. The river has risen twice since landfall, and the second time it took the lowest field with it.\n\n${Nc(s, 'geologist')} wants a levee. ${Nc(s, 'botanist')} wants the fields moved.`,
    highland: `The highland was chosen because it could be held. It also has a wind that never stops, and it has already taken a pod roof, three hats and everyone's temper. ${Nc(s, 'engineer')} says the wind's the only thing here there's too much of.`,
    deep: `The deep site was chosen to be out of the weather. The caves behind the camp go back further than any lamp reaches, and every night something in them drips, or moves, or both. Two crews have asked to explore. Two others have asked for a door.`,
    coast: `The coast was chosen for the sea. Every morning the tide leaves a line of things on the sand: weed, shells, small soft animals that die in the sun. ${Nc(s, 'xenobio')} says about half of it can be eaten. Nobody has asked which half.` })[site(s)],
  choices: [
    { label: s => ({ delta: 'Build the levee', highland: 'Put up turbines and use it', deep: 'Explore the caves', coast: 'Find out which half' })[site(s)],
      test: { base: 55, mods: [R('engineer', 10), R('geologist', 8), R('xenobio', 8)] },
      ok: { text: s => ({ delta: 'A long bank of earth and woven brush. The river comes up to it and stops.', highland: 'Three turbines on the ridge, turning all day. The lights stop dipping.', deep: 'Two hundred metres back the cave opens into a chamber with a cold clean spring. The colony has water of its own.', coast: 'A list, with drawings, pinned up in the kitchen. The tideline feeds twenty people a day.' })[site(s)],
        fx: s => ({ delta: { yield: 0.03, mat: -15 }, highland: { machine: { reactor: 8 }, mat: -15, flags: { wind_found: true } }, deep: { survey: 12, machine: { reclaimer: 8 }, poi: CAVES('visited'), flags: { water_found: true } }, coast: { food: 150, survey: 6 } })[site(s)] },
      bad: { text: s => ({ delta: 'The levee is half built when the river rises again. The water goes round the end of it and into the fields.', highland: 'The first turbine tears itself off the ridge in a gust, and the second is not built.', deep: 'A crew is lost for a night in the dark and comes out frightened, empty-handed and one short. The caves are roped off.', coast: 'Six people are sick for a week, and two of them do not get up again. The list is short, and nobody trusts it.' })[site(s)],
        fx: s => ({ delta: { food: -80, mat: -30 }, highland: { parts: -5, mat: -20 }, deep: { morale: -3, pop: -1, poi: CAVES('located') }, coast: { morale: -3, pop: -2 } })[site(s)] } },
    { label: s => ({ delta: 'Move the fields up the bank', highland: 'Build low, behind windbreaks', deep: 'A door across the cave mouth', coast: 'Leave the tideline to the birds' })[site(s)],
      out: { text: s => ({ delta: 'The new fields are poorer and higher, and dry.', highland: 'Stone walls on the windward side of everything. The camp hunkers down like a sheep.', deep: 'A wall of plate and a bolted hatch. The dripping goes on behind it.', coast: 'The sand is left alone. Whatever eats the weed eats it, and the kitchen queue watches it from the top of the beach.' })[site(s)],
        fx: s => ({ delta: { yield: -0.02 }, highland: { mat: -20, morale: 2 }, deep: { mat: -15, morale: 2 }, coast: { food: -40, morale: -1 } })[site(s)] } },
    { label: s => ({ delta: 'Dig the levee through the nights, on double shifts', highland: 'Guy the turbines by hand through the first big wind', deep: 'Send the two smallest down the wet crawl on a rope', coast: 'Serve all of it, and see who is sick' })[site(s)], dark: true,
      note: s => ({ delta: 'It would be finished before the river rises again. Tired people drown in ditches.', highland: 'Somebody has to be up there holding it when the gusts come.', deep: 'Nobody else fits, and the crawl has not been seen past the first bend.', coast: 'It is the quick way to find out which half.' })[site(s)], info: [['yield', 'What the ground was chosen for'], ['danger', 'Whoever is sent']],
      out: { text: s => ({ delta: 'The bank is closed in eleven nights by people asleep on their shovels. Two of them go into the cut in the dark and are found at first light. The river comes up to the levee and stops.',
          highland: 'Three turbines go up, and six people hold the guys through the first big wind. One is taken off the ridge with the cable still in both hands. The lights stop dipping.',
          deep: 'They are fifteen and seventeen. The crawl opens into a chamber with a cold clean spring, and only one of them comes back along the rope to say so. The colony has water of its own.',
          coast: 'Everything the tide left goes into the pot for a week, and the kitchen writes down who ate what. Two people die of the wrong half. The list pinned up afterwards is long, and people trust it. The tideline feeds twenty a day.' })[site(s)],
        fx: s => Object.assign({ stain: ['expend', 1], morale: -1 }, ({ delta: { yield: 0.03, pop: -2 }, highland: { machine: { reactor: 8 }, pop: -1, flags: { wind_found: true } }, deep: { survey: 12, machine: { reclaimer: 8 }, pop: -1, poi: CAVES('visited'), flags: { water_found: true } }, coast: { food: 220, survey: 6, pop: -2 } })[site(s)]) } },
  ] });
op('how', s => s.world.landingDamage === 'reactor' ? 0.7 : 0, { id: 'op.broken', view: 'colony', tone: 'pressure', title: 'What the Descent Broke',
  text: s => { const m = s.world.landingDamage, n = LF.MACHINES[m].name; return `The ${n} has not been right since the descent, and it is getting worse, and everything else runs off it. ${Nc(s, 'engineer')} has been nursing it for a month.\n\n"I can strip something else and rebuild her properly. Or burn through the spares. Or keep nursing her and hope she holds. She won't, but I can try."`; },
  choices: [
    { label: 'Strip parts out of the lander to rebuild it', show: s => s.world.landingDamage !== 'lander', out: { text: s => `The lander gives up its spares one by one. The ${LF.MACHINES[s.world.landingDamage].name} runs as it did on the ship.`, fx: s => ({ machine: { [s.world.landingDamage]: 18, lander: -14 }, cap: { [s.world.landingDamage]: 6 } }) } },
    { label: 'Rebuild it from stores', cost: { parts: 10 }, out: { text: 'A month of work and most of the spares cupboard. It runs better than it did, though not the way it left the yard.', fx: s => ({ machine: { [s.world.landingDamage]: 15 } }) } },
    { label: 'Keep nursing it', out: { text: s => `${Nc(s, 'engineer')} sleeps in the machine hall for a month, and the ${LF.MACHINES[s.world.landingDamage].name} limps on. Everything that depends on it runs short for the season, and the people at the end of each queue are the ones who notice.`, fx: s => ({ machine: { [s.world.landingDamage]: 4 }, cap: { [s.world.landingDamage]: -5 }, food: -50, morale: -1 }) } },
    { label: 'Order it opened while it runs', dark: true, note: 'No spares and no stripping. Somebody works inside the housing with it live, and it will not be somebody who offered.', info: [['yield', 'Repairs, for nothing'], ['danger', 'Whoever goes inside']], test: { base: 62, mods: [R('engineer', 12)] },
      ok: { text: s => `Nine hours inside the housing of the ${LF.MACHINES[s.world.landingDamage].name} with it running, a lamp in the teeth. The fault was a thing the size of a thumbnail. It runs as it did on the ship.`, fx: s => ({ machine: { [s.world.landingDamage]: 20 }, cap: { [s.world.landingDamage]: 6 }, stain: ['ordered_in', 1] }) },
      bad: { text: s => `${Nc(s, 'engineer')} is inside the housing when it catches. It takes four people to shut the ${LF.MACHINES[s.world.landingDamage].name} down and longer to get the body out, and then the machine has to be started again, because the colony needs it.`,
        fx: s => ({ kill: P(s, 'engineer') ? [{ who: 'engineer', cause: 'killed inside a running machine, repairing it' }] : [], pop: P(s, 'engineer') ? 0 : -1, machine: { [s.world.landingDamage]: -6 }, morale: -2, stain: ['ordered_in', 1] }) } },
  ] });

/* ======================= WHAT IT BROUGHT ======================= */
op('brought', s => cargo(s, 'drones') ? 1 : 0, { id: 'op.flight', view: 'world', tone: 'opportunity', title: 'First Flight',
  text: s => `The survey drones are unpacked and charged. ${Nc(s, 'pilot')} has a flight plan for each: a long loop for the near country, or one straight out as far as the batteries go and back.\n\n"Wide or far. Batteries for one this season. Pick."`,
  choices: [
    { label: 'Wide: know the near country properly', out: { text: 'A month of loops, and two drones lost to the wind. Every gully within a day\'s walk is on the map, and two of them are marked in red.', fx: s => ({ survey: 20, parts: -2, poi: { key: 'op.gully', kind: 'mark', name: 'A gully marked in red', dist: 'near', state: 'located', danger: 3, known: 'One of two gullies the drones marked in red on the near-country map. Nobody has walked down into it.' }, do: s2 => { const f = s2.factors.filter(x => x.stage === 0 && LF.KINDS[x.kind] && !x.dormant).sort((a, b) => a.onset - b.onset)[0]; if (f) f.insight = clamp(f.insight + 25, 0, 100); } }) } },
    { label: 'Far: see what is out there', out: { text: 'One drone comes back. The pictures it brings are of things nobody has a word for yet.', fx: s => ({ survey: 30, sched: s.flags.ore_found ? null : [['plan.prospect', 5, 20]], poi: { key: 'op.drone', kind: 'signal', name: 'What the drone saw', dist: 'long', state: 'rumoured', danger: 2, known: 'The last pictures the far drone sent before it turned for home: shapes on the ground nobody has a word for yet.' } }) } },
  ] });
op('brought', s => cargo(s, 'arms') ? 1 : 0, { id: 'op.key', view: 'people', tone: 'pressure', title: 'The Key to the Locker',
  text: s => `The arms locker came down in the hold, and so far its key has been on ${N(s, 'security')}'s belt, which nobody voted for. People have started asking whose it is.\n\n${Nc(s, 'chaplain')} would like it in a box with two locks. ${Nc(s, 'security')} would like to keep doing the job.`,
  choices: [
    { label: 'Security keeps it, and writes down who was asking', dark: true, info: [['yield', 'A watch that stands with you'], ['danger', 'Everyone on the list']],
      out: { text: s => `${Nc(s, 'security')} keeps the key and starts a notebook. The people in it find themselves on the far details and the night watches. The question is not raised at a meal again.`, fx: s => ({ morale: -1, stain: ['askers', 1], do: s2 => { const p = P(s2, 'security'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal + 12, 0, 100); LF.emit(s2, 'fear', 'op.key', 18, 200, 'asking about the arms locker gets a name written down'); } }) } },
    { label: 'Two keys, two officers', out: { text: s => `Two locks are fitted. The keys go to two officers who do not much like each other, which everyone agrees is the point. ${Nc(s, 'security')} hands the old key over without a word, and is slower to turn out after that.`, fx: s => ({ morale: 2, do: s2 => { const p = P(s2, 'security'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 10, 0, 100); } }) } },
    { label: 'Your belt, and nobody else\'s', out: { text: s => `The key goes on your belt. People notice it there. ${Nc(s, 'security')} has a watch to run and no way to arm it without asking, and says so to the watch.`, fx: s => ({ do: s2 => { const p = P(s2, 'security'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 14, 0, 100); LF.emit(s2, 'zeal', 'op.key', 15, 150, 'the arms locker answers to one person'); } }) } },
  ] });
op('brought', s => cargo(s, 'genebank') ? 1 : 0, { id: 'op.herd', view: 'colony', tone: 'opportunity', title: 'The Embryos',
  text: s => `The gene bank holds frozen embryos: goats, chickens, a breed of sheep bred for poor pasture. ${Nc(s, 'physician')} can bring a few to term in the clinic now. They will eat before they feed anyone.\n\n"Or we wait till the ground's proven. They'll keep, and frozen they don't eat. I'd sooner see the people fed first, if you're asking me."`,
  choices: [
    { label: 'Goats and chickens, now', out: { text: 'The clinic smells of straw for a month. Then there are kids on the ramp and eggs in the kitchen, and children who have never seen an animal follow them about.', fx: { food: -60, yield: 0.025, morale: 4 } } },
    { label: 'Wait for proven ground', out: { text: 'The bank stays cold. The children who were promised animals are told next year, and the kitchen goes on serving what it has always served.', fx: { morale: -2 } } },
  ] });
op('brought', s => cargo(s, 'archive') ? 1 : 0, { id: 'op.lessons', view: 'people', tone: 'quiet', title: 'Evening Lessons',
  text: s => `The archive is unpacked, and ${N(s, 'teacher')} has started holding lessons in the mess hall after supper: soil chemistry one night, welding the next, old poems the third. Thirty people came to the first. Forty to the second.\n\n${Nc(s, 'quartermaster')} has noticed they are tired the next morning.`,
  choices: [
    { label: 'Every night, and count it as work', out: { text: 'The lessons go on the roster, and the hours come off the fields. Within a season half the colony can do a second trade, and the first harvest is short by what forty people did not dig.', fx: { survey: 6, parts: 4, morale: 2, food: -70 } } },
    { label: 'Rest days only', out: { text: 'One evening a week. The hall is always full.', fx: { morale: 2 } } },
  ] });
op('brought', s => cargo(s, 'sleepers') && s.grounded > 0 ? 1 : 0, { id: 'op.hold', view: 'people', tone: 'pressure', title: 'Thirty in the Hold',
  text: s => `The thirty sleepers who came down in the hold are still in their pods, in a shed by the lander, on ship's power. ${Nc(s, 'physician')} wants them woken: "They're no good to anyone asleep down here, and those pods were never built for gravity. Every month we wait, I'm gambling with thirty people, and I'll be the one reading you the names." ${Nc(s, 'quartermaster')} has the stores figure.`,
  choices: [
    { label: 'Wake them all', out: { text: 'Thirty people blink in the light, and are given a meal and a job in that order. The meal comes out of bowls that were already short, and the queue at the kitchen is half as long again.', fx: s => ({ pop: Math.min(30, s.grounded || 30), food: -140, morale: 2, do: s2 => { s2.grounded = 0; } }) } },
    { label: 'Wake the ten who can dig. The rest wait for the harvest', dark: true, note: 'The manifest gives each one a trade. The pods were never built for gravity, and some of the twenty will fail.', info: [['yield', 'Ten pairs of hands'], ['danger', 'The ones the manifest did not favour']],
      out: { text: s => `${Nc(s, 'quartermaster')} goes down the manifest with a pencil. Ten are woken, all of them under forty and none of them clerks. Of the twenty left in the shed, four lights go out before the harvest.`,
        fx: s => ({ pop: Math.min(10, s.grounded || 10), food: -30, chips: [[`${Math.max(0, Math.min(4, (s.grounded || 0) - 10))} sleepers dead in the shed`, false]], stain: ['sorted', 1], do: s2 => { s2.grounded = Math.max(0, (s2.grounded || 0) - 14); } }) } },
    { label: 'Leave them in the pods until the harvest', dark: true, note: 'Nobody asleep eats. The pods were never built for gravity, and some will fail.', info: [['yield', 'Thirty fewer mouths this season'], ['danger', 'About one pod in three']],
      out: { text: s => `The shed stays on ship's power and nobody is woken. ${Nc(s, 'physician')} walks the row every morning and writes down which lights have gone out. By the harvest it is eleven. The ones who are left will wake to full bins and will not be told how long they lay there.`,
        fx: s => ({ food: 60, morale: -1, chips: [[`${Math.min(11, s.grounded || 0)} sleepers dead in the shed`, false]], stain: ['pods', 2], do: s2 => { s2.grounded = Math.max(0, (s2.grounded || 0) - 11); } }) } },
  ] });
op('brought', s => cargo(s, 'spares') ? 1 : 0, { id: 'op.spares', view: 'colony', tone: 'opportunity', title: 'The Spares Crate',
  text: s => `The spares crate is the colony's insurance: bearings, boards, seals, enough to keep the machines alive for years. ${Nc(s, 'engineer')} wants to keep it sealed. ${Nc(s, 'geologist')} wants some of it now, for a drill rig to find ore.\n\n"Spares run out, everything runs out, but give me a rig and some ore and we make our own, and think what else is down there, no wait, I'm getting ahead of myself, just give me the rig!"`,
  choices: [
    { label: 'Build the rig', out: { text: 'The rig goes up within the month and starts biting into the hill.', fx: s => ({ parts: -8, survey: 10, sched: s.flags.ore_found ? null : [['plan.prospect', 5, 20]] }) } },
    { label: 'Keep the crate sealed', out: { text: s => `The crate stays shut. ${Nc(s, 'engineer')} sleeps better for it. ${Nc(s, 'geologist')} goes on looking for ore with a hammer and a sample bag, and is a season behind where a rig would have been.`, fx: { morale: 1 } } },
  ] });
op('brought', s => cargo(s, 'medkit') ? 1 : 0, { id: 'op.ward', view: 'people', tone: 'opportunity', title: 'Twelve Beds',
  text: s => `The field hospital is still in its crates: twelve folding beds, a drug store packed in ice, a second set of surgical tools. ${Nc(s, 'physician')} wants it set up as a ward now, while nobody is ill. ${Nc(s, 'quartermaster')} points out that a ward needs a building, and the colony has not got a spare one.\n\n"Then it stays packed, and we set it up on the worst day of the year. In the rain. With somebody bleeding on me."`,
  choices: [
    { label: 'Build the ward now', cost: { mat: 20 }, out: { text: 'A long low hut goes up beside the clinic, with the twelve beds made and the drugs in a locked chest. People walk past it on the way to shift and are glad it is there.', fx: s => ({ morale: 2, do: s2 => LF.ease(s2, 'sickness', 'op.ward', 12, 600) }) } },
    { label: 'Keep it packed, for the bad day', out: { text: s => `The crates go in the clinic store. ${Nc(s, 'physician')} labels each one with what it is for, in letters large enough to read by torchlight.`, fx: { machine: { medbay: 5 } } } },
  ] });
op('brought', s => cargo(s, 'workshop') ? 1 : 0, { id: 'op.lathe', view: 'colony', tone: 'opportunity', title: 'The Lathe',
  text: s => `The machine shop is bolted down and running. ${Nc(s, 'engineer')} wants it working through the night, turning fittings for every machine in the colony while the colony is young and they are cheap to make. The night shift would be two people who are already doing a day's work.\n\n"Or I teach. Four apprentices, few hours a day. Give it a year and there's five of us, and I might get some sleep."`,
  choices: [
    { label: 'Run it through the night', out: { text: 'The lathe runs until the small hours for a month. The fittings pile up on the shelves. In the fourth week it takes a tired machinist\'s hand off at the wrist.', fx: s => ({ parts: 8, morale: -2, do: s2 => LF.emit(s2, 'exhaustion', 'op.lathe', 25, 90, 'the machine shop runs all night') }) } },
    { label: 'Teach four apprentices', out: { text: 'Four volunteers learn to turn a bearing, badly and then well. By the end of the season the machine shop has five pairs of hands that know it, and a shelf of scrapped fittings. The fields did without the four for the season.', fx: { morale: 2, machine: { fabricator: 4 }, parts: -3, food: -50 } } },
    { label: 'The two best machinists, nights, until the shelves are full', dark: true, note: 'They are asked in a way that is not a question.', info: [['yield', 'Spares'], ['danger', 'The two']],
      out: { text: 'The two are taken off every other roster and the workshop door is shut behind them at dusk. The shelves fill faster than anyone thought two people could fill them. One of the two is found in the morning, in the second month, asleep against the belt guard with the belt still running.',
        fx: s => ({ parts: 18, pop: -1, morale: -1, stain: ['night_shift', 1], do: s2 => LF.emit(s2, 'exhaustion', 'op.lathe', 20, 90, 'the machine shop runs all night') }) } },
  ] });
op('brought', s => cargo(s, 'seedlings') ? 1 : 0, { id: 'op.trays', view: 'colony', tone: 'pressure', title: 'Three Hundred Trays',
  text: s => `The seedlings came down alive, all three hundred trays, and they are outgrowing their pots under the grow lamps. ${Nc(s, 'botanist')} could plant them out this month, into ground nobody has grown anything in, or harden them off slowly in the shade of the lander first and lose a month.\n\n"Some'll die whichever way. It's how many that matters. And whether we learn anything from it."`,
  choices: [
    { label: 'Plant them all out this month', test: { base: 55, mods: [R('botanist', 15), If(s => s.flags.site_delta, 10, 'The delta soil')] },
      ok: { text: 'Most of them take. Within a month there are green rows where there was bare ground, and the first salad of the colony is eaten standing up in the field.', fx: { food: 80, yield: 0.02, morale: 2 } },
      bad: { text: 'Half of them wilt in the first week, in soil that is not what anyone thought it was. The half that live are tough.', fx: { yield: 0.01 } } },
    { label: 'Harden them off first', out: { text: 'A month in the shade, a little more sun each day. They go out late, and nearly all of them live.', fx: { yield: 0.015 } } },
  ] });
const ROVER = { key: 'op.rover', kind: 'mark', name: 'A question mark on the survey map', dist: 'far', state: 'rumoured', danger: 2, known: 'The rover\'s tracks turned back short of it. Whatever made the crew mark it was seen through the glasses, from a long way off.' };
op('brought', s => cargo(s, 'rover') ? 1 : 0, { id: 'op.rover', view: 'world', tone: 'opportunity', title: 'Six Wheels',
  text: s => `The rover has done nothing yet but ferry crates from the lander. ${Nc(s, 'geologist')} wants it out on the plain for a month with a survey kit. ${Nc(s, 'quartermaster')} wants it hauling rock and fill for the pod walls before the weather turns.\n\n"It's one rover. One job this season."`,
  choices: [
    { label: 'Out on the plain, to see what is there', out: { text: 'A month of tracks out and back. The map on the survey office wall triples in size, and two places on it have a question mark.', fx: { survey: 18, poi: ROVER } } },
    { label: 'Hauling, until the pods are done', out: { text: 'Load after load comes in on the winch. The pods get their second walls a month early.', fx: { mat: 45, morale: 1 } } },
    { label: 'Both. Drive it day and night', note: 'Two drivers, one asleep in the back. The rover has no lights worth the name.', info: [['yield', 'The map and the walls'], ['danger', 'The drivers, and the rover']], test: { base: 54, mods: [R('geologist', 8), R('pilot', 8)] },
      ok: { text: 'Survey by day, haulage by night, for a month. The map triples, the pods get their second walls, and the two drivers sleep for most of the month after.', fx: { survey: 18, mat: 45, poi: ROVER } },
      bad: { text: 'In the third week it goes into a gully in the dark and rolls. The driver at the wheel is killed, and the one asleep in the back walks home. The rover is winched out and is a month in the workshop.', fx: { survey: 8, mat: 15, pop: -1, parts: -3 } } },
  ] });
op('brought', s => cargo(s, 'fuel') ? 1 : 0, { id: 'op.fuel', view: 'colony', tone: 'pressure', title: 'Spare Propellant',
  text: s => `The two tanks of lander fuel are lashed down under a tarpaulin at the edge of the pad. They are the colony's spare flights. ${Nc(s, 'pilot')} wants to use one now, while the ship is still overhead, to bring down what the holds could not: tools, plate, the last of the stores.\n\n${Nc(s, 'engineer')} would rather keep both for the day the lander is needed and the colony cannot afford to lose it.`,
  choices: [
    { label: 'One extra flight now', test: { base: 60, mods: [R('pilot', 15), M('lander', 8)] },
      ok: { text: 'The lander goes up empty and comes down heavy. The pad is covered in crates by nightfall.', fx: { mat: 50, parts: 5, machine: { lander: -6 } } },
      bad: { text: 'The flight goes up, and a fault brings it back half loaded and hot. Nobody is hurt. The lander needs a month of work.', fx: { mat: 20, machine: { lander: -14 } } } },
    { label: 'Keep both for the bad day', out: { text: 'The tanks stay under their tarpaulin, and somebody checks the straps every week.', fx: { machine: { lander: 6 } } } },
  ] });
op('brought', s => cargo(s, 'plate') ? 1 : 0, { id: 'op.yard', view: 'colony', tone: 'pressure', title: 'The Plate Yard',
  text: s => `The cut plate is stacked in a yard behind the lander, more of it than the colony has ever had in one place. ${Nc(s, 'security')} wants a stockade round the camp, now, before anyone knows what lives here. ${Nc(s, 'engineer')} wants floors and roofs: the pods are cold, the ground is wet, and people sleep badly.\n\n"There's plate for one, not both. I'd put a roof on first, but you're the one who has to pick."`,
  choices: [
    { label: 'The stockade', out: { text: 'It goes up within the month, plate on posts, with a gate that locks. People feel safer, and look at the wall more than they expected to. Behind it the pods are as cold and wet as they were, and an old man with a bad chest does not see the end of the wet season.', fx: s => ({ pop: -1, do: s2 => { LF.ease(s2, 'fear', 'op.yard', 15, 400); LF.emit(s2, 'confinement', 'op.yard', 12, 200, 'the colony lives inside its own stockade'); } }) } },
    { label: 'Floors and roofs', out: { text: s => `Every pod gets a raised floor and a second roof, and people sleep. There is no wall. ${Nc(s, 'security')} doubles the night watch to make up for it, and the watch is drawn from the people who had just started sleeping.`, fx: s => ({ morale: 2, do: s2 => { LF.ease(s2, 'exhaustion', 'op.yard', 6, 400); LF.emit(s2, 'fear', 'op.yard', 14, 250, 'there is nothing between the pods and whatever lives here'); } }) } },
  ] });
op('brought', s => cargo(s, 'still') && LF.down(s, 'reclaimer') ? 1 : 0, { id: 'op.still', view: 'colony', tone: 'opportunity', title: 'Two Stills',
  text: s => `The second still is unpacked and works. ${Nc(s, 'engineer')} could keep it crated as the spare it was sent as. ${Nc(s, 'physician')} wants both running, and the extra water piped to a bathhouse: "Half the rashes in my clinic are people who haven't had a proper wash since the ship."`,
  choices: [
    { label: 'Run both, and build the bathhouse', cost: { mat: 20 }, out: { text: 'A hut with six showers and a boiler goes up by the reclaimer. There is a queue every evening, and the clinic gets quieter.', fx: s => ({ morale: 3, machine: { reclaimer: -4 }, do: s2 => LF.ease(s2, 'sickness', 'op.still', 10, 500) }) } },
    { label: 'Keep it crated, as the spare', out: { text: s => `The still goes back in its crate, with the membranes. ${Nc(s, 'engineer')} writes "DO NOT OPEN" on the lid, and then, underneath, "unless".`, fx: { machine: { reclaimer: 6 } } } },
  ] });
op('brought', s => cargo(s, 'racks') && LF.down(s, 'hydroponics') ? 1 : 0, { id: 'op.racks', view: 'colony', tone: 'pressure', title: 'Forty Racks',
  text: s => `The spare hydroponic racks are standing in the bay, still folded. ${Nc(s, 'botanist')} wants all forty planted now, while the fields are still a guess. ${Nc(s, 'engineer')} points out that forty more racks means forty more pumps on the reactor, and that the bay was never built to run that hard.\n\n"Twenty, then, and keep the other twenty back for when the first lot break. They will."`,
  choices: [
    { label: 'All forty, now', out: { text: 'The bay is green to the ceiling within a month, and loud with pumps. The reactor runs a little hotter for it.', fx: { food: 60, yield: 0.02, machine: { reactor: -5, hydroponics: -4 } } } },
    { label: 'Twenty, and twenty kept back', out: { text: 'Half the racks go up. The other half are stacked against the wall, and every one gets used within two years.', fx: { yield: 0.01, machine: { hydroponics: 6 } } } },
  ] });
op('brought', s => cargo(s, 'rations') ? 1 : 0, { id: 'op.rations', view: 'people', tone: 'quiet', title: 'The Foil Packs',
  text: s => `The ship's rations are stacked in the store: grey foil, ten years past their date, tasting of nothing much. ${Nc(s, 'security')} wants them locked away as the colony's lean-year reserve. ${Nc(s, 'botanist')} would rather everyone ate them now, so the first harvest can go back in the ground as seed.\n\n"Nobody'll thank you either way. They taste like the ship."`,
  choices: [
    { label: 'Eat them now, and plant the harvest', out: { text: 'A season of foil packs at every meal, and grumbling at every meal. Most of the first harvest goes back into the ground.', fx: { food: -80, yield: 0.025, morale: -2 } } },
    { label: 'Lock them away for the lean year', out: { text: s => `The pallets go behind a locked door, and ${Nc(s, 'quartermaster')} keeps the key. People sleep a little easier knowing they are there. The first harvest is eaten down to the husk, and there is no seed from it for a second sowing.`, fx: s => ({ yield: -0.015, do: s2 => LF.ease(s2, 'hunger', 'op.rations', 12, 700) }) } },
    { label: 'A foil pack for every double shift', dark: true, note: 'The hungry will work themselves into the ground for it.', info: [['yield', 'Work'], ['danger', 'The ones who need it most']],
      out: { text: s => `${Nc(s, 'quartermaster')} hands them out at the end of the second shift, one each, and writes the name down. The pod walls go up a month early. The names on the list are the thin ones, mostly, and by the end of the season two of them have worked themselves to death for food.`, fx: { food: -60, mat: 55, pop: -2, morale: -1, stain: ['worked', 1] } } },
  ] });
op('brought', s => cargo(s, 'radio') ? 1 : 0, { id: 'op.mast', view: 'world', tone: 'opportunity', title: 'The Mast',
  text: s => `The dish is up on the ridge. The handsets reach the ship well enough for a few words at a time. ${Nc(s, 'pilot')} wants the dish locked on the ship as well, for a wide link every night: the day's pictures from orbit, the library, and time for the camp and the watch crew to tell each other their news. ${Nc(s, 'xenobio')} wants it sweeping every band, day and night, to learn what this planet sounds like.\n\n"One dish. It points one way. That's it."`,
  choices: [
    { label: 'Lock it on the ship every night', out: { text: 'Every night at nine the ship sends down the day\'s pictures from orbit and whatever has been asked for from the library, and the camp sends its own news up. Some nights it is only the weather. People come anyway.', fx: { morale: 3 } } },
    { label: 'Sweep every band', out: { text: 'A season of static, lightning and the slow tick of the planet\'s field, all of it logged. The map is better for it.', fx: s => ({ survey: 14, poi: { key: 'op.band', kind: 'signal', name: 'A fixed source on the band', dist: 'far', state: 'rumoured', danger: 2, known: 'Under the static, one faint pulse that never moves. The dish puts it on a bearing, a long way past anything the crews have walked.' }, do: s2 => { const f = s2.factors.filter(x => x.stage === 0 && LF.KINDS[x.kind] && !x.dormant).sort((a, b) => a.onset - b.onset)[0]; if (f) f.insight = clamp(f.insight + 15, 0, 100); } }) } },
  ] });
op('brought', s => cargo(s, 'band') ? 1 : 0, { id: 'op.piano', view: 'people', tone: 'quiet', title: 'The Piano',
  text: s => `The piano has its legs back on and stands in the mess hall. Someone has played it every night since. ${Nc(s, 'teacher')} wants a dance every rest day, put on the roster like a drill. ${Nc(s, 'quartermaster')} wants the rest days rested in: "People are dead on their feet. Let them sleep."`,
  choices: [
    { label: 'A dance every rest day', out: { text: 'The tables go against the walls every seventh night. People who have not spoken since the ship find out they can still laugh at each other.', fx: s => ({ morale: 4, do: s2 => LF.ease(s2, 'grief', 'op.piano', 10, 500) }) } },
    { label: 'Holidays only', out: { text: 'The piano is played most nights anyway, quietly, by whoever cannot sleep. The dances are saved for the days that matter, and are better for it.', fx: { morale: 2 } } },
    { label: 'Strip the piano for its wire', out: { text: 'The piano gives up two hundred metres of good steel wire and a frame of seasoned wood. The guitars stay. Nobody plays them for a while.', fx: { parts: 5, mat: 10, morale: -3 } } },
  ] });
op('brought', s => cargo(s, 'lab') ? 1 : 0, { id: 'op.samples', view: 'world', tone: 'opportunity', title: 'First Samples',
  text: s => `The field laboratory has walls now, and the sequencer has one queue. ${Nc(s, 'xenobio')} wants it for this world: soil, water, anything that moves. ${Nc(s, 'physician')} wants every colonist screened first, for whatever they breathed in since the ramp came down.\n\n"We don't know a thing about out there, and not much more about what it's already done to us. Let me look at them before you ask them to look at it."`,
  choices: [
    { label: 'This world first', out: { text: 'A month of samples, boxed and labelled. Most of what is in them has no name yet, and the commonest are given numbers.', fx: s => ({ survey: 8, do: s2 => { const f = s2.factors.filter(x => LF.KINDS[x.kind] && !x.dormant).sort((a, b) => a.onset - b.onset)[0]; if (f) f.insight = clamp(f.insight + 20, 0, 100); } }) } },
    { label: 'The colonists first', out: { text: 'Everyone gives blood. Three people are carrying something nobody expected, and are treated before it matters, out of a drug store that will not be filled again. Outside the wire, whatever the colony has not yet met goes unlooked at for another season.', fx: s => ({ morale: 1, machine: { medbay: -4 }, do: s2 => LF.ease(s2, 'sickness', 'op.samples', 12, 600) }) } },
    { label: 'Screen everyone, and put out whoever is carrying anything', dark: true, note: 'Treatment uses the drug store. The wire costs nothing.', info: [['yield', 'A clean camp, and the drugs kept'], ['danger', 'Whoever the sequencer names']],
      out: { text: 'Everyone gives blood. Three people are carrying something nobody expected. They are given a tent, a week of food and a place two kilometres downwind, and are told it is until the lab knows more. The lab is busy with soil by then. One of the three walks back in the cold season and is turned away at the gate.',
        fx: s => ({ leave: 3, morale: -1, machine: { medbay: 8 }, stain: ['carriers', 1], do: s2 => LF.ease(s2, 'sickness', 'op.samples', 20, 600) }) } },
  ] });
op('brought', s => 0.6, { id: 'op.camp', view: 'people', tone: 'pressure', title: 'How the Camp Is Laid',
  setup: s => { const a = LF.cast(s, { val: 'order', officers: true }), b = LF.cast(s, { val: 'free', officers: true, not: a ? [a.id] : [] }); return { a: a && a.id, an: a ? a.name : N(s, 'security'), b: b && b.id, bn: b ? b.name : N(s, 'teacher') }; },
  text: (s, c) => `The camp grew where things were dropped. Now it has to be laid out for good, and two officers have two plans. ${c.an} wants a square: stores in the middle, pods round it, one gate. ${c.bn} wants a street, open at both ends, with room to grow along it.\n\nWhatever is built now will be the shape of the place for a lifetime.`,
  choices: [
    { label: (s, c) => `The square`, out: { text: 'Pods in a ring, the stores in the middle, one gate with a lamp over it. It is easy to count heads in and hard to feel free in.', fx: (s, c) => ({ morale: -1, do: s2 => { const p = byPid(s2, c.a); if (p) p.loyal = clamp(p.loyal + 8, 0, 100); const q = byPid(s2, c.b); if (q) q.loyal = clamp(q.loyal - 6, 0, 100); LF.ease(s2, 'fear', 'op.camp', 10, 300); } }) } },
    { label: (s, c) => `The street`, out: { text: 'One long street, pods on both sides, open at each end. It looks like a town already. It would be hard to defend.', fx: (s, c) => ({ morale: 2, do: s2 => { const p = byPid(s2, c.b); if (p) p.loyal = clamp(p.loyal + 8, 0, 100); const q = byPid(s2, c.a); if (q) q.loyal = clamp(q.loyal - 6, 0, 100); } }) } },
  ] });

LF.TAGS['op.melt'] = ['severe', 'bold', 'mercy order', 'severe order'];
LF.TAGS['op.film'] = ['severe order', 'severe', 'open', 'severe order'];
LF.TAGS['op.tide'] = ['cautious', 'bold', 'severe order', 'bold severe'];
LF.TAGS['op.dust'] = ['severe', 'mercy', 'severe cautious', 'severe order'];
LF.TAGS['op.spread'] = ['free open', 'order', 'severe order', 'severe order'];
LF.TAGS['op.pad'] = ['open bold', 'cautious', 'severe bold', 'bold severe'];
LF.TAGS['op.shard'] = ['cautious', 'order closed', 'bold severe'];
LF.TAGS['op.thaw'] = ['mercy bold', 'bold', 'order closed', 'severe order'];
LF.TAGS['op.grey'] = ['severe cautious', 'bold', 'bold', 'bold severe'];
LF.TAGS['op.burn'] = ['bold', 'cautious', 'severe bold'];
LF.TAGS['op.listen'] = ['closed cautious', 'open', 'bold', 'bold closed'];
LF.TAGS['op.sky'] = ['open', 'free'];
LF.TAGS['op.plan'] = ['free bold', 'order'];
LF.TAGS['op.ground'] = ['bold', 'cautious', 'severe bold'];
LF.TAGS['op.broken'] = ['bold', 'cautious', 'mercy', 'bold severe'];
LF.TAGS['op.flight'] = ['cautious', 'bold open'];
LF.TAGS['op.key'] = ['order severe', 'free', 'order'];
LF.TAGS['op.herd'] = ['bold', 'cautious'];
LF.TAGS['op.lessons'] = ['open', 'free'];
LF.TAGS['op.hold'] = ['mercy bold', 'severe order', 'severe order'];
LF.TAGS['op.spares'] = ['bold', 'cautious'];
LF.TAGS['op.camp'] = ['order closed', 'free open'];
LF.TAGS['op.ward'] = ['mercy', 'cautious'];
LF.TAGS['op.lathe'] = ['bold severe', 'mercy', 'severe order'];
LF.TAGS['op.trays'] = ['bold', 'cautious'];
LF.TAGS['op.rover'] = ['open bold', 'cautious', 'bold severe'];
LF.TAGS['op.fuel'] = ['bold', 'cautious'];
LF.TAGS['op.yard'] = ['closed order', 'mercy'];
LF.TAGS['op.rations'] = ['', '', 'severe order'];
LF.TAGS['op.samples'] = ['', '', 'severe closed'];
})();

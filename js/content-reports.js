/* Landfall — between-dilemma reports (one-line, non-blocking) and the closing chronicle. */
(function () {
'use strict';
const { addReport: rep, h } = LF; const { P, N, Nc, F, foodDays } = h;
const ok = (s, id) => !s.machines[id].lost && !s.machines[id].up;   // on the ground and working (a system still aboard the ship is no use down here)
const grav = s => s.world.grav >= 1.12 ? 'heavy' : s.world.grav < 0.85 ? 'light' : 'even';   // the survey's own bands (LF.PROPS.grav)
const low = (s, id, v) => ok(s, id) && s.machines[id].hp < v;

/* ---- warnings: the colony's actual condition, said by the people watching it ---- */
rep('w.food', { urgent: true, repeat: 40, k: 'bad', when: s => foodDays(s) < 45, text: s => `${h.Nwc(s, 'quartermaster')}: "Stores'll last ${foodDays(s) < LF.MONTH ? 'less than a month' : LF.monthsWord(foodDays(s) / LF.MONTH)} at this rate."` });
rep('w.parts', { urgent: true, repeat: 60, k: 'bad', when: s => s.res.parts < 6, text: s => `Spare parts are nearly gone. ${h.Nwc(s, 'engineer')} has started keeping fasteners in a locked drawer.` });
rep('w.reactor', { urgent: true, repeat: 70, k: 'bad', when: s => low(s, 'reactor', 40), text: s => `The reactor is running rough. The lights dip whenever the fabricator starts.` });
rep('w.reclaimer', { urgent: true, repeat: 70, k: 'bad', when: s => low(s, 'reclaimer', 40), text: s => `The water has a taste again. The reclaimer needs attention it is not getting.` });
rep('w.hydro', { urgent: true, repeat: 70, k: 'bad', when: s => low(s, 'hydroponics', 40), text: s => `A third of the hydroponic lamps are dark. ${h.Nwc(s, 'botanist')} is rotating trays by hand.` });
rep('w.medbay', { urgent: true, repeat: 70, k: 'bad', when: s => low(s, 'medbay', 40), text: s => `The autodoc refused a routine procedure today, citing its own calibration. ${h.Nwc(s, 'physician')} did it by hand.` });
rep('w.fab', { urgent: true, repeat: 70, k: 'bad', when: s => low(s, 'fabricator', 40), text: s => `The fabricator's reject bin is filling faster than its output tray.` });
rep('w.morale', { urgent: true, repeat: 45, k: 'bad', when: s => s.morale < 32, text: s => `${h.Nwc(s, 'chaplain')}: "Nobody's come in to complain all month. Nobody. You want something to worry about, worry about that."` });

/* ---- texture: small things that happen in a place where people live ---- */
rep('t.cat', { when: s => s.day > 20, text: s => `The ship's cat, smuggled down in a tool bag, has had kittens under the reactor hall. Nobody will admit to the smuggling.` });
rep('t.stars', { when: s => s.day > 10, text: s => `Someone has started naming the constellations. The Ladle. The Broken Strut. The Administrator's Eyebrow.` });
rep('t.yield', { repeat: 150, k: 'good', when: s => ok(s, 'hydroponics'), text: s => `A new lamp schedule in hydroponics has paid off.`, fx: { food: 60 } });
rep('t.salvage', { repeat: 160, k: 'good', text: s => `A descent-stage fuel tank is found intact a kilometre from the landing site and cut up for plate.`, fx: { mat: 12 } });
rep('t.still', { when: s => s.day > 80, text: s => `There is a still, and everyone knows where it is. ${h.Nwc(s, 'security')} has decided not to.` });
rep('t.game', { when: s => s.day > 50, k: 'good', fx: { morale: 1 }, text: s => ({
  heavy: `The evening football match is played at a walk here. A ball of wound cable insulation comes down in this gravity like a dropped wrench, and so do the players. It ended one all.`,
  light: `The evening football match, played with a ball of wound cable insulation that spends most of its time in the air in this gravity, ended nine all.`,
  even: `The evening football match, played with a ball of wound cable insulation on ground nobody has levelled, ended four all.` })[grav(s)] });
rep('t.bird', { when: s => s.survey > 20 && s.world.truth.bio >= 35, text: s => `${h.Nwc(s, 'xenobio')} has catalogued the four-winged glider that nests in the eaves of the pods. The crews had already named it the mast-rat.` });
rep('t.smell', { when: s => s.day > 30, text: s => `${({ barren: 'When the wind drops the air smells of struck flint', ruin: 'After rain the rubble smells of wet iron and old paper', ice: 'On still days the cold has a smell, like the inside of a tin',
  drowned: 'At low water the whole shore smells of salt, with something sweeter under it', jungle: 'After rain the ground smells of cloves and rot', garden: 'After rain the ground smells of cloves and cut grass' })[s.world.type]}. The newly woken remark on it. The first sixty stopped noticing long ago.` });
rep('t.teach', { when: s => s.flags.children, text: s => `${h.Nwc(s, 'teacher')} is teaching the children long division in the dirt with a stick. Two of the engineers have started sitting in.` });
rep('t.grave', { when: s => s.flags.cemetery && s.deaths > 2, text: s => `The cemetery path is swept every week, and it is on nobody's rota.` });
rep('t.blind', { when: s => s.flags.blind_colonists, text: s => `The blind have taken over the rope walk and the looms. Their cordage is the best in the colony.` });
rep('t.council', { repeat: 200, when: s => s.flags.council, text: s => `The Council sat for six hours on the question of latrine siting and adjourned without a vote.` });
rep('t.convict', { when: s => s.people.some(p => p.alive && p.marks.convict), text: s => `${s.people.find(p => p.alive && p.marks.convict).name} finished the last day of hard labour and went back to work without ceremony. People made room at the table.` });
rep('t.hero', { when: s => s.people.some(p => p.alive && p.marks.hero), text: s => `The reactor crew have painted ${s.people.find(p => p.alive && p.marks.hero).first}'s handprint on the loop housing, at the weld.` });
rep('t.touched', { when: s => s.people.some(p => p.alive && p.marks.touched) && !s.flags.bld_sealed, text: s => `${s.people.find(p => p.alive && p.marks.touched).name} was found standing in the rain at 0400, facing the spire. "Just listening."` });
rep('t.rings', { when: s => s.flags.und_pact, text: s => `A ring has come up around the plot behind the stores. The field crews step over it carefully and say good morning.` });
rep('t.drum', { when: s => s.flags.hive_talk && !s.flags.hive_destroyed, text: s => `The evening drumming has acquired a new phrase. ${h.Nwc(s, 'xenobio')} says it's their word for the colony, and has told everyone at supper. It is nine beats long, and ends on a question.` });
rep('t.quiet', { when: s => s.flags.hive_destroyed, text: s => `There is no drumming at dusk now. A few people still go to the fence to listen for it.` });
rep('t.reach', { when: s => s.flags.oth_trade || s.flags.oth_merged, text: s => `Reach words are creeping into the colony's speech. "Thawside." "Hull-rich." "Sleeper's luck," for anything unearned.` });
rep('t.earth', { when: s => s.flags.earth_truth, text: s => `The big archive screen in the mess hall, which used to show Earth landscapes, has been showing ${s.world.planet}'s for a month, and nobody remembers changing it.` });
rep('t.derate', { when: s => s.flags.reactor_derated, text: s => `The children born here will think lights are supposed to be that colour.` });
rep('t.sleepers', { repeat: 220, when: s => s.sleepers > 0 && s.day > 150, text: s => `The ${s.world.ship} reports all remaining cryo banks nominal. ${s.sleepers} people are still asleep.` });
rep('t.smelt', { when: s => s.built.smelter, k: 'good', text: s => `First pour at the smelter: a rough grey ingot the size of a loaf. It is passed from hand to hand around the whole mess hall.` });
rep('t.daughter', { when: s => s.flags.daughter_trade, repeat: 200, k: 'good', text: s => `A boat from the upriver settlement, with smoked fish and gossip.`, fx: { food: 80 } });
rep('t.stayed', { when: s => s.flags.stayed && s.day - s.flags.stayed > 80, text: s => `A note has come in from the one who stayed at ${s.flags.stayed_at}, carried by a survey crew: well, busy, not coming back. There is a pressed leaf in it.`, fx: { morale: 1, survey: 5 } });
rep('t.stranger', { when: s => s.flags.stranger && s.day - s.flags.stranger > 50, text: s => `The stranger the party brought home has started answering to a name the mess hall gave them.`, fx: { morale: 1 } });
rep('t.premise', { when: s => s.day > 140 && LF.PREMISES[s.premise], text: s => LF.PREMISES[s.premise].report });
rep('t.returned', { repeat: 150, when: s => s.flags.returned >= 3 && !s.flags.returned_gone, text: s => `The ones who came back from ${s.flags.returned_to} still eat at their own table. They are never late for shift.` });

/* ================= MEANWHILE =================
   More of the colony's own news. Three rules. A line is true of this world (gravity, ground and life are read
   from s.world, never assumed). Where it can, it is drawn from something that already happened in this game: a
   decision in the ledger, a build, a death, a deed, the cargo, the reason the colony feels what it feels
   (LF.because). And it moves one number a very little, so the news is never only decoration.
   A report with `make` builds its line and its effect together, from one drawn event; s.mw remembers what was used. */
const used = (s, k) => { s.mw = s.mw || {}; return s.mw[k]; };
const mark = (s, k) => { s.mw = s.mw || {}; s.mw[k] = s.day; };
const lc = t => t.charAt(0).toLowerCase() + t.slice(1), up = t => t.charAt(0).toUpperCase() + t.slice(1);
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const built = (s, id, n) => s.built[id] !== undefined && s.day - s.built[id] > (n || 50);
const type = (s, k) => s.world.type === k;

/* ---- this world ---- */
rep('m.heavy', { k: 'bad', when: s => s.day > 60 && grav(s) === 'heavy', fx: { morale: -1 }, text: s => `${h.Nwc(s, 'physician')} has strapped the fourth turned ankle of the month. A missed step here comes down harder than the legs expect.` });
rep('m.heavy2', { k: 'bad', when: s => s.day > 240 && grav(s) === 'heavy', fx: { food: -20 }, text: s => `The people who came down stooped have stopped noticing the weight, but they eat more than they did. The cooks say a pot that fed sixty on the ship feeds fifty here.` });
rep('m.light', { k: 'good', when: s => s.day > 40 && grav(s) === 'light', fx: { mat: 4 }, text: s => `One person carries a sheet of plate here that took two on the ship's training deck. The plate yard is ahead of its tally.` });
rep('m.light2', { k: 'bad', when: s => s.day > 200 && grav(s) === 'light', fx: { morale: -1 }, text: s => `${h.Nwc(s, 'physician')} has started weighted drill at dawn. Bones thin in gravity this light unless they are made to work, and the drill is not popular.` });
rep('m.thaw', { repeat: 300, k: 'good', when: s => LF.date(s.day).year >= 2 && LF.date(s.day).season === 0 && LF.date(s.day).dos <= 30, fx: { morale: 1 },
  text: s => `Thaw has come round again, the colony's ${ORD[LF.date(s.day).year] || 'latest'} on ${s.world.planet}. The cooks made a stew of the last of the Dim's stores and called it a feast.` });
rep('m.lichen', { k: 'good', when: s => (type(s, 'barren') || type(s, 'ruin')) && s.survey > 20, fx: { survey: 2 }, text: s => `${h.Nwc(s, 'xenobio')} has spent a month on the grey crust that grows on the lee side of the stones. It gains a finger's width in a year. The patch behind the stores is older than the mission.` });
rep('m.barren', { k: 'bad', when: s => (type(s, 'barren') || type(s, 'ruin')) && s.day > 70, fx: { food: -20 }, text: s => `The wind found a seam in the stores tent overnight and put dust in every open sack. A day went to sieving flour.` });
rep('m.barren2', { k: 'good', when: s => (type(s, 'barren') || type(s, 'ruin')) && s.day > 160, fx: { mat: 4 }, text: s => `Wind stripped the bank behind the plate yard to bedrock overnight and left a drift of clean gravel at the foot of it. The builders have been shovelling it into sacks.` });
rep('m.ice', { k: 'bad', when: s => type(s, 'ice') && s.day > 70, fx: { mat: -3 }, text: s => `Frost got into a crate of sealant and split every tube in it.` });
rep('m.ice2', { k: 'good', when: s => type(s, 'ice') && s.day > 160, fx: { morale: 1 }, text: s => `One of the roofing crew cut blocks of ice and stacked a windbreak along the weather side of the pods. It is the first night in a month that the door seals have not whistled.` });
rep('m.drowned', { k: 'good', when: s => type(s, 'drowned') && s.day > 70 && s.flags.sprouted, fx: { food: 20 }, text: s => `The tide left a bank of weed along the shore. ${h.Nwc(s, 'botanist')} had it on the plots as mulch before it dried.` });
rep('m.drowned2', { k: 'bad', when: s => type(s, 'drowned') && s.day > 160, fx: { parts: -1 }, text: s => `Salt is in everything. ${h.Nwc(s, 'engineer')} pulled a connector block from the radio this month that came out green and in two pieces.` });
rep('m.jungle', { k: 'bad', when: s => type(s, 'jungle') && s.day > 70, fx: { food: -20 }, text: s => `Something ate through a sack in the stores overnight. It was nothing on the ship's manifest.` });
rep('m.jungle2', { k: 'good', when: s => type(s, 'jungle') && s.day > 160, fx: { mat: 4 }, text: s => `The poles the path crew left lying took root and are in leaf. The builders have started planting their fence posts instead of setting them.` });
rep('m.garden', { k: 'good', when: s => type(s, 'garden') && s.day > 70 && LF.cv(s, 'cold') < 20, fx: { morale: 1 }, text: s => `On warm nights half the colony sleeps outside the pods, on the grass. The watch has stopped waking them.` });
rep('m.garden2', { k: 'bad', when: s => type(s, 'garden') && s.day > 160, fx: { food: -20 }, text: s => `Something small and local has found the grain store, and likes it.` });
rep('m.ruin', { k: 'good', when: s => type(s, 'ruin') && s.day > 70, fx: { parts: 1 }, text: s => `A crew clearing rubble for the next plot pulled out forty metres of something like cable, still bright. ${h.Nwc(s, 'engineer')} has it in the workshop and has found two uses for it.` });
rep('m.ruin2', { k: 'bad', when: s => type(s, 'ruin') && s.day > 160, fx: { morale: -1 }, text: s => `A wall that had stood since before anyone came here fell across the east path in the night. Nobody was under it. People walk the path faster now.` });

/* ---- what the colony did, remembered ---- */
rep('m.site', { k: 'good', when: s => s.day > 150 && s.world.zone, fx: { morale: 1 }, text: s => `The stones of the first cook-fire are still in their ring at ${s.world.zone}, where the lander came down. The paths bend round them.` });
rep('m.sow', { k: 'good', when: s => s.flags.sprouted && s.memo['plan.seeds'] && s.day - s.memo['plan.seeds'].d > 120, fx: s => s.flags.first_sow === 'trial' ? { survey: 2 } : { morale: 1 },
  text: s => s.flags.first_sow === 'all' ? `The seed lockers that were swept out for the first sowing hold hand tools now. ${h.Nwc(s, 'botanist')} still runs a finger along the seams for stray grains, and this month found eleven.`
    : s.flags.first_sow === 'half' ? `The lead tag that sealed half the seed in the first season hangs on a nail in the stores office. Anyone new to the stores is shown it on the first day.`
    : `The numbered stakes from the trial plots are still in the ground, and the notebook from that season is the most borrowed thing in the colony.` });
rep('m.burn', { k: 'good', when: s => s.day > 200 && s.world.transit && s.world.transit.lostS > 0, fx: { morale: 1 },
  text: s => `Someone has cut the names of the ${s.world.transit.lostS === 1 ? 'sleeper' : s.world.transit.lostS + ' sleepers'} lost on the burn to ${s.world.planet} into a sheet of plate and fixed it ${ok(s, 'lander') ? 'beside the lander ramp' : 'to the mess hall wall'}.` });
rep('m.wound', { k: 'bad', when: s => s.day > 180 && s.world.landingDamage && s.world.landingDamage !== 'lander' && ok(s, s.world.landingDamage), fx: { parts: -1 },
  text: s => `The ${LF.MACHINES[s.world.landingDamage].name} has never run true since the descent. It needed spares again this month, and ${h.Nw(s, 'engineer')} had them cut before anyone asked.` });
rep('m.woken', { k: 'good', when: s => s.flags.woken >= 1 && s.day > 120, fx: { morale: 1 }, text: s => `The sleepers brought down since landing still stack their boots the ship's way, toes to the wall. The first sixty stopped long ago, and a few have started again.` });
rep('m.walked', { k: 'bad', when: s => s.deserted >= 2, fx: { food: -20 }, text: s => `Smoke from the camp of the ones who walked out shows on still mornings. Somebody leaves a sack at the wire now and then, and by first light it is gone.` });
rep('m.home', { k: 'good', when: s => s.flags.wrote_home && s.day > 200, fx: { morale: 1 }, text: s => `The radio operator has worked out how far the colony's message to Earth has travelled, and has chalked the figure on the radio room door. It is to be corrected monthly.` });
rep('m.wort', { k: 'good', when: s => s.flags.native_food && !s.flags.native_food_cost && s.day > 220, fx: { food: 20 }, text: s => `Knucklewort turned up in three dishes this month and was recognised in all of them. The cooks have been asked to keep trying.` });
rep('m.wells', { k: 'good', when: s => built(s, 'wells'), fx: { morale: 1 }, text: s => `Since the wells went in, nobody tastes the water before drinking it.` });
rep('m.domes', { k: 'good', when: s => built(s, 'greenhouse'), fx: { food: 20 }, text: s => `The domes are the warmest place in the colony, and ${h.Nw(s, 'botanist')} keeps finding people asleep between the trays. Two of them have been put to work there.` });
rep('m.soil', { k: 'good', when: s => built(s, 'soillab'), fx: { food: 20 }, text: s => `The soil laboratory keeps a jar from every plot on one shelf, labelled by hand. On the strength of the shelf, two plots were resown with something else.` });
rep('m.lathe', { k: 'good', when: s => built(s, 'machineshop'), fx: { parts: 1 }, text: s => `The first thing off the machine shop lathe that was not a repair was a pair of door hinges. Every pod wants a pair.` });
rep('m.reader', { k: 'good', when: s => built(s, 'school') && s.flags.children, fx: { morale: 1 }, text: s => `The school's first reader was written by a committee of six and reads like it. The children have it by heart anyway.` });
rep('m.bunks', { k: 'good', when: s => built(s, 'housing'), fx: { mat: 4 }, text: s => `With the permanent housing up, the pods everyone slept in at first are stores. The bunk frames went to the plate yard. Most people still know which one was theirs.` });
rep('m.blade', { k: 'bad', when: s => built(s, 'turbines', 90), fx: { parts: -1 }, text: s => `One of the turbines threw a blade in the night and took a second with it. ${h.Nwc(s, 'engineer')} has the pieces laid out on the workshop floor.` });
rep('m.noon', { k: 'good', when: s => built(s, 'fields'), fx: { food: 20 }, text: s => `The open fields are wide enough now that the far crew eats where it works. The cooks carry the pot out at noon.` });

/* The dead: one of the named, a season or more gone. */
const DEAD = [
  [p => `One of the plate crew has cut ${p.name}'s name deeper into the wall. The first cutting was done in a hurry.`, { morale: 1 }, 'good'],
  [p => `${p.name}'s hook by the mess hall door is still empty. The newly woken were told once whose it was, and did not ask again.`, { morale: -1 }, ''],
  [p => `${p.first}'s handwriting is still on half the labels in the stores. ${p.name} died a while ago now, and the labels have not been written out again.`, { morale: 1 }, 'good'],
];
const deadOne = s => s.people.find(p => !p.alive && !p.left && p.died !== undefined && s.day - p.died > 90 && !used(s, 'dead:' + p.id));
rep('m.dead', { repeat: 150, when: s => !!deadOne(s), make: s => { const p = deadOne(s), n = Object.keys(s.mw || {}).filter(k => k.startsWith('dead:')).length, d = DEAD[n % DEAD.length]; mark(s, 'dead:' + p.id); return { t: d[0](p), fx: d[1], k: d[2] }; } });

/* A notable colonist and the thing that made the name. */
const DEEDS = [
  [(p, d) => `${p.name}, who ${d.txt}, was asked to tell it again for the ones woken since. The story has gained a few details.`, { morale: 1 }],
  [(p, d) => `The crews have started sending their awkward jobs to ${p.name}, who ${d.txt}, and the jobs are getting done.`, { mat: 3 }],
  [(p, d) => `Somebody has chalked a likeness of ${p.name}, who ${d.txt}, on the stores door. It is not flattering, and ${p.first} has let it stay.`, { morale: 1 }],
];
const deedOne = s => { for (const p of s.people) if (p.alive && !p.away && !p.role) { const d = p.deeds.find(d => s.day - d.d > 60 && !used(s, 'deed:' + p.id + ':' + d.d)); if (d) return [p, d]; } return null; };
rep('m.deed', { repeat: 170, k: 'good', when: s => !!deedOne(s), make: s => { const [p, d] = deedOne(s), n = Object.keys(s.mw || {}).filter(k => k.startsWith('deed:')).length, v = DEEDS[n % DEEDS.length]; mark(s, 'deed:' + p.id + ':' + d.d); return { t: v[0](p, d), fx: v[1] }; } });

/* An officer's past, from the People view, said aloud by someone who did not know better. */
const PAST_TAIL = [p => `It came out at supper this month, from someone woken since landing who did not know better. ${p.first} took it well.`,
  p => `Someone woken since landing asked ${p.first} about it this month, across the whole table, and got an answer.`,
  p => `The newly woken have only just heard, and it has been round the mess hall again. ${p.first} has stopped correcting the details.`];
const pastOne = s => s.people.find(p => p.alive && !p.away && p.role && p.known && LF.pastOf(p) && !used(s, 'past:' + p.id));
rep('m.past', { repeat: 200, when: s => s.day > 90 && !!pastOne(s), make: s => { const p = pastOne(s), n = Object.keys(s.mw || {}).filter(k => k.startsWith('past:')).length; mark(s, 'past:' + p.id);
  return { t: `${p.name} ${lc(LF.pastOf(p))} ${PAST_TAIL[n % 3](p)}`, fx: { do: s2 => { if (p.loyal !== undefined) p.loyal = Math.min(100, p.loyal + 2); } } }; } });

/* A decision that was put to the test, a season on. The ledger has the title and how it went. */
const WON = [t => `Somebody has painted "${t}" and the date on an offcut of plate and screwed it up in the mess hall.`, t => `People date things from "${t}" now, the way they used to date them from landing.`];
const LOST = [t => `There was an argument at supper over whose fault "${t}" was. It was a season ago, and it still ended with a thrown cup.`, t => `"${t}" has become a thing people say when a job goes wrong. This month it got a laugh, which it would not have a season ago.`];
const testOne = s => s.ledger.find(e => e.ok !== null && e.ok !== undefined && !e.kind && !e.fid && e.t && s.day - e.d > 80 && s.day - e.d < 400 && !used(s, 'led:' + e.d + e.t));
rep('m.test', { repeat: 110, when: s => !!testOne(s), make: s => { const e = testOne(s), n = Object.keys(s.mw || {}).filter(k => k.startsWith('led:')).length; mark(s, 'led:' + e.d + e.t);
  return e.ok ? { t: WON[n % 2](e.t), fx: { morale: 1 }, k: 'good' } : n % 2 ? { t: LOST[1](e.t), fx: { morale: 1 }, k: 'good' } : { t: LOST[0](e.t), fx: { morale: -1 }, k: 'bad' }; } });

/* What the colony did about something the world holds: the approach is in the ledger, and it has left a habit behind. */
const HABIT = {
  'fauna.force':   [(s, n) => `The crew who went out against ${n} keep the spent casings in a jar in the mess hall. ${h.Nwc(s, 'security')} has put in for springs and firing pins to replace what that month wore out.`, { parts: -1 }, 'bad'],
  'natives.force': [(s, n) => `There has been no sign of ${n} near the wire since the rifles came out. The watch that used to be one pair is two pairs now, and the plots are short the hands.`, { food: -20 }, 'bad'],
  'humans.force':  [(s, n) => `Since the guns were turned on ${n}, the watch that used to be one pair is two pairs. The plots are short the hands.`, { food: -20 }, 'bad'],
  'flora.force':   [(s, n) => `The ground where ${n} was burned back is still black. The field crews walk round it and lose a quarter of an hour each way.`, { food: -20 }, 'bad'],
  'fauna.exploit': [(s, n) => `Meat from ${n} has been in the pot twice this month. Nobody has asked for the recipe, and the pot came back empty both times.`, { food: 20 }, 'good'],
  'fauna.accord':  [(s, n) => `Scraps still go out past the wire for ${n}, by habit now. The cooks set them aside.`, { food: -20 }, ''],
  'natives.accord': [(s, n) => `There is a board of words in the mess hall: the colony's on the left, and on the right the nearest anyone can write to what ${n} use. It has forty lines.`, { survey: 2 }, 'good'],
  'humans.accord': [(s, n) => `Since bread was broken with ${n}, somebody walks over with the news once a week and walks back with theirs. The map has gained a few names that way.`, { survey: 2 }, 'good'],
  study:           [(s, n) => `The notebook on ${n} has been round the mess hall twice. People who have never been past the wire can tell you what is in it.`, { survey: 2 }, 'good'],
  avoid:           [(s, n) => `The path that ran toward ${n} is closed with a rope and a tag. The long way round costs the hauling crews an hour a day.`, { mat: -3 }, 'bad'],
};
const habitOne = s => { for (const e of s.ledger) { if (!e.fid || !e.ap || s.day - e.d < 70 || used(s, 'fac:' + e.fid + e.ap)) continue;
  const f = s.factors.find(x => x.id === e.fid); if (!f || !['fauna', 'flora', 'natives', 'humans', 'ruin'].includes(f.kind) || f.res === 'destroyed' || f.res === 'lost') continue;
  if (s.ledger.some(o => o.fid === e.fid && o.d > e.d && o.ap !== e.ap)) continue;   // only while that is still how the colony treats it
  const h = HABIT[f.kind + '.' + e.ap] || (f.kind !== 'ruin' || e.ap === 'study' ? HABIT[e.ap] : null); if (h) return [e, f, h]; } return null; };
rep('m.habit', { repeat: 130, when: s => !!habitOne(s), make: s => { const [e, f, h] = habitOne(s); mark(s, 'fac:' + e.fid + e.ap); return { t: h[0](s, f.name), fx: h[1], k: h[2] }; } });

/* The mood, and its cause. The colony model (story.js) knows what the colony feels and why; the why is always
   something that happened, in words the cards already use. */
const MOOD = {
  dark:          [`Lamps are lit an hour earlier each week, and people have taken to eating in one room to share them.`, { morale: -1 }],
  cold:          [`Three households have moved their beds into the mess hall, and offcuts of plate are going up as windbreaks.`, { mat: -3 }],
  storm:         [`Everything loose has been tied down twice. The cord ran out, and straps were cut from plate.`, { mat: -3 }],
  contamination: [`All water is boiled before anyone drinks it, which takes one pair of hands all day.`, { food: -20 }],
  blackout:      [`The lights go out by rota, a row of pods at a time, and the workshop has done a month of fine work by lamp. Some of it has had to be done again.`, { parts: -1 }],
  scarcity:      [`One of the carpenters spent a day straightening a bucket of bent nails rather than ask the stores for new ones.`, { mat: 3 }],
  hunger:        [`People count the sacks through the stores window as they pass, and everyone can do the sum.`, { morale: -1 }],
  sickness:      [`The clinic queue runs out of the door in the mornings, and the people in it are not at work.`, { food: -20 }],
  confinement:   [`A card school started in the corridor at the start of the month and has not stopped.`, { morale: 1 }],
  exhaustion:    [`Two people fell asleep at the plate saw this month. Both kept their fingers, and one sheet was spoiled.`, { mat: -3 }],
  fear:          [`The watch rota is full a month ahead. The field rota has gaps in it.`, { food: -20 }],
  suspicion:     [`Conversations stop when a third person walks in.`, { morale: -1 }],
  grief:         [`The wall of names was scrubbed this month by two people who had not been asked to, and others came out to watch.`, { morale: 1 }],
  resentment:    [`The complaints box in the mess hall was full by the second day of the month.`, { morale: -1 }],
  zeal:          [`Work started before the bell every day this month.`, { mat: 3 }],
  schism:        [`The mess hall has two ends now, and people choose one as they walk in.`, { morale: -1 }],
  hope:          [`People are planning further ahead than a season: a second well, a name for a child.`, { morale: 1 }],
  siege:         [`Nobody goes past the wire alone, so every job out there takes two.`, { food: -20 }],
  watched:       [`The night watch logs every light and sound past the wire, and the log is being read.`, { survey: 2 }],
  strangers:     [`The places at the long table have been shuffled twice this month.`, { morale: -1 }],
  heard:         [`There is someone listening in the radio room at every hour, and the set was not built to run that long.`, { parts: -1 }],
  dependency:    [`The stores tally has a new column, and it is filling.`, { food: 20 }],
  unexplained:   [`There are five theories and a betting book. One of the theories sent a crew out to look.`, { survey: 2 }],
  revelation:    [`People sit up late talking and come to work tired.`, { morale: -1 }],
  changed:       [`People look twice at each other in the mess hall queue.`, { morale: -1 }],
};
const moodOne = s => { for (const [k] of LF.hot(s)) { const why = LF.because(s, k); if (MOOD[k] && why && !(s.day - (used(s, 'mood:' + k) || -999) < 320)) return [k, why]; } return null; };
rep('m.mood', { repeat: 50, when: s => s.day > 40 && !!moodOne(s), make: s => { const [k, why] = moodOne(s), m = MOOD[k]; mark(s, 'mood:' + k);
  const v = Object.values(m[1])[0]; return { t: `${m[0]} ${up(why)}.`, fx: m[1], k: v > 0 ? 'good' : 'bad' }; } });

/* ---- the closing chronicle ---- */
LF.epilogue = function (s) {
  const f = s.flags, out = [];
  const yrs = Math.max(1, Math.round(s.day / LF.YEAR));
  if (s.over.after) { const w = Math.max(1, Math.round(s.over.after / LF.YEAR));
    out.push(`The colony on ${s.world.planet} cut its cord in year ${w} and lived ${yrs} years in all. It no longer needed anything from the ship, and it fell anyway.`); }
  else if (s.over.kind === 'win') out.push(`${yrs} years after landfall, the colony on ${s.world.planet} could feed, water, power, repair and renew itself with nothing from the ship. It had ${s.pop} people, and ${s.deaths} names on the wall.`);
  else if (s.over.kind === 'dead') out.push(`The colony on ${s.world.planet} lasted ${yrs} years. At the end there were too few left to keep the lights on.`);
  else out.push(`The record of the colony on ${s.world.planet} stops in year ${yrs}.`);

  if (f.committee) out.push(f.blood_spilled ? 'It was run by the committee that had taken it over with blood on the floor, and the committee never once spoke of that night.' : 'It was run by a committee of shift foremen who had thrown the officers out, and who found out, slowly, why the officers had been tired.');
  else if (f.council) out.push('It governed itself by elected Council, argued constantly, and was proud of that.');
  else if (f.command_rule) out.push(f.crackdown ? 'It was ruled by charter and by the watch, and people learned to keep their voices down.' : 'It was ruled by charter until the end, and the charter was never put to a vote.');
  if (f.scapegoat) out.push('A Chief Agronomist had once been sent out past the wire to buy the officers a quiet night. Nobody kept the stores keys for long after that.');
  if (s.deserted >= 6) out.push(`${s.deserted} people had walked out over the years to make their own camps. Some of the camps lasted.`);
  if (f.blood_spilled) out.push('Colonists had killed colonists. The mess hall floor was replaced, eventually, and people still stepped around the place.');

  if (f.crops_symbiotic) out.push('Its wheat grew with white threads through its roots and was the best wheat any human had ever grown. Nobody could say how much of the credit was theirs.');
  else if (f.crops_adapted) out.push('Its bread was made from a wheat that had learned the local soil.');
  if (f.native_food_cost) out.push('Knucklewort stew was served on the anniversary of the trial, every year, and complaining about the taste was not allowed.');

  if (f.und_communion) out.push('Some of the dead were given to the meadow. The field crews said they could feel them there, and nobody could prove otherwise.');
  else if (f.und_pact) out.push('The Understory took what the colony threw away and gave back living soil, and the two never did learn what the other thought of the bargain.');
  if (f.und_war || f.und_avoid) out.push('The colony grew its food behind ash or on bare stone, and the Understory had the rest of the soil.');

  if (f.bld_finished) out.push('Out past the fields a door stood open that the colony had not built and could not close. Every child was taught which way to run.');
  else if (f.bld_dormant) out.push('Under the ground the Builders\' machine waited, patient, for the colony to decide it was ready. When it asked how long, it had been told the truth, that nobody knew.');
  else if (f.bld_dead) out.push('The fallen spire was left where it lay. In time, children played on it.');
  else if (f.bld_sealed) out.push('Under the ground, something hummed at exactly the pitch of the power grid. Most people stopped hearing it.');

  if (f.oth_kin) out.push('Within a generation there was no useful way to say who was colony and who was Reach.');
  else if (f.oth_merged) out.push('The Reach folk who came as refugees taught the colony how to live here, and were never properly thanked for it.');
  else if (f.oth_enemy) out.push('To the south lived three hundred people who hated the colony and had good reason to.');
  if (f.sleepers_traded) out.push('Thirty people woke among strangers because of a decision made about them while they slept.');

  if (f.hive_allies) out.push('At dusk the drummers came to the field edge, and the children drummed back, and both sides were getting better at it.');
  else if (f.hive_poisoned) out.push('The valley had no drummers and no dusk chorus and, every summer, more insects than the last.');
  else if (f.hive_destroyed) out.push(f.hive_record ? 'In the archive, beside the ship\'s log, hung a knotted cord that nobody could read and nobody would throw away.' : 'There had been other people in that valley once. The colony did not teach that part.');
  else if (f.hive_dying) out.push('Beyond the border the drumming grew thinner every year, and the colony knew it was the cause.');
  else if (f.hive_treaty) out.push('A line of knots divided the valley, and both peoples kept to their side.');

  if (s.sleepers > 0 && f.promise_orbit) out.push(`${s.sleepers} still slept in orbit. A promise had been made about them, and the machine shop kept a drawing of a rocket pinned above the door.`);
  else if (s.sleepers > 0 && s.machines.lander.lost) out.push(`Each evening the ${s.world.ship} crossed the sky with ${s.sleepers} aboard, and each evening someone read a few of the names.`);
  if (f.let_sleepers_die) out.push('Forty had been left to die in their sleep because the stores could not have fed them, and nobody ever found a mistake in the sums.');
  if (f.daughter_trade) out.push(`Upriver, the settlement ${f.daughter} founded was still growing. There was talk of a third.`);
  if (f.wrote_home) out.push('Somewhere between the stars, two hundred words from each of them were still on their way to Earth.');
  if (f.returned_gone) out.push(`Some of those who came back changed went out again and did not return. On clear nights there was a light where they had gone.`);
  else if (f.returned >= 3) out.push('Among them lived a few who had gone out and come back different. Their children could not see what the fuss had been about.');
  const famous = s.people.filter(p => !p.role && p.deeds.length >= 2).sort((a, b) => b.deeds.length - a.deeds.length)[0];
  if (famous) out.push(`${famous.name}, who ${famous.deeds[0].txt}, ${famous.alive ? 'was pointed out to children in the mess hall for the rest of a long life' : 'was a name people stopped at when they read the wall'}.`);
  if (s.firstDead) out.push(`The first name on the wall was ${s.firstDead}.`);
  return out;
};
})();

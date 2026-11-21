/* Landfall — storylets: landfall, crops, machinery, sleepers, the fever, and state-driven crises. */
(function () {
'use strict';
const { add, h } = LF; const { P, N, Nc, Nw, Nwc, F, R, M, Fl, If, Tr, foodDays } = h;
const ok = (s, id) => !s.machines[id].lost && !s.machines[id].up;   // on the ground and working (a system still aboard the ship is no use down here)

/* ================= LANDFALL ================= */
/* The landing (Lachlan, 2026-11-21): there is no card for it any more. The site is chosen in orbit, one of the planet's two,
   and the lander sets down on that site's own ground: one of the world's landing zones (world.js), which one fixed by the
   seed and the site (LF.groundOf; no dice). LF.touchdown gives what the landing does, for the card that loads the lander
   (setup.load, content-setup.js) to apply: the zone's effects and flag, the chronicle, the other zones as places on the map
   (js/places.js: the orbital survey looked them over, and a party can go), and what finds the colony first. */
const SITE_KIND = { wet: 'spring', high: 'ridge', deep: 'cave' };
const SITES = (s, i) => (s.world.zones || []).map((z, j) => j === i || !SITE_KIND[z.t] ? null : { key: 'site.' + z.t, kind: SITE_KIND[z.t], name: z.name.replace(/^the /, 'The '), dist: 'far', state: 'located', danger: 1,
  known: `Ground the survey looked over from orbit. ${LF.zone(s, j).note}`, from: { k: 'site' } }).filter(Boolean);
LF.groundOf = s => { const n = (s.world.zones || []).length; let x = 2166136261; for (const ch of `${s.seed}/ground/${s.world.type}`) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return n ? (x >>> 0) % n : 0; };
LF.touchdown = function (s) { const i = LF.groundOf(s), z = LF.zone(s, i);
  return { name: z.name, text: typeof z.land === 'function' ? z.land(s) : z.land,
    fx: Object.assign({}, z.fx, { flags: { [z.flag]: true }, chron: `First camp was made at ${z.name}.`, poi: SITES(s, i) }),
    act: s2 => { s2.world.zone = z.name;
      for (const f of s2.factors) { // where the lander comes down decides what finds the colony first
        if (z.t === 'near' && f.id === s2.world.rumour) { f.onset = 12; f.insight += 15; }
        if (z.t === 'wet' && ['fauna', 'flora', 'plague'].includes(f.kind)) f.onset = Math.round(f.onset * 0.6);
        if (z.t === 'high' && ['fauna', 'flora'].includes(f.kind)) f.onset = Math.round(f.onset * 1.3);
        if (z.t === 'deep' && f.kind === 'ruin') f.onset = Math.round(f.onset * 0.5);
        if (z.t === 'deep' && f.kind === 'fauna' && f.sub === 'delver') f.onset = Math.round(f.onset * 0.5); } } }; };

/* ================= CROPS ================= */
add({ id: 'crops.first', arc: 'crops', tone: 'pressure', title: 'The Yellow Wheat', w: 3,
  when: s => LF.need(s) === 'soil' && s.day >= 22 && (s.flags.sprouted || s.day >= 90),
  text: s => `${s.flags.first_sow === 'all' ? 'You sowed everything, and most of it' : s.flags.first_sow === 'trial' ? 'Even in the trial squares, most of what was sown' : 'Most of the first open-air planting'} came up the colour of old paper, roots bare.${s.flags.resown ? ' The second sowing held, in the few plots that would take it.' : ''}\n\n[[botanist]] "The ground's alive, I'll give it that, I've had my hands in it." "It's full of something, and whatever it is, our wheat can't live alongside it."\n\n${ok(s, 'hydroponics') ? 'Hydroponics is carrying the colony, and was never meant to for long.' : 'The colony is eating out of the hold, and the hold was never meant to feed it for long.'}`,
  choices: [
    { label: s => ok(s, 'hydroponics') ? 'Pull back to the vats. They feed twenty-four, so name the twenty-four' : 'Pull back to the hold. A full ladle for twenty-four, so name the twenty-four', dark: true, note: 'No seed is risked and the field crews are kept strong, and everyone not on the list eats what is left of the hold.', info: [['yield', 'The crews fed, the seed kept'], ['danger', 'Everyone not on the list']],
      out: { text: s => `The plots are left to the wind. ${Nwc(s, 'quartermaster')} posts twenty-four names on the ${ok(s, 'hydroponics') ? 'hydroponics' : 'stores'} door, all of them diggers and fitters. The rest eat from the hold on the thin ladle, and two of the oldest do not see the month out.`, fx: { food: 120, morale: -5, pop: -2, flags: { crops_retreat: true }, stain: ['ladle', 2] } } },
    { label: 'Brute force: flood the plots with compost and Earth microbes',
      test: { base: 40, mods: [R('botanist', 10), Fl('site_delta', 10, 'Rich delta soil')] },
      ok: { text: 'It reeks for a month, and then one plot in three greens up.', fx: { yield: 0.12, morale: 3, flags: { soil_clues: true } } },
      bad: { text: 'The native microbes bloom on the feast. The rot runs up an irrigation line and into a seed locker before anyone notices.', fx: { food: -350, morale: -4 } } },
    { label: 'Stop planting. Sample everything and find out why', note: "You lose this season's planting and somebody goes hungry for it, but you'll learn what is wrong with the soil.",
      out: { text: s => `${Nwc(s, 'botanist')} turns a cargo pod into a bench lab. The season is lost, and one of the clinic's long patients dies on the short ladle before the notebooks have an answer. They fill, in the end, with what this soil will and will not tolerate.`, fx: { food: -120, survey: 8, pop: -1, flags: { soil_clues: true } } } },
  ] });

add({ id: 'crops.native', arc: 'crops', tone: 'opportunity', title: 'Knucklewort',
  when: s => !s.flags.no_native && s.day >= 90 && (s.built.soillab || s.day >= 170),
  text: s => `${Nwc(s, 'xenobio')} sets a knobbled grey tuber on your desk: knucklewort. It grows everywhere and is, on paper, nearly digestible.\n\n[[xenobio]] "Somebody's got to eat it, every day for a month, and I'd start tonight, I'd keep the log myself, weight and sleep and what comes out the other end, all of it, if you'd only let me, which you won't, I can see your face."\n\n${Nwc(s, 'quartermaster')} has already volunteered.`,
  choices: [
    { label: s => `Let ${F(s, 'quartermaster')} eat it`, about: true, note: 'It is the quickest way to find out, and only one person is at risk.',
      test: { base: 50, mods: [R('physician', 10), M('medbay', 10)] },
      ok: { text: s => `A month of knucklewort stew. ${Nc(s, 'quartermaster')} loses two kilos and gains a lifelong hatred of the taste. Knucklewort goes into the ration.`,
        fx: { yield: 0.2, morale: 4, flags: { native_food: true }, chron: 'The colony learned to eat knucklewort, the first native food.' } },
      bad: { text: s => `On day nineteen the kidneys go. The autopsy shows which compound did it and how to leach it out, and the method goes into the archive under ${N(s, 'quartermaster')}'s name.`,
        fx: { kill: { who: 'quartermaster', cause: 'kidney failure in the knucklewort trial' }, yield: 0.2, flags: { native_food: true, native_food_cost: true } } } },
    { label: 'Run the long assay through the autodoc first', note: 'Nobody has to eat anything, but it takes months, and the autodoc can do nothing else while it runs.',
      req: s => ok(s, 'medbay'), reqText: 'Needs the Autodoc',
      out: { text: 'The autodoc grinds through tissue cultures for months and does nothing else. It will have an answer by next season. A rigger with a burst appendix is opened by hand in that time, and does not come through it.', fx: { machine: { medbay: -10 }, pop: -1, sched: [['crops.assay', 35, 55]] } } },
    { label: 'Put it in the lock-up\'s stew, and say nothing', dark: true, note: 'Nobody with an office is risked, and the people eating it cannot refuse a meal.', info: [['yield', 'A native food'], ['danger', 'Four prisoners, not told'], ['fail', 'Their lives']],
      test: { base: 70, mods: [R('physician', 10), M('medbay', 5)] },
      ok: { text: s => `Four people in the lock-up eat knucklewort for a month and are weighed every morning, for their health. None of them is told. All four are well, and knucklewort goes into the ration.`,
        fx: { yield: 0.2, morale: 2, flags: { native_food: true }, stain: ['trial', 1], chron: 'The colony learned to eat knucklewort by feeding it to prisoners who were not told.' } },
      bad: { text: 'On day nineteen the kidneys go, in two of the four. The autopsies show which compound did it and how to leach it out. The other two are let out early and told nothing.',
        fx: { pop: -2, yield: 0.2, morale: -3, flags: { native_food: true, native_food_cost: true }, stain: ['trial', 2] } } },
  ] });
add({ id: 'crops.assay', arc: 'crops', tone: 'quiet', chain: true, title: 'The Assay Comes Back',
  text: s => `The autodoc's verdict on knucklewort: one renal toxin, water soluble. Soak it, boil it twice, and it is food. ${Nwc(s, 'physician')} signs off on it personally.`,
  choices: [
    { label: 'Add it to the ration', out: { text: 'It tastes like wet cardboard and iron, and people eat it anyway. The cooks who boil it twice a day lose the skin of their hands by the end of the season.', fx: { yield: 0.2, morale: -2, flags: { native_food: true }, chron: 'The colony learned to eat knucklewort, the first native food.' } } },
    { label: 'Boil it once. Twice takes fuel and hands the kitchen does not have', dark: true, note: s => `${Nc(s, 'physician')} signed for two boilings, and one leaves enough of the toxin to matter in anyone whose kidneys are already poor.`, info: [['yield', 'More food, sooner'], ['danger', 'The old and the sick']],
      out: { text: 'It goes into the ration boiled once, and nobody outside the kitchen is told the difference. The bins hold. Over the season the clinic loses two of its oldest patients to their kidneys, and enters them as age.',
        fx: { yield: 0.24, food: 100, pop: -2, flags: { native_food: true, native_food_cost: true }, stain: ['shortcut', 2], chron: 'The colony learned to eat knucklewort, the first native food, and cooked it faster than was safe.' } } },
  ] });

add({ id: 'crops.adapt', arc: 'crops', tone: 'opportunity', title: 'A Wheat for This World', repeat: 70, w: 2,
  when: s => !s.flags.crops_adapted && !s.flags.breeding && s.built.soillab && s.day >= 120,
  text: s => `${s.flags.crops_edit_failed ? `The last edit failed, and ${Nw(s, 'botanist')} knows why now. ` : ''}${LF.wheatWant(s)} What the colony needs is a wheat that can live here.\n\n${ok(s, 'fabricator') ? 'The fabricator can write that change in a season.' : s.machines.fabricator.lost ? 'With the fabricator gone, no machine here can write that change.' : 'The fabricator could write that change in a season, and it is still up on the ship.'} Breeding it by hand takes years, but it would work.${s.flags.und_pact ? ' Or there is the Understory, which already knows how to feed a root.' : ''}`,
  choices: [
    { label: 'Edit the genome on the fabricator', cost: { parts: 4 },
      req: s => ok(s, 'fabricator'), reqText: 'Needs the Fabricator',
      test: { base: 50, mods: [R('botanist', 10), Fl('soil_clues', 10, 'Soil notebooks'), Fl('native_food', 5, 'Knucklewort biochemistry'), Fl('oth_trade', 10, 'Thirty years of Reach farming')] },
      ok: { text: 'The first edited heads come up heavy and gold, roots furred with native symbionts. People walk out to the plots just to stand in it.',
        fx: { morale: 8, flags: { crops_adapted: true }, chron: 'An Earth wheat was rewritten to live in alien soil, and it thrived.' } },
      bad: { text: 'The edit takes, and so does something nobody asked for. The trial plots collapse into black slime in a week, and the bio-head has to be scrubbed down to bare metal. The two who did the scrubbing are in the clinic with their lungs, and one stays there.',
        fx: { food: -300, pop: -1, machine: { fabricator: -18 }, flags: { crops_edit_failed: true } } } },
    { label: 'Breed it the old way, on the best ground, with the watch on the fence', dark: true, note: 'It will work, but it takes years of seed that hungry people can see and may not eat.', info: [['yield', 'A wheat that is ours, in time'], ['danger', 'Whoever climbs the fence']],
      out: { text: s => `${Nwc(s, 'botanist')} starts a ledger of crosses, the way it was done for ten thousand years. The breeding plots are the best ground the colony has, and for years they will grow seed and feed nobody. In the second hungry month a field hand is shot on the fence with a shirt full of green ears.`, fx: { food: -60, pop: -1, flags: { breeding: true }, sched: [['crops.landrace', 170, 230]], stain: ['seed_guard', 1] } } },
    { label: 'Let the Understory into the test plots', show: s => !!s.flags.und_pact,
      out: { text: 'White threads lace the plots overnight. The wheat that grows there is the best anyone has seen on any world, and at harvest the threads are still wrapped round every root.',
        fx: { yield: 0.25, flags: { crops_adapted: true, crops_symbiotic: true }, chron: 'The colony let the Understory feed its wheat. The harvests that followed were extraordinary.' } } },
  ] });
add({ id: 'crops.landrace', arc: 'crops', tone: 'quiet', chain: true, title: 'Landrace',
  text: s => `Generation nine. ${Nwc(s, 'botanist')} brings you a sheaf, short and tough and ugly, with roots that hold a clod of native soil like a fist. No machine had a hand in it.\n\n[[botanist]] "Nine generations it took, off this ground and nothing else, and nobody gave us this one, so it's ours."`,
  choices: [
    { label: s => `Name it for ${s.firstDead || 'the ship'}`, out: { text: 'The name sticks. Children will grow up thinking that is simply the word for wheat.', fx: { morale: 8, flags: { crops_adapted: true, breeding: false }, chron: s => `A hand-bred landrace wheat took to the soil. It was named for ${s.firstDead || 'the ship'}.` } } },
    { label: 'Get it in the ground. Sentiment later', out: { text: 'The crews are in the plots by afternoon.', fx: { morale: 3, food: 150, flags: { crops_adapted: true, breeding: false }, chron: 'A hand-bred landrace wheat took to the soil.' } } },
  ] });
add({ id: 'crops.seedvault', arc: 'crops', tone: 'opportunity', title: 'The Seed Vault',
  when: s => s.flags.crops_adapted && s.day >= 300,
  text: s => `With a wheat that grows, ${Nw(s, 'botanist')} wants to plant everything. The vault still holds forty Earth species nobody has trialled, and seed does not keep forever.\n\n${Nwc(s, 'teacher')} says no, flat.\n\n[[teacher]] "There's one copy of each of those forty in the vault, and I don't spend the only copy of anything on a first try."`,
  choices: [
    { label: 'Plant it all. Seed in a vault feeds no one', note: 'If anything here ever learns to eat these crops, there will be nothing to replant from.', out: { text: s => `Barley, beans, flax, three kinds of squash. Some die within a week, but enough of them take. ${Nc(s, 'teacher')} has the objection entered in the record, and after that talks to you about business and nothing else.`, fx: { yield: 0.2, morale: 4, flags: { no_seed_reserve: true }, do: s => { const p = P(s, 'teacher'); if (p && p.loyal !== undefined) p.loyal = LF.clamp(p.loyal - 15, 0, 100); } } } },
    { label: 'Plant half. Keep the reserve sealed', note: 'Half the harvest it could have been, in a year when people are still counting ladles.', out: { text: s => `Half the vault goes into the ground. The other half stays cold, dark and sealed. ${Nc(s, 'botanist')} tells the mess hall what the sealed half would have fed, and is asked not to do that again.`, fx: { yield: 0.1, morale: -2, flags: { seed_reserve: true } } } },
  ] });
add({ id: 'crops.blight', arc: 'crops', tone: 'crisis', title: 'Rust',
  when: s => s.built.fields && s.day >= 420 && s.day - s.built.fields > 60,
  text: s => `It starts at the eastern edge: orange pustules on the flag leaves. A native rust has learned to eat adapted wheat, and the wind is carrying it down every row.\n\n${s.flags.crops_symbiotic ? 'The Understory-fed plots are untouched. The threads around their roots have turned a dark, busy red.' : s.flags.no_seed_reserve ? 'Every variety you own is already in the ground in front of it.' : 'The sealed half of the vault has never met this.'}`,
  choices: [
    { label: 'Burn the infected fields and replant from the vault', show: s => !s.flags.crops_symbiotic,   // where the Understory feeds the wheat, its option below takes this one's place: never a fourth
      req: s => !s.flags.no_seed_reserve, reqText: 'The vault is empty: everything was planted',
      out: { text: 'A season is lost to fire. The replanting comes from seed that never met the rust, in plots a kilometre upwind. The colony eats the bins down while it grows, and buries one of its old before the first cutting.', fx: { food: -400, pop: -1, morale: -3 } } },
    { label: 'Let the Understory handle it', show: s => !!s.flags.crops_symbiotic,
      out: { text: 'Within ten days the rust is gone from every row the threads can reach. Nobody asked it to, and nobody knows what it would do if told to stop.', fx: { morale: 2, flags: { und_guardian: true } } } },
    { label: 'Cull hard and save what resists', note: 'Whatever survives will be immune.',
      test: { base: 40, mods: [R('botanist', 10), Fl('seed_reserve', 10, 'Vault diversity'), Fl('soil_clues', 5, 'Soil notebooks')] },
      ok: { text: 'One row in twenty stands clean. That row becomes next year\'s whole crop.', fx: { food: -350, yield: 0.05 } },
      bad: { text: 'Nothing resists. The fields are stubble and orange dust, and the colony is back to eating from the stores.', fx: { food: -900, yield: -0.25, morale: -8 } } },
    { label: 'Every hand into the rows, day and night, until it is picked clean', dark: true, note: 'Children, clinic staff and the night watch pick it leaf by leaf, ahead of the wind.', info: [['yield', 'Most of the crop'], ['danger', 'The ones who cannot keep the pace']],
      out: { text: 'Eleven days of it, by lamp after dark, every pustuled leaf into a sack and every sack into the fire. Most of the crop is standing at the end. Two people are not: one who went down in the rows on the ninth night, and a child who ate from the sacks.',
        fx: { food: -60, pop: -2, morale: -5, stain: ['rows', 2] } } },
  ] });

/* ================= MACHINERY ================= */
add({ id: 'mach.biofilm', arc: 'machines', tone: 'pressure', title: 'Copper in the Water',
  when: s => s.day >= 35 && ok(s, 'reclaimer'),
  text: s => `The water tastes of pennies. ${Nwc(s, 'engineer')} holds a reclaimer membrane to the light: a violet film, eating the polymer.\n\n[[engineer]] "That's something from here, and it's moved into the membranes like it pays rent. They were rated for twenty years, and I'd give them two months now, less if we keep running her this hard."\n\nFour children were sick in the night, and the clinic is saying copper.`,
  choices: [
    { label: 'Swap in fresh membranes', show: s => !LF.has(s, 'machineshop'), cost: { parts: 6 },   // with a machine shop, frames off the lathe (content-builds.js) take this option's place: never a fourth
      out: { text: 'Clean water by evening. The old membranes are bagged and burned. The spares shelf has a gap in it.', fx: { machine: { reclaimer: 8 } } } },
    { label: 'Sterilise the loop with reactor heat', note: 'It costs no parts, as long as nothing cracks.',
      test: { base: 60, mods: [R('engineer', 10), M('reactor', 5)] },
      ok: { text: 'Six hours of superheated steam. The film comes out as grey flakes.', fx: { machine: { reactor: -5 } } },
      bad: { text: 'A weld in the heat exchanger lets go. The film dies, and the reclaimer loses a third of its capacity for good.', fx: { machine: { reclaimer: -22, reactor: -5 }, cap: { reclaimer: -12 } } } },
    { label: s => `Give ${F(s, 'xenobio')} a side loop to study it in`, dark: true, note: 'The colony drinks the copper for a month so that the culture can be watched, and the smallest drink it with everyone else.', info: [['yield', 'What the film is, and cheaper wells'], ['danger', 'The four children']],
      req: s => !!P(s, 'xenobio'), reqText: 'Nobody holds the science seat',
      out: { text: s => `${Nc(s, 'xenobio')} keeps a culture in a bypass line and watches it for a month. It filters heavy metals better than the membranes it ate. For that month the colony drinks what the short loop gives. Three of the four children get better when the month is over.`, fx: { machine: { reclaimer: -6 }, pop: -1, morale: -3, survey: 10, flags: { biofilm_studied: true }, stain: ['side_loop', 1] } } },
  ] });
add({ id: 'mach.printhead', arc: 'machines', tone: 'opportunity', title: 'Three Good Prints',
  when: s => s.day >= 80 && ok(s, 'fabricator') && LF.down(s, 'medbay'),
  text: s => `${Nwc(s, 'engineer')} has the fabricator's service log open.\n\n[[engineer]] "The fine head's at ninety-one percent of her rated life, and she'll do coarse work and spares for years yet if nobody rushes her. Fine work, though, she's got one job left in her, maybe, so pick it carefully and don't make me run it twice."\n\n${Nwc(s, 'physician')} has a list of the surgery that stops when the autodoc's consumables do. The workshop has a list too. Each list has names on it.`,
  choices: [
    { label: 'A second print head', note: 'A new head would keep the fabricator doing precision work, if the print finishes.',
      test: { base: 50, mods: [R('engineer', 10), M('reactor', 5)] },
      ok: { text: 'Forty hours of printing at tolerances nobody breathes near. The new head seats with a click.', fx: { machine: { fabricator: 30 }, cap: { fabricator: 25 }, chron: 'The fabricator printed its own replacement print head. It was the last thing the old head ever made.' } },
      bad: { text: 'The old head dies at hour thirty-one. What is on the bed is a very expensive paperweight.', fx: { machine: { fabricator: -30 }, cap: { fabricator: -20 } } } },
    { label: 'A master set of machine tools', note: 'They are no use until there is a shop to put them in.',
      out: { text: 'Gauge blocks, lead screws, a set of reference flats. Wrapped in oilcloth and locked away against the day there is a lathe to build around them. The first name on the surgery list is buried before that day comes.', fx: { machine: { fabricator: -8 }, pop: -1, flags: { toolset: true }, chron: 'The fabricator\'s last precision job was a set of master tools, for a machine shop that did not yet exist.' } } },
    { label: 'Autodoc surgical consumables', note: 'The autodoc could go on doing surgery for years.',
      out: { text: s => `Micro-manipulators, a new sensor wand. ${Nc(s, 'physician')} checks each piece into the medbay like a newborn. The workshop goes on running the pumps on bearings it cannot replace, and a fitter loses a hand to one of them before the year is out.`, fx: { machine: { fabricator: -8, medbay: 25 }, cap: { medbay: 20 }, morale: -2 } } },
  ] });
add({ id: 'mach.reactor', arc: 'machines', tone: 'crisis', title: 'Hairline',
  when: s => s.day >= 170 && ok(s, 'reactor'),
  text: s => `A coolant alarm at 0300: a hairline fracture in the reactor's primary loop, weeping.\n\n[[engineer]] "If I shut the old girl down and weld it right, that's ten days dark, and longer if the weld fights me. Somebody could go in hot with a patch instead, or we turn her down and live with less for good, and I don't like any of the three, so you'll have to pick."`,
  choices: [
    { label: 'Cold shutdown. Ten days dark, and the battery heat goes to the crews\' pod', dark: true, note: 'The weld is done properly and nobody is sent into the loop, and the people the restart can do without are the ones who sleep cold.', info: [['yield', 'A proper weld'], ['danger', 'The pods without heat']],
      out: { text: 'Every lamp in the camp goes out. The one heated pod holds the welders, the watch and the field crews. Everyone else sleeps in their coats, and two of the oldest are found in them. On the eleventh day the hum comes back.', fx: { food: -200, pop: -2, morale: -5, machine: { reactor: 14 }, stain: ['cold', 1] } } },
    { label: s => `Send ${F(s, 'engineer')} in hot`, about: true,
      test: { base: 50, mods: [R('engineer', 10), Tr('engineer', 'reckless', 5), Tr('engineer', 'cautious', -5)] },
      ok: { text: s => `Forty minutes in the suit. ${Nc(s, 'engineer')} comes out grey-faced, strips a glove, and gives you a thumbs up with a hand that will not stop shaking.`, fx: { morale: 4, machine: { reactor: 6 }, mark: ['engineer', 'hero'] } },
      bad: { text: s => `The patch holds, but the suit seal fails. ${Nc(s, 'engineer')} finishes the weld anyway and walks out unaided, and is dead in nine days.`,
        fx: { kill: { who: 'engineer', cause: 'radiation, welding the reactor loop live' }, machine: { reactor: -10 } } } },
    { label: 'Derate it. Run at sixty percent from now on', note: 'Everything that runs on power slows down, for good.',
      out: { text: s => `The fracture stops weeping. The lights are a little yellower than they were, and will stay that way. ${ok(s, 'hydroponics') ? 'A third of the hydroponic lamps are taken down to match, and the ladle is cut by the same third for the people the vats were feeding.' : 'The heaters and the pumps run by turns from now on, and the cold store is a few degrees warmer than the food in it would like.'}`, fx: { flags: { reactor_derated: true }, machine: { reactor: 5 }, food: -100, morale: -2 } } },
  ] });
/* Three options at most (2026-11-21). One machine is offered up for its parts: the lander once nobody and nothing is left in orbit
   for it to fetch, or when the autodoc cannot give (gone, still aboard, or the one that is failing); otherwise the autodoc. And the
   machine shop's lathe (content-builds.js) takes the place of the scrap bodge once it stands. */
const donor = (s, c) => ok(s, 'lander') && (!(s.sleepers > 0 || LF.inOrbit(s).length || LF.aboard(s).length) || !(ok(s, 'medbay') && c.id !== 'medbay')) ? 'lander' : 'medbay';
add({ id: 'mach.cannibal', arc: 'state', tone: 'crisis', title: 'Robbing Peter', repeat: 80,
  setup: s => { const id = Object.keys(s.machines).filter(k => ok(s, k) && k !== 'lander').sort((a, b) => s.machines[a].hp - s.machines[b].hp)[0]; return { id, name: LF.MACHINES[id].name }; },
  when: s => s.res.parts < 6 && Object.keys(s.machines).some(k => k !== 'lander' && ok(s, k) && s.machines[k].hp < 28),
  text: (s, c) => `The ${c.name} is failing, and the spares shelf is bare. ${Nwc(s, 'engineer')} lays it out without drama.\n\n[[engineer]] "I can keep her going a while yet, but the parts come out of something that's still running, and then that one starts coughing. Either way I'll be hearing about it, from her or from the other one."`,
  choices: [
    { label: 'Strip the lander', dark: true, show: (s, c) => donor(s, c) === 'lander', req: s => ok(s, 'lander'), reqText: 'The lander is already gone',
      note: s => s.sleepers > 0 ? `${s.sleepers} sleepers are still in orbit, and this is the only way up to them.` : 'Nobody is left in orbit to fetch.', info: [['yield', 'The machine, and spares'], ['danger', 'Everyone still in orbit']],
      out: { text: (s, c) => `The lander comes apart in an afternoon. It took nine years to build. The ${c.name} runs clean on its bones.${s.sleepers > 0 ? ` ${Nwc(s, 'pilot')} takes the manifest of the ${s.sleepers} still aboard off the pad office wall and does not say where it is put.` : ''}`,
        fx: (s, c) => ({ machine: { lander: -999, [c.id]: 45 }, parts: 8, flags: s.sleepers > 0 ? { sleepers_abandoned: true } : {}, sched: s.sleepers > 0 ? [['sleep.lights', 20, 50]] : [], stain: s.sleepers > 0 ? ['abandoned', 2] : null }) } },
    { label: 'Strip the autodoc', dark: true, show: (s, c) => donor(s, c) === 'medbay', req: (s, c) => ok(s, 'medbay') && c.id !== 'medbay', reqText: 'Not an option', note: 'There are three people in the clinic tonight who are alive because it is running.', info: [['yield', 'The machine, and spares'], ['danger', 'The three in the clinic, and everyone after them']],
      out: { text: (s, c) => `${Nwc(s, 'physician')} asks for an hour to move the three who are on it, and is given the hour. One of them dies in the corridor during it. Then the autodoc is opened up like a patient, and the ${c.name} lives.`, fx: (s, c) => ({ machine: { medbay: -999, [c.id]: 40 }, parts: 5, pop: -1, morale: -4, stain: ['unplugged', 2] }) } },
    { label: 'Jury-rig it from scrap and hope', show: s => !LF.has(s, 'machineshop'), cost: { mat: 25 },
      test: { base: 20, mods: [R('engineer', 10), Fl('toolset', 10, 'Master tools')] },
      ok: { text: 'It is held together with hull plate and hose clamps, but it runs.', fx: (s, c) => ({ machine: { [c.id]: 25 } }) },
      bad: { text: 'The bodge fails under load and takes the housing with it, and the fitter who was leaning on the housing.', fx: (s, c) => ({ pop: -1, machine: { [c.id]: -15 }, cap: { [c.id]: -10 } }) } },
    { label: 'Let it die, and put the failure on the crew that kept it', dark: true, note: 'It wore out, as everything the ship brought will, and a colony that is told so will ask what wears out next.', info: [['yield', 'The anger goes somewhere else'], ['danger', 'A crew that did nothing wrong']],
      out: { text: (s, c) => `You give the order to stop, and an hour later a second order: an inquiry into the maintenance log. It finds what it was sent to find. The shift foreman is broken to the fields and two fitters lose their ration grade. The mess hall has somebody to be angry with, and the ${c.name} is scrap.`, fx: { morale: 3, tension: -8, stain: ['blamed_crew', 1] } } },
  ] });
add({ id: 'mach.lander', arc: 'machines', tone: 'pressure', title: 'Flight Hours',
  when: s => ok(s, 'lander') && s.machines.lander.cap < 62 && s.sleepers >= 40 && LF.canFly(s) && !s.flags.lander_grounded,
  text: s => `${Nwc(s, 'pilot')} finds you at the pad.\n\n[[pilot]] "The shield's got one clean re-entry left in it, and one and a half if I take it past the margin."\n\nA glance up, at nothing.\n\n[[pilot]] "That's ${s.sleepers} people still up there, and there's no second flight coming for any of them."`,
  choices: [
    { label: 'One last run, overloaded: forty in a hold built for twenty',
      test: { base: 50, mods: [R('pilot', 10), Tr('pilot', 'reckless', 5)] },
      ok: { text: s => `The lander comes down trailing sparks and lands hard enough to buckle a strut. Forty people stumble out into the wind. It will not fly again.`, fx: { pop: 40, sleepers: -40, fly: 1, machine: { lander: -999 }, flags: { last_flight: true }, sched: [['sleep.lights', 30, 60]] } },
      bad: { text: s => `It breaks up at eleven kilometres. People in the fields look up at the sound. ${Nc(s, 'pilot')} was still calling altitudes.`,
        fx: { kill: { who: 'pilot', cause: 'the last flight of the lander' }, fly: 1, sleepers: -40, morale: -12, machine: { lander: -999 }, flags: { last_flight_lost: true }, sched: [['sleep.lights', 30, 60]],
          chron: 'The lander broke up on re-entry with forty sleepers aboard.' } } },
    { label: 'One careful run of twenty. Then retire her for parts', dark: true, note: 'It is safe, it is certain, and it is a decision about everyone who is not one of the twenty.', info: [['yield', 'Twenty people, and spares'], ['danger', 'Everyone else in orbit, for good']],
      out: { text: s => `Twenty more faces in the mess hall. The lander is towed to the workshop and never leaves it. ${Nc(s, 'pilot')} chose the twenty, and knows the names of the rest.`, fx: { fly: 1, pop: 20, sleepers: -20, parts: 12, machine: { lander: -999 }, flags: { sleepers_abandoned: true }, sched: [['sleep.lights', 30, 60]], stain: ['abandoned', 2] } } },
    { label: 'Ground her until we can do it properly', note: 'The sleepers wait, and the lander keeps ageing on the pad.', out: { text: s => `${Nc(s, 'pilot')} nods, slowly. Neither of you says what "properly" would take. The ship's next cryo report lists four pods as no longer drawing power.`, fx: { sleepers: -4, morale: -2 } } },
  ] });

/* ================= SLEEPERS ================= */
add({ id: 'sleep.manifest', arc: 'sleepers', tone: 'opportunity', title: 'The Manifest',
  when: s => s.day >= 28 && s.sleepers >= 23 && ok(s, 'lander') && LF.canFly(s) && !s.flags.lander_grounded,
  text: s => `The first shuttle window opens tomorrow. ${Nwc(s, 'quartermaster')} has the cryo manifest: ${s.sleepers} names, each with a trade and a calorie cost.\n\n[[quartermaster]] "There's twenty seats, and whoever comes down eats from the first day, and whoever stays up sleeps in a bank the ship can't vouch for any more. I'd not promise anybody a second window, because I don't know that there is one."`,
  choices: [
    { label: 'Field hands and builders', out: { text: s => `Twenty strong backs walk off the ramp, squinting. By the end of the month they are ${LF.lex(s, 'burnt')} and useful. Three of the amber pods they were chosen over are dark by the next window.`, fx: { pop: 20, sleepers: -23, fly: 1, machine: { lander: -12 } } } },
    { label: 'The specialists', note: 'Fewer hands, but people who know things.',
      out: { text: 'A hydrologist, two machinists, a surgeon, a woman who wrote her thesis on closed-loop ecology. They ask better questions than you have answers for. Three of the amber pods they were chosen over are dark by the next window.', fx: { pop: 12, sleepers: -15, survey: 20, parts: 6, fly: 1, machine: { lander: -12 }, flags: { specialists: true } } } },
    { label: 'The families', note: 'Children give everyone a reason to keep going, and they cannot work yet.',
      out: { text: 'Nine children wake to open sky. By evening every adult in the colony has found an excuse to walk past the pod where they are sleeping. Three of the amber pods they were chosen over are dark by the next window, and the field crews are no bigger than they were.', fx: { pop: 20, sleepers: -23, morale: 9, food: -80, fly: 1, machine: { lander: -12 }, flags: { children: true }, chron: 'The first children came down from orbit.' } } },
  ] });
add({ id: 'sleep.cryo', arc: 'sleepers', tone: 'crisis', title: 'Bank C',
  when: s => s.day >= 190 && s.sleepers >= 60,   // forty in bank C and twenty of D to trade for them
  text: s => `The ${s.world.ship} sends an automated alert. Cryo bank C, with forty sleepers in it, is losing coolant. The ship estimates eleven days before thaw becomes uncontrolled, which is to say fatal.\n\n${ok(s, 'lander') ? `${Nwc(s, 'pilot')} is already running numbers for back-to-back flights.` : 'There is no lander. Whatever is done will be done by radio.'}`,
  choices: [
    { label: 'Two emergency flights, back to back', req: s => ok(s, 'lander') && s.machines.lander.hp > 30 && LF.canFly(s, 2), reqText: s => !ok(s, 'lander') || s.machines.lander.hp <= 30 ? 'Needs a flightworthy lander' : LF.flyWhy(s, 2),
      test: { base: 60, mods: [R('pilot', 10)] },
      ok: { text: 'Forty people come down woken too fast, sick and shaking, but alive. The lander\'s shield is scorched black, and there are forty more bowls on a table that was short already.', fx: { fly: 2, pop: 40, sleepers: -40, food: -160, morale: 5, machine: { lander: -28 }, cap: { lander: -12 } } },
      bad: { text: 'The first flight makes it. The second window closes on a fuel-line fault, and by the next one bank C is quiet.', fx: { fly: 2, pop: 20, sleepers: -40, food: -80, morale: -8, machine: { lander: -25 }, cap: { lander: -10 } } } },
    { label: 'Drain bank D into bank C. Twenty of D for forty of C', dark: true, note: 'Half of bank D is shut down for its coolant, and if a valve sticks the rest of D goes with it.', info: [['yield', 'Forty saved'], ['danger', 'Twenty sleepers'], ['fail', 'Both banks']],
      test: { aboard: true, base: 60, mods: [R('engineer', 10)] },
      ok: { text: s => `${Nwc(s, 'engineer')} ${LF.seatState(s, 'engineer') === 'orbit' ? 'does it by hand in the coolant bay, valve by valve, in a suit that is too warm' : 'talks the ship through it valve by valve, on a nine-second lag'}. Twenty pods in bank D are shut down in order of age, oldest first, and their coolant fed across. Bank C steadies.`, fx: { sleepers: -20, morale: -2, stain: ['bank_trade', 2], chron: 'Twenty sleepers in bank D were shut down so that their coolant could save forty in bank C.' } },
      bad: { text: 'A valve sticks open. Bank C fails in an hour, and D follows it down.', fx: s => ({ sleepers: -Math.min(80, s.sleepers), morale: -14, stain: ['bank_trade', 2], chron: `${s.sleepers >= 80 ? 'Eighty' : s.sleepers} sleepers died in orbit when a remote repair failed.` }) } },
    { label: 'Let them go. We could not have fed them', dark: true, req: s => !s.flags.council, reqText: 'The Council would never ratify this', note: 'Forty mouths the stores never have to find, and what is left of their coolant goes round the banks that are sound.', info: [['yield', 'The other banks last longer'], ['danger', 'Forty sleepers']],
      out: { text: 'You do not announce it. The alert is acknowledged and nothing is sent after it. The ship reports bank C quiet on the twelfth day and the other banks steadier than they have been all year. It is known in the mess hall by nightfall anyway.', fx: { sleepers: -40, morale: -6, flags: { let_sleepers_die: true }, stain: ['bank_c', 2], chron: 'Forty sleepers were allowed to die in orbit. The stores could not have carried them.' } } },
  ] });
add({ id: 'sleep.lights', arc: 'sleepers', tone: 'quiet', chain: true, title: 'The Light That Crosses at Dusk',
  when: s => s.sleepers > 0,
  text: s => `Every evening the ${s.world.ship} crosses the sky, a hard white point, twelve minutes horizon to horizon. ${s.sleepers} people are still aboard her. There is no longer any way up.\n\nPeople have started gathering on the ridge to watch. ${Nwc(s, 'chaplain')} asks what you intend to tell them.`,
  choices: [
    { label: 'The truth. They will sleep until the ship dies', out: { text: 'It is very quiet on the ridge. Then someone starts reading the names aloud, and reads to the end of the list. Two people with family on that list walk out past the wire that month and are not looked for.', fx: { morale: -6, leave: 2, flags: { sleepers_mourned: true }, chron: s => `The colony read aloud the names of the ${s.sleepers} sleepers it could not reach.` } } },
    { label: 'A promise: one day we will build our way back up', dark: true, note: 'Nobody alive here will see a rocket built on this world, and you know it when you say it.', info: [['yield', 'Morale'], ['danger', 'It is not true, and it costs plate']], out: { text: 'You say it and watch it land. On the walk down from the ridge, people are arguing about rocket fuel. Within the month there is a drawing office in a cargo pod, with plate set aside for it that the wells were waiting on.', fx: { morale: 6, mat: -20, flags: { promise_orbit: true }, stain: ['promise', 1], chron: 'The Administrator promised the colony would one day return to orbit for its sleepers.' } } },
  ] });

/* ================= THE FEVER ================= */
add({ id: 'fever.first', arc: 'fever', tone: 'pressure', title: 'Greensight',
  when: s => s.day >= 110, w: 0.9,
  text: s => `Three of the ${s.flags.site_delta ? 'delta ditch crew' : 'field crew'} see a green haze at the edge of their vision. Something photosynthetic is growing in the fluid of their eyes.\n\n[[physician]] "There's no fever and nothing hurts, and the youngest of the three keeps asking me if that means it's good news." "I don't know how it spreads and I don't know if it stops, and I haven't told them it's nothing, so you don't get to either."`,
  choices: [
    { label: 'Quarantine the crew and everyone they bunk with', out: { text: 'Fourteen people behind a taped line, playing cards and going slowly blind. The fields go short-handed.', fx: { morale: -4, food: -120, flags: { fever_quarantine: true }, sched: [['fever.spread', 14, 24]] } } },
    { label: 'Full workup on the autodoc', req: s => ok(s, 'medbay'), reqText: 'Needs the Autodoc',
      out: { text: 'Vitreous taps, cultures, sequencing. The autodoc runs hot for a week and the answer is a genome nobody can read yet. The three go on sleeping in their own bunkroom while it runs, and one of them is blind before it finishes.', fx: { machine: { medbay: -8 }, morale: -2, flags: { fever_studied: true }, sched: [['fever.spread', 14, 24]] } } },
    { label: 'Take the six eyes out tonight', dark: true, req: s => ok(s, 'medbay'), reqText: 'Needs the Autodoc', note: 'It lives in the fluid of the eye, so three people lose their sight now and it goes no further.', info: [['yield', 'It may end here'], ['danger', 'Three people, for certain']],
      test: { base: 70, mods: [R('physician', 10)] },
      ok: { text: s => `${Nc(s, 'physician')} asks for the order in writing, and then does it, one after another, before morning. The three are led out with bandaged faces and are given seats by the stove for life. Nobody else in the colony ever sees green.`,
        fx: { morale: -5, flags: { fever_cured: true, blind_colonists: true, fever_cut: true }, stain: ['eyes', 2], chron: 'Greensight was stopped by blinding the first three who caught it.' } },
      bad: { text: 'It is done before morning, one after another. Nine days later a fourth person on the same crew sees green, and then a fifth. The three were blinded for nothing.',
        fx: { morale: -8, flags: { blind_colonists: true, fever_cut: true }, sched: [['fever.spread', 10, 18]], stain: ['eyes', 2] } } },
  ] });
add({ id: 'fever.spread', arc: 'fever', tone: 'crisis', chain: true, title: 'The Colony Goes Dim',
  text: s => `${s.flags.fever_quarantine ? 'The quarantine slowed it down but did not stop it.' : 'It is in the water.'} ${s.flags.fever_quarantine ? 'One in six' : 'One in three'} of the colony is seeing green. The worst cases are led to the latrine by the hand.\n\n${s.flags.native_food ? `${Nwc(s, 'physician')} has noticed something. Nobody who eats knucklewort daily has caught it.` : `${Nwc(s, 'physician')} has one lead: an old oncology drug in the ship's formulary kills the organism in a dish.`}`,
  choices: [   // three on screen: the tuber where the colony eats it, the trial dose (last) where it does not
    { label: 'Knucklewort for everyone, three meals a day', show: s => !!s.flags.native_food,
      out: { text: 'Whatever is in that miserable tuber, the organism cannot abide it. Within the month the green recedes. Everyone smells faintly of iron.', fx: { morale: 4, flags: { fever_cured: true }, chron: 'Greensight was cured by a native tuber the colony had only just learned to eat.' } } },
    { label: 'Synthesise the drug', cost: { parts: 3 }, req: s => ok(s, 'fabricator'), reqText: 'Needs the Fabricator',
      test: { base: 50, mods: [R('physician', 10), Fl('fever_studied', 10, 'Autodoc workup'), Fl('biofilm_studied', 5, 'Biofilm cultures'), M('medbay', 5)] },
      ok: { text: 'The first batch tastes of solvent and works in four days. People stand outside blinking at the horizon.', fx: { morale: 5, flags: { fever_cured: true }, chron: 'Greensight swept the colony and was beaten back with a drug from the fabricator.' } },
      bad: { text: 'The synthesis is impure. It cures most people and destroys the livers of four, who were given it first because they were worst.', fx: { pop: -4, morale: -6, flags: { fever_cured: true } } } },
    { label: 'Ride it out. The blind are shut in the long pod so the sighted can work', dark: true, note: 'Nobody is led about by the hand and nothing is spent, and whoever is in the long pod stays there until it has passed.', info: [['yield', 'The work goes on'], ['danger', 'Everyone in the long pod'], ['fail', 'Lives in the pod']], test: { base: 40, mods: [M('medbay', 10), R('physician', 10), Fl('fever_quarantine', 10, 'Quarantine held early')] },
      ok: { text: 'It burns through in two months behind a barred door, with meal and water passed in. Most of them come out seeing. Eleven do not get their sight back, and the colony strings guide ropes between the buildings for them.', fx: { food: -150, morale: -4, flags: { fever_cured: true, blind_colonists: true }, stain: ['shut_in', 1], chron: 'Greensight passed. Eleven colonists stayed blind, and the guide ropes stayed up.' } },
      bad: { text: 'Forty blind people in one pod with a barred door is a different sickness. There is a fire in the third week, from a stove nobody inside could see. Five are dead before the bar is lifted.', fx: { pop: -5, food: -200, morale: -9, flags: { fever_cured: true, blind_colonists: true }, stain: ['shut_in', 2], chron: 'Greensight blinded a third of the colony. Five died in the pod where the blind were shut in.' } } },
    { label: 'Dose the worst cases first, at four times the strength, and watch', dark: true, show: s => !s.flags.native_food, cost: { parts: 3 }, req: s => ok(s, 'fabricator'), reqText: 'Needs the Fabricator',
      note: 'The ones who are already blind are told it is the cure, when it is the trial that finds one.', info: [['yield', 'A dose that is known to be safe'], ['danger', 'The ones it is found on']],
      out: { text: s => `Five of the blind are dosed in the clinic annex and told it is the cure. Three of them die of it, at doses ${N(s, 'physician')} writes down to the milligram. The sixth dose works and harms nobody, and so does every one after it. The two who lived do not get their sight back.`,
        fx: { pop: -3, morale: 3, flags: { fever_cured: true, blind_colonists: true }, stain: ['trial', 2], chron: 'Greensight was cured with a drug whose dose was found on five of the blind. Three died of it.' } } },
  ] });

/* ================= STATE-DRIVEN ================= */
/* Three options at most (2026-11-21), chosen by what the colony has. One of each kind is on the card:
     what was put by     the sealed reserve if there is one, else the cannery's jars (content-builds.js), else the seed grain;
     food from outside   the Reach if the colony is on terms with it, else forage parties;
     the hard hand       the ten pods if that column was kept back and can be flown (content-limits.js), else half rations at gunpoint. */
const FAM = LF.famine = { jars: s => LF.has(s, 'cannery') && !(s.flags.jars_eaten && s.day - s.flags.jars_eaten < LF.YEAR), reach: s => !!(s.flags.oth_trade || s.flags.oth_friends || s.flags.oth_kin),
  pods: s => !!s.flags.lim_herd_held && !s.flags.lim_herd && ok(s, 'lander') && s.sleepers >= 10 };
add({ id: 'state.famine', urgent: true, max: 2, arc: 'state', tone: 'crisis', title: 'The Bottom of the Bins', repeat: 75,
  when: s => foodDays(s) < 22,
  text: s => `${Nwc(s, 'quartermaster')} does not bother with the ledger.\n\n[[quartermaster]] "There's two months left in the bins, and less than that if folk work hard enough to get hungry, and they'll have to."\n\nOutside, a queue has formed at the stores door two hours before it opens.`,
  choices: [
    { label: 'Eat the seed grain', show: s => !s.flags.reserve && !FAM.jars(s), note: s => s.flags.first_sow === 'half' && s.flags.seed_grain ? 'These are the lockers you sealed in the first season. You eat now and harvest less later.' : 'You eat now and harvest less later.',
      req: s => !!(s.flags.seed_grain || s.flags.crops_adapted || s.day > 300), reqText: 'There is none. It all went into the ground in the first season',
      out: { text: s => s.flags.first_sow === 'half' && s.flags.seed_grain ? 'The lead tag is cut. It is milled the same night, before anyone can argue.' : 'It is milled the same night, before anyone can argue. Whoever is alive next Seedfall will go short for it.', fx: { food: 650, yield: -0.12, morale: -3, flags: { seed_grain: false } } } },
    { label: 'Forage parties, and the lock-up eats what they bring in first', dark: true, show: s => !FAM.reach(s), note: 'Nobody knows what out there is food, and somebody has to find out before it goes in the common pot.', info: [['yield', 'Food'], ['fail', 'Whoever is in the lock-up']], test: { base: 50, mods: [Fl('native_food', 15, 'Knucklewort is known safe'), R('xenobio', 10), Fl('hive_allies', 10, 'The drummers show the way')] },
      ok: { text: 'They come back with sacks of tuber and something like a shellfish. Each kind is fed to the lock-up for three days before the kitchen gets it. All of it turns out to be merely unpleasant.', fx: { food: 550, flags: { native_food: true }, stain: ['taster', 1] } },
      bad: { text: 'They come back with sacks of six different things. Two of the six kill the two prisoners they were tried on. The other four go into the pot.', fx: { pop: -2, food: 300, morale: -3, flags: { native_food: true }, stain: ['taster', 2] } } },
    { label: 'Half rations, and the watch on the stores door with orders to fire', dark: true, show: s => !FAM.pods(s), note: 'The bins last twice as long if nobody takes more than the scales give, and hungry people will try.', info: [['yield', 'The stores last'], ['danger', 'Whoever comes to the door at night']], out: { text: 'The scales come out. People watch each other\'s plates. The watch stands at the stores door with a rifle, and on the fourth night uses it on a man with a sack. He was a field hand with two children. The stores are not tried again.', fx: { rations: 'tight', morale: -5, pop: -1, stain: ['stores_door', 1] } } },
    { label: 'Break the seals on the reserve', show: s => !!s.flags.reserve, hint: 'good',
      out: { text: 'The vote takes four minutes. The lead tags are cut with the same snips that sealed them.', fx: { food: 600, morale: 3, flags: { reserve: false } } } },
    { label: 'Ask the Reach for grain', show: s => FAM.reach(s),
      out: { text: 'Six carts come up the south road. The Reach does not name a price, though everyone knows there is one. Their carters look at how thin the children are and write something down.', fx: { food: 700, morale: -2, flags: { oth_debt_us: true } } } },
  ] });
/* Three options at most (2026-11-21): a concession (elections while nobody has been elected, otherwise the stores opened to whoever
   goes back first), force (the hall cleared; once force has been used on the colony before, s.flags.crackdown, it is "One in ten"
   from content-limits.js instead) and hunger (the kitchen shut). */
add({ id: 'state.unrest', urgent: true, max: 2, arc: 'state', tone: 'crisis', title: 'Tools Down', repeat: 70,
  when: s => s.morale < 24,
  text: s => `Nobody reports for the morning shift. They are sitting in the mess hall, all of them, not shouting. ${Nwc(s, 'security')} waits by the door for a word from you.${s.flags.command_rule ? '\n\nSomeone has chalked the first line of the mission charter on the wall, and crossed it out.' : ''}`,
  choices: [
    { label: 'Open the stores, to whoever picks up their tools first', dark: true, show: s => !!(s.flags.council || s.flags.committee), cost: { food: 250 }, note: 'Full plates and a rest day for the first forty back on shift, and the ordinary ladle for the ones who hold out.', info: [['yield', 'The stoppage breaks'], ['danger', 'The ones who held out, and the bins']],
      out: { text: 'The first to stand up are the ones with children. By noon there are forty names on the list and the hall is half empty. The ones who stayed sitting eat at their own table after that, and the forty are not forgiven by them.', fx: { morale: 11, tension: -10, stain: ['strikebreakers', 1], do: s => { s.lowMorale = 0; } } } },
    { label: 'Clear the hall', dark: true, show: s => !s.flags.crackdown, req: s => !s.flags.committee, reqText: 'The committee holds the armoury now', note: 'They are unarmed and sitting down, and the watch is neither.', info: [['yield', 'The work starts again'], ['fail', 'Blood in the mess hall']], test: { base: 40, mods: [R('security', 10), Fl('command_rule', 5, 'Habit of command'), Fl('council', -10, 'An elected Council exists')] },
      ok: { text: 'The watch goes down the benches with batons. There are broken hands and one broken jaw. They go back to work without looking at you.', fx: { morale: 6, flags: { crackdown: true }, stain: ['crackdown', 1] } },
      bad: { text: 'Someone throws a bench. When it is over there is blood on the mess hall floor, and it is never quite scrubbed out.', fx: { pop: -2, morale: -6, flags: { crackdown: true, blood_spilled: true }, stain: ['crackdown', 2], chron: 'A work stoppage was broken by force. Two colonists died.' } } },
    { label: 'Stand up in front of them and call elections', show: s => !s.flags.council && !s.flags.committee,
      out: { text: s => `It takes them a moment to understand what you have said. Then the hall is very loud. ${Nc(s, 'security')} hands in the armoury key that evening and asks, very politely, whose it is now.`, fx: { morale: 18, flags: { council: true, command_rule: false }, do: s => { const p = P(s, 'security'); if (p && p.loyal !== undefined) p.loyal = LF.clamp(p.loyal - 18, 0, 100); }, chron: 'Faced with a general strike, the Administrator handed power to an elected Council.' } } },
    { label: 'Shut the kitchen until the shift bell is answered', dark: true, note: 'Nobody is touched, and the stores keep everything that is not eaten.', info: [['yield', 'The work starts again, and the bins are fuller'], ['danger', 'The ones who hold out longest']],
      out: { text: 'The kitchen is locked and the watch is put on the door. The first day they sing. On the fourth morning the shift bell is answered by nearly everyone. The few who are not there are in their bunks, and one of them, an old fitter who had been living on the ladle, stays in it.', fx: { morale: 3, tension: -6, progress: -0.1, food: 150, pop: -1, stain: ['kitchen', 2], do: s => { s.lowMorale = 0; } } } },
  ] });
})();

/* How the hand-written choices register on the colony's character (see gen.js). One entry per choice, in order. */
Object.assign(LF.TAGS, {
  'crops.first': ['severe order', 'bold', 'cautious'], 'crops.native': ['bold', 'cautious', 'severe order'], 'crops.adapt': ['bold', 'severe order', 'open bold'],
  'crops.assay': ['', 'severe bold'], 'crops.seedvault': ['bold', 'cautious'], 'mach.biofilm': ['', 'bold', 'open severe'], 'mach.reactor': ['severe order', 'bold', 'cautious'],
  'mach.cannibal': ['severe', 'severe', 'bold', 'severe order'], 'mach.lander': ['bold', 'severe cautious', ''], 'sleep.manifest': ['', 'order', 'mercy'],
  'sleep.cryo': ['bold mercy', 'severe bold', 'severe'], 'sleep.lights': ['free', 'bold order'], 'fever.first': ['cautious order', 'cautious', 'severe order'],
  'fever.spread': ['open', 'bold', 'severe order', 'severe order'], 'state.famine': ['bold', 'severe bold', 'order severe', 'cautious', 'open'], 'state.unrest': ['order', 'order severe', 'free', 'severe order'],
  'pol.rations': ['mercy', 'severe order', 'bold'], 'pol.theft': ['severe order', 'mercy', 'severe closed'], 'pol.charter': ['free', '', 'order'],
  'pol.burial': ['severe', 'mercy', 'free'], 'pol.faith': ['free open', '', 'order closed'], 'pol.schism': ['free mercy', 'mercy', 'order severe'],
  'pol.accident': ['cautious mercy', 'bold severe', 'mercy'], 'pol.accident2': ['mercy cautious', 'severe order'], 'pol.births': ['free', 'order', 'cautious order'],
  'q.earth': ['free', 'order', 'open'], 'q.feud': ['bold', '', ''], 'q.walkabout': ['mercy', ''],
  'und.rings': ['closed bold', 'cautious open', 'bold open', 'open'], 'und.pipes': ['closed', 'open bold', 'cautious closed'], 'und.answer': ['open bold', 'cautious open', 'closed severe'],
  'und.blight': ['closed severe', 'open', 'cautious'], 'und.price': ['open free', 'closed order', 'open'],
  'bld.find': ['bold open', 'cautious open', 'bold open', 'bold open', 'closed order'], 'bld.wake': ['bold open', 'cautious open', 'closed'], 'bld.offer': ['bold open', 'cautious', 'closed cautious'],
  'bld.finish': ['closed bold', 'open bold', 'open cautious'], 'oth.signal': ['open bold', 'cautious', 'closed cautious', 'bold', 'bold closed'], 'oth.contact': ['open', 'open mercy', 'closed'],
  'oth.demand': ['mercy', 'mercy open', 'closed severe'], 'oth.kin': ['severe open', 'open mercy', 'closed'], 'oth.raid': ['bold severe', 'cautious closed', 'mercy open'],
  'hive.tracks': ['closed bold', 'open mercy', 'cautious open', 'bold', 'bold closed'], 'hive.drums': ['open mercy', 'severe closed', 'closed cautious'], 'hive.border': ['open cautious', 'open', 'bold closed'],
  'hive.raid': ['severe bold', 'cautious order', 'cautious', 'severe closed'], 'hive.sick': ['mercy open', 'cautious closed', 'open'],
});

/* The wheat card is the only way to the food cord, and it used to wait its turn among six hundred others: it came up in
   three games in ten, and the other seven could not be won whatever was done in them (found 2026-11-17, with WHY=1 in the
   sim). Once the soil laboratory stands it is asked for outright, and again a season after an edit that failed. */
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { if (t0) t0(s);
  if (!s.world || s.adrift || s.day % 10 || s.day < 120 || !s.built.soillab || s.flags.crops_adapted || s.flags.breeding) return;
  const u = s.used['crops.adapt'];
  if ((u === undefined || s.day - u >= 90) && !s.sched.some(e => e.id === 'crops.adapt')) s.sched.push({ id: 'crops.adapt', day: s.day + LF.sri(s, 10, 40) }); }; })();

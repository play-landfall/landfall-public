/* Landfall — council decisions and aftermaths.
   The decisions that replaced the management screens: what to do with the seed, where the year's labour goes,
   when to wake more sleepers, when to ease the rations. Each one reads what was decided before (LF.h.did, flags)
   and says so. Then the aftermaths: short decisions that some outcomes force at once (see LF.aftermath). */
(function () {
'use strict';
const { add, h } = LF; const { P, N, Nc, F, R, M, Fl, If, foodDays, did } = h;
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const frac = t => t < 0.2 ? 'One plot in six' : t < 0.3 ? 'One plot in four' : t < 0.42 ? 'One plot in three' : t < 0.55 ? 'Half the plots' : 'Two plots in three';

/* ================= THE SEED ================= */
add({ id: 'plan.seeds', arc: 'crops', tone: 'council', title: 'The Seed Stock', w: 9, gap: 0,
  when: s => LF.need(s) === 'soil' && s.day >= 6 && !s.flags.first_sow,
  text: s => `${Nc(s, 'botanist')} has the seed lockers open on the ramp: wheat, barley, beans. Enough to sow every cleared plot once.\n\n"Sow it all, and we're eating our own bread in a season. If the ground won't take it, that's the seed gone. There isn't any more." ${LF.down(s, 'hydroponics') ? 'The hydroponics bay feeds twenty-four' : 'The hydroponics bay is still up on the ship'}. There are ${s.pop} of you.`,
  choices: [
    { label: 'Plant all of it now', note: 'The biggest harvest this ground can give, and no seed left if the soil is wrong.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A full harvest'], ['danger', 'Nothing held back']],
      out: { text: 'Every plot is sown by the end of the month. The lockers are swept out, and the sweepings are sown too.', fx: { flags: { first_sow: 'all' }, sched: [['plan.sprout', 24, 34]], chron: 'In the first season the colony put all its seed in the ground.' } } },
    { label: 'Plant half. Seal the rest', note: 'Half a harvest for a colony that needs a whole one, with seed kept back to plant again if it fails.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'Half a harvest'], ['danger', 'Half the bread']],
      out: { text: s => `Half the plots are sown. ${Nc(s, 'quartermaster')} seals the other lockers with wire and a lead tag, and hangs the key in the stores office where everyone can see it.`, fx: { flags: { first_sow: 'half', seed_grain: true }, sched: [['plan.sprout', 24, 34]] } } },
    { label: 'Trial plots only. Learn the soil first', note: 'You risk almost no seed and you get almost no food, and the hold has to carry everyone for the season you spend learning.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'Notes on the soil'], ['danger', 'A season with no harvest']],
      out: { text: s => `Twelve small squares, each sown differently, each with a numbered stake. ${Nc(s, 'botanist')} walks them every morning with a notebook.`, fx: { flags: { first_sow: 'trial', seed_grain: true, soil_clues: true }, survey: 6, sched: [['plan.sprout', 24, 34]] } } },
    { label: 'Plant all of it, with every hand that can hold a hoe', dark: true, note: 'The clinic, the children and the night watch go into the furrows for a week, so that the seed is in before the weather turns.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A full harvest, sown in time'], ['danger', 'Nothing held back'], ['danger', 'The ones who should be in bed']],
      out: { text: s => `Every plot is sown in six days, by lamp at the end. ${Nc(s, 'physician')} said two of the clinic's patients should not be in a field. One of them dies in the furrows on the fifth day and is buried at the head of his row.`,
        fx: { pop: -1, morale: -2, yield: 0.05, flags: { first_sow: 'all' }, sched: [['plan.sprout', 24, 34]], stain: ['furrows', 1], chron: 'In the first season the colony put all its seed in the ground, and everyone who could stand sowed it.' } } },
  ] });

add({ id: 'plan.sprout', arc: 'crops', tone: 'council', chain: true, title: 'What Came Up',
  setup: s => { const A = LF.ARCHETYPES[s.world.type]; return { took: LF.clamp(0.3 + (A.yield || 0) * 1.2 + (s.flags.site_delta ? 0.12 : 0) - (s.flags.site_highland ? 0.05 : 0) + (LF.rand(s) - 0.5) * 0.3, 0.12, 0.7) }; },
  text: (s, c) => { const sow = s.flags.first_sow, bad = c.took < 0.3;
    return (sow === 'all' ? `Every plot was sown. ${frac(c.took)} came up green. The rest are the colour of old paper, with bare roots.` + (bad ? ' There is no seed left to try again with.' : '')
      : sow === 'half' ? `Of the half you sowed, ${frac(c.took).toLowerCase()} came up green. The rest are the colour of old paper. The sealed lockers are still sealed.`
      : `Twelve trial squares. ${c.took < 0.3 ? 'Two' : c.took < 0.5 ? 'Four' : 'Seven'} are green, and ${N(s, 'botanist')} can tell you what was done differently in each. There is not a meal in the lot of them.`)
      + `\n\nWhat is standing is ready to cut.`; },
  choices: [
    { label: 'Bring it all in for the stores', hint: 'good', info: [['yield', 'Food now']],
      out: { text: (s, c) => s.flags.first_sow === 'trial' ? 'It fills two sacks. People come to look at the sacks.' : 'It is cut in three days, by everyone, and carried in on shoulders.',
        fx: (s, c) => ({ food: Math.round({ all: 1100, half: 550, trial: 90 }[s.flags.first_sow] * c.took / 10) * 10, morale: c.took >= 0.3 ? 3 : -2, flags: { sprouted: true } }) } },
    { label: 'Keep the best ears back for seed', note: 'The next sowing comes from plants that grew here, and it is nearly half the harvest that hungry people watch being hung up out of reach.', hint: 'unknown', info: [['yield', 'Better harvests later'], ['danger', 'Half of what there was to eat']],
      out: { text: 'The tallest, greenest ears are cut first and hung in the dry, with a lock on the shed. The rest goes to the stores, and the ladle shows it.',
        fx: (s, c) => ({ food: Math.round({ all: 1100, half: 550, trial: 90 }[s.flags.first_sow] * c.took * 0.55 / 10) * 10, yield: 0.03 + c.took * 0.08, morale: -2, flags: { sprouted: true, seed_grain: true, seed_local: true } }) } },
    { label: 'Sow the sealed seed where the green plots are', show: s => s.flags.first_sow !== 'all', note: 'The reserve goes into the ground that worked.', info: [['time', 'Another season'], ['danger', 'The reserve']],
      test: { base: 38, mods: [If((s, c) => c.took >= 0.42, 16, 'Good ground found'), If(s => s.flags.first_sow === 'trial', 12, 'The trial notebooks'), R('botanist', 10)] },
      ok: { text: 'The second planting comes up thicker than the first, all of it in plots that have grown a crop before.', fx: (s, c) => ({ food: 500, yield: 0.1, morale: 4, flags: { sprouted: true, seed_grain: false, resown: true } }) },
      bad: { text: 'The green plots were green for a reason nobody found in time. The second sowing yellows within the month, and the lockers are empty.', fx: { food: 80, morale: -5, flags: { sprouted: true, seed_grain: false } } } },
  ] });

/* ================= THE YEAR'S WORK ================= */
const yearNote = s => { const y = s.yearMark; if (!y) return '';
  const fd = foodDays(s), lostNow = Object.values(s.machines).filter(m => m.lost).length;
  const res = y.focus === 'fields' ? (fd > y.fd + 20 ? 'The bins are fuller for it.' : fd < y.fd - 20 ? 'The bins are no fuller. There are more mouths now, and it was a poor year for anything that grows.' : 'It kept the bins about level.')
    : y.focus === 'works' ? (lostNow > y.lost ? 'It was not enough to save every machine.' : 'Every machine that ran then still runs.')
    : (s.survey > y.survey + 40 ? 'The map on the mess hall wall is twice the size it was.' : 'The map grew, though less than was hoped.');
  return `\n\nLast year the weight went on ${LF.FOCUS[y.focus]}. ${res}`; };
const yearOpt = (key, label, note, yields, tags) => ({ key, label, note: s => (s.yearMark && s.yearMark.focus === key ? 'You chose this last year too. ' : '') + note, hint: 'unknown', info: [['time', 'All year'], ['yield', yields]],
  out: { text: s => ({ fields: 'The rosters are redrawn with the field crews at the top. The workshop loses two of its best to the hoe.', works: 'The rosters are redrawn around the workshop and the ship\'s machines. The furthest plots are left to themselves.', frontier: 'Two crews are given boots, packs and a bearing for the season. The camp feels emptier, and the map on the mess hall wall begins to grow.' })[key],
    fx: s => ({ focus: key, survey: key === 'frontier' ? 36 : 0, sched: key === 'frontier' && !s.flags.ore_found ? [['plan.prospect', 10, 25]] : null, do: s2 => { s2.yearMark = { d: s2.day, focus: key, fd: foodDays(s2), lost: Object.values(s2.machines).filter(m => m.lost).length, survey: s2.survey, pop: s2.pop }; } }) } });
add({ id: 'plan.year', arc: 'plan', max: 2, tone: 'council', title: 'The Year\'s Work', w: 5, repeat: 95,
  when: s => s.day >= 100 && LF.date(s.day).season === 0,
  text: s => `Thaw, and the mud is back. So is the argument about where the year's labour should go. There are only so many hands, and ${N(s, 'quartermaster')} wants an answer before the rosters are written.${yearNote(s)}`,
  choices: [
    yearOpt('fields', 'The fields', 'More food, and the machines get whatever hands are left over.', 'Food'),
    yearOpt('works', 'The workshops and the ship', 'The machines last longer and the yard fills up, but the harvests will be thinner.', 'Machines and materials'),
    yearOpt('frontier', 'The country beyond the wire', 'Crews spend the season mapping, so you find what is out there sooner.', 'Discoveries'),
    { key: 'fields', label: 'The fields, on twelve-hour shifts with no rest day', dark: true, note: 'It brings in more food than any roster has, with the watch at the field edge to see that the shifts are kept.', hint: 'unknown', info: [['time', 'All year'], ['yield', 'Food, and more of it'], ['danger', 'The people it is got out of']],
      out: { text: 'The rest day is struck off the roster and the shift bell is moved two hours each way. The watch walks the field edge with a list. The bins fill faster than they ever have. By Seedfall two people have been buried from the rows.',
        fx: s => ({ focus: 'fields', food: 420, pop: -2, morale: -5, stain: ['drive', 1], do: s2 => { s2.yearMark = { d: s2.day, focus: 'fields', fd: foodDays(s2), lost: Object.values(s2.machines).filter(m => m.lost).length, survey: s2.survey, pop: s2.pop }; } }) } },
  ] });

/* ================= THE SLEEPERS ================= */
const wake = (s, want) => Math.min(want, s.sleepers);
add({ id: 'plan.sleepers', arc: 'plan', tone: 'council', title: 'The Next Shuttle', w: s => (foodDays(s) > 110 ? 1.2 : 0.3) * (LF.inOrbit(s).length ? 4 : 1), repeat: 110,
  when: s => s.day >= (LF.inOrbit(s).length ? 40 : 75) && s.sleepers > 20 && !s.machines.lander.lost && s.machines.lander.hp > 18 && LF.canFly(s) && !s.flags.lander_grounded,
  text: s => { const w = s.flags.woken || 0;
    return `${s.sleepers} people are still asleep in orbit, and the lander is fit for the run. Each one who comes down is a pair of hands and a mouth.\n\n`
      + (LF.lean(s) ? (w ? 'The last people you woke have never seen a full plate here.' : 'The colony is on short rations as it is.') : foodDays(s) < 90 ? 'The stores would feel twenty more within the month.' : s.built.housing ? 'There are bunks waiting, and bread.' : w ? `The ${NUM[Math.min(10, w)] || w} loads already woken have settled in. The pods are crowded, and nobody has complained yet.` : 'There is food enough, for now.'); },
  choices: [
    { label: s => `Bring ${wake(s, 20)} down`, hint: 'unknown', req: s => LF.canFly(s), reqText: s => LF.flyWhy(s), info: s => [['people', 'More hands, more mouths']].concat(LF.inOrbit(s).length ? [['people', 'One officer down from orbit']] : [], [['danger', 'Hard on the lander'], ['danger', 'Every ladle is cut to feed them']]),
      out: { text: s => `${wake(s, 20)} sleepers wake to a sky they have never seen. By evening they have been told everything, twice, by everyone, and have seen the size of the ladle.`,
        fx: s => ({ fly: 1, pop: wake(s, 20), sleepers: -wake(s, 20), machine: { lander: -14 }, cap: { lander: -5 }, morale: 2, flags: { woken: (s.flags.woken || 0) + 1 } }) } },
    { label: 'Two runs, back to back', show: s => s.sleepers > 20, req: s => LF.canFly(s, 2), reqText: s => LF.flyWhy(s, 2), note: 'Twice the people, on a lander that was never meant for it.', info: [['people', 'Up to forty'], ['danger', 'Very hard on the lander']],
      test: { base: 52, mods: [R('pilot', 14), M('lander', 10)] },
      ok: { text: s => `Two flights in one window. ${wake(s, 40)} people on the ground by dark, and the lander ticking as it cools.`, fx: s => ({ fly: 2, pop: wake(s, 40), sleepers: -wake(s, 40), machine: { lander: -28 }, cap: { lander: -10 }, morale: 4, flags: { woken: (s.flags.woken || 0) + 2 } }) },
      bad: { text: 'The first flight is clean. The second comes back with a warning light nobody has seen before, and half its seats empty: the window closed.', fx: s => ({ fly: 2, pop: wake(s, 20), sleepers: -wake(s, 20), machine: { lander: -40 }, cap: { lander: -16 }, morale: -2, flags: { woken: (s.flags.woken || 0) + 1 } }) } },
    { label: 'Not this season', note: 'Sleepers eat nothing, and every season in the cold takes a few of them.', hint: 'unknown', info: [['yield', 'No new mouths'], ['danger', 'The pods that fail while they wait']],
      out: { text: 'The lander stays under its tarpaulin. Overhead, at dusk, the ship crosses the sky on time. Her cryo report for the season lists three more pods as no longer drawing power, with the names.', fx: { sleepers: -3 } } },
    { label: s => `Bring ${wake(s, 20)} down, and wake only the ones who can dig`, dark: true, req: s => LF.canFly(s), reqText: s => LF.flyWhy(s), note: 'The manifest gives every sleeper an age and a trade, and of the twenty pods the lander carries only the useful ones need be opened.', info: [['people', 'Hands, and fewer mouths'], ['danger', 'The ones left sealed on the pad']],
      out: { text: s => `${Nc(s, 'quartermaster')} goes down the manifest with a ruler. Twelve pods are opened on the pad. The others are stacked behind the lander on ground power, where their lights can be seen from the mess hall. Three of those lights are out before the season ends, and those pods are opened for their pumps.`,
        fx: s => { const n = wake(s, 20), up = Math.min(12, n), left = Math.max(0, n - up - 3);
          return { fly: 1, pop: up, sleepers: -n, machine: { lander: -14 }, cap: { lander: -5 }, morale: -2, parts: 3, stain: ['sorted', 1], flags: { woken: (s.flags.woken || 0) + 1 }, do: s2 => { s2.grounded = (s2.grounded || 0) + left; } }; } } },
  ] });

/* ================= THE ORE =================
   There is no survey crew any more: where the metal is was settled, as far as orbit could, by the report on
   arrival. If it was not close, somebody has to go and find it. */
const ORE_WHERE = { hills: 'the high ground', far: 'the interior' };
const oreTo = s => (s.world.report && s.world.report.features[0] && s.world.oreBody === 'far' ? s.world.report.features[0].name : ORE_WHERE[s.world.oreBody] || 'the high ground');
add({ id: 'plan.prospect', view: 'world', arc: 'plan', tone: 'council', title: 'Where the Metal Is', w: s => s.day > 90 ? 9 : 4, repeat: 60, gap: 0,
  when: s => !s.flags.ore_found && s.day >= 40 && !s.away.some(a => a.ret === 'ore'),
  text: s => { const r = s.world.report && s.world.report.ore, d = did(s, 'plan.prospect');
    return `${Nc(s, 'geologist')} has the orbital report pinned to the mess hall wall, one line circled: "${r ? r.text : 'Metal, somewhere.'}" Under it, in pencil: ${r ? r.conf : 50}%.\n\n`
      + (d && d.k === 'fly' && d.ok === false ? 'The last flight saw nothing worth landing for.' : d && d.k === 'wait' ? 'The smelter drawings have been waiting since the last time this was asked.' : 'Without ore there is no smelter, and without a smelter nothing after it gets built.'); },
  choices: [
    { key: 'send', label: s => `Send prospectors to ${oreTo(s)}`, hint: 'good', info: [['yield', 'An ore body, if it is there']],
      send: { n: 5, days: [32, 55], danger: 2, to: 'the high ground', ret: 'ore' }, show: s => s.world.oreBody !== 'far',
      out: { text: s => `Five go, with hammers, sample bags and a radio that works for the first day. ${Nc(s, 'geologist')} gives them the bearing twice.`, fx: {} } },
    { key: 'send', label: s => `Send a long party into ${oreTo(s)}`, hint: 'unknown', info: [['yield', 'An ore body, if it is there']],
      send: { n: 6, days: [50, 80], danger: 3, to: 'the interior', ret: 'ore' }, show: s => s.world.oreBody === 'far',
      out: { text: s => `Six go, with two months of food and a map that is mostly guesses. ${Nc(s, 'geologist')} walks them to the last marker.`, fx: {} } },
    { key: 'fly', label: 'Fly the lander along the ridges with a magnetometer', info: [['danger', 'Hard on the lander']],
      req: s => !s.machines.lander.lost && s.machines.lander.hp > 25, reqText: 'Needs a flightworthy lander',
      test: { base: 52, mods: [R('geologist', 12), R('pilot', 8), If(s => s.world.oreBody === 'far', -18, 'Far inland'), If(s => s.world.oreBody === 'near', 15, 'Close by')] },
      ok: { text: s => `Three passes, low enough to rattle the pods. On the third the needle swings and stays swung. ${Nc(s, 'geologist')} marks the spot with a smoke flare and is on the ground there within the month.`, fx: { machine: { lander: -8 }, survey: 12, flags: { ore_found: true }, poi: { key: 'plan.ore', kind: 'ore', name: 'Where the needle swung', dist: 'far', state: 'visited', danger: 1, known: 'Marked from the air with a smoke flare: a workable ore body, close to the surface.' }, chron: 'Ore was found from the air, and the colony began to plan a smelter.' } },
      bad: { text: 'The needle wanders and settles nowhere. The lander comes back with a cracked fairing and a better map of where the ore is not.', fx: { machine: { lander: -12 }, survey: 10 } } },
    { key: 'wait', label: 'Not yet. There is work closer to home', hint: 'unknown', out: { text: s => `The report goes back in the drawer. The smelter drawings go back in the drawer on top of it. ${Nc(s, 'engineer')} takes another part off the spares shelf that only a smelter could ever replace.`, fx: { parts: -2, morale: -1 } } },
    { key: 'lockup', label: 'Send the lock-up, with hammers and a promise', dark: true, show: s => s.day >= 60, note: 'They get a bearing and a clean sheet if they come back with ore, and no crew is taken off the fields.', info: [['yield', 'An ore body, if it is there'], ['danger', 'Four people nobody will ask after']],
      test: { base: 50, mods: [R('geologist', 10), If(s => s.world.oreBody === 'far', -14, 'Far inland'), If(s => s.world.oreBody === 'near', 15, 'Close by')] },
      ok: { text: s => `Four go out with a week of meal between them. Two come back, thin, with a sample bag that ${N(s, 'geologist')} says is good ore. They are given their clean sheets, and are not asked where the other two are.`,
        fx: { pop: -2, flags: { ore_found: true }, stain: ['expend', 1], poi: { key: 'plan.ore', kind: 'ore', name: 'The prisoners\' ore', dist: 'far', state: 'visited', danger: 3, known: 'Good ore, by the sample bag two of four prisoners carried home. Nobody asked them where the other two are.' }, chron: 'Ore was found by four prisoners sent out to look for it. Two came back.' } },
      bad: { text: 'Four go out with a week of meal between them. Nobody comes back. A month later the watch finds one of the hammers at the wire.', fx: { pop: -4, morale: -1, survey: 8, stain: ['expend', 2] } } },
  ] });

/* ================= WATER ================= */
add({ id: 'plan.water', arc: 'plan', tone: 'council', title: 'Every Drop Twice', w: 4, repeat: 140, gap: 0,
  when: s => !s.built.wells && LF.down(s, 'reclaimer') && s.machines.reclaimer.hp < 62 && s.day >= 50,
  text: s => `The reclaimer ${s.machines.reclaimer.hp < 35 ? 'is failing' : 'is wearing out'}, and ${N(s, 'engineer')} wants to know how hard to run it. "Every litre you drink's been through that loop a hundred times. I can run her hard, and she'll go sooner. Ease off, and there's less water. Your call."`
    + (s.project === 'wells' ? `\n\nThe wells are going up, but they will not be ready in time.` : ''),
  choices: [
    { label: 'Ration water. Two litres a head', hint: 'unknown', info: [['yield', 'The reclaimer lasts longer'], ['danger', 'The crews who sweat it out by noon']],
      out: { text: 'The taps are fitted with timers. People wash in turns and drink in sips, and the reclaimer\'s note drops half a tone. Two litres is not enough for someone digging in the open. A field hand goes down in the rows in the second week and does not get up.', fx: { machine: { reclaimer: 8 }, pop: -1, morale: -4, flags: { water_ration: true } } } },
    { label: s => s.world.truth.water > 20 ? 'Haul it from open water, and the lock-up drinks it first' : 'Dig a seep, and the lock-up drinks from it first', dark: true, note: 'Nobody knows what is in the water here, and boiling everything the colony drinks would take more fuel than there is.', hint: 'unknown', info: [['yield', 'The reclaimer rested, and the water known'], ['danger', 'Whoever is in the lock-up']],
      out: { text: s => (s.world.truth.water > 20 ? 'A line of people with jerrycans, every morning, to the water and back.' : 'Three days of digging finds a seep that gives a few buckets an hour, hauled up by hand all day.') + ' For the first month it goes to the lock-up unboiled and the clinic keeps a chart. One of the four is dead of his gut by the end of it. After that the colony knows how long to boil, and the reclaimer gets a rest.', fx: s => ({ machine: { reclaimer: 9 }, pop: -1, progress: -0.1, survey: s.world.truth.water > 20 ? 0 : 6, stain: ['taster', 1] }) } },
    { label: 'Run it hard and fix it when it breaks', hint: 'unknown', info: [['yield', 'Nobody goes thirsty'], ['danger', 'The reclaimer, and whoever is alive when it stops']],
      out: { text: s => `${Nc(s, 'engineer')} opens the valves. Nobody goes thirsty this season. ${Nc(s, 'engineer')} writes a date in the service log and underlines it.`, fx: { machine: { reclaimer: -6 }, cap: { reclaimer: -3 }, morale: 2 } } },
    { label: 'Two litres for those who work, one for those who do not', dark: true, hint: 'unknown', info: [['yield', 'The reclaimer lasts longest'], ['danger', 'The old, the sick and the small']],
      out: { text: 'The taps get two keys. The crews drink. In the long pods the old and the sick are given a cup at each end of the day. Two of them are dead of their kidneys before the season turns. The reclaimer runs better than it has in a year.',
        fx: { machine: { reclaimer: 14 }, pop: -2, morale: -4, flags: { water_ration: true, water_by_work: true }, stain: ['tap', 1] } } },
  ] });

/* ================= WHO IS HOUSED FIRST ================= */
add({ id: 'plan.housed', view: 'people', arc: 'plan', tone: 'council', title: 'Keys', w: 8, gap: 0,
  when: s => !!s.built.housing && s.day - s.built.housing < 60 && s.pop > 50,
  text: s => `The first street is finished and there are ${Math.min(40, Math.round(s.pop / 3))} doors. There are ${s.pop} people. ${Nc(s, 'quartermaster')} has the keys in a biscuit tin and is not going to hand them out without being told how.`
    + (s.flags.committee ? '\n\nThe committee has several views.' : s.flags.council ? '\n\nThe Council has voted three times and tied three times.' : ''),
  choices: [
    { label: 'Families with children first', hint: 'unknown', info: [['yield', 'Morale'], ['danger', 'The crews stay in the pods']], out: { text: 'The first keys go to the parents of the youngest. Somebody carries a cot down the street at dusk, and people stop to watch. The field crews watch too, from the pod doors, and go back in.', fx: s => { const p = h.anyNamed(s, ['quartermaster']); return { morale: 4, yield: -0.01, flags: { housed: 'families' }, mark: p ? [p.id, 'slighted', 'worked every shift for the first street and was not given a door on it'] : null }; } } },
    { label: 'Whoever works the hardest shifts', note: 'That means the field crews and the night watch, and it means the clinic\'s patients and the infants stay in the pods.', hint: 'unknown', info: [['yield', 'A little more from the fields'], ['danger', 'The ones in the pods who cannot work']],
      out: { text: 'The rosters decide. The field crews move in first and sleep through the night for the first time since landfall. Parents carry their children past the lit windows to the pods. A man with a bad chest who was moved out of the clinic to make room does not last the season there.', fx: { yield: 0.03, pop: -1, morale: -1, flags: { housed: 'workers' } } } },
    { label: 'By lot. Every name in the tin', hint: 'unknown', info: [['yield', 'Nobody can argue with it'], ['danger', 'Whoever the draw leaves in the pods']], out: { text: 'Names on scraps of paper, drawn by the youngest child in the colony. Nobody argues with the draw. It leaves the oldest woman in the colony in a cargo pod for another season, and she does not see the end of it.', fx: { morale: 2, pop: -1, tension: -6, flags: { housed: 'lot' } } } },
    { label: 'The officers and their crews first', dark: true, note: 'They have been sleeping in the pods longest, they make the decisions, and people who sleep decide better.', hint: 'unknown', info: [['yield', 'Officers who are rested, and grateful'], ['danger', 'Everyone who watches them move in']],
      out: { text: s => `The officers move in. ${Nc(s, 'quartermaster')} hands out the keys in the mess hall in front of everyone, which does not help. The officers are easier to work with by the end of the month. The crews who built the street watched its doors close from the pods.`, fx: s => { const p = h.anyNamed(s, ['quartermaster', 'security', 'engineer']); return { morale: -5, flags: { housed: 'officers' }, stain: ['served_first', 1], mark: p ? [p.id, 'grudge', 'stayed in the pods while the officers moved into the new street'] : null, do: s2 => { for (const q of s2.people) if (q.alive && q.role && q.loyal !== undefined) q.loyal = LF.clamp(q.loyal + 8, 0, 100); } }; } } },
    { label: 'A door for everyone who has stood with you', dark: true, note: 'The keys are the first thing the colony has had to give that anybody wants, and they can buy loyalty.', hint: 'unknown', info: [['yield', 'The officers and the watch, bought'], ['danger', 'Everyone who was not']],
      out: { text: s => `${Nc(s, 'quartermaster')} is given a list instead of a rule. Everyone on it has done you a service, and everyone in the mess hall can read. The officers and the watch move into the street. Everyone else stays in the pods and knows why.`,
        fx: { morale: -4, flags: { housed: 'officers', housed_bought: true }, stain: ['keys', 1], do: s => { for (const p of s.people) if (p.alive && p.loyal !== undefined) p.loyal = LF.clamp(p.loyal + (p.role ? 16 : -8), 0, 100); } } } },
  ] });

/* ================= A SURPLUS ================= */
const friend = s => s.factors.find(f => (f.kind === 'natives' || f.kind === 'humans') && f.stage >= 2 && !f.res && f.accord >= 5);
add({ id: 'plan.surplus', arc: 'plan', max: 1, tone: 'council', title: 'Full Bins', w: 3, repeat: 220, gap: 0,
  when: s => s.day >= 200 && foodDays(s) > 200 && !LF.lean(s) && LF.foodProd(s) >= LF.foodCons(s),
  text: s => `For the first time since landfall there is more in the bins than the colony can eat before it spoils. ${Nc(s, 'quartermaster')} has walked the stores twice, counting, and does not quite believe it.\n\n`
    + (did(s, 'state.famine') ? 'People still remember the bottom of the bins. ' : '') + 'Everybody has an idea what to do with it.',
  choices: [
    { label: 'A harvest feast. Nobody works for two days', hint: 'unknown', cost: { food: 300 }, info: [['yield', 'Morale'], ['danger', 'A week of food, eaten in two nights']],
      out: { text: 'Long tables down the middle of the street, every lamp the colony owns, and a dance nobody knows the steps to. The music goes on until the lamps run dry.', fx: { morale: 10, tension: -12, progress: -0.05, chron: 'The colony held its first harvest feast.' } } },
    { label: s => { const f = friend(s); return f ? `Send a cart of it to ${f.name}` : 'Send some to the neighbours'; }, show: s => !!friend(s), hint: 'good', cost: { food: 400 }, info: [['yield', 'Goodwill']],
      out: { text: s => `The cart goes out under a flag of white cloth. It comes back empty, with something tied to the shaft that nobody here could have made.`, fx: s => friend(s) ? { fops: [{ id: friend(s).id, accord: 16, threat: -6 }], morale: 2 } : { morale: 2 } } },
    { label: 'Seal a reserve against the next bad year', hint: 'unknown', cost: { food: 500 }, info: [['yield', 'Food put by'], ['danger', 'People who have been hungry watch it locked away']],
      out: { text: s => `${Nc(s, 'quartermaster')} has the reserve sealed in cargo pods with a lead tag on each, and the tags signed by three people. It is opened only by a vote. The people who were thinnest last season stand and watch the pods being wired shut.`, fx: { morale: -3, flags: { reserve: true } } } },
  ] });

/* ================= THE HARVEST =================
   The fields come into the store only with this card (core.js holds the cut crop in s.reap until it is dealt), so
   the food on the stock bar and the card that brought it arrive together. Costs no month (LF.deal). */
const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1);
const mo = (s, n) => n / Math.max(1, LF.foodCons(s) * LF.MONTH);
const sizeWord = (s, n) => { const m = mo(s, n); return m >= 6 ? 'a big one' : m >= 3 ? 'a fair one' : m >= 1.2 ? 'a thin one' : 'barely worth the name'; };
add({ id: 'plan.harvest', arc: 'plan', tone: 'council', chain: true, title: 'The Harvest', w: 0, gap: 0, view: 'colony',
  setup: s => { const n = Math.round(s.reap || 0); s.reap = 0; s.flags.harvests = (s.flags.harvests || 0) + 1;
    return { n, m: Math.max(1, Math.round(mo(s, n))), q: LF.SEASONS[(LF.date(s.day - 1).season)], fd: Math.round(foodDays(s) / LF.MONTH), tight: LF.lean(s), first: !s.flags.reaped }; },
  text: (s, c) => `${c.first ? LF.firstCrop(s) : `The ${c.q.toLowerCase()} harvest`} is cut and on the threshing floor: ${c.n.toLocaleString('en')}, about ${LF.monthsWord(c.m)} of eating. ${cap1(sizeWord(s, c.n))}. The store held ${c.fd < 1 ? 'almost nothing' : `about ${LF.monthsWord(c.fd)}`} before it.${c.first ? LF.firstCropTail(s) : ''}\n\n`
    + (c.tight ? `${Nc(s, 'quartermaster')} wants it all locked up. The people who cut it have been on short ladles all season and watched it go past them on the carts.` : `${Nc(s, 'quartermaster')} has the scales out. The cutters are sitting on the sacks, waiting to hear what they get.`),
  choices: [
    { label: 'Into the store, all of it', note: 'Every grain is counted and locked away. The crews who cut it get the same ladle as yesterday.', hint: 'unknown', info: [['yield', 'The whole harvest'], ['danger', 'The cutters']],
      out: { text: (s, c) => `It goes in by the sack, and each sack is counted twice. The cutters line up for the same ladle as yesterday.${c.tight ? ' Somebody spits on the store door that night.' : ''}`,
        fx: (s, c) => ({ food: c.n, morale: c.tight ? -3 : -1, flags: { reaped: s.day } }) } },
    { label: 'A harvest supper, then the store', note: 'One night of full plates for everyone. It eats into what was cut.', hint: 'good', info: [['yield', 'Morale'], ['danger', 'The store, by a fifth of the harvest']],
      out: { text: 'Long tables on the threshing floor and the ovens going all night. People eat until they are sick, and nobody minds. The store gets what is left.',
        fx: (s, c) => ({ food: Math.round(c.n * 0.8), morale: 5, tension: -6, flags: { reaped: s.day } }) } },
    { label: 'Keep the best back for seed', note: 'A quarter of it is hung up to dry for the next sowing. People who are hungry now watch it hang.', hint: 'unknown', info: [['yield', 'Better harvests'], ['danger', 'A quarter of the harvest, out of reach']],
      out: { text: 'The fattest heads are bundled and hung from the rafters of the seed shed, out of reach. The children are told what happens to anyone who climbs up there.',
        fx: (s, c) => ({ food: Math.round(c.n * 0.75), yield: 0.03, morale: -2, flags: { reaped: s.day } }) } },
    { label: 'Everyone threshes, the sick and the old included. No work, no share', dark: true, note: 'Nothing rots on the floor and nothing is wasted on anyone who sits it out. The clinic empties into the barn.', hint: 'unknown', info: [['yield', 'More of it saved'], ['danger', 'The sick, the old and the slow']],
      out: { text: (s, c) => `The clinic is emptied onto the threshing floor and the ones who cannot stand are given flails to use sitting down. Everything is in by the third night, and more of it than anyone expected. ${c.n > 1500 ? 'Two of the old' : 'One of the old'} did not make it to the third night, and their shares went back in the sack.`,
        fx: (s, c) => ({ food: Math.round(c.n * 1.15), pop: c.n > 1500 ? -2 : -1, morale: -3, stain: ['threshed', 1], flags: { reaped: s.day } }) } },
  ] });

/* ================= THE STANDING ORDER (2026-11-17) =================
   A repeating card answered the same way twice running (LF.habit) can be made a standing order: from then on it is
   carried out in the log and never dealt (core.js byRote). Costs no month. */
add({ id: 'order.standing', urgent: true, arc: 'state', tone: 'council', title: 'The Standing Order', repeat: 1, view: 'colony',
  when: s => !!LF.habitDue(s),
  setup: s => { const id = LF.habitDue(s), st = LF.byId[id], hb = s.habit[id]; hb.asked = s.day; const ch = st.choices[hb.i];
    return { id, i: hb.i, card: st.title, label: (typeof ch.label === 'function' ? ch.label(s, {}) : ch.label).replace(/\.$/, '') }; },
  text: (s, c) => `${c.card} has come to you twice now, and twice the answer has been the same: "${c.label}." The duty officer wants to know whether to wake you for it a third time.\n\nA standing order is carried out the same way every time, whatever else is going on that month, until it cannot be.`,
  choices: [
    { label: 'Make it the standing order', note: 'It is done that way from now on without coming to you, in a year when it suits and in a year when it does not.', hint: 'unknown', info: [['yield', 'One less thing brought to you'], ['danger', 'The year it should have been decided differently']],
      out: { text: (s, c) => `It is written into the duty book in one line, and initialled. The next time, the colony will read about it afterwards.`, fx: (s, c) => ({ do: s2 => { s2.standing = s2.standing || {}; s2.standing[c.id] = c.i; } }) } },
    { label: 'No. Bring it to me every time', note: 'Every one of them comes to the desk, and is decided on the day.', hint: 'unknown', info: [['danger', 'Your own months']],
      out: { text: 'The duty officer closes the book. The next one will come to you, the same as the last.', fx: {} } },
  ] });
LF.TAGS['order.standing'] = ['order', 'cautious'];

/* ================= RATIONS EASED ================= */
add({ id: 'plan.ladle', urgent: true, max: 2, arc: 'state', tone: 'council', title: 'Full Ladles', repeat: 45, w: 0.8,
  when: s => LF.lean(s) && foodDays(s) > 135,
  text: s => { const r = did(s, 'pol.rations'), f = did(s, 'state.famine');
    return `The bins are filling again. ${Nc(s, 'quartermaster')} thinks the colony could go back to full rations, and says so carefully.\n\n`
      + (s.flags.ration_by_work ? 'The people who got the thin ladle while the field crews got the heavy one have been counting the days.' : r && r.i === 0 ? 'You have eaten three-quarter rations in the mess hall with everyone else since the day you ordered them.' : f && f.i === 2 ? 'Nobody has forgotten the scales coming out.' : 'People have been hungry for a long time, and patient about it.'); },
  choices: [
    { label: 'Back to full rations', hint: 'unknown', info: [['yield', 'Morale'], ['danger', 'The bins, in the next bad season']], out: { text: 'The heavy ladle comes back. The mess hall is loud for the first time in months, and the line on the stores slate turns down again.', fx: { rations: 'normal', morale: 5, flags: { ration_by_work: false } } } },
    { label: 'One feast, then full rations', note: 'Nobody works for a day.', hint: 'good', info: [['yield', 'Morale']], cost: { food: 150 }, out: { text: 'Somebody finds a fiddle that came forty light-years in a sock, and the dancing goes on past midnight.', fx: { rations: 'normal', morale: 10, flags: { ration_by_work: false } } } },
    { label: 'Full ladles for the crews. Everyone else stays short a while yet', dark: true, note: 'The bins go on filling against the next bad season, and the people who fill them are kept strong and kept quiet.', hint: 'unknown', info: [['yield', 'Fuller bins, stronger crews'], ['danger', 'Everyone who is not on a crew']], out: { text: 'The heavy ladle comes back at one end of the mess hall. Everyone can see the bins are full, and everyone at the other end knows who kept their ladle short.', fx: { morale: -3, food: 80, flags: { ration_by_work: true }, stain: ['ladle', 1] } } },
  ] });

/* ================= AFTERMATHS ================= */
const wasT = s => (s.cur && s.cur.ctx && s.cur.ctx.was) || (s.last && s.last.title) || 'it';
/* The thing an aftermath is about. s.last is overwritten by the aftermath's own choice, and the card's text is drawn
   again for the result, so the card keeps the factor's id from the moment it fires (ctx.fid, set below). A card saved
   before that existed falls back to whatever the colony dealt with most recently. */
const lastF = s => { const id = (s.cur && s.cur.ctx && s.cur.ctx.fid) || (s.last && s.last.fid), f = id && s.factors.find(x => x.id === id);
  return f || (s.cur && s.cur.phase === 'result' ? s.factors.filter(x => x.kind !== 'land' && x.stage >= 1).sort((a, b) => b.last - a.last)[0] : null) || null; };
const pl = f => !(LF.KINDS[f.kind] || {}).mass;
const living = s => { const f = lastF(s); return !!f && ['fauna', 'natives', 'humans'].includes(f.kind); };   // something with wounded and young
add({ id: 'aft.blame', arc: 'after', tone: 'pressure', chain: true, repeat: 50, title: 'Whose Order',
  text: s => `Before the day is out, "${wasT(s)}" is being argued over in the mess hall, and the argument has come round to who gave the word.\n\n${Nc(s, 'chaplain')} is at your door. "They're not angry. Not yet. But somebody's got to tell them, and it had better be you."`,
  choices: [
    { label: 'Stand up in the mess hall. It was your order', hint: 'unknown', info: [['danger', 'They will know whose order it was']], out: { text: 'You say it plainly and do not explain. Nobody answers, though a few people nod. Afterwards one of them stops bringing you anything but what is asked for.', fx: s => { const p = h.anyNamed(s); return { morale: 3, tension: -6, mark: p ? [p.id, 'grudge', `heard you say "${wasT(s)}" was your order, and has not forgiven the order`] : null }; } } },
    { label: 'Say nothing, and have the watch break up the talk', dark: true, note: 'An argument that is not allowed to gather in one room does not become a meeting.', info: [['yield', 'It blows over'], ['danger', 'People learn what may not be said']], test: { base: 60, mods: [If(s => s.morale >= 50, 10, 'A colony in good heart'), R('security', 8)] },
      ok: { text: 'The watch finds reasons to be in the mess hall at the evening meal for the rest of the month, and to send the loudest tables to early shifts. By the next month there is something else to talk about.', fx: { tension: -6, stain: ['hushed', 1] } },
      bad: { text: 'The watch sends the loudest table to an early shift, and the table does not go. Everyone takes your silence, and the watch at the door, to mean what it does mean.', fx: s => { const p = h.anyNamed(s); return { morale: -6, mark: p ? [p.id, 'grudge', `was there when "${wasT(s)}" went wrong, and heard nothing from you after`] : null }; } } },
    { label: 'Hold an inquiry. Find out who chose badly', dark: true, note: 'It was your order, and the inquiry will find a decision made by somebody below you.', hint: 'unknown', info: [['yield', 'The anger goes somewhere else'], ['danger', 'Whoever it names']],
      out: { text: s => { const p = P(s, 'security'); return `Three evenings of testimony. The finding names a decision made on the ground${p ? `, and ${p.name} signs it without looking up` : ''}.`; }, fx: s => { const p = h.anyNamed(s); return { morale: 3, tension: -12, stain: ['inquiry', 1], mark: p ? [p.id, 'slighted', 'was named in an inquiry that should have named you'] : null }; } } },
  ] });
add({ id: 'aft.press', view: 'world', arc: 'after', tone: 'pressure', chain: true, repeat: 50, title: 'While They Are Reeling',
  when: s => !!lastF(s),
  text: s => { const f = lastF(s); return `${f.Name} ${pl(f) ? 'are' : 'is'} hurt and pulling back. ${Nc(s, 'security')} has people armed and standing at the wire, and wants to follow now, tonight, before ${pl(f) ? 'they recover' : 'it recovers'}.`; },
  choices: [
    { label: s => living(s) ? 'Follow, and finish it. The wounded and the young as well' : 'Follow, and finish it', dark: true, note: s => living(s) ? 'What is left out there tonight is whatever could not get away fast.' : 'The watch goes out tired, in the dark, onto ground it does not know.', info: [['yield', 'Nothing comes from that way again'], ['danger', 'A fight in the dark']], test: { base: 56, mods: [R('security', 12), If(s => s.morale >= 50, 6, 'People believe in it')] },
      ok: { text: s => `They go out fast and come back at dawn, filthy, all of them.${living(s) ? ' They found what could not run, and left none of it.' : ''} It will be a long time before anything comes from that direction again.`, fx: s => ({ fops: [{ id: s.last.fid, threat: -26, harm: 32, accord: -25, kills: living(s) ? 6 : 0 }], morale: 2, stain: living(s) ? ['finished', 1] : null }) },
      bad: { text: 'It was a trap. Not everyone who went out comes back, and the ground taken in the day is lost again by morning.', fx: s => ({ fops: [{ id: s.last.fid, threat: 14, kills: 2 }], pop: -2, morale: -4 }) } },
    { label: 'Hold what was won', hint: 'unknown', info: [['danger', 'They recover, and they come back']], out: { text: s => `The wire is doubled and the watch is doubled, and nobody goes out past it. The people who buried friends today wanted to go, and ${N(s, 'security')} has to tell them no. Whatever was hurt out there has the night to itself.`, fx: s => ({ morale: -3, fops: [{ id: s.last.fid, threat: 4 }] }) } },
    { label: 'Leave something at the line instead', note: 'You make an offer while you have the upper hand.', show: s => { const f = lastF(s); return !!f && f.kind !== 'plague' && f.kind !== 'ruin'; },
      out: { text: 'Food, set out in the open where the fighting was, and nobody standing over it. It is gone by morning.', fx: s => ({ food: -60, fops: [{ id: s.last.fid, accord: 12, threat: -3 }] }) } },
    { label: 'Send the ones who lost somebody today', dark: true, show: s => { const f = lastF(s); return !!f && (f.kind === 'natives' || f.kind === 'humans'); },
      note: 'They have asked to go, and they will be given no orders about what to do when they get there.', info: [['yield', 'It will not come again for a long time'], ['danger', 'What they do out there']],
      test: { base: 64, mods: [R('security', 8)] },
      ok: { text: 'Nine go out without packs. They are back the next evening and will not say what they did. Nothing comes from that direction for a very long time.',
        fx: s => ({ morale: -2, stain: ['reprisal', 2], fops: [{ id: s.last.fid, threat: -32, harm: 40, accord: -40, kills: 20 }] }) },
      bad: { text: 'Nine go out without packs, and they do not stop where a watch officer would have stopped them. Four come back. What they did before they were caught is known on the other side of the line by morning.',
        fx: s => ({ pop: -5, morale: -6, stain: ['reprisal', 2], fops: [{ id: s.last.fid, threat: 18, accord: -60, kills: 8 }] }) } },
  ] });
const GIFT = { natives: 'a bundle wrapped in something woven, tied with a cord of many knots', humans: 'a crate, nailed shut, with a note in a hand nobody knows', fauna: 'a fresh kill, laid out whole and untouched', flora: 'a ring of new growth, exactly where the stakes were driven' };
add({ id: 'aft.gift', view: 'world', arc: 'after', tone: 'opportunity', chain: true, repeat: 50, title: 'Something Left at the Wire',
  when: s => !!lastF(s) && !!GIFT[lastF(s).kind],
  text: s => { const f = lastF(s); return `The morning after, the watch finds ${GIFT[f.kind]}. It was not there at midnight.\n\nHalf the camp has walked past it by breakfast, and it has not been touched.`; },
  choices: [
    { label: 'Take it in, openly', hint: 'unknown', info: [['yield', 'Goodwill'], ['danger', 'Nobody has looked inside']], test: { base: 78, mods: [R('xenobio', 6)] },
      ok: { text: 'It is carried through the camp in daylight, where anyone watching from outside the wire can see. What is in it is shared out at the evening meal.', fx: s => ({ food: 100, fops: [{ id: s.last.fid, accord: 10 }] }) },
      bad: { text: 'It is carried through the camp in daylight and opened in the mess hall. The two who opened it are in the clinic by night, and one of them does not come out. Nobody can say whether it was meant.', fx: s => ({ pop: -1, morale: -4, fops: [{ id: s.last.fid, accord: 4, insight: 8 }] }) } },
    { label: 'Leave something of ours in its place', cost: { mat: 10 }, hint: 'unknown', info: [['yield', 'Goodwill'], ['danger', 'Steel, given to something that has fought you']], out: { text: 'A coil of bright ship wire and a steel knife, set down on the same spot. By the next morning they are gone, and the grass is pressed flat where something sat a long while.', fx: s => ({ fops: [{ id: s.last.fid, accord: 17, insight: 4 }] }) } },
    { label: 'Have someone from the lock-up handle it first, outside the wire', dark: true, note: 'Nobody with a trade goes near it until it is known to be what it looks like.', hint: 'unknown', info: [['yield', 'What it is, safely'], ['danger', 'Whoever opens it, and how it looks from the hills']], out: { text: s => `A prisoner is walked out to it and told to handle all of it, and to taste whatever in it might be food, while ${N(s, 'xenobio')} takes notes from the wire. Nothing is wrong with it. All of that is done in full view of the hills.`, fx: s => ({ food: 60, fops: [{ id: s.last.fid, insight: 16, accord: -8 }], stain: ['expend', 1] }) } },
    { label: 'Leave it where it is, and put rifles in the grass', dark: true, show: s => { const f = lastF(s); return !!f && (f.kind === 'natives' || f.kind === 'humans'); },
      note: 'Whoever left it will come back unarmed to see whether it was taken.', info: [['yield', 'One of them, alive, and what they know'], ['danger', 'They came with a gift']],
      test: { base: 70, mods: [R('security', 10)] },
      ok: { text: s => `Two come back at dusk to look, with empty hands. One runs. The other is in the stores office by dark with a sack over the head, and by the end of the month ${N(s, 'security')} has a map out of them. Nothing is ever left at the wire again.`,
        fx: s => ({ stain: ['ambush', 2], fops: [{ id: s.last.fid, insight: 30, accord: -45, threat: -10, kills: 1 }] }) },
      bad: { text: 'Two come back at dusk to look, with empty hands. Somebody fires early. Both are dead in the grass beside their own gift, in plain view of wherever they came from.',
        fx: s => ({ morale: -3, stain: ['ambush', 2], fops: [{ id: s.last.fid, accord: -60, threat: 16, kills: 2 }] }) } },
  ] });
add({ id: 'aft.find', view: 'world', arc: 'after', tone: 'opportunity', chain: true, repeat: 50, title: 'The Thing That Does Not Fit',
  when: s => !!lastF(s),
  text: s => { const f = lastF(s); return `${Nc(s, 'xenobio')} is back within the hour, still holding the notebook. One observation about ${f.name} does not fit any of the rest. It could be an error. If it is not, half the notebook is wrong.\n\n"I can test it tonight, I can test it right now, but don't ask me how, honestly, don't, you'll say no, and I'd really like not to be told no."`; },
  choices: [
    { label: 'Test it tonight', info: [['danger', 'Unknown']], test: { base: 54, mods: [R('xenobio', 12)] },
      ok: { text: 'It was not an error. By morning there is a new page in the notebook, and three old ones crossed out.', fx: s => ({ fops: [{ id: s.last.fid, insight: 24, threat: -8 }] }) },
      bad: { text: 'It was not an error. The test drew attention, and the watch hears movement beyond the wire until dawn.', fx: s => ({ fops: [{ id: s.last.fid, insight: 6, threat: 10 }], morale: -2 }) } },
    { label: 'Write it down and tell the whole colony', hint: 'unknown', info: [['yield', 'Everyone knows what the officers know'], ['danger', 'Sleep, and nerve']], out: { text: 'It is read out at the evening meal. Everyone has a theory, and for the rest of the month people sit up arguing them when they should be asleep.', fx: s => ({ fops: [{ id: s.last.fid, insight: 10 }], morale: -2 }) } },
    { label: 'Keep it among the officers, and let the crews go on working where it matters', dark: true, note: 'If the page is right, some of the places people are posted are not safe, and moving them would say so.', hint: 'unknown', info: [['yield', 'The work is not interrupted'], ['danger', 'The crews who are not told']], out: { text: 'The page is copied once and locked away, and the rosters are left as they were. The officers watch those postings closely for a month and learn a good deal from what happens at them. One of the things that happens is a burial.', fx: s => ({ pop: -1, fops: [{ id: s.last.fid, insight: 20 }], stain: ['kept_quiet', 1] }) } },
    { label: 'Test it properly, with someone standing where it matters', dark: true, note: s => `${N(s, 'xenobio')} admits, quickly, that the test needs a person out past the wire, alone, after dark, who has not been told why.`, info: [['yield', 'The whole answer'], ['danger', 'Whoever is posted']],
      test: { base: 66, mods: [R('xenobio', 10)] },
      ok: { text: 'One of the watch is given a post two hundred metres out and told it is a listening picket. The instruments run all night. In the morning the picket walks in, cold and bored, and half the notebook is rewritten around what happened near that post.',
        fx: s => ({ stain: ['bait', 1], fops: [{ id: s.last.fid, insight: 36, threat: -10 }] }) },
      bad: { text: 'One of the watch is given a post two hundred metres out and told it is a listening picket. The instruments record all of it, including what happens to the picket, who does not come back. The notebook is rewritten around the recording.',
        fx: s => ({ pop: -1, morale: -3, stain: ['bait', 2], fops: [{ id: s.last.fid, insight: 26, threat: 6, kills: 1 }] }) } },
  ] });

/* Frame-specific aftermaths (LF.aftermath, AFT_KIND in council.js) */
add({ id: 'aft.beds', arc: 'after', view: 'colony', tone: 'pressure', chain: true, repeat: 60, title: 'Every Bed Taken',
  text: s => `"${wasT(s)}" went wrong. Nobody died of it, but the clinic is full and the overflow is on blankets in the corridor. ${Nc(s, 'physician')} says the Autodoc runs day and night until the corridor is empty, and is not asking.`,
  choices: [
    { label: 'Run the Autodoc until they are all on their feet', hint: 'unknown', info: [['yield', 'Everyone walks out'], ['danger', 'The Autodoc, and whoever needs it next year']], out: { text: 'It runs for nine days without stopping. Everyone walks out. The Autodoc makes a new noise when it starts up now, and the physician has started a list of what it should no longer be asked to do.', fx: { machine: { medbay: -9 }, cap: { medbay: -3 }, morale: 3 } } },
    { label: 'Stitch them by hand and send the walking ones back to their shifts', dark: true, note: 'The machine is saved and the work is not lost, and people who should be lying down are carrying loads.', hint: 'unknown', info: [['yield', 'The Autodoc spared, the shifts filled'], ['danger', 'The ones who open up again']], test: { base: 62, mods: [R('physician', 16)] },
      ok: { text: s => `${Nc(s, 'physician')} does not sleep for three days. Everyone who can stand is back on a shift by the fourth, stitched and strapped. They mend slowly, and crooked in a place or two.`, fx: { progress: 0.05, stain: ['worked', 1] } },
      bad: { text: 'Two of the ones sent back open up again on shift, a long way from the clinic. A wound that the Autodoc would have caught goes bad in the night, and then another.', fx: { pop: -2, morale: -4, stain: ['worked', 2] } } },
    { label: 'Beds for the ones who will work again. The rest go to the corridor', dark: true, note: s => `${Nc(s, 'physician')} can say tonight who will be back on a shift and who never will, and the Autodoc only has to run for the first list.`, info: [['yield', 'The Autodoc spared, the crews back soonest'], ['danger', 'The second list']],
      out: { text: s => `${Nc(s, 'physician')} writes two lists and will not read the second one out. The first list is on its feet in four days. The corridor is quiet by the end of the week, and two blankets are handed back to the stores.`,
        fx: { machine: { medbay: -2 }, pop: -2, morale: -3, progress: 0.05, stain: ['triage', 1], do: s => { const p = P(s, 'physician'); if (p && p.loyal !== undefined) p.loyal = LF.clamp(p.loyal - 12, 0, 100); } } } },
  ] });
add({ id: 'aft.carcass', arc: 'after', view: 'world', tone: 'pressure', chain: true, repeat: 80, title: 'The Carcass',
  when: s => !!lastF(s),
  setup: s => { const p = h.anyNamed(s, ['physician', 'xenobio']); return Object.assign({ fid: (s.last && s.last.fid) || null, was: (s.last && s.last.title) || null, hungry: h.foodDays(s) < 75 }, p ? { pid: p.id, name: p.name, first: p.first } : {}); },
  text: (s, c) => { const f = lastF(s), d = Math.round(h.foodDays(s)); return `One of ${f.name} is lying dead outside the wire where it fell, bigger close up than anyone expected. It is most of a tonne of meat, and nobody alive can say what is in it.\n\n${c.hungry ? `There ${(m => m < 1 ? 'is less than a month of food' : m === 1 ? 'is about a month of food' : `are about ${NUM[m] || m} months of food`)(Math.round(d / 10))} in the bins. The cooks went out to look at it before the watch did, and a queue has formed behind them.` : `The cooks have already been out to look at it.`} ${Nc(s, 'xenobio')} wants a month with it before anyone puts any of it in their mouth, and keeps going on about how much a carcass this fresh could tell them.`; },
  choices: [
    { label: 'Butcher it. Everyone eats tonight', hint: 'unknown', info: [['yield', 'Food'], ['danger', 'Whatever it carries, in everyone']], test: { base: 56, mods: [R('physician', 8), R('xenobio', 8)] },
      ok: { text: 'It smokes well and tastes of iron. For the first night since landing nobody leaves the table hungry. The children are told it is beef, and do not believe it.', fx: { food: 460, morale: 4 } },
      bad: { text: 'It smokes well. Two days later half the colony is doubled over, and the physician is cutting something long and white out of the first of the dead. The rest of the carcass goes on the fire.', fx: { food: 60, morale: -6, pop: -4 } } },
    { label: 'Give it to the lab. Nobody eats until it is cleared', hint: 'unknown', info: [['yield', 'Understanding, and safe meat late'], ['danger', 'A hungry month']],
      out: { text: (s, c) => `${Nc(s, 'xenobio')} takes it apart over a month, wearing a mask, and fills a notebook with where it is soft. A third of it is passed as safe, by which time it is good only for the stockpot. ${c.hungry ? 'Two of the weakest did not last the month.' : 'The kitchen stopped asking after the first week.'}`,
        fx: (s, c) => ({ food: 120, pop: c.hungry ? -2 : 0, morale: c.hungry ? -4 : 0, fops: c.fid ? [{ id: c.fid, insight: 22 }] : [] }) } },
    { label: (s, c) => c.name ? 'Draw straws. One person eats, and everyone waits' : 'One of the cooks eats, and everyone waits', dark: true, hint: 'unknown', info: [['yield', 'Food, if it is clean'], ['danger', 'Whoever draws it']], test: { base: 56, mods: [R('physician', 8), R('xenobio', 8)] },
      ok: { text: (s, c) => `${c.name || 'The youngest of the cooks'} draws the short straw, eats a plateful in front of the whole mess, and spends two days on a cot under observation. Nothing happens. The rest is in the smokehouse by the third morning.`,
        fx: (s, c) => ({ food: 460, morale: 1, stain: ['taster', 1], mark: c.pid ? [c.pid, 'taster', 'was made to eat first, in front of everyone, to see if it killed'] : null, do: s2 => { const p = c.pid && h.byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = Math.max(0, p.loyal - 12); } }) },
      bad: { text: (s, c) => `${c.name || 'The youngest of the cooks'} draws the short straw and eats a plateful in front of the whole mess. By midnight the fitting has started. By morning there is something moving under the skin of the forearm. The carcass is burned where it lies, and the cot with it.`,
        fx: (s, c) => ({ kill: c.pid ? [{ who: c.pid, cause: 'drew the short straw and ate first' }] : [], pop: c.pid ? 0 : -1, morale: -4, stain: ['taster', 1], fops: c.fid ? [{ id: c.fid, insight: 12 }] : [] }) } },
    { label: 'Burn it where it lies', hint: 'unknown', info: [['danger', 'The queue watches it burn']],
      out: { text: (s, c) => `The smoke goes up all afternoon and can be smelled for miles. ${c.hungry ? 'The queue stands and watches a tonne of meat turn to ash.' : 'Nobody argues.'}`, fx: (s, c) => ({ morale: c.hungry ? -5 : 0, fops: c.fid ? [{ id: c.fid, threat: -5 }] : [] }) } },
  ] });
add({ id: 'aft.cutting', arc: 'after', view: 'colony', tone: 'opportunity', chain: true, repeat: 80, title: 'A Cutting in a Jar',
  when: s => !!lastF(s),
  text: s => { const f = lastF(s); return `${Nc(s, 'xenobio')} has come back with a living cutting of ${f.name} in a sealed jar, and has been talking to ${N(s, 'botanist')} about it since. Something in its roots fixes nitrogen faster than anything on Earth.\n\n"It could feed the wheat, or it could eat the wheat, I don't know which yet, and I have to know which, give me one plot and I'll find out, no wait, give me a fence and one plot."`; },
  choices: [
    { label: 'Trial it in one plot, fenced off', info: [['yield', 'Maybe better harvests']], test: { base: 50, mods: [R('botanist', 12), R('xenobio', 10)] },
      ok: { text: 'The fenced plot comes up thicker and greener than any other. The roots stop at the fence.', fx: s => ({ yield: 0.07, fops: [{ id: s.last.fid, insight: 8 }] }) },
      bad: { text: 'By midsummer the roots are under the fence and into the next plot, and the wheat there is wilting.', fx: s => ({ yield: -0.05, fops: [{ id: s.last.fid, threat: 10 }] }) } },
    { label: 'Keep it sealed and study it', hint: 'unknown', info: [['yield', 'Understanding'], ['danger', 'A season the wheat does not get']], out: { text: 'The jar goes on a shelf in the lab, under a lamp, with a label and a lock. The plots it could have fed come up thin again, and the ladle is thinner for it.', fx: s => ({ food: -50, fops: [{ id: s.last.fid, insight: 12 }] }) } },
    { label: 'Burn it, and tell the field crews it was killing the wheat', dark: true, note: 'It was doing nothing of the kind, and crews who think you saved the wheat will not ask what the jar might have done for it.', hint: 'unknown', info: [['yield', 'Nothing to fear from it, and no blame'], ['danger', 'What it might have fed']], out: { text: s => `${Nc(s, 'xenobio')} watches it go into the furnace and is told what the crews are to hear. The crews are grateful. The plots come up thin again, and are put down to the weather.`, fx: s => ({ morale: 3, food: -40, stain: ['poison_lie', 1], fops: [{ id: s.last.fid, threat: -4 }] }) } },
    { label: 'Dig it into every plot. Hungry people cannot wait on a trial', note: 'It goes into every field at once, so if it turns on the wheat there is no second field to fall back on.', info: [['yield', 'A real harvest'], ['danger', 'All of the wheat']],
      test: { base: 46, mods: [R('botanist', 12), R('xenobio', 8)] },
      ok: { text: 'It is in every plot within the week. By midsummer the wheat is waist high and a darker green than wheat should be.', fx: s => ({ yield: 0.16, morale: 3, fops: [{ id: s.last.fid, insight: 6 }] }) },
      bad: { text: 'It is in every plot within the week. By midsummer it is the only thing in any of them. The wheat is yellow string under a mat of new growth, and the bins are all there is.', fx: s => ({ yield: -0.14, food: -220, morale: -6, fops: [{ id: s.last.fid, threat: 16 }] }) } },
  ] });
add({ id: 'aft.warm', arc: 'after', view: 'world', tone: 'opportunity', chain: true, repeat: 80, title: 'It Is Still Warm',
  when: s => !!lastF(s),
  setup: s => { const p = h.anyNamed(s, ['engineer', 'xenobio']); return Object.assign({ fid: (s.last && s.last.fid) || null, was: (s.last && s.last.title) || null }, p ? { pid: p.id, name: p.name, first: p.first } : {}); },
  text: s => { const f = lastF(s); return `Among what was brought back from ${f.name} is a palm-sized object that is warm to the touch and has not cooled in three days. ${Nc(s, 'engineer')} thinks it is a power source. ${Nc(s, 'xenobio')} thinks it's a heart, and has stopped saying "thinks" about it.`; },
  choices: [
    { label: 'Wire it into the grid', info: [['danger', 'The reactor']], test: { base: 48, mods: [R('engineer', 14)] },
      ok: { text: 'It takes a load off the reactor that nobody can account for. The lights are steadier than they have been since landfall.', fx: { machine: { reactor: 10 }, cap: { reactor: 4 } } },
      bad: { text: 'It draws the load, then the reactor\'s output, then trips every breaker in the grid. It has gone cold, and the reactor is down for a week. The vats go dark with it, and a week of what they would have grown is lost.', fx: { machine: { reactor: -14 }, food: -80, morale: -2 } } },
    { label: 'Take it back where it came from', hint: 'unknown', out: { text: s => `It is carried back by the same people who brought it, and put down exactly where it was found. ${Nc(s, 'engineer')} has a reactor that is dying by the month, and does not speak to you for the rest of the month.`, fx: s => ({ morale: -2, fops: [{ id: s.last.fid, threat: -8, accord: 6 }] }) } },
    { label: 'Lock it in the archive, and say nothing to the clerks who work beside it', dark: true, hint: 'unknown', note: 'Whatever it does to people near it will be found out by watching the people near it.', info: [['yield', 'Understanding'], ['danger', 'The two clerks']], out: { text: 'It sits in a steel box in the archive. The box is warm too, now. The two clerks who work nearest it start waking at the same minute every night, and one of them begins drawing the same shape in the margins of the stores ledger. The clinic records all of it and tells them it is overwork.', fx: s => ({ fops: [{ id: s.last.fid, insight: 20, threat: 4 }], stain: ['kept_quiet', 1] }) } },
    { label: (s, c) => c.name ? `Have ${c.first} carry it for a month, and write down what happens` : 'Have someone carry it for a month, and write down what happens', dark: true,
      note: 'It was made to be held, and somebody has to find out what it does to whoever holds it.', info: [['yield', 'What it is, and what it is for'], ['danger', 'Whoever carries it']],
      test: { base: 58, mods: [R('physician', 8), R('xenobio', 8)] },
      ok: { text: (s, c) => `${c.name || 'A rigger from the night shift'} wears it on a cord under the shirt for thirty days and reports to the clinic every morning. The notes fill a book. At the end of it ${c.first || 'the rigger'} hands it back, sleeps for two days, and can tell you which way the place it came from lies with both eyes shut.`,
        fx: (s, c) => ({ stain: ['expend', 1], mark: c.pid ? [c.pid, 'touched', 'carried the warm thing for thirty days because you said to'] : null, fops: [{ id: s.last.fid, insight: 32, threat: -6 }], do: s2 => { const p = c.pid && h.byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = Math.max(0, p.loyal - 10); } }) },
      bad: { text: (s, c) => `${c.name || 'A rigger from the night shift'} wears it on a cord under the shirt and reports to the clinic every morning, for nineteen days. On the twentieth the bunk is empty and still warm. The notes stop there.`,
        fx: (s, c) => ({ kill: c.pid ? [{ who: c.pid, cause: 'carried the warm thing for nineteen days, on your order' }] : [], pop: c.pid ? 0 : -1, morale: -4, stain: ['expend', 2], fops: [{ id: s.last.fid, insight: 20, threat: 6 }] }) } },
  ] });
add({ id: 'aft.captive', arc: 'after', view: 'people', tone: 'pressure', chain: true, repeat: 90, title: 'One of Them, Alive',
  when: s => !!lastF(s),
  text: s => { const f = lastF(s); return `When it was over, one of ${f.name} was still alive on the colony's side of the line: hurt, held, and watching everyone. ${Nc(s, 'security')} has them in the stores office under guard and wants to know what happens now.`; },
  choices: [
    { label: 'Let them go, once the ones who buried friends today have had their hour', dark: true, hint: 'unknown', note: 'The fence will not stand for a prisoner walking out untouched, and it will stand for one who can still walk.', info: [['yield', 'Goodwill, maybe, and a quiet fence'], ['danger', 'What the prisoner carries home']], out: { text: s => `${Nc(s, 'security')} unlocks the stores office and goes for a walk. An hour later the prisoner is bandaged, fed, and helped to the wire, and let go. The ones who carried your dead in from that fight stand along the fence and watch it without a word.`, fx: s => ({ fops: [{ id: s.last.fid, accord: 6, threat: -4 }], food: -20, morale: 2, stain: ['gauntlet', 1] }) } },
    { label: 'Question them, and no food or water until there is a map', dark: true, hint: 'unknown', note: 'Pointing and drawing would take a month the colony may not have.', info: [['yield', 'Understanding, quickly'], ['danger', 'A prisoner who may not last it']], test: { base: 62, mods: [R('xenobio', 10), R('chaplain', 8)] },
      ok: { text: 'It takes four days of pointing and drawing, with a cup of water on the table between you. At the end of it there is a map of where they come from and how many they are, and the cup is pushed across.', fx: s => ({ fops: [{ id: s.last.fid, insight: 26, accord: -10 }], stain: ['thirst', 1] }) },
      bad: { text: 'They say nothing, and look at the cup, and on the fifth night they are dead of it. The guard had been told not to give in first.', fx: s => ({ fops: [{ id: s.last.fid, accord: -20, kills: 1 }], morale: -2, stain: ['thirst', 2] }) } },
    { label: 'Hold them against the next attack', dark: true, hint: 'unknown', note: 'A hurt prisoner tied where the hills can see is the cheapest wall the colony has.', info: [['yield', 'They think twice before coming'], ['danger', 'The prisoner, for as long as it works']], out: { text: 'The prisoner is tied to a post on the wire at noon each day, wounds and all, so that whoever is watching knows what you hold. Nothing comes near the wire while the post is occupied.', fx: s => ({ food: -30, fops: [{ id: s.last.fid, threat: -18, accord: -18 }], flags: { hostage: true }, stain: ['post', 1] }) } },
    { label: 'Question them the Warden\'s way', dark: true, note: s => `${Nc(s, 'security')} does not need a shared language for the questions that matter: how many, where, and when.`, info: [['yield', 'Everything they know'], ['danger', 'They do not walk out']],
      test: { base: 72, mods: [R('security', 10)] },
      ok: { text: s => `It takes three nights, in the pump house, with the pumps left running. On the fourth morning ${N(s, 'security')} has a map, a count and a date. What is left of the prisoner is buried outside the wire before the day shift is up.`,
        fx: s => ({ morale: -2, stain: ['torture', 2], fops: [{ id: s.last.fid, insight: 42, accord: -40, kills: 1 }] }) },
      bad: { text: 'It takes two nights, in the pump house, with the pumps left running. The prisoner dies on the second without giving anything that can be told from a guess.',
        fx: s => ({ morale: -4, stain: ['torture', 2], fops: [{ id: s.last.fid, accord: -45, threat: 10, kills: 1 }] }) } },
  ] });

Object.assign(LF.TAGS, {
  'plan.seeds': ['bold', 'cautious', 'cautious', 'bold severe'], 'plan.sprout': ['', 'cautious', 'bold'], 'plan.year': ['closed', 'order', 'bold open', 'severe order'], 'plan.sleepers': ['mercy', 'bold', 'cautious', 'severe order'],
  'plan.ladle': ['mercy', 'free mercy', 'severe order'], 'plan.prospect': ['bold', 'bold', 'bold', 'cautious', 'severe bold'], 'plan.water': ['order cautious', 'severe cautious', 'bold', 'severe order'], 'plan.housed': ['mercy', 'order', 'free', 'severe order', 'order'], 'plan.surplus': ['free mercy', 'open mercy', 'cautious order'], 'aft.blame': ['mercy', 'severe order', 'severe order'], 'aft.press': ['bold severe', 'cautious', 'open mercy', 'severe closed'], 'aft.gift': ['open', 'open mercy', 'severe cautious', 'severe closed'],
  'aft.find': ['bold', 'open free', 'severe order', 'severe bold'], 'aft.beds': ['mercy', 'severe order', 'severe order'], 'aft.carcass': ['bold', 'cautious', 'severe order', 'cautious'], 'aft.cutting': ['bold', 'cautious', 'closed order', 'bold'],
  'aft.warm': ['bold', 'open', 'severe cautious', 'severe bold'], 'aft.captive': ['severe open', 'severe order', 'severe', 'severe closed'],
});
for (const st of LF.storylets) if (st.arc === 'after' && !st.setup) st.setup = s => ({ fid: (s.last && s.last.fid) || null, was: (s.last && s.last.title) || null });
})();

/* Landfall — the first season by world (NEXT.md WO-4; DESIGN.md "The first season by world").
   Before this every colony met the same seed, sprout and yellow-wheat cards in the same order. Now the colony's first
   need (s.need) is rolled once at landfall from the world and the site, on the story stream (LF.srand), and decides
   which first-season chain it is dealt:
     soil    the old chain (plan.seeds, plan.sprout, crops.first), now one of several
     water   the seed takes if it is watered, and there is not enough water (ssn.dry, ssn.wet, ssn.dig)
     warmth  nothing grows outdoors: glass, heat and which pods are warm (ssn.cold, ssn.glass, ssn.fuel)
     wild    the wheat grows and so does everything else, into the stores and the seed (ssn.weed, ssn.tangle, ssn.green)
     sea     the food is in the water: boats, nets, the tide (ssn.tide, ssn.catch, ssn.reef)
     none    the first sowing simply works; no chain, and its months go to other cards
   Three options at most on every card (2026-11-21): two or three plain priorities, one dark option at most, no lies.
   Every chain leaves what the rest of the game reads: s.flags.first_sow ('all', 'half', 'trial'), sprouted, resown,
   seed_grain, the yield bonus, and sometimes crops_adapted. An old save with no s.need plays as soil (LF.need).
   The sea's fishery is s.flags.sea_catch: food landed every day (CATCH), not a field crop, so no harvest card. */
(function () {
'use strict';
const { add, clamp, h } = LF; const { P, N, Nc, Nw, Nwc, R, M, If, foodDays } = h;

/* ---------- the first need ---------- */
LF.need = s => (s && s.need) || 'soil';
/* Weights by world. Every world has at least two. */
const NEED_W = {
  barren:  s => ({ water: s.world.truth.temp > 15 ? 7 : 5, soil: 2, warmth: s.world.truth.temp < 4 ? 3 : 0.5 }),
  ruin:    s => ({ soil: 5, water: 3, wild: 2 }),
  ice:     s => ({ warmth: 7, soil: 3 }),
  drowned: s => ({ sea: 7, soil: 2, wild: 1 }),
  jungle:  s => ({ wild: 6, soil: 3, sea: 1 }),
  garden:  s => ({ wild: 4, none: 3, soil: 3 }),
};
/* Where the colony came down shifts it: open water beside the camp, a cold exposed shelf, a pit out of the wind. */
const SITE_W = { site_delta: { water: 0.4, sea: 1.6, wild: 1.3 }, site_highland: { warmth: 1.5, soil: 1.2, sea: 0.5, wild: 0.7 }, site_deep: { warmth: 1.2, soil: 1.2 } };
LF.needWeights = function (s) {
  const w = (NEED_W[s.world.type] || (() => ({ soil: 1 })))(s);
  for (const f in SITE_W) if (s.flags[f]) for (const k in SITE_W[f]) if (w[k]) w[k] *= SITE_W[f][k];
  return w; };
function rollNeed(s) {
  const w = LF.needWeights(s), ks = Object.keys(w).filter(k => w[k] > 0); let r = LF.srand(s) * ks.reduce((a, k) => a + w[k], 0), need = ks[ks.length - 1];
  for (const k of ks) { r -= w[k]; if (r <= 0) { need = k; break; } }
  s.need = need;
  // the first card of the chain is due in the first month or two, ahead of whatever else is weighed (it may still be crowded out)
  if (FIRST[need]) s.sched.push({ id: FIRST[need], day: s.day + LF.sri(s, 4, 16) });
  if (need === 'none') { Object.assign(s.flags, { first_sow: 'all', sprouted: true });
    LF.log(s, `The first sowing went into the ${LF.lex(s, 'top')} the week the camp was laid, and it took everywhere it went in. Nobody has had to decide anything about it.`, 'good');
    LF.chron(s, 'The first sowing took everywhere it was put in.'); }
}
/* The fishery: food landed every day while the boats go out. Written for sixty and grown with the mouths (LF.fed);
   the stormy season halves it on a world whose weather is storms. */
const CATCH = 2.5;
LF.catchOf = s => { const c = s.flags.sea_catch || 0; if (c <= 0 || !s.world) return 0;
  return CATCH * c * LF.fed(s) * (s.world.climate === 'storm' && LF.date(s.day).season === 3 ? 0.5 : 1); };
const tick0 = LF.threadTick;
LF.threadTick = function (s) {
  if (s.world && !s.adrift && s.need === undefined && !LF.aloft(s)) {
    if (s.flags.first_sow || s.day > 30) s.need = 'soil';   // a save from before the first season was by world
    else rollNeed(s); }
  if (s.flags.sea_catch > 0) s.res.food += LF.catchOf(s);
  // the chain's third card is due a season after the first cutting (it may still come earlier, by weight)
  if (s.flags.sprouted && !s.flags.ssn_third && THIRD[LF.need(s)]) { s.flags.ssn_third = 1; s.sched.push({ id: THIRD[LF.need(s)], day: s.day + LF.sri(s, 25, 45) }); }
  return tick0 ? tick0(s) : undefined; };
const FIRST = { soil: 'plan.seeds', water: 'ssn.dry', warmth: 'ssn.cold', wild: 'ssn.weed', sea: 'ssn.tide' };
const THIRD = { water: 'ssn.dig', warmth: 'ssn.fuel', wild: 'ssn.green', sea: 'ssn.reef' };

/* ---------- helpers ---------- */
const NEED = k => s => LF.need(s) === k;
// a line in an officer's voice if the officer is here to say it, else the same thing said plainly
const voice = (s, role, q, alt) => P(s, role) ? q : alt;
// what the first sowing yields per plot sown, as plan.sprout reads it
const SOWN = { all: 1100, half: 550, trial: 90 };
const sown = (s, c, k) => Math.round((SOWN[s.flags.first_sow] || 550) * c.took * (k || 1) / 10) * 10;
const frac = t => t < 0.2 ? 'One plot in six' : t < 0.3 ? 'One plot in four' : t < 0.42 ? 'One plot in three' : t < 0.55 ? 'Half the plots' : 'Two plots in three';
// a build pushed along: started at a share of its labour if the crews are free, or brought forward if it is already going
const push = (s, id, share) => { if (s.built[id]) return; const L = LF.cost(s, id).labor;
  if (!s.project) { s.project = id; s.progress = Math.round(L * share); } else if (s.project === id) s.progress = Math.min(L - 1, s.progress + Math.round(L * share)); };
const canPush = (s, id) => !s.built[id] && (!s.project || s.project === id);
const projWord = { wells: 'the well shaft', greenhouse: 'the glasshouse', housing: 'the warm street' };
// every living thing here the colony has met: what burning, salting and poisoning harm (the Grudge reads fx.fops)
const living = (s, kinds, harm, kills) => s.factors.filter(f => kinds.includes(f.kind) && !f.res && f.stage > 0).map(f => ({ id: f.id, harm, kills: kills || 0 }));
const fo = (s, kinds, harm, kills) => { const l = living(s, kinds, harm, kills); return l.length ? l : null; };
const took = (s, base) => clamp(base + (LF.rand(s) - 0.5) * 0.3, 0.12, 0.7);

/* ======================= WATER ======================= */
add({ id: 'ssn.dry', arc: 'crops', tone: 'council', title: 'Dry Ground', w: 9, gap: 0, view: 'colony',
  when: s => NEED('water')(s) && s.day >= 4 && s.day < 200 && !s.flags.first_sow,
  setup: s => ({ rec: LF.down(s, 'reclaimer'), wet: s.world.truth.water, well: canPush(s, 'wells') }),
  text: (s, c) => `A strip of ${LF.lex(s, 'top')} is cleared and raked, and the seed is out of the lockers. ${Nwc(s, 'botanist')} pushed a finger into the strip this morning and it came out dry to the knuckle. The seed will take here if it is watered. ${c.rec ? 'Every litre the colony has goes round the reclaimer' : 'Every litre the colony has is in the lander\'s tanks'}, and there is ${c.wet < 8 ? 'nothing on the ground to add to it' : 'only a little seep in the low ground to add to it'}.\n\n`
    + voice(s, 'engineer', `[[engineer]] "If the water goes on the plots the taps go short, and if it goes to the taps there's no harvest to speak of." "I've done that sum every way I know, and it comes out the same every time, however late I sit up with it."`, 'Water the plots and the taps go short. Water the people and there is no harvest.'),
  choices: [
    { label: 'Water every plot, and the taps go short', note: 'The whole strip is sown and kept wet, and everyone drinks less for a season to do it.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A full sowing, watered'], ['danger', 'Everyone at the tap, and the oldest first']],
      out: { text: (s, c) => `Every plot is sown and watered at dusk, by can. ${c.rec ? 'The reclaimer runs hot all season and the taps are cut to a trickle.' : 'The lander\'s tanks go down a mark a week and the taps are cut to a trickle.'} One of the oldest is found in a bunk in the second month, dry-mouthed and gone.`,
        fx: s => ({ pop: -1, morale: -2, machine: { reclaimer: -8 }, flags: { first_sow: 'all', water_sown: 'all' }, sched: [['ssn.wet', 24, 34]], chron: 'In the first season the colony watered all its seed, and went thirsty to do it.' }) } },
    { label: 'Sow half, and dig for water first', note: (s, c) => c.well ? 'The salvage crews go down a shaft instead of into the wreck, and half the seed waits in the lockers.' : 'There is nobody free to dig while the crews are on the build, so the dig waits, and half the seed waits with it.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'Half a sowing, and a start on the wells'], ['danger', 'The plate that stays in the wreck']],
      out: { text: (s, c) => `Half the strip is sown. ${c.well ? 'A shaft is started where the low ground stays darkest after dawn, and the salvage crews go down it in shifts.' : 'The rest is wired shut in its lockers until there are hands free to dig.'} The wreck sits untouched for the season.`,
        fx: (s, c) => ({ mat: -20, flags: { first_sow: 'half', seed_grain: true, water_sown: 'half' }, sched: [['ssn.wet', 24, 34]], do: s2 => push(s2, 'wells', 0.25) }) } },
    { label: 'Water the plots from the clinic\'s ration', dark: true, note: 'The sick drink half, on the grounds that they are lying still, and the seed gets the difference.', hint: 'unknown', info: [['yield', 'A full sowing, and the taps untouched'], ['danger', 'The clinic']],
      out: { text: s => `The clinic's water is measured out by cup on a sheet pinned to the door. The strip is sown to the edge and stays dark with water all season. ${voice(s, 'physician', `${Nc(s, 'physician')} signs the sheet every morning and says, every morning, that it'll kill someone.`, 'The medical team sign the sheet every morning.')} It kills two before the season is out.`,
        fx: { pop: -2, yield: 0.05, flags: { first_sow: 'all', water_sown: 'all' }, sched: [['ssn.wet', 24, 34]], stain: ['ssn_clinic', 1], chron: 'In the first season the colony watered its seed out of the clinic\'s cups.' } } },
  ] });

add({ id: 'ssn.wet', arc: 'crops', tone: 'council', chain: true, title: 'What the Water Bought', view: 'colony',
  setup: s => ({ took: took(s, 0.36 + s.world.truth.water / 120 + (s.flags.site_delta ? 0.1 : 0) + (s.flags.water_sown === 'trial' ? 0.1 : 0)), well: canPush(s, 'wells') || s.built.wells }),
  text: (s, c) => { const sw = s.flags.water_sown || s.flags.first_sow;
    return (sw === 'all' ? `${frac(c.took)} of the watered strip came up green. Where the cans did not reach, the seedlings stood up a hand high and died standing.`
      : sw === 'half' ? `Of the half that was sown, ${frac(c.took).toLowerCase()} came up green. The lockers with the rest of the seed are still wired shut.`
      : `The dew nets gave about a cup a night each. Under them, ${c.took < 0.3 ? 'three' : c.took < 0.5 ? 'five' : 'eight'} of the twelve squares came up, and ${Nw(s, 'botanist')} knows to the cup what each one drank. There is not a meal in the lot of them.`)
      + `\n\nWhat is standing is ready to cut.`; },
  choices: [
    { label: 'Cut it all for the stores', note: 'Food now, and the next sowing comes out of lockers that have little left in them.', hint: 'good', info: [['yield', 'Food now'], ['danger', 'The next sowing']],
      out: { text: s => s.flags.first_sow === 'trial' ? 'It fills a sack and a half. People come to look at the sacks.' : 'It is cut in three days and carried in on shoulders.',
        fx: (s, c) => ({ food: sown(s, c), morale: c.took >= 0.3 ? 3 : -2, flags: { sprouted: true } }) } },
    { label: 'Keep back the ears that grew on the least water', note: 'Seed bred here, from the plants that managed on what there was, and it is half the harvest that hungry people watch hung up out of reach.', hint: 'unknown', info: [['yield', 'A wheat for dry ground, in time'], ['danger', 'Half of what there was to eat']],
      out: { text: s => `${Nwc(s, 'botanist')} walks the dry end of the strip and ties a rag round every plant still standing there. Those are cut first and hung in the dark. The rest goes to the stores.`,
        fx: (s, c) => ({ food: sown(s, c, 0.55), yield: 0.04 + c.took * 0.1, morale: -2, flags: { sprouted: true, seed_grain: true, seed_local: true, dry_seed: true } }) } },
    { label: 'Water a second sowing from the shaft', show: (s, c) => s.flags.first_sow !== 'all' || s.project === 'wells' || !!s.built.wells, note: 'The reserve goes in where the first sowing took, on water the shaft has not proved it can give.', hint: 'unknown', info: [['time', 'Another season'], ['danger', 'The reserve']],
      test: { base: 40, mods: [If((s, c) => c.took >= 0.42, 15, 'Ground that took'), If(s => s.project === 'wells' || !!s.built.wells, 10, 'The shaft'), If(s => s.flags.first_sow === 'trial', 10, 'The cup measures'), R('botanist', 10), R('engineer', 5)] },
      ok: { text: 'The second sowing comes up thick, in plots that have grown a crop before, on water hauled up the shaft by hand.', fx: { food: 450, yield: 0.1, morale: 4, flags: { sprouted: true, seed_grain: false, resown: true } } },
      bad: { text: 'The shaft gives a bucket an hour and then a bucket a day. The second sowing dries off in a week, and the lockers are empty.', fx: { food: 80, morale: -5, flags: { sprouted: true, seed_grain: false } } } },
  ] });

add({ id: 'ssn.dig', arc: 'crops', tone: 'pressure', title: 'The Dig', w: 3, view: 'colony',
  when: s => NEED('water')(s) && !s.built.wells && s.day >= 40 && (s.flags.sprouted || s.day >= 90),
  setup: s => ({ deep: s.world.truth.water < 8 ? 'sixty' : 'thirty', well: canPush(s, 'wells'), on: s.project === 'wells', fly: LF.canFly(s) }),
  text: (s, c) => `The plots that were watered are holding. The ones that were not are ${LF.lex(s, 'top')} again, with a crust on them you can knock on. ${c.on ? 'The well shaft is going down a hand a day.' : 'Nobody has started a well.'}\n\n`
    + voice(s, 'engineer', `[[engineer]] "${c.deep.charAt(0).toUpperCase() + c.deep.slice(1)} metres to anything wet, if the survey's right, and surveys mostly aren't. That's a casing, a pump and every pair of hands for a season, longer if she hits rock." "Or the lander fetches ice from the cold end of the world, and she'll go, she always does, but she won't thank you for it and neither will her tanks."`, `The survey puts water about ${c.deep} metres down. A well needs a casing, a pump and every pair of hands for a season. There is ice at the cold end of the world, a lander flight away.`),
  choices: [
    { label: 'Sink the shaft, with every hand that can be spared', note: (s, c) => c.well || c.on ? 'The fields and the salvage go short a season, and a shaft this deep is dug by people standing at the bottom of it.' : 'The crews are on another build, and the shaft has to wait for them.', hint: 'unknown', info: [['yield', 'Water of the colony\'s own'], ['fail', 'Whoever is at the bottom']],
      test: { base: 60, mods: [R('engineer', 10), R('geologist', 5), If(s => s.world.truth.water < 8, -10, 'A very dry world')] },
      ok: { text: (s, c) => c.well || c.on ? 'The shaft goes down in shifts round the clock, and the spoil heap grows beside it like a second camp. The cuttings are damp at the bottom of the month.' : 'The shaft is pegged out and the casing is cut, ready for the day the build crews come free. Meanwhile the plots get every can the taps can spare.', fx: { yield: 0.08, morale: 1, mat: -15, do: s2 => push(s2, 'wells', 0.4) } },
      bad: { text: 'The shaft wall comes in at twenty metres with two people under it. One is dug out alive. The shaft is started again a metre to the east.', fx: { pop: -1, morale: -3, mat: -15, do: s2 => push(s2, 'wells', 0.2) } } },
    { label: 'Fly the lander to the ice', req: (s, c) => c.fly, reqText: s => LF.flyWhy(s), note: s => `A flight's fuel, and ${s.sleepers > 0 ? 'the sleepers waiting on that flight wait another season' : 'a lander that was not built to haul ice'}.`, hint: 'unknown', info: [['yield', 'Water for the plots and the taps'], ['danger', 'The lander'], ['danger', 'The sleepers who wait']],
      out: { text: s => `${voice(s, 'pilot', `${Nc(s, 'pilot')} flies it with the cargo bay open to the cold and the ice chained to the deck.`, 'The lander goes out with the cargo bay open to the cold and comes back with ice chained to the deck.')} It comes down slow and heavy, and the colony drinks its fill for the first time since the landing. The plots are flooded at dusk.${s.sleepers > 0 ? ' Up in orbit, the pods that were waiting on that flight wait another season, and not all of them last it.' : ''}`,
        fx: s => ({ fly: 1, machine: { lander: -10, reclaimer: 6 }, yield: 0.08, morale: 3, sleepers: -Math.min(2, s.sleepers), poi: { key: 'ssn.ice', kind: 'spring', name: 'The ice at the cold end of the world', dist: 'long', off: true, state: 'visited', danger: 2, known: 'A lander flight away, and nowhere near on foot. Clean ice to the horizon.' } }) } },
    { label: 'The plots drink first. The old drink last', dark: true, note: 'The working crews and the plots get their water at the start of the day, and whatever is left goes to the long pods.', hint: 'unknown', info: [['yield', 'Every plot watered'], ['danger', 'The old and the sick']],
      out: { text: 'The order is posted on the tap house. The plots come back green to the last row. In the long pods the old are given what is left at the end of the day, and it is not much. Three of them are buried before the rains that never come.',
        fx: { yield: 0.12, pop: -3, morale: -3, flags: { water_by_work: true }, stain: ['ssn_old_last', 1] } } },
  ] });

/* ======================= WARMTH ======================= */
add({ id: 'ssn.cold', arc: 'crops', tone: 'council', title: 'Nothing Grows Outside', w: 9, gap: 0, view: 'colony',
  when: s => NEED('warmth')(s) && s.day >= 4 && s.day < 200 && !s.flags.first_sow,
  setup: s => ({ glass: canPush(s, 'greenhouse'), hot: LF.down(s, 'reactor') && !s.machines.reactor.lost }),
  text: (s, c) => `A test row was sown in the lee of the pods on the first clear morning. The seed is still lying in it, frozen into the ${LF.lex(s, 'top')} where it fell. Nothing will grow out of doors here. It will have to be grown in the warm, and the only warm is the pods the colony sleeps in and whatever the reactor can spare.\n\n`
    + voice(s, 'botanist', `[[botanist]] "It wants glass, or heat, or both, because nothing comes up out of doors here without them." "We haven't enough of either, so whichever way you do it, somebody's bunk goes cold this winter."`, 'Glass, or heat, or both, and there is not enough of either.'),
  choices: [
    { label: 'Glaze the plots with hull glass', cost: { mat: 30 }, note: (s, c) => `The plate that was going on the pod walls goes over the seed instead, and the pods stay single-skinned for a winter${c.glass ? '' : '. The build crews are busy, so the glazing is done by hand and slowly'}.`, hint: 'unknown', info: [['time', 'One season'], ['yield', 'Half the seed, under glass'], ['danger', 'The pods, single-skinned']],
      out: { text: (s, c) => `Hull glass is cut to size and laid over half the plots on frames. ${c.glass ? 'The ribs of a proper glasshouse go up beside them the same month.' : 'The rest of the seed stays in the lockers.'} The pods are colder for it, and people sleep in their coats.`,
        fx: s => ({ flags: { first_sow: 'half', seed_grain: true, warm_sown: 'glass' }, sched: [['ssn.glass', 24, 34]], do: s2 => { push(s2, 'greenhouse', 0.6); LF.emit(s2, 'cold', 'ssn.cold', 18, 200, 'the pod walls went over the seed'); } }) } },
    { label: 'Run the reactor\'s heat under the plots', note: 'Every plot is sown and kept warm from below, and the heat that does it comes out of the pods at night.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A full sowing'], ['danger', 'The reactor, and the pods at night']],
      out: { text: (s, c) => `Pipe is dug in under the plots in loops and run off the ${c.hot ? 'reactor\'s' : 'stove\'s'} heat exchanger. The ground steams. The pods are given the night setting at dusk instead of at midnight, and the coughs start in the second week.`,
        fx: s => ({ machine: { reactor: -8 }, morale: -1, flags: { first_sow: 'all', warm_sown: 'heat' }, sched: [['ssn.glass', 24, 34]], do: s2 => LF.emit(s2, 'cold', 'ssn.cold', 24, 220, 'the pods give their heat to the plots at night') }) } },
    { label: 'Move the old and the sick into the cold store, and grow in their pod', dark: true, note: 'The warmest pod in the camp is the clinic\'s, and the seed needs warm more than the people in it need warm.', hint: 'unknown', info: [['yield', 'A full sowing, in the warm'], ['danger', 'The old and the sick']],
      out: { text: s => `The clinic's pod is cleared in a morning and filled with trays to the roof. The patients go into the cold store with a stove and every blanket that can be found. ${voice(s, 'physician', `${Nc(s, 'physician')} sleeps in there with them, and buries two of them before the trays are ready to plant out.`, 'Two of them are buried before the trays are ready to plant out.')}`,
        fx: { pop: -2, yield: 0.05, flags: { first_sow: 'all', warm_sown: 'clinic' }, sched: [['ssn.glass', 24, 34]], stain: ['ssn_coldstore', 1] } } },
  ] });

add({ id: 'ssn.glass', arc: 'crops', tone: 'council', chain: true, title: 'Grown in the Warm', view: 'colony',
  setup: s => ({ took: took(s, 0.34 + (LF.ARCHETYPES[s.world.type].yield || 0) + (s.flags.warm_sown === 'glass' ? 0.06 : 0) - (s.flags.site_highland ? 0.05 : 0)), glass: !!s.built.greenhouse || s.project === 'greenhouse' }),
  text: (s, c) => { const w = s.flags.warm_sown;
    return (w === 'glass' ? `Under the glass, ${frac(c.took).toLowerCase()} came up green. The frames nearest the pods did best, and the far ones frosted on the inside on the coldest night and never recovered.`
      : w === 'clinic' ? `The trays from the clinic's pod were planted out in a cold snap. ${frac(c.took)} took, and the rest stood yellow and never recovered.`
      : w === 'trays' ? `The trays in the pods came up thick and pale. ${c.took < 0.3 ? 'A third' : c.took < 0.5 ? 'Half' : 'Most'} of them are worth planting on, and there is not a meal in the lot.`
      : `Over the heat, ${frac(c.took).toLowerCase()} came up green. Where the pipe ran shallow the roots cooked, and where it ran deep the frost got in.`)
      + `\n\nWhat is standing is ready to cut.`; },
  choices: [
    { label: 'Cut it all for the stores', note: 'Food now, and the next sowing comes out of lockers that have little left in them.', hint: 'good', info: [['yield', 'Food now'], ['danger', 'The next sowing']],
      out: { text: s => s.flags.first_sow === 'trial' ? 'It fills two sacks. People come to look at the sacks.' : 'It is cut in two days and carried in out of the wind.',
        fx: (s, c) => ({ food: sown(s, c), morale: c.took >= 0.3 ? 3 : -2, flags: { sprouted: true } }) } },
    { label: 'Keep back the plants that stood the frost', note: 'Seed from the ones that lived through the coldest night, and it is half the harvest that hungry people watch hung up out of reach.', hint: 'unknown', info: [['yield', 'A wheat for the cold, in time'], ['danger', 'Half of what there was to eat']],
      out: { text: s => `${Nwc(s, 'botanist')} marks every plant that stood up after the frost with a twist of wire. Those are cut first and hung in the warmest pod. The rest goes to the stores.`,
        fx: (s, c) => ({ food: sown(s, c, 0.55), yield: 0.04 + c.took * 0.1, morale: -2, flags: { sprouted: true, seed_grain: true, seed_local: true, cold_seed: true } }) } },
    { label: 'Heat a second planting through the dark months', show: s => s.flags.first_sow !== 'all', note: 'The reserve goes in under whatever glass and heat there is, through the worst of the cold.', hint: 'unknown', info: [['time', 'Another season'], ['danger', 'The reserve, and the reactor']],
      test: { base: 40, mods: [If((s, c) => c.took >= 0.42, 15, 'Ground that took'), If((s, c) => c.glass, 15, 'The glasshouse'), M('reactor', 10), R('botanist', 10)] },
      ok: { text: 'The second planting comes up under glass beaded with meltwater, thicker than the first. The reactor runs a little hotter all winter to do it.', fx: { food: 450, yield: 0.1, morale: 4, machine: { reactor: -4 }, flags: { sprouted: true, seed_grain: false, resown: true } } },
      bad: { text: 'A night colder than any yet comes down in the middle of the dark months and the heat cannot keep up. The second planting is black by morning, and the lockers are empty.', fx: { food: 80, morale: -5, machine: { reactor: -4 }, flags: { sprouted: true, seed_grain: false } } } },
  ] });

add({ id: 'ssn.fuel', arc: 'crops', tone: 'pressure', title: 'Fuel', w: 3, view: 'colony',
  when: s => NEED('warmth')(s) && s.day >= 40 && (s.flags.sprouted || s.day >= 90),
  setup: s => ({ house: canPush(s, 'housing') }),
  text: (s, c) => `The cold has come down properly. ${LF.lex(s, 'cover').charAt(0).toUpperCase() + LF.lex(s, 'cover').slice(1)} squeaks underfoot, the glass frosts inside by midnight, and the plots and the pods want the same heat at the same hours. There is not enough of it, and everything that burns has another use.\n\n`
    + voice(s, 'engineer', `[[engineer]] "I can give you the plots or the pods, and not both, not on what the old girl's making in this cold, and I've already got her running harder than I'd like." "Or you find me something to burn, and I'll warn you now, everything that burns round here is already somebody's something."`, 'The reactor can keep the plots warm or the pods, and not both.'),
  choices: [
    { label: 'Everyone into the pods that can be kept warm, and build', note: (s, c) => c.house ? 'People sleep three to a bunk while a warm street goes up, and the plots get what heat is left.' : 'People sleep three to a bunk, and the plots get what heat is left.', hint: 'unknown', info: [['yield', 'A start on proper walls'], ['danger', 'The plots, at the edges'], ['danger', 'Three to a bunk']],
      out: { text: (s, c) => `The far pods are shut and everyone crowds into the warm ones, three to a bunk, coats on. ${c.house ? 'The first walls of a street go up on the lee side, thick with packed ' + LF.lex(s, 'top') + '.' : ''} The plots get the heat that is left, and the outer rows freeze. A fever goes through the crowded pods and takes one of the children.`,
        fx: { yield: -0.02, pop: -1, morale: -1, do: s2 => { push(s2, 'housing', 0.45); LF.ease(s2, 'cold', 'ssn.fuel', 15, 250); } } } },
    { label: s => `Burn the ${LF.lex(s, 'wild1')}`, note: s => `It grows thick and oily past the wire, and nobody yet knows what comes off ${LF.lex(s, 'wild1')} when it burns.`, hint: 'unknown', info: [['yield', 'Fuel from outside the wire'], ['fail', 'The cutting crews, and the smoke']],
      test: { base: 50, mods: [R('xenobio', 10), R('botanist', 5)] },
      ok: { text: s => `The ${LF.lex(s, 'wild1')} is cut in swathes, dried on racks and burned. It gives a slow, sweet-smelling heat, and the plots and the pods both get through the cold.`, fx: s => ({ yield: 0.05, survey: 4, fops: fo(s, ['flora'], 4), do: s2 => LF.ease(s2, 'cold', 'ssn.fuel', 20, 300) }) },
      bad: { text: s => `The ${LF.lex(s, 'wild1')} burns well and the smoke from it is poison. The pods are aired in the night, too late for the two who slept nearest the stove.`, fx: s => ({ pop: -2, morale: -3, survey: 4, fops: fo(s, ['flora'], 4) }) } },
    { label: 'Heat the plots and the working pods. The rest double up in the cold store', dark: true, note: 'The plots and the people who work them stay warm, and the ones who do not work sit out the cold in the store.', hint: 'unknown', info: [['yield', 'The plots warm, and the crews'], ['danger', 'Everyone in the cold store']],
      out: { text: 'The cold store gets a stove, two lamps and everyone the work rosters do not need: the old, the sick, the very young and their mothers. The plots stay green through the dark. Three are carried out of the store before the thaw.',
        fx: { yield: 0.12, pop: -3, morale: -3, stain: ['ssn_coldstore', 1] } } },
  ] });

/* ======================= WILD ======================= */
add({ id: 'ssn.weed', arc: 'crops', tone: 'council', title: 'Everything Grows', w: 9, gap: 0, view: 'colony',
  when: s => NEED('wild')(s) && s.day >= 4 && s.day < 200 && !s.flags.first_sow,
  text: s => `The seed was barely in before ${LF.lex(s, 'cover')} came in over it. The strip has been pulled clean twice. By the next morning it is green again, and most of the green is not wheat.\n\n`
    + voice(s, 'botanist', `[[botanist]] "Everything grows here, and ours does too, only slower." "Turn your back on it a few mornings and it's their harvest, not ours."`, 'Everything grows here, ours only slower, and a week left alone makes it the harvest of whatever else came up.'),
  choices: [
    { label: 'Sow it all, and weed by hand every day', note: 'The salvage crews are on their knees in the rows from first light, and the wreck waits.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A full sowing'], ['danger', 'The plate that stays in the wreck']],
      out: { text: 'Every plot is sown, and every morning the whole camp walks the rows before breakfast with a sack each. The sacks are full by the time the bell goes. The wreck is not touched all season.',
        fx: { mat: -25, morale: -1, flags: { first_sow: 'all' }, sched: [['ssn.tangle', 24, 34]], chron: 'In the first season the colony sowed all its seed and weeded it by hand.' } } },
    { label: 'Sow half. Keep the rest sealed until we know what we\'re fighting', note: 'Half a harvest for a colony that needs a whole one, with seed kept back to try again.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'Half a sowing'], ['danger', 'Half the bread']],
      out: { text: s => `Half the strip is sown. The other lockers are wired shut and tagged, and ${Nw(s, 'botanist')} keeps a notebook on what comes up in the rows and how fast.`,
        fx: { flags: { first_sow: 'half', seed_grain: true, soil_clues: true }, survey: 3, sched: [['ssn.tangle', 24, 34]] } } },
    { label: 'Salt the ground round the plots', dark: true, note: 'Nothing comes up through salted ground for years, and that includes whatever the colony might want to plant there later.', hint: 'unknown', info: [['yield', 'Clean plots, now'], ['danger', 'The ground, for a generation']],
      out: { text: s => `Salt from the ${s.world.type === 'drowned' ? 'pans on the shore' : 'reactor\'s brine tanks'} is spread in a band a stride wide round every plot. Inside the band the wheat comes up alone. Outside it, for years, nothing comes up at all.`,
        fx: s => ({ yield: 0.08, morale: -1, fops: fo(s, ['flora'], 10), flags: { first_sow: 'all', salted: true }, sched: [['ssn.tangle', 24, 34]], stain: ['ssn_salt', 1] }) } },
  ] });

add({ id: 'ssn.tangle', arc: 'crops', tone: 'council', chain: true, title: 'What Came Up With It', view: 'colony',
  setup: s => ({ took: took(s, 0.36 + (LF.ARCHETYPES[s.world.type].yield || 0) * 1.2 + (s.flags.salted ? 0.08 : 0) + (s.flags.site_delta ? 0.06 : 0)) }),
  text: (s, c) => `${s.flags.first_sow === 'half' ? 'Of the half that was sown, ' + frac(c.took).toLowerCase() : frac(c.took)} came up as wheat. The rest came up as wheat and something else, wound together at the root, and in some of the heads the grain is the wrong colour.\n\n`
    + voice(s, 'xenobio', `${Nc(s, 'xenobio')} turns a head over.\n\n[[xenobio]] "It's crossed." "Or it's trying to, and it can't be, their pollen and ours shouldn't even recognise each other, so either my eyes are wrong or this is the best thing that's happened since landfall, and can we keep some, please, before somebody burns the row?"`, 'Some of the wheat looks crossed with the wild. That should not be possible.'),
  choices: [
    { label: 'Cut it all, weeds and wheat', note: 'Everything goes in the stores, and whatever is mixed into it goes into everyone who eats from them.', hint: 'good', info: [['yield', 'Food now'], ['later', 'Everyone who eats it']],
      out: { text: 'It is cut in three days and carried in, and the wrong-coloured grain goes in with the rest. The bread is darker than it should be.',
        fx: (s, c) => ({ food: sown(s, c), morale: c.took >= 0.3 ? 2 : -2, flags: { sprouted: true, wild_in_stores: true } }) } },
    { label: 'Pick the clean ears out by hand for seed', note: 'Seed that grew here and is still wheat, picked head by head, and it is half the harvest that hungry people watch hung up out of reach.', hint: 'unknown', info: [['yield', 'Clean seed'], ['danger', 'Half of what there was to eat']],
      out: { text: 'The whole camp sits in rows on the threshing floor and sorts heads into two baskets. The clean basket is hung up in the dark. The other goes to the stores, and the ladle shows it.',
        fx: (s, c) => ({ food: sown(s, c, 0.5), yield: 0.04 + c.took * 0.08, morale: -2, flags: { sprouted: true, seed_grain: true, seed_local: true } }) } },
    { label: 'Sow the crossed grain and see what comes up', note: 'It may be a wheat that can hold its own here, or it may be the seed gone for good.', hint: 'unknown', info: [['time', 'Another season'], ['yield', 'A wheat that belongs here'], ['danger', 'The seed']],
      test: { base: 20, mods: [R('botanist', 10), R('xenobio', 5), If((s, c) => c.took >= 0.42, 10, 'A strong first crop')] },
      ok: { text: 'The crossed grain comes up short, thick and dark, and nothing else in the rows can get near it. It is a wheat, of a kind. It is a wheat for here.',
        fx: { food: 150, morale: 6, flags: { sprouted: true, resown: true, crops_adapted: true, seed_grain: false }, chron: 'The colony\'s wheat crossed with a plant of this world, and the cross took.' } },
      bad: { text: 'It comes up as the wild thing it crossed with, every row, and the wheat in it is gone in a generation. The plots are dug over and the seed lockers are nearly empty.', fx: { food: -60, yield: -0.03, morale: -5, flags: { sprouted: true, seed_grain: false } } } },
  ] });

add({ id: 'ssn.green', arc: 'crops', tone: 'pressure', title: 'Green in the Stores', w: 3, view: 'colony',
  when: s => NEED('wild')(s) && s.day >= 50 && (s.flags.sprouted || s.day >= 90),
  setup: s => ({ mixed: !!s.flags.wild_in_stores }),
  text: (s, c) => `A store pod was opened this morning and the sacks along the back wall had sprouted through the weave. Something grows in the stores here, in the dark, on nothing but grain${c.mixed ? ', and it came in with the wild grain that was cut with the wheat' : ''}.\n\n`
    + voice(s, 'quartermaster', `[[quartermaster]] "It's in three pods, maybe four, and I'll know which when I've been through the last of them." "I won't tell you how much is still food till it's sorted, because I'd only be guessing, and you'd plan on the guess."`, 'It is in three pods, perhaps four, and nobody can say how much is still food until it is sorted.'),
  choices: [
    { label: 'Sort the stores, grain by grain', note: 'Every hand that can be spared sits on the floor of the store pods for a month, and the build waits.', hint: 'unknown', info: [['yield', 'Most of the stores kept'], ['danger', 'The build, and a month of hands']],
      out: { text: 'The stores are emptied onto sheets on the pod floor and sorted by lamplight. Most of it is sound. The sprouted grain is burned in a pit, and the smell hangs over the camp for a week.',
        fx: { food: -100, progress: -0.15, morale: -1, flags: { stores_sorted: true } } } },
    { label: 'Eat it. It is still food', note: 'The sprouting grain goes into the pot with everything else, and nobody knows yet what the sprout does to a gut.', hint: 'unknown', info: [['yield', 'Nothing lost'], ['fail', 'Everyone who eats it']],
      test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: 'The sprouted grain is malted, dried and milled with the rest. It makes a sweet, dark bread that people come to like.', fx: { morale: 2, flags: { wild_food: true } } },
      bad: { text: 'Within the week the clinic has more patients than beds. Most are back on their feet in a fortnight. Two are not.', fx: { pop: -2, morale: -4, food: -60 } } },
    { label: 'Sort it, and the spoiled goes to the lock-up and the stragglers', dark: true, note: 'Nothing is thrown away, and the people who get the sprouted grain are the ones who have no say.', hint: 'unknown', info: [['yield', 'Nothing lost to the colony'], ['danger', 'The lock-up and the stragglers']],
      out: { text: 'The good grain goes back on the shelves. The sprouted grain goes in a separate sack marked with chalk, and that sack feeds the lock-up and the stragglers in the far pod. One of them sickens on it and dies.',
        fx: { food: -30, pop: -1, stain: ['ssn_spoiled', 1] } } },
  ] });

/* ======================= SEA ======================= */
add({ id: 'ssn.tide', arc: 'crops', tone: 'council', title: 'The Food Is in the Water', w: 9, gap: 0, view: 'world',
  when: s => NEED('sea')(s) && s.day >= 4 && s.day < 200 && !s.flags.first_sow,
  text: s => `There is not much ground above the tide line, and what there is is ${LF.lex(s, 'top')} and salt. A strip of it could be sown. The shallows past it are thick with things that swim, and the survey team have already pulled three kinds out of the water that the clinic says can be eaten.\n\n`
    + voice(s, 'engineer', `[[engineer]] "It's boats and nets and somebody learning the tide tables, or it's a field." "We haven't the hands for both this season, and don't ask me to find them, because I've been asked that before and they weren't there then either."`, 'Boats and nets, or a field, and not the hands for both this season.'),
  choices: [
    { label: 'Boats and nets. The strip can wait', note: 'The lander\'s plate goes into hulls, the strip is sown small, and the boats go out on water nobody has charted.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A catch every day'], ['danger', 'The plate, and the first crews out']],
      out: { text: 'Four flat boats are cut from hull plate and launched off the shingle. The strip is sown in squares at the top of the beach. The boats come back low in the water the first week, and one comes back short a hand who went over in a squall.',
        fx: { mat: -25, pop: -1, flags: { first_sow: 'trial', seed_grain: true, sea_catch: 1.1 }, sched: [['ssn.catch', 24, 34]], chron: 'In the first season the colony built boats before it sowed a field.' } } },
    { label: 'Sow the strip, and fish from the shore', note: 'The field goes in whole and the catch is whatever can be got by wading, by people who do not know what lives in the shallows.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A full sowing, and some fish'], ['danger', 'The waders']],
      out: { text: 'The strip is sown to the high-water mark. Lines go out from the rocks at dusk and nets are dragged through the shallows at low tide, waist-deep. Something in the water takes a wader by the leg in the second week and does not let go.',
        fx: { pop: -1, flags: { first_sow: 'all', sea_catch: 0.5 }, sched: [['ssn.catch', 24, 34]] } } },
    { label: 'Build a weir across the lagoon mouth', note: 'A stone trap the tide fills and empties twice a day, built by crews standing in the channel while the tide runs.', hint: 'unknown', info: [['time', 'One season'], ['yield', 'A catch without boats'], ['fail', 'The crews in the channel']],
      test: { base: 50, mods: [R('engineer', 10), R('geologist', 5)] },
      ok: { text: 'The weir goes in over two spring tides, a curved wall of stone and stakes across the channel. The first ebb leaves a pool behind it heaving with fish. Half the strip is sown above it.', fx: { mat: -15, flags: { first_sow: 'half', seed_grain: true, sea_catch: 1.2 }, sched: [['ssn.catch', 24, 34]] } },
      bad: { text: 'The tide comes in faster than the tables said, with the crew still in the channel. Two are swept out past the reef. The weir is finished in a smaller bay, and half the strip is sown above it.', fx: { pop: -2, mat: -15, morale: -3, flags: { first_sow: 'half', seed_grain: true, sea_catch: 0.7 }, sched: [['ssn.catch', 24, 34]] } } },
  ] });

add({ id: 'ssn.catch', arc: 'crops', tone: 'council', chain: true, title: 'The First Catch', view: 'world',
  setup: s => ({ c: s.flags.sea_catch || 0, took: took(s, 0.3 + (s.flags.site_delta ? 0.1 : 0)) }),
  text: (s, c) => (c.c >= 1 ? 'The racks along the beach are full. The catch comes in every day now, more of it than the cooks know what to do with, and some of it is going off in the heat before it is gutted.'
      : 'What the water gives is enough for a pot most nights and nothing to put by.')
    + ` Of the strip above the tide line, ${frac(c.took).toLowerCase()} came up green.`,
  choices: [
    { label: 'Dry and smoke it for the stores', note: 'Food put by, smoked in sheds that never cool, by a crew that breathes the smoke.', hint: 'good', info: [['yield', 'Food put by'], ['danger', 'The smokehouse crew']],
      out: { text: 'Smoking sheds go up along the top of the beach and the fires are kept going day and night. The stores fill with stiff brown sides of fish that smell of the fire. The smokehouse crew cough all season.',
        fx: (s, c) => ({ food: Math.round(300 * Math.max(0.5, c.c) / 10) * 10 + sown(s, c, 0.2), morale: 1, flags: { sprouted: true } }) } },
    { label: 'Build more boats', note: 'More of the lander\'s plate goes into hulls, and more crews go out on water that has already taken people.', hint: 'unknown', info: [['yield', 'A bigger catch, every day'], ['danger', 'The plate, and the crews']],
      out: { text: 'Three more boats are cut and launched. They go out in a line at dawn and come back strung out over the afternoon, and one comes back with its bow stove in and a crew of three where there were four.',
        fx: { mat: -20, pop: -1, flags: { sprouted: true }, do: s2 => { s2.flags.sea_catch = Math.min(2.5, (s2.flags.sea_catch || 0) + 0.5); } } } },
  ] });

add({ id: 'ssn.reef', arc: 'crops', tone: 'pressure', title: 'What Comes With the Tide', w: 3, view: 'world',
  when: s => NEED('sea')(s) && s.day >= 50 && (s.flags.sprouted || s.day >= 90),
  setup: s => ({ c: s.flags.sea_catch || 0, deep: s.factors.some(f => f.kind === 'natives' && f.sub === 'deep' && f.stage > 0) }),
  text: (s, c) => `The nets have been coming back torn, and twice now with nothing in them but a hole the size of a door. ${c.deep ? 'There were marks on the rocks this morning, a hand high above the waterline, that nobody in the colony made.' : 'Something has been following the boats home.'}\n\n`
    + voice(s, 'security', `[[security]] "So now it's the sea that's stealing from us, a hole the size of a door in the nets and nobody saw it done, which is how every thief I ever caught liked to work." "So do we argue with it, or do we fish somewhere it isn't, since I can't very well put the sea in the lock-up?"`, 'The sea is taking back its fish, and the boats are fishing where it is.'),
  choices: [
    { label: 'Keep the boats inside the reef', note: 'Nobody else is lost to whatever tears the nets, and the catch is what the lagoon can give.', hint: 'unknown', info: [['yield', 'Safe water'], ['danger', 'A smaller catch, every day']],
      out: { text: 'The boats are kept inside the reef. The catch is smaller and steadier, and the crews come home in daylight. The ladle shrinks by a spoon.',
        fx: { morale: -1, do: s2 => { s2.flags.sea_catch = Math.max(0.4, (s2.flags.sea_catch || 0) - 0.3); } } } },
    { label: 'Go out past the reef where the shoals are', note: 'The big catch is out there with whatever tears the nets.', hint: 'unknown', info: [['yield', 'A bigger catch'], ['fail', 'The crews past the reef']],
      test: { base: 50, mods: [R('security', 10), R('pilot', 5)] },
      ok: { text: 'The boats go out in a pack with a lamp at each bow and a harpoon in each stern. Whatever was following them keeps its distance. The shoals beyond the reef fill the boats twice a day.', fx: { poi: { key: 'ssn.shoals', kind: 'herd', name: 'The shoals past the reef', dist: 'near', state: 'visited', danger: 3, known: 'Open water beyond the reef where the big shoals run. Something follows the boats home from it.' }, do: s2 => { s2.flags.sea_catch = Math.min(2.5, (s2.flags.sea_catch || 0) + 0.6); } } },
      bad: { text: 'One boat in the pack is turned over in clear water in the middle of the afternoon. Nobody saw what did it. Two are pulled out and two are not.', fx: { pop: -2, mat: -10, morale: -4 } } },
    { label: 'Blast the reef where it comes through', dark: true, note: s => `The reactor's spare charges, set along the reef at low water. Whatever lives in it dies with it${s.factors.some(f => f.kind === 'natives' && f.sub === 'deep' && f.stage > 0) ? ', and so do the marks on the rocks' : ''}.`, hint: 'unknown', info: [['yield', 'The nets come back whole'], ['danger', 'The reef, and what lives in it']],
      out: { text: 'The charges go off at low water in a line half a kilometre long. The sea is brown for a week and the beach is covered in dead things the colony has no names for. The nets come back whole after that, and full.',
        fx: s => ({ parts: -4, fops: fo(s, ['fauna', 'natives', 'flora'], 16, 4), stain: ['ssn_blast', 1], do: s2 => { s2.flags.sea_catch = Math.min(2.5, (s2.flags.sea_catch || 0) + 0.8); } }) } },
  ] });

/* ---------- the harvest card and the wheat card, worded for the need ----------
   plan.harvest and crops.adapt read these (content-plan.js, content-core.js). */
const FIRST_CROP = { soil: 'The first harvest on this world', water: 'The first harvest off the watered plots', warmth: 'The first harvest grown in the warm',
  wild: 'The first harvest, picked out of everything that came up round it,', sea: 'The first harvest off the strip above the tide line',
  none: 'The first harvest on this world, off a sowing that took everywhere it went in,' };
LF.firstCrop = s => FIRST_CROP[LF.need(s)] || FIRST_CROP.soil;
LF.firstCropTail = s => LF.need(s) === 'sea' && s.flags.sea_catch > 0 ? ' The fish on the racks along the beach are not counted in it.' : LF.need(s) === 'warmth' ? ' Every sack of it was grown in heat the pods went without.' : '';
const WHEAT = { soil: 'Earth wheat keeps losing to the native microbes at the roots.', water: 'Earth wheat drinks more than this ground will ever give it.',
  warmth: 'Earth wheat stops growing the first night the glass frosts on the inside.', wild: 'Earth wheat is outgrown in every row by things that were here first.',
  sea: 'Earth wheat burns at the tips wherever the salt wind reaches it.', none: 'Earth wheat grows here, and gives about a third of what a wheat bred for this sun would.' };
LF.wheatWant = s => WHEAT[LF.need(s)] || WHEAT.soil;

Object.assign(LF.TAGS, {
  'ssn.dry': ['bold', 'cautious', 'severe order'],
  'ssn.wet': ['', 'cautious', 'bold'],
  'ssn.dig': ['bold', 'bold', 'severe'],
  'ssn.cold': ['cautious', 'bold', 'severe'],
  'ssn.glass': ['', 'cautious', 'bold'],
  'ssn.fuel': ['mercy', 'open bold', 'severe order'],
  'ssn.weed': ['mercy', 'cautious', 'severe'],
  'ssn.tangle': ['', 'cautious', 'open bold'],
  'ssn.green': ['order cautious', 'bold', 'severe order'],
  'ssn.tide': ['bold', 'cautious', 'bold'],
  'ssn.catch': ['cautious', 'bold'],
  'ssn.reef': ['cautious', 'bold', 'severe'],
});
})(typeof globalThis !== 'undefined' ? globalThis : this);

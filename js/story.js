/* Landfall — the colony model: what story threads read and write instead of reading each other (STORY-PLAN.md §2).
   Phase 1: this layer only observes. It derives conditions from the state the game already keeps, records signs as
   threads surface and seeds as loose ends are left, and never draws on s.rng, so play is unchanged to the last roll.
   Later phases let threads emit into it and read from it.

   s.cond[k]  = [{ src, v, why, d0?, until? }]  one entry per source. Derived entries are rebuilt every few days;
                emitted ones (LF.emit) carry d0/until and fade linearly to nothing.
   s.signs    = [{ id, d, src }]    something people noticed, and (hidden from the player) what caused it.
   s.seeds    = [{ id, k, d, txt, who?, paid? }]   a loose end the storyteller may pay off later.
   No DOM; plain JSON; runs under Node. */
(function () {
'use strict';
const { clamp } = LF, H = LF.h;

/* ---------- the vocabulary: a closed list, so that every thread is written against the same words ---------- */
LF.COND = {
  // physical
  dark:          { kind: 'physical', name: 'Dark' },
  cold:          { kind: 'physical', name: 'Cold' },
  storm:         { kind: 'physical', name: 'Storm' },
  contamination: { kind: 'physical', name: 'Contamination' },
  blackout:      { kind: 'physical', name: 'Blackout' },
  scarcity:      { kind: 'physical', name: 'Scarcity' },
  // bodily
  hunger:        { kind: 'bodily', name: 'Hunger' },
  sickness:      { kind: 'bodily', name: 'Sickness' },
  confinement:   { kind: 'bodily', name: 'Confinement' },
  exhaustion:    { kind: 'bodily', name: 'Exhaustion' },
  // social
  fear:          { kind: 'social', name: 'Fear' },
  suspicion:     { kind: 'social', name: 'Suspicion' },
  grief:         { kind: 'social', name: 'Grief' },
  resentment:    { kind: 'social', name: 'Resentment' },
  zeal:          { kind: 'social', name: 'Zeal' },
  schism:        { kind: 'social', name: 'Schism' },
  hope:          { kind: 'social', name: 'Hope' },
  // outside
  siege:         { kind: 'outside', name: 'Siege' },
  watched:       { kind: 'outside', name: 'Watched' },
  strangers:     { kind: 'outside', name: 'Strangers within' },
  heard:         { kind: 'outside', name: 'Heard' },
  dependency:    { kind: 'outside', name: 'Dependency' },
  // knowledge and the self
  unexplained:   { kind: 'knowledge', name: 'Unexplained' },
  revelation:    { kind: 'knowledge', name: 'Revelation' },
  changed:       { kind: 'knowledge', name: 'Changed' },
};
const HOT = LF.COND_HOT = 40;          // at or above this a condition is something the colony feels, and a card may say so
const EVERY = 5;                       // days between rebuilds of the derived conditions

/* ---------- signs: what people notice. Several causes share each one, on purpose (STORY-PLAN.md §2.2) ---------- */
LF.SIGNS = {
  tracks:       'tracks where nobody walked',
  missing:      'someone, or something, gone missing',
  damage:       'damage nobody did',
  stores_short: 'stores short of what the ledger says',
  machine_fault:'a machine failing in a way it should not',
  dreams:       'people dreaming the same dream',
  sickness:     'a sickness nobody can name',
  sleepwalkers: 'people found walking in their sleep',
  water_taint:  'a taste in the water',
  crop_fail:    'crops failing in a pattern',
  hum:          'a sound under everything',
  lights:       'lights where there should be none',
  voices:       'voices on the radio, or in the ground',
  watching:     'the feeling of being watched',
  placed:       'things moved, or left, by someone',
  warmth:       'warmth where there should be none',
};
const SIGN_OF = { // kind.sub -> the signs that thread gives off when it first surfaces
  'fauna.pack': ['tracks', 'missing'], 'fauna.swarm': ['damage', 'stores_short'], 'fauna.giant': ['tracks', 'damage'],
  'fauna.ambush': ['missing', 'tracks'], 'fauna.delver': ['damage', 'machine_fault', 'warmth'],
  'flora.creeper': ['damage', 'machine_fault'], 'flora.spore': ['dreams', 'sickness'], 'flora.mat': ['machine_fault', 'damage'],
  'flora.bloom': ['water_taint', 'machine_fault'], 'flora.choir': ['crop_fail', 'dreams'],
  'plague.wasting': ['sickness'], 'plague.fever': ['sickness', 'water_taint'], 'plague.parasite': ['sleepwalkers', 'dreams'],
  'plague.rot': ['stores_short', 'crop_fail'], 'plague.sleep': ['sickness', 'sleepwalkers'],
  'ruin.vault': ['warmth', 'placed'], 'ruin.engine': ['hum', 'warmth'], 'ruin.weapon': ['lights', 'missing'],
  'ruin.archive': ['dreams', 'voices'], 'ruin.nursery': ['warmth', 'hum'],
  'natives.nomad': ['placed', 'watching'], 'natives.settled': ['lights', 'watching'], 'natives.hive': ['stores_short', 'placed'],
  'natives.remnant': ['watching', 'lights'], 'natives.deep': ['voices', 'placed'],
  'humans.splinter': ['stores_short', 'tracks'], 'humans.claimants': ['lights', 'voices'], 'humans.feral': ['tracks', 'voices'],
};
const MYSTERY_SIGN = { understory: ['crop_fail', 'dreams'], builders: ['hum', 'warmth'], others: ['voices', 'lights'], hive: ['placed', 'watching'] };
/* Every live thing that could explain a sign. Two or more is the point: that is a mystery without authoring one. */
LF.suspects = (s, id) => s.factors.filter(f => !f.res && f.stage >= 1 && (SIGN_OF[f.kind + '.' + f.sub] || []).includes(id)).map(f => f.id)
  .concat((s.world.mysteries || []).filter(m => (MYSTERY_SIGN[m] || []).includes(id) && s.world.arcs.includes(m)).map(m => 'arc:' + m));

/* ---------- reading the model ---------- */
const live = (s, e) => e.until === undefined ? e.v : s.day >= e.until ? 0 : e.v * (e.until - s.day) / Math.max(1, e.until - e.d0);
/* The strongest source counts in full; the others add a little each. Two causes of fear feel worse than one. */
LF.cv = function (s, k) {
  const all = ((s.cond || {})[k] || []).map(e => live(s, e)), es = all.filter(v => v > 0).sort((a, b) => b - a), off = all.filter(v => v < 0).reduce((a, b) => a + b, 0);
  return es.length ? Math.round(clamp(es[0] + 0.3 * es.slice(1).reduce((a, b) => a + b, 0) + off, 0, 100)) : 0;
};
/* Why the colony feels it: the clause of the strongest source, for a card to say "because ...". */
LF.because = function (s, k) {
  let best = null, bv = 0; for (const e of (s.cond || {})[k] || []) { const v = live(s, e); if (v > bv) { bv = v; best = e; } }
  return best ? best.why : '';
};
/* The id of whatever is doing most to cause it: a factor id, 'th.<thread>', or a name from derive(). */
LF.source = function (s, k) { let best = null, bv = 0; for (const e of (s.cond || {})[k] || []) { const v = live(s, e); if (v > bv) { bv = v; best = e; } } return best ? best.src : null; };
LF.hot = (s, min) => Object.keys(LF.COND).map(k => [k, LF.cv(s, k)]).filter(([, v]) => v >= (min ?? HOT)).sort((a, b) => b[1] - a[1]);
/* A thread, a storylet or a choice says something happened that the colony will feel for a while. */
LF.emit = function (s, k, src, v, days, why) {
  if (!LF.COND[k]) throw new Error('unknown condition ' + k);
  s.cond = s.cond || {}; const a = s.cond[k] = (s.cond[k] || []).filter(e => e.src !== src || e.until === undefined);
  a.push({ src, v, why: why || '', d0: s.day, until: s.day + days });
};

/* Relief: something makes a condition easier to bear for a while, whatever is causing it. */
LF.ease = function (s, k, src, v, days) { LF.emit(s, k, 'ease:' + src, -Math.abs(v), days, ''); };

/* ---------- deriving conditions from what the game already knows ---------- */
const act = f => f.stage >= 2 && !f.res;
const pr = f => clamp((f.threat - 20) / 80, 0, 1);                 // how hard a live factor is pressing, 0..1
function derive(s) {
  const out = {}, put = (k, src, v, why) => { if (v >= 5) (out[k] = out[k] || []).push({ src, v: Math.round(clamp(v, 0, 100)), why }); };
  const fl = s.flags, q = LF.date(s.day).season, fd = H.foodDays(s), pf = LF.power(s), w = s.world, P = LF.pressure(s);
  const climate = w.climate, roomy = !!s.built.housing;

  // bodily
  if (s.res.food <= 0) put('hunger', 'stores', 100, 'the stores are empty');
  else if (fd < 60) put('hunger', 'stores', (60 - fd) / 60 * 90, (m => m < 1 ? 'the stores will not last the month' : m === 1 ? 'the stores will last about a month' : `the stores will last about ${LF.th && LF.th.num ? LF.th.num(m) : m} months`)(Math.round(fd / 10)));
  if (LF.lean(s)) put('hunger', 'rations', 35, 'everyone is on reduced rations');   // below HOT alone: tight rations are a background fact, not a crisis
  if (fl.shared_hunger) put('hunger', 'shared', 15, 'the officers eat what everyone eats');
  if (s.pop > 110 && !roomy) put('confinement', 'crowding', 30 + (s.pop - 110) / 2, 'there are more people than there are pods');
  if (climate === 'winter' && q === 3) put('confinement', 'winter', s.built.shelter ? 30 : 55, 'the cold keeps everyone indoors');
  if (climate === 'flare' && w.truth.haz >= 55) put('confinement', 'flare', s.built.shelter ? 15 : 35, 'the star drives everyone under cover');
  if (climate === 'storm' && q === 2) put('confinement', 'storm', s.built.shelter ? 15 : 35, 'the storm season keeps everyone behind walls');
  if (fl.fever_quarantine && !fl.fever_cured) put('confinement', 'quarantine', 40, 'the quarantine line still stands');
  if (fl.fortified) put('confinement', 'walls', 25, 'the colony lives behind its own wall');
  if (fl.crackdown) put('confinement', 'curfew', 20, 'the watch keeps people where they are told to be');
  if (P.labor < 0.9) put('exhaustion', 'labour', (0.9 - P.labor) * 200, 'every job takes longer than it should');
  if (fl.push_on) put('exhaustion', 'push', 35, 'the work goes on at full pace, every day');
  if (w.grav >= 1.15) put('exhaustion', 'gravity', (w.grav - 1.1) * 150, 'the gravity drags at everyone');
  if (s.machines.medbay && s.machines.medbay.lost && !s.built.school) put('sickness', 'medbay', 20, 'there is no autodoc');

  // physical
  if (climate === 'winter' && q === 3) put('dark', 'winter', 50, 'the dim season is long and dark here');
  if (q === 3) put('dark', 'season', 15, 'the dim season');
  if (pf < 0.6) put('blackout', 'power', (0.6 - pf) / 0.6 * 100, s.machines.reactor.lost ? 'the reactor is gone' : 'the reactor is failing');
  if (pf < 0.5) put('dark', 'power', 30, 'the lights are rationed');
  if (w.truth.temp < -15) put('cold', 'world', roomy ? 20 : 40, 'this world is colder than the pods were built for');
  if (climate === 'winter' && q === 3) put('cold', 'winter', 65, 'the long cold is here');
  if (climate === 'storm') put('storm', 'climate', q === 2 ? 60 : 10, q === 2 ? 'it is storm season' : 'the storms will come back');
  if (climate === 'flare') put('storm', 'flare', w.truth.haz >= 55 ? 30 : 10, 'the star flares');
  if (s.machines.reclaimer.lost && !s.built.wells) put('contamination', 'water', 60, 'there is no clean water source');
  if (s.res.parts < 5) put('scarcity', 'parts', (5 - s.res.parts) * 16, 'spare parts are nearly gone');
  if (s.res.mat < 20) put('scarcity', 'mat', (20 - s.res.mat) * 3, 'the plate yard is empty');

  // what the world holds
  for (const f of s.factors) {
    if (f.kind === 'land') continue;
    const N = f.name, pv = pr(f), sub = f.kind + '.' + f.sub;
    if (f.res === 'lost') { put('fear', f.id, 35, `the colony lost its struggle with ${N}`); continue; }
    if (f.res === 'accord' || f.res === 'harnessed') {
      if (LF.KINDS[f.kind] && LF.KINDS[f.kind].subs[f.sub].boon) put('dependency', f.id, f.res === 'harnessed' ? 40 : 25, `the colony leans on ${N}`);
      continue;
    }
    if (f.res || f.stage < 1) continue;
    if (f.stage <= 2 && f.insight < 20 && f.kind !== 'faction') put('unexplained', f.id, (45 - f.insight) * clamp(1 - (s.day - f.last - 60) / 300, 0.35, 1), `nobody knows what ${N} ${(LF.KINDS[f.kind] || {}).mass ? 'is' : 'are'}`);
    if (!act(f)) continue;
    if (f.kind === 'plague') put('sickness', f.id, 25 + 70 * pv, `${N} is in the colony`);
    if (sub === 'plague.parasite') put('changed', f.id, 20 + 50 * pv, `${N} is changing people`);
    if (sub === 'plague.rot' || sub === 'flora.bloom') put('contamination', f.id, 20 + 60 * pv, `${N} is in the ${sub === 'flora.bloom' ? 'water' : 'stores'}`);
    if (sub === 'flora.spore') put('sickness', f.id, 15 + 40 * pv, `${N} is in the air`);
    if (['fauna', 'ruin'].includes(f.kind) || sub === 'flora.creeper') put('fear', f.id, 15 + 60 * pv + 5 * Math.min(4, f.kills), `${N} ${f.kills ? 'have killed' : 'are close'}`.replace(/ have killed$/, (LF.KINDS[f.kind] || {}).mass ? ' has killed' : ' have killed'));
    if ((f.kind === 'fauna' || f.kind === 'natives' || f.kind === 'humans') && pv > 0.5 && f.accord < 20) put('siege', f.id, 70 * pv, `${N} are at the wire`);
    if ((f.kind === 'natives' || f.kind === 'humans') && f.accord < 40) put('watched', f.id, 30 + 30 * pv, `${N} are watching the colony`);
    if (f.kind === 'ruin' && ['engine', 'weapon', 'archive'].includes(f.sub)) put('heard', f.id, 15 + 30 * pv, `${N} is awake, and may not be alone`);
    if (f.kind === 'faction') { put('schism', f.id, 30 + 50 * pv, `${N} want a different colony`); put('suspicion', f.id, 15 + 30 * pv, `people are choosing sides over ${N}`); }
  }
  if (s.world.mysteries && s.world.mysteries.length && s.day > 30) for (const m of s.world.mysteries) if (!fl[{ understory: 'und_pact', builders: 'bld_sealed', others: 'oth_kin', hive: 'hive_treaty' }[m]])
    put('unexplained', 'arc:' + m, 25, { understory: 'something under the fields is not understood', builders: 'nobody knows what the Builders left', others: 'nobody knows who else is out there', hive: 'nobody knows what the drummers want' }[m]);

  // social
  if (s.tension > 30) put('fear', 'tension', (s.tension - 30) * 1.2, 'one thing after another has gone wrong');
  if (s.grief > 4) put('grief', 'dead', s.grief * 2.5, s.deaths === 1 && s.firstDead ? `${s.firstDead} is dead` : 'there are fresh names on the wall');
  if (s.morale < 40) put('resentment', 'morale', (40 - s.morale) * 2.2, 'people think you are failing them');
  const grudges = s.people.filter(p => p.alive && (p.marks.grudge || p.marks.slighted)).length;
  if (grudges) put('resentment', 'grudges', 15 * grudges, grudges === 1 ? 'someone with a name bears you a grudge' : 'several people with names bear you grudges');
  if (fl.command_rule && !fl.council) put('resentment', 'charter', 20, 'nobody voted for the Administrator');
  if (fl.earth_hidden) put('suspicion', 'secret', 30, 'there are things the officers have not told anyone');
  if (fl.crackdown) put('suspicion', 'watch', 25, 'the watch keeps lists');
  if (fl.faith_strong) put('zeal', 'faith', 45, 'the faithful are many and sure of themselves');
  const docs = Object.keys(s.val).filter(ax => LF.doctrine(s, ax)).length;
  if (docs) put('zeal', 'doctrine', 12 * docs + 5 * Object.values(s.val).filter(v => Math.abs(v) >= 5).length, 'the colony has decided what kind of colony it is');
  const done = Object.values(LF.pillars(s)).filter(Boolean).length;
  if (s.morale > 55 || done) put('hope', 'state', clamp((s.morale - 50) * 1.5, 0, 60) + 10 * done, done ? `${done === 1 ? 'one cord has' : done + ' cords have'} been cut` : 'things are going well');
  if (s.won) put('hope', 'won', 40, 'the colony no longer needs the ship');

  // the self, and who else is here
  const ret = fl.returned && !fl.returned_gone ? fl.returned : 0;
  if (ret) put('changed', 'returned', 10 + 6 * Math.min(8, ret), `${ret} people came back from ${fl.returned_to || 'the interior'} different`);
  const touched = s.people.filter(p => p.alive && p.marks.touched).length;
  if (touched) put('changed', 'touched', 15 * touched, touched === 1 ? 'one of the named came back from something not quite the same' : 'several of the named are not quite who they were');
  if (fl.crops_symbiotic) put('changed', 'wheat', 25, 'the wheat is threaded through with something native');
  if (fl.und_communion) put('changed', 'communion', 35, 'the dead are given to the meadow');
  if (fl.oth_kin || fl.oth_merged) put('strangers', 'reach', fl.oth_kin ? 20 : 40, 'the Reach live among the colony');
  if (fl.builders_power) put('dependency', 'builders', 50, 'the lights run on a machine nobody understands');
  if (fl.und_pact) put('dependency', 'und', 35, 'the fields depend on the Understory');
  if (fl.hive_allies) put('dependency', 'hive', 25, 'the drummers stand with the colony');
  if (fl.cure_debt || fl.oth_owes === false) put('dependency', 'debt', 25, 'the colony owes a debt it has not paid');
  if (!done && s.day > 360 && LF.down(s, 'hydroponics')) put('dependency', 'ship', 15, 'everything still depends on the ship\'s machines');
  if (fl.oth_hailed || fl.wrote_home) put('heard', 'radio', fl.oth_hailed ? 35 : 15, fl.oth_hailed ? 'the colony has announced itself on the radio' : 'a message went out toward Earth');
  if (w.techCause === 'made' && s.day > 30) put('heard', 'made', 10, 'something on this world was made, and may still be listening');
  return out;
}

/* Flags that mark a moment: the colony feels it at once, and less as the seasons pass. [cond, strength, days, why]. */
const MOMENT = {
  blood_spilled:      [['fear', 45, 240, 'colonists have killed colonists'], ['resentment', 40, 300, 'colonists have killed colonists']],
  crackdown:          [['fear', 30, 150, 'the watch broke a protest']],
  let_sleepers_die:   [['grief', 40, 200, 'forty sleepers were left to die'], ['resentment', 20, 200, 'forty sleepers were left to die']],
  sleepers_abandoned: [['grief', 30, 200, 'the sleepers were given up']],
  abandoned_sick:     [['grief', 35, 200, 'the sick were left outside the doors'], ['suspicion', 25, 200, 'people wonder who would be left outside next']],
  earth_truth:        [['revelation', 60, 120, 'the colony knows what happened on Earth'], ['grief', 25, 120, 'Earth is gone']],
  earth_only:         [['revelation', 40, 120, 'the letters from Earth have been read']],
  bld_awake:          [['revelation', 60, 150, 'the Builders\' machine is awake'], ['fear', 30, 150, 'the Builders\' machine is awake']],
  und_contact:        [['revelation', 55, 150, 'the Understory has answered']],
  oth_hailed:         [['revelation', 40, 90, 'there are other people on this world']],
  hive_talk:          [['revelation', 45, 120, 'the drummers can be spoken to']],
  stranger:           [['strangers', 45, 180, 'a stranger came in with a party']],
  specialists:        [['strangers', 20, 90, 'new faces from the sleepers']],
  stayed:             [['grief', 15, 90, 'one of the party chose not to come home']],
  justice_harsh:      [['fear', 25, 150, 'the colony punishes hard'], ['resentment', 20, 150, 'the colony punishes hard']],
  daughter_bitter:    [['schism', 40, 300, 'the daughter settlement left angry']],
  faith_suppressed:   [['resentment', 35, 240, 'the faithful were told to stop'], ['suspicion', 25, 240, 'the faithful meet where nobody can see']],
};

/* ---------- seeds: loose ends, kept so a later story can pick them up (STORY-PLAN.md §2.4) ---------- */
const SEED_FLAG = {
  promise_orbit:  'a promise was made to the sleepers still in orbit',
  sleepers_traded:'thirty sleepers were traded while they slept',
  earth_hidden:   'the truth about Earth was kept from the colony',
  cure_debt:      'a cure was bought, and has not been paid for',
  oth_debt_us:    'the Reach owe the colony',
  oth_owes:       'the colony owes the Reach',
  hive_gift:      'a gift was given to the drummers, and they have not answered it',
  daughter:       'a daughter settlement went upriver',
  bld_sealed:     'the Builders\' machine was sealed, not stopped',
  bld_dormant:    'the Builders\' machine is waiting',
  und_sampled:    'a sample of the Understory sits in the lab',
  und_walled:     'the Understory waits at the copper line',
  abandoned_sick: 'the sick were left outside, and some may have lived',
  ret_slighted:   'the returned were slighted',
  stayed:         'one of a party stayed out there',
  stranger:       'a stranger was taken in',
  wrote_home:     'a message is on its way to Earth',
  let_sleepers_die: 'forty sleepers were left to die because the numbers said so',
};
const SEED_MARK = { spared: 'was let off with a warning', convict: 'was punished for stealing', grudge: 'bears a grudge', slighted: 'was passed over', touched: 'came back changed' };
function plantSeeds(s) {
  const has = id => s.seeds.some(x => x.id === id);
  for (const k in SEED_FLAG) if (s.flags[k] && !has('flag:' + k))
    s.seeds.push({ id: 'flag:' + k, k: 'flag', d: s.day, txt: SEED_FLAG[k] + (k === 'stayed' && s.flags.stayed_at ? ` (${s.flags.stayed_at})` : k === 'daughter' && typeof s.flags.daughter === 'string' ? ` (${s.flags.daughter})` : '') });
  for (const p of s.people) {
    for (const m in SEED_MARK) if (p.marks[m] && p.alive && !has(`mark:${p.id}:${m}`)) s.seeds.push({ id: `mark:${p.id}:${m}`, k: 'person', d: s.day, who: p.id, txt: `${p.name} ${p.marks[m].txt || SEED_MARK[m]}` });
    // Exiled, not dead: the most obvious person to walk back in one day.
    if (!p.alive && !p.died && /exile|put out|sent out/.test(p.cause || '') && !has('exile:' + p.id)) s.seeds.push({ id: 'exile:' + p.id, k: 'person', d: s.day, who: p.id, txt: `${p.name} was sent out past the markers` });
  }
  for (const f of s.factors) {
    if (f.kind === 'land' || !LF.KINDS[f.kind]) continue;
    if (f.res === 'contained' && !has('held:' + f.id)) s.seeds.push({ id: 'held:' + f.id, k: 'thread', d: s.day, txt: `${f.Name} was held back, and is still out there` });
    if (f.stage >= 1 && !f.res && f.uses.avoid && !f.uses.study && !f.uses.force && !f.uses.accord && !has('ignored:' + f.id)) s.seeds.push({ id: 'ignored:' + f.id, k: 'thread', d: s.day, txt: `${f.Name} was kept clear of and never dealt with` });
  }
}

/* ---------- the tick: cheap, and never touches s.rng ---------- */
LF.storyInit = function (s) { s.cond = s.cond || {}; s.signs = s.signs || []; s.seeds = s.seeds || []; s.storySeen = s.storySeen || {}; };
LF.sense = function (s) {
  if (!s.world || s.adrift) return;
  LF.storyInit(s);
  const d = derive(s);
  for (const k in LF.COND) { const keep = (s.cond[k] || []).filter(e => e.until !== undefined && e.until > s.day); const all = keep.concat(d[k] || []); if (all.length) s.cond[k] = all; else delete s.cond[k]; }
  for (const fl in MOMENT) if (s.flags[fl] && !s.storySeen['flag:' + fl]) { s.storySeen['flag:' + fl] = s.day; for (const [k, v, days, why] of MOMENT[fl]) LF.emit(s, k, 'flag:' + fl, v, days, why); }
  // A thread that has just surfaced leaves its signs. They are logged here with their cause; the player only ever sees the sign.
  for (const f of s.factors) if (f.stage >= 1 && !s.storySeen['sign:' + f.id]) { s.storySeen['sign:' + f.id] = s.day;
    for (const id of SIGN_OF[f.kind + '.' + f.sub] || []) s.signs.push({ id, d: s.day, src: f.id }); }
  for (const m of s.world.mysteries || []) if (s.used[{ understory: 'und.rings', builders: 'bld.find', others: 'oth.signal', hive: 'hive.tracks' }[m]] !== undefined && !s.storySeen['sign:arc:' + m]) {
    s.storySeen['sign:arc:' + m] = s.day; for (const id of MYSTERY_SIGN[m]) s.signs.push({ id, d: s.day, src: 'arc:' + m }); }
  plantSeeds(s);
  s.storySense = s.day;
};
LF.storyTick = function (s) { if (!s.storySense || s.day - s.storySense >= EVERY || s.cur) LF.sense(s); };
})();

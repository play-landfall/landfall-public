/* Landfall — world generation.
   A world is an archetype, three candidate landing zones, a starting kit and a set of hidden "factors"
   (things the planet holds). They are bought against one budget, so a generous world is paid for with a
   lean mission, deeper secrets, or both. */
(function () {
'use strict';
const { ri, pick, rand, clamp } = LF;

LF.ARCHETYPES = {
  barren: { name: 'Lichen world', cls: 'E', pts: 3, sv: { water: [2, 14], temp: [-10, 32], bio: [3, 14] }, bounty: 0, yield: 0.13, late: 0.35, mat: 15, ore: 0.3,
    blurb: 'Rock, wind, and a grey-green crust on the lee side of stones. Nothing here will hurt you or feed you.',
    prefixes: ['scree', 'dust', 'ash', 'slate', 'wind', 'cinder'], climate: { flare: 3, winter: 1.5, storm: 1 },
    kinds: { flora: 2, ruin: 1.2, humans: 1.4, plague: 0.6, fauna: 0.3, natives: 0.15 },
    subs: { flora: ['mat', 'mat', 'bloom'], plague: ['rot', 'sleep'], fauna: ['delver'], natives: ['remnant', 'deep'], humans: ['splinter', 'claimants'] },
    lex: { cover: 'the low grey growth', under: 'the dust flats', top: 'dust', surface: 'dust', slump: 'The dust bank slumps over it', wild: 'the grey crust off the lee of the stones', wild1: 'grey crust', burnt: 'windburnt' },
    zones: { wet: 'the meltwater basin', high: 'the basalt shelf', deep: 'the rift canyon', near: 'the dust plain beside the anomaly' } },
  ruin: { name: 'Graveyard world', cls: 'D', pts: 6, sv: { water: [14, 40], temp: [4, 26], bio: [14, 34] }, bounty: 1, yield: 0.06, late: 0.3, mat: 70, ore: 0.38, wreck: 520,
    blurb: 'From orbit the continent is scored with straight lines. Somebody built here once and is gone. The array cannot tell when they left, or why. Between the walls there is only dry rock, wind, and a grey-green crust in the lee of the stones.',
    prefixes: ['glass', 'slag', 'iron', 'bone', 'tomb', 'cable'], climate: { flare: 1.5, winter: 1, storm: 1 },
    kinds: { ruin: 4, natives: 0.8, humans: 1, fauna: 0.6, flora: 0.6, plague: 0.6 }, multi: ['ruin'],
    subs: { natives: ['remnant', 'hive'], humans: ['feral', 'claimants'], fauna: ['swarm', 'delver'], flora: ['mat', 'creeper'], plague: ['sleep', 'parasite'] },
    lex: { cover: 'the scrub', under: 'the rubble fields', top: 'rubble', surface: 'rubble', slump: 'The rubble slope slides over it', wild: 'the black moss off the old walls', wild1: 'wall moss', burnt: 'sunburnt' },
    zones: { wet: 'the canal basin', high: 'the terrace city', deep: 'the undercroft', near: 'the plaza beside the anomaly' } },
  ice: { name: 'Ice world', cls: 'D', pts: 2, sv: { water: [6, 24], temp: [-48, -14], bio: [12, 32] }, bounty: 1, yield: 0.12, late: 0.4, mat: 90, ore: 0.5,
    blurb: 'White to the horizon: ice sheets over frozen continents, and a thin green fringe where the ice meets the sea. The scans show liquid water under the ice, and warmth, in places, where there should be none.',
    prefixes: ['frost', 'rime', 'floe', 'hoar', 'drift', 'pale'], climate: { winter: 5, storm: 1 },
    kinds: { fauna: 1.5, ruin: 1.5, humans: 1, plague: 0.6, natives: 0.6, flora: 0.5 },
    subs: { fauna: ['giant', 'delver', 'pack'], ruin: ['nursery', 'engine', 'vault'], plague: ['sleep', 'wasting'], natives: ['deep', 'remnant', 'nomad'], flora: ['bloom', 'mat'] },
    lex: { cover: 'the snow', under: 'the ice', top: 'ice', surface: 'ice', slump: 'The ice face comes down over it', wild: 'the red weed from under the ice', wild1: 'red weed', burnt: 'windburnt' },
    zones: { wet: 'the thaw lake shore', high: 'the nunatak', deep: 'the ice cave', near: 'the moraine beside the anomaly' } },
  drowned: { name: 'Ocean world', cls: 'C', pts: 8, sv: { water: [84, 97], temp: [12, 28], bio: [44, 70] }, bounty: 2, yield: 0.13, late: 0.4, mat: -40, ore: 0.1,
    blurb: 'Open sea round the middle of the world. Island chains, warm shallows, and a tide that moves the horizon. The array mapped the islands but could not see under the water.',
    prefixes: ['tide', 'reef', 'kelp', 'brine', 'squall', 'shoal'], climate: { storm: 5, flare: 1 },
    kinds: { fauna: 2, flora: 1.5, natives: 1.2, plague: 1, ruin: 0.8, humans: 0.6 },
    subs: { fauna: ['ambush', 'swarm', 'giant'], flora: ['bloom', 'creeper', 'choir'], natives: ['deep', 'hive'], ruin: ['vault', 'engine', 'archive'] },
    lex: { cover: 'the reed beds', under: 'the lagoon floor', top: 'silt', surface: 'water', slump: 'The reef wall comes down over it', wild: 'the brown wrack off the reef', wild1: 'reef wrack', burnt: 'sunburnt' },
    zones: { wet: 'the lagoon shore', high: 'the caldera rim', deep: 'the sea-cave harbour', near: 'the reef flat beside the anomaly' } },
  jungle: { name: 'Hothouse world', cls: 'B', pts: 8, sv: { water: [54, 80], temp: [26, 42], bio: [78, 96] }, bounty: 3, yield: -0.01, late: 0.2, mat: 60,
    blurb: 'Green from coast to coast across the middle of the world, and loud from orbit in every band the sensors have. Everything grows fast here, and most of it gets eaten.',
    prefixes: ['vine', 'rot', 'canopy', 'fen', 'thorn', 'mire'], climate: { storm: 2.5, flare: 1, winter: 0.4 },
    kinds: { fauna: 3, flora: 2, plague: 2, natives: 1, ruin: 0.4, humans: 0.4 }, multi: ['fauna'],
    subs: { flora: ['creeper', 'spore', 'choir'] },
    lex: { cover: 'the undergrowth', under: 'the forest floor', top: 'soil', surface: 'canopy', slump: 'The bank slumps over it', wild: 'the white root from under the leaf litter', wild1: 'white root', burnt: 'sunburnt' },
    zones: { wet: 'the river clearing', high: 'the limestone tor', deep: 'the sinkhole floor', near: 'the burn scar beside the anomaly' } },
  garden: { name: 'Garden world', cls: 'A', pts: 10, sv: { water: [44, 70], temp: [9, 22], bio: [58, 84] }, bounty: 4, yield: 0.03, late: 0.8, mat: 0,
    blurb: 'Meadows, clear rivers, a sky the colour of the old photographs. It looks better than the array promised, and people cried at the first images.',
    prefixes: ['meadow', 'orchard', 'brook', 'honey', 'willow', 'lark'], climate: { storm: 1, winter: 1, flare: 1 },
    kinds: { flora: 1.5, plague: 1.5, natives: 1.2, ruin: 1.2, fauna: 1, humans: 1 },
    subs: { flora: ['choir', 'spore'], plague: ['parasite', 'sleep', 'wasting'], ruin: ['nursery', 'weapon', 'archive'], humans: ['claimants', 'feral'], fauna: ['giant', 'ambush', 'swarm'] },
    lex: { cover: 'the grass', under: 'the downs', top: 'chalk', surface: 'turf', slump: 'The hillside slumps over it', wild: 'the bulbs from under the turf', wild1: 'turf bulb', burnt: 'sunburnt' },
    zones: { wet: 'the water meadow', high: 'the chalk down', deep: 'the sheltered combe', near: 'the hillside beside the anomaly' } },
};

/* The world's own words for ground, for text that would otherwise assume one (a desert's dunes on an ice world). */
LF.lex = (s, k) => LF.ARCHETYPES[s.world.type].lex[k];
/* The three planets (Lachlan, 2026-11-21; DESIGN.md "Worlds"): every game offers the same three kinds of world, each with
   its own name, star and distance, and each with two landing sites. The easy site feeds the colony; the hard one grows food
   worse and pays it back in plate, ore or salvage. The site is the archetype the colony is played on (s.world.type), so
   everything written per archetype still holds. `scope` is the telescope's picture (art/requests until it is painted). */
LF.WORLDS = {
  water:  { name: 'A water world', scope: 'scope_water', sites: ['drowned', 'ice'],
    blurb: 'Bright, blue and white: open sea round the middle, ice caps reaching down from both poles.' },
  green:  { name: 'A green world', scope: 'scope_green', sites: ['garden', 'jungle'],
    blurb: 'Green continents under cloud, temperate at the edges and a dark belt of something denser round the middle.' },
  barren: { name: 'A barren world', scope: 'scope_barren', sites: ['barren', 'ruin'],
    blurb: 'Dun and grey, dry from pole to pole. On one continent the array keeps finding straight lines.' },
};
/* What each site gives and costs, in the words the choice uses: the easy site first. */
LF.SITE_TERMS = {
  drowned: { site: 'the island chains', gives: 'Warm shallows, fish and weed to eat.', costs: 'Little stone and no metal above the waterline.' },
  ice:     { site: 'the ice shelf', gives: 'Ore in the moraines and good stone.', costs: 'Short light and frozen ground: food is hard won.' },
  garden:  { site: 'the temperate coast', gives: 'Soil that takes a seed, and clean water.', costs: 'Soft ground and little to build with.' },
  jungle:  { site: 'the canopy belt', gives: 'Hardwood and fibre past counting.', costs: 'Most of what grows gets eaten, the crops first.' },
  barren:  { site: 'the dust plains', gives: 'Bare ground, and nothing wild in it to fight the crops.', costs: 'Little plate, and a long walk for ore.' },
  ruin:    { site: 'the dead city', gives: 'Old walls full of metal to cut and carry.', costs: 'Poisoned rubble where the fields should be.' },
};
LF.worldOf = type => Object.keys(LF.WORLDS).find(k => LF.WORLDS[k].sites.includes(type)) || null;
/* Every archetype a game can be played on. Kept as a list for whatever picks one at random. */
LF.DEALT = Object.values(LF.WORLDS).reduce((a, w) => a.concat(w.sites), []);

/* What each kind of thing can be. Frames (frames.js) are written against these slots. */
LF.KINDS = {
  fauna: { label: 'Fauna', subs: {
    pack:   { suf: ['stalkers', 'runners', 'hounds'], form: 'low, six-limbed, built like a thrown spear', sign: 'three-toed prints in a ring around the whole camp', habit: 'hunt in relays at dusk', wants: 'meat', weak: 'fire', stakes: ['crew', 'person', 'food'] },
    swarm:  { suf: ['mites', 'needles', 'skitters'], form: 'no bigger than a thumb, and there are millions', sign: 'cable insulation chewed to lace', habit: 'rise out of the ground after rain', wants: 'salt and polymer', weak: 'smoke', stakes: ['machine', 'food', 'mat'] },
    giant:  { suf: ['walkers', 'backs', 'tusks'], form: 'the size of the lander, armoured, unhurried', sign: 'a track of flattened ground forty metres wide', habit: 'come through twice a year and do not go around things', wants: 'the ground you happen to be standing on', weak: 'noise', stakes: ['project', 'food', 'machine'] },
    ambush: { suf: ['widows', 'maws', 'lurkers'], form: 'mostly mouth, and very patient', sign: 'a boot, still laced, with nothing in it', habit: 'lie in still water for days without moving', wants: 'whatever comes down to drink', weak: 'light', stakes: ['person', 'crew', 'morale'] },
    delver: { suf: ['delvers', 'borers', 'wyrms'], form: 'blind, segmented, thick as a water main', sign: 'floor plates lifted from underneath', habit: 'tunnel toward warmth', wants: 'the heat of the reactor', weak: 'vibration', stakes: ['machine', 'project', 'mat'] } } },
  flora: { label: 'Flora', mass: true, subs: {
    creeper: { suf: ['choke', 'bind', 'rope'], form: 'a vine that grows a hand-span a day and sets like cable', sign: 'a hatch that will not open because something outside is holding it shut', habit: 'climbs anything warm', wants: 'something to climb', weak: 'salt', stakes: ['machine', 'project', 'mat'] },
    spore:   { suf: ['breath', 'veil', 'smoke'], form: 'a rust-coloured haze that hangs in low ground at dawn', sign: 'three people who all describe the same dream', habit: 'blooms on still mornings', wants: 'lungs', weak: 'rain', stakes: ['crew', 'morale', 'person'] },
    mat:     { suf: ['scab', 'rust', 'crust'], form: 'a grey-green crust that passes for lichen and eats polymer and soft alloy', sign: 'a wrench left out overnight, pitted like old bone', habit: 'spreads along anything manufactured', wants: 'our metal', weak: 'dry heat', stakes: ['machine', 'mat', 'machine'] },
    bloom:   { suf: ['slick', 'milk', 'bloom'], form: 'a film on the water, pearl-white and faintly warm', sign: 'the intake screens furred shut', habit: 'doubles every three days in sunlight', wants: 'our water', weak: 'darkness', stakes: ['machine', 'food', 'crew'] },
    choir:   { suf: ['choir', 'lattice', 'root'], form: 'one organism, kilometres across, threaded through the soil', sign: 'rings of dead crop, each exactly the same width', habit: 'pulses, slowly, as if counting', wants: 'something nobody has understood yet', weak: 'copper', stakes: ['food', 'morale', 'crew'] } } },
  plague: { label: 'Disease', mass: true, subs: {
    wasting:  { names: ['the thinning', 'marrow rot', 'the long cough'], sign: 'a field hand who has lost a fifth of her weight in a month on double rations', habit: 'takes months, and takes the strong first', wants: 'something in the soil', weak: 'isolation', stakes: ['crew', 'morale', 'person'] },
    fever:    { names: ['redwater', 'the burn', 'glass fever'], sign: 'four people down in one shift, hot enough to feel from the doorway', habit: 'kills in a week or not at all', wants: 'the water', weak: 'boiling', stakes: ['crew', 'person', 'crew'] },
    parasite: { names: ['the passenger', 'threadworm', 'the whisper'], sign: 'a man found walking, asleep, toward the tree line, the third this month', habit: 'changes what its hosts want', wants: 'a bite nobody remembers', weak: 'cold', stakes: ['person', 'morale', 'crew'] },
    rot:      { names: ['black meal', 'store-rot', 'the grey bloom'], sign: 'a sealed ration pod, opened, full of grey dust', habit: 'ignores people and eats what they eat', wants: 'spores in the dust', weak: 'dry cold', stakes: ['food', 'food', 'morale'] },
    sleep:    { names: ['the stillness', 'the long sleep', 'the hush'], sign: 'a child who will not wake, breathing slow and easy, cool to the touch', habit: 'stops people one at a time without killing them', wants: 'nobody knows', weak: 'nothing found yet', stakes: ['crew', 'person', 'morale'] } } },
  ruin: { label: 'Ruin', mass: true, subs: {
    vault:   { names: ['the Door', 'the Strongroom', 'the Cyst'], form: 'a sealed chamber of dark alloy with one seam, and the seam is warm', sign: 'a radar return too square to be geology', habit: 'does nothing, very precisely', wants: 'alloys and tools nobody alive could make', weak: 'patience', boon: 'tools', stakes: ['person', 'crew', 'machine'] },
    engine:  { names: ['the Hum', 'the Furnace', 'the Heart'], form: 'machinery the size of a hill, still turning', sign: 'a tremor every ninety-one minutes, exactly', habit: 'has run without maintenance for longer than there have been humans', wants: 'power, without limit', weak: 'its own regularity', boon: 'power', stakes: ['machine', 'person', 'crew'] },
    weapon:  { names: ['the Sentinels', 'the Needle Field', 'the Watch'], form: 'slender towers, evenly spaced, that turn to follow movement', sign: 'a survey drone on the ground, cut neatly in half', habit: 'tolerates some things and not others, by rules nobody has worked out', wants: 'a defence nothing on this world could breach', weak: 'stillness', boon: 'weapons', stakes: ['crew', 'person', 'machine'] },
    archive: { names: ['the Library', 'the Index', 'the Whispering Hall'], form: 'kilometres of corridor lined with something that is not quite writing', sign: 'a surveyor reciting long numbers in her sleep', habit: 'teaches, whether or not you asked', wants: 'everything its makers knew', weak: 'short visits', boon: 'knowledge', stakes: ['person', 'morale', 'crew'] },
    nursery: { names: ['the Hatchery', 'the Cold Ward', 'the Rows'], form: 'row on row of translucent cells, each with something folded inside it', sign: 'warmth under the ground, in a regular grid', habit: 'is waiting for a signal, or a season', wants: 'whatever its makers meant to come back as', weak: 'cold', boon: 'knowledge', stakes: ['crew', 'person', 'food'] } } },
  natives: { label: 'Natives', subs: {
    nomad:   { names: ['the Tall Ones', 'the Followers', 'the Long Walkers'], form: 'tall, long-limbed, travelling in bands of thirty', sign: 'a cairn that was not there yesterday, built in plain sight of the camp', habit: 'follow the seasons along routes older than their stories', wants: 'the valley, as a road', weak: 'their dependence on the herds', boon: 'guides', stakes: ['crew', 'food', 'person'] },
    settled: { names: ['the Masons', 'the Lamplighters', 'the Wall People'], form: 'short, broad, and builders: there are walls of fitted stone a day east', sign: 'smoke on the horizon, rising from the same place every morning', habit: 'count everything, and keep the count', wants: 'to know exactly what we will take', weak: 'their walls', boon: 'fighters', stakes: ['food', 'mat', 'crew'] },
    hive:    { names: ['the Gleaners', 'the Many', 'the Weavers'], form: 'many bodies and, the survey team thinks, far fewer minds', sign: 'hundreds of them dismantling a survey marker and carrying it off in pieces', habit: 'take anything unattended and build with it', wants: 'material, any material', weak: 'whatever directs them', boon: 'fighters', stakes: ['mat', 'machine', 'project'] },
    remnant: { names: ['the Quiet Folk', 'the Keepers', 'the Last'], form: 'few, old, and wearing fragments of machines they can no longer make', sign: 'a figure on the ridge at dawn, holding something that glints', habit: 'tend places that were important once', wants: 'to be left alone with their dead', weak: 'their numbers', boon: 'knowledge', stakes: ['person', 'morale', 'crew'] },
    deep:    { names: ['the Tide People', 'the Under-folk', 'the Singers'], form: 'rarely seen: a hand on the rock at the waterline, gone when you look', sign: 'nets in the water, woven from something that is not plant', habit: 'sing, at night, through the ground or the water', wants: 'the water kept clean', weak: 'the dry', boon: 'guides', stakes: ['food', 'crew', 'machine'] } } },
  humans: { label: 'Humans', subs: {
    splinter:  { names: ['the Breakaways', 'the Second Camp', 'Pod Nine'], form: 'forty of our own, who took a cargo pod during the descent and came down on their own terms', sign: 'a cache of our own ration packs, opened, two valleys over', habit: 'know every one of our procedures, because they wrote half of them', wants: 'not to be governed by you', weak: 'their numbers', boon: 'labour', stakes: ['mat', 'food', 'morale'] },
    claimants: { names: ['the Company', 'the Tender', 'the Claim'], form: 'a follow-up ship, faster than ours, launched twenty years after us with a charter that says this world is theirs', sign: 'a new star, decelerating', habit: 'do everything by contract', wants: 'what you have built', weak: 'their distance from anyone who could enforce it', boon: 'tools', stakes: ['morale', 'machine', 'mat'], late: true },
    feral:     { names: ['the Children', 'the Machine-raised', 'the Orphans'], form: 'human, born here from a seed-probe and raised by its machines; none of them older than thirty', sign: 'a handprint in the river mud, small, with five fingers', habit: 'speak a language built from maintenance alerts', wants: 'they do not know yet', weak: 'their trust in machines', boon: 'guides', stakes: ['person', 'food', 'morale'] } } },
};
const SIGNATURE = { flora: 'understory', ruin: 'builders', humans: 'others', natives: 'hive' };

const ZONES = {
  wet:  { flag: 'site_delta', note: 'The best water and soil, and the most of whatever else lives here.', fx: { yield: 0.15 },
          land: 'The lander settles beside open water. By nightfall the air is loud with things nobody has named yet.' },
  high: { flag: 'site_highland', note: 'Cold and exposed but easy to defend, with good stone and thin soil.', fx: { yield: -0.06, mat: 40 },
          land: s => `Wind, bare stone, and a horizon like a knife edge. ${LF.h.Nc(s, 'geologist')} is out with a hammer before the engines have cooled.` },
  deep: { flag: 'site_deep', note: 'Out of the weather, but dark and cramped, and close to whatever is underground.', fx: { yield: -0.1, parts: 4 },
          land: 'Walls of rock on three sides and a strip of sky. It feels safe, though people keep their voices down.' },
  near: { flag: 'site_coast', note: 'Close to the anomaly, so you will find out early what it is.', fx: { survey: 30 },
          land: 'You put down four kilometres from whatever the survey saw. From the ramp, at dusk, some of the crew say they can see it. They do not agree on what it looks like.' },
};
function wpick(s, weights) { const ks = Object.keys(weights); let r = rand(s) * ks.reduce((a, k) => a + weights[k], 0); for (const k of ks) { r -= weights[k]; if (r <= 0) return k; } return ks[ks.length - 1]; }
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);

LF.makeFactor = function (s, A, kind, sev, late, usedNames) {
  const K = LF.KINDS[kind], allowed = (A.subs && A.subs[kind]) || Object.keys(K.subs);
  const sub = pick(s, allowed), S = K.subs[sub];
  let name, tries = 0;
  do { name = S.names ? pick(s, S.names) : 'the ' + pick(s, A.prefixes) + '-' + pick(s, S.suf); } while (usedNames.includes(name) && ++tries < 20);
  usedNames.push(name);
  const one = K.mass || S.names ? name : 'a ' + name.slice(4).replace(/s$/, '');
  if (S.late) late = true;
  return { id: 'f' + s.factors.length, kind, sub, name, Name: cap1(name), one, sev, late,
    onset: late ? ri(s, 150, 300) : rand(s) < 0.55 ? ri(s, 22, 95) : ri(s, 110, 230),
    stage: 0, threat: 10 + sev * 6, insight: 0, accord: 0, harm: 0, uses: {}, kills: 0, last: -999, res: null, resDay: 0 };
};

/* A world is built from a candidate (see makeAdrift): its type, how far it was (j, 0..1) and a small private
   adjustment. Bounty is paid for in threat points; a longer burn buys a slightly kinder world. Everything here is
   drawn from s.rng, so the same candidate seed always builds the same world. */
LF.makeWorld = function (s, c) {
  c = c || {};
  const key = c.type || pick(s, LF.DEALT), A = LF.ARCHETYPES[key], j = c.j || 0;
  let pts = Math.max(2, A.pts + (c.adj || 0) - Math.round(j * 2.5));
  s.yieldBonus = A.yield + 0.02;   // +0.02 for every world (2026-11-14): the variance the openings and drawn holds add, and the four minor threads (thread-small.js)
  s.world = { type: key, kind: c.kind || LF.worldOf(key), site: c.site === undefined ? null : c.site, cls: A.cls, j, threatPts: pts, planet: c.desig || c.name || pick(s, PLANETS), sid: c.name || '', star: c.star || '', climate: wpick(s, A.climate), arcs: [], mysteries: [], grav0: c.grav || 0 };
  s.world.arcs.push(s.world.climate);
  s.factors = [];
  const names = [], kindsUsed = {};
  let sigs = 0, guard = 0;
  while (pts > 0 && s.factors.length + sigs < 5 && guard++ < 40) {
    const kind = wpick(s, A.kinds);
    if (kindsUsed[kind] && !((A.multi || []).includes(kind) && kindsUsed[kind] < 3)) continue;
    // Hand-written signature arcs stand in for a generated factor of the same kind, some of the time.
    if (SIGNATURE[kind] && !kindsUsed[kind] && sigs < 2 && rand(s) < 0.35) {
      kindsUsed[kind] = 1; sigs++; pts -= 2; s.world.arcs.push(SIGNATURE[kind]); s.world.mysteries.push(SIGNATURE[kind]); continue;
    }
    const late = rand(s) < A.late;
    let sev = Math.min(3, Math.max(1, Math.min(pts, ri(s, 1, 3))));
    if (late && sev < 2) sev = 2;                       // what waits, waits for a reason
    kindsUsed[kind] = (kindsUsed[kind] || 0) + 1; pts -= sev;
    s.factors.push(LF.makeFactor(s, A, kind, sev, late, names));
  }
  if (!s.factors.some(f => f.kind === 'plague')) s.world.arcs.push('fever');
  truth(s, A);
  // The unexplored interior: a source of leads, paced by how hard the colony surveys.
  s.factors.push({ id: 'f' + s.factors.length, kind: 'land', sub: 'land', name: 'the interior', Name: 'The interior', one: 'the interior', sev: 2, stage: 0, next: 18, seen: {}, threat: 0, insight: 0, accord: 0, harm: 0, uses: {}, kills: 0, last: -999, res: null });
  if (key === 'barren') s.flags.no_native = true;
  // Landing zones: three of four, "near" only if there is something visible to be near.
  const vis = s.factors.filter(f => !f.late && f.kind !== 'land').sort((a, b) => a.onset - b.onset)[0];
  let types = ['wet', 'high', 'deep', 'near'].filter(t => t !== 'near' || vis || s.world.mysteries.length);
  while (types.length > 3) types.splice(ri(s, 0, types.length - 1), 1);
  s.world.zones = types.map(t => ({ t, name: A.zones[t] }));
  s.world.rumour = vis ? vis.id : null;
};

/* ---------- what is actually true of the world, in the terms a telescope measures ---------- */
function truth(s, A) {
  const w = s.world, sev = ks => s.factors.filter(f => ks.includes(f.kind)).reduce((a, f) => a + f.sev, 0);
  const water = ri(s, A.sv.water[0], A.sv.water[1]);
  const temp = ri(s, A.sv.temp[0], A.sv.temp[1]) - (w.climate === 'winter' ? 6 : 0);
  let grav = Math.round((0.72 + rand(s) * 0.4 + rand(s) * 0.28) * 100) / 100;
  if (w.grav0) grav = w.grav0;   // one planet, one gravity, whichever site (makeAdrift)
  const bio = clamp(ri(s, A.sv.bio[0], A.sv.bio[1]) + 3 * sev(['fauna', 'flora', 'plague']) + (w.mysteries.includes('understory') ? 6 : 0), 0, 100);
  // Technosignature: things that were made, plus whatever merely looks made from this far off.
  let made = 0;
  for (const f of s.factors) {
    if (f.kind === 'ruin') made += 10 + 9 * f.sev;
    else if (f.kind === 'natives') made += ['nomad', 'deep'].includes(f.sub) ? 2 + 3 * f.sev : 5 + 6 * f.sev;
    else if (f.kind === 'humans' && f.sub === 'feral') made += 8 + 5 * f.sev;
  }
  made += (w.mysteries.includes('builders') ? 28 : 0) + (w.mysteries.includes('others') ? 14 : 0) + (w.mysteries.includes('hive') ? 10 : 0);
  const noise = rand(s) < 0.45 ? ri(s, 8, 34) : ri(s, 0, 5), cause = rand(s) < 0.6 ? 'volcanic' : 'chemical';
  const tech = clamp(made + noise, 0, 100);
  w.techCause = tech < 12 ? 'none' : made < 6 ? cause : noise > made ? 'mixed' : 'made';
  // System hazards: a flare star is a climate; debris falls on whoever is underneath it.
  let debris = Math.round(100 * rand(s) * rand(s)), flare = w.climate === 'flare' ? ri(s, 55, 95) : ri(s, 3, 30);
  if (w.climate === 'flare') debris = Math.round(debris * 0.4);
  w.grav = grav; w.debris = debris / 100;
  w.truth = { water, temp, grav, bio, tech, haz: Math.max(flare, debris) };
  w.hazKind = flare >= debris ? 'flare' : 'debris';
}

/* ---------- adrift: the long-range survey, and its error bars ---------- */
const PLANETS = ['Tessaly', 'Anwen', 'Hesper', 'Lowe', 'Second Thaw', 'Marrow', 'Kestrel', 'Ostara', 'Brannoch', 'Ysolde', 'Cinder', 'Halcyon'];
LF.SHIP = 'Ariadne';   // the ship has one name, in every game
LF.PROPS = { // scale, typical bar width as a share of the scale, and the words for each band
  water: { name: 'Surface water', unit: '%', min: 0, max: 100, w: 0.3, bands: [[12, 'desert'], [35, 'dry'], [65, 'temperate'], [85, 'wet'], [101, 'ocean']] },
  temp:  { name: 'Mean temperature', unit: '°C', min: -60, max: 60, w: 0.28, bands: [[-25, 'frozen'], [0, 'cold'], [16, 'cool'], [27, 'warm'], [61, 'hot']] },
  grav:  { name: 'Gravity', unit: ' g', min: 0.5, max: 1.6, w: 0.3, dp: 2, bands: [[0.82, 'light'], [1.12, 'Earth-like'], [1.3, 'heavy'], [9, 'punishing']] },
  bio:   { name: 'Biosignature', unit: '', min: 0, max: 100, w: 0.34, bands: [[10, 'sterile'], [30, 'sparse'], [60, 'living'], [85, 'rich'], [101, 'teeming']] },
  tech:  { name: 'Technosignature', unit: '', min: 0, max: 100, w: 0.34, bands: [[12, 'silent'], [30, 'faint'], [55, 'unexplained'], [101, 'structured']] },
  haz:   { name: 'System hazards', unit: '', min: 0, max: 100, w: 0.34, bands: [[20, 'quiet'], [45, 'unsettled'], [70, 'active'], [101, 'violent']] },
};
/* A star nobody has visited has a catalogue number and nothing else. From a hash of the key, never from s.rng. */
LF.starName = function (key, taken) {
  let h = 2166136261; for (const ch of String(key) + '/star') h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h >>>= 0;
  for (let n = 0; n < 20; n++) { const cat = ['HD', 'HIP', 'GJ', 'LHS', 'TYC', 'KOI'][(h + n) % 6], num = cat === 'GJ' || cat === 'LHS' ? 1000 + (h >>> 5) % 8000 : cat === 'KOI' ? 100 + (h >>> 5) % 7900 : 10000 + (h >>> 5) % 180000;
    const name = `${cat} ${num}`; if (!(taken || []).includes(name)) return name; h = Math.imul(h ^ 0x9e3779b9, 16777619) >>> 0; }
  return 'HD ' + (h % 90000 + 10000);
};
const band = (k, v) => LF.PROPS[k].bands.find(b => v < b[0])[1];
LF.fmt = (k, v) => { const D = LF.PROPS[k]; return (D.dp ? v.toFixed(D.dp) : String(Math.round(v))).replace('-', '−'); };
LF.gloss = function (k, r) { // what the bar means in words, from one end of it to the other
  const a = band(k, r.lo), b = band(k, r.hi); let t = a === b ? a : `${a} to ${b}`;
  if (k === 'tech' && r.hi >= 30) t += '. Artefacts, vulcanism, or chemistry nobody has catalogued';
  if (k === 'bio' && r.lo < 10 && r.hi >= 30) t += '. Life, or photochemistry that looks like it';
  if (k === 'haz' && r.hi >= 45) t += r.kind === 'flare' ? '. Flare activity on the star' : '. Debris across the orbit';
  return t.charAt(0).toUpperCase() + t.slice(1);
};
/* One reading: a bar and a stated confidence. The confidence is honest: it is the chance the truth is inside the
   bar. The truth is not, in general, in the middle of it. Further away, the bars are wider. */
function reading(s, k, actual, j) {
  const D = LF.PROPS[k], span = D.max - D.min, p = D.dp ? 100 : 1, rd = v => Math.round(v * p) / p;
  const conf = ri(s, 11, 19) * 5, w = span * D.w * (0.45 + 0.9 * j + 0.55 * rand(s));
  let lo = rand(s) * 100 < conf ? actual - w * (0.08 + 0.84 * rand(s))
    : rand(s) < 0.5 ? actual + w * (0.06 + 0.3 * rand(s)) : actual - w * (1.06 + 0.3 * rand(s));
  lo = clamp(lo, D.min, D.max - w);
  return { k, lo: rd(lo), hi: rd(lo + w), conf, actual };
}
/* ---------- why the ship is adrift ----------
   Different every game, and mostly narrative: it picks the intro's shots (js/intro.js), the opening text on the
   adrift screen, the first line of the chronicle and a report or two later on. Chosen from a hash of the seed, not
   from s.rng, so it changes nothing else about the game. Only the meteor strike touches the rules: one machine
   comes down with a lower ceiling. */
LF.PREMISES = {
  dead:    { name: 'A dead world', intro: 'The target world has no air and no oceans.',
    text: s => `The two on watch woke you early, and then the other four. The world you were sent to is where the survey said it would be, but the air is gone, and whatever took it took the oceans too.`,
    chron: 'The world the mission was sent to was dead when the ship arrived.', report: 'Somebody has started a list, pinned in the mess hall, of theories about what killed the first world. It runs to three pages so far.' },
  meteor:  { name: 'A meteor strike', intro: 'Something small and very fast went through the forward hull.',
    text: s => `Eleven days short of the target, something the size of a fist went through the ${s}'s forward hull at a speed nobody wants to say out loud. The hull patch is holding, but the navigation array failed and the ship overshot, and the target is behind you now, with no mass to turn back for it.`,
    chron: 'A meteor struck the ship on the approach and carried it past the world it was sent to.', report: 'The meteor patch on the ship\'s forward hull glints when it passes overhead at dusk. People point it out to the sleepers they wake.',
    touch: (s, ids) => { const id = LF.pick(s, ids); s.machines[id].cap = Math.max(60, s.machines[id].cap - 8); s.machines[id].hp = Math.min(s.machines[id].hp, s.machines[id].cap); LF.log(s, `The ${LF.MACHINES[id].name} still has meteor fragments in its housing, and it has run rough ever since.`, 'bad'); } },
  engine:  { name: 'A failing engine', intro: 'The main engine has one burn left in it.',
    text: s => `The ${s}'s main engine is failing. Jeremy gives it one more long burn before the bearings seize, and the target is two burns away. Whatever world the ship burns for next is where it will stay.`,
    chron: 'The main engine had one burn left in it, and the target was two burns away.', report: 'The engineers have taken the old main engine\'s bearing out of the ship\'s memory and drawn it full size on the workshop wall, with the worn faces shaded in.' },
  cryo:    { name: 'Failing cryo', intro: 'The cryo banks are failing faster than anyone promised.',
    text: s => `The ${s}'s cryo banks are failing faster than the mission promised. At this rate the sleepers will not last the thirty years still to go. There has to be somewhere closer.`,
    chron: 'The cryo banks were failing, and the sleepers would not have lived to see the world they were sent to.', report: 'The cryo technicians check the sleepers in orbit every week by radio, and read the numbers out at supper whether anyone asks or not.' },
  claimed: { name: 'Someone got there first', intro: 'A beacon, from the target: occupied. Turn back.',
    text: s => `There is a beacon on the world the ${s} was sent to. The beacon is human and old, and it repeats one message on every band: the world is taken, and it will not be shared. The armaments listed in the message are not ones this ship can argue with.`,
    chron: 'The world the mission was sent to was already claimed, and its claimants said so.', report: 'The radio room still picks up the warning beacon from the first world on clear nights. Someone has started turning it off.' },
  astray:  { name: 'Off course', intro: 'The stars are in the wrong places. The ship is off course.',
    text: s => `The star field does not match the charts. Some time in the last forty-one years a navigation fault crept in, and the ${s} has woken in a system nobody planned for, eleven light-years from where it should be. The target is too far to reach now.`,
    chron: 'The ship woke in the wrong system, decades off course.', report: 'The pilot still runs the old navigation fault in simulation some nights, looking for the moment it went wrong.' },
  bloom:   { name: 'Mould in the stores', intro: 'Something grey is growing in the hydroponics.',
    text: s => `A grey mould got into the ${s}'s hydroponics and the seed stores, and all six of your officers were woken to fight it. They saved most of the seed, but not enough food to reach the target, sixty years on.`,
    chron: 'A mould in the ship\'s stores woke all six officers early and put the target out of reach.', report: 'The agronomists still burn a sample of every harvest, looking for the grey mould that nearly ended the mission. Every sample so far has been clean.' },
};
LF.premiseOf = seed => { const k = Object.keys(LF.PREMISES); let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return k[(h >>> 0) % k.length]; };
LF.makeAdrift = function (s) {
  // three candidates, always the same three kinds of world (LF.WORLDS), shuffled, nearest first; names, stars and distances per game
  const types = Object.keys(LF.WORLDS), names = PLANETS.slice(), n = 3, cands = [];
  for (let i = types.length - 1; i > 0; i--) { const q = ri(s, 0, i); [types[i], types[q]] = [types[q], types[i]]; }
  for (let i = 0; i < n; i++) {
    const W = LF.WORLDS[types[i]];
    const j = clamp((i + 0.15 + 0.7 * rand(s)) / n, 0, 1), ly = Math.round((1.9 + 7.4 * j) * 10) / 10;
    const c = { kind: types[i], sites: W.sites.slice(), type: W.sites[0], j, ly, years: Math.round(ly * 4.4), adj: ri(s, -1, 1), seed: (rand(s) * 2147483647) | 0, name: (names.splice(ri(s, 0, names.length - 1), 1), LF.planetName(`${s.seed}/${i}`, cands.map(x => x.name))) };
    c.star = LF.starName(`${s.seed}/${i}`, cands.map(x => x.star)); c.desig = `${c.star} ${'bcde'[c.seed & 3]}`;   // a catalogue number is all anyone has until the ship is in orbit and somebody names the place
    // the telescope sees the whole planet: each reading is of both sites together, and the gravity is the planet's
    const x = { rng: c.seed, flags: {}, factors: [] }; LF.makeWorld(x, c); c.grav = x.world.grav;
    const y = { rng: c.seed, flags: {}, factors: [] }; LF.makeWorld(y, Object.assign({}, c, { type: W.sites[1] }));
    const mix = k => { const v = (x.world.truth[k] + y.world.truth[k]) / 2; return LF.PROPS[k].dp ? Math.round(v * 100) / 100 : Math.round(v); };
    c.readings = Object.keys(LF.PROPS).map(k => reading(s, k, mix(k), j));
    c.readings[5].kind = x.world.truth.haz >= y.world.truth.haz ? x.world.hazKind : y.world.hazKind;
    cands.push(c);
  }
  // The ship's own stores are the same whichever world is chosen. What differs is how much survives the burn.
  s.adrift = { ship: LF.SHIP, cands, kit: { pop: ri(s, 56, 64), food: ri(s, 40, 46) * 100, parts: ri(s, 28, 34), mat: ri(s, 58, 72), sleepers: ri(s, 13, 15) * 10 } };
};
LF.transitRisk = c => ({ lo: Math.round(100 * (0.02 + 0.15 * c.j) * 0.6), hi: Math.round(100 * (0.02 + 0.15 * c.j) * 1.4), wear: c.j < 0.34 ? 'light' : c.j < 0.67 ? 'moderate' : 'heavy' });
/* Commit to one candidate. The burn costs sleepers, a few of those thawed for the landing, stores and machine life, in proportion
   to its length; never ruinously. */
LF.embark = function (s, i, site) {
  const c0 = s.adrift.cands[i], k = s.adrift.kit, j = c0.j, si = c0.sites ? (site ? 1 : 0) : null;   // site: 0 the easy one, 1 the hard one
  const c = Object.assign({}, c0, si === null ? {} : { type: c0.sites[si], site: si }), A = LF.ARCHETYPES[c.type];
  s.rng = c.seed; LF.makeWorld(s, c);
  const w = s.world; w.ship = s.adrift.ship; w.readings = c.readings; w.hydro = 0.96 - 0.05 * j;
  const lostS = Math.round(k.sleepers * (0.02 + 0.15 * j) * (0.6 + 0.8 * rand(s))), lostP = Math.round(5 * j * (0.4 + rand(s)));
  s.pop = k.pop - lostP; s.sleepers = k.sleepers - lostS;
  s.res = { food: Math.round(k.food * (1 - 0.1 * j) / 10) * 10, mat: k.mat + A.mat, parts: Math.round(k.parts * (1 - 0.22 * j)) };
  w.transit = { ly: c.ly, years: c.years, lostS, lostP, s0: k.sleepers, p0: k.pop };
  w.secondWound = j > 0.7 && rand(s) < 0.6;
  // The crossing is played, not rolled: s.voyage holds how the ship is crossing and what met it on the way
  // (content-setup.js, voy.*). s.arrival is set when the ship makes orbit, and cleared when the world has a name.
  s.adrift = null; s.voyage = { mode: null, inc: null };
  LF.land(s);
  orbitalReport(s);
};
/* Not on the ground yet: under way, or in orbit before the lander goes down. The views have nothing to show. */
LF.aloft = s => !!s.adrift || !(s.world && s.world.zone);

/* ---------- the survey on arrival ----------
   There is one survey, done from orbit when the ship arrives, and it is more than the array could manage: the
   readings resolved, what can be seen of the landing zones, where the metal probably is, water and weather, and a
   handful of features big enough to name. Anything orbit cannot settle carries an honest confidence. What it fixes
   (the ore body, the first ground known) is all the colony gets for free; the rest costs expeditions. */
const FEATURES = {
  barren:  [['the Anvil', 'a flat-topped mesa twenty kilometres across'], ['Long Scar', 'a fault line that runs to the horizon'], ['the Salt Eye', 'a white pan, perfectly round'], ['Rust Hills', 'red ridges, deeply cut'], ['the Teeth', 'a row of eroded stacks'], ['Dry Fork', 'the bed of a river that has not run in an age']],
  ruin:    [['the Grid', 'a pattern of straight lines under the dust'], ['Broken Tower', 'a spire, snapped halfway'], ['the Causeway', 'a raised road across a dry sea'], ['Glass Fields', 'sand fused into sheets'], ['the Bowl', 'a crater too regular for a meteor'], ['Cinder Reach', 'a scorched plain, old burns']],
  ice:     [['the White Shoulder', 'an ice cap spilling into the lowlands'], ['Blue Gate', 'a gap in the glaciers'], ['the Steaming Lakes', 'open water in the ice, warmer than it should be'], ['Hollow Range', 'peaks with caves at the snow line'], ['Floe Sound', 'pack ice grinding against a cliff'], ['the Moraine', 'a wall of rubble a glacier left']],
  drowned: [['the Long Reef', 'a reef a hundred kilometres long'], ['Caldera Island', 'a drowned volcano, still warm'], ['the Shallows', 'sea a person could wade, for miles'], ['Kelp Deep', 'dark water thick with growth'], ['the Stacks', 'sea pillars, white with droppings'], ['Tide Flats', 'mud that the sea uncovers twice a day']],
  jungle:  [['the Green Wall', 'canopy so dense the radar skips off it'], ['Red River', 'a river the colour of rust'], ['the Sinks', 'a field of round holes in limestone'], ['Mist Valley', 'cloud that never lifts'], ['the Burn', 'a scar where the forest is growing back'], ['Hanging Falls', 'a cliff with water coming off it in sheets']],
  garden:  [['the Long Meadow', 'grassland, mile after mile'], ['Silver Water', 'a lake the shape of a hand'], ['the Downs', 'rolling chalk hills'], ['Old Wood', 'forest older than anything else in view'], ['the Fords', 'a river braided into shallows'], ['High Moor', 'heath on a plateau, cold and open']],
};
const ORE_TXT = {
  near: 'Iron-nickel signatures within a day\'s walk of every landing zone.',
  hills: 'Metal-bearing rock, probably, in the high ground two to four days out. Orbit cannot tell an ore body from a stained cliff.',
  far: 'Only faint metal signatures, far inland and broken up. If there is a workable body, it is a long way off.',
};
const ZONE_SEE = { wet: 'open water and the greenest ground in view', high: 'bare rock, wind, and long sight lines', deep: 'walls of stone on three sides and a strip of sky', near: 'the one thing the survey cannot explain, close enough to walk to' };
function orbitalReport(s) {
  const w = s.world, A = LF.ARCHETYPES[w.type];
  const r0 = rand(s); w.oreBody = r0 < (A.ore || 0.26) ? 'near' : r0 < 0.72 ? 'hills' : 'far';
  // the report is right as often as it says it is
  const conf = { near: 90, hills: ri(s, 12, 16) * 5, far: ri(s, 7, 10) * 5 }[w.oreBody], ores = ['near', 'hills', 'far'];
  const said = rand(s) * 100 < conf ? w.oreBody : pick(s, ores.filter(o => o !== w.oreBody));
  const wconf = ri(s, 12, 17) * 5, clim = rand(s) * 100 < wconf ? w.climate : pick(s, ['flare', 'winter', 'storm'].filter(c => c !== w.climate));
  const feats = FEATURES[w.type].slice(); for (let i = feats.length - 1; i > 0; i--) { const q = ri(s, 0, i); [feats[i], feats[q]] = [feats[q], feats[i]]; }
  w.report = {
    ore: { said, conf, text: ORE_TXT[said] },
    water: w.truth.water < 20 ? 'Almost no standing water. Wells will have to go deep.' : w.truth.water > 60 ? 'Water everywhere: lakes, rivers, sea. Wells will be shallow.' : 'Rivers and lakes enough. Wells will be ordinary work.',
    weather: { said: clim, conf: wconf, text: { flare: 'The star flares, and the surface takes the full force of it.', winter: 'The orbit is long and tilted, so the winters will be long.', storm: 'The atmosphere is busy. Storms the size of continents come through every season.' }[clim] },
    zones: w.zones.map(z => ({ name: z.name, see: ZONE_SEE[z.t] })),
    features: feats.slice(0, 4).map(([name, see]) => ({ name, see })),
  };
  s.survey = 20;   // the orbital map: enough for the first lead from the interior
}
LF.zone = (s, i) => { const z = s.world.zones[i]; return z ? Object.assign({}, ZONES[z.t], z) : null; };

const RUMOUR = {
  understory: 'a stretch of ground whose infrared signature pulses, slowly, like something breathing',
  builders: 'a shadow under the surface with edges too straight for geology',
  others: 'a glint of worked metal, and a scorch mark that is not ours',
  hive: 'low mounds, evenly spaced, that were not there on the first pass',
};
const CAUSE = {
  volcanic: 'The technosignature resolves, from orbit, into a chain of volcanic vents pulsing with a regularity that fooled the array.',
  chemical: 'The technosignature resolves, from orbit, into a periodic chemical cycle in the upper air that nobody made.',
  mixed: 'Part of the technosignature is vulcanism. The rest does not resolve into anything natural.',
  made: 'The technosignature does not resolve into anything natural.',
};
/* What orbit shows that the long-range array could not. */
LF.arrivalNotes = function (s) {
  const w = s.world, out = [], miss = w.readings.filter(r => r.actual < r.lo || r.actual > r.hi);
  if (miss.length) out.push(`${miss.map(r => LF.PROPS[r.k].name).join(' and ')}: outside what the array allowed for.`);
  if (w.type === 'ruin') out.push('Somebody built across this whole world. The survey finds nobody living in any of it.');
  if (CAUSE[w.techCause]) out.push(CAUSE[w.techCause]);
  if (w.truth.haz >= 45) out.push(w.hazKind === 'flare' ? 'The star flares. The hull counters have been climbing since the ship crossed the heliopause.' : 'The orbit is dirty: rock and ice in crossing paths, some of it certain to come down.');
  if (w.truth.water < 20) out.push('Water will have to be dug for, deep.');
  if (w.truth.temp < -15 || w.truth.temp > 32) out.push('The cargo pods were not built for this climate. People will want real walls.');
  if (w.grav >= 1.15) out.push(`At ${w.grav.toFixed(2)} g, every job will take longer and every bearing will wear faster.`);
  else if (w.grav <= 0.85) out.push(`At ${w.grav.toFixed(2)} g, the work will be lighter than anyone trained for.`);
  return out;
};
LF.transitText = function (s) {
  const t = s.world.transit, N = n => ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][n] || String(n);
  const V = s.voyage || {}, how = ((LF.CROSSING || {})[V.mode] || {}).how || '';   // the ways across, content-setup.js
  return `${how} ${t.years} years under way. ${t.lostS ? `${N(t.lostS)} of the sleepers did not survive ${t.lostS === 1 ? 'the' : 'their'} cryo bank${t.lostS === 1 ? '' : 's'} failing` : 'Every cryo bank held'}${t.lostP ? `, and ${N(t.lostP).toLowerCase()} of those awake for it did not live to see orbit` : ''}. The machines are ${t.years} years older than they were built to be at landfall.`.trim();
};
/* The anomaly: the one thing orbit saw and could not explain. A landing zone "beside the anomaly" means this, so
   the survey has to say what it is before it names the zone. Null when the world shows nothing of the kind. */
LF.anomaly = function (s) {
  const w = s.world, f = w.rumour && s.factors.find(x => x.id === w.rumour);
  return w.mysteries.length ? RUMOUR[w.mysteries[0]] : f ? f.kind === 'ruin' ? FROM_ORBIT[f.sub] || LF.KINDS.ruin.subs[f.sub].sign : 'movement the scans could not classify' : null;
};
// What each kind of ruin looks like from orbit (its first sign on the ground is often something only a camp would see).
const FROM_ORBIT = { vault: 'a radar return too square to be geology', engine: 'a patch of ground that shivers every ninety-one minutes, exactly', weapon: 'a ring of scorched ground with clean edges, and nothing growing inside it',
  archive: 'a faint carrier on one band, repeating a long string of numbers', nursery: 'warmth under the ground, in a regular grid' };
LF.briefing = function (s) {
  const A = LF.ARCHETYPES[s.world.type], w = s.world;
  const hint = LF.anomaly(s);
  const T = w.kind && w.site !== null && LF.SITE_TERMS[w.type], other = T && LF.SITE_TERMS[LF.WORLDS[w.kind].sites[1 - w.site]];
  return `${w.planet}, from orbit: ${A.name.toLowerCase()}. ${A.blurb}${T ? ` The lander is bound for ${T.site}, not ${other.site}. ${T.gives} ${T.costs}` : ''}\n\n${s.pop} of you are awake, and ${s.sleepers} sleep on aboard the ${w.ship}. The lander can set the reactor down once.`
    + (hint ? ` The orbital pass flagged one anomaly: ${hint}.` : '')
    + `\n\nEarth is ${41 + w.transit.years} years behind you. Choose your ground.`;
};
})();

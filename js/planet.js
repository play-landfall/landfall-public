/* Landfall — planet names, and what the survey from orbit saw, told as prose.
   Names are made from syllables (or, now and then, from two words the way crews name things), so a player meets a
   new world every game instead of learning a list of twelve. The description is three paragraphs written from the
   world's true readings once the orbital survey is done: how it looks, what lives and stands on it, and what orbit
   cannot settle. Both draw on a hash of the seed, never on s.rng, so play is unchanged. No DOM. */
(function () {
'use strict';
/* a small deterministic stream from any string */
const hash = str => { let x = 2166136261; for (const c of String(str)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
const stream = key => { let x = hash(key) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ---------- names ---------- */
const START = ['Al', 'Ber', 'Cal', 'Dar', 'Ell', 'Fen', 'Gal', 'Hal', 'Is', 'Kes', 'Lor', 'Mar', 'Nor', 'Os', 'Per', 'Quel', 'Ros', 'Sel', 'Tor', 'Ul', 'Val', 'Wen', 'Yar', 'Zan',
  'Ash', 'Bry', 'Cor', 'Dun', 'Esk', 'Har', 'Ivo', 'Jor', 'Lyn', 'Mer', 'Ny', 'Ori', 'Rhe', 'Sol', 'Tam', 'Vey', 'Ard', 'Bel', 'Cair', 'Ev', 'Gwen', 'Ket', 'Mab', 'Sab'];
const MID = ['', '', '', 'a', 'e', 'i', 'o', 'an', 'en', 'ar', 'or', 'el', 'is', 'am', 'ov'];
const END = ['a', 'ia', 'is', 'on', 'eth', 'ar', 'en', 'ys', 'ane', 'ow', 'ine', 'ard', 'ora', 'ell', 'ith', 'und', 'ast', 'ere', 'ale', 'ion', 'ey', 'os', 'um'];
const FIRST = ['Second', 'Far', 'Last', 'Low', 'High', 'Old', 'Little', 'Slow', 'Quiet', 'Long', 'Grey', 'Late'];
const NOUN = ['Thaw', 'Harbour', 'Mercy', 'Lantern', 'Ember', 'Reach', 'Haven', 'Hollow', 'Tide', 'Orchard', 'Ash', 'Anchor', 'Hearth', 'Promise', 'Shore', 'Bell'];
const BAD = /([aeiouy])\1|[aeiouy]{3}|[^aeiouy]{3}/;
LF.planetName = function (key, taken) {
  const r = stream(key);
  for (let tries = 0; tries < 60; tries++) {
    const n = r() < 0.14 ? `${pick(r, FIRST)} ${pick(r, NOUN)}` : pick(r, START) + pick(r, MID) + pick(r, END);
    if ((n.includes(' ') || (n.length >= 4 && n.length <= 9 && !BAD.test(n.toLowerCase()))) && !(taken || []).includes(n)) return n;
  }
  return 'Waypoint ' + (hash(key) % 90 + 10);
};

/* ---------- the survey, as prose ---------- */
const LOOK = {
  barren: ['From orbit it is the colour of rust and old bone, with a grey-green bloom on every slope that faces away from the wind.',
           'A rock world, red and grey, with a thin film of life on it that only shows in the infrared, like breath on a window.',
           'Bare stone from pole to pole, scored by wind into long parallel ridges, and a green-grey crust in every hollow out of the weather.'],
  ruin:    ['From orbit one continent is scored with straight lines too long and too regular to be anything but made.',
           'A dry world, dun and ochre, crossed by the ghosts of roads. In low sun the old field boundaries show through the dust.',
           'At first pass it looks like any dry world. On the second, with the sun low, the plains are ruled into squares.'],
  ice:     ['Ice sheets come down from both poles over whole continents, and stop at a narrow dark fringe where they meet the sea.',
           'Ice to the horizon, blue in the crevasses and white everywhere else, with a thin warm seam of open ground along the coast.',
           'From orbit it is mostly glare. Where the ice thins there are black rock, steam, and a band of something growing.'],
  drowned: ['Sea round the middle of the world, white where the ice comes down at the poles and turquoise over the shallows, with island chains strung across it like beads.',
           'An ocean with islands in it: dark volcanic peaks, white reefs, and a tide that visibly moves the coastlines from one pass to the next.',
           'Water everywhere, and under it shapes the radar cannot settle. The land is a scatter of islands and one long ragged shelf.'],
  jungle:  ['A belt of green across the middle of the world, the deep green of wet leaves, and loud in every band the instruments have.',
           'A hothouse. Cloud banks over endless canopy, rivers the colour of tea, and heat that shows from orbit as a haze on everything.',
           'Every surface that is not water is growing something, and most of the water is too. Even the mountains are green to the snowline.'],
  garden:  ['Meadows, clear rivers and a sky the colour of the old photographs. It looks better than the array promised.',
           'Green and gold, with lakes and long rolling grassland and forest on the hills. People crowd the viewport and do not say much.',
           'A temperate world: white cloud, blue sea, green land, and weather that moves across it as gently as anyone could ask.'],
};
const BIO = [[15, 'Life here is thin: crusts, films and mats, nothing that moves faster than a season.'], [40, 'There is life, mostly small and low to the ground, and some of it moves.'],
  [70, 'There is a great deal of life: the spectra are thick with it, and some of it is large enough to show from orbit as herds, or shoals, or shadows.'], [101, 'Life is everywhere and in everything, and the instruments cannot separate one kind from the next.']];
const TECH = { none: 'Nothing on the surface looks made.', volcanic: 'What the array took for a technosignature is a chain of vents breathing on a timetable.',
  chemical: 'What the array took for a technosignature is a cycle in the upper air, regular as a clock and made by nobody.', mixed: 'Part of the technosignature is vulcanism, and nobody can say what the rest is.',
  made: 'The technosignature does not go away on a closer look. Something on this world was made.' };
/* A graveyard world is covered in things that were made. What the array heard is a separate question: whether any of it is still running. */
const RUIN_TECH = { none: 'The roads and towers were built by someone, and none of it is running: no lights on the night side, no heat in the cities, nothing moving.',
  volcanic: 'The roads and towers were built by someone, and none of it is running. What the array took for a technosignature is a chain of vents breathing on a timetable.',
  chemical: 'The roads and towers were built by someone, and none of it is running. What the array took for a technosignature is a cycle in the upper air, regular as a clock.',
  mixed: 'The roads and towers were built by someone, and almost none of it is running. Some of the technosignature is vulcanism. The rest comes from among the ruins.',
  made: 'The roads and towers were built by someone, and most of it is dead. The technosignature comes from among the ruins, and it does not go away on a closer look.' };
const WEATHER = { flare: 'the star flares, hard, and the surface takes the full force of it', winter: 'the year is long and the axis steeply tilted, and the winters will be long', storm: 'the air is restless, and storms the size of continents cross it every season' };
const CLOSE = ['None of that says what it will be like to live there.', 'It is the only world there is now. The lander is being fuelled.',
  'The officers read the survey twice and then stop reading it and start planning.', 'The rest will have to be learned on foot.', 'The sleepers will wake to whatever the landing party makes of it.'];
const months = d => d < 22 ? 'short' : d < 30 ? 'about an Earth day' : 'long';
LF.sky = function (s) {   // fixed facts about the sky, for any text that needs them
  const w = s.world, r = stream(`${s.seed}/${w.sid || w.planet}/sky`); return { moons: w.type === 'drowned' ? 2 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3), day: 16 + Math.floor(r() * 26) };
};
LF.planetStory = function (s) {
  const w = s.world, t = w.truth, A = LF.ARCHETYPES[w.type], r = stream(`${s.seed}/${w.sid || w.planet}/story`), sky = LF.sky(s), R = w.report || { features: [], zones: [] };
  const N = ['no', 'one', 'two', 'three', 'four'], f = R.features || [];
  const temp = t.temp < -25 ? 'bitterly cold' : t.temp < -5 ? 'cold' : t.temp < 12 ? 'cool' : t.temp < 26 ? 'mild' : t.temp < 35 ? 'hot' : 'very hot';
  const grav = w.grav >= 1.15 ? `It is heavy: everyone will weigh a ${w.grav >= 1.3 ? 'third' : 'sixth'} more down there, and feel it by evening.` : w.grav <= 0.85 ? 'It is light: people will move like children down there for the first weeks.' : 'Its pull is close to Earth\'s.';
  const p1 = `${pick(r, LOOK[w.type])} ${cap(w.planet)} turns once in ${sky.day} hours, ${months(sky.day) === 'short' ? 'a short day' : months(sky.day) === 'long' ? 'a long day' : 'near enough an Earth day'}, under ${N[sky.moons]} moon${sky.moons > 1 ? 's' : ''}. On the ground it will be ${temp}, ${t.water < 20 ? 'and dry' : t.water > 70 ? 'and wet' : 'with water enough'}. ${grav}`;
  const ft = f.length >= 2 ? `The survey names what is big enough to name. ${cap(f[0].name)}, ${f[0].see}. ${cap(f[1].name)}, ${f[1].see}.${f[2] ? ` ${cap(f[2].name)}, ${f[2].see}.` : ''}` : '';
  const bio = BIO.find(b => t.bio < b[0])[1];
  const p2 = `${ft} ${bio} ${(w.type === 'ruin' ? RUIN_TECH : TECH)[w.techCause] || TECH.none}`.trim();
  const said = R.weather ? R.weather.said : w.climate, hz = t.haz >= 45 && !(said === 'flare' && w.hazKind === 'flare') ? (w.hazKind === 'flare' ? ' The hull counters climb every time the star turns its face this way.' : ' The orbit is dirty with rock, and some of it comes down.') : '';
  const ore = R.ore ? ({ near: 'There is metal close to every landing zone.', hills: 'There may be metal in the high ground, a few days out.', far: 'If there is metal worth digging, it is a long way inland.' })[R.ore.said] : '';
  const an = LF.anomaly ? LF.anomaly(s) : null, odd = an ? ` One thing on the scans has no explanation: ${an}. The survey marks it as the anomaly.` : '';
  const z = (R.zones || []).map(x => x.name), zs = z.length ? ` The lander can reach ${z.length === 1 ? z[0] : z.slice(0, -1).join(', ') + ' or ' + z[z.length - 1]}.` : '';
  const p3 = `As far as orbit can tell, ${WEATHER[said] || 'the weather is nothing out of the ordinary'}.${hz} ${ore}${odd}${zs} ${pick(r, CLOSE)}`;
  return [p1, p2, p3].map(x => x.replace(/\s+/g, ' ').trim());
};
})();

/* Landfall — the cinematic intro. UI only.
   A cutscene of still pictures moved, scaled, faded and flickered in CSS: the ship drifting, faces in the cockpit,
   the sleepers, the watch and the failing machinery, then the reason this ship is adrift (s.premise). Shots are drawn
   from a pool and ordered by the seed, so it is not the same twice. On a new game a title card waits for a tap first,
   so the opening score (js/music.js) can start with the pictures. After the burn: the engines, the new world, orbit.
   After the landing site is chosen: the descent. Tap anywhere to skip. Reduced motion: crossfades only.
   Every shot fills the screen, caption over a dark fade at the foot. Space shots are layered: a starfield plate with
   transparent sprites (art/pieces/) moved over it; the stars are drawn live in a canvas (js/stars.js) and the ship's
   engine fire in CSS, not sprites.
   The first shot is the main burn, forty-one years ago: close on the cold drive nozzle, a red glow building in its
   throat, then ignition (all CSS over one still, art/scenes/intro_burn.webp). A shot with sfx plays that sound
   (sfx/<name>.mp3) quietly through js/music.js; skipping the intro fades it out. */
(function () {
'use strict';
const SHOT_MS = 3600;
const hash = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const two = n => String(n).padStart(2, '0');
// pic: a scene id. move: push (slow zoom in), pan, drift. fx: flicker (failing light), flare (engine glow), shake.
// The pool is the ship as it is now: who is awake, what is failing. Three are dealt per game.
const POOL = {
  watch:   s => ({ pic: 'intro_bridge', move: 'push', line: 'Two of your officers have the watch.' }),
  amber:   s => ({ pic: 'lib_tech_05', move: 'push', fx: 'flicker', line: 'Some of the lights on the pods have gone amber.' }),
  array:   s => ({ pic: 'intro_array', move: 'drift', line: 'The long-range array keeps listening.' }),
  reactor: s => ({ pic: 'mach_reactor', move: 'pan', fx: 'flicker', line: 'The reactor has been running for forty-one years.' }),
  window:  s => ({ pic: 'intro_window', move: 'push', line: 'The two on watch look out at the stars and do not talk much.' }),
};
const REVEAL = {
  dead:    { pic: 'lib_planet_05', move: 'push' },
  meteor:  { pic: 'intro_meteor', move: 'drift', fx: 'shake' },
  engine:  { pic: 'mach_reactor', move: 'push', fx: 'flicker' },
  cryo:    { pic: 'lib_tech_05', move: 'pan', fx: 'flicker' },
  claimed: { pic: 'intro_array', move: 'push', fx: 'flicker' },
  astray:  { pic: 'lib_planet_07', move: 'drift' },
  bloom:   { pic: 'lib_tech_02', move: 'push', fx: 'flicker' },
};
const PLANET = { barren: 'lib_planet_05', ice: 'lib_planet_01', drowned: 'lib_planet_02', jungle: 'lib_planet_04', garden: 'lib_planet_09', ruin: 'lib_planet_10' };
/* Layered shots from the raster sprites (tools/pieces.py, art/pieces/), used when they are on disk: a starfield
   plate with sprites moved over it. Each layer is { src, cls }; the class says how it moves (style.css, #intro). */
const P = id => `art/pieces/${id}`;
const LAYERED = {
  // forty-one years out: close alongside the hull in the light of a far sun, the stars sliding past behind it
  cruise: { ms: 6500, alt: { pic: 'intro_cruise', move: 'drift' }, layers: [{ stars: { vx: -14, vy: 1.5 } }, { sun: true }, { src: P('ship.webp'), craft: 'coast' }] },
  burn: { alt: { pic: 'intro_cruise', move: 'push', fx: 'flare' }, layers: [{ stars: { vx: -40, vy: 0 } }, { src: P('ship.webp'), craft: 'big' }] },
  // the camera holds on the planet's edge; the ark's nose slides in from the top-left corner (Lachlan's sketch, 2026-11-14)
  approach: { ms: 6500, alt: { pic: 'lib_planet_09', move: 'drift' }, layers: [{ src: P('limb_garden.webp'), cls: 'limb' }, { src: P('ship_front.webp'), cls: 'bow' }] },
};
/* A craft layer is the ship sprite with its engine fire, drawn in CSS so it flickers like flame (style.css). The fire
   comes after the hull so it is painted over the nozzles, the way exhaust reads, not tucked behind them. */
/* A stars layer is a canvas the starfield (js/stars.js) draws into, drifting at its own speed; a sun layer is a far
   sun with a long anamorphic streak through it, all CSS. */
const layer = l => l.stars ? `<canvas class="bg stars" data-vx="${l.stars.vx}" data-vy="${l.stars.vy}"></canvas>`
  : l.sun ? '<div class="sun"><i></i></div>'
  : l.craft !== undefined
  ? `<div class="craft ${l.craft}"><img src="${l.src}" alt=""><i class="shade" style="--src:url(${l.src})"></i><div class="fire ${l.craft}">${['j1', 'j2', 'j3'].map(j => `<b class="jet ${j}"><i class="f1"></i><i class="f2"></i><i class="f3"></i></b>`).join('')}</div></div>`
  : `<img class="${l.cls}" src="${l.src}" alt="">`;
/* Start every starfield canvas under el; its stopper is kept on the canvas so it can be stopped when its shot goes. */
let skySeed = 1;
const sky = el => { if (!window.LFStars) return; for (const c of el.querySelectorAll('canvas.stars')) if (!c._stop) c._stop = LFStars.mount(c, { seed: skySeed, vx: +c.dataset.vx || 0, vy: +c.dataset.vy || 0 }); };
const unsky = el => { for (const c of el.querySelectorAll('canvas.stars')) if (c._stop) { c._stop(); c._stop = null; } };
const layered = (k, line) => Object.assign({ line }, LAYERED[k]);
/* A new game: the ship drifting, the sleepers, three of the pool, then why it is adrift (s.premise). */
/* rest: after the voyage out (js/content-social.js), the burn has been seen already: the long sleep, then what went wrong. */
function opening(s, rest) {
  const r = rng(hash(s.seed)), ship = s.adrift ? s.adrift.ship : s.world.ship, keys = Object.keys(POOL).filter(k => !rest || k !== 'window');   // the long sleep opens on the porthole already
  for (let i = keys.length - 1; i > 0; i--) { const q = Math.floor(r() * (i + 1)); [keys[i], keys[q]] = [keys[q], keys[i]]; }
  const PM = LF.PREMISES[s.premise] || LF.PREMISES.dead;
  return (rest ? [{ pic: 'intro_window', move: 'push', line: 'Then the long years. Two awake at a time, and everyone else in the cold.' }] : [{ pic: 'intro_burn', move: 'ignite', fx: 'ignite', ms: 7000, sfx: 'burn', line: `Forty-one years ago, the ${ship} lit its drive and left.` }]).concat([
    layered('cruise', `The ${ship}, forty-one years out.`),
    { pic: 'sleep_manifest', move: 'push', line: `${s.adrift ? s.adrift.kit.sleepers : s.sleepers} asleep in the cryo banks.` }]
    .concat(keys.slice(0, 3).map(k => POOL[k](s, r)))
    .concat([Object.assign({ line: PM.intro }, REVEAL[s.premise] || REVEAL.dead)]));
}
/* A new game with a voyage out: the burn that leaves Earth, and the ship under way, before the first card. */
const DEPART_FILM = true, DEPART_CUTS = [0, 4.6, 9.2, 13.8], DEPART_MS = 18800;   // from `python3 tools/departure.py film`
function departure(s) {
  const ship = s.adrift ? s.adrift.ship : s.world.ship;
  const stills = [{ pic: 'intro_burn', move: 'ignite', fx: 'ignite', ms: 7000, sfx: 'burn', line: `The ${ship} lights its drive and leaves Earth.` },
    layered('cruise', `${s.adrift ? s.adrift.kit.pop + s.adrift.kit.sleepers : s.sleepers} asleep in the cold, and six awake to run the ship in.`)];
  // The film (tools/video.py film): the Ariadne new, as she left. Four shots; DEPART_CUTS is where each starts, in seconds.
  // tools/departure.py: the real ship's own pixels, repainted clean, moved by Wan image-to-video. DEPART_FILM off plays the stills.
  if (!DEPART_FILM) return stills;
  return [{ video: 'departure', ms: DEPART_MS, alt: stills, sfxAt: [[DEPART_CUTS[1] + 1.0, 'burn']], caps: [
    [0.3, `The ${ship}, new from the yards, in orbit over Earth.`], [DEPART_CUTS[1], 'She lights her drive.'],
    [DEPART_CUTS[2], 'Earth falls behind.'], [DEPART_CUTS[3], `${s.adrift ? s.adrift.kit.pop + s.adrift.kit.sleepers : s.sleepers} asleep in the cold, and six awake to run the ship in.`]] }];
}
/* After the burn is committed: the engines, the years, the new world, and orbit. Nobody goes down yet: the survey
   from orbit and the choice of who goes first come before the descent. */
function arrival(s) {
  const w = s.world;
  return [Object.assign(layered('approach', `${w.transit.years} years after the burn: ${w.planet}.`), { alt: { pic: PLANET[w.type] || 'lib_planet_09', move: 'drift' },
      layers: [{ src: P(`limb_${w.type}.webp`), cls: 'limb' }, { src: P('ship_front.webp'), cls: 'bow' }] }),
    { pic: 'intro_orbit', move: 'drift', line: `The ${w.ship} makes orbit.` }];
}
/* The landing site is chosen: the lander goes down. zone: the zone's name, as LF.zone gives it. */
function descent(s, zone) {
  const w = s.world, Z = zone ? zone.charAt(0).toUpperCase() + zone.slice(1) : w.planet;
  return [{ pic: 'intro_separate', move: 'drift', line: `The lander drops away from the ${w.ship}.` },
    { pic: 'intro_descent', move: 'push', fx: 'flare', line: 'Down through the cloud, with the reactor in the hold.' },
    { pic: 'intro_touchdown', move: 'pan', fx: 'shake', line: `${Z}. Landfall.` }];
}
let timer = 0, done = null;
function finish() {
  clearTimeout(timer);
  if (window.LFMusic) LFMusic.hush();
  const el = document.querySelector('#intro:not(.out)');
  // fade out over the game rather than cutting
  if (el) { el.classList.add('out'); setTimeout(() => { unsky(el); el.remove(); }, 500); }
  const d = done; done = null; if (d) d();
}
/* What the game is, and what it contains: shown on the title card after the first tap, while the score comes in. */
const WARN = `<div class="warn"><p>Landfall is a game about keeping a colony alive on a world with open dangers and hidden secrets. As the colony leader, it's up to you to make the hard decisions when there might be no good option. Guide your people to a self sustaining outpost - whether they still have their humanity is up to you.</p>
  <p class="adult">For adults. Contains death, starvation, cannibalism, violence against children, slavery, torture, mass killing, and references to sexual violence.</p></div>`;
/* title: hold on a title card until the first tap, which is also what lets the browser start the music. */
function play(shots, cb, title) {
  finish(); document.querySelectorAll('#intro').forEach(e => { unsky(e); e.remove(); }); done = cb;
  const have = new Set(LF.SCENES || []), pieces = new Set(LF.PIECES || []);
  const ok = x => x.video ? true : x.layers ? x.layers.every(l => !l.src || pieces.has(l.src.replace(/^art\/pieces\//, '').replace(/\.\w+$/, ''))) : have.has(x.pic);
  // a layered shot whose sprites are missing falls back to its picture, if it has one
  shots = shots.map(x => ok(x) || !x.alt ? x : Object.assign({ line: x.line }, x.alt)).filter(ok);
  if (!shots.length && !title) return finish();   // the title card can be shown alone (the ship and crew are chosen before the departure)
  const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('role', 'presentation');
  el.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lf-fire" x="-20%" y="-40%" width="140%" height="180%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.16" numOctaves="2" seed="1" result="n"><animate attributeName="seed" values="1;2;3;4;5;6;7" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
    <div class="stage"></div><div class="skip lbl">${title ? '' : 'Tap to skip'}</div>
    ${title ? `<div class="title"><canvas class="stars" data-vx="-5" data-vy="0.6"></canvas><div><img class="em" src="art/crest.webp" alt=""><h1>Landfall</h1><i class="rule"></i>${WARN}</div><div class="tally"></div></div>` : ''}`;
  document.body.appendChild(el);
  skySeed = (Date.now() / 86400000) | 0;   // the sky changes from day to day, not from shot to shot
  sky(el);
  // How many have gone before: ships launched and colonies established, from the play log's counts (js/log.js).
  if (title && window.LFLog && LFLog.tally) LFLog.tally(line => { const tl = el.querySelector('.title .tally'); if (tl && line) { tl.textContent = line; tl.classList.add('on'); } });
  // The landing page: the first tap starts the score and brings up what the game is and what is in it; the second begins.
  let waiting = title ? 2 : 0;
  el.addEventListener('click', e => { e.stopPropagation();
    if (!waiting) return finish();
    if (waiting === 2) { waiting = 1; el.querySelector('.title').classList.add('read'); return; }
    waiting = 0; const tt = el.querySelector('.title'); tt.classList.add('off'); setTimeout(() => { unsky(tt); tt.remove(); }, 1300); el.querySelector('.skip').textContent = 'Tap to skip'; next(); });
  const stage = el.querySelector('.stage');
  let i = 0;
  const next = () => {
    if (i >= shots.length) return finish();
    const x = shots[i++], sh = document.createElement('div');
    if (x.video) return film(x, sh);
    sh.className = `shot ${x.move || ''} ${x.fx || ''}`;
    sh.style.setProperty('--ms', (x.ms || SHOT_MS) + 'ms');
    sh.innerHTML = `<div class="frame${x.layers ? ' layered' : ''}">${x.layers ? x.layers.map(layer).join('') : `<img src="art/scenes/${x.pic}.webp" alt="">`}<i class="fx"></i></div><p>${x.line.replace(/\S+-\S+/g, w => `<span style="white-space:nowrap">${w}</span>`)}</p>`;
    for (const o of stage.querySelectorAll('.shot.on')) o.classList.add('off');
    stage.appendChild(sh); sky(sh);
    requestAnimationFrame(() => sh.classList.add('on'));
    const old = stage.querySelectorAll('.shot'); if (old.length > 2) { unsky(old[0]); old[0].remove(); }
    if (x.sfx && window.LFMusic) LFMusic.sfx(x.sfx);
    timer = setTimeout(next, x.ms || SHOT_MS);
  };
  /* A film (2026-11-18): one MP4 of several shots, muted (the game plays its own sound), with captions timed to the cut
     (caps: [[seconds, line]]) and sounds (sfxAt: [[seconds, name]]). If it cannot play, the stills in x.alt stand in. */
  const film = (x, sh) => {
    sh.className = 'shot film';
    sh.innerHTML = `<div class="frame"><video muted playsinline preload="auto" poster="art/video/${x.video}.webp" src="art/video/${x.video}.mp4"></video><i class="fx"></i></div><p></p>`;
    const v = sh.querySelector('video'), p = sh.querySelector('p'); let cap = -1, fired = 0, dead = false;
    const stills = () => { if (dead) return; dead = true; clearTimeout(timer); sh.remove(); shots = shots.slice(0, i).concat((x.alt || []).filter(ok), shots.slice(i)); next(); };
    const words = t => t.replace(/\S+-\S+/g, w => `<span style="white-space:nowrap">${w}</span>`);
    v.addEventListener('timeupdate', () => { const at = v.currentTime; let k = -1; (x.caps || []).forEach((c, n) => { if (at >= c[0]) k = n; });
      if (k !== cap) { cap = k; p.style.animation = 'none'; p.innerHTML = k < 0 ? '' : words(x.caps[k][1]); void p.offsetWidth; p.style.animation = 'i-caption 1200ms cubic-bezier(.2,.6,.2,1) forwards'; }
      while (fired < (x.sfxAt || []).length && at >= x.sfxAt[fired][0]) { if (window.LFMusic) LFMusic.sfx(x.sfxAt[fired][1]); fired++; } });
    v.addEventListener('ended', () => { if (!dead) { dead = true; clearTimeout(timer); next(); } });
    v.addEventListener('error', stills);
    for (const o of stage.querySelectorAll('.shot.on')) o.classList.add('off');
    stage.appendChild(sh); requestAnimationFrame(() => sh.classList.add('on'));
    const pl = v.play(); if (pl && pl.catch) pl.catch(stills);
    timer = setTimeout(() => { if (!dead) { dead = true; next(); } }, (x.ms || 30000) + 4000);   // never hang on a stalled download
  };
  if (!waiting) next();
}
window.LFIntro = { play, skip: finish, opening, departure, arrival, descent, get playing() { return !!document.querySelector('#intro:not(.out)'); } };
})();

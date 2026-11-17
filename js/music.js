/* Landfall: background music. UI only (DOM, Audio); reads state, never changes it.
   Thirty-seven instrumental cues in music/ (ElevenLabs Music, tools/music.py), one dark palette: analog synth pads, low
   drones, slow arpeggiators, sub booms, cold glassy highs. The opening theme plays from the title card through the
   adrift screen; once the ship is in orbit the director below takes over. ui.js calls LFMusic.update(s, { review })
   after each render. Browsers only allow sound after the first tap, so nothing plays until then.

   The director (Lachlan, 2026-11-16: "it needs to ratchet up, build down, swing from eerie to tense to anticipatory to
   dread and back again"). The colony has a heat, 0 to 1: a base from how it stands (danger, food, morale, a dread
   awake, humanity) and a spike from what has just happened (a dark choice, a new dread, the food running out, a crisis
   or a calamity on the table or on its way up), which every answered card lets down a little. Heat makes a level,
   and the level a mood:
     0 steady (wonder in the first months)   1 eerie   2 tense   3 rising, then dread if it is still up there   4 dread
   Going up is quick: a short crossfade, and reaching 3 plays a cue that builds. Coming down is slow: never before the
   cue has had its time (HOLD), and from 3 or 4 it goes by way of the aftermath cue. No mood sits for more than two
   cues running: the third swings to its neighbour and back. Loss (a named death, or several at once) and grim (below
   8% humanity) still cut across all of it. */
(function () {
  const MOODS = {
    opening: ['opening_1', 'opening_2'],
    prologue: ['prologue_1', 'prologue_2'],   // the opening mood always starts with one of these (title card and intro)
    wonder: ['firstlight_1', 'firstlight_2', 'expanse_1'],                 // vast and cold
    steady: ['watch_1', 'watch_2', 'perimeter_1', 'perimeter_2', 'decades_1'],   // watchful, uneasy
    eerie: ['lull_1', 'lull_2', 'static_1', 'outside_1', 'watch_1', 'perimeter_2'],   // almost nothing, and wrong (the two stillest of the steady cues serve here too)
    tense: ['wire_1', 'wire_2', 'breach_1', 'breach_2', 'stormfront_1', 'siege_1', 'siege_2', 'siege_3'],   // pulse, low swells, heartbeat sub; the sieges each have their own key and tempo (half of all play is spent here)
    rising: ['approach_1', 'approach_2', 'countdown_1'],                   // builds and does not arrive: something is coming
    dread: ['maw_1', 'maw_2', 'toll_1'],                                   // the peak
    after: ['ebbtide_1'],                                                  // the way back down from the top
    loss: ['hollow_1', 'hollow_2', 'vigil_1'],                             // bare
    grim: ['ash_1', 'ash_2', 'husk_1'],                                    // below 8% humanity: the same palette gone wrong (2026-11-16)
  };
  const GAIN = { eerie: 0.9, rising: 1.05, dread: 1.15 };                  // the new cues are mastered to one loudness: the peak sits a little over, the lull a little under
  const SWING = { wonder: 'steady', steady: 'eerie', eerie: 'tense', tense: 'eerie', dread: 'tense', grim: 'eerie' };
  const UP = [0.16, 0.36, 0.56, 0.8], HOLD = 40000;
  const VOL = 0.32, FADE = 5000, KEY = 'landfall.music';
  let on = localStorage.getItem(KEY) !== '0', unlocked = false, played = false, fx = [], mood = null, cur = null, recent = [], deaths = null, lossUntil = -1;
  let S = null, heat = 0, spike = 0, level = 0, at = -1, queue = [], run = 0, began = 0, prev = null, special = null, fadeMs = FADE, fallen = 0, seed = null;

  /* Low humanity (js/humanity.js LF.grim, 0 above 20% and 1 at nothing; Lachlan, 2026-11-16): the colony's music
     slowly goes wrong. Calm moods give way to the tense and bare cues, every cue runs a little slow and flat (no pitch
     correction) through a closing low-pass, and a beating sub drone comes up under everything. All of it moves over
     tens of seconds, never at once. */
  let grim = 0, drone = null;
  const RATE = g => 1 - 0.11 * g, CUT = g => 18000 * Math.pow(0.05, g);
  function shade(cue, secs) { if (!cue || !cue.f || !ctx) return; const now = ctx.currentTime;
    cue.a.preservesPitch = false; cue.a.mozPreservesPitch = false; cue.a.webkitPreservesPitch = false; cue.a.playbackRate = RATE(grim);
    cue.f.frequency.cancelScheduledValues(now); cue.f.frequency.setValueAtTime(cue.f.frequency.value, now); cue.f.frequency.exponentialRampToValueAtTime(CUT(grim), now + secs); }
  function setDrone(secs) {
    if (!ctx || !on || !unlocked) return;
    if (!drone && grim > 0) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 160; g.gain.value = 0; g.connect(ctx.destination); lp.connect(g);
      const os = [36.7, 37.25, 55.1].map((f, i) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f; og.gain.value = i === 2 ? 0.25 : 0.5; o.connect(og); og.connect(lp); o.start(); return o; });
      lfo.frequency.value = 0.07; lg.gain.value = 60; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      drone = { g, os: os.concat([lfo]) }; }
    if (drone) { const now = ctx.currentTime; drone.g.gain.cancelScheduledValues(now); drone.g.gain.setValueAtTime(drone.g.gain.value, now); drone.g.gain.linearRampToValueAtTime(0.09 * grim, now + secs); }
  }
  /* ---------- the director ---------- */
  const dreads = s => Object.keys(s.threads || {}).filter(id => { const t = s.threads[id], d = LF.THREADS[id]; return d && d.dread && t.on && !t.end && t.phase !== 'latent'; }).length;
  const fell = s => (s.people || []).filter(p => p.seat && !p.alive && !p.left).length;   // officers dead
  /* The moods that are not the colony's weather: before orbit, the first sight of the world, a death that matters, the end. */
  function apart(s) {
    if (!s || s.adrift) return 'opening';
    if (s.arrival) return 'wonder';
    if (s.seed !== seed) { seed = s.seed; deaths = null; lossUntil = -1; at = -1; queue = []; spike = 0; level = 0; prev = null; }   // another game: nothing of the last one carries over
    const f = fell(s);
    if (deaths !== null && s.deaths >= deaths && (f > fallen || s.deaths - deaths >= 6) && !(LF.aloft && LF.aloft(s))) lossUntil = s.day + 8;   // an officer, or many at once
    deaths = s.deaths; fallen = f;
    if (s.day <= lossUntil || (s.over && !s.over.win)) return 'loss';
    return null;
  }
  const bump = x => { spike = Math.min(1, Math.max(spike, x) + 0.08); };
  function sense(s, o) {
    const v = LF.vibes(s), lv = k => (v.find(x => x.k === k) || { lv: 3 }).lv;
    const now = { seed: s.seed, day: s.day, cards: s.dilemmas || 0, stain: (s.flags && s.flags.stain) || 0, food: s.res ? s.res.food : 1, dreads: dreads(s), deaths: s.deaths || 0 };
    let base = (lv('danger') <= 1 ? 0.3 : lv('danger') === 2 ? 0.1 : 0) + (lv('food') === 0 ? 0.3 : lv('food') === 1 ? 0.08 : 0) + (lv('morale') === 0 ? 0.2 : 0)
      + Math.min(0.3, 0.18 * now.dreads) + 0.25 * grim;
    base = Math.min(0.7, base);
    if (prev && prev.seed === now.seed && now.day >= prev.day) {
      if (now.cards > prev.cards) spike *= 0.7;                                   // every card answered lets it down a little
      if (now.stain > prev.stain) bump(now.stain - prev.stain >= 3 ? 0.62 : now.stain - prev.stain === 2 ? 0.48 : 0.36);   // a dark choice, by its weight: an atrocity is the build, and the peak if another follows
      if (now.dreads > prev.dreads) bump(0.85);                                   // a dread has shown itself
      if (prev.food > 0 && now.food <= 0) bump(0.82);                             // the store is empty
      if (now.deaths > prev.deaths) bump(0.42);
    } else spike = 0;                                                             // another game, or a save loaded
    prev = now;
    // The card on the table, or on its way up while the view is looked over: a hard one is heard coming.
    const c = s.cur, st = c && LF.byId && LF.byId[c.id], tone = c ? c.tone || (st && st.tone) : null, th = st && st.thread && LF.THREADS[st.thread];
    let floor = 0;
    if (c && c.phase === 'choose') floor = /^late\./.test(c.id || '') ? 0.9 : th && th.dread ? (tone === 'crisis' ? 0.62 : 0.42) : tone === 'crisis' ? 0.5 : tone === 'pressure' ? 0.22 : 0;   // a calamity; a dread's own card; any crisis
    heat = Math.max(base, spike, floor);
    let l = 0; for (let i = 0; i < 4; i++) if (heat >= UP[i] - (i < level ? 0.07 : 0)) l = i + 1;   // a level already reached is held a little below its line
    level = l;
  }
  function natural() {
    if (level >= 4) return 'dread';
    if (grim > 0.6) return 'grim';
    if (level >= 2) return 'tense';
    if (level === 1) return 'eerie';
    return grim > 0.2 ? 'eerie' : S && S.day < 60 ? 'wonder' : 'steady';
  }
  const peaked = from => level <= 2 && (from >= 4 || (from === 3 && mood === 'dread'));   // the aftermath is for coming down off the top, not off a build that came to nothing
  function start(m, ms) { if (m === mood && (cur || !on || !unlocked)) return; run = 0; fadeMs = ms; next(m); }
  /* Coming down waits for the cue that is playing to have had its time; the cue's own clock comes back here. */
  function cool() {
    if (special || at < 0 || level >= at || performance.now() - began < HOLD) return;
    const from = at; at = level; queue = [];
    start(peaked(from) ? 'after' : natural(), 8000);
  }
  function direct(s, o) {
    S = s; const sp = apart(s);
    if (sp) { special = sp; queue = []; at = -1; if (sp !== mood) start(sp, FADE); return; }
    special = null; sense(s, o || {});
    if (at < 0) { at = level; start(natural(), FADE); return; }
    if (level > at) { at = level;
      if (level >= 4) { queue = []; start('dread', 2200); }
      else if (level === 3) { queue = ['dread']; start('rising', 3000); }   // the build, and the peak after it if the colony is still up there
      else start(natural(), 3500); }
    else if (level < at) cool();
  }
  /* A cue has run out: the peak a build was promised, or the level's own mood, or (third time running) its neighbour. */
  function ended() {
    if (special) { fadeMs = FADE; next(mood); return; }
    let m = queue.length ? queue.shift() : null;
    if (m === 'dread' && level < 3) m = null;                                     // the build came to nothing
    if (level < at) { const from = at; at = level; if (!m && peaked(from)) m = 'after'; }
    if (!m) { m = natural(); if (m === mood && ++run >= 2) { m = SWING[m] || m; run = 0; } else if (m !== mood) run = 0; }
    fadeMs = FADE; next(m);
  }
  // Volume goes through Web Audio gain nodes: iOS ignores HTMLAudioElement.volume.
  let ctx = null;
  // The context is made on a tap, and woken again on every play: a phone suspends one that has been silent for a
  // while, which is exactly the state of a game started with the music off.
  function wake() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    unlocked = true;
  }
  function play(m) {
    wake();
    if (m === 'opening' && !played) { played = true; m = 'prologue'; }
    const fresh = MOODS[m].filter(n => !recent.includes(n)), list = fresh.length ? fresh : MOODS[m], name = list[Math.floor(Math.random() * list.length)];
    recent = [name, ...recent].slice(0, Math.min(3, MOODS[m].length - 1));
    const a = new Audio(`music/${name}.mp3`), g = ctx.createGain(), f = ctx.createBiquadFilter(), now = ctx.currentTime;
    f.type = 'lowpass'; f.frequency.value = CUT(grim); f.Q.value = 0.7;
    ctx.createMediaElementSource(a).connect(f); f.connect(g); g.connect(ctx.destination);
    // the opening theme comes in with the title card, not five seconds after it
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(VOL * (GAIN[m] || 1), now + (m === 'opening' ? 1.5 : fadeMs / 1000));
    const cue = { a, g, f }; shade(cue, 0.1);
    // a few seconds before this cue ends, hand over to another in the same mood
    a.addEventListener('timeupdate', () => { if (cur !== cue) return; if (a.duration && a.duration - a.currentTime < FADE / 1000) ended(); else cool(); });
    a.play().catch(() => {});
    if (cur) stop(cur, fadeMs);
    cur = cue; began = performance.now();
  }
  function stop(cue, ms) {
    const now = ctx.currentTime;
    cue.g.gain.cancelScheduledValues(now); cue.g.gain.setValueAtTime(cue.g.gain.value, now); cue.g.gain.linearRampToValueAtTime(0, now + ms / 1000);
    setTimeout(() => { cue.a.pause(); cue.g.disconnect(); }, ms + 100);
  }
  function next(m) { mood = m; if (on && unlocked) play(m); }
  /* Sound effects (sfx/<name>.mp3, tools/sfx.py): mastered quieter than the music and played lower still, under
     the same switch. hush() fades out whatever is still sounding (the intro calls it when it ends or is skipped). */
  const SFX_VOL = 0.45;
  /* Card sounds (js/sounds.js) are quieter again than the intro's, and never start abruptly: a short fade in, or a
     long one for a sound that should build (a crowd, a hum, weather), and a fade out over their last seconds.
     gain is the file's loudness correction. Only one card sound at a time: a new one fades the last one out. */
  const CARD_VOL = 0.13, CARD_IN = 0.35, SWELL_IN = 2.5, CARD_OUT = 2;
  let card = null;
  function sfx(name, o) {
    if (!on || !ctx) return;
    wake();
    const a = new Audio(`sfx/${name}.mp3`), g = ctx.createGain(), cue = { a, g };
    ctx.createMediaElementSource(a).connect(g); g.connect(ctx.destination);
    if (o && o.card) {
      const v = Math.min(CARD_VOL * (o.gain || 1), 1), now = ctx.currentTime;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(v, now + (o.swell ? SWELL_IN : CARD_IN));
      a.addEventListener('loadedmetadata', () => {
        const end = ctx.currentTime + a.duration, at = Math.max(end - CARD_OUT, ctx.currentTime + 0.5);
        g.gain.setValueAtTime(v, at); g.gain.linearRampToValueAtTime(0, end);
      });
      if (card) stop(card, 900);
      card = cue;
    } else g.gain.value = SFX_VOL;
    a.addEventListener('ended', () => { g.disconnect(); fx = fx.filter(c => c !== cue); if (card === cue) card = null; });
    fx.push(cue); a.play().catch(() => {});
  }
  function hush() { for (const c of fx) stop(c, 700); fx = []; card = null; }
  /* The bed: one quiet loop for where the colony is, decoded whole and looped by Web Audio so the seam is never
     heard (an Audio element leaves a gap on some phones). A new bed crossfades in over BED_FADE. */
  const BED_VOL = 0.07, BED_FADE = 6;
  let bedWant = null, bedCur = null, bedGain = 1;
  const buffers = {};
  function bed(name, gain) {
    if (name === bedWant) return;
    bedWant = name; bedGain = gain || 1;
    if (on && ctx) startBed();
  }
  function startBed() {
    const name = bedWant; if (!name || (bedCur && bedCur.name === name)) return;
    const got = buffers[name] || (buffers[name] = fetch(`sfx/${name}.mp3`).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no))));
    got.then(buf => {
      if (bedWant !== name || !on || (bedCur && bedCur.name === name)) return;
      const src = ctx.createBufferSource(), g = ctx.createGain(), now = ctx.currentTime;
      src.buffer = buf; src.loop = true; src.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(Math.min(BED_VOL * bedGain, 0.5), now + BED_FADE);
      src.start();
      if (bedCur) stopBed(bedCur, BED_FADE);
      bedCur = { name, src, g };
    }).catch(() => { delete buffers[name]; });
  }
  function stopBed(b, secs) {
    const now = ctx.currentTime;
    b.g.gain.cancelScheduledValues(now); b.g.gain.setValueAtTime(b.g.gain.value, now); b.g.gain.linearRampToValueAtTime(0, now + secs);
    setTimeout(() => { try { b.src.stop(); } catch (e) {} b.g.disconnect(); }, secs * 1000 + 100);
  }

  window.LFMusic = {
    get on() { return on; },
    sfx, hush, bed,
    get state() { return { mood, level, at, heat: Math.round(heat * 100) / 100, spike: Math.round(spike * 100) / 100, queue: queue.slice(), special }; },   // for looking at it from the console
    update(s, o) {
      const g = s && s.world && !s.adrift && window.LF && LF.grim ? LF.grim(s) : 0;
      if (Math.abs(g - grim) > 0.005) { grim = g; shade(cur, 40); setDrone(40); }
      direct(s, o); },
    toggle() {
      on = !on; localStorage.setItem(KEY, on ? '1' : '0');
      if (!on) { if (cur) { stop(cur, 1200); cur = null; } if (bedCur) { stopBed(bedCur, 1.2); bedCur = null; } hush(); if (drone) { for (const o of drone.os) o.stop(); drone.g.disconnect(); drone = null; } }
      else { if (mood) play(mood); wake(); startBed(); setDrone(5); }   // the toggle is itself a tap, so sound is allowed from here whatever came before
    },
  };
  /* The first tap unlocks audio. iOS only counts touchend and click as a gesture for sound (not pointerdown), so all
     of them are listened for, in the capture phase so the intro's own click handler cannot hide them, and every
     tap retries until the context is running and the cue is actually playing. */
  const unlock = () => {
    if (!on) return;   // with the music off, nothing is made until it is switched on
    wake();
    startBed();
    setDrone(20);
    if (!mood) return;
    if (!cur) play(mood); else if (cur.a.paused) cur.a.play().catch(() => {});
  };
  for (const t of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(t, unlock, true);
})();

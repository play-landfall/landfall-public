/* Landfall — story threads and the storyteller (STORY-PLAN.md §1, §4).
   A thread is a premise that can fire, with a truth rolled in secret and a state of its own (s.threads[id]). Its
   beats are ordinary storylets, gated on the thread's phase and on the shared conditions (story.js), so one thread
   bends another without either knowing the other exists. The storyteller decides at landfall which threads this
   world holds (the plot), pays for them out of the world's threat budget, and leans on the director so that
   threads meet. Thread dice come from the second stream (LF.srand). No DOM; plain JSON state. */
(function () {
'use strict';
const { clamp } = LF;
const DEFS = LF.THREADS = {};
const sr = LF.srand, sri = (s, a, b) => a + Math.floor(sr(s) * (b - a + 1)), spick = (s, a) => a[Math.floor(sr(s) * a.length)];
LF.sri = sri; LF.spick = spick;

/* def: { id, name, view, always, fits(s) -> weight, roll(s) -> truth, start(s, t), tick(s, t), sig(t) } */
LF.thread = def => { DEFS[def.id] = def; LF.ARC_VIEW['th.' + def.id] = def.view || 'colony'; };
LF.T = (s, id) => { const t = s.threads && s.threads[id]; return t && t.on ? t : null; };
LF.phase = function (s, id, ph, chron) { const t = LF.T(s, id); if (!t || t.phase === ph) return; t.phase = ph; t.since = s.day; if (!t.woke) t.woke = s.day; t.path.push(ph); if (LF.storyPoint) LF.storyPoint(s); if (chron) LF.chron(s, chron); };
LF.inPhase = (s, id, phases) => { const t = LF.T(s, id); return !!t && [].concat(phases).includes(t.phase); };
LF.endThread = function (s, id, end, chron) { const t = LF.T(s, id); if (!t || t.end) return; t.end = end; t.endDay = s.day; LF.phase(s, id, 'after', chron); s.morale = clamp(s.morale + 6, 0, 100); s.tension = clamp(s.tension - 15, 0, 100); };

/* A beat: a storylet that belongs to a thread. phases: when in the thread's life it may fire. x: true marks a
   crossing, a beat that only exists because some other source raised a condition this thread reads. */
LF.beat = function (tid, phases, st) {
  const when0 = st.when;
  LF.add(Object.assign({ arc: 'th.' + tid, w: 2.4, gap: 21 }, st, { thread: tid,
    when: s => { const t = LF.T(s, tid); return !!t && [].concat(phases).includes(t.phase) && (!when0 || !!when0(s, t)); } }));
};
/* Have a beat take the next free slot (it still has to pass its own conditions when the day comes). */
/* A saved colony dealt a thread that has since been cut from the game (the Count and the First Landing went this way) plays
   on without it: the thread, its place in the plot, its cued cards and a card of it still on the table are dropped. The UI
   calls this on load, so cutting a thread never needs a new LF.VERSION. */
LF.dropCut = s => {
  if (s.threads) for (const id in s.threads) if (!DEFS[id]) delete s.threads[id];
  const p = s.plot;
  if (p) { for (const k of ['counters', 'threads', 'tried']) if (Array.isArray(p[k])) p[k] = p[k].filter(id => DEFS[id]);
    if (p.spine && !DEFS[p.spine]) { const on = (p.threads || []).filter(id => s.threads && s.threads[id]);   // as at the deal: a dread first
      p.spine = on.find(id => DEFS[id].dread) || on.find(id => !DEFS[id].always && !DEFS[id].minor) || on[0] || null;
      if (p.counters) p.counters = p.counters.filter(id => id !== p.spine); } }
  if (Array.isArray(s.sched)) s.sched = s.sched.filter(e => LF.byId[e.id]);
  if (s.cur && !s.cur.gen && s.cur.id && !LF.byId[s.cur.id]) s.cur = null;
  return s;
};
LF.cue = (s, id, a, b) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day + (b === undefined ? a || 0 : sri(s, a, b)) }); };

/* ---------- the plot: what this world's story is going to be about ---------- */
LF.plot = function (s) {
  s.threads = {}; let on = [];
  // Up to three full threads, one Turn and three minor ones on top of what every colony carries and the run's two dreads
  // (Lachlan, 2026-11-15, after a playtest: one thread at a time, closing before the next opened, was boring. Several at
  // once, crossing each other, is the point). The storm (below) makes sure they overlap.
  const cap = { full: 3, turn: 1, minor: 3 }, n = { full: 0, turn: 0, minor: 0 }, cls = d => d.turn ? 'turn' : d.minor ? 'minor' : 'full';
  // s.avoid (set by the UI from the player's last games): the threads they have just played weigh a third, and a dread just played is dealt last.
  const stale = id => (s.avoid || []).includes(id);
  let ports = 0, free = 0; const opt = Object.keys(DEFS).filter(id => !DEFS[id].always && !DEFS[id].dread && !DEFS[id].own)   /* own: opened by its own condition, never dealt (the Hush) */.map(id => [DEFS[id].port ? -1 : sr(s), id]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  for (const id of Object.keys(DEFS).filter(id => DEFS[id].always).concat(opt)) { const d = DEFS[id];
    if (d.port) { if (!(d.fits(s) > 0)) continue; n.full++; ports++; }   /* a signature arc the world already holds: always on, already paid for */
    else if (!d.always) { const w = clamp(d.fits ? d.fits(s) : 0.5, 0, 1) * (stale(id) ? 0.35 : 1), c = cls(d); if (n[c] >= cap[c] || !(sr(s) < w)) continue; n[c]++; if (d.free) free++; }
    on.push(id); }
  // The dreads (def.dread): every run holds one that begins in the first year, and half hold a second that comes later.
  // They are not charged to the world's budget: they are the pressure. t.nth says which of the run's dreads this is.
  const dreads = Object.keys(DEFS).filter(id => DEFS[id].dread && (!DEFS[id].fits || DEFS[id].fits(s) > 0)).map(id => [sr(s) + (stale(id) ? 1 : 0), id]).sort((a, b) => a[0] - b[0]).map(x => x[1]).slice(0, 2);
  on = on.concat(dreads);
  // Paid for from the world's own budget: each full thread or Turn puts one hidden factor to sleep. A minor thread
  // is cheap, and is not charged. What a thread is built on (the Works' ruin) is never the one put to sleep.
  // A thread about the colony itself (def.free: the Lie, the Bargain, the Ship's Mind) brings nothing new to the wire, and
  // is not charged one of the world's actors either: it costs what it costs through the colony's own arithmetic.
  let owed = n.full - ports - free + n.turn; if (owed) owed++;   // and one more, for the Charter every colony carries
  owed = Math.min(owed, 2);   // more threads, not fewer dangers: the world keeps most of its own actors awake (2026-11-15)
  const keep = f => on.some(id => DEFS[id].needs === f.kind);   // def.needs: the kind of actor a thread is built on
  const pool = s.factors.filter(f => LF.KINDS[f.kind] && !f.dormant && !keep(f) && f.kind !== 'humans')   /* people next door are rare, and are a story already */.sort((a, b) => (b.sub === 'parasite') - (a.sub === 'parasite') || a.sev - b.sev);
  while (owed-- > 0 && pool.length > 1) { const f = pool.shift(); f.dormant = true; f.onset = 99999; f.late = true; }
  // Only now are the truths rolled, so a thread can see which of the world's actors are awake. It may decline (t.on = false).
  for (const id of on) { const d = DEFS[id], t = s.threads[id] = { on: true, phase: 'latent', since: 0, path: ['latent'], truth: d.roll ? d.roll(s) : {}, end: null };
    if (d.dread) t.nth = dreads.indexOf(id);
    if (d.start) d.start(s, t); if (!t.on) delete s.threads[id]; }
  on = on.filter(id => s.threads[id]);
  const full = on.filter(id => !DEFS[id].always && !DEFS[id].minor && !DEFS[id].dread).sort((a, b) => !!DEFS[a].port - !!DEFS[b].port);
  // The run plan: one thread carries the story, the others complicate it, and the whole thing moves through three acts.
  const spine = dreads.find(id => s.threads[id]) || full[0] || on[0] || null;
  s.plot = { spine, counters: on.filter(id => id !== spine), threads: on, act: 1, actDay: s.day };
  s.blames = [];
};
LF.threadTick = function (s) {
  if (!s.threads) return;
  for (const id in s.threads) { const t = s.threads[id], d = DEFS[id]; if (t.on && d && d.tick) d.tick(s, t); }
  acts(s);
  storm(s);
  // A guess that turned out right is worth saying so. (A wrong one gets a card: crossings.js.)
  for (const b of s.blames || []) { if (b.paid || b.who !== b.src) continue; const n = LF.known(s, b.src);
    if (n) { b.paid = s.day; LF.log(s, `You called it ${n} early, when it was only a guess, and you were right.`, 'good'); s.morale = clamp(s.morale + 2, 0, 100); } }
};
/* The storm (2026-11-15): the colony is never dealing with only one thing. After the first months, if fewer threads are
   pressing than the colony should be carrying, the latent thread due soonest is pulled forward to wake within the month.
   Two pressing by the third month, three by the eighth, four from year two (2026-11-16). Only threads that wake on
   a date (t.wake) are pulled; the dreads keep their own clock. */
// Earlier and harder (Lachlan, 2026-11-16: "ramp up the pressure more and earlier", a narrative push): two by the third month, three by the eighth, four from year two.
const WANT = s => s.day < 20 ? 0 : s.day < 80 ? 2 : s.day < 200 ? 3 : 4;
function storm(s) {
  if (s.day % 10 || LF.heat(s) >= WANT(s)) return;
  const ts = Object.keys(s.threads).map(id => s.threads[id]);
  const late = ts.filter(t => t.on && !t.end && t.phase === 'latent' && typeof t.wake === 'number' && t.wake > s.day + 10).sort((a, b) => a.wake - b.wake)[0];
  if (late) { late.wake = s.day + sri(s, 2, 10); return; }
  // The second wave: from the third year, a colony whose stories have run out is dealt a new one. Only a thread about the
  // colony itself or a minor one (it needs nothing out past the wire set up at landfall), and one that wakes on a date.
  if (s.day < 200 || s.day % 40 || ts.some(t => t.on && !t.end && t.phase === 'latent')) return;
  // From year five (2026-11-17: a colony at year fifteen had met everything it was dealt and had nothing left) the whole
  // catalogue is open: any thread this run has not held, a Turn and the dread it was not dealt included, as long as it
  // still fits the world and wakes on a date. A colony that lasts long enough meets all of them.
  const wide = s.day >= 4 * LF.YEAR;
  // a dread on top of the two (def.third: the Quiet Ship) holds every other dread back while it presses
  const third = Object.keys(s.threads).some(k => DEFS[k] && DEFS[k].third && s.threads[k].on && !s.threads[k].end && s.threads[k].phase !== 'latent');
  const fresh = Object.keys(DEFS).filter(id => !s.threads[id] && !DEFS[id].own && !(s.plot && (s.plot.tried || []).includes(id)) && !DEFS[id].always && !DEFS[id].port && (!third || !DEFS[id].dread) && (wide || (!DEFS[id].dread && !DEFS[id].needs && !DEFS[id].turn && (DEFS[id].free || DEFS[id].minor))) && (!DEFS[id].fits || DEFS[id].fits(s) > 0));
  if (!fresh.length) return;
  // In the long years (s.late, js/late.js) what is left of the catalogue is paced to last until year forty: a colony
  // that met a new thread every four months had met all of them by year fifteen (2026-11-18).
  if (s.late && s.plot) { const gap = clamp((40 * LF.YEAR - s.day) / (fresh.length + 1), 40, 3 * LF.YEAR); if (s.day - (s.plot.fresh || 0) < gap) return; s.plot.fresh = s.day; }
  const id = spick(s, fresh), d = DEFS[id], t = s.threads[id] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll ? d.roll(s) : {}, end: null, wave: 2 };
  if (d.dread) { t.nth = 1; t.at = s.day + sri(s, 5, 30); }
  if (d.start) d.start(s, t);
  if (!t.on || (typeof t.wake !== 'number' && !d.dread)) { delete s.threads[id]; if (s.plot) (s.plot.tried = s.plot.tried || []).push(id); return; }
  if (!d.dread) t.wake = s.day + sri(s, 5, 30); if (s.plot) s.plot.threads.push(id);
}
/* Three acts over the same sixty turns: signs only; entanglement; convergence. The act never goes back. */
LF.act = s => (s.plot && s.plot.act) || 1;
function acts(s) {
  const p = s.plot; if (!p) return; if (!p.act) { p.act = 1; p.actDay = s.day; }   // a save from before there were acts
  const ts = Object.keys(s.threads).map(id => s.threads[id]).filter(t => t.on);
  if (p.act === 1 && (ts.some(t => t.phase !== 'latent') || s.day >= 120)) { p.act = 2; p.actDay = s.day; }
  else if (p.act === 2 && s.day - p.actDay >= 40 && (LF.heat(s) >= 2 || ts.some(t => t.end) || s.day >= 420)) { p.act = 3; p.actDay = s.day; }
}
/* What the colony calls the cause of something, once it knows enough to call it anything. Null until then:
   a card may only name what the player has seen. src is a factor id or 'th.<thread>'. */
LF.known = function (s, src) {
  if (!src) return null;
  if (src.startsWith('th.')) { const id = src.slice(3), t = LF.T(s, id), d = DEFS[id]; return t && d && d.called ? d.called(s, t) : null; }
  const f = s.factors.find(x => x.id === src); return f && (f.insight >= 35 || f.res) ? f.name : null;
};
/* How many threads are pressing right now. Two or more is when the storyteller steers them into each other. */
LF.heat = s => Object.keys(s.threads || {}).filter(id => { const t = s.threads[id]; return t.on && !t.end && !['latent', 'quiet', 'after'].includes(t.phase); }).length;
LF.plotSig = s => Object.keys(s.threads || {}).filter(id => s.threads[id].on).map(id => { const t = s.threads[id], d = DEFS[id];
  return `${id}(${d.sig ? d.sig(t) : ''})>${t.end || t.phase}`; }).join(' + ');

/* The storyteller's hand on the director: crossings weigh more once two threads are live, and a thread that has
   gone a long time without a card is owed one. Wrapped around the weights, not the choice, so play stays seeded. */
const direct0 = LF.direct;
LF.direct = function (s) {
  if (!s.threads) return direct0(s);
  const hot = LF.heat(s) >= 2, saved = [];
  const act = LF.act(s), ACT = [0, 0.7, 1.15, 1.35][act];   // the story weighs more from the first act (2026-11-16)
  for (const st of LF.storylets) { let k;
    if (st.thread) { const t = LF.T(s, st.thread); if (!t) continue;
      const last = s.arcLast[st.arc] ?? t.since, owed = clamp((s.day - last - 40) / 60, 0, 1.5);
      k = (st.x && hot ? 2.2 : 1) * (1 + owed) * (s.plot && s.plot.spine === st.thread ? 1.25 : 1) * (st.x ? clamp(ACT, 0.6, 1.1) : 1)
        * (t.neglect && s.day - t.neglect < 90 ? 3 : 1) * (t.focus && s.day - t.focus < 60 ? 0.35 : 1); }   // two at once (content-collide.js): the one left alone comes back first
    // Crossings, episodes and loose ends coming home: scarce in the first act, the business of the third.
    else if (st.arc === 'cross' || st.arc === 'episode' || st.arc === 'seed') k = ACT * (hot ? 1.2 : 1) * (st.age ? 1 + clamp(st.age(s) / 400, 0, 1.5) : 1);
    else continue;
    const base = st.w;
    saved.push([st, base]); st.w = typeof base === 'function' ? (x => base(x) * k) : (base ?? 1) * k; }
  try { return direct0(s); } finally { for (const [st, w] of saved) st.w = w; }
};

/* What threads do to the colony's arithmetic, on top of what the factors do (gen.js LF.pressure). */
const pressure0 = LF.pressure;
LF.pressure = function (s) {
  const P = pressure0(s);
  if (s.threads) for (const id in s.threads) { const t = s.threads[id], d = DEFS[id]; if (!t.on) continue;
    if (t.neglect && s.day - t.neglect < 90 && !t.end) P.morale -= 0.04;   // left alone, it eats at people
    if (d && d.press && !(t.focus && s.day - t.focus < 60)) d.press(s, t, P); }
  P.labor = clamp(P.labor, 0.4, 1.3); return P;
};
const sy0 = LF.seasonYield;
LF.seasonYield = function (s) { let y = sy0(s);
  if (s.threads) for (const id in s.threads) { const t = s.threads[id], d = DEFS[id]; if (t.on && d && d.light) y *= d.light(s, t); }
  return y; };

/* A game has only so many dilemmas, and the world's own (the ground, the stores, what lives outside the wire) must
   not be crowded out by story. Cards from a counter or minor thread, crossings, episodes and loose ends are extra:
   after one of them the next dilemma comes in half the usual time. The spine and the Charter keep the full beat. */
const EXTRA = { cross: 1, episode: 1, seed: 1, close: 1, opening: 1 };
const dismiss0 = LF.dismiss;
LF.dismiss = function (s) {
  const c = s.cur, st = c && !c.gen && LF.byId[c.id];
  const extra = !!st && s.threads && (EXTRA[st.arc] || (st.thread && DEFS[st.thread] && !DEFS[st.thread].always && (DEFS[st.thread].minor || (s.plot && s.plot.spine !== st.thread))));
  const r = dismiss0(s);
  if (extra && s.nextDilemma > s.day) s.nextDilemma = s.day + Math.max(4, Math.round((s.nextDilemma - s.day) * 0.35));
  return r;
};

/* A service for threads that pass on evidence about some other story (the Ones Before, the Neighbours): the clue of
   the spine if it has one, else of any other live thread. The caller never learns which thread it was. */
LF.clueOf = function (s, notId) {
  const ids = Object.keys(s.threads || {}).filter(id => id !== notId && s.threads[id].on && !s.threads[id].end && DEFS[id] && DEFS[id].clue && !DEFS[id].always);
  const id = (s.plot && ids.includes(s.plot.spine) && s.plot.spine) || ids[0]; return id ? DEFS[id].clue(s, s.threads[id]) : null;
};

/* The same, for a named cause: src is 'th.<thread>', as LF.source gives it. */
LF.clueFor = function (s, src) { if (!src || !src.startsWith('th.')) return null; const id = src.slice(3), t = LF.T(s, id), d = DEFS[id]; return t && !t.end && d && d.clue ? d.clue(s, t) : null; };

/* Small helpers the beats share. */
LF.th = {
  cv: (s, k) => LF.cv(s, k), why: (s, k) => LF.because(s, k),
  /* "because the cold keeps everyone indoors": a clause a card can end a sentence with. */
  bec: (s, k) => { const w = LF.because(s, k); return w ? `because ${w}` : ''; },
  name: (s, id) => { const p = LF.h.byPid(s, id); return p ? p.name : 'someone'; },
  first: (s, id) => { const p = LF.h.byPid(s, id); return p ? p.first : 'they'; },
  ctx: p => p ? { pid: p.id, name: p.name, first: p.first, title: LF.title(p) } : { name: 'One of the field hands', first: 'the field hand', title: 'field hand' },
  num: n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n),
};
})();

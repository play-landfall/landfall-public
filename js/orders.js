/* Landfall — orders (Tranche 2, Lachlan 2026-11-16; DESIGN.md "Orders"). No DOM: it runs under Node too.
   An order is not a card. It costs no month and never deals one: it is given from a view while the month's card waits,
   and the month still moves only when that card is answered. Limits come from the world (food, materials, fuel, hands,
   officers, the lander's month), never from a count of clicks; an order that must not repeat inside a month carries
   once: 'month' (s.ordM[id] = the month it was given). Cards still win: a thread that holds a lever locks its order
   through can(), with its own reason.

   LF.ORDERS[id] = { id, view, once, rows(s) -> [arg...], label(s, arg), can(s, arg) -> '' | reason, cost(s, arg) ->
   { food, mat, parts }, info(s, arg) -> [[kind, text]], note(s, arg), act(s, arg, chips) -> text, sound(s, arg) }
   LF.orders(s, view): what a view offers, locked rows included with the reason.
   LF.order(s, id, arg): checks, pays, acts, chips the result, logs one Meanwhile line, and is recorded like a choice
   (card key order.<id>, option key order.<id>#<arg>) for the play log and tools/ids.js. */
(function () {
'use strict';
const LF = globalThis.LF, MONTH = LF.MONTH;
const fn = (v, s, a) => typeof v === 'function' ? v(s, a) : v;
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
LF.ORDERS = {};
LF.ORDER_IDS = [];
LF.addOrder = o => { LF.ORDERS[o.id] = o; LF.ORDER_IDS.push(o.id); };
LF.monthOf = s => Math.floor(s.day / MONTH);
/* onceKey: orders that share one go a month (send and survey: one party out a month, Lachlan, 2026-11-20). */
const onceKey = id => (LF.ORDERS[id] && LF.ORDERS[id].onceKey) || id;
const usedThisMonth = (s, id) => !!s.ordM && s.ordM[onceKey(id)] === LF.monthOf(s);

LF.orderLock = function (s, id, arg) {
  const o = LF.ORDERS[id]; if (!o) return 'No such order';
  if (!s.world || s.adrift || LF.aloft(s) || (s.over && !s.over.cont)) return 'Not now';
  if (s.cur && s.cur.phase === 'result') return 'Answer what is in front of you first';
  if (s.flight) return 'The lander is in the middle of a run';
  const why = o.can ? o.can(s, arg) : '';
  if (why) return why;
  if (o.once === 'month' && usedThisMonth(s, id)) return fn(o.onceText, s, arg) || 'Already given this month';
  const c = o.cost ? o.cost(s, arg) : null;
  if (c) for (const k in c) if (c[k] > 0 && (s.res[k] || 0) < c[k]) return `Not enough ${{ food: 'food', mat: 'materials', parts: 'spares' }[k] || k}`;
  return '';
};
LF.orders = function (s, view) {
  const out = [];
  for (const id of LF.ORDER_IDS) { const o = LF.ORDERS[id]; if (o.view !== view) continue;
    if (o.shown && !o.shown(s)) continue;
    for (const arg of (o.rows ? o.rows(s) : [null])) {
      const lock = LF.orderLock(s, id, arg);
      out.push({ id, arg, key: id + (arg === null || arg === undefined ? '' : ':' + arg), label: fn(o.label, s, arg), note: fn(o.note, s, arg) || '', info: o.info ? o.info(s, arg) : [],
        cost: o.cost ? o.cost(s, arg) : null, lock, hold: o.hold || 1800 });
    }
  }
  return out;
};
/* Give the order. Returns { ok, why, text, chips }. */
LF.order = function (s, id, arg) {
  const o = LF.ORDERS[id], why = LF.orderLock(s, id, arg);
  if (why) return { ok: false, why };
  const chips = [], c = o.cost ? o.cost(s, arg) : null, label = fn(o.label, s, arg);
  if (c) for (const k in c) if (c[k]) { const b = s.res[k]; s.res[k] = Math.max(0, s.res[k] - c[k]); chips.push({ t: LF.amount(s, k, -c[k], b), good: false }); }
  if (o.once === 'month') { s.ordM = s.ordM || {}; s.ordM[onceKey(id)] = LF.monthOf(s); }
  const text = o.act(s, arg, chips) || label;
  LF.log(s, text + (chips.length ? ' (' + chips.map(x => x.t).join(', ') + ')' : ''), 'order');
  s.ordN = s.ordN || {}; s.ordN[id] = (s.ordN[id] || 0) + 1;
  LF.orderPicked(s, id, arg, label);
  return { ok: true, text, chips, label };
};
/* The record of an order, in the same shape as a choice (decisions.js LF.picked). */
LF.orderPicked = function (s, id, arg, label) {
  const ck = 'order.' + id, ok = `${ck}#${arg === null || arg === undefined ? '' : arg}`, rk = ok + ':out';
  const rec = Object.assign({ order: true, ck, ok, rk, d: s.day, t: label, l: label, hit: null, died: [], sent: [] }, LF.ids(ck, ok, rk));
  s.ylog = (s.ylog || []).filter(e => e.d > s.day - 2 * LF.YEAR);
  s.ylog.push({ ck, ok, t: rec.t, l: rec.l, d: s.day, died: [], sent: [], hit: null, cid: rec.cid, oid: rec.oid, order: true });
  if (LF.onPick) try { LF.onPick(s, rec); } catch (e) {}
  return rec;
};

/* ================= THE SHIP (T2-1) ================= */
/* The tanks: two flights, three with the fuel cargo (content-setup.js). Fuel comes only from a refuel in the digester. */
LF.TANK = s => s && s.cargo && s.cargo.fuel ? 3 : 2;
LF.hasDigester = s => !!(s.flags.digester || s.built.digester);
/* A refuel under way: the digester runs, and the tanks read full at the next month's start. Called from the tick. */
LF.refuelTick = function (s) {
  const r = s.refuel; if (!r || s.day < r.d) return;
  s.refuel = null; s.fuel = Math.min(LF.TANK(s), (s.fuel || 0) + r.n);
  LF.log(s, `The digester's run is done. The lander's tanks read ${s.fuel >= LF.TANK(s) ? 'full' : `${NUMW[s.fuel] || s.fuel} flight${s.fuel === 1 ? '' : 's'}`}.`, 'good');
};
const landerWhy = s => { const L = s.machines.lander;
  if (!L || L.lost) return 'There is no lander';
  if (s.flags.lander_grounded) return 'The lander is grounded under its tarpaulin';
  return ''; };
const monthFood = s => LF.foodCons(s) * MONTH;
/* Whether the card waiting would itself spend sleepers or a flight: an order must not change that under it. */
LF.cardTouches = function (s, test) {
  const c = s.cur; if (!c || c.phase !== 'choose') return false;
  let opts = []; try { opts = LF.choices(s); } catch (e) { return false; }
  for (const o of opts) for (const k of ['out', 'ok', 'bad']) { const r = o.ch && o.ch[k]; if (!r) continue;
    let fx = r.fx; if (typeof fx === 'function') { try { fx = fx(s, c.ctx); } catch (e) { fx = null; } }
    if (fx && test(fx)) return true; }
  return false; };
const flightCard = s => LF.cardTouches(s, fx => fx.sleepers < 0 || fx.fly > 0 || fx.pop > 0 && /sleep|cryo|ship\.|seat\./.test(s.cur.id || ''));

LF.addOrder({ id: 'refuel', view: 'ship', hold: 2200, argsAll: [1, 2, 3],
  shown: s => !!s.machines.lander && !s.machines.lander.lost,
  rows: s => { const want = Math.max(0, LF.TANK(s) - (s.fuel || 0)); return want > 1 && !s.refuel ? [want, 1] : [Math.max(1, want)]; },
  label: (s, n) => n > 1 && n >= LF.TANK(s) - (s.fuel || 0) ? 'Fill the tanks in the digester' : (LF.TANK(s) - (s.fuel || 0)) > 1 ? 'Render one flight\'s fuel' : 'Top the tanks up in the digester',
  note: (s, n) => `${LF.flightFood(s) * n} food goes into the digester${s.flags.render_dead ? ', with the dead' : ''}. The tanks read ${n === 1 ? 'one flight fuller' : 'full'} at the start of next month, and nothing flies till then.`,
  cost: (s, n) => ({ food: LF.flightFood(s) * n }),
  info: (s, n) => [['time', 'Until next month'], ['yield', `Fuel for ${NUMW[n] || n} flight${n === 1 ? '' : 's'}`]],
  can: (s, n) => {
    const w = landerWhy(s); if (w) return w;
    if (!LF.hasDigester(s)) return s.project === 'digester' ? 'The digester is still going up' : 'Needs a digester';
    if (s.refuel) return 'The digester is already running';
    if ((s.fuel || 0) >= LF.TANK(s)) return 'The tanks are full';
    if (s.res.food - LF.flightFood(s) * n < monthFood(s)) return 'That would leave less than a month in the store';
    return ''; },
  act: (s, n, chips) => { s.refuel = { d: (LF.monthOf(s) + 1) * MONTH, n }; s.refuels = (s.refuels || 0) + 1;
    chips.push({ t: `Fuel: ${NUMW[n] || n} flight${n === 1 ? '' : 's'}, next month`, good: true });
    return n > 1 ? 'The digester is filled to the hatch and sealed. It will run all month.' : 'One flight\'s worth goes into the digester, and the still is lit.'; } });

/* What a launch brings: one flight, up to twenty sleepers woken and brought down, the lander worn; then who takes the
   seat (seat.down) and what rides in the cradle (ship.cargo) are asked, and the landing is told (LF.holdForFlight). */
LF.launchWhy = function (s) {
  const w = landerWhy(s); if (w) return w;
  if (s.flags.qs_dark) return `The ${s.world.ship} isn't answering`;
  if (s.refuel) return 'The digester is still filling the tanks';
  if (s.machines.lander.hp <= 15) return 'The lander is not fit to fly';
  if (flightCard(s)) return 'The card in front of you is about the sleepers: answer it first';
  if (!(s.sleepers > 0 || LF.inOrbit(s).length || LF.aboard(s).length)) return 'Nothing left aboard to bring down';
  if (!LF.canFly(s)) return (s.fuel || 0) < 1 && !s.flags.so_held && !s.flags.rust_cut ? 'The tanks are dry' : LF.flyWhy(s) || 'The lander cannot fly';
  return ''; };
LF.flyRun = function (s, chips) {
  LF.fly(s, 1, chips); const n = Math.min(20, s.sleepers); s.sleepers -= n; s.pop += n; s.flags.woke_n = n; LF.hurt(s, 'lander', -14, -5);
  s.morale = LF.clamp(s.morale + (n ? 2 : 0), 0, 100); s.flags.woken = (s.flags.woken || 0) + 1;
  if (chips) { if (n) chips.push({ t: `+${n} colonists`, good: true }); chips.push({ t: 'Lander worn', good: false }); }
  if (n) LF.log(s, n === 1 ? 'The last sleeper wakes to a sky nobody aboard had seen.' : `${n} sleepers wake to a sky they have never seen.`, 'good');
  return n; };
const LANDING = n => n >= 20 ? 'Twenty sleepers wake to a sky they have never seen. By evening they have been told everything, twice, by everyone.'
  : n > 1 ? `The last ${NUMW[n] || n} sleepers wake to a sky they have never seen. By evening they have been told everything, twice, by everyone. The cryo banks are empty now.`
  : n === 1 ? 'The last sleeper wakes to a sky nobody up there had seen, and walks down the ramp alone. By evening the whole colony has come to look.'
  : 'Nobody is left asleep aboard. The lander comes back down with what was still in the hold.';
LF.addOrder({ id: 'launch', view: 'ship', once: 'month', hold: 2600, onceText: 'The lander has flown this month',
  shown: s => !!s.machines.lander && !s.machines.lander.lost,
  label: 'Launch to the ship',
  note: s => { const p = H(s); return `${p}: "${s.sleepers ? `Up, wake ${LF.wakeWord(s)}, down again. ` : ''}${LF.inOrbit(s).length ? 'There\'s a seat for an officer. ' : ''}${LF.aboard(s).length ? 'One cradle for whatever\'s still in the hold. ' : ''}It's hard on her, every time."`; },
  info: s => { const i = [['time', 'The same month'], ['people', s.sleepers ? `${LF.wakeWord(s).replace(/^./, c => c.toUpperCase())} woken` : 'No sleepers left']];
    if (LF.inOrbit(s).length) i.push(['people', 'One officer down']); if (LF.aboard(s).length) i.push(['yield', 'One system down']); i.push(['danger', 'Hard on the lander']); return i; },
  can: s => LF.launchWhy(s),
  act: (s, a, chips) => {
    const n = LF.flyRun(s, chips), held = s.cur;
    // The landing is told on a card of its own (no month): the seat and the cradle are asked first, then the month's card comes back.
    s.cur = { gen: true, side: true, id: 'launch', build: 'shuttle', title: 'The Lander Comes Down', tone: 'flight', view: 'ship', attach: [], fid: null, text: '', choices: [], phase: 'result',
      result: { label: '', text: LANDING(n), chips: chips.slice(), remember: false, then: null } };
    s.heldCur = held;
    LF.holdForFlight(s);
    return n ? `The lander goes up for ${LF.num(n)} sleeper${n === 1 ? '' : 's'}.` : 'The lander goes up for what is left in the hold.'; } });
const H = s => { const p = LF.officer && LF.officer(s, 'command'); const q = LF.h && LF.h.P ? LF.h.P(s, 'pilot') : null; return q ? q.name : (p ? p.name : 'The flight crew'); };

/* The sleepers set down with the camp (setup.hold2): woken twenty at a time without a flight. */
LF.addOrder({ id: 'wake', view: 'ship', once: 'month', shown: s => (s.grounded || 0) > 0,
  label: s => `Wake ${Math.min(20, s.grounded) === s.grounded ? 'the last' : 'twenty'} of the sleepers set down with the camp`,
  note: s => `${s.grounded} pods in the shed by the pad, on their own batteries. No flight needed, and more mouths at once.`,
  info: s => [['people', `+${Math.min(20, s.grounded || 0)} colonists`], ['time', 'The same month']],
  can: s => (s.grounded || 0) > 0 ? '' : 'Nobody is left asleep in the shed',
  act: (s, a, chips) => { const n = Math.min(20, s.grounded); s.grounded -= n; s.pop += n; s.morale = LF.clamp(s.morale + 2, 0, 100);
    chips.push({ t: `+${n} colonists`, good: true });
    return `${n} of the sleepers set down with the camp are woken in the shed, one pod at a time.`; } });

/* A save from before the orders with a shuttle run under way: it goes up now, as the launch would have. */
LF.migrateOrders = function (s) {
  if (!s || !s.world) return;
  if (s.project === 'shuttle') { s.project = null; s.progress = 0; if (!LF.launchWhy(s)) LF.flyRun(s, null); }
  if (s.pend === 'shuttle') s.pend = null;
};
})();
/* The orders in the catalogue of decision ids (tools/ids.js): a card key order.<id>, and an option for each arg it can
   take where those are fixed (argsAll), else one for the order itself. */
(function () { const LF = globalThis.LF, cat0 = LF.catalogue;
  LF.catalogue = function () { const rows = cat0();
    for (const id of LF.ORDER_IDS) { const o = LF.ORDERS[id], ck = 'order.' + id, name = typeof o.label === 'string' ? o.label : id;
      rows.push(['card', ck, LF.uid('card:' + ck), name, '']);
      for (const a of o.argsAll || ['']) { const k = `${ck}#${a}`; rows.push(['option', k, LF.uid('opt:' + k), name, String(a)]); rows.push(['outcome', k + ':out', LF.uid(`out:${k}:out`), name, String(a)]); } }
    return rows; }; })();

/* ================= THE CREW (T2-3) ================= */
/* The Crew view's rules (NEXT.md T2-3; DESIGN.md "Orders" and "The four views"): what the colony is known as, what last
   moved each group outside, the last year as a record, an officer's state in a word, and three orders: rations (five
   steps, LF.RATIONS in core.js), hours (long, normal, short: s.flags.push_on and s.flags.safety, which cards also set),
   and revoking a standing order (s.standing, byRote in core.js). Nothing here touches who holds a seat. */
(function () {
'use strict';
const LF = globalThis.LF, MONTH = LF.MONTH, YEAR = LF.YEAR;
const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
const andList = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
const first = (s, k, alt) => { const p = LF.officer(s, k); return p ? p.first : alt; };

/* What the colony is known as, in a line or two: its doctrine, and what people talk about (LF.because). */
LF.knownAs = function (s) {
  const d = Object.keys(LF.DOC).map(ax => LF.doctrine(s, ax)).filter(Boolean).map(w => w.toLowerCase());
  const head = d.length ? `Known, to itself, as ${LF.an(andList(d))} colony.` : 'The colony has not settled into a way of doing things yet.';
  const hot = LF.hot ? LF.hot(s)[0] : null, why = hot && LF.because(s, hot[0]);
  return head + (why ? ` What people talk about: ${why}.` : '');
};
/* What last moved a group outside the wire: the last thing the colony did to it, from the ledger (gen.js PAST). */
LF.groupWhy = function (s, f) {
  const e = (s.ledger || []).filter(x => x.fid === f.id).pop(), P = e && e.ap && LF.PAST && (LF.PAST[f.kind] || {})[e.ap];
  if (P) return `${cap(P[0].replace('{n}', f.name))}${e.ok === false ? ', and it went badly' : ''}, ${LF.dateStr(e.d).toLowerCase()}.`;
  if (f.kills >= 3) return `${f.kills} names on the wall are theirs.`;
  return f.stage >= 2 ? 'Nothing the colony has done has moved them yet.' : '';
};
/* The deeds that weigh most: the worst kinds first, then the most recent (content-limits.js). */
LF.weighs = s => LF.deedList ? LF.deedList(s).slice(0, 3).map(d => d[1]) : [];
/* The last year, newest first: what the chronicle recorded and what was chosen (s.ylog; orders left out). */
LF.history = function (s) {
  const since = s.day - YEAR, out = [];
  for (const e of s.chron || []) if (e.d > since && !/^The colony came to be known, to itself/.test(e.t)) out.push({ d: e.d, t: e.t, k: 'chron' });
  for (const e of s.ylog || []) { const st = LF.byId[e.ck], t = e.t || (st && typeof st.title === 'string' ? st.title : '');
    if (e.d <= since || e.order || !e.l || /^The End of Year/.test(t)) continue;
    const l = e.l.replace(/[.!]$/, ''); out.push({ d: e.d, t: `${t ? t + ': ' : ''}${l}.${e.hit === false ? ' It went badly.' : e.hit === true ? ' It worked.' : ''}`, k: 'pick' }); }
  return out.sort((a, b) => b.d - a.d);
};
/* An officer's state in a word or two: on duty, resting after a mission (until when), aboard, away, hurt. */
LF.dutyWord = function (s, p) {
  if (!p || !p.alive) return 'gone';
  if (p.orbit) return 'aboard the ship';
  if (p.away) return 'away with a party';
  if (LF.laidUp(s, p)) return `hurt, back in ${LF.monthsWord(Math.ceil((p.hurt - s.day) / MONTH))}`;
  if (LF.spent && LF.spent(s, p)) return `resting, ready in ${LF.monthsWord(Math.ceil((p.spent - s.day) / MONTH))}`;
  return 'on duty';
};

/* ---- rations ---- */
const STEP = LF.RATION_STEPS, at = s => Math.max(0, STEP.indexOf(s.rations || 'normal'));
const given = (s, id) => !!s.ordM && s.ordM[id] === LF.monthOf(s);
const R_LABEL = { half: 'Half rations', tight: 'Short rations', normal: 'Full rations', generous: 'Generous rations', double: 'Double rations' };
const R_NOTE = {
  half: 'Half a ladle for everyone, officers too. The store lasts twice as long. People work slower, more of them fall ill or get hurt, and the clinic carries it.',
  tight: 'Three-quarters of a ladle. The store stretches, and the mess hall goes quiet.',
  normal: 'A full ladle, as the stores were planned for.',
  generous: 'A heavier ladle. People notice, and so does the store.',
  double: 'Two full ladles a day. People are steadier and stronger at the work, and the store empties half as fast again.' };
const R_TEXT = {
  half: 'The ladle is cut to half. People take it without a word, which is worse than complaining.',
  tight: 'The ladle goes to three-quarters. The line at the mess moves faster, and nobody stays to talk.',
  normal: 'The full ladle comes back. The mess hall is loud again.',
  generous: 'The ladle comes up heavier. Somebody cheers in the queue, and everyone laughs at them.',
  double: 'Two ladles a day, for as long as the store holds. The mess hall is full an hour before it opens.' };
const R_INFO = { half: [['danger', 'Morale, the sick and the hurt'], ['danger', 'Slower work']], tight: [['danger', 'Morale']], normal: [], generous: [['yield', 'Morale']], double: [['yield', 'Morale, and strength']] };
const monthsAt = (s, k) => s.res.food / Math.max(1, LF.mouths(s) * LF.RATIONS[k].eat * MONTH);
LF.rationsDir = 0;   // the last change, for its sound (sounds.js): below zero a cut. Not state.
LF.addOrder({ id: 'rations', view: 'people', once: 'month', argsAll: STEP.slice(), onceText: 'The rations were changed this month',
  rows: s => given(s, 'rations') ? [s.rations || 'normal'] : STEP.slice(),   // once changed this month, only where it stands
  label: (s, k) => R_LABEL[k],
  note: (s, k) => R_NOTE[k],
  info: (s, k) => { const m = monthsAt(s, k); return R_INFO[k].concat([['time', m >= 24 ? 'Two years of food or more at this ladle' : m < 1 ? 'Under a month of food at this ladle' : `About ${LF.monthsWord(m)} of food at this ladle`]]); },
  can: (s, k) => {
    if ((s.rations || 'normal') === k) return given(s, 'rations') ? 'Changed this month. It can change again next month' : 'The colony eats this now';
    if (LF.cardTouches(s, fx => !!fx.rations)) return 'The card in front of you is about the rations: answer it first';
    if (STEP.indexOf(k) > 2 && monthsAt(s, k) < 2) return 'The store could not carry it two months';
    return ''; },
  act: (s, k, chips) => {
    const d = STEP.indexOf(k) - at(s); LF.rationsDir = d; s.rations = k;
    if (d <= -2) { s.morale = LF.clamp(s.morale - 6, 0, 100); chips.push({ t: 'Morale sinks', good: false }); }
    chips.push({ t: `Rations: ${k}`, good: d > 0 });
    return R_TEXT[k]; } });

/* ---- hours ---- */
LF.hoursOf = s => s.flags.push_on ? 'long' : s.flags.safety ? 'short' : 'normal';
const H_LABEL = { long: 'Long hours', normal: 'Ordinary hours', short: 'Short hours' };
LF.addOrder({ id: 'hours', view: 'people', once: 'month', argsAll: ['long', 'normal', 'short'], onceText: 'The hours were changed this month',
  rows: s => given(s, 'hours') ? [LF.hoursOf(s)] : ['long', 'normal', 'short'],
  label: (s, k) => H_LABEL[k],
  note: (s, k) => k === 'long' ? `Fourteen-hour shifts on every site. Builds go up faster and the machines wear harder, and ${first(s, 'crew', 'whoever runs the works')} carries it every month.`
    : k === 'short' ? 'Shorter shifts, and nobody on a scaffold after dark. Builds go slower, and people are steadier for it.'
    : 'The shifts the colony landed with.',
  info: (s, k) => k === 'long' ? [['yield', 'Builds, sooner'], ['danger', 'Wear, and the Works officer\'s nerve']] : k === 'short' ? [['yield', 'Morale'], ['danger', 'Builds, later']] : [],
  can: (s, k) => {
    if (LF.hoursOf(s) === k) return given(s, 'hours') ? 'Changed this month. It can change again next month' : 'The colony works these hours now';
    if (LF.cardTouches(s, fx => !!fx.flags && ('push_on' in fx.flags || 'safety' in fx.flags))) return 'The card in front of you is about the pace of work: answer it first';
    return ''; },
  act: (s, k, chips) => {
    s.flags.push_on = k === 'long'; s.flags.safety = k === 'short';
    chips.push({ t: `Hours: ${k === 'normal' ? 'ordinary' : k}`, good: k !== 'long' });
    return k === 'long' ? 'The shift bell rings at first light and again after dark. The sites stay lit.'
      : k === 'short' ? 'The shift bell rings an hour earlier. The scaffolds are empty by dusk.'
      : 'The shift bell goes back to the hours it rang on the first day.'; } });

/* ---- standing orders: revoke one, and the card comes to the player again ---- */
const stood = s => Object.keys(s.standing || {}).filter(id => s.standing[id] !== undefined && s.standing[id] !== null && LF.byId[id]);
const titleOf = id => { const st = LF.byId[id]; return st && typeof st.title === 'string' ? st.title : 'a card'; };
const answerOf = (s, id) => { const st = LF.byId[id], ch = st && st.choices[s.standing[id]]; if (!ch) return '';
  try { return String(typeof ch.label === 'function' ? ch.label(s, {}) : ch.label).replace(/\.$/, ''); } catch (e) { return ''; } };
LF.standingList = s => stood(s).map(id => ({ id, title: titleOf(id), answer: answerOf(s, id) }));
LF.addOrder({ id: 'revoke', view: 'people',
  get argsAll() { return LF.storylets.filter(st => st.standing).map(st => st.id); },
  shown: s => stood(s).length > 0,
  rows: s => stood(s),
  label: (s, id) => `Revoke the standing order on ${titleOf(id)}`,
  note: (s, id) => `Carried out every time as "${answerOf(s, id)}". Revoked, the card comes to you again the next time it is due.`,
  info: () => [['time', 'The next time it comes']],
  can: (s, id) => s.cur && s.cur.id === id ? 'That card is in front of you now' : '',
  act: (s, id, chips) => { delete s.standing[id]; if (s.habit) delete s.habit[id];
    chips.push({ t: 'Standing order revoked', good: true });
    return `${titleOf(id)} is struck out of the duty book. The next one comes to you.`; } });

/* Each month: half rations wear on the doctor's nerve, long hours on the Works officer's. */
const tick0 = LF.tick;
LF.tick = function (s) {
  const d0 = s.day; tick0(s);
  if (s.day === d0 || s.day % MONTH !== 0 || !s.world || LF.aloft(s)) return;
  if (s.rations === 'half') LF.shift(s, 'doctor', 'mind', -2);
  if (s.flags.push_on) LF.shift(s, 'crew', 'mind', -1.5);
};
/* Double rations: a small lift to the tests that need will or strength (force, labour, command). */
const WILL = ['security', 'crew', 'quartermaster', 'botanist', 'command', 'pilot'];
const odds0 = LF.odds;
LF.odds = function (s, test, c) {
  const o = odds0(s, test, c);
  if (s.rations !== 'double' || !s.world || test.aboard || LF.aloft(s)) return o;
  const k = [].concat(test.kind || []);
  if (k.includes('fight') || test.ap === 'force' || (test.mods || []).some(m => m.k === 'role' && WILL.includes(m.role))) {
    o.parts.push({ label: 'Two ladles a day', v: 5 }); o.raw = (o.raw === undefined ? o.p : o.raw) + 5; o.p = LF.clamp(o.raw, 5, 95); }
  return o;
};
})();
/* ================= THE COLONY (T2-2) ================= */
/* The yard (Lachlan, 2026-11-16; DESIGN.md "Orders", "Buildings"). The project in hand is s.project; a paused one is
   parked in s.parked[id] = { progress, d } with its materials spent and its work kept whole; s.bq is up to two builds
   queued after the one in hand; s.paid[id] is what a build in hand or parked took from the yard, so a cancel gives back
   every unit. A salvage push (order.stop) is s.salv = { d, per }: materials coming in each day until day d. All made on
   demand, plain JSON. The build card (LF.firePlan) still comes for First Things, when a build finishes with nothing
   queued, and when an outcome asks for it (then: 'plan'). */
(function () {
'use strict';
const LF = globalThis.LF, MONTH = LF.MONTH;
const COUNCIL_UP = 'The council is asking about this now: answer its card';
const P = id => LF.PROJECTS[id];
const lc = (s, id) => LF.projName(s, id).toLowerCase();
const what = (s, id) => id === 'spares' ? 'a batch of spares' : `the ${lc(s, id)}`;
const IDS = Object.keys(LF.PROJECTS);
const parked = (s, id) => !!(s.parked && s.parked[id]);
const bq = s => s.bq || [];
const planUp = s => !!(s.cur && s.cur.plan && s.cur.phase === 'choose');
const labor = (s, id) => Math.max(1, LF.cost(s, id).labor);
/* How far along, in words, and the months left at the present crews (council.js buildDays). */
LF.yardFrac = (s, id) => Math.min(1, (id === s.project ? s.progress : parked(s, id) ? s.parked[id].progress : 0) / labor(s, id));
LF.yardHow = f => f < 0.05 ? 'Pegged out' : f < 0.3 ? 'Just started' : f < 0.45 ? 'Under way' : f < 0.65 ? 'About half done' : f < 0.85 ? 'Well along' : 'Nearly finished';
LF.yardLeft = (s, id) => LF.buildDays(s, id) * Math.max(0.05, 1 - LF.yardFrac(s, id));
LF.yardPaid = (s, id) => s.paid && s.paid[id] ? s.paid[id] : 0;
const lost = x => x < 0.05 ? 'Next to no work lost' : `${LF.yardHow(x)}: that work is lost`;

function park(s) {
  const id = s.project; if (!id) return;
  s.parked = s.parked || {}; s.parked[id] = { progress: Math.round(s.progress * 10) / 10, d: s.day };
  s.project = null; s.progress = 0;
}
/* Start a build, or resume a parked one where it stopped. how: 'order' and 'queue' (paid by the caller), 'card' (the
   build card's cost was paid with the choice). A build in hand when a card starts another is parked, never lost. */
LF.yardStart = function (s, id, how) {
  if (s.project === id) return;
  if (s.project) park(s);
  s.paid = s.paid || {};
  const pk = s.parked && s.parked[id];
  if (pk) { s.progress = pk.progress; delete s.parked[id]; }
  else { s.progress = 0; s.paid[id] = LF.cost(s, id).mat; }
  s.project = id; s.yardSaid = null; s.waited = false;
  if (s.bq) s.bq = s.bq.filter(x => x !== id);
};
/* Every day: the salvage push comes in, stale entries go, and with nothing in hand the queue's head starts if the yard
   holds its materials (otherwise it waits, and the crews salvage). */
LF.yardTick = function (s) {
  if (s.salv) { if (s.day <= s.salv.d) s.res.mat += s.salv.per; if (s.day >= s.salv.d) s.salv = null; }
  const gone = id => !P(id) || (!P(id).repeat && s.built[id]);
  if (s.parked) for (const id in s.parked) if (gone(id)) delete s.parked[id];
  if (s.bq) s.bq = s.bq.filter(id => !gone(id) && id !== s.project);
  if (s.paid) for (const id in s.paid) if (id !== s.project && !parked(s, id)) delete s.paid[id];
  if (s.project || s.salv) return;
  if (bq(s).length) {
    const id = s.bq[0], pk = parked(s, id), why = LF.canStart(s, id);
    if (why && !(pk && /materials/.test(why))) {
      if (/materials/.test(why)) return;
      s.bq.shift(); LF.log(s, `The ${lc(s, id)} comes off the queue: ${why.charAt(0).toLowerCase() + why.slice(1)}.`, 'bad'); return; }
    if (!pk) s.res.mat -= LF.cost(s, id).mat;
    LF.yardStart(s, id, 'queue'); s.yardQ = (s.yardQ || 0) + 1;
    LF.log(s, pk ? `The crews go back to the ${lc(s, id)}, next in the queue, where they left it.` : `The crews start on the ${lc(s, id)}, next in the queue.`, 'event');
    return; }
  // An idle yard that can build again says so once, in the Meanwhile list.
  if (s.day % 3 || !Object.keys(s.built).length) return;
  const best = IDS.filter(id => !P(id).repeat && !P(id).extra && !LF.canStart(s, id)).sort((a, b) => LF.pitchScore(s, b) - LF.pitchScore(s, a))[0];
  if (best && s.yardSaid !== best) { s.yardSaid = best; LF.log(s, `The yard holds enough to start the ${lc(s, best)}. The build crews are on salvage until something is chosen.`, 'event'); }
};
/* Why a build cannot be started (or queued) now: the build's own requirement, the materials (none for a parked one, and a
   queued one pays when it starts), and the rule the council keeps: none of the buildings that matter while a founding
   build waits on the materials it would spend ("The yard is saving for..."). */
LF.yardWhy = function (s, id, as) {
  if (planUp(s)) return COUNCIL_UP;
  const p = P(id), pk = parked(s, id); let why = LF.canStart(s, id);
  if (why && /materials/.test(why) && (pk || as === 'queue')) why = '';
  if (why) return why;
  if (p.extra && !pk && as !== 'queue') {
    const wait = IDS.filter(k => !P(k).extra && !P(k).repeat && k !== s.project && !parked(s, k) && /materials/.test(LF.canStart(s, k)));
    if (wait.length) { const keep = Math.min(...wait.map(k => LF.cost(s, k).mat)), first = wait.sort((a, b) => LF.pitchScore(s, b) - LF.pitchScore(s, a))[0];
      if (s.res.mat - LF.cost(s, id).mat < keep) return `The yard is saving for the ${lc(s, first)}`; } }
  return '';
};
/* Every build not standing, the one in hand left out: what can start before what cannot, the council's favourite first. */
LF.yardList = s => IDS.filter(id => (P(id).repeat || !s.built[id]) && id !== s.project && (id !== 'digester' || !LF.hasDigester(s)))
  .map(id => [id, LF.yardWhy(s, id, 'build') ? 1 : 0, LF.pitchScore(s, id)]).sort((a, b) => a[1] - b[1] || b[2] - a[2]).map(x => x[0]);
/* Who in the council wants it, in their own words (council.js PITCH). */
LF.yardVoice = (s, id) => { const T = LF.PITCH[id]; if (!T) return ''; const who = LF.h.P(s, T.by);
  return `${who ? who.name : LF.seatWord(s, T.by).replace(/^./, c => c.toUpperCase())}: "${T.say(s)}"`; };
LF.yardDesc = (s, id) => { const d = P(id).desc; return typeof d === 'function' ? d(s) : d; };
const binfo = (s, id) => { const T = LF.PITCH[id], i = [['time', LF.buildSpan(LF.yardLeft(s, id))]]; if (T) i.push(['yield', T.yields]);
  const pl = P(id).pillar; if (pl) i.push(['cord', pl === 'people' && LF.heads(s) < LF.peopleNeed(s) ? 'Half the people cord' : `Cuts the ${LF.PILLARS[pl].name.toLowerCase()} cord`]);
  return i; };
const bcost = (s, id) => parked(s, id) ? null : { mat: LF.cost(s, id).mat };
const goText = (s, id) => parked(s, id) ? `The crews go back to the ${lc(s, id)} where they left it.` : LF.PITCH[id] ? LF.PITCH[id].go : `Work starts on ${what(s, id)}.`;

LF.addOrder({ id: 'build', view: 'colony', panel: 'yard', argsAll: IDS, hold: 1800,
  shown: s => !s.project, rows: s => LF.yardList(s),
  label: (s, id) => `${parked(s, id) ? 'Resume' : 'Start'} ${what(s, id)}`,
  note: (s, id) => `${LF.yardVoice(s, id)} ${LF.yardDesc(s, id)}`.trim(),
  info: binfo, cost: bcost, can: (s, id) => LF.yardWhy(s, id, 'build'),
  act: (s, id) => { const t = goText(s, id); LF.yardStart(s, id, 'order'); return t; } });
LF.addOrder({ id: 'switch', view: 'colony', panel: 'yard', argsAll: IDS, hold: 2200,
  shown: s => !!s.project, rows: s => LF.yardList(s),
  label: (s, id) => `Pause the ${lc(s, s.project)} and ${parked(s, id) ? 'resume' : 'start'} ${what(s, id)}`,
  note: (s, id) => `${LF.yardVoice(s, id)} ${LF.yardDesc(s, id)} The ${lc(s, s.project)} keeps its materials and every day's work put into it.`.trim(),
  info: binfo, cost: bcost, can: (s, id) => LF.yardWhy(s, id, 'build'),
  act: (s, id) => { const was = lc(s, s.project), t = goText(s, id); LF.yardStart(s, id, 'order'); return `The crews down tools on the ${was} and move over. ${t}`; } });
LF.addOrder({ id: 'pause', view: 'colony', panel: 'yard', hold: 1600,
  shown: s => !!s.project, label: s => `Pause the ${lc(s, s.project)}`,
  note: s => `It keeps its materials and every day's work put into it, and resumes exactly where it stopped. ${bq(s).length ? `The ${lc(s, s.bq[0])} is next in the queue.` : 'With nothing else started, the build crews go out on salvage.'}`,
  info: s => [['time', 'No work lost'], ['yield', bq(s).length ? `The ${lc(s, s.bq[0])} next` : 'Crews to salvage']],
  can: s => planUp(s) ? COUNCIL_UP : '',
  act: s => { const was = lc(s, s.project); park(s); return `Work on the ${was} stops where it stands.${bq(s).length ? '' : ' The build crews go out with the salvage sledges.'}`; } });
LF.addOrder({ id: 'cancel', view: 'colony', panel: 'yard', argsAll: IDS, hold: 2400,
  rows: s => (s.project ? [s.project] : []).concat(Object.keys(s.parked || {})),
  label: (s, id) => `Cancel the ${lc(s, id)}`,
  note: (s, id) => { const n = LF.yardPaid(s, id), x = LF.yardFrac(s, id);
    return `${n ? `Every unit of material it took goes back to the yard, ${n} in all.` : 'It took nothing from the yard, so nothing goes back.'} ${x >= 0.05 ? `The work is lost: it was ${LF.yardHow(x).toLowerCase()}.` : 'Hardly any work is lost.'}`; },
  info: (s, id) => [['yield', `+${LF.yardPaid(s, id)} materials back`], ['danger', lost(LF.yardFrac(s, id))]],
  can: s => planUp(s) ? COUNCIL_UP : '',
  act: (s, id, chips) => { const n = LF.yardPaid(s, id), b = s.res.mat;
    if (id === s.project) { s.project = null; s.progress = 0; } if (s.parked) delete s.parked[id]; if (s.paid) delete s.paid[id]; if (s.bq) s.bq = s.bq.filter(x => x !== id);
    s.res.mat += n; if (n) chips.push({ t: LF.amount(s, 'mat', n, b), good: true });
    return `The ${lc(s, id)} is taken down to the pegs. Its plate and beams go back on the racks.`; } });
LF.addOrder({ id: 'queue', view: 'colony', panel: 'yard', argsAll: IDS, hold: 1400,
  shown: s => !!s.project, rows: s => LF.yardList(s).filter(id => !bq(s).includes(id)),
  label: (s, id) => `Queue ${what(s, id)} ${bq(s).length ? 'after that' : 'next'}`,
  note: (s, id) => { const after = lc(s, bq(s).length ? s.bq[0] : s.project);
    return parked(s, id) ? `It starts again where it stopped once the ${after} is finished. Its materials are in it already.` : `It starts once the ${after} is finished, if the yard holds its ${LF.cost(s, id).mat} materials by then. They are paid when it starts.`; },
  info: () => [['time', 'When the crews are free']],
  can: (s, id) => bq(s).length >= 2 ? 'Two are queued already' : bq(s).includes(id) ? 'Already queued' : LF.yardWhy(s, id, 'queue'),
  act: (s, id) => { s.bq = bq(s).concat([id]); return `The ${lc(s, id)} is ${s.bq.length === 1 ? 'next' : 'second'} in the queue.`; } });
LF.addOrder({ id: 'unqueue', view: 'colony', panel: 'yard', argsAll: IDS, hold: 900,
  rows: s => bq(s).slice(), label: (s, id) => `Take the ${lc(s, id)} off the queue`, note: 'Nothing was paid for it yet, so nothing is lost.', info: () => [],
  act: (s, id) => { s.bq = bq(s).filter(x => x !== id); return `The ${lc(s, id)} comes off the queue.`; } });
LF.addOrder({ id: 'bqup', view: 'colony', panel: 'yard', argsAll: IDS, hold: 900,
  rows: s => bq(s).length > 1 ? [s.bq[1]] : [], label: (s, id) => `Put the ${lc(s, id)} first in the queue`, note: 'The two queued builds change places.', info: () => [],
  act: (s, id) => { s.bq = [id].concat(bq(s).filter(x => x !== id)); return `The ${lc(s, id)} is next in the queue now.`; } });
LF.addOrder({ id: 'stop', view: 'colony', panel: 'yard', once: 'month', hold: 1800, onceText: 'The crews have been out on salvage this month',
  label: 'Build nothing yet. Put the crews on salvage',
  note: s => `${s.project ? `The ${lc(s, s.project)} is paused where it stands, with its materials and its work kept. ` : ''}The build crews go out with the salvage sledges for the rest of the month and the yard fills: about 14 materials. Nothing goes up${bq(s).length ? ' and the queue waits' : ''}, and whatever is wearing out goes on wearing.`,
  info: () => [['time', 'The rest of the month'], ['yield', 'About 14 materials']],
  can: s => s.salv ? 'The crews are already out with the sledges' : planUp(s) ? COUNCIL_UP : '',
  act: (s, a, chips) => { if (s.project) park(s); const d = (LF.monthOf(s) + 1) * MONTH; s.salv = { d, per: Math.round(1400 / Math.max(1, d - s.day)) / 100 }; s.nextPlan = s.day + 20;
    chips.push({ t: 'Materials: about +14 this month', good: true });
    return 'The build crews go out with the salvage sledges instead. The yard begins to fill.'; } });
/* A save from before the yard: whatever is in hand was paid for in full by the card that started it. */
const mig0 = LF.migrateOrders;
LF.migrateOrders = function (s) { mig0(s); if (s && s.world && !s.paid) { s.paid = {}; if (s.project && P(s.project)) s.paid[s.project] = LF.cost(s, s.project).mat; } };
})();

/* ================= THE WORLD (T2-5) ================= */
/* Expeditions the player sends (NEXT.md T2-5; DESIGN.md "Expeditions", "Orders"). Every party is an ordinary s.away entry
   made by LF.sendAway, with order: true and, for a place, poi set, so LF.party, the trail on the map and "Out past the
   wire" work as for a card's party. Small (four to six) is quicker, safer and brings back less; large (ten to fifteen)
   needs someone to lead it: an officer whose department explores, or someone known by name, who is spent for two months
   or more after (LF.SENT_REST). Eighteen hands always stay home. Provisions leave with them: food a head a month at the
   present ration (LF.RATIONS). A survey party walks the country with no place to reach (js/places.js LF.surveyFind).
   With the signals room standing a party can be called back or sent on to a place it is near; without it nothing reaches them.
   Coming home (LF.awayTick, wrapped below): a return with nothing to decide (LF.AWAY_QUIET) is a Meanwhile line; one that
   needs a decision is the month's card, one a month, and the rest wait for the next. A thread's place resolves through
   the thread: LF.THREADS[id].visit(s, t, a) -> { text, fx, title, tone, scene, quiet } or null (the generic return); quiet: true
   makes a find with nothing to decide a Meanwhile line. Fields made on demand: a.order, a.poi, a.size, a.far, a.food, a.bear,
   a.redir, a.recalled, a.visq; s.surveyN. */
(function () {
'use strict';
const LF = globalThis.LF, MONTH = LF.MONTH, clamp = LF.clamp;
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
const num = n => NUMW[n] || String(n), cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
const hash = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const HOME = 18;
LF.PARTY_SIZE = { small: [4, 6], large: [10, 15], survey: [3, 5] };
const DIV = { small: 6, large: 4, survey: 8 };
const spare = s => LF.hands(s) - HOME;
/* How many go: as many as the size allows from the hands to spare, never below its floor (then the order is locked). */
LF.partyN = (s, size) => { const [lo, hi] = LF.PARTY_SIZE[size]; return clamp(Math.floor(spare(s) / DIV[size]), lo, hi); };
const eats = (s, n, mo) => Math.round(n * mo * MONTH * LF.ration(s).eat);
const monthFood = s => LF.foodCons(s) * MONTH;
const comms = s => LF.has(s, 'comms');
const dim = s => LF.date(s.day).season === 3;

/* The places as they stand, read once per state of the colony (LF.pois is not cheap and every row asks). */
let pc = null;
const sig = s => [s.day, (s.pois || []).length, s.away.length, Object.keys(s.been || {}).length, Object.keys(s.poiAt || {}).length, s.dilemmas, s.log.length, s.factors.length].join(':');
const placesNow = s => { if (!LF.pois) return []; const g = sig(s); if (!pc || pc.s !== s || pc.g !== g) pc = { s, g, L: LF.pois(s) }; return pc.L; };
const placeOf = (s, id) => placesNow(s).find(p => p.id === id) || null;
const DONE = ['visited', 'worked out', 'gone'];
const goingTo = (s, id) => s.away.some(a => a.poi === id);
/* Where a party could be sent: everything on the map but the colony's own settlements and what is gone. */
const reachable = p => p.kind !== 'town' && p.owner !== 'colony' && p.state !== 'gone';
const fresh = p => reachable(p) && !DONE.includes(p.state) && !p.been.length;
LF.sendable = s => placesNow(s).filter(p => fresh(p) && !goingTo(s, p.id));
/* The nearest place nobody has been to and nobody is on the way to: the World view's short version of the order. */
LF.nearestPlace = s => LF.sendable(s).sort((a, b) => (a.months - b.months) || (a.danger - b.danger) || (a.id < b.id ? -1 : 1))[0] || null;

/* What kind of return a place gives (gen.js REWARD): a thread's own, a factor's, a lead's, or by its kind. */
const BY_KIND = { wreck: 'wreck', ore: 'seam', spring: 'spring', ridge: 'ridge', camp: 'camp', signal: 'signal', growth: 'growth', herd: 'grazing', crater: 'crater', cave: 'hollow', track: 'track', ruin: 'ruin', mark: 'mark' };
const SIG_RET = { reach: 'reach', drummers: 'drummers', spire: 'ruin' };
LF.placeRet = function (s, p) {
  if (p.owner && LF.THREADS[p.owner] && s.threads && s.threads[p.owner] && p.id.startsWith(p.owner + '.')) return { ret: 'thread' };
  const F = s.factors.find(x => x.id === p.key);
  if (F) return { ret: F.kind, fid: F.id };
  if (p.owner === 'land') { const fr = (LF.frames || []).find(x => x.id === p.key), ch = fr && (fr.choices || []).find(o => o.send); if (ch) return { ret: ch.send.ret }; }
  if (SIG_RET[p.key]) return { ret: SIG_RET[p.key] };
  return { ret: BY_KIND[p.kind] || 'mark' };
};
/* Who could lead a large party: an officer on the ground whose department explores (Command goes anywhere), then the
   people known by name; none hurt, away, aboard or just back from the last one. */
LF.partyLeaders = s => s.people.filter(p => p.alive && !p.orbit && !p.away && !p.left && !LF.laidUp(s, p) && !LF.spent(s, p) && (p.role ? !!p.seat && LF.canDo(p, ['explore']) : true))
  .sort((a, b) => (b.role ? 1 : 0) - (a.role ? 1 : 0) || (b.deeds || []).length - (a.deeds || []).length).slice(0, 3);
const byPid = (s, id) => id && s.people.find(p => p.id === id);
/* How dangerous the going is: the place, the season (the Dim is worse), a small party's care, and who leads. */
LF.partyDanger = function (s, p, size, L) {
  let d = (p && p.danger) || 0; if (dim(s)) d += 1; if (size === 'small' || size === 'survey') d -= 0.5;
  if (L) { if (L.role && L.seat === 'security') d -= 1; if ((L.perks || []).some(k => k === 'pathfinder' || k === 'guide')) d -= 1; if (L.trait === 'reckless') d += 0.5; if (L.trait === 'cautious') d -= 0.5; }
  return clamp(Math.round(d), 0, 5);
};
const BAND = { near: [1, 2], far: [3, 5], long: [6, 12] };   // there and back, by how far (NEXT.md T2-5): a small party a month quicker, a large one a month slower, inside the band
const tripMonths = (p, size) => { const [lo, hi] = BAND[p.dist] || BAND.near, m = clamp(p.months, lo, hi); return size === 'small' ? Math.max(lo, m - 1) : size === 'large' ? Math.min(hi, m + 1) : m; };
/* A place's name inside a sentence: "the hollow hill", "steam to the north", but "Caldera Island" and "the Many" kept. */
const toWord = name => { if (/^(A|An) /.test(name)) return String(name).toLowerCase();   // "A Fresh Crater" is a crater, not a name
  const n = String(name).replace(/^(The|A|An) /, m => m.toLowerCase()); const w = n.split(' ');
  return w.length > 1 && w.slice(1).every(x => !/^[A-Z]/.test(x)) ? n.charAt(0).toLowerCase() + n.slice(1) : n; };
const parse = arg => { const [id, size, pid] = String(arg || '').split('|'); return { id, size: size === 'large' ? 'large' : 'small', pid: pid || null }; };
/* Everything the order needs to know about one party, worked out the same way for the row, its lock and the act. */
LF.partyPlan = function (s, arg) {
  const q = parse(arg), p = placeOf(s, q.id), L = q.size === 'large' ? byPid(s, q.pid) : null;
  if (!p) return { q, p: null };
  const n = LF.partyN(s, q.size), mo = tripMonths(p, q.size);
  return { q, p, L, n, mo, food: eats(s, n, mo), danger: LF.partyDanger(s, p, q.size, L) };
};
const dangerWord = d => LF.poiDanger ? LF.poiDanger(d) : String(d);
const handsWhy = (s, n) => spare(s) < n ? `Needs ${num(n)} to spare: ${LF.hands(s)} are home, and ${HOME} must stay` : '';
const foodWhy = (s, food) => s.res.food - food < monthFood(s) ? 'That would leave less than a month in the store' : '';
const first = p => p.first || p.name;
function leaderWhy(s, L) {
  if (!L) return 'A large party needs someone to lead it: an officer who explores, or someone known by name';
  if (!L.alive || L.left) return 'They are gone';
  if (L.orbit) return `${first(L)} is aboard the ship`;
  if (L.away) return `${first(L)} is out past the wire`;
  if (LF.laidUp(s, L)) return `${first(L)} is hurt`;
  if (LF.spent(s, L)) return `${first(L)} is just back: ${LF.monthsWord((L.spent - s.day) / MONTH)} more`;
  if (L.role && !LF.canDo(L, ['explore'])) return `${LF.title(L)} is not work for exploring`;
  return ''; }

LF.addOrder({ id: 'send', view: 'world', panel: 'place', hold: 2200, once: 'month', onceKey: 'party', onceText: 'A party has gone out this month',
  shown: s => !!LF.pois,
  // every place a party could go: a small party, and a large one under each who could lead it (or one, locked, with nobody)
  rows: s => { const out = [], Ls = LF.partyLeaders(s);
    for (const p of placesNow(s)) { if (!reachable(p)) continue; out.push(p.id + '|small');
      if (!fresh(p)) continue;
      if (Ls.length) for (const L of Ls) out.push(`${p.id}|large|${L.id}`); else out.push(p.id + '|large'); }
    return out; },
  inBox: (s, arg) => { const p = LF.nearestPlace(s); return !!p && arg === p.id + '|small'; },
  label: (s, arg) => { const x = LF.partyPlan(s, arg); if (!x.p) return 'Send a party';
    return x.q.size === 'large' ? (x.L ? `Send ${num(x.n)} under ${x.L.name}` : `Send a large party of ${num(x.n)}`) : `Send a small party of ${num(x.n)}`; },
  boxLabel: (s, arg) => { const x = LF.partyPlan(s, arg); return x.p ? `Send ${num(x.n)} to ${toWord(x.p.name)}, the nearest place nobody has been` : 'Send a party'; },
  note: (s, arg) => { const x = LF.partyPlan(s, arg); if (!x.p) return '';
    const lead = x.L ? ` ${x.L.name} leads. ${((LF.PARTY_LEAD || {})[x.L.role] || {}).n || ''} Whatever comes of it, ${first(x.L)} will not be fit to go out again for two months or more.` : '';
    return `${x.q.size === 'small' ? 'Quicker and safer, and they bring back less.' : 'Slower, and they bring back more.'} ${cap(LF.monthsWord(x.mo))} there and back, with ${x.food} food on their backs.${x.p.state === 'rumoured' ? ' Nobody has seen it close: it may not be where the word puts it.' : ''}${dim(s) ? ' It is the Dim, and the going is worse.' : ''}${lead}`.replace(/\s+/g, ' ').trim(); },
  info: (s, arg) => { const x = LF.partyPlan(s, arg); if (!x.p) return [];
    return [['time', cap(LF.monthsWord(x.mo))], ['people', `${cap(num(x.n))} away`], ['danger', dangerWord(x.danger)]]; },
  cost: (s, arg) => { const x = LF.partyPlan(s, arg); return x.p ? { food: x.food } : null; },
  can: (s, arg) => { const x = LF.partyPlan(s, arg), p = x.p;
    if (!p) return 'Nobody knows the way there now';
    if (p.state === 'gone') return 'There is nothing left there';
    if (DONE.includes(p.state) || p.been.length) return 'A party has been there already';
    if (goingTo(s, p.id)) return 'A party is already on the way there';
    const h = handsWhy(s, x.n); if (h) return h;
    if (x.q.size === 'large') { const w = leaderWhy(s, x.L); if (w) return w; }
    return foodWhy(s, x.food); },
  act: (s, arg, chips) => { const x = LF.partyPlan(s, arg), p = x.p, r = LF.placeRet(s, p), to = toWord(p.name); LF.lastParty = { far: p.dist, size: x.q.size };   // for the sound (js/sounds.js)
    LF.sendAway(s, { n: x.n, days: x.mo * MONTH, danger: x.danger, to, ret: r.ret, fid: r.fid || null, poi: p.id, order: true, size: x.q.size, far: p.dist, food: x.food, lead: x.L ? x.L.id : null, with: [] },
      (t, good) => chips.push({ t, good }));
    return `${cap(num(x.n))} set out for ${to}${x.L ? ` under ${x.L.name}` : ''}, due back in ${LF.monthsWord(x.mo)}.`; } });

/* A survey party: three to five with stakes and a chain, two months, no place to reach. Each goes out on the next
   bearing round the compass from the seed's own, so the fog goes back all the way round over a run. */
const bearOf = s => (hash('svy:' + s.seed) % 8 + 3 * (s.surveyN || 0)) % 8;
LF.addOrder({ id: 'survey', view: 'world', hold: 1800, once: 'month', onceKey: 'party', onceText: 'A party has gone out this month',
  shown: s => !!LF.surveyFind,
  label: s => `Send a survey party ${LF.surveyBearing(s, bearOf(s))}`,
  note: s => { const n = LF.partyN(s, 'survey'); return `${cap(num(n))} with stakes and a chain walk the country for two months, with no place to reach and ${eats(s, n, 2)} food on their backs. The fog goes back a ring that way, and they mark what they see.${dim(s) ? ' It is the Dim, and the going is worse.' : ''}`; },
  info: s => [['time', 'Two months'], ['people', `${cap(num(LF.partyN(s, 'survey')))} away`], ['yield', 'One to three places marked']],
  cost: s => ({ food: eats(s, LF.partyN(s, 'survey'), 2) }),
  can: s => handsWhy(s, LF.partyN(s, 'survey')) || foodWhy(s, eats(s, LF.partyN(s, 'survey'), 2)),
  act: (s, a, chips) => { const n = LF.partyN(s, 'survey'), dir = bearOf(s), to = `the country to the ${LF.surveyBearing(s, dir)}`;
    LF.sendAway(s, { n, days: 2 * MONTH, danger: dim(s) ? 2 : 1, to, ret: 'survey', fid: null, order: true, size: 'survey', bear: dir, food: eats(s, n, 2), with: [] }, (t, good) => chips.push({ t, good }));
    s.surveyN = (s.surveyN || 0) + 1;
    return `${cap(num(n))} go out with stakes and a chain into ${to}.`; } });

/* Calling a party back, or sending it on: only with the signals room standing (without it nothing reaches them). */
const progress = (s, a) => clamp((s.day - a.left) / Math.max(1, a.due - a.left), 0, 1);
const partyNo = (s, a) => s.away.indexOf(a) + 1;
const awayOf = (s, id) => s.away.find(a => a.id === id) || null;
const outWhy = (s, a) => !a ? 'That party is home' : !comms(s) ? 'Nothing reaches them without a signals room' : a.silent ? 'They have not answered in months' : '';
LF.addOrder({ id: 'recall', view: 'world', hold: 1600,
  shown: s => s.away.length > 0,
  rows: s => { const L = s.away.filter(a => a.ret !== 'search' && !a.recalled).map(a => a.id); return comms(s) ? L : L.slice(0, 1); },   // without the signals room one row, greyed, says why
  label: (s, id) => { const a = awayOf(s, id); return a ? `Call party ${partyNo(s, a)} back from ${a.to}` : 'Call a party back'; },
  note: 'The signals room calls them on the hour. They turn round at once and come home with what they have, which is likely nothing.',
  info: (s, id) => { const a = awayOf(s, id); return a ? [['time', `Home in ${LF.monthsWord(Math.max(MONTH, s.day - a.left) / MONTH)}`]] : []; },
  can: (s, id) => { const a = awayOf(s, id); return outWhy(s, a) || (progress(s, a) >= 0.45 ? 'They are there already, or on the way home' : ''); },
  act: (s, id) => { const a = awayOf(s, id); a.due = s.day + Math.max(3, s.day - a.left); a.recalled = true; a.ret = 'recalled'; delete a.poi; a.far = null;
    return `The signals room raises party ${partyNo(s, a)}. They turn round and start for home.`; } });
/* Sent on: a place it is near (within a month and a half of where it was going), nobody has been to and nobody is going to. */
const nearTo = (s, a) => { const p0 = a.poi && placeOf(s, a.poi); if (!p0 || p0.x === null) return [];
  return LF.sendable(s).filter(q => q.id !== p0.id && q.x !== null && Math.hypot(q.x - p0.x, q.y - p0.y) / 150 <= 1.5)
    .sort((x, y) => Math.hypot(x.x - p0.x, x.y - p0.y) - Math.hypot(y.x - p0.x, y.y - p0.y)).slice(0, 2); };
const redir = (s, arg) => { const [aid, pid] = String(arg || '').split('|'), a = awayOf(s, aid), p = pid && placeOf(s, pid), p0 = a && a.poi && placeOf(s, a.poi);
  const extra = p && p0 && p0.x !== null ? clamp(Math.round(Math.hypot(p.x - p0.x, p.y - p0.y) / 150), 1, 3) : 1;
  return { a, p, extra, food: a ? eats(s, a.n, extra) : 0 }; };
LF.addOrder({ id: 'redirect', view: 'world', hold: 1800,
  shown: s => s.away.some(a => a.order && a.poi),
  rows: s => { const out = []; for (const a of s.away) if (a.poi && !a.redir && !a.silent && !a.recalled) for (const q of nearTo(s, a)) out.push(`${a.id}|${q.id}`); return comms(s) ? out : out.slice(0, 1); },
  label: (s, arg) => { const x = redir(s, arg); return x.a && x.p ? `Send party ${partyNo(s, x.a)} on to ${toWord(x.p.name)}` : 'Send a party on'; },
  note: (s, arg) => { const x = redir(s, arg); return x.a && x.p ? `They go on from ${x.a.to} and come home by way of it: about ${LF.monthsWord(x.extra)} more out, and ${x.food} food more off the store's account.` : ''; },
  info: (s, arg) => { const x = redir(s, arg); return x.a && x.p ? [['time', `${cap(LF.monthsWord(x.extra))} more`], ['danger', dangerWord(Math.max(x.a.danger || 0, LF.partyDanger(s, x.p, x.a.size, byPid(s, x.a.lead))))]] : []; },
  cost: (s, arg) => { const x = redir(s, arg); return x.a ? { food: x.food } : null; },
  can: (s, arg) => { const x = redir(s, arg); return outWhy(s, x.a) || (!x.p || !fresh(x.p) ? 'Nobody knows the way there now' : goingTo(s, x.p.id) ? 'A party is already on the way there' : x.a.redir ? 'They have been sent on once already' : foodWhy(s, x.food)); },
  act: (s, arg) => { const x = redir(s, arg), a = x.a, p0 = placeOf(s, a.poi), r = LF.placeRet(s, x.p);
    if (progress(s, a) >= 0.45 && p0 && LF.poiVisit) LF.poiVisit(s, p0.id, `Party ${partyNo(s, a)}, on its way through`);   // they were there already: it counts as been
    const from = a.to; Object.assign(a, { poi: x.p.id, to: toWord(x.p.name), ret: r.ret, fid: r.fid || null, redir: true, due: a.due + x.extra * MONTH, food: (a.food || 0) + x.food,
      danger: Math.max(a.danger || 0, LF.partyDanger(s, x.p, a.size, byPid(s, a.lead))), far: x.p.dist === 'long' ? 'long' : a.far });
    return `The signals room raises party ${partyNo(s, a)} at ${from}. They go on to ${a.to}.`; } });

/* ---------- coming home ---------- */
/* A thread's place resolves through the thread: visit(s, t, a) -> { text, fx, title, tone, scene } or null for the generic return. */
LF.threadVisit = function (s, a) {
  const id = a.poi && a.poi.split('.')[0], d = id && LF.THREADS[id], t = d && s.threads && s.threads[id];
  if (!d || !d.visit || !t) return null;
  try { return d.visit(s, t, a) || null; } catch (e) { if (LF.DEBUG) throw e; return null; }
};
const visits = a => { const id = a.poi && a.poi.split('.')[0]; return a.ret === 'thread' && !!(id && LF.THREADS[id] && LF.THREADS[id].visit); };
LF.POD_ODDS = 0.25;   // a wreck the colony's own parties open is one of its lost pods, with sleepers alive in it (once a run)
const RET_SCENE = { wreck: 'away_wreck', lostpod: 'away_pod', ridge: 'away_ridge', spring: 'away_ridge', camp: 'away_camp', signal: 'away_camp' };
/* The return is rolled the month it is due (LF.awayRoll), and what it is stays on the party while it waits for a card. */
function roll(s, a) {
  if (a.out) return; a.out = LF.awayRoll(s, a);
  if (a.out === 'astray') { a.ret = 'astray'; delete a.poi; }
  if (a.ret === 'wreck' && !s.flags.pod_found && a.out !== 'silence' && LF.rand(s) < LF.POD_ODDS) a.ret = 'lostpod';
  if (visits(a) && a.out !== 'silence') { a.vis = LF.threadVisit(s, a); a.visq = !!(a.vis && a.vis.quiet); }   // a thread's find says whether it needs a card (quiet: true is a Meanwhile line)
}
const needsCard = a => !LF.AWAY_QUIET.includes(a.out) || a.ret === 'lostpod' || (visits(a) && !a.visq);
function rest(s, pid) { const p = byPid(s, pid); if (p && p.alive && !p.away) p.spent = Math.max(p.spent || 0, s.day + LF.SENT_REST); }
function home(s, a, quiet) {
  const lead = a.lead; a.quiet = quiet; a.scene = RET_SCENE[a.ret] || null;
  if (visits(a) && a.out !== 'silence' && !a.vis) a.vis = LF.threadVisit(s, a);
  if (LF.onPartyHome) LF.onPartyHome(s, a);
  LF.awayReturn(s, a, a.out);
  delete a.vis; delete a.visq; delete a.quiet; delete a.out; delete a.scene;   // a party still out (no word) keeps nothing that is not plain JSON
  rest(s, lead);
}
const tick0 = LF.awayTick;
LF.awayTick = function (s) {
  const due = s.away.filter(a => a.order && s.day >= a.due && !a.silent && !a.fate && a.ret !== 'search');
  for (const a of due) roll(s, a);
  for (const a of due) if (!needsCard(a)) home(s, a, true);         // home with nothing to decide: a Meanwhile line
  const c = due.find(a => needsCard(a) && s.away.includes(a));
  for (const a of due) if (a !== c && s.away.includes(a)) delete a.vis;   // one that waits keeps only plain JSON (a.visq); its find is drawn again when it comes home
  if (c) { home(s, c, false); return true; }                          // the month's card; any other waits for the next month
  return tick0(s);
};
/* The stock bar's food line says what went out with the parties. */
const note0 = LF.stockNote;
LF.stockNote = function (s, k) { const t = note0(s, k); if (k !== 'food') return t;
  const f = s.away.filter(a => a.order).reduce((x, a) => x + (a.food || 0), 0);
  return f ? `${t} ${f} went out of it on the backs of the parties past the wire.` : t; };
})();

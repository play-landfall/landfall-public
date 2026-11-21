/* Landfall — thread: the Wasting. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). The stores are full, the ladle is full, and the clinic's scale says every hand in the colony is
   lighter each month. Then somebody reads the sheet for the ones who are not: a few who have lost nothing (the fed), and
   who keep a pot of their own. This is never the famine (state.famine, the hunger Limits): it does not touch s.res.food
   except where an answer says so on its face, and its text reads full(s) so that it never contradicts the stock bar.
   It kills through its own arithmetic: t.thin (the share of body weight the average hand has lost) rises each month,
   takes labour, takes the officers' health, and from a tenth gone it takes people.
   Rolled in secret (t.truth.is), and each makes a different drastic answer the right one:
     water  this world's water locks up what a body needs from food. What grows here carries the thing that undoes it,
            and marks whoever eats it (grey gums; in a year, no going back to the ship's meal). Right: the other pot.
     gut    a pale thread of a thing in the gut takes each meal first. It dies in lye, and the fed boil their pot in
            stove ash. Right: the drench, which kills the weakest. The galley soaks the bitterness out of the pot.
     seed   the working seed came through the crossing changed, and everything raised from it fills and does not feed.
            The fed's pot is for show: they have been eating the dead. Right: burn the crop and the seed.
     fear   nothing is wrong with the food. The scale came out, people began watching their wrists, and a good part of
            the colony has been eating less than it believes. The fed eat the same ladle out of doors. Right: every meal
            under the watch (or simply telling the hall it is over); every other answer is an atrocity for nothing.
   Evidence (the sheet, the watch, the pot, the knife, what the fed say) is drawn per card and points at the truth only most of
   the time (pickK). It writes unexplained, fear, suspicion, schism, resentment and changed. Nothing here knows any
   other thread. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R } = h;
const ID = 'hunger', T = s => LF.T(s, ID), SRC = 'th.hunger';
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const KINDS = ['water', 'gut', 'seed', 'fear'];
const CURE = { water: 'table', gut: 'drench', seed: 'burn', fear: 'force' }, FOR = { table: 'water', drench: 'gut', burn: 'seed', force: 'fear' };
const full = s => h.foodDays(s) >= 30 && !LF.lean(s);
const right = t => (!!t.ans && FOR[t.ans] === t.truth.is) || (t.truth.is === 'fear' && !!t.told);
const kilos = t => Math.max(2, Math.round(t.thin * 0.7));

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  scale: {
    water: 'The loss is the same in every crew, hut and shift, to within a kilo. The people who eat most have lost no less than the people who eat least.',
    gut: 'The loss is uneven. It began at the benches nearest the galley hatch and has moved down the hall a table at a time, and the people who eat most are losing fastest.',
    seed: 'The loss follows the galley. The survey crew that lived on tins past the wire lost nothing while it was out, and began losing again when it came back to the hatch.',
    fear: 'The loss follows company. A crew starts to lose a month after the first of its people does, and three hands who work the late shift alone have lost nothing at all.' },
  watch: {
    water: c => `Every second dusk two or three of them go out past the wire with a sack and bring it back full of ${c.wild1}. They eat at the tables like anyone, and then eat again from a pot behind the drying shed.`,
    gut: c => 'They eat at the tables like anyone. Afterwards each of them drinks off a cup of something grey behind the drying shed, and stands bent over with both hands on the wall until it passes.',
    seed: c => 'They take a bowl at the hatch like anyone and scrape most of it into the pail. Twice, two of them were out after lamp-down with a spade, going toward the burial ground, and were lost in the dark both times.',
    fear: c => 'They draw the same ladle as anyone and eat every scrap of it out of doors, on the step of the drying shed. They are back in their bunks before the talk in the mess gets going, and nothing else they do is worth writing down.' },
  pot: {
    water: c => `It is ${c.wild1} and water. Nothing in it is food. There is one thing in it the bench has no name for, which also turns up in the blood of the fed and of nobody else.`,
    gut: c => `It is ${c.wild1} boiled in stove ash until it would take the skin off a tongue. Nothing in it is food. The lye alone would scour a gut clean.`,
    seed: c => `It is ${c.wild1} and water, and nothing a body could live on. On the shelf under it stands a second pot, smaller and scrubbed, and the grease in its seams did not come from anything in stores.`,
    fear: c => `It is ${c.wild1} and water. There is nothing in it a body could live on, and nothing that would do one harm.` },
  gut: {
    water: 'The gut is whole and clean and full of the galley\'s meal, hardly changed from one end to the other. The body starved with food in it.',
    gut: 'The gut wall is furred from end to end with something pale and as fine as thread. Under the lamp it draws back from the light.',
    seed: 'The gut is whole and clean and was doing its work. What it had to work on, by the bench\'s figures, was bulk and very little else.',
    fear: 'The stomach is shrunk to the size of a fist and empty, and the back teeth are etched as if by acid. This body has not kept a meal down in a season, and the whole mess watched it scrape every bowl clean.' },
  dose: {
    water: c => `By the end of the month ${c.first} has put back two kilos, and the gums have gone the colour of the pot.`,
    gut: c => `For three nights ${c.first} is too ill to stand. After that the weight begins to come back, and what was passed is in a jar on the clinic bench.`,
    seed: c => `After a month of it ${c.first} has lost what the ward lost over the same month, to the kilo, and the gums have gone the colour of the pot.`,
    fear: c => `${c.Name} puts back two kilos. So does the orderly who sat up to keep the sheet, on nothing but the galley's ladle.` },
  say: {
    water: c => `The first to stand speaks for all of them.\n\n[[x33]] "${c.Wild1}. A handful, boiled. That's the whole of it."\n\nThe rest say the same in their own words.`,
    gut: c => `Each says the same thing: ${c.wild1}, boiled in stove ash until it burns going down.\n\n[[x33]] "First while, you'll wish you were dead." "Then you're hungry again. Properly hungry."`,
    seed: c => `Each says ${c.wild1}, boiled, a handful a night, and each says it in very nearly the same words. Asked who else has ever eaten from the pot, none of them can think of a name.`,
    fear: c => 'The first to stand speaks for all of them, and the rest agree.\n\n[[x33]] "Same as you. Out of the same hatch." "We take it outside, that\'s all. You try eating in here with everyone looking at your wrists."' },
};
const ev = (kind, k, c) => { const x = EV[kind][k]; return typeof x === 'function' ? x(c) : x; };
const LEANS = { water: 'the water, and what grows here', gut: 'something living in the gut', seed: 'what the colony has grown', fear: 'nothing in the food at all' };
const top = t => KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
const lean = t => { const e = top(t);
  return !e[0][1] ? 'Nothing found so far says what is doing it.' : e[0][1] === e[1][1] ? 'What has been found so far points two ways at once.' : `What has been found so far points at ${LEANS[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. pid: the officer the card is about. */
const nm = (s, role, pid) => { const p = P(s, role); return p && p.id !== pid ? p.name : LF.seatWord(s, role); };
const crew = (s, pid) => { const o = {}; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['q', 'quartermaster'], ['cm', 'command']]) { o[k] = nm(s, role, pid); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  return o; };
const who = (p, none, first) => p ? { pid: p.id, name: p.name, first: p.first, Name: p.name } : { pid: null, name: none, first, Name: cap(none) };
const base = (s, t, pid) => Object.assign(crew(s, pid), { wild: LF.lex(s, 'wild'), wild1: LF.lex(s, 'wild1'), Wild1: cap(LF.lex(s, 'wild1')), kg: kilos(t), dead: t.dead, well: t.well, full: full(s), lean: lean(t) });
const sour = (s, role, v) => { const p = P(s, role); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
function die(s, t, n, wasted) { const b = s.pop; LF.deaths(s, n); t.toll += b - s.pop; if (wasted) t.dead += b - s.pop; return b - s.pop; }
const drenchN = (s, t) => clamp(Math.round(s.pop * 0.02 + t.thin / 10), 2, 4);

/* An answer is given (or a second one, on a weaker colony). */
function answer(s, t, a) { t.ans = a; t.ansAt = s.day; t.did[a] = FOR[a] === t.truth.is ? 'right' : 'wrong'; t.exempt = 0;
  if (a === 'drench') t.sour = s.day + 40; if (a === 'burn') t.burnt = s.day;
  if (a === 'force') LF.emit(s, 'confinement', 'wst.force', 35, 150, 'every meal is eaten in one line with the watch walking behind it'); }
function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^wst\./.test(e.id)); LF.cue(s, 'wst.truth', 4, 10); }
/* Nobody ends it with one card: it ends when the season does, by what was done. */
function resolve(s, t) {
  const k = t.truth.is;
  if (right(t)) return finish(s, t, { water: 'changed', gut: 'purged', seed: 'resown', fear: 'calmed' }[k],
    { water: 'The colony learned that it could not live on its own food here without what grows in this ground.', gut: 'The colony scoured out of itself the thing that had been eating its meals.', seed: 'The colony burned a crop that fed nobody, and sowed again from the vault.', fear: 'The colony stopped starving at a full table.' }[k]);
  // Nothing reached it. It runs its course, and stops for a reason of its own.
  const n = clamp(Math.round(s.pop * { water: 0.07, gut: 0.05, seed: 0.05, fear: 0.03 }[k] * (t.open ? 0.6 : 1)), 2, 7);
  t.lastDead = die(s, t, n, true); s.morale = clamp(s.morale - 5, 0, 100);
  LF.log(s, `${Num(Math.max(1, t.lastDead))} more died of the wasting before the scales turned. Nobody in the colony can say what turned them.`, 'bad');
  if (k === 'water') LF.emit(s, 'changed', SRC, 40, 300, 'the ones who lived are the ones who took to eating what grows here');
  finish(s, t, 'ran', 'The wasting ran its course through the colony, and stopped.');
}
/* Once a month while it lasts. */
function month(s, t) {
  const k = t.truth.is, late = ['night', 'choice', 'bill'].includes(t.phase), ok = right(t);
  let d = { scales: 0.8, apart: 1 }[t.phase] || 1.3;
  if (t.open) d *= { water: 0.55, gut: 0.7, seed: 0.9, fear: 0.7 }[k];
  if (k === 'fear') d *= (0.75 + LF.cv(s, 'fear') / 160) * (t.weighed ? 1.2 : 1) * (t.ans ? 0.5 : 1);
  if (ok) d = t.exempt ? -1.5 : -2.5;
  t.thin = clamp(t.thin + d, 0, 34);
  // From a tenth gone, people die of it at a full table.
  if (t.thin > 9 && s.pop > 16) { const x = s.pop * (t.thin - 9) * 0.0004 * (t.triage ? 1.25 : 1) * (t.opens ? 1.1 : 1) * (t.exempt && ok ? 1.3 : 1) * (P(s, 'physician') ? 1 : 1.25);
    const n = die(s, t, Math.floor(x) + (LF.srand(s) < x % 1 ? 1 : 0), true);
    if (n) LF.log(s, `${Num(n)} more ${n === 1 ? 'name was' : 'names were'} ruled through on the clinic's weigh sheet this month.${full(s) ? ` ${n === 1 ? 'It was' : 'Each was'} eating a full ladle to the end.` : ''}`, 'bad'); }
  // The officers eat at the same hatch.
  if (t.thin >= 10 && s.day % 30 === 0 && LF.shift) { const up = LF.SEAT_ORDER.map(r => P(s, r)).filter(Boolean); if (up.length) LF.shift(s, LF.spick(s, up).id, 'body', t.thin >= 18 ? -3 : -2); }
  if (t.opens) learn(s, t, 3);
  // Once the hall knows who is not wasting, it settles with them a bunk at a time.
  if (t.well > 3 && (t.named || late) && !ok && LF.srand(s) < 0.2 * (t.named ? 1.5 : 1) * (t.guard ? 0.5 : 1) * (t.open ? 0.6 : 1)) { die(s, t, 1); t.well--; t.feud++;
    LF.log(s, LF.spick(s, ['One of the people the scales spare was found face down in the wash trough this morning. The bunkhouse heard nothing.', 'A night cook who has lost no weight since landfall did not come off shift. The body was behind the drying shed, with an empty bowl set on the chest.', 'Somebody the mess calls fed was caught alone between the stores and the latrine last night, and died on the ward before morning.']), 'bad'); }
  // The pot taken away: under two of the four truths it was keeping its owners alive.
  if (t.banned && t.well > 3 && (k === 'water' || k === 'gut') && LF.srand(s) < 0.35) { t.well--; t.fedLost = (t.fedLost || 0) + 1; }
  // The long table has its own dead.
  if (t.ans === 'force' && s.pop > 16 && LF.srand(s) < (k === 'fear' ? 0.12 : 0.3)) { die(s, t, 1); t.tube = (t.tube || 0) + 1; LF.log(s, 'Somebody choked at the long table last night with the tube in. The watch had the bench cleared before the bowls were cold.', 'bad'); }
}

LF.SIGNS.wasting = 'people losing weight at a full table';
LF.thread({ id: ID, name: 'The Wasting', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'The last pages are weights: a column of names with a figure against each, entered every month and smaller every month. Beside a few of the names the figure never changes, and somebody has ringed those in red.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase !== 'latent' ? 'the wasting' : null,
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => t.phase === 'scales' ? 'Why is the colony losing weight at a full table?' : t.ans ? 'Will the scales turn?' : 'What are the fed eating that nobody else is?',
  chap: {
    changed: t => 'The colony was starving at a full table because of this world\'s water. It lives now on what grows here, and is changed by it.',
    purged: t => 'A thing in the gut was taking the colony\'s meals first. It was scoured out with lye, and the weakest with it.',
    resown: t => 'The seed the colony had been growing fed nobody. The crop was burned and sown again from the vault.',
    calmed: t => t.did.force === 'right' ? 'The colony had been starving itself at a full table, out of fear. It was made to eat.' : 'The colony had been starving itself at a full table, out of fear. It stopped when it was told the scales had turned.',
    ran: t => `The wasting ran its course and took ${num(Math.max(1, t.toll))} colonists. ${t.insight < 30 ? 'The colony never learned what it had been.' : 'Nothing the colony did reached it.'}`,
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, thin: 0, well: LF.sri(s, 5, 8), dead: 0, toll: 0, feud: 0, ans: null }); },
  tick: (s, t) => {
    if (t.end) { if (t.end === 'changed' && s.day % 5 === 0 && s.day < t.endDay + 300) LF.emit(s, 'changed', SRC, 30, 8, 'everyone inside the wire has grey gums from eating what grows here'); return; }
    if (t.phase === 'latent') { if (s.day >= t.at && s.pop >= 30 && (full(s) || s.day >= t.at + 20)) { t.thin = 4; LF.phase(s, ID, 'scales'); s.signs.push({ id: 'wasting', d: s.day, src: SRC }); LF.cue(s, 'wst.scales', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); } };
    if (t.phase === 'scales') { if (since('wst.scales') >= 10) once('well', 'wst.well');
      if (since('wst.scales') >= 25 || age >= 60) { LF.phase(s, ID, 'apart', 'The clinic\'s scale showed the whole colony losing weight at a full table.'); LF.cue(s, 'wst.pot', 0, 4); } }
    else if (t.phase === 'apart') { if (since('wst.pot') >= 10 && !t.q.open) { die(s, t, 1, true); once('open', 'wst.open'); } if (since('wst.open') >= 10) once('chair', 'wst.chair');
      if ((since('wst.pot') >= 40 && (since('wst.open') >= 8 || since('wst.pot') >= 60)) || age >= 110) { LF.phase(s, ID, 'night'); jump(s, 'wst.night', 10); s.tension = clamp(s.tension + 8, 0, 100); } }
    else if (t.phase === 'night' && (since('wst.night') >= 15 || age >= 50)) { LF.phase(s, ID, 'choice'); jump(s, 'wst.choice', 20); }
    else if (t.phase === 'choice') { if (t.ans && s.day - t.ansAt >= 10) once('refuse', 'wst.refuse');
      if (since('wst.choice') >= 30 || age >= 70) { LF.phase(s, ID, 'bill'); jump(s, 'wst.weigh', 20); } }
    else if (t.phase === 'bill' && (since('wst.weigh') >= 25 || age >= 70)) return resolve(s, t);
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) { const late = ['night', 'choice', 'bill'].includes(t.phase), ok = right(t);
      if (!late) LF.emit(s, 'unexplained', SRC, 35, 8, 'people are losing weight at a full table');
      if (t.phase !== 'scales' && !ok) LF.emit(s, 'fear', SRC, clamp(22 + t.thin - (t.told ? 8 : 0), 20, 50), 8, 'the scales go down every month and the bowls are full');
      if (t.phase !== 'scales' && t.well > 0 && !ok) LF.emit(s, 'suspicion', SRC, (late ? 38 : 26) + (t.named ? 8 : 0), 8, 'a few people are not wasting, and nobody knows what they are doing');
      if (t.triage) LF.emit(s, 'resentment', SRC, 30, 8, 'the ward, the old and the children are on the shallow ladle');
      if (t.open && !t.ans) LF.emit(s, 'schism', SRC, 30, 8, 'the colony is split between the galley line and the other pot');
      if (t.ans === 'table' || (t.open && s.day - t.open > 30)) LF.emit(s, 'changed', SRC, t.ans === 'table' ? 40 : 25, 8, 'the people who eat what grows here have grey gums'); }
  },
  /* Thin people do less, and every answer is paid for in work. */
  press: (s, t, P) => { if (t.sour && s.day < t.sour) P.labor -= 0.05; if (t.burnt && s.day < t.burnt + 90) P.yield -= 0.25;
    if (t.end || t.phase === 'latent') return;
    let d = t.thin * 0.003; if (t.triage) d -= 0.02; if (t.weighed) d += 0.01; if (t.ans === 'table') d += 0.03; if (t.ans === 'force') d += 0.04; if (t.guard) d += 0.01;
    P.labor -= Math.max(0, d); if (t.phase !== 'scales' && t.phase !== 'apart') P.morale -= 0.015; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* ======================= SCALES: the sign ======================= */
B('scales', { id: 'wst.scales', tone: 'pressure', title: 'The Weigh Sheet',
  setup: s => { const t = T(s); return Object.assign(base(s, t), { ev: pickK(s, t) }); },
  text: (s, c) => `${c.D} has weighed the ward's patients every month since landfall, out of habit. This month the stretcher crews went over the scale as well, and then the galley, and then whoever was passing. Everyone on the sheet is down: ${num(c.kg)} kilos a head since the first weighing.\n\n${c.full ? 'The stores are full. The ladle has not been cut once, and the galley will swear to every plate.' : 'The ladle has been short of late, and that does not cover it. The loss began while the ladle was full, and it is the same in the crews that eat most.'} People have been punching new holes in their belts and making a joke of it.`,
  choices: [
    { label: 'Weigh the whole colony every month, and pin the sheet to the mess door', note: 'A shift is lost to the queue at the scale each time, and everyone gets to read their own line going down.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The whole colony goes over the scale in one evening with its boots off. ${ev('scale', c.ev, c)} The sheet goes up on the mess door, and people find their own line with a finger.`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 20, c.ev); t.weighed = s2.day; } }) },
      bad: { text: 'The whole colony goes over the scale in one evening. The clinic\'s scale and the stores scale turn out to differ by two kilos, and nobody wrote down which was used for whom. The sheet goes up anyway, and people read it as worse than it is.', fx: s => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 6); t.weighed = s2.day; } }) } },
    { label: 'Half a ladle more in every bowl until the weights come back', note: 'The stores pay for it by the sack, and if the ladle was never the trouble the sacks are gone for nothing.',
      out: { text: (s, c) => `The galley serves a ladle and a half from that night, and people eat all of it. At the next weighing the sheet is down again by the same amount as before. ${c.Q} writes the month's issue into the stores book in red.`,
        fx: s => ({ food: -60, morale: 1, do: s2 => { const t = T(s2); t.extra = s2.day; learn(s2, t, 4); } }) } },
    { label: 'A deep ladle for a roster card, and a shallow one for everyone else', dark: true, note: 'The crews that keep the colony going are fed first, and the ward, the old and the children get what is left.', info: [['yield', 'Work'], ['danger', 'The ward, the old, the children']],
      out: { text: (s, c) => `The galley keeps two ladles at the hatch. The crews work the month out at something like full strength. On the ward the weights fall twice as fast as before, and ${c.d} has begun entering the reason in the files in plain words, with your name beside it.`,
        fx: s => ({ stain: ['wst_triage', 2], do: s2 => { const t = T(s2); t.triage = s2.day; t.did.triage = true; } }) } },
  ] });

/* The ones the scales spare. */
B(['scales', 'apart'], { id: 'wst.well', tone: 'pressure', title: 'The Ones Who Are Not',
  setup: s => { const t = T(s); return Object.assign(base(s, t), { ev: pickK(s, t), ev2: pickK(s, t) }); },
  text: (s, c) => `${c.Q} went through the clinic's figures looking for the worst cases and found something else. ${Num(c.well)} people have lost nothing since landfall. They are on four crews and three shifts. They draw the same card as everyone and stand in the same line at the hatch.\n\nThe mess has noticed as well, and already has a word for them: the fed. ${c.W} says that none of the ${num(c.well)} is ever at the tables for long.`,
  choices: [
    { label: (s, c) => `Have the watch follow the ${num(c.well)} for a month, and say nothing`, note: 'The watch comes off the wall to do it, and if it is seen the fed will know they are suspected of something.', test: { base: 50, mods: [R('security', 10)] },
      ok: { text: (s, c) => `${c.W} puts two people on it for the month. ${ev('watch', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: (s, c) => `The watch is seen on the second night, by a cook who brings its people out a mug of tea. After that the ${num(c.well)} eat every meal at the tables in full view and do nothing else that anyone can see.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 4) }) } },
    { label: 'Turn out their bunks and lockers while they are on shift', dark: true, note: 'It is done without cause shown to people who have broken no rule, and the bunkhouse knows by evening whose kit was on the floor.', info: [['yield', 'What is found'], ['danger', 'The fed']],
      out: { text: (s, c) => `${c.W} goes through ${num(c.well)} bunks and ${num(c.well)} lockers in an afternoon. The last locker but one holds a lidded pot, still warm, and a spoon. ${ev('pot', c.ev2, c)} The kit is left on the floor.`,
        fx: (s, c) => ({ stain: ['wst_search', 1], do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev2); t.did.search = true; LF.emit(s2, 'resentment', 'wst.search', 25, 120, 'the watch turned out the bunks of people who had broken no rule'); } }) } },
    { label: (s, c) => `Pin their ${num(c.well)} names to the mess door`, dark: true, note: 'The hall will find out what they do faster than the watch could, and will not stop at finding out.', info: [['yield', 'What the hall finds'], ['danger', 'The fed']],
      out: { text: (s, c) => `The names go up at dusk, and from then on the ${num(c.well)} are never alone. ${ev('watch', c.ev, c)} That much is learned by crews taking turns to follow them. One of the ${num(c.well)} is found in the wash house with three ribs broken, and says it was a fall.`,
        fx: (s, c) => ({ stain: ['wst_named', 1], do: s2 => { const t = T(s2); learn(s2, t, 16, c.ev); t.named = s2.day; t.did.named = true; } }) } },
  ] });

/* ======================= APART: the other pot ======================= */
B('apart', { id: 'wst.pot', tone: 'pressure', title: 'The Other Pot',
  setup: s => { const t = T(s); t.pot = s.day; return Object.assign(base(s, t), { ev: pickK(s, t) }); },
  text: (s, c) => `The fed have a pot of their own. It is kept on the back of the drying-shed stove, and by the black on it, it has been there since soon after landfall. Tonight it holds ${c.wild}, boiled down to a grey paste that smells of wet metal.\n\nNobody denies it. The one who was stirring answers for them.\n\n[[x43]] "Eat it or don't." "Nobody asked you to. Nobody asked us either."\n\n${c.Sc} wants the pot. Half the hall wants it emptied over the wire, and the other half wants a spoon.`,
  choices: [
    { label: 'Put the pot on the bench for the month', note: 'The fed go without it while it is on the bench, and the hall waits a month for a word.', test: { base: 50, mods: [R('xenobio', 10), R('physician', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} takes the pot and the shelf it stands on. ${ev('pot', c.ev, c)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: (s, c) => `${cap(LF.sentName(s, 'xenobio'))} runs the paste through everything the bench has. It is ${c.wild1}, water and stove ash, in proportions that change from one spoonful to the next, and the bench was built to assay ore. There is no finding the hall can use.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: (s, c) => `Empty the pot over the wire, and forbid ${c.wild1} inside it`, dark: true, note: 'The hall sees the fed brought down to the same ladle as everyone, and whatever was keeping them well is thrown away untried.', info: [['yield', 'Morale'], ['danger', 'The fed']],
      out: { text: (s, c) => `The pot is emptied over the wire with the hall watching, and the shelf is broken up for the stove. Gathering ${c.wild1} is made an offence. The hall is content for the month. The fed take their ladle at the hatch with everyone else and say nothing to anyone.`,
        fx: s => ({ morale: 2, tension: -4, stain: ['wst_ban', 1], do: s2 => { const t = T(s2); t.banned = s2.day; t.did.ban = true; } }) } },
    { label: 'Leave the pot where it is, and let anyone who wants a spoon have one', note: 'Nobody knows what a year of it does, and the first to try it will be the ones with children.',
      out: { text: 'The pot stays on the drying-shed stove, and a second is set beside it. By the end of the month there are thirty-odd bowls a night, most of them held by parents, in a queue the galley line can see. The ones in it are called names across the mess, and go on queuing.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.open = s2.day; t.did.open = true; } }) } },
  ] });

/* The first death, and whether the clinic may look. */
B(['apart', 'night'], { id: 'wst.open', tone: 'pressure', title: 'No Cause Written',
  setup: s => { const t = T(s); return Object.assign(base(s, t), { kg2: kilos(t) + 9, ev: pickK(s, t) }); },
  text: (s, c) => `A field hand of thirty-one died on the ward this month, ${num(c.kg2)} kilos lighter than at landfall${c.full ? ', after eating a full bowl the night before' : ''}. The file has no cause written in it. There are eleven more on the ward going the same way.\n\n${c.D} wants the body opened before it is buried. The dead hand's crew is standing in the ward door. Nobody, they say, is cutting up one of theirs to find out what a ladle did.`,
  choices: [
    { label: 'Have the body opened, with the crew in the room', note: 'They see everything that is done to their friend, and so does whoever they tell.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `It is done on the ward table with three of the crew standing against the wall. ${ev('gut', c.ev, c)} The body is sewn and given back to them before dark.`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: 'It is done on the ward table with three of the crew against the wall. One of them faints and one has to be held back. The knife finds a thin body in good order and nothing the clinic can put a name to. The crew carries its friend out without a word to anyone.', fx: s => ({ morale: -2, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Give the body back whole, and bury it tonight', note: 'The crew keeps its dead, and the eleven on the ward go the same way with nobody the wiser.',
      out: { text: (s, c) => `The body goes into the ground before dark with the whole crew at the grave. The file says "wasting" and nothing more. The crew is back at work in the morning, and its lead hand thanks you at the hatch.`,
        fx: s => ({ morale: 1, do: s2 => sour(s2, 'physician', 6) }) } },
    { label: 'Open every body from now on, as a standing order, and bury none whole', dark: true, note: 'Each death teaches the clinic a little, and no family in the colony buries its own again before the clinic has been at it.', info: [['yield', 'What it shows, each time'], ['danger', 'Every family']],
      out: { text: (s, c) => `The order is read at muster. From then on the dead go from the ward to the table and from the table to the ground, boxed. ${ev('gut', c.ev, c)} People begin keeping their sick in the bunkhouse, away from the ward, until it is too late to keep them anywhere.`,
        fx: (s, c) => ({ morale: -3, stain: ['wst_open', 2], do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev); t.opens = s2.day; t.did.opens = true; LF.emit(s2, 'grief', 'wst.opens', 30, 200, 'nobody is buried whole any more'); } }) } },
  ] });

/* An officer is going the same way, and has been hiding it. */
const CHAIR = {
  solheim: c => '"I\'m not coming off the roster." "Give me something that works, or give me my coat."',
  dahl: c => '"Lovely. Starved to death at a full table." "And don\'t put me on that ward, because I\'ve seen who comes out of it, and it\'s not the people who went in."',
  kovacs: c => '"I\'ve got a season in me. Less if you put me in a bed." "So tell me what you want fixed first."',
  nakamura: c => '"Don\'t you dare take me off the ward." "There\'s eleven in there worse than me. Go and weigh them."',
  yurbin: c => '"It\'s interesting, though, isn\'t it? I eat more than anyone, I\'ve been writing it down." "Use me. I\'m the best-kept record you\'ve got."',
  estrada: c => '"I\'ve fasted before. This isn\'t that." "Don\'t feed me ahead of the crews. That\'s all I\'m asking."',
  // the seats' second officers (2026-11-18), each in their own voice (VOICES.md)
  achebe: c => `"Listen, I'm not coming off the roster." "Give me something that works, because if you can't, I'll get my coat, and I'd rather we didn't come to that."`,
  zulu: c => `"I'd rather you heard it from me. I'm starving at a full table, and I'm sorry I hid it." "And I'd ask you not to put me on that ward, because I've seen who comes out of it, and they aren't the people who went in."`,
  halloran: c => `"I've got a season in me, boss, and less if you stick me in a bloody bed." "So tell me what you want fixed first, because I'm not fucking stopping!"`,
  brandt: c => `"I'm staying on the ward, and a bed won't improve my prognosis." "There are people in there worse off than I am. Go and weigh them, since you'd rather read it off a scale than take it from me."`,
  iyer: c => `"It's of some interest, I think. I eat more than anyone here, and I've been recording it." "Use me, Administrator. I'm the most complete record you have."`,
  waititi: c => `"I've been hungry before, my friend, and this isn't that." "Feed the crews and the children before me. I eat last, and I won't have it any other way."`,
};
const DOSE = { water: 5, gut: -2, seed: -5, fear: 3 };
B(['apart', 'night', 'choice'], { id: 'wst.chair', tone: 'pressure', title: 'Two Holes in the Belt',
  when: s => LF.SEAT_ORDER.some(r => P(s, r)),
  setup: s => { const t = T(s), pool = LF.SEAT_ORDER.map(r => P(s, r)).filter(Boolean), p = LF.spick(s, pool), c = who(p, 'the night shift lead', 'the shift lead');
    return Object.assign(c, base(s, t, c.pid), { kg2: kilos(t) + 6, line: (p.key && CHAIR[p.key] ? `[[${c.pid}]] ${CHAIR[p.key]()}` : `${c.Name} asks for one thing, which is not to be fed ahead of anyone else.`), pot: !!t.pot && !t.banned, ev: pickK(s, t, 0.1) }); },
  text: (s, c) => `${c.Name} has lost ${num(c.kg2)} kilos, more than anyone on the work crews, and has been hiding it under a coat. It came out when ${c.first} sat down on the yard floor in the middle of giving an order and could not get up.\n\n${c.line}`,
  choices: [
    { label: (s, c) => `Stand ${c.first} down to a bed on the ward`, note: (s, c) => `The department runs on a deputy, and rest has not put weight back on anybody yet.`,
      out: { text: (s, c) => `${c.Name} is given the bed by the ward door and weighed every morning. The weight holds for the month, and does no better than hold. The department sends its questions to the ward and gets about half of them answered.`,
        fx: s => ({ morale: -1, progress: -0.03, off: [['ctx', 'body', -2]] }) } },
    { label: (s, c) => `Keep ${c.first} at the post`, note: (s, c) => `The work goes on being done by the one who knows it, at whatever that takes out of ${c.first}.`,
      out: { text: (s, c) => `${c.Name} goes back to work in the coat. The work is done, and done properly, from a chair for most of the month.`,
        fx: s => ({ off: [['ctx', 'body', -8], ['ctx', 'native', 2]] }) } },
    { label: (s, c) => `Order ${c.first} to eat from the other pot, as the test`, dark: true, show: (s, c) => c.pot, note: (s, c) => `The colony gets an answer from someone whose weight is on paper for every month since landfall, and ${c.first} takes whatever the pot does.`, info: (s, c) => [['yield', 'What it shows'], ['danger', cap(c.first)]],
      out: { text: (s, c) => `${c.Name} eats a bowl of the grey paste at the ward table every night, with an orderly keeping the sheet. ${ev('dose', c.ev, c)}`,
        fx: (s, c) => ({ stain: ['wst_dose', 1], off: [['ctx', 'body', DOSE[c.ev]]], do: s2 => { const t = T(s2); learn(s2, t, 24, c.ev); t.did.dose = true; } }) } },
  ] });

/* ======================= NIGHT: the hall and the fed ======================= */
B('night', { id: 'wst.night', tone: 'crisis', title: 'The Fed',
  setup: s => { const t = T(s); t.well = Math.max(2, t.well); return Object.assign(base(s, t), { well: t.well, ev: pickK(s, t) }); },
  text: (s, c) => `${Num(Math.max(1, c.dead))} dead of it, and ${num(c.kg)} kilos gone from the average hand. Tonight a hauling crew took the ${num(c.well)} who have lost nothing out of their bunks, and has them sitting on the mess floor with their hands on their heads. Nobody has been hurt yet. The crew has carried the clinic's scale in and set it down beside them.\n\n${c.W} is waiting for an order. ${c.lean}`,
  choices: [
    { label: 'Put them out through the gate tonight', dark: true, note: (s, c) => `The hall is rid of the sight of them, and ${num(c.well)} people who have harmed nobody go out past the wire with whatever it is they know.`, info: [['yield', 'Morale'], ['danger', 'The fed']],
      out: { text: (s, c) => `The ${num(c.well)} are walked to the gate with a blanket each. One of them asks for the pot and is refused. The bar goes down behind them, and the hall sleeps better than it has all season. At the next weighing every line on the sheet is down again.`,
        fx: (s, c) => ({ leave: c.well, morale: 3, tension: -10, stain: ['wst_putout', 3], do: s2 => { const t = T(s2); t.did.putout = { n: c.well }; t.toll += c.well; t.well = 0; t.open = 0; LF.emit(s2, 'grief', 'wst.putout', 25, 150, 'people everyone knew were put out through the gate for being well'); },
          chron: `${Num(c.well)} people were put out through the gate at night because they had lost no weight.` }) } },
    { label: (s, c) => `Send the crew to its bunks, and put the watch on the ${num(c.well)}`, note: 'The fed are kept alive at the cost of the wall, and the hall takes it that you are protecting them for a reason.', info: [['danger', 'Whoever is caught alone']],
      out: { text: (s, c) => `${c.W} clears the mess and gives the ${num(c.well)} the tool store to sleep in, with a guard on it. The crew goes to its bunks. Before the month is out one of the ${num(c.well)} is caught between the store and the latrine by people nobody can name, and dies on the ward two nights later.`,
        fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); t.guard = s2.day; t.did.guard = true; t.toll++; t.feud++; t.well = Math.max(1, t.well - 1); LF.emit(s2, 'schism', 'wst.guard', 30, 150, 'half the hall wanted the fed put out, and was stopped'); } }) } },
    { label: 'Stand them on a bench, and have each one tell the hall what they eat', note: 'The hall judges it on the spot, and whatever is said will be all over the colony as fact by morning.',
      out: { text: (s, c) => `They are stood up one at a time. ${ev('say', c.ev, c)}\n\nThe hall hears every one of them out. The crew lets them go back to their bunks, and by breakfast a good part of the mess has made up its mind to eat as they do.`,
        fx: (s, c) => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 18, c.ev); t.did.said = true; if (!t.banned) t.open = t.open || s2.day; } }) } },
  ] });

/* ======================= CHOICE: three of the four answers ======================= */
/* Three at most on screen. There are four answers, one for each truth; the hall hears the three that what has been found
   speaks for most (top(t)), and the one with least found for it is not brought to the table. Level evidence leaves out
   the later of water, gut, seed, fear, so with nothing found it is the long table: under fear the hall can still be told
   the scales have turned at the second weighing, and the second weighing offers whichever answer the evidence leans to. */
const ANS = ['table', 'drench', 'burn', 'force'], on = a => (s, c) => !c.offer || c.offer.includes(a);
const WANT = { table: c => `${c.Sc} wants the colony fed from the other pot.`, drench: c => `${c.Cm} wants every gut in the colony scoured with lye.`, burn: c => `${c.E} wants the crop and the seed burned.`, force: c => `${c.W} wants every meal eaten under guard.` };
B('choice', { id: 'wst.choice', tone: 'crisis', view: 'colony', title: 'Three Answers',
  setup: s => { const t = T(s), best = top(t).slice(0, 3).map(e => CURE[e[0]]); return Object.assign(base(s, t), { dn: drenchN(s, t), offer: ANS.filter(a => best.includes(a)) }); },
  text: (s, c) => `${Num(Math.max(1, c.dead))} are dead of the wasting, and the ward has no beds left. ${c.full ? 'The stores are full, and so are the bowls.' : 'The stores are low as well, and that is a separate page of the book.'} Your officers have brought three answers, and none will sit at a table with another's. ${(c.offer || ANS).map(a => WANT[a](c)).join(' ')}\n\n${c.lean} The hall has been told it will hear tonight.`,
  choices: [
    { label: 'Close the galley line, and feed everyone from the other pot', dark: true, show: on('table'), note: 'Nobody knows what a year of it does to a body, and the children get it with everyone else.', info: [['yield', 'If it is the food'], ['later', 'Everyone, in ways not yet known']],
      out: { text: (s, c) => `From that night the galley boils ${c.wild} by the cartload, with the ship's meal served beside it for bulk. The gathering takes a crew off the fields. People hold their noses and eat. Within the month the first grey gums show at the tables, and the children's show first.`,
        fx: s => ({ morale: -3, stain: ['wst_table', 2], do: s2 => answer(s2, T(s2), 'table'), chron: 'The whole colony was put onto a pot of what grows here, the children included.' }) } },
    { label: 'Drench every gut in the colony with lye and ash water', dark: true, show: on('drench'), note: (s, c) => `It will empty whatever is in there, and the clinic expects it to kill ${num(c.dn)} of the weakest outright.`, info: [['yield', 'If it is in the gut'], ['danger', 'The weakest']],
      out: { text: (s, c) => `It is done over three nights, a bunkhouse at a time: a measured cup each, and the latrine trench dug double. Nobody works. ${Num(c.dn)} of the ward do not come through it, and each is signed for by name. At the end of it the colony is as weak as it has ever been, and waits for the scale.`,
        fx: (s, c) => ({ pop: -c.dn, morale: -4, stain: ['wst_drench', 3], do: s2 => { const t = T(s2); answer(s2, t, 'drench'); t.toll += c.dn; t.drenched = (t.drenched || 0) + c.dn; },
          chron: `Every gut in the colony was drenched with lye, and ${num(c.dn)} people died of it.` }) } },
    { label: 'Burn everything the colony has raised and every seed saved from it, and sow again from the sealed vault', show: on('burn'), note: 'If the fault is in what has been grown here it ends tonight, and either way the colony eats tins and ship\'s blocks until a new crop stands.', info: [['later', 'Everyone, in the hungry months']],
      out: { text: (s, c) => `Everything green the colony has raised is fired at dusk, and the seed bins after it, with ${c.q} standing by to see that nothing is held back. The galley goes over to tins and blocks. The vault seed is in the ground within the month, and the stores book has a new last page.`,
        fx: s => ({ food: -Math.round(Math.min(150, s.res.food * 0.3)), morale: -3, do: s2 => answer(s2, T(s2), 'burn'), chron: 'The colony burned its crop and its saved seed, and sowed again from the vault.' }) } },
    { label: 'Every meal at one long table under the watch, and a tube for anyone who will not swallow', dark: true, show: on('force'), note: 'If people are not truly eating, it ends. If they are, the colony is held down and fed for nothing.', info: [['yield', 'If it is in their heads'], ['danger', 'Anyone who cannot keep it down']],
      out: { text: (s, c) => `The benches are set in one line, and the watch walks behind it. Nobody leaves until the bowl is clean and an hour has gone by. The clinic will not hold the tube, so the watch is taught how. On the first night nine people are fed that way, and on the second night four.`,
        fx: s => ({ morale: -5, stain: ['wst_force', 2], do: s2 => { answer(s2, T(s2), 'force'); sour(s2, 'physician', 10); }, chron: 'Every meal in the colony was eaten under guard, and those who would not swallow were fed by tube.' }) } },
  ] });

/* The ones who will not take the answer. */
const WONT = {
  table: c => `${Num(c.n)} people will not eat from the pot. Most are parents, and they have seen the children's gums. They take the ship's meal at the hatch, tip the paste into the pail, and go on losing weight.`,
  drench: c => `${Num(c.n)} people did not take the drench. They were out of their bunks on all three nights, and their cups were found poured out behind the wash house.`,
  burn: c => `Not all of the seed was burned. ${Num(c.n)} of the field crew held back a few sacks saved from this ground, and have a plot of it sown behind the far windbreak. They say it is the only seed that has ever come up properly here.`,
  force: c => `${Num(c.n)} people have stopped coming to the long table. They are fetched every night and fed by tube in the wash house, held down by people they work beside. Three of them have had teeth broken.`,
};
const MADE = {
  table: c => `The watch stands over the ${num(c.n)} at every meal until the paste is eaten. The children are fed first, with a parent holding each one. It is done in the open mess, and the rest of the hall keeps its eyes on its own bowl.`,
  drench: c => `The ${num(c.n)} are taken one at a time to the wash house and held while the cup goes down. It takes four people for some of them. One does not come through the night that follows.`,
  burn: c => `The plot behind the windbreak is fired and the sacks with it. The field crew is made to stand and watch. One of them walks into the stubble afterwards to see whether anything is left, and is carried back badly burned.`,
  force: c => `The ${num(c.n)} are strapped to the bench for it from now on, which is quicker and breaks fewer teeth. One of them brings the meal up into the tube during the first night and does not see the morning.`,
};
B(['choice', 'bill'], { id: 'wst.refuse', tone: 'crisis', title: 'The Ones Who Will Not',
  when: (s, t) => !!t.ans,
  setup: s => { const t = T(s), n = clamp(Math.round(s.pop * 0.1), 4, 10); return Object.assign(base(s, t), { ans: t.ans, n, what: { table: 'the pot', drench: 'the drench', burn: 'the burning', force: 'the long table' }[t.ans] }); },
  text: (s, c) => `${WONT[c.ans](c)}\n\n${c.Cm} wants to know whether the order was an order. The hall is watching to see whether it applies to everyone.`,
  choices: [
    { label: 'Make them, with the watch, one at a time', dark: true, note: 'The answer is the same for everyone, and it is put into people who are held down for it.', info: [['yield', 'One rule for all'], ['danger', 'The ones who refused']],
      out: { text: (s, c) => MADE[c.ans](c),
        fx: s => ({ pop: -1, morale: -3, stain: ['wst_made', 2], do: s2 => { const t = T(s2); t.toll++; t.did.made = t.did[t.ans]; LF.emit(s2, 'resentment', 'wst.made', 35, 200, 'people were held down for an answer nobody could prove'); } }) } },
    { label: 'Let them be, and enter their names', note: 'They go their own way and take what comes of it, and everyone else asks why the order binds them.',
      out: { text: (s, c) => `Their names are entered and nothing more is done. They keep to their own end of the mess. By the end of the month there are a few more of them than there were.`,
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.exempt = s2.day; t.did.exempt = t.did[t.ans]; LF.emit(s2, 'schism', 'wst.exempt', 30, 150, 'some of the colony will not take the answer, and were let be'); } }) } },
    { label: (s, c) => `Give up ${c.what}, for everyone`, note: 'The colony is spared what the answer costs, and is back where it was, with nothing being done.',
      out: { text: (s, c) => `The order is withdrawn at muster, and most of the hall is glad of it. ${{ table: 'The galley goes back to the ship\'s meal alone.', drench: 'There will be no second round of cups.', burn: 'The plot behind the windbreak is left to grow, and its seed will be in the bins again by harvest.', force: 'The benches go back to their old places.' }[c.ans]} Nobody proposes anything in its place.`,
        fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.did.gaveup = t.did[t.ans]; t.gave = t.ans; t.ans = null; if (t.burnt) t.burnt = 0; } }) } },
  ] });

/* ======================= BILL: the second weighing ======================= */
const ALT = {
  table: { label: 'feed everyone from the other pot', out: c => `The galley boils ${c.wild} by the cartload from that night.` },
  drench: { label: 'drench every gut with lye', out: c => `The cups are measured out a bunkhouse at a time, and ${num(c.dn)} of the ward do not come through it.` },
  burn: { label: 'burn the crop and the seed', out: c => 'Everything green the colony has raised is fired at dusk, and the seed bins after it.' },
  force: { label: 'put every meal under the watch', out: c => 'The benches are set in one line, and the watch walks behind it with the tube.' },
};
B('bill', { id: 'wst.weigh', tone: 'crisis', title: 'The Second Weighing',
  setup: s => { const t = T(s), alt = top(t).map(e => CURE[e[0]]).concat(['burn', 'table', 'drench', 'force']).find(a => !t.did[a]) || 'burn';
    return Object.assign(base(s, t), { ans: t.ans, turned: right(t), alt, dn: Math.max(2, drenchN(s, t) - 1) }); },
  text: (s, c) => `The whole colony goes over the scale again. ${c.turned ? 'For the first time since landfall the sheet has gone the other way: up a kilo a head, and more than that on the ward.' : 'Every line is down again, by as much as the month before.'} ${{ table: 'Most of the colony has grey gums now, and the ones who have eaten the paste longest cannot keep the ship\'s meal down at all.', drench: 'The colony has not got its strength back from the three nights, and the trench crews say they would not do it twice.', burn: 'The stores book is on its last pages, and the new crop is a hand high.', force: 'The long table takes three hours every night, and the tube is used on a dozen people at each sitting.' }[c.ans] || 'Nothing the colony tried is still being done.'}\n\n${Num(Math.max(1, c.dead))} are dead of the wasting. ${c.lean}`,
  choices: [
    { label: (s, c) => c.ans ? 'Hold to it for another season' : 'Go on as you are', note: 'If it is working it goes on working, and if it is not, another season of the ward is the price of finding out.',
      out: { text: (s, c) => `Nothing is changed. ${c.turned ? 'The sheet goes up on the mess door, and for once people stand and read it without being made to.' : 'The sheet goes up on the mess door. People look for their own line, and then for the lines that have been ruled through.'}`,
        fx: (s, c) => ({ morale: c.turned ? 2 : -2, do: s2 => { T(s2).did.held = true; } }) } },
    { label: (s, c) => `${c.ans ? 'Drop it, and' : 'Give the order to'} ${ALT[c.alt].label}`, dark: true, note: 'Whatever was paid for the first answer is lost, and the second is tried on a colony weaker than the first was.', info: [['yield', 'A second chance at it'], ['danger', 'Everyone, a second time']],
      out: { text: (s, c) => `${c.ans ? 'The first answer is withdrawn at muster and the second is given in the same breath. ' : ''}${ALT[c.alt].out(c)} The hall does as it is told, more slowly than it did the first time.`,
        fx: (s, c) => ({ pop: c.alt === 'drench' ? -c.dn : 0, food: c.alt === 'burn' ? -80 : 0, morale: -3, stain: ['wst_second', 1], do: s2 => { const t = T(s2); if (t.ans) t.gave = t.ans; if (t.burnt && c.alt !== 'burn') t.burnt = 0;
          answer(s2, t, c.alt); t.second = c.alt; if (c.alt === 'drench') { t.toll += c.dn; t.drenched = (t.drenched || 0) + c.dn; }
          if (c.alt !== 'burn') (LF.stain || (() => {}))(s2, { table: 'wst_table', drench: 'wst_drench', force: 'wst_force' }[c.alt], 2); } }) } },
    { label: 'Announce that the scales have turned, and stop the weighing', dark: true, note: 'The hall gets good news tonight, and nobody will be able to say afterwards how many it was true for.', info: [['yield', 'Morale'], ['danger', 'The record']],
      out: { text: (s, c) => `You read out a figure that is not on the sheet, and the hall cheers it. The scale goes into stores. ${c.turned ? 'As it happens, the figure was not far wrong.' : 'The ward goes on being weighed at night, with the door shut.'}`,
        fx: s => ({ morale: 4, lift: 6, stain: ['wst_told', 1], do: s2 => { const t = T(s2); t.told = s2.day; t.did.told = true; } }) } },
  ] });

/* ======================= AFTER: what the wasting was ======================= */
const WAS = {
  water: c => `It was the water. ${c.Sc} boiled the ship's meal twice, once in water brought down from the ${LF.SHIP} and once in water from the colony's own well, and set the two beside each other. Something in this world's water locks up what a body needs from its food, in the pot and again in the gut, and every meal since landfall had been cooked in it. What grows here lives on the same water, and carries the thing that undoes it. A handful of ${c.wild1} a day is enough. It turns the gums grey inside a season, and after a year the body will take nothing that was cooked without it.`,
  gut: c => `It was in the gut: a pale thread of a thing, thousands to a body, that lines the gut and takes each meal before its host can. Whether it came down in the water casks or was here waiting, ${c.sc} cannot say. It dies in lye. The fed found that out by accident, boiling ${c.wild1} in stove ash to make it soft enough to swallow, and believed it was the ${c.wild1} that kept them well.`,
  seed: c => `It was the seed. The working stock came through the crossing changed, in a way no assay on the ship was built to see. Everything raised from it since landfall fills a belly and feeds almost nothing, and the galley had been stretching the ship's blocks with it from the first tray. The tins were sound all along. The fed were never living on ${c.wild1}, and the pot was for show. They had found the only real meat inside the wire, in the burial ground, and had kept it to themselves.`,
  fear: c => `There was nothing wrong with the food. ${c.Sc} proved it on the ship's blocks, the well water, the crop and the pot, one after another. The first few lost weight to the work and the thin air, as people do. Then the scale came out, and people began to watch their wrists and each other's bowls. From then on a good part of the colony was eating a little less at every meal than it believed, and bringing some of that back up, and the ones who watched hardest wasted fastest. The fed ate the same ladle as everyone, out of doors, away from the talk.`,
};
const TAIL = {
  changed: c => `The colony eats ${c.wild1} at every meal now, and the weights came back within the season. Every mouth inside the wire has grey gums, and the children's are greyest. Nobody who has eaten it for a year can go back to the ship's meal.`,
  purged: c => 'The drench killed it, and the weights came back within the season. The colony takes a small cup of lye water every month now. Some of the hall has started calling that grace.',
  resown: c => 'The crop sown from the sealed vault is sound. The weights began to come back as soon as it reached the pot.',
  calmed: c => c.told ? 'What ended it was being told that it had ended. The hall cheered a figure you made up, went back to eating without looking at its wrists, and had the weight back within the season.' : 'The long table ended it. People who were made to eat, and watched until it stayed down, had the weight back within the season.',
  ran: c => ({ water: `Nothing the colony did reached it. It stopped when the people left alive were the ones who had taken to the pot by themselves, a household at a time, against orders or without any. ${Num(c.last)} more died first.`,
    gut: `Nothing the colony did reached it. The thing ran through every gut it could kill, and ${num(c.last)} more died in the last months. The ones who are left carry it still, and it takes its share of every meal.`,
    seed: `Nothing the colony did reached it. It stopped when the last of the changed seed had been eaten or had rotted, and the vault was opened for want of anything else to sow. ${Num(c.last)} more died first.`,
    fear: `Nothing the colony did reached it. It stopped when the colony had something else to be afraid of and left off watching its plates. ${Num(c.last)} more died first.` })[c.k],
};
/* What each thing the colony did amounted to, given what the wasting was. doubt: the same deeds with nothing to weigh them against. */
function reckon(s, t, c, doubt) {
  const d = t.did, k = t.truth.is, L = [], w = c.wild1;
  const add = (plain, o) => L.push(doubt ? plain : typeof o === 'string' ? o : o[k]);
  if (d.putout) add(`${Num(d.putout.n)} people were put out through the gate for having lost no weight.`, { water: `The ${num(d.putout.n)} put out through the gate were the only people in the colony who were eating properly, and what they knew went out with them.`, gut: `The ${num(d.putout.n)} put out through the gate had cured themselves by accident, and had harmed nobody.`, seed: `The ${num(d.putout.n)} put out through the gate had been eating the colony's dead. The hall put them out without knowing it.`, fear: `The ${num(d.putout.n)} put out through the gate had done nothing but eat their supper out of doors.` });
  if (d.table) add(`The whole colony was put onto ${w}.`, { water: `Putting the whole colony onto ${w} was the answer, and it was given to children who could not be asked.`, gut: `The whole colony was put onto ${w}, with the galley soaking the bitterness out of it first, as a galley would. The bitterness was the cure. The grey gums were for nothing.`, seed: `The whole colony was put onto ${w}, which feeds nobody, and has the grey gums to show for it.`, fear: `The whole colony was put onto ${w} for a fault that was never in the food, and has the grey gums to show for it.` });
  if (d.drench) add(`Every gut in the colony was drenched with lye, and ${num(t.drenched || 2)} died of it.`, k === 'gut' ? `The drench was the answer. The ${num(t.drenched || 2)} it killed would have been dead of the wasting within the season, by the clinic's reckoning, and were killed sooner.` : `The drench scoured ${num(t.drenched || 2)} people to death and reached nothing, because there was nothing in them to reach.`);
  if (d.burn) add('The crop and the saved seed were burned.', k === 'seed' ? 'Burning the crop and the seed was the answer.' : 'The crop and the seed that were burned were sound, and the hungry months after the fire bought nothing.');
  if (d.force) add('Every meal was eaten under guard, with a tube for those who would not swallow.', k === 'fear' ? 'The long table was the answer, and it was given with a tube and some broken teeth.' : `The people held down at the long table had been swallowing every meal honestly since landfall${t.tube ? `, and ${num(t.tube)} of them choked there` : ''}.`);
  if (d.made) add('People who refused were held down for it.', d.made === 'right' ? 'The people held down for the answer are alive because of it, and have not forgiven it.' : 'The people held down for the answer were held down for nothing.');
  if (d.gaveup === 'right') add('', 'The answer that was given up at muster was the right one.');
  if (d.ban) add(`The fed's pot was emptied over the wire.`, { water: 'The pot emptied over the wire was the only sound meal in the colony.', gut: 'The pot emptied over the wire was the only medicine in the colony.', seed: 'The pot emptied over the wire was for show, and its owners lost nothing by it.', fear: `The pot emptied over the wire held ${w} and water.` });
  if (d.triage) add('The ward, the old and the children were put on a shallow ladle.', k === 'fear' ? 'The shallow ladle took food from the people who most needed to be seen eating it.' : 'The shallow ladle starved people faster who were starving already.');
  if (d.told && k !== 'fear') add('The hall was told the scales had turned.', 'The hall was told the scales had turned when they had not.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : doubt ? 'Nobody was put out, cut or held down on account of it.' : 'Nobody was put out, cut or held down on account of it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'wst.truth', tone: 'quiet', title: 'What the Wasting Was',
  setup: s => { const t = T(s); return Object.assign(base(s, t), { k: t.truth.is, end: t.end, doubt: t.end === 'ran' && t.insight < 30, last: Math.max(1, t.lastDead || (typeof t.last === 'number' ? t.last : 0)), told: t.did.force !== 'right', toll: Math.max(0, t.toll), feud: t.feud }); },
  text: (s, c) => { const t = T(s);
    if (c.doubt) return `The scale turned in the end, and nobody can say why. ${Num(c.last)} more died first. The sheet on the mess door has gone up a little every month since, and people have stopped reading it.\n\n${reckon(s, t, c, true)} Nothing was ever found that could say whether any of it was needed.${c.toll ? ` In all, the wasting cost ${num(c.toll)} colonists.` : ''}`;
    return `${WAS[c.k](c)} ${TAIL[c.end](c)}\n\n${reckon(s, t, c, false)}${c.toll ? ` In all, the wasting cost ${num(c.toll)} colonists${c.feud ? `, ${num(Math.min(c.feud, c.toll))} of them killed by their neighbours` : ''}.` : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who held an arm, a cup or a tube has to live beside the page.',
      out: { then: 'wst.scale', text: 'It goes into the colony record in full, in your hand, with who gave each order and who carried it out. People read it. Some of them stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the wasting, with the names.' }) } },
    { label: 'Enter the dead as lost to a fever in the first seasons', dark: true, note: 'The colony gets a record it can live beside, and the people it starved, scoured or put out are written down as an act of the place.', info: [['yield', 'Morale']],
      out: { then: 'wst.scale', text: 'The record says that a fever went through the colony in its first seasons and took a number of the weakest. The weigh sheets are not kept with it. It is the version the children will be taught.',
        fx: s => ({ morale: 3, stain: ['wst_record', 1], chron: 'The record says that a fever went through the colony in its first seasons.' }) } },
    // the scale is its own card since 2026-11-18 (wst.scale): two questions on one card read as one. Kept hidden here, so option ids hold.
    { label: 'Keep the monthly weighing, for good', show: () => false, note: 'The colony will see the next thing coming, and will stand in a queue every month to be reminded of this one.',
      out: { text: 'The scale stays in the mess, bolted to the floor. On the first evening of every month the colony goes over it with its boots off, and the sheet goes up on the door. People read their own line first, and then their children\'s.',
        fx: s => ({ morale: -1, do: s2 => { LF.emit(s2, 'fear', 'wst.weighing', 20, 200, 'the colony is weighed every month and reads the sheet'); } }) } },
    { label: 'Break up the scale', show: () => false, note: 'Nobody is weighed again, and the next time something of the kind begins, the belts will be the first to know.',
      out: { text: 'The scale is taken out to the yard and broken up for its metal, with most of the hall there to see it. The last sheet is left on the mess door until the weather takes it.',
        fx: s => ({ morale: 2 }) } },
  ] });
B('after', { id: 'wst.scale', tone: 'quiet', title: 'The Scale in the Mess', scene: ['wst_scale', 'wst_scales'],
  text: () => `The record is written. The scale is still bolted to the mess floor where the clinic put it, and the last weigh sheet is still on the door. Nobody has stood on it since, and nobody walks round it without looking.`,
  choices: [
    { label: 'Keep the monthly weighing, for good', note: 'The colony will see the next thing coming, and will stand in a queue every month to be reminded of this one.',
      out: { text: 'The scale stays in the mess, bolted to the floor. On the first evening of every month the colony goes over it with its boots off, and the sheet goes up on the door. People read their own line first, and then their children\'s.',
        fx: s => ({ morale: -1, do: s2 => { LF.emit(s2, 'fear', 'wst.weighing', 20, 200, 'the colony is weighed every month and reads the sheet'); } }) } },
    { label: 'Break up the scale', note: 'Nobody is weighed again, and the next time something of the kind begins, the belts will be the first to know.',
      out: { text: 'The scale is taken out to the yard and broken up for its metal, with most of the hall there to see it. The last sheet is left on the mess door until the weather takes it.',
        fx: s => ({ morale: 2 }) } },
  ] });

LF.TAGS['wst.scales'] = ['cautious open', 'mercy bold', 'severe order'];
LF.TAGS['wst.well'] = ['cautious closed', 'severe order', 'severe open'];
LF.TAGS['wst.pot'] = ['cautious open', 'severe closed', 'free open'];
LF.TAGS['wst.open'] = ['open bold', 'mercy cautious', 'severe order'];
LF.TAGS['wst.chair'] = ['mercy cautious', 'order', 'severe bold'];
LF.TAGS['wst.night'] = ['severe closed', 'mercy order', 'open free'];
LF.TAGS['wst.choice'] = ['bold open', 'severe bold', 'cautious order', 'severe order'];
LF.TAGS['wst.refuse'] = ['severe order', 'free mercy', 'cautious free'];
LF.TAGS['wst.weigh'] = ['cautious order', 'bold', 'closed order'];
LF.TAGS['wst.truth'] = ['open', 'closed order', 'cautious order', 'free'];
LF.TAGS['wst.scale'] = ['cautious order', 'free'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => s.used['wst.pot'] === undefined ? [] : [{ k: 'pot', card: 'wst.pot', name: `Where the ${LF.lex(s, 'wild1')} grows`, kind: 'growth', dist: 'near', danger: 1, state: t.end ? 'worked out' : 'located',
  known: `The fed's pot holds ${LF.lex(s, 'wild')}, boiled down grey. This is where it grows thickest, a short walk past the wire.` }];
/* A party the player sent to where the fed's weed grows (orders.js order.send, T2-5): a month out there on what they
   carried, weighed going and coming, and sacks of the weed home for the bench. What the scale and the patch say points at
   the truth most of the time (pickK) and is fed to t.ev. It never touches the stores but for the sacks they bring. A card
   while it is live; after, a Meanwhile line. */
const PATCH = {
  water: c => `They weighed out and weighed home. The ones who drank the water out there and ate tins came home lighter; the two who chewed ${c.wild1} raw with every meal, for a dare, came home heavier, with grey gums.`,
  gut: c => `They weighed out and weighed home, and came back lighter, the big eaters most. What grazes the patch has a lick of old ash it goes back to after every feed, worn into a bowl by tongues.`,
  seed: c => `They lived a month on tins from the ship's stores, weighed out and weighed home, and came back a kilo up, every one of them. Somebody had dug at the edge of the patch and filled it in again, and the spade marks were square.`,
  fear: c => `They carried the galley's own ladle out in pails, weighed out and weighed home, and came back a kilo up, every one of them. Nobody out there had been watching anybody's wrists.` };
LF.THREADS[ID].visit = (s, t, a) => {
  if (String(a.poi || '').split('.')[1] !== 'pot') return null;
  const c = { wild1: LF.lex(s, 'wild1'), wild: LF.lex(s, 'wild'), W: LF.lex(s, 'wild1').split(' ').map(cap).join(' ') }, e = pickK(s, t, 0.1);
  if (t.end) { return Object.assign({ title: `Where the ${c.W} Grows`, text: `They came home with sacks of ${c.wild} and a sketch of how far it runs. Nobody weighed them.`, fx: { food: 25 } }, { quiet: true }); }
  return { title: `Where the ${c.W} Grows`, tone: 'pressure', scene: 'away_wild',
    text: `${PATCH[e](c)} The sacks of ${c.wild1} went to the bench, and the rest to the galley.`,
    fx: { food: 25, do: s2 => learn(s2, T(s2), 15, e) } };
};
})();

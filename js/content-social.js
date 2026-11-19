/* Landfall — the voyage out (Lachlan, 2026-11-17; DESIGN.md "The voyage out"). An ease-in for new players, before
   anything goes wrong: three small social scenes aboard the Ariadne in the first five years out from Earth: two while
   all six officers are awake to run the ship in, one from the watches that follow. The player meets the six as people and learns how a card works (options,
   what each risks, odds and what bends them) with nothing much at stake. Then the long sleep, and the disaster that
   leaves the ship adrift (s.premise, js/intro.js).
     year 1, the wardroom supper: the six at one table; whose joke you laugh at, or whose side you take on a small point.
     year 2, a second pair of hands: one officer brings their trade to another's problem; help or hinder.
     year 5, a year of the watch: by now the six keep the ship two at a time (two years awake each, a year with the
       one before and a year with the one after), and the two on the flight deck at night talk something through.
   Eighteen cards, six a slot; three are dealt a run (LF.proDeal): one a slot, the three pairs between them covering
   all six officers, and the cards the player saw in the last games dealt last (the UI passes them).
   The officers do not exist yet (LF.makeOfficers runs at LF.land), so what a card does is kept in s.pro.fx and paid at
   landfall (LF.proApply): regard for you (p.loyal), nerve, health and experience, ties between them (LF.bond), and a
   little more or less in the ship's stores (s.adrift.kit). No dark option, no stain, nobody sent in person. */
(function () {
'use strict';
const { add, h } = LF; const { If } = h;
const FIRST = {}, SEAT_KEY = {}; for (const seat in LF.CAST) for (const c of LF.CAST[seat]) { FIRST[c.key] = c.first; SEAT_KEY[c.key] = seat; }
/* The cards name their two leads by the first officer of each seat ('dahl', 'yurbin'). Which officer the player took for that
   seat (s.cast, LF.castPick) decides who is really at the table: pickOf, and nm for the name. Effects stay keyed by the
   card's own keys and are paid to whoever holds that seat (LF.proApply). */
const pickOf = (s, k) => { const seat = SEAT_KEY[k]; return LF.CAST[seat][LF.castPick(s, seat)] || LF.CAST[seat][0]; };
const nm = (s, k) => pickOf(s, k).first;
const MAIN = {}; for (const seat in LF.CAST) MAIN[LF.CAST[seat][0].first] = LF.CAST[seat][0].key;
// the names, and the speech tags ([[dahl]]: DESIGN.md "Who is speaking"), go to whoever holds the seat
const names = (s, t) => typeof t === 'string' ? t.replace(/\b(Jane|Nolan|Jeremy|Andrea|Mac|Samuel)\b/g, m => nm(s, MAIN[m])).replace(/\[\[(\w+)\]\]/g, (m, k) => SEAT_KEY[k] ? `[[${pickOf(s, k).key}]]` : m) : t;
const variant = (s, c, id) => { const v = (LF.SOC_ALT || {})[id]; return (v && c && c.a && v[pickOf(s, c.a).key + '+' + pickOf(s, c.b).key]) || null; };
LF.socVariant = variant;
// a stable draw from the seed (never s.rng)
const hash = (seed, k) => { let x = ((seed | 0) ^ 0x9e3779b9) >>> 0; for (const ch of k) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995) >>> 0; return ((x ^ (x >>> 15)) >>> 0) / 4294967296; };

const YEAR_OF = { meal: 1, help: 2, watch: 5 };
const CARDS = { meal: [], help: [], watch: [] };
LF.PRO_CARDS = CARDS;
const blank = () => ({ reg: {}, mind: {}, body: {}, native: {}, bonds: [] });

/* Deal the three, one a slot: the supper at random, then for each later slot the card that brings in the most officers
   not met yet (all six in about a third of runs, five otherwise), never the same pair twice. avoid: card ids seen
   lately, dealt only when nothing else is left. A hash of the seed decides between equals. */
LF.proDeal = function (s, avoid) {
  const seen = new Set(avoid || []), deck = [], met = new Set(), pairs = [], key = (a, b) => [a, b].sort().join();
  for (const slot of ['meal', 'help', 'watch']) {
    let list = CARDS[slot].filter(x => !pairs.includes(key(x.a, x.b)));
    if (list.some(x => !seen.has(x.id))) list = list.filter(x => !seen.has(x.id));
    const gain = x => [x.a, x.b].filter(k => !met.has(k)).length, top = Math.max(...list.map(gain));
    list = list.filter(x => gain(x) === top);
    const c = list[Math.floor(hash(s.seed, 'pro.' + slot + '.' + deck.join() + (avoid || []).join()) * list.length)];
    deck.push(c.id); pairs.push(key(c.a, c.b)); met.add(c.a); met.add(c.b);
  }
  s.pro = { deck, i: 0, done: false, fx: blank() };
  return s.pro;
};
/* The next card of the voyage out, if there is one; false once it is over (the UI then plays the long sleep). */
LF.proNext = function (s) {
  const P = s.pro; if (!P || P.done || !s.adrift || s.cur) return false;
  if (P.i >= P.deck.length) { P.done = true; return false; }
  LF.fire(s, P.deck[P.i++]); return true;
};
LF.proOn = s => !!(s.pro && !s.pro.done && s.adrift);
LF.proYear = s => { const st = s.cur && LF.byId[s.cur.id]; return st && st.slot ? YEAR_OF[st.slot] : null; };
// every new game is dealt its voyage out; the UI deals again with the cards the player has seen lately
const newGame0 = LF.newGame;
LF.newGame = function (seed) { const s = newGame0(seed); LF.proDeal(s); return s; };

/* At landfall the six exist: pay what the voyage out did to them. */
LF.proApply = function (s) {
  const P = s.pro; if (!P || P.paid) return; P.paid = true; P.done = true; const X = P.fx || blank();
  const who = k => LF.officer(s, SEAT_KEY[k]) || s.people.find(p => p.seat === SEAT_KEY[k] && p.key === pickOf(s, k).key) || null;   // whoever the player took for that seat
  for (const k in X.reg) { const p = who(k); if (p) p.loyal = LF.clamp(p.loyal + X.reg[k], 0, 100); }
  for (const stat of ['mind', 'body', 'native']) for (const k in X[stat]) { const p = who(k); if (p && p[stat] !== undefined) p[stat] = LF.clamp(p[stat] + X[stat][k], 1, 100); }
  for (const [a, b, kind, why] of X.bonds) { const pa = who(a), pb = who(b); if (pa && pb) LF.bond(s, pa, pb, kind, why); }
};
const land0 = LF.land;
LF.land = function (s) { const r = land0(s); LF.proApply(s); return r; };

const regOf = (s, k) => (s.pro && s.pro.fx.reg[k]) || 0;
/* An outcome's effects (pure, so autoInfo can read it before the choice): chips now, the rest kept in s.pro.fx.
   reg: regard for you by key; nerve, body, native by key; bond: [a, b, kind, why]; kit: the ship's stores. */
const KIT = { food: 'food', parts: 'spare parts' };
const F = o => s => {
  const chips = [];
  for (const k in o.reg || {}) { const d = o.reg[k]; if (d >= 4) chips.push([`${nm(s, k)} warms to you`, true]); else if (d <= -3) chips.push([`${nm(s, k)} is put out`, false]); }
  for (const k in o.nerve || {}) if (o.nerve[k] <= -4) chips.push([`${nm(s, k)} is shaken`, false]);
  for (const k in o.body || {}) if (o.body[k] < 0) chips.push([`${nm(s, k)} is hurt`, false]);
  for (const k in o.native || {}) if (o.native[k] >= 4) chips.push([`${nm(s, k)} learns something`, true]);
  if (o.bond) { const [a, b, kind] = o.bond, had = s.pro && s.pro.fx.bonds.some(x => x[2] === kind && [x[0], x[1]].sort().join() === [a, b].sort().join());
    if (!had) chips.push([kind === 'friend' ? `${nm(s, a)} and ${nm(s, b)} are friends now` : `${nm(s, a)} and ${nm(s, b)} are at odds`, kind === 'friend']); }
  for (const k in o.kit || {}) chips.push([`${o.kit[k] > 0 ? '+' : '−'}${Math.abs(o.kit[k])} ${KIT[k]} in the ship's stores`, o.kit[k] > 0]);
  if (o.extra) chips.push(o.extra);
  return { chips, flags: o.flags, do: s2 => { const X = s2.pro && s2.pro.fx; if (!X) return;
    for (const k in o.reg || {}) X.reg[k] = (X.reg[k] || 0) + o.reg[k];
    for (const [stat, m] of [['mind', o.nerve], ['body', o.body], ['native', o.native]]) for (const k in m || {}) X[stat][k] = (X[stat][k] || 0) + m[k];
    if (o.bond) X.bonds.push(o.bond);
    for (const k in o.kit || {}) if (s2.adrift && s2.adrift.kit) s2.adrift.kit[k] = Math.max(0, s2.adrift.kit[k] + o.kit[k]);
  } }; };

const side = (w, x) => ({ soc_with: w, soc_against: x });

const S = (slot, a, b, st) => {
  CARDS[slot].push({ id: st.id, a, b });
  const setup0 = st.setup, id = st.id, text0 = st.text, fn = v => (typeof v === 'function' ? v : () => v);
  // Every piece of text comes from the version written for the two officers at the table (LF.SOC_ALT), else from the card as
  // first written with the names put right.
  const pre = (s, c, x) => String(x).replace('{SUPPER}', SUPPER).replace('{WATCH}', WATCH(s, c));
  const piece = (base, i, k) => base === undefined && k !== 'info' ? undefined : (s, c) => { const v = variant(s, c, id), x = v && v.choices[i] && v.choices[i][k];
    if (x !== undefined && x !== null && x !== '') return x;
    const b = base === undefined ? undefined : fn(base)(s, c); return Array.isArray(b) ? b.map(p => [p[0], names(s, p[1])]) : names(s, b); };
  st.choices.forEach((ch, i) => { ch.label = piece(ch.label, i, 'label'); if (ch.note !== undefined) ch.note = piece(ch.note, i, 'note'); if (ch.info !== undefined) ch.info = piece(ch.info, i, 'info');
    for (const k of ['out', 'ok', 'bad']) if (ch[k]) ch[k].text = piece(ch[k].text, i, k); });
  return add(Object.assign({ view: 'colony', arc: 'voyage', tone: 'quiet', chain: true, alone: true, slot, kicker: `Year ${YEAR_OF[slot]} out from Earth` }, st,
    { setup: s => Object.assign({ a, b }, setup0 ? setup0(s) : {}),
      text: (s, c) => { const v = variant(s, c, id); return v ? pre(s, c, v.text) : names(s, text0(s, c)); },
      titleOf: (s, c) => { const v = variant(s, c, id); return (v && v.title) || st.title; } }));
};
const SUPPER = 'The Sun is a bright star behind the ship now. For the first two years all six of your officers stay awake to run the Ariadne in, and every evening they eat together in the wardroom with you: one table, one pot.';
const WATCH = (s, c) => `The six keep the ship two at a time now: two years awake each, a year with the one before and a year with the one after. This year the watch is ${nm(s, c.a)} and ${nm(s, c.b)}, and the other four are in the cold. Tonight you've come up to the flight deck with three mugs.`;

/* ================= year 1: the wardroom supper ================= */
S('meal', 'dahl', 'yurbin', { id: 'soc.jar', title: 'Something in a Jar',
  text: () => `${SUPPER}\n\nGerad has brought a jar to supper and put it down beside the salt. Something no bigger than a grain of rice is swimming in it, thousands of them. Jane looks at it once and goes on eating.\n\nKasimir holds it up to the lamp.\n\n[[dahl]] "Lovely. Dinner and a specimen. Does it eat stew, or does it eat us?"\n\n[[yurbin]] "Tardigrades! Out of the soil cores, and no, Nolan, they don't eat stew, they don't eat anything, they dry themselves out and wait, which is, hold on, look at that one, it's moving, they'll outlive the ship, they'll outlive all of us."\n\nMac takes the jar back.\n\n[[yurbin]] "Shame they don't do security, they'd be better at it."`,
  choices: [
    { label: 'Laugh at Nolan\'s', info: [['people', 'Nolan'], ['danger', 'Mac\'s pride']],
      out: { text: 'Nolan grins and passes you the bread. Mac puts the jar in a vest pocket and eats the rest of the meal without a word, which for Mac is a long time.',
        fx: F({ reg: { dahl: 6, yurbin: -3 }, flags: side('dahl', 'yurbin') }) } },
    { label: 'Laugh at Mac\'s', info: [['people', 'Mac'], ['danger', 'Nolan, outnumbered']],
      out: { text: '[[dahl]] "Fair." "Beaten by a jar, and it didn\'t even have to try."\n\nNolan means it. Mac is so pleased that the jar goes round the whole table, and Nolan holds it up to the lamp for longer than anyone.',
        fx: F({ reg: { yurbin: 6, dahl: -2 }, flags: side('yurbin', 'dahl') }) } },
    { label: 'Ask Mac what they are', note: 'Mac will tell you. All of it.', info: [['yield', 'Something learned'], ['danger', 'Nolan\'s supper']],
      out: { text: 'Mac talks until the stew is cold: how they dry out and wait, how long they can wait, what they can wait through. Nolan gets up halfway through to walk the cryo decks and leaves the plate. You come away knowing more about water bears than anyone ought to.',
        fx: F({ reg: { yurbin: 4, dahl: -3 }, native: { yurbin: 2 }, flags: side('yurbin', 'dahl') }) } },
  ] });

S('meal', 'dahl', 'estrada', { id: 'soc.grace', title: 'Grace',
  text: () => `${SUPPER}\n\nTavi waits until everyone has a bowl, then bows over it and says a grace, low, in the old words. Jeremy waits with the spoon in the air.\n\nKasimir doesn't.\n\n[[dahl]] "Who's listening out here, Samuel? We left the last church behind at Mars."\n\nTavi doesn't look up.\n\n[[estrada]] "Far enough out you'd need to say it loud. So I do."`,
  choices: [
    { label: 'Bow your head with Samuel', info: [['people', 'Samuel'], ['danger', 'Nolan, left holding the spoon']],
      out: { text: 'You bow your head, and so does the rest of the table. Nolan puts the spoon down and waits, which is more than anyone expected. Samuel finishes.\n\n[[estrada]] "Eat."\n\nHe smiles at you for the first time since the burn.',
        fx: F({ reg: { estrada: 6, dahl: -2 }, flags: side('estrada', 'dahl') }) } },
    { label: 'Laugh at Nolan\'s line', info: [['people', 'Nolan'], ['danger', 'Samuel']],
      out: { text: 'Nolan grins and starts eating. Samuel finishes the grace anyway, more quietly, and doesn\'t say much else at the table that night.',
        fx: F({ reg: { dahl: 6, estrada: -4 }, flags: side('dahl', 'estrada') }) } },
    { label: 'Ask Samuel to add a word for the ones left on Earth', info: [['people', 'Both of them'], ['danger', 'A quiet table']],
      out: { text: 'Samuel does, without missing a beat. Nobody laughs at that one. Nolan\'s head goes down with the rest and stays down a little longer than Samuel\'s, and nobody says much for the rest of the meal.',
        fx: F({ reg: { estrada: 3, dahl: 2 }, nerve: { dahl: 2 } }) } },
  ] });

S('meal', 'yurbin', 'estrada', { id: 'soc.names', title: 'Names on the Racks',
  text: () => `${SUPPER}\n\nThe hydroponics bay has its first crop up, forty racks of it, and every rack needs a label. Mac has been writing strain codes on them. Samuel has been crossing them out and writing the names of villages back home.\n\nMac says it over the stew.\n\n[[yurbin]] "You can't call a wheat Santa Rosa." "There are four Santa Rosas, Samuel, four, in three countries, and in a year nobody will know which wheat anyone means, a code only ever means the one thing, that's the whole beauty of it."\n\nTavi taught Mac half of what Mac knows about growing things, and Mac has never once admitted it.\n\n[[estrada]] "Folk'll remember Santa Rosa. Nobody's going to remember TR-114."`,
  choices: [
    { label: 'Mac\'s codes', info: [['yield', 'A proper catalogue'], ['danger', 'Samuel']],
      out: { text: 'The racks get Mac\'s codes, in Mac\'s hand, with a line under each. The bay crews learn none of them and call every rack "the tall one" or "the sad one". The seed catalogue is the best-kept book on the ship.',
        fx: F({ reg: { yurbin: 6, estrada: -3 }, native: { yurbin: 2 }, flags: side('yurbin', 'estrada') }) } },
    { label: 'Samuel\'s names', info: [['people', 'The bay crews'], ['danger', 'Mac']],
      out: { text: 'The racks get Samuel\'s names: Santa Rosa, Ixtlán, Little Hill, and one that\'s just "Mother\'s". By the end of the month the whole ship uses them. Mac keeps the codes in a notebook, and sulks.',
        fx: F({ reg: { estrada: 6, yurbin: -4 }, flags: side('estrada', 'yurbin') }) } },
    { label: 'Both, one above the other', info: [['people', 'Both of them, a little'], ['danger', 'Neither gets the label']],
      out: { text: 'Both go on, the code above and the village below, and the labels have to be made twice the size. They argue over whose line goes on top for the rest of the year, and enjoy every minute of it.',
        fx: F({ reg: { yurbin: 2, estrada: 2 }, bond: ['yurbin', 'estrada', 'friend', 'labelled the racks together'] }) } },
  ] });

S('meal', 'kovacs', 'nakamura', { id: 'soc.coffee', title: 'The Last Tin',
  text: () => `${SUPPER}\n\nThe real coffee ran out in month nine. Jeremy has found one more tin at the back of an engineering locker, and it's on the table between Jeremy and Andrea, and neither of them has let go of it.\n\n[[nakamura]] "The night shift in the sick bay hasn't slept in a month, Jeremy." "They're the ones holding people's hands at three in the morning. It's theirs."\n\n[[kovacs]] "The night shift on the reactor hasn't slept in a month either. My locker, my tin."\n\nJeremy doesn't let go.\n\n[[kovacs]] "She's got a temper at three in the morning, the old girl. So have I."`,
  choices: [
    { label: 'The sick bay\'s', info: [['people', 'Andrea'], ['danger', 'Jeremy']],
      out: { text: 'Jeremy lets go of the tin one finger at a time. The sick bay\'s night shift drinks it a spoon a night for a month and won\'t hear a word against you. Jeremy brings it up twice more, and not as a joke.',
        fx: F({ reg: { nakamura: 6, kovacs: -3 }, flags: side('nakamura', 'kovacs') }) } },
    { label: 'The reactor crew\'s', info: [['people', 'Jeremy'], ['danger', 'Andrea']],
      out: { text: 'Jeremy tucks the tin into the overalls and pats it. Andrea says nothing at all, gets up, and takes the bowl back to the sick bay. The reactor crew drinks it for a month and calls you the boss.',
        fx: F({ reg: { kovacs: 6, nakamura: -3 }, flags: side('kovacs', 'nakamura') }) } },
    { label: 'Make it now, here, for the table', info: [['people', 'Everyone at the table'], ['danger', 'Gone in one night']],
      out: { text: 'Jeremy boils the water and Andrea measures it out like a dose. It\'s gone in one evening, a cup each. The smell gets into the corridor, and the crew going past stop at the hatch to breathe it.',
        fx: F({ reg: { kovacs: 1, nakamura: 1 }, bond: ['kovacs', 'nakamura', 'friend', 'shared the last tin'] }) } },
  ] });

S('meal', 'kovacs', 'solheim', { id: 'soc.door', title: 'Half a Door', says: 'engineer',
  text: () => `${SUPPER}\n\nMarit and Jeremy flew together before the ship, and Jeremy has decided the table should know it.\n\n[[kovacs]] "Kiruna, the old test field. Jane brings a lander in sideways and takes the hangar door clean off. The whole door, and guess who hung the new one."\n\n[[solheim]] "Half a door. Forty-knot crosswind."\n\nJane doesn't stop eating.\n\n[[solheim]] "You rebuilt the other half crooked. It was still crooked when we left. I checked."`,
  choices: [
    { label: 'Laugh at Jeremy\'s story', info: [['people', 'Jeremy'], ['danger', 'Jane, who doesn\'t like being the joke']],
      out: { text: 'Jeremy is delighted, and tells it twice more, with the door bigger each time. Jane lets it go, but you see it noted.',
        fx: F({ reg: { kovacs: 6, solheim: -3 }, flags: side('kovacs', 'solheim') }) } },
    { label: 'Laugh at Jane\'s', info: [['people', 'Jane'], ['danger', 'Jeremy, a little']],
      out: { text: 'Jeremy laughs hardest of anyone and swears the door was straight. Jane almost smiles. It\'s the first time anyone at the table has seen it.',
        fx: F({ reg: { solheim: 6, kovacs: 1 }, flags: side('solheim', 'kovacs') }) } },
    { label: 'Ask what flying was like, back then', info: [['people', 'Both of them'], ['danger', 'Jane doesn\'t talk about it']],
      out: { text: 'Jane gives a one-word answer and goes back to the stew. Jeremy fills in the rest: night landings, a dead engine over the sea, how Jane got them both home. Jane doesn\'t correct a word of it. They\'re still at the table when the lamp is turned down.',
        fx: F({ reg: { kovacs: 2, solheim: 2 }, native: { solheim: 2 } }) } },
  ] });

S('meal', 'nakamura', 'solheim', { id: 'soc.line', title: 'The Wardroom',
  text: () => `${SUPPER}\n\nThe waking crew eat in the mess two decks down. The officers eat up here, behind a hatch, and Andrea wants it stopped.\n\n[[nakamura]] "They want to see us in the line with a tray, Jane." "Eating what they're eating. That's all it is, and I don't know what it costs you to give them that."\n\n[[solheim]] "We eat here. We talk shop. Nobody down there wants us looking at their tray."\n\nJane doesn't look up from the stores sheet.\n\n[[solheim]] "Ten minutes. Then the reactor report."`,
  choices: [
    { label: 'Down to the mess with everyone', info: [['people', 'Andrea, and the crew'], ['danger', 'Jane']],
      out: { text: 'The officers queue with a tray from the next night on. The crew are stiff about it for a week and then forget to be. Jane eats standing up and leaves first, every time.',
        fx: F({ reg: { nakamura: 6, solheim: -4 }, flags: side('nakamura', 'solheim') }) } },
    { label: 'The wardroom stays', info: [['people', 'Jane'], ['danger', 'Andrea']],
      out: { text: 'The wardroom stays, and the suppers in it get more done than any meeting. Andrea eats in the sick bay with the night staff more often than not.',
        fx: F({ reg: { solheim: 6, nakamura: -3 }, flags: side('solheim', 'nakamura') }) } },
    { label: 'The mess once a week', info: [['people', 'Both of them, a little'], ['danger', 'Neither is satisfied']],
      out: { text: 'Once a week, then, on rest day. Andrea calls it a start. Jane puts it on the roster like a drill, and the crew treat it like one.',
        fx: F({ reg: { nakamura: 2, solheim: 2 } }) } },
  ] });

/* ================= year 2: a second pair of hands (all six still awake, and the crews running the ship in) ================= */
const trusts = (k, v, label) => If(s => regOf(s, k) >= 4, v, s => names(s, label));
const sore = (k, v, label) => If(s => regOf(s, k) <= -3, v, s => names(s, label));

S('help', 'yurbin', 'nakamura', { id: 'soc.mould', title: 'Under the Dressing',
  text: (s, c) => `A fitter from the hull crew has a gash in the shin that won't close. Nothing heals well in the ship's dry air, and Andrea has cleaned it, cut it back, packed it and cleaned it again. The edges are going grey.\n\nGerad has a fungus out of the soil cores that grows on dead things.\n\n[[yurbin]] "It eats dead tissue, only dead, I've had it on a dish with live cells for a month and it'd rather starve than touch them, and it knows the difference better than we do, isn't that beautiful?"\n\n[[nakamura]] "You want to put something out of a soil core into an open leg." "In my sick bay. On somebody who'd like to keep both of them."`,
  choices: [
    { label: 'Let Mac try it', test: { base: 55, mods: [trusts('nakamura', 8, 'Andrea trusts you'), sore('nakamura', -8, 'Andrea is cross with you')] },
      ok: { text: 'Mac lays it in with tweezers, talking the whole time. Five days later the wound is pink and clean to the edge. Andrea asks for a dish of it for the cabinet and doesn\'t say thank you, and Mac doesn\'t need it said.',
        fx: F({ reg: { yurbin: 5, nakamura: 2 }, native: { yurbin: 4, nakamura: 4 }, bond: ['yurbin', 'nakamura', 'friend', 'closed a wound together'] }) },
      bad: { text: 'It takes, and it doesn\'t stop at the edge. By the third day it\'s in living muscle, and Andrea has the fitter on the table to take the leg below the knee. Andrea doesn\'t speak to Mac for the rest of the year.',
        fx: F({ nerve: { yurbin: -4 }, bond: ['nakamura', 'yurbin', 'rival', 'over the fungus'], extra: ['The fitter loses a leg', false] }) } },
    { label: 'Andrea\'s way: take the leg now, clean', info: [['yield', 'The fitter lives'], ['danger', 'The fitter\'s leg'], ['danger', 'Mac']],
      out: { text: 'Andrea takes it below the knee that afternoon, clean, and the fitter is up on a crutch inside a month. Mac puts the dish in the incinerator and doesn\'t mention it again for a long time.',
        fx: F({ reg: { nakamura: 4, yurbin: -4 }, extra: ['The fitter loses a leg', false] }) } },
    { label: 'Have Mac prove it on Mac\'s own arm first', info: [['yield', 'The leg, if it works'], ['danger', 'Mac\'s arm']],
      out: { text: 'Mac cuts a nick in one forearm that evening, lays the fungus in it and keeps notes. It eats the scab and stops. A month later the fitter\'s leg gets the same, and closes. Mac\'s arm has an ugly white scar that gets shown to anyone who sits still.',
        fx: F({ reg: { yurbin: 6, nakamura: 2 }, body: { yurbin: -6 }, native: { yurbin: 3 } }) } },
  ] });

S('help', 'kovacs', 'estrada', { id: 'soc.racks', title: 'Water for the Racks',
  text: (s, c) => `Samuel's crews water the hydroponic racks by hand, a can at a time, four hours a shift. Jeremy has a spare coolant pump and a coil of line, and reckons it'll mist the whole bay on a timer.\n\n[[kovacs]] "She's a good pump. Wasted sitting in a crate. Give me two days and the parts and she'll water the lot."\n\nTavi isn't sure.\n\n[[estrada]] "Roots rot if they sit wet. Put that much on at once and you'll drown the bottom racks."`,
  choices: [
    { label: 'Jeremy\'s pump, every rack, full pressure', test: { base: 55, mods: [trusts('kovacs', 6, 'Jeremy wants to impress you')] },
      ok: { text: 'The pump coughs, catches and hums. The bay is misted every hour on the hour, and the bay crews go back to pruning. Samuel stands at the end of a rack watching the drops come down, and says a word of thanks over it.',
        fx: F({ reg: { kovacs: 4, estrada: 3 }, kit: { food: 100 } }) },
      bad: { text: 'It runs beautifully for a week. Then the bottom racks go soft and brown at the root, as Samuel said they would, and a month\'s growing goes in the composter. Jeremy shuts the pump off and doesn\'t argue.',
        fx: F({ reg: { estrada: 2 }, nerve: { kovacs: -3 }, kit: { food: -100 } }) } },
    { label: 'The pump on Samuel\'s terms: a fine mist, top racks only', info: [['yield', 'Some of the work saved'], ['danger', 'Jeremy\'s patience'], ['danger', 'Two spare parts']],
      out: { text: 'Jeremy grumbles about running a good pump at a quarter of what it can do, and runs it that way. The crews water the bottom racks by hand and the top ones water themselves, and nothing rots.',
        fx: F({ reg: { estrada: 4, kovacs: 1 }, bond: ['kovacs', 'estrada', 'friend', 'rigged the bay pump together'], kit: { parts: -2, food: 60 } }) } },
    { label: 'Keep the cans', info: [['yield', 'The parts stay in the store'], ['danger', 'Samuel\'s crews'], ['danger', 'Jeremy']],
      out: { text: 'The pump goes back in its crate. The cans go on, four hours a shift, and the crews\' hands crack in the dry air. Jeremy mentions the pump at supper, more than once.',
        fx: F({ reg: { kovacs: -4 } }) } },
  ] });

S('help', 'estrada', 'nakamura', { id: 'soc.broth', title: 'Lamps and Broth',
  text: (s, c) => `Andrea has five in the sick bay who aren't getting better and aren't getting worse: a crushed hand, a bad back, a fever that comes and goes. Samuel has been sitting with them at the end of every shift.\n\n[[estrada]] "Get them out of here and sit them in the bay under the lamps, where it's warm and smells of something growing. Broth with the greens off the racks. My grandmother kept a ward, and nobody in it stayed in bed."\n\n[[nakamura]] "They're not well enough to move." "I'm glad you sit with them, Samuel, I am. But your bay isn't clean, and I'm not putting a fever in among the greens."`,
  choices: [
    { label: 'Samuel\'s way: the lamps and the broth', test: { base: 55, mods: [trusts('nakamura', 8, 'Andrea trusts you')] },
      ok: { text: 'The five sit in a row of chairs between the racks every morning, wrapped up, with a cup of broth each. Inside the month two are back on light work and the fever has gone. Andrea comes up to see it, and stays to help with the pruning.',
        fx: F({ reg: { estrada: 5, nakamura: 3 }, bond: ['estrada', 'nakamura', 'friend', 'got the five out of bed'], extra: ['Two back on the roster', true] }) },
      bad: { text: 'The warmth does them good. The bay doesn\'t: the fever goes through all five by the end of the week, and the oldest is back in a bed for a month, worse than before. Samuel sits with them every evening until they\'re up.',
        fx: F({ reg: { nakamura: -3 }, nerve: { estrada: -4 } }) } },
    { label: 'The broth, but in the sick bay', info: [['people', 'Samuel, a little'], ['danger', 'The five, no quicker']],
      out: { text: 'Samuel carries the broth down every evening in a flask. The five are no quicker to mend, but they\'re cheerful about it, and so is Samuel.',
        fx: F({ reg: { estrada: 2, nakamura: 1 } }) } },
    { label: 'Andrea\'s sick bay, Andrea\'s rules', info: [['people', 'Andrea'], ['danger', 'Samuel'], ['danger', 'The five, still in bed']],
      out: { text: 'The five stay where they are. Samuel still comes by at the end of every shift, empty-handed, and sits by the beds anyway.',
        fx: F({ reg: { nakamura: 4, estrada: -3 } }) } },
  ] });

S('help', 'nakamura', 'dahl', { id: 'soc.dressing', title: 'Field Dressing',
  text: (s, c) => `Andrea wants to teach Nolan's security detail to pack a wound and tie off a bleed: two shifts a month, off their rounds.\n\n[[nakamura]] "Somebody's going to get hurt in the spine one day, and it'll be your lot carrying them to me."\n\nKasimir has a long history with Andrea's needle, from before the ship, and a scar through one eyebrow to show for it.\n\n[[dahl]] "Two shifts off the rounds. Lovely. And who walks the cryo decks while they're learning knots?"`,
  choices: [
    { label: 'Andrea\'s shifts', test: { base: 60, mods: [trusts('dahl', 8, 'Nolan will do it for you'), sore('dahl', -8, 'Nolan is cross with you')] },
      ok: { text: 'The detail learns it, grumbling, on each other\'s arms. Before the year is out one of them packs a gash in a rigger\'s thigh out in the spine, and the rigger walks into the sick bay on two feet. Nolan tells it at supper as if the detail thought of it.',
        fx: F({ reg: { nakamura: 4, dahl: 2 }, native: { dahl: 3 }, bond: ['dahl', 'nakamura', 'friend', 'taught the detail to stitch'] }) },
      bad: { text: 'On the second shift, with half the detail in the sick bay, somebody gets into the dry stores and a whole pallet of rations walks off and is never seen again. Nolan stands in the empty bay and says one word, as if it were a curse.\n\n[[dahl]] "Knots."\n\nHe says nothing else for a day.',
        fx: F({ nerve: { dahl: -2 }, kit: { food: -100 } }) } },
    { label: 'The rounds first. Andrea teaches whoever comes in their own time', info: [['people', 'Nolan'], ['danger', 'Andrea']],
      out: { text: 'Four of the detail come to the sick bay on their rest days. Nolan isn\'t one of them, and says so. Andrea teaches the four anyway and tells you, twice, that four isn\'t enough.',
        fx: F({ reg: { dahl: 4, nakamura: -3 } }) } },
    { label: 'Nolan first, alone, so the detail sees it', info: [['people', 'Both of them'], ['danger', 'Nolan\'s pride']],
      out: { text: 'Nolan sits at Andrea\'s table for an evening being shown how to tie off an arm, and doesn\'t make a single joke. Halfway through Andrea brings up the eyebrow and the night it was stitched, and Nolan laughs out loud. The detail signs up the next morning.',
        fx: F({ reg: { dahl: 2, nakamura: 2 }, bond: ['dahl', 'nakamura', 'friend', 'taught the detail to stitch'] }) } },
  ] });

S('help', 'yurbin', 'kovacs', { id: 'soc.sap', title: 'Resin in the Seals', says: 'scientist',
  text: (s, c) => `The reactor's coolant seals are perishing faster than the manual says they should, and every new one Jeremy fits comes out of the spares that have to last forty years. Mac has been growing a resin off a fungus culture that sets like rubber in an hour.\n\n[[yurbin]] "It holds heat, it holds pressure, I've had it boiling for a week, Jeremy, a week, and it doesn't care, it just sits there being rubber, do you know how rare that is in something that grew itself?"\n\nBashir turns a lump of it over in one big greasy hand.\n\n[[kovacs]] "You want to put mushroom glue in my reactor. In her. In the old girl."`,
  choices: [
    { label: 'Mac\'s resin', test: { base: 52, mods: [trusts('kovacs', 8, 'Jeremy trusts you')] },
      ok: { text: 'Jeremy fits it in one seal, then in all of them, swearing the whole time. A month on they\'re tighter than the factory ones.\n\n[[kovacs]] "Don\'t tell Mac I said so."\n\nJeremy goes and tells Mac.',
        fx: F({ reg: { yurbin: 4, kovacs: 2 }, bond: ['kovacs', 'yurbin', 'friend', 'sealed the reactor with resin'], kit: { parts: 3 } }) },
      bad: { text: 'It holds for nine days. On the tenth the heat turns it to glass and it cracks, and the reactor dumps coolant on the deck before Jeremy can trip it. Jeremy comes to supper with the cracked seal and puts it on Mac\'s plate.',
        fx: F({ nerve: { kovacs: -3 }, bond: ['kovacs', 'yurbin', 'rival', 'over the reactor seals'], kit: { parts: -3 } }) } },
    { label: 'Jeremy\'s way: new seals from the spares', info: [['yield', 'Seals that will hold'], ['danger', 'Two spare parts'], ['danger', 'Mac']],
      out: { text: 'Jeremy fits factory seals, one an evening, and they\'re fine. Mac leaves the lump of resin on the workbench, where it sits for years as a paperweight.',
        fx: F({ reg: { kovacs: 4, yurbin: -3 }, kit: { parts: -2 } }) } },
    { label: 'Try it on the cold loop first, where a leak won\'t matter', info: [['people', 'Both of them, a little'], ['yield', 'A spare part, maybe']],
      out: { text: 'Jeremy puts one seal of resin on the cold loop and checks it every morning. By the end of the month it has held, and Jeremy goes on to the rest without being asked. Mac acts as if it was never in doubt.',
        fx: F({ reg: { kovacs: 2, yurbin: 2 }, kit: { parts: 1 } }) } },
  ] });

S('help', 'dahl', 'estrada', { id: 'soc.stores', title: 'Short in the Stores',
  text: () => `Things are walking out of the stores Samuel keeps: a sack of seed one week, a coil of cable the next. Samuel has started sleeping in there, which isn't helping anything.\n\nKasimir has an idea, and is enjoying it.\n\n[[dahl]] "Leave a sack of the good stuff out and dust the inside with dye, and whoever it is glows green for a week, and then we have a chat, and I'll be very civil about it."\n\n[[estrada]] "Or." "We ask at supper. Whoever it is, they're hungry or they're frightened. Either way they'll come and say."`,
  choices: [
    { label: 'Nolan\'s trap', test: { base: 55, mods: [trusts('estrada', 6, 'Samuel goes along with it for you')] },
      ok: { text: 'It takes four days. A young technician comes on shift with green hands and a story about a rail, and the seed is under a bunk, traded for cigarettes nobody should still have. Nolan has the chat. Samuel sits in on it, and the technician ends up on Samuel\'s crew instead of in the brig.',
        fx: F({ reg: { dahl: 4, estrada: 2 }, bond: ['dahl', 'estrada', 'friend', 'caught the stores thief'], kit: { parts: 2 } }) },
      bad: { text: 'Half the bay crew handle the sack on the first morning, on honest business, and come up green to the elbow. The real thief never touches it. Samuel\'s crews don\'t speak to Nolan\'s detail for a month.',
        fx: F({ reg: { estrada: -3 }, nerve: { dahl: -2 }, kit: { parts: -1 } }) } },
    { label: 'Samuel\'s way: ask at supper', info: [['people', 'Samuel'], ['danger', 'Nolan\'s fun'], ['danger', 'A week of waiting']],
      out: { text: 'Nobody comes forward for a week. Then a young technician does, in tears, and the seed comes back. Nolan calls it the least interesting solution in the history of the species.',
        fx: F({ reg: { estrada: 4, dahl: -3 } }) } },
    { label: 'Let it go. It\'s seed', info: [['danger', 'The stores'], ['danger', 'Both of them']],
      out: { text: 'Nothing is done. The sacks go on walking, a few at a time, for the rest of the year. Samuel counts them out loud at supper.',
        fx: F({ reg: { estrada: -3, dahl: -2 }, kit: { food: -60 } }) } },
  ] });

/* ================= year 5: a year of the watch (two awake, four in the cold) ================= */
const steady = (a, b) => If(s => ((s.pro && s.pro.fx.mind[a]) || 0) > -3 && ((s.pro && s.pro.fx.mind[b]) || 0) > -3, 5, 'Both of them steady');

S('watch', 'dahl', 'kovacs', { id: 'soc.lights', title: 'Two on the Watch',
  text: (s, c) => `${WATCH(s, c)}\n\nKasimir is counting the amber lights on the cryo board.\n\n[[dahl]] "Forty-one amber, and there were thirty-nine at the last change. So who've we lost, Jeremy, and when exactly were you going to mention it?"\n\n[[kovacs]] "Nobody. Sensors. I'll get to them."\n\nJeremy passes a flask.\n\n[[kovacs]] "You count lights, I count bearings. Same job, really."`,
  choices: [
    { label: 'Ask what they\'ll miss about Earth', test: { base: 55, mods: [steady('dahl', 'kovacs'), trusts('dahl', 8, 'Nolan trusts you')] },
      ok: { text: 'Nolan had a dog, it turns out, a stupid one, and tells you every stupid thing it ever did. Jeremy has a daughter who\'ll be sixty by the time anyone wakes. They\'re still talking at ship\'s morning, and Jeremy leaves the flask with Nolan.',
        fx: F({ reg: { dahl: 3, kovacs: 3 }, bond: ['dahl', 'kovacs', 'friend', 'stood a watch together'] }) },
      bad: { text: 'Nolan says nobody back home will remember they ever existed, and that it\'s better that way. Jeremy gets up and goes to check a panel that doesn\'t need checking, and doesn\'t come back until morning.',
        fx: F({ nerve: { dahl: -4, kovacs: -4 } }) } },
    { label: 'Ask Jeremy straight how long the reactor has', info: [['people', 'Jeremy'], ['danger', 'Nolan\'s sleep']],
      out: { text: 'Jeremy says it flat, like a weather report.\n\n[[kovacs]] "Forty-five years. Long enough, just, if I keep my hands on her."\n\nNolan laughs a little too long and asks for the flask back.',
        fx: F({ reg: { kovacs: 5 }, nerve: { dahl: -2 } }) } },
    { label: 'Leave them the flask and take the far console', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You take the far console. When you look over they\'re arguing about something with real heat and enjoying it, and neither of them looks up.',
        fx: F({ bond: ['dahl', 'kovacs', 'friend', 'stood a watch together'] }) } },
  ] });

S('watch', 'nakamura', 'solheim', { id: 'soc.count', title: 'Jane\'s Book',
  text: (s, c) => `${WATCH(s, c)}\n\nAmara has found Jane's notebook, the one nobody else sees. It has nine lines in it, one for every death since the burn: the pods that failed in the first year, the rigger crushed in the spine, each with a name. Jane is standing with a hand out for it.\n\n[[nakamura]] "The others should hear it." "Wake them for one supper and read it out loud, all of it. They're not yours to carry, Jane."\n\nJane speaks very quietly.\n\n[[solheim]] "Give it back."`,
  choices: [
    { label: 'Back Andrea: wake the six for one supper, and read it out', test: { base: 50, mods: [trusts('solheim', 10, 'Jane trusts you'), sore('solheim', -10, 'Jane is cross with you')] },
      ok: { text: 'Jane takes the notebook back and looks at it a long time.\n\n[[solheim]] "One supper, then. I\'ll read it."\n\nThe four are brought up out of the cold for a night, and Jane reads all nine without stopping. Andrea is crying by the end of it, and Jane looks ten years lighter.',
        fx: F({ reg: { nakamura: 4, solheim: 3 }, bond: ['nakamura', 'solheim', 'friend', 'read the dead out together'] }) },
      bad: { text: 'Jane takes the notebook, puts it inside the flight jacket and leaves the flight deck without a word. The next morning there\'s a new lock on Jane\'s locker. Andrea tells you you\'ve made it worse, and is probably right.',
        fx: F({ reg: { solheim: -5, nakamura: -2 }, nerve: { solheim: -4 } }) } },
    { label: 'Back Jane: it\'s Jane\'s to carry', info: [['people', 'Jane'], ['danger', 'Andrea'], ['danger', 'What Jane carries']],
      out: { text: 'Andrea hands it back. Jane puts it away and speaks to you, not to Andrea.\n\n[[solheim]] "Thank you."\n\nAndrea doesn\'t speak to either of you for the rest of the watch.',
        fx: F({ reg: { solheim: 6, nakamura: -4 }, nerve: { solheim: -2 } }) } },
    { label: 'Ask Jane to read you one', test: { base: 60, mods: [trusts('solheim', 6, 'Jane trusts you')] },
      ok: { text: 'Jane opens it at the first page and reads one name. Andrea knew them, as it turns out, and tells you about them. Then Jane reads another. By ship\'s morning they\'ve done all nine, and Jane is the one turning the pages.',
        fx: F({ reg: { solheim: 2 }, bond: ['nakamura', 'solheim', 'friend', 'read the dead out together'] }) },
      bad: { text: 'Jane reads them all, in order, flat, and then reads them again and doesn\'t stop when Andrea asks. Neither of them looks at you when the lamps come up.',
        fx: F({ nerve: { solheim: -4, nakamura: -4 } }) } },
  ] });

S('watch', 'yurbin', 'estrada', { id: 'soc.sky', title: 'The Big Window',
  text: (s, c) => `${WATCH(s, c)}\n\nGerad hasn't looked at the board once: the star chart in one hand, a pencil in the other, nose to the big window. Samuel is saying the night prayer, quietly, to the same stars.\n\n[[yurbin]] "There's a smudge there that isn't on the chart." "Not in the catalogue, not on last year's plate, nothing, it's just there, and I've been looking at it for an hour and I don't want to stop, isn't that wonderful?"\n\nTavi finishes the prayer before answering.\n\n[[estrada]] "It's on somebody's chart. Just not yours."`,
  choices: [
    { label: 'Ask Mac to show you', test: { base: 60, mods: [trusts('estrada', 6, 'Samuel trusts you')] },
      ok: { text: 'Mac shows you a faint smear of light that moves against the stars, slowly, and says it\'s a comet nobody on Earth has seen yet. Samuel asks what to call it. They argue about it until morning and settle on something neither of them will tell you.',
        fx: F({ reg: { yurbin: 3 }, native: { yurbin: 3 }, bond: ['yurbin', 'estrada', 'friend', 'named a comet together'] }) },
      bad: { text: 'Mac gets going on how far the light has come and how long its star has been dead, and somewhere in it says there\'s nobody out here to hear a prayer. Samuel stops talking. Mac doesn\'t notice for an hour, and then can\'t take it back.',
        fx: F({ reg: { estrada: -2 }, nerve: { estrada: -4 } }) } },
    { label: 'Ask Samuel to say one for the watch', info: [['people', 'Samuel'], ['danger', 'Mac, kept waiting']],
      out: { text: 'Samuel says it again, louder, for the three of you and for the sleepers. Mac stands with the chart folded, listening, and says amen in the wrong place.',
        fx: F({ reg: { estrada: 5 } }) } },
    { label: 'Leave them to the window', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You take your mug to the far console. When you look back they\'re sitting on the step under the window side by side, and Mac is holding the chart so Samuel can see it.',
        fx: F({ bond: ['yurbin', 'estrada', 'friend', 'watched the window together'] }) } },
  ] });

S('watch', 'dahl', 'nakamura', { id: 'soc.scar', title: 'Stitches',
  text: (s, c) => `${WATCH(s, c)}\n\nAmara put Nolan back together once, on the launch docks, and Nolan has never said thank you. The scar through the eyebrow is from that night. Neither of them has mentioned it in four hours.\n\nKasimir is cleaning a sidearm that's already clean. Andrea watches.\n\n[[nakamura]] "You'll wear the barrel through, Nolan. Put it down and eat something."\n\n[[dahl]] "Then I'll have a job tomorrow."\n\nNolan doesn't look up.\n\n[[dahl]] "Lovely night for it."`,
  choices: [
    { label: 'Ask Nolan about the scar', test: { base: 50, mods: [trusts('dahl', 10, 'Nolan trusts you'), sore('dahl', -10, 'Nolan is cross with you')] },
      ok: { text: 'Nolan tells it badly, then Andrea tells it properly: a riot on the cargo dock, a pipe wrench, nine stitches and Nolan complaining through every one. By the end they\'re both laughing. At ship\'s morning Nolan says it to nobody in particular.\n\n[[dahl]] "Thanks, doc."',
        fx: F({ reg: { dahl: 3 }, bond: ['dahl', 'nakamura', 'friend', 'laughed about the stitches'] }) },
      bad: { text: 'Nolan says it\'s none of your business, then says something worse about Andrea\'s sick bay that isn\'t true. Andrea leaves the flight deck. Nolan finishes the sidearm and starts it again.',
        fx: F({ reg: { dahl: -4 }, nerve: { dahl: -3, nakamura: -3 } }) } },
    { label: 'Stand the rest of Nolan\'s watch yourself', info: [['people', 'Nolan, a night\'s sleep'], ['danger', 'Your own night\'s sleep']],
      out: { text: 'Nolan hands you the log and goes to bed without arguing, which says enough. Andrea tells you Nolan hasn\'t slept a whole night since the burn. You hadn\'t known.',
        fx: F({ reg: { nakamura: 3, dahl: 2 } }) } },
    { label: 'Leave them be', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You take your mug and go. Not much is said on the flight deck that night, but Andrea is up there again the next night with two mugs.',
        fx: F({ bond: ['dahl', 'nakamura', 'friend', 'stood a watch together'] }) } },
  ] });

S('watch', 'kovacs', 'estrada', { id: 'soc.stones', title: 'The Quiet Shift',
  text: (s, c) => `${WATCH(s, c)}\n\nTwo of the quietest people on the ship on one watch. They've been up here four hours and, by the log, said eleven words between them. They've scratched a board into a spare console panel and are playing a game with washers that nobody else understands.\n\nBashir moves a washer. Samuel looks at it for a long time, then moves another.\n\n[[kovacs]] "Hm."`,
  choices: [
    { label: 'Sit in and play the winner', test: { base: 50, mods: [] },
      ok: { text: 'You lose, twice, which is right. Jeremy explains the rules after the second game, which takes one sentence. Samuel laughs at something you do with a washer, and you realise you\'ve never heard Samuel laugh.',
        fx: F({ reg: { kovacs: 4, estrada: 4 } }) },
      bad: { text: 'Somehow you win the first game. Jeremy looks at the board for a long time and goes back to the console. Samuel puts the washers away. Nobody mentions a rematch.',
        fx: F({ reg: { kovacs: -3 }, nerve: { kovacs: -2 } }) } },
    { label: 'Ask what the colony will look like in twenty years', test: { base: 55, mods: [steady('kovacs', 'estrada')] },
      ok: { text: 'Samuel sees orchards, and a field you can\'t see the end of. Jeremy sees a proper workshop with a roof that doesn\'t leak and a lathe that isn\'t held together with wire. It takes them an hour to say it, between moves, and you go to bed believing it.',
        fx: F({ reg: { kovacs: 2, estrada: 2 }, bond: ['kovacs', 'estrada', 'friend', 'stood the quiet shift together'] }) },
      bad: { text: '[[kovacs]] "Twenty years?"\n\nJeremy moves a washer.\n\n[[kovacs]] "The old girl won\'t last the trip."\n\nSamuel says nothing, which is worse, and the game goes on in a different kind of quiet.',
        fx: F({ nerve: { kovacs: -3, estrada: -3 } }) } },
    { label: 'Leave them the game', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You leave them to it. In the morning the panel has a second game scratched beside the first, and a third, half done.',
        fx: F({ bond: ['kovacs', 'estrada', 'friend', 'stood the quiet shift together'] }) } },
  ] });

S('watch', 'solheim', 'yurbin', { id: 'soc.cold', title: 'One More Year',
  text: (s, c) => `${WATCH(s, c)}\n\nGerad's two years are up at the end of the month, and Mac doesn't want to go under.\n\n[[yurbin]] "Years at a time with the instruments running and nobody reading them, think what goes past while I'm asleep, no, think what we're missing right now, let me stay up through the next watch, one more year, and I'll go under after, I promise I'll go under."\n\nMarit hasn't looked away from the board.\n\n[[solheim]] "Two years up, then under. That was the rota when you signed it, and it's the rota now."`,
  choices: [
    { label: 'Back Jane: two years, then under', info: [['people', 'Jane'], ['danger', 'Mac']],
      out: { text: 'Mac goes under on the day, with a notebook held against the chest until the lid comes down. Jane signs the log and doesn\'t say anything about it.',
        fx: F({ reg: { solheim: 4, yurbin: -4 }, nerve: { yurbin: -2 } }) } },
    { label: 'Back Mac: one more year up', test: { base: 50, mods: [trusts('solheim', 10, 'Jane will hear you out')] },
      ok: { text: 'Jane gives it a year and not a day more. Mac fills four notebooks with things nobody alive has seen and goes under on the day, grinning, with the notebooks in the pod.',
        fx: F({ reg: { yurbin: 6, solheim: -2 }, native: { yurbin: 6 } }) },
      bad: { text: 'A third year awake on a sleeping ship is a long time. By the end Mac is talking to the instruments and sleeping under the big window, and has to be talked into the pod a day at a time.',
        fx: F({ reg: { yurbin: 3 }, nerve: { yurbin: -10 }, body: { yurbin: -4 } }) } },
    { label: 'Ask Mac what it is really', test: { base: 55, mods: [trusts('yurbin', 8, 'Mac trusts you')] },
      ok: { text: 'It takes a while. Mac is afraid of the lid coming down and never coming up. Jane listens to all of it, then answers.\n\n[[solheim]] "So am I. Every time."\n\nAt the end of the month Jane walks Mac down to the bay herself, and holds Mac\'s hand until the frost comes.',
        fx: F({ bond: ['solheim', 'yurbin', 'friend', 'went into the cold together'] }) },
      bad: { text: 'Mac laughs it off, says it\'s the instruments and only the instruments, and talks about the instruments until morning. You don\'t get any further, and neither does Jane.',
        fx: F({ nerve: { yurbin: -3 } }) } },
  ] });
})();

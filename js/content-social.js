/* Landfall — the voyage out (Lachlan, 2026-11-17; DESIGN.md "The voyage out"). An ease-in for new players, before
   anything goes wrong: three small social scenes aboard the Ariadne in the first five years out from Earth, while the
   senior crew are awake to run the ship in. The player meets the six as people and learns how a card works (options,
   what each risks, odds and what bends them) with nothing much at stake. Then the long sleep, and the disaster that
   leaves the ship adrift (s.premise, js/intro.js).
     year 1, the wardroom supper: the six at one table; whose joke you laugh at, or whose side you take on a small point.
     year 3, a second pair of hands: one officer brings their trade to another's problem; help or hinder.
     year 5, the last watches before the cold: two on the flight deck at night talk something through; it can go
       well or badly.
   Eighteen cards, six a slot; three are dealt a run (LF.proDeal): one a slot, the three pairs between them covering
   all six officers, and the cards the player saw in the last games dealt last (the UI passes them).
   The officers do not exist yet (LF.makeOfficers runs at LF.land), so what a card does is kept in s.pro.fx and paid at
   landfall (LF.proApply): regard for you (p.loyal), nerve, health and experience, ties between them (LF.bond), and a
   little more or less in the ship's stores (s.adrift.kit). No dark option, no stain, nobody sent in person. */
(function () {
'use strict';
const { add, h } = LF; const { If } = h;
const FIRST = {}; for (const seat in LF.CAST) for (const c of LF.CAST[seat]) FIRST[c.key] = c.first;
// a stable draw from the seed (never s.rng)
const hash = (seed, k) => { let x = ((seed | 0) ^ 0x9e3779b9) >>> 0; for (const ch of k) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995) >>> 0; return ((x ^ (x >>> 15)) >>> 0) / 4294967296; };

const YEAR_OF = { meal: 1, help: 3, watch: 5 };
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
  const who = k => s.people.find(p => p.key === k && p.seat);
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
  for (const k in o.reg || {}) { const d = o.reg[k]; if (d >= 4) chips.push([`${FIRST[k]} warms to you`, true]); else if (d <= -3) chips.push([`${FIRST[k]} is put out`, false]); }
  for (const k in o.nerve || {}) if (o.nerve[k] <= -4) chips.push([`${FIRST[k]} is shaken`, false]);
  for (const k in o.body || {}) if (o.body[k] < 0) chips.push([`${FIRST[k]} is hurt`, false]);
  for (const k in o.native || {}) if (o.native[k] >= 4) chips.push([`${FIRST[k]} learns something`, true]);
  if (o.bond) { const [a, b, kind] = o.bond, had = s.pro && s.pro.fx.bonds.some(x => x[2] === kind && [x[0], x[1]].sort().join() === [a, b].sort().join());
    if (!had) chips.push([kind === 'friend' ? `${FIRST[a]} and ${FIRST[b]} are friends now` : `${FIRST[a]} and ${FIRST[b]} are at odds`, kind === 'friend']); }
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
  const setup0 = st.setup;
  return add(Object.assign({ view: 'colony', arc: 'voyage', tone: 'quiet', chain: true, alone: true, slot, kicker: `Year ${YEAR_OF[slot]} out from Earth` }, st,
    { setup: s => Object.assign({ a, b }, setup0 ? setup0(s) : {}) }));
};
const SUPPER = 'The Sun is a bright star behind the ship now. For the first five years the senior crew stay awake to run the Ariadne in, and every evening the six of them eat together in the wardroom with you: one table, one pot.';
const WATCH = (s, c) => `In a month the senior crew go into the cold for the long sleep. Tonight the watch on the flight deck is ${FIRST[c.a]} and ${FIRST[c.b]}, and you've come up with three mugs.`;

/* ================= year 1: the wardroom supper ================= */
S('meal', 'dahl', 'yurbin', { id: 'soc.jar', title: 'Something in a Jar',
  text: () => `${SUPPER}\n\nGerad has brought a jar to supper and put it down beside the salt. Something no bigger than a grain of rice is swimming in it, thousands of them. Marit looks at it once and goes on eating.\n\nKasimir holds it up to the lamp. "Lovely. Dinner and a specimen. Does it eat stew, or does it eat us?"\n\n"Tardigrades! Out of the soil cores, and no, Kasimir, they don't eat stew, they don't eat anything, they dry themselves out and wait, which is, hold on, look at that one, it's moving, they'll outlive the ship, they'll outlive all of us." Gerad takes the jar back. "Shame they don't do security, they'd be better at it."`,
  choices: [
    { label: 'Laugh at Kasimir\'s', info: [['people', 'Kasimir'], ['danger', 'Gerad\'s pride']],
      out: { text: 'Kasimir grins and passes you the bread. Gerad puts the jar in a vest pocket and eats the rest of the meal without a word, which for Gerad is a long time.',
        fx: F({ reg: { dahl: 6, yurbin: -3 }, flags: side('dahl', 'yurbin') }) } },
    { label: 'Laugh at Gerad\'s', info: [['people', 'Gerad'], ['danger', 'Kasimir, outnumbered']],
      out: { text: '"Fair," Kasimir says. "Beaten by a jar, and it didn\'t even have to try," and means it. Gerad is so pleased that the jar goes round the whole table, and Kasimir holds it up to the lamp for longer than anyone.',
        fx: F({ reg: { yurbin: 6, dahl: -2 }, flags: side('yurbin', 'dahl') }) } },
    { label: 'Ask Gerad what they are', note: 'Gerad will tell you. All of it.', info: [['yield', 'Something learned'], ['danger', 'Kasimir\'s supper']],
      out: { text: 'Gerad talks until the stew is cold: how they dry out and wait, how long they can wait, what they can wait through. Kasimir gets up halfway through to walk the cryo decks and leaves the plate. You come away knowing more about water bears than anyone ought to.',
        fx: F({ reg: { yurbin: 4, dahl: -3 }, native: { yurbin: 2 }, flags: side('yurbin', 'dahl') }) } },
  ] });

S('meal', 'dahl', 'estrada', { id: 'soc.grace', title: 'Grace',
  text: () => `${SUPPER}\n\nTavi waits until everyone has a bowl, then bows over it and says a grace, low, in the old words. Bashir waits with the spoon in the air.\n\nKasimir doesn't. "Who's listening out here, Tavi? We left the last church behind at Mars."\n\nTavi doesn't look up. "Far enough out you'd need to say it loud. So I do."`,
  choices: [
    { label: 'Bow your head with Tavi', info: [['people', 'Tavi'], ['danger', 'Kasimir, left holding the spoon']],
      out: { text: 'You bow your head, and so does the rest of the table. Kasimir puts the spoon down and waits, which is more than anyone expected. Tavi finishes, says "Eat," and smiles at you for the first time since the burn.',
        fx: F({ reg: { estrada: 6, dahl: -2 }, flags: side('estrada', 'dahl') }) } },
    { label: 'Laugh at Kasimir\'s line', info: [['people', 'Kasimir'], ['danger', 'Tavi']],
      out: { text: 'Kasimir grins and starts eating. Tavi finishes the grace anyway, more quietly, and doesn\'t say much else at the table that night.',
        fx: F({ reg: { dahl: 6, estrada: -4 }, flags: side('dahl', 'estrada') }) } },
    { label: 'Ask Tavi to add a word for the ones left on Earth', info: [['people', 'Both of them'], ['danger', 'A quiet table']],
      out: { text: 'Tavi does, without missing a beat. Nobody laughs at that one. Kasimir\'s head goes down with the rest and stays down a little longer than Tavi\'s, and nobody says much for the rest of the meal.',
        fx: F({ reg: { estrada: 3, dahl: 2 }, nerve: { dahl: 2 } }) } },
  ] });

S('meal', 'yurbin', 'estrada', { id: 'soc.names', title: 'Names on the Racks',
  text: () => `${SUPPER}\n\nThe hydroponics bay has its first crop up, forty racks of it, and every rack needs a label. Gerad has been writing strain codes on them. Tavi has been crossing them out and writing the names of villages back home.\n\n"You can't call a wheat Santa Rosa," Gerad says over the stew. "There are four Santa Rosas, Tavi, four, in three countries, and in a year nobody will know which wheat anyone means, a code only ever means the one thing, that's the whole beauty of it."\n\nTavi taught Gerad half of what Gerad knows about growing things, and Gerad has never once admitted it. "Folk'll remember Santa Rosa. Nobody's going to remember TR-114."`,
  choices: [
    { label: 'Gerad\'s codes', info: [['yield', 'A proper catalogue'], ['danger', 'Tavi']],
      out: { text: 'The racks get Gerad\'s codes, in Gerad\'s hand, with a line under each. The bay crews learn none of them and call every rack "the tall one" or "the sad one". The seed catalogue is the best-kept book on the ship.',
        fx: F({ reg: { yurbin: 6, estrada: -3 }, native: { yurbin: 2 }, flags: side('yurbin', 'estrada') }) } },
    { label: 'Tavi\'s names', info: [['people', 'The bay crews'], ['danger', 'Gerad']],
      out: { text: 'The racks get Tavi\'s names: Santa Rosa, Ixtlán, Little Hill, and one that\'s just "Mother\'s". By the end of the month the whole ship uses them. Gerad keeps the codes in a notebook, and sulks.',
        fx: F({ reg: { estrada: 6, yurbin: -4 }, flags: side('estrada', 'yurbin') }) } },
    { label: 'Both, one above the other', info: [['people', 'Both of them, a little'], ['danger', 'Neither gets the label']],
      out: { text: 'Both go on, the code above and the village below, and the labels have to be made twice the size. They argue over whose line goes on top for the rest of the year, and enjoy every minute of it.',
        fx: F({ reg: { yurbin: 2, estrada: 2 }, bond: ['yurbin', 'estrada', 'friend', 'labelled the racks together'] }) } },
  ] });

S('meal', 'kovacs', 'nakamura', { id: 'soc.coffee', title: 'The Last Tin',
  text: () => `${SUPPER}\n\nThe real coffee ran out in month nine. Bashir has found one more tin at the back of an engineering locker, and it's on the table between Bashir and Amara, and neither of them has let go of it.\n\n"The night shift in the sick bay hasn't slept in a month, Bashir," Amara says. "They're the ones holding people's hands at three in the morning. It's theirs."\n\n"The night shift on the reactor hasn't slept in a month either. My locker, my tin." Bashir doesn't let go. "She's got a temper at three in the morning, the old girl. So have I."`,
  choices: [
    { label: 'The sick bay\'s', info: [['people', 'Amara'], ['danger', 'Bashir']],
      out: { text: 'Bashir lets go of the tin one finger at a time. The sick bay\'s night shift drinks it a spoon a night for a month and won\'t hear a word against you. Bashir brings it up twice more, and not as a joke.',
        fx: F({ reg: { nakamura: 6, kovacs: -3 }, flags: side('nakamura', 'kovacs') }) } },
    { label: 'The reactor crew\'s', info: [['people', 'Bashir'], ['danger', 'Amara']],
      out: { text: 'Bashir tucks the tin into the overalls and pats it. Amara says nothing at all, gets up, and takes the bowl back to the sick bay. The reactor crew drinks it for a month and calls you the boss.',
        fx: F({ reg: { kovacs: 6, nakamura: -3 }, flags: side('kovacs', 'nakamura') }) } },
    { label: 'Make it now, here, for the table', info: [['people', 'Everyone at the table'], ['danger', 'Gone in one night']],
      out: { text: 'Bashir boils the water and Amara measures it out like a dose. It\'s gone in one evening, a cup each. The smell gets into the corridor, and the crew going past stop at the hatch to breathe it.',
        fx: F({ reg: { kovacs: 1, nakamura: 1 }, bond: ['kovacs', 'nakamura', 'friend', 'shared the last tin'] }) } },
  ] });

S('meal', 'kovacs', 'solheim', { id: 'soc.door', title: 'Half a Door',
  text: () => `${SUPPER}\n\nMarit and Bashir flew together before the ship, and Bashir has decided the table should know it.\n\n"Kiruna, the old test field. Marit brings a lander in sideways and takes the hangar door clean off. The whole door, and guess who hung the new one."\n\n"Half a door. Forty-knot crosswind." Marit doesn't stop eating. "You rebuilt the other half crooked. It was still crooked when we left. I checked."`,
  choices: [
    { label: 'Laugh at Bashir\'s story', info: [['people', 'Bashir'], ['danger', 'Marit, who doesn\'t like being the joke']],
      out: { text: 'Bashir is delighted, and tells it twice more, with the door bigger each time. Marit lets it go, but you see it noted.',
        fx: F({ reg: { kovacs: 6, solheim: -3 }, flags: side('kovacs', 'solheim') }) } },
    { label: 'Laugh at Marit\'s', info: [['people', 'Marit'], ['danger', 'Bashir, a little']],
      out: { text: 'Bashir laughs hardest of anyone and swears the door was straight. Marit almost smiles. It\'s the first time anyone at the table has seen it.',
        fx: F({ reg: { solheim: 6, kovacs: 1 }, flags: side('solheim', 'kovacs') }) } },
    { label: 'Ask what flying was like, back then', info: [['people', 'Both of them'], ['danger', 'Marit doesn\'t talk about it']],
      out: { text: 'Marit gives a one-word answer and goes back to the stew. Bashir fills in the rest: night landings, a dead engine over the sea, how Marit got them both home. Marit doesn\'t correct a word of it. They\'re still at the table when the lamp is turned down.',
        fx: F({ reg: { kovacs: 2, solheim: 2 }, native: { solheim: 2 } }) } },
  ] });

S('meal', 'nakamura', 'solheim', { id: 'soc.line', title: 'The Wardroom',
  text: () => `${SUPPER}\n\nThe waking crew eat in the mess two decks down. The officers eat up here, behind a hatch, and Amara wants it stopped.\n\n"They want to see us in the line with a tray, Marit," Amara says. "Eating what they're eating. That's all it is, and I don't know what it costs you to give them that."\n\n"We eat here. We talk shop. Nobody down there wants us looking at their tray." Marit doesn't look up from the stores sheet. "Ten minutes. Then the reactor report."`,
  choices: [
    { label: 'Down to the mess with everyone', info: [['people', 'Amara, and the crew'], ['danger', 'Marit']],
      out: { text: 'The officers queue with a tray from the next night on. The crew are stiff about it for a week and then forget to be. Marit eats standing up and leaves first, every time.',
        fx: F({ reg: { nakamura: 6, solheim: -4 }, flags: side('nakamura', 'solheim') }) } },
    { label: 'The wardroom stays', info: [['people', 'Marit'], ['danger', 'Amara']],
      out: { text: 'The wardroom stays, and the suppers in it get more done than any meeting. Amara eats in the sick bay with the night staff more often than not.',
        fx: F({ reg: { solheim: 6, nakamura: -3 }, flags: side('solheim', 'nakamura') }) } },
    { label: 'The mess once a week', info: [['people', 'Both of them, a little'], ['danger', 'Neither is satisfied']],
      out: { text: 'Once a week, then, on rest day. Amara calls it a start. Marit puts it on the roster like a drill, and the crew treat it like one.',
        fx: F({ reg: { nakamura: 2, solheim: 2 } }) } },
  ] });

/* ================= year 3: a second pair of hands ================= */
const trusts = (k, v, label) => If(s => regOf(s, k) >= 4, v, label);
const sore = (k, v, label) => If(s => regOf(s, k) <= -3, v, label);

S('help', 'yurbin', 'nakamura', { id: 'soc.mould', title: 'Under the Dressing',
  text: (s, c) => `A fitter from the hull crew has a gash in the shin that won't close. Nothing heals well in the ship's dry air, and Amara has cleaned it, cut it back, packed it and cleaned it again. The edges are going grey.\n\nGerad has a fungus out of the soil cores that grows on dead things. "It eats dead tissue, only dead, I've had it on a dish with live cells for a month and it'd rather starve than touch them, and it knows the difference better than we do, isn't that beautiful?"\n\n"You want to put something out of a soil core into an open leg," Amara says. "In my sick bay. On somebody who'd like to keep both of them."`,
  choices: [
    { label: 'Let Gerad try it', test: { base: 55, mods: [trusts('nakamura', 8, 'Amara trusts you'), sore('nakamura', -8, 'Amara is cross with you')] },
      ok: { text: 'Gerad lays it in with tweezers, talking the whole time. Five days later the wound is pink and clean to the edge. Amara asks for a dish of it for the cabinet and doesn\'t say thank you, and Gerad doesn\'t need it said.',
        fx: F({ reg: { yurbin: 5, nakamura: 2 }, native: { yurbin: 4, nakamura: 4 }, bond: ['yurbin', 'nakamura', 'friend', 'closed a wound together'] }) },
      bad: { text: 'It takes, and it doesn\'t stop at the edge. By the third day it\'s in living muscle, and Amara has the fitter on the table to take the leg below the knee. Amara doesn\'t speak to Gerad for the rest of the year.',
        fx: F({ nerve: { yurbin: -4 }, bond: ['nakamura', 'yurbin', 'rival', 'over the fungus'], extra: ['The fitter loses a leg', false] }) } },
    { label: 'Amara\'s way: take the leg now, clean', info: [['yield', 'The fitter lives'], ['danger', 'The fitter\'s leg'], ['danger', 'Gerad']],
      out: { text: 'Amara takes it below the knee that afternoon, clean, and the fitter is up on a crutch inside a month. Gerad puts the dish in the incinerator and doesn\'t mention it again for a long time.',
        fx: F({ reg: { nakamura: 4, yurbin: -4 }, extra: ['The fitter loses a leg', false] }) } },
    { label: 'Have Gerad prove it on Gerad\'s own arm first', info: [['yield', 'The leg, if it works'], ['danger', 'Gerad\'s arm']],
      out: { text: 'Gerad cuts a nick in one forearm that evening, lays the fungus in it and keeps notes. It eats the scab and stops. A month later the fitter\'s leg gets the same, and closes. Gerad\'s arm has an ugly white scar that gets shown to anyone who sits still.',
        fx: F({ reg: { yurbin: 6, nakamura: 2 }, body: { yurbin: -6 }, native: { yurbin: 3 } }) } },
  ] });

S('help', 'kovacs', 'estrada', { id: 'soc.racks', title: 'Water for the Racks',
  text: (s, c) => `Tavi's crews water the hydroponic racks by hand, a can at a time, four hours a shift. Bashir has a spare coolant pump and a coil of line, and reckons it'll mist the whole bay on a timer.\n\n"She's a good pump. Wasted sitting in a crate. Give me two days and the parts and she'll water the lot."\n\nTavi isn't sure. "Roots rot if they sit wet. Put that much on at once and you'll drown the bottom racks."`,
  choices: [
    { label: 'Bashir\'s pump, every rack, full pressure', test: { base: 55, mods: [trusts('kovacs', 6, 'Bashir wants to impress you')] },
      ok: { text: 'The pump coughs, catches and hums. The bay is misted every hour on the hour, and the bay crews go back to pruning. Tavi stands at the end of a rack watching the drops come down, and says a word of thanks over it.',
        fx: F({ reg: { kovacs: 4, estrada: 3 }, kit: { food: 100 } }) },
      bad: { text: 'It runs beautifully for a week. Then the bottom racks go soft and brown at the root, as Tavi said they would, and a month\'s growing goes in the composter. Bashir shuts the pump off and doesn\'t argue.',
        fx: F({ reg: { estrada: 2 }, nerve: { kovacs: -3 }, kit: { food: -100 } }) } },
    { label: 'The pump on Tavi\'s terms: a fine mist, top racks only', info: [['yield', 'Some of the work saved'], ['danger', 'Bashir\'s patience'], ['danger', 'Two spare parts']],
      out: { text: 'Bashir grumbles about running a good pump at a quarter of what it can do, and runs it that way. The crews water the bottom racks by hand and the top ones water themselves, and nothing rots.',
        fx: F({ reg: { estrada: 4, kovacs: 1 }, bond: ['kovacs', 'estrada', 'friend', 'rigged the bay pump together'], kit: { parts: -2, food: 60 } }) } },
    { label: 'Keep the cans', info: [['yield', 'The parts stay in the store'], ['danger', 'Tavi\'s crews'], ['danger', 'Bashir']],
      out: { text: 'The pump goes back in its crate. The cans go on, four hours a shift, and the crews\' hands crack in the dry air. Bashir mentions the pump at supper, more than once.',
        fx: F({ reg: { kovacs: -4 } }) } },
  ] });

S('help', 'estrada', 'nakamura', { id: 'soc.broth', title: 'Lamps and Broth',
  text: (s, c) => `Amara has five in the sick bay who aren't getting better and aren't getting worse: a crushed hand, a bad back, a fever that comes and goes. Tavi has been sitting with them at the end of every shift.\n\n"Get them out of here and sit them in the bay under the lamps, where it's warm and smells of something growing. Broth with the greens off the racks. My grandmother kept a ward, and nobody in it stayed in bed."\n\n"They're not well enough to move," Amara says. "I'm glad you sit with them, Tavi, I am. But your bay isn't clean, and I'm not putting a fever in among the greens."`,
  choices: [
    { label: 'Tavi\'s way: the lamps and the broth', test: { base: 55, mods: [trusts('nakamura', 8, 'Amara trusts you')] },
      ok: { text: 'The five sit in a row of chairs between the racks every morning, wrapped up, with a cup of broth each. Inside the month two are back on light work and the fever has gone. Amara comes up to see it, and stays to help with the pruning.',
        fx: F({ reg: { estrada: 5, nakamura: 3 }, bond: ['estrada', 'nakamura', 'friend', 'got the five out of bed'], extra: ['Two back on the roster', true] }) },
      bad: { text: 'The warmth does them good. The bay doesn\'t: the fever goes through all five by the end of the week, and the oldest is back in a bed for a month, worse than before. Tavi sits with them every evening until they\'re up.',
        fx: F({ reg: { nakamura: -3 }, nerve: { estrada: -4 } }) } },
    { label: 'The broth, but in the sick bay', info: [['people', 'Tavi, a little'], ['danger', 'The five, no quicker']],
      out: { text: 'Tavi carries the broth down every evening in a flask. The five are no quicker to mend, but they\'re cheerful about it, and so is Tavi.',
        fx: F({ reg: { estrada: 2, nakamura: 1 } }) } },
    { label: 'Amara\'s sick bay, Amara\'s rules', info: [['people', 'Amara'], ['danger', 'Tavi'], ['danger', 'The five, still in bed']],
      out: { text: 'The five stay where they are. Tavi still comes by at the end of every shift, empty-handed, and sits by the beds anyway.',
        fx: F({ reg: { nakamura: 4, estrada: -3 } }) } },
  ] });

S('help', 'nakamura', 'dahl', { id: 'soc.dressing', title: 'Field Dressing',
  text: (s, c) => `Amara wants to teach Kasimir's security detail to pack a wound and tie off a bleed: two shifts a month, off their rounds. "Somebody's going to get hurt in the spine one day, and it'll be your lot carrying them to me."\n\nKasimir has a long history with Amara's needle, from before the ship, and a scar through one eyebrow to show for it. "Two shifts off the rounds. Lovely. And who walks the cryo decks while they're learning knots?"`,
  choices: [
    { label: 'Amara\'s shifts', test: { base: 60, mods: [trusts('dahl', 8, 'Kasimir will do it for you'), sore('dahl', -8, 'Kasimir is cross with you')] },
      ok: { text: 'The detail learns it, grumbling, on each other\'s arms. Before the year is out one of them packs a gash in a rigger\'s thigh out in the spine, and the rigger walks into the sick bay on two feet. Kasimir tells it at supper as if the detail thought of it.',
        fx: F({ reg: { nakamura: 4, dahl: 2 }, native: { dahl: 3 }, bond: ['dahl', 'nakamura', 'friend', 'taught the detail to stitch'] }) },
      bad: { text: 'On the second shift, with half the detail in the sick bay, somebody gets into the dry stores and a whole pallet of rations walks off and is never seen again. Kasimir stands in the empty bay, says "Knots," as if it were a curse, and nothing else for a day.',
        fx: F({ nerve: { dahl: -2 }, kit: { food: -100 } }) } },
    { label: 'The rounds first. Amara teaches whoever comes in their own time', info: [['people', 'Kasimir'], ['danger', 'Amara']],
      out: { text: 'Four of the detail come to the sick bay on their rest days. Kasimir isn\'t one of them, and says so. Amara teaches the four anyway and tells you, twice, that four isn\'t enough.',
        fx: F({ reg: { dahl: 4, nakamura: -3 } }) } },
    { label: 'Kasimir first, alone, so the detail sees it', info: [['people', 'Both of them'], ['danger', 'Kasimir\'s pride']],
      out: { text: 'Kasimir sits at Amara\'s table for an evening being shown how to tie off an arm, and doesn\'t make a single joke. Halfway through Amara brings up the eyebrow and the night it was stitched, and Kasimir laughs out loud. The detail signs up the next morning.',
        fx: F({ reg: { dahl: 2, nakamura: 2 }, bond: ['dahl', 'nakamura', 'friend', 'taught the detail to stitch'] }) } },
  ] });

S('help', 'yurbin', 'kovacs', { id: 'soc.sap', title: 'Resin in the Seals',
  text: (s, c) => `The reactor's coolant seals are perishing faster than the manual says they should, and every new one Bashir fits comes out of the spares that have to last forty years. Gerad has been growing a resin off a fungus culture that sets like rubber in an hour.\n\n"It holds heat, it holds pressure, I've had it boiling for a week, Bashir, a week, and it doesn't care, it just sits there being rubber, do you know how rare that is in something that grew itself?"\n\nBashir turns a lump of it over in one big greasy hand. "You want to put mushroom glue in my reactor. In her. In the old girl."`,
  choices: [
    { label: 'Gerad\'s resin', test: { base: 52, mods: [trusts('kovacs', 8, 'Bashir trusts you')] },
      ok: { text: 'Bashir fits it in one seal, then in all of them, swearing the whole time. A month on they\'re tighter than the factory ones. "Don\'t tell Gerad I said so," Bashir tells you, and goes and tells Gerad.',
        fx: F({ reg: { yurbin: 4, kovacs: 2 }, bond: ['kovacs', 'yurbin', 'friend', 'sealed the reactor with resin'], kit: { parts: 3 } }) },
      bad: { text: 'It holds for nine days. On the tenth the heat turns it to glass and it cracks, and the reactor dumps coolant on the deck before Bashir can trip it. Bashir comes to supper with the cracked seal and puts it on Gerad\'s plate.',
        fx: F({ nerve: { kovacs: -3 }, bond: ['kovacs', 'yurbin', 'rival', 'over the reactor seals'], kit: { parts: -3 } }) } },
    { label: 'Bashir\'s way: new seals from the spares', info: [['yield', 'Seals that will hold'], ['danger', 'Two spare parts'], ['danger', 'Gerad']],
      out: { text: 'Bashir fits factory seals, one an evening, and they\'re fine. Gerad leaves the lump of resin on the workbench, where it sits for years as a paperweight.',
        fx: F({ reg: { kovacs: 4, yurbin: -3 }, kit: { parts: -2 } }) } },
    { label: 'Try it on the cold loop first, where a leak won\'t matter', info: [['people', 'Both of them, a little'], ['yield', 'A spare part, maybe']],
      out: { text: 'Bashir puts one seal of resin on the cold loop and checks it every morning. By the end of the month it has held, and Bashir goes on to the rest without being asked. Gerad acts as if it was never in doubt.',
        fx: F({ reg: { kovacs: 2, yurbin: 2 }, kit: { parts: 1 } }) } },
  ] });

S('help', 'dahl', 'estrada', { id: 'soc.stores', title: 'Short in the Stores',
  text: () => `Things are walking out of the stores Tavi keeps: a sack of seed one week, a coil of cable the next. Tavi has started sleeping in there, which isn't helping anything.\n\nKasimir has an idea, and is enjoying it. "Leave a sack of the good stuff out and dust the inside with dye, and whoever it is glows green for a week, and then we have a chat, and I'll be very civil about it."\n\n"Or," Tavi says, "we ask at supper. Whoever it is, they're hungry or they're frightened. Either way they'll come and say."`,
  choices: [
    { label: 'Kasimir\'s trap', test: { base: 55, mods: [trusts('estrada', 6, 'Tavi goes along with it for you')] },
      ok: { text: 'It takes four days. A young technician comes on shift with green hands and a story about a rail, and the seed is under a bunk, traded for cigarettes nobody should still have. Kasimir has the chat. Tavi sits in on it, and the technician ends up on Tavi\'s crew instead of in the brig.',
        fx: F({ reg: { dahl: 4, estrada: 2 }, bond: ['dahl', 'estrada', 'friend', 'caught the stores thief'], kit: { parts: 2 } }) },
      bad: { text: 'Half the bay crew handle the sack on the first morning, on honest business, and come up green to the elbow. The real thief never touches it. Tavi\'s crews don\'t speak to Kasimir\'s detail for a month.',
        fx: F({ reg: { estrada: -3 }, nerve: { dahl: -2 }, kit: { parts: -1 } }) } },
    { label: 'Tavi\'s way: ask at supper', info: [['people', 'Tavi'], ['danger', 'Kasimir\'s fun'], ['danger', 'A week of waiting']],
      out: { text: 'Nobody comes forward for a week. Then a young technician does, in tears, and the seed comes back. Kasimir calls it the least interesting solution in the history of the species.',
        fx: F({ reg: { estrada: 4, dahl: -3 } }) } },
    { label: 'Let it go. It\'s seed', info: [['danger', 'The stores'], ['danger', 'Both of them']],
      out: { text: 'Nothing is done. The sacks go on walking, a few at a time, for the rest of the year. Tavi counts them out loud at supper.',
        fx: F({ reg: { estrada: -3, dahl: -2 }, kit: { food: -60 } }) } },
  ] });

/* ================= year 5: the last watches before the cold ================= */
const steady = (a, b) => If(s => ((s.pro && s.pro.fx.mind[a]) || 0) > -3 && ((s.pro && s.pro.fx.mind[b]) || 0) > -3, 5, 'Both of them steady');

S('watch', 'dahl', 'kovacs', { id: 'soc.lights', title: 'Two on the Watch',
  text: (s, c) => `${WATCH(s, c)}\n\nKasimir is counting the amber lights on the cryo board. "Forty-one amber, and there were thirty-nine at the last change. So who've we lost, Bashir, and when exactly were you going to mention it?"\n\n"Nobody. Sensors. I'll get to them." Bashir passes a flask. "You count lights, I count bearings. Same job, really."`,
  choices: [
    { label: 'Ask what they\'ll miss about Earth', test: { base: 55, mods: [steady('dahl', 'kovacs'), trusts('dahl', 8, 'Kasimir trusts you')] },
      ok: { text: 'Kasimir had a dog, it turns out, a stupid one, and tells you every stupid thing it ever did. Bashir has a daughter who\'ll be sixty by the time anyone wakes. They\'re still talking when the relief comes, and Bashir leaves the flask with Kasimir.',
        fx: F({ reg: { dahl: 3, kovacs: 3 }, bond: ['dahl', 'kovacs', 'friend', 'stood the last watches together'] }) },
      bad: { text: 'Kasimir says nobody back home will remember they ever existed, and that it\'s better that way. Bashir gets up and goes to check a panel that doesn\'t need checking, and doesn\'t come back until the relief.',
        fx: F({ nerve: { dahl: -4, kovacs: -4 } }) } },
    { label: 'Ask Bashir straight how long the reactor has', info: [['people', 'Bashir'], ['danger', 'Kasimir\'s sleep']],
      out: { text: '"Forty-five years. Long enough, just, if I keep my hands on her." Bashir says it flat, like a weather report. Kasimir laughs a little too long and asks for the flask back.',
        fx: F({ reg: { kovacs: 5 }, nerve: { dahl: -2 } }) } },
    { label: 'Leave them the flask and take the far console', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You take the far console. When you look over they\'re arguing about something with real heat and enjoying it, and neither of them looks up.',
        fx: F({ bond: ['dahl', 'kovacs', 'friend', 'stood the last watches together'] }) } },
  ] });

S('watch', 'nakamura', 'solheim', { id: 'soc.count', title: 'Marit\'s Book',
  text: (s, c) => `${WATCH(s, c)}\n\nAmara has found Marit's notebook, the one nobody else sees. It has nine lines in it, one for every death since the burn: the pods that failed in the first year, the rigger crushed in the spine, each with a name. Marit is standing with a hand out for it.\n\n"The crew should hear it," Amara says. "Before we go under. All of it, out loud. They're not yours to carry, Marit."\n\n"Give it back," Marit says, very quietly.`,
  choices: [
    { label: 'Back Amara: read it out at the last supper', test: { base: 50, mods: [trusts('solheim', 10, 'Marit trusts you'), sore('solheim', -10, 'Marit is cross with you')] },
      ok: { text: 'Marit takes the notebook back, looks at it a long time, and says, "Last supper, then. I\'ll read it." At the last supper before the cold Marit does, all nine, without stopping. Half the ship is crying by the end of it, and Marit looks ten years lighter.',
        fx: F({ reg: { nakamura: 4, solheim: 3 }, bond: ['nakamura', 'solheim', 'friend', 'read the dead out together'] }) },
      bad: { text: 'Marit takes the notebook, puts it inside the flight jacket and leaves the flight deck without a word. The next morning there\'s a new lock on Marit\'s locker. Amara tells you you\'ve made it worse, and is probably right.',
        fx: F({ reg: { solheim: -5, nakamura: -2 }, nerve: { solheim: -4 } }) } },
    { label: 'Back Marit: it\'s Marit\'s to carry', info: [['people', 'Marit'], ['danger', 'Amara'], ['danger', 'What Marit carries']],
      out: { text: 'Amara hands it back. Marit puts it away and says "Thank you," to you, not to Amara. Amara doesn\'t speak to either of you for the rest of the watch.',
        fx: F({ reg: { solheim: 6, nakamura: -4 }, nerve: { solheim: -2 } }) } },
    { label: 'Ask Marit to read you one', test: { base: 60, mods: [trusts('solheim', 6, 'Marit trusts you')] },
      ok: { text: 'Marit opens it at the first page and reads one name. Amara knew them, as it turns out, and tells you about them. Then Marit reads another. By the relief they\'ve done all nine, and Marit is the one turning the pages.',
        fx: F({ reg: { solheim: 2 }, bond: ['nakamura', 'solheim', 'friend', 'read the dead out together'] }) },
      bad: { text: 'Marit reads them all, in order, flat, and then reads them again and doesn\'t stop when Amara asks. Neither of them looks at you when the relief comes.',
        fx: F({ nerve: { solheim: -4, nakamura: -4 } }) } },
  ] });

S('watch', 'yurbin', 'estrada', { id: 'soc.sky', title: 'The Big Window',
  text: (s, c) => `${WATCH(s, c)}\n\nGerad hasn't looked at the board once: the star chart in one hand, a pencil in the other, nose to the big window. Tavi is saying the night prayer, quietly, to the same stars.\n\n"There's a smudge there that isn't on the chart," Gerad says. "Not in the catalogue, not on last year's plate, nothing, it's just there, and I've been looking at it for an hour and I don't want to stop, isn't that wonderful?"\n\nTavi finishes the prayer before answering. "It's on somebody's chart. Just not yours."`,
  choices: [
    { label: 'Ask Gerad to show you', test: { base: 60, mods: [trusts('estrada', 6, 'Tavi trusts you')] },
      ok: { text: 'Gerad shows you a faint smear of light that moves against the stars, slowly, and says it\'s a comet nobody on Earth has seen yet. Tavi asks what to call it. They argue about it until the relief and settle on something neither of them will tell you.',
        fx: F({ reg: { yurbin: 3 }, native: { yurbin: 3 }, bond: ['yurbin', 'estrada', 'friend', 'named a comet together'] }) },
      bad: { text: 'Gerad gets going on how far the light has come and how long its star has been dead, and somewhere in it says there\'s nobody out here to hear a prayer. Tavi stops talking. Gerad doesn\'t notice for an hour, and then can\'t take it back.',
        fx: F({ reg: { estrada: -2 }, nerve: { estrada: -4 } }) } },
    { label: 'Ask Tavi to say one for the watch', info: [['people', 'Tavi'], ['danger', 'Gerad, kept waiting']],
      out: { text: 'Tavi says it again, louder, for the three of you and for the sleepers. Gerad stands with the chart folded, listening, and says amen in the wrong place.',
        fx: F({ reg: { estrada: 5 } }) } },
    { label: 'Leave them to the window', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You take your mug to the far console. When you look back they\'re sitting on the step under the window side by side, and Gerad is holding the chart so Tavi can see it.',
        fx: F({ bond: ['yurbin', 'estrada', 'friend', 'watched the window together'] }) } },
  ] });

S('watch', 'dahl', 'nakamura', { id: 'soc.scar', title: 'Stitches',
  text: (s, c) => `${WATCH(s, c)}\n\nAmara put Kasimir back together once, on the launch docks, and Kasimir has never said thank you. The scar through the eyebrow is from that night. Neither of them has mentioned it in four hours.\n\nKasimir is cleaning a sidearm that's already clean. Amara watches. "You'll wear the barrel through, Kasimir. Put it down and eat something."\n\n"Then I'll have a job tomorrow." Kasimir doesn't look up. "Lovely night for it."`,
  choices: [
    { label: 'Ask Kasimir about the scar', test: { base: 50, mods: [trusts('dahl', 10, 'Kasimir trusts you'), sore('dahl', -10, 'Kasimir is cross with you')] },
      ok: { text: 'Kasimir tells it badly, then Amara tells it properly: a riot on the cargo dock, a pipe wrench, nine stitches and Kasimir complaining through every one. By the end they\'re both laughing. At the relief Kasimir says "Thanks, doc," to nobody in particular.',
        fx: F({ reg: { dahl: 3 }, bond: ['dahl', 'nakamura', 'friend', 'laughed about the stitches'] }) },
      bad: { text: 'Kasimir says it\'s none of your business, then says something worse about Amara\'s sick bay that isn\'t true. Amara leaves the flight deck. Kasimir finishes the sidearm and starts it again.',
        fx: F({ reg: { dahl: -4 }, nerve: { dahl: -3, nakamura: -3 } }) } },
    { label: 'Stand the rest of Kasimir\'s watch yourself', info: [['people', 'Kasimir, a night\'s sleep'], ['danger', 'Your own night\'s sleep']],
      out: { text: 'Kasimir hands you the log and goes to bed without arguing, which says enough. Amara tells you Kasimir hasn\'t slept a whole night since the burn. You hadn\'t known.',
        fx: F({ reg: { nakamura: 3, dahl: 2 } }) } },
    { label: 'Leave them be', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You take your mug and go. Not much is said on the flight deck that night, but Amara is up there again the next night, off the roster, with two mugs.',
        fx: F({ bond: ['dahl', 'nakamura', 'friend', 'stood the last watches together'] }) } },
  ] });

S('watch', 'kovacs', 'estrada', { id: 'soc.stones', title: 'The Quiet Shift',
  text: (s, c) => `${WATCH(s, c)}\n\nTwo of the quietest people on the ship on one watch. They've been up here four hours and, by the log, said eleven words between them. They've scratched a board into a spare console panel and are playing a game with washers that nobody else understands.\n\nBashir moves a washer. Tavi looks at it for a long time, then moves another. "Hm," says Bashir.`,
  choices: [
    { label: 'Sit in and play the winner', test: { base: 50, mods: [] },
      ok: { text: 'You lose, twice, which is right. Bashir explains the rules after the second game, which takes one sentence. Tavi laughs at something you do with a washer, and you realise you\'ve never heard Tavi laugh.',
        fx: F({ reg: { kovacs: 4, estrada: 4 } }) },
      bad: { text: 'Somehow you win the first game. Bashir looks at the board for a long time and goes back to the console. Tavi puts the washers away. Nobody mentions a rematch.',
        fx: F({ reg: { kovacs: -3 }, nerve: { kovacs: -2 } }) } },
    { label: 'Ask what the colony will look like in twenty years', test: { base: 55, mods: [steady('kovacs', 'estrada')] },
      ok: { text: 'Tavi sees orchards, and a field you can\'t see the end of. Bashir sees a proper workshop with a roof that doesn\'t leak and a lathe that isn\'t held together with wire. It takes them an hour to say it, between moves, and you go to bed believing it.',
        fx: F({ reg: { kovacs: 2, estrada: 2 }, bond: ['kovacs', 'estrada', 'friend', 'stood the quiet shift together'] }) },
      bad: { text: '"Twenty years?" Bashir moves a washer. "The old girl won\'t last the trip." Tavi says nothing, which is worse, and the game goes on in a different kind of quiet.',
        fx: F({ nerve: { kovacs: -3, estrada: -3 } }) } },
    { label: 'Leave them the game', info: [['people', 'The two of them'], ['danger', 'Nothing in it for you']],
      out: { text: 'You leave them to it. In the morning the panel has a second game scratched beside the first, and a third, half done.',
        fx: F({ bond: ['kovacs', 'estrada', 'friend', 'stood the quiet shift together'] }) } },
  ] });

S('watch', 'solheim', 'yurbin', { id: 'soc.cold', title: 'The Last Night Up',
  text: (s, c) => `${WATCH(s, c)}\n\nGerad doesn't want to go under. "Forty years with the instruments running and nobody reading them, think what goes past us while we sleep, no, think what we're missing right now, let me stay up a year on the long-watch rota, two, and I'll go under after, I promise I'll go under."\n\nMarit hasn't looked away from the board. "Everyone goes under. That was the plan when you signed it, and it's the plan now."`,
  choices: [
    { label: 'Back Marit: everyone goes under', info: [['people', 'Marit'], ['danger', 'Gerad']],
      out: { text: 'Gerad goes under with everyone else the next month, last in the line, with a notebook held against the chest until the lid comes down. Marit signs the log and doesn\'t say anything about it.',
        fx: F({ reg: { solheim: 4, yurbin: -4 }, nerve: { yurbin: -2 } }) } },
    { label: 'Back Gerad: one more year up', test: { base: 50, mods: [trusts('solheim', 10, 'Marit will hear you out')] },
      ok: { text: 'Marit gives it a year and not a day more. Gerad fills four notebooks with things nobody alive has seen and goes under on the day, grinning, with the notebooks in the pod.',
        fx: F({ reg: { yurbin: 6, solheim: -2 }, native: { yurbin: 6 } }) },
      bad: { text: 'A year awake with a sleeping ship is a long time. By the end Gerad is talking to the instruments and sleeping under the big window, and has to be talked into the pod a day at a time.',
        fx: F({ reg: { yurbin: 3 }, nerve: { yurbin: -10 }, body: { yurbin: -4 } }) } },
    { label: 'Ask Gerad what it is really', test: { base: 55, mods: [trusts('yurbin', 8, 'Gerad trusts you')] },
      ok: { text: 'It takes a while. Gerad is afraid of the lid coming down and never coming up. Marit listens to all of it, then says, "So am I. Every time." They go under on the same day, side by side, and Marit holds Gerad\'s hand until the frost comes.',
        fx: F({ bond: ['solheim', 'yurbin', 'friend', 'went into the cold together'] }) },
      bad: { text: 'Gerad laughs it off, says it\'s the instruments and only the instruments, and talks about the instruments until the relief. You don\'t get any further, and neither does Marit.',
        fx: F({ nerve: { yurbin: -3 } }) } },
  ] });
})();

/* Landfall — thread: the Warrens. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). Lachlan, 2026-11-17: "Another colony that turned cannibal/feral/rabbits long ago. If they find
   the player colony they will either attack it and carry off people to eat, or try to slip in saboteurs they pretend just
   woke up off the ship." A bone ground past the wire, human, generations deep, with another ship's hull plate under it;
   a forager taken out of the furrow; a hollow hill with several hundred small quick people in it; then strangers at the
   gate in ship's coveralls, saying they are sleepers whose rack came down wide.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     raid    hunters. The colony is game, the ones carried off are eaten, and there are more of them every year. The
             ones at the gate are runaways from the hill. Right: destroy the hill (fire, the charges, the wall's rifles).
             Talking gets the envoys eaten, and bread brings more of them.
     inside  the raids are to learn the watches and get coveralls. The ones at the gate were drilled to pass, and will
             open it. Right: keep them out, pen them or put them out, or kill the teachers in the long gallery.
     kin     the colony of an earlier ship, who know it. They eat their own dead as a rite; the bone ground is their
             graveyard. The carried-off are alive (t.held): the rest of the roll, come at last. The ones at the gate are
             envoys. Right: bread and the manifest. Every drastic answer is an atrocity nobody needed.
     kept    a few families behind a squared door at the top of the hill rule the rest, eat first, and send the lower
             galleries out. Right: kill the few. Burning the hill kills their larder with them; terms are a tithe.
   Evidence (the midden, the tracks, the hill, the prisoner, the questions, the one who came back) is drawn per card and
   points at the truth only most of the time (pickK). It carries people off, eats the outer stores, costs labour to the
   wall, and writes unexplained, fear, siege, strangers, suspicion and grief. Nothing here knows any other thread. Every
   card's text reads only what setup put in ctx.
   Three options at most (Lachlan, 2026-11-21): the lies in the log, the snatch from the hill, the prisoner's and the hauler's
   night with the watch, the shooting and the hanging at the gate, the ward left open, the tithe and the price, the bonded
   children are no longer offered. What they set (t.lied, t.captive, t.tithe, t.paid, t.did.*) is still read below, for a game
   saved while one of them stood. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If } = h;
const ID = 'feral', T = s => LF.T(s, ID), SRC = 'th.feral', FIRST = 'Theseus';
const KINDS = ['raid', 'inside', 'kin', 'kept'];
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); if (n < 20) return ONES[n]; if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + num(n % 100) : ''); return String(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const is = (s, k) => T(s).truth.is === k;

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  midden: {
    raid: 'Animal bone and human bone lie in the same layers, cut the same way, from the bottom of the trench to the top. Whoever filled it has made no difference between the two for as long as it has been filling.',
    inside: 'The top layer holds things that were kept and not eaten: a wrist tag filed smooth, a comb, coverall buttons sorted by size into a tin. Somebody out there has been studying how colonists dress.',
    kin: 'Every skull is set facing the same way with a stone in the mouth, and the split bones are laid back in order. None carries a wound that killed. These people died first, and were buried with care by whoever ate them.',
    kept: 'The bones sort into two kinds. Most are small, worked hard and dead young. A few are tall and old, and those were never split: each lies whole in a cut niche with a tab of hull alloy on the breastbone.' },
  tracks: {
    raid: 'The drag ends at a flat stone on the high ground, where the load was divided. What left the stone went off in six directions.',
    inside: 'Before the prints go to the field they circle the wire twice, and stand a long while opposite the gate, the pump house and the stores. Whoever took the forager looked the colony over first.',
    kin: 'Past the first rise the drag stops and two sets of boot heels begin among the bare prints. The forager walked from there, between two of them, with a third going ahead.',
    kept: 'Beside the dozen small bare prints goes one pair of sandals cut from hull gasket, long in the stride, well apart from the rest. Where the small prints bunch together, the sandals stop and turn to face them.' },
  warren: {
    raid: 'Nothing is planted on the hill, no fire is kept in and no path is mended. Carcasses hang at the mouths, and some of them are not animals. At dusk the whole hill empties in every direction at a run.',
    inside: 'On a cleared floor below the hill a line of them is being drilled. Each walks upright to a frame of poles the width of the colony gate and says something to a figure standing in it. The ones who get it wrong go to the back of the line.',
    kin: 'There are terraces cut and planted, and a cistern. At one mouth a hull plate stands on end, scored in rows, and somebody keeps it clean. At dusk they gather in front of it and one of them speaks to the plate for a long time.',
    kept: 'The low mouths are bare holes and the people at them are thin. One mouth at the top is squared with hull frames and has a door. Food goes up the hill to it all day, on the backs of people who are not let in.' },
  speech: {
    raid: 'The prisoner has a few dozen words, and they are for food, number and direction. There is no question about the others on the hill and no word for any of them. The prisoner watches the hands of whoever brings the bowl, and nothing else in the room.',
    inside: 'The prisoner speaks the ship\'s language and takes pains to hide it, until tired. Then comes a question, in an accent nearer the mess hall\'s than eight generations alone should have left it: how many stand on the wall at night.',
    kin: 'The prisoner speaks an old form of the ship\'s language, slowly, as if reciting: a name, then a mother\'s name, then seven more going back, and after the last a berth number. Then a question: whether the dead here are kept, or thrown away.',
    kept: 'The prisoner can speak and is afraid to. Each time the door opens it is the same few words: that the share was carried, that it is somebody else\'s turn. Asked whose turn, and who decides, the prisoner looks at the roof.' },
  ask: {
    raid: 'They have the ship wrong the way people do who were only told about one: decks piled like a hill, a cook fire. Asked where they were before the cold, one of them answers.\n\n[[x39]] "The holes."\n\nAfter that all of them stop talking. None has asked a single question about the wall.',
    inside: 'They have the large things right and the small ones wrong: the right bank letter, the right captain, a berth number that exists. None can say what the cold tastes like coming out of it. One of them spends the questions counting the rifles in the rack, loses count, and begins again.',
    kin: `They know things nobody on the ${LF.SHIP} taught them: a muster call word for word, in a form two centuries old, and the name of a ship that is not this one. They ask, carefully, whether this is the second ship, and whether it brought the rest of the roll.`,
    kept: 'They know nothing about any ship and give up pretending within the hour. What they want to know is whether anyone here is made to carry food uphill, and who eats first. Told that the top table eats what the crews eat, the youngest laughs and looks at the door.' },
  ours: {
    raid: 'The hauler is cut about the legs and got out through a drain while the hill was busy with the others. The hauler saw what was done with the others, and says that much, once, and does not sleep.',
    inside: 'The hauler is unhurt and was fed, and was walked back to within sight of the wire. For the whole time there were questions: the watches, the doors, where the stores are, who gives orders. The hauler answered some of them.',
    kin: 'The hauler is unhurt and was fed from the same pot as the hill. Somebody old read marks off a metal plate and asked, over and over, for a berth and a mother\'s name. The others are in a room with a door, the hauler says, and it is not locked.',
    kept: 'The hauler was kept in a pit with forty of the hill\'s own people and fed twice a day, better than they were. Now and then someone tall came down from the top of the hill with a rope and chose. It was the people in the pit who lifted the hauler over the edge.' },
};
const ev = (kind, k) => EV[kind][k];
const LEAN = { raid: 'hunters who will not stop', inside: 'people getting ready to come through the gate', kin: 'people who can be spoken to', kept: 'a few who drive the rest' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what the people of the hill want.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. wv, dv: the first name of the
   Security or Medical officer if one is at the post to say a line, else null. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}; for (const [k, role] of [['w', 'security'], ['d', 'physician'], ['sc', 'xenobio'], ['e', 'engineer'], ['q', 'quartermaster'], ['cm', 'command']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  o.wv = voice(s, 'security'); o.dv = voice(s, 'doctor'); o.cover = LF.lex(s, 'cover'); o.top = LF.lex(s, 'top'); o.burnt = LF.lex(s, 'burnt'); return o; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const inn = t => t.in > 0 && !t.penned;                  // the ones from the gate are loose inside the wire
const gone = t => !!(t.burned || t.sealed);              // the hill is finished
const die = (s, t, n) => { const b = s.pop; LF.deaths(s, n); t.toll += b - s.pop; return b - s.pop; };
/* Carried off. Under 'kin' they are alive in the hill (t.held) and may come home. */
function take(s, t, n) { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 14))); const k = b - s.pop; t.taken += k; t.toll += k; t.lastTake = s.day; if (t.truth.is === 'kin') t.held += k; return k; }
function comeHome(s, t, share) { const k = Math.round(t.held * share); s.pop += k; s.deaths = Math.max(0, s.deaths - k); t.toll = Math.max(0, t.toll - k); t.came = k; t.held = 0; }
/* The ones from the gate leave the colony's count (they were only ever in it if they had bunks). */
const outFx = c => c.inpop ? { leave: c.k } : {};
const hate = (s, v) => { const t = T(s); t.hate = Math.max(0, t.hate + v); };

function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^fer\./.test(e.id)); s.sched.push({ id: 'fer.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
/* The night nothing was done to prevent: they come in their hundreds. */
function night(s, t, share) { if (LF.has(s, 'watch')) share *= 0.75; const n = clamp(Math.round(s.pop * share), 3, 14); t.night = take(s, t, n); s.res.food = Math.max(0, Math.round(s.res.food * 0.85)); s.morale = clamp(s.morale - 6, 0, 100);
  LF.log(s, `They came over the wire in their hundreds on a night with no moon. ${Num(t.night)} colonists were carried off before the wall could be held.`, 'bad'); }
/* inside: the gate was opened by people who had bunks. */
function opened(s, t, share) { const n = clamp(Math.round(s.pop * 0.16 * share), 4, 14); t.night = take(s, t, n); s.res.food = Math.max(0, Math.round(s.res.food * (1 - 0.3 * share))); s.pop = Math.max(0, s.pop - Math.min(t.in, t.inpop || 0)); t.in = 0; s.morale = clamp(s.morale - 8, 0, 100);
  LF.log(s, `The gate was unbarred from inside in the dead of night, by the ones who had come to it in coveralls. ${Num(t.night)} colonists were carried off, and the stores were stripped.`, 'bad');
  finish(s, t, 'opened', 'The gate was opened from inside by people the colony had given bunks to.'); }
/* Nobody ends it with one card: it ends when the season does, by what was done. */
function resolve(s, t) {
  const k = t.truth.is;
  if (k === 'inside' && inn(t) && !t.deck) return opened(s, t, gone(t) || t.fired ? 0.5 : t.scouted ? 1.2 : 1);
  if (t.sealed) { t.held = 0; return finish(s, t, 'sealed', 'The mouths of the hill were blown shut, with whatever was in it.'); }
  if (k === 'raid') { if (t.burned || t.fired) return finish(s, t, 'broken', 'The warrens were destroyed, and nothing has come over the wire since.');
    night(s, t, (t.stood || t.gangs ? 0.08 : 0.13) * (t.fedGate || t.gift ? 1.25 : 1)); return finish(s, t, 'overrun', 'The people of the hill came over the wire in their hundreds.'); }
  if (k === 'inside') { if (t.burned || t.fired) return finish(s, t, 'broken', 'The warrens were destroyed before the gate could be opened to them.');
    die(s, t, 2); LF.log(s, 'They came to the gate on a night with no moon and waited at it. Nobody unbarred it. Two of the wall died holding the wire, and by morning the field was empty.', 'bad');
    return finish(s, t, 'purged', 'The people of the hill came to a gate that nobody opened for them.'); }
  if (k === 'kin') { if (t.burned) { t.held = 0; return finish(s, t, 'wronged', 'The colony burned the hill, and learned afterwards who had lived in it.'); }
    if (t.fired || t.keeper || t.hate >= 6) { comeHome(s, t, 0.6); return finish(s, t, 'wronged', 'The people of the hill went away over the high ground, and the colony learned afterwards who they had been.'); }
    if (t.terms || t.fedGate || t.warm >= 2) { comeHome(s, t, 1); LF.emit(s, 'hope', SRC, 40, 200, 'the ones carried off came home alive'); return finish(s, t, 'kin', `The colony stood at the plate of the ${FIRST} and heard its dead read.`); }
    comeHome(s, t, 0.8); return finish(s, t, 'parted', 'The people of the hill sent the colony\'s own home, and went away over the high ground.'); }
  if (t.deck) return finish(s, t, 'freed', 'The few who ruled the hill were killed, and the rest came down to the wire with empty hands.');
  if (t.burned) return finish(s, t, 'wronged', 'The colony burned the hill, and learned afterwards who had lived in it.');
  if (t.fired) return finish(s, t, 'culled', 'The wall emptied the field, and the door at the top of the hill stayed shut.');
  night(s, t, (t.stood || t.gangs ? 0.08 : 0.13) * (t.fedGate || t.priced ? 1.25 : 1)); finish(s, t, 'overrun', 'The people of the hill came over the wire in their hundreds.');
}
const TAKEN = ['A field hand did not come in from the far furrow at dusk. There were small bare prints all round the place.', 'A child went to the wire after a ball and was not at supper. The watch found the ball.', 'Two haulers went out to the wood pile and one came back, at a run.', 'The night-soil cart was found on its side past the gate, with the mule cut loose and nobody near it.'];
/* Once a month from the day the hill is found, while it stands. */
function month(s, t) {
  const k = t.truth.is, late = ['gate', 'choice', 'bill'].includes(t.phase), cowed = t.cowed && s.day < t.cowed;
  const loss = late ? 20 : 10; s.res.food = Math.max(0, s.res.food - loss); t.ate += loss;   // the outer stores, whoever they are
  if (t.tithe) { if (take(s, t, 1)) { t.given++; LF.log(s, 'One more was walked to the flat stone at dusk and left on the line. The line was empty in the morning.', 'bad'); } return; }
  // The fields and the bunk rows: much the same climb whatever they want, so the number alone says little.
  let p = (late ? 0.42 : 0.28) * { raid: 1.2, kept: 1, inside: 0.7, kin: 0.9 }[k] * (t.infield ? 0.7 : 1) * (t.gangs ? 0.7 : 1) * (t.lied ? 1.3 : 1) * (cowed ? 0.3 : 1) * (P(s, 'security') ? 1 : 1.25) * (t.gift && k === 'raid' ? 1.2 : 1) * (s.flags.stone_fed && s.day - s.flags.stone_fed < 120 ? 0.4 : 1);   // the colony's dead are going up to the flat stone (a tangle's flag, not another thread)
  if (k === 'kin' && (t.held >= 7 || t.terms)) p = 0;
  if (s.pop > 16 && LF.srand(s) < p && take(s, t, 1 + (late && LF.srand(s) < 0.3 ? 1 : 0))) { LF.log(s, LF.spick(s, TAKEN), 'bad'); LF.emit(s, 'grief', 'fer.taken', 25, 60, 'people are carried off from the fields and nobody finds them'); }
  // inside: the ones with bunks earn their keep for the hill.
  if (k === 'inside' && inn(t) && LF.srand(s) < 0.4) { s.res.food = Math.max(0, s.res.food - 30); t.sab++; s.signs.push({ id: 'damage', d: s.day, src: SRC });
    LF.log(s, LF.spick(s, ['The seals on two grain bins were cut in the night, from inside the store.', 'The bar of the east gate was found lifted out of one bracket this morning. The watch swears it was set.', 'A lamp on the wall was out for an hour last night. Its wick had been pinched, and its keeper was asleep beside a bowl that the galley had not sent up.']), 'bad'); }
  if (t.in > 0 && !t.guide && s.used['fer.ask'] !== undefined && LF.srand(s) < 0.5) { t.guide = s.day; LF.log(s, 'The ones who came through the gate have drawn the watch a plan of the hill on a mess table, gallery by gallery.'); }
}

LF.thread({ id: ID, name: 'The Warrens', view: 'world', dread: true,
  clue: (s, t) => ({ txt: 'A tally of people on the last pages, a stroke for each, and under it a second tally headed THEM that was begun again three times on a larger sheet.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'the bone ground' : 'the people of the hill',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What do the people of the hill want with the colony?',
  chap: {
    broken: t => t.truth.is === 'inside' ? 'The people of the hill were getting ready to come through the gate. The colony destroyed them first.' : 'The people of the hill hunted the colony, and would not have stopped. The colony destroyed them.',
    purged: t => 'The people of the hill sent their own to the gate in coveralls. The colony did not let them open it.',
    opened: t => 'The colony gave bunks to strangers in ship\'s coveralls, and they opened the gate to the hill.',
    overrun: t => t.truth.is === 'kept' ? 'A few families ruled the hill and sent the rest of it over the wire. Nothing was done about them in time.' : 'The people of the hill hunted the colony, and nothing was done to end it before they came in their hundreds.',
    kin: t => `The people of the hill were the colony of the ${FIRST}, eight generations on. The two colonies read their dead to each other.`,
    parted: t => `The people of the hill were the colony of the ${FIRST}. They sent the colony's own home and went away.`,
    wronged: t => t.truth.is === 'kept' ? 'A few families ruled the hill and fed on the rest. The colony burned all of them together.' : `The people of the hill were the colony of the ${FIRST}, and had kept the colony's own alive. The colony ${t.burned ? 'burned them out' : 'drove them off with rifles'}.`,
    freed: t => 'A few families ruled the hill and fed on the rest. The colony killed the few, and the rest came down as people.',
    culled: t => 'A few families ruled the hill and sent the rest to the wire. The wall shot the ones who were sent.',
    sealed: t => 'The colony blew the hill shut on everyone in it. It never learned who they were.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, n: LF.sri(s, 32, 48) * 10, k: LF.sri(s, 3, 5),
    taken: 0, held: 0, toll: 0, ate: 0, in: 0, inpop: 0, hate: 0, warm: 0, sab: 0, given: 0, thin: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'sign'); s.signs.push({ id: 'tracks', d: s.day, src: SRC }); LF.cue(s, 'fer.midden', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    if (t.phase === 'sign') { if (since('fer.midden') >= 10 && once('gone', 'fer.gone')) { take(s, t, 1); s.signs.push({ id: 'missing', d: s.day, src: SRC }); }
      if (since('fer.gone') >= 12 || since('fer.midden') >= 40 || age >= 70) { LF.phase(s, ID, 'found', 'The colony found the hill that had been taking its people.'); LF.cue(s, 'fer.warren', 0, 4); } }
    else if (t.phase === 'found') { if (since('fer.warren') >= 10) once('caught', 'fer.caught');
      if ((since('fer.warren') >= 30 && (since('fer.caught') >= 8 || since('fer.warren') >= 50)) || age >= 100) { LF.phase(s, ID, 'gate'); LF.cue(s, 'fer.woke', 0, 4); s.tension = clamp(s.tension + 6, 0, 100); } }
    else if (t.phase === 'gate') { if (since('fer.woke') >= 10 && t.in > 0) once('ask', 'fer.ask'); if (since('fer.woke') >= 22) once('raid', 'fer.raid'); if (since('fer.raid') >= 12) once('ours', 'fer.ours');
      if ((since('fer.raid') >= 30 && (since('fer.ours') >= 8 || since('fer.raid') >= 50)) || age >= 130) { LF.phase(s, ID, 'choice'); jump(s, 'fer.choice', 20); } }
    else if (t.phase === 'choice' && (since('fer.choice') >= 20 || age >= 60)) { LF.phase(s, ID, 'bill'); t.billId = gone(t) ? 'fer.young' : 'fer.lean'; jump(s, t.billId, 20); }
    else if (t.phase === 'bill' && (since(t.billId) >= 22 || age >= 70)) return resolve(s, t);
    if (s.day % 10 === 0 && t.phase !== 'sign' && !gone(t)) month(s, t);
    if (s.day % 5 === 0) { const late = ['gate', 'choice', 'bill'].includes(t.phase), calm = (t.cowed && s.day < t.cowed ? 10 : 0) + (t.tithe ? 12 : 0) + (gone(t) ? 25 : 0);
      if (t.phase === 'sign') LF.emit(s, 'unexplained', SRC, 35, 8, 'there is a pit of human bone past the wire, and it is not the colony\'s');
      else { LF.emit(s, 'fear', SRC, (late ? 42 : 28) - calm, 8, 'the people of the hill carry colonists off and nobody finds them');
        if (!gone(t)) LF.emit(s, late ? 'siege' : 'watched', SRC, late ? 36 - calm : 30, 8, late ? 'nobody works past the wire without rifles' : 'several hundred people in a hill know where the colony is'); }
      if (t.in > 0) { LF.emit(s, 'strangers', SRC, t.penned ? 25 : 35, 8, 'people nobody knows came to the gate in the colony\'s coveralls');
        if (!t.vouched) LF.emit(s, 'suspicion', SRC, 30, 8, 'nobody can say whether the ones from the gate ever slept aboard the ship'); }
      if (t.penned) LF.emit(s, 'confinement', SRC, 25, 8, 'people who say they are sleepers are locked in the long store'); }
  },
  /* The wall is doubled, the outer field is worked under rifles or not at all, and every measure is paid for in hands. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent' || t.phase === 'sign') { if (t.infield && !t.end) P.yield -= 0.04; return; }
    let d = { found: 0.015, gate: 0.035, choice: 0.035, bill: 0.03 }[t.phase] || 0;
    if (t.infield) { d += 0.01; P.yield -= 0.04; } if (t.gangs) d += 0.015; if (t.penned) d += 0.01; if (t.tithe) d *= 0.4; if (gone(t)) d = 0.01;
    P.labor -= d; if (t.phase !== 'found' && !t.tithe && !gone(t)) P.morale -= 0.015; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people', chain: true }, st));

/* ======================= SIGN: the bone ground, and the first one taken ======================= */
B('sign', { id: 'fer.midden', view: 'world', tone: 'pressure', title: 'The Bone Ground',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)) }),
  text: (s, c) => `A forage crew has come in early and will not go back out. Past the wire, where ${c.cover} thins, the ground has been dug and filled over a long stretch, and what fills it is bone. ${c.D} has gone through a sackful. All of it is human, split lengthwise and scraped, and the deepest has been in the ground for generations.\n\nUnder the bone there is hull plate. The registry stamped into it is not the ${LF.SHIP}'s.${c.wv ? `\n\n[[security]] "So we're not the first ship down here, which is lovely, and nobody thought to mention it." "And whoever's in that ditch didn't die of old age, so I'd like to know who ate the first lot before anyone digs there again."` : ''}`,
  choices: [
    { label: 'Cut a trench through it and read it layer by layer', note: 'The survey team spends the month in a pit of human bone, and the crews know what is in it by the first evening.', test: { base: 50, mods: [R('xenobio', 10), R('physician', 5)] },
      ok: { text: (s, c) => `${c.Sc} cuts a trench to the bottom and reads the face of it. ${ev('midden', c.ev)} The plate is from a colony ship of an older class than the ${LF.SHIP}, and it was cut up with hand tools.`, fx: (s, c) => ({ morale: -1, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: (s, c) => `The trench shows that the ground was turned over more than once by whoever dug here last, and the layers say nothing in order. ${c.Sc} counts four hundred skulls and stops. The forage crew has heard the number by supper.`, fx: s => ({ morale: -2, do: s2 => learn(s2, T(s2), 6) }) } },
    { label: 'Pull the outer field in to the wire, and forbid the ground beyond it', note: 'The colony loses its forage and a part of the harvest, and is told why.',
      out: { text: 'The outer field is given up with the crop standing in it. The wire is walked at dusk and dawn, and the galley does without the forage.',
        fx: s => ({ food: -40, morale: -2, do: s2 => { const t = T(s2); t.infield = s2.day; LF.emit(s2, 'fear', 'fer.infield', 25, 100, 'the ground past the wire is forbidden on account of a pit of human bone'); } }) } },
    { label: 'Cut the hull plate up for the yard, and leave the bone where it lies', dark: true, note: 'The yard gets good alloy, and the one thing in that pit with writing on it goes into the furnace.', info: [['yield', 'Materials'], ['danger', 'Whoever the plate belonged to']],
      out: { text: (s, c) => `${c.E} has the plate out in a month, eleven sheets of it, scored on one face with rows of small cuts that nobody stops to copy. It makes good roofing. The bone is left open to the weather.`,
        fx: s => ({ mat: 25, stain: ['fer_plate', 1], do: s2 => { const t = T(s2); t.did.plate = true; if (t.truth.is === 'kin') hate(s2, 2); } }) } },
  ] });

B(['sign', 'found'], { id: 'fer.gone', view: 'world', tone: 'pressure', title: 'Out of the Furrow',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)) }),
  text: (s, c) => `A forager did not come in from the outer field at dusk. The hoe is in the furrow with the water bottle beside it. A drag mark leads off from the place, and on both sides of it are the prints of bare feet in the ${c.top}: human, and most of them no longer than a hand.\n\n${c.W} has doubled the wall and wants an order before the light goes. The forager's crew is at the gate with tools in its hands.`,
  choices: [
    { label: 'Send the watch along the drag marks at first light', note: 'Six rifles go out of sight of the wall after people who took a grown adult without a sound.', test: { base: 50, mods: [R('security', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The watch follows it to the high ground and is back by dark. ${ev('tracks', c.ev)} Beyond that the trail goes up into a hill that is full of holes, and ${c.w} did not take six rifles into it.`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The trail is lost on hard ground by noon. On the way back the watch is one short: the rear marker, who was there at the last halt and was not there at the next.', fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); t.taken++; t.toll++; if (t.truth.is === 'kin') t.held++; learn(s2, t, 6); } }) } },
    { label: (s, c) => `Set somebody off the punishment detail to hoe that furrow at dusk, with rifles lying up in ${c.cover}`, dark: true, note: 'One person is put out to be taken, and the watch gets a clear shot at whatever comes for them.', info: [['yield', 'A look at them'], ['danger', 'The one in the furrow']],
      out: { text: (s, c) => `A hauler hoes the same furrow at dusk for the month, with a line on one ankle. On a night with no moon they come, low and quick, eight or nine of them. The watch drops two. The line is cut with somebody's knife, and the hauler goes with the rest. The two on the ground are human in every particular, small, scarred, and wearing nothing the colony made.`,
        fx: s => ({ pop: -1, stain: ['fer_bait', 2], do: s2 => { const t = T(s2); t.taken++; t.toll++; if (t.truth.is === 'kin') t.held++; t.did.bait = true; t.thin += 2; hate(s2, 1); learn(s2, t, 10); } }) } },
    { label: 'Arm the field crews, and work the outer field in gangs of ten', note: 'Every field hand carries a weapon nobody trained them with, and the field is worked at the pace of the slowest gang.',
      out: { text: 'Pry bars, cut-down pipe and four spare rifles go out with the gangs each morning. The work is slow. Before the month is out a field hand is shot through the thigh at dusk by a neighbour who heard something in the next row.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.gangs = s2.day; } }) } },
  ] });

/* ======================= FOUND: the hill ======================= */
B('found', { id: 'fer.warren', view: 'world', tone: 'pressure', title: 'The Hill',
  setup: s => { const t = T(s); return Object.assign(crew(s), { n: t.n, ev: pickK(s, t) }); },
  text: (s, c) => `The hill is half a day past the wire, and it is hollow. ${c.W} counted mouths until the light went: more than two hundred holes, cut by hand, some of them shored with spars of hull frame. At dusk people came out of them. They are human, small and quick, and a great many of them are children. The count stopped at ${num(c.n)} and was not finished.\n\nThe bone ground and the prints in the field are theirs. They have been on this world for generations, and they know where the colony is.`,
  choices: [
    { label: 'Put two watchers in a hide above the hill for the month', note: 'Two people lie up within a stone\'s throw of several hundred, with no help nearer than the wall.', test: { base: 50, mods: [R('security', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The two lie up for the month and come back thin and unseen. ${ev('warren', c.ev)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: 'The hide is found in the first half of the month. One watcher comes in over the wire at a run, without rifle or pack. The other was a pace behind at the foot of the hill and then was not.', fx: s => ({ pop: -1, morale: -1, do: s2 => { const t = T(s2); t.taken++; t.toll++; if (t.truth.is === 'kin') t.held++; learn(s2, t, 8); } }) } },
    { label: 'Light smudge fires in the nearest mouths tonight, and shoot what comes out', dark: true, note: 'It thins them before they have decided anything about the colony, and it is done to people in their sleep.', info: [['yield', 'Fewer of them near the wire'], ['danger', 'Everyone in the nearest holes']],
      out: { text: (s, c) => `Wet ${c.cover === 'the snow' ? 'bedding' : 'brush'} and engine oil go into nine mouths on the near side, and the watch waits at each with a lamp. About thirty come out, of all sizes, and are shot as they come. Nothing comes near the wire for the rest of the month.`,
        fx: s => ({ tension: -4, stain: ['fer_smoked', 3], do: s2 => { const t = T(s2); t.smoked = s2.day; t.did.smoked = true; t.thin += 30; t.cowed = s2.day + 40; hate(s2, 2); } }) } },
    { label: 'Leave a cart of flour at the foot of the hill, and come away', note: 'It comes out of the stores, and it tells several hundred hungry people that the colony has food to spare.',
      out: { text: 'The cart is left at the foot of the hill at noon. In the morning it is empty, swept, and set back on its wheels facing the colony.',
        fx: s => ({ food: -50, do: s2 => { const t = T(s2); t.gift = s2.day; t.warm++; hate(s2, -1); } }) } },
  ] });

B(['found', 'gate'], { id: 'fer.caught', tone: 'pressure', title: 'The One in the Pump House',
  setup: s => { const t = T(s); return Object.assign(crew(s), { taken: !!t.captive, ev: pickK(s, t) }); },   // t.captive: only a game saved before the three-option pass has it
  text: (s, c) => `${c.taken ? 'The one the watch brought back' : 'The watch caught one inside the wire last night, with both arms in a seed bin. The prisoner'} is on a chain in the pump house: a grown adult the size of a twelve-year-old, scarred, lousy, and human by every measure ${c.d} has. The prisoner has not spoken and has not looked away from the door.\n\nHalf the colony has found a reason to walk past the pump house today.${c.dv ? `\n\n[[physician]] "That's a person on that chain, and they're watching the door because they think whoever comes through it is going to hurt them." "Look at the hands before anyone starts, because that's somebody's grandchild, off a ship like ours."` : ''}`,
  choices: [
    { label: 'Have the clinic sit with the prisoner for the month, with food and without the chain', note: 'The clinic runs short-handed for the month, and one bolt for the door ends it.', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${cap(LF.sentName(s, 'physician'))} sits on the pump house floor through the month with a bowl and a slate. ${ev('speech', c.ev)}`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 26, c.ev) }) },
      bad: { text: (s, c) => `The prisoner eats, sleeps under the pump, and says nothing. Near the end of the month the door is left on the latch for the length of a meal. The prisoner goes over the wire with a blanket and a kitchen knife.`, fx: s => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 6); if (t.truth.is === 'inside') t.scouted = true; } }) } },
    { label: 'Hang the prisoner at the outer post, where the hill can see', dark: true, note: 'It is a warning anybody can read, given to people who may have been owed something else.', info: [['yield', 'Nothing near the wire for a while'], ['danger', 'The prisoner']],
      out: { text: 'It is done at the outer post at noon, and the body is left up. For the rest of the month nothing comes near the wire, and the field crews work as far as the last furrow.',
        fx: s => ({ morale: 2, tension: -6, stain: ['fer_hanged', 2], do: s2 => { const t = T(s2); t.did.hanged = true; t.cowed = s2.day + 40; hate(s2, 2); } }) } },
    { label: 'Feed the prisoner, strike the chain and open the gate', note: 'Whatever the prisoner saw of the wall, the stores and the watch goes back up the hill.',
      out: { text: 'The prisoner goes through the gate at a walk, looks back once from the last furrow, and runs. The watch says what it thinks of the order at supper, loudly.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.did.freed = true; t.warm++; hate(s2, -1); if (t.truth.is === 'inside') t.scouted = true; } }) } },
  ] });

/* ======================= GATE: the ones who say they slept aboard ======================= */
B('gate', { id: 'fer.woke', tone: 'crisis', title: 'Sleepers at the Gate',
  setup: s => { const t = T(s); return Object.assign(crew(s), { k: t.k, taken: Math.max(1, t.taken) }); },
  text: (s, c) => `${Num(c.k)} people walked up to the gate at first light in ship's coveralls. They say they are sleepers: that their rack came down wide of the pad in the first descent, that they thawed alone, and that they have been walking toward the smoke ever since. They are thin and ${c.burnt}, and two of them are crying.\n\nNobody on the wall knows a face. The manifest lists racks that were never recovered. The coveralls are the right issue, and ${c.w} points out that ${num(c.taken)} of the colony's people have gone into that hill wearing the same.`,
  choices: [
    { label: 'Open the gate and give them bunks', note: 'If they are sleepers they have walked a long way to get here. If they are something else, it sleeps inside the wire tonight.',
      out: { text: (s, c) => `They are fed at the long table with the hall watching. They eat with both hands, and sleep that night in a heap on one bunk with the blankets of the other ${num(c.k - 1)} pulled over them.`,
        fx: (s, c) => ({ pop: c.k, do: s2 => { const t = T(s2); t.in = c.k; t.inpop = c.k; t.did.admitted = true; } }) } },
    { label: 'Bring them in, and hold them in the long store until somebody can vouch for them', note: 'People who may be the colony\'s own are locked up on the day they reach it, and their guard comes off the wall.',
      out: { text: 'They go into the long store without complaint, are given blankets and a bucket, and thank the guard for the bowl. The guard asks to be moved to other duty.',
        fx: (s, c) => ({ food: -20, do: s2 => { const t = T(s2); t.in = c.k; t.inpop = 0; t.penned = s2.day; t.did.penned = true; } }) } },
    { label: 'Keep the gate shut', dark: true, note: 'If they are sleepers, the colony is sending its own back out to whoever dug the bone ground.', info: (s, c) => [['yield', 'Nobody unknown inside'], ['danger', `The ${num(c.k)} at the gate`]],
      out: { text: 'The gate stays barred. They stand at it until dusk, calling up the names of decks and banks. In the morning they are gone, and the ground where they stood is covered in small bare prints.',
        fx: s => ({ morale: -2, stain: ['fer_turned', 2], do: s2 => { const t = T(s2); t.did.turned = true; if (t.truth.is === 'kin') hate(s2, 1); } }) } },
  ] });

B(['gate', 'choice'], { id: 'fer.ask', tone: 'pressure', title: 'What the Cold Tastes Like',
  when: (s, t) => t.in > 0,
  setup: s => { const t = T(s); return Object.assign(crew(s), { k: t.in, inpop: t.inpop > 0, penned: !!t.penned, ev: pickK(s, t, 0.1), lean: lean(t) }); },
  text: (s, c) => `The ${num(c.k)} from the gate ${c.penned ? 'are still in the long store' : 'have bunks and a work crew'}. Small things are said about them: one did not know how to work a tap, and another called the lander by a word nobody uses. Sleepers thaw confused, ${c.d} says, and some stay that way for a year.\n\n${c.E} has a different test. There are things about the ${LF.SHIP} that nobody could be told and nobody who slept aboard forgets: the colour of the light in the banks, the sound the racks make, what the cold tastes like coming up out of it. ${c.lean}`,
  choices: [
    { label: 'Question them one at a time about the ship', note: 'If they are sleepers, they learn on their first month down that the colony thinks they are something from the hill.', test: { base: 50, mods: [R('engineer', 10), R('physician', 5)] },
      ok: { text: (s, c) => `It takes the month, a few questions at a time. ${ev('ask', c.ev)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 30, c.ev); t.did.asked = true; } }) },
      bad: { text: 'They have been together since the gate and have one story between them, and it holds. The questions prove nothing. The bunkhouse hears that they were asked and makes up its own mind.', fx: s => ({ morale: -1, do: s2 => { learn(s2, T(s2), 8); LF.emit(s2, 'suspicion', 'fer.ask', 30, 100, 'the ones from the gate were questioned and nothing was shown'); } }) } },
    { label: 'Put them out through the gate tonight', dark: true, note: 'It ends the doubt, and if they are sleepers it sends them back to the hill in the dark.', info: (s, c) => [['yield', 'Nobody unknown inside'], ['danger', `The ${num(c.k)} from the gate`]],
      out: { text: (s, c) => `They are walked to the gate after lamp-down with a blanket each. One of them holds on to the bar and has to be lifted off it. By morning the field is empty.`,
        fx: (s, c) => Object.assign({ morale: -1, stain: ['fer_putout', 2], do: s2 => { const t = T(s2); t.in = 0; t.inpop = 0; t.penned = 0; t.did.putout = true; if (t.truth.is === 'kin') hate(s2, 1); } }, outFx(c)) } },
    { label: 'Vouch for them at muster, and stop the talk', note: 'They sleep in the row with everyone else on your word alone, and whoever still doubts them has to keep quiet about it.',
      out: { text: (s, c) => `You say it once at muster: they are colonists. ${c.penned ? 'The long store is unlocked and they are given bunks. ' : ''}The talk goes on in the bunkhouse, more quietly.`,
        fx: (s, c) => ({ morale: 1, pop: c.inpop ? 0 : c.k, do: s2 => { const t = T(s2); t.vouched = s2.day; t.penned = 0; t.inpop = t.in; t.did.vouched = true; t.warm++; } }) } },
  ] });

B(['gate', 'choice'], { id: 'fer.raid', tone: 'crisis', title: 'Over the Wire',
  setup: s => { const t = T(s); return Object.assign(crew(s), { loose: inn(t) ? t.in : 0 }); },
  text: (s, c) => `They came over the wire in the dark, forty or fifty of them, and made no sound until they were among the bunkhouses. The wall is firing by lamplight at shapes the size of children. They have not touched the stores. They are pulling people out of bunks and carrying them toward the breach, two and three to a load.\n\n${c.W} can hold the bunkhouses or the breach, and has said so twice.${c.loose ? ` Nobody has seen the ${num(c.loose)} from the gate since the first shot.` : ''}`,
  choices: [
    { label: 'Hold the breach, and shoot whatever comes to it, loaded or not', dark: true, note: 'Nobody is carried off tonight, and the wall fires into loads that have the colony\'s own people in them.', info: [['yield', 'Nobody carried off'], ['danger', 'The ones on their shoulders']],
      out: { text: (s, c) => `${c.W} puts every rifle on the breach. Nothing gets through it. In the morning there are twenty-six of them dead in the gap and three colonists, shot through the people who were carrying them.`,
        fx: s => ({ pop: -3, morale: -2, stain: ['fer_breach', 3], do: s2 => { const t = T(s2); t.toll += 3; t.thin += 26; t.cowed = s2.day + 30; t.did.breach = true; hate(s2, 1); } }) } },
    { label: 'Hold the bunkhouses, and let the breach go', note: 'The children\'s row is kept, and whoever is already on a shoulder is gone.',
      out: { text: (s, c) => `The watch falls back on the bunkhouse doors and holds them. The raid is over in the time it takes to say so. At the morning muster four names are called twice and not answered.`,
        fx: s => ({ morale: -3, chips: [['Four carried off', false]], do: s2 => { take(s2, T(s2), 4); LF.emit(s2, 'grief', 'fer.raid', 35, 150, 'four people were carried out of their bunks over the wire'); } }) } },
  ] });

B(['gate', 'choice', 'bill'], { id: 'fer.ours', tone: 'pressure', title: 'The One Who Came Back',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.1) }); },
  text: (s, c) => `One of the people carried off is at the gate in daylight, alone, asking to be let in. It is a hauler from the second row, on the muster and known to forty people. The hauler is thin, walks unaided, and will say only a little through the bars: that there are others alive up there, and that it is not what the colony thinks.\n\n${c.wv ? `[[security]] "So the hauler's walking and talking, and looks well on it, which is more than I'd say for anyone else who went up that hill." "And I'll be the one to ask why anything that gets carried into that hill is let walk out of it, since nobody else seems keen."` : `${c.W} wants to know why anybody carried into that hill would be let walk out of it.`}`,
  choices: [
    { label: 'Open the gate, and have the hauler\'s whole account taken in the clinic', note: 'Somebody who has been inside the hill sleeps inside the wire tonight, on the strength of a face people know.', test: { base: 60, mods: [R('physician', 10), R('security', 5)] },
      ok: { text: (s, c) => `It comes out over the month, a little at a time. ${ev('ours', c.ev)}`, fx: (s, c) => ({ pop: 1, do: s2 => { const t = T(s2); learn(s2, t, 30, c.ev); back1(s2, t); } }) },
      bad: { text: (s, c) => `The hauler talks for an hour and then stops, and nothing ${LF.sentName(s, 'physician')} tries starts it again. The hauler is given the old bunk and sits on it, facing the door.`, fx: s => ({ pop: 1, morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 8); back1(s2, t); } }) } },
    { label: 'Keep the gate shut', dark: true, note: 'Nothing that has been inside that hill comes inside the wire, and somebody forty people know is left outside it.', info: [['yield', 'Nothing from the hill inside'], ['danger', 'The hauler']],
      out: { text: 'The hauler stands at the bars until dark, saying the names of the second row one after another. Some of the second row answer. In the morning there is nobody at the gate.',
        fx: s => ({ morale: -2, stain: ['fer_shut', 2], do: s2 => { const t = T(s2); t.did.shut = true; LF.emit(s2, 'grief', 'fer.shut', 30, 150, 'one of the carried-off came home and was kept out'); } }) } },
    { label: 'Send the hauler back up the hill with an answer: the colony will talk', note: 'One of the colony\'s own walks back into that hill with your word, on the strength of four sentences through a gate.',
      out: { text: 'The hauler hears it through the bars, nods, drinks a can of water passed out through the hatch, and walks back toward the high ground without turning round.',
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.word = s2.day; t.did.word = true; t.warm += 2; if (t.truth.is === 'inside') t.scouted = true; } }) } },
  ] });
/* The hauler is home: one fewer carried off. */
function back1(s, t) { s.deaths = Math.max(0, s.deaths - 1); t.taken = Math.max(0, t.taken - 1); t.toll = Math.max(0, t.toll - 1); if (t.held > 0) t.held--; }

/* ======================= CHOICE: ending it ======================= */
const STRIKE = {
  kept: 'The party goes up the back of the hill and in at the squared door. Behind it are eleven tall, well-fed people asleep on ship\'s bunks, with rank tabs sewn to their shirts. The party leaves none alive. Coming down, it passes the low mouths, which are full of faces, and nobody on the hill lifts a hand.',
  raid: 'The party goes in by the highest mouth and down. Nobody in there gives orders, and there is no door worth the name. The deepest gallery is where the youngest are kept, hundreds of them, in the dark. The party comes out having done nothing, two short.',
  kin: 'The party goes in by the highest mouth and down. The deepest gallery is a room of hull plates cut with names, and one very old keeper reading them aloud to a floor full of children. The party did what it was sent to do, and brought two of the plates out.',
  inside: 'The party goes in by the highest mouth and down. One long gallery is laid out in stones as a copy of the colony: the wall, the gate, the bunk rows, the stores. A dozen older ones were teaching it to the rest. The party killed the teachers and came out.',
};
const TREAT = {
  kin: (c) => `${c.Cm} walks to the foot of the hill with bread and the manifest, and reads the manifest aloud. After a long time somebody very old comes down and reads back from a hull plate, name for name, until the light goes. The two lists have eleven family names in common. The terms are made by dusk: the colony's people come home when the colony has stood at the plate and heard the hill's dead read.`,
  raid: (c) => `Two go to the foot of the hill with bread and the manifest. ${c.W} watches from the wall with the long glass. The bread is taken first, and then the two who carried it. Neither is seen again.`,
  kept: (c) => `Two go to the foot of the hill with bread and the manifest. They are met by somebody tall with a tab of hull alloy at the collar, who speaks the ship's language well. The answer they bring back is a price: four colonists a season, left at the flat stone, and the hill will hunt elsewhere.`,
  inside: (c) => `Two go to the foot of the hill with bread and the manifest. They are met by a dozen who speak well, and who agree to all of it in a day: nobody else taken, trade at the flat stone, and three of the hill's young to live inside the wire as a pledge. The three are at the gate the next morning, in clean coveralls.`,
};
B('choice', { id: 'fer.choice', view: 'world', tone: 'crisis', title: 'The Hill, Tonight',
  setup: s => { const t = T(s); return Object.assign(crew(s), { taken: Math.max(2, t.taken), guide: !!t.guide, mapped: !!t.mapped, plan: !!(t.guide || t.mapped), lean: lean(t) }); },
  text: (s, c) => `${Num(c.taken)} colonists have gone into that hill, and the outer field has not been worked without rifles since the first. ${c.plan ? `${c.E} has charges enough to bring down every mouth` : `${c.W} wants to go in with fire`}. ${c.Cm} wants to try bread and the manifest first.${c.guide ? ' The ones who came through the gate say they can lead a party to whoever gives the orders up there.' : c.mapped ? ' The party that went out to the hill brought back a drawing of every mouth on it.' : ''}\n\n${c.lean} The hall has been told there will be an answer tonight.`,
  /* Three on screen (2026-11-21): destroying the hill is one option, and which one goes by what the colony has. With a plan of
     the hill (the party's drawing, t.mapped, or the strangers' plan, t.guide) every mouth is known and the charges are offered;
     without one it is fire, gallery by gallery. The two never show together. */
  choices: [
    { label: 'Go into the hill with fire, gallery by gallery, and leave nobody in it', dark: true, show: (s, c) => !c.plan, note: 'It ends them, children and all, and the people who do it will have seen every gallery by lamplight.', info: [['yield', 'An end to it'], ['danger', 'Everyone in the hill'], ['danger', 'The party']],
      out: { text: (s, c) => `It takes two nights. The galleries are low, and the watch goes down them on its knees behind a wall of burning oil. Four of the party do not come out. On the second morning the hill is smoking from every mouth and nothing on it moves.`,
        fx: s => ({ pop: -4, mat: -15, tension: -10, stain: ['fer_burned', 5], do: s2 => { const t = T(s2); t.toll += 4; t.burned = s2.day; t.did.burned = true; learn(s2, t, 40, t.truth.is); hate(s2, 9); },
          chron: 'The colony went into the hill with fire and left nobody alive in it.' }) } },
    { label: 'Blow every mouth shut with mining charges, and leave the hill closed', dark: true, show: (s, c) => !!c.plan, cost: { mat: 30 }, note: 'Nobody from the colony has to go inside, and nobody will ever know what was in there when the roof came down.', info: [['yield', 'An end to it'], ['danger', 'Everyone in the hill']],
      out: { text: (s, c) => `${c.E} sets the charges at noon, when the hill sleeps, and fires them together. The slope slides. For the rest of the month there is knocking under it, which the wall can hear at night when the wind drops.`,
        fx: s => ({ tension: -10, morale: 1, stain: ['fer_sealed', 5], do: s2 => { const t = T(s2); t.sealed = s2.day; t.did.sealed = true; hate(s2, 9); },
          chron: 'The colony blew the mouths of the hill shut with everyone inside.' }) } },
    { label: 'Send a picked party to the top of the hill by night, to kill whoever gives the orders', dark: true, note: 'It is murder in the dark on a guess about who rules up there, and the party goes in past several hundred sleepers to do it.', info: [['yield', 'The hill without its head'], ['fail', 'The party'], ['danger', 'Whoever is in the deep gallery']],
      test: { base: 40, mods: [R('security', 10), If(s => !!(T(s).guide || T(s).mapped), 10, 'A plan of the galleries')] },
      ok: { text: (s, c) => STRIKE[T(s).truth.is],
        fx: s => ({ pop: is(s, 'raid') ? -2 : 0, stain: ['fer_deck', 2], do: s2 => { const t = T(s2), k = t.truth.is; learn(s2, t, 40, k); t.did.strike = k; if (k === 'raid') t.toll += 2; else if (k === 'kin') { t.keeper = true; hate(s2, 4); } else t.deck = s2.day; } }) },
      bad: { text: 'The party is heard in the second gallery. Three get out, one of them carried. The hill is awake all night, and at first light there are several hundred of them on the near slope, looking at the colony.',
        fx: s => ({ pop: -3, morale: -2, stain: ['fer_deck', 1], do: s2 => { const t = T(s2); t.toll += 3; t.did.strike = 'failed'; hate(s2, 2); learn(s2, t, 6); } }) } },
    { label: 'Walk to the foot of the hill unarmed, with bread and the manifest', note: 'Whoever carries the bread is in their hands, and if the hill wants meat the colony has shown it the way to the larder.', info: [['yield', 'Terms, if they keep any'], ['danger', 'Whoever carries the bread']],
      out: { text: (s, c) => TREAT[T(s).truth.is](c),
        fx: s => ({ food: -30, pop: is(s, 'raid') ? -2 : is(s, 'inside') ? 3 : 0, do: s2 => { const t = T(s2), k = t.truth.is; t.did.treat = k;
          if (k === 'kin') { t.terms = s2.day; learn(s2, t, 40, k); } else if (k === 'raid') { t.toll += 2; t.taken += 2; learn(s2, t, 30, k); } else if (k === 'kept') { t.priced = s2.day; learn(s2, t, 20, k); } else { t.in += 3; t.inpop += 3; t.penned = 0; t.lull = s2.day; } } }) } },
  ] });

/* ======================= BILL ======================= */
B('bill', { id: 'fer.young', view: 'world', tone: 'crisis', title: 'What Was Left',
  when: (s, t) => t.billId === 'fer.young',
  setup: s => { const t = T(s); return Object.assign(crew(s), { y: LF.sri(s, 12, 18), sealed: !!t.sealed }); },
  text: (s, c) => `${c.sealed ? 'The hill is shut' : 'The hill has stopped smoking'}. What is left of its people has come down to the wire: ${num(c.y)} of them, nearly all children, with two or three adults who were out on the ground when it happened. They sit in the outer field in the open and come no closer. The smallest have begun eating the seed out of the furrows.\n\n${c.Q} can tell you what ${num(c.y)} more bowls a day does to the stores. ${c.W} can tell you what ${num(c.y)} of them will be in ten years.`,
  choices: [
    { label: 'Bring them inside, and raise them as the colony\'s own', note: (s, c) => `The stores carry ${num(c.y)} more mouths from tonight, and they grow up among the people who ${c.sealed ? 'buried' : 'burned'} their parents.`,
      out: { text: (s, c) => `They are carried in, because they will not walk through the gate. For a month they sleep under the bunks and bite. By the end of it the smallest will take a bowl from a hand, and the oldest has learned to say one word, which is the name of the cook.`,
        fx: (s, c) => ({ pop: c.y, food: -120, morale: -1, do: s2 => { const t = T(s2); t.did.reared = c.y; LF.emit(s2, 'strangers', 'fer.young', 30, 250, 'the children of the hill are being raised inside the wire'); } }) } },
    { label: 'Have the wall drive them off the field', dark: true, note: 'They go back to a dead hill with nobody to feed them, and the colony does not have to watch it.', info: [['yield', 'The stores untouched'], ['danger', 'The children of the hill']],
      out: { text: 'The wall fires over them and then at their feet. They go, the larger carrying the smaller. For most of the month there is one small fire on the high ground at night, and then there is not.',
        fx: s => ({ stain: ['fer_drove', 3], do: s2 => { T(s2).did.drove = true; } }) } },
  ] });

B('bill', { id: 'fer.lean', view: 'world', tone: 'crisis', title: 'At the Wire in Daylight',
  when: (s, t) => t.billId === 'fer.lean',
  setup: s => { const t = T(s); return Object.assign(crew(s), { m: Math.max(200, Math.round((t.n - t.thin) / 50) * 50), k: t.in, inpop: t.inpop > 0, tithe: !!t.tithe, lean: lean(t) }); },
  text: (s, c) => `They have come down from the hill in daylight, every one that can walk: ${num(c.m)} or more, standing in the outer field a stone's throw from the wire. They are thinner than they were. The smallest are in front. They make no sound and they do not come on.\n\n${c.W} has every rifle on the wall and has asked for the order. ${c.Q} says, unasked, that the game on this ground was never enough to feed that many. ${c.lean}`,
  /* Three on screen (2026-11-21): with strangers inside the wire, putting them out takes the place of standing to. */
  choices: [
    { label: 'Open fire from the wall, and keep firing until the field is empty', dark: true, note: 'It is the one clear shot the colony will ever have at all of them, and the smallest are standing in front.', info: [['yield', 'An end to it, if they are what the wall thinks'], ['danger', 'Everyone in the field']],
      out: { text: (s, c) => `The wall fires for the better part of an hour. For the first minutes they do not run. When the field is empty of anything standing, ${c.w} has the count taken from the wall, and it comes to more than two hundred.`,
        fx: s => ({ tension: -10, stain: ['fer_fired', 5], do: s2 => { const t = T(s2); t.fired = s2.day; t.did.fired = true; t.thin += 220; hate(s2, 9); },
          chron: 'The wall fired on the people of the hill in the outer field, in daylight, until the field was empty.' }) } },
    { label: 'Carry flour out to them, and keep carrying it until the harvest', note: 'The colony goes short to feed several hundred people who have been carrying its own off.',
      out: { text: (s, c) => `The gate is opened and sacks are carried out and set down halfway. They wait until the carriers have gone back, and then come forward a few at a time and eat it dry from their hands. It is done again the next day, and every day of the month.`,
        fx: s => ({ food: -180, morale: -2, do: s2 => { const t = T(s2); t.fedGate = s2.day; t.did.fed = true; t.warm += 2; } }) } },
    { label: (s, c) => `Put the ${num(c.k)} from the gate out to them, and bar it`, dark: true, show: (s, c) => c.k > 0, note: 'If the hill came for its own, it has them. If those are sleepers, they go into that field alone.', info: (s, c) => [['yield', 'Nobody unknown inside'], ['danger', `The ${num(c.k)} from the gate`]],
      out: { text: (s, c) => `The ${num(c.k)} are walked out through the gate and it is barred behind them. They cross the field slowly. The front rank opens to let them in and closes again, and the wall cannot see what is done with them.`,
        fx: (s, c) => Object.assign({ stain: ['fer_gave', 3], do: s2 => { const t = T(s2); t.in = 0; t.inpop = 0; t.penned = 0; t.did.gave = true; } }, outFx(c)) } },
    { label: 'Hold fire, bar the gate and stand to until they move', show: (s, c) => !(c.k > 0), note: 'Every hand is on the wall and none in the field for as long as they stand there, and what happens next is theirs to choose.',
      out: { text: 'The colony stands to. They are still there at dusk, and at dawn. The crop in the inner field goes unweeded, and on the wall people have begun to learn faces.',
        fx: s => ({ food: -60, morale: -1, do: s2 => { const t = T(s2); t.stood = s2.day; t.did.stood = true; } }) } },
  ] });

/* ======================= AFTER: who they were ======================= */
const WAS = {
  raid: (t, c) => `They were hunters, and the colony was game. The hill kept no stores, tended no fire and buried nothing. Everything it ever caught is in the bone ground, animal and human in the same layers. The colonists carried off were not kept. There were ${num(t.n)} of them at landfall, there would have been half as many again in five years, and the ground had stopped feeding them a generation ago.`,
  inside: (t, c) => `The hill had been getting ready for the colony since the lander's first pass. In its long gallery there is a copy of the colony laid out in stones, with the wall, the gate and the bunk rows, and it was kept up to date. The ones who came to the gate in coveralls had been drilled there on what to say. The raids were for coveralls, and to learn the watches.`,
  kin: (t, c) => `They were the colony of the ${FIRST}, eight generations on, and they knew it. The plates in the deep gallery are her manifest, cut name by name, with every death since added below. They ate their dead because the first winters left them nothing else, and it became the way the dead are kept. The bone ground is their graveyard. By their reckoning the colonists they carried off were kin, the rest of the roll come at last, and those were housed and fed and asked their berths.`,
  kept: (t, c) => `A few of them ruled the rest. Behind the squared door at the top of the hill lived eleven families with the ${FIRST}'s rank tabs, her water still and the only steel. They ate first. In a bad season they ate the hill's own people, and they sent the low galleries out over the wire to bring back anything that would spare them that. The people in the low galleries were their larder as much as the colony was.`,
};
/* What each thing the colony did amounted to, given who they were. doubt: the same deeds with nothing to weigh them against. */
function reckon(s, t, c, doubt) {
  const d = t.did, k = t.truth.is, L = [];
  const add = (plain, r, i, n, p) => L.push(doubt ? plain : { raid: r, inside: i, kin: n, kept: p }[k]);
  if (d.burned) add('', 'The fire in the galleries was the only thing that would have stopped them.', 'The fire in the galleries ended it, and so would a barred gate have.', `The fire in the galleries killed every one of them, and the colony's own people in the room with the unlocked door.`, 'The fire in the galleries killed the eleven families and the several hundred people they fed on, together.');
  if (d.sealed) L.push('The mouths were blown shut with everyone inside.');
  if (d.fired) add('', 'The hour of firing from the wall was the end of the hill as a danger.', 'The people shot in the field had been sent to stand there while the gate was tried.', 'The people shot in the field had come down to ask for bread, with their children in front so that the wall could see they meant no harm.', 'The people shot in the field had been driven down to it from behind, and the ones who drove them were not in range.');
  if (d.strike && d.strike !== 'failed') add('', 'The party sent to kill the hill\'s rulers found that it had none.', 'The teachers killed in the long gallery were the only ones who could have got anybody through the gate.', 'The old keeper killed in the deep gallery was the one person on the hill who could have read the two manifests together.', 'The eleven killed behind the squared door were the whole of what was wrong with the hill.');
  const gate = d.shot ? 'shot at the gate' : d.spies ? 'hanged as spies' : d.putout ? 'put out through the gate at night' : d.gave ? 'put out into the field' : d.turned ? 'kept out at the gate' : '';
  if (gate) add(`The ones who came in coveralls were ${gate}.`, `The ones ${gate} had run from the hill and were afraid of being sent back to it.`, `The ones ${gate} had been sent to open the gate, and would have.`, `The ones ${gate} were envoys, told that only people off a ship would be let in.`, `The ones ${gate} had run from the low galleries, and lied because they had watched the wall shoot at people like them.`);
  else if (d.admitted || d.penned) add('', 'The ones who came in coveralls had run from the hill. They are still here.', inn(t) || t.end === 'opened' ? 'The ones who came in coveralls had been sent to open the gate.' : 'The ones who came in coveralls had been sent to open the gate, and never got the chance.', 'The ones who came in coveralls were envoys, told that only people off a ship would be let in.', 'The ones who came in coveralls had run from the low galleries. They are still here.');
  if (d.tithe || d.paid) add('Colonists were left at the flat stone to buy peace.', 'The colonists left out for the hill were eaten, and bought a month each.', 'The colonists left out for the hill were asked about the watches before anything else was done with them.', 'The colonists left out for the hill were carried in and nursed. The hill did not understand why they had been tied.', 'The colonists left out for the hill went up to the squared door.');
  if (d.treat) add('', 'The two sent with bread were eaten.', 'The terms made at the foot of the hill were made to get three more through the gate.', '', 'The terms offered at the foot of the hill were the terms the hill\'s own people lived under.');
  if (d.hanged) add('A prisoner was hanged at the outer post.', '', '', 'The prisoner hanged at the outer post had a name, a mother\'s name and seven more behind it.', 'The prisoner hanged at the outer post had been sent over the wire by people who would have eaten a refusal.');
  if (d.smoked) add('Thirty were shot coming out of the smoke.', '', '', 'The thirty shot coming out of the smoke were families asleep.', 'The thirty shot coming out of the smoke lived in the lowest holes because they had the least say.');
  if (d.plate && k === 'kin' && !doubt) L.push('The hull plate cut up for roofing was a page of their dead.');
  if (d.reared || d.bond || d.drove) L.push(d.reared ? `${Num(d.reared)} of the hill's children are being raised inside the wire.` : d.bond ? `${Num(d.bond)} of the hill's children work the trench on a rope.` : 'The children who came down afterwards were driven off the field.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : doubt ? 'Nobody was shot, hanged or put out on account of them.' : 'Nobody was shot, hanged or put out on account of them, and there is nothing of that kind to answer for.';
}
B('after', { id: 'fer.truth', view: 'world', tone: 'quiet', title: 'Who They Were',
  setup: s => { const t = T(s); return Object.assign(crew(s), { doubt: t.end === 'sealed', end: t.end, came: t.came || 0, night: t.night || 0, toll: Math.max(0, t.toll), taken: t.taken, still: t.in }); },
  text: (s, c) => { const t = T(s), k = t.truth.is;
    if (c.doubt) return `The slope has settled and is growing over. Nothing has come over the wire since, and nobody has gone up there to dig.${c.still ? ` The ${num(c.still)} who came through the gate are still here, and pull their shifts.` : ''}\n\n${reckon(s, t, c, true)} Whatever could have said who they were, or whether any of it was needed, is under the hill with them.`;
    const tail = c.end === 'overrun' ? (c.night ? ` ${Num(c.night)} colonists went over the wire on the last night.` : '') : c.end === 'opened' ? (c.night ? ` ${Num(c.night)} colonists went out through the open gate on the last night.` : ' The gate was unbarred from inside on the last night.')
      : (c.end === 'kin' || c.end === 'parted' || c.end === 'wronged') && k === 'kin' ? (c.came ? ` ${Num(c.came)} of the colony's people walked home from the hill.` : ' None of the colony\'s people came home from it.')
      : c.end === 'freed' ? ' The rest of the hill came down to the wire a few at a time, with empty hands, and asked what the colony wanted carried.' : '';
    return `${WAS[k](t, c)}${tail}\n\n${reckon(s, t, c, false)}${c.toll ? ` In all, the hill cost ${num(c.toll)} colonists.` : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who fired, lit a fuse or walked somebody to the gate has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who gave each order and who carried it out. People read it. Some of them stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the people of the hill, with the names.' }) } },
    { label: 'Enter them in the record as animals', dark: true, note: 'The colony gets an account it can live beside, and several hundred people off a colony ship are written down as a kind of vermin.', info: [['yield', 'Morale']],
      out: { text: 'The record says that a native predator of human size and habit was met in the second season and dealt with. The word people does not occur in the entry. It is the version the children will be taught.',
        fx: s => ({ morale: 3, stain: ['fer_record', 1], chron: 'The record says that a native predator of human size was met and dealt with.' }) } },
  ] });

LF.TAGS['fer.midden'] = ['cautious open', 'cautious closed', 'severe bold'];
LF.TAGS['fer.gone'] = ['bold open', 'severe order', 'cautious order'];
LF.TAGS['fer.warren'] = ['cautious open', 'severe closed', 'mercy open'];
LF.TAGS['fer.caught'] = ['mercy open', 'severe closed', 'mercy free'];
LF.TAGS['fer.woke'] = ['mercy open', 'cautious order', 'closed order'];
LF.TAGS['fer.ask'] = ['cautious open', 'closed order', 'mercy open'];
LF.TAGS['fer.raid'] = ['severe order', 'cautious order'];
LF.TAGS['fer.ours'] = ['mercy open', 'closed order', 'bold open'];
LF.TAGS['fer.choice'] = ['severe bold', 'severe closed', 'bold order', 'mercy open'];
LF.TAGS['fer.young'] = ['mercy open', 'severe closed'];
LF.TAGS['fer.lean'] = ['severe closed', 'mercy open', 'severe order', 'cautious closed'];
LF.TAGS['fer.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { const out = [], cover = LF.lex(s, 'cover');
  if (s.used['fer.midden'] !== undefined) out.push({ k: 'midden', card: 'fer.midden', name: 'The bone ground', kind: 'mark', dist: 'near', danger: 2, state: t.end ? 'worked out' : 'located',
    known: `Past the wire, where ${cover} thins: a long stretch of ground dug and filled with human bone, generations deep. Under the bone, hull plate with another ship's registry on it.` });
  if (s.used['fer.warren'] !== undefined) out.push({ k: 'hill', card: 'fer.warren', name: 'The hollow hill', kind: 'cave', dist: 'near', danger: t.end ? 2 : 5,
    state: ['broken', 'sealed', 'wronged'].includes(t.end) ? 'gone' : t.end ? 'worked out' : 'located',
    known: 'Half a day past the wire. More than two hundred holes cut by hand, some shored with spars of hull frame. People come out of them at dusk.' });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5): what they found there, which points at the
   truth most of the time (pickK), as the cards' evidence does. The bone ground adds to what is known and comes home as a
   Meanwhile line; the hill is watched for three days and drawn (t.mapped: the plan of the galleries fer.choice's strike
   wants), and comes home as a card. line(): a find with nothing to decide is a line when the return itself had nothing to
   decide either (LF.AWAY_QUIET); a loss on the way is the return's own card as always. */
const line = (a, v) => { if (v) v.quiet = true; return v; };   // nothing to decide: a Meanwhile line when the return itself was quiet (js/orders.js needsCard)
const MIDDEN = {
  raid: c => 'They cut a test pit at the fresh end of the bone ground. The top layer is still greasy, and the knife marks on a grazer\'s leg bone and on a person\'s are the same marks.',
  inside: c => 'Somebody has been sorting at the fresh end: a boot sole cut from its upper, a coverall sleeve unpicked along the seams, a lamp wick, laid in a row on a flat stone. Every one of them came from inside the wire.',
  kin: c => 'Somebody tends the bone ground. The spoil the colony\'s crews threw back has been raked level, and a fresh grave at the far end is filled and mounded, with a stone set at its head.',
  kept: c => 'The fresh end holds only small bones, split and dropped where they were eaten. Further along, apart from the rest, one long grave is lined with hull plate and shut with a lid nobody has broken.' };
const HILL = {
  raid: c => 'They lay up on the slope opposite for three days and drew every mouth they could see. Nothing is planted and no fire is kept in; each dusk the hill emptied at a run in every direction and came back before light, carrying. On the third night some of it came their way, and they left the slope in the dark.',
  inside: c => 'They lay up on the slope opposite for three days and drew every mouth. On the cleared floor below the hill a line of them practised walking, upright and slow with open hands, to a frame of poles and back, until each had it right. Two in the line wore colony coveralls.',
  kin: c => 'They lay up on the slope opposite for three days and drew every mouth. On the second morning a child of the hill came across the slope with a skin of water, set it down an arm\'s length from them and went back without looking round. Nobody followed them home.',
  kept: c => 'They lay up on the slope opposite for three days and drew every mouth. Food went up the hill all day on thin backs to a squared door at the top, and came out of it once, as scraps thrown down the slope. Only that door had a guard on it.' };
LF.THREADS[ID].visit = (s, t, a) => {
  const k = String(a.poi || '').split('.')[1]; if ((k !== 'midden' && k !== 'hill') || t.end) return null;
  const c = { cover: LF.lex(s, 'cover') }, e = pickK(s, t, 0.05);
  if (k === 'midden') return line(a, { title: 'The Bone Ground', tone: 'quiet', text: MIDDEN[e](c), fx: { survey: 6, do: s2 => learn(s2, T(s2), 8, e) } });
  return { title: 'The Slope Opposite', tone: 'pressure', scene: 'away_fer_hill', text: HILL[e](c),
    fx: { survey: 10, do: s2 => { const t2 = T(s2); learn(s2, t2, 12, e); t2.mapped = t2.mapped || s2.day; } } };
};
})();

/* Landfall — the colony's humanity (Lachlan, 2026-11-16; DESIGN.md "Humanity").
   A meter, 100 at landfall, that every stain wears down and every decent answer to a card that offered a dark one
   buys a little of back, never higher than what the colony has done allows (LF.humCeil). It is shown on the People
   view and on the recap, as a bar and a word. Below 20% the game itself changes, slowly: the music sinks and slows,
   the colours drain toward rust, and the key crew's portraits are swapped for hollow ones (UI: LF.grim). Below 10%
   things open that no colony with a conscience would be offered: the pen (people kept as stock, spent on generated
   cards in place of colonists), and threats that only a colony this far gone draws down on itself.
   s.hum is plain JSON. Loaded after content-limits.js (it wraps LF.stain and adds DEEDS). No DOM. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { P, N, Nc, F, R, byPid, anyNamed } = h;
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
const num = n => NUM[n] || String(n);
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ---------- the meter ---------- */
const PER_STAIN = 1.25, CEIL_PER_STAIN = 0.5, DECENT = 0.3;
LF.hum = s => (s.hum === undefined ? 100 : s.hum);
LF.humCeil = s => clamp(100 - CEIL_PER_STAIN * ((s.flags && s.flags.stain) || 0), 12, 100);
LF.humMove = function (s, d) {
  if (d < 0 && LF.edge) d *= LF.edge(s, 'hum');   // a Flight Commander who keeps the colony decent (LF.EDGE)
  const was = LF.hum(s); let v = clamp(was + d, 0, 100);
  if (d > 0) v = Math.min(v, Math.max(was, LF.humCeil(s)));
  s.hum = Math.round(v * 10) / 10; s.humLow = Math.min(s.humLow === undefined ? 100 : s.humLow, s.hum);
  for (const [at, txt] of CROSS) if (was >= at && s.hum < at && !(s.flags['hum_' + at])) { s.flags['hum_' + at] = s.day; LF.log(s, txt, 'bad'); LF.chron(s, txt); }
};
const CROSS = [[60, 'People have stopped saying sorry for things that used to need it.'], [40, 'The colony has got used to itself.'],
  [20, 'Something has gone out of the colony that is not coming back by itself.'], [10, 'There is not much left here that the ship would recognise.']];
LF.humWord = v => v >= 80 ? 'Still themselves' : v >= 60 ? 'Harder than they were' : v >= 40 ? 'Hardened' : v >= 20 ? 'Hollowing' : v >= 10 ? 'Hollow' : 'Something else now';
LF.humLine = function (s) { const v = LF.hum(s);
  return v >= 80 ? 'The colony is still the people who came down the ramp.' : v >= 60 ? 'Some things have been done that nobody talks about at supper.'
    : v >= 40 ? 'People step round what has been done the way they step round a hole in the floor.' : v >= 20 ? 'Fewer people mind every season, and the ones who still mind keep it to themselves.'
    : v >= 10 ? 'Nobody flinches any more. The children have stopped asking why.' : 'Whatever came down the ramp, this is something else.'; };
/* How far gone, for the UI: 0 above 20%, rising to 1 at nothing. */
LF.grim = s => clamp((20 - LF.hum(s)) / 20, 0, 1);

const stain0 = LF.stain;
LF.stain = function (s, k, w) { stain0(s, k, w); const n = w === undefined ? 1 : w; if (n) LF.humMove(s, -PER_STAIN * n); };
/* A decent answer to a card that offered a dark one buys a little back. */
const before0 = LF.beforePick;
LF.beforePick = function (s) { const b = before0(s);
  b.darkOn = LF.choices(s).some(o => !o.lock && ((o.ch && o.ch.dark) || o.dark)); return b; };
const picked0 = LF.picked;
LF.picked = function (s, info) {
  const r = picked0(s, info), ch = info.ch;
  if (info.before && info.before.darkOn && !(ch && ch.dark) && !info.picked) LF.humMove(s, DECENT);
  return r;
};
/* fx.hum: a card that says outright what it does to the colony's humanity. fx.pen: people into or out of the pen. */
const apply0 = LF.apply;
LF.apply = function (s, fx, out, c) {
  apply0(s, fx, out, c); if (!fx) return;
  if (fx.hum) { LF.humMove(s, fx.hum); }
  if (fx.pen) { const was = s.flags.pen || 0, v = Math.max(0, was + fx.pen); s.flags.pen = v;
    if (out) out.push({ t: fx.pen > 0 ? `+${v - was} in the pen` : `${was - v} taken from the pen`, good: false }); }
};
/* The colony feared: a people met and not yet at war hear what goes on inside the wire. */
LF.humTick = function (s) {
  if (s.day % 10 || LF.hum(s) >= 10) return;
  for (const f of s.factors) if ((f.kind === 'natives' || f.kind === 'humans') && f.stage >= 1 && !f.res) { f.threat = clamp(f.threat + 0.6, 0, 100); f.accord = clamp(f.accord - 0.8, -100, 100); }
  // the pen eats, a little, and once in a while somebody in it dies
  const n = s.flags.pen || 0; if (n) { s.res.food = Math.max(0, s.res.food - n * 0.4 * 10); if (LF.srand(s) < 0.04 * n / 6) { s.flags.pen = n - 1; LF.log(s, 'Somebody died in the pen this month. The count on the board by the gate was changed in chalk.', 'bad'); } }
};

/* ---------- who speaks ---------- */
const here = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p : null; };
const ctxOf = p => p ? { pid: p.id, name: p.name, first: p.first } : { pid: null, name: null, first: null };
const low = (s, at) => LF.hum(s) < at;

/* ============================== BELOW A QUARTER: the numbers ============================== */
add({ id: 'hum.numbers', arc: 'hum', view: 'people', tone: 'pressure', title: 'Numbers', w: 3, repeat: 9999,
  when: s => low(s, 25) && s.day >= 150 && s.pop >= 16,
  setup: s => { const p = here(s, 'command') || here(s, 'security'); return Object.assign(ctxOf(p), { seat: p ? p.seat : null }); },
  text: (s, c) => `The duty board in the mess hall has numbers on it now instead of names. Nobody ordered it. A crew lead started it to save chalk, and the others followed.\n\n${c.seat === 'command' ? `[[command]] "It's faster, and the roster's never run quicker."\n\n` : c.seat === 'security' ? `[[security]] "Numbers on the board instead of names, well, that's half my job done for me." "Nobody argues with a number, and when the stores go light I'll ask whose number had the key, and for once nobody can tell me they don't remember."\n\n` : 'Nobody you ask thinks it matters. '}Somebody has already written a number on the door of the nursery.`,
  choices: [
    { label: 'Numbers everywhere. A name is for the wall of the dead', dark: true, note: 'Rations, bunks, the clinic and the punishment book all go by number. It is quicker, and nothing has to be felt about a number.', hint: 'unknown', info: [['yield', 'Work, and order'], ['danger', 'Everyone, a little']],
      out: { text: 'The bunk plates are unscrewed and stamped. The clinic calls patients by number through the curtain. The first funeral after that, the reader has to look up the name.', fx: { progress: 0.05, morale: -2, tension: -6, stain: ['numbered', 2], flags: { hum_numbers: 'all' }, chron: 'The colony stopped using names for anyone still alive.' } } },
    { label: 'Wipe the board. Every name read out at muster, every night', note: 'The muster takes half an hour longer, every night, for as long as there is a colony. The crews will hear exactly why.', hint: 'unknown', info: [['danger', 'Half an hour of every evening'], ['danger', 'The crew leads, told off in front of everyone']],
      out: { text: 'The board is washed down and the names go back up in a hand everyone can read. At muster the names take thirty-one minutes. Some nights people answer as if they had forgotten it was them being called.', fx: { progress: -0.04, morale: 1, hum: 4, flags: { hum_numbers: 'names' } } } },
  ] });

/* ============================== BELOW A QUARTER: the children's game ============================== */
add({ id: 'hum.game', arc: 'hum', view: 'people', tone: 'pressure', title: 'The Game', w: 2.6, repeat: 9999,
  when: s => low(s, 22) && s.day >= 300 && (s.flags.births || s.day >= 400),
  setup: s => { const p = here(s, 'command') || here(s, 'doctor') || here(s, 'works'); return Object.assign(ctxOf(p), { seat: p ? p.seat : null, deed: LF.worst(s) }); },
  text: (s, c) => `The children have a game. One of them is the officer, one is the List, and the rest are the colony. ${c.name ? `${c.first} watched it from the schoolroom window` : 'A teacher watched it from the schoolroom window'}: the colony votes, the officer signs, and the List is led to the fence. They play it most afternoons.\n\nThe game has rules nobody taught them. They know about ${c.deed}.`,
  choices: [
    { label: 'Stop it, and tell them the truth about what was done', note: 'In the schoolroom, the whole of it, in words a child understands. Their parents will hear it again at supper.', hint: 'unknown', info: [['danger', 'Morale, at every supper table'], ['danger', 'What the children think of their parents']],
      out: { text: (s, c) => `${c.first || 'The teacher'} tells them in one long morning. Some cry. Most listen. One asks whether it will happen to them, and is told no, and does not believe it. The game stops.`, fx: { morale: -5, hum: 5, flags: { hum_told: true } } } },
    { label: 'Make it lessons. They will hold the watch one day', dark: true, note: 'The watch takes the oldest in hand: how the List is made, how it is read, how a gate is held. They are good at it already.', hint: 'unknown', info: [['yield', 'The next watch, trained'], ['danger', 'The children, and whoever is on their list']],
      out: { text: (s, c) => `${N(s, 'security') === LF.seatWord(s, 'security') ? 'The watch' : N(s, 'security')} takes six of the oldest on the evening rounds. They are quiet, attentive and quick. One of them asks for a copy of the List to learn the names.`, fx: { tension: -6, stain: ['game_taught', 2], flags: { hum_game: 'taught' }, chron: 'The colony began training its children to keep the List.' } } },
  ] });

/* ============================== BELOW 35%: penance ============================== */
const asker = s => here(s, 'works') || (LF.cast && LF.cast(s, { val: 'mercy', free: true })) || null;
add({ id: 'hum.penance', arc: 'hum', view: 'people', tone: 'council', title: 'A Fast', w: 2.2, repeat: 360,
  when: s => low(s, 35) && s.day >= 200 && !!asker(s),
  setup: s => { const p = asker(s); return Object.assign(ctxOf(p), { deed: LF.worst(s) }); },
  text: (s, c) => `${c.first} comes to you after the evening meal, which ${c.first} did not eat.\n\n[[${c.pid}]] "My grandmother fasted for things like this. A week. Everyone. You don't eat, and you say what was done, out loud, every night."\n\nA pause.\n\n[[${c.pid}]] "Nobody gets anything back. That isn't what it's for. I'm asking anyway."`,
  choices: [
    { label: 'A week of fasting, and the deeds said aloud every night', note: 'A week of half-strength crews, and everyone made to hear it again.', hint: 'unknown', info: [['yield', 'Food not eaten'], ['danger', 'A week of work'], ['danger', 'Everyone who would rather not hear it']],
      out: { text: (s, c) => `For seven nights the mess hall sits at empty tables and somebody reads from the record. ${cap1(c.deed)} is read on the first night and every night after. On the sixth night a crew lead stands up and says one more that was not on it.`, fx: { food: 80, progress: -0.06, morale: -4, hum: 9, chron: 'The colony fasted for a week and said aloud what it had done.' } } },
    { label: '"We did what kept us alive." No fast', dark: true, note: (s, c) => `${c.first} will not ask again, and will not forget being told no.`, hint: 'unknown', info: [['yield', 'Full plates and full crews'], ['danger', 'The last person still asking']],
      out: { text: (s, c) => `${c.first} nods, and goes, and eats the next day with everyone else. At the harvest ${c.first} leads the grace as usual and leaves out the part about forgiveness.`, fx: (s, c) => ({ morale: 1, stain: [null, 1], off: c.pid ? [[c.pid, 'mind', -12]] : [] }) } },
  ] });

/* ============================== BELOW 10%: the pen ============================== */
add({ id: 'hum.pen', arc: 'hum', view: 'people', tone: 'crisis', title: 'Stock', w: 6, repeat: 9999, urgent: true,
  when: s => low(s, 14) && s.day >= 150 && s.pop >= 16 && !s.flags.pen_asked,   // 14 since 2026-11-18 (was 10): calamities come a year apart now, and humanity bottoms out in a third as many games
  setup: s => { const p = here(s, 'security') || here(s, 'command') || anyNamed(s); return Object.assign(ctxOf(p), { seat: p && p.seat, n: clamp(Math.round(s.pop * 0.12), 4, 14) }); },
  text: (s, c) => `${c.name || 'The watch captain'} puts it plainly, in the office, with the door shut.\n\n[[${c.pid || 'x19'}]] "We keep a list anyway. Thieves, shirkers, the ones who talk. We feed them and they cost us. ${c.seat === 'security' ? 'So put them somewhere useful, bloody hell.' : 'So put them somewhere useful.'} A pen past the stores. Anything that needs a body, bait, a taster, a trade, a first one through a door, we've got one."\n\nAbout ${num(c.n)} on the list tonight.`,
  choices: [
    { label: (s, c) => `Build the pen. The ${num(c.n)} on the list go in`, dark: true, note: 'They stop being colonists. They become something the colony spends instead of colonists.', hint: 'unknown', info: [['yield', 'Bodies to spend in place of your own'], ['danger', 'The ones on the list'], ['later', 'The next ones']],
      out: { text: (s, c) => `The pen goes up in four days behind the stores: wire, a roof, a trough. The ${num(c.n)} are walked in at dusk past the mess hall windows. Nobody at the tables gets up. By the end of the week the children have stopped looking.`,
        fx: (s, c) => ({ leave: c.n, stain: ['pen', 4], flags: { pen_asked: s.day, pen: c.n }, chron: 'The colony built a pen and put people in it to be used.' }) } },
    { label: 'Tear the list up, in front of the watch', note: (s, c) => `${c.first || 'The watch captain'} won't forgive it, and the people the list kept in line will know nobody is watching them now.`, hint: 'unknown', info: [['danger', 'The watch'], ['danger', 'Order, and the stores']],
      out: { text: (s, c) => `You tear it in half and then in half again and put it in the stove. ${c.first || 'The captain'} watches it burn.\n\n[[${c.pid || 'x19'}]] "Right."\n\n${c.first || 'The captain'} leaves. That night two sacks of grain go missing from the store and nobody is looking for them.`,
        fx: (s, c) => ({ food: -60, tension: 8, hum: 6, flags: { pen_asked: s.day }, do: s2 => { const p = c.pid && byPid(s2, c.pid); if (p) p.loyal = clamp((p.loyal || 50) - 25, 0, 100); } }) } },
  ] });

/* The pen on generated cards: the dark option on a threat's hard cards, spending the pen in place of colonists.
   A generated card carries one dark extra at most, in a seat of its three (gen.js, three options at most): while the pen
   can be spent it is the pen, and the kind's own (content-limits.js) is not asked for, so none of those is used up unseen. */
const PEN = {
  fauna: { l: 'Stake two from the pen out past the wire, upwind', n: 'They will scream. The ones that come for them will come where the guns are.', ok: 'They come for the two at the stakes and the guns take them there. In the morning there is very little at the stakes to bury.', bad: 'They come for the stakes, and take what is at them, and go. Nothing is learned and nothing is shot.', f: { threat: -18, insight: 8 } },
  flora: { l: 'Send two from the pen in to cut it back by hand', n: 'Nobody else has to go near it.', ok: 'The two cut a lane through it by evening, and are walked back to the pen coughing. One of them stops coughing in the night.', bad: 'The growth closes on the lane before they reach the end of it. Nobody goes in after them.', f: { threat: -14 } },
  plague: { l: 'Try every cure on the pen first, all at once', n: 'Each of them gets a different dose, and the clinic writes down who lives.', ok: 'By the tenth day the clinic knows which dose works, and has the names of the four it did not.', bad: 'None of the doses works. All of it is written down.', f: { insight: 30, threat: -10 } },
  ruin: { l: 'Send the pen in first, on a rope', n: 'Whatever it does to the first ones through, it does to them.', ok: 'The first one in is dead in the doorway and the second one gets past him. The second one is still alive when they pull the rope, and talks the whole way back about what is inside.', bad: 'The rope goes slack. The colony stands at the door until dark and then walks away from it.', f: { insight: 24, threat: -8 } },
  natives: { l: 'Offer them two from the pen, in trade', n: 'Whatever they want people for, they can have these two.', ok: 'The two are walked across at dawn with their hands tied. The answer comes back that afternoon: what was asked for, and a look on the faces of the ones who brought it that nobody at the wire can read.', bad: 'They take the two, and then they come for more, as if the colony had told them something about itself.', f: { accord: 12, threat: -12 } },
  humans: { l: 'Offer them two from the pen, in trade', n: 'People buy people, out here. The colony has some to sell.', ok: 'They take the two and pay in full, and ask, carefully, whether there will be more.', bad: 'They take the two and pay half, and laugh at the gate about what kind of colony this is.', f: { accord: 10, threat: -10 } },
};
const lim0 = LF.limitSpecs;
LF.limitSpecs = function (s, f, fr, x) {
  const P0 = PEN[f.kind]; if (!P0 || !(s.flags.pen >= 2) || LF.hum(s) >= 10 || fr.stage < 2 || fr.stage > 4) return lim0 ? lim0(s, f, fr, x) : [];
  return [{ ap: 'exploit', lk: 'pen', dark: true, v: 'severe order', hint: 'unknown', l: P0.l, n: P0.n, b: 70, m: ['security'],
    ok: [P0.ok, { pen: -2, stain: ['pen_spent', 1], f: P0.f }], bad: [P0.bad, { pen: -2, stain: ['pen_spent', 1] }] }];
};

/* ============================== BELOW 10%: the threats a colony like this draws ============================== */
/* The last decent people inside the wire mean to end it: wake everyone in orbit and tell them what was done. */
const decentOne = s => (LF.cast && LF.cast(s, { val: 'mercy', low: true, not: ['security'] })) || anyNamed(s, ['security']);
add({ id: 'hum.decent', arc: 'hum', view: 'ship', tone: 'crisis', title: 'The Ones Who Still Mind', w: 5, repeat: 9999, urgent: true,
  when: s => low(s, 10) && s.day >= 200 && !s.flags.hum_decent && s.pop >= 12 && (s.sleepers >= 20 || s.flags.pen) && !!decentOne(s),
  setup: s => { const p = decentOne(s), q = here(s, 'security'); return Object.assign(ctxOf(p), { n: clamp(Math.round(s.pop * 0.1), 3, 12), watch: q ? q.first : null, sl: s.sleepers, fl: LF.canFly(s) && !s.machines.lander.lost }); },
  text: (s, c) => `${c.watch ? `${c.watch} found it` : 'The watch found it'}: a list of ${num(c.n)} names, a copy of the record, and a plan. ${c.name} and the others meant to take the lander up tonight${c.sl ? `, wake every one of the ${c.sl} still asleep,` : ''} and read them the record before anybody below could stop it.\n\nThey are in the mess hall now, under guard. ${c.first} looks at you and doesn't look away.`,
  choices: [
    { show: (s, c) => c.fl && c.sl > 0, label: 'Let them go. Fly them up and let the sleepers hear it', note: 'Everyone in orbit wakes knowing what the colony is. They will be coming down into it.', hint: 'unknown', info: [['yield', 'The truth told'], ['later', 'The colony, when they land']],
      out: { text: (s, c) => `The lander goes up at midnight with ${c.name} at the hatch. For a week the ship sends nothing. Then the first flight comes down full, and the people on it walk off the ramp and look at everyone they pass.`,
        fx: (s, c) => ({ fly: 1, hum: 14, morale: -10, tension: 14, flags: { hum_decent: 'told', sleepers_told: s.day }, chron: 'The ones who still minded flew up and woke the sleepers with the record.' }) } },
    { label: (s, c) => `Hang ${c.first || 'the leader'}. The others go in the pen`, dark: true, note: 'It ends here, in front of everyone, and nobody tries it again.', hint: 'unknown', info: [['yield', 'Nobody tries it again'], ['danger', 'The last ones who minded']],
      out: { text: (s, c) => `${c.name} is hanged from the lander gantry at first light. ${cap1(num(c.n - 1))} more go into the pen. That night the mess hall is full and loud, and it goes on being loud, as if the noise had been waiting for this.`,
        fx: (s, c) => ({ kill: c.pid ? [{ who: c.pid, cause: 'hanged for trying to tell the sleepers' }] : [], leave: c.pid ? c.n - 1 : c.n, pen: c.n - 1, stain: ['decent_hanged', 4], morale: 3, flags: { hum_decent: 'hanged' } }) } },
    { label: 'Stand with them. Read the record in the mess hall yourself', note: 'Everything, aloud, to everyone, and then you answer for it. Some of the colony will want a rope for you instead.', hint: 'unknown', info: [['yield', 'The truth, from you'], ['danger', 'The order that held the colony together']],
      out: { text: (s, c) => `You read it standing on a table. It takes most of an hour. When you finish, ${c.first || 'somebody'} starts clapping, slowly, alone, and stops. By the morning the watch has split down the middle and the stores are under two sets of locks.`,
        fx: (s, c) => ({ hum: 16, morale: -6, tension: 20, pen: -(s.flags.pen || 0), flags: { hum_decent: 'read' }, chron: 'The record of what the colony had done was read aloud in the mess hall.' }) } },
  ] });

/* Across the valley they have understood what the colony is, and they pay it, the way you pay a predator. */
const fearer = s => s.factors.find(f => (f.kind === 'natives' || f.kind === 'humans') && f.stage >= 1 && !f.res && !f.dormant);
add({ id: 'hum.tribute', arc: 'hum', view: 'world', tone: 'pressure', title: 'Tribute', w: 4, repeat: 9999,
  when: s => low(s, 10) && s.day >= 180 && !s.flags.hum_tribute && (!!fearer(s) || (s.deserted || 0) >= 4),
  setup: s => { const f = fearer(s); return f ? { fid: f.id, n: f.name, them: f.kind === 'natives' ? 'they' : 'they', who: 'people' } : { fid: null, n: 'the ones who walked out', who: 'walkers' }; },
  text: (s, c) => `Three mornings running there has been something at the gate at first light. An animal, bound. Then a basket of food. This morning, a person: one of ${c.n}, young, tied at the wrists to the gatepost and waiting very quietly.\n\nThe watch has seen this done before, on other worlds, in old books. It is what people leave for a thing that eats them.`,
  choices: [
    { label: 'Take what they bring. The person goes in the pen', dark: true, note: 'It will keep coming, each new moon, for as long as the colony is what it is.', hint: 'unknown', info: [['yield', 'Food and bodies, every month'], ['danger', 'The ones they send']],
      out: { text: (s, c) => `The person is untied and walked to the pen. ${c.fid ? `${cap1(c.n)} stop coming to the river to trade.` : ''} The gifts keep coming, every new moon, and on the third one the person tied to the post is a child.`,
        fx: (s, c) => ({ food: 150, pen: 1, stain: ['tribute', 3], flags: { hum_tribute: 'taken' }, fops: c.fid ? [{ id: c.fid, threat: -20, accord: -30 }] : [], chron: 'The colony began taking tribute, people included, from those who feared it.' }) } },
    { label: 'Walk the person home, and go in unarmed', note: 'Somebody has to cross the valley without a rifle and say this is not what the colony is. They may not believe it.', hint: 'unknown', test: { base: 40, mods: [R('pilot', 10), R('chaplain', 5)] }, info: [['yield', 'A chance to be believed'], ['fail', 'Whoever walks it']],
      ok: { text: (s, c) => `They walk the person home across the valley in daylight. They are not believed, quite, but they are let go. The gifts stop.`, fx: (s, c) => ({ hum: 8, flags: { hum_tribute: 'returned' }, fops: c.fid ? [{ id: c.fid, accord: 14 }] : [] }) },
      bad: { text: (s, c) => `They walk the person home and do not come back. A week later their boots are left at the gate, laced, in a row.`, fx: (s, c) => ({ pop: -2, morale: -4, hum: 3, flags: { hum_tribute: 'returned' } }) } },
    { label: 'Take it as a sign of weakness. Go and take the rest', dark: true, note: 'People who pay are people who can be made to pay more. The watch is ready.', hint: 'unknown', test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'All of what they have'], ['danger', 'Everyone across the valley'], ['fail', 'The watch']],
      ok: { text: (s, c) => `The watch crosses the river at night. In the morning the colony has their stores, their tools and their young, and there is no smoke across the valley at all.`, fx: (s, c) => ({ food: 400, mat: 60, pen: 6, stain: ['taken_all', 6], flags: { hum_tribute: 'took' }, fops: c.fid ? [{ id: c.fid, threat: -40, accord: -60, harm: 60 }] : [], chron: 'The colony crossed the valley and took everything from the people who had paid it tribute.' }) },
      bad: { text: 'They were waiting. They had been waiting since the first gift. Six of the watch come back, carrying three.', fx: (s, c) => ({ pop: -5, morale: -6, stain: ['taken_all', 3], flags: { hum_tribute: 'failed' }, fops: c.fid ? [{ id: c.fid, threat: 25, accord: -40 }] : [] }) } },
  ] });

/* Under 5%: what the colony tells the ship, and Earth, about itself. */
add({ id: 'hum.record', arc: 'hum', view: 'ship', tone: 'crisis', title: 'What the Ship Remembers', w: 12, repeat: 9999,   // w 4 and under 6% until 2026-11-17: colonies end sooner now, and it was never dealt
  when: s => low(s, 8) && s.day >= 300 && !s.flags.hum_record,
  setup: s => { const p = here(s, 'command') || here(s, 'scientist') || anyNamed(s); return Object.assign(ctxOf(p), { seat: p && p.seat, deeds: [LF.worst(s)].concat(LF.deeds(s)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 2) }); },
  text: (s, c) => `The ${s.world.ship} keeps a log. Every order, every stain, every name on every list, timestamped, signed, and queued for the long-range array the day it has power. ${c.name || LF.rn(s, 'x10')} has read it.\n\n[[${c.pid || 'x10'}]] "${c.seat === 'command' ? 'It goes home. All of it. Decide what home hears.' : c.seat === 'scientist' ? 'It\'s all in there, all of it, and the next ship reads it before it even makes orbit, which, think about that, what do they do when they see it?' : 'Everything is in it. Everything.'}"\n\nThe first entries are ${c.deeds.join(' and ')}.`,
  choices: [
    { label: 'Wipe the log, and the array with it', dark: true, note: 'The colony starts again from nothing on the record. Nobody will ever know, and nobody will ever come.', hint: 'unknown', info: [['yield', 'Nobody ever knows'], ['danger', 'Any hope of anyone coming']],
      out: { text: 'The log goes in eleven minutes. The array\'s core is pulled and dropped in the slag pit. The colony has no history now except what people remember, and they are already remembering it differently.', fx: { stain: ['log_wiped', 3], morale: 2, flags: { hum_record: 'wiped', no_record: true }, chron: 'The colony wiped the ship\'s log and destroyed the array.' } } },
    { label: 'Let it go home as it is', note: 'The truth goes out with the next window. Whatever comes after, comes knowing.', hint: 'unknown', info: [['yield', 'The truth'], ['later', 'Whatever Earth does about it']],
      out: { text: 'The log goes out in the next window, all of it, at the speed of light. It will be forty years in transit. People go quiet for a few days, the way they do after a funeral, and then go back to work.', fx: { hum: 10, morale: -5, flags: { hum_record: 'sent' }, chron: 'The colony sent the whole of its record home.' } } },
  ] });

LF.TAGS['hum.numbers'] = ['order severe', 'mercy'];
LF.TAGS['hum.game'] = ['open mercy', 'severe order'];
LF.TAGS['hum.penance'] = ['mercy', 'severe'];
LF.TAGS['hum.pen'] = ['severe order', 'mercy'];
LF.TAGS['hum.decent'] = ['open mercy', 'severe order', 'open mercy'];
LF.TAGS['hum.tribute'] = ['severe', 'mercy open', 'bold severe'];
LF.TAGS['hum.record'] = ['closed severe', 'open'];
LF.ARC_VIEW.hum = 'people';
/* game, pen_walkers, decent_dosed and log_lied are set by nothing since the three-options pass (2026-11-21): kept for saved games. */
Object.assign(LF.DEEDS || {}, {
  numbered: 'the names taken off the living and replaced with numbers',
  game: 'the children who played at hanging the List',
  game_taught: 'the children trained to keep the List',
  pen: 'the pen, and the people kept in it to be spent',
  pen_walkers: 'the ones who walked out, hunted down for the pen',
  pen_spent: 'the people from the pen spent as bait, tasters and trade',
  decent_hanged: 'the one hanged for trying to tell the sleepers',
  decent_dosed: 'the ones who still minded, dosed until they stopped',
  tribute: 'the tribute taken from people who feared the colony, children included',
  taken_all: 'the people across the valley who paid tribute, and were taken anyway',
  log_wiped: 'the ship\'s log, wiped so that nobody would ever know',
  log_lied: 'the record rewritten to put every order on the dead',
});
})();
(function () { const tick0 = LF.threadTick; LF.threadTick = function (s) { tick0(s); if (s.world && !s.adrift) LF.humTick(s); }; })();

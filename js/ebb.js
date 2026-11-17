/* Landfall — the low ebb (Lachlan, 2026-11-16; DESIGN.md "The low ebb").
   Morale below 20% does not end the game. It opens a run of threats that only a colony this far down draws on
   itself, and ways back up that all cost something: a person, the stores, the colony's humanity, a neighbour's
   goodwill, the officers' hold on things. Below 10% it gets worse: people die by their own hand, the officers'
   nerve wears, and whatever is out there presses harder.
   s.lift is hope, lent for a while: a bonus to the morale the colony's conditions justify, which fades by
   about 1.5% a day (core.js). Most ways out pay in lift as well as morale, because a lift that only moved the
   number would drift straight back down to where the conditions put it. s.flags.ebb_* is the rest of the state.
   Loaded after humanity.js. No DOM. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { P, N, Nc, R, Fl, If, byPid, anyNamed } = h;
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
const num = n => NUM[n] || String(n);
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ---------- the meter ---------- */
/* The meeting hall (WO-3) holds a colony together a little longer: the ebb reads morale as four points higher. */
const held = s => s.morale + (LF.has(s, 'hall') ? 4 : 0);
LF.ebb = s => held(s) < 10 ? 2 : held(s) < 20 ? 1 : 0;
const low = (s, at) => !!s.world && !s.adrift && !LF.aloft(s) && s.day >= 60 && held(s) < at;
LF.moraleWord2 = m => m >= 68 ? 'High' : m >= 48 ? 'Steady' : m >= 30 ? 'Uneasy' : m >= 20 ? 'Bitter' : m >= 10 ? 'Fraying' : 'Breaking';
LF.moraleLine = function (s) { const m = s.morale;
  return m >= 68 ? 'People are in good heart, and it shows in the work.' : m >= 48 ? 'People grumble about the ordinary things.' : m >= 30 ? 'People are uneasy, and saying so to each other.'
    : m >= 20 ? 'The mood is bitter. Every order is argued with.' : m >= 10 ? 'People have stopped believing it will get better, and the colony is starting to come apart.'
    : 'The colony is breaking. Nobody makes plans past next week.'; };

const fx0 = LF.apply;
LF.apply = function (s, fx, out, c) {
  fx0(s, fx, out, c); if (!fx) return;
  if (fx.lift) { s.lift = clamp((s.lift || 0) + fx.lift, -30, 40); if (out) out.push({ t: fx.lift > 0 ? 'Hope, for a while' : 'Hope goes out of them', good: fx.lift > 0 }); }
  if (fx.floor) s.morale = Math.max(s.morale, fx.floor);
};

/* Every ten days: the cost of a colony at its lowest, and the lines that mark it going down and coming back. */
LF.ebbTick = function (s) {
  if (s.day % 10 || !s.world || LF.aloft(s)) return;
  const F = s.flags, m = held(s);
  if (m < 20 && !F.ebb_on) { F.ebb_on = s.day; F.ebbs = (F.ebbs || 0) + 1; const t = 'The colony has stopped believing in itself.'; LF.log(s, t, 'bad'); LF.chron(s, t); }
  if (m < 10 && F.ebb_on && !F.ebb_deep) { F.ebb_deep = s.day; const t = 'People have stopped making plans past next week.'; LF.log(s, t, 'bad'); LF.chron(s, t); }
  if (F.ebb_on && m >= 32) { const t = s.day - F.ebb_on > 120 ? 'The colony came back from the edge, a long way down and a long way up.' : 'The colony came back from the edge.';
    LF.log(s, t, 'good'); LF.chron(s, t); F.ebb_on = 0; F.ebb_deep = 0; LF.storyPoint && LF.storyPoint(s); }
  if (m >= 20) return;
  // The threats come to a colony this low, rather than waiting to be drawn: one is put on the schedule every forty days or so.
  if (s.day - (F.ebb_last || 0) >= 40) { const ok = THREATS.filter(id => { const st = LF.byId[id], u = s.used[id]; return st && (u === undefined || s.day - u >= st.repeat) && st.when(s) && !s.sched.some(e => e.id === id); });
    if (ok.length) { F.ebb_last = s.day; s.sched.push({ id: LF.pick(s, ok), day: s.day }); } }
  // Whatever is out there can smell it: the threats that are already pressing press harder.
  for (const f of s.factors) if (['fauna', 'natives', 'humans'].includes(f.kind) && f.stage >= 2 && !f.res) f.threat = clamp(f.threat + (m < 10 ? 1 : 0.5), 0, 100);
  if (m >= 10) return;
  // Below a tenth: people die by their own hand, and the officers' nerve goes.
  if (s.pop > 12 && LF.rand(s) < 0.12) { LF.deaths(s, 1); s.flags.ebb_lost = (s.flags.ebb_lost || 0) + 1;
    LF.log(s, LF.pick(s, ['Someone did not come to muster this morning, and was found later behind the pods. Nobody says the word for it.', 'A fitter from the night shift walked out past the wire without a coat. The search party came back without saying anything.', 'Someone was found in the store shed at dawn. The note said sorry, and nothing else.']), 'bad'); }
  if (s.day % 30 === 0 && LF.shift) { const up = LF.SEAT_ORDER.map(k => here(s, k)).filter(Boolean); if (up.length) LF.shift(s, LF.pick(s, up).id, 'mind', -3); }
};
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { if (t0) t0(s); if (s.world && !s.adrift) LF.ebbTick(s); }; })();

const THREATS = ['ebb.sand', 'ebb.sleep', 'ebb.walk', 'ebb.walkers', 'ebb.night', 'ebb.knives'];
/* ---------- who speaks ---------- */
const here = (s, seat) => { const p = LF.officer(s, seat); return p && p.alive && LF.seatState(s, seat) === 'here' ? p : null; };
const ctxOf = p => p ? { pid: p.id, name: p.name, first: p.first } : { pid: null, name: null, first: null };
const crowd = (s, f, lo, hi) => clamp(Math.round(s.pop * f), lo, hi);
const someone = s => anyNamed(s, LF.SEAT_ORDER);   // a colonist, not an officer
const grabbed = (s, n) => ({ food: -Math.round(s.res.food * n / Math.max(1, LF.mouths(s) / 60) / 10) * 10 });   // a share of what is in the bins (food fx is scaled by pop/60 in LF.apply)
const neighbour = s => s.factors.find(f => (f.kind === 'natives' || f.kind === 'humans') && f.stage >= 1 && !f.res && !f.dormant);

/* ============================== THREATS: below 20% ============================== */
/* Somebody who has given up wrecks a machine, so the ship will have to take them back, or so it will all stop. */
const SAND = ['reclaimer', 'hydroponics', 'fabricator', 'reactor'];
add({ id: 'ebb.sand', arc: 'ebb', gap: 35, view: 'colony', tone: 'crisis', title: 'Sand in the Gears', w: 3, repeat: 220,
  when: s => low(s, 20) && SAND.some(id => LF.down(s, id)),
  setup: s => { const m = SAND.find(id => LF.down(s, id)), p = here(s, 'engineer') || here(s, 'security'); return Object.assign(ctxOf(p), { m, mn: LF.MACHINES[m].name, seat: p && p.seat }); },
  text: (s, c) => `Somebody has been into the ${c.mn} with a pry bar and a bag of grit. It was done carefully, by someone who knew where to put the grit.\n\n${c.name ? `"Not an accident," ${c.first} says, wiping a hand on a rag. "Someone wants this to stop. Wants all of it to stop."` : 'Nobody on the morning shift will say what they think.'} Chalked on the housing: GO HOME.`,
  choices: [
    { label: 'Find who did it', note: 'The watch goes through the shift lists and the bunks. It may find the right person.', hint: 'unknown', info: [['yield', 'The one who did it'], ['danger', 'Whoever the watch settles on']],
      test: { base: 52, mods: [R('security', 14), Fl('crackdown', 6, 'People talk to the watch now'), If(s => s.tension > 60, -8, 'Nobody is talking')] },
      ok: { text: (s, c) => `A rigger with grit under the nails, who cries when asked and explains it all: the ship can still take people up, and if the colony fails it will have to. The ${c.mn} is mended. The rigger is put on the fields where there is nothing to break.`, fx: (s, c) => ({ machine: { [c.m]: -10 }, tension: -6, morale: 1 }) },
      bad: { text: (s, c) => `The watch settles on a loud electrician who was on shift that night and said things in the mess hall. The electrician swears to it being someone else, and is confined anyway. A week later the grit turns up in a different machine.`, fx: (s, c) => ({ machine: { [c.m]: -16 }, stain: ['wrong_one', 1], morale: -3, tension: 6 }) } },
    { label: 'Guard every machine, day and night', note: 'Two on every door, from the build crews. Nothing goes up while they stand there.', hint: 'unknown', info: [['yield', 'Nothing else broken'], ['danger', 'The build, and the crews on it']],
      out: { text: (s, c) => `The ${c.mn} is mended and a pair of guards stands at every hatch in the colony, round the clock, looking at their own neighbours.`, fx: (s, c) => ({ machine: { [c.m]: -10 }, progress: -0.1, tension: 5, morale: -1 }) } },
    { label: 'Lock up everyone who has said the colony is finished', dark: true, note: 'A list from the mess hall, the night shift and the clinic. Most of them only said it.', hint: 'unknown', info: [['yield', 'Nobody saying it any more'], ['danger', 'Everyone on the list']],
      out: { text: (s, c) => `${cap1(num(crowd(s, 0.08, 3, 9)))} people spend a month in a cargo pod with the door bolted. Nobody says GO HOME out loud after that. It appears on a wall, in chalk, about once a week.`, fx: (s, c) => ({ machine: { [c.m]: -10 }, stain: ['despair_locked', 2], tension: -10, morale: 3, progress: -0.03 }) } },
    { label: 'Make an example: shift the whole night crew to the latrines for a season', dark: true, note: 'All of them, guilty or not, so the one who did it is among them.', hint: 'unknown', info: [['yield', 'Fear, which does the work of guards'], ['danger', 'A dozen who did nothing']],
      out: { text: (s, c) => `The night crew digs latrines and carries waste until the season turns. Most of them did nothing, and they all know it, and so does everyone else. Nothing else is broken that season.`, fx: (s, c) => ({ machine: { [c.m]: -10 }, stain: ['punished_all', 1], tension: -4, morale: -2, flags: { crackdown: true } }) } },
  ] });
LF.TAGS['ebb.sand'] = ['order', 'cautious', 'severe order', 'severe'];

/* A petition to go back into the cryo banks until the colony is something worth waking up to. */
const canSleep = s => s.sleepers >= 0 && !s.flags.qs_dark && !s.machines.lander.lost && !s.flags.lander_grounded && LF.canFly(s);
add({ id: 'ebb.sleep', arc: 'ebb', gap: 35, view: 'ship', tone: 'pressure', title: 'Back to Sleep', w: 2.4, repeat: 320,
  when: s => low(s, 20) && s.pop >= 24 && canSleep(s),
  setup: s => { const p = someone(s); return Object.assign(ctxOf(p), { n: crowd(s, 0.1, 4, 12) }); },
  text: (s, c) => `${c.name || 'A shift foreman'} brings the petition: ${num(c.n)} names, in the same careful hand. They want to go back up to the ship and back into the cryo banks, and be woken when the colony is a place worth waking up in.\n\n"We're no use to you like this," ${c.first || 'the foreman'} says. "Put us on the shelf."`,
  choices: [
    { label: (s, c) => `Fly the ${num(c.n)} up and let them sleep`, note: 'A flight, and the hands they take with them. Everyone left will know there is a way out.', hint: 'unknown', info: [['yield', 'Fewer mouths, and the rest relieved'], ['danger', 'The lander, and the work'], ['danger', 'Everyone who stays']],
      out: { text: (s, c) => `The lander goes up with ${num(c.n)} people who wave from the ramp. A week later the ship reports them under. The mess hall is quieter, and some of the quiet is envy.`, fx: (s, c) => ({ fly: 1, leave: c.n, sleepers: c.n, morale: 5, lift: 6, flags: { ebb_slept: (s.flags.ebb_slept || 0) + c.n } }) } },
    { label: 'No. Every hand is needed', note: (s, c) => `${c.first || 'The foreman'} will take it badly, and so will the other names on the list.`, hint: 'unknown', info: [['yield', 'Every hand kept'], ['danger', 'The petitioners'], ['danger', 'The mood']],
      out: { text: (s, c) => `You say no to ${c.first || 'the foreman'}'s face. Two of the names walk out past the wire that week instead. The rest go back to work and do the least they can.`, fx: (s, c) => ({ leave: 2, morale: -4, lift: -4, tension: 4 }) } },
    { label: 'Fly them up, and put the troublemakers under with them, asked or not', dark: true, note: 'Three more who never signed. The colony will know the banks are a punishment now.', hint: 'unknown', info: [['yield', 'Quiet, and fewer mouths'], ['danger', 'Three who never asked'], ['danger', 'Anyone who argues, next time']],
      out: { text: (s, c) => `The lander goes up with ${num(c.n + 3)}. The three extra are walked on by the watch. One of them shouts the whole way up the ramp. Afterwards nobody argues with an officer where the watch can hear.`, fx: (s, c) => ({ fly: 1, leave: c.n + 3, sleepers: c.n + 3, stain: ['put_under', 2], tension: -10, morale: 3, lift: 4 }) } },
  ] });
LF.TAGS['ebb.sleep'] = ['mercy free', 'order', 'severe order'];

/* A preacher who says the planet is calling: a group means to walk out into the country at dawn, with nothing. */
add({ id: 'ebb.walk', arc: 'ebb', gap: 35, view: 'world', tone: 'crisis', title: 'The Walk', w: 2.6, repeat: 320,
  when: s => low(s, 16) && s.pop >= 20,
  setup: s => { const p = someone(s); return Object.assign(ctxOf(p), { n: crowd(s, 0.14, 4, 15) }); },
  text: (s, c) => `${c.name || 'A grower from the hydroponics crew'} has been preaching in the pod lines at night: the colony is a mistake, the world does not want it, and the only honest thing is to walk out into it and let it decide. ${cap1(num(c.n))} people mean to do it at dawn, with no packs, holding hands.\n\nSome of them are carrying children.`,
  choices: [
    { label: 'Go out to them yourself, and talk them down', note: 'It is your voice against a voice they trust more. If you lose, they walk anyway.', hint: 'unknown', info: [['yield', 'Them, kept'], ['danger', 'The walkers'], ['danger', 'What is left of your standing']],
      test: { base: 44, mods: [R('command', 16), Fl('council', 6, 'They have a vote to come back to'), If(s => (s.lift || 0) > 5, 8, 'Things have started to look up')] },
      ok: { text: (s, c) => `You stand with them at the wire from three in the morning until the light comes. At dawn half of them sit down in the mud, and then the rest. ${c.first || 'The preacher'} goes on alone, and nobody follows.`, fx: (s, c) => ({ leave: c.pid ? 0 : 1, morale: 4, lift: 8, depart: c.pid ? [{ who: c.pid, cause: 'walked out into the country alone at dawn, preaching' }] : [] }) },
      bad: { text: (s, c) => `They listen politely, and then they walk. You watch them go until they are too small to count. The search party a month later finds a ring of stones and nothing else.`, fx: (s, c) => ({ leave: c.pid ? c.n - 1 : c.n, depart: c.pid ? [{ who: c.pid, cause: 'led the Walk out past the wire' }] : [], morale: -4, lift: -4, chron: `${cap1(num(c.n))} people walked out of the colony into the country, and did not come back.` }) } },
    { label: 'Let them go, with packs, water and a rifle', note: 'They will not survive it. They might.', hint: 'unknown', info: [['yield', 'An end to the preaching'], ['danger', 'The walkers, and the children'], ['danger', 'A month of food']],
      out: { text: (s, c) => `They take the packs, because you insist, and walk out holding hands at sunrise. Afterwards the pod lines are quiet at night. People sleep better, and are ashamed of it.`, fx: (s, c) => ({ leave: c.pid ? c.n - 1 : c.n, depart: c.pid ? [{ who: c.pid, cause: 'walked out at the head of the Walk, with a pack and a rifle' }] : [], food: -80, morale: 2, lift: 4, chron: `${cap1(num(c.n))} people walked out of the colony with ${c.name || 'a preacher'}.` }) } },
    { label: 'Break it up. The preacher goes in the cells', dark: true, note: 'The watch, at four in the morning, before they reach the wire.', hint: 'unknown', info: [['yield', 'Every hand kept'], ['danger', 'The preacher'], ['danger', 'What the followers decide you are']],
      out: { text: (s, c) => `The watch meets them in the pod lines with lamps and staves. It is short and loud and nobody is killed. ${c.name || 'The preacher'} spends the season in a cargo pod, and preaches through the door.`, fx: (s, c) => ({ stain: ['prophet_jailed', 1], tension: 8, morale: -2, mark: c.pid ? [c.pid, 'jailed', 'was locked up for preaching the Walk'] : null }) } },
    { label: 'Let them go. Keep the children', dark: true, note: 'Nobody gets to take a child out to die. The parents can choose.', hint: 'unknown', info: [['yield', 'The children kept'], ['danger', 'The parents'], ['danger', 'The children, who will remember the gate']],
      out: { text: (s, c) => `The watch takes the children at the gate. Most of the parents turn back for them; four do not. The children are put in the schoolroom bunks, and some of them watch the gate for a long time.`, fx: (s, c) => ({ leave: 4, stain: ['kept_children', 3], morale: -1, tension: 6 }) } },
  ] });
LF.TAGS['ebb.walk'] = ['open mercy', 'free', 'order severe', 'severe order'];

/* The ones who walked out come back, thinner and armed, for what is in the stores. */
add({ id: 'ebb.walkers', arc: 'ebb', gap: 35, view: 'world', tone: 'crisis', title: 'The Ones Who Left', w: 3, repeat: 320,
  when: s => low(s, 22) && (s.deserted || 0) >= 4,
  setup: s => { const p = here(s, 'security'); return Object.assign(ctxOf(p), { n: Math.min(s.deserted, 14) }); },
  text: (s, c) => `${cap1(num(c.n))} of the ones who walked out are at the wire, thin, weathered and armed with whatever they left with. They don't want to come back in. They want food, a quarter of the store, and they will take it if it is not given.\n\n${c.name ? `${c.first} is on the wall with the rifles. "I know every one of them, and I know which one goes for the gate first. Say the word."` : 'The watch is on the wall, and some of them are looking at their own cousins.'}`,
  choices: [
    { label: 'Open the gate. Take them back in', note: 'They come in as colonists, and the ones who stayed share with the ones who left.', hint: 'unknown', info: [['yield', 'Hands back, and no blood'], ['danger', 'The stores'], ['danger', 'The ones who stayed']],
      out: { text: (s, c) => `The gate opens and they come in slowly, as if it were a trick. That night they eat at their own table. Within a month the tables have mixed, mostly.`, fx: (s, c) => ({ pop: c.n, food: -120, morale: 4, lift: 6, tension: 6, do: s2 => { s2.deserted = Math.max(0, s2.deserted - c.n); } }) } },
    { label: 'Hold the wire. Fire if they come over it', dark: true, note: 'They are your own people, and they are not bluffing.', hint: 'unknown', info: [['yield', 'The store, untouched'], ['danger', 'The ones at the wire'], ['danger', 'Whoever is on the wall']],
      test: { base: 52, mods: [R('security', 15), Fl('crackdown', 6, 'The watch has done this before'), If(s => !!(s.cargo && s.cargo.arms), 8, 'The arms locker')] },
      ok: { text: (s, c) => `They come over the wire at dusk and the watch fires. Three fall, and the rest go back the way they came, carrying two of them. The third is buried inside the wire, by the people who knew them.`, fx: (s, c) => ({ stain: ['walkers_shot', 2], morale: -2, tension: -4, do: s2 => { s2.deserted = Math.max(0, s2.deserted - 3); } }) },
      bad: { text: (s, c) => `They come over the wire at dusk, and the watch hesitates, and that is enough. They are into the store and out again before the shooting starts properly.${c.name ? ` ${c.name} is killed on the wall.` : ''}`, fx: (s, c) => ({ food: -260, stain: ['walkers_shot', 1], kill: c.pid ? [{ who: c.pid, cause: 'killed on the wall when the ones who left came back for the store' }] : [], pop: c.pid ? 0 : -1, morale: -5, lift: -4 }) } },
    { label: 'Give them what they ask, and let them go', note: 'A quarter of the store, carried to the wire by the ones who stayed.', hint: 'unknown', info: [['yield', 'No blood'], ['danger', 'A quarter of the store'], ['danger', 'Next time']],
      out: { text: 'The sacks are carried out to the wire and left. They take them without a word. People inside the wire watch them go, doing the sums on the next winter.', fx: s => Object.assign(grabbed(s, 0.25), { morale: -2, flags: { ebb_paid: (s.flags.ebb_paid || 0) + 1 } }) } },
    { label: 'Take them back, and put the ringleaders in the cells for a year', dark: true, note: 'Most come in. Two do not get to come in as colonists.', hint: 'unknown', info: [['yield', 'Hands back, and order'], ['danger', 'The two in the cells']],
      out: { text: (s, c) => `The gate opens. The watch takes the two at the front by the arms as they come through. The rest come in quietly, and eat quietly, and do not look at the cell door.`, fx: (s, c) => ({ pop: Math.max(0, c.n - 2), food: -100, stain: ['walkers_jailed', 1], morale: 2, lift: 3, tension: -2, do: s2 => { s2.deserted = Math.max(0, s2.deserted - c.n); } }) } },
  ] });
LF.TAGS['ebb.walkers'] = ['mercy open', 'severe closed', 'mercy cautious', 'order'];

/* ============================== THREATS: below a tenth ============================== */
/* The long night: people taking their own lives, and the clinic asking what to do about it. */
add({ id: 'ebb.night', arc: 'ebb', gap: 35, view: 'people', tone: 'crisis', title: 'The Long Night', w: 3.2, repeat: 260,
  when: s => low(s, 12) && s.pop >= 16,
  setup: s => { const p = here(s, 'doctor') || here(s, 'command'); return Object.assign(ctxOf(p), { seat: p && p.seat, n: 2 + (s.flags.ebb_lost ? 1 : 0) }); },
  text: (s, c) => `${cap1(num(c.n))} in a fortnight, by their own hand. The last one was a teenager.\n\n${c.name ? `${c.first} hasn't slept. "I can't watch all of them. ${c.seat === 'command' ? "I can't post a guard on every one." : "I don't know which ones to watch."} ${c.seat === 'doctor' ? "There's something in the clinic that would help. You won't like it, and I'm not sure I do either." : c.seat === 'command' ? "The clinic has something that would hold them. Ask the doctor what it costs." : "There's stuff in the clinic. Ask the doctor what it'd do."}"` : 'The clinic has run out of things to say about it.'}`,
  choices: [
    { label: 'Nobody alone, ever: everyone sleeps in pairs, the watch walks the pods', note: 'Every bunk paired, every door open, every night. The work slows and nobody has a minute to themselves.', hint: 'unknown', info: [['yield', 'Fewer lost'], ['danger', 'The work'], ['danger', 'Anyone who needed a door to shut']],
      out: { text: 'The doors come off the pods. The watch walks the lines with lamps, all night, every night. Nobody dies that month. People are tired and short with each other, and alive.', fx: { progress: -0.08, morale: 2, lift: 6, tension: 3 } } },
    { label: 'Dose the water. A little, for everyone', dark: true, note: (s, c) => `Nobody is asked. ${c.seat === 'doctor' ? c.first + ' measures it out, and will carry that.' : 'The clinic measures it out.'}`, hint: 'unknown', info: [['yield', 'A calmer colony, quickly'], ['danger', 'Everyone, without asking'], ['danger', 'Whoever measures it']],
      out: { text: 'It goes into the water tank on a Tuesday. By the weekend the colony is calm and slow and a little vague, and people laugh at things in a way that is not quite right. Nobody else dies that season.', fx: (s, c) => ({ stain: ['dosed_all', 2], morale: 8, lift: 12, progress: -0.05, flags: { ebb_dosed: s.day }, off: c.pid && c.seat === 'doctor' ? [[c.pid, 'mind', -10]] : [] }) } },
    { label: 'Say it plainly at muster, and read out their names', note: 'Everyone will hear the word nobody has been saying.', hint: 'unknown', info: [['yield', 'The truth said'], ['danger', 'One more, probably'], ['danger', 'Everyone who has to hear it']],
      out: { text: 'You read the names at muster and say what happened to them. Nobody moves. Afterwards people stand around in twos and threes, which they have not done for months. There is one more before the season turns.', fx: { pop: -1, morale: -2, hum: 2, lift: 3 } } },
    { label: 'Write them in the record as walkers, and keep the number off the board', dark: true, note: 'Nobody hears the count, so the count can\'t spread. The families know.', hint: 'unknown', info: [['yield', 'Nobody counting'], ['danger', 'The dead, and their families'], ['danger', 'The next ones']],
      out: { text: 'The record says they walked out. The board says nothing. The families are told what the record says, and say nothing back. Two more walk out that season, or something like it.', fx: { pop: -2, stain: ['hidden_dead', 1], morale: 3, lift: 2 } } },
  ] });
LF.TAGS['ebb.night'] = ['mercy cautious', 'order severe', 'open', 'closed'];

/* Knives in the mess hall: the colony turns on itself over a ladle. */
add({ id: 'ebb.knives', arc: 'ebb', gap: 35, view: 'colony', tone: 'crisis', title: 'Knives in the Mess Hall', w: 3.6, repeat: 240,
  when: s => low(s, 10) && s.pop >= 20,
  setup: s => { const p = someone(s), q = here(s, 'security'); return Object.assign(ctxOf(p), { watch: q ? q.first : null, n: crowd(s, 0.15, 5, 16) }); },
  text: (s, c) => `It started over a ladle. ${c.name || 'A loader from the yard'} put a knife into a cook's arm, and in a minute the whole hall was on its feet and taking sides. ${c.watch ? `${c.watch} got the doors shut` : 'The watch got the doors shut'} with everyone still inside.\n\nAbout ${num(c.n)} of them want the officers out and the stores opened. The rest want the knife-holder hanged.`,
  choices: [
    { label: 'Open the reserve. Everyone eats tonight, as much as they like', note: 'A quarter of what is in the bins, in one night.', hint: 'unknown', info: [['yield', 'Full plates, and the knives put away'], ['danger', 'A quarter of the store'], ['danger', 'Next winter']],
      out: { text: 'The bins are opened and the cooks are told to keep going until people stop asking. They don\'t stop until two in the morning. Nobody mentions the knife again, and nobody forgets it.', fx: s => Object.assign(grabbed(s, 0.25), { morale: 9, lift: 10, tension: -8 }) } },
    { label: (s, c) => `Hang ${c.first || 'the one with the knife'} in the yard, tonight`, dark: true, note: 'It ends now. The colony learns how arguments end from here on.', hint: 'unknown', info: [['yield', 'It ends tonight'], ['danger', (s, c) => c.name || 'The one with the knife'], ['danger', 'Everyone who watches']],
      out: { text: (s, c) => `${c.name || 'The loader'} is hanged from the crane in the yard at midnight, by lamplight, with everyone made to watch. The hall is cleared in silence. Nobody raises a voice at a meal for a long time after.`, fx: (s, c) => ({ kill: c.pid ? [{ who: c.pid, cause: 'hanged in the yard for a knife in the mess hall' }] : [], pop: c.pid ? 0 : -1, stain: ['yard_hanging', 2], tension: -14, morale: 4, lift: 6, flags: { crackdown: true } }) } },
    { label: 'Split the colony. The angry ones get their own camp and their own share', dark: true, note: 'A fence through the middle, and a share of the store on each side of it.', hint: 'unknown', info: [['yield', 'Peace, of a kind'], ['danger', 'Everyone who now has a fence between them'], ['danger', 'A fifth of the store']],
      out: { text: (s, c) => `By the end of the week there is a fence of salvaged plate across the pod lines and ${num(c.n)} people on the far side of it, with their own fire and a fifth of the store. Families are split across it. Some talk through the fence at night.`, fx: s => Object.assign(grabbed(s, 0.2), { leave: crowd(s, 0.15, 5, 16), morale: 6, lift: 8, tension: -10, flags: { ebb_split: s.day }, chron: 'The colony split in two, with a fence between.' }) } },
    { label: 'Sit down in the hall with them, and stay until it is talked out', note: 'All night, with the doors shut and the knife on the table. It might go the other way.', hint: 'unknown', info: [['yield', 'A colony that has said it all out loud'], ['danger', 'You, and anyone near the knife']],
      test: { base: 42, mods: [R('command', 16), R('doctor', 6), If(s => !!s.flags.council, 6, 'There is a Council to answer to')] },
      ok: { text: 'You sit in the middle of the hall with the knife on the table in front of you, and let them shout. Around four in the morning the shouting turns into talking. By breakfast there is a list on the wall of what has to change, and it is not unreasonable.', fx: { morale: 7, lift: 10, tension: -10 } },
      bad: { text: 'They shout, and you listen, and around two in the morning somebody picks the knife up off the table. It is over in seconds. When the lamps are lit again there are two on the floor.', fx: { pop: -2, morale: -5, lift: -4, tension: 10 } } },
  ] });
LF.TAGS['ebb.knives'] = ['mercy', 'severe order', 'free', 'open free'];

/* ============================== WAYS OUT ============================== */
/* The council is asked straight out what would lift the colony, and every answer costs. Three ways are dealt from
   what the colony has to spend, always one that costs a life; refusing is always there. */
const WAYS = ['goat', 'lot', 'volunteer', 'feast', 'enemy', 'pit', 'truth', 'vote', 'wake'];
const goatOf = s => here(s, 'crew') || here(s, 'security') || here(s, 'engineer') || here(s, 'doctor') || here(s, 'scientist');
const volOf = s => (LF.cast && LF.cast(s, { val: 'bold', free: true })) || someone(s);
const canWay = {
  goat: s => !!goatOf(s), lot: s => s.pop >= 20, volunteer: s => !!volOf(s),
  feast: s => h.foodDays(s) > 50, enemy: s => !!neighbour(s), pit: s => s.pop >= 24,
  truth: () => true, vote: s => !s.flags.council && !s.flags.committee,
  wake: s => s.sleepers >= 20 && canSleep(s),
};
add({ id: 'ebb.ways', arc: 'ebb', urgent: true, view: 'people', tone: 'council', title: 'What Would Lift Them', w: 4, repeat: 150,
  when: s => low(s, 20) && !!s.flags.ebb_on && s.day - s.flags.ebb_on >= 45 && s.pop >= 16,
  setup: s => {
    const ok = WAYS.filter(k => canWay[k](s)), take = (pool) => { const a = pool.filter(k => ok.includes(k) && !got.includes(k)); if (a.length) got.push(LF.spick(s, a)); };
    const got = []; take(['goat', 'lot', 'volunteer']); take(['feast', 'truth', 'vote', 'wake']); take(['enemy', 'pit', 'goat', 'lot']);
    const p = here(s, 'command') || here(s, 'crew'), g = goatOf(s), v = volOf(s), nb = neighbour(s);
    return Object.assign(ctxOf(p), { ways: got, gpid: g && g.id, gname: g && g.name, gfirst: g && g.first, gseat: g && g.seat, vpid: v && v.id, vname: v && v.name, vfirst: v && v.first, nb: nb && nb.id, nbName: nb && nb.name });
  },
  text: (s, c) => `${c.name ? c.name : 'The officers'} ${c.name ? 'calls' : 'call'} the council to the mess hall after dark. The colony isn't going to make it like this, and everyone in the room knows it: the work is half done, people are leaving, and the ones who stay have stopped believing.\n\n${c.name ? (LF.officer(s, 'command') || {}).id === c.pid ? `"Something has to change, and it has to be big enough that they feel it. There are three ideas. Pick one," ${c.first} says.` : `"Something has to change," ${c.first} says. "Something big enough that they feel it. I've heard three ideas. You won't like any of them."` : 'Three ideas come out of the room. Nobody likes any of them.'}`,
  choices: [
    { show: (s, c) => c.ways.includes('goat'), label: (s, c) => `Give them someone to blame. ${c.gname} answers for all of it`, dark: true, note: (s, c) => `A trial with one verdict, and the gantry after. The ${LF.SEATS[c.gseat].name} seat stays empty for good.`, hint: 'unknown',
      info: [['yield', 'A clean slate, in their eyes'], ['danger', (s, c) => c.gname], ['danger', 'Every officer who watches it']],
      out: { text: (s, c) => `The trial takes an afternoon. ${c.gname} says very little, and at the end looks at you, once. In the morning the colony goes back to work like people who have been let off something.`,
        fx: (s, c) => ({ kill: [{ who: c.gpid, cause: 'tried and hanged as the one to blame for the colony\'s troubles' }], stain: ['ebb_goat', 3], morale: 14, lift: 22, tension: -14, floor: 28, chron: `${c.gname} was hanged to give the colony someone to blame.` }) } },
    { show: (s, c) => c.ways.includes('lot'), label: 'Draw lots. One walks out into the dark country, for all of them', dark: true, note: 'An old idea, from an older world. Everyone draws, the officers too. It will not stay a one-off.', hint: 'unknown',
      info: [['yield', 'Something shared, and a rite'], ['danger', 'Whoever draws the short straw'], ['danger', 'Every lean year after this']],
      out: { text: 'Everyone draws, in the mess hall, from a sack. The short straw goes to a quiet hand from the laundry, who looks at it for a long time. At dusk the whole colony walks the laundry hand to the wire and sings. In the morning people are kind to each other in a way they haven\'t been for a year.',
        fx: s => ({ pop: -1, stain: ['ebb_lot', 3], hum: -4, morale: 10, lift: 20, floor: 26, flags: { ebb_rite: s.day, ebb_rites: (s.flags.ebb_rites || 0) + 1 }, chron: 'The colony drew lots, and sent one of its own out into the dark for the rest.' }) } },
    { show: (s, c) => c.ways.includes('volunteer'), label: (s, c) => `Let ${c.vname} go: alone, into the far country, to find them a reason`, note: (s, c) => `${c.vfirst} offered, before anyone asked. There's no plan to bring ${c.vfirst} back.`, hint: 'unknown',
      info: [['yield', 'Hope, and the map'], ['danger', (s, c) => c.vname]],
      out: { text: (s, c) => `${c.vname} walks out at dawn with a radio and a month of food. For six weeks the radio calls in every evening, and the whole colony stops to listen: ridges, rivers, a valley nobody has seen. Then one evening it doesn't call in. People still stop at that hour.`,
        fx: (s, c) => ({ depart: c.vpid ? [{ who: c.vpid, cause: 'walked out alone into the far country to give the colony hope, and did not come back' }] : [], pop: c.vpid ? 0 : -1, survey: 40, morale: 10, lift: 16, hum: 2, chron: `${c.vname} walked out alone to find the colony a reason to go on.` }) } },
    { show: (s, c) => c.ways.includes('feast'), label: 'One great feast. Open the stores', note: 'A third of the bins, in a night. It will be remembered, and so will the winter after.', hint: 'unknown',
      info: [['yield', 'A night they will talk about for years'], ['danger', 'A third of the store'], ['danger', 'The next hungry month']],
      out: { text: 'Every table out in the open, every lamp lit, everything good in the store cooked at once. Somebody finds a fiddle. It goes on until the sun comes up, and for a month afterwards people hum at work.', fx: s => Object.assign(grabbed(s, 0.33), { morale: 11, lift: 14 }) } },
    { show: (s, c) => c.ways.includes('enemy'), label: (s, c) => `Give them an enemy: tell them ${c.nbName} are why it's gone wrong`, dark: true, note: 'It isn\'t true, and it will work. They will hear what is being said about them.', hint: 'unknown',
      info: [['yield', 'A colony pulled together'], ['danger', (s, c) => c.nbName], ['danger', 'Whoever is at the wire when they answer']],
      out: { text: (s, c) => `You say it at muster, and it catches like dry grass. Within a week there are drills at the wire, songs about ${c.nbName}, and nobody talking about going home. Across the valley, they hear about it.`,
        fx: (s, c) => ({ fops: c.nb ? [{ id: c.nb, accord: -35, threat: 16 }] : [], stain: ['ebb_enemy', 1], morale: 12, lift: 18, tension: -6, chron: `The colony was told ${c.nbName} were to blame for its troubles.` }) } },
    { show: (s, c) => c.ways.includes('pit'), label: 'The pit: let the angry ones fight it out, every rest-day, in front of everyone', dark: true, note: 'Bare hands, until one stays down. Volunteers, at first.', hint: 'unknown',
      info: [['yield', 'Anger with somewhere to go'], ['danger', 'Whoever goes in the pit'], ['danger', 'What the children learn there']],
      out: { text: 'A ring is dug behind the stores and the first two volunteers go in on the rest-day. The whole colony comes to watch, and shouts itself hoarse. By the end of the season someone has died in it, and there is a waiting list.', fx: { pop: -1, stain: ['pit', 2], morale: 10, lift: 14, tension: -12, flags: { ebb_pit: true } } } },
    { show: (s, c) => c.ways.includes('truth'), label: 'Stand on a table and tell them everything: how bad, and what you mean to do', note: 'No comfort in it. If they don\'t believe you, it will be worse than saying nothing.', hint: 'unknown',
      info: [['yield', 'Trust, if they believe you'], ['danger', 'What is left of your standing']],
      test: { base: 44, mods: [R('command', 18), If(s => s.hum >= 60 || s.hum === undefined, 8, 'They still think you are decent'), If(s => !!s.flags.crackdown, -10, 'They remember the watch')] },
      ok: { text: 'You tell them all of it, the stores and the dead and the machines, and then what happens next, in order. When you finish nobody claps. They go back to work, and the next morning more of them turn out than have for months.', fx: { morale: 12, lift: 16, hum: 2 } },
      bad: { text: 'You tell them everything, and halfway through somebody laughs, and then more of them. You finish to a half-empty hall.', fx: { morale: -6, lift: -6, tension: 6 } } },
    { show: (s, c) => c.ways.includes('vote'), label: 'Hand them a vote. A council of their own, with real power', note: 'Your officers answer to it from now on. Some of them will not take that well.', hint: 'unknown',
      info: [['yield', 'A colony with a say'], ['danger', 'Your officers\' authority'], ['danger', 'Every hard order, from now on']],
      out: { text: 'The first council is elected by a show of hands in the mess hall, eleven people, three of whom have never spoken at a meeting. Its first act is to cut the officers\' rations to match everyone else\'s.', fx: s => ({ flags: { council: true }, morale: 10, lift: 12, off: here(s, 'security') ? [[here(s, 'security').id, 'mind', -6]] : [], chron: 'The colony was given a council of its own.' }) } },
    { show: (s, c) => c.ways.includes('wake'), label: 'Wake new faces. Twenty down from orbit, now', note: 'New people, who haven\'t been through it, and twenty more mouths.', hint: 'unknown',
      info: [['yield', 'Fresh hands and fresh hope'], ['danger', 'The stores'], ['danger', 'The lander']],
      out: { text: 'The lander comes down full of people blinking at the sky, asking questions nobody has asked for a year. They are tiresome and cheerful and it is catching.', fx: { fly: 1, sleepers: -20, pop: 20, morale: 8, lift: 12 } } },
    { label: 'None of it. Hold on and wait for better', note: 'Nothing is spent, and nothing changes. The colony will notice that too.', hint: 'unknown', info: [['danger', 'Everyone, for longer'], ['danger', 'The ones who will walk']],
      out: { text: 'The meeting breaks up with nothing decided. By morning the whole colony knows there was a meeting and nothing came of it.', fx: { morale: -3, lift: -3 } } },
  ] });
LF.TAGS['ebb.ways'] = ['severe order', 'severe', 'bold mercy', 'mercy free', 'closed', 'severe free', 'open', 'free', 'bold', 'cautious'];

/* The rite comes back: a colony that drew lots once wants to draw again when the next bad season comes. */
add({ id: 'ebb.rite', arc: 'ebb', view: 'people', tone: 'pressure', title: 'The Short Straw', urgent: true, w: 9, repeat: 150, gap: 20,   // w 4 until 2026-11-17: its window is narrow and it went unfired on 1,200 games once there were five dreads
  when: s => !!s.flags.ebb_rite && s.day - s.flags.ebb_rite >= 120 && s.morale < 30 && !LF.aloft(s) && s.pop >= 16,
  setup: s => { const p = someone(s); return Object.assign(ctxOf(p), { pen: s.flags.pen || 0 }); },
  text: (s, c) => `The sack is hanging on the mess hall door again. Nobody admits to hanging it there. ${c.name || 'A crew lead'} comes to ask what everyone is asking: is it time.\n\n"It worked last time," ${c.first || 'the crew lead'} says. "Everyone says it worked."`,
  choices: [
    { label: 'Draw again', dark: true, note: 'It becomes what the colony does when it is frightened.', hint: 'unknown', info: [['yield', 'What worked last time'], ['danger', 'Whoever draws it'], ['danger', 'Every lean season after this']],
      out: { text: 'They draw. The short straw is the oldest of the workshop crew, who seems almost relieved. The colony sings at the wire again, and knows the words this time.', fx: s => ({ pop: -1, stain: ['ebb_lot', 2], morale: 8, lift: 16, flags: { ebb_rite: s.day, ebb_rites: (s.flags.ebb_rites || 0) + 1 }, chron: 'The colony drew lots again.' }) } },
    { show: (s, c) => c.pen > 0, label: 'Draw from the pen, not from the colony', dark: true, note: 'The rite with nobody inside the wire at risk. Everyone will understand what the pen is for now.', hint: 'unknown', info: [['yield', 'The rite, at no cost to anyone who counts'], ['danger', 'The one from the pen']],
      out: { text: 'The sack is taken to the pen instead. The colony still walks the one who draws it to the wire, and sings, and the singing is louder than before.', fx: s => ({ pen: -1, stain: ['ebb_lot_pen', 2], morale: 6, lift: 12, flags: { ebb_rite: s.day } }) } },
    { label: 'Burn the sack. It ends with the last one', note: 'You will be the one who took the comfort away.', hint: 'unknown', info: [['yield', 'An end to it'], ['danger', 'The mood, badly'], ['danger', 'You']],
      out: { text: 'You burn it in the mess hall stove in front of whoever is there. Nobody says anything. That week two people walk out past the wire, and one of them leaves a straw on your door.', fx: { morale: -8, lift: -6, leave: 2, hum: 3, tension: 8, flags: { ebb_rite: 0 } } } },
  ] });
LF.TAGS['ebb.rite'] = ['severe', 'severe closed', 'mercy'];

/* Phrases for the deeds above (LF.worst, the epilogue). */
if (LF.DEEDS) Object.assign(LF.DEEDS, {
  wrong_one: 'confining the wrong person for sabotage', despair_locked: 'locking up the people who said the colony was finished',
  punished_all: 'punishing a whole crew for one saboteur', put_under: 'putting people into the cryo banks against their will',
  prophet_jailed: 'jailing a preacher', kept_children: 'taking the walkers\' children at the gate', walkers_shot: 'shooting the ones who came back',
  walkers_jailed: 'jailing the ones who came back', dosed_all: 'drugging the whole colony through the water', hidden_dead: 'hiding the colony\'s suicides',
  yard_hanging: 'a hanging in the yard', ebb_goat: 'hanging an officer to give the colony someone to blame', ebb_lot: 'sending people out to die by lot',
  ebb_lot_pen: 'feeding the lot from the pen', ebb_enemy: 'blaming the neighbours for the colony\'s troubles', pit: 'the fighting pit',
});
})();

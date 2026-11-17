/* Landfall — the six officers (Lachlan, 2026-11-15; DESIGN.md "The six officers").
   Six seats: Command, Security, Engineer, Doctor, Scientist, Crew, one officer each (LF.CAST). Three come down with the first flight; each shuttle run after that brings one more. A seat's
   officer makes its department work (LF.dept): their weight is in every test that names the office, and in the
   colony's daily arithmetic. An officer away with a party, hurt or still in orbit is missed. One who dies is
   not replaced at once: the seat is empty, and what needed it is closed (LF.seatGone), until six months on the player
   may promote a named colonist into it (off.promote, LF.promote; Lachlan, 2026-11-16), at half weight for the first year.
   The old ten role keys still work everywhere (LF.SEAT_OF): 'geologist' and 'xenobio' both reach the Scientist.
   No DOM. Draws use LF.srand. */
(function () {
'use strict';
const { clamp } = LF;
LF.SEATS = {
  command:   { name: 'Command',  deputy: 'acting commander', crew: 'the command staff', perk: 'speaker',
               does: 'Holds the colony together: steadier morale, fewer walking out, better odds when terms are made.' },
  security:  { name: 'Security', deputy: 'security deputy', crew: 'the watch', perk: 'marksman',
               does: 'Keeps the wire: fewer deaths from what is out there, better odds whenever force is used.' },
  engineer:  { name: 'Engineering', deputy: 'engineering deputy', crew: 'the engineering crew', perk: 'fixer',
               does: 'Keeps the ship\'s machines alive longer and puts buildings up faster.' },
  doctor:    { name: 'Medical',  deputy: 'medical deputy', crew: 'the medical team', perk: 'medic',
               does: 'Fewer die of the place itself, and better odds against anything that sickens.' },
  scientist: { name: 'Science',  deputy: 'science deputy', crew: 'the survey team', perk: 'observer',
               does: 'Works out what things are, sooner: better odds whenever something is studied.' },
  crew:      { name: 'Works',    deputy: 'works deputy', crew: 'the work crews', perk: 'steady',
               does: 'Bigger harvests and more materials from the same hands.' },
};
LF.SEAT_ORDER = ['command', 'security', 'engineer', 'doctor', 'scientist', 'crew'];
/* Which seat answers for each of the old offices. */
LF.SEAT_OF = { pilot: 'command', teacher: 'command', security: 'security', engineer: 'engineer', physician: 'doctor', chaplain: 'doctor',
  xenobio: 'scientist', geologist: 'scientist', botanist: 'crew', quartermaster: 'crew',
  command: 'command', doctor: 'doctor', scientist: 'scientist', crew: 'crew' };
// The seat keys can be used wherever a role key can (R('doctor', 10), N(s, 'command')).
Object.assign(LF.ROLES, { command: { title: 'Commander', crew: 'the command staff' }, doctor: { title: 'Doctor', crew: 'the medical team' },
  scientist: { title: 'Scientist', crew: 'the survey team' }, crew: { title: 'Crew Chief', crew: 'the work crews' } });

/* The cast: six officers, the same people every game (Lachlan, 2026-11-15, second pass: no alternates; if they die,
   they die, and the seat is empty). Each has a personality the player can read on the People view (nature) and a way
   of talking that every line they speak keeps to (DESIGN.md "The six officers", the voice table). role: the old office
   whose tables (expedition leads, leanings) this person uses. vals: two convictions on the colony's axes; want: a key
   of society.js WANTS. key: the portrait (art/scenes/cast_<key>.webp). */
const C = (key, first, last, title, role, trait, vals, want, nature, perks) => ({ key, first, last, title, role, trait, vals, want, nature, perks: perks || [] });
LF.CAST = {
  command: [C('solheim', 'Marit', 'Solheim', 'Flight Commander', 'pilot', 'stubborn', { free: -1, mercy: -1 }, 'build',
    'Marit is decisive and driven, and will protect the colony\'s survival at any cost, including the cost of the people in it. Decides fast, never apologises, and keeps a count of the dead that nobody else is allowed to see. Wants the colony built up so far that it never has to ask anyone\'s permission to survive.', ['pathfinder'])],
  security: [C('dahl', 'Kasimir', 'Dahl', 'Security Chief', 'security', 'bitter', { open: -1, mercy: -1 }, 'justice',
    'Kasimir is suspicious of everything that moves and most things that do not, and hides it behind a gallows joke. Believes the planet is trying to kill them and that most people would sell out their neighbour for a blanket. Somebody has to be the bastard, and Kasimir would rather it was someone who doesn\'t enjoy it.')],
  engineer: [C('kovacs', 'Bashir', 'Kovacs', 'Chief Mechanic', 'engineer', 'stubborn', { bold: -1, open: -1 }, 'quiet',
    'Bashir is gruff, tired and almost always right about how long a machine has left. Hates speeches, waste and being rushed, and talks about the ship\'s machines as if they were old dogs. Gruff with everyone, and the first to take your night shift so you can sleep.')],
  doctor: [C('nakamura', 'Amara', 'Nakamura', 'Surgeon', 'physician', 'beloved', { mercy: 1, free: 1 }, 'kin',
    'Amara is warm with patients and furious with everyone else. Will not let a life be traded away without a fight, says so to your face, and has been known to ignore an order and dare you to do something about it. Wants a house with too many chairs at the table, and people in all of them.', ['survivor'])],
  scientist: [C('yurbin', 'Gerad', 'Yurbin', 'Xenobiologist', 'xenobio', 'brilliant', { open: 1, bold: 1 }, 'know',
    'Gerad is obsessive, delighted and slightly dangerous. Would trade a season of safety for one real answer about this world, talks too fast, and has stopped hearing the word no. Knows the danger better than anyone, and has worked out that never finding out costs more.')],
  crew: [C('estrada', 'Tavi', 'Estrada', 'Agronomist', 'botanist', 'devout', { mercy: 1, bold: -1 }, 'build',
    'Tavi is quiet, devout and stubborn about fairness. Talks to the crops, keeps the old fasts, and will do any amount of work without complaint, but turn on the weakest and Tavi turns on you. Builds slow so it only gets built once, and would rather everyone ate thinner than the old went short.')],
};
/* The crew file: a few lines on each, shown two at a time before the voyage out (the dossier, js/ui.js; Lachlan, 2026-11-17). */
LF.BIO = {
  solheim: 'Flew freight to the outer stations for twenty years and never lost a hull. Decides fast and does not apologise for it. She keeps a small notebook that nobody else is allowed to read.',
  dahl: 'Ran security on the launch docks, and has the scar through his eyebrow to show for it. Trusts nobody, makes a joke of it, and checks every lock on the ship twice a night. Whatever is about to go wrong, he has already thought about it.',
  kovacs: 'Helped build the Ariadne and has been fixing her ever since. Gruff, tired, and almost always right about how long a machine has left. Left a daughter on Earth, and will take your night shift without being asked.',
  nakamura: 'A trauma surgeon who signed on the day the manifest opened. Gentle with anyone in a bed, and hard on everyone standing beside it. She has ignored orders before, and will tell you so herself.',
  yurbin: 'Has waited his whole life to see something alive that did not come from Earth. Talks too fast, forgets to eat, and stopped hearing the word no some years ago. The jars in the wardroom are his.',
  estrada: 'Grew up on a farm the sea took, and has carried its seed with him since. Quiet and devout, keeps the old fasts, and talks to the plants in the hydroponics bay. He will do any work without complaint, and will not stand by while the weak go short.',
};
/* How an officer is named where the player picks one to send (Lachlan, 2026-11-17): the office first, so a seat that has
   changed hands shows at a glance. "Scientist (Gerad)". */
LF.SEAT_SHORT = { command: 'Commander', security: 'Security', engineer: 'Engineer', doctor: 'Doctor', scientist: 'Scientist', crew: 'Crew Chief' };
LF.seatTag = p => p && p.seat && p.role ? `${LF.SEAT_SHORT[p.seat]} (${p.first})` : p ? p.name : '';
function seatPerson(s, seat, n) { const c = LF.CAST[seat][n];
  const p = { id: 'p' + s.people.length, key: c.key, first: c.first, last: c.last, name: c.first + ' ' + c.last, role: c.role, seat, title: c.title, trait: c.trait,
    alive: true, green: false, marks: {}, perks: [LF.SEATS[seat].perk].concat(c.perks.filter(k => k !== LF.SEATS[seat].perk)), deeds: [], known: s.day || 1,
    nature: c.nature, vals: Object.assign({}, c.vals), want: c.want, loyal: 55, arcs: [], seen: {}, body: 100, mind: 100, native: 5 };
  s.people.push(p); return p; }
/* Seat the six. Called once, at LF.land. */
LF.makeOfficers = function (s) { for (const seat of LF.SEAT_ORDER) seatPerson(s, seat, 0); };
/* A seat whose officer is dead or finished. Nobody steps up (Lachlan, 2026-11-15): the seat is empty for good. */
LF.seatGone = (s, k) => { const seat = LF.SEAT_OF[k] || k; return !LF.officer(s, seat) && s.people.some(p => p.seat === seat); };
LF.seatFill = function (s) {
  for (const seat of LF.SEAT_ORDER) { const S = LF.SEATS[seat], h = LF.officer(s, seat);
    // An officer aboard when the lander is lost is not coming down, and the department below goes without.
    if (h && h.orbit && s.machines.lander && s.machines.lander.lost && !h.stranded) { h.stranded = s.day; LF.log(s, `${h.name} is still aboard the ${s.world.ship}, and with the lander gone will stay there.`, 'bad'); LF.chron(s, `${h.name} was left aboard the ship for good.`); }
    if (LF.officer(s, seat) || s.flags['empty_' + seat]) continue;
    s.flags['empty_' + seat] = s.day; LF.storyPoint(s);
    LF.log(s, `Nobody is left who can run ${S.name}. What it did, the colony now does badly or does without.`, 'bad'); LF.chron(s, `${S.name} was left with nobody to run it.`); }
};
const seatOf = k => LF.SEAT_OF[k] || k;
/* Promotion (Lachlan, 2026-11-16): six months after a seat empties, a named colonist can be put in it. For their first
   year they are worth half what an officer is (LF.green): half the weight on a test, half the department's lift. */
LF.PROMOTE_AFTER = 6 * LF.MONTH;
LF.SEAT_TITLE = { command: 'Commander', security: 'Security Chief', engineer: 'Chief Engineer', doctor: 'Doctor', scientist: 'Scientist', crew: 'Crew Chief' };
LF.green = (s, p) => !!(p && p.promoted && s.day - p.promoted < LF.YEAR);
LF.promote = function (s, p, seat) {
  if (!p || !p.alive || LF.officer(s, seat)) return null;
  Object.assign(p, { role: LF.CAST[seat][0].role, seat, title: LF.SEAT_TITLE[seat], promoted: s.day, known: p.known || s.day || 1, away: false, orbit: false });
  if (p.body === undefined) p.body = 100; if (p.mind === undefined) p.mind = 100; if (p.native === undefined) p.native = 5 + 3 * (p.deeds || []).length;
  p.seen = p.seen || {}; p.marks = p.marks || {}; p.perks = p.perks || []; if (!p.perks.includes(LF.SEATS[seat].perk)) p.perks.push(LF.SEATS[seat].perk);
  delete s.flags['empty_' + seat];
  LF.log(s, `${p.name} is ${LF.SEAT_TITLE[seat]} now.`, 'good'); LF.chron(s, `${p.name} was raised to ${LF.SEAT_TITLE[seat]}, in the seat left empty.`);
  return p; };
/* Put an officer out of the chair (2026-11-17): handed on, relieved, or left aboard for good. They stay in the colony
   as someone with a name. now: the colony already has someone in mind, so The Empty Chair comes at once. */
LF.vacate = function (s, p, mark, txt, now) {
  if (!p || !p.alive || !p.role) return; const seat = p.seat;
  p.role = null; p.marks = p.marks || {}; p.marks[mark] = { d: s.day, txt }; p.perks = p.perks || []; if (!p.perks.length) p.perks.push('steady');
  s.flags['empty_' + seat] = now ? s.day - LF.PROMOTE_AFTER : s.day; delete s.flags['nopromote_' + seat];
  LF.log(s, `${p.name} is no longer ${LF.SEAT_TITLE[seat]}.`, ''); LF.storyPoint(s); };
/* The seat's officer, whatever has become of them (dead, in orbit, away); null once nobody holds the office. */
LF.officer = (s, k) => { const seat = seatOf(k); return s.people.find(p => p.seat === seat && p.role && p.alive) || null; };
/* here: on the ground and at work. hurt: laid up. away: with a party. orbit: not yet brought down.
   empty: nobody holds the office, for good (LF.seatGone). */
LF.seatState = function (s, k) { const p = LF.officer(s, k);
  return !p ? 'empty' : p.orbit ? 'orbit' : p.away ? 'away' : LF.laidUp && LF.laidUp(s, p) ? 'hurt' : 'here'; };
/* How well a department runs, 0 to 1. The colony's balance is set with all six at work. */
// orbit is 0.7 with the signals room built (WO-3): the department is run by radio all day, not eleven minutes a pass
const DEPT = { here: 1, hurt: 0.6, away: 0.5, orbit: 0.5, empty: 0.7 };   // empty: whoever is to hand runs it, badly (no alternates since 2026-11-15)
LF.dept = function (s, k) { if (!s.people.some(p => p.seat)) return 1; const st = LF.seatState(s, k), p = LF.officer(s, k);
  // An officer who is ill or coming apart runs it badly; one who has learned this world runs it better than the ship ever taught.
  if (st === 'here' && LF.green(s, p)) return DEPT.empty + (1 - DEPT.empty) / 2;   // new to the post: half of what an officer adds
  return (st === 'orbit' && LF.has(s, 'comms') ? 0.7 : DEPT[st]) * (st === 'here' ? (p.body < 30 || p.mind < 25 ? 0.8 : 1) * (1 + (p.native || 0) / 400) : 1); };
LF.inOrbit = s => s.people.filter(p => p.seat && p.alive && p.orbit);
/* An officer comes down with a shuttle run. */
LF.bringDown = function (s, p) { if (!p || !p.orbit) return; p.orbit = false; p.away = false; p.down = s.day; p.known = p.known || 1;
  LF.log(s, `${p.name}, ${p.title}, is down from the ship.`, 'good'); };
/* What a seat is called on a card when its officer cannot be named. */
LF.seatWord = function (s, k) { const seat = seatOf(k); return (LF.ROLES[k] || LF.SEATS[seat]).crew; };
/* One line for the People view and the roster: where each officer is, and what it costs. */
LF.seatLine = function (s, seat) { const p = LF.officer(s, seat), st = LF.seatState(s, seat), S = LF.SEATS[seat];
  if (st === 'empty') return LF.seatGone(s, seat) ? `Nobody is left to run ${S.name}. Anything that needs it is closed to you.` : `${S.name} has nobody at its head.`;
  if (st === 'orbit') return p.stranded ? `${p.name} is aboard the ${s.world.ship} for good. ${S.name} below is run by whoever is to hand.` : `${p.name} is aboard the ${s.world.ship}, keeping the ship. ${S.name} is short-handed below until a shuttle run brings ${p.first} down.`;
  if (st === 'away') return `${p.name} is away with a party, and ${S.name} is at half strength until ${p.first} is back.`;
  if (st === 'hurt') return `${p.name} is laid up for ${LF.monthsWord((p.hurt - s.day) / LF.MONTH)} more.`;
  return ''; };
/* The colony's officers in a sentence or two: what the People view opens with. */
LF.rosterLine = function (s) {
  const st = LF.SEAT_ORDER.map(k => [k, LF.seatState(s, k), LF.officer(s, k)]), names = a => a.map(x => x[2].first), and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
  const here = st.filter(x => x[1] === 'here'), orbit = st.filter(x => x[1] === 'orbit'), away = st.filter(x => x[1] === 'away'), hurt = st.filter(x => x[1] === 'hurt'), dep = st.filter(x => x[1] === 'empty'), out = [];
  if (here.length === 6) out.push('All six of your officers are at their posts.');
  else if (here.length) out.push(`${and(names(here))} ${here.length === 1 ? 'is' : 'are'} at ${here.length === 1 ? 'post' : 'their posts'}.`);
  else out.push('Not one of your officers is at their post.');
  if (away.length) out.push(`${and(names(away))} ${away.length === 1 ? 'is' : 'are'} out past the wire with a party.`);
  if (hurt.length) out.push(`${and(names(hurt))} ${hurt.length === 1 ? 'is' : 'are'} laid up.`);
  if (orbit.length) out.push(`${and(names(orbit))} ${orbit.length === 1 ? 'is' : 'are'} still aboard the ${s.world.ship}${s.machines.lander && s.machines.lander.lost ? ', and with the lander gone will stay there' : ''}.`);
  if (dep.length) out.push(`${and(dep.map(x => LF.SEATS[x[0]].name))} ${dep.length === 1 ? 'has' : 'have'} nobody left to run ${dep.length === 1 ? 'it' : 'them'}.`);
  return out.join(' ');
};
/* ---------- what the place does to them, and what they learn from it ----------
   Three numbers an officer carries, 0 to 100, shown only in words (Lachlan, 2026-11-15, second pass).
   experience (p.native): how well they know this world. It starts near nothing and is the one the player wants to
     raise: it grows at the post, faster out past the wire, and whenever they are sent in person. It adds to every test
     their office is in and to how well the department runs. It dies with them.
   health (p.body) and nerve (p.mind) start whole and all but never come back. Hunger, wounds and a missing doctor
     take health; crises, dark orders, deaths and failure in person take nerve. Low, they cost on every test. At
     nothing the officer is dead (health) or finished (nerve: out of office). A card comes before the end of each
     (content-officers.js), and those cards hold the only real ways to buy any back. */
LF.STATS = {
  native: { name: 'Experience', words: [[75, 'knows this world like home'], [50, 'knows this world well'], [25, 'learning this world'], [0, 'new to this world']] },
  body:   { name: 'Health', words: [[70, 'sound'], [40, 'worn down'], [20, 'unwell'], [0, 'failing']] },
  mind:   { name: 'Nerve', words: [[70, 'steady'], [45, 'on edge'], [25, 'frayed'], [0, 'coming apart']] },
};
LF.statWord = (p, k) => LF.STATS[k].words.find(w => (p[k] || 0) >= w[0])[1];
LF.expBonus = p => Math.floor((p.native || 0) / 20);   // 0 to 5 on any test their office is in
LF.offMods = function (s, p) { const out = [], e = LF.expBonus(p);
  if (e) out.push({ k: 'native', v: e, label: `${p.first} ${LF.statWord(p, 'native')}` });
  if (p.body < 20) out.push({ k: 'body', v: -5, label: `${p.first} is failing` }); else if (p.body < 40) out.push({ k: 'body', v: -3, label: `${p.first} is unwell` });
  if (p.mind < 25) out.push({ k: 'mind', v: -6, label: `${p.first} is coming apart` }); else if (p.mind < 45) out.push({ k: 'mind', v: -3, label: `${p.first} is frayed` });
  return out; };
/* Move one of the three. who: a person, a pid, or a seat or old role key. Says so on the card when the word changes. */
LF.shift = function (s, who, k, d, chips) {
  const p = typeof who === 'string' ? (who[0] === 'p' && LF.h.byPid(s, who)) || LF.officer(s, who) : who;
  if (!p || !p.alive || !p.role || p.orbit || p[k] === undefined || !d) return;
  const w0 = LF.statWord(p, k); p[k] = clamp(p[k] + d, 0, 100); const w1 = LF.statWord(p, k);
  if (w1 !== w0 && chips) chips.push({ t: `${p.first} ${k === 'native' ? w1 : 'is ' + w1}`, good: d > 0 });
  if (k === 'mind' && p.mind < 25 && !p.seen.broke && LF.byId['off.break']) { p.seen.broke = s.day; s.sched.push({ id: 'off.break', day: s.day + 2 }); }
  if (k === 'body' && p.body < 20 && !p.seen.sick && LF.byId['off.sick']) { p.seen.sick = s.day; s.sched.push({ id: 'off.sick', day: s.day + 2 }); }
  // At nothing: the body gives out, or the officer is finished and the office passes on.
  if (k === 'body' && p.body <= 0) { LF.killPerson(s, p, 'worn out by the first years here'); if (chips) chips.push({ t: `${p.name} dead`, good: false }); }
  else if (k === 'mind' && p.mind <= 0) { p.role = null; p.marks.broken = { d: s.day, txt: `was ${p.title} until it could not be borne any longer` }; s.vacancies.push({ role: null, seat: p.seat, day: s.day + 3 });
    LF.log(s, `${p.name} has put down the office and will not take it up again.`, 'bad'); LF.chron(s, `${p.name}, ${p.title}, could not go on.`); if (chips) chips.push({ t: `${p.name} can no longer serve`, good: false }); }
};
const seated = s => s.people.filter(p => p.seat && p.role && p.alive && !p.orbit && p.body !== undefined);
LF.seated = seated;
/* Once a month. Experience grows; health and nerve only wear. */
LF.officerTick = function (s) {
  if (s.day % LF.MONTH || !s.world) return;
  const heat = LF.heat ? LF.heat(s) : 0, m = Math.round(s.day / LF.MONTH);
  for (const p of seated(s)) {
    LF.shift(s, p, 'native', p.away ? 3 : 1);
    const b = (s.res.food <= 0 ? 4 : 0) + (LF.lean(s) && m % 2 === 0 ? 1 : 0) + (LF.dept(s, 'doctor') < 0.6 && m % 3 === 0 ? 1 : 0) + (LF.harsh(s) && !s.built.housing && m % 3 === 0 ? 1 : 0);
    if (b) LF.shift(s, p, 'body', -b);
    const n = (heat >= 2 ? 1 : heat === 1 && m % 2 === 0 ? 1 : 0) + (s.morale < 25 && m % 2 === 0 ? 1 : 0);
    if (n) LF.shift(s, p, 'mind', -n);
  }
};
/* What a decision does to the officers who were there for it. Called from LF.choose and LF.chooseGen. */
LF.officerAfter = function (s, o, chips) {
  // Whoever went in person on a tested option is not fit to go again for a while (LF.SENT_REST; a month more after a failure), and it takes a little out of them every time.
  if (o.ok !== null) for (const id of o.sent || []) { const p = LF.h.byPid(s, id); if (!p || !p.alive) continue; p.spent = s.day + LF.SENT_REST + (o.ok === false ? LF.MONTH : 0); LF.shift(s, p, 'body', -3, chips); }
  for (const p of seated(s)) { if (p.away) continue; const sent = (o.sent || []).includes(p.id);
    let m = 0;
    if (o.crisis && s.day % 2) m -= 1;
    if (o.dark && p.vals && p.vals.mercy === 1) m -= 1;   // an order like that costs the ones who hold that nobody is spare
    if (o.ok === false && sent) m -= 5;
    if (o.dead) m -= 1;
    if (m) LF.shift(s, p, 'mind', m, sent || m <= -4 ? chips : null);
    if (sent) LF.shift(s, p, 'native', o.ok === false ? 3 : 6, chips);
  }
};
})();

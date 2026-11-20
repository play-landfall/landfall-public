/* Landfall — the six officers (Lachlan, 2026-11-15; DESIGN.md "The six officers").
   Six seats: Command, Security, Engineer, Doctor, Scientist, Crew, one officer each (LF.CAST). Three come down with the first flight; each shuttle run after that brings one more. A seat's
   officer makes its department work (LF.dept): their weight is in every test that names the office, and in the
   colony's daily arithmetic. An officer away with a party, hurt or still in orbit is missed. One who dies is
   not replaced at once: the seat is empty, and what needed it is closed (LF.seatGone), until the seat's other officer,
   who has been deputy on the ground since landfall, may be given the chair (off.promote, LF.seatAlt; Lachlan, 2026-11-18:
   twelve key crew, two a seat, and never a named colonist). Once both are gone the seat is empty for good.
   The old ten role keys still work everywhere (LF.SEAT_OF): 'geologist' and 'xenobio' both reach the Scientist.
   No DOM. Draws use LF.srand. */
(function () {
'use strict';
const { clamp } = LF;
LF.SEATS = {
  command:   { name: 'Command', lead: 'Flight Commander', second: 'First Officer', deputy: 'acting commander', crew: 'the command staff', perk: 'speaker',
               does: 'Holds the colony together: steadier morale, fewer walking out, better odds when terms are made.' },
  security:  { name: 'Security', lead: 'Chief of Security', second: 'Security Warden', deputy: 'security deputy', crew: 'the watch', perk: 'marksman',
               does: 'Keeps the wire: fewer deaths from what is out there, better odds whenever force is used.' },
  engineer:  { name: 'Engineering', lead: 'Chief Engineer', second: 'Second Engineer', deputy: 'engineering deputy', crew: 'the engineering crew', perk: 'fixer',
               does: 'Keeps the ship\'s machines alive longer and puts buildings up faster.' },
  doctor:    { name: 'Medical', lead: 'Head Surgeon', second: 'Medical Officer', deputy: 'medical deputy', crew: 'the medical team', perk: 'medic',
               does: 'Fewer die of the place itself, and better odds against anything that sickens.' },
  scientist: { name: 'Science', lead: 'Lead Scientist', second: 'Senior Xenobiologist', deputy: 'science deputy', crew: 'the survey team', perk: 'observer',
               does: 'Works out what things are, sooner: better odds whenever something is studied.' },
  crew:      { name: 'Works', lead: 'Chief Agronomist', second: 'Hydroponics Lead', deputy: 'works deputy', crew: 'the work crews', perk: 'steady',
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

/* The cast: twelve key crew, two a seat (Lachlan, 2026-11-18). The title is the chair's, not the person's (Lachlan, 2026-11-19): whoever holds it has the seat's lead title (LF.SEATS[seat].lead), and the other is its second (second), who takes the chair if the first is lost. One of the two holds the chair from the start
   (s.cast[seat], LF.castPick); the other is assumed to be on the ground as the department's deputy, and is not a person in
   s.people until the chair comes to them (LF.seatAlt). Each has a personality the player can read on the People view (nature) and a way
   of talking that every line they speak keeps to (DESIGN.md "The six officers", the voice table). role: the old office
   whose tables (expedition leads, leanings) this person uses. vals: two convictions on the colony's axes; want: a key
   of society.js WANTS. key: the portrait (art/scenes/cast_<key>.webp). */
const C = (key, first, last, role, trait, vals, want, nature, perks) => ({ key, first, last, role, trait, vals, want, nature, perks: perks || [] });
LF.CAST = {
  command: [C('solheim', 'Jane', 'Haddy', 'pilot', 'stubborn', { free: -1, mercy: -1 }, 'build',
    'Jane is decisive and driven, and will protect the colony\'s survival at any cost, including the cost of the people in it. Decides fast, never apologises, and keeps a count of the dead that nobody else is allowed to see. Wants the colony built up so far that it never has to ask anyone\'s permission to survive.', ['pathfinder']),
    C('achebe', 'Lucas', 'McMurray', 'pilot', 'beloved', { open: 1, free: 1 }, 'justice',
    'Lucas is fair and open, and expects people to do their jobs. Asks before he tells, uses your first name, and backs a decision he handed to you even when it goes wrong. Gives anyone a second chance and nobody a third, and is slow to believe the worst of someone he trusts.')],
  security: [C('dahl', 'Nolan', 'Edney', 'security', 'bitter', { open: -1, mercy: -1 }, 'justice',
    'Nolan is suspicious of everything that moves and most things that do not, and hides it behind a gallows joke. Believes the planet is trying to kill them and that most people would sell out their neighbour for a blanket. Somebody has to be the bastard, and Nolan would rather it was someone who doesn\'t enjoy it.'),
    C('zulu', 'Toby', 'O\'Neal', 'security', 'cautious', { mercy: 1, bold: -1 }, 'kin',
    'Toby takes the job seriously and takes the people under him more seriously than that. Watches the wire and what is out past it, and thinks the best of the people inside. Knows every one of the watch by name and who they go home to, tells you who is hurt before he tells you what happened, and would sooner go out past the wire himself than send one of them on a guess. Doesn\'t joke about it.')],
  engineer: [C('kovacs', 'Jeremy', 'Donadini', 'engineer', 'stubborn', { bold: -1, open: -1 }, 'quiet',
    'Jeremy is gruff, tired and almost always right about how long a machine has left. Hates speeches, waste and being rushed, and talks about the ship\'s machines as if they were old dogs. Gruff with everyone, and the first to take your night shift so you can sleep.'),
    C('halloran', 'Roberta', 'Craigie', 'engineer', 'reckless', { bold: 1, open: 1 }, 'build',
    'Roberta is loud, cheeky and foul-mouthed, and cannot stand a job half done. Wants every repair made properly, to gauge and with the right part, and swears at anything held together with wire, including whoever wired it. Jokes hardest when she is frightened, and stops joking when it is serious.')],
  doctor: [C('nakamura', 'Andrea', 'Tete', 'physician', 'beloved', { mercy: 1, free: 1 }, 'kin',
    'Andrea is warm with patients and furious with everyone else. Will not let a life be traded away without a fight, says so to your face, and has been known to ignore an order and dare you to do something about it. Wants a house with too many chairs at the table, and people in all of them.', ['survivor']),
    C('brandt', 'Lou', 'Chang', 'physician', 'stubborn', { open: 1, bold: -1 }, 'quiet',
    'Lou is acerbic and usually right, about the patient and about whoever is asking after the patient. Cares whether they get better and whether it spreads, and leaves how they feel about it to others. Tells you the prognosis you did not want in as few words as it takes, then sits up all night with the case. Is kinder in what he does than in anything he says.')],
  scientist: [C('yurbin', 'Mac', 'O\'Hagan', 'xenobio', 'brilliant', { open: 1, bold: 1 }, 'know',
    'Mac is obsessive, delighted and slightly dangerous. Would trade a season of safety for one real answer about this world, talks too fast, and has stopped hearing the word no. Knows the danger better than anyone, and has worked out that never finding out costs more.'),
    C('iyer', 'Michelle', 'Yin', 'xenobio', 'brilliant', { bold: 1, mercy: -1 }, 'know',
    'Michelle wants results the colony can use, and is not much interested in how they are come by. Composed, exact and never raises her voice; counts a death as a cost like any other and will tell you whether the answer was worth it. Does not always say what she has already started.')],
  crew: [C('estrada', 'Samuel', 'Barlow', 'botanist', 'devout', { mercy: 1, bold: -1 }, 'build',
    'Samuel is quiet, devout and stubborn about fairness. Talks to the crops, keeps the old fasts, and will do any amount of work without complaint, but turn on the weakest and Samuel turns on you. Builds slow so it only gets built once, and would rather everyone ate thinner than the old went short.'),
    C('waititi', 'Hamond', 'Shepherd', 'botanist', 'gentle', { free: 1, mercy: 1 }, 'sleepers',
    'Hamond is loud, generous and funny, and knows everybody\'s business because everybody tells him. Promises more than the fields can deliver, wraps bad news in a joke, and cannot keep a secret. Will joke about anything except who eats last. His wife is still asleep aboard.')],
};
/* The crew file: a few lines on each, shown two at a time before the voyage out (the dossier, js/ui.js; Lachlan, 2026-11-17). */
LF.BIO = {
  solheim: 'Twenty years flying freight and never lost a hull. Decides fast, never apologises, and keeps a notebook nobody else may read.',
  dahl: 'Has a scar through one eyebrow from the launch docks. Trusts nobody, makes a joke of it, and checks every lock twice a night.',
  kovacs: 'Helped build the Ariadne and has fixed her ever since. Gruff, and right about how long a machine has left. Left a daughter on Earth.',
  nakamura: 'Signed on the day the manifest opened. Gentle with anyone in a bed, hard on everyone beside it, and has ignored orders before.',
  yurbin: 'Has waited his whole life to see something alive that is not from Earth. Talks too fast, forgets to eat. The jars in the wardroom are his.',
  estrada: 'Grew up on a farm the sea took, and carries its seed. Quiet, devout, talks to the plants, and will not stand by while the weak go short.',
  achebe: 'Fifteen years second in command on the long liners, where nobody went unheard and nobody missed a deadline twice. Fair, open, and remembers what you said you would do.',
  zulu: 'The youngest of the key crew. Brought every one of his people home from the Ceres lockdown, and still writes to the families of the ones he trained.',
  halloran: 'A hull inspector who failed more ships than she passed, and was right about every one of them. Loud, foul-mouthed, and will not put her name to a bodge. The Ariadne got her signature at the third attempt.',
  brandt: 'Thirty years of other people\'s bad news, delivered straight. Short with fools, shorter with himself, and has never once left a ward early.',
  iyer: 'Lost her chair at Singapore over a trial that worked. Composed, exact, and of the view that an answer is worth what it cost.',
  waititi: 'Fed a refugee camp of forty thousand off salt flats and talked the whole time. Knows everyone by the second day.',
};
/* The crew file's pages: who is shown together. */
LF.FILE_PAGES = [{ name: 'Command staff', seats: ['command', 'security'] }, { name: 'Science', seats: ['doctor', 'scientist'] }, { name: 'Crew', seats: ['engineer', 'crew'] }];
/* The crew file's facts (Lachlan, 2026-11-17): age at departure, where from, and a short record. */
LF.FILE = {
  solheim: { age: 52, from: 'North American Union', record: ['MSc in orbital mechanics, Purdue', 'Eleven years captain of the Tern', 'Flew the Callisto relief run'] },
  dahl: { age: 37, from: 'Britannic Commonwealth', record: ['Eight years, Royal Marines', 'Security chief, Kourou docks', 'Found the bomb on the Meridian'] },
  kovacs: { age: 46, from: 'North American Union', record: ['Huntsville yards at seventeen', 'Led the Ariadne\'s drive refit', 'Rebuilt her coolant loop in orbit'] },
  nakamura: { age: 42, from: 'Southern African Union', record: ['Medicine, Eduardo Mondlane, Maputo', 'Trauma surgeon, Johannesburg', 'Ran the Beira flood hospital'] },
  yurbin: { age: 33, from: 'European Federation', record: ['PhD in astrobiology at twenty-six', 'Two winters on the Antarctic drills', 'Wrote the Ariadne\'s quarantine rules'] },
  estrada: { age: 34, from: 'Pacific Compact', record: ['PhD in plant science, Adelaide', 'Bred the Murray salt wheat', 'Kept Ceres fed a year on battery'] },
  achebe: { age: 51, from: 'Pacific Compact', record: ['Merchant flight school, Auckland', 'First officer of the Kestrel', 'Crew chief, the Luna to Mars liners'] },
  zulu: { age: 29, from: 'North American Union', record: ['Five years, Orbital Guard', 'Watch officer, Ceres lockdown', 'Trained the Ariadne\'s watch'] },
  halloran: { age: 38, from: 'Britannic Commonwealth', record: ['Toolmaker\'s apprentice, Glasgow', 'Chief inspector, Ceres dry dock', 'Signed off the Ariadne\'s drive'] },
  brandt: { age: 55, from: 'Pearl River League', record: ['Medicine, Sun Yat-sen, Guangzhou', 'Twenty years of emergency wards', 'Ship\'s doctor on the Mars run'] },
  iyer: { age: 47, from: 'Straits Federation', record: ['Chair of xenobiology, Singapore', 'Led the Europa brine trials', 'Resigned the chair; no reason filed'] },
  waititi: { age: 40, from: 'Mediterranean League', record: ['Agronomy, Montpellier', 'Fed the Sfax camps off salt flats', 'Ran the Ariadne\'s seed vault'] },
};
/* He, she or they (2026-11-18): four seats can be held by a man or a woman, so a line that needs a pronoun for a seat's
   officer asks who holds it. Anyone who is not one of the twelve is "they". */
const SHE = ['solheim', 'nakamura', 'halloran', 'iyer'];
const pro = (p, she, he, they) => { const r = p && p.rk && LF.ROSTER && LF.ROSTER[p.rk]; if (r && r.sex) return r.sex === 'f' ? she : he;   // a roster colonist (js/roster.js) is who the portrait shows
  return !p || !p.key || !LF.BIO[p.key] ? they : SHE.includes(p.key) ? she : he; };
LF.he = p => pro(p, 'she', 'he', 'they'); LF.him = p => pro(p, 'her', 'him', 'them'); LF.his = p => pro(p, 'her', 'his', 'their');
/* A line for whoever holds the seat and is at the post to say it: lines is { castkey: line } (a string, or a function of
   the person); plain is what the card says when the one in the chair has no line of their own, or nobody is there. */
LF.says = function (s, k, lines, plain) { const p = LF.officer(s, k), l = p && p.key && LF.seatState(s, k) === 'here' ? lines[p.key] : null, v = l !== null && l !== undefined ? l : plain;
  return typeof v === 'function' ? v(p) : v || ''; };
/* Alternates whose pictures in art/scenes/ still show the people those keys used to be (the old alternates, cut
   2026-11-15). The local art session repaints them; take a key out of this list when its files have landed. Until then
   the UI gives that officer a stand-in face and the plain scene. */
LF.UNPAINTED = [];   // emptied 2026-11-20: all six alternates' scenes (`<scene>@<key>`) have landed
/* The same for the portraits alone (cast_<key>, _hollow, _old, _old_hollow, _ship): they land hours before the scenes, and
   the player picks the crew from them (Lachlan, 2026-11-18). The local art session takes a key out when all five are in. */
LF.UNPAINTED_FACES = [];
/* How an officer is named where the player picks one to send (Lachlan, 2026-11-17): the office first, so a seat that has
   changed hands shows at a glance. "Scientist (Mac)". */
LF.SEAT_SHORT = { command: 'Commander', security: 'Security', engineer: 'Engineer', doctor: 'Doctor', scientist: 'Scientist', crew: 'Crew Chief' };
LF.seatTag = p => p && p.seat && p.role ? `${LF.SEAT_SHORT[p.seat]} (${p.first})` : p ? p.name : '';

/* What each of the twelve is good at (Lachlan, 2026-11-19): one strength each, all on different parts of the game, so the crew
   pick is a pick of how to play. No weaknesses. Each holds while that officer has the chair and is at work on the ground
   (seatState 'here'): nothing aboard the ship, laid up or away.
   15% each (Lachlan, 2026-11-19: one size, said as a percentage), but for the three that are worth far more in play (2026-11-19,
   measured one by one with EDGE= in the sim): builds, trouble inside the wire and harvests 5%. Each pair is balanced
   on its own (ALTSEAT=<seat> EDGE=<key> in the sim). fx, each a multiplier: build (founding build labour),
   morale (the morale target), wear (machine wear on the ground), insight (what study learns), grow (field harvests), births
   (LF.BIRTH_MODS), hum (humanity lost, LF.humMove), extract (materials dug). odds: rel, a share of the chance already worked
   out, added as a line in LF.odds, on a test that names that seat (seat), and for Security on which side of the wire the trouble is
   (where: 'in' or 'out', LF.inside). */
LF.EDGE = {
  solheim:  { up: 'Crews dig 15% more materials', fx: { extract: 1.15 } },
  achebe:   { up: 'Hard choices cost the colony 15% less humanity', fx: { hum: 0.85 } },
  dahl:     { up: '5% better odds putting down trouble inside the wire', odds: [{ seat: 'security', where: 'in', rel: 0.05, l: 'knows who to lean on' }] },
  zulu:     { up: '15% better odds against threats from outside the wire', odds: [{ seat: 'security', where: 'out', rel: 0.15, l: 'keeps the watch together' }] },
  kovacs:   { up: 'Buildings go up 5% quicker', fx: { build: 0.95 } },
  halloran: { up: 'Machines degrade 15% slower', fx: { wear: 0.85 } },
  nakamura: { up: '15% more children born', fx: { births: 1.15 } },
  brandt:   { up: '15% better odds on medical work', odds: [{ seat: 'doctor', rel: 0.15, l: 'reads the case right' }] },
  yurbin:   { up: 'Understands mysteries 15% faster', fx: { insight: 1.15 } },
  iyer:     { up: '15% better odds on science work', odds: [{ seat: 'scientist', rel: 0.15, l: 'wants a result' }] },
  estrada:  { up: 'Harvests 5% bigger', fx: { grow: 1.05 } },
  waititi:  { up: 'Morale 15% higher', fx: { morale: 1.15 } },
};
const EDGE_X = { build: 1, wear: 1, insight: 1, grow: 1, births: 1, hum: 1, extract: 1, morale: 1 };
const edgeOn = s => !s.world || LF.aloft(s) ? [] : LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(p => p && p.key && LF.EDGE[p.key] && LF.seatState(s, p.seat) === 'here');
LF.edge = (s, k) => { let v = EDGE_X[k] ? 1 : 0; for (const p of edgeOn(s)) { const x = (LF.EDGE[p.key].fx || {})[k]; if (x !== undefined) v = EDGE_X[k] ? v * x : v + x; } return v; };
/* Trouble inside the wire: the colony's own people (unrest, mutiny, a faction, a culprit among them), as against what comes
   from outside it. By the card's arc, its id, or a generated card's group (a faction). */
const IN_ARC = ['politics', 'state', 'th.knife', 'th.eaters', 'th.lie', 'th.faith', 'th.charter', 'th.web'];
const IN_ID = /^(pol\.|state\.unrest|aft\.blame|eat\.|knf\.|ch\.|lim\.(compound|stew|count2|shepherd2)|qk\.(door|term)|os\.mole|body\.|kid\.lock|gen\.(outside|wire)|ebb\.(sand|walkers)|tg\.penfeeds|bu\.comms|late\.born|wk\.tenants)/;
LF.inside = function (s, c) { if (c && c.f && c.f.kind) return c.f.kind === 'faction';
  const id = s.cur && s.cur.id, st = id && LF.byId[id]; return !!id && (IN_ID.test(id) || !!(st && IN_ARC.includes(st.arc))); };
LF.edgeMods = function (s, test, c, only) { if (test.aboard) return []; const out = [], on = edgeOn(s).filter(p => !only || p === only); if (!on.length) return out;
  const seats = (test.mods || []).filter(m => m.k === 'role').map(m => LF.SEAT_OF[m.role] || m.role);
  if (test.ap === 'force' && !seats.includes('security')) seats.push('security');   // force is the watch's work, named or not
  let inside = null;
  for (const p of on) for (const o of LF.EDGE[p.key].odds || []) { if (!seats.includes(o.seat)) continue;
    if (o.where) { if (inside === null) inside = LF.inside(s, c); if ((o.where === 'in') !== inside) continue; }
    out.push({ label: `${p.first} ${o.l}`, rel: o.rel }); }
  return out; };
function seatPerson(s, seat, n) { const c = LF.CAST[seat][n];
  const p = { id: 'p' + s.people.length, key: c.key, first: c.first, last: c.last, name: c.first + ' ' + c.last, role: c.role, seat, title: LF.SEATS[seat].lead, trait: c.trait,
    alive: true, green: false, marks: {}, perks: [LF.SEATS[seat].perk].concat(c.perks.filter(k => k !== LF.SEATS[seat].perk)), deeds: [], known: s.day || 1,
    nature: c.nature, vals: Object.assign({}, c.vals), want: c.want, loyal: 55, arcs: [], seen: {}, body: 100, mind: 100, native: 5 };
  s.people.push(p); return p; }
/* Which of a seat's two holds the chair at the start: a hash of the seed, never s.rng. LF.ALT_START is how often it is
   the second (0 until every card has a line for both and the voyage out has cards for them; then 0.5). */
LF.ALT_START = 0;
const hash = (seed, k) => { let x = ((seed | 0) ^ 0x9e3779b9) >>> 0; for (const ch of k) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995) >>> 0; return ((x ^ (x >>> 15)) >>> 0) / 4294967296; };
LF.castPick = (s, seat) => (s.cast && s.cast[seat] !== undefined ? s.cast[seat] : hash(s.seed, 'cast.' + seat) < LF.ALT_START ? 1 : 0);
/* Seat the six. Called once, at LF.land. */
LF.makeOfficers = function (s) { s.cast = s.cast || {}; for (const seat of LF.SEAT_ORDER) { s.cast[seat] = LF.castPick(s, seat); seatPerson(s, seat, s.cast[seat]); } };
/* The seat's other officer, if the chair has not come to them yet: the deputy. null once both have held it. */
LF.altOf = (s, k) => { const seat = seatOf(k), had = s.people.filter(p => p.seat === seat && p.key).map(p => p.key); return LF.CAST[seat].find(c => !had.includes(c.key)) || null; };
/* Who had the chair last, how they left it and when. */
const outDay = p => p.left || p.died || Math.max(0, ...Object.values(p.marks || {}).map(m => m.d || 0));
LF.lastHeld = (s, k) => { const seat = seatOf(k); return s.people.filter(p => p.seat === seat && (!p.alive || !p.role)).sort((a, b) => outDay(b) - outDay(a))[0] || null; };
LF.outDay = outDay;
/* When the deputy may be given the chair (Lachlan, 2026-11-18). Lost on the crossing: at landfall. Given the door (relieved,
   stood down, handed on, nerve gone, put out of the colony by your order): a month. Dead or missing: a year. */
const DOOR = /exile|put out|sent out|cast out|walked to the markers/;
LF.altWait = function (s, k) { const g = LF.lastHeld(s, k);
  if (!g || g.fell) return 0;
  return (g.alive && !g.left) || (g.left && DOOR.test(g.cause || '')) ? LF.MONTH : LF.YEAR; };
LF.altDue = (s, k) => { const seat = seatOf(k); return s.flags['due_' + seat] !== undefined ? s.flags['due_' + seat] : s.flags['empty_' + seat] || 0; };
/* Whether the chair can still be filled, now or later. */
LF.altOpen = (s, k) => { const seat = seatOf(k); return !LF.officer(s, seat) && !!LF.altOf(s, seat) && !s.flags['nopromote_' + seat] && !s.flags.born_rule; };
/* A seat whose officer is dead or finished. Nobody steps up (Lachlan, 2026-11-15): the seat is empty for good. */
LF.seatGone = (s, k) => { const seat = LF.SEAT_OF[k] || k; return !LF.officer(s, seat) && s.people.some(p => p.seat === seat); };
LF.seatFill = function (s) {
  for (const seat of LF.SEAT_ORDER) { const S = LF.SEATS[seat], h = LF.officer(s, seat);
    // An officer aboard when the lander is lost is not coming down, and the department below goes without.
    if (h && h.orbit && s.machines.lander && s.machines.lander.lost && !h.stranded) { h.stranded = s.day; LF.log(s, `${h.name} is still aboard the ${s.world.ship}, and with the lander gone will stay there.`, 'bad'); LF.chron(s, `${h.name} was left aboard the ship for good.`); }
    if (LF.officer(s, seat) || s.flags['empty_' + seat]) continue;
    const g = LF.lastHeld(s, seat), a = LF.altOf(s, seat);
    s.flags['empty_' + seat] = s.day; s.flags['due_' + seat] = (g ? Math.max(outDay(g), 1) : s.day) + LF.altWait(s, seat); LF.storyPoint(s);
    if (a) LF.log(s, `${S.name} has nobody in the chair. ${a.first} ${a.last}, the deputy, is keeping it running.`, 'bad');
    else { LF.log(s, `Nobody is left who can run ${S.name}. What it did, the colony now does badly or does without.`, 'bad'); LF.chron(s, `${S.name} was left with nobody to run it.`); } }
};
const seatOf = k => LF.SEAT_OF[k] || k;
/* The chair comes to the deputy (Lachlan, 2026-11-18). They came on the ship and have worked the department since
   landfall, so they are not new to the post: they know this world about half as well as time on it would have taught the
   one in the chair. LF.green is only true of a colonist promoted in a save from before. */
LF.SEAT_TITLE = Object.fromEntries(Object.entries(LF.SEATS).map(([k, S]) => [k, S.lead]));   // the chair's title (2026-11-19)
LF.green = (s, p) => !!(p && p.promoted && s.day - p.promoted < LF.YEAR);
LF.seatAlt = function (s, k) { const seat = seatOf(k), c = LF.altOf(s, seat);
  if (!c || LF.officer(s, seat)) return null;
  const p = seatPerson(s, seat, LF.CAST[seat].indexOf(c));
  Object.assign(p, { alt: true, seated: s.day, known: s.day || 1, native: clamp(5 + Math.round((s.day - (s.landed || 0)) / LF.MONTH * 0.6), 5, 45) });
  for (const f of ['empty_', 'due_', 'nopromote_']) delete s.flags[f + seat];
  if (LF.societyInit) LF.societyInit(s);
  LF.log(s, `${p.name} is ${LF.SEAT_TITLE[seat]} now.`, 'good'); LF.chron(s, `${p.name}, who had been ${LF.SEATS[seat].second}, took the ${LF.SEAT_TITLE[seat]}'s chair.`);
  return p; };
/* Put an officer out of the chair (2026-11-17): handed on, relieved, or left aboard for good. They stay in the colony
   as someone with a name. The deputy can have the chair a month on (The Empty Chair). */
LF.vacate = function (s, p, mark, txt, now) {
  if (!p || !p.alive || !p.role) return; const seat = p.seat;
  p.role = null; p.marks = p.marks || {}; p.marks[mark] = { d: s.day, txt }; p.perks = p.perks || []; if (!p.perks.length) p.perks.push('steady');
  s.flags['empty_' + seat] = s.day; s.flags['due_' + seat] = s.day + LF.MONTH; delete s.flags['nopromote_' + seat];
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
  LF.log(s, `${p.name}, ${LF.title(p)}, is down from the ship.`, 'good'); };
/* What a seat is called on a card when its officer cannot be named. */
LF.seatWord = function (s, k) { const seat = seatOf(k); return (LF.ROLES[k] || LF.SEATS[seat]).crew; };
/* One line for the People view and the roster: where each officer is, and what it costs. */
LF.seatLine = function (s, seat) { const p = LF.officer(s, seat), st = LF.seatState(s, seat), S = LF.SEATS[seat];
  if (st === 'empty') { const a = LF.altOpen(s, seat) && LF.altOf(s, seat), w = a ? LF.altDue(s, seat) - s.day : 0;
    if (a) return `${a.first} ${a.last}, the deputy, is keeping ${S.name} running, and can be given the chair ${w <= 0 ? 'now' : 'in ' + LF.monthsWord(Math.ceil(w / LF.MONTH))}. Until then anything that needs its officer is closed to you.`;
    return LF.seatGone(s, seat) ? `Nobody is left to run ${S.name}. Anything that needs it is closed to you.` : `${S.name} has nobody at its head.`; }
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
LF.expBonus = p => (p.native || 0) >= 80 ? 10 : (p.native || 0) >= 40 ? 5 : 0;   // on any test their office is in: 0, 5 or 10 (the odds go in steps of 5)
LF.offMods = function (s, p) { const out = [], e = LF.expBonus(p);
  if (e) out.push({ k: 'native', v: e, label: `${p.first} ${LF.statWord(p, 'native')}` });
  if (p.body < 20) out.push({ k: 'body', v: -10, label: `${p.first} is failing` }); else if (p.body < 40) out.push({ k: 'body', v: -5, label: `${p.first} is unwell` });
  if (p.mind < 25) out.push({ k: 'mind', v: -10, label: `${p.first} is coming apart` }); else if (p.mind < 45) out.push({ k: 'mind', v: -5, label: `${p.first} is frayed` });
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
  else if (k === 'mind' && p.mind <= 0) { p.role = null; p.marks.broken = { d: s.day, txt: `was ${LF.SEATS[p.seat].lead} until it could not be borne any longer` }; s.vacancies.push({ role: null, seat: p.seat, day: s.day + 3 });
    LF.log(s, `${p.name} has put down the office and will not take it up again.`, 'bad'); LF.chron(s, `${p.name}, ${LF.SEATS[p.seat].lead}, could not go on.`); if (chips) chips.push({ t: `${p.name} can no longer serve`, good: false }); }
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
/* The officers were renamed (Lachlan, 2026-11-17). A saved game keeps the names it was started with; this puts the new
   ones on the six in a save from before, so no LF.VERSION bump is needed. Old log lines keep the old names. */
LF.renameCast = function (s) {
  const old = { solheim: 'Marit', dahl: 'Kasimir', kovacs: 'Bashir', nakamura: 'Amara', yurbin: 'Gerad', estrada: 'Tavi' }, by = {};
  for (const seat in LF.CAST) for (const c of LF.CAST[seat]) by[c.key] = c;
  for (const p of (s && s.people) || []) { const c = by[p.key];
    if (c && p.first === old[p.key]) Object.assign(p, { first: c.first, last: c.last, name: c.first + ' ' + c.last });
    if (c && p.title && p.role !== null && p.seat) p.title = LF.SEATS[p.seat].lead; }   // the posts were retitled (Lachlan, 2026-11-19): a save keeps up
};

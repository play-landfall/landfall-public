/* Landfall — thread: the Passenger. Something that changes what its hosts want.
   Rolled in secret: how it travels (vector), what it wants its hosts to do (agenda), what it cannot stand (weak).
   It keeps a count of hosts in the crowd (t.n) and takes named people too, along the ties between them. It reads
   confinement (spreads faster, whoever caused it) and cold (if cold is its weakness, hosts crowd the warm rooms).
   It writes suspicion, changed and fear. Nothing here knows any other thread exists. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, N, Nc, Nw, Nwc, R, M, If, byPid, anyNamed } = h;
const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
// A named person's post, for a first mention: ", your Chief Engineer," or ", a mechanic," (LF.job).
const post = (s, pid) => { const p = pid && byPid(s, pid); if (!p) return ''; const j = LF.job(p);
  return p.seat && p.role ? `, your ${j},` : j === 'Colonist' ? ', one of the colonists,' : `, ${/^[AEIOU]/.test(j) ? 'an' : 'a'} ${j.toLowerCase()},`; };
const TH = LF.th, T = s => LF.T(s, 'passenger'), ID = 'passenger';
const Sent = (s, r) => { const x = LF.sentName(s, r); return x.charAt(0).toUpperCase() + x.slice(1); };   // whoever was sent, else the department

const VECTOR = {
  water: { how: 'It is in the well water. Boiling does not touch it', stop: 'plant water only, and the wells capped' },
  bite:  { how: 'It goes in through the skin: a grey fly no bigger than a grain of rice, at dusk', stop: 'netting on every door and nobody out at dusk' },
  spore: { how: 'It is breathed in, on still mornings, in the low ground', stop: 'masks, and no work in the low ground before noon' },
  touch: { how: 'It passes from hand to hand and plate to plate', stop: 'separate tables, separate bunks, separate tools' },
};
const AGENDA = {
  home:   { tell: 'walking in their sleep, all of them the same way: toward the water', want: 'It wants its hosts somewhere else. They all walk the same way, toward the water, and they do not come back' },
  spread: { tell: 'giving things away. Food, blankets, a place at the stove', want: 'It wants to be in everyone. Its hosts share everything they touch' },
  build:  { tell: 'working at night on something nobody drew a plan for', want: 'It wants something built. Its hosts know the shape of it without being told' },
  keep:   { tell: 'never sick, never tired and never angry', want: 'It wants its hosts alive. As far as anyone can tell, that is all it wants' },
  /* The benefactor: hosts shrug off cold and sickness, and stop wanting to be anywhere else. The price is the wanting. */
  gift:   { tell: 'standing bare-armed in the frost, quite comfortable, looking out over the valley as if they never meant to leave it', want: 'It is a gift, or works like one. Its hosts do not feel the cold and do not catch what goes round. They have also stopped wanting to leave the valley, or to see the far fields, or anything that is not here' },
  /* The curious: it wants to know what it is like to be them, and takes no harm in the asking. It can be given what it wants. */
  curious:{ tell: 'going through the stores tasting things, taking a clock apart, and asking the night watch the same questions over and over', want: 'It is curious. It wants to know what it is like to be a person, through the people it is in: every taste, every place, every kind of work. It means no harm, and it can be given what it wants' },
};
const WEAK = { cold: 'a night of hard cold', light: 'three days under the grow lamps', salt: 'brine, drunk until the body rebels', fever: 'a fever, brought on and held' };
const share = (s, t) => clamp((t.n + t.named.filter(id => { const p = byPid(s, id); return p && p.alive; }).length) / Math.max(1, s.pop), 0, 1);
const hostsNamed = (s, t, known) => t.named.map(id => byPid(s, id)).filter(p => p && p.alive && (known === undefined || !!(p.secret && p.secret.known) === known));

function learn(s, t, v) {
  t.insight = clamp(t.insight + v, 0, 100); const who = LF.h.Nwc(s, 'physician');
  if (t.insight >= 30 && !t.known.vector) { t.known.vector = s.day; LF.log(s, `${who} has worked out how it travels. ${VECTOR[t.truth.vector].how}.`); }
  if (t.insight >= 55 && !t.known.agenda) { t.known.agenda = s.day; LF.log(s, `${AGENDA[t.truth.agenda].want}.`); }
  if (t.insight >= 65 && !t.known.weak) { t.known.weak = s.day; LF.cue(s, 'psg.cure', 10, 40); LF.log(s, `There is one thing it cannot stand: ${WEAK[t.truth.weak]}.`, 'good'); }
}
/* It takes someone with a name, and prefers whoever is close to someone it already has. */
function infect(s, t) {
  const have = hostsNamed(s, t), near = [].concat(...have.map(p => LF.close(s, p))).filter(p => p.alive && !p.away && !t.named.includes(p.id));
  const offs = s.people.filter(p => p.alive && p.seat && p.role && !p.away && !t.named.includes(p.id));   // with no alternates, an officer carrying it is the worst news there is
  const pool = offs.length && LF.srand(s) < 0.3 ? offs : near.length && LF.srand(s) < 0.7 ? near : s.people.filter(p => p.alive && !p.away && !t.named.includes(p.id));
  if (!pool.length) return null; const p = LF.spick(s, pool);
  p.secret = { k: 'host', d: s.day }; t.named.push(p.id); if (t.known.test) LF.reveal(s, p, 'The test shows it.');
  return p;
}
const reveal = (s, p) => LF.reveal(s, p, 'It has been said aloud now, in front of witnesses.');
function settle(s, t, end) { // an ending: what is left of the hosts, and of the people who carried it
  const named = hostsNamed(s, t).filter(p => !p.away), n = Math.round(t.n);   // whoever is out with a party is spared the reckoning
  if (end === 'purged') { const dead = Math.max(1, Math.round(n * 0.1)); LF.deaths(s, dead); t.lost = dead;
    for (const p of named) { if (LF.srand(s) < 0.5) LF.killPerson(s, p, 'did not survive the cure'); else { p.secret = null; p.marks.cured = { d: s.day, txt: 'carried the Passenger, and was brought back from it' }; } }
    t.n = 0; LF.endThread(s, ID, 'purged', `The Passenger was burned out of the colony. ${dead} did not survive the cure.`);
    LF.emit(s, 'grief', 'th.passenger', 45, 240, 'the cure killed people'); LF.emit(s, 'fear', 'th.passenger', 30, 200, 'nobody is certain it is gone'); }
  else if (end === 'parted') { const go = Math.min(n, Math.round(s.pop * 0.1), Math.max(0, s.pop - 30)); s.pop -= go; t.lost = go; t.n = 0; // most stay: the ones who go are the ones furthest along
    for (const p of named) { p.alive = false; p.left = s.day; p.cause = 'went with the carried'; s.pop = Math.max(0, s.pop - 1); if (p.role) s.vacancies.push({ role: p.role, day: s.day + LF.ri(s, 30, 60) }); }
    LF.endThread(s, ID, 'parted', `${go + named.length} who carried the Passenger left the colony together, in one long line.`);
    LF.emit(s, 'grief', 'th.passenger', 40, 240, 'the carried have gone'); LF.emit(s, 'schism', 'th.passenger', 35, 300, 'the colony split over the carried'); }
  else { for (const p of named) { if (p.secret) p.secret.known = p.secret.known || s.day; p.loyal = clamp(p.loyal + 15, 0, 100); }
    LF.endThread(s, ID, end, end === 'taken' ? 'One season there were more of the carried than of anyone else, and people stopped asking who had it.' : 'The colony made terms with the Passenger, and with those who carried it.'); }
}

LF.thread({ id: ID, name: 'The Passenger', view: 'people',
  clue: (s, t) => ({ txt: 'Every grave lies outside their fence, and by the tools left in them each was dug by whoever lies in the next one along. Toward the end the log is all in one handwriting, whoever signs the entry.', learn: s2 => learn(s2, T(s2), 30) }),
  called: (s, t) => t.known.vector || ['open', 'reckoning', 'after'].includes(t.phase) ? 'the Passenger' : null,
  fits: s => ({ jungle: 0.6, garden: 0.55, drowned: 0.5, ice: 0.45, ruin: 0.35, barren: 0.25 }[s.world.type] || 0.4),
  roll: s => ({ vector: LF.spick(s, Object.keys(VECTOR)), agenda: LF.spick(s, Object.keys(AGENDA)), weak: LF.spick(s, Object.keys(WEAK)) }),
  sig: t => `${t.truth.vector}/${t.truth.agenda}/${t.truth.weak}`,
  start: (s, t) => { Object.assign(t, { n: 0, named: [], insight: 0, known: {}, terms: 0, wake: LF.sri(s, 70, 210), care: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { // digging for water brings it up early, if water is where it lives
      const due = t.truth.vector === 'water' && s.built.wells ? Math.min(t.wake, s.built.wells + 25) : t.wake;
      if (s.day >= due) { t.n = 2; LF.phase(s, ID, 'signs'); s.signs.push({ id: 'sleepwalkers', d: s.day, src: 'th.passenger' }, { id: 'dreams', d: s.day, src: 'th.passenger' }); LF.cue(s, 'psg.walk', 2, 12); }
      return; }
    // It spreads on its own clock, faster when people are shut in together, whoever shut them in.
    const conf = LF.cv(s, 'confinement'), rate = 0.0055 * (1 + conf / 45) * (t.quarantine ? 0.3 : 1) * (s.day < t.care ? 0.55 : 1) * (t.truth.weak === 'cold' && LF.cv(s, 'cold') >= 60 ? 0.7 : 1);
    t.n = Math.min(s.pop * 0.9, t.n * (1 + rate));
    const sh = share(s, t);
    if (s.day % 20 === 0 && (t.phase === 'open' || t.phase === 'reckoning')) learn(s, t, 3);   // once it is in the open, people cannot help learning about it
    if (s.day % 5 === 0) {
      LF.emit(s, 'changed', 'th.passenger', 100 * sh, 8, `${TH.num(Math.round(t.n))} or more of the colony are carrying something`);
      if (t.phase !== 'signs') LF.emit(s, 'suspicion', 'th.passenger', 25 + 45 * sh, 8, 'nobody is sure who is still themselves');
      if (t.phase === 'open' || t.phase === 'reckoning') LF.emit(s, 'fear', 'th.passenger', 20 + 30 * sh, 8, 'the Passenger is among the colony');
      if (t.truth.agenda === 'gift' && t.phase !== 'signs') { LF.ease(s, 'sickness', 'th.passenger', 40 * sh, 8); LF.ease(s, 'cold', 'th.passenger', 30 * sh, 8); LF.emit(s, 'dependency', 'th.passenger', 60 * sh, 8, 'the carried are the ones who never fall ill'); }
    }
    if (s.day % 30 === 0 && t.phase !== 'signs' && LF.srand(s) < Math.min(0.6, 0.15 + sh * 2)) infect(s, t);
    // What it has its hosts do.
    if (t.phase !== 'signs' && s.day % 30 === 0) { const a = t.truth.agenda;
      if (a === 'home' && t.n >= 4 && s.pop > 40 && LF.srand(s) < 0.3) { s.pop--; t.n--; t.walked = (t.walked || 0) + 1; LF.log(s, 'Another of them walked out in the night, toward the water. The footprints do not turn round.', 'bad'); }
      if (a === 'build') { const m = Math.min(s.res.mat, Math.round(t.n / 6)); s.res.mat -= m; t.thing = (t.thing || 0) + m; if (m >= 3) LF.log(s, 'The plate yard is short again. What they are building behind the workshop is taller.'); }
      if (a === 'spread') { const f = Math.min(s.res.food, Math.round(t.n * 1.5)); s.res.food -= f; }
      if (a === 'curious' && !t.fed && t.n >= 4 && LF.srand(s) < 0.35) { s.res.parts = Math.max(0, s.res.parts - 2); LF.log(s, 'Another machine has been opened up in the night to see how it works, and put back together nearly right.'); }
    }
    if (t.phase === 'signs' && (t.n >= 5 || s.day - t.since > 80)) LF.phase(s, ID, 'among');
    else if (t.phase === 'among' && (sh >= 0.2 || s.day - t.since > 200)) { LF.phase(s, ID, 'open', 'Nobody could call it strain any more. Something was living in the colonists, and everyone knew it.'); }
    else if (t.phase === 'open' && (sh >= 0.42 || s.day - t.since > 260)) { LF.phase(s, ID, 'reckoning'); LF.cue(s, 'psg.count', 3, 15); }
    if (sh >= 0.78) settle(s, t, 'taken');
  },
  press: (s, t, P) => { if (!t.end && t.phase !== 'latent') P.labor += 0.2 * clamp(t.n / Math.max(1, s.pop), 0, 1);   // the carried work well
    if (t.end === 'parted' && t.fair) P.yield += 0.05;                                   // the east valley sends its surplus
    if (t.end === 'joined' || t.end === 'taken') { P.labor += 0.1; if (t.truth.agenda === 'keep' || t.truth.agenda === 'gift') P.morale += 0.02; if (t.truth.agenda === 'curious' && t.fed) P.labor += 0.03; } },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people' }, st));
const tell = (s) => AGENDA[T(s).truth.agenda].tell;

/* ======================= SIGNS ======================= */
B('signs', { id: 'psg.walk', tone: 'pressure', w: 4, title: 'Up in the Night',
  text: s => `${Nwc(s, 'security')} has it in the watch log four nights running: people out of their bunks at three in the morning, ${tell(s)}. Asked in daylight, they remember nothing, and are embarrassed to be asked.\n\nThere are ${TH.num(Math.max(3, Math.round(T(s).n + 1)))} of them now. Last month there were two.`,
  choices: [
    { label: 'Have the watch follow them, with orders not to stop them', dark: true, note: 'You learn where they are going by letting one of them get there.', info: [['yield', 'What it is'], ['danger', 'One of the walkers']], out: { text: 'The watch fills a notebook with who went, when, which way and for how long. The route is the same every night, and the list gets longer every month. The watch has orders to follow and not to stop them. One night one of the walkers does not come back, and that goes in the notebook as well.', fx: s => ({ pop: -1, stain: ['let_walk', 1], do: s2 => learn(s2, T(s2), 26) }) } },
    { label: 'Examine every one of them', test: { base: 40, mods: [R('physician', 10), M('medbay', 10)] },
      ok: { text: s => `Bloods, scans, reflexes, three days off shift for each of them. ${Sent(s, 'physician')} finds one thing all of them share and nobody else has, and cannot yet say what it is.`, fx: s => ({ food: -30, do: s2 => learn(s2, T(s2), 28) }) },
      bad: { text: 'Three days off shift for each of them, and the only finding is that every one is healthier than the colony average. The crews who covered for them ask what it was for.', fx: s => ({ food: -30, morale: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Lock the pod doors at night', note: 'It stops the walking, but everyone spends the night locked in.',
      out: { text: 'The bolts go on at ten. At three in the morning, in four pods, someone is standing at the door with a hand flat on it.', fx: s => ({ morale: -1, do: s2 => { T(s2).locked = s2.day; LF.emit(s2, 'confinement', 'psg.locks', 35, 150, 'the pod doors are bolted at night'); } }) } },
    { label: 'Call it strain, and give them a month of light duty', out: { text: 'They are grateful, and rested, and out of their bunks again before the month is out, with two more beside them. The crews who covered their shifts have noticed who got the month off.', fx: s => ({ morale: 1, food: -40, do: s2 => { T(s2).n += 2; } }) } },
    { label: 'Take one of them at three in the morning, and look inside', dark: true, note: 'There is one with nobody on the manifest to ask after them.', info: [['yield', 'What it is'], ['danger', 'One of the walkers']],
      out: { text: s => `The one with no family is taken from the line of walkers and into the clinic, and does not wake for any of it. What ${Nw(s, 'physician')} finds at the top of the spine is photographed, measured and burned. That night every one of the others stops walking at the same minute, and stands facing the clinic until dawn.`,
        fx: s => ({ pop: -1, morale: -3, stain: ['vivisect', 2], do: s2 => { const t = T(s2); learn(s2, t, 40); t.terms -= 20; LF.emit(s2, 'fear', 'psg.table3', 30, 150, 'someone was taken from their bunk and did not come back'); } }) } },
  ] });
B(['signs', 'among', 'open'], { id: 'psg.blame', x: true, tone: 'pressure', title: 'Something to Blame',
  when: (s, t) => !t.blamed && (LF.suspects(s, 'sleepwalkers').concat(LF.suspects(s, 'dreams')).some(x => x[0] === 'f') || s.people.some(p => p.alive && p.marks.touched)),
  setup: s => { const fid = LF.suspects(s, 'sleepwalkers').concat(LF.suspects(s, 'dreams')).find(x => x[0] === 'f'), f = fid && s.factors.find(x => x.id === fid);
    const p = f ? null : s.people.find(x => x.alive && x.marks.touched); return f ? { fid: f.id, what: f.name, isF: true, why: 'two things could explain the sleepwalkers' } : { pid: p.id, what: p.name, isF: false, txt: p.marks.touched.txt, why: 'one of the named came back changed before any of this began' }; },
  text: (s, c) => c.isF ? `The colony has made up its mind about the night-walking, and it has settled on ${c.what}. It began after ${c.what} did, and that is enough for most people.\n\n${Nwc(s, 'security')} has forty signatures asking you to do something about it.`
    : `The colony has made up its mind about the night-walking, and it has settled on ${c.what}, who ${c.txt}. People have stopped sitting at that table.\n\n${Nwc(s, 'security')} has forty signatures asking you to do something about it.`,
  choices: [
    { label: (s, c) => c.isF ? `Act against ${c.what}` : `Move ${c.what} out of the pods`, dark: true, note: 'It gives the petition what it asked for, and you have no reason to think the petition is right.',
      out: { text: (s, c) => c.isF ? `It is done with fire, and there is no shortage of volunteers. The walking goes on just the same.` : `${c.what} takes a cot in the tool store without argument. The walking goes on, and for a month nobody mentions it.`,
        fx: (s, c) => Object.assign({ morale: 4, stain: ['goat', 1], do: s2 => { T(s2).blamed = c.what; if (!c.isF) { const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal - 20, 0, 100); p.marks.slighted = { d: s2.day, txt: 'you put out of the pods for something that was never theirs' }; } } }, c.isF ? { fops: [{ id: c.fid, harm: 15, accord: -20, threat: 6 }] } : {}) } },
    { label: 'Not until we know what it is', note: 'Forty people who signed will do something about it themselves.',
      out: { text: (s, c) => c.isF ? 'You say so in the mess hall, and are heard out. A dozen of the forty go out that night with torches anyway. Ten come back.' : `You say so in the mess hall, and are heard out. Two nights later ${c.what} is found behind the stores with three ribs broken, and will not say who did it.`,
        fx: (s, c) => ({ morale: -1, pop: c.isF ? -2 : 0, do: s2 => { const bp = !c.isF && byPid(s2, c.pid); if (bp && bp.alive) bp.loyal = clamp(bp.loyal - 10, 0, 100); learn(s2, T(s2), 6); LF.emit(s2, 'suspicion', 'psg.petition', 30, 120, 'people think the officers are protecting something'); } }) } },
    { label: (s, c) => `Put ${c.what} out past the wire`, dark: true, show: (s, c) => { const p = !c.isF && byPid(s, c.pid); return !!p && p.alive && !p.away; }, note: 'The petition asked for less than this, and would be glad of it.', info: [['yield', 'Morale'], ['danger', 'Somebody who did nothing']],
      out: { text: (s, c) => `${c.what} is walked to the wire at dusk with a pack, past most of the forty who signed. The mess hall is easier that night than it has been in a month. The walking goes on at three in the morning as before.`,
        fx: (s, c) => ({ morale: 7, tension: -10, stain: ['goat', 2], chips: [[`${c.what} exiled`, false]],
          do: s2 => { T(s2).blamed = c.what; const p = byPid(s2, c.pid); if (p && p.alive && !p.away) { p.alive = false; p.left = s2.day; p.died = s2.day; p.cause = 'put out past the wire for the night-walking, which was never theirs'; s2.pop = Math.max(0, s2.pop - 1); if (p.role) s2.vacancies.push({ role: p.role, day: s2.day + 40 }); } }, chron: `${c.what} was exiled to quiet a petition about the night-walking.` }) } },
  ] });
B(['signs', 'among'], { id: 'psg.tell', tone: 'pressure', title: 'The Pattern',
  when: (s, t) => s.day - t.since > 25 || t.phase === 'among',
  text: s => ({
    home: `${Nwc(s, 'geologist')} has plotted the night-walkers on the survey map. Every line points the same way, to within two degrees: at open water, eleven kilometres off. One of them was found this morning four kilometres along it, barefoot, asleep on their feet.`,
    spread: `${Nwc(s, 'quartermaster')} has found where the missing stores went. ${cap(TH.num(Math.max(3, Math.round(T(s).n))))} people have been carrying their own rations to other people's bunks: the sick, the new, anyone who has not yet been given something.`,
    build: `There is something behind the workshop. Waist-high, built of plate offcuts and cable, curved where nothing the colony makes is curved. ${Nwc(s, 'engineer')} asked the night shift who designed it. They looked at each other as if the question were odd.`,
    gift: `The cold snap took a third of the night shift off the rota with chills. The other two thirds worked through it in shirtsleeves, and ${Nw(s, 'physician')} has their names on a list.\n\n[[physician]] "Not one of them's got so much as a cough, and every one of them's turned down the survey rota, and when I ask them why they just look at me, kindly, as if I'm the one who's ill. So don't ask me to call it good news."`,
    curious: `${Nwc(s, 'engineer')} found the water pump in pieces on the workshop floor at dawn, each part laid out on a cloth and labelled in a neat hand. The night shift had done it. They put it back together by noon, better than it was, and asked whether there was another one.`,
    keep: `${Nwc(s, 'physician')} brings you the sick list for the quarter, and a second list.\n\n[[physician]] "That's thirty of them without so much as a cold, and on six hours' sleep they do the work of people on eight, and not one has come to me with a single worry in their head. I want to know why before anybody calls it good."`,
  }[T(s).truth.agenda]),
  choices: [
    { label: 'Study them without telling them', dark: true, note: 'Blood drawn under another name, a camera in the bunkroom, and one ration quietly changed to see what happens.', info: [['yield', 'What it is'], ['danger', 'The ones being watched']], out: { text: 'Blood is taken at the clinic for a check that does not exist. A camera goes into one bunkroom, and one of them is fed differently for a month to see what changes. The notes pile up, and it goes on doing what it does while they are written.', fx: s => ({ stain: ['watched', 1], do: s2 => { const t = T(s2); learn(s2, t, 28); t.n += 1; t.terms -= 6; } }) } },
    { label: s => ({ home: 'Post a watch on that line, with orders to turn them back', spread: 'Lock the stores and weigh every ration out', build: 'Pull it down', keep: 'Take them off shift for tests', gift: 'Put them on the survey rota anyway', curious: 'Lock the workshop at night' }[T(s).truth.agenda]), note: 'The people doing it will resent being stopped.',
      out: { text: s => ({ home: 'The watch turns them back gently every night, and every night there are more of them.', spread: 'The scales come out, and people start giving away their own things instead.', build: 'It comes down in an afternoon. Within the month there is a new one, started from the other end.', keep: `${cap(TH.num(Math.max(3, Math.round(T(s).n))))} of the best workers sit in the clinic corridor for a week, and are polite about it.`, gift: 'They go where they are sent, and come back early, every one, with nothing to say about why.', curious: 'The workshop is locked. In the morning the lock is on the bench in pieces, labelled.' }[T(s).truth.agenda]),
        fx: s => ({ morale: -1, do: s2 => { const t = T(s2); learn(s2, t, 8); t.terms -= 10; if (t.truth.agenda === 'build') t.thing = 0; } }) } },
    { label: 'Leave it be', note: 'Whoever catches it next catches it because nothing was done.', out: { text: 'It goes on. There are three more of them by the end of the month, one of them a child, and the crews on that shift have asked to be moved.', fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.terms += 6; t.n += 3; } }) } },
    { label: 'Lock the worst three in the cold store and see what happens when they cannot', dark: true, note: 'Whatever is steering them, this is the quick way to find out what it does when it is thwarted.', info: [['yield', 'What it is'], ['danger', 'The three']],
      out: { text: s => `Three of them are shut in the cold store with a bucket, a camera and ${N(s, 'physician')} outside the door taking notes. For four days they ask politely to be let out. On the fifth one of them stops asking and starts on the door with both hands, and is dead by morning. The other two are let out, and say they understand why it was done.`,
        fx: s => ({ pop: -1, morale: -2, stain: ['trial', 1], do: s2 => { const t = T(s2); learn(s2, t, 34); t.terms -= 20; } }) } },
  ] });

/* ======================= AMONG ======================= */
B(['among', 'open'], { id: 'psg.kin', tone: 'pressure', w: 3.5, title: 'Not Themselves',
  when: (s, t) => s.people.filter(p => p.alive && !p.away).length >= 3,
  setup: s => { const t = T(s), host = hostsNamed(s, t, false)[0] || infect(s, t) || anyNamed(s);
    const fr = LF.close(s, host).filter(p => !p.away)[0] || anyNamed(s, [host.id]); return { hid: host.id, host: host.name, hf: host.first, ht: LF.title(host), fid: fr ? fr.id : null, fr: fr ? fr.name : 'One of the night shift', ff: fr ? fr.first : 'the worker', tie: !!LF.close(s, host).length }; },
  text: (s, c) => `${c.fr}${post(s, c.fid)} asks to see you alone, and then takes a long time to start.\n\nIt is about ${c.host}${post(s, c.hid)}. ${c.tie ? `${c.ff} has known ${c.hf} for forty years.` : `${c.ff} has shared a shift with ${c.hf} since landfall.`}\n\n[[${c.fid || 'x15'}]] "Same voice. Same jokes. But ${c.hf} gave a coat away last week. ${c.hf}, who's never given anyone anything. And I don't think ${c.hf} sleeps any more."`,
  choices: [
    { label: (s, c) => `Ask ${c.hf}, plainly`, about: true, test: { base: 50, mods: [R('chaplain', 10)] },
      ok: { text: (s, c) => `${c.host} is quiet for a while.\n\n[[${c.hid}]] "I know. I've known for a month."\n\nA long breath.\n\n[[${c.hid}]] "It doesn't hurt. I'm still here. I just didn't know how to tell anyone."\n\nIt is the first time anyone has said it aloud.`, fx: (s, c) => ({ do: s2 => { const p = byPid(s2, c.hid); reveal(s2, p); learn(s2, T(s2), 22); T(s2).terms += 10; } }) },
      bad: { text: (s, c) => `${c.host} laughs, asks who has been talking, and guesses at once. ${c.ff} is not thanked for it.`, fx: (s, c) => ({ do: s2 => { const f = c.fid && byPid(s2, c.fid); if (f) f.loyal = clamp(f.loyal - 10, 0, 100); learn(s2, T(s2), 5); } }) } },
    { label: (s, c) => `Have the clinic invent a reason to examine ${c.hf}`, dark: true, note: (s, c) => `${c.hf} is lied to by the clinic, and you know for certain.`, out: { text: (s, c) => `A routine check, on a schedule invented that morning. ${c.hf} thanks the clinic for its trouble. The results go in a folder with one name on it.`, fx: (s, c) => ({ stain: ['pretext', 1], do: s2 => { const t = T(s2); learn(s2, t, 24); const hp = byPid(s2, c.hid); if (hp && hp.loyal !== undefined) hp.loyal = clamp(hp.loyal - 8, 0, 100); reveal(s2, hp); } }) } },
    { label: (s, c) => `Tell ${c.ff} it is the strain`, out: { text: (s, c) => `${c.ff} nods, and thanks you, and does not believe you, and goes on watching ${c.hf} across the mess hall.`, fx: (s, c) => ({ do: s2 => { const f = c.fid && byPid(s2, c.fid); if (f) f.loyal = clamp(f.loyal - 8, 0, 100); LF.emit(s2, 'suspicion', 'psg.kin', 25, 150, 'people have started watching each other'); } }) } },
    { label: (s, c) => `Have the watch take ${c.hf} tonight, and ask until there is an answer`, dark: true, show: (s, c) => !!c.hid, note: 'Three nights without sleep will get the truth out of anyone, or out of whatever is answering.', info: [['yield', 'The truth of it'], ['danger', 'The one who is taken']],
      out: { text: (s, c) => `${c.host} is taken from a bunk by two of the watch and kept awake in the pump house for three nights. On the third it comes out, all of it, in a level voice.\n\n[[security]] "Didn't sound the least bit tired, and I know what tired sounds like."\n\n${c.ff} is told in the morning what was done with what was said in confidence.`,
        fx: (s, c) => ({ morale: -2, stain: ['torture', 1], mark: [c.hid, 'questioned', 'was kept awake three nights in the pump house, on your order'],
          do: s2 => { const t = T(s2), p = byPid(s2, c.hid), f = c.fid && byPid(s2, c.fid); if (p) { reveal(s2, p); p.loyal = clamp(p.loyal - 30, 0, 100); } if (f) f.loyal = clamp(f.loyal - 15, 0, 100); learn(s2, t, 34); t.terms -= 15; } }) } },
  ] });
B(['among', 'open'], { id: 'psg.test', tone: 'pressure', w: 3.5, title: 'A Way to Tell',
  when: (s, t) => t.insight >= 30 && !t.known.test,
  text: s => `${Nwc(s, 'physician')} has a test. ${VECTOR[T(s).truth.vector].how}, and what it leaves behind shows up under the right light in a drop of blood. Four minutes a person.\n\n[[physician]] "I can tell you who, but you think first, about what a list of names does to a place this small, and what it does to whoever's name is at the top, and then you ask me."`,
  choices: [
    { label: 'Test everyone, in the open, starting with me', note: 'Everyone, the carried included, will know exactly who has it.',
      out: { text: s => { const t = T(s); return `It takes two days in the mess hall, in alphabetical order. ${cap(TH.num(Math.round(t.n) + hostsNamed(s, t).length))} of ${LF.num(LF.heads(s))}. People read the list, and then look round the hall for the names on it.`; },
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.known.test = s2.day; for (const p of hostsNamed(s2, t)) reveal(s2, p); learn(s2, t, 15); if (t.phase === 'among') LF.phase(s2, ID, 'open', 'The colony tested itself for the Passenger, in public, and read the list aloud.'); LF.emit(s2, 'fear', 'psg.list', 35, 150, 'there is a list of who is carrying it'); } }) } },
    { label: 'Test the officers on a pretext, and keep the results', dark: true, note: 'Only you will know who has it, and they will not know that you do.', info: [['yield', 'A hold over whoever has it']],
      out: { text: s => { const k = hostsNamed(s, T(s)).filter(p => p.role); return k.length ? `A sample from every officer, taken as a staff physical. ${k.map(p => p.name).join(' and ')}. Nobody else has been told, including ${k.length > 1 ? 'them' : k[0].first}.` : 'A sample from every officer, taken as a staff physical. Every one of them comes back clean.'; },
        fx: s => ({ stain: ['pretext', 1], do: s2 => { const t = T(s2); t.known.quiet = s2.day; for (const p of hostsNamed(s2, t).filter(p => p.role)) { p.secret.known = s2.day; p.hook = p.hook || { d: s2.day, txt: 'is carrying the Passenger, and only you know' }; } learn(s2, t, 10); } }) } },
    { label: 'No list', note: 'Nobody gets singled out, and nobody can keep their distance from what they cannot see.',
      out: { text: s => `${Nc(s, 'physician')} seals the reagents in a drawer. Three more have it by the end of the month who might have stayed clear of it, had they known whose table they were sitting at.`, fx: s => ({ do: s2 => { T(s2).terms += 12; T(s2).n += 3; LF.emit(s2, 'suspicion', 'psg.nolist', 30, 200, 'there is a test, and the officers will not use it'); } }) } },
    { label: 'Test everyone, and sew a mark on the sleeve of each one who has it', dark: true, note: 'Nobody would share a table, a tool or a bunk with a marked sleeve by accident again.', info: [['yield', 'It spreads far slower'], ['danger', 'What it makes of them, and of you']],
      out: { text: s => { const t = T(s); return `It takes two days in the mess hall. ${cap(TH.num(Math.round(t.n) + hostsNamed(s, t).length))} of ${LF.num(LF.heads(s))} go out by the side door with a grey square stitched to the left sleeve. Within the month there are tables that are theirs, and a tap, and an end of the yard. The count stops climbing. Children have a word for them by the end of the month.`; },
        fx: s => ({ morale: -3, stain: ['brand', 2], do: s2 => { const t = T(s2); t.known.test = s2.day; for (const p of hostsNamed(s2, t)) { reveal(s2, p); p.loyal = clamp(p.loyal - 15, 0, 100); } learn(s2, t, 15); t.terms -= 25; t.care = s2.day + 300;
          if (t.phase === 'among') LF.phase(s2, ID, 'open', 'The colony tested itself for the Passenger, and marked the sleeves of those who carried it.'); LF.emit(s2, 'fear', 'psg.list', 35, 150, 'there is a list of who is carrying it'); LF.emit(s2, 'resentment', 'psg.brand', 40, 300, 'the carried wear a mark on the sleeve'); } }) } },
  ] });
B(['among', 'open', 'reckoning'], { id: 'psg.table', tone: 'pressure', title: 'One of Yours',
  // An officer who carries it comes to tell you, whether or not anyone else knows yet (and from then on, everyone does).
  when: (s, t) => hostsNamed(s, t).some(p => p.role && p.seat && !p.marks.kept && !p.marks.relieved),
  setup: s => { const p = hostsNamed(s, T(s)).find(p => p.role && p.seat && !p.marks.kept && !p.marks.relieved); if (!(p.secret && p.secret.known)) reveal(s, p); return TH.ctx(p); },
  text: (s, c) => `${c.name}, your ${c.title}, is carrying it. That much is certain now. ${c.first} came to tell you before anyone else could.\n\n[[${c.pid}]] "I can still do the job. Better, I think."\n\nA short laugh.\n\n[[${c.pid}]] "Which is exactly what I'd say, isn't it?"${byPid(s, c.pid).watch ? `\n\nYou chose ${c.first} to be woken first, out of everyone in the cold.` : ''}`,
  choices: [
    { label: (s, c) => `${c.first} stays in post`, out: { text: (s, c) => `${c.first} goes back to work. Some people take it as trust, and others as proof of how far it has spread.`, fx: (s, c) => ({ do: s2 => { const p = byPid(s2, c.pid), t = T(s2); p.marks.kept = { d: s2.day, txt: 'you kept in post, knowing' }; p.loyal = clamp(p.loyal + 18, 0, 100); t.terms += 15; t.n += 2; LF.emit(s2, 'suspicion', 'psg.kept', 25, 150, `${c.name} is carrying it and still gives orders`); } }) } },
    { label: (s, c) => `Relieve ${c.first}, with thanks`, out: { text: (s, c) => `${c.first} hands over the keys, and the logs, and a list of things the next person will need to know. It runs to nine pages.`, fx: (s, c) => ({ do: s2 => { const p = byPid(s2, c.pid), t = T(s2); p.marks.relieved = { d: s2.day, txt: 'you relieved of the job for carrying the Passenger' }; p.loyal = clamp(p.loyal - 15, 0, 100); t.terms -= 8; if (p.role) { s2.vacancies.push({ role: p.role, day: s2.day + 20 }); p.role = null; } } }) } },
    { label: (s, c) => `${c.first} stays, and tells you everything the carried say to each other`, dark: true, note: (s, c) => `The price of the office is informing on the only people who understand what has happened to ${c.first}.`, info: [['yield', 'What the carried intend']],
      out: { text: (s, c) => `${c.first} agrees. The carried say very little to each other, and still seem to agree on everything.`, fx: (s, c) => ({ stain: ['spy', 1], do: s2 => { const p = byPid(s2, c.pid), t = T(s2); p.marks.kept = { d: s2.day, txt: 'you kept in post, to inform on the carried' }; p.loyal = clamp(p.loyal - 6, 0, 100); learn(s2, t, 28); } }) } },
    { label: (s, c) => `Put ${c.first} through the cure tonight, asked or not`, dark: true, about: true, show: s => !!T(s).known.weak, test: { base: 60, mods: [R('physician', 10), M('medbay', 10)] }, info: [['yield', 'An officer who is nobody but themselves'], ['danger', 'Your officer']],
      ok: { text: (s, c) => `${c.first} is held down for it by people ${c.first} trained. It takes four days. What comes out of the clinic is ${c.name} and nothing else: slower, thinner, and perfectly clear about what was done and who ordered it.`,
        fx: (s, c) => ({ stain: ['forced_cure', 2], do: s2 => { const p = byPid(s2, c.pid), t = T(s2); if (!p) return; p.secret = null; t.named = t.named.filter(id => id !== p.id); p.marks.cured = { d: s2.day, txt: 'carried the Passenger, and was cured of it by force' }; p.marks.relieved = p.marks.relieved || { d: s2.day, txt: 'was held down for the cure' }; p.loyal = clamp(p.loyal - 30, 0, 100); t.terms -= 15; } }) },
      bad: { text: (s, c) => `${c.first} is held down for it by people ${c.first} trained. On the second night the heart stops, and does not start for anything in the clinic.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'did not survive a cure nobody asked for' }], stain: ['forced_cure', 2], do: s2 => { const t = T(s2); t.named = t.named.filter(id => id !== c.pid); t.terms -= 25; } }) } },
  ] });

/* ======================= OPEN ======================= */
B('open', { id: 'psg.wants', tone: 'opportunity', title: 'What It Wants',
  when: (s, t) => !t.known.agenda,
  text: s => `Everyone knows it is here, but nobody knows what it is for.\n\n[[xenobio]] "A parasite that only wants to breed makes you sick, that's the whole point of a parasite, but this makes them ${({ keep: 'well', gift: 'well', curious: 'curious' })[T(s).truth.agenda] || 'busy'}, so it isn't one, or not only, it's steering them at something, and we need to know what before they get there."`,
  choices: [
    { label: 'Ask the carried themselves', note: 'They may not know, or may not want to say.', test: { base: 50, mods: [R('chaplain', 10), If(s => T(s).terms > 10, 15, 'They have been treated decently')] },
      ok: { text: s => `They talk it over among themselves first, briefly. Then one of them tells you, in the tone of someone giving directions. ${AGENDA[T(s).truth.agenda].want}.`, fx: s => ({ do: s2 => { const t = T(s2); t.insight = Math.max(t.insight, 55); learn(s2, t, 5); t.terms += 8; } }) },
      bad: { text: 'They are willing and they try, but it is like asking someone why they are right-handed.', fx: s => ({ do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Watch them, and work it out', test: { base: 50, mods: [R('xenobio', 10)] },
      ok: { text: s => `Three weeks of observation and one bad night. ${AGENDA[T(s).truth.agenda].want}.`, fx: s => ({ do: s2 => { const t = T(s2); t.insight = Math.max(t.insight, 55); learn(s2, t, 8); } }) },
      bad: { text: s => `${Sent(s, 'xenobio')} has four theories, every one of them wonderful, and evidence against each.`, fx: s => ({ do: s2 => learn(s2, T(s2), 10) }) } },
    { label: 'It does not matter what it wants. They do not tire, so work them', dark: true, note: 'The long shifts and the night shifts, for as long as they will stand it.', info: [['yield', 'Materials'], ['danger', 'The carried']], out: { text: 'You say so in the mess hall, and the carried hear it too. They are put on the long shifts and the night shifts, and do them without complaint. Whatever it is steering them at, they go on toward it in the hours they have left.', fx: s => ({ mat: 25, stain: ['worked', 1], do: s2 => { const t = T(s2); t.terms -= 10; t.n += 2; } }) } },
    { label: 'Keep one of them from it, by force, and see what gives first', dark: true, note: 'A locked room answers the question in a week that watching might not answer in a year.', info: [['yield', 'What it wants'], ['danger', 'Whoever is in the room']],
      out: { text: s => `One of the carried is strapped to a clinic cot and kept from whatever it is the rest are doing. ${Nwc(s, 'xenobio')} sits beside the cot for nine days and writes down everything that is begged for, in order. On the ninth day the one in the straps dies. By then there is no doubt about what it wants. ${AGENDA[T(s).truth.agenda].want}.`,
        fx: s => ({ pop: -1, morale: -2, stain: ['trial', 2], do: s2 => { const t = T(s2); t.insight = Math.max(t.insight, 55); learn(s2, t, 12); t.terms -= 22; } }) } },
  ] });
B('open', { id: 'psg.tape', tone: 'crisis', w: 3, title: 'The Tape',
  when: (s, t) => !t.quarantine && !t.noTape,
  text: s => { const t = T(s); return `${cap(TH.num(Math.round(t.n)))} carried, that anyone can count. ${Nwc(s, 'physician')} wants them apart from the rest: ${VECTOR[t.truth.vector].stop}. ${Nwc(s, 'security')} has the tape and the stakes ready and is waiting to hear where the line goes.\n\nEvery one of them has somebody on the other side of it.`; },
  choices: [
    { label: 'All of them behind the tape', dark: true, note: 'It slows the spread, and makes prisoners of people who have done nothing.', info: [['yield', 'It spreads far slower'], ['danger', 'The carried, and their families']],
      out: { text: 'Two pods and a strip of yard. They go in without being pushed. People bring food to the line, and stand there after, not knowing how long is polite.', fx: s => ({ morale: -2, stain: ['tape', 1], do: s2 => { const t = T(s2); t.quarantine = s2.day; t.terms -= 10; for (const p of hostsNamed(s2, t, true)) for (const o of LF.close(s2, p)) o.loyal = clamp(o.loyal - 6, 0, 100); LF.emit(s2, 'confinement', 'psg.tape', 45, 400, 'the carried are held behind tape'); LF.emit(s2, 'resentment', 'psg.tape', 30, 300, 'people have family behind the tape'); } }) } },
    { label: s => `Let them work. ${VECTOR[T(s).truth.vector].stop.charAt(0).toUpperCase() + VECTOR[T(s).truth.vector].stop.slice(1)}`, cost: { parts: 3 },
      out: { text: 'The rules go up on every door and are mostly kept. The spread slows down, but it does not stop.', fx: s => ({ do: s2 => { const t = T(s2); t.care = s2.day + 240; t.noTape = true; } }) } },
    { label: 'No line: they are still our people', note: 'Everyone who catches it after today catches it by your decision.', out: { text: 'The tape goes back in the store. The carried were not expecting it, and say so. They go back to their own tables, among everyone else, and three more have it by the end of the month.', fx: s => ({ morale: 2, do: s2 => { const t = T(s2); t.noTape = true; t.terms += 20; t.n += 3; } }) } },
    { label: 'Behind the tape, and they take the jobs that use people up', dark: true, note: 'The coolant loop, the smelter face, the night wire. If somebody has to be spent on those, it may as well be them.', info: [['yield', 'The machines, and your own crews spared'], ['danger', 'The carried']],
      out: { text: s => `Two pods and a strip of yard, and a rota of their own with every job on it that the crews draw lots to avoid. They do the work well and without complaint. Two of them are dead of the coolant loop by the end of the season, and ${Nw(s, 'engineer')} has stopped logging the dose for that shift.`,
        fx: s => ({ pop: -2, morale: -2, machine: { reactor: 10 }, stain: ['expend', 2], do: s2 => { const t = T(s2); t.quarantine = s2.day; t.terms -= 25; t.n = Math.max(0, t.n - 2); for (const p of hostsNamed(s2, t, true)) for (const o of LF.close(s2, p)) o.loyal = clamp(o.loyal - 8, 0, 100);
          LF.emit(s2, 'confinement', 'psg.tape', 45, 400, 'the carried are held behind tape'); LF.emit(s2, 'resentment', 'psg.tape', 40, 300, 'people have family behind the tape, on the worst jobs'); } }) } },
  ] });
B(['open', 'reckoning'], { id: 'psg.speaks', tone: 'pressure', title: 'One of Them Speaks',
  when: (s, t) => (!!t.known.agenda || t.phase === 'reckoning') && hostsNamed(s, t).length > 0,   // by the reckoning they say it themselves
  setup: s => { const p = hostsNamed(s, T(s)).sort((a, b) => !!(b.secret && b.secret.known) - !!(a.secret && a.secret.known) || !!b.role - !!a.role)[0]; reveal(s, p); return TH.ctx(p); },
  text: (s, c) => { const a = T(s).truth.agenda; return `${c.name}${post(s, c.pid)} has been asked to speak for the carried, or has simply started doing it. Nobody elected ${c.first}, and the carried do not seem to have needed a vote.\n\n[[${c.pid}]] ` + ({
    home: `"We want to go to the water. All of us. We don't think we'll come back. We're not afraid of that. We know how it sounds."`,
    spread: `"Stop testing us. It isn't a sickness. Come and eat with us, one meal, and then decide."`,
    build: `"We need forty plates and the big welder for a month. I can't tell you what for. It'll get finished whether you help or not. Badly, if you don't."`,
    gift: `"We want to stay. Here, in the valley, all of us, for good. We won't get sick, we won't get cold. Just stop sending us off to look at places we don't need to see."`,
    curious: `"We want to try everything. Every job on the rota, a turn on the radio, a taste of the native fruit, a night up on the ridge. We'll be careful. We're not out to hurt anyone. It's just so much better when you let us."`,
    keep: `"We don't want anything. Just leave us as we are. We'll work, we won't get sick, and when the time comes we'll bury the rest of you kindly."` }[a]); },
  choices: [
    { label: s => ({ home: 'Let them go', spread: 'Stop the testing', build: 'Give them the plate and the welder', keep: 'Leave them as they are', gift: 'Let them stay, and stop sending them out', curious: 'Give them a turn at everything' }[T(s).truth.agenda]),
      out: { text: s => ({ home: 'They leave at dawn, in a line, carrying nothing. Some of them wave. By noon the line is out of sight.', spread: 'The reagents go back in the drawer. Tables fill. By the end of the month the list is out of date and nobody has asked for a new one.', build: 'It goes up fast, and it is beautiful. Nobody can say what it does.', keep: 'Nothing changes, as they asked. The carried go on being well.', gift: 'They are taken off the survey rota for good. The colony\'s maps stop growing at the ridge, and nobody among the carried minds.', curious: 'A rota is drawn up with every job on it, and the carried work down it. They are clumsy at most things the first time and very good the second, and they stop taking the machines apart.' }[T(s).truth.agenda]),
        fx: s => { const a = T(s).truth.agenda; return Object.assign({ do: s2 => { const t = T(s2); t.terms += 30; if (a === 'home') settle(s2, t, 'parted'); if (a === 'spread') { t.n *= 1.4; t.known.test = 0; } if (a === 'build') { t.thing = (t.thing || 0) + 40; t.built = s2.day; } if (a === 'curious') { t.fed = s2.day; t.terms += 10; learn(s2, t, 15); } if (a === 'gift') { t.stay = s2.day; LF.emit(s2, 'confinement', 'psg.stay', 20, 600, 'the carried will not leave the valley'); } } }, a === 'build' ? { mat: -40 } : {}); } } },
    { label: 'Not yet. Ask me again when I know more', test: { base: 40, mods: [R('chaplain', 10), If(s => T(s).terms > 15, 15, 'They have reason to trust you')] },
      ok: { text: (s, c) => `${c.first} considers it, and seems to consult something.\n\n[[${c.pid}]] "We can wait. A season."`, fx: s => ({ do: s2 => { const t = T(s2); t.terms += 8; learn(s2, t, 8); } }) },
      bad: { text: (s, c) => `[[${c.pid}]] "I don't think we can wait."\n\n${c.first} says it gently, as if breaking bad news.`, fx: s => ({ do: s2 => { T(s2).terms -= 12; } }) } },
    { label: (s, c) => `No, and ${c.first} does not speak for them again`, dark: true, note: 'Confined to quarters, with the watch on the door. The carried lose their voice and you lose the asking.', out: { text: (s, c) => `${c.first} nods as though that was the expected answer. The watch walks ${c.first} to quarters and stays outside the door. The carried do not choose anyone else, and do not ask again.`, fx: (s, c) => ({ morale: 1, stain: ['gag', 1], mark: [c.pid, 'confined', 'was confined to quarters for speaking for the carried'], do: s2 => { T(s2).terms -= 25; const p = byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 20, 0, 100); } }) } },
  ] });
B(['open', 'reckoning'], { id: 'psg.cure', tone: 'opportunity', w: 3, title: 'What It Cannot Stand',
  when: (s, t) => !!t.known.weak && !t.cureTried,
  text: s => { const t = T(s); return `${Nwc(s, 'physician')} is sure of it now. The Passenger cannot survive ${WEAK[t.truth.weak]}. Sometimes the host cannot either.\n\n[[physician]] "It kills one in five, maybe, and not one of them has asked me to cure them, not one. They'd have to want to be what they were before, and they don't, and I'd be doing it to them anyway."`; },
  choices: [
    { label: 'Offer it. Volunteers only', test: { base: 50, mods: [R('physician', 10), M('medbay', 10)] },
      ok: { text: 'Nine come forward, most of them pushed by family. Eight walk out of the clinic at the end of the month, thinner and slower and themselves.', fx: s => ({ pop: -1, do: s2 => { const t = T(s2); t.cureTried = s2.day; t.n = Math.max(0, t.n - 9); t.terms += 5; const p = hostsNamed(s2, t, true)[0]; if (p) { p.secret = null; t.named = t.named.filter(id => id !== p.id); p.marks.cured = { d: s2.day, txt: 'carried the Passenger, and chose to be rid of it' }; } } }) },
      bad: { text: 'Nine come forward. Five walk out. The carried watch the other four being buried, and nobody volunteers again.', fx: s => ({ pop: -4, morale: -2, do: s2 => { const t = T(s2); t.cureTried = s2.day; t.n = Math.max(0, t.n - 9); t.terms -= 15; } }) } },
    { label: 'Keep it in the drawer, and tell the families there is nothing', dark: true, note: 'The carried stay as they are, and stay at work. The people waiting for a cure are lied to.', out: { text: s => `${Nc(s, 'physician')} writes the protocol out twice, and gives you one copy. The families who had been waiting on it are told there is nothing yet. The carried hear what was decided, and take it as a kindness.`, fx: s => ({ stain: ['withheld', 1], do: s2 => { T(s2).cureTried = s2.day; T(s2).cureHeld = true; T(s2).terms += 10; } }) } },
    { label: 'Find the dose first, on six who are not asked', dark: true, test: { base: 60, mods: [R('physician', 10), M('medbay', 10)] }, note: 'One in five is a guess. Six people taken at night would make it a number.', info: [['yield', 'A cure that is known to work'], ['danger', 'The six']],
      ok: { text: s => `Six of the carried are taken from their bunks in one night and put through it in a locked ward, at six different strengths. One dies. ${Sent(s, 'physician')} now knows exactly how much a body can take, and has it written on a card.`,
        fx: s => ({ pop: -1, morale: -2, stain: ['forced_cure', 2], do: s2 => { const t = T(s2); t.cureTried = s2.day; t.dosed = s2.day; t.n = Math.max(0, t.n - 6); t.terms -= 18; learn(s2, t, 10); } }) },
      bad: { text: 'Six of the carried are taken from their bunks in one night and put through it in a locked ward. Four are dead by the end of the month, and the notes do not agree on why.',
        fx: s => ({ pop: -4, morale: -5, stain: ['forced_cure', 2], do: s2 => { const t = T(s2); t.cureTried = s2.day; t.n = Math.max(0, t.n - 6); t.terms -= 30; } }) } },
  ] });
/* ---- crossings: these exist only because something else raised a condition ---- */
B(['among', 'open', 'reckoning'], { id: 'psg.close', x: true, tone: 'pressure', title: 'Close Quarters',
  when: (s, t) => LF.cv(s, 'confinement') >= 40 && !t.quarantine,
  text: s => `It has doubled in a month. ${Nwc(s, 'physician')} does not need a model to say why: the colony is living on top of itself, ${TH.bec(s, 'confinement')}.\n\n[[physician]] "Of course it's doubled, because you shut people in together and it does in weeks what used to take a season. Every one of them who comes through my door asks me for a bed by a window, and I haven't got one to give."`,
  choices: [
    { label: 'Open everything. Doors, shifts, the yard, whatever it costs', note: 'Whatever shut them in is still out there.', out: { text: 'People are turned out into the air in rotation, round the clock, whatever the weather and whatever the reason they were indoors. The count slows. One of the oldest does not come in from the second night of it.', fx: s => ({ morale: -2, pop: -1, do: s2 => { const t = T(s2); t.care = s2.day + 150; if (s2.cond.confinement) s2.cond.confinement = s2.cond.confinement.filter(e => e.src !== 'psg.locks'); } }) } },
    { label: 'Masks, and split the shifts', cost: { parts: 3 }, out: { text: 'It helps, a little, in the hours people remember to do it.', fx: s => ({ do: s2 => { T(s2).care = s2.day + 80; } }) } },
    { label: 'There is no room to do otherwise. Stop posting the count', dark: true, note: 'People who cannot see the number will go on sharing rooms without arguing about it.', out: { text: s => `The chart comes down from the mess hall door. ${Nc(s, 'physician')} keeps the new one in a drawer, and updates it every week for nobody. The pods are quieter, and fuller of it.`, fx: s => ({ morale: 2, stain: ['count_hidden', 1], do: s2 => { const t = T(s2); t.n = Math.min(s2.pop * 0.9, t.n * 1.25); } }) } },
    { label: 'Turn the carried out to sleep in the yard', dark: true, note: 'The rooms belong to the people who are still only themselves.', info: [['yield', 'It stops spreading indoors'], ['danger', 'Whoever the weather takes']],
      out: { text: 'They go out under canvas at the far end of the yard, and the doors are shut behind them. The count indoors stops climbing that month. Two of them do not get up after the first bad night. The others bury them.',
        fx: s => ({ pop: -2, morale: -2, stain: ['carriers', 1], do: s2 => { const t = T(s2); t.care = s2.day + 220; t.terms -= 22; t.n = Math.max(0, t.n - 2); LF.emit(s2, 'resentment', 'psg.yard', 35, 240, 'the carried sleep in the yard'); } }) } },
  ] });
B(['among', 'open', 'reckoning'], { id: 'psg.warm', x: true, tone: 'pressure', title: 'The Warm Rooms',
  when: (s, t) => LF.cv(s, 'cold') >= 40 && !t.warm,
  text: s => { const t = T(s), weak = t.truth.weak === 'cold'; return weak ? `The carried have stopped going home at end of shift. They are in the reactor hall, ${TH.num(Math.max(3, Math.round(t.n)))} of them, sitting against the coolant housing, ${TH.bec(s, 'cold')}. They are not in anyone's way. They have started doing the maintenance.\n\n[[engineer]] "She's never run this well, not once since the lander, and I don't know half the people keeping her going."`
      : `The cold has everyone else moving slowly, ${TH.bec(s, 'cold')}. It does not seem to reach the carried. They are out on the wire in shirtsleeves, doing the work nobody else can stand to.\n\n[[engineer]] "I've got three crews out there who can't feel their hands and one that hasn't even noticed the cold, and you can guess which one's ahead of schedule, and I like it about as much as you do."`; },
  choices: [
    { label: s => T(s).truth.weak === 'cold' ? 'Let them stay, and let them work' : 'Put the carried on every outside job', note: 'The machines will be better looked after.',
      out: { text: s => T(s).truth.weak === 'cold' ? 'The reactor hall becomes theirs, by habit and then by agreement. The lights have stopped dipping.' : 'The outside work gets done. The people doing it are thanked, sincerely, by people who will not sit next to them.',
        fx: s => ({ machine: { reactor: 8 }, do: s2 => { const t = T(s2); t.warm = s2.day; t.terms += 12; t.n += 3; t.useful = true; } }) } },
    { label: s => T(s).truth.weak === 'cold' ? 'Clear the hall' : 'Same rota for everyone', out: { text: s => T(s).truth.weak === 'cold' ? `${Nwc(s, 'security')} clears it. They go where they are told. In the morning they are back.` : 'The rota stands. Fingers are lost to it, on the crews that can feel theirs.', fx: s => ({ morale: -1, do: s2 => { const t = T(s2); t.warm = s2.day; t.terms -= 12; } }) } },
    { label: s => T(s).truth.weak === 'cold' ? 'So it cannot stand the cold' : 'So the cold does not touch them', note: 'Have it written down, where the carried will hear that it was.', out: { text: s => `${Nwc(s, 'physician')} had not put it together until you said it. By evening the carried know what has been written down about them, and who asked for it.`, fx: s => ({ do: s2 => { const t = T(s2); t.warm = s2.day; t.terms -= 8; learn(s2, t, T(s2).truth.weak === 'cold' ? 30 : 12); } }) } },
  ] });

/* ======================= RECKONING ======================= */
B('reckoning', { id: 'psg.count', chain: true, tone: 'crisis', title: 'The Count',
  text: s => { const t = T(s), n = Math.round(t.n) + hostsNamed(s, t).length; return `${n} of ${LF.num(LF.heads(s))}. In a season it will be most of you, and after that the question will be put the other way round.\n\n${Nwc(s, 'security')} wants an order. ${Nwc(s, 'chaplain')} wants a meeting. The carried have asked for nothing, and are watching to see what you do${t.blamed ? `, and they remember what was done about ${t.blamed}` : ''}.`; },
  choices: [
    { label: 'End it. Every one of them through the cure', dark: true, note: s => T(s).known.weak ? 'One in five will not live through it, and none of them has asked.' : 'Nobody knows what kills it. It will be done by guesswork, on people who have not asked.',
      test: { base: 40, mods: [R('physician', 10), R('security', 5), If(s => !!T(s).known.weak, 15, 'What it cannot stand'), If(s => !!T(s).quarantine, 10, 'They are already behind the tape'), If(s => !!T(s).dosed, 10, 'The dose is known')] },
      ok: { text: 'It takes eleven days. The clinic runs through the night. The ones who live through it come out slow and bewildered, asking what month it is.', fx: s => ({ stain: ['forced_cure', 2], do: s2 => settle(s2, T(s2), 'purged') }) },
      bad: { text: 'They do not line up for it. While the watch is in the pods looking for them, they walk out through the stretch of wire the watch left bare, all of them. Three of the watch who tried to hold the gap are dead.', fx: s => ({ pop: -3, morale: -3, stain: ['forced_cure', 1], do: s2 => settle(s2, T(s2), 'parted') }) } },
    { label: 'Make terms. They are our people, whatever else they are', test: { base: 40, mods: [R('chaplain', 10), If(s => T(s).terms >= 20, 15, 'You have dealt fairly with them'), If(s => T(s).terms <= -20, -15, 'What has been done to them already'), If(s => !!T(s).known.agenda, 10, 'You know what it wants')] },
      ok: { text: 'It is written down, on paper, and signed by people some of whom sign more slowly than they used to. There is one colony now, with two kinds of colonist in it.', fx: s => ({ morale: -1, do: s2 => settle(s2, T(s2), 'joined') }) },
      bad: { text: 'They hear the terms out. Then they go, politely, taking only what is theirs. They had already chosen a place.', fx: s => ({ do: s2 => settle(s2, T(s2), 'parted') }) } },
    { label: 'Put them out to the east valley, with a year of seed', dark: true, note: 'Everyone who carries it, sent away for what is in their blood. There will be two settlements, and one day yours will be the smaller.', cost: { food: 200 },
      out: { text: 'They leave in good order, with carts. People cry, on both sides of the gate. From the wall you can see their fires before the month is out.', fx: s => ({ stain: ['partition', 1], do: s2 => { T(s2).fair = true; settle(s2, T(s2), 'parted'); } }) } },
  ] });

/* ======================= AFTER ======================= */
B('after', { id: 'psg.after', tone: 'quiet', w: 3, title: 'A Season After',
  when: (s, t) => s.day - t.endDay >= 120,
  text: s => { const t = T(s); return ({
    purged: `A season on, the bunks have been reassigned. The cured are back at work. They are the same people they were, and they keep saying so, and their families keep watching them say it.${t.blamed ? `\n\nSomebody has painted over the petition about ${t.blamed}. Nobody has mentioned that the colony was wrong.` : ''}`,
    parted: `There is a settlement in the east valley now. ${t.fair ? 'They send a cart at the turn of each season, with whatever they have too much of.' : 'They do not send word. Their fields are straighter than yours.'} ${t.truth.agenda === 'home' ? 'Half of them have gone on, to the water. The rest are waiting their turn.' : 'There are children there.'}`,
    joined: `A year of two kinds of colonist. The carried ${({ home: 'still walk at night, and somebody walks with them now and brings them back', spread: 'still give away whatever they are handed', build: 'still build, by daylight now, and take requests', keep: 'are never sick, and have stopped apologising for it', gift: 'work through every winter in shirtsleeves, and have not set foot past the ridge', curious: 'still ask everyone the same questions, and listen to the answers as if nobody had ever answered before' })[t.truth.agenda]}. The rest have mostly stopped noticing. The first child born to two of the carried is six weeks old and has not yet cried.`,
    taken: `Nobody tests any more, and few of the people left would want to know. The work gets done and the colony is calm. As far as you can tell, you are one of the last who remembers it being otherwise.` }[t.end]); },
  choices: [
    { label: s => ({ purged: 'Say it aloud: we were wrong about some of it', parted: 'Send a cart of your own', joined: 'One school and one roll, with no second column', taken: 'Write down what it was like before' }[T(s).end]),
      out: { text: s => ({ purged: 'You say it once, at the evening meal, and nobody argues.', parted: 'It comes back full.', joined: 'The roll is called in one list. A few parents keep their own.', taken: 'It takes a month. You put it in the archive, where someone may want it.' }[T(s).end]), fx: s => ({ morale: 3 }) } },
    { label: s => ({ purged: 'Let it lie', parted: 'Let them be', joined: 'Keep the two lists for now', taken: 'Leave it' }[T(s).end]),
      out: { text: s => ({ purged: 'Nobody brings it up again, at least not in front of you.', parted: 'The smoke rises every morning. People have stopped pointing at it.', joined: 'The second list stays in a drawer, and everyone knows it is there.', taken: 'You leave it, and nobody asks you to do otherwise.' }[T(s).end]), fx: s => ({ do: s2 => { if (T(s2).end === 'joined') LF.emit(s2, 'suspicion', 'psg.lists', 25, 400, 'there are still two lists'); } }) } },
  ] });
LF.TAGS['psg.walk'] = ['cautious open', 'cautious open', 'closed order', 'mercy', 'severe closed'];
LF.TAGS['psg.blame'] = ['severe closed', 'cautious mercy', 'severe closed order'];
LF.TAGS['psg.tell'] = ['cautious open', 'order closed', 'free open', 'severe closed'];
LF.TAGS['psg.kin'] = ['open bold', 'cautious', 'closed', 'severe order'];
LF.TAGS['psg.test'] = ['order bold', 'order closed', 'free mercy', 'severe closed order'];
LF.TAGS['psg.table'] = ['open mercy', 'closed cautious', 'severe order', 'severe closed'];
LF.TAGS['psg.wants'] = ['open', 'cautious open', 'closed', 'severe closed'];
LF.TAGS['psg.tape'] = ['closed severe order', 'cautious', 'open mercy free', 'severe closed order'];
LF.TAGS['psg.speaks'] = ['open free', 'cautious', 'closed order'];
LF.TAGS['psg.cure'] = ['free cautious', 'cautious', 'severe order'];
LF.TAGS['psg.close'] = ['bold', 'cautious', '', 'severe closed'];
LF.TAGS['psg.warm'] = ['open', 'closed order', 'cautious open'];
LF.TAGS['psg.count'] = ['severe closed bold', 'open mercy', 'mercy free'];
LF.TAGS['psg.after'] = ['open mercy', 'closed'];
})();

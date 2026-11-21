/* Landfall — thread: the Founding Lie (STORY-PLAN.md §1b).
   Something about the mission is false, and one of the officers has always known. Rolled in secret: what the lie is
   (the target was known to be dead; no second ship was ever funded; not every sleeper volunteered; one of them woke
   on the voyage and the log was cleaned), and why the keeper kept it (to protect the colony, out of shame, or as a
   card to play). It reads suspicion and schism, which bring it out early, and writes revelation, grief and
   resentment when it comes out. It never reads another thread. The old Sleepers idea is folded in as two of the lies. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, Nw, Nwc, R, If, byPid } = h;
const TH = LF.th, T = s => LF.T(s, 'lie'), ID = 'lie', cap = t => t.charAt(0).toUpperCase() + t.slice(1);
LF.SECRET.lie = 'has known something about the mission from the start';
LF.SIGNS.record_wrong = 'a record that does not match what everyone was told';

const LIE = {
  dead:       { odd: s => `A clerk putting the ship's survey archive in order for ${Nw(s, 'teacher')} has found the first full reading of the target world, the one that showed the air gone. It is dated nine years before launch, and every briefing the sleepers were given called that world alive.`,
                is: 'The survey office knew the target was dead nine years before the ship left. The mission flew anyway, because a dead world does not get funded, and every briefing the sleepers signed said otherwise',
                short: 'the target world was known to be dead before the ship launched' },
  unfunded:   { odd: s => `A clerk reworking the long stores plan for ${Nw(s, 'quartermaster')}, around the resupply ship due in year twelve, has found that the budget line for that ship was closed before the Ariadne was finished. On paper, nothing was paid for the ship the plan is waiting on.`,
                is: 'There was never a second ship. The resupply written into every sleeper\'s contract was budgeted for one year and cancelled the next, before launch, and the officers were told',
                short: 'no second ship was ever funded, and the officers knew' },
  conscripts: { odd: s => `A clerk sorting the sleepers' medical files for ${Nw(s, 'physician')} has found that a third of them carry a second serial and the stamp of a court. The sleepers were all supposed to be volunteers.`,
                is: 'Not everyone in the cold volunteered. A third of the sleepers were sentenced to it: a court offered the ship in place of a prison term, and their records were sealed in the manifest',
                short: 'a third of the sleepers were sentenced to the voyage by a court' },
  waker:      { odd: s => `A clerk checking the cryo banks' wear figures for ${Nw(s, 'engineer')} has found one pod with eleven thousand fewer hours in the cold than the rest. The galley stores, checked against them, are six years short: six years of meals nobody on the watch ever logged.`,
                is: 'One sleeper woke eleven years into the voyage, from a pod fault, and lived for six years in the ship\'s aft holds, off the watch log, before going back into the cold. The log was edited afterwards so the record stayed clean',
                short: 'a sleeper woke on the voyage and lived aboard, off the log, for six years, and the log was cleaned' },
};
const WHY = {
  protect: { cast: { val: 'order' }, says: 'It\'d have broken the colony in the first year. I decided it still would. So I sat on it.', given: 'kept it to hold the colony together' },
  shame:   { cast: { val: 'mercy' }, says: 'I signed off on it. Before launch. I\'ve nearly told someone every day since.', given: 'kept it out of shame' },
  power:   { cast: { want: 'chair' }, says: 'Whoever knows a thing like this gets a say in what comes next. I wanted that say. Still do.', given: 'kept it as a card to play' },
};
const kp = s => { const t = T(s); return t && t.keeper ? byPid(s, t.keeper) : null; };
const kpOK = s => { const p = kp(s); return !!p && p.alive && !p.away; };
const kn = s => { const p = kp(s); return p ? p.name : 'whoever kept it'; };
const learn = (s, v) => { const t = T(s); t.insight = clamp(t.insight + v, 0, 100); };
function told(s, how) {
  const t = T(s), L = t.truth.lie;
  LF.emit(s, 'revelation', 'th.lie', 60, 150, `the colony has learned that ${LIE[L].short}`);
  LF.emit(s, 'resentment', 'th.lie', how === 'out' ? 45 : 25, how === 'out' ? 300 : 160, how === 'out' ? 'the officers kept the truth about the mission from everyone' : 'the mission lied to the people it sent');
  if (L === 'unfunded' || L === 'dead') LF.emit(s, 'grief', 'th.lie', 25, 120, L === 'unfunded' ? 'nobody is coming after the colony' : 'the colony was sent to a world its senders knew was dead');
  if (L === 'conscripts') LF.emit(s, 'schism', 'th.lie', 25, 300, 'everyone knows now which sleepers were sentenced');
}
LF.thread({ id: ID, free: true, name: 'The Founding Lie', view: 'people',
  fits: s => 0.38,
  roll: s => ({ lie: LF.spick(s, Object.keys(LIE)), why: LF.spick(s, Object.keys(WHY)) }),
  sig: t => t.truth.lie + '/' + t.truth.why,
  called: (s, t) => t.known.whole ? 'what the officers kept back' : null,
  ask: (s, t) => t.phase === 'cracks' ? 'Why does the ship\'s own record not match what everyone was told?' : 'What is the colony to do with what it was never told?',
  chap: { told: t => `The colony learned that ${LIE[t.truth.lie].short}, and heard it from its own officers.`,
          out: t => `It came out that ${LIE[t.truth.lie].short}. The colony heard it from a page pinned to a door.`,
          kept: t => 'The officers kept what they knew about the mission, and took it to their graves.' },
  clue: (s, t) => ({ txt: 'The last pages are a quarrel. Someone had known, before they ever left, that nobody would follow them, and had not said, and that is what the quarrel is about.', learn: s2 => learn(s2, 30) }),
  start: (s, t) => {
    const p = LF.cast(s, Object.assign({ officers: true, not: ['pilot'] }, WHY[t.truth.why].cast));
    if (!p || p.secret) { const q = s.people.find(x => x.alive && x.role && x.role !== 'pilot' && !x.secret && x.vals); if (!q) { t.on = false; return; } t.keeper = q.id; q.secret = { k: 'lie', d: 0 }; }
    else { t.keeper = p.id; p.secret = { k: 'lie', d: 0 }; }
    Object.assign(t, { wake: LF.sri(s, 140, 330), insight: 0, known: {}, asked: 0 });
  },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.wake || (s.day >= 100 && Math.max(LF.cv(s, 'suspicion'), LF.cv(s, 'schism')) >= 50)) { LF.phase(s, ID, 'cracks'); s.signs.push({ id: 'record_wrong', d: s.day, src: 'th.lie' }); LF.cue(s, 'lie.odd', 1, 12); } return; }
    if (t.phase === 'cracks' && !t.outCued && (s.day - t.since > 240 || (!kpOK(s) && s.day - t.since > 30))) { t.outCued = true; LF.cue(s, 'lie.out', 5, 40); }
    if (t.phase === 'buried') {
      if (!t.outCued && s.day - t.since > 100 && (Math.max(LF.cv(s, 'suspicion'), LF.cv(s, 'schism')) >= 40 || !kpOK(s))) { t.outCued = true; LF.cue(s, 'lie.out', 10, 60); }
      else if (s.day - t.since > 420) LF.endThread(s, ID, 'kept');
    }
  },
  press: (s, t, P) => { if (t.end === 'told') P.morale += 0.01; if (t.phase === 'buried') P.morale -= 0.01; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ gap: 30 }, st));

/* ======================= CRACKS ======================= */
B('cracks', { id: 'lie.odd', chain: true, tone: 'pressure', title: 'A Line That Is Wrong',
  text: s => `${LIE[T(s).truth.lie].odd(s)}\n\nIt may be a filing mistake, forty years old. The officers who would know are all in this colony.`,
  choices: [
    { label: 'Pull the whole record and check every line', test: { base: 50, mods: [R('teacher', 10), R('quartermaster', 5), If(s => !!(s.cargo && s.cargo.archive), 10, 'The archive')] },
      ok: { text: 'A month with the ship\'s files, with two officers off the work to do it. There are eleven more lines that are wrong, and every one of them covers the same story.', fx: s => ({ food: -40, do: s2 => { learn(s2, 45); T(s2).known.pattern = s2.day; LF.cue(s2, 'lie.keeper', 20, 50); } }) },
      bad: { text: 'A month with the ship\'s files, with two officers off the work to do it, and the files are a mess. Somebody has been through them before, and was tidier about it.', fx: s => ({ food: -40, do: s2 => { learn(s2, 20); LF.cue(s2, 'lie.keeper', 40, 90); } }) } },
    { label: 'Have security put it to the officers, one at a time', dark: true, note: 'Each of them is kept in a locked room until they have answered. One of them knows, and the rest will remember being asked this way.', info: [['yield', 'A quick answer'], ['danger', 'Every officer\'s regard']],
      out: { text: s => `Each officer is taken to the stores office alone and kept there until the questions run out. Most of them come out angry and know nothing. ${kpOK(s) ? kp(s).first + ' comes out last, and does not look angry.' : 'One chair stays empty.'}`, fx: s => ({ stain: ['questioned', 1], do: s2 => { learn(s2, 40); T(s2).asked = s2.day; LF.cue(s2, 'lie.keeper', 10, 30); for (const p of s2.people) if (p.alive && p.role && p.loyal !== undefined) p.loyal = clamp(p.loyal - 6, 0, 100); } }) } },
    { label: 'Burn the file, and post the clerk who found it to the far crews', dark: true, note: 'Nobody else has seen the file. One person is sent where there is nobody to tell.', info: [['yield', 'Morale holds'], ['danger', 'The one who found it']],
      out: { text: 'The file is burned and the clerk is on the far survey by the end of the month, with no reason given. The officers\' table does not ask why.', fx: s => ({ morale: 1, stain: ['gag', 1], do: s2 => { learn(s2, 8); LF.cue(s2, 'lie.keeper', 70, 130); } }) } },
  ] });
B('cracks', { id: 'lie.keeper', view: 'people', tone: 'pressure', title: 'Expected', repeat: 50,
  when: (s, t) => kpOK(s) && (t.puts || 0) < 2 && (t.insight >= 30 || s.day - t.since > 90),
  setup: s => TH.ctx(kp(s)),
  text: (s, c) => { const t = T(s); return t.insight >= 30
    ? `${c.name} asks for a word, late, when the officers' table is empty.\n\n[[${c.pid}]] "You've been reading the old files. I'd rather you heard it from me than pieced it together."\n\nThere is a folder on the table between you, not opened yet.`
    : `${c.name} has been sleeping badly and working worse. Twice this month the ${c.title} has asked whether anyone has been in the ship's files, and twice has not waited for the answer.`; },
  choices: [
    { label: (s, c) => `Hear ${c.first} out, alone`, out: { text: (s, c) => `It takes an hour. ${c.first} does not ask for anything, and does not stop until it is all said. By morning the other officers know there was a meeting they were kept out of.`, fx: (s, c) => ({ do: s2 => { const t = T(s2), p = kp(s2); LF.emit(s2, 'suspicion', 'lie.keeper', 15, 120, 'two of the officers are keeping something from the rest'); t.known.whole = s2.day; t.how = 'private'; if (p) { LF.reveal(s2, p, 'It came from the keeper, in private.'); p.loyal = clamp(p.loyal + 8, 0, 100); } LF.phase(s2, ID, 'known'); LF.cue(s2, 'lie.truth', 0, 3); } }) } },
    { label: 'Not now. There is enough to carry', out: { text: (s, c) => `${c.first} nods and takes the folder back to the ${c.title}'s quarters. The ${c.title}'s work is late and wrong for the rest of the month.`, fx: (s, c) => ({ do: s2 => { learn(s2, 20); const t = T(s2); t.puts = (t.puts || 0) + 1; if (t.puts < 2) LF.cue(s2, 'lie.keeper', 60, 100); const p = kp(s2); if (p) p.loyal = clamp(p.loyal - 5, 0, 100); } }) } },
    { label: (s, c) => `Take the folder, and tell ${c.first} what it costs to keep it shut`, dark: true, note: 'An officer who can be ruined by one page will vote the way you vote.', info: [['yield', 'An officer who cannot say no'], ['danger', 'One person, for good']],
      out: { text: (s, c) => `You hear all of it, and then you set the terms. ${c.first} listens without moving. From tonight the ${c.title} argues your side at the officers' table and signs whatever you put down, and both of you know why.`,
        fx: (s, c) => ({ stain: ['leverage', 1], do: s2 => { const t = T(s2), p = kp(s2); t.known.whole = s2.day; t.how = 'held'; if (p) { LF.reveal(s2, p, 'You took the folder, and set terms.'); p.loyal = clamp(p.loyal - 25, 0, 100); p.marks.held = { d: s2.day, txt: 'does as told, because of a folder you keep' }; } LF.phase(s2, ID, 'known'); LF.cue(s2, 'lie.truth', 0, 3); } }) } },
  ] });
B(['cracks', 'buried'], { id: 'lie.talk', x: true, tone: 'pressure', title: 'Talk at the Mess Table',
  when: (s, t) => !t.talked && s.day - t.since > 25 && ['suspicion', 'schism', 'resentment'].some(k => LF.cv(s, k) >= 35 && LF.source(s, k) !== 'th.lie' && !String(LF.source(s, k)).startsWith('lie.')),
  setup: s => { const k = ['suspicion', 'schism', 'resentment'].filter(k => LF.source(s, k) !== 'th.lie' && !String(LF.source(s, k)).startsWith('lie.')).sort((a, b) => LF.cv(s, b) - LF.cv(s, a))[0]; return { k, why: LF.because(s, k) }; },
  text: (s, c) => `People are already wary of the officers' table, ${TH.bec(s, c.k)}. Now there is a story going round about the voyage. The details are all wrong, but the outline is right: the officers know something about why the colony is here, and have not said.\n\n${Nwc(s, 'chaplain')} heard it at three tables in one evening.`,
  choices: [
    { label: s => T(s).known.whole ? 'Tell it properly, before the story does' : 'Say there is something, and that you are finding it', out: { text: s => T(s).known.whole ? 'You stand up in the mess hall and say it, all of it. Afterwards several people tell you the rumour was worse.' : 'You say there is a question about the ship\'s record, and that the answer will be posted when you have it. The rumour stops growing, but people still repeat it.',
      fx: s => ({ do: s2 => { const t = T(s2); t.talked = s2.day; if (t.known.whole) { told(s2, 'told'); LF.endThread(s2, ID, 'told', 'The officers told the colony what the mission had kept from it.'); } else { learn(s2, 20); LF.ease(s2, 'suspicion', 'lie.talk', 15, 120); } } }) } },
    { label: 'Deny it, with a better story ready', dark: true, note: 'A lie told well now holds for a season. It is one more thing to be caught in.', info: [['yield', 'Morale'], ['later', 'The day it is found out']],
      out: { text: s => `${Nc(s, 'chaplain')} is given the other story to tell: a filing error, an old grudge, a name to blame who died on the voyage. It is told at every table inside the month, and most people prefer it.`, fx: s => ({ morale: 2, stain: ['second_lie', 1], do: s2 => { T(s2).talked = s2.day; LF.ease(s2, 'suspicion', 'lie.talk', 15, 120); LF.emit(s2, 'suspicion', 'lie.talk', 15, 300, 'the officers had an answer ready for a story about the voyage'); } }) } },
    { label: 'Find out who started it', test: { base: 50, mods: [R('security', 10)] },
      ok: { text: 'It started with someone who once worked in the ship\'s records office and saw a file they were not cleared for. They are frightened, and glad to be asked.', fx: s => ({ do: s2 => { T(s2).talked = s2.day; learn(s2, 30); } }) },
      bad: { text: 'Six people are asked where they heard it. All six heard it from each other.', fx: s => ({ do: s2 => { T(s2).talked = s2.day; LF.emit(s2, 'suspicion', 'lie.talk', 25, 150, 'the watch is asking who said what at meals'); } }) } },
  ] });

/* ======================= KNOWN ======================= */
B('known', { id: 'lie.truth', chain: true, tone: 'crisis', title: 'What Was Kept',
  setup: s => TH.ctx(kp(s)),
  text: s => { const t = T(s), p = kp(s); return `${LIE[t.truth.lie].is}.\n\n${p && p.alive ? `${p.name} has known from the start.\n\n[[${p.id}]] "${WHY[t.truth.why].says}"\n\n` : `${kn(s)} knew from the start, and ${WHY[t.truth.why].given}. `}Nobody else at the table knew, and the colony still does not.`; },
  choices: [
    { label: 'The whole colony hears it tonight', note: 'People will be hurt and angry, but it will be out in the open.', out: { text: 'You say it in the mess hall with the officers standing behind you. People hear it out and go back to their pods early. In the morning the arguments start over breakfast, and by noon the door of the keeper\'s pod has been kicked in.',
      fx: s => ({ morale: -4, do: s2 => { const p = kp(s2); if (p && p.alive) p.marks.blamed = { d: s2.day, txt: 'named as the one who kept the mission\'s lie' }; if (p && T(s2).truth.why === 'shame') p.loyal = clamp(p.loyal + 15, 0, 100); told(s2, 'told'); LF.endThread(s2, ID, 'told', 'The officers told the colony what the mission had kept from it.'); } }) } },
    { label: (s, c) => kpOK(s) ? `Let ${c.first} tell it` : 'Read the keeper\'s own account aloud', about: true, test: { base: 50, mods: [R('chaplain', 10), If(s => T(s).truth.why === 'shame', 15, 'The keeper wants to say it'), If(s => T(s).truth.why === 'power', -15, 'The keeper is still keeping a little back')] },
      ok: { text: 'It is said plainly by someone who carried it, and people hear it as a confession. Two people go and sit with the keeper afterwards.', fx: s => ({ morale: -1, do: s2 => { const p = kp(s2); if (p) p.loyal = clamp(p.loyal + 10, 0, 100); told(s2, 'told'); LF.endThread(s2, ID, 'told', 'The officers told the colony what the mission had kept from it.'); } }) },
      bad: { text: 'It comes out in the wrong order, defended at every step. Some of the room hears an excuse, and some of it hears a threat.', fx: s => ({ morale: -5, do: s2 => { told(s2, 'out'); LF.endThread(s2, ID, 'told', 'The officers told the colony what the mission had kept from it, badly.'); } }) } },
    { label: 'Officers only. It stays buried', dark: true, note: 'The colony goes on working for a mission that lied to it, and every officer at the table is now part of the lie.', info: [['yield', 'Morale holds'], ['danger', 'Everyone who was lied to']],
      out: { text: 'The folder goes in the strongroom. Everyone at the officers\' table knows where it is, and has agreed to say nothing.',
      fx: s => ({ morale: 2, stain: ['shelved', 2], do: s2 => { const t = T(s2); LF.phase(s2, ID, 'buried'); s2.seeds.push({ id: 'lie:buried', k: 'secret', d: s2.day, txt: `the officers buried the truth that ${LIE[t.truth.lie].short}` }); LF.emit(s2, 'suspicion', 'th.lie', 18, 400, 'the officers are keeping something about the voyage'); } }) } },
  ] });

/* ======================= BURIED, OR LEFT TOO LONG ======================= */
B(['cracks', 'buried'], { id: 'lie.out', chain: true, tone: 'crisis', title: 'Pinned to the Door',
  setup: s => TH.ctx(kp(s)),
  text: s => { const t = T(s), p = kp(s), dead = p && !p.alive; return `${dead ? `Among ${p.name}'s things, when they were sorted, was a folder.` : 'Somebody has been in the strongroom, or in the old files, and has found what was there.'} This morning a page from it was pinned to the mess hall door, with one line underlined.\n\n${LIE[t.truth.lie].is}.\n\nEveryone who came to breakfast has read the page, and the rest have heard what it says.`; },
  choices: [
    { label: 'Own it. Say the officers knew, and say why', out: { text: 'You stand by the door with the page and answer every question until there are no more.', fx: s => ({ morale: -4, do: s2 => { told(s2, 'told'); LF.endThread(s2, ID, 'out', 'It came out, on a page pinned to a door, that the mission had lied.'); } }) } },
    { label: (s, c) => kpOK(s) ? `It was ${c.first}'s secret. Say so` : 'Lay it at the keeper\'s door', dark: true, note: 'It keeps the blame off the other officers and puts all of it on one.', info: [['yield', 'The officers\' table is spared'], ['danger', 'One officer, for good']], out: { text: s => `${kn(s)} is named as the one who kept it, alone. The crowd at the door has somebody to be angry with.`, fx: s => ({ morale: -1, stain: ['goat', 1], do: s2 => { const p = kp(s2); if (p && p.alive) { p.loyal = clamp(p.loyal - 35, 0, 100); p.marks.blamed = { d: s2.day, txt: 'named as the one who kept the mission\'s lie' }; } told(s2, 'out'); LF.endThread(s2, ID, 'out', 'It came out, on a page pinned to a door, that the mission had lied.'); } }) } },
    { label: 'Call it a forgery, and produce the forger', dark: true, note: 'Somebody with ink on their hands and no friends will confess after a night with the watch.', test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'It never happened'], ['danger', 'An innocent'], ['fail', 'Everything']],
      ok: { text: 'A records clerk is found with ink on both hands and, after a night with the watch, confesses to inventing the page. The clerk is put out past the wire and the page is burned in the yard. Most people choose to believe it, because the other thing is worse.',
        fx: s => ({ leave: 1, morale: 2, stain: ['forged', 2], do: s2 => { LF.phase(s2, ID, 'buried'); LF.emit(s2, 'suspicion', 'th.lie', 22, 400, 'a clerk confessed very quickly to forging a page about the voyage'); } }) },
      bad: { text: 'The clerk confesses, and then takes it back in front of the whole mess hall, with the bruises showing. Now the colony knows what the page says and what was done to hide it.',
        fx: s => ({ morale: -9, stain: ['forged', 2], do: s2 => { told(s2, 'out'); LF.emit(s2, 'schism', 'lie.out', 45, 320, 'the officers beat a false confession out of a clerk'); LF.endThread(s2, ID, 'out', 'It came out, on a page pinned to a door, that the mission had lied. The officers had tried to call the page a forgery.'); } }) } },
  ] });

/* ======================= AFTER: what is left once it is said ======================= */
B('after', { id: 'lie.files', view: 'people', tone: 'pressure', title: 'The Sealed Files',
  when: (s, t) => t.truth.lie === 'conscripts' && t.end !== 'kept' && !t.files && s.day - t.since > 20,
  text: s => `The court records of the sentenced sleepers are still sealed in the manifest. Some of the people they describe are down here now, and some are still in orbit. ${Nwc(s, 'security')} wants them read. ${Nwc(s, 'chaplain')} wants them burned.\n\n[[chaplain]] "Whatever they did, they did it on a world that's got no say over them now, and down here they're patients, same as you. I've stitched half of them already, and not one asked me to read their file first."`,
  choices: [
    { label: 'Burn them. Everyone starts here', out: { text: 'The files go into the furnace, one by one, with a witness from each pod row. Afterwards nobody can say who was sentenced. The watch says one of the files was for killing a child, and nobody can say whose that was either.', fx: s => ({ morale: 3, do: s2 => { LF.emit(s2, 'fear', 'lie.files', 18, 300, 'nobody knows now which of the sentenced did what'); T(s2).files = 'burned'; LF.ease(s2, 'schism', 'lie.files', 20, 300); } }) } },
    { label: 'Security reads them, and keeps a list', dark: true, note: 'Some of those crimes were real. The three worst are watched from now on, and searched when anything goes missing.', info: [['yield', 'The watch knows who to look at'], ['danger', 'Three people, for good']],
      out: { text: 'Security reads them. Three names go on a short list. The people on it are not told, and find out the first time their bunks are turned over.', fx: s => ({ tension: -8, stain: ['informers', 1], do: s2 => { T(s2).files = 'read'; LF.emit(s2, 'resentment', 'lie.files', 30, 250, 'security read the sentenced sleepers\' files'); LF.emit(s2, 'suspicion', 'lie.files', 20, 200, 'security keeps a list of the sentenced'); } }) } },
    { label: 'The sentences stand. They finish them here', dark: true, note: 'A court put them aboard to work off a term. Nobody ever said the term was over.', info: [['yield', 'Hands that eat half'], ['danger', 'Twelve people who thought it was behind them']],
      out: { text: 'Twelve people who thought the court was a lifetime behind them are read their sentences again in the yard. They are moved to a wire compound on half rations, with the years still owing chalked on the gate.',
        fx: s => ({ morale: -5, thralls: 12, stain: ['bond', 2], do: s2 => { T(s2).files = 'served'; LF.emit(s2, 'schism', 'lie.files', 40, 320, 'the sentenced sleepers were put behind wire to finish their terms'); } }) } },
  ] });
B('after', { id: 'lie.waker', view: 'people', tone: 'opportunity', title: 'Six Years Alone',
  when: (s, t) => t.truth.lie === 'waker' && t.end !== 'kept' && !t.waker && s.day - t.since > 20 && s.sleepers >= 1,
  text: s => `The sleeper who woke on the voyage is still in orbit, in the same pod. The ship's log, before it was cleaned, shows six years of work, done out of sight of the watch: the hull walked end to end, a hydroponics rack kept alive in the aft hold, and a seventy-page notebook on every fault in the ship.\n\n${Nwc(s, 'engineer')} would give a great deal to talk to whoever wrote it.`,
  choices: [
    { label: 'Bring them down on the next shuttle', note: 'It is a flight for one person.', out: { text: 'The lander makes the flight for one pod. They come down the ramp blinking and say it is strange to see so many people at once. Within the month they have walked the colony end to end, the way they walked the ship, and found four things wrong with it. They sleep outside, and will not go into a room with a door that shuts.', fx: s => ({ pop: 1, sleepers: -1, parts: 8, machine: { reactor: 6, reclaimer: 6, lander: -8 }, do: s2 => { T(s2).waker = 'down'; } }) } },
    { label: 'Wake them where they are. The ship needs a keeper', dark: true, note: 'Nobody else alive could keep the cryo banks and the dock running alone, and nobody else has already proved they can stand it.', info: [['yield', 'The ship kept, and its faults read down by radio'], ['danger', 'One person, alone again']],
      out: { text: 'The pod is opened by remote. It is an hour before they answer the radio, and when they do they ask how long this time. Nobody has a number. The fault reports start coming down the next morning, in the same hand as the notebook.',
        fx: s => ({ sleepers: -1, parts: 10, machine: { lander: 10, reactor: 6, reclaimer: 6 }, stain: ['waker', 2], do: s2 => { T(s2).waker = 'kept'; } }) } },
  ] });
B('after', { id: 'lie.plan', tone: 'opportunity', title: 'Nobody Is Coming',
  when: (s, t) => (t.truth.lie === 'unfunded' || t.truth.lie === 'dead') && t.end !== 'kept' && !t.plan && s.day - t.since > 20,
  text: s => { const t = T(s); return t.truth.lie === 'unfunded'
    ? `Every long plan the colony has made waits on the second ship: the spare reactor core, the second lander, the people. ${Nwc(s, 'quartermaster')} has struck the year-twelve line through, and has not yet written anything in its place.`
    : `The mission was sent to die, or to be lucky. ${Nwc(s, 'chaplain')} says people have stopped talking about Earth at all.`; },
  choices: [
    { label: 'Send word home anyway, and say what was done', out: { text: 'The message is short and very plain, and sending it takes the array at full power for a month. Every lamp in the camp is dimmed to pay for it. There may be nobody on Earth left to read it.', fx: s => ({ morale: 1, food: -60, machine: { reactor: -4 }, flags: { wrote_home: true }, do: s2 => { T(s2).plan = 'wrote'; } }) } },
    { label: 'Tell them a ship is coming after all', dark: true, note: 'People will work through the bad years if they think help is coming.', info: [['yield', 'Morale'], ['later', 'The day it does not come']],
      out: { text: s => `${T(s).truth.lie === 'unfunded' ? Nc(s, 'quartermaster') : Nwc(s, 'quartermaster')} is given a date to write into the stores plan, and a signal log to go with it. The mess hall is loud that night for the first time in a season. The officers who know there is no signal do not stay for the singing.`,
        fx: s => ({ morale: 7, stain: ['second_lie', 1], do: s2 => { T(s2).plan = 'lie'; LF.ease(s2, 'grief', 'lie.plan', 25, 300); LF.emit(s2, 'suspicion', 'lie.plan', 20, 500, 'the officers say a ship is coming, and will not show anyone the signal'); } }) } },
  ] });
LF.TAGS['lie.odd'] = ['cautious', 'severe order', 'order closed'];
LF.TAGS['lie.keeper'] = ['mercy', 'cautious', 'severe order'];
LF.TAGS['lie.talk'] = ['free open', 'order closed', 'order'];
LF.TAGS['lie.truth'] = ['free open', 'mercy free', 'order closed'];
LF.TAGS['lie.out'] = ['free', 'severe', 'severe order'];
LF.TAGS['lie.files'] = ['mercy free', 'order severe', 'severe order'];
LF.TAGS['lie.waker'] = ['bold mercy', 'severe order'];
LF.TAGS['lie.plan'] = ['open', 'order closed'];
})();

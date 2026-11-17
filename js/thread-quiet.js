/* Landfall — thread: the Quiet Ship (Lachlan, 2026-11-16; DESIGN.md "The Quiet Ship").
   One evening the Ariadne stops answering. No telemetry, no cryo report, nobody on the radio, and she still crosses at
   dusk on time. Whoever goes up finds one of four things, rolled in secret (t.truth.is):
     gone     nobody aboard. The officers who stayed up are missing, a bank of pods is open and dry, and the airlock log
              shows it cycled in the small hours, again and again. Nobody will ever say why.
     changed  everyone is there, and fine, and pleased to see you, and wrong in small ways: they have rearranged the
              banks, they hum the same tune, they call the world by a name nobody gave it. Bring them down and they
              stay that way among everyone else.
     grown    something came up in a cargo pod from the ground and has grown in the warm round the system cradles.
              The officers aboard are shut in the cryo bay. The boarding party meets it in the hold.
     double   an officer the colony has on the ground is also aboard: thinner, tired, sure they never came down, and the
              pod log agrees. Which is the real one is rolled too (t.truth.real: 'ground' or 'ship'). The seat is held by
              one person object either way; p.qsFalse marks whether the one the colony kept is not the real one, and a
              later card (qs.tell) lets that come out.
     signal   her running lights blink in flash code: HELP, or STAY AWAY (t.truth.msg). See "the mission" below.
     other    a second, older ship comes alongside and starts carrying her sleepers across.
   While she is dark the ship's other cards are held (s.flags.qs_dark), shuttle runs stop, and the schematic shows the
   dark sections (LF.SHIP_MARKS). Reads nothing of any other thread; writes unexplained, fear, suspicion and changed.
   A free thread: about the colony itself, not charged to the world's budget. Dice from LF.srand. No DOM. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, F, R, byPid, anyNamed } = h;
const ID = 'quiet', T = s => LF.T(s, ID), SRC = 'th.quiet';
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => NUM[n] || String(n), cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
const ship = s => s.world.ship || 'the Ariadne';
const here = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p : null; };
const lead = s => here(s, 'security') || here(s, 'command') || here(s, 'engineer');
const and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
const dark = (s, on) => { s.flags.qs_dark = on ? s.day : 0; };
const canUp = s => LF.canFly(s) && !s.machines.lander.lost && s.machines.lander.hp > 15 && !s.flags.lander_grounded;
const dbl = (s, t) => t.dbl && byPid(s, t.dbl);

LF.thread({ id: ID, free: true, name: 'The Quiet Ship', view: 'ship',
  fits: s => (s.sleepers >= 40 || LF.inOrbit(s).length) ? 0.42 : 0,
  roll: s => ({ is: LF.spick(s, ['gone', 'changed', 'grown', 'double', 'signal', 'other']), real: LF.spick(s, ['ground', 'ship']), msg: LF.spick(s, ['help', 'away']) }),
  sig: t => t.truth.is + (t.truth.is === 'double' ? '/' + t.truth.real : t.truth.is === 'signal' ? '/' + t.truth.msg : ''),
  called: (s, t) => t.phase !== 'latent' ? 'the quiet ship' : null,
  ask: (s, t) => t.phase === 'two' ? 'Which of them is the real one?' : 'Why did the ship stop answering?',
  clue: (s, t) => ({ txt: 'The last page is a radio log, kept for a month after the ship went quiet. Every pass the same line: "No answer. Lights in the windows."', learn: s2 => {} }),
  chap: {
    sealed: t => 'The ship went quiet and the boarding party found her empty. The colony sealed what was left and never learned why.',
    kept: t => 'The ship went quiet and was found empty. The colony put a watch aboard her and kept her going, and the watch did not like it up there.',
    abandoned: t => 'The ship went quiet and the colony stopped flying to her. She still crosses at dusk.',
    down: t => 'The ship went quiet, and the people aboard were found changed. The colony brought them down to live among everyone else.',
    left: t => 'The ship went quiet, and the people aboard were found changed. The colony left them up there and stopped flying.',
    tested: t => 'The ship went quiet, and the people aboard were found changed. The clinic tested them, and kept what it found to itself.',
    burned: t => 'Something grew in the ship\'s hold from a pod sent up from the ground. The colony burned the hold out, and everything in it.',
    vented: t => 'Something grew in the ship\'s hold. The colony opened her to vacuum and killed it, and some of the sleepers with it.',
    cleared: t => 'Something grew in the ship\'s hold. The watch went in after it and cleared it by hand.',
    one: t => `The ship sent down a second ${t.dblName}, and the colony kept one of them.${t.truth.real === t.kept ? ' It kept the real one.' : ''}`,
    both: t => `The ship sent down a second ${t.dblName}, and the colony shot both rather than choose.`,
    two: t => `The ship sent down a second ${t.dblName}, and the colony lives with two of them.`,
    rescued: t => 'The ship went quiet and blinked for help. The colony went up and brought the living down.',
    restarted: t => 'The ship went quiet and blinked for help. A boarding party started her again by hand, and she answered.',
    stripped: t => 'The ship blinked for help. The colony took her officers and her cargo, and left the ones who had woken aboard to the dark.',
    late: t => 'The ship blinked for help for months. By the time anyone went up, a boot was working the switch.',
    waited: t => 'The ship blinked a warning. The boarding party that went up anyway stayed aboard until the sickness had burned out.',
    held: t => 'The ship blinked a warning. The boarding party brought the sickness as far as the pad, and it went no further.',
    brought: t => 'The ship blinked a warning. The colony went up anyway, and brought down what the warning was about.',
    leftsick: t => 'The ship blinked a warning. The boarding party came home across the hull and left everyone behind the glass.',
    heeded: t => 'The ship blinked a warning, and the colony heeded it. When it was over, the ones who had sent it came down.',
    kept2: t => 'The ship blinked a warning, and the colony heeded it. The ones who had sent it went on keeping her.',
    traded: t => 'A second ship came alongside and took sleepers from the banks. The colony let it keep them, for the ship back.',
    retaken: t => 'A second ship came alongside and took sleepers from the banks. The boarding party cleared the hold, and it ran.',
    robbed: t => 'A second ship came alongside, took what it wanted from the banks and the hold, and was gone.',
    tunnel: t => 'A second ship came alongside to take sleepers. The colony opened its boarding tunnel to vacuum with thirty people in it.',
    joined: t => 'A second ship came alongside to take sleepers. The colony offered its people the ground, and they came down.',
  },
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 150, 460), waited: 0, kept: null, dblName: '' }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent' && s.day >= t.wake && !s.machines.lander.lost && (s.sleepers > 20 || LF.inOrbit(s).length)) {
      // the double needs somebody on the ground to be doubled; without one, the ship is merely changed
      if (t.truth.is === 'double') { const p = here(s, 'command') || here(s, 'scientist') || here(s, 'doctor') || here(s, 'engineer') || here(s, 'works') || here(s, 'security');
        if (p) { t.dbl = p.id; t.dblName = p.name; } else t.truth.is = 'changed'; }
      LF.phase(s, ID, 'silent', `The ${ship(s)} stopped answering.`); dark(s, true); t.dark0 = s.day;
      s.signs.push({ id: 'machine_fault', d: s.day, src: SRC }); LF.emit(s, 'unexplained', SRC, 45, 300, `the ${ship(s)} has stopped answering`);
      LF.cue(s, 'qs.silent', 1, 8); }
    if (t.phase === 'silent' && s.day % 30 === 0 && s.sleepers > 0) s.sleepers = Math.max(0, s.sleepers - 2);   // nobody minding the banks
  },
});
/* What the schematic shows while she is dark, and after. */
(LF.SHIP_MARKS = LF.SHIP_MARKS || []).push(s => { const t = s.threads && s.threads[ID]; if (!t || !t.on) return null;
  if (t.phase === 'silent') return { bridge: 'dark', crew: 'dark', banks: 'unknown', hold: 'unknown' };
  if (t.phase === 'boarding' && t.truth.is === 'grown') return { hold: 'growth' };
  return { sealed: { crew: 'sealed', banks: 'sealed' }, abandoned: { bridge: 'dark', crew: 'dark', banks: 'dark', hold: 'dark' }, burned: { hold: 'breach' }, vented: { banks: 'breach', hold: 'breach' }, left: { crew: 'sealed' } }[t.end] || null; });

const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'ship', chain: true, w: 6 }, st));
const ups = s => LF.inOrbit(s).map(p => p.first);
/* The officers who were aboard when she went quiet: not found, and written off. */
const lost = (s, ids) => { for (const id of ids) { const p = byPid(s, id); if (!p || !p.alive) continue; p.orbit = false; p.away = false; LF.killPerson(s, p, 'missing from the ship when she went quiet'); } };

/* What the radio room and the ridge get while she is dark: the first month, the second, and every month after. */
const HEARD = {
  gone: [(s, c) => `The radio gives back the ship's own voice, reading the manifest. Every name. When it reaches ${c.up.length ? and(c.up) : 'the waking crew'} it reads them out with the dead.`,
    () => 'The manifest has stopped. In its place, every pass, there is the airlock chime: the two notes it plays when the inner door seals. Forty-one times, and then nothing until the next pass.',
    () => 'There is nothing on any band now. The dish can hear her pumps running, and one door.'],
  changed: [(s, c) => `Last night a voice came on, warm and easy. "${c.up.length ? `${c.up[0]} here` : 'Bank C here'}. Sorry about the quiet. We're all fine up here. We've been busy." Then it hung up.`,
    (s, c) => `The warm voice is on every pass now, and it knows things. It asked whether the east plots had been resown. It asked how the child born last month is feeding. Nobody has told the ship anything in ${moW(c.mo)}.`,
    () => 'There are several voices on the channel now, all saying the same words a little apart, like a round. "We\'re all fine up here. Come when you can."'],
  grown: [() => 'Last night there was something on the channel for nine seconds: knocking, three and three, from inside a wall, and then a breath that was too long to be a person\'s.',
    () => 'The knocking comes every pass now, three and three, slower each time. Under it the dish picks up the hold thermostats, every one of them reading blood heat.',
    () => 'The knocking has stopped. The channel is open, though, and whatever is on it is wet and very close to the microphone.'],
  double: [(s, c) => `Last night a voice came on. "This is ${c.dbl}. Why hasn't anyone come?" ${c.dblFirst} was standing next to you in the radio room when it said it.`,
    (s, c) => `The voice is on every pass. It knows ${c.dblFirst}'s service number and the name of ${c.dblFirst}'s first posting. It said one other thing, once, and ${c.dblFirst} left the room.`,
    () => '"I know you can hear me," the voice says now. "I can hear the room. I can hear myself breathing in it."'],
  help: [() => 'Her running lights are still going, the same pattern every pass. Whoever is working them has not missed one.',
    () => 'The pattern is slower now. Last night it broke off halfway and did not start again until she was nearly down the sky.',
    () => 'Last night she crossed with her running lights steady. Nothing blinked.'],
  away: [() => 'Her running lights are still going, the same pattern every pass. Whoever is working them has not missed one.',
    () => 'The pattern has changed. It is shorter: one word, perhaps, where there were two.',
    () => 'Last night the pattern was new again: three long, then dark, three long, then dark.'],
  other: [() => 'The second light has closed up. Through the glass they are one bright mark with a join in it.',
    () => 'The dish hears metal on metal carried through her hull: something being moved, for hours, every pass.',
    () => 'There was a third light last night, very small, crossing from one to the other. Then another, going back.'],
};
/* ======================= the silence ======================= */
B('silent', { id: 'qs.silent', tone: 'crisis', title: 'No Answer', urgent: true, repeat: 15,
  setup: s => { const L = lead(s), t = T(s); return { up: ups(s), n: s.sleepers, fly: canUp(s), L: L ? L.first : null, waited: t.waited, fled: t.fled || 0, mo: mo(s, t), is: t.truth.is, k: t.truth.is === 'signal' ? t.truth.msg : t.truth.is, dbl: t.dblName, dblFirst: (t.dblName || '').split(' ')[0] }; },
  text: (s, c) => c.waited || c.fled
    ? `${c.fled ? `The ones who came back from her have given their report and have said nothing since. ` : ''}${c.waited ? `${cap1(moW(c.mo))} since she went dark. ` : ''}${HEARD[c.k][Math.min(Math.max(c.waited, 1), 3) - 1](s, c)}\n\nShe still crosses at dusk, on time, lights in the windows.${c.n ? ` ${c.n} are asleep up there with nobody minding the banks.` : ''}`
    : `The ${ship(s)} has stopped answering. No telemetry, no cryo report, ${c.up.length ? `nothing from ${and(c.up)},` : 'no ship\'s voice,'} and the radio room has tried every channel for three days. She still crosses at dusk on time. ${c.is === 'signal' ? 'There are lights in the windows, and her running lights have started to blink.' : c.is === 'other' ? 'There are lights in the windows, and a second light, small and dim, a little way behind her.' : 'There are lights in the windows.'}\n\n${c.n} people are asleep up there. ${c.L ? `"Give me four and the lander," ${c.L} says. "Whatever it is, I'd rather see it."` : 'Nobody wants to be the one who says what it might be.'}`,
  choices: [
    { label: 'Send the lander up with a boarding party', req: (s, c) => canUp(s), reqText: s => s.machines.lander.lost ? 'There is no lander' : LF.flyWhy(s) || 'The lander is not fit to fly', note: 'Four of the watch, suited, armed, with orders to report every ten minutes.', hint: 'unknown', info: [['danger', 'The four, and the lander'], ['yield', 'An answer']],
      out: { text: (s, c) => `The lander goes up at first light with four aboard${c.fled ? ', two of them the same two as before' : ''}. Nobody on the pad says anything while she climbs. The first report comes from the docking collar: "Hard seal. Collar lights are on. Nobody here to meet us." Then the inner door, and they go in.`, fx: s => ({ fly: 1, machine: { lander: -6 }, flags: { qs_lander_up: s.day }, do: s2 => { T(s2).moUp = mo(s2, T(s2)); LF.phase(s2, ID, 'boarding'); LF.cue(s2, 'qs.deep', 0, 2); } }) } },
    // waiting: four times at most (two until 2026-11-16). After that it is go up or cut her loose, and the shuttle runs wait on the answer.
    { show: (s, c) => c.waited < 4, label: 'Keep the radio room open on every pass, and wait', note: 'Nobody goes up. Every month the banks go unminded, and whatever is aboard has another month.', hint: 'unknown', info: [['danger', 'The sleepers, unminded'], ['yield', 'Nobody sent into it']],
      out: { text: 'The radio room is manned in shifts, day and night. People bring the operators tea and ask, and are told nothing has come.', fx: s => ({ sleepers: -Math.min(4, s.sleepers), do: s2 => { const t = T(s2), k = t.truth.is; t.waited++; if (k === 'signal' && !t.lights) LF.cue(s2, 'qs.lights', 6, 14); else if (k === 'other' && !t.second) LF.cue(s2, 'qs.second', 6, 14); else LF.cue(s2, 'qs.silent', 22, 34); } }) } },
    { label: 'Cut her loose. No flights, no radio, no more talk of it', dark: true, note: (s, c) => `Whatever is up there stays up there, and so do the ${c.n} asleep${c.up.length ? `, and ${and(c.up)}` : ''}.`, hint: 'unknown', info: [['yield', 'Nobody sent up, nothing brought down'], ['danger', 'Everyone aboard']],
      out: { text: 'The radio room is locked and the lander pulled into the shed. People still look up at dusk, and the watch moves them on.', fx: s => ({ morale: -4, stain: ['ship_cut', 3], flags: { lander_grounded: s.day, sleepers_abandoned: true, qs_dark: 0 }, sched: s.sleepers > 0 ? [['sleep.lights', 20, 50]] : [], do: s2 => { for (const p of LF.inOrbit(s2)) p.stranded = s2.day; LF.endThread(s2, ID, 'abandoned'); } }) } },
  ] });

/* ======================= aboard ======================= */
const TOLD = {
  gone: (s, c) => `"Nobody. Nobody anywhere." The bunks are made, the galley is clean, and a cup of tea on the bridge has dried to a ring. ${c.up.length ? `${and(c.up)} ${c.up.length === 1 ? 'is' : 'are'} not aboard.` : ''} Bank C's lids are up, every one, and the pods are dry. The airlock log shows the inner door cycled forty-one times between two and four in the morning, on the night she went dark. ${c.mo >= 3 ? 'It has cycled once a night since, at the same hour, with nobody at the panel.' : 'The forty-second is the one the party watched.'}`,
  changed: (s, c) => `"They're here." A long gap. "All of them." ${c.up.length ? `${and(c.up)} and a dozen sleepers out of their pods` : 'Twelve sleepers, out of their pods and dressed,'} are standing in the spine in two rows when the inner door opens, facing it, with the lights off. They say the party leader's name, which nobody gave them, all together. They are warm and well and very glad.\n\nEvery pod in the banks has been turned to face the planet. They hum the same few notes while they work, and call the world by a name nobody below has ever used. Asked what they have been doing for ${moW(c.mo)}, ${c.up.length ? c.up[0] : 'the nearest'} says, "Listening. You're so loud down there."`,
  grown: (s, c) => `The report comes in shouted. Something is in the hold, round the warm cradles, grown out of a cargo pod that went up from the ground: pale, ribbed, the size of a room and moving. ${c.up.length ? `${and(c.up)} ${c.up.length === 1 ? 'is' : 'are'} alive, shut in the cryo bay with the door welded from the inside.` : 'The cryo bay door has been welded from the inside.'} One of the party is already hurt.`,
  double: (s, c) => `"There's someone in the infirmary." It is ${c.dbl}: thinner, tired, unshaven, sure of every date. "I never came down. I gave the seat to nobody. I've been here keeping the banks alone since the flight." The pod log agrees. It shows ${c.dblFirst}'s pod opened on the day of the flight, and a body walking out of it to the lander.`,
};
B('boarding', { id: 'qs.board', tone: 'crisis', title: 'Aboard', urgent: true, w: 9, repeat: 15,
  setup: s => { const t = T(s), p = dbl(s, t); return { is: t.truth.is, up: ups(s), upIds: LF.inOrbit(s).map(p => p.id), dbl: p ? p.name : t.dblName, dblFirst: p ? p.first : t.dblName.split(' ')[0], dblId: p ? p.id : null, n: s.sleepers, mo: moUp(s, t) }; },
  text: (s, c) => TOLD[c.is](s, c),
  choices: [
    // gone
    { show: (s, c) => c.is === 'gone', label: 'Seal the banks that are left, and bring the party home', note: 'Whatever happened up here, it happened while people were awake. Nobody stays awake up here again.', hint: 'unknown', info: [['danger', 'The ship, unminded for good'], ['yield', 'The party home']],
      out: { text: 'The party seals bank C and the crew deck behind them and comes home. On the ground they will not talk about it, not even to each other.', fx: (s, c) => ({ sleepers: -Math.min(40, Math.round(s.sleepers * 0.3)), morale: -4, flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { lost(s2, c.upIds); LF.emit(s2, 'fear', SRC, 40, 200, `the ${ship(s2)} was found empty`); LF.endThread(s2, ID, 'sealed'); } }) } },
    { show: (s, c) => c.is === 'gone', label: 'Leave two of the party aboard to keep her', note: 'Somebody has to mind the banks. They will be up there alone with whatever was here.', hint: 'unknown', info: [['yield', 'The banks minded'], ['danger', 'The two left aboard']],
      out: { text: 'Two volunteers stay. Their first nights they report every hour. By the end of the month they are reporting once a day, briefly, and they have stopped saying good night.', fx: (s, c) => ({ sleepers: -Math.min(40, Math.round(s.sleepers * 0.3)), leave: 2, flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { lost(s2, c.upIds); LF.emit(s2, 'unexplained', SRC, 40, 300, 'two of the watch are living aboard the empty ship'); LF.endThread(s2, ID, 'kept'); } }) } },
    // changed
    { show: (s, c) => c.is === 'changed', label: 'Bring them down. They are ours', note: 'They will live among everyone else, humming.', hint: 'unknown', info: [['people', 'Everyone aboard, home'], ['danger', 'Whatever they are now']],
      out: { text: (s, c) => `They come down smiling and are hugged on the pad. They fit in at once, too well. Within a week three children are humming the same notes.`, fx: (s, c) => ({ pop: c.up.length ? 0 : Math.min(12, s.sleepers), sleepers: c.up.length ? 0 : -Math.min(12, s.sleepers), flags: { qs_lander_up: 0, qs_dark: 0, qs_changed_down: s.day }, do: s2 => { for (const id of c.upIds) { const p = byPid(s2, id); if (p) { LF.bringDown(s2, p); p.marks.changed = { d: s2.day, txt: 'came back from the quiet ship humming' }; } } LF.emit(s2, 'changed', SRC, 45, 500, 'the people from the quiet ship are not quite who they were'); LF.endThread(s2, ID, 'down'); } }) } },
    { show: (s, c) => c.is === 'changed', label: 'Leave them up there, and stop flying', dark: true, note: 'They can keep the banks. They seem to like it. Nobody comes down from her again.', hint: 'unknown', info: [['yield', 'Whatever it is stays up there'], ['danger', 'The people aboard, and the sleepers']],
      out: { text: 'The party backs out of the collar. The ones aboard wave from the window. The lander is put in the shed. At dusk, the ship\'s lights blink, three and three, every pass.', fx: (s, c) => ({ morale: -3, stain: ['ship_cut', 2], flags: { qs_lander_up: 0, lander_grounded: s.day, sleepers_abandoned: true, qs_dark: 0 }, sched: s.sleepers > 0 ? [['sleep.lights', 30, 60]] : [], do: s2 => { for (const id of c.upIds) { const p = byPid(s2, id); if (p) p.stranded = s2.day; } LF.endThread(s2, ID, 'left'); } }) } },
    { show: (s, c) => c.is === 'changed', label: 'Test them first, in the ship\'s infirmary, before anyone touches them', note: (s, c) => `${N(s, 'doctor') === LF.seatWord(s, 'doctor') ? 'Nobody' : N(s, 'doctor')} by radio, the party's medic doing the needle work. They will let it be done, cheerfully.`, hint: 'unknown', test: { base: 48, mods: [R('physician', 22), R('xenobio', 10)] }, info: [['yield', 'Knowing what they are'], ['danger', 'What the test shows']],
      ok: { text: 'Blood, scans, a night of observation. Something is in their blood that was not in it on the ship\'s manifest, the same in every one of them, and it is fading. They come down in a month, and stop humming by the harvest.', fx: (s, c) => ({ flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { for (const id of c.upIds) LF.bringDown(s2, byPid(s2, id)); if (!c.up.length) s2.pop += 12, s2.sleepers = Math.max(0, s2.sleepers - 12); LF.endThread(s2, ID, 'tested'); } }) },
      bad: { text: 'Every result is normal. Every one. The medic sends up the slides again and they are normal again. The party\'s medic starts humming on the flight back down.', fx: (s, c) => ({ flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { for (const id of c.upIds) { const p = byPid(s2, id); if (p) { LF.bringDown(s2, p); p.marks.changed = { d: s2.day, txt: 'came back from the quiet ship humming' }; } } if (!c.up.length) s2.pop += 12, s2.sleepers = Math.max(0, s2.sleepers - 12); LF.emit(s2, 'changed', SRC, 50, 500, 'the people from the quiet ship are not quite who they were'); LF.endThread(s2, ID, 'down'); } }) } },
    // grown
    { show: (s, c) => c.is === 'grown', label: 'Burn the hold out, cradles and all', note: (s, c) => `Every system still aboard burns with it.${LF.aboard(s).length ? ` That is ${and(LF.aboard(s).map(id => 'the ' + LF.MACHINES[id].name))}.` : ''}`, hint: 'unknown', info: [['yield', 'It dies'], ['danger', 'Every system left in the hold']],
      out: { text: 'The party seals the hold and floods it with lander fuel and lights it. The hold burns for six hours. When they open it, there is nothing in it that was ever alive or ever worked.', fx: (s, c) => ({ machine: { lander: -8 }, flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { for (const id of LF.aboard(s2)) { s2.machines[id].lost = true; s2.machines[id].hp = 0; } for (const id of c.upIds) LF.bringDown(s2, byPid(s2, id)); LF.endThread(s2, ID, 'burned'); } }) } },
    { show: (s, c) => c.is === 'grown', label: 'Open her to vacuum, everything but the occupied banks', dark: true, note: (s, c) => `The unheated banks go with it. About ${num(Math.min(12, Math.round(c.n * 0.25)))} dozen sleepers are in pods the ship can't keep warm through it.`, hint: 'unknown', info: [['yield', 'It dies, and the cradles survive'], ['danger', 'The sleepers in the cold banks']],
      out: { text: (s, c) => `Every door on the ship opens at once. The thing in the hold comes apart in the vacuum like wet paper. So does the heat in banks C and D. The cryo report that comes down afterwards is a long list.`, fx: (s, c) => ({ sleepers: -Math.round(c.n * 0.3), stain: ['vented', 3], flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { for (const id of c.upIds) LF.bringDown(s2, byPid(s2, id)); LF.endThread(s2, ID, 'vented'); } }) } },
    { show: (s, c) => c.is === 'grown', label: 'Fight through to the cryo bay and kill it by hand', note: 'Cutters, flares and the four of them. Everything else aboard survives if they do.', hint: 'unknown', test: { base: 42, mods: [R('security', 20), R('engineer', 8)] }, risky: true, info: [['yield', 'It dies, and nothing else is lost'], ['danger', 'The party']],
      ok: { text: 'It takes a day and a night. They cut it apart in sections and push the sections out of the lock. One of the party comes home with a burn down an arm that will not stop itching.', fx: (s, c) => ({ pop: -1, flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { for (const id of c.upIds) LF.bringDown(s2, byPid(s2, id)); LF.endThread(s2, ID, 'cleared'); } }) },
      bad: { text: (s, c) => `Their reports stop at the hold door. Two come back to the collar. The thing is still in there, and it has moved toward the warmth of the banks.`, fx: (s, c) => ({ pop: -2, morale: -6, sleepers: -Math.min(10, s.sleepers), do: s2 => { LF.emit(s2, 'fear', SRC, 50, 200, 'something is loose in the ship\'s hold'); LF.cue(s2, 'qs.board', 18, 30); } }) } },
    // double
    { show: (s, c) => c.is === 'double', label: (s, c) => `Bring this ${c.dblFirst} down, and put them both in a room`, note: 'One table, two chairs, and everyone who knew them before the ship.', hint: 'unknown', info: [['yield', 'A chance to tell them apart'], ['danger', 'Which one the colony keeps']],
      out: { text: (s, c) => `The second ${c.dblFirst} comes down the ramp and stops dead at the sight of the first, who has come to meet the lander. Neither says anything. The watch walks them both to the mess hall.`, fx: (s, c) => ({ flags: { qs_lander_up: 0, qs_dark: 0 }, do: s2 => { LF.phase(s2, ID, 'two'); LF.cue(s2, 'qs.two', 0, 1); LF.emit(s2, 'suspicion', SRC, 45, 220, `there are two of ${c.dbl}`); } }) } },
    { show: (s, c) => c.is === 'double', label: (s, c) => `Leave this one up there. The ${c.dblFirst} below is the real one`, dark: true, note: 'Lock the infirmary, bring the party home, and fly no more to the ship. The one aboard has the banks.', hint: 'unknown', info: [['yield', 'No question for the colony to answer'], ['danger', 'The one aboard, if it is the real one']],
      out: { text: (s, c) => `The infirmary door is locked from the outside. The voice on the radio asks, every pass, for a month, why. Then it asks for ${c.dblFirst} by name, and ${c.dblFirst} below goes very quiet and leaves the radio room.`, fx: (s, c) => ({ stain: ['double_left', 2], flags: { qs_lander_up: 0, lander_grounded: s.day, qs_dark: 0, sleepers_abandoned: true }, sched: s.sleepers > 0 ? [['sleep.lights', 30, 60]] : [], do: s2 => { const t = T(s2); t.kept = 'ground'; const p = dbl(s2, t); if (p && t.truth.real === 'ship') p.qsFalse = s2.day; if (p) LF.shift(s2, p.id, 'mind', -15); LF.endThread(s2, ID, 'one'); if (p && p.qsFalse) LF.cue(s2, 'qs.tell', 120, 220); } }) } },
  ] });

/* ======================= the mission (Lachlan, 2026-11-16) =======================
   A playtester sat under a dark ship for six months, went up, and was met with coffee. Going aboard is now three cards:
   the launch (qs.silent), forty minutes in (qs.deep: the ship gets to one of the four before anything is known, and
   the party can still be pulled out with nothing learned), and what they find. What they find is worse the longer she
   has been dark (mo). Two more truths came with it:
     signal   her running lights blink in flash code at the dusk pass. It says HELP or STAY AWAY (t.truth.msg), and a
              reading off the ridge is certain and can be wrong (qs.lights; t.read is what the colony believes).
              help: the mind died and took the crew deck's air; whoever woke is living in the cryo bay, fewer every
              month and all dead after a year (qs.air). away: something thawed out of bank C, and the ones aboard sealed the deck and warned the
              colony off; a party that goes up walks into it, and one that waits eight months finds it burned out (qs.glass).
     other    a second light closes on her (qs.second): an older ship, alongside, carrying her sleepers across (qs.guests). */
const mo = (s, t) => Math.max(1, Math.round((s.day - (t.dark0 || t.woke || s.day)) / LF.MONTH));
const moUp = (s, t) => t.moUp || mo(s, t);   // how long she had been dark when the party went up: the mission's own cards do not add to it
const moW = n => n >= 12 ? (n < 18 ? 'a year' : 'more than a year') : LF.monthsWord(n);
const share = (s, f, cap) => Math.min(cap, s.sleepers, Math.round(s.sleepers * f));
const home = { qs_lander_up: 0, qs_dark: 0 };
const down = (s, ids) => { for (const id of ids) LF.bringDown(s, byPid(s, id)); };
const reveal = s => { const t = T(s), k = t.truth.is; LF.cue(s, k === 'signal' ? (t.truth.msg === 'help' ? 'qs.air' : 'qs.glass') : k === 'other' ? 'qs.guests' : 'qs.board', 0, 1); };
const pullOut = s => { const t = T(s); t.fled = (t.fled || 0) + 1; s.flags.qs_lander_up = 0; LF.phase(s, ID, 'silent'); LF.cue(s, 'qs.silent', 20, 32); };

const DEEP = {
  gone: c => `The first three reports come on the ten minutes. Bunks made. Galley clean. Nobody. The fourth is late, and when it comes it is three voices. The one who was at the back of the line is at the airlock with a helmet off, working the inner door: open, shut, open, shut. The counter on the panel reads forty-two.\n\n"Won't answer us," the party leader says. "Won't look round."`,
  changed: c => `The first three reports come on the ten minutes. Lights on, air good, nobody at the collar. At the fourth the party can hear humming in the vents, a few notes over and over. By the fifth one of the four is humming it too, and has not noticed.\n\n"I've told them twice to stop," the party leader says. "They say they're not doing anything."`,
  grown: c => `The first three reports come on the ten minutes. At the fourth the spine corridor is warm and the walls are wet, with a skin on them that is in no drawing of this ship. One of the four has put a glove against it. The glove will not come away, and the skin is moving up the sleeve.\n\n"We can cut the suit off," the party leader says. "It'll take all the time we've got."`,
  double: c => `The first three reports come on the ten minutes. The fourth is answered before it is finished, on the ship's own intercom, in ${c.dbl}'s voice. "I can hear you in the spine. Why are you whispering? Who sent you?" One of the four has served under ${c.dblFirst} for years, has sat down on the deck, and will not go further.\n\n${c.dblFirst}, beside you in the radio room, has heard all of it.`,
  help: c => `The first report comes from the collar. The second comes from a crew deck with no air in it: frost on every surface, a door blown off its track, and the forward lamp wired to a switch that runs back through a bulkhead into the cryo bay. Somebody is knocking on the far side of that bulkhead. One of the four has torn a suit on the door frame getting to it.\n\n"Forty minutes of patch," the party leader says. "After that the suit's a bag."`,
  away: c => `The first report comes from the collar. The second comes from the crew deck door, which is taped corner to corner, with one word lettered on the tape by hand: NO. One of the four cut the tape before the others had read it, and is inside.\n\n"There's a smell," the party leader says. "Coming through the suits. That shouldn't be possible."`,
  other: c => `The first three reports come on the ten minutes. Lights on, air good, nobody. At the fourth there are voices under the deck, in the hold, in something close to ship's talk, and a light in the cargo lock where there has never been one. The one at the back of the line is no longer at the back of the line.\n\n"Didn't hear a thing," the party leader says. "Turned round and counted three."`,
};
/* A second party, after the first was pulled out or broken: it knows the way, and one of them knows it too well. */
const AGAIN = 'The four go straight to where the last party turned back. Everything is as it was left, down to a glove on the deck. One of them was here before, has stopped at the same bulkhead, and will not pass it.\n\n"Can\'t make them," the party leader says. "I\'ve tried."';
const deepKey = t => t.truth.is === 'signal' ? t.truth.msg : t.truth.is;
B('boarding', { id: 'qs.deep', tone: 'crisis', title: 'Forty Minutes', urgent: true, w: 9, repeat: 6,
  setup: s => { const t = T(s), p = dbl(s, t); return { k: deepKey(t), fled: t.fled || 0, dbl: p ? p.name : t.dblName, dblFirst: p ? p.first : (t.dblName || '').split(' ')[0], mo: moUp(s, t) }; },
  text: (s, c) => c.fled ? AGAIN : DEEP[c.k](c),
  choices: [
    { label: 'All four go on, together, to whatever it is', risky: true, note: 'Nobody is left behind, and four people go deeper into a ship that has already got to one of them.', hint: 'unknown', test: { base: 36, mods: [R('security', 18), R('command', 8)] }, info: [['yield', 'An answer, and all four home'], ['danger', 'The party']],
      ok: { text: 'They take the fourth by the harness and go on in a line, reporting every minute now. The reports get shorter. Then the party leader says, "Wait," and the channel is open and silent for the longest minute of the year.', fx: s => ({ do: s2 => reveal(s2) }) },
      bad: { text: 'The reports break up at the next bulkhead. Two voices come back to the collar. The lander undocks with two seats empty, and the two who are in it cannot agree on what they saw.', fx: s => ({ dead: 2, morale: -5, do: s2 => { LF.emit(s2, 'fear', SRC, 50, 220, `two of the boarding party did not come back from the ${ship(s2)}`); pullOut(s2); } }) } },
    { label: 'Bring them home, now', note: (s, c) => `Four come back alive. A flight of fuel is spent, she is still dark, and whatever is aboard has had ${moW(c.mo)} already.`, hint: 'unknown', info: [['yield', 'The four'], ['danger', 'No answer, and everyone still aboard']],
      out: { text: 'The four are back at the collar in six minutes and on the ground by dark. They give their report standing. Asked what was in there, the party leader says, "We didn\'t get that far," and looks at the one it got to.', fx: s => ({ morale: -3, do: s2 => { LF.emit(s2, 'fear', SRC, 35, 180, `the boarding party came back from the ${ship(s2)} with nothing`); pullOut(s2); } }) } },
    { label: 'Three go on. The fourth stays where they are', dark: true, note: 'The answer is certain, and one person is left alone in a corridor of that ship to buy it.', hint: 'unknown', info: [['yield', 'An answer'], ['danger', 'The one who is left']],
      out: { text: 'The order goes up, and for a while nobody acknowledges it. Then three sets of boots go on down the spine. The fourth channel stays open the whole time, and nobody in the radio room turns it down.', fx: s => ({ dead: 1, morale: -2, stain: ['qs_left', 2], do: s2 => reveal(s2) }) } },
  ] });

/* ======================= signal: the lights ======================= */
B('silent', { id: 'qs.lights', tone: 'pressure', title: 'Long and Short', urgent: true, w: 8,
  when: (s, t) => t.truth.is === 'signal' && !t.lights,
  // a reading off the ridge is certain either way: whether it is right is rolled here, and nothing on the card says
  setup: s => { const t = T(s), right = LF.srand(s) < 0.4 + 0.35 * LF.dept(s, 'scientist'); t.lights = s.day; return { msg: t.truth.msg, read: right ? t.truth.msg : t.truth.msg === 'help' ? 'away' : 'help' }; },
  text: (s, c) => `At the dusk pass her running lights are blinking. They have never blinked before. It is the same pattern every evening, long and short, for the four minutes she is above the ridge, and the next evening it picks up where it left off.\n\nNobody on the ground has read flash code since training. The code book is in the archive. Reading it through haze, off a light the size of a pinhead, is another matter.`,
  choices: [
    { label: 'Put a glass and the code book on the ridge, and read it', note: 'Four minutes a pass. Whoever reads it will be sure of what they read, right or wrong.', hint: 'unknown', info: [['yield', 'A reading'], ['danger', 'A wrong one, believed']],
      out: { text: (s, c) => `Three evenings on the ridge with a glass and a slate. ${c.read === 'help' ? 'The slate reads H, E, L, P, then a figure that is a 6 or a 9, then the same again.' : 'The slate reads S, T, A, Y, a gap, A, W, A, Y, then the same again.'} The reader is certain of the letters. The reader was certain on the first evening too, and had it as something else.`,
        fx: (s, c) => ({ do: s2 => { T(s2).read = c.read; LF.emit(s2, 'unexplained', SRC, 40, 260, c.read === 'help' ? `the ${ship(s2)} is blinking for help` : `the ${ship(s2)} is blinking a warning to stay away`); LF.cue(s2, 'qs.silent', 16, 28); } }) } },
    { label: 'Answer with the pad lamp, and ask who is sending', note: 'A month of passes to send one question and read one answer. The banks go unminded for it, and so does whoever is at that switch.', hint: 'unknown', info: [['yield', 'A surer reading'], ['danger', 'A month, and whoever has not got one']],
      out: { text: (s, c) => c.msg === 'help' ? 'The pad lamp is turned up the sky and worked by hand, WHO, every pass for a month. On the last evening the answer comes back slowly, with long gaps: a name off the waking list, then AIR, then a single figure.' : 'The pad lamp is turned up the sky and worked by hand, WHO, every pass for a month. On the last evening the answer comes back fast, as if it had been waiting: SICK. Then NO, and NO again, and NO until she is below the ridge.',
        fx: (s, c) => ({ sleepers: -Math.min(4, s.sleepers), do: s2 => { const t = T(s2); t.read = c.msg; t.sure = true; t.waited++; LF.emit(s2, 'unexplained', SRC, 40, 260, c.msg === 'help' ? `someone aboard the ${ship(s2)} is running out of air` : `there is sickness aboard the ${ship(s2)}`); LF.cue(s2, 'qs.silent', 4, 10); } }) } },
    { label: 'Tell the colony her running lights have a fault', dark: true, note: 'Nobody climbs the ridge with a glass, and nobody lies awake working out letters. Whoever is at that switch goes on working it for nobody.', hint: 'unknown', info: [['yield', 'Morale'], ['danger', 'Whoever is sending']],
      out: { text: 'It is posted as a fault in the lighting bus, and for a week people believe it. Then a child on the ridge copies the pattern onto a slate, the same every evening, and asks what kind of fault can spell.', fx: s => ({ morale: 2, stain: ['qs_fault', 1], do: s2 => { LF.emit(s2, 'suspicion', SRC, 35, 200, 'the lights on the ship were called a fault, and they spell'); LF.cue(s2, 'qs.silent', 16, 28); } }) } },
  ] });

const AIR = (s, c) => c.late
  ? `Behind the bulkhead is the cryo bay. ${c.up.length ? `${and(c.up)} and the` : 'The'} sleepers the fault woke lived in it on suit air and thaw water, and kept a tally on the wall. The tally stops some months short of today. The lamp switch is wedged over with a boot, and has been blinking by itself since.\n\nThe party leader reads the last line of the tally over the radio before anyone can say not to. "They can see us. They must be able to see us."`
  : `Behind the bulkhead is the cryo bay, and in it ${c.up.length ? `${and(c.up)} and ` : ''}${c.alive ? `${num(c.alive)} sleepers the fault woke` : c.up.length ? 'nobody else' : 'one sleeper the fault woke'} have been living on suit air and thaw water for ${moW(c.mo)}. The ship's mind died in a power fault and took the crew deck's air with it. ${c.up.length ? `${c.up[0]} has been at the lamp switch every dusk pass since.` : 'They have taken the lamp switch in turns, every dusk pass since.'}${c.alive < 9 ? ' There were more of them. The ones who did not last are back in the pods they came out of.' : ''}\n\nNobody is minding the banks, and nothing aboard is going to start again by itself.`;
B('boarding', { id: 'qs.air', tone: 'crisis', title: 'The Far Side of the Door', urgent: true, w: 9,
  // other cards take the months in between: one wait is three to five of them, so a year is two or three waits
  setup: s => { const t = T(s), m = moUp(s, t), ups0 = LF.inOrbit(s), alive = clamp(9 - Math.round(m * 0.75), ups0.length ? 0 : 1, 9), late = m >= 12, sys = LF.aboard(s)[0] || null;
    return { mo: m, up: ups(s), upIds: ups0.map(p => p.id), n: s.sleepers, alive: late ? 0 : alive, late, sys, sysName: sys ? LF.MACHINES[sys].name : null }; },
  text: (s, c) => AIR(s, c),
  choices: [
    { show: (s, c) => !c.late, label: 'Bring every one of them down, and seal her', note: 'The lander will carry them. Nobody stays to mind the banks.', hint: 'unknown', info: [['people', 'Everyone alive aboard'], ['danger', 'The sleepers, unminded for good']],
      out: { text: (s, c) => `They come down grey and blinking, in suits that have to be cut off them. ${c.up.length ? c.up[0] : 'One of them'} asks how long it took the ridge to read the lamp, and nobody answers. The banks are sealed behind them.`,
        fx: (s, c) => ({ pop: c.alive, sleepers: -share(s, 0.3, 40), machine: { lander: -6 }, flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'rescued'); } }) } },
    { label: 'Two of the party stay, and start her again by hand', note: (s, c) => `The banks are minded again, by two people living where ${c.late ? 'the others died' : 'the others nearly died'}.`, hint: 'unknown', test: { base: 50, mods: [R('engineer', 18)] }, info: [['yield', 'The ship answering again'], ['danger', 'The two who stay']],
      ok: { text: (s, c) => `It takes them nine days in suits. The mind comes back slow, with most of a year missing, and the first thing it does is read out the cryo report. The two come down on the next flight${c.late ? ', and do not want to talk about the bay' : ', and are bought drinks for a month'}.`,
        fx: (s, c) => ({ pop: c.alive, flags: home, do: s2 => { if (c.late) lost(s2, c.upIds); else down(s2, c.upIds); LF.endThread(s2, ID, c.late ? 'late' : 'restarted'); } }) },
      bad: { text: 'They get air back into the crew deck and nothing else. On the eleventh day the fault comes again, at night. The next dusk the forward lamp is blinking, in a hand the ridge does not know.',
        fx: (s, c) => ({ pop: c.alive, dead: 2, sleepers: -share(s, 0.3, 40), morale: -4, flags: home, do: s2 => { if (c.late) lost(s2, c.upIds); else down(s2, c.upIds); LF.emit(s2, 'fear', SRC, 45, 220, 'the two left to restart the ship are blinking her lights'); LF.endThread(s2, ID, c.late ? 'late' : 'rescued'); } }) } },
    { show: (s, c) => !c.late && c.alive > 0, dark: true, label: (s, c) => c.sys ? `Put the ${c.sysName} in the seats. The sleepers who woke wait for another flight` : 'Fill the seats with her spares and coolant. The sleepers who woke wait for another flight', note: 'There will be no other flight in time, and everyone on that deck can count seats.', hint: 'unknown',
      info: (s, c) => [['yield', c.sys ? c.sysName : 'Spares and plate'], ['danger', `${cap1(num(c.alive))} ${c.alive === 1 ? 'person' : 'people'}`]],
      out: { text: (s, c) => `${c.up.length ? `${and(c.up)} ${c.up.length === 1 ? 'comes' : 'come'} down strapped in beside ${c.sys ? 'the ' + c.sysName : 'the crates'}` : `${c.sys ? 'The ' + c.sysName : 'The cargo'} comes down in the seats`}. The ones left on the deck were told a second flight was fuelling. The lamp goes on blinking for eleven more passes.`,
        fx: (s, c) => Object.assign({ sleepers: -share(s, 0.3, 40), morale: -4, stain: ['qs_seats', 3], machine: { lander: -6 }, flags: home }, c.sys ? {} : { parts: 14, mat: 40 },
          { do: s2 => { if (c.sys && s2.machines[c.sys] && !s2.machines[c.sys].lost) { s2.machines[c.sys].up = false; LF.log(s2, `The ${c.sysName} is down from the ship and working.`, 'good'); } down(s2, c.upIds); LF.endThread(s2, ID, 'stripped'); } }) } },
    { show: (s, c) => c.late, label: 'Close the bulkhead, and bring the party home', note: 'Nobody stays aboard her again.', hint: 'unknown', info: [['yield', 'The party home'], ['danger', 'The sleepers, unminded for good']],
      out: { text: 'The party closes the bulkhead on them and takes the boot off the switch. That evening she crosses with her lights steady, and people on the ridge who had stopped looking up look up.',
        fx: (s, c) => ({ sleepers: -share(s, 0.3, 40), morale: -5, flags: home, do: s2 => { lost(s2, c.upIds); LF.emit(s2, 'grief', SRC, 45, 260, 'the ones aboard the ship blinked for help until they died'); LF.endThread(s2, ID, 'late'); } }) } },
  ] });

const GLASS = (s, c) => c.burnt
  ? `The tape on the crew deck door has been cut from the inside. ${c.up.length ? `${and(c.up)} ${c.up.length === 1 ? 'is' : 'are'} waiting behind it` : 'Six people out of bank C are waiting behind it'}, thin as rails, with the infirmary scrubbed to bare plate behind them and a row of sealed pods they will not let the party open.\n\n"You read it," ${c.up.length ? c.up[0] : 'the oldest of them'} says. "We weren't sure anyone down there still could." It burned out a month ago. They kept the lamp going until they were certain.`
  : `The crew deck is a sick bay. ${c.up.length ? c.up[0] : 'A sleeper out of bank C'} is on the far side of the infirmary glass, grey to the lips, writing on it backwards with a grease pencil so that the party can read it: YOU WERE TOLD.\n\nSomething thawed out of bank C with the last cryo cycle and went through the waking crew in nine days. They sealed the deck, pulled the comm core so that nobody below could be talked into coming, and went to the lamp. The party has been breathing that corridor for forty minutes.`;
B('boarding', { id: 'qs.glass', tone: 'crisis', title: 'Behind the Glass', urgent: true, w: 9,
  setup: s => { const t = T(s), m = moUp(s, t); return { mo: m, burnt: m >= 8, up: ups(s), upIds: LF.inOrbit(s).map(p => p.id), n: s.sleepers }; },
  text: (s, c) => GLASS(s, c),
  choices: [
    { show: (s, c) => !c.burnt, label: 'The party stays aboard until it has burned out', note: 'Nothing comes down. The four go behind the glass with the others, and some of them will not come out.', hint: 'unknown', info: [['yield', 'The colony, untouched'], ['danger', 'The four']],
      out: { text: (s, c) => `The four take their helmets off, since it no longer matters, and go behind the glass. The lamp changes hands. Two of them come down in the end, with ${c.up.length ? and(c.up) : 'three out of bank C'}, on a flight nobody is allowed to meet.`,
        fx: (s, c) => ({ dead: 2, pop: c.up.length ? 0 : 3, sleepers: -share(s, 0.2, 30), morale: -3, flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'waited'); } }) } },
    { show: (s, c) => !c.burnt, label: 'Bring the party home, and hold them at the pad', risky: true, note: 'A tent, a trench, and food passed over on a pole. The ones behind the glass are left to finish dying.', hint: 'unknown', test: { base: 46, mods: [R('physician', 22)] }, info: [['yield', 'Some of the four'], ['danger', 'Everyone, if the trench does not hold it']],
      ok: { text: 'A tent on the pad, a trench round it, food on a pole. Two of the four are dead inside the month and are burned where they lay. It does not cross the trench.',
        fx: (s, c) => ({ dead: 2, sleepers: -share(s, 0.3, 40), morale: -3, flags: home, do: s2 => { lost(s2, c.upIds); LF.endThread(s2, ID, 'held'); } }) },
      bad: { text: 'The tent holds for six days. Then the cook who carried the pole is coughing, and after that nobody can say where the trench ought to be.',
        fx: (s, c) => ({ pop: -9, sleepers: -share(s, 0.3, 40), morale: -8, flags: home, do: s2 => { lost(s2, c.upIds); LF.emit(s2, 'sickness', SRC, 60, 240, `the boarding party brought the sickness down from the ${ship(s2)}`); LF.endThread(s2, ID, 'brought'); } }) } },
    { show: (s, c) => !c.burnt, dark: true, label: 'The party crosses the hull with their suits bled to vacuum, and leaves the rest', note: 'Nothing lives through that on a suit, or in one for long. Everyone behind the glass is left, and the banks with them.', hint: 'unknown', info: [['yield', 'The four home, and clean'], ['danger', 'Everyone behind the glass']],
      out: { text: 'They cross the hull in suits bled down to nothing and come in frost-burned and bleeding at the ears, and clean. Behind them the lamp starts again that evening, the old pattern, and keeps it up for nineteen passes.',
        fx: (s, c) => ({ sleepers: -share(s, 0.5, 70), morale: -4, stain: ['qs_glass', 3], flags: home, do: s2 => { lost(s2, c.upIds); LF.endThread(s2, ID, 'leftsick'); } }) } },
    { show: (s, c) => c.burnt, label: 'Bring them down', note: 'More mouths, and a row of sealed pods the families below will want opened.', hint: 'unknown', info: [['people', 'Everyone who lived'], ['danger', 'The stores, and bank C\'s families']],
      out: { text: 'They come down the ramp one at a time and stop at the bottom until somebody waves them on. For a month they eat at the far table, by their own choice, and wash their hands until the skin splits.',
        fx: (s, c) => ({ pop: c.up.length ? 0 : 6, sleepers: -share(s, 0.2, 30), morale: 3, flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'heeded'); } }) } },
    { show: (s, c) => c.burnt, label: 'Ask them to stay, and go on keeping her', note: 'The banks are minded by the only people who know what is in the sealed pods. They have done most of a year up there already.', hint: 'unknown', info: [['yield', 'The ship answering, and the banks kept'], ['danger', 'The ones asked to stay']],
      out: { text: (s, c) => `${c.up.length ? c.up[0] : 'The oldest of them'} looks at the party leader for a long moment and then nods. The core goes back in its rack. That evening the ship answers the radio room for the first time in ${moW(c.mo)}, and signs off early.`,
        fx: (s, c) => ({ morale: -1, flags: home, do: s2 => { for (const id of c.upIds) { const p = byPid(s2, id); if (p) LF.shift(s2, p, 'mind', -10); } LF.endThread(s2, ID, 'kept2'); } }) } },
  ] });

/* ======================= other: the second light ======================= */
B('silent', { id: 'qs.second', tone: 'pressure', title: 'A Second Light', urgent: true, w: 8,
  when: (s, t) => t.truth.is === 'other' && !t.second,
  setup: s => { T(s).second = s.day; const L = lead(s); return { L: L ? L.first : null }; },
  text: (s, c) => `There are two lights at the dusk pass. The second is smaller and dimmer than the ${ship(s)} and keeps a little behind her, and by the end of the week it has closed the gap. It shows no beacon and answers on no band.\n\nNothing the colony knows of should be in this sky.${c.L ? ` "That's a hull," ${c.L} says. "Under power. Somebody's flying it."` : ''}`,
  choices: [
    { label: 'Turn the dish on it, and listen', note: 'A month of passes. The banks go unminded for it.', hint: 'unknown', info: [['yield', 'What it is'], ['danger', 'A month, and the sleepers']],
      out: { text: (s, c) => `The dish hears a reactor older than the ${ship(s)}'s, running rough, and pumps. On the ninth evening it hears voices carried through a hull: a dozen at least, in something close to ship's talk, and one of them laughing.`,
        fx: s => ({ sleepers: -Math.min(4, s.sleepers), do: s2 => { const t = T(s2); t.heard = true; t.waited++; LF.emit(s2, 'strangers', SRC, 40, 260, `there are people aboard the second ship beside the ${ship(s2)}`); LF.cue(s2, 'qs.silent', 4, 10); } }) } },
    { label: 'Hail it, on every band the archive lists', note: 'Whoever is aboard learns there is a colony under them, and where.', hint: 'unknown', info: [['yield', 'An answer, perhaps'], ['danger', 'Being found']],
      out: { text: 'The hail goes up on every pass for a week. On the last evening the second light shows a lamp of its own, once, pointed straight down at the ridge, and holds it there for the whole pass.',
        fx: s => ({ do: s2 => { T(s2).hailed = true; LF.emit(s2, 'watched', SRC, 45, 260, 'the second ship turned a lamp on the colony'); LF.cue(s2, 'qs.silent', 16, 28); } }) } },
    { label: 'Say nothing. The colony has one ship to be afraid of already', dark: true, note: 'The ridge watch is sworn to it. Everyone else sees one light, a little brighter, and goes on believing the sky is empty.', hint: 'unknown', info: [['yield', 'Morale'], ['danger', 'Everyone who is not told']],
      out: { text: 'The ridge watch is sworn and the log goes in a drawer. It holds for a month. Then somebody\'s grandmother, who has watched that light cross every evening since landfall, says at supper that it has grown a tail.',
        fx: s => ({ morale: 1, stain: ['qs_hid', 1], do: s2 => { LF.emit(s2, 'suspicion', SRC, 35, 200, 'the second light was kept from the colony'); LF.cue(s2, 'qs.silent', 16, 28); } }) } },
  ] });

B('boarding', { id: 'qs.guests', tone: 'crisis', title: 'The Other Lock', urgent: true, w: 9,
  setup: s => { const t = T(s), m = moUp(s, t); return { mo: m, up: ups(s), upIds: LF.inOrbit(s).map(p => p.id), n: s.sleepers, taken: Math.min(s.sleepers, clamp(8 * m, 8, 48)), sys: LF.aboard(s)[0] || null }; },
  text: (s, c) => `There is another ship on the cargo lock. She is older than the ${ship(s)} by a century and patched over every metre, and a soft tunnel runs from her hold into this one. About thirty people are working it: small, pale and quick, born aboard, speaking something that was ship's talk once. They pulled the comm core on the first day. ${c.taken ? `They have carried ${num(c.taken)} cryo pods across since, and another is in the tunnel now.` : 'The banks were empty when they came, and they have been taking the hold apart instead.'}\n\n${c.up.length ? `${and(c.up)} ${c.up.length === 1 ? 'is' : 'are'} in the galley with a guard on the door, fed and unharmed.` : 'Nobody was awake aboard to stop them.'} Their speaker is an old woman with a slate. She draws a pod, and then a child, and looks at the party leader to see whether that is understood.`,
  choices: [
    { label: 'Trade. They keep what they have carried, and give back the core', note: (s, c) => c.taken ? `${cap1(num(c.taken))} sleepers go with them, to be woken among strangers as somebody's children.` : 'They keep what they have cut out of the hold.', hint: 'unknown', info: (s, c) => [['yield', 'The ship answering, and nobody hurt'], ['danger', c.taken ? `${cap1(num(c.taken))} sleepers` : 'The hold']],
      out: { text: 'The old woman rubs out the slate and draws it again with a line down the middle. The core comes back wrapped in a blanket. Their ship lets go at the next dusk pass, and the colony watches the second light drop behind and go out.',
        fx: (s, c) => ({ sleepers: -c.taken, morale: -3, flags: home, do: s2 => LF.endThread(s2, ID, 'traded') }) } },
    { label: 'Take her back. The party clears the hold', risky: true, note: 'Four with rifles against thirty with cutters, in a hold full of sleeping people.', hint: 'unknown', test: { base: 44, mods: [R('security', 20), R('command', 6)] }, info: [['yield', 'Every pod they have not got away with'], ['danger', 'The party, and whoever is in the tunnel']],
      ok: { text: (s, c) => `It is over in the time it takes to cross the hold. They do not fight. They run for the tunnel with what they can carry, and three of them do not reach it. The second ship tears her own lock getting away.${c.taken ? ` ${cap1(num(Math.round(c.taken / 2)))} of the pods are still on this side.` : ''}`,
        fx: (s, c) => ({ sleepers: -Math.round(c.taken / 2), morale: 1, flags: home, do: s2 => LF.endThread(s2, ID, 'retaken') }) },
      bad: { text: 'They do not fight. They close the tunnel with two of the party inside it, and let go. By the next pass the second light is gone, and so is everything that was on her side of the lock.',
        fx: (s, c) => ({ dead: 2, sleepers: -c.taken, morale: -6, flags: home, do: s2 => { if (c.sys && s2.machines[c.sys]) { s2.machines[c.sys].lost = true; s2.machines[c.sys].hp = 0; } LF.endThread(s2, ID, 'robbed'); } }) } },
    { label: 'Open the tunnel to vacuum while they are in it', dark: true, note: 'Every pod stays, with nobody left alive to wake it for themselves, and her hull is the colony\'s to strip.', hint: 'unknown', info: [['yield', 'The pods, her spares, her fuel'], ['danger', 'Thirty people']],
      out: { text: 'The party leader asks you to say it again, and you do. It takes one valve. Afterwards the four go through the old ship with torches. There are bunks in there a metre long, and a schoolroom.',
        fx: (s, c) => ({ parts: 16, mat: 60, morale: -5, stain: ['qs_tunnel', 4], flags: home, do: s2 => { s2.fuel = (s2.fuel || 0) + 1; LF.emit(s2, 'grief', SRC, 30, 200, 'there was a schoolroom aboard the second ship'); LF.endThread(s2, ID, 'tunnel'); } }) } },
    { label: 'Offer them the ground', note: 'Thirty mouths who have never stood under a sky, and every pod comes back.', hint: 'unknown', info: [['people', 'About thirty'], ['danger', 'The stores, and what the colony makes of them']],
      out: { text: 'It takes the old woman a long time to understand the drawing, and longer to believe it. They come down holding on to each other on the ramp. Most of them will not go out from under a roof for a month.',
        fx: (s, c) => ({ pop: 28, morale: -2, machine: { lander: -8 }, flags: home, do: s2 => { LF.emit(s2, 'strangers', SRC, 55, 400, 'thirty people from another ship are living in the colony'); LF.endThread(s2, ID, 'joined'); } }) } },
  ] });
LF.TAGS['qs.deep'] = ['bold', 'cautious', 'severe'];
LF.TAGS['qs.lights'] = ['cautious', 'open', 'closed order'];
LF.TAGS['qs.air'] = ['mercy', 'bold', 'severe', 'cautious closed'];
LF.TAGS['qs.glass'] = ['mercy cautious', 'bold', 'severe closed', 'open mercy', 'order'];
LF.TAGS['qs.second'] = ['cautious', 'open bold', 'closed order'];
LF.TAGS['qs.guests'] = ['open cautious', 'bold', 'severe closed', 'open mercy'];

/* ======================= the double: two of them ======================= */
B('two', { id: 'qs.two', tone: 'crisis', title: 'Two Chairs', urgent: true, w: 9, repeat: 6,
  setup: s => { const t = T(s), p = dbl(s, t); return { pid: p ? p.id : null, name: p ? p.name : t.dblName, first: p ? p.first : t.dblName.split(' ')[0], real: t.truth.real }; },
  text: (s, c) => `Two of ${c.name} at one table. The same scar on the same knuckle. The same way of holding a cup. Each knows the other's every answer before it is given, and each one looks at the other as if at something on the floor.\n\n"I came down on the flight," says one. "I never left the ship," says the other. ${N(s, 'doctor') === LF.seatWord(s, 'doctor') ? 'Nobody' : N(s, 'doctor')} has taken blood from both and the blood is the same.`,
  choices: [
    { label: 'Ask what only the real one could know', note: 'Something from before the ship, never written down, that the colony can check.', hint: 'unknown', test: { base: 46, mods: [R('scientist', 14), R('pilot', 10), R('physician', 6)] }, info: [['yield', 'The truth, if there is a question it does not know'], ['danger', 'Both of them, if there is not']],
      ok: { text: (s, c) => `It takes most of the night. In the end it is a small thing, a dog's name from a childhood, and one of them has to think about it for a second too long. ${c.real === 'ground' ? 'It is the one from the ship.' : 'It is the one who came down.'} The other ${c.first} takes the seat back. The one who hesitated is walked to the lock, and goes without a word.`,
        fx: (s, c) => ({ morale: 2, do: s2 => { const t = T(s2); t.kept = t.truth.real; LF.endThread(s2, ID, 'one'); } }) },
      bad: { text: (s, c) => `Every question, both answer, perfectly, at once. By dawn the room has stopped asking. The two of them are still sitting there, not looking at each other.`, fx: (s, c) => ({ morale: -3, do: s2 => LF.cue(s2, 'qs.two', 8, 16) }) } },
    { label: (s, c) => `Keep the one who came down. The other goes out of the lock`, dark: true, note: 'The one the colony has been taking orders from. The other is put out of the ship\'s lock on the next flight.', hint: 'unknown', info: [['yield', 'An end to it'], ['danger', 'Whichever one is the real one']],
      out: { text: (s, c) => `The second ${c.first} is flown back up and put out of the lock with a blanket over the face. The ${c.first} who stays says nothing about it, ever, and goes back to work the same afternoon.`, fx: (s, c) => ({ stain: ['double_spaced', 2], do: s2 => { const t = T(s2), p = byPid(s2, c.pid); t.kept = 'ground'; if (p && t.truth.real !== 'ground') { p.qsFalse = s2.day; LF.cue(s2, 'qs.tell', 120, 220); } LF.endThread(s2, ID, 'one'); } }) } },
    { label: (s, c) => `Keep the one from the ship. The one who came down goes out of the lock`, dark: true, note: 'The one who never left is the one who stayed at the post. Whatever came down in the lander was not.', hint: 'unknown', info: [['yield', 'An end to it'], ['danger', 'Whichever one is the real one']],
      out: { text: (s, c) => `The ${c.first} who came down goes up the ramp without being made to, and is put out of the lock. The one from the ship sits in the empty chair that evening and asks to see the duty roster.`, fx: (s, c) => ({ stain: ['double_spaced', 2], do: s2 => { const t = T(s2), p = byPid(s2, c.pid); t.kept = 'ship'; if (p) { p.native = Math.max(0, (p.native || 0) - 20); if (t.truth.real !== 'ship') { p.qsFalse = s2.day; LF.cue(s2, 'qs.tell', 120, 220); } } LF.endThread(s2, ID, 'one'); } }) } },
    { label: 'Shoot both. The seat stays empty', dark: true, note: (s, c) => `Nobody has to guess. Nobody gets ${c.first} back either.`, hint: 'unknown', info: [['yield', 'Certainty'], ['danger', 'The real one, and the seat']],
      out: { text: (s, c) => `It is done behind the lander shed, both at once, by two of the watch who were not told which was which. The seat at the table stays empty. Nobody sits in it.`, fx: (s, c) => ({ stain: ['double_shot', 3], kill: c.pid ? [{ who: c.pid, cause: 'shot, with the other one, because nobody could tell them apart' }] : [], do: s2 => LF.endThread(s2, ID, 'both') }) } },
    { label: 'Keep them both. Two of them can do two jobs', note: 'Nobody has to be wrong. Everybody has to live with it.', hint: 'unknown', info: [['yield', 'An extra pair of hands that knows the work'], ['danger', 'Everyone who has to look at them']],
      out: { text: (s, c) => `Both stay. One takes the day watch and one takes the night, and they never share a room. People learn to say "the day one" and "the night one". Children are frightened of the night one, and nobody knows why.`, fx: (s, c) => ({ pop: 1, morale: -3, do: s2 => { const t = T(s2), p = byPid(s2, c.pid); if (p && t.truth.real !== 'ground') p.qsFalse = s2.day; LF.emit(s2, 'unexplained', SRC, 40, 600, `there are two of ${c.name}`); LF.endThread(s2, ID, 'two'); if (p && p.qsFalse) LF.cue(s2, 'qs.tell', 150, 260); } }) } },
  ] });

/* ======================= later: the one the colony kept is not the one ======================= */
const fake = s => s.people.find(p => p.alive && p.qsFalse && p.seat);
LF.add({ id: 'qs.tell', arc: 'th.' + ID, view: 'people', tone: 'pressure', title: 'Small Things', w: 0.8, repeat: 9999,
  when: s => !!fake(s) && s.day - fake(s).qsFalse >= 100,
  setup: s => { const p = fake(s), w = anyNamed(s, [p.seat]); return { pid: p.id, name: p.name, first: p.first, title: LF.title(p), w: w ? w.first : 'Someone', wid: w ? w.id : null }; },
  text: (s, c) => `${c.w} comes to you about ${c.first}. Small things. ${c.first} doesn't sleep; the bunk is never warm. ${c.first} eats when someone is watching. Last week, asked about the crossing, ${c.first} described the view from a window on the side of the ship where there are no windows.\n\n"It's doing the job better than the real one ever did," ${c.w} says. "That's what scares me."`,
  choices: [
    { label: (s, c) => `Leave ${c.first} at the post. The work is good`, note: 'Whatever it is, it is on the colony\'s side, so far.', hint: 'unknown', info: [['yield', 'An officer who never tires'], ['danger', 'Whatever it wants']],
      out: { text: (s, c) => `${c.first} stays. The department has never run better. ${c.w} asks to be moved to a different crew, and is.`, fx: (s, c) => ({ morale: -1, do: s2 => { const p = byPid(s2, c.pid); if (p) { p.qsFalse = -1; p.native = Math.min(100, (p.native || 0) + 20); } } }) } },
    { label: (s, c) => `Take ${c.first} out past the wire at night, and come back without`, dark: true, note: 'It will go quietly. It went quietly the last time.', hint: 'unknown', info: [['yield', 'An end to it'], ['danger', 'The seat, and the chance it was real after all']],
      out: { text: (s, c) => `${c.first} walks out with the watch and doesn't ask where they are going. They come back at dawn without, and they will not say what they saw it do at the end.`, fx: (s, c) => ({ stain: ['double_spaced', 1], kill: [{ who: c.pid, cause: 'taken out past the wire, for not being who it said' }] }) } },
    { label: (s, c) => `Ask ${c.first} straight out, in front of the council`, note: 'Whatever it says, everyone hears.', hint: 'unknown', info: [['yield', 'An answer, of a kind'], ['danger', 'What the colony does with it']],
      out: { text: (s, c) => `${c.first} hears the question, and smiles, the first time anyone can remember. "I'm what you kept." Then goes back to work. Nobody on the council knows what to do, so nobody does anything, and that becomes the answer.`, fx: (s, c) => ({ morale: -4, do: s2 => { const p = byPid(s2, c.pid); if (p) p.qsFalse = -1; LF.emit(s2, 'changed', SRC, 40, 400, `${c.name} told the council it was what the colony kept`); } }) } },
  ] });

LF.TAGS['qs.silent'] = ['bold', 'cautious', 'closed severe'];
LF.TAGS['qs.board'] = ['cautious closed', 'order', 'open mercy', 'closed severe', 'cautious', 'bold', 'severe', 'bold', 'open', 'closed severe'];
LF.TAGS['qs.two'] = ['cautious', 'severe', 'severe', 'severe order', 'open mercy'];
LF.TAGS['qs.tell'] = ['open', 'severe', 'open'];
Object.assign(LF.DEEDS || {}, {
  ship_cut: 'the ship cut loose with people still aboard her',
  vented: 'the sleepers who froze when the ship was opened to vacuum',
  double_left: 'the second officer left locked in the ship\'s infirmary',
  double_spaced: 'the one put out of the lock for being the wrong one',
  double_shot: 'the two shot because nobody could tell them apart',
  qs_fault: 'the lamp on the ship that was called a fault in her lights',
  qs_hid: 'the second light that was kept from the colony',
  qs_left: 'the one left alone in a corridor of the ship',
  qs_seats: 'the ones who woke aboard, left for a machine in the seats',
  qs_glass: 'the sick left behind the infirmary glass',
  qs_tunnel: 'the boarding tunnel opened to vacuum with thirty people in it',
});
/* The ship's own cards wait while she is dark (the launch order checks s.flags.qs_dark itself: js/orders.js). */
for (const id of ['ship.orbit', 'ship.cabin', 'ship.pods', 'plan.sleepers', 'sleep.cryo']) { const st = LF.byId[id]; if (!st) continue; const w0 = st.when; st.when = s => !s.flags.qs_dark && (!w0 || w0(s)); }
})();

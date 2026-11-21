/* Landfall — the Quiet Ship, the rest of the dread (Lachlan, 2026-11-21: "can you fix/build these?"; the plan is
   docs/quiet-ship-dread.md). Loaded straight after js/thread-quiet.js, whose helpers it takes from LF.QS.
     the warnings  phase `hush`, before the silence. With an officer still aboard (t.open 'aboard') the officer reports
                   small wrong things over the radio: qs.count (with the pod log puzzle), qs.cups or qs.blame (two
                   aboard), qs.late. With nobody aboard ('empty') an empty ship starts answering: qs.answer, then
                   qs.kettle or qs.collar. Then the silence (LF.qsSilent).
     the silence   two more cards while she is dark: qs.ridge (the colony under her at dusk) and qs.kin (the families).
     the waker     a seventh truth: a sleeper whose pod failed open on the voyage has lived alone aboard for years.
                   t.trust counts the patient answers in the warnings and the silence; qs.nest is what the party finds.
     after         qs.tune, qs.keeper, qs.salvage, and qs.fall (the ship comes down, years after she was cut loose).
     the puzzles   five more board cards beside the walk (LF.PUZZLES, LF.pzMove; drawn by pzHTML in js/ui.js):
                   manifest (qs.count), lights (qs.lights), restart (qs.air), which (qs.two), doors (qs.board, grown).
                   Each keeps its card's ordinary options until the first move, and a finished board answers through
                   one option appended to the card. Each defines bot(s, pz) for the sim.
   Loaded after js/content-builds.js, so the options that file adds to the old cards keep their places (option ids go by
   position) and the boards' answers come after them.
   Officer lines: the radio lines of whoever is aboard (LINES, by cast key), one writer per officer against VOICES.md.
   Dice from LF.srand and each board's own LCG (pz.r); no DOM. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nwc, R, If, byPid, anyNamed } = h;
const Q = LF.QS, { ID, SRC, T, B, ship, and, num, cap1, dark, canUp, ups, lost, mo, share, home, down, reveal, pullOut } = Q;
const YEAR = LF.YEAR, MONTH = LF.MONTH;
const up = s => LF.inOrbit(s).filter(p => p.alive && !p.stranded);
const sub = (l, o) => o ? l.split('${o}').join(o) : l;
/* The radio lines of the officers aboard, by cast key (2026-11-21: one writer per officer, each seeing only that
   officer's section of VOICES.md and voices/<key>.md). ${o} is the other officer aboard. */
const LINES = {
  solheim: {
    count: 'The monitor on bank C shows one more heartbeat than there are labelled pods in it, and I\'ve counted both twice. I want a yes or no on a flight up before the next pass.',
    cups: 'There was a second cup washed and racked in the galley this morning, and I didn\'t use it. There\'s an entry in my watch log in my hand and my wording, and I don\'t remember writing a word of it, so log both as a reading.',
    late: 'I was on station at the top of the pass, same as every pass, so if your clock says otherwise, set it by mine. Give me the ground\'s numbers now, because the window\'s closing.',
    blame: 'Keep this off the log. ${o} hasn\'t eaten at my table in a month, and the stores still come up a ration short every night, so I want a flight up and your yes or no by the next pass.',
    nest: 'That\'s one more aboard than I reported, and I kept it off the radio so nobody came up armed. They\'ve been alone up here since their pod failed on the crossing and they kept her flying, so you bring them down easy, and the lie\'s mine to answer for.',
    last: 'She\'s burning in over the colony and there\'s no abort from this heading, so every sleeper left in B, C and D comes down with her. They\'re in my book, and I\'ll carry them in. Put the crews back on the wall at first light.',
  },
  achebe: {
    count: 'I\'ve counted bank C twice, once on the monitor and once walking the pods with my hand on every lid, and there\'s one more heartbeat than there are names on that bank. I wanted you to hear it from me before I count it again.',
    cups: 'There was a second cup in the galley rack this morning, washed and put away, and I didn\'t use it. There\'s an entry in my watch log from last night as well, my words and the way I put things, and I don\'t remember writing a line of it.',
    late: 'No, I was on at the top of the pass, same as always, and I\'d swear to it, so I was the one waiting on you. Never mind it, we\'ve not got long, so tell me how our people are doing down there.',
    blame: 'This stays between you and me, because I don\'t say it lightly about someone I trust. ${o} isn\'t right, and three nights running I\'ve found ${o} standing at the bank C hatch in the dark, not answering to the name.',
    nest: 'Go gently with them, please, because they\'ve been alone up here since the pod failed and they\'re frightened of you. I lied to you on the radio and that\'s on me, not on them, so you come to me about it.',
    last: 'I can see the lights of the rows from here, and I\'d like you to tell our people I\'m not angry with anybody. She\'s coming apart round me and I\'ll hold her steady as long as she lets me. Say the names at muster, and mine with them.',
  },
  dahl: {
    count: 'I\'ve counted bank C twice now, and the monitor shows one more heartbeat than there are names on the pods. So who signed that bank shut at the dock? I\'d like a word with them, because hearts don\'t add themselves to a manifest.',
    cups: 'There\'s a second cup in the galley, washed and put back on its hook, and I only ever use the one. And there\'s an entry in my watch log, in my hand and my shorthand, which I\'d love to be told I wrote.',
    late: 'I was on the minute, same as every pass, so if your clock says otherwise I\'d have a look at who\'s been near your radio room. Go on, then, what\'ve you got for me?',
    blame: 'Keep this off the open channel, but ${o} isn\'t right. Goes the long way round past the hold every watch, and when I ask why I get the same answer word for word, which is the answer you give when you\'ve practised it.',
    nest: 'I lied to you on the radio and I\'ll answer for it, but go gently with this one. All those years alone up here and never nicked more than they needed, which is more than I\'d say for anyone below, so lower the rifles.',
    last: 'She\'s coming apart over you now, and I can see the rows from up here. I checked the pods on B, C and D one last time, and they\'re all still sleeping. Did you ever mean to come back for us?',
  },
  zulu: {
    count: 'First, nobody\'s hurt aboard and every pod on bank C reads green. Second, the heartbeat board shows one more live trace on that bank than there are labelled pods, and I\'ve counted it twice, once at first watch and again at change of watch.',
    cups: 'There was a second cup in the galley at first light, washed and put away, and I only ever use the one. There\'s also an entry in my watch book, in my hand and my way of putting things, and I don\'t remember writing it.',
    late: 'I\'m here at the time we agreed, as I am every pass, and I\'ve marked it in the book. Nothing to report from banks B, C or D, which I\'m glad of.',
    blame: 'I\'d ask that this stays between us. I won\'t accuse ${o} on a feeling, but at second watch ${o} stood an hour at bank D with a hand flat on the glass, and when I said the name there was no answer at all.',
    nest: 'I\'m sorry I lied to you on the radio, and that was mine, and I\'ll put myself on the report. This one\'s lived alone up here since the pod failed open on the way out, and I\'d ask you to tell the party to go gently.',
    last: 'The banks are still green and the sleepers don\'t know, and I\'m at the port where I can see your lamps. I\'d ask that whoever\'s on the wire tonight looks up, so the watch can see me home.',
  },
  kovacs: {
    count: 'I\'ve counted bank C twice now, pod by pod with the lamp, and the monitor\'s showing one more heartbeat than there are labels on her. It isn\'t the sensor, I\'ve had the covers off, and I can\'t give you a reason for it.',
    cups: 'There was a second cup in the galley rack this morning, washed and put away, and I only ever use the one. There\'s an entry in my watch log too, in my hand and worded the way I\'d word it, and I\'ve no memory of writing it.',
    late: 'I\'m on the pass same as always, so you\'ll want to look at the clock down there, because the damp gets into those and they run fast. She\'s ticking over fine up here and the banks are quiet.',
    blame: 'This stays between us, but ${o}\'s not right. Three nights now ${o}\'s been down at bank D at three in the morning, stood at the glass, and when I asked what for I got a smile and nothing else.',
    nest: 'I\'m asking you to go easy with them, because they\'ve been alone up here since the pod failed open and they\'ve kept half the old girl ticking over with what was lying about. I lied to you on the pass, and that\'s mine to answer for, not theirs.',
    last: 'She\'s coming apart round me now, and she held a sight longer than anyone rated her for, so don\'t let them say she was a poor ship. Look up when she goes over the place, and then get back to the pumps, because they won\'t keep themselves.',
  },
  halloran: {
    count: 'Bank C\'s monitor is showing one more heartbeat than there are labels on the goddamn pods, boss! I\'ve counted it twice, and I\'ve had every lead off and seated it back true, and it\'s still one more.',
    cups: 'There\'s a second cup in the galley rack, boss, washed and put away, and I only ever use the one. There\'s an entry in my watch log I don\'t remember writing, and it\'s written up exactly the way I\'d write it.',
    late: 'I\'m on time, boss! I\'ve been sat at this bloody set with my tea since the pass came up, so if your clock says different, it\'s your clock wants looking at, not me.',
    blame: 'Keep this off the open channel, boss. ${o}\'s not right. Somebody rewelded the seal on the bank D hatch overnight, a perfect bead, better than mine, and ${o} told me they\'d never held a torch.',
    nest: 'Go easy, boss, and tell them to lower the bloody rifles, because they\'re frightening the poor sod. Their pod failed open on the way out and they\'ve been alone up here ever since, so yes, I lied to you, and I\'d do it again.',
    last: 'I can see your lights from here, boss. Every seal on this ship\'s holding, and I\'d sign for each one of them, and none of it\'s going to matter in about a minute. Tell whoever gets my bench to cut true.',
  },
  nakamura: {
    count: 'I\'ve counted bank C twice now, and the monitor gives me one more heartbeat than there are names on the pods, and I put every one of those people to sleep myself. I\'m not leaving that bank until I know whose heart it is.',
    cups: 'There was a second cup in the galley this morning, washed and turned down the way I leave mine, and I only ever use one. There\'s a line in my watch log in my own hand that I don\'t remember writing, and I won\'t pretend that doesn\'t frighten me.',
    late: 'I\'m on the hour, same as every pass, so you can stop counting minutes at me. I\'ve just come up from bank D and every one of them is sleeping well, so tell me how my ward\'s doing down there.',
    blame: 'Keep this off the open channel. ${o} hasn\'t touched a proper meal in a month and goes down to bank C at night to stand at the glass without checking a single reading, and I\'ve sat with enough frightened people to know that isn\'t fear.',
    nest: 'Go gently, please, because they\'ve been alone in this hold since before any of us woke, and they\'re frightened of the lights and the boots. I lied to you to keep them safe, and you can have that out with me after, but not in front of them.',
    last: 'I can see the rows from here, and the hall lights, and I\'m glad you got that far. I kept the sleepers as well as I could, every one of them by name, and I\'d like you to read those names out down there, because I won\'t be able to.',
  },
  brandt: {
    count: 'Bank C shows one more heartbeat on the monitor than there are labelled pods, and I\'ve counted both twice, the second time with my finger on the glass. You\'ll ask whether the monitor\'s wrong, which is the right question, and I haven\'t the answer yet.',
    cups: 'There\'s a second cup in the galley, washed and shelved the way I\'d do it, and I only use the one. The log has a night entry in my hand that I don\'t remember writing, and in a patient I\'d call that a presentation.',
    late: 'I came on at the top of the pass, as I always do, so if your clock says otherwise I\'d have a look at your clock. The ship keeps better time than anything you\'ve built down there.',
    blame: '${o} isn\'t right, and before you ask what I mean by right, ${o} has eaten with the other hand at every meal since the last pass and hasn\'t once noticed me watching. I\'d keep this off the open channel.',
    nest: 'I lied to you on every pass about this, and I\'d do it again, so we\'ll argue about it later. This one has lived alone in the hold since the pod failed open, and strangers with lamps are a larger dose than anyone\'s built for, so tell them to go slowly.',
    last: 'You\'re not asking whether anything can be done. You\'re asking whether I blame you, and I haven\'t the time to answer that properly. Put it in the book that the sleepers were looked after to the end, and watch the sky, since somebody ought to sign for me.',
  },
  yurbin: {
    count: 'Bank C shows one more heartbeat than there are labelled pods, and I\'ve counted twice with my finger on the screen, so it isn\'t my counting, and the extra one is perfectly steady, which is the part I can\'t stop looking at.',
    cups: 'There\'s a second cup in the galley rack, washed and put back handle out, the way I do it, and I didn\'t use it, and there\'s an entry in my watch log in my own shorthand that I don\'t remember writing, and it\'s neater than mine usually are.',
    late: 'I\'m right on time, I\'ve had the clock in front of me the whole pass, so it must be your end drifting, which is interesting in itself, actually, and I\'d like your log of when you started calling, if you kept one.',
    blame: '${o} isn\'t right, and I\'m telling you on the quiet, so keep it there, please, ${o} hasn\'t opened a ration pack since the last pass, I\'ve counted them twice, and when I touched ${o}\'s hand at the bench it was warmer than mine.',
    nest: 'Go gently with them, please, they\'ve been alone in this ship since their pod opened on the way out, and they\'ve scratched every year of it on the hold wall, so put the lamps down, and yes, I lied to you, and I\'ll answer for it.',
    last: 'The forward hull\'s glowing and the instruments are going one at a time, and I\'ve kept the record all the way down, so you\'ll see us from the ground as a long bright line, I think, and I\'d have liked to be down there with you, measuring it.',
  },
  iyer: {
    count: 'The monitor on bank C shows one more live trace than there are labelled pods, and I\'ve counted it twice, so I\'d sooner doubt the instrument than my arithmetic. I can\'t yet say what it is, Administrator, and I shan\'t open the bank until I can.',
    cups: 'I found a second cup in the galley, washed and put away, which I didn\'t use, and an entry in my watch log in my own style that I don\'t recall writing. I\'ve entered both on the same page, which is where I keep the things I can\'t yet account for.',
    late: 'I came on at the top of the pass, Administrator, as I have on every pass, and I\'d check the ground\'s clock against the ship\'s before you record it otherwise. I\'ll take the stores figures first, if you have them.',
    blame: 'I\'d rather this stayed off the open channel. The officer you know as ${o} has drawn nothing from the ship\'s stores this month and is no thinner for it, and I\'d keep the lander closed to them until I\'ve established how.',
    nest: 'The person beside me has lived alone in this hold since their pod failed on the crossing, Administrator, and I kept it off the radio because I judged them worth more unfrightened than taken. I\'d be obliged if your party went gently, since nobody else alive knows this ship as they do.',
    last: 'The hull won\'t hold past this pass, so I\'m keeping the instruments transmitting for as long as they last, since it\'s the last use left in them or in me. The sleepers and the decision to leave us here are both in the book, Administrator.',
  },
  estrada: {
    count: 'I\'ve been down bank C twice now, pod by pod with my hand on the glass, and the monitor shows one more heart than there are names on the labels. I\'ll not say what that means till I\'ve been round it a third time.',
    cups: 'There was a second cup washed and put away in the galley, and I only ever use the one. There\'s a line in my log as well, written the way I\'d write it, and I don\'t remember putting it there.',
    late: 'I was on the set when the pass came over, same as every time, so I don\'t know where you\'ve lost ten minutes. Everybody up here\'s as they were, and the pods are holding.',
    blame: '${o} hasn\'t eaten a bite since the last pass, and the bowl I leave out comes back to the galley full. I\'d not say this with ${o} in earshot, but something\'s not right up here, and I don\'t know yet what it is.',
    nest: 'I lied to you on the radio, and I\'ll own that, because I gave my word I\'d not tell. They\'ve been alone in this hold since their pod failed on the way out, so go gently, and let them come out at their own pace.',
    last: 'The ship\'s coming apart round me, and I can see the lights of home through the glass. I\'ve said the words over the sleepers, every one by name, and I\'d ask you to keep the bowls fair when I\'m not there to see to it.',
  },
  waititi: {
    count: 'Bank C\'s showing one more heartbeat on the monitor than there are labels on the pods, and I\'ve counted it twice, the way my mother counted goats, walking the row with my finger on every glass. I\'d give a lot for a joke to put on it.',
    cups: 'Somebody washed a second cup and put it away, and it wasn\'t me, because I never put anything away, ask Dalia! There\'s a page in my watch log in my own hand, rambling the way I ramble, and I don\'t remember writing a word of it.',
    late: 'Late? I\'ve been sat here with the kettle on since before you came over the edge, my friend, right on the pass, so somebody\'s clock is wrong down there. Now, tell me how everybody\'s eating.',
    blame: 'Keep this off the open band, because I\'m not joking: ${o} isn\'t right. I put a bowl of stew in front of ${o} last night, the good one, and ${o} sat and watched me eat mine and never lifted the spoon.',
    nest: 'Go gently, please, they\'ve been up here alone since long before any of us woke, and they\'re more frightened of your lot than you are of them. I lied on the radio to keep them, and they\'ve been eating out of my bowl.',
    last: 'I\'m not doing a joke about this one. You\'ll see us come over the valley tonight, and Dalia\'s here with me, asleep, and she\'s never minded waiting. Feed everybody tonight, and leave two bowls at the end of the table.',
  },
};
/* A line of the officer aboard, as its own paragraph with their tag; plain narration if there is none for them. */
const said = (s, pid, k, plain, o) => { const p = byPid(s, pid), l = p && p.key && LINES[p.key] && LINES[p.key][k]; return l ? `[[${p.id}]] "${sub(l, o)}"` : plain; };
const mind = (s, pid, d) => { const p = byPid(s, pid); if (p && p.alive && p.mind !== undefined) p.mind = clamp(p.mind + d, 0, 100); };
const body = (s, pid, d) => { const p = byPid(s, pid); if (p && p.alive && p.body !== undefined) p.body = clamp(p.body + d, 0, 100); };
const trust = (s, d) => { const t = T(s); if (t) t.trust = (t.trust || 0) + d; };
const hev = (s, d) => { const t = T(s); if (t) t.hev = (t.hev || 0) + d; };
const is = (s, ...k) => { const t = T(s); return !!t && k.includes(t.truth.is); };
const key = t => t.truth.is === 'signal' ? t.truth.msg : t.truth.is;

/* ======================= the warnings (phase hush) ======================= */
const A_CARDS = ['qs.count', 'qs.cups', 'qs.late'], A_TWO = ['qs.count', 'qs.blame', 'qs.late'], B_CARDS = ['qs.answer', 'qs.kettle', 'qs.collar'];
const NEED = { aboard: 3, empty: 2 }, HUSH_MAX = 150;
LF.qsHush = function (s, t) {
  t.open = t.open || (up(s).length ? 'aboard' : 'empty');
  Object.assign(t, { hush0: s.day, hushN: 0, trust: t.trust || 0, hev: t.hev || 0, hushSeen: [] });
  if (t.open === 'empty') t.hushB = LF.srand(s) < 0.5 ? 'qs.kettle' : 'qs.collar';
  LF.phase(s, ID, 'hush', `Small things started to go wrong aboard the ${ship(s)}.`);
  s.signs.push({ id: 'machine_fault', d: s.day, src: SRC });
  LF.cue(s, hushNext(s, t), 3, 12);
};
LF.qsHushDone = (s, t) => t.hushN >= (NEED[t.open] || 2) || s.day - t.hush0 > HUSH_MAX;
/* The next warning: the officer's while anyone is still aboard, the empty ship's once nobody is. */
function hushNext(s, t) {
  const a = up(s), list = a.length >= 2 ? A_TWO : a.length ? A_CARDS : ['qs.answer', t.hushB || 'qs.kettle'];
  return list.find(id => !t.hushSeen.includes(id)) || list[list.length - 1];
}
const told = (s, id) => { const t = T(s); if (!t || t.phase !== 'hush') return; t.hushSeen.push(id); t.hushN++; if (!LF.qsHushDone(s, t)) LF.cue(s, hushNext(s, t), 15, 30); };
const H = (id, st) => B('hush', Object.assign({ id, view: 'ship', chain: true, w: 7, tone: 'pressure', aboard: true }, st));
const onePass = s => up(s)[0];
const flyDown = (s, c) => ({ fly: 1, machine: { lander: -6 }, sleepers: -Math.min(3, s.sleepers) });
const DOWN_NOTE = 'A flight of fuel, and a seat on it. From that day nobody is aboard to mind the banks.';

/* --- with an officer aboard --- */
H('qs.count', { title: 'One Too Many', puzzle: 'manifest', when: s => up(s).length > 0,
  setup: s => { const p = onePass(s), t = T(s); const c = { pid: p.id, first: p.first, name: p.name, k: key(t) }; c.pz = LF.newManifest(s, c); return c; },
  text: (s, c) => `${c.name} is on the radio at the dusk pass, from the bank C monitors.\n\n${said(s, c.pid, 'count', `[[note:The radio log]] "${c.first}: bank C monitor shows one more live trace than there are labelled pods. Counted twice."`)}\n\nThe pod log for the night comes down with the next pass: eight lines, and the ship's own rules for them at the top. One of the lines may not be true.`,
  choices: [
    { label: 'Have bank C thawed and counted by hand', note: 'The ones in bank C are woken early to be counted, and early waking goes badly for some.', hint: 'unknown', info: [['yield', 'A count by hand'], ['danger', 'The sleepers in bank C']],
      out: { text: (s, c) => `${c.first} thaws bank C one pod at a time over three passes and counts them by hand. Every pod holds who the manifest says it should. Two of them wake with their speech gone and do not get it back.${c.k === 'waker' ? ' The extra trace is gone from the monitor the night the first lid lifts, and something goes along the ducts overhead while ' + c.first + ' is kneeling at pod 31.' : ''}`,
        fx: (s, c) => ({ sleepers: -Math.min(2, s.sleepers), morale: -1, do: s2 => { hev(s2, 1); if (c.k === 'waker') trust(s2, -1); told(s2, 'qs.count'); } }) } },
    { label: 'Seal bank C, and keep it sealed', note: 'Whatever is in there stays in there, and so do the sleepers in it, with nobody checking them.', hint: 'unknown', info: [['yield', 'Nobody goes near it'], ['danger', 'Bank C, unwatched']],
      out: { text: (s, c) => `Bank C is sealed from the bridge. ${c.k === 'waker' ? `The extra trace stays on the monitor for two more nights, then drops off it. ${c.first} says the galley has been emptier since.` : 'The extra trace stays on the monitor, steady, behind the door.'}`,
        fx: (s, c) => ({ sleepers: -Math.min(1, s.sleepers), do: s2 => { if (c.k === 'waker') trust(s2, -2); told(s2, 'qs.count'); } }) } },
    { label: (s, c) => `Bring ${c.first} down on the next flight`, req: s => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: DOWN_NOTE, hint: 'unknown', info: [['yield', 'Nobody alone up there'], ['danger', 'The banks, unminded']],
      out: { text: (s, c) => `The lander goes up for ${c.first} and comes back with ${c.first} in the right-hand seat, looking at the ground the whole way down. The banks are left on automatic.`, fx: (s, c) => Object.assign(flyDown(s, c), { do: s2 => told(s2, 'qs.count') }) } },
    { label: (s, c) => `Tell ${c.first} to keep counting, and say nothing below`, note: 'Nobody is woken or sent for. One person is up there alone with a number that is one too many.', hint: 'unknown', info: (s, c) => [['yield', 'Nothing disturbed'], ['danger', c.first]],
      out: { text: (s, c) => `${c.first} counts bank C every pass after that and reports the same number every pass, and then stops reporting it.`, fx: (s, c) => ({ do: s2 => { mind(s2, c.pid, -5); if (c.k === 'waker') trust(s2, 1); told(s2, 'qs.count'); } }) } },
  ] });

H('qs.cups', { title: 'Two Cups', when: s => up(s).length === 1,
  setup: s => { const p = onePass(s), t = T(s); return { pid: p.id, first: p.first, name: p.name, k: key(t) }; },
  text: (s, c) => `${c.name} comes on the radio at the dusk pass and does not start with the banks.\n\n${said(s, c.pid, 'cups', `[[note:The radio log]] "${c.first}: second cup washed and put away in the galley, not mine. A watch log entry I don't remember writing."`)}`,
  choices: [
    { label: (s, c) => `Order ${c.first} to sleep in the lander collar with the hatch shut`, note: 'A locked hatch between one officer and the rest of the ship, every night, in a space the size of a cupboard.', hint: 'unknown', info: (s, c) => [['yield', 'A locked door at night'], ['danger', `${c.first}'s nerve`]],
      out: { text: (s, c) => `${c.first} sleeps in the collar with the hatch dogged shut. The cups stop. ${c.k === 'waker' ? 'So does anything in the galley being touched at all, and the ration count stops going down.' : 'Nothing else changes.'}`, fx: (s, c) => ({ do: s2 => { mind(s2, c.pid, -4); if (c.k === 'waker') trust(s2, -1); told(s2, 'qs.cups'); } }) } },
    { label: (s, c) => `Have ${c.first} search the ship, compartment by compartment`, note: 'Alone, with a lamp, on a ship built for two hundred.', hint: 'unknown', risky: true, test: { base: 35, mods: [R('security', 10), R('engineer', 5)], aboard: true }, info: (s, c) => [['yield', 'Whatever is there to find'], ['danger', c.first]],
      ok: { text: (s, c) => `It takes ${c.first} two passes. ${FOUND[c.k] || FOUND.gone}`, fx: (s, c) => ({ do: s2 => { hev(s2, 2); told(s2, 'qs.cups'); } }) },
      bad: { text: (s, c) => `${c.first} comes on the next pass late, out of breath, with a cut over one eye from a fall in the dark of the spine, and will not say what started the running.`, fx: (s, c) => ({ do: s2 => { body(s2, c.pid, -15); mind(s2, c.pid, -5); if (c.k === 'waker') trust(s2, -1); told(s2, 'qs.cups'); } }) } },
    { label: 'Leave a second ration on the galley counter, and see if it goes', note: (s, c) => `A ration out of ${c.first}'s own stores, put out for nobody.`, hint: 'unknown', info: (s, c) => [['yield', 'An answer of a kind'], ['danger', `${c.first}'s rations`]],
      out: { text: (s, c) => c.k === 'waker' ? `It goes. In the morning the wrapper is on the counter where the ration was, folded flat, very neatly, twice.` : `It is still on the counter in the morning, and the morning after.`, fx: (s, c) => ({ do: s2 => { body(s2, c.pid, -3); if (c.k === 'waker') trust(s2, 2); told(s2, 'qs.cups'); } }) } },
  ] });
const FOUND = {
  waker: 'There is a nest of cargo blankets under the crew deck table, still warm on one side, and a ration wrapper folded flat in it.',
  changed: 'Every bunk on the crew deck has been dragged round to face the floor, the planet side, and the scrape marks are fresh.',
  grown: 'The hold door is warm under the hand, and the air at the seal tastes of salt.',
  double: 'There is a second pair of ship boots in the infirmary, worn down the same way at the same heel.',
  help: 'A fault on the crew deck scrubbers has been cleared from the board forty times since landfall, every time by hand.',
  away: 'Six pods in bank C have been wiped down with disinfectant, lids and all, from the inside out.',
  other: 'There are fresh scratches round the cargo lock, as if something hard had been held against it from outside.',
  gone: 'The airlock counter reads a number that is higher than it was at landfall, and nobody has been out.',
};

H('qs.late', { title: 'Ten Minutes', when: s => up(s).length > 0,
  setup: s => { const p = onePass(s), t = T(s); return { pid: p.id, first: p.first, name: p.name, k: key(t) }; },
  text: (s, c) => `The pass comes over, and the ship's channel stays empty for ten minutes of it. Then ${c.name} comes on, easy and cheerful.\n\n${said(s, c.pid, 'late', `[[note:The radio log]] "${c.first}: on time for the pass. No delay."`)}\n\nThe radio room's clock is right. They have checked it against the lander's.`,
  choices: [
    { label: (s, c) => `Bring ${c.first} down on the next flight`, req: s => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: DOWN_NOTE, hint: 'unknown', info: (s, c) => [['yield', `${c.first} on the ground`], ['danger', 'The banks, and whatever comes down with them']],
      out: { text: (s, c) => `${c.first} comes down cheerful and is cheerful at the pad, and at supper.${c.k === 'changed' ? ' By the end of the month the people at that table are humming something under their breath, the same few notes.' : ''}`,
        fx: (s, c) => Object.assign(flyDown(s, c), { do: s2 => { if (c.k === 'changed') { s2.flags.qs_changed_down = s2.day; LF.emit(s2, 'unexplained', SRC, 35, 220, 'people are humming the same few notes since the officer came down from the ship'); } told(s2, 'qs.late'); } }) } },
    { label: (s, c) => `Lock ${c.first} out of the ship's systems from the ground, and keep only the radio`, dark: true, note: 'No doors, no lights, no galley without asking the ground first. Whatever is aboard cannot use her either.', hint: 'unknown', info: (s, c) => [['yield', 'The ship in the colony\'s hands'], ['danger', c.first]],
      out: { text: (s, c) => `${c.first}'s access is cut from the radio room. For a week every door aboard is opened by asking. Then ${c.first} stops asking, and lives in whatever compartment the last door left open.`,
        fx: (s, c) => ({ stain: ['qs_lockout', 1], do: s2 => { mind(s2, c.pid, -10); hev(s2, 2); if (c.k === 'waker') trust(s2, -1); told(s2, 'qs.late'); } }) } },
    { label: (s, c) => `Log it, and say nothing to ${c.first}`, note: 'Ten minutes on one pass. Nobody makes anything of it out loud, including the one it happened to.', hint: 'unknown', info: [['yield', 'Nobody upset'], ['danger', 'Whatever the ten minutes were']],
      out: { text: (s, c) => `It goes in the radio log as ten minutes, and nothing else. The next pass ${c.first} is on time, and the one after.`, fx: (s, c) => ({ do: s2 => { mind(s2, c.pid, -3); if (c.k === 'waker') trust(s2, 1); told(s2, 'qs.late'); } }) } },
  ] });

H('qs.blame', { title: 'The Other One', when: s => up(s).length >= 2,
  setup: s => { const [a, b] = up(s), t = T(s); return { a: a.id, b: b.id, af: a.first, bf: b.first, an: a.name, bn: b.name, k: key(t) }; },
  text: (s, c) => `Two calls on two passes from the two aboard, and each asks for it to be kept off the log. ${c.an} first.\n\n${said(s, c.a, 'blame', `[[note:The radio log]] "${c.af}: ${c.bf} isn't right."`, c.bf)}\n\nThen ${c.bn}.\n\n${said(s, c.b, 'blame', `[[note:The radio log]] "${c.bf}: ${c.af} isn't right."`, c.af)}`,
  choices: [
    { label: (s, c) => `Believe ${c.af}: ${c.bf} is shut in the infirmary`, dark: true, note: (s, c) => `${c.bf} is locked in by the one who accused them, on that one's word.`, hint: 'unknown', info: (s, c) => [['yield', 'One of them watched'], ['danger', c.bf]],
      out: { text: (s, c) => `${c.bf} goes into the infirmary without a fight and the door is locked from the bridge. ${c.af} reports every pass after that, very calmly.`, fx: (s, c) => ({ stain: ['qs_confined', 1], do: s2 => { mind(s2, c.b, -12); hev(s2, 2); told(s2, 'qs.blame'); } }) } },
    { label: (s, c) => `Believe ${c.bf}: ${c.af} is shut in the infirmary`, dark: true, note: (s, c) => `${c.af} is locked in by the one who accused them, on that one's word.`, hint: 'unknown', info: (s, c) => [['yield', 'One of them watched'], ['danger', c.af]],
      out: { text: (s, c) => `${c.af} goes into the infirmary without a fight and the door is locked from the bridge. ${c.bf} reports every pass after that, very calmly.`, fx: (s, c) => ({ stain: ['qs_confined', 1], do: s2 => { mind(s2, c.a, -12); hev(s2, 2); told(s2, 'qs.blame'); } }) } },
    { label: 'Bring one of them down on the next flight', req: s => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: 'One seat. Whoever is left is alone up there with whatever it was.', hint: 'unknown', info: [['yield', 'One of them on the ground'], ['danger', 'The one left, and the banks']],
      out: { text: 'The lander goes up with one empty seat and comes down with it full. The one left aboard watches it go from the collar window.', fx: (s, c) => Object.assign(flyDown(s, c), { do: s2 => told(s2, 'qs.blame') }) } },
    { label: 'Tell them both to keep apart, and keep the passes', note: 'Two people on one ship, each sure of the other, told to sleep at opposite ends of her.', hint: 'unknown', info: [['yield', 'Nobody locked up'], ['danger', 'Both of them']],
      out: { text: (s, c) => `${c.af} takes the bridge end and ${c.bf} the banks end. They meet in the spine at the change of watch and do not speak.`, fx: (s, c) => ({ do: s2 => { mind(s2, c.a, -5); mind(s2, c.b, -5); told(s2, 'qs.blame'); } }) } },
  ] });

/* --- with nobody aboard --- */
H('qs.answer', { title: 'Crew Deck', aboard: false,
  setup: s => { const t = T(s); return { k: key(t), fly: canUp(s) }; },
  text: (s, c) => `The ship's telemetry ping has gone up every pass since landfall and come back as numbers. Last night it came back as a voice.\n\n[[unknown:The ship's channel]] "Crew deck."\n\nNobody has been aboard the ${ship(s)} since the last of the officers came down. The voice did not say anything else.`,
  choices: [
    { label: 'Answer it on every pass, and keep answering', note: 'Two of the radio room on the ship\'s channel at every pass, talking into nothing, for as long as it takes.', hint: 'unknown', info: [['yield', 'Whatever answers'], ['danger', 'Two people\'s work, every day']],
      out: { text: (s, c) => c.k === 'waker' ? 'The radio room answers every pass for a month. On the ninth pass something comes back, rough, as if from a throat that has not been used:\n\n[[unknown:The ship\'s channel]] "Who is this?"\n\nThen nothing for a week, and then the same question again, as if the answer had not been understood the first time.' : 'The radio room answers every pass for a month. Nothing answers back, and the word is never said again.',
        fx: (s, c) => ({ progress: -0.02, do: s2 => { if (c.k === 'waker') trust(s2, 2); told(s2, 'qs.answer'); } }) } },
    { label: 'Log it as a fault in the relay, and tell nobody', dark: true, note: 'Nobody below hears that the empty ship spoke. Whoever spoke hears nothing back.', hint: 'unknown', info: [['yield', 'Nobody frightened'], ['danger', 'Whoever said it']],
      out: { text: 'It is logged as a relay fault. The two who heard it are asked to say nothing, and mostly do.', fx: (s, c) => ({ morale: 1, stain: ['qs_hushed', 1], do: s2 => { if (c.k === 'waker') trust(s2, -1); told(s2, 'qs.answer'); } }) } },
    { label: 'Send the lander up now, before anything else answers', req: (s, c) => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: 'Four of the watch, at once, knowing nothing but the one word.', hint: 'unknown', info: [['yield', 'An answer, early'], ['danger', 'The four, going in blind']],
      out: { text: 'The lander goes up at first light with four aboard, a month before anyone below has stopped arguing about the word.', fx: (s, c) => ({ fly: 1, machine: { lander: -6 }, flags: { qs_lander_up: s.day }, do: s2 => { const t = T(s2); t.early = s2.day; t.hushSeen.push('qs.answer'); dark(s2, true); t.dark0 = s2.day; t.moUp = 1; LF.phase(s2, ID, 'boarding', `The colony boarded the ${ship(s2)} the month she spoke.`); LF.cue(s2, 'qs.walk', 0, 2); } }) } },
  ] });

const REPLY = { waker: 'It is one word, typed slowly, all in small letters, with a long gap before the last letter: hello.', changed: 'It is two words, in capitals, at once: COME UP.', grown: 'It is a single line of every letter on the keyboard, as if the whole board had been pressed at once, and held.',
  double: 'It is a service number, the full eleven figures, and it belongs to an officer who is on the ground.', help: 'It is three letters: AIR.', away: 'It is one word, over and over to the end of the line: NO.', other: 'Nothing comes back. The terminal is logged in on the next pass, and out again, by an account the ship does not list.', gone: 'Nothing comes back. On the next pass the galley terminal has been switched off at the wall.' };
H('qs.kettle', { title: 'Six in the Morning', aboard: false,
  setup: s => ({ k: key(T(s)) }),
  text: (s, c) => `The ship's telemetry is back to numbers, and one of them is wrong. Every morning at six the galley aboard the ${ship(s)} draws power for four minutes, about what a kettle takes. There is nobody aboard her.`,
  choices: [
    { label: 'Cut the galley\'s circuit from the ground', note: 'Whatever is making tea in an empty ship stops making it.', hint: 'unknown', info: [['yield', 'One less wrong number'], ['danger', 'Whoever wanted the tea']],
      out: { text: (s, c) => ['waker', 'changed', 'double'].includes(c.k) ? 'The circuit is cut. The next morning at six the infirmary draws power instead, for four minutes, and the morning after that.' : 'The circuit is cut. Nothing draws power at six the next morning, or any morning after.', fx: (s, c) => ({ do: s2 => { hev(s2, 1); if (c.k === 'waker') trust(s2, -2); told(s2, 'qs.kettle'); } }) } },
    { label: 'Leave it on, and log it every morning', note: 'Somebody in the radio room gets up at six every morning to write down that it happened again.', hint: 'unknown', info: [['yield', 'Nothing disturbed'], ['danger', 'Whatever it is, left to it']],
      out: { text: 'It is logged every morning at six. After a month the entry is a tick in a column.', fx: (s, c) => ({ do: s2 => { if (c.k === 'waker') trust(s2, 1); told(s2, 'qs.kettle'); } }) } },
    { label: 'Send a message to the galley terminal: who is there?', note: 'Somebody has to write it, and somebody has to read what comes back.', hint: 'unknown', info: [['yield', 'An answer, maybe'], ['danger', 'Whoever reads it']],
      out: { text: (s, c) => `The message goes up on the evening pass. The reply comes down on the next. ${REPLY[c.k] || REPLY.gone}`, fx: (s, c) => ({ morale: -1, do: s2 => { hev(s2, 1); if (c.k === 'waker') trust(s2, 1); told(s2, 'qs.kettle'); } }) } },
  ] });

H('qs.collar', { title: 'Three in the Morning', aboard: false,
  setup: s => ({ k: key(T(s)) }),
  text: (s, c) => `The docking collar's log came down with the telemetry. The collar opened and shut at three in the morning, twice. At the same minute the beacon on the lander pad was pinged from orbit, as if the ${ship(s)} were asking where the lander was.`,
  choices: [
    { label: 'Lock the lander\'s guidance out from orbit', note: 'A day in the lander\'s wiring, and whatever wants to find it cannot.', hint: 'unknown', info: [['yield', 'The lander hidden'], ['danger', 'The lander\'s wiring']],
      out: { text: 'The lander\'s guidance is rewired to listen to the pad and nothing above it. The pings go on for a week and stop.', fx: (s, c) => ({ machine: { lander: -4 }, do: s2 => { hev(s2, 1); if (c.k === 'waker') trust(s2, -1); told(s2, 'qs.collar'); } }) } },
    { label: 'Put a watch on the pad, and leave it', note: 'Two of the watch out on the pad every night, cold, looking up.', hint: 'unknown', info: [['yield', 'Eyes on the pad'], ['danger', 'Two of the watch, every night']],
      out: { text: 'Two of the watch spend every night on the pad in coats. They see her cross at dusk and again before dawn, and nothing else.', fx: (s, c) => ({ morale: -1, do: s2 => told(s2, 'qs.collar') }) } },
    { label: 'Leave the lander\'s homing open, both ways', note: 'Whatever is asking where the lander is gets told.', hint: 'unknown', info: [['yield', 'Whatever comes of it'], ['danger', 'The pad, and whoever is near it']],
      out: { text: (s, c) => c.k === 'other' ? 'Three nights later a light comes down out of the sky to the east of the pad, hangs low for a minute, and goes back up. In the morning there are marks in the ground out there that are not the lander\'s.' : c.k === 'waker' ? 'The pings stop the night the homing is opened, as if whoever was asking only wanted to know it was still there.' : 'The pings go on every night at three. The homing answers every one.',
        fx: (s, c) => ({ do: s2 => { if (c.k === 'waker') trust(s2, 1); if (c.k === 'other') { hev(s2, 1); LF.emit(s2, 'unexplained', SRC, 40, 220, 'a light came down near the pad in the night and went back up'); } told(s2, 'qs.collar'); } }) } },
  ] });

/* ======================= the silence: two more cards ======================= */
B('silent', { id: 'qs.ridge', title: 'Under Her', tone: 'pressure', chain: false, w: 3, max: 1, view: 'ship',
  when: (s, t) => s.day - (t.dark0 || s.day) >= 20,
  setup: s => { const p = anyNamed(s); return { pid: p ? p.id : null, name: p ? p.name : null, first: p ? p.first : null, k: key(T(s)) }; },
  text: (s, c) => `Every dusk now half the colony is on the ridge when the ${ship(s)} comes over: lamps, children on shoulders, nobody saying much. She crosses on time with her windows lit, and goes down the far side of the sky, and they walk back in the dark. The night shift starts late, and the morning one is tired.`,
  choices: [
    { label: 'Let them go up, every dusk', note: 'An hour of the day gone to it, and the grief comes down the hill with them every evening.', hint: 'unknown', info: [['yield', 'Nobody kept from it'], ['danger', 'The work, and everyone\'s nerve']],
      out: { text: 'The ridge fills every dusk. People start bringing the names of the ones in the banks, written on scraps, and holding them up as she goes over.', fx: (s, c) => ({ progress: -0.02, morale: 1, do: s2 => LF.emit(s2, 'grief', SRC, 30, 160, 'the colony stands on the ridge every dusk to watch the dark ship cross') }) } },
    { label: 'Close the ridge at dusk', note: 'The watch on the path at sunset, turning people back, every evening.', hint: 'unknown', info: [['yield', 'The shifts kept'], ['danger', 'Morale, and the watch\'s welcome']],
      out: { text: 'The path to the ridge is closed at sunset. People watch her from the doorways instead, and do not talk to the watch on the path.', fx: (s, c) => ({ morale: -3, tension: 5 }) } },
    { show: (s, c) => !!c.pid, label: (s, c) => `Let ${c.name} answer her from the ridge with a lamp`, note: (s, c) => `${c.first} has asked to. It will be ${c.first} up there every evening from now on, with a shutter and a lamp, alone with whatever answers.`, hint: 'unknown', info: (s, c) => [['yield', 'Somebody answering her'], ['danger', c.first]],
      out: { text: (s, c) => c.k === 'waker' ? `${c.first} works the lamp every dusk for a week. On the eighth evening the ship's running lights blink back, slowly, one letter and a long wait and another, as if whoever is doing it has to look each one up. ${c.first} comes down the ridge and cannot say anything for a while.` : `${c.first} works the lamp every dusk for a month. Nothing answers. ${c.first} goes up anyway, every evening, and comes down saying less each time.`,
        fx: (s, c) => ({ morale: 1, do: s2 => { const p = byPid(s2, c.pid), t = T(s2); if (p) { p.known = p.known || s2.day; p.marks.qs_lamp = { d: s2.day, txt: 'answered the dark ship from the ridge with a lamp, every dusk' }; } t.lamp = c.pid; if (c.k === 'waker') trust(s2, 2); else LF.emit(s2, 'grief', SRC, 25, 160, `${c.first} signals the dark ship every dusk and nothing answers`); } }) } },
  ] });

B('silent', { id: 'qs.kin', title: 'The Families', tone: 'crisis', chain: false, w: 3, max: 1, view: 'ship',
  when: (s, t) => s.sleepers > 20 && s.day - (t.dark0 || s.day) >= 30,
  setup: s => ({ n: s.sleepers, fly: canUp(s) }),
  text: (s, c) => `Everyone with a partner, a parent or a child still in the banks comes to the lander shed together at first light. ${cap1(num(Math.min(40, Math.max(6, Math.round(c.n / 4)))))} of them, which is more than anyone had counted, and they have brought the people with the keys. They want a flight, and they want one of their own on it.`,
  choices: [
    { label: 'Fly for them, with one of them in the party', req: s => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: 'The boarding goes up now, on their terms, with somebody aboard who will not leave without their own.', hint: 'unknown', info: [['yield', 'An answer, and the families heard'], ['danger', 'The party, and the one of theirs in it']],
      out: { text: 'The lander goes up that afternoon with four of the watch and a fifth in a borrowed suit, holding a photograph in a plastic sleeve.', fx: s => ({ fly: 1, machine: { lander: -6 }, flags: { qs_lander_up: s.day }, do: s2 => { const t = T(s2); t.kinUp = s2.day; t.moUp = mo(s2, t); LF.phase(s2, ID, 'boarding'); LF.cue(s2, 'qs.walk', 0, 2); } }) } },
    { label: 'Promise them a date, and keep it', note: 'A date chalked on the shed door, two months off. If it passes, they will know what the promise was worth.', hint: 'unknown', info: [['yield', 'Time'], ['danger', 'Their trust, if the date goes by']],
      out: { text: 'A date is chalked on the shed door, two months off, and they go back to work. Somebody stops at the door every morning to look at it.', fx: (s, c) => ({ morale: -1, do: s2 => { T(s2).promise = s2.day + 2 * MONTH; } }) } },
    { label: 'Put the lander under guard', dark: true, note: 'Rifles on the shed, against the colony\'s own, because grief with the keys to a lander is how people die.', hint: 'unknown', info: [['yield', 'The lander kept'], ['danger', 'The families, and the watch on the door']],
      out: { text: 'The watch is put on the shed with rifles. There is shoving at the door the first night and a broken arm, and after that the families stand across the yard from the shed every morning, not saying anything.', fx: (s, c) => ({ morale: -3, tension: 8, stain: ['qs_guarded', 1] }) } },
  ] });
/* A date chalked on the shed door that goes by with nobody flown up. */
(function () { const t0 = LF.threadTick; LF.threadTick = function (s) { if (t0) t0(s); const t = s.threads && s.threads[ID];
  if (t && t.promise && s.day >= t.promise) { const still = !t.end && t.phase === 'silent'; t.promise = 0; if (still) { s.morale = clamp(s.morale - 5, 0, 100); s.tension = clamp(s.tension + 6, 0, 100); LF.log(s, 'The date chalked on the lander shed door went by, and nobody flew. Somebody has rubbed it out.', 'bad'); } } }; })();

/* ======================= the waker: what the party finds ======================= */
B('boarding', { id: 'qs.nest', title: 'The Fortieth Row', tone: 'crisis', urgent: true, w: 9, repeat: 4, view: 'ship',
  setup: s => { const t = T(s), a = up(s)[0]; return { trust: t.trust || 0, off: a ? a.id : null, offFirst: a ? a.first : null, offName: a ? a.name : null, upIds: up(s).map(p => p.id), mo: Q.moUp(s, t) }; },
  text: (s, c) => `The hold has been made into a home. Cargo blankets, crates for a table, the planet drawn over and over in grease pencil from the window, and a calendar scratched into a bulkhead, row after row of tallies running back to the voyage. The pod it came from is in bank C with its lid forced open from inside and its edges gone to rust.\n\n${c.off ? `${c.offName} is sitting on a crate in the middle of it, beside somebody thin and grey who will not look at the lamps.\n\n${said(s, c.off, 'nest', `${c.offFirst} asks the party, and the ground, to go gently.`)}` : 'Somebody thin and grey is backed into the corner behind the cradles with a wrench held in both hands, watching the lamps, not the people holding them.'}\n\n[[x19]] "Your call. They haven't moved."`,
  choices: [
    { label: 'Talk them out, for as long as it takes', note: 'The party sits down, lamps off, and waits. However many passes it takes is how many the banks go unminded.', hint: 'unknown', test: { base: 25, mods: [If((s, c) => c.trust >= 2, 15, 'They have been answered before'), If((s, c) => c.trust >= 4, 15, 'They have been answered often'), If((s, c) => !!c.off, 15, 'Someone they trust is with them'), R('doctor', 10)], aboard: true }, info: [['yield', 'Them, alive, and willing'], ['danger', 'The sleepers, while it takes']],
      ok: { text: (s, c) => `It takes three passes. On the third the one from the hold stands up without being asked and walks to the collar between two of the watch, holding ${c.off ? `${c.offFirst}'s sleeve` : 'a blanket round their shoulders'}. On the ground they will not go indoors for the first week, and sleep under the lander's wing.`,
        fx: (s, c) => ({ pop: 1, sleepers: -Math.min(3, s.sleepers), morale: 3, flags: home, do: s2 => { const p = LF.makePerson(s2, null); p.known = s2.day; p.marks.qs_waker = { d: s2.day, txt: 'lived alone aboard the ship for years after a pod failed open on the voyage' }; down(s2, c.upIds); LF.chron(s2, `${p.name} came down from the ship after years alone aboard her.`); LF.endThread(s2, ID, 'coaxed'); } }) },
      bad: { text: 'On the second pass the one from the hold goes up into the ducts, fast, on hands and knees, and does not come down again. The party waits two more passes and leaves food at the hatch. It is gone in the morning.',
        fx: (s, c) => ({ sleepers: -Math.min(3, s.sleepers), flags: home, do: s2 => { down(s2, c.upIds); T(s2).keeper = s2.day; LF.endThread(s2, ID, 'keeper'); } }) } },
    { label: 'Take them out by force, as gently as it can be done', note: 'Four of the watch against one frightened person who knows every duct in her.', hint: 'unknown', risky: true, test: { base: 50, mods: [R('security', 10)], aboard: true }, info: [['yield', 'Them, alive, whether they like it or not'], ['danger', 'Them, and the four']],
      ok: { text: (s, c) => `It is over quickly, and it is ugly. They fight like an animal and then stop all at once and go limp, and are carried to the collar. On the ground they eat and sleep and do the work they are given, and do not speak to anyone for a season.`,
        fx: (s, c) => ({ pop: 1, morale: -2, flags: home, do: s2 => { const p = LF.makePerson(s2, null); p.known = s2.day; p.mind = 20; p.marks.qs_waker = { d: s2.day, txt: 'was carried out of the ship\'s hold by force after years alone aboard her' }; down(s2, c.upIds); LF.endThread(s2, ID, 'seized'); } }) },
      bad: { text: 'It goes wrong in the cargo lift shaft, in the dark. One of the watch falls. The one from the hold falls with them, and only one of them is moving at the bottom, and then neither.',
        fx: (s, c) => ({ dead: 1, morale: -5, stain: ['qs_hunted', 2], flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'hunted'); } }) } },
    { label: 'Seal the hold, and open it to vacuum', dark: true, note: (s, c) => `Certain, and quick. ${c.off ? `${c.offFirst} is taken out first, whatever ${c.offFirst} says about it.` : 'Nobody has to go near the wrench.'} Whatever they have hoarded in there is the colony's.`, hint: 'unknown', info: [['yield', 'The ship back, and their hoard'], ['danger', 'Them']],
      out: { text: (s, c) => `${c.off ? `${c.offFirst} is carried out of the hold between two of the watch, shouting. ` : ''}The hold door is sealed and the cargo lock opened. When it is shut again the party goes in for the crates: tools, spares, wire, all of it sorted and labelled in a careful hand.`,
        fx: (s, c) => ({ parts: 8, mat: 20, stain: ['qs_aired', 3], flags: home, do: s2 => { down(s2, c.upIds); if (c.off) mind(s2, c.off, -20); LF.endThread(s2, ID, 'hunted'); } }) } },
    { label: 'Leave them food and the ship, and bring the party home', note: 'They have kept her this long. Nobody can say what they will do with her next.', hint: 'unknown', info: [['yield', 'Somebody minding the banks'], ['danger', 'Whatever they decide']],
      out: { text: (s, c) => `The party leaves a month of rations on the hold floor and backs out to the collar. ${c.off ? `${c.offFirst} comes with them, and looks back once.` : ''} That night the running lights blink twice at the dusk pass, slowly.`,
        fx: (s, c) => ({ food: -40, flags: home, do: s2 => { down(s2, c.upIds); T(s2).keeper = s2.day; LF.endThread(s2, ID, 'keeper'); } }) } },
  ] });

/* ======================= after ======================= */
const A = (id, st) => LF.beat(ID, 'after', Object.assign({ id, view: 'ship', chain: false, w: 3, max: 1 }, st));
A('qs.tune', { title: 'The Tune', tone: 'pressure', when: (s, t) => !!s.flags.qs_changed_down && s.day - (t.endDay || 0) >= 80,
  setup: s => ({ n: 5 + Math.floor(LF.srand(s) * 8) }),
  text: (s, c) => `The ones who came down from the ship stopped humming a long time ago. ${cap1(num(c.n))} other people hum it now, the same few notes, at work and in their sleep, and none of them were aboard her. The clinic finds nothing in their blood. Their families have started sleeping in other rooms.`,
  choices: [
    { label: 'Keep the ones who hum apart for a season', dark: true, note: (s, c) => `${cap1(num(c.n))} people in the old store shed, away from their families, until it stops or does not.`, hint: 'unknown', info: (s, c) => [['yield', 'It goes no further'], ['danger', `${cap1(num(c.n))} people, and their families`]],
      out: { text: 'They go into the store shed without much fuss and hum there, together, which is somehow worse. After a season it stops in all of them on the same night.', fx: (s, c) => ({ morale: -3, stain: ['qs_apart', 2] }) } },
    { label: 'Let them hum', note: 'Nobody is shut away. Everyone else has to listen.', hint: 'unknown', info: [['yield', 'Nobody shut away'], ['danger', 'Everyone\'s nerve']],
      out: { text: 'It goes on. Some people start humming it on purpose, to make it ordinary, and that helps more than anyone expected.', fx: (s, c) => ({ morale: -1, do: s2 => LF.emit(s2, 'unexplained', SRC, 30, 240, 'people hum the tune that came down from the quiet ship') }) } },
    { label: 'Have the clinic keep a list of who hums', dark: true, note: 'Names in a book, checked every week, so the colony knows how far it has gone.', hint: 'unknown', info: [['yield', 'A count'], ['danger', 'Everyone on the list']],
      out: { text: 'The list goes up in the clinic and gets longer for a month, and then shorter. People on it are not asked to the hall.', fx: (s, c) => ({ tension: 5, stain: ['qs_humlist', 1] }) } },
  ] });
A('qs.keeper', { title: 'The Keeper\'s Voice', tone: 'pressure', when: (s, t) => t.end === 'keeper' && s.day - (t.endDay || 0) >= 120 && s.sleepers > 12,
  text: (s, c) => `The one who stayed aboard the ${ship(s)} has started to talk on the ship's channel, a little more each month. Tonight it is a question, asked carefully, as if it had been practised.\n\n[[unknown:The ship's channel]] "I can wake six. I know which six. Do you want them?"`,
  choices: [
    { label: 'Take whoever they send', note: 'Six more on the ground, chosen by somebody who has watched their pods for years and has reasons nobody below knows.', hint: 'unknown', info: [['yield', 'Six more people'], ['danger', 'Whoever they chose, and why']],
      out: { text: 'Six come down in the cargo pod a month later, woken slow and careful. Two are the oldest in the banks. One is a child. Nobody can see what the six have in common, and the keeper will not say.', fx: (s, c) => ({ pop: 6, sleepers: -6, do: s2 => LF.emit(s2, 'unexplained', SRC, 25, 200, 'the keeper aboard the ship chose who woke') }) } },
    { label: 'Tell them to wake nobody', note: 'The banks stay as they are. The one up there has asked for something, and been told no.', hint: 'unknown', info: [['yield', 'The colony decides who wakes'], ['danger', 'The keeper\'s goodwill']],
      out: { text: 'The answer goes up. The ship\'s channel is silent for a month after it, and her running lights are dark at the dusk pass.', fx: (s, c) => ({ morale: -2 }) } },
    { label: 'Send up a list: who wakes, and who never does', dark: true, note: 'The colony picks the six it needs, and writes down which of the rest stay asleep for good.', hint: 'unknown', info: [['yield', 'The six the colony needs'], ['danger', 'Everyone on the second list']],
      out: { text: 'Two lists go up. The six on the first come down a month later. The keeper reads the second one back over the channel, every name, slowly, and then turns those pods down.', fx: (s, c) => ({ pop: 6, sleepers: -Math.min(16, s.sleepers), stain: ['qs_nevers', 2] }) } },
  ] });
const SALVAGE = ['sealed', 'burned', 'cleared', 'vented', 'doors', 'restarted', 'rescued', 'coaxed', 'seized', 'hunted', 'stripped', 'held', 'waited', 'heeded', 'retaken', 'tested', 'down', 'one', 'banks'];
const WHY = { gone: 'The ship\'s log stops at ten past two on the night she went quiet, with the inner airlock cycling, and starts again the next morning with nothing between.', changed: 'The air plant\'s filters are clogged with something fine and pale that came up in the cargo pods. Under a glass it looks like pollen. The clinic does not know what it does.',
  grown: 'The cargo manifest shows the pod it grew from: a soil sample sent up for the ship\'s bigger laboratory, in the first year.', double: 'The infirmary\'s own records show a pod repaired and thawed by the ship on her own judgement, from a template, on the day of the flight.',
  help: 'The flight computer\'s last entry is a scrubber fault, and an order to shed load from the crew deck to the banks.', away: 'Bank C\'s thaw log shows one pod brought up warm for an hour, the night before she went quiet, and the name on it is crossed out by hand.',
  other: 'The docking log has the other ship\'s registry in it, an old one, from a launch nobody on the ground had heard of.', waker: 'Pod 31\'s log shows its lid forced from inside on the voyage, and every year after that, a few minutes of power drawn by hand.' };
A('qs.salvage', { title: 'What Was Left', tone: 'quiet', when: (s, t) => SALVAGE.includes(t.end) && s.day - (t.endDay || 0) >= 90 && !s.flags.ship_down && !s.machines.lander.lost,
  setup: s => ({ k: key(T(s)) }),
  text: (s, c) => `The ${ship(s)} has been quiet in the ordinary way since it was over: telemetry, numbers, nothing else. Somebody at the council asks what is still up there worth having, and nobody wants to be the one who goes.`,
  choices: [
    { label: 'Strip her of what can be carried down', req: s => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: 'A flight, and a crew in her for a week with cutters, in the same corridors.', hint: 'unknown', info: [['yield', 'Spares and plate'], ['danger', 'The lander, and the crew\'s nerve']],
      out: { text: (s, c) => `The crew comes back with racks, cable, plate and a box of the ship's paper records nobody asked for. One page has been folded and put in a pocket. ${WHY[c.k] || WHY.gone}`, fx: s => ({ fly: 1, machine: { lander: -6 }, parts: 10, mat: 40 }) } },
    { label: 'Bring down her log, and nothing else', req: s => canUp(s), reqText: s => LF.flyWhy(s) || 'The lander cannot fly', note: 'One flight, one person, an hour aboard. An answer, maybe.', hint: 'unknown', info: [['yield', 'An answer'], ['danger', 'A flight of fuel']],
      out: { text: (s, c) => `The log comes down in a case and is read in the hall, aloud. ${WHY[c.k] || WHY.gone} People go home quiet.`, fx: s => ({ fly: 1, morale: 2, do: s2 => LF.chron(s2, 'The ship\'s log was brought down and read aloud in the hall.') }) } },
    { label: 'Leave her be', note: 'What is up there stays up there. The yard goes short of what it could have had.', hint: 'unknown', info: [['yield', 'Nobody goes back'], ['danger', 'The yard, short']],
      out: { text: 'Nobody goes. She crosses at dusk and people mostly do not look up any more.', fx: { morale: 1 } } },
  ] });
const FELL = ['abandoned', 'left', 'double_left'];
A('qs.fall', { title: 'Last Pass', tone: 'crisis', urgent: true, w: 6, when: (s, t) => FELL.includes(t.end) && s.day - (t.endDay || 0) >= 3 * YEAR && s.day >= 6 * YEAR && !s.flags.ship_down,
  setup: s => { const p = LF.inOrbit(s).find(q => q.alive); return { pid: p ? p.id : null, name: p ? p.name : null, n: s.sleepers }; },
  text: (s, c) => `Nobody has flown to the ${ship(s)} since she was cut loose, and nobody has kept her orbit. Tonight she comes over low and long, already glowing along her belly, and the radio room says this is the last pass she will make.${c.pid ? `\n\nThe ship's channel opens for the first time in years. It is ${c.name}.\n\n${said(s, c.pid, 'last', `${c.name} says goodbye on the open channel, and nobody in the radio room can answer.`)}` : '\n\nThe ship\'s channel is silent. She has been silent a long time.'}`,
  choices: [
    { label: 'Everyone to the ridge, with lamps', note: 'The whole colony out in the dark to watch her burn, and the work of tomorrow done tired.', hint: 'unknown', info: [['yield', 'Everyone sees her go'], ['danger', 'Everyone\'s grief at once']],
      out: { text: (s, c) => `The ridge is full. She burns across the whole sky in pieces, slowly, and lights the valley like a dawn${c.pid ? ', and the channel stays open until it is only noise' : ''}. Nobody says anything until the last piece is down past the hills.`, fx: (s, c) => fell(s, c, { morale: 2, griefWhy: 'the colony watched the ship burn from the ridge' }) } },
    { label: 'The radio room only, with the door shut', note: (s, c) => `A few people to hear it properly${c.pid ? `, and to answer ${c.name}` : ''}. Everyone else hears about it in the morning.`, hint: 'unknown', info: [['yield', 'Somebody with them at the end'], ['danger', 'Everyone who was not there']],
      out: { text: (s, c) => `Four people sit in the radio room with the lights off and the channel open.${c.pid ? ` They talk to ${c.name} until the signal breaks up, about nothing much.` : ''} In the morning the rest of the colony finds out she is gone from the ones who were there, and some of them do not forgive it.`, fx: (s, c) => fell(s, c, { morale: -1, griefWhy: 'the ship came down in the night' }) } },
    { label: 'Turn the radio off, and keep everyone in', note: (s, c) => `Nobody watches. Nobody hears ${c.pid ? `what ${c.name} says` : 'her go'}.`, hint: 'unknown', info: (s, c) => [['yield', 'Nobody has to watch'], ['danger', c.pid ? c.name : 'The colony\'s nerve']],
      out: { text: (s, c) => `The radio room is locked and the doors are shut. The light of her coming down goes across the shutters for a quarter of an hour, and then it is dark.`, fx: (s, c) => fell(s, c, { morale: -3, griefWhy: 'the ship came down and the colony was kept indoors' }) } },
  ] });
function fell(s, c, o) {
  return { sleepers: -s.sleepers, morale: o.morale, flags: { ship_down: s.day }, do: s2 => { for (const p of LF.inOrbit(s2)) if (p.alive) { p.orbit = false; p.away = false; LF.killPerson(s2, p, 'went down with the ship on her last pass'); } LF.emit(s2, 'grief', SRC, 45, 300, o.griefWhy); LF.chron(s2, `The ${ship(s2)} came down out of her orbit, with ${num(c.n)} asleep aboard her.`); } };
}

/* ======================= the puzzles ======================= */
/* A card that gains a board: the board is made at setup (ctx.pz), the card's own options are shown only until the first
   move, and one option, appended (option ids go by position), answers for the finished board. */
function puzzleOn(id, kind, make, finish) {
  const st = LF.byId[id]; if (!st) return;
  const s0 = st.setup; st.puzzle = kind;
  st.setup = s => { const c = s0 ? s0(s) : {}; const pz = make(s, c); if (pz) c.pz = pz; return c; };
  for (const ch of st.choices) { const sh = ch.show; ch.show = (s, c) => !(c && c.pz && c.pz.turns) && (!sh || sh(s, c)); }
  st.choices.push(guard(Object.assign({ hint: 'unknown' }, finish, { show: (s, c) => !!(c && c.pz && c.pz.done) })));
}
/* The answer of a finished board reads the board: until there is one (the sim reads every option of every card) it says nothing. */
function guard(ch) { const o = ch.out, t0 = o.text, f0 = o.fx, ok = c => !!(c && c.pz && c.pz.done);
  ch.out = { text: (s, c) => ok(c) ? t0(s, c) : '', fx: (s, c) => ok(c) ? f0(s, c) : null }; return ch; }
const lcg = pz => { pz.r = (pz.r * 1103515245 + 12345) % 2147483648; return pz.r / 2147483648; };
const seed = s => 1 + Math.floor(LF.srand(s) * 2147483000);
const shuffle = (pz, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(lcg(pz) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* --- 6. the pod log (qs.count): eight lines, one cannot be true --- */
const LOG_RULES = n => [`Bank C was sealed at 22:00 and is opened only at the morning check.`, `${n} is the only one aboard awake, and is off watch from 23:10 to 05:00.`, `The hold is unheated and unpowered.`, `She has one docking collar.`, `The log is kept by the flight computer.`];
const LOG_PLAIN = n => [['22:40', 'Galley: lights off'], ['23:55', 'Bank B pod 9: temperature alarm, cleared by the system'], ['01:30', 'Hull: micrometeoroid strike, starboard, no breach'], ['02:00', 'Bank D: routine cycle'], ['03:15', 'Reactor feed: load steady'], ['04:20', 'Bank B pod 17: heartbeat irregular, settled'], ['05:20', 'Galley: lights on']];
const LOG_FIXED = n => [['22:00', 'Bank C: sealed for the night'], ['23:10', `${n}: off watch`], ['05:00', `${n}: on watch`]];
const LOG_BAD = {
  waker: ['02:14', 'Bank C pod 31: lid opened from inside', 'Pod 31 opened from inside, in a sealed bank, at night. Whoever is in pod 31 was awake, and is not on any watch list.'],
  gone: ['02:10', 'Inner airlock: cycled by hand', 'The airlock was worked by hand at ten past two, with the only one awake aboard asleep. Somebody else was at that door.'],
  changed: ['03:00', 'Crew deck: four bunks occupied', 'Four bunks were warm on the crew deck at three, with one person aboard awake and nobody else out of the pods.'],
  grown: ['01:45', 'Hold: 37 degrees and rising', 'The hold has no heat and no power, and it was at blood heat at a quarter to two.'],
  double: ['02:30', 'Bridge console: logged in by the officer aboard', 'The bridge console was logged into at half past two under the name of the officer aboard, who was off watch and logged in a bunk.'],
  help: ['03:40', 'Flight computer: shut down', 'The flight computer keeps this log, and the log says it shut down at twenty to four. The lines after it were written by hand.'],
  away: ['02:50', 'Bank C pod 12: opened, cleaned, closed', 'Pod 12 was opened, cleaned and shut in a bank sealed for the night, with nobody awake to do it.'],
  other: ['03:05', 'Docking collar two: hard seal', 'She has one docking collar, and at five past three something made a hard seal on a second.'],
};
LF.newManifest = function (s, c) {
  const pz = { kind: 'manifest', r: seed(s), turns: 0, done: false, picked: null, right: false, k: c.k, n: c.first };
  const bad = LOG_BAD[c.k] || LOG_BAD.gone, lines = LOG_FIXED(c.first).concat(shuffle(pz, LOG_PLAIN(c.first)).slice(0, 4)).map(([t, x]) => ({ t, x, bad: false }));
  lines.push({ t: bad[0], x: bad[1], bad: true });
  lines.sort((a, b) => ((a.t < '12' ? '2' : '1') + a.t).localeCompare((b.t < '12' ? '2' : '1') + b.t));
  pz.lines = lines; pz.rules = LOG_RULES(c.first); return pz;
};
LF.PUZZLES.manifest = {
  moves: (s, pz) => pz.done ? [] : pz.lines.map((l, i) => ({ id: 'L' + i, label: `${l.t}  ${l.x}`, sub: 'This one cannot be true', row: true })),
  move(s, pz, id) { if (pz.done) return null; const i = +String(id).slice(1), l = pz.lines[i]; if (!l) return null;
    pz.turns++; pz.picked = i; pz.right = !!l.bad; pz.done = true; return pz.right ? 'papers' : 'alarm'; },
  draw: (s, pz) => ({ note: pz.rules.join('\n'), log: pz.done ? [pz.right ? `The line at ${pz.lines[pz.picked].t}. ${LOG_BAD[pz.k] ? LOG_BAD[pz.k][2] : ''}` : `The line at ${pz.lines[pz.picked].t} checks out against the rules, once somebody goes and looks.`] : ['Read it against the rules at the top. Mark the line that cannot be true.'] }),
  bot: (s, pz) => { const i = lcg(pz) < 0.7 ? pz.lines.findIndex(l => l.bad) : Math.floor(lcg(pz) * pz.lines.length); return 'L' + i; },
};
{ const st = LF.byId['qs.count']; st.choices.push(guard({ hint: 'unknown', show: (s, c) => !!(c && c.pz && c.pz.done), label: (s, c) => c.pz.right ? 'The log has given something away' : 'The wrong line', note: (s, c) => c.pz.right ? 'Something aboard is not keeping to the ship\'s rules.' : 'Somebody in bank C will be woken to be asked about it.',
  info: (s, c) => c.pz.right ? [['yield', 'Evidence']] : [['danger', 'A sleeper, woken for nothing']],
  out: { text: (s, c) => c.pz.right ? `It is the line at ${c.pz.lines[c.pz.picked].t}. ${(LOG_BAD[c.k] || LOG_BAD.gone)[2]} ${c.first} reads it back over the radio twice, and goes quiet.` : `The line at ${c.pz.lines[c.pz.picked].t} is checked and holds. The sleeper it names is thawed to be asked about it, and wakes badly, and knows nothing.`,
    fx: (s, c) => c.pz.right ? { do: s2 => { hev(s2, 2); told(s2, 'qs.count'); } } : { sleepers: -Math.min(1, s.sleepers), morale: -2, do: s2 => told(s2, 'qs.count') } } }));
  for (const ch of st.choices.slice(0, -1)) { const sh = ch.show; ch.show = (s, c) => !(c && c.pz && c.pz.turns) && (!sh || sh(s, c)); } }

/* --- 1. her lights (qs.lights): flash code, read off the ridge with the ship's signal book --- */
const BOOK = { A: 'LSSS', C: 'SLSS', D: 'SSLS', E: 'SSSL', F: 'LLSS', H: 'LSLS', L: 'LSSL', M: 'SLLS', N: 'SLSL', O: 'SSLL', P: 'LLLS', S: 'LLSL', T: 'LSLL', U: 'SLLL', W: 'LLLL', Y: 'SSSS' };
const BY_CODE = Object.fromEntries(Object.entries(BOOK).map(([k, v]) => [v, k]));
const WORDS = { help: 'HELP', away: 'STAY AWAY', waker: 'FOOD', changed: 'COME UP' };
const flip = (code, i) => code.slice(0, i) + (code[i] === 'L' ? 'S' : 'L') + code.slice(i + 1);
const glyph = (code, dim) => code.split('').map((x, i) => i === dim ? '?' : x === 'L' ? '—' : '·').join(' ');
LF.newLights = function (s, c) {
  const t = T(s), word = WORDS[key(t)] || WORDS.help, pz = { kind: 'lights', r: seed(s), turns: 0, done: false, word, passes: 0, groups: [] };
  const dims = clamp(Math.round(4 - 3 * LF.dept(s, 'scientist')), 1, 4), idx = [];
  for (const ch of word) if (ch === ' ') pz.groups.push({ gap: true }); else { idx.push(pz.groups.length); pz.groups.push({ ch, code: BOOK[ch], dim: null, opts: [], pick: null }); }
  for (const i of shuffle(pz, idx.slice()).slice(0, dims)) pz.groups[i].dim = Math.floor(lcg(pz) * 4);
  for (const g of pz.groups) if (!g.gap) {
    if (g.dim !== null) g.opts = [g.ch, BY_CODE[flip(g.code, g.dim)]].sort();
    else { const nb = shuffle(pz, [0, 1, 2, 3].map(i => BY_CODE[flip(g.code, i)])).slice(0, 2); g.opts = [g.ch].concat(nb).sort(); }
  }
  return pz;
};
const curG = pz => pz.groups.findIndex(g => !g.gap && g.pick === null);
const readOf = pz => pz.groups.map(g => g.gap ? ' ' : g.pick || '_').join('');
LF.PUZZLES.lights = {
  moves(s, pz) { if (pz.done) return []; const i = curG(pz), g = pz.groups[i];
    const out = g.opts.map(x => ({ id: 'p' + x, label: x, sub: glyph(BOOK[x]), chip: true }));
    if (g.dim !== null && pz.passes < 2) out.push({ id: 'pass', label: 'Wait for another dusk and read this one again', sub: 'A month of passes, and the banks unminded for it' });
    return out; },
  move(s, pz, id) { if (pz.done) return null; const i = curG(pz), g = pz.groups[i]; pz.turns++;
    if (id === 'pass') { if (g.dim === null || pz.passes >= 2) return null; pz.passes++; g.dim = null; g.opts = [g.opts.find(x => x === g.ch)].concat(shuffle(pz, [0, 1, 2, 3].map(k => BY_CODE[flip(g.code, k)])).slice(0, 2)).sort(); return 'beacon'; }
    const x = String(id).slice(1); if (!g.opts.includes(x)) return null; g.pick = x;
    if (curG(pz) < 0) { pz.done = true; pz.read = readOf(pz).trim(); pz.right = pz.read === pz.word; }
    return 'lamp_shutter'; },
  draw(s, pz) { const i = curG(pz), cells = pz.groups.map((g, k) => g.gap ? '<span class="gap"></span>' : `<span class="${k === i ? 'at' : ''}">${g.pick || '?'}</span>`).join('');
    return { html: `<div class="slate">${cells}</div><div class="book">${Object.entries(BOOK).map(([k, v]) => `<span><b>${k}</b> ${glyph(v)}</span>`).join('')}</div>`,
      log: pz.done ? [`The slate reads ${pz.read}.`] : [`Flash ${pz.groups.slice(0, i + 1).filter(g => !g.gap).length} of ${pz.groups.filter(g => !g.gap).length}: ${glyph(pz.groups[i].code, pz.groups[i].dim)}${pz.groups[i].dim !== null ? '. One flash was lost in the haze.' : ''}`],
      stats: [['time', `${pz.passes} more dusk${pz.passes === 1 ? '' : 's'} watched`]] }; },
  bot(s, pz) { const g = pz.groups[curG(pz)]; if (g.dim !== null && pz.passes < 2 && lcg(pz) < 0.4) return 'pass'; return 'p' + (lcg(pz) < (g.dim !== null ? 0.5 : 0.85) ? g.ch : g.opts.find(x => x !== g.ch)); },
};
puzzleOn('qs.lights', 'lights', s => LF.newLights(s), { label: (s, c) => `The slate reads ${c.pz.read}`, note: 'Whatever is on the slate is what the colony will believe.', info: [['yield', 'A reading, your own']],
  out: { text: (s, c) => `It takes ${c.pz.passes ? `${num(c.pz.passes + 3)} evenings` : 'three evenings'} on the ridge with the book. The slate reads ${c.pz.read}, and that is what goes round the colony by morning.`,
    fx: (s, c) => ({ sleepers: -Math.min(2 * c.pz.passes, s.sleepers), do: s2 => { const t = T(s2), r = c.pz.read; t.read = r === 'HELP' ? 'help' : r === 'STAY AWAY' ? 'away' : r === 'FOOD' ? 'food' : r === 'COME UP' ? 'comeup' : 'garbled'; t.waited = (t.waited || 0) + c.pz.passes;
      if (c.pz.right) hev(s2, 1); if (t.truth.is === 'waker' && r === 'FOOD') trust(s2, 1);
      LF.emit(s2, 'unexplained', SRC, 40, 260, `the ${ship(s2)} is blinking ${r} at the dusk pass`); LF.cue(s2, 'qs.silent', 16, 28); } }) } });

/* --- 3. restart (qs.air): turn the junctions until the reactor feeds the scrubbers, the banks, or both --- */
const NB = [[-1, 0, 1, 4], [0, 1, 2, 8], [1, 0, 4, 1], [0, -1, 8, 2]];   // N, E, S, W: dr, dc, this side's bit, the far side's bit
const rot = m => ((m << 1) | (m >> 3)) & 15;
const SRC_RC = [1, 0], SCRUB = [0, 3], BANKS = [3, 3], SIZE = 4;
function path(pz, from, to) {
  const seen = new Set(), go = (r, c) => { if (r === to[0] && c === to[1]) return [[r, c]]; seen.add(r + ',' + c);
    for (const [dr, dc] of shuffle(pz, NB.slice())) { const nr = r + dr, nc = c + dc; if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE || seen.has(nr + ',' + nc)) continue; const p = go(nr, nc); if (p) return [[r, c]].concat(p); }
    return null; };
  return go(from[0], from[1]);
}
LF.newRestart = function (s, c) {
  const pz = { kind: 'restart', r: seed(s), turns: 0, done: false, air: 18, cells: [], sol: [] };
  const m = Array.from({ length: SIZE }, () => Array(SIZE).fill(0)), link = p => { for (let i = 0; i + 1 < p.length; i++) { const [a, b] = [p[i], p[i + 1]], d = NB.find(n => a[0] + n[0] === b[0] && a[1] + n[1] === b[1]); m[a[0]][a[1]] |= d[2]; m[b[0]][b[1]] |= d[3]; } };
  link(path(pz, SRC_RC, SCRUB)); link(path(pz, SRC_RC, BANKS));
  m[SRC_RC[0]][SRC_RC[1]] |= 8; m[SCRUB[0]][SCRUB[1]] |= 2; m[BANKS[0]][BANKS[1]] |= 2;
  const filler = [5, 10, 3, 6, 12, 9, 7, 11];
  for (let r = 0; r < SIZE; r++) for (let c2 = 0; c2 < SIZE; c2++) { if (!m[r][c2]) m[r][c2] = filler[Math.floor(lcg(pz) * filler.length)]; pz.sol.push(m[r][c2]); let v = m[r][c2]; for (let k = Math.floor(lcg(pz) * 4); k > 0; k--) v = rot(v); pz.cells.push(v); }
  pz.lit = lit(pz); return pz;
};
function lit(pz) {
  const at = (r, c) => pz.cells[r * SIZE + c], seen = new Set(), q = [];
  if (at(...SRC_RC) & 8) { q.push(SRC_RC); seen.add(SRC_RC.join(',')); }
  while (q.length) { const [r, c] = q.shift(); for (const [dr, dc, b, o] of NB) { const nr = r + dr, nc = c + dc; if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE || seen.has(nr + ',' + nc)) continue; if ((at(r, c) & b) && (at(nr, nc) & o)) { seen.add(nr + ',' + nc); q.push([nr, nc]); } } }
  return { on: [...seen], scrub: seen.has(SCRUB.join(',')) && !!(at(...SCRUB) & 2), banks: seen.has(BANKS.join(',')) && !!(at(...BANKS) & 2) };
}
LF.PUZZLES.restart = {
  moves: (s, pz) => pz.done ? [] : [{ id: 'stop', label: 'Leave it as it stands, and get out', sub: pz.lit.scrub && pz.lit.banks ? 'Both are fed' : pz.lit.scrub ? 'The scrubbers are fed, the banks are not' : pz.lit.banks ? 'The banks are fed, the scrubbers are not' : 'Nothing is fed', home: true }],
  move(s, pz, id) { if (pz.done) return null;
    if (id === 'stop') { pz.done = true; return 'power_down'; }
    const m = /^t(\d)(\d)$/.exec(id); if (!m) return null; const i = +m[1] * SIZE + +m[2]; pz.cells[i] = rot(pz.cells[i]); pz.turns++; pz.air--; pz.lit = lit(pz);
    if ((pz.lit.scrub && pz.lit.banks) || pz.air <= 0) pz.done = true; return pz.lit.scrub && pz.lit.banks ? 'machine_wake' : 'tool_switch'; },
  draw(s, pz) { const W = 40, X0 = 50, Y0 = 6, on = new Set(pz.lit.on), parts = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) { const v = pz.cells[r * SIZE + c], x = X0 + c * W, y = Y0 + r * W, cx = x + W / 2, cy = y + W / 2, hot = on.has(r + ',' + c);
      const arms = [[1, cx, y], [2, x + W, cy], [4, cx, y + W], [8, x, cy]].filter(a => v & a[0]).map(a => `<line x1="${cx}" y1="${cy}" x2="${a[1]}" y2="${a[2]}"/>`).join('');
      parts.push(`<g class="tile${hot ? ' hot' : ''}" data-act="${pz.done ? '' : 'pz'}" data-v="t${r}${c}"><rect x="${x + 1}" y="${y + 1}" width="${W - 2}" height="${W - 2}" rx="6"/>${arms}<circle cx="${cx}" cy="${cy}" r="3"/></g>`); }
    const lab = (txt, x, y, hot, a) => `<text x="${x}" y="${y}" class="${hot ? 'hot' : ''}" text-anchor="${a}">${txt}</text>`;
    return { svg: `<svg viewBox="0 0 300 172" role="img" aria-label="The junction board">${parts.join('')}${lab('reactor', X0 - 4, Y0 + 1.5 * W + 4, true, 'end')}${lab('scrubbers', X0 + 4 * W + 6, Y0 + 0.5 * W + 4, pz.lit.scrub, 'start')}${lab('banks', X0 + 4 * W + 6, Y0 + 3.5 * W + 4, pz.lit.banks, 'start')}</svg>`,
      stats: [['time', `${Math.max(0, pz.air)} minutes of suit air`], ['good', pz.lit.scrub ? 'Scrubbers fed' : 'Scrubbers dark'], ['sleepers', pz.lit.banks ? 'Banks fed' : 'Banks dark']], bar: [Math.max(0, pz.air), 18, pz.air <= 5],
      log: ['Tap a junction to turn it a quarter. Every turn is a minute of air.'] }; },
  bot(s, pz) { if (pz.lit.scrub && pz.lit.banks) return 'stop'; const wrong = pz.cells.map((v, i) => v !== pz.sol[i] ? i : -1).filter(i => i >= 0); const i = wrong.length && lcg(pz) < 0.8 ? wrong[Math.floor(lcg(pz) * wrong.length)] : Math.floor(lcg(pz) * SIZE * SIZE); return `t${Math.floor(i / SIZE)}${i % SIZE}`; },
};
puzzleOn('qs.air', 'restart', (s, c) => c.late ? null : LF.newRestart(s, c), {
  label: (s, c) => c.pz.lit.scrub && c.pz.lit.banks ? 'She is breathing, and the banks are warm' : c.pz.lit.scrub ? 'Air for the living. The banks go cold' : c.pz.lit.banks ? 'Heat for the banks. The bay goes without air' : 'Nothing caught',
  note: 'What the party could make of the junctions, with the air they had.', info: (s, c) => [c.pz.lit.scrub ? ['people', 'The ones in the bay'] : ['danger', 'The ones in the bay'], c.pz.lit.banks ? ['yield', 'The banks'] : ['danger', 'The banks']],
  out: { text: (s, c) => c.pz.lit.scrub && c.pz.lit.banks ? `The scrubbers catch first, then the bank heaters, and the board goes green from end to end. Her flight computer comes back slow, with most of a year missing. The ones from the bay come down on the next flight${c.up.length ? `, ${and(c.up)} with them` : ''}.`
      : c.pz.lit.scrub ? `The scrubbers catch and the crew deck fills with air, and the bay can open its door. The bank heaters stay dark. By the time anyone gets back to them a third of bank C has warmed past saving.`
      : c.pz.lit.banks ? `The bank heaters catch and the pods go green again. The scrubbers do not. The ones in the bay are in suits with nothing left in them, and the party cannot carry them all to the collar in time.`
      : `The party's own air runs down before anything catches, and they leave with nothing fed. The ones in the bay are brought out on the party's spare tanks, as many as the tanks will take.`,
    fx: (s, c) => { const L = c.pz.lit; if (L.scrub && L.banks) return { pop: c.alive, flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'restarted'); } };
      if (L.scrub) return { pop: c.alive, sleepers: -share(s, 0.3, 40), morale: -2, flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'rescued'); } };
      if (L.banks) return { morale: -5, flags: home, do: s2 => { lost(s2, c.upIds); LF.emit(s2, 'grief', SRC, 45, 260, 'the ones who woke aboard the ship died while the banks were saved'); LF.endThread(s2, ID, 'banks'); } };
      return { pop: Math.ceil(c.alive / 2), sleepers: -share(s, 0.3, 40), morale: -4, flags: home, do: s2 => { down(s2, c.upIds); LF.endThread(s2, ID, 'rescued'); } }; } } });

/* --- 4. which one (qs.two): three questions, and the one who remembers it wrong --- */
const OTHER_NAMES = ['Second Mercy', 'Far Landing', 'New Haven', 'Long Reach', 'Hope Ground', 'Last Harbour', 'Fair Return', 'Low Country'];
function facts(s, pz) {
  const out = [], w = s.world || {}, v = s.voyage || {}, pick = a => a[Math.floor(lcg(pz) * a.length)];
  if (w.star) out.push({ id: 'star', q: 'Which star did the ship come to?', a: w.star, f: w.star.replace(/(\d)(\d)$/, '$2$1') === w.star ? w.star + '-B' : w.star.replace(/(\d)(\d)$/, '$2$1') });
  if (w.sid) out.push({ id: 'name', q: 'What did the colony name the world?', a: w.sid, f: pick(OTHER_NAMES.filter(n => n !== w.sid)) });
  if (v.mode && LF.CROSSING && LF.CROSSING[v.mode]) { const alt = (v.deal || Object.keys(LF.CROSSING)).filter(k => k !== v.mode && LF.CROSSING[k]); if (alt.length) out.push({ id: 'cross', q: 'How was the watch kept on the crossing?', a: LF.CROSSING[v.mode].short, f: LF.CROSSING[pick(alt)].short }); }
  const inc = (v.incs || [])[0]; if (inc && LF.byId[inc] && typeof LF.byId[inc].title === 'string') { const alt = Object.keys(LF.byId).filter(k => /^voy\./.test(k) && k !== inc && k !== 'voy.plan' && typeof LF.byId[k].title === 'string'); out.push({ id: 'inc', q: 'What went wrong on the crossing?', a: LF.byId[inc].title.toLowerCase(), f: LF.byId[pick(alt)].title.toLowerCase() }); }
  const zs = (w.zones || []).map(z => z.name), si = s.memo && s.memo['landfall.site'] ? s.memo['landfall.site'].i : null; if (si !== null && zs[si] && zs.length > 1) out.push({ id: 'site', q: 'Where did the lander come down?', a: zs[si], f: pick(zs.filter((z, i) => i !== si)) });
  if (s.premise && LF.PREMISES && LF.PREMISES[s.premise]) { const alt = Object.keys(LF.PREMISES).filter(k => k !== s.premise); out.push({ id: 'premise', q: 'What was wrong with the world the ship was sent to?', a: LF.PREMISES[s.premise].name.toLowerCase(), f: LF.PREMISES[pick(alt)].name.toLowerCase() }); }
  return out;
}
LF.newWhich = function (s, c) {
  const pz = { kind: 'which', r: seed(s), turns: 0, done: false, asked: [], kept: null, real: c.real };
  const f = facts(s, pz); if (f.length < 3) return null;
  pz.wrong = f[Math.floor(lcg(pz) * f.length)].id;
  pz.qs = shuffle(pz, f.concat([{ id: 'harvest', q: 'What came of the first harvest?', ground: true }, { id: 'clinic', q: 'Who was in the clinic last month?', ground: true }]));
  return pz;
};
const answer = (pz, q, who) => q.ground ? (who === 'ground' ? 'answers at once, in detail' : 'was never on the ground for it') : `says ${(who !== pz.real && q.id === pz.wrong) ? q.f : q.a}`;
LF.PUZZLES.which = {
  moves(s, pz) { if (pz.done) return []; if (pz.asked.length < 3) return pz.qs.filter(q => !pz.asked.includes(q.id)).map(q => ({ id: 'q' + q.id, label: q.q, sub: `Question ${pz.asked.length + 1} of 3` }));
    return [{ id: 'keep:ground', label: 'Keep the one who came down', sub: 'The other goes to the lock' }, { id: 'keep:ship', label: 'Keep the one from the ship', sub: 'The other goes to the lock' }]; },
  move(s, pz, id) { if (pz.done) return null;
    if (/^keep:/.test(id)) { if (pz.asked.length < 3) return null; pz.kept = id.slice(5); pz.done = true; pz.turns++; return 'door'; }
    const q = pz.qs.find(x => 'q' + x.id === id); if (!q || pz.asked.includes(q.id) || pz.asked.length >= 3) return null; pz.asked.push(q.id); pz.turns++; return 'whisper'; },
  draw: (s, pz) => ({ log: pz.asked.length ? pz.asked.map(k => { const q = pz.qs.find(x => x.id === k); return `${q.q} The one who came down ${answer(pz, q, 'ground')}. The one from the ship ${answer(pz, q, 'ship')}.`; }) : ['Three questions, asked of both, in front of everyone who knew them before the ship. You know what happened. One of them may not.'] }),
  bot(s, pz) { if (pz.asked.length < 3) { const left = pz.qs.filter(q => !pz.asked.includes(q.id)); return 'q' + left[Math.floor(lcg(pz) * left.length)].id; }
    return 'keep:' + (pz.asked.includes(pz.wrong) ? pz.real : lcg(pz) < 0.5 ? 'ground' : 'ship'); },
};
puzzleOn('qs.two', 'which', (s, c) => LF.newWhich(s, c), {
  label: (s, c) => c.pz.kept === 'ground' ? 'The one who came down stays' : 'The one from the ship stays', note: 'The other is walked to the lock on the next flight.', info: [['yield', 'An end to it'], ['danger', 'The one walked to the lock']],
  out: { text: (s, c) => `${c.pz.kept === 'ground' ? `The ${c.first} who came down` : `The ${c.first} from the ship`} takes the seat back. The other goes up the ramp without being made to, and out of the lock, and does not look round.`,
    fx: (s, c) => ({ morale: 1, do: s2 => { const t = T(s2), p = byPid(s2, c.pid); t.kept = c.pz.kept; if (p) { if (c.pz.kept === 'ship') p.native = Math.max(0, (p.native || 0) - 20); if (t.truth.real !== c.pz.kept) { p.qsFalse = s2.day; LF.cue(s2, 'qs.tell', 120, 220); } } LF.endThread(s2, ID, 'one'); } }) } });

/* --- 5. door by door (qs.board, grown): it grows toward the warm banks, a compartment a turn --- */
const LINE = ['hold', 'bankC', 'bankB', 'spine'], LNAME = { hold: 'the hold', bankC: 'bank C', bankB: 'bank B', spine: 'the spine' };
LF.newDoors = function (s, c) {
  const n = s.sleepers, pz = { kind: 'doors', r: seed(s), turns: 0, done: false, end: null, grown: ['hold'], vented: [], seal: [0, 0, 0], party: 4, lost: 0, slept: { bankC: Math.round(n * 0.35), bankB: Math.round(n * 0.45) }, dead: { bankC: 0, bankB: 0 }, burned: false, stained: false, log: ['It is in the hold. The banks are the warmest places aboard, and it is growing toward them.'] };
  if ((c.mo || 0) >= 3) pz.grown.push('bankC');
  return pz;
};
const front = pz => Math.max(...pz.grown.map(r => LINE.indexOf(r)));
LF.PUZZLES.doors = {
  moves(s, pz) { if (pz.done) return []; const f = front(pz), out = [];
    if (pz.grown.length === 1 && pz.grown[0] === 'hold') out.push({ id: 'burn', label: 'Burn the hold out', sub: LF.aboard(s).length ? 'A tank of the lander\'s fuel, and every system still aboard burns with it' : 'A tank of the lander\'s fuel, and a match' });
    if (f < 3 && !pz.seal[f]) out.push({ id: 'seal' + f, label: `Seal the door between ${LNAME[LINE[f]]} and ${LNAME[LINE[f + 1]]}`, sub: 'It will hold for a while, not for ever' });
    for (const r of pz.grown) out.push({ id: 'vent:' + r, label: `Open ${LNAME[r]} to vacuum`, sub: pz.slept[r] ? `${cap1(num(pz.slept[r] - pz.dead[r]))} asleep in there freeze with it` : r === 'hold' ? 'It dies in there, and so does every crate of cargo that cannot take vacuum' : 'It dies in there, and nothing else does' });
    out.push({ id: 'cut', label: `Cut it back out of ${LNAME[LINE[f]]} by hand`, sub: 'The four of them with cutters and flares. It fights back' });
    return out; },
  move(s, pz, id) { if (pz.done) return null; const say = []; let snd = 'weld_seam'; pz.turns++;
    if (id === 'burn') { if (!(pz.grown.length === 1 && pz.grown[0] === 'hold')) return null; pz.grown = []; pz.burned = true; say.push('The hold is sealed, flooded with lander fuel and lit. It burns for six hours. Nothing in it comes out.'); snd = 'fire'; }
    else if (/^seal\d$/.test(id)) { const i = +id.slice(4); if (i !== front(pz) || pz.seal[i]) return null; pz.seal[i] = 2; say.push(`The door past ${LNAME[LINE[i]]} is sealed and welded. It pushes against it at once.`); }
    else if (/^vent:/.test(id)) { const r = id.slice(5); if (!pz.grown.includes(r)) return null; pz.grown = pz.grown.filter(x => x !== r); pz.vented.push(r); if (r === 'hold') pz.ventHold = true; if (pz.slept[r]) { pz.dead[r] = pz.slept[r]; pz.stained = true; say.push(`${cap1(LNAME[r])} is opened to vacuum. It comes apart like wet paper. So does the heat in every pod in there.`); } else say.push(`${cap1(LNAME[r])} is opened to vacuum, and what was in there comes apart.`); snd = 'hiss'; }
    else if (id === 'cut') { const f = front(pz); if (lcg(pz) < 0.6) { pz.grown = pz.grown.filter(x => x !== LINE[f]); say.push(`They cut it out of ${LNAME[LINE[f]]} in sections and push the sections out of the lock.`); } else { pz.party--; pz.lost++; say.push(`It takes one of the four in ${LNAME[LINE[f]]}, and the other three fall back.`); snd = 'creep'; } }
    else return null;
    // it grows: one compartment nearer the warmth, unless a door holds
    if (pz.grown.length) { const f = front(pz), nx = LINE[f + 1];
      if (f < 3 && !pz.vented.includes(nx)) { if (pz.seal[f]) { pz.seal[f]--; if (!pz.seal[f]) say.push(`The door past ${LNAME[LINE[f]]} gives.`); else say.push(`The door past ${LNAME[LINE[f]]} holds, and bulges.`); } else { pz.grown.push(nx); say.push(`It is in ${LNAME[nx]} now.`); } } }
    for (const r of ['bankC', 'bankB']) if (pz.grown.includes(r) && pz.slept[r] > pz.dead[r]) pz.dead[r] = Math.min(pz.slept[r], pz.dead[r] + Math.ceil(pz.slept[r] * 0.25));
    if (!pz.grown.length) { pz.done = true; pz.end = 'killed'; say.push('Nothing in her is growing.'); }
    else if (pz.grown.includes('spine') || pz.party <= 0) { pz.done = true; pz.end = 'broke'; say.push('It is in the spine, between the party and the banks, and they are out of ways to stop it. They go back to the collar.'); }
    pz.log = say; return snd; },
  draw(s, pz) { const X = [40, 110, 180, 250], parts = LINE.map((r, i) => `<g class="${pz.grown.includes(r) ? 'grown' : pz.vented.includes(r) ? 'vent' : ''}"><rect x="${X[i] - 28}" y="8" width="56" height="44" rx="8"/><text x="${X[i]}" y="68">${LNAME[r].replace(/^the /, '')}</text>${pz.slept[r] ? `<text x="${X[i]}" y="35" class="n">${pz.slept[r] - pz.dead[r]}</text>` : ''}</g>`).join('')
      + [0, 1, 2].map(i => `<line x1="${X[i] + 35}" y1="${pz.seal[i] ? 4 : 18}" x2="${X[i] + 35}" y2="${pz.seal[i] ? 56 : 42}" class="${pz.seal[i] ? 'shut' : ''}"/>`).join('');
    const lost = pz.dead.bankC + pz.dead.bankB;
    return { svg: `<svg viewBox="0 0 300 76" role="img" aria-label="The hold, the banks and the spine">${parts}</svg>`, stats: [['people', `${pz.party} of four`], ['sleepers', `${lost} asleep lost`]], log: pz.log }; },
  bot(s, pz) { const m = LF.PUZZLES.doors.moves(s, pz), ids = m.map(x => x.id); if (ids.includes('burn')) return 'burn'; const f = front(pz);
    if (!LINE[f].startsWith('bank') && ids.includes('vent:' + LINE[f])) return 'vent:' + LINE[f]; if (ids.includes('seal' + f) && lcg(pz) < 0.5) return 'seal' + f; return lcg(pz) < 0.5 ? 'cut' : ids[Math.floor(lcg(pz) * ids.length)]; },
};
puzzleOn('qs.board', 'doors', (s, c) => c.is === 'grown' ? LF.newDoors(s, c) : null, {
  label: (s, c) => c.pz.end === 'killed' ? 'Nothing in her is growing' : 'It is in the spine', note: (s, c) => c.pz.end === 'killed' ? 'What it cost to stop it.' : 'The party is back at the collar with it between them and the banks.',
  info: (s, c) => c.pz.end === 'killed' ? [['yield', 'It is dead']] : [['danger', 'It is still aboard']],
  out: { text: (s, c) => { const pz = c.pz, lost = pz.dead.bankC + pz.dead.bankB; return pz.end === 'killed' ? `The party goes through her with lamps afterwards, compartment by compartment, and finds nothing alive that should not be.${lost ? ` The cryo report that comes down after is a long list: ${num(lost)} names.` : ' Every pod in the banks reads green.'}${pz.burned && LF.aboard(s).length ? ' The hold is a black box, and nothing in it will ever work again.' : ''}` : `The party leaves her through the collar with ${num(pz.party)} of the four. The last report from the spine camera before they cut it is a wall that has started to move.`; },
    fx: (s, c) => { const pz = c.pz, lost = pz.dead.bankC + pz.dead.bankB, base = { sleepers: -Math.min(lost, s.sleepers) }; if (pz.lost) base.dead = pz.lost; if (pz.stained) base.stain = ['qs_vented', 2];
      if (pz.ventHold) { base.mat = -30; base.parts = -4; }
      if (pz.end === 'killed') return Object.assign(base, { machine: pz.burned ? { lander: -8 } : {}, flags: home, do: s2 => { if (pz.burned) { s2.fuel = Math.max(0, (s2.fuel || 0) - 1); for (const id of LF.aboard(s2)) { s2.machines[id].lost = true; s2.machines[id].hp = 0; } } down(s2, c.upIds); LF.endThread(s2, ID, 'doors'); } });
      return Object.assign(base, { morale: -6, do: s2 => { LF.emit(s2, 'fear', SRC, 50, 200, 'something is growing through the ship toward the banks'); LF.cue(s2, 'qs.board', 18, 30); } }); } } });

/* The two silence cards come with waiting (the first wait and the second), and the cards after come on a date set when
   the thread ends, as Standing Orders does it: neither is left to the deck. */
LF.qsWaited = (s, t) => { if (t.waited === 1 && s.used['qs.ridge'] === undefined) LF.cue(s, 'qs.ridge', 8, 16); else if (t.waited === 2 && s.sleepers > 20 && s.used['qs.kin'] === undefined) LF.cue(s, 'qs.kin', 8, 16); };
{ const end0 = LF.endThread; LF.endThread = function (s, id, end, chron) { const t = LF.T(s, id), was = t && !t.end; end0(s, id, end, chron);
  if (id !== ID || !was) return; const at = (cid, d) => s.sched.push({ id: cid, day: s.day + d });
  if (s.flags.qs_changed_down) at('qs.tune', LF.sri(s, 80, 200));
  if (end === 'keeper') at('qs.keeper', LF.sri(s, 120, 240));
  if (SALVAGE.includes(end)) at('qs.salvage', LF.sri(s, 90, 200));
  if (FELL.includes(end)) at('qs.fall', Math.max(3 * YEAR, 6 * YEAR - s.day) + LF.sri(s, 0, 60)); }; }
/* ======================= the rest ======================= */
LF.THREADS[ID].chap.banks = t => 'The ship blinked for help. The party got heat back to the banks, and the ones who had woken aboard died waiting for air.';
Object.assign(LF.TAGS, {
  'qs.count': ['cautious', 'severe closed', 'cautious', 'open', ''], 'qs.cups': ['cautious', 'bold', 'mercy'], 'qs.late': ['cautious', 'severe order', 'open'],
  'qs.blame': ['severe', 'severe', 'cautious', 'open'], 'qs.answer': ['open mercy', 'closed', 'bold'], 'qs.kettle': ['severe', 'cautious', 'open'], 'qs.collar': ['closed', 'cautious', 'open'],
  'qs.ridge': ['open', 'order', 'mercy'], 'qs.kin': ['bold open', 'cautious', 'severe order'], 'qs.nest': ['mercy', 'severe', 'severe', 'mercy open'],
  'qs.tune': ['severe closed', 'open', 'order'], 'qs.keeper': ['open', 'closed', 'severe'], 'qs.salvage': ['bold', 'cautious', 'cautious'], 'qs.fall': ['open', 'closed', 'closed'],
});
// Loaded after js/content-builds.js (so the signals room's option on qs.lights keeps its place), long after LF.DEEDS is made.
Object.assign(LF.DEEDS, {
  qs_lockout: 'the officer aboard the ship locked out of her systems from the ground',
  qs_confined: 'the officer aboard the ship shut in the infirmary on the word of the other',
  qs_hushed: 'the voice on the empty ship logged as a fault and kept from the colony',
  qs_guarded: 'the rifles put on the lander shed against the families of the sleepers',
  qs_hunted: 'the one who lived alone aboard the ship, chased down her lift shaft',
  qs_aired: 'the one who lived alone aboard the ship, put out of the hold with the air',
  qs_apart: 'the ones who hummed, shut in the store shed away from their families',
  qs_humlist: 'the list in the clinic of everyone who hummed',
  qs_nevers: 'the list sent up to the ship of the sleepers who would never wake',
});
})();

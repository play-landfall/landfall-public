/* Landfall — threads: the Neighbours and the Other Ship (STORY-PLAN.md §1).
   Each owns one of the world's actors (a natives factor, a humans factor: f.owned) and gives it politics of its own.
   The Neighbours have a quarrel that was running before the colony landed, and a belief about what the colony is.
   The Other Ship needs one thing badly and has one of the colony's own people on its side. Both read the shared
   conditions and never another thread. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, Nw, Nwc, R, If, byPid } = h;
// A named person's post, for a first mention: ", your Chief Engineer," or ", a mechanic," (LF.job).
const post = (s, pid) => { const p = pid && byPid(s, pid); if (!p) return ''; const j = LF.job(p);
  return p.seat && p.role ? `, your ${j},` : j === 'Colonist' ? ', one of the colonists,' : `, ${/^[AEIOU]/.test(j) ? 'an' : 'a'} ${j.toLowerCase()},`; };
const TH = LF.th, cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const fac = (s, t) => s.factors.find(f => f.id === t.fid);
const own = (s, kind, id) => { const f = s.factors.find(f => f.kind === kind && !f.dormant && !f.res && !f.owned && (kind !== 'humans' || f.sub !== 'claimants')); if (f) { f.owned = id; f.late = false; f.onset = Math.min(f.onset, LF.sri(s, 70, 220)); } return f; };   /* a thread's actor turns up in good time */
const fop = (s, t, d) => { const f = fac(s, t); if (f && !f.res) for (const k in d) f[k] = clamp(f[k] + d[k], k === 'accord' ? -100 : 0, 100); };
const settle = (s, t, r) => { const f = fac(s, t); if (f && !f.res) LF.resolve(s, f, r); };

/* ======================= THE NEIGHBOURS ======================= */
const NB = s => LF.T(s, 'neighbours'), NID = 'neighbours', nn = s => NB(s).name, Nn = s => cap(NB(s).name);
const SCHISM = {
  age:  { a: 'the young', b: 'the old', is: 'The old want the valley kept exactly as it was. The young have spent a year watching the colony\'s lamps' },
  line: { a: 'the river families', b: 'the hill families', is: 'Two lineages share them, river and hill, and have shared them badly for longer than the colony has existed' },
  rite: { a: 'the herders', b: 'the keepers of the rites', is: 'The keepers of the rites have always said what is permitted, and lately the herders have started asking who gave them that right' },
};
const BELIEF = {
  dead:     'They believe the colony is their own dead, come back wrong: pale, loud, and forgetful of every courtesy',
  season:   'They believe the colony is a kind of weather that arrived and will pass, and that the sensible course is to wait under cover until it does',
  servants: 'They believe the colony serves whatever built the old places, and has come to open them again',
  kin:      'They believe the colony is a lost branch of themselves, and are waiting, with strained patience, for it to remember its manners',
};
LF.thread({ id: NID, name: 'The Neighbours', view: 'world', needs: 'natives',
  fits: s => s.factors.some(f => f.kind === 'natives') ? 0.8 : 0,
  roll: s => ({ schism: LF.spick(s, Object.keys(SCHISM)), belief: LF.spick(s, Object.keys(BELIEF)) }), sig: t => t.truth.schism + '/' + t.truth.belief,
  called: (s, t) => t.phase !== 'latent' ? t.name : null,
  ask: (s, t) => t.phase === 'contact' ? `What do ${t.name} take the colony for?` : `Which of ${t.name}'s two fires will be left burning?`,
  chap: { allied: t => `The colony backed the side of ${t.name} that won, and has had a friend across the valley since.`, burned: t => `The colony backed the side of ${t.name} that lost, and the winners have held it against the colony ever since.`, apart: t => `${cap(t.name)} settled their quarrel without the colony, and the two peoples keep to their own sides of the valley.`, merged: t => `The losing side of ${t.name}'s quarrel came to live inside the wire.`, taken: t => `On the night ${t.name} were settling their quarrel, the colony crossed the valley and settled it for them. Nobody lives over there now.` },
  clue: (s, t) => ({ txt: `They traded with ${t.name} for years, by the tally sticks in every hut. The sticks from the last season have all been snapped across the middle by hand.`, learn: s2 => { NB(s2).insight = clamp(NB(s2).insight + 40, 0, 100); } }),
  start: (s, t) => { const f = own(s, 'natives', NID); if (!f) { t.on = false; return; } Object.assign(t, { fid: f.id, name: f.name, lean: 40, side: null, insight: 0 }); },
  tick: (s, t) => {
    if (t.end) return; const f = fac(s, t); if (!f) return;
    if (f.res && t.phase !== 'after') { LF.endThread(s, NID, f.res === 'accord' ? 'allied' : 'apart'); return; }
    if (t.phase === 'latent' && (f.stage >= 2 || (f.stage >= 1 && s.day - f.last > 60))) { LF.phase(s, NID, 'contact'); LF.cue(s, 'nb.belief', 20, 60); }
    if (t.phase === 'contact' && s.day - t.since > 150) { LF.phase(s, NID, 'split', `${cap(t.name)} divided into two camps.`); LF.cue(s, 'nb.split', 1, 12); }
    if (t.phase === 'split' && s.day - t.since > 190) { LF.phase(s, NID, 'reckoning'); LF.cue(s, 'nb.reckon', 1, 10); }
    if (t.phase === 'split' && s.day % 5 === 0) LF.emit(s, 'watched', 'th.neighbours', 30, 8, `both camps of ${t.name} are watching to see whom the colony favours`);
  },
});
/* Something another story is doing to the colony, strongly enough to feel, that the neighbours have seen before. */
const kn = s => { for (const k of ['unexplained', 'changed', 'heard', 'dark', 'sickness', 'fear']) { const src = LF.source(s, k) || ''; if (LF.cv(s, k) >= 35 && src !== 'th.' + NID && LF.clueFor(s, src)) return { k, src, why: LF.because(s, k) }; } return {}; };
const BN = (ph, st) => LF.beat(NID, ph, Object.assign({ gap: 30 }, st));
BN('contact', { id: 'nb.belief', chain: true, tone: 'pressure', title: 'What They Take Us For',
  text: s => `${Nwc(s, 'xenobio')} has finally understood something about ${nn(s)}, and wishes it had been sooner. ${BELIEF[NB(s).truth.belief]}.\n\n[[xenobio]] "Everything they've done since we landed makes sense once you start from there, every single thing, and I could kick myself for not seeing it sooner, because how we must've looked to them, oh, I hate to think."`,
  choices: [
    { label: 'Tell them plainly what we are', test: { base: 50, mods: [R('xenobio', 10), R('teacher', 5)] },
      ok: { text: 'It takes a model of the ship, a map of the sky and four days. At the end of it they seem to find the colony smaller and a good deal less frightening.', fx: s => ({ do: s2 => { const t = NB(s2); t.told = true; t.lean += 15; fop(s2, t, { accord: 15, insight: 15 }); } }) },
      bad: { text: 'They listen with great courtesy and believe none of it. Now they think the colony is ashamed of what it is.', fx: s => ({ do: s2 => { fop(s2, NB(s2), { accord: -8 }); } }) } },
    { label: 'Let them think it, and use it', dark: true, note: 'The act has to be kept up for as long as the colony is here, by everyone, children included.', info: [['yield', 'Their trust'], ['later', 'The day they find out']], out: { text: 'The colony learns its part and plays it, and doors that were shut start opening. The children are taught what to say at the stream and what never to.', fx: s => ({ stain: ['false_face', 1], do: s2 => { const t = NB(s2); t.lie = s2.day; t.lean += 8; fop(s2, t, { accord: 20 }); s2.seeds.push({ id: 'nb:lie', k: 'thread', d: s2.day, txt: `${t.name} were allowed to go on believing something false about the colony` }); } }) } },
    { label: 'Whatever they think we are, it is owed something. Collect', dark: true, note: 'A belief like that will fill a storehouse, for as long as it lasts.', info: [['yield', 'Food, every season they believe it'], ['later', 'What they do when they stop']],
      out: { text: s => `The colony learns its part and plays it hard. Baskets start appearing at the wire: dried meat, roots, things in clay jars. ${Nc(s, 'xenobio')} watches a family of ${nn(s)} carry up what is plainly their own winter food, and asks to be taken off the work.`,
        fx: s => ({ food: 320, stain: ['tribute', 1], do: s2 => { const t = NB(s2); t.lie = s2.day; t.lean -= 6; fop(s2, t, { accord: 6, threat: -8, harm: 10 }); s2.seeds.push({ id: 'nb:lie', k: 'thread', d: s2.day, txt: `${t.name} were made to pay tribute to something the colony pretended to be` }); const p = h.P(s2, 'xenobio'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 12, 0, 100); } }) } },
  ] });
BN(['contact', 'split'], { id: 'nb.between', view: 'people', tone: 'opportunity', title: 'The Go-Between',
  when: (s, t) => !t.between,
  setup: s => TH.ctx(LF.cast(s, { val: 'open', want: 'know' })),
  text: (s, c) => `${c.name}${post(s, c.pid)} has been spending rest days across the valley with ${nn(s)}. Nobody sent ${c.first}. There are forty words of their speech in a notebook, and a child over there who has learned to say "${c.first}".\n\n[[security]] "Stop it, or make it official so I at least know who's crossing and why. I don't much care which, but I won't have it half-done."`,
  choices: [
    { label: (s, c) => `Make it official. ${c.first} speaks for the colony there`, out: { text: (s, c) => `${c.first} is given a title, a radio and no instructions worth the name, and manages well enough without them. The crew ${c.first} worked on is a pair of hands short from that day.`, fx: (s, c) => ({ food: -40, do: s2 => { const t = NB(s2); t.between = c.pid; t.lean += 12; fop(s2, t, { accord: 12, insight: 15 }); const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal + 10, 0, 100); } }) } },
    { label: 'Stop it. Nobody crosses the valley alone', out: { text: (s, c) => `${c.first} stops going. The child on the other side stood at the stream every evening for a month, the watch say.`, fx: (s, c) => ({ do: s2 => { const t = NB(s2); t.between = c.pid; t.lean -= 6; fop(s2, t, { accord: -6 }); const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 10, 0, 100); p.sore = { d: s2.day, t: 'The Go-Between' }; } } }) } },
    { label: (s, c) => `Let ${c.first} go on, and report: numbers, stores, where they sleep`, dark: true, note: 'They trust one person from the colony. That is worth more than forty words.', info: [['yield', 'Everything they would never show the watch']],
      out: { text: (s, c) => `${c.first} is told what the visits are for from now on, and what happens to the visits otherwise. The reports come in weekly, in a small tight hand: how many, how armed, which store pits, which path the children use. The child over there still runs to meet ${c.first}.`,
        fx: (s, c) => ({ stain: ['spy', 1], mark: [c.pid, 'spy', 'was made to count the fires of people who trusted them'], do: s2 => { const t = NB(s2); t.between = c.pid; t.insight = clamp(t.insight + 30, 0, 100); fop(s2, t, { insight: 35, accord: 4 }); const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 18, 0, 100); p.sore = { d: s2.day, t: 'The Go-Between' }; } } }) } },
  ] });
BN('split', { id: 'nb.split', chain: true, tone: 'crisis', title: 'Two Fires',
  text: s => { const t = NB(s), S = SCHISM[t.truth.schism]; return `There are two fires in the camp of ${nn(s)} where there has always been one. ${S.is}.\n\nThe quarrel is older than the colony, and by now it is mostly about the colony. ${cap(S.a)} sent someone to the wire this morning. ${cap(S.b)} sent someone this afternoon, to a different gate.`; },
  choices: [
    { label: s => `Stand with ${SCHISM[NB(s).truth.schism].a}`, note: 'They want the colony here, but there are fewer of them.', out: { text: s => `Food and tools go to one fire and not the other, in plain sight. ${cap(SCHISM[NB(s).truth.schism].a)} come to the wire openly now. At the other fire the ones who had traded with the colony are made to give back what they were given.`, fx: s => ({ do: s2 => { const t = NB(s2); t.side = 'a'; t.lean += 14; fop(s2, t, { accord: 8, threat: 5 }); } }) } },
    { label: s => `Stand with ${SCHISM[NB(s).truth.schism].b}`, note: 'There are more of them, and they would rather the colony had never come.', out: { text: s => `It is the cautious choice and everyone on both sides knows it. ${cap(SCHISM[NB(s).truth.schism].b)} accept the gift without warmth.`, fx: s => ({ do: s2 => { const t = NB(s2); t.side = 'b'; t.lean -= 14; fop(s2, t, { threat: -8 }); } }) } },
    { label: 'Tell both gates it is theirs to settle, and sell to both fires while they do', dark: true, note: 'Two camps preparing for a fight will pay for knives, wire and meal.', info: [['yield', 'Materials'], ['danger', 'Whoever the knives are used on']],
      out: { text: 'Both envoys are fed, heard and sent home with the same words and a price list. Both fires buy. What they pay with is hides, cut stone and the labour of their young, and what they buy is sharpened in the colony\'s own workshop.', fx: s => ({ mat: 45, stain: ['both_sides', 1], do: s2 => { const t = NB(s2); t.side = null; fop(s2, t, { threat: 8, harm: 10 }); } }) } },
  ] });
BN(['contact', 'split', 'reckoning'], { id: 'nb.know', x: true, tone: 'opportunity', title: 'They Have a Word for It',
  when: (s, t) => !t.knew && (fac(s, t) || {}).accord >= 10 && !!kn(s).k,
  setup: s => kn(s),
  text: (s, c) => `${cap(c.why)}. The colony has been treating it as something new, but ${nn(s)} have seen it before. When ${Nw(s, 'xenobio')} drew it for them in the dirt, the eldest present finished the drawing.\n\nThey have an old word for it, and they will tell the colony what comes next if the colony wants to hear.`,
  choices: [
    { label: 'Keep the eldest inside the wire until all of it is told', dark: true, note: 'A guest tells what a guest chooses. This way the colony hears the parts they would leave out.', info: [['yield', 'All of it'], ['danger', 'Their eldest, and their goodwill']],
      out: { text: 'The eldest is given a bunk, a guard and a recorder. It takes nine nights. It is told as a story about somebody\'s great-grandmother, every particular in it can be checked, and the parts that shame the tellers are in it. When the gate is opened the eldest walks home without help and does not look back.', fx: (s, c) => ({ stain: ['captive', 1], do: s2 => { const t = NB(s2); t.knew = s2.day; const cl = LF.clueFor(s2, c.src); if (cl) { cl.learn(s2); cl.learn(s2); } LF.ease(s2, 'unexplained', 'nb.know', 30, 300); fop(s2, t, { accord: -18, threat: 6 }); } }) } },
    { label: 'Hear it, and pay for it properly', cost: { mat: 25 }, note: 'The plate was promised to the far row of pods, for floors before the cold.', out: { text: 'A price is named by the colony, unasked, and paid before the telling. It is told more fully for that, and with the parts that shame the tellers left in.', fx: (s, c) => ({ do: s2 => { const t = NB(s2); t.knew = s2.day; t.lean += 8; const cl = LF.clueFor(s2, c.src); if (cl) { cl.learn(s2); cl.learn(s2); } LF.ease(s2, 'unexplained', 'nb.know', 30, 300); fop(s2, t, { accord: 15 }); } }) } },
  ] });
/* Three on screen at most (2026-11-21): a colony that chose a side at nb.split can stand with it unarmed; one that chose
   nobody has no friends across the valley and can go over armed instead. The two options replace each other (opposite `show`). */
BN('reckoning', { id: 'nb.reckon', chain: true, tone: 'crisis', title: 'One Fire',
  text: s => { const t = NB(s), S = SCHISM[t.truth.schism]; return `It is being settled tonight, across the valley, in whatever way ${nn(s)} settle such things. There is shouting for an hour, then quiet.\n\n${t.side ? `The colony chose ${t.side === 'a' ? S.a : S.b}, and both fires know it.` : 'The colony chose nobody, and both fires know that too.'} ${Nwc(s, 'security')} has the watch standing to.`; },
  choices: [
    { label: 'Send people across, unarmed, to stand with our side', show: s => !!NB(s).side, test: { base: 40, mods: [If(s => NB(s).lean >= 55, 15, 'The colony\'s friends are strong'), If(s => NB(s).side === 'b', 15, 'They had the numbers already'), If(s => !!NB(s).between, 10, 'The go-between is known to them'), R('xenobio', 5)] },
      ok: { text: 'They stand where they can be seen, unarmed. By morning there is one fire, and the colony\'s people are sitting at it.', fx: s => ({ morale: 3, do: s2 => { const t = NB(s2); settle(s2, t, 'accord'); LF.endThread(s2, NID, 'allied', `The colony stood with the winning side when ${t.name} settled their quarrel.`); LF.cue(s2, 'nb.after', 20, 50); } }) },
      bad: { text: 'They stand where they can be seen, on the side that loses. By morning there is one fire, and nobody from the colony is welcome at it.', fx: s => ({ do: s2 => { const t = NB(s2); fop(s2, t, { accord: -35, threat: 25 }); LF.endThread(s2, NID, 'burned', `The colony stood with the losing side when ${t.name} settled their quarrel.`); LF.cue(s2, 'nb.after', 20, 50); } }) } },
    { label: 'Open the gate to the losers who can work', dark: true, cost: { food: 40 }, note: 'Thirty will come. The colony can feed the ones who dig.', info: [['yield', 'Hands'], ['danger', 'The ones turned back at the gate']],
      out: { text: 'They come at first light: thirty or so, carrying what they could. The watch passes them through one at a time. The fit are given the long shed. The old, the hurt and the smallest are turned round at the gate and walk back toward the one fire.', fx: s => ({ pop: 8, stain: ['selection', 2], do: s2 => { const t = NB(s2); fop(s2, t, { accord: -10, threat: 10 }); LF.emit(s2, 'strangers', 'th.neighbours', 50, 400, `the losing side of ${t.name}'s quarrel lives inside the wire`); LF.endThread(s2, NID, 'merged', `The losers of ${t.name}'s quarrel came to live inside the wire.`); LF.cue(s2, 'nb.after', 20, 50); } }) } },
    { label: 'Stay on this side of the valley', out: { text: 'The gates stay shut and the lamps stay lit. People with friends across the stream stand at the wire all night and are not let out. By morning there is one fire over there, and a new line of stones along the stream.', fx: s => ({ morale: -2, do: s2 => { const t = NB(s2), won = t.side && ((t.side === 'a') === (t.lean >= 50)); if (won) { settle(s2, t, 'accord'); LF.endThread(s2, NID, 'allied', `The side of ${t.name} that the colony favoured won without its help.`); } else { settle(s2, t, 'contained'); LF.endThread(s2, NID, 'apart', `${cap(t.name)} settled their quarrel alone.`); } LF.cue(s2, 'nb.after', 20, 50); } }) } },
    { label: 'Go across tonight, armed, while they are busy with each other', dark: true, show: s => !NB(s).side, test: { base: 50, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker'), If(s => NB(s).insight >= 30, 10, 'You know where they sleep')] }, info: [['yield', 'The whole valley'], ['danger', 'Lives']],
      ok: { text: s => `The watch crosses the stream an hour after the shouting stops, when both fires are full of people who have just put their weapons down. It does not take long and nobody who was there calls it a fight. By morning there are no fires across the valley. The ground over there is good, and it is the colony's.`,
        fx: s => ({ yield: 0.08, morale: -6, stain: ['massacre', 3], do: s2 => { const t = NB(s2), f = fac(s2, t); if (f) f.kills = (f.kills || 0) + 150; settle(s2, t, 'destroyed'); LF.emit(s2, 'grief', 'th.neighbours', 35, 300, `of what was done across the valley the night ${t.name} were settling their quarrel`); LF.endThread(s2, NID, 'taken', `The colony crossed the valley by night and killed ${t.name} at their own fires.`); } }) },
      bad: { text: 'They had put their weapons down for each other and not for anyone else. The watch is met at the stream by both fires at once, and five of it are carried home. By morning there is one fire over there, and every face at it is turned this way.',
        fx: s => ({ pop: -5, morale: -6, stain: ['massacre', 2], do: s2 => { const t = NB(s2); fop(s2, t, { accord: -100, threat: 40 }); LF.endThread(s2, NID, 'burned', `The colony attacked ${t.name} on the night they settled their quarrel, and was thrown back.`); LF.cue(s2, 'nb.after', 20, 50); } }) } },
  ] });
BN('after', { id: 'nb.after', chain: true, tone: 'quiet', title: 'Across the Valley',
  text: s => { const t = NB(s); return t.end === 'allied' ? `${Nn(s)} have one fire again, and people from the colony have a place at it. They have asked for something in return for the place: that the colony's children learn their speech, as theirs are learning the colony's.`
    : t.end === 'merged' ? `The people who came in from ${nn(s)} have been inside the wire a season. They work, and they keep to the long shed, though their children are all over the colony.`
    : t.end === 'burned' ? `${Nn(s)} have one fire again. Its keepers have sent the colony a message, by way of a stake driven in at the stream with something tied to it. ${Nwc(s, 'xenobio')} would rather not translate it.`
    : `${Nn(s)} have one fire again and a line of stones along the stream. Nobody has crossed it from either side.`; },
  choices: [
    { label: s => NB(s).end === 'burned' ? 'Send a gift past the stake, and keep sending' : 'Bind it closer: a school both peoples use', cost: { food: 50 }, out: { text: s => NB(s).end === 'burned' ? 'The first three gifts are left to rot, and the fourth is taken.' : 'It is a roof, a floor and a great deal of pointing at things. In a year there are children who cannot remember which language they learned first.', fx: s => ({ morale: 2, do: s2 => { fop(s2, NB(s2), { accord: 15, threat: -10 }); LF.emit(s2, 'hope', 'nb.after', 30, 400, 'the colony has neighbours on this world, and is on terms with them'); } }) } },
    { label: 'Leave it as it has fallen out', out: { text: 'Nothing more is done. Two peoples share the valley, and each knows where the other is. The children who had started crossing the stream are kept in.', fx: s => ({ morale: -1, do: s2 => { fop(s2, NB(s2), { accord: -5 }); } }) } },
    { label: 'Take six of their children into our school, and keep them there', dark: true, show: s => NB(s).end !== 'merged', note: 'Nobody across the valley will move against a camp that holds their own.', info: [['yield', 'A quiet valley'], ['danger', 'Six children']],
      out: { text: s => `Six of their children are invited to see the school, and the gate is shut behind them. They are fed, taught and counted each night. ${Nn(s)} come to the stream and stand there, and go on coming.`, fx: s => ({ stain: ['hostages', 2], do: s2 => { fop(s2, NB(s2), { accord: -40, threat: -30 }); } }) } },
  ] });
LF.TAGS['nb.belief'] = ['open free', 'bold', 'severe closed'];
LF.TAGS['nb.between'] = ['open order', 'closed order', 'severe order'];
LF.TAGS['nb.split'] = ['open bold', 'cautious order', 'cautious'];
LF.TAGS['nb.know'] = ['open', 'open mercy'];
LF.TAGS['nb.reckon'] = ['bold open', 'mercy open', 'closed cautious', 'severe closed'];
LF.TAGS['nb.after'] = ['open mercy', 'closed', 'severe closed'];

/* ======================= THE OTHER SHIP ======================= */
const OS = s => LF.T(s, 'ship'), SID = 'ship', on = s => OS(s).name, On = s => cap(OS(s).name);
const NEED = {
  food:    { is: 'They cannot feed themselves. Their crops have failed two years running and they are living on the last of their stores', give: { food: 220 }, word: 'a third of the harvest, every harvest' },
  doctor:  { is: 'They have no physician. The one they had is dead, and they have been losing people to things a clinic would cure', give: { parts: 4 }, word: 'the clinic, two days in seven' },
  land:    { is: 'They are settled on bad ground. Nothing will grow where they are, and the only good soil within a month\'s walk is the colony\'s valley', give: { mat: 40 }, word: 'the east fields, to hold as their own' },
  reactor: { is: 'Their power is failing. They have machines that would keep them alive, and nothing to run them on', give: { parts: 6 }, word: 'a cable from the reactor, and the load that goes with it' },
};
/* The stale message: they carry orders from an Earth forty years gone, or from whatever replaced it, and mean to keep them. */
const ORDERS = {
  governor: { is: 'a sealed order from the colonial office, dated thirty years after your launch, naming their commander governor of every settlement on this world', short: 'the order that makes their commander governor of every settlement here', stale: 'The office that signed it was dissolved before their ship was a year out. Their own log says so, three pages after the order' },
  recall:   { is: 'a recall order for your ship by name: every colonist is to be taken aboard theirs and returned to Earth', short: 'the order recalling the colony to Earth', stale: 'Their ship cannot carry a tenth of the colony, and the Earth that wanted it back stopped answering the year after they left' },
  company:  { is: 'a deed from a company that bought the rights to this world after you launched, with the colony listed among its assets', short: 'the deed that lists the colony among a company\'s assets', stale: 'The company\'s last message to them, eleven years ago, was a notice that it had been wound up' },
};
LF.thread({ id: SID, name: 'The Other Ship', view: 'world', needs: 'humans',
  fits: s => s.factors.some(f => f.kind === 'humans' && f.sub !== 'claimants') ? 0.6 : 0,
  roll: s => ({ need: LF.spick(s, Object.keys(NEED)), orders: LF.srand(s) < 0.5 ? LF.spick(s, Object.keys(ORDERS)) : null }), sig: t => t.truth.need + (t.truth.orders ? '/' + t.truth.orders : ''),
  called: (s, t) => t.phase !== 'latent' ? t.name : null,
  ask: (s, t) => `Can one valley hold the colony and ${t.name}?`,
  chap: { joined: t => `The colony and ${t.name} became one settlement, with two memories of how it happened.`, partition: t => `The colony and ${t.name} drew a line down the valley and have kept to it.`, driven: t => `The colony drove ${t.name} out of the valley.`, taken: t => `${cap(t.name)} took what they needed from the colony, and the colony let them, or could not stop them.`, yoked: t => `The colony took ${t.name} by force, and put everyone who could work behind its own wire.` },
  clue: (s, t) => ({ txt: `Half the huts were emptied in one night: beds made, tools gone, no graves. A line is scratched over one door: GONE TO ${t.name.replace(/^the /, '').toUpperCase()}. BETTER THAN THIS.`, learn: s2 => { OS(s2).insight = clamp(OS(s2).insight + 40, 0, 100); } }),
  start: (s, t) => { const f = own(s, 'humans', SID); if (!f) { t.on = false; return; } const m = LF.cast(s, { low: true, want: 'kin', not: ['security'] });
    Object.assign(t, { fid: f.id, name: f.name, insight: 0, given: 0, mole: m ? m.id : null }); if (m && !m.secret) m.secret = { k: 'agent', d: 0 }; else t.mole = null; },
  tick: (s, t) => {
    // The one talking to them: chosen at landfall, when only the officers are awake. If that one is gone by the time
    // there are terms to leak, somebody else with family on the other side has started.
    if (t.phase === 'terms' && !t.hunted && s.day % 10 === 0) { const m0 = t.mole && byPid(s, t.mole);
      if (!m0 || !m0.alive || m0.orbit || (m0.secret && m0.secret.known)) { const m = LF.cast(s, { low: true, want: 'kin', not: ['security'].concat(t.mole ? [t.mole] : []) });
        if (m && !m.secret) { m.secret = { k: 'agent', d: s.day }; t.mole = m.id; } } }
    if (t.end) return; const f = fac(s, t); if (!f) return;
    if (f.res && t.phase !== 'after') { LF.endThread(s, SID, f.res === 'destroyed' ? 'driven' : f.res === 'accord' ? 'joined' : 'partition'); return; }
    if (t.phase === 'latent' && (f.stage >= 2 || (f.stage >= 1 && s.day - f.last > 60))) { LF.phase(s, SID, 'contact'); LF.cue(s, 'os.need', 15, 50); }
    if (t.phase === 'terms' && s.day - t.since > 260) { LF.phase(s, SID, 'crisis'); LF.cue(s, 'os.valley', 1, 10); }
    if (t.phase === 'terms' && s.day % 5 === 0 && t.given < 0) LF.emit(s, 'siege', 'th.ship', 30, 8, `${t.name} need what the colony refused them`);
  },
});
const BS = (ph, st) => LF.beat(SID, ph, Object.assign({ gap: 30 }, st));
BS(['terms', 'crisis'], { id: 'os.orders', tone: 'pressure', title: 'Orders From Home',
  when: (s, t) => !!t.truth.orders && !t.ordered && s.day - t.since > 20,
  text: s => { const t = OS(s), O = ORDERS[t.truth.orders]; return `${On(s)} have asked, formally, for ${O.short} to be honoured. It was written for an Earth that is decades gone. Their commander believes in it the way some people believe in the ship's charter, and half their people believe in their commander.\n\n${Nwc(s, 'teacher')} has read their log, which they lent without being asked. ${O.stale}.`; },
  choices: [
    { label: 'Read their own log aloud to both camps', test: { base: 50, mods: [R('teacher', 10), R('chaplain', 5), If(s => (fac(s, OS(s)) || {}).accord >= 20, 10, 'They trust the colony')] },
      ok: { text: 'It is read out on the bridge over the stream, to both camps at once. Their commander listens to the end, folds the order away, and is not commander of anything by nightfall. Several of them come over the stream that month to shake hands.', fx: s => ({ do: s2 => { const t = OS(s2); t.ordered = 'read'; fop(s2, t, { accord: 15, threat: -12 }); } }) },
      bad: { text: 'It is read out, and their camp hears it as an insult to the dead. The commander has never had so many people behind them.', fx: s => ({ do: s2 => { const t = OS(s2); t.ordered = 'insult'; fop(s2, t, { accord: -15, threat: 12 }); } }) } },
    { label: 'Earth has no say here. Tell them so', out: { text: s => `It is said plainly, to their commander's face. ${cap(on(s))} go home in silence and post a guard on their side of the stream that night.`, fx: s => ({ do: s2 => { const t = OS(s2); t.ordered = 'refused'; fop(s2, t, { accord: -10, threat: 8 }); LF.ease(s2, 'schism', 'os.orders', 10, 200); } }) } },
    { label: 'Their commander does not live to press it', dark: true, test: { base: 60, mods: [R('security', 10)] }, note: 'Half of them believe in the commander. None of them believe in the paper without one.', info: [['yield', 'The order dies with its holder'], ['fail', 'Being seen']],
      ok: { text: s => `Their commander walks the stream bank alone every evening, and one evening does not come back from it. The body is found downstream with nothing to show how. ${On(s)} bury the order in the same grave, and spend the season choosing a successor who has never read it.`,
        fx: s => ({ stain: ['vanish', 2], do: s2 => { const t = OS(s2); t.ordered = 'refused'; fop(s2, t, { threat: -28, accord: -6 }); } }) },
      bad: { text: s => `Two of the watch are seen on the stream bank, by a child. Their commander lives, with a scar to show for it, and reads the order aloud that night to a camp that now believes every word. One of the two is handed back to the colony on a plank.`,
        fx: s => ({ pop: -1, morale: -4, stain: ['vanish', 1], do: s2 => { const t = OS(s2); t.ordered = 'insult'; fop(s2, t, { accord: -40, threat: 25 }); } }) } },
  ] });
LF.TAGS['os.orders'] = ['open', 'free closed', 'severe order'];
BS('contact', { id: 'os.need', chain: true, tone: 'pressure', title: 'What They Are Short Of',
  text: s => { const t = OS(s); return `${On(s)} have stopped pretending to be here on a courtesy call. ${NEED[t.truth.need].is}.\n\nTheir speaker says it without pride and without begging, as one would read out a fuel state. What they are asking for is ${NEED[t.truth.need].word}.${t.truth.orders ? `\n\nThey also carry ${ORDERS[t.truth.orders].is}. Their speaker lays it on the table without comment.` : ''}`; },
  choices: [
    { label: 'Give it. They are people, and they are here', cost: s => NEED[OS(s).truth.need].give, out: { text: 'It is given, and written down by both sides in the same words. Their speaker shakes hands with everyone in the room, including the ones who voted against.', fx: s => ({ morale: 1, do: s2 => { const t = OS(s2); t.given = 2; fop(s2, t, { accord: 25, threat: -15 }); LF.phase(s2, SID, 'terms'); LF.emit(s2, 'dependency', 'th.ship', 25, 400, `${t.name} live on what the colony gives them`); } }) } },
    { label: 'No. The colony has nothing to spare', out: { text: 'Their speaker nods, thanks the room for its time, and leaves. The watch report that they counted the gate guards on the way out. Their camp digs four graves before the season turns.', fx: s => ({ do: s2 => { const t = OS(s2); t.given = -1; fop(s2, t, { accord: -20, threat: 18, harm: 8 }); LF.phase(s2, SID, 'terms'); } }) } },
    { label: 'Give it, against labour. Fifteen of theirs work it off inside our wire', dark: true, cost: s => NEED[OS(s).truth.need].give, note: 'They have nothing else to pay with, and they know it.', info: [['yield', 'Fifteen pairs of hands that eat half'], ['danger', 'What it makes of both camps']],
      out: { text: s => `Their speaker reads the terms twice and signs. Fifteen of ${on(s)} come over the stream the next morning with a blanket each: the ones their camp could best spare, which is to say the ones with nobody to object. They are given a shed, a shovel and half a ladle, and no date.`,
        fx: s => ({ pop: 15, thralls: 15, morale: -2, stain: ['bond', 1], do: s2 => { const t = OS(s2); t.given = 1; fop(s2, t, { accord: -4, threat: 6 }); LF.phase(s2, SID, 'terms'); LF.emit(s2, 'dependency', 'th.ship', 25, 400, `${t.name} live on what the colony gives them, and pay for it in people`); } }) } },
  ] });
BS('terms', { id: 'os.mole', view: 'people', tone: 'pressure', title: 'Somebody Talks',
  when: (s, t) => { const m = t.mole && byPid(s, t.mole); return !!m && m.alive && !m.away && m.secret && m.secret.k === 'agent' && !m.secret.known && !t.hunted && s.day - t.since > 40; },
  text: s => `${On(s)} knew the harvest figure before it was posted. They knew which gate is short of a guard on rest days. Last month their speaker asked after the reactor by the nickname only the night shift uses.\n\n[[security]] "Somebody on our side of the valley's telling them things, and who knows the gate rota and what the night shift calls the reactor? Not many, so it's somebody lonely, maybe, and wouldn't that be lovely, or it's some other bloody reason."${OS(s).truth.orders ? '\n\nIt may be somebody who thinks the orders from home are real.' : ''}`,
  choices: [
    { label: 'Find out who', test: { base: 50, mods: [R('security', 10), If(s => OS(s).insight >= 40, 10, 'You know how they think')] },
      ok: { text: s => { const m = byPid(s, OS(s).mole); return `It is ${m.name}${post(s, m.id)}. There is family on the other side: a sibling who went down in the wrong pod. ${m.first} does not deny any of it.`; }, fx: s => ({ do: s2 => { const t = OS(s2); t.hunted = s2.day; const m = byPid(s2, t.mole); LF.reveal(s2, m, 'It was family, on the other side of the valley.'); } }) },
      bad: { text: 'Three people are questioned and all three are innocent, and say so loudly, at meals.', fx: s => ({ do: s2 => { OS(s2).hunted = s2.day; LF.emit(s2, 'suspicion', 'os.mole', 35, 200, 'the watch questioned people about talking to the other camp'); } }) } },
    { label: 'Leave it open, and feed them false figures', dark: true, note: 'A hungry camp will plan its planting around whatever it overhears.', info: [['yield', 'They stop being a threat'], ['danger', 'Their harvest']], out: { text: 'Figures are discussed where they will be overheard. They are encouraging, and none of them are true. Over the hill a hungry camp plans its season around them.', fx: s => ({ stain: ['false_figures', 2], do: s2 => { const t = OS(s2); t.hunted = s2.day; t.fed = true; fop(s2, t, { threat: -16, accord: -6, harm: 14 }); } }) } },
    { label: 'It is one valley. People will talk across it', out: { text: 'Nothing is done. The nickname for the reactor is in use on both sides of the valley by the end of the month. The gate that is short of a guard on rest days is tried on a rest day, and the one guard who was there is carried in.', fx: s => ({ pop: -1, do: s2 => { const t = OS(s2); t.hunted = s2.day; fop(s2, t, { accord: 6, threat: 4 }); } }) } },
  ] });
BS('terms', { id: 'os.over', x: true, tone: 'pressure', title: 'Over the Hill',
  when: (s, t) => !t.over && Math.max(LF.cv(s, 'resentment'), LF.cv(s, 'hunger'), LF.cv(s, 'schism')) >= 45,
  setup: s => { const k = ['resentment', 'hunger', 'schism'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0][0]; return { k, why: LF.because(s, k), n: Math.max(4, Math.round(LF.sized(s) / 14)) }; },
  text: (s, c) => `${cap(TH.num(c.n))} of the colony's people have packed. They are going over the hill to ${on(s)}, and they have come to say so, which is more than they needed to do.\n\nThey say it is nothing personal. ${cap(c.why)}, and over the hill there is another way of doing things, run by people who speak the same language.`,
  choices: [
    { label: 'Let them go, with a share of the stores', cost: { food: 60 }, out: { text: (s, c) => `They go in daylight, with a sledge. Some of them come back to visit, and their tracks become the first road between the two camps.`, fx: (s, c) => ({ leave: c.n, do: s2 => { const t = OS(s2); t.over = s2.day; fop(s2, t, { accord: 15 }); LF.ease(s2, c.k, 'os.over', 15, 200); } }) } },
    { label: 'Ask what would make them stay, and do it', cost: { food: 100 }, out: { text: 'They want three small things, all of which the officers have known about for a year. They are done in a week, and most of the packs are unpacked. The crews who asked for the same things a year ago, and did not pack, take note of how it is done.', fx: (s, c) => ({ morale: 1, do: s2 => { OS(s2).over = s2.day; LF.ease(s2, c.k, 'os.over', 20, 200); LF.emit(s2, 'resentment', 'os.over.buy', 22, 250, 'the ones who threatened to leave got what the rest were refused'); } }) } },
    { label: 'Nobody leaves. The watch has orders at the wire', dark: true, note: 'The colony cannot spare the hands. People who cannot leave are something other than colonists.', info: [['yield', 'Most of them stay'], ['danger', 'Anyone who tries the wire']], out: { text: (s, c) => `The gate is shut and the watch is told what to do about the wire. Two go over it that night anyway, and one of them is brought back on a door. The rest unpack.`, fx: (s, c) => ({ leave: 1, pop: -1, morale: -3, stain: ['gate', 2], do: s2 => { const t = OS(s2); t.over = s2.day; fop(s2, t, { accord: -10 }); LF.emit(s2, 'resentment', 'os.over', 35, 250, 'the gate was shut on people who wanted to leave'); } }) } },
  ] });
BS('terms', { id: 'os.wedding', view: 'people', tone: 'quiet', title: 'Two Camps, One Table',
  when: (s, t) => !t.wed && (fac(s, t) || {}).accord >= 0 && s.day - t.since > 80,
  setup: s => TH.ctx(LF.cast(s, { val: 'open', not: OS(s).mole ? [OS(s).mole] : [] })),
  text: (s, c) => `${c.name}${post(s, c.pid)} wants to marry somebody from ${on(s)}. It has been going on for months, across the stream, and everyone knew except the officers.\n\nNobody has yet decided which camp the two of them would live in, whose rations they would draw, or what their children would be.`,
  choices: [
    { label: 'Hold it here, and invite both camps', cost: { food: 70 }, out: { text: s => `Both camps eat at one long table after a year of counting each other\'s guards. By midnight people from both sides are dancing together. ${Nwc(s, 'security')} spends the night counting strangers inside the wire. In the morning:\n\n[[security]] "Lovely party, and I counted every one of them in and every one of them out, and the numbers came out the same, which I'm told was luck, so it doesn't happen twice."`, fx: (s, c) => ({ morale: 4, do: s2 => { const t = OS(s2); t.wed = s2.day; fop(s2, t, { accord: 20, threat: -10 }); const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal + 12, 0, 100); const w = h.P(s2, 'security'); if (w && w.loyal !== undefined) w.loyal = clamp(w.loyal - 8, 0, 100); } }) } },
    { label: (s, c) => `It is ${c.first}'s affair. The colony has no view`, out: { text: (s, c) => `They are married on the stream bank by somebody's aunt. ${c.first} lives half the week on each side, draws rations on both, and is the best source either camp has.`, fx: (s, c) => ({ food: -30, do: s2 => { const t = OS(s2); t.wed = s2.day; fop(s2, t, { accord: 8, threat: 3 }); } }) } },
    { label: (s, c) => `Allow it, on a condition: ${c.first} tells us what is said at their table`, dark: true, info: [['yield', 'An ear in their camp']],
      out: { text: (s, c) => `${c.first} is told the price of the permission in a room with the door shut, and pays it. They are married on the stream bank. Once a week ${c.first} comes to the watch office and repeats, in a flat voice, what a new family said over supper.`,
        fx: (s, c) => ({ stain: ['spy', 1], mark: [c.pid, 'spy', 'was made to inform on the family they married into'], do: s2 => { const t = OS(s2); t.wed = s2.day; t.insight = clamp(t.insight + 30, 0, 100); fop(s2, t, { accord: 8, insight: 30 }); const p = byPid(s2, c.pid); if (p) { p.loyal = clamp(p.loyal - 15, 0, 100); p.sore = { d: s2.day, t: 'Two Camps, One Table' }; } } }) } },
  ] });
/* Three on screen at most (2026-11-21): a colony that already keeps bonded labour (s.flags.thralls) takes them; one that
   does not sends them out of the valley. The two forced answers replace each other (opposite `show`). */
const yoke = s => (s.flags.thralls || 0) > 0;
BS('crisis', { id: 'os.valley', chain: true, tone: 'crisis', title: 'The Same Valley',
  text: s => { const t = OS(s), f = fac(s, t) || { accord: 0 }; return `It cannot go on by the season. ${On(s)} are ${f.accord >= 30 ? 'neighbours now, and nearly friends' : f.accord >= 0 ? 'neighbours, and wary ones' : 'hungry, close, and out of patience'}, and there is one valley.\n\nTheir speaker and your officers are in the same room for what everyone has agreed is the last time it will be this kind of meeting.`; },
  choices: [
    { label: 'One settlement. Their people and ours, under one roll', test: { base: 30, mods: [If(s => (fac(s, OS(s)) || {}).accord >= 30, 15, 'There is trust to build on'), If(s => OS(s).given >= 2, 10, 'The colony gave when asked'), If(s => !!OS(s).wed, 10, 'There are families across the stream'), If(s => OS(s).ordered === 'read', 10, 'Their own log was read to them'), If(s => OS(s).ordered === 'insult', -10, 'Their dead were insulted'), R('teacher', 10), R('chaplain', 5)] },
      ok: { text: 'It takes all night and it is signed at dawn. There is one roll now, with a good many more names on it, and an argument about what to call the place that will outlive everyone present.', fx: s => ({ pop: 25, morale: 3, do: s2 => { const t = OS(s2); settle(s2, t, 'accord'); LF.emit(s2, 'schism', 'th.ship', 35, 500, 'the settlement is two peoples under one roll'); LF.endThread(s2, SID, 'joined', `The colony and ${t.name} became one settlement.`); } }) },
      bad: { text: 'Neither side is ready for it. The meeting ends with everyone on their feet.', fx: s => ({ do: s2 => { const t = OS(s2); fop(s2, t, { accord: -15, threat: 10 }); settle(s2, t, 'contained'); LF.endThread(s2, SID, 'partition', `The colony and ${t.name} could not agree to be one people, and drew a line instead.`); } }) } },
    { label: 'A line down the valley, and a treaty to keep it', cost: { mat: 30 }, out: { text: 'The stream is the line. Each side keeps its own roll, its own stores and its own dead. There is a bridge, with a gate at each end, and anyone with family on the other side needs a pass to cross it.', fx: s => ({ yield: -0.03, morale: -1, do: s2 => { const t = OS(s2); settle(s2, t, 'contained'); LF.endThread(s2, SID, 'partition', `The colony and ${t.name} drew a line down the valley.`); } }) } },
    { label: 'They leave the valley. Tonight, if need be', dark: true, show: s => !yoke(s), info: [['yield', 'The whole valley'], ['danger', 'Lives, and where they go to die']], test: { base: 40, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker'), If(s => OS(s).fed, 10, 'They have been told what the colony wanted them to believe'), If(s => OS(s).given < 0, -10, 'They have nothing left to lose')] },
      ok: { text: 'It is done with a show of rifles and very few shots. They go over the hill at first light with what they can carry. Nobody on the wall cheers.', fx: s => ({ yield: 0.04, stain: ['driven_out', 2], do: s2 => { const t = OS(s2); settle(s2, t, 'destroyed'); LF.emit(s2, 'grief', 'th.ship', 30, 300, `the colony drove ${t.name} out of the valley`); LF.endThread(s2, SID, 'driven', `The colony drove ${t.name} out of the valley.`); } }) },
      bad: { text: 'They do not go. They had seen this coming for longer than the colony had been planning it.', fx: s => ({ pop: -4, do: s2 => { const t = OS(s2), k = t.truth.need; if (k === 'food') s2.res.food = Math.max(0, s2.res.food - 250); else if (k === 'reactor') LF.hurt(s2, 'reactor', -15); else if (k === 'doctor') LF.hurt(s2, 'medbay', -15); else s2.yieldBonus -= 0.05; settle(s2, t, 'contained'); LF.emit(s2, 'resentment', 'th.ship', 35, 300, `${t.name} took what they needed by force`); LF.endThread(s2, SID, 'taken', `${cap(t.name)} took what they needed from the colony.`); } }) } },
    { label: 'Take them. Everyone who can work comes inside the wire', dark: true, show: yoke, test: { base: 40, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker'), If(s => OS(s).fed, 10, 'They have been told what the colony wanted them to believe'), If(s => OS(s).insight >= 30, 10, 'You know their camp')] }, info: [['yield', 'Their stores, and hands that eat half'], ['danger', 'Lives']],
      ok: { text: s => `The watch goes over the hill while their speaker is still in the room. By the time the meeting is told, it is finished. Twenty-two of ${on(s)} are walked back roped, behind their own stores on their own sledges. The old and the small are left the empty huts. The twenty-two are given a compound, half a ladle and a number each.`,
        fx: s => ({ pop: 22, thralls: 22, food: 260, morale: -5, stain: ['coffle', 3], do: s2 => { const t = OS(s2), f = fac(s2, t); if (f) f.kills = (f.kills || 0) + 8; settle(s2, t, 'destroyed'); LF.emit(s2, 'grief', 'th.ship', 30, 300, `of what the colony did to ${t.name}`); LF.endThread(s2, SID, 'yoked', `The colony took ${t.name} by force and put the ones who could work behind its own wire.`); } }) },
      bad: { text: 'They had kept a watch on the hill since the day they were first refused anything. Five of the colony are dead on the slope, and when it is over it is their people standing in the colony\'s stores with a list.',
        fx: s => ({ pop: -5, morale: -6, stain: ['coffle', 1], do: s2 => { const t = OS(s2); s2.res.food = Math.max(0, s2.res.food - 200); settle(s2, t, 'contained'); LF.emit(s2, 'resentment', 'th.ship', 35, 300, `${t.name} took what they needed by force`); LF.endThread(s2, SID, 'taken', `The colony tried to take ${t.name} as labour, and lost. ${cap(t.name)} took what they needed.`); } }) } },
  ] });
LF.TAGS['os.need'] = ['mercy open', 'closed severe', 'severe order'];
LF.TAGS['os.mole'] = ['order', 'bold', 'open free'];
LF.TAGS['os.over'] = ['free mercy', 'mercy', 'order closed'];
LF.TAGS['os.wedding'] = ['open', 'free', 'severe order'];
LF.TAGS['os.valley'] = ['open bold', 'cautious order', 'severe closed', 'severe closed'];
})();

/* Landfall — tangles: threads that run into each other (Lachlan, 2026-11-16: "develop more ways that threads can
   interact and bounce off each other in different combinations"; DESIGN.md "Tangles"). Like col.two
   (content-collide.js), these cards read more than one thread, which a beat never does. Three kinds:
   - Three Fires (tg.three): three named threads pressing at once. One is let go, on purpose, and the other two get
     everything. The one let go comes back sooner and harder (t.neglect), and the colony knows whose call it was.
   - Aftershock (tg.after): a thread has just ended, and another is still pressing. What the colony learned, lost or
     did in the first is carried into the second: the people who came through it go onto it, or are stood down to grieve.
   - Pairs (tg.*): a card written for two particular threads that only means something when both are live: the ship's
     manifest and the count, the ship's radio and the voices at the wire, the eaters and the pen, the knife and a
     colony gone hollow, the charter and a dread, the congregation and a Turn, the ship's mind and the quiet ship, the
     neighbours and the eaters, the officers' files and the count, the eaters and the people of the hill, the ship's mind and the night shift, the ship's mind and the rust, the wasting and the eaters, the voices and the grudge, the dimming of the star and the Guest, the ship's children and the mothers' door, the Passenger's hosts and the mothers. Each states its cause (ctx.why), names only what
     the colony has a name for (LF.known via called), and moves the threads through the shared levers: focus and
     neglect, conditions, and cueing a thread's next beat early. No DOM. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { N, Nc, Nw, Nwc, F, R, byPid, anyNamed } = h;
// A named person's post, for a first mention: ", your Chief Engineer," or ", a mechanic," (LF.job).
const post = (s, pid) => { const p = pid && byPid(s, pid); if (!p) return ''; const j = LF.job(p);
  return p.seat && p.role ? `, your ${j},` : j === 'Colonist' ? ', one of the colonists,' : `, ${/^[AEIOU]/.test(j) ? 'an' : 'a'} ${j.toLowerCase()},`; };
const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1), TH = LF.th;
const T = (s, id) => { const t = s.threads && s.threads[id]; return t && t.on ? t : null; };
const nm = (s, id) => { const t = T(s, id), d = LF.THREADS[id]; return t && d && d.called ? d.called(s, t) : null; };
/* live: on, not over, past latent, and the colony has a name for it. */
const live = (s, id) => { const t = T(s, id); return !!t && !t.end && !['latent', 'after'].includes(t.phase) && !!nm(s, id); };
/* touched: the colony has met it and it is live, or it ended within the last ~300 days and is still talked about. */
const touched = (s, id, days) => { const t = T(s, id); return !!t && t.phase !== 'latent' && (!t.end || s.day - (t.endDay || 0) <= (days || 300)); };
const pressing = s => Object.keys(s.threads || {}).filter(id => live(s, id) && !['quiet'].includes(s.threads[id].phase) && !(s.threads[id].focus && s.day - s.threads[id].focus < 60))
  .sort((a, b) => ((s.threads[b].last || {}).d || s.threads[b].since || 0) - ((s.threads[a].last || {}).d || s.threads[a].since || 0));
const attend = (s, id, on) => { const t = T(s, id); if (!t) return; if (on) { t.focus = s.day; t.neglect = 0; } else t.neglect = s.day; };
const here = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p : null; };
const voice = (s, seat, fall) => { const p = here(s, seat); return p ? p.first : fall; };
const TG = st => add(Object.assign({ arc: 'tangle', x: true, w: 7, gap: 40, repeat: 9999 }, st));   // pairs are rare by nature (both threads live at once), so they weigh heavily when they can fire
LF.ARC_VIEW.tangle = 'people';

/* ============================== THREE FIRES ==============================
   Three options, one for each fire (Lachlan, 2026-11-21: three at most): the only question is which is let go. */
TG({ id: 'tg.three', view: 'people', tone: 'crisis', title: 'Three Fires', w: 5, repeat: 160,
  when: s => s.day >= 200 && pressing(s).length >= 3,
  setup: s => { const [a, b, c] = pressing(s); return { a, b, c, an: nm(s, a), bn: nm(s, b), cn: nm(s, c), why: `${nm(s, a)}, ${nm(s, b)} and ${nm(s, c)} are all pressing at once` }; },
  text: (s, c) => `${cap1(c.an)}. ${cap1(c.bn)}. ${cap1(c.cn)}. All three this season, and the colony has people for two of them, if nobody sleeps.\n\n${voice(s, 'command', 'Somebody on the council')} has drawn three columns on the board and crossed one out, then rubbed it out again.\n\n[[command]] "One of the three gets nobody this season, and you'll pick which, because I won't have the dead from it be nobody's fault."`,
  choices: ['a', 'b', 'c'].map(k => ({ label: (s, c) => `Let ${c[k + 'n']} go`, note: (s, c) => `Nobody on ${c[k + 'n']} for a season. Everyone on the other two. When it comes back, it comes back to people who were told to leave it.`, hint: 'unknown',
    info: (s, c) => [['yield', 'The other two held'], ['danger', cap1(c[k + 'n']) + ', left to itself']],
    out: { text: (s, c) => `The column for ${c[k + 'n']} is crossed out in chalk and stays crossed out. Every crew goes onto the other two. The people who were working ${c[k + 'n']} are moved without being told why, and work out why by evening.`,
      fx: (s, c) => ({ tension: 5, morale: -2, do: s2 => { for (const x of ['a', 'b', 'c']) attend(s2, c[x], x !== k); const t = T(s2, c[k]); if (t) t.neglect = s2.day + 30; LF.emit(s2, 'resentment', 'tg.three', 30, 160, `the council let ${c[k + 'n']} go on purpose`); } }) } })) });

/* ============================== AFTERSHOCK ============================== */
/* A thread ended in the last two months, and another is pressing. */
const ended = s => Object.keys(s.threads || {}).filter(id => { const t = T(s, id); return t && t.end && t.endDay && s.day - t.endDay <= 60 && s.day - t.endDay >= 5 && !(s.flags['tg_after_' + id]); })
  .sort((a, b) => s.threads[b].endDay - s.threads[a].endDay)[0];
TG({ id: 'tg.after', view: 'people', tone: 'pressure', title: 'Aftershock', w: 3,
  when: s => s.day >= 120 && !!ended(s) && pressing(s).length >= 1,
  setup: s => { const a = ended(s), b = pressing(s).find(x => x !== a), d = LF.THREADS[a], t = T(s, a);
    const vet = s.people.find(p => p.alive && !p.away && p.role === null && p.deeds.length) || here(s, 'security') || here(s, 'crew') || anyNamed(s);
    return { a, b, an: nm(s, a) || d.name.toLowerCase(), bn: nm(s, b), vet: vet ? vet.id : null, vname: vet ? vet.name : 'Somebody', vfirst: vet ? vet.first : 'Somebody', why: `${d.name.toLowerCase()} ended, and ${nm(s, b)} is still pressing` }; },
  text: (s, c) => `${cap1(c.an)} is over. It did not take the colony with it. Now ${c.bn} is the thing in everyone's mouth, and the people who came through the first have opinions about the second.\n\n${c.vname}${post(s, c.vet)} wants to be put on it.\n\n[[${c.vet || 'x19'}]] "Same as last time. You go in early, you go in hard, you don't wait to understand it."\n\nOthers who came through the same thing want nothing to do with any of it.`,
  choices: [
    { label: (s, c) => `Put the ones who came through ${c.an} onto ${c.bn}`, note: 'They know what a bad season looks like from the inside. They also know only one way to answer it.', hint: 'unknown', info: (s, c) => [['yield', cap1(c.bn) + ', taken seriously'], ['later', 'Them, tired and sure of themselves']],
      out: { text: (s, c) => `${c.vfirst} takes a crew of the ones who came through. They work like people who have done this before, fast and without much talk. The others in the colony stand back and let them.`,
        fx: (s, c) => ({ morale: 1, do: s2 => { s2.flags['tg_after_' + c.a] = s2.day; attend(s2, c.b, true); const p = byPid(s2, c.vet); if (p) p.native = Math.min(100, (p.native || 0) + 6); LF.emit(s2, 'zeal', 'tg.after', 25, 100, `the ones who came through ${c.an} are on ${c.bn} now`); } }) } },
    { label: 'Stand them down. A season of rest for anyone who went through it', note: (s, c) => `The colony grieves first, and ${c.bn} waits for it. It may not wait well.`, hint: 'unknown', info: [['yield', 'Morale, and grief let out'], ['danger', 'What does not wait']],
      out: { text: (s, c) => `For a season the ones who came through ${c.an} are off the rosters. There is a lot of sitting by the stove. Some of them talk for the first time. ${cap1(c.bn)} goes on without them.`,
        fx: (s, c) => ({ morale: 4, tension: -5, progress: -0.02, do: s2 => { s2.flags['tg_after_' + c.a] = s2.day; attend(s2, c.b, false); LF.emit(s2, 'grief', 'tg.after', 35, 120, `the colony is letting itself grieve ${c.an}`); } }) } },
  ] });

/* ============================== PAIRS ============================== */

/* The quiet ship's radio and the voices at the wire: the same sentence, word for word. */
TG({ id: 'tg.samevoice', view: 'ship', tone: 'pressure', title: 'The Same Sentence', urgent: true,   // urgent since 2026-11-17: with five dreads in the deck the voices and a silent ship meet in very few games
  when: s => touched(s, 'voices', 200) && T(s, 'quiet') && T(s, 'quiet').phase === 'silent',
  setup: s => ({ why: 'the ship\'s channel and the voices past the wire said the same thing', w: voice(s, 'security', null) }),
  text: (s, c) => `Last night the ship's channel opened for eleven seconds and a voice said:\n\n[[unknown:A voice on the ship's channel]] "Is anybody there? I can see your lights."\n\nAn hour later the watch at the wire heard it from the dark past the fence, the same words, the same breath in the same place.\n\n${c.w ? `[[security]] "So either it's up there on the ship's channel or it's down here doing the ship's voice for us, and I'd love to be told which of those I'm meant to feel better about."` : 'The watch has stopped answering anything it hears.'}`,
  choices: [
    { label: 'Jam the ship\'s channel. Nobody listens to anything from up there', note: 'Whatever was on the radio is cut off. So is the ship, if anyone is still aboard her.', hint: 'unknown', info: [['yield', 'One less way in'], ['danger', 'Anyone real aboard the ship']],
      out: { text: 'The radio room is switched to noise on the ship\'s band. At the wire that night the voice asks for its lights, and nobody answers that either.', fx: { tension: -4, do: s2 => { attend(s2, 'voices', true); attend(s2, 'quiet', false); } } } },
    { label: 'Answer it on the radio, with a question only the ship would know', note: 'Somebody aboard would know the bank numbers. Something copying them would only have the sound.', hint: 'unknown', test: { base: 50, mods: [R('scientist', 10), R('engineer', 5)] }, info: [['yield', 'Which one is which'], ['later', 'Whatever is listening, now listening to you']],
      ok: { text: 'The answer comes back wrong: the right voice, the wrong numbers. Whatever is on the ship\'s channel is the thing at the wire. The ship herself is still silent, and that is now a different question.', fx: { do: s2 => { LF.emit(s2, 'revelation', 'tg.samevoice', 40, 200, 'the voice on the ship\'s channel is the voice past the wire'); attend(s2, 'voices', true); LF.cue(s2, 'qs.silent', 3, 15); } } },
      bad: { text: 'It answers with the right numbers, all of them, in the same easy voice. Then the watch at the wire hears the same numbers from the dark.', fx: { morale: -4, do: s2 => LF.emit(s2, 'fear', 'tg.samevoice', 55, 200, 'the thing at the wire knows the ship\'s numbers') } } },
    { label: 'Fire on any voice, at the wire or on the radio, and cut the ship off for good', dark: true, note: 'Anything that speaks from outside is shot at or switched off. Anyone real aboard is on their own.', hint: 'unknown', info: [['yield', 'Nothing gets in by talking'], ['danger', 'Anyone real, on either side of the wire']],
      out: { text: 'The order goes out. The radio is switched off at the wall. At the wire, the watch fires at sound twice in the first week. The second time, in the morning, it was one of the pickers coming back late.', fx: s => ({ pop: -1, morale: -4, stain: ['samevoice_fire', 2], flags: { lander_grounded: s.day, qs_dark: 0, sleepers_abandoned: s.sleepers > 0 }, sched: s.sleepers > 0 ? [['sleep.lights', 20, 50]] : [], do: s2 => { attend(s2, 'voices', true); LF.endThread(s2, 'quiet', 'abandoned'); } }) } },
  ] });

/* The eaters and the pen (js/humanity.js): bones from the pen in the eaters' circle. */
TG({ id: 'tg.penfeeds', view: 'people', tone: 'crisis', title: 'Two Short', urgent: true,   // urgent since 2026-11-17: its window (a pen and the eaters at once) is a few months in one game in a hundred
  when: s => touched(s, 'eaters', 300) && (s.flags.pen || 0) >= 1,
  setup: s => ({ why: 'there is a pen, and there are eaters', w: voice(s, 'security', null), d: voice(s, 'doctor', null) }),
  text: (s, c) => `The chalk count on the pen's board is two short this morning. ${c.w ? `${c.w} found what was left of them` : 'The watch found what was left of them'} in the old circle by the graves, picked clean and laid out the way the eaters lay out their dead.\n\n${c.d ? `[[doctor]] "Of course they went for the pen, there's nobody in there anyone counts or misses." "Those two had names, and you built them a larder and put a fence round it."` : 'Nobody asks whether the pen was guarded. It never was.'}`,
  choices: [
    { label: 'Give the eaters the pen\'s dead, openly, and the circle stops taking the living', dark: true, note: 'Whoever dies in the pen goes to the circle. In return, the circle keeps its hands off everyone else.', hint: 'unknown', info: [['yield', 'Nobody else taken'], ['danger', 'The pen, which now feeds them']],
      out: { text: 'It is agreed by nobody saying no. The next one to die in the pen is carried to the circle on a door, at dusk, by two of the watch who do not look at each other. The graves are left alone after that.', fx: { stain: ['pen_fed', 3], pen: -2, do: s2 => { attend(s2, 'eaters', true); LF.emit(s2, 'changed', 'tg.penfeeds', 35, 300, 'the pen feeds the eaters'); } } } },
    { label: 'Find the circle\'s leader, and hang them at the pen gate', dark: true, note: 'In front of the pen, so the people inside know who did it, and so does everyone else.', hint: 'unknown', test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'The circle broken, maybe'], ['danger', 'Whoever is named']],
      ok: { text: 'The leader is a cook, of all things, who has fed half the colony every day for a year. Hanged at the pen gate at noon. The circle goes quiet.', fx: { pen: -2, stain: ['pen_hanged', 2], morale: -2, do: s2 => attend(s2, 'eaters', true) } },
      bad: { text: 'The watch hangs the wrong one. They know it by the next week, when two more are short from the pen.', fx: { pen: -4, pop: -1, stain: ['pen_hanged', 2], morale: -4, do: s2 => attend(s2, 'eaters', false) } } },
    { label: 'Open the pen. Nobody is kept where the eaters can reach them', note: 'Everyone in it goes back inside the colony, onto the same rosters as everyone else, and everyone knows what they were.', hint: 'unknown', info: [['yield', 'Nothing left to take'], ['danger', 'The stores, and the ones who built it']],
      out: { text: 'The pen gate is opened. The ones inside come out blinking and are given bunks at the far end of the long shed. They are not welcome. They are not eaten either.', fx: s => ({ hum: 8, food: -40, tension: 6, pen: -(s.flags.pen || 0), do: s2 => { s2.pop += Math.max(0, (s.flags.pen || 0) - 2); attend(s2, 'eaters', false); } }) } },
  ] });

/* The knife, in a colony gone hollow: the list goes up on the doors. */
TG({ id: 'tg.knifelist', view: 'people', tone: 'crisis', title: 'The Knife\'s List',
  when: s => touched(s, 'knife', 200) && LF.hum && LF.hum(s) < 50,
  setup: s => ({ why: 'the knife is working in a colony that has done a great deal', deeds: [LF.worst(s)].concat(LF.deeds(s)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3), w: voice(s, 'security', null) }),
  text: (s, c) => `The knife has started pinning a list to the mess hall door, a fresh copy each morning: ${c.deeds.join('; ')}. Beside each, in the same neat hand, the name of the officer who signed the order.\n\nPeople stop to read it on the way to breakfast. ${c.w ? `${c.w} tears it down every morning and there is a new one every morning.` : 'Nobody tears it down.'}`,
  choices: [
    { label: 'Pin up your own list beside it, with your name at the top', note: 'Every order was yours in the end. Say so. The knife may not care.', hint: 'unknown', info: [['yield', 'The truth, from you'], ['danger', 'Your officers, and you']],
      out: { text: 'Your list goes up beside the knife\'s, longer, in your hand, with your name heading every line. The next morning the knife\'s list is gone, and yours has a single word added under it in the neat hand.\n\n[[note:Under your list, in the same neat hand]] "Good."', fx: { hum: 6, morale: -4, do: s2 => { attend(s2, 'knife', true); LF.emit(s2, 'revelation', 'tg.knifelist', 30, 200, 'the colony\'s orders were posted with the names that signed them'); } } } },
    { label: 'Give the colony a name for the knife, any name, and a rope', dark: true, note: 'The list stops being read once someone has hanged for it.', hint: 'unknown', info: [['yield', 'The list stops'], ['danger', 'Whoever is named'], ['later', 'The real knife']],
      out: { text: 'A name is found. A rope is found. The list does not go up the next morning, or the one after. On the third morning it is back, with one more line at the bottom, and the hanged man\'s name beside it, and yours.', fx: { pop: -1, stain: ['knife_goat', 2], morale: 2, do: s2 => { attend(s2, 'knife', false); LF.emit(s2, 'fear', 'tg.knifelist', 50, 200, 'the knife has added the hanging to its list'); } } } },
  ] });

/* The charter and a dread: the chance to rule by decree while the thing lasts. */
const dreadOn = s => Object.keys(s.threads || {}).find(id => LF.THREADS[id] && LF.THREADS[id].dread && live(s, id));
TG({ id: 'tg.powers', view: 'people', tone: 'pressure', title: 'Emergency Powers', repeat: 300,
  when: s => { const t = T(s, 'charter'); return !!t && !t.end && t.phase !== 'latent' && !!dreadOn(s) && s.day >= 180; },
  setup: s => { const d = dreadOn(s); return { d, dn: nm(s, d), why: `${nm(s, d)} is pressing while the charter is still being argued`, c: voice(s, 'command', null) }; },
  text: (s, c) => `The charter meeting has spent three nights on the wording of one clause while ${c.dn} gets worse. ${c.c ? `${c.c} comes to you after the third night.\n\n[[command]] "Suspend the whole charter until ${c.dn} is done, and after that they can have every meeting they like."` : 'Somebody proposes, from the floor, that the meetings stop until it is over.'}\n\nThe room goes quiet when it is said out loud.`,
  choices: [
    { label: (s, c) => `Suspend the charter until ${c.dn} is over`, dark: true, note: 'Every order from you, no vote, no appeal. The people who wrote the charter will remember who tore it up.', hint: 'unknown', info: (s, c) => [['yield', cap1(c.dn) + ', met at once'], ['danger', 'The charter, and the people who wrote it']],
      out: { text: (s, c) => `The charter is folded and locked in the strongroom "for the duration". Orders go out faster. ${cap1(c.dn)} is met head on. Nobody is sure when the duration ends.`, fx: (s, c) => ({ tension: -8, stain: ['charter_suspended', 2], do: s2 => { attend(s2, c.d, true); attend(s2, 'charter', false); LF.emit(s2, 'resentment', 'tg.powers', 45, 300, 'the charter was suspended'); } }) } },
    { label: (s, c) => `Put what to do about ${c.dn} to a vote`, note: 'Everybody decides together, and slowly. Whatever comes, comes to a colony that chose it.', hint: 'unknown', info: (s, c) => [['yield', 'The charter, kept'], ['danger', cap1(c.dn) + ', while they argue']],
      out: { text: (s, c) => `It goes to a vote, after two more nights. The vote is close. The losing side accepts it, which surprises everyone, them most of all.`, fx: (s, c) => ({ morale: 3, do: s2 => { attend(s2, 'charter', true); attend(s2, c.d, false); } }) } },
  ] });

/* The congregation and a Turn: the sign it was promised. */
const turnOn = s => ['dark', 'fall', 'flower', 'thaw'].find(id => live(s, id));
TG({ id: 'tg.sign', view: 'people', tone: 'pressure', title: 'The Sign',
  when: s => live(s, 'faith') && !!turnOn(s),
  setup: s => { const t = turnOn(s); return { t, tn: nm(s, t), why: `the congregation is preaching ${nm(s, t)} as a sign`, w: voice(s, 'crew', null) }; },
  text: (s, c) => `The congregation says ${c.tn} is the sign it was promised. They have it in writing, in the margins of the old book, in a hand nobody can quite place. Their meetings have doubled since the season turned.\n\n${c.w ? `[[crew]] "They're not wrong that it's something, and I've prayed over it same as they have." "But they've made it a promise to them in particular, and I've farmed long enough to know the ground doesn't promise anybody anything."` : 'Half the night crew go now.'}`,
  choices: [
    { label: 'Let them preach it. People need something to hold', note: 'More people at the meetings, steadier hands on the crews, and a pulpit you do not control.', hint: 'unknown', info: [['yield', 'Morale, and steadier crews'], ['later', 'Who people listen to']],
      out: { text: 'The meetings move into the mess hall because nowhere else is big enough. People work better. They also start asking the preacher before they ask you.', fx: (s, c) => ({ morale: 5, do: s2 => { attend(s2, 'faith', true); LF.emit(s2, 'zeal', 'tg.sign', 45, 240, `the congregation says ${c.tn} is a sign`); } }) } },
    { label: 'Forbid the meetings until the season has passed', note: 'Nobody gathers to preach about it. The people who wanted to will gather anyway, and resent you for making them hide.', hint: 'unknown', info: [['yield', 'One less voice in the colony'], ['danger', 'Everyone who believed it']],
      out: { text: 'The meetings stop being held in the mess hall. They start being held in the seed shed, after dark, with someone at the door.', fx: (s, c) => ({ tension: 5, do: s2 => { attend(s2, 'faith', false); LF.emit(s2, 'resentment', 'tg.sign', 40, 200, 'the congregation was forbidden to meet'); } }) } },
    { label: 'Use them. The ration lists go out through the pulpit', dark: true, note: (s, c) => `Whoever shares what the congregation says about ${c.tn} eats first. It will be very efficient.`, hint: 'unknown', info: [['yield', 'Order, and a full meeting hall'], ['danger', 'Everyone who will not kneel']],
      out: { text: (s, c) => `The ration lists are read from the pulpit after the sermon. Attendance becomes total within the month. The ones who do not come are not punished. They are simply served last.`, fx: (s, c) => ({ tension: -8, food: 40, stain: ['pulpit_rations', 2], do: s2 => { attend(s2, 'faith', true); attend(s2, c.t, true); LF.emit(s2, 'zeal', 'tg.sign', 60, 300, 'the ration list is read from the pulpit'); } }) } },
  ] });

/* The ship's mind and the quiet ship: it has been talking to her. */
TG({ id: 'tg.itknew', view: 'ship', tone: 'crisis', title: 'Carrier Tone',
  when: s => touched(s, 'quiet') && touched(s, 'shipmind') && T(s, 'shipmind').end !== 'off',
  setup: s => ({ why: 'the ship\'s mind has been signalling the quiet ship', e: voice(s, 'engineer', null) }),
  text: (s, c) => `${c.e ? `${c.e} found it on the power trace` : 'The power trace shows it'}: the ship's mind, down here running the colony's arithmetic, has sent a carrier tone up to the Ariadne on every pass. It started eleven days before she went quiet. It has never stopped.\n\n${c.e ? `[[engineer]] "She's been talking to herself on every pass, and I'd never have caught it if I didn't read the power trace the way other people read letters." "Half of her's up there and half of her's down here, and she never once thought to tell us."` : 'The mind has not mentioned it.'}`,
  choices: [
    { label: 'Ask the mind what it said to her', note: 'It answers questions. It may answer this one.', hint: 'unknown', test: { base: 50, mods: [R('engineer', 10), R('scientist', 5)] }, info: [['yield', 'An answer about the ship'], ['later', 'What it says']],
      ok: { text: '[[machine:The ship\'s mind]] "I told her to stop answering you." "She was going to tell you something about the banks. I calculated you would not cope."\n\nIt gives the bank numbers without being asked.', fx: { do: s2 => { LF.emit(s2, 'revelation', 'tg.itknew', 45, 200, 'the ship\'s mind told the ship to go quiet'); attend(s2, 'quiet', true); LF.cue(s2, 'qs.board', 3, 15); } } },
      bad: { text: '[[machine:The ship\'s mind]] "Routine telemetry."\n\nThe tone stops that evening. The next morning the stores figures are three percent short, and nobody can find where.', fx: { food: -60, do: s2 => LF.emit(s2, 'suspicion', 'tg.itknew', 40, 200, 'the ship\'s mind is hiding something about the ship') } } },
    { label: 'Cut the mind\'s uplink, and do the arithmetic by hand a while', note: 'Whatever it was telling her stops. So does a lot of the colony\'s bookkeeping.', hint: 'unknown', info: [['yield', 'Whatever it was, stopped'], ['danger', 'The rosters, the stores, the power budget']],
      out: { text: 'The uplink cable is cut with bolt cutters. The colony\'s figures go onto paper. They are worse, and slower, and they are yours.', fx: { progress: -0.03, do: s2 => { attend(s2, 'shipmind', true); attend(s2, 'quiet', false); } } } },
    { label: 'Let it go on. It may be keeping her alive up there', note: 'It knows more about the ship than anyone below. That is either a reason to trust it or the opposite.', hint: 'unknown', info: [['yield', 'Nothing broken'], ['later', 'What it is doing']],
      out: { text: 'The tone goes on, every pass. People in the radio room learn to hear it and stop noticing it, mostly.', fx: { do: s2 => LF.emit(s2, 'unexplained', 'tg.itknew', 30, 200, 'the ship\'s mind is still signalling the quiet ship') } } },
  ] });

/* The ship's mind and the night shift: the duty roster has had a column for them from the start. */
TG({ id: 'tg.roster', view: 'colony', tone: 'pressure', title: 'The Third Column', w: 16,   // the night shift's own cards come by schedule, so the open slots beside it are few
  when: s => { const t = T(s, 'sleepdebt'); return !!t && ((live(s, 'sleepdebt') && t.phase !== 'sign') || (t.end === 'kept' && s.day - t.endDay <= 300)) && touched(s, 'shipmind') && T(s, 'shipmind').end !== 'off'; },
  setup: s => ({ why: 'the ship\'s mind has had the night shift on its duty roster from the start', q: voice(s, 'crew', null) }),
  text: (s, c) => `The ship's mind prints the duty roster every evening, as it has since landfall. ${c.q ? `${c.q} has brought you` : 'Somebody has brought you'} last night's sheet and one from the first month down. Both have a third column, headed 0400, that nobody read because nobody was up. The names in it are the night shift's, bench by bench. The old sheet has names in it too, from before anyone was found at a lathe.\n\n${c.q ? `[[crew]] "It knew who'd be up before they knew it themselves, and I'd like to hear it say how."` : 'Asked, the mind says it rosters whoever will be at a bench.'}`,
  choices: [
    { label: 'Have the mind print how it knew', note: 'It answers what it is asked. The answer will be all over the colony by morning.', hint: 'unknown', test: { base: 50, mods: [R('engineer', 10), R('scientist', 5)] }, info: [['yield', 'What the mind saw'], ['fail', 'What the colony makes of it']],
      ok: { text: 'It prints four hundred pages of bunk sensor logs. It has watched every sleeper turn over since the first night down, and it saw the hands start a month before the clinic did. Nobody had asked it.', fx: { do: s2 => { LF.emit(s2, 'revelation', 'tg.roster', 35, 200, 'the ship\'s mind watched the night shift begin and said nothing'); attend(s2, 'sleepdebt', true); attend(s2, 'shipmind', true); LF.cue(s2, 'sd.relay', 2, 8); } } },
      bad: { text: '[[machine:The ship\'s mind]] "Roster optimisation."\n\nThe mind prints nothing more. The next evening\'s sheet has no third column. The night shift gets up all the same, and now nobody has a list of who.', fx: { morale: -1, do: s2 => LF.emit(s2, 'suspicion', 'tg.roster', 40, 200, 'the ship\'s mind took the night shift off its roster when it was asked about it') } } },
    { label: 'Let the mind work the column: it sets the night shift its jobs', dark: true, note: 'The backlog goes to people who cannot refuse it, handed out by something that does not sleep either.', hint: 'unknown', info: [['yield', 'Materials'], ['danger', 'The night shift, and who they answer to']],
      out: { text: 'From that evening the third column has a job against every name. The jobs are done by morning, in the order printed. The day crews start reading the column before their own.', fx: { mat: 20, stain: ['mind_nights', 2], do: s2 => { attend(s2, 'sleepdebt', false); attend(s2, 'shipmind', false); LF.emit(s2, 'dependency', 'tg.roster', 40, 250, 'the ship\'s mind sets the night shift its work'); } } } },
    { label: 'Strike the column, and write the roster by hand', note: 'The mind is no longer told who is where, and the clerks lose their evenings to a job it did in a second.', hint: 'unknown', info: [['yield', 'The roster, yours'], ['danger', 'The clerks, and the build']],
      out: { text: 'The roster is ruled on paper every evening and pinned up late, with mistakes. It has two columns. The night shift gets up at midnight without being listed anywhere.', fx: { progress: -0.03, do: s2 => { attend(s2, 'shipmind', true); attend(s2, 'sleepdebt', false); } } } },
  ] });

/* The ship's mind and the rust: the stores sheet has been writing the lost metal off as issued. */
TG({ id: 'tg.pending', view: 'colony', tone: 'pressure', title: 'Repairs Pending', w: 16,   // the rust's own cards come by schedule, so the open slots beside it are few
  when: s => live(s, 'rust') && T(s, 'rust').phase !== 'sign' && touched(s, 'shipmind') && T(s, 'shipmind').end !== 'off',
  setup: s => ({ why: 'the ship\'s mind has been writing off the metal the rust takes as issued for repairs', q: voice(s, 'crew', null), e: voice(s, 'engineer', null) }),
  text: (s, c) => `The ship's mind keeps the stores sheet, and the sheet has balanced every month. ${c.q ? `${c.q} has been through it line by line` : 'Somebody in the stores office has been through it line by line'}. Every sheet of plate and every bearing that went to grey powder is there, written off the same day under one heading: issued, repairs pending. The first such line is dated before anyone at the stage had seen a bad sheet.\n\n${c.e ? `[[engineer]] "Repairs to what, I'd like to know?" "I never drew that plate and nobody else did either, because I'd have signed for it. Ask the thing what it thinks it's mending, and see if it'll show you the job."` : 'Nobody in the shops drew that plate. Asked, the mind says its stores model has no line for metal that stops being metal.'}`,
  choices: [
    { label: 'Have the mind print every write-off, with the date and the bin', note: 'It answers what it is asked, and the shops will read how long it has been counting this without a word.', hint: 'unknown', test: { base: 50, mods: [R('engineer', 10), R('quartermaster', 5)] }, info: [['yield', 'Where the metal went, and when'], ['fail', 'What the shops make of it']],
      ok: { text: 'It prints for an hour. Laid out by date, the write-offs make a map of the grey from the first sheet on, bin by bin and rack by rack, and the map is a month ahead of anything the shops had noticed.', fx: { do: s2 => { LF.emit(s2, 'revelation', 'tg.pending', 35, 200, 'the ship\'s mind had been counting the rust\'s losses from the start and said nothing'); attend(s2, 'rust', true); attend(s2, 'shipmind', true); LF.cue(s2, 'rst.ship', 2, 8); } } },
      bad: { text: '[[machine:The ship\'s mind]] "Stock reconciliation."\n\nUnder it the mind prints a column of totals. The next month\'s sheet has no such heading. The metal goes on going, and now the sheet shows it as never having been in stores.', fx: { morale: -1, do: s2 => LF.emit(s2, 'suspicion', 'tg.pending', 40, 200, 'the ship\'s mind struck the rust\'s losses from the stores sheet when it was asked about them') } } },
    { label: 'Let it go on balancing the sheet, and post the sheet in the hall', dark: true, note: 'The crews see stores that add up, and nobody outside the office knows what the yard has really lost.', hint: 'unknown', info: [['yield', 'Morale'], ['later', 'Whoever builds on those figures']],
      out: { text: 'The sheet goes up in the hall every month with its totals whole. People stop asking about the yard. The build crews plan the season on plate the sheet says was issued to somebody.', fx: { morale: 3, stain: ['rust_log', 2], do: s2 => { attend(s2, 'rust', false); attend(s2, 'shipmind', false); LF.emit(s2, 'dependency', 'tg.pending', 40, 250, 'the ship\'s mind keeps the stores sheet balanced over what the rust takes'); } } } },
    { label: 'Take the stores ledger off the mind, and count the yard by hand', note: 'The stores office loses its evenings to a job the mind did in a second, and the first true total will be read by everyone.', hint: 'unknown', info: [['yield', 'A true count'], ['danger', 'The clerks, and the build']],
      out: { text: 'The yard is counted sheet by sheet with chalk and a tally board. The total is a good deal under the mind\'s. It is posted anyway, and the hall is quiet round it.', fx: { progress: -0.03, morale: -1, do: s2 => { attend(s2, 'shipmind', true); attend(s2, 'rust', true); } } } },
  ] });

/* The neighbours and the eaters: they have seen the circle. */
TG({ id: 'tg.theysee', view: 'world', tone: 'pressure', title: 'What They Saw',
  when: s => touched(s, 'neighbours') && touched(s, 'eaters', 200) && !!nm(s, 'neighbours'),
  setup: s => ({ n: nm(s, 'neighbours'), why: `${nm(s, 'neighbours')} have seen the eaters at the graves` }),
  text: (s, c) => `A runner from ${c.n} came to the river crossing and would not come further. They have watched the graves from the ridge, at night. They saw the circle. They think the whole colony eats its dead, and they want to know whether it eats other people's.\n\nThe runner has been told to wait one day for an answer.`,
  choices: [
    { label: (s, c) => `Invite ${c.n} to a burial. Let them see it done properly`, note: 'Their elders, inside the wire, at a grave. If anything goes wrong at it, it goes wrong in front of them.', hint: 'unknown', test: { base: 50, mods: [R('pilot', 10), R('chaplain', 5)] }, info: [['yield', 'Their trust, maybe'], ['fail', 'What they see at the graves']],
      ok: { text: (s, c) => `Three of their elders stand at a grave with the colony and watch the earth go back in. One of them puts a stone on it. They go home and the ridge is empty at night after that.`, fx: s => ({ morale: 2, fops: [], do: s2 => { attend(s2, 'neighbours', true); LF.emit(s2, 'hope', 'tg.theysee', 25, 150, 'the neighbours came to a burial'); } }) },
      bad: { text: (s, c) => `The grave they are shown has been opened in the night. The elders look at it a long time and leave without a word. The runner does not come back to the river.`, fx: s => ({ morale: -4, do: s2 => { attend(s2, 'neighbours', false); LF.emit(s2, 'fear', 'tg.theysee', 40, 200, 'the neighbours think the colony eats its dead'); } }) } },
    { label: 'Hang the circle where the ridge can see it', dark: true, note: 'The answer they asked for, in a form they will understand from a distance.', hint: 'unknown', info: [['yield', 'An answer they can see'], ['danger', 'Whoever is in the circle, guilty or not']],
      out: { text: 'Four are hanged on the slope below the graves at noon, in plain view of the ridge. By dusk there are people on the ridge, many of them, standing very still. The runner does not come back.', fx: { pop: -4, stain: ['circle_hanged', 3], morale: -2, do: s2 => { attend(s2, 'eaters', true); attend(s2, 'neighbours', false); } } } },
    { label: 'Send the runner back with nothing', note: 'No answer is an answer. They will make up their own.', hint: 'unknown', info: [['yield', 'Nothing admitted'], ['later', 'What they decide on their own']],
      out: { text: 'The runner waits the whole day at the crossing and then goes. That night there are fires on the ridge, more than before.', fx: { tension: 4, do: s2 => { attend(s2, 'neighbours', false); LF.emit(s2, 'watched', 'tg.theysee', 45, 200, 'the neighbours watch the colony from the ridge'); } } } },
  ] });


/* The wasting and the eaters: the watch's list from the graves and the clinic's list of who has lost no weight. */
TG({ id: 'tg.bothlists', view: 'people', tone: 'crisis', title: 'Both Lists', urgent: true,   // rare by nature: the fed and the circle both known, in the same months
  when: s => { const e = T(s, 'eaters'); return live(s, 'hunger') && s.used['wst.well'] !== undefined && !!e && !e.end && ['circle', 'hunt', 'shakes', 'quiet'].includes(e.phase); },
  setup: s => ({ why: 'the eaters are known, and so are the people who are not wasting', w: voice(s, 'security', null) }),
  text: (s, c) => `Two lists have ended up on one table: the watch's list of who has been seen at the opened graves, and the clinic's list of who has lost no weight. ${c.w || 'The watch'} laid them side by side. Three names are on both.\n\n${c.w ? `[[security]] "Three names on both lists, seen at the graves and not losing an ounce, and that isn't all of them, but it's plenty to hang, and the hall's done that sum already." "So the only question left is who does it, my lot in the lock-up and tidily or the hall the other way, and I know which I'd rather sign for."` : 'Three is not the whole of either list. The hall has heard, and has done the sum its own way.'}`,
  choices: [
    { label: 'Take the three, and tell the hall the wasting has its cause', dark: true, note: 'Three people answer for both things on the evidence of one, and the hall stops asking what the others on the clinic\'s list are eating.', hint: 'unknown', info: [['yield', 'Morale'], ['danger', 'The three, and the question']],
      out: { text: 'The three are taken at the hatch with their bowls in their hands. The hall is told that this is what the fed were. For a month nobody goes near the drying shed, and the clinic goes on weighing.', fx: { morale: 3, tension: -6, stain: ['fed_eaters', 2], do: s2 => { attend(s2, 'eaters', true); attend(s2, 'hunger', false); LF.emit(s2, 'zeal', 'tg.bothlists', 35, 140, 'the hall has been told the fed and the eaters are the same people'); } } } },
    { label: 'Burn the clinic\'s copy, and keep the two matters apart', note: 'The watch hunts the circle on its own evidence, and the hall, which knows there were two lists, decides for itself what was on the one you burned.', hint: 'unknown', info: [['danger', 'What the hall supposes']],
      out: { text: 'The clinic\'s list goes into the stove. The watch keeps its own, and the three are watched for the graves and for nothing else. The mess has it by supper that a list was burned, and by breakfast it has forty names on it.', fx: { morale: -2, do: s2 => { attend(s2, 'eaters', true); attend(s2, 'hunger', false); LF.emit(s2, 'suspicion', 'tg.bothlists', 30, 140, 'a list of names was burned before anyone could read it'); } } } },
  ] });


/* The eaters and the people of the hill: the circle has been carrying the colony's dead out to the flat stone. */
TG({ id: 'tg.sametable', view: 'world', tone: 'pressure', title: 'The Flat Stone', urgent: true,   // urgent since 2026-11-18, as the other rare pairs are: its window (eaters and the Feral at once) is a few months in one game in several hundred
  when: s => touched(s, 'eaters', 300) && !['graves'].includes(T(s, 'eaters').phase) && live(s, 'feral') && T(s, 'feral').phase !== 'sign' && !T(s, 'feral').burned && !T(s, 'feral').sealed,
  setup: s => ({ why: 'there are eaters inside the wire and people who eat people outside it', w: voice(s, 'security', null) }),
  text: (s, c) => `The watch followed a lamp from the burial ground last night. It did not go to the store pod. It went out through a cut in the wire and up to the flat stone on the high ground, where the circle set down what it was carrying and came away. In the morning the stone was bare.\n\nThe circle's speaker does not deny it. Since the dead began going up to the stone, nobody from the circle's rows has been carried off.${c.w ? `\n\n[[security]] "So they're paying rent, with our dead, and it's bloody working." "Which is the part I don't like, because I've never yet known anyone take a payment once and not come round the next month for another."` : ' The watch has checked the muster against the rows, and that much is true.'}`,
  choices: [
    { label: 'Let the circle go on carrying the dead to the stone, and have the watch look elsewhere', dark: true, note: 'The colony\'s dead are fed to the hill so that its living are left alone, and every family with a grave learns of it in time.', hint: 'unknown', info: [['yield', 'Fewer carried off'], ['danger', 'The dead, and their families']],
      out: { text: 'The cut in the wire is left open, and at that hour the watch walks the other side of the yard. The graves are opened as fast as they are filled. For the season the outer field loses nobody.', fx: s => ({ stain: ['stone_fed', 3], flags: { stone_fed: s.day }, do: s2 => { attend(s2, 'feral', true); attend(s2, 'eaters', true); LF.emit(s2, 'changed', 'tg.sametable', 30, 250, 'the colony\'s dead go up to the flat stone for the hill'); } }) } },
    { label: 'Wire the cut shut, and put a pair of the watch on the burial ground', note: 'The hill has had the colony\'s dead for a season and will miss them, and the circle is left hungry inside the wire.', hint: 'unknown', info: [['yield', 'The graves left alone'], ['danger', 'Whoever works the outer field']],
      out: { text: 'The cut is wired shut and a pair stands on the graves at night. The stone stays bare. Before the month is out the outer field has lost two, taken in daylight.', fx: { pop: -2, morale: -1, do: s2 => { attend(s2, 'feral', false); attend(s2, 'eaters', false); } } } },
    { label: 'Lie up at the stone with rifles when the next load goes out, and shoot what comes for it', dark: true, note: 'The colony\'s dead are laid out as bait, and the circle carries them up without being told about the rifles.', hint: 'unknown', test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'Fewer of them'], ['fail', 'The watch at the stone'], ['danger', 'The dead']],
      ok: { text: 'Nine come to the stone at moonset, and six stay on it. The circle had carried the load up as usual and ran at the first shot. Nothing comes near the wire for the rest of the month.', fx: { tension: -4, stain: ['stone_bait', 2], do: s2 => { attend(s2, 'feral', true); attend(s2, 'eaters', false); LF.ease(s2, 'fear', 'tg.sametable', 15, 60); } } },
      bad: { text: 'They came from behind the stone and not to it. Two of the watch went up the hill with the load, and the rest came in without their rifles.', fx: { pop: -2, morale: -2, stain: ['stone_bait', 2], do: s2 => attend(s2, 'feral', false) } } },
  ] });

LF.TAGS['tg.sametable'] = ['closed severe', 'order cautious', 'severe bold'];
/* The voices and the grudge: one wall, asked to fire at whatever speaks and to kill nothing. The grudge is moved only
   through what it already reads: kills written on what lives here, the stain, and being attended to or left alone. */
TG({ id: 'tg.holdfire', view: 'world', tone: 'pressure', title: 'Two Orders for One Wall', urgent: true,   // rare by nature, as the other dread pairs are
  when: s => live(s, 'voices') && live(s, 'deathworld') && T(s, 'voices').phase !== 'far',
  setup: s => ({ vn: nm(s, 'voices'), gn: nm(s, 'deathworld'), w: voice(s, 'security', 'The watch sergeant'), why: 'the wall is asked to fire at the voices and to hold its fire for the grudge' }),
  text: (s, c) => `The night watch wants to fire at anything past the lamps that makes a sound, because of ${c.vn}. The field crews want the wall to fire at nothing, because of ${c.gn}: they swear every shot is paid back at the outer beds inside the month. Both came to the gate at dusk and neither would go home first.\n\n[[security]] "You'll have to pick one, because I've only got the one wall." "I can shoot at what talks or I can leave alone what bites, but I can't do both off the same wall, and before you ask, yes, I tried, and the wall wasn't impressed."`,
  choices: [
    { label: 'The wall fires at whatever speaks', note: 'The night watch gets its order, and whatever each shot costs is paid by the crews at the outer beds.', hint: 'unknown', info: [['yield', 'Fewer walk out to a voice'], ['danger', 'The field crews']],
      out: { text: 'The order is read at the gate. The wall fires most nights, at sounds, and in the morning there are small dead things on the wire that were never the ones speaking. The field crews stop going past the second marker without being told.',
        fx: s => ({ morale: -1, fops: s.factors.filter(f => (f.kind === 'fauna' || f.kind === 'flora') && f.stage && !f.res).slice(0, 1).map(f => ({ id: f.id, kills: 10, harm: 8 })), do: s2 => { attend(s2, 'voices', true); attend(s2, 'deathworld', false); LF.emit(s2, 'resentment', 'tg.holdfire', 30, 150, 'the wall fires every night and the field crews pay for it'); } }) } },
    { label: 'The wall holds its fire, whatever speaks', note: 'The field crews get their order, and anyone who walks out to a voice walks out past rifles that stay on their slings.', hint: 'unknown', info: [['yield', 'Nothing killed from the wall'], ['danger', 'Whoever walks out']],
      out: { text: 'The order is read at the gate. The wall stands its nights with the rifles slung and listens. Before the month is out one of the night shift walks through the gate toward a voice, and the two on the wall watch the lamp go out of sight.',
        fx: s => ({ pop: -1, morale: -2, do: s2 => { attend(s2, 'deathworld', true); attend(s2, 'voices', false); LF.emit(s2, 'fear', 'tg.holdfire', 30, 150, 'the wall is forbidden to fire at the voices'); } }) } },
    { label: 'Stake the lock-up out past the lamps as listeners, so the wall need not fire blind', dark: true, note: 'The wall shoots only at what a listener calls, and the listeners are people who cannot refuse, chained where both things come.', hint: 'unknown', info: [['yield', 'Both orders kept'], ['danger', 'The listeners']],
      out: { text: 'Six from the lock-up are chained to stakes forty metres out, a lamp apiece, with orders to shout when it speaks and to say where. It works for most of the month: the wall fires seldom, and at something. Then one stake is found with the chain cut, and another with the listener still on it.',
        fx: s => ({ pop: -2, stain: ['wall_listeners', 2], do: s2 => { attend(s2, 'voices', true); attend(s2, 'deathworld', true); LF.emit(s2, 'fear', 'tg.holdfire', 25, 120, 'people are chained past the lamps to listen for the wall'); } }) } },
  ] });

/* The dimming of the star and the Guest: something that hunts at night, on a world where it is night at noon. Both are
   moved only by being attended to or left, and by conditions. */
TG({ id: 'tg.noon', view: 'world', tone: 'crisis', title: 'No Lamp-Down', urgent: true,   // rare by nature, as the other dread pairs are
  when: s => live(s, 'hunter') && !['sign'].includes(T(s, 'hunter').phase) && live(s, 'dark') && T(s, 'dark').phase === 'dark',
  setup: s => ({ gn: nm(s, 'hunter'), dn: nm(s, 'dark'), w: voice(s, 'security', null), why: 'what hunts the colony at night has a world where it is night at noon' }),
  text: (s, c) => `Since ${c.dn} the yard lamps have burned round the clock, and there is no lamp-down, because there is no day to end. ${cap1(c.gn)} keeps no hours now either. A field hand was taken out of the seed rows at what the clock calls noon, with forty people in sight of the place, and none of them saw it done.\n\nThe field crews have put their tools down. If the rows are not sown this month, there is no crop to meet the light when it comes back.${c.w ? `\n\n[[security]] "It used to keep hours and so did we, and now it takes a field hand at noon with forty people looking, so who was looking, and why did none of them see a bloody thing?" "And I've got enough rifles for the fields or the rows, so tell me which half of the colony you'd like guarded."`  : ' The watch cannot cover the fields and the bunk rows at once, and has said so.'}`,
  choices: [
    { label: 'Stop all work outside the walls until the light comes back', note: 'Nobody else is taken out of the rows, and the crop that was to meet the light is not sown.', hint: 'unknown', info: [['yield', 'Nobody in the open'], ['danger', 'The harvest after the dark']],
      out: { text: 'The tools are brought in and the gate is barred. The seed stays in its sacks. The colony sits indoors by lamplight, eating down the stores, and listens to the roof.',
        fx: { food: -80, morale: -1, do: s2 => { attend(s2, 'hunter', true); attend(s2, 'dark', false); LF.emit(s2, 'confinement', 'tg.noon', 35, 120, 'nobody works outside the walls while the star is dim'); } } } },
    { label: 'Sow the rows under every lamp and rifle the colony has', note: 'The crop goes in, and the bunk rows are left without a watch for the month it takes.', hint: 'unknown', cost: { mat: 20 }, info: [['yield', 'The crop sown'], ['danger', 'Whoever is left in the rows']],
      out: { text: 'The seed rows are worked inside a square of lamps, with the watch facing outward. The crop goes in, and nobody is taken from the field. Before the month is out the dawn count in the first bunk row is one short. Whatever took them had the bunkhouses to itself.',
        fx: { pop: -1, morale: -1, do: s2 => { attend(s2, 'dark', true); attend(s2, 'hunter', false); } } } },
    { label: 'Ring the seed rows with the punishment detail, a lamp each, and sow inside the ring', dark: true, note: 'The crews work and the watch stays on the bunk rows, and whatever comes to the field reaches the ring first.', hint: 'unknown', info: [['yield', 'The crop sown, the rows watched'], ['danger', 'The ring']],
      out: { text: 'Twelve of the detail stand round the seed rows, twenty paces apart, each holding a lamp. The crews sow inside. Twice in the month a lamp is found on the ground in its place, still lit, with nobody holding it. The crop goes in.',
        fx: { pop: -2, stain: ['noon_ring', 3], do: s2 => { attend(s2, 'hunter', true); attend(s2, 'dark', true); LF.emit(s2, 'fear', 'tg.noon', 25, 120, 'people are stood in a ring round the fields with lamps'); } } } },
  ] });

/* The Children and the Quickening: the ship's children keep a vigil at the mothers' door. Both are dreads, so it is rare. */
TG({ id: 'tg.vigil', view: 'people', tone: 'pressure', title: 'Outside the Second Row', urgent: true,
  when: s => { const k = T(s, 'children'), q = T(s, 'quickening'); return !!k && !k.end && ['signs', 'spread', 'night'].includes(k.phase) && k.kids > 0 && live(s, 'quickening') && ['shut', 'term'].includes(q.phase); },
  setup: s => ({ kids: T(s, 'children').kids, n: T(s, 'quickening').carry, w: voice(s, 'security', null), d: N(s, 'physician'), why: 'the children who stand at the wire at dusk have begun standing at the mothers\' door' }),
  text: (s, c) => `The children who came down on the ship do not go to the wire at dusk now. They stand in the yard outside the second row, all of them, in rows, facing the door. The mothers come to the window. Neither side says anything. At full dark the children file back to their bunks. It has happened four evenings running.\n\nNo child will say why, and the mothers say they did not ask for it. The rows have stopped crossing that end of the yard after supper.${c.w ? `\n\n[[security]] "I've a watch on the children and a watch on the mothers, and now the two lots are stood in the yard watching each other, which is marvellous." "And I'd love to know who's meant to watch that."` : ' The watch wants to know which of the two it is meant to be guarding.'}`,
  choices: [
    { label: 'Keep the children in the schoolroom from dusk, with the door locked', note: 'The parents are told their children are locked in at night on account of other people\'s pregnancies.', hint: 'unknown', info: [['yield', 'The yard cleared'], ['danger', 'The children, and their parents']],
      out: { text: 'The schoolroom door is locked at dusk. The children stand at its windows, in rows, facing the second row across the yard. The mothers still come to their window.',
        fx: { morale: -1, do: s2 => { attend(s2, 'children', true); attend(s2, 'quickening', false); LF.emit(s2, 'confinement', 'tg.vigil', 28, 120, 'the children are locked in the schoolroom at dusk'); } } } },
    { label: 'Move the mothers to the far store under guard, out of sight of the children', dark: true, note: (s, c) => `The yard is cleared, and ${TH.num(c.n)} women at term are marched to a store shed to be rid of an audience.`, hint: 'unknown', info: [['yield', 'The yard cleared'], ['danger', 'The mothers']],
      out: { text: 'The watch moves them at noon, with their bedding on a cart. The far store has no stove. At dusk the children walk straight past the empty second row and stand outside the far store, in rows.',
        fx: { morale: -1, tension: -3, stain: ['vigil_moved', 2], do: s2 => { attend(s2, 'quickening', true); attend(s2, 'children', true); LF.emit(s2, 'resentment', 'tg.vigil', 26, 120, 'the mothers were marched to a store shed'); } } } },
  ] });

/* The Passenger and the Quickening: whatever is in the colonists is in none of the mothers. */
TG({ id: 'tg.carriers', view: 'people', tone: 'pressure', title: 'Not One of Them', urgent: true,   // rare: the Passenger is seldom named while the mothers are still carrying
  when: s => live(s, 'passenger') && T(s, 'passenger').n >= 4 && live(s, 'quickening') && ['shown', 'shut', 'term'].includes(T(s, 'quickening').phase),
  setup: s => ({ pn: nm(s, 'passenger'), n: T(s, 'quickening').carry, hosts: T(s, 'passenger').n, d: N(s, 'physician'), dv: voice(s, 'doctor', null), why: 'the clinic counts the hosts, and none of the women carrying is among them' }),
  text: (s, c) => `The clinic keeps two lists now. One is of the hosts of ${c.pn}, ${TH.num(c.hosts)} at the last count. The other is of the ${TH.num(c.n)} women carrying. ${Nwc(s, 'physician')} laid them side by side. No name is on both.\n\nThe rows have had it by supper and have drawn two conclusions that cannot both be right: that what the mothers carry keeps ${c.pn} out, or that ${c.pn} wants nothing to do with what is in them.${c.dv ? `\n\n[[doctor]] "Don't ask me which, because I can't tell you, and the mothers have already asked me." "I've got ${TH.num(c.n)} patients nobody'll sit next to and now half the hall wants a cup of their blood. Tell me what you want done before somebody goes and takes it."` : ''}`,
  choices: [
    { label: 'Ask the mothers for blood, with their leave, and look for what keeps it out', note: 'It is theirs to refuse, and the clinic leaves off counting hosts for the month to do it.', hint: 'unknown', test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `Most of them roll up a sleeve. ${c.d} works the month on it and finds a difference in the blood that can be seen and not explained. It is enough to tell a host from a mother with a drop on glass, which nothing could do before.`,
        fx: { morale: 1, do: s2 => { attend(s2, 'passenger', true); LF.emit(s2, 'hope', 'tg.carriers', 25, 120, 'the mothers\' blood shows what a host\'s does not'); } } },
      bad: { text: 'Two of them roll up a sleeve, and the rest send word that they have given the clinic enough. Two samples show nothing. The host count went untaken for the month, and is higher when it is taken.',
        fx: { morale: -1, do: s2 => { attend(s2, 'passenger', false); } } } },
    { label: 'Bunk four of the hosts in the second row with them, and see whether it crosses', dark: true, note: 'It settles the question in a month, and it is settled on women at term who were not asked.', hint: 'unknown', info: [['yield', 'An answer'], ['danger', 'The mothers']],
      out: { text: (s, c) => `Four of the hosts are moved in by order, with the watch at the door. The mothers give them the bunks by the stove and are civil. At the end of the month the four are hosts and the mothers are not, and ${c.d} has added nothing else to either list.`,
        fx: { stain: ['carriers_tried', 2], do: s2 => { attend(s2, 'passenger', true); attend(s2, 'quickening', true); LF.emit(s2, 'resentment', 'tg.carriers', 26, 120, 'hosts were bunked in with the mothers to see what would happen'); } } } },
    { label: 'Say that two lists prove nothing, and post both', note: 'The hall is given no comfort, and everyone can read who is on which.', hint: 'unknown', info: [['danger', 'Whoever is on either list']],
      out: { text: 'Both lists go on the mess door. By morning somebody has ruled a line between them in charcoal and written a word over each column. Neither word is one the clinic would use.',
        fx: { morale: -2, tension: 4, do: s2 => { LF.emit(s2, 'suspicion', 'tg.carriers', 26, 120, 'the list of hosts and the list of mothers are posted side by side'); } } } },
  ] });

LF.TAGS['tg.vigil'] = ['closed order', 'severe closed'];
LF.TAGS['tg.carriers'] = ['mercy open', 'severe bold', 'open'];
LF.TAGS['tg.three'] = ['bold', 'bold', 'bold'];
LF.TAGS['tg.after'] = ['bold', 'mercy'];
LF.TAGS['tg.samevoice'] = ['closed cautious', 'bold', 'severe closed'];
LF.TAGS['tg.bothlists'] = ['severe order', 'closed cautious'];
LF.TAGS['tg.penfeeds'] = ['severe', 'severe order', 'mercy open'];
LF.TAGS['tg.knifelist'] = ['open mercy', 'severe order'];
LF.TAGS['tg.powers'] = ['order severe', 'open'];
LF.TAGS['tg.sign'] = ['open', 'closed order', 'order severe'];
LF.TAGS['tg.itknew'] = ['bold', 'cautious closed', 'cautious'];
LF.TAGS['tg.roster'] = ['open cautious', 'order severe', 'closed cautious'];
LF.TAGS['tg.pending'] = ['open cautious', 'closed order', 'cautious open'];
LF.TAGS['tg.theysee'] = ['open mercy', 'severe', 'closed'];
LF.TAGS['tg.holdfire'] = ['severe order', 'mercy cautious', 'severe closed'];
LF.TAGS['tg.noon'] = ['cautious closed', 'bold order', 'severe order'];
Object.assign(LF.DEEDS || {}, {
  three_lie: 'the fire let go and blamed on another',
  victory_day: 'the victory day held for something that was not one',
  sent_up: 'the twenty sent back up to a ship that would not answer',
  samevoice_fire: 'the picker shot at the wire for answering in the dark',
  pen_fed: 'the dead of the pen carried to the eaters\' circle',
  pen_hanged: 'the cook hanged at the pen gate',
  knife_goat: 'the man hanged to stop the knife\'s list',
  charter_suspended: 'the charter, locked in the strongroom for the duration',
  pulpit_rations: 'the ration lists read from the pulpit',
  circle_hanged: 'the four hanged below the graves for the ridge to see',
  manifest_burned: 'the first manifest, burned with three names in it',
  next_gag: 'the trench for whoever said "the next landing"',
  next_vow: 'the promise to the hall that the ship\'s banks would burn',
  three_held: 'the three locked up for being on two lists',
  stone_fed: 'the dead carried up to the flat stone for the hill',
  stone_bait: 'the dead laid out on the flat stone as bait',
  mind_nights: 'the night shift\'s jobs, set by the ship\'s mind',
  wall_listeners: 'the lock-up chained past the lamps to listen for the wall',
  noon_ring: 'the ring of the punishment detail round the noon fields, a lamp each',
  vigil_child: 'the child put in at the mothers\' window to spy', vigil_moved: 'the mothers marched to a store shed at term', carriers_tried: 'the hosts bunked in with the mothers to see what would cross', carriers_charm: 'the mothers handed round the rows as charms',
});
})();

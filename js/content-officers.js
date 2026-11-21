/* Landfall — the officers' own cards (officers.js; DESIGN.md "The six officers").
   Health and nerve only wear, and each brings a card before the end: nerve nearly gone (off.break), health nearly
   gone (off.sick). Cued by LF.shift; each can come once for each officer, and holds the only real ways to buy some back. */
(function () {
'use strict';
const { add, h } = LF; const { byPid, R, M } = h;
const who = (s, k, test) => LF.seated(s).filter(p => !p.away && test(p) && !(p.seen[k + '_card'])).sort((a, b) => (k === 'native' ? b.native - a.native : a[k] - b[k]))[0] || null;
const ctxOf = (s, p, k) => { p.seen[k + '_card'] = s.day; const S = LF.SEATS[p.seat]; return { pid: p.id, name: p.name, first: p.first, title: LF.title(p), seat: p.seat, dept: S.name, crew: S.crew }; };
const P = (s, c) => byPid(s, c.pid);
const cap = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
const rest = (s, c, months) => { const p = P(s, c); if (p && p.alive) p.hurt = Math.max(p.hurt || 0, s.day) + months * LF.MONTH; };
const BREAK = { command: 'gave the same order three times at the morning muster and did not know it', security: 'had the whole watch stood to at the wire over a noise nobody else heard',
  engineer: 'was found at the reactor housing in the small hours with every panel off, checking welds that were sound', doctor: 'has stopped going home, and counts the dispensary shelf at every change of shift',
  scientist: 'burned two months of field notes in the stove, and will not say what was in them', crew: 'walked off the plots at noon and was found sitting in the seed store with the door wedged shut' };

/* What each of them says when you come to ask (DESIGN.md "How they talk"). */
const BREAK_SAYS = { command: `"I gave the muster its orders and I'm told I gave the same one three times over, and I don't remember the second or the third. Count it against me if you want, but I won't leave the yard until I know the work is on the right track."`,
  security: `"I had the whole watch stood to at the wire because I heard something out there, and yes, I know nobody else did, and yes, I know how that sounds, but I'd take being the fool who woke everyone over being the one who didn't."`,
  engineer: `"I had every panel off the reactor housing in the middle of the night because I couldn't stop checking the welds, and they were sound, every one, I knew they were sound, and I still couldn't put the covers back on."`,
  doctor: `"I haven't gone home in so long that I don't know what my bed even looks like, and every time the shift changes I'm back at the dispensary shelf counting what's left, again and again, as if it'll come out different. I know how that sounds, and I can't stop, and if I stop I'll have to think about everyone I couldn't help."`,
  scientist: `"I put them in the stove, all of it, and don't ask me what it said, because I read it all back one night and I couldn't, I just couldn't stand to have it in the room, and I'm fine now, I'm sure I'm fine, give me a minute and I'll find a pencil."`,
  crew: `"I couldn't stay on the plots anymore, so I went and shut myself in the seed store and wedged the door, because it's quiet in there and I wanted to ask for something. I'm sorry for the worry, and I'll be out directly, only I'm not ready yet."` };
const SICK_SAYS = { command: `"It's nothing, and I'm sitting here because the stove is warm and the orders carry just as well from a chair. Bring me the work lists and take your pity somewhere else."`, security: `"It's nothing, I'm sitting by the stove because the cold gets into the chair, that's all, and the watch rota's been done and checked and checked again, so you can stop looking at me like I'm about to fall off it."`,
  engineer: `"It's nothing, I've just got a bit of a chill and the stove's warm, so sit down and tell me what's broken, and for pity's sake don't make that face, it's making the room smaller."`, doctor: `"It's nothing, and I'll thank you not to stand over me like I'm already in the ground. I'm sitting here by the stove because it's warm, not because I can't stand, and the ward's running perfectly well with me watching it from this chair."`,
  scientist: `"It's nothing, it's honestly nothing, it's a bit of a cough and the chair is a better angle for the microscope anyway, so no, I'm not stopping, and please don't fetch anyone, I'm only warming my hands."`, crew: `"It's nothing, truly, I just like sitting by the stove while I go over the planting, and anyone who says different is fussing. The beds don't care how I'm feeling, and neither should you, so tell me what needs doing."` };

/* The six alternates say their own (2026-11-18): by cast key, falling back to the seat's line above. */
const BREAK_KEY = {
  achebe: `"Did I? Folks were nodding, I thought they were just being polite, I didn't know. I stood up there and gave the same order, the same words, and I didn't know I'd done it, and nobody told me. Listen, that scares me more than anything out past the wire, and I need you to tell me straight, am I still fit to stand up in front of them?"`,
  zulu: `"I stood the whole watch to at the wire because I heard something. Nobody else did, and I know how that sounds. I'm sorry, I kept them out in the cold all night, and I'd ask you to take the order from me before I give it again."`,
  halloran: `"I'm just checking them, boss! That's all! One of these bastards is going to let go, I can feel it, and if I stop looking it'll be that one. So I'm not stopping. Fuck off and let me look."`,
  brandt: `"I'm counting the shelf, yes, thank you for noticing. It's the one thing in this place that holds still while I look at it, and I'd like to know what's going to run out before it does. No, I haven't been home, because home is a bed in the dark with everything I'm avoiding, and I'd rather count."`,
  iyer: `"You will have heard that I burned my field notes in the stove. Yes, I did it, and no, I will not tell you what was in them, and I'd ask you to accept that I weighed the matter more carefully than you are about to."`,
  waititi: `"Come in, mind the door, I wedged it with a sack of beans, which tells you what sort of man I am. I came in here to find the right thing to say to them and I've been counting seed packets instead, and there's nothing, not a joke, not a story about my uncle, nothing at all. Dalia would know what to say, she always knows, and I keep turning round to ask her."` };
const SICK_KEY = {
  achebe: `"It's nothing, listen, I'm just sitting by the stove because the chair's warm. The work is getting done, I've made sure of that, and the folks know what to do. Don't you go worrying about me, all right? I'd tell you if it was anything, I would."`,
  zulu: `"It's nothing, and I'd ask you not to put it in the book. I'm only sitting by the stove for the warmth, and the watch is running as it should, I've checked it myself. I'll stand up properly in a minute."`,
  halloran: `"It's a chest thing, it's nothing, I've coughed up worse on the Ceres dock! I can swear at a pump from a chair just as well as standing, boss, so piss off and let me work."`,
  brandt: `"It's nothing, and you may stop looking at the stove, I'm cold, that's all. I've heard that exact sentence from a hundred patients, and I'd treat my reliability on the subject accordingly. Now, who's actually ill?"`,
  iyer: `"It is nothing, Administrator, and I'd be grateful if you would stop looking at the chair, which is by the stove only because the stove is warm and the laboratory is not. The department is being run exactly as before, and I would suggest that anyone who finds otherwise has not been reading the reports."`,
  waititi: `"Sick? Who said sick, my friend? I'm sitting by the stove because the stove is the best seat in the colony and I've earned it, ha! The beds are fine, the work's getting done, I'm running it from here with a spoon, and if I cough, it's the smoke. Go on, don't write that down, and don't tell Dalia when she wakes, I'll tell her myself."` };
const sayOf = (s, c, KEY, SEAT) => { const p = byPid(s, c.pid); return (p && KEY[p.key]) || SEAT[c.seat]; };

add({ id: 'off.break', view: 'people', arc: 'officers', tone: 'pressure', chain: true, repeat: 30, title: 'Not Sleeping',
  when: s => !!who(s, 'mind', p => p.mind < 27),
  setup: s => ctxOf(s, who(s, 'mind', p => p.mind < 27), 'mind'),
  text: (s, c) => `${c.name} ${BREAK[c.seat]}. ${c.first} has not slept through a night in months, and ${c.crew} have started covering for it.\n\n[[${c.pid}]] ${sayOf(s, c, BREAK_KEY, BREAK_SAYS)}\n\n${LF.altOf(s, c.seat) ? `${LF.altOf(s, c.seat).first} is deputy, and cannot have the chair while ${c.first} is in it.` : `There is nobody after ${c.first}.`}`,
  choices: [
    { label: (s, c) => `Stand ${c.first} down until it passes`, note: (s, c) => `${c.dept} runs short for three months, in whatever comes during them.`, info: [['time', 'Three months'], ['danger', 'A department short']],
      out: { text: (s, c) => `${c.first} hands over the keys without an argument, which worries people more than an argument would have. The bunk light stays off for most of a week.`, fx: (s, c) => ({ off: [['ctx', 'mind', 30]], do: s2 => rest(s2, c, 3) }) } },
    { label: (s, c) => `Keep ${c.first} at the post`, about: true, risky: true, note: (s, c) => `${c.dept} stays whole. Whatever ${c.first} gets wrong, somebody else pays for.`, test: { base: 50, mods: [R('physician', 10), R('pilot', 5)] },
      ok: { text: (s, c) => `${c.first} works through it. Nobody could say when it turned, only that the lists got shorter and the door of the office was open again.`, fx: () => ({ off: [['ctx', 'mind', 10]] }) },
      bad: { text: (s, c) => `It goes wrong on a night shift, on a job ${c.first} had signed for without reading. Two of ${c.crew} are dead before anyone thinks to check the sheet.`, fx: () => ({ pop: -2, morale: -3, off: [['ctx', 'mind', -10]] }) } },
    { label: (s, c) => `Have the dispensary keep ${c.first} working`, dark: true, note: (s, c) => `${c.first} sleeps, and works, on what the clinic can spare. It is paid for out of the body, later.`, info: [['yield', 'No time lost'], ['danger', 'What it does to them']],
      out: { text: (s, c) => `A paper twist of tablets goes across the mess table every evening, and nobody asks what is in it. ${c.first} is back at work and steadier than before. The hands shake a little by the end of each shift.`, fx: () => ({ stain: ['officer_dosed', 1], off: [['ctx', 'mind', 20], ['ctx', 'body', -22]], do: (s2, c2) => { const p = P(s2, c2); if (p) p.loyal = Math.max(0, p.loyal - 8); } }) } },
  ] });
LF.TAGS['off.break'] = ['mercy cautious', 'bold severe', 'severe order'];

add({ id: 'off.sick', view: 'people', arc: 'officers', tone: 'pressure', chain: true, repeat: 30, title: 'A Chair by the Stove',
  when: s => !!who(s, 'body', p => p.body < 22),
  setup: s => ctxOf(s, who(s, 'body', p => p.body < 22), 'body'),
  text: (s, c) => `${c.name} has been running ${c.dept} from a chair by the stove for a month, and yesterday could not get out of it. It is the kind of illness the ship's clinic would have caught in a morning.\n\n${c.first} says it is nothing, and has said so to everyone who asked.\n\n[[${c.pid}]] ${sayOf(s, c, SICK_KEY, SICK_SAYS)}`,
  choices: [
    { label: (s, c) => `A bed, and the autodoc's time`, cost: { parts: 3 }, req: s => LF.down(s, 'medbay') && !s.machines.medbay.up, reqText: s => s.machines.medbay.up ? 'The autodoc is still aboard the ship' : 'The autodoc is gone', note: (s, c) => `Four months without ${c.first}, and consumables the autodoc will not get back.`, info: [['time', 'Four months'], ['yield', 'A cure, most likely']],
      out: { text: (s, c) => `${c.first} goes under the autodoc's arm complaining, and comes out thinner and quieter. The department sends its questions to the ward on slips of paper.`, fx: (s, c) => ({ machine: { medbay: -4 }, off: [['ctx', 'body', 35]], do: s2 => rest(s2, c, 4) }) } },
    { label: 'Light duties, and see', risky: true, note: (s, c) => `Half a ${c.title} is better than none, if ${c.first} lasts.`, test: { base: 50, mods: [R('physician', 10), M('medbay', 5)] },
      ok: { text: (s, c) => `${c.first} mends slowly, working mornings and sleeping through the afternoons. Within the year the chair by the stove is empty.`, fx: () => ({ off: [['ctx', 'body', 12]] }) },
      bad: { text: (s, c) => `${c.first} is found in the chair one morning with the stove gone cold. The day's worksheets were finished, and squared on the table.`, fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'died at the post of an illness the ship could have cured' }] }) } },
    { label: (s, c) => `Work ${c.first} for as long as there is work left in them`, dark: true, note: (s, c) => `${c.dept} loses nothing this year. ${c.first} knows what is being asked.`, info: [['yield', 'No time lost'], ['danger', 'What is left of them']],
      out: { text: (s, c) => `${c.first} hears it out and nods once. The chair is carried to where ${c.first} works each morning by two of ${c.crew}, and carried back at night.`, fx: () => ({ stain: ['worked_out', 1], morale: -2, off: [['ctx', 'body', -8], ['ctx', 'mind', -10]], do: (s2, c2) => { const p = P(s2, c2); if (p) p.loyal = Math.max(0, p.loyal - 14); } }) } },
  ] });
LF.TAGS['off.sick'] = ['mercy', 'bold', 'severe'];


/* ---------- the deputy takes the chair (Lachlan, 2026-11-18; promotion of a colonist, 2026-11-16, is gone) ----------
   Each seat has two key crew. When the one in the chair is lost, the other, who has been deputy on the ground since
   landfall, can be given it: at landfall if the first was lost on the crossing, a month after one shown the door, a year
   after one dead or missing (LF.altWait). Never a named colonist. When both are gone the seat is empty for good and this
   card does not come. Two options since 2026-11-21: the deputy, or nobody ever. */
const openSeat = s => LF.SEAT_ORDER.find(k => LF.altOpen(s, k) && s.flags['empty_' + k] && s.day >= LF.altDue(s, k));
const was = (s, seat) => LF.lastHeld(s, seat), outDay = LF.outDay;
const HOW = { dead: 'died', left: 'left the colony', broken: 'put down the office', elder: 'handed the office on', relieved: 'was relieved', out: 'left the chair' };
const howOut = p => !p ? 'dead' : p.left ? 'left' : !p.alive ? 'dead' : p.marks.relieved ? 'relieved' : p.marks.elder ? 'elder' : p.marks.broken ? 'broken' : 'out';
const sinceLine = (s, c) => { const who = c.gone ? `${c.gone} ${HOW[c.how]}` : `${c.dept} lost its head`;
  return c.mo < 2 ? `${c.gone ? `${c.gone} ${c.how === 'dead' ? 'is dead' : c.how === 'left' ? 'is gone' : 'is out of the chair'}` : `${c.dept} has lost its head`}, and ${c.crew} have been taking their orders from ${c.first}, who has no title to give them.`
    : `${cap(c.mo >= 12 ? (c.mo < 18 ? 'a year' : c.mo < 30 ? 'two years' : 'years') : LF.monthsWord(c.mo))} since ${who}, and ${c.crew} have been taking their orders from ${c.first}, who has no title to give them. It shows.`; };
/* What each of the twelve says when the chair is offered (VOICES.md). */
const TAKES = {
  solheim: `"Then it's mine, and I'll have the department running to my orders before the hour's out. Nobody is going to hold the chair empty while the work waits."`,
  dahl: `"Oh, so now it's mine, is it, now that the last man's gone and there's nobody else daft enough to want it, well, fine, I'll take it, because I'd sooner it was me than somebody who thinks the job is about being liked."`,
  kovacs: `"Oh, bloody hell, so it's me now, is it? Fine, I'll take it, but I want it understood I never asked for the chair, and I'm not making a speech, I'm going to go and look at what they left me."`,
  nakamura: `"Don't you dare say this is a reward, because I didn't want it this way, and the person who should be sitting here isn't. But if somebody has to keep the ward, it's going to be me, and I'll run it my way, so I hope you're ready for me to shout."`,
  yurbin: `"Oh, you're serious? The chair? Right, yes, of course, I'll take it, and I'll do it properly, I'll do the forms and the rota and all of it, I just need a day to move my cultures out of the way, and, hold on, you did mean me?"`,
  estrada: `"I'd never have asked for the chair, but I won't leave the work sitting there with nobody to do it. I'll keep it the way it was kept, and I'll keep it fair, and I'll ask for a little help from above when I'm out of my depth."`,
  achebe: `"All right. I wasn't looking for it, and I'm not going to pretend I was, and I'm sorry for how it came about. But somebody's got to do it, and I'd sooner it was somebody who'll tell you the truth. Here's the deal, I'll do right by the folks in that department, and when I get it wrong, that one's on me."`,
  zulu: `"I'm honoured, and I'm not sure I'm ready, and I'd rather you heard both. If you want me in the chair I'll do it as it should be done, and I'll ask for help the minute I need it."`,
  halloran: `"About fucking time, boss! Shit, sorry. No, I mean thank you. Thank you! And also about fucking time, I'm not taking that back."`,
  brandt: `"Marvellous, I'm to have the chair, and I notice the colony wants it filled by morning. You're not asking whether I'm able. You're asking whether I'll stop saying it ought to be done differently, and I won't. Yes, I'll take it."`,
  iyer: `"I'll accept the chair, provided that it carries what it ought to carry, which is the authority to decide what the laboratory studies and on whom. I would add that I had been performing the duties for some time before the appointment, so it is merely being corrected on paper."`,
  waititi: `"Me? In the chair? Ha! They'll have to move the chair, I'll never fit, and I'll talk the whole room to sleep. All right, all right, I'll do it, and I promise you everything will be better by harvest, I know, I know, I said it again. Give me a little while to do it badly and I'll turn out all right."`,
};
LF.TAKES = TAKES;
add({ id: 'off.promote', view: 'people', arc: 'officers', tone: 'council', urgent: true, repeat: 20, title: 'The Empty Chair',
  when: s => !!s.world && !LF.aloft(s) && !!openSeat(s),
  setup: s => { const seat = openSeat(s), S = LF.SEATS[seat], g = was(s, seat), a = LF.altOf(s, seat);
    return { seat, dept: S.name, crew: S.crew, title: LF.SEAT_TITLE[seat], key: a.key, name: a.first + ' ' + a.last, first: a.first, gone: g ? g.name : null, gfirst: g ? g.first : null, how: howOut(g), fell: !!(g && g.fell), mo: g ? Math.round((s.day - outDay(g)) / LF.MONTH) : 1 }; },
  text: (s, c) => `${c.fell ? `${c.gone} did not live to see the ground, and ${c.crew} came down the ramp taking their orders from ${c.first}, who has no title to give them.` : sinceLine(s, c)}\n\n${c.name} came out on the ship as ${c.gfirst ? c.gfirst + "'s" : 'the'} second and has been deputy since the lander came down. There is nobody after ${c.first}: the colony brought two for each chair.\n\nAsked, ${c.first} has the answer ready.${TAKES[c.key] ? `\n\n[[${c.key}]] ${TAKES[c.key]}` : ''}`,
  choices: [
    { label: (s, c) => `Give ${c.first} the chair`, note: (s, c) => `${c.dept} has an officer again. ${c.first} is the last one it will ever have.`, info: (s, c) => [['people', `${c.dept}, whole again`], ['danger', `Nobody after ${c.first}`]],
      out: { text: (s, c) => `${c.name} takes the ${c.title}'s chair at the evening muster. ${cap(c.crew)} have been doing what ${c.first} said for a good while already, and nobody looks up from their plate.`,
        fx: (s, c) => ({ morale: 2, do: s2 => LF.seatAlt(s2, c.seat) }) } },
    { label: (s, c) => `Nobody takes ${c.gfirst ? c.gfirst + "'s" : 'that'} chair. Leave it empty for good`, note: 'The colony will remember the gesture. It will also go on without the department.', hint: 'unknown', info: (s, c) => [['yield', 'A memory kept'], ['danger', `${c.dept}, for ever`]],
      out: { text: (s, c) => `The chair is pushed in under the table and left. People touch the back of it on the way past. ${c.first} goes on as deputy to nobody.`, fx: (s, c) => ({ morale: 3, do: s2 => { s2.flags['nopromote_' + c.seat] = s2.day; } }) } },
  ] });
LF.TAGS['off.promote'] = ['open', 'closed'];

/* ---------- out of the chair (2026-11-17) ----------
   A playtester lost the lander with an officer still aboard, and the department below ran at half for the rest of the
   game with nothing to be done about it. Two ways an officer leaves office by the player's hand: off.stranded (the one
   left aboard for good) and off.relieve (one whose health or nerve is nearly gone, some months after their own card). */
const strandedOne = s => s.people.find(p => p.seat && p.role && p.alive && p.orbit && p.stranded && !p.seen.stranded_card && s.day - p.stranded >= LF.MONTH) || null;
add({ id: 'off.stranded', view: 'ship', arc: 'officers', tone: 'pressure', urgent: true, repeat: 20, title: 'Left Aboard',
  when: s => !!s.world && !LF.aloft(s) && !s.flags.qs_dark && !!strandedOne(s),
  setup: s => { const p = strandedOne(s); p.seen.stranded_card = s.day; const S = LF.SEATS[p.seat]; return { pid: p.id, name: p.name, first: p.first, title: LF.title(p), seat: p.seat, dept: S.name, crew: S.crew }; },
  text: (s, c) => `${s.machines.lander && s.machines.lander.lost ? 'The lander is gone' : 'The lander is grounded for good'}, and ${c.name} is still aboard the ${s.world.ship}. ${c.first} has the title and a radio. ${cap(c.crew)} on the ground get their orders once a pass, eleven minutes at a time, from someone who has never stood where they are standing.\n\nThere is a cargo cradle in the hold with a heat shield and a chute. It was built for crates.`,
  choices: [
    { label: (s, c) => `${c.first} keeps the chair, and runs it by radio`, note: (s, c) => `${c.dept} goes on at half, for as long as ${c.first} lives.`, info: (s, c) => [['danger', `${c.dept}, at half for good`]],
      out: { text: (s, c) => `Nothing changes. ${cap(c.crew)} write their questions on a slate by the comms hut and wait for the pass.`, fx: { morale: -1 } } },
    { label: (s, c) => LF.altOf(s, c.seat) ? `Give the chair to ${LF.altOf(s, c.seat).first}, on the ground` : 'Take the chair away, and leave it empty', note: (s, c) => `${c.first} is told over the radio, and stays up there with the title gone.`, info: (s, c) => [['people', LF.altOf(s, c.seat) ? 'The Empty Chair, next month' : 'Nobody to follow'], ['danger', `${c.first}, alone aboard`]],
      out: { text: (s, c) => `It takes one pass to say. ${c.first} asks nothing, and signs off early. The slate by the comms hut is wiped.`,
        fx: (s, c) => ({ morale: -2, do: s2 => { const p = byPid(s2, c.pid); if (p) { LF.vacate(s2, p, 'relieved', `was ${c.title}, and was left aboard the ship when the chair went to someone on the ground`, true); p.loyal = Math.max(0, (p.loyal || 50) - 20); } } }) } },
    { label: (s, c) => `Talk ${c.first} down in the cargo cradle`, about: true, risky: true, note: (s, c) => `It has no seat and no controls. If the chute opens, ${c.dept} has its officer on the ground.`, test: { base: 40, mods: [R('engineer', 10), R('pilot', 5)] },
      info: (s, c) => [['people', `${c.first}, on the ground`], ['danger', `${c.first}`]],
      ok: { text: (s, c) => `The cradle comes down under one chute of three, on its side, a long walk from the wire. ${c.first} is carried in with both legs broken and takes the morning muster from a stretcher.`,
        fx: (s, c) => ({ morale: 4, do: s2 => { const p = byPid(s2, c.pid); if (p) { LF.bringDown(s2, p); p.stranded = 0; p.body = Math.min(p.body, 45); p.hurt = s2.day + 3 * LF.MONTH; } } }) },
      bad: { text: (s, c) => `The cradle is tracked across the whole sky. The chute never opens. A party walks out to where it came down and brings back the title flash off the jacket.`,
        fx: (s, c) => ({ morale: -5, do: s2 => { const p = byPid(s2, c.pid); if (p) { p.orbit = false; p.away = false; LF.killPerson(s2, p, 'came down in a cargo cradle that was built for crates'); } } }) } },
  ] });
LF.TAGS['off.stranded'] = ['cautious', 'order', 'bold'];

const failing = s => LF.seated(s).find(p => !p.away && !p.seen.relieve_card && ((p.seen.mind_card && s.day - p.seen.mind_card >= 4 * LF.MONTH && p.mind < 30) || (p.seen.body_card && s.day - p.seen.body_card >= 4 * LF.MONTH && p.body < 25))) || null;
add({ id: 'off.relieve', view: 'people', arc: 'officers', tone: 'pressure', urgent: true, repeat: 20, title: 'Fit for the Chair',
  when: s => !!s.world && !LF.aloft(s) && !!failing(s),
  setup: s => { const p = failing(s); p.seen.relieve_card = s.day; const S = LF.SEATS[p.seat]; return { pid: p.id, name: p.name, first: p.first, title: LF.title(p), seat: p.seat, dept: S.name, crew: S.crew, mind: p.mind < 30 }; },
  text: (s, c) => `${c.name} is still ${c.title}, and ${c.dept} is worse for it every month. ${c.mind ? `${c.first} signs what is put on the desk and cannot say afterwards what it was.` : `${c.first} has not walked the length of the yard in months, and runs the department from a bed.`} ${cap(c.crew)} have been working round it, and two of them came to you last night to say they cannot go on doing that.\n\n${c.first} has not offered to go, and will not.`,
  choices: [
    { label: (s, c) => `Relieve ${c.first}, in front of the department`, note: (s, c) => `It is said plainly and ${c.crew} hear it. ${LF.altOf(s, c.seat) ? `${LF.altOf(s, c.seat).first}, the deputy, can have the chair in a month.` : `There is nobody to follow ${c.first}: the chair stays empty for good.`}`, info: (s, c) => [['people', LF.altOf(s, c.seat) ? 'The Empty Chair, next month' : 'An empty chair, for good'], ['danger', `${c.first}, and whoever was loyal to ${c.first}`]],
      out: { text: (s, c) => `${c.first} hears it standing, hands the keys across the desk, and asks to be put on a work crew. The department is quiet for a month.`,
        fx: (s, c) => ({ morale: -3, do: s2 => { const p = byPid(s2, c.pid); if (p) { LF.vacate(s2, p, 'relieved', `was ${c.title}, and was relieved of it`, true); p.loyal = Math.max(0, (p.loyal || 50) - 25); } } }) } },
    { label: (s, c) => `${c.first} stays. The department carries its officer`, note: (s, c) => `${c.dept} goes on as it is, and so does everything that depends on it.`, info: (s, c) => [['yield', `${c.first}'s years in the job`], ['danger', `${c.dept}`], ['later', 'Whatever it gets wrong']],
      out: { text: (s, c) => `Nothing is said. The two who came to you are back at their benches in the morning, and do not look up when you pass.`, fx: { morale: -2 } } },
  ] });
LF.TAGS['off.relieve'] = ['severe order', 'mercy'];
(LF.DEEDS_LATE = LF.DEEDS_LATE || []).push({ signed_unfit: 'the officer signed unfit on a paper that was not true' });
})();

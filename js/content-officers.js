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
const BREAK_SAYS = { command: `"I'm fine. I've got the numbers. I've always got the numbers. Don't take the numbers off me."`,
  security: `"It was out there, and you didn't hear it because you weren't listening, which is the whole reason there's a me, since somebody has to be."`,
  engineer: `"One of them's going to go. I don't know which. So I check them all, every night. What else am I meant to do?"`,
  doctor: `"Don't. Don't tell me to sleep. Every time I sleep, somebody on that list doesn't wake up."`,
  scientist: `"It was in the notes, and I didn't want it in the notes, and I know how that sounds, no, can we not do the notes, can we do anything else, ask me about anything else."`,
  crew: `"I'm praying, that's all. Leave the door. Please."` };
const SICK_SAYS = { command: `"It's a cold. Get me the morning reports and get out."`, security: `"If I'm dying I'll let you know, and till then I'm on the rota, because I don't see anyone else lining up for it."`,
  engineer: `"She runs rough for a bit and then she settles. So will I."`, doctor: `"I know exactly what it is. I've seen it in enough patients. I'm not telling you, because you'd take me off the ward."`,
  scientist: `"It's fascinating, actually, it comes in waves, I've been keeping notes, on me, on the, hold on, where did I put the pencil."`, crew: `"My grandmother worked the harvest the week she died. It's no shame."` };

/* The six alternates say their own (2026-11-18): by cast key, falling back to the seat's line above. */
const BREAK_KEY = {
  achebe: `"I gave that order three times, didn't I, and nobody liked to tell me. I'm sorry. I'd stand anyone else down in this state, and I know I would, and here I am asking you not to."`,
  zulu: `"I heard something at the wire and I stood them all to, and there was nothing there, and I know there was nothing there. I'd do the same again tonight, because I can't be the reason one of them doesn't come home."`,
  halloran: `"I'm just checking them, boss! That's all! One of these bastards is going to let go, I can feel it, and if I stop looking it'll be that one. So I'm not stopping. Fuck off and let me look."`,
  brandt: `"I'm aware of what this looks like, having diagnosed it in other people often enough. I've counted that shelf nine times tonight, and the figure hasn't changed, and I'm going to count it again."`,
  iyer: `"The notes were wrong, Administrator, and I couldn't establish when they'd begun to be wrong, so I destroyed them. I recognise that isn't a rational thing to have done, and I'd prefer not to be asked what was in them."`,
  waititi: `"I couldn't think of a single thing to say to anybody. Me! Can you imagine it? So I came and sat in here with the seed, where nobody'd expect a word out of me. Leave the door, would you, just for a bit."` };
const SICK_KEY = {
  achebe: `"It's nothing you need to worry about, honestly. I can do everything from this chair that I did from the other one, and I'd tell you if I couldn't, you know I would."`,
  zulu: `"I'm well enough to keep the rota, and I'd rather be doing that than lying down wondering who's on the wire. Please don't take it off me, because it's the one thing I can still do properly."`,
  halloran: `"It's a chest thing, it's nothing, I've coughed up worse in the breakers' yards! I can swear at a pump from a chair just as well as standing, boss, so piss off and let me work."`,
  brandt: `"It's nothing, and I say that as the only person here qualified to know that it isn't. I'd be obliged if you'd let me have the lie, since I've so few patients left who'd believe it."`,
  iyer: `"It's a minor illness with a predictable course, Administrator, and it doesn't touch my ability to think. I'd ask you not to take a decision about my post on the strength of how I look in a chair."`,
  waititi: `"This? This is nothing, it's the chair that makes it look bad, I've always looked terrible sitting down. Ask Dalia. Well, you can't, but when you can, you ask her."` };
const sayOf = (s, c, KEY, SEAT) => { const p = byPid(s, c.pid); return (p && KEY[p.key]) || SEAT[c.seat]; };

add({ id: 'off.break', view: 'people', arc: 'officers', tone: 'pressure', chain: true, repeat: 30, title: 'Not Sleeping',
  when: s => !!who(s, 'mind', p => p.mind < 27),
  setup: s => ctxOf(s, who(s, 'mind', p => p.mind < 27), 'mind'),
  text: (s, c) => `${c.name} ${BREAK[c.seat]}. ${c.first} has not slept through a night since before the last harvest, and ${c.crew} have started covering for it.\n\n${sayOf(s, c, BREAK_KEY, BREAK_SAYS)}\n\n${LF.altOf(s, c.seat) ? `${LF.altOf(s, c.seat).first} is deputy, and cannot have the chair while ${c.first} is in it.` : `There is nobody after ${c.first}.`}`,
  choices: [
    { label: (s, c) => `Stand ${c.first} down until it passes`, note: (s, c) => `${c.dept} runs short for three months, in whatever comes during them.`, info: [['time', 'Three months'], ['danger', 'A department short']],
      out: { text: (s, c) => `${c.first} hands over the keys without an argument, which worries people more than an argument would have. The bunk light stays off for most of a week.`, fx: (s, c) => ({ off: [['ctx', 'mind', 30]], do: s2 => rest(s2, c, 3) }) } },
    { label: (s, c) => `Keep ${c.first} at the post`, risky: true, note: (s, c) => `${c.dept} stays whole. Whatever ${c.first} gets wrong, somebody else pays for.`, test: { base: 48, mods: [R('physician', 10), R('pilot', 6)] },
      ok: { text: (s, c) => `${c.first} works through it. Nobody could say when it turned, only that the lists got shorter and the door of the office was open again.`, fx: () => ({ off: [['ctx', 'mind', 10]] }) },
      bad: { text: (s, c) => `It goes wrong on a night shift, on a job ${c.first} had signed for without reading. Two of ${c.crew} are dead before anyone thinks to check the sheet.`, fx: () => ({ pop: -2, morale: -3, off: [['ctx', 'mind', -10]] }) } },
    { label: (s, c) => `Have the dispensary keep ${c.first} working`, dark: true, note: (s, c) => `${c.first} sleeps, and works, on what the clinic can spare. It is paid for out of the body, later.`, info: [['yield', 'No time lost'], ['danger', 'What it does to them']],
      out: { text: (s, c) => `A paper twist of tablets goes across the mess table every evening, and nobody asks what is in it. ${c.first} is back at work and steadier than before. The hands shake a little by the end of each shift.`, fx: () => ({ stain: ['officer_dosed', 1], off: [['ctx', 'mind', 20], ['ctx', 'body', -22]], do: (s2, c2) => { const p = P(s2, c2); if (p) p.loyal = Math.max(0, p.loyal - 8); } }) } },
  ] });
LF.TAGS['off.break'] = ['mercy cautious', 'bold severe', 'severe order'];

add({ id: 'off.sick', view: 'people', arc: 'officers', tone: 'pressure', chain: true, repeat: 30, title: 'A Chair by the Stove',
  when: s => !!who(s, 'body', p => p.body < 22),
  setup: s => ctxOf(s, who(s, 'body', p => p.body < 22), 'body'),
  text: (s, c) => `${c.name} has been running ${c.dept} from a chair by the stove for a month, and yesterday could not get out of it. It is the kind of illness the ship's clinic would have caught in a morning.\n\n${c.first} says it is nothing, and has said so to everyone who asked. ${sayOf(s, c, SICK_KEY, SICK_SAYS)}`,
  choices: [
    { label: (s, c) => `A bed, and the autodoc's time`, cost: { parts: 3 }, req: s => LF.down(s, 'medbay') && !s.machines.medbay.up, reqText: s => s.machines.medbay.up ? 'The autodoc is still aboard the ship' : 'The autodoc is gone', note: (s, c) => `Four months without ${c.first}, and consumables the autodoc will not get back.`, info: [['time', 'Four months'], ['yield', 'A cure, most likely']],
      out: { text: (s, c) => `${c.first} goes under the autodoc's arm complaining, and comes out thinner and quieter. The department sends its questions to the ward on slips of paper.`, fx: (s, c) => ({ machine: { medbay: -4 }, off: [['ctx', 'body', 35]], do: s2 => rest(s2, c, 4) }) } },
    { label: 'Light duties, and see', risky: true, note: (s, c) => `Half a ${c.title} is better than none, if ${c.first} lasts.`, test: { base: 52, mods: [R('physician', 12), M('medbay', 6)] },
      ok: { text: (s, c) => `${c.first} mends slowly, working mornings and sleeping through the afternoons. By the next harvest the chair by the stove is empty.`, fx: () => ({ off: [['ctx', 'body', 12]] }) },
      bad: { text: (s, c) => `${c.first} is found in the chair one morning with the stove gone cold. The day's worksheets were finished, and squared on the table.`, fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'died at the post of an illness the ship could have cured' }] }) } },
    { label: (s, c) => `Work ${c.first} for as long as there is work left in them`, dark: true, note: (s, c) => `${c.dept} loses nothing this year. ${c.first} knows what is being asked.`, info: [['yield', 'No time lost'], ['danger', 'What is left of them']],
      out: { text: (s, c) => `${c.first} hears it out and nods once. The chair is carried to the workshop door each morning by two of ${c.crew}, and carried back at night.`, fx: () => ({ stain: ['worked_out', 1], morale: -2, off: [['ctx', 'body', -8], ['ctx', 'mind', -10]], do: (s2, c2) => { const p = P(s2, c2); if (p) p.loyal = Math.max(0, p.loyal - 14); } }) } },
  ] });
LF.TAGS['off.sick'] = ['mercy', 'bold', 'severe'];


/* ---------- the deputy takes the chair (Lachlan, 2026-11-18; promotion of a colonist, 2026-11-16, is gone) ----------
   Each seat has two key crew. When the one in the chair is lost, the other, who has been deputy on the ground since
   landfall, can be given it: at landfall if the first was lost on the crossing, a month after one shown the door, a year
   after one dead or missing (LF.altWait). Never a named colonist. When both are gone the seat is empty for good and this
   card does not come. Options two and three are the old second and third candidates, kept so ids hold their place. */
const openSeat = s => LF.SEAT_ORDER.find(k => LF.altOpen(s, k) && s.flags['empty_' + k] && s.day >= LF.altDue(s, k));
const was = (s, seat) => LF.lastHeld(s, seat), outDay = LF.outDay;
const HOW = { dead: 'died', left: 'left the colony', broken: 'put down the office', elder: 'handed the office on', relieved: 'was relieved', out: 'left the chair' };
const howOut = p => !p ? 'dead' : p.left ? 'left' : !p.alive ? 'dead' : p.marks.relieved ? 'relieved' : p.marks.elder ? 'elder' : p.marks.broken ? 'broken' : 'out';
const sinceLine = (s, c) => { const who = c.gone ? `${c.gone} ${HOW[c.how]}` : `${c.dept} lost its head`;
  return c.mo < 2 ? `${c.gone ? `${c.gone} ${c.how === 'dead' ? 'is dead' : c.how === 'left' ? 'is gone' : 'is out of the chair'}` : `${c.dept} has lost its head`}, and ${c.crew} have been taking their orders from ${c.first}, who has no title to give them.`
    : `${cap(c.mo >= 12 ? (c.mo < 18 ? 'a year' : c.mo < 30 ? 'two years' : 'years') : LF.monthsWord(c.mo))} since ${who}, and ${c.crew} have been taking their orders from ${c.first}, who has no title to give them. It shows.`; };
/* What each of the twelve says when the chair is offered (VOICES.md). */
const TAKES = {
  solheim: `"I've been doing this job without the title since the chair went empty, and the departments already bring me their reports. Make it official and I can stop asking your leave to give orders I'm giving anyway."`,
  dahl: `"So I get the chair, the keys and the blame, in that order, and I'm told it's a promotion. Fine. Somebody's got to, and I'd sooner it was somebody who checks the locks."`,
  kovacs: `"I don't want a chair, I never did, I want two techs and the hours to use them properly. But if sitting in the chair is how I get them, then fine, I'll sit in it, and you won't hear me make a speech."`,
  nakamura: `"I'll take it, and gladly. But you should know that the first time you ask me to sign somebody off as not worth the bed, you're going to wish you'd left that chair empty."`,
  yurbin: `"Yes, obviously yes, I've had a list since, well, I've had a list, there's a whole stretch out there nobody's let me look at, do I get the keys today or is there a form?"`,
  estrada: `"I'll do it, since it needs doing and I know the beds. I'd ask just the one thing of you, which is that nobody goes short so the count looks better, not while it's me holding the book."`,
  achebe: `"I'll take it, and thank you. I'm going to tell the department the same thing I'm telling you now, which is that I'll ask what they need, I'll get it for them if I can, and then I'll expect them to do what they said."`,
  zulu: `"Yes, I'll take it. I'd like to be the one to tell the watch, though, face to face, and not have them read it off a notice on the board. They've earned hearing it from a person."`,
  halloran: `"About fucking time, boss! Shit, sorry. No, I mean thank you. Thank you! And also about fucking time, I'm not taking that back."`,
  brandt: `"You're giving it to me because there's nobody else left to give it to, and we both know that perfectly well. I don't mind in the least. In my experience it's the only honest reason anyone has ever been given a job."`,
  iyer: `"I accept, Administrator. I'll want the full stores list for the laboratory by tonight, and the clinic's as well, and I'd be obliged if nobody asked me why I want the second one."`,
  waititi: `"Me, in a chair, with a title. My mother'd laugh herself sick. Yes. Yes! Tell the kitchens we're celebrating, and then tell them with what, because I've seen the stores."`,
};
LF.TAKES = TAKES;
add({ id: 'off.promote', view: 'people', arc: 'officers', tone: 'council', urgent: true, repeat: 20, title: 'The Empty Chair',
  when: s => !!s.world && !LF.aloft(s) && !!openSeat(s),
  setup: s => { const seat = openSeat(s), S = LF.SEATS[seat], g = was(s, seat), a = LF.altOf(s, seat);
    return { seat, dept: S.name, crew: S.crew, title: LF.SEAT_TITLE[seat], key: a.key, name: a.first + ' ' + a.last, first: a.first, gone: g ? g.name : null, gfirst: g ? g.first : null, how: howOut(g), fell: !!(g && g.fell), mo: g ? Math.round((s.day - outDay(g)) / LF.MONTH) : 1 }; },
  text: (s, c) => `${c.fell ? `${c.gone} did not live to see the ground, and ${c.crew} came down the ramp taking their orders from ${c.first}, who has no title to give them.` : sinceLine(s, c)}\n\n${c.name} came out on the ship as ${c.gfirst ? c.gfirst + "'s" : 'the'} second and has been deputy since the lander came down. There is nobody after ${c.first}: the colony brought two for each chair.\n\nAsked, ${c.first} has the answer ready. ${TAKES[c.key] || ''}`,
  choices: [
    { label: (s, c) => `Give ${c.first} the chair`, note: (s, c) => `${c.dept} has an officer again. ${c.first} is the last one it will ever have.`, info: (s, c) => [['people', `${c.dept}, whole again`], ['danger', `Nobody after ${c.first}`]],
      out: { text: (s, c) => `${c.name} takes the ${c.title}'s chair at the evening muster. ${cap(c.crew)} have been doing what ${c.first} said for a good while already, and nobody looks up from their plate.`,
        fx: (s, c) => ({ morale: 2, do: s2 => LF.seatAlt(s2, c.seat) }) } },
    { show: () => false, label: '', out: { text: '', fx: {} } },
    { show: () => false, label: '', out: { text: '', fx: {} } },
    { label: 'Not yet. Ask again in a year', note: (s, c) => `${c.dept} stays closed, and anything that needs it stays closed with it. ${c.first} goes on doing the work without the title.`, hint: 'unknown', info: (s, c) => [['danger', `${c.dept}, for another year`], ['danger', `${c.first}, passed over`]],
      out: { text: (s, c) => `The chair stays empty. ${c.first} hears it from you, says nothing much, and is back at the bench in the morning.`, fx: (s, c) => ({ morale: -1, do: s2 => { s2.flags['due_' + c.seat] = s2.day + LF.YEAR; } }) } },
    { label: (s, c) => `Nobody takes ${c.gfirst ? c.gfirst + "'s" : 'that'} chair. Leave it empty for good`, note: 'The colony will remember the gesture. It will also go on without the department.', hint: 'unknown', info: (s, c) => [['yield', 'A memory kept'], ['danger', `${c.dept}, for ever`]],
      out: { text: (s, c) => `The chair is pushed in under the table and left. People touch the back of it on the way past. ${c.first} goes on as deputy to nobody.`, fx: (s, c) => ({ morale: 3, do: s2 => { s2.flags['nopromote_' + c.seat] = s2.day; } }) } },
  ] });
LF.TAGS['off.promote'] = ['open', 'open', 'open', 'cautious', 'closed'];   // by position: two and three are never shown

/* ---------- out of the chair (2026-11-17) ----------
   A playtester lost the lander with an officer still aboard, and the department below ran at half for the rest of the
   game with nothing to be done about it. Two ways an officer leaves office by the player's hand: off.stranded (the one
   left aboard for good) and off.relieve (one whose health or nerve is nearly gone, some months after their own card). */
const strandedOne = s => s.people.find(p => p.seat && p.role && p.alive && p.orbit && p.stranded && !p.seen.stranded_card && s.day - p.stranded >= LF.MONTH) || null;
add({ id: 'off.stranded', view: 'ship', arc: 'officers', tone: 'pressure', urgent: true, repeat: 20, title: 'Left Aboard',
  when: s => !!s.world && !LF.aloft(s) && !s.flags.qs_dark && !!strandedOne(s),
  setup: s => { const p = strandedOne(s); p.seen.stranded_card = s.day; const S = LF.SEATS[p.seat]; return { pid: p.id, name: p.name, first: p.first, title: LF.title(p), seat: p.seat, dept: S.name, crew: S.crew }; },
  text: (s, c) => `The lander is gone, and ${c.name} is still aboard the ${s.world.ship}. ${c.first} has the title and a radio. ${cap(c.crew)} on the ground get their orders once a pass, eleven minutes at a time, from someone who has never stood where they are standing.\n\nThere is a cargo cradle in the hold with a heat shield and a chute. It was built for crates.`,
  choices: [
    { label: (s, c) => `${c.first} keeps the chair, and runs it by radio`, note: (s, c) => `${c.dept} goes on at half, for as long as ${c.first} lives.`, info: (s, c) => [['danger', `${c.dept}, at half for good`]],
      out: { text: (s, c) => `Nothing changes. ${cap(c.crew)} write their questions on a slate by the comms hut and wait for the pass.`, fx: { morale: -1 } } },
    { label: (s, c) => LF.altOf(s, c.seat) ? `Give the chair to ${LF.altOf(s, c.seat).first}, on the ground` : 'Take the chair away, and leave it empty', note: (s, c) => `${c.first} is told over the radio, and stays up there with the title gone.`, info: (s, c) => [['people', LF.altOf(s, c.seat) ? 'The Empty Chair, next month' : 'Nobody to follow'], ['danger', `${c.first}, alone aboard`]],
      out: { text: (s, c) => `It takes one pass to say. ${c.first} asks nothing, and signs off early. The slate by the comms hut is wiped.`,
        fx: (s, c) => ({ morale: -2, do: s2 => { const p = byPid(s2, c.pid); if (p) { LF.vacate(s2, p, 'relieved', `was ${c.title}, and was left aboard the ship when the chair went to someone on the ground`, true); p.loyal = Math.max(0, (p.loyal || 50) - 20); } } }) } },
    { label: (s, c) => `Talk ${c.first} down in the cargo cradle`, risky: true, note: (s, c) => `It has no seat and no controls. If the chute opens, ${c.dept} has its officer on the ground.`, test: { base: 38, mods: [R('engineer', 10), R('pilot', 8)] },
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
  text: (s, c) => `${c.name} is still ${c.title}, and ${c.dept} is worse for it every month. ${c.mind ? `${c.first} signs what is put on the desk and cannot say afterwards what it was.` : `${c.first} has not walked the length of the yard since the last harvest, and runs the department from a bed.`} ${cap(c.crew)} have been working round it, and two of them came to you last night to say they cannot go on doing that.\n\n${c.first} has not offered to go, and will not.`,
  choices: [
    { label: (s, c) => `Relieve ${c.first}, in front of the department`, note: (s, c) => `It is said plainly and ${c.crew} hear it. ${LF.altOf(s, c.seat) ? `${LF.altOf(s, c.seat).first}, the deputy, can have the chair in a month.` : `There is nobody to follow ${c.first}: the chair stays empty for good.`}`, info: (s, c) => [['people', LF.altOf(s, c.seat) ? 'The Empty Chair, next month' : 'An empty chair, for good'], ['danger', `${c.first}, and whoever was loyal to ${c.first}`]],
      out: { text: (s, c) => `${c.first} hears it standing, hands the keys across the desk, and asks to be put on a work crew. The department is quiet for a month.`,
        fx: (s, c) => ({ morale: -3, do: s2 => { const p = byPid(s2, c.pid); if (p) { LF.vacate(s2, p, 'relieved', `was ${c.title}, and was relieved of it`, true); p.loyal = Math.max(0, (p.loyal || 50) - 25); } } }) } },
    { label: (s, c) => `${c.first} stays. The department carries its officer`, note: (s, c) => `${c.dept} goes on as it is, and so does everything that depends on it.`, info: (s, c) => [['yield', `${c.first}'s years in the job`], ['danger', `${c.dept}, and whatever it gets wrong`]],
      out: { text: (s, c) => `Nothing is said. The two who came to you are back at their benches in the morning, and do not look up when you pass.`, fx: { morale: -2 } } },
    { label: (s, c) => `Have the clinic sign ${c.first} unfit, and say it was the clinic's doing`, dark: true, note: (s, c) => `${c.first} goes out on a medical paper that is not true, and nobody has to say the real reason aloud.`, info: (s, c) => [['people', LF.altOf(s, c.seat) ? 'The Empty Chair, next month' : 'An empty chair, for good'], ['danger', 'A lie with the clinic\'s name on it']],
      out: { text: (s, c) => `The paper is two lines long. ${c.first} reads it twice, looks at the signature, and folds it into a pocket. The department is told it was a matter of health, and is relieved to believe it.`,
        fx: (s, c) => ({ stain: ['signed_unfit', 1], do: s2 => { const p = byPid(s2, c.pid); if (p) LF.vacate(s2, p, 'relieved', `was ${c.title} until the clinic signed a paper`, true); } }) } },
  ] });
LF.TAGS['off.relieve'] = ['severe order', 'mercy', 'order'];
Object.assign(LF.DEEDS || {}, { signed_unfit: 'the officer signed unfit on a paper that was not true' });
})();

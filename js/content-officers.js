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
  security: `"It was out there. You didn't hear it because you weren't listening. Somebody has to be listening."`,
  engineer: `"One of them's going to go. I don't know which. So I check them all, every night. What else am I meant to do?"`,
  doctor: `"Don't. Don't tell me to sleep. Every time I sleep, somebody on that list doesn't wake up."`,
  scientist: `"It was in the notes. I didn't want it in the notes. Can we — can we stop talking about the notes?"`,
  crew: `"I'm praying, that's all. Leave the door. Please."` };
const SICK_SAYS = { command: `"It's a cold. Get me the morning reports and get out."`, security: `"If I'm dying I'll let you know. Till then I'm on the rota."`,
  engineer: `"She runs rough for a bit and then she settles. So will I."`, doctor: `"I know exactly what it is. I've seen it in enough patients. I'm not telling you, because you'd take me off the ward."`,
  scientist: `"Fascinating, actually. I've been keeping notes on it. On me."`, crew: `"My grandmother worked the harvest the week she died. It's no shame."` };

add({ id: 'off.break', view: 'people', arc: 'officers', tone: 'pressure', chain: true, repeat: 30, title: 'Not Sleeping',
  when: s => !!who(s, 'mind', p => p.mind < 27),
  setup: s => ctxOf(s, who(s, 'mind', p => p.mind < 27), 'mind'),
  text: (s, c) => `${c.name} ${BREAK[c.seat]}. ${c.first} has not slept through a night since before the last harvest, and ${c.crew} have started covering for it.\n\n${BREAK_SAYS[c.seat]}\n\nThere is nobody after ${c.first}.`,
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
  text: (s, c) => `${c.name} has been running ${c.dept} from a chair by the stove for a month, and yesterday could not get out of it. It is the kind of illness the ship's clinic would have caught in a morning.\n\n${c.first} says it is nothing, and has said so to everyone who asked. ${SICK_SAYS[c.seat]}`,
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


/* ---------- promotion (Lachlan, 2026-11-16) ----------
   Six months after a seat empties, the colony can put a named colonist in it: up to three, the ones whose deeds or
   knack suit the post first. New to it, they count for half for a year (LF.green). Or wait six more months, or let
   the seat stay empty for good. */
const openSeat = s => LF.SEAT_ORDER.find(k => s.flags['empty_' + k] && s.day - s.flags['empty_' + k] >= LF.PROMOTE_AFTER && !s.flags['nopromote_' + k] && !LF.officer(s, k));
const fits = (p, seat) => (p.perks || []).includes(LF.SEATS[seat].perk) ? 3 : 0;
// Never someone who has already held a chair and lost it: the one just relieved was the first name on this list (2026-11-16).
const pool = (s, seat) => s.people.filter(p => p.alive && !p.role && !p.seat && !p.away && !p.orbit && p.known && !(p.marks && (p.marks.broken || p.marks.deposed || p.marks.jailed || p.marks.relieved || p.marks.elder)))
  .sort((a, b) => (fits(b, seat) + (b.deeds || []).length + (b.loyal || 50) / 50) - (fits(a, seat) + (a.deeds || []).length + (a.loyal || 50) / 50)).slice(0, 3);
/* Who had the chair last, how they left it and when: dead, gone from the colony, or alive and out of office. */
const outDay = p => p.left || p.died || Math.max(0, ...Object.values(p.marks || {}).map(m => m.d || 0));
const was = (s, seat) => s.people.filter(p => p.seat === seat && (!p.alive || !p.role)).sort((a, b) => outDay(b) - outDay(a))[0];
const HOW = { dead: 'died', left: 'left the colony', broken: 'put down the office', elder: 'handed the office on', relieved: 'was relieved', out: 'left the chair' };
const howOut = p => !p ? 'dead' : p.left ? 'left' : !p.alive ? 'dead' : p.marks.relieved ? 'relieved' : p.marks.elder ? 'elder' : p.marks.broken ? 'broken' : 'out';
const sinceLine = (s, c) => { const who = c.gone ? `${c.gone} ${HOW[c.how]}` : `${c.dept} lost its head`;
  return c.mo < 2 ? `${c.gone ? `${c.gone} ${c.how === 'dead' ? 'is dead' : c.how === 'left' ? 'is gone' : 'is out of the chair'}` : `${c.dept} has lost its head`}, and ${c.crew} are already taking orders from whoever is nearest.`
    : `${cap(c.mo >= 12 ? (c.mo < 18 ? 'a year' : c.mo < 30 ? 'two years' : 'years') : LF.monthsWord(c.mo))} since ${who}, and ${c.crew} have been taking orders from whoever was nearest. It shows.`; };
add({ id: 'off.promote', view: 'people', arc: 'officers', tone: 'council', urgent: true, repeat: 60, title: 'The Empty Chair',   // repeat 20 until 2026-11-18: one chair filled every six months at most
  when: s => !!s.world && !LF.aloft(s) && !!openSeat(s) && s.pop >= 12,
  setup: s => { const seat = openSeat(s), S = LF.SEATS[seat], g = was(s, seat); let ids = pool(s, seat).map(p => p.id);
    if (!ids.length) { const p = h.anyNamed(s, LF.SEAT_ORDER); if (p) { p.known = p.known || s.day; ids = [p.id]; } }
    return { seat, dept: S.name, crew: S.crew, title: LF.SEAT_TITLE[seat], ids, gone: g ? g.name : null, how: howOut(g), mo: g ? Math.round((s.day - outDay(g)) / LF.MONTH) : 6 }; },
  text: (s, c) => `${sinceLine(s, c)}\n\nThe colony has people it would follow now. Somebody has to sit in the chair, and the chair will be a size too big for a while.`,
  choices: [0, 1, 2].map(k => ({ show: (s, c) => !!c.ids[k] && !!byPid(s, c.ids[k]) && byPid(s, c.ids[k]).alive && !byPid(s, c.ids[k]).role,
    label: (s, c) => { const p = byPid(s, c.ids[k]); return p ? `${p.name}, ${LF.title(p)}` : ''; },
    note: (s, c) => { const p = byPid(s, c.ids[k]); if (!p) return ''; const d = (p.deeds || [])[(p.deeds || []).length - 1]; return `${d ? cap(d.txt) + '. ' : ''}New to it: for the first year, half what ${c.gone ? c.gone.split(' ')[0] : 'an officer'} was worth.`; },
    info: (s, c) => [['people', `${c.dept}, at half for a year`], ['danger', `Whatever ${(byPid(s, c.ids[k]) || { first: 'they' }).first} was doing before`]],
    out: { text: (s, c) => { const p = byPid(s, c.ids[k]); if (!p) return ''; return `${p.name} takes the ${c.title}'s chair at the evening muster, and gets through the first order without looking down at the paper. The second takes longer.`; },
      fx: (s, c) => ({ morale: 2, do: s2 => LF.promote(s2, byPid(s2, c.ids[k]), c.seat) }) } })).concat([
    { label: 'Not yet. Ask again in a year', note: (s, c) => `${c.dept} stays closed, and anything that needs it stays closed with it.`, hint: 'unknown', info: (s, c) => [['danger', `${c.dept}, for another year`], ['danger', 'Whoever thought they were next']],
      out: { text: (s, c) => `The chair stays empty. ${cap(c.crew)} go on taking orders from whoever is nearest.`, fx: (s, c) => ({ morale: -1, do: s2 => { s2.flags['empty_' + c.seat] = s2.day + LF.PROMOTE_AFTER; } }) } },   // a year, not six months (2026-11-18: The Empty Chair was a sixth of years 21 to 25)
    { label: (s, c) => `Nobody takes ${c.gone ? c.gone.split(' ')[0] + "'s" : 'that'} chair. Leave it empty for good`, note: 'The colony will remember the gesture. It will also go on without the department.', hint: 'unknown', info: (s, c) => [['yield', 'A memory kept'], ['danger', `${c.dept}, for ever`]],
      out: { text: (s, c) => `The chair is pushed in under the table and left. People touch the back of it on the way past.`, fx: (s, c) => ({ morale: 3, do: s2 => { s2.flags['nopromote_' + c.seat] = s2.day; } }) } },
  ]) });
LF.TAGS['off.promote'] = ['open', 'open', 'open', 'cautious', 'closed'];

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
    { label: (s, c) => `Give the chair to someone on the ground`, note: (s, c) => `${c.first} is told over the radio, and stays up there with the title gone.`, info: (s, c) => [['people', 'The Empty Chair, at once'], ['danger', `${c.first}, alone aboard`]],
      out: { text: (s, c) => `It takes one pass to say. ${c.first} asks who, is told it has not been decided, and signs off early. The slate by the comms hut is wiped.`,
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
    { label: (s, c) => `Relieve ${c.first}, in front of the department`, note: (s, c) => `It is said plainly and ${c.crew} hear it. The chair is open for someone who can do the work.`, info: (s, c) => [['people', 'The Empty Chair, at once'], ['danger', `${c.first}, and whoever was loyal to ${c.first}`]],
      out: { text: (s, c) => `${c.first} hears it standing, hands the keys across the desk, and asks to be put on a work crew. The department is quiet for a month.`,
        fx: (s, c) => ({ morale: -3, do: s2 => { const p = byPid(s2, c.pid); if (p) { LF.vacate(s2, p, 'relieved', `was ${c.title}, and was relieved of it`, true); p.loyal = Math.max(0, (p.loyal || 50) - 25); } } }) } },
    { label: (s, c) => `${c.first} stays. The department carries its officer`, note: (s, c) => `${c.dept} goes on as it is, and so does everything that depends on it.`, info: (s, c) => [['yield', `${c.first}'s years in the job`], ['danger', `${c.dept}, and whatever it gets wrong`]],
      out: { text: (s, c) => `Nothing is said. The two who came to you are back at their benches in the morning, and do not look up when you pass.`, fx: { morale: -2 } } },
    { label: (s, c) => `Have the clinic sign ${c.first} unfit, and say it was the clinic's doing`, dark: true, note: (s, c) => `${c.first} goes out on a medical paper that is not true, and nobody has to say the real reason aloud.`, info: (s, c) => [['people', 'The Empty Chair, at once'], ['danger', 'A lie with the clinic\'s name on it']],
      out: { text: (s, c) => `The paper is two lines long. ${c.first} reads it twice, looks at the signature, and folds it into a pocket. The department is told it was a matter of health, and is relieved to believe it.`,
        fx: (s, c) => ({ stain: ['signed_unfit', 1], do: s2 => { const p = byPid(s2, c.pid); if (p) LF.vacate(s2, p, 'relieved', `was ${c.title} until the clinic signed a paper`, true); } }) } },
  ] });
LF.TAGS['off.relieve'] = ['severe order', 'mercy', 'order'];
Object.assign(LF.DEEDS || {}, { signed_unfit: 'the officer signed unfit on a paper that was not true' });
})();

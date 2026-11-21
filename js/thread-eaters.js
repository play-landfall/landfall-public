/* Landfall — the Eaters (Lachlan, 2026-11-15: more threads, at the same time, darker; DESIGN.md "Pressure").
   Somebody has been opening the graves. A circle inside the colony has been eating the dead since a hungry month, and
   they are not ashamed of it. Truth (rolled in secret): kuru, they have eaten something that will kill them slowly and
   take anyone who ate with them; clean, nothing comes of it but what the colony does about them; living, they have
   stopped waiting for people to die. It wakes early when the colony is hungry, when it renders its dead (ship.dry), or
   has eaten people already (the Limits); it reads hunger and grief, and gives other threads fear, suspicion and
   sickness. Free: about the colony itself, no factor charged. Dice: LF.srand. No DOM. */
(function () {
'use strict';
const { h } = LF; const { N, Nc, F } = h;
const ID = 'eaters', T = s => LF.T(s, ID);
const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1);
const ate = s => !!(s.flags.render_dead || s.flags.lim_larder || s.flags.lim_meat || s.flags.lim_stew || s.flags.lim_herd);
const who = s => { const t = T(s), p = t && t.lead && h.byPid(s, t.lead); return p && p.alive ? p : null; };
const lead = (s, t) => { const p = LF.cast(s, { low: true, free: true, not: ['security', 'doctor'] }); if (p) { t.lead = p.id; t.leadName = p.name; t.leadFirst = p.first; } };

LF.thread({ id: ID, free: true, name: 'The Eaters', view: 'people',
  fits: s => 0.55,
  roll: s => ({ is: LF.spick(s, ['kuru', 'kuru', 'clean', 'living']) }),
  sig: t => t.truth.is,
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'graves' ? 'the opened graves' : 'the eaters',
  clue: (s, t) => ({ txt: 'A list of the dead in the burial ground, each name with a weight beside it, and some of the weights crossed out and written again lower.', learn: s2 => { const x = T(s2); if (x) x.known = 1; } }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 70, 220), n: LF.sri(s, 5, 8), lead: null, known: 0 }); },
  tick: (s, t) => { if (t.end || t.phase !== 'latent' || s.day % 5) return;
    if (s.day >= t.wake || (s.day >= 50 && (LF.cv(s, 'hunger') >= 45 || ate(s)))) { lead(s, t); LF.phase(s, ID, 'graves'); s.signs.push({ id: 'missing', d: s.day, src: 'th.eaters' }); LF.cue(s, 'eat.graves', 0, 6); } },
  press: (s, t, P) => { if (t.phase === 'shakes' && !t.end) P.morale -= 0.05; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ gap: 30, w: 2.6 }, st));

B('graves', { id: 'eat.graves', chain: true, tone: 'pressure', title: 'Opened Graves',
  text: s => `Two graves in the burial ground were opened in the night and filled in again, badly. ${h.Nwc(s, 'security')} had one of them dug up. The body's there. Less of it than was buried.${s.flags.render_dead ? `\n\nAnd the digester crew's tallies don't add up: less goes into the tanks than is carried out of the ward.` : ''}\n\n${N(s, 'security') === LF.seatWord(s, 'security') ? '[[security]] "Somebody\'s hungry."' : `[[security]] "Well, that's a body short of what we buried, so who had the burial ground last night?" "Because somebody's eating better than the rest of us, and I'd like to see who's put weight on this month."`}`,
  choices: [
    { label: 'Find out who. Quietly', note: 'The watch sits up in the burial ground and asks no questions in the mess hall.', hint: 'unknown', test: { base: 50, mods: [h.R('security', 10), h.R('physician', 5)] },
      ok: { text: s => `Four nights in a hide behind the stones. On the fifth, a lamp. ${Nc(s, 'security')} follows it home without a word and comes back with a list of names.`, fx: s => ({ do: s2 => { const t = T(s2); t.known = 1; LF.phase(s2, ID, 'circle', 'The colony learned that some of its own were eating the dead.'); LF.cue(s2, 'eat.circle', 8, 20); LF.emit(s2, 'suspicion', 'th.eaters', 30, 150, 'somebody inside the wire is eating the dead'); } }) },
      bad: { text: 'A fortnight in the hide and nothing. Whoever it is knew the watch was there. The graves stay shut while the watch sits up, and the night after it stops, a third one is open.', fx: s => ({ morale: -2, do: s2 => { LF.phase(s2, ID, 'circle'); LF.cue(s2, 'eat.circle', 20, 40); LF.emit(s2, 'suspicion', 'th.eaters', 45, 180, 'somebody inside the wire is eating the dead, and was warned'); } }) } },
    { label: 'Post a guard on the graves, in daylight, where everyone can see', note: 'It stops. Everyone in the colony knows why the guard is there.', hint: 'unknown', info: [['yield', 'The graves left alone'], ['danger', 'Everyone who hears why']],
      out: { text: 'A guard with a lamp at the burial ground, every night. By the end of the week people are asking the guard what the graves need guarding from, and the guard tells them.', fx: s => ({ morale: -3, do: s2 => { LF.phase(s2, ID, 'circle'); LF.cue(s2, 'eat.circle', 25, 50); LF.emit(s2, 'fear', 'th.eaters', 35, 150, 'somebody has been eating the dead'); } }) } },
    { label: 'Leave the graves alone, and the ladles a little fuller', dark: true, note: 'Whoever it is, they\'re eating less from the store. Nobody has to say anything.', hint: 'unknown', info: [['yield', 'Food'], ['danger', 'The dead'], ['later', 'Anyone who finds out you knew']],
      out: { text: 'Nothing is done. The graves go on being opened and filled in, a little better each time. The stores line on the slate turns down more slowly that month, and the month after.', fx: s => ({ food: 70, stain: ['tacit_eat', 2], do: s2 => { T(s2).tacit = 1; LF.phase(s2, ID, 'circle'); LF.cue(s2, 'eat.circle', 40, 80); LF.ease(s2, 'hunger', 'th.eaters', 10, 120); } }) } },
  ] });

B('circle', { id: 'eat.circle', chain: true, tone: 'crisis', title: 'The Supper',
  setup: s => { const t = T(s); if (!who(s)) lead(s, t); const p = who(s); return { pid: p ? p.id : null, name: p ? p.name : LF.rn(s, 'x43'), first: p ? p.first : LF.rf(s, 'x43'), n: t.n, tacit: !!t.tacit, is: t.truth.is }; },
  text: (s, c) => `There are ${c.n} of them, and ${c.name} speaks for them. They meet in a store pod after the second shift and eat what they've brought from the burial ground, cooked properly, with salt. They started months ago and never stopped.\n\n[[${c.pid || 'x43'}]] "They were dead." "We weren't. You want to tell me which of us was wrong, look at the stores slate first."${c.tacit ? `\n\n${c.first} goes on, quieter.\n\n[[${c.pid || 'x43'}]] "And you knew. Don't pretend you didn't."` : ''}`,
  choices: [
    { label: 'A public trial', note: 'The whole colony hears what they did, and the whole colony decides. Not everyone will vote the way you expect.', hint: 'unknown', test: { base: 50, mods: [h.R('command', 10), h.R('chaplain', 5)] },
      ok: { text: (s, c) => `The trial runs three evenings in the mess hall. ${cap1(String(c.n))} are convicted and put on the latrine and burial rota for a year, which a few people find funny. ${c.first} doesn't.`, fx: (s, c) => ({ morale: 1, do: s2 => { brand(s2, c, 'was convicted in the mess hall of eating the dead, and works the burial rota for it', p => nerve(s2, p, -8)); afterCircle(s2, c); } }) },
      bad: { text: (s, c) => `By the third evening half the hall is on ${c.first}'s side. "They were dead" is chalked on the stores door the next morning, and on two pod walls the morning after.`, fx: (s, c) => ({ morale: -4, do: s2 => { LF.emit(s2, 'schism', 'th.eaters', 45, 220, 'half the colony thinks the eaters were right'); brand(s2, c, 'ate the dead, was tried for it in the mess hall, and walked out free when half the hall took their side', p => { p.loyal = LF.clamp(p.loyal - 10, 0, 100); p.sore = { d: s2.day, t: 'A public trial' }; nerve(s2, p, -5); }); afterCircle(s2, c); } }) } },
    { label: 'Bring it into the open. The dead go to the kitchen', dark: true, note: 'Everyone eats what the colony has. From now on that includes the people who die. It feeds a lot of people, and every one of them will know what\'s in the pot.', hint: 'unknown', info: [['yield', 'Food, every month'], ['danger', 'Everyone who eats, and their nerve']],
      out: { text: (s, c) => `It's announced in the mess hall, plainly. The burial rota becomes a kitchen rota. There's a week when nobody eats the stew, and then there's a week when most people do, and by the end of the month ${c.first} is running the kitchen.`,
        fx: (s, c) => ({ food: 160, morale: -8, stain: ['eat_dead', 3], flags: { eat_open: s.day }, do: s2 => { LF.ease(s2, 'hunger', 'eat.open', 20, 400); brand(s2, c, 'ate the dead before anyone allowed it, and now runs the kitchen that cooks them'); afterCircle(s2, c); } }) } },
    { label: (s, c) => `Let ${LF.officer(s, 'doctor') ? F(s, 'doctor') : 'the clinic'} take them in and watch them`, note: 'No punishment. They are kept under observation for whatever they may have eaten. The families of the dead see them walking about.', hint: 'unknown', info: [['yield', 'Whatever is in them, caught early'], ['danger', 'The families of the dead']],
      out: { text: (s, c) => `The ${c.n} report to the clinic every week to be weighed and looked at. ${h.P(s, 'physician') ? F(s, 'physician') + ' writes' : 'The medics write'} everything down. The families of the people they ate pass them in the street every day.`, fx: (s, c) => ({ morale: -3, do: s2 => { T(s2).watched = 1; brand(s2, c, 'ate the dead, and is weighed at the clinic every week for it'); LF.emit(s2, 'resentment', 'th.eaters', 40, 240, 'the people who ate the dead walk about free'); afterCircle(s2, c); } }) } },
  ] });
/* What the supper leaves on the one who spoke for them (Lachlan, 2026-11-20: a big thing for a character must show on them):
   a mark in their own entry and on their page, and a small cost that fits how it was answered. */
function brand(s, c, txt, also) { const p = c.pid && h.byPid(s, c.pid); if (!p || !p.alive) return;
  p.marks.eater = { d: s.day, txt }; if (also) also(p); }
const nerve = (s, p, d) => { if (p.role && LF.shift) LF.shift(s, p, 'mind', d); };
/* After the supper: what the truth makes of it. */
function afterCircle(s, c) { const t = T(s); if (!t) return;
  if (t.truth.is === 'kuru') { LF.phase(s, ID, 'quiet'); t.shakeAt = s.day + LF.sri(s, 90, 160); }
  else if (t.truth.is === 'living') { LF.phase(s, ID, 'hunt'); LF.cue(s, 'eat.missing', 30, 70); }
  else LF.endThread(s, ID, s.flags.eat_open ? 'eaten' : 'ended', 'The colony dealt with the ones who had been eating its dead.'); }
// kuru: it waits, then shows itself
const tick0 = LF.THREADS[ID].tick;
LF.THREADS[ID].tick = (s, t) => { tick0(s, t); if (!t.end && t.phase === 'quiet' && t.shakeAt && s.day >= t.shakeAt) { LF.phase(s, ID, 'shakes', 'The ones who had eaten the dead began to shake.'); LF.cue(s, 'eat.shakes', 0, 6); } };

B('hunt', { id: 'eat.missing', chain: true, x: true, tone: 'crisis', title: 'One Short',
  setup: s => { const p = LF.cast(s, { free: true, not: [T(s).lead] }); return { why: 'the eaters stopped waiting for people to die', vic: p ? (p.role && p.seat ? p.name : `the ${String(LF.speaker(s, p.id).post).split(',')[0].toLowerCase()} ${p.name}`) : 'a field hand', vf: p ? p.first : 'the field hand', lead: T(s).leadFirst || 'the cook', n: T(s).n }; },
  text: (s, c) => `${cap1(c.vic)} didn't come back from the night shift. There's no body. There's a cooking fire in the scrub, still warm, and ${c.lead}'s pod is empty.\n\n${N(s, 'security') === LF.seatWord(s, 'security') ? '[[security]] "We can take the lot of them tonight."' : `[[security]] "I know whose pods they sleep in and which ones will run, so I can have the lot of them in the lock-up by midnight." "Or in a hole, if you'd rather, and that's your call, not mine."`}`,
  choices: [
    { label: 'Arrest them all, and find out who did it', note: 'A proper search and a proper hearing, while whoever did it has time to go.', hint: 'unknown', test: { base: 50, mods: [h.R('security', 10)] },
      ok: { text: (s, c) => `Three of them did it. They're named in front of everyone and put out past the wire with nothing, and the rest are broken up between the work crews. ${cap1(c.vf || c.vic)}'s things are given out by lot.`, fx: (s, c) => ({ leave: 3, morale: -2, do: s2 => LF.endThread(s2, ID, 'tried', 'The eaters were caught and the worst of them put out past the wire.') }) },
      bad: { text: (s, c) => `By the time the watch has the pods searched, ${c.lead} and two others are gone into the scrub. The rest swear they didn't know. Nobody believes them, and nobody can prove it.`, fx: (s, c) => ({ leave: 3, morale: -5, do: s2 => { LF.emit(s2, 'fear', 'th.eaters', 50, 300, 'the eaters are out past the wire, and they know the way in'); LF.endThread(s2, ID, 'loose', 'The eaters went out past the wire, and were not caught.'); } }) } },
    { label: 'Put all of them in the hole tonight. No hearing', dark: true, note: (s, c) => `${cap1(String(c.n))} people. Some of them only ever ate what was already dead.`, hint: 'unknown', info: [['yield', 'It is over, tonight'], ['danger', 'All of them, guilty or not']],
      out: { text: (s, c) => `The watch goes pod to pod with lamps at midnight. By morning there's a fresh trench past the wire and the colony is ${c.n} smaller. Nobody asks which of them did it.`, fx: (s, c) => ({ pop: -c.n, tension: -15, morale: -6, stain: ['purge', 2], do: s2 => LF.endThread(s2, ID, 'purged', 'The colony shot every one of the eaters in one night.') }) } },
    { label: 'Give them to the families', dark: true, note: (s, c) => `${cap1(c.vf || c.vic)}'s family, and the families of everyone in the burial ground. The watch stands aside.`, hint: 'unknown', info: [['yield', 'The anger goes somewhere'], ['danger', 'Them, and what the colony becomes']],
      out: { text: (s, c) => `The watch opens the lock-up and walks away. It doesn't take long. ${cap1(c.vf || c.vic)}'s mother is the first through the door and the last out. The mess hall is quiet for a week, and then it isn't, and nobody talks about that night again.`, fx: (s, c) => ({ pop: -c.n, morale: 2, tension: -20, stain: ['mob', 3], do: s2 => { LF.emit(s2, 'changed', 'th.eaters', 40, 400, 'the colony let a crowd kill the eaters'); LF.endThread(s2, ID, 'mobbed', 'The families of the dead were given the eaters.'); } }) } },
  ] });

B('shakes', { id: 'eat.shakes', chain: true, tone: 'crisis', title: 'Laughing Sickness',
  setup: s => { const t = T(s), n = s.flags.eat_open ? Math.max(t.n + 4, Math.round(LF.sized(s) * 0.18)) : t.n; return { n, open: !!s.flags.eat_open }; },
  text: (s, c) => `It starts with a tremor in the hands. Then they can't walk straight. Then they laugh, at nothing, for hours, and can't stop. ${c.n} of them now${c.open ? ', because everyone who took the kitchen\'s stew ate the same thing' : ', every one of the ones who ate at the supper'}.\n\n${LF.officer(s, 'doctor') ? `[[doctor]] "It's in the brain, and they know something's wrong even while they're laughing, you can see it in their eyes." "It's something they ate, and I can't do anything but sit with them while they go, so don't ask me for more than that."` : 'There is no doctor. The clinic orderlies say what everyone can see: nobody gets better.'}`,
  choices: [
    { label: 'Nurse them to the end', note: (s, c) => `Months of care for ${c.n} people who won't get better, from people who should be in the fields.`, hint: 'unknown', info: [['yield', 'They die cared for'], ['danger', 'The fields, and the nurses\' nerve']],
      out: { text: (s, c) => `The clinic fills and then the pod beside it. The laughing goes on day and night for a season and stops one bed at a time. ${c.n} dead before the year is out.`, fx: (s, c) => ({ pop: -c.n, food: -80, morale: -6, do: s2 => LF.endThread(s2, ID, 'kuru', 'The ones who had eaten the dead died of it, laughing.') }) } },
    { label: 'End it quickly, in their sleep', dark: true, note: (s, c) => `A dose each, at night. ${c.n} people who might have had months, and who haven't been asked.`, hint: 'unknown', info: (s, c) => [['yield', 'Nobody has to listen to it'], ['danger', `${c.n} who weren't asked`]],
      out: { text: (s, c) => `It's done in one night by ${LF.officer(s, 'doctor') ? F(s, 'doctor') + ', who' : 'two orderlies, who'} won't talk about it afterwards. The pod is quiet in the morning. ${c.n} names go on the wall with the same date.`, fx: (s, c) => ({ pop: -c.n, morale: -2, stain: ['dosed_sick', 2], off: [['doctor', 'mind', -15]], do: s2 => LF.endThread(s2, ID, 'kuru', 'The ones who had eaten the dead were put down in their sleep.') }) } },
  ] });

LF.TAGS['eat.graves'] = ['order', 'cautious', 'severe'];
LF.TAGS['eat.circle'] = ['open order', 'severe open', 'mercy'];
LF.TAGS['eat.missing'] = ['order', 'severe order', 'severe'];
LF.TAGS['eat.shakes'] = ['mercy', 'severe'];
Object.assign(LF.DEEDS || {}, { tacit_eat: 'the graves left open because the ladles were fuller', hanged_eater: 'the eater hanged at the pad', eat_dead: 'the dead sent to the kitchen',
  mob: 'the eaters handed to the families of the dead', dosed_sick: 'the sick put down in their sleep' });
})();

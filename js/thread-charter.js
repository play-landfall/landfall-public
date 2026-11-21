/* Landfall — thread: the Charter. Who rules, and by what right. Every colony has this one.
   It has no monster. It reads the colony's conditions (resentment, hunger, suspicion, fear, changed) whoever raised
   them, and the people (who wants the chair, who was left for the second load, who has turned away), and it writes
   schism and suspicion back. t.legit is how far the colony still accepts that you decide.
   Also here: the episodes, short cards that belong to no thread and borrow their premise from whatever is hot. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, If, byPid } = h;
const TH = LF.th, T = s => LF.T(s, 'charter'), ID = 'charter';
const HOTS = ['resentment', 'suspicion', 'fear', 'grief', 'schism'];   // not hunger: the colony's stomach already has its own cards
const worst = s => HOTS.map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0];
const claimant = s => { const t = T(s), p = t && t.claimant && byPid(s, t.claimant); return p && p.alive ? p : null; };
const officers = s => s.people.filter(p => p.alive && p.role && p.loyal !== undefined);
const backing = s => { const o = officers(s); return o.length ? o.reduce((a, p) => a + p.loyal, 0) / o.length : 50; };
const legit = (s, d) => { const t = T(s); t.legit = clamp(t.legit + d, 0, 100); };
// A first mention of the claimant: an officer by post, anyone else by who they are to the colony.
const who = (s, c) => { const p = byPid(s, c.pid); return p && p.role ? `${c.name}, your ${c.title},` : `${c.name}, a colonist the crews listen to,`; };
/* The monopoly: one officer holds the colony's one thing it cannot do without. The emergency: the watch holds the colony. */
const HOLD = { water: { role: 'engineer', what: 'the water valves', thing: 'water' }, medicine: { role: 'physician', what: 'the clinic\'s drug store', thing: 'medicine' }, seed: { role: 'botanist', what: 'the seed vault', thing: 'seed' } };
function pickClaimant(s, t) { const f = t.truth.fault, sp = f === 'monopoly' && t.hold ? h.P(s, HOLD[t.hold].role) : f === 'emergency' ? h.P(s, 'security') : null;
  if (sp && sp.loyal !== undefined) { t.claimant = sp.id; sp.known = sp.known || s.day; return sp; }
  const p = LF.cast(s, { want: 'chair', low: true, not: ['security'] }); if (p) { t.claimant = p.id; p.known = p.known || s.day; } return p; }

LF.thread({ id: ID, name: 'The Charter', view: 'people', always: true,
  clue: (s, t) => ({ txt: 'There were two camps by the end, a hundred metres apart, each with its own well and its own graves. The newer graves in each face away from the other camp.', learn: s2 => legit(s2, 6) }),
  // A colony that accepts its government works a little better for it: the upside that pays for the trouble.
  roll: s => ({ fault: LF.spick(s, ['watch', 'sleepers', 'work', 'monopoly', 'emergency']) }),
  sig: t => t.truth.fault,
  start: (s, t) => { Object.assign(t, { legit: 55, claimant: null }); if (t.truth.fault === 'monopoly') t.hold = LF.spick(s, Object.keys(HOLD)); },
  tick: (s, t) => {
    if (t.end) return;
    if (s.day % 10 === 0) t.legit = clamp(t.legit + (50 + (s.morale - 50) / 2 + (s.flags.council ? 8 : 0) - t.legit) * 0.03, 0, 100);
    if (t.phase === 'latent' && s.day >= 150) { LF.phase(s, ID, 'murmurs'); pickClaimant(s, t); if (t.hold) LF.cue(s, 'ch.hold', 35, 70); }   // a monopoly is the story: its card is owed, not drawn
    else if (t.phase === 'murmurs' && s.day - t.since > 70 && (worst(s)[1] >= 45 || t.legit < 40 || s.day - t.since > 300)) { if (!claimant(s)) pickClaimant(s, t); if (claimant(s)) LF.phase(s, ID, 'claim'); }
    else if (t.phase === 'claim' && s.day - t.since > 80 && (t.legit < 38 || (worst(s)[1] >= 55 && s.day - t.since > 140) || (s.day - t.since > 320 && (t.legit < 55 || worst(s)[1] >= 40)))) { LF.phase(s, ID, 'crisis'); LF.cue(s, 'ch.night', 2, 14); }
    else if (t.phase === 'claim' && s.day - t.since > 320) { const c = claimant(s); LF.endThread(s, ID, 'settled', c ? `The petition ${c.name} carried was put away. Things were going too well for anyone to sign it.` : null); }   // nothing wrong enough to carry it
    if ((t.phase === 'claim' || t.phase === 'crisis') && s.day % 5 === 0) { const c = claimant(s);
      LF.emit(s, 'schism', 'th.charter', 25 + (60 - t.legit) * 0.6, 8, c ? `${c.name} is asking who put you in charge` : 'people are asking who put you in charge'); }
    if (t.truth.fault === 'emergency' && !t.emergency && !t.powCued && (t.phase === 'murmurs' || t.phase === 'claim') && ['fear', 'dark', 'siege', 'sickness', 'hunger', 'cold'].some(k => LF.cv(s, k) >= 42)) { t.powCued = true; LF.cue(s, 'ch.powers', 2, 20); }   // this colony's fault line is the emergency itself
    if (t.truth.fault === 'emergency' && t.emergency && !t.emergencyOver && !t.openEnded && t.askedFor !== t.emergency && s.day >= t.emergency - 8) { t.askedFor = t.emergency; t.emergency += 30; LF.cue(s, 'ch.extend', 0, 3); }
    if (t.emergency && s.day > t.emergency && !t.emergencyOver) { t.emergencyOver = true; if (t.openEnded) legit(s, -8); else { legit(s, 6); LF.log(s, 'The emergency powers lapsed on the day you said they would, and the date came off the mess hall wall.', 'good'); } }
  },
  press: (s, t, P) => { if (t.emergency && s.day <= t.emergency) P.labor += 0.05; if (t.legit >= 50) { P.labor += 0.04; P.morale += 0.02; } if (t.end === 'shared' || t.end === 'kept' || t.end === 'settled') { P.morale += 0.02; P.labor += 0.04; } },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people' }, st));

/* ======================= MURMURS ======================= */
B(['murmurs', 'claim'], { id: 'ch.second', tone: 'pressure', title: 'The Second Load',
  when: s => s.people.some(p => p.seat && p.role && p.alive && !p.watch && !p.away),
  setup: s => { const left = s.people.filter(p => p.seat && p.role && p.alive && !p.watch && !p.away).sort((a, b) => a.loyal - b.loyal)[0];
    const other = s.people.filter(p => p.seat && p.alive && p.watch && !p.away).sort((a, b) => b.loyal - a.loyal)[0]; return Object.assign(TH.ctx(left), { other: other ? other.name : 'the others', of: other ? other.first : 'they' }); },
  text: (s, c) => `It has a name in the mess hall now: the first load and the second. Who was woken to decide things, and who was woken to be told what had been decided.\n\n${c.name}, your ${c.title}, says it to your face, which is more than most do.\n\n[[${c.pid}]] "Forty years of us to choose from, and you picked ${c.other}. So what did ${c.of} have that I didn't? Tell me before you choose again."`,
  choices: [
    { label: (s, c) => `Give ${c.first} the next thing that matters, in front of everyone`, out: { text: (s, c) => `It is announced at the evening meal. ${c.first} takes it without thanks, and does it very well. The officers who came down on the first load hear it announced too, and understand what they are being told.`, fx: (s, c) => ({ do: s2 => { const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 16, 0, 100); legit(s2, 4); for (const o of officers(s2)) if (o.watch && o.id !== c.pid) o.loyal = clamp(o.loyal - 6, 0, 100); } }) } },
    { label: 'Promise that the officers decide together, and go on deciding', dark: true, note: 'A table and a meeting cost nothing. People will hold you to the promise word for word, and you do not mean to keep it.', out: { text: 'A table is found that seats every officer and you. The first meeting runs four hours and settles one thing. The rest is settled that night, by you, as before.', fx: s => ({ flags: { assembly: true }, stain: ['false_promise', 1], do: s2 => { legit(s2, 8); for (const p of officers(s2)) if (!p.watch) p.loyal = clamp(p.loyal + 6, 0, 100); s2.seeds.push({ id: 'ch:promise', k: 'flag', d: s2.day, txt: 'you promised the officers would decide together' }); T(s2).promised = s2.day; } }) } },
  ] });
B(['murmurs', 'claim'], { id: 'ch.seat', tone: 'opportunity', title: 'A Seat at the Table',
  when: (s, t) => !!claimant(s) && s.day - t.since > 30,
  setup: s => TH.ctx(claimant(s)),
  text: (s, c) => `${byPid(s, c.pid).role ? `${c.name}, your ${c.title}, wants the crews to have a chair when the officers meet, and offers to fill it until they choose someone of their own` : `${c.name}, a colonist the crews listen to, wants a chair for the crews when the officers meet, and offers to fill it until they choose someone of their own`}. The chair would have no vote. Whoever sits in it would listen, and carry what is said back to the crews in words the crews did not have to guess at.\n\n${LF.creed(byPid(s, c.pid))}\n\n[[${c.pid}]] "They'll swallow a hard call. They just want to see it get made."`,
  choices: [
    { label: 'A chair, and the right to speak', note: 'The officers will be overheard by the people they give orders to.', out: { text: (s, c) => `${c.first} says little for a month. Then, on the matter of the rota, ${c.first} says one thing, and the officers act on it. Two of them tell you afterwards that they will not speak freely in that room again.`, fx: (s, c) => ({ do: s2 => { const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 12, 0, 100); legit(s2, 9); T(s2).seated = s2.day; for (const o of officers(s2)) if (o.watch && o.id !== c.pid) o.loyal = clamp(o.loyal - 4, 0, 100); } }) } },
    { label: 'Minutes, posted the next morning, with the hard parts left out', dark: true, note: 'People will believe they are being told. They will be told what is safe.', out: { text: (s, c) => `A page on the mess hall board after every meeting, written by you. People read it and are mostly satisfied. ${c.first} reads it every morning and says nothing, in front of an audience.`, fx: (s, c) => ({ stain: ['minutes', 1], do: s2 => { legit(s2, 7); const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal - 5, 0, 100); } }) } },
  ] });

/* ======================= CLAIM ======================= */
B('claim', { id: 'ch.list', x: true, tone: 'pressure', w: 3, title: 'The List',
  when: s => !!claimant(s),
  setup: s => Object.assign(TH.ctx(claimant(s)), { k: worst(s)[0], why: LF.because(s, worst(s)[0]) || 'people are tired of being decided for' }),
  text: (s, c) => `${who(s, c)} has a list. ${TH.num(Math.min(12, Math.max(4, Math.round(LF.sized(s) * (70 - T(s).legit) / 500)))).replace(/^./, x => x.toUpperCase())} pages of names, under one sentence: that the colony should choose who decides for it.\n\nA year ago most of them would not have signed, but they are signing now ${TH.bec(s, c.k) || 'because people are tired'}. ${c.first} has not hidden it. A copy was left on your desk.`,
  choices: [
    { label: 'Meet them, in the open, and answer every question', test: { base: 50, mods: [R('chaplain', 10), If(s => backing(s) >= 60, 10, 'Your officers stand with you'), If(s => backing(s) < 45, -10, 'Your officers are not behind you')] },
      ok: { text: 'Three hours on your feet. Nobody is won over and nobody walks out, and most of them had not expected you to come at all.', fx: s => ({ do: s2 => legit(s2, 12) }) },
      bad: { text: 'Three hours on your feet, and the question you cannot answer is asked in the first ten minutes and again in the last.', fx: s => ({ morale: -1, do: s2 => legit(s2, -8) }) } },
    { label: 'Sign it yourself', note: 'Then there will be a vote, and the officers who stood by you will be put to it as well.', out: { text: (s, c) => `You sign at the bottom of the last page. ${c.first} looks at the signature for some time.\n\n[[${c.pid}]] "Huh. I didn't have anything ready for that."\n\nYour officers hear of it from the crews, and two of them ask what they were standing beside you for.`, fx: (s, c) => ({ flags: { council: true }, morale: 5, chron: 'The Administrator signed the petition against the Administrator.', do: s2 => { legit(s2, 18); for (const o of officers(s2)) if (o.id !== c.pid && o.loyal >= 55) o.loyal = clamp(o.loyal - 6, 0, 100); const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 20, 0, 100); } }) } },
    { label: (s, c) => `${c.first} does not come back from the night shift`, dark: true, about: true, show: (s, c) => { const p = byPid(s, c.pid); return !!p && p.alive && !p.away && !!h.P(s, 'security'); }, test: { base: 60, mods: [R('security', 10)] }, note: s => `The watch has two people who would do it, and nobody has asked whether you want to know their names.`, info: [['yield', 'The list ends with its author'], ['fail', 'Being seen']],
      ok: { text: (s, c) => `${c.name} is missed at the morning count. The watch searches as far as the wire and stops. The list is not seen again. Every name that was on it turns out for shift, on time, for the rest of the season.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'went missing from the night shift, with a petition' }], morale: -3, flags: { crackdown: true }, stain: ['vanish', 2], chron: `${c.name}, who carried a petition against the Administrator, disappeared from the night shift.`,
          do: s2 => { legit(s2, -6); LF.emit(s2, 'fear', 'ch.vanish', 55, 300, `${c.name} carried a petition and vanished`); LF.endThread(s2, ID, 'crushed'); } }) },
      bad: { text: (s, c) => `The two from the watch are seen, and stopped, by a night shift that had been expecting something of the kind. ${c.first} walks into the mess hall at breakfast with a split lip and every page of the list, and reads the new signatures aloud.`,
        fx: (s, c) => ({ morale: -6, stain: ['vanish', 1], do: s2 => { legit(s2, -20); const p = byPid(s2, c.pid); if (p) { p.loyal = 0; p.marks.grudge = p.marks.grudge || { d: s2.day, txt: 'you sent the watch for in the night' }; } LF.emit(s2, 'resentment', 'ch.vanish', 50, 300, `the watch came for ${c.name} in the night`); } }) } },
  ] });
B(['murmurs', 'claim'], { id: 'ch.powers', x: true, tone: 'crisis', w: 3, title: 'Emergency Powers',
  when: (s, t) => !t.emergency && ['fear', 'dark', 'siege', 'sickness'].concat(t.truth.fault === 'emergency' ? ['hunger', 'cold'] : []).some(k => LF.cv(s, k) >= (t.truth.fault === 'emergency' ? 42 : 55)),
  setup: s => ({ k: ['dark', 'siege', 'sickness', 'fear'].concat(T(s).truth.fault === 'emergency' ? ['hunger', 'cold'] : []).map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0][0] }),
  text: (s, c) => `${h.Nwc(s, 'security')} has it drafted, one page. Rosters by order, not by request. Stores under guard. No assembly of more than six without leave. The Administrator to decide alone, and at once.\n\n[[security]] "Any other year I wouldn't ask. This isn't any other year, ${TH.bec(s, c.k)}, and frightened people want telling what to do, so let me bloody tell them."`,
  choices: [
    { label: 'For nine months, and the date goes on the wall', out: { text: 'The date is painted on the mess hall wall in letters a hand high. People do what they are told, and look at the wall.', fx: s => ({ morale: -1, tension: -15, do: s2 => { const t = T(s2); t.emergency = s2.day + 90; legit(s2, -3); LF.emit(s2, 'confinement', 'ch.powers', 25, 90, 'no more than six may gather without leave'); } }) } },
    { label: 'Until it is over', dark: true, note: 'Nobody, you included, will be able to say when that is.', out: { text: s => `${Nc(s, 'security')} posts it before breakfast. The work goes faster. The mess hall is quieter than it has ever been.`, fx: s => ({ morale: -2, tension: -20, flags: { command_rule: true }, stain: ['open_rule', 1], do: s2 => { const t = T(s2); t.emergency = s2.day + 400; t.openEnded = true; legit(s2, -14); LF.emit(s2, 'confinement', 'ch.powers', 30, 400, 'no more than six may gather without leave'); LF.emit(s2, 'resentment', 'ch.powers', 30, 400, 'the emergency has no end date'); } }) } },
    { label: 'No. We get through this as we are', note: 'The watch goes on with what it has, against whatever this is.', out: { text: s => `${Nc(s, 'security')} takes the page back.\n\n[[security]] "Fine, and I hope you're right, and if you're not, who d'you suppose finds out first? Me, at the stores door, after lamp-down."\n\nThe stores go unguarded for another month, and are lighter at the end of it.`, fx: s => ({ food: -60, tension: 8, do: s2 => { legit(s2, 6); const p = h.P(s2, 'security'); if (p) p.loyal = clamp(p.loyal - 8, 0, 100); } }) } },
  ] });
B(['murmurs', 'claim', 'crisis'], { id: 'ch.trial', x: true, tone: 'crisis', w: 3, title: 'The Trial',
  when: s => (LF.cv(s, 'suspicion') >= 40 || LF.cv(s, 'changed') >= 30) && !!accused(s),
  setup: s => { const a = accused(s), friend = LF.close(s, a)[0]; return Object.assign(TH.ctx(a.p), { why: a.why, guilty: a.guilty, friend: friend ? friend.name : '', k: LF.cv(s, 'suspicion') >= LF.cv(s, 'changed') ? 'suspicion' : 'changed' }); },
  text: (s, c) => `They want a trial, and they have chosen who. ${c.name}, who ${c.why}. Nobody can say what ${c.first} is supposed to have done. It has got this far ${TH.bec(s, c.k)}.\n\n${c.friend ? `${c.friend}, a friend of ${c.first}'s, has been to see you twice today.\n\n` : ''}[[security]] "I can keep order in the hall for a hearing or outside it without one, but both at once, for long? I wouldn't put money on it, and I'd like to know who picked the name before anybody picked the charge."`,
  choices: [
    { label: 'A hearing. Evidence, and somebody to speak for the accused', test: { base: 50, mods: [R('teacher', 10), R('chaplain', 5), If(s => T(s).legit >= 55, 10, 'They still accept your word')] },
      ok: { text: (s, c) => `Six hours. There is no evidence, and once that is said aloud in a full hall the case falls apart. ${c.first} walks out by the front door. Some of the crowd look ashamed, and some only disappointed.`, fx: (s, c) => ({ do: s2 => { legit(s2, 10); const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 15, 0, 100); p.marks.cleared = { d: s2.day, txt: 'was tried for nothing, and cleared' }; LF.emit(s2, 'hope', 'ch.trial', 30, 120, 'a hearing ended fairly'); } }) },
      bad: { text: (s, c) => `Six hours, and the hall gives its verdict without a reason. ${c.first} is found to be a danger, of a kind nobody can name, and is moved out of the shared pods to sleep alone.`, fx: (s, c) => ({ morale: -2, mark: [c.pid, 'convict', 'was tried for nothing, and convicted of it'], do: s2 => { legit(s2, -6); const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal - 30, 0, 100); for (const o of LF.close(s2, p)) o.loyal = clamp(o.loyal - 10, 0, 100); } }) } },
    { label: 'No trial. There is no charge', note: 'The crowd does not go home. It goes somewhere else.', out: { text: (s, c) => `You say it from the mess hall steps. ${c.first} is walked home by the watch. For the rest of the month there is a guard on that door, and people count the guard as proof. What the hall wanted to do, it does in smaller ways, to ${c.first} and to anyone seen talking to ${c.first}.`, fx: (s, c) => ({ morale: -2, do: s2 => { legit(s2, -7); const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 10, 0, 100); LF.emit(s2, 'suspicion', 'ch.notrial', 35, 200, `the officers would not let ${c.name} be tried`); } }) } },
    { label: (s, c) => `Let the hall have ${c.first}`, dark: true, note: 'A crowd that has been given what it came for goes home and stays there.', info: [['yield', 'Morale, and a quiet season'], ['danger', 'Somebody who did nothing']],
      out: { text: (s, c) => `You say that the colony may judge its own, and leave the steps. It takes the hall forty minutes. ${c.name} is hanged from the gantry by people who cannot say what for, and who are gentle with each other for months afterwards.${c.friend ? ` ${c.friend} cuts the body down alone.` : ''}`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'hanged by a hall that could not name the charge' }], morale: 9, tension: -18, flags: { blood_spilled: true }, stain: ['goat', 2], chron: `${c.name} was hanged by the assembly. No charge was ever written down.`,
          do: s2 => { legit(s2, 5); T(s2).scapegoat = s2.day; const p = byPid(s2, c.pid); if (p) for (const o of LF.close(s2, p)) o.loyal = clamp(o.loyal - 25, 0, 100); LF.emit(s2, 'fear', 'ch.rope', 40, 240, `${c.name} was hanged and nobody can say what for`); } }) } },
  ] });
/* Who a frightened colony picks: someone it can see is different. Often the wrong person. */
function accused(s) {
  const ok = p => p.alive && !p.away && !p.marks.cleared && !p.marks.convict;
  let p = s.people.find(x => ok(x) && x.secret && x.secret.k === 'host' && x.secret.known); if (p) return { p, why: 'is carrying the Passenger, and has never hidden it', guilty: true };
  p = s.people.find(x => ok(x) && x.marks.touched); if (p) return { p, why: p.marks.touched.txt, guilty: false };
  p = s.people.find(x => ok(x) && x.marks.cured); if (p) return { p, why: p.marks.cured.txt, guilty: false };
  p = s.people.filter(x => ok(x) && !x.role && x.loyal !== undefined).sort((a, b) => a.loyal - b.loyal)[0]; if (p) return { p, why: 'keeps apart, and always has', guilty: false };
  return null;
}
B(['murmurs', 'claim'], { id: 'ch.lists', x: true, tone: 'pressure', title: 'Two Lists',
  when: s => LF.cv(s, 'changed') >= 38,
  text: s => `The proposal comes up through the assembly with forty names on it. A register of the changed: who they are, where they sleep, which shifts they work. No penalties. ${LF.rn(s, 'x27')}, a fitter who speaks for the shifts, moved it.\n\n[[x27]] "Just so we know."\n\nIt has come to this ${TH.bec(s, 'changed')}. Half the hall is nodding, and the rest are working out which list they would be on.`,
  choices: [
    { label: 'One roll. Nobody is counted twice', note: 'The forty who asked will go on being afraid, and will act on it without a list.', out: { text: 'You have the colony roll read aloud, start to finish, as one list. The proposal is left on the table. Two nights later one of the changed is found behind the wash-house, badly beaten, by people who had decided for themselves who was on the second list.', fx: s => ({ morale: -1, do: s2 => { legit(s2, -4); T(s2).oneRoll = s2.day; } }) } },
    { label: 'A register, kept by the clinic and nobody else', note: 'There will be a list, and everyone will know there is, and nobody will know who is on it.', out: { text: s => `${h.Nwc(s, 'physician')} keeps it in the clinic safe. It is consulted twice in the first month, both times for good reasons. The third request comes from the watch, and is harder to refuse.`, fx: s => ({ do: s2 => { legit(s2, 5); LF.emit(s2, 'suspicion', 'ch.register', 25, 300, 'there is a register of the changed'); } }) } },
    { label: 'A register, a mark on the sleeve, and a pod of their own with a bolt on it', dark: true, note: 'The hall asked only to know. This lets it stop being afraid at night as well.', info: [['yield', 'The hall behind you'], ['danger', 'Everyone on the second list']],
      out: { text: s => `The register is read out, and the people on it are given a grey square to sew on and an hour to move their bedding. ${Nc(s, 'security')} shoots the bolt at ten. The rest of the colony sleeps better than it has all year, and in the morning steps round the grey squares in the wash queue.`,
        fx: s => ({ morale: 3, stain: ['brand', 2], do: s2 => { legit(s2, 12); LF.emit(s2, 'confinement', 'ch.pod', 40, 400, 'the changed are bolted in at night'); LF.emit(s2, 'schism', 'ch.register', 50, 400, 'the colony is two lists now, and one of them is locked in'); LF.emit(s2, 'resentment', 'ch.pod', 40, 400, 'people have family in the bolted pod'); },
          chron: 'The colony registered its changed, marked their sleeves, and bolted them in at night.' }) } },
  ] });

B(['murmurs', 'claim'], { id: 'ch.hold', tone: 'pressure', title: 'Who Holds It',
  // the keyholder: whoever holds that office now, which may be an officer who came down after the murmurs began; they become the claimant
  when: (s, t) => t.truth.fault === 'monopoly' && !!t.hold && !t.held && s.day - t.since > 30 && !!h.P(s, HOLD[t.hold].role) && h.P(s, HOLD[t.hold].role).loyal !== undefined,
  setup: s => { const t = T(s), p = h.P(s, HOLD[t.hold].role); t.claimant = p.id; p.known = p.known || s.day; return Object.assign(TH.ctx(p), { what: HOLD[t.hold].what, thing: HOLD[t.hold].thing }); },
  text: (s, c) => `${c.name} holds the only keys to ${c.what}, as the ${c.title} always has. Nobody has been refused ${c.thing} yet. But everyone has noticed who gets served first, and who is asked to come back tomorrow, and people have started bringing ${c.first} small presents.\n\n${LF.creed(byPid(s, c.pid))}`,
  choices: [
    { label: 'A second key, and a rota anyone can read', test: { base: 50, mods: [R('quartermaster', 10), If(s => (claimant(s) || {}).loyal >= 55, 15, 'The holder stands with you'), If(s => (claimant(s) || {}).loyal < 35, -15, 'The holder has turned against you')] },
      ok: { text: (s, c) => `The rota goes up on the mess hall board. ${c.first} hands over the second key in front of everyone and says, quite cheerfully, that it is a relief.`, fx: (s, c) => ({ do: s2 => { T(s2).held = s2.day; legit(s2, 10); } }) },
      bad: { text: (s, c) => `${c.first} hands over the second key and then goes sick for a month. Nothing goes out that month without a fight about it.`, fx: (s, c) => ({ morale: -3, do: s2 => { T(s2).held = s2.day; legit(s2, 2); const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal - 15, 0, 100); LF.emit(s2, 'scarcity', 'ch.hold', 35, 60, `${c.name} stopped the ${c.thing} for a month`); } }) } },
    { label: (s, c) => `Have the watch take the keys from ${c.first} tonight`, dark: true, note: (s, c) => `It ends in an hour what a rota would take a season to end. ${c.first} has broken no rule.`, out: { text: (s, c) => `The watch goes to ${c.first}'s bunk at two in the morning and comes back with the keys. In the morning there is a rota on the mess hall board and a guard on the door. ${c.first} keeps the title, and is not spoken to about it.`, fx: (s, c) => ({ stain: ['seized', 1], mark: [c.pid, 'stripped', 'had the keys of the office taken in the night by the watch'], do: s2 => { T(s2).held = s2.day; legit(s2, 6); const p = byPid(s2, c.pid); if (p) p.loyal = clamp(p.loyal - 25, 0, 100); } }) } },
    { label: (s, c) => `It is ${c.first}'s office. Leave it be, and see that the officers are served first`, dark: true, note: 'The people who run the colony will not go short. Everyone else will learn to bring presents.', out: { text: (s, c) => `Nothing changes, except that the officers stop waiting. Within a season, nothing important in the colony is decided without somebody first asking ${c.first}, and the crews have learned what a small present buys.`, fx: (s, c) => ({ stain: ['served_first', 1], do: s2 => { T(s2).held = s2.day; legit(s2, -8); for (const o of officers(s2)) o.loyal = clamp(o.loyal + 5, 0, 100); LF.emit(s2, 'dependency', 'ch.hold', 40, 500, `everything in the colony goes through ${c.name}`); LF.emit(s2, 'resentment', 'ch.hold', 25, 300, `${c.name} decides who gets ${c.thing}`); } }) } },
  ] });
B(['murmurs', 'claim', 'crisis'], { id: 'ch.extend', chain: true, tone: 'pressure', title: 'The Date on the Wall', repeat: 60,
  when: (s, t) => t.truth.fault === 'emergency' && !!t.emergency && !t.emergencyOver,
  setup: s => Object.assign(TH.ctx(h.P(s, 'security')), { k: ['fear', 'dark', 'siege', 'sickness', 'hunger', 'cold'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0][0] }),
  text: (s, c) => { const t = T(s), n = t.ext || 0; return `The date painted on the mess hall wall has nearly come round. ${h.Nwc(s, 'security')} has come with a new page, the same as the old one with the date left blank.\n\n[[security]] "${LF.cv(s, c.k) >= 35 ? `It's not over, ${TH.bec(s, c.k)}, and I won't pretend otherwise to make this easier to sign.` : 'It\'s quieter, yes. Funny how that happens when nobody\'s allowed to gather.'} ${n ? `That's the ${['', 'second', 'third', 'fourth', 'fifth'][n] || 'next'} time I've asked, and yes, I can hear how it sounds.` : 'Nine months more.'}"`; },
  choices: [
    { label: 'Nine months more. Paint the new date', out: { text: 'The old date is painted over and the new one goes up beside it. People have started keeping count of the painted-over dates.', fx: s => ({ do: s2 => { const t = T(s2); t.ext = (t.ext || 0) + 1; t.emergency = s2.day + 90; legit(s2, -4 - 2 * t.ext); LF.emit(s2, 'confinement', 'ch.powers', 25, 90, 'no more than six may gather without leave'); LF.emit(s2, 'resentment', 'ch.extend', 15 + 8 * t.ext, 200, 'the emergency keeps being renewed'); } }) } },
    { label: 'Let it lapse on the day', out: { text: (s, c) => `The date comes and the rules come down with it. ${c.pid ? c.first + ' takes the page back without a word, and is short with everyone for a month.' : 'The watch takes the page back without a word.'}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); t.emergency = s2.day; const p = h.P(s2, 'security'); if (p) p.loyal = clamp(p.loyal - 12, 0, 100); } }) } },
  ] });
LF.TAGS['ch.hold'] = ['order free', 'order', 'free'];
LF.TAGS['ch.extend'] = ['order severe', 'free'];

/* ======================= CRISIS ======================= */
B('crisis', { id: 'ch.night', chain: true, tone: 'crisis', title: 'The Night of the Keys',
  when: s => !!claimant(s),
  setup: s => Object.assign(TH.ctx(claimant(s)), { k: worst(s)[0], for: officers(s).filter(p => p.loyal >= 55).length, against: officers(s).filter(p => p.loyal < 40).length }),
  text: (s, c) => `${T(s).truth.fault === 'monopoly' && T(s).hold ? `${c.name} has locked ${HOLD[T(s).hold].what}, and will unlock ${T(s).hold === 'water' ? 'them' : 'it'} for a council the colony chooses, not for you. That was the start of it. At the change of the night shift` : T(s).truth.fault === 'emergency' ? 'At the change of the night shift, the watch that has been enforcing the emergency rules turns them on you. By morning' : 'Quietly, at the change of the night shift,'} the stores, the armoury and the reactor hall each have a new lock, and ${c.name} has the keys on a cord.\n\n[[${c.pid}]] "Nobody's hurt. Nobody's going to be. Tomorrow it all runs the same as today, just by people the colony picked."\n\n${c.against > c.for ? `Behind ${c.first} stand more of your officers than stand behind you.` : c.for ? `Of your officers, ${c.for === 1 ? 'one is' : `${TH.num(c.for)} are`} at your shoulder. The rest are waiting to see.` : 'None of your officers is at your shoulder. They are waiting to see.'}`,
  choices: [
    { label: 'Walk into the hall alone and ask for the keys', test: { base: 20, mods: [If(s => backing(s) >= 60, 15, 'Your officers stand with you'), If(s => backing(s) < 45, -10, 'Your officers have turned away'), If(s => T(s).legit >= 50, 15, 'People still accept that you decide'), If(s => !!T(s).promised && !s.flags.council, -10, 'The promise you made, and how it was kept')] },
      ok: { text: (s, c) => `It is a long walk. ${c.first} holds the cord out before you reach the end of it.\n\n[[${c.pid}]] "I thought more of them would stand up."\n\n${c.first} says it to nobody.`, fx: (s, c) => ({ morale: 4, chron: `${c.name} took the keys of the colony for one night, and gave them back.`, do: s2 => { legit(s2, 15); LF.endThread(s2, ID, 'kept'); const p = byPid(s2, c.pid); p.marks.spared = { d: s2.day, txt: 'took the keys, and handed them back' }; } }) },
      bad: { text: (s, c) => `It is a long walk, and at the end of it ${c.first} does not hold the cord out. You are thanked for your service by a room that means it. You keep your office, but the keys stay on ${c.first}\'s cord.`, fx: (s, c) => ({ morale: 3, flags: { council: true }, chron: `${c.name} took the keys of the colony, and the colony let it stand.`, do: s2 => { T(s2).legit = 30; LF.endThread(s2, ID, 'ousted'); } }) } },
    { label: (s, c) => `Offer ${c.first} an office: Speaker, with a vote`, out: { text: (s, c) => `It is argued until dawn and written on the back of a ration sheet. ${c.first} keeps one key. You keep two. Every decision after this one has a second signature on it.`, fx: (s, c) => ({ flags: { council: true }, chron: `${c.name} became the colony's first Speaker.`, do: s2 => { legit(s2, 10); LF.endThread(s2, ID, 'shared'); const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 25, 0, 100); p.marks.speaker = { d: s2.day, txt: 'became the first Speaker' }; } }) } },
    { label: s => T(s).truth.fault === 'emergency' ? 'Call the work crews out to take the armoury back' : 'The watch takes the armoury back', dark: true, note: 'Colonists with weapons, sent against colonists who have hurt nobody.', test: { base: 40, mods: [R('security', 10), If(s => T(s).truth.fault === 'emergency', -15, 'The watch is on the other side'), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker'), If(s => backing(s) < 45, -15, 'Your officers have turned away')] },
      ok: { text: (s, c) => `It is over in ten minutes and nobody fires. ${c.first} is in the tool store by morning. The locks are changed back. People step round the watch in the corridors now.`, fx: (s, c) => ({ morale: -1, flags: { crackdown: true }, stain: ['armoury', 1], mark: [c.pid, 'convict', 'took the keys, and was locked up for it'], chron: 'A seizure of the stores was put down by the watch.', do: s2 => { legit(s2, -10); LF.endThread(s2, ID, 'crushed'); byPid(s2, c.pid).loyal = 0; } }) },
      bad: { text: 'Somebody fires. Nobody afterwards agrees who. There are three people on the armoury floor, and one of them is the watch\'s own.', fx: (s, c) => ({ pop: -3, morale: -3, flags: { crackdown: true, blood_spilled: true }, stain: ['armoury', 2], chron: 'Colonists killed colonists over the keys to the stores.', do: s2 => { T(s2).legit = 20; LF.endThread(s2, ID, 'ousted'); } }) } },
  ] });
B('after', { id: 'ch.after', tone: 'quiet', title: 'Who Decides',
  when: (s, t) => s.day - t.endDay >= 110,
  text: s => ({ kept: `The locks are the old locks. ${claimant(s) ? claimant(s).name + ' is back on shift, and is nodded to.' : ''} Nobody has forgotten that the keys changed hands in one night shift.`,
    shared: 'Two signatures on everything. It is slower. Twice this season the second signature stopped something that would have been a mistake, and once it stopped something that would not.',
    crushed: 'The watch has doubled. Nobody has asked who decides for a season, and people keep their questions short.',
    settled: 'The list is in a drawer somewhere and nobody has asked for it, though the question on its first page was never answered.',
    ousted: 'You are consulted, and listened to with courtesy, by people who then decide without you.' }[T(s).end]),
  choices: [
    { label: s => ({ kept: 'Write it into the charter: how the chair can be asked for', shared: 'Make the Speaker\'s chair permanent', crushed: 'Stand the extra watch down', settled: 'Answer it anyway: write down how the chair can be asked for', ousted: 'Give them what you know, freely' }[T(s).end]),
      out: { text: 'It is written down and the page is dated.', fx: s => ({ morale: 3, do: s2 => { T(s2).legit = clamp(T(s2).legit + 10, 0, 100); } }) } },
    { label: 'Leave it as it stands', out: { text: 'Nothing is written down.', fx: {} } },
  ] });

/* ======================= EPISODES ======================= */
LF.ARC_VIEW.episode = 'people';
const E = st => LF.add(Object.assign({ arc: 'episode', view: 'people', x: true, w: 2, gap: 45, thread: null }, st));
E({ id: 'ep.equation', tone: 'crisis', title: 'The Cold Equation',
  when: s => !!s.threads && LF.cv(s, 'hunger') >= 60 && (LF.cv(s, 'dark') >= 50 || LF.cv(s, 'confinement') >= 40 || LF.cv(s, 'siege') >= 40),
  setup: s => ({ k: ['dark', 'siege', 'confinement'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0][0], n: Math.max(4, Math.round(LF.sized(s) / 9)) }),
  text: (s, c) => `${h.Nwc(s, 'quartermaster')} has done it three ways and it comes out the same. There is food for the colony less ${TH.num(c.n)}, and nothing more is coming in, ${TH.bec(s, c.k)}.\n\n[[quartermaster]] "It's equal shares and we all go weak together, or somebody decides who eats. I'll do the sums for you, but I won't do that part, not for you or anybody."`,
  choices: [
    { label: 'Equal shares, to the gram', test: { base: 50, mods: [R('quartermaster', 10), R('physician', 5)] },
      ok: { text: 'Everyone is hungry, all the time, in the same way. There are few complaints, because everyone can see the next plate is no fuller than theirs.', fx: { morale: 2, rations: 'tight' } },
      bad: { text: 'Everyone weakens together, and the first to die are the ones who were weakest to begin with.', fx: s => ({ pop: -3, morale: -2, rations: 'tight' }) } },
    { label: 'The officers go on quarter rations. Starting with you', test: { base: 40, mods: [If(s => backing(s) >= 60, 15, 'Your officers stand with you'), If(s => backing(s) < 45, -15, 'Your officers have turned away')] },
      ok: { text: 'Every officer eats at one table, where it can be watched. Nobody in the colony says a word against an officer for the rest of that season.', fx: s => ({ morale: 6, flags: { shared_hunger: true }, do: s2 => { if (T(s2)) legit(s2, 12); } }) },
      bad: { text: s => `Most of them do it. Two find reasons, and by nightfall everyone knows which two.`, fx: s => ({ morale: -2, do: s2 => { if (T(s2)) legit(s2, -8); LF.emit(s2, 'resentment', 'ep.equation', 35, 200, 'some of the officers ate while others starved'); } }) } },
    { label: (s, c) => `Write down ${TH.num(c.n)} names tonight, and put them out`, dark: true, note: 'It is the arithmetic done all the way to the end, while the ones chosen can still walk.', info: [['yield', 'Enough for everyone who is left'], ['danger', 'The ones on the list']],
      out: { text: (s, c) => `${Nc(s, 'quartermaster')} writes the list and you sign it. The ${TH.num(c.n)} are woken before the others and walked to the wire with a blanket and a day's food each. Some go quietly, to spare whoever they are leaving. At breakfast every bowl is full.`,
        fx: (s, c) => ({ leave: c.n, food: 140, morale: -9, stain: ['cull', 2], do: s2 => { if (T(s2)) legit(s2, -8); LF.emit(s2, 'fear', 'ep.equation', 45, 240, 'people were put out past the wire so the rest could eat'); LF.emit(s2, 'grief', 'ep.equation', 35, 200, 'the list was signed and carried out before breakfast'); },
          chron: `${TH.num(c.n).replace(/^./, x => x.toUpperCase())} colonists were put out past the wire so that the food would feed the rest.` }) } },
  ] });
E({ id: 'ep.hours', tone: 'pressure', title: 'Six Hours',
  when: s => !!s.threads && LF.cv(s, 'changed') >= 22 && LF.cv(s, 'unexplained') + LF.cv(s, 'suspicion') >= 40,
  text: s => `The whole night shift is six hours short. Nobody slept and nobody left their post. The logs are filled in, in their own handwriting, for work that was not done. The yard cameras ran all night and show nothing, because at ten o'clock each of them was turned to face the wall, from the inside.\n\nThey are as frightened by it as you are. Things like this happen here now, ${TH.bec(s, 'changed')}.`,
  choices: [
    { label: 'Go through every log, every reading, every door record', test: { base: 50, mods: [R('engineer', 10), R('physician', 5)] },
      ok: { text: 'By the reactor log, the night shift spent six hours doing something, together, that took a great deal of power and left nothing behind that anyone can find.', fx: s => ({ do: s2 => { const p = LF.T(s2, 'passenger'); if (p) p.insight = clamp(p.insight + 20, 0, 100); LF.emit(s2, 'unexplained', 'ep.hours', 40, 200, 'six hours are missing and nobody knows what was done in them'); } }) },
      bad: { text: 'You find nothing. Twenty people lost a night and nobody can say where it went.', fx: s => ({ morale: -1, do: s2 => { LF.emit(s2, 'fear', 'ep.hours', 35, 150, 'a whole shift lost six hours'); } }) } },
    { label: 'Split that shift up across the others', out: { text: 'They are spread across four crews. Within a month each of those crews has lost an hour or two of its own.', fx: s => ({ do: s2 => { const p = LF.T(s2, 'passenger'); if (p && !p.end) p.n = Math.min(s2.pop * 0.9, p.n + 4); LF.emit(s2, 'suspicion', 'ep.hours', 30, 200, 'nobody wants to work nights'); } }) } },
    { label: 'Lock the whole shift in the cold store until one of them remembers', dark: true, note: 'Twenty people know what they did for six hours. One of them can be made to say it.', info: [['yield', 'An answer'], ['danger', 'The night shift']],
      out: { text: s => `Twenty people, one bucket, no lamp. ${h.Nwc(s, 'security')} asks the same question through the door every four hours. On the third day one of them starts to answer, in a voice the others say is not that person's, and it is all written down. One of the older hands is dead when the door is opened.`,
        fx: s => ({ pop: -1, morale: -3, stain: ['trial', 1], do: s2 => { const p = LF.T(s2, 'passenger'); if (p) p.insight = clamp(p.insight + 30, 0, 100); if (T(s2)) legit(s2, -6); LF.emit(s2, 'fear', 'ep.hours', 40, 200, 'a whole shift was locked in the cold store to make it talk'); } }) } },
  ] });
E({ id: 'ep.guest', tone: 'pressure', title: 'The One Who Cannot Go Home',
  when: s => !!s.threads && LF.cv(s, 'strangers') >= 30 && (LF.cv(s, 'hunger') >= 40 || LF.cv(s, 'suspicion') >= 35 || LF.cv(s, 'sickness') >= 35 || LF.cv(s, 'fear') >= 45),
  setup: s => ({ k: ['hunger', 'suspicion', 'sickness'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0][0] }),
  text: (s, c) => `Somebody is living inside the wire who was not born to the colony and did not sleep on the ship: this is so ${TH.bec(s, 'strangers')}. It was a kindness, and nobody minded it while food and tempers were easier.\n\nThis month is harder ${TH.bec(s, c.k)}. There is a delegation at your door. They are not cruel people, but they want to know how long the guest is staying.`,
  choices: [
    { label: 'As long as they choose to stay. They are counted on the roll', out: { text: 'A name is added to the roll, spelled as nearly as anyone can manage. The delegation goes away. Two of them come back later, separately, to say they are glad.', fx: s => ({ pop: 1, morale: -1, do: s2 => { if (T(s2)) legit(s2, -3); } }) } },
    { label: 'They go now, with a pack and an escort to the ridge', dark: true, note: 'One mouth fewer this month, and somebody who trusted the colony put out of it.', out: { text: 'It is done decently, in daylight, with food for a fortnight. People line the wall to watch, and do not wave, and do not go in until there is nothing left to see.', fx: s => ({ food: 30, stain: ['turned_away', 1], do: s2 => { if (s2.cond.strangers) delete s2.cond.strangers; LF.emit(s2, 'grief', 'ep.guest', 20, 120, 'the colony turned someone out'); } }) } },
    { label: 'Tell the delegation it is their colony, and shut the door', dark: true, note: 'They will know what you have told them they may do.', info: [['yield', 'Morale'], ['danger', 'The guest']],
      out: { text: 'You say it and shut the door. The guest is found at the foot of the wall in the morning with a pack that was never opened. Nobody is charged, because nobody saw. The mess hall is easier that month, and the two who had been glad of the guest do not come to tell you anything again.',
        fx: s => ({ morale: 3, stain: ['guest', 2], do: s2 => { if (s2.cond.strangers) delete s2.cond.strangers; if (T(s2)) legit(s2, 3); LF.emit(s2, 'fear', 'ep.guest', 30, 200, 'the guest was found dead at the foot of the wall'); } }) } },
  ] });
LF.TAGS['ch.second'] = ['open mercy', 'free'];
LF.TAGS['ch.seat'] = ['free open', 'cautious'];
LF.TAGS['ch.list'] = ['free bold', 'free bold mercy', 'severe order'];
LF.TAGS['ch.powers'] = ['order cautious', 'order severe', 'free'];
LF.TAGS['ch.trial'] = ['free cautious', 'mercy free', 'severe order'];
LF.TAGS['ch.lists'] = ['open mercy', 'cautious', 'severe closed order'];
LF.TAGS['ch.night'] = ['bold', 'free mercy', 'order severe'];
LF.TAGS['ep.equation'] = ['mercy free', 'bold mercy', 'severe order'];
LF.TAGS['ep.hours'] = ['cautious open', 'cautious', 'severe order'];
LF.TAGS['ep.guest'] = ['open mercy', 'closed severe', 'severe closed'];
})();

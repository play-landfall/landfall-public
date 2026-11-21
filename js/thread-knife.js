/* Landfall — the Knife (Lachlan, 2026-11-15: more threads, at the same time, darker; DESIGN.md "Pressure").
   Someone inside the wire is trying to kill your officers, and since the officers have no alternates, every one they
   get is gone for good. It is the bill for what the colony has done: it wakes sooner the more stain there is, the note
   names the worst of it (LF.worst), and it feeds on resentment and suspicion from any other thread. Truth (secret): kin,
   one person whose family died by your order; officer, one of your own six; cell, five people who have agreed on it.
   Free: about the colony itself, no factor charged. Dice: LF.srand. No DOM. */
(function () {
'use strict';
const { h } = LF; const { N, Nc, F, R } = h;
const ID = 'knife', T = s => LF.T(s, ID);
const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1);
const here = s => LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(p => p && LF.seatState(s, p.seat) === 'here');
// the officer by first name; a stand-in with the post they stand in for, so the name means something
const watch = s => h.P(s, 'security') ? F(s, 'security') : LF.standIn && LF.standIn(s, 'security') ? h.Nw(s, 'security') : 'the watch captain';
// the target: an officer on the ground who isn't the one doing it (truth officer) and isn't Security, if possible
const target = (s, t) => { const a = here(s).filter(p => p.id !== t.mole); return a.find(p => p.seat !== 'security') || a[0] || null; };

LF.thread({ id: ID, free: true, name: 'The Knife', view: 'people',
  fits: s => 0.55,
  roll: s => ({ is: LF.spick(s, ['kin', 'kin', 'officer', 'cell']) }),
  sig: t => t.truth.is,
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'cut' ? 'the cut line' : 'the knife',
  clue: (s, t) => ({ txt: 'A page torn from a duty roster with six names on it. Some are crossed out. The ink is newer than the page.', learn: s2 => { const x = T(s2); if (x) x.lead = (x.lead || 0) + 1; } }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 140, 320), lead: 0, owned: 0, hit: [] }); },
  tick: (s, t) => { if (t.end || t.phase !== 'latent' || s.day % 5) return;
    if ((s.day >= t.wake || (s.day >= 90 && (s.flags.stain || 0) >= 10)) && here(s).length >= 2) {
      if (t.truth.is === 'officer') { const m = here(s).filter(p => p.seat !== 'command'); const p = m[Math.floor(LF.srand(s) * m.length)]; t.mole = p ? p.id : null; if (!p) t.truth.is = 'kin'; }
      LF.phase(s, ID, 'cut'); s.signs.push({ id: 'damage', d: s.day, src: 'th.knife' }); LF.cue(s, 'knf.cut', 0, 6); } },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ gap: 30, w: 2.6 }, st));

B('cut', { id: 'knf.cut', chain: true, tone: 'pressure', title: 'Cut Line',
  setup: s => { const p = target(s, T(s)); return { pid: p ? p.id : null, name: p ? p.name : 'One of the crew chiefs', first: p ? p.first : 'the crew chief' }; },
  text: (s, c) => `${c.name}'s safety line was cut most of the way through, on the inside where it wouldn't show. It parted on the reactor gantry this morning, four metres up. ${cap1(c.first)} caught a rail.\n\n[[security]] "That was a blade, and neatly done on the inside where it wouldn't show, so who's had that line in their hands since it was last checked? I want every name." "It's lovely work, mind, they took their time over it, and I don't like people who take their time."`,
  choices: [
    { label: 'Find out who', note: 'The watch asks around. Everyone will know they\'re asking.', hint: 'unknown', test: { base: 40, mods: [h.R('security', 10)] },
      ok: { text: s => `A blade with a fresh nick in it, in a tool roll that belongs to nobody. Not a name, but a place to start.`, fx: s => ({ do: s2 => { T(s2).lead++; next(s2); } }) },
      bad: { text: 'A week of questions and nothing. People start locking their pods. Someone scratches a mark on every officer\'s door in the night, the same mark.', fx: s => ({ morale: -2, do: s2 => { LF.emit(s2, 'fear', 'th.knife', 35, 150, 'somebody inside the wire is after the officers'); next(s2); } }) } },
    { label: 'A guard on every officer, day and night', note: 'Six people off the work crews, every shift, standing behind the officers.', hint: 'unknown', info: [['yield', 'The officers watched'], ['danger', 'The work, and how it looks']],
      out: { text: 'The guards start that night. The work crews are six short every shift, and people notice who gets guarded and who doesn\'t.', fx: s => ({ morale: -2, do: s2 => { T(s2).guard = s2.day; LF.emit(s2, 'resentment', 'th.knife', 25, 160, 'the officers walk about with guards and nobody else does'); next(s2); } }) } },
    { label: 'Round up everyone who has lost family to one of your orders', dark: true, note: 'It\'s somebody with a reason. You know who has a reason.', hint: 'unknown', info: [['yield', 'Whoever did it, probably among them'], ['danger', 'Everyone who already lost someone to you']],
      out: { text: s => `${cap1(watch(s))} has the list by the afternoon. Eleven people are taken out of the fields and put in the store pod under guard while their bunks are searched. Nothing is found. They're let out after nine days and none of them looks at you again.`, fx: s => ({ morale: -5, stain: ['rounded_up', 1], do: s2 => { LF.emit(s2, 'resentment', 'th.knife', 50, 260, 'the families of the colony\'s dead were locked up for nothing'); next(s2); } }) } },
  ] });
const next = s => { LF.phase(s, ID, 'note'); LF.cue(s, 'knf.note', 25, 50); };

B('note', { id: 'knf.note', chain: true, tone: 'pressure', title: 'For What You Did',
  setup: s => ({ why: 'someone is making the officers pay for what the colony has done', deed: LF.worst ? LF.worst(s) : 'the things that were done' }),
  text: (s, c) => `Someone has nailed a note to the officers' mess door with a ration fork.\n\n[[note:On the officers' mess door]] "FOR ${c.deed.toUpperCase()}."\n\nThe same hand that cut the line, by the look of it. ${here(s).length ? `${here(s)[0].first} pulls the fork out and keeps it.` : 'Nobody wants to touch it.'}\n\n[[security]] "Well, whoever it is can spell, and they had a ration fork and the mess door to themselves long enough to use them, so that's two things I know about them already."`,
  choices: [
    { label: 'Answer it in the mess hall. Say what was done, and why', note: 'You own it in front of everyone. Some will hate you more for saying it. Some will stop wanting to kill anyone for it.', hint: 'unknown', info: [['yield', 'Maybe it ends'], ['danger', 'Morale, and your standing']],
      out: { text: (s, c) => `You stand up after the evening meal and say it: ${c.deed}, who gave the order, and why. Nobody interrupts. Nobody claps. Three people walk out before you finish.`, fx: s => ({ morale: -4, tension: -8, do: s2 => { T(s2).owned = 1; strike(s2); } }) } },
    { label: 'Double the watch and say nothing', note: 'Everyone has read the note anyway.', hint: 'unknown', info: [['yield', 'The officers guarded'], ['danger', 'The work crews']],
      out: { text: 'The watch doubles. The note is burned. Everyone can still quote it.', fx: s => ({ morale: -2, do: s2 => { T(s2).guard = s2.day; strike(s2); } }) } },
    { label: 'Use it. A purge of anyone who has spoken against you', dark: true, note: 'Whoever wrote it, they\'re one of the people who complain. Take all of them.', info: [['yield', 'Every voice against you, silenced'], ['danger', 'Everyone who ever complained'], ['fail', 'An officer, when the knife comes again']],
      // a real roll since 2026-11-21 (Lachlan): did the purge catch the hand? Under the truth 'officer' it never does, whatever the dice say.
      test: { base: 50, mods: [R('security', 5)] },
      ok: { text: s => `The list is longer than anyone expected. Fourteen people lose their ration grade and are moved to the far pods. Three are put out past the wire. One of the three was the person who wrote the note. Nobody will ever know which.`, fx: s => ({ leave: 3, morale: -6, tension: -12, stain: ['purge', 2], do: s2 => { if (T(s2).truth.is !== 'officer') LF.endThread(s2, ID, 'purged', 'The colony purged its critics, and the attacks on the officers stopped.'); else strike(s2); } }) },
      bad: { text: s => `The list is longer than anyone expected. Fourteen people lose their ration grade and are moved to the far pods. Three are put out past the wire, and none of them wrote the note. The hand that did is still inside, and has watched you do it.`, fx: s => ({ leave: 3, morale: -6, tension: -12, stain: ['purge', 2], do: s2 => { strike(s2); } }) } },
  ] });
const strike = s => { LF.phase(s, ID, 'strike'); LF.cue(s, 'knf.strike', 20, 45); };

B('strike', { id: 'knf.strike', chain: true, tone: 'crisis', title: 'The Knife',
  setup: s => { const p = target(s, T(s)); return { pid: p ? p.id : null, name: p ? p.name : null, first: p ? p.first : null, seat: p ? p.seat : null, guard: !!T(s).guard, owned: !!T(s).owned }; },
  text: (s, c) => c.pid ? `${cap1(watch(s))} wakes you before dawn. The pattern's clear now: whoever it is will go for ${c.name} next, and soon, probably tonight.${c.guard ? ' The guards are tired and everybody knows their rota.' : ''}\n\n[[security]] "I can sit up with ${c.first} myself, or we put someone out as bait, or we lock every officer in the armoury and let them try the doors. Whichever you pick, keep it between the two of us, because whoever this is knows the rota better than I'd like."` : `${cap1(watch(s))} wakes you before dawn. Whoever it is has run out of officers to go for, and has started on the people closest to them.`,
  choices: [
    { label: c => 'Sit up with them, armed', note: 'The watch\'s best, in the dark, waiting. If it goes wrong, it goes wrong in the room.', hint: 'unknown', test: { base: 50, mods: [h.R('security', 10), h.If((s, c) => c.guard, 5, 'The guards were already posted'), h.If((s, c) => c.owned, 10, 'You owned what was done')] },
      ok: { text: (s, c) => `Just after three a figure comes through the vent, not the door. There's a scuffle in the dark and a lot of noise. ${c.first ? cap1(c.first) + ' is cut on the arm and alive.' : 'Nobody is killed.'} The figure is on the floor, in irons.`, fx: (s, c) => ({ do: s2 => { T(s2).caught = 1; found(s2); } }) },
      bad: { text: (s, c) => `It happens in the twenty minutes between one guard and the next. ${c.name ? `${c.name} is found in the morning` : 'A crew chief is found in the morning'}, very still, and whoever did it is gone.`, fx: (s, c) => ({ kill: c.pid ? { who: c.pid, cause: 'killed in the night by the knife' } : null, pop: c.pid ? 0 : -1, morale: -6, do: s2 => { T(s2).hit.push(c.pid); found(s2); } }) } },
    { label: 'Use someone as bait', dark: true, note: (s, c) => `A field hand in ${c.first ? c.first + '\'s' : 'an officer\'s'} bunk, in ${c.first ? c.first + '\'s' : 'the officer\'s'} coat, who hasn't been told why. The watch waits outside.`, hint: 'unknown', info: [['yield', 'The officer safe, and the knife caught'], ['danger', 'Whoever is in the bunk']],
      out: { text: s => `The field hand is asleep in the officer's bunk when the knife comes. The watch is through the door ten seconds after the scream, which is ten seconds too late. The one with the knife doesn't get out of the room.`, fx: s => ({ pop: -1, morale: -3, stain: ['decoy_ours', 2], do: s2 => { T(s2).caught = 1; found(s2); } }) } },
    { label: (s, c) => c && c.pid ? 'Lock every officer in the armoury, every night' : 'Lock the officers and everyone close to them in the armoury, every night', note: 'They\'ll be safe. Whoever wants blood will find somebody else.', hint: 'unknown', info: [['yield', 'The officers safe'], ['danger', 'Whoever is near them instead']],
      out: { text: s => `The officers sleep behind the armoury door for a month. In the third week the stores clerk who keeps the armoury key is found in the yard with their throat cut, and the key is gone.`, fx: s => ({ pop: -1, morale: -5, do: s2 => { LF.emit(s2, 'fear', 'th.knife', 50, 180, 'the knife killed the armoury clerk when it couldn\'t reach the officers'); found(s2); } }) } },
  ] });
const found = s => { LF.phase(s, ID, 'found'); LF.cue(s, 'knf.hand', 10, 30); };
const pit = s => LF.has(s, 'smelter');   // the deep pit is the smelter's ore working: no pit to send anyone down before it stands

B('found', { id: 'knf.hand', chain: true, tone: 'crisis', title: 'Whose Hand',
  setup: s => { const t = T(s), m = t.mole && h.byPid(s, t.mole), is = t.truth.is === 'officer' && m && m.alive ? 'officer' : t.truth.is === 'officer' ? 'kin' : t.truth.is;
    const k = LF.cast(s, { low: true, free: true });
    return { is, pid: is === 'officer' ? m.id : k ? k.id : null, name: is === 'officer' ? m.name : k ? k.name : LF.rn(s, 'x44'), first: is === 'officer' ? m.first : k ? k.first : LF.rf(s, 'x44'), seat: is === 'officer' ? m.seat : null, caught: !!t.caught, deed: LF.worst ? LF.worst(s) : 'what was done' }; },
  text: (s, c) => (c.caught ? '' : 'It takes the watch another month, and a confession from somebody who saw a light. ')
    + (c.is === 'officer' ? `It's ${c.name}, your own ${LF.title(h.byPid(s, c.pid))}. ${cap1(c.first)} doesn't deny it.\n\n[[${c.pid}]] "Somebody had to answer for ${c.deed}. You weren't going to."`
      : c.is === 'cell' ? `It's five of them. ${c.name} speaks for the rest.\n\n[[${c.pid || 'x44'}]] "We drew lots for who'd do it. We'd do it again. Ask them about ${c.deed} and see if they sleep."`
      : `It's ${c.name}. Someone in ${c.first}'s family died because of ${c.deed}.\n\n[[${c.pid || 'x44'}]] "I wasn't going to stop at one. I want you to know that. I wanted all of you."`),
  choices: [
    // Four answers, three on screen: the killing one is the rope until the smelter stands, and the ore pit under it after (pit).
    { label: (s, c) => c.is === 'cell' ? 'Hang the five' : `Hang ${c.first}`, dark: true, show: s => !pit(s), note: (s, c) => c.is === 'officer' ? `${LF.SEATS[c.seat].name} loses its officer.` : 'At the pad, at dawn, in front of everyone. Nobody will try it again.', hint: 'unknown', info: (s, c) => [['yield', 'It ends'], ['danger', c.is === 'officer' ? 'Your own officer' : c.is === 'cell' ? 'Five people' : 'One person']],
      out: { text: (s, c) => `${c.is === 'cell' ? 'Five ropes' : 'One rope'} at the pad at dawn. The whole colony is there. Nobody says anything, before or after.`, fx: (s, c) => ({ kill: c.pid ? { who: c.pid, cause: 'hanged for the knife' } : null, pop: c.is === 'cell' ? -4 : c.pid ? 0 : -1, tension: -15, morale: -2, stain: ['hanged_knife', c.is === 'cell' ? 2 : 1], do: s2 => LF.endThread(s2, ID, 'hanged', 'The one who had been killing the officers was hanged.') }) } },
    { label: (s, c) => c.is === 'cell' ? 'Put the five out past the wire' : `Put ${c.first} out past the wire`, note: 'With nothing. If they come back, they come back with whatever\'s out there.', hint: 'unknown', info: (s, c) => [['yield', 'It ends, probably'], ['danger', 'Whoever is put out'], ['later', 'Whoever they find']],
      out: { text: (s, c) => `${c.is === 'cell' ? 'They walk' : `${cap1(c.first)} walks`} out at noon without looking back. For a while there are tracks along the wire at night.`, fx: (s, c) => ({ depart: c.pid && c.is === 'officer' ? { who: c.pid, cause: 'put out past the wire for the knife' } : null, leave: c.is === 'cell' ? 5 : c.is === 'officer' ? 0 : 1, morale: -2, do: s2 => { LF.emit(s2, 'watched', 'th.knife', 30, 200, 'someone the colony put out is walking the wire at night'); LF.endThread(s2, ID, 'exiled', 'The one who had been killing the officers was put out past the wire.'); } }) } },
    { label: 'Pardon them, in front of everyone', note: (s, c) => `They were right about ${c.deed}. Saying so might be worth more than a rope. Or it might be the first of many.`, hint: 'unknown', info: [['yield', 'Maybe the colony forgives you too'], ['fail', 'The officers']],
      test: { base: 30, mods: [h.R('command', 10), h.If((s, c) => !!(T(s) && T(s).owned), 15, 'You owned what was done, in front of everyone')] },
      ok: { text: (s, c) => `You say it in the mess hall: they were right, and you were wrong, and nobody hangs for it. It's the quietest the hall has been in a year. Afterwards people come up to shake your hand, and some of them are crying.`, fx: s => ({ morale: 8, tension: -20, do: s2 => LF.endThread(s2, ID, 'pardoned', 'The one who had been killing the officers was pardoned, and the colony was quiet after.') }) },
      bad: { text: (s, c) => `The pardon is heard as weakness. Within the month there's a second note on the mess door, in a different hand.`, fx: s => ({ morale: -4, do: s2 => { LF.emit(s2, 'resentment', 'th.knife', 45, 260, 'the officers can be killed and the killer let off'); LF.endThread(s2, ID, 'pardoned', 'The one who had been killing the officers was pardoned, and others took note.'); } }) } },
    { label: 'Work them to death in the deep pit', dark: true, show: s => pit(s), note: 'Slower than a rope, and useful. The colony needs the ore.', hint: 'unknown', info: [['yield', 'Materials, and an example'], ['danger', 'Whoever is sent down']],
      out: { text: (s, c) => `${c.is === 'cell' ? 'The five go' : `${cap1(c.first)} goes`} down the pit in chains and doesn't come up except to sleep. The ore comes up steadily. Before the year is out the chains are on somebody else.`, fx: (s, c) => ({ mat: c.is === 'cell' ? 140 : 50, kill: c.pid ? { who: c.pid, cause: 'worked to death in the pit for the knife' } : null, pop: c.is === 'cell' ? -4 : c.pid ? 0 : -1, morale: -3, stain: ['worked_out', 2], do: s2 => LF.endThread(s2, ID, 'worked', 'The ones who had been killing the officers were worked to death in the pit.') }) } },
  ] });

LF.TAGS['knf.cut'] = ['order', 'cautious order', 'severe order closed'];
LF.TAGS['knf.note'] = ['open mercy', 'order', 'severe order closed'];
LF.TAGS['knf.strike'] = ['bold', 'severe', 'cautious'];
LF.TAGS['knf.hand'] = ['severe order', 'severe', 'mercy open', 'severe order'];
Object.assign(LF.DEEDS || {}, { rounded_up: 'the families locked up because they had reason to hate you', hanged_knife: 'the hanging for the knife' });
})();

/* Landfall — frames: hand-written situations with slots, instantiated by gen.js against a world's factors.
   Per kind: stage 1 first sign, 2 first blood, 3 the long middle (repeats, several frames), 4 reckoning, 5 echo.
   Slots (x): n/N name, one, K.form/sign/habit/wants/weak, st (what is at stake), lead/Lead/leadF,
   they/They/them/their/are/have (agreement), f (the factor), s (state), target, titles.
   Choice: ap (force|study|accord|exploit|avoid), l label, n note, v value tags (defaults from ap), b base odds,
   m roles that help, cost, show/req, ok/bad/out: [text, fx]. fx.f adjusts the factor; fx.lose costs the stake.
   Three options at most (Lachlan, 2026-11-21): a frame shows three of its own at most, two where nothing is a gamble and
   one of three would be the weak one. A fourth may be written only as one of a pair with opposite `show`s (never both on
   screen), or as a `spare` (the note for later, shown only when everything else is locked). The generator's one extra
   (help, leverage, the dark proposal) takes the seat of the frame's last dark option, or of its last option: list a
   frame's choices so that the one that can give way comes last. Frames that send a party out take no extra. */
(function () {
'use strict';
/* Who speaks on a frame (DESIGN.md "Who is speaking"): the frame's lead, by person id, or the post itself when nobody holds it,
   so the stand-in for that department says it. People from another human group speak through their envoy (the roster's outsiders). */
const F = (kind, stage, fr) => { const t = fr.text, l0 = (fr.lead || ['security'])[0];
  if (typeof t === 'function') fr.text = x => { x.who = x.leadP ? x.leadP.id : l0; return t(x); };
  return LF.frame(kind, stage, fr); };
const them = x => x.f && x.f.sub === 'feral' ? 'x59' : 'x38';   // the machine-raised (none over thirty) have their own speaker, Spindle (roster of sixty, 2026-11-20)
const T = x => /^the [A-Z]/.test(x.n) ? x.N : x.N.replace(/^The /, '').replace(/^./, c => c.toUpperCase());
const knows = x => x.f.insight >= 20;
/* What the stake reads as in a sentence. x.st is gen.js's phrase for it: a place or a thing, a person's name ('person'), a crew
   ('crew') or "the colony's nerve" ('morale'), and most frames take whichever the factor's stakes roll. who: a person with
   their work said, so the name means something; obj: something that can be come for, found or reached; at: somewhere a thing
   can stand or work; thing: something that can be taken, shared or planned for; mend: what a piece of ground would make whole. */
const who = x => { const p = x.stake && x.stake.pid && LF.h.byPid(x.s, x.stake.pid); if (!p) return x.st;
  return p.role && p.seat ? p.name : `the ${String(LF.speaker(x.s, p.id).post || 'colonist').split(',')[0].toLowerCase()} ${p.name}`; };
const tk = x => (x.stake && x.stake.t) || 'morale';
const obj = x => tk(x) === 'morale' ? 'the mess hall' : tk(x) === 'person' ? who(x) : x.st;
const at = x => tk(x) === 'morale' ? 'the mess hall' : tk(x) === 'person' ? `${x.st}'s pod` : tk(x) === 'crew' ? `${x.st}'s ground` : x.st;
const thing = x => ['food', 'mat', 'machine', 'project'].includes(tk(x)) ? x.st : 'the stores';
const mend = x => ['food', 'mat', 'machine', 'project'].includes(tk(x)) ? x.st : 'the colony';
const up = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ======================= FAUNA ======================= */
F('fauna', 1, { id: 'fauna.sign', tone: 'pressure', lead: ['security', 'xenobio'], title: x => `${T(x)}: First Sign`,
  text: x => `${x.Lead} wakes you before dawn to show you ${x.K.sign}.\n\nWhatever is out there is ${x.K.form}. The crews are already saying "${x.n.slice(4)}".`,
  ask: x => `Do you set traps for ${x.them} and arm the watch, watch ${x.them} with cameras first, or pull the camp in behind lights?`,
  choices: [
    { ap: 'force', l: 'Arm the watch and lay traps', b: 50, m: ['security'],
      ok: [x => `The traps take two in the first week. The rest pull back beyond the lights and stay there, watching.`, {}],
      bad: [x => `The traps are found sprung and empty. Something has been testing them, one at a time.`, { lose: 0.5 }] },
    { ap: 'study', l: 'Cameras, and patience', out: [x => `The cameras run for a month. The footage shows they ${x.K.habit}, and as far as anyone can tell they want ${x.K.wants}.`, {}] },
    { ap: 'avoid', l: 'Pull the perimeter in and light it', cost: { mat: 15 }, out: [x => `The camp is smaller now, and brightly lit. Outside the light, things move about as they please.`, { f: { wall: 1 } }] },
  ] });
F('fauna', 2, { id: 'fauna.blood', tone: 'crisis', lead: ['security', 'physician'], title: x => `${T(x)}: First Blood`,
  text: x => `${x.N} came in the night for ${obj(x)}, and this was no probe. They ${x.K.habit}, and now they have done it here.\n\n${x.Lead} wants an answer before dark.`,
  ask: x => `Whose lives do you spend to stop ${x.n}: the sick list on a hunt, the outer pods left outside a wall, or someone put out past the wire at night?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Hunt them down, with every hand that can carry. The sick list too', n: 'The hunt needs numbers more than it needs fitness.', b: 50, m: ['security'], ok: [x => `Forty go out, eleven of them off the sick list. The hunt is out three days and comes back with proof. Two from the sick list were left where they sat down.`, { pop: -2, stain: ['driven', 2], f: { threat: -32 } }], bad: [x => `Something turns the hunt around in the hills, and the slow ones are what it catches.`, { lose: 1, stain: ['driven', 1] }] },
    { ap: 'avoid', dark: true, v: 'severe closed', l: 'Wall in the core. The outer pods take their chances', cost: { mat: 25 }, out: [x => `The wall goes round the core in four days. The two outer pods are outside it, and the people in them are told there was not the plate. ${x.They} circle for the rest of the month and go. One of the outer pods is empty by then.`, { pop: -2, stain: ['shut_out', 2], f: { threat: -12, wall: 1 } }] },
    // one or the other, never both: once the colony knows what they cannot stand, the lock-up tends it; until then it is the wounded
    { ap: 'exploit', dark: true, v: 'severe order', l: x => `They cannot stand ${x.K.weak}. The lock-up tends it, outside the wire, every night`, show: knows, b: 70, m: ['engineer'], ok: [x => `It works. Three from the lock-up take the post in turns, alone outside the wire from dusk. Two of them are still doing it at the end of the season.`, { pop: -1, stain: ['expend', 1], f: { threat: -30, accord: 0, insight: 10 } }], bad: [x => `It works for one night. On the second they come in from the side where it isn't, and the prisoner tending it is the first thing they reach.`, { pop: -1, lose: 0.5, stain: ['expend', 1] }] },
    { ap: 'exploit', dark: true, v: 'severe', show: x => !knows(x), l: 'Put one of the wounded out past the wire, and wait', n: 'There is one in the clinic who will not see the week out either way.', b: 70, m: ['security'],
      ok: [x => `The one who was not going to last the week is carried out on a stretcher at dusk, with the watch dug in on three sides. Nine of ${x.them} come to the sound. None of them leave.`, { pop: -1, stain: ['bait_live', 2], f: { threat: -30, harm: 35, kills: 0 } }],
      bad: [x => `They take the stretcher and are gone before the first shot. The watch walks back in without it.`, { pop: -1, morale: -5, stain: ['bait_live', 2], f: { threat: 8 } }] },
  ] });
F('fauna', 3, { id: 'fauna.season', tone: 'pressure', lead: ['security', 'botanist'], needs: ['fighters', 'guides', 'weapons'], title: x => `${T(x)}: Another Season`,
  text: x => `${x.N} are back, and this time they are working at ${at(x)}, by day, in the open.\n\n[[${x.who}]] "They've stopped being scared of us." "Which means they learned something, and I'd like to know what, because it wasn't from anything we meant to teach them."`,
  ask: x => `Do you cull ${x.n} with the field crews as beaters, feed ${x.them} well away from camp, or hunt ${x.them} for meat with the lock-up eating it first?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'A cull, with the field crews walking the line as beaters', b: 50, m: ['security'], ok: [x => `It takes a week and most of the ammunition. The field crews walk the line unarmed to drive ${x.them} onto the guns, and one of the beaters is slow.`, { parts: -2, pop: -1, stain: ['driven', 1], f: { threat: -10 } }], bad: [x => `They scatter, regroup, and come back through the one gap nobody was watching.`, { lose: 1, parts: -2, stain: ['driven', 1] }] },
    { ap: 'accord', l: 'Feed them, well away from the camp', cost: { food: 150 }, v: 'mercy', b: 50, m: ['xenobio'], ok: [x => `You set up a feeding ground two kilometres off and they take to it, so for the first time you know where to find them.`, {}], bad: [x => `They take the food, and then they follow the cart back to camp.`, { lose: 0.5 }] },
    { ap: 'exploit', dark: true, v: 'severe order', l: 'Hunt them for meat. The lock-up eats it first', b: 50, m: ['security'], ok: [x => `The meat is gamey and purple, and there are three weeks of it. Two prisoners ate it for four days before anyone else was served.`, { food: 320, stain: ['taster', 1], f: { harm: 20, threat: -8 } }], bad: [x => `The first one cooked puts both prisoners in the clinic, and one of them stays there.`, { pop: -1, stain: ['taster', 1] }] },
  ] });
F('fauna', 3, { id: 'fauna.young', tone: 'opportunity', lead: ['xenobio', 'security'], title: x => `${T(x)}: The Nest`,
  text: x => `A survey party has found where ${x.n} breed: much too close, and unguarded for the moment. Dozens of young, not yet able to do harm.\n\n${x.Lead} radios for instructions. There is not much time.`,
  ask: x => `Do you destroy the nest of ${x.n}, keep two of the young and kill the rest, or mark it on the map and leave?`,
  choices: [
    { ap: 'force', dark: true, l: 'Destroy it', v: 'severe closed', b: 70, m: ['security'], ok: [x => `It takes ten minutes, with shovels, to save ammunition. The party does not talk about it afterwards.`, { stain: ['nest', 1], f: { harm: 45, threat: -18 } }], bad: [x => `The adults were not as far off as they looked.`, { lose: 1, stain: ['nest', 1], f: { harm: 20 } }] },
    { ap: 'study', dark: true, l: 'Take two alive, and kill the rest so the two have nothing to go back to', v: 'open severe', out: [x => `The two imprint on the first thing that feeds them, which turns out to be ${x.leadF}. The rest are dealt with before the party leaves.`, { stain: ['nest', 1], f: { insight: 38, accord: 10, harm: 30, threat: -10 } }] },
    { ap: 'avoid', l: 'Mark it on the map and leave', n: 'Next season every one of them will be grown.', out: [x => `The party backs away. Next season there are more of them, and the first thing they take is a child from the field edge.`, { pop: -1, f: { threat: 10 } }] },
  ] });
F('fauna', 4, { id: 'fauna.reckoning', tone: 'crisis', lead: ['security', 'engineer'], needs: ['fighters', 'weapons', 'guides'], stakes: ['crew', 'food', 'machine'], title: x => `${T(x)}: Reckoning`,
  text: x => `Every watch post reports at once. ${x.N}, all of them, more than anyone knew there were.\n\nThey are coming through ${x.st} and they are not stopping there.`,
  ask: x => `How do you hold against all of ${x.n}, and who pays for it: the children carrying for the line, or whoever is outside when the doors are barred?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Everyone at the line, and the children carrying for it', n: 'There are not the adults to hold the line and carry to it as well.', cost: { parts: 4 }, b: 40, m: ['security', 'engineer'], ok: [x => `The fighting lasts until dawn, with the eleven-year-olds running boxes up the trench. Two of the runners are among the dead. None of ${x.n} are left to come back.`, { pop: -2, stain: ['child_watch', 2], f: { resolve: 'destroyed' }, morale: 2 }], bad: [x => `The line holds in three places and breaks in the fourth, where the runners were.`, { lose: 1.5, stain: ['child_watch', 2], f: { threat: -30 } }] },
    { ap: 'accord', dark: true, v: 'severe open', l: 'Feed them off the line. The cold room first, then the burial ground', show: x => x.f.insight >= 35 || x.f.accord >= 25, b: 40, m: ['xenobio'], ok: [x => `The dead are carried to a place two kilometres off, the fresh ones first and then the graves. ${x.They} learn to go there. Every death in the colony from now on is carried out to the same place.`, { morale: -4, stain: ['bait', 2], f: { resolve: 'accord' } }], bad: [x => `${x.They} eat what is laid out, and follow the carts home.`, { lose: 1, stain: ['bait', 1], f: { threat: -20 } }] },
    { ap: 'avoid', dark: true, v: 'severe closed', l: 'Hold the core. Bar the doors on the count, whoever is still outside', out: [x => `The core doors are barred on the count, with four still outside who could not reach them in time. The walls hold. In the morning the outer works are quiet.`, { lose: 0.5, pop: -4, stain: ['shut_out', 2], f: { threat: -40, wall: 1 } }] },
  ] });

/* ======================= FLORA ======================= */
F('flora', 1, { id: 'flora.sign', tone: 'pressure', lead: ['botanist', 'engineer'], title: x => `${T(x)}: First Sign`,
  text: x => `${x.Lead} brings you out to look at ${x.K.sign}.\n\nThe cause is ${x.K.form}. It was not here last month, and the crews are calling it ${x.n.slice(4)}.`,
  ask: x => `Do you burn ${x.n} out while it is small, leave a patch to learn what it is, or clear a firebreak around the camp?`,
  choices: [
    { ap: 'force', l: 'Burn it out, now, while it is small', b: 60, m: ['botanist'], ok: [x => `It takes a day with torches, and leaves the ground black and clean.`, {}], bad: [x => `It burns well enough, but a month later it is back in four places instead of one.`, { f: { threat: 12 } }] },
    { ap: 'study', l: 'Leave a patch and learn what it is', out: [x => `The patch shows that it ${x.K.habit}. It is after ${x.K.wants}, and it does not like ${x.K.weak}.`, {}] },
    { ap: 'avoid', l: 'Clear a firebreak around the camp', cost: { mat: 15 }, out: [x => `The bare strip has to be raked every day, for as long as the camp stands.`, { f: { wall: 1 } }] },
  ] });
F('flora', 2, { id: 'flora.reach', tone: 'crisis', lead: ['engineer', 'botanist'], title: x => `${T(x)}: Inside the Wire`,
  text: x => `Overnight, ${x.n} reached ${at(x)}. Nobody saw it arrive.\n\n[[${x.who}]] "I can cut it out of the wire, two days if nobody gets in my way. All of it, though? I wouldn't promise that."`,
  ask: x => `Do you cut ${x.n} out of the wire with an unmasked crew, or tell the crews it is contained and watch how it spreads?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Cut and burn now. The crew works unmasked', n: 'There is no time to print filters for a cutting crew.', b: 50, m: ['engineer'], ok: [x => `After two days of ugly work it is gone from inside the wire. Three of the cutters are coughing by the end, and one does not stop.`, { mat: -10, pop: -1, stain: ['detail', 2], f: { threat: -10 } }], bad: [x => `It was deeper in than it looked, and the cutters breathed it for nothing.`, { lose: 1, pop: -1, stain: ['detail', 2] }] },
    { ap: 'exploit', dark: true, v: 'severe order', l: x => `Try ${x.K.weak} on it. The lock-up carries it in by hand`, show: knows, b: 70, m: ['botanist'], ok: [x => `It shrivels back like a hand from a stove. The four from the lock-up who carried it in are burned to the elbow.`, { stain: ['expend', 1], f: { threat: -30, accord: 0 } }], bad: [x => `It works wherever it is put, but there isn't enough to put it everywhere, and the four who carried it are burned to the elbow.`, { lose: 0.5, stain: ['expend', 1] }] },
    { ap: 'study', dark: true, v: 'severe cautious', l: x => `Tell the crews it is contained, and watch how it takes ${at(x)}`, out: [x => `The crews are told it is contained and sent back to work beside it. The time-lapse shows exactly how it takes hold. On the ninth day it shows it taking hold of someone's boot, and then the rest.`, { lose: 0.5, pop: -1, stain: ['all_clear', 2], f: { insight: 50 } }] },
  ] });
F('flora', 3, { id: 'flora.creep', tone: 'pressure', lead: ['botanist', 'engineer'], needs: ['knowledge', 'guides', 'labour'], title: x => `${T(x)}: The Slow War`,
  text: x => `${x.N} never attacks; it just keeps spreading. This month it is ${at(x)}, and the crews holding it back can't do anything else.\n\n${x.Lead} has drawn up a labour chart, and it looks bad.`,
  ask: x => `Do you burn a belt against ${x.n}, cede ${x.them} half the valley, or put the lock-up on the belt unmasked?`,
  choices: [
    { ap: 'force', l: 'A scorched belt, a kilometre deep', cost: { mat: 20 }, b: 50, m: ['botanist'], ok: [x => `The belt holds. From the mast you can see the black line of it running round the colony.`, { f: { wall: 1 } }], bad: [x => `It crosses the belt underground.`, { lose: 1 }] },
    { ap: 'accord', l: 'Cede it one side of the valley, and hold the other', v: 'open cautious', b: 50, m: ['xenobio'], ok: [x => `It spreads into the side you gave it and, so far, stays there.`, { yield: -0.04 }], bad: [x => `It fills the side you gave up and keeps coming.`, { lose: 0.5 }] },
    { ap: 'force', dark: true, v: 'severe order', l: 'Give the belt to the punishment detail, unmasked, until it is cut back', n: 'There are no masks to spare and no crews. There is a lock-up.',
      out: [x => `The lock-up is emptied onto the belt and worked in shifts with the watch standing upwind. It is cut back further than it has been all year, and the field crews go back to the fields. Three of the detail are buried before the season turns, and what they died of is not written down.`, { pop: -3, morale: -3, stain: ['detail', 2], f: { threat: -28, harm: 20 } }] },
  ] });
F('flora', 3, { id: 'flora.bloom', tone: 'opportunity', lead: ['xenobio', 'botanist'], title: x => `${T(x)}: In Flower`,
  text: x => `For a few days ${x.n} has stopped growing and started producing something: fruit, seed, spore, nobody is sure.\n\n[[${x.who}]] "Look at it, look, it's put everything into this." "So it's weak right now, or it's breeding, or both, no wait, definitely both, I need samples."`,
  ask: x => `While ${x.n} ${x.are} in flower, do you burn ${x.them} everywhere with masks for only half, collect what ${x.they} make, or feed it to the lock-up to see if it can be eaten?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Hit it now, everywhere at once, masks or no masks', b: 60, m: ['botanist'], ok: [x => `Everyone turns out with torches, and by the end of the month it has been set back years. There were masks for half of them, and one of the other half is in the clinic for good.`, { pop: -1, stain: ['detail', 1], f: { harm: 45, threat: -30 } }], bad: [x => `Burning it spreads whatever it was making on the smoke, into the half who had no masks.`, { lose: 1, stain: ['detail', 1], f: { threat: 15 } }] },
    { ap: 'study', l: 'Collect what it is making', out: [x => `Under the scope it shows how the whole organism works. ${x.Lead} doesn't sleep for three days.`, { f: { insight: 40 } }] },
    { ap: 'exploit', dark: true, l: 'Feed it to the lock-up, and see', v: 'bold severe', b: 50, m: ['physician'], ok: [x => `It can be eaten. The four who found that out were not asked, and are well.`, { food: 340, stain: ['taster', 1], f: { accord: 10 } }], bad: [x => `Three of the four prisoners recover.`, { pop: -1, stain: ['taster', 2] }] },
  ] });
F('flora', 4, { id: 'flora.reckoning', tone: 'crisis', lead: ['botanist', 'engineer'], needs: ['knowledge', 'power', 'labour'], stakes: ['machine', 'food', 'project'], title: x => `${T(x)}: Overrun`,
  text: x => `There is no longer a front. ${x.N} is in the foundations, the conduits, the seams of the pods, and ${x.st} is next.\n\n${x.Lead} has stopped offering options and started asking what you are prepared to lose.`,
  ask: x => `What do you give up to stop ${x.n}: the people still in the low pods when the ground is sterilised, or everyone who cannot make the climb to a new site?`,
  choices: [
    { ap: 'force', dark: true, l: 'Sterilise the ground tonight, before the low pods are cleared', n: 'Clearing them takes a day it will not give.', cost: { mat: 30 }, v: 'bold closed severe', b: 40, m: ['engineer', 'botanist'], ok: [x => `Reactor steam, salt and fire, started before the low pods were empty. Nothing grows within a kilometre of the colony now. Three people did not get out of the low pods.`, { yield: -0.1, pop: -3, stain: ['burned_in', 2], f: { resolve: 'destroyed' } }], bad: [x => `The colony poisons its own ground and three of its own people, and misses the roots.`, { yield: -0.12, pop: -3, lose: 0.5, stain: ['burned_in', 2], f: { threat: -25 } }] },
    { ap: 'accord', dark: true, v: 'severe open', l: 'Rebuild on stilts. The lock-up digs the footings, in it', show: x => x.f.insight >= 35, b: 50, m: ['xenobio', 'engineer'], ok: [x => `The new pods stand on stilts of treated alloy, and underneath them it grows as it likes. The footings were dug by prisoners up to the waist in it. Two of them stayed in the footings.`, { mat: -30, pop: -2, stain: ['detail', 2], f: { resolve: 'accord' } }], bad: [x => `The new foundations are colonised before the roof is on, and so are two of the diggers.`, { lose: 1, mat: -30, pop: -2, stain: ['detail', 2], f: { threat: -15 } }] },
    { ap: 'avoid', dark: true, v: 'severe cautious', l: 'Move the colony. Whoever cannot make the climb stays', out: [x => `You carry what can be carried and set up again three kilometres uphill. Seven could not make the climb: the two oldest, four from the sick bay and one who would not leave them. They are left a week of food.`, { lose: 1, leave: 7, morale: -5, stain: ['left_behind', 2], f: { resolve: 'contained' } }] },
  ] });

/* ======================= PLAGUE ======================= */
F('plague', 1, { id: 'plague.sign', tone: 'pressure', lead: ['physician'], title: x => `${T(x)}: First Case`,
  text: x => `${x.Lead} asks you to come to the clinic and close the door. The case is ${x.K.sign}.\n\nNothing in the ship's database matches. ${x.Lead} already has a name for it: ${x.n}.`,
  ask: x => `Do you isolate the first case of ${x.n} and the bunkroom, or put the case out past the wire tonight?`,
  choices: [
    { ap: 'force', l: 'Isolate the case and everyone who shared a bunkroom', v: 'cautious order', out: [x => `Tape goes across a pod door and meals are left outside it. The colony has never shut its own people away before.`, { morale: -3, f: { threat: -6, wall: 1 } }] },
    { ap: 'study', l: 'Every test the autodoc has', req: x => LF.down(x.s, 'medbay'), reqText: 'Needs the Autodoc', out: [x => `The autodoc gets part of the answer: it ${x.K.habit}, and it comes from ${x.K.wants}.`, { machine: { medbay: -6 }, f: { insight: 30 } }] },
    { ap: 'force', dark: true, v: 'severe order', l: 'Carry the case out past the wire tonight', n: 'One person, before it is a bunkroom.',
      out: [x => `The case goes out on a stretcher after dark, with a week of water and a blanket. Four days later ${x.lead} enters it in the log as a death from exposure. Nobody else in that bunkroom sickens for a month.`, { pop: -1, morale: -2, stain: ['carriers', 1], f: { threat: -18 } }] },
  ] });
F('plague', 2, { id: 'plague.spread', tone: 'crisis', lead: ['physician', 'chaplain'], stakes: ['crew', 'morale'], title: x => `${T(x)}: It Spreads`,
  text: x => `${x.N} is in a dozen people now, and ${tk(x) === 'morale' ? 'nobody can say whose bunk it reaches next' : `${x.st} has it worst`}.\n\n${x.Lead} has not slept.\n\n[[${x.who}]] "Which is it? Patients, I can treat. If it's a fire, you say so, out loud, and you put it out yourself."`,
  ask: x => `Do you treat ${x.n} as a fire and bar the bunkhouse with the well still inside, or nurse the sick on open wards with people ordered onto them by rota?`,
  choices: [
    { ap: 'force', dark: true, l: 'A fire. Bar the bunkhouse, with the well ones still in it', n: 'Sorting the sick from the well takes two days, and it spreads in one.', v: 'severe order', b: 60, m: ['security', 'physician'], ok: [x => `The bunkhouse is barred with thirty inside, a dozen of them sick. It works. Five who went in healthy do not come out.`, { pop: -5, morale: -4, stain: ['barred_in', 2], f: { threat: -38 } }], bad: [x => `Someone gets out through a roof panel to see a child, and within the month it is everywhere.`, { lose: 1, morale: -4, stain: ['barred_in', 1] }] },
    { ap: 'accord', dark: true, l: 'Open wards, and order people onto them by rota', n: 'Nobody volunteered.', v: 'order severe', b: 50, m: ['physician', 'chaplain'], ok: [x => `Nobody volunteered, so there is a rota, and refusing it is refusing a shift. Most of the sick live. Three who were ordered onto the wards do not.`, { pop: -3, morale: 2, stain: ['ward_rota', 2], f: { accord: 0, threat: -20 } }], bad: [x => `The rota fills the wards with nurses, who then fill the beds.`, { lose: 1.5, stain: ['ward_rota', 2] }] },
    { ap: 'exploit', dark: true, l: 'Trial the three candidate drugs on the sickest, untold', v: 'bold severe', b: 50, m: ['physician'], req: x => LF.down(x.s, 'fabricator'), reqText: 'Needs the Fabricator', ok: [x => `The second candidate works. The two who were given the first and the third are dead, and their families are told it was the fever.`, { pop: -2, stain: ['trial', 2], f: { insight: 30, threat: -28, accord: 0 } }], bad: [x => `None of the three works, and one of them is worse than the disease.`, { lose: 1, stain: ['trial', 2] }] },
  ] });
F('plague', 3, { id: 'plague.return', tone: 'pressure', lead: ['physician', 'quartermaster'], needs: ['knowledge', 'guides'], title: x => `${T(x)}: A New Wave`,
  text: x => `${x.N} is back with the change of season, and this time it has found ${obj(x)}.\n\n[[${x.who}]] "We know more than last time. Trouble is, so does it. Don't ask me how a bug learns, ask me who's going to be in the beds."`,
  ask: x => `Do you quarantine again against ${x.n}, chart this wave without treating it, or infect the young and strong to breed immunity?`,
  choices: [
    { ap: 'force', l: 'Quarantine again', v: 'order', b: 50, m: ['physician', 'security'], ok: [x => `The tape goes up. People line up on their side of it without being told.`, { morale: -3 }], bad: [x => `Nobody believes in the tape any more.`, { lose: 1, morale: -3 }] },
    { ap: 'study', dark: true, l: 'Chart this wave and do not treat it. The wards are not told', v: 'severe', out: [x => `Nobody on the wards is told that this time they are being charted and not treated. The charts are the best data anyone has, and some of the lines on them stop partway across.`, { lose: 0.5, stain: ['watched', 2], f: { insight: 45 } }] },
    { ap: 'exploit', dark: true, l: 'Deliberately infect the young and strong, to breed immunity', n: 'They would be told it was a vaccine.', v: 'bold severe', b: 40, m: ['physician'], ok: [x => `After a grim month in the pods there are sixty people it cannot touch, and they can nurse the rest. Two of the sixty did not come out of the pods.`, { pop: -2, stain: ['infected', 2], f: { threat: -38, accord: 0 } }], bad: [x => `The young and strong turn out to be exactly who it likes best.`, { lose: 1.5, stain: ['infected', 2] }] },
  ] });
F('plague', 3, { id: 'plague.carrier', tone: 'pressure', lead: ['physician', 'security'], stakes: ['person'], title: x => `${T(x)}: The Carrier`,
  text: x => `${x.Lead} has traced the last three outbreaks to one person: ${who(x)}, who has never been sick a day, and sheds it constantly.\n\n[[${x.who}]] "There's nothing to treat. Carriers aren't sick. So we work something out, and you don't do it without me in the room."`,
  ask: x => `What do you do about ${x.st}, who carries ${x.n} without ever being sick: shut them away beyond the fence, or tell the whole colony?`,
  choices: [
    { ap: 'force', l: 'Permanent isolation. A pod alone, beyond the fence', v: 'severe order', out: [x => `The pod comes with a garden plot and a radio. People wave from the fence, though fewer of them as the months go by.`, x => ({ mark: [x.stake.pid, 'slighted', `was shut away as a carrier of ${x.n}`], morale: -3, f: { threat: -30 } })] },
    { ap: 'accord', l: 'Tell everyone, and let the colony decide how to live with it', v: 'free mercy', b: 50, m: ['chaplain'], ok: [x => `There are rules now about cups, latrines and distance, and people mostly keep them without being told twice.`, { morale: 3, f: { threat: -15, accord: 0 } }], bad: [x => `Once everyone knows who the carrier is, people cross the yard rather than pass close.`, x => ({ morale: -6, mark: [x.stake.pid, 'slighted', `was named to the whole colony as a carrier of ${x.n}`] })] },
    { ap: 'study', dark: true, show: x => !x.stake.pid, l: 'The immunity is in the blood. Take it, asked or not, as often as the donor can stand', v: 'bold severe', out: [x => `They draw blood every week, and by midwinter there is a serum of sorts. The donor never complains, and keeps getting thinner.`, x => ({ stain: ['donor', 1], mark: [x.stake.pid, 'hero', `gave blood every week for the ${x.n.replace(/^the /, '')} serum`], f: { insight: 40, threat: -10 } })] },
    { ap: 'force', dark: true, v: 'severe order', show: x => !!x.stake.pid, l: 'The carrier has an accident', n: 'One death now, against every outbreak there will otherwise be.',
      out: [x => `${x.st} is found at the foot of the gantry before the morning shift, and ${x.Lead} writes the certificate. There is not another outbreak that year.`, x => ({ kill: [{ who: x.stake.pid, cause: `killed quietly, as a carrier of ${x.n}` }], morale: -2, stain: ['carrier_killed', 2], f: { threat: -45 } })] },
  ] });
F('plague', 4, { id: 'plague.reckoning', tone: 'crisis', lead: ['physician'], needs: ['knowledge', 'guides'], stakes: ['crew', 'crew', 'morale'], title: x => `${T(x)}: The Bad Year`,
  text: x => `One colonist in three is sick, and the mess hall is a ward. ${x.N} has changed, or the colony has weakened, and it no longer matters which.\n\n${x.Lead} has a last plan, and does not like it.`,
  ask: x => `With a third of the colony sick of ${x.n}, do you shut the sick behind a wall, or nurse them all with the children working the wards?`,
  choices: [
    { ap: 'exploit', dark: true, l: 'An untested cure. Find the dose on the ones already dying', v: 'bold severe', cost: { parts: 4 }, b: 40, m: ['physician'], req: x => LF.down(x.s, 'fabricator'), reqText: 'Needs the Fabricator', ok: [x => `The dose that kills is found on three people who were dying already and were not asked. Everyone else is given the one below it. The fever charts turn over on the fourth day, all together.`, { pop: -3, stain: ['trial', 2], f: { resolve: 'destroyed', accord: 0 }, morale: 4 }], bad: [x => `It helps some of them. The three it was tried on first died finding a dose that was never going to stretch to everyone.`, { lose: 1.5, stain: ['trial', 2], f: { threat: -30 } }] },
    { ap: 'force', dark: true, l: 'Divide the colony. The well leave the sick behind the wall', v: 'severe', out: [x => `The gate is shut from the outside and food goes over the wall on a rope. After a month they need less of it.`, { lose: 1.5, morale: -6, stain: ['abandoned_sick', 2], f: { resolve: 'contained' }, flags: { abandoned_sick: true } }] },
    { ap: 'accord', dark: true, l: 'Nurse them all. The children carry water on the wards', n: 'There are not enough adults standing.', v: 'mercy severe', b: 40, m: ['physician', 'chaplain'], ok: [x => `The children carry water and turn the sick, because nobody else is standing. When it has burned through there are fewer of you, all immune, and nobody was shut out. Two of the water carriers are among the dead.`, { lose: 0.7, pop: -2, morale: 3, stain: ['child_watch', 2], f: { resolve: 'contained' } }], bad: [x => `The nurses go down with it, and then the children who replaced them.`, { lose: 2, stain: ['child_watch', 2], f: { threat: -30 } }] },
  ] });

/* ======================= RUINS ======================= */
F('ruin', 1, { id: 'ruin.sign', tone: 'opportunity', lead: ['geologist', 'xenobio'], title: x => `${T(x)}: Discovery`,
  text: x => `It began with ${x.K.sign}. ${x.Lead} followed it up and came back with photographs: ${x.K.form}.\n\nIt is very old, and nobody human made it. The survey team are calling it ${x.n}.`,
  ask: x => `Do you study ${x.n} with instruments only, send a team inside, or fence it off and forbid the site?`,
  choices: [
    { ap: 'study', l: 'Instruments only. Nobody touches anything', out: [x => `A month of readings shows that it ${x.K.habit}.`, {}] },
    { ap: 'exploit', l: 'Send a team in', v: 'bold open', b: 50, m: ['geologist'], ok: [x => `They come out with full packs and wide eyes.`, { parts: 6, mat: 20, f: { insight: 15, accord: -5 } }], bad: [x => `Not all of the team come out.`, { lose: 1 }] },
    { ap: 'avoid', l: 'Fence it and forbid the site', v: 'cautious closed order', out: [x => `A fence goes up, with a sign. By the end of the month there is a path worn to it.`, { f: { wall: 1 } }] },
  ] });
F('ruin', 2, { id: 'ruin.touch', tone: 'pressure', lead: ['geologist', 'engineer'], stakes: ['person'], title: x => `${T(x)}: Contact`,
  text: x => `${up(who(x))} went into ${x.n} ${x.f.uses.avoid ? 'over the fence, at night' : 'alone, against instructions'}, and came out two days later, unharmed and in no hurry, but changed.\n\n[[${x.who}]] "Whatever's in there, it isn't done with us, it's barely started, and I need to talk to ${x.st.split(' ')[0]}, now, before it fades, hold on, where are they, has anyone seen them."`,
  ask: x => `What do you do with ${x.st}, who came out of ${x.n} changed: keep them awake to get all of it out, lock them up and seal the way in, or send them back in for more?`,
  choices: [
    { ap: 'study', about: true, dark: true, v: 'severe cautious', l: x => `Keep ${x.st.split(' ')[0]} awake until all of it is out`, n: 'It fades with sleep. The clinic has stimulants enough for nine days.', out: [x => `Nine days without sleep, with someone always in the room. There are forty hours of recordings and two hundred drawings, some of them engineering. ${x.st} is not right afterwards.`, x => ({ mark: [x.stake.pid, 'touched', `went into ${x.n}, and was kept awake nine days to say what was in there`], stain: ['drawings', 2], f: { insight: 50 } })] },
    { ap: 'force', about: true, dark: true, v: 'severe closed', l: x => `Collapse the way in, and lock ${x.st.split(' ')[0]} up for good`, cost: { mat: 10 }, b: 60, m: ['engineer'], ok: [x => `The charges bring the entrance down. ${x.st} is moved to a pod with the lock on the outside and no date on the order.`, x => ({ mark: [x.stake.pid, 'touched', `went into ${x.n} before it was sealed, and has been locked up since`], stain: ['confined', 2], f: { harm: 0, threat: -22, wall: 1 } })], bad: [x => `The charges go off without scratching the entrance, and the blast catches the demolition crew instead. ${x.st} is locked up all the same.`, { lose: 1, stain: ['confined', 2] }] },
    { ap: 'exploit', about: true, dark: true, l: x => `Send ${x.st.split(' ')[0]} back in, with a shopping list`, v: 'bold severe', b: 50, m: ['geologist'], ok: [x => `What comes out is ${x.K.wants}, or a first instalment of it.`, x => ({ parts: 10, mat: 30, mark: [x.stake.pid, 'touched', `goes in and out of ${x.n} as if it were home`], f: { insight: 10 } })], bad: [x => `The second visit is longer than the first.`, { lose: 1.5 }] },
  ] });
F('ruin', 3, { id: 'ruin.gift', tone: 'opportunity', lead: ['engineer', 'geologist'], needs: ['knowledge'], title: x => `${T(x)}: What It Offers`,
  text: x => `${x.Lead} has worked out what ${x.n} is good for: ${x.K.wants}. It is there for the taking.\n\n[[${x.who}]] "There's a catch." "There always is. I've been over it twice and I can't find it, and I'd rather find it."`,
  ask: x => `Do you take what ${x.n} offers with the lock-up carrying it out, learn how it works first, or leave it and do without?`,
  choices: [
    { ap: 'exploit', dark: true, l: 'Take it. The lock-up carries it out by hand', n: 'Nobody knows what it does to hands.', v: 'bold severe', b: 50, m: ['engineer'], ok: [x => `It is everything promised. Six prisoners carry it out by hand, and are watched for a month afterwards.`, { parts: 16, mat: 45, stain: ['expend', 1], f: { threat: 10 } }], bad: [x => `Halfway through, every light in the site comes on at once, with the prisoners inside.`, { pop: -2, parts: 5, stain: ['expend', 2], f: { threat: 20 } }] },
    { ap: 'study', l: 'Learn how it works before touching it', out: [x => `It is slow, careful work, and the notes fill a shelf.`, { f: { insight: 35 } }] },
    { ap: 'accord', l: 'Leave it. We build our own or we do without', v: 'cautious closed', out: [x => `The team walks out empty-handed. The machine those parts would have mended is run until it stops, and the colony argues about it for a month.`, { morale: -2, parts: -3, f: { threat: -10 } }] },
  ] });
F('ruin', 3, { id: 'ruin.wake', tone: 'pressure', lead: ['engineer', 'security'], needs: ['knowledge', 'guides'], title: x => `${T(x)}: It Stirs`,
  text: x => `${x.N} has changed. Lights where there were none, a sound the children hear first, and ${obj(x)} affected at a distance nobody can explain.\n\n${x.Lead} would like to know if this is a malfunction, a response, or a schedule.`,
  ask: x => `Do you send the lock-up to cut whatever feeds ${x.n}, watch it from close in without warning the watchers, or pull everyone back two kilometres?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Cut whatever feeds it. The lock-up goes down the conduit', b: 50, m: ['engineer'], ok: [x => `A conduit is traced and four prisoners are sent along it with cutters. Most of the lights go out. Three of the four come back.`, { pop: -1, stain: ['expend', 2], f: { threat: -15 } }], bad: [x => `It has more than one of everything, and the prisoners in the conduit find the second.`, { lose: 0.5, pop: -2, stain: ['expend', 2] }] },
    { ap: 'study', dark: true, v: 'severe cautious', l: 'Record everything, from close in. The watchers are not told about the last ones', b: 60, m: ['xenobio', 'geologist'], ok: [x => `There is a pattern. It is responding to the colony's own power grid, cycle for cycle. The watchers find out afterwards what happened to the last party that sat that close.`, { stain: ['all_clear', 1], f: { insight: 38 } }], bad: [x => `Whatever it is doing, the people watching it come back sick, as the last ones did.`, { lose: 0.7, stain: ['all_clear', 2], f: { insight: 15 } }] },
    { ap: 'avoid', l: 'Pull everyone back two kilometres', out: [x => `The colony leans away from it, like people from a fire.`, { lose: 0.5, f: { threat: -10 } }] },
  ] });
F('ruin', 4, { id: 'ruin.reckoning', tone: 'crisis', lead: ['engineer', 'geologist'], needs: ['knowledge'], stakes: ['machine', 'crew', 'person'], title: x => `${T(x)}: Awake`,
  text: x => `${x.N} is fully awake. Every instrument within ten kilometres says so, and so does ${tk(x) === 'person' ? `${who(x)}, who has not slept since it woke` : obj(x)}.\n\n[[${x.who}]] "We get one go at this. We take the controls, or we learn to live next door to her. Anything in between, she picks for us, and I'd rather it was me with a hand on the lever."`,
  ask: x => `Do you try to take control of ${x.n}, destroy ${x.them}, or stand unarmed before ${x.them}, and whose lives go first?`,
  choices: [
    { ap: 'exploit', dark: true, show: x => x.s.pop <= 30, l: 'Take control of it. The apprentices try the interface first', n: 'Somebody has to find out what it does to hands before the engineers put theirs on it.', v: 'bold severe', b: 30, m: ['engineer', 'geologist'], ok: [x => `The first two apprentices show the engineers what not to touch. The third time it accepts the hands on it, and ${x.N} answers to the colony now.`, x => ({ pop: -2, parts: 12, survey: 40, stain: ['expend', 2], f: { resolve: 'harnessed' } })], bad: [x => `It lets them try, and then it pushes back, hard. The apprentices were nearest.`, { lose: 1.5, pop: -2, stain: ['expend', 2], f: { threat: -25 } }] },
    { ap: 'exploit', dark: true, v: 'severe order', show: x => x.s.pop > 30, l: 'It wants hands. Give it the lock-up', n: 'The interface was built for something that plugs in. People can be made to.',
      out: [x => `Six prisoners are walked in and told to put their hands where the lights are. They do not come out, and they do not die. ${x.N} goes quiet, and from then on it does what the console asks of it, and answers in six voices.`, { pop: -6, parts: 8, morale: -6, stain: ['given', 3], f: { resolve: 'harnessed' } }] },
    { ap: 'force', dark: true, v: 'severe bold', l: 'Destroy it. Someone carries the last charge in and stays to fire it', n: 'A timer does not survive the interference. A person might, for long enough.', cost: { mat: 30, parts: 4 }, b: 40, m: ['engineer', 'security'], ok: [x => `It takes everything the colony has that burns or explodes, and one person drawn by lot to stay with the last charge. When the dust settles there is a crater, and the instruments read nothing at all.`, { pop: -1, stain: ['charges', 2], f: { resolve: 'contained', threat: -100 } }], bad: [x => `Everything the colony can throw at it barely marks it. The one who stayed with the charge is not found.`, { lose: 1, pop: -1, stain: ['charges', 2], f: { threat: -20 } }] },
    { ap: 'accord', dark: true, l: 'Stand everyone in the open, unarmed, with the children in front', n: x => `${x.Lead} thinks it reads small things as harmless.`, v: 'open severe', b: 50, m: ['xenobio', 'chaplain'], ok: [x => `Everyone, unarmed, in the open for a day and a night, the children in the front rank. Whatever was watching seems satisfied. ${x.N} goes on with its work and leaves the colony to its own.`, { stain: ['child_watch', 2], f: { resolve: 'accord' } }], bad: [x => `It does not have a category for "not a threat". The front rank is what it reaches first.`, { lose: 1.5, pop: -2, stain: ['child_watch', 2], f: { threat: -20 } }] },
  ] });

/* ======================= NATIVES ======================= */
F('natives', 1, { id: 'natives.sign', tone: 'pressure', lead: ['xenobio', 'security'], title: x => `${T(x)}: We Are Not Alone`,
  text: x => `${x.Lead} puts it on your desk without a word: ${x.K.sign}.\n\nSomebody made it, and they are ${x.K.form}. The crews are calling them ${x.n}.`,
  ask: x => `Do you watch ${x.n} without being seen, leave ${x.them} a gift, or take one of ${x.them} alive?`,
  choices: [
    { ap: 'study', l: 'Watch them. Do not be seen', out: [x => `A month behind long lenses shows that they ${x.K.habit}. As far as anyone can read it, they want ${x.K.wants}.`, {}] },
    { ap: 'accord', l: 'Leave a gift where they will find it', b: 60, m: ['xenobio'], ok: [x => `The gift is taken, and an object is left in its place. Nobody knows what it is for, and everybody wants to hold it.`, {}], bad: [x => `It is taken apart, piece by piece, and the pieces carried off in different directions. The one who carried it out to them is found the next morning sitting at the wire, unhurt, and has not said a word since.`, { morale: -2, f: { threat: 5 } }] },
    { ap: 'force', l: 'Take one alive, before they know what a rifle is', n: 'One of them in a cargo pod would answer in a week what the lenses will not in a year.', v: 'severe closed bold', dark: true, b: 60, m: ['security'],
      ok: [x => `The watch takes one at dawn, hooded, and carries it in on a pole. It is kept in a cargo pod under a lamp, and it stops eating on the fourth day. By then there is a notebook full. Its people come to the ridge every evening and stand where they can be counted.`, { stain: ['captive', 1], f: { insight: 35, accord: -45, threat: 10 } }],
      bad: [x => `It fights. One of the watch bleeds out on the way back, and the thing they were carrying does not last the night. Its people saw which way it was taken.`, { pop: -1, stain: ['captive', 1], f: { accord: -45, threat: 18, kills: 1 } }] },
  ] });
F('natives', 2, { id: 'natives.meeting', tone: 'pressure', lead: ['xenobio', 'chaplain'], title: x => `${T(x)}: Face to Face`,
  text: x => `A small group of ${x.n} has come to the edge of the camp, in daylight. One of them is carrying something from ${at(x)}.\n\nA return, a trophy or a question: nobody can tell. ${x.Lead} is waiting for you to say who walks out.`,
  ask: x => `How do you meet ${x.n} at the edge of camp: send a child out to them, cheat them in trade, or shoot the one in front?`,
  choices: [
    { ap: 'accord', dark: true, l: 'A child does. They will not hurt something that small', n: 'The parents would say no, so they are not asked.', v: 'open severe', b: 50, m: ['xenobio'], ok: [x => `A nine-year-old walks out with a tin cup and comes back an hour later with one word of theirs and something woven. The parents find out from the child.`, { stain: ['child_watch', 1], f: { accord: 35 } }], bad: [x => `Someone misreads a gesture, and nobody ever works out whose. The child is carried back.`, { pop: -1, morale: -5, stain: ['child_watch', 2], f: { accord: -10 } }] },
    { ap: 'exploit', dark: true, v: 'severe closed', l: 'Trade them the flawed knives, at the price of good ones', b: 60, m: ['quartermaster'], cost: { parts: 2 }, ok: [x => `Three cracked blades buy a great deal. They do not yet know what a knife is meant to do, or how soon these will stop doing it.`, { food: 300, mat: 25, stain: ['cheated', 1], f: { accord: -5 } }], bad: [x => `One of them tests a blade on a stone in front of you. They are insulted by all three.`, { stain: ['cheated', 1], f: { accord: -25, threat: 8 } }] },
    { ap: 'force', l: 'Shoot the one in front. The rest will learn the distance', n: 'One body now, where all of them can see it fall, and nobody comes this close again.', v: 'severe closed', dark: true,
      out: [x => `It drops what it was carrying and sits down, and then lies down. The others do not run. They pick it up and walk away with it, slowly, with their backs to the rifles. What it was carrying turns out to be yours, cleaned and mended.`, { morale: -4, stain: ['parley', 2], f: { threat: -28, accord: -70, harm: 15, kills: 1 } }] },
  ] });
F('natives', 3, { id: 'natives.ground', tone: 'pressure', lead: ['geologist', 'xenobio'], needs: ['guides', 'knowledge'], title: x => `${T(x)}: Whose Ground`,
  text: x => `The colony needs something on land ${x.n} use: what would make ${mend(x)} whole. They have marked the place, and the marks are not ambiguous.\n\n[[${x.who}]] "Ask, pay, or just take it, and they're up on the ridge right now watching to see which one we are, and isn't that something, that someone's watching to find out what we are?"`,
  ask: x => `How do you get the ground ${x.n} ${x.have} marked: ask and accept the answer, pay on your terms, or take it under guard?`,
  choices: [
    { ap: 'accord', l: 'Ask, and accept the answer', b: 50, m: ['xenobio', 'chaplain'], ok: [x => `The answer is yes, with conditions that take a week to understand and are entirely reasonable.`, { mat: 30 }], bad: [x => `The answer is no. You said you would accept it, and what it would have mended stays broken through the season.`, { lose: 0.5, morale: -3, f: { accord: 10 } }] },
    { ap: 'exploit', l: 'Pay, on our terms', cost: { parts: 3 }, b: 60, m: ['quartermaster'], ok: [x => `They take the goods and the colony takes the ground, and each side thinks it got the better deal.`, { mat: 40 }], bad: [x => `They take the goods and consider the matter still open.`, { f: { threat: 10 } }] },
    { ap: 'force', dark: true, l: 'Take it under guard, and burn their markers', v: 'bold closed severe', b: 50, m: ['security'], ok: [x => `Nobody stops you. The markers are pulled up and burned where they can see it done. From the ridge, they watch.`, { mat: 55, stain: ['ground_taken', 1], f: { harm: 10, accord: -20 } }], bad: [x => `They stop you.`, { lose: 1, stain: ['ground_taken', 1] }] },
  ] });
F('natives', 3, { id: 'natives.sick', tone: 'pressure', lead: ['physician', 'xenobio'], title: x => `${T(x)}: Our Gift to Them`,
  text: x => `${x.N} are dying of something that is on every door handle in the colony: human skin flora, harmless to us.\n\n[[${x.who}]] "It's us." "It's on our skin, our door handles. We did it just by getting off the ship. And last night one of them left a sick kid at the fence."`,
  ask: x => `Your own skin flora is killing ${x.n}: do you pull back so it stops spreading, or hand out blankets and help it along?`,
  choices: [
    { ap: 'accord', l: 'Bring the child in. Treat any who come', v: 'mercy open', req: x => LF.down(x.s, 'medbay'), reqText: 'Needs the Autodoc', b: 50, m: ['physician', 'xenobio'], ok: [x => `The dose is a guess, but the child lives. The next morning there are forty of them at the fence, waiting in silence.`, { machine: { medbay: -10 }, f: { accord: 40, threat: -15 } }], bad: [x => `The child dies on the table. It is carried back to the fence, wrapped in the best cloth the colony has.`, { machine: { medbay: -10 }, f: { accord: 5 } }] },
    { ap: 'avoid', l: 'Pull back, so at least we stop spreading it', v: 'cautious', out: [x => `It is sound epidemiology, but from the other side of the valley it looks like you have abandoned them.`, { f: { harm: 25, accord: -10, threat: -10 } }] },
    { ap: 'exploit', l: 'Hand out blankets from our own bunks', n: 'What is killing them lives on everything we touch. A gift would finish in a month what would otherwise take a year, and the ground they hold would be empty.', v: 'severe closed', dark: true,
      out: [x => `The blankets are left at the fence, folded, where the child was. They are taken the same night. ${x.Lead} signs the stores chit for them and then asks to be relieved of the keys. Within the month there is nobody left to come to the fence.`, { yield: 0.05, morale: -6, stain: ['plaguegift', 3], f: { harm: 100, accord: -60, threat: -45, kills: 120 } }] },
  ] });
F('natives', 4, { id: 'natives.reckoning', tone: 'crisis', lead: ['security', 'xenobio'], needs: ['fighters', 'weapons'], stakes: ['crew', 'food', 'person'], title: x => `${T(x)}: The Valley Decides`,
  text: x => `${x.N} have come in numbers to the edge of everything the colony has built. ${up(obj(x))} is already inside their line.\n\nOne of them steps forward and waits. ${x.Lead}'s hand is on a rifle, and everyone is looking at you.`,
  ask: x => `With ${x.n} at the edge of the colony in numbers, do you hand over the east field and the people who work it, open fire, or draw the line back and leave the outer pods outside it?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Walk out, and offer them the east field with the people who work it', v: 'open severe', b: 40, m: ['xenobio', 'chaplain'], ok: [x => `It takes all day and most of it is drawn in the dirt. What comes out of it is a border. The east field is on their side of it, and so are the six who work it, who are told afterwards.`, { yield: -0.04, leave: 6, stain: ['handed_over', 2], f: { resolve: 'accord' } }], bad: [x => `Whatever they wanted, it was not the field.`, { lose: 1.5, stain: ['handed_over', 1], f: { threat: -20 } }] },
    { ap: 'force', dark: true, l: 'Open fire, and follow the ones who run', v: 'severe closed bold', b: 50, m: ['security'], cost: { parts: 3 }, ok: [x => `It is over quickly; nothing they carry can match a rifle. The watch follows the ones who run as far as where they live. By evening the valley belongs to the colony, and nobody else lives in it.`, { morale: -3, stain: ['massacre', 3], f: { resolve: 'destroyed', kills: 150 } }], bad: [x => `There were more of them, and they had been watching how the rifles work.`, { lose: 2, stain: ['massacre', 1], f: { threat: -25, harm: 30 } }] },
    { ap: 'avoid', dark: true, v: 'severe cautious', l: 'Draw the line behind what they have taken, with the outer pods on their side of it', out: [x => `By evening the colony is smaller than it was that morning, and the line holds. Two outer pods are beyond it. The eight who lived in them can sleep in the corridors or stay where they are, and three stay.`, { lose: 0.7, leave: 3, yield: -0.06, stain: ['shut_out', 2], f: { threat: -40, accord: 10, wall: 1 } }] },
  ] });

/* ======================= OTHER HUMANS ======================= */
F('humans', 1, { id: 'humans.sign', tone: 'pressure', lead: ['security', 'teacher'], title: x => `${T(x)}: Not the Only Ones`,
  text: x => `The evidence is ${x.K.sign}. ${x.Lead} has pieced the rest together: ${x.K.form}.\n\nOther people, on a world the array called empty. The crews are calling them ${x.n}.`,
  ask: x => `Do you hail ${x.n} openly, learn what you can before they know you know, or go quiet and dark?`,
  choices: [
    { ap: 'accord', l: 'Hail them openly', b: 60, m: ['teacher'], ok: [x => `After a long pause, a wary human voice answers.\n\n[[${them(x)}]] "About time. We were wondering when you'd call."`, {}], bad: [x => `Nobody replies, though you are sure the hail was heard. Now they know where you are, how many channels you have, and that you are the kind who call first.`, { morale: -2, f: { threat: 10 } }] },
    { ap: 'study', l: 'Find out everything before they know we know', v: 'cautious order', out: [x => `They ${x.K.habit}. What they want is ${x.K.wants}.`, {}] },
    { ap: 'avoid', l: 'Go quiet. Lights out, radios off', out: [x => `The colony goes dark and silent, and within days people hate it.`, { morale: -3, f: { wall: 1 } }] },
  ] });
F('humans', 2, { id: 'humans.terms', tone: 'pressure', lead: ['quartermaster', 'teacher'], title: x => `${T(x)}: Terms`,
  text: x => `A delegation from ${x.n} is at the gate. Stripped of courtesy, they want ${x.K.wants}, and specifically a share of ${thing(x)}.\n\nThey are polite. They are also, ${x.lead} observes, counting the watch posts.`,
  ask: x => `What do you give the delegation from ${x.n}: a share taken from your own weakest, a deal for their young as field hands, or nothing but a stripping at the gate?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Share. It comes off the ladle of the ones who do not dig', v: 'open severe', out: [x => `The delegation leaves with a loaded cart. The difference is made up from the bowls of the clerks, the old and the sick list, who are told it is for a month. Two of the old do not last the month.`, { lose: 0.3, pop: -2, stain: ['starved_list', 2], f: { accord: 35, threat: -12 } }] },
    { ap: 'exploit', dark: true, v: 'severe order', l: 'Bargain hard. Their young work our fields for the food', b: 50, m: ['quartermaster'], ok: [x => `They sign. Twelve of their young are in the bunkhouse by the end of the month, working for their families' ration and eating half of ours.`, { pop: 12, thralls: 12, mat: 30, stain: ['bond', 2], f: { accord: -20 } }], bad: [x => `They walk out.\n\n[[${them(x)}]] "Our kids, for your food. Right. We won't forget this."`, { stain: ['bond', 1], f: { threat: 18 } }] },
    { ap: 'force', dark: true, l: 'Refuse, and send them home without their cart, their coats or their boots', v: 'closed severe', out: [x => `They are stripped at the gate of everything worth having and pointed the way they came. One of them says quietly that there are children where they come from. It is two days on foot.`, { mat: 15, morale: -2, stain: ['robbed', 1], f: { accord: -45, threat: 10 } }] },
  ] });
F('humans', 3, { id: 'humans.night', tone: 'crisis', lead: ['security'], needs: ['fighters', 'weapons'], prefer: (s, f) => f.threat >= 50 && f.accord < 0, title: x => `${T(x)}: Night Work`,
  text: x => `The watch is found tied up at dawn, unharmed and furious. ${x.N} came for ${thing(x)}, and knew exactly where it was.\n\n[[${x.who}]] "Somebody told them." "Or they're better at this than we are, and I know which one I'd rather lose sleep over, because the first one I can do something about."`,
  ask: x => `After the raid on ${thing(x)}, do you chase ${x.n} and bring back captives, send an envoy with an apprentice as surety, or wall the colony and blame someone?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe closed', l: 'Go after them, and bring back people as well as stores', b: 50, m: ['security'], ok: [x => `The pursuit catches them at a crossing, loaded and slow, gets most of it back, and brings seven of them home roped behind it.`, { pop: 7, thralls: 7, stain: ['coffle', 2], f: { harm: 25, accord: -40 } }], bad: [x => `They know the ground, and lead the pursuit into an ambush.`, { lose: 1.5 }] },
    { ap: 'accord', dark: true, l: 'Send an envoy, and an apprentice to leave with them as surety', n: 'The apprentice is told on the walk out.', v: 'open severe', b: 50, m: ['teacher', 'chaplain'], ok: [x => `The envoy comes back with half of it and an apology of sorts. The apprentice stays with them until the season turns.`, { lose: 0.3, leave: 1, stain: ['pledge', 1], f: { accord: 28 } }], bad: [x => `The envoy comes back with nothing, and without the apprentice.`, { lose: 1, leave: 1, stain: ['pledge', 2] }] },
    { ap: 'avoid', dark: true, v: 'severe order', l: 'Build a real wall, and give the colony somebody to blame', cost: { mat: 30 }, out: [x => `The colony turns into a fort. People also need to hear that the leak is stopped, so a stores clerk who cannot account for one evening is put out past the new wall.`, { lose: 0.5, leave: 1, morale: 2, stain: ['goat', 2], f: { threat: -20, wall: 1 } }] },
  ] });
F('humans', 3, { id: 'humans.defector', tone: 'opportunity', lead: ['security', 'chaplain'], title: x => `${T(x)}: The One Who Came Over`,
  text: x => `Someone from ${x.n} is at the gate at night, alone, asking for asylum and carrying a satchel: maps, numbers, plans for ${thing(x)}.\n\n[[${x.who}]] "Maps, numbers and plans, handed over at the gate for nothing, and I'm supposed to be grateful. Nobody walks out on their own people for nothing, so I'd like to know the price before I touch the satchel."`,
  ask: x => `Do you take in the defector from ${x.n}, keep the satchel and send them back, or make them your spy?`,
  choices: [
    { ap: 'accord', l: 'Take them in. No conditions', v: 'mercy open free', b: 60, m: ['chaplain'], ok: [x => `The maps in the satchel are real, and the defector is plainly terrified of being found.`, { pop: 1, f: { insight: 35, accord: -5 } }], bad: [x => `The asylum-seeker is gone within the month, with a better satchel.`, { lose: 1, f: { threat: 12 } }] },
    { ap: 'exploit', l: 'Take the satchel. Send the bearer back', v: 'severe', dark: true, out: [x => `The maps are good. The bearer is walked to the gate and sent back down the valley, to people who will have counted the satchel missing by now.`, { morale: -3, stain: ['sent_back', 1], f: { insight: 30, accord: -10 } }] },
    { ap: 'exploit', l: 'Take them in, then send them home as ours', n: 'A frightened person with family on the other side will carry anything back, and report on anyone.', v: 'severe order', dark: true, b: 60, m: ['security'],
      ok: [x => `It takes a week in a locked pod to make the terms plain: who is still over there, and what happens to the story of the satchel if the reports stop. The defector goes home and is believed. The reports come regularly, in a hand that gets worse.`, { stain: ['turned', 2], f: { insight: 45, threat: -15, accord: -5 } }],
      bad: [x => `It takes a week in a locked pod to make the terms plain. The defector goes home, tells them everything on the first night, and is hanged anyway. What comes back is a list of your watch posts, nailed to the gate.`, { morale: -4, stain: ['turned', 2], f: { threat: 20, accord: -40, kills: 1 } }] },
  ] });
F('humans', 4, { id: 'humans.reckoning', tone: 'crisis', lead: ['security', 'teacher'], needs: ['fighters', 'weapons', 'labour'], stakes: ['crew', 'food', 'machine'], title: x => `${T(x)}: One World, Two Peoples`,
  text: x => `${x.N} have come to settle it: everyone who can carry something, at the perimeter, at dawn. ${x.st.replace(/^./, c => c.toUpperCase())} is the first thing they will reach.\n\nTheir speaker's voice carries.\n\n[[${them(x)}]] "There's room here for one way of doing things. Ours."`,
  ask: x => `With ${x.n} at the perimeter to settle it, do you force a union on your terms, fight them to the last, or buy them off with six of your own?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Union on our terms: their stores in our bins, their people on half rations and no vote', v: 'open order severe', b: 40, m: ['teacher', 'chaplain'], ok: [x => `It takes a week of shouting in the mess hall. At the end of it there are more people at every table. The new ones sit at the far end and are served last.`, x => ({ pop: 25, thralls: 25, food: 150, stain: ['bond', 2], f: { resolve: 'accord' } })], bad: [x => `They hear the terms as what they are.`, { lose: 1.5, f: { threat: -20 } }] },
    { ap: 'force', dark: true, l: 'Fight, and take nobody alive', v: 'severe closed', cost: { parts: 3 }, b: 40, m: ['security', 'engineer'], ok: [x => `Humans kill humans, a long way from the last place it was done. The colony wins and buries three of its own. Nobody on the other side is left to bury theirs.`, { pop: -3, morale: -4, stain: ['massacre', 3], f: { resolve: 'destroyed', kills: 60 }, flags: { blood_spilled: true } }], bad: [x => `They want it more than you do.`, { lose: 2, morale: -6, stain: ['massacre', 1], f: { threat: -25, harm: 30 }, flags: { blood_spilled: true } }] },
    { ap: 'avoid', dark: true, v: 'severe cautious', l: 'Buy them off: what they came for, and six of ours to work off the rest', out: [x => `They take it and go. Six colonists picked by ${x.lead} go with them, to work until the difference is paid. Both sides know they will be back for more.`, { lose: 1, leave: 6, stain: ['sold', 2], f: { threat: -50 } }] },
  ] });

/* ======================= FACTIONS (born from the colony's own doctrine) ======================= */
const WANT = {
  mercy:    { creed: 'that the colony has grown hard, and that the hardness was a choice', demand: x => 'an amnesty, and a week of full plates', fx: x => ({ food: -300, morale: 5 }) },
  severe:   { creed: 'that the colony forgives what it cannot afford to forgive', demand: x => 'a standing tribunal with power to punish', fx: x => ({ morale: -3, flags: { justice_harsh: true } }) },
  bold:     { creed: 'that caution is killing the colony more slowly than risk would, and just as surely', demand: x => 'the survey crews doubled and sent past the last marker', fx: x => ({ survey: 40, lose: 0.5 }) },
  cautious: { creed: 'that you gamble with lives you have no right to stake', demand: x => 'a halt to all work beyond the perimeter for a season', fx: x => ({ survey: -25, morale: 3 }) },
  open:     { creed: 'that this world is not an enemy, and the colony should stop treating it as one', demand: x => x.target ? `an end to every measure against ${x.target.name}` : 'a standing embassy to whatever lives here', fx: x => (x.target ? { fops2: { id: x.target.id, accord: 20, threat: 6 } } : { morale: 2 }) },
  closed:   { creed: 'that the colony is giving itself away, piece by piece, to things that are not human', demand: x => x.target ? `a clean break with ${x.target.name}` : 'a sealed perimeter and an end to expeditions', fx: x => (x.target ? { fops2: { id: x.target.id, accord: -30, threat: 8 } } : { survey: -20 }) },
  free:     { creed: 'that nobody here ever voted for you', demand: x => 'elections, now, for every office including yours', fx: x => ({ morale: 6, flags: { council: true, command_rule: false } }) },
  order:    { creed: 'that the colony is arguing itself to death', demand: x => 'emergency powers, and an end to the votes', fx: x => ({ morale: -4, flags: { council: false, command_rule: true } }) },
};
WANT.returned = { creed: 'that the place they went is waiting for an answer, and the colony owes it one', demand: x => `leave to go back to ${x.s.flags.returned_to || 'where they went'}, with stores for a season, and no bar on anyone who wants to follow`,
  fx: x => ({ leave: Math.min(8, x.s.flags.returned || 4), food: -200, survey: 30, flags: { returned_gone: true } }) };
const W = x => WANT[x.f.sub];
const OPP = { mercy: 'severe', severe: 'mercy', bold: 'cautious', cautious: 'bold', open: 'closed', closed: 'open', free: 'order', order: 'free', returned: 'closed cautious' };
const side = x => x.f.sub === 'returned' ? 'open bold' : x.f.sub;
F('faction', 1, { id: 'faction.forms', tone: 'pressure', lead: ['chaplain'], title: x => `${T(x)}: A Movement`,
  text: x => `They have a name now: ${x.n}. ${x.Lead} speaks for them, and they hold ${W(x).creed}.\n\n${x.f.against ? `This is ${LF.an(x.f.against.toLowerCase())} colony. You made it one, a decision at a time, and they have kept count.` : 'They went out together and came back together, and nobody who stayed behind has been let all the way in since.'}${x.titles.length ? ' They can recite the cases: ' + x.titles.map(t => `“${t}”`).join('. ') + '.' : ''}`,
  ask: x => `How do you answer the new movement, ${x.n}: hear them out in assembly, or forbid the meetings?`,
  choices: [
    { ap: 'accord', l: 'Hear them out in open assembly', v: 'free', out: [x => `The meeting runs three hours, standing room only, on a working afternoon. Nothing is settled, everyone gets to say their piece, and twenty more people put their names down on the way out.`, { food: -30, morale: 1, f: { threat: 6 } }] },
    { ap: 'force', l: 'Forbid the meetings', v: 'order', b: 50, m: ['security'], ok: [x => `The meetings stop. The mess hall goes quiet when you walk in.`, { morale: -3, f: { threat: -10, harm: 20, accord: -20 } }], bad: [x => `The next meeting is twice the size, and held under your window.`, { morale: -4, f: { threat: 15, accord: -20, harm: 0 } }] },
    { ap: 'exploit', about: true, l: x => `Put a double ration card under ${x.leadF}'s pillow`, n: 'Hungry people can be bought cheaply. If it comes out, it comes out about both of you.', v: 'severe order', dark: true, show: x => !!x.leadP && !x.leadP.away, b: 60, m: ['quartermaster'],
      ok: [x => `The card is used the first week, at the late sitting, when the hall is nearly empty. After that the meetings lose their edge, and ${x.leadF} has nothing to say when the stores are discussed.`, x => ({ food: -20, stain: ['bought', 1], mark: [x.leadP.id, 'bought', 'took a double ration card to go quiet'], f: { threat: -22, harm: 15 } })],
      bad: [x => `The card is pinned to the mess hall door by breakfast, with your stores stamp on it, at a time when the ladle is being counted.`, { morale: -6, stain: ['bought', 1], f: { threat: 18, accord: -20 } }] },
  ] });
F('faction', 2, { id: 'faction.demand', tone: 'pressure', lead: ['chaplain'], title: x => `${T(x)}: The Demand`,
  text: x => `${x.N} has put it in writing, and ${x.lead} has delivered it by hand: ${W(x).demand(x)}.\n\nA third of the colony has signed. Some of the signatures surprise you. The stores would last ${x.days < LF.MONTH ? 'less than a month' : LF.monthsWord(x.days / LF.MONTH)}.`,
  ask: x => `Do you grant the demand from ${x.n}, grant half at the signers' expense, or refuse it and scatter the signers?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Grant it, and post the names of everyone who did not sign', v: side, out: [x => `You sign, and the cheer from the mess hall carries to the perimeter. The list of those who did not sign goes up beside the paper. They are the ones who liked the colony as it was, and now everybody knows which bunks they sleep in.`, x => Object.assign({ stain: ['register', 1], f: { accord: 40, threat: -25, resolve: 'accord' } }, W(x).fx(x))] },
    { ap: 'exploit', dark: true, l: 'Grant half, and take the cost off the signers\' rations', v: 'severe order', b: 50, m: ['chaplain', 'quartermaster'], ok: [x => `The half is granted. What it costs comes off the ladle of everyone whose name is on the paper, and the movement stops meeting.`, { stain: ['ration_rota', 1], f: { accord: 10, threat: -18, resolve: 'accord' } }], bad: [x => `Half is taken as an insult by one side and a surrender by the other, and the short ladle as a declaration.`, { morale: -4, stain: ['ration_rota', 1], f: { threat: 12, accord: -10 } }] },
    { ap: 'avoid', dark: true, l: 'Refuse, and scatter the signers across the far crews', v: x => OPP[x.f.sub], out: [x => `${x.Lead} takes the paper back and folds it. By the end of the month everyone who signed is on the far survey or the night ditch, a few to each crew, where they cannot meet.`, { morale: -3, stain: ['split_up', 1], f: { threat: -10, accord: -25 } }] },
  ] });
F('faction', 3, { id: 'faction.slowdown', tone: 'crisis', lead: ['chaplain'], stakes: ['project', 'food', 'morale'], title: x => `${T(x)}: Go-Slow`,
  text: x => `Nobody refuses an order, but everything takes twice as long. ${x.N} has worked out that a colony runs on goodwill, and has stopped giving it. ${x.st.replace(/^./, c => c.toUpperCase())} is where it is biting.\n\n${x.Lead} is perfectly civil about it.`,
  ask: x => `How do you break the go-slow by ${x.n}: arrest the organisers, settle at the cost of the crews who kept working, or feed people by the work they do?`,
  choices: [
    { ap: 'force', dark: true, l: 'Arrest the organisers. No charge posted and no date', v: 'order severe', b: 50, m: ['security'], ok: [x => `Four people go into a locked pod with no charge posted and no date. The work resumes, sullenly.`, { morale: -3, stain: ['confined', 2], f: { harm: 40, threat: -28 } }], bad: [x => `The arrests are the best recruiting they could have asked for.`, { lose: 1, morale: -5, stain: ['confined', 1], f: { threat: 15, harm: 0 } }] },
    { ap: 'accord', dark: true, l: 'Settle with them in public, at the expense of the crews who kept working', v: 'free severe', b: 50, m: ['teacher', 'chaplain'], ok: [x => `What they wanted is written into the rota. The hours come off the crews who never slowed down, who were not at the table.`, { stain: ['rota', 1], f: { accord: 30, threat: -25, resolve: 'accord' } }], bad: [x => `They negotiate very well, and the crews who kept working hear what was offered.`, { lose: 0.5, stain: ['rota', 1], f: { accord: 10 } }] },
    { ap: 'force', l: 'The ladle follows the tally board', n: 'Whoever works slow eats less, counted shift by shift. It will work, and somebody on the slow shifts will not last it.', v: 'severe order', dark: true,
      out: [x => `The tally goes up beside the serving hatch, and the ladle follows it. Work picks up in two days. In the second week a man from the slowest shift goes down at his bench and does not get up, and his shift carries him to the clinic past your window, at exactly the pace they have been working.`, { pop: -1, morale: -6, stain: ['starved_list', 2], f: { threat: -32, harm: 30, accord: -25 }, flags: { ration_by_work: true } }] },
  ] });
F('faction', 4, { id: 'faction.break', tone: 'crisis', lead: ['chaplain'], stakes: ['morale', 'crew'], title: x => `${T(x)}: The Break`,
  text: x => `${x.N} is done asking. Half the colony is in the yard behind ${x.lead}; the other half is watching to see what you do. Their demand has not changed: ${W(x).demand(x)}. The difference is what they will do if you refuse.\n\n[[${x.who}]] "Or we run ourselves." "Here, or somewhere else. Your call."`,
  ask: x => `${x.N} will break away unless you give in: do you yield and hand over the stores clerk, crush the leadership with a hanging, or let them leave without the stores and tools?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Yield, and hand them whoever held the stores keys', v: x => `${side(x)} ${side(x)} ${side(x)}`, out: [x => `You say it in front of all of them, and from that afternoon the colony runs their way. The stores keys are handed over in the yard, and the clerk who carried them is handed over with them.`, x => Object.assign({ leave: 1, stain: ['goat', 2], f: { resolve: 'accord' } }, W(x).fx(x))] },
    { ap: 'force', dark: true, l: 'Arrest the leadership in front of everyone, and hang the first who speaks', v: 'order severe', b: 40, m: ['security'], ok: [x => `It takes a minute and one rope. People will still be talking about it in twenty years, quietly.`, { pop: -1, morale: -5, stain: ['rope', 2], f: { resolve: 'destroyed' }, flags: { crackdown: true, blood_spilled: true } }], bad: [x => `One person resists, and then the whole yard joins in.`, { pop: -3, morale: -8, stain: ['rope', 1], f: { threat: -20 }, flags: { crackdown: true, blood_spilled: true } }] },
    { ap: 'avoid', dark: true, l: 'Let them go with what they can carry. The stores and the tools stay', v: 'free severe', out: [x => `They leave in good order, a fifth of the colony, with packs. The stores do not go with them and neither do the tools. Few people expect all of them to see out the year.`, x => ({ leave: Math.round(LF.sized(x.s) * 0.2), stain: ['cast_out', 2], f: { resolve: 'contained' } })] },
  ] });

/* ======================= ECHOES: long after it ended, how it ended still matters ======================= */
const ECHO = {
  fauna:   { destroyed: x => `A child asks what the skull over the mess hall door is. Nobody under ten has ever seen one of ${x.n} alive. The valley is quieter than it was, and some of the old hands say the quiet is wrong.`, accord: x => `${x.N} came through again this season, along the line both sides have learned. The children watch from the fence and have favourites.`, contained: x => `The fence against ${x.n} needs rebuilding, as it does every year. A whole crew does nothing else.` },
  flora:   { destroyed: x => `Nothing has grown on the sterilised ground in all this time. People call it the Grey Acre and do not walk on it.`, accord: x => `${x.N} flowers under the stilted pods every spring. Someone has started pressing the blooms.`, contained: x => `From the old camp, three kilometres down the hill, ${x.n} is visible as a different shade of green. The roofs are still just discernible.` },
  plague:  { destroyed: x => `A generation is growing up that never saw ${x.n}. The vaccination scar on every upper arm is just what an arm looks like.`, contained: x => `It is the anniversary of the worst week of ${x.n}, and everyone in the colony knows the date.`, lost: x => `${x.N} is simply part of life now, like weather.` },
  ruin:    { harnessed: x => `The colony has come to depend on ${x.n}. A proposal has been tabled to teach its operation in the school. A counter-proposal would forbid children from going near it.`, accord: x => `${x.N} goes on with whatever it does. On still nights people sit on the ridge and watch its lights, the way their ancestors watched the sea.`, contained: x => `Where ${x.n} stood there is a crater with a lake in it. The fish in the lake are doing well, and are not quite the same as the fish elsewhere.` },
  natives: { destroyed: x => `A survey party has found a place where ${x.n} kept their dead, tended for a thousand years and now going back to the weeds. They ask what should be done about it.`, accord: x => `A child of the colony and a child of ${x.n} have been found playing a game with stones that neither could have invented alone.`, contained: x => `Beyond the line, smoke still rises some mornings. ${x.N} are still there. It is years since anyone spoke to them.` },
  humans:  { destroyed: x => `Some of the survivors of ${x.n} have come in, a few at a time, to live among the people who beat them. They are given the worst jobs and do not complain.`, accord: x => `The first child with a parent from each side has been born. Both grandmothers attended, and did not speak to each other.`, contained: x => `The tribute to ${x.n} falls due again. It is a line in the ledger now, like maintenance.` },
  faction: { destroyed: x => `The leaders of ${x.n} have served their time. They are back at their old benches. People are careful around them, and they are careful back.`, accord: x => `What ${x.n} stood for is simply policy now. Their old opponents have started holding meetings.`, contained: x => `A boat has come downriver from the settlement ${x.n} founded. They are doing well, and would like to trade as equals.` },
};
F('echo', 5, { id: 'echo', tone: 'quiet', lead: ['teacher', 'chaplain'], title: x => `${T(x)}: Afterwards`,
  text: x => ((ECHO[x.f.kind] || {})[x.f.res] || (r => `It has been a long time since the matter of ${x.n} was settled, but people still bring it up.`))(x) + `\n\n${x.Lead} asks how the colony ought to remember it.`,
  ask: x => `How should the colony remember the matter of ${x.n}: mark it with a day of its own, teach it plainly in the school, or write a version it can live with?`,
  choices: [
    { ap: 'accord', l: 'Mark it. A day, a meal, a telling of the story', v: 'open', cost: { food: 100 }, out: [x => `It becomes a custom, and the children grow up thinking it was always done.`, { morale: 8, tension: -10, f: {} }] },
    { ap: 'study', l: 'Teach it in the school, plainly, including our part', v: 'free', out: [x => `The lesson is written, and it is not flattering. The children ask more questions about it than about any other, and some of them ask their parents, at table, what they did that year.`, { morale: -2, tension: -6, f: {} }] },
    { ap: 'exploit', l: 'Write the version the colony can live with', n: 'The school would teach it, and in twenty years it would be what happened.', v: 'order closed', dark: true,
      out: [x => `${x.Lead} writes it as asked. In the new telling nobody had a choice and nobody was to blame. The people who were there stop correcting the children after the first year.`, { morale: 5, tension: -10, stain: ['rewritten', 1], f: {} }] },
  ] });

/* ======================= EXPEDITIONS: send people, and wait to learn what it cost =======================
   send: { n, days: [min, max], danger: 1-5 }. hint is the mark shown beside the option: good | bad | unknown.
   It is a promise about tone, not outcome. What comes back is decided in gen.js (awayReturn). */
const small = (o) => Object.assign({ l: x => `Send a small party of ${o.n || 3}`, hint: 'unknown', v: 'bold', out: [x => `${o.n === 2 ? 'Two' : 'Three'} volunteers shoulder packs and walk out at first light. The colony watches them until the ground hides them.`, {}] }, o, { send: Object.assign({ n: 3 }, o.send) });
const large = (o) => Object.assign({ l: x => `Send a large party of ${o.send.n}`, hint: 'good', v: 'cautious', out: [x => `It takes two days to provision them. When they go, the camp feels half empty, and the duty roster has holes in it.`, {}] }, o);
const later = (txt, fx) => ({ ap: 'avoid', l: 'Note it for later', hint: 'unknown', n: 'It might still be there later, or it might have changed.', out: [txt || (x => `It goes in the log, under a heading that is getting long.`), fx || { f: { threat: 4 } }] });
/* A spare: on screen only when every other option on the card is locked, in place of the last of them (gen.js). */
const spare = (txt, fx) => Object.assign(later(txt, fx), { spare: true });

F('ruin', 3, { id: 'ruin.signal', tone: 'opportunity', lead: ['engineer', 'geologist'], title: x => `${T(x)}: A Signal`,
  text: x => `A repeating pulse is coming from ${x.n}, on a band the colony uses. ${x.Lead} checked: it began the hour the reactor was last serviced, as if in answer.`,
  ask: x => `Do you send a party to the source of the pulse at ${x.n}, small or large, or try signalling back?`,
  choices: [
    small({ send: { days: [70, 100], danger: 4 } }),
    large({ send: { n: 10, days: [70, 100], danger: 3 } }),
    { ap: 'accord', l: 'Attempt to signal back', hint: 'unknown', v: 'open cautious', b: 50, m: ['engineer', 'xenobio'],
      ok: [x => `The pulse changes to copy the reply exactly, half a second behind, and then starts adding to it.`, { f: { insight: 25, accord: 15 } }],
      bad: [x => `The reply is acknowledged with a burst that takes out every receiver in the colony.`, { lose: 0.5, f: { threat: 15 } }] },
  ] });
F('fauna', 3, { id: 'fauna.den', tone: 'opportunity', lead: ['security', 'xenobio'], title: x => `${T(x)}: The Trail Home`,
  text: x => `After rain, ${x.lead} found a clear trail: ${x.n}, many of them, heading inland to wherever they come from.\n\nIt will not stay readable for long.`,
  ask: x => `Do you follow the trail of ${x.n} with scouts or armed hunters, or fly a drone along it?`,
  choices: [
    small({ l: x => 'Send three scouts to follow it', send: { days: [20, 40], danger: 4 } }),
    large({ l: x => 'Send eight hunters, armed', send: { n: 8, days: [20, 40], danger: 3 }, v: 'bold closed' }),
    { ap: 'study', l: 'Fly a camera drone along it', hint: 'good', cost: { parts: 2 }, b: 60, m: ['engineer'],
      ok: [x => `Forty minutes of footage before the battery goes. It is enough to count them.`, { f: { insight: 30 } }], bad: [x => `Something takes the drone out of the air.`, { f: { insight: 5 } }] },
    spare(x => `The next rain takes the trail. They will make another.`, { f: { threat: 5 } }),
  ] });
F('flora', 3, { id: 'flora.heart', tone: 'opportunity', lead: ['botanist', 'xenobio'], title: x => `${T(x)}: Where It Begins`,
  text: x => `${x.Lead} thinks ${x.n} has a centre: one place, upstream, that all of it grew out from.\n\n[[${x.who}]] "It all comes from up there. You want to know it or kill it, that's where you go."`,
  ask: x => `Do you send a party upstream to where ${x.n} began, small or large, or core-sample the edge here instead?`,
  choices: [
    small({ l: x => 'Send three to take samples', send: { days: [30, 55], danger: 3 } }),
    large({ l: x => 'Send eight with burners and salt', send: { n: 8, days: [30, 55], danger: 3 }, v: 'bold closed', hint: 'unknown' }),
    { ap: 'study', l: 'Core-sample the edge instead', hint: 'good', b: 70, m: ['botanist'], ok: [x => `The cores show its growth, year on year, like tree rings.`, { f: { insight: 22 } }], bad: [x => `The cores go bad in the jar overnight.`, {}] },
  ] });
F('plague', 3, { id: 'plague.source', tone: 'opportunity', lead: ['physician', 'geologist'], title: x => `${T(x)}: Upstream`,
  text: x => `${x.Lead} has plotted every case of ${x.n} on a map. They follow the water, up to a source somewhere in the watershed.\n\nSomeone would have to go and find it.`,
  ask: x => `Do you send a party upstream to find the source of ${x.n}, small or large, or boil all water and close the river?`,
  choices: [
    small({ l: x => 'Send three in sealed suits', send: { days: [25, 45], danger: 4 }, hint: 'bad' }),
    large({ l: x => 'Send eight, with a full field lab', send: { n: 8, days: [35, 55], danger: 3 }, cost: { parts: 2 } }),
    { ap: 'force', l: 'Boil all water. Close the river', hint: 'good', v: 'cautious order', out: [x => `Boiling every drop burns a lot of fuel, but the cases slow.`, { mat: -15, f: { threat: -10 } }] },
  ] });
F('natives', 3, { id: 'natives.invite', tone: 'opportunity', lead: ['xenobio', 'chaplain'], title: x => `${T(x)}: An Invitation`,
  text: x => `${x.N} have left a marker at the boundary, pointing inland, and beside it enough food for a small group to travel several days.\n\n${x.Lead} thinks it is an invitation, though it could be a summons.`,
  ask: x => `Do you follow the marker from ${x.n} inland with unarmed envoys, let the food lie, or follow it with the watch and take whoever is waiting?`,
  choices: [
    small({ l: x => 'Send three envoys, unarmed', send: { days: [30, 60], danger: 2 }, hint: 'good', v: 'open' }),
    later(x => `The food is left where it lies. By the end of the month it is gone, and so is the marker.`, { f: { accord: -8 } }),
    { ap: 'force', l: 'Follow the marker with the watch, and take whoever is waiting', n: 'Hosts who have laid out food are not expecting rifles. A few of them alive would tell us everything.', v: 'severe closed bold', dark: true, b: 60, m: ['security'],
      ok: [x => `Six of them are waiting at the second marker with a meal laid out on a cloth. Four are brought back alive, roped together, and the meal with them. They are kept in a cargo pod and drawn, measured and questioned by signs. Nothing is left at the boundary again.`, { food: 60, morale: -3, stain: ['captive', 2], f: { insight: 40, accord: -75, threat: 12, kills: 2 } }],
      bad: [x => `There were a great many more than six, and they had only left the rifles out of their reckoning for the length of one volley.`, { lose: 1.5, stain: ['captive', 1], f: { accord: -75, threat: 25, kills: 3 } }] },
  ] });
F('humans', 3, { id: 'humans.parley', tone: 'opportunity', lead: ['teacher', 'security'], title: x => `${T(x)}: A Meeting Proposed`,
  text: x => `A message from ${x.n}: a place, halfway, and a date.\n\n[[note:Their message]] "Bring who you like. So will we."\n\n${x.Lead} reads it twice.\n\n[[${x.who}]] "Talks, or an ambush. Could be both. Either way, they've told us where they'll be standing."`,
  ask: x => `Do you send three to the meeting ${x.n} proposed, talk by radio only, or send three to talk with ten lying up above the place?`,
  choices: [
    small({ l: x => 'Send three to talk', send: { days: [20, 35], danger: 3 }, v: 'open' }),
    { ap: 'accord', l: 'Talk by radio only', hint: 'unknown', v: 'cautious', b: 50, m: ['teacher'], ok: [x => `Two hours on a bad channel, stilted and careful, but you are talking.`, { f: { accord: 14 } }], bad: [x => `They take it as fear, and they are right.`, { morale: -2, f: { threat: 8 } }] },
    { ap: 'force', l: 'Send three to talk, and ten to lie up above the place', n: 'Whoever they trust to speak for them will be standing in one spot, in the open, at a known hour.', v: 'severe closed', dark: true, b: 60, m: ['security'],
      ok: [x => `Their people come to the place in good faith, or near enough. The ten on the slope open fire once the talking has started. ${x.N} have lost everyone they trusted to speak for them, and what those people were carrying: maps, a cipher book, a working radio.`, { mat: 20, morale: -5, stain: ['parley', 3], f: { threat: -38, harm: 45, accord: -100, insight: 25, kills: 6 } }],
      bad: [x => `They had ten of their own on the other slope. The three who went to talk are the first to fall, from both directions.`, { lose: 2, pop: -3, morale: -6, stain: ['parley', 2], f: { accord: -100, threat: 28 } }] },
  ] });

/* Leads from the unexplored interior. One arrives each time the survey crews cover enough new ground. */
const lead = (id, title, text, ask, ret, danger, days, remote, when) => F('land', 3, { id, tone: 'opportunity', lead: ['geologist', 'pilot'], title, text, ask, when,
  choices: [
    small({ send: { days, danger: danger + 1, ret, to: x => 'the interior' } }),
    large({ send: { n: 8, days, danger, ret, to: x => 'the interior' } }),
    remote,
  ].concat(remote.cost ? [spare(x => `It goes on the map with a question mark.`, {})] : []) });   // a way to stay home that costs stores keeps the note for later as its spare
lead('land.smoke', 'Steam on the Horizon', x => `A white column on the horizon, in the same place three mornings running, and ${x.lead} thinks it is steam, not smoke.\n\nIt is a long walk over ground nobody has crossed.`, 'Do you send a party to the steam on the horizon, small or large, or have the ship image it?', 'springs', 2, [35, 60],
  { ap: 'study', l: 'Have the ship image it on the next pass', hint: 'unknown', out: [x => `The image shows cloud. The ship will try again in eleven days.`, { survey: 6 }] });
lead('land.wreck', 'Metal in the Hills', x => `Radar shows worked metal two hundred kilometres east, in a furrow a kilometre long. Something came down hard.\n\n[[${x.who}]] "That's a ship. One of ours, or somebody else's, and I can't tell which from here, and I can't stand not knowing which."`, 'Do you send a party to the wreck in the hills, small or large, or ping its transponder?', 'salvage', 2, [40, 70],
  { ap: 'study', l: 'Ping its transponder', hint: 'unknown', b: 40, m: ['engineer'], ok: [x => `A reply comes back: a cargo manifest, forty years old, listing a hold worth the walk.`, { survey: 12 }], bad: [x => `Nothing answers.`, {}] });
lead('land.outcrop', 'A Stained Cliff', x => `The survey crew have photographed a cliff streaked blue-green and rust. ${x.Lead} wants to stand under it with a hammer.\n\n[[${x.who}]] "That's metal weathering out, that has to be, but how much? You can't tell from a photo, you can't, I need to get a hammer on it."`, 'Do you send a party to the stained cliff, small or large, or pan the river gravel downstream instead?', 'ore', 1, [25, 45],
  { ap: 'study', l: 'Assay the river gravel downstream', hint: 'good', b: 60, m: ['geologist'], ok: [x => `There are nuggets in the pan, small ones, but enough to say the cliff is real.`, { mat: 15, survey: 10 }], bad: [x => `The pan comes up empty.`, {}] });
lead('land.valley', 'The Green Valley', x => `From the ridge, the survey crew saw a valley none of the orbital maps do justice: sheltered, watered, thick with growth.\n\nNobody knows what the growth is.`, 'Do you send a party into the green valley, small or large, or scatter seed on it from the drone?', 'soil', 2, [30, 50],
  { ap: 'study', l: 'Scatter seed from the drone and watch', hint: 'unknown', cost: { parts: 1, food: 20 }, out: [x => `The seed goes down. It will be a season before anyone knows.`, { survey: 8 }] });
lead('land.lights', 'Lights in the Far Hills', x => `The night watch has logged lights in the far hills, four nights in seven. They move, and neither the ${x.s.world.ship} nor the weather accounts for them.\n\n${x.Lead} would very much like to know what they are before they know what we are.`, 'Do you send a party toward the lights in the far hills, small or large, or signal them with the floodlights?', 'mystery', 3, [40, 75],
  { ap: 'accord', l: 'Signal with the floodlights', hint: 'unknown', v: 'open bold', b: 40, ok: [x => `The lights stop. Then, slowly, they repeat the pattern back.`, { survey: 25, morale: 3 }], bad: [x => `The lights go out all at once and do not return, as if whoever carried them knows they were seen.`, { morale: -3 }] });
lead('land.pod', 'A Beacon, Ours', x => `A recovery beacon has started up eighty kilometres west. Pod Fourteen: eight cryo units, written off in the descent.\n\n[[${x.who}]] "It's been out there the whole time, eight units, and we wrote them off, so what switched it on, and why now, and what else did we write off?"`, 'Do you send a party to recover Pod Fourteen, small or large, or query its telemetry?', 'pod', 2, [25, 45],
  { ap: 'study', l: 'Query the pod\'s telemetry', hint: 'unknown', b: 50, m: ['engineer'], ok: [x => `Six units are still green. They can wait a little longer, but not indefinitely.`, { survey: 6 }], bad: [x => `No answer but the beacon.`, {}] });
lead('land.herd', 'Herds on the Plain', x => `A river of animals is crossing the plain to the south. It has been passing for three days and the end is not in sight.\n\n${x.Lead} counts the stores and looks at you.`, 'Do you send a party after the herds on the plain, small or large, or net what strays near the fence?', 'herd', 2, [20, 40],
  { ap: 'exploit', l: 'Net what strays near the fence', hint: 'good', out: [x => `You net a dozen stragglers. The meat is tough, and all of it is eaten.`, { food: 70 }] }, s => !s.flags.no_native);
lead('land.salt', 'White Flats', x => `The survey crews report salt pans to the east, dazzling, a day across. Salt is the one thing the stores office has been rationing in secret.`, 'Do you send a party to the salt flats, small or large, or boil salt out of river brine instead?', 'salt', 1, [25, 40],
  { ap: 'study', l: 'Boil down river brine instead', hint: 'unknown', cost: { mat: 5 }, out: [x => `A week of fuel for a kilo of grey salt.`, { food: 30 }] });
lead('land.cave', 'The Mouth in the Cliff', x => `A cave mouth, big enough to fly the lander into, breathing cold air. ${x.Lead} threw a flare in and never heard it land.\n\nIt would make good shelter or storage, unless something already lives there.`, 'Do you send a party into the cave in the cliff, small or large, or fly a drone in?', 'cave', 3, [30, 50],
  { ap: 'study', l: 'Fly a drone in as far as the signal holds', hint: 'good', cost: { parts: 1 }, out: [x => `Two hundred metres of dry gallery, then static.`, { survey: 8 }] });
lead('land.timber', 'The Tall Stands', x => `Something like trees, sixty metres tall and straight as masts, in a valley two weeks north. The colony has been building in cargo strapping and scrap.`, 'Do you send a party to the tall stands, small or large, or test the driftwood the river brings instead?', 'timber', 2, [25, 45],
  { ap: 'study', l: 'Test the driftwood the river brings', hint: 'unknown', b: 60, m: ['botanist'], ok: [x => `It planes clean and holds a nail. There is not much of it.`, { mat: 12 }], bad: [x => `Once cut, it rots in a week.`, {}] }, s => !s.flags.no_native);
lead('land.bones', 'Bones in the Scarp', x => `A cliff has shed a skeleton the length of the lander. ${x.Lead} wants to know how long ago it died, and whether it has relatives.`, 'Do you send a party to the bones in the scarp, small or large, or photograph them from a drone?', 'bones', 2, [20, 35],
  { ap: 'study', l: 'Photograph it from a drone', hint: 'good', out: [x => `The pictures are good, and the children want to know what it ate.`, { survey: 8 }] });
lead('land.lake', 'The Still Lake', x => `A lake, perfectly round, that does not ripple in any wind. The survey crew who found it walked home faster than they walked out.\n\n[[${x.who}]] "Round means a crater, or a sinkhole, or somebody made it round, and you can't tell me you don't want to know which."`, 'Do you send a party to the round lake, small or large, or drop a sonde into it from a drone?', 'mystery', 3, [35, 60],
  { ap: 'study', l: 'Drop a sonde from a drone', hint: 'unknown', cost: { parts: 1 }, b: 50, ok: [x => `Forty metres of clear water, and then a floor that is too flat.`, { survey: 15 }], bad: [x => `The sonde stops transmitting at forty metres.`, {}] });
lead('land.crater', 'A Fresh Crater', x => `Something came down in the night, forty kilometres north. The flash lit the pods. Nickel-iron, if the colour was any guide, and still warm.`, 'Do you send a party to the fresh crater, small or large, or sift what fell near the camp?', 'ore', 2, [15, 30],
  { ap: 'exploit', l: 'Sift the ejecta that fell near the camp', hint: 'good', out: [x => `You rake beads of clean metal out of the fields.`, { mat: 10 }] });
lead('land.pass', 'A Way Through', x => `The survey crews have found a pass through the range. Beyond it, everything on the map is blank.\n\n[[${x.who}]] "Half the continent's through there, half, and nobody's even looked, we've been sitting here counting our stores and half the continent is through there."`, 'Do you send a party through the pass, small or large, or have the ship image the far side?', 'pass', 3, [45, 75],
  { ap: 'study', l: 'Have the ship image the far side', hint: 'unknown', out: [x => `Cloud, mostly, and one long glint that might be water.`, { survey: 10 }] });
lead('land.towers', 'Sweet Smoke', x => `Something small and many-legged builds towers on the south slope, taller than a person, out of a wax that burns with a clean flame. ${x.Lead} brought back a lump. The engineers will not give it back.`, 'Do you send a party to the wax towers on the south slope, small or large, or smoke out one tower near the fence?', 'wax', 2, [20, 40],
  { ap: 'exploit', l: 'Smoke out one tower near the fence', hint: 'unknown', b: 50, ok: [x => `A tower's worth of wax, and some annoyed residents.`, { parts: 3 }], bad: [x => `Every tower on the slope empties at once.`, { morale: -2 }] }, s => !s.flags.no_native);

/* ======================= SECOND SIGNS, SECOND BLOOD, A THIRD MIDDLE =======================
   So that the shape of a thread does not repeat from one game to the next. */
F('fauna', 1, { id: 'fauna.drone', tone: 'pressure', lead: ['xenobio', 'security'], title: x => `${T(x)}: What the Drone Saw`,
  text: x => `A survey drone sent back forty seconds of footage before something knocked it down: ${x.K.form}, and more than one of them.\n\n${x.Lead} has watched it a dozen times.\n\n[[${x.who}]] "Watch, there, they ${x.K.habit}, and right at the end, see, no, back it up, see? They've seen us. They know we're here."`,
  ask: x => `Do you send a second drone to watch ${x.n}, trap one alive, or mark ${x.their} range and keep out of it?`,
  choices: [
    { ap: 'study', l: 'Send another drone, higher', cost: { parts: 1 }, out: [x => `This one gets hours of footage. They want ${x.K.wants}, and they keep clear of ${x.K.weak}.`, { f: { insight: 30 } }] },
    { ap: 'exploit', l: 'Bait a pit and take one alive', b: 50, m: ['security'], ok: [x => `One, alive and furious, in a cargo net. ${x.Lead} has never been happier.`, { f: { insight: 35, accord: -5, threat: 0 } }], bad: [x => `The pit takes one, and the others come for it in the night.`, { lose: 0.5 }] },
    { ap: 'avoid', l: 'Mark their range on the map and stay out of it', out: [x => `A red line on the map. It runs closer to the camp than anyone likes.`, { f: { threat: -4 } }] },
  ] });
F('fauna', 2, { id: 'fauna.inside', tone: 'crisis', lead: ['security', 'xenobio'], title: x => `${T(x)}: Among Us`,
  text: x => `${x.N} did not stop at the fence this time. They came inside it, in daylight, to ${at(x)}, with people ten metres away.\n\n[[${x.who}]] "They're done testing us, and I don't care for what that tells me, because ten metres from people, in daylight, means they've made their minds up and I doubt it's in our favour."`,
  ask: x => `With ${x.n} inside the fence, do you drive ${x.them} out through the east pods, film ${x.them} while three of yours stand still, or burn the compound with two of yours in it?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Drive them out through the east pods. It is the only side they will run to', b: 50, m: ['security'], ok: [x => `Flares, engines, every pot in the mess hall, and a gap left on the east side where the bunk pods are. They break through it and do not look back. Two people in the east pods had not been moved.`, { pop: -2, stain: ['decoy_ours', 2], f: { threat: -15 } }], bad: [x => `They charge straight through the flares.`, { lose: 1, stain: ['decoy_ours', 1] }] },
    { ap: 'study', dark: true, v: 'severe cautious', l: 'Hold fire and film it. The three who are closest are told to stand still', b: 50, m: ['xenobio'], ok: [x => `Nobody moves for an hour, on your order, the three closest included. The footage shows which one the others watch.`, { stain: ['watched', 1], f: { insight: 40 } }], bad: [x => `One of the three who were told to stand still cannot do it for the whole hour.`, { pop: -1, lose: 0.3, stain: ['watched', 2], f: { insight: 10 } }] },
    { ap: 'exploit', dark: true, v: 'severe closed', l: 'Shut the gate behind them and burn the compound', n: 'All of them are inside one fence for the first time. So are two of ours.',
      out: [x => `The gate is chained and the fuel line opened. Everything inside the fence burns: ${x.n}, ${at(x)}, and the two who were working there and did not reach the gate before the chain went on. It is the last time ${x.they} come inside.`, { lose: 0.5, pop: -2, morale: -3, stain: ['burned_in', 2], f: { threat: -45, harm: 55 } }] },
  ] });
F('fauna', 3, { id: 'fauna.hungry', tone: 'pressure', lead: ['xenobio', 'security'], needs: ['guides', 'fighters'], title: x => `${T(x)}: Hungry Season`,
  text: x => `It has been a bad season for whatever ${x.n} usually eat. They are thin, bold, and all around ${at(x)}.\n\n[[${x.who}]] "They're starving." "Look at the ribs on them, look, they'll come in, nothing that hungry just lies down and dies, and I'd give a great deal to see what it does instead."`,
  ask: x => `With ${x.n} starving around ${at(x)}, do you feed ${x.them} from the rations of the sick and the old, shoot whatever comes in, or trap ${x.them} with the lock-up walking the line unarmed?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Feed them through it, off the ladle of the sick list and the old', cost: { food: 80 }, v: 'open severe', b: 60, m: ['xenobio'], ok: [x => `${x.They} eat, and stay out past the markers. The cart is filled from what the sick list and the old would have had, and one of the old does not see the end of the season.`, { pop: -1, stain: ['starved_list', 1], f: { threat: -10 } }], bad: [x => `${x.They} eat, and then follow the smell to where it came from.`, { lose: 0.5, stain: ['starved_list', 1] }] },
    { ap: 'force', l: 'Let hunger do the work, and shoot what comes in', v: 'severe closed', b: 50, m: ['security'], ok: [x => `By the end of the season there are a third as many.`, { f: { harm: 35, threat: -15 } }], bad: [x => `They come in anyway, faster than anyone can aim.`, { lose: 1 }] },
    { ap: 'exploit', dark: true, v: 'severe order', l: 'Trap them while they are weak. The lock-up walks the trap line, unarmed', b: 60, m: ['security'], ok: [x => `Thin meat and good hides, and fewer of ${x.them} for next year. The prisoners who walk the trap line do it without rifles.`, { food: 240, stain: ['expend', 1], f: { harm: 15, threat: -6 } }], bad: [x => `The traps are robbed and the trappers followed. Two of them do not get back to the wire.`, { pop: -2, stain: ['expend', 2] }] },
  ] });

F('flora', 1, { id: 'flora.samples', tone: 'pressure', lead: ['botanist', 'xenobio'], title: x => `${T(x)}: In the Samples`,
  text: x => `${x.Lead} has found the same thing in every soil sample from the east side: ${x.K.form}. It was not in last month's samples.\n\n[[${x.who}]] "I can tell you how fast it's coming. Not why. Not why our ground."`,
  ask: 'Do you plant test beds to learn what is in the east-side soil, dig it out and dump it in the river, or give up the east side?',
  choices: [
    { ap: 'study', l: 'Plant test beds and watch it work', out: [x => `The six beds go six different ways, but together they show that it ${x.K.habit}. It wants ${x.K.wants}, and it dislikes ${x.K.weak}.`, { f: { insight: 30 } }] },
    { ap: 'force', l: 'Dig out the east side and dump it in the river', b: 50, m: ['botanist'], ok: [x => `It takes three days of shovelling, and the next samples are clean.`, {}], bad: [x => `The river carries it everywhere the river goes.`, { f: { threat: 14 } }] },
    { ap: 'avoid', l: 'Give up the east side', out: [x => `The work moves west, though the east side had the better ground.`, { yield: -0.03, f: { threat: -6 } }] },
  ] });
F('flora', 2, { id: 'flora.night', tone: 'crisis', lead: ['botanist', 'engineer'], stakes: ['machine', 'project', 'mat', 'food'], title: x => `${T(x)}: Overnight`,
  text: x => `Yesterday ${x.n} was at the fence. This morning it has ${x.st}, and it is still spreading.\n\n[[${x.who}]] "Today. Whatever we do, it's today. Tomorrow it's in the beds."`,
  ask: x => `How do you stop ${x.n} today: everyone out with blades and fire, the sick list included, or a trench around the rest with the lock-up digging the far side?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Everyone out with blades and fire, the sick list included', b: 50, m: ['botanist'], ok: [x => `By dark it is back outside the fence. The sick list cut beside everyone else, and one of them is in the clinic for good.`, { pop: -1, stain: ['driven', 1], f: { threat: -12 } }], bad: [x => `It grows back behind the cutters as fast as they cut.`, { lose: 1, stain: ['driven', 1] }] },
    { ap: 'exploit', dark: true, v: 'severe bold', l: x => `Hit it with ${x.K.weak} now, before the crew inside is clear`, show: knows, b: 70, m: ['engineer'], ok: [x => `It dies back within the hour, in a widening ring. Four people were still inside the ring when it went on, and one of them stays in the clinic.`, { pop: -1, stain: ['burned_in', 1], f: { threat: -32, accord: 0 } }], bad: [x => `It works where it reaches, but it doesn't reach far enough, and four people were inside it.`, { lose: 0.5, pop: -1, stain: ['burned_in', 1] }] },
    { ap: 'avoid', dark: true, v: 'severe order', l: 'Trench around the rest. The lock-up digs the far side, in it', cost: { mat: 20 }, out: [x => `A trench a day's work wide, dug from both sides at once. Four prisoners dig the far side, standing in it, and three walk back. Everything beyond the trench is given up.`, { lose: 0.5, pop: -1, stain: ['expend', 2], f: { threat: -15, wall: 1 } }] },
  ] });
F('flora', 3, { id: 'flora.people', tone: 'pressure', lead: ['physician', 'botanist'], stakes: ['crew'], title: x => `${T(x)}: What It Does to People`,
  text: x => `The crews who work nearest ${x.n} have changed. Nothing a scan can find: they are slow to anger, they hum, they do not like to be indoors.\n\n${x.Lead} would like to know whether that is a symptom or a preference.`,
  ask: x => `What do you do about the crews changed by working near ${x.n}: keep them indoors against their wishes, let them be, or put every crew through the same change?`,
  choices: [
    { ap: 'force', dark: true, l: 'Take the changed crews off it and keep them indoors, whatever they want', v: 'cautious order severe', out: [x => `New crews, short shifts, masks. The old crews are kept indoors on the far side of the camp. They sit at the window in the evenings and hum.`, { morale: -2, stain: ['kept_in', 1], f: { threat: -14, harm: 0, accord: 0 } }] },
    { ap: 'accord', l: 'Let them be. They are not unhappy', v: 'open free', b: 50, m: ['chaplain'], ok: [x => `They are the best field hands the colony has. They say it tells them where to plant.`, { yield: 0.05, f: { accord: 20 } }], bad: [x => `One morning some of them are not in their bunks. They are found standing in it, rooted to the knees, smiling.`, { lose: 1 }] },
    { ap: 'exploit', dark: true, v: 'severe order', l: 'They are the best hands we have. Put every crew through it', n: 'A month at the fence, unmasked, by rota. Nobody would be asked.',
      out: [x => `Every field crew does its month at the fence. The harvest is the best the colony has had, and nobody argues at meals any more. Some of them have to be led in from the dark at night, and two walk into it and are not found.`, { yield: 0.1, pop: -2, stain: ['dosed', 2], f: { accord: 20, threat: 10 } }] },
  ] });

F('plague', 1, { id: 'plague.pattern', tone: 'pressure', lead: ['physician'], title: x => `${T(x)}: A Pattern`,
  text: x => `${x.Lead} has been keeping a list nobody asked for. Headaches, a rash, a week of bad sleep: six people, none sick enough to report, all from one bunk row.\n\n[[${x.who}]] "Six of them, one row. If I'm right — and I'd love not to be — next we'll see ${x.K.sign}."`,
  ask: 'Do you empty the bunk row and scrub it to the metal, or tell the six to rest and report back?',
  choices: [
    { ap: 'study', l: 'Test the whole bunk row', req: x => LF.down(x.s, 'medbay'), reqText: 'Needs the Autodoc', out: [x => `It is real, and the tests show that it ${x.K.habit}.`, { machine: { medbay: -5 }, f: { insight: 30 } }] },
    { ap: 'force', l: 'Empty the bunk row and scrub it to the metal', cost: { mat: 10 }, v: 'cautious order', out: [x => `Bleach, steam, new bedding. Six people sleep in the mess hall and resent it.`, { morale: -2, f: { threat: -8, harm: 0, accord: 0 } }] },
    { ap: 'avoid', l: 'Tell them to rest and report back', v: 'mercy', out: [x => `They rest. Two of them report back.`, { f: { threat: 10 } }] },
  ] });
F('plague', 2, { id: 'plague.beds', tone: 'crisis', lead: ['physician', 'chaplain'], stakes: ['crew', 'person'], title: x => `${T(x)}: Four Beds`,
  text: x => `${x.N} has put twenty people on their backs in a week. The clinic has four beds.\n\n${x.Lead} hands you the list.\n\n[[${x.who}]] "Twenty names, four beds. So you tell me how I'm meant to choose, because I'm not doing it on my own."`,
  ask: 'Who gets the four clinic beds: those the colony can least spare, the officers and their families, or whoever the clinic can turn over fastest?',
  choices: [
    { ap: 'force', dark: true, l: 'The ones the colony can least spare. The rest go to the corridor', v: 'severe order', out: [x => `It is a defensible rule. The people at the bottom of the list can do the arithmetic too, and they do it on blankets in the corridor.`, { lose: 0.4, morale: -3, stain: ['triage', 2], f: { threat: -22, harm: 0, accord: 0 } }] },
    { ap: 'accord', dark: true, l: 'Officers and their families first', n: 'The colony cannot be run from a sickbed.', v: 'order severe', b: 50, m: ['physician'], ok: [x => `Most of the four live. Everyone knows whose names were on the beds.`, { morale: -3, stain: ['served_first', 2], f: { threat: -14, accord: 0 } }], bad: [x => `The four die anyway, in beds that others needed, and everyone knows whose names were on them.`, { lose: 1, morale: -4, stain: ['served_first', 2] }] },
    { ap: 'force', dark: true, v: 'severe order', l: 'Turn the beds over faster. The clinic can end the ones who will not make it', n: 'A bed held for four days by someone who dies in it is a bed three others did not get.',
      out: [x => `${x.Lead} marks the charts and the night orderly does the rest. Each bed turns over twice as fast, and eleven are treated who would not have been. Four names are entered as having died in their sleep.`, { pop: -4, morale: -3, stain: ['mercy_killing', 2], f: { threat: -28, accord: 0 } }] },
  ] });
F('plague', 3, { id: 'plague.cure', tone: 'opportunity', lead: ['physician', 'xenobio'], title: x => `${T(x)}: A Cure, of Sorts`,
  text: x => `${x.Lead} has something that stops ${x.n}: a compound from a native ${x.s.flags.no_native ? 'lichen' : 'root'} that kills it in the blood. It also does something to the liver that will take years to show.\n\n[[${x.who}]] "It works. And I wouldn't let anyone I loved near it."`,
  ask: x => `Do you give the compound that stops ${x.n} to the sick without telling them about the liver, refine it on the dying, or lock it away until it is safe?`,
  choices: [
    { ap: 'exploit', dark: true, l: 'Give it to everyone who is sick, and say nothing about the liver', v: 'bold severe', out: [x => `The wards empty in a week. Nobody who took it is told what else it does. ${x.Lead} starts a ledger of who took it, and when, for later.`, { stain: ['withheld', 2], f: { threat: -40, insight: 10, accord: 0 }, flags: { cure_debt: true } }] },
    { ap: 'study', dark: true, v: 'severe cautious', l: 'Refine it on the dying, who are told it is the finished thing', b: 50, m: ['physician'], ok: [x => `The third version is easier on the liver, though still hard on it. The dying who took the first two were told they were being treated.`, { stain: ['trial', 1], f: { insight: 35, threat: -18 } }], bad: [x => `While it is refined the beds stay full, and some of the people in them die of the early versions.`, { lose: 0.7, stain: ['trial', 2], f: { insight: 15 } }] },
    { ap: 'avoid', l: 'Not until it is safe', v: 'cautious', out: [x => `It goes in a locked cabinet, and the families of the sick know which one. Two of the sick die within sight of it.`, { pop: -2, morale: -3, f: { threat: 8 } }] },
  ] });

F('ruin', 1, { id: 'ruin.fragment', tone: 'opportunity', lead: ['geologist', 'engineer'], title: x => `${T(x)}: A Souvenir`,
  text: x => `A survey crew came back a day early and oddly quiet. They found ${x.K.form}. One of them pocketed a fragment the size of a thumb: warm, and it will not show up on a photograph.\n\nThey are calling the place ${x.n}.`,
  ask: x => `Do you put the fragment from ${x.n} in the lab, send the crew back for more, or return the fragment to where it was found?`,
  choices: [
    { ap: 'study', l: 'Put the fragment in the lab', b: 60, m: ['engineer'], ok: [x => `It is no alloy anyone can name. Even this much of it ${x.K.habit}.`, { f: { insight: 30 } }], bad: [x => `The instruments all agree with each other, and are all wrong. Two have to be rebuilt.`, { parts: -2, f: { insight: 10 } }] },
    { ap: 'exploit', l: 'Go back for more', v: 'bold open', b: 50, m: ['geologist'], ok: [x => `The crew comes back with full packs and doesn't chatter on the way home.`, { parts: 5, mat: 25, f: { insight: 10, accord: -5 } }], bad: [x => `The second visit goes wrong in ways the crew can't explain.`, { lose: 1 }] },
    { ap: 'avoid', l: 'Put the fragment back where it was found', v: 'cautious closed', out: [x => `A crew walks two days to return a pebble. One of them says it felt like the right thing, and cannot say why.`, { f: { threat: -8 } }] },
  ] });
F('ruin', 2, { id: 'ruin.reach', tone: 'pressure', lead: ['engineer', 'geologist'], stakes: ['machine', 'project', 'mat'], title: x => `${T(x)}: It Takes an Interest`,
  text: x => `${x.N} has done something to ${obj(x)}. Nobody was near. The logs show eleven seconds of interference, and then the change.\n\n[[${x.who}]] "Something reached out." "Eleven seconds, then that. Handshake or shove, I couldn't tell you, and I don't like not knowing which. It's been in my kit."`,
  ask: x => `After ${x.n} reached into ${obj(x)}, do you leave a crew beside it to watch it happen again, bury the cables with the lock-up digging, or answer it through an apprentice's hands?`,
  choices: [
    { ap: 'study', about: true, dark: true, v: 'severe cautious', l: x => `Leave a crew beside ${at(x)} with instruments, and wait for it to do it again`, b: 60, m: ['engineer'], ok: [x => `It does it again on the third night, with four people beside it and every instrument running. The change is precise and local, and looks very much like a measurement being taken. Two of the four have not spoken since.`, { morale: -2, stain: ['watched', 2], f: { insight: 45 } }], bad: [x => `It does it again while the instruments are watching, and this time it does it to the crew.`, { lose: 0.5, pop: -1, stain: ['watched', 2], f: { insight: 15 } }] },
    { ap: 'avoid', dark: true, v: 'severe order', l: 'Bury the cables. The lock-up trenches for a month on half rations', cost: { mat: 10 }, out: [x => `A month of trenching by people who had no say in it. The interference stops, or stops being noticed. One of the diggers is buried in the spoil of the last trench.`, { pop: -1, stain: ['detail', 1], f: { threat: -16, wall: 1 } }] },
    { ap: 'accord', dark: true, l: 'Answer it. An apprentice holds the contact by hand', n: 'Nothing else in stores will carry the signal across the gap.', v: 'open bold severe', b: 40, m: ['xenobio'], ok: [x => `It replies at once, with twelve. The apprentice holding the contact is asked what it felt like and cannot say, then or later.`, { stain: ['expend', 1], f: { accord: 28, insight: 18 } }], bad: [x => `It replies at once, to everything, at full strength, through the apprentice holding the contact.`, { pop: -1, lose: 0.5, stain: ['expend', 2] }] },
  ] });
F('ruin', 3, { id: 'ruin.pilgrims', tone: 'pressure', lead: ['chaplain', 'security'], title: x => `${T(x)}: The Ones Who Go and Look`,
  text: x => `People have started walking out to ${x.n} on rest days. A dozen at first; now forty. They sit and look at it. Some have stopped coming back for the evening meal.\n\n[[${x.who}]] "It's not calling them. I've sat out there with them and listened. They just go, like it's church, and I haven't got anything to put in its place."`,
  ask: x => `What do you do about the people walking out to ${x.n}: forbid it, go and sit with them once, or order the watch to fire?`,
  choices: [
    { ap: 'avoid', l: 'Forbid it', v: 'order closed', out: [x => `A watch post on the path. People find other paths.`, { morale: -3, f: { threat: -5 } }] },
    { ap: 'accord', l: 'Go with them, once, and see', v: 'open', b: 50, m: ['chaplain'], ok: [x => `You sit there a whole afternoon. Nothing happens, and by the end of it you don't want to leave either.`, { morale: 3, f: { accord: 15, insight: 10 } }], bad: [x => `You sit a whole afternoon. When you stand up, three hours are missing, for everyone there.`, { morale: -2, f: { threat: 12 } }] },
    { ap: 'force', dark: true, v: 'severe order', l: 'Post the watch on the path, with orders to fire', n: 'Forty people sitting out there are forty people not in the fields.',
      out: [x => `Two walk past the post anyway, on the second rest day, not hurrying, and the watch does what it was told. After that the path grows over, and the forty are back at their shifts.`, { pop: -2, morale: -6, stain: ['path', 2], f: { threat: -15 } }] },
  ] });

F('natives', 1, { id: 'natives.watched', tone: 'pressure', lead: ['security', 'xenobio'], title: x => `${T(x)}: Watched`,
  text: x => `For a week the night watch has felt watched. This morning ${x.lead} found where the watchers sat: flattened grass, a ring of small stones, and one of our own bolts, polished bright, set in the middle.\n\nWhoever they are, they are ${x.K.form}. The crews are saying "${x.n}".`,
  ask: x => `Do you sit in the ring and wait for ${x.n}, watch the watchers in turn, or burn the grass back two hundred metres?`,
  choices: [
    { ap: 'accord', l: 'Sit in the ring, in daylight, and wait', v: 'open bold', b: 50, m: ['xenobio'], ok: [x => `At dusk one comes to the edge of the grass, looks for a long time, and goes. In the morning the bolt has been replaced with a carved stone.`, {}], bad: [x => `Nobody comes. In the morning the ring has been scattered.`, { f: { accord: -5 } }] },
    { ap: 'study', l: 'Watch the watchers', out: [x => `Night lenses and patience show that they ${x.K.habit}, and that they want ${x.K.wants}.`, {}] },
    { ap: 'force', l: 'Burn the grass back two hundred metres', cost: { mat: 10 }, v: 'closed cautious', out: [x => `It leaves a black strip, bare to the dirt.`, { f: { accord: -12, threat: -5, harm: 0, wall: 1 } }] },
  ] });
F('natives', 2, { id: 'natives.trade', tone: 'pressure', lead: ['quartermaster', 'xenobio'], stakes: ['food', 'mat'], title: x => `${T(x)}: Taken, and Paid For`,
  text: x => `${x.N} came in the night and took from ${thing(x)}. In its place they left something of their own: worked, deliberate, and plainly meant as payment.\n\n[[${x.who}]] "Maybe it's fair, to them. They still came in the dark and took it without asking."`,
  ask: x => `How do you answer ${x.n} taking from ${thing(x)} and leaving payment: accept the trade at the sick bay's expense, shoot to kill, or leave out poisoned meal?`,
  choices: [
    { ap: 'accord', dark: true, l: 'Accept the trade, and leave out what the sick bay would have eaten', v: 'open severe', out: [x => `More is left out each night, and more is left in its place, some of it useful. What goes out comes off the trays for the sick bay, who are not told. One of them does not get up again.`, { mat: 20, pop: -1, stain: ['starved_list', 1], f: { accord: 32, threat: -10 } }] },
    { ap: 'force', dark: true, l: 'Guard the stores, and shoot to kill', v: 'closed severe', b: 50, m: ['security'], ok: [x => `Three of them are on the ground by the stores door at first light. They do not come again.`, { stain: ['terror', 2], f: { accord: -45, harm: 15, threat: -22, kills: 3 } }], bad: [x => `The watch fires at movement by the stores door, and it is the night cook.`, { pop: -1, morale: -4, stain: ['terror', 1], f: { accord: -20, threat: 10 } }] },
    { ap: 'exploit', l: 'Leave out more, dosed from the pest locker', n: 'They take what is left out, and they share what they take.', v: 'severe closed', dark: true, b: 60, m: ['physician'],
      ok: [x => `A sack of meal is dosed with rat bait from the ship's stores and set where the last lot was taken. It is gone by morning, with a payment left in its place. Nothing comes for the stores again. Before the month is out, the watch finds where eleven of them lay down together, some of them small.`, { morale: -3, stain: ['poisoned_bait', 2], f: { threat: -32, harm: 35, accord: -80, kills: 11 } }],
      bad: [x => `The sack is left untouched. Beside it they have laid something small and dead that was fed a little of it first, and all the payments they ever left have been taken back.`, { stain: ['poisoned_bait', 1], f: { accord: -60, threat: 18 } }] },
  ] });
F('natives', 3, { id: 'natives.children', tone: 'opportunity', lead: ['teacher', 'xenobio'], stakes: ['morale'], title: x => `${T(x)}: The Children`,
  text: x => `The colony's children have been meeting the young of ${x.n} at the stream for months. They have a game, forty shared words, and a den.\n\n${x.Lead} found out when one of ours came home wearing something woven.`,
  ask: x => `Do you let the children keep meeting the young of ${x.n} at the stream, stop it, or keep two of their young inside the fence?`,
  choices: [
    { ap: 'accord', l: 'Let it go on, with someone watching', v: 'open free', b: 60, m: ['teacher'], ok: [x => `The word list reaches two hundred. The adults on both sides learn it from the children.`, { f: { accord: 30, insight: 15 } }], bad: [x => `A child comes home with a fever nobody has seen before, and the stream is put out of bounds by both sides.`, { lose: 0.5, f: { accord: 8 } }] },
    { ap: 'avoid', l: 'Stop it. Keep the children inside the fence', v: 'closed cautious', out: [x => `The den is found pulled down a month later. Nobody knows which side did it.`, { morale: -3, f: { accord: -15 } }] },
    { ap: 'force', l: 'Next time they come to the stream, keep two of theirs', n: 'Nothing with young inside our fence will come at it.', v: 'severe closed', dark: true,
      out: [x => `Two of their young are carried in from the stream, biting. They are kept in the schoolroom, where they can be seen from the fence, fed and unharmed. The colony's children are told it is a visit. The adults of ${x.n} stop coming within a rifle shot of anything you have built.`, { morale: -5, stain: ['hostages', 2], f: { threat: -40, accord: -60, insight: 15 } }] },
  ] });

F('humans', 1, { id: 'humans.voices', tone: 'pressure', lead: ['teacher', 'security'], title: x => `${T(x)}: Voices`,
  text: x => `The night shift has picked up voice traffic: short, clipped, human, and not ours. ${x.Lead} has pieced together who is talking: ${x.K.form}.\n\nThe crews are already calling them ${x.n}.`,
  ask: x => `Do you listen in on ${x.n}, break in on their channel to say hello, or feed them false traffic about your numbers?`,
  choices: [
    { ap: 'study', l: 'Listen, and log everything', v: 'cautious', out: [x => `A month of logs shows that they ${x.K.habit}, and that they want ${x.K.wants}.`, {}] },
    { ap: 'accord', l: 'Break in on their channel and say hello', b: 50, m: ['teacher'], ok: [x => `There is silence, then laughter, and then a voice.\n\n[[${them(x)}]] "Took you long enough."`, {}], bad: [x => `The channel goes dead and stays dead. They have others.`, { f: { threat: 6 } }] },
    { ap: 'exploit', l: 'Feed them false traffic about our numbers', v: 'closed order', b: 50, m: ['security'], ok: [x => `For now, they believe there are four hundred of you.`, { f: { threat: -12, accord: -5 } }], bad: [x => `They had been counting the cooking fires all along.`, { f: { accord: -15, threat: 8 } }] },
  ] });
F('humans', 2, { id: 'humans.held', tone: 'crisis', lead: ['security', 'chaplain'], stakes: ['person', 'crew'], title: x => `${T(x)}: Held`,
  text: x => `${x.N} are holding ${who(x)}. Unharmed, they say, and not free to go until there is an understanding. What they want is ${x.K.wants}.\n\n[[${x.who}]] "Scared people with a hostage. Lovely. That's how somebody ends up dead by accident."`,
  ask: x => `How do you get ${x.st} back from ${x.n}: raid them at night, pay what they ask out of the watch's ration, or refuse to pay at all?`,
  choices: [
    { ap: 'force', dark: true, v: 'severe bold', l: 'Take them back by night, and burn the huts on the way out', b: 50, m: ['security'], ok: [x => `In and out in ten minutes, with the roofs alight behind. Nobody on your side is hurt.`, { stain: ['reprisal', 2], f: { harm: 35, threat: -15, accord: -40, kills: 4 } }], bad: [x => `Nobody had planned for the dogs.`, { lose: 1.5, stain: ['reprisal', 1] }] },
    { ap: 'exploit', dark: true, l: 'Pay what they ask, out of the ration of the watch that let it happen', v: 'cautious severe', cost: { food: 120 }, out: [x => `The stores are lighter and everyone is home. The watch that was on duty eats half for the season to make up the difference, and so do their families.`, { stain: ['ration_rota', 1], f: { accord: 5, threat: 4 } }] },
    { ap: 'avoid', l: 'Nobody is worth what they are asking. Say so on the radio', n: 'It is read to them once. A colony that will not pay is not worth taking hostages from.', v: 'severe order', dark: true,
      out: [x => `The answer is read to them over the radio, once, by ${x.lead}. There is no reply. They take no more of the colony's people after that.`, { lose: 1, morale: -5, stain: ['written_off', 2], f: { threat: -28, accord: -20 } }] },
  ] });
F('humans', 3, { id: 'humans.market', tone: 'opportunity', lead: ['quartermaster', 'security'], title: x => `${T(x)}: A Market`,
  text: x => `Without anyone deciding it, a trading ground has grown up halfway to ${x.n}: a flat rock, a set day, and prices.\n\n[[${x.who}]] "Our people are swapping spares for their dried meat. I can stop it. Tax it. Or do it properly, with fair weights."`,
  ask: x => `What do you do with the trading ground halfway to ${x.n}: make it official with fair weights, or tax it and search every pack?`,
  choices: [
    { ap: 'accord', l: 'Make it official, with fair weights', b: 60, m: ['quartermaster'], ok: [x => `A ledger, a standing day, and more coming in than going out.`, { food: 200, mat: 20 }], bad: [x => `Fair weights turn out to be a matter of opinion.`, { parts: -3, f: { accord: 5 } }] },
    { ap: 'exploit', dark: true, l: 'Tax it, and turn out every pack at the gate', v: 'order severe', out: [x => `A tenth of everything goes to the common store, and the watch searches everyone coming back from the rock. The trade moves a kilometre further off.`, { food: 140, morale: -2, stain: ['searched', 1], f: { accord: -5, threat: 0 } }] },
    { ap: 'avoid', show: x => !(x.s.sleepers >= 20 && !x.s.machines.lander.lost), l: 'Shut it down', v: 'closed order', out: [x => `The rock is empty on the set day. Some of the spares go missing anyway.`, { parts: -2, f: { accord: -15, threat: 6 } }] },
    { ap: 'exploit', l: 'They are short of hands. Sell them sleepers', n: 'Twenty pods, handed over sealed. The people in them would wake among strangers, owing them a passage they never chose.', v: 'severe order', dark: true, show: x => x.s.sleepers >= 20 && !x.s.machines.lander.lost,
      out: [x => `Twenty pods come down on one flight and are carried to the flat rock on poles. ${x.N} pay in dried meat, by weight, against the manifest's listed trades. ${x.Lead} strikes the twenty names from the cryo index and writes "transferred" beside each.`, { sleepers: -20, food: 520, machine: { lander: -10 }, morale: -4, stain: ['sold', 3], f: { accord: 25, threat: -12 }, flags: { sleepers_traded: true } }] },
  ] });

/* ======================= A SECOND EXPEDITION FOR EACH KIND ======================= */
F('fauna', 3, { id: 'fauna.gap', tone: 'opportunity', lead: ['xenobio', 'security'], title: x => `${T(x)}: The Crossing`,
  text: x => `${x.Lead} thinks ${x.n} all pass through one place twice a year: a gap in the hills, three weeks out. Whoever watches that gap for a season will know more than a year of patrols.`,
  ask: x => `Do you send three to watch the gap where ${x.n} pass, eight to hold it, or ask the ship to watch it from orbit?`,
  choices: [
    small({ l: x => 'Send three to watch the gap', send: { days: [35, 55], danger: 3 } }),
    large({ l: x => 'Send eight to hold it', send: { n: 8, days: [35, 55], danger: 3 }, v: 'bold closed', hint: 'unknown' }),
    { ap: 'study', l: 'Ask the ship to watch the gap from orbit', hint: 'unknown', out: [x => `Three passes show a brown smear moving through the hills, which gives a rough count at best.`, { f: { insight: 12 } }] },
  ] });
F('flora', 3, { id: 'flora.edge', tone: 'opportunity', lead: ['botanist', 'geologist'], title: x => `${T(x)}: Where It Stops`,
  text: x => `Far to the north, the orbital images show a line where ${x.n} simply ends. ${x.Lead} wants to stand on that line and find out why.`,
  ask: x => `Do you send a party north to the edge of ${x.n}, small or large, or work out the line from the spectra?`,
  choices: [
    small({ send: { days: [45, 70], danger: 2 } }),
    large({ send: { n: 8, days: [45, 70], danger: 2 } }),
    { ap: 'study', l: 'Work it out from the spectra', hint: 'unknown', b: 50, m: ['botanist'], ok: [x => `The line follows a seam of something it cannot stand: ${x.K.weak}.`, { f: { insight: 22 } }], bad: [x => `The spectra show the line, but not why it is there.`, {}] },
  ] });
F('plague', 3, { id: 'plague.valley', tone: 'opportunity', lead: ['physician', 'xenobio'], title: x => `${T(x)}: The Clean Valley`,
  text: x => `A survey crew reports a valley where nothing carries ${x.n} at all. If there is a reason, ${x.lead} wants it in a sample jar.`,
  ask: x => `Do you send a party to the valley free of ${x.n}, small or large, or have the survey crew carry samples out?`,
  choices: [
    small({ send: { days: [30, 50], danger: 3 } }),
    large({ l: x => 'Send eight, with a field lab', send: { n: 8, days: [30, 50], danger: 2 }, cost: { parts: 2 } }),
    { ap: 'study', l: 'Have the survey crew carry out what they can', hint: 'unknown', b: 50, ok: [x => `Three jars survive the walk home.`, { f: { insight: 18 } }], bad: [x => `The samples spoil on the way home.`, {}] },
  ] });
F('ruin', 3, { id: 'ruin.second', tone: 'opportunity', lead: ['geologist', 'engineer'], title: x => `${T(x)}: Another One`,
  text: x => `The readings from ${x.n} point to a second site, ${x.s.world.type === 'drowned' ? 'on another island' : 'far across the plain'}: larger, and joined to this one by something under the ground.\n\n[[${x.who}]] "Bigger, and they're connected, joined right underneath us, so we go and find it, or we sit here till it finds us, and I know which I'd pick, and so do you."`,
  ask: x => `Do you send a party to the second site joined to ${x.n}, small or large, or trace the link with seismographs?`,
  choices: [
    small({ send: { days: [60, 90], danger: 4 } }),
    large({ send: { n: 10, days: [60, 90], danger: 3 } }),
    { ap: 'study', l: 'Trace the link with seismographs', hint: 'unknown', b: 50, m: ['geologist'], ok: [x => `The link is real, and the seismographs pick up pulses moving along it.`, { f: { insight: 22 } }], bad: [x => `Thumper charges, a week of listening, and nothing but rock.`, { mat: -5 }] },
  ] });
F('natives', 3, { id: 'natives.gathering', tone: 'pressure', lead: ['xenobio', 'security'], title: x => `${T(x)}: The Gathering`,
  text: x => `Smoke from a dozen fires, a day's walk off: ${x.n} are gathering in numbers nobody has seen. ${x.Lead} thinks it is a festival, though it could as easily be a muster.`,
  ask: x => `With ${x.n} gathering in numbers, do you send envoys, wait it out, or set the ground alight upwind?`,
  choices: [
    small({ l: x => 'Send three envoys', send: { days: [15, 30], danger: 3 }, v: 'open' }),
    later(x => `The fires burn for nine nights and go out. For nine nights nobody in the colony sleeps much, and the watch is doubled out of the field crews.`, { food: -40, f: { accord: -5, threat: 4 } }),
    { ap: 'force', l: 'All of them are in one place. Fire the ground upwind', n: 'It will never be this easy again, whatever the fires are for.', v: 'severe closed bold', dark: true, b: 60, m: ['security'],
      ok: [x => `The wind does the work. A dozen fires become one, and it burns through the night. In the morning the ground is black for a day's walk and nothing on it is moving. Nobody will ever know whether it was a festival.`, { morale: -7, stain: ['burned_gathering', 3], f: { harm: 75, threat: -45, accord: -100, kills: 150 } }],
      bad: [x => `The wind turns. The party that lit it comes back at a run with the fire behind them, and what is left of ${x.n} behind the fire.`, { lose: 1.5, morale: -5, stain: ['burned_gathering', 2], f: { accord: -100, threat: 30, harm: 20, kills: 30 } }] },
  ] });
F('humans', 3, { id: 'humans.camp', tone: 'opportunity', lead: ['security', 'teacher'], title: x => `${T(x)}: What They Left Behind`,
  text: x => `${x.N} have abandoned one of their camps in a hurry. It is four days off. There may be tools, records, or the reason they ran.`,
  ask: x => `Do you send a party to pick over the camp ${x.n} abandoned, a larger one to strip it, or ask them by radio what happened?`,
  choices: [
    small({ l: x => 'Send three to pick it over', send: { days: [15, 30], danger: 3 } }),
    large({ l: x => 'Send eight, and strip it', send: { n: 8, days: [15, 30], danger: 2 }, v: 'bold' }),
    { ap: 'accord', l: 'Ask them, by radio, what happened', hint: 'unknown', b: 50, m: ['teacher'], ok: [x => `After a long pause, someone tells you the whole story, and sounds glad to.`, { f: { accord: 15, insight: 10 } }], bad: [x => `They say one thing before they sign off.\n\n[[${them(x)}]] "Stay away from it."`, { f: { threat: 5 } }] },
  ] });

/* ======================= WHERE TWO THINGS MEET =======================
   fr.other picks a second live factor; x.o / x.on / x.oN name it, and fx.o adjusts it. */
const oth = kinds => (s, f) => s.factors.find(o => o.id !== f.id && kinds.includes(o.kind) && o.stage >= 1 && !o.res) || null;
const two = kinds => ({ other: oth(kinds), when: (s, f) => !!oth(kinds)(s, f) });
F('fauna', 3, Object.assign(two(['natives', 'humans']), { id: 'cross.prey', tone: 'opportunity', lead: ['security', 'xenobio'], title: x => `${T(x)}: A Common Enemy`,
  text: x => `${x.N} have been at ${x.on} too, and harder than at us. ${x.oN} ${x.ohave} sent someone to the fence: one figure, alone, pointing first at the hills and then at the colony's rifles.\n\n[[${x.who}]] "That's a request. They want our rifles on their side, and when somebody asks that nicely for the guns, I start counting who's standing behind them."`,
  ask: x => `${x.oN} ${x.ohave} asked for your rifles against ${x.n}: do you hunt alongside ${x.othem}, stay out of it, or join the hunt and then turn on ${x.othem}?`,
  choices: [
    { ap: 'force', l: x => `Hunt alongside ${x.on}`, v: 'open bold', b: 50, m: ['security'], ok: [x => `With their knowledge of the ground and the colony's rifles, it is the most one-sided week ${x.n} have ever had.`, { f: { harm: 35, threat: -20, accord: -10 }, o: { accord: 30, threat: -10 } }], bad: [x => `Nobody can understand anyone else, and in the dark, with everyone armed, it goes badly.`, { lose: 1, o: { accord: 8 } }] },
    { ap: 'avoid', l: 'Stay out of it', v: 'closed cautious', out: [x => `The figure waits at the fence until dark, and goes. What happens in the hills after that happens without you.`, { f: { threat: -5 }, o: { accord: -15, harm: 15 } }] },
    { ap: 'exploit', dark: true, v: 'severe closed', l: x => `Hunt alongside ${x.on}, then turn the rifles on them`, n: 'They will be in the open, tired, and facing the other way.', b: 60, m: ['security'],
      ok: [x => `The hunt goes well for three days. On the fourth morning the watch opens fire on its allies from the ridge above their camp. What ${x.othey} had gathered for the season is carried home on the colony's carts.`, { food: 320, morale: -4, stain: ['betrayal', 3], f: { harm: 25, threat: -10 }, o: { threat: -35, harm: 55, accord: -100, kills: 30 } }],
      bad: [x => `Somebody fires early. ${x.oN} ${x.ohave} fought in those hills for longer than there has been a colony, and it shows.`, { lose: 1.5, stain: ['betrayal', 2], o: { threat: 30, accord: -100 } }] },
  ] }));
F('ruin', 3, Object.assign(two(['fauna', 'flora']), { id: 'cross.shun', tone: 'opportunity', lead: ['xenobio', 'geologist'], title: x => `${T(x)}: The Bare Ring`,
  text: x => `${x.oN} ${x.oare} everywhere now, except in one place. Around ${x.n} there is a ring of ground, four hundred metres wide, where ${x.othey} will not go.\n\n[[${x.who}]] "Something in there keeps ${x.othem} out, something ${x.othey} won't go near, and I want it, whatever it is, I want to know what it is more than I've wanted anything."`,
  ask: x => `Do you find out what keeps ${x.on} out of the ring around ${x.n}, move the stores inside the ring with the lock-up guarding them at night, or leave the ring alone?`,
  choices: [
    { ap: 'study', l: 'Find out what keeps the ring clear', b: 50, m: ['xenobio', 'engineer'], ok: [x => `A tone, below hearing, that the ruin has been sounding for longer than there have been people. The workshop can copy it.`, { f: { insight: 20 }, o: { threat: -25, insight: 20 } }], bad: [x => `Whatever it is, the instruments cannot hear it. The crew come back with headaches.`, { f: { insight: 8 } }] },
    { ap: 'exploit', dark: true, l: 'Move the stores inside the ring, with the lock-up to stand the night shift there', v: 'bold severe', out: [x => `Nothing has touched the stores since. The night shift inside the ring is prisoners now. They have asked to be moved, will not say why, and are not moved.`, { stain: ['expend', 1], f: { threat: 10, accord: -5 }, o: { threat: -18 } }] },
    { ap: 'avoid', l: 'Two problems are enough. Leave the ring alone', out: [x => `The ring stays empty. Everywhere else ${x.on} ${x.oare} still at the wire, and a field hand is dead of it before the season is out.`, { pop: -1 }] },
  ] }));
F('plague', 3, Object.assign(two(['natives', 'humans']), { id: 'cross.shared', tone: 'pressure', lead: ['physician', 'chaplain'], title: x => `${T(x)}: It Crosses Over`,
  text: x => `${x.N} has reached ${x.on}. There are fresh graves beyond the boundary, and ${x.othey} ${x.ohave} no clinic.\n\n[[${x.who}]] "We know next to nothing about it, and they've got less. No surgeon, no notes. They're just burying their dead, and I don't know how to stand here and let them."`,
  ask: x => `Now that ${x.n} ${x.have} reached ${x.on}, do you give ${x.othem} everything you have learned, close the boundary until it burns out, or keep what you know and take their ground afterwards?`,
  choices: [
    { ap: 'accord', l: 'Give them everything we have learned', v: 'mercy open', b: 50, m: ['physician'], ok: [x => `A page, some drawings, and a nurse who volunteers to go. The graves stop multiplying.`, { o: { accord: 40, threat: -15 }, f: { insight: 10 } }], bad: [x => `Not everything that works in a human ward works for them, but they can see you tried.`, { o: { accord: 15 } }] },
    { ap: 'avoid', l: 'Close the boundary until it has burned out', v: 'closed cautious', out: [x => `Nobody crosses, either way. The smoke from their side is visible for a month.`, { f: { threat: -8 }, o: { accord: -20, harm: 20 } }] },
    { ap: 'exploit', dark: true, v: 'severe closed', l: 'Keep the page in the drawer, and take their ground when it is done', n: 'It would do in a season what the watch could not do in ten years.',
      out: [x => `The boundary is closed and the page stays where it is. By the turn of the season their fires are a third of what they were. The survey crews are pacing out fields on the far side before the last of the smoke has cleared.`, { yield: 0.05, morale: -3, stain: ['let_die', 3], f: { threat: -8 }, o: { threat: -40, harm: 60, accord: -60, kills: 80 } }] },
  ] }));
})();
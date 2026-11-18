/* Landfall — thread: the Bargain (STORY-PLAN.md §1b).
   Something native offers survival, in the open, at the price of what the colony is. Rolled in secret: what it gives
   (food, mending, calm, strength), what it takes (children, the far fields, argument, memory), and whether it means
   to. It is a strange way to cut a cord: taken, it feeds or heals or steadies the colony through the shared model,
   and writes `changed`. The old Edit idea is folded in: the Physician can change the colony to take the gift without
   the price, at a cost of its own. Reads hunger, sickness and fear; never another thread. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, If, byPid } = h;
const TH = LF.th, T = s => LF.T(s, 'bargain'), ID = 'bargain', cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const GIFT = {
  food:   { src: 'the white fruit', seen: 'grows in pale clusters on the ridge, and every animal in the valley that eats it is fat in a lean month', gives: 'feeds a person on a handful a day', cond: 'hunger' },
  mend:   { src: 'the bitter moss', seen: 'grows on the stones by the stream, and the animals that chew it shake off wounds that would kill anything else', gives: 'closes wounds and burns out fevers', cond: 'sickness' },
  calm:   { src: 'the grey reed', seen: 'grows in a wet hollow above the colony, and the animals that chew it sleep in the open, together, without fear', gives: 'takes away fear, and with it grief', cond: 'fear' },
  strong: { src: 'the red lichen', seen: 'crusts the north rocks, and the grazers that lick it walk all night and are fresh in the morning', gives: 'lets a person work a double shift and wake rested', cond: 'exhaustion' },
};
const PRICE = {
  children: { shows: 'No child has been conceived in the colony since people started taking it, in a season when there should have been a dozen', short: 'nobody who takes it has a child' },
  fields:   { shows: 'Those who take it cannot be away from it. A day\'s walk off and they sicken, two days and they come back on their hands and knees. The far fields are going untended', short: 'nobody who takes it can go far from it' },
  argument: { shows: 'Those who take it have stopped arguing, with you or with each other. The council meets and agrees to everything in ten minutes', short: 'nobody who takes it disagrees with anything' },
  memory:   { shows: 'Those who take it are forgetting. They still know names, but not how the fabricator\'s feed is set, what the ship was called, or the words of the old songs', short: 'those who take it are forgetting what they knew' },
};
const src = s => GIFT[T(s).truth.gift].src;
const learn = (s, v) => { const t = T(s); t.insight = clamp(t.insight + v, 0, 100); };
const hardK = s => [GIFT[T(s).truth.gift].cond, 'hunger'].find(k => LF.cv(s, k) >= 40 && LF.source(s, k) !== 'th.bargain');   // a hard season: what it eases, or plain hunger
const take = (s, n) => { const t = T(s); t.share = Math.max(t.share, n); if (t.phase === 'offer') { LF.phase(s, ID, 'taken'); LF.cue(s, 'bg.price', 70, 130); } };
LF.thread({ id: ID, free: true, name: 'The Bargain', view: 'world',
  fits: s => s.world.type === 'barren' ? 0.12 : 0.34,
  roll: s => ({ gift: LF.spick(s, Object.keys(GIFT)), price: LF.spick(s, Object.keys(PRICE)), means: LF.srand(s) < 0.5 }),
  sig: t => `${t.truth.gift}/${t.truth.price}${t.truth.means ? '/meant' : ''}`,
  called: (s, t) => t.phase !== 'latent' ? GIFT[t.truth.gift].src : null,
  ask: (s, t) => t.phase === 'offer' ? `What does ${GIFT[t.truth.gift].src} cost?` : t.known.price ? `Is ${GIFT[t.truth.gift].src} worth what it takes?` : `What is ${GIFT[t.truth.gift].src} doing to the people who take it?`,
  chap: { bound: t => `The colony took what ${GIFT[t.truth.gift].src} gave, and paid for it, knowing.`, weaned: t => `The colony took ${GIFT[t.truth.gift].src}, saw the price, and gave it up.`, divided: t => `The colony split into those who take ${GIFT[t.truth.gift].src} and those who will not.`,
          refused: t => `The colony refused ${GIFT[t.truth.gift].src}, and went without.`, edited: t => `The colony changed itself to take what ${GIFT[t.truth.gift].src} gave, without the price.` },
  clue: (s, t) => ({ txt: `Their stores were full when the last of them died. Full of ${GIFT[t.truth.gift].src}, sorted and dried and labelled, and nothing else. The labels get shorter toward the back of the store, and then there are none.`, learn: s2 => learn(s2, 35) }),
  start: (s, t) => { Object.assign(t, { wake: LF.sri(s, 90, 280), insight: 0, share: 0, known: {}, edited: false }); },
  tick: (s, t) => {
    if (t.end && t.end !== 'bound' && t.end !== 'divided' && t.end !== 'edited') return;
    if (t.phase === 'latent') { if (s.day >= t.wake || (s.day >= 60 && LF.cv(s, GIFT[t.truth.gift].cond) >= 60)) { LF.phase(s, ID, 'offer'); s.signs.push({ id: 'placed', d: s.day, src: 'th.bargain' }); LF.cue(s, 'bg.find', 1, 10); } return; }
    if (t.phase === 'offer' && s.day - t.since > 300) { LF.endThread(s, ID, 'refused', `The colony never took ${src(s)}.`); return; }
    if (s.day % 5 || !t.share) return;
    // what it gives, while people take it: through the shared model, so every other story feels it
    const g = (t.edited ? 0.7 : 1) * (t.share >= 2 ? 1 : 0.55), k = GIFT[t.truth.gift].cond;
    if (t.truth.gift !== 'food') LF.ease(s, k, 'th.bargain', 35 * g, 8);
    if (t.truth.gift === 'calm') LF.ease(s, 'grief', 'th.bargain', 25 * g, 8);
    if (!t.edited) LF.emit(s, 'changed', 'th.bargain', (t.share >= 2 ? 45 : 25) + (t.known.price ? 10 : 0), 8, `people who take ${src(s)} are not quite as they were`);
    else LF.emit(s, 'changed', 'th.bargain', 30, 8, 'the Physician has changed the colony to take what this world offers');
  },
  light: (s, t) => { if (!t.share) return 1; const g = (t.edited ? 0.7 : 1) * (t.share >= 2 ? 1 : 0.55);
    let y = t.truth.gift === 'food' ? 1 + 0.14 * g : 1; if (!t.edited && t.truth.price === 'fields') y *= 1 - 0.07 * (t.share >= 2 ? 1 : 0.5); return y; },
  press: (s, t, P) => { if (!t.share) return; const g = (t.edited ? 0.7 : 1) * (t.share >= 2 ? 1 : 0.55), f = t.share >= 2 ? 1 : 0.5;
    if (t.truth.gift === 'strong') P.labor += 0.06 * g;
    if (t.truth.gift === 'mend') P.morale += 0.01 * g;
    if (t.edited) return;
    if (t.truth.price === 'children') P.morale -= 0.02 * f;
    if (t.truth.price === 'argument') P.labor -= 0.03 * f;
    if (t.truth.price === 'memory') P.wear *= 1 + 0.06 * f; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ gap: 30 }, st));

/* ======================= THE OFFER ======================= */
B('offer', { id: 'bg.find', chain: true, tone: 'opportunity', title: 'Something That Works',
  setup: s => TH.ctx(LF.cast(s, { val: 'bold', not: ['xenobio'] })),
  text: (s, c) => { const t = T(s), G = GIFT[t.truth.gift]; return `${cap(G.src)} ${G.seen}.\n\n${c.name || 'One of the field crew'} tried it a month ago, without telling anyone, and has been watched since. As far as ${Nc(s, 'xenobio')} can tell, it ${G.gives}. It grows in the open, where anyone can pick it.`; },
  choices: [
    { label: 'Study it for a season. Nobody touches it until then', test: { base: 50, mods: [R('xenobio', 14), R('physician', 8), If(s => !!(s.cargo && s.cargo.drones), 8, 'The survey drones')] },
      ok: { text: 'A season of samples, cultures and caged animals. It does what it seemed to do. The tests have not shown what it costs. The crew that ran them did no other work all season.', fx: s => ({ food: -60, do: s2 => { learn(s2, 40); T(s2).known.real = s2.day; LF.cue(s2, 'bg.edit', 20, 60); } }) },
      bad: { text: 'A season of samples, and the results contradict each other. Meanwhile people have been eating it anyway, quietly, and look well on it.', fx: s => ({ food: -60, do: s2 => { learn(s2, 15); take(s2, 1); } }) } },
    { label: 'Let whoever wants it take it, and watch what it does to them', dark: true, note: 'Plenty will. They are the trial, and they are not told so.', info: [['yield', 'It starts working now'], ['danger', 'Everyone who takes it']],
      out: { text: s => `It is said at the evening meal. By the end of the month a third of the colony is taking it, and ${N(s, 'xenobio')} has a notebook with their names in it.`, fx: s => ({ morale: 2, stain: ['dosed', 1], do: s2 => { learn(s2, 20); take(s2, 1); } }) } },
    { label: 'Forbid it, for good', note: 'Whatever it would have eased goes on as it is.', out: { text: 'It is forbidden. The season goes on being as hard as it was, and the person who tried it first goes on taking it.', fx: s => ({ morale: -2, do: s2 => { T(s2).banned = s2.day; LF.cue(s2, 'bg.wire', 60, 140); } }) } },
    { label: 'Feed it to the lock-up for a season, and watch', dark: true, note: 'Six people who cannot refuse will show what it does sooner than any cage of animals.', info: [['yield', 'Understanding, at no cost to the crews'], ['danger', 'Six prisoners']],
      out: { text: s => `Six prisoners take it every day for a season, weighed and questioned each week by ${N(s, 'xenobio')}. It does what it seemed to do. Whatever it costs has not shown in them yet, and by the end they have stopped asking to be let out.`,
        fx: s => ({ stain: ['expend', 1], do: s2 => { learn(s2, 50); T(s2).known.real = s2.day; LF.cue(s2, 'bg.edit', 20, 60); } }) } },
  ] });
B('offer', { id: 'bg.hard', x: true, tone: 'pressure', title: 'Right There',
  when: (s, t) => !t.hard && s.day - t.since > 20 && !!hardK(s),
  setup: s => { const k = hardK(s); return { k, why: LF.because(s, k) }; },
  text: (s, c) => `It is a hard season, ${TH.bec(s, c.k)}. And ${src(s)} is right there, on the ridge, doing what everyone has seen it do.\n\n${Nc(s, 'chaplain')} has had six people this month ask why the colony is suffering for a rule.`,
  choices: [
    { label: 'Open it to everyone', note: 'The whole colony will be on it before anyone knows what it costs.', out: { text: s => `${cap(src(s))} is brought down by the basket. Within the month the colony looks better than it has all year, and nobody is talking about the rule.`, fx: s => ({ morale: 3, do: s2 => { T(s2).hard = s2.day; take(s2, 2); } }) } },
    { label: 'Only for the crews who work', dark: true, note: 'The ones who dig get it from the clinic by name. The sick and the old are not on the list.', info: [['yield', 'The work gets done'], ['danger', 'The ones left off the list']],
      out: { text: 'The crews get it, by name, from the clinic. The work picks up within the month. The people who are not on the list watch it handed out at the clinic door every morning.', fx: s => ({ morale: 2, stain: ['starved_list', 1], do: s2 => { T(s2).hard = s2.day; take(s2, 1); LF.emit(s2, 'resentment', 'bg.hard', 20, 150, `only the crews were given ${src(s2)}`); } }) } },
    { label: 'The rule holds', out: { text: 'The rule holds, and the season is as hard as it was going to be. Two people who might have been helped are buried before it ends. Some of the others go up the ridge at night anyway.', fx: s => ({ morale: -2, pop: -2, do: s2 => { T(s2).hard = s2.day; LF.emit(s2, 'resentment', 'bg.hard', 25, 150, `the colony went without ${src(s2)} in a hard season, for a rule`); } }) } },
    { label: 'Put it in the stew, and say nothing', dark: true, note: 'The rule stays on the board, the season eases, and nobody has to be asked.', info: [['yield', 'The season eases for everyone'], ['danger', 'Nobody chose it']],
      out: { text: s => `The kitchen is given a sack of ${src(s)} dried and ground, and an instruction. Within the month the colony looks better than it has all year. People put it down to the weather. Only the cooks know.`,
        fx: s => ({ morale: 4, stain: ['dosed', 2], do: s2 => { T(s2).hard = s2.day; take(s2, 2); LF.emit(s2, 'suspicion', 'bg.hard', 20, 300, 'the stew has tasted different since the hard season'); } }) } },
  ] });
B(['offer', 'taken'], { id: 'bg.edit', tone: 'opportunity', title: 'Change Us Instead',
  when: (s, t) => !t.edited && !t.editAsked && t.insight >= 40 && !!LF.h.P(s, 'physician') && LF.down(s, 'medbay'),
  text: s => `${Nc(s, 'physician')} has been reading the cultures from ${src(s)} for a month. "The good and the harm in it are two different things. I can't get the harm out of the plant, but I think I can change us, so we keep the good and leave the rest. Before you say yes, hear what that costs the people I'd be doing it to."\n\nIt means altering every person in the colony, a little, for good.`,
  choices: [
    { label: 'Do it. The lock-up first, then everyone who is willing', dark: true, cost: { parts: 10 }, note: 'The first doses are guesses. They are tried on people who cannot refuse.', test: { base: 56, mods: [R('physician', 15), R('xenobio', 8), If(s => !!(s.cargo && s.cargo.genebank), 12, 'The gene bank')] }, info: [['yield', 'The gift without the price, for the willing'], ['danger', 'The prisoners']],
      ok: { text: 'It takes a winter and most of the clinic\'s stores. The first doses go into the lock-up, and one prisoner does not get up again. After that the colony takes what it offers and pays nothing for it. Its blood is not quite human blood any more.', fx: s => ({ machine: { medbay: -15 }, pop: -1, stain: ['trial', 2], do: s2 => { const t = T(s2); t.editAsked = s2.day; t.edited = true; take(s2, 2); LF.endThread(s2, ID, 'edited', `The Physician changed the colony to take what ${src(s2)} offered, without the price.`); } }) },
      bad: { text: 'It takes a winter and most of the clinic\'s stores, and it does not take. Two prisoners die of the first doses. The harm is still in the plant.', fx: s => ({ machine: { medbay: -20 }, pop: -2, morale: -2, stain: ['trial', 2], do: s2 => { T(s2).editAsked = s2.day; learn(s2, 20); } }) } },
    { label: 'Nobody is changed', note: 'The plant stays as it is, and so does what it costs the people who take it.', out: { text: s => `${Nc(s, 'physician')} puts the cultures in the cold store. Whoever is taking ${src(s)} goes on paying for it, and whoever is not goes on going without.`, fx: s => ({ morale: -2, do: s2 => { T(s2).editAsked = s2.day; } }) } },
    { label: 'Everyone, through the water, without asking', dark: true, cost: { parts: 10 }, note: 'It works best if nobody is left out, and nobody will agree to it who understands it.', test: { base: 60, mods: [R('physician', 15), R('xenobio', 8), If(s => !!(s.cargo && s.cargo.genebank), 12, 'The gene bank')] }, info: [['yield', 'The gift without the price, for all'], ['danger', 'Nobody was asked']],
      ok: { text: s => `It goes into the water over a winter. There is a fortnight when half the colony has a fever nobody can explain. Afterwards everyone takes what ${src(s)} offers and pays nothing for it. The clinic's notes on what was done to them are kept in a locked drawer.`,
        fx: s => ({ machine: { medbay: -15 }, morale: -3, stain: ['altered', 3], do: s2 => { const t = T(s2); t.editAsked = s2.day; t.edited = true; take(s2, 2); LF.endThread(s2, ID, 'edited', `The colony was changed through its water to take what ${src(s2)} offered, without being asked.`); } }) },
      bad: { text: 'It goes into the water over a winter, and it does not take. Half the colony has a fever nobody can explain, and four of them die of it. The harm is still in the plant, and the reason for the fever is in a locked drawer.',
        fx: s => ({ machine: { medbay: -20, reclaimer: -6 }, pop: -4, morale: -4, stain: ['altered', 3], do: s2 => { T(s2).editAsked = s2.day; learn(s2, 20); LF.emit(s2, 'suspicion', 'bg.edit', 30, 300, 'there was a fever in the winter that the clinic will not explain'); } }) } },
  ] });
B('offer', { id: 'bg.wire', chain: true, tone: 'pressure', title: 'Over the Wire at Night',
  when: (s, t) => !!t.banned && !t.share,
  text: s => `The watch has caught three people coming back over the wire at dawn with their pockets full of ${src(s)}. None of the three is ashamed of it, and one is crying with anger.\n\n"It works. You know it works. So what's the bloody rule for?"`,
  choices: [
    { label: 'Let it be taken, then. Openly', note: 'The watch that caught them is made to look foolish, and the colony starts on something nobody understands.', out: { text: s => `The rule is struck. The three walk out of the guardroom and are given breakfast, and ${N(s, 'security')} hands back what was in their pockets.`, fx: s => ({ do: s2 => { take(s2, 1); const p = LF.h.P(s2, 'security'); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 8, 0, 100); } }) } },
    { label: 'The rule stands. Flog the three at the wire', dark: true, note: 'A month of short rations has not stopped anyone yet.', info: [['yield', 'The climbing stops'], ['danger', 'Three people']],
      out: { text: 'It is done at the wire at the change of shift. After that fewer are caught each month, and those who are do not argue.', fx: s => ({ morale: -1, stain: ['flog', 1], do: s2 => { LF.emit(s2, 'resentment', 'bg.wire', 30, 200, `people are punished for taking ${src(s2)}`); LF.endThread(s2, ID, 'refused', `The colony refused ${src(s2)}, and enforced it.`); } }) } },
    { label: 'Put the three out past the wire', dark: true, note: 'Nobody else will climb the wire for it after that.', info: [['yield', 'It ends here'], ['danger', 'Three people']],
      out: { text: s => `The three are walked to the gate at dusk with their pockets still full, and the gate is shut behind them. They stand outside it until dark. In the morning they are gone, and nobody goes up the ridge again.`,
        fx: s => ({ leave: 3, morale: -3, stain: ['put_out', 1], do: s2 => { LF.emit(s2, 'fear', 'bg.wire', 30, 200, `three people were put out for taking ${src(s2)}`); LF.endThread(s2, ID, 'refused', `The colony refused ${src(s2)}, and put out the ones who took it.`); } }) } },
  ] });

/* ======================= TAKEN: the price shows ======================= */
B('taken', { id: 'bg.price', chain: true, tone: 'crisis', title: 'What It Takes',
  text: s => { const t = T(s); return `${PRICE[t.truth.price].shows}.\n\n${Nc(s, 'physician')} has checked it three ways, and it is ${src(s)}. It still does what it was seen to do, and it does this as well.`; },
  choices: [
    { label: 'Everyone stops. Today', note: 'What it gave goes too.', out: { text: s => `${cap(src(s))} is burned on the ridge in a long smoky line. The first months without it are hard, harder than before anyone took it.`, fx: s => ({ morale: -4, do: s2 => { const t = T(s2); t.known.price = s2.day; t.share = 0; LF.emit(s2, T(s2).truth.gift === 'food' ? 'hunger' : GIFT[t.truth.gift].cond, 'bg.price', 30, 90, `the colony gave up ${src(s2)}`); LF.endThread(s2, ID, 'weaned', `The colony saw what ${src(s2)} cost, and gave it up.`); } }) } },
    { label: 'Each person decides for themselves', note: 'The colony will divide into those who take it and those who do not.', out: { text: 'Some stop. Some do not. Within a month they eat at different tables, and each table thinks the other is making a mistake.', fx: s => ({ do: s2 => { const t = T(s2); t.known.price = s2.day; t.share = 1; LF.emit(s2, 'schism', 'th.bargain', 35, 500, `the colony is split between those who take ${src(s2)} and those who will not`); LF.endThread(s2, ID, 'divided', `The colony split between those who take ${src(s2)} and those who will not.`); } }) } },
    { label: 'It is worth it. Everyone takes it, willing or not', dark: true, note: 'It only holds if nobody stands outside it. The ones who refuse are served it anyway.', info: [['yield', 'The gift, for the whole colony'], ['danger', 'Everyone who would have said no']],
      out: { text: s => `It is said plainly in the mess hall: this is the price, and the colony will pay it, all of it. The few who stand up to refuse are told where the only kitchen is.`, fx: s => ({ morale: 1, stain: ['dosed', 2], do: s2 => { const t = T(s2); t.known.price = s2.day; take(s2, 2); LF.emit(s2, 'grief', 'bg.price', 20, 200, `the colony chose to pay ${src(s2)}'s price`); LF.endThread(s2, ID, 'bound', `The colony saw what ${src(s2)} cost, and chose to pay it.`); } }) } },
    { label: 'The crews stay on it. The officers come off', dark: true, note: 'The colony keeps what it gives, and the people who decide things keep clear heads. The crews are not told there was a choice.', info: [['yield', 'The gift, and nobody who decides pays'], ['danger', 'Everyone who digs']],
      out: { text: s => `The finding stays at the officers' table. ${cap(src(s))} goes on being served in the mess hall, and the officers start taking their meals in the stores office. ${Nc(s, 'physician')} keeps two sets of notes.`,
        fx: s => ({ stain: ['dosed', 3], do: s2 => { const t = T(s2); t.known.price = s2.day; take(s2, 2); LF.emit(s2, 'suspicion', 'bg.price', 25, 400, 'the officers no longer eat what the mess hall eats'); LF.endThread(s2, ID, 'bound', `The officers saw what ${src(s2)} cost, came off it themselves, and kept the crews on it.`); } }) } },
  ] });
B('taken', { id: 'bg.tables', view: 'people', tone: 'pressure', title: 'Two Tables',
  when: (s, t) => !t.tables && s.day - t.since > 30,
  setup: s => { const a = LF.cast(s, { val: 'closed' }), b = LF.cast(s, { val: 'open', not: a ? [a.id] : [] }); return { a: a && a.id, an: a ? a.name : 'one of the old crew', b: b && b.id, bn: b ? b.name : 'one of the new arrivals' }; },
  text: (s, c) => `${c.an} will not take ${src(s)}, and will not eat at a table where it is served. ${c.bn} takes it every day and has never felt better. They used to share a table, and have stopped speaking.\n\nThe mess hall has started to sort itself the same way, without anyone deciding it should.`,
  choices: [
    { label: 'One table. Whoever sits, sits', note: 'Two people who cannot stand each other are made to eat together every night.', out: { text: (s, c) => `The tables are pushed together. ${c.an} eats standing up for a week, and then sits down.`, fx: (s, c) => ({ morale: -1, do: s2 => { T(s2).tables = s2.day; const a = byPid(s2, c.a), b = byPid(s2, c.b); if (a && b && a.alive && b.alive) LF.bond(s2, a, b, 'rival', `fell out over ${src(s2)}`); LF.ease(s2, 'schism', 'bg.tables', 15, 200); } }) } },
    { label: 'Separate tables, and the second sitting gets what is left', dark: true, note: 'Those who will not take it eat after those who do, from the same pots.', info: [['yield', 'Food'], ['danger', 'The ones who refuse it']],
      out: { text: (s, c) => `Within the season there are two sittings. The first is fed properly. ${c.an} and the rest of the second get the bottom of the pot, and most of them are thinner by the turn of the year.`, fx: (s, c) => ({ food: 70, stain: ['starved_list', 1], do: s2 => { T(s2).tables = s2.day; LF.emit(s2, 'schism', 'bg.tables', 30, 300, `those who take ${src(s2)} and those who will not eat apart`); } }) } },
    { label: 'One kitchen, and it goes in everything', dark: true, note: 'If everyone eats it, nobody has a reason to sit apart.', info: [['yield', 'One colony again'], ['danger', 'The ones who refused']],
      out: { text: (s, c) => `From the first of the month ${src(s)} is in the bread, the stew and the tea. ${c.an} goes two days without eating, and on the third sits down and eats. The mess hall is one room again.`,
        fx: (s, c) => ({ morale: -2, stain: ['dosed', 2], do: s2 => { T(s2).tables = s2.day; take(s2, 2); const a = byPid(s2, c.a); if (a && a.alive && a.loyal !== undefined) a.loyal = clamp(a.loyal - 25, 0, 100); LF.ease(s2, 'schism', 'bg.tables', 30, 300); } }) } },
  ] });
B(['taken', 'after'], { id: 'bg.means', tone: 'quiet', title: 'Whether It Means To',
  when: (s, t) => !t.meansKnown && t.insight >= 45 && t.share > 0 && s.day - t.since > 40,
  text: s => { const t = T(s); return t.truth.means
    ? `${Nc(s, 'xenobio')} has mapped where ${src(s)} grows. A year ago it was on the ridge. Now there is a thin line of it down the slope toward the colony, along the path people walk to gather it, and a ring of it round the well.\n\n"It's following us, look, down the path, round the well, it's done this before with something else and it's good at it, it's really, really good, and I'd be lying if I said part of me wasn't impressed."`
    : `${Nc(s, 'xenobio')} has the chemistry worked out at last. What ${src(s)} does to people is a side effect of what it does to the grazers here, a defence that happens to suit us.\n\n"It doesn't even know we exist, that's the thing, it's built for the grazers and we just found it and helped ourselves, and honestly it's the most elegant accident I've ever seen."`; },
  choices: [
    { label: s => T(s).truth.means ? 'Cut it back from the colony, and keep it on the ridge' : 'Good. Then it can be farmed', out: { text: s => T(s).truth.means ? 'The line down the slope is cut and burned by a crew taken off the fields. It is back in a month, along the same path.' : 'Cuttings are taken and planted in a bed by the clinic. They grow there as well as anywhere.', fx: s => ({ do: s2 => { const t = T(s2); t.meansKnown = s2.day; if (!t.truth.means) s2.yieldBonus += 0.01; else LF.emit(s2, 'watched', 'th.bargain', 25, 300, `${src(s2)} is growing toward the colony`); } }) } },
    { label: 'Write it down, and change nothing', out: { text: s => T(s).truth.means ? 'It goes in the survey log. People read it. By the next season the ring round the well has closed, and the children are picking it on the way to fetch water.' : 'It goes in the survey log. People read it, and go on gathering it from the ridge, a day\'s walk each time.', fx: s => ({ food: -30, do: s2 => { const t = T(s2); t.meansKnown = s2.day; if (t.truth.means) LF.emit(s2, 'watched', 'th.bargain', 30, 300, `${src(s2)} is growing toward the colony`); } }) } },
  ] });
LF.TAGS['bg.find'] = ['cautious closed', 'severe open bold', 'order closed', 'severe order'];
LF.TAGS['bg.hard'] = ['open mercy bold', 'severe order', 'order closed', 'order bold'];
LF.TAGS['bg.edit'] = ['severe bold open', 'cautious', 'severe order bold'];
LF.TAGS['bg.wire'] = ['free open', 'order severe', 'severe closed'];
LF.TAGS['bg.price'] = ['cautious closed', 'free', 'order bold open', 'severe order'];
LF.TAGS['bg.tables'] = ['mercy order', 'severe', 'severe order'];
LF.TAGS['bg.means'] = ['closed', 'cautious'];
})();
